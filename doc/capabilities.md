# Current capabilities and development milestones

This is the current support matrix. Historical implementation increments in
other guides explain how the engine evolved; they do not override this matrix.
Supported means covered for the stated subset, not complete MATLAB/Octave
parity.

| Capability                                                                    | State             | Contract and regression coverage                                                                                                   |
| ----------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Parser, normalized AST and contextual syntax                                  | Supported subset  | `test/parser`, `doc/parser-contextual-boundaries.md`                                                                               |
| Functions, closures, defaults and output masks                                | Supported subset  | `FunctionArguments.spec.ts`, `ExecutionMachine.spec.ts`                                                                            |
| Scalar methods, constructors and superclass calls with waits                  | Supported subset  | `ExecutionMachine.spec.ts`, `InProcessRuntime.spec.ts`                                                                             |
| Native reads, returned receivers and matrix/cell literals with waits          | Supported subset  | `ExecutionMachine.spec.ts`, `InProcessRuntime.spec.ts`                                                                             |
| Native indexed multiple-output destinations                                   | Supported subset  | `RetainedAssignmentsAndLoad.spec.ts`: numeric, cell, structure, dynamic fields, overlapping writes, `end`, errors and cancellation |
| `run`/`source` and resource `load` in function workspaces                     | Supported subset  | `RetainedAssignmentsAndLoad.spec.ts`, shared script lifecycle; nested loads bounded at 16                                          |
| Finite symmetric/Hermitian `eig`                                              | Supported subset  | `HermitianEigen.spec.ts`, `LAPACK.spec.ts`; one, two and three outputs, both backends                                              |
| General non-Hermitian `eig`                                                   | Rejected; planned | Explicit diagnostic until a general eigensolver is implemented                                                                     |
| Direct `pause`/`load` as value-producing operands                             | Rejected          | `MATHJSLAB_EFFECT_POSITION`; these commands do not produce expression values                                                       |
| Input/output/name-value/repeating validators and bounds with waits            | Supported subset  | `ResumableValidation.spec.ts`, shared `FunctionArguments` generators and retained call frames                                      |
| Property defaults and named stored-scalar property validation                 | Supported subset  | `ResumableValidation.spec.ts`; defaults precede constructor inputs, validation precedes writes                                     |
| Dynamic `eval`/`evalin`/`evalc` with waits                                    | Supported subset  | `ResumableDynamic.spec.ts`; shared parser/catch lifecycle, output masks, caller/base scopes                                        |
| Class accessors, subscript overloads, events, concatenation and object arrays | Supported subset  | `ResumableClasses.spec.ts`; retained property/descriptor traversal, callback selection, output masks and notification cleanup      |
| Synthetic loop destinations and SPMD count preparation                        | Supported subset  | `ResumableDynamic.spec.ts`; native binding writer, ordered count expressions; SPMD remains sequential                              |
| Coercions, conditions, subsindex and built-in/mapped callbacks                | Supported subset  | `ResumableProtocols.spec.ts`; logical/switch protocols, native descriptors, broadcasting, nthargout and spfun                      |
| Numerical kernels and storage                                                 | Supported subset  | BLAS/LAPACK and N-D tests; a numerical operation remains indivisible                                                               |
| Sparse storage                                                                | Partial facade    | Dense compatibility representation; real sparse storage is outside this cycle                                                      |
| Local and remote session isolation/cancellation                               | Supported         | `InProcessRuntime.spec.ts`, `RemoteRuntime.spec.ts`; local cooperative unwind vs remote Worker termination                         |
| Packaged Node/browser Workers                                                 | Supported subset  | `mathjslab.runtime-cycle.spec.ts`, `validate-installed-package.mjs`; installed tarball gate                                        |
| App examples and Markdown adapter                                             | Consumer gate     | `npm run test:consumers` with sibling checkouts; does not imply complete application UI coverage                                   |
| Seeded session-local rand/randi and state restoration                         | Supported subset  | `RandomReproducibility.spec.ts`, `random-cycle.m`; xoshiro128ss-v1, not twister sequences                                          |
| Effective precision and scaled eig/rank/cond(A,2)                             | Audited subset    | `NumericalPrecision.spec.ts`, [numerical contract](numerical-reliability.md); Gram/SVD and LU limits remain                        |
| Educational polynomials and sampled integration                               | Supported subset  | `EducationalMath.spec.ts`, `educational-math-cycle.m`; [contracts](educational-math.md)                                            |
| Numeric backend at session creation                                           | Supported subset  | `NumericSessionConfiguration.spec.ts`, installed Node/browser sessions; [contract](numeric-sessions.md)                            |
| Changing a live session backend                                               | Supported subset  | `configure` converts live graphs while preserving workspace and aliases; [contract](numeric-sessions.md)                           |
| Distributed Node performance baselines                                        | Supported subset  | `npm run bench`, `npm run test:bench`; [methodology](performance-benchmarks.md); timing gates opt-in                               |

## Numerical `eig` contract

The public wrapper accepts real scalars and finite square numeric matrices
satisfying exact backend equality `A(i,j) == conj(A(j,i))`, including a real
diagonal. It does not silently project approximately Hermitian matrices onto
this domain. General matrices and NaN/Inf inputs are rejected before reduction.

`eig(A)` returns an ascending n-by-1 eigenvalue vector. `[V,D]=eig(A)` returns
paired eigenvectors and a diagonal eigenvalue matrix: `A*V ≈ V*D` and
`V'*V ≈ I`. `[V,D,T]=eig(A)` adds the package's diagnostic tridiagonal matrix,
not a generalized eigenvalue problem. The Householder reduction satisfies
`A ≈ Q*T*Q'`; Q can be reconstructed with the low-level `hetrd`/`ungtr`
helpers. T is not a diagonalization by V. Inputs are copied before destructive
reduction.

For an empty 0-by-0 input, one output is 0-by-1; V, D and T in multiple-output
calls are 0-by-0. A scalar gives V=1, D=A and T=A. Repeated eigenvalues have no
promised eigenvector basis. The helper's `desc` order reverses eigenpairs
together; `none` retains the solver order (currently ascending). `blockSize`
remains a reserved compatibility argument for the unblocked reduction.

The tridiagonal solver uses a numerical convergence tolerance; choosing decimal
arithmetic does not promise that every decomposition achieves arbitrary decimal
accuracy. Regressions require normalized reconstruction/eigenpair residuals and
orthogonality below 1e-11 on small representative matrices in both backends.
`hetrd` returns the lower off-diagonal; the dense constructor and
`steqr_vectors` accept the upper off-diagonal. Adapters conjugate at this
boundary.

## Retained validation milestone

Function inputs, outputs, name-value options, repeating groups and repeating
outputs share resumable declaration/validator generators with the synchronous
API. Validator value operands and bounds are evaluated in order exactly once.
Shape and class errors retain their earlier validation points. Output masks
select which outputs are validated; expressions use one usable result without
inheriting ignored-output masks. Temporary repeating/property scopes and owning
function frames are active only while advancing and are detached before waits.

Property defaults are evaluated once in declaration order, followed by property
validation, before constructor inputs. Named scalar stored-property writes
validate before committing. Class property, descriptor and array paths now
share the retained callback traversal described below. Host file/folder
predicates remain synchronous boolean callbacks. Waits belong inside supported
user function bodies, not direct pause/load value operands.

## Retained dynamic execution and loop preparation

The original eval, evalin and evalc built-ins execute parsed text through the
shared machine. Source and catch operands are evaluated once; requested output
counts and ignored-output masks survive waits, including feval/builtin
forwarding. Catch text handles ordinary errors after suspension; cancellation
and language return/break/continue signals bypass it. Static workspace
restrictions and caller/base workspace resolution retain their synchronous
semantics. Built-in and transient evaluation frames are restored only while
advancing code, then detached before host waits. evalc preserves its existing
result-text capture contract; this milestone does not add a console-output
stream.

Synthetic for assignments use the shared assignment writer: native indexed
numeric/cell/structure targets and supported named scalar property validation
can suspend during binding. The range is evaluated once, indices once per
binding, and completed writes remain after later failures. Excluded class
accessors, overloaded indexing and object-array targets remain boundaries. SPMD
counts evaluate left to right, validate before entering the body, and restore
temporary worker names on exit. SPMD remains sequential; existing parallel-loop
scheduling policies are unchanged.

ResumableDynamic.spec.ts covers synchronous equivalence, output selection,
static scopes, control transfers, host failures and
abort/timeout/reset/dispose. The dynamic-cycle fixture also runs against the
installed tarball in Node and browser Workers and the application/Markdown
adapters.

## Retained class callbacks

Property reads and writes retain getters/setters, validation and observable
PreGet/PostGet/PreSet/PostSet callbacks. Named and dynamic fields, nested
property paths, selected object/cell contents and multiple-output destinations
reuse the existing assignment rules. AbortSet keeps its equality shortcut.
Handle mutations already completed are preserved on later failure; value-class
replacement commits only after the writer completes its existing operation.

Subscript overloads retain the complete descriptor chain and output mask.
numArgumentsFromSubscript and end can wait; helper outputs are isolated from
ignored caller outputs. Public subsref/subsasgn and SetGet get/set use the same
traversal. Scalar/array methods, functional method calls, destructors, event
listeners and overloaded horizontal/vertical concatenation retain progress.
Listeners use the existing snapshot/order and recursive-notification guards;
finally clears active guards on error or cancellation. Class access, call
frames and output metadata are detached during host waits and restored while
advancing.

ResumableClasses.spec.ts verifies synchronous equivalence, private access,
handle/value behavior, ignored and overlapping outputs, failures and
abort/timeout/reset/dispose. classes-cycle.m runs against the installed package
in Node/browser Workers and the app/Markdown adapters. The protocol audit below
extends this traversal to coercion, index conversion and mapped/selected
callable results. Numeric kernels remain indivisible and no rollback is
introduced.

## Retained coercion, indexing and native callbacks

Implicit logical conversion in conditions and short-circuit expressions, switch
equality, assert and listener flags now use shared resumable protocols.
Conversion helper results use one requested output and an independent mask;
outer ignored outputs do not suppress required helper results. Scalar built-in
class overloads retain their original built-in frame and validated dispatch.
Explicit builtin bypasses and existing rejection domains remain unchanged.

Native numeric/cell/string indexing, public descriptors and stored-property
paths retain subsindex conversion, including object index arrays. Results must
be zero-based real nonnegative integers and are shifted once to native
one-based indices. Private descriptor copies cache converted indices without
mutating the caller's descriptor. Receiver validation, read/copy/write order
and pending assignment failures are preserved; failed conversions are not
missing-element growth. Native descriptor calls keep method arguments
unconverted.

Broadcast operator traversal retains its native column/page order through a
shared iterator. The public synchronous mapBroadcasted callback contract stays
unchanged. Compound assignments retain operator calls before publishing
results. nthargout resolves one callable, retains its total output count and
selects from one completed invocation. spfun retains the nonzero-element
cursor, requests one usable output per callback and validates scalar results
before writing each slot. Completed effects remain after failure/cancellation;
this introduces no rollback.

ResumableProtocols.spec.ts covers synchronous parity, callback order, ignored
outputs, invalid results, errors, abort/timeout/reset/dispose and interleaved
session precision. protocols-cycle.m exercises the installed Node/browser
Worker and app/Markdown adapters. Kernels remain indivisible, host source
resolvers and file/folder predicates remain synchronous contracts, and
pause/load still have no value-producing operand form. Supported subsets are
not a claim of complete MATLAB/Octave compatibility or universally suspendable
host callbacks.

## Next milestones

1. Validate the application in development against the core candidate; see
   [handoff](development-handoff.md).
2. Extend interpolation and fitting from demonstrated examples, building on the
   polynomial and sampled-integration subset.
3. Improve direct singular-value estimation, LU scale policies and convergence
   diagnostics; see [numerical reliability](numerical-reliability.md).
4. Use repeatable performance evidence before optimizing storage, transport or
   kernels; see [benchmark methodology](performance-benchmarks.md).

Each migration uses a shared synchronous/resumable algorithm, tests retained
effects and failure cleanup, then validates the packaged consumer. It does not
introduce rollback, persisted continuations or preemptible numerical kernels.
