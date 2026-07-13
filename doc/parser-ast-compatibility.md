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
  dynamic field, function-call, anonymous-function, and function-handle forms;
- command syntax through word-list command nodes, including continuation lines
  and comments after ellipsis;
- user function definitions with return lists, parameter lists, ignored `~`
  entries, nested statements, and `arguments` blocks;
- empty and non-empty `arguments` blocks, including input/output attributes and
  AST validation declarations;
- control-flow blocks including `if`, `switch`, loops, `try`, and
  `unwind_protect`;
- `classdef` syntax for class attributes, superclass lists, `properties`,
  `methods`, `events`, and `enumeration` sections;
- class section attributes, including negated attributes such as `~Dependent`
  and `!Hidden`;
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
  validator functions, and default expression as distinct child nodes;
- `NodeClassDef.sections` contains `NodeClassSection` entries with
  `attributeTable` indexes for duplicate-preserving attribute lookup;
- method prototypes inside class `methods` sections are represented as
  `NodeFunctionDefinition` nodes with `attributes.prototype === true`;
- AST factory methods are responsible for parent pointers on child nodes.

## Compatibility Tests

The release-facing parser/AST compatibility fixtures are concentrated in:

- `src/ParserCompatibility.spec.ts` for parse, unparse, and execution fixtures;
- `src/ParserAstCompatibility.spec.ts` for structural AST contracts;
- `src/AST.spec.ts` for AST factory behavior and parent-pointer invariants.

When changing the grammar, regenerate the ANTLR output and run at least:

```sh
npm run build:parser
npm run build:types
npm run test:unit -- --runTestsByPath src/AST.spec.ts src/ParserCompatibility.spec.ts src/ParserAstCompatibility.spec.ts
```

For release preparation, also run the class and function infrastructure suites,
because class parsing and function parsing share several AST contracts:

```sh
npm run test:class
npm run test:function-infrastructure
npm run test:unit
```

## Known Boundaries

The parser and AST are intentionally ahead of some runtime features. These
forms may parse structurally before the interpreter has full MATLAB/Octave
semantics for every case:

- external file lookup for functions and classes is represented by public APIs,
  but browser-first execution means external filesystem access is deferred;
- class method prototypes preserve syntax and metadata, but method dispatch
  semantics should continue to be implemented through the class runtime layer;
- class attributes are parsed and indexed, but only attributes already consumed
  by the runtime have semantic enforcement;
- Octave-specific grammar branches should continue to be imported in focused
  increments, with parser fixtures added before or alongside interpreter
  behavior.
