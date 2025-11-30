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

/**
 * # BLAS (Basic Linear Algebra Subprograms)
 *
 * ## References
 * - https://en.wikipedia.org/wiki/Basic_Linear_Algebra_Subprograms
 * - https://www.netlib.org/blas/
 */
abstract class BLAS {
    /**
     * `BLAS` default settings.
     */
    public static readonly defaultSettings: BLASConfig = Object.assign({}, defaultSettings as BLASConfig);

    /**
     * `BLAS` current settings.
     */
    public static readonly settings: BLASConfig = BLAS.defaultSettings;

    /**
     * Set configuration options for `BLAS`.
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
     *
     * @param x `ComplexType[]` vetor (`m`)
     * @param y `ComplexType[]` vetor (`n`)
     * @param C `C` `MultiArray` [`m x n`] (complex)
     */
    public static readonly geru = (x: ComplexType[], y: ComplexType[], C: MultiArray): void => {
        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < y.length; j++) {
                Complex.mulAndSumTo(C.array[i][j] as ComplexType, x[i], y[j]);
            }
        }
    };

    /**
     * Complex rank-1 update with conjugation on `x`
     * > > `C := C + x * y^H`
     * @param x `ComplexType[]` vetor (`m`)
     * @param y `ComplexType[]` vetor (`n`)
     * @param C `MultiArray` [`m x n`] (complex)
     */
    public static readonly gerc = (x: ComplexType[], y: ComplexType[], C: MultiArray): void => {
        for (let i = 0; i < x.length; i++) {
            const xiConj = Complex.conj(x[i]); // conjugate of x[i]
            for (let j = 0; j < y.length; j++) {
                // C[i,j] += conj(x[i]) * y[j]
                Complex.mulAndSumTo(C.array[i][j] as ComplexType, xiConj, y[j]);
            }
        }
        MultiArray.setType(C);
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
     * Complex general matrix-vector multiplication.
     *
     * Computes:
     * > > `y := alpha * A * x + beta * y`
     *
     * Only internal buffers are used: matrix `A` is `ComplexType[][]`, vectors `x`
     * and `y` are `ComplexType[]`.
     * This function is optimized for row-major storage and internal BLAS use.
     * Offsets allow operating on submatrices and subvectors (as in LAPACK).
     *
     * @param A Matrix (row-major), size at least (`rowA + m`) x (`colA + n`)
     * @param m Number of rows of submatrix `A`
     * @param n Number of columns of submatrix `A`
     * @param rowA Starting row offset inside `A`
     * @param colA Starting column offset inside `A`
     * @param x Input vector (`length >= rowX + n`)
     * @param rowX Offset into vector `x`
     * @param y Vector updated in-place (`length >= rowY + m`)
     * @param rowY Offset into vector `y`
     * @param alpha Scalar
     * @param beta Scalar
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
    ): void => {
        // Step 1: scale y by beta
        if (Complex.realToNumber(Complex.eq(beta, Complex.zero()))) {
            // If beta == 0, simply zero y
            for (let i = 0; i < m; i++) {
                y[rowY + i] = Complex.zero();
            }
        } else if (Complex.realToNumber(Complex.ne(beta, Complex.one()))) {
            // If beta != 1, scale y by beta
            for (let i = 0; i < m; i++) {
                y[rowY + i] = Complex.mul(beta, y[rowY + i]);
            }
        }
        // If beta == 1, do nothing
        // Step 2: compute y += alpha * A * x
        for (let i = 0; i < m; i++) {
            let acc = Complex.zero(); // accumulator for the dot product
            const Ai = A[rowA + i];
            for (let j = 0; j < n; j++) {
                // acc += A[i,j] * x[j]
                Complex.mulAndSumTo(acc, Ai[colA + j] as ComplexType, x[rowX + j] as ComplexType);
            }
            // y[i] += alpha * acc
            Complex.mulAndSumTo(y[rowY + i], alpha, acc);
        }
    };

    /**
     * Rank-1 update `A := A + alpha * x * y^H`
     * For complex-case conjugate on second vector (gerc style).
     * A: m x n as ComplexType[][], x length m, y length n
     *
     * @param A MultiArray contendo matriz base
     * @param startRow linha inicial do bloco `A` a ser atualizado
     * @param colStart coluna inicial do bloco `A` a ser atualizado
     * @param m Comprimento do vetor `x`
     * @param n comprimento do vetor `y`
     * @param alpha
     * @param xA MultiArray contendo o vetor `x` (parte real)
     * @param xRow linha inicial do vetor `x`
     * @param xCol coluna inicial do vetor `x`
     * @param yA MultiArray contendo o vetor `y` (parte imaginária)
     * @param yRow linha inicial do vetor `y`
     * @param yCol coluna inicial do vetor `y`
     */
    public static readonly ger = (
        A: ComplexType[][],
        startRow: number,
        colStart: number,
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
        for (let i = 0; i < m; i++) {
            const xi = xA[xRow + i][xCol] as ComplexType;
            const Ai = A[startRow + i];
            for (let j = 0; j < n; j++) {
                // A[i][j] += alpha * x[i] * conj(y[j])
                Complex.mulAndSumTo(Ai[colStart + j] as ComplexType, Complex.mul(alpha, xi), Complex.conj(yA[yRow + j][yCol] as ComplexType));
            }
        }
    };

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
    public static readonly gemm = (alpha: ComplexType, A: ComplexType[][], m: number, k: number, B: ComplexType[][], n: number, beta: ComplexType, C: ComplexType[][]): void => {
        // Step 1: scale C by beta
        if (Complex.realToNumber(Complex.eq(beta, Complex.zero()))) {
            for (let i = 0; i < m; i++) {
                const Ci = C[i];
                for (let j = 0; j < n; j++) {
                    Ci[j] = Complex.zero();
                }
            }
        } else if (Complex.realToNumber(Complex.ne(beta, Complex.one()))) {
            for (let i = 0; i < m; i++) {
                const Ci = C[i];
                for (let j = 0; j < n; j++) {
                    Ci[j] = Complex.mul(beta, Ci[j]);
                }
            }
        }
        // if beta == 1, do nothing
        // Step 2: determine whether to use blocking
        const blockSize = BLAS.settings.blockSize ?? 64;
        const useBlocking = m * k * n > BLAS.settings.blockThreshold;
        if (useBlocking) {
            // Blocked multiplication
            for (let ii = 0; ii < m; ii += blockSize) {
                const iMax = Math.min(ii + blockSize, m);
                for (let kk = 0; kk < k; kk += blockSize) {
                    const kMax = Math.min(kk + blockSize, k);
                    for (let jj = 0; jj < n; jj += blockSize) {
                        const jMax = Math.min(jj + blockSize, n);
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
     *
     * @param alpha
     * @param A
     * @param startRow
     * @param endRow
     * @param col
     * @returns
     */
    public static readonly scal = (alpha: ComplexType, A: MultiArray, startRow: number, endRow: number, col: number): void => {
        if (Complex.realToNumber(Complex.eq(alpha, Complex.zero()))) {
            for (let i = startRow; i < endRow; i++) {
                A.array[i][col] = Complex.zero();
            }
            return;
        }
        if (Complex.realToNumber(Complex.eq(alpha, Complex.one()))) return;
        for (let i = startRow; i < endRow; i++) {
            A.array[i][col] = Complex.mul(A.array[i][col] as ComplexType, alpha);
        }
    };

    /**
     * Computes the Hermitian dot product of the tail of a column of A with itself.
     *
     * This function evaluates:
     *      sigma = sum_{i = startRow+1}^{m-1} conj(A[i, col]) * A[i, col]
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
        let sigma = Complex.zero();
        for (let i = startRow + 1; i < A.dimension[0]; i++) {
            Complex.mulAndSumTo(sigma, A.array[i][col] as ComplexType, Complex.conj(A.array[i][col] as ComplexType));
        }
        return sigma;
    };

    /**
     * Computes the Hermitian dot product of the tail of a row of A with itself.
     *
     * This function evaluates:
     *      sigma = sum_{j = startCol+1}^{n-1} conj(A[row, j]) * A[row, j]
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
        let sigma = Complex.zero();
        for (let j = startCol + 1; j < A.dimension[1]; j++) {
            Complex.mulAndSumTo(sigma, A.array[row][j] as ComplexType, Complex.conj(A.array[row][j] as ComplexType));
        }
        return sigma;
    };

    public static functions: { [F in keyof BLAS]: Function } = {
        geru: BLAS.geru,
        gerc: BLAS.gerc,
        gerc_nd: BLAS.gerc_nd,
        gerc_nd_direct: BLAS.gerc_nd_direct,
        gemv: BLAS.gemv,
        ger: BLAS.ger,
        gemm_kernel: BLAS.gemm_kernel,
        gemm: BLAS.gemm,
        scal: BLAS.scal,
        dotc_col: BLAS.dotc_col,
    };
}

export type { ElementType };
export { BLAS };
export default { BLAS };
