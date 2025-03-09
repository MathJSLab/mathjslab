# Contributing to MathJSLab

The following is a set of guidelines for contributing to the [MathJSLab](https://mathjslab.com/)
package. These are mostly guidelines, not rules. Use your best judgment and
feel free to propose changes to this document in a pull request.

I'm really glad you're reading this, because we need volunteer developers to
help this project come to fruition.

All notable changes to this project will be documented in
[CHANGES.md](https://github.com/MathJSLab/mathjslab/blob/main/CHANGES.md) file.

Please consider contributing to the [MathJSLab Demo](https://github.com/MathJSLab/mathjslab-app)
project, which is the standard use case of the [MathJSLab](https://github.com/MathJSLab/mathjslab).
See the [Work fronts](#work-fronts) section in the [CONTRIBUTING.md](https://github.com/MathJSLab/mathjslab/blob/main/CONTRIBUTING.md)
file for each project to see which project your contribution fits into.

This project has an ISBN assigned to it. Whenever significant changes are made
to the project, or new contributing authors are added, a new ISBN will be
assigned to the project. Therefore, the project must continue to be
**educational software**.

The project page is at [mathjslab.com](https://mathjslab.com/) with a demo Web Application.

#### Table Of Contents

* [Code of Conduct](#code-of-conduct)
* [How to Contribute](#how-to-contribute)
* [Community](#community)
* [Code conventions](#code-conventions)
* [Work fronts](#work-fronts)
* [References](#references)

## Code of Conduct

This project and everyone participating in it is governed by the
[MathJSLab Code of Conduct](https://github.com/MathJSLab/mathjslab/blob/main/CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report
unacceptable behavior to [sergiolindau@gmail.com](mailto:sergiolindau@gmail.com).

## How to Contribute

Check for similar previous [issues](https://github.com/MathJSLab/mathjslab/issues) before send your own.

Please send a [GitHub Pull Request to MathJSLab](https://github.com/MathJSLab/mathjslab/pull/new/main)
with a clear list of what you've done (read more about
[pull requests](http://help.github.com/pull-requests/)). Please follow our
coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

Always write a clear log message for your commits. One-line messages are fine
for small changes, but bigger changes should look like this:

    $ git commit -m "A brief summary of the commit
    >
    > A paragraph describing what changed and its impact."

The tests are run by [jest](https://jestjs.io/). Add relevant tests for the new code created.

## Community

Join the community chat:

[![Join the chat at https://matrix.to/#/#mathjslab:gitter.im](https://badges.gitter.im/Join%20Chat.svg)](https://matrix.to/#/#mathjslab:gitter.im?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Code Conventions

All code is linted with [Prettier](https://prettier.io/).

Start reading our code and you'll get the hang of it. In summary, we adopted:

* We indent using four spaces for code files and two spaces for json files, set by EditorConfig and Prettier.
* We use the following name convention: for constants, variables, functions and class methods we use camelCase with uncapitalized initial letter. For types, interfaces, and classes we use CamelCase with first letter capitalized.
* We ALWAYS put spaces after list items and method parameters (`[1, 2, 3]`, not `[1,2,3]`), around operators (`x += 1`, not `x+=1`), and around hash arrows.
* Don't use inline exports whenever as possible:
```typescript
// Use this:
class ClassName {

}
export {
    ClassName
};
export default ClassName;

// Instead of:
export default class ClassName {

}
```
* This is an [open source software](https://en.wikipedia.org/wiki/Open-source_software). Consider the people who will read your code, and make it look nice for them.

## Work fronts

The **MathJSLab** project started almost a decade ago, but it is still in its
infancy. There are several work fronts, some already open, others yet to
begin, none yet completed.

Some are listed below:

* Optimize the ComplexDecimal class so that methods avoid using other
functions in the class. To do this, it will be necessary to deduce the
definitions of each function in terms of the real and imaginary parts.
* All operations over array elements are complex. Create and use real
operations for arrays with only real elements.
* Integer types and bitwise operations and functions.
* String type and their respective functions.
* More extensive tests need to be written, especially to test the parser and
evaluator.

You are welcome to contribute to this project. I will be very grateful if you
participate in some way.

Thanks,
[Sergio Lindau](mailto:sergiolindau@gmail.com)

## References

Here are some references consulted to carry out this project.

* [Wolfram MathWorld](https://mathworld.wolfram.com/)
* [WolframAlpha](https://www.wolframalpha.com/)
* [Decimal.js Documentation](https://mikemcl.github.io/decimal.js/)
* [MATLAB&reg; Online](https://matlab.mathworks.com/)
* [MATLAB&reg; Documentation](https://www.mathworks.com/help/matlab/index.html)
    * [Get Started with MATLAB&reg;](https://www.mathworks.com/help/matlab/getting-started-with-matlab.html)
    * [Fundamental MATLAB Classes](https://www.mathworks.com/help/matlab/matlab_prog/fundamental-matlab-classes.html)
    * [Language Fundamentals](https://www.mathworks.com/help/matlab/language-fundamentals.html)
    * [Array Indexing](https://www.mathworks.com/help/matlab/math/array-indexing.html)
    * [Compatible Array Sizes for Basic Operations](https://www.mathworks.com/help/matlab/matlab_prog/compatible-array-sizes-for-basic-operations.html)
    * [Array vs. Matrix Operations](https://www.mathworks.com/help/matlab/matlab_prog/array-vs-matrix-operations.html)
    * [MATLAB Operators and Special Characters](https://www.mathworks.com/help/matlab/matlab_prog/matlab-operators-and-special-characters.html)
    * [Operator Precedence](https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html)
    * [Matrix Indexing in MATLAB&reg;](https://www.mathworks.com/company/newsletters/articles/matrix-indexing-in-matlab.html)
    * [Creating, Concatenating, and Expanding Matrices](https://www.mathworks.com/help/matlab/math/creating-and-concatenating-matrices.html)
    * [Multidimensional Arrays](https://www.mathworks.com/help/matlab/math/multidimensional-arrays.html)
    * [Cell Arrays](https://www.mathworks.com/help/matlab/cell-arrays.html)
    * [Access Data in Cell Array](https://www.mathworks.com/help/matlab/matlab_prog/access-data-in-a-cell-array.html)
    * [cell](https://www.mathworks.com/help/matlab/ref/cell.html)
    * [cell2mat](https://www.mathworks.com/help/matlab/ref/cell2mat.html)
* [MathWorks&reg; - David Hill (2023). Introductory Linear Algebra With Applications](https://www.mathworks.com/matlabcentral/fileexchange/2284-introductory-linear-algebra-with-applications)
* [GNU Octave Documentation](https://docs.octave.org/latest/)
    * [6.3 Cell Arrays](https://docs.octave.org/latest/Cell-Arrays.html)
    * [8.1.1 Advanced Indexing](https://docs.octave.org/latest/Advanced-Indexing.html)
    * [18.2 Basic Matrix Functions](https://octave.org/doc/latest/Basic-Matrix-Functions.html)
    * [19.2 Broadcasting](https://docs.octave.org/latest/Broadcasting.html)
* [Octave Forge - Search Function](https://octave.sourceforge.io/list_functions.php)
* [Octave Forge - Function List](https://octave.sourceforge.io/octave/overview.html)
* [Octave Forge - Extra packages for GNU Octave](https://octave.sourceforge.io/)
* [Octave Online](https://octave-online.net/)
* [Octave scripts source](https://github.com/gnu-octave/octave/tree/default/scripts)
* [Octave lexer](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/lex.ll)
* [Octave parser](https://github.com/gnu-octave/octave/blob/default/libinterp/parse-tree/oct-parse.yy)
* [GNU Octave at Wikipedia](https://en.wikipedia.org/wiki/GNU_Octave)
* [GNU Octave at Free Software Foundation](https://www.gnu.org/software/octave/)
* [MATLAB&reg; parser by Tegala Sravani](https://github.com/TegalaSravani/MATLAB-PARSER)
* [The Design and Implementation of a Parser and Scanner for the MATLAB&reg; Language in the MATCH Compiler](http://www.ece.northwestern.edu/cpdc/pjoisha/MAGICA/CPDC-TR-9909-017.pdf)
* [MATLAB&reg; grammar from Grammar Zoo](https://slebok.github.io/zoo/markup/scientific/matlab/srour/extracted/index.html)
* [Wikipedia - Row- and column-major order](https://en.wikipedia.org/wiki/Row-_and_column-major_order)
* [Wikipedia - Lexicographic order](https://en.wikipedia.org/wiki/Lexicographic_order)
* [Wikipedia - Multilinear algebra](https://en.wikipedia.org/wiki/Multilinear_algebra)
* [Scratchapixel 3.0 - Geometry - Row Major vs Column Major Vector](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/row-major-vs-column-major-vector.html)
* [The R Project for Statistical Computing](https://www.r-project.org/)
* [JS for Science](https://indico.cern.ch/event/853710/contributions/3708132/attachments/1985053/3307323/Armina_Abramyan_JS_for_Science.pdf)
