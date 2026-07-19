import { type ComplexType, type NumLikeType, Complex, toNumber } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';

const EXPECT_TOL = 1e-14;

type LAPACKConfig = {
    /**
     * Maximum iteration factor.
     */
    maxIterationFactor: number;
};
export const LAPACKConfigKeyTable: (keyof LAPACKConfig)[] = ['maxIterationFactor'];
const LAPACKConfigKeySet = new Set<keyof LAPACKConfig>(LAPACKConfigKeyTable);
const defaultSettings: Partial<LAPACKConfig> = {
    maxIterationFactor: 1e3,
};

/**
 * # LAPACK (Linear Algebra PACKage)
 *
 * LAPACK is written in Fortran 90 and provides routines for solving systems of simultaneous linear equations, least-squares solutions of linear systems of equations, eigenvalue problems, and singular value problems. The associated matrix factorizations (LU, Cholesky, QR, SVD, Schur, generalized Schur) are also provided, as are related computations such as reordering of the Schur factorizations and estimating condition numbers. Dense and banded matrices are handled, but not general sparse matrices. In all areas, similar functionality is provided for real and complex matrices, in both single and double precision.
 *
 * ## References
 * - [Wikipedia — LAPACK](https://en.wikipedia.org/wiki/LAPACK)
 * - [LAPACK — Linear Algebra PACKage — Netlib reference implementation](https://www.netlib.org/lapack/)
 * - [LAWNs — LAPACK Working Notes](https://www.netlib.org/lapack/lawns/downloads/)
 * - [LAPACK GitHub repository](https://github.com/Reference-LAPACK/lapack)
 * - [The LAPACKE C Interface to LAPACK](https://www.netlib.org/lapack/lapacke.html#_function_list)
 * - https://github.com/Reference-LAPACK/lapack/tree/master/SRC
 */
abstract class LAPACK {
    /**
     * `LAPACK` default settings.
     */
    public static readonly defaultSettings: LAPACKConfig = Object.assign({}, defaultSettings as LAPACKConfig);

    /**
     * `LAPACK` current settings.
     */
    public static readonly settings: LAPACKConfig = LAPACK.defaultSettings;

    /**
     * Multiply two matrix-valued `MultiArray` objects inside the LAPACK layer.
     *
     * This helper intentionally stays on raw BLAS multiplication instead of
     * routing through `MathOperation`, because LAPACK is the numerical backend
     * for higher-level language operators.
     *
     * @param left Left matrix.
     * @param right Right matrix.
     * @returns Matrix product `left * right`.
     */
    private static readonly mtimes = (left: MultiArray, right: MultiArray): MultiArray => {
        const rows = left.dimension[0];
        const inner = left.dimension[1];
        const columns = right.dimension[1];
        if (inner !== right.dimension[0]) {
            throw new Error(`LAPACK.mtimes: nonconformant arguments (op1 is ${left.dimension.join('x')}, op2 is ${right.dimension.join('x')}).`);
        }
        const result = new MultiArray([rows, columns]);
        BLAS.gemm(Complex.one(), left.array as ComplexType[][], rows, inner, right.array as ComplexType[][], columns, Complex.zero(), result.array as ComplexType[][]);
        MultiArray.setType(result);
        return result;
    };

    /**
     * Set configuration options for `LAPACK`.
     * @param config Configuration options.
     */
    public static readonly set = (config: Partial<LAPACKConfig>): void => {
        const entries = Object.entries(config);
        entries.forEach((entry) => {
            if (LAPACKConfigKeySet.has(entry[0] as keyof LAPACKConfig)) {
                LAPACK.settings[entry[0] as keyof LAPACKConfig] = entry[1];
            } else {
                throw new Error(`LAPACK.set: invalid configuration parameter: ${entry[0]}`);
            }
        });
    };

    /**
     * Test whether a matrix is Hermitian: M = Mᴴ
     *
     * @param M Matrix in row-major order (ComplexType[][])
     * @returns true if Hermitian within tolerance
     */
    public static readonly is_hermitian = (M: ComplexType[][]): boolean => {
        const n = M.length;
        if (n === 0) return true;
        if (M[0].length !== n) return false;
        const tol = EXPECT_TOL;
        for (let i = 0; i < n; i++) {
            // Diagonal must be real
            const diag = M[i][i];
            if (Math.abs(toNumber(diag.im)) > tol) return false;
            for (let j = i + 1; j < n; j++) {
                const a = M[i][j];
                const b = M[j][i];
                // a == conj(b)
                const diffRe = toNumber(a.re) - toNumber(b.re);
                const diffIm = toNumber(a.im) + toNumber(b.im);
                if (Math.hypot(diffRe, diffIm) > tol) return false;
            }
        }
        return true;
    };

    /**
     * Test whether a matrix is Hermitian positive definite.
     *
     * This function attempts an unblocked Cholesky factorization.
     * If it succeeds without encountering a non-positive pivot,
     * the matrix is considered positive definite.
     *
     * @param M Hermitian matrix (ComplexType[][])
     * @returns true if positive definite
     */
    public static readonly is_positive_definite = (M: ComplexType[][]): boolean => {
        const n = M.length;
        if (n === 0) return true;
        if (M[0].length !== n) return false;
        // Must be Hermitian first
        if (!LAPACK.is_hermitian(M)) return false;
        const tol = EXPECT_TOL;
        // Local copy (we must not overwrite input)
        const A: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Complex.copy(M[i][j])));
        // Simple Cholesky (lower triangular)
        for (let k = 0; k < n; k++) {
            let sum = A[k][k];
            for (let j = 0; j < k; j++) {
                const ljk = A[k][j];
                sum = Complex.sub(sum, Complex.mul(ljk, Complex.conj(ljk))) as ComplexType;
            }
            // Pivot must be real and positive
            if (Math.abs(toNumber(sum.im)) > tol) return false;
            if (toNumber(sum.re) <= tol) return false;
            const diag = Complex.create(Math.sqrt(toNumber(sum.re)), 0);
            A[k][k] = diag;
            for (let i = k + 1; i < n; i++) {
                let s = A[i][k];
                for (let j = 0; j < k; j++) {
                    s = Complex.sub(s, Complex.mul(A[i][j], Complex.conj(A[k][j]))) as ComplexType;
                }
                A[i][k] = Complex.rdiv(s, diag);
            }
        }
        return true;
    };

    /**
     * Apply a sequence of row interchanges to a MultiArray.
     * LAPACK-like signature: laswp(A, k1, k2, ipiv, incx, colStart = 0, colEnd = numCols-1)
     * @param A Multidimensional matrix.
     * @param dim Array of dimensions of A.
     * @param k1 1-based start index of rows to process (inclusive).
     * @param k2 1-based end index of rows to process (inclusive).
     * @param ipiv Integer array of pivot indices (LAPACK convention: 1-based). The routine will auto-detect if ipiv looks 0-based and adapt.
     * @param incx Increment (typically +1 or -1). When incx > 0 loop i=k1..k2 step incx; when incx<0 loop i=k1..k2 step incx.
     * @param colStart Optional 0-based column start to which the swaps are applied (inclusive).
     * @param colEnd Optional 0-based column end to which the swaps are applied (inclusive).
     * @returns
     */
    public static readonly laswp = (A: ComplexType[][], dim: number[], k1: number, k2: number, ipiv: number[], incx: number, colStart?: number, colEnd?: number): void => {
        const d0 = dim[0]; // rows per page (first dimension)
        const d1 = dim[1]; // cols
        const totalPages = dim.length === 2 ? 1 : dim.slice(2).reduce((p, c) => p * c, 1);
        // default column range: all columns (0-based)
        const jStart = colStart === undefined ? 0 : colStart;
        const jEnd = colEnd === undefined ? d1 - 1 : colEnd;
        // if (jStart < 0 || jEnd >= d1 || jStart > jEnd) throw new Error('laswp: invalid column range');
        if (!ipiv || ipiv.length === 0) return;
        // Determine if ipiv is 1-based (LAPACK) or 0-based (JS style).
        // Heuristic: if any ipiv value is 0, assume 0-based; if all >=1 assume 1-based.
        const minIp = Math.min(...ipiv);
        const isZeroBased = minIp === 0;
        // Convert access: pivotIndexRaw = ipiv[ix] ; pivotIndex = isZeroBased ? pivotIndexRaw : pivotIndexRaw - 1
        // Validate k1/k2 are within 1..d0  (they are row indices within the first dimension)
        // LAPACK uses 1-based local row indices. We'll not convert them automatically to zero-based for ipiv.
        // if (k1 < 1 || k2 < 1 || k1 > d0 || k2 > d0) {
        //     // It's valid for k1/k2 to be in 1..d0; but laswp may be called with k2==d0
        //     // We won't error out if k1/k2 exceed d0 when pages exist: rows are per-page.
        //     // However for safety, we allow k1,k2 in 1..d0.
        //     // If outside, throw to signal incorrect usage.
        //     throw new Error(`laswp: k1 and k2 should be in 1..${d0} (they are 1-based local row indices)`);
        // }
        // Loop i from k1 to k2 stepping incx (LAPACK convention: 1-based)
        // if (incx === 0) throw new Error('laswp: incx must be non-zero');
        if (incx > 0) {
            for (let i = k1; i <= k2; i += incx) {
                const idx = i - 1; // zero-based local row index within page
                // ipiv array indexing in LAPACK: ipiv[i-1] corresponds to pivot for row i
                const pivRaw = ipiv[i - 1];
                const piv = isZeroBased ? pivRaw : pivRaw - 1;
                // if (piv < 0 || piv >= d0) {
                //     throw new Error(`laswp: pivot index out of range for local rows. pivot=${pivRaw} (converted ${piv}), expected in 0..${d0 - 1}`);
                // }
                if (piv === idx) continue; // no swap needed
                // For each page p, swap global rows r1 = p*d0 + idx  and r2 = p*d0 + piv
                for (let p = 0; p < totalPages; p++) {
                    const r1 = p * d0 + idx;
                    const r2 = p * d0 + piv;
                    // swap columns jStart..jEnd
                    for (let j = jStart; j <= jEnd; j++) {
                        const tmp = A[r1][j];
                        A[r1][j] = A[r2][j];
                        A[r2][j] = tmp;
                    }
                }
            }
        } else {
            // incx < 0
            for (let i = k1; i >= k2; i += incx) {
                // note: incx negative so i decreases
                const idx = i - 1;
                const pivRaw = ipiv[i - 1];
                const piv = isZeroBased ? pivRaw : pivRaw - 1;
                // if (piv < 0 || piv >= d0) {
                //     throw new Error(`laswp: pivot index out of range for local rows. pivot=${pivRaw} (converted ${piv}), expected in 0..${d0 - 1}`);
                // }
                if (piv === idx) continue;
                for (let p = 0; p < totalPages; p++) {
                    const r1 = p * d0 + idx;
                    const r2 = p * d0 + piv;
                    for (let j = jStart; j <= jEnd; j++) {
                        const tmp = A[r1][j];
                        A[r1][j] = A[r2][j];
                        A[r2][j] = tmp;
                    }
                }
            }
        }
    };

    /**
     * Swap two rows of an N-dimensional MultiArray across all pages in place.
     * It is `LAPACK.laswp` for a single pivot applied across slices). `row1`,
     * `row2` are 0-based indices within the first dimension.
     * @param M Matrix.
     * @param row1 First row index to swap.
     * @param row2 Second row index to swap.
     */
    public static readonly laswp_rows = (M: ComplexType[][], dim: number[], row1: number, row2: number): void => {
        const k1 = row1 + 1; // LAPACK 1-based
        const k2 = k1; // Single row.
        const ipiv = [];
        ipiv[k1 - 1] = row2 + 1; // LAPACK 1-based
        LAPACK.laswp(M, dim, k1, k2, ipiv, +1);
    };

    /**
     * Swap two columns of an N-dimensional MultiArray across all pages in
     * place. There is no direct equivalent to LAPACK, but it is symmetrical
     * to `laswp_rows`.
     * @param M Matrix.
     * @param col1 First column index to swap.
     * @param col2 Second column index to swap.
     */
    public static readonly laswp_cols = (M: ComplexType[][], dim: number[], col1: number, col2: number): void => {
        const d0 = dim[0];
        const totalPages = dim.length === 2 ? 1 : dim.slice(2).reduce((a, b) => a * b, 1);
        const totalRows = d0 * totalPages;
        for (let i = 0; i < totalRows; i++) {
            const tmp = M[i][col1];
            M[i][col1] = M[i][col2];
            M[i][col2] = tmp;
        }
    };

    /**
     * Returns a 2D or ND-aware identity matrix (`ComplexType[][]`), row-major.
     * Optimized for internal `BLAS`/`LAPACK` operations.
     * Supports arbitrary number of dimensions.
     *
     * Usage:
     *  `LAPACK.eye(2,3,5,4)`   -> MultiArray with dims [2,3,5,4]
     *  `LAPACK.eye([2,3,5,4])` -> same as above
     *
     * Diagonal filled with `1` (`Complex.one()`), rest zeros.
     * Each 2-D page `[m,n]` in `ND` array gets its own identity.
     * @param dims `number[] | ...number`
     */
    public static readonly eye = (...dims: (number | number[])[]): ComplexType[][] => {
        const fullDims: number[] = dims.flat();
        const m = fullDims[0];
        const n = fullDims[1];
        if (fullDims.length === 2) {
            // Fast 2D identity
            return Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Complex.one() : Complex.zero())));
        } else {
            // ND-aware: row-major pages
            const pageCount = fullDims.slice(2).reduce((p, c) => p * c, 1);
            return Array.from({ length: m * pageCount }, (_, physRow) => {
                const rowIndexInPage = physRow % m;
                return Array.from({ length: n }, (_, col) => (rowIndexInPage === col ? Complex.one() : Complex.zero()));
            });
        }
    };

    public static readonly fillFactory = (fill: () => ComplexType): ((...dims: (number | number[])[]) => ComplexType[][]) => {
        return (...dims: (number | number[])[]): ComplexType[][] => {
            const fullDims: number[] = dims.flat();
            return Array.from({ length: fullDims[0] * fullDims.slice(2).reduce((p, c) => p * c, 1) }, () => Array.from({ length: fullDims[1] }, fill));
        };
    };

    /**
     * Returns a 2D or ND-aware null matrix (`ComplexType[][]`), row-major.
     * Optimized for internal `BLAS`/`LAPACK` operations.
     * Supports arbitrary number of dimensions.
     *
     * Usage:
     *  `LAPACK.zeros(2,3,5,4)`   -> MultiArray with dims [2,3,5,4]
     *  `LAPACK.zeros([2,3,5,4])` -> same as above
     *
     * All elements filled with `0` (`Complex.zero()`).
     * @param dims `number[] | ...number`
     * @returns
     */
    public static readonly zeros = LAPACK.fillFactory(() => Complex.zero());

    public static readonly ones = LAPACK.fillFactory(() => Complex.one());

    public static readonly diag = (diag: ComplexType[], k: number = 0, ...dims: (number | number[])[]): ComplexType[][] => {
        const fullDims = dims.length > 0 ? dims.flat() : [diag.length, diag.length];
        const m = fullDims[0];
        const n = fullDims[1];
        if (fullDims.length === 2) {
            // Fast 2D diagonal
            return Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i + k === j ? diag[i] : Complex.zero())));
        } else {
            // ND-aware: row-major pages
            const pageCount = fullDims.slice(2).reduce((p, c) => p * c, 1);
            return Array.from({ length: m * pageCount }, (_, physRow) => {
                const rowIndexInPage = physRow % m;
                return Array.from({ length: n }, (_, col) => (rowIndexInPage + k === col ? diag[rowIndexInPage] : Complex.zero()));
            });
        }
    };

    public static readonly from_diag = (array: ComplexType[][], k: number = 0): ComplexType[] => {
        const D: ComplexType[] = [];
        for (let i = 0; i < array.length - Math.abs(k); i++) {
            if (k > 0) {
                D[i] = array[i][i + k];
            } else {
                D[i] = array[i - k][i];
            }
        }
        return D;
    };

    /**
     * Computes the scaled sum of squares of the elements of a matrix.
     *
     * This routine implements the LAPACK LASSQ algorithm, which is designed
     * to accumulate the sum of squares in a numerically stable way, avoiding
     * unnecessary overflow and underflow.
     *
     * Given a matrix A, it computes two real non-negative values `scale` and
     * `sumsq` such that:
     *
     *     (scale^2) * sumsq = sum_{i,j} |A_{i,j}|^2
     *
     * The Frobenius norm of A can then be obtained as:
     *
     *     ||A||_F = scale * sqrt(sumsq)
     *
     * This function supports complex-valued matrices, using the modulus of
     * each element. Zero elements are skipped to reduce unnecessary operations.
     *
     * @param A - Input matrix (possibly complex-valued)
     * @returns An object containing:
     *   - scale: the scaling factor (real, non-negative)
     *   - sumsq: the scaled sum of squares (real, non-negative)
     */
    public static readonly lassq = (A: MultiArray): { scale: ComplexType; sumsq: ComplexType } => {
        const n = A.dimension[0];
        const m = A.dimension[1];
        let scale = Complex.zero(); // real
        let sumsq = Complex.one(); // real
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                const z = A.array[i][j] as ComplexType;
                if (!Complex.realIsZero(z)) {
                    const absz = Complex.abs(z); // ComplexType real ≥ 0

                    if (Complex.lt(scale, absz)) {
                        if (!Complex.realIsZero(scale)) {
                            const r = Complex.rdiv(scale, absz);
                            Complex.mulAndSumTo(sumsq, sumsq, Complex.mul(r, r));
                        }
                        scale = absz;
                    } else {
                        const r = Complex.rdiv(absz, scale);
                        Complex.mulAndSumTo(sumsq, r, r);
                    }
                }
            }
        }
        return { scale, sumsq };
    };

    /**
     * Computes selected norms of a matrix.
     *
     * This routine is analogous to the LAPACK LANGE function, supporting
     * computation of matrix norms based on the specified norm type.
     *
     * Supported norms:
     *
     * - 'F': Frobenius norm
     *        Defined as sqrt(sum_{i,j} |A_{i,j}|^2).
     *        Computed using the numerically stable LASSQ algorithm.
     *
     * - 'M': Maximum absolute value norm
     *        Defined as max_{i,j} |A_{i,j}|.
     *
     * The matrix may contain complex values; in all cases, the modulus of
     * each element is used.
     *
     * @param norm - Norm selector ('F' for Frobenius, 'M' for max-abs)
     * @param A - Input matrix (possibly complex-valued)
     * @returns The requested matrix norm as a real-valued ComplexType
     *
     * @throws Error if the requested norm is not implemented
     */
    public static readonly lange = (norm: 'F' | 'M', A: MultiArray): ComplexType => {
        const n = A.dimension[0];
        const m = A.dimension[1];
        switch (norm) {
            case 'F': {
                const { scale, sumsq } = LAPACK.lassq(A);
                if (Complex.realIsZero(scale)) {
                    return Complex.zero();
                }
                return Complex.mul(scale, Complex.sqrt(sumsq));
            }
            case 'M': {
                let max = Complex.zero();
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < m; j++) {
                        const v = Complex.abs(A.array[i][j] as ComplexType);
                        if (Complex.lt(max, v)) {
                            max = v;
                        }
                    }
                }
                return max;
            }
            default:
                throw new Error(`lange: norm '${norm}' not implemented`);
        }
    };

    /**
     * Zero the lower triangular part (i > j), keeping only the upper triangle. LAPACK-like TRIU operation.
     * @param M
     */
    public static readonly triu_inplace = (M: MultiArray): void => {
        /* Number of pages = product of the dimensions above the second one. */
        const pageCount = M.dimension.length > 2 ? M.dimension.slice(2).reduce((p, c) => p * c, 1) : 1;
        /* number of lines per page */
        const pageStride = M.dimension[0];
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let i = 0; i < M.dimension[0]; i++) {
                const row = M.array[pageStart + i];
                for (let j = 0; j < Math.min(i, M.dimension[1]); j++) {
                    row[j] = Complex.zero();
                }
            }
        }
        MultiArray.setType(M);
    };

    /**
     * Zero the upper triangular part (j > i), keeping only the lower triangle. LAPACK-like TRIL operation.
     * @param M
     */
    public static readonly tril_inplace = (M: MultiArray): void => {
        /* Number of pages = product of the dimensions above the second one. */
        const pageCount = M.dimension.length > 2 ? M.dimension.slice(2).reduce((p, c) => p * c, 1) : 1;
        /* number of lines per page */
        const pageStride = M.dimension[0];
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let i = 0; i < M.dimension[0]; i++) {
                const row = M.array[pageStart + i];
                for (let j = i + 1; j < M.dimension[1]; j++) {
                    row[j] = Complex.zero();
                }
            }
        }
        MultiArray.setType(M);
    };

    /**
     * Solve for X in U * X = B where U is upper triangular k x k stored at
     * A[kblock]. We implement in-place update of Bblock (A12 region). Block
     * target at rows k..k+kb-1, cols k+kb..n-1
     * @param A full MultiArray; U is at rows k..k+kb-1, cols k..k+kb-1
     * @param k
     * @param kb
     */
    public static readonly trsm_left_upper_block = (A: ComplexType[][], k: number, kb: number): void => {
        const n = A[0].length;
        // For each column of the right block
        for (let col = k + kb; col < n; col++) {
            // Solve U * x = b, where U is k..k+kb-1
            for (let i = kb - 1; i >= 0; i--) {
                const row = k + i;
                // b = A[row, col] - sum_{p=i+1..kb-1} U[i,p]*x[p]
                let acc = A[row][col] as ComplexType;
                for (let p = i + 1; p < kb; p++) {
                    const Up = A[row][k + p] as ComplexType; // U[i,p]
                    const xp = A[k + p][col] as ComplexType; // x[p]
                    acc = Complex.sub(acc, Complex.mul(Up, xp));
                }
                // divide by diag U[i,i]
                const diag = A[row][k + i] as ComplexType; // U[i,i]
                A[row][col] = Complex.rdiv(acc, diag);
            }
        }
    };

    /**
     * Build an explicit permutation matrix P from a LAPACK-style pivot array jpvt.
     *
     * The pivot array jpvt encodes a column permutation such that:
     *
     *   P(i, j) = 1  if  i === jpvt[j]
     *             0  otherwise
     *
     * This permutation matrix satisfies:
     *
     *   A * P   -> permutes the columns of A according to jpvt
     *   Pᵀ * A  -> permutes the rows of A according to jpvt
     *
     * This routine does NOT apply the permutation to a matrix; it only constructs
     * the explicit permutation matrix corresponding to jpvt.
     *
     * @param jpvt Pivot array encoding a column permutation (LAPACK convention).
     * @returns Permutation matrix P as a MultiArray.
     */
    public static readonly lapmt_matrix = (jpvt: number[]): MultiArray => {
        const n = jpvt.length;
        const P = new MultiArray([n, n]);
        for (let j = 0; j < n; j++) {
            const i = jpvt[j];
            P.array[i][j] = Complex.one();
        }
        MultiArray.setType(P);
        return P;
    };

    /**
     * Apply a LAPACK-style column permutation to a matrix in place.
     *
     * Given a matrix A and a pivot array jpvt, this routine permutes
     * the columns of A according to jpvt, such that after execution:
     *
     *   A(:, j) <- A_old(:, jpvt[j])
     *
     * This is equivalent to right-multiplication by the permutation
     * matrix P constructed from jpvt:
     *
     *   A_new = A_old * P
     *
     * The operation is performed in place and follows the semantics
     * of LAPACK's xLAPMT routine (column permutation).
     *
     * @param A    Matrix whose columns will be permuted (modified in place)
     * @param jpvt Pivot array encoding the column permutation
     */
    public static readonly lapmt_apply = (A: MultiArray, jpvt: number[]): void => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        if (jpvt.length !== n) {
            throw new EvalError(`lapmt_apply: jpvt length (${jpvt.length}) must match number of columns (${n}).`);
        }
        // Make a copy of original columns
        const Aold: ComplexType[][] = new Array(m);
        for (let i = 0; i < m; i++) {
            Aold[i] = A.array[i].slice() as ComplexType[];
        }
        // Apply permutation: A(:, j) = Aold(:, jpvt[j])
        for (let j = 0; j < n; j++) {
            const src = jpvt[j];
            for (let i = 0; i < m; i++) {
                A.array[i][j] = Aold[i][src];
            }
        }
        MultiArray.setType(A);
    };

    /**
     * Computes the Hermitian dot product of the tail of a column of A with itself.
     *
     * Evaluates:
     *      sigma = sum_{i = startRow+1}^{m-1} conj(A[i, col]) * A[i, col]
     *
     * Implemented as a BLAS.dotc on the extracted subvector.
     *
     * It is equivalent to the BLAS operation ZDOTC applied to the subvector
     * A[startRow+1 : m-1, col], and is typically used in the construction of
     * complex Householder reflectors (e.g., in LAPACK's xLARFG).
     * @param A        MultiArray representing the matrix.
     * @param col      Column index to operate on.
     * @param startRow Row index whose tail (startRow+1 .. end) is used.
     * @returns        The Hermitian dot product as a Complex value.
     */
    public static readonly dotc_col = (A: MultiArray, col: number, startRow: number): ComplexType => {
        const m = A.dimension[0];
        if (startRow + 1 >= m) {
            return Complex.zero();
        } else {
            const x = A.array.slice(startRow + 1, m).map((row) => row[col]) as ComplexType[];
            return BLAS.dotc(x, x);
        }
    };

    /**
     * Computes the Hermitian dot product of the tail of a row of A with itself.
     *
     * This function evaluates:
     *      sigma = sum_{j = startCol+1}^{n-1} conj(A[row, j]) * A[row, j]
     *
     * Implemented as a BLAS.dotc on the extracted subvector.
     *
     * It is equivalent to the BLAS operation ZDOTC applied to the subvector
     * A[row, startCol+1 : n-1], and is typically used in the construction of
     * complex Householder reflectors for right-side operations (e.g., LAPACK's xLARFG).
     *
     * @param A        MultiArray representing the matrix.
     * @param row      Row index to operate on.
     * @param startCol Column index whose tail (startCol+1 .. end) is used.
     * @returns        The Hermitian dot product as a Complex value.
     */
    public static readonly dotc_row = (A: MultiArray, row: number, startCol: number): ComplexType => {
        const n = A.dimension[1];
        if (startCol + 1 >= n) {
            return Complex.zero();
        } else {
            const x = A.array[row].slice(startCol + 1, n) as ComplexType[];
            return BLAS.dotc(x, x);
        }
    };

    public static readonly larfg = (side: 'L' | 'R', A: MultiArray, dim: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = dim - k;
        // 1) Extract x as a column vector (always).
        const x: ComplexType[] = new Array(len);
        x[0] = A.array[k][k] as ComplexType;
        if (side === 'L') {
            for (let i = 1; i < len; i++) {
                x[i] = A.array[k + i][k] as ComplexType;
            }
        } else {
            for (let j = 1; j < len; j++) {
                x[j] = A.array[k][k + j] as ComplexType;
            }
        }
        // 2) x0, phi
        const x0 = x[0];
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);
        // 3) sigma = sum |x[i]|^2, i>=1
        let sigma = Complex.zero();
        for (let i = 1; i < len; i++) {
            sigma = Complex.add(sigma, Complex.mul(x[i], Complex.conj(x[i])));
        }
        // 4) Degenerate cases
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            const tau = Complex.zero();
            const v = new Array(len).fill(Complex.zero());
            v[0] = Complex.one();
            return { tau, v, phi, alpha: x0 };
        }
        // 5) Norms and coefficients
        const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
        const alpha = Complex.mul(Complex.neg(phi), normx);
        const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);
        const denom = Complex.sub(x0, alpha);
        // 6) Build v (column vector)
        const v: ComplexType[] = new Array(len);
        v[0] = Complex.one();
        for (let i = 1; i < len; i++) {
            v[i] = Complex.rdiv(x[i], denom);
        }
        return { tau, v, phi, alpha };
    };

    public static readonly larfg_novo = (side: 'L' | 'R', A: MultiArray, dim: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = dim - k;

        // 1) Extract x as a column vector (always)
        const x: ComplexType[] = new Array(len);
        x[0] = A.array[k][k] as ComplexType;

        if (side === 'L') {
            for (let i = 1; i < len; i++) {
                x[i] = A.array[k + i][k] as ComplexType;
            }
        } else {
            for (let j = 1; j < len; j++) {
                x[j] = A.array[k][k + j] as ComplexType;
            }
        }

        // 2) x0 and phase
        const x0 = x[0];
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);

        // 3) sigma = ||x_tail||²
        let sigma = Complex.zero();
        for (let i = 1; i < len; i++) {
            sigma = Complex.add(sigma, Complex.mul(x[i], Complex.conj(x[i])));
        }

        // 4) Degenerate case → H = I
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            const tau = Complex.zero();
            const v = new Array(len).fill(Complex.zero());
            v[0] = Complex.one();
            return { tau, v, phi, alpha: x0 };
        }

        // 5) Norm and alpha
        const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));

        const alpha = Complex.mul(Complex.neg(phi), normx);

        // 6) tau
        const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);

        // 7) Build v (column vector)
        const denom = Complex.sub(x0, alpha);
        const v: ComplexType[] = new Array(len);
        v[0] = Complex.one();

        for (let i = 1; i < len; i++) {
            v[i] = Complex.rdiv(x[i], denom);
        }

        return { tau, v, phi, alpha };
    };

    /**
     * Apply an elementary reflector H = I - tau * v * vᴴ to a matrix A from the left.
     * Equivalent to A := H * A for rows rowStart..m-1 and columns colStart..n-1.
     *
     * Implements LAPACK xLARF (left-application):
     *
     * A := (I - tau * v * vᴴ) * A
     *
     * restricted to rows rowStart.. and columns colStart..
     *
     * @param A Matrix to modify in-place.
     * @param v Householder vector (ComplexType[]), v[0] == 1, length = m - rowStart.
     * @param tau Complex scalar (possibly 0).
     * @param rowStart Row index k (start of the reflector).
     * @param colStart Column index (first column to update; usually k+1 or 0).
     */
    public static readonly larf_left = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const vLen = v.length;
        // apply H = I - tau * v * vᴴ to columns j = rowStart+1 .. A.dimension[1]-1 only
        for (let j = colStart; j < A.dimension[1]; j++) {
            // sum = vᴴ * A[rowStart:rowStart+colLen-1, j]
            let sum = Complex.zero();
            for (let i = 0; i < vLen; i++) {
                Complex.mulAndSumTo(sum, Complex.conj(v[i]), A.array[rowStart + i][j] as ComplexType);
            }
            // sum = tau * sum
            sum = Complex.mul(tau, sum);
            // no update needed for this column
            if (Complex.realIsZero(Complex.abs(sum))) {
                continue;
            }
            // A[rowStart+i, j] -= v[i] * sum
            for (let i = 0; i < vLen; i++) {
                A.array[rowStart + i][j] = Complex.sub(A.array[rowStart + i][j] as ComplexType, Complex.mul(v[i], sum));
            }
        }
    };

    /**
     * ## LAPACK.larf
     *
     * Applies a complex Householder reflector
     *
     *   H = I - tau * v * vᴴ
     *
     * to a matrix C, either from the LEFT or from the RIGHT.
     *
     * LEFT  ('L'): C := (I - tau * v * vᴴ) * C
     * RIGHT ('R'): C := C * (I - tau * v * vᴴ)
     *
     * This implementation follows the LAPACK ZLARF convention exactly.
     *
     * Notes:
     * - v is a 1D vector (ComplexType[]) with v[0] = 1 by convention.
     * - Interpretation of v as row or column is the responsibility of the consumer.
     * - tau is complex.
     * - Updates are applied in-place.
     *
     * @param side 'L' (left) or 'R' (right)
     * @param C Target matrix (modified in-place)
     * @param v Householder vector, v[0] = 1
     * @param tau Householder scalar
     * @param i0 Starting row index in C
     * @param j0 Starting column index in C
     */
    public static readonly larf = (side: 'L' | 'R', C: MultiArray, v: ComplexType[], tau: ComplexType, i0: number, j0: number): void => {
        // If tau == 0, H = I → nothing to do
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const m = C.dimension[0];
        const n = C.dimension[1];
        const len = v.length;
        if (side === 'L') {
            /*
             * LEFT:
             *   C := (I - tau * v * vᴴ) * C
             *
             * Algorithm:
             *   w := vᴴ * C
             *   C := C - tau * v * w
             */
            const w: ComplexType[] = new Array(n - j0).fill(Complex.zero());
            // w[j] = sum_i conj(v[i]) * C[i0+i][j0+j]
            for (let j = 0; j < n - j0; j++) {
                let acc = Complex.zero();
                for (let i = 0; i < len; i++) {
                    const cij = C.array[i0 + i][j0 + j] as ComplexType;
                    Complex.mulAndSumTo(acc, Complex.conj(v[i]), cij);
                }
                w[j] = acc;
            }
            // C[i,j] -= tau * v[i] * w[j]
            for (let i = 0; i < len; i++) {
                const vi = v[i];
                const Ci = C.array[i0 + i];
                for (let j = 0; j < n - j0; j++) {
                    Ci[j0 + j] = Complex.sub(Ci[j0 + j] as ComplexType, Complex.mul(tau, Complex.mul(vi, w[j])));
                }
            }
        } else {
            /*
             * RIGHT:
             *   C := C * (I - tau * v * vᴴ)
             *
             * Algorithm:
             *   w := C * v
             *   C := C - tau * w * vᴴ
             */
            const rows = m - i0;
            const len = v.length;
            // w = C * vᴴ
            const w: ComplexType[] = new Array(rows);
            for (let i = 0; i < rows; i++) {
                let acc = Complex.zero();
                const Ci = C.array[i0 + i];
                for (let j = 0; j < len; j++) {
                    Complex.mulAndSumTo(acc, Ci[j0 + j] as ComplexType, Complex.conj(v[j]));
                }
                w[i] = acc;
            }
            // C -= tau * w * v
            for (let i = 0; i < rows; i++) {
                const wi = w[i];
                if (Complex.realIsZero(Complex.abs(wi))) continue;
                const Ci = C.array[i0 + i];
                for (let j = 0; j < len; j++) {
                    Ci[j0 + j] = Complex.sub(Ci[j0 + j] as ComplexType, Complex.mul(tau, Complex.mul(wi, v[j])));
                }
            }
        }
    };

    /**
     * Apply a Householder reflector from the RIGHT in its **adjoint form** (Hᴴ = I - conj(tau) * v * vᴴ)
     *
     * Equivalent to LAPACK xLARF with TRANS='C'.
     *
     * @param A Target matrix (MultiArray), modified in-place.
     * @param v Householder vector (v[0] = 1)
     * @param tau Scalar tau of the reflector
     * @param rowStart Start row for application (usually 0)
     * @param colStart Start column for application (usually k..n-1)
     */
    public static readonly larf_right_adjoint = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): void => {
        // Quick return
        if (Complex.realIsZero(Complex.abs(tau))) return;

        const m = A.dimension[0];
        const n = v.length;

        // Compute w = A * v
        const w: ComplexType[] = new Array(m - rowStart).fill(Complex.zero());
        for (let i = rowStart; i < m; i++) {
            let sum = Complex.zero();
            for (let j = 0; j < n; j++) {
                sum = Complex.add(sum, Complex.mul(A.array[i][colStart + j] as ComplexType, v[j]));
            }
            w[i - rowStart] = sum;
        }

        // Apply rank-1 update: A[i,j] -= conj(tau) * w[i] * conj(v[j])
        const tauConj = Complex.conj(tau);
        for (let i = rowStart; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const delta = Complex.mul(tauConj, Complex.mul(w[i - rowStart], Complex.conj(v[j])));
                A.array[i][colStart + j] = Complex.sub(A.array[i][colStart + j] as ComplexType, delta);
            }
        }
    };

    /**
     * Apply Householder reflector H = I - tau * v * vᴴ to A from the left,
     * in a blocked fashion:
     *
     *   A[rowStart..m-1, colStart..n-1] := H * A[rowStart..m-1, colStart..n-1]
     *
     * v is ComplexType[] of length = m - rowStart (v[0] == 1).
     *
     * Uses temporary block buffers and BLAS.gemm_block to compute
     * S = vᴴ * A_block and then A_block -= tau * v * S
     */
    public static readonly larf_left_block = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number, blockSize?: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const m: number = A.dimension[0];
        const n: number = A.dimension[1];
        const vlen: number = v.length; // expected m - rowStart
        // bounds checks (basic)
        if (rowStart < 0 || rowStart >= m) throw new Error('larf_left_block: invalid rowStart');
        if (colStart < 0 || colStart >= n) throw new Error('larf_left_block: invalid colStart');
        if (vlen !== m - rowStart) {
            throw new Error('larf_left_block: v length must equal m - rowStart');
        }
        const bs = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));
        // Prebuild Vcol as MultiArray (vlen x 1) for gemm usage
        const Vcol = new MultiArray([vlen, 1]);
        for (let i = 0; i < vlen; i++) Vcol.array[i][0] = v[i];
        // Prebuild Vrow = conj(v)ᵀ as MultiArray (1 x vlen)
        const Vrow = new MultiArray([1, vlen]);
        for (let i = 0; i < vlen; i++) Vrow.array[0][i] = Complex.conj(v[i]);
        // Loop over column blocks
        for (let jj = colStart; jj < n; jj += bs) {
            const jEnd = Math.min(jj + bs, n);
            const nCols = jEnd - jj;
            // Copy A_block = A[rowStart..m-1, jj..jEnd-1] into temp MultiArray (vlen x nCols)
            const Ablock = new MultiArray([vlen, nCols]);
            for (let ii = 0; ii < vlen; ii++) {
                for (let j = 0; j < nCols; j++) {
                    Ablock.array[ii][j] = A.array[rowStart + ii][jj + j] as ComplexType;
                }
            }
            // Compute S = Vrow (1 x vlen) * Ablock (vlen x nCols) -> (1 x nCols)
            const S = new MultiArray([1, nCols]); // store row vector
            // S := Vrow * Ablock
            BLAS.gemm_block(Vrow.array as ComplexType[][], Ablock.array as ComplexType[][], S.array as ComplexType[][], Complex.one(), Complex.zero(), bs);
            // Scale S by tau: S = tau * S (elementwise)
            for (let j = 0; j < nCols; j++) {
                S.array[0][j] = Complex.mul(tau, S.array[0][j] as ComplexType);
            }
            // Update Ablock := Ablock - Vcol * S  (outer product)
            // Vcol is (vlen x 1), S is (1 x nCols)
            for (let ii = 0; ii < vlen; ii++) {
                const vi = Vcol.array[ii][0] as ComplexType;
                // if vi == 0 skip inner loop
                if (Complex.realIsZero(Complex.abs(vi))) continue;
                for (let j = 0; j < nCols; j++) {
                    // Ablock[ii, j] -= vi * S[0, j]
                    const prod = Complex.mul(vi, S.array[0][j] as ComplexType);
                    Ablock.array[ii][j] = Complex.sub(Ablock.array[ii][j] as ComplexType, prod);
                }
            }
            // Write Ablock back into A
            for (let ii = 0; ii < vlen; ii++) {
                for (let j = 0; j < nCols; j++) {
                    A.array[rowStart + ii][jj + j] = Ablock.array[ii][j];
                }
            }
        } // jj blocks
    };

    /**
     * geqr2 — QR factorization (unblocked, complex, no pivoting).
     *
     * Computes the QR factorization of a complex m×n matrix A using
     * Householder reflectors, following LAPACK GEQR2 semantics with
     * MATLAB/Octave-compatible compact storage.
     *
     * The factorization is:
     *   A = Q * R
     *
     * Outputs:
     *  - R: a copy of A overwritten in-place:
     *      * R[k,k] stores the reflector scalar alpha
     *      * R[k+1:m,k] stores tau * v[1:], i.e. the Householder vector
     *        compactly below the diagonal (MATLAB/Octave style)
     *      * the upper triangle contains the R factor after completion
     *  - taus[k]: scalar tau for each Householder reflector, used by orgqr
     *  - phis[k]: phase factors returned by larfg_left (stored but not applied)
     *
     * Algorithm (for k = 0 .. min(m,n)-1):
     *  1) Generate Householder reflector H = I - tau * v * vᴴ
     *     acting on column k (via larfg_left)
     *  2) Store alpha at R[k,k]
     *  3) Store tau * v[1:] below the diagonal in column k
     *  4) Apply H to the remaining trailing columns (via larf_left)
     *
     * No pivoting is performed.
     * Q is not formed explicitly; it must be generated using orgqr.
     */
    public static readonly geqr2 = (A: MultiArray): { R: MultiArray; taus: ComplexType[]; phis: ComplexType[] } => {
        const R = MultiArray.copy(A) as MultiArray;
        const m = R.dimension[0];
        const n = R.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);
        const phis: ComplexType[] = new Array(kMax);
        for (let k = 0; k < kMax; k++) {
            // Generate the reflector for column k.
            const { tau, v, phi, alpha } = LAPACK.larfg('L', R, m, k);
            // Store alpha at R[k,k].
            R.array[k][k] = alpha;
            // Store tau * v[1..] using the MATLAB/Octave-compatible layout.
            for (let i = 1; i < v.length; i++) {
                R.array[k + i][k] = Complex.mul(tau, v[i]);
            }
            // Apply H = I - tau * v * v^H to the remaining columns.
            if (k + 1 < n) {
                LAPACK.larf('L', R, v, tau, k, k + 1);
            }
            // Preserve tau and phi exactly as produced by larfg.
            taus[k] = tau;
            phis[k] = phi;
        }
        MultiArray.setType(R);
        return { R, taus, phis };
    };

    /**
     * QR factorization with column pivoting (GEQP2 equivalent).
     * A is overwritten with:
     *   - Householder vectors in the lower trapezoid
     *   - R in the upper triangle
     *
     * NOTE: We store tau * v (LAPACK-compatible layout) to allow reuse of orgqr
     *
     * Returns:
     *   R   : MultiArray containing Householder vectors + R
     *   taus: Householder scalars
     *   jpvt: column permutation vector
     */
    public static readonly geqp2 = (A: MultiArray): { R: MultiArray; taus: ComplexType[]; phis: ComplexType[]; jpvt: number[] } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        // Output arrays
        const taus: ComplexType[] = new Array(Math.min(m, n));
        const phis: ComplexType[] = new Array(Math.min(m, n));
        const jpvt: number[] = new Array(n);
        for (let j = 0; j < n; j++) jpvt[j] = j;
        // Compute initial column norms (real numbers)
        const colNorms: ComplexType[] = new Array(n);
        const colNorms0: ComplexType[] = new Array(n);
        for (let j = 0; j < n; j++) {
            // LAPACK.nrm2(A, startRow, col, m) -> returns numeric norm
            const norm = BLAS.nrm2(A.array.map((row) => row[j]) as ComplexType[]);
            colNorms[j] = norm;
            colNorms0[j] = norm;
        }
        const kMax = Math.min(m, n);
        for (let k = 0; k < kMax; k++) {
            // === Pivot column selection (choose column with largest current norm) ===
            let maxIdx = k;
            let maxNorm = colNorms[k];
            for (let j = k + 1; j < n; j++) {
                if (Complex.toBoolean(Complex.gt(colNorms[j], maxNorm))) {
                    maxNorm = colNorms[j];
                    maxIdx = j;
                }
            }
            // === Swap columns if necessary ===
            if (maxIdx !== k) {
                // Swap columns in A (full column swap)
                for (let i = 0; i < m; i++) {
                    const tmp = A.array[i][k];
                    A.array[i][k] = A.array[i][maxIdx];
                    A.array[i][maxIdx] = tmp;
                }
                // Swap norms arrays (numbers)
                const t1 = colNorms[k];
                colNorms[k] = colNorms[maxIdx];
                colNorms[maxIdx] = t1;
                const t2 = colNorms0[k];
                colNorms0[k] = colNorms0[maxIdx];
                colNorms0[maxIdx] = t2;
                // Swap pivot index
                const t3 = jpvt[k];
                jpvt[k] = jpvt[maxIdx];
                jpvt[maxIdx] = t3;
            }
            // === Householder reflector for column k ===
            const { tau, v, alpha, phi } = LAPACK.larfg('L', A, m, k);
            taus[k] = tau;
            phis[k] = phi;
            // Store alpha at A[k,k]
            A.array[k][k] = alpha;
            // Store reflector vector as tau * v into A[k+1 : m-1, k] (v[0] is implicit 1)
            for (let i = 1; i < v.length; i++) {
                A.array[k + i][k] = Complex.mul(tau, v[i]);
            }
            // === Apply reflector to the remaining columns ===
            if (k + 1 < n) {
                // larf_left(A, v, tau, rowStart, colStart)
                LAPACK.larf('L', A, v, tau, k, k + 1);
            }
            // === Update column norms (LAPACK style) ===
            for (let j = k + 1; j < n; j++) {
                if (Complex.toBoolean(Complex.eq(colNorms[j], Complex.zero()))) continue;
                // abs(A[k,j]) as numeric
                const absAjkNum = Complex.abs(A.array[k][j] as ComplexType);
                const ratio = Complex.rdiv(absAjkNum, colNorms[j]);
                // numeric update: new_norm = old_norm * sqrt(max(0, 1 - ratio^2))
                const tmp = Complex.sub(Complex.one(), Complex.mul(ratio, ratio));
                const tmpPos = Complex.toBoolean(Complex.gt(tmp, Complex.zero())) ? tmp : Complex.zero();
                colNorms[j] = Complex.mul(colNorms[j], Complex.sqrt(tmpPos));
                // If norm dropped too much, recompute full norm for robustness
                if (Complex.toBoolean(Complex.le(colNorms[j], Complex.mul(Complex.onediv2(), colNorms0[j])))) {
                    // recompute norm of column j from row k+1 to m-1
                    const recomputed = BLAS.nrm2(A.array.slice(k + 1, m).map((row) => row[j]) as ComplexType[]);
                    colNorms[j] = recomputed;
                    colNorms0[j] = recomputed;
                }
            }
        }
        MultiArray.setType(A);
        return { R: A, taus, phis, jpvt };
    };

    /**
     * Computes the QR factorization of a real or complex matrix A with
     * column pivoting, using Householder reflectors (LAPACK-style GEQP3).
     *
     * Given an m-by-n matrix A, this routine computes a factorization
     *
     *     `A * P = Q * R`
     *
     * where:
     *   - `Q` is an m-by-m unitary/orthogonal matrix represented implicitly
     *     by a sequence of Householder reflectors defined by the vectors
     *     stored in the lower trapezoid of R and the scalar factors `taus`;
     *
     *   - `R` is the m-by-n upper-triangular (or upper-trapezoidal) factor
     *     returned explicitly in the output array;
     *
     *   - `P` is an n-by-n permutation matrix encoded by the pivot array `jpvt`,
     *     representing the reordering of columns chosen via column pivoting;
     *
     *   - `taus[k]` is the scalar coefficient of the k-th Householder
     *     reflector `Hₖ = I − τ v vᴴ`, where `v` is stored in column `k` of the
     *     modified `A` matrix (now part of `R`);
     *
     *   - `phis[k]` corresponds to the signed norm (or “alpha”) returned by
     *     the Householder generator for the k-th reflector, matching LAPACK’s
     *     internal convention for reconstructing the reflector explicitly.
     *
     * The routine follows the numerical strategy of xGEQP3 in LAPACK:
     *   - Computes initial column norms;
     *   - Uses partial column norm downdating to avoid recomputation;
     *   - Selects pivot columns based on remaining norms;
     *   - Applies Householder reflectors to update the trailing matrix.
     *
     * @param A  The input matrix (real or complex), given as a `MultiArray`.
     *           It is overwritten in-place with the `R` factor and the
     *           Householder vectors in its lower trapezoid.
     * @returns An object containing:
     *          - `R`:   The resulting `R` factor (with embedded Householder vectors).
     *          - `taus`: The array of Householder scalar factors τₖ.
     *          - `phis`: The signed norm/alpha values for each step of the factorization.
     *          - `jpvt`: The pivot array encoding the column permutation matrix `P`.
     */
    public static readonly geqp3 = (
        A: MultiArray,
    ): {
        R: MultiArray;
        taus: ComplexType[];
        phis: ComplexType[];
        jpvt: number[];
    } => {
        const R = MultiArray.copy(A) as MultiArray;
        const m = R.dimension[0];
        const n = R.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);
        const phis: ComplexType[] = new Array(kMax);
        const jpvt: number[] = new Array(n);
        for (let j = 0; j < n; j++) jpvt[j] = j;
        // vn1: current (updated) 2-norm estimates of columns j
        // vn2: original norms (used as reference to trigger recompute)
        const vn1: ComplexType[] = new Array(n);
        const vn2: ComplexType[] = new Array(n);
        // compute initial norms
        for (let j = 0; j < n; j++) {
            // sum |R[i][j]|^2 for i=0..m-1
            let s = Complex.zero();
            for (let i = 0; i < m; i++) {
                const val = R.array[i][j] as ComplexType;
                const aabs = Complex.abs(val);
                Complex.mulAndSumTo(s, aabs, aabs);
            }
            const norm = Complex.sqrt(s);
            vn1[j] = norm;
            vn2[j] = norm;
        }
        for (let k = 0; k < kMax; k++) {
            // 1) choose pivot p with max vn1[j] for j>=k
            let p = k;
            let maxn = vn1[k];
            for (let j = k + 1; j < n; j++) {
                if (Complex.toBoolean(Complex.gt(vn1[j], maxn))) {
                    maxn = vn1[j];
                    p = j;
                }
            }
            // 2) swap columns k and p if needed (in R, jpvt, vn1, vn2)
            if (p !== k) {
                // swap columns in R (all rows)
                for (let i = 0; i < m; i++) {
                    const tmp = R.array[i][k];
                    R.array[i][k] = R.array[i][p];
                    R.array[i][p] = tmp;
                }
                // swap jpvt
                const tmpj = jpvt[k];
                jpvt[k] = jpvt[p];
                jpvt[p] = tmpj;
                // swap norm trackers
                const tmpn1 = vn1[k];
                vn1[k] = vn1[p];
                vn1[p] = tmpn1;
                const tmpn2 = vn2[k];
                vn2[k] = vn2[p];
                vn2[p] = tmpn2;
            }
            // 3) generate reflector for column k using larfg (operates on R in place)
            const { tau, v, phi, alpha } = LAPACK.larfg('L', R, m, k);
            // 4) store alpha in R[k,k]
            R.array[k][k] = alpha;
            // 5) store tau * v[1..] in R[k+1.., k] (MATLAB/Octave-style)
            if (!Complex.realIsZero(Complex.abs(tau))) {
                for (let i = 1; i < v.length; i++) {
                    R.array[k + i][k] = Complex.mul(tau, v[i]);
                }
            } else {
                // make sure we don't leave garbage if tau == 0
                for (let i = 1; i < v.length; i++) {
                    R.array[k + i][k] = Complex.zero();
                }
            }
            // 6) apply H = I - tau * v * vᴴ to remaining columns (k+1 .. n-1)
            if (k + 1 < n && !Complex.realIsZero(Complex.abs(tau))) {
                LAPACK.larf('L', R, v, tau, k, k + 1);
            }
            // 7) save tau and phi
            taus[k] = tau;
            phis[k] = phi;
            // apply reflectors i = k downto 0
            for (let ii = k; ii >= 0; ii--) {
                // reconstruct v_i from R and taus[ii]
                const vlen_i = m - ii;
                const v_i: ComplexType[] = new Array(vlen_i);
                v_i[0] = Complex.one();
                const tau_i = taus[ii];
                if (Complex.realIsZero(Complex.abs(tau_i))) {
                    for (let t = 1; t < vlen_i; t++) v_i[t] = Complex.zero();
                } else {
                    for (let t = 1; t < vlen_i; t++) {
                        v_i[t] = Complex.rdiv(R.array[ii + t][ii] as ComplexType, tau_i);
                    }
                }
            }
            // 8) update partial column norms for columns j = k+1..n-1
            for (let j = k + 1; j < n; j++) {
                if (Complex.toBoolean(Complex.ne(vn1[j], Complex.zero()))) {
                    // use R[k][j] as the new element that reduced the norm
                    const rkj = R.array[k][j] as ComplexType;
                    const rkjabs = Complex.abs(rkj);
                    const temp = Complex.sub(Complex.one(), Complex.rdiv(Complex.mul(rkjabs, rkjabs), Complex.mul(vn1[j], vn1[j])));
                    const temp2 = Complex.toBoolean(Complex.gt(temp, Complex.zero())) ? Complex.sqrt(temp) : Complex.zero();
                    const newv = Complex.mul(vn1[j], temp2);
                    // heuristic: if newv is substantially smaller than vn2[j], recompute exact norm
                    const threshold = Complex.onediv2(); // typical heuristic factor (as in LAPACK)
                    if (Complex.toBoolean(Complex.le(newv, Complex.mul(threshold, vn2[j])))) {
                        // recompute exact norm from rows k+1..m-1
                        let ssum = Complex.zero();
                        for (let ii = k + 1; ii < m; ii++) {
                            const val = R.array[ii][j] as ComplexType;
                            const aabs = Complex.abs(val);
                            Complex.mulAndSumTo(ssum, aabs, aabs);
                        }
                        const exact = Complex.sqrt(ssum);
                        vn1[j] = exact;
                        vn2[j] = exact;
                    } else {
                        vn1[j] = newv;
                    }
                }
            }
        }
        MultiArray.setType(R);
        return { R, taus, phis, jpvt };
    };

    /**
     * ## `LAPACK.gelq2`
     * LQ factorization without pivoting (LAPACK GELQ2).
     *
     * Factorizes A as:
     *      A = L * Q
     *
     * where:
     *  - L is lower trapezoidal
     *  - Q is unitary
     *
     * Householder vectors are stored row-wise in A,
     * and scalars in `taus`.
     *
     * The pseudocode of this function is following:
     *
     * for k = 0 .. min(m,n)-1
     *     Generate reflector H_k to the right from line k.
     *     store alpha in A[k,k]
     *     store v in A[k, k+1 ..]
     *     Apply H_k to the right on lines k+1 .. m-1
     * end
     *
     * @param A MultiArray
     * @returns { L, taus }
     */
    public static readonly gelq2 = (A: MultiArray): { L: MultiArray; taus: ComplexType[]; phis: ComplexType[] } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);
        const phis: ComplexType[] = new Array(kMax);
        // Loop over each reflector index
        for (let k = 0; k < kMax; k++) {
            // === Generate Householder reflector from the right ===
            const { tau, v, alpha, phi } = LAPACK.larfg('R', A, n, k);
            // Store tau
            taus[k] = tau;
            phis[k] = phi;
            // Store alpha into A[k][k] (L factor)
            A.array[k][k] = alpha;
            // Store v[1..] into A[k, k+1..], as LAPACK does
            for (let j = 1; j < v.length; j++) {
                A.array[k][k + j] = v[j];
                // A.array[k][k + j] = Complex.mul(tau, v[j]);
            }
            // Apply reflector H_k to trailing rows (if needed)
            if (k + 1 < m && !Complex.realIsZero(Complex.abs(tau))) {
                /*
                 * We apply the Householder reflector H_k from the right
                 * to the block:
                 *   rows    = k+1 .. m-1
                 *   columns = k .. n-1
                 *
                 * This matches LAPACK's unblocked right application.
                 */
                LAPACK.larf('R', A, v, tau, k + 1, k);
            }
        }
        // Ensure the type is set back on MultiArray A
        MultiArray.setType(A);
        return { L: A, taus, phis };
    };

    /**
     * ## `LAPACK.orgqr`
     * Construct `Q` explicitly from `R` (with MATLAB/Octave-style storage
     * `tau*v` in subdiagonal) and `taus[]` produced by `LAPACK.geqr2`.
     * We reconstruct each `v` from `R` (`v[0]=1`, `v[1..]` from `R[k+1..,k]`) then
     * apply `Q := Q * Hᴴ` using accumulation. Adapted to row-major
     * MultiArray and using `LAPACK.larf` for left application.
     *
     * IMPORTANT: loop in reverse order (`kMax-1` downto `0`) applying `H = I - tau * v * vᴴ` to match LAPACK
     * ZUNGQR semantics.
     * @param R
     * @param taus
     * @returns Q matrix
     */
    public static readonly orgqr = (R: MultiArray, taus: ComplexType[]): MultiArray => {
        const m: number = R.dimension[0];
        const n: number = R.dimension[1];
        const kMax = Math.min(m, n);
        const Q = new MultiArray([m, m]);
        Q.array = LAPACK.eye(m, m);
        // Apply H_{kMax-1}, ..., H_0 to Q (left multiplication). k is reflector index.
        for (let k = kMax - 1; k >= 0; k--) {
            // Reconstruct v from R: v[0]=1, v[i]=R[k+i,k]
            const vlen = m - k;
            const v: ComplexType[] = [Complex.one()];
            const tau = taus[k];
            if (Complex.realIsZero(Complex.abs(tau))) {
                // tau == 0 => null reflector (trivial)
                for (let i = 1; i < vlen; i++) v[i] = Complex.zero();
            } else {
                // Reconstruct v from the tau * v storage.
                for (let i = 1; i < vlen; i++) {
                    // R.array[k + i][k] is equals tau * v[i]
                    v[i] = Complex.rdiv(R.array[k + i][k] as ComplexType, tau);
                }
            }
            // apply H = I - tau * v * vᴴ to Q (rows k..m-1, all columns)
            LAPACK.larf('L', Q, v, tau, k, 0);
        }
        MultiArray.setType(Q);
        return Q;
    };

    /**
     * ## LAPACK.orglq
     *
     * Explicitly reconstruct the unitary matrix Q from `gelq2` output.
     *
     * Assumptions:
     * - `L` stores Householder vectors directly in `L[k][k+1..]`.
     * - `taus[k]` stores the scalar Householder coefficient.
     *
     * Reconstructs:
     *   Q = H_0^H * H_1^H * ... * H_{k-1}^H
     *
     * where:
     *   H_k = I - tau[k] * v * v^H
     *
     * @param L `m x n` matrix returned by `gelq2`.
     * @param taus Householder scalar coefficients.
     * @returns Unitary `n x n` matrix Q.
     */
    public static readonly orglq = (L: MultiArray, taus: ComplexType[]): MultiArray => {
        const n = L.dimension[1];
        const kMax = taus.length;
        // Q = I
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        // reverse order (essential)
        for (let k = kMax - 1; k >= 0; k--) {
            const tau = taus[k];
            if (Complex.realIsZero(Complex.abs(tau))) continue;
            const vlen = n - k;
            const v: ComplexType[] = new Array(vlen);
            v[0] = Complex.one();
            for (let j = 1; j < vlen; j++) {
                v[j] = L.array[k][k + j] as ComplexType;
                // v[j] = Complex.rdiv(L.array[k][k + j] as ComplexType, tau);
            }
            LAPACK.larf('R', Q, v, tau, 0, k);
        }
        MultiArray.setType(Q);
        return Q;
    };

    /**
     * Unblocked LU factorization (panel) - modifies A in place.
     * A is m x n stored as ComplexType[][] (row-major physical layout).
     * Performs LU on A[k..m-1, k..n-1] and writes pivots into piv starting at offset k.
     * Returns number of pivots performed (panel width) or info.
     *
     * This is analogous to LAPACK's xGETF2 applied to the submatrix.
     *
     * This routine will update A in-place (compact LU) and fill piv[k..k+panelWidth-1] (global, zero-based).
     *
     * @param A ComplexType[][] (m x n) (modified in-place)
     * @param k starting column/row index for panel
     * @param panelWidth number of columns to factor (<= min(m-k, n-k))
     * @param piv number[] global pivot array, receives zero-based pivot row indices, length >= min(m,n)
     * @param swapsObj { swaps: number }  (accumulates swaps)
     * @param infoObj { info: number } (LAPACK-style 1-based info)
     */
    public static readonly getf2 = (A: ComplexType[][], k: number, panelWidth: number, piv: number[], swapsObj?: { swaps: number }, infoObj?: { info: number }): void => {
        const dim = [A.length, A[0].length];
        const [m, n] = dim;
        const end = Math.min(k + panelWidth, Math.min(m, n));
        for (let i = k; i < end; i++) {
            // 1) find pivot in column i (rows i..m-1)
            let maxIdx = i;
            let maxVal = Complex.abs(A[i][i] as ComplexType);
            for (let r = i + 1; r < m; r++) {
                const val = Complex.abs(A[r][i] as ComplexType);
                if (Complex.toBoolean(Complex.gt(val, maxVal))) {
                    maxVal = val;
                    maxIdx = r;
                }
            }
            piv[i] = maxIdx;
            // 2) swap rows i and maxIdx in A if needed (full row swap)
            if (maxIdx !== i) {
                LAPACK.laswp_rows(A, dim, i, maxIdx);
                if (typeof swapsObj !== 'undefined') swapsObj.swaps++;
            }
            // 3) check singularity. If pivot is zero, skip multipliers
            const pivot = A[i][i] as ComplexType;
            if (Complex.toBoolean(Complex.eq(Complex.abs(pivot), Complex.zero()))) {
                if (typeof infoObj !== 'undefined') if (infoObj.info === 0) infoObj.info = i + 1; // LAPACK-style info (1-based)
                continue;
            }
            // 4) compute multipliers and store in column i below diagonal
            for (let r = i + 1; r < m; r++) {
                A[r][i] = Complex.rdiv(A[r][i] as ComplexType, pivot);
            }
            // 5) rank-1 update on trailing submatrix A[i+1:m-1, i+1:n-1] (columns i+1..n-1)
            for (let r = i + 1; r < m; r++) {
                const lir = A[r][i] as ComplexType; // multiplier L(r,i)
                if (Complex.toBoolean(Complex.eq(Complex.abs(lir), Complex.zero()))) continue;
                const rowR = A[r] as ComplexType[];
                const rowI = A[i] as ComplexType[];
                for (let c = i + 1; c < n; c++) {
                    // A[r][c] -= L(r,i) * A[i][c]
                    rowR[c] = Complex.sub(rowR[c], Complex.mul(lir, rowI[c]));
                }
            }
        }
    };

    /**
     * Blocked GETRF for complex matrices (LU with partial pivoting).
     * This routine will modify A in-place, writing LU (L below diag, U on and above diag).
     * @param A
     * @returns { LU: MultiArray (same reference as input A, modified), piv: number[], swaps: number }
     */
    public static readonly getrf = (A: ComplexType[][], blockSize?: number): { LU: ComplexType[][]; piv: number[]; swaps: number; info: number } => {
        const m = A.length;
        const n = A[0].length;
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        const swapsObj = { swaps: 0 };
        const infoObj = { info: 0 };
        for (let k = 0; k < minmn; k += blockSize ?? BLAS.settings.blockSize) {
            const panelWidth = Math.min(blockSize ?? BLAS.settings.blockSize, minmn - k);
            // 1) Factorize panel A[k:m-1, k:k+panelWidth-1] with getf2 (unblocked)
            LAPACK.getf2(A, k, panelWidth, piv, swapsObj, infoObj);
            // Count swaps from pivots in the panel (and apply them to previous columns)
            for (let i = k; i < k + panelWidth && i < minmn; i++) {
                const pi = piv[i];
                if (pi !== i) swapsObj.swaps++;
                // Note: getf2 already swapped rows in A (and we've recorded piv)
                // We must apply the same row swaps to previous columns 0..k-1
                if (pi !== i && k > 0) {
                    // swap rows in columns 0..k-1 (previous part)
                    for (let col = 0; col < k; col++) {
                        const tmp = A[i][col];
                        A[i][col] = A[pi][col];
                        A[pi][col] = tmp;
                    }
                }
            }
            // 2) Apply pivots to trailing columns (k+panelWidth .. n-1) already done by laswp in getf2?
            // In our getf2 we swapped full rows of A, so trailing columns were swapped as well.
            // 3) Compute U12 and L21 as needed and update trailing submatrix
            const kb = panelWidth;
            const rowsL = m - (k + kb); // rows below the panel
            const colsU = n - (k + kb); // columns to the right of the panel
            if (k + kb < n) {
                // Build pointers to subblocks:
                // A11: A[k:k+kb-1, k:k+kb-1] (upper triangular + L parts)
                // A12: A[k:k+kb-1, k+kb:n-1]  (U12)
                // A21: A[k+kb:m-1, k:k+kb-1]  (L21)
                // A22: A[k+kb:m-1, k+kb:n-1]  (trailing submatrix)
                const Aarray = A; // physical rows
                // Create raw pointers for BLAS gemm: we need A21 (rows m-k-kb x kb), A12 (kb x colsU), and A22 (rowsL x colsU)
                // Build A21_raw: rowsL x kb (as ComplexType[][])
                const A21_raw: ComplexType[][] = [];
                for (let i = 0; i < rowsL; i++) {
                    const physRow = k + kb + i;
                    // slice columns k..k+kb-1
                    const rowSlice = new Array(kb);
                    for (let j = 0; j < kb; j++) rowSlice[j] = Aarray[physRow][k + j];
                    A21_raw.push(rowSlice);
                }
                // Build A12_raw: kb x colsU
                const A12_raw: ComplexType[][] = [];
                for (let i = 0; i < kb; i++) {
                    const physRow = k + i;
                    const rowSlice = new Array(colsU);
                    for (let j = 0; j < colsU; j++) rowSlice[j] = Aarray[physRow][k + kb + j];
                    A12_raw.push(rowSlice);
                }
                // Build A22_raw: rowsL x colsU (will be updated in place)
                const A22_raw: ComplexType[][] = [];
                for (let i = 0; i < rowsL; i++) {
                    const physRow = k + kb + i;
                    const rowSlice = new Array(colsU);
                    for (let j = 0; j < colsU; j++) rowSlice[j] = Aarray[physRow][k + kb + j];
                    A22_raw.push(rowSlice);
                }
                // A22 := A22 - A21 * A12  (matrix multiply)
                // Use BLAS.gemm with alpha = -1, alpha = 1
                BLAS.gemm(Complex.neg(Complex.one()), A21_raw, rowsL, kb, A12_raw, colsU, Complex.one(), A22_raw);
                // Write back A22_raw into A.array
                for (let i = 0; i < rowsL; i++) {
                    const physRow = k + kb + i;
                    for (let j = 0; j < colsU; j++) {
                        Aarray[physRow][k + kb + j] = A22_raw[i][j];
                    }
                }
                // Write back A12_raw into A.array (U12 may have been used but not modified by gemm)
                for (let i = 0; i < kb; i++) {
                    const physRow = k + i;
                    for (let j = 0; j < colsU; j++) {
                        Aarray[physRow][k + kb + j] = A12_raw[i][j];
                    }
                }
                // Write back A21_raw into A.array (L21 multipliers were not changed by gemm)
                for (let i = 0; i < rowsL; i++) {
                    const physRow = k + kb + i;
                    for (let j = 0; j < kb; j++) {
                        Aarray[physRow][k + j] = A21_raw[i][j];
                    }
                }
            }
        }
        return { LU: A, piv, swaps: swapsObj.swaps, info: infoObj.info };
    };

    /**
     * Blocked LU factorization that calls getf2 for panel factorization,
     * then solves and updates the trailing submatrix.
     * @param A
     * @returns Object { LU: A, piv, info, swaps }
     */
    public static readonly getrf_blocked = (A: ComplexType[][], blockSize?: number): { LU: ComplexType[][]; piv: number[]; swaps: number; info: number } => {
        const m = A.length;
        const n = A[0].length;
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        const swapsObj = { swaps: 0 };
        const infoObj = { info: 0 };
        for (let k = 0; k < minmn; k += blockSize ?? BLAS.settings.blockSize) {
            const kb = Math.min(blockSize ?? BLAS.settings.blockSize, minmn - k);
            // 1) Factor panel A[k:m-1, k:k+kb-1]
            LAPACK.getf2(A, k, kb, piv, swapsObj, infoObj);
            // 2) If there are columns to the right, solve U * X = A12 (trsm-like)
            if (k + kb < n) {
                // Note: in our layout, after getf2 we already have L and U in place for the panel.
                // We need to compute U^{-1} * A12 (i.e. solve for rows k..k+kb-1)
                // We'll use the simple trsm_left_upper_block that divides columns k+kb..n-1 by U.
                LAPACK.trsm_left_upper_block(A, k, kb);
            }
            // 3) Update trailing submatrix A22 := A22 - L21 * U12
            if (k + kb < m && k + kb < n) {
                LAPACK.gemm_blocked(A, k, kb);
            }
        }
        return { LU: A, piv, info: infoObj.info, swaps: swapsObj.swaps };
    };

    /**
     * Compute A22 := A22 - A21 * A12  (standard update in GETRF).
     * All indices are absolute within A.array.
     * A21: rows (k+kb .. m-1) x cols (k .. k+kb-1)
     * A12: rows (k .. k+kb-1) x cols (k+kb .. n-1)
     * A22: rows (k+kb .. m-1) x cols (k+kb .. n-1)
     * @param A
     * @param k
     * @param kb
     * @param blockSizeInner
     */
    public static readonly gemm_blocked = (A: ComplexType[][], k: number, kb: number, blockSizeInner: number = 64): void => {
        const m = A.length;
        const n = A[0].length;
        const rowA22 = k + kb;
        const colA22 = k + kb;
        const rowsL = m - (k + kb);
        const colsU = n - (k + kb);
        if (rowsL <= 0 || colsU <= 0) return;
        const K = kb; // inner dimension
        // Basic blocking on i/j; inner sum loops over p in [0..K-1]
        const bs = blockSizeInner;
        for (let ii = 0; ii < rowsL; ii += bs) {
            const iend = Math.min(ii + bs, rowsL);
            for (let jj = 0; jj < colsU; jj += bs) {
                const jend = Math.min(jj + bs, colsU);
                // compute block (ii:iend-1 , jj:jend-1)
                for (let i = ii; i < iend; i++) {
                    const physRow = rowA22 + i;
                    const rowPhys = A[physRow];
                    for (let j = jj; j < jend; j++) {
                        // compute sum_{p=0..K-1} A21[i,p] * A12[p,j]
                        let sum = Complex.zero();
                        for (let p = 0; p < K; p++) {
                            const a21 = A[rowA22 + i][k + p] as ComplexType; // A21[i,p]
                            const a12 = A[k + p][colA22 + j] as ComplexType; // A12[p,j]
                            sum = Complex.add(sum, Complex.mul(a21, a12));
                        }
                        // A22[i,j] := A22[i,j] - sum
                        rowPhys[colA22 + j] = Complex.sub(rowPhys[colA22 + j] as ComplexType, sum);
                    }
                }
            }
        }
    };

    /**
     * Solve systems A X = B given LU factorization in-place and pivots.
     * This follows LAPACK GETRS semantics (no transpose).
     * @param LU ComplexType[][] containing LU as returned by getrf
     * @param piv pivot vector (zero-based) length = min(m,n)
     * @param B ComplexType[][] of size m x nrhs (modified in place)
     * @returns new ComplexType[][] (`B`) with solution
     */
    public static readonly getrs = (LU: ComplexType[][], piv: number[], B: ComplexType[][]): ComplexType[][] => {
        const m = LU.length;
        const n = LU[0].length;
        const nrhs = B[0].length ?? 1;
        // Make a copy of B (we don't want to modify user's B unless intended)
        const X = BLAS.copy(B) as ComplexType[][];
        // 1) Apply row permutations to RHS: B' = P * B
        // piv[k] gives row swapped into position k
        for (let k = 0; k < piv.length; k++) {
            const pk = piv[k];
            if (pk !== k) {
                // swap rows k and pk in X
                const tmp = X[k];
                X[k] = X[pk];
                X[pk] = tmp;
            }
        }
        // 2) Solve L * y = B'  (forward substitution), L has 1's on diagonal and multipliers in strictly lower part
        for (let j = 0; j < nrhs; j++) {
            for (let i = 0; i < m; i++) {
                let sum = X[i][j];
                for (let p = 0; p < i && p < n; p++) {
                    sum = Complex.sub(sum, Complex.mul(LU[i][p], X[p][j]));
                }
                // For L diagonal, divide by 1 (skip)
                X[i][j] = sum;
            }
        }
        // 3) Solve U * x = y (back substitution). U is upper triangular (n columns)
        for (let j = 0; j < nrhs; j++) {
            for (let i = Math.min(n, m) - 1; i >= 0; i--) {
                let sum = X[i][j];
                for (let p = i + 1; p < n; p++) {
                    sum = Complex.sub(sum, Complex.mul(LU[i][p], X[p][j]));
                }
                const diag = LU[i][i];
                // divide by diag (may be zero => Inf/NaN propagate as intended)
                X[i][j] = Complex.rdiv(sum, diag);
            }
        }
        return X;
    };

    /**
     * Solve linear system A X = B using LU factorization with partial pivoting.
     * LAPACK-style GESV.
     *
     * @param A ComplexType[][] (m x n), not modified
     * @param B ComplexType[][] (m x nrhs)
     * @returns { X, info }
     */
    public static readonly gesv = (A: ComplexType[][], B: ComplexType[][]): { X: ComplexType[][]; info: number } => {
        /* Defensive copies (GESV does not overwrite user inputs) */
        const Awork = BLAS.copy(A) as ComplexType[][];
        const Bwork = BLAS.copy(B) as ComplexType[][];
        /* 1) LU factorization */
        const { LU, piv, info } = LAPACK.getrf(Awork);
        if (info !== 0) {
            /* Singular matrix: info > 0 means U(info,info) = 0 */
            return { X: Bwork, info };
        }
        /* 2) Solve system using LU */
        const X = LAPACK.getrs(LU, piv, Bwork);
        return { X, info: 0 };
    };

    /**
     * Solve A X = B for Hermitian positive definite A.
     * LAPACK POSV semantics (first version).
     *
     * NOTE:
     * This initial implementation falls back to GETRF + GETRS.
     * Later, it should be replaced by POTRF + POTRS.
     *
     * MATLAB equivalent:
     *     X = A \\ B   (A Hermitian positive definite)
     */
    public static readonly posv = (A: ComplexType[][], B: ComplexType[][]): ComplexType[][] => {
        // Defensive copies (LAPACK semantics allow overwrite)
        const Awork = BLAS.copy(A) as ComplexType[][];
        const Bwork = BLAS.copy(B) as ComplexType[][];
        // LU factorization (temporary fallback)
        const { LU, piv, info } = LAPACK.getrf(Awork);
        if (info !== 0) {
            throw new Error(`posv: matrix is singular or not positive definite (info = ${info})`);
        }
        // Solve system
        return LAPACK.getrs(LU, piv, Bwork);
    };

    /**
     * BLAS/LAPACK-like Cholesky factorization (Potrf) — MathJSLab version
     *
     * Computes A = L*L^H if uplo='lower', or A = U^H*U if uplo='upper'.
     *
     * Returns a copy of A with the chosen triangle overwritten with the Cholesky factor,
     * and the other triangle zeroed.
     *
     * @param A MultiArray square Hermitian (complex) or symmetric (real) positive-definite
     * @param opts.uplo 'lower' or 'upper' (default: 'lower')
     */
    public static readonly potrf = (A: MultiArray, opts?: { uplo?: 'lower' | 'upper' }): MultiArray => {
        const uplo = opts?.uplo ?? 'lower';
        const n = A.dimension[0];
        if (A.dimension[0] !== A.dimension[1]) throw new Error('LAPACK.potrf: A must be square');

        const L = MultiArray.copy(A) as MultiArray;

        if (uplo === 'lower') {
            for (let j = 0; j < n; j++) {
                // diagonal
                let sum = Complex.realToNumber(L.array[j][j] as ComplexType);
                for (let k = 0; k < j; k++) {
                    const lkj = L.array[j][k] as ComplexType;
                    sum -= Complex.realToNumber(Complex.mul(lkj, Complex.conj(lkj)));
                }
                if (sum <= 0) throw new Error('LAPACK.potrf: matrix is not positive definite');
                L.array[j][j] = Complex.create(Math.sqrt(sum));

                // off-diagonal
                for (let i = j + 1; i < n; i++) {
                    let s = L.array[i][j] as ComplexType;
                    for (let k = 0; k < j; k++) {
                        s = Complex.sub(s, Complex.mul(L.array[i][k] as ComplexType, Complex.conj(L.array[j][k] as ComplexType)));
                    }
                    L.array[i][j] = Complex.rdiv(s, L.array[j][j] as ComplexType);
                }
            }

            // zero upper triangle
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    L.array[i][j] = Complex.zero();
                }
            }
        } else {
            // uplo === 'upper'
            for (let j = 0; j < n; j++) {
                // diagonal
                let sum = Complex.realToNumber(L.array[j][j] as ComplexType);
                for (let k = 0; k < j; k++) {
                    const ukj = L.array[k][j] as ComplexType;
                    sum -= Complex.realToNumber(Complex.mul(ukj, Complex.conj(ukj)));
                }
                if (sum <= 0) throw new Error('LAPACK.potrf: matrix is not positive definite');
                L.array[j][j] = Complex.create(Math.sqrt(sum));

                // off-diagonal
                for (let i = j + 1; i < n; i++) {
                    let s = L.array[j][i] as ComplexType;
                    for (let k = 0; k < j; k++) {
                        s = Complex.sub(s, Complex.mul(Complex.conj(L.array[k][j] as ComplexType), L.array[k][i] as ComplexType));
                    }
                    L.array[j][i] = Complex.rdiv(s, L.array[j][j] as ComplexType);
                }
            }

            // zero lower triangle
            for (let i = 1; i < n; i++) {
                for (let j = 0; j < i; j++) {
                    L.array[i][j] = Complex.zero();
                }
            }
        }

        MultiArray.setType(L);
        return L;
    };

    /**
     * Solve A X = B for Hermitian/symmetric indefinite A.
     * LAPACK SYSV semantics (first version).
     *
     * NOTE:
     * This initial implementation falls back to GETRF + GETRS.
     * Later, it should be replaced by SYTRF + SYTRS (or HETRF + HETRS).
     *
     * MATLAB equivalent:
     *     X = A \\ B   (A symmetric or Hermitian, indefinite allowed)
     */
    public static readonly sysv = (A: ComplexType[][], B: ComplexType[][]): ComplexType[][] => {
        // Defensive copies
        const Awork = BLAS.copy(A) as ComplexType[][];
        const Bwork = BLAS.copy(B) as ComplexType[][];
        // General LU fallback
        const { LU, piv, info } = LAPACK.getrf(Awork);
        if (info !== 0) {
            throw new Error(`sysv: matrix is singular (info = ${info})`);
        }
        return LAPACK.getrs(LU, piv, Bwork);
    };

    /**
     * Matrix left division (A \ B), LAPACK-style dispatcher.
     *
     * Selects the most appropriate solver according to matrix properties:
     *  - Hermitian positive definite  -> POSV
     *  - Hermitian (indefinite)       -> SYSV
     *  - General matrix               -> GESV
     *
     * This mirrors MATLAB / Octave internal behavior conceptually.
     */
    public static readonly mldivide = (A: MultiArray, B: MultiArray): { X: MultiArray; info: number; solver: 'gesv' | 'posv' | 'sysv' } => {
        const [m, n] = A.dimension;
        const [br, bc] = B.dimension;
        // --- Dimension checks (MATLAB-compatible) ---
        if (n !== br) {
            throw new EvalError(`operator \\: nonconformant arguments (op1 is ${A.dimension.join('x')}, op2 is ${B.dimension.join('x')}).`);
        }
        let X: MultiArray;
        let info: number;
        let solver: 'posv' | 'sysv' | 'gesv';
        // --- Hermitian path ---
        if (LAPACK.is_hermitian(A.array as ComplexType[][])) {
            // --- Positive definite ---
            if (LAPACK.is_positive_definite(A.array as ComplexType[][])) {
                const posvResult = LAPACK.posv(A.array as ComplexType[][], B.array as ComplexType[][]);
                X = new MultiArray([posvResult.length, posvResult[0].length]);
                X.array = posvResult;
                info = 0;
                solver = 'posv';
            } else {
                // --- Hermitian but indefinite ---
                const sysvResult = LAPACK.sysv(A.array as ComplexType[][], B.array as ComplexType[][]);
                X = new MultiArray([sysvResult.length, sysvResult[0].length]);
                X.array = sysvResult;
                info = 0;
                solver = 'sysv';
            }
        } else {
            // --- General matrix ---
            const gesvResult = LAPACK.gesv(A.array as ComplexType[][], B.array as ComplexType[][]);
            X = new MultiArray([gesvResult.X.length, gesvResult.X[0].length]);
            X.array = gesvResult.X;
            info = gesvResult.info;
            solver = 'gesv';
        }
        return { X, info, solver };
    };

    /**
     * Generate a Householder reflector for a vector x (length m).
     * Produces tau, v (with v[0] = 1) and alpha (the value to write at x[0]).
     *
     * This is the vector-version of larfg. It does NOT read or write a matrix:
     * it only uses the vector x (ComplexType[]) and returns the reflector data.
     *
     * Conventions match LAPACK ZLARFG: alpha = -phi * ||x||, tau = (alpha - x0)/alpha,
     * v[0] = 1, v[i] = x[i] / (x0 - alpha) for i>=1. If sigma == 0 then tau = 0.
     */
    public static readonly larfg_original = (x: ComplexType[]): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const m = x.length;
        if (m === 0) {
            return { tau: Complex.zero(), v: [], phi: Complex.one(), alpha: Complex.zero() };
        }
        // x0 = x[0]
        const x0 = x[0];
        // sigma = sum_{i=1..m-1} |x[i]|^2
        let sigma = Complex.zero();
        for (let i = 1; i < m; i++) {
            const ai = Complex.abs(x[i]);
            Complex.mulAndSumTo(sigma, ai, ai); // sigma += |x[i]|^2
        }
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);
        if (m === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            // trivial reflector
            const tau = Complex.zero();
            const v: ComplexType[] = new Array(m);
            v[0] = Complex.one();
            for (let i = 1; i < m; i++) v[i] = Complex.zero();
            return { tau, v, phi, alpha: x0 };
        } else {
            // norm = sqrt(|x0|^2 + sigma)
            const norm = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
            const alpha = Complex.mul(Complex.neg(phi), norm);
            const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);
            const denom = Complex.sub(x0, alpha);
            const v: ComplexType[] = new Array(m);
            v[0] = Complex.one();
            for (let i = 1; i < m; i++) {
                v[i] = Complex.rdiv(x[i], denom);
            }
            return { tau, v, phi, alpha };
        }
    };

    /**
     * Reduce a Hermitian matrix A to real symmetric tridiagonal form T:
     *
     *     A = Q · T · Qᴴ
     *
     * using Householder reflectors, following exactly the LAPACK ZHETRD
     * unblocked algorithm (lower triangle variant).
     *
     * On exit:
     *   - diag[k]     = T[k,k]
     *   - offdiag[k]  = T[k+1,k]  (real in exact arithmetic)
     *   - taus[k]     = Householder scalar τₖ
     *
     * Storage convention (LAPACK-compatible):
     *   - The Householder vector vₖ is stored in A[k+1:n-1, k]
     *   - vₖ[0] = 1 is implicit (not stored)
     *
     * @param A    Hermitian matrix (n×n), modified in-place
     * @param her2_left_update Function that applies a reflector from the left (Hermitian-aware)
     */
    public static readonly sytrd = (
        A: MultiArray,
        her2_left_update: (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) => void,
    ): {
        diag: ComplexType[];
        offdiag: ComplexType[];
        taus: ComplexType[];
    } => {
        const n = A.dimension[0];

        const diag: ComplexType[] = new Array(n);
        const offdiag: ComplexType[] = new Array(n - 1);
        const taus: ComplexType[] = new Array(n - 1);

        // ZHETRD (lower triangle): for k = 0 .. n-2
        for (let k = 0; k < n - 1; k++) {
            /*
             * Generate Householder reflector Hₖ
             * to annihilate A[k+2:n-1, k]
             *
             * x = A[k+1:n-1, k]
             */
            const m = n - k - 1;
            const x: ComplexType[] = new Array(m);
            for (let i = 0; i < m; i++) {
                x[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
            }

            /*
             * [alpha, v, tau] = larfg(x)
             * LAPACK convention:
             *   v[0] = 1 (implicit)
             *   x is overwritten with v
             */
            const { alpha, v, tau } = LAPACK.larfg_original(x);

            taus[k] = tau;
            offdiag[k] = alpha;

            /*
             * Store v back into A
             * A[k+1, k] = alpha
             * A[k+2:n-1, k] = v[1:]
             */
            A.array[k + 1][k] = alpha;
            for (let i = 1; i < m; i++) {
                A.array[k + 1 + i][k] = v[i];
            }

            if (!Complex.realIsZero(Complex.abs(tau))) {
                /*
                 * Apply similarity transformation:
                 *
                 *   A ← Hₖᴴ · A · Hₖ
                 *
                 * but only to the trailing submatrix
                 *
                 *   A[k+1:n-1, k+1:n-1]
                 */

                /*
                 * First apply from the LEFT:
                 *   A ← Hₖᴴ · A
                 */
                her2_left_update(A, v, Complex.conj(tau), k + 1, k + 1);
            }

            // Diagonal element
            diag[k] = Complex.copy(A.array[k][k] as ComplexType);
        }

        // Last diagonal element
        diag[n - 1] = Complex.copy(A.array[n - 1][n - 1] as ComplexType);

        return { diag, offdiag, taus };
    };

    /**
     * Apply a Hermitian Householder reflector from the left:
     *
     * > `A := (I - tau * v * vᴴ) * A`
     *
     * Only the Hermitian trailing submatrix A[rowStart:, colStart:] is updated (Hermitian rank-2 update).
     *
     * v is assumed to satisfy v[0] = 1 and corresponds to rows starting at rowStart.
     *
     * 1. `w = tau * A * v`
     * 2. `alpha = -0.5 * tau * (vᴴ * w)`
     * 3. `w = w + alpha * v`
     * 4. `A = A - v*wᴴ - w*vᴴ`
     */
    public static readonly her2_zhtrd_update = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const colLen = v.length;
        // Compute w = tau * A * v
        const w: ComplexType[] = new Array(colLen);
        for (let i = 0; i < colLen; i++) {
            let sum = Complex.zero();
            for (let j = 0; j < colLen; j++) {
                Complex.mulAndSumTo(sum, A.array[rowStart + i][colStart + j] as ComplexType, v[j]);
            }
            w[i] = Complex.mul(tau, sum);
        }
        // Compute beta = vᴴ * w
        let beta = Complex.zero();
        for (let i = 0; i < colLen; i++) {
            Complex.mulAndSumTo(beta, Complex.conj(v[i]), w[i]);
        }
        // alpha = - 1/2 * tau * beta
        const alpha = Complex.mul(Complex.minusonediv2(), Complex.mul(tau, beta));
        // w = w + alpha * v  (note: difference in sign convention is implementation detail)
        for (let i = 0; i < colLen; i++) {
            Complex.mulAndSumTo(w[i], alpha, v[i]);
        }
        // A = A - (v*wᴴ + w*vᴴ)  (update Hermitian submatrix)
        for (let i = 0; i < colLen; i++) {
            for (let j = i; j < colLen; j++) {
                const update = Complex.add(Complex.mul(v[i], Complex.conj(w[j])), Complex.mul(w[i], Complex.conj(v[j])));
                const Ai = rowStart + i;
                const Aj = colStart + j;
                A.array[Ai][Aj] = Complex.sub(A.array[Ai][Aj] as ComplexType, update);
                if (i !== j) {
                    A.array[Aj][Ai] = Complex.conj(A.array[Ai][Aj] as ComplexType);
                }
            }
        }
    };

    public static readonly hetrd = (A: MultiArray) => LAPACK.sytrd(A, LAPACK.her2_zhtrd_update);

    /**
     * Generate the unitary matrix Q from a Hermitian tridiagonal reduction.
     *
     * This routine reconstructs
     *
     *     Q = H₀ H₁ ... Hₙ₋₂
     *
     * where each Householder reflector is
     *
     *     Hₖ = I − τₖ vₖ vₖᴴ
     *
     * with vₖ stored exactly as produced by sytrd (UPLO = 'L'):
     *
     *     vₖ = [1; A[k+2:n-1, k]]
     *
     * @param A   Matrix containing Householder vectors (output of sytrd)
     * @param TAU Householder scalar factors
     * @returns   Unitary matrix Q
     */
    public static readonly ungtr = (A: MultiArray, TAU: ComplexType[]): MultiArray => {
        const n = A.dimension[0];

        // Q ← I
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye([n, n]);

        // Apply reflectors in reverse order:
        // Q ← H₀ H₁ ... Hₙ₋₂
        // constructed as:
        // Q ← Hₖ Q   for k = n-2 ... 0
        for (let k = n - 2; k >= 0; k--) {
            const tau = TAU[k];
            if (!tau || Complex.realIsZero(Complex.abs(tau))) {
                continue;
            }

            const m = n - k - 1; // length of vₖ

            // Reconstruct vₖ
            const v: ComplexType[] = new Array(m);
            v[0] = Complex.one();
            for (let i = 1; i < m; i++) {
                v[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
            }

            /*
             * Apply Hₖ from the LEFT:
             *
             *   Q[k+1:n-1, :] ← (I − τ v vᴴ) Q[k+1:n-1, :]
             */

            // w = vᴴ · Q_sub
            const w: ComplexType[] = new Array(n);
            for (let j = 0; j < n; j++) {
                let sum = Complex.zero();
                for (let i = 0; i < m; i++) {
                    Complex.mulAndSumTo(sum, Complex.conj(v[i]), Q.array[k + 1 + i][j] as ComplexType);
                }
                w[j] = sum;
            }

            // Q_sub ← Q_sub − τ · v · w
            for (let i = 0; i < m; i++) {
                const scale = Complex.mul(tau, v[i]);
                for (let j = 0; j < n; j++) {
                    Q.array[k + 1 + i][j] = Complex.sub(Q.array[k + 1 + i][j] as ComplexType, Complex.mul(scale, w[j]));
                }
            }
        }

        return Q;
    };

    /**
     * Blocked reduction of a Hermitian matrix A to tridiagonal form
     * using LAPACK-style panel accumulation with matrix W.
     *
     * Householder vectors are stored in the lower triangle of A (v[0] at A[k+1,k])
     * taus[k] stores the scalar for the k-th reflector.
     *
     * @param A    Hermitian MultiArray (n x n), modified in-place
     * @param blockSize   block size (panel width)
     * @returns    { diag, offdiag, taus }
     */
    public static readonly sytrd_blocked_w = (
        A: MultiArray,
        blockSize?: number,
    ): {
        diag: ComplexType[];
        offdiag: ComplexType[];
        taus: ComplexType[];
    } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('sytrd_blocked_w: A must be square');
        const D: ComplexType[] = new Array(n);
        const E: ComplexType[] = new Array(n);
        const TAU: ComplexType[] = new Array(n);
        if (n === 0) return { diag: D, offdiag: E, taus: TAU };
        if (n === 1) {
            D[0] = A.array[0][0] as ComplexType;
            E[0] = Complex.zero();
            TAU[0] = Complex.zero();
            return { diag: D, offdiag: E, taus: TAU };
        }
        const block = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));
        for (let k0 = 0; k0 < n - 1; k0 += block) {
            const kb = Math.min(block, n - 1 - k0);
            // Allocate panel matrices
            const V: ComplexType[][] = new Array(n - k0 - 1);
            const W: ComplexType[][] = new Array(n - k0 - 1);
            for (let i = 0; i < n - k0 - 1; i++) {
                V[i] = new Array(kb).fill(Complex.zero());
                W[i] = new Array(kb).fill(Complex.zero());
            }
            // process columns inside the panel
            for (let kk = 0; kk < kb; kk++) {
                const k = k0 + kk;
                const colLen = n - k - 1;
                const x: ComplexType[] = new Array(colLen);
                for (let i = 0; i < colLen; i++) x[i] = A.array[k + 1 + i][k] as ComplexType;
                const res = LAPACK.larfg_original(x);
                const v: ComplexType[] = res.v;
                const tau_k: ComplexType = res.tau;
                const alpha: ComplexType = res.alpha;
                TAU[k] = tau_k;
                D[k] = A.array[k][k] as ComplexType;
                E[k] = alpha;
                // write v back into A
                for (let i = 0; i < colLen; i++) {
                    A.array[k + 1 + i][k] = v[i];
                    V[i][kk] = v[i]; // store in panel V
                }
                // compute W column for the panel
                if (!Complex.realIsZero(Complex.abs(tau_k))) {
                    for (let i = 0; i < colLen; i++) {
                        let wsum = Complex.zero();
                        for (let j = 0; j <= i; j++) {
                            wsum = Complex.add(wsum, Complex.mul(V[j][kk], Complex.conj(A.array[k + 1 + j][k + 1 + i] as ComplexType)));
                        }
                        W[i][kk] = Complex.mul(tau_k, wsum);
                    }
                }
            } // columns in panel
            // Update trailing submatrix using V*Wᴴ + W*Vᴴ
            for (let i = 0; i < n - k0 - 1; i++) {
                for (let j = i; j < n - k0 - 1; j++) {
                    let sumVW = Complex.zero();
                    let sumWV = Complex.zero();
                    for (let kk = 0; kk < kb; kk++) {
                        sumVW = Complex.add(sumVW, Complex.mul(V[i][kk], Complex.conj(W[j][kk])));
                        sumWV = Complex.add(sumWV, Complex.mul(W[i][kk], Complex.conj(V[j][kk])));
                    }
                    A.array[k0 + 1 + i][k0 + 1 + j] = Complex.sub(A.array[k0 + 1 + i][k0 + 1 + j] as ComplexType, Complex.add(sumVW, sumWV));
                    if (i !== j) A.array[k0 + 1 + j][k0 + 1 + i] = Complex.conj(A.array[k0 + 1 + i][k0 + 1 + j] as ComplexType);
                }
            }
        } // panels
        D[n - 1] = A.array[n - 1][n - 1] as ComplexType;
        E[n - 1] = Complex.zero();
        TAU[n - 1] = Complex.zero();
        return { diag: D, offdiag: E, taus: TAU };
    };

    /**
     * Construct a dense Hermitian matrix from its tridiagonal representation (diag, offdiag).
     *
     * Given:
     *  - diag[i]     = T(i,i)
     *  - offdiag[i]  = T(i,i+1)
     *
     * The resulting matrix satisfies:
     *  - T(i,i)       = diag[i]
     *  - T(i,i+1)     = offdiag[i]
     *  - T(i+1,i)     = conj(offdiag[i])
     *
     * @param diag    Main diagonal entries (length n)
     * @param offdiag Sub/superdiagonal entries (length n-1)
     * @returns       Dense Hermitian matrix T (n x n)
     */
    public static readonly tridiagonal_hermitian_to_dense = (diag: ComplexType[], offdiag: ComplexType[]): ComplexType[][] => {
        const n = diag.length;
        // Allocate n x n dense matrix initialized with zeros
        const T: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => Complex.zero()));
        for (let i = 0; i < n; i++) {
            // Main diagonal
            T[i][i] = Complex.copy(diag[i]);
            // First superdiagonal and subdiagonal
            if (i < n - 1) {
                // Upper diagonal element
                T[i][i + 1] = Complex.copy(offdiag[i]);
                // Lower diagonal element (Hermitian conjugate)
                T[i + 1][i] = Complex.conj(offdiag[i]);
            }
        }
        return T;
    };
    /**
     * Convert a complex Hermitian matrix into the equivalent real `2n x 2n`
     * block representation.
     *
     * For `H = A + iB`, this returns `[A -B; B A]`. The input is assumed to be
     * square and Hermitian; the routine does not revalidate symmetry.
     *
     * @param H Complex Hermitian matrix in row-major storage.
     * @returns Real block matrix represented with `ComplexType` real values.
     */
    public static readonly hermitian_to_real2n = (H: ComplexType[][]): ComplexType[][] => {
        const n = H.length;
        const R: ComplexType[][] = Array.from({ length: 2 * n }, (_) => Array.from({ length: 2 * n }));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const hij = H[i][j] as ComplexType;
                R[i][j] = Complex.real(hij); // A
                R[i][j + n] = Complex.neg(Complex.imag(hij)); // -B
                R[i + n][j] = Complex.imag(hij); // B
                R[i + n][j + n] = Complex.real(hij); // A
            }
        }
        return R;
    };

    /**
     * Reconstruct complex eigenvectors from a real `2n x 2n` eigenspace.
     *
     * The first `n` rows provide the real parts and the next `n` rows provide
     * the imaginary parts. Only the first `n` columns are consumed.
     *
     * @param Q Real block eigenvector matrix produced by the `2n` transform.
     * @returns Complex eigenvector matrix.
     */
    public static readonly real2n_to_complex_eigenvectors = (Q: ComplexType[][]): ComplexType[][] => {
        const n = Q.length / 2;
        const V: ComplexType[][] = Array.from({ length: n }, (_) => Array.from({ length: n }));
        for (let j = 0; j < n; j++) {
            // Column j.
            for (let i = 0; i < n; i++) {
                // Row i.
                const x = Q[i][j] as ComplexType;
                const y = Q[i + n][j] as ComplexType;
                V[i][j] = Complex.create(x.re, y.re);
            }
        }
        return V;
    };

    public static readonly real2n_to_complex_eigenvalues = (D2n: ComplexType[]): ComplexType[] => {
        const n = D2n.length / 2;
        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            const realPart = D2n[i].re; // da primeira metade
            const imagPart = D2n[i + n].re; // da segunda metade
            D[i] = Complex.create(realPart, imagPart);
        }
        return D;
    };

    /**
     * Cyclic Jacobi eigenvalue algorithm for real symmetric dense matrices.
     * Educational baseline. O(n³).
     * Not LAPACK DSTEQR.
     * @param T Symmetric real matrix (imag = 0).
     * @param maxSweeps Maximum number of Jacobi's sweeps (default = 1e3).
     * @param tol Target off-diagonal norm tolerance (default = 1e-14).
     * @returns An object containing two fields:
     *   - D: Eigenvalues.
     *   - V: Eigenvectors.
     */
    public static readonly jacobi_real_symmetric_dense = (
        T: ComplexType[][],
        maxSweeps: NumLikeType = 1e3,
        tol: NumLikeType = 1e-14,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        /* square matrix */
        const n = T.length;
        if (n === 0) return { D: [], V: [] };
        if (n === 1) return { D: [T[0][0]], V: [[Complex.one()]] };
        /* Initialize V = identity
         * Accumulator for eigenvectors (real) */
        const V: ComplexType[][] = LAPACK.eye([n, n]);
        /* Cyclic Jacobi with stable rotation formula (tau = (aqq-app)/(2*apq)) */
        for (let sweep = 0; sweep < toNumber(maxSweeps); sweep++) {
            let maxOff = Complex.zero();
            for (let p = 0; p < n - 1; p++) {
                for (let q = p + 1; q < n; q++) {
                    const tpq = T[p][q] as ComplexType;
                    maxOff = Complex.max(maxOff, Complex.abs(tpq));
                    if (Complex.realLessThan(Complex.abs(tpq), tol)) continue;
                    const tpp = T[p][p];
                    const tqq = T[q][q];
                    /* stable tau and t */
                    const denom = Complex.mul(Complex.two(), tpq);
                    /* avoid division by zero (if denom==0, skip) */
                    if (Complex.toBoolean(Complex.eq(denom, Complex.zero()))) continue;
                    const tau = Complex.rdiv(Complex.sub(tqq, tpp), denom);
                    const signTau = Complex.toBoolean(Complex.ge(tau, Complex.zero())) ? Complex.one() : Complex.minusone();
                    const t = Complex.rdiv(signTau, Complex.add(Complex.abs(tau), Complex.sqrt(Complex.add(Complex.one(), Complex.mul(tau, tau)))));
                    const c = Complex.rdiv(Complex.one(), Complex.sqrt(Complex.add(Complex.one(), Complex.mul(t, t))));
                    const s = Complex.mul(t, c);
                    /* Apply rotation to T */
                    for (let k = 0; k < n; k++) {
                        if (k !== p && k !== q) {
                            const tkp = T[k][p];
                            const tkq = T[k][q];
                            T[k][p] = Complex.sub(Complex.mul(c, tkp), Complex.mul(s, tkq));
                            T[p][k] = T[k][p];
                            T[k][q] = Complex.add(Complex.mul(s, tkp), Complex.mul(c, tkq));
                            T[q][k] = T[k][q];
                        }
                    }
                    T[p][p] = Complex.add(
                        Complex.sub(Complex.mul(Complex.mul(c, c), tpp), Complex.mul(Complex.mul(Complex.mul(Complex.two(), s), c), tpq)),
                        Complex.mul(Complex.mul(s, s), tqq),
                    );
                    T[q][q] = Complex.add(
                        Complex.add(Complex.mul(Complex.mul(s, s), tpp), Complex.mul(Complex.mul(Complex.mul(Complex.two(), s), c), tpq)),
                        Complex.mul(Complex.mul(c, c), tqq),
                    );
                    T[p][q] = Complex.zero();
                    T[q][p] = Complex.zero();
                    /* update V (columns p and q) */
                    for (let r = 0; r < n; r++) {
                        const vrp = V[r][p];
                        const vrq = V[r][q];
                        V[r][p] = Complex.sub(Complex.mul(c, vrp), Complex.mul(s, vrq));
                        V[r][q] = Complex.add(Complex.mul(s, vrp), Complex.mul(c, vrq));
                    }
                }
            }
            if (Complex.realLessThan(maxOff, tol)) break;
        }
        /* Extracts eigenvalues from the diagonal of T. */
        const D = LAPACK.from_diag(T);
        return { D, V };
    };

    /**
     * Jacobi cyclic for Hermitian matrices. `T` is mutated in-place during the algorithm.
     * @param T
     * @param maxSweeps
     * @param tol
     * @returns
     */
    public static readonly jacobi_symmetric_hermitian = (
        T: ComplexType[][],
        maxSweeps?: number,
        tol?: number,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        const n = T.length;
        const Z: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? Complex.create(1) : Complex.zero())));
        const eps = tol ?? 1e-12;
        const maxS = maxSweeps ?? Math.max(50, Math.floor(1000 / Math.max(1, n)));

        const offNorm = (M: ComplexType[][]) => {
            let sum = 0;
            for (let i = 0; i < n; i++)
                for (let j = i + 1; j < n; j++) {
                    const a = Complex.abs(M[i][j]);
                    const aval = Complex.realToNumber(a);
                    sum += aval * aval;
                }
            return Math.sqrt(sum);
        };

        for (let sweep = 0; sweep < maxS; sweep++) {
            let any = false;
            for (let p = 0; p < n - 1; p++) {
                for (let q = p + 1; q < n; q++) {
                    const apq = T[p][q];
                    if (Complex.realToNumber(Complex.le(Complex.abs(apq), Complex.create(eps)))) continue;
                    const app = T[p][p];
                    const aqq = T[q][q];

                    // Choose rotation using real parts (robust)
                    const real_apq = Complex.realToNumber(Complex.real(apq));
                    const real_app = Complex.realToNumber(Complex.real(app));
                    const real_aqq = Complex.realToNumber(Complex.real(aqq));
                    const phi = 0.5 * Math.atan2(2 * real_apq, real_aqq - real_app);
                    const c = Math.cos(phi);
                    const s = Math.sin(phi);

                    // update T (Hermitian) and accumulate Z
                    for (let k = 0; k < n; k++) {
                        if (k === p || k === q) continue;
                        const akp = T[k][p];
                        const akq = T[k][q];
                        T[k][p] = Complex.sub(Complex.mul(Complex.create(c), akp), Complex.mul(Complex.create(s), akq));
                        T[p][k] = Complex.conj(T[k][p]);
                        T[k][q] = Complex.add(Complex.mul(Complex.create(s), akp), Complex.mul(Complex.create(c), akq));
                        T[q][k] = Complex.conj(T[k][q]);
                    }

                    const new_app = Complex.add(Complex.sub(Complex.mul(Complex.create(c * c), app), Complex.mul(Complex.create(2 * s * c), apq)), Complex.mul(Complex.create(s * s), aqq));
                    const new_aqq = Complex.add(Complex.add(Complex.mul(Complex.create(s * s), app), Complex.mul(Complex.create(2 * s * c), apq)), Complex.mul(Complex.create(c * c), aqq));
                    T[p][p] = new_app;
                    T[q][q] = new_aqq;
                    T[p][q] = Complex.zero();
                    T[q][p] = Complex.zero();

                    // update Z (eigenvector accumulator)
                    for (let r = 0; r < n; r++) {
                        const zrp = Z[r][p];
                        const zrq = Z[r][q];
                        Z[r][p] = Complex.sub(Complex.mul(Complex.create(c), zrp), Complex.mul(Complex.create(s), zrq));
                        Z[r][q] = Complex.add(Complex.mul(Complex.create(s), zrp), Complex.mul(Complex.create(c), zrq));
                    }
                    any = true;
                }
            }
            if (!any) break;
            if (offNorm(T) <= eps) break;
        }

        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) D[i] = T[i][i];
        return { D, V: Z };
    };

    /**
     * Find the element with the highest magnitude in the column (pivot).
     * @param array Row-major order bidimensional MultiArray structure.
     * @param column Column to find the pivot.
     * @param rowStart Row start (to deal with multidimensional operations and functions). Default is `0`.
     * @param rowEnd Row end (to deal with multidimensional operations and functions). Default is `array.length`.
     * @returns An object containing:
     * - pivotRow - Row index of pivot element (relative to rowStart).
     * - pivotAbs - Absolute value of pivot.
     * - pivotIsZero - `true` if pivot element is zero (improbable null column.).
     */
    public static readonly column_pivot = (
        array: ComplexType[][],
        column: number,
        rowStart: number = 0,
        rowEnd: number = array.length,
    ): { pivotRow: number; pivotAbs: ComplexType; pivotIsZero: boolean } => {
        const absArray = array.slice(rowStart, rowEnd).map((row) => Complex.abs(row[column] as ComplexType));
        const pivotRow = absArray.reduce((iMax, x, i, arr) => (Complex.toBoolean(Complex.gt(x, arr[iMax])) ? i : iMax), 0);
        return {
            pivotRow,
            pivotAbs: absArray[pivotRow],
            pivotIsZero: Complex.realIsZero(absArray[pivotRow]),
        };
    };

    /**
     * Normalize eigenvector phases so that pivot element in each column becomes real positive.
     * Modifies V in-place (ComplexType[][]).
     * @param V
     * @param pivotPositive
     */
    public static readonly normalize_eigenvector_phases = (V: ComplexType[][], pivotPositive: boolean = true): void => {
        const n = V.length; // n rows
        const m = V[0].length; // m columns (columns = eigenvectors)
        for (let j = 0; j < m; j++) {
            // 1) Find the element with the highest magnitude. (pivot p = argmax_i |V[i][j]|)
            const { pivotRow, pivotAbs, pivotIsZero } = LAPACK.column_pivot(V as ComplexType[][], j);
            if (pivotIsZero) continue; // Improbable null column.
            // 2) Compute phase = pivot / |pivot|
            const pivot = V[pivotRow][j] as ComplexType;
            // phase = conj(pivot) / |pivot|
            let phase = Complex.rdiv(Complex.conj(pivot), pivotAbs);
            // 3) Ensure pivot becomes real positive (if flag pivotPositive is true): negate phase if pivot * phase < 0 (MATLAB/Octave compatibility).
            if (pivotPositive && Complex.realLessThan(Complex.mul(pivot, phase), 0)) {
                phase = Complex.neg(phase); // It negates the entire column (flip phase by pi).
            }
            // 4) apply phase correction to entire column j
            for (let i = 0; i < n; i++) {
                V[i][j] = Complex.mul(V[i][j] as ComplexType, phase);
            }
        }
    };

    public static readonly steqr_vectors = (
        diag: ComplexType[],
        offdiag: ComplexType[],
        maxIter: number = diag.length * 1e3,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
        complex: boolean;
    } => {
        const n = diag.length;
        /* Copy inputs */
        const Dwork = diag.map((z) => Complex.copy(z));
        const Ework = offdiag.map((z) => Complex.copy(z));
        Ework[n - 1] = Complex.zero();
        /* Detect complex Hermitian path */
        let needComplexPath = false;
        for (let i = 0; i < n; i++) {
            if (Complex.isComplexValue(Dwork[i]) || (i < n - 1 && Complex.isComplexValue(Ework[i]))) {
                needComplexPath = true;
                break;
            }
        }
        /* Phase factors u[] for Hermitian → real tridiagonal */
        const u: ComplexType[] = new Array(n);
        let Dreal = Dwork.slice();
        let Ereal = new Array<ComplexType>(n);
        if (needComplexPath) {
            u[0] = Complex.one();
            for (let i = 0; i < n - 1; i++) {
                const e = Ework[i];
                const absE = Complex.abs(e);
                if (Complex.realIsZero(absE)) {
                    u[i + 1] = Complex.copy(u[i]);
                } else {
                    const phase = Complex.rdiv(Complex.conj(e), absE);
                    u[i + 1] = Complex.mul(u[i], phase);
                }
            }
            for (let i = 0; i < n - 1; i++) {
                const t = Complex.mul(Complex.conj(u[i]), Complex.mul(Ework[i], u[i + 1]));
                Ereal[i] = Complex.abs(t);
            }
        } else {
            for (let i = 0; i < n - 1; i++) Ereal[i] = Complex.copy(Ework[i]);
        }
        Ereal[n - 1] = Complex.zero();
        /* Build dense real symmetric matrix */
        const T = LAPACK.tridiagonal_hermitian_to_dense(Dreal, Ereal);
        /* Jacobi eigensolver (principal algorithm) */
        const jac = LAPACK.jacobi_real_symmetric_dense(T, maxIter);
        let D = jac.D.map((z) => Complex.copy(z));
        let Vnum = jac.V.map((row) => row.map((z) => Complex.copy(z)));
        /* Recover complex eigenvectors if needed */
        if (needComplexPath) {
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    Vnum[r][c] = Complex.mul(u[r], Vnum[r][c]);
                }
            }
        }
        /* Sort eigenvalues and eigenvectors */
        const idx = D.map((v, i) => ({ v, i })).sort((a, b) => Complex.realToNumber(a.v) - Complex.realToNumber(b.v));
        const V: ComplexType[][] = Array.from({ length: n }, () => Array(n));
        const Dsorted = idx.map((x) => x.v);
        for (let c = 0; c < n; c++) {
            const oldc = idx[c].i;
            for (let r = 0; r < n; r++) {
                V[r][c] = Complex.copy(Vnum[r][oldc]);
            }
        }
        LAPACK.normalize_eigenvector_phases(V);
        return { D: Dsorted, V, complex: needComplexPath };
    };

    /**
     * Implicit-shift QR algorithm for Hermitian tridiagonal matrices.
     * LAPACK-style DSTEQR (conceptual equivalent).
     * O(n²).
     * Supports real and complex Hermitian cases via ComplexType.
     *
     * D: diagonal entries (Hermitian ⇒ real-valued, but kept as ComplexType)
     * E: subdiagonal entries (ComplexType, length n-1)
     */
    public static readonly steqr_vectors_tridiagonal = (D: ComplexType[], E: ComplexType[], maxIts: number = 1000): { D: ComplexType[]; V: ComplexType[][] } => {
        const n = D.length;

        // --- Trivial cases ---
        if (n === 0) return { D: [], V: [] };
        if (n === 1)
            return {
                D: [Complex.copy(D[0])],
                V: [[Complex.one()]],
            };

        // --- Copy working arrays (LAPACK uses in-place updates) ---
        const Dwork = D.map((d) => Complex.copy(d));
        const Ework = E.map((e) => Complex.copy(e));

        // --- Accumulator for eigenvectors ---
        const Z: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Complex.one() : Complex.zero())));

        const eps = Number.EPSILON || 2.220446049250313e-16;

        // --- Main iteration counter ---
        let iter = 0;

        // =========================================================
        // Main loop over unreduced blocks
        // =========================================================
        while (iter < maxIts) {
            // -----------------------------------------------------
            // Step 1: find unreduced block [l..m]
            // Deflation criterion: |E[k]| ≈ 0
            // -----------------------------------------------------
            let l = 0;
            while (l < n - 1 && Complex.realLessThanOrEqualTo(Complex.abs(Ework[l]), eps)) l++;
            if (l >= n - 1) break;

            // m = last index such that |Ework[m]| > eps and m+1 < n
            let m = l;
            while (m < n - 2 && Complex.realGreaterThan(Complex.abs(Ework[m]), eps)) m++;

            // Now work on block D[l..m+1], E[l..m]

            // -----------------------------------------------------
            // Step 2: Wilkinson shift (2×2 trailing block)
            // -----------------------------------------------------
            const d_mm1 = Dwork[m];
            const d_m = Dwork[m + 1];
            const e_m = Ework[m];

            // δ = (d_mm1 - d_m)/2
            const delta = Complex.mul(Complex.sub(d_mm1, d_m), Complex.create(0.5));

            // μ = d_m - sign(δ) * |e_m|² / (|δ| + sqrt(δ² + |e_m|²))
            const abs_delta = Complex.abs(delta);
            const abs_em2 = Complex.power(Complex.abs(e_m), Complex.two());

            const denom = Complex.add(abs_delta, Complex.sqrt(Complex.add(Complex.mul(abs_delta, abs_delta), abs_em2)));
            // const sign = Complex.realToNumber(Complex.real(delta)) >= 0 ? 1 : -1;
            const sign = Complex.realGreaterThanOrEqualTo(delta, 0) ? Complex.one() : Complex.minusone();

            const mu = Complex.sub(d_m, Complex.rdiv(Complex.mul(sign, abs_em2), denom));

            // -----------------------------------------------------
            // Step 3: Implicit QR sweep (Givens rotations)
            // -----------------------------------------------------
            let x = Complex.sub(Dwork[l], mu);
            let z = Ework[l];

            for (let k = l; k <= m; k++) {
                // Compute complex Givens rotation (c, s)
                const r = Complex.sqrt(Complex.add(Complex.power(Complex.abs(x), Complex.two()), Complex.power(Complex.abs(z), Complex.two())));

                if (Complex.realEquals(r, 0)) continue;

                const c = Complex.rdiv(x, r);
                const s = Complex.rdiv(z, r);

                // Apply rotation to D and E (local 2×2 update)
                const dk = Dwork[k];
                const dk1 = Dwork[k + 1];

                Dwork[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, dk)), Complex.mul(Complex.conj(s), Complex.mul(s, dk1)));

                Dwork[k + 1] = Complex.add(Complex.mul(Complex.conj(s), Complex.mul(s, dk)), Complex.mul(Complex.conj(c), Complex.mul(c, dk1)));

                Ework[k] = Complex.zero();

                // Prepare next x, z
                if (k < m) {
                    x = Ework[k];
                    z = Ework[k + 1];
                }

                // Accumulate rotation into Z
                for (let i = 0; i < n; i++) {
                    const zik = Z[i][k];
                    const zik1 = Z[i][k + 1];
                    Z[i][k] = Complex.sub(Complex.mul(c, zik), Complex.mul(s, zik1));
                    Z[i][k + 1] = Complex.add(Complex.mul(Complex.conj(s), zik), Complex.mul(c, zik1));
                }
            }

            iter++;
        }

        return {
            D: Dwork,
            V: Z,
        };
    };

    /**
     * Compute eigenvalues of a symmetric tridiagonal matrix T given by
     * diag[] and offdiag[].
     * @param diag      ComplexType[] - diagonal elements of T
     * @param offdiag   ComplexType[] - sub/super diagonal (e1...e[n-1])
     * @param maxIter   optional - default 1000*n
     * @returns
     */
    public static readonly steqr_values = (diag: ComplexType[], offdiag: ComplexType[], maxIter?: number): ComplexType[] => LAPACK.steqr_vectors(diag, offdiag, maxIter).D;

    /**
     * Reconstruct unitary/orthogonal matrix Q from the output of sytrd.
     * A is assumed to contain the Householder vectors in the strict lower
     * triangle in the same convention used by sytrd (v[0] stored at A[k+1,k]).
     *
     * @param A    MultiArray (n x n) as returned/modified by sytrd
     * @param taus ComplexType[] of length n (Householder scalars)
     * @returns    Q MultiArray (n x n) unitary/orthogonal
     */
    public static readonly orgtr = (A: MultiArray, taus: ComplexType[]): MultiArray => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('orgtr: A must be square');
        // Start with identity
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n); // reuse your helper that returns ComplexType[][] identity
        // Apply H_{n-2}, ..., H_0 (reverse order) to Q (left multiplication)
        for (let k = n - 2; k >= 0; k--) {
            // reconstruct v for step k: length = n - (k+1) = n-k-1
            const vlen = n - k - 1;
            const v: ComplexType[] = new Array(vlen);
            // v[0] is stored at A[k+1, k]
            for (let i = 0; i < vlen; i++) {
                v[i] = A.array[k + 1 + i][k] as ComplexType;
            }
            // ensure v[0] == 1. In sytrd we wrote v[0]=1 there, so this holds.
            const tau_k = taus[k];
            if (Complex.realIsZero(Complex.abs(tau_k))) {
                // trivial reflector, skip
                continue;
            }
            // apply H = I - tau * v * vᴴ to Q on rows rowStart..n-1 and all columns
            LAPACK.larf_left(Q, v, tau_k, k + 1, 0);
        }
        MultiArray.setType(Q);
        return Q;
    };

    /**
     * Blocked reconstruction of Q from the Householder vectors stored by sytrd_blocked.
     * Mirrors orgtr but applies reflectors in reverse order and uses block application
     * to exploit locality.
     *
     * @param A    MultiArray after sytrd_blocked (n x n) containing stored v in lower triangle
     * @param taus ComplexType[] as returned by sytrd_blocked
     * @param blockSize   block size matching the one used in sytrd_blocked (default 32)
     * @returns     Q MultiArray (n x n) unitary/orthogonal
     */
    public static readonly orgtr_blocked = (A: MultiArray, taus: ComplexType[], blockSize?: number): MultiArray => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('orgtr_blocked: A must be square');
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        const block = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));
        // Apply reflectors H_{n-2}, ..., H_0 (reverse order)
        for (let k0 = n - 2 - ((n - 2) % block); k0 >= 0; k0 -= block) {
            // process a panel of reflectors starting at k0 (panel width = block)
            const kb = Math.min(block, n - 1 - k0);
            // apply reflectors in reverse order inside the panel
            for (let kk = kb - 1; kk >= 0; kk--) {
                const k = k0 + kk;
                const vlen = n - k - 1;
                if (vlen <= 0) continue;
                // reconstruct v from A: v[i] = A[k+1+i, k] for i=0..vlen-1
                const v: ComplexType[] = new Array(vlen);
                for (let i = 0; i < vlen; i++) v[i] = A.array[k + 1 + i][k] as ComplexType;
                const tau_k = taus[k];
                if (Complex.realIsZero(Complex.abs(tau_k))) continue;
                // apply H = I - tau * v * vᴴ to Q (rows k+1..n-1, all cols) using blocked left-application
                LAPACK.larf_left_block(Q, v, tau_k, k + 1, 0, block);
            }
            // move to previous panel start
            if (k0 === 0) break;
            // compute next panel start (previous block)
            // ensure loop control correct: subtract block but stop at 0
            // the for loop header already handles stepping by -block
        }
        // if there are remaining reflectors before the first aligned panel start (< block),
        // process them (k from (firstPanelStart-1) downto 0)
        const firstPanelStart = 0; // we processed down to zero in loop; this is safe
        MultiArray.setType(Q);
        return Q;
    };

    /**
     * Reconstruct Q from the output of sytrd_blocked_w (Hermitian to tridiagonal reduction)
     * using LAPACK-style blocked panel accumulation with matrix W.
     *
     * @param A     MultiArray containing Householder vectors in lower triangle
     * @param taus  ComplexType[] scalars for each reflector (from sytrd_blocked_w)
     * @param blockSize    block size (panel width, same as sytrd_blocked_w)
     * @returns     Q unitary MultiArray (n x n)
     */
    public static readonly orgtr_blocked_w = (A: MultiArray, taus: ComplexType[], blockSize?: number): MultiArray => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('orgtr_blocked_w: A must be square');
        // Initialize Q as identity
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        const block = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));
        for (let k0 = n - 2; k0 >= 0; k0 -= block) {
            const kb = Math.min(block, k0 + 1);
            // Allocate panel matrices
            const V: ComplexType[][] = new Array(n - k0 - 1);
            const W: ComplexType[][] = new Array(n - k0 - 1);
            for (let i = 0; i < n - k0 - 1; i++) {
                V[i] = new Array(kb).fill(Complex.zero());
                W[i] = new Array(kb).fill(Complex.zero());
            }
            // Extract Householder vectors into panel V
            for (let kk = 0; kk < kb; kk++) {
                const k = k0 - kb + 1 + kk;
                const len = n - k - 1;
                for (let i = 0; i < len; i++) {
                    V[i][kk] = A.array[k + 1 + i][k] as ComplexType;
                }
            }
            // Accumulate W columns for the panel
            for (let kk = 0; kk < kb; kk++) {
                const k = k0 - kb + 1 + kk;
                const tau_k = taus[k];
                const len = n - k - 1;
                if (Complex.realIsZero(Complex.abs(tau_k))) continue;
                for (let i = 0; i < len; i++) {
                    let wsum = Complex.zero();
                    for (let j = 0; j <= i; j++) {
                        wsum = Complex.add(wsum, Complex.mul(V[j][kk], Complex.conj(Q.array[k + 1 + j][k + 1 + i] as ComplexType)));
                    }
                    W[i][kk] = Complex.mul(tau_k, wsum);
                }
            }
            // Apply block update to Q: Q := Q - V*Wᴴ - W*Vᴴ
            for (let i = 0; i < n - k0 - 1; i++) {
                for (let j = 0; j < n; j++) {
                    let sumVW = Complex.zero();
                    let sumWV = Complex.zero();
                    for (let kk = 0; kk < kb; kk++) {
                        sumVW = Complex.add(sumVW, Complex.mul(V[i][kk], Complex.conj(W[j - k0 - 1 + i]?.[kk] ?? Complex.zero())));
                        sumWV = Complex.add(sumWV, Complex.mul(W[i][kk], Complex.conj(V[j - k0 - 1 + i]?.[kk] ?? Complex.zero())));
                    }
                    Q.array[k0 + 1 + i][j] = Complex.sub(Q.array[k0 + 1 + i][j] as ComplexType, Complex.add(sumVW, sumWV));
                }
            }
        }
        return Q;
    };

    public static readonly eig_symmetric = (
        A: MultiArray,
        computeVectors = false,
    ): {
        D: MultiArray;
        V?: MultiArray;
    } => {
        const n = A.dimension[0];
        const Acopy = MultiArray.copy(A);
        // Hermitian reduction to tridiagonal form.
        const { diag, offdiag, taus } = LAPACK.hetrd(Acopy);
        if (computeVectors) {
            // Reconstruct Q from the reduction vectors.
            let Q = LAPACK.ungtr(Acopy, taus);
            // Solve the tridiagonal problem. ZSTEQR semantics: Q := Q * Z.
            const { D, V } = LAPACK.steqr_vectors(diag, offdiag);
            // Multiply Q by the tridiagonal eigenvectors.
            const vectors = new MultiArray([V.length, V[0].length]);
            vectors.array = V;
            Q = LAPACK.mtimes(Q, vectors);
            return { D: MultiArray.toDiagonalMatrix(D), V: Q };
        } else {
            // Eigenvalues only.
            return { D: MultiArray.toColumnVector(LAPACK.steqr_vectors(diag, offdiag).D) };
        }
    };

    public static readonly eig_hermitian = (
        A: MultiArray,
        computeVectors = false,
    ): {
        D: MultiArray;
        V?: MultiArray;
    } => {
        const n = A.dimension[0];
        const Acopy = MultiArray.copy(A);
        // Detect whether the matrix has any nonzero imaginary part.
        let isComplex = false;
        for (let i = 0; i < n && !isComplex; i++) {
            for (let j = 0; j < n; j++) {
                const aij = Acopy.array[i][j] as ComplexType;
                if (!Complex.imagIsZero(aij)) {
                    isComplex = true;
                    break;
                }
            }
        }
        if (isComplex) {
            // Case 1: complex Hermitian matrix, ZHETRD-style.
            const { diag, offdiag, taus } = LAPACK.hetrd(Acopy);
            if (!computeVectors) {
                const { D } = LAPACK.steqr_vectors(diag, offdiag);
                return { D: MultiArray.toColumnVector(D) };
            }
            // Reconstruct complex Q.
            let Q = LAPACK.ungtr(Acopy, taus);
            console.log('Q =', Q);
            // Solve the real tridiagonal problem.
            const { D, V } = LAPACK.steqr_vectors(diag, offdiag);
            // Multiply Q by the tridiagonal eigenvectors.
            const Z = new MultiArray([n, n]);
            Z.array = V;
            Q = LAPACK.mtimes(Q, Z);
            return { D: MultiArray.toDiagonalMatrix(D), V: Q };
        } else {
            // Case 2: real symmetric matrix.
            const { diag, offdiag, taus } = LAPACK.hetrd(Acopy);
            if (!computeVectors) {
                const { D } = LAPACK.steqr_vectors(diag, offdiag);
                return { D: MultiArray.toColumnVector(D) };
            }
            let Q = LAPACK.ungtr(Acopy, taus); // taus are not used in the real case.
            const { D, V } = LAPACK.steqr_vectors(diag, offdiag);
            const Z = new MultiArray([n, n]);
            Z.array = V;
            Q = LAPACK.mtimes(Q, Z);
            return { D: MultiArray.toDiagonalMatrix(D), V: Q };
        }
    };

    public static readonly functions: { [F in keyof LAPACK]: Function } = {
        is_hermitian: LAPACK.is_hermitian,
        is_positive_definite: LAPACK.is_positive_definite,
        laswp: LAPACK.laswp,
        laswp_rows: LAPACK.laswp_rows,
        laswp_cols: LAPACK.laswp_cols,
        eye: LAPACK.eye,
        fillFactory: LAPACK.fillFactory,
        zeros: LAPACK.zeros,
        ones: LAPACK.ones,
        diag: LAPACK.diag,
        from_diag: LAPACK.from_diag,
        lassq: LAPACK.lassq,
        lange: LAPACK.lange,
        triu_inplace: LAPACK.triu_inplace,
        tril_inplace: LAPACK.tril_inplace,
        trsm_left_upper_block: LAPACK.trsm_left_upper_block,
        lapmt_matrix: LAPACK.lapmt_matrix,
        lapmt_apply: LAPACK.lapmt_apply,
        dotc_col: LAPACK.dotc_col,
        dotc_row: LAPACK.dotc_row,
        larfg: LAPACK.larfg,
        larf: LAPACK.larf,
        geqr2: LAPACK.geqr2,
        geqp2: LAPACK.geqp2,
        geqp3: LAPACK.geqp3,
        gelq2: LAPACK.gelq2,
        orgqr: LAPACK.orgqr,
        orglq: LAPACK.orglq,
        getf2: LAPACK.getf2,
        getrf: LAPACK.getrf,
        getrf_blocked: LAPACK.getrf_blocked,
        gemm_blocked: LAPACK.gemm_blocked,
        getrs: LAPACK.getrs,
        gesv: LAPACK.gesv,
        posv: LAPACK.posv,
        potrf: LAPACK.potrf,
        sysv: LAPACK.sysv,
        mldivide: LAPACK.mldivide,
        sytrd: LAPACK.sytrd,
        her2_zhtrd_update: LAPACK.her2_zhtrd_update,
        hetrd: LAPACK.hetrd,
        ungtr: LAPACK.ungtr,
        sytrd_blocked_w: LAPACK.sytrd_blocked_w,
        tridiagonal_hermitian_to_dense: LAPACK.tridiagonal_hermitian_to_dense,
        hermitian_to_real2n: LAPACK.hermitian_to_real2n,
        real2n_to_complex_eigenvectors: LAPACK.real2n_to_complex_eigenvectors,
        real2n_to_complex_eigenvalues: LAPACK.real2n_to_complex_eigenvalues,
        jacobi_real_symmetric_dense: LAPACK.jacobi_real_symmetric_dense,
        jacobi_symmetric_hermitian: LAPACK.jacobi_symmetric_hermitian,
        column_pivot: LAPACK.column_pivot,
        normalize_eigenvector_phases: LAPACK.normalize_eigenvector_phases,
        steqr_vectors: LAPACK.steqr_vectors,
        steqr_vectors_tridiagonal: LAPACK.steqr_vectors_tridiagonal,
        steqr_values: LAPACK.steqr_values,
        orgtr: LAPACK.orgtr,
        orgtr_blocked: LAPACK.orgtr_blocked,
        orgtr_blocked_w: LAPACK.orgtr_blocked_w,
        eig_symmetric: LAPACK.eig_symmetric,
        eig_hermitian: LAPACK.eig_hermitian,
    };
}

export type { ElementType };
export { LAPACK, EXPECT_TOL };
export default { LAPACK };
