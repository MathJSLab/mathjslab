import { CharString } from './CharString';
import { type TBinaryOperationName } from './ComplexInterface';
import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { type NodeReturnList, AST } from './AST';
import { Evaluator } from './Evaluator';

abstract class CoreFunctions {
    public static functions: Record<string, Function> = {
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
        sum: CoreFunctions.sum,
        sumsq: CoreFunctions.sumsq,
        prod: CoreFunctions.prod,
        mean: CoreFunctions.mean,
        min: CoreFunctions.min,
        max: CoreFunctions.max,
        cummin: CoreFunctions.cummin,
        cummax: CoreFunctions.cummax,
        cumsum: CoreFunctions.cumsum,
        cumprod: CoreFunctions.cumprod,
        struct: CoreFunctions.struct,
    };

    /**
     * Throw invalid call error if (optional) test is true.
     * @param name
     */
    public static throwInvalidCallError(name: string, test: boolean = true): void {
        if (test) {
            throw new Error(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
        }
    }

    /**
     *
     * @param name
     * @param M
     */
    public static throwErrorIfCellArray(name: string, M: MultiArray | ComplexType): void {
        if (MultiArray.isInstanceOf(M) && (M as MultiArray).isCell) {
            throw new Error(`${name}: wrong type argument 'cell'`);
        }
    }

    /**
     * Return true if M is an empty matrix
     * @param X
     * @returns
     */
    public static isempty(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('isempty', arguments.length !== 1);
        return MultiArray.isEmpty(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a scalar.
     * @param X
     * @returns
     */
    public static isscalar(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('isscalar', arguments.length !== 1);
        return MultiArray.isScalar(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a 2-D array.
     * @param X
     * @returns
     */
    public static ismatrix(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('ismatrix', arguments.length !== 1);
        return MultiArray.isMatrix(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a vector.
     * @param X
     * @returns
     */
    public static isvector(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('isvector', arguments.length !== 1);
        return MultiArray.isVector(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a cell array object.
     * @param M
     * @returns
     */
    public static iscell(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('iscell', arguments.length !== 1);
        return MultiArray.isCellArray(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a row vector.
     * @param X
     * @returns
     */
    public static isrow(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('isrow', arguments.length !== 1);
        return MultiArray.isRowVector(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static iscolumn(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('iscolumn', arguments.length !== 1);
        return MultiArray.isColumnVector(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static isstruct(X: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('isstruct', arguments.length !== 1);
        return Structure.isStructure(X) ? Complex.true() : Complex.false();
    }

    /**
     * Return the number of dimensions of M.
     * @param M
     * @returns
     */
    public static ndims(M: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('ndims', arguments.length !== 1);
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension.length);
    }

    /**
     * eturn the number of rows of M.
     * @param M
     * @returns
     */
    public static rows(M: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('rows', arguments.length !== 1);
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension[0]);
    }

    /**
     * Return the number of columns of M.
     * @param M
     * @returns
     */
    public static columns(M: ElementType): ComplexType {
        CoreFunctions.throwInvalidCallError('columns', arguments.length !== 1);
        return Complex.create(MultiArray.scalarToMultiArray(M).dimension[1]);
    }

    /**
     * Return the length of the object M. The length is the number of elements
     * along the largest dimension.
     * @param M
     * @returns
     */
    public static Length(M: ElementType): ComplexType {
        // Capitalized name so as not to conflict with the built-in 'Function.length' property.
        CoreFunctions.throwInvalidCallError('length', arguments.length !== 1);
        return Complex.create(Math.max(...MultiArray.scalarToMultiArray(M).dimension));
    }

    public static numel(M: ElementType, ...IDX: ElementType[]): ComplexType {
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
    }

    /**
     * Convert linear indices to subscripts.
     * @param DIMS
     * @param IND
     * @returns
     */
    public static ind2sub(DIMS: ElementType, IND: ElementType): NodeReturnList {
        CoreFunctions.throwInvalidCallError('ind2sub', arguments.length !== 2);
        return AST.nodeReturnList((length: number, index: number): ElementType => {
            if (length === 1) {
                return IND;
            } else {
                let dims = (MultiArray.linearize(DIMS) as ComplexType[]).map((value) => Complex.realToNumber(value));
                let lenghtGreater = false;
                if (length > dims.length) {
                    MultiArray.appendSingletonTail(dims, length);
                    lenghtGreater = true;
                } else {
                    dims = dims.slice(0, length - 1);
                }
                const ind = MultiArray.scalarToMultiArray(IND);
                const result = new MultiArray(ind.dimension);
                const subscript = ind.array.map((row) => row.map((value) => MultiArray.ind2subNumber(dims, Complex.realToNumber(value as ComplexType))));
                if (index === length - 1 && lenghtGreater) {
                    result.array = subscript.map((row) => row.map((value) => Complex.create(value[length])));
                } else {
                    result.array = subscript.map((row) => row.map((value) => Complex.create(value[index])));
                }
                result.type = Complex.REAL;
                return MultiArray.MultiArrayToScalar(result);
            }
        });
    }

    /**
     * Convert subscripts to linear indices.
     * @param DIMS
     * @param S
     * @returns
     */
    public static sub2ind(DIMS: ElementType, ...S: ElementType[]): ElementType {
        CoreFunctions.throwInvalidCallError('sub2ind', arguments.length < 2);
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
    }

    /**
     * Returns array dimensions.
     * @param M MultiArray
     * @param DIM Dimensions
     * @returns Dimensions of `M` parameter.
     */
    public static size(M: ElementType, ...DIM: ElementType[]): ElementType {
        CoreFunctions.throwInvalidCallError('size', arguments.length < 1);
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
    }

    /**
     * Return the result of the colon expression.
     * @param args
     * @returns
     */
    public static colon(...args: ElementType[]): ElementType {
        if (args.length === 2) {
            return MultiArray.expandRange(MultiArray.firstElement(args[0]) as ComplexType, MultiArray.firstElement(args[1]) as ComplexType);
        } else if (args.length === 3) {
            return MultiArray.expandRange(MultiArray.firstElement(args[0]) as ComplexType, MultiArray.firstElement(args[2]) as ComplexType, MultiArray.firstElement(args[1]) as ComplexType);
        } else {
            CoreFunctions.throwInvalidCallError('colon');
        }
    }

    /**
     * Return a row vector with linearly spaced elements.
     * @param args
     * @returns
     */
    public static linspace(...args: ElementType[]): ElementType {
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
            CoreFunctions.throwInvalidCallError('linspace');
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
    }

    /**
     * Return a row vector with elements logarithmically spaced.
     * @param args
     * @returns
     */
    public static logspace(...args: ElementType[]): ElementType {
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
            CoreFunctions.throwInvalidCallError('linspace');
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
    }

    /**
     * Generate 2-D and 3-D grids.
     * @param args
     * @returns
     */
    public static meshgrid(...args: ElementType[]): NodeReturnList {
        CoreFunctions.throwInvalidCallError('meshgrid', args.length > 3 || args.length < 1);
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
        return AST.nodeReturnList((length: number, index: number): ElementType => {
            if (length > 3) {
                throw new Error('meshgrid: function called with too many outputs.');
            }
            const args: ElementType[][] = argsLinearized;
            while (args.length < length) {
                args[args.length] = args[args.length - 1];
            }
            const result = length > 2 ? new MultiArray([args[1].length, args[0].length, args[2].length]) : new MultiArray([args[1].length, args[0].length]);
            switch (index) {
                case 0:
                    for (let i = 0; i < result.array.length; i++) {
                        result.array[i] = args[0];
                    }
                case 1:
                    for (let p = 0; p < result.array.length; p += result.dimension[0]) {
                        for (let i = 0; i < result.dimension[0]; i++) {
                            result.array[p + i] = new Array(result.dimension[1]).fill(args[1][i]);
                        }
                    }
                case 2:
                    for (let p = 0, n = 0; p < result.array.length; p += result.dimension[0], n++) {
                        for (let i = 0; i < result.dimension[0]; i++) {
                            result.array[p + i] = new Array(result.dimension[1]).fill(args[2][n]);
                        }
                    }
            }
            return MultiArray.MultiArrayToScalar(result);
        });
    }

    /**
     * Given n vectors X1, ..., Xn, returns n arrays of n dimensions.
     * @returns
     */
    public static ndgrid(...args: ElementType[]): NodeReturnList {
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
        return AST.nodeReturnList((length: number, index: number): ElementType => {
            const args: MultiArray[] = argsLinearized;
            if (args.length === 1) {
                while (args.length < length) {
                    args[args.length] = args[args.length - 1];
                }
            }
            if (length > args.length) {
                throw new Error('ndgrid: function called with too many outputs.');
            }
            const shape: number[] = args.map((M) => M.dimension[0] * M.dimension[1]);
            const r: number[] = new Array(args.length).fill(1);
            r[index] = shape[index];
            shape[index] = 1;
            return MultiArray.evaluate(new MultiArray(shape, MultiArray.reshape(args[index], r)));
        });
    }

    /**
     * Repeat N-D array.
     * @param A
     * @param dim
     * @returns
     */
    public static repmat(A: ElementType, ...dim: ElementType[]): ElementType {
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
    }

    /**
     * Return a matrix with the specified dimensions whose elements are taken from the matrix M.
     * @param M
     * @param dimension
     * @returns
     */
    public static reshape(M: ElementType, ...dimension: ElementType[]): ElementType {
        const m = MultiArray.scalarToMultiArray(M);
        let d: number = -1;
        const dims = dimension.map((dim, i) => {
            const element = MultiArray.firstElement(dim) as ComplexType;
            if (MultiArray.isEmpty(element)) {
                if (d < 0) {
                    d = i;
                    return 1;
                } else {
                    throw new Error('reshape: only a single dimension can be unknown.');
                }
            } else {
                return Complex.realToNumber(element);
            }
        });
        return MultiArray.reshape(m, dims, d >= 0 ? d : undefined);
    }

    /**
     * Remove singleton dimensions.
     * @param args
     * @returns
     */
    public static squeeze(...args: ElementType[]): ElementType {
        CoreFunctions.throwInvalidCallError('squeeze', args.length !== 1);
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
    }

    /**
     * Create MultiArray with all elements equals `fill` parameter.
     * @param fill Value to fill MultiArray.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fill` parameter.
     */
    private static newFilled(fill: ElementType, name: string, ...dimension: ElementType[]): ElementType {
        let dims: number[];
        if (dimension.length === 0) {
            return fill;
        } else if (dimension.length === 1) {
            const m = MultiArray.scalarToMultiArray(dimension[0]);
            if (m.dimension.length > 2 || m.dimension[0] !== 1) {
                throw new Error(`${name} (A): use ${name} (size (A)) instead.`);
            }
            dims = m.array[0].map((data) => Complex.realToNumber(data as ComplexType));
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
    }

    /**
     * Create MultiArray with all elements filled with `fillFunction` result.
     * The parameter passed to `fillFunction` is a linear index of element.
     * @param fillFunction Function to be called and the result fills element of MultiArray created.
     * @param dimension Dimensions of created MultiArray.
     * @returns MultiArray filled with `fillFunction` results for each element.
     */
    private static newFilledEach(fillFunction: (index: number) => ElementType, ...dimension: ElementType[]): ElementType {
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
    }

    /**
     * Create array of all zeros.
     * @param dimension
     * @returns
     */
    public static zeros(...dimension: ElementType[]): ElementType {
        return CoreFunctions.newFilled(Complex.zero(), 'zeros', ...dimension);
    }

    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static ones(...dimension: ElementType[]): ElementType {
        return CoreFunctions.newFilled(Complex.one(), 'ones', ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom numbers distributed on the
     * interval (0, 1).
     * @param dimension
     * @returns
     */
    public static rand(...dimension: ElementType[]): ElementType {
        return CoreFunctions.newFilledEach(() => Complex.random(), ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(range: ElementType, ...dimension: ElementType[]): ElementType {
        let imin: ComplexType;
        let imax: ComplexType;
        if (MultiArray.isInstanceOf(range)) {
            const rangeLinearized = MultiArray.linearize(range) as ComplexType[];
            if (rangeLinearized.length > 1) {
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
    }

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along dimension `DIM`.
     * @param DIM Dimension of concatenation.
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along dimension `DIM`.
     */
    public static cat(DIM: ElementType, ...ARRAY: ElementType[]): MultiArray {
        return MultiArray.concatenate(Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1, 'cat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    }

    /**
     * Concatenate arrays horizontally.
     * @param ARRAY Arrays to concatenate horizontally.
     * @returns Concatenated arrays horizontally.
     */
    public static horzcat(...ARRAY: ElementType[]): MultiArray {
        return MultiArray.concatenate(1, 'horzcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    }

    /**
     * Concatenate arrays vertically.
     * @param ARRAY Arrays to concatenate vertically.
     * @returns Concatenated arrays vertically.
     */
    public static vertcat(...ARRAY: ElementType[]): MultiArray {
        return MultiArray.concatenate(0, 'vertcat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
    }

    /**
     * Calculate sum of elements along dimension DIM.
     * @param M Array
     * @param DIM Dimension
     * @returns Array with sum of elements along dimension DIM.
     */
    public static sum(M: MultiArray, DIM?: ElementType): ElementType {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        return MultiArray.reduce(DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            Complex.add(p as ComplexType, c as ComplexType),
        );
    }

    /**
     * Calculate sum of squares of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with sum of squares of elements along dimension DIM.
     */
    public static sumsq(M: MultiArray, DIM?: ElementType): ElementType {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        return MultiArray.reduce(DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            Complex.add(Complex.mul(p as ComplexType, Complex.conj(p as ComplexType)), Complex.mul(c as ComplexType, Complex.conj(c as ComplexType))),
        );
    }

    /**
     * Calculate product of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static prod(M: MultiArray, DIM?: ElementType): ElementType {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        return MultiArray.reduce(DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            Complex.mul(p as ComplexType, c as ComplexType),
        );
    }

    /**
     * Calculate average or mean of elements along dimension DIM.
     * @param M Matrix
     * @param DIM Dimension
     * @returns One dimensional matrix with product of elements along dimension DIM.
     */
    public static mean(M: MultiArray, DIM?: ElementType): ElementType {
        // TODO: Test if MultiArray.reduceToArray is better than MultiArray.reduce.
        const dim = DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(M);
        const sum = MultiArray.reduce(dim, M, (p, c) => Complex.add(p as ComplexType, c as ComplexType));
        return MultiArray.MultiArrayOpScalar('rdiv', MultiArray.scalarToMultiArray(sum), Complex.create(M.dimension[dim]));
    }

    /**
     * Base method of min and max user functions.
     * @param op 'min' or 'max'.
     * @param args One to three arguments like user function.
     * @returns Return like user function.
     */
    private static minMax(op: 'min' | 'max', ...args: ElementType[]): MultiArray | NodeReturnList | undefined {
        const minMaxAlogDimension = (M: MultiArray, dimension: number) => {
            const reduced = MultiArray.reduceToArray(dimension, M);
            const resultM = new MultiArray(reduced.dimension);
            const indexM = new MultiArray(reduced.dimension);
            const cmp = op === 'min' ? 'lt' : 'gt';
            for (let i = 0; i < indexM.array.length; i++) {
                for (let j = 0; j < indexM.array[0].length; j++) {
                    const [m, n] = Complex[`minMaxArray${args[0]!.type < 2 ? 'Real' : 'Complex'}WithIndex`](cmp, ...(reduced.array[i][j] as unknown as ComplexType[]));
                    resultM.array[i][j] = m;
                    indexM.array[i][j] = Complex.create(n + 1);
                }
            }
            return AST.nodeReturnList((length: number, index: number): any => {
                Evaluator.throwErrorIfGreaterThanReturnList(2, length);
                return MultiArray.MultiArrayToScalar(index === 0 ? resultM : indexM);
            });
        };
        switch (args.length) {
            case 1:
                // Along first non singleton dimension.
                const dimension = MultiArray.firstNonSingleDimension(MultiArray.scalarToMultiArray(args[0]));
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), dimension);
            case 2:
                // Broadcast
                return MultiArray.elementWiseOperation((op + 'Wise') as TBinaryOperationName, MultiArray.scalarToMultiArray(args[0]), args[1] as MultiArray);
            case 3:
                // Along selected dimension.
                if (!MultiArray.isEmpty(args[1])) {
                    // Error if second argument is different from [](0x0).
                    throw new Error(`${op}: second argument is ignored`);
                }
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), Complex.realToNumber(MultiArray.firstElement(args[2]) as ComplexType) - 1);
            default:
                CoreFunctions.throwInvalidCallError(op);
        }
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: ElementType[]): MultiArray | NodeReturnList | undefined {
        return CoreFunctions.minMax('min', ...args);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: ElementType[]): MultiArray | NodeReturnList | undefined {
        return CoreFunctions.minMax('max', ...args);
    }

    /**
     * Base method of cummin and cummax user functions.
     * @param op 'min' or 'max'.
     * @param M MultiArray.
     * @param DIM Dimension in which the cumulative operation occurs.
     * @returns MultiArray with cumulative values along dimension DIM.
     */
    private static cumMinMax(op: 'min' | 'max', M: ElementType, DIM?: ElementType): NodeReturnList {
        M = MultiArray.scalarToMultiArray(M);
        const indexM = new MultiArray(M.dimension);
        let compare: ComplexType;
        let index: ComplexType;
        const result = MultiArray.alongDimensionMap(DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : 1, M, (element, d, i, j) => {
            if (d === 0) {
                compare = element as ComplexType;
                index = Complex.one();
            } else {
                if (Complex.realToNumber(Complex[op === 'min' ? 'lt' : 'gt'](element as ComplexType, compare))) {
                    index = Complex.create(d + 1);
                    compare = element as ComplexType;
                }
            }
            indexM.array[i][j] = index;
            return compare;
        });
        return AST.nodeReturnList((length: number, index: number): ElementType => {
            Evaluator.throwErrorIfGreaterThanReturnList(2, length);
            return MultiArray.MultiArrayToScalar(index === 0 ? result : indexM);
        });
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cummin(M: ElementType, DIM?: ElementType): NodeReturnList {
        return CoreFunctions.cumMinMax('min', M, DIM);
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cummax(M: ElementType, DIM?: ElementType): NodeReturnList {
        return CoreFunctions.cumMinMax('max', M, DIM);
    }

    /**
     *
     * @param op
     * @param M
     * @param DIM
     * @returns
     */
    private static cumSumProd(op: 'add' | 'mul', M: ElementType, DIM?: ElementType): ElementType {
        M = MultiArray.scalarToMultiArray(M);
        const initialValue = op === 'add' ? Complex.zero() : Complex.one();
        const result = MultiArray.alongDimensionMap(
            DIM ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(M),
            M,
            (
                (cum) => (element, dimension) =>
                    (cum = dimension !== 0 ? Complex[op](cum, element as ComplexType) : (element as ComplexType))
            )(initialValue),
        );
        MultiArray.setType(result);
        return result;
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cumsum(M: ElementType, DIM?: ElementType): ElementType {
        return CoreFunctions.cumSumProd('add', M, DIM);
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cumprod(M: ElementType, DIM?: ElementType): ElementType {
        return CoreFunctions.cumSumProd('mul', M, DIM);
    }

    /**
     *
     * @param args
     * @returns
     */
    public static struct(...args: ElementType[]): ElementType {
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
    }
}
export { CoreFunctions };
export default { CoreFunctions };
