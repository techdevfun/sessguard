import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '..');

/**
 * The README's Design section tells readers how CI blocks networking for the
 * zero-network run. If the CI mechanism ever changes without the README
 * following, new readers learn a wrong mental model of the build.
 * (Caught 2026-10-31: README still named `unshare -rn` after CI switched to
 * iptables REJECT isolation.)
 */
describe('README <-> CI consistency', () => {
  it('README names the network-block mechanism CI actually uses', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const ci = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
    const bullet = readme.split('\n').find((line) => line.includes('**Zero network:**'));
    assert(bullet, 'README must keep its Zero network design bullet');
    if (!ci.includes('unshare')) {
      assert(
        !bullet.includes('unshare'),
        'README names unshare, but the CI workflow no longer uses it',
      );
    }
    if (ci.includes('iptables')) {
      assert(
        bullet.includes('iptables'),
        'README must mention the iptables network block that CI actually runs',
      );
    }
  });
});
