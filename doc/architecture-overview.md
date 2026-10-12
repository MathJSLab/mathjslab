# Architecture Overview

MathJSLab is a MATLAB/Octave-like interpreter implemented in TypeScript. Source
text passes through the ANTLR lexer/parser and normalized AST into evaluation
in an active workspace. Shared guards validate values at expression, argument,
return, indexing, assignment and class-dispatch boundaries.

## Main subsystems

- `Interpreter` coordinates parsing, evaluation, source resolution, workspaces,
  diagnostics, unparsing and built-in registration. Consumers instantiate it
  with `Interpreter.Create(config)`.
- `AST` defines normalized nodes, factories, child-parent links, source
  metadata and expression/statement contracts. `ExpressionValue` guards
  expression boundaries; explicit LIST carriers remain valid at dynamic
  execution and comma-separated-list boundaries.
- `Context` owns name resolution and dispatch. `FunctionCall`,
  `FunctionArguments`, `FunctionSignature` and `FunctionValidation` prepare
  inputs, defaults, outputs and declarative validation.
- `FunctionWorkspace`, `FunctionStack`, `CallFrame` and `Scope` manage local,
  persistent, global, caller/base and captured lexical state.
- `SourceResolver` uses host-provided sources for `.m` scripts, functions,
  classes and external class methods. This does not provide unrestricted
  filesystem access.
- Class modules represent definitions, instances, metadata, inheritance,
  properties, methods, enumerations, events, listeners and common dispatch
  paths.
- `Complex`, `ComplexNumber` and `ComplexDecimal` provide numeric backends.
  `MultiArray` owns N-D storage, indexing, broadcasting, construction and
  assignment. `BLAS`, `LAPACK` and `LinearAlgebra` provide numerical routines.
- `PlotFunctions` prepares serializable plot descriptions using the owning
  interpreter. `withPlotOutput` scopes a synchronous sink; hosts own rendering,
  DOM resources and cleanup. See [plotting](plotting.md).

## Shared execution and asynchronous sessions

`Interpreter.Evaluate` and runtime sessions drive the same execution machine.
The synchronous driver drains cooperative progress steps immediately and
reports `MATHJSLAB_EFFECT_REQUIRES_ASYNC` at a supported host wait.
Asynchronous drivers yield at checkpoints and route effects through
`RuntimeHost`.

The machine retains sequences, control-flow state, ordinary and anonymous
function calls, inputs/defaults, supported expressions, native receiver chains,
assignment preparation and matrix/cell literal elements. Resume continues from
retained state without replaying completed work. Suspended call frames and
output/comma metadata are detached from the active context before a wait and
restored while advancing or unwinding. `RuntimeEnvironment` scopes numeric
configuration to synchronous steps, restoring it before waits.

Continuations are single-use in-memory objects, not persisted or transferable
snapshots. Cancellation bypasses language catch and performs bounded cleanup;
it does not roll back completed workspace effects. Scalar class calls,
superclass calls, run/source scripts and supported feval/builtin forwarding
retain their frames. Property/event callbacks, object arrays, overloaded
indexing and remaining preparation boundaries are synchronous. Long numerical
operations are indivisible. The current inventory and detailed evaluation order
live in [resumable execution](resumable-execution.md).

`InProcessRuntime`, `BrowserRuntime` and `NodeRuntime` implement the same
session contract. Remote sessions use dedicated Workers, versioned protocols
and serializable values/output descriptors. Abort, timeout or Worker failure
can terminate a remote Worker; the next operation creates a clean workspace.
In-process cancellation occurs at supported checkpoints or host waits. See the
[lifecycle guide](async-runtime-lifecycle.md) for exact recovery guarantees.

Eligible remote `parfor` bodies distribute proven sliced assignments and
associative reductions to child sessions. Policies select rejection or
sequential fallback for unsupported loops. `spmd` remains sequential.

## Runtime distribution identity

Public runtime ESM bundles import the exported `mathjslab/core` boundary rather
than embedding another interpreter or numeric facade. Worker artifacts use
relative platform core URLs. This preserves core/value identity within each
realm and the public runtime entry points. Worker messages carry serialized
contracts, not in-memory continuations or realm-owned AbortSignal instances.

## Maintenance rules

Document compatibility assumptions and test differences between MATLAB, Octave
and MathJSLab explicitly. Keep interpreter policy and diagnostics near call
binding instead of low-level numerical kernels. Generated parser changes belong
in `.g4` sources. Circular dependencies in `src/` are release failures; use
shared contracts or type-only imports to preserve subsystem boundaries.

The [documentation index](README.md) links to focused subsystem guides and the
[boundary audit](architecture-boundary-audit.md).
