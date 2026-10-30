#!/usr/bin/env node
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { APPS } from './apps.js';
import { scanAll } from './scan.js';
import type { Platform } from './types.js';
import { buildChecklist } from './checklist.js';
import {
  renderInventory,
  renderChecklist,
  type InventoryManifest,
  type ChecklistManifest,
} from './report.js';

function getVersion(): string {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: unknown };
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const VERSION = getVersion();

function usage(): string {
  return [
    'sessguard -- inventory AI-assistant session material on this machine (read-only, zero network)',
    '',
    'Usage:',
    '  sessguard inventory [--json out.json]   scan well-known session/config paths',
    '  sessguard checklist [--json out.json]   per-app revocation checklist',
    '  sessguard --version                     print version',
    '',
    'Environment:',
    '  SESSGUARD_ROOT   scan this directory instead of $HOME (for demos and tests)',
    '',
    'sessguard never prints, logs, or exports token values -- findings carry',
    'paths, file metadata, and pattern-match counts only.',
  ].join('\n');
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main(): number {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`sessguard ${VERSION}`);
    return 0;
  }
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return 0;
  }
  const command = args[0];
  const jsonIndex = args.indexOf('--json');
  const jsonOut = jsonIndex >= 0 ? args[jsonIndex + 1] : undefined;
  if (jsonIndex >= 0 && (jsonOut === undefined || jsonOut.startsWith('-'))) {
    console.error('error: --json requires an output path');
    return 2;
  }
  const homeDir = os.homedir();
  const root = process.env.SESSGUARD_ROOT ?? homeDir;
  const platform = process.platform as Platform;

  if (command === 'inventory') {
    const results = scanAll(APPS, root, platform);
    const manifest: InventoryManifest = {
      tool: 'sessguard',
      version: VERSION,
      scannedAt: new Date().toISOString(),
      root: root === homeDir ? '$HOME' : root,
      platform,
      apps: results,
    };
    console.log(renderInventory(results));
    if (jsonOut !== undefined) {
      writeJson(jsonOut, manifest);
      console.log(`\nJSON manifest written to ${jsonOut}`);
    }
    return 0;
  }

  if (command === 'checklist') {
    const results = scanAll(APPS, root, platform);
    const items = buildChecklist(APPS, results);
    const manifest: ChecklistManifest = {
      tool: 'sessguard',
      version: VERSION,
      generatedAt: new Date().toISOString(),
      items,
    };
    console.log(renderChecklist(items));
    if (jsonOut !== undefined) {
      writeJson(jsonOut, manifest);
      console.log(`\nJSON manifest written to ${jsonOut}`);
    }
    return 0;
  }

  console.error(`error: unknown command "${command}"\n\n${usage()}`);
  return 2;
}

process.exit(main());
