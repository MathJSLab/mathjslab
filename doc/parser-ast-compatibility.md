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
  comments, and line continuations;
- expression parsing for numeric, string, matrix, cell, range, indexing,
  dynamic field, function-call, anonymous-function, function-handle,
  metaclass-literal, and package/class-qualified name forms;
- direct and descriptor-based indexing semantics for arrays, cells, character
  vectors, structures, and class objects, including public `substruct`,
  `subsref`, and `subsasgn` compatibility paths;
- command syntax through word-list command nodes, including continuation lines
  and comments after ellipsis, while keeping command parsing restricted to
  registered command-word names;
- MATLAB package/class `import` declarations, including wildcard imports, as
  first-class no-op declarations that participate in later name lookup;
- browser-safe host-provided `.m` source lookup for functions, scripts, and
  classes, including MATLAB path forms such as `+pkg/name.m`, `@Class/Class.m`,
  and `@Class/method.m`;
- user function definitions with return lists, parameter lists, ignored `~`
  entries, nested statements, script-local functions, private subfunctions, and
  `arguments` blocks;
- empty and non-empty `arguments` blocks, including input/output attributes and
  AST validation declarations;
- control-flow blocks including `if`, `switch`, loops, `try`, and
  `unwind_protect`, with `parfor` preserving optional worker expressions;
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
  validation paths stay aligned;
- `NodeImport` stores imported qualified names as identifier-like entries with
  parent/index links, including wildcard names such as `pkg.*`;
- `NodeFor` preserves `parallel === true` for `parfor` and stores optional
  worker expressions separately from the loop target/range;
- `NodeOperation` consumers should narrow through the AST binary, prefix, and
  postfix guards before reading operands. Parser actions still produce one
  operation family, while interpreter and unparser paths now enforce the
  refined shapes they consume;
- `StrictNodeExpr` is the documented expression contract for new hand-written
  code. `LegacyNodeExprCarrier` names the remaining broad compatibility edge
  while generated parser actions and older evaluator reducers are migrated;
- `ExpressionBoundaryValue` is the result type for validated expression
  boundary helpers. It accepts strict expression values plus explicit
  `NodeList` execution-result carriers, and should be preferred when a helper
  has already rejected statements/control-flow nodes;
- evaluated values that cross expression-only boundaries should pass through
  the shared `ExpressionValue` helpers, so return lists, comma-separated lists,
  function-call arguments, assignment lowering, `for` iteration values,
  indexing descriptors, and class dispatch reject control-flow nodes before
  exposing ordinary values;
- native array, cell, and character indexing should receive only validated
  `IndexArgument` values (`ComplexType` or `MultiArray`). Use
  `MultiArray.indexArguments` at interpreter/context boundaries rather than
  forwarding raw AST subscript nodes or arbitrary evaluated runtime values;
- `MultiArray.linearize` and related indexing helpers must preserve
  MATLAB/Octave column-major logical order over the engine's page-stacked
  physical storage. Optimizations should stay equivalent to
  `linearIndexToMultiArrayRowColumn`;
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
