<p align="center">
    <a href="https://mathjslab.com/" target="_blank" rel="noopener"><img src="https://mathjslab.com/images/mathjslab-logo.svg" alt="logo" width="210" height="210" /></a>
</p>

# [MathJSLab](https://mathjslab.com/) - [mathjslab.com](https://mathjslab.com/)

[![NPM Version](https://img.shields.io/npm/v/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![NPM Last Update](https://img.shields.io/npm/last-update/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fmathjslab.com%2F)](https://mathjslab.com/)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/MathJSLab/mathjslab/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/MathJSLab/mathjslab/tree/main)
[![GitHub Created At](https://img.shields.io/github/created-at/MathJSLab/mathjslab)](https://github.com/MathJSLab/mathjslab)
[![MIT License](https://img.shields.io/npm/l/mathjslab)](https://github.com/MathJSLab/mathjslab/blob/main/LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.8396265-blue?style=flat&link=https://doi.org/10.5281/zenodo.8396265)](https://doi.org/10.5281/zenodo.8396265)
[![ISBN](https://img.shields.io/badge/ISBN-978--65--00--82338--7-green?style=flat&link=https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)
[![OpenAIRE](https://img.shields.io/badge/OpenAIRE-blue?style=flat&link=https://explore.openaire.eu/search/advanced/research-outcomes?f0=q&fv0=MathJSLab)](https://explore.openaire.eu/search/advanced/research-outcomes?f0=q&fv0=MathJSLab)
[![NPM Downloads](https://img.shields.io/npm/d18m/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![NPM Downloads per week](https://img.shields.io/npm/dw/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hy/mathjslab)](https://www.jsdelivr.com/package/npm/mathjslab)
[![Libraries.io SourceRank](https://img.shields.io/librariesio/sourcerank/npm/mathjslab)](https://libraries.io/npm/mathjslab/sourcerank)
[![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![NPM package minimized gzipped size](https://img.shields.io/bundlejs/size/mathjslab)](https://www.npmjs.com/package/mathjslab)

> An [interpreter](<https://en.wikipedia.org/wiki/Interpreter_(computing)>)
> with language syntax like
> [MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/)
> written in [TypeScript](https://www.typescriptlang.org/).

**[ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)**

This package implements an interpreter for a subset of
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/)
language. It is written completely in
[TypeScript](https://www.typescriptlang.org/).

The project page with a functional demo use of this package in a
[Web application](https://en.wikipedia.org/wiki/Web_application) can be found
at [mathjslab.com](https://mathjslab.com/). The repository is in the
[MathJSLab Organization](https://github.com/MathJSLab) on
[GitHub](https://github.com/).

**Important Notice:** This software, the **[MathJSLab](https://mathjslab.com/),
is not affiliated, sponsored, or endorsed by
[The MathWorks, Inc.](https://www.mathworks.com/)**
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html) is a registered
trademark of [The MathWorks, Inc.](https://www.mathworks.com/) For more
information about [MATLAB](https://www.mathworks.com/products/matlab.html),
visit [www.mathworks.com](https://www.mathworks.com/).

The [MathJSLab](https://mathjslab.com/) runs in browsers and Node.js and
implements arbitrary precision arithmetic using the
[decimal.js](https://www.npmjs.com/package/decimal.js) package in addition to
the native `number` type.

It uses the [ANTLR](https://www.antlr.org/)
[parser generator](https://en.wikipedia.org/wiki/Compiler-compiler) to generate
a [parser](https://en.wikipedia.org/wiki/Parsing) that creates an
[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
([Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)) of
input.

Other components besides the [parser](https://en.wikipedia.org/wiki/Parsing)
are the evaluator, which computes the inputs, and the
[MathML](https://www.w3.org/Math/) unparser, that generates mathematical
representations of the inputs and results.

The [MathJSLab engine](https://www.npmjs.com/package/mathjslab) includes
numerical routines based on [BLAS](https://www.netlib.org/blas/) (Basic Linear
Algebra Subprograms) and [LAPACK](https://www.netlib.org/lapack/) (Linear
Algebra PACKage).

This software is intended for **educational purposes**, to provide teachers and
students with a computer aided calculation tool that is capable of running in a
browser environment. So it can be easily adapted to be used on different
devices and environments.

[MathJSLab](https://mathjslab.com/)
[interpreter](<https://en.wikipedia.org/wiki/Interpreter_(computing)>)
operations, functions and commands have user-facing help in the
[demo Web application's](https://github.com/MathJSLab/mathjslab-app) command
`help NAME`. It's in
[english](https://github.com/MathJSLab/mathjslab-app/tree/main/help/en),
[portuguese](https://github.com/MathJSLab/mathjslab-app/tree/main/help/pt) and
[spanish](https://github.com/MathJSLab/mathjslab-app/tree/main/help/es). It can
also be accessed directly from the
[demo Web application repository](https://github.com/MathJSLab/mathjslab-app/tree/main/help).
Additional documentation, beyond the operations, functions and commands, is
available in the
[demo Web application `doc` directory](https://github.com/MathJSLab/mathjslab-app/tree/main/doc).
This repository also includes maintainer-focused documentation in the local
[`doc`](doc/) directory, including architecture notes, testing strategy, and a
generated Markdown API reference.

## Features

- **MATLAB/Octave-like parser and AST.** Expressions, matrix and cell literals,
  structures, command syntax, imports, comma-separated lists, control flow,
  functions, argument blocks and class declarations. Contextual parsing handles
  transpose versus strings, matrix whitespace and block boundaries. AST
  metadata preserves statement source ranges and semicolon output suppression;
  source and MathML unparsing support inspection and presentation.
- **Numeric and array operations.** Native-number and arbitrary-precision
  decimal complex backends, N-D arrays, column-major logical indexing
  semantics, broadcasting, growth and deletion, cells and structure arrays.
  Numerical routines include BLAS/LAPACK-based linear algebra, matrix division
  and page-wise division, discrete `diff` and forward/reverse
  `cumsum`/`cumprod`, plus `sum`/`prod` with explicit NaN handling, dimension
  vectors and global `"all"` reductions, and `mean`/`var`/`std` with explicit
  NaN handling and global/vector-dimension grouping. See
  [numeric sequence compatibility](doc/numeric-sequence-compatibility.md) and
  the [numeric array model](doc/numeric-array-model.md).
- **Functions and workspaces.** User, local and nested functions; named and
  anonymous handles; multiple and ignored outputs; local, global, persistent,
  caller and base workspaces. Declarative built-in signatures and `arguments`
  blocks support arity, defaults, name-value inputs, validation, repeating and
  output-repeating forms. Host-provided source APIs resolve `.m` scripts,
  functions, classes and external class methods.
- **Classes and dispatch.** Substantial `classdef` support, including
  inheritance, properties, methods, events, enumerations, metadata, listeners,
  accessors, SetGet mixins and common static/instance dispatch paths.
  Descriptor indexing through `substruct`, `subsref` and `subsasgn` supports
  chained native/object access. MATLAB/Octave library and toolbox coverage
  remains incomplete.
- **Synchronous and asynchronous execution.** `Interpreter` provides direct
  parsing/evaluation. In-process, browser Module Worker and Node
  `worker_threads` runtimes provide isolated asynchronous sessions with
  structured outputs, diagnostics, interruption, abort signals, timeouts, reset
  and disposal.
- **Suspension and resumption.** The shared execution machine retains supported
  control flow, ordinary/anonymous calls, arguments/defaults, expressions,
  native indexing/assignments and matrix/cell literal elements across host
  waits without replaying completed work. `pause` and `load` request explicit
  host capabilities; cooperative checkpoints allow cancellation. Continuations
  are single-use in-memory objects. Class callbacks, dynamic scripts and other
  synchronous boundaries remain documented in the
  [execution guide](doc/resumable-execution.md).
- **Parallel loop subset.** Remote runtimes distribute statically proven sliced
  assignments and associative reductions in `parfor` across Workers. `strict`,
  `fallback` and `off` policies control execution; synchronous execution and
  `spmd` retain sequential compatibility behavior.
- **Host-owned visualization.** Native `plot`, `plot3`, `surf`, `plot2d` and
  `histogram` prepare serializable visualization descriptions. Runtime outputs
  carry those descriptions; the host supplies the renderer and manages its
  resources. The core has no DOM or Plotly dependency.
- **Embedding and extension.** Public TypeScript contracts, interpreter
  configuration, function registration, source providers and runtime host
  adapters let applications supply their own integration. Runtime ESM bundles
  share the public core and its numeric/value identity.
- **Compatibility and regression coverage.** Jest suites cover numerical
  routines, parser/AST structure, functions, classes, `.m` fixtures, runtime
  lifecycle and package distributions. Circular source dependencies are a
  release gate.
- **Open educational software.** MIT licensed, with
  [ISBN](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)
  and [DOI](https://doi.org/10.5281/zenodo.8396265) for academic citation. A
  [demo application](https://mathjslab.com/) and multilingual help are
  maintained in the
  [application repository](https://github.com/MathJSLab/mathjslab-app).

See the [documentation index](doc/README.md) for language, runtime, integration
and maintainer guides.

## Supported environments

The synchronous core has bundles targeting
[ES2015](https://262.ecma-international.org/6.0/) compatible
[JavaScript](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/)
engines and ES2022 bundles for modern environments, including
[Node.js](https://nodejs.org/), [Chrome](https://www.google.com/chrome/),
[Firefox](https://www.mozilla.org/en-US/firefox/),
[Safari](https://www.apple.com/safari/), [Opera](https://www.opera.com), and
[Edge](https://www.microsoft.com/edge).

Choose a bundle matching your environment and JavaScript target. Asynchronous
runtime entry points target ES2022 and require host support for Promises,
AbortController and, for remote sessions, the relevant Worker API. The package
declares Node.js >=16 and npm >=8 for consumers; development tools can have
newer requirements.

There are six interpreter bundles, plus runtime and Worker entry points:

- For [Node.js](https://nodejs.org/) environment,
  [CommonJS](https://nodejs.org/docs/latest/api/modules.html),
  [ES2015](https://262.ecma-international.org/6.0/) target
  ([mathjslab.node.cjs2015.cjs](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.cjs2015.cjs)).
- For [Node.js](https://nodejs.org/) environment,
  [CommonJS](https://nodejs.org/docs/latest/api/modules.html),
  [ES2022](https://262.ecma-international.org/11.0/) target
  ([mathjslab.node.cjs2022.cjs](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.cjs2022.cjs)).
- For [Node.js](https://nodejs.org/) environment,
  [ES Module](https://nodejs.org/api/esm.html),
  [ES2022](https://262.ecma-international.org/11.0/) target
  ([mathjslab.node.esm2022.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.esm2022.js)).
- For browser environment, [UMD](https://github.com/umdjs/umd),
  [ES2015](https://262.ecma-international.org/6.0/) target
  ([mathjslab.web.umd2015.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.umd2015.js)).
- For browser environment, [UMD](https://github.com/umdjs/umd),
  [ES2022](https://262.ecma-international.org/11.0/) target
  ([mathjslab.web.umd2022.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.umd2022.js)).
- For browser environment, [ES Module](https://nodejs.org/api/esm.html),
  [ES2022](https://262.ecma-international.org/11.0/) target
  ([mathjslab.web.esm2022.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.esm2022.js)).

CommonJS consumers can use `require('mathjslab').Interpreter`; the historical
`require('mathjslab').mathjslab.Interpreter` namespace remains available. Node
entry points preserve native `globalThis.crypto` and install a fallback only
when it is missing.

### TypeScript AST migration in 2.7.0

AST expression fields and factory parameters now use `StrictNodeExpr` across
control flow, calls/indexing, and declarations/classes. Loop assignment targets
use `NodeAssignmentTarget`; lazy output selectors return strict expressions.
Consumers constructing ASTs or implementing callbacks should narrow their
values with the AST guards instead of casting statements or lists to
expressions.

`ExpressionBoundaryValue` deliberately permits `NodeList` at execution and
comma-separated-list boundaries, including indirect `eval`, `evalin`, `run`,
and `source` calls. It is not a replacement for strict expression fields.
`NodeExpr` and `LegacyNodeExprCarrier` remain in unmigrated families. See the
[AST compatibility guide](doc/parser-ast-compatibility.md) and
[architecture boundary audit](doc/architecture-boundary-audit.md).

## Installation

Install the `mathjslab` package:

```bash
npm install mathjslab
```

## Usage

Create an interpreter with the public factory. Configuration is optional; the
constructor is private.

```typescript
import { Interpreter, type InterpreterConfig } from "mathjslab";

const config: InterpreterConfig = {};
const interpreter = Interpreter.Create(config);
const input = interpreter.Parse("x=sqrt(1+2*3)");
const result = interpreter.Evaluate(input);
const source = interpreter.Unparse(result);
const mathmlInput = interpreter.UnparseMathML(input);
const mathmlResult = interpreter.UnparseMathML(result);
```

The workspace persists between evaluations of the same interpreter. `Evaluate`
is synchronous: a supported host wait requires the asynchronous runtime
described below and reports `MATHJSLAB_EFFECT_REQUIRES_ASYNC` here.

You can try [basic examples](https://codepen.io/collection/BaNkVd) on
[CodePen](https://codepen.io/).

## Using a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network)

You can optimize your application by reducing the size of your bundle by
loading [MathJSLab package](https://www.npmjs.com/package/mathjslab) through a
[CDN](https://en.wikipedia.org/wiki/Content_delivery_network).

You can use [UNPKG](https://unpkg.com/), [jsDelivr](https://www.jsdelivr.com/),
or any other [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) that
delivers content from the [npm registry](https://www.npmjs.com/).

### Using [UNPKG](https://unpkg.com/)

To load [MathJSLab package](https://www.npmjs.com/package/mathjslab) through
[UNPKG](https://unpkg.com/browse/mathjslab/)
[CDN](https://en.wikipedia.org/wiki/Content_delivery_network) copy the
following [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) code:

```html
<script src="https://www.unpkg.com/mathjslab"></script>
```

### Using [jsDelivr](https://www.jsdelivr.com/)

[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hy/mathjslab)](https://www.jsdelivr.com/package/npm/mathjslab)

To load [MathJSLab package](https://www.npmjs.com/package/mathjslab) through
[jsDelivr](https://www.jsdelivr.com/package/npm/mathjslab)
[CDN](https://en.wikipedia.org/wiki/Content_delivery_network) copy the
following [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) code:

```html
<script src="https://cdn.jsdelivr.net/npm/mathjslab"></script>
```

### [MathJSLab](https://www.npmjs.com/package/mathjslab) [module](https://github.com/umdjs/umd) use

The [UMD module](https://github.com/umdjs/umd) will be loaded with `mathjslab`
name. You can instantiate `Interpreter` with:

```typescript
const interpreter = mathjslab.Interpreter.Create();
```

## Contributing

To contribute to this project see our
[contributing guidelines](https://github.com/MathJSLab/mathjslab/blob/main/CONTRIBUTING.md).

Join the community chat:

[![Join the chat at https://matrix.to/#/#mathjslab:gitter.im](https://badges.gitter.im/Join%20Chat.svg)](https://matrix.to/#/#mathjslab:gitter.im?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Project build and test

Use Node.js, npm and Java for ANTLR parser generation. Development commands are
defined in [package.json](package.json).

```bash
npm ci
npm run get:antlr
npm run build:parser:key:types
npm run test:circ:unit:integration
npm run docs
npm run build
npm run test:bundle
```

Source checks precede bundle construction; distribution tests run against built
artifacts. There is no `npm run test` script. Focused suites and release checks
are described in the [testing guide](doc/testing-strategy.md).

`npm run format:lint` formats files and applies lint fixes. `npm run docs`
regenerates the Markdown API reference. `npm run install:all` also copies
shared organization resources and downloads ANTLR; `npm run update`
additionally updates dependency ranges, so it is a maintenance operation rather
than the normal locked-dependency setup.

`npm run clean` removes bundles, reports, generated parser/key files and the
generated API reference. `npm run clean:all` additionally removes downloaded
resources, the lockfile/dependencies via its helper and copied shared files.
Regenerate the required artifacts after cleaning.

## Runtime sessions and Workers

The synchronous `Interpreter` API remains available from `mathjslab`. Hosted
applications can instead create isolated asynchronous sessions through the
runtime entry points:

```js
import { createInProcessMathJSLabRuntime } from "mathjslab/runtime";
import { createBrowserMathJSLabRuntime } from "mathjslab/runtime/browser";
import { createNodeMathJSLabRuntime } from "mathjslab/runtime/node";
```

The browser runtime uses a Dedicated Module Worker, while the Node runtime uses
`worker_threads`. Both expose the same `createSession`, `parse`, `execute`,
`interrupt`, `reset`, and `dispose` contract. Execution accepts an
`AbortSignal` and a timeout:

```js
const runtime = createBrowserMathJSLabRuntime();
const session = await runtime.createSession({ parfor: "fallback" });
const result = await session.execute("A = magic(3)", { timeoutMs: 10_000 });
await session.dispose();
await runtime.dispose();
```

### Host waits and retained execution

A runtime needs an explicit host adapter for `pause` and `load`. For example,
this in-process host handles delay effects:

```js
const runtime = createInProcessMathJSLabRuntime({
    host: {
        async request(effect) {
            if (effect.type !== "delay") {
                throw new Error(`Unsupported host effect: ${effect.type}`);
            }
            await new Promise((resolve) =>
                setTimeout(resolve, effect.milliseconds),
            );
            return {};
        },
    },
});
const session = await runtime.createSession();
try {
    const result = await session.execute("x=1; pause(0.01); x+=1", {
        timeoutMs: 1_000,
    });
    console.log(result.status, result.outputs, result.diagnostics);
} finally {
    await runtime.dispose();
}
```

The delay suspends supported execution and resumes from retained state. The
runtime races host waits against cancellation even when an adapter ignores its
signal; this minimal timer adapter does not cancel its timer. A resource host
handles `read-text` by returning `{ value: sourceText }` for `load(reference)`.
Loaded code runs in the same workspace. Direct `pause`/`load` value operands
and `load` inside user functions remain unsupported.

Suspension is internal to `execute`; sessions expose interruption and reset,
while `CreateExecutionMachine` provides the lower-level continuation contract.
Continuations cannot be serialized or persisted. Supported calls, expressions,
indexing, assignments, literals, run/source scripts, indirect feval/builtin
targets, scalar methods/constructors (including explicit superclass calls) and
arithmetic overloads retain completed values. Class property/index/event
callbacks, class arrays, validation and some output/preparation paths remain
synchronous. Long numerical operations are indivisible. See
[resumable execution](doc/resumable-execution.md) for the exact supported
subset.

Worker boundaries carry only versioned, serializable runtime values and output
descriptors. Files, network access, persistence, clocks, and other external
effects must be supplied explicitly by a host adapter. A timed-out or
interrupted remote execution terminates its Worker; the next operation creates
a clean session rather than reusing potentially corrupted interpreter state.
Disposal also terminates an active Worker immediately and includes sessions
whose Worker creation is still pending. The complete cancellation, recovery,
and adapter-equivalence matrix is documented in
[`doc/async-runtime-lifecycle.md`](doc/async-runtime-lifecycle.md).

Remote sessions can execute the statically proven sliced-assignment and
associative-reduction subset of `parfor` on multiple Workers. The `strict`,
`fallback`, and `off` policies control whether ineligible loops fail or execute
sequentially. `spmd` currently retains its validated sequential compatibility
fallback with `spmdIndex == 1` and `spmdSize == 1`; true SPMD execution,
Composite values, worker-to-worker communication, and MATLAB-style Future APIs
are not part of this release.

## Language subset

The engine implements a practical subset of
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/)
syntax, including expressions, arrays, cell arrays, structures, control flow,
loops, Worker-backed `parfor` for eligible bodies and sequential fallbacks,
user functions, anonymous functions, function handles, `arguments` blocks
including repeating and output-repeating forms, imports, command syntax,
comma-separated lists, descriptor-based indexing with
`substruct`/`subsref`/`subsasgn`, browser-hosted `.m` sources, and substantial
`classdef` support, including class metadata, properties, methods, events,
enumerations, listeners, accessors, SetGet mixins, common static/instance
dispatch paths, and stricter AST/runtime expression boundary validation.
Parser/AST metadata preserves statement source ranges and semicolon output
suppression for diagnostics and round trips. Descriptor indexing covers chained
native and object paths with scalar broadcast, deletion, implicit path
creation, indexed `getfield`/`setfield`, empty structure-array schemas, and
comma-separated-list expansion. Runtime array helpers preserve MATLAB/Octave
column-major logical semantics over MathJSLab's page-stacked internal storage,
including N-D slicing, expansion, logical indexing, deletion, cells,
structures, matrix division, page-wise division, and non-finite numeric cases.

The main remaining limitations are general external filesystem access,
incomplete MATLAB/Octave library and toolbox coverage, and less common class
semantics that still need focused compatibility work. Browser-first
host-provided source APIs cover `.m` functions, scripts, classes, external
class method files, and virtual source-name introspection. Numeric values use
one complex numeric type; other implemented runtime types include logical
values, character strings, structures, function handles, and class objects.
Common arrays can hold any runtime value. The source tree is also kept free of
circular module dependencies as a release gate.

## Trademark Notes

- [MATLAB&reg;](https://www.mathworks.com/products/matlab.html) is a registered
  trademark of [The MathWorks, Inc.](https://www.mathworks.com/)
- [MathJSLab](https://mathjslab.com/) is not affiliated, sponsored, or endorsed
  by [The MathWorks, Inc.](https://www.mathworks.com/)

## License

> [MIT License](https://opensource.org/license/mit)
>
> Copyright &copy; 2016-2026 [Sergio Lindau](mailto:sergiolindau@gmail.com),
> [mathjslab.com](https://mathjslab.com/),
> [ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7).
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
