import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';

type BLASConfig = {
    /**
     * Minimal value for block multiplication version. Tune as needed.
     */
    blockThreshold: number;
    /**
     * Block size.
     */
    blockSize: number;
};
export const BLASConfigKeyTable: (keyof BLASConfig)[] = ['blockThreshold', 'blockSize'];
const defaultSettings: Partial<BLASConfig> = {
    blockThreshold: 1e5 /* (≈ 300×300) */,
    blockSize: 64,
};

type SideType = 'L' | 'R';
type UploType = 'U' | 'L';
type TransType = 'N' | 'T' | 'C';

/**
 * # BLAS (Basic Linear Algebra Subprograms)
 *
 * The BLAS (Basic Linear Algebra Subprograms) are routines that provide
 * standard building blocks for performing basic vector and matrix operations.
 * The Level 1 BLAS perform scalar, vector and vector-vector operations, the
 * Level 2 BLAS perform matrix-vector operations, and the Level 3 BLAS perform
 * matrix-matrix operations.
 *
 * ## References
 * - [Wikipedia — Basic Linear Algebra Subprograms](https://en.wikipedia.org/wiki/Basic_Linear_Algebra_Subprograms)
 * - [BLAS (Basic Linear Algebra Subprograms) — Netlib reference implementation](https://www.netlib.org/blas/)
 * - [BLAS Quick Reference Guide](https://www.netlib.org/blas/blas.pdf)
 * - https://github.com/Reference-LAPACK/lapack/tree/master/BLAS/SRC
 *
 * ## MathJSLab — BLAS / LAPACK Internal Data Layout Conventions
 *
 * This file implements BLAS-like routines adapted to the internal
 * data representation of the MathJSLab engine.
 *
 * **IMPORTANT — DATA LAYOUT AND SEMANTIC CONVENTIONS**
 *
 * ### 1) Matrix storage (ComplexType[][])
 *
 * - All matrices are stored in ROW-MAJOR order.
 * - A matrix entry A[i][j] corresponds to:
 *     row    = i
 *     column = j
 * - This is the opposite of MATLAB / Octave, which use column-major
 *   storage. No implicit transpositions are performed.
 *
 * - The canonical matrix type used by BLAS routines is:
 *     ComplexType[][]
 *
 * - MultiArray is considered a higher-level container and should
 *   not be used as a primary BLAS argument unless strictly necessary.
 *
 * ### 2) Vector storage (ComplexType[])
 *
 * - Vectors are stored as plain one-dimensional arrays:
 *     ComplexType[]
 *
 * - A ComplexType[] DOES NOT carry an intrinsic orientation.
 *   Its mathematical interpretation (row or column vector)
 *   is defined EXCLUSIVELY by the BLAS routine that receives it.
 *
 * - Every BLAS routine that accepts vectors MUST document whether
 *   each vector is interpreted as:
 *     - a column vector (m x 1), or
 *     - a row vector    (1 x n)
 *
 *
 * ### 3) Vector ↔ Matrix correspondence (row-major logic)
 *
 * Given a vector v: ComplexType[] of length m:
 *
 * - Column vector (m x 1):
 *     V = v.map(value => [value])
 *
 * - Row vector (1 x m):
 *     V = [ v ]
 *
 * **NOTE**:
 * - This construction is the logical inverse of MATLAB / Octave
 *   due to the row-major layout.
 *
 *
 * ### 4) BLAS Level-2 and Level-3 semantics
 *
 * - Level-2 routines (gemv, ger, trsv, etc.) interpret vectors
 *   according to the mathematical operation being implemented.
 *
 *   Examples:
 *   - gemv:
 *       A: m x n
 *       x: length n, interpreted as column vector
 *       y: length m, interpreted as column vector
 *
 *   - ger / geru / gerc:
 *       x: length m, interpreted as column vector
 *       y: length n, interpreted as row vector
 *
 * - Level-3 routines (gemm, trsm, etc.) operate exclusively on
 *   matrices and are independent of column-major vs row-major
 *   storage, provided indexing is consistent.
 *
 *
 * ### 5) Design goal
 *
 * These conventions are mandatory and must be preserved across
 * all BLAS and LAPACK implementations in MathJSLab in order to:
 *
 * - avoid implicit transpositions,
 * - prevent MATLAB/Octave mental-model leakage,
 * - ensure correctness of higher-level linear algebra algorithms,
 * - allow predictable performance and cache-friendly access patterns.
 *
 * Any new BLAS or LAPACK routine added to this file MUST comply
 * with the conventions stated above.
 */
abstract class BLAS {
    /**
     * BLAS default settings.
     */
    public static readonly defaultSettings: BLASConfig = Object.assign({}, defaultSettings as BLASConfig);

    /**
     * BLAS current settings.
     */
    public static readonly settings: BLASConfig = BLAS.defaultSettings;

    /**
     * Set configuration options for BLAS.
     * @param config Configuration options.
     */
    public static readonly set = (config: Partial<BLASConfig>): void => {
        const entries = Object.entries(config);
        entries.forEach((entry) => {
            if (BLASConfigKeyTable.includes(entry[0] as keyof BLASConfig)) {
                BLAS.settings[entry[0] as keyof BLASConfig] = entry[1];
            } else {
                throw new Error(`BLAS.set: invalid configuration parameter: ${entry[0]}`);
            }
        });
    };

    /**
     * =====================================
     * Level 1 BLAS: vector, O(n) operations
     * =====================================
     */

    /**
     * BLAS AXPY: Y ← alpha * X + Y
     * @param alpha Complex scalar
     * @param X ComplexType[][]
     * @param Y ComplexType[][] (modified in place)
     * @returns Y
     */
    public static readonly axpy = (alpha: ComplexType, X: ComplexType[][], Y: ComplexType[][]): ComplexType[][] => {
        const m = X.length;
        const n = X[0].length;
        for (let i = 0; i < m; i++) {
            const Xi = X[i] as ComplexType[];
            const Yi = Y[i] as ComplexType[];
            for (let j = 0; j < n; j++) {
                Yi[j] = Complex.add(Yi[j], Complex.mul(alpha, Xi[j]) as ComplexType) as ComplexType;
            }
        }
        return Y;
    };

    /**
     * BLAS SCAL: scales a vector by a scalar.
     *
     * Performs the operation:
     *   x[i] ← alpha * x[i],  i = start, ..., end - 1
     *
     * The operation is performed in-place.
     *
     * NOTE:
     * - The vector x is interpreted as a column vector (n×1),
     *   stored in row-major order.
     *
     * @param alpha Complex scalar multiplier
     * @param x Vector to be scaled (in-place)
     * @param start Starting index (inclusive)
     * @param end Ending index (exclusive)
     */
    public static readonly scal = (alpha: ComplexType, x: ComplexType[], start: number, end: number): void => {
        if (Complex.realToNumber(Complex.eq(alpha, Complex.zero()))) {
            for (let i = start; i < end; i++) {
                x[i] = Complex.zero();
            }
            return;
        }

        if (Complex.realToNumber(Complex.eq(alpha, Complex.one()))) {
            return;
        }

        for (let i = start; i < end; i++) {
            x[i] = Complex.mul(alpha, x[i]);
        }
    };

    /**
     *
     * @param A
     * @returns
     */
    public static readonly copy = (A: ComplexType[][] | ComplexType[]): ComplexType[][] | ComplexType[] => {
        if (Array.isArray(A)) {
            return Array.isArray(A[0])
                ? Array.from({ length: (A as ComplexType[][]).length }, (_, i) =>
                      Array.from({ length: (A as ComplexType[][])[0].length }, (_, j) => Complex.copy((A as ComplexType[][])[i][j])),
                  )
                : Array.from({ length: (A as ComplexType[]).length }, (_, i) => Complex.copy((A as ComplexType[])[i]));
        } else {
            throw new Error(`BLAS.copy: invalid argument`);
        }
    };

    /**
     * Unconjugated dot product of two complex vectors.
     *
     * Computes:
     *      sum_{i=0}^{n-1} x[i] * y[i]
     *
     * This corresponds to the BLAS routine ZDOTU.
     *
     * @param x Complex vector
     * @param y Complex vector
     * @returns Complex dot product
     */
    public static readonly dotu = (x: ComplexType[], y: ComplexType[]): ComplexType => {
        const n = x.length;
        let sum = Complex.zero();
        for (let i = 0; i < n; i++) {
            Complex.mulAndSumTo(sum, x[i] as ComplexType, y[i] as ComplexType);
        }
        return sum;
    };

    /**
     * Dot product of two vectors.
     *
     * Computes:
     *      sum_{i=0}^{n-1} x[i] * y[i]
     *
     * NOTE:
     * In the MathJSLab engine, this function is an alias of DOTU.
     * For real vectors, DOT, DOTU and DOTC are numerically equivalent.
     *
     * This corresponds to:
     *  - SDOT / DDOT (real BLAS)
     *  - ZDOTU / CDOTU (complex BLAS)
     *
     * @param x Vector
     * @param y Vector
     * @returns Dot product
     */
    public static readonly dot = BLAS.dotu;

    /**
     * BLAS DOTC: Conjugated dot product of two complex vectors.
     *
     * Computes:
     *      sum_{i=0}^{n-1} conj(x[i]) * y[i]
     *
     * This corresponds to the BLAS routine ZDOTC.
     *
     * @param x Complex vector (conjugated)
     * @param y Complex vector
     * @returns Complex dot product
     */
    public static readonly dotc = (x: ComplexType[], y: ComplexType[]): ComplexType => {
        const n = x.length;
        let sum = Complex.zero();
        for (let i = 0; i < n; i++) {
            Complex.mulAndSumTo(sum, Complex.conj(x[i] as ComplexType), y[i] as ComplexType);
        }
        return sum;
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
     * This is the direct analogue of LAPACK's ZNRM2.
     *
     * TODO: implement using `LAPACK.lassq`.
     *
     * @param R MultiArray
     * @param col column index
     * @param startRow starting row (inclusive)
     * @param m number of rows in R (or row limit)
     */

    /**
     * BLAS NRM2: Computes the Euclidean norm of a vector using scaling
     * to avoid overflow and underflow.
     *
     * For a complex vector x:
     *     nrm2(x) = sqrt( sum_i |x_i|^2 )
     *
     * This implementation follows the LAPACK/BLAS LASSQ strategy.
     *
     * @param x Vector of ComplexType
     * @returns Euclidean norm as a real ComplexType
     */
    public static readonly nrm2 = (x: ComplexType[]): ComplexType => {
        let scale = Complex.zero(); // real >= 0
        let sumsq = Complex.one(); // real >= 1

        for (let i = 0; i < x.length; i++) {
            const xi = x[i] as ComplexType;

            // const re = Complex.absReal(xi);
            // const im = Complex.absImag(xi);
            const re = Complex.abs(Complex.real(xi));
            const im = Complex.abs(Complex.imag(xi));

            if (Complex.toBoolean(Complex.ne(re, Complex.zero()))) {
                if (Complex.lt(scale, re)) {
                    const r = Complex.rdiv(scale, re);
                    sumsq = Complex.add(Complex.one(), Complex.mul(sumsq, Complex.mul(r, r))) as ComplexType;
                    scale = re;
                } else {
                    const r = Complex.rdiv(re, scale);
                    sumsq = Complex.add(sumsq, Complex.mul(r, r)) as ComplexType;
                }
            }

            if (Complex.toBoolean(Complex.ne(im, Complex.zero()))) {
                if (Complex.lt(scale, im)) {
                    const r = Complex.rdiv(scale, im);
                    sumsq = Complex.add(Complex.one(), Complex.mul(sumsq, Complex.mul(r, r))) as ComplexType;
                    scale = im;
                } else {
                    const r = Complex.rdiv(im, scale);
                    sumsq = Complex.add(sumsq, Complex.mul(r, r)) as ComplexType;
                }
            }
        }

        if (Complex.toBoolean(Complex.eq(scale, Complex.zero()))) {
            return Complex.zero();
        }

        return Complex.mul(scale, Complex.sqrt(sumsq)) as ComplexType;
    };

    /**
     * =============================================
     * Level 2 BLAS: matrix-vector, O(n²) operations
     * =============================================
     */

    /**
     * Complex general matrix-vector multiplication (ZGEMV, NoTrans).
     *
     * Computes:
     *      y := alpha * A * x + beta * y
     *
     * Matrix A is row-major (ComplexType[][]).
     * Vectors x and y are ComplexType[].
     * Offsets allow operating on submatrices and subvectors (LAPACK-style).
     *
     * @param A     Matrix (row-major)
     * @param m     Number of rows of submatrix A
     * @param n     Number of columns of submatrix A
     * @param rowA  Starting row offset in A
     * @param colA  Starting column offset in A
     * @param x     Input vector
     * @param rowX  Offset in x
     * @param y     In/out vector
     * @param rowY  Offset in y
     * @param alpha Scalar multiplier for A*x
     * @param beta  Scalar multiplier for y
     */
    public static readonly gemv = (
        A: ComplexType[][],
        m: number,
        n: number,
        rowA: number,
        colA: number,
        x: ComplexType[],
        rowX: number,
        y: ComplexType[],
        rowY: number,
        alpha: ComplexType,
        beta: ComplexType,
        trans: 'N' | 'T' | 'C' = 'N',
    ): void => {
        const lenY = trans === 'N' ? m : n;
        const lenDot = trans === 'N' ? n : m;

        // y := beta * y
        for (let i = 0; i < lenY; i++) {
            y[rowY + i] = Complex.eq(beta, Complex.zero()) ? Complex.zero() : Complex.eq(beta, Complex.one()) ? y[rowY + i] : Complex.mul(beta, y[rowY + i]);
        }

        // y += alpha * op(A) * x
        for (let i = 0; i < lenY; i++) {
            let acc = Complex.zero();
            for (let j = 0; j < lenDot; j++) {
                const aij = trans === 'N' ? A[rowA + i][colA + j] : trans === 'T' ? A[rowA + j][colA + i] : Complex.conj(A[rowA + j][colA + i]);
                Complex.mulAndSumTo(acc, aij, x[rowX + j]);
            }
            Complex.mulAndSumTo(y[rowY + i], alpha, acc);
        }
    };

    /**
     * Solve a triangular system:
     *
     *   A * x = b        (transA = 'N')
     *   A^T * x = b      (transA = 'T')
     *   A^H * x = b      (transA = 'C')
     *
     * where A is triangular and x is a vector.
     *
     * This is the BLAS Level-2 TRSV analogue.
     *
     * NOTE:
     * - x is interpreted as a column vector (n×1), even though it is stored
     *   as a 1D array in row-major order.
     *
     * @param A Triangular matrix (n × n), row-major
     * @param x Right-hand side vector (length n), interpreted as column
     * @param opts Options: uplo, transA, unitDiagonal
     * @returns Solution vector x (length n)
     */
    public static readonly trsv = (
        A: ComplexType[][],
        x: ComplexType[],
        opts: {
            uplo: 'lower' | 'upper';
            transA: 'N' | 'T' | 'C';
            unitDiagonal: boolean;
        },
    ): ComplexType[] => {
        const n = A.length;
        // --- Dimension checks ---
        if (A.some((row) => row.length !== n)) {
            throw new Error('BLAS.trsv: A must be square.');
        }
        if (x.length !== n) {
            throw new Error('BLAS.trsv: x has incompatible dimension.');
        }
        // --- Interpret x as an n×1 matrix ---
        const B: ComplexType[][] = Array.from({ length: n }, (_, i) => [x[i]]);
        const X = BLAS.trsm(A, B, {
            side: 'left',
            uplo: opts.uplo,
            transA: opts.transA,
            unitDiagonal: opts.unitDiagonal,
        });
        // --- Extract solution vector ---
        return X.map((row: ComplexType[]) => row[0]);
    };

    /**
     * Rank-1 update `A := A + alpha * x * y^H`
     * For complex-case conjugate on second vector (gerc style).
     * A: m x n as ComplexType[][], x length m, y length n
     *
     * @param A ComplexType[][] contendo matriz base
     * @param startRow linha inicial do bloco `A` a ser atualizado
     * @param startCol coluna inicial do bloco `A` a ser atualizado
     * @param m Comprimento do vetor `x`
     * @param n comprimento do vetor `y`
     * @param alpha
     * @param xA ComplexType[][] contendo o vetor `x` (parte real)
     * @param xRow linha inicial do vetor `x`
     * @param xCol coluna inicial do vetor `x`
     * @param yA ComplexType[][] contendo o vetor `y` (parte imaginária)
     * @param yRow linha inicial do vetor `y`
     * @param yCol coluna inicial do vetor `y`
     */
    public static readonly ger = (
        A: ComplexType[][],
        startRow: number,
        startCol: number,
        m: number,
        n: number,
        alpha: ComplexType,
        xA: ComplexType[][],
        xRow: number,
        xCol: number,
        yA: ComplexType[][],
        yRow: number,
        yCol: number,
    ): void => {
        if (Complex.realIsZero(Complex.abs(alpha))) return;
        for (let i = 0; i < m; i++) {
            const xi = xA[xRow + i][xCol] as ComplexType;
            const alphaXi = Complex.mul(alpha, xi);
            const Ai = A[startRow + i];
            for (let j = 0; j < n; j++) {
                Complex.mulAndSumTo(Ai[startCol + j] as ComplexType, alphaXi, Complex.conj(yA[yRow + j][yCol] as ComplexType));
            }
        }
    };

    /**
     * Rank-1 update (no conjugation):
     *   C[i0+i][j0+j] += alpha * x[i] * y[j]
     *
     * This corresponds to BLAS GERU.
     */
    public static readonly geru = (x: ComplexType[], y: ComplexType[], alpha: ComplexType, C: ComplexType[][], i0: number, j0: number): void => {
        if (Complex.realIsZero(Complex.abs(alpha))) return;

        for (let i = 0; i < x.length; i++) {
            const xi = x[i];
            const Ci = C[i0 + i];
            for (let j = 0; j < y.length; j++) {
                // Ci[j0 + j] += alpha * xi * y[j]
                Complex.mulAndSumTo(Ci[j0 + j], alpha, Complex.mul(xi, y[j]));
            }
        }
    };

    /**
     * Complex rank-1 update with conjugation on `y`
     * > > `C := C + alpha * x * y^H`
     *
     * @param x `ComplexType[]` vetor (`m`)
     * @param y `ComplexType[]` vetor (`n`)
     * @param C `ComplexType[][]` [`m x n`] (complex)
     */
    public static readonly gerc = (x: ComplexType[], y: ComplexType[], alpha: ComplexType, C: ComplexType[][], rowOffset = 0, colOffset = 0): void => {
        for (let i = 0; i < x.length; i++) {
            const xi = x[i];
            const Ci = C[rowOffset + i];
            for (let j = 0; j < y.length; j++) {
                Ci[colOffset + j] = Complex.add(Ci[colOffset + j], Complex.mul(alpha, Complex.mul(xi, Complex.conj(y[j]))));
            }
        }
    };

    /**
     * Complex rank-1 update with conjugation on `x`
     * > > `C := C + conj(x) * y^H`
     * Notes:
     * - `x` and `y` can be 1D MultiArrays with arbitrary strides
     * - Result is stored in `C`
     * @param x `MultiArray` (vector)
     * @param y `MultiArray` (vector)
     * @param C `MultiArray` [`m x n`]
     */
    public static readonly gerc_nd = (x: MultiArray, y: MultiArray, C: MultiArray): void => {
        // Flatten x and y to 1D arrays
        const xFlat: ComplexType[] = [];
        for (let i = 0; i < MultiArray.linearLength(x); i++) {
            const [row, col] = MultiArray.linearIndexToMultiArrayRowColumn(x.dimension[0], x.dimension[1], i);
            xFlat.push(x.array[row][col] as ComplexType);
        }
        const yFlat: ComplexType[] = [];
        for (let j = 0; j < MultiArray.linearLength(y); j++) {
            const [row, col] = MultiArray.linearIndexToMultiArrayRowColumn(y.dimension[0], y.dimension[1], j);
            yFlat.push(y.array[row][col] as ComplexType);
        }
        const m = xFlat.length;
        const n = yFlat.length;
        if (C.dimension[0] !== m || C.dimension[1] !== n) {
            throw new Error(`BLAS.gerc_nd: dimension mismatch (C is ${C.dimension[0]}x${C.dimension[1]}, x is ${m}, y is ${n})`);
        }
        // Rank-1 update: C[i,j] += conj(x[i]) * y[j]
        for (let i = 0; i < m; i++) {
            const xiConj = Complex.conj(xFlat[i]);
            for (let j = 0; j < n; j++) {
                const prod = Complex.mul(xiConj, yFlat[j]);
                if (!C.array[i][j]) {
                    C.array[i][j] = Complex.copy(prod);
                } else {
                    C.array[i][j] = Complex.add(C.array[i][j] as ComplexType, prod);
                }
            }
        }
        MultiArray.setType(C);
    };

    /**
     * ND-aware, direct:
     * > > `C := C + conj(x) * y^H`
     * Notes:
     * - No flattening/copying; uses MultiArray linear <-> row/col conversion
     * - `x` and `y` can be slices from higher-dim MultiArrays
     * @param x 1D `MultiArray` (vector)
     * @param y 1D `MultiArray` (vector)
     * @param C 2D `MultiArray` [`m x n`]
     */
    public static readonly gerc_nd_direct = (x: MultiArray, y: MultiArray, C: MultiArray): void => {
        const m = MultiArray.linearLength(x);
        const n = MultiArray.linearLength(y);
        if (C.dimension[0] !== m || C.dimension[1] !== n) {
            throw new Error(`BLAS.gerc_nd_direct: dimension mismatch (C is ${C.dimension[0]}x${C.dimension[1]}, x is ${m}, y is ${n})`);
        }
        const pageLengthX = x.dimension[0] * (x.dimension[1] || 1);
        const pageLengthY = y.dimension[0] * (y.dimension[1] || 1);
        const pageLengthC = C.dimension[0] * C.dimension[1];
        for (let iLin = 0; iLin < m; iLin++) {
            const [xRow, xCol] = MultiArray.linearIndexToMultiArrayRowColumn(x.dimension[0], x.dimension[1] || 1, iLin);
            const xiConj = Complex.conj(x.array[xRow][xCol] as ComplexType);
            for (let jLin = 0; jLin < n; jLin++) {
                const [yRow, yCol] = MultiArray.linearIndexToMultiArrayRowColumn(y.dimension[0], y.dimension[1] || 1, jLin);
                const yVal = y.array[yRow][yCol] as ComplexType;
                // Map to physical indices in C
                const [cRow, cCol] = MultiArray.linearIndexToMultiArrayRowColumn(C.dimension[0], C.dimension[1], iLin + jLin * m);
                if (!C.array[cRow][cCol]) {
                    C.array[cRow][cCol] = Complex.mul(xiConj, yVal);
                } else {
                    C.array[cRow][cCol] = Complex.add(C.array[cRow][cCol] as ComplexType, Complex.mul(xiConj, yVal));
                }
            }
        }
        MultiArray.setType(C);
    };

    /**
     * ==========================
     * Level 2 BLAS: band storage
     * ==========================
     */

    /**
     * ============================
     * Level 2 BLAS: packed storage
     * ============================
     */

    /**
     * =============================================
     * Level 3 BLAS: matrix-matrix, O(n³) operations
     * =============================================
     */

    /**
     * Blocked multiplication kernel for complex matrices.
     * Multiply a sub-block of `A` and `B` and accumulate into `R`.
     *
     * Computes the block:
     *   `R[ii:iMax-1][jj:jMax-1] += A[ii:iMax-1, kk:kMax-1] * B[kk:kMax-1, jj:jMax-1]`
     *
     * @param A left matrix (`m x k`)
     * @param B right matrix (`k x n`)
     * @param R result matrix (`m x n`), updated in-place
     * @param ii..iMax row range in `A` and `R` (`i`)
     * @param jj..jMax col range in `B` and `R` / resulting columns (`j`)
     * @param kk..kMax inner dimension range (columns of `A` / rows of `B`)
     */
    public static readonly gemm_kernel = (A: ComplexType[][], B: ComplexType[][], R: ComplexType[][], ii: number, iMax: number, jj: number, jMax: number, kk: number, kMax: number): void => {
        for (let i = ii; i < iMax; i++) {
            const Ai = A[i];
            const Ri = R[i];
            for (let j = jj; j < jMax; j++) {
                let sum = Ri[j] ?? Complex.zero();
                for (let k = kk; k < kMax; k++) {
                    Complex.mulAndSumTo(sum as ComplexType, Ai[k] as ComplexType, B[k][j] as ComplexType);
                }
                Ri[j] = sum;
            }
        }
    };

    /**
     * Complex general matrix-matrix multiplication. Hybrid
     * implementation: simple for small matrices, blocked for large ones. Uses
     * `ComplexType` elements with fully preallocated rows.
     *
     * Computes:
     * > > `C := alpha * A * B + beta * C`
     *
     * Uses blocked multiplication for large matrices and simple triple loop for small ones.
     *
     * A: `m x k`, B: `k x n`, C: `m x n` - all raw `ComplexType[][]`
     * Uses blocking on k dimension and on i/j using `BLAS.settings.blockSize`.
     *
     * @param alpha scalar multiplier for `A*B`
     * @param A left matrix (`m x k`)
     * @param m number of rows of `A`
     * @param k number of columns of `A` (and rows of `B`)
     * @param B right matrix (`k x n`)
     * @param n number of columns of `B`
     * @param beta scalar multiplier for `C`
     * @param C result matrix (`m x n`), updated in-place
     */
    public static readonly gemm = (
        alpha: ComplexType,
        A: ComplexType[][],
        m: number,
        k: number,
        B: ComplexType[][],
        n: number,
        beta: ComplexType,
        C: ComplexType[][],
        blockSize?: number,
    ): void => {
        // Quick return: if alpha == 0, scale C by beta and exit
        if (Complex.realIsZero(Complex.abs(alpha))) {
            for (let i = 0; i < m; i++) {
                const Ci = C[i];
                for (let j = 0; j < n; j++) {
                    Ci[j] = Complex.mul(beta, Ci[j]);
                }
            }
            return;
        }
        // Step 1: scale C by beta if beta != 1
        if (!Complex.eq(beta, Complex.one())) {
            for (let i = 0; i < m; i++) {
                const Ci = C[i];
                for (let j = 0; j < n; j++) {
                    Ci[j] = Complex.mul(beta, Ci[j]);
                }
            }
        }
        // Step 2: determine whether to use blocking
        const useBlocking = m * k * n > BLAS.settings.blockThreshold;
        if (useBlocking) {
            // Blocked multiplication
            for (let ii = 0; ii < m; ii += blockSize ?? BLAS.settings.blockSize) {
                const iMax = Math.min(ii + (blockSize ?? BLAS.settings.blockSize), m);
                for (let kk = 0; kk < k; kk += blockSize ?? BLAS.settings.blockSize) {
                    const kMax = Math.min(kk + (blockSize ?? BLAS.settings.blockSize), k);
                    for (let jj = 0; jj < n; jj += blockSize ?? BLAS.settings.blockSize) {
                        const jMax = Math.min(jj + (blockSize ?? BLAS.settings.blockSize), n);
                        // delegate to gemm_kernel
                        BLAS.gemm_kernel(A, B, C, ii, iMax, jj, jMax, kk, kMax);
                    }
                }
            }
        } else {
            // Small matrices: simple triple loop
            for (let i = 0; i < m; i++) {
                const Ai = A[i];
                const Ci = C[i];
                for (let j = 0; j < n; j++) {
                    let sum = Complex.zero();
                    for (let kk2 = 0; kk2 < k; kk2++) {
                        Complex.mulAndSumTo(sum as ComplexType, Ai[kk2] as ComplexType, B[kk2][j] as ComplexType);
                    }
                    Ci[j] = Complex.add(Ci[j] as ComplexType, Complex.mul(alpha, sum));
                }
            }
        }
    };

    /**
     * Blocked matrix multiply (row-major):
     *
     * > > C := alpha * A * B + beta * C
     *
     * - A: m x k
     * - B: k x n
     * - C: m x n
     *
     * All matrices are raw ComplexType[][] in row-major order.
     *
     * blockSize controls the cache-tile size.
     */
    public static readonly gemm_block = (A: ComplexType[][], B: ComplexType[][], C: ComplexType[][], alpha: ComplexType, beta: ComplexType, blockSize?: number): void => {
        const m = A.length;
        const kA = A[0]?.length ?? 0;
        const kB = B.length;
        const n = B[0]?.length ?? 0;

        // dimension checks
        if (kA !== kB) {
            throw new Error('BLAS.gemm_block: inner dimensions mismatch A.cols != B.rows');
        }
        if (C.length !== m || C[0]?.length !== n) {
            throw new Error('BLAS.gemm_block: output dimension mismatch with C');
        }

        // Quick exit: alpha == 0  →  C := beta * C
        if (Complex.realIsZero(Complex.abs(alpha))) {
            if (Complex.realIsZero(Complex.abs(beta))) {
                // C := 0
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        C[i][j] = Complex.zero();
                    }
                }
            } else if (Complex.toBoolean(Complex.ne(beta, Complex.one()))) {
                // C := beta * C
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        C[i][j] = Complex.mul(beta, C[i][j]);
                    }
                }
            }
            // beta == 1 → nothing to do
            return;
        }

        const bs = Math.max(1, Math.floor(blockSize ?? BLAS.settings.blockSize));

        for (let ii = 0; ii < m; ii += bs) {
            const iEnd = Math.min(ii + bs, m);

            for (let jj = 0; jj < n; jj += bs) {
                const jEnd = Math.min(jj + bs, n);

                // Initialize C block with beta * C (or zero)
                for (let i = ii; i < iEnd; i++) {
                    for (let j = jj; j < jEnd; j++) {
                        if (Complex.realIsZero(Complex.abs(beta))) {
                            C[i][j] = Complex.zero();
                        } else if (Complex.toBoolean(Complex.ne(beta, Complex.one()))) {
                            C[i][j] = Complex.mul(beta, C[i][j]);
                        }
                    }
                }

                for (let kk = 0; kk < kA; kk += bs) {
                    const kEnd = Math.min(kk + bs, kA);

                    // Multiply sub-blocks
                    for (let i = ii; i < iEnd; i++) {
                        const Ai = A[i];
                        const Ci = C[i];

                        for (let k = kk; k < kEnd; k++) {
                            const a_ik = Ai[k];
                            if (Complex.realIsZero(Complex.abs(a_ik))) continue;

                            for (let j = jj; j < jEnd; j++) {
                                // Ci[j] += alpha * a_ik * B[k][j]
                                const prod = Complex.mul(a_ik, B[k][j]);
                                const scaled = Complex.mul(alpha, prod);
                                Ci[j] = Complex.add(Ci[j], scaled);
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * Core BLAS TRSM (row-major).
     *
     * Solves:
     *   side = 'left'  : op(A) * X = B
     *   side = 'right' : X * op(A) = B
     *
     * A must be square.
     * B is overwritten and returned as X.
     */
    public static readonly trsm = (
        A: ComplexType[][],
        B: ComplexType[][],
        opts?: {
            side?: 'left' | 'right';
            uplo?: 'upper' | 'lower';
            transA?: 'N' | 'T' | 'C';
            unitDiagonal?: boolean;
        },
    ): ComplexType[][] => {
        const side = opts?.side ?? 'left';
        const uplo = opts?.uplo ?? 'upper';
        const transA = opts?.transA ?? 'N';
        const unitDiagonal = opts?.unitDiagonal ?? false;

        const m = B.length;
        const n = B[0]?.length ?? 0;

        if (A.length !== A[0]?.length) {
            throw new Error('BLAS.trsm: A must be square.');
        }
        if ((side === 'left' && A.length !== m) || (side === 'right' && A.length !== n)) {
            throw new Error('BLAS.trsm: nonconformant dimensions.');
        }

        // X := copy(B)
        const X: ComplexType[][] = B.map((row) => row.map((v) => v));

        // op(A) accessor
        const getA = (i: number, j: number): ComplexType => {
            if (transA === 'N') return A[i][j];
            if (transA === 'T') return A[j][i];
            return Complex.conj(A[j][i]);
        };

        if (side === 'left') {
            const upper = (uplo === 'upper' && transA === 'N') || (uplo === 'lower' && transA !== 'N');

            if (upper) {
                for (let j = 0; j < n; j++) {
                    for (let i = m - 1; i >= 0; i--) {
                        let sum = X[i][j];
                        for (let k = i + 1; k < m; k++) {
                            sum = Complex.sub(sum, Complex.mul(getA(i, k), X[k][j]));
                        }
                        if (!unitDiagonal) {
                            sum = Complex.rdiv(sum, getA(i, i));
                        }
                        X[i][j] = sum;
                    }
                }
            } else {
                for (let j = 0; j < n; j++) {
                    for (let i = 0; i < m; i++) {
                        let sum = X[i][j];
                        for (let k = 0; k < i; k++) {
                            sum = Complex.sub(sum, Complex.mul(getA(i, k), X[k][j]));
                        }
                        if (!unitDiagonal) {
                            sum = Complex.rdiv(sum, getA(i, i));
                        }
                        X[i][j] = sum;
                    }
                }
            }
        } else {
            const upper = (uplo === 'upper' && transA === 'N') || (uplo === 'lower' && transA !== 'N');

            if (upper) {
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        let sum = X[i][j];
                        for (let k = 0; k < j; k++) {
                            sum = Complex.sub(sum, Complex.mul(X[i][k], getA(k, j)));
                        }
                        if (!unitDiagonal) {
                            sum = Complex.rdiv(sum, getA(j, j));
                        }
                        X[i][j] = sum;
                    }
                }
            } else {
                for (let i = 0; i < m; i++) {
                    for (let j = n - 1; j >= 0; j--) {
                        let sum = X[i][j];
                        for (let k = j + 1; k < n; k++) {
                            sum = Complex.sub(sum, Complex.mul(X[i][k], getA(k, j)));
                        }
                        if (!unitDiagonal) {
                            sum = Complex.rdiv(sum, getA(j, j));
                        }
                        X[i][j] = sum;
                    }
                }
            }
        }

        return X;
    };

    public static readonly functions: { [F in keyof BLAS]: Function } = {
        /* Level 1 BLAS: vector, O(n) operations */
        axpy: BLAS.axpy,
        scal: BLAS.scal,
        copy: BLAS.copy,
        dotu: BLAS.dotu,
        dotc: BLAS.dotc,
        nrm2sq: BLAS.nrm2sq,
        nrm2: BLAS.nrm2,
        /* Level 2 BLAS: matrix-vector, O(n²) operations */
        gemv: BLAS.gemv,
        trsv: BLAS.trsv,
        ger: BLAS.ger,
        geru: BLAS.geru,
        gerc: BLAS.gerc,
        gerc_nd: BLAS.gerc_nd,
        gerc_nd_direct: BLAS.gerc_nd_direct,
        /* Level 2 BLAS: band storage */
        /* Level 2 BLAS: packed storage */
        /* Level 3 BLAS: matrix-matrix, O(n³) operations */
        gemm_kernel: BLAS.gemm_kernel,
        gemm: BLAS.gemm,
        gemm_block: BLAS.gemm_block,
        trsm: BLAS.trsm,
    };
}

export type { ElementType };
export { BLAS };
export default { BLAS };
