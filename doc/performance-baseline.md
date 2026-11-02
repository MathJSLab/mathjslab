# First recorded Node benchmark baseline

Recorded for the benchmark milestone on 2026-11-01. These are observations of
one development environment, not speed requirements or cross-machine targets.
See [methodology and commands](performance-benchmarks.md).

## Identity and coverage

- Node v26.12.1 / V8 14.6.202.34-node.40, Windows x64, OS 10.0.19045.
- Intel Core i7-4770, two logical processors visible to Node, approximately 16
  GiB physical memory reported by the OS.
- Distributed MathJSLab 2.9.0; local bundles and the installed tarball have
  identical SHA256 hashes for the core and both Node runtime bundles.
- Standard profile, three warmups and eleven measured samples per case, normal
  GC behavior. Number backend actual precision 15; decimal precision 40.
- Thirty applicable case/backend pairs in each run, 660 measured samples across
  the two runs. Every computed/transported result passed verification.
- Final suite hash:
  `b40b49e5c7843ead9dbd21221b48c64db7349204b7ff15f00a91bc36076aae02`.

The raw local reports are under ignored `test-results/benchmarks/`:

- `baseline-verified-2026-11-01.json`: distributed local core/runtime.
- `repeat-installed-verified-2026-11-01.json`: installed tarball.
- `gc-verified-2026-11-01.json`: separate smoke check of explicit GC with
  matrix multiplication, buffer transfer and Worker lifecycle on both backends.

These raw reports are not shipped in npm or treated as a portable CI baseline.
Regenerate them with the documented commands; retain their full metadata when
making a performance claim. Earlier pilot reports use older suite hashes and,
in some cases, Node v26.7.0; they are not interchangeable with this baseline.

## What the repeat run showed

| Case                    | Local median ms | Installed repeat median ms | Assessment                      |
| ----------------------- | --------------: | -------------------------: | ------------------------------- |
| number/matrix.multiply  |           1.526 |                      1.110 | Noisy                           |
| decimal/matrix.multiply |          37.957 |                     77.688 | Noisy                           |
| decimal/reduce.pages    |           5.982 |                      7.810 | +30.56% threshold alert         |
| number/worker.startup   |         461.352 |                    367.541 | Noisy                           |
| decimal/worker.startup  |         386.202 |                    358.355 | Within the configured threshold |

The comparator found matching environment/configuration/workload metadata.
Twenty-two rows were inconclusive due to MAD/median above 10%, seven were
within the default threshold, and one produced a threshold alert. The opt-in
gate returned exit 2 because the overall comparison was inconclusive.

The bundles are identical: the reduction alert is run-to-run timing drift, not
evidence of a code regression. Low within-run MAD does not rule out a shift
between runs. No result here justifies changing BLAS thresholds, accumulation
order, serialization formats or Worker scheduling. Establish a quieter
dedicated environment and repeat the relevant workload before tuning. Larger
transport-specific profiles and browser baselines remain future work.

## Functional follow-up exposed during setup

An existing Node runtime session accepts `configure("real","number")` and
subsequently reports `{real,number}`, but executing `1+1` then returns
`MATHJSLAB_EXECUTION_ERROR: evaluating undefined type '1'.` This was reproduced
separately from timed runs against the distribution.

The benchmark initializes each backend before creating sessions, through its
documented Worker bootstrap; both backends then pass all benchmark result
checks. This milestone does not repair mid-session backend transitions. Audit
those transitions and their native values/frames before assuming that changing
`real` in an existing session is safe. Production runtime code and numerical
kernels were not modified by the benchmark milestone.

The subsequent [numeric session contract](numeric-sessions.md) closes this
unsafe transition with explicit creation options and rejection of live backend
changes, and fixes the shared parser-factory binding across sessions. The
measurements above remain historical observations of the prior distribution.
