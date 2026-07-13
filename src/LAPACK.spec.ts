/// <reference types="jest" />
import path from 'node:path';
import { describe, it, expect } from '@jest/globals';
import { Complex, ComplexType, toNumber } from './Complex';
import { MathOperation } from './MathOperation';
import { BLAS } from './BLAS';
import { LAPACK } from './LAPACK';
import { type TestOptions, LAPACKtest, EXPECT_TOL, DEFAULT_EIG_TOL } from './LAPACKtest';
import { Interpreter } from './Interpreter';
import { MultiArray } from './MultiArray';
import { LinearAlgebra } from './LinearAlgebra';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

/**
 * Interpreter instance.
 */
let interpreter: Interpreter;

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
        LAPACKtest.print_matrix(A, Aid, interpreter);
        LAPACKtest.print_matrix(V, Vid, interpreter);
        LAPACKtest.print_matrix(D, Did, interpreter);
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
    interpreter.Execute('clear');
    interpreter.Execute(`${options.Aid} = ${A}`);
    interpreter.Execute(`[V,D] = eig(${options.Aid})`);
    const Am = interpreter.Execute(options.Aid!).list[0];
    const Vm = interpreter.Execute('V').list[0];
    const Dm = interpreter.Execute('D').list[0];
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
    const { tol, maxIter, print, frobenius } = options;
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
    interpreter.Execute('clear');
    interpreter.Execute(`${Aid} = ${A}`);
    const S = interpreter.Execute(Aid!).list[0];
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

function normalizedResidual(A: MultiArray, X: MultiArray, B: MultiArray): number {
    const AX = MathOperation.mtimes(A, X) as MultiArray;
    const R = MathOperation.minus(AX, B) as MultiArray;
    const num = LAPACKtest.frobenius_norm(R);
    const normA = LAPACKtest.frobenius_norm(A);
    const normX = LAPACKtest.frobenius_norm(X);
    if (normA === 0 || normX === 0) {
        return num; // Safe fallback; tests do not normally exercise this path.
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

/**
 * LAPACK test suite.
 */
describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it(`${unitName}, BLAS and LAPACKtest should be defined.`, () => {
            expect(BLAS).toBeDefined();
            expect(BLAS.functions).toBeDefined();
            expect(LAPACK).toBeDefined();
            expect(LAPACK.functions).toBeDefined();
            expect(LAPACKtest).toBeDefined();
        });

        it('Interpreter should be instatiated and should parse, evaluate and unparse a simple real expression (interpreter test).', () => {
            expect(interpreter).toBeInstanceOf(Interpreter);
            const tree = interpreter.Parse('1+2*3');
            const value = interpreter.Evaluate(tree);
            const unparsed = interpreter.Unparse(tree);
            expect(Complex.realToNumber(value.list[0])).toBe(7);
            expect(unparsed === '1+2*3\n').toBe(true);
        });

        describe('Hermitian property checks', () => {
            it('Hermitian property test (complex matrix).', () => {
                interpreter.Execute('clear');
                interpreter.Execute(`H = ${matrixSample['complex_hermitian_2x2_01']}`);
                const H = interpreter.Execute('H').list[0];
                LAPACKtest.print_matrix(H, 'H', interpreter);
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
                interpreter.Execute('clear');
                interpreter.Execute(`A = ${matrixSample['real_symmetric_simple_diagonalizable_2x2_01']}`);
                interpreter.Execute('[V,D] = eig(A)');
                const A = interpreter.Execute('A').list[0];
                const V = interpreter.Execute('V').list[0];
                const D = interpreter.Execute('D').list[0];
                LAPACKtest.print_matrix(A, 'A', interpreter);
                LAPACKtest.print_matrix(V, 'V', interpreter);
                LAPACKtest.print_matrix(D, 'D', interpreter);
                const options: TestOptions = { frobenius: true };
                // Unitarity test
                let result = LAPACKtest.testUnitarity(V, options);
                expect(result.norm).toBeLessThanOrEqual(EXPECT_TOL);
                expect(result.maxErr).toBeLessThanOrEqual(EXPECT_TOL);
                // Test real eigenvalues
                result = LAPACKtest.testRealEigenvalues(D);
                expect(result.maxErr).toBeLessThanOrEqual(EXPECT_TOL);
                // Residual test
                const diff = interpreter.Execute('A*V-V*D').list[0];
                const norm = LAPACKtest.frobenius_norm(diff);
                console.log(`|| A·V − V·D ||_F = ${norm.toExponential(6)}`);
                // Norm of residual
                expect(norm).toBeLessThanOrEqual(EXPECT_TOL);
            });

            it('Jacobi eigensolver — consistency with eig.', () => {
                interpreter.Execute('clear');
                interpreter.Execute(`A = rand(5);
                    A = (A + A') / 2;`);
                interpreter.Execute('[V0,D0] = eig(A)');
                const A = interpreter.Execute('A').list[0];
                const D0 = interpreter.Execute('D0').list[0];
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
                interpreter.Execute('clear');
                interpreter.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
                const A = interpreter.Execute('A').list[0];
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
                interpreter.Execute('clear');
                interpreter.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0];
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
                interpreter.Execute('clear');
                interpreter.Execute(`A = ${matrixSample['complex_tridiagonal_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0];
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
                interpreter.Execute('clear');
                /* Hermitian tridiagonal matrix (already tridiagonal!) */
                interpreter.Execute(`T = ${matrixSample['complex_tridiagonal_3x3_01']}`);
                const T0 = interpreter.Execute('T').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* General Hermitian matrix */
                interpreter.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
                interpreter.Execute(`A = ${matrixSample['real_symmetric_rational_4x4_01']}`); // TODO: remove when test pass.
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                /* EIG (Hermitian) */
                const { V, D } = LAPACK.eig_hermitian(A0, true);
                console.log('D =', MultiArray.unparse(D, interpreter));
                console.log('V =', MultiArray.unparse(V!, interpreter));
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
                interpreter.Execute('clear');
                /* Test matrix (general complex matrix) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Test matrix (general complex matrix) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Hermitian-like but not triangular; pivoting will occur */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_02']}`);
                interpreter.Execute(`B = ${matrixSample['complex_general_3x2_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                const B0 = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Coefficient matrix A (general complex matrix) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                /* Right-hand side B */
                interpreter.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
                const B = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Coefficient matrix A (general complex matrix) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                /* Right-hand side B */
                interpreter.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
                const B0 = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Coefficient matrix A (general complex matrix) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                /* Right-hand side B */
                interpreter.Execute(`B = ${matrixSample['complex_rhs_3x1_01']}`);
                const B0 = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Coefficient matrix A */
                interpreter.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
                /* RHS matrix B (4 x 2) */
                interpreter.Execute(`B = ${matrixSample['complex_general_4x2_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                const B0 = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Coefficient matrix A */
                interpreter.Execute(`A = ${matrixSample['complex_hermitian_4x4_01']}`);
                /* Multiple RHS matrix B (4 x 2) */
                interpreter.Execute(`B = ${matrixSample['complex_general_4x2_01']}`);
                const A0 = interpreter.Execute('A').list[0] as MultiArray;
                const B0 = interpreter.Execute('B').list[0] as MultiArray;
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
                const A = interpreter.Execute(`[ 1,  2,  3;
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
                const A = interpreter.Execute(`
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
                const A = interpreter.Execute(`
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
                const A = interpreter.Execute(`
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
                const A = interpreter.Execute(`[ 1,  2,  3;
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
                const A = interpreter.Execute(`[ 1+2i,  2,      3;
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
                const A = interpreter.Execute(`[ 1,  2,  3;
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
                const A = interpreter.Execute(`[ 1+2i,  2,      3;
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
                const A = interpreter.Execute(`[ 1,  2,  3;
                                               4,  5,  6;
                                               7,  8, 10 ]`).list[0] as MultiArray;

                const A0 = MultiArray.copy(A);

                const { L, taus } = LAPACK.gelq2(A);

                // console.log('L (raw, after gelq2):');
                // console.log(MultiArray.unparse(L, interpreter));

                const Q = LAPACK.orglq(L, taus);

                // console.log('Q (from orglq):');
                // console.log(MultiArray.unparse(Q, interpreter));

                const Lmat = MultiArray.copy(L);
                LAPACK.tril_inplace(Lmat);

                // console.log('L (after tril_inplace):');
                // console.log(MultiArray.unparse(Lmat, interpreter));

                const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;

                // console.log('L*Q:');
                // console.log(MultiArray.unparse(LQ, interpreter));

                // console.log('A original:');
                // console.log(MultiArray.unparse(A0, interpreter));

                // console.log('L*Q - A:');
                // console.log(MultiArray.unparse(MathOperation.minus(LQ, A0) as MultiArray, interpreter));

                expectMatrixClose(LQ, A0, EXPECT_TOL);
            });

            it('orglq — reconstructs Q correctly (complex matrix)', () => {
                const A = interpreter.Execute(`
    [ 1+2i,  2,      3;
      4,      5- i,  6;
      7,      8,   10+3i ]
            `).list[0] as MultiArray;

                const A0 = MultiArray.copy(A);

                const { L, taus } = LAPACK.gelq2(A);

                console.log('L (raw, after gelq2):');
                console.log(MultiArray.unparse(L, interpreter));

                const Q = LAPACK.orglq(L, taus);

                console.log('Q (from orglq):');
                console.log(MultiArray.unparse(Q, interpreter));

                const Lmat = MultiArray.copy(L);
                LAPACK.tril_inplace(Lmat);

                console.log('L (after tril_inplace):');
                console.log(MultiArray.unparse(Lmat, interpreter));

                const LQ = MathOperation.mtimes(Lmat, Q) as MultiArray;

                console.log('L*Q:');
                console.log(MultiArray.unparse(LQ, interpreter));

                console.log('A original:');
                console.log(MultiArray.unparse(A0, interpreter));

                console.log('L*Q - A:');
                console.log(MultiArray.unparse(MathOperation.minus(LQ, A0) as MultiArray, interpreter));

                expectMatrixClose(LQ, A0, EXPECT_TOL);
            });

            it('orglq — Q is unitary', () => {
                const A = interpreter.Execute(`
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
                const A = interpreter.Execute(`
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
                interpreter.Execute('clear');
                /* General complex matrix A (m > n) */
                interpreter.Execute(`A = [ 1+2i,  2-1i;
                  3+0i, -1+4i;
                  0+1i,  2+0i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* General complex matrix A (m > n) */
                interpreter.Execute(`A = [ 2+0i,  1-1i;
                                              1+2i,  3+0i;
                                              0+1i, -1+1i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* General complex matrix A (m > n, rank-revealing scenario) */
                interpreter.Execute(`A = [ 1+0i,  2+1i,  0+0i;
                                              0+1i,  1+0i,  1+1i;
                                              1+0i,  0+0i,  2+0i;
                                              0+0i,  1-1i,  1+0i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                /* QR with column pivoting */
                const { R: Rraw, taus, jpvt } = LAPACK.geqp3(A);
                /* Explicit Q from reflectors */
                const Q = LAPACK.orgqr(Rraw, taus);
                /* Extract upper trapezoidal R */
                const R = MultiArray.copy(Rraw) as MultiArray;
                LAPACK.triu_inplace(R);
                /* Build permutation matrix P from jpvt */
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
                interpreter.Execute('clear');
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
                const expected = interpreter.Execute(`[ 0, 1, 0;
                               0, 0, 1;
                               1, 0, 0 ]`).list[0] as MultiArray;
                /* Compare P with expected */
                const res = normalizedResidual(LinearAlgebra.eye(Complex.create(P.dimension[0])) as MultiArray, P, expected);
                expect(res).toBeLessThan(EXPECT_TOL);
            });

            it('lapmt_apply — applies column permutation in-place', () => {
                interpreter.Execute('clear');
                /* Define a 3x4 test matrix A */
                interpreter.Execute(`A = [ 1+1i, 2+0i, 3-1i, 4+2i;
                  5+0i, 6+1i, 7+0i, 8-1i;
                  9-1i,10+0i,11+1i,12+0i ]`);
                /* Pivot vector: swap columns 0 and 2, 1 and 3 */
                const jpvt = [2, 3, 0, 1];
                /* Extract MultiArray */
                const A = interpreter.Execute('A').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                /* Define a 4x3 complex test matrix A */
                interpreter.Execute(`A = [ 1+0i, 2+1i, 3-1i;
                  4+1i, 5+0i, 6+2i;
                  7-1i, 8+0i, 9+1i;
                  0+1i, 1-1i, 2+0i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                /* Step 1: compute QR factorization with pivoting */
                const { R: Rraw, taus, jpvt } = LAPACK.geqp3(A);
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
                const res = normalizedResidual(Q, Rperm, A);
                expect(res).toBeLessThan(EXPECT_TOL);
                /* Step 6: check unitarity of Q: Qᴴ Q ≈ I */
                const Qh = LinearAlgebra.ctranspose(Q);
                const I = LinearAlgebra.eye(Complex.create(Q.dimension[1])) as MultiArray;
                const resQ = normalizedResidual(Qh, Q, I);
                expect(resQ).toBeLessThan(EXPECT_TOL);
            });

            it('geqp3 + lapmt_apply — end-to-end QR with column pivoting (complex, MATLAB-style)', () => {
                interpreter.Execute('clear');
                /* General complex matrix A (m > n) */
                interpreter.Execute(`A = [ 1+2i,  2-1i, 0+1i;
                                               3+0i, -1+4i, 1-1i;
                                               0+1i,  2+0i, 3+0i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                /* QR factorization with column pivoting */
                const { R: Rraw, taus, jpvt } = LAPACK.geqp3(A);
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
                interpreter.Execute('clear');
                /* General complex matrix A (3x3) */
                interpreter.Execute(`A = [ 1+2i,  2-1i, 0+1i;
                                               3+0i, -1+4i, 1-1i;
                                               0+1i,  2+0i, 3+0i ]`);
                /* Multiple RHS B (nrhs = 2) */
                interpreter.Execute(`B = [ 1+0i, 2-1i;
                                               0+1i, 1+0i;
                                               3+0i, -1+1i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
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
                interpreter.Execute('clear');
                interpreter.Execute('A = [4, 1; 1, 3]');
                interpreter.Execute('B = [1; 2]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('posv');
                // Expected solution: [1/11; 7/11]
                expectMatrixClose(X.array as ComplexType[][], [[Complex.create(1 / 11, 0)], [Complex.create(7 / 11, 0)]]);
            });

            it('mldivide — Hermitian indefinite matrix uses sysv', () => {
                interpreter.Execute('clear');
                interpreter.Execute('A = [0, 1; 1, 0]');
                interpreter.Execute('B = [1; 2]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('sysv');
                // Expected solution: [2; 1]
                expectMatrixClose(X.array as ComplexType[][], [[Complex.create(2, 0)], [Complex.create(1, 0)]]);
            });

            it('mldivide — general matrix uses gesv', () => {
                interpreter.Execute('clear');
                interpreter.Execute('A = [1, 2; 3, 4]');
                interpreter.Execute('B = [5; 11]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('gesv');
                // Expected solution: [1; 2]
                expectMatrixClose(X.array as ComplexType[][], [[Complex.create(1, 0)], [Complex.create(2, 0)]]);
            });

            it('mldivide — complex Hermitian positive definite matrix uses posv', () => {
                interpreter.Execute('clear');
                interpreter.Execute('A = [ 4, 1+i; 1-i, 3 ]');
                interpreter.Execute('B = [ 1+i; 2 ]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('posv');
                const res = normalizedResidual(A, X, B);
                expect(res).toBeLessThan(EXPECT_TOL);
            });

            it('mldivide — complex Hermitian indefinite matrix uses sysv', () => {
                interpreter.Execute('clear');
                interpreter.Execute('A = [ 0, 1+i; 1-i, 0 ]');
                interpreter.Execute('B = [ 1; i ]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('sysv');
                const res = normalizedResidual(A, X, B);
                expect(res).toBeLessThan(EXPECT_TOL);
            });

            it('mldivide — general complex matrix uses gesv', () => {
                interpreter.Execute('clear');
                interpreter.Execute('A = [ 1+i, 2; 3, 4-i ]');
                interpreter.Execute('B = [ 5; 6+i ]');
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                const { X, solver, info } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('gesv');
                const res = normalizedResidual(A, X, B);
                expect(res).toBeLessThan(EXPECT_TOL);
            });

            it('mldivide — solves A \\ B with multiple right-hand sides (nrhs > 1)', () => {
                interpreter.Execute('clear');
                /* General complex matrix A (3x3) */
                interpreter.Execute(`A = ${matrixSample['complex_general_3x3_03']}`);
                /* Multiple RHS (nrhs = 2) */
                interpreter.Execute(`B = ${matrixSample['complex_general_3x2_02']}`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                /* Solve A X = B */
                const { X, info, solver } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(['gesv', 'posv', 'sysv']).toContain(solver);
                /* Normalized LAPACK-style residual */
                const res = normalizedResidual(A, X, B);
                expect(res).toBeLessThan(EXPECT_TOL);
            });

            it('mldivide — Hermitian positive definite matrix with multiple RHS (nrhs > 1, posv)', () => {
                interpreter.Execute('clear');
                /* Hermitian positive definite matrix A (3x3). Constructed to be strictly HPD */
                interpreter.Execute(`A = [  4+0i,  1-1i,  0+0i;
                   1+1i,  5+0i,  1-1i;
                   0+0i,  1+1i,  3+0i ]`);
                /* Multiple RHS (nrhs = 2) */
                interpreter.Execute(`B = [  1+0i,  2+0i;
                   0+1i,  1-1i;
                   3+0i, -1+0i ]`);
                const A = interpreter.Execute('A').list[0] as MultiArray;
                const B = interpreter.Execute('B').list[0] as MultiArray;
                /* Solve A X = B */
                const { X, info, solver } = LAPACK.mldivide(A, B);
                expect(info).toBe(0);
                expect(solver).toBe('posv');
                /* LAPACK-style normalized residual */
                const res = normalizedResidual(A, X, B);
                expect(res).toBeLessThan(EXPECT_TOL);
            });
        });

        describe('LAPACK.potrf — Cholesky factorization', () => {
            it('potrf — lower 3x3 real positive-definite', () => {
                const A = interpreter.Execute('[4,1,1; 1,3,0; 1,0,2]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                // Check reconstruction: L*L^T = A
                const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — upper 3x3 real positive-definite', () => {
                const A = interpreter.Execute('[4,1,1; 1,3,0; 1,0,2]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                // Check reconstruction: U^T*U = A
                const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — lower 3x3 complex Hermitian positive-definite', () => {
                const A = interpreter.Execute('[4,1+i,1-i; 1-i,5,2+i; 1+i,2-i,6]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                // Check reconstruction: L*L^H = A
                const AH = LinearAlgebra.ctranspose(L) as MultiArray;
                const Arec = MathOperation.mtimes(L, AH) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — upper 3x3 complex Hermitian positive-definite', () => {
                const A = interpreter.Execute('[4,1+i,1-i; 1-i,5,2+i; 1+i,2-i,6]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                // Check reconstruction: U^H*U = A
                const UH = LinearAlgebra.ctranspose(U) as MultiArray;
                const Arec = MathOperation.mtimes(UH, U) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — lower 2x2 real positive-definite', () => {
                const A = interpreter.Execute('[2,1; 1,2]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — upper 2x2 real positive-definite', () => {
                const A = interpreter.Execute('[2,1; 1,2]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — fails on non-positive-definite matrix', () => {
                const A = interpreter.Execute('[1,2;2,1]').list[0] as MultiArray;
                expect(() => LAPACK.potrf(A, { uplo: 'lower' })).toThrow();
            });
        });

        describe('LAPACK.potrf — extended Cholesky tests', () => {
            it('potrf — lower 4x4 real positive-definite', () => {
                const A = interpreter.Execute('[6,2,1,1;2,5,2,1;1,2,5,2;1,1,2,4]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — upper 4x4 real positive-definite', () => {
                const A = interpreter.Execute('[6,2,1,1;2,5,2,1;1,2,5,2;1,1,2,4]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — lower 4x4 complex Hermitian positive-definite', () => {
                const A = interpreter.Execute('[6,1+i,2-i,1;1-i,5,1+i,1-i;2+i,1-i,7,1+i;1,1+i,1-i,5]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                const AH = LinearAlgebra.ctranspose(L) as MultiArray;
                const Arec = MathOperation.mtimes(L, AH) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — upper 4x4 complex Hermitian positive-definite', () => {
                const A = interpreter.Execute('[6,1+i,2-i,1;1-i,5,1+i,1-i;2+i,1-i,7,1+i;1,1+i,1-i,5]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                const UH = LinearAlgebra.ctranspose(U) as MultiArray;
                const Arec = MathOperation.mtimes(UH, U) as MultiArray;
                expectMatrixClose(Arec, A);
            });

            it('potrf — lower 5x5 almost-diagonal positive-definite', () => {
                const A = interpreter.Execute('[10,1e-8,0,0,0;1e-8,8,1e-8,0,0;0,1e-8,6,1e-8,0;0,0,1e-8,4,1e-8;0,0,0,1e-8,2]').list[0] as MultiArray;
                const L = LAPACK.potrf(A, { uplo: 'lower' });
                const Arec = MathOperation.mtimes(L, MathOperation.transpose(L) as MultiArray) as MultiArray;
                expectMatrixClose(Arec, A, EXPECT_TOL); // tolerância maior para números pequenos
            });

            it('potrf — upper 5x5 almost-diagonal positive-definite', () => {
                const A = interpreter.Execute('[10,1e-8,0,0,0;1e-8,8,1e-8,0,0;0,1e-8,6,1e-8,0;0,0,1e-8,4,1e-8;0,0,0,1e-8,2]').list[0] as MultiArray;
                const U = LAPACK.potrf(A, { uplo: 'upper' });
                const Arec = MathOperation.mtimes(MathOperation.transpose(U) as MultiArray, U) as MultiArray;
                expectMatrixClose(Arec, A, EXPECT_TOL);
            });

            it('potrf — fails on 4x4 symmetric but non-positive-definite', () => {
                const A = interpreter.Execute('[1,2,3,4;2,0,1,1;3,1,0,2;4,1,2,0]').list[0] as MultiArray;
                expect(() => LAPACK.potrf(A, { uplo: 'lower' })).toThrow();
            });

            it('potrf — fails on 5x5 complex Hermitian not positive-definite', () => {
                const A = interpreter.Execute('[0,1+i,0,0,0;1-i,0,1,0,0;0,1,0,1-i,0;0,0,1+i,0,1;0,0,0,1,0]').list[0] as MultiArray;
                expect(() => LAPACK.potrf(A, { uplo: 'upper' })).toThrow();
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
                    const X = interpreter.Execute('[5 0 0; 0 3 0; 0 0 2]').list[0] as MultiArray;
                    const { v, tau, alpha } = LAPACK.larfg('L', X, 3, 2);
                    expect(Complex.realIsZero(tau)).toBe(true);
                    expect(v.length).toEqual(1);
                    expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                    expectComplexCloseTo(alpha, X.array[2][2] as ComplexType);
                });

                it("larfg('R') — sigma = 0 yields tau = 0 (implicit identity reflector) (real)", () => {
                    const X = interpreter.Execute('[5 0 0; 0 3 0; 0 0 2]').list[0] as MultiArray;
                    const { v, tau, alpha } = LAPACK.larfg('R', X, 3, 2);
                    expect(Complex.realIsZero(tau)).toBe(true);
                    expect(v.length).toEqual(1);
                    expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                    expectComplexCloseTo(alpha, X.array[2][2] as ComplexType);
                });

                it("larfg('L') — sigma = 0 yields tau = 0 (implicit identity reflector) (complex)", () => {
                    const X = interpreter.Execute('[5+2i; 0; 0]').list[0] as MultiArray;
                    const { v, tau, alpha } = LAPACK.larfg('L', X, 3, 0);
                    expect(Complex.realIsZero(tau)).toBe(true);
                    expect(v.length).toEqual(3);
                    expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                    // alpha should be original x0
                    expectComplexCloseTo(alpha, X.array[0][0] as ComplexType);
                });

                it("larfg('R') — sigma = 0 yields tau = 0 (implicit identity reflector) (complex)", () => {
                    const X = interpreter.Execute('[5+2i, 0, 0]').list[0] as MultiArray;
                    const { v, tau, alpha } = LAPACK.larfg('R', X, 3, 0);
                    expect(Complex.realIsZero(tau)).toBe(true);
                    expect(v.length).toEqual(3);
                    expect(Complex.toBoolean(Complex.eq(v[0], Complex.one()))).toBe(true);
                    // alpha should be original x0
                    expectComplexCloseTo(alpha, X.array[0][0] as ComplexType);
                });

                it("larfg('L') — v[0] must be 1", () => {
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
                    const { v } = LAPACK.larfg('L', X, 3, 0);
                    expectComplexCloseTo(v[0], Complex.one());
                });

                it("larfg('R') — v[0] must be 1", () => {
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                    const { v } = LAPACK.larfg('R', X, 3, 0);
                    expectComplexCloseTo(v[0], Complex.one());
                });

                it("larfg('L') — sigma must be real (complex input)", () => {
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                    const { v } = LAPACK.larfg('R', X, 3, 0);
                    // recompute sigma from v (excluding v[0])
                    let sigma = Complex.zero();
                    for (let j = 1; j < v.length; j++) {
                        Complex.mulAndSumTo(sigma, Complex.abs(v[j]), Complex.abs(v[j]));
                    }
                    expect(Number.isFinite(Complex.realToNumber(sigma))).toBe(true);
                    expect(Complex.imagToNumber(sigma)).toBeLessThanOrEqual(EXPECT_TOL);
                });

                it("larfg('L') — v is colinear with (x − α e₁) (complex)", () => {
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const Xrow = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i; 2-1i; -0.5+0.3i]').list[0] as MultiArray;
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
                    const X = interpreter.Execute('[1+1i, 2-1i, -0.5+0.3i]').list[0] as MultiArray;
                    const { v, tau } = LAPACK.larfg('R', X, 3, 0);
                    const H = buildH(v, tau);
                    const HhH = MathOperation.mtimes(LinearAlgebra.ctranspose(H), H) as MultiArray;
                    const I = new MultiArray([3, 3], LAPACK.eye(3, 3));
                    expectMatrixClose(HhH, I, EXPECT_TOL);
                });

                it("larf('R') — should return immediately if tau=0 (leaves matrix unchanged)", () => {
                    const A = interpreter.Execute('[1+2i, 3-1i; -2+i, 4]').list[0] as MultiArray;
                    const v = [Complex.one(), Complex.zero()];
                    const tau = Complex.zero();
                    const before = A.array.map((row) => row.slice());
                    LAPACK.larf('R', A, v, tau, 0, 0);
                    expect(A.array).toEqual(before);
                });

                it("larf('R') — preserves Frobenius norm (complex)", () => {
                    const C = interpreter.Execute('[1+2i, 2-1i; 3+0.5i, -1+i]').list[0] as MultiArray;
                    const C0 = MultiArray.copy(C);
                    const { v, tau } = LAPACK.larfg('R', C, 2, 0);
                    LAPACK.larf('R', C, v, tau, 0, 0);
                    const n0 = LAPACKtest.frobenius_norm(C0);
                    const n1 = LAPACKtest.frobenius_norm(C);
                    expect(Math.abs(n0 - n1)).toBeLessThan(EXPECT_TOL);
                });

                it("larf('R') — diagnostic using valid Householder reflector (LAPACK-consistent)", () => {
                    const C = interpreter.Execute('[ 1+2i,  3- i; -2+ i,  0.5 ]').list[0] as MultiArray;
                    const C0 = MultiArray.copy(C);
                    // Generate a VALID Householder reflector v, tau
                    // v[0] = 1 is guaranteed by larfg('R')
                    const X = interpreter.Execute('[ 1, 0.3 - 0.4i ]').list[0] as MultiArray;
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
    });
});
