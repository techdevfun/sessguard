import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', 'src');

/**
 * sessguard must make zero network calls, by design. This test statically
 * proves no networking API is imported or used anywhere in src/.
 */
describe('zero-network guarantee', () => {
  it('no network imports or calls in src/', () => {
    const offenders: string[] = [];
    for (const file of fs.readdirSync(SRC)) {
      if (!file.endsWith('.ts')) continue;
      const text = fs.readFileSync(path.join(SRC, file), 'utf8');
      const patterns: Array<[RegExp, string]> = [
        [/\bfrom\s+['"]node:(?:http|https|net|tls|dns|dgram)['"]/, 'node network module import'],
        [/\brequire\(\s*['"](?:http|https|net|tls|dns|dgram)['"]\s*\)/, 'network require()'],
        [/\bfetch\s*\(/, 'fetch() call'],
        [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
        [/\bWebSocket\b/, 'WebSocket'],
        [/\bcreateConnection\b/, 'createConnection'],
        [/\bcurl\b/i, 'curl reference'],
      ];
      for (const [re, label] of patterns) {
        if (re.test(text)) offenders.push(`${file}: ${label}`);
      }
    }
    assert.deepEqual(offenders, [], 'network usage found in src/');
  });
});
