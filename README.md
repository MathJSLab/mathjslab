<p align="center">
    <a href="https://mathjslab.com/" target="_blank" rel="noopener"><img src="mathjslab-logo.svg" alt="logo" width="210" height="210" /></a>
</p>

# [MathJSLab](https://mathjslab.com/) - [mathjslab.com](https://mathjslab.com/)

[![NPM Version](https://img.shields.io/npm/v/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fmathjslab.com%2F)](https://mathjslab.com/)
[![GitHub Created At](https://img.shields.io/github/created-at/MathJSLab/mathjslab)](https://github.com/MathJSLab/mathjslab)
[![MIT License](https://img.shields.io/npm/l/mathjslab)](https://github.com/MathJSLab/mathjslab/blob/main/LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8396265.svg)](https://doi.org/10.5281/zenodo.8396265)
[![ISBN](https://img.shields.io/badge/ISBN-978--65--00--82338--7-green?style=flat&link=https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)
[![NPM Downloads](https://img.shields.io/npm/d18m/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hy/mathjslab)](https://www.jsdelivr.com/package/npm/mathjslab)
[![Libraries.io SourceRank](https://img.shields.io/librariesio/sourcerank/npm/mathjslab)](https://libraries.io/npm/mathjslab/sourcerank)
[![NPM Bundle Size](https://img.shields.io/bundlephobia/min/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![Minzip Size](https://img.shields.io/bundlephobia/minzip/mathjslab)](https://www.npmjs.com/package/mathjslab)
[![NPM package minimized gzipped size](https://img.shields.io/bundlejs/size/mathjslab)](https://www.npmjs.com/package/mathjslab)

> An [interpreter](https://en.wikipedia.org/wiki/Interpreter_(computing)) with language syntax like [MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/) written in [TypeScript](https://www.typescriptlang.org/).

**[ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7)**

This package emulates a parser and evaluator for a subset of
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/)
language. It is written completely in [TypeScript](https://www.typescriptlang.org/).

The project page with a functional demo use of this package in a
[Web application](https://en.wikipedia.org/wiki/Web_application) can be found
at [mathjslab.com](https://mathjslab.com/). The repository is in the
[MathJSLab Organization](https://github.com/MathJSLab) on
[GitHub](https://github.com/).

**Important Notice:** This software, the **[MathJSLab](https://mathjslab.com/),
is not affiliated, sponsored, or endorsed by [The MathWorks, Inc.](https://www.mathworks.com/)**
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html) is a registered
trademark of [The MathWorks, Inc.](https://www.mathworks.com/) For more
information about [MATLAB](https://www.mathworks.com/products/matlab.html), visit
[www.mathworks.com](https://www.mathworks.com/).

It can run in browser environment and implements an arbitrary precision
arithmetics using [decimal.js](https://www.npmjs.com/package/decimal.js)
package.

It uses the [ANTLR](https://www.antlr.org/)
[parser generator](https://en.wikipedia.org/wiki/Compiler-compiler) to
generate a [parser](https://en.wikipedia.org/wiki/Parsing) that create an
[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
([Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)) of input.

Other components besides the [parser](https://en.wikipedia.org/wiki/Parsing)
are the evaluator, which computes the inputs, and the [MathML](https://www.w3.org/Math/)
unparser, that generates mathematical representations of the inputs and results.

This software is intended for **educational purposes**, to provide teachers and
students with a computer aided calculation tool that is capable of running in
a browser environment. So it can be easily adapted to be used on different devices
and environments.

All [MathJSLab](https://mathjslab.com/)
[interpreter](https://en.wikipedia.org/wiki/Interpreter_(computing))
operations, functions and commands are documented in the
[demo Web application's](https://github.com/MathJSLab/mathjslab-app) command
`help NAME`. Its in
[english](https://github.com/MathJSLab/mathjslab-app/tree/main/help/en),
[portuguese](https://github.com/MathJSLab/mathjslab-app/tree/main/help/pt)
and [spanish](https://github.com/MathJSLab/mathjslab-app/tree/main/help/es).
It can also be accessed directly from the
[demo Web application repository](https://github.com/MathJSLab/mathjslab-app/tree/main/help).
Additional documentation, beyond the operations, functions and commands, is
available in the
[demo Web application `doc` directory](https://github.com/MathJSLab/mathjslab-app/tree/main/doc).

## Features

- Runs on any [JavaScript](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/) engine.
- Improved demo [Web application](https://en.wikipedia.org/wiki/Web_application) at project page: [mathjslab.com](https://mathjslab.com/) ([repository](https://github.com/MathJSLab/mathjslab-app)).
- Comes with a large set of built-in operations, functions and commands well documented in the demo [Web application](https://en.wikipedia.org/wiki/Web_application) in [english](https://github.com/MathJSLab/mathjslab-app/tree/main/help/en), [portuguese](https://github.com/MathJSLab/mathjslab-app/tree/main/help/pt) and [spanish](https://github.com/MathJSLab/mathjslab-app/tree/main/help/es).
- Includes test suite using [Jest](https://jestjs.io/) [framework](https://en.wikipedia.org/wiki/Software_framework) (most tests not yet implemented).
- Is easily extensible through configuration parameters passed to [`Evaluator` constructor](https://github.com/MathJSLab/mathjslab/blob/main/src/Evaluator.ts).
- [Open source](https://opensource.org/) software with fully documented code: [MIT License](https://github.com/MathJSLab/mathjslab/blob/main/LICENSE).
- Software with assigned [ISBN](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7) and [DOI](https://doi.org/10.5281/zenodo.8396265), so that it can be used in academic work and research, being referenced appropriately. Any inclusion of authors will result in an update of the [ISBN](https://grp.isbn-international.org/) records.

## Supported environments

[MathJSLab](https://mathjslab.com/) works on any [ES2015](https://262.ecma-international.org/6.0/) compatible
[JavaScript](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/)
engine, including [Node.js](https://nodejs.org/),
[Chrome](https://www.google.com/chrome/),
[Firefox](https://www.mozilla.org/en-US/firefox/),
[Safari](https://www.apple.com/safari/),
[Opera](https://www.opera.com),
and [Edge](https://www.microsoft.com/edge).

There are 6 different bundles:
- For [Node.js](https://nodejs.org/) environment, [CommonJS](https://nodejs.org/docs/latest/api/modules.html), [ES2015](https://262.ecma-international.org/6.0/) target ([mathjslab.node.cjs2015.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.cjs2015.js)).
- For [Node.js](https://nodejs.org/) environment, [CommonJS](https://nodejs.org/docs/latest/api/modules.html), [ES2020](https://262.ecma-international.org/11.0/) target ([mathjslab.node.cjs2020.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.cjs2020.js)).
- For [Node.js](https://nodejs.org/) environment, [ES Module](https://nodejs.org/api/esm.html), [ES2020](https://262.ecma-international.org/11.0/) target ([mathjslab.node.esm2020.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.node.esm2020.js)).
- For browser environment, [UMD](https://github.com/umdjs/umd), [ES2015](https://262.ecma-international.org/6.0/) target ([mathjslab.web.umd2015.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.umd2015.js)).
- For browser environment, [UMD](https://github.com/umdjs/umd), [ES2020](https://262.ecma-international.org/11.0/) target ([mathjslab.web.umd2020.js](https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.umd2020.js)).
- For browser environment, [ES Module](https://nodejs.org/api/esm.html), [ES2020](https://262.ecma-international.org/11.0/) target ([mathjslab.web.esm2020.js]((https://cdn.jsdelivr.net/npm/mathjslab/lib/mathjslab.web.esm2020.js))).


## Installation

Install the `mathjslab` package:

```bash
npm install mathjslab
```

## Usage

The basic [API](https://en.wikipedia.org/wiki/API) is an instantiation of `Evaluator` class with optional configuration.

Import **[MathJSLab](https://mathjslab.com/) [API](https://en.wikipedia.org/wiki/API)**:

```typescript
import { Evaluator, TEvaluatorConfig } from 'mathjslab';
```

Instantiate the `Evaluator` class with:

```typescript
let evaluator: Evaluator = new Evaluator(EvaluatorConfiguration);
```

### Examples

* **Parsing**:
```typescript
let input: AST.NodeInput = evaluator.Parse('x=sqrt(1+2*3)');
```

* **Evaluation**:
```typescript
let result: AST.NodeInput = evaluator.Evaluate(input);
```

* **[MathML](https://www.w3.org/Math/) generation**:
```typescript
let mathmlInput: string = evaluator.UnparseMathML(input);
let mathmlResult: string = evaluator.UnparseMathML(result);
```

You can try [some basic examples](https://codepen.io/collection/BaNkVd) on [CodePen](https://codepen.io/).

## Using a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network)

You can optimize your application by reducing the size of your bundle by
loading [MathJSLab package](https://www.npmjs.com/package/mathjslab) through a
[CDN](https://en.wikipedia.org/wiki/Content_delivery_network).

You can use [UNPKG](https://unpkg.com/), [jsDelivr](https://www.jsdelivr.com/),
or any other [CDN](https://en.wikipedia.org/wiki/Content_delivery_network)
that delivers content from the [npm registry](https://www.npmjs.com/).

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

The [UMD module](https://github.com/umdjs/umd) will be loaded with `mathjslab` name. You can instantiate `Evaluator` with:

```typescript
let evaluator = new mathjslab.Evaluator(EvaluatorConfiguration);
```

## Contributing

To contribute to this project see our
[contributing guidelines](https://github.com/MathJSLab/mathjslab/blob/main/CONTRIBUTING.md).

Join the community chat:

[![Join the chat at https://matrix.to/#/#mathjslab:gitter.im](https://badges.gitter.im/Join%20Chat.svg)](https://matrix.to/#/#mathjslab:gitter.im?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Project build and test

To build the project, you only need [Node.js](https://nodejs.org/) and
the [Java Runtime Environment](https://www.oracle.com/java/) installed. The
project build and dependencies are managed by
[npm](https://www.npmjs.com/package/npm) through scripts in the
[`package.json`](https://github.com/MathJSLab/mathjslab/blob/main/package.json)
file. The build scripts download the latest version of
[ANTLR](https://www.antlr.org/) into the resources directory for use by the
project. The test suite uses the [Jest](https://jestjs.io/)
[framework](https://en.wikipedia.org/wiki/Software_framework).

### Build scripts

The following build scripts are defined:

1. **Before building and testing** `mathjslab`, to **initialize** the project workspace, run:
```bash
npm run update
```
This will update the dependencies, install all of them, and download the
latest version of [ANTLR](https://www.antlr.org/), preparing any resources
needed to build the project.

2. Run the `mathjslab` **tests**:
```bash
npm run test
```

3. **Format** and **lint** `mathjslab` code:
```bash
npm run format:lint
```

4. **Build** `mathjslab` package:
```bash
npm run build
```

5. To **cleanup** all build files in workspace use:
```bash
npm run clean
```

6. To **delete resources and dependencies**, the `package-lock.json` file and
`node_modules` directory too, use:
```bash
npm run clean:all
```
After run this command you will need to do workspace setup running
`npm run update` again.

## Language subset

Currently only the mathematical expressions of the language are implemented. The control and loop structures are not yet implemented.

There are some differences from the original
[MATLAB&reg;](https://www.mathworks.com/products/matlab.html)/[Octave](https://www.gnu.org/software/octave/).
The main difference is that there are only one a complex numeric type. Other
implemented types is boolean, character string, structure and function handle.

Common arrays (not only cell arrays) can hold any type of element.

## Trademark Notes

- [MATLAB&reg;](https://www.mathworks.com/products/matlab.html) is a registered trademark of [The MathWorks, Inc.](https://www.mathworks.com/)
- [MathJSLab](https://mathjslab.com/) is not affiliated, sponsored, or endorsed by [The MathWorks, Inc.](https://www.mathworks.com/)

## License

>[MIT License](https://opensource.org/license/mit)
>
>Copyright &copy; 2016-2025 [Sergio Lindau](mailto:sergiolindau@gmail.com), [mathjslab.com](https://mathjslab.com/), [ISBN 978-65-00-82338-7](https://grp.isbn-international.org/search/piid_solr?keys=978-65-00-82338-7).
>
>Permission is hereby granted, free of charge, to any person obtaining a copy
>of this software and associated documentation files (the "Software"), to deal
>in the Software without restriction, including without limitation the rights
>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
>copies of the Software, and to permit persons to whom the Software is
>furnished to do so, subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in all
>copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
>SOFTWARE.
