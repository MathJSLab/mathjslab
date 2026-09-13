import { type ComplexType, Complex } from './Complex';
import { CharString } from './CharString';
import { type ElementType, MultiArray } from './MultiArray';
import { BLAS } from './BLAS';
import { LAPACK } from './LAPACK';
import { type BuiltInFunctionSignature, type NodeExpr, type NodeReturnList, AST, type FunctionSignatureEntry, ReturnHandlerResult } from './AST';
import { RuntimeValue } from './RuntimeValue';

/**
 * Runtime configuration for higher-level linear algebra algorithms.
 */
type LinearAlgebraConfig = {
    /**
     * Numerical tolerance used to treat small LU pivots/residuals as zero.
     */
    wasteLU: number;
    /**
     * Small phase-normalization threshold used by QR/LQ decompositions.
     */
    qrPhaseEpsilon: number;
};
type CrossDimensionArgument = ElementType | number;

/** Public list of accepted `LinearAlgebra.set` configuration keys. */
export const LinearAlgebraConfigKeyTable: (keyof LinearAlgebraConfig)[] = ['wasteLU', 'qrPhaseEpsilon'];
const LinearAlgebraConfigKeySet = new Set<keyof LinearAlgebraConfig>(LinearAlgebraConfigKeyTable);

/** Default configuration values used to initialize `LinearAlgebra.settings`. */
const defaultSettings: Partial<LinearAlgebraConfig> = {
    wasteLU: 1e-15,
    qrPhaseEpsilon: 1e-300,
};

/**
 * # LinearAlgebra
 *
 * MATLAB/Octave-facing linear algebra built-ins and decomposition helpers.
 *
 * This layer adapts `MultiArray` values to the lower-level BLAS/LAPACK-style
 * routines and publishes built-in signature metadata used by interpreter call
 * validation. Keep public methods aligned with MATLAB/Octave behavior first;
 * internal helper methods may expose more algorithm-specific shapes.
 *
 * ## References
 *
 * * [Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/LinearAlgebra.html)
 * * [Fundamental Theorem of Linear Algebra at Wolfram MathWorld](https://mathworld.wolfram.com/FundamentalTheoremofLinearAlgebra.html)
 * * [Linear algebra at Wikipedia](https://en.wikipedia.org/wiki/Linear_algebra)
 */
abstract class LinearAlgebra {
    /**
     * Immutable snapshot of default linear-algebra settings.
     */
    public static readonly defaultSettings: LinearAlgebraConfig = Object.assign({}, defaultSettings as LinearAlgebraConfig);

    /**
     * Mutable current linear-algebra settings.
     */
    public static readonly settings: LinearAlgebraConfig = LinearAlgebra.defaultSettings;

    /**
     * Update linear-algebra runtime configuration.
     *
     * @param config Partial configuration object.
     * @throws Error when a configuration key is unknown.
     */
    public static readonly set = (config: Partial<LinearAlgebraConfig>): void => {
        const entries = Object.entries(config);
        entries.forEach((entry) => {
            if (LinearAlgebraConfigKeySet.has(entry[0] as keyof LinearAlgebraConfig)) {
                LinearAlgebra.settings[entry[0] as keyof LinearAlgebraConfig] = entry[1];
            } else {
                throw new Error(`LinearAlgebra.set: invalid configuration parameter: ${entry[0]}`);
            }
        });
    };

    /**
     * Signature metadata for the MATLAB/Octave `eye` built-in.
     */
    public static readonly eyeSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 0 },
            {
                arity: 1,
                parameters: [
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        validators: ['dimension'],
                        alternatives: [{ name: 'dimensions', validators: ['dimensionVector', 'oneOrTwoElement'] }],
                    },
                ],
            },
            {
                arity: 2,
                parameters: [
                    { name: 'rows', classes: ['double'], validators: ['dimension'] },
                    { name: 'columns', classes: ['double'], validators: ['dimension'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Create an identity matrix or scalar identity value.
     *
     * Supported forms mirror MATLAB/Octave: `eye()`, `eye(n)`, `eye([m n])`,
     * and `eye(m, n)`.
     *
     * @param args
     * Dimension arguments.
     * @returns Identity scalar or matrix.
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
     * Signature metadata for the MATLAB/Octave `diag` built-in.
     */
    public static readonly diagSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    { name: 'offset', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer'] },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value', classes: ['double'], validators: ['vector'] },
                    { name: 'rows', classes: ['double'], validators: ['dimension'] },
                    { name: 'columns', classes: ['double'], validators: ['dimension'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Extract a diagonal vector from a matrix or create a diagonal matrix from
     * a vector/scalar.
     *
     * The one- and two-argument forms follow MATLAB/Octave `diag`; the
     * three-argument form creates an explicit `m` by `n` diagonal matrix.
     *
     * @param args Value, optional offset, and optional explicit dimensions.
     * @returns Diagonal vector or matrix.
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

    public static readonly traceSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['matrix2d'] }] },
        outputs: { arity: 1 },
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
            const result = new MultiArray([M.dimension[1], M.dimension[0]], undefined, M.isCell);
            for (let i = 0; i < M.dimension[1]; i++) {
                result.array[i] = new Array(M.dimension[0]);
                for (let j = 0; j < M.dimension[0]; j++) {
                    result.array[i][j] = func(M.array[j][i]).copy();
                }
            }
            result.type = M.type;
            result.isCell = M.isCell;
            return result;
        } else {
            throw new Error('transpose not defined for N-D objects');
        }
    };

    /**
     * Transpose each two-dimensional page of an array, preserving higher
     * dimensions.
     *
     * `MultiArray` stores pages stacked in the physical row axis. This helper
     * therefore maps through the canonical logical subscript translators
     * instead of assuming that a page is contiguous in ordinary row-major
     * storage.
     *
     * @param M Input array.
     * @param func Optional element transform applied after page transposition.
     * @returns Array with the first two dimensions swapped.
     */
    private static readonly applyPageTranspose = (M: MultiArray, func: (value: ElementType) => ElementType = RuntimeValue.copy): MultiArray => {
        const resultDimension = M.dimension.slice();
        [resultDimension[0], resultDimension[1]] = [resultDimension[1], resultDimension[0]];
        const result = new MultiArray(resultDimension, undefined, M.isCell);
        for (let index = 0; index < result.dimension.reduce((product, dimension) => product * dimension, 1); index++) {
            const resultSubscript = MultiArray.linearIndexToSubscript(result.dimension, index);
            const sourceSubscript = resultSubscript.slice();
            [sourceSubscript[0], sourceSubscript[1]] = [resultSubscript[1], resultSubscript[0]];
            const [sourceRow, sourceColumn] = MultiArray.subscriptToMultiArrayRowColumn(M.dimension, sourceSubscript);
            const [resultRow, resultColumn] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
            result.array[resultRow][resultColumn] = func(M.array[sourceRow][sourceColumn]);
        }
        result.type = M.type;
        result.isCell = M.isCell;
        return result;
    };

    public static readonly transposeSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'value' }] },
        outputs: { arity: 1 },
    };
    /**
     * Transpose scalar, character, or matrix values.
     * @param M Value to transpose.
     * @returns Transposed value.
     */
    public static readonly transpose = <T extends ElementType>(M: T): T extends CharString ? MultiArray : T => {
        const value = CharString.isInstanceOf(M) ? MultiArray.characterVectorFromCharString(M) : M;
        return (Complex.isInstanceOf(value) ? Complex.copy(value) : LinearAlgebra.applyTranspose(value as MultiArray)) as T extends CharString ? MultiArray : T;
    };

    public static readonly ctransposeSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'value' }] },
        outputs: { arity: 1 },
    };
    /**
     * Complex conjugate transpose scalar, character, or matrix values.
     * @param M Value to conjugate-transpose.
     * @returns Complex conjugate transpose value.
     */
    public static readonly ctranspose = <T extends ElementType>(M: T): T extends CharString ? MultiArray : T => {
        const value = CharString.isInstanceOf(M) ? MultiArray.characterVectorFromCharString(M) : M;
        return (
            Complex.isInstanceOf(value)
                ? Complex.conj(value)
                : LinearAlgebra.applyTranspose(value as MultiArray, (element: ElementType) =>
                      (value as MultiArray).isCell || !Complex.isInstanceOf(element) ? element : Complex.conj(element),
                  )
        ) as T extends CharString ? MultiArray : T;
    };

    public static readonly pagetransposeSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'value' }] },
        outputs: { arity: 1 },
    };
    /**
     * Page-wise nonconjugate transpose.
     *
     * MATLAB defines this as `permute(X,[2 1 3:ndims(X)])`.
     *
     * @param M Value to transpose page-wise.
     * @returns Page-wise transposed value.
     */
    public static readonly pagetranspose = <T extends ElementType>(M: T): T extends CharString ? MultiArray : T => {
        const value = CharString.isInstanceOf(M) ? MultiArray.characterVectorFromCharString(M) : M;
        return (Complex.isInstanceOf(value) ? Complex.copy(value) : LinearAlgebra.applyPageTranspose(value as MultiArray)) as T extends CharString ? MultiArray : T;
    };

    public static readonly pagectransposeSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'value' }] },
        outputs: { arity: 1 },
    };
    /**
     * Page-wise complex conjugate transpose.
     *
     * MATLAB defines this as `permute(conj(X),[2 1 3:ndims(X)])`.
     *
     * @param M Value to conjugate-transpose page-wise.
     * @returns Page-wise conjugate-transposed value.
     */
    public static readonly pagectranspose = <T extends ElementType>(M: T): T extends CharString ? MultiArray : T => {
        const value = CharString.isInstanceOf(M) ? MultiArray.characterVectorFromCharString(M) : M;
        return (
            Complex.isInstanceOf(value)
                ? Complex.conj(value)
                : LinearAlgebra.applyPageTranspose(value as MultiArray, (element: ElementType) =>
                      (value as MultiArray).isCell || !Complex.isInstanceOf(element) ? RuntimeValue.copy(element) : Complex.conj(element),
                  )
        ) as T extends CharString ? MultiArray : T;
    };

    public static readonly pagemtimesSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 2,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'right', classes: ['double'] },
                ],
            },
            {
                arity: 4,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'leftTranspose', classes: ['char', 'string'], allowedStrings: ['none', 'transpose', 'ctranspose'] },
                    { name: 'right', classes: ['double'] },
                    { name: 'rightTranspose', classes: ['char', 'string'], allowedStrings: ['none', 'transpose', 'ctranspose'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Parse a page-wise multiplication transposition option.
     *
     * @param option Option value.
     * @returns Normalized transposition option.
     */
    private static readonly pageTransposeOption = (option: ElementType, functionName = 'pagemtimes'): 'none' | 'transpose' | 'ctranspose' => {
        if (!CharString.isInstanceOf(option) || (option.str !== 'none' && option.str !== 'transpose' && option.str !== 'ctranspose')) {
            throw new EvalError(`${functionName}: transpose options must be 'none', 'transpose', or 'ctranspose'.`);
        }
        return option.str;
    };

    /**
     * Normalize a numeric page-wise multiplication input.
     *
     * @param value Input scalar or array.
     * @returns Dense numeric array representation.
     */
    private static readonly pageNumericArray = (value: ElementType, functionName = 'pagemtimes'): MultiArray => {
        const array = MultiArray.scalarToMultiArray(value);
        if (array.isCell || !MultiArray.linearize(array).every(Complex.isInstanceOf)) {
            throw new EvalError(`${functionName}: input arrays must be numeric.`);
        }
        return array;
    };

    /**
     * Apply a page-wise transposition option to an array.
     *
     * @param value Input array.
     * @param option Transposition option.
     * @returns Transformed array.
     */
    private static readonly applyPageTransposeOption = (value: MultiArray, option: 'none' | 'transpose' | 'ctranspose'): MultiArray => {
        if (option === 'transpose') {
            return LinearAlgebra.pagetranspose(value) as MultiArray;
        }
        if (option === 'ctranspose') {
            return LinearAlgebra.pagectranspose(value) as MultiArray;
        }
        return value;
    };

    /**
     * Read one element from a logical page.
     *
     * @param value Source array.
     * @param dimensions Padded source dimensions.
     * @param row One-based row subscript.
     * @param column One-based column subscript.
     * @param pageSubscript One-based subscripts for dimensions three and above.
     * @returns Numeric element.
     */
    private static readonly pageElement = (value: MultiArray, dimensions: number[], row: number, column: number, pageSubscript: number[]): ComplexType => {
        const linear = MultiArray.subscriptToLinearIndex(dimensions, [row, column, ...pageSubscript]);
        const [physicalRow, physicalColumn] = MultiArray.linearIndexToMultiArrayRowColumn(dimensions[0], dimensions[1], linear);
        return value.array[physicalRow][physicalColumn] as ComplexType;
    };

    /**
     * Extract a two-dimensional matrix page from an N-D array.
     *
     * @param value Source array.
     * @param dimensions Padded source dimensions.
     * @param pageSubscript One-based subscripts for dimensions three and above.
     * @returns Dense matrix containing the requested page.
     */
    private static readonly pageMatrix = (value: MultiArray, dimensions: number[], pageSubscript: number[]): MultiArray => {
        const result = new MultiArray([dimensions[0], dimensions[1]]);
        for (let row = 1; row <= dimensions[0]; row++) {
            for (let column = 1; column <= dimensions[1]; column++) {
                result.array[row - 1][column - 1] = RuntimeValue.copy(LinearAlgebra.pageElement(value, dimensions, row, column, pageSubscript));
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Store a two-dimensional matrix page in an N-D result array.
     *
     * @param target Target array.
     * @param pageSubscript One-based subscripts for dimensions three and above.
     * @param page Page matrix.
     */
    private static readonly setPageMatrix = (target: MultiArray, pageSubscript: number[], page: MultiArray): void => {
        for (let row = 1; row <= page.dimension[0]; row++) {
            for (let column = 1; column <= page.dimension[1]; column++) {
                const [targetRow, targetColumn] = MultiArray.subscriptToMultiArrayRowColumn(target.dimension, [row, column, ...pageSubscript]);
                target.array[targetRow][targetColumn] = RuntimeValue.copy(page.array[row - 1][column - 1]);
            }
        }
    };

    /**
     * Compute singleton-expanded page dimensions for two page-wise operands.
     *
     * @param functionName Function name used in diagnostics.
     * @param leftDimensions Padded left operand dimensions.
     * @param rightDimensions Padded right operand dimensions.
     * @param pageRank Common padded rank.
     * @returns Broadcast page dimensions.
     */
    private static readonly pageBroadcastDimensions = (functionName: string, leftDimensions: number[], rightDimensions: number[], pageRank: number): number[] => {
        const resultPageDimensions = new Array<number>(pageRank - 2);
        for (let index = 2; index < pageRank; index++) {
            if (leftDimensions[index] === rightDimensions[index]) {
                resultPageDimensions[index - 2] = leftDimensions[index];
            } else if (leftDimensions[index] === 1) {
                resultPageDimensions[index - 2] = rightDimensions[index];
            } else if (rightDimensions[index] === 1) {
                resultPageDimensions[index - 2] = leftDimensions[index];
            } else {
                throw new EvalError(`${functionName}: page dimensions must agree (op1 is ${leftDimensions.slice(2).join('x') || '1'}, op2 is ${rightDimensions.slice(2).join('x') || '1'}).`);
            }
        }
        return resultPageDimensions;
    };

    /**
     * Page-wise matrix multiplication with singleton expansion over page
     * dimensions.
     *
     * @param args `pagemtimes(X,Y)` or `pagemtimes(X,transpX,Y,transpY)`.
     * @returns Page-wise matrix product.
     */
    public static readonly pagemtimes = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('pagemtimes', args.length !== 2 && args.length !== 4);
        const leftOption = args.length === 4 ? LinearAlgebra.pageTransposeOption(args[1]) : 'none';
        const rightOption = args.length === 4 ? LinearAlgebra.pageTransposeOption(args[3]) : 'none';
        const left = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args[0]), leftOption);
        const right = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args.length === 4 ? args[2] : args[1]), rightOption);
        const leftDimensions = left.dimension.slice();
        const rightDimensions = right.dimension.slice();
        const pageRank = Math.max(leftDimensions.length, rightDimensions.length, 2);
        MultiArray.appendSingletonTail(leftDimensions, pageRank);
        MultiArray.appendSingletonTail(rightDimensions, pageRank);

        const leftRows = leftDimensions[0];
        const leftColumns = leftDimensions[1];
        const rightRows = rightDimensions[0];
        const rightColumns = rightDimensions[1];
        const leftIsScalarPage = leftRows === 1 && leftColumns === 1;
        const rightIsScalarPage = rightRows === 1 && rightColumns === 1;
        if (!leftIsScalarPage && !rightIsScalarPage && leftColumns !== rightRows) {
            throw new EvalError(`pagemtimes: inner matrix dimensions must agree (op1 is ${leftRows}x${leftColumns}, op2 is ${rightRows}x${rightColumns}).`);
        }

        const resultPageDimensions = LinearAlgebra.pageBroadcastDimensions('pagemtimes', leftDimensions, rightDimensions, pageRank);

        const resultRows = leftIsScalarPage ? rightRows : leftRows;
        const resultColumns = rightIsScalarPage ? leftColumns : rightColumns;
        const resultDimensions = [resultRows, resultColumns, ...resultPageDimensions];
        const result = new MultiArray(resultDimensions);
        const resultPageCount = resultPageDimensions.reduce((product, dimension) => product * dimension, 1);
        const resultPageStrides = MultiArray.computeStrides(resultPageDimensions.length > 0 ? resultPageDimensions : [1]);

        for (let pageIndex = 0; pageIndex < resultPageCount; pageIndex++) {
            const resultPageSubscript = resultPageDimensions.map((dimension, index) => (Math.floor(pageIndex / resultPageStrides[index]) % dimension) + 1);
            const leftPageSubscript = resultPageSubscript.map((subscript, index) => (leftDimensions[index + 2] === 1 ? 1 : subscript));
            const rightPageSubscript = resultPageSubscript.map((subscript, index) => (rightDimensions[index + 2] === 1 ? 1 : subscript));
            for (let row = 1; row <= resultRows; row++) {
                for (let column = 1; column <= resultColumns; column++) {
                    let sum = Complex.zero();
                    if (leftIsScalarPage) {
                        sum = Complex.mul(
                            LinearAlgebra.pageElement(left, leftDimensions, 1, 1, leftPageSubscript),
                            LinearAlgebra.pageElement(right, rightDimensions, row, column, rightPageSubscript),
                        );
                    } else if (rightIsScalarPage) {
                        sum = Complex.mul(
                            LinearAlgebra.pageElement(left, leftDimensions, row, column, leftPageSubscript),
                            LinearAlgebra.pageElement(right, rightDimensions, 1, 1, rightPageSubscript),
                        );
                    } else {
                        for (let inner = 1; inner <= leftColumns; inner++) {
                            sum = Complex.add(
                                sum,
                                Complex.mul(
                                    LinearAlgebra.pageElement(left, leftDimensions, row, inner, leftPageSubscript),
                                    LinearAlgebra.pageElement(right, rightDimensions, inner, column, rightPageSubscript),
                                ),
                            );
                        }
                    }
                    const resultSubscript = [row, column, ...resultPageSubscript];
                    const [resultRow, resultColumn] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, resultSubscript);
                    result.array[resultRow][resultColumn] = sum;
                }
            }
        }
        MultiArray.setType(result);
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly pageinvSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'array', classes: ['double'] }] },
        outputs: { arity: -2 },
    };

    /**
     * Page-wise matrix inverse.
     *
     * MATLAB defines each output page as `Y(:,:,i,...) = inv(X(:,:,i,...))`.
     *
     * @param X Numeric matrix or N-D array whose pages are square matrices.
     * @returns Page-wise inverse array.
     */
    public static readonly pageinvValue = (X: ElementType): ElementType => {
        const source = LinearAlgebra.pageNumericArray(X, 'pageinv');
        const dimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(dimensions, 2);
        if (dimensions[0] !== dimensions[1]) {
            throw new EvalError(`pageinv: each page must be a square matrix (page size is ${dimensions[0]}x${dimensions[1]}).`);
        }

        const pageDimensions = dimensions.slice(2);
        const result = new MultiArray(dimensions);
        const pageCount = pageDimensions.reduce((product, dimension) => product * dimension, 1);
        const pageStrides = MultiArray.computeStrides(pageDimensions.length > 0 ? pageDimensions : [1]);
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const pageSubscript = pageDimensions.map((dimension, index) => (Math.floor(pageIndex / pageStrides[index]) % dimension) + 1);
            LinearAlgebra.setPageMatrix(result, pageSubscript, LinearAlgebra.inv(LinearAlgebra.pageMatrix(source, dimensions, pageSubscript)));
        }
        MultiArray.setType(result);
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    /**
     * Estimate one reciprocal condition value for each matrix page.
     *
     * Square pages use `rcond`; rectangular pages use the reciprocal of the
     * default dense `cond` estimate. Both produce the MATLAB-style `1x1` page
     * result shape.
     *
     * @param functionName Function name used in diagnostics.
     * @param source Source array.
     * @param dimensions Padded source dimensions.
     * @returns Reciprocal condition numbers, one scalar per matrix page.
     */
    private static readonly pageReciprocalCondition = (functionName: string, source: MultiArray, dimensions: number[]): ElementType => {
        const pageDimensions = dimensions.slice(2);
        const result = new MultiArray([1, 1, ...pageDimensions]);
        const pageCount = pageDimensions.reduce((product, dimension) => product * dimension, 1);
        const pageStrides = MultiArray.computeStrides(pageDimensions.length > 0 ? pageDimensions : [1]);
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const pageSubscript = pageDimensions.map((dimension, index) => (Math.floor(pageIndex / pageStrides[index]) % dimension) + 1);
            const page = LinearAlgebra.pageMatrix(source, dimensions, pageSubscript);
            const reciprocal = page.dimension[0] === page.dimension[1] ? LinearAlgebra.rcond(page) : Complex.rdiv(Complex.one(), LinearAlgebra.cond(page));
            const [row, column] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, [1, 1, ...pageSubscript]);
            result.array[row][column] = reciprocal;
        }
        MultiArray.setType(result);
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    /**
     * Page-wise matrix inverse with optional reciprocal condition numbers.
     *
     * @param X Numeric matrix or N-D array whose pages are square matrices.
     * @returns Lazy return list for `Y` and optional `RC`.
     */
    public static readonly pageinv = (X: ElementType): NodeReturnList => {
        return AST.nodeBoundedReturnList(
            2,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => (index === 0 ? evaluated.inverse : evaluated.reciprocalCondition),
            (length: number): ReturnHandlerResult => {
                const source = LinearAlgebra.pageNumericArray(X, 'pageinv');
                const dimensions = source.dimension.slice();
                MultiArray.appendSingletonTail(dimensions, 2);
                const inverse = LinearAlgebra.pageinvValue(source);
                const reciprocalCondition = length > 1 ? LinearAlgebra.pageReciprocalCondition('pageinv', source, dimensions) : undefined;
                return { length, inverse, reciprocalCondition };
            },
        );
    };

    public static readonly pagemldivideSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 2,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'right', classes: ['double'] },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'leftTranspose', classes: ['char', 'string'], allowedStrings: ['none', 'transpose', 'ctranspose'] },
                    { name: 'right', classes: ['double'] },
                ],
            },
        ],
        outputs: { arity: -2 },
    };

    public static readonly pagemrdivideSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 2,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'right', classes: ['double'] },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'right', classes: ['double'] },
                    { name: 'rightTranspose', classes: ['char', 'string'], allowedStrings: ['none', 'transpose', 'ctranspose'] },
                ],
            },
        ],
        outputs: { arity: -2 },
    };

    /**
     * Apply a binary page-wise matrix solver with singleton page expansion.
     *
     * @param functionName Function name used in diagnostics.
     * @param left Left operand.
     * @param right Right operand.
     * @param solve Per-page solver.
     * @returns Page-wise solver output.
     */
    private static readonly pageMatrixBinarySolveValue = (
        functionName: string,
        left: MultiArray,
        right: MultiArray,
        solve: (leftPage: MultiArray, rightPage: MultiArray) => MultiArray,
    ): ElementType => {
        const leftDimensions = left.dimension.slice();
        const rightDimensions = right.dimension.slice();
        const pageRank = Math.max(leftDimensions.length, rightDimensions.length, 2);
        MultiArray.appendSingletonTail(leftDimensions, pageRank);
        MultiArray.appendSingletonTail(rightDimensions, pageRank);
        const resultPageDimensions = LinearAlgebra.pageBroadcastDimensions(functionName, leftDimensions, rightDimensions, pageRank);
        const resultPageCount = resultPageDimensions.reduce((product, dimension) => product * dimension, 1);
        const resultPageStrides = MultiArray.computeStrides(resultPageDimensions.length > 0 ? resultPageDimensions : [1]);
        let result: MultiArray | undefined;

        for (let pageIndex = 0; pageIndex < resultPageCount; pageIndex++) {
            const resultPageSubscript = resultPageDimensions.map((dimension, index) => (Math.floor(pageIndex / resultPageStrides[index]) % dimension) + 1);
            const leftPageSubscript = resultPageSubscript.map((subscript, index) => (leftDimensions[index + 2] === 1 ? 1 : subscript));
            const rightPageSubscript = resultPageSubscript.map((subscript, index) => (rightDimensions[index + 2] === 1 ? 1 : subscript));
            const solved = solve(LinearAlgebra.pageMatrix(left, leftDimensions, leftPageSubscript), LinearAlgebra.pageMatrix(right, rightDimensions, rightPageSubscript));
            if (!result) {
                result = new MultiArray([solved.dimension[0], solved.dimension[1], ...resultPageDimensions]);
            }
            LinearAlgebra.setPageMatrix(result, resultPageSubscript, solved);
        }
        if (!result) {
            result = new MultiArray([0, 0, ...resultPageDimensions]);
        }
        MultiArray.setType(result);
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    /**
     * Page-wise left matrix division.
     *
     * @param args `pagemldivide(A,B)` or `pagemldivide(A,transpA,B)`.
     * @returns Page-wise solution for `A(:,:,i,...) \ B(:,:,i,...)`.
     */
    public static readonly pagemldivideValue = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('pagemldivide', args.length !== 2 && args.length !== 3);
        const leftOption = args.length === 3 ? LinearAlgebra.pageTransposeOption(args[1], 'pagemldivide') : 'none';
        const left = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args[0], 'pagemldivide'), leftOption);
        const right = LinearAlgebra.pageNumericArray(args.length === 3 ? args[2] : args[1], 'pagemldivide');
        return LinearAlgebra.pageMatrixBinarySolveValue('pagemldivide', left, right, LinearAlgebra.mldivide);
    };

    /**
     * Page-wise left matrix division with optional reciprocal condition numbers.
     *
     * @param args `pagemldivide(A,B)` or `pagemldivide(A,transpA,B)`.
     * @returns Lazy return list for `X` and optional `rcondA`.
     */
    public static readonly pagemldivide = (...args: ElementType[]): NodeReturnList => {
        AST.throwInvalidCallError('pagemldivide', args.length !== 2 && args.length !== 3);
        return AST.nodeBoundedReturnList(
            2,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => (index === 0 ? evaluated.solution : evaluated.reciprocalCondition),
            (length: number): ReturnHandlerResult => {
                const leftOption = args.length === 3 ? LinearAlgebra.pageTransposeOption(args[1], 'pagemldivide') : 'none';
                const left = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args[0], 'pagemldivide'), leftOption);
                const solution = LinearAlgebra.pagemldivideValue(...args);
                const leftDimensions = left.dimension.slice();
                MultiArray.appendSingletonTail(leftDimensions, 2);
                const reciprocalCondition = length > 1 ? LinearAlgebra.pageReciprocalCondition('pagemldivide', left, leftDimensions) : undefined;
                return { length, solution, reciprocalCondition };
            },
        );
    };

    /**
     * Page-wise right matrix division.
     *
     * @param args `pagemrdivide(B,A)` or `pagemrdivide(B,A,transpA)`.
     * @returns Page-wise solution for `B(:,:,i,...) / A(:,:,i,...)`.
     */
    public static readonly pagemrdivideValue = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('pagemrdivide', args.length !== 2 && args.length !== 3);
        const rightOption = args.length === 3 ? LinearAlgebra.pageTransposeOption(args[2], 'pagemrdivide') : 'none';
        const left = LinearAlgebra.pageNumericArray(args[0], 'pagemrdivide');
        const right = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args[1], 'pagemrdivide'), rightOption);
        return LinearAlgebra.pageMatrixBinarySolveValue('pagemrdivide', left, right, LinearAlgebra.mrdivide);
    };

    /**
     * Page-wise right matrix division with optional reciprocal condition numbers.
     *
     * @param args `pagemrdivide(B,A)` or `pagemrdivide(B,A,transpA)`.
     * @returns Lazy return list for `X` and optional `rcondA`.
     */
    public static readonly pagemrdivide = (...args: ElementType[]): NodeReturnList => {
        AST.throwInvalidCallError('pagemrdivide', args.length !== 2 && args.length !== 3);
        return AST.nodeBoundedReturnList(
            2,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => (index === 0 ? evaluated.solution : evaluated.reciprocalCondition),
            (length: number): ReturnHandlerResult => {
                const rightOption = args.length === 3 ? LinearAlgebra.pageTransposeOption(args[2], 'pagemrdivide') : 'none';
                const right = LinearAlgebra.applyPageTransposeOption(LinearAlgebra.pageNumericArray(args[1], 'pagemrdivide'), rightOption);
                const solution = LinearAlgebra.pagemrdivideValue(...args);
                const rightDimensions = right.dimension.slice();
                MultiArray.appendSingletonTail(rightDimensions, 2);
                const reciprocalCondition = length > 1 ? LinearAlgebra.pageReciprocalCondition('pagemrdivide', right, rightDimensions) : undefined;
                return { length, solution, reciprocalCondition };
            },
        );
    };

    public static readonly mulSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [
                { name: 'left', classes: ['double'], validators: ['matrix2d'] },
                { name: 'right', classes: ['double'], validators: ['matrix2d'] },
            ],
        },
        outputs: { arity: 1 },
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

    public static readonly powerSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [
                { name: 'matrix', classes: ['double'], validators: ['squareMatrix'] },
                { name: 'exponent', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer'] },
            ],
        },
        outputs: { arity: 1 },
    };

    private static readonly multiplyMatrices = (left: MultiArray, right: MultiArray): MultiArray => {
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
    };

    private static readonly formatDimensions = (value: MultiArray): string => value.dimension.join('x');

    private static readonly hermitianEigenExpansion = (matrix: MultiArray, diagonalMap: (value: ComplexType) => ComplexType): MultiArray => {
        if (!LAPACK.is_hermitian(matrix.array as ComplexType[][])) {
            throw new Error("invalid exponent in '^'.");
        }
        const decomposition = LAPACK.jacobi_symmetric_hermitian(BLAS.copy(matrix.array as ComplexType[][]) as ComplexType[][], 1000, 1e-14);
        const vectors = new MultiArray([matrix.dimension[0], matrix.dimension[1]]);
        vectors.array = decomposition.V;
        const diagonalPowers = MultiArray.toDiagonalMatrix(decomposition.D.map(diagonalMap));
        const vectorsTimesPowers = LinearAlgebra.multiplyMatrices(vectors, diagonalPowers);
        return LinearAlgebra.multiplyMatrices(vectorsTimesPowers, LinearAlgebra.ctranspose(vectors));
    };

    /**
     * Matrix power for square matrices and scalar exponents.
     *
     * MATLAB/Octave-compatible integer powers are computed through
     * exponentiation by squaring. Non-integer scalar exponents currently use
     * the Hermitian/symmetric eigenvalue expansion supported by the numerical
     * backend.
     *
     * @param left Square matrix base.
     * @param right Integer real scalar exponent.
     * @returns Matrix power result.
     */
    public static readonly power = (left: MultiArray, right: ComplexType): MultiArray => {
        if (left.dimension.length !== 2 || left.dimension[0] !== left.dimension[1]) {
            throw new EvalError(`operator ^: only square matrices can be raised to scalar powers.`);
        }
        if (Complex.realIsInteger(right) && Complex.imagEquals(right, 0)) {
            let exponent = Math.abs(Complex.realToNumber(right));
            let result = LinearAlgebra.eye(Complex.create(left.dimension[0], 0)) as MultiArray;
            let factor = Complex.realGreaterThan(right, 0) || Complex.realEquals(right, 0) ? MultiArray.copy(left) : LinearAlgebra.inv(left);
            while (exponent > 0) {
                if (exponent % 2 === 1) {
                    result = LinearAlgebra.multiplyMatrices(result, factor);
                }
                exponent = Math.floor(exponent / 2);
                if (exponent > 0) {
                    factor = LinearAlgebra.multiplyMatrices(factor, factor);
                }
            }
            return result;
        } else {
            return LinearAlgebra.hermitianEigenExpansion(left, (value) => Complex.power(value, right));
        }
    };

    /**
     * Scalar base raised to a Hermitian/symmetric matrix exponent.
     *
     * MATLAB/Octave define `a^B` for scalar `a` and square matrix `B` through
     * an eigenvalue expansion. The current numerical backend exposes a
     * Hermitian/symmetric eigensolver, so this method intentionally accepts
     * that well-conditioned subset and rejects general square matrices until a
     * general eigensolver or Schur path is available.
     *
     * @param left Scalar base.
     * @param right Hermitian/symmetric matrix exponent.
     * @returns Matrix result `V * diag(left .^ lambda) * V'`.
     */
    public static readonly scalarPower = (left: ComplexType, right: MultiArray): MultiArray => {
        if (right.dimension.length !== 2 || right.dimension[0] !== right.dimension[1]) {
            throw new EvalError(`operator ^: matrix exponent must be square when base is scalar.`);
        }
        return LinearAlgebra.hermitianEigenExpansion(right, (value) => Complex.power(left, value));
    };

    public static readonly detSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: 1 },
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
                    L.array[i][j] = Acopy.array[i][j] as ComplexType;
                    U.array[i][j] = Complex.zero();
                } else if (i === j) {
                    L.array[i][j] = Complex.one();
                    U.array[i][j] = Acopy.array[i][j] as ComplexType;
                } else {
                    L.array[i][j] = Complex.zero();
                    U.array[i][j] = Acopy.array[i][j] as ComplexType;
                }
            }
        }
        return { L, U, P, swaps };
    };

    public static readonly luSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: -3 },
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
        return AST.nodeBoundedReturnList(
            3,
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

    public static readonly invSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: 1 },
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

    public static readonly condSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['matrix2d'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'matrix', classes: ['double'], validators: ['matrix2d'] },
                    {
                        name: 'normType',
                        alternatives: [
                            { name: 'numericNormType', classes: ['double'], validators: ['numeric', 'scalar', 'real'] },
                            { name: 'frobeniusNormType', classes: ['char', 'string'], allowedStrings: ['fro'] },
                        ],
                    },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Matrix condition number for inversion.
     *
     * The default and `p = 2` forms use the singular value ratio. The
     * remaining MATLAB-compatible orders use `norm(A, p) * norm(inv(A), p)`.
     *
     * @param A Input matrix.
     * @param normType Optional norm type: `1`, `2`, `Inf`, or `'fro'`.
     * @returns Scalar condition number.
     */
    public static readonly cond = (A: MultiArray, normType: ComplexType | CharString = Complex.create(2)): ComplexType => {
        if (!A || A.dimension.length !== 2) {
            AST.throwInvalidCallError('cond');
        }
        if (A.dimension[0] === 0 || A.dimension[1] === 0) {
            return Complex.zero();
        }
        if (CharString.isInstanceOf(normType)) {
            if (normType.str !== 'fro') {
                AST.throwInvalidCallError('cond');
            }
            return LinearAlgebra.squareMatrixNormCondition(A, 'fro', 'cond');
        }
        const p = Complex.realToNumber(MultiArray.firstElement(normType) as ComplexType);
        if (p === 2) {
            const singularValuesSquared = LinearAlgebra.singularValuesSquared(A);
            if (singularValuesSquared.length === 0) {
                return Complex.zero();
            }
            const largest = singularValuesSquared[singularValuesSquared.length - 1];
            const smallest = singularValuesSquared[0];
            if (smallest <= Math.max(1e-14 * largest, 0)) {
                return Complex.inf_0();
            }
            return Complex.create(Math.sqrt(largest / smallest));
        } else if (p === 1 || p === Infinity) {
            return LinearAlgebra.squareMatrixNormCondition(A, p, 'cond');
        }
        AST.throwInvalidCallError('cond');
        throw new EvalError('Invalid call to cond.');
    };

    public static readonly rcondSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: 1 },
    };

    /**
     * Estimate reciprocal condition number in the 1-norm.
     *
     * This follows the public MATLAB/Octave contract of `rcond(A)`. The
     * current implementation derives the estimate from the deterministic dense
     * `cond(A,1)` path used elsewhere in this layer.
     *
     * @param A Square numeric matrix.
     * @returns Reciprocal condition estimate.
     */
    public static readonly rcond = (A: MultiArray): ComplexType => {
        if (!A || A.dimension.length !== 2 || A.dimension[0] !== A.dimension[1]) {
            AST.throwInvalidCallError('rcond');
        }
        const condition = LinearAlgebra.squareMatrixNormCondition(A, 1, 'rcond');
        return Complex.realToNumber(condition) === Infinity ? Complex.zero() : Complex.rdiv(Complex.one(), condition);
    };

    public static readonly rankSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['matrix2d'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'matrix', classes: ['double'], validators: ['matrix2d'] },
                    { name: 'tolerance', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'nonnegative'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Numerical matrix rank estimated from singular values.
     *
     * MATLAB defines the default tolerance as `max(size(A)) * eps(norm(A))`
     * and counts singular values strictly larger than the tolerance.
     *
     * @param A Input matrix.
     * @param tolerance Optional singular-value tolerance.
     * @returns Rank as a scalar double value.
     */
    public static readonly rank = (A: MultiArray, tolerance?: ComplexType): ComplexType => {
        if (!A || A.dimension.length !== 2) {
            AST.throwInvalidCallError('rank');
        }
        const singularValues = LinearAlgebra.singularValues(A);
        if (singularValues.length === 0) {
            return Complex.zero();
        }
        const tol =
            typeof tolerance === 'undefined' ? Math.max(A.dimension[0], A.dimension[1]) * Number.EPSILON * singularValues[singularValues.length - 1] : Complex.realToNumber(tolerance);
        if (!Number.isFinite(tol) || tol < 0 || (typeof tolerance !== 'undefined' && !Complex.imagIsZero(tolerance))) {
            AST.throwInvalidCallError('rank');
        }
        return Complex.create(LinearAlgebra.rankByElimination(A, tol));
    };

    /**
     * Condition number through a matrix norm and inverse.
     *
     * @param A Input matrix.
     * @param normType Matrix norm type.
     * @returns `norm(A, p) * norm(inv(A), p)`.
     */
    private static readonly squareMatrixNormCondition = (A: MultiArray, normType: 1 | typeof Infinity | 'fro', functionName = 'cond'): ComplexType => {
        if (A.dimension[0] !== A.dimension[1]) {
            AST.throwInvalidCallError(functionName);
        }
        return Complex.mul(LinearAlgebra.matrixNorm(A, normType), LinearAlgebra.matrixNorm(LinearAlgebra.inv(A), normType));
    };

    /**
     * Matrix norm subset required by condition-number computation.
     *
     * @param matrix Input matrix.
     * @param normType Norm type.
     * @returns Requested matrix norm.
     */
    private static readonly matrixNorm = (matrix: MultiArray, normType: 1 | typeof Infinity | 'fro'): ComplexType => {
        if (normType === 1) {
            let max = 0;
            for (let column = 0; column < matrix.dimension[1]; column++) {
                let sum = 0;
                for (let row = 0; row < matrix.dimension[0]; row++) {
                    sum += Complex.realToNumber(Complex.abs(matrix.array[row][column] as ComplexType));
                }
                max = Math.max(max, sum);
            }
            return Complex.create(max);
        }
        if (normType === Infinity) {
            let max = 0;
            for (let row = 0; row < matrix.dimension[0]; row++) {
                let sum = 0;
                for (let column = 0; column < matrix.dimension[1]; column++) {
                    sum += Complex.realToNumber(Complex.abs(matrix.array[row][column] as ComplexType));
                }
                max = Math.max(max, sum);
            }
            return Complex.create(max);
        }
        let sum = Complex.zero();
        for (const value of MultiArray.linearize(matrix) as ComplexType[]) {
            const abs = Complex.abs(value);
            sum = Complex.add(sum, Complex.mul(abs, abs));
        }
        return Complex.sqrt(sum);
    };

    /**
     * Compute squared singular values through the smaller Gram matrix.
     *
     * @param A Input matrix.
     * @returns Sorted nonnegative squared singular values.
     */
    private static readonly singularValuesSquared = (A: MultiArray): number[] => {
        const rows = A.dimension[0];
        const columns = A.dimension[1];
        const size = Math.min(rows, columns);
        if (size === 0) {
            return [];
        }
        const gram: ComplexType[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => Complex.zero()));
        if (rows >= columns) {
            for (let column = 0; column < columns; column++) {
                for (let otherColumn = column; otherColumn < columns; otherColumn++) {
                    let sum = Complex.zero();
                    for (let row = 0; row < rows; row++) {
                        sum = Complex.add(sum, Complex.mul(Complex.conj(A.array[row][column] as ComplexType), A.array[row][otherColumn] as ComplexType));
                    }
                    gram[column][otherColumn] = sum;
                    gram[otherColumn][column] = column === otherColumn ? sum : Complex.conj(sum);
                }
            }
        } else {
            for (let row = 0; row < rows; row++) {
                for (let otherRow = row; otherRow < rows; otherRow++) {
                    let sum = Complex.zero();
                    for (let column = 0; column < columns; column++) {
                        sum = Complex.add(sum, Complex.mul(A.array[row][column] as ComplexType, Complex.conj(A.array[otherRow][column] as ComplexType)));
                    }
                    gram[row][otherRow] = sum;
                    gram[otherRow][row] = row === otherRow ? sum : Complex.conj(sum);
                }
            }
        }
        const { D } = LAPACK.jacobi_symmetric_hermitian(gram, 1000, 1e-14);
        return D.map((value) => Math.max(0, Complex.realToNumber(value))).sort((left, right) => left - right);
    };

    /**
     * Compute singular values in ascending order.
     *
     * @param A Input matrix.
     * @returns Sorted nonnegative singular values.
     */
    private static readonly singularValues = (A: MultiArray): number[] => LinearAlgebra.singularValuesSquared(A).map((value) => Math.sqrt(value));

    /**
     * Estimate rank by Gaussian elimination with partial pivoting.
     *
     * This uses the MATLAB-compatible tolerance computed by `rank` but avoids
     * deciding exact dependencies through the squared condition of `A' * A`.
     *
     * @param A Input matrix.
     * @param tolerance Pivot tolerance.
     * @returns Estimated rank.
     */
    private static readonly rankByElimination = (A: MultiArray, tolerance: number): number => {
        const work = (A.array as ComplexType[][]).map((row) => row.map((value) => Complex.create(Complex.realToNumber(value), Complex.imagToNumber(value))));
        const rows = A.dimension[0];
        const columns = A.dimension[1];
        let rank = 0;
        for (let column = 0; column < columns && rank < rows; column++) {
            let pivotRow = rank;
            let pivotAbs = Complex.realToNumber(Complex.abs(work[pivotRow][column]));
            for (let row = rank + 1; row < rows; row++) {
                const candidateAbs = Complex.realToNumber(Complex.abs(work[row][column]));
                if (candidateAbs > pivotAbs) {
                    pivotAbs = candidateAbs;
                    pivotRow = row;
                }
            }
            if (pivotAbs <= tolerance) {
                continue;
            }
            if (pivotRow !== rank) {
                const tmp = work[rank];
                work[rank] = work[pivotRow];
                work[pivotRow] = tmp;
            }
            const pivot = work[rank][column];
            for (let row = rank + 1; row < rows; row++) {
                const factor = Complex.rdiv(work[row][column], pivot);
                if (Complex.realIsZero(Complex.abs(factor))) {
                    continue;
                }
                for (let otherColumn = column; otherColumn < columns; otherColumn++) {
                    work[row][otherColumn] = Complex.sub(work[row][otherColumn], Complex.mul(factor, work[rank][otherColumn]));
                }
            }
            rank++;
        }
        return rank;
    };

    /**
     * Extract a dense two-dimensional block from a matrix.
     *
     * @param source Source matrix.
     * @param rowStart First source row.
     * @param columnStart First source column.
     * @param rows Number of rows to copy.
     * @param columns Number of columns to copy.
     * @returns Copied matrix block.
     */
    private static readonly matrixBlock = (source: MultiArray, rowStart: number, columnStart: number, rows: number, columns: number): MultiArray => {
        const result = new MultiArray([rows, columns]);
        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                result.array[row][column] = RuntimeValue.copy(source.array[rowStart + row][columnStart + column]) as ComplexType;
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Solve an upper-triangular square system by back substitution.
     *
     * @param upper Upper-triangular coefficient matrix.
     * @param rightHandSide Right-hand side matrix.
     * @param operatorName Operator used in diagnostics.
     * @returns Solution matrix.
     */
    private static readonly solveUpperTriangular = (upper: MultiArray, rightHandSide: MultiArray, operatorName: '\\' | '/'): MultiArray => {
        const size = upper.dimension[0];
        const columns = rightHandSide.dimension[1];
        const result = new MultiArray([size, columns]);
        for (let column = 0; column < columns; column++) {
            for (let row = size - 1; row >= 0; row--) {
                let value = RuntimeValue.copy(rightHandSide.array[row][column]) as ComplexType;
                for (let inner = row + 1; inner < size; inner++) {
                    value = Complex.sub(value, Complex.mul(upper.array[row][inner] as ComplexType, result.array[inner][column] as ComplexType));
                }
                const diagonal = upper.array[row][row] as ComplexType;
                if (Complex.realIsZero(Complex.abs(diagonal))) {
                    throw new EvalError(`operator ${operatorName}: matrix is singular to working precision.`);
                }
                result.array[row][column] = Complex.rdiv(value, diagonal);
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Solve a lower-triangular square system by forward substitution.
     *
     * @param lower Lower-triangular coefficient matrix.
     * @param rightHandSide Right-hand side matrix.
     * @param operatorName Operator used in diagnostics.
     * @returns Solution matrix.
     */
    private static readonly solveLowerTriangular = (lower: MultiArray, rightHandSide: MultiArray, operatorName: '\\' | '/'): MultiArray => {
        const size = lower.dimension[0];
        const columns = rightHandSide.dimension[1];
        const result = new MultiArray([size, columns]);
        for (let column = 0; column < columns; column++) {
            for (let row = 0; row < size; row++) {
                let value = RuntimeValue.copy(rightHandSide.array[row][column]) as ComplexType;
                for (let inner = 0; inner < row; inner++) {
                    value = Complex.sub(value, Complex.mul(lower.array[row][inner] as ComplexType, result.array[inner][column] as ComplexType));
                }
                const diagonal = lower.array[row][row] as ComplexType;
                if (Complex.realIsZero(Complex.abs(diagonal))) {
                    throw new EvalError(`operator ${operatorName}: matrix is singular to working precision.`);
                }
                result.array[row][column] = Complex.rdiv(value, diagonal);
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Solve a tall rectangular least-squares system through QR factorization.
     *
     * @param A Full-column-rank coefficient matrix with rows >= columns.
     * @param B Right-hand side matrix.
     * @returns Least-squares solution.
     */
    private static readonly tallLeastSquares = (A: MultiArray, B: MultiArray): MultiArray => {
        const rows = A.dimension[0];
        const columns = A.dimension[1];
        const { Q, R } = LinearAlgebra.qrDecomposition(A, 2);
        const projected = LinearAlgebra.multiplyMatrices(LinearAlgebra.ctranspose(Q as MultiArray) as MultiArray, B);
        const reducedRightHandSide = LinearAlgebra.matrixBlock(projected, 0, 0, columns, B.dimension[1]);
        const reducedR = LinearAlgebra.matrixBlock(R, 0, 0, columns, columns);
        return LinearAlgebra.solveUpperTriangular(reducedR, reducedRightHandSide, '\\');
    };

    /**
     * Solve a wide rectangular system through LQ factorization.
     *
     * @param A Full-row-rank coefficient matrix with rows < columns.
     * @param B Right-hand side matrix.
     * @returns Minimum-norm solution.
     */
    private static readonly wideLeastSquares = (A: MultiArray, B: MultiArray): MultiArray => {
        const rows = A.dimension[0];
        const columns = A.dimension[1];
        const { L, taus, phis } = LAPACK.gelq2(MultiArray.copy(A) as MultiArray);
        const Q = LAPACK.orglq(L, taus);
        if (MultiArray.haveAnyComplex(L)) {
            LinearAlgebra.lqPhaseNormalize(phis, L, Q);
        }
        LAPACK.tril_inplace(L);
        const reducedL = LinearAlgebra.matrixBlock(L, 0, 0, rows, rows);
        const leadingSolution = LinearAlgebra.solveLowerTriangular(reducedL, B, '\\');
        const padded = new MultiArray([columns, B.dimension[1]]);
        for (let row = 0; row < columns; row++) {
            for (let column = 0; column < B.dimension[1]; column++) {
                padded.array[row][column] = row < rows ? RuntimeValue.copy(leadingSolution.array[row][column]) : Complex.zero();
            }
        }
        MultiArray.setType(padded);
        return LinearAlgebra.multiplyMatrices(LinearAlgebra.ctranspose(Q) as MultiArray, padded);
    };

    /**
     * Matrix left division wrapper for the language-level `\` operator.
     *
     * This keeps parser/interpreter arithmetic routed through the
     * MATLAB/Octave-facing linear algebra layer while `LAPACK` remains the
     * numerical backend.
     *
     * @param A Coefficient matrix.
     * @param B Right-hand side matrix.
     * @returns Solution matrix `X` for `A * X = B`.
     */
    public static readonly mldivide = (A: MultiArray, B: MultiArray): MultiArray => {
        if (A.dimension.length !== 2 || B.dimension.length !== 2 || A.dimension[0] !== B.dimension[0]) {
            throw new EvalError(`operator \\: nonconformant arguments (op1 is ${LinearAlgebra.formatDimensions(A)}, op2 is ${LinearAlgebra.formatDimensions(B)}).`);
        }
        if (A.dimension[0] !== A.dimension[1]) {
            return A.dimension[0] >= A.dimension[1] ? LinearAlgebra.tallLeastSquares(A, B) : LinearAlgebra.wideLeastSquares(A, B);
        }
        return LAPACK.mldivide(A, B).X;
    };

    /**
     * Matrix right division wrapper for the language-level `/` operator.
     *
     * Implements `A / B` through the MATLAB/Octave identity
     * `((B') \ (A'))'`, routing the actual solve through `mldivide`.
     *
     * @param A Numerator matrix.
     * @param B Denominator matrix.
     * @returns Solution matrix `X` for `X * B = A`.
     */
    public static readonly mrdivide = (A: MultiArray, B: MultiArray): MultiArray => {
        if (A.dimension.length !== 2 || B.dimension.length !== 2 || A.dimension[1] !== B.dimension[1]) {
            throw new EvalError(`operator /: nonconformant arguments (op1 is ${LinearAlgebra.formatDimensions(A)}, op2 is ${LinearAlgebra.formatDimensions(B)}).`);
        }
        return LinearAlgebra.ctranspose(LinearAlgebra.mldivide(LinearAlgebra.ctranspose(B), LinearAlgebra.ctranspose(A)));
    };

    public static readonly gaussSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [
                { name: 'matrix', classes: ['double'], validators: ['squareMatrix'] },
                { name: 'rightHandSide', classes: ['double'] },
            ],
        },
        outputs: { arity: 1 },
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
            m = LinearAlgebra.transpose(m) as MultiArray;
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

    public static readonly dotSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -3,
            min: 2,
            max: 3,
            parameters: [
                { name: 'left', classes: ['double'] },
                { name: 'right', classes: ['double'] },
                { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true },
            ],
        },
        outputs: { arity: 1 },
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

    public static readonly crossSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -3,
            min: 2,
            max: 3,
            parameters: [
                { name: 'left', classes: ['double'] },
                { name: 'right', classes: ['double'] },
                { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true },
            ],
        },
        outputs: { arity: 1 },
    };

    private static readonly dimensionArgumentToNumber = (dim: CrossDimensionArgument): number | undefined => {
        if (typeof dim === 'number') {
            return dim;
        }
        if (MultiArray.isInstanceOf(dim)) {
            const linearized = MultiArray.linearize(dim);
            return linearized.length > 0 ? LinearAlgebra.dimensionArgumentToNumber(linearized[0]) : undefined;
        }
        return Complex.isInstanceOf(dim) ? Complex.realToNumber(dim) : undefined;
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
    public static readonly cross = (A: MultiArray, B: MultiArray, dim?: CrossDimensionArgument): MultiArray => {
        /* Copy original dimension arrays */
        const adimOrig = A.dimension.slice();
        const bdimOrig = B.dimension.slice();
        /* Determine operation dimension (MATLAB: dim is 1-based) */
        let dZero: number | undefined;
        if (typeof dim !== 'undefined') {
            const numericDim = LinearAlgebra.dimensionArgumentToNumber(dim);
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

    public static readonly kronSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [
                { name: 'left', classes: ['double'], validators: ['matrix2d'] },
                { name: 'right', classes: ['double'], validators: ['matrix2d'] },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     *
     * @param A
     * @param B
     * @returns
     */
    public static readonly kron = (A: ElementType, B: ElementType): MultiArray => {
        const MA = MultiArray.scalarToMultiArray(A);
        const MB = MultiArray.scalarToMultiArray(B);
        // Validate input dimensions
        if (!MA || MA.dimension.length < 2 || !MB || MB.dimension.length < 2) {
            throw new Error('kron: inputs must be at least 2-D arrays');
        }
        const m = MA.dimension[0];
        const n = MA.dimension[1];
        const p = MB.dimension[0];
        const q = MB.dimension[1];
        // Create result dimension
        const Cdim = [m * p, n * q];
        const C = new MultiArray(Cdim);
        // Compute Kronecker product
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const aij = MA.array[i][j] as ComplexType;
                for (let i2 = 0; i2 < p; i2++) {
                    for (let j2 = 0; j2 < q; j2++) {
                        const bij = MB.array[i2][j2] as ComplexType;
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

    //     // Sanity checks, symmetric to QR.
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
    //             // And on column k of Q.
    //             for (let i = 0; i < Q.dimension[0]; i++) {
    //                 Q.array[i][k] = Complex.mul(Q.array[i][k] as ComplexType, phiConj);
    //             }
    //         }
    //     }
    // };

    /**
     * Normalize LQ Householder phases in place.
     *
     * `phis` must come from the same LQ factorization that produced `L`.
     * When `Q` is supplied, the inverse phase adjustment is applied there so
     * the product represented by the factorization is preserved.
     *
     * @param phis Phase factors produced during LQ factorization.
     * @param L Lower/trapezoidal factor to normalize.
     * @param Q Optional unitary/orthogonal factor to update consistently.
     */
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

    public static readonly qrSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['matrix2d'] }] },
        outputs: { arity: -3 },
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
        return AST.nodeBoundedReturnList(
            3,
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
     * eigDecomposition - wrapper that performs eigen decomposition using blocked tridiagonalization.
     *
     * Returns object depending on `result`:
     *  1 -> { values: MultiArray }                          (column vector n x 1)
     *  2 -> { values: MultiArray, vectors: MultiArray } (vector columns are eigenvectors)
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

    /**
     * Compute a Hermitian/symmetric eigenvalue decomposition.
     *
     * The `result` selector mirrors MATLAB/Octave output arity: `1` computes
     * eigenvalues only, `2` computes eigenvectors and eigenvalues, and `3` also
     * exposes the tridiagonal intermediate matrix for diagnostics.
     *
     * @param A Square Hermitian/symmetric input matrix.
     * @param result Requested output shape.
     * @param order Eigenvalue ordering policy.
     * @param blockSize Optional block size for blocked tridiagonalization.
     * @returns Decomposition result with fields determined by `result`.
     */
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

    public static readonly eigSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: -3 },
    };
    /**
     * MATLAB/Octave-style wrapper for `eig`.
     *
     * The returned `NodeReturnList` delays the actual decomposition until the
     * caller asks for a specific number of outputs. One output returns the
     * eigenvalues, two outputs return `[V, D]`, and three outputs return
     * `[V, D, T]` where `T` is the tridiagonal intermediate used for
     * diagnostics.
     */
    public static eig = (M: MultiArray): NodeReturnList => {
        return AST.nodeBoundedReturnList(
            3,
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
                        return evaluated.T; // Tridiagonal value for debugging and inspection.
                    }
                }
                // Invalid indexes return undefined by the NodeReturnList convention.
                return undefined;
            },
            (length: number): ReturnHandlerResult => {
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

    public static readonly testSignature: BuiltInFunctionSignature = {
        inputs: { arity: 1, parameters: [{ name: 'matrix', classes: ['double'], validators: ['squareMatrix'] }] },
        outputs: { arity: -3 },
    };
    /**
     * Small return-list fixture used by tests of multiple-output plumbing.
     *
     * The argument is intentionally unused; it keeps the signature parallel to
     * runtime helpers that receive a matrix before building a lazy return list.
     *
     * @param A Matrix argument kept for call-shape compatibility.
     * @returns A lazy return list with deterministic placeholder values.
     */
    public static test(A: MultiArray) {
        return AST.nodeBoundedReturnList(
            3,
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
                // Invalid indexes return undefined by the NodeReturnList convention.
                return undefined;
            },
            (length: number): ReturnHandlerResult => {
                return { length };
            },
        );
    }

    /**
     * LinearAlgebra functions.
     */
    public static readonly functions: { [F in keyof LinearAlgebra | string]: FunctionSignatureEntry } = {
        eye: { func: LinearAlgebra.eye, signature: LinearAlgebra.eyeSignature },
        transpose: { func: LinearAlgebra.transpose, signature: LinearAlgebra.transposeSignature },
        ctranspose: { func: LinearAlgebra.ctranspose, signature: LinearAlgebra.ctransposeSignature },
        pagetranspose: { func: LinearAlgebra.pagetranspose, signature: LinearAlgebra.pagetransposeSignature },
        pagectranspose: { func: LinearAlgebra.pagectranspose, signature: LinearAlgebra.pagectransposeSignature },
        pagemtimes: { func: LinearAlgebra.pagemtimes, signature: LinearAlgebra.pagemtimesSignature },
        pageinv: { func: LinearAlgebra.pageinv, signature: LinearAlgebra.pageinvSignature },
        pagemldivide: { func: LinearAlgebra.pagemldivide, signature: LinearAlgebra.pagemldivideSignature },
        pagemrdivide: { func: LinearAlgebra.pagemrdivide, signature: LinearAlgebra.pagemrdivideSignature },
        diag: { func: LinearAlgebra.diag, signature: LinearAlgebra.diagSignature },
        trace: { func: LinearAlgebra.trace, signature: LinearAlgebra.traceSignature },
        det: { func: LinearAlgebra.det, signature: LinearAlgebra.detSignature },
        inv: { func: LinearAlgebra.inv, signature: LinearAlgebra.invSignature },
        cond: { func: LinearAlgebra.cond, signature: LinearAlgebra.condSignature },
        rcond: { func: LinearAlgebra.rcond, signature: LinearAlgebra.rcondSignature },
        rank: { func: LinearAlgebra.rank, signature: LinearAlgebra.rankSignature },
        gauss: { func: LinearAlgebra.gauss, signature: LinearAlgebra.gaussSignature },
        lu: { func: LinearAlgebra.lu, signature: LinearAlgebra.luSignature },
        dot: { func: LinearAlgebra.dot, signature: LinearAlgebra.dotSignature },
        cross: { func: LinearAlgebra.cross, signature: LinearAlgebra.crossSignature },
        kron: { func: LinearAlgebra.kron, signature: LinearAlgebra.kronSignature },
        qr: { func: LinearAlgebra.qr, signature: LinearAlgebra.qrSignature },
        eig: { func: LinearAlgebra.eig, signature: LinearAlgebra.eigSignature },
        test: { func: LinearAlgebra.test, signature: LinearAlgebra.testSignature },
    };
}

export { LinearAlgebra };
export default { LinearAlgebra };
