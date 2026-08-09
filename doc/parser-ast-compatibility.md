# Parser and AST Compatibility

MathJSLab's parser is implemented with ANTLR grammars in
`src/MathJSLabLexer.g4` and `src/MathJSLabParser.g4`. The grammar is developed
against MATLAB/Octave syntax, with GNU Octave's `lex.ll` and `oct-parse.yy`
used as the main public reference when the language has ambiguous forms.

The generated parser should be treated as a syntax recognizer. Semantic
decisions belong in the AST factories and interpreter infrastructure. Parser
actions should create stable AST nodes, set parent links through the AST helper
methods, and preserve enough structure for runtime evaluation, unparse, MathML,
diagnostics, and future compatibility work.

## Current Coverage

The parser and AST currently cover the following high-value MATLAB/Octave-like
forms:

- script statement lists with comma, semicolon, newline, comments, block
  comments, and line continuations, preserving statement source ranges and
  semicolon output suppression in top-level and nested lists;
- expression parsing for numeric, string, matrix, cell, range, indexing,
  dynamic field, function-call, anonymous-function, function-handle,
  metaclass-literal, and package/class-qualified name forms;
- direct and descriptor-based indexing semantics for arrays, cells, character
  vectors, structures, and class objects, including public `substruct`,
  `subsref`, and `subsasgn` compatibility paths with chained `()`, `{}`, and
  `.` descriptors, dynamic fields, deletion, scalar broadcast, and implicit
  nested-path creation;
- multidimensional array and cell indexing over the engine's page-stacked
  storage model, including page slices, N-D expansion, logical subscripts,
  deletion, comma-separated-list expansion, and structure/cell conversion
  order;
- command syntax through word-list command nodes, including continuation lines
  and comments after ellipsis, while keeping command parsing restricted to
  registered command-word names. Registered commands with no following word
  list are promoted through an AST factory instead of evaluator-side node
  mutation;
- MATLAB package/class `import` declarations, including wildcard imports, as
  first-class no-op declarations that participate in later name lookup;
- browser-safe host-provided `.m` source lookup for functions, scripts, and
  classes, including MATLAB path forms such as `+pkg/name.m`, `@Class/Class.m`,
  and `@Class/method.m`;
- user function definitions with return lists, parameter lists, ignored `~`
  entries, nested statements, script-local functions, private subfunctions, and
  `arguments` blocks;
- empty and non-empty `arguments` blocks, including input/output, repeating,
  and output-repeating attributes plus AST validation declarations;
- control-flow blocks including `if`, `switch`, loops, `try`, and
  `unwind_protect`, with sequential browser fallbacks for `parfor` and `spmd`
  preserving and validating worker expressions;
- `classdef` syntax for class attributes, superclass lists, `properties`,
  `methods`, `events`, and `enumeration` sections;
- class section attributes, including negated attributes such as `~Dependent`
  and `!Hidden`;
- class property declarations with size, class, validator-function, and default
  clauses, preserving the same validation node structure used by function
  `arguments` blocks;
- adjacent event and enumeration declarations such as `events A B` and
  `enumeration Red(1) Blue(2)`;
- class method bodies and abstract-style method prototypes such as
  `y = area(obj)` and `reset(obj)`.

## AST Contracts

The AST layer normalizes parse output into node contracts exported from
`src/AST.ts`. Important compatibility contracts include:

- `NodeFunctionDefinition.arguments` stores `NodeArguments` blocks separately
  from function body statements;
- empty `arguments` blocks are preserved as `NodeArguments` with an empty
  validation list, so parse/unparse round-trips do not erase source structure;
- `NodeArgumentValidation` keeps the declared name, optional size, class,
  validator functions, and default expression as distinct child nodes. Class
  property validation declarations reuse this shape so parser and runtime
  validation paths stay aligned. Size and validator-function lists are
  expression-boundary values, not arbitrary AST inputs;
- AST arrays built by `factoryExpressionList`, including index arguments,
  superclass-constructor arguments, class-enumeration arguments, validation
  sizes, and validator-function lists, are expression-boundary arrays;
- `NodeImport` stores imported qualified names as identifier-like entries with
  parent/index links, including wildcard names such as `pkg.*`;
- statement-list parser actions attach `start`/`stop` source coordinates to
  statement nodes and apply semicolon-driven `omitOutput` through shared parser
  helpers, keeping top-level and nested block lists structurally consistent;
- `NodeCmdWList` construction, including empty word-list commands, should go
  through AST factories so contextual command-form promotion does not mutate
  arbitrary identifier nodes in the interpreter;
- `NodeReturnList` represents lazy multi-output values. Use
  `AST.nodeBoundedReturnList` for fixed maximum-output helpers and
  `AST.nodeCommaSeparatedReturnList` for values that should expand as
  comma-separated lists; direct metadata mutation should stay inside AST
  factories;
- public descriptor-based `subsref` should preserve intermediate
  comma-separated lists from structure arrays and cell contents, applying the
  next descriptor to each expanded element instead of reducing to the first
  value. `subsasgn` should mirror this distribution when assigning through
  structure arrays, cells, object arrays, and cells containing objects;
- `NodeFor` preserves `parallel === true` for `parfor` and stores optional
  worker expressions separately from the loop target/range;
- `NodeOperation` consumers should narrow through the AST binary, prefix, and
  postfix guards before reading operands. Parser actions still produce one
  operation family, while interpreter and unparser paths now enforce the
  refined shapes they consume;
- `RuntimeExpressionValue` names evaluated runtime values accepted in
  expression position, while `StrictNodeExpr` is the documented expression
  contract for new hand-written AST code. `LegacyNodeExprCarrier` names the
  remaining broad compatibility edge while older evaluator reducers are
  migrated;
- `ExpressionBoundaryValue` is the result type for validated expression
  boundary helpers. It accepts strict expression values plus explicit
  `NodeList` execution-result carriers, and should be preferred when a helper
  has already rejected statements/control-flow nodes;
- call-site argument lists that have crossed AST factory boundaries should keep
  the `ExpressionBoundaryValue[]` contract through function argument splitting,
  user-function binding, class constructor/method dispatch, and native indexing
  helpers, instead of widening back to legacy expression arrays. Call-frame
  metadata used by `inputname` should preserve the same boundary-checked
  argument shape, context-level comma-list expansion and built-in argument
  evaluation should keep that type, and low-level scope parameter binding
  should not widen already evaluated arguments back to generic AST expressions;
- evaluated values that cross expression-only boundaries should pass through
  the shared `ExpressionValue` helpers, so return lists, comma-separated lists,
  function-call arguments, assignment lowering, `for` iteration values,
  indexing descriptors, and class dispatch reject control-flow nodes before
  exposing ordinary values;
- `arguments`-block validation then narrows those boundary-checked values to
  concrete `RuntimeExpressionValue` data before applying size, class,
  name-value, repeating, and built-in `mustBe*` checks. Use the shared
  runtime-expression helpers when a boundary must reject parser-only carriers
  such as `NodeList` before writing runtime storage or inspecting value shape;
- class names declared in `arguments` blocks are preserved dynamically instead
  of being filtered by a syntax-time built-in class list. Runtime validation is
  responsible for matching built-in classes, the internal declarative `array`
  class, and user-defined class definitions/subclasses. Class-specific object
  arrays must contain at least one matching class/enumeration element, because
  generic empty arrays do not carry user-class metadata in the current runtime.
  Classdef property default validation is the narrow exception: it may accept
  the implicit empty placeholder produced for an uninitialized class-typed
  property, but subsequent assignments are validated strictly;
- runtime class-membership checks should use the same object-array semantics:
  homogeneous arrays of class instances or enumeration values match their
  declared class/superclass, while generic empty arrays do not imply a
  user-defined class. Interpreter-owned classification built-ins such as
  `class` may use this richer object-array metadata even when lower-level
  runtime validators still describe heterogeneous non-cell arrays as `array`;
- runtime class lookup should include built-in language classes that are not
  ordinary source-backed `classdef` files, including `handle`, event metadata
  classes, and `meta.*` reflection classes, so `isclass`, `exist`, and `which`
  agree with dispatch and `isa`;
- class introspection helpers such as `properties`, `methods`, `events`, and
  `superclasses` should accept scalar class objects, `meta.class` values, and
  non-cell arrays composed entirely of objects tied to the same class metadata.
  Mixed arrays should be rejected rather than selecting the first object;
- predicate-style checks that should return false instead of throwing should
  use the shared optional runtime-expression helper before calling runtime
  validators;
- structure-field storage should receive concrete `RuntimeExpressionValue`
  values after assignment and descriptor-based `subsasgn` evaluation, keeping
  AST-only carriers out of runtime data containers. Scalar `Structure` fields
  are typed as non-null concrete runtime values; use `MultiArray.emptyArray()`
  for MATLAB-like empty field values. Interpreter-created metadata structures,
  including function-handle workspaces and Set/Get property snapshots, should
  use the same structure-field contract. `MultiArray`'s structural helpers
  preserve `null`/`undefined` only for array/cell construction slots, not for
  structure fields;
- native array, cell, and character indexing should receive only validated
  `IndexArgument` values (`ComplexType` or `MultiArray`). Use
  `MultiArray.indexArguments` at interpreter/context boundaries rather than
  forwarding raw AST subscript nodes or arbitrary evaluated runtime values;
- native indexed assignment should prepare scalar RHS values as concrete
  `RuntimeExpressionValue` data before wrapping them for `MultiArray`
  assignment, while already-materialized `MultiArray` RHS values preserve their
  array/cell shape. Empty arrays used below an indexed property or structure
  path are scalar deletion values for each selected branch, not zero-value
  assignment lists;
- workspace initializer paths such as `assignin`, `global = value`, and
  `persistent = value` should store concrete `RuntimeExpressionValue` data when
  an initializer is supplied;
- per-function persistent tables store `RuntimeExpressionValue` entries and
  should reject non-runtime workspace carriers before saving state between
  function calls. Helpers that write evaluated values into workspaces should
  use the runtime-name-writer contract instead of the broader scope contract,
  which also carries parser and definition nodes;
- class-instance property tables and event-data public fields expose
  `RuntimeExpressionValue` values, so object state does not retain parser-only
  AST carriers after construction or assignment;
- function-call and class-dispatch resolution should not classify empty arrays
  as object arrays by vacuous matching. Empty arrays must fall back to ordinary
  indexing or undefined-reference diagnostics unless a path explicitly carries
  class metadata;
- resolved class-enumeration values store constructor-like member arguments as
  `RuntimeExpressionValue` entries, separating parsed enumeration argument
  expressions from runtime enumeration instances;
- public `meta.*` object properties expose `RuntimeExpressionValue` data. When
  a parser-only class metadata object has an unevaluated property default, the
  default is represented as compact expression text rather than an AST node;
- `MultiArray.linearize` and related indexing helpers must preserve
  MATLAB/Octave column-major logical order over the engine's page-stacked
  physical storage. Optimizations should stay equivalent to
  `linearIndexToMultiArrayRowColumn`. Conformance coverage should include N-D
  selection, assignment, expansion, deletion, logical masks, and cells whenever
  these helpers change;
- AST factory methods validate expression slots, function signatures,
  `arguments` metadata, class sections, branch/loop bodies, and array elements
  before storing child nodes;
- `NodeClassDef.sections` contains `NodeClassSection` entries with
  `attributeTable` indexes for duplicate-preserving attribute lookup;
- method prototypes inside class `methods` sections are represented as
  `NodeFunctionDefinition` nodes with `attributes.prototype === true`;
- superclass lists preserve package-qualified names and multiple inheritance
  separators in a normalized `&` form;
- AST factory methods are responsible for parent pointers on child nodes. The
  interpreter should not repair ordinary parent links during evaluation.

## Compatibility Tests

The release-facing parser/AST compatibility fixtures are concentrated in:

- `src/ParserCompatibility.spec.ts` for parse, unparse, and execution fixtures;
- `src/ParserAstCompatibility.spec.ts` for structural AST contracts;
- `src/AST.spec.ts` for AST factory behavior and parent-pointer invariants;
- `src/IndexingCompatibility.spec.ts` for indexing, comma-separated-list, and
  assignment compatibility fixtures;
- `src/DispatchCompatibility.spec.ts` for function/class dispatch precedence
  and operator compatibility fixtures;
- `src/CompatibilityStability.spec.ts` for integrated parser/AST/runtime
  stability scenarios that combine imports, class sources, functions, and
  control flow;
- `src/SyntaxDiagnostic.spec.ts` for source-aware syntax diagnostic formatting.

When changing the grammar, regenerate the ANTLR output and run at least:

```sh
npm run build:parser
npm run build:types
npm run test:circ
npx jest --selectProjects unit-tests --runInBand --runTestsByPath src/AST.spec.ts src/ParserCompatibility.spec.ts src/ParserAstCompatibility.spec.ts src/IndexingCompatibility.spec.ts src/DispatchCompatibility.spec.ts src/CompatibilityStability.spec.ts src/SyntaxDiagnostic.spec.ts
```

For release preparation, also run the class and function infrastructure suites,
because class parsing and function parsing share several AST contracts:

```sh
npm run test:class
npm run test:function-infrastructure
npm run test:circ
npm run build:types
npm run test:unit
```

## Known Boundaries

The parser, AST, and interpreter now share explicit contracts for many high
value language forms, but MathJSLab is not yet a complete MATLAB/Octave
language implementation. Remaining boundaries include:

- general external filesystem lookup for functions, scripts, and classes is
  deferred. Browser-first host-provided source APIs exist for function files,
  script files, and class sources, and those APIs remain the compatibility
  contract until a general external-file layer is designed;
- runtime class support covers metadata, construction, properties, methods,
  events, enumerations, listeners, accessors, inheritance, superclass calls,
  browser-hosted external method files, `subsref`, `subsasgn`, `SetGet` mixins,
  and common static/instance dispatch paths, but less common class edge cases
  should still grow through focused, test-backed increments;
- class attributes are parsed and indexed broadly. Runtime enforcement exists
  for the attributes consumed by class metadata, access checks, construction,
  events, abstract/sealed behavior, and dispatch; remaining attributes should
  be enabled only when their MATLAB/Octave semantics are implemented;
- MATLAB/Octave built-in library and toolbox coverage remains intentionally
  incomplete and is separate from parser/AST language compatibility;
- syntax diagnostics are normalized and source-aware, but exact MATLAB/Octave
  diagnostic wording is not a parser contract unless a test fixture requires
  it;
- built-in signatures are declarative and now validate alternatives and common
  dimension forms before runtime helper code executes, but the native function
  library still grows independently from parser/AST coverage;
- circular dependencies are treated as architectural failures and must remain
  absent from `src/`;
- Octave-specific grammar branches should continue to be imported in focused
  increments, with parser fixtures added before or alongside interpreter
  behavior.
