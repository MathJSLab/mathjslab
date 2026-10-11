# Plot preparation and host integration

The core registers plot, plot3, surf, plot2d and histogram per interpreter.
There is no dependency on DOM, Plotly or the Markdown package. A host captures
serializable descriptions during synchronous advancement:

```ts
const interpreter = Interpreter.Create();
const plots: PlotOutputRequest[] = [];
interpreter.withPlotOutput(
    (request) => plots.push(request),
    () => {
        interpreter.Evaluate(interpreter.Parse("a=2; plot([a,a+1])"));
    },
);
```

withPlotOutput restores the previous sink in finally, including nested
operations and errors. It surrounds synchronous work; it must not be used to
keep a sink installed across an asynchronous host wait. The standard
in-process, Node Worker and browser Worker runtimes capture these descriptions
as RuntimeOutput visualization entries while each machine step advances.

The compatibility wire format retains renderer `plotly` and a request with
`type`, `data`, `layout` and `config`. All prepared coordinates and styles are
plain data. A host may map the descriptions to another renderer. Loading a
renderer, creating DOM output, resize, purge and rich-output ownership belong
to the host. The application retains its lazy Plotly adapter.

plot accepts Y or X/Y datasets followed by line specifications or property
pairs; plot3 accepts X/Y/Z datasets. surf accepts Z, or X/Y/Z with surface
properties. Their existing vector/matrix/complex handling, argument order and
AST return carriers are retained. plot2d retains the expression and variable
ASTs, evaluates its two bounds, and samples one hundred points synchronously in
a temporary scope belonging to the current interpreter. Precision and the
CallFrame restore on success or failure. histogram accepts a numeric array and
an optional domain; its return AST now includes only supplied arguments.

The initial extraction retains the legacy permissive arity/return metadata;
argument preparation and diagnostics still belong to the existing builders. The
new metadata satisfies the registered-builtin introspection contract without
tightening acceptance or changing multi-output dispatch. Classes, user/provider
replacements, aliases and variables continue ordinary resolution.

No resumable frontier is broadened by sampling. Existing class/script,
validation, indirect-forwarding, indexed multi-output, load-in-function and
loop/SPMD preparation boundaries remain documented separately. Completed
effects are not rolled back. Runtime error/cancellation output policy remains
unchanged; captured descriptions do not promise partial rendering on failure.

The app's former PlotEngine table is a compatibility delegation. Production
registration uses the core's native table; no application-global interpreter is
needed by the core functions. The app installs its context only for its own
legacy external functions and materialization adapters.
