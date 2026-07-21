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
