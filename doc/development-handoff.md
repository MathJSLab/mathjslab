# Core candidate and application development handoff

The core candidate consolidates Hermitian eig correctness, retained
assignments, loaded scripts, validations, dynamic execution, class protocols,
reproducible randomness, educational math, benchmarks and numeric session
creation. Current domains and explicit rejections remain in
[capabilities](capabilities.md).

## Reproducible core gate

```sh
npm run docs
npm run test:candidate
```

`docs` updates the generated reference deliberately before validation. The gate
checks it with `docs:check`, which never rewrites the file. The complete gate
checks general/ES2015 types, docs, cycles, units, integration, declarations,
production bundles, bundle tests, benchmark harness/smoke and the installed
tarball with Node/browser/app/Markdown consumers. It does not publish, commit,
bump versions, fix lint or modify source/docs/configuration files. A source
fingerprint before/after the gate enforces that property. Build artifacts, test
reports and temporary consumer installations are expected outputs.

Logs and fsynced progress records are under `test-results/candidate-*`; a
failed step stops the gate and leaves a final report. Run the gate again after
any required source change. Offline installations can use the existing
`MATHJSLAB_RELEASE_OFFLINE=1` and `MATHJSLAB_RELEASE_NPM_CACHE` settings;
normal dependency/cache preparation remains the host's responsibility. Sibling
app and Markdown checkouts and a Chromium executable are required for the
consumer gate.

## Next application changes

1. Install the verified tarball into the application development environment;
   keep core and runtime/Worker assets from the same build. Do not substitute
   source imports for the installed package check.
2. Hosts can pass initial numeric preferences through
   `createSession({numeric})` or runtime `sessionDefaults.numeric`. The
   application exposes user selection through `configure('real',...)`,
   preserving workspace; see [numeric session contracts](numeric-sessions.md).
3. Live switches explicitly convert numeric graphs, preserving references and
   execution context. Number conversion has native precision and range limits.
   Do not replay prior code. A separately requested new session still starts
   with a fresh workspace and its own lifecycle.
4. Show the actual fixed precision for number arithmetic. Validate decimal
   precision/precisionCompare coherently. Confirm that app-owned runtime hooks
   and Markdown-owned sessions receive the intended numeric defaults.
5. Add native-library variants of Horner, polynomial products and trapezoidal
   integration examples; use `rng` for reproducible examples. Existing examples
   remain valid and are included in core consumer regressions.
6. Run the complete application dev/browser tests: simultaneous sessions,
   backend replacement, nested waits/loading, plots, cancellation, timeout,
   reset/dispose, Markdown diagnostic mapping and Worker cache refresh. The
   core adapter tests cover selected contracts, not the full application UI.

## Publication boundary

The package metadata and release notes now identify the 2.10.0 candidate. After
updating dependencies and passing application development tests, choose the
consumer peer dependency ranges, regenerate the candidate's
tarball/declarations, and rerun both core and application gates against that
exact artifact. Review the 2.10.0 changes and distribution contents, then
publish core and update the application/Markdown dependencies in the agreed
order. No publication is performed by the core candidate gate, and no complete
MATLAB/Octave parity or universal async-kernel interruption is implied.
