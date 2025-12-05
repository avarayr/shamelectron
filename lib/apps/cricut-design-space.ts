import { FixedStatus, type AppMeta } from "@/types";
import { findPattern } from "@/lib/findPattern";

export const CricutDesignSpace: AppMeta = {
  icon: "https://cdn.brandfetch.io/idkNv9kgpD/w/128/h/128/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764632626928",
  id: "cricut-design-space",
  friendlyName: "Cricut Design Space",
  twitter: "cricut",
  async checkIsFixed() {
    const pat = "_cornerMask";
    try {
      const url = await findDownloadUrl();
      const result = await findPattern(url, pat);
      return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
    } catch (err) {
      // If we can't retrieve the signed URL for any reason, surface a sensible default.
      // Choose NOT_FIXED so the UI indicates the app *might* still be broken (better safe).
      console.error("CricutDesignSpace.checkIsFixed error:", err);
      return FixedStatus.NOT_FIXED;
    }
  },
};

/**
 * Cricut didn't make this easy. There's no permalink to the latest DMG, rather we
 * have to jump through a series of hoops to get a signed, ephermal URL:
 * 1. UpdateJson endpoint gives us a manifest URL
 * 2. Fetch the manifest (latest.json) to get the installer filename - we can now
 *    partially construct the .dmg URL, but we don't have the signed query params yet.
 * 3. Call InstallerFile endpoint with the filename to get the final signed URL.
 *
 * I have added a tiny in-memory cache keyed by the final signed URL Expires time
 * so repeated checks within the short lifetime don't re-query Cricut.
 */

const UPDATE_JSON_URL =
  "https://apis.cricut.com/desktopdownload/UpdateJson?operatingSystem=osxnative&shard=a";
const INSTALLER_FILE_ENDPOINT = "https://apis.cricut.com/desktopdownload/InstallerFile";
const DEFAULT_HEADERS = {
  Accept: "application/json, text/plain, */*",
  Origin: "https://design.cricut.com",
  Referer: "https://design.cricut.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15",
};

// Cache retrieved download URL until expiry
let cachedSignedUrl: string | null = null;
let cacheExpiresAtMs = 0;

/** parse Expires from a signed CloudFront URL (returns epoch seconds or null) */
function parseExpiresFromSignedUrl(url: string): number | null {
  try {
    const u = new URL(url);
    const ex = u.searchParams.get("Expires");
    if (!ex) return null;
    const n = parseInt(ex, 10);
    if (Number.isFinite(n)) return n;
  } catch (e) {}
  return null;
}

/** Main function: performs the 3-step flow and returns the final signed DMG URL */
async function findDownloadUrl(): Promise<string> {
  // If we have a cached signed URL still valid, return it.
  if (cachedSignedUrl && Date.now() < cacheExpiresAtMs) {
    return cachedSignedUrl;
  }

  // Step 1: call UpdateJson to get the manifest URL
  const updateJsonResp = await fetch(UPDATE_JSON_URL, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    redirect: "follow",
  });

  if (!updateJsonResp.ok) {
    const txt = await updateJsonResp.text().catch(() => "");
    throw new Error(`UpdateJson failed: ${updateJsonResp.status} ${txt}`);
  }

  const updJson = await updateJsonResp.json().catch(() => null);
  const manifestUrl: string | undefined = updJson?.result;
  if (!manifestUrl || typeof manifestUrl !== "string") {
    throw new Error(`UpdateJson did not return manifest url: ${JSON.stringify(updJson)}`);
  }

  // Step 2: fetch the manifest (latest.json) and find the filename
  const manifestResp = await fetch(manifestUrl, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    redirect: "follow",
  });

  if (!manifestResp.ok) {
    const txt = await manifestResp.text().catch(() => "");
    throw new Error(`Manifest fetch failed: ${manifestResp.status} ${txt}`);
  }

  const manifestJson = await manifestResp.json().catch(() => null);
  const filename =
    manifestJson?.rolloutInstallFile ||
    manifestJson?.baseInstallFile
    null;

  if (!filename || typeof filename !== "string") {
    throw new Error(`Manifest did not contain install filename: ${JSON.stringify(manifestJson)}`);
  }

  // Step 3: call InstallerFile?fileName=... to get the signed DMG URL
  const installerUrl =
    INSTALLER_FILE_ENDPOINT +
    "?fileName=" +
    encodeURIComponent(filename) +
    "&operatingSystem=osxnative&shard=a";

  const installerUrlResp = await fetch(installerUrl, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    redirect: "follow",
  });

  if (!installerUrlResp.ok) {
    const txt = await installerUrlResp.text().catch(() => "");
    throw new Error(`InstallerFile request failed: ${installerUrlResp.status} ${txt}`);
  }

  const instJson = await installerUrlResp.json().catch(() => null);
  const signedUrl: string | undefined = instJson?.result;
  if (!signedUrl || typeof signedUrl !== "string") {
    throw new Error(`InstallerFile did not return signed URL: ${JSON.stringify(instJson)}`);
  }

  // Cache expiry: try to parse Expires param and cache until slightly before it
  const expiresSec = parseExpiresFromSignedUrl(signedUrl);
  if (expiresSec && Number.isFinite(expiresSec)) {
    // subtract 5 seconds to be safe
    cacheExpiresAtMs = Math.max(0, expiresSec * 1000 - 5000);
    cachedSignedUrl = signedUrl;
  } else {
    // fallback: short cache for 20 seconds if no Expires param
    cacheExpiresAtMs = Date.now() + 20000;
    cachedSignedUrl = signedUrl;
  }

  return signedUrl;
}
