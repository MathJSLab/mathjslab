# Architecture review before publication

Reviewed against the working tree based on 2.8.1, on 2026-10-12. No version
change or publication was part of that review. The subsequent pre-publication
preparation sets the package version to 2.9.0 without committing or publishing.

## Assessment

Retain the shared generator execution model and a single core identity per
realm. Rewriting the entire evaluator would couple language semantics,
numerical storage, scheduling and distribution. Correct concrete ownership and
transport defects and narrow types at their guards instead.

| Boundary            | Assessment and decision                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grammar/AST         | Keep generated changes in grammar sources. Separate strict expressions, runtime values and intentional execution LIST carriers.                                                                               |
| Interpreter/Context | Interpreter retains evaluation order; Context owns binding, dispatch and access. Both drivers use shared script, call, superclass and assignment algorithms.                                                  |
| ExecutionMachine    | Continuations are single-use. Cancellation uses bounded cleanup with no rollback. Long numerical kernels remain indivisible.                                                                                  |
| Session lifecycle   | One execution owns a workspace. Reject overlapping evaluation; cancel and await unwind before reset or local disposal clears storage.                                                                         |
| Host effects        | Local and remote clients share one abort race, invoke the host once and remove listeners on every exit. Worker effect records are removed on cancellation.                                                    |
| Sources/workspaces  | SourceResolver is a synchronous virtual lookup with host-prefetched manifests. Source identity differs from canonical symbols. Preserve script locals/imports and persistent/global/captured scope lifetimes. |
| Classes             | Scalar constructors, methods and superclass calls use shared function requests. Access grants exist only while advancing. Callbacks, arrays and overloaded indexing retain documented synchronous boundaries. |
| Numerical code      | Group original observations once; retain shared var/std kernels and backend operations. Do not reorder accumulation or chain partial statistics.                                                              |
| Environment         | RuntimeEnvironment scopes static numeric facades around synchronous operations, restoring settings before waits. This provides cooperative session isolation.                                                 |
| Transport           | Existing string components preserve decimals; packed Float64 buffers are used only when numeric textual identity survives conversion. No wire version change is necessary.                                    |
| Distribution        | Runtime imports the public core; Workers use relative platform core imports. Installed-tarball tests validate export targets and declarations.                                                                |
| Verification        | Cycles, production/ES2015 types, boundary tests and real consumers check different invariants. Source-text tests supplement behavioral regressions.                                                           |

## Delivered corrections

Two local executions could previously share the interpreter while suspended.
Reset could replace that interpreter while an old continuation still restored
its context through the session. Disposal could clear storage before cleanup
completed. The session now rejects concurrent execute with
MATHJSLAB_SESSION_BUSY and rejects concurrent parse with the same code. Reset
cancels active execution and awaits unwind before replacing interpreter and
numeric environment. Local disposal awaits unwind before clearing storage.
Independent sessions continue to progress concurrently.

Workers use this same session guard. Remote reset aborts outstanding host
contexts; cancelled Worker effect records are removed and late replies ignored.
Remote error reconstruction preserves serialized diagnostic codes.

The general expression adapter now declares ExpressionBoundaryValue rather than
hiding its guarded result behind NodeExpr/any. Numerical and storage users
apply runtime guards, strict dispatch users apply strict guards, and assignment
copying uses RuntimeValue.copy so lazy return lists preserve existing behavior.
Context callable probing accepts unknown and identifier resolution exposes its
actual expression result contract. spfun materializes named callback return
lists before storage and invokes callbacks once per nonzero element; these
callback bodies remain synchronous.

Decimal arrays previously crossed runtime boundaries through Float64
unconditionally. They now use the existing recursive representation when the
conversion loses precision, underflows or overflows. Exact numeric values
retain transferable buffers. Signed zero is preserved in textual scalar
components.

## Remaining boundaries

- Interpreter and CoreFunctions remain large coordinators. Extract cohesive
  modules only with semantic regressions; moving code alone does not improve
  execution efficiency.
- Legacy NodeExpr/any remains in parser/root builders and ten operational
  Interpreter annotations. Context no longer has operational annotations. Other
  modules have independent legacy sites; the production tree is not wholly free
  of any.
- Property/event callbacks, object arrays, overloaded indexing and load inside
  user functions retain the limits in resumable-execution.md. Source lookup is
  synchronous; suspension is not universal.
- A host promise cannot be forcibly stopped. Runtime cancellation releases its
  own listeners/maps; hosts must stop external work when signalled.
- Static numeric facades remain process-global for direct synchronous users.
  Decode uses the receiving numeric backend. Backend negotiation and persisted
  or transferable continuations are outside the current contract.
- Worker messages are a typed/versioned trusted-adapter boundary, not a
  complete validator for arbitrary untrusted messages. Wire-schema validation
  requires a separate contract increment.
- Grouping can allocate permutation/reshape intermediates. No performance gain
  is claimed without benchmarks; preserve accumulation order in future work.
- Native MATLAB verification and complete dialect parity remain unavailable.
  Selected native Octave examples do not prove compatibility for every case.

## Publication gates

Run complete unit/integration suites, dependency-cycle checks, root and
production/ES2015 types, declarations, lint of changed sources, all production
bundles, bundle tests and installed-tarball Node/browser Worker checks. Remote
CI is optional for this workflow. Documented unsupported features are scope
boundaries, not claims of complete MATLAB compatibility.

Remote runtimes apply sessionDefaults.parfor with per-session overrides.
Interpreter configuration and evaluate hooks must be installed inside a custom
Worker server; passing local callbacks or default interpreter configuration to
the remote factory is rejected explicitly instead of silently ignored.

Remote ownership covers the complete parfor coordinator operation, not just
individual Worker commands. Reset/interrupt/disposal propagate cancellation to
child sessions. Remote reset waits for operation/child shutdown and recreates
the Worker; it uses hard preemption and does not execute language cleanup in
the terminated Worker. Local reset performs the retained-machine unwind before
replacing the interpreter. Neither cancellation mode rolls back completed host
effects.

## Verified result

- Unit suite: 1,596 tests in 71 suites passed. The final remote lifecycle suite
  also passed independently after the runner-cleanup barrier change.
- Integration: 1,211 tests passed (9 architecture, 938 compatibility, 208
  parser fixtures, 11 function infrastructure, 5 package/source and 40 m-file
  tests).
- Distribution: all 11 production bundles built; the three remote runtime
  bundles were rebuilt after the final coordinator change. All 33 bundle tests
  passed, including the real Node Worker ownership/reset/decimal regression.
- Root, production and ES2015 type checks and declaration generation passed.
- Dependency analysis found no cycles in 155 source/test modules. Formatting
  and diff checks passed. Lint found no errors; three existing unused
  catch-binding warnings remain in Interpreter. Web bundle-size/analyzer
  warnings remain.
- A fresh installed tarball passed export/declaration/CJS/ESM checks, native
  Node Worker execution and Chrome 154 native Workers (two Workers, 12 delays),
  including exact decimal transport and named callback materialization. Local
  artifacts are in test-results/release-k5oTMt; the full unit log is
  test-results/architecture-unit-final.log.
- Package version was 2.8.1 when these gates ran; pre-publication metadata now
  identifies 2.9.0. No publication or remote CI run was performed.

Within these verified and documented boundaries, no unresolved failure remains
in the local release gates. This is not a claim of universal suspension, a
fully strict parser type model, or comprehensive native MATLAB compatibility.

## Pre-publication preparation for 2.9.0

Release notes, package/lock versions and the local commit-message configuration
were prepared without a commit or publication. Public contract JSDocs and the
generated API reference were refreshed. General types, declarations, lint,
formatting, nine architecture tests and 52 local documentation links passed.
The 2.9.0 installed-tarball gate passed with native Node and Chrome Workers;
artifacts are in test-results/release-a1SURU. Runtime code is unchanged by this
preparation, so the full behavioral results above remain applicable.

All files mapped by copy.repo.config.json match the local MathJSLab/.github
checkout, including its mathjslab-specific formatter resource. No file needs to
be mirrored for this release. Package-specific validation scripts/workflow and
API documentation remain owned by this repository.
