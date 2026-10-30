#!/usr/bin/env node
/**
 * Redaction self-test (also run in CI).
 *
 * Runs `sessguard inventory --json` against the synthetic demo profile and
 * asserts that no fixture secret value (any `SESSGUARD-FAKE-*` token longer
 * than 8 chars, excluding the bare SESSGUARD-FAKE-FIXTURE marker) appears
 * anywhere in the JSON output.
 *
 * Exit 0 = no leaks. Exit 1 = leak detected or fixture broken.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'examples', 'demo-profile');
const SECRET_RE = /SESSGUARD-FAKE-(?!FIXTURE\b)[A-Za-z0-9._\-~+/=]{9,}/g;

function collectFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(abs, out);
    else if (entry.isFile() && !entry.name.endsWith('.md')) out.push(abs);
  }
}

function main() {
  const files = [];
  collectFiles(DEMO, files);
  const secrets = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(SECRET_RE)) secrets.add(m[0]);
  }
  if (secrets.size === 0) {
    console.error('selftest FAILED: no fixture secrets found in demo profile -- fixture is broken');
    process.exit(1);
  }
  const tmpDir = fs.mkdtempSync('/tmp/sessguard-selftest-');
  const out = path.join(tmpDir, 'inventory.json');
  execFileSync('node', [path.join(ROOT, 'dist', 'cli.js'), 'inventory', '--json', out], {
    env: { ...process.env, SESSGUARD_ROOT: DEMO },
    stdio: 'pipe',
  });
  const json = fs.readFileSync(out, 'utf8');
  const leaked = [...secrets].filter((s) => json.includes(s));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (leaked.length > 0) {
    console.error(`selftest FAILED: ${leaked.length} of ${secrets.size} fixture secrets leaked into JSON output`);
    process.exit(1);
  }
  console.log(`selftest PASSED: ${secrets.size} fixture secrets checked, 0 leaked into JSON output`);
}

main();
