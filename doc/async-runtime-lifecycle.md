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
cancel at statement boundaries and while awaiting host effects. Remote runtimes
provide hard preemption by terminating the dedicated Worker.

## Host effects

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
