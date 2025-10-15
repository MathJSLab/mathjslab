import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { type NodeExpr, type NodeReturnList, AST } from './AST';

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
     * LinearAlgebra functions.
     */
    public static functions: { [name: string]: Function } = {
        eye: LinearAlgebra.eye,
        trace: LinearAlgebra.trace,
        det: LinearAlgebra.det,
        inv: LinearAlgebra.inv,
        gauss: LinearAlgebra.gauss,
        lu: LinearAlgebra.lu,
    };

    /**
     * Identity matrix
     * @param args
     * * `eye(N)` - create identity N x N
     * * `eye(N,M)` - create identity N x M
     * * `eye([N,M])` - create identity N x M
     * @returns Identity matrix
     */
    public static eye(...args: MultiArray[] | ComplexType[]): MultiArray | ComplexType {
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
                throw new SyntaxError(`Invalid call to eye. Type 'help eye' to see correct usage.`);
            }
        } else {
            throw new SyntaxError(`Invalid call to eye. Type 'help eye' to see correct usage.`);
        }
        //result = MultiArray.zeros(Complex.create(rows), Complex.create(columns)) as MultiArray;
        const result = new MultiArray([rows, columns], Complex.zero());
        for (let n = 0; n < Math.min((result as MultiArray).dimension[0], (result as MultiArray).dimension[1]); n++) {
            (result as MultiArray).array[n][n] = Complex.one();
        }
        return result;
    }

    /**
     * Sum of diagonal elements.
     * @param M Matrix.
     * @returns Trace of matrix.
     */
    public static trace(M: MultiArray): ComplexType {
        if (M.dimension.length === 2) {
            return M.array.map((row, i) => (row[i] ? row[i] : Complex.zero())).reduce((p, c) => Complex.add(p as ComplexType, c as ComplexType), Complex.zero()) as ComplexType;
        } else {
            throw new Error('trace: only valid on 2-D objects');
        }
    }

    /**
     * Transpose and apply function.
     * @param M Matrix.
     * @returns Transpose matrix with `func` applied to each element.
     */
    private static applyTranspose(M: MultiArray, func: Function = (value: ElementType) => value): MultiArray {
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
    }

    /**
     * Transpose.
     * @param M Matrix.
     * @returns Transpose matrix.
     */
    public static transpose(M: MultiArray): MultiArray {
        return LinearAlgebra.applyTranspose(M);
    }

    /**
     * Complex conjugate transpose.
     * @param M Matrix.
     * @returns Complex conjugate transpose matrix.
     */
    public static ctranspose(M: MultiArray): MultiArray {
        return LinearAlgebra.applyTranspose(M, (value: ComplexType) => Complex.conj(value));
    }

    /**
     * Matrix product.
     * @param left Matrix.
     * @param right Matrix.
     * @returns left * right.
     */
    public static mul(left: MultiArray, right: MultiArray): MultiArray {
        if (left.dimension[1] !== right.dimension[0] && left.dimension.length === 2 && right.dimension.length === 2) {
            throw new EvalError(`operator *: nonconformant arguments (op1 is ${left.dimension[0]}x${left.dimension[1]}, op2 is ${right.dimension[0]}x${right.dimension[1]}).`);
        } else {
            const result = new MultiArray([left.dimension[0], right.dimension[1]]);
            for (let i = 0; i < left.dimension[0]; i++) {
                result.array[i] = new Array(right.dimension[1]).fill(Complex.zero());
                for (let j = 0; j < right.dimension[1]; j++) {
                    for (let n = 0; n < left.dimension[1]; n++) {
                        result.array[i][j] = Complex.add(result.array[i][j] as ComplexType, Complex.mul(left.array[i][n] as ComplexType, right.array[n][j] as ComplexType));
                    }
                }
            }
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
    public static power(left: MultiArray, right: ComplexType): MultiArray {
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
                let temp2 = MultiArray.copy(temp1);
                for (let i = 1; i < Math.abs(Complex.realToNumber(right)); i++) {
                    temp2 = LinearAlgebra.mul(temp2, temp1);
                }
                temp1 = temp2;
            }
            return temp1;
        } else {
            throw new Error(`exponent must be integer real in matrix '^'.`);
        }
    }

    /**
     * Matrix determinant.
     * @param M Matrix.
     * @returns Matrix determinant.
     */
    public static det(M: MultiArray): ComplexType {
        if (M.dimension.length === 2 && M.dimension[0] === M.dimension[1]) {
            const n = M.dimension[1];
            let det = Complex.zero();
            if (n === 1) det = M.array[0][0] as ComplexType;
            else if (n === 2)
                det = Complex.sub(Complex.mul(M.array[0][0] as ComplexType, M.array[1][1] as ComplexType), Complex.mul(M.array[0][1] as ComplexType, M.array[1][0] as ComplexType));
            else {
                det = Complex.zero();
                for (let j1 = 0; j1 < n; j1++) {
                    const m = new MultiArray([n - 1, n - 1], Complex.zero());
                    for (let i = 1; i < n; i++) {
                        let j2 = 0;
                        for (let j = 0; j < n; j++) {
                            if (j === j1) continue;
                            m.array[i - 1][j2] = M.array[i][j];
                            j2++;
                        }
                    }
                    det = Complex.add(det, Complex.mul(Complex.create(Math.pow(-1, 2.0 + j1), 0), Complex.mul(M.array[0][j1] as ComplexType, LinearAlgebra.det(m))));
                }
            }
            return det;
        } else {
            throw new Error('det: matrix must be square.');
        }
    }

    /**
     * Returns the inverse of matrix `M`.
     * Source: http://blog.acipo.com/matrix-inversion-in-javascript/
     * This method uses Guassian Elimination to calculate the inverse:
     * (1) 'Augment' the matrix (M) by the identity (on the right).
     * (2) Turn the matrix on the M into the identity by elemetry row ops.
     * (3) The matrix on the right is the inverse (was the identity matrix).
     * There are 3 elementary row ops: (b and c are combined in the code).
     * (a) Swap 2 rows.
     * (b) Multiply a row by a scalar.
     * (c) Add 2 rows.
     * @param M Matrix.
     * @returns Inverted matrix.
     */
    public static inv(M: MultiArray): MultiArray {
        // if the matrix isn't square: exit (error)
        if (M.dimension.length === 2 && M.dimension[0] === M.dimension[1]) {
            // create the identity matrix (I), and a copy (C) of the original
            let i = 0,
                ii = 0,
                j = 0,
                e = Complex.zero();
            const numRows = M.dimension[0];
            const I: ComplexType[][] = [],
                C: ComplexType[][] = [];
            for (i = 0; i < numRows; i += 1) {
                // Create the row
                I[I.length] = [];
                C[C.length] = [];
                for (j = 0; j < numRows; j += 1) {
                    // if we're on the diagonal, put a 1 (for identity)
                    if (i === j) {
                        I[i][j] = Complex.one();
                    } else {
                        I[i][j] = Complex.zero();
                    }
                    // Also, make the copy of the original
                    C[i][j] = M.array[i][j] as ComplexType;
                }
            }

            // Perform elementary row operations
            for (i = 0; i < numRows; i += 1) {
                // get the element e on the diagonal
                e = C[i][i];

                // if we have a 0 on the diagonal (we'll need to swap with a lower row)
                if (Complex.realEquals(e, 0) && Complex.imagEquals(e, 0)) {
                    // look through every row below the i'th row
                    for (ii = i + 1; ii < numRows; ii += 1) {
                        // if the ii'th row has a non-0 in the i'th col
                        if (!Complex.realEquals(C[ii][i], 0) && !Complex.imagEquals(C[ii][i], 0)) {
                            //it would make the diagonal have a non-0 so swap it
                            for (j = 0; j < numRows; j++) {
                                e = C[i][j]; // temp store i'th row
                                C[i][j] = C[ii][j]; // replace i'th row by ii'th
                                C[ii][j] = e; // replace ii'th by temp
                                e = I[i][j]; // temp store i'th row
                                I[i][j] = I[ii][j]; // replace i'th row by ii'th
                                I[ii][j] = e; // replace ii'th by temp
                            }
                            // don't bother checking other rows since we've swapped
                            break;
                        }
                    }
                    // get the new diagonal
                    e = C[i][i];
                    // if it's still 0, not invertable (error)
                    if (Complex.realEquals(e, 0) && Complex.imagEquals(e, 0)) {
                        return new MultiArray([M.dimension[0], M.dimension[1]], Complex.inf_0());
                    }
                }

                // Scale this row down by e (so we have a 1 on the diagonal)
                for (j = 0; j < numRows; j++) {
                    C[i][j] = Complex.rdiv(C[i][j], e); //apply to original matrix
                    I[i][j] = Complex.rdiv(I[i][j], e); //apply to identity
                }

                // Subtract this row (scaled appropriately for each row) from ALL of
                // the other rows so that there will be 0's in this column in the
                // rows above and below this one
                for (ii = 0; ii < numRows; ii++) {
                    // Only apply to other rows (we want a 1 on the diagonal)
                    if (ii === i) {
                        continue;
                    }

                    // We want to change this element to 0
                    e = C[ii][i];

                    // Subtract (the row above(or below) scaled by e) from (the
                    // current row) but start at the i'th column and assume all the
                    // stuff M of diagonal is 0 (which it should be if we made this
                    // algorithm correctly)
                    for (j = 0; j < numRows; j++) {
                        C[ii][j] = Complex.sub(C[ii][j], Complex.mul(e, C[i][j])); // apply to original matrix
                        I[ii][j] = Complex.sub(I[ii][j], Complex.mul(e, I[i][j])); // apply to identity
                    }
                }
            }

            // we've done all operations, C should be the identity
            // matrix I should be the inverse:
            const result = new MultiArray([M.dimension[0], M.dimension[1]]);
            result.array = I;
            MultiArray.setType(result);
            return result;
        } else {
            throw new Error('inv: matrix must be square.');
        }
    }

    /**
     * Gaussian elimination algorithm for solving systems of linear equations.
     * Adapted from: https://github.com/itsravenous/gaussian-elimination
     * ## References
     * * https://mathworld.wolfram.com/GaussianElimination.html
     * @param M Matrix.
     * @param m Vector.
     * @returns Solution of linear system.
     */
    public static gauss(M: MultiArray, m: MultiArray): MultiArray {
        if (M.dimension.length > 2 || M.dimension[0] !== M.dimension[1]) {
            throw new Error(`invalid dimensions in function gauss.`);
        }
        const A: MultiArray = MultiArray.copy(M);
        let i: number, k: number, j: number;
        const DMin = Math.min(m.dimension[0], m.dimension[1]);
        if (DMin === m.dimension[1]) {
            m = LinearAlgebra.transpose(m);
        }

        // Just make a single matrix
        for (i = 0; i < A.dimension[0]; i++) {
            A.array[i].push(m.array[0][i]);
        }
        const n = A.dimension[0];

        for (i = 0; i < n; i++) {
            // Search for maximum in this column
            let maxEl = Complex.abs(A.array[i][i] as ComplexType),
                maxRow = i;
            for (k = i + 1; k < n; k++) {
                if (Complex.realGreaterThan(Complex.abs(A.array[k][i] as ComplexType), maxEl.re)) {
                    maxEl = Complex.abs(A.array[k][i] as ComplexType);
                    maxRow = k;
                }
            }

            // Swap maximum row with current row (column by column)
            for (k = i; k < n + 1; k++) {
                const tmp = A.array[maxRow][k];
                A.array[maxRow][k] = A.array[i][k];
                A.array[i][k] = tmp;
            }

            // Make all rows below this one 0 in current column
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

        // Solve equation Mx=m for an upper triangular matrix M
        const X = new MultiArray([1, n], Complex.zero());
        for (i = n - 1; i > -1; i--) {
            X.array[0][i] = Complex.rdiv(A.array[i][n] as ComplexType, A.array[i][i] as ComplexType);
            for (k = i - 1; k > -1; k--) {
                A.array[k][n] = Complex.sub(A.array[k][n] as ComplexType, Complex.mul(A.array[k][i] as ComplexType, X.array[0][i] as ComplexType));
            }
        }
        MultiArray.setType(X);
        return X;
    }

    /**
     * PLU matrix factorization.
     * @param M Matrix.
     * @returns L, U and P matrices as multiple output.
     * ## References
     * * https://www.codeproject.com/Articles/1203224/A-Note-on-PA-equals-LU-in-Javascript
     * * https://rosettacode.org/wiki/LU_decomposition#JavaScript
     */
    public static lu(M: MultiArray): NodeReturnList {
        if (M.dimension[0] !== M.dimension[1]) {
            throw new Error(`PLU decomposition can only be applied to square matrices.`);
        }

        const n = M.dimension[0]; // Size of the square matrix

        // Initialize P as an identity matrix with the appropriate dimensions
        const P = LinearAlgebra.eye(Complex.create(n)) as MultiArray;

        // Initialize L as an identity matrix with the same dimensions as the input matrix
        const L = LinearAlgebra.eye(Complex.create(n)) as MultiArray;

        // Initialize U as a copy of the input matrix
        const U = MultiArray.copy(M);

        for (let k = 0; k < n; k++) {
            // Find the pivot element (maximum absolute value) in the current column
            let maxVal = Complex.abs(U.array[k][k] as ComplexType);
            let maxIdx = k;

            for (let i = k + 1; i < n; i++) {
                const absVal = Complex.abs(U.array[i][k] as ComplexType);
                if (Complex.gt(absVal, maxVal)) {
                    maxVal = absVal;
                    maxIdx = i;
                }
            }

            // Swap rows in P, L, and U if needed
            if (maxIdx !== k) {
                MultiArray.swapRows(P, k, maxIdx);
                for (let j = 0; j < k; j++) {
                    const temp = L.array[k][j];
                    L.array[k][j] = L.array[maxIdx][j];
                    L.array[maxIdx][j] = temp;
                }
                MultiArray.swapRows(U, k, maxIdx);
            }

            for (let i = k + 1; i < n; i++) {
                // Compute the multiplier
                const multiplier = Complex.rdiv(U.array[i][k] as ComplexType, U.array[k][k] as ComplexType);

                // Update L and U
                (L as MultiArray).array[i][k] = multiplier;
                for (let j = k; j < n; j++) {
                    U.array[i][j] = Complex.sub(U.array[i][j] as ComplexType, Complex.mul(multiplier, U.array[k][j] as ComplexType));
                }
            }
        }
        return AST.nodeReturnList((length: number, index: number): NodeExpr => {
            if (length === 1) {
                return U;
            } else {
                switch (index) {
                    case 0:
                        return L;
                    case 1:
                        return U;
                    case 2:
                        return P;
                }
            }
        });
    }
}
export { LinearAlgebra };
export default { LinearAlgebra };
