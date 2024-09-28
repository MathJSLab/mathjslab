# Release notes
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.5.13
- Changes in 'README.md' file (CDN instructions and links, badges, build
instructions, ISBN link, etc.).
- Changes to build scripts ('script' directory): some console messages issued
using `console.warn` and `console.error` instead of `console.log`.
- The structure of the build files in the 'package.json' file has been
modified (cleanup scripts).

## 1.5.12
- Some changes in 'README.md' file (links to mathjslab.com).
- Exclude eslint and jest config from build ('tsconfig.build.json' file).
- Improvements to the 'webpack.config.ts' file to setup
`configuration.mode = argv.mode`. Webpack configuration was hardcoded as
a factory.
- The 'eslint.config.js' file has been changed to include more granular rules
for the 'script' directory and configuration files.

## 1.5.11
- Domain setup (mathjslab.com). Set as "homepage" in 'package.json' file. Some
changes in 'README.md' file.

## 1.5.10
- The 'node-html-parser', 'tsconfig-paths' and 'tsx' packages have been
installed as development dependencies. The 'ts-node' package was kept because
of the 'webpack.config.ts' file. Webpack uses 'ts-node' when the configuration
file is coded in TypeScript. All dependencies have been updated.
- The 'jest.config.js' file has been created and the jest configurations in
the 'package.json' file have been moved to it.
- The "keywords" field in 'package.json' file was modified.
- The 'script' directory with build scripts has been created. It contains the
'helper' directory with useful functions for the build scripts.
- The 'eslint.config.js' file has been changed to include more flexible rules
for the 'script' directory.
- The 'clean-package-lock.cjs' script has been created. It removes the
'package-lock.json' file and the 'node_modules' directory.
- The 'build-resources.ts' script has been created. It downloads the latest
version of ANTLR into the resources directory for use by the project.
- The identifier property of the base classes (the first property of the class
of type `public static readonly`, followed by the class name in uppercase) was
set in each file by the literal numeric value in the files
'FunctionHandle.ts', 'CharString.ts' and 'Structure.ts'. This was necessary to
fix errors occurring in jest tests.

## 1.5.9
- Prettier settings in 'eslint.config.js'.
- File '.npmrc' created. Configuration legacy-peer-deps set to true.
- Target modified to es2015.
- Badge 'GitHub Created At' added to 'README.md'.

## 1.5.8
- Badge changes in 'README.md' file. Using badges from https://shields.io/ .
- Dependecies update.
- Bug fix in functions 'asin', 'acsc', 'asec' and 'acot'.
- Configurations in '.eslintrc.js' (removed) modified to flat config in
'eslint.config.js'.

## 1.5.7
- MathJSLab logo in README.md file.
- User function 'isstruc'.

## 1.5.6
- Optimizations in `CoreFunctions.throwInvalidCallError` (`test`parameter) and
all `CoreFunctions` methods that use it.
- More strong type definitions in 'CoreFunctions.ts' file.
- User functions 'isscalar', 'ismatrix', 'isvector', 'iscell', 'isrow' and
'iscolumn'.

## 1.5.5
- Sizes and Zenodo badges in 'README.md'.
- User function 'squeeze'.

## 1.5.4
- Bug fix in `MultiArray.evaluate` (array of cells be evaluated in the same
way as common array now solved).

## 1.5.3
- Bug fix in `MultiArray.evaluate` (evaluating null array throws error now
solved).

## 1.5.2
- Bug fix in `MultiArray.evaluate`. Before the method was page-oriented. Now
is full dimensional using recursion and concatenation.
- Exports `ElementType` from 'MultiArray.ts' in 'lib.ts'.
- User functions 'repmat', 'colon', 'linspace', 'logspace', 'meshgrid' and
'ndgrid'.
- Optimizations in `MultiArray.reshape`.

## 1.5.1
- Bug fix in `Evaluator` ('IDX' node processing).

## 1.5.0
- The file 'FunctionHandle.ts' and its corresponding test file has been
created. The `FunctionHandle` type has been created and made a member of
`AST.NodeExpr` through `ElementType`. `Evaluator.nameTable` entries has been
modified to `AST.NodeExpr`. Changes in `Evaluator.Evaluator`, removing
function definition, and altering processing of node types 'IDENT' and 'IDX'
to use function handles. Now the function definitions and use is the same like
in MATLAB&reg;/Octave.

## 1.4.2
- Bug fix in indexing by colon (:).
- Bug fix in functions 'ones' and 'zeros' (`CoreFunctions.newFilled`).

## 1.4.1
- More strong type definitions in 'AST.ts' and 'MathJSLabParser.g4' files.
- Number input as binary, octal and hexadecimal implemented in REAL_NUMBER rule of lexer.
- Optimizations in 'ComplexDecimal.ts' (use of isZero() method).
- Bug fix in `Evaluator` (indexing with 'end' and literal indexing).
- `clear` word list command defined inside body of `Evaluator` class.
- 'constantsTable.ts' file and `Evaluator.readonlyNameTable` has been removed. Improvements in clear command.
- 'Structure.ts' file with `Structure` class definition and its respective test file has been created. Some indirect reference implemented in lexer, parser and evaluator.
- Bug fix in expansion with indexing from scalar.
- Bug fix in test files (references to `Evaluator.initialize` modified to `new Evaluator`).
- Bug fix in functions 'rand' and 'randi' (`CoreFunctions.newFilledEach`).
- Optimizations in `Evaluator.validateAssignment` (remove `left` field in return value).
- Create `ComplexDecimal.random` using `Decimal.random` so configuration 'crypt' takes effect.
- Optimizations in `ComplexDecimal.set`.
- Changes in `Evaluator.baseFunctionTable` and function calling:
  * mapper field is now not optional.
  * `Evaluator.localTable` variable creation using `global.crypto.randomUUID`.
  * Function parameters selectively evaluated if ev.length > 0.


## 1.4.0
- Bug fix in parser (pre-increment and element-by-element operations).
- Rules to functions definition and handlers in parser and AST implemented. Evaluation not yet implemented.
- The string 'arguments' to define arguments block in functions is defined as keyword in lexer.
- 'Parser.ts' file removed and Parser implemented as a method of `Evaluator`. The method `Evaluator.initialize` has been removed and initialization actions moved to `Evaluator` constructor. Now the `Evaluator` class can be instantiated more than one time.

## 1.3.4
- More strong type definitions in 'MultiArray.ts', 'Evaluator.ts' and 'MathOperation.ts' files.
- Global variable EvaluatorPointer removed. Evaluator instance reference passed in method parameters.

## 1.3.3
- File 'MathObject.ts' and (their respective class and test file) renamed to MathOperation.ts.
- CharString conversion to MultiArray implemented as previous to any operation in MathOperation.ts.

## 1.3.2
- Tests for types implemented as `instanceof` in 'MathObject.ts' and 'Evaluator.ts'. Method 'isThis' removed from classes.
- Some bug fix in evaluator (not operation).

## 1.3.1
- Improvements and some bug fixes in lexer and parser. Support for cell arrays in parser and MultiArray class. Error messages in existing functions and cell array functions no yet implemented.
- Start and stop positions (line and column) of statements in global scope stored in AST nodes.
- Some improvements in CharString class, removing 'removeQuotes' method an creating 'quote' property to store type of quote (single or double).

## 1.3.0
- Parser implemented using ANTLR in files 'MathJSLabLexer.g4' and 'MathJSLabParser.g4'. The wrapper class for lexer and parser has been created in file Parser.ts. Need to make extensive tests.
- File names converted to camel case.
- The file AST.ts (Abstract Syntax Tree) has been created, and related types and interfaces defined in Evaluator.ts has been moved to AST.ts file.

## 1.2.5
- Optimizations (resulting return as number) in multi-array.ts file and code cleaning by hand in file 'parser.jison'.

## 1.2.4
- The file 'symbol-table.ts' and 'symbol-table.spec.ts' has been created.
- Changes in the lexer to support comment blocks spaces and line breaks to separate elements within arrays. Context variables created (previous_token and matrix_context).

## 1.2.3
- The file 'configuration.ts' and 'configuration.spec.ts' has been created. Two user functions (configure and getconfig) was created to manage internal configurations of MathJSLab. Most of the settings refer to Decimal.js settings related to the accuracy of the results.
- Namespaces wrapping external definitions in 'evaluator.ts' and 'complex-decimal.ts' files.

## 1.2.2
- Bug fix in function 'cat'.
- User functions 'cummin', 'cummax', 'cumsum', 'cumprod', 'ndims', 'rows', 'columns', 'length', 'numel', 'isempty' and 'reshape'.
- Bug fix in MultiArray.unparse and MultiArray.unparseMathML (null array).
- Bug fix in MultiArray constructor (dimension.length >= 2).
- Bug fix in MultiArray.isEmpty.
- Functions newFilled and newFilledEach in MultiArray class moved to CoreFunctions and optimized.
- Some methods related to multiple assignment in Evaluator modified to static functions.

## 1.2.1
- More methods and properties have been renamed to express their functions more clearly.
- Code cleaning by hand.
- Bug fix in MultiArray.newFilledEach (used in rand and randi functions).

## 1.2.0
- The MultiArray class now supports multidimensional arrays. More integration tests are needed. Several methods have been renamed to express their functions more clearly. Methods related to linear algebra in MultiArray class have been moved to the LinearAlgebra class in linear-algebra.ts file.
- The core-functions.ts file and its corresponding test file were created. Functions in MultiArray class have been moved to the CoreFunctions class in core-functions.ts file. The generalized methods have been left in MultiArray class and the user functions have been moved to the CoreFunctions class. The linearizedFunctions in MultiArray class have been removed (and corresponding methods and code in Evaluator class removed too).

## 1.1.27
- The linear-algebra.ts file and its corresponding test file were created. The relevant methods of the MultiArray class will be moved to this file as support for multidimensional arrays evolves in the MultiArray class. Some methods moved.
- More evolve to support multidimensional arrays in the MultiArray class. MultiArray constructor upgraded to support multidimensional arrays. Constructor overloaded.
- The class `Tensor` has been renamed to `MathObject` and the file 'tensor.ts' has been renamed to 'math-object.ts'. The file 'math-object.spec.ts' has been created.
- The corresponding test file for char-string.ts file has been created.
- Unary and binary operations name type defined in complex-decimal.ts for use in generic operations methods of the MultiArray class.

## 1.1.26
- A fix for a major bug in element wise operations. Assymetric operations produce incorrect results. This shouldn't even be called a bug. This was like finding a lizard in your bathroom, coming up the drain. The fix has been simple, but the lizard is old, it certainly comes from the first version. It is necessary to extend the tests.
- `horzcat` and `vertcat` functions defined as function mappings.
- Start to extend MultiArray class to support multidimensional arrays.

## 1.1.25
- More bug fix in indexing (some `end` in ranges stop to work after 1.1.23. The problem is parent link absent in some constructions).

## 1.1.24
- Fix logical indexing (with operation and literal).

## 1.1.23
- Logical indexing.

## 1.1.22
- Fix `end` in ranges. The `colon_item` parser rule has been removed and the `end` descriptor in ranges has been created in the `primary_expr` rule.
- Fix range expansion. Before it could only be increasing, now it can also be decreasing.
- Reference to contribute to MathJSLab Calculator in CONTRIBUTING.md file.

## 1.1.21
- Fix evaluator: 'LIST' `parent` setting.
- Fix evaluator: assignment at right side.
- Fix evaluator: some parents did not propagate to all terminal nodes.
- Comment about the ISBN in the CONTRIBUTING.md file.

## 1.1.20
- Changes in build scripts in package.json.
- Colon (:) when indexing.
- Discard output (~ at left side).

## 1.1.19
- Fix parser parenthesis node.

## 1.1.18
- `end` in ranges implemented in parser rule `colon_item`. To do this it was necessary to track the context creating the `parent` property in each node, set during `Evaluator`, and also the `index` property in the 'LIST' and 'IDX' type nodes. This can be useful in `Unparse` and `UnparseMathML`, to eliminate unnecessary parenthesis.

## 1.1.17
- Project launch.
- Multiple assignment implemented using `NodeReturnList` type. Method `reduceIfReturnList` created in class `Evaluator`.
