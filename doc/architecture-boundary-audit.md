# Architecture boundary audit

This audit classifies the remaining permissive type boundaries after the
control-flow, call/index, declaration/class, dispatch, parser-context, and
asynchronous-runtime increments.

## Hardened in this increment

### Runtime validation

`validateattributes` no longer coerces arbitrary `NodeInput` values to
`RuntimeExpressionValue`. It uses `optionalRuntimeExpressionValue` and treats
parser-only carriers as non-matches. Runtime container and validator APIs
therefore receive values proven by the shared AST/runtime guard.

### Function-handle closures

`FunctionHandleClosure` is now an exported structural contract.
`FunctionIntrospection.IntrospectionScope` extends that contract, eliminating
the double cast previously used when local-function handles captured their
lexical scope.

### Call-stack metadata

`CallFrame.callSite` now stores `NodeBase`, the exact contract needed for
source positions. Parent traversal uses `AST.isNodeBase` rather than inheriting
the permissive `NodeExpr` boundary.

### Structural walkers

The static-workspace and `parfor` discovery walkers accept `unknown` and narrow
each visited value with AST guards. They no longer cast arbitrary object graph
members to `NodeInput`.

### Mathematical dispatch

`MathOperation` now relies on the existing `CharString`, `Complex`, and
`MultiArray` guards directly. Redundant operand casts were removed. Matrix
multiplication and division use exhaustive matrix/matrix branches and issue an
explicit operator diagnostic for unsupported runtime objects instead of letting
a broad `else` assume matrix shape.

### Lazy return lists

`ReturnSelector` now produces `StrictNodeExpr`, and realized
`ReturnHandlerResult` slots accept only strict expressions (plus the numeric
`length` metadata). `AST.ensureReturnList` validates unknown JavaScript input
at runtime, so statements and `NodeList` carriers cannot be smuggled into a
lazy output through an untyped caller.

Function return variables use the strict-expression guard: evaluated syntax
nodes used legitimately by `evalin` remain supported, while `NodeList` is
rejected. The same invariant is enforced by context-owned output lists and by
the multi-output core and linear-algebra functions (`find`, `sort`, `ind2sub`,
`meshgrid`, `ndgrid`, `shiftdim`, and page-wise solvers). Missing optional
outputs remain internal `undefined` state and never cross a selector.

### Evaluator and assignment results

Ordinary evaluator reduction now ends in `StrictNodeExpr` in both `Interpreter`
and `Context`. The broader `ExpressionBoundaryValue` helper is retained only
for boundaries that explicitly inspect or propagate a `NodeList`. Assignment
right-hand sides are narrowed immediately after evaluation (or after the
forward-reference fallback), before lazy output selection and storage. Selected
assignment outputs are validated again as strict expressions.

### Loop, indexing, and assignment helpers

Loop expansion and assignment distribution no longer return permissive
`NodeExpr[]` collections. Runtime storage/scatter paths use
`RuntimeExpressionValue[]`; AST-facing expression lists and loop columns use
`StrictNodeExpr[]`. Loop targets use `NodeAssignmentTarget`, assignment
validation accepts a strict expression, and cloned syntax matrices are modeled
as `MultiArray<StrictNodeExpr>` rather than being cast to runtime element
arrays. Compound-assignment comma lists are materialized only after every
selected element passes the runtime-value guard.

### Conditional evaluation and dynamic dispatch

Condition evaluation now accepts strict AST expressions and reduces them to
`RuntimeExpressionValue`; conditional and ordinary short-circuit operators
return `ComplexType`. Dynamic field expressions, comma-list receivers, and
class subsref/subsasgn chain collectors use `StrictNodeExpr`. The call-dispatch
union stores strict receivers (and identifiers for unresolved/functional
calls), while native indexing validates a concrete runtime receiver before
entering `MultiArray` operations. Scope identifiers may no longer expose a
`NodeList` carrier as an ordinary expression.

### Declaration defaults and validator metadata

Function-header defaults, `arguments`-block validator operands, bounds, and
explicit validator expressions now remain `StrictNodeExpr` throughout
`FunctionArguments`, `FunctionCall`, `ContextInterpreter`, and `Interpreter`.
Validator normalization rejects a nested `NodeList` carrier before evaluation.
The ordinary call-argument evaluator retains `ExpressionBoundaryValue` because
comma-separated-list expansion is an intentional execution boundary; the
default evaluator is strict.

### Native facades and lazy numeric outputs

Registered unary, binary, and left-associative operator facades now receive
`RuntimeExpressionValue` and validate every result as `StrictNodeExpr`. The
`spfun` facade exposes strict results. `builtin` and ordinary callable `feval`
dispatch deliberately return `ExpressionBoundaryValue`: indirect execution of
`eval`, `evalin`, `run`, and `source` must preserve their `NodeList` execution
carrier. Static-method `feval` dispatch remains strict. Regression tests
exercise direct, string-based, handle-based, and builtin dispatch and verify
workspace effects after multi-statement execution. `LinearAlgebra` lazy
selectors use one guarded output accessor, so missing or unmaterialized outputs
can no longer escape through the legacy `NodeExpr` carrier as `undefined`.

### Dynamic class and callable dispatch

Function definitions, instance/static/bound class methods, functional class
syntax and deletion now return `StrictNodeExpr`. The central `callCallable` and
`apply` paths return `ExpressionBoundaryValue`: this deliberately preserves the
`NodeList` execution carrier produced by `run`, `eval`, and `evalin`, while
rejecting statements and blocks returned by malformed callbacks. Dispatch
helpers retain `undefined` only as the explicit “not applicable; use native
indexing” signal.

## Resumable sequence and control-flow frames

The shared-machine increments are documented in
[Resumable execution](resumable-execution.md). Sequence input and flattened
output validate program elements or intentional LIST carriers; the accumulated
list uses NodeInput elements. NodeBase.parent includes the null root marker.
Effects enter after normal built-in dispatch and argument validation. Frame
snapshots expose scope identity, cursor and phase while keeping scope and
runtime values opaque to the generic machine. IF/SWITCH, loops, TRY/cleanup and
sequential SPMD use the same frame algorithms in synchronous and asynchronous
drivers. Checkpoint continuations are single-use. Cancellation uses its own
uncatchable driver transfer and bounded unwind policy. Ordinary FCNDEF bodies
now retain call frames through waits. Argument/default requests and simple
multi-output assignments also use the shared driver. Indexed assignments and
remaining legacy carriers still need migration.

## Remaining boundaries

### Formatting and evaluator inputs

Text and MathML unparse callbacks now distinguish declaration entries, strict
dynamic fields, and explicit expression-boundary arguments. Ordinary evaluation
helpers and comma-list evaluation accept `ExpressionBoundaryValue` instead of
the legacy alias. `FunctionCall.createReturnList` returns `StrictNodeExpr`
(void or a lazy return list).

The current hand-written production inventory contains 17 operational
`NodeExpr` annotations: 15 in `Interpreter` and 2 in `Context`. This count
excludes imports, comments, the alias/root-list definitions in `AST`, tests,
and generated parser files. The remaining sites cover increment/decrement,
assignment/indexing helpers, declaration/reference collection, a lazy selector,
the general expression-value adapter, and callable/identifier resolution.
`FunctionCall` and the unparse/MathML region no longer consume the alias. The
next cut should close these manual evaluator annotations before changing the
root/list unions or removing `LegacyNodeExprCarrier`.

### `LegacyNodeExprCarrier`

```ts
type NodeExpr = StrictNodeExpr | LegacyNodeExprCarrier;
type LegacyNodeExprCarrier = any;
```

This remains the largest type-safety boundary. It is still consumed by three
coupled areas:

1. evaluator branches whose public/internal signatures still use `NodeExpr`,
   principally formatting and a few generic expression evaluators;
2. generic call arguments that still allow an explicit
   `ExpressionBoundaryValue` carrier;
3. generated parser intermediates and generic root/list builders.

Removing the carrier now would conflate these migrations and make behavioral
regressions difficult to localize. The return-list/function-return and
evaluator/assignment-result and loop/indexing/class-assignment helper cuts are
now complete, together with conditional evaluation, dynamic dispatch, and
declaration/default metadata, the principal native facades, and dynamic
class/call dispatch returns, formatting, and generic evaluator inputs. The next
safe cut is the remaining manual evaluator annotations.
`ExpressionBoundaryValue` remains necessary for call arguments that
deliberately support execution carriers.

### Numeric algorithms

Most remaining `as MultiArray` casts are concentrated in `LinearAlgebra`,
`LAPACK`, and diagnostic/test helpers. They arise from APIs whose declared
return is scalar-or-array even when dimensions prove an array result. These
should be removed by adding overloads or guarded result helpers, algorithm by
algorithm; changing them mechanically would weaken rather than strengthen the
invariant.

### Platform adapters and dynamic facades

The remaining double casts in the non-generated production tree belong to
deliberately dynamic integration points:

- the configurable `Complex` backend facade;
- browser Worker scope and optional global `fetch` adapters;
- Node Worker `ErrorEvent` adaptation;
- dynamic MathML formatter lookup.

These casts should remain localized at adapter boundaries. They must not flow
into AST, scope, container, or evaluator APIs.

## Invariants

- Runtime storage accepts only `RuntimeExpressionValue` after a guard.
- Ordinary syntax expression fields use `StrictNodeExpr`.
- `NodeList` is permitted only at documented execution/return boundaries.
- Generic graph walkers accept `unknown` and narrow before inspecting AST
  fields.
- Runtime dispatch branches prove concrete operand types before calling
  numeric/container implementations.
- Platform casts remain at the outer adapter edge.

## Verification

Regression coverage includes source evaluation, declaration compilation,
grammar generation, dependency cycles, ESM/CommonJS entry points and Node
Workers.

The relevant regression surface is:

- `ExpressionValue.spec.ts` and AST boundary suites;
- `FunctionIntrospection.spec.ts` and function infrastructure tests;
- `MathOperation.spec.ts`, linear algebra, and interpreter unit tests;
- parser compatibility and m-file suites;
- type generation, lint, and circular-dependency checks.

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
can be validated against public runtime contracts without publishing sibling
checkouts.

## Consumer distribution boundary

Local app verification reproduced a distribution identity defect: external
callbacks created values from the public core that a separately bundled runtime
did not recognize. Sharing the exported core fixes that boundary; no runtime
guard is relaxed and no numeric value is coerced by the app. Dedicated Worker
effect transport also removes non-cloneable AbortSignal objects in
RuntimeWorkerServer, where the protocol boundary belongs. Browser and Node
Worker artifacts retain relative platform-core imports. Class/script frames and
remaining receiver/output migrations are still separate work.

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
remaining boundaries, consumer evidence and joint tarball/version gates.
