# MathJSLab documentation

These guides describe the implementation in this repository. Start with the
[package README](../README.md) for features, installation and public API
examples. Language compatibility and resumable execution are separate
contracts: parsing or evaluating a construct synchronously does not imply it
can suspend.

## Language and embedding

- [Parser and AST compatibility](parser-ast-compatibility.md): supported
  syntax, strict expression boundaries and TypeScript migration.
- [Contextual parser boundaries](parser-contextual-boundaries.md): commands,
  apostrophes, literal whitespace and block grammar.
- [Function signatures](function-signature.md): registration, arity, defaults,
  validation and argument blocks.
- [Dispatch precedence](dispatch-precedence.md): symbol lookup and call
  dispatch.
- [Numeric array model](numeric-array-model.md): numeric backends, logical
  column-major semantics, indexing and storage.
- [Numeric sequence compatibility](numeric-sequence-compatibility.md): discrete
  differences, forward/reverse accumulation and explicit MATLAB/Octave choices.
- [Plotting](plotting.md): capturing visualization descriptions and host
  rendering.

## Execution and lifecycle

- [Resumable execution](resumable-execution.md): current support inventory,
  continuations, host waits, evaluation order and synchronous boundaries.
- [Asynchronous runtime lifecycle](async-runtime-lifecycle.md): session
  isolation, cancellation, Worker recovery, parallel loops and verification
  matrix.
- [Interpreter flow](interpreter-flow.md): parsing, AST normalization,
  evaluation and function dispatch.

## Maintenance and API

- [Architecture overview](architecture-overview.md): subsystem responsibilities
  and shared core distribution.
- [Architecture boundary audit](architecture-boundary-audit.md): typed
  boundaries and remaining migration work.
- [Testing strategy](testing-strategy.md): commands, suite organization and
  compatibility assertions.
- [API documentation](api-documentation.md): reference generation and scope.
- [Generated API reference](api-reference.md): exported declarations and JSDoc.
- [Householder reflectors](householder-reflectors.md): numerical implementation
  notes.
- [Release notes](../CHANGES.md) and [contributing](../CONTRIBUTING.md).

The generated API reference is a declaration/JSDoc inventory; consult source
and TypeScript declarations for complete method signatures. Regenerate it with
`npm run docs`. The npm package currently ships the README and release notes,
but not this `doc` directory; use the repository for these guides.

The separate [demo application](https://github.com/MathJSLab/mathjslab-app)
maintains multilingual command help and application-specific documentation.

- [Architecture review before publication](architecture-review.md).
