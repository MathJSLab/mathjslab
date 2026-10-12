# Numeric sequence compatibility

This increment covers numeric and logical discrete differences and cumulative
operations, plus numeric sum/product reductions (including global and slice
reductions), using the existing complex backend and column-major array model,
plus scalar-axis arithmetic means. Direct calls, `feval`, `builtin`,
synchronous execution and asynchronous sessions use the same core functions.

## Supported contract

| Call                                                                       | Semantics                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `diff(A)`                                                                  | Adjacent differences along the first axis whose size is not 1; scalar input selects axis 1. |
| `diff(A,n)`                                                                | Repeat differences `n` times along that same axis.                                          |
| `diff(A,n,dim)`                                                            | Use the positive integer scalar axis `dim`.                                                 |
| `cumsum(A)` / `cumprod(A)`                                                 | Prefix accumulation along the first non-singleton axis.                                     |
| `cumsum(A,dim)` / `cumprod(A,dim)`                                         | Prefix accumulation along `dim`.                                                            |
| `cumsum(A,"reverse")` / `cumprod(A,"reverse")`                             | Suffix accumulation, keeping the original element positions.                                |
| `cumsum(A,dim,"forward"/"reverse")` / `cumprod(A,dim,"forward"/"reverse")` | Explicit axis and direction.                                                                |

`diff` accepts a finite, real, nonnegative integer scalar order; an empty
numeric order `[]` means 1. Order zero returns an independent copy, preserving
its input type. Dimensions must be finite, real, positive integer scalars.
Direction strings are exactly `forward` and `reverse`, and must follow the
dimension if both are supplied. Invalid controls and unsupported input kinds
raise evaluation errors; their messages do not reproduce MATLAB/Octave
diagnostics verbatim.

For differences, the selected axis shrinks to `max(size(A,dim)-n,0)`; other
axes retain their sizes, including zeros. A dimension above the input rank has
implicit size 1, so a positive order produces an empty axis there. Cumulative
operations retain the input shape; axes above its rank act as singleton axes.
Inputs are not mutated. Logical differences and accumulations produce numeric
values, including singleton accumulations (order-zero `diff` retains its input
type). Complex values are supported and NaNs propagate through affected
differences/accumulations by default.

## Dialect choices and boundaries

The high-order, two-argument `diff` contract follows
[MATLAB R2025a and later](https://www.mathworks.com/help/matlab/ref/double.diff.html):
it stays on the initially selected axis. Current
[Octave](https://docs.octave.org/latest/Finding-Elements-and-Checking-Conditions.html)
cascades to subsequent non-singleton axes when the order exceeds that axis. Use
an explicit dimension for portable high-order examples. Order zero is an Octave
extension; MATLAB documents positive orders or an empty default order.

Direction and logical promotion follow the documented
[MATLAB cumsum](https://www.mathworks.com/help/matlab/ref/double.cumsum.html),
[MATLAB cumprod](https://www.mathworks.com/help/matlab/ref/double.cumprod.html)
and
[Octave sums/products](https://docs.octave.org/latest/Sums-and-Products.html)
contracts within this numeric subset. MathJSLab retains its numeric backend;
this does not promise bitwise agreement with MATLAB machine arithmetic.
Integer/single storage classes, native accumulation flags, vector dimensions,
`all`, character/cell/structure/class inputs, symbolic differentiation and
class overloads are outside this increment.

## Explicit NaN accumulation

Both functions accept `f(A,nanflag)`, `f(A,dim,nanflag)`,
`f(A,direction,nanflag)` and `f(A,dim,direction,nanflag)`, where `f` is
`cumsum` or `cumprod`. The exact flags are `includenan` (default) and
`omitnan`. Dimension precedes direction, and the NaN flag comes last. Repeated
options, reversed option order and unknown flags raise evaluation errors,
including on empty inputs. The bounded four-input signatures make
`nargin("cumsum")` and `nargin("cumprod")` report -4.

With inclusion, a NaN contaminates the remainder of the traversed line. With
omission, a value with NaN in either complex component is skipped as one whole
value. Each output position remains present and receives the current
accumulator. Leading missing values yield 0 for sums and 1 for products; an
entirely missing line therefore yields all zeros or all ones. In reverse
direction, these rules start from the last element. Singleton axes and axes
above the rank still replace omitted NaNs with that identity. Empty shapes and
numeric promotion of logical inputs are preserved. No input values are changed,
and omitted positions receive independent copies of the accumulator. Omission
concerns input NaNs only: arithmetic such as `Inf + -Inf` can produce a NaN
that remains in subsequent results.

These identities match the MATLAB references linked above. The Octave 11.1
manual says entirely NaN lines still produce NaNs under omission. However, the
published
[Octave cumulative kernels](https://docs.octave.org/doxygen/stable/d5/d5b/mx-inlines_8cc_source.html)
initialize omitted leading values with 0/1, consistent with our chosen
contract. This is a discrepancy between Octave's manual and source, not an
assertion about every installed Octave version. Its
[core tests](https://docs.octave.org/doxygen/11/d4/d05/data_8cc_source.html)
also accept NaN flags before direction; this increment deliberately supports
only the canonical dimension/direction/NaN-flag order above. MATLAB's
`omitmissing`/`includemissing` are numeric aliases added in the stabilization
follow-up. Cumulative vector dimensions and `all` remain unsupported.
Statistical reductions `var` and `std` remain outside these increments;
arithmetic `mean` is covered below.

## Explicit NaN sum/product reductions

`sum` and `prod` accept `f(A)`, `f(A,dim)`, `f(A,nanflag)` and
`f(A,dim,nanflag)`. Dimensions are finite real positive integer scalars; flags
are exactly `includenan` (default) and `omitnan`, after the dimension when
present. Repeated flags and unknown options are errors, even for empty inputs.
Both signatures report `nargin` -3 and one output.

The shared numeric accumulator applies the same whole-complex-value NaN
omission rule as cumulative operations. Each line becomes one result; its
operating axis shrinks to length 1. A line with no remaining values uses 0 for
`sum` and 1 for `prod`. NaNs generated by arithmetic are retained. The default
axis is the first whose size is not 1, including size-zero axes. The default
0-by-0 `[]` input returns the scalar identity; an explicit axis instead follows
normal shape reduction (`sum([],1)` is 1-by-0). Reducing a size-zero axis can
therefore produce a nonempty array of independent identities, while other
size-zero axes remain empty. Axes beyond the rank act as singleton axes: values
keep their positions, with omitted NaNs replaced by the identity and logical
values promoted to numeric double. Inputs are never mutated or returned by
alias. Singleton lines copy values directly, preserving complex infinities
without introducing NaNs through multiplication by the identity.

These numeric contracts follow
[MATLAB sum](https://www.mathworks.com/help/matlab/ref/double.sum.html),
[MATLAB prod](https://www.mathworks.com/help/matlab/ref/double.prod.html) and
the Octave sums/products reference above. The Octave cumulative all-NaN manual
caveat discussed earlier does not define our reduction semantics. MATLAB
nonnumeric missing values, output-type flags (`native`, `double`, `default`),
Octave `extra`, character inputs, object overloads, integer/single storage
classes and Variance/standard-deviation NaN contracts are covered below. MATLAB
`sum` accepts character inputs; this supported subset does not. Existing
numeric backends and column-major traversal are retained, without promising
bitwise floating point agreement with native MATLAB/Octave.

Three `nan-reduction*.m` fixtures check missing matrix measurements, empty-line
identities and shapes, N-D page reductions, logical promotion and complex
omissions through synchronous/public runtime APIs and a real Node Worker.
`ReductionNaNCompatibility.spec.ts` additionally verifies invalid options, both
backends, indirect calls, independent storage, suspended argument order and
recovery after an invalid call.

## Global sum/product reductions

Numeric/logical `sum(A,"all")` and `prod(A,"all")` return one scalar across
every dimension. An optional final `includenan`/`omitnan` flag uses the same
omission and identity rules as axis reductions. The selector must precede the
NaN flag and replaces the dimension; duplicate selectors, mixed
dimension/selector arguments and unsupported options are errors, even when the
input is empty. Signatures still accept at most three inputs and report
`nargin` -3.

Global reductions reshape into one column and reuse the existing reduction
kernel: traversal is column-major, equivalent to `f(A(:),nanflag)` within the
current numeric backend. Empty arrays of any shape return 0 for `sum` and 1 for
`prod`; entirely omitted values use those same identities. Logical values
produce numeric results. Scalars retain the existing copy and promotion
semantics, including complex infinities. Input dimensions, values and storage
remain untouched.

The MATLAB sum/prod references above document the scalar global contract,
introduced in R2018b. Octave 11.1 documents the same selector for both
reductions; its sum paragraph says equivalence to `cumsum(x(:))`, despite
describing a sum over all elements. We follow the scalar reduction contract,
not that inconsistent cumulative reference. This is a documentation
discrepancy, not a claim from executing a native Octave installation.
Output-type flags, nonnumeric missing values, character/class inputs and global
selectors in other reductions/cumulative operations remain outside this
increment.

Three `global-*.m` fixtures model measurement totals/counts, page-wise products
and empty/all-missing identities. They run through the synchronous interpreter,
public runtime and real Node Worker. `GlobalReductionCompatibility.spec.ts`
checks both numeric backends, column-major order, scalar result shapes,
independent storage, complex NaNs and infinities, invalid controls, indirect
calls, suspended argument order, output suppression, recovery and session
isolation.

## Vector-dimension sum/product reductions

`sum(A,vecdim)` and `prod(A,vecdim)` accept a nonempty row or column vector of
finite real positive integers, with an optional final `includenan`/`omitnan`
flag. Scalar dimensions keep the existing behavior. Repeated dimensions are
errors, including repeats beyond the input rank. Empty selectors, matrices, N-D
selectors, cells, complex/noninteger values and mixed selector/options are
errors, including for empty inputs. Dimensions above the input rank are
ignored. If all selected axes are beyond the rank, each value is copied, with
logical promotion and omitted NaN replacement; the input shape is retained.
Signatures remain bounded to three inputs.

Each selected in-rank axis becomes size 1; unselected axes retain their sizes
and positions. Trailing singleton axes follow the existing array normalization.
Reducing a selected zero-size axis creates independent 0/1 identities for the
remaining slices. Unselected zero-size axes remain empty. Thus
`sum(zeros(0,3,2),[1,3])` is a 1-by-3 zero row, whereas
`sum(zeros(2,0,3),[1,3])` is 1-by-0. Selecting every axis is equivalent to
`"all"`, including empty and all-missing inputs.

The selector is sorted without modifying its storage. Selected axes are grouped
first using the existing permutation machinery, with the lowest source axis
varying fastest; each slice becomes one column for the shared line reduction
kernel. Results are reshaped and inversely permuted. Changing vector order or
row/column orientation does not change traversal or results. This is one
column-major fold per slice, not sequential reductions over axes:
`sum([Inf,1;-Inf,2],[1,2],"omitnan")` remains NaN rather than dropping an
intermediate NaN. The whole-complex omission rule, logical promotion, singleton
infinity handling and input immutability are preserved.

MATLAB's sum/prod references specify the slice shapes and vector controls.
Octave's sums/products reference explicitly specifies non-repeating dimensions
and ignores dimensions above `ndims`. We adopt those same explicit rules. The
MATLAB reference does not enumerate all invalid-selector cases; our
nonempty/unique row-or-column contract makes them unambiguous. Neither manual
provides a portable bitwise floating point accumulation order across all
execution targets; the deterministic fold above is MathJSLab's contract.
Existing MATLAB nonnumeric missing values, machine storage/output-type flags,
Octave `extra`, character/object inputs and further cumulative extensions
remain outside this increment. No native MATLAB or Octave process is launched
by these tests.

Three `vector-*.m` fixtures cover page totals, reductions across pages and
empty/missing slice identities through the synchronous interpreter, public
runtime and real Node Worker. `VectorReductionCompatibility.spec.ts` adds 4-D
shapes, unordered/column selectors, ignored dimensions, invalid selectors,
complex/logical values, both arithmetic backends, generated NaNs, independent
storage and suspended arguments with recovery/session isolation.

The reused permutation kernel now treats normalized trailing singleton
subscripts as 1. Reshape only reuses physical storage when both row and column
counts remain unchanged. Direct regressions cover these shared fixes.

## Explicit NaN arithmetic means

`mean(A)`, `mean(A,dim)`, `mean(A,nanflag)` and `mean(A,dim,nanflag)` support
numeric/logical inputs. These are the scalar-axis forms; grouped forms are
documented below. Dimensions are finite real positive integer scalars; the
exact flags are `includenan` (default) and `omitnan`, after the dimension if
supplied. Repeated, reversed or unknown options are errors, including for empty
arrays. The bounded signature reports `nargin("mean")` -3 and one output.

The default axis is the first size different from 1, including zero-size axes.
The selected in-rank axis becomes size 1; other axes retain their sizes.
Default 0-by-0 `[]` returns scalar NaN, whereas `mean([],1)` is 1-by-0. A
selected zero-size axis creates independent NaNs for its empty lines; an
unselected zero-size axis keeps the result empty. Singleton and above-rank axes
retain shape and values, promote logical values to numeric double, and return
independent storage.

Mean uses the same line-sum kernel as the numeric reductions, plus a separate
per-line count of original input values. Inclusion counts every input value;
omission excludes a whole complex value if either component is NaN. The total
is divided by its line's count; zero valid values produce the canonical real
NaN, not the 0/1 identities used by sum/product. Thus columns with different
numbers of missing measurements have different denominators. NaNs generated
during summation remain in the mean. Complex singleton infinities retain their
other component because real-count division works component-wise. No input
values, dimensions or storage are modified.

These arithmetic/default-inclusion/all-missing contracts follow
[MATLAB mean](https://www.mathworks.com/help/matlab/ref/double.mean.html) and
[Octave descriptive statistics](https://docs.octave.org/latest/Descriptive-Statistics.html).
Both dialects support grouped dimensions and richer output/weight controls. The
grouped dimension contract is documented below. The supported inclusion default
and all-missing NaN result agree between the dialects. MATLAB exposes
missing/NaT aliases and named weights; Octave documents option/value weights.
Numeric missing aliases are supported as described below. NaT aliases and
output-type flags, weights, datetime/duration/table/character/object inputs
remain outside this mean contract; scalar-axis var/std are covered below.
Diagnostic text and bitwise agreement with native floating point backends are
not promised. The existing deterministic column-major sum order and
number/decimal backend choices are retained. No native MATLAB/Octave executable
is invoked by tests.

Three `nan-mean-*.m` fixtures cover sensor columns with different valid counts,
page-wise means and empty/complex cases. They run through the synchronous API,
public runtime and a real Node Worker. `MeanNaNCompatibility.spec.ts`
additionally checks singleton/above-rank axes, generated NaNs, logical
promotion, invalid options, both backends, independent storage and resumed
argument evaluation, output suppression, recovery and session isolation.

## Explicit NaN variance and standard deviation

For either function F = var/std, the supported calls are F(A), F(A,w),
F(A,nanflag), F(A,w,nanflag), F(A,w,dim) and F(A,w,dim,nanflag). Here w is a
finite real scalar 0 (default, divisor N-1) or 1 (divisor N), dim is a finite
positive integer scalar, and nanflag is exactly includenan (default) or
omitnan. Dimension requires an explicit normalization. The former mathjslab
shorthand F(A,2) is now rejected; use F(A,0,2). Empty normalization
placeholders are outside this scalar-normalization contract. Both bounded
signatures report nargin -4 and nargout 1.

N is the original valid observation count in each slice. Omission removes an
entire complex observation when either component is NaN. No observations
produce real NaN; one finite observation produces numeric zero under either
normalization. Included NaNs and any retained infinity produce NaN, including
singleton/above-rank slices. Complex variance uses squared absolute deviations
and is real; std is its square root. Logical inputs promote to numeric double.

The shared driver visits slices and observations in deterministic column-major
order, using the existing line-sum kernel and Complex operations on the
selected number/decimal backend. A shifted two-pass algorithm subtracts the
first valid observation, averages those offsets, then sums squared absolute
deviations from the offset mean. This avoids cancellation from subtracting two
large moments, reduces loss of small dispersion around large offsets, and
avoids overflowing the mean of identical finite 1e308 values. It is not an
arbitrary-range or compensated accumulator: finite offsets, their sums or
squares can still overflow on the number backend; std intentionally follows the
shared variance result. Backend precision is retained, not bitwise agreement
with native implementations.

Shapes follow scalar-axis mean: the default is the first size different from 1,
including zero; a selected in-rank axis becomes 1. Default [] returns scalar
NaN, explicit F([],0,1) is 1-by-0, selected empty lines produce independent
NaNs, and unselected zero axes retain empty results. Singleton/above-rank axes
retain shape with zero for finite observations and NaN otherwise. Inputs are
not mutated or aliased. Argument evaluation, suspension and output suppression
use the shared execution drivers without re-evaluation.

References audited on 2026-10-12:
[MATLAB var](https://www.mathworks.com/help/matlab/ref/double.var.html),
[MATLAB std](https://www.mathworks.com/help/matlab/ref/double.std.html),
[Octave 11.1 statistics](https://docs.octave.org/latest/Descriptive-Statistics.html)
and the
[Octave var implementation](https://github.com/gnu-octave/octave/blob/default/scripts/statistics/var.m).
The dialects agree on the divisors and inclusion default. Octave's prose labels
N-1 as population and N as sample; this guide uses the conventional sample
(N-1) and population (N) terminology and makes the formulas authoritative.
MATLAB defines its default axis using size different from 1; Octave's
implementation uses size greater than 1 and returns scalar NaN for default
two-dimensional empty inputs, even shaped empties. Mathjslab follows the MATLAB
shape contract above. Octave permits case-insensitive/reordered string options
and accepts only floating point data in its var implementation; mathjslab keeps
canonical option order, exact flags and numeric/logical promotion. MATLAB has
numeric missing aliases, now supported as described below. Empty normalization
placeholders remain unsupported.

Vector/array weights, output-type options, weighted mean outputs, nonnumeric
inputs and extensions to other reductions remain unsupported. Three
nan-dispersion-*.m fixtures cover unequal valid counts, page reductions,
complex data and large-offset stability through the synchronous API, public
runtime and real Node Worker. Regressions cover invalid controls, both
backends, independent storage, resumed argument effects once, recovery and
session isolation. No native MATLAB/Octave executable is invoked.

## Grouped statistics: all and vector dimensions

The scalar forms above remain supported. Additional forms are mean(A,selection)
and mean(A,selection,nanflag), or F(A,w,selection) and F(A,w,selection,nanflag)
for F = var/std. Selection is exactly "all" or a nonempty row/column vector of
distinct finite positive integer dimensions (including a scalar). W remains
explicitly required before a selection in var/std; their empty W placeholders,
dimension shorthand and F(A,"all") are unsupported. Nargin remains -3 for mean
and -4 for var/std; nargout is 1.

Each selected in-rank dimension becomes size 1 and all other dimensions retain
their sizes. Trailing singleton dimensions follow the existing normalization.
Dimensions above the rank are ignored, but all dimensions are validated first:
repeated high dimensions also fail. If only high dimensions are selected, the
existing singleton contracts apply independently to each input observation. All
reduces every original observation in column-major order and returns a scalar,
including NaN for any empty input. Selecting all in-rank dimensions has the
same result. A selected empty dimension produces NaN for each existing group;
an unselected zero dimension leaves an empty result. For example,
mean(zeros(2,0,3),[2,3]) is a 2-by-1 column of NaNs, while selection [1,3]
returns 1-by-0. Invalid controls are rejected even for empty inputs.

One grouping helper is shared by sum/prod/mean/var/std: it sorts selected axes,
permutes them before the remaining axes, flattens each complete slice to one
column, reduces once, then restores dimension order. Sorting makes [3,1] and
[1,3] visit observations in the same original column-major order. No means or
variances of partial groups are combined. Mean sums original observations and
counts valid values per group. Variance applies its shifted two-pass algorithm
to the complete valid group; std takes that real variance's square root.
Complex NaN omission, logical promotion, generated NaN propagation and
independent result storage retain the scalar contracts. The selected
number/decimal backend retains its precision and overflow limits; no bitwise
native parity is promised.

Official references audited on 2026-10-12:
[MATLAB mean](https://www.mathworks.com/help/matlab/ref/double.mean.html),
[MATLAB var](https://www.mathworks.com/help/matlab/ref/double.var.html),
[MATLAB std](https://www.mathworks.com/help/matlab/ref/double.std.html) and
[Octave 11.1 statistics](https://docs.octave.org/latest/Descriptive-Statistics.html).
Both dialects describe page-wise vecdim and global all reductions. Octave
explicitly ignores dimensions above ndims. Mathjslab keeps the canonical
normalization-before-selection forms documented for MATLAB variance/std. Octave
also accepts all without W, case-insensitive and reordered options; mathjslab
deliberately rejects these. Shaped-empty defaults, logical promotion and
nonnumeric missing values retain the differences documented above. Octave's
default axis code can overwrite variance with zero when omission leaves one
infinity; its explicit-axis branch restores NaN. Mathjslab consistently returns
NaN whenever a dispersion group retains a nonfinite observation.

Three statistics-*.m fixtures cover page statistics, nonconsecutive axes in
four dimensions, unequal missing counts and global statistics. They run through
the synchronous API, public runtime and a real Node Worker.
GroupedStatisticsCompatibility regressions also cover both backends,
input/dimension storage, suspension in all control arguments, effects once,
output suppression, error recovery and session isolation. Earlier scalar-only
rejection tests now reject repeated dimensions/options instead; accepted scalar
calls and their arities are unchanged.

### Publication readiness boundaries

This block does not implement weights, output-type options, nonnumeric missing
values, weighted mean outputs or other statistical functions. These are
explicit scope boundaries, not accidental fallback behavior. Number-backend
offset sums/squares can still overflow at extreme ranges, and std intentionally
follows var.

Before declaring the broader block ready for publication, run the complete unit
and integration suites on the release candidate, verify npm package contents
and export/declaration resolution from an installed tarball, and exercise a
real browser Worker locally. Remote CI on supported platforms is optional. The
current targeted runtime verification uses a real Node Worker. The original
increment did not perform native differential execution; versioned Octave
Online checks now cover selected cases; reference-derived fixtures document
semantics rather than prove native parity. Review the intentional dialect
restrictions and existing resumable-runtime boundaries before setting release
scope. No publication or version change occurs in this increment.

## Verification

Small portable fixtures in `test/compatibility/fixtures` cover sampled
positions/velocity/acceleration, explicit matrix and page axes, and suffix
sums/products. Three additional `nan-accumulation*.m` fixtures cover missing
measurements, separate matrix/page accumulators, all-missing identities and
complex omissions. They run through `Interpreter`, the public in-process
runtime and a real Node Worker. `NumericSequenceCompatibility.spec.ts`
separately checks dialect choices, empty shapes, complex/logical data, invalid
controls, NaN propagation and indirect calls.
`CumulativeNaNCompatibility.spec.ts` adds option validation, both numeric
backends, storage independence, resumed argument order and runtime recovery
after invalid options. Expectations are derived from the linked references;
these tests do not launch MATLAB or Octave.

## Installed-package stabilization

`npm run test:release` packs the built package and installs it into a fresh
consumer under ignored `test-results`. It checks every export target and
compiles all typed public entries with strict declaration checking
(`skipLibCheck: false`). It executes the installed Node runtime in a real
Worker and serves installed browser bundles to native Chromium module Workers.
Browser checks cover the three statistics fixtures, suspended controls, six
unreplayed effects, suppression, error recovery, isolation and reset. The page
resolves `mathjslab/core` with an import map; Workers use the distributed
relative import. Set `MATHJSLAB_BROWSER_EXECUTABLE` for a nonstandard Chromium
installation.

Local validation passed 1,582 unit tests in 70 suites and all integration
projects: 9 architecture, 756 compatibility, 208 parser-fixture, 11
function-infrastructure, 5 package-source and 40 m-file tests. Installed
declarations and Node/Chrome 154 Workers passed. The new Windows/Linux Node 22
workflow repeats source, bundle and installed-package gates; remote execution
remains pending. MATLAB/Octave were unavailable on PATH, so native differential
verification remains pending. No publication or version change was performed.

## Numeric missing aliases and native differential checks

The seven numeric functions sum, prod, cumsum, cumprod, mean, var and std now
accept `includemissing` and `omitmissing` in exactly the positions occupied by
their existing NaN flags. Inclusion is unchanged; omission skips a whole
complex observation if either component is NaN. Duplicate aliases or mixed
old/new flags are rejected; case sensitivity, argument limits,
direction/selection/normalization order and defaults are unchanged. Aliases
share the existing numeric kernels and do not add NaT, NA, strings, tables,
weights or output-type controls. MATLAB introduced the general missing flags in
R2023a; see [sum](https://www.mathworks.com/help/matlab/ref/double.sum.html),
[cumsum](https://www.mathworks.com/help/matlab/ref/double.cumsum.html),
[mean](https://www.mathworks.com/help/matlab/ref/double.mean.html),
[var](https://www.mathworks.com/help/matlab/ref/double.var.html) and
[std](https://www.mathworks.com/help/matlab/ref/double.std.html).

On 2026-10-12, the anonymous [Octave Online](https://octave-online.net/)
session reported GNU Octave 9.3.0. Native commands confirmed mean([1 NaN
3],"omitnan") = 2, var(...,0,"omitnan") = 2, std(...,1,"omitnan") = 1,
mean(reshape(1:8,[2 2 2]),[1 3]) = [3.5 5.5] and var(...,0,[1 3]) = [17/3 17/3]
(displayed as 5.6667). That version rejected mean(...,"omitmissing") and
sum(...,"omitnan"). Thus aliases deliberately follow MATLAB, not Octave 9.3;
Octave latest descriptive-statistics documentation also lists NaN flags,
without missing aliases. These bounded native checks do not prove complete
dialect parity.

Remote CI is optional by maintainer decision; local source, package and native
Worker gates remain the release checks. The workflow is available for future
use and its unexecuted remote matrix is not a publication blocker.

The complete compatibility suite passed 821 tests in 12 suites. The alias
follow-up passed 65 focused regressions (including both numeric backends), 51
CoreFunctions/MultiArray tests, 9 architecture checks, production/ES2015 types,
declaration generation, lint and circular-dependency checks. All 11 production
bundles built and 32 bundle tests passed. A newly packed and installed consumer
passed export targets, strict declarations, CommonJS loading and real
Node/Chrome 154 Worker checks, including the alias fixture. Ignored release
consumers are excluded from Jest discovery and all relevant TypeScript projects
so repeated release gates do not contaminate later source checks.

## Paired dispersion and mean outputs

Every supported var/std call now accepts zero, one or two requested outputs:
`[V,M]=var(...)` and `[S,M]=std(...)`. The existing scalar 0/1 normalization,
scalar/vector dimensions, "all" and four missing flags retain their canonical
positions. No weights, W=[], output-type controls or broader inputs are added.
`nargout("var")` and `nargout("std")` now report -2, following the bounded
optional-output convention used by sort. Requesting three outputs is an error;
discarded outputs with `~`, feval and builtin use the shared return-list
machinery. Direct `CoreFunctions.variance`/`std` still return only the first
numeric value.

A single grouping pass restores both outputs to the same shape. Each line
selects original valid observations once. Finite lines retain the shifted
two-pass variance: subtract the first valid observation, accumulate the offset
mean, and use squared magnitudes of centered offsets. The returned mean is
origin plus offset mean; it is not used to recompute deviations after rounding.
Normalization affects dispersion only. Finite singleton means are promoted
copies; empty/all-missing lines return two NaNs. Retained infinities make
dispersion NaN while their arithmetic mean may be infinite or NaN. Complex
means remain complex and dispersion remains real. Existing extreme-range
overflow limitations persist; paired means can differ in final rounding from a
separate mean call because mean retains its original sum kernel. Inputs and
output arrays do not share writable storage.

The paired output contract agrees with
[MATLAB var](https://www.mathworks.com/help/matlab/ref/double.var.html),
[MATLAB std](https://www.mathworks.com/help/matlab/ref/double.std.html) and
[Octave 9.3 descriptive statistics](https://docs.octave.org/v9.3.0/Descriptive-Statistics.html).
Previously documented option-order, logical input, missing-alias and
empty-shape dialect boundaries remain. No native MATLAB parity claim is made.
The shared grouping helper now maps a tuple of reduced arrays, so sum/prod/mean
keep their existing single-result adapters. Both runtime drivers use the same
bounded return-list and numerical implementations.

On 2026-10-12, native Octave Online 9.3.0 confirmed the paired results: var([1
NaN 3],0,"omitnan") returned [V,M]=[2,2]; std(...,1,"omitnan") returned
[S,M]=[1,2]; var(reshape(1:8,[2 2 2]),0,[1 3]) returned variance [17/3,17/3]
(displayed rounded) and mean [3.5,5.5]; var([Inf 2]) returned NaN and Inf;
var([1+i 3+3i]) returned 4 and 2+2i. Native nargout("var") reported 2.
MathJSLab intentionally reports -2 under its existing bounded optional-output
metadata convention; numeric result agreement does not imply introspection
parity.

Paired-output validation passed 863 compatibility tests (13 suites), including
42 new regressions; 51 CoreFunctions/MultiArray tests; 9 architecture checks;
production and ES2015 types; declaration generation; lint, formatting and
circular-dependency checks. All 11 production bundles built and 32 bundle tests
passed. The installed-tarball gate passed strict public declarations, exports
and real Node/Chrome 154 Workers, including paired fixture outputs, suspended
arguments without replay, resumed failure, output limits and workspace
recovery. Public in-process regressions also cover cancellation and session
isolation. No publication or version change was performed.

## Vector weighted var/std on one axis

Current additional calls are F(A,W), F(A,W,flag), F(A,W,dim), and
F(A,W,dim,flag), with F=var/std and one or two outputs as before. W is a
nonempty numeric row/column vector with more than one element, real nonnegative
weights (NaN and positive infinity allowed), and length exactly size(A,dim).
Orientation does not select the axis. Without dim, the existing first
size-not-one axis is used. A one-element W retains the scalar normalization
contract (only 0 or 1), not an arbitrary singleton weight. Logical weight
vectors, W=[], arrays of weights, weighted "all"/multi-axis selection,
output-type controls and weighted mean() remain unsupported. Scalar
normalization calls still support all/vecdim. A high dimension has length one
and cannot match a nonscalar weight vector; selected zero axes reject nonempty
weights. Empty nonselected axes retain shaped empty outputs.

For each slice, omitnan/omitmissing remove original (value,weight) pairs when
either component of a complex value or the real weight is NaN. Inclusion keeps
them, even at zero weight. Negative and nonreal weights are rejected globally
before any omissions. Retained NaN/infinite weights, no surviving pairs or zero
total weight give two NaNs. Retained infinite data make dispersion NaN; their
weighted mean follows arithmetic, including 0*Inf=NaN. Finite zero-weight
observations do not contribute. Weighted mean is sum(w*x)/sum(w), variance is
sum(w*abs(x-M)^2)/sum(w), and std is its real square root: no sample correction
or additional scalar normalization is applied. The same weights are aligned to
each original slice, and valid mass is recomputed per slice.

The shared line driver keeps shapes, input storage, paired output limits,
argument order, suspension and both numeric backends. Weighted kernels use the
same line sum and shifted two-pass dispersion as unweighted kernels. Within
each valid slice, divide weights by their largest finite positive weight and
select the first observation at that weight as the origin; this avoids
weight-sum overflow and unnecessary sensitivity to a negligible first weight.
Accumulation retains observation order. The reconstructed mean is not used to
recompute rounded deviations. Extreme data offsets/squares can still overflow,
and very small normalized weight ratios can underflow in the number backend;
decimal precision remains configurable.

The formulas and weight/NaN rules follow
[MATLAB var](https://www.mathworks.com/help/matlab/ref/double.var.html),
[MATLAB std](https://www.mathworks.com/help/matlab/ref/double.std.html) and
[Octave descriptive statistics](https://docs.octave.org/latest/Descriptive-Statistics.html).
Octave also documents same-sized array weights and weighted global/vector
selections; those remain beyond this bounded increment. MATLAB documents
weighted scalar-axis vector calls and scalar normalization for global/vector
selection. MATLAB missing aliases remain a deliberate difference from Octave
9.3; introspection continues using the local -2 bounded-output convention.
Earlier sections describing weights as unsupported refer to preceding
increments and are superseded for these vector/scalar-axis calls.

On 2026-10-12, native Octave Online 9.3.0 confirmed [V,M]=var([1 3],[1 3]) as
[0.75,2.5]; var([1 NaN],[1 0]) as two NaNs, with omitnan as [0,1]; all-zero
weights as two NaNs; var([1 3],[NaN 1],"omitnan") as [0,3]; and retained [Inf
1] weights as two NaNs. The numerical scaling choice can improve finite
extreme-weight cases beyond naive native summation and does not promise bitwise
native parity.

Weight sign and maximum selection use exact backend real-part predicates, not
the configurable approximate complex comparisons. Decimal regressions cover
negative and positive weights at 1e-999: negative weights remain invalid, and
tiny positive weights retain positive mass even when a number conversion would
underflow. No numeric global comparison policy is changed.

Vector-weight validation passed 938 compatibility tests in 14 suites, including
75 weighted regressions; 51 CoreFunctions/MultiArray tests; 9 architecture
checks; production and ES2015 types; declarations, lint, formatting and
circular-dependency checks. All 11 production bundles rebuilt after the
precision fix, and 32 bundle tests passed. Installed-tarball consumers passed
strict public declarations, export targets and real Node/Chrome 154 Workers
with weighted fixtures, suspended data/weight/control arguments, unique effects
and recovery after invalid weights. Public runtime regressions cover
cancellation and isolation. No publication or version change was performed.
