# Resumable execution: shared calls and retained expressions

## Current support

The shared machine supports instruction sequences, conditionals, loops,
try/catch and unwind cleanup; ordinary and anonymous calls; argument/default
binding; supported unary/binary/range expressions; native numeric/string/cell/
structure receiver chains and assignment preparation; matrix/cell literal
elements; and native receivers returned by normally dispatched calls.

`pause` and top-level `load` use explicit host effects in supported statement
positions. Arguments, selected branches, loop cursors and completed expression
values survive waits without replay. Progress checkpoints enable cooperative
cancellation. Continuations are single-use, in-memory state; no public session
API serializes a suspension or exposes a manual pause/resume handle.

Class callbacks/array dispatch, dynamic eval scripts, validation callbacks,
indexed multiple-output destinations, synthetic loop destinations, SPMD count
preparation and `load` inside user functions remain synchronous boundaries.
Direct `pause`/`load` value operands are unsupported; numerical operations are
indivisible. See [audited frontiers](#audited-remaining-frontiers) and
[returned receivers](#receivers-returned-by-calls) for the precise inventory.

The sections below describe the shared contracts and their implementation
increments. Earlier increment limits are superseded where later sections
explicitly integrate the same path.

## Shared sequence driver

### Explicit scalar superclass calls

`obj@Base(args)` and `method@Base(obj, args)` now use
`Context.executeSuperclass` in both drivers. Selection preserves existing
syntax/name precedence: an identifier already bound to a scalar instance is a
constructor target; otherwise the first argument is the method receiver. The
receiver is retained once, superclass membership and protected/private access
are checked before remaining inputs, and normal function requests bind those
inputs. Qualified superclass names keep the existing hierarchy lookup.

Superclass constructors reuse the allocated derived instance and its return
slot, without instantiating property defaults again. Assigning their result
preserves value-class behavior; handle instances preserve identity. Multi-level
constructor and method delegation retains each scope/frame across waits.
Explicit calls also participate in assignment and expression preparation, so
outputs, ignored destinations and semicolon suppression follow ordinary calls.

The declaring class owns each method's private access. Caller expressions keep
caller permissions, while every suspended frame/access grant is removed from
active Context and restored only while advancing the corresponding work.
Success, language/host error and cancellation use the same function cleanup;
completed writes survive and unfinished output assignments are skipped. The
synchronous driver rejects a host wait and unwinds, as for other retained
calls.

Remote cancellation retains the existing hard-preemption policy: terminate the
Worker and recreate a clean workspace. No protocol changes are introduced.

Scalar constructor/method calls are integrated; class arrays, property defaults
and validation, property/event callbacks, `subsref`/`subsasgn`, dynamic eval,
variadic/concatenation overloads and `load` inside user functions remain the
previous separate boundaries. Runtime regressions cover three-level value and
handle inheritance, argument/receiver effects, access checks, resumed failure,
cancellation and session isolation; distribution tests exercise a real Worker.

### Indirect and scalar class calls

The original `feval` and `builtin` entries now resolve their target once and
forward raw arguments through `Context.executeCallable`. Target selectors and
forwarded inputs can suspend without replay. Selective builtin evaluation,
comma expansion, name-value/default binding, requested output counts and
ignored outputs remain owned by the target. `builtin` retains explicit builtin
lookup and operator-overload bypass. Host replacements remain ordinary
callbacks. Indirect `run`/`source` calls also use the script lifecycle below;
dynamic `eval`/`evalin` execution itself remains synchronous.

Scalar instance methods (ordinary `obj.method` lookup without `subsref`
overrides, stored bound methods and functional syntax), static methods
(`Class.method` calls or `feval`) and direct constructor bodies now share
function binding, retained scopes, persistent storage and output validation.
Constructor return slots are seeded with the allocated instance; property
defaults are instantiated once before inputs, with existing value and handle
behavior. Symbolic scalar unary/binary overloads and arithmetic function forms
with one/two operands use these same method requests.

`executeWithClassAccess` carries class access on executable requests and clears
it before yielding. Caller argument expressions do not receive the callee's
private access. Drivers reinstall the capability only while advancing method
work; a suspended call also removes its active CallFrame. Failure/cancellation
restores both, skips pending output assignments and preserves completed
effects.

Remaining boundaries include property defaults/validation and accessors, event
callbacks, `subsref`/`subsasgn`, class arrays, variadic operator folds,
concatenation and non-arithmetic builtin overload callbacks. `feval` target
resolution still accepts callable functions and static methods; this does not
introduce class-constructor or unbound instance-method targets. Indexed
multiple-output destinations and `load` inside user functions remain unchanged.
Earlier class/indirect boundary notes below are superseded only for the paths
listed here.

### Direct script lifecycle

Direct `run` and `source` calls, including `run file` and `source file` command
forms, now execute resolved scripts through the retained sequence driver.
Nested scripts can suspend at supported `pause` instructions without replaying
source lookup, arguments, completed statements or host effects. Resolver lookup
and parsing remain synchronous; this adds no filesystem or network capability.
`source` retains its existing base/caller workspace choice.

Both drivers share `executeScriptLifecycle`, which owns temporary local
functions, imports, dynamic-name guards, script depth and source identity. Its
`finally` restores these on completion, script return, error, host failure or
cancellation. Completed workspace writes persist. A script return stops that
script, allowing its caller to continue. Existing sequence reduction retains
result flattening, `ans` and semicolon suppression. Suspended nested sequence
frames expose their retained scope and instruction cursors.

Only the original builtins and command entries participate; host replacements
and ordinary name/overload precedence are preserved. Direct and indirect
`run`/`source` use this lifecycle; dynamic eval script paths, class callbacks
validation callbacks, indexed multiple-output destinations and `load` within
user functions remain outside this increment. Earlier references below to
synchronous script frames are superseded only for these `run`/`source` paths.

`Interpreter.CreateExecutionMachine` drives the same `executionList` reduction
used by recursive evaluation. It retains script-local function registration,
command conversion, instruction indices, list flattening, `ans`, output
omission and top-level return handling. `Interpreter.Evaluate` uses the
synchronous machine driver and retains its list result. Runtime sessions retain
their last-instruction result policy; suspending preserves the preceding
result.

## Existing value and control flow

Runtime numeric/container values travel through StrictNodeExpr and the guarded
RuntimeExpressionValue storage boundary. Executed statements use NodeInput,
which also admits LIST. ExpressionBoundaryValue deliberately retains LIST for
dynamic execution such as eval, evalin, run, source and indirect dispatch. Call
arguments retain that boundary for comma-list expansion. Lazy RETLIST carriers
are reduced by evaluatedExecutionResult at instruction boundaries; return
selectors and materialized function outputs remain strict expressions.

Context resolves names and dispatches callables, evaluates arguments, binds
function scopes and pushes CallFrame metadata. FunctionWorkspace owns local,
persistent and global bindings. Function calls collect declared outputs and
restore the caller in finally. ReturnSignal, BreakSignal and ContinueSignal
currently unwind JavaScript evaluation; external list reduction consumes a
valid top-level return, while the machine classifies escaped signals as control
transfers. The synchronous public driver retains its existing invalid-control
diagnostics. Ordinary user call frames can now be retained across a wait.

## Contract

`ExecutionMachineStep` distinguishes completion, effect suspension, failure,
cancellation, and escaped return/break/continue transfer. Progress steps now
provide single-use continue/cancel operations at cooperative checkpoints, every
64 instruction-entry or loop-iteration boundaries. Empty loops also checkpoint.
Synchronous drivers drain them immediately; asynchronous drivers yield to the
event loop before continuing. Immutable frame snapshots expose the retained
scope identity, instruction/branch cursor, node kind, and phase. Loop
iterators, selected branches and evaluated header values remain in the
continuation and are never replayed. A sequence frame exposes the next
instruction cursor and previous opaque value. The generator continuation
retains the scope, input list and accumulated result list. These continuations
are in-memory objects, not serializable Worker messages or persisted snapshots.

An effect continuation offers `resume`, `fail` and `cancel`. Exactly one may
consume it. Reuse returns `MATHJSLAB_CONTINUATION_CONSUMED` without executing
code. Failure enters the suspended generator as an exception; cancellation
injects a distinct ExecutionCancellation transfer that language catch blocks
cannot consume. Synchronous unwind cleanup executes once; cancellation never
requests new host effects. To prevent cleanup from looping forever,
cancellation unwind drains at most 64 additional checkpoints, then interrupts
remaining cleanup at its next checkpoint. This is a bounded cancellation
policy, not rollback. Cancellation takes precedence in runtime status if
cleanup fails; the machine itself exposes a cleanup exception as an error step.
Arguments are already evaluated when the effect is emitted. Neither arguments
nor prior instructions are replayed. The generic machine does not inspect
numbers or matrix storage.

Host, diagnostic and output contracts live in `execution-contracts.ts`, without
an Interpreter dependency; `runtime-contracts.ts` re-exports them. Sequence
elements and flattened results are guarded program elements or explicit LIST
carriers. The accumulated list is typed with NodeInput elements.
NodeBase.parent now explicitly permits the existing null execution-root marker.

## Dispatch and effects

`pause` and `load` are registered built-ins with declarative signatures. The
context capability runs after ordinary name resolution, argument expansion,
parameter validation and class dispatch. Only the original registered built-ins
emit effects. Variables, user/provider functions, aliases and client
replacements follow ordinary dispatch. Direct instruction `pause(seconds)` in a
migrated sequence or block yields delay; direct instruction `load(reference)`
yields read-text. The runtime executes the returned script in the same
workspace before resuming the caller sequence. The existing resource nesting
limit remains 16.

The synchronous driver reports `MATHJSLAB_EFFECT_REQUIRES_ASYNC` when it
encounters a wait and does not execute subsequent instructions. The runtime
reports the same requirement without a host adapter. Runtime waits race
cancellation even if a host ignores its signal; late responses cannot resume
cancelled execution. Numeric configuration is installed only during synchronous
machine operations and restored before awaiting the host.

## Integrated control-flow subset

IF, SWITCH, WHILE, DO_UNTIL, FOR (including existing sequential parfor policy),
TRY, UNWIND_PROTECT and sequential SPMD now use executionNode. Their original
algorithms were moved from recursive Evaluator branches; Evaluator drives the
same frames synchronously rather than maintaining separate implementations.
Conditions and switch selection are retained once a branch is entered. For-loop
headers are evaluated once and the existing opaque loop-value iterator is kept
across waits. Break/continue/return propagate through nested frames and are
consumed at their existing language boundaries. Host failure is injected at the
suspended instruction, so catch receives the usual error structure and cleanup
runs with the original exception/control transfer retained. Cleanup can itself
suspend during ordinary execution. SPMD temporary names restore in finally,
including cancellation. Root instruction lists explicitly use the null parent
marker, matching synchronous top-level return handling.

Runtime statement-boundary cancellation checks remain in addition to
checkpoints. Runtime evaluate hooks observe migrated leaf instructions; block
selection and loop state are owned by the interpreter. Numeric configuration is
installed only around synchronous driver operations, including resume and
unwind, and is restored before any host/checkpoint wait.

## Integrated ordinary-call subset

Context.executeFunctionDefinition is a typed generator for the existing call
lifecycle. Both drivers use its original binding, input/output validation,
nested-function registration, persistent state and lazy return-list collection.
It requests execution of a body with its Scope and CallFrame. The interpreter
executes that body using the same sequence/block machine. Return is consumed at
the function boundary; host failures and cancellation unwind the call's finally
and store persistent variables before removing the frame.

Simple-name parenthesis calls use normal evaluated name/handle resolution. Only
an FCNDEF callable enters this path. Built-ins, arrays, anonymous handles,
class dispatch and functional overloads retain their normal Context.apply path.
Call preparation now requests argument expansion and default evaluation from
the same driver, retaining completed values and bindings before the body
starts. Named handles, nested and local function bodies use the definition
scope already captured by the call engine.

ExecutionFrame now also admits call and expression kinds. Binary expressions
retain each evaluated operand; short-circuit operators skip the right operand
when appropriate. Parenthesized expressions and simple identifier assignments
can retain a returning call. Assignment writes and numeric/class operators
still use the existing evaluator with the already evaluated values. Value
operands request one output and reduce their RETLIST at the expression
boundary. Multi-output assignment to simple identifiers and ignored targets
retains the lazy return list and caller output mask until the existing
assignment writer selects the requested outputs. Indexed/compound assignments
remain synchronous.

Each suspended ordinary call temporarily removes its CallFrame from Context and
reinstalls it before resume, failure injection or cancellation cleanup. The
continuation keeps the scope and frame; unrelated work during the wait sees the
caller workspace rather than a suspended callee. Requested output count for
simple assignment is likewise installed only during generator steps. Numeric
configuration is restored before every asynchronous wait.

## Integrated argument/default and output binding

FunctionCall preparation and positional binding now expose generators shared
with their synchronous callback drivers. Preparation yields one positional
argument expansion at a time, keeps Octave default markers intact, and retains
expanded values for arity checking and binding. Context no longer reevaluates
those values. Named argument values and positional/name-value defaults are also
evaluator requests; the existing positional-then-named order and name-value
default-before-override rules are preserved.

FunctionExecutionRequest distinguishes argument, default, body, anonymous
expression and indivisible operation requests. Body/expression requests carry
an active function frame; operation requests retain a synchronous callback. A
default is executed with a temporary scope frame, so calls in its expression
see parameters already bound in that function. The scope frame, requested
output count, output mask and comma-list expansion flag are installed only
during a generator step, then restored before each wait. The callee call frame
and persistent storage are entered after binding. The existing input validation
then runs before the body starts.

Simple multi-output assignments retain RETLIST rather than reducing it to its
first value. The original assignment writer still owns selection, copying and
workspace writes. The call captures its output mask before argument evaluation;
argument/default expressions request one real output independently of ignored
caller outputs. Failure/cancellation during binding propagates to the caller,
unwinds any entered argument/default functions and skips remaining inputs and
the callee body. Checkpoints in argument/default calls use the same driver.

## Remaining migration

Anonymous calls now use the same argument/body request driver as ordinary
functions. Evaluated inputs, closure scope, requested outputs and
ignored-output masks survive waits. Their expression bodies retain legitimate
lazy multi-output and dynamic execution carriers. Synchronous calls drain the
same requests.

Unary operators and ranges retain evaluated operands and delegate the resulting
operation to the existing evaluator and dispatch. Ranges keep the established
start, stop, stride evaluation order. Conditions, switch selectors/case tests
and loop headers can suspend in user calls; selected values and iterators are
retained. Condition-specific short circuit remains distinct from ordinary eager
`&`/`|`. The current grammar requires parentheses around call-led range
headers, for example `for i=(g(1):g(2):g(5))`; this increment does not change
the grammar.

Builtin calls now share a selective argument generator with synchronous Context
dispatch. Each argument is expanded once; `ev` flags retain unevaluated ASTs,
`set` retains Name=Value conversion, and `feval`/`builtin` retain their raw
forwarded arguments. Raw forwarded arguments and dynamic scripts still cannot
suspend in this increment. An `operation` request dispatches the retained
arguments through the existing operator/class opportunities, arity/parameter
validation, mapper, lazy output and effect hook. Only this indivisible
operation installs the effect hook; effects cannot escape the normal
name/dispatch rules. The request does not add an asynchronous builtin
implementation or an alternate numeric backend.

Native reads with simple named receivers use resumable index arguments for both
`()` and `{}`. The receiver is validated and captured before inputs. The
indexing AST uses `exprEvaluated` for `end`/colon, preserving opaque values and
N-D metadata without evaluating containers as syntax again. Invalid
receiver/delimiter pairs fail before input evaluation. Index expansion,
conversion and result construction remain in Context/MultiArray, including
character and cell comma-list rules. Class subsref and method receivers stay on
their existing path. The additional native write and numeric/string chain
subset is described below.

## Retained write stages and numeric/string chains (initial subset)

The original assignment writer is now a generator shared by synchronous and
resumable drivers. Private `AssignmentExecutionRequest` variants request RHS or
native index evaluation; `AssignmentExecutionValue` retains legitimate
NodeInput/LIST carriers and validated IndexArgument arrays. Selection, copying,
name resolution, compound operators, growth, deletion, class dispatch and
mutations remain in this single writer, rather than a parallel implementation.

For simple named/compound assignments and direct native indexed writes, the
machine exposes `prepare`, `rhs`, `index` and `write` phases. The writer
retains its locals and original decisions across requests. This preserves
RHS-before- index order, the missing-compound-target error before index
evaluation, and character-vector preparation before index effects. It retains
both name-entry references and temporary character destinations without
reevaluating inputs. Compound operands are read at the original writer
location, not eagerly.

Output counts, ignored-output masks and forward-reference targets are installed
only during expression steps, then restored before waits. Failure or
cancellation before the writer runs prevents the pending write while preserving
completed RHS/index/workspace effects and cleanup. The writer itself remains
indivisible. Ordinary name resolution and numeric/matrix storage remain
unchanged.

Nested index reads rooted in a named numeric non-cell matrix or CharString can
retain each receiver before proceeding to the next index. The continuation does
not replay inner receivers or arguments. Native cell/structure chains, dynamic
fields, returned receivers and chained assignment targets are also supported,
as described below. Class callbacks and indexed multi-target output patterns
remain synchronous. Deferred indexed assignments whose RHS remains an
unresolved forward reference also retain their original writer path; index
waits there are not integrated.

Validation expressions, class/script frames, SPMD worker counts and raw
indirect forwarding remain synchronous boundaries. Direct pause/load calls used
as value operands are rejected before a host request. load within a user
function remains unsupported. Long numeric operations remain indivisible.

Native cell/structure/dynamic receiver chains and chained assignment
destinations are integrated in the next section. Class and script call
lifecycles remain migration boundaries. Matrix storage, numeric types,
BLAS/LAPACK and backends are unchanged. mathjslab-app consumption and real
browser Dedicated Worker verification remain pending. This does not complete
the architecture stage or publication milestone.

## Native field/cell destinations and receiver chains

Assignment target normalization now shares typed generator requests with the
writer. A private `value` request retains one descriptor argument or dynamic
field-name result, alongside the existing RHS/index requests. Both drivers use
the same target normalization and descriptor constructors. Invalid dynamic
names fail immediately, before the RHS is evaluated. Native dotted/chained
destinations rooted in a variable can suspend during preparation and in their
RHS, including compound assignments; the mutation still belongs to the original
writer.

Preparation exposes a `target` phase. Order follows the existing evaluator:
plain indexed destinations evaluate RHS before indices, whereas
descriptor-based chained destinations prepare their subscripts before RHS.
Dynamic dotted targets normalize field names at their original validation
point. For example, `C{g(1)}(g(2))=g(3)` evaluates 1, 2, then 3; `A(g(1))=g(2)`
evaluates 2, then 1. Completed preparation is retained and never retried on
resume. The receiver used by end is obtained from retained prefix descriptors;
previous index expressions are not evaluated again. Failures/cancellation
prevent the pending write and do not roll back earlier workspace effects. An
expanded multi-target write is not a transaction.

Native cell/structure read chains rooted in variables now retain receivers and
field names. A comma-separated receiver is expanded once; each subsequent index
is applied once per item, preserving order, end/colon, output count and ignored
outputs. Intermediate receiver/field evaluation requests one usable output,
independently of the final ignored-output mask. Output and comma-expansion
metadata are installed only while advancing an expression and restored before a
wait, including exceptional exits. Native eligibility checks reject
class/callable-containing receivers and leave their normal dispatch path
intact; no effect names are resolved syntactically.

Indexed multi-target output destinations, synthetic loop binding destinations,
class/script frames and raw indirect forwarding still require migration.
Validation expressions, SPMD worker counts, direct pause/load value operands
and load within user functions retain the previously documented limits. Numeric
storage, numeric types, BLAS/LAPACK and calculation backends are unchanged.

The next kernel increment must migrate class/script call lifecycles and
remaining receiver/output patterns. Consumer validation is now useful in
parallel with that work: mathjslab-app can depend on the local mathjslab
directory via a file reference and exercise browser host/Worker cancellation
and workspace flows. Neither project needs publication for this validation; the
joint publication milestone remains gated on a stable supported subset and both
projects' checks.

Behavioral coverage lives in ExecutionMachine.spec.ts, InProcessRuntime.spec.ts
and the distributed Node Worker suite. Existing interpreter, dispatch and
runtime lifecycle suites remain required.

## Local consumer and distribution integration

The mathjslab-app integration exposed duplicate value/interpreter classes when
callbacks imported from the public core were passed to a separately bundled
runtime. Runtime ESM entries now delegate their in-process host, environment,
codec and machine to the same `mathjslab/core` module. This preserves callback
values and numeric configuration identity without changing evaluator dispatch
or introducing value conversion at the application boundary.

Dedicated Worker artifacts import their platform core by relative URL. The
browser factory uses the public Worker artifact, matching the existing Node
factory policy. Worker effect messages omit the realm-owned AbortSignal;
RemoteRuntime supplies its own per-effect signal. A failed post removes its
pending effect entry before rejecting. The app no longer needs its signal
serialization shim.

Distribution regressions cover public runtime/core identity and signal-free
effect messages. Consumer tests cover actual browser Dedicated Workers, both
the app adapter and the public default/explicit browser factory. Source and
distribution checks still gate joint preparation. No architecture subset,
numeric storage, numerical algorithms or backend has been extended.

## Matrix and cell literal elements

Matrix and cell literal elements now use the shared machine when they contain
calls from the already integrated subset. For example,
`plot([sample(1), sample(2)])` can wait inside `sample` without evaluating the
first element or its arguments again. Nested literals and comma-separated
cell/structure values retain their original evaluation order. This removes the
element-expression boundary; argument/property validation expressions are a
separate boundary.

`MultiArray.evaluateElements` exposes one element request at a time and
receives its expanded values. The existing synchronous `MultiArray.evaluate`
drains the same construction generator; the interpreter supplies resumable
expression requests. Construction remains in the value facade: horizontal
concatenation and its overload run before evaluating the next row, vertical
concatenation runs after the rows, and N-D inputs keep their existing page
order. Character joining, empty elements, cell dimensions and parent links
retain their existing rules. Neither matrix storage nor numeric/back-end
operations are migrated.

Literal frames use the textual MATRIX/CELL discriminants, without exposing a
storage tag. Expression frames expose `literal-element` and
`literal-construction`; their cursor counts completed source elements rather
than expanded comma-list slots. Completed elements, expanded slots and
completed rows remain in the continuation. Output count, ignored-output mask
and comma-list expansion are installed only while advancing an element, and are
restored before waits. Normal resolution, arity and dispatch still decide
whether a call is a function or native index. Direct pause/load value operands
are still rejected before requesting the host.

The interpreter guards each expanded item as an `ExpressionBoundaryValue`
before adapting it to the existing structural array-slot contract. Executed
syntax expressions and intentional LIST carriers from eval/evalin remain
legitimate syntax-container values. They are not evaluated again. This boundary
must not be narrowed to runtime-only values or broadened to arbitrary
statements.

Failures in an element or in concatenation skip later construction/statements
and the pending assignment. Already completed workspace/host effects persist.
Language catch and unwind cleanup retain their usual semantics; cancellation
remains a driver transfer. The synchronous API reports
`MATHJSLAB_EFFECT_REQUIRES_ASYNC` at the first actual wait and does not replay
completed arguments. Class concatenation callbacks remain indivisible and
cannot suspend until their class call lifecycle is migrated.

### Audited remaining frontiers

| Frontier                                           | Current code boundary                                                           | Status/order                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Matrix/cell element expressions                    | MultiArray.evaluateElements + Interpreter.executionNode                         | Integrated in this increment for existing resumable call forms                                                   |
| Function-returned receivers                        | executionNode IDX eligibility / isNativeExecutionChain                          | Normally dispatched returning calls retain their receiver before native indexing                                 |
| Indexed multiple-output destinations               | isExecutionWriteTarget / assignmentWriter                                       | Separate descriptor/output-selection migration; simple and already documented chained writes remain supported    |
| Indirect dynamic callbacks                         | Context.executeBuiltInArguments and synchronous feval/builtin callCallable      | Original feval/builtin targets and inputs are retained; dynamic eval callbacks remain synchronous                |
| Class callbacks/dynamic scripts                    | Property/index/event callbacks, class arrays and dynamic eval                   | Scalar methods, constructors, explicit superclass calls and arithmetic overloads retained; callbacks synchronous |
| Validation expressions                             | FunctionArguments validation callbacks / Interpreter.validateArgumentValidation | Still synchronous; not covered by literal-element support                                                        |
| load in user functions                             | executionLeaf effect dispatch guard                                             | Explicitly rejected by the effect-position guard; resource-loaded code is not integrated                         |
| Synthetic loop destinations and SPMD worker counts | binding/header operation requests                                               | Previous restrictions unchanged                                                                                  |

## Receivers returned by calls

Read chains beginning with normally dispatched calls now enter the existing
shared execution machine. Index/field eligibility does not predict a call's
return type: the call runs with one requested usable output, its value is
retained, and ordinary callable/class/native dispatch decides the next access.
This includes named and handle calls, returned handles, matrix/string indexing,
cell braces and comma-separated receivers, and static/dynamic structure fields.

Native indexing continues to use Context.executeNativeIndexing: validation
precedes index arguments, exprEvaluated retains the receiver for end/colon, and
arguments expand comma lists once. Dynamic field expressions run before their
receiver, preserving the existing native field order. Each index following a
comma receiver runs once per receiver item. The outer caller's output count and
mask are restored; multiple outputs come from the final access, not the
intermediate factory. A synchronous driver reports
MATHJSLAB_EFFECT_REQUIRES_ASYNC at the first wait and unwinds call metadata.

Class subsref/field access and other synchronous dispatch use the retained
receiver in the original evaluator rather than replaying its producing call.
Returned-receiver support does not introduce resumable class methods or
constructors. Direct run/source scripts are supported by the script lifecycle
increments above. Class callback and array dispatch operations remain
indivisible. Qualified-name resolution and variable/user-function precedence
continue through the original dispatch.

The audited remaining boundaries are:

- Class callbacks/dynamic scripts: property/index/event callbacks, class arrays
  and dynamic eval remain synchronous. Scalar methods, direct and superclass
  constructors/methods, and run/source scripts are retained.
- Indexed multiple-output destinations: assignmentWriter and
  isExecutionWriteTarget; this increment changes reads only.
- Indirect dynamic callbacks: feval/builtin target and argument forwarding are
  retained, while dynamic eval and excluded class callbacks remain synchronous.
- Validation expressions: FunctionArguments/Interpreter validation callbacks.
- load inside user functions: the effect-position guard still rejects it;
  resource-loaded code and its workspace lifecycle still need integration.
- Synthetic loop destinations and SPMD worker-count expressions retain the
  documented synchronous preparation boundaries.
- Direct pause/load operands still do not produce values; long numeric/backend
  operations remain indivisible.
