# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

shamelectron tracks problematic Electron apps on macOS Tahoe that suffer from GPU performance issues ([electron/electron#48376](https://github.com/electron/electron/pull/48376)).

This is a Next.js static site that:
1. Downloads and analyzes Electron app binaries to detect the problematic pattern (`_cornerMask`)
2. Stores status in Redis cache (6-hour TTL)
3. Generates a static GitHub Pages site showing which apps are fixed/broken

## Runtime: Bun-First Architecture

**CRITICAL**: This project uses Bun as the primary runtime, NOT Node.js.

- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads `.env` files (no dotenv package needed)
- Use `Bun.file` over `node:fs` readFile/writeFile
- Use `bun:sqlite` instead of `better-sqlite3`
- Use built-in `WebSocket` instead of `ws` package
- Use `Bun.$` for shell commands instead of execa

## Development Workflow

### Required: Redis Container

Before running dev server, you MUST start a Redis container:

```bash
docker run -d -p 6379:6379 redis:alpine 2>&1
```

Kill the container when finished working.

### Development Commands

```bash
# Install dependencies
bun install

# Run dev server (updates apps index + checks for new app statuses)
bun run dev

# Quick dev without updating apps (faster startup)
bun run dev:no-update

# Build for production (generates static site)
bun run build

# Lint code
bun run lint

# Update dependencies
bun run renovate
```

### Pre-hooks

Both `dev` and `build` commands run `scripts/generate-apps-index.ts` first, which auto-generates `lib/apps/index.ts` from individual app files.

## Architecture

### App Metadata System

**Location**: `lib/apps/`

Each app is defined in its own TypeScript file (e.g., `1password.ts`, `discord.ts`):

```typescript
import { findPattern } from "@/lib/findPattern";
import { FixedStatus, type AppMeta } from "../../types";

export const AppName: AppMeta = {
  id: "app-id",
  friendlyName: "App Name",
  icon: "https://...",
  twitter: "TwitterHandle",
  async checkIsFixed() {
    const url = "https://download-url.com/app.zip";
    const pattern = "_cornerMask";
    const result = await findPattern(url, pattern);
    return result?.found ? FixedStatus.NOT_FIXED : FixedStatus.FIXED;
  },
};
```

**Auto-generation**: `scripts/generate-apps-index.ts` scans `lib/apps/`, imports all exports, and generates `lib/apps/index.ts` with a sorted `APPS` array.

**Contributing**: To add a new app, create a new `.ts` file in `lib/apps/` following the pattern above. The index will be auto-generated.

### Pattern Detection (`lib/findPattern.ts`)

Core binary analysis engine that:
1. Fetches app binaries via HTTP range requests (optimized with concurrent chunking)
2. Handles various compression formats (zip, dmg, gzip, bzip2, xz)
3. Parses DMG metadata and partition tables to locate compressed blobs
4. Searches decompressed binaries for the `_cornerMask` symbol
5. Uses semaphore-controlled concurrency (max 16 concurrent requests)
6. Implements intelligent prefetching (1024-chunk window, 5MB chunks)

### Redis Caching (`lib/core.ts`)

Manages app status persistence:
- **Key format**: `app:{app-id}`
- **Value**: JSON with `{ id, isFixed, lastChecked }`
- **Staleness**: 6 hours (checked via `isStale()`)
- **Singleton client**: `getRedisClient()` returns shared Redis connection
- **Static generation**: `computeStaticApps()` merges metadata with cached statuses

### Next.js Static Export

- **Mode**: Static export (`output: 'export'` in `next.config.mjs`)
- **Base path**: `/shamelectron` for GitHub Pages (production only)
- **Images**: Unoptimized (required for static export)
- **React Compiler**: Enabled experimentally

## Type Definitions

Located in `types/index.ts`:

```typescript
FixedStatus = "fixed" | "not_fixed" | "unknown"

AppMeta {
  id: string
  friendlyName: string
  icon: string
  twitter?: string
  checkIsFixed: () => PromiseLike<FixedStatus>
}

AppRecord {
  // AppMeta fields +
  isFixed: FixedStatus
  lastChecked: number
}
```

## Testing

Use `bun test` to run tests:

```typescript
import { test, expect } from "bun:test";

test("example test", () => {
  expect(1).toBe(1);
});
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
REDIS_URL=rediss://your-redis-url
```

For local development with Docker Redis: `REDIS_URL=redis://localhost:6379`
