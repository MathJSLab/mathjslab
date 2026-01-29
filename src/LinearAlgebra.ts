import { type ComplexType, Complex } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';
import { LAPACK } from './LAPACK';
import { type NodeExpr, type NodeReturnList, AST, ReturnHandlerResult } from './AST';

/**
 * `LinearAlgebra` configuration options type.
 */
type LinearAlgebraConfig = {
    /**
     * LU Waste.
     */
    wasteLU: number;
    qrPhaseEpsilon: number;
};

export const LinearAlgebraConfigKeyTable: (keyof LinearAlgebraConfig)[] = ['wasteLU', 'qrPhaseEpsilon'];

const defaultSettings: Partial<LinearAlgebraConfig> = {
    wasteLU: 1e-15,
    qrPhaseEpsilon: 1e-300,
};

/**
 * # LinearAlgebra
 *
 * LinearAlgebra abstract class. Implements static methods related to linear algebra operations and algorithms.
 *
 * ## References
 *
 * * [Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/LinearAlgebra.html)
 * * [Fundamental Theorem of Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/FundamentalTheoremofLinearAlgebra.html)
 * * [Linear algebra at Wikipedia](https://en.wikipedia.org/wiki/Linear_algebra)
 */
abstract class LinearAlgebra {
    /**
     * `LinearAlgebra` default settings.
     */
    public static readonly defaultSettings: LinearAlgebraConfig = Object.assign({}, defaultSettings as LinearAlgebraConfig);

    /**
     * `LinearAlgebra` current settings.
     */
    public static readonly settings: LinearAlgebraConfig = LinearAlgebra.defaultSettings;

    /**
     * Set configuration options for `LinearAlgebra`.
     * @param config Configuration options.
     */
    public static readonly set = (config: Partial<LinearAlgebraConfig>): void => {
        const entries = Object.entries(config);
        entries.forEach((entry) => {
            if (LinearAlgebraConfigKeyTable.includes(entry[0] as keyof LinearAlgebraConfig)) {
                LinearAlgebra.settings[entry[0] as keyof LinearAlgebraConfig] = entry[1];
            } else {
                throw new Error(`LinearAlgebra.set: invalid configuration parameter: ${entry[0]}`);
            }
        });
    };

    /**
     * Identity matrix
     * @param args
     * * `eye(N)` - create identity N x N
     * * `eye(N,M)` - create identity N x M
     * * `eye([N,M])` - create identity N x M
     * @returns Identity matrix
     */
    public static readonly eye = (...args: MultiArray[] | ComplexType[]): MultiArray | ComplexType => {
        let rows: number = 0;
        let columns: number = 0;
        if (args.length === 0) {
            return Complex.one();
        } else if (args.length === 1) {
            if (MultiArray.isInstanceOf(args[0])) {
                const linear = MultiArray.linearize(args[0]) as ComplexType[];
                if (linear.length === 0) {
                    throw new SyntaxError('eye (A): use eye (size (A)) instead');
                } else if (linear.length === 1) {
                    rows = MultiArray.testIndex(linear[0]);
                    columns = rows;
                } else if (linear.length === 2) {
                    rows = MultiArray.testIndex(linear[0]);
                    columns = MultiArray.testIndex(linear[1]);
                } else {
                    throw new SyntaxError('eye (A): use eye (size (A)) instead');
                }
            } else {
                rows = MultiArray.testIndex(args[0] as ComplexType);
                columns = rows;
            }
        } else if (args.length === 2) {
            if (Complex.isInstanceOf(args[0]) && Complex.isInstanceOf(args[1])) {
                rows = MultiArray.testIndex(args[0] as ComplexType);
                columns = MultiArray.testIndex(args[1] as ComplexType);
            } else {
                AST.throwInvalidCallError('eye');
            }
        } else {
            AST.throwInvalidCallError('eye');
        }
        const result = new MultiArray([rows, columns], Complex.zero());
        for (let n = 0; n < Math.min((result as MultiArray).dimension[0], (result as MultiArray).dimension[1]); n++) {
            (result as MultiArray).array[n][n] = Complex.one();
        }
        return result;
    };

    /**
     * Return a diagonal matrix with vector V on diagonal K.
     * @param args
     * @returns
     */
    public static readonly diag = (...args: MultiArray[] | ComplexType[]): MultiArray => {
        let result: MultiArray;
        if (args.length > 0 && args.length <= 3) {
            if (MultiArray.isInstanceOf(args[0])) {
                if (args[0].dimension.length !== 2) {
                    throw new Error('Matrix must be 2-dimensional');
                }
                if (args.length === 1) {
                    if (args[0].dimension[0] === 1 && args[0].dimension[1] > 1) {
                        const n = args[0].dimension[1];
                        result = new MultiArray([n, n]);
                        result.array = LAPACK.diag(args[0].array[0] as ComplexType[]);
                    } else if (args[0].dimension[1] === 1 && args[0].dimension[0] > 1) {
                        const n = args[0].dimension[0];
                        result = new MultiArray([n, n]);
                        result.array = LAPACK.diag(args[0].array.map((row) => row[0]) as ComplexType[]);
                    } else {
                        result = MultiArray.toColumnVector(LAPACK.from_diag(args[0].array as ComplexType[][]));
                    }
                } else if (args.length === 2) {
                    const k = Math.floor(Complex.realToNumber(MultiArray.firstElement(args[1]) as ComplexType));
                    if (args[0].dimension[0] === 1 && args[0].dimension[1] > 1) {
                        const n = args[0].dimension[1];
                        result = new MultiArray([n, n]);
                        result.array = LAPACK.diag(args[0].array[0] as ComplexType[], k);
                    } else if (args[0].dimension[1] === 1 && args[0].dimension[0] > 1) {
                        const n = args[0].dimension[0];
                        result = new MultiArray([n, n]);
                        result.array = LAPACK.diag(args[0].array.map((row) => row[0]) as ComplexType[], k);
                    } else {
                        result = MultiArray.toColumnVector(LAPACK.from_diag(args[0].array as ComplexType[][], k));
                    }
                } else {
                    const m = Math.floor(Complex.realToNumber(MultiArray.firstElement(args[1]) as ComplexType));
                    const n = Math.floor(Complex.realToNumber(MultiArray.firstElement(args[2]) as ComplexType));
                    result = new MultiArray([m, n]);
                    result.array = LAPACK.diag(args[0].array[0] as ComplexType[], 0, [m, n]);
                    if (args[0].dimension[0] === 1 && args[0].dimension[1] > 1) {
                        result.array = LAPACK.diag(args[0].array[0] as ComplexType[], 0, m, n);
                    } else if (args[0].dimension[1] === 1 && args[0].dimension[0] > 1) {
                        result.array = LAPACK.diag(args[0].array.map((row) => row[0]) as ComplexType[], 0, m, n);
                    } else {
                        throw new Error('diag: V must be a vector');
                    }
                }
            } else {
                result = new MultiArray([1, 1], args[0].copy());
            }
        } else {
            AST.throwInvalidCallError('diag');
        }
        return result!;
    };

    /**
     * Sum of diagonal elements.
     * @param M Matrix.
     * @returns Trace of matrix.
     */
    public static readonly trace = (M: MultiArray): ComplexType => {
        if (M.dimension.length === 2) {
            return M.array.map((row, i) => (row[i] ? row[i] : Complex.zero())).reduce((p, c) => Complex.add(p as ComplexType, c as ComplexType), Complex.zero()) as ComplexType;
        } else {
            throw new Error('trace: only valid on 2-D objects');
        }
    };

    /**
     * Transpose and apply function.
     * @param M Matrix.
     * @returns Transpose matrix with `func` applied to each element.
     */
    private static readonly applyTranspose = (M: MultiArray, func: Function = (value: ElementType) => value): MultiArray => {
        if (M.dimension.length === 2) {
            const result = new MultiArray([M.dimension[1], M.dimension[0]]);
            for (let i = 0; i < M.dimension[1]; i++) {
                result.array[i] = new Array(M.dimension[0]);
                for (let j = 0; j < M.dimension[0]; j++) {
                    result.array[i][j] = func(M.array[j][i]).copy();
                }
            }
            MultiArray.setType(result);
            return result;
        } else {
            throw new Error('transpose not defined for N-D objects');
        }
    };

    /**
     * Transpose.
     * @param M Matrix.
     * @returns Transpose matrix.
     */
    public static readonly transpose = (M: MultiArray): MultiArray => {
        return LinearAlgebra.applyTranspose(M);
    };

    /**
     * Complex conjugate transpose.
     * @param M Matrix.
     * @returns Complex conjugate transpose matrix.
     */
    public static readonly ctranspose = (M: MultiArray): MultiArray => {
        return LinearAlgebra.applyTranspose(M, (value: ComplexType) => Complex.conj(value));
    };

    /**
     * Matrix product.
     * @param left Matrix.
     * @param right Matrix.
     * @returns left * right.
     */
    public static mul(left: MultiArray, right: MultiArray): MultiArray {
        if (left.dimension[1] !== right.dimension[0] || left.dimension.length !== 2 || right.dimension.length !== 2) {
            throw new EvalError(`operator *: nonconformant arguments (op1 is ${left.dimension.join('x')}, op2 is ${right.dimension.join('x')}).`);
        } else {
            const result = new MultiArray([left.dimension[0], right.dimension[1]]);
            BLAS.gemm(
                Complex.one(),
                left.array as ComplexType[][],
                left.dimension[0],
                left.dimension[1],
                right.array as ComplexType[][],
                right.dimension[1],
                Complex.zero(),
                result.array as ComplexType[][],
            );
            MultiArray.setType(result);
            return result;
        }
    }

    /**
     * Matrix power (multiple multiplication).
     * @param left
     * @param right
     * @returns
     */
    public static readonly power = (left: MultiArray, right: ComplexType): MultiArray => {
        let temp1;
        if (Complex.realIsInteger(right) && Complex.imagEquals(right, 0)) {
            if (Complex.realEquals(right, 0)) {
                temp1 = LinearAlgebra.eye(Complex.create(left.dimension[0], 0)) as MultiArray;
            } else if (Complex.realGreaterThan(right, 0)) {
                temp1 = MultiArray.copy(left);
            } else {
                temp1 = LinearAlgebra.inv(left);
            }
            if (Math.abs(Complex.realToNumber(right)) != 1) {
                let temp2: MultiArray;
                for (let i = 1; i < Math.abs(Complex.realToNumber(right)); i++) {
                    temp2 = new MultiArray([temp1.dimension[0], temp1.dimension[1]]); // já vem preenchido com zeros
                    BLAS.gemm(
                        Complex.one(), // alpha = 1
                        temp1.array as ComplexType[][], // A raw
                        temp1.dimension[0],
                        temp1.dimension[1],
                        temp1.array as ComplexType[][], // B raw
                        temp1.dimension[1],
                        Complex.zero(), // beta = 0 → ignora C anterior
                        temp2.array as ComplexType[][], // escreve aqui
                    );
                }
                temp1 = temp2!;
            }
            return temp1;
        } else {
            throw new Error(`exponent must be integer real in matrix '^'.`);
        }
    };

    /**
     * Matrix determinant using LU decomposition with pivot sign correction.
     * Uses `LinearAlgebra.luDecomposition`.
     * @param M Matrix.
     * @returns Matrix determinant.
     */
    public static readonly det = (M: MultiArray): ComplexType => {
        if (M.dimension.length !== 2 || M.dimension[0] !== M.dimension[1]) {
            throw new EvalError('det: matrix must be square.');
        }
        const n = M.dimension[0];
        if (n === 0) return Complex.create(1, 0);
        if (n === 1) return M.array[0][0] as ComplexType;
        if (n === 2) {
            return Complex.sub(Complex.mul(M.array[0][0] as ComplexType, M.array[1][1] as ComplexType), Complex.mul(M.array[0][1] as ComplexType, M.array[1][0] as ComplexType));
        }
        const { U, swaps } = LinearAlgebra.luDecomposition(M);
        let det = Complex.one();
        for (let i = 0; i < n; i++) {
            const piv = U.array[i][i] as ComplexType;
            if (Complex.realIsZero(Complex.abs(piv))) return Complex.zero();
            det = Complex.mul(det, piv);
        }
        if (swaps % 2 === 1) det = Complex.neg(det);
        return det;
    };

    /**
     * Computes the LU decomposition with partial pivoting.
     * @param M Input square matrix.
     * @returns An object { L, U, P, swaps } where:
     *  - L: lower-triangular with unit diagonal (MultiArray)
     *  - U: upper-triangular (MultiArray)
     *  - P: permutation matrix (MultiArray)
     *  - swaps: number of row swaps performed (integer)
     *
     * ## References
     * * https://www.codeproject.com/Articles/1203224/A-Note-on-PA-equals-LU-in-Javascript
     * * https://rosettacode.org/wiki/LU_decomposition#JavaScript
     */
    public static readonly luDecomposition = (A: MultiArray): { L: MultiArray; U: MultiArray; P: MultiArray; swaps: number } => {
        const Acopy = MultiArray.copy(A);
        // Factorization (modifies Acopy)
        const { LU, piv, swaps } = LAPACK.getrf_blocked(Acopy.array as ComplexType[][]);
        // Construct L, U, P (MATLAB style) - simple wrapper.
        const m = Acopy.dimension[0];
        const n = Acopy.dimension[1];
        const minmn = Math.min(m, n);
        // P: identity then apply pivots
        const P = LinearAlgebra.eye(Complex.create(m)) as MultiArray;
        for (let i = 0; i < minmn; i++) {
            if (piv[i] !== i) {
                LAPACK.laswp_rows(P.array as ComplexType[][], P.dimension, i, piv[i]);
            }
        }
        // Build L and U explicitly if needed (as you had before)
        const L = new MultiArray([m, m]);
        const U = new MultiArray([m, n]);
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (i > j) {
                    L.array[i][j] = Acopy.array[i][j] as any;
                    U.array[i][j] = Complex.zero();
                } else if (i === j) {
                    L.array[i][j] = Complex.one();
                    U.array[i][j] = Acopy.array[i][j] as any;
                } else {
                    L.array[i][j] = Complex.zero();
                    U.array[i][j] = Acopy.array[i][j] as any;
                }
            }
        }
        return { L, U, P, swaps };
    };

    /**
     * PLU matrix factorization.
     * @param M Matrix.
     * @returns L, U and P matrices as multiple output.
     */
    public static readonly lu = (M: MultiArray): NodeReturnList => {
        if (!M || M.dimension.length !== 2 || M.dimension[0] !== M.dimension[1]) {
            throw new Error(`PLU decomposition can only be applied to square matrices.`);
        }
        return AST.nodeReturnList(
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                if (evaluated.length === 1) {
                    return evaluated.U;
                } else {
                    switch (index) {
                        case 0:
                            return evaluated.L;
                        case 1:
                            return evaluated.U;
                        case 2:
                            return evaluated.P;
                    }
                }
            },
            (length: number): ReturnHandlerResult => {
                const { L, U, P } = LinearAlgebra.luDecomposition(M);
                return { length, L, U, P };
            },
        );
    };

    /**
     * Returns the inverse of matrix `M`.
     * inv(A) wrapper using LAPACK.getrf_blocked + LAPACK.getrs.
     * Behavior: MATLAB-like: if factorization reports info !== 0, emit warning and return matrix filled with Inf.
     * @param M Matrix.
     * @returns Inverted matrix.
     */
    public static readonly inv = (A: MultiArray): MultiArray => {
        /* Validate input: square matrix */
        if (!A || A.dimension.length !== 2 || A.dimension[0] !== A.dimension[1]) {
            throw new Error('inv: matrix must be square.');
        }
        // shallow copy to avoid modifying user's matrix
        const Acopy = MultiArray.copy(A) as MultiArray;
        // perform LU (blocked)
        const { LU, piv, info, swaps } = LAPACK.getrf_blocked(Acopy.array as ComplexType[][]);
        // if singular (info != 0) follow MATLAB-like behavior: return Inf matrix
        if (info !== 0) {
            const n = A.dimension[0];
            const result = new MultiArray([n, n]);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    // create complex infinity (real Inf)
                    result.array[i][j] = Complex.inf_0();
                }
            }
            MultiArray.setType(result);
            return result;
        } else {
            // Otherwise compute inverse by solving A * X = I
            const n = A.dimension[0];
            // const I = LinearAlgebra.eye(Complex.create(n)) as MultiArray; // ensure returns MultiArray n x n
            const I = LAPACK.eye([n, n]);
            // Solve LU * X = P * I  -> we use getrs: X = inv(A)
            const getrsResult = LAPACK.getrs(LU as ComplexType[][], piv, I);
            const result = new MultiArray([getrsResult.length, getrsResult[0].length]);
            result.array = getrsResult;
            MultiArray.setType(result);
            return result;
        }
    };

    /**
     * Gaussian elimination algorithm for solving systems of linear equations.
     * Adapted from: https://github.com/itsravenous/gaussian-elimination
     * ## References
     * * https://mathworld.wolfram.com/GaussianElimination.html
     * @param M Matrix.
     * @param m Vector.
     * @returns Solution of linear system.
     */
    public static readonly gauss = (M: MultiArray, m: MultiArray): MultiArray => {
        if (M.dimension.length > 2 || M.dimension[0] !== M.dimension[1]) {
            throw new Error(`invalid dimensions in function gauss.`);
        }
        const A: MultiArray = MultiArray.copy(M);
        let i: number, k: number, j: number;
        const DMin = Math.min(m.dimension[0], m.dimension[1]);
        if (DMin === m.dimension[1]) {
            m = LinearAlgebra.transpose(m);
        }
        /* Just make a single matrix */
        for (i = 0; i < A.dimension[0]; i++) {
            A.array[i].push(m.array[0][i]);
        }
        const n = A.dimension[0];
        for (i = 0; i < n; i++) {
            /* Search for maximum in this column */
            let maxEl = Complex.abs(A.array[i][i] as ComplexType),
                maxRow = i;
            for (k = i + 1; k < n; k++) {
                if (Complex.realGreaterThan(Complex.abs(A.array[k][i] as ComplexType), maxEl.re)) {
                    maxEl = Complex.abs(A.array[k][i] as ComplexType);
                    maxRow = k;
                }
            }
            /* Swap maximum row with current row (column by column) */
            for (k = i; k < n + 1; k++) {
                const tmp = A.array[maxRow][k];
                A.array[maxRow][k] = A.array[i][k];
                A.array[i][k] = tmp;
            }
            /* Make all rows below this one 0 in current column */
            for (k = i + 1; k < n; k++) {
                const c = Complex.rdiv(Complex.neg(A.array[k][i] as ComplexType), A.array[i][i] as ComplexType);
                for (j = i; j < n + 1; j++) {
                    if (i === j) {
                        A.array[k][j] = Complex.zero();
                    } else {
                        A.array[k][j] = Complex.add(A.array[k][j] as ComplexType, Complex.mul(c, A.array[i][j] as ComplexType));
                    }
                }
            }
        }
        /* Solve equation Mx=m for an upper triangular matrix M */
        const X = new MultiArray([1, n], Complex.zero());
        for (i = n - 1; i > -1; i--) {
            X.array[0][i] = Complex.rdiv(A.array[i][n] as ComplexType, A.array[i][i] as ComplexType);
            for (k = i - 1; k > -1; k--) {
                A.array[k][n] = Complex.sub(A.array[k][n] as ComplexType, Complex.mul(A.array[k][i] as ComplexType, X.array[0][i] as ComplexType));
            }
        }
        MultiArray.setType(X);
        return X;
    };

    /**
     * High-performance dot product. Fully ND-aware, column-major, no index
     * conversions (≈2-3× faster). Computes sum(conj(A).*B, dim) with minimal
     * per-element overhead.
     * C = dot(A,B) or C = dot(A,B,dim)
     * Sums conj(A).*B along the specified dimension (zero-based operateDim). If dim is omitted,
     * use the first non-singleton dimension (zero-based).
     * @param A First array (MultiArray).
     * @param B Second array (MultiArray).
     * @param dim (optional) Dimension along which to operate (ComplexType representing integer, 1-based externally).
     * @returns Scalar (ComplexType) if result is single value, else a MultiArray.
     */
    public static readonly dot = (A: MultiArray, B: MultiArray, dim?: ComplexType): MultiArray | ComplexType => {
        /* validation */
        if (!MultiArray.arrayEquals(A.dimension, B.dimension)) {
            throw new Error('dot: A and B must have the same size.');
        }
        /* determine operateDim (zero-based) */
        let operateDim: number;
        if (typeof dim !== 'undefined') {
            operateDim = MultiArray.testIndex(dim, 'dot') - 1;
        } else {
            operateDim = MultiArray.firstNonSingleDimension(A);
        }
        if (operateDim < 0 || operateDim >= A.dimension.length) {
            throw new Error('dot: dimension argument out of range.');
        }
        const dims = A.dimension;
        const ndims = dims.length;
        const totalElements = dims.reduce((p, c) => p * c, 1);
        /* compute original strides (column-major): stride[k] = product(dims[0..k-1]) */
        const stride: number[] = new Array(ndims);
        stride[0] = 1;
        for (let k = 1; k < ndims; k++) stride[k] = stride[k - 1] * dims[k - 1];
        /* output dims (same rank, operateDim size = 1) */
        const outDim = [...dims];
        outDim[operateDim] = 1;
        const outSize = outDim.reduce((p, c) => p * c, 1);
        /* compute outStrides for output linear indexing */
        const outStride: number[] = new Array(ndims);
        outStride[0] = 1;
        for (let k = 1; k < ndims; k++) outStride[k] = outStride[k - 1] * outDim[k - 1];
        /* Prepare result and preallocate physical storage */
        const result = new MultiArray(outDim);
        const tailProd = outDim.slice(2).reduce((p, c) => p * c, 1);
        const resultPhysicalRows = outDim[0] * Math.max(1, tailProd);
        const resultPhysicalCols = outDim[1] ?? 1;
        result.array = new Array(resultPhysicalRows);
        for (let r = 0; r < resultPhysicalRows; r++) result.array[r] = new Array(resultPhysicalCols);
        /* precompute page lengths (for mapping linear -> (row,col)) */
        const pageLengthA = dims[0] * dims[1];
        const pageLengthOut = outDim[0] * outDim[1];
        /* main loop: for each linear index compute per-dim coords and out linear index */
        for (let linIdx = 0; linIdx < totalElements; linIdx++) {
            /* compute per-dimension index (0-based) and out linear index incrementally */
            let outLin = 0;
            /* Note: using integer division repeatedly; this is cheap for small ndims */
            for (let k = 0; k < ndims; k++) {
                const idx_k = Math.floor(linIdx / stride[k]) % dims[k]; /* 0-based subscript along dim k */
                if (k !== operateDim) {
                    outLin += idx_k * outStride[k];
                }
            }
            /* map full linear index -> physical (aRow, aCol) using page arithmetic */
            const pageA = Math.floor(linIdx / pageLengthA);
            const indexPageA = linIdx - pageA * pageLengthA; /* linIdx % pageLengthA */
            const aRow = pageA * dims[0] + (indexPageA % dims[0]);
            const aCol = Math.floor(indexPageA / dims[0]);
            /* defensive checks */
            if (!A.array[aRow] || typeof A.array[aRow][aCol] === 'undefined') {
                throw new Error(`dot_fast: invalid access to A at physical [${aRow},${aCol}] (linIdx=${linIdx}).`);
            }
            if (!B.array[aRow] || typeof B.array[aRow][aCol] === 'undefined') {
                throw new Error(`dot_fast: invalid access to B at physical [${aRow},${aCol}] (linIdx=${linIdx}).`);
            }
            const aVal = A.array[aRow][aCol] as ComplexType;
            const bVal = B.array[aRow][aCol] as ComplexType;
            const prod = Complex.mul(Complex.conj(aVal), bVal);
            /* map outLin -> physical (rRow, rCol) for result using out page arithmetic */
            const pageOut = Math.floor(outLin / pageLengthOut);
            const indexPageOut = outLin - pageOut * pageLengthOut;
            const rRow = pageOut * outDim[0] + (indexPageOut % outDim[0]);
            const rCol = Math.floor(indexPageOut / outDim[0]);
            /* accumulate into result */
            if (typeof result.array[rRow][rCol] === 'undefined' || result.array[rRow][rCol] === null) {
                result.array[rRow][rCol] = Complex.copy(prod);
            } else {
                result.array[rRow][rCol] = Complex.add(result.array[rRow][rCol] as ComplexType, prod);
            }
        }
        MultiArray.setType(result);
        if (outSize === 1) {
            return result.array[0][0] as ComplexType;
        }
        return result;
    };

    /**
     * Cross product along dimension `dim` (MATLAB semantics).
     * A and B must have the same size except along `dim` where size must be 3.
     * dim is optional and is 1-based like MATLAB; internally converted to 0-based.
     * @param A
     * @param B
     * @param dim
     * @returns
     */
    public static readonly cross = (A: MultiArray, B: MultiArray, dim?: any): MultiArray => {
        /* Copy original dimension arrays */
        const adimOrig = A.dimension.slice();
        const bdimOrig = B.dimension.slice();
        /* Determine operation dimension (MATLAB: dim is 1-based) */
        let dZero: number | undefined;
        if (typeof dim !== 'undefined') {
            /* Accept a few shapes for dim:
             * - a plain number (1-based)
             * - a MultiArray scalar (extract its first element)
             * - a ComplexType-like object (use its real part if present)
             * - anything coercible to Number(...) */
            let numericDim: number | undefined;
            /* If looks like a MultiArray (heuristic: has 'dimension' or 'array' properties) */
            if (typeof dim === 'object' && dim !== null && ('dimension' in dim || 'array' in dim)) {
                try {
                    /* attempt to linearize and read first element */
                    const lin = MultiArray.linearize(dim as MultiArray);
                    if (lin && lin.length > 0) {
                        const first = lin[0];
                        /* If ComplexType-like, prefer real part */
                        if (first && typeof first === 'object' && 're' in first) {
                            numericDim = Number((first as any).re);
                        } else {
                            numericDim = Number(first);
                        }
                    } else {
                        numericDim = undefined;
                    }
                } catch (e) {
                    numericDim = undefined;
                }
            } else if (typeof dim === 'object' && dim !== null && 're' in dim) {
                /* Complex-like scalar (e.g. { re, im }) */
                numericDim = Number((dim as any).re);
            } else {
                /* fallback: try primitive coercion */
                numericDim = Number(dim);
            }
            /* Validate numericDim */
            if (typeof numericDim === 'undefined' || !Number.isFinite(numericDim)) {
                throw new EvalError(`cross: invalid dimension ${String(dim)}.`);
            }
            /* floor just in case and require >= 1 (MATLAB 1-based) */
            const di = Math.floor(numericDim);
            if (di < 1) {
                throw new EvalError(`cross: invalid dimension ${String(dim)}.`);
            }
            dZero = di - 1;
        }
        /* Normalize number of dimensions to compare sizes safely: */
        const maxDim = Math.max(adimOrig.length, bdimOrig.length, dZero !== undefined ? dZero + 1 : 0);
        const adim = adimOrig.slice();
        const bdim = bdimOrig.slice();
        while (adim.length < maxDim) adim.push(1);
        while (bdim.length < maxDim) bdim.push(1);
        /* If dimension not specified, pick the first dimension of length 3 */
        if (typeof dZero === 'undefined') {
            dZero = adim.findIndex((v) => v === 3);
            if (dZero === -1) {
                throw new EvalError('cross: no dimension of length 3 found and dim not specified.');
            }
        }
        /* Check sizes equal except along dZero */
        for (let k = 0; k < maxDim; k++) {
            if (k === dZero) continue;
            if (adim[k] !== bdim[k]) {
                throw new EvalError(`cross: A and B must have the same size, except along the operation dimension.`);
            }
        }
        /* Sizes along operation dimension (treat missing as 1) */
        const aLen = adim[dZero] ?? 1;
        const bLen = bdim[dZero] ?? 1;
        if (aLen !== 3 || bLen !== 3) {
            throw new EvalError(`cross: inputs must have length 3 along the operation dimension (got ${aLen} and ${bLen}).`);
        }
        /* Linearize inputs for fast read, */
        /* and prepare an output linear buffer */
        const Ac = MultiArray.linearize(A) as ComplexType[]; /* read-only linear view */
        const Bc = MultiArray.linearize(B) as ComplexType[];
        const total = Ac.length;
        const Cc = new Array<ComplexType | undefined>(total);
        /* Compute stride (column-major): number of elements between successive indices along dim. */
        const stride = adim.slice(0, dZero).reduce((p, c) => p * c, 1);
        /* Elements per full 3-vector along the chosen dimension */
        const blockLen = adim[dZero]; /* should be 3 */
        /* Number of independent cross-product groups */
        const groupSize = stride * blockLen;
        const groups = Math.floor(total / groupSize);
        /* Defensive sanity check */
        if (blockLen !== 3) {
            throw new EvalError(`cross: internal error, block length along dim ${dZero + 1} must be 3.`);
        }
        /* Compute cross product into linear buffer Cc */
        for (let g = 0; g < groups; g++) {
            const base = g * groupSize;
            for (let i = 0; i < stride; i++) {
                const idx1 = base + 0 * stride + i;
                const idx2 = base + 1 * stride + i;
                const idx3 = base + 2 * stride + i;
                Cc[idx1] = Complex.sub(Complex.mul(Ac[idx2], Bc[idx3]), Complex.mul(Ac[idx3], Bc[idx2]));
                Cc[idx2] = Complex.sub(Complex.mul(Ac[idx3], Bc[idx1]), Complex.mul(Ac[idx1], Bc[idx3]));
                Cc[idx3] = Complex.sub(Complex.mul(Ac[idx1], Bc[idx2]), Complex.mul(Ac[idx2], Bc[idx1]));
            }
        }
        /* Build result MultiArray C with the original adimOrig shape (do not change original adim order) */
        const C = new MultiArray(adimOrig);
        /* Ensures layout consistency (column-major). */
        if (C.dimension.length === 1) C.dimension.push(1);
        /* Fill C.array directly by linear conversion → (r,c). */
        for (let lin = 0; lin < Ac.length; lin++) {
            const [r, c] = MultiArray.linearIndexToMultiArrayRowColumn(C.dimension[0], C.dimension[1], lin);
            C.array[r][c] = Cc[lin] ?? Complex.zero();
        }
        MultiArray.setType(C);
        return C;
    };

    /**
     *
     * @param A
     * @param B
     * @returns
     */
    public static readonly kron = (A: MultiArray, B: MultiArray): MultiArray => {
        // Validate input dimensions
        if (!A || A.dimension.length < 2 || !B || B.dimension.length < 2) {
            throw new Error('kron: inputs must be at least 2-D arrays');
        }
        const m = A.dimension[0];
        const n = A.dimension[1];
        const p = B.dimension[0];
        const q = B.dimension[1];
        // Create result dimension
        const Cdim = [m * p, n * q];
        const C = new MultiArray(Cdim);
        // Compute Kronecker product
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const aij = A.array[i][j] as ComplexType;
                for (let i2 = 0; i2 < p; i2++) {
                    for (let j2 = 0; j2 < q; j2++) {
                        const bij = B.array[i2][j2] as ComplexType;
                        const value = Complex.mul(aij, bij);
                        C.array[i * p + i2][j * q + j2] = value;
                    }
                }
            }
        }
        MultiArray.setType(C);
        return C;
    };

    /**
     * Normalize phases so that R diagonal becomes real non-negative:
     * For k = 0..minmn-1:
     *   phi = R[k][k] / |R[k][k]|
     *   R[k, j] := R[k, j] / phi   (j = k..n-1)
     *   Q[i, k] := Q[i, k] * phi   (i = 0..m-1)
     * @param Q
     * @param R
     * @param phis
     */
    public static readonly qrPhaseNormalize = (phis: ComplexType[], R: MultiArray, Q?: MultiArray): void => {
        const kmax = Math.min(R.dimension[0], R.dimension[1]);
        for (let k = 0; k < kmax; k++) {
            if (Complex.realIsZero(Complex.abs(R.array[k][k] as ComplexType))) continue; // nothing to normalize
            const phi = Complex.neg(phis[k]);
            // divide row k, columns k..n-1 by phi  (R[k,*] := R[k,*] / phi)
            for (let j = k; j < R.dimension[1]; j++) {
                R.array[k][j] = Complex.rdiv(R.array[k][j] as ComplexType, phi);
            }
            if (typeof Q !== 'undefined') {
                // multiply column k of Q by phi (Q[:,k] := Q[:,k] * phi)
                for (let i = 0; i < Q.dimension[0]; i++) {
                    Q.array[i][k] = Complex.mul(Q.array[i][k] as ComplexType, phi);
                }
            }
        }
        if (Complex.imagGreaterThan(Complex.abs(R.array[0][0] as ComplexType), LinearAlgebra.settings.qrPhaseEpsilon)) {
            throw new Error('Phase normalization error: R(1,1) should be real.');
        }
        if (Complex.realGreaterThan(R.array[0][0] as ComplexType, 0)) {
            // apply signal flip
            // R(1,:) *= -1
            for (let j = 0; j < R.dimension[1]; j++) {
                R.array[0][j] = Complex.neg(R.array[0][j] as ComplexType);
            }
            if (typeof Q !== 'undefined') {
                // Q(:,1) *= -1
                for (let i = 0; i < Q.dimension[0]; i++) {
                    Q.array[i][0] = Complex.neg(Q.array[i][0] as ComplexType);
                }
            }
        }
    };

    // public static readonly lqPhaseNormalize = (
    //     phis: ComplexType[],
    //     L: MultiArray,
    //     Q?: MultiArray
    // ): void => {
    //     const kmax = Math.min(L.dimension[0], L.dimension[1]);

    //     for (let k = 0; k < kmax; k++) {
    //         const Lkk = L.array[k][k] as ComplexType;
    //         if (Complex.realIsZero(Complex.abs(Lkk))) continue;

    //         // phi = -phase(L[k,k])
    //         const phi = Complex.neg(phis[k]);

    //         // Divide column k of L by phi: L[:,k] := L[:,k] / phi
    //         for (let i = k; i < L.dimension[0]; i++) {
    //             L.array[i][k] = Complex.rdiv(L.array[i][k] as ComplexType, phi);
    //         }

    //         if (typeof Q !== 'undefined') {
    //             // Multiply row k of Q by phi: Q[k,:] := Q[k,:] * phi
    //             for (let j = 0; j < Q.dimension[1]; j++) {
    //                 Q.array[k][j] = Complex.mul(Q.array[k][j] as ComplexType, phi);
    //             }
    //         }
    //     }

    //     // Sanity checks (simétricos ao QR)
    //     if (
    //         Complex.imagGreaterThan(
    //             Complex.abs(L.array[0][0] as ComplexType),
    //             LinearAlgebra.settings.qrPhaseEpsilon
    //         )
    //     ) {
    //         throw new Error('Phase normalization error: L(1,1) should be real.');
    //     }

    //     // Canonical sign: L(1,1) should be negative real (same convention as QR)
    //     if (Complex.realGreaterThan(L.array[0][0] as ComplexType, 0)) {
    //         // L(:,1) *= -1
    //         for (let i = 0; i < L.dimension[0]; i++) {
    //             L.array[i][0] = Complex.neg(L.array[i][0] as ComplexType);
    //         }

    //         if (typeof Q !== 'undefined') {
    //             // Q(1,:) *= -1
    //             for (let j = 0; j < Q.dimension[1]; j++) {
    //                 Q.array[0][j] = Complex.neg(Q.array[0][j] as ComplexType);
    //             }
    //         }
    //     }
    // };

    // public static readonly lqPhaseNormalize = (
    //     phis: ComplexType[],
    //     L: MultiArray,
    //     Q?: MultiArray
    // ): void => {
    //     const kmax = Math.min(L.dimension[0], L.dimension[1]);

    //     for (let k = 0; k < kmax; k++) {
    //         const Lkk = L.array[k][k] as ComplexType;
    //         if (Complex.realIsZero(Complex.abs(Lkk))) continue;

    //         // phi = -phase(L[k,k])
    //         const phi = Complex.neg(phis[k]);

    //         // ✅ FIX 1: divide *entire* column k of L
    //         for (let i = 0; i < L.dimension[0]; i++) {
    //             L.array[i][k] = Complex.rdiv(L.array[i][k] as ComplexType, phi);
    //         }

    //         if (typeof Q !== 'undefined') {
    //             // Multiply row k of Q by phi
    //             for (let j = 0; j < Q.dimension[1]; j++) {
    //                 Q.array[k][j] = Complex.mul(Q.array[k][j] as ComplexType, phi);
    //             }
    //         }
    //     }

    //     // ✅ FIX 2: correct sanity check
    //     if (
    //         Complex.imagGreaterThan(
    //             L.array[0][0] as ComplexType,
    //             LinearAlgebra.settings.qrPhaseEpsilon
    //         )
    //     ) {
    //         throw new Error('Phase normalization error: L(1,1) should be real.');
    //     }

    //     // Canonical sign (engine convention)
    //     if (Complex.realGreaterThan(L.array[0][0] as ComplexType, 0)) {
    //         // L(:,1) *= -1
    //         for (let i = 0; i < L.dimension[0]; i++) {
    //             L.array[i][0] = Complex.neg(L.array[i][0] as ComplexType);
    //         }

    //         if (typeof Q !== 'undefined') {
    //             // Q(1,:) *= -1
    //             for (let j = 0; j < Q.dimension[1]; j++) {
    //                 Q.array[0][j] = Complex.neg(Q.array[0][j] as ComplexType);
    //             }
    //         }
    //     }
    // };

    // public static readonly lqPhaseNormalize = (
    //     phis: ComplexType[],
    //     L: MultiArray,
    //     Q?: MultiArray
    // ): void => {
    //     const kmax = Math.min(L.dimension[0], L.dimension[1]);

    //     for (let k = 0; k < kmax; k++) {
    //         const phi = phis[k];
    //         if (Complex.realIsZero(Complex.abs(phi))) continue;

    //         // ✅ LQ: phase acts on ROW k of L
    //         for (let j = 0; j < L.dimension[1]; j++) {
    //             L.array[k][j] = Complex.mul(L.array[k][j] as ComplexType, phi);
    //         }

    //         if (Q) {
    //             const phiConj = Complex.conj(phi);
    //             // ✅ and on COLUMN k of Q
    //             for (let i = 0; i < Q.dimension[0]; i++) {
    //                 Q.array[i][k] = Complex.mul(Q.array[i][k] as ComplexType, phiConj);
    //             }
    //         }
    //     }
    // };

    public static readonly lqPhaseNormalize = (phis: ComplexType[], L: MultiArray, Q?: MultiArray): void => {
        const kmax = Math.min(L.dimension[0], L.dimension[1]);

        for (let k = 0; k < kmax; k++) {
            const phi = phis[k];
            if (Complex.realIsZero(Complex.abs(phi))) continue;

            // 🔧 APPLY PHASE ONLY FROM DIAGONAL TO THE RIGHT
            for (let j = k; j < L.dimension[1]; j++) {
                L.array[k][j] = Complex.mul(L.array[k][j] as ComplexType, phi);
            }

            if (Q) {
                const phiConj = Complex.conj(phi);
                // ✅ APPLY TO COLUMN k OF Q
                for (let i = 0; i < Q.dimension[0]; i++) {
                    Q.array[i][k] = Complex.mul(Q.array[i][k] as ComplexType, phiConj);
                }
            }
        }
    };

    /**
     *
     * @param A
     * @param result
     * @returns
     */
    public static readonly qrDecomposition = (A: MultiArray, result: 1 | 2 | 3): { Q?: MultiArray; R: MultiArray; P?: MultiArray } => {
        switch (result) {
            case 1: {
                const { R, phis } = LAPACK.geqr2(A);
                if (MultiArray.haveAnyComplex(R)) {
                    LinearAlgebra.qrPhaseNormalize(phis, R);
                }
                return { R };
            }
            case 2: {
                const { R, taus, phis } = LAPACK.geqr2(A);
                const Q = LAPACK.orgqr(R, taus);
                LAPACK.triu_inplace(R);
                if (MultiArray.haveAnyComplex(R)) {
                    LinearAlgebra.qrPhaseNormalize(phis, R, Q);
                }
                return { Q, R };
            }
            case 3: {
                const { R, taus, phis, jpvt } = LAPACK.geqp3(A);
                const Q = LAPACK.orgqr(R, taus);
                LAPACK.triu_inplace(R);
                const P = LAPACK.lapmt_matrix(jpvt);
                if (MultiArray.haveAnyComplex(R)) {
                    LinearAlgebra.qrPhaseNormalize(phis, R, Q);
                }
                return { Q, R, P };
            }
        }
    };

    /**
     *
     * @param M
     * @returns
     */
    public static readonly qr = (M: MultiArray): NodeReturnList => {
        // Validate input
        if (!M || M.dimension.length !== 2) {
            throw new Error(`QR decomposition can only be applied to 2D matrices.`);
        }
        return AST.nodeReturnList(
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                if (evaluated.length === 1) {
                    if (index === 0) {
                        return evaluated.R;
                    }
                } else if (evaluated.length === 2) {
                    if (index === 0) {
                        return evaluated.Q;
                    } else if (index === 1) {
                        return evaluated.R;
                    }
                } else if (evaluated.length === 3) {
                    if (index === 0) {
                        return evaluated.Q;
                    } else if (index === 1) {
                        return evaluated.R;
                    } else if (index === 2) {
                        return evaluated.P;
                    }
                }
            },
            (length: number): ReturnHandlerResult => {
                AST.throwErrorIfGreaterThanReturnList(3, length);
                if (length === 1) {
                    const { R } = LinearAlgebra.qrDecomposition(M, 1);
                    return {
                        length,
                        R,
                    };
                } else if (length === 2) {
                    const { Q, R } = LinearAlgebra.qrDecomposition(M, 2);
                    return {
                        length,
                        R,
                        Q,
                    };
                } else {
                    const { Q, R, P } = LinearAlgebra.qrDecomposition(M, 3);
                    return {
                        length,
                        R,
                        Q,
                        P,
                    };
                }
            },
        );
    };

    /**
     * Eigenvalue decomposition wrapper - similar à qrDecomposition.
     * Retorno varia com o parâmetro `result`:
     *   1 → λ
     *   2 → V, λ
     *   3 → V, λ, T (tridiagonal)
     */
    /**
     * eigDecomposition - wrapper that performs eigen decomposition using blocked tridiagonalization.
     *
     * Returns object depending on `result`:
     *  1 -> { values: MultiArray }            (column vector n x 1)
     *  2 -> { values: MultiArray, vectors: MultiArray }  (vectors columns = eigenvectors)
     *  3 -> { values: MultiArray, vectors: MultiArray, T: MultiArray } (T = tridiagonal matrix)
     *
     * Uses:
     *  - LAPACK.sytrd_blocked_w(Acopy, nb) -> { diag: ComplexType[], offdiag: ComplexType[], taus: ComplexType[] }
     *  - LAPACK.steqr_values(diag, offdiag) -> ComplexType[]
     *  - LAPACK.steqr_vectors(diag, offdiag) -> { D: ComplexType[], V: MultiArray }
     *  - LAPACK.orgtr_blocked_w(Acopy, taus, nb) -> MultiArray Q0
     *  - BLAS.gemm_block(Q0, Z, Vout, Complex.one(), Complex.zero(), nb)
     */
    /**
     * eigDecomposition - wrapper that performs eigen decomposition using blocked tridiagonalization.
     *
     * Returns object depending on `result`:
     *  1 -> { values: MultiArray }                          (column vector n x 1)
     *  2 -> { values: MultiArray, vectors: MultiArray }     (vectors columns = eigenvectors)
     *  3 -> { values: MultiArray, vectors: MultiArray, T: MultiArray } (T = tridiagonal matrix)
     *
     * Uses:
     *  - LAPACK.sytrd_blocked_w(Acopy, nb) -> { diag: ComplexType[], offdiag: ComplexType[], taus: ComplexType[] }
     *  - LAPACK.steqr_values(diag, offdiag) -> ComplexType[]
     *  - LAPACK.steqr_vectors(diag, offdiag) -> { D: ComplexType[], V: MultiArray }
     *  - LAPACK.orgtr_blocked_w(Acopy, taus, nb) -> MultiArray Q0
     *  - BLAS.gemm_block(Q0, Z, Vout, Complex.one(), Complex.zero(), nb)
     */
    /**
     * eigDecomposition - updated to use steqr_values/steqr_vectors returning MultiArray
     *
     * Returns:
     *  result === 1 -> { values: MultiArray }
     *  result === 2 -> { values: MultiArray, vectors: MultiArray }
     *  result === 3 -> { values: MultiArray, vectors: MultiArray, T: MultiArray }
     */
    public static readonly eigDecomposition_original = (
        A: MultiArray,
        result: 1 | 2 | 3,
        nb: number = 32,
        order: 'asc' | 'desc' | 'none' = 'asc',
    ): { values: MultiArray; vectors?: MultiArray; T?: MultiArray } => {
        // basic validation
        if (!A || !A.dimension || A.dimension.length !== 2) {
            throw new Error('eigDecomposition: A must be a 2D MultiArray');
        }
        const n: number = A.dimension[0];
        if (n !== A.dimension[1]) throw new Error('eigDecomposition: A must be square');

        // Work on a copy because sytrd modifies in-place
        const Acopy = MultiArray.copy(A) as MultiArray;

        // 1) Reduce to tridiagonal: diag (ComplexType[]), offdiag (ComplexType[]), taus
        const { diag, offdiag, taus } = LAPACK.sytrd_blocked_w(Acopy, nb);
        if (!Array.isArray(diag) || !Array.isArray(offdiag)) {
            throw new Error('eigDecomposition: sytrd_blocked_w did not return diag/offdiag arrays');
        }

        // ---------------------------
        // CASE 1: only eigenvalues
        // ---------------------------
        if (result === 1) {
            const D_col = MultiArray.toColumnVector(LAPACK.steqr_values(diag, offdiag));
            if (!D_col || !D_col.array || D_col.dimension[0] !== n) {
                throw new Error('eigDecomposition: steqr_values returned invalid MultiArray');
            }

            // If no sorting requested, return directly
            if (order === 'none') {
                MultiArray.setType(D_col);
                return { values: D_col };
            }

            // otherwise build index array and sort by numeric real part
            const Draw: ComplexType[] = new Array(n);
            for (let i = 0; i < n; i++) Draw[i] = D_col.array[i][0] as ComplexType;

            const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
                const ai = Complex.realToNumber(Draw[a]);
                const bi = Complex.realToNumber(Draw[b]);
                return order === 'asc' ? ai - bi : bi - ai;
            });

            // build sorted MultiArray column using helper
            const D_sorted_vals: ComplexType[] = idx.map((i) => Draw[i]);
            const D_sorted = MultiArray.toColumnVector(D_sorted_vals);
            MultiArray.setType(D_sorted);
            return { values: D_sorted };
        } else {
            // CASE 2 or 3: need eigenvectors too
            const tridiagRes = LAPACK.steqr_vectors(diag, offdiag);
            // tridiagRes.D is a MultiArray [n x 1], tridiagRes.V is MultiArray [n x n]
            if (!tridiagRes || !tridiagRes.D || !tridiagRes.V) {
                throw new Error('eigDecomposition: steqr_vectors returned invalid result');
            }
            const Dcol_raw: MultiArray = MultiArray.toDiagonalMatrix(tridiagRes.D);
            const Z: MultiArray = new MultiArray([tridiagRes.V.length, tridiagRes.V[0].length]);
            Z.array = tridiagRes.V;

            if (Dcol_raw.dimension[0] !== n) {
                throw new Error('eigDecomposition: steqr_vectors returned D of unexpected size');
            }
            if (Z.dimension[0] !== n || Z.dimension[1] !== n) {
                throw new Error('eigDecomposition: steqr_vectors returned V of unexpected shape');
            }

            // Reconstruct Q0 and form Vout = Q0 * Z
            const Q0 = LAPACK.orgtr_blocked_w(Acopy, taus, nb); // MultiArray n x n
            const Vout = new MultiArray([n, n]);
            // init zeros (defensive)
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Vout.array[i][j] = Complex.zero();

            BLAS.gemm_block(Q0.array as ComplexType[][], Z.array as ComplexType[][], Vout.array as ComplexType[][], Complex.one(), Complex.zero(), nb);
            MultiArray.setType(Vout);

            // extract eigenvalue list from Dcol_raw
            const Draw2: ComplexType[] = new Array(n);
            for (let i = 0; i < n; i++) Draw2[i] = Dcol_raw.array[i][0] as ComplexType;

            // sorting indices
            const idx =
                order === 'none'
                    ? Array.from({ length: n }, (_, i) => i)
                    : Array.from({ length: n }, (_, i) => i).sort((a, b) => {
                          const ai = Complex.realToNumber(Draw2[a]);
                          const bi = Complex.realToNumber(Draw2[b]);
                          return order === 'asc' ? ai - bi : bi - ai;
                      });

            // Build D_sorted and V_sorted
            const D_sorted_vals: ComplexType[] = idx.map((i) => Draw2[i]);
            const D_sorted = MultiArray.toColumnVector(D_sorted_vals);
            const V_sorted = new MultiArray([n, n]);
            // fill V_sorted column-wise so column k is eigenvector for D_sorted[k]
            for (let col = 0; col < n; col++) {
                const s = idx[col];
                for (let row = 0; row < n; row++) {
                    V_sorted.array[row][col] = Vout.array[row][s];
                }
            }
            MultiArray.setType(D_sorted);
            MultiArray.setType(V_sorted);

            if (result === 2) {
                return { values: D_sorted, vectors: V_sorted };
            } else {
                // result === 3 -> build tridiagonal T from diag/offdiag
                const T = new MultiArray([n, n]);
                for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) T.array[i][j] = Complex.zero();
                for (let i = 0; i < n; i++) {
                    T.array[i][i] = diag[i];
                    if (i < n - 1) {
                        T.array[i][i + 1] = offdiag[i];
                        T.array[i + 1][i] = Complex.conj(offdiag[i]);
                    }
                }
                MultiArray.setType(T);
                return { values: D_sorted, vectors: V_sorted, T };
            }
        }
    };

    public static readonly eigDecomposition = (
        A: MultiArray,
        result: 1 | 2 | 3,
        order: 'asc' | 'desc' | 'none' = 'asc',
        blockSize?: number,
    ): { values: MultiArray; vectors?: MultiArray; T?: MultiArray } => {
        const maxIter = 10000;
        const n: number = A.dimension[0];
        const Acopy = MultiArray.copy(A);
        const { diag, offdiag, taus } = LAPACK.sytrd(Acopy, LAPACK.larf_left);
        if (result === 1) {
            const { D } = LAPACK.steqr_vectors(diag, offdiag, maxIter);
            // const Draw: ComplexType[] = new Array(n);
            // for (let i = 0; i < n; i++) Draw[i] = D[i] as ComplexType;
            const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
                const ai = Complex.realToNumber(D[a]);
                const bi = Complex.realToNumber(D[b]);
                return order === 'asc' ? ai - bi : bi - ai;
            });
            const D_sorted_vals: ComplexType[] = idx.map((i) => D[i]);
            const D_sorted = MultiArray.toColumnVector(D_sorted_vals);
            MultiArray.setType(D_sorted);
            return { values: D_sorted };
        } else {
            // CASE 2 or 3: need eigenvectors too
            // const { D, V } = LAPACK.steqr_vectors(diag, offdiag, maxIter);
            const { D, V } = LAPACK.steqr_vectors_tridiagonal(diag, offdiag, maxIter);
            const Vresult = new MultiArray([V.length, V[0].length]);
            Vresult.array = V;
            return { values: MultiArray.toDiagonalMatrix(D), vectors: Vresult };
        }
    };

    /**
     * Wrapper MATLAB/Octave-style para eig.
     * Permite múltiplos retornos via AST.nodeReturnList + handler.
     */
    public static eig = (M: MultiArray): NodeReturnList => {
        return AST.nodeReturnList(
            (evaluated: ReturnHandlerResult, index: number): NodeExpr | undefined => {
                if (evaluated.length === 1) {
                    if (index === 0) {
                        return evaluated.values;
                    }
                } else if (evaluated.length === 2) {
                    if (index === 0) {
                        return evaluated.vectors;
                    } else if (index === 1) {
                        return evaluated.values;
                    }
                } else if (evaluated.length === 3) {
                    if (index === 0) {
                        return evaluated.vectors;
                    } else if (index === 1) {
                        return evaluated.values;
                    } else if (index === 2) {
                        return evaluated.T; // tridiagonal, para debug/inspeção
                    }
                }
                // se index inválido, undefined (ou erro, conforme convenção)
                return undefined;
            },
            (length: number): ReturnHandlerResult => {
                AST.throwErrorIfGreaterThanReturnList(3, length);
                if (length === 1) {
                    const { D } = LAPACK.eig_hermitian(M);
                    return { length, values: D };
                } else if (length === 2) {
                    const { D, V } = LAPACK.eig_hermitian(M, true);
                    return { length, values: D, vectors: V };
                } else {
                    const { values, vectors, T } = LinearAlgebra.eigDecomposition(M, 3);
                    return { length, values, vectors, T };
                }
            },
        );
    };

    public static test(A: MultiArray) {
        return AST.nodeReturnList(
            (evaluated: ReturnHandlerResult, index: number): NodeExpr | undefined => {
                if (evaluated.length === 1) {
                    if (index === 0) {
                        return Complex.zero();
                    }
                } else if (evaluated.length === 2) {
                    if (index === 0) {
                        return Complex.zero();
                    } else if (index === 1) {
                        return Complex.one();
                    }
                } else if (evaluated.length === 3) {
                    if (index === 0) {
                        return Complex.zero();
                    } else if (index === 1) {
                        return Complex.one();
                    } else if (index === 2) {
                        return Complex.two();
                    }
                }
                // se index inválido, undefined (ou erro, conforme convenção)
                return undefined;
            },
            (length: number): ReturnHandlerResult => {
                if (length === 1) {
                    return { length };
                } else if (length === 2) {
                    return { length };
                } else {
                    return { length };
                }
            },
        );
    }

    /**
     * LinearAlgebra functions.
     */
    public static readonly functions: { [F in keyof LinearAlgebra]: Function } = {
        eye: LinearAlgebra.eye,
        diag: LinearAlgebra.diag,
        trace: LinearAlgebra.trace,
        det: LinearAlgebra.det,
        inv: LinearAlgebra.inv,
        gauss: LinearAlgebra.gauss,
        lu: LinearAlgebra.lu,
        dot: LinearAlgebra.dot,
        cross: LinearAlgebra.cross,
        kron: LinearAlgebra.kron,
        qr: LinearAlgebra.qr,
        eig: LinearAlgebra.eig,
        test: LinearAlgebra.test,
    };
}

export { LinearAlgebra };
export default { LinearAlgebra };
