import { Complex, ComplexType, NumLikeType, toNumber } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';
import { MathOperation } from './MathOperation';
import { LinearAlgebra } from './LinearAlgebra';
import { Evaluator } from './Evaluator';
import { LAPACK } from './LAPACK';
import { LAPACKunused } from './LAPACKunused';

const EXPECT_TOL = 1e-14;
const MAX_ITERACTION = 1e3;
const DEFAULT_EIG_TOL = EXPECT_TOL;

interface TestOptions {
    maxIter?: number;
    tol?: number;
    real?: boolean;
    frobenius?: boolean;
    print?: boolean;
    Aid?: string;
    Bid?: string;
    Cid?: string;
    Did?: string;
    Eid?: string;
    Fid?: string;
    Gid?: string;
    Hid?: string;
    Iid?: string;
    Jid?: string;
    Kid?: string;
    Lid?: string;
    Mid?: string;
    Nid?: string;
    Oid?: string;
    Pid?: string;
    Qid?: string;
    Rid?: string;
    Sid?: string;
    Tid?: string;
    Uid?: string;
    Vid?: string;
    Wid?: string;
    Xid?: string;
    Yid?: string;
    Zid?: string;
}

interface TestResult {
    dim?: number[];
    norm?: number;
    maxErr?: number;
    expression?: string;
}

const defaulTestOptions: TestOptions = {
    maxIter: MAX_ITERACTION,
    tol: EXPECT_TOL,
    real: false,
    frobenius: true,
    print: true,
    Aid: 'A',
    Bid: 'B',
    Cid: 'C',
    Did: 'D',
    Eid: 'E',
    Fid: 'F',
    Gid: 'G',
    Hid: 'H',
    Iid: 'I',
    Jid: 'J',
    Kid: 'K',
    Lid: 'L',
    Mid: 'M',
    Nid: 'N',
    Oid: 'O',
    Pid: 'P',
    Qid: 'Q',
    Rid: 'R',
    Sid: 'S',
    Tid: 'T',
    Uid: 'U',
    Vid: 'V',
    Wid: 'W',
    Xid: 'X',
    Yid: 'Y',
    Zid: 'Z',
};

abstract class LAPACKtest {
    public static readonly setTestOptions = (options?: TestOptions): TestOptions => {
        const result: TestOptions = {};
        Object.assign(result, defaulTestOptions);
        Object.assign(result, options);
        return result;
    };

    public static readonly rand = (): number => Math.random() - 0.5;

    public static readonly randomReal = (): ComplexType => Complex.create(LAPACKtest.rand());

    public static readonly randomComplex = (): ComplexType => Complex.create(LAPACKtest.rand(), LAPACKtest.rand());

    public static readonly randomHermitian = (n: number, real = true): ComplexType[][] => {
        const A: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }));
        for (let i = 0; i < n; i++) {
            // diagonal real
            A[i][i] = LAPACKtest.randomReal();
            for (let j = i + 1; j < n; j++) {
                const z = real ? LAPACKtest.randomReal() : LAPACKtest.randomComplex();
                A[i][j] = z;
                A[j][i] = real ? z : Complex.conj(z);
            }
        }
        return A;
    };

    public static readonly frobenius_norm = (M: MultiArray | ComplexType[][]): number => {
        M = LAPACKtest.array_to_multiarray(M);
        let sum = Complex.zero();
        const [m, n] = M.dimension;
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const z = M.array[i][j] as ComplexType;
                Complex.mulAndSumTo(sum, z, Complex.conj(z));
            }
        }
        return Complex.realToNumber(Complex.sqrt(sum));
    };

    public static readonly print_matrix = (M: MultiArray | ComplexType[][], Mid: string = 'M', evaluator = Evaluator.Create()): void => {
        M = LAPACKtest.array_to_multiarray(M);
        console.log(`${Mid} = ${MultiArray.unparse(M, evaluator)}`);
    };

    public static array_to_multiarray = (M: MultiArray | ComplexType[][]): MultiArray => {
        if (!(M instanceof MultiArray)) {
            const Mmat = new MultiArray([M.length, M[0].length]);
            Mmat.array = M;
            M = Mmat;
        }
        return M;
    };

    public static array_or_vector_to_diagonal_multiarray = (M: MultiArray | ComplexType[][] | ComplexType[]): MultiArray => {
        if (!(M instanceof MultiArray)) {
            if (!Array.isArray(M) || M.length === 0) {
                throw new Error('Invalid matrix/vector input');
            }
            if (Array.isArray(M[0])) {
                const Mmat = new MultiArray([M.length, M[0].length]);
                Mmat.array = M as ComplexType[][];
                M = Mmat;
            } else {
                const Mmat = new MultiArray([M.length, M.length]);
                Mmat.array = LAPACK.diag(M as ComplexType[]);
                M = Mmat;
            }
        }
        return M;
    };

    public static readonly testHermitian = (A: MultiArray | ComplexType[][], options: TestOptions = {}): TestResult => {
        A = LAPACKtest.array_to_multiarray(A);
        const { print, tol, Aid } = LAPACKtest.setTestOptions(options);
        const result = MathOperation.minus(A, MathOperation.ctranspose(A) as MultiArray) as MultiArray;
        const norm = LAPACKtest.frobenius_norm(result);
        const expression = `${Aid} − ${Aid}ᴴ`;
        if (print) {
            console.log('\n[Hermitian test]\n' + `|| ${expression} ||_F = ${LAPACKtest.frobenius_norm(result).toExponential(6)}\n` + `tolerance = ${tol!.toExponential(6)}`);
        }
        return { dim: A.dimension, norm, expression };
    };

    /**
     * Test unitarity / orthogonality of a matrix:
     *
     *     || Vᴴ V − I ||_F
     */
    public static readonly testUnitarity = (V: MultiArray | ComplexType[][], options: TestOptions = {}): TestResult => {
        V = LAPACKtest.array_to_multiarray(V);
        const { print, frobenius, tol, Vid } = LAPACKtest.setTestOptions(options);
        const VH = MathOperation.ctranspose(V) as MultiArray;
        const VHV = MathOperation.mtimes(VH, V) as MultiArray;
        const n = V.dimension[1];
        const I = new MultiArray([n, n]);
        I.array = LAPACK.eye([n, n]);
        const R = MathOperation.minus(VHV, I) as MultiArray;
        let maxErr: ComplexType | number = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                maxErr = Complex.max(maxErr, Complex.abs(R.array[i][j] as ComplexType));
            }
        }
        maxErr = Complex.realToNumber(maxErr);
        const expression = `${Vid}ᴴ·${Vid} − I`;
        let norm: number = 0;
        if (frobenius) norm = LAPACKtest.frobenius_norm(MathOperation.minus(VHV, I) as MultiArray);
        if (print) {
            console.log(
                '\n[Unitarity test]\n' +
                    (frobenius ? `|| ${expression} ||_F = ${norm.toExponential(6)}\n` : '') +
                    `max |error| = ${maxErr.toExponential(6)}\n` +
                    `tolerance = ${tol!.toExponential(6)}`,
            );
        }
        return frobenius ? { dim: V.dimension, norm, maxErr, expression } : { dim: V.dimension, maxErr, expression };
    };

    public static readonly testOrthogonal = (V: MultiArray | ComplexType[][], options: TestOptions = {}): TestResult => {
        V = LAPACKtest.array_to_multiarray(V);
        const { tol, print, frobenius, Vid } = LAPACKtest.setTestOptions(options);
        const [m, n] = V.dimension;
        let R: MultiArray;
        if (frobenius) R = new MultiArray([n, n]);
        let maxErr = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let s = Complex.zero();
                for (let k = 0; k < n; k++) {
                    Complex.mulAndSumTo(s, V.array[k][i] as ComplexType, V.array[k][j] as ComplexType);
                }
                const expected = i === j ? Complex.one() : Complex.zero();
                const diff = Complex.sub(s, expected);
                if (frobenius) R!.array[i][j] = diff;
                maxErr = Complex.max(maxErr, Complex.abs(diff));
            }
        }
        let norm: number;
        if (frobenius) norm = LAPACKtest.frobenius_norm(R!);
        const expression = `${Vid}ᵀ·${Vid} − I`;
        if (print) {
            console.log(
                '\n[Orthogonality test]\n' +
                    (frobenius ? `|| ${expression} ||_F = ${norm!.toExponential(6)}\n` : '') +
                    `max |error| = ${Complex.realToNumber(maxErr).toExponential(6)}\n` +
                    `tolerance = ${tol!.toExponential(6)}`,
            );
        }
        return frobenius ? { dim: [m, n], norm: norm!, maxErr: Complex.realToNumber(maxErr), expression } : { dim: [m, n], maxErr: Complex.realToNumber(maxErr), expression };
    };

    /**
     * Test that eigenvalues are (numerically) real:
     *
     *     max |Im(λᵢ)|
     */
    public static readonly testRealEigenvalues = (D: MultiArray | ComplexType[][] | ComplexType[], options: TestOptions = {}): TestResult => {
        D = LAPACKtest.array_or_vector_to_diagonal_multiarray(D);
        const { tol, print, Did } = LAPACKtest.setTestOptions(options);
        const n = D.dimension[0];
        let maxErr: ComplexType | number = Complex.zero();
        for (let i = 0; i < n; i++) {
            maxErr = Complex.max(maxErr, Complex.abs(Complex.imag(D.array[i][i] as ComplexType)));
        }
        maxErr = Complex.realToNumber(maxErr);
        if (print) {
            console.log('\n[Eigenvalue reality test]\n' + `max |Im(${Did})| = ${maxErr.toExponential(6)}\n` + `tolerance = ${tol!.toExponential(6)}`);
        }
        return { dim: D.dimension, maxErr };
    };

    /**
     * Test diagonality:
     *
     *     || A − diag(A) ||_F
     */
    public static readonly testOffDiagonal = (D: MultiArray | ComplexType[][] | ComplexType[], options: TestOptions = {}): TestResult => {
        D = LAPACKtest.array_or_vector_to_diagonal_multiarray(D);
        const { tol, print, frobenius, Did } = LAPACKtest.setTestOptions(options);
        const n = D.dimension[0];
        let sum = Complex.zero();
        let maxErr: ComplexType | number = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const z = D.array[i][j] as ComplexType;
                    Complex.mulAndSumTo(sum, z, Complex.conj(z));
                    maxErr = Complex.max(maxErr, Complex.abs(z));
                }
            }
        }
        maxErr = Complex.realToNumber(maxErr);
        let norm: number = 0;
        if (frobenius) norm = Complex.realToNumber(Complex.sqrt(sum));
        if (print) {
            console.log(
                '\n[Off-diagonal test]\n' +
                    (frobenius ? `|| offdiag(${Did}) ||_F = ${norm!.toExponential(6)}\n` : '') +
                    `max |offdiag| = ${maxErr.toExponential(6)}\n` +
                    `tolerance = ${tol!.toExponential(6)}`,
            );
        }
        return frobenius ? { dim: D.dimension, norm, maxErr } : { dim: D.dimension, maxErr };
    };

    /**
     * Test tridiagonality:
     *
     *     || off-tridiagonal(A) ||_F
     */
    public static readonly testTridiagonality = (D: MultiArray | ComplexType[][], options: TestOptions = {}): TestResult => {
        D = LAPACKtest.array_to_multiarray(D);
        const { tol, print, frobenius, Did } = LAPACKtest.setTestOptions(options);
        const n = D.dimension[0];

        let sum = Complex.zero();
        let maxErr: ComplexType | number = Complex.zero();

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (Math.abs(i - j) > 1) {
                    const z = D.array[i][j] as ComplexType;
                    Complex.mulAndSumTo(sum, z, Complex.conj(z));
                    maxErr = Complex.max(maxErr, Complex.abs(z));
                }
            }
        }

        maxErr = Complex.realToNumber(maxErr);
        let norm = 0;
        if (frobenius) norm = Complex.realToNumber(Complex.sqrt(sum));

        if (print) {
            console.log(
                '\n[Off-tridiagonal test]\n' +
                    (frobenius ? `|| offtridiag(${Did}) ||_F = ${norm.toExponential(6)}\n` : '') +
                    `max |offtridiag| = ${maxErr.toExponential(6)}\n` +
                    `tolerance = ${tol!.toExponential(6)}`,
            );
        }

        return frobenius ? { dim: D.dimension, norm, maxErr } : { dim: D.dimension, maxErr };
    };

    /**
     * Test the eigenvalue decomposition residual:
     *
     *     || A·V − V·D ||_F
     *
     * @param A Original Hermitian matrix
     * @param V Eigenvector matrix
     * @param D Diagonal eigenvalue matrix
     */
    public static readonly testEigenResidual = (
        A: MultiArray | ComplexType[][],
        V: MultiArray | ComplexType[][],
        D: MultiArray | ComplexType[][] | ComplexType[],
        options: TestOptions = {},
    ) => {
        A = LAPACKtest.array_to_multiarray(A);
        V = LAPACKtest.array_to_multiarray(V);
        D = LAPACKtest.array_or_vector_to_diagonal_multiarray(D);
        const { print, frobenius, tol, Aid, Did, Vid } = LAPACKtest.setTestOptions(options);
        // A · V
        const AV = MathOperation.mtimes(A, V) as MultiArray;
        // V · D
        const VD = MathOperation.mtimes(V, D) as MultiArray;
        // A·V − V·D
        const R = MathOperation.minus(AV, VD) as MultiArray;
        let maxErr: ComplexType | number = Complex.zero();
        const [m, n] = R.dimension;
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                maxErr = Complex.max(maxErr, Complex.abs(R.array[i][j] as ComplexType));
            }
        }
        maxErr = Complex.realToNumber(maxErr);
        let norm: number = 0;
        if (frobenius) norm = LAPACKtest.frobenius_norm(R);
        if (print) {
            console.log(
                '\n[Eigen residual test]\n' +
                    (frobenius ? `|| ${Aid}·${Vid} − ${Vid}·${Did} ||_F = ${norm.toExponential(6)}\n` : '') +
                    `max |error| = ${maxErr.toExponential(6)}\n` +
                    `tolerance = ${tol!.toExponential(6)}`,
            );
        }
        return frobenius ? { norm, maxErr } : { maxErr };
    };

    /**
     * Test the Hermitian tridiagonal reconstruction:
     *
     *     || A − Q · T · Qᴴ ||_F
     *
     * @param A Original Hermitian matrix
     * @param Q Unitary matrix from UNGTR
     * @param T Tridiagonal matrix
     * @returns Frobenius norm of the reconstruction error
     */
    public static readonly testHermitianTridiagonalReconstruction = (
        A: MultiArray | ComplexType[][],
        Q: MultiArray | ComplexType[][],
        T: MultiArray | ComplexType[][],
        options: TestOptions = {},
    ): TestResult => {
        options = this.setTestOptions(options);
        const { print, Aid, Qid, Tid } = options;
        A = LAPACKtest.array_to_multiarray(A);
        Q = LAPACKtest.array_to_multiarray(Q);
        T = LAPACKtest.array_to_multiarray(T);
        // Qᴴ (conjugate transpose)
        const QH = MathOperation.ctranspose(Q) as MultiArray;
        // Q · T
        const QT = MathOperation.mtimes(Q, T) as MultiArray;
        // Q · T · Qᴴ
        const QTQH = MathOperation.mtimes(QT, QH) as MultiArray;
        // A − Q T Qᴴ
        const result = MathOperation.minus(A, QTQH) as MultiArray;
        const expression = `${Aid} − ${Qid}·${Tid}·${Qid}ᴴ`;
        if (print) {
            LAPACKtest.print_matrix(result, expression);
        }
        const norm = LAPACKtest.frobenius_norm(result);
        console.log(`|| ${expression} ||_F = ${norm.toExponential(6)}`);
        return { norm };
    };

    public static start_test_complex_tridiagonal = (): {
        evaluator: Evaluator;
        D_orig: ComplexType[];
        E_orig: ComplexType[];
        n: number;
    } => {
        const evaluator = Evaluator.Create();
        // --- 1. Tridiagonal hermitiana de teste ---
        const D_orig: ComplexType[] = [Complex.create(2), Complex.create(3), Complex.create(2.5), Complex.create(1.8)];
        const E_orig: ComplexType[] = [Complex.create(0.3, 0.4), Complex.create(0.1, -0.2), Complex.create(-0.2, 0.5)];
        const n = D_orig.length;
        return { evaluator, D_orig, E_orig, n };
    };

    public static start_test_complex_tridiagonal_hermitian = (): {
        evaluator: Evaluator;
        D_orig: ComplexType[];
        E_orig: ComplexType[];
        n: number;
        T0: MultiArray;
    } => {
        const { evaluator, D_orig, E_orig, n } = LAPACKtest.start_test_complex_tridiagonal();
        // --- 2. Constrói T original densa ---
        const T0 = new MultiArray([n, n]);
        T0.array = LAPACK.tridiagonal_hermitian_to_dense(D_orig, E_orig);
        console.log('=== Matriz T0 ===');
        console.log(MultiArray.unparse(T0, evaluator));
        return { evaluator, D_orig, E_orig, n, T0 };
    };

    /**
     *
     * @returns
     */
    public static start_test_complex_tridiagonal_hermitian_to_real2n = (): {
        evaluator: Evaluator;
        D_orig: ComplexType[];
        E_orig: ComplexType[];
        n: number;
        T0: MultiArray;
        T: MultiArray;
    } => {
        const { evaluator, D_orig, E_orig, n, T0 } = LAPACKtest.start_test_complex_tridiagonal_hermitian();
        const T = LAPACK.hermitian_to_real2n(T0.array as ComplexType[][]);
        const T_real = new MultiArray([T.length, T.length]);
        T_real.array = T;
        console.log('=== Matriz T ===');
        console.log(MultiArray.unparse(T_real, evaluator));
        return { evaluator, D_orig, E_orig, n, T0, T: T_real };
    };

    public static test_jacobi_hermitian_real2n_final = (): void => {
        const { evaluator, n, T0, T } = LAPACKtest.start_test_complex_tridiagonal_hermitian_to_real2n();
        // --- Jacobi via real 2n×2n com normalização ---
        const { D, Z } = LAPACKunused.numeric_jacobi_hermitian_via_real2n_final(T0, 1000, 1e-12);
        // --- Reconstrução T ≈ Z·D·Zᴴ ---
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);
        const Zh = LinearAlgebra.ctranspose(Z);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;
        console.log('=== T reconstruída via Z·D·Zᴴ ===');
        console.log(MultiArray.unparse(Trec, evaluator));
        // --- Diferença ---
        const diff = MathOperation.minus(Trec, T0) as MultiArray;
        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));
        // --- Norma Frobenius ---
        let normF_squared = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = diff.array[i][j] as ComplexType;
                normF_squared = Complex.add(normF_squared, Complex.abs2(val));
            }
        }
        const normF = Complex.sqrt(normF_squared);
        console.log('||T - Z·D·Zᴴ||_F =', Complex.unparse(normF, evaluator));
        // --- Checagem de unitariedade ---
        const ZZh = MathOperation.mtimes(LinearAlgebra.ctranspose(Z), Z) as MultiArray;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = ZZh.array[i][j] as ComplexType;
                sum += (i === j ? Complex.realToNumber(val) - 1 : Complex.realToNumber(val)) ** 2 + Complex.imagToNumber(val) ** 2;
            }
        }
        console.log('||ZᴴZ - I||_F =', Math.sqrt(sum));
        console.log('=== FIM DO TESTE Jacobi via Real 2n×2n FINAL ===');
    };

    public static test_jacobi_hermitian_real2n = (): void => {
        const { evaluator, n, T0 } = LAPACKtest.start_test_complex_tridiagonal_hermitian_to_real2n();
        // --- Jacobi via real 2n×2n ---
        const { D, V } = LAPACKunused.jacobi_hermitian_real2n(T0.array as ComplexType[][], 1000, 1e-12);
        // --- Reconstrução ---
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);
        const Vmat = new MultiArray([V.length, V.length]);
        Vmat.array = V;
        const Vh = LinearAlgebra.ctranspose(Vmat);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Vmat, Dmat), Vh) as MultiArray;
        console.log('=== T reconstruída via V·D·Vᴴ ===');
        console.log(MultiArray.unparse(Trec, evaluator));
        // --- Diferença ---
        const diff = MathOperation.minus(Trec, T0) as MultiArray;
        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));
        // --- Norma Frobenius ---
        let normF_squared = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = diff.array[i][j] as ComplexType;
                normF_squared = Complex.add(normF_squared, Complex.abs2(val));
            }
        }
        const normF = Complex.sqrt(normF_squared);
        console.log('||T - V·D·Vᴴ||_F =', Complex.unparse(normF, evaluator));
        // --- Unitariedade ---
        const VVh = MathOperation.mtimes(LinearAlgebra.ctranspose(Vmat), Vmat) as MultiArray;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = VVh.array[i][j] as ComplexType;
                sum += (i === j ? Complex.realToNumber(val) - 1 : Complex.realToNumber(val)) ** 2 + Complex.imagToNumber(val) ** 2;
            }
        }
        console.log('||VᴴV - I||_F =', Math.sqrt(sum));
        console.log('=== FIM DO TESTE Jacobi via Real 2n×2n ===');
    };

    public static test_jacobi_hermitian_real2n_direct = (): void => {
        console.log('=== INÍCIO DO TESTE Jacobi (jacobi_hermitian_real2n_direct) ===');
        const { evaluator, D_orig, E_orig, T0 } = LAPACKtest.start_test_complex_tridiagonal_hermitian_to_real2n();
        // --- Jacobi via real 2n×2n ---
        const { D, V } = LAPACKunused.jacobi_hermitian_real2n_direct(D_orig, E_orig, 1000, 1e-12);
        const Vmat = new MultiArray([V.length, V.length]);
        Vmat.array = V;
        const n = Vmat.dimension[0];
        // --- Reconstrução ---
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);
        const Vh = LinearAlgebra.ctranspose(Vmat);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Vmat, Dmat), Vh) as MultiArray;
        console.log('=== T reconstruída via V·D·Vᴴ ===');
        console.log(MultiArray.unparse(Trec, evaluator));
        // --- Diferença ---
        const diff = MathOperation.minus(Trec, T0) as MultiArray;
        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));
        // --- Norma Frobenius ---
        let normF_squared = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = diff.array[i][j] as ComplexType;
                normF_squared = Complex.add(normF_squared, Complex.abs2(val));
            }
        }
        const normF = Complex.sqrt(normF_squared);
        console.log('||T - V·D·Vᴴ||_F =', Complex.unparse(normF, evaluator));
        // --- Unitariedade ---
        const VVh = MathOperation.mtimes(LinearAlgebra.ctranspose(Vmat), Vmat) as MultiArray;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = VVh.array[i][j] as ComplexType;
                sum += (i === j ? Complex.realToNumber(val) - 1 : Complex.realToNumber(val)) ** 2 + Complex.imagToNumber(val) ** 2;
            }
        }
        console.log('||VᴴV - I||_F =', Math.sqrt(sum));
        console.log('=== FIM DO TESTE Jacobi (jacobi_hermitian_real2n_direct) ===');
    };

    public static test_jacobi_hermitian_via_real2n = (): void => {
        const { evaluator, n, T0, T } = LAPACKtest.start_test_complex_tridiagonal_hermitian_to_real2n();
        // --- 1. Executa Jacobi real ---
        const { D, V } = LAPACK.jacobi_real_symmetric_dense(T.array as ComplexType[][], 1000, 1e-12);
        // --- 2. Reconstrói autovetores complexos ---
        const Z = new MultiArray([V.length / 2, V.length / 2]);
        Z.array = LAPACK.real2n_to_complex_eigenvectors(V);
        // --- 3. Reconstrução T ≈ Z·D·Zᴴ ---
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);
        const Zh = LinearAlgebra.ctranspose(Z);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;
        console.log('=== T reconstruída via Z·D·Zᴴ ===');
        console.log(MultiArray.unparse(Trec, evaluator));
        // --- 4. Diferença Trec - T0 ---
        const diff = MathOperation.minus(Trec, T0) as MultiArray;
        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));
        // --- 5. Norma Frobenius da diferença ---
        let normF_squared = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = diff.array[i][j] as ComplexType;
                normF_squared = Complex.add(normF_squared, Complex.abs2(val));
            }
        }
        const normF = Complex.sqrt(normF_squared);
        console.log('||T - Z·D·Zᴴ||_F =', Complex.unparse(normF, evaluator));
        // --- 6. Checagem de unitariedade ---
        const ZZh = MathOperation.mtimes(LinearAlgebra.ctranspose(Z), Z) as MultiArray;
        console.log(
            '||ZᴴZ - I||_F =',
            (() => {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        const val = ZZh.array[i][j] as ComplexType;
                        sum += (i === j ? Complex.realToNumber(val) - 1 : Complex.realToNumber(val)) ** 2 + Complex.imagToNumber(val) ** 2;
                    }
                }
                return Math.sqrt(sum);
            })(),
        );
        console.log('=== FIM DO TESTE Jacobi via Real 2n×2n ===');
    };

    public static readonly test_jacobi_complex_hermitian_dense = (): void => {
        const rand = (): number => Math.random() - 0.5;

        const randomComplex = (): ComplexType => Complex.create(rand(), rand());

        const randomHermitian = (n: number): ComplexType[][] => {
            const A: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }));

            for (let i = 0; i < n; i++) {
                // diagonal real
                A[i][i] = Complex.create(rand(), 0);
                for (let j = i + 1; j < n; j++) {
                    const z = randomComplex();
                    A[i][j] = z;
                    A[j][i] = Complex.conj(z);
                }
            }
            return A;
        };

        const matMul = (A: ComplexType[][], B: ComplexType[][]): ComplexType[][] => {
            const n = A.length;
            const C: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => Complex.zero()));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    let s = Complex.zero();
                    for (let k = 0; k < n; k++) {
                        Complex.mulAndSumTo(s, A[i][k], B[k][j]);
                    }
                    C[i][j] = s;
                }
            }
            return C;
        };

        const matConjTranspose = (A: ComplexType[][]): ComplexType[][] => {
            const n = A.length;
            const B: ComplexType[][] = Array.from({ length: n }, () => Array.from({ length: n }));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    B[j][i] = Complex.conj(A[i][j]);
                }
            }
            return B;
        };

        const frobNorm = (A: ComplexType[][]): number => {
            let s = 0;
            const n = A.length;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const v = Complex.realToNumber(Complex.abs(A[i][j]));
                    s += v * v;
                }
            }
            return Math.sqrt(s);
        };

        // ===========================
        // Testes
        // ===========================
        const sizes = [2, 3, 5];

        for (const n of sizes) {
            console.log('====================================');
            console.log(`Jacobi Hermitian Complex Test (n = ${n})`);

            const A = randomHermitian(n);
            const { D, V } = LAPACKunused.jacobi_complex_hermitian_dense(A);

            // Vᴴ * V
            const Vh = matConjTranspose(V);
            const VhV = matMul(Vh, V);

            // erro de ortonormalidade
            for (let i = 0; i < n; i++) {
                VhV[i][i] = Complex.sub(VhV[i][i], Complex.one());
            }
            const errOrtho = frobNorm(VhV);

            // Vᴴ * A * V
            const AV = matMul(A, V);
            const VhAV = matMul(Vh, AV);

            // zerar diagonal esperada
            for (let i = 0; i < n; i++) {
                VhAV[i][i] = Complex.sub(VhAV[i][i], D[i]);
            }

            // erro fora da diagonal
            let off = 0;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        const v = Complex.realToNumber(Complex.abs(VhAV[i][j]));
                        off += v * v;
                    }
                }
            }
            const errDiag = Math.sqrt(off);

            // parte imaginária dos autovalores
            let maxImag = 0;
            for (let i = 0; i < n; i++) {
                maxImag = Math.max(maxImag, Math.abs(toNumber(D[i].im)));
            }

            console.log('max |Im(lambda)| =', maxImag.toExponential(3));
            console.log('||VᴴV − I||_F   =', errOrtho.toExponential(3));
            console.log('||offdiag(VᴴAV)|| =', errDiag.toExponential(3));
        }
    };

    public static test_jacobi_hermitian_full(): void {
        const evaluator = Evaluator.Create();
        const D = [2, 3, 2.5, 1.8].map((v) => Complex.create(v));
        const E = [Complex.create(0.3, 0.4), Complex.create(0.1, -0.2), Complex.create(-0.2, 0.5)];
        const n = D.length;
        const T0_array = LAPACK.tridiagonal_hermitian_to_dense(D, E);
        const T = new MultiArray([n, n]);
        T.array = T0_array;
        const Torig = new MultiArray([n, n]);
        Torig.array = JSON.parse(JSON.stringify(T.array));
        const Z = LAPACKunused.jacobi_hermitian_full(T, 50, 1e-12);
        const Zh = LinearAlgebra.ctranspose(Z);
        const Dfinal = new MultiArray([n, n]);
        Dfinal.array = LAPACK.diag(Array.from({ length: n }, (_, i) => T.array[i][i] as ComplexType));
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dfinal), Zh) as MultiArray;
        const diff = MathOperation.minus(Trec, Torig) as MultiArray;
        let normF2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                normF2 = Complex.add(normF2, Complex.abs2(diff.array[i][j] as ComplexType));
            }
        }
        const normF = Complex.sqrt(normF2);
        console.log('||T - Z·D·Zᴴ||_F =', Complex.unparse(normF, evaluator));
        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;
        const I = new MultiArray([n, n]);
        I.array = LAPACK.eye(n, n);
        const diffZ = MathOperation.minus(ZZh, I) as MultiArray;
        let normZ2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                normZ2 = Complex.add(normZ2, Complex.abs2(diffZ.array[i][j] as ComplexType));
            }
        }
        const normZ = Complex.sqrt(normZ2);
        console.log('||ZᴴZ - I||_F =', Complex.unparse(normZ, evaluator));
    }

    public static test_numeric_jacobi_hermitian_direct = (): void => {
        const { evaluator, D_orig, E_orig, n, T0 } = LAPACKtest.start_test_complex_tridiagonal_hermitian();

        // --- 3. Jacobi hermitiano direto ---
        const { D_work, Z } = LAPACKunused.numeric_jacobi_hermitian_direct(D_orig, E_orig, 1000, 1e-12);
        // LAPACK.complex_gram_schmidt(Z);

        // --- 4. Reconstrução espectral ---
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D_work);

        const Zh = LinearAlgebra.ctranspose(Z);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;

        console.log('=== T reconstruída via Z·D·Zᴴ ===');
        console.log(MultiArray.unparse(Trec, evaluator));

        // --- 5. Diferença ---
        const diff = MathOperation.minus(Trec, T0) as MultiArray;

        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));

        // --- 6. Norma de Frobenius da reconstrução ---
        let errRecSq = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                errRecSq = Complex.add(errRecSq, Complex.abs2(diff.array[i][j] as ComplexType));
            }
        }
        const errRec = Complex.sqrt(errRecSq);
        console.log('||T - Z·D·Zᴴ||_F =', Complex.unparse(errRec, evaluator));

        // --- 7. Checagem de unitariedade ---
        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;

        let errUnit = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const v = ZZh.array[i][j] as ComplexType;
                const dr = i === j ? Complex.realToNumber(v) - 1 : Complex.realToNumber(v);
                errUnit += dr * dr + Complex.imagToNumber(v) * Complex.imagToNumber(v);
            }
        }

        console.log('||ZᴴZ - I||_F =', Math.sqrt(errUnit));
        console.log('=== FIM DO TESTE Jacobi Hermitiano Direto ===');
    };

    public static test_apply_givens_tridiagonal = (): void => {
        const { evaluator, D_orig, E_orig, T0 } = LAPACKtest.start_test_complex_tridiagonal_hermitian();
        const D = D_orig;
        const E = E_orig;

        const { c, s } = LAPACKunused.complexGivens(Complex.sub(D[0], D[1]), E[0]);

        LAPACKunused.applyGivensTridiagonal(D, E, 0, c, s);

        const T1 = new MultiArray([3, 3]);
        T1.array = LAPACK.tridiagonal_hermitian_to_dense(D, E);

        // Constrói G explicitamente
        const G = new MultiArray([3, 3]);
        G.array = LAPACK.eye(3, 3);
        G.array[0][0] = c;
        G.array[0][1] = s;
        G.array[1][0] = Complex.neg(Complex.conj(s));
        G.array[1][1] = Complex.conj(c);

        const Gh = LinearAlgebra.ctranspose(G);
        const GTG = MathOperation.mtimes(MathOperation.mtimes(Gh, T0), G) as MultiArray;

        const diff = MathOperation.minus(T1, GTG) as MultiArray;

        console.log('T1 − Gᴴ·T0·G (deve ser ~0):');
        console.log(MultiArray.unparse(diff, evaluator));
    };

    public static test_numeric_qr_hermitian_tridiagonal = (): void => {
        const evaluator = Evaluator.Create();

        const D_orig = [2, 3, 2.5, 1.8].map((v) => Complex.create(v));
        const E_orig = [Complex.create(0.3, 0.4), Complex.create(0.1, -0.2), Complex.create(-0.2, 0.5)];

        const n = D_orig.length;

        const T0 = new MultiArray([n, n]);
        T0.array = LAPACK.tridiagonal_hermitian_to_dense(D_orig, E_orig);

        const D = D_orig.map((c) => Complex.copy(c));
        const E = E_orig.map((c) => Complex.copy(c));

        const Z_array = LAPACKunused.numeric_qr_hermitian_tridiagonal(D, E, 2000, 1e-12);

        const Z = new MultiArray([n, n]);
        Z.array = Z_array;

        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);

        const Zh = LinearAlgebra.ctranspose(Z);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;

        const diff = MathOperation.minus(Trec, T0) as MultiArray;

        let err2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                err2 = Complex.add(err2, Complex.abs2(diff.array[i][j] as ComplexType));
            }
        }

        console.log('||T − Z·D·Zᴴ||_F =', Complex.unparse(Complex.sqrt(err2), evaluator));

        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;

        let unit2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const target = i === j ? Complex.one() : Complex.zero();
                unit2 = Complex.add(unit2, Complex.abs2(Complex.sub(ZZh.array[i][j] as ComplexType, target)));
            }
        }

        console.log('||ZᴴZ − I||_F =', Complex.unparse(Complex.sqrt(unit2), evaluator));
    };

    public static test_qr_hermitian_tridiagonal_full(): void {
        const evaluator = Evaluator.Create();

        // === 1. Matriz tridiagonal hermitiana de teste ===
        const D0: ComplexType[] = [Complex.create(2.0), Complex.create(3.0), Complex.create(2.5), Complex.create(1.8)];

        const E0: ComplexType[] = [Complex.create(0.3, 0.4), Complex.create(0.1, -0.2), Complex.create(-0.2, 0.5)];

        const n = D0.length;

        // Guarda cópia original
        const D = D0.map((c) => Complex.copy(c));
        const E = E0.map((c) => Complex.copy(c));

        // === 2. Constrói T original ===
        const T0_array = LAPACK.tridiagonal_hermitian_to_dense(D0, E0);
        const T0 = new MultiArray([n, n]);
        T0.array = T0_array;

        console.log('=== T original ===');
        console.log(MultiArray.unparse(T0, evaluator));

        // === 3. Inicializa Z como identidade ===
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        // === 4. Executa várias iterações QR ===
        const maxIts = 50;
        for (let it = 0; it < maxIts; it++) {
            LAPACKunused.qr_step_tridiagonal_hermitian(D, E, Z.array as ComplexType[][]);
        }

        // === 5. Monta D final como matriz diagonal ===
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D);

        // === 6. Reconstrói T ≈ Z·D·Zᴴ ===
        const Zh = LinearAlgebra.ctranspose(Z);
        const Trec = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;

        console.log('=== T reconstruída (Z·D·Zᴴ) ===');
        console.log(MultiArray.unparse(Trec, evaluator));

        // === 7. Erro Trec − T0 ===
        const diff = MathOperation.minus(Trec, T0) as MultiArray;

        console.log('=== Diferença Trec - T original ===');
        console.log(MultiArray.unparse(diff, evaluator));

        // === 8. Norma de Frobenius do erro ===
        let normF2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const v = diff.array[i][j] as ComplexType;
                normF2 = Complex.add(normF2, Complex.abs2(v));
            }
        }

        const normF = Complex.sqrt(normF2);
        console.log('||T - Z·D·Zᴴ||_F =', Complex.unparse(normF, evaluator));

        // === 9. Teste de unitariedade de Z ===
        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;
        const I = new MultiArray([n, n]);
        I.array = LAPACK.eye(n, n);

        const diffZ = MathOperation.minus(ZZh, I) as MultiArray;

        let normZ2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const v = diffZ.array[i][j] as ComplexType;
                normZ2 = Complex.add(normZ2, Complex.abs2(v));
            }
        }

        const normZ = Complex.sqrt(normZ2);
        console.log('||ZᴴZ − I||_F =', Complex.unparse(normZ, evaluator));

        console.log('=== FIM DO TESTE QR HERMITIANO ===');
    }

    /**
     * Teste da seção 7: verifica se Zᴴ·T·Z ≈ T_after para matriz tridiagonal hermitiana
     * @param D ComplexType[] diagonal
     * @param E ComplexType[] subdiagonal
     */
    public static readonly test_tridiagonal_similarity = (D: ComplexType[], E: ComplexType[]) => {
        const n = D.length;
        const evaluator = Evaluator.Create();

        // --- 1. Matriz tridiagonal original ---
        const T0_array = LAPACK.tridiagonal_hermitian_to_dense(D, E);
        const T0 = new MultiArray([n, n]);
        T0.array = T0_array;

        // --- 2. Computa autovalores e autovetores ---
        const { D: Dwork, V } = LAPACKunused.numeric_steqr_tridiagonal_bulge(D, E, 2000);

        // --- 3. Constrói Z e matriz diagonal de autovalores ---
        const Z = new MultiArray([n, n]);
        Z.array = V;

        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(Dwork);

        // --- 4. Calcula T reconstruída: Zᴴ·Dmat·Z ---
        const Zh = LinearAlgebra.ctranspose(Z); // Zᴴ
        const T_approx = MathOperation.mtimes(MathOperation.mtimes(Zh, Dmat), Z) as MultiArray;

        // --- 5. Diferença T_approx - T0 ---
        const diff = MathOperation.minus(T_approx, T0) as MultiArray;

        // --- 6. Norma Frobenius (sqrt(sum(|diff_ij|^2))) ---
        let normF = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = diff.array[i][j] as ComplexType;
                normF = Complex.add(normF, Complex.power(Complex.abs(val), Complex.create(2)));
            }
        }
        normF = Complex.sqrt(normF);

        // --- 7. Exibe resultados ---
        console.log('T original:');
        console.log(MultiArray.unparse(T0, evaluator));

        console.log('T reconstruída (Zᴴ·D·Z):');
        console.log(MultiArray.unparse(T_approx, evaluator));

        console.log('Diferença T_approx - T0:');
        console.log(MultiArray.unparse(diff, evaluator));

        console.log('Norma Frobenius da diferença:', Complex.unparse(Complex.real(normF), evaluator));
    };

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
     * Diagnóstico por autovetor:
     * Para cada coluna j:
     *  - lambda = Dcol[j,0]
     *  - rq = (vᴴ * A * v) / (vᴴ * v)   (Rayleigh quotient)
     *  - res_j = || A*v - lambda*v ||_2   (norma euclidiana do residual)
     *
     * Imprime uma tabela (j, lambda, Re(rq), Im(rq), |lambda - rq|, res_j )
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

    public static test_numeric_qr_bulge_chasing_hermitian = (): void => {
        const evaluator = Evaluator.Create();

        // ============================================================
        // 1. Tridiagonal original
        // ============================================================
        const D_orig: ComplexType[] = [2, 3, 2.5, 1.8].map((v) => Complex.create(v));
        const E_orig: ComplexType[] = [Complex.create(0.3, 0.4), Complex.create(0.1, -0.2), Complex.create(-0.2, 0.5)];

        const n = D_orig.length;

        const T0_array = LAPACK.tridiagonal_hermitian_to_dense(D_orig, E_orig);
        const T0 = new MultiArray([n, n]);
        T0.array = T0_array;

        console.log('=== T original ===');
        console.log(MultiArray.unparse(T0, evaluator));

        // ============================================================
        // 2. Executa QR com bulge chasing
        // ============================================================
        const D_work = D_orig.map((c) => Complex.copy(c));
        const E_work = E_orig.map((c) => Complex.copy(c));

        const maxSweeps = 1000;
        const tol = 1e-12;

        const Z_array = LAPACKunused.numeric_qr_bulge_chasing_hermitian_refined(D_work, E_work, maxSweeps, tol);

        const Z = new MultiArray([n, n]);
        Z.array = Z_array;

        // ============================================================
        // 3. Reconstrução T ≈ Z·D·Zᴴ
        // ============================================================
        const Dmat = new MultiArray([n, n]);
        Dmat.array = LAPACK.diag(D_work);

        const Zh = LinearAlgebra.ctranspose(Z);
        const T_approx = MathOperation.mtimes(MathOperation.mtimes(Z, Dmat), Zh) as MultiArray;

        console.log('=== T reconstruída (Z·D·Zᴴ) ===');
        console.log(MultiArray.unparse(T_approx, evaluator));

        // ============================================================
        // 4. Erro de reconstrução
        // ============================================================
        const diff = MathOperation.minus(T_approx, T0) as MultiArray;

        let errRec2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                errRec2 = Complex.add(errRec2, Complex.abs2(diff.array[i][j] as ComplexType));
            }
        }

        console.log('||T − Z·D·Zᴴ||_F =', Complex.unparse(Complex.sqrt(errRec2), evaluator));

        // ============================================================
        // 5. Checagem de unitariedade: ||ZᴴZ − I||_F
        // ============================================================
        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;

        let errUnit2 = Complex.zero();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const target = i === j ? Complex.one() : Complex.zero();

                const diff = Complex.sub(ZZh.array[i][j] as ComplexType, target);

                errUnit2 = Complex.add(errUnit2, Complex.abs2(diff));
            }
        }

        console.log('||ZᴴZ − I||_F =', Complex.unparse(Complex.sqrt(errUnit2), evaluator));

        // ============================================================
        // 6. Norma fora da diagonal do T FINAL (via E_work)
        // ============================================================
        let offDiag2 = Complex.zero();
        for (let i = 0; i < E_work.length; i++) {
            offDiag2 = Complex.add(offDiag2, Complex.abs2(E_work[i]));
        }

        console.log('||offdiag(T_final)||_2 =', Complex.unparse(Complex.sqrt(offDiag2), evaluator));

        // ============================================================
        // 7. T final explícito (diagnóstico visual)
        // ============================================================
        const Tfinal_array = LAPACK.tridiagonal_hermitian_to_dense(D_work, E_work);

        const Tfinal = new MultiArray([n, n]);
        Tfinal.array = Tfinal_array;

        console.log('=== T final implícito (D_work, E_work) ===');
        console.log(MultiArray.unparse(Tfinal, evaluator));

        console.log('=== FIM DO TESTE ===');
    };

    public static test_complex_givens_unitarity = (): void => {
        const evaluator = Evaluator.Create();

        const x = Complex.create(2, -1);
        const y = Complex.create(0.5, 0.8);

        const { c, s } = LAPACKunused.complexGivens(x, y);

        // Constrói G explicitamente
        const G = new MultiArray([2, 2]);
        G.array = [
            [c, s],
            [Complex.neg(Complex.conj(s)), Complex.conj(c)],
        ];

        const Gh = LinearAlgebra.ctranspose(G);
        const GhG = MathOperation.mtimes(Gh, G) as MultiArray;

        console.log('Gᴴ·G (deve ser identidade):');
        console.log(MultiArray.unparse(GhG, evaluator));
    };

    public static test_apply_givens_to_Z = (): void => {
        const evaluator = Evaluator.Create();

        const n = 4;
        const Z = new MultiArray([n, n]);
        Z.array = LAPACK.eye(n, n);

        const { c, s } = LAPACKunused.complexGivens(Complex.create(1.2, -0.4), Complex.create(0.7, 0.9));

        LAPACKunused.applyGivensToZ(Z, 1, c, s);

        const Zh = LinearAlgebra.ctranspose(Z);
        const ZZh = MathOperation.mtimes(Zh, Z) as MultiArray;

        console.log('Zᴴ·Z após uma rotação:');
        console.log(MultiArray.unparse(ZZh, evaluator));
    };
}
export { type TestOptions, LAPACKtest, EXPECT_TOL, MAX_ITERACTION, DEFAULT_EIG_TOL, defaulTestOptions };
export default { LAPACKtest };
