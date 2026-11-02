# Educational mathematical library: polynomial and sampled-data operations

This increment is motivated by existing application examples, rather than a
claim of complete MATLAB/Octave coverage. The modules share the selected
`Complex` backend and never downcast coefficients, sample values or spacings to
JavaScript number. Loop counts and native dimensions use number indices.

| Existing application example                               | Library operation and regression                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `programming/functions/horner-polynomial-function.m`       | `polyval([2,-3,0,5],[0,1,2])` gives `[5,4,9]`.                                                 |
| `programming/algorithms/polynomial-long-division.m`        | `conv([1,-1],[1,-2])` reconstructs `[1,-3,2]`.                                                 |
| `numerical-methods/calculus/centered-derivative.m`         | `polyder(p)` supplies the analytic polynomial derivative for finite-difference comparison.     |
| `numerical-methods/calculus/trapezoidal-integration.m`     | `trapz(x,x.^2)` replaces the manual weighted sum.                                              |
| `numerical-methods/calculus/romberg-first-extrapolation.m` | Two `trapz` resolutions produce the first extrapolation; `cumtrapz` exposes the partial areas. |

## Polynomial contracts

- `polyval(p,x)` applies Horner evaluation with descending-power coefficients.
  `p` is a numeric scalar, row or column vector; complex coefficients are
  supported. `x` may have any native numeric shape, including N-D and empty
  arrays; its shape is preserved. An empty polynomial evaluates to zero.
  Constant polynomials return their constant even at Inf/NaN points. Matrix
  polynomial evaluation, fit statistics, centering/scaling arguments and error
  estimates are not included; extra inputs/outputs are rejected.
- `polyder(p)` differentiates one coefficient vector and returns a row vector
  (or a native scalar for one coefficient). Leading exact zeros are removed.
  Empty/constant input yields zero. Product/quotient two-input forms and paired
  outputs are rejected in this subset.
- `conv(u,v[,shape])` performs direct linear convolution, including complex
  values. Shapes are exactly `full` (default), `same`, or `valid`. The full
  result is a row unless both inputs are columns, following the MATLAB R2026a
  orientation policy; cropped forms follow `u`. This differs from older MATLAB
  versions and some Octave orientation cases. `same` starts at the zero-based
  full-result offset `floor(length(v)/2)` and has `length(u)` entries. `valid`
  starts at `length(v)-1` and has `max(length(u)-length(v)+1,0)` entries. An
  empty second input gives an empty full result, and zeros of `length(u)` in
  cropped forms. The result does not trim leading/trailing polynomial zeros.
  Matrix/N-D convolution, circular convolution and FFT acceleration are outside
  this increment.

No algebraic reordering, fused multiply-add, class protocol callback or new
automatic precision policy is introduced. IEEE special values propagate through
performed operations; neither zero coefficients nor zero widths suppress NaNs.

## Sampled integration contracts

`trapz(Y)`, `trapz(X,Y)`, `trapz(Y,dim)` and `trapz(X,Y,dim)` use trapezoidal
panels; `cumtrapz` accepts the same forms and exposes cumulative sums. `Y` is a
numeric scalar or native numeric array, with complex values allowed. The
default dimension is the first whose size is not one (dimension 1 if all are
singleton). Explicit dimensions are restricted to `1:ndims(Y)`; larger
dimensions, matrix coordinates and dimension vectors are explicitly rejected.

Omitted X means unit spacing. Scalar X specifies spacing; otherwise it must be
a row/column coordinate vector matching the selected axis. Coordinates must be
finite and real; descending and repeated coordinates are accepted, giving
signed and zero-width panels. With two inputs, a scalar second argument and a
nonscalar first argument select `Y,dim`; other two-input calls select `X,Y`.
Use three arguments to disambiguate scalar observations.

`trapz` reduces the selected axis to size one; `cumtrapz` retains the input
shape and initializes each nonempty slice with zero. A zero- or one-element
slice has zero total area. Other empty dimensions remain empty: for example,
`trapz(zeros(0,3))` is `[0,0,0]`, `trapz([])` has shape `[1,0]`, and cumulative
empty arrays retain their shape. Endpoints are divided by two before addition
to avoid an avoidable overflow when both are large finite samples. Very tiny
subnormal endpoints can still underflow on the number backend. There is no
missing-value omission or compensated summation policy.

All five functions return one output, preserve their inputs, and execute as
indivisible numeric kernels. Argument evaluation uses the existing retained
machine: arguments with waits execute once, and cancelling during an argument
wait leaves its pending assignment untouched. Completed effects are not rolled
back. These functions do not accept an integrand callback and are not adaptive
quadrature.

## Verification and reference scope

`EducationalMath.spec.ts` checks both backends, known coefficients and panel
areas, complex values, N-D/empty shapes, decimal observations below binary64
resolution, argument order and cancellation. `educational-math-cycle.m` checks
the public language against the installed tarball in Node/browser Workers and
application/Markdown adapters. The selected Horner, trapezoidal and Romberg
application examples are also executed unchanged in all three locales.

The contract was checked against the primary references for
[polyval](https://www.mathworks.com/help/matlab/ref/polyval.html),
[polyder](https://www.mathworks.com/help/matlab/ref/polyder.html),
[conv](https://www.mathworks.com/help/matlab/ref/conv.html),
[trapz](https://www.mathworks.com/help/matlab/ref/trapz.html), and
[cumtrapz](https://www.mathworks.com/help/matlab/ref/cumtrapz.html). Documented
subsets, empty behavior and dimension restrictions above take precedence over
any inference of full compatibility. Algorithms are independently implemented
from Horner, discrete convolution and trapezoidal formulas.
