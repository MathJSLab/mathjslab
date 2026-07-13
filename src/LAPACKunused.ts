import { Complex, ComplexType, NumLikeType, toNumber } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';
import { MathOperation } from './MathOperation';
import { LinearAlgebra } from './LinearAlgebra';
import { Interpreter } from './Interpreter';
import { LAPACK } from './LAPACK';

type larfHandler = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) => void;

type Jacobi2x2Result = {
    c: number;
    s: ComplexType; // s complexo já com a fase
};

type JacobiHandler = (
    T: MultiArray,
    maxSweeps: number,
    tol: number,
) => {
    D: ComplexType[];
    V: MultiArray;
};

type JacobiHermitian = (
    T: ComplexType[][],
    maxSweeps?: number,
    tol?: number,
) => {
    D: ComplexType[];
    V: ComplexType[][];
};

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
 * ## References
 * - https://en.wikipedia.org/wiki/LAPACK
 * - https://www.netlib.org/lapack/
 * - https://github.com/Reference-LAPACK/lapack
 */
abstract class LAPACKunused {
    /**
     * `LAPACK` default settings.
     */
    public static readonly defaultSettings: LAPACKConfig = Object.assign({}, defaultSettings as LAPACKConfig);

    /**
     * `LAPACK` current settings.
     */
    public static readonly settings: LAPACKConfig = LAPACKunused.defaultSettings;

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
     * Apply a sequence of row interchanges to a MultiArray.
     * LAPACK-like signature: laswp(A, k1, k2, ipiv, incx, colStart = 0, colEnd = numCols-1)
     * @param A Multidimensional matrix.
     * @param k1 1-based start index of rows to process (inclusive).
     * @param k2 1-based end index of rows to process (inclusive).
     * @param ipiv Integer array of pivot indices (LAPACK convention: 1-based). The routine will auto-detect if ipiv looks 0-based and adapt.
     * @param incx Increment (typically +1 or -1). When incx > 0 loop i=k1..k2 step incx; when incx<0 loop i=k1..k2 step incx.
     * @param colStart Optional 0-based column start to which the swaps are applied (inclusive).
     * @param colEnd Optional 0-based column end to which the swaps are applied (inclusive).
     * @returns
     */
    public static readonly laswp = (A: MultiArray, k1: number, k2: number, ipiv: number[], incx: number, colStart?: number, colEnd?: number): void => {
        const d0 = A.dimension[0]; // rows per page (first dimension)
        const d1 = A.dimension[1]; // cols
        const totalPages = A.dimension.length === 2 ? 1 : A.dimension.slice(2).reduce((p, c) => p * c, 1);
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
                        const tmp = A.array[r1][j];
                        A.array[r1][j] = A.array[r2][j];
                        A.array[r2][j] = tmp;
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
                        const tmp = A.array[r1][j];
                        A.array[r1][j] = A.array[r2][j];
                        A.array[r2][j] = tmp;
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
    public static readonly laswp_rows = (M: MultiArray, row1: number, row2: number): void => {
        const k1 = row1 + 1; // LAPACK 1-based
        const k2 = k1; // somente uma linha
        const ipiv = [];
        ipiv[k1 - 1] = row2 + 1; // LAPACK 1-based
        LAPACKunused.laswp(M, k1, k2, ipiv, +1);
    };

    /**
     * Swap two columns of an N-dimensional MultiArray across all pages in
     * place. There is no direct equivalent to LAPACK, but it is symmetrical
     * to `laswp_rows`.
     * @param M Matrix.
     * @param col1 First column index to swap.
     * @param col2 Second column index to swap.
     */
    public static readonly laswp_cols = (M: MultiArray, col1: number, col2: number): void => {
        const dim = M.dimension;
        const d0 = dim[0];
        const totalPages = dim.length === 2 ? 1 : dim.slice(2).reduce((a, b) => a * b, 1);
        const totalRows = d0 * totalPages;
        for (let i = 0; i < totalRows; i++) {
            const tmp = M.array[i][col1];
            M.array[i][col1] = M.array[i][col2];
            M.array[i][col2] = tmp;
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
    public static readonly eye = (...dims: any[]): ComplexType[][] => {
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
    public static readonly zeros = (...dims: any[]): ComplexType[][] => {
        const fullDims: number[] = dims.flat();
        return Array.from({ length: fullDims[0] * fullDims.slice(2).reduce((p, c) => p * c, 1) }, (_) => Array.from({ length: fullDims[1] }, (_) => Complex.zero()));
    };

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
    public static readonly trsm_left_upper_block = (A: MultiArray, k: number, kb: number): void => {
        const n = A.dimension[1];
        // For each column of the right block
        for (let col = k + kb; col < n; col++) {
            // Solve U * x = b, where U is k..k+kb-1
            for (let i = kb - 1; i >= 0; i--) {
                const row = k + i;
                // b = A[row, col] - sum_{p=i+1..kb-1} U[i,p]*x[p]
                let acc = A.array[row][col] as ComplexType;
                for (let p = i + 1; p < kb; p++) {
                    const Up = A.array[row][k + p] as ComplexType; // U[i,p]
                    const xp = A.array[k + p][col] as ComplexType; // x[p]
                    acc = Complex.sub(acc, Complex.mul(Up, xp));
                }
                // divide by diag U[i,i]
                const diag = A.array[row][k + i] as ComplexType; // U[i,i]
                A.array[row][col] = Complex.rdiv(acc, diag);
            }
        }
    };

    /**
     *
     * @param jpvt
     * @returns
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
     * ## LAPACK.larfg (complex)
     * Construct a complex Householder reflector H = I - tau * v * vᴴ
     * such that:
     *
     *      H * [ alpha ] = [ beta ]
     *          [   x   ]   [  0   ]
     *
     * v is stored as:
     *      v[0] = 1
     *      v[1:] overwrites x
     *
     * This implementation is faithful to LAPACK ZLARFG.
     *
     * @param alpha Complex scalar (modified in-place to beta)
     * @param x Vector below alpha (modified in-place to v[1:])
     * @returns beta as alpha and tau both Complex scalar
     */
    // public static larfg_complex(
    //     alpha: ComplexType,
    //     x: ComplexType[]
    // ): {
    //     alpha: ComplexType,
    //     tau: ComplexType
    // } {
    //     const n = x.length;
    //     // Compute ||x||₂
    //     let xnorm = Complex.zero();
    //     for (let i = 0; i < n; i++) {
    //         const xi = x[i];
    //         const abs = Complex.abs(xi);
    //         Complex.mulAndSumTo(xnorm, abs, abs);
    //     }
    //     xnorm = Complex.sqrt(xnorm);

    //     // If x is zero and alpha is real, reflector is identity
    //     if (Complex.realIsZero(xnorm) && Complex.imagIsZero(alpha)) {
    //         return { alpha, tau: Complex.zero() };
    //     }

    //     const alphaAbs = Complex.abs(alpha);

    //     // beta = -exp(i*arg(alpha)) * sqrt(|alpha|^2 + ||x||^2)
    //     const norm = Complex.sqrt(Complex.add(Complex.mul(alphaAbs, alphaAbs), Complex.mul(xnorm, xnorm)));

    //     let beta: ComplexType;
    //     if (Complex.realIsZero(alphaAbs)) {
    //         // alpha = 0 → beta = -norm
    //         beta = Complex.real(Complex.neg(norm));
    //     } else {
    //         // exp(i*arg(alpha)) = alpha / |alpha|
    //         const phase = Complex.rdiv(alpha, Complex.real(alphaAbs));
    //         beta = Complex.mul(Complex.neg(phase), Complex.real(norm));
    //     }

    //     // tau = (beta - alpha) / beta
    //     const tau = Complex.rdiv(
    //         Complex.sub(beta, alpha),
    //         beta
    //     );

    //     // Scale x ← x / (alpha - beta)
    //     const denom = Complex.sub(alpha, beta);
    //     for (let i = 0; i < n; i++) {
    //         x[i] = Complex.rdiv(x[i], denom);
    //     }

    //     // Returns beta in alpha
    //     return { alpha: beta, tau };
    // }

    public static larfg_complex(
        alpha: ComplexType,
        x: ComplexType[],
    ): {
        alpha: ComplexType;
        tau: ComplexType;
    } {
        const n = x.length;

        // ||x||₂
        let xnorm2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            const absxi = Complex.abs(x[i]);
            Complex.mulAndSumTo(xnorm2, absxi, absxi);
        }
        const xnorm = Complex.sqrt(xnorm2);

        // Caso trivial: x = 0 e alpha real
        if (Complex.realIsZero(xnorm) && Complex.imagIsZero(alpha)) {
            return { alpha, tau: Complex.zero() };
        }

        const alphaAbs = Complex.abs(alpha);
        const alphaAbs2 = Complex.mul(alphaAbs, alphaAbs);

        // norm = sqrt(|alpha|^2 + ||x||^2)
        const norm = Complex.sqrt(Complex.add(alphaAbs2, Complex.mul(xnorm, xnorm)));

        // beta = − sign(alpha) * norm
        let beta: ComplexType;
        if (Complex.realIsZero(alphaAbs)) {
            // alpha = 0 → beta = −norm (real)
            beta = Complex.neg(norm);
        } else {
            const sign = Complex.rdiv(alpha, alphaAbs); // COMPLEXO
            beta = Complex.neg(Complex.mul(sign, norm));
        }

        // tau = (beta − alpha) / beta
        const tau = Complex.rdiv(Complex.sub(beta, alpha), beta);

        // x ← x / (alpha − beta)
        const denom = Complex.sub(alpha, beta);
        for (let i = 0; i < n; i++) {
            x[i] = Complex.rdiv(x[i], denom);
        }

        // alpha retorna como beta
        return { alpha: beta, tau };
    }

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
    public static readonly larfg_vector = (x: ComplexType[]): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
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
     * ## `LAPACK.larfg_left`
     * LAPACK-style LARFG - Compute Householder vector and tau for complex
     * vectors `x = A[k:m-1, k]`. It's a complex householder generator for
     * left-side application. Generates `tau`, `v`, `phi` and `alpha` for
     * `H = I - tau*v*vᴴ`.
     * ### Notes:
     * - Uses `BLAS.dotc_col(A, k, k)` to compute `sigma = sum_{i>k} |x_i|^2`.
     * - Follows the ZLARFG convention (`alpha = -phi * ||x||`, with `phi = x0/|x0|` when `x0!=0`).
     *
     * NOTE: v is returned unscaled; callers (geqr2/geqp2/geqp3) are responsible for storing tau * v if needed.
     *
     * @param A Target MultiArray (only used for shape reference).
     * @param m Number of rows
     * @param k Start index of reflector
     * @returns object { tau, v, phi, alpha } where:
     * - `v` is a ComplexType[] with `v[0] = 1` and `length = m-k`.
     * - `tau` is ComplexType.
     * - `phi` is ComplexType.
     * - `alpha` is the resulting leading value (the value that replaces `A[k,k]`)
     */
    public static readonly larfg_left = (A: MultiArray, dim: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = dim - k;
        // x0 = A[k,k]
        const x0 = A.array[k][k] as ComplexType;
        // sigma = sum |x[i]|^2 for i=k+1..m-1
        const sigma = LAPACK.dotc_col(A, k, k);
        // phi = x0 / |x0|  if x0 != 0, otherwise phi = 1 (LAPACK convention)
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            // If sigma == 0 and x0 is real and >=0, tau = 0, v = [1,0,...]
            const tau = Complex.zero();
            const v: ComplexType[] = new Array(len);
            v[0] = Complex.one();
            for (let i = 1; i < len; i++) {
                v[i] = Complex.zero();
            }
            return { tau, v, phi, alpha: x0 };
        } else {
            // norm(x) = sqrt(|x0|^2 + sigma)
            const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
            // alpha = - phi * norm(x)
            const alpha = Complex.mul(Complex.neg(phi), normx);
            // tau = (alpha - x0) / alpha
            const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);
            // denom = x0 - alpha
            const denom = Complex.sub(x0, alpha);
            // v[0]=1, v[i] = A.array[k + i][k] / denom
            const v: ComplexType[] = new Array(len);
            v[0] = Complex.one();
            for (let i = 1; i < len; i++) {
                v[i] = Complex.rdiv(A.array[k + i][k] as ComplexType, denom);
            }
            return { tau, v, phi, alpha };
        }
    };

    /**
     * LAPACK-style LARFG - build a Householder reflector acting **on the right** (row-wise).
     *
     * Computes tau, v, phi, alpha for the row vector
     *    x = A[k, k:n-1]ᵀ
     *
     * Generates H = I - tau * v * vᴴ such that H * x = [alpha, 0, ...].
     *
     * Householder conventions follow LAPACK ZLARFG:
     *   - alpha = -phi * ||x||, phi = x0/|x0| if x0!=0, else 1
     *   - tau = (alpha - x0)/alpha
     *   - v[0] = 1, v[j>0] = x[j] / (x0 - alpha)
     *
     * @param A MultiArray (row-wise target)
     * @param n number of columns
     * @param k start index of reflector (column)
     * @returns { tau, v, phi, alpha }:
     *   - v: ComplexType[] with v[0]=1, length = n-k
     *   - tau: ComplexType
     *   - phi: ComplexType
     *   - alpha: ComplexType (replaces A[k][k])
     */
    public static readonly larfg_right = (A: MultiArray, n: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = n - k;
        const x0 = A.array[k][k] as ComplexType;

        // sigma = sum_{j>0} |x_j|^2 (row version)
        let sigma = Complex.zero();
        for (let j = 1; j < len; j++) {
            const xj = A.array[k][k + j] as ComplexType;
            sigma = Complex.add(sigma, Complex.mul(xj, Complex.conj(xj)));
        }

        // phi = x0/|x0| if x0 != 0, else 1
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);

        // Handle special cases: length=1 or sigma=0
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            const tau = Complex.zero();
            const v: ComplexType[] = new Array(len).fill(Complex.zero());
            v[0] = Complex.one();
            return { tau, v, phi, alpha: x0 };
        }

        // General case
        const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
        const alpha = Complex.mul(Complex.neg(phi), normx);
        const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);

        // Build v
        const v: ComplexType[] = new Array(len);
        v[0] = Complex.one();
        const denom = Complex.sub(x0, alpha);
        for (let j = 1; j < len; j++) {
            v[j] = Complex.rdiv(A.array[k][k + j] as ComplexType, denom);
        }

        return { tau, v, phi, alpha };
    };

    /**
     * ## LAPACK.larfg
     *
     * Generates a LAPACK-style Householder reflector H such that:
     *
     *   H = I - tau * v * vᴴ
     *
     * where:
     *   - For side = 'L' (left):  H * x = [alpha, 0, ..., 0]ᵀ
     *   - For side = 'R' (right): x * H = [alpha, 0, ..., 0]
     *
     * The vector x is extracted from matrix A starting at index `k`:
     *   - side = 'L': x = A[k:m-1, k] (column)
     *   - side = 'R': x = A[k, k:n-1] (row)
     *
     * The Householder vector `v` is returned as a 1D array (ComplexType[]).
     * It is the caller's responsibility to interpret it as a column or row vector:
     *   - side = 'L' → v is conceptually a column vector
     *   - side = 'R' → v is conceptually a row vector
     *
     * ### LAPACK ZLARFG conventions
     * - phi = x0 / |x0|   if x0 != 0, else 1
     * - alpha = -phi * ||x||_2
     * - tau = (alpha - x0) / alpha
     * - v[0] = 1
     *
     * Special case:
     * - If the tail of x is zero (sigma = 0), tau = 0 and H = I (identity reflector)
     *
     * @param side 'L' for left (column-wise) or 'R' for right (row-wise) application
     * @param A Target matrix (MultiArray)
     * @param dim Dimension of the subvector (m for 'L', n for 'R')
     * @param k Start index of the reflector in A
     * @returns Object containing:
     *   - `tau` (ComplexType): scalar factor of the reflector
     *   - `v` (ComplexType[]): Householder vector with v[0] = 1
     *   - `phi` (ComplexType): phase factor used to define alpha
     *   - `alpha` (ComplexType): resulting leading element after applying H
     *
     * ### Notes
     * - `v` is always normalized such that v[0] = 1; the remaining entries are scaled accordingly.
     * - The caller decides whether `v` is treated as a column or row vector when constructing H.
     * - Follows LAPACK-style handling of complex vectors.
     */
    public static readonly larfg_old = (side: 'L' | 'R', A: MultiArray, dim: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = dim - k;
        // x0 = A[k,k]
        const x0 = A.array[k][k] as ComplexType;
        // phi = x0 / |x0|  if x0 != 0, otherwise phi = 1 (LAPACK convention)
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);
        const sigma =
            side === 'L'
                ? // sigma = sum |x[i]|^2 for i=k+1..m-1
                  LAPACK.dotc_col(A, k, k)
                : // sigma = sum_{j>0} |x_j|^2
                  LAPACK.dotc_row(A, k, k);
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            // If sigma == 0 and x0 is real and >=0, tau = 0, v = [1,0,...]
            const tau = Complex.zero();
            const v: ComplexType[] = new Array(len).fill(Complex.zero());
            v[0] = Complex.one();
            return { tau, v, phi, alpha: x0 };
        }
        // norm(x) = sqrt(|x0|^2 + sigma)
        const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
        // alpha = - phi * norm(x)
        const alpha = Complex.mul(Complex.neg(phi), normx);
        // tau = (alpha - x0) / alpha
        const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);
        // denom = x0 - alpha
        const denom = Complex.sub(x0, alpha);
        // v[0]=1, v[i] = A.array[k + i][k] / denom
        const v: ComplexType[] = new Array(len);
        v[0] = Complex.one();
        if (side === 'L') {
            for (let i = 1; i < len; i++) {
                v[i] = Complex.rdiv(A.array[k + i][k] as ComplexType, denom);
            }
        } else {
            for (let j = 1; j < len; j++) {
                v[j] = Complex.rdiv(A.array[k][k + j] as ComplexType, denom);
            }
        }
        return { tau, v, phi, alpha };
    };

    public static readonly larfgLQ = (A: MultiArray, k: number, n: number): { tau: ComplexType; v: ComplexType[]; alpha: ComplexType } => {
        const len = n - k;
        const x: ComplexType[] = new Array(len);

        // Extrai linha da matriz
        x[0] = A.array[k][k] as ComplexType;
        for (let j = 1; j < len; j++) {
            x[j] = A.array[k][k + j] as ComplexType;
        }

        // sigma = sum |x[j]|^2, j>=1
        let sigma = Complex.zero();
        for (let j = 1; j < len; j++) {
            sigma = Complex.add(sigma, Complex.mul(x[j], Complex.conj(x[j])));
        }

        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            // caso degenerado
            const tau = Complex.zero();
            const v = new Array(len).fill(Complex.zero());
            v[0] = Complex.one();
            return { tau, v, alpha: x[0] };
        }

        const x0 = x[0];
        const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
        // alpha incorpora a fase de x0
        const alpha = Complex.neg(Complex.mul(x0, Complex.rdiv(normx, Complex.abs(normx))));
        const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);

        const denom = Complex.sub(x0, alpha);
        const v: ComplexType[] = new Array(len);
        v[0] = Complex.one();
        for (let j = 1; j < len; j++) {
            v[j] = Complex.rdiv(x[j], denom);
        }

        return { tau, v, alpha };
    };

    public static readonly gelq2_final = (A: MultiArray): { L: MultiArray; taus: ComplexType[] } => {
        const L = MultiArray.copy(A);
        const m = L.dimension[0];
        const n = L.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);

        for (let k = 0; k < kMax; k++) {
            // === Generate Householder reflector for row k ===
            const { tau, v, alpha } = LAPACKunused.larfgLQ(L, k, n);

            // Store alpha in diagonal
            L.array[k][k] = alpha;

            // Store rest of v in row k, starting from column k+1
            for (let j = 1; j < v.length; j++) {
                L.array[k][k + j] = v[j];
            }

            // Apply reflector H_k to trailing rows
            if (k + 1 < m && !Complex.realIsZero(Complex.abs(tau))) {
                LAPACK.larf('R', L, v, tau, k + 1, k);
            }

            // Save tau
            taus[k] = tau;
        }

        MultiArray.setType(L);
        return { L, taus };
    };

    public static readonly gelq2_nova = (A: MultiArray): { L: MultiArray; taus: ComplexType[] } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);

        for (let k = 0; k < kMax; k++) {
            const len = n - k;

            // --- Build a 1×len temporary row vector ---
            const X = new MultiArray([1, len]);
            for (let j = 0; j < len; j++) {
                X.array[0][j] = A.array[k][k + j] as ComplexType;
            }

            // --- Generate Householder reflector ---
            const { tau, v, alpha } = LAPACK.larfg('R', X, len, 0);
            taus[k] = tau;

            // --- Store alpha ---
            A.array[k][k] = alpha;

            // --- Store v[1..] in A(k, k+1..) ---
            for (let j = 1; j < len; j++) {
                A.array[k][k + j] = v[j];
            }

            // --- Apply reflector to trailing rows ---
            if (k + 1 < m && !Complex.realIsZero(Complex.abs(tau))) {
                LAPACK.larf('R', A, v, tau, k + 1, k);
            }
        }

        MultiArray.setType(A);
        return { L: A, taus };
    };

    public static readonly gelq2_nao_funciona = (A: MultiArray): { L: MultiArray; taus: ComplexType[] } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);

        for (let k = 0; k < kMax; k++) {
            // 1) Gerar refletor da linha k (lado direito)
            const { tau, v, alpha } = LAPACK.larfg('R', A, n, k);

            taus[k] = tau; // salvar tau
            A.array[k][k] = alpha; // salvar alpha na diagonal (L)

            // 2) Armazenar tau*v[1..] na linha, conforme MATLAB/LAPACK
            for (let j = 1; j < v.length; j++) {
                // A.array[k][k + j] = Complex.mul(tau, v[j]);
                A.array[k][k + j] = v[j];
            }

            // 3) Aplicar refletor H = I - tau*v*vᴴ à submatriz restante
            if (!Complex.realIsZero(Complex.abs(tau))) {
                // aplica à linha k e colunas k..n-1
                LAPACK.larf('R', A, v, tau, k, k);
                // linhas abaixo de k não precisam ser afetadas porque refletor é linha
            }
        }

        // 4) Garantir que L tenha forma trapezoidal inferior
        LAPACK.tril_inplace(A);

        MultiArray.setType(A);
        return { L: A, taus };
    };

    /**
     * Generate Householder vector and apply it immediately to A.
     * LAPACK-style: side-aware (left/right), complex.
     * @param side 'L' for left, 'R' for right
     * @param A Matrix to transform (modified in place)
     * @param k Index for the reflector (row/column start)
     */
    /**
     *
     * @param side
     * @param A
     * @param k
     * @returns Object { tau, v, alpha }
     */
    public static readonly larfg_apply = (side: 'L' | 'R', A: MultiArray, k: number): { tau: ComplexType; v: ComplexType[]; alpha: ComplexType } => {
        let m: number;
        if (side === 'L')
            m = A.dimension[0]; // rows
        else m = A.dimension[1]; // cols
        // Step 1: generate Householder reflector
        const { tau, v, alpha } = LAPACK.larfg(side, A, m, k);
        // Step 2: apply the reflector immediately
        if (!Complex.realIsZero(Complex.abs(tau))) {
            LAPACK.larf(side, A, v, tau, k, k);
        }
        return { tau, v, alpha };
    };

    /**
     *
     * @param A
     * @param k
     * @returns Object { tau, v, alpha }
     */
    public static readonly larfg_left_nd = (A: MultiArray, k: number): { tau: ComplexType; v: ComplexType[]; alpha: ComplexType } => {
        const dims = A.dimension;
        const pageCount = dims.length > 2 ? dims.slice(2).reduce((p, c) => p * c, 1) : 1;
        const m = dims[0]; // linhas por página
        const pageStride = dims[0]; // número de linhas consecutivas por página
        // Gerar Householder na primeira página
        const { tau, v, alpha } = LAPACK.larfg('L', A, m, k);
        if (Complex.realIsZero(Complex.abs(tau))) return { tau, v, alpha };
        // Aplicar o refletor a cada página
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let j = 0; j < dims[1]; j++) {
                let s = Complex.zero();
                for (let i = k; i < m; i++) {
                    const physRow = pageStart + i;
                    s = Complex.add(s, Complex.mul(Complex.conj(v[i - k]), A.array[physRow][j] as ComplexType));
                }
                s = Complex.mul(tau, s);
                for (let i = k; i < m; i++) {
                    const physRow = pageStart + i;
                    A.array[physRow][j] = Complex.sub(A.array[physRow][j] as ComplexType, Complex.mul(v[i - k], s));
                }
            }
        }
        MultiArray.setType(A);
        return { tau, v, alpha };
    };

    /**
     *
     * @param A
     * @param k
     * @returns Object { tau, v, alpha }
     */
    public static readonly larfg_right_nd = (A: MultiArray, k: number): { tau: ComplexType; v: ComplexType[]; alpha: ComplexType } => {
        const dims = A.dimension;
        const pageCount = dims.length > 2 ? dims.slice(2).reduce((p, c) => p * c, 1) : 1;
        const m = dims[1]; // colunas por página
        const pageStride = dims[0]; // linhas por página
        // Gerar Householder na primeira página
        const { tau, v, alpha } = LAPACK.larfg('R', A, m, k);
        if (Complex.realIsZero(Complex.abs(tau))) return { tau, v, alpha };
        // Aplicar o refletor a cada página
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let i = 0; i < dims[0]; i++) {
                const row = A.array[pageStart + i];
                let s = Complex.zero();
                for (let j = k; j < m; j++) {
                    s = Complex.add(s, Complex.mul(row[j] as ComplexType, v[j - k]));
                }
                s = Complex.mul(tau, s);
                for (let j = k; j < m; j++) {
                    row[j] = Complex.sub(row[j] as ComplexType, Complex.mul(s, Complex.conj(v[j - k])));
                }
            }
        }
        MultiArray.setType(A);
        return { tau, v, alpha };
    };

    /**
     *
     * @param side
     * @param A
     * @param k
     * @returns
     */
    public static readonly larfg_nd = (side: 'L' | 'R', A: MultiArray, k: number) => (side === 'L' ? LAPACKunused.larfg_left_nd(A, k) : LAPACKunused.larfg_right_nd(A, k));

    /**
     * Apply an elementary reflector H = I - tau * v * vᴴ to A from the left,
     * but restricted to columns colStart .. colEnd-1.
     *
     * A: MultiArray (row-major)
     * v: ComplexType[] (v[0] == 1, length = m - rowStart)
     * tau: ComplexType
     * rowStart: starting row index of the reflector (k)
     * colStart: first column to update (usually k+1)
     * colEnd: (optional) one-past-last column to update (default = A.dimension[1])
     */
    public static readonly larf_left_block_anterior = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number, colEnd?: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;

        const m = A.dimension[0];
        const n = A.dimension[1];
        const jEnd = typeof colEnd === 'number' ? Math.min(colEnd, n) : n;
        const vlen = v.length; // expected m - rowStart

        // bounds safety (trim vlen if necessary)
        const maxVlen = Math.max(0, Math.min(vlen, m - rowStart));

        for (let j = colStart; j < jEnd; j++) {
            // compute s = vᴴ * A[rowStart:rowStart+vlen-1, j]
            let s = Complex.zero();
            for (let i = 0; i < maxVlen; i++) {
                Complex.mulAndSumTo(s, Complex.conj(v[i]), A.array[rowStart + i][j] as ComplexType);
            }
            // s = tau * s
            s = Complex.mul(tau, s);
            // if s is (near) zero skip update
            if (Complex.realIsZero(Complex.abs(s))) continue;
            // A[rowStart + i, j] -= v[i] * s
            for (let i = 0; i < maxVlen; i++) {
                const prod = Complex.mul(v[i], s);
                A.array[rowStart + i][j] = Complex.sub(A.array[rowStart + i][j] as ComplexType, prod);
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
     * Apply a Householder reflector from the RIGHT:Vamos mapear ZGEMV/ZGERC do LAPACK e alinhar com nosso código.
     *
     *  A := A * (I - tau * v * vᴴ)
     *
     * Where:
     *  - A is the target matrix
     *  - v is the Householder vector (length = block size)
     *  - tau is the scalar
     *  - rowStart is the first row of the block
     *  - colStart is the first column of the block
     *
     * This exactly matches LAPACK xLARF(side='R') behavior.
     */
    public static readonly larf_right = (C: MultiArray, v: ComplexType[], tau: ComplexType, i0: number, j0: number): void => {
        if (Complex.realIsZero(Complex.abs(tau))) return;

        const m = C.dimension[0];
        const len = v.length;

        for (let i = i0; i < m; i++) {
            // sum = A[i, j0:]*v
            let sum = Complex.zero();
            for (let j = 0; j < len; j++) {
                Complex.mulAndSumTo(sum, C.array[i][j0 + j] as ComplexType, Complex.conj(v[j]));
            }

            sum = Complex.mul(tau, sum);

            if (Complex.realIsZero(Complex.abs(sum))) continue;

            // A[i, j0+j] -= sum * v[j]
            for (let j = 0; j < len; j++) {
                C.array[i][j0 + j] = Complex.sub(C.array[i][j0 + j] as ComplexType, Complex.mul(sum, v[j]));
            }
        }
    };

    /**
     * Blocked version of applying Hᴴ = I - conj(tau) * v * vᴴ from the RIGHT:
     *
     *   A[rowStart..m-1, colStart..colStart+vlen-1] := A[rowStart..m-1, colStart..colStart+vlen-1] * Hᴴ
     *
     * v length = number of columns in the block (vlen).
     *
     * Uses temporary buffers and BLAS.gemm_block where appropriate.
     */
    public static readonly larf_right_conj_block = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number, blockSize?: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const m: number = A.dimension[0];
        const n: number = A.dimension[1];
        const vlen: number = v.length; // expected number of columns in the block
        // basic checks
        if (rowStart < 0 || rowStart >= m) throw new Error('larf_right_conj_block: invalid rowStart');
        if (colStart < 0 || colStart >= n) throw new Error('larf_right_conj_block: invalid colStart');
        if (colStart + vlen > n) throw new Error('larf_right_conj_block: block exceeds matrix columns');
        const bs = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));
        // Build Vcol_conj (vlen x 1) = conj(v) to be used in gemm (A_block * Vcol_conj)
        const Vcol_conj = new MultiArray([vlen, 1]);
        for (let i = 0; i < vlen; i++) Vcol_conj.array[i][0] = Complex.conj(v[i]);
        // Loop over row-blocks (operate on A[ii:ii+bs-1, colStart:colStart+vlen-1])
        for (let ii = rowStart; ii < m; ii += bs) {
            const iEnd = Math.min(ii + bs, m);
            const nRows = iEnd - ii;
            // Copy Ablock = A[ii..iEnd-1, colStart..colStart+vlen-1]  (nRows x vlen)
            const Ablock = new MultiArray([nRows, vlen]);
            for (let i = 0; i < nRows; i++) {
                for (let j = 0; j < vlen; j++) {
                    Ablock.array[i][j] = A.array[ii + i][colStart + j] as ComplexType;
                }
            }
            // Compute S = Ablock * Vcol_conj  -> (nRows x 1) vector
            const S = new MultiArray([nRows, 1]);
            BLAS.gemm_block(Ablock.array as ComplexType[][], Vcol_conj.array as ComplexType[][], S.array as ComplexType[][], Complex.one(), Complex.zero(), bs);
            // Scale S by conj(tau): S = conj(tau) * S   (because we apply Hᴴ)
            const tauConj = Complex.conj(tau);
            for (let i = 0; i < nRows; i++) {
                S.array[i][0] = Complex.mul(tauConj, S.array[i][0] as ComplexType);
            }
            // Update Ablock := Ablock - S * vᴴ  (outer product)
            // S is (nRows x 1), vᴴ is (1 x vlen) where entries are v[j]
            for (let i = 0; i < nRows; i++) {
                const s_i = S.array[i][0] as ComplexType;
                if (Complex.realIsZero(Complex.abs(s_i))) continue;
                for (let j = 0; j < vlen; j++) {
                    // Ablock[i,j] -= s_i * v[j]
                    const prod = Complex.mul(s_i, v[j]);
                    Ablock.array[i][j] = Complex.sub(Ablock.array[i][j] as ComplexType, prod);
                }
            }
            // Write back Ablock into A
            for (let i = 0; i < nRows; i++) {
                for (let j = 0; j < vlen; j++) {
                    A.array[ii + i][colStart + j] = Ablock.array[i][j];
                }
            }
        } // ii blocks
    };

    /**
     * Apply the conjugate-right Householder reflector Hᴴ = I - conj(tau) * v * vᴴ to A from the right.
     * Equivalent to A := A * Hᴴ for rows i = rowStart..m-1 and columns j = colStart..colStart+v.length-1.
     *
     * This is the companion routine for larf_left when you need to perform
     * A := H * A * Hᴴ (first call larf_left(A, v, tau, rowStart, colStartLeft)
     * then call larf_right_conj(A, v, tau, rowStart, colStartRight)).
     *
     * @param A         MultiArray to modify in-place.
     * @param v         Householder vector (ComplexType[]), v[0] == 1, length = block width.
     * @param tau       Householder scalar (ComplexType).
     * @param rowStart  first row of the block (usually 0 or k).
     * @param colStart  first column of the block (where v aligns horizontally).
     */
    public static readonly larf_right_conj = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const m = A.dimension[0];
        const n = A.dimension[1];
        const vlen = v.length;
        // loop over rows of the block
        for (let i = rowStart; i < m; i++) {
            // w = A[i, colStart : colStart+vlen-1] * conj(v)  (dot product)
            let w = Complex.zero();
            for (let j = 0; j < vlen; j++) {
                Complex.mulAndSumTo(w, A.array[i][colStart + j] as ComplexType, Complex.conj(v[j]));
            }
            // multiply w by conj(tau) because we apply Hᴴ = I - conj(tau) v vᴴ
            const wScaled = Complex.mul(w, Complex.conj(tau));
            // if scaled dot is zero, skip update
            if (Complex.realIsZero(Complex.abs(wScaled))) continue;
            // A[i, colStart + j] -= wScaled * v[j]
            for (let j = 0; j < vlen; j++) {
                A.array[i][colStart + j] = Complex.sub(A.array[i][colStart + j] as ComplexType, Complex.mul(wScaled, v[j]));
            }
        }
    };

    /**
     * Same operation as larf_right_conj — but returns new matrix instead of modifying A.
     *
     * Compute:
     *      A_new = A * Hᴴ
     * where Hᴴ = I - conj(tau) * v * vᴴ
     *
     * Input:
     *   A         original matrix (not modified)
     *   v         Householder vector, v[0] == 1
     *   tau       Householder scalar
     *   rowStart  first affected row
     *   colStart  first affected column
     *
     * Output:
     *   MultiArray A_new = A * Hᴴ
     */
    public static readonly larf_right_conj_return = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): MultiArray => {
        // Se tau == 0 → retorna cópia sem modificação
        if (Complex.realIsZero(Complex.abs(tau))) return MultiArray.copy(A);

        const m = A.dimension[0];
        const n = A.dimension[1];
        const vlen = v.length;

        const Anew = MultiArray.copy(A);

        for (let i = rowStart; i < m; i++) {
            // w = A[i, colStart : colStart+vlen-1] * conj(v)
            let w = Complex.zero();
            for (let j = 0; j < vlen; j++) {
                Complex.mulAndSumTo(w, A.array[i][colStart + j] as ComplexType, Complex.conj(v[j]));
            }

            // w *= conj(tau)
            const wScaled = Complex.mul(w, Complex.conj(tau));
            if (Complex.realIsZero(Complex.abs(wScaled))) continue;

            // Anew[i,j] -= wScaled * v[j]
            for (let j = 0; j < vlen; j++) {
                Anew.array[i][colStart + j] = Complex.sub(A.array[i][colStart + j] as ComplexType, Complex.mul(wScaled, v[j]));
            }
        }

        MultiArray.setType(Anew);
        return Anew;
    };

    /**
     *
     * @param A
     * @param v
     * @param tau
     * @param rowStart
     * @param colStart
     * @returns
     */
    public static readonly larf_left_nd = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) => {
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const dims = A.dimension;
        const pageCount = dims.length > 2 ? dims.slice(2).reduce((p, c) => p * c, 1) : 1;
        const pageStride = dims[0]; // linhas por página
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let j = colStart; j < dims[1]; j++) {
                let s = Complex.zero();
                for (let i = 0; i < v.length; i++) {
                    const physRow = pageStart + rowStart + i;
                    s = Complex.add(s, Complex.mul(Complex.conj(v[i]), A.array[physRow][j] as ComplexType));
                }
                s = Complex.mul(tau, s);
                for (let i = 0; i < v.length; i++) {
                    const physRow = pageStart + rowStart + i;
                    A.array[physRow][j] = Complex.sub(A.array[physRow][j] as ComplexType, Complex.mul(v[i], s));
                }
            }
        }
        MultiArray.setType(A);
    };

    /**
     *
     * @param A
     * @param v
     * @param tau
     * @param rowStart
     * @param colStart
     * @returns
     */
    public static readonly larf_right_nd = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) => {
        if (Complex.realIsZero(Complex.abs(tau))) return;
        const dims = A.dimension;
        const pageCount = dims.length > 2 ? dims.slice(2).reduce((p, c) => p * c, 1) : 1;
        const pageStride = dims[0]; // linhas por página
        for (let p = 0; p < pageCount; p++) {
            const pageStart = p * pageStride;
            for (let i = rowStart; i < dims[0]; i++) {
                const physRow = pageStart + i;
                const row = A.array[physRow];
                let s = Complex.zero();
                for (let j = 0; j < v.length; j++) {
                    s = Complex.add(s, Complex.mul(row[colStart + j] as ComplexType, v[j]));
                }
                s = Complex.mul(tau, s);
                for (let j = 0; j < v.length; j++) {
                    row[colStart + j] = Complex.sub(row[colStart + j] as ComplexType, Complex.mul(s, Complex.conj(v[j])));
                }
            }
        }
        MultiArray.setType(A);
    };

    public static readonly larf_nd = (side: 'L' | 'R', A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) =>
        side === 'L' ? LAPACKunused.larf_left_nd(A, v, tau, rowStart, colStart) : LAPACKunused.larf_right_nd(A, v, tau, rowStart, colStart);

    /**
     * Unblocked LU factorization (panel) - modifies A in place.
     * A is m x n stored as MultiArray (row-major physical layout).
     * Performs LU on A[k..m-1, k..n-1] and writes pivots into piv starting at offset k.
     * Returns number of pivots performed (panel width) or info.
     *
     * This is analogous to LAPACK's xGETF2 applied to the submatrix.
     *
     * This routine will update A in-place (compact LU) and fill piv[k..k+panelWidth-1].
     *
     * @param A MultiArray (m x n)
     * @param k starting column/row index for panel
     * @param panelWidth number of columns to factor (<= min(m-k, n-k))
     * @param piv global pivot array (zero-based), length >= min(m,n)
     */
    public static readonly getf2 = (A: MultiArray, k: number, panelWidth: number, piv: number[]): void => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const end = Math.min(k + panelWidth, Math.min(m, n));
        for (let i = k; i < end; i++) {
            // 1) find pivot in column i (rows i..m-1)
            let maxIdx = i;
            let maxVal = Complex.abs(A.array[i][i] as ComplexType);
            for (let r = i + 1; r < m; r++) {
                const val = Complex.abs(A.array[r][i] as ComplexType);
                if (Complex.toBoolean(Complex.gt(val, maxVal))) {
                    maxVal = val;
                    maxIdx = r;
                }
            }
            piv[i] = maxIdx; // store pivot (zero-based)
            // 2) swap rows i and maxIdx in A if needed
            if (maxIdx !== i) {
                LAPACKunused.laswp_rows(A, i, maxIdx);
            }
            // 3) If pivot is zero, skip multipliers
            const pivot = A.array[i][i] as ComplexType;
            if (Complex.toBoolean(Complex.eq(Complex.abs(pivot), Complex.zero()))) continue;
            // 4) compute multipliers and store in column i below diagonal
            for (let r = i + 1; r < m; r++) {
                A.array[r][i] = Complex.rdiv(A.array[r][i] as ComplexType, pivot); // L(r,i)
            }
            // 5) rank-1 update on trailing submatrix A[i+1:m-1, i+1:n-1]
            for (let r = i + 1; r < m; r++) {
                const lir = A.array[r][i] as ComplexType; // multiplier
                const ArowR = A.array[r];
                const ArowI = A.array[i];
                for (let c = i + 1; c < n; c++) {
                    // A[r][c] -= L(r,i) * A[i][c]
                    ArowR[c] = Complex.sub(ArowR[c] as ComplexType, Complex.mul(lir, ArowI[c] as ComplexType));
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
    public static readonly getrf = (A: MultiArray, blockSize?: number): { LU: MultiArray; piv: number[]; swaps: number } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        let swaps = 0;
        for (let k = 0; k < minmn; k += blockSize ?? BLAS.settings.blockSize) {
            const panelWidth = Math.min(blockSize ?? BLAS.settings.blockSize, minmn - k);
            // 1) Factorize panel A[k:m-1, k:k+panelWidth-1] with getf2 (unblocked)
            LAPACK.getf2(A.array as ComplexType[][], k, panelWidth, piv);
            // Count swaps from pivots in the panel (and apply them to previous columns)
            for (let i = k; i < k + panelWidth && i < minmn; i++) {
                const pi = piv[i];
                if (pi !== i) swaps++;
                // Note: getf2 already swapped rows in A (and we've recorded piv)
                // We must apply the same row swaps to previous columns 0..k-1
                if (pi !== i && k > 0) {
                    // swap rows in columns 0..k-1 (previous part)
                    for (let col = 0; col < k; col++) {
                        const tmp = A.array[i][col];
                        A.array[i][col] = A.array[pi][col];
                        A.array[pi][col] = tmp;
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
                const Aarray = A.array; // physical rows
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
                // Use BLAS.gemm with alpha = -1, beta = 1
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
        MultiArray.setType(A);
        return { LU: A, piv, swaps };
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
    public static readonly gemm_blocked = (A: MultiArray, k: number, kb: number, blockSizeInner: number = 64): void => {
        const m = A.dimension[0];
        const n = A.dimension[1];
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
                    const rowPhys = A.array[physRow];
                    for (let j = jj; j < jend; j++) {
                        // compute sum_{p=0..K-1} A21[i,p] * A12[p,j]
                        let sum = Complex.zero();
                        for (let p = 0; p < K; p++) {
                            const a21 = A.array[rowA22 + i][k + p] as ComplexType; // A21[i,p]
                            const a12 = A.array[k + p][colA22 + j] as ComplexType; // A12[p,j]
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
     * Blocked LU factorization that calls getf2 for panel factorization,
     * then solves and updates the trailing submatrix.
     * @param A
     * @returns Object { LU: A, piv, info, swaps }
     */
    public static readonly getrf_blocked = (A: MultiArray, blockSize?: number): { LU: MultiArray; piv: number[]; info: number; swaps: number } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        const swapsObj = { swaps: 0 };
        const infoObj = { info: 0 };
        for (let k = 0; k < minmn; k += blockSize ?? BLAS.settings.blockSize) {
            const kb = Math.min(blockSize ?? BLAS.settings.blockSize, minmn - k);
            // 1) Factor panel A[k:m-1, k:k+kb-1]
            LAPACK.getf2(A.array as ComplexType[][], k, kb, piv, swapsObj, infoObj);
            // 2) If there are columns to the right, solve U * X = A12 (trsm-like)
            if (k + kb < n) {
                // Note: in our layout, after getf2 we already have L and U in place for the panel.
                // We need to compute U^{-1} * A12 (i.e. solve for rows k..k+kb-1)
                // We'll use the simple trsm_left_upper_block that divides columns k+kb..n-1 by U.
                LAPACK.trsm_left_upper_block(A.array as ComplexType[][], k, kb);
            }
            // 3) Update trailing submatrix A22 := A22 - L21 * U12
            if (k + kb < m && k + kb < n) {
                LAPACK.gemm_blocked(A.array as ComplexType[][], k, kb);
            }
        }
        return { LU: A, piv, info: infoObj.info, swaps: swapsObj.swaps };
    };

    /**
     * Solve systems A X = B given LU factorization in-place and pivots.
     * This follows LAPACK GETRS semantics (no transpose).
     * @param LU MultiArray containing LU as returned by getrf
     * @param piv pivot vector (zero-based) length = min(m,n)
     * @param B MultiArray of size m x nrhs (modified in place)
     * @returns new MultiArray (`B`) with solution
     */
    public static readonly getrs = (LU: MultiArray, piv: number[], B: MultiArray): MultiArray => {
        const m = LU.dimension[0];
        const n = LU.dimension[1];
        const nrhs = B.dimension[1] ?? 1;
        // Make a copy of B (we don't want to modify user's B unless intended)
        const X = MultiArray.copy(B) as MultiArray;
        // 1) Apply row permutations to RHS: B' = P * B
        // piv[k] gives row swapped into position k
        for (let k = 0; k < piv.length; k++) {
            const pk = piv[k];
            if (pk !== k) {
                // swap rows k and pk in X
                if (typeof (MultiArray as any).swapRows === 'function') {
                    (MultiArray as any).swapRows(X, k, pk);
                } else {
                    const tmp = X.array[k];
                    X.array[k] = X.array[pk];
                    X.array[pk] = tmp;
                }
            }
        }
        // 2) Solve L * y = B'  (forward substitution), L has 1's on diagonal and multipliers in strictly lower part
        for (let j = 0; j < nrhs; j++) {
            for (let i = 0; i < m; i++) {
                let sum = X.array[i][j] as ComplexType;
                for (let p = 0; p < i && p < n; p++) {
                    sum = Complex.sub(sum, Complex.mul(LU.array[i][p] as ComplexType, X.array[p][j] as ComplexType) as ComplexType) as ComplexType;
                }
                // For L diagonal, divide by 1 (skip)
                X.array[i][j] = sum;
            }
        }
        // 3) Solve U * x = y (back substitution). U is upper triangular (n columns)
        for (let j = 0; j < nrhs; j++) {
            for (let i = Math.min(n, m) - 1; i >= 0; i--) {
                let sum = X.array[i][j] as ComplexType;
                for (let p = i + 1; p < n; p++) {
                    sum = Complex.sub(sum, Complex.mul(LU.array[i][p] as ComplexType, X.array[p][j] as ComplexType) as ComplexType) as ComplexType;
                }
                const diag = LU.array[i][i] as ComplexType;
                // divide by diag (may be zero => Inf/NaN propagate as intended)
                X.array[i][j] = Complex.rdiv(sum, diag) as ComplexType;
            }
        }
        MultiArray.setType(X);
        return X;
    };

    /**
     * Reduce a Hermitian matrix A (n × n) to real tridiagonal form T using
     * Householder reflectors.
     *
     * This routine performs a similarity transformation:
     *
     *     A = Q * T * Qᴴ
     *
     * where:
     *   - A is the original Hermitian matrix,
     *   - T is a real symmetric tridiagonal matrix,
     *   - Q is a unitary matrix formed as a product of Householder reflectors.
     *
     * The reduction is carried out implicitly as:
     *
     *     A ← H₀ᴴ H₁ᴴ ... Hₙ₋₂ᴴ · A · Hₙ₋₂ ... H₁ H₀
     *
     * with:
     *
     *     Q = H₀ H₁ ... Hₙ₋₂
     *
     * Each Householder reflector has the form:
     *
     *     H_k = I - tau_k · v_k · v_kᴴ
     *
     * where v_k is a Householder vector with the convention v_k[0] = 1.
     *
     * ---
     * Storage conventions (LAPACK-compatible):
     *
     * This routine overwrites the input matrix A in-place. After completion:
     *
     *   - diag[k] contains the diagonal entry T[k, k]
     *   - offdiag[k] contains the sub/super-diagonal entry T[k+1, k]
     *   - taus[k] contains the scalar factor tau_k for reflector H_k
     *
     *   - The Householder vector v_k is stored in:
     *
     *         A[k+1:n-1, k]
     *
     *     with:
     *
     *         v_k[0] = 1
     *         v_k[i] = A[k+1+i, k],  i = 1 .. n-k-2
     *
     * The strictly upper triangle of A is not referenced after the reduction.
     *
     * ---
     * Algorithmic structure:
     *
     * For each k = 0 .. n-2:
     *   1) A Householder reflector H_k is generated from column k
     *   2) The trailing (n-k-1) × (n-k-1) submatrix is updated via a
     *      Hermitian rank-2 update
     *
     * The concrete implementation of the reflector application is injected
     * via the `larf` parameter, allowing different backends:
     *
     *   - real symmetric reduction   → larf_left
     *   - complex Hermitian reduction → her2_zhtrd_update
     *
     * This mirrors the separation of concerns used in LAPACK (e.g. `zhetrd`)
     * and simplifies validation and reuse.
     *
     * ---
     * Dependencies:
     *
     *   - LAPACK.larfg_vector(x): generates Householder vector v and scalar tau
     *   - larf(A, v, tau, rowStart, colStart): applies reflector to trailing block
     *
     * All numeric arrays are represented as ComplexType[] to conform to the
     * MathJSLab Complex facade, even though the resulting tridiagonal matrix T
     * is real-valued.
     *
     * @param A
     *   Hermitian square MultiArray (n × n). Modified in-place.
     *
     * @param larf
     *   Function responsible for applying the Householder reflector to the
     *   trailing submatrix. Its exact behavior depends on whether the reduction
     *   is real symmetric or complex Hermitian.
     *
     * @returns
     *   An object containing:
     *     - diag    : diagonal entries of T
     *     - offdiag : sub/super-diagonal entries of T
     *     - taus    : scalar Householder factors tau_k
     */
    // public static readonly sytrd = (
    //     A: MultiArray,
    //     larf: larfHandler,
    // ): {
    //     diag: ComplexType[];
    //     offdiag: ComplexType[];
    //     taus: ComplexType[];
    // } => {
    //     // A is a square matrix n×n
    //     const n: number = A.dimension[0];
    //     // Outputs as ComplexType[] (Complex facade compatibility).
    //     const D: ComplexType[] = new Array(n);
    //     const E: ComplexType[] = new Array(n);
    //     const TAU: ComplexType[] = new Array(n);
    //     // null/trivial cases
    //     if (n === 0) {
    //         return { diag: D, offdiag: E, taus: TAU };
    //     }
    //     if (n === 1) {
    //         D[0] = Complex.real(A.array[0][0] as ComplexType);
    //         E[0] = Complex.zero();
    //         TAU[0] = Complex.zero();
    //         return { diag: D, offdiag: E, taus: TAU };
    //     }
    //     // Main loop: k = 0 .. n-2
    //     for (let k = 0; k < n - 1; k++) {
    //         // length of vector below diagonal in column k
    //         const colLen: number = n - k - 1;
    //         // x = A[k+1:n-1, k]
    //         const x: ComplexType[] = new Array(colLen);
    //         for (let i = 0; i < colLen; i++) {
    //             x[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
    //         }
    //         // Generate Householder reflector
    //         const { tau, v, alpha } = LAPACK.larfg_vector(x); // expects v[0] == 1
    //         // diagonal (real) and offdiag (alpha should be real in Hermitian reduction)
    //         D[k] = Complex.real(A.array[k][k] as ComplexType);
    //         E[k] = Complex.copy(alpha);
    //         TAU[k] = Complex.copy(tau);
    //         // Store v into A (below diagonal, copy each element to avoid aliasing)
    //         for (let i = 0; i < colLen; i++) {   // i = 0 ????????? 1 ????????
    //             A.array[k + 1 + i][k] = Complex.copy(v[i]);
    //         }
    //         // Apply reflector to trailing Hermitian submatrix
    //         larf(A, v, tau, k + 1, k + 1); // if |tau| == 0 then returns without doing anything
    //         // After the update the Hermitian structure of the trailing block is preserved
    //     }
    //     // Final diagonal and ending values.
    //     D[n - 1] = Complex.real(A.array[n - 1][n - 1] as ComplexType);
    //     E[n - 1] = Complex.zero();
    //     TAU[n - 1] = Complex.zero();
    //     return { diag: D, offdiag: E, taus: TAU };
    // };

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
     * @param hetrd_update Function that applies a reflector from the left (Hermitian-aware)
     */
    public static readonly sytrd = (
        A: MultiArray,
        hetrd_update: (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) => void,
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
                hetrd_update(A, v, Complex.conj(tau), k + 1, k + 1);
            }

            // Diagonal element
            diag[k] = Complex.copy(A.array[k][k] as ComplexType);
        }

        // Last diagonal element
        diag[n - 1] = Complex.copy(A.array[n - 1][n - 1] as ComplexType);

        return { diag, offdiag, taus };
    };

    /**
     * Generate the unitary matrix Q from a Hermitian tridiagonal reduction.
     *
     * This routine reconstructs the unitary matrix Q from the Householder
     * reflectors produced by `sytrd` (Hermitian reduction to tridiagonal form).
     * It is the complex/Hermitian analogue of LAPACK's `ungtr`.
     *
     * The reduction performed by `sytrd` satisfies:
     *
     *     A = Q * T * Qᴴ
     *
     * where:
     *   - A is the original Hermitian matrix,
     *   - T is the real tridiagonal matrix returned by `sytrd`,
     *   - Q is a unitary matrix defined as the product of Householder reflectors.
     *
     * After a call to `sytrd(A, larf)`, the input matrix `A` contains the data
     * needed to reconstruct Q:
     *
     *   - For each k = 0 .. n-2, the Householder vector v_k is stored in
     *     A[k+1:n-1, k], with the convention:
     *
     *         v_k[0] = 1
     *         v_k[i] = A[k+1+i, k],  i = 1 .. n-k-2
     *
     *   - The scalar factor tau_k associated with each reflector H_k is stored
     *     in TAU[k].
     *
     * Each Householder reflector is defined as:
     *
     *     H_k = I - tau_k * v_k * v_kᴴ
     *
     * and the unitary matrix Q is given by:
     *
     *     Q = H_0 * H_1 * ... * H_{n-2}
     *
     * This routine builds Q explicitly by applying the reflectors in reverse
     * order:
     *
     *     Q = H_{n-2} * ... * H_1 * H_0 * I
     *
     * Notes:
     *   - The input matrix `A` is NOT modified by this routine.
     *   - This function assumes that `sytrd` stored the Householder vectors
     *     exactly according to the LAPACK convention (v[0] = 1).
     *   - No attempt is made to symmetrize or normalize the reflectors here;
     *     correctness depends on a consistent `sytrd` implementation.
     *
     * @param A
     *   Square MultiArray (n × n) that was previously reduced by `sytrd`.
     *   The strictly lower triangular part of A contains the Householder
     *   vectors v_k.
     *
     * @param TAU
     *   Array of length n containing the scalar factors tau_k returned by
     *   `sytrd`. Only entries TAU[0 .. n-2] are used.
     *
     * @returns
     *   A new MultiArray (n × n) containing the unitary matrix Q such that
     *   A_original = Q * T * Qᴴ.
     */
    public static readonly ungtr0 = (A: MultiArray, TAU: ComplexType[]): MultiArray => {
        // A is a square matrix n×n
        const n: number = A.dimension[0];
        // Initialize Q as identity
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye([n, n]);
        // Apply Householders H₀ ... Hₙ₋₂
        for (let k = n - 2; k >= 0; k--) {
            const tau = TAU[k];
            if (Complex.realIsZero(Complex.abs(tau))) continue; // trivial reflector
            // Length of vector v.
            const colLen: number = n - k - 1;
            // Reconstruct v = [1; A[k+2:n-1, k]] (clone values read from A), exactly as stored by sytrd
            // v[0] = 1
            // v[i] = A[k+1+i][k], i >= 1
            const v: ComplexType[] = new Array(colLen);
            v[0] = Complex.one(); // First element of reflector.
            for (let i = 1; i < colLen; i++) {
                v[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
            }
            // Aplicar H_k = I - tau_k * v * vᴴ à esquerda de Q
            // Somente linhas k+1 .. n-1 são afetadas
            //
            // Q_sub = (I - tau * v vᴴ) * Q_sub
            //
            // Implementação direta: rank-1 update
            // 1) w = vᴴ * Q_sub  → vetor linha (complexo)

            // Apply H_k = I - tau * v * vᴴ from left of Q[k+1:n-1, :]
            // w length = n, Q_sub = Q[k+1:n-1, k+1:n-1]
            // w = vᴴ * Q_sub
            const w: ComplexType[] = new Array(n);
            for (let j = 0; j < n; j++) {
                let sum = Complex.zero();
                for (let i = 0; i < colLen; i++) {
                    Complex.mulAndSumTo(sum, Complex.conj(v[i]), Q.array[k + 1 + i][j] as ComplexType);
                }
                w[j] = sum;
            }
            // Q_sub = Q_sub - tau * v * w
            for (let i = 0; i < colLen; i++) {
                const scale = Complex.mul(tau, v[i]);
                for (let j = 0; j < n; j++) {
                    Q.array[k + 1 + i][j] = Complex.sub(Q.array[k + 1 + i][j] as ComplexType, Complex.mul(scale, w[j]));
                }
            }
        }
        return Q;
    };

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
     * The reflectors {vₖ, τₖ} are assumed to be stored exactly as produced by
     * sytrd / zhetrd:
     *
     *   - vₖ is stored in A[k+1:n-1, k]
     *   - vₖ[0] = 1 is implicit (not stored)
     *   - τₖ is stored in TAU[k]
     *
     * This implementation is semantically equivalent to LAPACK ZUNGTR
     * (internally using the same logic as ZUNMTR applied to the identity).
     *
     * On exit, Q satisfies:
     *
     *     A ≈ Q · T · Qᴴ
     *
     * provided sytrd was correct.
     *
     * @param A   Matrix containing Householder vectors (modified sytrd output)
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
        // but constructed as:
        // Q ← Hₖ Q   for k = n-2 ... 0
        for (let k = n - 2; k >= 0; k--) {
            const tau = TAU[k];
            if (Complex.realIsZero(Complex.abs(tau))) {
                continue; // trivial reflector
            }

            const m = n - k - 1; // length of vₖ

            /*
             * Reconstruct vₖ exactly as LAPACK expects:
             *
             *   v = [1; A[k+2:n-1, k]]
             *
             * stored implicitly with v[0] = 1
             */
            const v: ComplexType[] = new Array(m);
            v[0] = Complex.one();
            for (let i = 1; i < m; i++) {
                v[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
            }

            /*
             * Apply Hₖ from the LEFT:
             *
             *   Q[k+1:n-1, :] ← (I − τ v vᴴ) Q[k+1:n-1, :]
             *
             * This is exactly what ZUNMTR does internally.
             */

            // w = vᴴ · Q_sub   (row vector of length n)
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
     * Versão estendida de depuração da sytrd()
     * Reconstrói Q, T e imprime o processo completo de tridiagonalização.
     */
    public static readonly sytrd_debug = (A: MultiArray) => {
        console.log('\n===== DEBUG: LAPACK.sytrd_debug =====\n');

        const n: number = A.dimension[0];
        const Acopy = MultiArray.copy(A); // preserva entrada original para validação
        const { diag, offdiag, taus } = LAPACK.sytrd(A, LAPACK.her2_zhtrd_update);

        console.log(
            'Diag D =',
            // diag.map((value) => Complex.unparse(value, 0)),
        );
        console.log(
            'Offdiag E =',
            // offdiag.map((value) => Complex.unparse(value, 0)),
        );
        console.log(
            'Taus =',
            // taus.map((value) => Complex.unparse(value, 0)),
        );

        //
        // RECONSTRUIR A MATRIZ Q A PARTIR DE (v,tau) ARMAZENADOS EM A
        //
        let Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        for (let k = n - 2; k >= 0; k--) {
            const colLen = n - k - 1;
            const v: ComplexType[] = new Array(colLen);
            for (let i = 0; i < colLen; i++) v[i] = A.array[k + 1 + i][k] as ComplexType;
            const tau = taus[k];
            // apply H = I - tau*v*vᴴ to Q rows (rowStart=k+1) and all columns
            if (!Complex.realIsZero(Complex.abs(tau))) {
                LAPACK.larf_left(Q, v, tau, k + 1, 0);
            }
        }
        //
        // RECONSTRUIR MATRIZ TRIDIAGONAL T (para inspeção visual)
        //
        const T = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) {
            T.array[i][i] = diag[i];
            if (i < n - 1) {
                T.array[i][i + 1] = offdiag[i];
                T.array[i + 1][i] = offdiag[i];
            }
        }

        console.log('\nMatriz T reconstruída:');
        const interpreter = Interpreter.Create();
        console.log(MultiArray.unparse(T, interpreter));

        //
        // VALIDAR A = Q * T * Qᵀ  (principal teste numérico!)
        //
        const QtA = MathOperation.mtimes(LinearAlgebra.transpose(Q), MathOperation.mtimes(Acopy, Q));

        console.log('\nMatriz Qᵀ * A * Q =');
        console.log(MultiArray.unparse(QtA as MultiArray, interpreter));

        console.log('\nElementos fora da banda tridiagonal (devem ≈ 0):');
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                if (Math.abs(Complex.realToNumber((QtA as MultiArray).array[i][j] as ComplexType)) > 1e-7 && Math.abs(i - j) > 1)
                    // console.log(`⚠  QᵀAQ[${i}][${j}] =`, Complex.unparse((QtA as MultiArray).array[i][j] as ComplexType, 0));

                    console.log('\n===== FIM DEBUG SYTRD =====\n');

        return { diag, offdiag, taus, Q, T, QtA };
    };
    /**
     * Blocked reduction of a Hermitian matrix A to tridiagonal form.
     *
     * This is a blocked variant of sytrd that uses larf_left_block and
     * larf_right_conj_block to apply reflectors in blocks and BLAS.gemm_block
     * for inter-block multiplications. It preserves the storage convention:
     * - Householder vectors v are stored in A[k+1:n-1, k] with v[0] at A[k+1,k]
     * - taus[k] stores the scalar for the k-th reflector
     *
     * @param A    Hermitian MultiArray (n x n). Modified in-place.
     * @param blockSize   block size (in columns) used for panel processing; default 32
     * @returns    { diag, offdiag, taus } as ComplexType[] arrays
     */
    public static readonly sytrd_blocked = (
        A: MultiArray,
        blockSize?: number,
    ): {
        diag: ComplexType[];
        offdiag: ComplexType[];
        taus: ComplexType[];
    } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('sytrd_blocked: A must be square');
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
        // Process panels of width block
        for (let k0 = 0; k0 < n - 1; k0 += block) {
            const kb = Math.min(block, n - 1 - k0); // number of columns in this panel (except last diagonal col)
            // process each column inside the panel
            for (let kk = 0; kk < kb; kk++) {
                const k = k0 + kk; // current column index
                const colLen = n - k - 1;
                // copy column below diagonal into x
                const x: ComplexType[] = new Array(colLen);
                for (let i = 0; i < colLen; i++) x[i] = A.array[k + 1 + i][k] as ComplexType;
                // generate Householder reflector for x
                const res = LAPACK.larfg_original(x);
                const v: ComplexType[] = res.v;
                const tau_k: ComplexType = res.tau;
                const alpha: ComplexType = res.alpha;
                // store tau, diag and offdiag values
                TAU[k] = tau_k;
                D[k] = A.array[k][k] as ComplexType;
                E[k] = alpha;
                // write v back into A[k+1:n-1, k]; v[0] at A[k+1,k]
                for (let i = 0; i < colLen; i++) {
                    A.array[k + 1 + i][k] = v[i];
                }
                // if tau is zero, nothing to apply
                if (Complex.realIsZero(Complex.abs(tau_k))) continue;
                // Apply H to trailing columns to the right of k, but we do it blockwise:
                // - right block start column (k+1) .. n-1
                // use larf_left_block to apply H on left to A[k+1:n-1, k+1:n-1]
                // and larf_right_conj_block to apply Hᴴ on right.
                // We pass block size to minimize boilerplate and increase locality.
                const rowStart = k + 1;
                const colStart = k + 1;
                // Apply left in blocked fashion to trailing columns
                LAPACKunused.larf_left_block(A, v, tau_k, rowStart, colStart, block);
                // Apply right-conjugate in blocked fashion to trailing rows
                LAPACKunused.larf_right_conj_block(A, v, tau_k, rowStart, colStart, block);
            } // columns inside panel
            // After finishing the panel, we could do a level-3 update of the trailing
            // submatrix combining effects of the panel. For simplicity and to avoid
            // coding a full W-accumulation, we rely on the per-column block updates
            // already applied above. This still reduces overhead versus fully unblocked.
        } // panels
        // final diagonal entry
        D[n - 1] = A.array[n - 1][n - 1] as ComplexType;
        E[n - 1] = Complex.zero();
        TAU[n - 1] = Complex.zero();
        return { diag: D, offdiag: E, taus: TAU };
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
     * Compute eigenvalues of a symmetric tridiagonal matrix T given by
     *    diag[] and offdiag[].
     *
     * This is the QR algorithm with Wilkinson shifts - simplified version
     * that returns only eigenvalues. Next step will include eigenvectors.
     *
     * @param diag      ComplexType[] - diagonal elements of T
     * @param offdiag   ComplexType[] - sub/super diagonal (e1...e[n-1])
     * @param maxIter   optional - default 1000*n
     */
    /**
     * Compute eigenvalues only (returns MultiArray column [n x 1]).
     * This wrapper currently reuses steqr_vectors internally for correctness.
     * Signature:
     *   steqr_values(diag, offdiag, maxIter?) -> MultiArray [n x 1]
     */
    public static readonly steqr_values = (diag: ComplexType[], offdiag: ComplexType[], maxIter?: number): ComplexType[] => {
        // Reuse vectors routine and extract D (MultiArray)
        const { D } = LAPACK.steqr_vectors(diag, offdiag, maxIter);
        // D is already MultiArray [n x 1] per new steqr_vectors
        return D;
    };

    /**
     * Compute eigenvalues AND eigenvectors of a symmetric tridiagonal matrix T
     * using the implicit QR algorithm with Wilkinson shifts.
     *
     * The matrix is represented by:
     *   diag[i]   = diagonal entries  (length n)
     *   offdiag[i]= sub/super diagonal (length n-1)
     *
     * Returns:
     *   { D, V }
     *     D : eigenvalues  (ComplexType[n])
     *     V : eigenvectors (ComplexType[n][n])  -- V[:,i] is eigenvector of D[i]
     */
    /**
     * Compute eigenvalues AND eigenvectors of a symmetric tridiagonal matrix T
     * using the implicit QR algorithm with Wilkinson shifts.
     *
     * Input:
     *  - diag:  ComplexType[] length n  (diagonal of T)
     *  - offdiag: ComplexType[] length n-1 (sub/super diagonal)
     *
     * Returns:
     *  { D: MultiArray, V: MultiArray }
     *   - D : MultiArray [n x 1]  (eigenvalues)
     *   - V : MultiArray [n x n]  (eigenvectors as columns)
     */
    public static readonly steqr_vectors_1 = (diag: ComplexType[], offdiag: ComplexType[], maxIter?: number): { D: MultiArray; V: MultiArray } => {
        const n = diag.length;
        const maxIts = maxIter ?? n * 1000;
        // Copy working arrays
        const Dwork: ComplexType[] = diag.slice();
        const E: ComplexType[] = offdiag.slice();
        let m = n - 1;
        let its = 0;
        // Eigenvector accumulator V = Identity(n)
        const V = new MultiArray([n, n]);
        V.array = LAPACK.eye(n, n);
        // Main QR iteration loop (your implementation adapted)
        while (m > 0 && its < maxIts) {
            // Find last index k with E[k] != 0
            let k = m - 1;
            while (k >= 0 && Complex.realIsZero(Complex.abs(E[k]))) k--;
            if (k < 0) {
                m--;
                continue;
            }
            // Wilkinson shift
            const dk = Dwork[m - 1];
            const dm = Dwork[m];
            const ek = E[m - 1];
            const delta = Complex.mul(Complex.sub(dk, dm), Complex.onediv2());
            const t = Complex.add(dm, Complex.rdiv(Complex.mul(ek, ek), Complex.add(delta, Complex.sign(delta))));
            // implicit QR step
            let x = Complex.sub(Dwork[0], t);
            let z = E[0];
            for (let i = 0; i < m; i++) {
                // r = sqrt(x^2 + z^2)
                const r = Complex.sqrt(Complex.add(Complex.mul(x, x), Complex.mul(z, z)));
                const c = Complex.rdiv(x, r);
                const s = Complex.rdiv(z, r);
                // Apply rotation to eigenvector matrix V (rows i and i+1)
                for (let col = 0; col < n; col++) {
                    const v0 = V.array[i][col];
                    const v1 = V.array[i + 1][col];
                    V.array[i][col] = Complex.add(Complex.mul(c, v0 as ComplexType), Complex.mul(s, v1 as ComplexType));
                    V.array[i + 1][col] = Complex.sub(Complex.mul(c, v1 as ComplexType), Complex.mul(s, v0 as ComplexType));
                }
                // Update Dwork and E
                if (i > 0) {
                    E[i - 1] = Complex.mul(r, Complex.sign(E[i - 1]));
                }
                const d0 = Dwork[i];
                const d1 = Dwork[i + 1];
                const e = E[i];
                Dwork[i] = Complex.add(Complex.add(Complex.mul(Complex.mul(c, c), d0), Complex.mul(Complex.mul(s, s), d1)), Complex.mul(Complex.mul(Complex.mul(c, s), e), Complex.two()));
                Dwork[i + 1] = Complex.add(
                    Complex.add(Complex.mul(Complex.mul(s, s), d0), Complex.mul(Complex.mul(c, c), d1)),
                    Complex.mul(Complex.mul(Complex.mul(c, s), e), Complex.create(-2)),
                );
                E[i] = Complex.sub(Complex.mul(Complex.mul(c, s), Complex.sub(d1, d0)), e);
                // Prepare next step
                if (i < m - 1) {
                    x = E[i];
                    z = Complex.mul(s, E[i + 1]);
                    E[i + 1] = Complex.mul(c, E[i + 1]);
                }
            }
            its++;
        }
        // Convert Dwork (ComplexType[]) into MultiArray column [n x 1]
        const Dcol = MultiArray.toColumnVector(Dwork);
        MultiArray.setType(Dcol);
        MultiArray.setType(V);
        return { D: Dcol, V };
    };

    /**
     * Stable steqr_vectors: compute eigenvalues and eigenvectors of symmetric tridiagonal T
     * Inputs:
     *  - diag: ComplexType[]  (length n)
     *  - offdiag: ComplexType[] (length n-1, last may be unused)
     * Returns:
     *  { D: MultiArray (n x 1), V: MultiArray (n x n) }
     *
     * Numeric improvements:
     * - compute r using Math.hypot of magnitudes to avoid overflow
     * - deflation test for tiny subdiagonals
     * - reasonable max iterations and early exit
     */
    /**
     * steqr_vectors (numeric-real kernel)
     * - diag: ComplexType[]  (length n)  -- assumed real values
     * - offdiag: ComplexType[] (length n-1)
     * Returns { D: MultiArray (n x 1), V: MultiArray (n x n) }
     *
     * Numeric kernel works in JS numbers for D/E and uses Complex only to update V.
     */
    public static readonly steqr_vectors_0 = (diag: ComplexType[], offdiag: ComplexType[], maxIteration?: number): { D: MultiArray; V: MultiArray } => {
        const n = diag.length;
        const maxIts = maxIteration ?? Math.max(LAPACK.settings.maxIterationFactor, n * LAPACK.settings.maxIterationFactor);
        // Build numeric tridiagonal arrays
        const Dwork: number[] = new Array(n);
        const E: number[] = new Array(n);
        for (let i = 0; i < n; i++) Dwork[i] = Complex.realToNumber(diag[i]);
        for (let i = 0; i < n - 1; i++) E[i] = Complex.realToNumber(offdiag[i]);
        E[n - 1] = 0;

        // V: identity MultiArray (ComplexType)
        const V = new MultiArray([n, n]);
        const eyeMA = LAPACK.eye(n, n);
        V.array = eyeMA;

        const EPS = Number.EPSILON || 2.220446049250313e-16;
        const SAFETY = 100;

        // ---------- Attempt: implicit QR sweeps (clean O(n^2) implementation) ----------
        const Dqr = Dwork.slice();
        const Eqr = E.slice();
        let m = n - 1;
        let itsTotal = 0;

        // Make a local copy of V (ComplexType[][]) to accumulate rotations
        const Vqr: ComplexType[][] = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r === c ? Complex.create(1) : Complex.create(0))));

        let sweepFailed = false;

        try {
            while (m > 0 && itsTotal < maxIts) {
                // find deflation index k (from m-1 downwards)
                let k = m - 1;
                while (k >= 0) {
                    const absE = Math.abs(Eqr[k]);
                    const thresh = EPS * SAFETY * (Math.abs(Dqr[k]) + Math.abs(Dqr[k + 1]));
                    if (absE <= thresh) {
                        Eqr[k] = 0;
                        break;
                    }
                    k--;
                }
                if (k < 0) k = 0;
                if (k === m) {
                    m--;
                    continue;
                }

                let itsBlock = 0;
                while (k < m && itsBlock < maxIts && itsTotal < maxIts) {
                    itsBlock++;
                    itsTotal++;

                    // Wilkinson shift from trailing 2x2
                    const dm = Dqr[m];
                    const dm1 = Dqr[m - 1];
                    const em1 = Eqr[m - 1];
                    const delta = (dm1 - dm) / 2;
                    const hypotVal = Math.hypot(delta, em1);
                    const denom = delta + (delta >= 0 ? hypotVal : -hypotVal);
                    const t = denom === 0 ? dm - Math.abs(em1) : dm + (em1 * em1) / denom;

                    // initialize bulge
                    let x = Dqr[0] - t;
                    let z = Eqr[0];
                    let r_prev = 0;

                    for (let i = 0; i < m; i++) {
                        const r = Math.hypot(x, z);
                        if (r === 0) {
                            if (i < m - 1) {
                                x = Eqr[i];
                                z = 0;
                            }
                            continue;
                        }
                        const c = x / r;
                        const s = z / r;

                        // apply rotation to Vqr rows i and i+1
                        const cC = Complex.create(c);
                        const sC = Complex.create(s);
                        for (let col = 0; col < n; col++) {
                            const a = Vqr[i][col];
                            const b = Vqr[i + 1][col];
                            const na = Complex.add(Complex.mul(cC, a), Complex.mul(sC, b));
                            const nb = Complex.sub(Complex.mul(cC, b), Complex.mul(sC, a));
                            Vqr[i][col] = na;
                            Vqr[i + 1][col] = nb;
                        }

                        // set previous subdiagonal to r_prev
                        if (i > 0) Eqr[i - 1] = r_prev;

                        // save originals
                        const d0 = Dqr[i];
                        const d1 = Dqr[i + 1];
                        const e = Eqr[i];

                        // correct update (stable form)
                        // compute new subdiagonal e' and update diagonals
                        // derived from rotating the 2x2 block
                        const newEi = c * e - s * ((d1 - d0) / 2);
                        // update diagonals using rotated representation (approx)
                        // This formula aims to keep symmetry and avoid large cancellation
                        const newD0 = d0 + 2 * s * c * e;
                        const newD1 = d1 - 2 * s * c * e;

                        Dqr[i] = newD0;
                        Dqr[i + 1] = newD1;
                        Eqr[i] = newEi;

                        // propagate bulge to the right
                        if (i < m - 1) {
                            const e_ip1_old = Eqr[i + 1];
                            r_prev = s * e_ip1_old;
                            Eqr[i + 1] = c * e_ip1_old;
                            x = Eqr[i];
                            z = r_prev;
                        } else {
                            // last rotation: set r_prev for last subdiagonal
                            r_prev = s * 0;
                            x = Eqr[i];
                            z = 0;
                        }
                    } // end sweep

                    // after sweep place r_prev into last subdiagonal
                    if (m - 1 >= 0) Eqr[m - 1] = r_prev;

                    // deflation test
                    for (let i = 0; i < m; i++) {
                        const thresh = EPS * SAFETY * (Math.abs(Dqr[i]) + Math.abs(Dqr[i + 1]));
                        if (Math.abs(Eqr[i]) <= thresh) Eqr[i] = 0;
                    }
                    while (m > 0 && Eqr[m - 1] === 0) m--;
                } // end block loop
            } // end while m>0
        } catch (err) {
            // If anything unexpected occurs, mark failure and fall back
            sweepFailed = true;
        }

        // Build candidate outputs from QR attempt
        const Dcand = Dqr.slice();
        // Build candidate V MultiArray from Vqr
        const Vcand = new MultiArray([n, n]);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vcand.array[r][c] = Vqr[r][c];
        MultiArray.setType(Vcand);

        // ---------- Validate candidate: compute residual || T*V - V*Lambda || ----------
        const buildTandResidual = (): number => {
            // build tridiagonal T as dense numeric matrix
            const T: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; i++) {
                T[i][i] = Dwork[i]; // original Dwork not changed here
                if (i < n - 1) {
                    T[i][i + 1] = E[i];
                    T[i + 1][i] = E[i];
                }
            }
            // compute T * Vcand_num - Vcand_num * diag(Dcand)
            // extract numeric Vcand_num
            const Vnum: number[][] = Array.from({ length: n }, (_, r) => Array(n).fill(0));
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vnum[r][c] = Complex.realToNumber(Vcand.array[r][c] as ComplexType);
            // compute B = T*Vnum
            const B: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) if (T[i][k] !== 0) for (let j = 0; j < n; j++) B[i][j] += T[i][k] * Vnum[k][j];
            // compute C = Vnum * diag(Dcand)
            const C: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = Vnum[i][j] * Dcand[j];
            // compute norm of B - C (Frobenius)
            let s = 0;
            for (let i = 0; i < n; i++)
                for (let j = 0; j < n; j++) {
                    const v = B[i][j] - C[i][j];
                    s += v * v;
                }
            return Math.sqrt(s);
        };

        const residual = buildTandResidual();

        const RESID_TOL = 1e-8 * Math.max(1, residual); // relative tolerance
        const acceptQR = !sweepFailed && residual <= RESID_TOL;

        if (!acceptQR) {
            // ---------- Fallback: robust Jacobi cyclic on dense T ----------
            // Build dense T from original diag/offdiag (use Dwork/E from start)
            const T: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
            for (let i = 0; i < n; i++) {
                T[i][i] = Dwork[i];
                if (i < n - 1) {
                    T[i][i + 1] = E[i];
                    T[i + 1][i] = E[i];
                }
            }

            // Jacobi cyclic for symmetric matrix T
            const Znum: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));

            const tol = 1e-12;
            const maxSweeps = Math.max(50, Math.floor(maxIts / Math.max(1, n)));
            const offNorm = (M: number[][]) => {
                let sum = 0;
                for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) sum += M[i][j] * M[i][j];
                return Math.sqrt(sum);
            };

            for (let sweep = 0; sweep < maxSweeps; sweep++) {
                let any = false;
                for (let p = 0; p < n - 1; p++) {
                    for (let q = p + 1; q < n; q++) {
                        const apq = T[p][q];
                        if (Math.abs(apq) <= tol) continue;
                        const app = T[p][p];
                        const aqq = T[q][q];
                        const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
                        const c = Math.cos(phi);
                        const s = Math.sin(phi);
                        // rotate
                        for (let k = 0; k < n; k++) {
                            if (k !== p && k !== q) {
                                const akp = T[k][p];
                                const akq = T[k][q];
                                T[k][p] = c * akp - s * akq;
                                T[p][k] = T[k][p];
                                T[k][q] = s * akp + c * akq;
                                T[q][k] = T[k][q];
                            }
                        }
                        const new_app = c * c * app - 2 * s * c * apq + s * s * aqq;
                        const new_aqq = s * s * app + 2 * s * c * apq + c * c * aqq;
                        T[p][p] = new_app;
                        T[q][q] = new_aqq;
                        T[p][q] = 0;
                        T[q][p] = 0;
                        for (let r = 0; r < n; r++) {
                            const zrp = Znum[r][p];
                            const zrq = Znum[r][q];
                            Znum[r][p] = c * zrp - s * zrq;
                            Znum[r][q] = s * zrp + c * zrq;
                        }
                        any = true;
                    }
                }
                if (!any) break;
                if (offNorm(T) <= tol) break;
            }

            // Extract eigenvalues from diagonal and build outputs
            const Dcol = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) Dcol.array[i][0] = Complex.create(T[i][i]);

            // Fill V MultiArray from Znum
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V.array[r][c] = Complex.create(Znum[r][c]);

            MultiArray.setType(Dcol);
            MultiArray.setType(V);

            return { D: Dcol, V };
        }

        // If QR was accepted: build outputs using Dcand and Vcand
        // sort eigenvalues ascending and permute Vcand
        const idxSorted = Dcand.map((val, i) => ({ val, i })).sort((a, b) => a.val - b.val);
        const evals = idxSorted.map((x) => x.val);
        const Vsorted: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.create(0)));
        for (let newc = 0; newc < n; newc++) {
            const oldc = idxSorted[newc].i;
            for (let r = 0; r < n; r++) Vsorted[r][newc] = Vcand.array[r][oldc] as ComplexType;
        }
        const DcolFinal = new MultiArray([n, 1]);
        for (let i = 0; i < n; i++) DcolFinal.array[i][0] = Complex.create(evals[i]);
        V.array = Vsorted;

        MultiArray.setType(DcolFinal);
        MultiArray.setType(V);

        return { D: DcolFinal, V };
    };

    public static readonly steqr_vectors_2 = (diag: ComplexType[], offdiag: ComplexType[], maxIteration?: number): { D: MultiArray; V: MultiArray } => {
        const n = diag.length;
        const maxIts = maxIteration ?? Math.max(LAPACK.settings.maxIterationFactor, n * LAPACK.settings.maxIterationFactor);
        // Build numeric tridiagonal arrays
        const Dwork = diag.map((value) => Complex.real(value));
        const E = offdiag.map((value) => Complex.real(value));
        E[n - 1] = Complex.zero();

        // V: identity MultiArray (ComplexType)
        const V = new MultiArray([n, n]);
        V.array = LAPACK.eye(n, n);

        const EPS = Complex.epsilon();
        const SAFETY = Complex.create(100);

        // ---------- Attempt: implicit QR sweeps (clean O(n^2) implementation) ----------
        const Dqr = Dwork.slice();
        const Eqr = E.slice();
        let m = n - 1;
        let itsTotal = 0;

        // Make a local copy of V (ComplexType[][]) to accumulate rotations
        const Vqr: ComplexType[][] = LAPACK.eye(n, n);

        let sweepFailed = false;

        try {
            while (m > 0 && itsTotal < maxIts) {
                // find deflation index k (from m-1 downwards)
                let k = m - 1;
                while (k >= 0) {
                    const absE = Complex.abs(Eqr[k]);
                    const thresh = Complex.mul(Complex.mul(EPS, SAFETY), Complex.add(Complex.abs(Dqr[k]), Complex.abs(Dqr[k + 1])));
                    if (Complex.toBoolean(Complex.le(absE, thresh))) {
                        Eqr[k] = Complex.zero();
                        break;
                    }
                    k--;
                }
                if (k < 0) k = 0;
                if (k === m) {
                    m--;
                    continue;
                }

                let itsBlock = 0;
                while (k < m && itsBlock < maxIts && itsTotal < maxIts) {
                    itsBlock++;
                    itsTotal++;

                    // Wilkinson shift from trailing 2x2
                    const dm = Dqr[m];
                    const dm1 = Dqr[m - 1];
                    const em1 = Eqr[m - 1];
                    const delta = Complex.rdiv(Complex.sub(dm1, dm), Complex.two());
                    const hypotVal = Complex.hypot(delta, em1);
                    const denom = Complex.add(delta, Complex.toBoolean(Complex.ge(delta, Complex.zero())) ? hypotVal : Complex.neg(hypotVal));
                    const t = Complex.toBoolean(Complex.eq(denom, Complex.zero())) ? Complex.sub(dm, Complex.abs(em1)) : Complex.add(dm, Complex.rdiv(Complex.mul(em1, em1), denom));

                    // initialize bulge
                    let x = Complex.sub(Dqr[0], t);
                    let z = Eqr[0];
                    let r_prev = Complex.zero();

                    for (let i = 0; i < m; i++) {
                        const r = Complex.hypot(x, z);
                        if (Complex.toBoolean(Complex.eq(r, Complex.zero()))) {
                            if (i < m - 1) {
                                x = Eqr[i];
                                z = Complex.zero();
                            }
                            continue;
                        }
                        const c = Complex.rdiv(x, r);
                        const s = Complex.rdiv(z, r);

                        // apply rotation to Vqr rows i and i+1
                        const cC = c;
                        const sC = s;
                        for (let col = 0; col < n; col++) {
                            const a = Vqr[i][col];
                            const b = Vqr[i + 1][col];
                            const na = Complex.add(Complex.mul(cC, a), Complex.mul(sC, b));
                            const nb = Complex.sub(Complex.mul(cC, b), Complex.mul(sC, a));
                            Vqr[i][col] = na;
                            Vqr[i + 1][col] = nb;
                        }

                        // set previous subdiagonal to r_prev
                        if (i > 0) Eqr[i - 1] = r_prev;

                        // save originals
                        const d0 = Dqr[i];
                        const d1 = Dqr[i + 1];
                        const e = Eqr[i];

                        // correct update (stable form)
                        // compute new subdiagonal e' and update diagonals
                        // derived from rotating the 2x2 block
                        const newEi = Complex.sub(Complex.mul(c, e), Complex.mul(s, Complex.rdiv(Complex.sub(d1, d0), Complex.two())));
                        // update diagonals using rotated representation (approx)
                        // This formula aims to keep symmetry and avoid large cancellation
                        const newD0 = Complex.add(d0, Complex.mul(Complex.two(), Complex.mul(s, Complex.mul(c, e))));
                        const newD1 = Complex.sub(d1, Complex.mul(Complex.two(), Complex.mul(s, Complex.mul(c, e))));

                        Dqr[i] = newD0;
                        Dqr[i + 1] = newD1;
                        Eqr[i] = newEi;

                        // propagate bulge to the right
                        if (i < m - 1) {
                            const e_ip1_old = Eqr[i + 1];
                            r_prev = Complex.mul(s, e_ip1_old);
                            Eqr[i + 1] = Complex.mul(c, e_ip1_old);
                            x = Eqr[i];
                            z = r_prev;
                        } else {
                            // last rotation: set r_prev for last subdiagonal
                            r_prev = Complex.mul(s, Complex.zero());
                            x = Eqr[i];
                            z = Complex.zero();
                        }
                    } // end sweep

                    // after sweep place r_prev into last subdiagonal
                    if (m - 1 >= 0) Eqr[m - 1] = r_prev;

                    // deflation test
                    for (let i = 0; i < m; i++) {
                        const thresh = Complex.mul(EPS, Complex.mul(SAFETY, Complex.add(Complex.abs(Dqr[i]), Complex.abs(Dqr[i + 1]))));
                        if (Complex.toBoolean(Complex.le(Complex.abs(Eqr[i]), thresh))) Eqr[i] = Complex.zero();
                    }
                    while (m > 0 && Complex.toBoolean(Complex.eq(Eqr[m - 1], Complex.zero()))) m--;
                } // end block loop
            } // end while m>0
        } catch (err) {
            // If anything unexpected occurs, mark failure and fall back
            sweepFailed = true;
        }

        // Build candidate outputs from QR attempt
        const Dcand = Dqr.slice();
        // Build candidate V MultiArray from Vqr
        const Vcand = new MultiArray([n, n]);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vcand.array[r][c] = Vqr[r][c];
        MultiArray.setType(Vcand);

        // ---------- Validate candidate: compute residual || T*V - V*Lambda || ----------
        const buildTandResidual = (): ComplexType => {
            // build tridiagonal T as dense numeric matrix
            const T: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let i = 0; i < n; i++) {
                T[i][i] = Dwork[i]; // original Dwork not changed here
                if (i < n - 1) {
                    T[i][i + 1] = E[i];
                    T[i + 1][i] = E[i];
                }
            }
            // compute T * Vcand_num - Vcand_num * diag(Dcand)
            // extract numeric Vcand_num
            const Vnum: ComplexType[][] = Array.from({ length: n }, (_, r) => Array(n).fill(Complex.zero()));
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vnum[r][c] = Vcand.array[r][c] as ComplexType;
            // compute B = T*Vnum
            const B: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let i = 0; i < n; i++)
                for (let k = 0; k < n; k++) if (Complex.toBoolean(Complex.ne(T[i][k], Complex.zero()))) for (let j = 0; j < n; j++) Complex.mulAndSumTo(B[i][j], T[i][k], Vnum[k][j]);
            // compute C = Vnum * diag(Dcand)
            const C: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = Complex.mul(Vnum[i][j], Dcand[j]);
            // compute norm of B - C (Frobenius)
            let s = Complex.zero();
            for (let i = 0; i < n; i++)
                for (let j = 0; j < n; j++) {
                    const v = Complex.sub(B[i][j], C[i][j]);
                    Complex.mulAndSumTo(s, v, v);
                }
            return Complex.sqrt(s);
        };

        const residual = buildTandResidual();

        const RESID_TOL = Complex.mul(Complex.create(1e-8), Complex.max(Complex.one(), residual)); // relative tolerance
        const acceptQR = !sweepFailed && Complex.toBoolean(Complex.le(residual, RESID_TOL));

        if (!acceptQR) {
            // ---------- Fallback: robust Jacobi cyclic on dense T ----------
            // Build dense T from original diag/offdiag (use Dwork/E from start)
            const T: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let i = 0; i < n; i++) {
                T[i][i] = Dwork[i];
                if (i < n - 1) {
                    T[i][i + 1] = E[i];
                    T[i + 1][i] = E[i];
                }
            }

            // Jacobi cyclic for symmetric matrix T
            const Znum: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? Complex.one() : Complex.zero())));

            const tol = Complex.create(1e-12);
            const maxSweeps = Math.max(50, Math.floor(maxIts / Math.max(1, n)));
            const offNorm = (M: ComplexType[][]) => {
                let sum = Complex.zero();
                for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) Complex.mulAndSumTo(sum, M[i][j], M[i][j]);
                return Complex.sqrt(sum);
            };

            for (let sweep = 0; sweep < maxSweeps; sweep++) {
                let any = false;
                for (let p = 0; p < n - 1; p++) {
                    for (let q = p + 1; q < n; q++) {
                        const apq = T[p][q];
                        if (Complex.toBoolean(Complex.le(Complex.abs(apq), tol))) continue;
                        const app = T[p][p];
                        const aqq = T[q][q];
                        const phi = Complex.mul(Complex.onediv2(), Complex.atan2(Complex.mul(Complex.two(), apq), Complex.sub(aqq, app)));
                        const c = Complex.cos(phi);
                        const s = Complex.sin(phi);
                        // rotate
                        for (let k = 0; k < n; k++) {
                            if (k !== p && k !== q) {
                                const akp = T[k][p];
                                const akq = T[k][q];
                                T[k][p] = Complex.sub(Complex.mul(c, akp), Complex.mul(s, akq));
                                T[p][k] = T[k][p];
                                T[k][q] = Complex.add(Complex.mul(s, akp), Complex.mul(c, akq));
                                T[q][k] = T[k][q];
                            }
                        }
                        const new_app = Complex.add(
                            Complex.sub(Complex.mul(Complex.mul(c, c), app), Complex.mul(Complex.mul(Complex.mul(Complex.two(), s), c), apq)),
                            Complex.mul(Complex.mul(s, s), aqq),
                        );
                        const new_aqq = Complex.add(
                            Complex.add(Complex.mul(Complex.mul(s, s), app), Complex.mul(Complex.mul(Complex.mul(Complex.two(), s), c), apq)),
                            Complex.mul(Complex.mul(c, c), aqq),
                        );
                        T[p][p] = new_app;
                        T[q][q] = new_aqq;
                        T[p][q] = Complex.zero();
                        T[q][p] = Complex.zero();
                        for (let r = 0; r < n; r++) {
                            const zrp = Znum[r][p];
                            const zrq = Znum[r][q];
                            Znum[r][p] = Complex.sub(Complex.mul(c, zrp), Complex.mul(s, zrq));
                            Znum[r][q] = Complex.add(Complex.mul(s, zrp), Complex.mul(c, zrq));
                        }
                        any = true;
                    }
                }
                if (!any) break;
                if (offNorm(T) <= tol) break;
            }

            // Extract eigenvalues from diagonal and build outputs
            const Dcol = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) Dcol.array[i][0] = T[i][i];

            // Fill V MultiArray from Znum
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V.array[r][c] = Znum[r][c];

            MultiArray.setType(Dcol);
            MultiArray.setType(V);

            return { D: Dcol, V };
        }

        // If QR was accepted: build outputs using Dcand and Vcand
        // sort eigenvalues ascending and permute Vcand
        const idxSorted = Dcand.map((val, i) => ({ val, i })).sort((a, b) => Complex.realToNumber(Complex.sub(a.val, b.val)));
        const evals = idxSorted.map((x) => x.val);
        const Vsorted: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.create(0)));
        for (let newc = 0; newc < n; newc++) {
            const oldc = idxSorted[newc].i;
            for (let r = 0; r < n; r++) Vsorted[r][newc] = Vcand.array[r][oldc] as ComplexType;
        }
        const DcolFinal = new MultiArray([n, 1]);
        for (let i = 0; i < n; i++) DcolFinal.array[i][0] = evals[i];
        V.array = Vsorted;

        MultiArray.setType(DcolFinal);
        MultiArray.setType(V);

        return { D: DcolFinal, V };
    };

    // --------------------------
    // numeric kernel (real) - cleaned numeric implementation (works with numbers)
    // --------------------------

    // public static readonly numeric_jacobi_symmetric_dense = (Dnum_in: number[], Enum_in: number[], maxItsLocal: number): { Dnum: number[]; Vnum: ComplexType[][] } => {
    //     const nloc = Dnum_in.length;
    //     const Dn = Dnum_in.slice();
    //     const En = Enum_in.slice();
    //     const Vloc: ComplexType[][] = Array.from({ length: nloc }, (_, r) => Array.from({ length: nloc }, (_, c) => (r === c ? Complex.one() : Complex.zero())));

    //     const EPS = Number.EPSILON || 2.220446049250313e-16;
    //     const SAFETY = 100;

    //     let mloc = nloc - 1;
    //     let itsTotalLocal = 0;

    //     while (mloc > 0) {
    //         // find deflation index k
    //         let k = mloc - 1;
    //         while (k >= 0) {
    //             const absE = Math.abs(En[k]);
    //             const thresh = EPS * SAFETY * (Math.abs(Dn[k]) + Math.abs(Dn[k + 1]));
    //             if (absE <= thresh) {
    //                 En[k] = 0;
    //                 break;
    //             }
    //             k--;
    //         }
    //         if (k < 0) k = 0;

    //         if (k === mloc) {
    //             mloc--;
    //             continue;
    //         }

    //         let itsBlock = 0;
    //         while (k < mloc && itsBlock < maxItsLocal && itsTotalLocal < maxItsLocal) {
    //             itsBlock++;
    //             itsTotalLocal++;

    //             // Wilkinson shift for trailing 2x2
    //             const dm = Dn[mloc];
    //             const dm1 = Dn[mloc - 1];
    //             const em1 = En[mloc - 1];
    //             const delta = (dm1 - dm) / 2;
    //             const hypotVal = Math.hypot(delta, em1);
    //             const denom = delta + (delta >= 0 ? hypotVal : -hypotVal);
    //             const t = denom === 0 ? dm - Math.abs(em1) : dm + (em1 * em1) / denom;

    //             // implicit QR sweep
    //             let x = Dn[0] - t;
    //             let z = En[0];
    //             let r_prev = 0;

    //             for (let i = 0; i < mloc; i++) {
    //                 const r = Math.hypot(x, z);
    //                 if (r === 0) {
    //                     if (i < mloc - 1) {
    //                         x = En[i];
    //                         z = 0;
    //                     }
    //                     continue;
    //                 }
    //                 const c = x / r;
    //                 const s = z / r;

    //                 // apply rotation to Vloc (rows i and i+1)
    //                 const cC = Complex.create(c);
    //                 const sC = Complex.create(s);
    //                 for (let col = 0; col < nloc; col++) {
    //                     const v0 = Vloc[i][col];
    //                     const v1 = Vloc[i + 1][col];
    //                     const nv0 = Complex.add(Complex.mul(cC, v0), Complex.mul(sC, v1));
    //                     const nv1 = Complex.sub(Complex.mul(cC, v1), Complex.mul(sC, v0));
    //                     Vloc[i][col] = nv0;
    //                     Vloc[i + 1][col] = nv1;
    //                 }

    //                 if (i > 0) {
    //                     En[i - 1] = r * Math.sign(En[i - 1] || 1);
    //                 }

    //                 const d0 = Dn[i];
    //                 const d1 = Dn[i + 1];
    //                 const e = En[i];

    //                 const c2 = c * c;
    //                 const s2 = s * s;
    //                 const cs = c * s;

    //                 const newDi = c2 * d0 + s2 * d1 + 2 * cs * e;
    //                 const newDi1 = s2 * d0 + c2 * d1 - 2 * cs * e;
    //                 const newEi = cs * (d1 - d0) - e;

    //                 Dn[i] = newDi;
    //                 Dn[i + 1] = newDi1;
    //                 En[i] = newEi;

    //                 if (i < mloc - 1) {
    //                     const e_ip1_old = En[i + 1];
    //                     En[i + 1] = c * e_ip1_old;
    //                     x = En[i];
    //                     z = s * e_ip1_old;
    //                 } else {
    //                     x = En[i];
    //                     z = 0;
    //                 }
    //             } // end sweep

    //             // deflation
    //             for (let i = 0; i < mloc; i++) {
    //                 const thresh = EPS * SAFETY * (Math.abs(Dn[i]) + Math.abs(Dn[i + 1]));
    //                 if (Math.abs(En[i]) <= thresh) En[i] = 0;
    //             }
    //             while (mloc > 0 && En[mloc - 1] === 0) mloc--;
    //         } // end inner while
    //         if (itsTotalLocal >= maxItsLocal) break;
    //     } // end while mloc>0

    //     return { Dnum: Dn, Vnum: Vloc };
    // }; // end numeric core

    // public static readonly numeric_jacobi_symmetric_dense = (Dnum_in: number[], Enum_in: number[], maxItsLocal: number): { Dnum: number[]; Vnum: ComplexType[][] } => {
    //     const nloc = Dnum_in.length;
    //     if (nloc === 0) return { Dnum: [], Vnum: [] };
    //     if (nloc === 1) return { Dnum: [Dnum_in[0]], Vnum: [[Complex.one()]] };

    //     // make working copies
    //     const Dn: number[] = Dnum_in.slice();
    //     const En: number[] = Enum_in.slice();
    //     En[nloc - 1] = 0;

    //     // V accumulator (ComplexType entries)
    //     const Vloc: ComplexType[][] = Array.from({ length: nloc }, (_, r) =>
    //         Array.from({ length: nloc }, (_, c) => (r === c ? Complex.one() : Complex.zero()))
    //     );

    //     const EPS = Number.EPSILON || 2.220446049250313e-16;
    //     const SAFETY = 100;

    //     let m = nloc - 1;
    //     let itsTotal = 0;

    //     // main loop: reduce unreduced block [0..m]
    //     while (m > 0) {
    //         // find k such that En[k] is negligible (deflation)
    //         let k = m - 1;
    //         for (; k >= 0; k--) {
    //             const absE = Math.abs(En[k]);
    //             const thresh = EPS * SAFETY * (Math.abs(Dn[k]) + Math.abs(Dn[k + 1]));
    //             if (absE <= thresh) {
    //                 En[k] = 0;
    //                 break;
    //             }
    //         }
    //         if (k < 0) k = 0;

    //         // if already a 1-by-1 block at the end
    //         if (k === m) { m--; continue; }

    //         // iterate on block 0..m
    //         let itsBlock = 0;
    //         while (k < m && itsBlock < maxItsLocal && itsTotal < maxItsLocal) {
    //             itsBlock++; itsTotal++;

    //             // Wilkinson shift computed from bottom 2x2 (stable form)
    //             const dm = Dn[m];
    //             const dm1 = Dn[m - 1];
    //             const em1 = En[m - 1];

    //             // stable shift t
    //             const delta = (dm1 - dm) / 2;
    //             const signDelta = (delta >= 0) ? 1 : -1;
    //             const denom = delta + signDelta * Math.hypot(delta, em1);
    //             const t = (denom === 0) ? (dm - Math.abs(em1)) : (dm + (em1 * em1) / denom);

    //             // initial bulge
    //             let x = Dn[0] - t;
    //             let z = En[0];

    //             // sweep i = 0 .. m-1 (bulge chasing)
    //             for (let i = 0; i < m; i++) {
    //                 // compute Givens rotation that annihilates z
    //                 const r = Math.hypot(x, z);
    //                 if (r === 0) {
    //                     // nothing to rotate; propagate
    //                     // set rotation to identity, but ensure next x/z taken
    //                     if (i < m - 1) {
    //                         x = En[i];
    //                         z = 0;
    //                     }
    //                     continue;
    //                 }
    //                 const c = x / r;
    //                 const s = z / r;

    //                 // Apply rotation to rows i and i+1 of Vloc
    //                 const cC = Complex.create(c);
    //                 const sC = Complex.create(s);
    //                 for (let col = 0; col < nloc; col++) {
    //                     const v0 = Vloc[i][col];
    //                     const v1 = Vloc[i + 1][col];
    //                     Vloc[i][col] = Complex.add(Complex.mul(cC, v0), Complex.mul(sC, v1));
    //                     Vloc[i + 1][col] = Complex.sub(Complex.mul(cC, v1), Complex.mul(sC, v0));
    //                 }

    //                 // update En[i-1] with r (propagate the previous bulge)
    //                 if (i > 0) {
    //                     En[i - 1] = r * Math.sign(En[i - 1] || 1);
    //                 }

    //                 // store originals
    //                 const d0 = Dn[i];
    //                 const d1 = Dn[i + 1];
    //                 const e = En[i];

    //                 // Update diagonal and subdiagonal entries using rotation
    //                 // Formulas derived from applying Givens to 2x2 block
    //                 const c2 = c * c;
    //                 const s2 = s * s;
    //                 const cs = c * s;

    //                 const newD0 = c2 * d0 + s2 * d1 + 2 * cs * e;
    //                 const newD1 = s2 * d0 + c2 * d1 - 2 * cs * e;
    //                 const newE = cs * (d1 - d0) - e;

    //                 Dn[i] = newD0;
    //                 Dn[i + 1] = newD1;
    //                 En[i] = newE;

    //                 // prepare next x,z (propagate bulge)
    //                 if (i < m - 1) {
    //                     const e_ip1_old = En[i + 1];
    //                     // compute new x,z for next rotation
    //                     x = En[i];
    //                     z = s * e_ip1_old;
    //                     // update En[i+1] to c * old
    //                     En[i + 1] = c * e_ip1_old;
    //                 } else {
    //                     // last rotation in sweep
    //                     x = En[i];
    //                     z = 0;
    //                 }
    //             } // end sweep

    //             // deflation check across block
    //             for (let i = 0; i < m; i++) {
    //                 const thresh = EPS * SAFETY * (Math.abs(Dn[i]) + Math.abs(Dn[i + 1]));
    //                 if (Math.abs(En[i]) <= thresh) En[i] = 0;
    //             }
    //             while (m > 0 && En[m - 1] === 0) m--;
    //         } // end inner while

    //         if (itsTotal >= maxItsLocal) {
    //             // reached global iteration limit
    //             console.warn('numeric_jacobi_symmetric_dense: reached maxItsLocal', maxItsLocal);
    //             break;
    //         }
    //     } // end while m>0

    //     return { Dnum: Dn, Vnum: Vloc };
    // }; // end numeric_jacobi_symmetric_dense

    // public static readonly numeric_jacobi_symmetric_dense = (Dnum_in: number[], Enum_in: number[], maxItsLocal: number): { Dnum: number[]; Vnum: ComplexType[][] } => {
    //     // Robust fallback core: use Jacobi cyclic for small/medium n (very stable).
    //     const nloc = Dnum_in.length;
    //     if (nloc === 0) return { Dnum: [], Vnum: [] };
    //     if (nloc === 1) return { Dnum: [Dnum_in[0]], Vnum: [[Complex.one()]] };

    //     // Build dense symmetric matrix T (number[][]) from tridiagonal (Dnum_in, Enum_in)
    //     const T: number[][] = Array.from({ length: nloc }, () => Array(nloc).fill(0));
    //     for (let i = 0; i < nloc; i++) {
    //         T[i][i] = Dnum_in[i];
    //         if (i < nloc - 1) {
    //             const e = Enum_in[i];
    //             T[i][i + 1] = e;
    //             T[i + 1][i] = e;
    //         }
    //     }

    //     // Initialize V (numeric rotation accumulator) as identity (number[][])
    //     const Vnum: number[][] = Array.from({ length: nloc }, (_, i) => Array.from({ length: nloc }, (_, j) => (i === j ? 1 : 0)));

    //     // Jacobi cyclic parameters
    //     const tol = 1e-14;
    //     const maxSweeps = Math.max(50, Math.min(5000, Math.floor(maxItsLocal / Math.max(1, nloc))));
    //     const offNorm = (M: number[][]) => {
    //         let s = 0;
    //         for (let i = 0; i < nloc; i++)
    //             for (let j = i + 1; j < nloc; j++) s += M[i][j] * M[i][j];
    //         return Math.sqrt(s);
    //     };

    //     // Cyclic Jacobi rotation (real symmetric)
    //     for (let sweep = 0; sweep < maxSweeps; sweep++) {
    //         let any = false;
    //         for (let p = 0; p < nloc - 1; p++) {
    //             for (let q = p + 1; q < nloc; q++) {
    //                 const apq = T[p][q];
    //                 // small threshold relative to diagonal magnitudes
    //                 const thresh = 1e-15 * Math.abs(T[p][p] + T[q][q]) + Number.EPSILON;
    //                 if (Math.abs(apq) <= thresh) continue;
    //                 // compute rotation angle
    //                 const app = T[p][p];
    //                 const aqq = T[q][q];
    //                 const tau = (aqq - app) === 0 ? 0 : (2 * apq) / (aqq - app);
    //                 // compute tan(theta) robustly
    //                 const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    //                 const c = 1 / Math.sqrt(1 + t * t);
    //                 const s = t * c;
    //                 // apply rotation to T
    //                 for (let k = 0; k < nloc; k++) {
    //                     if (k !== p && k !== q) {
    //                         const kip = T[k][p];
    //                         const kiq = T[k][q];
    //                         T[k][p] = c * kip - s * kiq;
    //                         T[p][k] = T[k][p];
    //                         T[k][q] = s * kip + c * kiq;
    //                         T[q][k] = T[k][q];
    //                     }
    //                 }
    //                 const new_app = c * c * app - 2 * s * c * apq + s * s * aqq;
    //                 const new_aqq = s * s * app + 2 * s * c * apq + c * c * aqq;
    //                 T[p][p] = new_app;
    //                 T[q][q] = new_aqq;
    //                 T[p][q] = 0;
    //                 T[q][p] = 0;
    //                 // update Vnum
    //                 for (let r = 0; r < nloc; r++) {
    //                     const vrp = Vnum[r][p];
    //                     const vrq = Vnum[r][q];
    //                     Vnum[r][p] = c * vrp - s * vrq;
    //                     Vnum[r][q] = s * vrp + c * vrq;
    //                 }
    //                 any = true;
    //             }
    //         }
    //         if (!any) break;
    //         if (offNorm(T) <= tol) break;
    //     }

    //     // extract eigenvalues (diagonal of T) and eigenvectors (Vnum columns)
    //     const Dres: number[] = new Array(nloc);
    //     for (let i = 0; i < nloc; i++) Dres[i] = T[i][i];

    //     // Convert Vnum (number[][]) into ComplexType[][] (Vloc)
    //     const Vloc: ComplexType[][] = Array.from({ length: nloc }, (_, r) => Array.from({ length: nloc }, (_, c) => Complex.create(Vnum[r][c])));

    //     return { Dnum: Dres, Vnum: Vloc };
    // };

    public static readonly numeric_jacobi_symmetric_dense = (Dnum_in: number[], Enum_in: number[], maxItsLocal: number): { Dnum: number[]; Vnum: ComplexType[][] } => {
        const nloc = Dnum_in.length;
        if (nloc === 0) return { Dnum: [], Vnum: [] };
        if (nloc === 1) return { Dnum: [Dnum_in[0]], Vnum: [[Complex.one()]] };
        // Build dense symmetric T (number[][]) from tridiagonal (Dnum_in, Enum_in)
        const T: number[][] = Array.from({ length: nloc }, () => Array(nloc).fill(0));
        for (let i = 0; i < nloc; i++) {
            T[i][i] = Dnum_in[i];
            if (i < nloc - 1) {
                const e = Enum_in[i];
                T[i][i + 1] = e;
                T[i + 1][i] = e;
            }
        }
        // Numeric accumulator for eigenvectors (real)
        const Vnum: number[][] = Array.from({ length: nloc }, (_, i) => Array.from({ length: nloc }, (_, j) => (i === j ? 1 : 0)));
        // Jacobi parameters
        const eps = Number.EPSILON || 2.220446049250313e-16;
        const tol = 1e-14; // target off-diagonal norm tolerance
        const maxSweeps = Math.max(50, Math.min(5000, Math.floor(maxItsLocal / Math.max(1, nloc))));
        const offNorm = (M: number[][]) => {
            let s = 0;
            for (let i = 0; i < nloc; i++) for (let j = i + 1; j < nloc; j++) s += M[i][j] * M[i][j];
            return Math.sqrt(s);
        };
        // Cyclic Jacobi with stable rotation formula (tau = (aqq-app)/(2*apq))
        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let any = false;
            for (let p = 0; p < nloc - 1; p++) {
                for (let q = p + 1; q < nloc; q++) {
                    const apq = T[p][q];
                    // relative threshold to consider as nonzero
                    const relThresh = (Math.abs(T[p][p]) + Math.abs(T[q][q])) * 1e-15 + eps;
                    if (Math.abs(apq) <= relThresh) continue;
                    const app = T[p][p];
                    const aqq = T[q][q];
                    // stable tau and t
                    const denom = 2 * apq;
                    // avoid division by zero (if denom==0, skip)
                    if (denom === 0) continue;
                    const tau = (aqq - app) / denom;
                    const signTau = tau >= 0 ? 1 : -1;
                    const t = signTau / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
                    const c = 1 / Math.sqrt(1 + t * t);
                    const s = t * c;
                    // apply rotation to T
                    for (let k = 0; k < nloc; k++) {
                        if (k !== p && k !== q) {
                            const kip = T[k][p];
                            const kiq = T[k][q];
                            T[k][p] = c * kip - s * kiq;
                            T[p][k] = T[k][p];
                            T[k][q] = s * kip + c * kiq;
                            T[q][k] = T[k][q];
                        }
                    }
                    const new_app = c * c * app - 2 * s * c * apq + s * s * aqq;
                    const new_aqq = s * s * app + 2 * s * c * apq + c * c * aqq;
                    T[p][p] = new_app;
                    T[q][q] = new_aqq;
                    T[p][q] = 0;
                    T[q][p] = 0;
                    // update Vnum (columns p and q)
                    for (let r = 0; r < nloc; r++) {
                        const vrp = Vnum[r][p];
                        const vrq = Vnum[r][q];
                        Vnum[r][p] = c * vrp - s * vrq;
                        Vnum[r][q] = s * vrp + c * vrq;
                    }
                    any = true;
                }
            }
            if (!any) break;
            if (offNorm(T) <= tol) break;
        }
        // Extract eigenvalues and build Vloc (ComplexType[][])
        const Dres: number[] = new Array(nloc);
        for (let i = 0; i < nloc; i++) Dres[i] = T[i][i];
        const Vloc: ComplexType[][] = Array.from({ length: nloc }, (_, r) => Array.from({ length: nloc }, (_, c) => Complex.create(Vnum[r][c])));
        return { Dnum: Dres, Vnum: Vloc };
    };

    // --------------------------- HELPERS: BUILD / RESIDUAL / NORMALIZATION / JACOBI ---------------------------

    /**
     * Build dense Hermitian matrix from tridiagonal representation
     *
     * @param diag     diagonal entries
     * @param offdiag  sub/superdiagonal entries (length n-1)
     * @returns dense Hermitian matrix
     */
    public static readonly tridiag_her_to_dense = (diag: ComplexType[], offdiag: ComplexType[]): ComplexType[][] => {
        const n = diag.length;
        const T: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => Complex.zero()));
        for (let i = 0; i < n; i++) {
            T[i][i] = Complex.copy(diag[i]);
            if (i < n - 1) {
                T[i][i + 1] = Complex.copy(offdiag[i]);
                T[i + 1][i] = Complex.conj(offdiag[i]);
            }
        }
        return T;
    };

    /**
     * Compute Frobenius norm of residual || T * V - V * diag(evals) ||_F using real-numeric aggregation.
     * @param T ComplexType[][] dense Hermitian
     * @param V MultiArray (ComplexType entries)
     * @param evalsNum number[] (real eigenvalues)
     * @returns numeric Frobenius norm (number)
     */
    public static readonly compute_residual_numeric = (T: ComplexType[][], V: MultiArray, evalsNum: number[]): number => {
        const n = T.length;
        // convert V to numeric matrix (real parts) using Complex.realToNumber
        const Vnum: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Vnum[i][j] = Complex.realToNumber(V.array[i][j] as ComplexType);
        // build numeric Tnum from real(T) (Hermitian => real diagonal, but off-diagonals may be complex)
        const Tnum: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            Tnum[i][i] = Complex.realToNumber(Complex.real(T[i][i]));
            if (i < n - 1) {
                // use real part of offdiag if Hermitian transformation produced imaginary-free offdiag,
                // otherwise using magnitude might be safer; choose real part to be consistent
                Tnum[i][i + 1] = Complex.realToNumber(Complex.real(T[i][i + 1]));
                Tnum[i + 1][i] = Tnum[i][i + 1];
            }
        }
        // compute B = Tnum * Vnum
        const B: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let k = 0; k < n; k++) {
                const tik = Tnum[i][k];
                if (tik === 0) continue;
                for (let j = 0; j < n; j++) {
                    B[i][j] += tik * Vnum[k][j];
                }
            }
        }
        // compute C = Vnum * diag(evalsNum)
        const C: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) C[i][j] = Vnum[i][j] * evalsNum[j];
        // Frobenius norm of B - C
        let s = 0;
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
                const v = B[i][j] - C[i][j];
                s += v * v;
            }
        return Math.sqrt(s);
    };

    /**
     * Compute Frobenius norm of residual R = A * V - V * diag(evals),
     * @param A
     * @param V
     * @param evals `evals` is `ComplexType[]` or `number[]`.
     * @returns A `number` (real Frobenius norm).
     */
    public static readonly compute_residual_complex = (T: ComplexType[][], V: MultiArray, evals: ComplexType[] | number[]): number => {
        const n = T.length;
        // accumulate sum of |diff|^2
        let s = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // compute (A * V)_{i,j} as ComplexType
                let sum = Complex.zero();
                for (let k = 0; k < n; k++) {
                    // sum += A[i][k] * V[k][j]
                    Complex.mulAndSumTo(sum, T[i][k], V.array[k][j] as ComplexType);
                }
                // compute (V * diag(evals))_{i,j} = V[i][j] * evals[j]
                const lambda = typeof evals[0] === 'number' ? Complex.create(evals[j] as number) : (evals[j] as ComplexType);
                const approx = Complex.mul(V.array[i][j] as ComplexType, lambda);
                // diff = sum - approx
                const diff = Complex.sub(sum, approx);
                // square of abs: |diff|^2 = real( conj(diff) * diff )
                const absNum = Complex.realToNumber(Complex.abs(diff));
                s += absNum * absNum;
            }
        }
        return Math.sqrt(s);
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

    /**
     *
     * @param V
     * @returns
     */
    public static readonly test_orthonormality = (V: MultiArray): { maxOffDiag: number; maxDiagDeviation: number } => {
        const n = V.dimension[0];
        // compute G = Vᴴ * V (numeric)
        const Gnum: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // compute dot conj(col i)·col j => sum_k conj(V[k][i]) * V[k][j]
                let sumReal = 0;
                for (let k = 0; k < n; k++) {
                    // conj(a)*b is complex; we only care numeric magnitude of deviation -> use real part
                    sumReal += Complex.realToNumber(Complex.mul(Complex.conj(V.array[k][i] as ComplexType), V.array[k][j] as ComplexType));
                }
                Gnum[i][j] = sumReal;
            }
        }
        let maxOff = 0;
        let maxDiagDev = 0;
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
                if (i === j) maxDiagDev = Math.max(maxDiagDev, Math.abs(1 - Gnum[i][i]));
                else maxOff = Math.max(maxOff, Math.abs(Gnum[i][j]));
            }
        return { maxOffDiag: maxOff, maxDiagDeviation: maxDiagDev };
    };

    /**
     *
     * @param A
     * @param V
     * @param Dcol
     * @returns
     */
    public static readonly test_residual = (A: ComplexType[][], V: MultiArray, Dcol: MultiArray): number => {
        const n = A.length;
        const evals: ComplexType[] = new Array(n);
        for (let j = 0; j < n; j++) evals[j] = Dcol.array[j][0] as ComplexType;
        return LAPACKunused.compute_residual_complex(A, V, evals);
    };

    /**
     * Diagnóstico por autovetor:
     * Para cada coluna j:
     *  - lambda = Dcol[j,0]
     *  - rq = (vᴴ * A * v) / (vᴴ * v)   (Rayleigh quotient)
     *  - res_j = || A*v - lambda*v ||_2   (norma euclidiana do residual)
     *
     * Imprime uma tabela (j, lambda, Re(rq), Im(rq), |lambda - rq|, res_j )
     */
    /**
     *
     * @param A
     * @param V
     * @param Dcol
     * @returns
     */
    public static readonly diag_eigenpairs = (A: ComplexType[][], V: MultiArray, Dcol: MultiArray) => {
        const n = A.length;
        const out: any[] = [];
        for (let j = 0; j < n; j++) {
            // build v = column j
            const v: ComplexType[] = new Array(n);
            for (let i = 0; i < n; i++) v[i] = V.array[i][j] as ComplexType;
            // compute vᴴ * A * v  (ComplexType)
            // first w = A * v
            const w: ComplexType[] = new Array(n).fill(Complex.zero());
            for (let i = 0; i < n; i++) {
                let s = Complex.zero();
                for (let k = 0; k < n; k++) s = Complex.add(s, Complex.mul(A[i][k], v[k]));
                w[i] = s;
            }
            // numerator = vᴴ * w
            let numer = Complex.zero();
            for (let i = 0; i < n; i++) numer = Complex.add(numer, Complex.mul(Complex.conj(v[i]), w[i]));
            // denom = vᴴ * v (should be 1 if normalized)
            let denom = Complex.zero();
            for (let i = 0; i < n; i++) denom = Complex.add(denom, Complex.mul(Complex.conj(v[i]), v[i]));
            // Rayleigh quotient rq = numer / denom
            const rq = Complex.rdiv(numer, denom);
            // lambda from Dcol
            const lambda = Dcol.array[j][0] as ComplexType;
            // diff = lambda - rq
            const diff = Complex.sub(lambda, rq);
            const diffNum = Complex.realToNumber(Complex.abs(diff)); // magnitude of difference
            // compute residual vector r = A*v - lambda*v and its 2-norm
            let ssum = 0;
            for (let i = 0; i < n; i++) {
                const av = w[i];
                const lv = Complex.mul(lambda, v[i]);
                const r = Complex.sub(av, lv);
                const rabs = Complex.realToNumber(Complex.abs(r));
                ssum += rabs * rabs;
            }
            const resnorm = Math.sqrt(ssum);
            out.push({
                j,
                lambda,
                rq,
                abs_lambda_minus_rq: diffNum,
                resnorm,
            });
        }
        out.forEach((row) => {
            // console.log(`j=${row.j}  lambda=${Complex.unparse(row.lambda, 0)}  rq=${Complex.unparse(row.rq, 0)}  |λ-rq|=${row.abs_lambda_minus_rq}  res=${row.resnorm}`);
        });
        return out;
    };

    /**
     * Compara listas: ordena autovalores fornecidos e compara com Rayleighs - procura permutações.
     * Retorna um mapeamento aproximado index->index por menor diferença absoluta.
     *
     * Inputs:
     *  - evals: ComplexType[] (autovalores retornados)
     *  - rqs: ComplexType[] (rayleighs calculados para cada coluna v_j)
     *
     * Imprime o pareamento escolhido e as diferenças.
     */
    /**
     *
     * @param evals
     * @param rqs
     * @returns
     */
    public static readonly match_evals_to_rayleighs = (evals: ComplexType[], rqs: ComplexType[]) => {
        const n = evals.length;
        // convert to numbers (real parts) for sorting, but keep complex for differences
        const evalsList = evals.map((val, i) => ({ val, i, re: Complex.realToNumber(Complex.real(val)) }));
        const rqList = rqs.map((val, i) => ({ val, i, re: Complex.realToNumber(Complex.real(val)) }));

        // try greedy matching: for each eval find closest rq by complex abs
        const usedR: boolean[] = Array(n).fill(false);
        const mapping: { evalIndex: number; rqIndex: number; diff: number }[] = [];

        for (let ei = 0; ei < n; ei++) {
            let best = -1;
            let bestDist = Infinity;
            for (let rj = 0; rj < n; rj++) {
                if (usedR[rj]) continue;
                const dC = Complex.sub(evals[ei], rqs[rj]);
                const d = Complex.realToNumber(Complex.abs(dC));
                if (d < bestDist) {
                    bestDist = d;
                    best = rj;
                }
            }
            if (best >= 0) {
                usedR[best] = true;
                mapping.push({ evalIndex: ei, rqIndex: best, diff: bestDist });
            }
        }

        console.log('match_evals_to_rayleighs mapping:');
        mapping.forEach((m) => {
            const er = Complex.realToNumber(Complex.real(evals[m.evalIndex]));
            const rr = Complex.realToNumber(Complex.real(rqs[m.rqIndex]));
            console.log(`eval idx=${m.evalIndex} (val=${er})  -> rq idx=${m.rqIndex} (val=${rr})  diff=${m.diff}`);
        });
        return mapping;
    };

    // --------------------------- steqr_vectors (integrated, uses numeric_jacobi_symmetric_dense + helpers) ---------------------------

    public static readonly steqr_vectors_original = (diag: ComplexType[], offdiag: ComplexType[], maxIter?: number): { D: MultiArray; V: MultiArray; complex: boolean } => {
        const n = diag.length;
        const maxIts = maxIter ?? Math.max(1000, n * 1000);
        /* Prepare Dwork and Ework */
        const Dwork: ComplexType[] = new Array(n);
        const Ework: ComplexType[] = new Array(n);
        // for (let i = 0; i < n; i++) {
        //     Dwork[i] = Complex.copy(diag[i]);
        //     if (i < n - 1) Ework[i] = Complex.copy(offdiag[i]);
        // }
        // if (n > 0) Ework[n - 1] = Complex.zero();
        for (let i = 0; i < n - 1; i++) {
            Dwork[i] = Complex.copy(diag[i]);
            Ework[i] = Complex.copy(offdiag[i]);
        }
        Dwork[n - 1] = Complex.copy(diag[n - 1]);
        Ework[n - 1] = Complex.zero();

        /* detect complex path */
        let needComplexPath = false;
        for (let i = 0; i < n; i++) {
            if (Complex.isComplexValue(Dwork[i])) {
                needComplexPath = true;
                break;
            }
            if (i < n - 1 && Complex.isComplexValue(Ework[i])) {
                needComplexPath = true;
                break;
            }
        }

        // --- DEBUG ---
        {
            console.log(`----- State of tridiagonal about to be solved -----`);
            console.log(`# Arguments:`);
            // console.log(`  diag[0..${diag.length - 1}] = [${diag.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
            // console.log(`  offdiag[0..${offdiag.length - 1}] = [${offdiag.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
            console.log(`# Prepare Dwork and Ework:`);
            // console.log(`  Dwork = [${Dwork.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
            // console.log(`  Ework = [${Ework.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
            console.log(`# Input is complex?:`);
            console.log('  needComplexPath =', needComplexPath ?? false);
        }

        // phases u[] for Hermitian -> real-offdiag transform
        const u: ComplexType[] = new Array(n);
        // Dnum/Enum numeric arrays for core
        const Dnum: number[] = new Array(n);
        const Enum: number[] = new Array(n);
        // if (needComplexPath) {
        //     u[0] = Complex.one();
        //     for (let i = 0; i < n - 1; i++) {
        //         const e = Ework[i];
        //         const absE = Complex.abs(e);
        //         if (Complex.realToNumber(Complex.eq(absE, Complex.zero()))) {
        //             u[i + 1] = u[i];
        //         } else {
        //             const conjE = Complex.conj(e);
        //             const phase = Complex.rdiv(conjE, absE); // conj(e)/|e|
        //             u[i + 1] = Complex.mul(u[i], phase);
        //         }
        //     }
        //     for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Complex.real(Dwork[i]));
        //     for (let i = 0; i < n - 1; i++) {
        //         const tmp = Complex.mul(Complex.conj(u[i]), Complex.mul(Ework[i], u[i + 1]));
        //         Enum[i] = Complex.realToNumber(Complex.abs(tmp));
        //     }
        //     Enum[n - 1] = 0;
        // } else {
        //     for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Dwork[i]);
        //     for (let i = 0; i < n; i++) Enum[i] = Complex.realToNumber(Ework[i]);
        // }

        // --- BEGIN PATCH: force real tridiagonal for Hermitian matrices ---
        // assume Dwork: ComplexType[] (diag), Ework: ComplexType[] (offdiag), n known

        // Detect complex path already computed as needComplexPath = true
        if (needComplexPath) {
            // build phases u[] such that conj(u[i]) * E[i] * u[i+1] is real non-negative
            u[0] = Complex.one();
            for (let i = 0; i < n - 1; i++) {
                const e = Ework[i];
                const absE = Complex.abs(e); // numeric magnitude
                if (Complex.realIsZero(absE)) {
                    // if off-diagonal is zero, keep previous phase // se subdiagonal é zero, manter fase anterior
                    u[i + 1] = Complex.copy(u[i]);
                } else {
                    // // phase = conj(e) / |e|  (this is unit magnitude)
                    // // use rdiv or fallback
                    // const phase = Complex.rdiv(Complex.conj(e), absE);
                    // // u[i+1] = u[i] * phase
                    // u[i + 1] = Complex.mul(u[i], phase);

                    // resolver u[i+1] = absE / ( conj(u[i]) * e )
                    // (isso satisfaz conj(u[i]) * e * u[i+1] = absE)
                    const denom = Complex.mul(Complex.conj(u[i]), e); // ComplexType
                    // denom não deve ser zero; rdiv faz denom invertido com fallback se precisar
                    u[i + 1] = Complex.rdiv(absE, denom);
                    // opcional: renormalizar para evitar drift numérico (forçar magnitude 1)
                    const mag = Complex.realToNumber(Complex.abs(u[i + 1]));
                    if (mag !== 0 && Math.abs(mag - 1) > 1e-12) {
                        u[i + 1] = Complex.rdiv(u[i + 1], Complex.abs(u[i + 1])); // normaliza magnitude para 1
                    }
                }
            }

            // // Verificação: constrói Tprime_check = Uᴴ * T * U e compara off-diagonals com Enum (esperado)
            // {
            //     const nloc = n;
            //     // Toriginal a partir de Dwork/Ework (ComplexType)
            //     const Torig: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
            //     for (let i = 0; i < nloc; i++) {
            //         Torig[i][i] = Complex.copy(Dwork[i]);
            //         if (i < nloc - 1) {
            //             Torig[i][i + 1] = Complex.copy(Ework[i]);
            //             Torig[i + 1][i] = Complex.copy(Ework[i]);
            //         }
            //     }
            //     // build Tprime_check = Uᴴ * Torig * U
            //     const Tprime_check: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
            //     for (let i = 0; i < nloc; i++) {
            //         for (let j = 0; j < nloc; j++) {
            //             // (Uᴴ * T * U)_{ij} = conj(u[i]) * Torig_{ij} * u[j]
            //             const val = Complex.mul(Complex.conj(u[i]), Complex.mul(Torig[i][j], u[j]));
            //             Tprime_check[i][j] = val;
            //         }
            //     }
            //     // check off-diagonals (i,i+1) are approximately real and >= 0
            //     let ok = true;
            //     for (let i = 0; i < nloc - 1; i++) {
            //         const v = Tprime_check[i][i + 1];
            //         const imagAbs = Math.abs(Complex.realToNumber(Complex.imag(v))); // fallback if no Complex.imag
            //         // better: use Complex.realToNumber(Complex.abs(Complex.imagpart)) if helper available
            //         const imagPart = Complex.realToNumber(Complex.sub(v, Complex.real(v))); // if Complex.real returns ComplexType
            //         const realPart = Complex.realToNumber(Complex.real(v));
            //         if (Math.abs(imagPart) > 1e-9 || realPart < -1e-9) {
            //             ok = false;
            //             console.warn(`LAPACK.steqr_vectors: T' check failed at i=${i} -> T'[${i},${i + 1}] = ${Complex.unparse(v, 6)}`);
            //         }
            //     }
            //     if (!ok) {
            //         console.warn('LAPACK.steqr_vectors: computed u[] does NOT produce Tprime with real non-negative off-diagonals. Will still continue but please inspect u[] and Tprime_check.');
            //         console.log('DEBUG: u = [', u.map(z => Complex.unparse(z, 0)).join(', '), ']');
            //     } else {
            //         console.log('LAPACK.steqr_vectors: u[] test ok (Tprime off-diagonals ≈ real & >=0).');
            //     }
            // }

            console.log(`# Phases u[] for Hermitian -> real-offdiag transform`);
            // console.log(`  u[0..${n - 1}] = [${u.map((v) => Complex.unparse(v, 0)).join(', ')}]`);

            // Now produce purely real numeric arrays for the kernel:
            // Dnum[i] = real(Dwork[i])
            // Enum[i] = real( conj(u[i]) * Ework[i] * u[i+1] ) but that's exactly | that complex | (should be >=0)
            for (let i = 0; i < n; i++) {
                // diagonal real part
                Dnum[i] = Complex.realToNumber(Dwork[i]);
            }
            for (let i = 0; i < n - 1; i++) {
                const transformed = Complex.mul(Complex.conj(u[i]), Complex.mul(Ework[i], u[i + 1]));
                // numeric positive value
                Enum[i] = Complex.realToNumber(Complex.abs(transformed));
                // console.log(`transformed: ${Complex.unparse(transformed, 0)}, Enum[i] = ${Enum[i]}`)
            }
        } else {
            // real path (unchanged)
            for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Dwork[i]);
            for (let i = 0; i < n - 1; i++) Enum[i] = Complex.realToNumber(Ework[i]);
        }
        Enum[n - 1] = 0;
        // --- END PATCH ---

        {
            console.log('  Dnum = [', Dnum.map((z) => z.toString()).join(', '), ']');
            console.log('  Enum = [', Enum.map((z) => z.toString()).join(', '), ']');
        }

        // identity V (will be replaced by core result)
        const V = new MultiArray([n, n]);
        V.array = LAPACK.eye(n, n);

        // run numeric real core (assumes LAPACK.numeric_jacobi_symmetric_dense exists)
        const core = LAPACKunused.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIts);

        {
            // logo após obter core
            console.log(`# LAPACK.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIts)`);
            console.log('  core.Dnum:', JSON.stringify(core.Dnum));
            // console.log('  core.Vnum:', JSON.stringify(core.Vnum.map((row) => row.map((z) => Complex.unparse(z, 0)))));
        }

        const DnumFinal = core.Dnum.slice();
        const VnumFinal = core.Vnum.map((row) => row.map((z) => Complex.copy(z)));

        // // DIAG-A (CORRIGIDO) - usa a tridiagonal de entrada (Dnum, Enum)
        // {
        //     const DnumFinal = core.Dnum.slice();     // eigenvalues numeric (numbers)
        //     const VnumFinal = core.Vnum.map((row) => row.map((z) => Complex.copy(z)));     // eigenvectors (ComplexType[][])
        //     const nloc = Dnum.length;        // use Dnum (entrada)
        //     const T_in: number[][] = Array.from({ length: nloc }, () => Array(nloc).fill(0));
        //     for (let i = 0; i < nloc; i++) {
        //         T_in[i][i] = Dnum[i];
        //         if (i < nloc - 1) { T_in[i][i + 1] = Enum[i]; T_in[i + 1][i] = Enum[i]; }
        //     }
        //     let maxRes = 0;
        //     for (let c = 0; c < nloc; c++) {
        //         const y: ComplexType[] = new Array(nloc);
        //         for (let i = 0; i < nloc; i++) y[i] = VnumFinal[i][c] as ComplexType;
        //         // compute Ty = T_in * y
        //         const Ty: ComplexType[] = Array.from({ length: nloc }, () => Complex.zero());
        //         for (let i = 0; i < nloc; i++) {
        //             let s = Complex.zero();
        //             for (let j = 0; j < nloc; j++) if (T_in[i][j] !== 0) Complex.mulAndSumTo(s, Complex.create(T_in[i][j]), y[j]);
        //             Ty[i] = s;
        //         }
        //         const lam = DnumFinal[c];
        //         let nrm2 = 0;
        //         for (let i = 0; i < nloc; i++) {
        //             const diff = Complex.sub(Ty[i], Complex.mul(Complex.create(lam), y[i])); // <-- CORREÇÃO: lam * y[i]
        //             const a = Complex.realToNumber(Complex.abs(diff));
        //             nrm2 += a * a;
        //         }
        //         const nrm = Math.sqrt(nrm2);
        //         if (nrm > maxRes) maxRes = nrm;
        //     }
        //     console.log('DIAG-A: max residual T_in*y - lambda*y =', maxRes);
        // }

        // if complex path, recover eigenvectors via U * VnumFinal
        // Aplicar U: y (vetores coluna) -> U * y  ; VnumFinal[r][c] = u[r] * VnumFinal[r][c]
        if (needComplexPath) {
            for (let r = 0; r < n; r++) {
                const ur = u[r];
                for (let c = 0; c < n; c++) {
                    VnumFinal[r][c] = Complex.mul(ur, VnumFinal[r][c]);
                }
            }
        }

        // // DIAG-B: testa Torig * (U*y) == lambda * (U*y)
        // {
        //     const DnumFinal = core.Dnum.slice();    // valores numéricos do núcleo (numbers)
        //     const VnumFinal = core.Vnum.map((row) => row.map((z) => Complex.copy(z)));    // vetores coluna do núcleo já transformados por U (ComplexType[][])
        //     const nloc = Dwork.length;
        //     // constrói Torig (ComplexType[][]) a partir de Dwork/Ework (os originais, complexos)
        //     const Torig: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
        //     for (let i = 0; i < nloc; i++) {
        //         Torig[i][i] = Dwork[i];
        //         if (i < nloc - 1) {
        //             Torig[i][i + 1] = Ework[i];
        //             Torig[i + 1][i] = Ework[i];
        //         }
        //     }
        //     // compute residuals Torig*(U*y) - lambda*(U*y)
        //     let maxRes = 0;
        //     for (let c = 0; c < nloc; c++) {
        //         // build vector v = U * y  (already applied in-place to VnumFinal, so take column)
        //         const v: ComplexType[] = new Array(nloc);
        //         for (let i = 0; i < nloc; i++) v[i] = VnumFinal[i][c] as ComplexType;
        //         // compute w = Torig * v
        //         const w: ComplexType[] = Array.from({ length: nloc }, () => Complex.zero());
        //         for (let i = 0; i < nloc; i++) {
        //             let s = Complex.zero();
        //             for (let j = 0; j < nloc; j++) {
        //                 if (!Complex.realIsZero(Complex.abs(Torig[i][j] as ComplexType))) {
        //                     Complex.mulAndSumTo(s, Torig[i][j] as ComplexType, v[j]);
        //                 }
        //             }
        //             w[i] = s;
        //         }
        //         const lam = DnumFinal[c]; // número real (do kernel)
        //         // compute norm of (w - lam * v)
        //         let s2 = 0;
        //         for (let i = 0; i < nloc; i++) {
        //             const diff = Complex.sub(w[i], Complex.mul(Complex.create(lam), v[i]));
        //             const a = Complex.realToNumber(Complex.abs(diff));
        //             s2 += a * a;
        //         }
        //         const nrm = Math.sqrt(s2);
        //         if (nrm > maxRes) maxRes = nrm;
        //     }
        //     console.log('DIAG-B: max residual Torig*(U*y) - lambda*(U*y) =', maxRes);
        // }

        // // DIAGNÓSTICO DETALHADO (cole aqui; imprime detalhes para col 0 e 1 e testa variantes)
        // (() => {
        //     const nloc = Dwork.length;
        //     const Torig: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
        //     for (let i = 0; i < nloc; i++) {
        //         Torig[i][i] = Dwork[i];
        //         if (i < nloc - 1) {
        //             Torig[i][i + 1] = Ework[i];
        //             Torig[i + 1][i] = Ework[i];
        //         }
        //     }

        //     // helpers
        //     const mulMatVec = (M: ComplexType[][], x: ComplexType[]) => {
        //         const n = x.length;
        //         const y: ComplexType[] = Array.from({ length: n }, () => Complex.zero());
        //         for (let i = 0; i < n; i++) {
        //             let s = Complex.zero();
        //             for (let j = 0; j < n; j++) {
        //                 if (!Complex.realIsZero(Complex.abs(M[i][j] as ComplexType))) Complex.mulAndSumTo(s, M[i][j], x[j]);
        //             }
        //             y[i] = s;
        //         }
        //         return y;
        //     };
        //     const normInf = (v: ComplexType[]) => {
        //         let m = 0;
        //         for (let i = 0; i < v.length; i++) {
        //             const a = Complex.realToNumber(Complex.abs(v[i]));
        //             if (a > m) m = a;
        //         }
        //         return m;
        //     };
        //     const applyU_variant = (variant: 'u' | 'conj' | 'inv') => {
        //         // build v = variant(u) * y (row-wise)
        //         const Vtrans: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
        //         for (let r = 0; r < nloc; r++) {
        //             const ur = u[r];
        //             const fac = (variant === 'u') ? ur : (variant === 'conj') ? Complex.conj(ur) : Complex.rdiv(Complex.one(), ur);
        //             for (let c = 0; c < nloc; c++) {
        //                 Vtrans[r][c] = Complex.mul(fac, core.Vnum[r][c] as ComplexType);
        //             }
        //         }
        //         // compute max residual over columns
        //         let maxRes = 0;
        //         for (let c = 0; c < nloc; c++) {
        //             const vcol = Array.from({ length: nloc }, (_, i) => Vtrans[i][c]);
        //             const w = mulMatVec(Torig, vcol);
        //             const lam = core.Dnum[c]; // number
        //             const lamv = vcol.map(x => Complex.mul(Complex.create(lam), x));
        //             const diff = w.map((wi, i) => Complex.sub(wi, lamv[i]));
        //             const r = normInf(diff);
        //             if (r > maxRes) maxRes = r;
        //         }
        //         return { maxRes, Vtrans };
        //     };

        //     console.log('--- Detailed DIAG per column (showing cols 0 and 1) ---');
        //     ['u', 'conj', 'inv'].forEach((variant) => {
        //         const res = applyU_variant(variant as any);
        //         console.log(`variant=${variant} : maxRes = ${res.maxRes}`);
        //         // print detailed elementwise for first two cols
        //         for (let c = 0; c < Math.min(2, nloc); c++) {
        //             console.log(`\nvariant=${variant} col=${c}`);
        //             const y = Array.from({ length: nloc }, (_, i) => core.Vnum[i][c]);
        //             const v = Array.from({ length: nloc }, (_, i) => res.Vtrans[i][c]);
        //             const w = mulMatVec(Torig, v);
        //             const lam = core.Dnum[c];
        //             console.log(' y (kernel) =', y.map(z => Complex.unparse(z, 0)).join(', '));
        //             console.log(' v = U_variant*y =', v.map(z => Complex.unparse(z, 0)).join(', '));
        //             console.log(' w = Torig * v =', w.map(z => Complex.unparse(z, 0)).join(', '));
        //             const lamv = v.map(x => Complex.mul(Complex.create(lam), x));
        //             console.log(' lam*v =', lamv.map(z => Complex.unparse(z, 0)).join(', '));
        //             const diff = w.map((wi, i) => Complex.sub(wi, lamv[i]));
        //             console.log(' w - lam*v =', diff.map(z => Complex.unparse(z, 0)).join(', '));
        //         }
        //     });
        // })();

        // build Vcand MultiArray and Dcand ComplexType[]
        const Vcand = new MultiArray([n, n]);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vcand.array[r][c] = Complex.copy(VnumFinal[r][c]);
        MultiArray.setType(Vcand);

        const Dcand: ComplexType[] = DnumFinal.map((v) => Complex.create(v));

        // normalize phases to MATLAB convention (works for real & complex)
        LAPACK.normalize_eigenvector_phases(Vcand.array as ComplexType[][]);

        // compute residual and decide fallback
        // Build dense original A (Tdense) from Dwork/Ework (Complex)
        const Tdense = LAPACKunused.tridiag_her_to_dense(Dwork, Ework);

        // Compute residual using complex arithmetic (Vcand currently columns aligned with Dcand)
        const DcandNumComplex: ComplexType[] = Dcand.slice(); // Dcand already ComplexType[]
        const residual = LAPACKunused.compute_residual_complex(Tdense, Vcand, DcandNumComplex);

        // choose tolerance
        const RESID_TOL = 1e-8 * Math.max(1, residual);

        if (residual > RESID_TOL) {
            // fallback: Jacobi
            const jac = LAPACK.jacobi_symmetric_hermitian(Tdense, Math.max(50, Math.floor(maxIts / Math.max(1, n))), 1e-12);
            // jac.D (ComplexType[]), jac.V (ComplexType[][])
            const Dcol = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) Dcol.array[i][0] = jac.D[i];
            // fill V
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V.array[r][c] = jac.V[r][c];
            // sort + normalize
            // create sortable list
            const idxSortedJac = jac.D.map((val, i) => ({ val, i })).sort((a, b) => Complex.realToNumber(Complex.sub(a.val, b.val)));
            // permute columns of V accordingly
            const Vperm: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let newc = 0; newc < n; newc++) {
                const oldc = idxSortedJac[newc].i;
                for (let r = 0; r < n; r++) Vperm[r][newc] = jac.V[r][oldc];
            }
            // write into MultiArray V
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V.array[r][c] = Vperm[r][c];
            // normalize phases after sorting
            LAPACK.normalize_eigenvector_phases(V.array as ComplexType[][]);
            const DcolFinal = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) DcolFinal.array[i][0] = idxSortedJac[i].val;
            MultiArray.setType(DcolFinal);
            MultiArray.setType(V);
            return { D: DcolFinal, V, complex: needComplexPath };
        }
        // If QR accepted: sort Dcand and permute Vcand, THEN normalize
        const idxSorted = Dcand.map((val, i) => ({ val, i })).sort((a, b) => {
            const ra = Complex.realToNumber(a.val);
            const rb = Complex.realToNumber(b.val);
            return ra - rb;
        });
        const evals = idxSorted.map((x) => x.val);
        // permute Vcand columns
        const VsortedArray: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
        for (let newc = 0; newc < n; newc++) {
            const oldc = idxSorted[newc].i;
            for (let r = 0; r < n; r++) VsortedArray[r][newc] = Complex.copy(Vcand.array[r][oldc] as ComplexType);
        }
        // write V and normalize AFTER sorting
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V.array[r][c] = Complex.copy(VsortedArray[r][c]);
        LAPACK.normalize_eigenvector_phases(V.array as ComplexType[][]);
        // build final Dcol from sorted evals
        const DcolFinal = new MultiArray([n, 1]);
        for (let i = 0; i < n; i++) DcolFinal.array[i][0] = Complex.copy(evals[i]);
        MultiArray.setType(DcolFinal);
        MultiArray.setType(V);

        // // also print Dcand and DcolFinal (after sorting) just before return
        // console.log('DBG-C: Dcand (as Complex) =', Dcand.map(z => Complex.unparse(z, 0)));
        // console.log('DBG-C: DcolFinal (MultiArray) =', DcolFinal.array.map((r: any) => Complex.unparse(r[0] as ComplexType, 0)));

        // // --- DEBUG: compare to Jacobi on same T (dense) ---
        // {
        //     // build dense T' from the numeric arrays used by kernel
        //     const nloc = Dwork.length;
        //     const Tprime: ComplexType[][] = Array.from({ length: nloc }, () => Array(nloc).fill(Complex.zero()));
        //     for (let i = 0; i < nloc; i++) {
        //         Tprime[i][i] = Complex.create(Dnum ? Dnum[i] : Complex.realToNumber(Complex.real(Dwork[i])));
        //         if (i < nloc - 1) {
        //             const eVal = (Enum ? Enum[i] : Complex.realToNumber(Complex.abs(Ework[i])));
        //             Tprime[i][i + 1] = Complex.create(eVal);
        //             Tprime[i + 1][i] = Complex.create(eVal);
        //         }
        //     }
        //     // run your Jacobi fallback (assume you have a function jacobi_symmetric_hermitian returning {D:ComplexType[], V:ComplexType[][]})
        //     let jac;
        //     try {
        //         jac = LAPACK.jacobi_symmetric_hermitian ? LAPACK.jacobi_symmetric_hermitian(Tprime, 200, 1e-12) : null;
        //     } catch (err) {
        //         jac = null;
        //     }
        //     console.log('DEBUG: T\' (dense) diagonal:', Tprime.map(row => Complex.unparse(row[row.indexOf(row.find(x => true)!)] || Complex.zero(), 0)));
        //     if (jac) {
        //         console.log('DEBUG: jacobi eigenvalues:', jac.D.map(v => Complex.unparse(v, 0)));
        //     } else {
        //         console.log('DEBUG: jacobi not available');
        //     }
        //     const dReported = DcolFinal.array.map((r: any) => r[0]) as ComplexType[];
        //     console.log('DEBUG: D reported by steqr_vectors:', dReported.map(z => Complex.unparse(z, 0)));
        // }
        return { D: DcolFinal, V, complex: needComplexPath };
    };

    public static readonly steqr_vectors = (diag: ComplexType[], offdiag: ComplexType[], maxIter?: number): { D: ComplexType[]; V: ComplexType[][]; complex: boolean } => {
        const n = diag.length;
        const maxIts = maxIter ?? Math.max(1000, n * 1000);
        /* Prepare Dwork and Ework */
        const Dwork: ComplexType[] = new Array(n);
        const Ework: ComplexType[] = new Array(n);
        for (let i = 0; i < n - 1; i++) {
            Dwork[i] = Complex.copy(diag[i]);
            Ework[i] = Complex.copy(offdiag[i]);
        }
        Dwork[n - 1] = Complex.copy(diag[n - 1]);
        Ework[n - 1] = Complex.zero();
        /* detect complex path */
        let needComplexPath = false;
        for (let i = 0; i < n; i++) {
            if (Complex.isComplexValue(Dwork[i])) {
                needComplexPath = true;
                break;
            }
            if (i < n - 1 && Complex.isComplexValue(Ework[i])) {
                needComplexPath = true;
                break;
            }
        }
        // phases u[] for Hermitian -> real-offdiag transform
        const u: ComplexType[] = new Array(n);
        // Dnum/Enum numeric arrays for core
        const Dnum: number[] = new Array(n);
        const Enum: number[] = new Array(n);
        // if (needComplexPath) {
        //     u[0] = Complex.one();
        //     for (let i = 0; i < n - 1; i++) {
        //         const e = Ework[i];
        //         const absE = Complex.abs(e);
        //         if (Complex.realToNumber(Complex.eq(absE, Complex.zero()))) {
        //             u[i + 1] = u[i];
        //         } else {
        //             const conjE = Complex.conj(e);
        //             const phase = Complex.rdiv(conjE, absE); // conj(e)/|e|
        //             u[i + 1] = Complex.mul(u[i], phase);
        //         }
        //     }
        //     for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Complex.real(Dwork[i]));
        //     for (let i = 0; i < n - 1; i++) {
        //         const tmp = Complex.mul(Complex.conj(u[i]), Complex.mul(Ework[i], u[i + 1]));
        //         Enum[i] = Complex.realToNumber(Complex.abs(tmp));
        //     }
        //     Enum[n - 1] = 0;
        // } else {
        //     for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Dwork[i]);
        //     for (let i = 0; i < n; i++) Enum[i] = Complex.realToNumber(Ework[i]);
        // }

        // --- BEGIN PATCH: force real tridiagonal for Hermitian matrices ---
        // assume Dwork: ComplexType[] (diag), Ework: ComplexType[] (offdiag), n known

        // Detect complex path already computed as needComplexPath = true
        if (needComplexPath) {
            // build phases u[] such that conj(u[i]) * E[i] * u[i+1] is real non-negative
            u[0] = Complex.one();
            for (let i = 0; i < n - 1; i++) {
                const e = Ework[i];
                const absE = Complex.abs(e); // numeric magnitude
                if (Complex.realIsZero(absE)) {
                    // if off-diagonal is zero, keep previous phase // se subdiagonal é zero, manter fase anterior
                    u[i + 1] = Complex.copy(u[i]);
                } else {
                    // phase = conj(e) / |e|  (this is unit magnitude)
                    // use rdiv or fallback
                    const phase = Complex.rdiv(Complex.conj(e), absE);
                    // u[i+1] = u[i] * phase
                    u[i + 1] = Complex.mul(u[i], phase);

                    // // resolver u[i+1] = absE / ( conj(u[i]) * e )
                    // // (isso satisfaz conj(u[i]) * e * u[i+1] = absE)
                    // const denom = Complex.mul(Complex.conj(u[i]), e); // ComplexType
                    // // denom não deve ser zero; rdiv faz denom invertido com fallback se precisar
                    // u[i + 1] = Complex.rdiv(absE, denom);

                    // opcional: renormalizar para evitar drift numérico (forçar magnitude 1)
                    const mag = Complex.realToNumber(Complex.abs(u[i + 1]));
                    if (mag !== 0 && Math.abs(mag - 1) > 1e-12) {
                        u[i + 1] = Complex.rdiv(u[i + 1], Complex.abs(u[i + 1])); // normaliza magnitude para 1
                    }
                }
            }

            // Now produce purely real numeric arrays for the kernel:
            // Dnum[i] = real(Dwork[i])
            // Enum[i] = real( conj(u[i]) * Ework[i] * u[i+1] ) but that's exactly | that complex | (should be >=0)
            for (let i = 0; i < n; i++) {
                // diagonal real part
                Dnum[i] = Complex.realToNumber(Dwork[i]);
            }
            for (let i = 0; i < n - 1; i++) {
                const transformed = Complex.mul(Complex.conj(u[i]), Complex.mul(Ework[i], u[i + 1]));
                // numeric positive value
                Enum[i] = Complex.realToNumber(Complex.abs(transformed));
            }
        } else {
            // real path (unchanged)
            for (let i = 0; i < n; i++) Dnum[i] = Complex.realToNumber(Dwork[i]);
            for (let i = 0; i < n - 1; i++) Enum[i] = Complex.realToNumber(Ework[i]);
        }
        Enum[n - 1] = 0;
        // --- END PATCH ---

        // identity V (will be replaced by core result)
        const V = LAPACK.eye(n, n);

        // run numeric real core (assumes LAPACK.numeric_jacobi_symmetric_dense exists)
        const core = LAPACKunused.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIts);

        const DnumFinal = core.Dnum.slice();
        const VnumFinal = core.Vnum.map((row) => row.map((z) => Complex.copy(z)));

        // if complex path, recover eigenvectors via U * VnumFinal
        // Aplicar U: y (vetores coluna) -> U * y  ; VnumFinal[r][c] = u[r] * VnumFinal[r][c]
        if (needComplexPath) {
            for (let r = 0; r < n; r++) {
                const ur = u[r];
                for (let c = 0; c < n; c++) {
                    VnumFinal[r][c] = Complex.mul(ur, VnumFinal[r][c]);
                    // VnumFinal[r][c] = Complex.mul(VnumFinal[r][c], u[c]);
                }
            }
        }

        // build Vcand MultiArray and Dcand ComplexType[]
        const Vcand = new MultiArray([n, n]);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) Vcand.array[r][c] = Complex.copy(VnumFinal[r][c]);
        MultiArray.setType(Vcand);

        const Dcand: ComplexType[] = DnumFinal.map((v) => Complex.create(v));

        // normalize phases to MATLAB convention (works for real & complex)
        LAPACK.normalize_eigenvector_phases(Vcand.array as ComplexType[][]);

        // compute residual and decide fallback
        // Build dense original A (Tdense) from Dwork/Ework (Complex)
        const Tdense = LAPACKunused.tridiag_her_to_dense(Dwork, Ework);

        // Compute residual using complex arithmetic (Vcand currently columns aligned with Dcand)
        const DcandNumComplex: ComplexType[] = Dcand.slice(); // Dcand already ComplexType[]
        const residual = LAPACKunused.compute_residual_complex(Tdense, Vcand, DcandNumComplex);

        // choose tolerance
        const RESID_TOL = 1e-8 * Math.max(1, residual);

        if (residual > RESID_TOL) {
            // fallback: Jacobi
            const jac = LAPACK.jacobi_symmetric_hermitian(Tdense, Math.max(50, Math.floor(maxIts / Math.max(1, n))), 1e-12);
            // jac.D (ComplexType[]), jac.V (ComplexType[][])
            const Dcol = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) Dcol.array[i][0] = jac.D[i];
            // fill V
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V[r][c] = jac.V[r][c];
            // sort + normalize
            // create sortable list
            const idxSortedJac = jac.D.map((val, i) => ({ val, i })).sort((a, b) => Complex.realToNumber(Complex.sub(a.val, b.val)));
            // permute columns of V accordingly
            const Vperm: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
            for (let newc = 0; newc < n; newc++) {
                const oldc = idxSortedJac[newc].i;
                for (let r = 0; r < n; r++) Vperm[r][newc] = jac.V[r][oldc];
            }
            // write into MultiArray V
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V[r][c] = Vperm[r][c];
            // normalize phases after sorting
            LAPACK.normalize_eigenvector_phases(V);
            return { D: idxSortedJac.map((value) => value.val), V, complex: needComplexPath };
        }
        // If QR accepted: sort Dcand and permute Vcand, THEN normalize
        const idxSorted = Dcand.map((val, i) => ({ val, i })).sort((a, b) => {
            const ra = Complex.realToNumber(a.val);
            const rb = Complex.realToNumber(b.val);
            return ra - rb;
        });
        const evals = idxSorted.map((x) => x.val);
        // permute Vcand columns
        const VsortedArray: ComplexType[][] = Array.from({ length: n }, () => Array(n).fill(Complex.zero()));
        for (let newc = 0; newc < n; newc++) {
            const oldc = idxSorted[newc].i;
            for (let r = 0; r < n; r++) VsortedArray[r][newc] = Complex.copy(Vcand.array[r][oldc] as ComplexType);
        }
        // write V and normalize AFTER sorting
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) V[r][c] = Complex.copy(VsortedArray[r][c]);
        LAPACK.normalize_eigenvector_phases(V);
        // build final Dcol from sorted evals
        const DcolFinal = new MultiArray([n, 1]);
        for (let i = 0; i < n; i++) DcolFinal.array[i][0] = Complex.copy(evals[i]);
        MultiArray.setType(DcolFinal);
        return { D: evals, V, complex: needComplexPath };
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
        // 1) Redução Hermitiana → tridiagonal
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.her2_zhtrd_update);
        if (computeVectors) {
            // 2) Reconstruir Q (vetores da redução)
            let Q = LAPACK.ungtr(Acopy, taus);
            // 3) Resolver o problema tridiagonal
            //    ZSTEQR: Q ← Q * Z
            const { D, V } = LAPACK.steqr_vectors(diag, offdiag);
            // Multiplica Q pelos autovetores do tridiagonal
            const vectors = new MultiArray([V.length, V[0].length]);
            vectors.array = V;
            Q = MathOperation.mtimes(Q, vectors) as MultiArray;
            return { D: MultiArray.toDiagonalMatrix(D), V: Q };
        } else {
            // Apenas autovalores
            return { D: MultiArray.toColumnVector(LAPACK.steqr_vectors(diag, offdiag).D) };
        }
    };

    public static readonly eig_symmetric0 = (
        A: MultiArray,
        computeVectors: boolean = false,
        maxIter?: number,
    ): {
        D: MultiArray;
        V?: MultiArray;
    } => {
        // A is a square matrix n×n
        const n: number = A.dimension[0];
        // Work on a copy because sytrd modifies A
        const Acopy = MultiArray.copy(A);
        // 1) Reduce to tridiagonal: diag (D), offdiag (E), taus, and Householder vectors stored in Acopy
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.her2_zhtrd_update);
        // If only eigenvalues requested, we can run steqr_vectors and return D
        if (!computeVectors) {
            // steqr_vectors returns { D: MultiArray, V: MultiArray } but we only need D
            const res = LAPACK.steqr_vectors(diag, offdiag, maxIter);
            // res.D is MultiArray n x 1 (ComplexType). Return it directly.
            return { D: MultiArray.toColumnVector(res.D) };
        }
        // 2) Compute eigenvalues + eigenvectors of tridiagonal T
        //    res.V are eigenvectors of T (columns) expressed in the tridiagonal basis
        const resT = LAPACK.steqr_vectors(diag, offdiag, maxIter);

        // const { maxOffDiag, maxDiagDeviation } = LAPACK.test_orthonormality(resT.V);
        // console.log('test_orthonormality:maxOffDiag:', maxOffDiag);
        // console.log('test_orthonormality:maxDiagDeviation:', maxDiagDeviation);

        // 3) Reconstruct Q from Acopy and taus (Householder vectors stored in lower triangle)
        // Initialize Q = I (MultiArray)
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        // Apply reflectors H(k) = I - tau[k] * v * vᴴ in reverse order
        for (let k = n - 2; k >= 0; k--) {
            const colLen = n - k - 1;
            // build v: ComplexType[] where v[0] == 1 at A[k+1, k]
            const v: ComplexType[] = [Complex.one()];
            for (let i = 1; i < colLen; i++) v[i] = Acopy.array[k + 1 + i][k] as ComplexType;
            const tau = taus[k];
            if (!Complex.realIsZero(Complex.abs(tau))) {
                // apply H = I - tau * v * vᴴ on the left to Q rows (rowStart = k+1), all columns
                LAPACK.larf_left(Q, v, tau, k + 1, 0);
            }
        }

        // 4) Form final eigenvectors V = Q * resT.V
        const V = new MultiArray([Q.dimension[0], resT.V[0].length]);
        BLAS.gemm(Complex.one(), Q.array as ComplexType[][], Q.dimension[0], Q.dimension[1], resT.V as ComplexType[][], resT.V[0].length, Complex.zero(), V.array as ComplexType[][]);

        LAPACK.normalize_eigenvector_phases(V.array as ComplexType[][]);

        // // Final correctness test (este é o que importa)
        // console.log('FINAL residual:', LAPACK.test_residual(A.array as ComplexType[][], V, resT.D));
        // console.log('FINAL diag_eigenpairs:');
        // LAPACK.diag_eigenpairs(A.array as ComplexType[][], V, resT.D);

        // Ensure types set
        MultiArray.setType(V);

        // // DIAG-C (cole antes do return final em eig_symmetric)
        // {
        //     const Vf = V; // MultiArray final
        //     const Dcol = resT.D; // MultiArray (n x 1)
        //     const nfull = Vf.dimension[0];
        //     let maxRes = 0;
        //     for (let col = 0; col < nfull; col++) {
        //         const w: ComplexType[] = Array.from({ length: nfull }, () => Complex.zero());
        //         for (let i = 0; i < nfull; i++) {
        //             let s = Complex.zero();
        //             for (let k = 0; k < nfull; k++) Complex.mulAndSumTo(s, A.array[i][k] as ComplexType, Vf.array[k][col] as ComplexType);
        //             w[i] = s;
        //         }
        //         const lam = Dcol.array[col][0] as ComplexType;
        //         let nrm2 = 0;
        //         for (let i = 0; i < nfull; i++) {
        //             const diff = Complex.sub(w[i], Complex.mul(lam, Vf.array[i][col] as ComplexType));
        //             const a = Complex.realToNumber(Complex.abs(diff));
        //             nrm2 += a * a;
        //         }
        //         const nrm = Math.sqrt(nrm2);
        //         if (nrm > maxRes) maxRes = nrm;
        //     }
        //     console.log('DIAG-C: max residual A*V - V*Lambda =', maxRes);
        // }

        return { D: MultiArray.toDiagonalMatrix(resT.D), V };
    };

    public static readonly eig_symmetric1 = (
        A: MultiArray,
        computeVectors: boolean = false,
        maxIter: number = 10000,
    ): {
        D: number[];
        V: MultiArray;
    } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) {
            throw new Error('eig_symmetric: matrix must be square.');
        }
        // 0) Copiar A (preserva entrada)
        const Acopy: MultiArray = MultiArray.copy(A);

        // 1) Redução Hermitiana → tridiagonal real
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.her2_zhtrd_update);

        // diag, offdiag agora são ComplexType[],
        // mas offdiag deve ser real >= 0 após sytrd_complex

        // 2) Resolver o problema tridiagonal REAL
        //    extrair partes reais
        const Dnum: number[] = new Array(n);
        const Enum: number[] = new Array(n);

        for (let i = 0; i < n; i++) {
            Dnum[i] = Complex.realToNumber(diag[i]);
            Enum[i] = i < n - 1 ? Complex.realToNumber(offdiag[i]) : 0;
        }

        // numeric_jacobi_symmetric_dense: retorna autovalores e autovetores reais
        const core = LAPACKunused.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIter);

        const eigenvalues: number[] = core.Dnum.slice();
        const Y: number[][] = core.Vnum.map((row) => row.map((z) => Complex.realToNumber(z))); // Y é REAL (n×n)

        // 3) Construir Q unitária a partir dos Householders
        const Q: MultiArray = LAPACK.ungtr(Acopy, taus);

        // 4) V = Q * Y
        const V = new MultiArray([n, n]);

        for (let j = 0; j < n; j++) {
            // coluna j
            for (let i = 0; i < n; i++) {
                // linha i
                let sum = Complex.zero();
                for (let k = 0; k < n; k++) {
                    Complex.mulAndSumTo(sum, Q.array[i][k] as ComplexType, Complex.create(Y[k][j]));
                }
                V.array[i][j] = sum;
            }
        }

        console.log(eigenvalues.map((v) => v.toString()).join());
        // console.log(V.array.map((row) => row.map((z) => Complex.unparse(z as ComplexType, 0))).join());
        return {
            D: eigenvalues,
            V,
        };
    };

    public static readonly eig_symmetric2 = (A: MultiArray, computeVectors: boolean = false, maxIter?: number): { D: MultiArray; V?: MultiArray } => {
        // A is a square matrix n×n
        const n: number = A.dimension[0];
        // Work on a copy because sytrd modifies A
        const Acopy = MultiArray.copy(A);
        // 1) Reduce to tridiagonal: diag (D), offdiag (E), taus, and Householder vectors stored in Acopy
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.larf_left);
        // If only eigenvalues requested, we can run steqr_vectors and return D
        if (!computeVectors) {
            // steqr_vectors returns { D: MultiArray, V: MultiArray } but we only need D
            const res = LAPACK.steqr_vectors(diag, offdiag, maxIter);
            // res.D is MultiArray n x 1 (ComplexType). Return it directly.
            return { D: MultiArray.toColumnVector(res.D) };
        }
        // 2) Compute eigenvalues + eigenvectors of tridiagonal T
        //    res.V are eigenvectors of T (columns) expressed in the tridiagonal basis
        const resT = LAPACK.steqr_vectors(diag, offdiag, maxIter);

        // const { maxOffDiag, maxDiagDeviation } = LAPACK.test_orthonormality(resT.V);
        // console.log('test_orthonormality:maxOffDiag:', maxOffDiag);
        // console.log('test_orthonormality:maxDiagDeviation:', maxDiagDeviation);

        // 3) Reconstruct Q from Acopy and taus (Householder vectors stored in lower triangle)
        // Initialize Q = I (MultiArray)
        const Q = new MultiArray([n, n]);
        Q.array = LAPACK.eye(n, n);
        // Apply reflectors H(k) = I - tau[k] * v * vᴴ in reverse order
        for (let k = n - 2; k >= 0; k--) {
            const colLen = n - k - 1;
            // build v: ComplexType[] where v[0] == 1 at A[k+1, k]
            const v: ComplexType[] = [Complex.one()];
            for (let i = 1; i < colLen; i++) v[i] = Acopy.array[k + 1 + i][k] as ComplexType;
            const tau = taus[k];
            if (!Complex.realIsZero(Complex.abs(tau))) {
                // apply H = I - tau * v * vᴴ on the left to Q rows (rowStart = k+1), all columns
                LAPACK.larf_left(Q, v, tau, k + 1, 0);
            }
        }

        // 4) Form final eigenvectors V = Q * resT.V
        const V = new MultiArray([Q.dimension[0], resT.V[0].length]);
        BLAS.gemm(Complex.one(), Q.array as ComplexType[][], Q.dimension[0], Q.dimension[1], resT.V as ComplexType[][], resT.V[0].length, Complex.zero(), V.array as ComplexType[][]);

        LAPACK.normalize_eigenvector_phases(V.array as ComplexType[][]);

        // // Final correctness test (este é o que importa)
        // console.log('FINAL residual:', LAPACK.test_residual(A.array as ComplexType[][], V, resT.D));
        // console.log('FINAL diag_eigenpairs:');
        // LAPACK.diag_eigenpairs(A.array as ComplexType[][], V, resT.D);

        // Ensure types set
        MultiArray.setType(V);

        // // DIAG-C (cole antes do return final em eig_symmetric)
        // {
        //     const Vf = V; // MultiArray final
        //     const Dcol = resT.D; // MultiArray (n x 1)
        //     const nfull = Vf.dimension[0];
        //     let maxRes = 0;
        //     for (let col = 0; col < nfull; col++) {
        //         const w: ComplexType[] = Array.from({ length: nfull }, () => Complex.zero());
        //         for (let i = 0; i < nfull; i++) {
        //             let s = Complex.zero();
        //             for (let k = 0; k < nfull; k++) Complex.mulAndSumTo(s, A.array[i][k] as ComplexType, Vf.array[k][col] as ComplexType);
        //             w[i] = s;
        //         }
        //         const lam = Dcol.array[col][0] as ComplexType;
        //         let nrm2 = 0;
        //         for (let i = 0; i < nfull; i++) {
        //             const diff = Complex.sub(w[i], Complex.mul(lam, Vf.array[i][col] as ComplexType));
        //             const a = Complex.realToNumber(Complex.abs(diff));
        //             nrm2 += a * a;
        //         }
        //         const nrm = Math.sqrt(nrm2);
        //         if (nrm > maxRes) maxRes = nrm;
        //     }
        //     console.log('DIAG-C: max residual A*V - V*Lambda =', maxRes);
        // }

        return { D: MultiArray.toDiagonalMatrix(resT.D), V };
    };

    /**
     * eig_symmetric - eigenvalues + eigenvectors for Hermitian/symmetric matrix A.
     *
     * @param A     MultiArray (n x n)
     * @param order 'none' | 'asc' | 'desc'  (default = 'asc')
     *
     * @returns { V, D, evals } where
     *   V     = MultiArray n x n (eigenvectors column-wise)
     *   D     = MultiArray n x n diagonal eigenvalue matrix
     *   evals = ComplexType[] eigenvalues (sorted according to `order`)
     */
    public static readonly eig_symmetric3 = (A: MultiArray, order: 'none' | 'asc' | 'desc' = 'asc'): { V: MultiArray; D: MultiArray; evals: ComplexType[] } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('eig_symmetric: A must be square');

        // --- 1) Copia e tridiagonaliza A ---
        const Acopy = MultiArray.copy(A) as MultiArray;
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.larf_left);

        // --- 2) Resolve problema tridiagonal ---
        const tridiagRes = LAPACK.steqr_vectors(diag, offdiag);

        // tridiagRes.D é MultiArray [n x 1], extrair para ComplexType[]
        const evals_raw: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) evals_raw[i] = tridiagRes.D[i] as ComplexType;

        // tridiagRes.V é MultiArray [n x n] (colunas = autovetores de T)
        const Zraw = tridiagRes.V as ComplexType[][];

        // --- 3) Reconstrói Q0 ---
        const Q0 = LAPACK.orgtr(Acopy, taus);

        // --- 4) Constrói V = Q0 * Zraw ---
        const Vraw = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Vraw.array[i][j] = Complex.zero();

        for (let i = 0; i < n; i++) {
            for (let k = 0; k < n; k++) {
                const qik = Q0.array[i][k] as ComplexType;
                for (let j = 0; j < n; j++) {
                    Vraw.array[i][j] = Complex.add(Vraw.array[i][j] as ComplexType, Complex.mul(qik, Zraw[k][j]));
                }
            }
        }

        // 5)  SORT eigenvalues & reorder eigenvectors accordingly
        const idx: number[] = Array.from({ length: n }, (_, i) => i);

        if (order !== 'none') {
            idx.sort((i, j) => {
                const ai = Math.abs(Complex.realToNumber(evals_raw[i]));
                const aj = Math.abs(Complex.realToNumber(evals_raw[j]));
                return order === 'asc' ? ai - aj : aj - ai;
            });
        }

        // Reordena evals para array (ComplexType[])
        const evals_sorted: ComplexType[] = idx.map((i) => evals_raw[i]);

        // Reordena colunas de Vraw para produzir V
        const V = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                V.array[i][j] = Vraw.array[i][idx[j]];
            }
        }
        MultiArray.setType(V);

        // --- 6) Cria matriz diagonal D ---
        const D = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D.array[i][j] = Complex.zero();
        for (let i = 0; i < n; i++) D.array[i][i] = evals_sorted[i];
        MultiArray.setType(D);

        return { V, D, evals: evals_sorted };
    };

    public static readonly eig_symmetric4 = (
        A: MultiArray,
        computeVectors: boolean = false,
        maxIter: number = 10000,
    ): {
        D: MultiArray;
        V?: MultiArray;
    } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) {
            throw new Error('eig_symmetric: matrix must be square.');
        }

        // ------------------------------------------------------------
        // 0) Copiar A (zhetrd destrói a entrada)
        // ------------------------------------------------------------
        const Acopy = MultiArray.copy(A);

        // ------------------------------------------------------------
        // 1) Redução Hermitiana → tridiagonal REAL
        //    zhetrd
        // ------------------------------------------------------------
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.her2_zhtrd_update);

        // Extrair D e E reais
        const Dnum: number[] = new Array(n);
        const Enum: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
            Dnum[i] = Complex.realToNumber(diag[i]);
            Enum[i] = i < n - 1 ? Complex.realToNumber(offdiag[i]) : 0;
        }

        // ------------------------------------------------------------
        // 2) Resolver T real (steqr)
        // ------------------------------------------------------------
        const core = LAPACKunused.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIter);

        {
            // logo após obter core
            console.log(`# LAPACK.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIts)`);
            console.log('  core.Dnum:', JSON.stringify(core.Dnum));
            // console.log('  core.Vnum:', JSON.stringify(core.Vnum.map((row) => row.map((z) => Complex.unparse(z, 0)))));
        }

        const eigenvalues = core.Dnum.slice();

        if (!computeVectors) {
            return { D: MultiArray.toColumnVector(eigenvalues.map((r) => Complex.create(r))) };
        }

        // Y: autovetores REAIS do tridiagonal
        // Y[k][j] = componente k do autovetor j
        const Y = new MultiArray([n, n]);
        Y.array = core.Vnum;

        // ------------------------------------------------------------
        // 3) Reconstruir Q unitária (ungtr)
        // ------------------------------------------------------------
        const Q = LAPACK.ungtr(Acopy, taus);

        // ------------------------------------------------------------
        // 4) V = Q · Y
        // ------------------------------------------------------------
        const V = new MultiArray([n, n]);

        for (let j = 0; j < n; j++) {
            // coluna j
            for (let i = 0; i < n; i++) {
                // linha i
                let sum = Complex.zero();
                for (let k = 0; k < n; k++) {
                    sum = Complex.add(sum, Complex.mul(Q.array[i][k] as ComplexType, Y.array[k][j] as ComplexType));
                }
                V.array[i][j] = sum;
            }
        }

        // ------------------------------------------------------------
        // 5) Normalização estética (opcional, MATLAB-like)
        // ------------------------------------------------------------
        LAPACK.normalize_eigenvector_phases(V.array as ComplexType[][]);

        MultiArray.setType(V);

        const interpreter = Interpreter.Create();
        console.log(MultiArray.unparse(A, interpreter));
        console.log(`eigenvalues: [${eigenvalues.map((v) => v.toString()).join(', ')}]`);
        // console.log(`V = ${V.array.map((row) => row.map((z) => Complex.unparse(z as ComplexType, 0))).join(', ')}`);

        return {
            D: MultiArray.toDiagonalMatrix(eigenvalues.map((r) => Complex.create(r))),
            V,
        };
    };

    public static readonly eig_symmetric5 = (A: MultiArray, computeVectors: boolean = false, maxIter: number = 10000): { D: MultiArray; V?: MultiArray } => {
        // A is a square matrix n×n
        const n: number = A.dimension[0];
        // Work on a copy because sytrd modifies A (ZHETRD-like)
        const Acopy = MultiArray.copy(A);
        // 1) Reduce to tridiagonal: diag (D), offdiag (E), taus, and Householder vectors stored in Acopy
        // 1) Reduce to tridiagonal real using zhetrd-like routine for Hermitian A
        //    - diag: ComplexType[] but real values expected (Complex.real(diag[i]) valid)
        //    - offdiag: ComplexType[] but should be real >= 0 after reduction
        //    - taus: ComplexType[] (Householder scalars)
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.her2_zhtrd_update);

        // If only eigenvalues requested, we can run steqr_vectors and return D
        if (!computeVectors) {
            // steqr_vectors returns { D: MultiArray, V: MultiArray } but we only need D
            const res = LAPACK.steqr_vectors(diag, offdiag, maxIter);
            // res.D is MultiArray n x 1 (ComplexType). Return it directly.
            return { D: MultiArray.toColumnVector(res.D) };
        }
        // console.log(`diag = [${diag.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
        // console.log(`offdiag = [${offdiag.map((z) => Complex.unparse(z, 0)).join(', ')}]`);
        // console.log(`taus = [${taus.map((z) => Complex.unparse(z, 0)).join(', ')}]`);

        // If user asked only eigenvalues, we can avoid building Q and V
        // Convert diag/offdiag to numeric arrays for tridiagonal solver (DSTEQR-like)
        const Dnum: number[] = new Array(n);
        const Enum: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
            Dnum[i] = Complex.realToNumber(Complex.real(diag[i])); // diagonal must be real
            if (i < n - 1) {
                // offdiag must be real >= 0 after sytrd_complex
                Enum[i] = Complex.realToNumber(Complex.real(offdiag[i]));
            } else {
                Enum[i] = 0;
            }
        }

        // Solve tridiagonal real problem (DSTEQR-like). returns eigenvalues (DnumFinal) and eigenvectors of T (Vnum)
        // Vnum is returned as ComplexType[][] where entries are real-valued ComplexType (imag=0) but we treat them as ComplexType
        const core = LAPACKunused.numeric_jacobi_symmetric_dense(Dnum, Enum, maxIter);
        const DnumFinal = core.Dnum.slice(); // number[]
        const VnumFinal = core.Vnum.map((row) => row.slice()); // copy rows => ComplexType[][] (row-major)

        // If only eigenvalues requested, return them as MultiArray n×1 (ComplexType)
        if (!computeVectors) {
            const Dcol = new MultiArray([n, 1]);
            for (let i = 0; i < n; i++) Dcol.array[i][0] = Complex.create(DnumFinal[i]);
            MultiArray.setType(Dcol);
            return { D: Dcol };
        }

        // 3) Reconstruct Q unitary from Householder vectors stored in Acopy and TAU (ZUNGTR-like)
        //    This should return a MultiArray with ComplexType entries
        const Q = LAPACK.ungtr(Acopy, taus); // MultiArray (n x n)

        // 4) Form eigenvectors of original A: V = Q * Y
        //    - Build Y (MultiArray) from VnumFinal (which is row-major ComplexType[][])
        const Y = new MultiArray([n, n]);
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                // ensure we put a ComplexType (real) copy, not a reference that might be mutated
                const val = VnumFinal[r][c];
                // if val is primitive number wrapped in ComplexType, keep as Complex.create(Number)
                // but VnumFinal already contains ComplexType values (usually real)
                Y.array[r][c] = Complex.create(Complex.realToNumber(val));
            }
        }
        MultiArray.setType(Y);

        // Multiply Q * Y into V (use BLAS.gemm if available to be efficient)
        // Initialize V.array with zeros
        const V = new MultiArray([n, n]);

        // BLAS.gemm(alpha, A, m, k, B, n, beta, C)
        // where A is Q.array (n x n), B is Y.array (n x n), result in V.array
        BLAS.gemm(Complex.one(), Q.array as ComplexType[][], Q.dimension[0], Q.dimension[1], Y.array as ComplexType[][], Y.dimension[1], Complex.zero(), V.array as ComplexType[][]);

        // 5) Sort eigenvalues ascending and permute columns of V accordingly
        // Build sortable array of (value,index)
        const idxSorted = DnumFinal.map((val, i) => ({ val, i })).sort((a, b) => a.val - b.val);
        const evalsSorted = idxSorted.map((x) => x.val);

        // Permute columns of V into Vsorted
        const Vsorted = new MultiArray([n, n]);
        for (let newc = 0; newc < n; newc++) {
            const oldc = idxSorted[newc].i;
            for (let r = 0; r < n; r++) {
                // copy element (avoid alias)
                const entry = V.array[r][oldc] as ComplexType;
                // Make sure we set a fresh Complex.create with real/imag parts to avoid shared references
                Vsorted.array[r][newc] = Complex.copy(entry);
            }
        }
        MultiArray.setType(Vsorted);

        // 6) Normalize eigenvector phases to match MATLAB/Octave convention (pivot positive on diagonal)
        //    This will modify Vsorted in place
        LAPACK.normalize_eigenvector_phases(Vsorted.array as ComplexType[][], true);

        // 7) Build D MultiArray n x 1 (ComplexType) from evalsSorted
        const DcolFinal = new MultiArray([n, 1]);
        for (let i = 0; i < n; i++) DcolFinal.array[i][0] = Complex.create(evalsSorted[i]);
        MultiArray.setType(DcolFinal);

        // Final return
        return { D: DcolFinal, V: Vsorted };
    };

    /**
     * eig_symmetric_blocked - blocked eigen-decomposition for Hermitian/symmetric A
     *
     * @param A      MultiArray (n x n) Hermitian / real symmetric (not modified)
     * @param order  'asc' | 'desc' | 'none'  (default = 'asc')
     * @param blockSize     block size (default 32)
     *
     * @returns { D: ComplexType[], V: MultiArray }  (D = eigenvalues, V columns = eigenvectors)
     */
    public static readonly eig_symmetric_blocked = (A: MultiArray, order: 'asc' | 'desc' | 'none' = 'asc', blockSize?: number): { D: ComplexType[]; V: MultiArray } => {
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('eig_symmetric_blocked: A must be square');

        const Acopy = MultiArray.copy(A) as MultiArray;

        const { diag, offdiag, taus } = LAPACK.sytrd_blocked_w(Acopy, blockSize ?? BLAS.settings.blockSize);

        const Q0 = LAPACK.orgtr_blocked_w(Acopy, taus, blockSize ?? BLAS.settings.blockSize); // MultiArray n x n

        // steqr_vectors agora retorna D: MultiArray (n x 1), V: MultiArray (n x n)
        const tridiagRes = LAPACK.steqr_vectors(diag, offdiag);
        const D_multicol: MultiArray = MultiArray.toColumnVector(tridiagRes.D);
        const Z = new MultiArray([tridiagRes.V.length, tridiagRes.V[0].length]);
        Z.array = tridiagRes.V;

        // extrai D_raw como ComplexType[]
        const D_raw: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) D_raw[i] = D_multicol.array[i][0] as ComplexType;

        // 4) form Vout = Q0 * Z
        const Vout = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Vout.array[i][j] = Complex.zero();

        BLAS.gemm_block(Q0.array as ComplexType[][], Z.array as ComplexType[][], Vout.array as ComplexType[][], Complex.one(), Complex.zero(), blockSize ?? BLAS.settings.blockSize);
        MultiArray.setType(Vout);

        // 5) sorting indices according to requested order
        const idx: number[] = Array.from({ length: n }, (_, i) => i);

        if (order !== 'none') {
            idx.sort((i, j) => {
                const ai = Complex.realToNumber(D_raw[i]);
                const aj = Complex.realToNumber(D_raw[j]);
                return order === 'asc' ? ai - aj : aj - ai;
            });
        }

        // 6) build sorted outputs (D_sorted: ComplexType[], V_sorted: MultiArray)
        const D_sorted: ComplexType[] = new Array(n);
        const V_sorted = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) V_sorted.array[i][j] = Complex.zero();

        for (let k = 0; k < n; k++) {
            const s = idx[k];
            D_sorted[k] = D_raw[s];
            for (let i = 0; i < n; i++) {
                V_sorted.array[i][k] = Vout.array[i][s];
            }
        }
        MultiArray.setType(V_sorted);

        return { D: D_sorted, V: V_sorted };
    };

    /**
     * ===================================================================================
     * =================================== 2th round =====================================
     * ===================================================================================
     */

    // /**
    //  * Generate the unitary matrix Q from a Hermitian tridiagonal reduction.
    //  *
    //  * This routine reconstructs
    //  *
    //  *     Q = H₀ H₁ ... Hₙ₋₂
    //  *
    //  * where each Householder reflector is
    //  *
    //  *     Hₖ = I − τₖ vₖ vₖᴴ
    //  *
    //  * The reflectors {vₖ, τₖ} are assumed to be stored exactly as produced by
    //  * sytrd / hetrd:
    //  *
    //  *   - vₖ is stored in A[k+1:n-1, k]
    //  *   - vₖ[0] = 1 is implicit (not stored)
    //  *   - τₖ is stored in TAU[k]
    //  *
    //  * This implementation is semantically equivalent to LAPACK ZUNGTR
    //  * (internally using the same logic as ZUNMTR applied to the identity).
    //  *
    //  * On exit, Q satisfies:
    //  *
    //  *     A ≈ Q · T · Qᴴ
    //  *
    //  * provided sytrd was correct.
    //  *
    //  * @param A   Matrix containing Householder vectors (modified sytrd output)
    //  * @param TAU Householder scalar factors
    //  * @returns   Unitary matrix Q
    //  */
    // public static readonly ungtr = (A: MultiArray, TAU: ComplexType[]): MultiArray => {
    //     const n = A.dimension[0];

    //     // Q ← I
    //     const Q = new MultiArray([n, n]);
    //     Q.array = LAPACK.eye([n, n]);

    //     // Apply reflectors in reverse order:
    //     // Q ← H₀ H₁ ... Hₙ₋₂
    //     // but constructed as:
    //     // Q ← Hₖ Q   for k = n-2 ... 0
    //     for (let k = n - 2; k >= 0; k--) {
    //         const tau = TAU[k];
    //         if (Complex.realIsZero(Complex.abs(tau))) {
    //             continue; // trivial reflector
    //         }

    //         const m = n - k - 1; // length of vₖ

    //         /*
    //          * Reconstruct vₖ exactly as LAPACK expects:
    //          *
    //          *   v = [1; A[k+2:n-1, k]]
    //          *
    //          * stored implicitly with v[0] = 1
    //          */
    //         const v: ComplexType[] = new Array(m);
    //         v[0] = Complex.one();
    //         for (let i = 1; i < m; i++) {
    //             v[i] = Complex.copy(A.array[k + 1 + i][k] as ComplexType);
    //         }

    //         /*
    //          * Apply Hₖ from the LEFT:
    //          *
    //          *   Q[k+1:n-1, :] ← (I − τ v vᴴ) Q[k+1:n-1, :]
    //          *
    //          * This is exactly what ZUNMTR does internally.
    //          */

    //         // w = vᴴ · Q_sub   (row vector of length n)
    //         const w: ComplexType[] = new Array(n);
    //         for (let j = 0; j < n; j++) {
    //             let sum = Complex.zero();
    //             for (let i = 0; i < m; i++) {
    //                 Complex.mulAndSumTo(sum, Complex.conj(v[i]), Q.array[k + 1 + i][j] as ComplexType);
    //             }
    //             w[j] = sum;
    //         }

    //         // Q_sub ← Q_sub − τ · v · w
    //         for (let i = 0; i < m; i++) {
    //             const scale = Complex.mul(tau, v[i]);
    //             for (let j = 0; j < n; j++) {
    //                 Q.array[k + 1 + i][j] = Complex.sub(Q.array[k + 1 + i][j] as ComplexType, Complex.mul(scale, w[j]));
    //             }
    //         }
    //     }

    //     return Q;
    // };

    public static readonly jacobi_complex_hermitian_dense_1 = (
        // TODO
        T: ComplexType[][],
        maxSweeps: NumLikeType = 1e3,
        tol: NumLikeType = 1e-14,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        const n = T.length;

        /* Copy matrix */
        const A: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Complex.copy(T[i][j])));

        /* Eigenvector matrix */
        const V: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Complex.one() : Complex.zero())));

        const maxSweepsNum = Number(maxSweeps);
        const tolNum = Number(tol);

        for (let sweep = 0; sweep < maxSweepsNum; sweep++) {
            let offNorm = 0;

            for (let p = 0; p < n; p++) {
                for (let q = p + 1; q < n; q++) {
                    const Apq = A[p][q];
                    const magApq = Complex.realToNumber(Complex.abs(Apq));
                    offNorm += magApq * magApq;

                    if (magApq <= tolNum) continue;

                    const App = A[p][p];
                    const Aqq = A[q][q];

                    /* Compute Jacobi parameters */
                    const delta = Complex.sub(Aqq, App);
                    const deltaRe = Complex.realToNumber(delta);

                    const t = deltaRe / (2 * magApq);
                    const sign = t >= 0 ? 1 : -1;
                    const tau = sign / (Math.abs(t) + Math.sqrt(1 + t * t));

                    const c = 1 / Math.sqrt(1 + tau * tau);
                    const sMag = tau * c;

                    /* Phase of s matches Apq */
                    const phase = Complex.rdiv(Apq, Complex.abs(Apq));
                    const s = Complex.mul(Complex.create(sMag, 0), phase);

                    /* Apply rotation to A */
                    for (let k = 0; k < n; k++) {
                        if (k !== p && k !== q) {
                            const Akp = A[k][p];
                            const Akq = A[k][q];

                            A[k][p] = Complex.sub(Complex.mul(Complex.create(c, 0), Akp), Complex.mul(Complex.conj(s), Akq));
                            A[p][k] = Complex.conj(A[k][p]);

                            A[k][q] = Complex.add(Complex.mul(s, Akp), Complex.mul(Complex.create(c, 0), Akq));
                            A[q][k] = Complex.conj(A[k][q]);
                        }
                    }

                    /* Update diagonal */
                    const c2 = c * c;
                    const s2 = sMag * sMag;

                    A[p][p] = Complex.sub(
                        Complex.add(Complex.mul(Complex.create(c2, 0), App), Complex.mul(Complex.create(s2, 0), Aqq)),
                        Complex.mul(Complex.create(2 * c * sMag, 0), Complex.abs(Apq)),
                    );

                    A[q][q] = Complex.add(
                        Complex.add(Complex.mul(Complex.create(s2, 0), App), Complex.mul(Complex.create(c2, 0), Aqq)),
                        Complex.mul(Complex.create(2 * c * sMag, 0), Complex.abs(Apq)),
                    );

                    A[p][q] = Complex.zero();
                    A[q][p] = Complex.zero();

                    /* Update eigenvectors */
                    for (let k = 0; k < n; k++) {
                        const Vkp = V[k][p];
                        const Vkq = V[k][q];

                        V[k][p] = Complex.sub(Complex.mul(Complex.create(c, 0), Vkp), Complex.mul(Complex.conj(s), Vkq));
                        V[k][q] = Complex.add(Complex.mul(s, Vkp), Complex.mul(Complex.create(c, 0), Vkq));
                    }
                }
            }

            if (Math.sqrt(offNorm) < tolNum) break;
        }

        /* Extract eigenvalues */
        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D[i] = Complex.copy(A[i][i]); // should be real
        }

        /* Normalize eigenvector phases */
        LAPACK.normalize_eigenvector_phases(V);

        return { D, V };
    };

    /**
     * Jacobi rotation for a 2×2 Hermitian complex block:
     *
     *      [ a   b ]
     *      [ b*  d ]
     *
     * Returns c (real) and s (complex) such that:
     *
     *      Jᴴ A J is diagonal
     *
     * with:
     *
     *      J = [  c        s ]
     *          [ -conj(s)  c ]
     */
    public static readonly jacobi_hermitian_2x2 = (a: ComplexType, b: ComplexType, d: ComplexType): { c: ComplexType; s: ComplexType } => {
        // TODO
        // If b == 0 → no rotation needed
        const absb = Complex.abs(b);
        if (Complex.realIsZero(absb)) {
            return { c: Complex.one(), s: Complex.zero() };
        }

        // Phase of b
        // exp(i φ) = b / |b|
        const phase = Complex.rdiv(b, absb);

        // Reduce to real symmetric problem:
        // [ a    |b| ]
        // [ |b|   d  ]
        const ar = Complex.realToNumber(Complex.real(a));
        const dr = Complex.realToNumber(Complex.real(d));
        const br = Complex.realToNumber(absb);

        // Compute Jacobi angle (real case)
        const tau = (dr - ar) / (2 * br);
        const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));

        const c_real = 1 / Math.sqrt(1 + t * t);
        const s_real = t * c_real;

        // Lift back to complex
        const c = Complex.create(c_real, 0);
        const s = Complex.mul(Complex.create(s_real, 0), phase);

        return { c, s };
    };

    // public static readonly jacobi_complex_hermitian_dense = (
    //     A: ComplexType[][],
    //     maxSweeps: NumLikeType = 1e3,
    //     tol: NumLikeType = 1e-14,
    // ): {
    //     D: ComplexType[];
    //     V: ComplexType[][];
    // } => {
    //     const n = A.length;
    //     if (n === 0) {
    //         return { D: [], V: [] };
    //     }
    //     // cópia defensiva de A
    //     const M: ComplexType[][] = Array.from({ length: n }, (_, i) =>
    //         Array.from({ length: n }, (_, j) => Complex.copy(A[i][j]))
    //     );
    //     // V = identidade
    //     const V: ComplexType[][] = LAPACK.eye([n, n]);

    //     // norma diagonal (para escala do critério)
    //     const diagNorm = (): number => {
    //         let s = 0;
    //         for (let i = 0; i < n; i++) {
    //             const ai = M[i][i];
    //             s += Complex.realToNumber(Complex.abs(ai)) ** 2;
    //         }
    //         return Math.sqrt(s);
    //     };

    //     // norma fora da diagonal
    //     const offDiagNorm = (): number => {
    //         let s = 0;
    //         for (let i = 0; i < n; i++) {
    //             for (let j = i + 1; j < n; j++) {
    //                 const aij = M[i][j];
    //                 const v = Complex.realToNumber(Complex.abs(aij));
    //                 s += 2 * v * v;
    //             }
    //         }
    //         return Math.sqrt(s);
    //     };

    //     const diagScale = Math.max(diagNorm(), 1);

    //     // =========================
    //     // sweeps de Jacobi
    //     // =========================
    //     for (let sweep = 0; sweep < toNumber(maxSweeps); sweep++) {
    //         const off = offDiagNorm();
    //         if (off < toNumber(tol) * diagScale) {
    //             break;
    //         }

    //         for (let p = 0; p < n - 1; p++) {
    //             for (let q = p + 1; q < n; q++) {
    //                 const apq = M[p][q];
    //                 const abs_apq = Complex.abs(apq);
    //                 if (Complex.realToNumber(abs_apq) < toNumber(tol)) continue;

    //                 const app = M[p][p]; // real
    //                 const aqq = M[q][q]; // real

    //                 // fase de apq
    //                 const phi = Complex.arg(apq);
    //                 const exp_iphi = Complex.exp(Complex.create(0, phi.re));
    //                 const exp_minus_iphi = Complex.conj(exp_iphi);

    //                 // b real >= 0
    //                 const b = Complex.realToNumber(abs_apq);

    //                 // a, d reais
    //                 const a = Complex.realToNumber(app);
    //                 const d = Complex.realToNumber(aqq);

    //                 // Jacobi real 2x2
    //                 const delta = d - a;
    //                 let t: number;
    //                 if (Math.abs(delta) < 1e-30) {
    //                     t = 1;
    //                 } else {
    //                     const sign = delta > 0 ? 1 : -1;
    //                     t = (2 * b) / (Math.abs(delta) + Math.sqrt(delta * delta + 4 * b * b));
    //                     t *= sign;
    //                 }
    //                 const c = 1 / Math.sqrt(1 + t * t);
    //                 const s = t * c;

    //                 // rotações complexas
    //                 const cs = Complex.create(c);
    //                 const ss = Complex.create(s);

    //                 const u_pp = cs;
    //                 const u_pq = Complex.neg(Complex.mul(ss, exp_minus_iphi));
    //                 const u_qp = Complex.mul(ss, exp_iphi);
    //                 const u_qq = cs;

    //                 // === atualizar M ===
    //                 for (let k = 0; k < n; k++) {
    //                     const mkp = M[k][p];
    //                     const mkq = M[k][q];

    //                     M[k][p] = Complex.add(
    //                         Complex.mul(mkp, u_pp),
    //                         Complex.mul(mkq, u_qp)
    //                     );
    //                     M[k][q] = Complex.add(
    //                         Complex.mul(mkp, u_pq),
    //                         Complex.mul(mkq, u_qq)
    //                     );
    //                 }

    //                 for (let k = 0; k < n; k++) {
    //                     const mpk = M[p][k];
    //                     const mqk = M[q][k];

    //                     M[p][k] = Complex.add(
    //                         Complex.mul(Complex.conj(u_pp), mpk),
    //                         Complex.mul(Complex.conj(u_qp), mqk)
    //                     );
    //                     M[q][k] = Complex.add(
    //                         Complex.mul(Complex.conj(u_pq), mpk),
    //                         Complex.mul(Complex.conj(u_qq), mqk)
    //                     );
    //                 }

    //                 // forçar hermiticidade local
    //                 M[p][q] = Complex.zero();
    //                 M[q][p] = Complex.zero();
    //                 M[p][p] = Complex.create(M[p][p].re);
    //                 M[q][q] = Complex.create(M[q][q].re);

    //                 // === atualizar V ===
    //                 for (let k = 0; k < n; k++) {
    //                     const vkp = V[k][p];
    //                     const vkq = V[k][q];

    //                     V[k][p] = Complex.add(
    //                         Complex.mul(vkp, u_pp),
    //                         Complex.mul(vkq, u_qp)
    //                     );
    //                     V[k][q] = Complex.add(
    //                         Complex.mul(vkp, u_pq),
    //                         Complex.mul(vkq, u_qq)
    //                     );
    //                 }
    //             }
    //         }
    //     }

    //     // autovalores (reais!)
    //     const D: ComplexType[] = new Array(n);
    //     for (let i = 0; i < n; i++) {
    //         D[i] = Complex.create(M[i][i].re);
    //     }

    //     return { D, V };
    // };

    public static readonly jacobi_complex_hermitian_dense = (
        // TODO
        A: ComplexType[][],
        maxSweeps: NumLikeType = 1e3,
        tol: NumLikeType = 1e-14,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        const n = A.length;
        if (n === 0) return { D: [], V: [] };

        // cópia defensiva de A
        const M: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => Complex.copy(A[i][j])));

        // V = identidade
        const V: ComplexType[][] = LAPACK.eye([n, n]);

        const tolNum = toNumber(tol);
        const maxIts = toNumber(maxSweeps);

        // norma fora da diagonal
        const offDiagNorm = (): number => {
            let s = 0;
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const v = Complex.realToNumber(Complex.abs(M[i][j]));
                    s += 2 * v * v;
                }
            }
            return Math.sqrt(s);
        };

        // escala (norma diagonal)
        let diagScale = 0;
        for (let i = 0; i < n; i++) {
            const v = Complex.realToNumber(Complex.abs(M[i][i]));
            diagScale += v * v;
        }
        diagScale = Math.max(Math.sqrt(diagScale), 1);

        // =========================
        // Sweeps de Jacobi
        // =========================
        for (let sweep = 0; sweep < maxIts; sweep++) {
            const off = offDiagNorm();
            if (off < tolNum * diagScale) break;

            for (let p = 0; p < n - 1; p++) {
                for (let q = p + 1; q < n; q++) {
                    const apq = M[p][q];
                    if (Complex.realToNumber(Complex.abs(apq)) < tolNum) continue;

                    // === núcleo Jacobi hermitiano 2x2 ===
                    const { c, s } = LAPACKunused.jacobi_hermitian_2x2(M[p][p], M[p][q], M[q][q]);

                    // === atualizar M (colunas) ===
                    for (let k = 0; k < n; k++) {
                        const mkp = M[k][p];
                        const mkq = M[k][q];

                        M[k][p] = Complex.add(Complex.mul(mkp, c), Complex.mul(mkq, s));

                        M[k][q] = Complex.add(Complex.mul(mkq, c), Complex.mul(mkp, Complex.neg(Complex.conj(s))));
                    }

                    // === atualizar M (linhas) ===
                    for (let k = 0; k < n; k++) {
                        const mpk = M[p][k];
                        const mqk = M[q][k];

                        M[p][k] = Complex.add(Complex.mul(mpk, c), Complex.mul(mqk, Complex.conj(s)));

                        M[q][k] = Complex.add(Complex.mul(mqk, c), Complex.mul(mpk, Complex.neg(s)));
                    }

                    // === garantir hermiticidade numérica ===
                    M[p][q] = Complex.zero();
                    M[q][p] = Complex.zero();
                    M[p][p] = Complex.create(M[p][p].re);
                    M[q][q] = Complex.create(M[q][q].re);

                    // === atualizar V ===
                    for (let k = 0; k < n; k++) {
                        const vkp = V[k][p];
                        const vkq = V[k][q];

                        V[k][p] = Complex.add(Complex.mul(vkp, c), Complex.mul(vkq, s));

                        V[k][q] = Complex.add(Complex.mul(vkq, c), Complex.mul(vkp, Complex.neg(Complex.conj(s))));
                    }
                }
            }
        }

        // autovalores (reais!)
        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D[i] = Complex.create(M[i][i].re);
        }

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
        const V: ComplexType[][] = LAPACK.eye([n, n]);
        const eps = tol ?? 1e-12;
        const maxS = maxSweeps ?? Math.max(50, Math.floor(1000 / Math.max(1, n)));
        const offNorm = (M: ComplexType[][]): number => {
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
                    const tpq = T[p][q];
                    if (Complex.realToNumber(Complex.le(Complex.abs(tpq), Complex.create(eps)))) continue;
                    const tpp = T[p][p];
                    const tqq = T[q][q];
                    // Choose rotation using real parts (robust)
                    const real_tpq = Complex.realToNumber(Complex.real(tpq));
                    const real_tpp = Complex.realToNumber(Complex.real(tpp));
                    const real_tqq = Complex.realToNumber(Complex.real(tqq));
                    const phi = 0.5 * Math.atan2(2 * real_tpq, real_tqq - real_tpp);
                    const c = Math.cos(phi);
                    const s = Math.sin(phi);
                    // update T (Hermitian) and accumulate Z
                    for (let k = 0; k < n; k++) {
                        if (k === p || k === q) continue;
                        const tkp = T[k][p];
                        const tkq = T[k][q];
                        T[k][p] = Complex.sub(Complex.mul(Complex.create(c), tkp), Complex.mul(Complex.create(s), tkq));
                        T[p][k] = Complex.conj(T[k][p]);
                        T[k][q] = Complex.add(Complex.mul(Complex.create(s), tkp), Complex.mul(Complex.create(c), tkq));
                        T[q][k] = Complex.conj(T[k][q]);
                    }
                    T[p][p] = Complex.add(Complex.sub(Complex.mul(Complex.create(c * c), tpp), Complex.mul(Complex.create(2 * s * c), tpq)), Complex.mul(Complex.create(s * s), tqq));
                    T[q][q] = Complex.add(Complex.add(Complex.mul(Complex.create(s * s), tpp), Complex.mul(Complex.create(2 * s * c), tpq)), Complex.mul(Complex.create(c * c), tqq));
                    T[p][q] = Complex.zero();
                    T[q][p] = Complex.zero();
                    // update V (eigenvector accumulator)
                    for (let r = 0; r < n; r++) {
                        const vrp = V[r][p];
                        const vrq = V[r][q];
                        V[r][p] = Complex.sub(Complex.mul(Complex.create(c), vrp), Complex.mul(Complex.create(s), vrq));
                        V[r][q] = Complex.add(Complex.mul(Complex.create(s), vrp), Complex.mul(Complex.create(c), vrq));
                    }
                    any = true;
                }
            }
            if (!any) break;
            if (offNorm(T) <= eps) break;
        }
        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) D[i] = T[i][i];
        return { D, V };
    };

    public static readonly jacobi_real_symmetric_structured_2n = (
        // TODO
        T: ComplexType[][],
        maxSweeps: number = 1000,
        tol: number = 1e-12,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        const N = T.length; // = 2n
        const n = N / 2;
        // --- Inicializa V = identidade ---
        const V = LAPACK.eye([N, N]);
        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let maxOff = 0;
            for (let p = 0; p < n; p++) {
                for (let q = p + 1; q < n; q++) {
                    const tpq = Complex.realToNumber(T[p][q] as ComplexType);
                    maxOff = Math.max(maxOff, Math.abs(tpq));
                    if (Math.abs(tpq) < tol) continue;
                    const tpp = Complex.realToNumber(T[p][p] as ComplexType);
                    const tqq = Complex.realToNumber(T[q][q] as ComplexType);
                    const tau = (tqq - tpp) / (2 * tpq);
                    const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
                    const c = 1 / Math.sqrt(1 + t * t);
                    const s = t * c;
                    // --- aplica rotação em (p,q) e (p+n,q+n)
                    for (let k = 0; k < N; k++) {
                        // linhas
                        let x = Complex.realToNumber(T[p][k] as ComplexType);
                        let y = Complex.realToNumber(T[q][k] as ComplexType);
                        T[p][k] = Complex.create(c * x - s * y);
                        T[q][k] = Complex.create(s * x + c * y);
                        x = Complex.realToNumber(T[p + n][k] as ComplexType);
                        y = Complex.realToNumber(T[q + n][k] as ComplexType);
                        T[p + n][k] = Complex.create(c * x - s * y);
                        T[q + n][k] = Complex.create(s * x + c * y);
                    }
                    for (let k = 0; k < N; k++) {
                        // colunas
                        let x = Complex.realToNumber(T[k][p] as ComplexType);
                        let y = Complex.realToNumber(T[k][q] as ComplexType);
                        T[k][p] = Complex.create(c * x - s * y);
                        T[k][q] = Complex.create(s * x + c * y);
                        x = Complex.realToNumber(T[k][p + n] as ComplexType);
                        y = Complex.realToNumber(T[k][q + n] as ComplexType);
                        T[k][p + n] = Complex.create(c * x - s * y);
                        T[k][q + n] = Complex.create(s * x + c * y);
                    }
                    // --- acumula V
                    for (let k = 0; k < N; k++) {
                        let x = Complex.realToNumber(V[k][p] as ComplexType);
                        let y = Complex.realToNumber(V[k][q] as ComplexType);
                        V[k][p] = Complex.create(c * x - s * y);
                        V[k][q] = Complex.create(s * x + c * y);
                        x = Complex.realToNumber(V[k][p + n] as ComplexType);
                        y = Complex.realToNumber(V[k][q + n] as ComplexType);
                        V[k][p + n] = Complex.create(c * x - s * y);
                        V[k][q + n] = Complex.create(s * x + c * y);
                    }
                }
            }
            if (maxOff < tol) break;
        }
        // --- Extract eigenvalues ---
        const D: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D[i] = T[i][i] as ComplexType;
        }
        return { D, V };
    };

    public static readonly jacobi_hermitian_real2n = (
        // TODO
        T: ComplexType[][],
        maxSweeps: number = 1000,
        tol: number = 1e-12,
    ): {
        D: ComplexType[];
        V: ComplexType[][];
    } => {
        // --- 1. Hermitian Transformation → Real 2n×2n ---
        const T_real = LAPACK.hermitian_to_real2n(T);
        // --- 2. Real symmetrical Jacobi ---
        const { D, V } = LAPACK.jacobi_real_symmetric_dense(T_real, maxSweeps, tol);
        // --- 3. Reconstrói autovetores complexos ---
        const VR = LAPACK.real2n_to_complex_eigenvectors(V);
        return { D, V: VR };
    };

    public static readonly jacobi_hermitian_real2n_direct = (
        // TODO
        diag: ComplexType[],
        offdiag: ComplexType[],
        maxSweeps: number = 1000,
        tol: number = 1e-12,
    ): { D: ComplexType[]; V: ComplexType[][] } => {
        const T0 = LAPACK.tridiagonal_hermitian_to_dense(diag, offdiag);
        // --- 1. Hermitian Transformation → Real 2n×2n ---
        const T_real = LAPACK.hermitian_to_real2n(T0);
        // --- 2. Real symmetrical Jacobi ---
        const { D, V } = LAPACK.jacobi_real_symmetric_dense(T_real, maxSweeps, tol);
        // --- 3. Reconstrói autovetores complexos ---
        const VR = LAPACK.real2n_to_complex_eigenvectors(V);
        return { D, V: VR };
    };

    public static readonly numeric_jacobi_hermitian_via_real2n_final = (T: MultiArray, maxSweeps: number = 1000, tol: number = 1e-12): { D: ComplexType[]; Z: MultiArray } => {
        // TODO
        const n = T.dimension[0];
        // --- 1. Hermitian Transformation → Real 2n×2n ---
        const T_real = LAPACK.hermitian_to_real2n(T.array as ComplexType[][]);
        // --- 2. Real symmetrical Jacobi ---
        const { D, V } = LAPACKunused.jacobi_real_symmetric_structured_2n(T_real, maxSweeps, tol);
        const Q_real = V;
        // --- 4. Reconstrói autovetores complexos com normalização ---
        const Z = new MultiArray([n, n]);
        for (let j = 0; j < n; j++) {
            // coluna j
            let normSquared = Complex.zero();
            for (let i = 0; i < n; i++) {
                const x = Q_real[i][j] as ComplexType;
                const y = Q_real[i + n][j] as ComplexType;
                Z.array[i][j] = Complex.create(x.re, y.re);
                normSquared = Complex.add(normSquared, Complex.add(Complex.mul(x, x), Complex.mul(y, y)));
            }
            // normaliza a coluna
            const norm = Complex.sqrt(normSquared);
            for (let i = 0; i < n; i++) {
                Z.array[i][j] = Complex.rdiv(Z.array[i][j] as ComplexType, norm);
            }
        }
        return { D, Z };
    };

    public static readonly jacobi_hermitian_dense = (
        // TODO
        T: MultiArray,
        tol: number,
        maxSweeps: number,
    ): {
        A: MultiArray;
        Z: MultiArray;
    } => {
        const n = T.array.length;
        const A = new MultiArray([n, n]);
        const Z = new MultiArray([n, n], Complex.zero());
        // A ← T, Z ← I
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                A.array[i][j] = T.array[i][j];
                Z.array[i][j] = i === j ? Complex.create(1) : Complex.zero();
            }
        }
        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let off = 0;
            for (let p = 0; p < n - 1; p++) {
                for (let q = p + 1; q < n; q++) {
                    const Apq = A.array[p][q] as ComplexType;
                    const absApq = Complex.realToNumber(Complex.abs(Apq));
                    off += absApq;
                    if (absApq <= tol) continue;
                    const a = Complex.realToNumber(A.array[p][p] as ComplexType);
                    const d = Complex.realToNumber(A.array[q][q] as ComplexType);
                    const b = Apq;
                    const absb = absApq;
                    const tau = (d - a) / (2 * absb);
                    const t = tau === 0 ? 1 : Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
                    const c = 1 / Math.sqrt(1 + t * t);
                    const s_real = t * c;
                    const phase = Complex.rdiv(b, Complex.create(absb));
                    const s = Complex.mul(phase, Complex.create(s_real));
                    // Atualiza A
                    for (let k = 0; k < n; k++) {
                        if (k !== p && k !== q) {
                            const Akp = A.array[k][p] as ComplexType;
                            const Akq = A.array[k][q] as ComplexType;
                            const A_kp_new = Complex.sub(Complex.mul(Akp, Complex.create(c)), Complex.mul(Complex.conj(s), Akq));
                            const A_kq_new = Complex.add(Complex.mul(Akq, Complex.create(c)), Complex.mul(s, Akp));
                            A.array[k][p] = A_kp_new;
                            A.array[p][k] = Complex.conj(A_kp_new);
                            A.array[k][q] = A_kq_new;
                            A.array[q][k] = Complex.conj(A_kq_new);
                        }
                    }
                    const t2 = t * t;
                    const c2 = c * c;
                    const s2 = t2 * c2;
                    const app = c2 * a - 2 * c * s_real * absb + s2 * d;
                    const aqq = s2 * a + 2 * c * s_real * absb + c2 * d;
                    A.array[p][p] = Complex.create(app);
                    A.array[q][q] = Complex.create(aqq);
                    A.array[p][q] = Complex.zero();
                    A.array[q][p] = Complex.zero();
                    // Atualiza Z
                    for (let k = 0; k < n; k++) {
                        const Zkp = Z.array[k][p] as ComplexType;
                        const Zkq = Z.array[k][q] as ComplexType;
                        Z.array[k][p] = Complex.add(Complex.mul(Zkp, Complex.create(c)), Complex.mul(s, Zkq));
                        Z.array[k][q] = Complex.sub(Complex.mul(Zkq, Complex.create(c)), Complex.mul(Complex.conj(s), Zkp));
                    }
                }
            }
            if (off < tol) break;
        }
        return { A, Z };
    };

    public static readonly numeric_jacobi_hermitian_direct = (
        // TODO
        D: ComplexType[],
        E: ComplexType[],
        maxSweeps: number = 100,
        tol: number = 1e-12,
    ): {
        D_work: ComplexType[];
        Z: MultiArray;
    } => {
        const n = D.length;
        // --- Constrói matriz hermitiana densa A ---
        const A = new MultiArray([n, n], Complex.zero());
        for (let i = 0; i < n; i++) {
            A.array[i][i] = D[i];
            if (i < n - 1) {
                A.array[i][i + 1] = E[i];
                A.array[i + 1][i] = Complex.conj(E[i]);
            }
        }
        // --- Inicializa Z = I ---
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye([n, n]);
        // --- Varreduras Jacobi ---
        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let off = 0;
            for (let p = 0; p < n - 1; p++) {
                for (let q = p + 1; q < n; q++) {
                    const Apq = A.array[p][q] as ComplexType;
                    const absApq = Complex.realToNumber(Complex.abs(Apq));
                    off += absApq * absApq;
                    if (absApq > tol) {
                        LAPACKunused.jacobi_rotate_hermitian(A, Z, p, q);
                    }
                }
            }
            if (Math.sqrt(off) < tol) {
                break;
            }
        }
        // --- Extrai autovalores ---
        const D_work: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D_work[i] = A.array[i][i] as ComplexType;
        }
        return { D_work, Z };
    };

    public static readonly jacobi_hermitian_full = (T: MultiArray, maxSweeps: number = 50, tol: number = 1e-12): MultiArray => {
        // TODO
        const n = T.dimension[0];
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);
        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let maxOff = 0;
            for (let p = 0; p < n; p++) {
                for (let q = p + 1; q < n; q++) {
                    const val = T.array[p][q] as ComplexType;
                    const absVal = Complex.realToNumber(Complex.abs(val));
                    maxOff = Math.max(maxOff, absVal);
                    if (absVal > tol) {
                        LAPACKunused.jacobi_hermitian_rotation(T, Z, p, q);
                    }
                }
            }
            if (maxOff < tol) break;
        }
        return Z;
    };

    // public static readonly numeric_jacobi_hermitian_direct = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     maxSweeps: number = 1000,
    //     tol: number = 1e-12
    // ): { D_work: ComplexType[], Z: MultiArray } => {
    //     const n = D.length;

    //     // --- 1. Constrói matriz densa hermitiana ---
    //     const T = new MultiArray([n, n]);
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             T.array[i][j] = Complex.zero();
    //         }
    //     }
    //     for (let i = 0; i < n; i++) {
    //         T.array[i][i] = Complex.copy(D[i]);
    //         if (i < n - 1) {
    //             T.array[i][i + 1] = Complex.copy(E[i]);
    //             T.array[i + 1][i] = Complex.conj(E[i]);
    //         }
    //     }

    //     // --- 2. Transformação real 2n×2n ---
    //     const T_real = new MultiArray([2 * n, 2 * n]);
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             const tij = T.array[i][j] as ComplexType;
    //             const a = tij.re;
    //             const b = tij.im;

    //             T_real.array[i][j] = a;
    //             T_real.array[i][j + n] = -b;
    //             T_real.array[i + n][j] = b;
    //             T_real.array[i + n][j + n] = a;
    //         }
    //     }

    //     // --- 3. Jacobi real simétrico ---
    //     const Q_real = LAPACK.jacobi_real_symmetric_dense(T_real, maxSweeps, tol);

    //     // --- 4. Extrai autovalores ---
    //     const D_work: ComplexType[] = new Array(n);
    //     for (let i = 0; i < n; i++) {
    //         D_work[i] = Complex.create(T_real.array[i][i] as number);
    //     }

    //     // --- 5. Reconstrução correta de Z complexa ---
    //     const Z = new MultiArray([n, n]);
    //     for (let j = 0; j < n; j++) {
    //         // Cada autovetor complexo vem de **pares de colunas** (j, j+n)
    //         let normSquared = 0;
    //         for (let i = 0; i < n; i++) {
    //             const x = Q_real.array[i][j] as number;
    //             const y = Q_real.array[i + n][j] as number;
    //             Z.array[i][j] = Complex.create(x, y);
    //             normSquared += x * x + y * y;
    //         }
    //         const norm = Math.sqrt(normSquared);
    //         for (let i = 0; i < n; i++) {
    //             Z.array[i][j] = Complex.div(Z.array[i][j], Complex.create(norm));
    //         }
    //     }

    //     return { D_work, Z };
    // };

    public static readonly numeric_jacobi_hermitian_direct_02 = (
        // TODO
        D: ComplexType[],
        E: ComplexType[],
        maxSweeps: number = 1000,
        tol: number = 1e-12,
    ): {
        D_work: ComplexType[];
        Z: MultiArray;
    } => {
        const n = D.length;
        // --- 1. Constrói matriz densa hermitiana ---
        const T = new MultiArray([n, n]);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                T.array[i][j] = Complex.zero();
            }
        }
        for (let i = 0; i < n; i++) {
            T.array[i][i] = Complex.copy(D[i]);
            if (i < n - 1) {
                T.array[i][i + 1] = Complex.copy(E[i]);
                T.array[i + 1][i] = Complex.conj(E[i]);
            }
        }
        // --- 2. Transformação real 2n×2n ---
        const T_real = new MultiArray([2 * n, 2 * n]);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const tij = T.array[i][j] as ComplexType;
                const a = Complex.real(tij);
                const b = Complex.imag(tij);
                T_real.array[i][j] = a;
                T_real.array[i][j + n] = Complex.neg(b);
                T_real.array[i + n][j] = b;
                T_real.array[i + n][j + n] = a;
            }
        }
        // --- 3. Jacobi real simétrico ---
        const { V } = LAPACK.jacobi_real_symmetric_dense(T_real.array as ComplexType[][], maxSweeps, tol);
        // --- 4. Extrai autovalores ---
        const D_work: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D_work[i] = Complex.real(T_real.array[i][i] as ComplexType);
        }
        // --- 5. Reconstrução correta de Z complexa ---
        const Z = new MultiArray([n, n]);
        for (let j = 0; j < n; j++) {
            // Cada autovetor complexo vem de **pares de colunas** (j, j+n)
            for (let i = 0; i < n; i++) {
                const u = V[i][j] as ComplexType;
                const v = Complex.neg(V[i][j + n] as ComplexType);
                Z.array[i][j] = Complex.create(u.re, v.re);
            }
        }
        return { D_work, Z };
    };

    // public static readonly numeric_jacobi_hermitian_direct = (
    //     T: MultiArray,
    //     tol: number = 1e-12,
    //     maxSweeps: number = 50
    // ): { D: MultiArray; Z: MultiArray } => {

    //     const n = T.array.length;

    //     /* --------------------------------------------------
    //      * Inicializa Z = I
    //      * -------------------------------------------------- */
    //     const Z = new MultiArray([n, n]);
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             Z.array[i][j] = (i === j)
    //                 ? Complex.one()
    //                 : Complex.zero();
    //         }
    //     }

    //     /* --------------------------------------------------
    //      * Copiamos T para A (trabalho interno)
    //      * -------------------------------------------------- */
    //     const A = new MultiArray([n, n]);
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             A.array[i][j] = T.array[i][j];
    //         }
    //     }

    //     /* --------------------------------------------------
    //      * Sweeps Jacobi
    //      * -------------------------------------------------- */
    //     for (let sweep = 0; sweep < maxSweeps; sweep++) {

    //         let off = 0;

    //         for (let p = 0; p < n - 1; p++) {
    //             for (let q = p + 1; q < n; q++) {

    //                 const Apq = A.array[p][q] as ComplexType;
    //                 const absApq = Complex.realToNumber(Complex.abs(Apq));
    //                 off += absApq;

    //                 if (absApq <= tol) continue;

    //                 /* ------------------------------------------
    //                  * Bloco hermitiano 2×2
    //                  * ------------------------------------------ */
    //                 const App = A.array[p][p] as ComplexType; // real
    //                 const Aqq = A.array[q][q] as ComplexType; // real

    //                 const a = Complex.realToNumber(App);
    //                 const d = Complex.realToNumber(Aqq);
    //                 const b = Apq;
    //                 const absb = Complex.realToNumber(Complex.abs(b));

    //                 /* ------------------------------------------
    //                  * Ângulo Jacobi (estável)
    //                  * ------------------------------------------ */
    //                 const delta = d - a;
    //                 const t = delta === 0
    //                     ? 1
    //                     : Math.sign(delta) * absb / (Math.abs(delta) + Math.sqrt(delta * delta + absb * absb));

    //                 const c = 1 / Math.sqrt(1 + t * t);
    //                 const s_real = t * c;

    //                 /* fase complexa */
    //                 const phase = Complex.rdiv(b, Complex.create(absb));
    //                 const s = Complex.mul(phase, Complex.create(s_real));

    //                 /* ------------------------------------------
    //                  * Atualiza A (linhas e colunas p, q)
    //                  * ------------------------------------------ */
    //                 for (let k = 0; k < n; k++) {
    //                     if (k !== p && k !== q) {

    //                         const Akp = A.array[k][p] as ComplexType;
    //                         const Akq = A.array[k][q] as ComplexType;

    //                         const newAkp = Complex.add(
    //                             Complex.mul(Akp, Complex.create(c)),
    //                             Complex.mul(s, Akq)
    //                         );

    //                         const newAkq = Complex.sub(
    //                             Complex.mul(Akq, Complex.create(c)),
    //                             Complex.mul(Complex.conj(s), Akp)
    //                         );

    //                         A.array[k][p] = newAkp;
    //                         A.array[p][k] = Complex.conj(newAkp);

    //                         A.array[k][q] = newAkq;
    //                         A.array[q][k] = Complex.conj(newAkq);
    //                     }
    //                 }

    //                 /* ------------------------------------------
    //                  * Diagonal (forma fechada)
    //                  * ------------------------------------------ */
    //                 const disc = Math.sqrt(delta * delta + 4 * absb * absb);
    //                 const lambda1 = 0.5 * (a + d - disc);
    //                 const lambda2 = 0.5 * (a + d + disc);

    //                 A.array[p][p] = Complex.create(lambda1);
    //                 A.array[q][q] = Complex.create(lambda2);

    //                 A.array[p][q] = Complex.zero();
    //                 A.array[q][p] = Complex.zero();

    //                 /* ------------------------------------------
    //                  * Atualiza Z
    //                  * ------------------------------------------ */
    //                 for (let k = 0; k < n; k++) {
    //                     const Zkp = Z.array[k][p] as ComplexType;
    //                     const Zkq = Z.array[k][q] as ComplexType;

    //                     Z.array[k][p] = Complex.add(
    //                         Complex.mul(Zkp, Complex.create(c)),
    //                         Complex.mul(s, Zkq)
    //                     );

    //                     Z.array[k][q] = Complex.sub(
    //                         Complex.mul(Zkq, Complex.create(c)),
    //                         Complex.mul(Complex.conj(s), Zkp)
    //                     );
    //                 }
    //             }
    //         }

    //         if (off < tol) break;
    //     }

    //     /* --------------------------------------------------
    //      * Extrai D (diagonal)
    //      * -------------------------------------------------- */
    //     const D = new MultiArray([n, n]);
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             D.array[i][j] = (i === j)
    //                 ? A.array[i][i]
    //                 : Complex.zero();
    //         }
    //     }

    //     return { D, Z };
    // }

    public static readonly numeric_jacobi_hermitian_direct_03 = (
        // TODO
        D: ComplexType[],
        E: ComplexType[],
        maxSweeps: number = 1000,
        tol: number = 1e-12,
    ): {
        D_work: ComplexType[];
        Z: MultiArray;
    } => {
        const n = D.length;

        // Constrói T densa
        const T = new MultiArray([n, n], Complex.zero());
        for (let i = 0; i < n; i++) {
            T.array[i][i] = D[i];
            if (i < n - 1) {
                T.array[i][i + 1] = E[i];
                T.array[i + 1][i] = Complex.conj(E[i]);
            }
        }

        const { A, Z } = LAPACKunused.jacobi_hermitian_dense(T, tol, maxSweeps);

        const D_work: ComplexType[] = new Array(n);
        for (let i = 0; i < n; i++) {
            D_work[i] = A.array[i][i] as ComplexType;
        }

        return { D_work, Z };
    };

    /**
     * Rotação de Jacobi para um bloco hermitiano 2×2
     *
     * [ a   b ]
     * [ b*  d ]
     */
    public static readonly jacobiHermitian2x2 = (a: number, d: number, b: ComplexType, tol: number = 1e-14): Jacobi2x2Result => {
        // TODO
        const absb = Complex.abs(b);
        // Caso trivial
        if (Complex.realToNumber(absb) < tol) {
            return {
                c: 1,
                s: Complex.zero(),
            };
        }
        // Fase de b
        const phase = Complex.rdiv(b, absb); // e^{iφ}
        // Jacobi real
        const tau = (d - a) / (2 * Complex.realToNumber(absb));
        const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
        const c = 1 / Math.sqrt(1 + t * t);
        const sReal = t * c;
        // s complexo: s = sReal * conj(phase)
        const s = Complex.mul(Complex.create(sReal), Complex.conj(phase));
        return { c, s };
    };

    public static readonly jacobi_hermitian_rotation = (T: MultiArray, Z: MultiArray, p: number, q: number): void => {
        // TODO
        const n = T.dimension[0];
        const Tpp = T.array[p][p] as ComplexType;
        const Tqq = T.array[q][q] as ComplexType;
        const Tpq = T.array[p][q] as ComplexType;
        if (Complex.abs(Tpq).re === 0) return;
        // --- Fase para tornar Tpq real ---
        const phi = Complex.arg(Tpq);
        const expMinusIphi = Complex.exp(Complex.create(0, -phi));
        // Aplica fase em linhas/colunas q
        for (let k = 0; k < n; k++) {
            T.array[k][q] = Complex.mul(T.array[k][q] as ComplexType, expMinusIphi);
            T.array[q][k] = Complex.conj(T.array[k][q] as ComplexType);
            Z.array[k][q] = Complex.mul(Z.array[k][q] as ComplexType, expMinusIphi);
        }
        const tpqReal = Complex.realToNumber(T.array[p][q] as ComplexType);
        const delta = (Complex.realToNumber(Tqq) - Complex.realToNumber(Tpp)) / 2;
        const t = (Math.sign(delta) * tpqReal) / (Math.abs(delta) + Math.sqrt(delta * delta + tpqReal * tpqReal));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = c * t;
        // --- Aplica rotação real Jacobi ---
        for (let k = 0; k < n; k++) {
            const Tkp = T.array[k][p] as ComplexType;
            const Tkq = T.array[k][q] as ComplexType;
            T.array[k][p] = Complex.add(Complex.mul(Complex.create(c), Tkp), Complex.mul(Complex.create(s), Tkq));
            T.array[k][q] = Complex.add(Complex.mul(Complex.create(-s), Tkp), Complex.mul(Complex.create(c), Tkq));
        }
        for (let k = 0; k < n; k++) {
            const Tpk = T.array[p][k] as ComplexType;
            const Tqk = T.array[q][k] as ComplexType;
            T.array[p][k] = Complex.add(Complex.mul(Complex.create(c), Tpk), Complex.mul(Complex.create(s), Tqk));
            T.array[q][k] = Complex.add(Complex.mul(Complex.create(-s), Tpk), Complex.mul(Complex.create(c), Tqk));
        }
        // --- Atualiza Z ---
        for (let k = 0; k < n; k++) {
            const Zkp = Z.array[k][p] as ComplexType;
            const Zkq = Z.array[k][q] as ComplexType;
            Z.array[k][p] = Complex.add(Complex.mul(Complex.create(c), Zkp), Complex.mul(Complex.create(s), Zkq));
            Z.array[k][q] = Complex.add(Complex.mul(Complex.create(-s), Zkp), Complex.mul(Complex.create(c), Zkq));
        }
    };

    public static readonly jacobi_rotate_hermitian = (A: MultiArray, Z: MultiArray, p: number, q: number): void => {
        // TODO
        const App = A.array[p][p] as ComplexType;
        const Aqq = A.array[q][q] as ComplexType;
        const Apq = A.array[p][q] as ComplexType;
        const a = Complex.realToNumber(App);
        const d = Complex.realToNumber(Aqq);
        const absb = Complex.realToNumber(Complex.abs(Apq));
        if (absb === 0) return;
        const delta = d - a;
        const t = delta === 0 ? 1 : (Math.sign(delta) * absb) / (Math.abs(delta) + Math.sqrt(delta * delta + 4 * absb * absb));
        const c = 1 / Math.sqrt(1 + t * t);
        const s_mag = c * t;
        // fase = b / |b|
        const phase = Complex.rdiv(Apq, Complex.create(absb));
        const s = Complex.mul(phase, Complex.create(s_mag));
        const cC = Complex.create(c);
        const sC = s;
        const sCH = Complex.conj(s);
        const n = A.dimension[0];
        // --- Atualiza A ---
        for (let k = 0; k < n; k++) {
            if (k !== p && k !== q) {
                const Akp = A.array[k][p] as ComplexType;
                const Akq = A.array[k][q] as ComplexType;
                const newAkp = Complex.add(Complex.mul(cC, Akp), Complex.mul(sC, Akq));
                const newAkq = Complex.sub(Complex.mul(cC, Akq), Complex.mul(sCH, Akp));
                A.array[k][p] = newAkp;
                A.array[p][k] = Complex.conj(newAkp);
                A.array[k][q] = newAkq;
                A.array[q][k] = Complex.conj(newAkq);
            }
        }
        const disc = Math.sqrt(delta * delta + 4 * absb * absb);
        A.array[p][p] = Complex.create(0.5 * (a + d - disc));
        A.array[q][q] = Complex.create(0.5 * (a + d + disc));
        A.array[p][q] = Complex.zero();
        A.array[q][p] = Complex.zero();
        // --- Atualiza Z ---
        for (let k = 0; k < n; k++) {
            const Zkp = Z.array[k][p] as ComplexType;
            const Zkq = Z.array[k][q] as ComplexType;
            Z.array[k][p] = Complex.add(Complex.mul(cC, Zkp), Complex.mul(sC, Zkq));
            Z.array[k][q] = Complex.sub(Complex.mul(cC, Zkq), Complex.mul(sCH, Zkp));
        }
    };

    // public static readonly jacobi_rotate_hermitian = (
    //     A: MultiArray,
    //     p: number,
    //     q: number
    // ): void => {
    //     if (p === q) return;

    //     const App = A.array[p][p] as ComplexType;
    //     const Aqq = A.array[q][q] as ComplexType;
    //     const Apq = A.array[p][q] as ComplexType;

    //     const alpha = Complex.abs(Apq);
    //     if (Complex.realIsZero(alpha)) return;

    //     // phase of Apq
    //     const phi = Math.atan2(Apq.im, Apq.re);

    //     // real scalar
    //     const delta = Aqq.re - App.re;
    //     const theta = 0.5 * Math.atan2(2 * alpha, delta);

    //     const c = Math.cos(theta);
    //     const sAbs = Math.sin(theta);

    //     // s = e^{iφ} sinθ
    //     const s = Complex.fromPolar(sAbs, phi);
    //     const sConj = Complex.conj(s);

    //     const n = A.length;

    //     // update rows/columns p and q
    //     for (let k = 0; k < n; k++) {
    //         if (k === p || k === q) continue;

    //         const Akp = A[k][p];
    //         const Akq = A[k][q];

    //         const newAkp = Complex.sub(
    //             Complex.mul(c, Akp),
    //             Complex.mul(s, Akq)
    //         );

    //         const newAkq = Complex.add(
    //             Complex.mul(sConj, Akp),
    //             Complex.mul(c, Akq)
    //         );

    //         A[k][p] = newAkp;
    //         A[p][k] = Complex.conj(newAkp);

    //         A[k][q] = newAkq;
    //         A[q][k] = Complex.conj(newAkq);
    //     }

    //     // diagonal updates (purely real)
    //     const t = sAbs * alpha;

    //     A[p][p] = new Complex(
    //         App.re * c * c + Aqq.re * sAbs * sAbs - 2 * t,
    //         0
    //     );

    //     A[q][q] = new Complex(
    //         App.re * sAbs * sAbs + Aqq.re * c * c + 2 * t,
    //         0
    //     );

    //     // annihilate off-diagonal
    //     A[p][q] = Complex.zero();
    //     A[q][p] = Complex.zero();
    // }

    /**
     * Atualiza a matriz acumuladora Z no estilo LAPACK:
     *
     *      Z ← Z · G
     *
     * onde G é a rotação de Givens complexa no plano (k, k+1):
     *
     *      [  c      s  ]
     *      [ -s*     c  ]
     *
     * c é real, s é complexo.
     */
    public static readonly apply_givens_right_Z = (Z: ComplexType[][], k: number, c: ComplexType, s: ComplexType): void => {
        // TODO
        const n = Z.length;
        const s_conj = Complex.conj(s);
        for (let i = 0; i < n; i++) {
            const zik = Z[i][k];
            const zik1 = Z[i][k + 1];
            Z[i][k] = Complex.sub(Complex.mul(zik, c), Complex.mul(s_conj, zik1));
            Z[i][k + 1] = Complex.add(Complex.mul(s, zik), Complex.mul(zik1, c));
        }
    };

    public static readonly apply_givens_left_tridiagonal = (D: ComplexType[], E: ComplexType[], k: number, c: ComplexType, s: ComplexType): void => {
        // TODO
        const dk = D[k];
        const dk1 = D[k + 1];
        const ek = E[k];
        // new D(k)
        D[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, dk)), Complex.mul(Complex.conj(s), Complex.mul(s, dk1)));
        // new D(k+1)
        D[k + 1] = Complex.add(Complex.mul(Complex.conj(s), Complex.mul(s, dk)), Complex.mul(Complex.conj(c), Complex.mul(c, dk1)));
        // new E(k)
        E[k] = Complex.mul(Complex.conj(c), Complex.sub(Complex.mul(c, ek), Complex.mul(s, dk1)));
    };

    public static readonly apply_givens_tridiagonal_hermitian = (D: ComplexType[], E: ComplexType[], k: number, c: ComplexType, s: ComplexType): void => {
        // TODO
        // Elementos locais
        const d_k = D[k];
        const d_k1 = D[k + 1];
        const e_k = E[k];
        // -------------------------------------------------
        // Atualiza o bloco 2×2:
        // -------------------------------------------------
        // T'11
        const t11 = Complex.add(
            Complex.mul(c, Complex.mul(c, d_k)),
            Complex.add(
                Complex.mul(s, Complex.mul(Complex.conj(s), d_k1)),
                Complex.sub(Complex.mul(c, Complex.mul(e_k, s)), Complex.mul(Complex.conj(s), Complex.mul(Complex.conj(e_k), c))),
            ),
        );
        // T'22
        const t22 = Complex.add(
            Complex.mul(Complex.conj(s), Complex.mul(s, d_k)),
            Complex.add(Complex.mul(c, Complex.mul(c, d_k1)), Complex.sub(Complex.mul(Complex.conj(s), Complex.mul(e_k, c)), Complex.mul(c, Complex.mul(Complex.conj(e_k), s)))),
        );
        // T'12 (nova subdiagonal)
        const t12 = Complex.add(Complex.mul(c, Complex.mul(e_k, c)), Complex.sub(Complex.mul(c, Complex.mul(d_k1, s)), Complex.mul(Complex.conj(s), Complex.mul(d_k, c))));
        D[k] = t11;
        D[k + 1] = t22;
        E[k] = t12;
    };

    public static readonly apply_givens_right_tridiagonal = (D: ComplexType[], E: ComplexType[], k: number, c: ComplexType, s: ComplexType): void => {
        // TODO
        if (k === 0) return;
        const ekm1 = E[k - 1];
        E[k - 1] = Complex.add(Complex.mul(ekm1, c), Complex.mul(s, D[k]));
    };

    public static readonly compute_complex_givens = (x: ComplexType, z: ComplexType): { c: ComplexType; s: ComplexType; r: ComplexType } => {
        // TODO
        if (Complex.realEquals(Complex.abs(z), 0)) {
            return {
                c: Complex.one(),
                s: Complex.zero(),
                r: x,
            };
        }
        const absx = Complex.abs(x);
        const absz = Complex.abs(z);
        const r = Complex.sqrt(Complex.add(Complex.mul(absx, absx), Complex.mul(absz, absz)));
        const c = Complex.rdiv(x, r);
        const s = Complex.rdiv(z, r);
        return { c, s, r };
    };

    public static readonly complexGivens = (x: ComplexType, y: ComplexType): { c: ComplexType; s: ComplexType; r: ComplexType } => {
        // TODO
        if (Complex.eq(y, Complex.zero())) {
            return {
                c: Complex.one(),
                s: Complex.zero(),
                r: x,
            };
        }

        const absx = Complex.abs(x);
        const absy = Complex.abs(y);

        const r = Complex.sqrt(Complex.add(Complex.mul(absx, absx), Complex.mul(absy, absy)));

        const c = Complex.rdiv(x, r);
        const s = Complex.rdiv(y, r);

        return { c, s, r };
    };

    public static readonly applyGivensToZ = (Z: MultiArray, k: number, c: ComplexType, s: ComplexType): void => {
        const n = Z.dimension[0];

        const cconj = Complex.conj(c);
        const sconj = Complex.conj(s);

        for (let i = 0; i < n; i++) {
            const zik = Z.array[i][k] as ComplexType;
            const zik1 = Z.array[i][k + 1] as ComplexType;

            Z.array[i][k] = Complex.sub(Complex.mul(zik, c), Complex.mul(zik1, sconj));

            Z.array[i][k + 1] = Complex.add(Complex.mul(zik, s), Complex.mul(zik1, cconj));
        }
    };

    public static readonly applyGivensTridiagonal = (D: ComplexType[], E: ComplexType[], k: number, c: ComplexType, s: ComplexType): void => {
        const cconj = Complex.conj(c);
        const sconj = Complex.conj(s);

        const Dk = D[k];
        const Dk1 = D[k + 1];

        const Ek = E[k];
        const Ek1 = k + 1 < E.length ? E[k + 1] : Complex.zero();

        // --- Atualiza bloco 2x2 ---
        D[k] = Complex.add(
            Complex.mul(cconj, Complex.mul(c, Dk)),
            Complex.add(Complex.mul(cconj, Complex.mul(s, Ek)), Complex.add(Complex.mul(sconj, Complex.mul(c, Complex.conj(Ek))), Complex.mul(sconj, Complex.mul(s, Dk1)))),
        );

        D[k + 1] = Complex.add(
            Complex.mul(sconj, Complex.mul(s, Dk)),
            Complex.add(Complex.mul(sconj, Complex.mul(c, Ek)), Complex.add(Complex.mul(cconj, Complex.mul(s, Complex.conj(Ek))), Complex.mul(cconj, Complex.mul(c, Dk1)))),
        );

        // --- Atualiza subdiagonal E[k] ---
        E[k] = Complex.add(Complex.mul(cconj, Complex.mul(c, Ek)), Complex.sub(Complex.mul(sconj, Complex.mul(c, Dk1)), Complex.mul(cconj, Complex.mul(s, Dk))));

        // --- Atualiza E[k+1] (bulge chasing) ---
        if (k + 1 < E.length) {
            E[k + 1] = Complex.add(Complex.mul(c, Ek1), Complex.mul(s, Complex.sub(Dk1, Dk)));
        }
    };

    public static readonly complex_gram_schmidt = (Z: MultiArray): void => {
        const n = Z.dimension[0];

        for (let j = 0; j < n; j++) {
            // Subtrai projeções anteriores
            for (let k = 0; k < j; k++) {
                let dot = Complex.zero();
                for (let i = 0; i < n; i++) {
                    dot = Complex.add(dot, Complex.mul(Complex.conj(Z.array[i][k] as ComplexType), Z.array[i][j] as ComplexType));
                }
                for (let i = 0; i < n; i++) {
                    Z.array[i][j] = Complex.sub(Z.array[i][j] as ComplexType, Complex.mul(dot, Z.array[i][k] as ComplexType));
                }
            }

            // Normaliza
            let norm2 = Complex.zero();
            for (let i = 0; i < n; i++) {
                norm2 = Complex.add(norm2, Complex.abs2(Z.array[i][j] as ComplexType));
            }
            const norm = Complex.sqrt(norm2);
            for (let i = 0; i < n; i++) {
                Z.array[i][j] = Complex.rdiv(Z.array[i][j] as ComplexType, norm);
            }
        }
    };

    public static readonly implicitQRStepTridiagonalHermitian = (D: ComplexType[], E: ComplexType[], l: number, m: number, Z?: ComplexType[][]): void => {
        /*
         * PASSO DE QR IMPLÍCITO (PLACEHOLDER)
         *
         * Este método representa UM passo do QR implícito
         * aplicado ao bloco tridiagonal D[l..m], E[l..m-1].
         *
         * Por enquanto, não faz nada.
         * Ele será preenchido quando implementarmos:
         *  - shift de Wilkinson
         *  - rotações de Givens
         *  - chasing the bulge
         */
        return;
    };

    // public static readonly numeric_qrstep_tridiagonal_hermitian = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     l: number,
    //     m: number,
    //     Z?: ComplexType[][]
    // ) => {

    //     // --------------------------------------------------
    //     // Wilkinson shift (2×2 trailing block)
    //     // --------------------------------------------------
    //     const dm1 = D[m];
    //     const d0 = D[m + 1];
    //     const em = E[m];

    //     // delta = (dm1 - d0)/2   (real for Hermitian)
    //     const delta = Complex.mul(
    //         Complex.sub(dm1, d0),
    //         Complex.create(0.5)
    //     );

    //     const abs_delta = Complex.abs(delta);
    //     const abs_em2 = Complex.mul(Complex.abs(em), Complex.abs(em));

    //     const sign = Complex.realGreaterThanOrEqualTo(delta, 0)
    //         ? Complex.one()
    //         : Complex.minusone();

    //     const mu = Complex.sub(
    //         d0,
    //         Complex.rdiv(
    //             Complex.mul(sign, abs_em2),
    //             Complex.add(
    //                 abs_delta,
    //                 Complex.sqrt(Complex.add(
    //                     Complex.mul(abs_delta, abs_delta),
    //                     abs_em2
    //                 ))
    //             )
    //         )
    //     );

    //     // --------------------------------------------------
    //     // Initial x, z (creates the bulge)
    //     // --------------------------------------------------
    //     let x = Complex.sub(D[l], mu);
    //     let z = E[l];

    //     // --------------------------------------------------
    //     // Bulge chasing
    //     // --------------------------------------------------
    //     for (let k = l; k <= m; k++) {

    //         // r = sqrt(x² + |z|²)
    //         const r = Complex.sqrt(
    //             Complex.add(
    //                 Complex.mul(x, x),
    //                 Complex.mul(Complex.abs(z), Complex.abs(z))
    //             )
    //         );

    //         if (Complex.realEquals(r, 0)) continue;

    //         // Givens rotation
    //         // c real, s complex
    //         const c = Complex.rdiv(x, r);
    //         const s = Complex.rdiv(z, r);

    //         // --------------------------------------------------
    //         // Apply rotation to rows/cols k,k+1 (tridiagonal!)
    //         // --------------------------------------------------
    //         const dk = D[k];
    //         const dk1 = D[k + 1];
    //         const ek = E[k];

    //         // Update diagonal
    //         D[k] = Complex.add(
    //             Complex.mul(c, Complex.mul(c, dk)),
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk1))
    //         );

    //         D[k + 1] = Complex.add(
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk)),
    //             Complex.mul(c, Complex.mul(c, dk1))
    //         );

    //         // Update off-diagonal
    //         E[k] = Complex.mul(c, ek);

    //         if (k > l) {
    //             E[k - 1] = Complex.mul(Complex.conj(c), E[k - 1]);
    //         }

    //         // Prepare next bulge
    //         if (k < m) {
    //             x = E[k];
    //             z = Complex.neg(
    //                 Complex.mul(s, E[k + 1])
    //             );
    //         }

    //         // --------------------------------------------------
    //         // Accumulate eigenvectors
    //         // --------------------------------------------------
    //         if (Z) {
    //             for (let i = 0; i < Z.length; i++) {
    //                 const zik = Z[i][k];
    //                 const zik1 = Z[i][k + 1];

    //                 Z[i][k] = Complex.sub(
    //                     Complex.mul(c, zik),
    //                     Complex.mul(s, zik1)
    //                 );

    //                 Z[i][k + 1] = Complex.add(
    //                     Complex.mul(Complex.conj(s), zik),
    //                     Complex.mul(c, zik1)
    //                 );
    //             }
    //         }
    //     }
    // };

    /**
     * One implicit-shift QR sweep on a Hermitian tridiagonal block [l..m+1].
     * Literal extraction from steqr_vectors_tridiagonal (no changes).
     */
    // public static readonly numeric_qrstep_tridiagonal_hermitian = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     l: number,
    //     m: number,
    //     Z?: ComplexType[][]
    // ): void => {

    //     // -----------------------------------------------------
    //     // Wilkinson shift (2×2 trailing block)
    //     // -----------------------------------------------------
    //     const d_mm1 = D[m];
    //     const d_m = D[m + 1];
    //     const e_m = E[m];

    //     const delta = Complex.mul(
    //         Complex.sub(d_mm1, d_m),
    //         Complex.create(0.5)
    //     );

    //     const abs_delta = Complex.abs(delta);
    //     const abs_em2 = Complex.power(Complex.abs(e_m), Complex.two());

    //     const denom = Complex.add(
    //         abs_delta,
    //         Complex.sqrt(
    //             Complex.add(
    //                 Complex.mul(abs_delta, abs_delta),
    //                 abs_em2
    //             )
    //         )
    //     );

    //     const sign = Complex.realGreaterThanOrEqualTo(delta, 0)
    //         ? Complex.one()
    //         : Complex.minusone();

    //     const mu = Complex.sub(
    //         d_m,
    //         Complex.rdiv(
    //             Complex.mul(sign, abs_em2),
    //             denom
    //         )
    //     );

    //     // -----------------------------------------------------
    //     // Implicit QR sweep (Givens rotations)
    //     // -----------------------------------------------------
    //     let x = Complex.sub(D[l], mu);
    //     let z = E[l];

    //     for (let k = l; k <= m; k++) {

    //         const r = Complex.sqrt(
    //             Complex.add(
    //                 Complex.power(Complex.abs(x), Complex.two()),
    //                 Complex.power(Complex.abs(z), Complex.two())
    //             )
    //         );

    //         if (Complex.realEquals(r, 0)) continue;

    //         const c = Complex.rdiv(x, r);
    //         const s = Complex.rdiv(z, r);

    //         const dk = D[k];
    //         const dk1 = D[k + 1];

    //         D[k] = Complex.add(
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk)),
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk1))
    //         );

    //         D[k + 1] = Complex.add(
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk)),
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk1))
    //         );

    //         E[k] = Complex.zero();

    //         if (k < m) {
    //             x = E[k];
    //             z = E[k + 1];
    //         }

    //         if (Z) {
    //             for (let i = 0; i < Z.length; i++) {
    //                 const zik = Z[i][k];
    //                 const zik1 = Z[i][k + 1];

    //                 Z[i][k] = Complex.sub(
    //                     Complex.mul(c, zik),
    //                     Complex.mul(s, zik1)
    //                 );

    //                 Z[i][k + 1] = Complex.add(
    //                     Complex.mul(Complex.conj(s), zik),
    //                     Complex.mul(c, zik1)
    //                 );
    //             }
    //         }
    //     }
    // };

    // public static readonly numeric_qr_sweep_tridiagonal_hermitian = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     l: number,
    //     m: number,
    //     Z?: ComplexType[][]
    // ): void => {

    //     // -------------------------------------------------
    //     // Wilkinson shift from trailing 2×2 block
    //     // -------------------------------------------------
    //     const d1 = D[m];
    //     const d2 = D[m + 1];
    //     const e = E[m];

    //     // delta = (d1 - d2) / 2
    //     const delta = Complex.mul(
    //         Complex.sub(d1, d2),
    //         Complex.create(0.5)
    //     );

    //     const abs_delta = Complex.abs(delta);
    //     const abs_e2 = Complex.mul(Complex.abs(e), Complex.abs(e));

    //     const sign = Complex.realGreaterThanOrEqualTo(delta, 0)
    //         ? Complex.one()
    //         : Complex.minusone();

    //     const mu = Complex.sub(
    //         d2,
    //         Complex.rdiv(
    //             Complex.mul(sign, abs_e2),
    //             Complex.add(
    //                 abs_delta,
    //                 Complex.sqrt(
    //                     Complex.add(
    //                         Complex.mul(abs_delta, abs_delta),
    //                         abs_e2
    //                     )
    //                 )
    //             )
    //         )
    //     );

    //     // -------------------------------------------------
    //     // Initial x, z (bulge)
    //     // -------------------------------------------------
    //     let x = Complex.sub(D[l], mu);
    //     let z = E[l];

    //     // -------------------------------------------------
    //     // Chase the bulge
    //     // -------------------------------------------------
    //     for (let k = l; k <= m; k++) {

    //         // Compute Givens rotation
    //         const r = Complex.sqrt(
    //             Complex.add(
    //                 Complex.mul(Complex.abs(x), Complex.abs(x)),
    //                 Complex.mul(Complex.abs(z), Complex.abs(z))
    //             )
    //         );

    //         if (Complex.realEquals(r, 0)) continue;

    //         const c = Complex.rdiv(x, r);
    //         const s = Complex.rdiv(z, r);

    //         // -------------------------------------------------
    //         // Apply rotation to rows/columns k, k+1
    //         // -------------------------------------------------
    //         const dk = D[k];
    //         const dk1 = D[k + 1];
    //         const ek = E[k];

    //         // Update D[k], D[k+1]
    //         D[k] = Complex.add(
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk)),
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk1))
    //         );

    //         D[k + 1] = Complex.add(
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk)),
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk1))
    //         );

    //         // Update E[k]
    //         E[k] = Complex.mul(
    //             Complex.conj(c),
    //             Complex.mul(s, Complex.sub(dk1, dk))
    //         );

    //         // Propagate bulge
    //         if (k < m) {
    //             x = E[k];
    //             z = E[k + 1];
    //         }

    //         // -------------------------------------------------
    //         // Accumulate eigenvectors
    //         // -------------------------------------------------
    //         if (Z) {
    //             for (let i = 0; i < Z.length; i++) {
    //                 const zik = Z[i][k];
    //                 const zik1 = Z[i][k + 1];

    //                 Z[i][k] = Complex.sub(
    //                     Complex.mul(c, zik),
    //                     Complex.mul(s, zik1)
    //                 );

    //                 Z[i][k + 1] = Complex.add(
    //                     Complex.mul(Complex.conj(s), zik),
    //                     Complex.mul(c, zik1)
    //                 );
    //             }
    //         }
    //     }
    // };

    // public static readonly numeric_qr_sweep_tridiagonal_hermitian = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     ilo: number,
    //     ihi: number,
    //     Z?: MultiArray
    // ): void => {

    //     for (let k = ilo; k <= ihi; k++) {

    //         const { c, s } = LAPACK.compute_complex_givens(
    //             D[k],
    //             E[k]
    //         );

    //         LAPACK.apply_givens_tridiagonal_hermitian(
    //             D,
    //             E,
    //             k,
    //             c,
    //             s
    //         );

    //         if (Z !== undefined) {
    //             LAPACK.apply_givens_right_Z(Z.array as ComplexType[][], k, c, s);
    //         }
    //     }
    // };

    // public static readonly numeric_qr_sweep_tridiagonal_hermitian = (
    //     D: ComplexType[],
    //     E: ComplexType[],
    //     l: number,
    //     m: number,
    //     Z?: ComplexType[][]
    // ): void => {

    //     // -------------------------------------------------
    //     // Wilkinson shift
    //     // -------------------------------------------------
    //     const d_mm1 = D[m];
    //     const d_m = D[m + 1];
    //     const e_m = E[m];

    //     const delta = Complex.mul(
    //         Complex.sub(d_mm1, d_m),
    //         Complex.create(0.5)
    //     );

    //     const abs_delta = Complex.abs(delta);
    //     const abs_em2 = Complex.mul(Complex.abs(e_m), Complex.abs(e_m));

    //     const sign = Complex.realGreaterThanOrEqualTo(delta, 0)
    //         ? Complex.one()
    //         : Complex.minusone();

    //     const mu = Complex.sub(
    //         d_m,
    //         Complex.rdiv(
    //             Complex.mul(sign, abs_em2),
    //             Complex.add(
    //                 abs_delta,
    //                 Complex.sqrt(
    //                     Complex.add(
    //                         Complex.mul(abs_delta, abs_delta),
    //                         abs_em2
    //                     )
    //                 )
    //             )
    //         )
    //     );

    //     // -------------------------------------------------
    //     // Start bulge
    //     // -------------------------------------------------
    //     let x = Complex.sub(D[l], mu);
    //     let z = E[l];

    //     for (let k = l; k <= m; k++) {

    //         // --- Givens to eliminate z ---
    //         const { c, s, r } =
    //             LAPACK.compute_complex_givens(x, z);

    //         if (k > l) {
    //             E[k - 1] = r;
    //         }

    //         // --- Left rotation ---
    //         const dk = D[k];
    //         const ek = E[k];
    //         const dk1 = D[k + 1];

    //         const t11 = Complex.add(
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk)),
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk1))
    //         );

    //         const t22 = Complex.add(
    //             Complex.mul(Complex.conj(s), Complex.mul(s, dk)),
    //             Complex.mul(Complex.conj(c), Complex.mul(c, dk1))
    //         );

    //         const t12 = Complex.mul(
    //             Complex.conj(c),
    //             Complex.sub(
    //                 Complex.mul(c, ek),
    //                 Complex.mul(s, dk1)
    //             )
    //         );

    //         D[k] = t11;
    //         D[k + 1] = t22;
    //         E[k] = t12;

    //         // --- Prepare next bulge ---
    //         if (k < m) {
    //             x = E[k];
    //             z = Complex.neg(
    //                 Complex.mul(s, E[k + 1])
    //             );
    //             E[k + 1] = Complex.mul(c, E[k + 1]);
    //         }

    //         // --- Accumulate eigenvectors ---
    //         if (Z) {
    //             LAPACK.apply_givens_right_Z(Z, k, c, s);
    //         }
    //     }
    // };

    public static readonly numeric_qr_sweep_tridiagonal_hermitian = (D: ComplexType[], E: ComplexType[], l: number, m: number, Z?: ComplexType[][]): void => {
        // --- Wilkinson shift ---
        const delta = Complex.mul(Complex.sub(D[m], D[m + 1]), Complex.create(0.5));

        const abs_delta = Complex.abs(delta);
        const abs_em2 = Complex.mul(Complex.abs(E[m]), Complex.abs(E[m]));

        const sign = Complex.realGreaterThanOrEqualTo(delta, 0) ? Complex.one() : Complex.minusone();

        const mu = Complex.sub(D[m + 1], Complex.rdiv(Complex.mul(sign, abs_em2), Complex.add(abs_delta, Complex.sqrt(Complex.add(Complex.mul(abs_delta, abs_delta), abs_em2)))));

        let x = Complex.sub(D[l], mu);
        let z = E[l];

        for (let k = l; k <= m; k++) {
            const { c, s, r } = LAPACKunused.compute_complex_givens(x, z);

            if (k > l) E[k - 1] = r;

            LAPACKunused.apply_givens_left_tridiagonal(D, E, k, c, s);
            LAPACKunused.apply_givens_right_tridiagonal(D, E, k, c, s);

            if (Z) {
                LAPACKunused.apply_givens_right_Z(Z, k, c, s);
            }

            if (k < m) {
                x = E[k];
                z = Complex.neg(Complex.mul(s, E[k + 1]));
                E[k + 1] = Complex.mul(c, E[k + 1]);
            }
        }
    };

    public static readonly numeric_qr_bulge_chasing_hermitian_1 = (D: ComplexType[], E: ComplexType[], maxIts: number = 1000): { D: ComplexType[]; V: ComplexType[][] } => {
        const n = D.length;

        if (n === 0) return { D: [], V: [] };
        if (n === 1) return { D: [Complex.copy(D[0])], V: [[Complex.one()]] };

        // --- Working copies ---
        const Dwork = D.map(Complex.copy);
        const Ework = E.map(Complex.copy);

        // --- Accumulate eigenvectors ---
        const Z: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Complex.one() : Complex.zero())));

        // --- Original tridiagonal (para teste de similaridade) ---
        const T0_array = LAPACK.tridiagonal_hermitian_to_dense(Dwork, Ework);
        const T0 = new MultiArray([n, n]);
        T0.array = T0_array;

        // --- Norma Frobenius ---
        const frobeniusNorm = (M: MultiArray): number => {
            let sum = Complex.zero();
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const el = M.array[i][j] as ComplexType;
                    sum = Complex.add(sum, Complex.mul(el, Complex.conj(el)));
                }
            }
            return Math.sqrt(Complex.realToNumber(sum));
        };

        // --- Função de similaridade ---
        const check_similarity = () => {
            const Zm = new MultiArray([Z.length, Z[0].length]);
            Zm.array = Z;
            const Zh = LinearAlgebra.ctranspose(Zm);
            const Zx = new MultiArray([n, n]);
            Zx.array = LAPACK.tridiagonal_hermitian_to_dense(Dwork, Ework);
            const Tsim = MathOperation.mtimes(MathOperation.mtimes(Zh, Zx), Zm) as MultiArray;
            const Tcurrent = new MultiArray([n, n]);
            Tcurrent.array = LAPACK.tridiagonal_hermitian_to_dense(Dwork, Ework);
            const diff = MathOperation.minus(Tcurrent, Tsim) as MultiArray;
            console.log('||T - Zᴴ·T0·Z|| ≈', frobeniusNorm(diff));
        };

        const eps = Number.EPSILON || 2.220446049250313e-16;
        let iter = 0;

        while (iter < maxIts) {
            // --- Step 1: find unreduced block [l..m]
            let l = 0;
            while (l < n - 1 && Complex.realLessThanOrEqualTo(Complex.abs(Ework[l]), eps)) l++;
            if (l >= n - 1) break;

            let m = l;
            while (m < n - 1 && Complex.realGreaterThan(Complex.abs(Ework[m]), eps)) m++;

            // --- Step 2: Wilkinson shift ---
            const d_mm1 = Dwork[m - 1];
            const d_m = Dwork[m];
            const e_m = Ework[m - 1];

            const delta = Complex.mul(Complex.sub(d_mm1, d_m), Complex.create(0.5));
            const abs_delta = Complex.abs(delta);
            const abs_em2 = Complex.power(Complex.abs(e_m), Complex.create(2));
            const denom = Complex.add(abs_delta, Complex.sqrt(Complex.add(Complex.mul(abs_delta, abs_delta), abs_em2)));
            const sign = Complex.realGreaterThanOrEqualTo(delta, 0) ? Complex.one() : Complex.minusone();
            const mu = Complex.sub(d_m, Complex.rdiv(Complex.mul(sign, abs_em2), denom));

            // --- Step 3: Bulge chasing sweep ---
            let x = Complex.sub(Dwork[l], mu);
            let z = Ework[l];

            for (let k = l; k < m; k++) {
                // Givens rotation
                const r = Complex.sqrt(Complex.add(Complex.mul(x, Complex.conj(x)), Complex.mul(z, Complex.conj(z))));
                if (Complex.realIsZero(r)) continue;
                const c = Complex.rdiv(x, r);
                const s = Complex.rdiv(z, r);

                // Update Dwork
                const dk = Dwork[k];
                const dk1 = Dwork[k + 1];
                Dwork[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, dk)), Complex.mul(Complex.conj(s), Complex.mul(s, dk1)));
                Dwork[k + 1] = Complex.add(Complex.mul(Complex.conj(s), Complex.mul(s, dk)), Complex.mul(Complex.conj(c), Complex.mul(c, dk1)));
                Ework[k] = Complex.zero();

                // Update x, z for next iteration
                if (k < m - 1) {
                    x = Ework[k + 1];
                    z = Ework[k + 2] || Complex.zero();
                }

                // Update eigenvectors Z
                LAPACKunused.apply_givens_right_Z(Z, k, c, s);

                // --- Similaridade ---
                check_similarity();
            }

            iter++;
        }

        return { D: Dwork, V: Z };
    };

    public static readonly numeric_qr_bulge_chasing_hermitian = (D: ComplexType[], E: ComplexType[], maxSweeps: number = 1000): ComplexType[][] => {
        const n = D.length;

        // --- Inicializa Z como matriz identidade ---
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        const eps = Number.EPSILON || 2.220446049250313e-16;

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let converged = true;

            // Varre subdiagonal
            for (let k = 0; k < n - 1; k++) {
                // Verifica se E[k] é pequeno suficiente para deflação
                if (Complex.realIsZero(Complex.real(E[k])) && Complex.realIsZero(Complex.imag(E[k]))) {
                    continue;
                }
                converged = false;

                // --- Calcula rotação Givens ---
                // zeta = sqrt(|D[k]|^2 + |E[k]|^2)
                const r = Complex.sqrt(Complex.add(Complex.power(Complex.abs(D[k]), Complex.create(2)), Complex.power(Complex.abs(E[k]), Complex.create(2))));

                const c = Complex.rdiv(D[k], r); // c = D[k] / r
                const s = Complex.rdiv(E[k], r); // s = E[k] / r

                // --- Atualiza D e E localmente ---
                const Dk = D[k];
                const Dk1 = D[k + 1];

                // Aplicação do sweep de QR em D e E
                D[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, Dk)), Complex.mul(Complex.conj(s), Complex.mul(s, Dk1)));
                D[k + 1] = Complex.add(Complex.mul(s, Dk), Complex.mul(c, Dk1));

                // Zera E[k] (aproximação)
                E[k] = Complex.zero();

                // --- Atualiza Z ---
                const s_conj = Complex.conj(s);
                for (let i = 0; i < n; i++) {
                    const zik = Z.array[i][k] as ComplexType;
                    const zik1 = Z.array[i][k + 1] as ComplexType;

                    const new_zik = Complex.sub(Complex.mul(zik, c), Complex.mul(s_conj, zik1));
                    const new_zik1 = Complex.add(Complex.mul(s, zik), Complex.mul(c, zik1));

                    Z.array[i][k] = new_zik;
                    Z.array[i][k + 1] = new_zik1;
                }
            }

            // Se todos os E[k] estão ~0, convergiu
            if (converged) break;
        }

        return Z.array as ComplexType[][];
    };

    public static readonly numeric_steqr_tridiagonal_bulge = (D: ComplexType[], E: ComplexType[], maxIts: number = 1000): { D: ComplexType[]; V: ComplexType[][] } => {
        const n = D.length;

        if (n === 0) return { D: [], V: [] };
        if (n === 1) return { D: [Complex.copy(D[0])], V: [[Complex.one()]] };

        // --- Working copies ---
        const Dwork = D.map(Complex.copy);
        const Ework = E.map(Complex.copy);

        // --- Initialize eigenvector matrix ---
        const Z: ComplexType[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? Complex.one() : Complex.zero())));

        const eps = Number.EPSILON || 2.220446049250313e-16;
        let iter = 0;

        while (iter < maxIts) {
            // --- Step 1: Find unreduced block [l..m] ---
            let l = 0;
            while (l < n - 1 && Complex.realLessThanOrEqualTo(Complex.abs(Ework[l]), eps)) l++;
            if (l >= n - 1) break;

            let m = l;
            while (m < n - 1 && Complex.realGreaterThan(Complex.abs(Ework[m]), eps)) m++;

            // --- Step 2: Wilkinson shift ---
            const d_mm1 = Dwork[m - 1];
            const d_m = Dwork[m];
            const e_m = Ework[m - 1];

            const delta = Complex.mul(Complex.sub(d_mm1, d_m), Complex.create(0.5));
            const abs_delta = Complex.abs(delta);
            const abs_em2 = Complex.power(Complex.abs(e_m), Complex.create(2));
            const denom = Complex.add(abs_delta, Complex.sqrt(Complex.add(Complex.mul(abs_delta, abs_delta), abs_em2)));
            const sign = Complex.realGreaterThanOrEqualTo(delta, 0) ? Complex.one() : Complex.minusone();
            const mu = Complex.sub(d_m, Complex.rdiv(Complex.mul(sign, abs_em2), denom));

            // --- Step 3: Bulge chasing sweep ---
            let x = Complex.sub(Dwork[l], mu);
            let z = Ework[l];

            for (let k = l; k < m; k++) {
                // Compute Givens rotation
                const r = Complex.sqrt(Complex.add(Complex.mul(x, Complex.conj(x)), Complex.mul(z, Complex.conj(z))));
                if (Complex.realIsZero(r)) continue;

                const c = Complex.rdiv(x, r);
                const s = Complex.rdiv(z, r);

                // Update diagonal and subdiagonal
                const dk = Dwork[k];
                const dk1 = Dwork[k + 1];

                Dwork[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, dk)), Complex.mul(Complex.conj(s), Complex.mul(s, dk1)));
                Dwork[k + 1] = Complex.add(Complex.mul(Complex.conj(s), Complex.mul(s, dk)), Complex.mul(Complex.conj(c), Complex.mul(c, dk1)));
                Ework[k] = Complex.zero();

                // Prepare next x, z
                if (k < m - 1) {
                    x = Ework[k + 1];
                    z = Ework[k + 2] || Complex.zero();
                }

                // Update eigenvectors Z
                LAPACKunused.apply_givens_right_Z(Z, k, c, s);
            }

            iter++;
        }

        // --- Return Dwork (diagonal) and Z (eigenvectors) ---
        return { D: Dwork, V: Z };
    };

    public static readonly numeric_qr_bulge_chasing_hermitian_refined = (D: ComplexType[], E: ComplexType[], maxSweeps: number = 1000, tol: number = 1e-12): ComplexType[][] => {
        const n = D.length;

        // --- Inicializa Z como matriz identidade ---
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let converged = true;

            // Varre subdiagonal
            for (let k = 0; k < n - 1; k++) {
                // Se E[k] é pequeno (deflação)
                if (Complex.realLessThan(Complex.real(E[k]), tol) && Complex.realLessThan(Complex.imag(E[k]), tol)) {
                    E[k] = Complex.zero(); // garante zero exato
                    continue;
                }

                converged = false;

                // --- Compute Givens rotation for D[k], E[k] ---
                const a = D[k];
                const b = E[k];

                const r = Complex.sqrt(Complex.add(Complex.mul(Complex.conj(a), a), Complex.mul(Complex.conj(b), b)));

                // Evita divisão por zero
                const c = Complex.realIsZero(Complex.real(r)) && Complex.realIsZero(Complex.imag(r)) ? Complex.one() : Complex.rdiv(a, r);
                const s = Complex.realIsZero(Complex.real(r)) && Complex.realIsZero(Complex.imag(r)) ? Complex.zero() : Complex.rdiv(b, r);

                // --- Atualiza D[k], D[k+1] ---
                const Dk = D[k];
                const Dk1 = D[k + 1];

                const c_conj = Complex.conj(c);
                const s_conj = Complex.conj(s);

                D[k] = Complex.add(Complex.mul(c_conj, Complex.mul(c, Dk)), Complex.mul(s_conj, Complex.mul(s, Dk1)));
                D[k + 1] = Complex.add(Complex.mul(s, Dk), Complex.mul(c, Dk1));

                // Zera E[k] gradualmente
                E[k] = Complex.zero();

                // --- Atualiza Z ---
                for (let i = 0; i < n; i++) {
                    const zik = Z.array[i][k] as ComplexType;
                    const zik1 = Z.array[i][k + 1] as ComplexType;

                    const new_zik = Complex.sub(Complex.mul(zik, c), Complex.mul(s_conj, zik1));
                    const new_zik1 = Complex.add(Complex.mul(s, zik), Complex.mul(c, zik1));

                    Z.array[i][k] = new_zik;
                    Z.array[i][k + 1] = new_zik1;
                }
            }

            // --- Critério de convergência ---
            let maxE = Complex.zero();
            for (let k = 0; k < n - 1; k++) {
                maxE = Complex.realGreaterThan(Complex.abs(E[k]), Complex.abs(maxE).re) ? E[k] : maxE;
            }
            if (converged || Complex.realLessThan(Complex.abs(maxE), tol)) break;
        }

        return Z.array as ComplexType[][];
    };

    public static readonly numeric_qr_hermitian_tridiagonal = (D: ComplexType[], E: ComplexType[], maxSweeps: number = 1000, tol: number = 1e-12): ComplexType[][] => {
        const n = D.length;

        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            // -----------------------------
            // Deflação global
            // -----------------------------
            let m = n - 1;
            // while (m > 0 && Complex.toBoolean(Complex.le(Complex.abs(E[m - 1]), Complex.mul(Complex.create(tol), Complex.add(Complex.abs(D[m]), Complex.abs(D[m - 1])))))) {
            while (m > 0 && Complex.realToNumber(Complex.abs(E[m - 1])) <= tol * Complex.realToNumber(Complex.add(Complex.abs(D[m]), Complex.abs(D[m - 1])))) {
                E[m - 1] = Complex.zero();
                m--;
            }
            if (m === 0) break;

            let l = m - 1;
            // while (l > 0 && Complex.toBoolean(Complex.gt(Complex.abs(E[l - 1]), Complex.mul(Complex.create(tol), Complex.add(Complex.abs(D[l]), Complex.abs(D[l - 1])))))) {
            while (l > 0 && Complex.realToNumber(Complex.abs(E[l - 1])) > tol * Complex.realToNumber(Complex.add(Complex.abs(D[l]), Complex.abs(D[l - 1])))) {
                l--;
            }

            // -----------------------------
            // Shift de Wilkinson
            // -----------------------------
            const delta = Complex.rdiv(Complex.sub(D[m - 1], D[m]), Complex.create(2));

            const em1 = Complex.abs(E[m - 1]);

            const denom = Complex.add(Complex.abs(delta), Complex.sqrt(Complex.add(Complex.mul(delta, delta), Complex.mul(em1, em1))));

            const mu = Complex.sub(D[m], Complex.rdiv(Complex.mul(Complex.sign(delta), Complex.mul(em1, em1)), denom));

            // -----------------------------
            // Introduz o bulge
            // -----------------------------
            let x = Complex.sub(D[l], mu);
            let y = E[l];

            for (let k = l; k < m; k++) {
                const { c, s } = LAPACKunused.complexGivens(x, y);

                LAPACKunused.applyGivensTridiagonal(D, E, k, c, s);
                LAPACKunused.applyGivensToZ(Z, k, c, s);

                if (k < m - 1) {
                    x = E[k];
                    y = E[k + 1];
                }
            }
        }

        return Z.array as ComplexType[][];
    };

    public static readonly qr_step_tridiagonal_hermitian = (D: ComplexType[], E: ComplexType[], Z: ComplexType[][]) => {
        const n = D.length;

        for (let k = 0; k < n - 1; k++) {
            const a = D[k];
            const b = E[k];

            if (Complex.realToNumber(Complex.abs(b)) < 1e-14) continue;

            const r = Complex.sqrt(Complex.add(Complex.mul(Complex.conj(a), a), Complex.mul(Complex.conj(b), b)));

            const c = Complex.rdiv(a, r);
            const s = Complex.rdiv(b, r);

            const cH = Complex.conj(c);
            const sH = Complex.conj(s);

            // === Aplicação à esquerda ===
            {
                const dk = D[k];
                const ek = E[k];
                const dk1 = D[k + 1];
                const ek1 = k + 1 < n - 1 ? E[k + 1] : Complex.zero();

                D[k] = Complex.add(Complex.mul(cH, dk), Complex.mul(sH, ek));

                E[k] = Complex.zero();

                D[k + 1] = Complex.sub(Complex.mul(c, dk1), Complex.mul(s, ek1));

                if (k + 1 < n - 1) E[k + 1] = Complex.mul(c, ek1);
            }

            // === Aplicação à direita ===
            {
                const dk = D[k];
                const dk1 = D[k + 1];

                D[k] = Complex.add(Complex.mul(c, dk), Complex.mul(sH, dk1));

                D[k + 1] = Complex.sub(Complex.mul(cH, dk1), Complex.mul(s, dk));
            }

            // === Acumula Z ===
            for (let i = 0; i < n; i++) {
                const zik = Z[i][k];
                const zik1 = Z[i][k + 1];

                Z[i][k] = Complex.sub(Complex.mul(zik, c), Complex.mul(zik1, sH));

                Z[i][k + 1] = Complex.add(Complex.mul(zik, s), Complex.mul(zik1, c));
            }
        }
    };

    public static readonly qr_hermitian_tridiagonal = (D: ComplexType[], E: ComplexType[], tol: number, maxSweeps: number): ComplexType[][] => {
        const n = D.length;
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            let m = n - 1;
            while (m > 0 && Complex.realToNumber(Complex.abs(E[m - 1])) <= tol) {
                E[m - 1] = Complex.zero();
                m--;
            }
            if (m === 0) break;

            let l = m - 1;
            while (l > 0 && Complex.realToNumber(Complex.abs(E[l - 1])) > tol) {
                l--;
            }

            // --- Wilkinson shift ---
            const delta = Complex.rdiv(Complex.sub(D[m - 1], D[m]), Complex.create(2));

            const em1 = Complex.abs(E[m - 1]);
            const denom = Complex.add(Complex.abs(delta), Complex.sqrt(Complex.add(Complex.mul(delta, delta), Complex.mul(em1, em1))));

            const mu = Complex.sub(D[m], Complex.rdiv(Complex.mul(Complex.sign(delta), Complex.mul(em1, em1)), denom));

            // --- Introduz o bulge ---
            let x = Complex.sub(D[l], mu);
            let y = E[l];

            for (let k = l; k < m; k++) {
                const { c, s } = LAPACKunused.complexGivens(x, y);

                // LAPACK.applyGivensTridiagonal(D, E, k, c, s);
                LAPACKunused.applyGivensToZ(Z, k, c, s);

                if (k < m - 1) {
                    x = E[k];
                    y = E[k + 1];
                }
            }
        }

        return Z.array as ComplexType[][];
    };

    public static readonly numeric_tridiagonal_hermitian_bulge_chasing = (
        D: ComplexType[], // diagonal da matriz
        E: ComplexType[], // subdiagonal (size n-1)
        maxSweeps: number = 50, // número máximo de sweeps
    ): { D: ComplexType[]; E: ComplexType[]; Z: MultiArray } => {
        const n = D.length;

        // --- Inicializa Z como identidade ---
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n); // Z.array: ComplexType[][]

        // --- Constante epsilon para tolerância ---
        const eps = Number.EPSILON || 2.220446049250313e-16;

        // --- Arrays de trabalho ---
        const Dwork = D.map((d) => Complex.copy(d));
        const Ework = E.map((e) => Complex.copy(e));

        // --- Função auxiliar: verifica se subdiagonal é efetivamente zero ---
        const isSmall = (e: ComplexType) => Complex.realLessThanOrEqualTo(Complex.abs(e), eps);

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            // varre toda a matriz da primeira à penúltima subdiagonal
            for (let k = 0; k < n - 1; k++) {
                if (isSmall(Ework[k])) continue; // já é efetivamente zero

                // --- Compute complex Givens rotation to zero E[k] ---
                const x = Dwork[k];
                const y = Ework[k];
                const r = Complex.sqrt(Complex.add(Complex.power(Complex.abs(x), Complex.two()), Complex.power(Complex.abs(y), Complex.two())));
                if (Complex.realIsZero(r)) continue;

                const c = Complex.rdiv(x, r); // c = x/r
                const s = Complex.rdiv(y, r); // s = y/r

                // --- Apply Givens rotation to D and E ---
                const dk = Dwork[k];
                const dk1 = Dwork[k + 1];

                Dwork[k] = Complex.add(Complex.mul(Complex.conj(c), Complex.mul(c, dk)), Complex.mul(Complex.conj(s), Complex.mul(s, dk1)));
                Dwork[k + 1] = Complex.add(Complex.mul(Complex.conj(s), Complex.mul(s, dk)), Complex.mul(Complex.conj(c), Complex.mul(c, dk1)));

                Ework[k] = Complex.zero(); // subdiagonal zerada

                // --- Atualiza a subdiagonal seguinte (cria o bulge) ---
                if (k + 1 < n - 1) {
                    const temp = Complex.mul(Complex.conj(c), Ework[k + 1]);
                    Ework[k + 1] = Complex.mul(Complex.conj(s), Ework[k + 1]);
                    Ework[k + 1] = Complex.add(Ework[k + 1], temp);
                }

                // --- Atualiza Z com a rotação ---
                LAPACKunused.apply_givens_right_Z(Z.array as ComplexType[][], k, c, s);
            }

            // --- Checa se todas as subdiagonais são efetivamente zero ---
            const allZero = Ework.every((e) => isSmall(e));
            if (allZero) break;
        }

        return {
            D: Dwork,
            E: Ework,
            Z,
        };
    };

    public static readonly zsteqr = (
        D: ComplexType[],
        E: ComplexType[],
        Z?: ComplexType[][],
        tol: NumLikeType = 1e-14,
        maxIts: NumLikeType = D.length * 50,
    ): {
        D: ComplexType[];
        Z?: ComplexType[][];
    } => {
        const n = D.length;
        if (n === 0) return { D: [], Z };

        if (E.length !== n - 1) {
            throw new Error('ZSTEQR: E must have length n-1');
        }

        const tolC = Complex.create(toNumber(tol));
        const one = Complex.one();
        const zero = Complex.zero();

        // cópias defensivas
        const d: ComplexType[] = D.map((x) => Complex.copy(x));
        const e: ComplexType[] = E.map((x) => Complex.copy(x));

        // ===============================
        // QL implícito (LAPACK-style)
        // ===============================
        let totalIts = 0;

        for (let l = 0; l < n; l++) {
            let its = 0;

            while (true) {
                // -----------------------
                // deflação
                // -----------------------
                let m = l;
                for (; m < n - 1; m++) {
                    const em = Complex.abs(e[m]);
                    const scale = Complex.add(Complex.abs(d[m]), Complex.abs(d[m + 1]));

                    if (Complex.realToNumber(em) <= Complex.realToNumber(Complex.mul(tolC, scale))) {
                        e[m] = Complex.zero();
                        break;
                    }
                }

                if (m === l) break;

                if (++its > toNumber(maxIts)) {
                    throw new Error('ZSTEQR: failed to converge');
                }
                totalIts++;

                // -----------------------
                // Wilkinson shift
                // -----------------------
                const dl = d[l];
                const dlp1 = d[l + 1];
                const el = e[l];

                const two = Complex.create(2);
                const delta = Complex.rdiv(Complex.sub(dlp1, dl), Complex.mul(two, el));

                const sign = Complex.realToNumber(delta) >= 0 ? one : Complex.neg(one);

                const sqrtTerm = Complex.sqrt(Complex.add(Complex.mul(delta, delta), one));

                const denom = Complex.add(delta, Complex.mul(sign, sqrtTerm));

                const mu = Complex.sub(dl, Complex.rdiv(Complex.mul(el, el), denom));

                // -----------------------
                // rotações QL
                // -----------------------
                let g = Complex.sub(d[l], mu);
                let s = zero;
                let c = one;

                for (let i = l; i < m; i++) {
                    const f = Complex.mul(s, e[i]);
                    const b = Complex.mul(c, e[i]);

                    let r: ComplexType;

                    if (Complex.realToNumber(Complex.abs(f)) >= Complex.realToNumber(Complex.abs(g))) {
                        c = Complex.rdiv(g, f);
                        r = Complex.sqrt(Complex.add(Complex.mul(c, c), one));
                        e[i] = Complex.mul(f, r);
                        s = Complex.rdiv(one, r);
                        c = Complex.mul(c, s);
                    } else {
                        s = Complex.rdiv(f, g);
                        r = Complex.sqrt(Complex.add(Complex.mul(s, s), one));
                        e[i] = Complex.mul(g, r);
                        c = Complex.rdiv(one, r);
                        s = Complex.mul(s, c);
                    }

                    const gip1 = Complex.sub(d[i + 1], mu);
                    const t = Complex.add(Complex.mul(Complex.sub(d[i], gip1), s), Complex.mul(Complex.create(2), Complex.mul(c, b)));

                    d[i] = Complex.add(gip1, Complex.mul(s, t));
                    g = Complex.sub(Complex.mul(c, t), b);
                    d[i + 1] = Complex.add(g, mu);

                    // -----------------------
                    // acumular autovetores
                    // -----------------------
                    if (Z) {
                        for (let k = 0; k < n; k++) {
                            const zki = Z[k][i];
                            const zkip = Z[k][i + 1];

                            Z[k][i] = Complex.add(Complex.mul(zki, c), Complex.mul(zkip, s));

                            Z[k][i + 1] = Complex.add(Complex.mul(zkip, c), Complex.mul(zki, Complex.neg(s)));
                        }
                    }
                }
            }
        }

        // ===============================
        // ordenação (LAPACK-style)
        // ===============================
        for (let i = 0; i < n - 1; i++) {
            let k = i;
            let p = d[i];

            for (let j = i + 1; j < n; j++) {
                if (Complex.realToNumber(d[j]) < Complex.realToNumber(p)) {
                    k = j;
                    p = d[j];
                }
            }

            if (k !== i) {
                [d[i], d[k]] = [d[k], d[i]];

                if (Z) {
                    for (let r = 0; r < n; r++) {
                        [Z[r][i], Z[r][k]] = [Z[r][k], Z[r][i]];
                    }
                }
            }
        }

        // garantir parte imaginária zero
        for (let i = 0; i < n; i++) {
            d[i] = Complex.create(d[i].re);
        }

        return { D: d, Z };
    };
}

export type { ElementType };
export { LAPACKunused };
export default { LAPACKunused };
