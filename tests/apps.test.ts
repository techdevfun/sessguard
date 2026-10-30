import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { APPS } from '../src/apps.js';

const EXPECTED_IDS = [
  'amazon-q',
  'chatgpt-desktop',
  'claude',
  'codex',
  'cursor',
  'gemini-cli',
  'github-copilot',
  'jetbrains-ai',
  'kiro',
  'windsurf',
];

describe('app path table', () => {
  it('covers exactly the 10 documented apps', () => {
    assert.deepEqual(APPS.map((a) => a.id).sort(), EXPECTED_IDS);
  });

  it('app ids are unique', () => {
    assert.equal(new Set(APPS.map((a) => a.id)).size, APPS.length);
  });

  it('every app has a revocation URL, notes, holds/rotate lists, and a last-verified date', () => {
    for (const app of APPS) {
      assert.match(app.revokeUrl, /^https:\/\/\S+$/, `${app.id}: revokeUrl must be an https URL`);
      assert.ok(app.revokeNote.length > 0, `${app.id}: revokeNote`);
      assert.ok(app.paths.length > 0, `${app.id}: at least one store path`);
      assert.ok(app.holds.length > 0, `${app.id}: holds`);
      assert.ok(app.rotate.length > 0, `${app.id}: rotate`);
      assert.match(app.lastVerified, /^\d{4}-\d{2}-\d{2}$/, `${app.id}: lastVerified YYYY-MM-DD`);
      for (const p of app.paths) {
        assert.ok(p.segments.length > 0, `${app.id}: path segments`);
        assert.ok(p.note.length > 0, `${app.id}: path note`);
      }
    }
  });
});
