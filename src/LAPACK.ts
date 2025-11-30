import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';

/**
 * # LAPACK (Linear Algebra PACKage)
 *
 * ## References
 * - https://en.wikipedia.org/wiki/LAPACK
 * - https://www.netlib.org/lapack/
 * - https://github.com/Reference-LAPACK/lapack
 */
abstract class LAPACK {
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
        LAPACK.laswp(M, k1, k2, ipiv, +1);
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
     * Returns a 2D or ND-aware identity matrix generator (`ComplexType[][]`), row-major.
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
     * Return the squared Euclidean norm of the slice R[startRow..m-1, col].
     * Result is returned as a ComplexType whose imaginary part is zero (real value).
     *
     * Equivalent (conceptually) to (ZNRM2(R[startRow: m-1, col]))^2 but computed directly.
     *
     * @param R MultiArray
     * @param col column index
     * @param startRow starting row (inclusive)
     * @param m number of rows in R (or row limit)
     * @returns ComplexType representing the real value sum_i |R[i,col]|^2
     */
    public static readonly nrm2sq = (R: MultiArray, col: number, startRow: number, m: number): ComplexType => {
        let s = Complex.zero();
        for (let i = startRow; i < m; i++) {
            Complex.mulAndSumTo(s, R.array[i][col] as ComplexType, Complex.conj(R.array[i][col] as ComplexType));
        }
        // s should be real-valued (imag == 0) but kept as ComplexType for consistency
        return Complex.create(s.re);
    };

    /**
     * Return the Euclidean norm (sqrt of sum |x_i|^2) as a ComplexType whose imaginary part is zero.
     * This is the direct analogue of LAPACK's ZNRM2 (but returning ComplexType to fit your engine).
     *
     * @param R MultiArray
     * @param col column index
     * @param startRow starting row (inclusive)
     * @param m number of rows in R (or row limit)
     */
    public static readonly nrm2 = (R: MultiArray, col: number, startRow: number, m: number): ComplexType => Complex.sqrt(LAPACK.nrm2sq(R, col, startRow, m));

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
    public static readonly trsm_left_upper = (A: MultiArray, k: number, kb: number): void => {
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
     * ## `LAPACK.larfg_left`
     * LAPACK-style LARFG - Compute Householder vector and tau for complex
     * vectors `x = A[k:m-1, k]`. It's a complex householder generator for
     * left-side application. Generates `tau`, `v`, `phi` and `alpha` for
     * `H = I - tau*v*v^H`.
     * ### Notes:
     * - Uses `BLAS.dotc_col(A, k, k)` to compute `sigma = sum_{i>k} |x_i|^2`.
     * - Follows the ZLARFG convention (`alpha = -phi * ||x||`, with `phi = x0/|x0|` when `x0!=0`).
     * @param A Target MultiArray (only used for shape reference).
     * @param m Number of rows
     * @param k Start index of reflector
     * @returns object { tau, v, phi, alpha } where:
     * - `v` is a ComplexType[] with `v[0] = 1` and `length = m-k`.
     * - `tau` is ComplexType.
     * - `phi` is ComplexType.
     * - `alpha` is the resulting leading value (the value that replaces `A[k,k]`)
     */
    public static readonly larfg_left = (A: MultiArray, m: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = m - k;
        // x0 = A[k,k]
        const x0 = A.array[k][k] as ComplexType;
        // sigma = sum |x[i]|^2 for i=k+1..m-1
        const sigma = BLAS.dotc_col(A, k, k);
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
     * ## `LAPACK.larfg_right`
     * LAPACK-style LARFG - build a Householder reflector acting **on the right**.
     *
     * Computes tau, v, phi, alpha for the vector
     *    x = A[k, k:n-1]^T  (row segment)
     *
     * Equivalent to generating H = I - tau * v * v^H
     * such that H * x = [ alpha ; 0 ; ... ].
     *
     * ### Notes:
     * - Uses BLAS-style dotc over the *row* (sigma = sum |x_j|^2 over j>k).
     * - Follows ZLARFG conventions: alpha = -phi * ||x||, with
     *   phi = x0 / |x0| when x0 != 0, otherwise phi = 1.
     *
     * @param A Target MultiArray (shape reference only)
     * @param n Number of columns
     * @param k Starting index of reflector (col index)
     * @returns { tau, v, phi, alpha }:
     *   - v: ComplexType[] with v[0]=1, length = n-k
     *   - tau: ComplexType
     *   - phi: ComplexType
     *   - alpha: ComplexType (value that replaces A[k][k])
     */
    public static readonly larfg_right = (A: MultiArray, n: number, k: number): { tau: ComplexType; v: ComplexType[]; phi: ComplexType; alpha: ComplexType } => {
        const len = n - k;
        // x0 = A[k][k]
        const x0 = A.array[k][k] as ComplexType;
        // sigma = sum_{j>k} |x_j|^2   (row version)
        const sigma = BLAS.dotc_row(A, k, k);
        // phi = x0/|x0|  (LAPACK convention: phi=1 if x0==0)
        const absx0 = Complex.abs(x0);
        const phi = Complex.realIsZero(absx0) ? Complex.one() : Complex.rdiv(x0, absx0);
        // Special case: length 1 OR sigma == 0
        if (len === 1 || Complex.realIsZero(Complex.abs(sigma))) {
            const tau = Complex.zero();
            const v: ComplexType[] = new Array(len);
            v[0] = Complex.one();
            for (let i = 1; i < len; i++) v[i] = Complex.zero();
            return { tau, v, phi, alpha: x0 };
        } else {
            // General case
            const normx = Complex.sqrt(Complex.add(Complex.mul(x0, Complex.conj(x0)), sigma));
            // alpha = -phi * norm(x)
            const alpha = Complex.mul(Complex.neg(phi), normx);
            // tau = (alpha - x0) / alpha
            const tau = Complex.rdiv(Complex.sub(alpha, x0), alpha);
            // denom = x0 - alpha
            const denom = Complex.sub(x0, alpha);
            // Build v: v[0] = 1, v[j] = A[k][k+j] / denom
            const v: ComplexType[] = new Array(len);
            v[0] = Complex.one();
            for (let j = 1; j < len; j++) {
                v[j] = Complex.rdiv(A.array[k][k + j] as ComplexType, denom);
            }
            return { tau, v, phi, alpha };
        }
    };

    /**
     * Generalized LAPACK-style complex Householder generator.
     * Delegates to left or right version.
     * @param side
     * @param A
     * @param m
     * @param k
     * @returns Object { tau, v, alpha }
     */
    public static readonly larfg = (side: 'L' | 'R', A: MultiArray, m: number, k: number): { tau: ComplexType; v: ComplexType[]; alpha: ComplexType } =>
        side === 'L' ? LAPACK.larfg_left(A, m, k) : LAPACK.larfg_right(A, m, k);

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
        const { tau, v, alpha } = LAPACK.larfg_left(A, m, k);
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
        const { tau, v, alpha } = LAPACK.larfg_right(A, m, k);
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
    public static readonly larfg_nd = (side: 'L' | 'R', A: MultiArray, k: number) => (side === 'L' ? LAPACK.larfg_left_nd(A, k) : LAPACK.larfg_right_nd(A, k));

    /**
     * Apply an elementary reflector H = I - tau * v * v^H to a matrix A from the left.
     * Equivalent to A := H * A for rows rowStart..m-1 and columns colStart..n-1.
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
        // apply H = I - tau * v * v^H to columns j = rowStart+1 .. A.dimension[1]-1 only
        for (let j = colStart; j < A.dimension[1]; j++) {
            // s = v^H * A[rowStart:rowStart+v.length-1, j]
            let s = Complex.zero();
            for (let i = 0; i < v.length; i++) {
                Complex.mulAndSumTo(s, Complex.conj(v[i]), A.array[rowStart + i][j] as ComplexType);
            }
            // s = tau * s
            s = Complex.mul(tau, s);
            // no update needed for this column
            if (Complex.realIsZero(Complex.abs(s))) {
                continue;
            }
            // A[rowStart+i, j] -= v[i] * s
            for (let i = 0; i < v.length; i++) {
                A.array[rowStart + i][j] = Complex.sub(A.array[rowStart + i][j] as ComplexType, Complex.mul(v[i], s));
            }
        }
    };

    /**
     * Apply an elementary reflector H = I - tau * v * v^H to A from the left,
     * but restricted to columns colStart .. colEnd-1.
     *
     * A: MultiArray (row-major)
     * v: ComplexType[] (v[0] == 1, length = m - rowStart)
     * tau: ComplexType
     * rowStart: starting row index of the reflector (k)
     * colStart: first column to update (usually k+1)
     * colEnd: (optional) one-past-last column to update (default = A.dimension[1])
     */
    public static readonly larf_left_block = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number, colEnd?: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;

        const m = A.dimension[0];
        const n = A.dimension[1];
        const jEnd = typeof colEnd === 'number' ? Math.min(colEnd, n) : n;
        const vlen = v.length; // expected m - rowStart

        // bounds safety (trim vlen if necessary)
        const maxVlen = Math.max(0, Math.min(vlen, m - rowStart));

        for (let j = colStart; j < jEnd; j++) {
            // compute s = v^H * A[rowStart:rowStart+vlen-1, j]
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
     * Apply a complex Householder reflector from the RIGHT:
     *
     *     A := A * (I - tau * v * v^H)
     *
     * This operates on the block:
     *   rows    i = rowStart .. A.dimension[0]-1
     *   columns j = colStart .. colStart + v.length - 1
     *
     * Exactly matches LAPACK xLARF(side='R') behaviour.
     *
     * @param A         MultiArray
     * @param v         Householder vector (length = block size)
     * @param tau       Householder scalar
     * @param rowStart  first row of the block
     * @param colStart  first column of the block
     */
    public static readonly larf_right = (A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number): void => {
        // quick return if tau == 0
        if (Complex.realIsZero(Complex.abs(tau))) return;
        for (let i = rowStart; i < A.dimension[0]; i++) {
            // w = A[i, colStart : colStart+v.length-1] * v (dot product)
            let w = Complex.zero();
            for (let j = 0; j < v.length; j++) {
                Complex.mulAndSumTo(w, A.array[i][colStart + j] as ComplexType, Complex.conj(v[j]));
            }
            // w = w * tau
            w = Complex.mul(w, tau);
            // A[i, colStart + j] -= w * v[j]
            for (let j = 0; j < v.length; j++) {
                A.array[i][colStart + j] = Complex.sub(A.array[i][colStart + j] as ComplexType, Complex.mul(w, v[j]));
            }
        }
    };

    /**
     *
     * @param side
     * @param A
     * @param v
     * @param tau
     * @param rowStart
     * @param colStart
     * @returns
     */
    public static readonly larf = (side: 'L' | 'R', A: MultiArray, v: ComplexType[], tau: ComplexType, rowStart: number, colStart: number) =>
        side === 'L' ? LAPACK.larf_left(A, v, tau, rowStart, colStart) : LAPACK.larf_right(A, v, tau, rowStart, colStart);

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
        side === 'L' ? LAPACK.larf_left_nd(A, v, tau, rowStart, colStart) : LAPACK.larf_right_nd(A, v, tau, rowStart, colStart);

    /**
     * Unblocked QR factorization (GEQR2-like), complex version.
     * Overwrites a copy of A and returns { R, taus }.
     */
    /**
     * Unblocked QR factorization (GEQR2-like), complex version.
     * Overwrites a COPY of A and returns { R, taus }.
     */
    /**
     * ZGEQR2-like: unblocked QR (complex). Returns R (copy of A overwritten) and taus[].
     */
    /**
     * GEQR2 (unblocked) - QR factorization without pivoting (complex), MATLAB/Octave style.
     *
     * Produces:
     *  - R: copy of A with R[k,k] = alpha and R[k+1:m,k] = tau * v[1:]
     *  - taus: array of taus (one per reflector) to be used by orgqr
     *
     * Phase normalization is applied only when the input matrix contains complex entries.
     * Order of operations:
     *  1) compute (tau,v,phi,alpha) = larfg_left
     *  2) store alpha at R[k,k]
     *  3) apply H (with original tau,v) to trailing columns
     *  4) if matrix is complex: scale R[k,:] by conj(phi), reparametrize v and tau
     *  5) store R[k+1:m,k] = tau * v[1:]
     */
    /**
     * GEQR2 (unblocked) - QR factorization without pivoting (complex), LAPACK-style.
     * - R is a copy de A com reflectors armazenados compactados (MATLAB/Octave-style):
     *     R[k,k] = alpha
     *     R[k+1:m,k] = tau * v[1:]
     * - taus[k] guarda tau para cada reflector (usado por orgqr).
     */
    /**
     * Unblocked QR factorization without pivoting.
     * - stores Householder vectors compactly in the strict lower part of R
     * (below diagonal).
     * - returns taus[] (one per reflector).
     * @param A
     * @returns
     */
    public static readonly geqr2 = (A: MultiArray): { R: MultiArray; taus: ComplexType[]; phis: ComplexType[] } => {
        const R = MultiArray.copy(A) as MultiArray;
        const m = R.dimension[0];
        const n = R.dimension[1];
        const kMax = Math.min(m, n);
        const taus: ComplexType[] = new Array(kMax);
        const phis: ComplexType[] = new Array(kMax);
        for (let k = 0; k < kMax; k++) {
            // 1) gera refletor para coluna k
            const { tau, v, phi, alpha } = LAPACK.larfg_left(R, m, k);
            // 2) grava alpha em R[k,k]
            R.array[k][k] = alpha;
            // 3) armazena tau * v[1..] (MATLAB/Octave-style)
            for (let i = 1; i < v.length; i++) {
                R.array[k + i][k] = Complex.mul(tau, v[i]);
            }
            // 4) aplica H = I - tau * v * v^H às colunas restantes
            if (k + 1 < n) {
                LAPACK.larf_left(R, v, tau, k, k + 1);
            }
            // 5) salva tau e phi (sem qualquer reparametrização)
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
            const norm = LAPACK.nrm2(A, 0, j, m);
            colNorms[j] = norm;
            colNorms0[j] = norm;
        }

        const kMax = Math.min(m, n);
        for (let k = 0; k < kMax; k++) {
            // === Pivot column selection (choose column with largest current norm) ===
            let maxIdx = k;
            let maxNorm = colNorms[k];
            for (let j = k + 1; j < n; j++) {
                if (colNorms[j] > maxNorm) {
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
            // Use provided signature: larfg_left(A, m, k)
            const { tau, v, alpha, phi } = LAPACK.larfg_left(A, m, k);
            taus[k] = tau;
            phis[k] = phi;

            // Store alpha at A[k,k]
            A.array[k][k] = alpha;
            // Store reflector vector v into A[k+1 : m-1, k] (v[0] is 1)
            for (let i = 1; i < v.length; i++) {
                A.array[k + i][k] = v[i];
            }

            // === Apply reflector to the remaining columns ===
            if (k + 1 < n) {
                // larf_left(A, v, tau, rowStart, colStart)
                LAPACK.larf_left(A, v, tau, k, k + 1);
            }

            // === Update column norms (LAPACK style) ===
            for (let j = k + 1; j < n; j++) {
                if (Complex.realToNumber(Complex.eq(colNorms[j], Complex.zero()))) continue;

                // abs(A[k,j]) as numeric
                const absAjkNum = Complex.abs(A.array[k][j] as ComplexType);
                const ratio = Complex.rdiv(absAjkNum, colNorms[j]);

                // numeric update: new_norm = old_norm * sqrt(max(0, 1 - ratio^2))
                const tmp = Complex.sub(Complex.one(), Complex.mul(ratio, ratio));
                const tmpPos = Complex.realToNumber(Complex.gt(tmp, Complex.zero())) ? tmp : Complex.zero();
                colNorms[j] = Complex.mul(colNorms[j], Complex.sqrt(tmpPos));

                // If norm dropped too much, recompute full norm for robustness
                if (Complex.realToNumber(Complex.le(colNorms[j], Complex.mul(Complex.onediv2(), colNorms0[j])))) {
                    // recompute norm of column j from row k+1 to m-1
                    const recomputed = LAPACK.nrm2(A, k + 1, j, m);
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
                if (Complex.realToNumber(Complex.gt(vn1[j], maxn))) {
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
            const { tau, v, phi, alpha } = LAPACK.larfg_left(R, m, k);
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
            // 6) apply H = I - tau * v * v^H to remaining columns (k+1 .. n-1)
            if (k + 1 < n && !Complex.realIsZero(Complex.abs(tau))) {
                LAPACK.larf_left(R, v, tau, k, k + 1);
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
                if (Complex.realToNumber(Complex.ne(vn1[j], Complex.zero()))) {
                    // use R[k][j] as the new element that reduced the norm
                    const rkj = R.array[k][j] as ComplexType;
                    const rkjabs = Complex.abs(rkj);
                    const temp = Complex.sub(Complex.one(), Complex.rdiv(Complex.mul(rkjabs, rkjabs), Complex.mul(vn1[j], vn1[j])));
                    const temp2 = Complex.realToNumber(Complex.gt(temp, Complex.zero())) ? Complex.sqrt(temp) : Complex.zero();
                    const newv = Complex.mul(vn1[j], temp2);
                    // heuristic: if newv is substantially smaller than vn2[j], recompute exact norm
                    const threshold = Complex.onediv2(); // typical heuristic factor (as in LAPACK)
                    if (Complex.realToNumber(Complex.le(newv, Complex.mul(threshold, vn2[j])))) {
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
     * ## `LAPACK.orgqr`
     * Construct `Q` explicitly from `R` (with MATLAB/Octave-style storage
     * `tau*v` in subdiagonal) and `taus[]` produced by `LAPACK.geqr2`.
     * We reconstruct each `v` from `R` (`v[0]=1`, `v[1..]` from `R[k+1..,k]`) then
     * apply `Q := Q * H^H` using accumulation. Adapted to row-major
     * MultiArray and using `LAPACK.larf_left` for left application.
     *
     * IMPORTANT: loop in reverse order (`kMax-1` downto `0`) applying `H = I - tau * v * v^H` to match LAPACK
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
                // reconstruir v a partir do armazenamento tau * v
                for (let i = 1; i < vlen; i++) {
                    // R.array[k + i][k] is equals tau * v[i]
                    v[i] = Complex.rdiv(R.array[k + i][k] as ComplexType, tau);
                }
            }
            // apply H = I - tau * v * v^H to Q (rows k..m-1, all columns)
            LAPACK.larf_left(Q, v, tau, k, 0);
        }
        MultiArray.setType(Q);
        return Q;
    };

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
                if (Complex.realToNumber(Complex.gt(val, maxVal))) {
                    maxVal = val;
                    maxIdx = r;
                }
            }
            piv[i] = maxIdx; // store pivot (zero-based)
            // 2) swap rows i and maxIdx in A if needed
            if (maxIdx !== i) {
                LAPACK.laswp_rows(A, i, maxIdx);
            }
            // 3) If pivot is zero, skip multipliers
            const pivot = A.array[i][i] as ComplexType;
            if (Complex.realToNumber(Complex.abs(pivot)) === 0) continue;
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
    public static readonly getrf = (A: MultiArray): { LU: MultiArray; piv: number[]; swaps: number } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        let swaps = 0;
        for (let k = 0; k < minmn; k += BLAS.settings.blockSize) {
            const panelWidth = Math.min(BLAS.settings.blockSize, minmn - k);
            // 1) Factorize panel A[k:m-1, k:k+panelWidth-1] with getf2 (unblocked)
            LAPACK.getf2(A, k, panelWidth, piv);
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
     * Unblocked panel factorization for columns k .. k+panelWidth-1.
     * Writes pivots into piv (global, zero-based) for indices i=k..k+panelWidth-1.
     * @param A MultiArray (modified in-place)
     * @param k
     * @param panelWidth
     * @param piv number[] (length >= min(m,n)), receives zero-based pivot row indices
     * @param swapsObj { swaps: number }  (accumulates swaps)
     * @param infoObj { info: number } (LAPACK-style 1-based info)
     */
    public static readonly getf2_unblocked = (A: MultiArray, k: number, panelWidth: number, piv: number[], swapsObj: { swaps: number }, infoObj: { info: number }): void => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const end = Math.min(k + panelWidth, Math.min(m, n));
        for (let i = k; i < end; i++) {
            // 1) find pivot in column i (rows i..m-1)
            let maxIdx = i;
            let maxVal = Complex.abs(A.array[i][i] as ComplexType);
            for (let r = i + 1; r < m; r++) {
                const val = Complex.abs(A.array[r][i] as ComplexType);
                if (Complex.realToNumber(Complex.gt(val, maxVal))) {
                    maxVal = val;
                    maxIdx = r;
                }
            }
            piv[i] = maxIdx;
            // 2) swap rows if needed (full row swap)
            if (maxIdx !== i) {
                LAPACK.laswp_rows(A, i, maxIdx);
                swapsObj.swaps++;
            }
            // 3) check singularity
            const pivot = A.array[i][i] as ComplexType;
            if (Complex.realToNumber(Complex.abs(pivot)) === 0) {
                if (infoObj.info === 0) infoObj.info = i + 1; // LAPACK-style info (1-based)
                continue;
            }
            // 4) compute multipliers and store in column i below diagonal
            for (let r = i + 1; r < m; r++) {
                A.array[r][i] = Complex.rdiv(A.array[r][i] as ComplexType, pivot);
            }
            // 5) rank-1 update on trailing submatrix columns i+1..n-1
            for (let r = i + 1; r < m; r++) {
                const lir = A.array[r][i] as ComplexType; // multiplier L(r,i)
                if (Complex.realToNumber(Complex.abs(lir)) === 0) continue;
                const rowR = A.array[r] as ComplexType[];
                const rowI = A.array[i] as ComplexType[];
                for (let c = i + 1; c < n; c++) {
                    // A[r][c] -= L(r,i) * A[i][c]
                    rowR[c] = Complex.sub(rowR[c], Complex.mul(lir, rowI[c]));
                }
            }
        }
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
     * Blocked LU factorization that calls getf2_unblocked for panel factorization,
     * then solves and updates the trailing submatrix.
     * @param A
     * @returns Object { LU: A, piv, info, swaps }
     */
    public static readonly getrf_blocked = (A: MultiArray): { LU: MultiArray; piv: number[]; info: number; swaps: number } => {
        const m = A.dimension[0];
        const n = A.dimension[1];
        const minmn = Math.min(m, n);
        const piv: number[] = new Array(minmn);
        for (let i = 0; i < minmn; i++) piv[i] = i;
        const swapsObj = { swaps: 0 };
        const infoObj = { info: 0 };
        for (let k = 0; k < minmn; k += BLAS.settings.blockSize) {
            const kb = Math.min(BLAS.settings.blockSize, minmn - k);
            // 1) Factor panel A[k:m-1, k:k+kb-1]
            LAPACK.getf2_unblocked(A, k, kb, piv, swapsObj, infoObj);
            // 2) If there are columns to the right, solve U * X = A12 (trsm-like)
            if (k + kb < n) {
                // Note: in our layout, after getf2 we already have L and U in place for the panel.
                // We need to compute U^{-1} * A12 (i.e. solve for rows k..k+kb-1)
                // We'll use the simple trsm_left_upper that divides columns k+kb..n-1 by U.
                LAPACK.trsm_left_upper(A, k, kb);
            }
            // 3) Update trailing submatrix A22 := A22 - L21 * U12
            if (k + kb < m && k + kb < n) {
                LAPACK.gemm_blocked(A, k, kb);
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

    public static functions: { [F in keyof LAPACK]: Function } = {
        laswp: LAPACK.laswp,
        laswp_rows: LAPACK.laswp_rows,
        laswp_cols: LAPACK.laswp_cols,
        eye: LAPACK.eye,
        nrm2sq: LAPACK.nrm2sq,
        nrm2: LAPACK.nrm2,
        triu_inplace: LAPACK.triu_inplace,
        tril_inplace: LAPACK.tril_inplace,
        trsm_left_upper: LAPACK.trsm_left_upper,
        lapmt_matrix: LAPACK.lapmt_matrix,
        larfg_left: LAPACK.larfg_left,
        larfg_right: LAPACK.larfg_right,
        larfg: LAPACK.larfg,
        larfg_apply: LAPACK.larfg_apply,
        larfg_left_nd: LAPACK.larfg_left_nd,
        larfg_right_nd: LAPACK.larfg_right_nd,
        larfg_nd: LAPACK.larfg_nd,
        larf_left: LAPACK.larf_left,
        larf_right: LAPACK.larf_right,
        larf: LAPACK.larf,
        larf_left_nd: LAPACK.larf_left_nd,
        larf_right_nd: LAPACK.larf_right_nd,
        larf_nd: LAPACK.larf_nd,
        geqr2: LAPACK.geqr2,
        geqp2: LAPACK.geqp2,
        orgqr: LAPACK.orgqr,
        getf2: LAPACK.getf2,
        getrf: LAPACK.getrf,
        getf2_unblocked: LAPACK.getf2_unblocked,
        gemm_blocked: LAPACK.gemm_blocked,
        getrf_blocked: LAPACK.getrf_blocked,
        getrs: LAPACK.getrs,
    };
}

export type { ElementType };
export { LAPACK };
export default { LAPACK };
