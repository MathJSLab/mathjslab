# Numeric Array Model

MathJSLab numeric behavior is built on two related abstractions: complex
numbers and multidimensional arrays.

## Complex Values

The `Complex` facade delegates to the configured backend. The number backend
uses JavaScript numbers, while the decimal backend uses arbitrary-precision
decimal values where supported.

Code that accepts complex values should use the facade operations instead of
direct arithmetic. This keeps real, imaginary, logical, precision, comparison,
and formatting behavior consistent across backends.

## MultiArray Storage

`MultiArray` represents MATLAB-style arrays using column-major semantics. The
logical shape is stored in `dimension`, while physical storage uses nested
JavaScript arrays optimized around the first two dimensions plus page-like
extensions for higher ranks.

Important contracts:

- public indexing follows MATLAB-style one-based semantics where applicable;
- internal loops usually use zero-based indices;
- linear indexing is column-major;
- scalar expansion and broadcasting must be explicit in the helper being used;
- assignment may mutate the target array in place;
- cell arrays and structures use the same outer container but different element
  contracts.

## BLAS and LAPACK Boundaries

`BLAS` and `LAPACK` functions generally operate on raw `ComplexType[][]`
storage or `MultiArray` wrappers. Tests should verify both the numeric result
and the shape contract because many regressions in linear algebra code are
shape regressions rather than arithmetic regressions.

When a routine intentionally mutates input storage, the JSDoc and tests should
say so. When a routine copies input before factorization or solving, tests
should protect that non-mutation contract.
