# API Documentation

MathJSLab keeps public API documentation close to the TypeScript source by
using JSDoc comments as the primary source of truth.

The generated API reference uses `src/lib.ts`, `src/lib-core.ts` and
`src/runtime-contracts.ts` as public entry points. The reference inventories
exported declarations and their leading JSDoc; it does not list every class
member or reproduce complete TypeScript signatures. Platform factories from
`runtime/browser` and `runtime/node`, and protocol-only exports, are outside
these generator entry points. Consult the [README](../README.md),
[lifecycle guide](async-runtime-lifecycle.md) and source entry points for those
APIs.

## Generating the Reference

Run:

```sh
npm run docs
```

The current generator writes Markdown to `doc/api-reference.md` and uses the
TypeScript compiler API, which is already part of the development toolchain.
This avoids adding an extra documentation dependency while still making missing
or vague JSDoc comments visible during review.

## Documentation Contract

Public classes, functions, interfaces, type aliases, exported constants, and
module-level helpers should describe:

- what the API does;
- the shape and meaning of each parameter;
- the return value;
- mutation behavior, especially for matrix and array operations;
- error conditions and MATLAB/Octave compatibility assumptions;
- whether the API is intended for package consumers or only for internal
  interpreter wiring.

Use `@internal` for declarations that must remain available to TypeScript but
should not be presented as public API documentation.
