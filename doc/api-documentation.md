# API Documentation

MathJSLab keeps public API documentation close to the TypeScript source by
using JSDoc comments as the primary source of truth.

The generated API reference uses `src/lib.ts` and `src/lib-core.ts` as public
entry points. This keeps internal implementation modules out of the default API
surface unless they are explicitly exported by the package.

## Generating the Reference

Run:

```sh
npm run docs:api
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
