# Architecture Overview

MathJSLab is a MATLAB/Octave-like interpreter implemented in TypeScript. The
core architecture is organized around a clear path from source text to runtime
values:

1. source text is tokenized and parsed by the ANTLR-generated lexer and parser;
2. parse tree structures are normalized into AST nodes;
3. the interpreter evaluates AST nodes in the active workspace and call frame;
4. built-in functions, user functions, function handles, and anonymous
   functions are dispatched through the function infrastructure;
5. evaluated values cross expression-only boundaries through shared runtime
   guards before they are exposed as arguments, return values, indexing
   descriptors, assignment values, or class-dispatch operands;
6. runtime values are represented by numeric backends, strings, structures,
   multidimensional arrays, function handles, and class objects.

The implementation favors MATLAB/Octave compatibility when behavior is clear
and practical in a browser-first runtime. File-system-dependent behavior is
intentionally conservative because the package must run in browsers as well as
Node.js.

## Main Subsystems

The external-sequence migration and its typed execution boundaries are recorded
in [Resumable execution](resumable-execution.md). Control-flow blocks, ordinary
and anonymous calls in the documented subset now suspend; class/script frames
and remaining receiver/output patterns still require migration. Cancellation of
a host wait does not depend on the host honoring its signal.

- `Interpreter` coordinates parsing, evaluation, workspaces, stack traces, and
  built-in function registration.
- `AST` defines normalized node shapes and helper contracts shared by parser,
  evaluator, unparser, and MathML rendering. AST factories own child-parent
  links and validate expression slots before storing parser-created nodes.
- `ExpressionValue` centralizes the expression-boundary checks used by
  `Context`, `Interpreter`, and function-call helpers to reject statement and
  control-flow nodes outside statement execution paths.
- `FunctionCall`, `FunctionArguments`, `FunctionSignature`, and
  `FunctionValidation` bind arguments and enforce declarative contracts.
- `FunctionWorkspace`, `FunctionStack`, `CallFrame`, and `Scope` isolate local,
  persistent, global, caller, and base workspace behavior.
- `Complex`, `ComplexNumber`, and `ComplexDecimal` provide numeric backends.
- `MultiArray` defines MATLAB-style multidimensional array storage, indexing,
  broadcasting, and assignment behavior.
- Class runtime modules model MATLAB/Octave `classdef` metadata, instances,
  member attributes, events, listeners, accessors, inheritance, and common
  static/instance dispatch paths without coupling low-level runtime values to
  parser internals.
- `BLAS`, `LAPACK`, and `LinearAlgebra` provide lower-level and higher-level
  numerical routines.

## Maintenance Rules

New behavior should document the compatibility contract it assumes. When
MATLAB, Octave, and MathJSLab behavior differ, tests and comments should make
the chosen behavior explicit.

Avoid putting policy in low-level numeric kernels unless the policy is part of
the numeric operation itself. Interpreter-level validation, function
signatures, and user-facing diagnostics should stay near the call binding layer
whenever possible.

Circular dependencies in `src/` are treated as architectural failures. New
runtime modules should depend on shared contracts or type-only imports instead
of introducing cycles between parser, AST, interpreter, and value layers.

Ordinary user-function bodies now share a generator call lifecycle with the
synchronous evaluator. Simple assignments, binary/short-circuit operations and
parentheses can retain a returning call. Suspended call frames are detached
from the active Context and restored on resume/unwind; numeric and container
values remain opaque. See [resumable execution](resumable-execution.md) for the
supported subset and remaining indexed multi-output and indirect-call
migrations.

Ordinary calls now request argument expansion and positional/name-value default
evaluation from the driver, retaining completed inputs and bindings. Simple
multi-output assignments retain lazy outputs and ignored-output masks. The
synchronous and asynchronous drivers share these call preparation/binding
generators; numeric/container storage remains outside the machine.

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

## Runtime distribution identity

Public ESM runtime bundles share the exported core module instead of embedding
another interpreter and numeric facade. Runtime.ts exports explicit existing
members through lib-core; Worker server and remote planning use that same
boundary. Webpack externalizes this boundary only for runtime bundles. Worker
artifacts use their platform core by relative URL; ordinary runtime imports use
mathjslab/core and its platform export conditions. The original runtime export
names and typed contracts are preserved.

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
