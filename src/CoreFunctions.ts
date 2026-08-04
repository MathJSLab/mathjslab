import { CharString } from './CharString';
import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Structure, type StructureFieldValue } from './Structure';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { ClassEnumerationValue } from './ClassEnumerationValue';
import { ClassEventListener } from './ClassEventListener';
import { ClassMetaClass, ClassMetaObject } from './ClassMeta';
import { type BuiltInFunctionSignature, type NodeReturnList, AST, type FunctionSignatureEntry, ReturnHandlerResult } from './AST';
import { FunctionValidation } from './FunctionValidation';
import { optionalRuntimeExpressionValue, runtimeExpressionValue } from './ExpressionValue';
import { RuntimeEquality } from './RuntimeEquality';
import { RuntimeValue } from './RuntimeValue';
import { LAPACK } from './LAPACK';

/**
 * Core MATLAB/Octave built-ins that are independent of heavy numerical
 * algorithms.
 *
 * This module owns shape predicates, type predicates, structure/object
 * introspection helpers, concatenation guards, and other functions that the
 * interpreter should register before optional linear-algebra functionality.
 * Each public built-in has adjacent signature metadata so call validation and
 * implementation stay synchronized.
 */
abstract class CoreFunctions {
    /**
     * Reject cell arrays for built-ins that only accept ordinary arrays.
     *
     * @param name Built-in name used in diagnostics.
     * @param M Candidate value.
     * @throws Error when `M` is a cell array.
     */
    public static readonly throwErrorIfCellArray = (name: string, M: MultiArray | ComplexType): void => {
        if (MultiArray.isInstanceOf(M) && M.isCell) {
            throw new Error(`${name}: wrong type argument 'cell'`);
        }
    };

    /**
     * Extract class instances from a scalar or array value.
     *
     * @param value Runtime value to inspect.
     * @returns Class instances in linear order.
     */
    private static readonly classInstancesIn = (value: ElementType): ClassInstance[] => MultiArray.linearize(MultiArray.scalarToMultiArray(value)).filter(ClassInstance.isInstanceOf);

    /**
     * Enforce homogeneous object-array concatenation.
     *
     * MATLAB object arrays are homogeneous. This guard rejects concatenations
     * that would mix unrelated class definitions before the array is built.
     *
     * @param name Built-in/operator name used in diagnostics.
     * @param values Values that will be concatenated.
     * @throws Error when object instances have different classes.
     */
    private static readonly validateObjectArrayConcatenation = (name: string, values: ElementType[]): void => {
        let classDefinition: ClassDefinition | undefined;
        for (const instance of values.flatMap((value) => CoreFunctions.classInstancesIn(value))) {
            if (!classDefinition) {
                classDefinition = instance.classDefinition;
            } else if (instance.classDefinition !== classDefinition) {
                throw new Error(`${name}: object arrays must contain objects of the same class.`);
            }
        }
    };

    /** Signature metadata for `isempty`. */
    public static readonly isemptySignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Test whether a value is empty.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isempty = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isempty', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isEmpty(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isscalar`. */
    public static readonly isscalarSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Return true if X is a scalar.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isscalar = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isscalar', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isScalar(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `ismatrix`. */
    public static readonly ismatrixSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a 2-D array.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly ismatrix = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ismatrix', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isMatrix(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isvector`. */
    public static readonly isvectorSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a vector.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isvector = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isvector', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isVector(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `iscell`. */
    public static readonly iscellSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a cell array object.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly iscell = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('iscell', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isCellArray(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `issparse`. */
    public static readonly issparseSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return whether a value uses sparse storage.
     *
     * MathJSLab intentionally keeps array storage dense for browser/runtime
     * efficiency. Sparse-related APIs are compatibility facades, so current
     * runtime values are never sparse.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical false for every currently representable value.
     */
    public static readonly issparse = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('issparse', !(typeof X !== 'undefined' && rest.length === 0));
        return Complex.false();
    };

    /** Signature metadata for `full`. */
    public static readonly fullSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Convert a sparse value to dense storage.
     *
     * Since runtime storage is already dense, this returns a value copy.
     *
     * @param X Value to materialize densely.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Dense copy of `X`.
     */
    public static readonly full = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('full', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.copy(X);
    };

    /**
     * Test whether an element contributes to sparse/nonzero APIs.
     *
     * @param value Candidate runtime element.
     * @returns `true` when the element is nonzero or nonempty text/object data.
     */
    public static readonly isNonzeroElement = (value: ElementType): boolean => {
        if (Complex.isInstanceOf(value)) {
            return Complex.realToNumber(value) !== 0 || Complex.imagToNumber(value) !== 0;
        }
        if (CharString.isInstanceOf(value)) {
            return value.str.length > 0 && value.str.split('').some((char) => char.charCodeAt(0) !== 0);
        }
        if (MultiArray.isInstanceOf(value)) {
            return MultiArray.linearize(value).some(CoreFunctions.isNonzeroElement);
        }
        return value !== null && typeof value !== 'undefined';
    };

    /** Signature metadata for `nnz`. */
    public static readonly nnzSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Count nonzero elements in a dense-compatible value.
     *
     * @param X Value to inspect.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Number of nonzero elements.
     */
    public static readonly nnz = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('nnz', !(typeof X !== 'undefined' && rest.length === 0));
        return Complex.create(MultiArray.linearize(MultiArray.scalarToMultiArray(X)).filter(CoreFunctions.isNonzeroElement).length);
    };

    /** Signature metadata for `nzmax`. */
    public static readonly nzmaxSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return sparse allocation capacity for compatibility.
     *
     * Without sparse storage, allocated sparse capacity is represented by the
     * number of nonzero dense elements.
     *
     * @param X Value to inspect.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Dense-compatible nonzero capacity.
     */
    public static readonly nzmax = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('nzmax', !(typeof X !== 'undefined' && rest.length === 0));
        return CoreFunctions.nnz(X);
    };

    /** Signature metadata for `nonzeros`. */
    public static readonly nonzerosSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return nonzero values as a column vector.
     *
     * @param X Value to inspect.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Column vector of nonzero elements.
     */
    public static readonly nonzeros = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('nonzeros', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.MultiArrayToScalar(MultiArray.toColumnVector(MultiArray.linearize(MultiArray.scalarToMultiArray(X)).filter(CoreFunctions.isNonzeroElement).map(RuntimeValue.copy)));
    };

    /**
     * Extract one nonnegative integer dimension from a scalar argument.
     *
     * @param value Candidate dimension value.
     * @param name Function name used in diagnostics.
     * @param index One-based argument index.
     * @returns Integer dimension.
     */
    private static readonly sparseDimension = (value: ElementType, name: string, index: number): number => {
        const scalar = MultiArray.MultiArrayToScalar(value);
        if (!Complex.isInstanceOf(scalar) || !Complex.imagIsZero(scalar) || !Complex.realIsInteger(scalar) || Complex.realToNumber(scalar) < 0) {
            throw new Error(`${name}: argument ${index} must be a nonnegative integer scalar.`);
        }
        return Complex.realToNumber(scalar);
    };

    /**
     * Expand scalar/vector sparse constructor inputs to a common triplet count.
     *
     * @param value Subscript or value input.
     * @param count Common triplet count.
     * @param name Function name used in diagnostics.
     * @param index One-based argument index.
     * @returns Linearized values expanded to `count`.
     */
    private static readonly sparseTripletValues = (value: ElementType, count: number, name: string, index: number): ElementType[] => {
        const values = MultiArray.linearize(MultiArray.scalarToMultiArray(value));
        if (values.length === count) {
            return values.map(RuntimeValue.copy);
        }
        if (values.length === 1) {
            return new Array(count).fill(undefined).map(() => RuntimeValue.copy(values[0]));
        }
        throw new Error(`${name}: argument ${index} must be scalar or match the sparse triplet count.`);
    };

    /**
     * Extract sparse constructor subscripts.
     *
     * @param value Subscript scalar or vector.
     * @param count Common triplet count.
     * @param name Function name used in diagnostics.
     * @param index One-based argument index.
     * @returns One-based positive integer subscripts.
     */
    private static readonly sparseSubscripts = (value: ElementType, count: number, name: string, index: number): number[] =>
        CoreFunctions.sparseTripletValues(value, count, name, index).map((item) => {
            if (!Complex.isInstanceOf(item) || !Complex.imagIsZero(item) || !Complex.realIsInteger(item) || Complex.realToNumber(item) < 1) {
                throw new Error(`${name}: argument ${index} must contain positive integer subscripts.`);
            }
            return Complex.realToNumber(item);
        });

    /** Signature metadata for `sparse`. */
    public static readonly sparseSignature: BuiltInFunctionSignature = {
        inputs: { arity: -6, min: 1, max: 6, parameters: [{ name: 'value', variadic: true }] },
        outputs: { arity: 1 },
    };
    /**
     * Sparse constructor compatibility facade.
     *
     * The returned value is a dense matrix equivalent to the sparse matrix that
     * MATLAB/Octave would construct for supported forms.
     *
     * @param args Sparse constructor arguments.
     * @returns Dense equivalent of the requested sparse matrix.
     */
    public static readonly sparse = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('sparse', args.length < 1 || args.length > 6);
        if (args.length === 1) {
            return RuntimeValue.copy(args[0]);
        }
        if (args.length === 2) {
            return new MultiArray([CoreFunctions.sparseDimension(args[0], 'sparse', 1), CoreFunctions.sparseDimension(args[1], 'sparse', 2)], Complex.zero());
        }
        const count = Math.max(...args.slice(0, 3).map((arg) => MultiArray.linearize(MultiArray.scalarToMultiArray(arg)).length));
        const rows = CoreFunctions.sparseSubscripts(args[0], count, 'sparse', 1);
        const columns = CoreFunctions.sparseSubscripts(args[1], count, 'sparse', 2);
        const values = CoreFunctions.sparseTripletValues(args[2], count, 'sparse', 3);
        const rowCount = args.length >= 5 ? CoreFunctions.sparseDimension(args[3], 'sparse', 4) : rows.reduce((max, row) => Math.max(max, row), 0);
        const columnCount = args.length >= 5 ? CoreFunctions.sparseDimension(args[4], 'sparse', 5) : columns.reduce((max, column) => Math.max(max, column), 0);
        if (args.length === 6 && CharString.isInstanceOf(args[5]) && !['sum', 'unique'].includes(args[5].str)) {
            throw new Error("sparse: option must be 'sum' or 'unique'.");
        }
        const unique = args.length === 6 && CharString.isInstanceOf(args[5]) && args[5].str === 'unique';
        const result = new MultiArray([rowCount, columnCount], Complex.zero());
        for (let k = 0; k < count; k++) {
            if (rows[k] > rowCount || columns[k] > columnCount) {
                throw new Error('sparse: subscript indices out of range.');
            }
            const row = rows[k] - 1;
            const column = columns[k] - 1;
            const value = values[k];
            const current = result.array[row][column];
            result.array[row][column] = !unique && Complex.isInstanceOf(current) && Complex.isInstanceOf(value) ? Complex.add(current, value) : RuntimeValue.copy(value);
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    };

    /** Signature metadata for `spalloc`. */
    public static readonly spallocSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 3,
                parameters: [
                    { name: 'm', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'n', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'nz', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                ],
            },
            {
                arity: 4,
                parameters: [
                    { name: 'm', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'n', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'nz', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'typename', classes: ['char', 'string'], allowedStrings: ['double', 'single', 'logical'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Allocate a sparse-compatible all-zero matrix over dense storage.
     *
     * MathJSLab does not allocate sparse backing storage. The `nz` capacity is
     * validated for MATLAB/Octave API compatibility and intentionally ignored.
     *
     * @param m Number of rows.
     * @param n Number of columns.
     * @param nz Requested sparse nonzero capacity.
     * @param typename Optional sparse storage class name.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Dense all-zero matrix with the requested shape.
     */
    public static readonly spalloc = (m?: ElementType, n?: ElementType, nz?: ElementType, typename?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('spalloc', !(typeof m !== 'undefined' && typeof n !== 'undefined' && typeof nz !== 'undefined' && rest.length === 0));
        const rows = CoreFunctions.sparseDimension(m, 'spalloc', 1);
        const columns = CoreFunctions.sparseDimension(n, 'spalloc', 2);
        CoreFunctions.sparseDimension(nz, 'spalloc', 3);
        if (typeof typename !== 'undefined' && (!CharString.isInstanceOf(typename) || !['double', 'single', 'logical'].includes(typename.str))) {
            throw new Error("spalloc: typename must be 'double', 'single', or 'logical'.");
        }
        const zero = CharString.isInstanceOf(typename) && typename.str === 'logical' ? Complex.false() : Complex.zero();
        return MultiArray.MultiArrayToScalar(new MultiArray([rows, columns], zero));
    };

    /** Signature metadata for `isrow`. */
    public static readonly isrowSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a row vector.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isrow = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isrow', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isRowVector(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `iscolumn`. */
    public static readonly iscolumnSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a column vector.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly iscolumn = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('iscolumn', !(typeof X !== 'undefined' && rest.length === 0));
        return RuntimeValue.isColumnVector(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isstruct`. */
    public static readonly isstructSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is a structure scalar or structure array.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isstruct = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isstruct', !(typeof X !== 'undefined' && rest.length === 0));
        return Structure.isStructure(X) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `ischar`. */
    public static readonly ischarSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly ischar = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ischar', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        return value && FunctionValidation.matchesClass(value, 'char') ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isstring`. */
    public static readonly isstringSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly isstring = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isstring', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        return value && FunctionValidation.matchesClass(value, 'string') ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `iscellstr`. */
    public static readonly iscellstrSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Test whether a value is a cell array of character vectors.
     *
     * Empty cell arrays are accepted, matching MATLAB/Octave's structural
     * interpretation of cellstr arrays.
     */
    public static readonly iscellstr = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('iscellstr', !(typeof X !== 'undefined' && rest.length === 0));
        return CoreFunctions.cellStringElements(X).accepted ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `cellstr`. */
    public static readonly cellstrSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Convert char arrays and string arrays to cell arrays of character
     * vectors.
     */
    public static readonly cellstr = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('cellstr', !(typeof X !== 'undefined' && rest.length === 0));
        if (CharString.isInstanceOf(X)) {
            const result = MultiArray.toColumnVector([new CharString(X.str, "'")]);
            result.isCell = true;
            return result;
        }
        if (MultiArray.isInstanceOf(X) && X.isCell) {
            if (!CoreFunctions.cellStringElements(X).accepted) {
                throw new EvalError('cellstr: C must be a cell array of character vectors.');
            }
            return RuntimeValue.copy(X) as MultiArray;
        }
        if (MultiArray.isInstanceOf(X) && !X.isCell) {
            if (MultiArray.linearLength(X) === 0) {
                return MultiArray.emptyArray(true);
            }
            const elements = MultiArray.linearize(X);
            if (elements.every(CharString.isString)) {
                const result = MultiArray.rawMap(X, (value: ElementType) => new CharString((value as CharString).str, "'"));
                result.isCell = true;
                return result;
            }
            if (X.dimension.length === 2 && elements.every(CharString.isChar)) {
                const result = MultiArray.toColumnVector(
                    X.array.map(
                        (row) =>
                            new CharString(
                                row
                                    .map((value) => (value as CharString).str)
                                    .join('')
                                    .trimEnd(),
                                "'",
                            ),
                    ),
                );
                result.isCell = true;
                return result;
            }
        }
        throw new EvalError('cellstr: input must be a string, character array, or cell array of character vectors.');
    };

    /** Signature metadata for `char`. */
    public static readonly charSignature: BuiltInFunctionSignature = {
        inputs: { arity: -1, min: 1, parameters: [{ name: 'value', variadic: true }] },
        outputs: { arity: 1 },
    };

    /**
     * Convert numeric arrays and character values to MATLAB-style character
     * arrays.
     *
     * @param args Values to convert and stack as rows.
     * @returns Character vector or character array.
     */
    public static readonly char = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('char', args.length === 0);
        const rows = args.flatMap((arg) => CoreFunctions.charRows(arg));
        if (rows.length === 0) {
            return MultiArray.emptyArray();
        }
        if (rows.length === 1) {
            return CharString.fromCharacterScalars(rows[0]);
        }
        const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
        const result = new MultiArray([rows.length, width]);
        for (let i = 0; i < rows.length; i++) {
            const quote = rows[i][0]?.quote ?? "'";
            for (let j = 0; j < width; j++) {
                result.array[i][j] = rows[i][j] ?? CharString.create(' ', quote);
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Convert a scalar array element to a character scalar for `char`.
     *
     * @param value Element to convert.
     * @param quote Quote style to preserve.
     * @returns Character scalar.
     */
    private static readonly charElement = (value: ElementType, quote: CharString['quote'] = "'"): CharString => {
        if (CharString.isInstanceOf(value)) {
            return value;
        }
        if (Complex.isInstanceOf(value)) {
            if (Complex.imagToNumber(value) !== 0) {
                throw new Error('char: numeric character codes must be real.');
            }
            return CharString.fromNumericCode(Complex.realToNumber(value), quote);
        }
        throw new Error('char: invalid conversion input.');
    };

    /**
     * Convert a runtime value into character rows.
     *
     * @param value Value accepted by `char`.
     * @returns Character rows.
     */
    private static readonly charRows = (value: ElementType): CharString[][] => {
        if (CharString.isInstanceOf(value)) {
            return [value.toCharacterScalars()];
        }
        if (Complex.isInstanceOf(value)) {
            return [[CoreFunctions.charElement(value)]];
        }
        if (MultiArray.isInstanceOf(value) && !value.isCell && value.dimension.length === 2) {
            return value.array.map((row) => row.map((element) => CoreFunctions.charElement(element)));
        }
        const cellStringElements = CoreFunctions.cellStringElements(value);
        if (cellStringElements.accepted) {
            return cellStringElements.values.map((text) => text.toCharacterScalars());
        }
        throw new Error('char: invalid conversion input.');
    };

    /**
     * Extract cellstr contents if the value is a cell array of char vectors.
     */
    private static readonly cellStringElements = (value: ElementType): { accepted: boolean; values: CharString[] } => {
        if (!MultiArray.isInstanceOf(value) || !value.isCell) {
            return { accepted: false, values: [] };
        }
        const values = MultiArray.linearize(value);
        return values.every(CharString.isChar) ? { accepted: true, values } : { accepted: false, values: [] };
    };

    /** Signature metadata for `double`. */
    public static readonly doubleSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Convert numeric/logical and character values to double-precision values.
     *
     * @param X Value to convert.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Numeric scalar or array.
     */
    public static readonly double = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('double', !(typeof X !== 'undefined' && rest.length === 0));
        if (CharString.isInstanceOf(X)) {
            return MultiArray.fromCharString(X);
        }
        if (Complex.isInstanceOf(X)) {
            return CoreFunctions.doubleElement(X);
        }
        if (MultiArray.isInstanceOf(X) && !X.isCell) {
            const result = new MultiArray(X.dimension);
            result.array = X.array.map((row) => row.map((element) => CoreFunctions.doubleElement(element)));
            result.type = MultiArray.linearLength(result) === 0 ? Complex.REAL : result.type;
            if (MultiArray.linearLength(result) > 0) {
                MultiArray.setType(result);
            }
            return MultiArray.MultiArrayToScalar(result);
        }
        throw new Error('double: invalid conversion input.');
    };

    /**
     * Convert a scalar value accepted by `double`.
     *
     * @param value Scalar runtime value.
     * @returns Numeric scalar.
     */
    private static readonly doubleElement = (value: ElementType): ComplexType => {
        if (Complex.isInstanceOf(value)) {
            return Complex.create(Complex.realToNumber(value), Complex.imagToNumber(value));
        }
        if (CharString.isInstanceOf(value) && value.length === 1) {
            return Complex.create(value.str.charCodeAt(0));
        }
        throw new Error('double: invalid conversion input.');
    };

    /** Signature metadata for `logical`. */
    public static readonly logicalSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Convert numeric/logical and character values to logical values.
     *
     * @param X Value to convert.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar or array.
     */
    public static readonly logical = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('logical', !(typeof X !== 'undefined' && rest.length === 0));
        if (CharString.isInstanceOf(X)) {
            return CoreFunctions.logical(MultiArray.fromCharString(X));
        }
        if (Complex.isInstanceOf(X)) {
            return CoreFunctions.logicalElement(X);
        }
        if (MultiArray.isInstanceOf(X) && !X.isCell) {
            const result = new MultiArray(X.dimension);
            result.array = X.array.map((row) => row.map((element) => CoreFunctions.logicalElement(element)));
            result.type = Complex.LOGICAL;
            if (MultiArray.linearLength(result) > 0) {
                MultiArray.setType(result);
            }
            return MultiArray.MultiArrayToScalar(result);
        }
        throw new Error('logical: invalid conversion input.');
    };

    /**
     * Convert a scalar value accepted by `logical`.
     *
     * @param value Scalar runtime value.
     * @returns Logical scalar.
     */
    private static readonly logicalElement = (value: ElementType): ComplexType => {
        if (Complex.isInstanceOf(value)) {
            if (!Complex.imagIsZero(value) || Complex.realIsNaN(value)) {
                throw new Error('logical: complex and NaN values cannot be converted to logical.');
            }
            return Complex.realIsZero(value) ? Complex.false() : Complex.true();
        }
        if (CharString.isInstanceOf(value) && value.length === 1) {
            return value.str.charCodeAt(0) === 0 ? Complex.false() : Complex.true();
        }
        throw new Error('logical: invalid conversion input.');
    };

    /**
     * Apply a numeric classification predicate to scalars, arrays, and text.
     *
     * @param name Built-in name used for diagnostics.
     * @param X Value to classify.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @param predicate Scalar predicate.
     * @returns Logical scalar or array.
     */
    private static readonly numericClassification = (
        name: 'isnan' | 'isinf' | 'isfinite',
        X: ElementType | undefined,
        rest: unknown[],
        predicate: (value: ComplexType) => boolean,
    ): ElementType => {
        AST.throwInvalidCallError(name, !(typeof X !== 'undefined' && rest.length === 0));
        if (CharString.isInstanceOf(X)) {
            return CoreFunctions.numericClassification(name, MultiArray.fromCharString(X), [], predicate);
        }
        if (Complex.isInstanceOf(X)) {
            return predicate(X) ? Complex.true() : Complex.false();
        }
        if (MultiArray.isInstanceOf(X) && !X.isCell) {
            const result = new MultiArray(X.dimension);
            result.array = X.array.map((row) => row.map((element) => (predicate(CoreFunctions.numericClassificationElement(name, element)) ? Complex.true() : Complex.false())));
            result.type = Complex.LOGICAL;
            return MultiArray.MultiArrayToScalar(result);
        }
        throw new Error(`${name}: invalid conversion input.`);
    };

    /**
     * Convert an accepted scalar element for numeric classification.
     *
     * @param name Built-in name used for diagnostics.
     * @param value Scalar value to classify.
     * @returns Numeric scalar.
     */
    private static readonly numericClassificationElement = (name: string, value: ElementType): ComplexType => {
        if (Complex.isInstanceOf(value)) {
            return value;
        }
        if (CharString.isInstanceOf(value) && value.length === 1) {
            return Complex.create(value.str.charCodeAt(0));
        }
        throw new Error(`${name}: invalid conversion input.`);
    };

    /** Signature metadata for `isnan`. */
    public static readonly isnanSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Test for NaN values.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar or array.
     */
    public static readonly isnan = (X?: ElementType, ...rest: unknown[]): ElementType =>
        CoreFunctions.numericClassification('isnan', X, rest, (value) => Complex.realIsNaN(value) || Complex.imagIsNaN(value));

    /** Signature metadata for `isinf`. */
    public static readonly isinfSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Test for infinite values.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar or array.
     */
    public static readonly isinf = (X?: ElementType, ...rest: unknown[]): ElementType =>
        CoreFunctions.numericClassification(
            'isinf',
            X,
            rest,
            (value) => (!Complex.realIsFinite(value) && !Complex.realIsNaN(value)) || (!Complex.imagIsFinite(value) && !Complex.imagIsNaN(value)),
        );

    /** Signature metadata for `isfinite`. */
    public static readonly isfiniteSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Test for finite values.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar or array.
     */
    public static readonly isfinite = (X?: ElementType, ...rest: unknown[]): ElementType =>
        CoreFunctions.numericClassification('isfinite', X, rest, (value) => Complex.realIsFinite(value) && Complex.imagIsFinite(value));

    /** Signature metadata for `isfloat`. */
    public static readonly isfloatSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Return true if X is a floating-point array.
     *
     * The current numeric runtime represents floating-point numeric values as
     * `double`; logical values are deliberately excluded.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isfloat = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isfloat', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        return value && FunctionValidation.numericElements(value) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isinteger`. */
    public static readonly isintegerSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };

    /**
     * Return true if X is an integer-typed array.
     *
     * Integer storage classes are not represented yet, so double values that
     * happen to have integer-valued contents correctly return false.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical false for the currently supported value model.
     */
    public static readonly isinteger = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isinteger', !(typeof X !== 'undefined' && rest.length === 0));
        return Complex.false();
    };

    /** Signature metadata for `isnumeric`. */
    public static readonly isnumericSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly isnumeric = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isnumeric', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        return value && FunctionValidation.numericElements(value) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `islogical`. */
    public static readonly islogicalSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly islogical = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('islogical', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        return value && FunctionValidation.isLogicalValue(value) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isreal`. */
    public static readonly isrealSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly isreal = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isreal', !(typeof X !== 'undefined' && rest.length === 0));
        const value = optionalRuntimeExpressionValue(X);
        const elements = value ? FunctionValidation.numericElements(value, { includeLogical: true }) : undefined;
        return elements && elements.every((item) => Complex.imagIsZero(item)) ? Complex.true() : Complex.false();
    };

    /** Signature metadata for `isvalid`. */
    public static readonly isvalidSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'handle' }] }, outputs: { arity: 1 } };
    /**
     * Return true for valid handle class instances.
     *
     * @param X Handle object, listener, or array.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar or logical array.
     */
    public static readonly isvalid = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('isvalid', !(typeof X !== 'undefined' && rest.length === 0));
        const isValidHandle = (value: ElementType): ComplexType => {
            if (ClassEventListener.isInstanceOf(value)) {
                return ClassEventListener.isValid(value) ? Complex.true() : Complex.false();
            }
            if (!ClassInstance.isInstanceOf(value) || !value.classDefinition.isHandleClass()) {
                throw new EvalError('isvalid: H must be a handle object.');
            }
            return ClassInstance.isValid(value) ? Complex.true() : Complex.false();
        };
        return MultiArray.isInstanceOf(X) ? MultiArray.MultiArrayToScalar(MultiArray.rawMap(X, isValidHandle)) : isValidHandle(X);
    };

    /** Signature metadata for `isobject`. */
    public static readonly isobjectSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return true if X is an object or object array.
     *
     * @param X Value to test.
     * @param rest Extra arguments, rejected for MATLAB-compatible arity.
     * @returns Logical scalar.
     */
    public static readonly isobject = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isobject', !(typeof X !== 'undefined' && rest.length === 0));
        const isObjectValue = (value: ElementType): boolean => ClassInstance.isInstanceOf(value) || ClassEnumerationValue.isInstanceOf(value) || ClassMetaObject.isInstanceOf(value);
        if (MultiArray.isInstanceOf(X)) {
            const elements = MultiArray.linearize(X);
            return !X.isCell && elements.length > 0 && elements.every(isObjectValue) ? Complex.true() : Complex.false();
        }
        return isObjectValue(X) ? Complex.true() : Complex.false();
    };

    /**
     * Resolve class metadata from class definitions, instances, enumeration
     * values, meta.class objects, or arrays containing those values.
     *
     * @param value Value supplied to an introspection built-in.
     * @param name Built-in name used in diagnostics.
     * @returns Class metadata.
     * @throws EvalError when the value is not class-related.
     */
    private static readonly classDefinitionFromValue = (value: ElementType, name: string): ClassDefinition => {
        if (ClassDefinition.isInstanceOf(value)) {
            return value;
        }
        if (ClassMetaClass.isInstanceOf(value)) {
            return value.definition;
        }
        if (ClassInstance.isInstanceOf(value) || ClassEnumerationValue.isInstanceOf(value)) {
            return value.classDefinition;
        }
        if (MultiArray.isInstanceOf(value) && !value.isCell) {
            const definitionFor = (item: ElementType): ClassDefinition | undefined => {
                if (ClassMetaClass.isInstanceOf(item)) {
                    return item.definition;
                }
                if (ClassInstance.isInstanceOf(item) || ClassEnumerationValue.isInstanceOf(item)) {
                    return item.classDefinition;
                }
                return undefined;
            };
            const definitions = MultiArray.linearize(value).map(definitionFor);
            if (definitions.length > 0 && definitions.every((definition): definition is ClassDefinition => typeof definition !== 'undefined')) {
                const first = definitions[0];
                if (definitions.every((definition) => definition === first)) {
                    return first;
                }
            }
        }
        throw new EvalError(`${name}: input must be a class object.`);
    };

    /**
     * Build a MATLAB-like cell column vector of strings.
     *
     * @param names Names to wrap.
     * @returns Cell column vector.
     */
    private static readonly stringCellColumn = (names: string[]): MultiArray => {
        const result = MultiArray.toColumnVector(names.map((name) => CharString.create(name)));
        result.isCell = true;
        return result;
    };

    /**
     * Return sorted member names accepted by a user-facing introspection
     * predicate.
     *
     * MATLAB listing functions expose public, non-hidden class members instead
     * of raw metadata lists.
     *
     * @param members Member metadata list.
     * @param predicate Compatibility predicate for the listing function.
     * @returns Sorted visible names.
     */
    private static readonly listedNames = <T extends { name: string }>(members: T[], predicate: (member: T) => boolean): string[] => {
        const names = new Set<string>();
        for (const member of members) {
            if (predicate(member)) {
                names.add(member.name);
            }
        }
        return [...names].sort();
    };

    public static readonly propertiesSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } };
    public static readonly properties = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('properties', !(typeof X !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'properties');
        return CoreFunctions.stringCellColumn(CoreFunctions.listedNames(definition.allProperties(), (property) => !property.isHidden && property.getAccess === 'public'));
    };

    public static readonly fieldnamesSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    public static readonly fieldnames = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('fieldnames', !(typeof X !== 'undefined' && rest.length === 0));
        if (Structure.isStructure(X)) {
            return CoreFunctions.stringCellColumn(Structure.fieldNames(X));
        }
        const definition = CoreFunctions.classDefinitionFromValue(X, 'fieldnames');
        return CoreFunctions.stringCellColumn(CoreFunctions.listedNames(definition.allProperties(), (property) => !property.isHidden && property.getAccess === 'public'));
    };

    public static readonly isfieldSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [{ name: 'structure' }, { name: 'fieldName' }],
        },
        outputs: { arity: 1 },
    };
    public static readonly isfield = (X?: ElementType, fieldName?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('isfield', !(typeof X !== 'undefined' && typeof fieldName !== 'undefined' && rest.length === 0));
        const isStructure = Structure.isStructure(X);
        const hasField = (name: ElementType): ComplexType => {
            if (!CharString.isInstanceOf(name)) {
                if (!isStructure) {
                    return Complex.false();
                }
                throw new EvalError('isfield: FIELD must be a string or cell array of strings.');
            }
            return Structure.hasField(X, name.str) ? Complex.true() : Complex.false();
        };
        if (MultiArray.isInstanceOf(fieldName)) {
            if (!fieldName.isCell) {
                if (!isStructure) {
                    return Complex.false();
                }
                throw new EvalError('isfield: FIELD must be a string or cell array of strings.');
            }
            const result = MultiArray.rawMap(fieldName, hasField);
            MultiArray.setType(result);
            return MultiArray.MultiArrayToScalar(result);
        }
        return hasField(fieldName);
    };

    /** Signature metadata for `numfields`. */
    public static readonly numfieldsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'structure' }] }, outputs: { arity: 1 } };

    /** Count fields in a structure scalar or array. */
    public static readonly numfields = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('numfields', !(typeof X !== 'undefined' && rest.length === 0 && Structure.isStructure(X)));
        return Complex.create(Structure.fieldNames(X).length);
    };

    /** Signature metadata for `getfield`. */
    public static readonly getfieldSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 2, parameters: [{ name: 'structure' }, { name: 'field', variadic: true }] },
        outputs: { arity: 1 },
    };

    /**
     * Get a nested structure field using string field names.
     */
    public static readonly getfield = (X?: ElementType, ...fields: ElementType[]): ElementType => {
        AST.throwInvalidCallError('getfield', !(typeof X !== 'undefined' && fields.length > 0 && Structure.isStructure(X)));
        return Structure.getField(
            X,
            fields.map((field, index) => CoreFunctions.stringArgument(field, 'getfield', index + 2)),
        );
    };

    /** Signature metadata for `setfield`. */
    public static readonly setfieldSignature: BuiltInFunctionSignature = {
        inputs: { arity: -3, min: 3, parameters: [{ name: 'structure' }, { name: 'fieldOrValue', variadic: true }] },
        outputs: { arity: 1 },
    };

    /**
     * Return a copy of a structure with a nested field assigned.
     */
    public static readonly setfield = (X?: ElementType, ...fieldsAndValue: ElementType[]): ElementType => {
        AST.throwInvalidCallError('setfield', !(typeof X !== 'undefined' && fieldsAndValue.length >= 2 && Structure.isStructure(X)));
        const result = Structure.isInstanceOf(X) ? Structure.copy(X) : MultiArray.copy(X as MultiArray);
        const fields = fieldsAndValue.slice(0, -1).map((field, index) => CoreFunctions.stringArgument(field, 'setfield', index + 2));
        Structure.setNewField(result, fields, fieldsAndValue[fieldsAndValue.length - 1] as StructureFieldValue);
        return result;
    };

    /** Signature metadata for `rmfield`. */
    public static readonly rmfieldSignature: BuiltInFunctionSignature = { inputs: { arity: 2, parameters: [{ name: 'structure' }, { name: 'fields' }] }, outputs: { arity: 1 } };

    /**
     * Return a copy of a structure with top-level fields removed.
     */
    public static readonly rmfield = (X?: ElementType, fields?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('rmfield', !(typeof X !== 'undefined' && typeof fields !== 'undefined' && rest.length === 0 && Structure.isStructure(X)));
        return Structure.removeFields(CoreFunctions.structureArgument(X, 'rmfield'), CoreFunctions.fieldNameArguments(fields, 'rmfield', 2));
    };

    /** Signature metadata for `orderfields`. */
    public static readonly orderfieldsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'structure' }] }, outputs: { arity: 1 } };

    /**
     * Return a copy of a structure with alphabetically ordered top-level fields.
     */
    public static readonly orderfields = (X?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('orderfields', !(typeof X !== 'undefined' && rest.length === 0 && Structure.isStructure(X)));
        return Structure.orderFields(CoreFunctions.structureArgument(X, 'orderfields'));
    };

    /** Signature metadata for `struct2cell`. */
    public static readonly struct2cellSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'structure' }] }, outputs: { arity: 1 } };

    /**
     * Convert a structure scalar or array into a cell array of field values.
     *
     * The first dimension of the result enumerates fields; remaining
     * dimensions mirror the structure array dimensions.
     */
    public static readonly struct2cell = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('struct2cell', !(typeof X !== 'undefined' && rest.length === 0 && Structure.isStructure(X)));
        const structureValue = CoreFunctions.structureArgument(X, 'struct2cell');
        const fields = Structure.fieldNames(structureValue);
        const elements = Structure.structureElements(structureValue);
        const structureDimensions = Structure.isInstanceOf(structureValue) ? [1, 1] : structureValue.dimension;
        const result = new MultiArray([fields.length, ...structureDimensions], undefined, true);
        for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
            const structureSubscript = MultiArray.linearIndexToSubscript(structureDimensions, elementIndex);
            for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                const [row, column] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, [fieldIndex + 1, ...structureSubscript]);
                result.array[row][column] = RuntimeValue.copy(elements[elementIndex].field[fields[fieldIndex]]);
            }
        }
        MultiArray.setType(result);
        result.isCell = true;
        return result;
    };

    /** Signature metadata for `cell2struct`. */
    public static readonly cell2structSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 3,
            parameters: [{ name: 'cellArray', classes: ['cell'] }, { name: 'fields' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] }],
        },
        outputs: { arity: 1 },
    };

    /**
     * Convert a cell array into a structure array using one dimension as field
     * names.
     */
    public static readonly cell2struct = (C?: ElementType, fields?: ElementType, dimension?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('cell2struct', !(MultiArray.isInstanceOf(C) && C.isCell && typeof fields !== 'undefined' && typeof dimension !== 'undefined' && rest.length === 0));
        const cellArray = C as MultiArray;
        const fieldNames = CoreFunctions.fieldNameArguments(fields, 'cell2struct', 2);
        const dim = Complex.realToNumber(MultiArray.firstElement(dimension) as ComplexType);
        const dimIndex = dim - 1;
        const cellDimensions = cellArray.dimension.slice();
        MultiArray.appendSingletonTail(cellDimensions, dimIndex + 1);
        if (fieldNames.length !== cellDimensions[dimIndex]) {
            throw new EvalError('cell2struct: number of fields does not match dimension.');
        }
        const resultDimensions = cellDimensions.filter((_dimension: number, index: number) => index !== dimIndex);
        const normalizedResultDimensions = resultDimensions.length === 0 ? [1, 1] : resultDimensions;
        const result = new MultiArray(normalizedResultDimensions);
        for (let resultIndex = 0; resultIndex < MultiArray.linearLength(result); resultIndex++) {
            const resultSubscript = MultiArray.linearIndexToSubscript(normalizedResultDimensions, resultIndex);
            const structure = new Structure({});
            for (let fieldIndex = 0; fieldIndex < fieldNames.length; fieldIndex++) {
                const cellSubscript: number[] = [];
                let resultDimensionIndex = 0;
                for (let index = 0; index < cellDimensions.length; index++) {
                    if (index === dimIndex) {
                        cellSubscript[index] = fieldIndex + 1;
                    } else {
                        cellSubscript[index] = resultSubscript[resultDimensionIndex++] ?? 1;
                    }
                }
                const [cellRow, cellColumn] = MultiArray.subscriptToMultiArrayRowColumn(cellArray.dimension, cellSubscript.slice(0, cellArray.dimension.length));
                structure.field[fieldNames[fieldIndex]] = RuntimeValue.copy(cellArray.array[cellRow][cellColumn]) as StructureFieldValue;
            }
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], resultIndex);
            result.array[row][column] = structure;
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly methodsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } };
    public static readonly methods = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('methods', !(typeof X !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'methods');
        return CoreFunctions.stringCellColumn(CoreFunctions.listedNames(definition.allMethods(), (method) => !method.isHidden && method.access === 'public'));
    };

    public static readonly eventsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } };
    public static readonly events = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('events', !(typeof X !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'events');
        return CoreFunctions.stringCellColumn(CoreFunctions.listedNames(definition.allEvents(), (event) => !event.isHidden && event.listenAccess === 'public'));
    };

    public static readonly enumerationSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } };
    public static readonly enumeration = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('enumeration', !(typeof X !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'enumeration');
        return CoreFunctions.stringCellColumn(CoreFunctions.listedNames(definition.allEnumerations(), (enumeration) => !enumeration.isHidden));
    };

    public static readonly superclassesSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } };
    public static readonly superclasses = (X?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('superclasses', !(typeof X !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'superclasses');
        return CoreFunctions.stringCellColumn(definition.superclasses.slice().sort());
    };

    private static readonly stringArgument = (value: ElementType, name: string, index: number): string => {
        if (!CharString.isInstanceOf(value)) {
            throw new EvalError(`${name}: argument ${index} must be a string.`);
        }
        return value.str;
    };

    /**
     * Normalize a single field name or cellstr list for field-list functions.
     *
     * @param value Runtime field-name argument.
     * @param name Function name used in diagnostics.
     * @param index One-based argument index used in diagnostics.
     * @returns Field names in linear order.
     */
    private static readonly fieldNameArguments = (value: ElementType, name: string, index: number): string[] => {
        if (CharString.isInstanceOf(value)) {
            return [value.str];
        }
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            return MultiArray.linearize(value).map((field) => CoreFunctions.stringArgument(field, name, index));
        }
        throw new EvalError(`${name}: argument ${index} must be a string or cell array of strings.`);
    };

    /**
     * Narrow a value to the concrete structure representations accepted by
     * field-manipulation helpers.
     */
    private static readonly structureArgument = (value: ElementType, name: string): Structure | MultiArray => {
        if (Structure.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && Structure.isStructure(value))) {
            return value;
        }
        throw new EvalError(`${name}: argument 1 must be a structure.`);
    };

    public static readonly ispropSignature: BuiltInFunctionSignature = {
        inputs: { arity: 2, parameters: [{ name: 'object' }, { name: 'propertyName' }] },
        outputs: { arity: 1 },
    };
    public static readonly isprop = (X?: ElementType, propertyName?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('isprop', !(typeof X !== 'undefined' && typeof propertyName !== 'undefined' && rest.length === 0));
        if (!CharString.isInstanceOf(propertyName)) {
            return Complex.false();
        }
        const name = propertyName.str;
        if (MultiArray.isInstanceOf(X)) {
            if (X.isCell) {
                return Complex.false();
            }
            const result = MultiArray.rawMap(X, (value: ElementType) => {
                const definition = CoreFunctions.classDefinitionFromValue(value, 'isprop');
                return definition.findProperty(name) ? Complex.true() : Complex.false();
            });
            MultiArray.setType(result);
            return MultiArray.MultiArrayToScalar(result);
        }
        const definition = CoreFunctions.classDefinitionFromValue(X, 'isprop');
        return definition.findProperty(name) ? Complex.true() : Complex.false();
    };

    public static readonly ismethodSignature: BuiltInFunctionSignature = {
        inputs: { arity: 2, parameters: [{ name: 'object' }, { name: 'methodName', classes: ['char', 'string'] }] },
        outputs: { arity: 1 },
    };
    public static readonly ismethod = (X?: ElementType, methodName?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ismethod', !(typeof X !== 'undefined' && typeof methodName !== 'undefined' && rest.length === 0));
        const definition = CoreFunctions.classDefinitionFromValue(X, 'ismethod');
        const name = CoreFunctions.stringArgument(methodName, 'ismethod', 2);
        return definition.findMethod(name, (method) => !method.isHidden && method.access === 'public') ? Complex.true() : Complex.false();
    };

    public static readonly isequalSignature: BuiltInFunctionSignature = { inputs: { arity: -1, min: 2, parameters: [{ name: 'value', variadic: true }] }, outputs: { arity: 1 } };
    /**
     * Return true if all input values are equal under MATLAB-like `isequal`
     * semantics.
     *
     * @param first First value to compare.
     * @param rest Additional values that must equal `first`.
     * @returns Logical scalar result.
     */
    public static readonly isequal = (first?: ElementType, ...rest: ElementType[]): ComplexType => {
        AST.throwInvalidCallError('isequal', !(typeof first !== 'undefined' && rest.length >= 1));
        return rest.every((value) => CoreFunctions.valuesEqual(first, value)) ? Complex.true() : Complex.false();
    };

    /**
     * Compare two runtime values using the same semantics exposed by
     * `isequal`.
     *
     * This helper remains as a compatibility facade for callers that still
     * access equality through the built-in module.
     *
     * @param left Left value.
     * @param right Right value.
     * @returns `true` when the values are equal.
     */
    public static readonly valuesEqual = (left: ElementType, right: ElementType): boolean => RuntimeEquality.valuesEqual(left, right);

    public static readonly ndimsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return the number of logical dimensions of a runtime value.
     *
     * Scalars and text values use their MATLAB-compatible array dimensions,
     * while arrays preserve their stored rank after singleton-tail
     * normalization.
     *
     * @param M Value whose dimensions should be inspected.
     * @returns Number of dimensions as a complex scalar.
     */
    public static readonly ndims = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ndims', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(RuntimeValue.dimensions(M).length);
    };

    public static readonly rowsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return the first logical dimension of a runtime value.
     *
     * @param M Value whose row count should be inspected.
     * @returns Row count as a complex scalar.
     */
    public static readonly rows = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('rows', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(RuntimeValue.dimensions(M)[0]);
    };

    public static readonly columnsSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return the second logical dimension of a runtime value.
     *
     * @param M Value whose column count should be inspected.
     * @returns Column count as a complex scalar.
     */
    public static readonly columns = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('columns', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(RuntimeValue.dimensions(M)[1]);
    };

    public static readonly lengthSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Return the length of the object M. The length is the number of elements
     * along the largest dimension.
     *
     * @param M Value whose largest dimension should be inspected.
     * @returns Largest dimension as a complex scalar.
     */
    public static readonly Length = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        /* Capitalized name so as not to conflict with the built-in 'Function.length' property. */
        AST.throwInvalidCallError('length', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(Math.max(...RuntimeValue.dimensions(M)));
    };

    public static readonly numelSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, parameters: [{ name: 'value' }, { name: 'index', variadic: true }] },
        outputs: { arity: 1 },
    };
    /**
     * Return the number of selected elements.
     *
     * With no index arguments this is the product of the runtime dimensions.
     * With index arguments it follows MATLAB's `numel(A, idx...)` contract used
     * by comma-separated-list expansion and overloaded indexing: `":"` selects
     * the corresponding dimension length, vector indices contribute their
     * number of elements, and scalar-like indices contribute one element.
     *
     * @param M Value being indexed.
     * @param IDX Optional indexing arguments.
     * @returns Element count as a complex scalar.
     */
    public static readonly numel = (M: ElementType, ...IDX: ElementType[]): ComplexType => {
        const dimensions = RuntimeValue.dimensions(M);
        if (IDX.length === 0) {
            return Complex.create(RuntimeValue.elementCount(M));
        } else {
            const index = IDX.map((idx, i) => {
                if (MultiArray.isInstanceOf(idx)) {
                    return MultiArray.linearLength(idx as MultiArray);
                } else if (CharString.isInstanceOf(idx) && (idx as CharString).str === ':') {
                    return i < dimensions.length ? dimensions[i] : 1;
                } else {
                    return 1;
                }
            });
            return Complex.create(index.reduce((p, c) => p * c, 1));
        }
    };

    public static readonly findSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'direction', classes: ['char', 'string'], allowedStrings: ['first', 'last'] },
                ],
            },
        ],
        outputs: { arity: -3 },
    };
    /**
     * Find indices and values of nonzero elements.
     * @param M Input value.
     * @param args Optional count and direction.
     * @returns Linear indices or row/column/value return list.
     */
    public static readonly find = (M: ElementType, ...args: ElementType[]): NodeReturnList => {
        AST.throwInvalidCallError('find', args.length > 2);
        const MA = MultiArray.scalarToMultiArray(M);
        let count = Infinity;
        let direction = 'first';
        if (args.length >= 1) {
            count = Complex.realToNumber(MultiArray.firstElement(args[0]) as ComplexType);
        }
        if (args.length === 2) {
            direction = (args[1] as CharString).str;
        }
        const values = MultiArray.linearize(MA) as ComplexType[];
        let entries = values.map((value, index) => ({ index, value })).filter(({ value }) => Boolean(Complex.realToNumber(value) || Complex.imagToNumber(value)));
        if (direction === 'last') {
            entries = entries.slice(Math.max(0, entries.length - count));
        } else {
            entries = entries.slice(0, count);
        }
        const indices = entries.map(({ index }) => Complex.create(index + 1));
        const rows = entries.map(({ index }) => Complex.create(MultiArray.linearIndexToSubscript(MA.dimension, index)[0] ?? 1));
        const columns = entries.map(({ index }) => Complex.create(MultiArray.linearIndexToSubscript(MA.dimension, index)[1] ?? 1));
        const foundValues = entries.map(({ value }) => value);
        const toColumn = (items: ElementType[]): ElementType => MultiArray.MultiArrayToScalar(MultiArray.toColumnVector(items));
        return AST.nodeBoundedReturnList(3, (evaluated: ReturnHandlerResult, index: number): ElementType => {
            if (evaluated.length === 1) {
                return toColumn(indices);
            }
            switch (index) {
                case 0:
                    return toColumn(rows);
                case 1:
                    return toColumn(columns);
                case 2:
                    return toColumn(foundValues);
                default:
                    throw new EvalError('unreachable find return-list selector branch.');
            }
        });
    };

    public static readonly sortSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    {
                        name: 'dimensionOrDirection',
                        alternatives: [
                            { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                            { name: 'direction', classes: ['char', 'string'], allowedStrings: ['ascend', 'descend'] },
                        ],
                    },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                    { name: 'direction', classes: ['char', 'string'], allowedStrings: ['ascend', 'descend'] },
                ],
            },
        ],
        outputs: { arity: -2 },
    };
    /**
     * Sort elements along a dimension.
     * @param M Input value.
     * @param args Optional dimension and direction.
     * @returns Sorted values and sorting indices.
     */
    public static readonly sort = (M: ElementType, ...args: ElementType[]): NodeReturnList => {
        AST.throwInvalidCallError('sort', args.length > 2);
        const MA = MultiArray.scalarToMultiArray(M);
        let dim: number | undefined;
        let direction = 'ascend';
        if (args.length >= 1) {
            if (CharString.isInstanceOf(args[0])) {
                direction = args[0].str;
            } else {
                dim = Complex.realToNumber(MultiArray.firstElement(args[0]) as ComplexType) - 1;
            }
        }
        if (args.length === 2) {
            direction = (args[1] as CharString).str;
        }
        dim = typeof dim === 'undefined' ? MultiArray.firstNonSingleDimension(MA) : dim;
        const sorted = new MultiArray(MA.dimension);
        const indices = new MultiArray(MA.dimension);
        const outerShape = MA.dimension.slice();
        outerShape[dim] = 1;
        const outerLength = outerShape.reduce((p, c) => p * c, 1);
        for (let n = 0; n < outerLength; n++) {
            const baseSubscript = MultiArray.linearIndexToSubscript(outerShape, n);
            const slice = Array.from({ length: MA.dimension[dim] ?? 1 }, (_, index) => {
                const subscript = baseSubscript.slice();
                subscript[dim] = index + 1;
                const linearIndex = MultiArray.subscriptToLinearIndex(MA.dimension, subscript);
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(MA.dimension[0], MA.dimension[1], linearIndex);
                return { index, value: MA.array[row][column] as ComplexType };
            }).sort((left, right) => {
                if (Complex.toBoolean(Complex.eq(left.value, right.value))) {
                    return left.index - right.index;
                }
                const leftBeforeRight = direction === 'descend' ? Complex.gt(left.value, right.value) : Complex.lt(left.value, right.value);
                return Complex.toBoolean(leftBeforeRight) ? -1 : 1;
            });
            for (let index = 0; index < slice.length; index++) {
                const subscript = baseSubscript.slice();
                subscript[dim] = index + 1;
                const linearIndex = MultiArray.subscriptToLinearIndex(MA.dimension, subscript);
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(MA.dimension[0], MA.dimension[1], linearIndex);
                sorted.array[row][column] = slice[index].value;
                indices.array[row][column] = Complex.create(slice[index].index + 1);
            }
        }
        MultiArray.setType(sorted);
        indices.type = Complex.REAL;
        return AST.nodeBoundedReturnList(2, (evaluated: ReturnHandlerResult, index: number): ElementType => {
            return index === 0 || evaluated.length === 1 ? MultiArray.MultiArrayToScalar(sorted) : MultiArray.MultiArrayToScalar(indices);
        });
    };

    public static readonly ind2subSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: 2,
            parameters: [
                {
                    name: 'dimensions',
                    classes: ['double'],
                    validators: ['dimension'],
                    alternatives: [{ name: 'dimensions', validators: ['dimensionVector'] }],
                },
                { name: 'index', classes: ['double'], validators: ['numeric', 'real', 'finite', 'integer', 'positive'] },
            ],
        },
        outputs: { arity: -1 },
    };
    /**
     * Convert linear indices to subscripts.
     * @param DIMS
     * @param IND
     * @returns
     */
    public static readonly ind2sub = (DIMS?: ElementType, IND?: ElementType): NodeReturnList => {
        AST.throwInvalidCallError('ind2sub', !(typeof DIMS !== 'undefined' && typeof IND !== 'undefined'));
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): ElementType => {
            if (evaluated.length === 1) {
                return IND;
            } else {
                let dims = (MultiArray.linearize(DIMS) as ComplexType[]).map((value) => Complex.realToNumber(value));
                let lenghtGreater = false;
                if (evaluated.length > dims.length) {
                    MultiArray.appendSingletonTail(dims, evaluated.length);
                    lenghtGreater = true;
                } else {
                    dims = dims.slice(0, evaluated.length - 1);
                }
                const ind = MultiArray.scalarToMultiArray(IND);
                const result = new MultiArray(ind.dimension);
                const subscript = ind.array.map((row) => row.map((value) => MultiArray.ind2subNumber(dims, Complex.realToNumber(value as ComplexType))));
                if (index === evaluated.length - 1 && lenghtGreater) {
                    result.array = subscript.map((row) => row.map((value) => Complex.create(value[evaluated.length])));
                } else {
                    result.array = subscript.map((row) => row.map((value) => Complex.create(value[index])));
                }
                result.type = Complex.REAL;
                return MultiArray.MultiArrayToScalar(result);
            }
        });
    };

    public static readonly sub2indSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -2,
            min: 2,
            parameters: [
                {
                    name: 'dimensions',
                    classes: ['double'],
                    validators: ['dimension'],
                    alternatives: [{ name: 'dimensions', validators: ['dimensionVector'] }],
                },
                { name: 'subscript', classes: ['double'], validators: ['numeric', 'real', 'finite', 'integer', 'positive'], variadic: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * Convert subscripts to linear indices.
     * @param DIMS
     * @param S
     * @returns
     */
    public static readonly sub2ind = (DIMS: ElementType, ...S: ElementType[]): ElementType => {
        AST.throwInvalidCallError('sub2ind', S.length < 1);
        const dims = (MultiArray.linearize(DIMS) as ComplexType[]).map((value) => Complex.realToNumber(value));
        const subscript: MultiArray[] = S.map((s) => MultiArray.scalarToMultiArray(s));
        for (let s = 1; s < subscript.length; s++) {
            if (!MultiArray.arrayEquals(subscript[0].dimension, subscript[s].dimension)) {
                throw new Error('sub2ind: all subscripts must be of the same size.');
            }
        }
        MultiArray.appendSingletonTail(dims, subscript.length);
        const result = new MultiArray(subscript[0].dimension);
        for (let n = 0; n < MultiArray.linearLength(subscript[0]); n++) {
            const subscriptN = subscript.map((s) => {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(s.dimension[0], s.dimension[1], n);
                return s.array[i][j] as ComplexType;
            });
            const index = MultiArray.parseSubscript(dims, subscriptN, 'index ');
            const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[p][q] = Complex.create(index + 1);
        }
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly sizeSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: -2,
                min: 2,
                parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['numeric', 'positive', 'integer', 'real'], variadic: true }],
            },
        ],
        outputs: { arity: -1 },
    };
    /**
     * Returns array dimensions.
     * @param M MultiArray
     * @param DIM Dimensions
     * @returns Dimensions of `M` parameter.
     */
    public static readonly size = (M?: ElementType, ...DIM: ElementType[]): ElementType => {
        AST.throwInvalidCallError('size', !(typeof M !== 'undefined'));
        const parseDimension = (dimension: ComplexType): number => {
            const dim = Complex.realToNumber(dimension);
            if (dim < 1 || !Complex.realIsInteger(dimension)) {
                throw new Error(`size: requested dimension DIM (= ${dim}) out of range. DIM must be a positive integer.`);
            }
            return dim;
        };
        const parseDimensionArgument = (dimension: ElementType): number => {
            const value = MultiArray.firstElement(dimension);
            if (!Complex.isInstanceOf(value)) {
                AST.throwInvalidCallError('size');
            }
            return parseDimension(value as ComplexType);
        };
        const sizeDim = RuntimeValue.dimensions(M);
        if (DIM.length === 0) {
            const result = new MultiArray([1, sizeDim.length]);
            result.array[0] = sizeDim.map((d) => Complex.create(d));
            result.type = Complex.REAL;
            return result;
        } else {
            const dims =
                DIM.length === 1 && MultiArray.isInstanceOf(DIM[0])
                    ? MultiArray.linearize(DIM[0]).map((dim) => {
                          if (!Complex.isInstanceOf(dim)) {
                              AST.throwInvalidCallError('size');
                          }
                          return parseDimension(dim as ComplexType);
                      })
                    : DIM.map((dim) => parseDimensionArgument(dim));
            MultiArray.appendSingletonTail(sizeDim, Math.max(...dims));
            const result = new MultiArray([1, dims.length]);
            result.array[0] = dims.map((dim: number) => Complex.create(sizeDim[dim - 1]));
            result.type = Complex.REAL;
            return MultiArray.MultiArrayToScalar(result);
        }
    };

    public static readonly colonSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -3,
            min: 2,
            max: 3,
            parameters: [
                { name: 'start', classes: ['double'], validators: ['scalar'] },
                { name: 'incrementOrEnd', classes: ['double'], validators: ['scalar'] },
                { name: 'end', classes: ['double'], validators: ['scalar'], optional: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * Return the result of the colon expression.
     * @param args
     * @returns
     */
    public static readonly colon = (...args: ElementType[]): ElementType => {
        if (args.length === 2) {
            return MultiArray.expandRange(MultiArray.firstElement(args[0]) as ComplexType, MultiArray.firstElement(args[1]) as ComplexType);
        } else if (args.length === 3) {
            return MultiArray.expandRange(MultiArray.firstElement(args[0]) as ComplexType, MultiArray.firstElement(args[2]) as ComplexType, MultiArray.firstElement(args[1]) as ComplexType);
        } else {
            AST.throwInvalidCallError('colon');
        }
    };

    public static readonly linspaceSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -3,
            min: 2,
            max: 3,
            parameters: [
                { name: 'start', classes: ['double'], validators: ['scalarOrVector'] },
                { name: 'end', classes: ['double'], validators: ['scalarOrVector'] },
                { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real'], optional: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * Return linearly spaced samples between start and end values.
     *
     * Accepted forms mirror MATLAB/Octave `linspace(START, END)` and
     * `linspace(START, END, N)`. Vector starts and ends are accepted when they
     * have the same number of elements, producing one row per pair.
     *
     * @param args Start, end, and optional sample-count arguments.
     * @returns Row vector or matrix of linearly spaced samples.
     */
    public static readonly linspace = (...args: ElementType[]): ElementType => {
        let start: ComplexType[] = [];
        let end: ComplexType[] = [];
        let n: ComplexType | MultiArray = Complex.one();
        const linearizeStartEnd = () => {
            const errorMessage = 'linspace: START, END must be scalars or vectors.';
            if (MultiArray.isInstanceOf(args[0])) {
                if (!MultiArray.isVector(args[0])) {
                    throw new Error(errorMessage);
                }
                start = MultiArray.linearize(args[0]) as ComplexType[];
            } else {
                start = [args[0] as ComplexType];
            }
            if (MultiArray.isInstanceOf(args[1])) {
                if (!MultiArray.isVector(args[1])) {
                    throw new Error(errorMessage);
                }
                end = MultiArray.linearize(args[1]) as ComplexType[];
            } else {
                end = [args[1] as ComplexType];
            }
        };
        if (args.length === 2) {
            linearizeStartEnd();
            n = Complex.create(100);
        } else if (args.length === 3) {
            linearizeStartEnd();
            n = MultiArray.MultiArrayToScalar(args[2]) as MultiArray | ComplexType;
            if (MultiArray.isInstanceOf(n)) {
                throw new Error('linspace: N must be a scalar.');
            }
        } else {
            AST.throwInvalidCallError('linspace');
        }
        if (start.length !== end.length) {
            throw new Error('linspace: vectors must be of equal length');
        }
        Complex.realApply(n as ComplexType, Complex.applyFunction['floor']);
        if (Complex.realIsNegative(n as ComplexType)) {
            Complex.realSet(n as ComplexType, 0);
        }
        Complex.imagSet(n as ComplexType, 0);
        const result = new MultiArray([start.length, Complex.realToNumber(n as ComplexType)]);
        for (let i = 0; i < start.length; i++) {
            const delta = Complex.rdiv(Complex.sub(end[i], start[i]), Complex.sub(n as ComplexType, Complex.one()));
            result.array[i][0] = start[i];
            for (let j = 1; j < Complex.realToNumber(n as ComplexType) - 1; j++) {
                result.array[i][j] = Complex.add(start[i], Complex.mul(Complex.create(j), delta));
            }
            result.array[i][Complex.realToNumber(n as ComplexType) - 1] = end[i];
        }
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly logspaceSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -3,
            min: 2,
            max: 3,
            parameters: [
                { name: 'start', classes: ['double'], validators: ['scalarOrVector'] },
                { name: 'end', classes: ['double'], validators: ['scalarOrVector'] },
                { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real'], optional: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * Return logarithmically spaced samples between powers of ten.
     *
     * Accepted forms mirror MATLAB/Octave `logspace(START, END)` and
     * `logspace(START, END, N)`, including the special `END == pi` handling
     * traditionally provided by Octave/MATLAB.
     *
     * @param args Start exponent, end exponent, and optional sample count.
     * @returns Row vector or matrix of logarithmically spaced samples.
     */
    public static readonly logspace = (...args: ElementType[]): ElementType => {
        let start: ComplexType[] = [];
        let end: ComplexType[] = [];
        let n: ComplexType | MultiArray = Complex.one();
        const linearizeStartEnd = () => {
            const errorMessage = 'logspace: START, END must be scalars or vectors.';
            if (MultiArray.isInstanceOf(args[0])) {
                if (!MultiArray.isVector(args[0])) {
                    throw new Error(errorMessage);
                }
                start = MultiArray.linearize(args[0]) as ComplexType[];
            } else {
                start = [args[0] as ComplexType];
            }
            if (MultiArray.isInstanceOf(args[1])) {
                if (!MultiArray.isVector(args[1])) {
                    throw new Error(errorMessage);
                }
                end = MultiArray.linearize(args[1]) as ComplexType[];
            } else {
                end = [args[1] as ComplexType];
            }
        };
        if (args.length === 2) {
            linearizeStartEnd();
            n = Complex.create(50);
        } else if (args.length === 3) {
            linearizeStartEnd();
            n = MultiArray.MultiArrayToScalar(args[2]) as MultiArray | ComplexType;
            if (MultiArray.isInstanceOf(n)) {
                throw new Error('logspace: N must be a scalar.');
            }
        } else {
            AST.throwInvalidCallError('logspace');
        }
        if (start.length !== end.length) {
            throw new Error('logspace: vectors must be of equal length');
        }
        Complex.realApply(n as ComplexType, Complex.applyFunction['floor']);
        if (Complex.realIsNegative(n as ComplexType)) {
            Complex.realSet(n as ComplexType, 0);
        }
        Complex.imagSet(n as ComplexType, 0);
        const result = new MultiArray([start.length, Complex.realToNumber(n as ComplexType)]);
        for (let i = 0; i < start.length; i++) {
            if (Complex.realToNumber(Complex.eq(end[i], Complex.pi()))) {
                end[i] = Complex.log10(Complex.pi());
            }
            const delta = Complex.rdiv(Complex.sub(end[i], start[i]), Complex.sub(n as ComplexType, Complex.one()));
            result.array[i][0] = Complex.power(Complex.create(10), start[i]);
            for (let j = 1; j < Complex.realToNumber(n as ComplexType) - 1; j++) {
                result.array[i][j] = Complex.power(Complex.create(10), Complex.add(start[i], Complex.mul(Complex.create(j), delta)));
            }
            result.array[i][Complex.realToNumber(n as ComplexType) - 1] = Complex.power(Complex.create(10), end[i]);
        }
        return MultiArray.MultiArrayToScalar(result) as MultiArray | ComplexType;
    };

    public static readonly meshgridSignature: BuiltInFunctionSignature = {
        inputs: { arity: -3, min: 1, max: 3, parameters: [{ name: 'vector', classes: ['double'], validators: ['scalarOrVector'], variadic: true }] },
        outputs: { arity: -3 },
    };
    /**
     * Generate 2-D and 3-D grids.
     * @param args
     * @returns
     */
    public static readonly meshgrid = (...args: ElementType[]): NodeReturnList => {
        AST.throwInvalidCallError('meshgrid', args.length > 3 || args.length < 1);
        const argsLinearized: ElementType[][] = [];
        for (let i = 0; i < 3; i++) {
            if (args.length > i) {
                if (MultiArray.isInstanceOf(args[i])) {
                    if (!MultiArray.isVector(args[i])) {
                        throw new Error('meshgrid: arguments must be vectors.');
                    }
                    argsLinearized[i] = MultiArray.firstVector(args[i]);
                } else {
                    argsLinearized[i] = [args[i]];
                }
            } else {
                break;
            }
        }
        return AST.nodeBoundedReturnList(3, (evaluated: ReturnHandlerResult, index: number): ElementType => {
            const args: ElementType[][] = argsLinearized;
            while (args.length < evaluated.length) {
                args[args.length] = args[args.length - 1];
            }
            const result = evaluated.length > 2 ? new MultiArray([args[1].length, args[0].length, args[2].length]) : new MultiArray([args[1].length, args[0].length]);
            switch (index) {
                case 0:
                    for (let i = 0; i < result.array.length; i++) {
                        result.array[i] = args[0];
                    }
                    break;
                case 1:
                    for (let p = 0; p < result.array.length; p += result.dimension[0]) {
                        for (let i = 0; i < result.dimension[0]; i++) {
                            result.array[p + i] = new Array(result.dimension[1]).fill(args[1][i]);
                        }
                    }
                    break;
                case 2:
                    for (let p = 0, n = 0; p < result.array.length; p += result.dimension[0], n++) {
                        for (let i = 0; i < result.dimension[0]; i++) {
                            result.array[p + i] = new Array(result.dimension[1]).fill(args[2][n]);
                        }
                    }
                    break;
            }
            return MultiArray.MultiArrayToScalar(result);
        });
    };

    public static readonly ndgridSignature: BuiltInFunctionSignature = {
        inputs: { arity: -1, min: 1, parameters: [{ name: 'vector', classes: ['double'], validators: ['scalarOrVector'], variadic: true }] },
        outputs: { arity: -1 },
    };
    /**
     * Given n vectors X1, ..., Xn, returns n arrays of n dimensions.
     * @returns
     */
    public static readonly ndgrid = (...args: ElementType[]): NodeReturnList => {
        const argsLinearized: MultiArray[] = [];
        for (let i = 0; i < args.length; i++) {
            if (MultiArray.isInstanceOf(args[i])) {
                if (!MultiArray.isVector(args[i])) {
                    throw new Error('ndgrid: arguments must be vectors.');
                }
                argsLinearized[i] = args[i] as MultiArray;
            } else {
                argsLinearized[i] = MultiArray.scalarToMultiArray(args[i]);
            }
        }
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): ElementType => {
            const args: MultiArray[] = argsLinearized;
            if (args.length === 1) {
                while (args.length < evaluated.length) {
                    args[args.length] = args[args.length - 1];
                }
            }
            if (evaluated.length > args.length) {
                AST.throwErrorIfGreaterThanReturnList(args.length, evaluated.length);
            }
            const shape: number[] = args.map((M) => M.dimension[0] * M.dimension[1]);
            const r: number[] = new Array(args.length).fill(1);
            r[index] = shape[index];
            shape[index] = 1;
            return MultiArray.evaluate(new MultiArray(shape, MultiArray.reshape(args[index], r)));
        });
    };

    public static readonly repmatSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 2,
                parameters: [
                    { name: 'value' },
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        validators: ['dimension'],
                        alternatives: [{ name: 'dimensions', validators: ['dimensionVector'] }],
                    },
                ],
            },
            {
                arity: -3,
                min: 3,
                parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Repeat N-D array.
     * @param A
     * @param dim
     * @returns
     */
    public static readonly repmat = (A: ElementType, ...dim: ElementType[]): ElementType => {
        let dimension: ElementType[];
        if (dim.length === 1) {
            dimension = MultiArray.firstVector(dim[0]);
        } else {
            const dimArray = new Array(dim.length);
            dimension = dim.map((d, i) => {
                const result = MultiArray.MultiArrayToScalar(d);
                dimArray[i] = MultiArray.isInstanceOf(result) ? 1 : 0;
                return result;
            });
            if (dimArray.reduce((p, c) => p + c, 0)) {
                throw new Error('repmat: all input arguments must be scalar.');
            }
        }
        const repeats = dimension.map((value) => Complex.realToNumber(value as ComplexType));
        if (MultiArray.isInstanceOf(A) && A.isCell) {
            return CoreFunctions.repmatCellArray(A, repeats);
        }
        return MultiArray.evaluate(new MultiArray(repeats, A));
    };

    /**
     * Repeat a cell array without reducing it through ordinary concatenation.
     */
    private static readonly repmatCellArray = (A: MultiArray, repeats: number[]): MultiArray => {
        const rank = Math.max(A.dimension.length, repeats.length, 2);
        const sourceDimensions = A.dimension.slice();
        const repeatDimensions = repeats.slice();
        MultiArray.appendSingletonTail(sourceDimensions, rank);
        MultiArray.appendSingletonTail(repeatDimensions, rank);
        const resultDimensions = sourceDimensions.map((dimension, index) => dimension * repeatDimensions[index]);
        const result = new MultiArray(resultDimensions, undefined, true);
        for (let resultIndex = 0; resultIndex < MultiArray.linearLength(result); resultIndex++) {
            const resultSubscript = MultiArray.linearIndexToSubscript(result.dimension, resultIndex);
            const sourceSubscript = resultSubscript.map((subscript, index) => ((subscript - 1) % sourceDimensions[index]) + 1);
            const sourceLinear = MultiArray.subscriptToLinearIndex(sourceDimensions, sourceSubscript);
            const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(A.dimension[0], A.dimension[1], sourceLinear);
            const [resultRow, resultColumn] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], resultIndex);
            result.array[resultRow][resultColumn] = RuntimeValue.copy(A.array[sourceRow][sourceColumn]);
        }
        result.isCell = true;
        return result;
    };

    public static readonly reshapeSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 2,
                parameters: [
                    { name: 'value' },
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        validators: ['reshapeDimension'],
                        alternatives: [{ name: 'dimensions', validators: ['reshapeDimensionVector'] }],
                    },
                ],
            },
            {
                arity: -3,
                min: 3,
                parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['reshapeDimension'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Return a matrix with the specified dimensions whose elements are taken from the matrix M.
     * @param M
     * @param dimension
     * @returns
     */
    public static readonly reshape = (M: ElementType, ...dimension: ElementType[]): ElementType => {
        if (dimension.length < 1) {
            throw new Error('invalid call to reshape');
        }
        const m = MultiArray.scalarOrCellToMultiArray(M);
        let d: number = -1;
        if (dimension.length === 1 && MultiArray.isInstanceOf(dimension[0])) {
            dimension = MultiArray.linearize(dimension[0]);
        }
        const dims = dimension.map((dim, i) => {
            if (MultiArray.isEmpty(dim)) {
                if (d < 0) {
                    d = i;
                    return 1;
                } else {
                    throw new Error('reshape: only a single dimension can be unknown.');
                }
            } else {
                return Complex.realToNumber(MultiArray.firstElement(dim) as ComplexType);
            }
        });
        return MultiArray.reshape(m, dims, d);
    };

    public static readonly squeezeSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } };
    /**
     * Remove singleton dimensions.
     * @param args
     * @returns
     */
    public static readonly squeeze = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('squeeze', args.length !== 1);
        if (!MultiArray.isInstanceOf(args[0])) {
            return args[0];
        }
        const value = args[0] as MultiArray;
        if (value.dimension.length <= 2) {
            return value;
        }
        const dimension = value.dimension.filter((size) => size !== 1);
        while (dimension.length < 2) {
            dimension.push(1);
        }
        return MultiArray.reshape(value, dimension);
    };

    public static readonly flipSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'array' }] },
            { arity: 2, parameters: [{ name: 'array' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] }] },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Reverse array elements along the first non-singleton dimension, or along
     * the explicit one-based dimension.
     */
    public static readonly flip = (A?: ElementType, dimension?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('flip', !(typeof A !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(A) ? MultiArray.characterVectorFromCharString(A) : MultiArray.scalarOrCellToMultiArray(A);
        const dim = typeof dimension === 'undefined' ? MultiArray.firstNonSingleDimension(source) + 1 : CoreFunctions.positiveIntegerScalar(dimension, 'flip', 'DIM');
        return CoreFunctions.flipArray(source, dim);
    };

    public static readonly fliplrSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'array' }] }, outputs: { arity: 1 } };

    /**
     * Reverse array columns on each page.
     */
    public static readonly fliplr = (A?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('fliplr', !(typeof A !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(A) ? MultiArray.characterVectorFromCharString(A) : MultiArray.scalarOrCellToMultiArray(A);
        return CoreFunctions.flipArray(source, 2);
    };

    public static readonly flipudSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'array' }] }, outputs: { arity: 1 } };

    /**
     * Reverse array rows on each page.
     */
    public static readonly flipud = (A?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('flipud', !(typeof A !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(A) ? MultiArray.characterVectorFromCharString(A) : MultiArray.scalarOrCellToMultiArray(A);
        return CoreFunctions.flipArray(source, 1);
    };

    /**
     * Shared implementation for dimension-wise flips.
     */
    private static readonly flipArray = (source: MultiArray, dimension: number): ElementType => {
        const rank = Math.max(source.dimension.length, dimension, 2);
        const sourceDimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(sourceDimensions, rank);
        const result = new MultiArray(sourceDimensions, undefined, source.isCell);
        for (let sourceIndex = 0; sourceIndex < MultiArray.linearLength(source); sourceIndex++) {
            const sourceSubscript = MultiArray.linearIndexToSubscript(sourceDimensions, sourceIndex);
            const resultSubscript = sourceSubscript.slice();
            resultSubscript[dimension - 1] = sourceDimensions[dimension - 1] - sourceSubscript[dimension - 1] + 1;
            const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceIndex);
            const [resultRow, resultColumn] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, resultSubscript);
            result.array[resultRow][resultColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
        }
        result.isCell = source.isCell;
        result.type = source.type;
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly rot90Signature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'array' }] },
            { arity: 2, parameters: [{ name: 'array' }, { name: 'k', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer'] }] },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Rotate arrays counterclockwise by K quarter-turns in the first two dimensions.
     */
    public static readonly rot90 = (A?: ElementType, k?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('rot90', !(typeof A !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(A) ? MultiArray.characterVectorFromCharString(A) : MultiArray.scalarOrCellToMultiArray(A);
        const turns = typeof k === 'undefined' ? 1 : CoreFunctions.integerScalar(k, 'rot90', 'K');
        const normalizedTurns = ((turns % 4) + 4) % 4;
        if (normalizedTurns === 0) {
            return source;
        }
        const sourceDimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(sourceDimensions, 2);
        const resultDimensions = sourceDimensions.slice();
        if (normalizedTurns % 2 === 1) {
            [resultDimensions[0], resultDimensions[1]] = [resultDimensions[1], resultDimensions[0]];
        }
        const result = new MultiArray(resultDimensions, undefined, source.isCell);
        for (let sourceIndex = 0; sourceIndex < MultiArray.linearLength(source); sourceIndex++) {
            const sourceSubscript = MultiArray.linearIndexToSubscript(sourceDimensions, sourceIndex);
            const resultSubscript = sourceSubscript.slice();
            if (normalizedTurns === 1) {
                resultSubscript[0] = sourceDimensions[1] - sourceSubscript[1] + 1;
                resultSubscript[1] = sourceSubscript[0];
            } else if (normalizedTurns === 2) {
                resultSubscript[0] = sourceDimensions[0] - sourceSubscript[0] + 1;
                resultSubscript[1] = sourceDimensions[1] - sourceSubscript[1] + 1;
            } else {
                resultSubscript[0] = sourceSubscript[1];
                resultSubscript[1] = sourceDimensions[0] - sourceSubscript[0] + 1;
            }
            const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceIndex);
            const [resultRow, resultColumn] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, resultSubscript);
            result.array[resultRow][resultColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
        }
        result.isCell = source.isCell;
        result.type = source.type;
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly permuteSignature: BuiltInFunctionSignature = {
        inputs: { arity: 2, parameters: [{ name: 'array' }, { name: 'order', classes: ['double'], validators: ['dimensionVector'] }] },
        outputs: { arity: 1 },
    };

    /**
     * Rearrange array dimensions according to a one-based permutation vector.
     */
    public static readonly permute = (A?: ElementType, order?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('permute', !(typeof A !== 'undefined' && typeof order !== 'undefined' && rest.length === 0));
        return CoreFunctions.permuteArray(A, order, false, 'permute');
    };

    public static readonly ipermuteSignature: BuiltInFunctionSignature = {
        inputs: { arity: 2, parameters: [{ name: 'array' }, { name: 'order', classes: ['double'], validators: ['dimensionVector'] }] },
        outputs: { arity: 1 },
    };

    /**
     * Inverse operation of `permute` for a one-based permutation vector.
     */
    public static readonly ipermute = (A?: ElementType, order?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('ipermute', !(typeof A !== 'undefined' && typeof order !== 'undefined' && rest.length === 0));
        return CoreFunctions.permuteArray(A, order, true, 'ipermute');
    };

    /**
     * Shared implementation for `permute` and `ipermute`.
     */
    private static readonly permuteArray = (value: ElementType, order: ElementType, inverse: boolean, functionName: 'permute' | 'ipermute'): ElementType => {
        const source = CharString.isInstanceOf(value) ? MultiArray.characterVectorFromCharString(value) : MultiArray.scalarOrCellToMultiArray(value);
        const orderValues = CoreFunctions.permutationOrder(order, source.dimension.length, functionName);
        const effectiveOrder = inverse ? CoreFunctions.inversePermutation(orderValues) : orderValues;
        const rank = Math.max(source.dimension.length, effectiveOrder.length, 2);
        const sourceDimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(sourceDimensions, rank);
        const resultDimensions = effectiveOrder.map((axis) => sourceDimensions[axis - 1]);
        MultiArray.appendSingletonTail(resultDimensions, rank);
        const result = new MultiArray(resultDimensions, undefined, source.isCell);
        for (let resultIndex = 0; resultIndex < MultiArray.linearLength(result); resultIndex++) {
            const resultSubscript = MultiArray.linearIndexToSubscript(result.dimension, resultIndex);
            const sourceSubscript = new Array<number>(rank).fill(1);
            effectiveOrder.forEach((axis, resultAxis) => {
                sourceSubscript[axis - 1] = resultSubscript[resultAxis];
            });
            const sourceLinear = MultiArray.subscriptToLinearIndex(sourceDimensions, sourceSubscript);
            const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceLinear);
            const [resultRow, resultColumn] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], resultIndex);
            result.array[resultRow][resultColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
        }
        result.isCell = source.isCell;
        result.type = source.type;
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    /**
     * Validate and normalize the dimension order argument for permutation.
     */
    private static readonly permutationOrder = (order: ElementType, sourceRank: number, functionName: 'permute' | 'ipermute'): number[] => {
        const values = MultiArray.linearize(MultiArray.scalarToMultiArray(order)).map((value) => {
            if (!Complex.isInstanceOf(value)) {
                throw new EvalError(`${functionName}: ORDER must be a permutation vector.`);
            }
            const dimension = Complex.realToNumber(value);
            if (!Number.isInteger(dimension) || dimension < 1 || Complex.imagToNumber(value) !== 0) {
                throw new EvalError(`${functionName}: ORDER must be a permutation vector.`);
            }
            return dimension;
        });
        const rank = Math.max(sourceRank, values.length, 2);
        const sorted = values.slice().sort((left, right) => left - right);
        if (values.length !== rank || sorted.some((value, index) => value !== index + 1)) {
            throw new EvalError(`${functionName}: ORDER must be a permutation vector.`);
        }
        return values;
    };

    /**
     * Return the inverse permutation that maps input axes back to source axes.
     */
    private static readonly inversePermutation = (order: number[]): number[] => {
        const inverse = new Array<number>(order.length);
        order.forEach((axis, index) => {
            inverse[axis - 1] = index + 1;
        });
        return inverse;
    };

    public static readonly circshiftSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 2, parameters: [{ name: 'array' }, { name: 'shifts', classes: ['double'] }] },
            {
                arity: 3,
                parameters: [
                    { name: 'array' },
                    { name: 'shift', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Circularly shift array elements along one or more dimensions.
     */
    public static readonly circshift = (A?: ElementType, shifts?: ElementType, dimension?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('circshift', !(typeof A !== 'undefined' && typeof shifts !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(A) ? MultiArray.characterVectorFromCharString(A) : MultiArray.scalarOrCellToMultiArray(A);
        const shiftValues = CoreFunctions.integerVector(shifts, 'circshift', 'SHIFTS');
        if (typeof dimension !== 'undefined') {
            const dim = CoreFunctions.positiveIntegerScalar(dimension, 'circshift', 'DIM');
            if (shiftValues.length !== 1) {
                throw new EvalError('circshift: SHIFT must be a scalar when DIM is specified.');
            }
            return CoreFunctions.circularShiftArray(source, [shiftValues[0]], dim);
        }
        if (shiftValues.length === 1) {
            return CoreFunctions.circularShiftArray(source, shiftValues, MultiArray.firstNonSingleDimension(source) + 1);
        }
        if (shiftValues.length > source.dimension.length) {
            throw new EvalError('circshift: SHIFTS vector must not be longer than ndims(A).');
        }
        return CoreFunctions.circularShiftArray(source, shiftValues);
    };

    /**
     * Apply circular shifts to an ordinary or cell array.
     */
    private static readonly circularShiftArray = (source: MultiArray, shifts: number[], explicitDimension?: number): ElementType => {
        const rank = Math.max(source.dimension.length, explicitDimension ?? 0, shifts.length, 2);
        const sourceDimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(sourceDimensions, rank);
        const effectiveShifts = new Array<number>(rank).fill(0);
        if (typeof explicitDimension === 'number') {
            effectiveShifts[explicitDimension - 1] = shifts[0];
        } else {
            shifts.forEach((shift, index) => {
                effectiveShifts[index] = shift;
            });
        }
        const result = new MultiArray(sourceDimensions, undefined, source.isCell);
        for (let sourceIndex = 0; sourceIndex < MultiArray.linearLength(source); sourceIndex++) {
            const sourceSubscript = MultiArray.linearIndexToSubscript(sourceDimensions, sourceIndex);
            const resultSubscript = sourceSubscript.map((subscript, index) => {
                const dimension = sourceDimensions[index];
                return ((((subscript - 1 + effectiveShifts[index]) % dimension) + dimension) % dimension) + 1;
            });
            const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceIndex);
            const [resultRow, resultColumn] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, resultSubscript);
            result.array[resultRow][resultColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
        }
        result.isCell = source.isCell;
        result.type = source.type;
        MultiArray.removeSingletonTail(result.dimension);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly shiftdimSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'array' }] },
            { arity: 2, parameters: [{ name: 'array' }, { name: 'shift', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer'] }] },
        ],
        outputs: { arity: -2 },
    };

    /**
     * Shift array dimensions left or right.
     *
     * With one input, leading singleton dimensions are removed and a second
     * output reports how many were removed. With two inputs, positive `N`
     * rotates dimensions left and negative `N` prepends singleton dimensions.
     */
    public static readonly shiftdim = (A?: ElementType, n?: ElementType, ...rest: unknown[]): ElementType | NodeReturnList => {
        AST.throwInvalidCallError('shiftdim', !(typeof A !== 'undefined' && rest.length === 0));
        const source = MultiArray.scalarOrCellToMultiArray(A);
        if (typeof n === 'undefined') {
            const removed = CoreFunctions.leadingSingletonDimensions(source.dimension);
            const shifted = CoreFunctions.shiftDimensions(source, removed);
            return AST.nodeBoundedReturnList(2, (_evaluated: ReturnHandlerResult, index: number): ElementType => (index === 0 ? shifted : Complex.create(removed)));
        }
        const shift = CoreFunctions.integerScalar(n, 'shiftdim', 'N');
        return CoreFunctions.shiftDimensions(source, shift);
    };

    /**
     * Count removable leading singleton dimensions using MATLAB's two-minimum
     * dimension convention.
     */
    private static readonly leadingSingletonDimensions = (dimensions: number[]): number => {
        let count = 0;
        while (count < dimensions.length - 2 && dimensions[count] === 1) {
            count++;
        }
        return count;
    };

    /**
     * Shift dimensions left or prepend singleton dimensions for `shiftdim`.
     */
    private static readonly shiftDimensions = (source: MultiArray, shift: number): ElementType => {
        if (shift === 0) {
            return source;
        }
        const dimensions = source.dimension.slice();
        const normalizedShift = dimensions.length === 0 ? 0 : shift % dimensions.length;
        const shiftedDimensions = shift > 0 ? dimensions.slice(normalizedShift).concat(dimensions.slice(0, normalizedShift)) : new Array<number>(-shift).fill(1).concat(dimensions);
        while (shiftedDimensions.length < 2) {
            shiftedDimensions.push(1);
        }
        return MultiArray.reshape(source, shiftedDimensions);
    };

    /**
     * Extract an integer vector from a runtime value.
     */
    private static readonly integerVector = (value: ElementType, functionName: string, argumentName: string): number[] =>
        MultiArray.linearize(MultiArray.scalarToMultiArray(value)).map((item) => {
            if (!Complex.isInstanceOf(item)) {
                throw new EvalError(`${functionName}: ${argumentName} must contain integer values.`);
            }
            const number = Complex.realToNumber(item);
            if (!Number.isInteger(number) || Complex.imagToNumber(item) !== 0 || !Number.isFinite(number)) {
                throw new EvalError(`${functionName}: ${argumentName} must contain integer values.`);
            }
            return number;
        });

    /**
     * Extract an integer scalar from a runtime value.
     */
    private static readonly integerScalar = (value: ElementType, functionName: string, argumentName: string): number => {
        const scalar = MultiArray.MultiArrayToScalar(value);
        if (!Complex.isInstanceOf(scalar)) {
            throw new EvalError(`${functionName}: ${argumentName} must be an integer scalar.`);
        }
        const number = Complex.realToNumber(scalar);
        if (!Number.isInteger(number) || Complex.imagToNumber(scalar) !== 0 || !Number.isFinite(number)) {
            throw new EvalError(`${functionName}: ${argumentName} must be an integer scalar.`);
        }
        return number;
    };

    /**
     * Extract a positive integer scalar from a runtime value.
     */
    private static readonly positiveIntegerScalar = (value: ElementType, functionName: string, argumentName: string): number => {
        const number = CoreFunctions.integerScalar(value, functionName, argumentName);
        if (number < 1) {
            throw new EvalError(`${functionName}: ${argumentName} must be a positive integer scalar.`);
        }
        return number;
    };

    /**
     * Create MultiArray with all elements equals `fill` parameter.
     * @param fill Value to fill MultiArray.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fill` parameter.
     */
    private static readonly newFilled = (fill: ElementType, name: string, ...dimension: ElementType[]): ElementType => {
        let dims: number[];
        if (dimension.length === 0) {
            return fill;
        } else if (dimension.length === 1) {
            const m = MultiArray.scalarToMultiArray(dimension[0]);
            if (!MultiArray.isVector(m)) {
                throw new Error(`${name} (A): use ${name} (size (A)) instead.`);
            }
            dims = (MultiArray.linearize(m) as ComplexType[]).map((data) => Complex.realToNumber(data));
            if (dims.length === 1) {
                dims[dims.length] = dims[0];
            }
        } else {
            dims = (dimension as (MultiArray | ComplexType)[]).map((dim) => {
                if (MultiArray.isInstanceOf(dim)) {
                    throw new Error(`${name}: dimensions must be scalars.`);
                }
                return Complex.realToNumber(dim as ComplexType);
            });
        }
        return MultiArray.MultiArrayToScalar(new MultiArray(dims, fill));
    };

    /**
     * Create MultiArray with all elements filled with `fillFunction` result.
     * The parameter passed to `fillFunction` is a linear index of element.
     * @param fillFunction Function to be called and the result fills element of MultiArray created.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fillFunction` results for each element.
     */
    private static readonly newFilledEach = (fillFunction: (index: number) => ElementType, ...dimension: ElementType[]): ElementType => {
        let dims: number[];
        if (dimension.length === 1) {
            dims = (MultiArray.linearize(dimension[0]) as ComplexType[]).map((dim) => Complex.realToNumber(dim));
        } else if (dimension.length === 0) {
            return fillFunction(0);
        } else {
            dims = dimension.map((dim) => Complex.realToNumber(MultiArray.firstElement(dim) as ComplexType));
        }
        if (dims.length === 1) {
            dims[dims.length] = dims[0];
        }
        const result = new MultiArray(dims);
        for (let n = 0; n < MultiArray.linearLength(result); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[i][j] = fillFunction(n);
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    };

    public static readonly zerosSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 0 },
            {
                arity: 1,
                parameters: [
                    {
                        name: 'dimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                        alternatives: [{ name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] }],
                    },
                ],
            },
            {
                arity: -2,
                min: 2,
                parameters: [{ name: 'dimension', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Create array of all zeros.
     * @param dimension
     * @returns
     */
    public static readonly zeros = (...dimension: ElementType[]): ElementType => {
        return CoreFunctions.newFilled(Complex.zero(), 'zeros', ...dimension);
    };

    public static readonly onesSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 0 },
            {
                arity: 1,
                parameters: [
                    {
                        name: 'dimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                        alternatives: [{ name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] }],
                    },
                ],
            },
            {
                arity: -2,
                min: 2,
                parameters: [{ name: 'dimension', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static readonly ones = (...dimension: ElementType[]): ElementType => {
        return CoreFunctions.newFilled(Complex.one(), 'ones', ...dimension);
    };

    /** Signature metadata for `cell`. */
    public static readonly cellSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 0 },
            {
                arity: 1,
                parameters: [
                    {
                        name: 'dimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                        alternatives: [{ name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] }],
                    },
                ],
            },
            {
                arity: -2,
                min: 2,
                parameters: [{ name: 'dimension', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Create a cell array whose cells are initialized with empty arrays.
     *
     * Unlike numeric constructors, a 1-by-1 cell remains a cell array rather
     * than reducing to the contained empty value.
     *
     * @param dimension Cell array dimensions.
     * @returns Cell array filled with empty arrays.
     */
    public static readonly cell = (...dimension: ElementType[]): MultiArray => {
        let dims: number[];
        if (dimension.length === 0) {
            return MultiArray.emptyArray(true);
        }
        if (dimension.length === 1) {
            const m = MultiArray.scalarToMultiArray(dimension[0]);
            if (!MultiArray.isVector(m)) {
                throw new Error('cell (A): use cell (size (A)) instead.');
            }
            dims = (MultiArray.linearize(m) as ComplexType[]).map((data) => Complex.realToNumber(data));
            if (dims.length === 1) {
                dims[dims.length] = dims[0];
            }
        } else {
            dims = (dimension as (MultiArray | ComplexType)[]).map((dim) => {
                if (MultiArray.isInstanceOf(dim)) {
                    throw new Error('cell: dimensions must be scalars.');
                }
                return Complex.realToNumber(dim as ComplexType);
            });
        }
        return new MultiArray(dims, () => MultiArray.emptyArray(), true);
    };

    /** Signature metadata for `num2cell`. */
    public static readonly num2cellSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value' },
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'positive'],
                        alternatives: [{ name: 'dimension', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] }],
                    },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    /**
     * Convert an array into a cell array, optionally grouping selected
     * dimensions into each cell.
     *
     * @param value Source value.
     * @param dimensions Dimensions to keep inside each cell.
     * @returns Cell array containing scalar elements or grouped subarrays.
     */
    public static readonly num2cell = (value?: ElementType, dimensions?: ElementType, ...rest: unknown[]): MultiArray => {
        AST.throwInvalidCallError('num2cell', !(typeof value !== 'undefined' && rest.length === 0));
        const source = CharString.isInstanceOf(value) ? MultiArray.characterVectorFromCharString(value) : MultiArray.isInstanceOf(value) ? value : MultiArray.scalarToMultiArray(value);
        if (typeof dimensions === 'undefined') {
            const result = new MultiArray(source.dimension, undefined, true);
            for (let index = 0; index < MultiArray.linearLength(source); index++) {
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], index);
                result.array[row][column] = RuntimeValue.copy(source.array[row][column]);
            }
            result.isCell = true;
            return result;
        }
        const dims = [...new Set((MultiArray.linearize(MultiArray.scalarToMultiArray(dimensions)) as ComplexType[]).map((dim) => Complex.realToNumber(dim) - 1))].sort(
            (left, right) => left - right,
        );
        if (dims.some((dim) => dim >= source.dimension.length)) {
            throw new EvalError('num2cell: DIM must be between 1 and ndims(A).');
        }
        const sourceDimensions = source.dimension.slice();
        MultiArray.appendSingletonTail(sourceDimensions, Math.max(...dims) + 1);
        const resultDimensions = sourceDimensions.map((dim, index) => (dims.includes(index) ? 1 : dim));
        const sliceDimensions = sourceDimensions.map((dim, index) => (dims.includes(index) ? dim : 1));
        const result = new MultiArray(resultDimensions, undefined, true);
        for (let resultIndex = 0; resultIndex < MultiArray.linearLength(result); resultIndex++) {
            const baseSubscript = MultiArray.linearIndexToSubscript(resultDimensions, resultIndex);
            const cellValue = new MultiArray(sliceDimensions, undefined, source.isCell);
            for (let sliceIndex = 0; sliceIndex < MultiArray.linearLength(cellValue); sliceIndex++) {
                const sliceSubscript = MultiArray.linearIndexToSubscript(sliceDimensions, sliceIndex);
                const sourceSubscript = sourceDimensions.map((_, index) => (dims.includes(index) ? sliceSubscript[index] : baseSubscript[index]));
                const sourceLinear = MultiArray.subscriptToLinearIndex(sourceDimensions, sourceSubscript);
                const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceLinear);
                const [sliceRow, sliceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(cellValue.dimension[0], cellValue.dimension[1], sliceIndex);
                cellValue.array[sliceRow][sliceColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
            }
            MultiArray.setType(cellValue);
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], resultIndex);
            result.array[row][column] = source.isCell ? cellValue : MultiArray.MultiArrayToScalar(cellValue);
        }
        result.isCell = true;
        return result;
    };

    /** Signature metadata for `cell2mat`. */
    public static readonly cell2matSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'cellArray', classes: ['cell'] }] }, outputs: { arity: 1 } };

    /**
     * Convert a cell array of ordinary arrays into one concatenated array.
     *
     * This mirrors MATLAB/Octave's common `cell2mat` path for numeric,
     * character, logical, structure, and object contents. Nested cell contents
     * are rejected because the result must be an ordinary array.
     */
    public static readonly cell2mat = (C?: ElementType, ...rest: unknown[]): ElementType => {
        AST.throwInvalidCallError('cell2mat', !(MultiArray.isInstanceOf(C) && C.isCell && rest.length === 0));
        const cellArray = C as MultiArray;
        if (MultiArray.isEmpty(cellArray)) {
            return MultiArray.emptyArray();
        }
        return MultiArray.MultiArrayToScalar(CoreFunctions.cell2matCompose(cellArray));
    };

    /**
     * Convert a cell element to the ordinary block consumed by `cell2mat`.
     */
    private static readonly cell2matBlock = (value: ElementType): MultiArray => {
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            throw new EvalError('cell2mat: nested cell contents are not supported.');
        }
        return CharString.isInstanceOf(value) ? MultiArray.characterVectorFromCharString(value) : MultiArray.scalarToMultiArray(value);
    };

    /**
     * Compose N-D cell blocks into one ordinary array.
     *
     * Block sizes may vary along the corresponding cell-array dimension, but
     * must be consistent across all other dimensions.
     */
    private static readonly cell2matCompose = (cellArray: MultiArray): MultiArray => {
        const blocks: MultiArray[] = [];
        const rank = Math.max(cellArray.dimension.length, 2);
        const cellDimensions = cellArray.dimension.slice();
        MultiArray.appendSingletonTail(cellDimensions, rank);
        const axisBlockSizes = cellDimensions.map((length) => new Array<number | undefined>(length));
        for (let index = 0; index < MultiArray.linearLength(cellArray); index++) {
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(cellArray.dimension[0], cellArray.dimension[1], index);
            const block = CoreFunctions.cell2matBlock(cellArray.array[row][column]);
            blocks[index] = block;
            const blockDimensions = block.dimension.slice();
            MultiArray.appendSingletonTail(blockDimensions, rank);
            const cellSubscript = MultiArray.linearIndexToSubscript(cellDimensions, index);
            for (let axis = 0; axis < rank; axis++) {
                const slot = cellSubscript[axis] - 1;
                const expected = axisBlockSizes[axis][slot];
                if (typeof expected === 'undefined') {
                    axisBlockSizes[axis][slot] = blockDimensions[axis];
                } else if (expected !== blockDimensions[axis]) {
                    throw new EvalError('cell2mat: dimension mismatch');
                }
            }
        }
        const resultDimension = axisBlockSizes.map((sizes) => {
            let total = 0;
            sizes.forEach((size) => {
                total += size ?? 0;
            });
            return total;
        });
        const offsets = axisBlockSizes.map((sizes) => {
            let offset = 0;
            return sizes.map((size) => {
                const start = offset;
                offset += size ?? 0;
                return start;
            });
        });
        const result = new MultiArray(resultDimension);
        for (let cellIndex = 0; cellIndex < blocks.length; cellIndex++) {
            const block = blocks[cellIndex];
            const blockDimensions = block.dimension.slice();
            MultiArray.appendSingletonTail(blockDimensions, rank);
            const cellSubscript = MultiArray.linearIndexToSubscript(cellDimensions, cellIndex);
            for (let blockIndex = 0; blockIndex < MultiArray.linearLength(block); blockIndex++) {
                const blockSubscript = MultiArray.linearIndexToSubscript(blockDimensions, blockIndex);
                const resultSubscript = blockSubscript.map((subscript, axis) => offsets[axis][cellSubscript[axis] - 1] + subscript);
                const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(block.dimension[0], block.dimension[1], blockIndex);
                const [resultRow, resultColumn] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, resultSubscript);
                result.array[resultRow][resultColumn] = RuntimeValue.copy(block.array[sourceRow][sourceColumn]);
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /** Signature metadata for `mat2cell`. */
    public static readonly mat2cellSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 2, parameters: [{ name: 'array' }, { name: 'dimensionSizes', classes: ['double'], variadic: true }] },
        outputs: { arity: 1 },
    };

    /**
     * Convert an ordinary array into a cell array of blocks.
     *
     * Each dimension-size vector partitions the matching source dimension.
     * The number of partition arguments must match the source dimensionality.
     */
    public static readonly mat2cell = (value?: ElementType, ...dimensionSizes: ElementType[]): MultiArray => {
        AST.throwInvalidCallError('mat2cell', !(typeof value !== 'undefined' && dimensionSizes.length > 0));
        const source = CharString.isInstanceOf(value) ? MultiArray.characterVectorFromCharString(value) : MultiArray.scalarToMultiArray(value);
        if (source.isCell) {
            throw new EvalError('mat2cell: input must not be a cell array.');
        }
        if (dimensionSizes.length !== source.dimension.length) {
            throw new EvalError('mat2cell: number of dimension vectors must match ndims(A).');
        }
        const partitions = dimensionSizes.map((partition, index) => CoreFunctions.mat2cellPartition(partition, source.dimension[index], index + 2));
        const result = new MultiArray(
            partitions.map((partition) => partition.length),
            undefined,
            true,
        );
        const offsets = partitions.map((partition) => {
            let offset = 0;
            return partition.map((length) => {
                const start = offset;
                offset += length;
                return start;
            });
        });
        for (let resultIndex = 0; resultIndex < MultiArray.linearLength(result); resultIndex++) {
            const resultSubscript = MultiArray.linearIndexToSubscript(result.dimension, resultIndex);
            const blockDimensions = resultSubscript.map((subscript, index) => partitions[index][subscript - 1]);
            const block = new MultiArray(blockDimensions);
            for (let blockIndex = 0; blockIndex < MultiArray.linearLength(block); blockIndex++) {
                const blockSubscript = MultiArray.linearIndexToSubscript(block.dimension, blockIndex);
                const sourceSubscript = blockSubscript.map((subscript, index) => offsets[index][resultSubscript[index] - 1] + subscript);
                const sourceLinear = MultiArray.subscriptToLinearIndex(source.dimension, sourceSubscript);
                const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], sourceLinear);
                const [blockRow, blockColumn] = MultiArray.linearIndexToMultiArrayRowColumn(block.dimension[0], block.dimension[1], blockIndex);
                block.array[blockRow][blockColumn] = RuntimeValue.copy(source.array[sourceRow][sourceColumn]);
            }
            MultiArray.setType(block);
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], resultIndex);
            result.array[row][column] = MultiArray.MultiArrayToScalar(block);
        }
        result.isCell = true;
        return result;
    };

    /**
     * Normalize one `mat2cell` partition vector and validate its sum.
     */
    private static readonly mat2cellPartition = (value: ElementType, expectedTotal: number, argumentIndex: number): number[] => {
        const partition = MultiArray.linearize(MultiArray.scalarToMultiArray(value)).map((item) => {
            if (!Complex.isInstanceOf(item)) {
                throw new EvalError(`mat2cell: argument ${argumentIndex} must contain nonnegative integer sizes.`);
            }
            const size = Complex.realToNumber(item);
            if (!Number.isInteger(size) || size < 0 || Complex.imagToNumber(item) !== 0) {
                throw new EvalError(`mat2cell: argument ${argumentIndex} must contain nonnegative integer sizes.`);
            }
            return size;
        });
        if (partition.reduce((sum, size) => sum + size, 0) !== expectedTotal) {
            throw new EvalError(`mat2cell: argument ${argumentIndex} dimensions do not sum to input size.`);
        }
        return partition;
    };

    public static readonly randSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 0 },
            {
                arity: 1,
                parameters: [
                    {
                        name: 'dimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                        alternatives: [{ name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] }],
                    },
                ],
            },
            {
                arity: -2,
                min: 2,
                parameters: [{ name: 'dimension', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], variadic: true }],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Uniformly distributed pseudorandom numbers distributed on the
     * interval (0, 1).
     * @param dimension
     * @returns
     */
    public static readonly rand = (...dimension: ElementType[]): ElementType => {
        return CoreFunctions.newFilledEach(() => Complex.random(), ...dimension);
    };

    public static readonly randiSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 1,
                parameters: [
                    {
                        name: 'range',
                        alternatives: [
                            { name: 'imax', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] },
                            { name: 'bounds', classes: ['double'], validators: ['numeric', 'vector', 'twoElement', 'real', 'finite', 'integer'] },
                        ],
                    },
                ],
            },
            {
                arity: 2,
                parameters: [
                    {
                        name: 'range',
                        alternatives: [
                            { name: 'imax', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] },
                            { name: 'bounds', classes: ['double'], validators: ['numeric', 'vector', 'twoElement', 'real', 'finite', 'integer'] },
                        ],
                    },
                    {
                        name: 'dimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'],
                        alternatives: [{ name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] }],
                    },
                ],
            },
            {
                arity: -3,
                min: 3,
                parameters: [
                    {
                        name: 'range',
                        alternatives: [
                            { name: 'imax', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] },
                            { name: 'bounds', classes: ['double'], validators: ['numeric', 'vector', 'twoElement', 'real', 'finite', 'integer'] },
                        ],
                    },
                    { name: 'dimension', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], variadic: true },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static readonly randi = (range: ElementType, ...dimension: ElementType[]): ElementType => {
        let imin: ComplexType;
        let imax: ComplexType;
        if (MultiArray.isInstanceOf(range)) {
            const rangeLinearized = MultiArray.linearize(range) as ComplexType[];
            if (rangeLinearized.length === 2) {
                imin = rangeLinearized[0];
                imax = rangeLinearized[1];
            } else if (rangeLinearized.length > 0) {
                imin = Complex.zero();
                imax = rangeLinearized[0];
            } else {
                throw new Error('bounds(1): out of bound 0 (dimensions are 0x0)');
            }
        } else {
            imin = Complex.zero();
            imax = range as ComplexType;
        }
        if (!(Complex.realIsInteger(imin) && Complex.realIsInteger(imax))) {
            throw new Error(`randi: must be integer bounds.`);
        }
        if (Complex.gt(imax, imin)) {
            return CoreFunctions.newFilledEach(
                Complex.realEquals(imin, 0)
                    ? () => Complex.round(Complex.mul(imax, Complex.random()))
                    : () => Complex.round(Complex.add(Complex.mul(Complex.sub(imax, imin), Complex.random()), imin)),
                ...dimension,
            );
        } else {
            if (Complex.realEquals(imin, 0)) {
                throw new Error(`randi: require imax >= 1.`);
            } else {
                throw new Error(`randi: require imax > imin.`);
            }
        }
    };

    public static readonly catSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -2,
            min: 2,
            parameters: [
                { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                { name: 'array', variadic: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along dimension `DIM`.
     * @param DIM Dimension of concatenation.
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along dimension `DIM`.
     */
    public static readonly cat = (DIM: ElementType, ...ARRAY: ElementType[]): MultiArray => {
        CoreFunctions.validateObjectArrayConcatenation('cat', ARRAY);
        return MultiArray.concatenate(Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1, 'cat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    public static readonly horzcatSignature: BuiltInFunctionSignature = { inputs: { arity: -1, min: 0, parameters: [{ name: 'array', variadic: true }] }, outputs: { arity: 1 } };
    /**
     * Concatenate arrays horizontally.
     * @param ARRAY Arrays to concatenate horizontally.
     * @returns Concatenated arrays horizontally.
     */
    public static readonly horzcat = (...ARRAY: ElementType[]): MultiArray => {
        if (ARRAY.length === 0) {
            return MultiArray.emptyArray();
        }
        CoreFunctions.validateObjectArrayConcatenation('horzcat', ARRAY);
        return MultiArray.concatenate(1, 'horzcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    public static readonly vertcatSignature: BuiltInFunctionSignature = { inputs: { arity: -1, min: 0, parameters: [{ name: 'array', variadic: true }] }, outputs: { arity: 1 } };
    /**
     * Concatenate arrays vertically.
     * @param ARRAY Arrays to concatenate vertically.
     * @returns Concatenated arrays vertically.
     */
    public static readonly vertcat = (...ARRAY: ElementType[]): MultiArray => {
        if (ARRAY.length === 0) {
            return MultiArray.emptyArray();
        }
        CoreFunctions.validateObjectArrayConcatenation('vertcat', ARRAY);
        return MultiArray.concatenate(0, 'vertcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    public static readonly allSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly all = MultiArray.reduceFactory((p, c) => Complex.and(p as ComplexType, c as ComplexType), 'reduce', Complex.one());
    public static readonly anySignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly any = MultiArray.reduceFactory((p, c) => Complex.or(p as ComplexType, c as ComplexType), 'reduce', Complex.zero());
    public static readonly sumSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly sum = MultiArray.reduceFactory((p, c) => Complex.add(p as ComplexType, c as ComplexType), 'reduce', Complex.zero());
    public static readonly prodSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly prod = MultiArray.reduceFactory((p, c) => Complex.mul(p as ComplexType, c as ComplexType), 'reduce', Complex.one());
    public static readonly sumsqSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly sumsq = MultiArray.reduceFactory((p, c) => Complex.add(p as ComplexType, Complex.mul(c as ComplexType, c as ComplexType)), 'reduce', Complex.zero());
    public static readonly cumsumSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly cumsum = MultiArray.reduceFactory((acc, element) => Complex.add(acc as ComplexType, element as ComplexType), 'cumulative');
    public static readonly cumprodSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    public static readonly cumprod = MultiArray.reduceFactory((acc, element) => Complex.mul(acc as ComplexType, element as ComplexType), 'cumulative');
    public static readonly minSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: 2,
                parameters: [{ name: 'value' }, { name: 'valueOrDimension', classes: ['double'] }],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value' },
                    { name: 'empty', classes: ['double'], validators: ['empty'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                ],
            },
        ],
        outputs: { arity: -2 },
    };
    public static readonly min = MultiArray.reduceFactory('lt', 'comparison');
    public static readonly maxSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: 2,
                parameters: [{ name: 'value' }, { name: 'valueOrDimension', classes: ['double'] }],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value' },
                    { name: 'empty', classes: ['double'], validators: ['empty'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                ],
            },
        ],
        outputs: { arity: -2 },
    };
    public static readonly max = MultiArray.reduceFactory('gt', 'comparison');
    public static readonly cumminSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: -2 },
    };
    public static readonly cummin = MultiArray.reduceFactory('lt', 'cumcomparison');
    public static readonly cummaxSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: -2 },
    };
    public static readonly cummax = MultiArray.reduceFactory('gt', 'cumcomparison');

    public static readonly meanSignature: BuiltInFunctionSignature = {
        inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
        outputs: { arity: 1 },
    };
    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static readonly mean = (M: ElementType, DIM?: ElementType): ElementType => {
        const MA = MultiArray.scalarToMultiArray(M);
        const dim = typeof DIM !== 'undefined' ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(MA);
        const sumM = CoreFunctions.sum(MA, Complex.create(dim + 1));
        const sizeAlongDim = Complex.create(MA.dimension[dim]);
        return MultiArray.divideElementByScalar(sumM as ElementType, sizeAlongDim);
    };

    public static readonly varianceSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value' },
                    {
                        name: 'flagOrDimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'],
                        alternatives: [{ name: 'dimension', validators: ['dimensionGreaterThanOne'] }],
                    },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value' },
                    { name: 'flag', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     * Variance compatible with Octave var(A [, FLAG [, DIM]])
     * @param M
     * @param FLAG
     * @param DIM
     * @returns
     */
    public static readonly variance = (M: ElementType, FLAG?: ElementType, DIM?: ElementType): ElementType => {
        /* 1) Convert to MultiArray */
        const MA = MultiArray.scalarToMultiArray(M);
        /* 2) Interpret FLAG and DIM */
        let flag = 0; /* 0 = sample (N-1), 1 = population (N) */
        let dim: number;
        if (typeof FLAG !== 'undefined') {
            const firstFlag = MultiArray.firstElement(FLAG) as ComplexType;
            if (typeof DIM === 'undefined' && Complex.realIsInteger(firstFlag) && Complex.realToNumber(firstFlag) > 1) {
                dim = Complex.realToNumber(firstFlag) - 1;
            } else if (typeof DIM !== 'undefined') {
                flag = Complex.realToNumber(firstFlag) === 1 ? 1 : 0;
                const dimElem = MultiArray.firstElement(DIM) as ComplexType;
                dim = MultiArray.testInteger(dimElem, 'var', 'DIM', [1, Infinity]) - 1;
            } else {
                flag = Complex.realToNumber(firstFlag) === 1 ? 1 : 0;
                dim = MultiArray.firstNonSingleDimension(MA);
            }
        } else {
            /* FLAG undefined */
            if (typeof DIM !== 'undefined') {
                const dimElem = MultiArray.firstElement(DIM) as ComplexType;
                dim = MultiArray.testInteger(dimElem, 'var', 'DIM', [1, Infinity]) - 1;
            } else {
                dim = MultiArray.firstNonSingleDimension(MA);
            }
        }
        /* 3) Number of elements along chosen dimension */
        const N = MA.dimension[dim];
        if (N <= 1) {
            return Complex.zero();
        }
        /* 4) Sum along dim (possibly scalar) */
        const sumAlong = MultiArray.reduce(dim, MA, (p, c) => Complex.add(p as ComplexType, c as ComplexType), Complex.zero());
        const meanElem = MultiArray.divideElementByScalar(sumAlong, Complex.create(N));
        /* 5) Compute squared diffs */
        let outDim: number[];
        if (MultiArray.isInstanceOf(sumAlong)) {
            outDim = (sumAlong as MultiArray).dimension.slice();
        } else {
            outDim = MA.dimension.slice();
            outDim[dim] = 1;
        }
        const result = new MultiArray(outDim);
        const tailProd = outDim.length > 2 ? outDim.slice(2).reduce((p, c) => p * c, 1) : 1;
        const resultPhysicalRows = outDim[0] * Math.max(1, tailProd);
        const resultPhysicalCols = outDim[1] ?? 1;
        result.array = new Array(resultPhysicalRows);
        for (let r = 0; r < resultPhysicalRows; r++) {
            result.array[r] = new Array(resultPhysicalCols);
        }
        const totalElements = MA.dimension.reduce((p, c) => p * c, 1);
        for (let linIdx = 0; linIdx < totalElements; linIdx++) {
            const subs = MultiArray.linearIndexToSubscript(MA.dimension, linIdx);
            const meanSub = subs.slice();
            meanSub[dim] = 1;

            let meanVal: ComplexType;
            if (MultiArray.isInstanceOf(meanElem)) {
                const meanMA = meanElem as MultiArray;
                const meanLinear = MultiArray.subscriptToLinearIndex(meanMA.dimension, meanSub);
                const [mr, mc] = MultiArray.linearIndexToMultiArrayRowColumn(meanMA.dimension[0], meanMA.dimension[1], meanLinear);
                meanVal = meanMA.array[mr][mc] as ComplexType;
            } else {
                meanVal = meanElem as ComplexType;
            }
            const [ar, ac] = MultiArray.linearIndexToMultiArrayRowColumn(MA.dimension[0], MA.dimension[1], linIdx);
            const curVal = MA.array[ar][ac] as ComplexType;
            const diff = Complex.sub(curVal, meanVal);
            const sq = Complex.mul(diff, diff);
            const outLinear = MultiArray.subscriptToLinearIndex(outDim, meanSub);
            const [orow, ocol] = MultiArray.linearIndexToMultiArrayRowColumn(outDim[0], outDim[1], outLinear);
            const prev = result.array[orow][ocol];
            if (typeof prev === 'undefined' || prev === null) {
                result.array[orow][ocol] = Complex.copy(sq);
            } else {
                result.array[orow][ocol] = Complex.add(prev as ComplexType, sq);
            }
        }
        /* 6) Divide by (N - (1 - flag)) */
        const divisor = Complex.create(N - (flag === 0 ? 1 : 0));
        const varianceElem = MultiArray.divideElementByScalar(result, divisor);
        if (MultiArray.isInstanceOf(varianceElem)) MultiArray.setType(varianceElem);
        return varianceElem;
    };

    public static readonly stdSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value' }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value' },
                    {
                        name: 'flagOrDimension',
                        classes: ['double'],
                        validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'],
                        alternatives: [{ name: 'dimension', validators: ['dimensionGreaterThanOne'] }],
                    },
                ],
            },
            {
                arity: 3,
                parameters: [
                    { name: 'value' },
                    { name: 'flag', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     *
     * @param M
     * @param FLAG
     * @param DIM
     * @returns
     */
    public static readonly std = (M: ElementType, FLAG?: ElementType, DIM?: ElementType): ElementType => {
        const varElem = CoreFunctions.variance(M, FLAG, DIM);
        if (MultiArray.isInstanceOf(varElem)) {
            const stdMA = MultiArray.rawMap(varElem as MultiArray, (el: ComplexType) => Complex.sqrt(el));
            MultiArray.setType(stdMA);
            return stdMA;
        } else {
            return Complex.sqrt(varElem as ComplexType);
        }
    };

    public static readonly structSignature: BuiltInFunctionSignature = {
        inputs: [
            {
                arity: 1,
                parameters: [
                    {
                        name: 'structOrEmptyArray',
                        alternatives: [
                            { name: 'field', classes: ['char', 'string'] },
                            { name: 'struct', classes: ['struct'] },
                            { name: 'emptyArray', classes: ['double', 'cell', 'array'] },
                        ],
                    },
                ],
            },
            {
                arity: -1,
                min: 0,
                parameters: [
                    {
                        name: 'field',
                        variadic: true,
                        variadicGroup: [{ name: 'field', classes: ['char', 'string'] }, { name: 'value' }],
                    },
                ],
            },
        ],
        outputs: { arity: 1 },
    };
    /**
     *
     * @param args
     * @returns
     */
    public static readonly struct = (...args: ElementType[]): ElementType => {
        const errorMessage = `struct: additional arguments must occur as "field", VALUE pairs`;
        if (args.length === 0) {
            return new Structure({});
        } else if (args.length === 1) {
            if (MultiArray.isInstanceOf(args[0]) && MultiArray.isEmpty(args[0])) {
                return MultiArray.emptyArray();
            } else if (Structure.isInstanceOf(args[0])) {
                return (args[0] as Structure).copy();
            } else {
                throw new Error(errorMessage);
            }
        } else {
            if (args.length % 2 !== 0) {
                throw new Error(errorMessage);
            }
            const resultFields: Record<string, StructureFieldValue> = {};
            for (let i = 0; i < args.length; i += 2) {
                if (CharString.isInstanceOf(args[i])) {
                    const value = runtimeExpressionValue(args[i + 1], (args[i] as CharString).str, 'struct field', () => {
                        throw new Error(errorMessage);
                    });
                    resultFields[(args[i] as CharString).str] = value;
                } else {
                    throw new Error(errorMessage);
                }
            }
            return new Structure(resultFields);
        }
    };

    /** Signature metadata for `substruct`. */
    public static readonly substructSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -1,
            min: 2,
            parameters: [
                {
                    name: 'typeAndSubscript',
                    variadic: true,
                    variadicGroup: [{ name: 'type', classes: ['char', 'string'] }, { name: 'subscript' }],
                },
            ],
        },
        outputs: { arity: 1 },
    };

    /**
     * Build a MATLAB-compatible subscript descriptor structure.
     *
     * The descriptor uses the public `substruct` shape: each element has a
     * character `type` field (`'.'`, `'()'`, or `'{}'`). Dot descriptors store
     * the field name directly in `subs`; parenthesis and brace descriptors
     * store a cell-array of subscript values.
     *
     * @param args Alternating type/subscript arguments.
     * @returns A scalar descriptor or a row structure array of descriptors.
     * @throws Error when the type/subscript pairs are malformed.
     */
    public static readonly substruct = (...args: ElementType[]): ElementType => {
        const errorMessage = `substruct: arguments must occur as TYPE, SUBS pairs`;
        if (args.length < 2 || args.length % 2 !== 0) {
            throw new Error(errorMessage);
        }

        const descriptors: Structure[] = [];
        for (let i = 0; i < args.length; i += 2) {
            const typeValue = args[i];
            const subsValue = args[i + 1];
            if (!CharString.isInstanceOf(typeValue)) {
                throw new Error(errorMessage);
            }

            descriptors.push(CoreFunctions.createSubstructDescriptor(typeValue.str, subsValue));
        }

        return descriptors.length === 1 ? descriptors[0] : MultiArray.firstRow(descriptors);
    };

    /**
     * Create one `substruct` descriptor element.
     *
     * @param type Subscript delimiter type.
     * @param subs Raw subscript argument.
     * @returns Descriptor structure with `type` and `subs` fields.
     */
    private static readonly createSubstructDescriptor = (type: string, subs: ElementType): Structure => {
        switch (type) {
            case '.':
                if (!CharString.isInstanceOf(subs)) {
                    throw new Error('substruct: dot subscripts must be character strings.');
                }
                return new Structure({ type: CharString.create(type), subs: subs.copy() });
            case '()':
            case '{}':
                if (!MultiArray.isInstanceOf(subs) || !subs.isCell) {
                    throw new Error(`substruct: ${type} subscripts must be supplied as a cell array.`);
                }
                return new Structure({ type: CharString.create(type), subs: subs.copy() });
            default:
                throw new Error("substruct: TYPE must be '.', '()', or '{}'.");
        }
    };

    public static readonly normSignature: BuiltInFunctionSignature = {
        inputs: [
            { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
            {
                arity: 2,
                parameters: [
                    { name: 'value', classes: ['double'] },
                    {
                        name: 'order',
                        alternatives: [
                            { name: 'numericOrder', classes: ['double'], validators: ['numeric', 'scalar', 'real'] },
                            { name: 'frobeniusOrder', classes: ['char', 'string'], allowedStrings: ['fro'] },
                        ],
                    },
                ],
            },
        ],
        outputs: { arity: 1 },
    };

    private static readonly isNonVectorMatrix2d = (value: ElementType): value is MultiArray =>
        MultiArray.isInstanceOf(value) && value.dimension.length === 2 && value.dimension[0] > 1 && value.dimension[1] > 1;

    private static readonly matrixNorm1 = (matrix: MultiArray): ComplexType => {
        let max = 0;
        for (let column = 0; column < matrix.dimension[1]; column++) {
            let sum = 0;
            for (let row = 0; row < matrix.dimension[0]; row++) {
                sum += Complex.realToNumber(Complex.abs(matrix.array[row][column] as ComplexType));
            }
            max = Math.max(max, sum);
        }
        return Complex.create(max);
    };

    private static readonly matrixNormInf = (matrix: MultiArray): ComplexType => {
        let max = 0;
        for (let row = 0; row < matrix.dimension[0]; row++) {
            let sum = 0;
            for (let column = 0; column < matrix.dimension[1]; column++) {
                sum += Complex.realToNumber(Complex.abs(matrix.array[row][column] as ComplexType));
            }
            max = Math.max(max, sum);
        }
        return Complex.create(max);
    };

    private static readonly matrixNorm2 = (matrix: MultiArray): ComplexType => {
        const columns = matrix.dimension[1];
        const gram: ComplexType[][] = Array.from({ length: columns }, () => Array.from({ length: columns }, () => Complex.zero()));
        for (let column = 0; column < columns; column++) {
            for (let otherColumn = column; otherColumn < columns; otherColumn++) {
                let sum = Complex.zero();
                for (let row = 0; row < matrix.dimension[0]; row++) {
                    sum = Complex.add(sum, Complex.mul(Complex.conj(matrix.array[row][column] as ComplexType), matrix.array[row][otherColumn] as ComplexType));
                }
                gram[column][otherColumn] = sum;
                gram[otherColumn][column] = column === otherColumn ? sum : Complex.conj(sum);
            }
        }
        const { D } = LAPACK.jacobi_symmetric_hermitian(gram, 1000, 1e-14);
        const largest = D.reduce((max, value) => Math.max(max, Complex.realToNumber(value)), 0);
        return Complex.sqrt(Complex.create(Math.max(0, largest)));
    };

    public static readonly norm = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('norm', args.length < 1 || args.length > 2);
        const value = args[0];
        const absValues = (MultiArray.linearize(MultiArray.scalarToMultiArray(value)) as ComplexType[]).map((item) => Complex.abs(item));
        const normOrder = args.length === 2 ? args[1] : Complex.create(2);
        if (CharString.isInstanceOf(normOrder)) {
            if (normOrder.str !== 'fro') {
                AST.throwInvalidCallError('norm');
            }
            return Complex.sqrt(absValues.reduce((sum, value) => Complex.add(sum, Complex.mul(value, value)), Complex.zero()));
        }
        const p = Complex.realToNumber(MultiArray.firstElement(normOrder) as ComplexType);
        if (p === Infinity) {
            if (CoreFunctions.isNonVectorMatrix2d(value)) {
                return CoreFunctions.matrixNormInf(value);
            }
            return absValues.reduce((max, value) => (Complex.realToNumber(value) > Complex.realToNumber(max) ? value : max), Complex.zero());
        } else if (p === -Infinity) {
            if (CoreFunctions.isNonVectorMatrix2d(value)) {
                AST.throwInvalidCallError('norm');
            }
            if (absValues.length === 0) {
                return Complex.zero();
            }
            return absValues.reduce((min, value) => (Complex.realToNumber(value) < Complex.realToNumber(min) ? value : min), Complex.inf_0());
        } else if (p === 1) {
            if (CoreFunctions.isNonVectorMatrix2d(value)) {
                return CoreFunctions.matrixNorm1(value);
            }
            return absValues.reduce((sum, value) => Complex.add(sum, value), Complex.zero());
        } else if (p === 2) {
            if (CoreFunctions.isNonVectorMatrix2d(value)) {
                return CoreFunctions.matrixNorm2(value);
            }
            return Complex.sqrt(absValues.reduce((sum, value) => Complex.add(sum, Complex.mul(value, value)), Complex.zero()));
        } else if (p > 0 && Number.isFinite(p)) {
            if (CoreFunctions.isNonVectorMatrix2d(value)) {
                AST.throwInvalidCallError('norm');
            }
            const sum = absValues.reduce((acc, value) => Complex.add(acc, Complex.power(value, Complex.create(p))), Complex.zero());
            return Complex.power(sum, Complex.create(1 / p));
        } else {
            AST.throwInvalidCallError('norm');
        }
    };

    /**
     * User functions.
     */
    public static readonly functions: Record<keyof CoreFunctions | string, FunctionSignatureEntry> = {
        isempty: { func: CoreFunctions.isempty, signature: CoreFunctions.isemptySignature },
        isscalar: { func: CoreFunctions.isscalar, signature: CoreFunctions.isscalarSignature },
        ismatrix: { func: CoreFunctions.ismatrix, signature: CoreFunctions.ismatrixSignature },
        isvector: { func: CoreFunctions.isvector, signature: CoreFunctions.isvectorSignature },
        iscell: { func: CoreFunctions.iscell, signature: CoreFunctions.iscellSignature },
        isrow: { func: CoreFunctions.isrow, signature: CoreFunctions.isrowSignature },
        iscolumn: { func: CoreFunctions.iscolumn, signature: CoreFunctions.iscolumnSignature },
        isstruct: { func: CoreFunctions.isstruct, signature: CoreFunctions.isstructSignature },
        issparse: { func: CoreFunctions.issparse, signature: CoreFunctions.issparseSignature },
        full: { func: CoreFunctions.full, signature: CoreFunctions.fullSignature },
        sparse: { func: CoreFunctions.sparse, signature: CoreFunctions.sparseSignature },
        spalloc: { func: CoreFunctions.spalloc, signature: CoreFunctions.spallocSignature },
        nnz: { func: CoreFunctions.nnz, signature: CoreFunctions.nnzSignature },
        nzmax: { func: CoreFunctions.nzmax, signature: CoreFunctions.nzmaxSignature },
        nonzeros: { func: CoreFunctions.nonzeros, signature: CoreFunctions.nonzerosSignature },
        ischar: { func: CoreFunctions.ischar, signature: CoreFunctions.ischarSignature },
        isstring: { func: CoreFunctions.isstring, signature: CoreFunctions.isstringSignature },
        iscellstr: { func: CoreFunctions.iscellstr, signature: CoreFunctions.iscellstrSignature },
        cellstr: { func: CoreFunctions.cellstr, signature: CoreFunctions.cellstrSignature },
        char: { func: CoreFunctions.char, signature: CoreFunctions.charSignature },
        double: { func: CoreFunctions.double, signature: CoreFunctions.doubleSignature },
        logical: { func: CoreFunctions.logical, signature: CoreFunctions.logicalSignature },
        isnan: { func: CoreFunctions.isnan, signature: CoreFunctions.isnanSignature },
        isinf: { func: CoreFunctions.isinf, signature: CoreFunctions.isinfSignature },
        isfinite: { func: CoreFunctions.isfinite, signature: CoreFunctions.isfiniteSignature },
        isfloat: { func: CoreFunctions.isfloat, signature: CoreFunctions.isfloatSignature },
        isinteger: { func: CoreFunctions.isinteger, signature: CoreFunctions.isintegerSignature },
        isnumeric: { func: CoreFunctions.isnumeric, signature: CoreFunctions.isnumericSignature },
        islogical: { func: CoreFunctions.islogical, signature: CoreFunctions.islogicalSignature },
        isreal: { func: CoreFunctions.isreal, signature: CoreFunctions.isrealSignature },
        isvalid: { func: CoreFunctions.isvalid, signature: CoreFunctions.isvalidSignature },
        isobject: { func: CoreFunctions.isobject, signature: CoreFunctions.isobjectSignature },
        properties: { func: CoreFunctions.properties, signature: CoreFunctions.propertiesSignature },
        fieldnames: { func: CoreFunctions.fieldnames, signature: CoreFunctions.fieldnamesSignature },
        isfield: { func: CoreFunctions.isfield, signature: CoreFunctions.isfieldSignature },
        methods: { func: CoreFunctions.methods, signature: CoreFunctions.methodsSignature },
        events: { func: CoreFunctions.events, signature: CoreFunctions.eventsSignature },
        enumeration: { func: CoreFunctions.enumeration, signature: CoreFunctions.enumerationSignature },
        superclasses: { func: CoreFunctions.superclasses, signature: CoreFunctions.superclassesSignature },
        isprop: { func: CoreFunctions.isprop, signature: CoreFunctions.ispropSignature },
        ismethod: { func: CoreFunctions.ismethod, signature: CoreFunctions.ismethodSignature },
        isequal: { func: CoreFunctions.isequal, signature: CoreFunctions.isequalSignature },
        ndims: { func: CoreFunctions.ndims, signature: CoreFunctions.ndimsSignature },
        rows: { func: CoreFunctions.rows, signature: CoreFunctions.rowsSignature },
        columns: { func: CoreFunctions.columns, signature: CoreFunctions.columnsSignature },
        length: { func: CoreFunctions.Length, signature: CoreFunctions.lengthSignature },
        numel: { func: CoreFunctions.numel, signature: CoreFunctions.numelSignature },
        find: { func: CoreFunctions.find, signature: CoreFunctions.findSignature },
        sort: { func: CoreFunctions.sort, signature: CoreFunctions.sortSignature },
        ind2sub: { func: CoreFunctions.ind2sub, signature: CoreFunctions.ind2subSignature },
        sub2ind: { func: CoreFunctions.sub2ind, signature: CoreFunctions.sub2indSignature },
        size: { func: CoreFunctions.size, signature: CoreFunctions.sizeSignature },
        colon: { func: CoreFunctions.colon, signature: CoreFunctions.colonSignature },
        linspace: { func: CoreFunctions.linspace, signature: CoreFunctions.linspaceSignature },
        logspace: { func: CoreFunctions.logspace, signature: CoreFunctions.logspaceSignature },
        meshgrid: { func: CoreFunctions.meshgrid, signature: CoreFunctions.meshgridSignature },
        ndgrid: { func: CoreFunctions.ndgrid, signature: CoreFunctions.ndgridSignature },
        repmat: { func: CoreFunctions.repmat, signature: CoreFunctions.repmatSignature },
        reshape: { func: CoreFunctions.reshape, signature: CoreFunctions.reshapeSignature },
        squeeze: { func: CoreFunctions.squeeze, signature: CoreFunctions.squeezeSignature },
        flip: { func: CoreFunctions.flip, signature: CoreFunctions.flipSignature },
        fliplr: { func: CoreFunctions.fliplr, signature: CoreFunctions.fliplrSignature },
        flipud: { func: CoreFunctions.flipud, signature: CoreFunctions.flipudSignature },
        rot90: { func: CoreFunctions.rot90, signature: CoreFunctions.rot90Signature },
        permute: { func: CoreFunctions.permute, signature: CoreFunctions.permuteSignature },
        ipermute: { func: CoreFunctions.ipermute, signature: CoreFunctions.ipermuteSignature },
        circshift: { func: CoreFunctions.circshift, signature: CoreFunctions.circshiftSignature },
        shiftdim: { func: CoreFunctions.shiftdim, signature: CoreFunctions.shiftdimSignature },
        zeros: { func: CoreFunctions.zeros, signature: CoreFunctions.zerosSignature },
        ones: { func: CoreFunctions.ones, signature: CoreFunctions.onesSignature },
        cell: { func: CoreFunctions.cell, signature: CoreFunctions.cellSignature },
        num2cell: { func: CoreFunctions.num2cell, signature: CoreFunctions.num2cellSignature },
        cell2mat: { func: CoreFunctions.cell2mat, signature: CoreFunctions.cell2matSignature },
        mat2cell: { func: CoreFunctions.mat2cell, signature: CoreFunctions.mat2cellSignature },
        rand: { func: CoreFunctions.rand, signature: CoreFunctions.randSignature },
        randi: { func: CoreFunctions.randi, signature: CoreFunctions.randiSignature },
        cat: { func: CoreFunctions.cat, signature: CoreFunctions.catSignature },
        horzcat: { func: CoreFunctions.horzcat, signature: CoreFunctions.horzcatSignature },
        vertcat: { func: CoreFunctions.vertcat, signature: CoreFunctions.vertcatSignature },
        all: { func: CoreFunctions.all, signature: CoreFunctions.allSignature },
        any: { func: CoreFunctions.any, signature: CoreFunctions.anySignature },
        sum: { func: CoreFunctions.sum, signature: CoreFunctions.sumSignature },
        prod: { func: CoreFunctions.prod, signature: CoreFunctions.prodSignature },
        sumsq: { func: CoreFunctions.sumsq, signature: CoreFunctions.sumsqSignature },
        max: { func: CoreFunctions.max, signature: CoreFunctions.maxSignature },
        min: { func: CoreFunctions.min, signature: CoreFunctions.minSignature },
        mean: { func: CoreFunctions.mean, signature: CoreFunctions.meanSignature },
        cumsum: { func: CoreFunctions.cumsum, signature: CoreFunctions.cumsumSignature },
        cumprod: { func: CoreFunctions.cumprod, signature: CoreFunctions.cumprodSignature },
        cummin: { func: CoreFunctions.cummin, signature: CoreFunctions.cumminSignature },
        cummax: { func: CoreFunctions.cummax, signature: CoreFunctions.cummaxSignature },
        var: { func: CoreFunctions.variance, signature: CoreFunctions.varianceSignature },
        std: { func: CoreFunctions.std, signature: CoreFunctions.stdSignature },
        struct: { func: CoreFunctions.struct, signature: CoreFunctions.structSignature },
        getfield: { func: CoreFunctions.getfield, signature: CoreFunctions.getfieldSignature },
        setfield: { func: CoreFunctions.setfield, signature: CoreFunctions.setfieldSignature },
        rmfield: { func: CoreFunctions.rmfield, signature: CoreFunctions.rmfieldSignature },
        orderfields: { func: CoreFunctions.orderfields, signature: CoreFunctions.orderfieldsSignature },
        numfields: { func: CoreFunctions.numfields, signature: CoreFunctions.numfieldsSignature },
        struct2cell: { func: CoreFunctions.struct2cell, signature: CoreFunctions.struct2cellSignature },
        cell2struct: { func: CoreFunctions.cell2struct, signature: CoreFunctions.cell2structSignature },
        substruct: { func: CoreFunctions.substruct, signature: CoreFunctions.substructSignature },
        norm: { func: CoreFunctions.norm, signature: CoreFunctions.normSignature },
    };
}

export { CoreFunctions };
export default { CoreFunctions };
