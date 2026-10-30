import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APPS } from '../src/apps.js';
import { scanAll } from '../src/scan.js';
import { buildChecklist } from '../src/checklist.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('checklist', () => {
  it('covers every app in the path table and every entry has a revocation URL', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sessguard-chk-'));
    try {
      fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(home, '.codex', 'auth.json'), '{"note":"SESSGUARD-FAKE-FIXTURE"}\n');
      const results = scanAll(APPS, home, 'linux');
      const items = buildChecklist(APPS, results);
      assert.equal(items.length, APPS.length, 'one checklist item per app');
      const ids = items.map((i) => i.appId).sort();
      assert.deepEqual(ids, APPS.map((a) => a.id).sort());
      for (const item of items) {
        assert.match(item.revokeUrl, /^https:\/\/\S+$/, `${item.appId}: revokeUrl`);
        assert.ok(item.revokeNote.length > 0, `${item.appId}: revokeNote`);
        assert.ok(item.typicallyHolds.length > 0, `${item.appId}: typicallyHolds`);
      }
      const codex = items.find((i) => i.appId === 'codex');
      assert.ok(codex && codex.found, 'planted app marked found');
      const claude = items.find((i) => i.appId === 'claude');
      assert.ok(claude && !claude.found, 'unplanted app marked not found');
      assert.ok(claude.storePaths.length === 0);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
