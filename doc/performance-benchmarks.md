# Reproducible performance baselines

The benchmark tools measure the distributed Node ESM core and runtime. They do
not import TypeScript sources, rebuild files, change public APIs, or optimize
any kernels. Run development tools with Node.js 20 or newer from the repository
root. The library's existing runtime engine requirement is unchanged.

```sh
npm run build:types
npm run build:prod
npm run test:bench
npm run bench:smoke
npm run bench -- --out test-results/benchmarks/baseline.json
npm run bench -- --out test-results/benchmarks/candidate.json
npm run bench:compare -- test-results/benchmarks/baseline.json test-results/benchmarks/candidate.json
```

Reports are created exclusively and flushed to disk; an existing report is
never overwritten. The default path is a timestamped file under ignored
`test-results/benchmarks/`. Keep/promote raw JSON alongside any performance
claim. Reports include exact bundle SHA256 hashes, package version/root,
benchmark file hashes, Node/V8, OS/release, CPU model/count, physical memory
and process flags. A package version alone does not identify an uncommitted
build. Build explicitly before measuring changed sources. `--package ROOT` can
point to an installed tarball's `node_modules/mathjslab` directory. No
dependency installation or network access is performed by the benchmark runner.

## Workloads and boundaries

Each case/backend runs in a fresh, sequential child process. Inputs, imports,
configuration, reference calculations and steady-session preparation are
outside timing. Each warmup and measured result is verified, and verification
is outside the timed operation. An invalid result, process error or timeout
records a failed case with no accepted samples and causes exit code 1. Cases do
not run concurrently. Setup and child process startup are not timed except for
the explicitly named Worker lifecycle operation.

| Case                                             | Timed operation                                                                                                                             | Independent check                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `parse.program`                                  | Parse a fixed assignment/increment program.                                                                                                 | Normalized AST and analytic sum of its execution.                             |
| `evaluate.preparsed`                             | Evaluate the already parsed program, including ordinary evaluator/workspace costs.                                                          | Last result equals the analytic triangular sum.                               |
| `matrix.multiply`                                | Dense direct matrix multiplication with threshold 100000, block size 64.                                                                    | Every element matches a separately calculated dyadic reference.               |
| `matrix.multiply-blocked`                        | Same matrices, threshold 1 and block size 8 to exercise tiling.                                                                             | Same elementwise reference.                                                   |
| `reduce.pages`                                   | Sum along dimension 2 of a deterministic N-D array.                                                                                         | Shape and every page/row sum match a native reference.                        |
| `codec.encode-packed`, `codec.decode-packed`     | Lossless codec conversion of representable dyadic numeric arrays.                                                                           | Entire encoded structure, typed arrays and shape match.                       |
| `codec.clone-packed`                             | Node `structuredClone` of an encoded packed array.                                                                                          | Deep equality with the reference.                                             |
| `codec.transfer-packed`                          | One in-process `structuredClone` ownership transfer, with reusable ping-pong ownership.                                                     | Prior buffer is detached and received contents match. This is not Worker IPC. |
| `codec.encode-lossless`, `codec.decode-lossless` | Decimal-only codec path containing a value that cannot round-trip through Float64.                                                          | All decimal strings survive encode/decode exactly.                            |
| `worker.startup`                                 | Backend bootstrap, native Worker/session creation, configure/query, first numeric execute, runtime disposal and awaited native termination. | Backend query, execution status and scalar result.                            |
| `local.steady`, `worker.steady`                  | Execute a small reduction in an already prepared session.                                                                                   | Analytic sum 11440.                                                           |
| `local.payload`, `worker.payload`                | Execute and return a fixed matrix from an already prepared session.                                                                         | Every transported value and its shape.                                        |

Runtime cases include parsing, execution, text/MathML rendering and encoding;
remote cases also include protocol/IPC. They do not isolate transport latency.
Subtracting local and remote times is not a measurement of pure IPC cost. The
explicit transfer case measures Node structured cloning, not a browser or
message-channel implementation. Browser performance is not baselined here.

Workers use the existing public `workerFactory` option and native Node Worker
protocol. A benchmark-only bootstrap selects the unique distributed core's
backend before sessions/native values are created. It is used for both backends
and included in lifecycle timing. Benchmark setup does not switch the engine
within an executing parsed program; this is a separate runtime configuration
concern, not an assumed benchmark capability.

## Fixed profiles and numeric settings

| Profile  | Program increments | Matrix order | Reduction shape | Codec/payload shape | Default warmups/samples |
| -------- | ------------------ | ------------ | --------------- | ------------------- | ----------------------- |
| smoke    | 24                 | 8            | 4 x 5 x 3       | 8 x 8               | 1 / 2                   |
| standard | 160                | 32           | 16 x 12 x 8     | 32 x 32             | 3 / 11                  |

Both `number` and `decimal` are measured. Decimal arithmetic uses precision 40
and precisionCompare 7; number keeps its actual fixed settings. BLAS settings
are explicitly applied and recorded. Matrices use the fixed formula
`((row*17+column*13)%31-15)/16`, with a row offset of 3 for the right operand.
No ambient randomness is used. There are 30 applicable case/backend pairs;
lossless decimal cases intentionally have no number counterpart. Changing
controller/workload/timing/bootstrap files changes the suite hash and
invalidates an automatic comparison with older definitions.

```sh
npm run bench -- --engines decimal --case matrix.multiply,matrix.multiply-blocked --samples 21 --warmups 5
npm run bench -- --package test-results/RELEASE/consumer/node_modules/mathjslab --out test-results/benchmarks/installed.json
npm run bench:smoke -- --gc --case codec.transfer-packed,worker.startup
```

`--gc` launches each case child with `--expose-gc` and calls GC before measured
samples, outside timing. It does not force GC inside Worker heaps. Without this
flag no forced GC is requested; ordinary JIT/GC activity remains in the
samples. Other controller `execArgv` flags are recorded but not forwarded to
case children; case children receive only the optional `--expose-gc`, and the
benchmark Worker uses an explicit empty execArgv list. Memory fields are
before/after process `heapUsed`, RSS and ArrayBuffer deltas, not peak usage or
total allocations; they can be negative and do not isolate Worker heaps.

## Reading and comparing results

Raw timings use the monotonic `performance.now()` clock in milliseconds and
include the await boundary of the runner. Summaries retain every sample and
report minimum, median, nearest-rank p95, maximum and median absolute deviation
(MAD). For an even sample count the median is the mean of the central pair.
With eleven samples p95 is an observed upper sample, not a reliable tail SLA or
a confidence interval. No outliers are deleted.

The smoke profile verifies operation/results and process cleanup, not speed. Do
not infer gains from a smoke run. Use a quiet machine, fixed power policy, the
same Node/OS/CPU/settings and repeated standard runs. Record unrelated load,
thermal effects or virtualization changes separately; matching metadata cannot
prove equal operating conditions. Small clone/transfer cases can be dominated
by timer, scheduling or allocation noise.

The comparator recomputes statistics from raw samples. It refuses automatic
assessment for different environments, suite hashes, profiles, numeric/BLAS
settings, warmup/sample counts or case selections. Different bundle hashes are
expected when comparing an implementation change and remain visible in the
source reports. Fewer than five samples, smoke profiles, or MAD/median above
10% are inconclusive for timing gates. The MAD rule is a heuristic, not a
statistical significance test.

```sh
npm run bench:compare -- baseline.json candidate.json --threshold 20 --gate
```

Without `--gate`, a stable slowdown is advisory. With it, a median increase
above the chosen percentage can fail: exit 0 means within policy, exit 1 a
stable threshold regression, and exit 2 an incompatible/invalid/inconclusive
comparison. A report with failed/missing cases cannot pass a gate. Never use
cross-backend, cross-machine or differently configured readings as a regression
claim. Thresholds are opt-in; this milestone adds no timing limits to CI.

## Maintenance and validation

`npm run test:bench` checks statistics, raw-sample comparison, incompatible
metadata, CLI operation against built distributions, report preservation,
failed results and timed-out child cleanup. It requires built bundles and is
separate from source-only integration tests. It has correctness assertions, not
speed thresholds. Existing functional regressions remain authoritative for
mathematical correctness and accumulation order.

Before optimizing, retain two repeat runs, inspect noise, select the workload
that demonstrates the problem, then compare one change at a time. Preserve
functional results and accumulation order. Larger realistic matrix shapes,
transport-specific probes, browser baselines, direct SVD/LU stability work and
additional benchmark profiles are subsequent work, not claims of this baseline.

The [first recorded baseline](performance-baseline.md) preserves the observed
variation and the backend-transition follow-up exposed during setup.
