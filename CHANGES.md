# Release notes

All notable changes to this project will be documented in this file. This
project adheres to [Semantic Versioning](http://semver.org/).

## 2.2.0

- Aligned release metadata for version 2.1.5 and regenerated the API reference
  after the parser/AST/runtime typing pass.
- Documented the expression-boundary architecture in code and project docs,
  including the shared `ExpressionValue` helper used by function returns,
  comma-separated lists, `for` assignment lowering, indexing descriptors, and
  class dispatch paths.
- Cleaned release-adjacent JSDoc coverage in runtime expression, assignment,
  class dispatch, and array helpers, while keeping larger numeric-kernel
  documentation cleanup as separate future maintenance.
- Named the remaining broad `NodeExpr` compatibility edge as
  `LegacyNodeExprCarrier`, keeping `StrictNodeExpr` as the documented typed AST
  expression contract while parser-generated and legacy evaluator paths are
  migrated incrementally. Argument-validation defaults and function-handle
  bodies now model omitted expressions with explicit `null` unions.
- Added focused AST guards for command-form calls, superclass constructor
  calls, range/colon/end nodes, runtime expression values, and the aggregate
  `StrictNodeExpr` contract to support safer parser/evaluator migrations.
- Tightened class metadata rendering around the strict expression guard so
  validation displays only recognized expression/list forms, while evaluated
  property defaults keep the broader `NodeInput` contract used by runtime meta
  objects.
- Removed the remaining class metadata circular dependency by making class
  member definitions generic over their owning class type and specializing them
  in the runtime modules that work directly with `ClassDefinition`.
- Tightened the default owner type of generic class member metadata from `any`
  to `unknown`, keeping runtime modules explicitly specialized with
  `ClassDefinition`.
- Made circular dependency checks a hard architectural gate: `test:circ` now
  fails the build when `madge` detects cycles.
- Reused AST guards in function workspace and argument validation paths:
  `inputname` now recognizes identifiers through `AST.isNodeIdentifier`, and
  implicit custom validators only build calls from strict expression values.
- Guarded lazy function return-list construction so fixed returns and
  `varargout` entries must be strict expression values or explicit `NodeList`
  execution-result carriers before they are exposed to callers.
- Reused the same return-expression boundary in context lazy return-list
  helpers so class dispatch and direct value-return paths reject control-flow
  statements before exposing outputs to callers.
- Routed scalar class-dispatch result arrays through the same guarded return
  boundary, removing the remaining unchecked `NodeExpr` casts from those paths.
- Routed comma-list argument expansion through a shared expression-value guard
  so evaluated positional arguments reject control-flow nodes before reaching
  built-in, function, indexing, and class-dispatch helpers.
- Guarded interpreter-owned comma-separated return lists so struct/cell field
  expansion and built-in helper results cannot expose control-flow statements
  as ordinary returned values.
- Guarded scalar and row-vector `for` loop iteration values so evaluated loop
  expressions cannot expose control-flow statements as ordinary assignments.
- Centralized evaluated expression-boundary checks in a shared helper used by
  function returns, context argument/return expansion, interpreter-owned
  comma-separated lists, and `for` loop iteration values.
- Added factory-time AST validation for command-word arguments, index
  expression arguments, and superclass constructor arguments so parser-created
  expression slots reject statement/block nodes before evaluation.
- Extended factory-time AST validation to ranges, operator operands, and
  indirect-reference fields so more expression composites reject invalid AST
  shapes at construction time.
- Added factory-time validation for `arguments` declarations and branch/loop
  expressions so control-flow factories reject statement/block nodes in
  condition, selector, target, default, and worker-count slots.
- Added factory-time validation for function-handle bodies, class attribute
  values, class property defaults, and enumeration constructor arguments.
- Replaced silent filtering with explicit factory-time validation for
  `arguments`, `switch`, classdef attribute/superclass/section lists, and class
  section attribute lists.
- Added factory-time validation for function-definition return, parameter,
  `arguments` block, and body lists, plus anonymous function-handle parameter
  lists, so invalid parser nodes are rejected before registration/evaluation.
- Added section-kind-aware validation for classdef bodies: properties, methods,
  events, and enumeration sections now reject members from the wrong section
  before class metadata construction.
- Added factory-time validation for declaration entries, control-flow body
  lists, `try`/`catch`, `unwind_protect`, and `spmd` bodies/workers so block
  factories reject misplaced parser nodes before evaluation.
- Added matrix/cell row validation so array constructors reject statement and
  block nodes before handing delayed expression elements to `MultiArray`.
- Added factory-time validation for `arguments` and class-property size, class,
  and validator-function declarations.
- Tightened `FunctionArguments` consumers to reject invalid AST metadata
  explicitly instead of silently filtering malformed parameter, return, block,
  or validation entries.
- Tightened function-call layout and arity introspection helpers to reject
  malformed parameter/return metadata explicitly instead of silently ignoring
  invalid entries.
- Updated class method metadata so `meta.method.InputNames` includes defaulted
  function-header parameters instead of reporting only bare identifier
  parameters.
- Tightened class member collection so `ClassDefinition` rejects structurally
  invalid section members explicitly instead of silently skipping malformed
  entries.
- Routed constructor and property accessor signature checks through validated
  method-header helpers so malformed class method parameters/returns are
  rejected explicitly before special-method validation.
- Validated variadic arguments forwarded by `builtin` and `feval` before
  dispatch so internal non-expression values cannot cross those call
  boundaries.
- Routed class event callbacks and special method dispatch (`subsref`,
  `subsasgn`, property setters, operator overloads, `end`, and
  `numArgumentsFromSubscript`) through the same expression-boundary guard.
- Guarded `Context.resolveIdentifier` so malformed symbol-table values cannot
  be exposed as ordinary identifier expressions by unchecked casts.
- Extended expression-boundary helpers to validate unknown values directly and
  used them when expanding cell-indexing results into comma-separated return
  lists.
- Guarded object-array field assignment values before linearization so invalid
  runtime elements cannot be distributed into class property assignments.
- Relaxed interpreter-owned comma-separated return-list inputs to `unknown[]`
  and validated them at selection time, removing unchecked casts from class and
  structure field expansion paths.
- Validated implicit class method receiver arguments and native `subsasgn`
  descriptor subscripts before forwarding them into function-call and indexing
  execution paths.
- Added validated copy helpers for `for` assignment values and assignment
  target cloning so malformed runtime/AST values cannot enter assignment
  lowering through recursive copy paths.
- Validated `builtin` and `feval` control arguments before resolving call
  targets, so malformed internal values fail with expression-boundary
  diagnostics instead of unchecked casts.
- Added an interpreter-owned expression-list guard for structure-field list
  expansion, dot subscript descriptors, and event callback dispatch.
- Validated nested assignment result lists before returning assigned values
  from embedded assignment expressions, and guarded linearized cell-assignment
  indices without unchecked expression casts.
- Validated boolean control arguments before converting them to runtime
  booleans, starting with the optional `inputname` flag.
- Tightened `for` loop value expansion so structure field values and generated
  column/field iteration values pass through expression-boundary validation
  instead of relying on casts.
- Routed legacy class-property default expressions through the AST factory
  expression guard before building the underlying `arguments` declaration.
- Removed the unnecessary `NodeExpr` cast from empty `varargout` cell
  initialization, relying on the `MultiArray` slot contract that already
  permits `undefined` placeholders.
- Named and validated the unresolved call-target placeholder path in
  `Context.resolveIdentifier`, so only identifier nodes survive late call
  dispatch as unresolved function targets.
- Routed interpreter copy and assignment-target cloning results back through
  the expression boundary, removing unchecked `NodeExpr` casts from those
  central evaluator paths.
- Guarded `switch` scalar normalization and cell-array case alternatives so
  malformed non-expression values cannot reach MATLAB/Octave-style case
  comparison.
- Widened context return-expression validation to accept unknown scalar-array
  contents directly, removing the remaining unchecked return-array cast from
  that lazy class-dispatch result path.
- Routed native subscript scalar results through the expression boundary, so
  malformed structure fields or indexed array elements cannot cross chained
  `subsasgn`/`subsref` helper paths as ordinary values.
- Copied function-handle workspace metadata through the generic runtime copy
  helper and expression boundary, preventing malformed captured values from
  being exposed by `functions(handle).workspace`.
- Added a validated expression linearization helper and used it for `for` loop
  multi-target assignment lowering, avoiding the generic `MathObject` cast
  while rejecting malformed sequence elements earlier.
- Routed interpreter expression copying directly through `RuntimeValue.copy`,
  removing the remaining `MathObject` cast from assignment and `for` lowering
  copy helpers.
- Removed the remaining unchecked runtime-value casts from `Interpreter`
  assignment-target cloning after validating cloned `MultiArray` target
  elements through the existing expression boundary.
- Removed redundant `ElementType` casts from `Structure` construction and copy
  paths, relying on the generic `RuntimeValue.copy` type contract and extending
  coverage for copied constructor fields.
- Refactored anonymous `FunctionHandle` AST-node copying into separate node and
  nested-value helpers, removing broad `unknown` casts while preserving parent
  relinking for copied lambda parameter/body nodes.

## 2.1.4

- Started the AST typing pass by introducing explicit `NodeStatement`,
  `NodeClassMember`, `NodeProgramElement`, and `NodeAssignmentTarget` contracts
  with matching AST guards. Function arity introspection now consumes the
  shared function parameter and return-target contracts instead of local
  structural aliases.
- Added narrower AST guards for operation and class member nodes, and migrated
  parser compatibility fixtures away from untyped AST navigation helpers.
- Split operation narrowing into binary, prefix, postfix, defaulted-parameter,
  and metaclass guards, then reused those contracts in function argument and
  class member metadata helpers.
- Routed interpreter operator evaluation through the shared operation guards so
  binary, short-circuit, prefix, postfix, and assignment dispatch validate
  their AST shape before reading operands.
- Routed source and MathML unparsing of operation nodes through the same
  guards, including explicit coverage for prefix, postfix, and transpose
  operation rendering.
- Reused AST identifier guards while resolving class member attribute values,
  removing remaining manual identifier shape checks from that metadata path.
- Added shared typed parser helpers for classdef fixtures and migrated class
  runtime specs away from repeated untyped `Parse(...).list[0]` casts.
- Reused AST guards in class meta-object rendering for identifiers, lists,
  index expressions, and dot references instead of local structural casts.
- Reused AST class-member guards while collecting runtime class property,
  method, event, and enumeration metadata.
- Reused AST function-definition guards in interpreter function discovery,
  script-local pre-registration, nested-function registration, and function
  definition evaluation paths.
- Replaced remaining private AST-helper and untyped scalar reads in focused
  class metadata, class instance, class member, and character string specs with
  typed public factories and runtime guards.
- Extended parser test utilities with typed execution-list validation and
  reused them in interpreter specs for classdef parsing, class metadata tables,
  function-handle copying, runtime class definition lookup, and qualified
  `arguments` validation fixtures.
- Replaced additional untyped scalar/result handling in core function,
  multi-array, context dispatch, and function lookup specs with typed guards,
  complete closure fixtures, and shared execution-list helpers.
- Added typed BLAS spec helpers for scalar execution and column-vector
  extraction, removing repeated untyped result and row casts from dot, norm,
  triangular-solve, gemv, and ger fixtures.
- Removed the remaining untyped casts from active function workspace and
  interpreter signature specs by using the existing `definingScope` contract,
  typed built-in callback arguments, and explicit built-in signature metadata.
- Updated `switch/case` matching to use MATLAB/Octave-like value equality
  instead of elementwise `==` truth reduction, including scalar 1x1 array
  normalization and coverage for empty arrays, matrix mismatches, cell
  alternatives, and function handles.
- Allowed `return` to terminate host-provided script execution while keeping
  interactive/top-level `return` invalid outside a function or script context.
- Aligned `eval`/`evalin` catch-string handling with control-flow semantics so
  `return`, `break`, and `continue` propagate instead of being treated as
  catchable errors; `eval('return')` now exits the active user function.
- Exposed host-provided script sources through lookup introspection:
  `exist(name)`/`exist(name, 'file')` now report browser-resolved scripts as
  `.m` files and `which(name)` identifies them as scripts without making them
  callable as functions.
- Normalized table/provider source lookup for browser-hosted `.m` files so
  function, script, and class sources can be keyed by canonical names or
  path-like forms such as `+pkg/name.m` and `folder/script.m`.
- Corrected virtual `.m` path canonicalization for `@Class/Class.m` class
  folders so class files resolve to `Class`/`pkg.Class`, while method files
  such as `@Class/method.m` still resolve to dotted member names.
- Added interpreter-level coverage for virtual source tables keyed by MATLAB
  package/class paths, including package functions, class folders, and script
  paths resolved through the browser-safe `.m` source APIs.
- Aligned fetch-backed manifest source resolution with table/provider lookup so
  manifest entries are indexed by both canonical names and MATLAB/Octave path
  forms, including `@Class/Class.m` class folders, and added end-to-end
  manifest coverage for imports, wildcard imports, function handles, `which`,
  `exist`, scripts, package functions, and package classes.
- Added lazy loading for external class method files declared by concrete
  classdef method prototypes, including browser-hosted `@Class/method.m` paths,
  private subfunctions in method files, signature validation against the
  classdef prototype, and lookup/introspection guards so method files are not
  reported as class sources.
- Extended fetch-backed manifest coverage so `@Class/method.m` entries are
  indexed as class method sources and execute through the same browser-safe
  resolver path as classdef files, scripts, imports, and function handles.
- Extended external class method coverage to indirect dispatch paths, including
  dependent-property get accessors, operator overloads, `subsref`, `subsasgn`,
  and `numArgumentsFromSubscript` methods loaded from `@Class/method.m` files.
- Added stability coverage for command-form option words, quoted arguments, and
  continued command lines, plus inherited external class methods loaded from
  the declaring superclass source.
- Recognized package class constructors declared with the simple class name,
  including browser-hosted `+pkg/@Class/Class.m` sources.
- Added coverage for explicit `GetMethod`/`SetMethod` property accessors loaded
  from browser-hosted `@Class/method.m` files.
- Aligned virtual `.m` source path normalization with MATLAB/Octave path
  semantics by ignoring ordinary directories and using only `+pkg`, `@Class`,
  and file names for canonical function/class lookup.
- Centralized external class method prototype materialization and added
  coverage for inherited static methods loaded from the declaring superclass
  `@Class/method.m` source.
- Reused the same prototype-body materialization guard for class constructors
  so concrete constructor declarations without executable bodies no longer
  instantiate default objects silently.
- Deduplicated effective inherited class member lists by superclass precedence
  so class introspection metadata no longer reports duplicate inherited
  properties, methods, events, or enumeration members.
- Kept sealed-method override validation independent from public metadata
  deduplication so subclasses still reject overrides of any sealed inherited
  method, including methods hidden behind an earlier superclass duplicate.
- Recognized MATLAB `matlab.mixin.SetGet` and `matlab.mixin.SetGetExactNames`
  as built-in handle mixin superclasses, and added `get`/`set` support for
  class instances with exact, case-insensitive, and
  `PartialMatchPriority`-aware property-name resolution.
- Extended the inherited `get`/`set` mixin behavior to homogeneous object
  arrays, including element-wise property reads, scalar value expansion, and
  per-element value assignment checks.
- Added `get(objArray)` support for `matlab.mixin.SetGet` object arrays,
  returning a structure array with the public visible properties of each
  object.
- Aligned `matlab.mixin.SetGet` property reads for object arrays with MATLAB:
  `get(objArray, propname)` now returns a cell array,
  `get(objArray, {prop1, prop2})` returns an object-by-property cell matrix,
  and `get(objArray)` returns a `numel(objArray)`-by-1 structure array.
- Added additional `matlab.mixin.SetGet` `set` forms: `set(obj)` returns a
  structure of publicly settable properties, `set(obj, propname)` returns the
  finite-value cell placeholder, and `set(obj, struct)` assigns properties from
  structure fields.
- Added the documented `set(objArray, propertyNames, propertyValues)` cell
  array form for `matlab.mixin.SetGet`, including `1`-by-`N` property-name
  validation and `numel(objArray)`-by-`N` value-cell validation.
- Allowed documented `matlab.mixin.SetGet` `set` combinations where a leading
  structure or property-name/value cell form is followed by additional
  property/value pairs.
- Added `matlab.mixin.SetGet` `set(obj, Name=Value)` support by preserving
  top-level name-value arguments for the `set` built-in instead of evaluating
  them as ordinary assignments.
- Corrected built-in signature validation so declared parameter alternatives
  are accepted when the primary parameter shape does not match, improving
  coverage for built-ins that accept multiple argument classes or shapes.
- Tightened scalar-or-vector dimension signatures for indexing, array
  construction, reshaping, repetition, identity matrices, and variance/std
  option parsing so invalid calls are rejected consistently by the declarative
  built-in signature validator.
- Corrected the direct `logspace` invalid-arity diagnostic so it reports
  `logspace` instead of `linspace`.
- Refreshed release-facing parser/AST compatibility documentation, README
  language-subset notes, and focused JSDoc comments for typed parser helpers,
  built-in parameter alternatives, and spacing helper contracts.

## 2.1.3

- Advanced MATLAB/Octave parser and AST compatibility across several grammar
  areas, including imports, `parfor` worker clauses, command-form handling,
  quoted and qualified names, classdef sections, class property validation
  declarations, superclass lists, metaclass literals, and additional chained
  indexing forms. The generated ANTLR lexer/parser were refreshed from the
  updated `.g4` grammars.
- Expanded runtime class infrastructure for MATLAB/Octave-style `classdef`
  semantics. Class loading now uses browser-safe host-provided source APIs,
  resolves superclass relationships, supports richer property/method/event/
  enumeration metadata, enforces more attribute combinations, and improves
  static, instance, superclass, constructor, `subsref`, `subsasgn`, and
  `numArgumentsFromSubscript` dispatch behavior.
- Added broader support for class objects and meta-objects, including
  `metaclass`, `?ClassName` literals, `properties`, `methods`, `events`,
  `enumeration`, `superclasses`, `isprop`, `ismethod`, enumeration values,
  constant properties, dependent properties with accessors, handle deletion,
  listeners, and event data objects compatible with `event.EventData` and
  `event.PropertyEvent`.
- Completed another round of `classdef` compatibility work with method
  prototypes, `AbortSet`, abstract properties, `HandleCompatible` and
  `NonCopyable` metadata, and evaluated runtime property defaults exposed
  through `meta.property.DefaultValue` and validation metadata.
- Improved MATLAB/Octave name lookup and workspace behavior. The interpreter
  now handles imported names, qualified function/class references,
  host-provided function and script sources, script-local functions, private
  function-file subfunctions, and clearer separation between ordinary dot
  indexing and package/class-qualified symbolic access.
- Refined indexing and comma-separated-list semantics for cells, structs, class
  objects, assignments, `for` targets, function-call arguments, and property
  access. This includes better multi-output expansion behavior and additional
  compatibility coverage for indexing and dispatch edge cases.
- Extended diagnostics and introspection. Syntax diagnostics now use normalized
  source-aware caret messages, `catch ME` preserves the thrown stack, `dbstack`
  and `functions` metadata were improved, and the interpreter now exposes
  MATLAB/Octave-like `lasterror`, `lastwarn`, and `warning` state.
- Strengthened built-in signatures and validation metadata for the expanded
  runtime surface, keeping invalid-call diagnostics, `nargin`/`nargout`, and
  signature checks aligned with newly registered interpreter functions.
- Extended linear algebra compatibility with `norm(v,-Inf)`, matrix-aware
  `norm` orders, `cond(A,p)`, and `rank(A,tol)` support, including direct and
  interpreter-level tests for accepted and rejected MATLAB/Octave-compatible
  call forms.
- Added and reorganized unit coverage for parser/AST compatibility, indexing,
  dispatch, stability scenarios, syntax diagnostics, class metadata, function
  lookup, function introspection, and the broader interpreter semantics touched
  by this development cycle.
- Continued source documentation work with JSDoc comments for the interpreter
  contracts, host-provided source APIs, diagnostic helpers, class runtime
  infrastructure, scope/name resolution, AST helpers, and parser/lexer error
  listeners.
- Tightened AST list typing by introducing an explicit `NodeListElement`
  contract for parser assembly lists that contain clauses, function
  definitions, `arguments` nodes, and class section members. Added AST type
  guards for function definitions, class definitions, and `arguments`
  declarations, then used them in function-file discovery and argument
  validation paths. Function header parameter and return-list shapes are now
  represented by explicit AST contracts and consumed through AST guards by the
  interpreter signature checks and argument-validation layer. The AST builders
  for `arguments`, `switch`, and `classdef` now filter parser assembly lists
  through explicit node guards instead of broad structural casts. Name
  resolution, call dispatch, and assignment-target cloning also use the central
  AST guards for identifiers, index expressions, dot references, and ignored
  targets. Function-call layout and comma-separated return-list expansion now
  share the same explicit AST contracts for function parameters, return
  targets, and lazy return lists. Qualified-name detection and
  assignment-target validation now also rely on AST guards for identifiers,
  indexed expressions, dotted references, and ignored assignment targets.

## 2.1.2

- Continued the interpreter modularization started in the function
  infrastructure work. The execution `Context` was extracted from
  `Interpreter.ts` into `Context.ts`, and the `InterpreterError` hierarchy was
  moved into `InterpreterError.ts`, while keeping the public exports from
  `Interpreter.ts` compatible with existing imports.
- Tightened `Context` initialization so `Context.create()` now installs the
  expected global call frame immediately, and updated the `CallFrame`
  documentation to reflect that stack/error formatting is handled outside the
  frame data holder.
- Added focused unit tests for the extracted `Context` and `InterpreterError`
  modules, covering context construction, scope and built-in lookup, aliases,
  call-stack management, typed interpreter errors, and stack-trace formatting.
- Reworked internal set-like collections to use ES2015 `Set` and `Map`
  structures where membership or uniqueness is the intended behavior. This
  includes lexer keyword and command lookup, non-terminal token checks,
  undefined-reference dependency tracking, function argument validator tables,
  runtime class-name checks, and BLAS/LAPACK/linear-algebra configuration key
  validation, while preserving arrays where ordering, indexing, or duplicates
  are part of the engine semantics.
- Consolidated built-in function registration metadata with the functions that
  implement it. The new `FunctionSignatureEntry` interface allows each built-in
  registration table to keep its implementation and declarative call signature
  side by side, so `Configuration`, `CoreFunctions`, `LinearAlgebra`, and
  `Interpreter` can load callable functions and their validation metadata from
  the same source of truth.
- Reviewed and completed the migrated built-in signatures used by the
  interpreter call-validation layer, replacing placeholder signature entries
  with explicit arity and parameter metadata where appropriate. This keeps
  invalid-call diagnostics, `nargin`/`nargout` introspection, and overload
  validation aligned with the functions currently registered by the engine.
- Refined the Jest and TypeScript test setup after the signature-table
  migration. Additional focused test scripts were added for function-related
  suites, signature coverage tests were restored to exercise the new
  registration model, and `.spec.ts` files now declare their Jest globals
  locally with `/// <reference types="jest" />` instead of requiring the root
  `tsconfig.json` to include Jest types.
- Kept the production TypeScript configuration isolated from test-only globals.
  The root and build TypeScript configurations continue to type-check the
  engine with Node types only, while `tsconfig.jest.json` remains responsible
  for Jest-oriented command-line test compilation. This prevents browser and
  package builds from depending on Jest ambient declarations.
- Pinned the TypeScript development dependency to the last version known to
  work with the current build pipeline, avoiding accidental upgrades to a newer
  compiler release that breaks the existing `build:key` compiler-API helper.
  The `buildKeyTable` script remains based on the TypeScript compiler API so
  generated key tables continue to follow the project’s established generation
  path.
- Added dedicated unit test coverage for `AST.ts`, `BLAS.ts`, and
  `substSymbol.ts`. BLAS-specific test groups that had been living in
  `LAPACK.spec.ts` were moved into the new `BLAS.spec.ts`, keeping LAPACK tests
  focused on LAPACK behavior while preserving the existing BLAS coverage.
- Advanced parser and AST compatibility coverage for MATLAB/Octave-like source
  forms reviewed against GNU Octave grammar behavior. Dedicated parser fixtures
  now cover continuation/comment handling, command syntax, cell values before
  chained indexing, class method prototypes, negated class attributes, and
  empty `arguments` blocks.
- Preserved `arguments ... end` blocks as first-class AST and unparse
  structures even when their validation list is empty. `NodeArguments` and
  `NodeArgumentValidation` factories now maintain parent links consistently,
  and the interpreter unparser emits `ARGUMENTS`/`ENDARGUMENTS` blocks instead
  of dropping them.
- Added `doc/parser-ast-compatibility.md` to document the parser/AST
  compatibility contract, current coverage, release-oriented verification
  commands, and known boundaries before future grammar increments.
- Expanded in-code JSDoc coverage across the runtime infrastructure with
  non-mechanical contract documentation for class support, scope handling,
  structures, AST node invariants, `MultiArray` layout, BLAS/linear-algebra
  configuration, core built-ins, and the main interpreter pipeline.

## 2.1.1

- Documentation in the `doc/` directory listed in the `DOC.md` file,
  referencing the API generated by TypeDoc.
- Switch-Case-Otherwise block implemented in parser and AST.
- Dependencies updated.

## 2.1.0

- This release completes a broad redesign of the MATLAB/Octave-like function
  infrastructure in the MathJSLab interpreter. User-defined functions now have
  a more robust execution model, with clearer separation between function
  lookup, call binding, call frames, scopes, workspaces, callable objects,
  argument validation, signature metadata, and function introspection. The
  former interpreter-centered implementation was progressively split into
  dedicated modules such as `FunctionCall`, `FunctionArguments`,
  `FunctionArity`, `FunctionIntrospection`, `FunctionLookup`,
  `FunctionSignature`, `FunctionValidation`, `FunctionWorkspace`,
  `FunctionStack`, `Callable`, `CallFrame`, and `Scope`, leaving `Interpreter`
  focused on the central engine flow.
- The implementation of user-defined functions was expanded to cover the main
  MATLAB/Octave function mechanisms: multiple input and output arguments,
  `varargin`, `varargout`, `nargin`, `nargout`, omitted outputs with `~`,
  anonymous functions, function handles, nested functions, lexical closures,
  `feval`, `eval`, `evalin`, `assignin`, `inputname`, `narginchk`,
  `nargoutchk`, `persistent`, and `global`. Function calls now preserve call
  stack information more consistently, report function stack traces for errors
  raised inside nested calls, and handle forward references without confusing
  runtime errors from deeper frames with unresolved local references.
- The `arguments` block implementation was made substantially more MATLAB-like.
  It now supports input, output, and repeating argument blocks, default values,
  optional parameters, name-value options, struct-backed option groups,
  symbolic and inferred dimensions, output validation, custom validation
  functions, validation functions with parameters, and built-in validators such
  as numeric, scalar, vector, matrix, integer, finite, real, positive,
  nonnegative, nonzero, member, range, text, and class-like checks supported by
  the current engine. Argument validation now evaluates defaults, bounds, and
  validator calls in the appropriate temporary or function workspace context.
- Built-in function call validation was generalized through declarative
  signatures. The interpreter now derives arity, `nargin`, `nargout`, overload
  behavior, variadic groups, repeated parameter patterns, and invalid-call
  diagnostics from signature metadata instead of relying exclusively on ad hoc
  checks inside each built-in. Signature registration was moved closer to the
  classes that define the corresponding functions, including `CoreFunctions`,
  `LinearAlgebra`, and `Configuration`, while the interpreter loads those
  functions and their signatures through a common mechanism.
- The parser, lexer, AST, unparser, and MathML unparser were adjusted to
  support the new function features consistently. This includes support for
  command-form declarations such as `global` and `persistent`, richer function
  output lists, arguments-block declarations, name-value syntax, function
  handles, anonymous functions, tilde output placeholders, and the AST helpers
  needed to normalize declaration nodes across parser and unparser paths. The
  grammar changes were reviewed against GNU Octave's parser sources to keep the
  implementation aligned with MATLAB/Octave language behavior.
- Function-related state management was improved. Persistent variables are now
  stored per function definition, global variables share a base global storage
  model, `clear` interacts with user functions and persistent state more
  predictably, and closures preserve the lexical environments required by
  nested functions and anonymous handles. The engine also gained more precise
  behavior for caller/base workspace access through `evalin` and `assignin`.
- Function introspection was expanded and made more coherent. The behavior of
  `which`, `exist`, `functions`, `func2str`, `str2func`, `nargin`, `nargout`,
  `inputname`, `narginchk`, and `nargoutchk` was refined for built-ins,
  user-defined functions, anonymous handles, nested handles, and invalid usage
  cases. Unsupported or browser-limited external-file behavior remains
  intentionally conservative and is left for future work because MathJSLab runs
  primarily in the browser.
- The test suite was reorganized and expanded around the new function
  infrastructure. Unit tests in `src` were grouped into clearer nested
  `describe` structures, following the organization used by `LAPACK.spec.ts`.
  New focused tests were added for the extracted function modules, and a
  signature coverage metatest was added to verify that implemented built-ins
  and their declarative signatures remain synchronized. A new integration test
  project under `test/function-infrastructure` exercises cross-module function
  behavior, including built-in signature validation, `arguments` blocks,
  name-value and repeating arguments, output validation, persistent and global
  workspaces, closures, `feval`, `evalin`, and `assignin`.
- The function infrastructure code and related AST definitions were documented
  with extensive comments and JSDoc-style descriptions. The documentation added
  in source files explains the responsibilities of the new modules, the
  MATLAB/Octave compatibility assumptions behind the implementation, and the
  boundaries between parser structures, call binding, validation, workspace
  handling, and interpreter execution.
- Comments and JSDoc documentation were reviewed more broadly across core
  source files. Portuguese comments in maintained code were translated to
  English, empty or vague comment blocks were replaced with useful contracts,
  and additional documentation was added for AST nodes, BLAS/LAPACK layout
  assumptions, string handling, function-call helpers, introspection helpers,
  eigenvalue wrappers, and MultiArray indexing behavior.
- Test maintenance was improved by removing unused test-only helpers, replacing
  skipped LAPACK TRSM cases that used invalid fixtures with active conformant
  conjugate-transpose tests, and adding public contract tests for selected
  linear algebra validation paths.
- Jest linting was refined so helper assertions named with the `expect*`
  convention, plus the LAPACK eigensolver assertion wrappers, are recognized by
  `jest/expect-expect` without disabling the rule. Test callback factories that
  hid assertions from ESLint were converted into explicit assertion helpers.
- Maintainer documentation was added under `doc/`, covering the architecture,
  interpreter flow, numeric array model, testing strategy, and a generated
  Markdown API reference derived from exported declarations and JSDoc comments.
- A local `docs:api` script was added to generate `doc/api-reference.md` from
  exported TypeScript declarations and their JSDoc comments without introducing
  an additional documentation dependency.

## 2.0.0

- Releasing the latest version as 1.9.2 violated the concepts of Semantic
  Versioning, therefore the current version is changing the major version.
- Bug fix in the `README.md` file: link to the ES2022 bundle.
- All occurrences of
    - `Evaluator*` were replaced with `Interpreter*` (`Evaluator` as a method
      name have been retained).
    - `evaluator` were replaced with `interpreter`.
    - `EVALUATOR` were replaced with `INTERPRETER` Occurrences of `Evaluator`.
- The directory `promo` was created containing files related to promotional
  materials.
- Interpreter error handling was consolidated and improved:
    - Added a public `InterpreterError` hierarchy, including `EvalError`,
      `ReferenceError`, `UndefinedReferenceError`, `CircularReferenceError`,
      and `SyntaxError`.
    - Restored MATLAB/Octave-like stack trace reporting for errors raised
      inside nested user-defined functions.
    - Centralized interpreter error creation so runtime, reference, syntax,
      invalid-call, and return-list errors can preserve interpreter stack
      frames.
    - Added stack trace support to interpreter paths that use `AST` helper
      errors.
- Forward reference handling was improved:
    - Replaced message-regex based undefined-reference detection with the
      structured `UndefinedReferenceError` class.
    - Prevented errors propagated from nested function calls from being treated
      as local forward references.
    - Added circular dependency detection for unresolved forward references,
      reporting chains such as `A → B → A` and `A → B → C → A`.
- Added regression tests for interpreter stack traces, forward reference
  resolution, circular reference errors, exported error classes, and
  `AST`-helper errors reported through the interpreter.
- Reviewed and polished comments in `src/Interpreter.ts` and
  `src/Interpreter.spec.ts`, translating them to English and documenting the
  new error and forward-reference flow.

## 1.9.2

- Bug fix: During assignments where one variable was assigned to another, the
  previously defined variable was assigned by reference. Changes to the
  definition of the subsequent variable modified the original variable. This
  was resolved by making a copy of the literal object during the assignment in
  the body of the `Evaluator` method using `MathOperation.copy`, which has been
  improved to handle this case.
- Bug fix and new features: fully reworked array indexing in the MathJSLab
  engine to align with MATLAB/Octave semantics. This update fixes multiple
  inconsistencies in logical indexing, including correct handling of scalar
  logical indices (`true` and `false`), proper empty selection behavior
  (`a(false) → []`), and accurate linear indexing resolution. The indexing
  pipeline is now unified, ensuring consistent behavior across logical, linear,
  and subscript indexing modes, with correct support for `end`, colon (`:`),
  and dimension folding. Internally, the engine was refactored to use a
  centralized linear index resolution model, followed by dedicated helpers for
  selection, assignment, and deletion. This eliminates duplicated logic paths
  and improves correctness, maintainability, and extensibility. Deletion
  semantics (`A(I) = []`) were also standardized and made compliant with MATLAB
  rules, including dimension constraints. All changes are fully covered by the
  test suite, which now passes without regressions.
- Bug fix: Commands like `a() = 3` were interpreted as `a = 3`, not throwing an
  error. For compatibility with MATLAB/Octave, they now throw an error like
  'RangeError: invalid empty index list.'
- Due to dependency updates, it was necessary to include the option
  `"skipLibCheck": true` in the `tsconfig.types.esm2022` file, and the
  development dependencies `globals` and `@eslint/js` was installed.
- Bug fix and build compatibility improvements: updated TypeScript
  configuration to restore proper Node.js type resolution and modern JavaScript
  feature support. Replaced `node:`-prefixed imports (e.g., `node:crypto`) with
  standard module specifiers to ensure compatibility across multiple build
  targets (CJS, ESM, ES2015, ES2022) and simplify module resolution. Adjusted
  `tsconfig` settings, including enabling Node types and updating
  `target`/`lib`, resolving errors related to missing built-in methods and
  deprecated options. These changes stabilize the build pipeline and improve
  cross-environment portability.
- Runtime improvements and new features:
    - Added support for nested scopes, user-defined functions (FCNDEF), and
      call stack tracking. Implemented stack traces via EvaluatorError,
      improved assignment semantics, and introduced multiple return values
      (RETLIST).
    - A configurable forward reference mechanism was added, along with several
      internal improvements to evaluation flow and error handling.

## 1.9.1

- The function `Complex.atan2` was created.
- We have begun implementing the `eig` function. Several functions have been
  created in the `BLAS` and `LAPACK` classes, which have not yet been fully
  tested. Unused functions have been grouped into the `BLASunused.ts` and
  `LAPACKunused.ts` files. For now, the `eig` function only returns correct
  values for symmetric real matrices. The functions `det`, `mtimes`, `inv`, and
  `lu` were implemented based on the functions defined in `BLAS` and `LAPACK`.
- The `ldivFactory` function was created in the `ComplexInterface.ts` file to
  support left division operations. The wrapper function
  `MathOperation.mldivide` was created, which implements the `\` operator in
  the MATLAB/Octave language. This function uses the dispatcher
  `LAPACK.mldivide`.
- The `LAPACK.spec.ts` file was enhanced with approximately 170 tests of the
  `BLAS` and `LAPACK` functions, becoming the development basis for the
  functions and testing the contracts between them.
- The functions `cross`, `kron`, `dot` and `diag` have been implemented.
- The `ElementType` type and the `MultiArray` class were typed with the
  `ELEMENT` parameter.
- The `Evaluator` class has been modified in several ways:
    - The `EvaluatorInterface` was created, which the `Evaluator` class
      implements.
    - The `Evaluator.Unparse` function has been adjusted to work similarly to
      the `Evaluator.UnparseMathML` function, removing unnecessary parentheses.
      The `unparseFactory` function in the `ComplexInterface.ts` file has also
      been modified to work similarly to `unparseMathMLFactory`. The dynamic
      `unparse` method has been removed from classes that represent literals,
      such as `CharString`, `ComplexNumber`, `ComplexDecimal`,
      `FunctionHandle`, `MultiArray`, and `Structure`. In these classes, the
      dynamic `toString` method has been created, replacing the old `unparse`
      method.
    - Properties have been protected by making them private and accessible via
      setters and getters. These have been given the name of the property, and
      the property name has been prefixed with an underscore (`_`).
    - The `response` property has been made static.
    - The `undefinedReferenceTable` property has been created, and the
      `nameTable` table (now called `_nameTable`) has been modified to contain
      the undefined value in each entry when evaluating it before storing it in
      the table.
    - The `Execute` method was created, which simply executes the `Parse` and
      `Evaluate` methods on an input string, returning the computed result.
    - Bug fix: During assignments, the `Evaluator` function executed the
      right-hand side of the assignment twice. This was corrected by
      eliminating unnecessary calls to the `Evaluator` function.
    - Bug fix: The parser failed with malformed matrices, with extra spaces
      between the sign and the number of the imaginary part when there was a
      real part, for example, the syntax `A = [2+ 3i 4-5i]` produced the error:
      "SyntaxError: no viable alternative at input '[2+ ' (1:7)". This was
      corrected in the `SPACE_OR_CONTINUATION` rule in the `MathJSLabLexer.g4`
      file.
- The dynamic method `unparse` from classes that represent literals, such as
  `CharString`, `ComplexNumber`, `ComplexDecimal`, `FunctionHandle`,
  `MultiArray`, and `Structure` has been removed. The `toString` method was
  created in its place for debugging purposes.
- The `build.config.json` file was modified to configure the bundle
  `"web.es2022"` as the development version. Therefore, the production build
  compiles all 6 bundles, and the development build compiles only the
  `"web.es2022"` version. The `webpack.config.ts` file was not modified. The
  production build takes approximately 55 to 65 seconds, and the development
  build takes approximately 10 seconds.
- Bug fix: Matrix multiplication was not throwing an error when the operands
  had incompatible dimensions. The `LinearAlgebra.mul` function had been
  removed, and `BLAS.gemm` was being used directly in `MathOperation.mtimes`.
  `LinearAlgebra.mul` was responsible for the dimension check, and even then it
  was still producing an error. It was restored, corrected, and recoded using
  `BLAS.gemm`.
- Dependencies updated.

## 1.9.0

- The `dot` and `cross` functions (`LinearAlgebra.dot`) have been implemented.
- The `Evaluator.throwErrorIfGreaterThanReturnList` and
  `Evaluator.reduceIfReturnList` methods have been moved to the `AST` class.
  The `reduceIfReturnList` method has been made static. The
  `CoreFUnctions.throwInvalidCallError` has been moved to the `AST` class too.
- The factory function `MultiArray.reduceFactory` was created to generate the
  functions that use `MultiArray.reduce` and are defined in the `CoreFunctions`
  class: `all`, `any`, `sum`, `prod`, `sumsq`, `max`, `min`, `mean`, `cumsum`,
  `cumprod`, `cummin`, and `cummax`. The function `var`
  (`CoreFunctions.variance`) was created using `MultiArray.reduce` directly,
  and the function `std` was created using `CoreFunctions.variance`.
- The properties `LinearAlgebra.blockThreshold` (= 1e5 by default) and
  `LinearAlgebra.blockSize` (= 64 by default) were created to configure the
  parameters of the block multiplication algorithm for matrices, which was
  implemented (`BLAS.gemm`). The auxiliary function `BLAS.gemm_kernel` was
  created, which multiplies two sub-blocks, accumulating them into a third. The
  function `LinearAlgebra.set` was created to configure these parameters. The
  `Configuration.ts` file was updated with these parameters to be configured by
  the user using the `configure` function.
- Bug fix: The `MultiArray.elementWiseOperation` static method has been fixed
  and optimized. The `MultiArray.computeStrides` method has been created.
- Bug fix: The `CoreFunctions.reshape` has been fixed. The function had a bug
  that produced incorrect results and threw an error when the second parameter
  was passed as an array.
- Bug fix: There was a condition test in the `LinearAlgebra.inv` that was
  flawed, producing incorrect results. The function has been enhanced to make
  use of `LinearAlgebra.luDecomposition`.
- Bug fix: functions that return multiple assignments had a limitation; they
  returned values based on the `selector` function of `NodeReturnList` nodes.
  This caused some functions to be executed repeatedly for each assignment. The
  `handler` field was created in `NodeReturnList`, and the logic for executing
  commands with multiple assignments is now evaluated using these two
  functions: `handler` executes the code that should be executed once, based on
  the length of the assignment list, and `selector` receives the result of
  `handler` and the index of the assignment list, returning the corresponding
  value.
- All static methods in `MultiArray` have been converted to arrow functions.
- All static methods in `CoreFunctions` have been converted to arrow functions.
- We began developing the QR factorization algorithm and then created the
  `BLAS` (`BLAS.ts` file) and `LAPACK` (`LAPACK.ts`) classes with several
  functions analogous to the original implementation of these libraries.
  Various modifications using these new definitions of static methods in these
  classes were made to the `LinearAlgebra` functions. The `README.md` file has
  been updated to provide information about the architecture adopted in the
  design.
- All dependencies have been updated.

## 1.8.2

- Bug fix: the `lib/src/` directory was not being published. The
  `"prebuild:package"` `package.json` script has been removed.

## 1.8.1

- Modifications in `.prettierignore` file.
- The package `turndown` has been installed as development dependency. It's
  used to convert antlr HTML license to Markdown format.
- The following modifications were made due to comply the package build to be
  checked by a CircleCI pipeline:
    - More streamlined script definitions in the `package.json` file (removing
      pre and post definitions where possible).
    - The `.circleci/config.yml` file was created to configure a CircleCI
      pipeline.
    - The `src/MathJSLabLexer.ts` and `src/MathJSLabParser.ts` entries of
      `.gitignore` file has been removed.
    - The `script/build-resources.ts` file has been renamed to
      `script/get-antlr.ts` and modifications have been made so the script
      accepts command line parameters (the output directory).
    - The `"files"` field was created in the `package.json` file to select only
      the files that should be saved to the npm registry.
    - The `npx sort-package-json` command was executed to sort the fields in
      the `package.json` file.
    - The CircleCI status badge has been included in the `README.md` file.
- Due to GitHub's rate limit issues, the organization repository's direct raw
  file download system was replaced with a system that clones the entire
  repository, then copies individual files to the current project and removes
  the cloned repositories directory. The files
  `script/helper/copy-repo-files.ts` and `copy.repo.config.json` were created
  and moved to the organization repository.
- The MathJSLab logo in the .md files has been modified to use logo image in
  the website (mathjslab-www repository).

## 1.8.0

- The second release of 2025 (`reia`) has been launch.
- Changes in `README.md` file (grammatical corrections in paragraph on line
  43).
- The `mathjslab.bib` file has been improved with the inclusion of repository
  and project page URLs.
- The complex type was restructured to support number types other than
  `Decimal`. The `ComplexNumber` class was created, analogous to the
  ComplexDecimal class. The complex type contract was created in the
  `src/ComplexInterface.ts` file, defining the complex type generically. We
  adopted the Facade architecture: The `src/Complex.ts` file was created with
  the corresponding class. The static methods in the `ComplexDecimal` class
  were converted to arrow functions. This is the facade design: the static
  methods and properties are in the `Complex` class, which uses the methods and
  properties of `ComplexDecimal` or `ComplexNumber`. The type is defined by
  `ComplexType` in the `Complex.ts` file. Most of the methods and properties in
  `ComplexDecimal` and `ComplexNumber` are defined through factory functions
  defined in the `ComplexInterface.ts` file. Some extensions to the `Decimal`
  object and the native `Math` object have been created for use by factories.
  Local methods have been removed from `Evaluator` with the class directly
  referencing the base class's methods and properties. Modifications were made
  to the `Evaluator` class so that after changing the engine (`ComplexDecimal`
  or `ComplexNumber`) with the `configure` function, when executing the `clear`
  command, the `Evaluator` properties are reloaded with the appropriate values
  for the selected engine. Thus, modifying some of the configuration parameters
  with `configure` (the `'real'` parameter in this case) must be followed by
  the `clear` command.
- In all object classes and in the `Complex` facade, the `isInstanceOf` method
  was defined, returning `true` if the argument is an instance of the class. In
  the `Complex` class, the `isInstanceOf` method returns `true` if the argument
  is `ComplexNumber` or `ComplexDecimal`. Thus, the operator type tests in the
  methods of the `MathOperation` abstract class were changed to use the
  classes' `isInstanceOf` methods. To generate an array of strings with the
  keys of the `Complex` facade class, the build script `script/build-key.ts`
  and the helper `script/helper/buildInterfaceKeyTable.ts` were created. The
  build script generates the file `src/ComplexInterfaceStaticKeyTable.ts`. The
  helper `script/helper/buildInterfaceKeyTable.ts` was transferred to the
  organization's repository and can be downloaded from the organization's
  repository (https://github.com/MathJSLab).
- The `AST.ts` file has been enhanced to meet ESM module standards. Functions
  that create Abstract Syntax Tree nodes have been grouped into the `AST`
  class, and type definitions are exported with `export type`. The `omitOut`
  property of `NodeBase` has been renamed to `OmitOutput`. The `omitAns`
  property defined on some nodes has been renamed to `omitAnswer` and defined
  on `NodeBase`. The node types that, by definition, should not write the `ans`
  variable have been specified in the `omitAnswerTable` array.
- All static methods in the abstract class `MathOperation` have been converted
  to arrow functions and the class typing has been improved.
- The `src/lib-node.ts` and `src/lib-node.es2015.ts` files were created to
  selectively include packages in the Node.js environment (only
  `import 'node:crypto'` for now, to support the `decimal.js` package - used in
  the `Decimal.random` method according to the configuration options). The
  `webpack.config.ts` file was improved, with more granular build configuration
  in the `build.config.json` file (to resolve errors related to the output
  generated by the Webpack bundle analyzer). The `BuildConfigSet` and
  `BuildConfig` types were defined in the `webpack.config.ts` file.
- The `madge` package has been installed as development dependency to test
  circular imports. The `"test:circular"` script has been created in the
  `package.json` file.
- All static methods in the `CharString` and `FunctionHandle` classes have been
  converted to arrow functions.
- The `eslint.config.cjs` configuration file has been improved, grouping
  definitions in a more streamlined manner. The package's TypeScript source
  code definitions now comply with modern ESM definitions.
- A setting for formatting `.md` files has been added to the `.prettierrc`
  file.
- The `shx` package was installed as a development dependency. The `rimraf`
  package has been removed from development dependencies. The scripts in the
  `package.json` file have been changed to use `shx rm -rf` instead of
  `rimraf`.

## 1.7.3

- The following dependencies has been removed: `@types/debug`,
  `@types/supertest` and `source-map-support`. The
  `@types/eslint-config-prettier` package has been installed as development
  dependency.
- The following scripts in the `package.json`file has been renamed:
    - `"download-resources"` to `"download"`.
    - `"clean:download-resources"` to `"clean:download"`.
- All dependencies have been updated.
- The MathJSLab logo have been updated.
- Added `mathjslab.bib` file with bibtex entry to cite the software properly.
- The generation of es2020 targets has been changed to generate es2022 targets.
- The `string.at` method in the `src/MathJSLabParser.g4` (line 134) has been
- changed to indexing due to target incompatibility (es2015).

## 1.7.2

- The `"type": "module"` field has been added to the `package.json` file and
  the `"main"`, `"module"`, `"exports"` and `"browser"` fields in the
  `package.json` file have been changed to follow modern standards and avoid
  unwanted fallback to the UMD bundle.
- All dependencies have been updated.

## 1.7.1

- More rational definitions in `webpack.config.ts`.
- The `cross-env` package has been instaled as development dependency and some
  scripts in the `package.json` file has been made platform-independent.
- All references to `global` have been changed to `globalThis`.
- Dependencies updated.
- The `ajv` package was installed as a development dependency. It was needed
  after the last dependency update. An error was occurring during the Webpack
  build, which was resolved after installing `ajv`. The reason for this error
  may be related to running Webpack using `tsx`.
- The `fence` and `stretchy` properties has been set to `true` on all `<mo>`
  elements referring to delimiters in MathML unparse functions.
- The definition of namespace in `ComplexDecimal.ts` file has been removed.
- The inline exports of types and objects in multiple files have been moved to
  the end of the files. This way they comply with the modern way of defining
  modules. It's a new code convention (decribed in `CONTRIBUTING.md` file).
- A more detailed description of the demo web application's features has been
  included in the documentation (`README.md` file).
- A badge pointing to the [OpenAIRE](https://explore.openaire.eu/) search for
  MathJSLab has been added to the `README.md` file.
- An operator precedence table has been added to the `Evaluator` class and the
  `unparserMathML` method has been modified to not represent unnecessary
  parentheses in the result. The `Evaluator.nodePrecedence` method was also
  created, which, by consulting the precedence table, returns the precedence of
  the AST node.
- The file `MathML.ts` was created containing some types and an abstract class
  with a static property (`format`) that defines functions to help unparse in
  MathML language. The comments in this file contain relevant MathML language
  references that were used to code this module.

## 1.7.0

- All dependencies have been updated.
- The `README.md` file has been updated with trademark notice.

## 1.7.0-b1

- The reason for publishing this beta version is to test access via CDNs before
  publishing the final version, so that we can describe the use of CDNs in the
  `README.md` file.
- All dependencies have been updated.
- 'globalThis' has been configured as a global object to make the package work
  in any JavaScript environment, as per
  [#2](https://github.com/MathJSLab/mathjslab/issues/2) and
  [#3](https://github.com/MathJSLab/mathjslab/pull/3). Now the project Webpack
  configuration generates 6 different bundles:

1. web.umd2015
2. node.cjs2015
3. web.umd2020
4. node.cjs2020
5. web.esm2020
6. node.esm2020

Additionally, type generation is now done by `tsc` in an initial build step,
separate from the build of bundles. The bundles targeting "ES2015" imports
'globalthis/polyfill' (imported by file 'src/lib.es2015.ts') for compatibility
('globalthis' package added as regular dependency). The fields "main", "module"
and "exports" of `package.json` file has been set to support different targets.
The `license-webpack-plugin` is used to generate the license of each bundle
accurately. The generation of .d.ts files is now done in a separate step by
tsc, before the Webpack build. Some `tsconfig` files were created, extending
the `tsconfig.build.json` file, for building the various bundles and type
definitions.

- The `build.config.json` file was created, which is imported by
  `webpack.config.json` to customize some Webpack build configurations.
- The `test` directory was created, with bundle integration tests, in addition
  to other tests. The Jest configuration (`jest.config.js`) has been updated:
  there are 7 test projects, one is a unitary test and the others are resulting
  bundles tests. Scripts to run tests has been created in `package.json` file.
  The tests have not yet been fully implemented. In fact, the test coverage is
  small, and what has been done is only the structure of the tests, the
  creation of the `.spec.*` files, the configuration of Jest, etc.
- The `script/build-resources.ts` has been updated to download the ANTLR
  license. It's not available at `node_modules`, then the
  `license-webpack-plugin` can't insert license text in the outputh directory
  `./lib/`. The ANTLR license is downloaded from GitHub repository and inserted
  as licenseTextOverrides plugin parameter.
- The `git-commit.cjs` script was created to commit with the user's message. If
  no message is entered, after the timeout (5s) a default message with the date
  is used. The file was also created in the
  [MathJSLab organization repository](https://github.com/MathJSLab) to be
  available on other projects as well.

## 1.6.2

- All dependencies have been updated.
- The MathJSLab logo has been modified. It is built on the MathJSLab
  organization repository, and the 'mathjslab' package downloads the
  logo-related files (and other common files too) from the organization
  repository using the `download-files.cjs` script, which also provides a means
  to clean up the downloaded files. The download of these files is triggered by
  the script in the `package.json` file called "download-resources".
- The ESLint configuration file (`eslint.config.js`) has been revised.
- An example on CodePen was added (on README.md).

## 1.6.1

- All dependencies have been updated.
- Optimizations in the file 'mathjslab-logo.svg'
- Changes in the 'webpack.config.ts': `path.resolve` changed to `path.join`
  when possible. More rational path specifications. JavaScript files selection
  removed from regular expression test (`configuration.module.rules[0].test`
  and `configuration.module.rules[0].exclude`). JavaScript files selection
  removed from regular expressions in the file 'jest.config.js' too.
- The demo Web application of MathJSLab package has been renamed to
  'mathjslab-demo', with its repository also being renamed. All references to
  its name and repository have been updated.
- Added information to the 'README.md' file stating that the MathJSLab package
  documentation is in three languages, in the demo web application repository.

## 1.6.0

- Change repository owner to MathJSLab GitHub organization:
  https://github.com/MathJSLab . Changes in repository references in
  'package.json' file and documentation.

## 1.5.13

- Changes in 'README.md' file (CDN instructions and links, badges, build
  instructions, ISBN link, etc.).
- Changes to build scripts ('script' directory): some console messages issued
  using `console.warn` and `console.error` instead of `console.log`.
- The structure of the build files in the 'package.json' file has been modified
  (cleanup scripts).

## 1.5.12

- Some changes in 'README.md' file (links to mathjslab.com).
- Exclude eslint and jest config from build ('tsconfig.build.json' file).
- Improvements to the 'webpack.config.ts' file to setup
  `configuration.mode = argv.mode`. Webpack configuration was hardcoded as a
  factory.
- The 'eslint.config.js' file has been changed to include more granular rules
  for the 'script' directory and configuration files.

## 1.5.11

- Domain setup (mathjslab.com). Set as "homepage" in 'package.json' file. Some
  changes in 'README.md' file.

## 1.5.10

- The 'node-html-parser', 'tsconfig-paths' and 'tsx' packages have been
  installed as development dependencies. The 'ts-node' package was kept because
  of the 'webpack.config.ts' file. Webpack uses 'ts-node' when the
  configuration file is coded in TypeScript. All dependencies have been
  updated.
- The 'jest.config.js' file has been created and the jest configurations in the
  'package.json' file have been moved to it.
- The "keywords" field in 'package.json' file was modified.
- The 'script' directory with build scripts has been created. It contains the
  'helper' directory with useful functions for the build scripts.
- The 'eslint.config.js' file has been changed to include more flexible rules
  for the 'script' directory.
- The 'clean-package-lock.cjs' script has been created. It removes the
  'package-lock.json' file and the 'node_modules' directory.
- The 'build-resources.ts' script has been created. It downloads the latest
  version of ANTLR into the resources directory for use by the project.
- The identifier property of the base classes (the first property of the class
  of type `public static readonly`, followed by the class name in uppercase)
  was set in each file by the literal numeric value in the files
  'FunctionHandle.ts', 'CharString.ts' and 'Structure.ts'. This was necessary
  to fix errors occurring in jest tests.

## 1.5.9

- Prettier settings in 'eslint.config.js'.
- File '.npmrc' created. Configuration legacy-peer-deps set to true.
- Target modified to es2015.
- Badge 'GitHub Created At' added to 'README.md'.

## 1.5.8

- Badge changes in 'README.md' file. Using badges from https://shields.io/ .
- Dependecies update.
- Bug fix in functions 'asin', 'acsc', 'asec' and 'acot'.
- Configurations in '.eslintrc.js' (removed) modified to flat config in
  'eslint.config.js'.

## 1.5.7

- MathJSLab logo in README.md file.
- User function 'isstruc'.

## 1.5.6

- Optimizations in `CoreFunctions.throwInvalidCallError` (`test`parameter) and
  all `CoreFunctions` methods that use it.
- More strong type definitions in 'CoreFunctions.ts' file.
- User functions 'isscalar', 'ismatrix', 'isvector', 'iscell', 'isrow' and
  'iscolumn'.

## 1.5.5

- Sizes and Zenodo badges in 'README.md'.
- User function 'squeeze'.

## 1.5.4

- Bug fix in `MultiArray.evaluate` (array of cells be evaluated in the same way
  as common array now solved).

## 1.5.3

- Bug fix in `MultiArray.evaluate` (evaluating null array throws error now
  solved).

## 1.5.2

- Bug fix in `MultiArray.evaluate`. Before the method was page-oriented. Now is
  full dimensional using recursion and concatenation.
- Exports `ElementType` from 'MultiArray.ts' in 'lib.ts'.
- User functions 'repmat', 'colon', 'linspace', 'logspace', 'meshgrid' and
  'ndgrid'.
- Optimizations in `MultiArray.reshape`.

## 1.5.1

- Bug fix in `Evaluator` ('IDX' node processing).

## 1.5.0

- The file 'FunctionHandle.ts' and its corresponding test file has been
  created. The `FunctionHandle` type has been created and made a member of
  `AST.NodeExpr` through `ElementType`. `Evaluator.nameTable` entries has been
  modified to `AST.NodeExpr`. Changes in `Evaluator.Evaluator`, removing
  function definition, and altering processing of node types 'IDENT' and 'IDX'
  to use function handles. Now the function definitions and use is the same
  like in MATLAB&reg;/Octave.

## 1.4.2

- Bug fix in indexing by colon (:).
- Bug fix in functions 'ones' and 'zeros' (`CoreFunctions.newFilled`).

## 1.4.1

- More strong type definitions in 'AST.ts' and 'MathJSLabParser.g4' files.
- Number input as binary, octal and hexadecimal implemented in REAL_NUMBER rule
  of lexer.
- Optimizations in 'ComplexDecimal.ts' (use of isZero() method).
- Bug fix in `Evaluator` (indexing with 'end' and literal indexing).
- `clear` word list command defined inside body of `Evaluator` class.
- 'constantsTable.ts' file and `Evaluator.readonlyNameTable` has been removed.
  Improvements in clear command.
- 'Structure.ts' file with `Structure` class definition and its respective test
  file has been created. Some indirect reference implemented in lexer, parser
  and evaluator.
- Bug fix in expansion with indexing from scalar.
- Bug fix in test files (references to `Evaluator.initialize` modified to
  `new Evaluator`).
- Bug fix in functions 'rand' and 'randi' (`CoreFunctions.newFilledEach`).
- Optimizations in `Evaluator.validateAssignment` (remove `left` field in
  return value).
- Create `ComplexDecimal.random` using `Decimal.random` so configuration
  'crypt' takes effect.
- Optimizations in `ComplexDecimal.set`.
- Changes in `Evaluator.baseFunctionTable` and function calling:
    - mapper field is now not optional.
    - `Evaluator.localTable` variable creation using
      `globalThis.crypto.randomUUID`.
    - Function parameters selectively evaluated if ev.length > 0.

## 1.4.0

- Bug fix in parser (pre-increment and element-by-element operations).
- Rules to functions definition and handlers in parser and AST implemented.
  Evaluation not yet implemented.
- The string 'arguments' to define arguments block in functions is defined as
  keyword in lexer.
- 'Parser.ts' file removed and Parser implemented as a method of `Evaluator`.
  The method `Evaluator.initialize` has been removed and initialization actions
  moved to `Evaluator` constructor. Now the `Evaluator` class can be
  instantiated more than one time.

## 1.3.4

- More strong type definitions in 'MultiArray.ts', 'Evaluator.ts' and
  'MathOperation.ts' files.
- Global variable EvaluatorPointer removed. Evaluator instance reference passed
  in method parameters.

## 1.3.3

- File 'MathObject.ts' and (their respective class and test file) renamed to
  MathOperation.ts.
- CharString conversion to MultiArray implemented as previous to any operation
  in MathOperation.ts.

## 1.3.2

- Tests for types implemented as `instanceof` in 'MathObject.ts' and
  'Evaluator.ts'. Method 'isThis' removed from classes.
- Some bug fix in evaluator (not operation).

## 1.3.1

- Improvements and some bug fixes in lexer and parser. Support for cell arrays
  in parser and MultiArray class. Error messages in existing functions and cell
  array functions no yet implemented.
- Start and stop positions (line and column) of statements in global scope
  stored in AST nodes.
- Some improvements in CharString class, removing 'removeQuotes' method an
  creating 'quote' property to store type of quote (single or double).

## 1.3.0

- Parser implemented using ANTLR in files 'MathJSLabLexer.g4' and
  'MathJSLabParser.g4'. The wrapper class for lexer and parser has been created
  in file Parser.ts. Need to make extensive tests.
- File names converted to camel case.
- The file AST.ts (Abstract Syntax Tree) has been created, and related types
  and interfaces defined in Evaluator.ts has been moved to AST.ts file.

## 1.2.5

- Optimizations (resulting return as number) in multi-array.ts file and code
  cleaning by hand in file 'parser.jison'.

## 1.2.4

- The file 'symbol-table.ts' and 'symbol-table.spec.ts' has been created.
- Changes in the lexer to support comment blocks spaces and line breaks to
  separate elements within arrays. Context variables created (previous_token
  and matrix_context).

## 1.2.3

- The file 'configuration.ts' and 'configuration.spec.ts' has been created. Two
  user functions (configure and getconfig) was created to manage internal
  configurations of MathJSLab. Most of the settings refer to Decimal.js
  settings related to the accuracy of the results.
- Namespaces wrapping external definitions in 'evaluator.ts' and
  'complex-decimal.ts' files.

## 1.2.2

- Bug fix in function 'cat'.
- User functions 'cummin', 'cummax', 'cumsum', 'cumprod', 'ndims', 'rows',
  'columns', 'length', 'numel', 'isempty' and 'reshape'.
- Bug fix in MultiArray.unparse and MultiArray.unparseMathML (null array).
- Bug fix in MultiArray constructor (dimension.length >= 2).
- Bug fix in MultiArray.isEmpty.
- Functions newFilled and newFilledEach in MultiArray class moved to
  CoreFunctions and optimized.
- Some methods related to multiple assignment in Evaluator modified to static
  functions.

## 1.2.1

- More methods and properties have been renamed to express their functions more
  clearly.
- Code cleaning by hand.
- Bug fix in MultiArray.newFilledEach (used in rand and randi functions).

## 1.2.0

- The MultiArray class now supports multidimensional arrays. More integration
  tests are needed. Several methods have been renamed to express their
  functions more clearly. Methods related to linear algebra in MultiArray class
  have been moved to the LinearAlgebra class in linear-algebra.ts file.
- The core-functions.ts file and its corresponding test file were created.
  Functions in MultiArray class have been moved to the CoreFunctions class in
  core-functions.ts file. The generalized methods have been left in MultiArray
  class and the user functions have been moved to the CoreFunctions class. The
  linearizedFunctions in MultiArray class have been removed (and corresponding
  methods and code in Evaluator class removed too).

## 1.1.27

- The linear-algebra.ts file and its corresponding test file were created. The
  relevant methods of the MultiArray class will be moved to this file as
  support for multidimensional arrays evolves in the MultiArray class. Some
  methods moved.
- More evolve to support multidimensional arrays in the MultiArray class.
  MultiArray constructor upgraded to support multidimensional arrays.
  Constructor overloaded.
- The class `Tensor` has been renamed to `MathObject` and the file 'tensor.ts'
  has been renamed to 'math-object.ts'. The file 'math-object.spec.ts' has been
  created.
- The corresponding test file for char-string.ts file has been created.
- Unary and binary operations name type defined in complex-decimal.ts for use
  in generic operations methods of the MultiArray class.

## 1.1.26

- A fix for a major bug in element wise operations. Assymetric operations
  produce incorrect results. This shouldn't even be called a bug. This was like
  finding a lizard in your bathroom, coming up the drain. The fix has been
  simple, but the lizard is old, it certainly comes from the first version. It
  is necessary to extend the tests.
- `horzcat` and `vertcat` functions defined as function mappings.
- Start to extend MultiArray class to support multidimensional arrays.

## 1.1.25

- More bug fix in indexing (some `end` in ranges stop to work after 1.1.23. The
  problem is parent link absent in some constructions).

## 1.1.24

- Fix logical indexing (with operation and literal).

## 1.1.23

- Logical indexing.

## 1.1.22

- Fix `end` in ranges. The `colon_item` parser rule has been removed and the
  `end` descriptor in ranges has been created in the `primary_expr` rule.
- Fix range expansion. Before it could only be increasing, now it can also be
  decreasing.
- Reference to contribute to MathJSLab Demo in CONTRIBUTING.md file.

## 1.1.21

- Fix evaluator: 'LIST' `parent` setting.
- Fix evaluator: assignment at right side.
- Fix evaluator: some parents did not propagate to all terminal nodes.
- Comment about the ISBN in the CONTRIBUTING.md file.

## 1.1.20

- Changes in build scripts in package.json.
- Colon (:) when indexing.
- Discard output (~ at left side).

## 1.1.19

- Fix parser parenthesis node.

## 1.1.18

- `end` in ranges implemented in parser rule `colon_item`. To do this it was
  necessary to track the context creating the `parent` property in each node,
  set during `Evaluator`, and also the `index` property in the 'LIST' and 'IDX'
  type nodes. This can be useful in `Unparse` and `UnparseMathML`, to eliminate
  unnecessary parenthesis.

## 1.1.17

- Project launch.
- Multiple assignment implemented using `NodeReturnList` type. Method
  `reduceIfReturnList` created in class `Evaluator`.
