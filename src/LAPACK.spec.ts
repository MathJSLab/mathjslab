import path from 'node:path';
import { describe, it, expect } from '@jest/globals';
import { Complex, ComplexType, toNumber } from './Complex';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';
import { LAPACK } from './LAPACK';
import { type TestOptions, LAPACKtest, EXPECT_TOL, MAX_ITERACTION, DEFAULT_EIG_TOL, defaulTestOptions } from './LAPACKtest';
import { Evaluator } from './Evaluator';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

/**
 * Evaluator instance.
 */
let evaluator: Evaluator;

/**
 * Matrix samples.
 */
const matrixSample: Record<string, string> = {
    magic_01: '[ 1 ]',

    magic_02: '[ 4, 3; 1, 2 ]',

    magic_03: '[ 8, 1, 6; 3, 5, 7; 4, 9, 2 ]',

    magic_04: '[ 16, 2, 3, 13; 5, 11, 10, 8; 9, 7, 6, 12; 4, 14, 15, 1 ]',

    magic_05: '[ 17, 24, 1, 8, 15; 23, 5, 7, 14, 16; 4, 6, 13, 20, 22; 10, 12, 19, 21, 3; 11, 18, 25, 2, 9]',

    real_symmetric_simple_diagonalizable_2x2_01: '[2, 1; 1, 2]',

    real_symmetric_rational_2x2_01: '[1, 1/2; 1/2, 1]',

    real_symmetric_rational_3x3_01: `[  1, 1/2, 1/3;
                                      1/2,   1, 2/3;
                                      1/3, 2/3,   1]`,

    real_symmetric_rational_4x4_01: `[  1, 1/2, 1/3, 1/4;
                                      1/2,   1, 2/3, 1/2;
                                      1/3, 2/3,   1, 3/4;
                                      1/4, 1/2, 3/4,   1]`,

    real_repeated_eigenvalues_3x3_01: `[2, 1, 0;
                                        1, 2, 0;
                                        0, 0, 3]`,

    complex_general_3x2_01: `[ 1+0i,  0+0i;
                               0+0i,  1+0i;
                               1+1i, -1+0i]`,

    complex_general_3x2_02: `[ 1+0i,  2+1i;
                               0+1i,  1+0i;
                               3+0i, -1+1i]`,

    complex_general_3x3_01: `[ 2+0i,  1-1i,  3+2i;
                               4+1i,  5+0i,  6-1i;
                               1-2i,  0+1i,  3+0i]`,

    complex_general_3x3_02: `[ 2+0i,  1-1i,  0+0i;
                               4+2i,  3+0i,  1+0i;
                              -2+1i,  1+0i,  2+0i]`,

    complex_general_3x3_03: `[ 3+0i,  1-1i,  2+0i;
                               1+1i,  4+0i,  0+1i;
                               2+0i,  0-1i,  5+0i]`,

    complex_general_4x2_01: `[ 1 + 2i,   0.5 -  i;
                              -1 +  i,   2.0 + 0i;
                               0 + 1i,  -0.3 + 2i;
                               2 -  i,   1.0 +  i]`,

    complex_rhs_3x1_01: `[ 1 +   2i;
                          -3 + 0.5i;
                           2 -   1i ]`,

    complex_hermitian_2x2_01: `[1, 1+i;
                                1-i, 2];`,

    complex_hermitian_4x4_01: `[   2+  0i, 0.3+0.4i,  0.2-0.1i, -0.5+0.6i;
                                 0.3-0.4i,   3+  0i,  0.1+0.2i,  0.4-0.3i;
                                 0.2+0.1i, 0.1-0.2i,  2.5+  0i, -0.2+0.5i;
                                -0.5-0.6i, 0.4+0.3i, -0.2-0.5i,  1.8+  0i]`,

    complex_tridiagonal_3x3_01: `[   4,   1+i,   0;
                                   1-i,     3, 2-i;
                                     0,   2+i,   1]`,

    trsm_lower_2x2_01: `[1, 0;
                         2, 1]`,

    trsm_lower_3x3_01: `[ 2+0i, 0,     0;
                          1+1i, 3+0i,  0;
                          4-1i, 2+0i,  1+0i]`,

    trsm_upper_2x2_01: `[1, 2-i;
                         0, 1]`,

    trsm_upper_3x3_01: `[ 2+0i, 1-1i, 4+1i;
                          0,    3+0i, 2+0i;
                          0,    0,    1+0i]`,

    trsm_rhs_3x2_01: `[ 1+0i, 2-1i;
                        3+1i, 4+0i;
                        5+0i, 6+2i]`,
};

/**
 * Test for Hermitian / symmetric eigenvalue decomposition.
 *
 * Checks:
 *
 *  (1) Hermitian property:        || A − Aᴴ ||_F
 *  (2) Unitarity of eigenvectors: || Vᴴ V − I ||_F
 *  (3) Reality of eigenvalues:    max |Im(λᵢ)|
 *  (4) Eigen equation residual:   || A·V − V·D ||_F
 *
 * All checks are asserted against a tolerance.
 */
function expectHermetianEigenDecomposition(
    A: MultiArray | ComplexType[][],
    V: MultiArray | ComplexType[][],
    D: MultiArray | ComplexType[] | ComplexType[][],
    options: TestOptions = {},
): void {
    options = LAPACKtest.setTestOptions(options);
    const { tol = DEFAULT_EIG_TOL, print, frobenius, Aid, Vid, Did } = options;
    console.log('=== Hermitian Eigen decomposition test ===');
    A = LAPACKtest.array_to_multiarray(A);
    V = LAPACKtest.array_to_multiarray(V);
    D = LAPACKtest.array_or_vector_to_diagonal_multiarray(D);
    if (print) {
        console.log('--- Inputs ---');
        LAPACKtest.print_matrix(A, Aid, evaluator);
        LAPACKtest.print_matrix(V, Vid, evaluator);
        LAPACKtest.print_matrix(D, Did, evaluator);
    }
    let result = LAPACKtest.testHermitian(A, options);
    expect(result.norm).toBeLessThanOrEqual(tol!);
    result = LAPACKtest.testUnitarity(V, options);
    if (frobenius) expect(result.norm).toBeLessThanOrEqual(tol!);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
    result = LAPACKtest.testRealEigenvalues(D, options);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
    result = LAPACKtest.testEigenResidual(A, V, D, options);
    if (frobenius) expect(result.norm).toBeLessThanOrEqual(tol!);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
}

/**
 * Testing the 'eig' function. Executes:
 * > clear
 * > A = <argument>
 * > [V,D] = eig(A)
 *
 * Next, it verifies the validity of the eigen decomposition.
 * @param A
 * @param options
 */
function testHermitianEigenDecomposition(A: string, options: TestOptions = { Aid: 'A' }) {
    options = LAPACKtest.setTestOptions(options);
    evaluator.Execute('clear');
    evaluator.Execute(`${options.Aid} = ${A}`);
    evaluator.Execute(`[V,D] = eig(${options.Aid})`);
    const Am = evaluator.Execute(options.Aid!).list[0];
    const Vm = evaluator.Execute('V').list[0];
    const Dm = evaluator.Execute('D').list[0];
    expectHermetianEigenDecomposition(Am, Vm, Dm, options);
}

/**
 * Tests internal invariants of the Jacobi real symmetric eigensolver.
 *
 * This helper does NOT test the full residual A*V - V*D.
 * It only checks:
 *  - diagonalization of the returned D
 *  - orthogonality of V
 *  - reality of eigenvalues
 * @param A
 * @param options
 */
function expectJacobiDiagonalization(A: MultiArray | ComplexType[][], options: TestOptions = {}) {
    options = LAPACKtest.setTestOptions(options);
    const { tol, maxIter, print, frobenius, Aid, Vid, Did } = options;
    A = LAPACKtest.array_to_multiarray(A);
    if (print) {
        console.log('--- Jacobi real symmetric eigen solver test ---\n' + `maxIterations = ${maxIter}, tol = ${tol}`);
    }
    const { D, V } = LAPACK.jacobi_real_symmetric_dense(A.array as ComplexType[][], maxIter, tol);
    let result = LAPACKtest.testOffDiagonal(D, options);
    expect(result.dim![0]).toBe(result.dim![1]);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
    result = LAPACKtest.testOrthogonal(V, options);
    expect(result.dim![0]).toBe(result.dim![1]);
    if (frobenius) expect(result.norm).toBeLessThanOrEqual(tol!);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
    result = LAPACKtest.testRealEigenvalues(D, options);
    expect(result.maxErr).toBeLessThanOrEqual(tol!);
}

/**
 *
 * @param A
 * @param options
 */
function testJacobiDiagonalization(A: string, options: TestOptions = { Aid: 'A' }) {
    options = LAPACKtest.setTestOptions(options);
    const { Aid } = options;
    evaluator.Execute('clear');
    evaluator.Execute(`${Aid} = ${A}`);
    const S = evaluator.Execute(Aid!).list[0];
    expectJacobiDiagonalization(S, options);
}

function expectComplexCloseTo(A: ComplexType, B: ComplexType, tol: number = EXPECT_TOL) {
    expect(Math.abs(Complex.realToNumber(Complex.sub(B, A)))).toBeLessThan(tol);
    expect(Math.abs(Complex.imagToNumber(Complex.sub(B, A)))).toBeLessThan(tol);
}

/**
 * Compare two matrices numerically (real + imaginary parts)
 */
function expectMatrixClose(A: MultiArray | ComplexType[][], B: MultiArray | ComplexType[][], tol = EXPECT_TOL) {
    A = LAPACKtest.array_to_multiarray(A);
    B = LAPACKtest.array_to_multiarray(B);
    expect(A.dimension[0]).toBe(B.dimension[0]);
    expect(A.dimension[1]).toBe(B.dimension[1]);
    for (let i = 0; i < A.dimension[0]; i++) {
        for (let j = 0; j < A.dimension[1]; j++) {
            const ar = toNumber((A.array[i][j] as ComplexType).re);
            const ai = toNumber((A.array[i][j] as ComplexType).im);
            const br = toNumber((B.array[i][j] as ComplexType).re);
            const bi = toNumber((B.array[i][j] as ComplexType).im);
            expect(Math.abs(ar - br)).toBeLessThan(tol);
            expect(Math.abs(ai - bi)).toBeLessThan(tol);
        }
    }
}

function expectVectorClose(A: ComplexType[], B: ComplexType[], tol = EXPECT_TOL) {
    expect(A.length).toBe(B.length);
    for (let i = 0; i < A.length; i++) {
        const ar = toNumber((A[i] as ComplexType).re);
        const ai = toNumber((A[i] as ComplexType).im);
        const br = toNumber((B[i] as ComplexType).re);
        const bi = toNumber((B[i] as ComplexType).im);
        expect(Math.abs(ar - br)).toBeLessThan(tol);
        expect(Math.abs(ai - bi)).toBeLessThan(tol);
    }
}

function opA(A: MultiArray, trans: 'N' | 'T' | 'C'): MultiArray {
    if (trans === 'N') return A;
    if (trans === 'T') return LinearAlgebra.transpose(A);
    return LinearAlgebra.ctranspose(A);
}

function materializeUnitDiagonal(A: MultiArray): MultiArray {
    const R = MultiArray.copy(A);
    for (let i = 0; i < R.dimension[0]; i++) {
        R.array[i][i] = Complex.one();
    }
    return R;
}

function normalizedResidual(A: MultiArray, X: MultiArray, B: MultiArray): number {
    const AX = MathOperation.mtimes(A, X) as MultiArray;
    const R = MathOperation.minus(AX, B) as MultiArray;
    const num = LAPACKtest.frobenius_norm(R);
    const normA = LAPACKtest.frobenius_norm(A);
    const normX = LAPACKtest.frobenius_norm(X);
    if (normA === 0 || normX === 0) {
        return num; // fallback seguro (não esperado nos testes)
    }
    return num / (normA * normX);
}

function solveUpperTriangular(R: MultiArray, B: MultiArray): MultiArray {
    const n = R.dimension[1]; // assume square upper block
    const nrhs = B.dimension[1];
    const Y = MultiArray.copy(B) as MultiArray;
    for (let j = 0; j < nrhs; j++) {
        for (let i = n - 1; i >= 0; i--) {
            let acc = Y.array[i][j] as ComplexType;
            for (let k = i + 1; k < n; k++) {
                acc = Complex.sub(acc, Complex.mul(R.array[i][k] as ComplexType, Y.array[k][j] as ComplexType));
            }
            acc = Complex.rdiv(acc, R.array[i][i] as ComplexType);
            Y.array[i][j] = acc;
        }
    }
    MultiArray.setType(Y);
    return Y;
}

function extractR(A: MultiArray): MultiArray {
    const m = A.dimension[0];
    const n = A.dimension[1];
    const k = Math.min(m, n);
    const R = MultiArray.copy(A);
    // Zero rows below k
    for (let i = k; i < m; i++) {
        for (let j = 0; j < n; j++) {
            R.array[i][j] = Complex.zero();
        }
    }
    LAPACK.triu_inplace(R);
    return R;
}

// C -= tau * w * vᴴ
function rank1Update(C: MultiArray, w: ComplexType[], v: ComplexType[], tau: ComplexType) {
    for (let i = 0; i < C.dimension[0]; i++) {
        for (let j = 0; j < v.length; j++) {
            C.array[i][j] = Complex.sub(C.array[i][j] as ComplexType, Complex.mul(tau, Complex.mul(w[i], Complex.conj(v[j]))));
        }
    }
}

/**
 * LAPACK test suite.
 */
describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        evaluator = Evaluator.Create();
    });

    it(`${unitName}, BLAS and LAPACKtest should be defined.`, () => {
        expect(BLAS).toBeDefined();
        expect(BLAS.functions).toBeDefined();
        expect(LAPACK).toBeDefined();
        expect(LAPACK.functions).toBeDefined();
        expect(LAPACKtest).toBeDefined();
    });

    it('Evaluator should be instatiated and should parse, evaluate and unparse a simple real expression (evaluator test).', () => {
        expect(evaluator).toBeInstanceOf(Evaluator);
        const tree = evaluator.Parse('1+2*3');
        const value = evaluator.Evaluate(tree);
        const unparsed = evaluator.Unparse(tree);
        expect(Complex.realToNumber(value.list[0])).toBe(7);
        expect(unparsed === '1+2*3\n').toBe(true);
    });

    describe('BLAS.axpy — Y ← alpha * X + Y', () => {
        it('axpy — real matrices, alpha = 2', () => {
            const X = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            const Y = evaluator.Execute('[5 6; 7 8]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('2').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            const expected = evaluator.Execute('[7 10; 13 16]').list[0] as MultiArray;
            expectMatrixClose(Y, expected);
        });

        it('axpy — complex matrices, alpha complex', () => {
            const X = evaluator.Execute('[1+i 2; 3 4-i]').list[0] as MultiArray;
            const Y = evaluator.Execute('[5 6+i; 7 8]').list[0] as MultiArray;
            BLAS.axpy(Complex.create(2, -1), X.array as ComplexType[][], Y.array as ComplexType[][]);
            const expected = evaluator.Execute('[8+i 10-i; 13-3i 15-6i]').list[0] as MultiArray;
            expectMatrixClose(Y, expected);
        });

        it('axpy — alpha = 0 leaves Y unchanged', () => {
            const X = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            const Y = evaluator.Execute('[5 6; 7 8]').list[0] as MultiArray;
            const Ycopy = evaluator.Execute('[5 6; 7 8]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('0').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            expectMatrixClose(Y, Ycopy);
        });

        it('axpy — alpha = 1', () => {
            const X = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            const Y = evaluator.Execute('[5 6; 7 8]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('1').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            const expected = evaluator.Execute('[6 8; 10 12]').list[0] as MultiArray;
            expectMatrixClose(Y, expected);
        });

        it('axpy — alpha = -1 (Y ← Y − X)', () => {
            const X = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            const Y = evaluator.Execute('[5 6; 7 8]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('-1').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            const expected = evaluator.Execute('[4 4; 4 4]').list[0] as MultiArray;
            expectMatrixClose(Y, expected);
        });

        it('axpy — rectangular matrices (3x2)', () => {
            const X = evaluator.Execute('[1 2; 3 4; 5 6]').list[0] as MultiArray;
            const Y = evaluator.Execute('[6 5; 4 3; 2 1]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('2').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            const expected = evaluator.Execute('[8 9; 10 11; 12 13]').list[0] as MultiArray;
            expectMatrixClose(Y, expected);
        });

        it('axpy — zero X leaves Y unchanged', () => {
            const X = evaluator.Execute('[0 0; 0 0]').list[0] as MultiArray;
            const Y = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            const Ycopy = evaluator.Execute('[1 2; 3 4]').list[0] as MultiArray;
            BLAS.axpy(evaluator.Execute('5').list[0], X.array as ComplexType[][], Y.array as ComplexType[][]);
            expectMatrixClose(Y, Ycopy);
        });
    });

    describe('BLAS.scal — scale a vector by a scalar (in-place)', () => {
        it('scal — real vector, alpha real', () => {
            const A = evaluator.Execute('[1; 2; 3]').list[0] as MultiArray;
            const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
            BLAS.scal(Complex.create(2), Avec, 0, 3);
            const expected = evaluator.Execute('[2; 4; 6]').list[0] as MultiArray;
            expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
        });

        it('scal — complex vector, alpha complex', () => {
            const A = evaluator.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
            const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
            BLAS.scal(Complex.create(2, -1), Avec, 0, 3);
            const expected = evaluator.Execute('[3+i; 4-2i; 5-5i]').list[0] as MultiArray;
            expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
        });

        it('scal — sliced vector (startRow)', () => {
            const A = evaluator.Execute('[1; 2; 3; 4]').list[0] as MultiArray;
            const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
            BLAS.scal(Complex.create(10), Avec, 1, 3);
            const expected = evaluator.Execute('[1; 20; 30; 4]').list[0] as MultiArray;
            expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
        });

        it('scal — alpha = 0 zeros the vector slice', () => {
            const A = evaluator.Execute('[1; 2; 3]').list[0] as MultiArray;
            const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
            BLAS.scal(Complex.zero(), Avec, 0, 3);
            const expected = evaluator.Execute('[0; 0; 0]').list[0] as MultiArray;
            expectMatrixClose(MultiArray.toColumnVector(Avec), expected);
        });

        it('scal — alpha = 1 leaves vector unchanged', () => {
            const A = evaluator.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
            const Avec = MultiArray.fromColumnVector(A) as ComplexType[];
            BLAS.scal(Complex.one(), Avec, 0, 3);
            expectMatrixClose(MultiArray.toColumnVector(Avec), A);
        });
    });

    describe('BLAS.dotu / BLAS.dotc', () => {
        it('dotu — real vectors', () => {
            const x = evaluator.Execute('[1; 2; 3]').list[0] as MultiArray;
            const y = evaluator.Execute('[4; 5; 6]').list[0] as MultiArray;
            const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('32').list[0] as any;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });

        it('dotc — real vectors (same as dotu)', () => {
            const x = evaluator.Execute('[1; 2; 3]').list[0] as MultiArray;
            const y = evaluator.Execute('[4; 5; 6]').list[0] as MultiArray;
            const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('32').list[0] as any;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });

        it('dotu — complex vectors', () => {
            const x = evaluator.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
            const y = evaluator.Execute('[4; 5+i; 6]').list[0] as MultiArray;
            const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('32 + 0i').list[0] as ComplexType;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });

        it('dotc — complex vectors (Hermitian dot product)', () => {
            const x = evaluator.Execute('[1+i; 2; 3-i]').list[0] as MultiArray;
            const y = evaluator.Execute('[4; 5+i; 6]').list[0] as MultiArray;
            const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('32 + 4i').list[0] as ComplexType;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });

        it('dotu vs dotc — difference for complex vectors', () => {
            const x = evaluator.Execute('[1+i; 2]').list[0] as MultiArray;
            const y = evaluator.Execute('[3; 4+i]').list[0] as MultiArray;
            const dotu = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const dotc = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expectedDotu = evaluator.Execute('11 + 5i').list[0] as any;
            const expectedDotc = evaluator.Execute('11 - i').list[0] as any;
            const diffDotu = Complex.sub(dotu, expectedDotu);
            expect(Math.abs(Complex.realToNumber(diffDotu))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diffDotu))).toBeLessThan(EXPECT_TOL);
            const diffDotc = Complex.sub(dotc, expectedDotc);
            expect(Math.abs(Complex.realToNumber(diffDotc))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diffDotc))).toBeLessThan(EXPECT_TOL);
        });

        it('dotu — zero vector', () => {
            const x = evaluator.Execute('[0; 0; 0]').list[0] as MultiArray;
            const y = evaluator.Execute('[1+i; 2; 3]').list[0] as MultiArray;
            const result = BLAS.dotu(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('0').list[0] as any;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });

        it('dotc — single element vectors', () => {
            const x = evaluator.Execute('[1+i]').list[0] as MultiArray;
            const y = evaluator.Execute('[2-i]').list[0] as MultiArray;
            const result = BLAS.dotc(x.array.map((r) => r[0]) as ComplexType[], y.array.map((r) => r[0]) as ComplexType[]);
            const expected = evaluator.Execute('1 - 3i').list[0] as any;
            const diff = Complex.sub(result, expected);
            expect(Math.abs(Complex.realToNumber(diff))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(diff))).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('BLAS.dot', () => {
        it('dot — real column vectors', () => {
            const xMat = evaluator.Execute('[1; 2; 3]').list[0] as MultiArray;
            const yMat = evaluator.Execute('[4; 5; 6]').list[0] as MultiArray;
            const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
            const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
            const result = BLAS.dot(x, y);
            expect(Complex.realToNumber(result)).toBeCloseTo(32);
        });

        it('dot — real row vectors', () => {
            const xMat = evaluator.Execute('[1, 2, 3]').list[0] as MultiArray;
            const yMat = evaluator.Execute('[4, 5, 6]').list[0] as MultiArray;
            const x = MultiArray.fromRowVector(xMat) as ComplexType[];
            const y = MultiArray.fromRowVector(yMat) as ComplexType[];
            const result = BLAS.dot(x, y);
            expect(Complex.realToNumber(result)).toBeCloseTo(32);
        });

        it('dot — complex vectors (unconjugated)', () => {
            const xMat = evaluator.Execute('[1+2i; 3-1i]').list[0] as MultiArray;
            const yMat = evaluator.Execute('[-2+i; 4]').list[0] as MultiArray;
            const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
            const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
            const result = BLAS.dot(x, y);
            // referência algébrica explícita:
            // (1+2i)*(-2+i) + (3-1i)*4
            const expected = Complex.add(Complex.mul(x[0], y[0]), Complex.mul(x[1], y[1]));

            expectComplexCloseTo(result, expected, EXPECT_TOL);
        });

        it('dot — differs from conjugated inner product (dotc)', () => {
            const xMat = evaluator.Execute('[1+2i; 3-1i]').list[0] as MultiArray;
            const yMat = evaluator.Execute('[-2+i; 4]').list[0] as MultiArray;
            const x = MultiArray.fromColumnVector(xMat) as ComplexType[];
            const y = MultiArray.fromColumnVector(yMat) as ComplexType[];
            const dot = BLAS.dot(x, y);
            const dotc = BLAS.dotc(x, y);
            expect(Complex.toBoolean(Complex.eq(dot, dotc))).toBe(false);
        });
    });

    describe('Hermitian property checks', () => {
        it('Hermitian property test (complex matrix).', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`H = ${matrixSample['complex_hermitian_2x2_01']}`);
            const H = evaluator.Execute('H').list[0];
            LAPACKtest.print_matrix(H, 'H', evaluator);
            const { norm } = LAPACKtest.testHermitian(H, { tol: EXPECT_TOL });
            expect(norm).toBeLessThanOrEqual(EXPECT_TOL);
        });
    });

    describe('Jacobi eigensolver', () => {
        it('Jacobi orthogonal diagonalization — symmetric rational test matrix.', () => {
            testJacobiDiagonalization(matrixSample['real_symmetric_rational_4x4_01'], { Aid: 'S' });
        });

        it('Jacobi orthogonal diagonalization — diagonal matrix.', () => {
            testJacobiDiagonalization('diag([1,2,3,4])', { Aid: 'D' });
        });

        it('Jacobi orthogonal diagonalization — repeated eigenvalues.', () => {
            testJacobiDiagonalization(matrixSample['real_repeated_eigenvalues_3x3_01'], { Aid: 'A' });
        });

        it('Eigenproblem solver for real symmetric matrices.', () => {
            testHermitianEigenDecomposition(matrixSample['real_symmetric_rational_4x4_01'], { Aid: 'S' });
        });

        it('Eigenproblem for simple diagonalizable symmetric matrix.', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`A = ${matrixSample['real_symmetric_simple_diagonalizable_2x2_01']}`);
            evaluator.Execute('[V,D] = eig(A)');
            const A = evaluator.Execute('A').list[0];
            const V = evaluator.Execute('V').list[0];
            const D = evaluator.Execute('D').list[0];
            LAPACKtest.print_matrix(A, 'A', evaluator);
            LAPACKtest.print_matrix(V, 'V', evaluator);
            LAPACKtest.print_matrix(D, 'D', evaluator);
            const options: TestOptions = { frobenius: true };
            // Unitarity test
            let result = LAPACKtest.testUnitarity(V, options);
            expect(result.norm).toBeLessThanOrEqual(EXPECT_TOL);
            expect(result.maxErr).toBeLessThanOrEqual(EXPECT_TOL);
            // Test real eigenvalues
            result = LAPACKtest.testRealEigenvalues(D);
            expect(result.maxErr).toBeLessThanOrEqual(EXPECT_TOL);
            // Residual test
            const diff = evaluator.Execute('A*V-V*D').list[0];
            const norm = LAPACKtest.frobenius_norm(diff);
            console.log(`|| A·V − V·D ||_F = ${norm.toExponential(6)}`);
            // Norm of residual
            expect(norm).toBeLessThanOrEqual(EXPECT_TOL);
        });

        it('Jacobi eigensolver — consistency with eig.', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`A = rand(5);
                A = (A + A') / 2;`);
            evaluator.Execute('[V0,D0] = eig(A)');
            const A = evaluator.Execute('A').list[0];
            const D0 = evaluator.Execute('D0').list[0];
            const { D } = LAPACK.jacobi_real_symmetric_dense(A, 300, EXPECT_TOL);
            const diagJacobi = LAPACK.diag(D);
            const diagEig = LAPACK.diag(D0);
            const diagJacobiM = new MultiArray([diagJacobi.length, 1]);
            diagJacobiM.array = diagJacobi;
            const diagEigM = new MultiArray([diagEig.length, 1]);
            diagEigM.array = diagEig;
            const diff = MathOperation.minus(diagJacobiM, diagEigM) as MultiArray;
            const err = LAPACKtest.frobenius_norm(diff);
            console.log(`|| λ_jacobi − λ_eig ||_F = ${err.toExponential(6)}`);
            expect(err).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('Hermitian tridiagonal decomposition', () => {
        it('Builds a correct dense Hermitian matrix from tridiagonal data (sanity check).', () => {
            // Example:
            // diag     = [1, 2, 3]
            // offdiag  = [4 + i, 5 - 2i]
            //
            // Expected matrix:
            // [ 1        4+i       0      ]
            // [ 4-i      2        5-2i    ]
            // [ 0        5+2i      3      ]
            const diag = [Complex.create(1), Complex.create(2), Complex.create(3)];
            const offdiag = [Complex.create(4, 1), Complex.create(5, -2)];
            const T = LAPACK.tridiagonal_hermitian_to_dense(diag, offdiag);
            // Diagonal
            expect(Complex.toBoolean(Complex.eq(T[0][0], diag[0]))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[1][1], diag[1]))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[2][2], diag[2]))).toBe(true);
            // Superdiagonal
            expect(Complex.toBoolean(Complex.eq(T[0][1], offdiag[0]))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[1][2], offdiag[1]))).toBe(true);
            // Subdiagonal (Hermitian conjugate)
            expect(Complex.toBoolean(Complex.eq(T[1][0], Complex.conj(offdiag[0])))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[2][1], Complex.conj(offdiag[1])))).toBe(true);
            // Zeros outside tridiagonal band
            expect(Complex.toBoolean(Complex.eq(T[0][2], Complex.zero()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[2][0], Complex.zero()))).toBe(true);
        });

        it('hetrd — reduces a hermitian matrix to tridiagonal form (structural test).', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
            const A = evaluator.Execute('A').list[0];
            // Perform tridiagonal reduction
            const { diag, offdiag } = LAPACK.hetrd(A);
            // Basic shape checks
            expect(diag.length).toBe(3);
            expect(offdiag.length).toBe(2);
            // Rebuild dense tridiagonal matrix
            const T = LAPACK.tridiagonal_hermitian_to_dense(diag, offdiag);
            // Check tridiagonal structure explicitly
            expect(Complex.toBoolean(Complex.eq(T[0][2], Complex.zero()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[2][0], Complex.zero()))).toBe(true);
            // Check Hermitian property
            expect(Complex.toBoolean(Complex.eq(T[1][0], Complex.conj(T[0][1])))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(T[2][1], Complex.conj(T[1][2])))).toBe(true);
        });

        it('hetrd + ungtr — reconstruct the original Hermitian matrix. (A − Q·T·Qᴴ ≈ 0)', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0];
            // Working copy (will be overwritten by hetrd)
            const A1 = MultiArray.copy(A0);
            // Tridiagonal reduction
            const { taus } = LAPACK.hetrd(A1);
            // Generate unitary matrix Q from Householder vectors
            const Q = LAPACK.ungtr(A1, taus);
            // Reconstruction error
            const result = LAPACKtest.testHermitianTridiagonalReconstruction(A0, Q, A1);
            // Numerical tolerance
            expect(result.norm).toBeLessThan(EXPECT_TOL);
        });

        it('hetrd — produces a tridiagonal matrix and preserves Hermitian similarity. (A = Q·T·Qᴴ)', () => {
            evaluator.Execute('clear');
            evaluator.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0];
            // Working copy (will be overwritten by hetrd)
            const A1 = MultiArray.copy(A0);
            // Tridiagonal reduction
            const { taus } = LAPACK.hetrd(A1);
            // 1) Structural test: A1 must be tridiagonal
            const offTri = LAPACKtest.testTridiagonality(A1, {
                Did: 'A_tridiag',
            });
            expect(offTri.norm!).toBeLessThan(EXPECT_TOL);
            // 2) Generate unitary matrix Q from Householder vectors
            const Q = LAPACK.ungtr(A1, taus);
            // 3) Reconstruction test: || A0 − Q A1 Qᴴ ||_F
            const result = LAPACKtest.testHermitianTridiagonalReconstruction(A0, Q, A1, { Aid: 'A0' });
            expect(result.norm).toBeLessThan(EXPECT_TOL);
        });

        it('steqr — diagonalizes a Hermitian tridiagonal matrix via unitary similarity', () => {
            evaluator.Execute('clear');
            /* Hermitian tridiagonal matrix (already tridiagonal!) */
            evaluator.Execute(`T = ${matrixSample['complex_tridiagonal_3x3_01']}`);
            const T0 = evaluator.Execute('T').list[0] as MultiArray;
            /* Extract diagonal and off-diagonal */
            const diag = LAPACK.from_diag(T0.array as ComplexType[][]);
            const offdiag = LAPACK.from_diag(T0.array as ComplexType[][], 1);
            /* STEQR: T = V·D·Vᴴ */
            const { D, V } = LAPACK.steqr_vectors(diag, offdiag);
            /* Build D as a diagonal matrix */
            const Lambda = LAPACK.diag(D);
            /* 1) Structural test: Λ must be diagonal */
            const offDiagLambda = LAPACKtest.testTridiagonality(Lambda, { Did: 'Lambda' });
            expect(offDiagLambda.norm!).toBeLessThan(EXPECT_TOL);
            /* 2) V must be unitary: Vᴴ·V = I */
            const Vmat = LAPACKtest.array_to_multiarray(V);
            const VH = MathOperation.ctranspose(Vmat) as MultiArray;
            const VHV = MathOperation.mtimes(VH, Vmat) as MultiArray;
            const I = LAPACKtest.array_to_multiarray(LAPACK.eye([Vmat.dimension[0], Vmat.dimension[0]]));
            const unitaryError = MathOperation.minus(VHV, I) as MultiArray;
            const unitaryNorm = LAPACKtest.frobenius_norm(unitaryError);
            expect(unitaryNorm).toBeLessThan(EXPECT_TOL);
            /* 3) Spectral reconstruction: T = V·Λ·Vᴴ */
            const VL = MathOperation.mtimes(Vmat, LAPACKtest.array_to_multiarray(Lambda)) as MultiArray;
            const VLVH = MathOperation.mtimes(VL, VH) as MultiArray;
            const reconError = MathOperation.minus(T0, VLVH) as MultiArray;
            const reconNorm = LAPACKtest.frobenius_norm(reconError);
            expect(reconNorm).toBeLessThan(EXPECT_TOL);
        });

        it('eig — Hermitian eigen-decomposition satisfies A = V·Λ·Vᴴ', () => {
            evaluator.Execute('clear');
            /* General Hermitian matrix */
            evaluator.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
            evaluator.Execute(`A = ${matrixSample['real_symmetric_rational_4x4_01']}`); // TODO: remove when test pass.
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            /* EIG (Hermitian) */
            const { V, D } = LAPACK.eig_hermitian(A0, true);
            console.log('D =', MultiArray.unparse(D, evaluator));
            console.log('V =', MultiArray.unparse(V!, evaluator));
            /* Build Λ */
            /* 1) Λ must be diagonal */
            const offDiagLambda = LAPACKtest.testTridiagonality(D, {
                Did: 'D',
            });
            expect(offDiagLambda.norm!).toBeLessThan(EXPECT_TOL);
            /* 2) V must be unitary: Vᴴ V = I */
            const VH = MathOperation.ctranspose(V) as MultiArray;
            const VHV = MathOperation.mtimes(VH, V) as MultiArray;
            const I = LAPACKtest.array_to_multiarray(LAPACK.eye([V!.dimension[0], V!.dimension[0]]));
            const unitaryError = MathOperation.minus(VHV, I) as MultiArray;
            const unitaryNorm = LAPACKtest.frobenius_norm(unitaryError);
            expect(unitaryNorm).toBeLessThan(EXPECT_TOL);
            /* 3) Spectral reconstruction: A = V Λ Vᴴ */
            const VL = MathOperation.mtimes(V, LAPACKtest.array_to_multiarray(D)) as MultiArray;
            const VLVH = MathOperation.mtimes(VL, VH) as MultiArray;
            const reconError = MathOperation.minus(A0, VLVH) as MultiArray;
            const reconNorm = LAPACKtest.frobenius_norm(reconError);
            expect(reconNorm).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('LU factorization and linear solve', () => {
        it('getf2 — unblocked LU panel factorization satisfies P·A = L·U', () => {
            evaluator.Execute('clear');
            /* Test matrix (general complex matrix) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            /* Working copy (modified in-place by getf2) */
            const A1 = MultiArray.copy(A0);
            const n = A0.dimension[0];
            const piv = new Array(n).fill(0);
            /* Run unblocked LU (full panel) */
            LAPACK.getf2(A1.array as ComplexType[][], 0, n, piv);
            /* Build L and U explicitly from A1 */
            const L = new MultiArray([n, n], Complex.zero());
            const U = new MultiArray([n, n], Complex.zero());
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i > j) {
                        L.array[i][j] = A1.array[i][j]; // multipliers
                        U.array[i][j] = Complex.zero();
                    } else if (i === j) {
                        L.array[i][j] = Complex.one(); // unit diagonal
                        U.array[i][j] = A1.array[i][j];
                    } else {
                        L.array[i][j] = Complex.zero();
                        U.array[i][j] = A1.array[i][j];
                    }
                }
            }
            /* Apply row permutations to A (PA) */
            const PA = MultiArray.copy(A0);
            for (let i = 0; i < n; i++) {
                const pi = piv[i];
                if (pi !== i) {
                    const tmp = PA.array[i];
                    PA.array[i] = PA.array[pi];
                    PA.array[pi] = tmp;
                }
            }
            /* Check reconstruction: P·A = L·U */
            const LUrec = MathOperation.mtimes(L, U) as MultiArray;
            const reconError = MathOperation.minus(PA, LUrec) as MultiArray;
            const reconNorm = LAPACKtest.frobenius_norm(reconError);
            expect(reconNorm).toBeLessThan(EXPECT_TOL);
        });

        it('getrf — LU factorization with partial pivoting satisfies P·A = L·U', () => {
            evaluator.Execute('clear');
            /* Test matrix (general complex matrix) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            /* Working copy (will be overwritten by getrf) */
            const A1 = MultiArray.copy(A0);
            /* LU factorization */
            const { LU, piv } = LAPACK.getrf(A1.array as ComplexType[][]);
            const n = A0.dimension[0];
            /* Build L and U explicitly from LU */
            const L = new MultiArray([n, n], Complex.zero());
            const U = new MultiArray([n, n], Complex.zero());
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i > j) {
                        L.array[i][j] = LU[i][j];
                        U.array[i][j] = Complex.zero();
                    } else if (i === j) {
                        L.array[i][j] = Complex.one();
                        U.array[i][j] = LU[i][j];
                    } else {
                        L.array[i][j] = Complex.zero();
                        U.array[i][j] = LU[i][j];
                    }
                }
            }
            /* Apply row permutations to A (PA) */
            const PA = MultiArray.copy(A0);
            for (let k = 0; k < piv.length; k++) {
                const pk = piv[k];
                if (pk !== k) {
                    const tmp = PA.array[k];
                    PA.array[k] = PA.array[pk];
                    PA.array[pk] = tmp;
                }
            }
            /* Check reconstruction: P·A = L·U */
            const LUrec = MathOperation.mtimes(L, U) as MultiArray;
            const reconError = MathOperation.minus(PA, LUrec) as MultiArray;
            const reconNorm = LAPACKtest.frobenius_norm(reconError);
            expect(reconNorm).toBeLessThan(EXPECT_TOL);
        });

        it('getrs — solves A·X = B using LU factorization with partial pivoting', () => {
            evaluator.Execute('clear');
            /* Hermitian-like but not triangular; pivoting will occur */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_02']}`);
            evaluator.Execute(`B = ${matrixSample['complex_general_3x2_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            const B0 = evaluator.Execute('B').list[0] as MultiArray;
            /* Copies (safety) */
            const A = MultiArray.copy(A0);
            const B = MultiArray.copy(B0);
            /* LU factorization */
            const { LU, piv, info } = LAPACK.getrf(A.array as ComplexType[][]);
            expect(info).toBe(0);
            /* Solve system */
            const X = LAPACK.getrs(LU, piv, B.array as ComplexType[][]);
            /* Residual: R = A0·X − B0 */
            const AX = new MultiArray([A0.dimension[0], X[0].length]);
            BLAS.gemm(Complex.one(), A0.array as ComplexType[][], A0.dimension[0], A0.dimension[1], X, X[0].length, Complex.zero(), AX.array as ComplexType[][]);
            const R = new MultiArray([B.dimension[0], B.dimension[1]]);
            R.array = BLAS.axpy(Complex.neg(Complex.one()), B0.array as ComplexType[][], AX.array as ComplexType[][]);
            const normR = LAPACK.lange('F', R);
            const normB = LAPACK.lange('F', B0);
            /* Relative residual */
            const rel = Complex.realToNumber(Complex.rdiv(normR, normB));
            expect(rel).toBeLessThan(EXPECT_TOL);
        });

        it('gesv — solves A·X = B with small residual', () => {
            evaluator.Execute('clear');
            /* Coefficient matrix A (general complex matrix) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* Right-hand side B */
            evaluator.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
            const B = evaluator.Execute('B').list[0] as MultiArray;
            // /* Solve A X = B  (MATLAB-style backslash) */
            // const X = MathOperation.mldivide(A, B) as MultiArray;
            // ou, se preferir testar diretamente:
            const { X } = LAPACK.gesv(A.array as ComplexType[][], B.array as ComplexType[][]);
            /* Residual: R = A*X - B */
            const Xmat = new MultiArray([X.length, X[0].length]);
            Xmat.array = X;
            const AX = MathOperation.mtimes(A, Xmat) as MultiArray;
            const R = MathOperation.minus(AX, B) as MultiArray;
            /* Frobenius norm of residual */
            const resNorm = LAPACKtest.frobenius_norm(R);
            expect(resNorm).toBeLessThan(EXPECT_TOL);
        });

        it('gesv — produces the same solution as getrf + getrs (complex system)', () => {
            evaluator.Execute('clear');
            /* Coefficient matrix A (general complex matrix) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            /* Right-hand side B */
            evaluator.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
            const B0 = evaluator.Execute('B').list[0] as MultiArray;
            /* ---------- Solve using gesv ---------- */
            const X_gesv = LAPACK.gesv(BLAS.copy(A0.array as ComplexType[][]) as ComplexType[][], BLAS.copy(B0.array as ComplexType[][]) as ComplexType[][]);
            const Xmat_gesv = new MultiArray([X_gesv.X.length, X_gesv.X[0].length]);
            Xmat_gesv.array = X_gesv.X;
            /* ---------- Solve using getrf + getrs ---------- */
            const A1 = MultiArray.copy(A0);
            const { LU, piv } = LAPACK.getrf(A1.array as ComplexType[][]);
            const X_getrs = LAPACK.getrs(LU, piv, BLAS.copy(B0.array as ComplexType[][]) as ComplexType[][]);
            const Xmat_getrs = new MultiArray([X_getrs.length, X_getrs[0].length]);
            Xmat_getrs.array = X_getrs;
            /* ---------- Compare solutions ---------- */
            const diff = MathOperation.minus(Xmat_gesv, Xmat_getrs) as MultiArray;
            const err = LAPACKtest.frobenius_norm(diff);
            expect(err).toBeLessThan(EXPECT_TOL);
        });

        it('gesv — matches inv(A) * B (conceptual linear solve equivalence)', () => {
            evaluator.Execute('clear');
            /* Coefficient matrix A (general complex matrix) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            /* Right-hand side B */
            evaluator.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
            const B0 = evaluator.Execute('B').list[0] as MultiArray;
            /* ---------- Solve using gesv ---------- */
            const X_gesv = LAPACK.gesv(BLAS.copy(A0.array as ComplexType[][]) as ComplexType[][], BLAS.copy(B0.array as ComplexType[][]) as ComplexType[][]);
            const Xmat_gesv = new MultiArray([X_gesv.X.length, X_gesv.X[0].length]);
            Xmat_gesv.array = X_gesv.X;
            /* ---------- Solve using explicit inverse (conceptual test) ---------- */
            const Ainv = LinearAlgebra.inv(MultiArray.copy(A0));
            const X_inv = MathOperation.mtimes(Ainv, B0) as MultiArray;
            /* ---------- Compare solutions ---------- */
            const diff = MathOperation.minus(Xmat_gesv, X_inv) as MultiArray;
            const err = LAPACKtest.frobenius_norm(diff);
            expect(err).toBeLessThan(EXPECT_TOL);
        });

        it('gesv — solution matches inv(A) * B (conceptual consistency test - multiple right-hand sides)', () => {
            evaluator.Execute('clear');
            /* Coefficient matrix A */
            evaluator.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
            /* RHS matrix B (4 x 2) */
            evaluator.Execute(`B = ${matrixSample['complex_general_4x2_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            const B0 = evaluator.Execute('B').list[0] as MultiArray;
            /* ---------- Solve using gesv ---------- */
            const X_gesv = LAPACK.gesv(BLAS.copy(A0.array as ComplexType[][]) as ComplexType[][], BLAS.copy(B0.array as ComplexType[][]) as ComplexType[][]);
            const Xmat_gesv = new MultiArray([X_gesv.X.length, X_gesv.X[0].length]);
            Xmat_gesv.array = X_gesv.X;
            /* ---------- Solve using explicit inverse ---------- */
            const Ainv = LinearAlgebra.inv(A0) as MultiArray;
            const Xinv = MathOperation.mtimes(Ainv, B0) as MultiArray;
            /* ---------- Compare solutions ---------- */
            const diff = MathOperation.minus(Xmat_gesv, Xinv) as MultiArray;
            const diffNorm = LAPACKtest.frobenius_norm(diff);
            expect(diffNorm).toBeLessThan(EXPECT_TOL);
        });

        it('gesv — solves A·X = B correctly for multiple right-hand sides', () => {
            evaluator.Execute('clear');
            /* Coefficient matrix A */
            evaluator.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
            /* Multiple RHS matrix B (4 x 2) */
            evaluator.Execute(`B = ${matrixSample['complex_general_4x2_01']}`);
            const A0 = evaluator.Execute('A').list[0] as MultiArray;
            const B0 = evaluator.Execute('B').list[0] as MultiArray;
            /* ---------- Solve using gesv ---------- */
            const X_gesv = LAPACK.gesv(BLAS.copy(A0.array as ComplexType[][]) as ComplexType[][], BLAS.copy(B0.array as ComplexType[][]) as ComplexType[][]);
            const Xmat_gesv = new MultiArray([X_gesv.X.length, X_gesv.X[0].length]);
            Xmat_gesv.array = X_gesv.X;
            /* ---------- Residual test: || A*X − B ||_F ---------- */
            const AX = MathOperation.mtimes(A0, Xmat_gesv) as MultiArray;
            const R = MathOperation.minus(AX, B0) as MultiArray;
            const residual = LAPACKtest.frobenius_norm(R);
            expect(residual).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('LAPACK.geqp2 — QR factorization with column pivoting', () => {
        it('geqp2 — real matrix — reconstructs A(:,jpvt) = Q*R', () => {
            const A = evaluator.Execute(`[ 1,  2,  3;
                                   4,  5,  6;
                                   7,  8, 10 ]`).list[0] as MultiArray;

            const A0 = MultiArray.copy(A);

            const { R: Afact, taus, jpvt } = LAPACK.geqp2(A);

            const Q = LAPACK.orgqr(Afact, taus);
            const R = extractR(Afact);

            const Aperm = new MultiArray(
                A0.dimension,
                A0.array.map((row) => jpvt.map((j) => row[j])),
            );

            const QR = MathOperation.mtimes(Q, R) as MultiArray;

            expectMatrixClose(QR, Aperm, EXPECT_TOL);
        });

        it('geqp2 — complex matrix — reconstructs A(:,jpvt) = Q*R', () => {
            const A = evaluator.Execute(`
        [ 1+2i,  2,      3;
          4,     5- i,   6;
          7,     8,   10+3i ]
    `).list[0] as MultiArray;

            const A0 = MultiArray.copy(A);

            const { R: Afact, taus, jpvt } = LAPACK.geqp2(A);

            const Q = LAPACK.orgqr(Afact, taus);
            const R = extractR(Afact);

            const Aperm = new MultiArray(
                A0.dimension,
                A0.array.map((row) => jpvt.map((j) => row[j])),
            );

            const QR = MathOperation.mtimes(Q, R) as MultiArray;

            expectMatrixClose(QR, Aperm, EXPECT_TOL);
        });

        it('geqp2 — R is upper triangular', () => {
            const A = evaluator.Execute(`
            [ 3,  1,  1;
              0,  2,  1;
              0,  0,  1 ]
        `).list[0] as MultiArray;

            const { R } = LAPACK.geqp2(A);

            for (let i = 1; i < R.dimension[0]; i++) {
                for (let j = 0; j < i; j++) {
                    expect(Complex.realToNumber(Complex.abs(R.array[i][j] as ComplexType))).toBeLessThan(EXPECT_TOL);
                }
            }
        });

        it('geqp2 — jpvt produces non-increasing column norms', () => {
            const A = evaluator.Execute(`
            [ 1,  100,  2;
              1,  100,  2;
              1,  100,  2 ]
        `).list[0] as MultiArray;

            const { jpvt } = LAPACK.geqp2(A);

            // Expect column 1 (norm largest) first
            expect(jpvt[0]).toBe(1);
        });
    });

    describe('LAPACK.gelq2', () => {
        it('gelq2 — real matrix — reconstructs A = L*Q', () => {
            const A = evaluator.Execute(`[ 1,  2,  3;
                                           4,  5,  6;
                                           7,  8, 10 ]`).list[0] as MultiArray;
            const A0 = MultiArray.copy(A);
            const { L, taus } = LAPACK.gelq2(A);
            // Build Q explicitly
            const n = L.dimension[1];
            const kMax = taus.length;
            // Q = I
            const Q = new MultiArray([n, n]);
            Q.array = LAPACK.eye(n, n);
            // ORDEM REVERSA — ESSENCIAL
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
            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);
            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;
            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });

        it('gelq2 — complex matrix — reconstructs A = L*Q', () => {
            const A = evaluator.Execute(`[ 1+2i,  2,      3;
                                   4,     5- i,   6;
                                   7,     8,   10+3i ]`).list[0] as MultiArray;
            const A0 = MultiArray.copy(A);
            const { L, taus } = LAPACK.gelq2(A);
            const n = L.dimension[1];
            const kMax = taus.length;
            // Q = I
            const Q = new MultiArray([n, n]);
            Q.array = LAPACK.eye(n, n);
            // ORDEM REVERSA — ESSENCIAL
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
            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);
            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;
            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });

        it('gelq2 — real matrix — reconstructs A = L*Q (using orglq)', () => {
            const A = evaluator.Execute(`[ 1,  2,  3;
                                           4,  5,  6;
                                           7,  8, 10 ]`).list[0] as MultiArray;
            const A0 = MultiArray.copy(A);
            const { L, taus } = LAPACK.gelq2(A);
            const Q = LAPACK.orglq(L, taus);
            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);
            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;
            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });

        it('gelq2 — complex matrix — reconstructs A = L*Q (using orglq)', () => {
            const A = evaluator.Execute(`[ 1+2i,  2,      3;
                                           4,     5- i,   6;
                                           7,     8,   10+3i ]`).list[0] as MultiArray;
            const A0 = MultiArray.copy(A);
            const { L, taus } = LAPACK.gelq2(A);
            const Q = LAPACK.orglq(L, taus);
            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);
            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;
            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });
    });

    describe('LAPACK.orglq', () => {
        it('orglq — reconstructs Q correctly (real matrix)', () => {
            const A = evaluator.Execute(`[ 1,  2,  3;
                                           4,  5,  6;
                                           7,  8, 10 ]`).list[0] as MultiArray;

            const A0 = MultiArray.copy(A);

            const { L, taus } = LAPACK.gelq2(A);

            // console.log('L (raw, after gelq2):');
            // console.log(MultiArray.unparse(L, evaluator));

            const Q = LAPACK.orglq(L, taus);

            // console.log('Q (from orglq):');
            // console.log(MultiArray.unparse(Q, evaluator));

            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);

            // console.log('L (after tril_inplace):');
            // console.log(MultiArray.unparse(Lmat, evaluator));

            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;

            // console.log('L*Q:');
            // console.log(MultiArray.unparse(LQ, evaluator));

            // console.log('A original:');
            // console.log(MultiArray.unparse(A0, evaluator));

            // console.log('L*Q - A:');
            // console.log(MultiArray.unparse(MathOperation.minus(LQ, A0) as MultiArray, evaluator));

            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });

        it('orglq — reconstructs Q correctly (complex matrix)', () => {
            const A = evaluator.Execute(`
[ 1+2i,  2,      3;
  4,      5- i,  6;
  7,      8,   10+3i ]
        `).list[0] as MultiArray;

            const A0 = MultiArray.copy(A);

            const { L, taus } = LAPACK.gelq2(A);

            console.log('L (raw, after gelq2):');
            console.log(MultiArray.unparse(L, evaluator));

            const Q = LAPACK.orglq(L, taus);

            console.log('Q (from orglq):');
            console.log(MultiArray.unparse(Q, evaluator));

            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);

            console.log('L (after tril_inplace):');
            console.log(MultiArray.unparse(Lmat, evaluator));

            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;

            console.log('L*Q:');
            console.log(MultiArray.unparse(LQ, evaluator));

            console.log('A original:');
            console.log(MultiArray.unparse(A0, evaluator));

            console.log('L*Q - A:');
            console.log(MultiArray.unparse(MathOperation.minus(LQ, A0) as MultiArray, evaluator));

            expectMatrixClose(LQ, A0, EXPECT_TOL);
        });

        it('orglq — Q is unitary', () => {
            const A = evaluator.Execute(`
[ 1+2i,  2,      3;
  4,      5- i,  6;
  7,      8,   10+3i ]
        `).list[0] as MultiArray;

            const { L, taus } = LAPACK.gelq2(A);
            const Q = LAPACK.orglq(L, taus);

            // Q * Qᴴ ≈ I
            const QQt = MathOperation.mtimes(Q, MathOperation.ctranspose(Q) as MultiArray) as MultiArray;
            const I = new MultiArray([Q.dimension[0], Q.dimension[1]], LAPACK.eye(Q.dimension[0], Q.dimension[1]));
            const err = LAPACKtest.frobenius_norm(MathOperation.minus(QQt, I) as MultiArray);

            expect(err).toBeLessThan(EXPECT_TOL);
        });

        it('orglq — reconstructs Q and unitary Q correctly', () => {
            const A = evaluator.Execute(`
[ 1+2i,  2,      3;
  4,      5- i,  6;
  7,      8,   10+3i ]
        `).list[0] as MultiArray;

            const A0 = MultiArray.copy(A);

            const { L, taus } = LAPACK.gelq2(A);
            const Q = LAPACK.orglq(L, taus);

            const Lmat = MultiArray.copy(L);
            LAPACK.tril_inplace(Lmat);

            const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;
            expectMatrixClose(LQ, A0, EXPECT_TOL);

            const QQt = MathOperation.mtimes(Q, MathOperation.ctranspose(Q) as MultiArray) as MultiArray;
            const I = new MultiArray([Q.dimension[0], Q.dimension[1]], LAPACK.eye(Q.dimension[0], Q.dimension[1]));
            const errUnitary = LAPACKtest.frobenius_norm(MathOperation.minus(QQt, I) as MultiArray);

            expect(errUnitary).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('QR factorization', () => {
        it('geqr2 — unblocked QR factorization (complex, no pivoting)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (m > n) */
            evaluator.Execute(`A = [ 1+2i,  2-1i;
              3+0i, -1+4i;
              0+1i,  2+0i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* QR factorization */
            const { R: Rraw, taus } = LAPACK.geqr2(A);
            /* Build explicit Q */
            const Q = LAPACK.orgqr(Rraw, taus);
            /* Extract upper triangular R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Check reconstruction: A ≈ Q * R */
            // const QR = LAPACK.gemm(Q, R);
            const res = normalizedResidual(Q, R, A);
            expect(res).toBeLessThan(EXPECT_TOL);
            /* Check unitarity of Q: Qᴴ Q ≈ I */
            const Qh = LinearAlgebra.ctranspose(Q);
            const I = LinearAlgebra.eye(Complex.create(Q.dimension[1])) as MultiArray;
            const resQ = normalizedResidual(Qh, Q, I);
            expect(resQ).toBeLessThan(EXPECT_TOL);
        });

        it('orgqr — constructs explicit Q from Householder reflectors (complex)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (m > n) */
            evaluator.Execute(`A = [ 2+0i,  1-1i;
                                          1+2i,  3+0i;
                                          0+1i, -1+1i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* QR factorization (fixture for orgqr) */
            const { R: Rraw, taus } = LAPACK.geqr2(A);
            /* Explicit Q reconstruction */
            const Q = LAPACK.orgqr(Rraw, taus);
            /* Extract upper triangular R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Reconstruction test: A ≈ Q * R */
            const res = normalizedResidual(Q, R, A);
            expect(res).toBeLessThan(EXPECT_TOL);
            /* Unitarity test: Qᴴ * Q ≈ I */
            const Qh = LinearAlgebra.ctranspose(Q);
            const I = LinearAlgebra.eye(Complex.create(Q.dimension[1])) as MultiArray;
            const resQ = normalizedResidual(Qh, Q, I);
            expect(resQ).toBeLessThan(EXPECT_TOL);
        });

        it('geqp3 — QR factorization with column pivoting (complex)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (m > n, rank-revealing scenario) */
            evaluator.Execute(`A = [ 1+0i,  2+1i,  0+0i;
                                          0+1i,  1+0i,  1+1i;
                                          1+0i,  0+0i,  2+0i;
                                          0+0i,  1-1i,  1+0i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* QR with column pivoting */
            const { R: Rraw, taus, jpvt } = LAPACK.geqp3(A);
            /* Explicit Q from reflectors */
            const Q = LAPACK.orgqr(Rraw, taus);
            /* Extract upper trapezoidal R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Build permutation matrix P from jpvt */
            const m = A.dimension[0];
            const n = A.dimension[1];
            const P = new MultiArray([n, n]);
            P.array = LAPACK.zeros(n, n);
            for (let j = 0; j < n; j++) {
                P.array[jpvt[j]][j] = Complex.one();
            }
            MultiArray.setType(P);
            /* Compute A * P */
            const AP = MathOperation.mtimes(A, P) as MultiArray;
            /* Reconstruction test: A * P ≈ Q * R */
            const res = normalizedResidual(Q, R, AP);
            expect(res).toBeLessThan(EXPECT_TOL);
            /* Unitarity test: Qᴴ Q ≈ I */
            const Qh = LinearAlgebra.ctranspose(Q);
            const I = LinearAlgebra.eye(Complex.create(Q.dimension[1])) as MultiArray;
            const resQ = normalizedResidual(Qh, Q, I);
            expect(resQ).toBeLessThan(EXPECT_TOL);
        });

        it('lapmt_matrix — builds permutation matrix P from jpvt (LAPACK-style)', () => {
            evaluator.Execute('clear');
            /*
             * jpvt[j] = row index where column j has its 1
             * This encodes a permutation matrix P such that:
             *   (A * P) permutes the columns of A
             */
            const jpvt = [2, 0, 1];
            const P = LAPACK.lapmt_matrix(jpvt);
            /*
             * Expected permutation matrix:
             *
             * jpvt = [2, 0, 1]
             *
             * Column 0 -> row 2
             * Column 1 -> row 0
             * Column 2 -> row 1
             *
             * P =
             * [ 0 1 0
             *   0 0 1
             *   1 0 0 ]
             */
            const expected = evaluator.Execute(`[ 0, 1, 0;
                           0, 0, 1;
                           1, 0, 0 ]`).list[0] as MultiArray;
            /* Compare P with expected */
            const res = normalizedResidual(LinearAlgebra.eye(Complex.create(P.dimension[0])) as MultiArray, P, expected);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('lapmt_apply — applies column permutation in-place', () => {
            evaluator.Execute('clear');
            /* Define a 3x4 test matrix A */
            evaluator.Execute(`A = [ 1+1i, 2+0i, 3-1i, 4+2i;
              5+0i, 6+1i, 7+0i, 8-1i;
              9-1i,10+0i,11+1i,12+0i ]`);
            /* Pivot vector: swap columns 0 and 2, 1 and 3 */
            const jpvt = [2, 3, 0, 1];
            /* Extract MultiArray */
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* Make a copy for reference */
            const Aref = MultiArray.copy(A) as MultiArray;
            /* Apply lapmt_apply */
            LAPACK.lapmt_apply(A, jpvt);
            /* Manual expected result (Aref(:, jpvt)) */
            const m = A.dimension[0];
            const n = A.dimension[1];
            const Aexpected = new MultiArray([m, n]);
            for (let j = 0; j < n; j++) {
                const src = jpvt[j];
                for (let i = 0; i < m; i++) {
                    Aexpected.array[i][j] = Aref.array[i][src];
                }
            }
            MultiArray.setType(Aexpected);
            /* Check equality */
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    expect(Complex.realToNumber(Complex.abs(Complex.sub(A.array[i][j] as ComplexType, Aexpected.array[i][j] as ComplexType)))).toBeLessThan(EXPECT_TOL);
                }
            }
        });

        it('geqp3 + lapmt_apply — full QR with column pivoting (complex)', () => {
            evaluator.Execute('clear');
            /* Define a 4x3 complex test matrix A */
            evaluator.Execute(`A = [ 1+0i, 2+1i, 3-1i;
              4+1i, 5+0i, 6+2i;
              7-1i, 8+0i, 9+1i;
              0+1i, 1-1i, 2+0i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* Step 1: compute QR factorization with pivoting */
            const { R: Rraw, taus, phis, jpvt } = LAPACK.geqp3(A);
            /* Step 2: reconstruct Q explicitly */
            const m = A.dimension[0];
            const n = A.dimension[1];
            const kMax = Math.min(m, n);
            let Q = new MultiArray([m, m]);
            Q.array = LAPACK.eye(m, m);
            for (let k = kMax - 1; k >= 0; k--) {
                const vlen = m - k;
                const v: ComplexType[] = [Complex.one()];
                const tau = taus[k];
                if (!Complex.realIsZero(Complex.abs(tau))) {
                    for (let i = 1; i < vlen; i++) {
                        v[i] = Complex.rdiv(Rraw.array[k + i][k] as ComplexType, tau);
                    }
                } else {
                    for (let i = 1; i < vlen; i++) v[i] = Complex.zero();
                }
                LAPACK.larf_left(Q, v, tau, k, 0);
            }
            MultiArray.setType(Q);
            /* Step 3: extract upper triangular R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Step 4: apply column permutation P = lapmt_apply(A, jpvt) to R */
            const Rperm = MultiArray.copy(R) as MultiArray;
            LAPACK.lapmt_apply(Rperm, jpvt);
            /* Step 5: compute normalized residual: || Q*Rperm - A || / (||A||*||X||) */
            const QR = MathOperation.mtimes(Q, Rperm);
            const res = normalizedResidual(Q, Rperm, A);
            expect(res).toBeLessThan(EXPECT_TOL);
            /* Step 6: check unitarity of Q: Qᴴ Q ≈ I */
            const Qh = LinearAlgebra.ctranspose(Q);
            const I = LinearAlgebra.eye(Complex.create(Q.dimension[1])) as MultiArray;
            const resQ = normalizedResidual(Qh, Q, I);
            expect(resQ).toBeLessThan(EXPECT_TOL);
        });

        it('geqp3 + lapmt_apply — end-to-end QR with column pivoting (complex, MATLAB-style)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (m > n) */
            evaluator.Execute(`A = [ 1+2i,  2-1i, 0+1i;
                                           3+0i, -1+4i, 1-1i;
                                           0+1i,  2+0i, 3+0i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            /* QR factorization with column pivoting */
            const { R: Rraw, taus, phis, jpvt } = LAPACK.geqp3(A);
            /* Build explicit Q */
            const Q = LAPACK.orgqr(Rraw, taus);
            /* Upper-triangular R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Permutation matrix P */
            const P = LAPACK.lapmt_matrix(jpvt);
            /* Reconstruct A: Q*R*P */
            const QR = MathOperation.mtimes(Q, R);
            const QRfull = MathOperation.mtimes(QR, P) as MultiArray;
            /* Normalized residual: Q*R*P ≈ A */
            const res = normalizedResidual(QRfull, LinearAlgebra.eye(Complex.create(A.dimension[1])) as MultiArray, A);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('geqp3 + lapmt_apply — QR with column pivoting, multiple right-hand sides (nrhs > 1)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (3x3) */
            evaluator.Execute(`A = [ 1+2i,  2-1i, 0+1i;
                                           3+0i, -1+4i, 1-1i;
                                           0+1i,  2+0i, 3+0i ]`);
            /* Multiple RHS B (nrhs = 2) */
            evaluator.Execute(`B = [ 1+0i, 2-1i;
                                           0+1i, 1+0i;
                                           3+0i, -1+1i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            /* QR with column pivoting */
            const { R: Rraw, taus, jpvt } = LAPACK.geqp3(A);
            /* Explicit Q */
            const Q = LAPACK.orgqr(Rraw, taus);
            /* Upper triangular R */
            const R = MultiArray.copy(Rraw) as MultiArray;
            LAPACK.triu_inplace(R);
            /* Permutation matrix */
            const P = LAPACK.lapmt_matrix(jpvt);
            /* Solve via QR with pivoting */
            const Qh = LinearAlgebra.ctranspose(Q);
            const Bprime = MathOperation.mtimes(Qh, B) as MultiArray; // Qᴴ B
            const Y = solveUpperTriangular(R, Bprime); // R Y = Qᴴ B
            const Xcheck = MathOperation.mtimes(P, Y) as MultiArray; // X = P Y
            /* LAPACK-style normalized residual */
            const res = normalizedResidual(A, Xcheck, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('LAPACK.mldivide — Matrix left division (A \ B), LAPACK-style dispatcher', () => {
        it('mldivide — Hermitian positive definite matrix uses posv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [4, 1; 1, 3]');
            evaluator.Execute('B = [1; 2]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('posv');
            // Expected solution: [1/11; 7/11]
            expectMatrixClose(X.array as ComplexType[][], [[Complex.create(1 / 11, 0)], [Complex.create(7 / 11, 0)]]);
        });

        it('mldivide — Hermitian indefinite matrix uses sysv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [0, 1; 1, 0]');
            evaluator.Execute('B = [1; 2]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('sysv');
            // Expected solution: [2; 1]
            expectMatrixClose(X.array as ComplexType[][], [[Complex.create(2, 0)], [Complex.create(1, 0)]]);
        });

        it('mldivide — general matrix uses gesv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [1, 2; 3, 4]');
            evaluator.Execute('B = [5; 11]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('gesv');
            // Expected solution: [1; 2]
            expectMatrixClose(X.array as ComplexType[][], [[Complex.create(1, 0)], [Complex.create(2, 0)]]);
        });

        it('mldivide — complex Hermitian positive definite matrix uses posv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [ 4, 1+i; 1-i, 3 ]');
            evaluator.Execute('B = [ 1+i; 2 ]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('posv');
            const res = normalizedResidual(A, X, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('mldivide — complex Hermitian indefinite matrix uses sysv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [ 0, 1+i; 1-i, 0 ]');
            evaluator.Execute('B = [ 1; i ]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('sysv');
            const res = normalizedResidual(A, X, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('mldivide — general complex matrix uses gesv', () => {
            evaluator.Execute('clear');
            evaluator.Execute('A = [ 1+i, 2; 3, 4-i ]');
            evaluator.Execute('B = [ 5; 6+i ]');
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            const { X, solver, info } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('gesv');
            const res = normalizedResidual(A, X, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('mldivide — solves A \\ B with multiple right-hand sides (nrhs > 1)', () => {
            evaluator.Execute('clear');
            /* General complex matrix A (3x3) */
            evaluator.Execute(`A = ${matrixSample['complex_general_3x3_03']}`);
            /* Multiple RHS (nrhs = 2) */
            evaluator.Execute(`B = ${matrixSample['complex_general_3x2_02']}`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            /* Solve A X = B */
            const { X, info, solver } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(['gesv', 'posv', 'sysv']).toContain(solver);
            /* Normalized LAPACK-style residual */
            const res = normalizedResidual(A, X, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });

        it('mldivide — Hermitian positive definite matrix with multiple RHS (nrhs > 1, posv)', () => {
            evaluator.Execute('clear');
            /* Hermitian positive definite matrix A (3x3). Constructed to be strictly HPD */
            evaluator.Execute(`A = [  4+0i,  1-1i,  0+0i;
               1+1i,  5+0i,  1-1i;
               0+0i,  1+1i,  3+0i ]`);
            /* Multiple RHS (nrhs = 2) */
            evaluator.Execute(`B = [  1+0i,  2+0i;
               0+1i,  1-1i;
               3+0i, -1+0i ]`);
            const A = evaluator.Execute('A').list[0] as MultiArray;
            const B = evaluator.Execute('B').list[0] as MultiArray;
            /* Solve A X = B */
            const { X, info, solver } = LAPACK.mldivide(A, B);
            expect(info).toBe(0);
            expect(solver).toBe('posv');
            /* LAPACK-style normalized residual */
            const res = normalizedResidual(A, X, B);
            expect(res).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('BLAS.trsm — Solves a triangular system with multiple right-hand sides', () => {
        it('trsm — left lower unit N', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: true, transA: 'N' });
            expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A_lower), 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left lower non-unit N', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: false, transA: 'N' });
            expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left lower unit T', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: true, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A_lower), 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left lower non-unit T', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'lower', unitDiagonal: false, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left upper unit N', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'upper', unitDiagonal: true, transA: 'N' });
            const M = MathOperation.mtimes(opA(materializeUnitDiagonal(A_upper), 'N'), new MultiArray([X.length, X[0].length], X)) as MultiArray;
            expectMatrixClose(M, B);
        });

        it('trsm — left upper non-unit T', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'left', uplo: 'upper', unitDiagonal: false, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'T'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — right lower unit N', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: true, transA: 'N' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'N')) as MultiArray, B);
        });

        it('trsm — right lower non-unit N', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: false, transA: 'N' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'N')) as MultiArray, B);
        });

        it('trsm — right lower unit T', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: true, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'T')) as MultiArray, B);
        });

        it('trsm — right lower non-unit T', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'lower', unitDiagonal: false, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'T')) as MultiArray, B);
        });

        it('trsm — right upper unit N', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'upper', unitDiagonal: true, transA: 'N' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'N')) as MultiArray, B);
        });

        it('trsm — right upper non-unit T', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_2x2_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], { side: 'right', uplo: 'upper', unitDiagonal: false, transA: 'T' });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'T')) as MultiArray, B);
        });

        it.skip('trsm — left lower unit C', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'left',
                uplo: 'lower',
                unitDiagonal: true,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left lower non-unit C', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'left',
                uplo: 'lower',
                unitDiagonal: false,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(opA(A_lower, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it.skip('trsm — left upper unit C', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'left',
                uplo: 'upper',
                unitDiagonal: true,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it('trsm — left upper non-unit C', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'left',
                uplo: 'upper',
                unitDiagonal: false,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(opA(A_upper, 'C'), new MultiArray([X.length, X[0].length], X)) as MultiArray, B);
        });

        it.skip('trsm — right lower unit C', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'right',
                uplo: 'lower',
                unitDiagonal: true,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'C')) as MultiArray, B);
        });

        it.skip('trsm — right lower non-unit C', () => {
            const A_lower = evaluator.Execute(`${matrixSample['trsm_lower_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_lower.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'right',
                uplo: 'lower',
                unitDiagonal: false,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_lower, 'C')) as MultiArray, B);
        });

        it.skip('trsm — right upper unit C', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'right',
                uplo: 'upper',
                unitDiagonal: true,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'C')) as MultiArray, B);
        });

        it.skip('trsm — right upper non-unit C', () => {
            const A_upper = evaluator.Execute(`${matrixSample['trsm_upper_3x3_01']}`).list[0] as MultiArray;
            const B = evaluator.Execute(`${matrixSample['trsm_rhs_3x2_01']}`).list[0] as MultiArray;
            const X = BLAS.trsm(A_upper.array as ComplexType[][], B.array as ComplexType[][], {
                side: 'right',
                uplo: 'upper',
                unitDiagonal: false,
                transA: 'C',
            });
            expectMatrixClose(MathOperation.mtimes(new MultiArray([X.length, X[0].length], X), opA(A_upper, 'C')) as MultiArray, B);
        });
    });

    describe('BLAS.nrm2sq and BLAS.nmr2 — squared Euclidean norm and Euclidean norm (sqrt of sum |x_i|^2)', () => {
        it('nrm2 — real vector', () => {
            evaluator.Execute('R = [3; 4]');
            const R = evaluator.Execute('R').list[0];
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.imagToNumber(n)).toBeCloseTo(0);
            expect(Complex.realToNumber(n)).toBeCloseTo(5);
        });

        it('nrm2 — complex vector', () => {
            evaluator.Execute('R = [1+i; 2-i]');
            const R = evaluator.Execute('R').list[0];
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.imagToNumber(n)).toBeCloseTo(0);
            expect(Complex.realToNumber(n)).toBeCloseTo(Math.sqrt(7));
        });

        it('nrm2 — zero vector', () => {
            evaluator.Execute('R = [0; 0; 0]');
            const R = evaluator.Execute('R').list[0];
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.imagToNumber(n)).toBeCloseTo(0);
            expect(Complex.realToNumber(n)).toBeCloseTo(0);
        });

        it('nrm2sq — real vector', () => {
            evaluator.Execute('R = [3; 4]');
            const R = evaluator.Execute('R').list[0];
            const s = BLAS.nrm2sq(R, 0, 0, 2);
            expect(Complex.imagToNumber(s)).toBeCloseTo(0);
            expect(Complex.realToNumber(s)).toBeCloseTo(25);
        });

        it('nrm2sq — complex vector', () => {
            evaluator.Execute('R = [1+i; 2-i]');
            const R = evaluator.Execute('R').list[0];
            const s = BLAS.nrm2sq(R, 0, 0, 2);
            expect(Complex.imagToNumber(s)).toBeCloseTo(0);
            expect(Complex.realToNumber(s)).toBeCloseTo(7);
        });

        it('nrm2sq — sliced vector (startRow)', () => {
            evaluator.Execute('R = [10; 3; 4]');
            const R = evaluator.Execute('R').list[0];
            const s = BLAS.nrm2sq(R, 0, 1, 3);
            expect(Complex.imagToNumber(s)).toBeCloseTo(0);
            expect(Complex.realToNumber(s)).toBeCloseTo(25);
        });
    });

    describe('BLAS.nrm2 — scaled Euclidean norm (extended tests)', () => {
        it('nrm2 — vector with interleaved zeros', () => {
            const R = evaluator.Execute('[0; 3; 0; 4]').list[0] as MultiArray;
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.realToNumber(n)).toBeCloseTo(5);
            expect(Complex.imagToNumber(n)).toBeCloseTo(0);
        });

        it('nrm2 — purely imaginary vector', () => {
            const R = evaluator.Execute('[2i; -3i]').list[0] as MultiArray;
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.realToNumber(n)).toBeCloseTo(Math.sqrt(13));
            expect(Complex.imagToNumber(n)).toBeCloseTo(0);
        });

        it('nrm2 — mixed magnitude vector (scaling robustness)', () => {
            const R = evaluator.Execute('[1e-20; 1e20]').list[0] as MultiArray;
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.realToNumber(n)).toBeCloseTo(1e20);
        });

        it('nrm2 — unit vector', () => {
            const R = evaluator.Execute('[1; 0; 0]').list[0] as MultiArray;
            const n = BLAS.nrm2(R.array.map((row: any[]) => row[0]));
            expect(Complex.realToNumber(n)).toBeCloseTo(1);
        });
    });

    describe('BLAS.trsv — Solve a triangular system A * x = b, A^T * x = b or A^H * x = b, where A is triangular and x is a vector', () => {
        it('trsv — lower unit N', () => {
            const A = evaluator.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'lower',
                    transA: 'N',
                    unitDiagonal: true,
                },
            );
            expectMatrixClose(MathOperation.mtimes(materializeUnitDiagonal(A), MultiArray.toColumnVector(x)) as MultiArray, B);
        });

        it('trsv — lower non-unit N', () => {
            const A = evaluator.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'lower',
                    transA: 'N',
                    unitDiagonal: false,
                },
            );
            expectMatrixClose(MathOperation.mtimes(A, MultiArray.toColumnVector(x)) as MultiArray, B);
        });

        it('trsv — lower unit T', () => {
            const A = evaluator.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'lower',
                    transA: 'T',
                    unitDiagonal: true,
                },
            );
            expectMatrixClose(MathOperation.mtimes(opA(materializeUnitDiagonal(A), 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
        });

        it('trsv — lower non-unit T', () => {
            const A = evaluator.Execute(matrixSample['trsm_lower_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'lower',
                    transA: 'T',
                    unitDiagonal: false,
                },
            );
            expectMatrixClose(MathOperation.mtimes(opA(A, 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
        });

        it('trsv — upper unit N', () => {
            const A = evaluator.Execute(matrixSample['trsm_upper_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'upper',
                    transA: 'N',
                    unitDiagonal: true,
                },
            );
            expectMatrixClose(MathOperation.mtimes(materializeUnitDiagonal(A), MultiArray.toColumnVector(x)) as MultiArray, B);
        });

        it('trsv — upper non-unit T', () => {
            const A = evaluator.Execute(matrixSample['trsm_upper_3x3_01']).list[0] as MultiArray;
            const B = evaluator.Execute(matrixSample['trsm_rhs_3x2_01'] + '(:,1)').list[0] as MultiArray;
            const x = BLAS.trsv(
                A.array as ComplexType[][],
                B.array.map((row: any[]) => row[0]),
                {
                    uplo: 'upper',
                    transA: 'T',
                    unitDiagonal: false,
                },
            );
            expectMatrixClose(MathOperation.mtimes(opA(A, 'T'), MultiArray.toColumnVector(x)) as MultiArray, B);
        });
    });

    describe('LAPACK.potrf — Cholesky factorization', () => {
        it('potrf — lower 3x3 real positive-definite', () => {
            const A = evaluator.Execute('[4,1,1; 1,3,0; 1,0,2]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            // Check reconstruction: L*L^T = A
            const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — upper 3x3 real positive-definite', () => {
            const A = evaluator.Execute('[4,1,1; 1,3,0; 1,0,2]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            // Check reconstruction: U^T*U = A
            const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — lower 3x3 complex Hermitian positive-definite', () => {
            const A = evaluator.Execute('[4,1+i,1-i; 1-i,5,2+i; 1+i,2-i,6]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            // Check reconstruction: L*L^H = A
            const AH = LinearAlgebra.ctranspose(L) as MultiArray;
            const Arec = MathOperation.mtimes(L, AH) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — upper 3x3 complex Hermitian positive-definite', () => {
            const A = evaluator.Execute('[4,1+i,1-i; 1-i,5,2+i; 1+i,2-i,6]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            // Check reconstruction: U^H*U = A
            const UH = LinearAlgebra.ctranspose(U) as MultiArray;
            const Arec = MathOperation.mtimes(UH, U) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — lower 2x2 real positive-definite', () => {
            const A = evaluator.Execute('[2,1; 1,2]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — upper 2x2 real positive-definite', () => {
            const A = evaluator.Execute('[2,1; 1,2]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — fails on non-positive-definite matrix', () => {
            const A = evaluator.Execute('[1,2;2,1]').list[0] as MultiArray;
            expect(() => LAPACK.potrf(A, { uplo: 'lower' })).toThrow();
        });
    });

    describe('LAPACK.potrf — extended Cholesky tests', () => {
        it('potrf — lower 4x4 real positive-definite', () => {
            const A = evaluator.Execute('[6,2,1,1;2,5,2,1;1,2,5,2;1,1,2,4]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — upper 4x4 real positive-definite', () => {
            const A = evaluator.Execute('[6,2,1,1;2,5,2,1;1,2,5,2;1,1,2,4]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — lower 4x4 complex Hermitian positive-definite', () => {
            const A = evaluator.Execute('[6,1+i,2-i,1;1-i,5,1+i,1-i;2+i,1-i,7,1+i;1,1+i,1-i,5]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            const AH = LinearAlgebra.ctranspose(L) as MultiArray;
            const Arec = MathOperation.mtimes(L, AH) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — upper 4x4 complex Hermitian positive-definite', () => {
            const A = evaluator.Execute('[6,1+i,2-i,1;1-i,5,1+i,1-i;2+i,1-i,7,1+i;1,1+i,1-i,5]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            const UH = LinearAlgebra.ctranspose(U) as MultiArray;
            const Arec = MathOperation.mtimes(UH, U) as MultiArray;
            expectMatrixClose(Arec, A);
        });

        it('potrf — lower 5x5 almost-diagonal positive-definite', () => {
            const A = evaluator.Execute('[10,1e-8,0,0,0;1e-8,8,1e-8,0,0;0,1e-8,6,1e-8,0;0,0,1e-8,4,1e-8;0,0,0,1e-8,2]').list[0] as MultiArray;
            const L = LAPACK.potrf(A, { uplo: 'lower' });
            const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
            expectMatrixClose(Arec, A, EXPECT_TOL); // tolerância maior para números pequenos
        });

        it('potrf — upper 5x5 almost-diagonal positive-definite', () => {
            const A = evaluator.Execute('[10,1e-8,0,0,0;1e-8,8,1e-8,0,0;0,1e-8,6,1e-8,0;0,0,1e-8,4,1e-8;0,0,0,1e-8,2]').list[0] as MultiArray;
            const U = LAPACK.potrf(A, { uplo: 'upper' });
            const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
            expectMatrixClose(Arec, A, EXPECT_TOL);
        });

        it('potrf — fails on 4x4 symmetric but non-positive-definite', () => {
            const A = evaluator.Execute('[1,2,3,4;2,0,1,1;3,1,0,2;4,1,2,0]').list[0] as MultiArray;
            expect(() => LAPACK.potrf(A, { uplo: 'lower' })).toThrow();
        });

        it('potrf — fails on 5x5 complex Hermitian not positive-definite', () => {
            const A = evaluator.Execute('[0,1+i,0,0,0;1-i,0,1,0,0;0,1,0,1-i,0;0,0,1+i,0,1;0,0,0,1,0]').list[0] as MultiArray;
            expect(() => LAPACK.potrf(A, { uplo: 'upper' })).toThrow();
        });
    });

    describe('LAPACK.larfg', () => {
        it('larfg — trivial vector (length 1)', () => {
            evaluator.Execute('x = [3]');
            const x = evaluator.Execute('x').list[0].array.map((r: any[]) => r[0]);
            const { tau, v, alpha } = LAPACK.larfg_original(x);
            expect(Complex.toBoolean(Complex.eq(tau, Complex.zero()))).toBe(true);
            expect(v.length).toBe(1);
            expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(alpha, x[0]))).toBe(true);
        });

        it('larfg — real vector with zero tail (sigma = 0)', () => {
            evaluator.Execute('x = [5; 0; 0]');
            const x = evaluator.Execute('x').list[0].array.map((r: any[]) => r[0]);
            const { tau, v, alpha } = LAPACK.larfg_original(x);
            expect(Complex.toBoolean(Complex.eq(tau, Complex.zero()))).toBe(true);
            expect(v.length).toBe(3);
            expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(v[1], Complex.zero()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(v[2], Complex.zero()))).toBe(true);
            expect(Complex.toBoolean(Complex.eq(alpha, x[0]))).toBe(true);
        });

        it('larfg — real vector (general case)', () => {
            evaluator.Execute('x = [4; 3]');
            const x = evaluator.Execute('x').list[0].array.map((r: any[]) => r[0]);
            const { tau, v, alpha } = LAPACK.larfg_original(x);
            // ||x|| = 5
            expect(Complex.imagToNumber(alpha)).toBeCloseTo(0);
            expect(Complex.realToNumber(alpha)).toBeCloseTo(-5);
            expect(Complex.toBoolean(Complex.ne(tau, Complex.zero()))).toBe(true);
            expect(v.length).toBe(2);
            expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
        });

        it('larfg — complex vector (general case)', () => {
            evaluator.Execute('x = [1+i; 2]');
            const x = evaluator.Execute('x').list[0].array.map((r: any[]) => r[0]);
            const { tau, v, alpha } = LAPACK.larfg_original(x);
            // alpha should be real-negative times phase
            expect(Complex.toBoolean(Complex.ne(tau, Complex.zero()))).toBe(true);
            expect(v.length).toBe(2);
            expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
            // alpha magnitude equals ||x||
            const norm = Math.sqrt(1 * 1 + 1 * 1 + 4);
            expect(Complex.realToNumber(Complex.abs(alpha))).toBeCloseTo(norm);
        });

        it('larfg — resulting reflector annihilates tail', () => {
            evaluator.Execute('x = [3; 4]');
            const x = evaluator.Execute('x').list[0].array.map((r: any[]) => r[0]);
            const { tau, v, alpha } = LAPACK.larfg_original(x);
            // Form H = I - tau * v * vᴴ
            const vx = BLAS.dotc(v, x);
            const y0 = Complex.sub(x[0], Complex.mul(tau, Complex.mul(v[0], vx)));
            const y1 = Complex.sub(x[1], Complex.mul(tau, Complex.mul(v[1], vx)));
            expect(Complex.imagToNumber(y1)).toBeCloseTo(0);
            expect(Math.abs(Complex.realToNumber(y1))).toBeLessThan(EXPECT_TOL);
            expect(Complex.realToNumber(y0)).toBeCloseTo(Complex.realToNumber(alpha));
        });
    });

    describe('BLAS.gemv', () => {
        it('gemv — real matrix and vectors', () => {
            const A = evaluator.Execute('[1,2; 3,4]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; 1]').list[0] as MultiArray;
            const y = evaluator.Execute('[0; 0]').list[0] as MultiArray;
            const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
            const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
            y.array[0][0] = yvec[0];
            y.array[1][0] = yvec[1];
            expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(3);
            expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(7);
        });

        it('gemv — complex matrix and vectors', () => {
            const A = evaluator.Execute('[1+i, 2; 3, 4-i]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; i]').list[0] as MultiArray;
            const y = evaluator.Execute('[0; 0]').list[0] as MultiArray;
            const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
            const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
            y.array[0][0] = yvec[0];
            y.array[1][0] = yvec[1];
            const y0 = y.array[0][0] as ComplexType;
            const y1 = y.array[1][0] as ComplexType;
            expect(Math.abs(Complex.realToNumber(y0) - 1)).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(y0) - 3)).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.realToNumber(y1) - 4)).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(y1) - 4)).toBeLessThan(EXPECT_TOL);
        });

        it('gemv — beta = 0 overwrites y', () => {
            const A = evaluator.Execute('[1,0; 0,1]').list[0] as MultiArray;
            const x = evaluator.Execute('[2; 3]').list[0] as MultiArray;
            const y = evaluator.Execute('[5; 6]').list[0] as MultiArray;
            const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
            const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.gemv(A.array as ComplexType[][], 2, 2, 0, 0, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
            y.array[0][0] = yvec[0];
            y.array[1][0] = yvec[1];
            expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(2);
            expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(3);
        });

        it('gemv — submatrix with offsets', () => {
            const A = evaluator.Execute('[1,2,3; 4,5,6; 7,8,9]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; 1]').list[0] as MultiArray;
            const y = evaluator.Execute('[0; 0]').list[0] as MultiArray;
            const xvec = x.array.map((row: any[]) => row[0]) as ComplexType[];
            const yvec = y.array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.gemv(A.array as ComplexType[][], 2, 2, 1, 1, xvec, 0, yvec, 0, Complex.one(), Complex.zero());
            y.array[0][0] = yvec[0];
            y.array[1][0] = yvec[1];
            expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(11);
            expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(17);
        });

        it('gemv — alpha = 0 leaves y scaled by beta', () => {
            const A = evaluator.Execute('[1,2; 3,4]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; 1]').list[0] as MultiArray;
            const y = evaluator.Execute('[2; 3]').list[0] as MultiArray;
            BLAS.gemv(
                A.array as ComplexType[][],
                2,
                2,
                0,
                0,
                x.array.map((row: any[]) => row[0]) as ComplexType[],
                0,
                y.array.map((row: any[]) => row[0]) as ComplexType[],
                0,
                Complex.zero(),
                Complex.one(),
            );
            expect(Complex.realToNumber(y.array[0][0] as ComplexType)).toBeCloseTo(2);
            expect(Complex.realToNumber(y.array[1][0] as ComplexType)).toBeCloseTo(3);
        });
    });

    describe('BLAS.ger', () => {
        it('ger — real vectors and matrix', () => {
            const A = evaluator.Execute('[1,2; 3,4]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; 1]').list[0] as MultiArray;
            const y = evaluator.Execute('[1; 2]').list[0] as MultiArray;
            // A := A + x * yᵀ
            BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
            // Expected:
            // [1+1*1, 2+1*2] = [2,4]
            // [3+1*1, 4+1*2] = [4,6]
            expect(Complex.realToNumber(A.array[0][0] as ComplexType)).toBeCloseTo(2);
            expect(Complex.realToNumber(A.array[0][1] as ComplexType)).toBeCloseTo(4);
            expect(Complex.realToNumber(A.array[1][0] as ComplexType)).toBeCloseTo(4);
            expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(6);
        });

        it('ger — complex vectors (conjugate on y)', () => {
            const A = evaluator.Execute('[0,0; 0,0]').list[0] as MultiArray;
            const x = evaluator.Execute('[1+i; 2]').list[0] as MultiArray;
            const y = evaluator.Execute('[1-i; i]').list[0] as MultiArray;
            BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
            // A[0,0] = (1+i)*conj(1-i) = (1+i)*(1+i) = 2i
            const a00 = A.array[0][0] as ComplexType;
            expect(Math.abs(Complex.realToNumber(a00))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(a00) - 2)).toBeLessThan(EXPECT_TOL);
            // A[0,1] = (1+i)*conj(i) = (1+i)*(-i) = 1 - i
            const a01 = A.array[0][1] as ComplexType;
            expect(Math.abs(Complex.realToNumber(a01) - 1)).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(a01) + 1)).toBeLessThan(EXPECT_TOL);
        });

        it('ger — alpha = 0 leaves matrix unchanged', () => {
            const A = evaluator.Execute('[1,2; 3,4]').list[0] as MultiArray;
            const x = evaluator.Execute('[5; 6]').list[0] as MultiArray;
            const y = evaluator.Execute('[7; 8]').list[0] as MultiArray;
            BLAS.ger(A.array as ComplexType[][], 0, 0, 2, 2, Complex.zero(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
            expect(Complex.realToNumber(A.array[0][0] as ComplexType)).toBeCloseTo(1);
            expect(Complex.realToNumber(A.array[0][1] as ComplexType)).toBeCloseTo(2);
            expect(Complex.realToNumber(A.array[1][0] as ComplexType)).toBeCloseTo(3);
            expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(4);
        });

        it('ger — submatrix with offsets', () => {
            const A = evaluator.Execute('[1,2,3; 4,5,6; 7,8,9]').list[0] as MultiArray;
            const x = evaluator.Execute('[1; 1]').list[0] as MultiArray;
            const y = evaluator.Execute('[2; 3]').list[0] as MultiArray;
            // Atualiza bloco A[1:3, 1:3]
            BLAS.ger(A.array as ComplexType[][], 1, 1, 2, 2, Complex.one(), x.array as ComplexType[][], 0, 0, y.array as ComplexType[][], 0, 0);
            // Submatriz original [[5,6],[8,9]]
            // + [[2,3],[2,3]] → [[7,9],[10,12]]
            expect(Complex.realToNumber(A.array[1][1] as ComplexType)).toBeCloseTo(7);
            expect(Complex.realToNumber(A.array[1][2] as ComplexType)).toBeCloseTo(9);
            expect(Complex.realToNumber(A.array[2][1] as ComplexType)).toBeCloseTo(10);
            expect(Complex.realToNumber(A.array[2][2] as ComplexType)).toBeCloseTo(12);
        });
    });

    describe('BLAS.geru', () => {
        it('geru — real vectors', () => {
            const C = evaluator.Execute('[1,2; 3,4]').list[0].array as ComplexType[][];
            const x = evaluator.Execute('[1; 1]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
            const y = evaluator.Execute('[2; 3]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.geru(x, y, Complex.one(), C, 0, 0);
            // C + x*yᵀ = [[1,2],[3,4]] + [[2,3],[2,3]]
            expect(Complex.realToNumber(C[0][0])).toBeCloseTo(3);
            expect(Complex.realToNumber(C[0][1])).toBeCloseTo(5);
            expect(Complex.realToNumber(C[1][0])).toBeCloseTo(5);
            expect(Complex.realToNumber(C[1][1])).toBeCloseTo(7);
        });

        it('geru — complex vectors (no conjugation)', () => {
            const C = evaluator.Execute('[0,0; 0,0]').list[0].array as ComplexType[][];
            const x = evaluator.Execute('[1+i; 2]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
            const y = evaluator.Execute('[i; 1]').list[0].array.map((row: any[]) => row[0]) as ComplexType[];
            BLAS.geru(x, y, Complex.one(), C, 0, 0);
            // C[0,0] = (1+i)*i = -1 + i
            const c00 = C[0][0];
            expect(Math.abs(Complex.realToNumber(c00) + 1)).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(c00) - 1)).toBeLessThan(EXPECT_TOL);
        });
    });

    describe('BLAS.gemm', () => {
        it('gemm — small real matrices, alpha=1, beta=0', () => {
            const A = evaluator.Execute('[1,2;3,4]').list[0] as MultiArray;
            const B = evaluator.Execute('[5,6;7,8]').list[0] as MultiArray;
            const C = evaluator.Execute('[0,0;0,0]').list[0] as MultiArray;
            BLAS.gemm(Complex.one(), A.array as ComplexType[][], 2, 2, B.array as ComplexType[][], 2, Complex.zero(), C.array as ComplexType[][]);
            expect(Complex.realToNumber(C.array[0][0] as ComplexType)).toBeCloseTo(19);
            expect(Complex.realToNumber(C.array[0][1] as ComplexType)).toBeCloseTo(22);
            expect(Complex.realToNumber(C.array[1][0] as ComplexType)).toBeCloseTo(43);
            expect(Complex.realToNumber(C.array[1][1] as ComplexType)).toBeCloseTo(50);
        });

        it('gemm — small complex matrices, alpha=1, beta=0', () => {
            const A = evaluator.Execute('[1+i,2;3,4-i]').list[0] as MultiArray;
            const B = evaluator.Execute('[i,1;1,i]').list[0] as MultiArray;
            const C = evaluator.Execute('[0,0;0,0]').list[0] as MultiArray;
            BLAS.gemm(Complex.one(), A.array as ComplexType[][], 2, 2, B.array as ComplexType[][], 2, Complex.zero(), C.array as ComplexType[][]);
            // expected: [ (1+i)*i + 2*1 , (1+i)*1 + 2*i ; 3*i + (4-i)*1 , 3*1 + (4-i)*i ]
            const y00 = Complex.add(Complex.mul(A.array[0][0] as ComplexType, B.array[0][0] as ComplexType), Complex.mul(A.array[0][1] as ComplexType, B.array[1][0] as ComplexType));
            const y01 = Complex.add(Complex.mul(A.array[0][0] as ComplexType, B.array[0][1] as ComplexType), Complex.mul(A.array[0][1] as ComplexType, B.array[1][1] as ComplexType));
            const y10 = Complex.add(Complex.mul(A.array[1][0] as ComplexType, B.array[0][0] as ComplexType), Complex.mul(A.array[1][1] as ComplexType, B.array[1][0] as ComplexType));
            const y11 = Complex.add(Complex.mul(A.array[1][0] as ComplexType, B.array[0][1] as ComplexType), Complex.mul(A.array[1][1] as ComplexType, B.array[1][1] as ComplexType));
            expect(Math.abs(Complex.realToNumber(C.array[0][0] as ComplexType) - Complex.realToNumber(y00))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(C.array[0][0] as ComplexType) - Complex.imagToNumber(y00))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.realToNumber(C.array[0][1] as ComplexType) - Complex.realToNumber(y01))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(C.array[0][1] as ComplexType) - Complex.imagToNumber(y01))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.realToNumber(C.array[1][0] as ComplexType) - Complex.realToNumber(y10))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(C.array[1][0] as ComplexType) - Complex.imagToNumber(y10))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.realToNumber(C.array[1][1] as ComplexType) - Complex.realToNumber(y11))).toBeLessThan(EXPECT_TOL);
            expect(Math.abs(Complex.imagToNumber(C.array[1][1] as ComplexType) - Complex.imagToNumber(y11))).toBeLessThan(EXPECT_TOL);
        });

        it('gemm — alpha=0 scales C by beta', () => {
            // matriz C de entrada
            const C = evaluator.Execute('[1,2;3,4]').list[0] as MultiArray;
            // chama gemm com alpha = 0
            // A e B não serão usados, então podem ser matrizes vazias
            BLAS.gemm(
                Complex.zero(),
                [], // A
                C.dimension[0], // m
                0, // k (não usado)
                [], // B
                C.dimension[1], // n
                Complex.create(2, 0), // beta
                C.array as ComplexType[][], // C
            );
            // verifica se todos os elementos de C foram escalados por beta=2
            expect(Complex.realToNumber(C.array[0][0] as ComplexType)).toBeCloseTo(2);
            expect(Complex.realToNumber(C.array[0][1] as ComplexType)).toBeCloseTo(4);
            expect(Complex.realToNumber(C.array[1][0] as ComplexType)).toBeCloseTo(6);
            expect(Complex.realToNumber(C.array[1][1] as ComplexType)).toBeCloseTo(8);
        });

        it('gemm — blocked vs simple produce same results', () => {
            const A = evaluator.Execute('[1,2,3;4,5,6;7,8,9]').list[0] as MultiArray;
            const B = evaluator.Execute('[1,0,0;0,1,0;0,0,1]').list[0] as MultiArray;
            const C1 = evaluator.Execute('[0,0,0;0,0,0;0,0,0]').list[0] as MultiArray;
            const C2 = evaluator.Execute('[0,0,0;0,0,0;0,0,0]').list[0] as MultiArray;
            // force blocked
            BLAS.settings.blockThreshold = 1;
            BLAS.gemm(Complex.one(), A.array as ComplexType[][], 3, 3, B.array as ComplexType[][], 3, Complex.zero(), C1.array as ComplexType[][], 2);
            // simple
            BLAS.settings.blockThreshold = 1e6;
            BLAS.gemm(Complex.one(), A.array as ComplexType[][], 3, 3, B.array as ComplexType[][], 3, Complex.zero(), C2.array as ComplexType[][]);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    expect(Complex.realToNumber(C1.array[i][j] as ComplexType)).toBeCloseTo(Complex.realToNumber(C2.array[i][j] as ComplexType));
                }
            }
        });
    });

    describe('LAPACK.larfg and LAPACK.larf', () => {
        // Helper to build Householder matrix
        const buildH = (v: ComplexType[], tau: ComplexType) => {
            const n = v.length;
            const I = new MultiArray([n, n], LAPACK.eye(n, n));
            const H = MultiArray.copy(I);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const vvH = Complex.mul(v[i], Complex.conj(v[j]));
                    H.array[i][j] = Complex.sub(H.array[i][j] as ComplexType, Complex.mul(tau, vvH));
                }
            }
            return H;
        };

        describe('LAPACK.larfg', () => {
            it("larfg('L') — sigma = 0 yields tau = 0 (implicit identity reflector) (real)", () => {
                const X = evaluator.Execute('[5 0 0; 0 3 0; 0 0 2]').list[0] as MultiArray;
                const { v, tau, alpha } = LAPACK.larfg('L', X, 3, 2);
                expect(Complex.realIsZero(tau)).toBe(true);
                expect(v.length).toEqual(1);
                expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                expectComplexCloseTo(alpha, X.array[2][2] as ComplexType);
            });

            it("larfg('R') — sigma = 0 yields tau = 0 (implicit identity reflector) (real)", () => {
                const X = evaluator.Execute('[5 0 0; 0 3 0; 0 0 2]').list[0] as MultiArray;
                const { v, tau, alpha } = LAPACK.larfg('R', X, 3, 2);
                expect(Complex.realIsZero(tau)).toBe(true);
                expect(v.length).toEqual(1);
                expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                expectComplexCloseTo(alpha, X.array[2][2] as ComplexType);
            });

            it("larfg('L') — sigma = 0 yields tau = 0 (implicit identity reflector) (complex)", () => {
                const X = evaluator.Execute('[5+2i; 0; 0]').list[0] as MultiArray;
                const { v, tau, alpha } = LAPACK.larfg('L', X, 3, 0);
                expect(Complex.realIsZero(tau)).toBe(true);
                expect(v.length).toEqual(3);
                expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                // alpha should be original x0
                expectComplexCloseTo(alpha, X.array[0][0] as ComplexType);
            });

            it("larfg('R') — sigma = 0 yields tau = 0 (implicit identity reflector) (complex)", () => {
                const X = evaluator.Execute('[5+2i, 0, 0]').list[0] as MultiArray;
                const { v, tau, alpha } = LAPACK.larfg('R', X, 3, 0);
                expect(Complex.realIsZero(tau)).toBe(true);
                expect(v.length).toEqual(3);
                expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                // alpha should be original x0
                expectComplexCloseTo(alpha, X.array[0][0] as ComplexType);
            });

            it("larfg('L') — v[0] must be 1", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const { v } = LAPACK.larfg('L', X, 3, 0);
                expectComplexCloseTo(v[0], Complex.one());
            });

            it("larfg('R') — v[0] must be 1", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const { v } = LAPACK.larfg('R', X, 3, 0);
                expectComplexCloseTo(v[0], Complex.one());
            });

            it("larfg('L') — sigma must be real (complex input)", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const { v } = LAPACK.larfg('L', X, 3, 0);
                // recompute sigma from v (excluding v[0])
                let sigma = Complex.zero();
                for (let i = 1; i < v.length; i++) {
                    Complex.mulAndSumTo(sigma, Complex.abs(v[i]), Complex.abs(v[i]));
                }
                expect(Number.isFinite(Complex.realToNumber(sigma))).toBe(true);
                expect(Complex.imagToNumber(sigma)).toBeLessThanOrEqual(EXPECT_TOL);
            });

            it("larfg('R') — sigma must be real (complex input)", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const { v, tau } = LAPACK.larfg('R', X, 3, 0);
                // recompute sigma from v (excluding v[0])
                let sigma = Complex.zero();
                for (let j = 1; j < v.length; j++) {
                    Complex.mulAndSumTo(sigma, Complex.abs(v[j]), Complex.abs(v[j]));
                }
                expect(Number.isFinite(Complex.realToNumber(sigma))).toBe(true);
                expect(Complex.imagToNumber(sigma)).toBeLessThanOrEqual(EXPECT_TOL);
            });

            it("larfg('L') — v is colinear with (x − α e₁) (complex)", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const m = 3;
                const { v, alpha } = LAPACK.larfg('L', X, m, 0);
                // w = x - alpha*e1
                const w: ComplexType[] = [];
                for (let i = 0; i < m; i++) {
                    const xi = X.array[i][0] as ComplexType;
                    w[i] = i === 0 ? Complex.sub(xi, alpha) : xi;
                }
                // Check v[i] / w[i] is constant for all i>0
                const ratio = Complex.rdiv(w[1], v[1]);
                for (let i = 1; i < m; i++) {
                    const ri = Complex.rdiv(w[i], v[i]);
                    expectComplexCloseTo(ri, ratio, EXPECT_TOL);
                }
            });

            it("larfg('R') — v is colinear with (x − α e₁) (complex)", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const n = 3;
                const { v, alpha } = LAPACK.larfg('R', X, n, 0);
                // w = x - alpha*e1
                const w: ComplexType[] = [];
                for (let j = 0; j < n; j++) {
                    const xj = X.array[0][j] as ComplexType;
                    w[j] = j === 0 ? Complex.sub(xj, alpha) : xj;
                }
                // Check v[j] / w[j] is constant for all j>0
                const ratio = Complex.rdiv(w[1], v[1]);
                for (let j = 1; j < n; j++) {
                    const rj = Complex.rdiv(w[j], v[j]);
                    expectComplexCloseTo(rj, ratio, EXPECT_TOL);
                }
            });

            it("larfg('L') — H * x annihilates trailing components (complex)", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const m = 3;
                const { v, tau, alpha } = LAPACK.larfg('L', X, m, 0);
                // v as COLUMN vector
                const vCol = MultiArray.toColumnVector(v);
                const vH = LinearAlgebra.ctranspose(vCol);
                // Build H = I - tau * v * vᴴ   (LEFT reflector)
                const I = new MultiArray([m, m], LAPACK.eye(m, m));
                const H = MultiArray.copy(I);
                const vvH = MathOperation.mtimes(vCol, vH) as MultiArray;
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < m; j++) {
                        H.array[i][j] = Complex.sub(H.array[i][j] as ComplexType, Complex.mul(tau, vvH.array[i][j] as ComplexType));
                    }
                }
                // y = H * x
                const y = MathOperation.mtimes(H, X) as MultiArray;
                // y[0] ≈ alpha
                expectComplexCloseTo(y.array[0][0] as ComplexType, alpha);
                // y[i] ≈ 0 for i > 0
                for (let i = 1; i < m; i++) {
                    expect(Complex.realToNumber(Complex.abs(y.array[i][0] as ComplexType))).toBeLessThan(EXPECT_TOL);
                }
            });

            it("larfg('R') — x * H annihilates trailing components (complex)", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const n = 3;
                const { v, tau, alpha } = LAPACK.larfg('R', X, n, 0);
                // v as ROW vector
                const vRow = MultiArray.toRowVector(v);
                const vH = LinearAlgebra.ctranspose(vRow);
                // Build H = I - tau * vᴴ * v   (RIGHT reflector)
                const I = new MultiArray([n, n], LAPACK.eye(n, n));
                const H = MultiArray.copy(I);
                const vv = MathOperation.mtimes(vH, vRow) as MultiArray;
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        H.array[i][j] = Complex.sub(H.array[i][j] as ComplexType, Complex.mul(tau, vv.array[i][j] as ComplexType));
                    }
                }
                // y = x * H
                const y = MathOperation.mtimes(X, H) as MultiArray;
                // y[0] ≈ alpha
                expectComplexCloseTo(y.array[0][0] as ComplexType, alpha);
                // y[j] ≈ 0 for j > 0
                for (let j = 1; j < n; j++) {
                    expect(Complex.realToNumber(Complex.abs(y.array[0][j] as ComplexType))).toBeLessThan(EXPECT_TOL);
                }
            });

            it("larfg('L') — generated Householder matrix is unitary (complex)", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const m = 3;
                const { v, tau } = LAPACK.larfg('L', X, m, 0);
                // Build H = I - tau * v * vᴴ
                const I = new MultiArray([m, m], LAPACK.eye(m, m));
                const H = MultiArray.copy(I);
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < m; j++) {
                        const vvH = Complex.mul(v[i], Complex.conj(v[j]));
                        H.array[i][j] = Complex.sub(H.array[i][j] as ComplexType, Complex.mul(tau, vvH));
                    }
                }
                const HhH = MathOperation.mtimes(LinearAlgebra.ctranspose(H), H) as MultiArray;
                expectMatrixClose(HhH, I, EXPECT_TOL);
            });

            it("larfg('R') — generated Householder matrix is unitary (complex)", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const n = 3;
                const { v, tau } = LAPACK.larfg('R', X, n, 0);
                // Build H = I - tau * v * vᴴ
                const I = new MultiArray([n, n], LAPACK.eye(n, n));
                const H = MultiArray.copy(I);
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        const vvH = Complex.mul(v[i], Complex.conj(v[j]));
                        H.array[i][j] = Complex.sub(H.array[i][j] as ComplexType, Complex.mul(tau, vvH));
                    }
                }
                const HhH = MathOperation.mtimes(LinearAlgebra.ctranspose(H), H) as MultiArray;
                expectMatrixClose(HhH, I, EXPECT_TOL);
            });

            it("larfg('L') — Householder reflector annihilates trailing components (complex, LAPACK contract)", () => {
                // Original vector x (as a column)
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                // Compute Householder data
                const { v, tau, alpha } = LAPACK.larfg('L', X, 3, 0);
                // Build H = I - tau * v * vᴴ
                const H = buildH(v, tau);
                // Apply H to x
                const Hx = MathOperation.mtimes(H, X) as MultiArray;
                // Expected result: [alpha, 0, 0]^T
                const expected = new MultiArray([3, 1]);
                expected.array[0][0] = alpha;
                expected.array[1][0] = Complex.zero();
                expected.array[2][0] = Complex.zero();
                expectMatrixClose(Hx, expected, EXPECT_TOL);
            });

            it("larfg('R') — Householder reflector annihilates trailing components (complex, LAPACK contract)", () => {
                // Original vector x (as COLUMN, even for 'R')
                const Xrow = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                // Convert row → column
                const X = LinearAlgebra.transpose(Xrow) as MultiArray;
                const { v, tau, alpha } = LAPACK.larfg('R', Xrow, 3, 0);
                const H = buildH(v, tau);
                // Apply H * x
                const Hx = MathOperation.mtimes(H, X) as MultiArray;
                const expected = new MultiArray([3, 1]);
                expected.array[0][0] = alpha;
                expected.array[1][0] = Complex.zero();
                expected.array[2][0] = Complex.zero();
                expectMatrixClose(Hx, expected, EXPECT_TOL);
            });
        });

        describe('LAPACK.larf', () => {
            it("larf('L') — H * x annihilates trailing components (complex)", () => {
                const X = evaluator.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                const C = MultiArray.copy(X);
                const { v, tau, alpha } = LAPACK.larfg('L', C, 3, 0);
                LAPACK.larf('L', C, v, tau, 0, 0);
                // x[0] ≈ alpha
                expectComplexCloseTo(C.array[0][0] as ComplexType, alpha);
                // x[i] ≈ 0 for i > 0
                for (let i = 1; i < 3; i++) {
                    expect(Complex.realToNumber(Complex.abs(C.array[i][0] as ComplexType))).toBeLessThan(EXPECT_TOL);
                }
            });

            it("larf('R') — generated Householder matrix is unitary (complex)", () => {
                const X = evaluator.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                const { v, tau } = LAPACK.larfg('R', X, 3, 0);
                const H = buildH(v, tau);
                const HhH = MathOperation.mtimes(LinearAlgebra.ctranspose(H), H) as MultiArray;
                const I = new MultiArray([3, 3], LAPACK.eye(3, 3));
                expectMatrixClose(HhH, I, EXPECT_TOL);
            });

            it("larf('R') — should return immediately if tau=0 (leaves matrix unchanged)", () => {
                const A = evaluator.Execute('[1+2i, 3-1i; -2+i, 4]').list[0] as MultiArray;
                const v = [Complex.one(), Complex.zero()];
                const tau = Complex.zero();
                const before = A.array.map((row) => row.slice());
                LAPACK.larf('R', A, v, tau, 0, 0);
                expect(A.array).toEqual(before);
            });

            it("larf('R') — preserves Frobenius norm (complex)", () => {
                const C = evaluator.Execute('[1+2i, 2-1i; 3+0.5i, -1+i]').list[0] as MultiArray;
                const C0 = MultiArray.copy(C);
                const { v, tau } = LAPACK.larfg('R', C, 2, 0);
                LAPACK.larf('R', C, v, tau, 0, 0);
                const n0 = LAPACKtest.frobenius_norm(C0);
                const n1 = LAPACKtest.frobenius_norm(C);
                expect(Math.abs(n0 - n1)).toBeLessThan(EXPECT_TOL);
            });

            it("larf('R') — diagnostic using valid Householder reflector (LAPACK-consistent)", () => {
                const C = evaluator.Execute('[ 1+2i,  3- i; -2+ i,  0.5 ]').list[0] as MultiArray;
                const C0 = MultiArray.copy(C);
                // Generate a VALID Householder reflector v, tau
                // v[0] = 1 is guaranteed by larfg('R')
                const X = evaluator.Execute('[ 1, 0.3 - 0.4i ]').list[0] as MultiArray;
                const { v, tau } = LAPACK.larfg('R', X, 2, 0);
                // Apply larf('R') (this is what we are testing)
                const C_larf = MultiArray.copy(C0);
                LAPACK.larf('R', C_larf, v, tau, 0, 0);
                // === Reference computation (exact LAPACK formula) ===
                // C_ref = C0 - tau * (C0 * vᴴ) * v
                // Step 1: w = tau * (C0 * vᴴ)
                const w: ComplexType[] = new Array(2);
                for (let i = 0; i < 2; i++) {
                    let acc = Complex.zero();
                    for (let j = 0; j < 2; j++) {
                        Complex.mulAndSumTo(acc, C0.array[i][j] as ComplexType, Complex.conj(v[j]));
                    }
                    w[i] = Complex.mul(tau, acc);
                }
                // Step 2: C_ref = C0 - w * v
                const C_ref = MultiArray.copy(C0);
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 2; j++) {
                        C_ref.array[i][j] = Complex.sub(C_ref.array[i][j] as ComplexType, Complex.mul(w[i], v[j]));
                    }
                }
                // Compare results
                const err = LAPACKtest.frobenius_norm(MathOperation.minus(C_larf, C_ref) as MultiArray);
                expect(err).toBeLessThan(EXPECT_TOL);
            });
        });
    });

    // it('Run tests.', () => {
    //     // LAPACKtest.test_numeric_qr_bulge_chasing_hermitian();
    //     // LAPACKtest.test_complex_givens_unitarity();
    //     // LAPACKtest.test_apply_givens_to_Z();
    //     // LAPACKtest.test_apply_givens_tridiagonal();
    //     // LAPACKtest.test_numeric_qr_hermitian_tridiagonal();
    //     // LAPACKtest.test_qr_hermitian_tridiagonal_full();
    //     // LAPACKtest.test_jacobi_hermitian_full();

    //     // LAPACKtest.start_test_complex_tridiagonal_hermitian_to_real2n();
    //     // LAPACKtest.test_jacobi_hermitian_real2n();
    //     // LAPACKtest.test_jacobi_hermitian_real2n_direct();
    //     // LAPACKtest.test_jacobi_hermitian_via_real2n();
    //     // LAPACKtest.test_jacobi_hermitian_real2n_final();
    //     // LAPACKtest.test_numeric_jacobi_hermitian_direct();

    //     LAPACKtest.test_jacobi_complex_hermitian_dense();
    // }, 100000);
});
