import { gunzipSync, inflateSync } from "bun";
import plist from "plist";
// @ts-expect-error - no types
import bzip2 from "bzip2";
// Constants
const SECTOR_SIZE = 512;
const MAX_CONCURRENT_REQUESTS = 16;
const PREFETCH_WINDOW_CHUNKS = 1024;
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB for stored files
const MAX_FILE_SIZE = 800 * 1024 * 1024;

const debug = true;

// Semaphore implementation
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

const requestSemaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);

// Fetch a byte range from URL
async function fetchRangeBuffer(
  url: string,
  start: number,
  end: number,
  signal?: AbortSignal,
  acceptGzip = false
): Promise<Uint8Array> {
  await requestSemaphore.acquire();
  try {
    const headers: HeadersInit = {
      Range: `bytes=${start}-${end}`,
      "Accept-Encoding": acceptGzip ? "gzip" : "identity",
    };

    const response = await fetch(url, {
      headers,
      signal,
    });

    if (response.status !== 200 && response.status !== 206) {
      throw new Error(`Range fetch failed: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } finally {
    requestSemaphore.release();
  }
}

// Decompress chunk based on type
async function decompressChunk(
  compBuf: Uint8Array,
  entryType: number
): Promise<Uint8Array> {
  switch (entryType) {
    case 0x00000001: // Stored (no compression)
      return compBuf;
    case 0x80000005: // UDZO (zlib/deflate)
      try {
        // Try raw deflate first
        return inflateSync(compBuf as ArrayBuffer | Uint8Array<ArrayBuffer>);
      } catch {
        // Try with zlib wrapper (skip first 2 bytes)
        try {
          return inflateSync(compBuf.slice(2));
        } catch (e) {
          throw new Error(`Deflate decompression failed: ${e}`);
        }
      }
    case 0x80000006: {
      // UDBZ (bzip2) - Make non-blocking to prevent event loop hangs
      return new Promise((resolve, reject) => {
        setImmediate(() => {
          try {
            const bits = bzip2.array(compBuf);
            const result = bzip2.simple(bits);
            resolve(result);
          } catch (error) {
            reject(new Error(`Bzip2 decompression failed: ${error}`));
          }
        });
      });
    }
    case 0x80000007: {
      // LZFSE - try using macOS 'lzfse' CLI via Bun.spawnSync
      try {
        const proc = Bun.spawnSync({
          cmd: ["lzfse", "-decode"],
          stdin: compBuf,
        });
        if (proc.exitCode === 0) {
          return proc.stdout;
        }
        throw new Error(
          `lzfse exited with code ${proc.exitCode}: ${new TextDecoder().decode(
            proc.stderr
          )}`
        );
      } catch (e) {
        throw new Error(
          `LZFSE not supported (install 'lzfse' CLI) or failed to decode: ${e}`
        );
      }
    }
    case 0x80000008: {
      // LZMA - try using 'xz' CLI via Bun.spawnSync (more versatile than lzma)
      try {
        const proc = Bun.spawnSync({
          cmd: ["xz", "-d", "-c"],
          stdin: compBuf,
        });
        if (proc.exitCode === 0 && proc.stdout && proc.stdout.length > 0) {
          return proc.stdout;
        }
        const stderrMsg = proc.stderr
          ? new TextDecoder().decode(proc.stderr)
          : "No stderr output";
        throw new Error(`xz exited with code ${proc.exitCode}: ${stderrMsg}`);
      } catch (e) {
        throw new Error(
          `LZMA not supported (install 'xz' CLI) or failed to decode: ${e}`
        );
      }
    }
    default:
      throw new Error(`Unknown compression type: 0x${entryType.toString(16)}`);
  }
}

// Pattern searcher that handles chunk boundaries
class PatternSearcher {
  private pattern: Uint8Array;
  private tail: Uint8Array;
  private decompressedOffset: number = 0;

  constructor(pattern: Uint8Array) {
    this.pattern = pattern;
    this.tail = new Uint8Array(0);
  }

  private updateTail(buf: Uint8Array): void {
    const L = this.pattern.length;
    const keep = L - 1;
    if (keep <= 0) return;

    if (buf.length >= keep) {
      this.tail = buf.slice(buf.length - keep);
      return;
    }

    const needFromTail = keep - buf.length;
    if (needFromTail <= 0) {
      this.tail = buf;
    } else {
      const start = Math.max(0, this.tail.length - needFromTail);
      const newTail = new Uint8Array(this.tail.length - start + buf.length);
      newTail.set(this.tail.slice(start));
      newTail.set(buf, this.tail.length - start);
      this.tail = newTail;
    }
  }

  feed(buf: Uint8Array): { found: boolean; position: number } {
    const L = this.pattern.length;
    if (L === 0) {
      return { found: true, position: this.decompressedOffset };
    }

    // Check for pattern in current buffer
    const idx = indexOf(buf, this.pattern);
    if (idx !== -1) {
      return { found: true, position: this.decompressedOffset + idx };
    }

    // Check for pattern spanning tail and current buffer
    const maxK = Math.min(this.tail.length, L - 1);

    for (let k = maxK; k > 0; k--) {
      const tailSuffix = this.tail.slice(this.tail.length - k);
      if (arraysEqual(tailSuffix, this.pattern.slice(0, k))) {
        const need = L - k;
        if (
          buf.length >= need &&
          arraysEqual(buf.slice(0, need), this.pattern.slice(k))
        ) {
          return { found: true, position: this.decompressedOffset - k };
        }
      }
    }

    this.updateTail(buf);
    this.decompressedOffset += buf.length;
    return { found: false, position: 0 };
  }

  reset(): void {
    this.tail = new Uint8Array(0);
    this.decompressedOffset = 0;
  }
}

// ZIP Entry interface
interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  localHeaderOffset: number;
  isDirectory: boolean;
}

// Search result interface
interface SearchResult {
  found: boolean;
  position?: number;
  file?: string;
}

// DMG types
interface DmgChunk {
  idx: number;
  entryType: number;
  comment: number;
  sectorNumber: bigint;
  sectorCount: bigint;
  compressedOffset: bigint;
  compressedLength: bigint;
  absStart: number;
  absEnd: number;
  runID: number;
  sliceStartInRun: number;
}

interface DmgRun {
  id: number;
  start: number;
  end: number;
  chunks: DmgChunk[];
  buffer?: Uint8Array;
  fetchPromise?: Promise<Uint8Array | null>;
}

// Helper functions
function indexOf(haystack: Uint8Array, needle: Uint8Array): number {
  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return -1;

  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function safeByte(buffer: Uint8Array, offset: number): number {
  if (offset < 0 || offset >= buffer.length) {
    throw new Error("Offset out of bounds");
  }
  // Non-null assertion for environments with noUncheckedIndexedAccess
  return buffer[offset]!;
}

function readUint16LE(buffer: Uint8Array, offset: number): number {
  return safeByte(buffer, offset) | (safeByte(buffer, offset + 1) << 8);
}

function readUint32LE(buffer: Uint8Array, offset: number): number {
  return (
    (safeByte(buffer, offset) |
      (safeByte(buffer, offset + 1) << 8) |
      (safeByte(buffer, offset + 2) << 16) |
      (safeByte(buffer, offset + 3) << 24)) >>>
    0
  );
}

function readUint64LE(buffer: Uint8Array, offset: number): bigint {
  const low = readUint32LE(buffer, offset);
  const high = readUint32LE(buffer, offset + 4);
  return BigInt(low) + (BigInt(high) << 32n);
}

function readUint32BE(buffer: Uint8Array, offset: number): number {
  // Ensure unsigned 32-bit value (avoid negative numbers due to sign bit)
  return (
    ((safeByte(buffer, offset) << 24) |
      (safeByte(buffer, offset + 1) << 16) |
      (safeByte(buffer, offset + 2) << 8) |
      safeByte(buffer, offset + 3)) >>>
    0
  );
}

function readUint64BE(buffer: Uint8Array, offset: number): bigint {
  const high = readUint32BE(buffer, offset);
  const low = readUint32BE(buffer, offset + 4);
  return (BigInt(high) << 32n) + BigInt(low);
}

// Find pattern in ZIP file
async function findPatternInZip(
  url: string,
  pattern: Uint8Array,
  options: {
    useGetCheck: boolean;
  }
): Promise<SearchResult> {
  const controller = new AbortController();

  if (debug) {
    console.log("Getting file size...");
  }

  // Get file size
  const headResp = await fetch(url, {
    method: options.useGetCheck ? "GET" : "HEAD",
    headers: {
      "Accept-Encoding": "identity",
      ...(options.useGetCheck ? { "Range": "bytes=0-0" } : {}),
    }
  });

  if (!headResp.ok) {
    throw new Error(`HEAD failed: ${headResp.status}`);
  }

  const contentLength = headResp.headers.get("content-length");
  if (!contentLength) {
    throw new Error("No content-length header");
  }

  const fileSize = BigInt(contentLength);

  if (debug) {
    console.log(`File size: ${fileSize} bytes`);
  }

  // Find EOCD
  if (debug) {
    console.log("Looking for EOCD...");
  }

  const eocdSearchSize = BigInt(Math.min(65557, Number(fileSize)));
  const eocdBuf = await fetchRangeBuffer(
    url,
    Number(fileSize - eocdSearchSize),
    Number(fileSize - 1n),
    controller.signal,
    false
  );

  // Look for EOCD signature
  const eocdSig = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
  let eocdOffset = -1;
  let eocdAbsoluteOffset = 0n;

  for (let i = eocdBuf.length - 22; i >= 0; i--) {
    if (
      eocdBuf[i] === eocdSig[0] &&
      eocdBuf[i + 1] === eocdSig[1] &&
      eocdBuf[i + 2] === eocdSig[2] &&
      eocdBuf[i + 3] === eocdSig[3]
    ) {
      eocdOffset = i;
      eocdAbsoluteOffset = fileSize - eocdSearchSize + BigInt(i);
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Not a valid ZIP file");
  }

  if (debug) {
    console.log(`Found EOCD at offset ${eocdAbsoluteOffset}`);
  }

  // Parse EOCD
  const eocd = eocdBuf.slice(eocdOffset);
  let cdSize = BigInt(readUint32LE(eocd, 12));
  let cdOffset = BigInt(readUint32LE(eocd, 16));

  // Check for ZIP64
  if (cdOffset === 0xffffffffn || cdSize === 0xffffffffn) {
    if (debug) {
      console.log("ZIP64 detected");
    }

    const zip64LocSig = new Uint8Array([0x50, 0x4b, 0x06, 0x07]);
    const locOffset = eocdOffset - 20;
    if (
      locOffset >= 0 &&
      arraysEqual(eocdBuf.slice(locOffset, locOffset + 4), zip64LocSig)
    ) {
      const zip64EocdOffset = readUint64LE(eocdBuf, locOffset + 8);
      const zip64Eocd = await fetchRangeBuffer(
        url,
        Number(zip64EocdOffset),
        Number(zip64EocdOffset) + 55,
        controller.signal,
        false
      );
      cdSize = readUint64LE(zip64Eocd, 40);
      cdOffset = readUint64LE(zip64Eocd, 48);
    }
  }

  // Fetch central directory
  if (debug) {
    console.log("Fetching central directory...");
  }

  const cdBuf = await fetchRangeBuffer(
    url,
    Number(cdOffset),
    Number(cdOffset + cdSize - 1n),
    controller.signal,
    false
  );

  // Parse central directory entries
  const entries: ZipEntry[] = [];
  let cdPos = 0;
  const cdSig = new Uint8Array([0x50, 0x4b, 0x01, 0x02]);

  while (cdPos < cdBuf.length - 46) {
    if (!arraysEqual(cdBuf.slice(cdPos, cdPos + 4), cdSig)) {
      break;
    }

    const compressionMethod = readUint16LE(cdBuf, cdPos + 10);
    let compressedSize = BigInt(readUint32LE(cdBuf, cdPos + 20));
    let uncompressedSize = BigInt(readUint32LE(cdBuf, cdPos + 24));
    const nameLen = readUint16LE(cdBuf, cdPos + 28);
    const extraLen = readUint16LE(cdBuf, cdPos + 30);
    const commentLen = readUint16LE(cdBuf, cdPos + 32);
    let localHeaderOffset = BigInt(readUint32LE(cdBuf, cdPos + 42));

    if (cdPos + 46 + nameLen > cdBuf.length) {
      break;
    }

    const name = new TextDecoder().decode(
      cdBuf.slice(cdPos + 46, cdPos + 46 + nameLen)
    );

    // Handle ZIP64
    if (
      compressedSize === 0xffffffffn ||
      uncompressedSize === 0xffffffffn ||
      localHeaderOffset === 0xffffffffn
    ) {
      if (extraLen > 0 && cdPos + 46 + nameLen + extraLen <= cdBuf.length) {
        const extraField = cdBuf.slice(
          cdPos + 46 + nameLen,
          cdPos + 46 + nameLen + extraLen
        );
        let extraPos = 0;

        while (extraPos < extraField.length - 4) {
          const headerId = readUint16LE(extraField, extraPos);
          const dataSize = readUint16LE(extraField, extraPos + 2);

          if (
            headerId === 0x0001 &&
            extraPos + 4 + dataSize <= extraField.length
          ) {
            let zip64Pos = extraPos + 4;
            if (
              uncompressedSize === 0xffffffffn &&
              zip64Pos + 8 <= extraField.length
            ) {
              uncompressedSize = readUint64LE(extraField, zip64Pos);
              zip64Pos += 8;
            }
            if (
              compressedSize === 0xffffffffn &&
              zip64Pos + 8 <= extraField.length
            ) {
              compressedSize = readUint64LE(extraField, zip64Pos);
              zip64Pos += 8;
            }
            if (
              localHeaderOffset === 0xffffffffn &&
              zip64Pos + 8 <= extraField.length
            ) {
              localHeaderOffset = readUint64LE(extraField, zip64Pos);
            }
            break;
          }
          extraPos += 4 + dataSize;
        }
      }
    }

    entries.push({
      name,
      compressedSize: Number(compressedSize),
      uncompressedSize: Number(uncompressedSize),
      compressionMethod,
      localHeaderOffset: Number(localHeaderOffset),
      isDirectory: name.endsWith("/"),
    });

    cdPos += 46 + nameLen + extraLen + commentLen;
  }

  if (debug) {
    console.log(`Found ${entries.length} entries in ZIP`);
  }

  // Filter entries - prioritize Electron Framework
  const filteredEntries = entries.filter(
    (e) =>
      !e.isDirectory &&
      e.uncompressedSize > 0 &&
      e.uncompressedSize < MAX_FILE_SIZE &&
      (e.compressionMethod === 0 || e.compressionMethod === 8) &&
      e.name.endsWith("/Electron Framework")
  );

  if (debug) {
    console.log(`Searching through ${filteredEntries.length} files...`);
  }

  // Search through files
  for (const entry of filteredEntries) {
    if (controller.signal.aborted) break;

    // Read local file header
    const localHeader = await fetchRangeBuffer(
      url,
      entry.localHeaderOffset,
      Math.min(entry.localHeaderOffset + 29, Number(fileSize) - 1),
      controller.signal,
      false
    );

    if (localHeader.length < 30) continue;

    const nameLen = readUint16LE(localHeader, 26);
    const extraLen = readUint16LE(localHeader, 28);
    const dataOffset = entry.localHeaderOffset + 30 + nameLen + extraLen;

    if (dataOffset + entry.compressedSize > Number(fileSize)) continue;

    const searcher = new PatternSearcher(pattern);

    if (entry.compressionMethod === 0) {
      // Stored - search in chunks
      let offset = 0;
      while (offset < entry.uncompressedSize) {
        if (controller.signal.aborted) break;

        const chunkSize = Math.min(CHUNK_SIZE, entry.uncompressedSize - offset);
        const chunk = await fetchRangeBuffer(
          url,
          dataOffset + offset,
          dataOffset + offset + chunkSize - 1,
          controller.signal,
          false
        );

        const result = searcher.feed(chunk);
        if (result.found) {
          controller.abort();
          if (debug) {
            console.log(
              `Found pattern in ${entry.name} at position ${result.position}`
            );
          }
          return {
            found: true,
            position: result.position,
            file: entry.name,
          };
        }
        offset += chunkSize;
      }
    } else if (entry.compressionMethod === 8) {
      // Deflated
      const compressedData = await fetchRangeBuffer(
        url,
        dataOffset,
        dataOffset + entry.compressedSize - 1,
        controller.signal,
        false
      );

      try {
        const decompressed = inflateSync(
          compressedData as Uint8Array<ArrayBuffer>
        );
        const result = searcher.feed(decompressed);
        if (result.found) {
          controller.abort();
          if (debug) {
            console.log(
              `Found pattern in ${entry.name} at position ${result.position}`
            );
          }
          return {
            found: true,
            position: result.position,
            file: entry.name,
          };
        }
      } catch (e) {
        console.error(`Failed to decompress ${entry.name}: ${e}`);
      }
    }
  }

  return { found: false };
}

// Find pattern in DMG file
async function findPatternInDmg(
  url: string,
  pattern: Uint8Array,
  options: {
    useGetCheck: boolean;
  }
): Promise<SearchResult> {
  const controller = new AbortController();

  if (debug) {
    console.log("Checking DMG file...");
  }

  // Check if file is GCS gzipped
  const headResp = await fetch(url, {
    method: options.useGetCheck ? "GET" : "HEAD",
    headers: {
      "Accept-Encoding": "gzip",
      ...(options.useGetCheck ? { "Range": "bytes=0-0" } : {}),
    }
  });

  const storedEncoding = headResp.headers.get("x-goog-stored-content-encoding");
  const isGzipped = storedEncoding === "gzip";

  let fileSize = 0n;
  const contentLength =
    headResp.headers.get("x-goog-stored-content-length") ||
    headResp.headers.get("content-length");

  if (contentLength) {
    fileSize = BigInt(contentLength);
  }

  if (isGzipped && debug) {
    console.log(
      "⚠️  File is stored with gzip encoding - downloading full file"
    );

    // Prefer identity to avoid Bun auto-decompress confusion
    const resp = await fetch(url, {
      headers: { "Accept-Encoding": "identity" },
    });

    const buffer = await resp.arrayBuffer();
    let decompressed: Uint8Array;

    // Robust gzip detection: check magic bytes 0x1f 0x8b
    const u8 = new Uint8Array(buffer);
    const looksGzip = u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;

    if (looksGzip) {
      try {
        decompressed = gunzipSync(u8);
      } catch (e) {
        console.error("gunzip failed despite gzip magic, treating as raw:", e);
        decompressed = u8;
      }
    } else {
      decompressed = u8;
    }

    // Fully parse the DMG in-memory and search within decompressed chunks
    return findPatternInDmgBufferFull(decompressed, pattern);
  }

  // For non-gzipped files, use range requests
  // Read koly footer
  const kolyBuf = await fetchRangeBuffer(
    url,
    Number(fileSize - 512n),
    Number(fileSize - 1n),
    controller.signal,
    false
  );

  if (
    kolyBuf[0] !== 0x6b ||
    kolyBuf[1] !== 0x6f ||
    kolyBuf[2] !== 0x6c ||
    kolyBuf[3] !== 0x79
  ) {
    throw new Error("No koly footer found");
  }

  // Parse koly
  const dataForkOffset = Number(readUint64BE(kolyBuf, 0x18));
  const xmlOffset = Number(readUint64BE(kolyBuf, 0xd8));
  const xmlLength = Number(readUint64BE(kolyBuf, 0xe0));

  // Fetch plist
  const plistBuf = await fetchRangeBuffer(
    url,
    xmlOffset,
    xmlOffset + xmlLength - 1,
    controller.signal,
    false
  );

  // Parse plist
  const plistString = new TextDecoder().decode(plistBuf);
  const meta = plist.parse(plistString) as Record<string, any>;

  // Extract blkx entries
  const resourceFork = meta["resource-fork"];
  if (!resourceFork) {
    throw new Error("No resource-fork in plist");
  }

  const blkxArray = resourceFork.blkx || resourceFork.Blkx;
  if (!blkxArray || !Array.isArray(blkxArray)) {
    throw new Error("No blkx table in plist");
  }

  // Parse chunks from all blkx entries
  const rawChunks: DmgChunk[] = [];

  for (const entry of blkxArray) {
    const mishData = entry.Data || entry.data;
    if (!mishData || !(mishData instanceof Uint8Array)) continue;

    if (
      mishData[0] !== 0x6d ||
      mishData[1] !== 0x69 ||
      mishData[2] !== 0x73 ||
      mishData[3] !== 0x68
    ) {
      continue;
    }

    // Find chunk entries in mish blob
    const ENTRY_SIZE = 40;
    let headerOffset = 0;
    let found = false;

    for (let cand = 0x28; cand <= 0x200 && !found; cand += 4) {
      if (
        mishData.length - cand - 4 >= 0 &&
        (mishData.length - cand - 4) % ENTRY_SIZE === 0
      ) {
        const num = readUint32BE(mishData, cand);
        const expected = (mishData.length - cand - 4) / ENTRY_SIZE;
        if (num === expected || (num > 0 && num <= expected + 4)) {
          headerOffset = cand;
          found = true;
        }
      }
    }

    if (!found) continue;

    const numChunks = readUint32BE(mishData, headerOffset);
    const entriesOffset = headerOffset + 4;

    for (let i = 0; i < numChunks; i++) {
      const off = entriesOffset + i * ENTRY_SIZE;
      const chunk: DmgChunk = {
        idx: 0,
        entryType: readUint32BE(mishData, off),
        comment: readUint32BE(mishData, off + 4),
        sectorNumber: readUint64BE(mishData, off + 8),
        sectorCount: readUint64BE(mishData, off + 16),
        compressedOffset: readUint64BE(mishData, off + 24),
        compressedLength: readUint64BE(mishData, off + 32),
        absStart: dataForkOffset + Number(readUint64BE(mishData, off + 24)),
        absEnd: 0,
        runID: 0,
        sliceStartInRun: 0,
      };
      chunk.absEnd = chunk.absStart + Number(chunk.compressedLength) - 1;

      if (
        chunk.compressedLength > 0n &&
        (chunk.absStart >= Number(fileSize) || chunk.absEnd >= Number(fileSize))
      ) {
        continue;
      }

      rawChunks.push(chunk);
    }
  }

  // Sort chunks by sector number
  rawChunks.sort((a, b) => {
    if (a.sectorNumber < b.sectorNumber) return -1;
    if (a.sectorNumber > b.sectorNumber) return 1;
    return 0;
  });

  rawChunks.forEach((chunk, i) => {
    chunk.idx = i;
  });

  // Coalesce contiguous chunks into runs
  const runs = coalesceChunks(rawChunks);

  if (debug) {
    console.log(
      `Starting search through ${rawChunks.length} chunks in ${runs.length} runs`
    );
    // Summarize chunk types
    const typeCounts = new Map<number, number>();
    let supportedChunks = 0;
    let unsupportedChunks = 0;
    let zeroFillChunks = 0;
    for (const c of rawChunks) {
      typeCounts.set(c.entryType, (typeCounts.get(c.entryType) || 0) + 1);
      if (c.entryType === 0x00000000) zeroFillChunks++;
      else if (isSupportedCompression(c.entryType)) supportedChunks++;
      else unsupportedChunks++;
    }
    console.log(
      `Chunk types: supported=${supportedChunks}, unsupported=${unsupportedChunks}, zero-fill=${zeroFillChunks}`
    );
    for (const [t, count] of typeCounts) {
      const label =
        t === 0x00000000
          ? "ZERO"
          : t === 0x00000001
          ? "STORED"
          : t === 0x80000005
          ? "UDZO(zlib)"
          : t === 0x80000006
          ? "UDBZ(bzip2)"
          : t === 0x80000007
          ? "LZFSE"
          : `0x${t.toString(16)}`;
      console.log(`  type ${label}: ${count}`);
    }
  }

  // Search through chunks
  const searcher = new PatternSearcher(pattern);
  let nextToFeed = 0;
  const results = new Map<number, Uint8Array | null>();

  // Process chunks with concurrency control
  const processChunk = async (chunk: DmgChunk): Promise<void> => {
    if (controller.signal.aborted) return;

    // Add timeout protection for chunk processing
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Chunk ${chunk.idx} processing timeout`)),
        120_000
      ); // 120 second timeout
    });

    try {
      await Promise.race([processChunkInternal(chunk), timeoutPromise]);
    } catch (error: any) {
      // Check if this is a "found" result, not an actual error
      if (error && typeof error === "object" && error.found === true) {
        // Re-throw the found result to be caught by the outer try-catch
        throw error;
      }
      if (controller.signal.aborted) {
        return;
      }
      console.error(`Error processing chunk ${chunk.idx}:`, error);
      results.set(chunk.idx, null);
    } finally {
      if (timeoutId != null) clearTimeout(timeoutId);
    }
  };

  const processChunkInternal = async (chunk: DmgChunk): Promise<void> => {
    if (controller.signal.aborted) return;
    let decompressed: Uint8Array | null = null;

    if (chunk.entryType === 0x00000000) {
      // Zero-fill
      decompressed = new Uint8Array(Number(chunk.sectorCount) * SECTOR_SIZE);
    } else if (
      chunk.compressedLength > 0n &&
      isSupportedCompression(chunk.entryType)
    ) {
      // Fetch and decompress
      const run = runs[chunk.runID];
      const buffer = await fetchRunBuffer(run!, url, controller.signal, false);
      if (controller.signal.aborted) return;
      if (buffer != null) {
        const compSlice = buffer.slice(
          chunk.sliceStartInRun,
          chunk.sliceStartInRun + Number(chunk.compressedLength)
        );
        if (
          !controller.signal.aborted &&
          debug &&
          (chunk.idx < 5 || chunk.idx % 200 === 0)
        ) {
          console.log(
            `Decompressing chunk #${
              chunk.idx
            } type=0x${chunk.entryType.toString(16)} compLen=${
              compSlice.length
            }`
          );
        }
        if (controller.signal.aborted) return;
        try {
          decompressed = await decompressChunk(compSlice, chunk.entryType);
          if (
            !controller.signal.aborted &&
            debug &&
            (chunk.idx < 5 || chunk.idx % 200 === 0)
          ) {
            console.log(
              `Decompressed chunk #${chunk.idx} -> ${decompressed.length} bytes`
            );
          }
        } catch (e) {
          console.error(
            `Failed to decompress chunk ${
              chunk.idx
            } type=0x${chunk.entryType.toString(16)}: ${e}`
          );
        }
      }
    } else if (chunk.compressedLength > 0n) {
      if (
        !controller.signal.aborted &&
        debug &&
        (chunk.idx < 5 || chunk.idx % 200 === 0)
      ) {
        console.log(
          `Skipping unsupported chunk #${
            chunk.idx
          } type=0x${chunk.entryType.toString(
            16
          )} compLen=${chunk.compressedLength.toString()}`
        );
      }
    }

    if (controller.signal.aborted) return;
    results.set(chunk.idx, decompressed);

    // Try to feed consecutive results
    while (!controller.signal.aborted && results.has(nextToFeed)) {
      const buf = results.get(nextToFeed)!;
      results.delete(nextToFeed);

      if (buf) {
        const result = searcher.feed(buf);
        if (result.found) {
          if (!controller.signal.aborted && debug) {
            console.log(
              `🎯 PATTERN FOUND! Position: ${result.position}, Chunk: ${nextToFeed}`
            );
          }
          controller.abort();
          throw { found: true, position: result.position };
        }
      }

      nextToFeed++;

      if (!controller.signal.aborted && nextToFeed % 50 === 0 && debug) {
        const progress = ((nextToFeed / rawChunks.length) * 100).toFixed(1);
        console.log(
          `Progress: ${nextToFeed}/${rawChunks.length} chunks (${progress}%)`
        );
      }
    }
  };

  // Process chunks with prefetch window
  try {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      if (controller.signal.aborted) break;

      // Wait if we're too far ahead (with timeout to prevent deadlock)
      let waitTime = 0;
      while (nextToFeed + PREFETCH_WINDOW_CHUNKS < i && waitTime < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        waitTime += 50;
        if (controller.signal.aborted) break;
      }

      // If we've been waiting too long, proceed anyway to prevent deadlock
      if (waitTime >= 5000) {
        console.warn(`Prefetch timeout for chunk ${i}, proceeding anyway`);
      }

      // Limit concurrent processing
      if (promises.length >= MAX_CONCURRENT_REQUESTS) {
        await Promise.race(promises);
        promises.splice(
          0,
          promises.findIndex((p) => p === undefined)
        );
      }

      const nextChunk = rawChunks[i]!;
      const promise = processChunk(nextChunk);
      promises.push(promise);
    }

    // Let any rejection (found sentinel) short-circuit the wait
    await Promise.all(promises);
  } catch (result: any) {
    // Treat thrown object with { found: true } as success
    if (result && typeof result === "object" && result.found === true) {
      if (debug) {
        console.log(`Found pattern at position ${result.position}`);
      }
      return { found: true, position: result.position };
    }
    // If aborted, assume found if we triggered controller.abort() from a match
    if (controller.signal.aborted) {
      // Best-effort: treat as found if we aborted inside feed
      return { found: true };
    }
    throw result;
  }

  return { found: false };
}

// Helper functions for DMG
function isSupportedCompression(entryType: number): boolean {
  return (
    entryType === 0x00000001 || // Uncompressed
    entryType === 0x80000005 || // UDZO (zlib)
    entryType === 0x80000006 || // UDBZ (bzip2)
    entryType === 0x80000007 || // LZFSE
    entryType === 0x80000008 // LZMA
  );
}

function coalesceChunks(chunks: DmgChunk[]): DmgRun[] {
  const runs: DmgRun[] = [];
  let currentRun: DmgRun | null = null;

  for (const chunk of chunks) {
    if (
      chunk.entryType !== 0x00000000 &&
      chunk.compressedLength > 0n &&
      isSupportedCompression(chunk.entryType)
    ) {
      if (currentRun && chunk.absStart === currentRun.end + 1) {
        currentRun.end = chunk.absEnd;
        currentRun.chunks.push(chunk);
      } else {
        if (currentRun) {
          runs.push(currentRun);
        }
        currentRun = {
          id: runs.length,
          start: chunk.absStart,
          end: chunk.absEnd,
          chunks: [chunk],
        };
      }
    } else {
      if (currentRun) {
        runs.push(currentRun);
        currentRun = null;
      }
    }
  }

  if (currentRun) {
    runs.push(currentRun);
  }

  // Assign run IDs and slice offsets
  for (const run of runs) {
    for (const chunk of run.chunks) {
      chunk.runID = run.id;
      chunk.sliceStartInRun = chunk.absStart - run.start;
    }
  }

  return runs;
}

async function fetchRunBuffer(
  run: DmgRun,
  url: string,
  signal: AbortSignal,
  acceptGzip: boolean
): Promise<Uint8Array | null> {
  if (!run.fetchPromise) {
    run.fetchPromise = fetchRangeBuffer(
      url,
      run.start,
      run.end,
      signal,
      acceptGzip
    ).catch((err) => {
      console.error(`Failed to fetch run ${run.id}: ${err}`);
      return null;
    });
  }
  const buffer: Uint8Array | null = await run.fetchPromise;
  if (buffer != null) {
    run.buffer = buffer;
  }
  return buffer;
}

function searchDmgBuffer(
  buffer: Uint8Array,
  pattern: Uint8Array
): SearchResult {
  // Simplified search for when we have the entire DMG in memory
  const idx = indexOf(buffer, pattern);
  if (idx !== -1) {
    return { found: true, position: idx };
  }
  return { found: false };
}

// Main entry point
export async function findPattern(
  url: string,
  patternString: string,
  options: {
    useGetCheck: boolean;
  } = {useGetCheck: false}
): Promise<SearchResult> {
  const pattern = new TextEncoder().encode(patternString);

  if (debug) {
    console.log("Checking file headers and format...");
    console.log(`Searching for pattern: "${patternString}"`);
  }

  // Check file format
  const headResp = await fetch(url, {
    method: options.useGetCheck ? "GET" : "HEAD",
    headers: {
      "Accept-Encoding": "gzip",
      ...(options.useGetCheck ? { "Range": "bytes=0-0" } : {}),
    },
    redirect: "follow",
  });

  const finalURL = headResp.url;

  if (debug) {
    console.log(`Final URL: ${finalURL}`);
    console.log(`Content-Type: ${headResp.headers.get("content-type")}`);
    console.log(`Content-Length: ${headResp.headers.get("content-length")}`);
  }

  // Check if GCS gzipped
  const storedEncoding = headResp.headers.get("x-goog-stored-content-encoding");
  const isGcsGzipped = storedEncoding === "gzip";

  if (isGcsGzipped) {
    if (finalURL.toLowerCase().endsWith(".dmg")) {
      if (debug) {
        console.log("✓ Detected DMG file (from filename)");
      }
      return findPatternInDmg(finalURL, pattern, options);
    } else if (finalURL.toLowerCase().endsWith(".zip")) {
      if (debug) {
        console.log("✓ Detected ZIP file (from filename)");
      }
      return findPatternInZip(finalURL, pattern, options);
    }
  }

  // Check magic bytes
  const headerBuf = await fetchRangeBuffer(finalURL, 0, 511);

  if (debug) {
    const hex = Array.from(headerBuf.slice(0, 4))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    console.log(`First 4 bytes (hex): ${hex}`);
  }

  // Check for ZIP
  if (headerBuf[0] === 0x50 && headerBuf[1] === 0x4b) {
    if (debug) {
      console.log("✓ Detected ZIP file format (from magic bytes)");
    }
    return findPatternInZip(finalURL, pattern, options);
  }

  // Check for DMG by looking for koly footer
  const contentLength =
    headResp.headers.get("x-goog-stored-content-length") ||
    headResp.headers.get("content-length");

  if (contentLength) {
    const fileSize = BigInt(contentLength);
    const footerStart = fileSize > 512n ? fileSize - 512n : 0n;
    const footerBuf = await fetchRangeBuffer(
      finalURL,
      Number(footerStart),
      Number(fileSize - 1n)
    );

    for (let i = 0; i <= footerBuf.length - 4; i++) {
      if (
        footerBuf[i] === 0x6b &&
        footerBuf[i + 1] === 0x6f &&
        footerBuf[i + 2] === 0x6c &&
        footerBuf[i + 3] === 0x79
      ) {
        if (debug) {
          console.log("✓ Detected DMG file format (from koly footer)");
        }
        return findPatternInDmg(finalURL, pattern, options);
      }
    }
  }

  // Default to ZIP
  if (debug) {
    console.log("Defaulting to ZIP file format");
  }
  return findPatternInZip(finalURL, pattern, options);
}

// Parse and search a DMG entirely from an in-memory buffer
function findPatternInDmgBufferFull(
  file: Uint8Array,
  pattern: Uint8Array
): SearchResult {
  // Validate koly footer (last 512 bytes)
  if (file.length < 512) return { found: false };
  const footer = file.slice(file.length - 512);
  if (
    footer[0] !== 0x6b ||
    footer[1] !== 0x6f ||
    footer[2] !== 0x6c ||
    footer[3] !== 0x79
  ) {
    return searchDmgBuffer(file, pattern);
  }

  const dataForkOffset = Number(readUint64BE(footer, 0x18));
  const xmlOffset = Number(readUint64BE(footer, 0xd8));
  const xmlLength = Number(readUint64BE(footer, 0xe0));
  if (xmlOffset <= 0 || xmlLength <= 0) {
    return searchDmgBuffer(file, pattern);
  }

  if (xmlOffset + xmlLength > file.length) {
    return searchDmgBuffer(file, pattern);
  }

  const plistBuf = file.slice(xmlOffset, xmlOffset + xmlLength);
  const plistString = new TextDecoder().decode(plistBuf);
  let meta: any;
  try {
    meta = plist.parse(plistString) as any;
  } catch {
    return searchDmgBuffer(file, pattern);
  }

  const resourceFork = meta["resource-fork"];
  if (!resourceFork) return searchDmgBuffer(file, pattern);
  const blkxArray = resourceFork.blkx || resourceFork.Blkx;
  if (!blkxArray || !Array.isArray(blkxArray))
    return searchDmgBuffer(file, pattern);

  const chunks: DmgChunk[] = [];
  for (const entry of blkxArray) {
    const mishData = entry.Data || entry.data;
    if (!mishData || !(mishData instanceof Uint8Array)) continue;
    if (
      mishData[0] !== 0x6d ||
      mishData[1] !== 0x69 ||
      mishData[2] !== 0x73 ||
      mishData[3] !== 0x68
    )
      continue;

    const ENTRY_SIZE = 40;
    let headerOffset = 0;
    let foundHeader = false;
    for (let cand = 0x28; cand <= 0x200 && !foundHeader; cand += 4) {
      if (
        mishData.length - cand - 4 >= 0 &&
        (mishData.length - cand - 4) % ENTRY_SIZE === 0
      ) {
        const num = readUint32BE(mishData, cand);
        const expected = (mishData.length - cand - 4) / ENTRY_SIZE;
        if (num === expected || (num > 0 && num <= expected + 4)) {
          headerOffset = cand;
          foundHeader = true;
        }
      }
    }
    if (!foundHeader) continue;

    const numChunks = readUint32BE(mishData, headerOffset);
    const entriesOffset = headerOffset + 4;
    for (let i = 0; i < numChunks; i++) {
      const off = entriesOffset + i * ENTRY_SIZE;
      const entryType = readUint32BE(mishData, off);
      const sectorNumber = readUint64BE(mishData, off + 8);
      const sectorCount = readUint64BE(mishData, off + 16);
      const compOff = readUint64BE(mishData, off + 24);
      const compLen = readUint64BE(mishData, off + 32);

      const absStart = dataForkOffset + Number(compOff);
      const absEnd = absStart + Number(compLen) - 1;
      if (absStart < 0 || absEnd >= file.length || compLen <= 0n) continue;

      chunks.push({
        idx: chunks.length,
        entryType,
        comment: 0,
        sectorNumber,
        sectorCount,
        compressedOffset: compOff,
        compressedLength: compLen,
        absStart,
        absEnd,
        runID: 0,
        sliceStartInRun: 0,
      });
    }
  }

  if (chunks.length === 0) return searchDmgBuffer(file, pattern);

  chunks.sort((a, b) =>
    a.sectorNumber < b.sectorNumber
      ? -1
      : a.sectorNumber > b.sectorNumber
      ? 1
      : 0
  );

  const searcher = new PatternSearcher(pattern);
  for (const chunk of chunks) {
    let buf: Uint8Array | null = null;
    if (chunk.entryType === 0x00000000) {
      buf = new Uint8Array(Number(chunk.sectorCount) * SECTOR_SIZE);
    } else if (
      chunk.compressedLength > 0n &&
      isSupportedCompression(chunk.entryType)
    ) {
      const compSlice = file.slice(chunk.absStart, chunk.absEnd + 1);
      try {
        buf = gunzipOrBzipOrZlib(compSlice, chunk.entryType);
      } catch {
        buf = null;
      }
    }

    if (buf) {
      const r = searcher.feed(buf);
      if (r.found) return { found: true, position: r.position };
    }
  }

  return { found: false };
}

function gunzipOrBzipOrZlib(comp: Uint8Array, entryType: number): Uint8Array {
  if (entryType === 0x00000001) return comp;
  if (entryType === 0x80000005) {
    try {
      return inflateSync(comp as any);
    } catch {
      return inflateSync(comp.slice(2) as any);
    }
  }
  if (entryType === 0x80000006) {
    const bits = bzip2.array(comp);
    return bzip2.simple(bits);
  }
  throw new Error("Unsupported compression");
}
