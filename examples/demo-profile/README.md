# demo-profile -- synthetic test data (FAKE)

Every file under this directory is **synthetic test data**. Each file carries
the literal marker `SESSGUARD-FAKE-FIXTURE` and every fake secret value is
prefixed `SESSGUARD-FAKE-`. There are **no real credentials** here.

The test suite and the demo run `sessguard` against this directory via the
`SESSGUARD_ROOT` environment variable, so the demo never touches real
credential stores. The redaction self-test (`npm run selftest`, also run in
CI) asserts that no `SESSGUARD-FAKE-*` secret value ever appears in the JSON
output.
