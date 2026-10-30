import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AppEntry, Platform } from './types.js';

/** One file found inside a known store. Carries metadata only -- never content. */
export interface FileFinding {
  /** Path relative to the scanned root. */
  path: string;
  size: number;
  /** ISO timestamp of last modification. */
  mtime: string;
  /** Number of token-like substrings in the file. The substrings are never captured. */
  tokenPatternMatches: number;
}

export interface AppScanResult {
  appId: string;
  appName: string;
  found: boolean;
  /** Store paths that exist, relative to the scanned root. */
  storePaths: string[];
  files: FileFinding[];
  fileCount: number;
  totalSize: number;
  newestMtime: string | null;
  oldestMtime: string | null;
  filesWithTokenPatterns: number;
  tokenPatternMatchCount: number;
}

/** Files larger than this are counted by metadata only; content is not read. */
const MAX_READ_BYTES = 2 * 1024 * 1024;

/**
 * Token-like shapes. These are deliberately generic: the scanner reports
 * COUNTS of matches and never returns, stores, or prints the matched
 * substrings themselves.
 */
const TOKEN_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /xox[bpras]-[A-Za-z0-9-]{8,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|bearer|oauth[_-]?token)["']?\s*[:=]\s*["']?[A-Za-z0-9._\-+~\/=]{12,}["']?/gi,
  /Bearer\s+[A-Za-z0-9._\-~+\/]+=*/g,
  /[A-Za-z0-9_\-+/=]{40,}/g,
];

/**
 * Count token-like substrings in text. Returns a number only -- the matched
 * values never leave this function.
 */
export function countTokenPatterns(text: string): number {
  let total = 0;
  for (const re of TOKEN_PATTERNS) {
    re.lastIndex = 0;
    const matches = text.match(re);
    if (matches) total += matches.length;
  }
  return total;
}

function looksBinary(buf: Buffer): boolean {
  const n = Math.min(buf.length, 4096);
  for (let i = 0; i < n; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

/** Read-only metadata + pattern count for a single file. Null when unreadable. */
export function scanFile(absPath: string, displayRoot: string): FileFinding | null {
  let st: fs.Stats;
  try {
    st = fs.statSync(absPath);
  } catch {
    return null;
  }
  if (!st.isFile()) return null;
  let matches = 0;
  try {
    const fd = fs.openSync(absPath, 'r');
    try {
      const size = Math.min(st.size, MAX_READ_BYTES);
      const buf = Buffer.alloc(size);
      fs.readSync(fd, buf, 0, size, 0);
      if (!looksBinary(buf)) {
        matches = countTokenPatterns(buf.toString('utf8'));
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // Unreadable file: metadata is still reported, pattern count stays 0.
  }
  return {
    path: path.relative(displayRoot, absPath) || path.basename(absPath),
    size: st.size,
    mtime: st.mtime.toISOString(),
    tokenPatternMatches: matches,
  };
}

/** Read-only recursive walk. Never follows symlinks. */
export function walkDir(dir: string, displayRoot: string, out: FileFinding[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      walkDir(abs, displayRoot, out);
    } else if (entry.isFile()) {
      const finding = scanFile(abs, displayRoot);
      if (finding) out.push(finding);
    }
  }
}

/** Scan one app's known stores under homeDir. Purely read-only. */
export function scanApp(app: AppEntry, homeDir: string, platform: Platform): AppScanResult {
  const files: FileFinding[] = [];
  const storePaths: string[] = [];
  for (const store of app.paths) {
    if (store.platform && store.platform !== platform) continue;
    const abs = path.join(homeDir, ...store.segments);
    let st: fs.Stats;
    try {
      st = fs.statSync(abs);
    } catch {
      continue; // store absent: app (or that store) not installed here
    }
    storePaths.push(path.relative(homeDir, abs) || '.');
    if (st.isDirectory()) {
      walkDir(abs, homeDir, files);
    } else if (st.isFile()) {
      const finding = scanFile(abs, homeDir);
      if (finding) files.push(finding);
    }
  }
  // Overlapping store paths (e.g. ".codex" and ".codex/auth.json") may yield
  // the same file twice -- dedupe by relative path.
  const seen = new Set<string>();
  const unique = files.filter((f) => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });
  let totalSize = 0;
  let withPatterns = 0;
  let matchCount = 0;
  let newest: string | null = null;
  let oldest: string | null = null;
  for (const f of unique) {
    totalSize += f.size;
    matchCount += f.tokenPatternMatches;
    if (f.tokenPatternMatches > 0) withPatterns += 1;
    if (newest === null || f.mtime > newest) newest = f.mtime;
    if (oldest === null || f.mtime < oldest) oldest = f.mtime;
  }
  return {
    appId: app.id,
    appName: app.name,
    found: storePaths.length > 0,
    storePaths,
    files: unique,
    fileCount: unique.length,
    totalSize,
    newestMtime: newest,
    oldestMtime: oldest,
    filesWithTokenPatterns: withPatterns,
    tokenPatternMatchCount: matchCount,
  };
}

/** Scan every app in the table. */
export function scanAll(apps: AppEntry[], homeDir: string, platform: Platform): AppScanResult[] {
  return apps.map((app) => scanApp(app, homeDir, platform));
}
