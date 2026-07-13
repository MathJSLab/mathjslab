# Function Signatures

MathJSLab uses declarative function signatures to describe how built-in
functions may be called. A signature records the accepted input arity, output
arity, overloads, parameter classes, and reusable value validators. The
interpreter uses this metadata before dispatching a built-in implementation, so
common MATLAB/Octave-like call checks do not need to be repeated manually
inside each function body.

The signature system is intentionally focused on the infrastructure that is
shared by all built-ins. It validates the number of inputs, the number of
outputs used for introspection, and the evaluated argument values that can be
checked by common predicates. Function-specific semantic checks may still live
inside the implementation when they depend on relationships between arguments,
computed values, or behavior not expressible by the shared signature format.

## Public Types

The public type declarations are exported from `src/AST.ts` and are documented
in the generated API reference:

- [`BuiltInFunctionImplementation`](api-reference.md#builtinfunctionimplementation)
  is the callable implementation stored in a built-in registration entry.
- `BuiltInFunctionArity` describes a fixed, bounded, or variadic arity. It is
  defined in `src/AST.ts` and is used by the public signature interfaces.
- [`BuiltInFunctionInputSignature`](api-reference.md#builtinfunctioninputsignature)
  describes one accepted input overload and its optional parameter list.
- [`BuiltInFunctionSignature`](api-reference.md#builtinfunctionsignature)
  groups input and output signatures for a built-in.
- [`BuiltInFunctionParameter`](api-reference.md#builtinfunctionparameter)
  describes one positional parameter in an input signature.
- [`BuiltInFunctionParameterValidator`](api-reference.md#builtinfunctionparametervalidator)
  is the supported validator vocabulary for parameter values.
- [`FunctionSignatureEntry`](api-reference.md#functionsignatureentry) stores a
  built-in implementation beside its declarative signature.
- [`NodeBuiltInFunction`](api-reference.md#nodebuiltinfunction) is the runtime
  AST node installed in the interpreter built-in table.
- `FunctionSignature` contains helper methods for normalizing signatures,
  deriving `nargin`/`nargout`, and testing arity.
- `FunctionValidation` contains the shared value predicates used by built-in
  signatures and by MATLAB-like `arguments` blocks.

## Registration Model

Built-ins are registered through tables that keep the function implementation
and the signature side by side. This keeps each module's callable surface in
one place and avoids a separate global signature table that can drift away from
the implementation.

```ts
public static readonly isemptySignature: BuiltInFunctionSignature = {
    inputs: { arity: 1, parameters: [{ name: 'value' }] },
    outputs: { arity: 1 },
};

public static readonly functions: Record<string, FunctionSignatureEntry> = {
    isempty: {
        func: CoreFunctions.isempty,
        signature: CoreFunctions.isemptySignature,
    },
};
```

The current module-level registration tables are:

- `Configuration.functions` for configuration helpers such as `configure` and
  `getconfig`.
- `CoreFunctions.functions` for array, shape, reduction, construction, and core
  utility functions.
- `LinearAlgebra.functions` for linear-algebra functions.
- `Interpreter.functions` for interpreter-owned built-ins such as `class`,
  `which`, `eval`, `feval`, `nargin`, `nargout`, `inputname`, `narginchk`, and
  `nargoutchk`.

During interpreter initialization, these entries are loaded into the runtime
built-in table through `Context.defineBuiltInFunction`. The resulting
[`NodeBuiltInFunction`](api-reference.md#nodebuiltinfunction) receives the
signature in its `signature` property.

## Signature Shape

A complete built-in signature has this shape:

```ts
interface BuiltInFunctionSignature {
    inputs?: BuiltInFunctionInputSignature | BuiltInFunctionInputSignature[];
    outputs?: BuiltInFunctionArity | BuiltInFunctionArity[];
}
```

`inputs` and `outputs` may each be a single object or an array of objects. An
array means overloads. For inputs, overloads describe distinct accepted call
forms. For outputs, overloads describe distinct accepted output arities and are
used by `nargout` and return-list validation.

Every registered built-in should provide both `inputs` and `outputs`. The
coverage tests in `src/FunctionSignatureCoverage.spec.ts` check that module
registration entries have an implementation, have a signature, have
structurally valid arities, and are installed in the interpreter with signature
metadata.

## Arity

`BuiltInFunctionArity` is shared by input and output signatures:

```ts
interface BuiltInFunctionArity {
    arity: number;
    min?: number;
    max?: number;
}
```

The `arity` field has two modes:

- A nonnegative value is a fixed arity. For example, `{ arity: 2 }` accepts
  exactly two arguments.
- A negative value is a MATLAB/Octave-style variable arity. The absolute value
  is the 1-based position where the variadic part begins. For example,
  `{ arity: -2 }` means one fixed argument followed by a variable number of
  additional arguments.

`min` and `max` optionally override the derived range. They are useful when the
function is introspected as variadic but the accepted count is bounded.

Examples:

```ts
// Exactly one input.
{ arity: 1 }

// Zero or more inputs, variadic from position 1.
{ arity: -1, min: 0 }

// One required input plus at most one optional input.
{ arity: -2, min: 1, max: 2 }

// Two or three inputs, with the third input represented as optional.
{ arity: -3, min: 2, max: 3 }
```

The helper `FunctionSignature.arityMinimum` derives the minimum accepted count.
Without `min`, a negative arity has minimum `abs(arity) - 1`. The helper
`arityMaximum` derives the maximum count. Without `max`, a negative arity has
an infinite maximum.

## Introspection Arity

The same signature metadata is used by MATLAB/Octave-like introspection:

- `nargin('functionName')` uses the declared input signatures.
- `nargout('functionName')` uses the declared output signatures.

`FunctionSignature.declaredArity` converts one or more overloads into the
integer convention used by MATLAB/Octave:

- Fixed arity returns a nonnegative integer.
- Variable arity returns a negative integer.
- For overloaded signatures, a bounded but non-fixed set of accepted counts is
  represented as a negative value based on the largest finite maximum.
- For truly variadic overloads, the negative value is based on the variadic
  position.

For example:

```ts
// nargin reports 2.
{ inputs: { arity: 2 }, outputs: { arity: 1 } }

// nargin reports -2 because additional inputs start at position 2.
{ inputs: { arity: -2, min: 1 }, outputs: { arity: 1 } }

// nargout reports -3 because the third output is part of a variadic output
// list.
{ inputs: { arity: 1 }, outputs: { arity: -3 } }
```

## Input Overloads

An input signature describes one accepted call form:

```ts
interface BuiltInFunctionInputSignature extends BuiltInFunctionArity {
    parameters?: BuiltInFunctionParameter[];
}
```

If `inputs` is an array, the call is valid when at least one overload matches
the number of supplied arguments and, after evaluation, at least one matching
overload accepts the argument values.

The `find` signature is a typical overload list:

```ts
public static readonly findSignature: BuiltInFunctionSignature = {
    inputs: [
        { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
        {
            arity: 2,
            parameters: [
                { name: 'value', classes: ['double'] },
                {
                    name: 'count',
                    classes: ['double'],
                    validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                },
            ],
        },
        {
            arity: 3,
            parameters: [
                { name: 'value', classes: ['double'] },
                {
                    name: 'count',
                    classes: ['double'],
                    validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                },
                { name: 'direction', classes: ['char'], allowedStrings: ['first', 'last'] },
            ],
        },
    ],
    outputs: { arity: -3 },
};
```

This expresses `find(x)`, `find(x, n)`, and `find(x, n, direction)`. The
function still owns deeper result-shaping behavior, but invalid class, count,
and direction forms are rejected by the shared validator.

## Output Signatures

Output signatures use `BuiltInFunctionArity` without parameter records:

```ts
outputs: {
    arity: 1;
}
outputs: {
    arity: -2;
}
outputs: [{ arity: 1 }, { arity: 2 }];
```

Output signatures are used for `nargout` and for return-list validation. They
do not describe the runtime type of each returned value. A function that
returns a [`NodeReturnList`](api-reference.md#nodereturnlist), such as `find`,
`min`, `max`, `lu`, `qr`, or `eig`, should still expose the accepted number of
outputs declaratively.

Examples:

```ts
// A scalar-valued predicate.
{ inputs: { arity: 1 }, outputs: { arity: 1 } }

// A function whose useful outputs vary with the return list.
{ inputs: { arity: 1 }, outputs: { arity: -2 } }

// A function that can expose up to three outputs.
{ inputs: { arity: 1 }, outputs: { arity: -3 } }
```

## Parameters

[`BuiltInFunctionParameter`](api-reference.md#builtinfunctionparameter)
describes one positional argument after the interpreter has evaluated the call
arguments:

```ts
interface BuiltInFunctionParameter {
    name: string;
    classes?: string[];
    validators?: BuiltInFunctionParameterValidator[];
    allowedStrings?: string[];
    identifier?: boolean;
    alternatives?: BuiltInFunctionParameter[];
    variadicGroup?: BuiltInFunctionParameter[];
    allowInfinity?: boolean;
    optional?: boolean;
    variadic?: boolean;
}
```

`name` is required and is used for maintainability and diagnostics in coverage
tests. It should describe the MATLAB/Octave parameter role, not necessarily the
implementation parameter name.

`classes` restricts the runtime class accepted by the parameter. Supported
class names are defined by `FunctionValidation.className` and `matchesClass`:

- `double` accepts scalar numeric values and numeric arrays.
- `single` currently follows the same numeric acceptance path as `double`.
- `char` accepts [`CharString`](api-reference.md#charstring).
- `cell` accepts cell [`MultiArray`](api-reference.md#multiarray) values.
- `struct` accepts [`Structure`](api-reference.md#structure).
- `function_handle` accepts
  [`FunctionHandle`](api-reference.md#functionhandle).

`validators` applies reusable predicates such as numeric, scalar, vector,
dimension, integer, real, finite, positive, and nonempty checks. The complete
validator vocabulary is listed below.

`allowedStrings` restricts a `char` argument to a literal set. It is used for
options such as `'first'` and `'last'`.

`identifier` requires a `char` value that is syntactically a valid identifier.
This is useful for functions that accept variable or field names.

`optional` documents a parameter that is optional in a bounded variadic
signature. The arity range is still controlled by `arity`, `min`, and `max`.

`variadic` marks the parameter that should be reused for extra arguments.

`variadicGroup` describes a repeated pattern for extra arguments, such as
name-value pairs.

`alternatives` describes multiple accepted shapes for the same position.

`allowInfinity` relaxes numeric validators such as `positive`, `nonnegative`,
and `integer` so positive infinity can be accepted where a MATLAB/Octave-like
dimension or option permits it.

## Validators

[`BuiltInFunctionParameterValidator`](api-reference.md#builtinfunctionparametervalidator)
contains these values:

| Validator                 | Meaning                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `numeric`                 | Scalar numeric or numeric array.                                                            |
| `numericOrLogical`        | Numeric/logical-compatible value. The current runtime treats this through the numeric path. |
| `text`                    | Runtime `char` value.                                                                       |
| `textScalar`              | Runtime text scalar. In the current value model this follows the `char` path.               |
| `scalar`                  | Scalar according to `MultiArray.isScalar`.                                                  |
| `scalarOrEmpty`           | Scalar or empty.                                                                            |
| `scalarOrVector`          | Scalar or vector.                                                                           |
| `empty`                   | Empty value.                                                                                |
| `matrix2d`                | Scalar or two-dimensional array.                                                            |
| `squareMatrix`            | Scalar or square two-dimensional array.                                                     |
| `vector`                  | Vector according to `MultiArray.isVector`.                                                  |
| `twoElement`              | Linearized value has exactly two elements.                                                  |
| `oneOrTwoElement`         | Linearized value has one or two elements.                                                   |
| `dimension`               | Scalar nonnegative finite real integer dimension.                                           |
| `dimensionGreaterThanOne` | Scalar dimension strictly greater than one.                                                 |
| `dimensionVector`         | Nonempty vector of dimension values.                                                        |
| `reshapeDimension`        | Scalar or empty dimension value used by reshape-like calls.                                 |
| `reshapeDimensionVector`  | Vector of reshape dimension values.                                                         |
| `nonempty`                | Value is not empty.                                                                         |
| `positive`                | Numeric real values are greater than zero.                                                  |
| `nonnegative`             | Numeric real values are greater than or equal to zero.                                      |
| `nonzero`                 | Numeric values are not zero.                                                                |
| `zeroOrOne`               | Numeric real scalar or array elements are zero or one.                                      |
| `integer`                 | Numeric real values are integers.                                                           |
| `finite`                  | Numeric real and imaginary parts are finite.                                                |
| `real`                    | Numeric values have zero imaginary part.                                                    |

The validator normalizer removes redundant validators implied by more specific
validators. For example, `dimension` already implies numeric, scalar, finite,
real, integer, and nonnegative behavior. This lets signatures remain readable
even when they are written defensively.

## Alternatives

Use `alternatives` when a single positional argument may have more than one
valid shape.

The `eye` signature accepts either `eye(n)` or `eye([m n])` in the one-argument
form:

```ts
{
    arity: 1,
    parameters: [
        {
            name: 'dimensions',
            classes: ['double'],
            alternatives: [
                { name: 'dimension', validators: ['dimension'] },
                { name: 'dimensions', validators: ['dimensionVector', 'oneOrTwoElement'] },
            ],
        },
    ],
}
```

The base parameter first checks `classes: ['double']`. Then one of the
alternatives must match. This pattern is also useful when MATLAB/Octave accepts
either a flag or a dimension in the same position:

```ts
{
    name: 'flagOrDimension',
    classes: ['double'],
    alternatives: [
        { name: 'flag', validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
        { name: 'dimension', validators: ['dimensionGreaterThanOne'] },
    ],
}
```

## Variadic Parameters

A signature with negative `arity` is variadic. Extra arguments are matched
against the last applicable parameter when that parameter has `variadic: true`.

`numel` accepts one value followed by any number of indices:

```ts
public static readonly numelSignature: BuiltInFunctionSignature = {
    inputs: {
        arity: -2,
        min: 1,
        parameters: [
            { name: 'value' },
            { name: 'index', variadic: true },
        ],
    },
    outputs: { arity: 1 },
};
```

`size` accepts one or more dimension arguments after the value:

```ts
public static readonly sizeSignature: BuiltInFunctionSignature = {
    inputs: [
        { arity: 1, parameters: [{ name: 'value' }] },
        {
            arity: -2,
            min: 2,
            parameters: [
                { name: 'value' },
                {
                    name: 'dimension',
                    classes: ['double'],
                    validators: ['numeric', 'positive', 'integer', 'real'],
                    variadic: true,
                },
            ],
        },
    ],
    outputs: { arity: -1 },
};
```

The validator applies the `dimension` parameter to every extra argument after
the first position.

## Repeated Variadic Groups

Use `variadicGroup` when extra arguments repeat a pattern instead of repeating
one parameter shape. The signature matcher rotates through the group for each
extra argument.

A common example is a struct-like name-value pair sequence:

```ts
{
    arity: -1,
    min: 0,
    parameters: [
        {
            name: 'fieldValuePair',
            variadic: true,
            variadicGroup: [
                { name: 'field', classes: ['char'], identifier: true },
                { name: 'value' },
            ],
        },
    ],
}
```

This pattern accepts zero or more pairs. The first extra argument is checked as
`field`, the second as `value`, the third as `field`, and so on. If a function
requires complete pairs, the implementation or a future pair-aware signature
extension must still reject a trailing unmatched field, because the current
group matcher validates each supplied value independently.

## Optional Parameters

`optional` is descriptive metadata attached to a parameter. The accepted input
count is controlled by the signature arity range.

For example, the `colon` and `linspace` signatures use bounded variadic arity:

```ts
public static readonly colonSignature: BuiltInFunctionSignature = {
    inputs: {
        arity: -3,
        min: 2,
        max: 3,
        parameters: [
            { name: 'start', classes: ['double'], validators: ['scalar'] },
            { name: 'incrementOrEnd', classes: ['double'], validators: ['scalar'] },
            { name: 'end', classes: ['double'], validators: ['scalar'], optional: true },
        ],
    },
    outputs: { arity: 1 },
};
```

The validator accepts two or three inputs because `min` is `2` and `max` is
`3`. The `optional` flag records why the third parameter can be absent.

## Allowed Strings

Use `allowedStrings` for literal option arguments:

```ts
{ name: 'direction', classes: ['char'], allowedStrings: ['first', 'last'] }
```

The argument must be a [`CharString`](api-reference.md#charstring), and its
runtime `str` value must be one of the listed strings. String matching is exact
and case-sensitive unless the built-in implementation normalizes the value
before validation in a future extension.

## Identifier Parameters

Use `identifier: true` for parameters that must be valid MATLAB/Octave-like
identifier names:

```ts
{ name: 'field', classes: ['char'], identifier: true }
```

The current predicate accepts strings that match the regular expression
`^[A-Za-z_]\w*$`.

## Validation Flow

The built-in call path uses signatures in this order:

1. The interpreter resolves the callee to a
   [`NodeBuiltInFunction`](api-reference.md#nodebuiltinfunction).
2. `FunctionSignature.inputSignatures` normalizes `signature.inputs` to an
   array.
3. `inputArityIsValid` checks whether at least one input overload accepts the
   supplied input count.
4. Arguments that the built-in does not explicitly request unevaluated are
   evaluated by the interpreter.
5. `inputParametersAreValid` filters overloads by count and checks whether at
   least one matching overload accepts the evaluated values.
6. The registered `func` implementation is called.

If no input signature exists, the validator treats the arity or parameter check
as permissive. However, project tests expect registered built-ins to provide
both input and output signatures, so missing signatures should be considered
temporary or incomplete.

## Relation To `arguments` Blocks

Function signatures and MATLAB-like `arguments` blocks share the lower-level
validator vocabulary implemented by `FunctionValidation`. The signature system
is used for native built-ins registered by TypeScript code. The `arguments`
block system is used for MATLAB/Octave-like user-defined functions parsed from
source code.

The two systems differ in responsibility:

- Built-in signatures are static TypeScript metadata.
- `arguments` blocks are AST nodes parsed from user code.
- Built-in signatures validate already evaluated built-in arguments.
- `arguments` blocks can evaluate defaults, bounds, and validation callbacks in
  function-specific workspaces.

The shared validator names keep the behavior aligned where both systems express
the same predicate. For example, `mustBeNumeric`, `mustBeScalar`,
`mustBeFinite`, and similar `arguments` validators map to the same internal
validator names used by built-in signatures.

## Common Patterns

### Predicate Function

```ts
public static readonly isscalarSignature: BuiltInFunctionSignature = {
    inputs: { arity: 1, parameters: [{ name: 'value' }] },
    outputs: { arity: 1 },
};
```

Use this for predicates that accept any runtime value and return one logical
numeric result.

### Numeric Unary Function

```ts
const complexMapFunctionSignature: BuiltInFunctionSignature = {
    inputs: {
        arity: 1,
        parameters: [{ name: "value", classes: ["double"] }],
    },
    outputs: { arity: 1 },
};
```

This pattern is used when registering numeric map functions such as elementary
math operations.

### Numeric Binary Function

```ts
const complexTwoArgFunctionSignature: BuiltInFunctionSignature = {
    inputs: {
        arity: 2,
        parameters: [
            { name: "left", classes: ["double"] },
            { name: "right", classes: ["double"] },
        ],
    },
    outputs: { arity: 1 },
};
```

Use this for strict two-argument numeric functions.

### Reduction With Optional Dimension

```ts
public static readonly sumSignature: BuiltInFunctionSignature = {
    inputs: {
        arity: -2,
        min: 1,
        max: 2,
        parameters: [
            { name: 'value' },
            {
                name: 'dimension',
                classes: ['double'],
                validators: ['dimension', 'positive'],
                optional: true,
            },
        ],
    },
    outputs: { arity: 1 },
};
```

This pattern is shared by `all`, `any`, `sum`, `prod`, `sumsq`, `cumsum`,
`cumprod`, `mean`, and related functions.

### Multiple Overloads With Different Parameter Semantics

```ts
public static readonly varianceSignature: BuiltInFunctionSignature = {
    inputs: [
        { arity: 1, parameters: [{ name: 'value' }] },
        {
            arity: 2,
            parameters: [
                { name: 'value' },
                {
                    name: 'flagOrDimension',
                    classes: ['double'],
                    alternatives: [
                        { name: 'flag', validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                        { name: 'dimension', validators: ['dimensionGreaterThanOne'] },
                    ],
                },
            ],
        },
        {
            arity: 3,
            parameters: [
                { name: 'value' },
                { name: 'flag', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
            ],
        },
    ],
    outputs: { arity: 1 },
};
```

Use overload arrays when different argument counts or positions have different
meanings.

## Maintenance Checklist

When adding or updating a built-in:

1. Define a `public static readonly <name>Signature` near the implementation.
2. Use `BuiltInFunctionSignature` as the signature type.
3. Describe every accepted input count with `inputs`.
4. Describe every accepted output count with `outputs`.
5. Add parameter records for every value that can be checked generically.
6. Prefer declarative `classes`, `validators`, `allowedStrings`, and
   `identifier` checks over ad hoc implementation checks when the rule is local
   to one argument.
7. Keep implementation checks for cross-argument relationships, computed
   constraints, or behaviors not represented by the signature vocabulary.
8. Register the implementation and signature together in the module's
   `functions` table.
9. Run the signature coverage tests after changing registration metadata.

The most relevant test is:

```sh
npm run test:function-infrastructure
```

For broader validation, use the unit-test and build scripts normally used by
the project release flow.

## Current Limitations

The signature format is deliberately conservative. It does not yet express:

- return value types;
- relationships between two or more arguments;
- complete validation of repeated pairs or groups;
- case-insensitive string options;
- argument-dependent output arity;
- external file resolution behavior;
- user-defined class hierarchies beyond the runtime classes currently
  recognized by `FunctionValidation`.

These rules should remain in the built-in implementation until the shared
signature model grows a stable representation for them. This keeps the
declarative layer reliable without forcing function-specific behavior into a
format that cannot yet express it accurately.
