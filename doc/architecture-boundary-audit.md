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

The bounded 2.7.0 release review passed the source matrix (84 suites, 1,608
tests), declaration compilation, grammar regeneration, and circular-dependency
analysis. Lint has no errors and retains 55 existing warnings. Distribution
checks additionally load actual ESM/CommonJS entry points and Node Workers. The
distribution matrix passed 9 suites and 13 tests. All 11 production bundles
compiled; the final CommonJS artifacts were rebuilt after namespace
compatibility corrections. `npm pack --dry-run --ignore-scripts` contains 113
files and every declared export target, with no temporary files, specs, or
obsolete CommonJS `.js` artifacts. Production web bundles retain the existing
Webpack size/performance warnings. Node entries preserve native crypto and
install a fallback only when missing; CommonJS exports target `.cjs` artifacts
and retain their legacy namespace. Web tests use jsdom, and the web ESM smoke
test runs in Node: this is not a claim of real-browser Dedicated Worker
verification.

The relevant regression surface is:

- `ExpressionValue.spec.ts` and AST boundary suites;
- `FunctionIntrospection.spec.ts` and function infrastructure tests;
- `MathOperation.spec.ts`, linear algebra, and interpreter unit tests;
- parser compatibility and m-file suites;
- type generation, lint, and circular-dependency checks.
