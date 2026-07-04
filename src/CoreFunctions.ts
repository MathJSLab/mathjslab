import { CharString } from './CharString';
import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { type BuiltInFunctionSignature, type NodeReturnList, AST, ReturnHandlerResult } from './AST';

abstract class CoreFunctions {
    /**
     *
     * @param name
     * @param M
     */
    public static readonly throwErrorIfCellArray = (name: string, M: MultiArray | ComplexType): void => {
        if (MultiArray.isInstanceOf(M) && (M as MultiArray).isCell) {
            throw new Error(`${name}: wrong type argument 'cell'`);
        }
    };

    /**
     * Return true if M is an empty matrix
     * @param X
     * @returns
     */
    public static readonly isempty = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isempty', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isEmpty(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a scalar.
     * @param X
     * @returns
     */
    public static readonly isscalar = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isscalar', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isScalar(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a 2-D array.
     * @param X
     * @returns
     */
    public static readonly ismatrix = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ismatrix', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isMatrix(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a vector.
     * @param X
     * @returns
     */
    public static readonly isvector = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isvector', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isVector(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a cell array object.
     * @param M
     * @returns
     */
    public static readonly iscell = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('iscell', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isCellArray(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a row vector.
     * @param X
     * @returns
     */
    public static readonly isrow = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isrow', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isRowVector(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static readonly iscolumn = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('iscolumn', !(typeof X !== 'undefined' && rest.length === 0));
        return MultiArray.isColumnVector(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static readonly isstruct = (X?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('isstruct', !(typeof X !== 'undefined' && rest.length === 0));
        return Structure.isStructure(X) ? Complex.true() : Complex.false();
    };

    /**
     * Return the number of dimensions of M.
     * @param M
     * @returns
     */
    public static readonly ndims = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('ndims', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension.length);
    };

    /**
     * eturn the number of rows of M.
     * @param M
     * @returns
     */
    public static readonly rows = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('rows', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension[0]);
    };

    /**
     * Return the number of columns of M.
     * @param M
     * @returns
     */
    public static readonly columns = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        AST.throwInvalidCallError('columns', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension[1]);
    };

    /**
     * Return the length of the object M. The length is the number of elements
     * along the largest dimension.
     * @param M
     * @returns
     */
    public static readonly Length = (M?: ElementType, ...rest: unknown[]): ComplexType => {
        /* Capitalized name so as not to conflict with the built-in 'Function.length' property. */
        AST.throwInvalidCallError('length', !(typeof M !== 'undefined' && rest.length === 0));
        return Complex.create(Math.max(...MultiArray.scalarToMultiArray(M).dimension));
    };

    /**
     *
     * @param M
     * @param IDX
     * @returns
     */
    public static readonly numel = (M: ElementType, ...IDX: ElementType[]): ComplexType => {
        if (IDX.length === 0) {
            return MultiArray.isInstanceOf(M) ? Complex.create(MultiArray.linearLength(M as MultiArray)) : Complex.one();
        } else {
            const m = MultiArray.scalarToMultiArray(M);
            const index = IDX.map((idx, i) => {
                if (MultiArray.isInstanceOf(idx)) {
                    return MultiArray.linearLength(idx as MultiArray);
                } else if (CharString.isInstanceOf(idx) && (idx as CharString).str === ':') {
                    return i < m.dimension.length ? m.dimension[i] : 1;
                } else {
                    return 1;
                }
            });
            return Complex.create(index.reduce((p, c) => p * c, 1));
        }
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
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): ElementType => {
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
                    return MultiArray.emptyArray();
            }
        });
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
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): ElementType =>
            index === 0 || evaluated.length === 1 ? MultiArray.MultiArrayToScalar(sorted) : MultiArray.MultiArrayToScalar(indices),
        );
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
        const sizeDim = MultiArray.isInstanceOf(M) ? (M as MultiArray).dimension.slice() : [1, 1];
        if (DIM.length === 0) {
            const result = new MultiArray([1, sizeDim.length]);
            result.array[0] = sizeDim.map((d) => Complex.create(d));
            result.type = Complex.REAL;
            return result;
        } else {
            const dims =
                DIM.length === 1 && MultiArray.isInstanceOf(DIM[0])
                    ? (MultiArray.linearize(DIM[0]) as ComplexType[]).map((dim) => parseDimension(dim))
                    : DIM.map((dim: any) => parseDimension(MultiArray.firstElement(dim) as ComplexType));
            MultiArray.appendSingletonTail(sizeDim, Math.max(...dims));
            const result = new MultiArray([1, dims.length]);
            result.array[0] = dims.map((dim: number) => Complex.create(sizeDim[dim - 1]));
            result.type = Complex.REAL;
            return MultiArray.MultiArrayToScalar(result);
        }
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

    /**
     * Return a row vector with linearly spaced elements.
     * @param args
     * @returns
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

    /**
     * Return a row vector with elements logarithmically spaced.
     * @param args
     * @returns
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
            AST.throwInvalidCallError('linspace');
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
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): ElementType => {
            if (evaluated.length > 3) {
                throw new Error('meshgrid: function called with too many outputs.');
            }
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
                throw new Error('ndgrid: function called with too many outputs.');
            }
            const shape: number[] = args.map((M) => M.dimension[0] * M.dimension[1]);
            const r: number[] = new Array(args.length).fill(1);
            r[index] = shape[index];
            shape[index] = 1;
            return MultiArray.evaluate(new MultiArray(shape, MultiArray.reshape(args[index], r)));
        });
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
        return MultiArray.evaluate(
            new MultiArray(
                dimension.map((value) => Complex.realToNumber(value as ComplexType)),
                A,
            ),
        );
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
        const m = MultiArray.scalarToMultiArray(M);
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

    /**
     * Remove singleton dimensions.
     * @param args
     * @returns
     */
    public static readonly squeeze = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('squeeze', args.length !== 1);
        if (MultiArray.isInstanceOf(args[0]) && !(args[0] as MultiArray).isCell) {
            if ((args[0] as MultiArray).dimension.length > 2) {
                return MultiArray.reshape(
                    args[0] as MultiArray,
                    (args[0] as MultiArray).dimension.filter((value) => value !== 1),
                );
            } else {
                return args[0];
            }
        } else {
            return args[0];
        }
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

    /**
     * Create array of all zeros.
     * @param dimension
     * @returns
     */
    public static readonly zeros = (...dimension: ElementType[]): ElementType => {
        return CoreFunctions.newFilled(Complex.zero(), 'zeros', ...dimension);
    };

    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static readonly ones = (...dimension: ElementType[]): ElementType => {
        return CoreFunctions.newFilled(Complex.one(), 'ones', ...dimension);
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

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along dimension `DIM`.
     * @param DIM Dimension of concatenation.
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along dimension `DIM`.
     */
    public static readonly cat = (DIM: ElementType, ...ARRAY: ElementType[]): MultiArray => {
        return MultiArray.concatenate(Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1, 'cat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    /**
     * Concatenate arrays horizontally.
     * @param ARRAY Arrays to concatenate horizontally.
     * @returns Concatenated arrays horizontally.
     */
    public static readonly horzcat = (...ARRAY: ElementType[]): MultiArray => {
        if (ARRAY.length === 0) {
            return MultiArray.emptyArray();
        }
        return MultiArray.concatenate(1, 'horzcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    /**
     * Concatenate arrays vertically.
     * @param ARRAY Arrays to concatenate vertically.
     * @returns Concatenated arrays vertically.
     */
    public static readonly vertcat = (...ARRAY: ElementType[]): MultiArray => {
        if (ARRAY.length === 0) {
            return MultiArray.emptyArray();
        }
        return MultiArray.concatenate(0, 'vertcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    };

    public static readonly all = MultiArray.reduceFactory((p, c) => Complex.and(p as ComplexType, c as ComplexType), 'reduce', Complex.one());
    public static readonly any = MultiArray.reduceFactory((p, c) => Complex.or(p as ComplexType, c as ComplexType), 'reduce', Complex.zero());
    public static readonly sum = MultiArray.reduceFactory((p, c) => Complex.add(p as ComplexType, c as ComplexType), 'reduce', Complex.zero());
    public static readonly prod = MultiArray.reduceFactory((p, c) => Complex.mul(p as ComplexType, c as ComplexType), 'reduce', Complex.one());
    public static readonly sumsq = MultiArray.reduceFactory((p, c) => Complex.add(p as ComplexType, Complex.mul(c as ComplexType, c as ComplexType)), 'reduce', Complex.zero());
    public static readonly cumsum = MultiArray.reduceFactory((acc, element) => Complex.add(acc as ComplexType, element as ComplexType), 'cumulative');
    public static readonly cumprod = MultiArray.reduceFactory((acc, element) => Complex.mul(acc as ComplexType, element as ComplexType), 'cumulative');
    public static readonly min = MultiArray.reduceFactory('lt', 'comparison');
    public static readonly max = MultiArray.reduceFactory('gt', 'comparison');
    public static readonly cummin = MultiArray.reduceFactory('lt', 'cumcomparison');
    public static readonly cummax = MultiArray.reduceFactory('gt', 'cumcomparison');

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
            const resultFields: Record<string, ElementType> = {};
            for (let i = 0; i < args.length; i += 2) {
                if (CharString.isInstanceOf(args[i])) {
                    resultFields[(args[i] as CharString).str] = args[i + 1];
                } else {
                    throw new Error(errorMessage);
                }
            }
            return new Structure(resultFields);
        }
    };

    public static readonly norm = (...args: ElementType[]): ElementType => {
        AST.throwInvalidCallError('norm', args.length < 1 || args.length > 2);
        const absValues = (MultiArray.linearize(MultiArray.scalarToMultiArray(args[0])) as ComplexType[]).map((value) => Complex.abs(value));
        const normOrder = args.length === 2 ? args[1] : Complex.create(2);
        if (CharString.isInstanceOf(normOrder)) {
            if (normOrder.str !== 'fro') {
                AST.throwInvalidCallError('norm');
            }
            return Complex.sqrt(absValues.reduce((sum, value) => Complex.add(sum, Complex.mul(value, value)), Complex.zero()));
        }
        const p = Complex.realToNumber(MultiArray.firstElement(normOrder) as ComplexType);
        if (p === Infinity) {
            return absValues.reduce((max, value) => (Complex.realToNumber(value) > Complex.realToNumber(max) ? value : max), Complex.zero());
        } else if (p === 1) {
            return absValues.reduce((sum, value) => Complex.add(sum, value), Complex.zero());
        } else if (p === 2) {
            return Complex.sqrt(absValues.reduce((sum, value) => Complex.add(sum, Complex.mul(value, value)), Complex.zero()));
        } else if (p > 0 && Number.isFinite(p)) {
            const sum = absValues.reduce((acc, value) => Complex.add(acc, Complex.power(value, Complex.create(p))), Complex.zero());
            return Complex.power(sum, Complex.create(1 / p));
        } else {
            AST.throwInvalidCallError('norm');
        }
    };

    public static readonly signatures: Record<string, BuiltInFunctionSignature> = {
        isempty: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        isscalar: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        ismatrix: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        isvector: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        iscell: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        isrow: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        iscolumn: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        isstruct: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        ndims: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        rows: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        columns: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        length: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        numel: { inputs: { arity: -2, min: 1, parameters: [{ name: 'value' }, { name: 'index', variadic: true }] }, outputs: { arity: 1 } },
        find: {
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
                        { name: 'direction', classes: ['char'], allowedStrings: ['first', 'last'] },
                    ],
                },
            ],
            outputs: { arity: -3 },
        },
        sort: {
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
                                { name: 'direction', classes: ['char'], allowedStrings: ['ascend', 'descend'] },
                            ],
                        },
                    ],
                },
                {
                    arity: 3,
                    parameters: [
                        { name: 'value', classes: ['double'] },
                        { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                        { name: 'direction', classes: ['char'], allowedStrings: ['ascend', 'descend'] },
                    ],
                },
            ],
            outputs: { arity: -2 },
        },
        ind2sub: {
            inputs: {
                arity: 2,
                parameters: [
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        alternatives: [
                            { name: 'dimension', validators: ['dimension'] },
                            { name: 'dimensions', validators: ['dimensionVector'] },
                        ],
                    },
                    { name: 'index', classes: ['double'], validators: ['numeric', 'real', 'finite', 'integer', 'positive'] },
                ],
            },
            outputs: { arity: -1 },
        },
        sub2ind: {
            inputs: {
                arity: -2,
                min: 2,
                parameters: [
                    {
                        name: 'dimensions',
                        classes: ['double'],
                        alternatives: [
                            { name: 'dimension', validators: ['dimension'] },
                            { name: 'dimensions', validators: ['dimensionVector'] },
                        ],
                    },
                    { name: 'subscript', classes: ['double'], validators: ['numeric', 'real', 'finite', 'integer', 'positive'], variadic: true },
                ],
            },
            outputs: { arity: 1 },
        },
        size: {
            inputs: [
                { arity: 1, parameters: [{ name: 'value' }] },
                {
                    arity: -2,
                    min: 2,
                    parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['numeric', 'positive', 'integer', 'real'], variadic: true }],
                },
            ],
            outputs: { arity: -1 },
        },
        zeros: {
            inputs: [
                { arity: 0 },
                {
                    arity: 1,
                    parameters: [
                        {
                            name: 'dimension',
                            classes: ['double'],
                            alternatives: [
                                { name: 'dimension', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                                { name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
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
        },
        ones: {
            inputs: [
                { arity: 0 },
                {
                    arity: 1,
                    parameters: [
                        {
                            name: 'dimension',
                            classes: ['double'],
                            alternatives: [
                                { name: 'dimension', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                                { name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
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
        },
        rand: {
            inputs: [
                { arity: 0 },
                {
                    arity: 1,
                    parameters: [
                        {
                            name: 'dimension',
                            classes: ['double'],
                            alternatives: [
                                { name: 'dimension', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                                { name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
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
        },
        randi: {
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
                            alternatives: [
                                { name: 'dimension', validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                                { name: 'dimensions', validators: ['numeric', 'vector', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
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
        },
        reshape: {
            inputs: [
                {
                    arity: 2,
                    parameters: [
                        { name: 'value' },
                        {
                            name: 'dimensions',
                            classes: ['double'],
                            alternatives: [
                                { name: 'dimension', validators: ['reshapeDimension'] },
                                { name: 'dimensions', validators: ['reshapeDimensionVector'] },
                            ],
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
        },
        repmat: {
            inputs: [
                {
                    arity: 2,
                    parameters: [
                        { name: 'value' },
                        {
                            name: 'dimensions',
                            classes: ['double'],
                            alternatives: [
                                { name: 'dimension', validators: ['dimension'] },
                                { name: 'dimensions', validators: ['dimensionVector'] },
                            ],
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
        },
        squeeze: { inputs: { arity: 1, parameters: [{ name: 'value' }] }, outputs: { arity: 1 } },
        colon: {
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
        },
        linspace: {
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
        },
        logspace: {
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
        },
        meshgrid: {
            inputs: { arity: -3, min: 1, max: 3, parameters: [{ name: 'vector', classes: ['double'], validators: ['scalarOrVector'], variadic: true }] },
            outputs: { arity: -3 },
        },
        ndgrid: {
            inputs: { arity: -1, min: 1, parameters: [{ name: 'vector', classes: ['double'], validators: ['scalarOrVector'], variadic: true }] },
            outputs: { arity: -1 },
        },
        cat: {
            inputs: {
                arity: -2,
                min: 2,
                parameters: [
                    { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'] },
                    { name: 'array', variadic: true },
                ],
            },
            outputs: { arity: 1 },
        },
        horzcat: { inputs: { arity: -1, min: 0, parameters: [{ name: 'array', variadic: true }] }, outputs: { arity: 1 } },
        vertcat: { inputs: { arity: -1, min: 0, parameters: [{ name: 'array', variadic: true }] }, outputs: { arity: 1 } },
        all: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        any: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        sum: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        prod: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        sumsq: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        cumsum: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        cumprod: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        min: {
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
        },
        max: {
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
        },
        cummin: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: -2 },
        },
        cummax: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: -2 },
        },
        mean: {
            inputs: { arity: -2, min: 1, max: 2, parameters: [{ name: 'value' }, { name: 'dimension', classes: ['double'], validators: ['dimension', 'positive'], optional: true }] },
            outputs: { arity: 1 },
        },
        var: {
            inputs: [
                { arity: 1, parameters: [{ name: 'value' }] },
                {
                    arity: 2,
                    parameters: [
                        { name: 'value' },
                        {
                            name: 'flagOrDimension',
                            classes: ['double'],
                            alternatives: [
                                { name: 'flag', validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                                { name: 'dimension', validators: ['dimensionGreaterThanOne'] },
                            ],
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
        },
        std: {
            inputs: [
                { arity: 1, parameters: [{ name: 'value' }] },
                {
                    arity: 2,
                    parameters: [
                        { name: 'value' },
                        {
                            name: 'flagOrDimension',
                            classes: ['double'],
                            alternatives: [
                                { name: 'flag', validators: ['numeric', 'scalar', 'real', 'finite', 'zeroOrOne'] },
                                { name: 'dimension', validators: ['dimensionGreaterThanOne'] },
                            ],
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
        },
        struct: {
            inputs: [
                {
                    arity: 1,
                    parameters: [
                        {
                            name: 'structOrEmptyArray',
                            alternatives: [
                                { name: 'field', classes: ['char'] },
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
                            variadicGroup: [{ name: 'field', classes: ['char'] }, { name: 'value' }],
                        },
                    ],
                },
            ],
            outputs: { arity: 1 },
        },
        norm: {
            inputs: [
                { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] },
                {
                    arity: 2,
                    parameters: [
                        { name: 'value', classes: ['double'] },
                        {
                            name: 'order',
                            alternatives: [
                                { name: 'numericOrder', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'positive'], allowInfinity: true },
                                { name: 'frobeniusOrder', classes: ['char'], allowedStrings: ['fro'] },
                            ],
                        },
                    ],
                },
            ],
            outputs: { arity: 1 },
        },
    };

    /**
     * User functions.
     */
    public static readonly functions: { [F in keyof typeof CoreFunctions | string]: Function } = {
        isempty: CoreFunctions.isempty,
        isscalar: CoreFunctions.isscalar,
        ismatrix: CoreFunctions.ismatrix,
        isvector: CoreFunctions.isvector,
        iscell: CoreFunctions.iscell,
        isrow: CoreFunctions.isrow,
        iscolumn: CoreFunctions.iscolumn,
        isstruct: CoreFunctions.isstruct,
        ndims: CoreFunctions.ndims,
        rows: CoreFunctions.rows,
        columns: CoreFunctions.columns,
        length: CoreFunctions.Length,
        numel: CoreFunctions.numel,
        find: CoreFunctions.find,
        sort: CoreFunctions.sort,
        ind2sub: CoreFunctions.ind2sub,
        sub2ind: CoreFunctions.sub2ind,
        size: CoreFunctions.size,
        colon: CoreFunctions.colon,
        linspace: CoreFunctions.linspace,
        logspace: CoreFunctions.logspace,
        meshgrid: CoreFunctions.meshgrid,
        ndgrid: CoreFunctions.ndgrid,
        repmat: CoreFunctions.repmat,
        reshape: CoreFunctions.reshape,
        squeeze: CoreFunctions.squeeze,
        zeros: CoreFunctions.zeros,
        ones: CoreFunctions.ones,
        rand: CoreFunctions.rand,
        randi: CoreFunctions.randi,
        cat: CoreFunctions.cat,
        horzcat: CoreFunctions.horzcat,
        vertcat: CoreFunctions.vertcat,
        all: CoreFunctions.all,
        any: CoreFunctions.any,
        sum: CoreFunctions.sum,
        prod: CoreFunctions.prod,
        sumsq: CoreFunctions.sumsq,
        max: CoreFunctions.max,
        min: CoreFunctions.min,
        mean: CoreFunctions.mean,
        cumsum: CoreFunctions.cumsum,
        cumprod: CoreFunctions.cumprod,
        cummin: CoreFunctions.cummin,
        cummax: CoreFunctions.cummax,
        var: CoreFunctions.variance,
        std: CoreFunctions.std,
        struct: CoreFunctions.struct,
        norm: CoreFunctions.norm,
    };
}

export { CoreFunctions };
export default { CoreFunctions };
