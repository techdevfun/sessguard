import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { APPS } from '../src/apps.js';
import { scanAll, countTokenPatterns, scanFile } from '../src/scan.js';

const MARKER = 'SESSGUARD-FAKE-FIXTURE';
let home: string;

function plant(rel: string, content: string): void {
  const abs = path.join(home, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

describe('scanner', () => {
  before(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'sessguard-scan-'));
    plant('.codex/auth.json', `{"_note":"${MARKER}","api_key":"fake-sk-value-0123456789abcdef"}`);
    plant('.codex/config.toml', `# ${MARKER}\n`);
    plant('.claude.json', `{"_note":"${MARKER}","oauth_token":"fake-oauth-token-abcdef0123456789"}`);
    plant('.cursor/mcp.json', `{"_note":"${MARKER}"}\n`);
    plant('.gemini/settings.json', `{"_note":"${MARKER}","apiKey":"fake-gemini-key-0123456789abcdef"}`);
    plant('.config/github-copilot/apps.json', `{"_note":"${MARKER}","token":"fake-copilot-token-abcdef0123456789"}`);
    plant('.windsurf/config.json', `{"_note":"${MARKER}"}\n`);
    plant('.config/something-else/notes.txt', 'unrelated app, must be ignored\n');
  });

  after(() => {
    fs.rmSync(home, { recursive: true, force: true });
  });

  it('finds exactly the planted stores and nothing else', () => {
    const results = scanAll(APPS, home, 'linux');
    const found = results.filter((r) => r.found).map((r) => r.appId).sort();
    assert.deepEqual(found, ['claude', 'codex', 'cursor', 'gemini-cli', 'github-copilot', 'windsurf']);
    const notFound = results.filter((r) => !r.found).map((r) => r.appId);
    assert.ok(notFound.includes('chatgpt-desktop'), 'chatgpt-desktop not planted');
    assert.ok(notFound.includes('amazon-q'), 'amazon-q not planted');
    for (const r of results.filter((x) => !x.found)) {
      assert.equal(r.fileCount, 0);
      assert.equal(r.files.length, 0);
    }
  });

  it('reports metadata only, with dedupe of overlapping store paths', () => {
    const results = scanAll(APPS, home, 'linux');
    const codex = results.find((r) => r.appId === 'codex');
    assert.ok(codex && codex.found);
    // .codex/auth.json (file entry) + .codex (dir entry) -> deduped to 2 files
    assert.equal(codex.fileCount, 2);
    const paths = codex.files.map((f) => f.path).sort();
    assert.deepEqual(paths, ['.codex/auth.json', '.codex/config.toml']);
    for (const f of codex.files) {
      assert.ok(f.size > 0);
      assert.match(f.mtime, /^\d{4}-\d{2}-\d{2}T/);
      assert.ok(!('content' in f), 'findings must not carry file content');
      assert.ok(!('value' in f), 'findings must not carry token values');
    }
  });

  it('counts token-like patterns without capturing values', () => {
    const n = countTokenPatterns('api_key = "fake-sk-value-0123456789abcdef" and nothing else');
    assert.ok(n >= 1, 'pattern counted');
    assert.equal(typeof n, 'number');
    const zero = countTokenPatterns('plain prose with no secrets at all');
    assert.equal(zero, 0);
  });

  it('counts patterns per file and aggregates per app', () => {
    const results = scanAll(APPS, home, 'linux');
    const codex = results.find((r) => r.appId === 'codex');
    assert.ok(codex);
    assert.ok(codex.tokenPatternMatchCount > 0, 'fake keys counted');
    assert.ok(codex.filesWithTokenPatterns > 0);
    const cursor = results.find((r) => r.appId === 'cursor');
    assert.ok(cursor && cursor.found);
    assert.equal(cursor.filesWithTokenPatterns, 0, 'marker-only file matches no token pattern');
  });

  it('scanFile returns metadata for unreadable paths as null, never throws', () => {
    const f = scanFile(path.join(home, '.does-not-exist.json'), home);
    assert.equal(f, null);
  });
});
