# Numeric session configuration and backend lifetime

Select the backend before the session creates literals, native constants,
closures or class instances:

```ts
const runtime = createNodeMathJSLabRuntime(); // or the browser/in-process factory
const session = await runtime.createSession({
    numeric: {
        engine: "decimal",
        complex: { precision: 40, precisionCompare: 7 },
    },
});
const other = await runtime.createSession({ numeric: { engine: "number" } });
```

`SessionOptions.numeric` uses the exported `NumericEnvironmentOptions` type.
`engine` is `number` or `decimal`; `complex` is a serializable partial complex
configuration. Explicit engine selection starts with that backend's defaults,
then applies `complex`. With no numeric options, existing default behavior is
preserved. Runtime `sessionDefaults.numeric` supplies defaults; a session's
numeric object replaces that default object rather than merging
representations.

Number arithmetic remains fixed at its actual settings (precision 15); decimal
precision settings do not increase it. Settings are validated even when ignored
by number arithmetic. Decimal `precisionCompare` must be nonnegative and
smaller than `precision`; for very low precision supply both explicitly.
Invalid setup rejects session creation and restores the host configuration.

The parser's numeric factory now looks up the active backend on every call.
Creating/interleaving a number session cannot pin another session's parser to
number values. Sessions own isolated numeric snapshots, initialized before
their Interpreter is constructed. Interleaved sessions retain independent
settings and workspaces.

## Existing session behavior

- `configure('real','number')` and `configure('real','decimal')` switch the
  active session while preserving workspace, closures, classes, global and
  persistent variables, RNG state and aliases. Owned numeric graphs are
  converted in place; retained execution temporaries are adopted by the Complex
  facade when used. Switching inside functions, loops and configuration lists
  follows the same path.
- Conversion to `number` has native floating-point precision and range limits;
  switching back cannot recover discarded digits. Other sessions and the host
  environment are unaffected. Changing backend uses its default settings.
- Selecting the same backend is a no-op and preserves precision.
- `configure()` restores decimal and the default configuration, preserving
  workspace through the same conversion path.
- Precision and other supported arithmetic settings remain adjustable within
  the selected backend. Invalid multi-key `Complex.set` calls are validated
  before updating shared settings. Arithmetic defaults are no longer aliases of
  mutable settings.
- `reset()` clears the workspace and restores the session's initial numeric
  configuration, even after caller-owned option objects have been changed.
- Local cooperative cancellation preserves completed effects. Remote Worker
  termination can lose the workspace; recreated Workers retain the session's
  creation options. Disposal remains independent between sessions.

The direct host `Configuration.configure()` API still offers host-level default
configuration. Changing `Complex.engine` directly is a host setup operation;
create a fresh Interpreter after changing representations. Live Interpreter
graphs must not be migrated through direct global facade changes. Invalid host
engine names leave the selected engine untouched.

## Worker deployment and diagnostics

Numeric options travel in the existing protocol's optional create fields.
Workers acknowledge their handling with `numericConfigured`. A caller
requesting numeric options rejects a Worker missing this acknowledgement with
`MATHJSLAB_NUMERIC_CONFIGURATION_UNSUPPORTED`; it does not silently fall back
to decimal. Default sessions keep the prior create message/response shape.
Deploy core/runtime/Worker bundles from one distribution together and refresh
cached Workers. Session numeric options contain data, not host callbacks.

Tests cover local and loopback drivers, installed native Node Workers and real
browser Workers, plus interleaved app evaluation hooks. Source tests protect
invalid settings, reset, host restoration, native constants, closures, classes,
RNG state and a stale Worker acknowledgement. Consumer tests also protect the
workspace retention across backend switches and recovery after failures.
