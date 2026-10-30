import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { APPS } from '../src/apps.js';
import { scanAll } from '../src/scan.js';
import type { InventoryManifest } from '../src/report.js';

const DEMO = path.join(__dirname, '..', 'examples', 'demo-profile');

/** Fixture secret values are marked with this prefix; the bare marker is not a secret. */
const SECRET_RE = /SESSGUARD-FAKE-(?!FIXTURE\b)[A-Za-z0-9._\-~+/=]{9,}/g;

function collectDemoFiles(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectDemoFiles(abs, out);
    } else if (entry.isFile() && !entry.name.endsWith('.md')) {
      out.push(abs);
    }
  }
}

function fixtureSecrets(): string[] {
  const files: string[] = [];
  collectDemoFiles(DEMO, files);
  const secrets = new Set<string>();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(SECRET_RE)) secrets.add(m[0]);
  }
  return [...secrets];
}

describe('redaction self-test', () => {
  it('demo profile plants at least one fixture secret', () => {
    const secrets = fixtureSecrets();
    assert.ok(secrets.length >= 3, `expected >=3 fixture secrets, got ${secrets.length}`);
  });

  it('inventory JSON over the demo profile contains zero fixture secret values', () => {
    const secrets = fixtureSecrets();
    const results = scanAll(APPS, DEMO, 'linux');
    const manifest: InventoryManifest = {
      tool: 'sessguard',
      version: '0.1.0-test',
      scannedAt: new Date().toISOString(),
      root: DEMO,
      platform: 'linux',
      apps: results,
    };
    const json = JSON.stringify(manifest);
    const leaked = secrets.filter((s) => json.includes(s));
    assert.deepEqual(leaked, [], `${leaked.length} fixture secret(s) leaked into JSON output`);
  });

  it('serialized findings never carry content/value fields', () => {
    const results = scanAll(APPS, DEMO, 'linux');
    const json = JSON.stringify(results);
    assert.ok(!/"content"\s*:/.test(json), 'no content field');
    assert.ok(!/"value"\s*:/.test(json), 'no value field');
    // Any planted fixture secret longer than 8 chars must be absent from the JSON.
    for (const s of fixtureSecrets()) {
      assert.ok(!json.includes(s), `fixture secret of length ${s.length} present in output`);
    }
  });
});
