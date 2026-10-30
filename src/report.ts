import type { AppScanResult } from './scan.js';
import type { ChecklistItem } from './checklist.js';

export interface InventoryManifest {
  tool: 'sessguard';
  version: string;
  scannedAt: string;
  /** "$HOME" when the real home was scanned, else the override directory. */
  root: string;
  platform: string;
  apps: AppScanResult[];
}

export interface ChecklistManifest {
  tool: 'sessguard';
  version: string;
  generatedAt: string;
  items: ChecklistItem[];
}

function relativeTime(iso: string | null): string {
  if (iso === null) return '-';
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

/** Human-readable inventory table. Values never appear -- counts and metadata only. */
export function renderInventory(results: AppScanResult[]): string {
  const lines: string[] = [
    'AI SESSION STORES ON THIS MACHINE',
    'Token values are never shown -- paths, file metadata, and match counts only.',
    '',
  ];
  const found = results.filter((r) => r.found);
  lines.push(`Apps with stores found: ${found.length}/${results.length}`);
  lines.push('');
  for (const r of results) {
    if (!r.found) {
      lines.push(`- ${r.appName}: not found`);
      continue;
    }
    lines.push(`- ${r.appName}:`);
    lines.push(`    stores: ${r.storePaths.join(', ')}`);
    lines.push(`    files: ${r.fileCount}, total size: ${r.totalSize} bytes`);
    lines.push(`    newest: ${relativeTime(r.newestMtime)}, oldest: ${relativeTime(r.oldestMtime)}`);
    lines.push(
      `    files matching token patterns: ${r.filesWithTokenPatterns} ` +
        `(${r.tokenPatternMatchCount} matches -- values hidden)`,
    );
  }
  return lines.join('\n');
}

/** Human-readable per-app revocation checklist. */
export function renderChecklist(items: ChecklistItem[]): string {
  const lines: string[] = [
    'REVOCATION CHECKLIST',
    'For each app with session material found on this machine.',
    '',
  ];
  for (const item of items) {
    lines.push(`## ${item.appName}${item.found ? '' : ' (not found on this machine)'}`);
    if (item.found) {
      lines.push(`Stores: ${item.storePaths.join(', ')}`);
      lines.push(`Typically holds: ${item.typicallyHolds.join(', ')}`);
      lines.push(`Revoke: ${item.revokeUrl}`);
      lines.push(`How: ${item.revokeNote}`);
      lines.push(`Also rotate: ${item.rotateAlso.join(', ')}`);
    } else {
      lines.push('No local stores found -- nothing to revoke locally.');
      lines.push(`If you used it elsewhere, revoke at: ${item.revokeUrl}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
