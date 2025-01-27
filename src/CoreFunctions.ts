import { ComplexDecimal } from './ComplexDecimal';
import { ElementType, MultiArray } from './MultiArray';
import { Evaluator } from './Evaluator';
import { CharString } from './CharString';
import * as AST from './AST';
import { Structure } from './Structure';
import { Decimal } from 'decimal.js';

export abstract class CoreFunctions {
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
    public static throwErrorIfCellArray(name: string, M: MultiArray | ComplexDecimal): void {
        if (M instanceof MultiArray && M.isCell) {
            throw new Error(`${name}: wrong type argument 'cell'`);
        }
    }

    /**
     * Return true if M is an empty matrix
     * @param X
     * @returns
     */
    public static isempty(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('isempty', arguments.length !== 1);
        return MultiArray.isEmpty(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a scalar.
     * @param X
     * @returns
     */
    public static isscalar(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('isscalar', arguments.length !== 1);
        return MultiArray.isScalar(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a 2-D array.
     * @param X
     * @returns
     */
    public static ismatrix(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('ismatrix', arguments.length !== 1);
        return MultiArray.isMatrix(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a vector.
     * @param X
     * @returns
     */
    public static isvector(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('isvector', arguments.length !== 1);
        return MultiArray.isVector(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a cell array object.
     * @param M
     * @returns
     */
    public static iscell(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('iscell', arguments.length !== 1);
        return MultiArray.isCellArray(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a row vector.
     * @param X
     * @returns
     */
    public static isrow(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('isrow', arguments.length !== 1);
        return MultiArray.isRowVector(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static iscolumn(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('iscolumn', arguments.length !== 1);
        return MultiArray.isColumnVector(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return true if X is a column vector.
     * @param X
     * @returns
     */
    public static isstruct(X: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('isstruct', arguments.length !== 1);
        return Structure.isStructure(X) ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Return the number of dimensions of M.
     * @param M
     * @returns
     */
    public static ndims(M: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('ndims', arguments.length !== 1);
        return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension.length);
    }

    /**
     * eturn the number of rows of M.
     * @param M
     * @returns
     */
    public static rows(M: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('rows', arguments.length !== 1);
        return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension[0]);
    }

    /**
     * Return the number of columns of M.
     * @param M
     * @returns
     */
    public static columns(M: ElementType): ComplexDecimal {
        CoreFunctions.throwInvalidCallError('columns', arguments.length !== 1);
        return new ComplexDecimal(MultiArray.scalarToMultiArray(M).dimension[1]);
    }

    /**
     * Return the length of the object M. The length is the number of elements
     * along the largest dimension.
     * @param M
     * @returns
     */
    public static Length(M: ElementType): ComplexDecimal {
        // Capitalized name so as not to conflict with the built-in 'Function.length' property.
        CoreFunctions.throwInvalidCallError('length', arguments.length !== 1);
        return new ComplexDecimal(Math.max(...MultiArray.scalarToMultiArray(M).dimension));
    }

    public static numel(M: ElementType, ...IDX: ElementType[]): ComplexDecimal {
        if (IDX.length === 0) {
            return M instanceof MultiArray ? new ComplexDecimal(MultiArray.linearLength(M)) : ComplexDecimal.one();
        } else {
            const m = MultiArray.scalarToMultiArray(M);
            const index = IDX.map((idx, i) => {
                if (idx instanceof MultiArray) {
                    return MultiArray.linearLength(idx);
                } else if (idx instanceof CharString && idx.str === ':') {
                    return i < m.dimension.length ? m.dimension[i] : 1;
                } else {
                    return 1;
                }
            });
            return new ComplexDecimal(index.reduce((p, c) => p * c, 1));
        }
    }

    /**
     * Convert linear indices to subscripts.
     * @param DIMS
     * @param IND
     * @returns
     */
    public static ind2sub(DIMS: ElementType, IND: ElementType): AST.NodeReturnList {
        CoreFunctions.throwInvalidCallError('ind2sub', arguments.length !== 2);
        return AST.nodeReturnList((length: number, index: number): ElementType => {
            if (length === 1) {
                return IND;
            } else {
                let dims = (MultiArray.linearize(DIMS) as ComplexDecimal[]).map((value) => value.re.toNumber());
                let lenghtGreater = false;
                if (length > dims.length) {
                    MultiArray.appendSingletonTail(dims, length);
                    lenghtGreater = true;
                } else {
                    dims = dims.slice(0, length - 1);
                }
                const ind = MultiArray.scalarToMultiArray(IND);
                const result = new MultiArray(ind.dimension);
                const subscript = ind.array.map((row) => row.map((value) => MultiArray.ind2subNumber(dims, (value as ComplexDecimal).re.toNumber())));
                if (index === length - 1 && lenghtGreater) {
                    result.array = subscript.map((row) => row.map((value) => new ComplexDecimal(value[length])));
                } else {
                    result.array = subscript.map((row) => row.map((value) => new ComplexDecimal(value[index])));
                }
                result.type = ComplexDecimal.REAL;
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
        const dims = (MultiArray.linearize(DIMS) as ComplexDecimal[]).map((value) => value.re.toNumber());
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
                return s.array[i][j] as ComplexDecimal;
            });
            const index = MultiArray.parseSubscript(dims, subscriptN, 'index ');
            const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[p][q] = new ComplexDecimal(index + 1);
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
        const parseDimension = (dimension: ComplexDecimal): number => {
            const dim = dimension.re.toNumber();
            if (dim < 1 || !dimension.re.trunc().eq(dimension.re)) {
                throw new Error(`size: requested dimension DIM (= ${dim}) out of range. DIM must be a positive integer.`);
            }
            return dim;
        };
        const sizeDim = M instanceof MultiArray ? M.dimension.slice() : [1, 1];
        if (DIM.length === 0) {
            const result = new MultiArray([1, sizeDim.length]);
            result.array[0] = sizeDim.map((d) => new ComplexDecimal(d));
            result.type = ComplexDecimal.REAL;
            return result;
        } else {
            const dims =
                DIM.length === 1 && DIM[0] instanceof MultiArray
                    ? (MultiArray.linearize(DIM[0]) as ComplexDecimal[]).map((dim) => parseDimension(dim))
                    : DIM.map((dim: any) => parseDimension(MultiArray.firstElement(dim) as ComplexDecimal));
            MultiArray.appendSingletonTail(sizeDim, Math.max(...dims));
            const result = new MultiArray([1, dims.length]);
            result.array[0] = dims.map((dim: number) => new ComplexDecimal(sizeDim[dim - 1]));
            result.type = ComplexDecimal.REAL;
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
            return MultiArray.expandRange(MultiArray.firstElement(args[0]) as ComplexDecimal, MultiArray.firstElement(args[1]) as ComplexDecimal);
        } else if (args.length === 3) {
            return MultiArray.expandRange(
                MultiArray.firstElement(args[0]) as ComplexDecimal,
                MultiArray.firstElement(args[2]) as ComplexDecimal,
                MultiArray.firstElement(args[1]) as ComplexDecimal,
            );
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
        let start: ComplexDecimal[] = [];
        let end: ComplexDecimal[] = [];
        let n: ComplexDecimal | MultiArray = ComplexDecimal.one();
        const linearizeStartEnd = () => {
            const errorMessage = 'linspace: START, END must be scalars or vectors.';
            if (args[0] instanceof MultiArray) {
                if (!MultiArray.isVector(args[0])) {
                    throw new Error(errorMessage);
                }
                start = MultiArray.linearize(args[0]) as ComplexDecimal[];
            } else {
                start = [args[0] as ComplexDecimal];
            }
            if (args[1] instanceof MultiArray) {
                if (!MultiArray.isVector(args[1])) {
                    throw new Error(errorMessage);
                }
                end = MultiArray.linearize(args[1]) as ComplexDecimal[];
            } else {
                end = [args[1] as ComplexDecimal];
            }
        };
        if (args.length === 2) {
            linearizeStartEnd();
            n = new ComplexDecimal(100);
        } else if (args.length === 3) {
            linearizeStartEnd();
            n = MultiArray.MultiArrayToScalar(args[2]) as MultiArray | ComplexDecimal;
            if (n instanceof MultiArray) {
                throw new Error('linspace: N must be a scalar.');
            }
        } else {
            CoreFunctions.throwInvalidCallError('linspace');
        }
        if (start.length !== end.length) {
            throw new Error('linspace: vectors must be of equal length');
        }
        n.re = Decimal.floor(n.re);
        if (n.re.isNegative()) {
            n.re = new Decimal(0);
        }
        n.im = new Decimal(0);
        const result = new MultiArray([start.length, n.re.toNumber()]);
        for (let i = 0; i < start.length; i++) {
            const delta = ComplexDecimal.rdiv(ComplexDecimal.sub(end[i], start[i]), ComplexDecimal.sub(n, ComplexDecimal.one()));
            result.array[i][0] = start[i];
            for (let j = 1; j < n.re.toNumber() - 1; j++) {
                result.array[i][j] = ComplexDecimal.add(start[i], ComplexDecimal.mul(new ComplexDecimal(j), delta));
            }
            result.array[i][n.re.toNumber() - 1] = end[i];
        }
        return MultiArray.MultiArrayToScalar(result);
    }

    /**
     * Return a row vector with elements logarithmically spaced.
     * @param args
     * @returns
     */
    public static logspace(...args: ElementType[]): ElementType {
        let start: ComplexDecimal[] = [];
        let end: ComplexDecimal[] = [];
        let n: ComplexDecimal | MultiArray = ComplexDecimal.one();
        const linearizeStartEnd = () => {
            const errorMessage = 'logspace: START, END must be scalars or vectors.';
            if (args[0] instanceof MultiArray) {
                if (!MultiArray.isVector(args[0])) {
                    throw new Error(errorMessage);
                }
                start = MultiArray.linearize(args[0]) as ComplexDecimal[];
            } else {
                start = [args[0] as ComplexDecimal];
            }
            if (args[1] instanceof MultiArray) {
                if (!MultiArray.isVector(args[1])) {
                    throw new Error(errorMessage);
                }
                end = MultiArray.linearize(args[1]) as ComplexDecimal[];
            } else {
                end = [args[1] as ComplexDecimal];
            }
        };
        if (args.length === 2) {
            linearizeStartEnd();
            n = new ComplexDecimal(50);
        } else if (args.length === 3) {
            linearizeStartEnd();
            n = MultiArray.MultiArrayToScalar(args[2]) as MultiArray | ComplexDecimal;
            if (n instanceof MultiArray) {
                throw new Error('logspace: N must be a scalar.');
            }
        } else {
            CoreFunctions.throwInvalidCallError('linspace');
        }
        if (start.length !== end.length) {
            throw new Error('logspace: vectors must be of equal length');
        }
        n.re = Decimal.floor(n.re);
        if (n.re.isNegative()) {
            n.re = new Decimal(0);
        }
        n.im = new Decimal(0);
        const result = new MultiArray([start.length, n.re.toNumber()]);
        for (let i = 0; i < start.length; i++) {
            if (Boolean(ComplexDecimal.eq(end[i], ComplexDecimal.pi()).re.toNumber())) {
                end[i] = ComplexDecimal.log10(ComplexDecimal.pi());
            }
            const delta = ComplexDecimal.rdiv(ComplexDecimal.sub(end[i], start[i]), ComplexDecimal.sub(n, ComplexDecimal.one()));
            result.array[i][0] = ComplexDecimal.power(new ComplexDecimal(10), start[i]);
            for (let j = 1; j < n.re.toNumber() - 1; j++) {
                result.array[i][j] = ComplexDecimal.power(new ComplexDecimal(10), ComplexDecimal.add(start[i], ComplexDecimal.mul(new ComplexDecimal(j), delta)));
            }
            result.array[i][n.re.toNumber() - 1] = ComplexDecimal.power(new ComplexDecimal(10), end[i]);
        }
        return MultiArray.MultiArrayToScalar(result) as MultiArray | ComplexDecimal;
    }

    /**
     * Generate 2-D and 3-D grids.
     * @param args
     * @returns
     */
    public static meshgrid(...args: ElementType[]): AST.NodeReturnList {
        CoreFunctions.throwInvalidCallError('meshgrid', args.length > 3 || args.length < 1);
        const argsLinearized: ElementType[][] = [];
        for (let i = 0; i < 3; i++) {
            if (args.length > i) {
                if (args[i] instanceof MultiArray) {
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
    public static ndgrid(...args: ElementType[]): AST.NodeReturnList {
        const argsLinearized: MultiArray[] = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i] instanceof MultiArray) {
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
                dimArray[i] = result instanceof MultiArray ? 1 : 0;
                return result;
            });
            if (dimArray.reduce((p, c) => p + c, 0)) {
                throw new Error('repmat: all input arguments must be scalar.');
            }
        }
        return MultiArray.evaluate(
            new MultiArray(
                dimension.map((value) => (value as ComplexDecimal).re.toNumber()),
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
            const element = MultiArray.firstElement(dim) as ComplexDecimal;
            if (MultiArray.isEmpty(element)) {
                if (d < 0) {
                    d = i;
                    return 1;
                } else {
                    throw new Error('reshape: only a single dimension can be unknown.');
                }
            } else {
                return element.re.toNumber();
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
        if (args[0] instanceof MultiArray && !args[0].isCell) {
            if (args[0].dimension.length > 2) {
                return MultiArray.reshape(
                    args[0],
                    args[0].dimension.filter((value) => value !== 1),
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
            dims = m.array[0].map((data) => (data as ComplexDecimal).re.toNumber());
            if (dims.length === 1) {
                dims[dims.length] = dims[0];
            }
        } else {
            dims = (dimension as (MultiArray | ComplexDecimal)[]).map((dim) => {
                if (dim instanceof MultiArray) {
                    throw new Error(`${name}: dimensions must be scalars.`);
                }
                return dim.re.toNumber();
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
            dims = (MultiArray.linearize(dimension[0]) as ComplexDecimal[]).map((dim) => dim.re.toNumber());
        } else if (dimension.length === 0) {
            return fillFunction(0);
        } else {
            dims = dimension.map((dim) => (MultiArray.firstElement(dim) as ComplexDecimal).re.toNumber());
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
        return CoreFunctions.newFilled(ComplexDecimal.zero(), 'zeros', ...dimension);
    }

    /**
     * Create array of all ones.
     * @param dimension
     * @returns
     */
    public static ones(...dimension: ElementType[]): ElementType {
        return CoreFunctions.newFilled(ComplexDecimal.one(), 'ones', ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom numbers distributed on the
     * interval (0, 1).
     * @param dimension
     * @returns
     */
    public static rand(...dimension: ElementType[]): ElementType {
        return CoreFunctions.newFilledEach(() => ComplexDecimal.random(), ...dimension);
    }

    /**
     * Uniformly distributed pseudorandom integers.
     * @param imax
     * @param args
     * @returns
     */
    public static randi(range: ElementType, ...dimension: ElementType[]): ElementType {
        let imin: ComplexDecimal;
        let imax: ComplexDecimal;
        if (range instanceof MultiArray) {
            const rangeLinearized = MultiArray.linearize(range) as ComplexDecimal[];
            if (rangeLinearized.length > 1) {
                imin = rangeLinearized[0];
                imax = rangeLinearized[1];
            } else if (rangeLinearized.length > 0) {
                imin = ComplexDecimal.zero();
                imax = rangeLinearized[0];
            } else {
                throw new Error('bounds(1): out of bound 0 (dimensions are 0x0)');
            }
        } else {
            imin = ComplexDecimal.zero();
            imax = range as ComplexDecimal;
        }
        if (!(imin.re.isInt() && imax.re.isInt())) {
            throw new Error(`randi: must be integer bounds.`);
        }
        if (ComplexDecimal.gt(imax, imin)) {
            return CoreFunctions.newFilledEach(
                imin.re.isZero()
                    ? () => ComplexDecimal.round(ComplexDecimal.mul(imax, ComplexDecimal.random()))
                    : () => ComplexDecimal.round(ComplexDecimal.add(ComplexDecimal.mul(ComplexDecimal.sub(imax, imin), ComplexDecimal.random()), imin)),
                ...dimension,
            );
        } else {
            if (imin.re.isZero()) {
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
        return MultiArray.concatenate((MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1, 'cat', ...ARRAY.map((m) => MultiArray.scalarToMultiArray(m)));
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
        return MultiArray.reduce(DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            ComplexDecimal.add(p as ComplexDecimal, c as ComplexDecimal),
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
        return MultiArray.reduce(DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            ComplexDecimal.add(
                ComplexDecimal.mul(p as ComplexDecimal, ComplexDecimal.conj(p as ComplexDecimal)),
                ComplexDecimal.mul(c as ComplexDecimal, ComplexDecimal.conj(c as ComplexDecimal)),
            ),
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
        return MultiArray.reduce(DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M), M, (p, c) =>
            ComplexDecimal.mul(p as ComplexDecimal, c as ComplexDecimal),
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
        const dim = DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M);
        const sum = MultiArray.reduce(dim, M, (p, c) => ComplexDecimal.add(p as ComplexDecimal, c as ComplexDecimal));
        return MultiArray.MultiArrayOpScalar('rdiv', MultiArray.scalarToMultiArray(sum), new ComplexDecimal(M.dimension[dim]));
    }

    /**
     * Base method of min and max user functions.
     * @param op 'min' or 'max'.
     * @param args One to three arguments like user function.
     * @returns Return like user function.
     */
    private static minMax(op: 'min' | 'max', ...args: ElementType[]): MultiArray | AST.NodeReturnList | undefined {
        const minMaxAlogDimension = (M: MultiArray, dimension: number) => {
            const reduced = MultiArray.reduceToArray(dimension, M);
            const resultM = new MultiArray(reduced.dimension);
            const indexM = new MultiArray(reduced.dimension);
            const cmp = op === 'min' ? 'lt' : 'gt';
            for (let i = 0; i < indexM.array.length; i++) {
                for (let j = 0; j < indexM.array[0].length; j++) {
                    const [m, n] = ComplexDecimal[`minMaxArray${args[0]!.type < 2 ? 'Real' : 'Complex'}WithIndex`](cmp, ...(reduced.array[i][j] as unknown as ComplexDecimal[]));
                    resultM.array[i][j] = m;
                    indexM.array[i][j] = new ComplexDecimal(n + 1);
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
                return MultiArray.elementWiseOperation((op + 'Wise') as ComplexDecimal.TBinaryOperationName, MultiArray.scalarToMultiArray(args[0]), args[1] as MultiArray);
            case 3:
                // Along selected dimension.
                if (!MultiArray.isEmpty(args[1])) {
                    // Error if second argument is different from [](0x0).
                    throw new Error(`${op}: second argument is ignored`);
                }
                return minMaxAlogDimension(MultiArray.scalarToMultiArray(args[0]), (MultiArray.firstElement(args[2]) as ComplexDecimal).re.toNumber() - 1);
            default:
                CoreFunctions.throwInvalidCallError(op);
        }
    }

    /**
     * Minimum elements of array.
     * @param M
     * @returns
     */
    public static min(...args: ElementType[]): MultiArray | AST.NodeReturnList | undefined {
        return CoreFunctions.minMax('min', ...args);
    }

    /**
     * Maximum elements of array.
     * @param M
     * @returns
     */
    public static max(...args: ElementType[]): MultiArray | AST.NodeReturnList | undefined {
        return CoreFunctions.minMax('max', ...args);
    }

    /**
     * Base method of cummin and cummax user functions.
     * @param op 'min' or 'max'.
     * @param M MultiArray.
     * @param DIM Dimension in which the cumulative operation occurs.
     * @returns MultiArray with cumulative values along dimension DIM.
     */
    private static cumMinMax(op: 'min' | 'max', M: ElementType, DIM?: ElementType): AST.NodeReturnList {
        M = MultiArray.scalarToMultiArray(M);
        const indexM = new MultiArray(M.dimension);
        let compare: ComplexDecimal;
        let index: ComplexDecimal;
        const result = MultiArray.alongDimensionMap(DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : 1, M, (element, d, i, j) => {
            if (d === 0) {
                compare = element as ComplexDecimal;
                index = ComplexDecimal.one();
            } else {
                if (ComplexDecimal[op === 'min' ? 'lt' : 'gt'](element as ComplexDecimal, compare).re.toNumber()) {
                    index = new ComplexDecimal(d + 1);
                    compare = element as ComplexDecimal;
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
    public static cummin(M: ElementType, DIM?: ElementType): AST.NodeReturnList {
        return CoreFunctions.cumMinMax('min', M, DIM);
    }

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static cummax(M: ElementType, DIM?: ElementType): AST.NodeReturnList {
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
        const initialValue = op === 'add' ? ComplexDecimal.zero() : ComplexDecimal.one();
        const result = MultiArray.alongDimensionMap(
            DIM ? (MultiArray.firstElement(DIM) as ComplexDecimal).re.toNumber() - 1 : MultiArray.firstNonSingleDimension(M),
            M,
            (
                (cum) => (element, dimension) =>
                    (cum = dimension !== 0 ? ComplexDecimal[op](cum, element as ComplexDecimal) : (element as ComplexDecimal))
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
            if (args[0] instanceof MultiArray && MultiArray.isEmpty(args[0])) {
                return MultiArray.emptyArray();
            } else if (args[0] instanceof Structure) {
                return args[0].copy();
            } else {
                throw new Error(errorMessage);
            }
        } else {
            if (args.length % 2 !== 0) {
                throw new Error(errorMessage);
            }
            const resultFields: Record<string, ElementType> = {};
            for (let i = 0; i < args.length; i += 2) {
                if (args[i] instanceof CharString) {
                    resultFields[(args[i] as CharString).str] = args[i + 1];
                } else {
                    throw new Error(errorMessage);
                }
            }
            return new Structure(resultFields);
        }
    }
}
