# Packaged application and Markdown contracts

Run `npm run build:types`, `npm run build`, then `npm run test:consumers`. This
packs and installs the current distribution in a temporary consumer, runs Node
and native Chromium Worker checks, then exercises the sibling app's generated
examples and the Markdown browser adapter against that installation. No
publication or edits to sibling checkouts are required.

The optional consumer gate expects `../mathjslab-app` and
`../mathjslab-markdown`, including the app's generated `dist/example` files.
Set `MATHJSLAB_CONSUMER_ROOT` to their common parent for another layout.
`npm run test:release` remains independently runnable without sibling
checkouts. Both gates require built bundles and a Chromium executable; set
`MATHJSLAB_BROWSER_EXECUTABLE` when it is not found in the standard locations.

The core calculates values and emits serializable outputs. Hosts own resources,
DOM, plot rendering, resize and disposal. The app's synchronous
active-interpreter adapter must be installed only while its owning session
advances. Core and runtime imports must resolve to one core identity per realm.
Consumers may compile their adapters locally; every core/runtime/Worker import
in this gate comes from the installed tarball.

## Status and output mapping

| Core runtime                                        | Markdown browser executor                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `success`                                           | `success`, state `good`                                                                               |
| `error`                                             | `error`, state `bad`; Error keeps the selected diagnostic code                                        |
| `cancelled`                                         | `cancelled`, state `bad`; cancellation diagnostic becomes Error                                       |
| `timeout` / `MATHJSLAB_TIMEOUT`                     | Throws `TimeoutError` with `MATHJSLAB_TIMEOUT`; timeout is not part of Markdown's result-status union |
| Paired text/MathML/data value representations       | Keeps MathML, omits redundant text/data                                                               |
| Independent text effects, including load completion | Retains text entries in order                                                                         |
| Plotly visualization descriptor                     | Materializes a host-owned node with mount/resize/dispose hooks                                        |
| Parse diagnostic                                    | Returns no statements and an Error preserving the diagnostic code                                     |

Busy/disposed calls can reject instead of producing a result. Hosts await reset
before issuing more work and dispose document sessions when documents leave.
Remote abort/reset/disposal terminates the Worker; subsequent execution
recreates a clean workspace. Local cancellation retains completed workspace
effects.

## Loading and assignment semantics

`load` still obtains text through the host and executes it as a script, rather
than implementing MATLAB MAT-file loading. Execution remains in the caller's
workspace and retained machine, including inside functions. Script-local
imports, functions and source identity restore on success, error and
cancellation. Completion text is emitted after that script finishes; nested
loads finish from the inside out. Source resolvers remain synchronous and
host-prefetched.

Native multiple-output destinations use the existing assignment writer. Target
preparation retains the synchronous order, including cell/structure expansion
before RHS evaluation where applicable. Direct numeric indices are evaluated at
their original write point. Earlier writes remain if a later destination fails;
pending writes are skipped. No transactional assignment or replay is
introduced.

The consumer gate checks integration contracts and selected examples, not the
entire app UI or all educational documents. Broader dialect parity is
unverified; see [current capabilities](capabilities.md) for explicitly bounded
support.

## Retained validation checks

The installed-package cycle also executes input/output validators, computed
bounds, repeating aliases, name-value defaults and stored-scalar property
writes in Node and browser Workers and both consumer adapters. The Node gate
cancels a suspended validator and verifies Worker recovery. Local regressions
additionally protect bounded unwind cleanup, output masks, typed diagnostics
and failure before a pending write. Class accessor/event/array dispatch remains
separately bounded.

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
