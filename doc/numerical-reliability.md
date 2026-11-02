# Reproducibility and effective numerical precision

## Interpreter random streams

Each interpreter owns a stream shared by language `rand` and `randi` calls. New
interpreters and `RuntimeSession.reset()` start at seed 0.
`Interpreter.Restart()` also resets the stream; `clear`, including `clear all`,
preserves its position. Two sessions with the same seed intentionally produce
the same stream, rather than automatically independent statistical substreams.

```matlab
rng(42);
saved = rng();
A = rand(2,3);
B = randi([-3,4],2,3);
rng(saved);
isequal(A,rand(2,3)) && isequal(B,randi([-3,4],2,3))
```

Supported forms: `rng()`, `rng(seed)`, `rng(seed,'xoshiro128ss-v1')`,
`rng('default')`, `rng('shuffle')`, and `rng(saved)`. A setter returns the
previous state. Seeds are integers in [0,2^32-1]. State structures contain
`Type`, `Seed`, and a four-word numeric `State` vector. Snapshots are detached;
invalid seeds, types and states do not alter the stream. State structures can
be restored in another interpreter. There is no MATLAB/Octave twister state or
sequence compatibility; unsupported generator names are rejected.

The versioned algorithm uses
[xoshiro128** 1.1](https://prng.di.unimi.it/xoshiro128starstar.c). Seed
expansion starts from the seed and stores four consecutive words from
`word = (1664525*word + 1013904223) mod 2^32`. The all-zero state is rejected.
Each uniform sample takes two words, retaining their upper 27 and 26 bits, and
forms `(high*2^26+low)/2^53`. `rand` samples the binary64 grid in [0,1) before
wrapping the result in the selected backend. A decimal backend does not add
random bits to this 53-bit sample. Changing numeric precision does not change
the generator position or word sequence.

`randi(imax)` samples inclusive [1,imax]; `randi([imin,imax])` supports equal,
zero and negative bounds. Bounds must be safe integers and their inclusive
width must not exceed 2^32. A word in the incomplete top interval is rejected
before reduction modulo the width, avoiding endpoint and modulo bias. Elements
consume the stream in native column-major order; empty arrays consume nothing.
Rejected arguments consume nothing. A constant integer interval still consumes
one word per element. Direct `CoreFunctions.randi` uses its existing backend
randomness source with the same corrected integer mapping; direct host
`Complex.random` and `CoreFunctions.rand` are outside the interpreter-owned
stream.

Suspension keeps the same stream object. Local cooperative cancellation,
timeout and errors preserve draws already consumed and do not execute pending
draws. There is no rollback. Terminating/replacing a Worker can discard its
entire workspace, including generator state; this does not provide continuation
persistence. `shuffle` mixes host time and host pseudorandomness into a uint32
seed; it promises neither uniqueness nor cryptographic entropy. These streams
are not cryptographic, and the numeric backend's `crypto` setting does not
change the language generator. `randn`, `randperm` and parallel substreams are
not introduced by this milestone.

## Precision is a property of each algorithm

[Decimal.js precision](https://mikemcl.github.io/decimal.js/#precision)
controls significant digits of decimal arithmetic. It does not replace explicit
tolerances or JavaScript number conversions in the surrounding algorithms.
`getconfig('precision')` reports the backend setting, not certified result
accuracy. The number backend uses binary64 and ignores attempts to increase its
arithmetic precision.

| Operation                                            | Effective implementation and limits                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scalar arithmetic                                    | Selected backend; decimal precision and rounding apply to arithmetic, number remains binary64. Comparison reduction has its own `precisionCompare` setting.                                                                                                                                                             |
| `rand`                                               | At most 53 random bits per sample on both backends; decimal storage adds no entropy.                                                                                                                                                                                                                                    |
| `randi`                                              | uint32 word sampling; safe integer results, inclusive width at most 2^32.                                                                                                                                                                                                                                               |
| Symmetric/Hermitian `eig`                            | Normalize by largest absolute real/imaginary component before reduction, then rescale eigenvalues and diagnostic T. Jacobi has a fixed 1e-14 stopping tolerance on normalized values and an iteration limit. Decimal precision is not a promise of equally many accurate eigenvalue digits.                             |
| `rank`                                               | Normalize input, estimate largest singular value, then count partial-pivot elimination pivots. Default normalized tolerance is `max(size(A))*Number.EPSILON*sigmaMax`; explicit tolerances are divided by input scale. Elimination converts values to number. This is an estimate, not a full SVD singular-value count. |
| `cond(A,2)`                                          | Eigenvalues of a normalized Hermitian Gram matrix, using the complex-capable solver. Forming a Gram matrix squares conditioning. The existing cutoff `lambdaMin <= 1e-14*lambdaMax` returns Inf, so estimates near/above 1e7 are not resolved reliably.                                                                 |
| `cond(A,1)`, `cond(A,Inf)`, `cond(A,'fro')`, `rcond` | Existing norm/inverse path and LU pivot policy. Some norm accumulation uses number. This cycle does not certify extreme scaling or high decimal accuracy for those paths.                                                                                                                                               |

Hermitian recognition uses exact stored real/imaginary component equality,
including a real diagonal; it does not apply display/comparison rounding or
project an approximately Hermitian matrix. Nonfinite decomposition inputs are
rejected. Numerical kernels remain indivisible.

`RandomReproducibility.spec.ts` checks reference words, rejection sampling,
replay, atomic errors, reset/clear, cancellation and interleaved sessions.
`NumericalPrecision.spec.ts` protects normalized residuals and orthogonality
below 1e-11 on stated small real/complex examples at scales 1e-150, 1 and
1e150, on both backends. These are regression tolerances, not universal error
bounds. `random-cycle.m` runs the public contract against the installed package
in Node/browser Workers and app/Markdown adapters.

Further work should replace Gram-based singular estimates with a direct SVD,
establish scale-aware LU policies, and add convergence diagnostics before
claiming arbitrary-precision decompositions or broader numerical stability.
