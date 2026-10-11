# Asynchronous runtime lifecycle

The in-process, browser Worker, and Node `worker_threads` runtimes implement
the same public `MathJSLabRuntime` and `RuntimeSession` contracts. This
document records the lifecycle guarantees that must remain equivalent across
adapters.

## Session guarantees

- Sessions owned by the same runtime have independent workspaces and numeric
  configuration.
- Disposing one session does not interrupt or reset another session.
- `runtime.dispose()` includes sessions whose Worker creation is still pending.
- Session and runtime disposal are idempotent.
- Calls started after session disposal reject with
  `MathJSLab runtime session is disposed.`.
- A remote session owns its Worker. Disposal terminates that Worker immediately
  so an executing or unresponsive Worker cannot make disposal hang.

## Cancellation and recovery

| Event                           | Result of active execution                                                               | Following operation                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| caller `AbortSignal`            | `cancelled`, `MATHJSLAB_ABORTED`                                                         | remote session creates a clean Worker; local session remains reusable |
| `session.interrupt(reason)`     | `cancelled`, `MATHJSLAB_ABORTED` for an active local effect; remote Worker is terminated | clean workspace for a recreated remote Worker                         |
| timeout                         | `timeout`, `MATHJSLAB_TIMEOUT`                                                           | session remains reusable; remote session recreates its Worker         |
| session disposal                | `cancelled`; remote diagnostic is `MATHJSLAB_DISPOSED`                                   | later calls reject as disposed                                        |
| Worker `error` / `messageerror` | `error`, `MATHJSLAB_WORKER_ERROR`                                                        | next remote operation creates a clean Worker                          |

In-process execution cannot preempt synchronous JavaScript evaluation. It can
cancel at statement boundaries, cooperative block/loop checkpoints, and while
awaiting host effects. Cancellation bypasses language catch and uses the
bounded unwind policy documented below. Remote runtimes provide hard preemption
by terminating the dedicated Worker.

## Host effects

The external-sequence migration and its typed execution boundaries are recorded
in [Resumable execution](resumable-execution.md). Control-flow blocks, ordinary
and anonymous calls in the documented subset now suspend; class/script frames
and remaining receiver/output patterns still require migration. Cancellation of
a host wait does not depend on the host honoring its signal.

Every in-process host effect receives the execution signal and optional
deadline. An active `interrupt`, timeout, external abort, or disposal aborts
that signal. Host adapters should stop their work promptly when the signal is
aborted.

Remote host effects use a per-effect controller. Worker termination aborts all
outstanding controllers and ignores late effect responses from the old Worker.

## Parallel loops

Eligible remote `parfor` work is distributed to child sessions. The original
execution signal and remaining deadline are propagated to every child.
Cancellation disposes the children in `finally`, returns a deterministic
cancelled/timeout result, and leaves the parent session reusable. Partial
sliced results are not committed to the parent workspace until all child
runners have completed successfully.

## Verification matrix

`RemoteRuntime.spec.ts` covers independent sessions, interrupt and timeout
recovery, disposal during execution and creation, Worker failure, host effects,
parallel cancellation, sliced output, broadcasts, and reductions.

`InProcessRuntime.spec.ts` covers workspace/configuration isolation,
pre-aborted execution, interrupt/timeout/disposal during host effects, retry,
structured output, host resources, and sequential `parfor` policy.

The published Node bundle test verifies a real `worker_threads` worker. Browser
and Node factories both adapt the same `RemoteMathJSLabRuntime`; lifecycle
behavior below their endpoint adapters is therefore exercised by the shared
remote-runtime suite.

Ordinary user calls can now wait inside a migrated body and return into a
retained caller expression. Their scopes and evaluated arguments stay with the
continuation; active CallFrames are removed during the wait and restored before
resume, host failure or cancellation cleanup. Arguments/defaults for ordinary
functions now use retained evaluator requests; loaded scripts in user functions
and remaining callable forms still need migration. The exact subset is
documented in [resumable execution](resumable-execution.md).

Anonymous function arguments and expression bodies now share the call request
driver with ordinary functions. Unary/range operands, conditional predicates,
switch selectors/case tests and loop headers retain their evaluated state
across waits. Existing closure, output-mask, numerical dispatch and condition
short-circuit rules are preserved. Class calls and dynamic script frames remain
outside this subset; see [resumable execution](resumable-execution.md).

Builtin inputs now use shared selective argument requests, followed by an
indivisible `operation` request for existing dispatch and validation. Native
index reads from simple named receivers retain their receiver and evaluated
indices, including the receiver used by `end`/colon. Classes and raw indirect
forwarding remain separate boundaries. No matrix storage or numerical/backend
implementation changes are included. See
[resumable execution](resumable-execution.md) for the integrated subset.

Assignment normalization and the original writer now serve both drivers through
private value/RHS/index requests. Native dotted/chained destinations retain
prepared descriptors and dynamic field names before the RHS, at their original
validation points. Direct writes retain their RHS-before-index order. Numeric,
string, cell and structure read chains retain intermediate receivers and expand
comma-separated lists once, applying each subsequent index once per item.
Metadata and call scopes are restored before waits and exceptional exits.
Pending writes are skipped on failure/cancellation; completed workspace effects
persist. Classes, scripts and indexed multi-target output destinations remain
migration boundaries. See [resumable execution](resumable-execution.md) for
evaluation order and limits. Local application and browser Worker integration
use the public runtime and core contracts; no publication is needed for
sibling-checkout validation.

## Public ESM and native browser distribution

Runtime ESM entries share mathjslab/core. Package bundlers resolve this public
subpath normally; native browser imports need a main-page import map for
mathjslab/core. The public browser Worker imports its core by relative URL and
does not require an import map inside the Worker. Keep the Worker artifact and
its platform core together. The default browser factory uses the public
mathjslab.runtime-worker.esm2022.js file, avoiding a duplicate Worker copy.

RuntimeWorkerServer strips AbortSignal from effect messages before posting.
Cancellation remains owned by RemoteRuntime's local per-effect controller.
Synchronous post failures reject the effect and remove its pending entry. The
app-specific serialization shim is no longer necessary. Real-browser consumer
checks must exercise default and explicitly supplied Worker factories in
addition to injected app callbacks; Node Workers cannot validate browser
structured cloning.

## Resumable literal construction

Matrix/cell element expressions now issue retained evaluation requests through
MultiArray.evaluateElements; its synchronous driver and the shared execution
machine use the same row/page construction. Expanded values cross a guarded
ExpressionBoundaryValue boundary, preserving executed syntax and legitimate
LIST results of dynamic execution. Concatenation/storage/backend operations
remain in MultiArray, including class overload dispatch and its synchronous
limit. Output/comma metadata is removed before waits; failure or cancellation
skips the pending write without rolling back completed effects. See the current
literal-element section in [resumable execution](resumable-execution.md) for
the complete audited frontier list and the distribution compatibility
requirements.

## Returned call receivers

The shared machine now retains receivers produced by normal calls before native
matrix/string/cell indexing and structure field access. Returned handles retain
ordinary dispatch. Context.executeNativeIndexing keeps the receiver for
end/colon and evaluates each index once; intermediate calls use one usable
output and the final access honors the caller's output metadata. Dynamic field
names retain their field-before-receiver order. Synchronous class dispatch uses
the retained receiver in the existing evaluator and remains indivisible; no
class/script frames were migrated. Failure or cancellation skips pending writes
and restores call/comma/output metadata. See the current returned-receiver
section in [resumable execution](resumable-execution.md) for the audited
remaining boundaries.

## Session-owned plotting

The core now registers plot, plot3, surf, plot2d and histogram for each
interpreter. PlotFunctions owns argument preparation, styles and sampling; it
imports neither DOM nor Plotly. createPlotFunctionTable accepts a structural
interpreter and synchronous output sink. Interpreter.withPlotOutput installs a
sink only for a synchronous operation and restores its predecessor in finally,
including nested captures and failures. The standard runtime records
descriptions as visualization outputs at each machine step.

Descriptions retain the existing plotly renderer identifier and
trace/layout/config wire shape for compatibility. This is an output contract,
not a dependency on the renderer library. The application owns lazy Plotly
loading, DOM materialization, resize and purge. Sampling remains synchronous
and uses the owning session workspace; no resumable boundary is broadened.

An omitted histogram domain is not added to the AST argument list; only
supplied arguments are retained.
