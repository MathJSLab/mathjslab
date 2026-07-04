# Testing Strategy

MathJSLab tests should protect both mathematical behavior and interpreter
contracts.

## Organization

Each `.spec.ts` file should have a single top-level `describe` for the file and
nested `describe` blocks for related behavior. `src/LAPACK.spec.ts` is the
informal reference for this organization.

Prefer focused tests with explicit setup over large tests that validate several
unrelated contracts at once. Large numerical workflows are still useful, but
small contract tests make failures easier to diagnose.

## Assertion Helpers

Helpers that perform Jest assertions should use names beginning with `expect`.
The ESLint configuration recognizes `expect*` helpers as assertion functions,
so tests can call helper assertions without disabling `jest/expect-expect`.

Helpers that create fixtures should use names such as `make`, `create`, or
`build`. Helpers that execute a scenario but do not assert should not be used
as the only statement in an `it` block.

## Skipped Tests

Skipped tests should be rare and temporary. A skipped test must explain:

- the exact contract that cannot currently be asserted;
- whether the failure is a product bug, fixture problem, or unsupported
  feature;
- what active test already covers the nearest valid behavior.

If a skipped test uses an invalid fixture, prefer replacing it with an active
test that uses a conformant fixture.

## Contract Coverage

Public APIs should have tests for:

- successful representative calls;
- invalid arity;
- invalid shape or dimension;
- invalid type or class;
- non-mutation or intentional mutation;
- scalar, vector, matrix, and multidimensional behavior where relevant;
- compatibility behavior that differs from plain JavaScript expectations.
