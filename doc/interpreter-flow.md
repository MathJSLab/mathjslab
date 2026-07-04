# Interpreter Flow

The interpreter processes code in phases. Each phase has a different contract,
and keeping those contracts separate makes the system easier to change.

## Parse Phase

The ANTLR lexer and parser recognize MATLAB/Octave-like syntax. Generated
parser files should be treated as derived artifacts. Grammar changes should be
made in the `.g4` files and regenerated through the existing build scripts.

The parser is responsible for syntax recognition, not runtime behavior. It
should preserve enough structure for the AST layer to decide how declarations,
function definitions, command-form calls, and expression forms are represented.

## AST Normalization

AST helpers convert parse structures into stable node contracts used by
evaluation, unparsing, MathML output, and function metadata.

This layer is the right place to document assumptions such as:

- whether a node is an expression, statement, declaration, or function body;
- how omitted outputs, command-form arguments, and argument blocks are encoded;
- which child nodes may be absent;
- which errors are syntax errors rather than runtime errors.

## Evaluation

`Interpreter` evaluates normalized nodes inside the active scope and call
frame. Evaluation should preserve MATLAB/Octave workspace semantics:

- local variables belong to the current function or script frame;
- `global` variables are shared through the interpreter's global storage;
- `persistent` variables are scoped to a function definition;
- `evalin` and `assignin` explicitly cross workspace boundaries;
- nested functions and anonymous handles capture the lexical environment they
  need to run later.

Runtime errors should keep enough stack information to identify the user-level
function path that triggered the failure.

## Function Dispatch

Function calls are resolved through a layered lookup:

1. local and nested user-defined functions;
2. function handles and anonymous functions;
3. registered built-ins and class-like function groups;
4. unresolved references, which may become forward references or errors.

Declarative signatures should describe arity, optional arguments, repeated
groups, validators, output counts, and invalid-call messages. Implementation
code should rely on those signatures where possible instead of duplicating
ad-hoc validation.
