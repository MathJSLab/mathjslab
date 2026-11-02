# Testing Strategy

MathJSLab tests should protect both mathematical behavior and interpreter
contracts.

## Commands and artifacts

The scripts in `package.json` define the checks; there is no `test` script.
After installing dependencies and preparing ANTLR, generate source artifacts
and declarations with `npm run build:parser:key:types`.

| Command                                        | Scope                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run check:types`                          | General source, configuration and tooling types, including declarations |
| `npm run test:circ:unit:integration`           | Circular dependencies, unit suites and source integration checks        |
| `npm run test:parser:fixtures`                 | Parser conformance fixtures                                             |
| `npm run test:compatibility`                   | Language and AST compatibility                                          |
| `npm run test:function` / `npm run test:class` | Focused function/class suites                                           |
| `npm run test:mfile`                           | Manifest-driven `.m` fixtures                                           |
| `npm run test:package:source`                  | Package contracts exercised from source                                 |
| `npm run docs`                                 | Generated Markdown API reference                                        |
| `npm run build`                                | Production distributions                                                |
| `npm run test:bundle`                          | Built Node and web package artifacts                                    |

`ExecutionMachine.spec.ts`, `InProcessRuntime.spec.ts` and
`RemoteRuntime.spec.ts` protect retained evaluation order, host effects,
cleanup, session isolation, cancellation and recovery. Distribution checks
include real Node Workers and shared core identity. Shared endpoint tests do
not replace verification in a real browser Module Worker.

For a documentation-only change, check formatting, local links and documented
examples/commands against current exports and scripts. Run relevant behavioral
suites when examples depend on runtime behavior; avoid rebuilding all bundles
unless the distribution contract changes.

## Organization

`ResumableValidation.spec.ts` adds retained validation order, grouping, scope,
failure and cancellation checks, also exercised by the installed Worker cycle.

The current cycle adds `HermitianEigen.spec.ts` and
`RetainedAssignmentsAndLoad.spec.ts` for mathematical invariants and retained
workspace/assignment behavior. `npm run test:release` also runs those workflows
through an installed tarball and real Node/browser Workers. Use
`npm run test:consumers` for the optional sibling application/Markdown gate;
see [consumer contracts](consumer-contracts.md) for prerequisites and mappings.

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

## Dynamic execution milestone

Dynamic eval/evalin/evalc, native for binding and ordered SPMD count
expressions now share retained execution with synchronous evaluation.
Cancellation bypasses eval catch code and restores active frames; completed
mutations remain. ResumableDynamic.spec.ts protects the core contract. The
dynamic-cycle fixture runs against the installed package in Node/browser
Workers and both consumer adapters through npm run test:consumers. Class
callback/array dispatch remains the next migration; SPMD still executes
sequentially. See [current capabilities](capabilities.md) for the supported
subset.

## Retained class callback contract

Property/accessor and descriptor traversals now request retained calls, with
explicit output selection and class access installed only while advancing.
Notification guards clear on failure/cancellation; completed handle mutations
remain. Concatenation uses requests from the shared array evaluator.
ResumableClasses.spec.ts and classes-cycle.m cover source and installed
Node/browser/app/Markdown execution. See
[current capabilities](capabilities.md) for supported paths and remaining
callback audits.

## Coercion and native callback audit

ResumableProtocols.spec.ts and protocols-cycle.m extend the retained contract
to conditions, subsindex, native class overloads, descriptor method calls,
broadcast/compound operators, nthargout and spfun. Original dispatch, helper
output masks, index validation and native copy/write order remain observable.
The installed consumer gate runs these cases in Node/browser Workers and both
adapters; see [current capabilities](capabilities.md) for boundaries.
