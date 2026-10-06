# Parser contextual boundaries

This document records the parser decisions that depend on lexical or enclosing
context rather than on a token in isolation. It is the audit checklist for
changes to `MathJSLabLexer.g4` and `MathJSLabParser.g4`.

## Audited block families

| Family                 | Contextual boundary                                                                                                                                                                                                                                                                                  | Structural/runtime evidence                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| command form           | Only registered word-list commands enter command mode; assignment-sensitive names remain identifiers before assignment operators. Top-level comma, semicolon, and newline terminate the word list. Quotes and continuations preserve raw words.                                                      | `ParserCompatibility.spec.ts` and `ParserConformance.spec.ts` cover blocks, separators, comments, continuations, assignment-like text, quoted and operator arguments, parse/unparse, and execution. |
| apostrophe and strings | An apostrophe after an expression terminal is conjugate transpose; otherwise it starts a single-quoted character string. Postfix transpose/increment tokens are expression terminals so postfix chains remain intact. Matrix whitespace can deliberately reset the decision to a new element/string. | Direct string/end-range transpose and consecutive `A''`, `A.''`, `A'.'` chains are asserted structurally and through execution.                                                                     |
| matrix/cell whitespace | Whitespace separates elements except before a spaced binary operator. For `+` and `-`, whitespace after the sign distinguishes binary expressions (`[1 - 1]`) from signed elements (`[1 -1]`). Continuations and comments retain the same decision.                                                  | Parser conformance fixtures cover numeric, complex, cell, indexing, operator, continuation, and comment combinations.                                                                               |
| `classdef` sections    | Section keywords and attributes are contextual inside `classdef`; property validation declarations and method prototypes have dedicated AST shapes.                                                                                                                                                  | Parser AST compatibility and conformance fixtures cover properties, methods, events, enumerations, attributes, validators, accessors, inheritance, and runtime construction/dispatch.               |
| `arguments` blocks     | Input/output/repeating/name-value blocks are valid only in supported function/method positions and preserve defaults, dimensions, classes, validators, and Octave terminators.                                                                                                                       | Parser compatibility plus `FunctionArguments` and parser conformance suites cover structural rejection and runtime binding.                                                                         |
| `try` / `catch`        | A catch identifier is recognized only as the simple first identifier after `catch`; indexed or dotted expressions remain body statements.                                                                                                                                                            | Compatibility fixtures assert the ambiguous forms; conformance fixtures assert error state and execution.                                                                                           |
| `unwind_protect`       | Protected and cleanup lists remain distinct blocks, and cleanup runs across error, return, and loop control.                                                                                                                                                                                         | Conformance fixtures assert parse/unparse and cleanup execution paths.                                                                                                                              |
| `parfor` and `spmd`    | Parenthesized worker specifications are expressions with structural restrictions; browser/local execution currently uses the documented sequential fallback.                                                                                                                                         | Typed control-flow AST tests, parser AST compatibility, Interpreter tests, and conformance fixtures cover headers, restrictions, metadata, and execution.                                           |

## Apostrophe decision table

`HERMITIAN` is selected when the preceding emitted token completes an
expression:

- identifiers, numeric literals, or strings;
- closing `)`, `]`, or `}` tokens;
- the indexing `end` marker;
- postfix `++` or `--`;
- transpose `.'` or conjugate transpose `'`.

In every other context the lexer enters single-quoted-string mode. Inside a
matrix or cell literal, an emitted `WSPACE` element separator therefore makes
`[A 'text']` two elements, while an adjacent `A'` remains transpose.

The postfix entries are intentionally centralized in
`MathJSLabLexer.hermitianLeftOperandTypes`. Before this audit, the second
apostrophe of `A''` and `A.''` was silently consumed as an unterminated empty
string. The parser consequently lost an operator without reporting a syntax
error. The explicit set prevents the lexer rule and the postfix grammar from
drifting apart.

## Matrix whitespace decision table

| Input shape after an element                         | Decision                                              |
| ---------------------------------------------------- | ----------------------------------------------------- |
| whitespace then `+`/`-`, followed by whitespace      | keep whitespace inside the binary expression          |
| whitespace then adjacent signed operand (`+2`, `-x`) | emit an element separator                             |
| whitespace before another binary operator            | keep whitespace inside the expression                 |
| whitespace before an ordinary primary expression     | emit an element separator                             |
| ellipsis/comment continuation                        | apply the same decision on the continued logical line |

Parentheses and cell-indexing braces suspend matrix-element whitespace while
their inner expression is parsed. Literal cell braces create a new matrix
context; indexing braces do not.

## Change discipline

1. Change contextual behavior in the `.g4` source, never only in generated
   TypeScript.
2. Add a minimal ambiguity fixture showing both sides of the decision.
3. Assert AST shape/parent/source range when the boundary changes structure.
4. Assert parse/unparse and execution when runtime meaning can differ.
5. Regenerate the lexer/parser and run parser fixtures, compatibility, m-file,
   unit, type, and circular-dependency checks.

The synchronous Interpreter retains sequential `parfor`/`spmd` execution. The
asynchronous runtime can parallelize the statically proven `parfor` subset when
a suitable adapter is available; unsupported bodies retain the sequential
fallback. These execution choices and the incomplete MATLAB/Octave surface are
deliberate compatibility boundaries, not reasons to weaken parser structure.
