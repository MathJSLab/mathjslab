# Release notes

All notable changes to this project will be documented in this file. This
project adheres to [Semantic Versioning](http://semver.org/).

## 1.8.1

- Modifications in `.prettierignore` file.
- The following modifications were made due to comply the package build to be
  checked by a CircleCI pipeline:
    - More streamlined script definitions in the `package.json` file (removing
      pre and post definitions where possible).
    - The `.circleci/config.yml` file was created to configure a CircleCI
      pipeline.
    - The `src/MathJSLabLexer.ts` and `src/MathJSLabParser.ts` entries of
      `.gitignore` file has been removed.
    - The `script/build-resources.ts` file has been renamed to
      `script/get-antlr.ts` and modifications have been made so the script
      accepts command line parameters (the output directory).
    - The `"files"` field was created in the `package.json` file to select only
      the files that should be saved to the npm registry.
    - The `npx sort-package-json` command was executed to sort the fields in
      the `package.json` file.
    - The CircleCI status badge has been included in the `README.md` file.
- Due to GitHub's rate limit issues, the organization repository's direct raw
  file download system was replaced with a system that clones the entire
  repository, then copies individual files to the current project and removes
  the cloned repositories directory. The files
  `script/helper/copy-repo-files.ts` and `copy.repo.config.json` were created
  and moved to the organization repository.

## 1.8.0

- The second release of 2025 (`reia`) has been launch.
- Changes in `README.md` file (grammatical corrections in paragraph on line
  43).
- The `mathjslab.bib` file has been improved with the inclusion of repository
  and project page URLs.
- The complex type was restructured to support number types other than
  `Decimal`. The `ComplexNumber` class was created, analogous to the
  ComplexDecimal class. The complex type contract was created in the
  `src/ComplexInterface.ts` file, defining the complex type generically. We
  adopted the Facade architecture: The `src/Complex.ts` file was created with
  the corresponding class. The static methods in the `ComplexDecimal` class
  were converted to arrow functions. This is the facade design: the static
  methods and properties are in the `Complex` class, which uses the methods and
  properties of `ComplexDecimal` or `ComplexNumber`. The type is defined by
  `ComplexType` in the `Complex.ts` file. Most of the methods and properties in
  `ComplexDecimal` and `ComplexNumber` are defined through factory functions
  defined in the `ComplexInterface.ts` file. Some extensions to the `Decimal`
  object and the native `Math` object have been created for use by factories.
  Local methods have been removed from `Evaluator` with the class directly
  referencing the base class's methods and properties. Modifications were made
  to the `Evaluator` class so that after changing the engine (`ComplexDecimal`
  or `ComplexNumber`) with the `configure` function, when executing the `clear`
  command, the `Evaluator` properties are reloaded with the appropriate values
  for the selected engine. Thus, modifying some of the configuration parameters
  with `configure` (the `'real'` parameter in this case) must be followed by
  the `clear` command.
- In all object classes and in the `Complex` facade, the `isInstanceOf` method
  was defined, returning `true` if the argument is an instance of the class. In
  the `Complex` class, the `isInstanceOf` method returns `true` if the argument
  is `ComplexNumber` or `ComplexDecimal`. Thus, the operator type tests in the
  methods of the `MathOperation` abstract class were changed to use the
  classes' `isInstanceOf` methods. To generate an array of strings with the
  keys of the `Complex` facade class, the build script `script/build-key.ts`
  and the helper `script/helper/buildInterfaceKeyTable.ts` were created. The
  build script generates the file `src/ComplexInterfaceStaticKeyTable.ts`. The
  helper `script/helper/buildInterfaceKeyTable.ts` was transferred to the
  organization's repository and can be downloaded from the organization's
  repository (https://github.com/MathJSLab).
- The `AST.ts` file has been enhanced to meet ESM module standards. Functions
  that create Abstract Syntax Tree nodes have been grouped into the `AST`
  class, and type definitions are exported with `export type`. The `omitOut`
  property of `NodeBase` has been renamed to `OmitOutput`. The `omitAns`
  property defined on some nodes has been renamed to `omitAnswer` and defined
  on `NodeBase`. The node types that, by definition, should not write the `ans`
  variable have been specified in the `omitAnswerTable` array.
- All static methods in the abstract class `MathOperation` have been converted
  to arrow functions and the class typing has been improved.
- The `src/lib-node.ts` and `src/lib-node.es2015.ts` files were created to
  selectively include packages in the Node.js environment (only
  `import 'node:crypto'` for now, to support the `decimal.js` package - used in
  the `Decimal.random` method according to the configuration options). The
  `webpack.config.ts` file was improved, with more granular build configuration
  in the `build.config.json` file (to resolve errors related to the output
  generated by the Webpack bundle analyzer). The `BuildConfigSet` and
  `BuildConfig` types were defined in the `webpack.config.ts` file.
- The `madge` package has been installed as development dependency to test
  circular imports. The `"test:circular"` script has been created in the
  `package.json` file.
- All static methods in the `CharString` and `FunctionHandle` classes have been
  converted to arrow functions.
- The `eslint.config.cjs` configuration file has been improved, grouping
  definitions in a more streamlined manner. The package's TypeScript source
  code definitions now comply with modern ESM definitions.
- A setting for formatting `.md` files has been added to the `.prettierrc`
  file.
- The `shx` package was installed as a development dependency. The `rimraf`
  package has been removed from development dependencies. The scripts in the
  `package.json` file have been changed to use `shx rm -rf` instead of
  `rimraf`.

## 1.7.3

- The following dependencies has been removed: `@types/debug`,
  `@types/supertest` and `source-map-support`. The
  `@types/eslint-config-prettier` package has been installed as development
  dependency.
- The following scripts in the `package.json`file has been renamed:
    - `"download-resources"` to `"download"`.
    - `"clean:download-resources"` to `"clean:download"`.
- All dependencies have been updated.
- The MathJSLab logo have been updated.
- Added `mathjslab.bib` file with bibtex entry to cite the software properly.
- The generation of es2020 targets has been changed to generate es2022 targets.
- The `string.at` method in the `src/MathJSLabParser.g4` (line 134) has been
- changed to indexing due to target incompatibility (es2015).

## 1.7.2

- The `"type": "module"` field has been added to the `package.json` file and
  the `"main"`, `"module"`, `"exports"` and `"browser"` fields in the
  `package.json` file have been changed to follow modern standards and avoid
  unwanted fallback to the UMD bundle.
- All dependencies have been updated.

## 1.7.1

- More rational definitions in `webpack.config.ts`.
- The `cross-env` package has been instaled as development dependency and some
  scripts in the `package.json` file has been made platform-independent.
- All references to `global` have been changed to `globalThis`.
- Dependencies updated.
- The `ajv` package was installed as a development dependency. It was needed
  after the last dependency update. An error was occurring during the Webpack
  build, which was resolved after installing `ajv`. The reason for this error
  may be related to running Webpack using `tsx`.
- The `fence` and `stretchy` properties has been set to `true` on all `<mo>`
  elements referring to delimiters in MathML unparse functions.
- The definition of namespace in `ComplexDecimal.ts` file has been removed.
- The inline exports of types and objects in multiple files have been moved to
  the end of the files. This way they comply with the modern way of defining
  modules. It's a new code convention (decribed in `CONTRIBUTING.md` file).
- A more detailed description of the demo web application's features has been
  included in the documentation (`README.md` file).
- A badge pointing to the [OpenAIRE](https://explore.openaire.eu/) search for
  MathJSLab has been added to the `README.md` file.
- An operator precedence table has been added to the `Evaluator` class and the
  `unparserMathML` method has been modified to not represent unnecessary
  parentheses in the result. The `Evaluator.nodePrecedence` method was also
  created, which, by consulting the precedence table, returns the precedence of
  the AST node.
- The file `MathML.ts` was created containing some types and an abstract class
  with a static property (`format`) that defines functions to help unparse in
  MathML language. The comments in this file contain relevant MathML language
  references that were used to code this module.

## 1.7.0

- All dependencies have been updated.
- The `README.md` file has been updated with trademark notice.

## 1.7.0-b1

- The reason for publishing this beta version is to test access via CDNs before
  publishing the final version, so that we can describe the use of CDNs in the
  `README.md` file.
- All dependencies have been updated.
- 'globalThis' has been configured as a global object to make the package work
  in any JavaScript environment, as per
  [#2](https://github.com/MathJSLab/mathjslab/issues/2) and
  [#3](https://github.com/MathJSLab/mathjslab/pull/3). Now the project Webpack
  configuration generates 6 different bundles:

1. web.umd2015
2. node.cjs2015
3. web.umd2020
4. node.cjs2020
5. web.esm2020
6. node.esm2020

Additionally, type generation is now done by `tsc` in an initial build step,
separate from the build of bundles. The bundles targeting "ES2015" imports
'globalthis/polyfill' (imported by file 'src/lib.es2015.ts') for compatibility
('globalthis' package added as regular dependency). The fields "main", "module"
and "exports" of `package.json` file has been set to support different targets.
The `license-webpack-plugin` is used to generate the license of each bundle
accurately. The generation of .d.ts files is now done in a separate step by
tsc, before the Webpack build. Some `tsconfig` files were created, extending
the `tsconfig.build.json` file, for building the various bundles and type
definitions.

- The `build.config.json` file was created, which is imported by
  `webpack.config.json` to customize some Webpack build configurations.
- The `test` directory was created, with bundle integration tests, in addition
  to other tests. The Jest configuration (`jest.config.js`) has been updated:
  there are 7 test projects, one is a unitary test and the others are resulting
  bundles tests. Scripts to run tests has been created in `package.json` file.
  The tests have not yet been fully implemented. In fact, the test coverage is
  small, and what has been done is only the structure of the tests, the
  creation of the `.spec.*` files, the configuration of Jest, etc.
- The `script/build-resources.ts` has been updated to download the ANTLR
  license. It's not available at `node_modules`, then the
  `license-webpack-plugin` can't insert license text in the outputh directory
  `./lib/`. The ANTLR license is downloaded from GitHub repository and inserted
  as licenseTextOverrides plugin parameter.
- The `git-commit.cjs` script was created to commit with the user's message. If
  no message is entered, after the timeout (5s) a default message with the date
  is used. The file was also created in the
  [MathJSLab organization repository](https://github.com/MathJSLab) to be
  available on other projects as well.

## 1.6.2

- All dependencies have been updated.
- The MathJSLab logo has been modified. It is built on the MathJSLab
  organization repository, and the 'mathjslab' package downloads the
  logo-related files (and other common files too) from the organization
  repository using the `download-files.cjs` script, which also provides a means
  to clean up the downloaded files. The download of these files is triggered by
  the script in the `package.json` file called "download-resources".
- The ESLint configuration file (`eslint.config.js`) has been revised.
- An example on CodePen was added (on README.md).

## 1.6.1

- All dependencies have been updated.
- Optimizations in the file 'mathjslab-logo.svg'
- Changes in the 'webpack.config.ts': `path.resolve` changed to `path.join`
  when possible. More rational path specifications. JavaScript files selection
  removed from regular expression test (`configuration.module.rules[0].test`
  and `configuration.module.rules[0].exclude`). JavaScript files selection
  removed from regular expressions in the file 'jest.config.js' too.
- The demo Web application of MathJSLab package has been renamed to
  'mathjslab-demo', with its repository also being renamed. All references to
  its name and repository have been updated.
- Added information to the 'README.md' file stating that the MathJSLab package
  documentation is in three languages, in the demo web application repository.

## 1.6.0

- Change repository owner to MathJSLab GitHub organization:
  https://github.com/MathJSLab . Changes in repository references in
  'package.json' file and documentation.

## 1.5.13

- Changes in 'README.md' file (CDN instructions and links, badges, build
  instructions, ISBN link, etc.).
- Changes to build scripts ('script' directory): some console messages issued
  using `console.warn` and `console.error` instead of `console.log`.
- The structure of the build files in the 'package.json' file has been modified
  (cleanup scripts).

## 1.5.12

- Some changes in 'README.md' file (links to mathjslab.com).
- Exclude eslint and jest config from build ('tsconfig.build.json' file).
- Improvements to the 'webpack.config.ts' file to setup
  `configuration.mode = argv.mode`. Webpack configuration was hardcoded as a
  factory.
- The 'eslint.config.js' file has been changed to include more granular rules
  for the 'script' directory and configuration files.

## 1.5.11

- Domain setup (mathjslab.com). Set as "homepage" in 'package.json' file. Some
  changes in 'README.md' file.

## 1.5.10

- The 'node-html-parser', 'tsconfig-paths' and 'tsx' packages have been
  installed as development dependencies. The 'ts-node' package was kept because
  of the 'webpack.config.ts' file. Webpack uses 'ts-node' when the
  configuration file is coded in TypeScript. All dependencies have been
  updated.
- The 'jest.config.js' file has been created and the jest configurations in the
  'package.json' file have been moved to it.
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
  of type `public static readonly`, followed by the class name in uppercase)
  was set in each file by the literal numeric value in the files
  'FunctionHandle.ts', 'CharString.ts' and 'Structure.ts'. This was necessary
  to fix errors occurring in jest tests.

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

- Bug fix in `MultiArray.evaluate` (array of cells be evaluated in the same way
  as common array now solved).

## 1.5.3

- Bug fix in `MultiArray.evaluate` (evaluating null array throws error now
  solved).

## 1.5.2

- Bug fix in `MultiArray.evaluate`. Before the method was page-oriented. Now is
  full dimensional using recursion and concatenation.
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
  to use function handles. Now the function definitions and use is the same
  like in MATLAB&reg;/Octave.

## 1.4.2

- Bug fix in indexing by colon (:).
- Bug fix in functions 'ones' and 'zeros' (`CoreFunctions.newFilled`).

## 1.4.1

- More strong type definitions in 'AST.ts' and 'MathJSLabParser.g4' files.
- Number input as binary, octal and hexadecimal implemented in REAL_NUMBER rule
  of lexer.
- Optimizations in 'ComplexDecimal.ts' (use of isZero() method).
- Bug fix in `Evaluator` (indexing with 'end' and literal indexing).
- `clear` word list command defined inside body of `Evaluator` class.
- 'constantsTable.ts' file and `Evaluator.readonlyNameTable` has been removed.
  Improvements in clear command.
- 'Structure.ts' file with `Structure` class definition and its respective test
  file has been created. Some indirect reference implemented in lexer, parser
  and evaluator.
- Bug fix in expansion with indexing from scalar.
- Bug fix in test files (references to `Evaluator.initialize` modified to
  `new Evaluator`).
- Bug fix in functions 'rand' and 'randi' (`CoreFunctions.newFilledEach`).
- Optimizations in `Evaluator.validateAssignment` (remove `left` field in
  return value).
- Create `ComplexDecimal.random` using `Decimal.random` so configuration
  'crypt' takes effect.
- Optimizations in `ComplexDecimal.set`.
- Changes in `Evaluator.baseFunctionTable` and function calling:
    - mapper field is now not optional.
    - `Evaluator.localTable` variable creation using
      `globalThis.crypto.randomUUID`.
    - Function parameters selectively evaluated if ev.length > 0.

## 1.4.0

- Bug fix in parser (pre-increment and element-by-element operations).
- Rules to functions definition and handlers in parser and AST implemented.
  Evaluation not yet implemented.
- The string 'arguments' to define arguments block in functions is defined as
  keyword in lexer.
- 'Parser.ts' file removed and Parser implemented as a method of `Evaluator`.
  The method `Evaluator.initialize` has been removed and initialization actions
  moved to `Evaluator` constructor. Now the `Evaluator` class can be
  instantiated more than one time.

## 1.3.4

- More strong type definitions in 'MultiArray.ts', 'Evaluator.ts' and
  'MathOperation.ts' files.
- Global variable EvaluatorPointer removed. Evaluator instance reference passed
  in method parameters.

## 1.3.3

- File 'MathObject.ts' and (their respective class and test file) renamed to
  MathOperation.ts.
- CharString conversion to MultiArray implemented as previous to any operation
  in MathOperation.ts.

## 1.3.2

- Tests for types implemented as `instanceof` in 'MathObject.ts' and
  'Evaluator.ts'. Method 'isThis' removed from classes.
- Some bug fix in evaluator (not operation).

## 1.3.1

- Improvements and some bug fixes in lexer and parser. Support for cell arrays
  in parser and MultiArray class. Error messages in existing functions and cell
  array functions no yet implemented.
- Start and stop positions (line and column) of statements in global scope
  stored in AST nodes.
- Some improvements in CharString class, removing 'removeQuotes' method an
  creating 'quote' property to store type of quote (single or double).

## 1.3.0

- Parser implemented using ANTLR in files 'MathJSLabLexer.g4' and
  'MathJSLabParser.g4'. The wrapper class for lexer and parser has been created
  in file Parser.ts. Need to make extensive tests.
- File names converted to camel case.
- The file AST.ts (Abstract Syntax Tree) has been created, and related types
  and interfaces defined in Evaluator.ts has been moved to AST.ts file.

## 1.2.5

- Optimizations (resulting return as number) in multi-array.ts file and code
  cleaning by hand in file 'parser.jison'.

## 1.2.4

- The file 'symbol-table.ts' and 'symbol-table.spec.ts' has been created.
- Changes in the lexer to support comment blocks spaces and line breaks to
  separate elements within arrays. Context variables created (previous_token
  and matrix_context).

## 1.2.3

- The file 'configuration.ts' and 'configuration.spec.ts' has been created. Two
  user functions (configure and getconfig) was created to manage internal
  configurations of MathJSLab. Most of the settings refer to Decimal.js
  settings related to the accuracy of the results.
- Namespaces wrapping external definitions in 'evaluator.ts' and
  'complex-decimal.ts' files.

## 1.2.2

- Bug fix in function 'cat'.
- User functions 'cummin', 'cummax', 'cumsum', 'cumprod', 'ndims', 'rows',
  'columns', 'length', 'numel', 'isempty' and 'reshape'.
- Bug fix in MultiArray.unparse and MultiArray.unparseMathML (null array).
- Bug fix in MultiArray constructor (dimension.length >= 2).
- Bug fix in MultiArray.isEmpty.
- Functions newFilled and newFilledEach in MultiArray class moved to
  CoreFunctions and optimized.
- Some methods related to multiple assignment in Evaluator modified to static
  functions.

## 1.2.1

- More methods and properties have been renamed to express their functions more
  clearly.
- Code cleaning by hand.
- Bug fix in MultiArray.newFilledEach (used in rand and randi functions).

## 1.2.0

- The MultiArray class now supports multidimensional arrays. More integration
  tests are needed. Several methods have been renamed to express their
  functions more clearly. Methods related to linear algebra in MultiArray class
  have been moved to the LinearAlgebra class in linear-algebra.ts file.
- The core-functions.ts file and its corresponding test file were created.
  Functions in MultiArray class have been moved to the CoreFunctions class in
  core-functions.ts file. The generalized methods have been left in MultiArray
  class and the user functions have been moved to the CoreFunctions class. The
  linearizedFunctions in MultiArray class have been removed (and corresponding
  methods and code in Evaluator class removed too).

## 1.1.27

- The linear-algebra.ts file and its corresponding test file were created. The
  relevant methods of the MultiArray class will be moved to this file as
  support for multidimensional arrays evolves in the MultiArray class. Some
  methods moved.
- More evolve to support multidimensional arrays in the MultiArray class.
  MultiArray constructor upgraded to support multidimensional arrays.
  Constructor overloaded.
- The class `Tensor` has been renamed to `MathObject` and the file 'tensor.ts'
  has been renamed to 'math-object.ts'. The file 'math-object.spec.ts' has been
  created.
- The corresponding test file for char-string.ts file has been created.
- Unary and binary operations name type defined in complex-decimal.ts for use
  in generic operations methods of the MultiArray class.

## 1.1.26

- A fix for a major bug in element wise operations. Assymetric operations
  produce incorrect results. This shouldn't even be called a bug. This was like
  finding a lizard in your bathroom, coming up the drain. The fix has been
  simple, but the lizard is old, it certainly comes from the first version. It
  is necessary to extend the tests.
- `horzcat` and `vertcat` functions defined as function mappings.
- Start to extend MultiArray class to support multidimensional arrays.

## 1.1.25

- More bug fix in indexing (some `end` in ranges stop to work after 1.1.23. The
  problem is parent link absent in some constructions).

## 1.1.24

- Fix logical indexing (with operation and literal).

## 1.1.23

- Logical indexing.

## 1.1.22

- Fix `end` in ranges. The `colon_item` parser rule has been removed and the
  `end` descriptor in ranges has been created in the `primary_expr` rule.
- Fix range expansion. Before it could only be increasing, now it can also be
  decreasing.
- Reference to contribute to MathJSLab Demo in CONTRIBUTING.md file.

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

- `end` in ranges implemented in parser rule `colon_item`. To do this it was
  necessary to track the context creating the `parent` property in each node,
  set during `Evaluator`, and also the `index` property in the 'LIST' and 'IDX'
  type nodes. This can be useful in `Unparse` and `UnparseMathML`, to eliminate
  unnecessary parenthesis.

## 1.1.17

- Project launch.
- Multiple assignment implemented using `NodeReturnList` type. Method
  `reduceIfReturnList` created in class `Evaluator`.
