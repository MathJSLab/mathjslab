import type { TUnaryOperationLeftName, TBinaryOperationName } from './ComplexInterface';
import { Complex, ComplexType } from './Complex';
import { CharString } from './CharString';
import { Structure } from './Structure';
import { FunctionHandle } from './FunctionHandle';
import { AST, NodeReturnList, ReturnHandlerResult } from './AST';
import { Interpreter } from './Interpreter';
import { Scope } from './Scope';

/**
 * MultiArray Element type.
 */
type Elements = ComplexType | CharString | Structure | FunctionHandle;
type ElementType<ELEMENT = Elements> = MultiArray | ELEMENT | null | undefined;

/**
 * Reduce factory function types.
 */

type ReduceComparisonType = 'lt' | 'gt';
type ReduceType = 'reduce' | 'cumulative' | 'cumcomparison' | 'comparison';
type ReduceElementType<ELEMENT = Elements> = ElementType<ELEMENT>;
type ReduceCallbackType = (prev: ReduceElementType, curr: ReduceElementType, index?: number) => ReduceElementType;
type ReduceCallbackOrComparisonType = ReduceCallbackType | ReduceComparisonType;
type ReduceInitialType = ReduceElementType;
type ReduceReduceHandlerType = (M: ReduceElementType, DIM?: ReduceElementType) => ReduceElementType;
type ReduceComparisonHandlerType<ELEMENT = Elements> = (...args: ElementType<ELEMENT>[]) => MultiArray<ELEMENT> | NodeReturnList | undefined;
type ReduceHandlerType = ReduceReduceHandlerType | ReduceComparisonHandlerType;

/**
 * # MultiArray
 *
 * Multimensional array library. This class represents common arrays and cell arrays.
 */
class MultiArray<ELEMENT = Elements> {
    /**
     * Dimensions property ([lines, columns, pages, blocks, ...]).
     */
    public dimension: number[];

    /**
     * Dimensions excluding columns getter ([lines, pages, blocks, ...]).
     */
    public get dimensionR(): number[] {
        return [this.dimension[0], ...this.dimension.slice(2)];
    }

    /**
     * Array content.
     */
    public array: ElementType<ELEMENT>[][];

    /**
     * Type attribute.
     */
    public type: number;

    /**
     * Test if an object is a instance of `MultiArray`.
     * @param obj Object to test.
     * @returns `true` if `obj` is an instance of `MultiArray`. `false` otherwise.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is MultiArray => obj instanceof MultiArray;

    public static readonly LOGICAL = Complex.LOGICAL;
    public static readonly REAL = Complex.REAL;
    public static readonly COMPLEX = Complex.COMPLEX;
    public static readonly STRING = CharString.STRING;
    public static readonly STRUCTURE = Structure.STRUCTURE;
    public static readonly FUNCTION_HANDLE = FunctionHandle.FUNCTION_HANDLE;

    /**
     * True if cell array.
     */
    public isCell: boolean;

    /**
     * Parent node property.
     */
    public parent: any;

    /**
     * MultiArray constructor.
     * @param shape Dimensions ([rows, columns, pages, blocks, ...]).
     * @param fill Data to fill MultiArray. The same object will be put in all elements of MultiArray.
     */
    public constructor(shape?: number[], fill?: ElementType | ((...dims: number[]) => ElementType) | ElementType[][], iscell?: boolean) {
        if (shape) {
            this.dimension = shape.slice();
            MultiArray.appendSingletonTail(this.dimension, 2);
            MultiArray.removeSingletonTail(this.dimension);
            if (fill) {
                if (typeof fill === 'function') {
                    this.array = Array.from({ length: shape[0] * shape.slice(2).reduce((p, c) => p * c, 1) }, (_, i) =>
                        Array.from({ length: shape[1] }, (_, j) => fill(...MultiArray.rowColumnToSubscript(shape, i, j))),
                    ) as ElementType<ELEMENT>[][];
                } else if (Array.isArray(fill) && Array.isArray(fill[0])) {
                    this.array = fill.map((row: ElementType[]) => row.map((elem: ElementType) => elem!.copy() as ElementType)) as any;
                } else {
                    this.array = new Array(this.dimensionR.reduce((p, c) => p * c, 1));
                    if (fill instanceof MultiArray || fill instanceof Structure) {
                        for (let i = 0; i < this.array.length; i++) {
                            this.array[i] = new Array(this.dimension[1]);
                            for (let j = 0; j < this.dimension[1]; j++) {
                                this.array[i][j] = fill.copy() as ElementType<ELEMENT>;
                            }
                        }
                    } else {
                        for (let i = 0; i < this.array.length; i++) {
                            this.array[i] = new Array(this.dimension[1]).fill(fill);
                        }
                    }
                    this.type = (fill as ElementType)!.type;
                }
            } else {
                this.array = Array.from({ length: shape[0] * shape.slice(2).reduce((p, c) => p * c, 1) }, (_) =>
                    Array.from({ length: shape[1] }, (_) => Complex.zero()),
                ) as ElementType<ELEMENT>[][];
                this.type = -1;
            }
        } else {
            this.dimension = [0, 0];
            this.array = [];
            this.type = -1;
        }
        this.isCell = iscell ?? false;
    }

    /**
     * Check if object is a scalar.
     * @param obj Any object.
     * @returns `true` if object is a scalar. false otherwise.
     */
    public static readonly isScalar = (obj: unknown): boolean => !(obj instanceof MultiArray && obj.dimension.reduce((p, c) => p * c, 1) > 1);

    /**
     * Check if object is a MultiArray and it is a row vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static readonly isRowVector = (obj: unknown): boolean => obj instanceof MultiArray && obj.dimension.length === 2 && obj.dimension[0] === 1;

    /**
     * Converts a vector of type `ElementType[]` into a row matrix of type `MultiArray`.
     * @param vector
     * @returns
     */
    public static readonly toRowVector = (vector: ElementType[]): MultiArray => {
        const result = new MultiArray([1, vector.length]);
        result.array[0] = vector.slice();
        return result;
    };

    /**
     *
     * @param vector
     * @returns
     */
    public static readonly fromRowVector = (vector: MultiArray): ElementType[] => vector.array[0];

    /**
     * Check if object is a MultiArray and it is a row vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static readonly isColumnVector = (obj: unknown): boolean => obj instanceof MultiArray && obj.dimension.length === 2 && obj.dimension[1] === 1;

    /**
     * Converts a vector of type `ElementType[]` into a column matrix of type `MultiArray`.
     * @param vector
     * @returns
     */
    public static readonly toColumnVector = (vector: ElementType[]): MultiArray => {
        const result = new MultiArray([vector.length, 1]);
        result.array.map((_, i, array) => (array[i][0] = vector[i]));
        return result;
    };

    /**
     *
     * @param vector
     * @returns
     */
    public static readonly fromColumnVector = (vector: MultiArray): ElementType[] => vector.array.map((row) => row[0]);

    /**
     * Check if a MultiArray is a row vector or a column vector.
     * @param array MultiArray to test.
     * @returns `true` if `array` is a vector (column vector or row vector), otherwise `false`.
     */
    public static readonly arrayIsVector = (array: MultiArray): boolean => array.dimension.length === 2 && (array.dimension[0] === 1 || array.dimension[1] === 1);

    /**
     * Check if object is a MultiArray and it is a row vector or a column vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector or a column vector. false otherwise.
     */
    public static readonly isVector = (obj: unknown): boolean => obj instanceof MultiArray && obj.dimension.length === 2 && (obj.dimension[0] === 1 || obj.dimension[1] === 1);

    /**
     * * Converts a vector of type `ElementType[]` into a diagonal matrix of type `MultiArray`.
     * @param vector
     * @returns
     */
    public static readonly toDiagonalMatrix = (vector: ElementType[]): MultiArray => {
        const result = new MultiArray([vector.length, vector.length]);
        result.array.map((_, i, array) => (array[i][i] = vector[i]));
        return result;
    };

    /**
     * Check if object is a scalar or a 2-D MultiArray.
     * @param obj Any object.
     * @returns `true` if object is a row vector or a column vector. false otherwise.
     */
    public static readonly isMatrix = (obj: unknown): boolean => !(obj instanceof MultiArray) || obj.dimension.length === 2;

    /**
     * Returns `true` if `obj` any one of its dimensions is zero.
     * Returns `false` otherwise.
     * @param obj Any object.
     * @returns `true` if object is an empty array.
     */
    public static readonly isEmpty = (obj: unknown): boolean => obj instanceof MultiArray && (obj as MultiArray).dimension.reduce((p, c) => p * c, 1) === 0;

    /**
     * Check if object is a MultiArray and it is a cell array.
     * @param obj Any object.
     * @returns `true` if object is a cell array. false otherwise.
     */
    public static readonly isCellArray = (obj: unknown): boolean => obj instanceof MultiArray && obj.isCell;

    /**
     *
     * @param M
     * @returns
     */
    public static readonly isComplexMultiArray = (M: MultiArray): boolean => {
        let result = false;
        for (let i = 0; i < M.dimensionR.reduce((a, b) => a * b, 1); i++) {
            for (let j = 0; j < M.dimension[1]; j++) {
                if (Complex.isComplexValue(M.array[i][j] as ComplexType)) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    };

    /**
     * Set type property in place with maximum value of array items type.
     * @param M MultiArray to set type property.
     */
    public static readonly setType = (M: MultiArray): void => {
        M.type = Math.max(...M.array.map((row) => Math.max(...row.map((value) => value!.type))));
    };

    /**
     * Test if two array are equals.
     * @param left Array<boolean | number | string>.
     * @param right Array<boolean | number | string>.
     * @returns true if two arrays are equals. false otherwise.
     */
    public static readonly arrayEquals = (a: (boolean | number | string)[], b: (boolean | number | string)[]): boolean =>
        a.length === b.length && a.every((value, index) => value === b[index]);

    /**
     * Returns a one-based range array ([1, 2, ..., length]).
     * @param length Length or last value of range array.
     * @returns Range array.
     */
    public static readonly rangeArray = (length: number): number[] => {
        const result = [];
        for (let i = 1; i <= length; i++) {
            result.push(i);
        }
        return result;
    };

    /**
     * Converts linear index to subscript.
     * @param dimension Dimensions of multidimensional array ([line, column, page, block, ...]).
     * @param index Zero-based linear index.
     * @returns One-based subscript ([line, column, page, block, ...]).
     */
    public static readonly linearIndexToSubscript = (dimension: number[], index: number): number[] =>
        dimension.map((dim, i) => (Math.floor(index / dimension.slice(0, i).reduce((p, c) => p * c, 1)) % dim) + 1);

    /**
     * Converts subscript to linear index.
     * @param dimension Dimensions of multidimensional array ([lines, columns, pages, blocks, ...]).
     * @param subscript One-based subscript ([line, column, page, block, ...]).
     * @returns Zero-based linear index.
     */
    public static readonly subscriptToLinearIndex = (dimension: number[], subscript: number[]): number =>
        subscript.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);

    /**
     * Converts linear index to MultiArray.array subscript.
     * @param row Row dimension.
     * @param column Column dimension.
     * @param index Zero-based linear index.
     * @returns MultiArray.array subscript ([row, column]).
     */
    public static readonly linearIndexToMultiArrayRowColumn = (row: number, column: number, index: number): [number, number] => {
        const pageLength = row * column;
        const indexPage = index % pageLength;
        return [Math.floor(index / pageLength) * row + (indexPage % row), Math.floor(indexPage / row)];
    };

    /**
     * Converts MultiArray subscript to MultiArray.array subscript.
     * @param dimension MultiArray dimension.
     * @param subscript Subscript.
     * @returns MultiArray.array subscript ([row, column]).
     */
    public static readonly subscriptToMultiArrayRowColumn = (dimension: number[], subscript: number[]): [number, number] => {
        const index = subscript.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);
        const pageLength = dimension[0] * dimension[1];
        const indexPage = index % pageLength;
        return [Math.floor(index / pageLength) * dimension[0] + (indexPage % dimension[0]), Math.floor(indexPage / dimension[0])];
    };

    /**
     * Converts MultiArray raw row and column to MultiArray linear index.
     * @param dimension MultiArray dimension (can be only the two first dimensions)
     * @param i Raw row
     * @param j Raw column
     * @returns Linear index
     */
    public static readonly rowColumnToLinearIndex = (dimension: number[], i: number, j: number): number =>
        Math.floor(i / dimension[0]) * dimension[0] * dimension[1] + j * dimension[0] + (i % dimension[0]);

    /**
     * Converts MultiArray raw row and column to MultiArray subscript.
     * @param dimension
     * @param i
     * @param j
     * @returns
     */
    public static readonly rowColumnToSubscript = (dimension: number[], i: number, j: number): number[] => {
        const index = Math.floor(i / dimension[0]) * dimension[0] * dimension[1] + j * dimension[0] + (i % dimension[0]);
        return dimension.map((dim, i) => (Math.floor(index / dimension.slice(0, i).reduce((p, c) => p * c, 1)) % dim) + 1);
    };

    /**
     * Compute stride vector (column-major order).
     * Example: [3,4,2] → [1, 3, 12]
     */
    public static readonly computeStrides = (dim: number[]): number[] => {
        const strides = new Array(dim.length);
        let stride = 1;
        for (let i = 0; i < dim.length; i++) {
            strides[i] = stride;
            stride *= dim[i];
        }
        return strides;
    };

    /**
     *
     * @param M
     * @param dim
     * @returns
     */
    public static readonly getStride = (M: MultiArray, dim: number): number => M.dimension.slice(dim + 1).reduce((p, c) => p * c, 1);

    /**
     * Returns a 2D slice corresponding to page k (for 3D+ arrays).
     * @param M
     * @param pageIndex
     * @returns
     */
    public static readonly pageSlice = (M: MultiArray, pageIndex: number): ComplexType[][] => {
        const dim = M.dimension;
        if (dim.length <= 2) return M.array as ComplexType[][];

        const [rows, cols] = dim.slice(-2);
        const totalPages = dim.slice(0, -2).reduce((a, b) => a * b, 1);
        if (pageIndex >= totalPages) {
            throw new RangeError(`pageSlice: invalid page index ${pageIndex}/${totalPages}`);
        }

        const flat = MultiArray.flatten(M) as ComplexType[];
        const offset = pageIndex * rows * cols;

        const page: ComplexType[][] = [];
        for (let i = 0; i < rows; i++) {
            const row: ComplexType[] = [];
            for (let j = 0; j < cols; j++) {
                row.push(flat[offset + i + j * rows]);
            }
            page.push(row);
        }

        return page;
    };

    /**
     * Sets the 2D pageIndex page in an N-D (row-major) MultiArray.
     * @param M
     * @param pageIndex
     * @param pageData
     */
    public static readonly setPage = (M: MultiArray, pageIndex: number, pageData: ComplexType[][]): void => {
        const [rows, cols, ...tail] = M.dimension;
        const totalPages = tail.reduce((a, b) => a * b, 1) || 1;
        if (pageIndex >= totalPages) throw new RangeError(`setPage: invalid page index ${pageIndex}/${totalPages}`);

        const startRow = pageIndex * rows;
        for (let i = 0; i < rows; i++) {
            M.array[startRow + i].splice(0, cols, ...pageData[i]);
        }
    };

    /**
     * Returns content as 1D array (column-major linear order), length = product(dimension).
     * @param arr
     * @returns
     */
    public static readonly toFlatArray = (arr: MultiArray): ComplexType[] => {
        const dims = arr.dimension;
        const total = dims.reduce((p, c) => p * c, 1);
        const out: ComplexType[] = new Array(total);
        for (let lin = 0; lin < total; lin++) {
            /* map linear index -> physical row/col in arr.array */
            const [row, col] = MultiArray.linearIndexToMultiArrayRowColumn(dims[0], dims[1], lin);
            /* defensive: if arr.array[row] or arr.array[row][col] missing, throw informative error */
            if (!arr.array[row] || typeof arr.array[row][col] === 'undefined') {
                throw new Error(`toFlatArray: missing element at linear ${lin} -> array[${row}][${col}] is undefined.`);
            }
            out[lin] = arr.array[row][col] as ComplexType;
        }
        return out;
    };

    /**
     * Reconstructs arr.array (2D physical storage) from the column-major linear vector.
     * @param arr
     * @param flat
     */
    public static readonly fromFlatArray = (arr: MultiArray, flat: ComplexType[]): void => {
        const dims = arr.dimension;
        const total = dims.reduce((p, c) => p * c, 1);
        if (flat.length !== total) {
            throw new Error(`fromFlatArray: length mismatch (flat ${flat.length} vs expected ${total}).`);
        }
        /* ensure arr.array is allocated with the right number of physical rows */
        const rows = dims[0];
        const tailProd = dims.slice(2).reduce((p, c) => p * c, 1);
        const physicalRows = rows * Math.max(1, tailProd);
        if (!Array.isArray(arr.array) || arr.array.length !== physicalRows) {
            arr.array = new Array(physicalRows);
            for (let r = 0; r < physicalRows; r++) arr.array[r] = new Array(dims[1]).fill(undefined);
        }
        for (let lin = 0; lin < total; lin++) {
            const [row, col] = MultiArray.linearIndexToMultiArrayRowColumn(dims[0], dims[1], lin);
            arr.array[row][col] = flat[lin];
        }
    };

    /**
     * Check if two MultiArrays have the same shape, or if they are identical
     * except for one dimension d where both have size 3.
     *
     * Returns true if either:
     *  - A.dimension equals B.dimension (exact match), or
     *  - there exists an index d such that A.dimension[d] === 3 and B.dimension[d] === 3
     *    and for every i !== d we have A.dimension[i] === B.dimension[i].
     *
     * This matches the requirement of cross(A,B) where the operation dimension
     * must have length 3 while all other dimensions must match.
     * @param A
     * @param B
     * @returns
     */
    public static readonly sameSizeExcept = (A: MultiArray, B: MultiArray): boolean => {
        const ad = A.dimension;
        const bd = B.dimension;
        if (ad.length !== bd.length) return false;
        /* exact match */
        let allEqual = true;
        for (let i = 0; i < ad.length; i++) {
            if (ad[i] !== bd[i]) {
                allEqual = false;
                break;
            }
        }
        if (allEqual) return true;
        /* Try each dimension as the candidate operation dimension (must be 3 in both) */
        for (let d = 0; d < ad.length; d++) {
            if (ad[d] === 3 && bd[d] === 3) {
                let ok = true;
                for (let i = 0; i < ad.length; i++) {
                    if (i === d) continue;
                    if (ad[i] !== bd[i]) {
                        ok = false;
                        break;
                    }
                }
                if (ok) return true;
            }
        }
        return false;
    };

    /**
     * Base method of the ind2sub function. Returns dimension.length + 1
     * dimensions. If the index exceeds the dimensions, the last dimension
     * will contain the multiplier of the other dimensions. Otherwise it will
     * be 1.
     * @param dimension Array of dimensions.
     * @param index One-base linear index.
     * @returns One-based subscript ([line, column, page, block, ...]).
     */
    public static readonly ind2subNumber = (dimension: number[], index: number): number[] => {
        dimension = [...dimension, index + 1];
        return dimension.map((dim, i) => Math.floor((index - 1) / dimension.slice(0, i).reduce((p, c) => p * c, 1)) % dim).map((d) => d + 1);
    };

    /**
     * Returns the number of elements in M.
     * @param M Multidimensional array.
     * @returns Number of elements in M.
     */
    public static readonly linearLength = (M: MultiArray): number => M.array.length * M.dimension[1];

    /**
     * Get dimension at index d of MultiArray M
     * @param M MultiArray.
     * @param d Zero-based dimension index.
     * @returns Dimension d.
     */
    public static readonly getDimension = (M: MultiArray, d: number): number => (d < M.dimension.length ? M.dimension[d] : 1);

    /**
     * Remove singleton tail of dimension array in place.
     * @param dimension Dimension array.
     */
    public static readonly removeSingletonTail = (dimension: number[]): void => {
        let i = dimension.length - 1;
        while (dimension[i] === 1 && i > 1) {
            dimension.pop();
            i--;
        }
    };

    /**
     * Append singleton tail of dimension array in place.
     * @param dimension Dimension array.
     * @param length Resulting length of dimension array.
     */
    public static readonly appendSingletonTail = (dimension: number[], length: number): void => {
        if (length > dimension.length) {
            dimension.push(...new Array(length - dimension.length).fill(1));
        }
    };

    /**
     * Find first non-single dimension.
     * @param M MultiArray.
     * @returns First non-single dimension of `M`.
     */
    // public static readonly firstNonSingleDimension = (M: MultiArray): number => {
    //     const first = M.dimension.findIndex((d) => d !== 1);
    //     return first !== -1 ? first : 0; /* Returns first index if all dimensions is 1. */
    //     // return first !== -1 ? first : M.dimension.length - 1; /* Returns last index if all dimensions is 1. */
    //     // for (let i = 0; i < M.dimension.length; i++) {
    //     //     if (M.dimension[i] !== 1) {
    //     //         return i;
    //     //     }
    //     // }
    //     // return M.dimension.length - 1;
    // }
    public static readonly firstNonSingleDimension = (M: MultiArray): number => {
        /* Treat scalars and arrays with no dimension greater than 1 as dimension 0. */
        if (!M.dimension || M.dimension.length === 0) return 0;
        const idx = M.dimension.findIndex((d) => d > 1);
        return idx >= 0 ? idx : 0;
    };

    /**
     * Creates a MultiArray object from the first row of elements (for
     * parsing purposes).
     * @param row Array of objects.
     * @returns MultiArray with `row` parameter as first line.
     */
    public static readonly firstRow = (row: ElementType[], iscell?: boolean): MultiArray => {
        const result = new MultiArray([1, row.length]);
        result.array[0] = row;
        result.array[0].forEach((element: ElementType) => {
            element!.parent = result;
        });
        result.isCell = iscell ?? false;
        return result;
    };

    /**
     * Append a row of elements to a MultiArray object (for parsing
     * purposes).
     * @param M MultiArray.
     * @param row Array of objects to append as row of MultiArray.
     * @returns MultiArray with row appended.
     */
    public static readonly appendRow = (M: MultiArray, row: ElementType[]): MultiArray => {
        row.forEach((element: ElementType) => {
            element!.parent = M;
        });
        M.array.push(row);
        M.dimension[0]++;
        return M;
    };

    /**
     * Unparse MultiArray.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray.
     */
    public static readonly unparse = (M: MultiArray, interpreter: Interpreter, parentPrecedence = 0): string => {
        const unparseRows = (row: ElementType[]) => row.map((value) => interpreter.Unparse(value)).join() + ';\n';
        let arraystr: string = '';
        if (M.dimension.reduce((p, c) => p * c, 1) === 0) {
            return `${M.isCell ? '{ }' : '[ ]'}(${M.dimension.join('x')})`;
        }
        if (M.dimension.length > 2) {
            let result = '';
            for (let p = 0; p < M.array.length; p += M.dimension[0]) {
                arraystr = M.array
                    .slice(p, p + M.dimension[0])
                    .map(unparseRows)
                    .join('');
                arraystr = arraystr.substring(0, arraystr.length - 2);
                result += `${M.isCell ? '{' : '['}${arraystr}${M.isCell ? '}' : ']'} (:,:,${MultiArray.linearIndexToSubscript(M.dimensionR, p).slice(1).join()})\n`;
            }
            return result;
        } else {
            arraystr = M.array.map(unparseRows).join('');
            arraystr = arraystr.substring(0, arraystr.length - 2);
            return `${M.isCell ? '{' : '['}${arraystr}${M.isCell ? '}' : ']'}`;
        }
    };

    /**
     * Create a string simple representation for a MultiArray (only dimensions).
     * @returns
     */
    public toString(): string {
        return `array ${this.dimension.join('x')}`;
    }

    /**
     * Unparse MultiArray as MathML language.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray in MathML language.
     */
    public static readonly unparseMathML = (M: MultiArray, interpreter: Interpreter, parentPrecedence = 0): string => {
        const unparseRows = (row: ElementType[]) => `<mtr>${row.map((value) => `<mtd>${interpreter.UnparserMathML(value)}</mtd>`).join('')}</mtr>`;
        const buildMrow = (rows: string) =>
            `<mrow><mo fence="true" stretchy="true">${M.isCell ? '{' : '['}</mo><mtable>${rows}</mtable><mo fence="true" stretchy="true">${M.isCell ? '}' : ']'}</mo></mrow>`;
        if (M.dimension.reduce((p, c) => p * c, 1) === 0) {
            return `${buildMrow('<mspace width="0.5em"/>')}<mo fence="true" stretchy="true">(</mo><mn>${M.dimension.join('</mn><mi>&times;</mi><mn>')}</mn><mo fence="true" stretchy="true">)</mo>`;
        }
        if (M.dimension.length > 2) {
            let result = '';
            for (let p = 0; p < M.array.length; p += M.dimension[0]) {
                const array = M.array
                    .slice(p, p + M.dimension[0])
                    .map(unparseRows)
                    .join('');
                const subscript = MultiArray.linearIndexToSubscript(M.dimensionR, p)
                    .slice(1)
                    .map((d) => `<mn>${d}</mn>`)
                    .join('<mo>,</mo>');
                result += `<mtr><mtd><msub>${buildMrow(array)}<mrow><mo fence="true" stretchy="true">(</mo><mo>:</mo><mo>,</mo><mo>:</mo><mo>,</mo>${subscript}<mo fence="true" stretchy="true">)</mo></mrow></msub></mtd></mtr>`;
            }
            return `<mtable>${result}</mtable>`;
        } else {
            return buildMrow(M.array.map(unparseRows).join(''));
        }
    };

    /**
     * Converts CharString to MultiArray.
     * @param text CharString.
     * @returns MultiArray with character codes as integer.
     */
    public static readonly fromCharString = (text: CharString): MultiArray => {
        if (text.str.length > 0) {
            const result = new MultiArray([1, text.str.length]);
            result.array = [text.str.split('').map((char) => Complex.create(char.charCodeAt(0)))];
            result.type = Complex.REAL;
            return MultiArray.MultiArrayToScalar(result) as MultiArray;
        } else {
            return MultiArray.emptyArray();
        }
    };

    /**
     * Linearize MultiArray in an array of ElementType using row-major
     * order.
     * @param M
     * @returns
     */
    public static readonly flatten = (M: MultiArray): ElementType[] => {
        const result: ElementType[] = [];
        for (let p = 0; p < M.array[0].length; p++) {
            for (let j = 0; j < M.array.length; j++) {
                result.push(M.array[j][p]);
            }
        }
        return result;
    };

    /**
     * Linearize MultiArray in an array of ElementType using column-major
     * order.
     * @param M Multidimensional array.
     * @returns `ElementType[]` of multidimensional array `M` linearized.
     */
    public static readonly linearize = (M: ElementType): ElementType[] => {
        if (M instanceof MultiArray) {
            const result: ElementType[] = [];
            for (let p = 0; p < M.array.length; p += M.dimension[0]) {
                for (let j = 0; j < M.dimension[1]; j++) {
                    result.push(...M.array.slice(p, p + M.dimension[0]).map((row: ElementType[]) => row[j]));
                }
            }
            return result;
        } else {
            return [M];
        }
    };

    /**
     * Returns a empty array (0x0 matrix).
     * @returns Empty array (0x0 matrix).
     */
    public static readonly emptyArray = (iscell?: boolean): MultiArray => {
        const result = new MultiArray([0, 0]);
        result.isCell = iscell ?? false;
        return result;
    };

    /**
     * Convert scalar to MultiArray with aditional test if it is MultiArray.
     * @param value
     * @param test
     * @returns
     */
    private static readonly scalarToMultiArrayWithTest = (value: ElementType, test: boolean): MultiArray => {
        if (value instanceof MultiArray && test) {
            return value;
        } else {
            const result = new MultiArray([1, 1]);
            result.array[0] = [value];
            result.type = value!.type ?? -1;
            return result;
        }
    };

    /**
     * If value is a scalar then convert to a 1x1 MultiArray. If is cell array
     * the cell is put in a 1x1 MultiArray too.
     * @param value MultiArray or scalar.
     * @returns MultiArray 1x1 if value is scalar.
     */
    public static readonly scalarToMultiArray = (value: ElementType): MultiArray => MultiArray.scalarToMultiArrayWithTest(value, !(value as MultiArray).isCell);

    /**
     * If value is a scalar then convert to a 1x1 MultiArray. If is common
     * array or cell array returns `value` unchanged.
     * @param value MultiArray or scalar.
     * @returns MultiArray 1x1 if value is scalar.
     */
    public static readonly scalarOrCellToMultiArray = (value: ElementType): MultiArray => MultiArray.scalarToMultiArrayWithTest(value, true);

    /**
     * If `value` parameter is a MultiArray of size 1x1 then returns as scalar.
     * @param value MultiArray or scalar.
     * @returns Scalar value if `value` parameter has all dimensions as singular.
     */
    public static readonly MultiArrayToScalar = (value: ElementType): ElementType => {
        if (value instanceof MultiArray && value.dimension.length === 2 && value.dimension[0] === 1 && value.dimension[1] === 1) {
            return value.array[0][0];
        } else {
            return value;
        }
    };

    /**
     * If `value` parameter is a non empty MultiArray returns it's first element.
     * Otherwise returns `value` parameter.
     * @param value
     * @returns
     */
    public static readonly firstElement = (value: ElementType): ElementType => {
        return value instanceof MultiArray && value.dimension.reduce((p: number, c: number) => p * c, 1) > 0 ? value.array[0][0] : value;
    };

    /**
     * If M is a line vector then return the line of M else return first column of M.
     * @param M
     * @returns
     */
    public static readonly firstVector = (M: ElementType): ElementType[] => {
        if (M instanceof MultiArray) {
            if (M.dimension[0] === 1) {
                return M.array[0];
            } else {
                return M.array.map((row) => row[0]);
            }
        } else {
            return [M];
        }
    };

    /**
     * Copy of MultiArray.
     * @param M MultiArray.
     * @returns Copy of MultiArray.
     */
    public static readonly copy = (M: MultiArray): MultiArray => {
        const result = new MultiArray(M.dimension, undefined, M.isCell);
        result.array = M.array.map((row) => row.map((value) => value!.copy()));
        result.type = M.type;
        return result;
    };

    /**
     * Copy method (for element's generics).
     * @returns
     */
    public copy(): MultiArray {
        const result = new MultiArray(this.dimension, undefined, this.isCell);
        result.array = this.array.map((row) => row.map((value: ElementType<ELEMENT>) => (value as any).copy()));
        result.type = this.type;
        return result;
    }

    /**
     * Convert MultiArray to logical value. It's true if all elements is
     * non-null. Otherwise is false.
     * @param M
     * @returns
     */
    public static readonly toLogical = (M: MultiArray): ComplexType => {
        for (let i = 0; i < M.array.length; i++) {
            const row = M.array[i];
            for (let j = 0; j < M.dimension[1]; j++) {
                const value = (row[j] as ComplexType).toLogical();
                if (Complex.realEquals(value, 0)) {
                    /* if (value.re.eq(0)) { */
                    return Complex.false();
                }
            }
        }
        return Complex.true();
    };

    /**
     * toLogical method (for element's generics).
     * @returns
     */
    public toLogical(): ComplexType {
        for (let i = 0; i < this.array.length; i++) {
            const row = this.array[i];
            for (let j = 0; j < this.dimension[1]; j++) {
                const value = (row[j] as ComplexType).toLogical();
                if (Complex.realEquals(value, 0)) {
                    /* if (value.re.eq(0)) { */
                    return Complex.false();
                }
            }
        }
        return Complex.true();
    }

    /**
     * Expand Multidimensional array dimensions if dimensions in `dim` is greater than dimensions of `M`.
     * If a dimension of `M` is greater than corresponding dimension in `dim` it's unchanged.
     * The array is filled with zeros and is expanded in place.
     * @param M Multidimensional array.
     * @param dim New dimensions.
     */
    public static readonly expand = (M: MultiArray, dim: number[]): void => {
        let dimM = M.dimension.slice();
        let dimension = dim.slice();
        if (dimM.length < dimension.length) {
            dimM = dimM.concat(new Array(dimension.length - dimM.length).fill(1));
        }
        if (dimension.length < dimM.length) {
            dimension = dimension.concat(new Array(dimM.length - dimension.length).fill(1));
        }
        const resultDimension = dimension.map((d, i) => Math.max(d, dimM[i]));
        if (MultiArray.arrayEquals(dimM, resultDimension)) {
            return;
        }
        const blankValue: ElementType = M.array[0][0] instanceof Structure ? Structure.cloneFields(M.array[0][0]) : Complex.zero();
        const result = new MultiArray(resultDimension, blankValue);
        for (let n = 0; n < MultiArray.linearLength(M); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], n);
            const subscriptM = MultiArray.linearIndexToSubscript(M.dimension, n);
            const [p, q] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, subscriptM);
            result.array[p][q] = M.array[i][j];
        }
        MultiArray.removeSingletonTail(result.dimension);
        M.dimension = result.dimension;
        M.array = result.array;
    };

    /**
     * Reshape an array acording dimensions in `dim`.
     * @param M MultiArray.
     * @param dim Result dimensions.
     * @param d Undefined dimension index (optional).
     * @returns
     */
    public static readonly reshape = (M: MultiArray, dim: number[], d: number = -1): MultiArray => {
        const lengthM = M.dimension.reduce((p, c) => p * c, 1);
        const dimension = dim.slice();
        if (d !== -1) {
            dimension[d as number] = 1;
            const restDimension = dimension.reduce((p, c) => p * c, 1);
            if (restDimension <= lengthM && Number.isInteger(lengthM / restDimension)) {
                dimension[d as number] = lengthM / restDimension;
            } else {
                throw new Error(`reshape: SIZE is not divisible by the product of known dimensions (= ${restDimension})`);
            }
        } else {
            const dimensionLength = dimension.reduce((p, c) => p * c, 1);
            if (lengthM !== dimensionLength) {
                throw new Error(`reshape: can't reshape ${M.dimension.join('x')} array to ${dimension.join('x')} array`);
            }
        }
        let result: MultiArray;
        if (M.dimension[1] === dimension[1]) {
            result = MultiArray.copy(M);
            result.dimension = dimension;
        } else {
            result = new MultiArray(dimension);
            MultiArray.rawMapLinearIndex(M, (element, index) => {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
                result.array[i][j] = element;
                return element;
            });
        }
        result.type = M.type;
        MultiArray.removeSingletonTail(result.dimension);
        return result;
    };

    /**
     * Expand range.
     * @param startNode Start of range.
     * @param stopNode Stop of range.
     * @param strideNode Optional stride value.
     * @returns MultiArray of range expanded.
     */
    public static readonly expandRange = (start: ComplexType, stop: ComplexType, stride?: ComplexType | null): MultiArray => {
        const expanded = [];
        const s = stride ? Complex.realToNumber(stride) : 1;
        for (let n = Complex.realToNumber(start), i = 0; s > 0 ? n <= Complex.realToNumber(stop) : n >= Complex.realToNumber(stop); n += s, i++) {
            expanded[i] = Complex.create(n);
        }
        const result = new MultiArray([1, expanded.length]);
        result.array = [expanded];
        MultiArray.setType(result);
        return result;
    };

    /**
     * Expand colon to a column vector.
     * @param length
     * @returns
     */
    public static readonly expandColon = (length: number): MultiArray => {
        const result = new MultiArray([length, 1]);
        for (let i = 0; i < length; i++) {
            result.array[i] = [Complex.create(i + 1)];
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Detect whether MultiArray `M` contains any non-zero imaginary part.
     * @param M MultiArray to test.
     * @returns `true` if any element has non-zero imaginary component.
     * `false` otherwise.
     */
    public static readonly haveAnyComplex = (M: MultiArray): boolean => {
        for (let i = 0; i < M.dimension[0]; i++) {
            for (let j = 0; j < M.dimension[1]; j++) {
                if (!Complex.imagIsZero(M.array[i][j] as ComplexType)) return true;
            }
        }
        return false;
    };

    /**
     * Check if subscript is a integer number, convert Complex to
     * number.
     * @param k Index as Complex.
     * @param prefix Optional id reference of object.
     * @returns k as number, if real part is integer greater than 1 and imaginary part is 0.
     */
    public static readonly testInteger = (k: ComplexType, prefix?: string, infix?: string, constraint?: number | [number, number]): number => {
        const throwRangeError = (prefix?: string, infix?: string, postfix?: string): never => {
            throw new RangeError((prefix ? prefix + ': ' : '') + infix + ' must be ' + postfix);
        };
        if (!Complex.realIsInteger(k) || Complex.realLessThan(k, 1)) {
            throwRangeError(prefix, infix, 'either integers greater than or equal 1 or logicals.');
        }
        if (!Complex.imagEquals(k, 0)) {
            throwRangeError(prefix, infix, 'real.');
            throw new RangeError((prefix ? prefix + ': ' : '') + infix + ' must be real.');
        }
        const result = Complex.realToNumber(k);
        const typeOfConstraint = typeof constraint;
        if (typeOfConstraint !== 'undefined') {
            if (typeOfConstraint === 'number') {
                if (result > (constraint as number)) {
                    throwRangeError(prefix, infix, 'less than or equal to ' + (constraint as number) + ' ');
                }
            } else {
                if (result < (constraint as [number, number])[0]) {
                    throwRangeError(prefix, infix, 'greater than or equal to' + (constraint as [number, number])[0] + ' ');
                }
                if (result > (constraint as [number, number][1])) {
                    throwRangeError(prefix, infix, 'less than or equal to' + (constraint as [number, number])[1] + ' ');
                }
            }
        }
        return result;
    };

    /**
     * Check if subscript is a integer number, convert Complex to
     * number.
     * @param k Index as Complex.
     * @param input Optional id reference of object.
     * @returns k as number, if real part is integer greater than 1 and imaginary part is 0.
     */
    public static readonly testIndex = (k: ComplexType, input?: string): number => {
        if (!Complex.realIsInteger(k) || Complex.realLessThan(k, 1)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be either integers greater than or equal 1 or logicals.`);
        }
        if (!Complex.imagEquals(k, 0)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be real.`);
        }
        return Complex.realToNumber(k);
    };

    /**
     * Check if subscript is a integer number, convert Complex to
     * number, then check if it's less than bound.
     * @param k Index as Complex.
     * @param bound Maximum acceptable value for the index
     * @param dim Dimensions (to generate error message)
     * @param input Optional string to generate error message.
     * @returns Index as number.
     */
    public static readonly testIndexBound = (k: ComplexType, bound: number, dim: number[], input?: string): number => {
        const result = MultiArray.testIndex(k, input);
        if (result > bound) {
            throw new RangeError(`${input ? `${input}: ` : ``}out of bound ${bound} (dimensions are ${dim.join('x')}).`);
        }
        return result;
    };

    /**
     * Converts subscript to linear index. Performs checks and throws
     * comprehensive errors if dimension bounds are exceeded.
     * @param dimension Dimension of multidimensional array ([line, column, page, block, ...]) as number[].
     * @param subscript Subscript ([line, column, page, block, ...]) as a Complex[].
     * @param input Input string to generate error messages (the id of array).
     * @returns linear index.
     */
    public static readonly parseSubscript = (dimension: number[], subscript: ComplexType[], input?: string, interpreter?: Interpreter): number => {
        /* Converts Complex[] subscript parameter to number[]. */
        const index = subscript.map((i) => MultiArray.testIndex(i, `${input ? input : ''}${interpreter ? '(' + subscript.map((i) => interpreter.Unparse(i)).join() + ')' : ''}`));
        /**
         * Throws comprehensive out of bound error indicating subscript index and bound.
         * @param indexPosition Position of subscript index out of bound.
         * @param bound Bound.
         */
        const throwError = (indexPosition: number, bound: number): void => {
            /**
             * Create notation to denote irrelevant subscripts. Returns `'_,_,_,_'`
             * with `length` `'_'` elements or `'...[x${length}]...'` if length > 4.
             * @param length Length of notation.
             * @returns String notation.
             */
            const irrelevantSubscript = (length: number): string => {
                return length > 4 ? `...[x${length}]...` : new Array(length).fill('_').join();
            };
            const left = irrelevantSubscript(indexPosition);
            const right = irrelevantSubscript(index.length - indexPosition - 1);
            throw new RangeError(
                `${input ? input : ''}(${left}${left ? ',' : ''}${index[indexPosition]}${right ? ',' : ''}${right}): out of bound ${bound} (dimensions are ${dimension.join('x')}).`,
            );
        };
        /* Copy index to indexReduced and remove singleton tail. */
        const indexReduced = index.slice();
        MultiArray.removeSingletonTail(indexReduced);
        if (indexReduced.length > dimension.length) {
            /* Error if indexReduced has more dimensions than dimension parameter. */
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                throwError(dimFail, 1);
            }
        }
        let dim: number[];
        if (index.length < dimension.length) {
            /* Copy dimension parameter. */
            dim = dimension.slice();
            /* Test if some index greater than dim. */
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                if (dimFail === index.length - 1) {
                    /* Last index is greater than corresponding dimension. Test if it's greater than dimension tail. */
                    const bound = dim.slice(index.length - 1).reduce((p, c) => p * c, 1);
                    if (index[index.length - 1] > bound) {
                        throwError(dimFail, bound);
                    }
                } else {
                    /* Error before last index. */
                    throwError(dimFail, dim[dimFail]);
                }
            }
        } else {
            /* Copy dimension parameter and append 1 until it has the same length of index if necessary. */
            dim = dimension.concat(new Array(index.length - dimension.length).fill(1));
            /* Test if some index greater than dim. */
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                throwError(dimFail, dim[dimFail]);
            }
        }
        return indexReduced.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);
    };

    /**
     * Binary operation 'scalar `operation` array'.
     * @param op Binary operation name.
     * @param left Left operand (scalar).
     * @param right Right operand (array).
     * @returns Result of operation.
     */
    public static readonly scalarOpMultiArray = (op: TBinaryOperationName, left: ComplexType, right: MultiArray): MultiArray => {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => Complex[op](left, value as ComplexType)));
        MultiArray.setType(result);
        return result;
    };

    /**
     * Binary operation 'array `operation` scalar'.
     * @param op Binary operation name.
     * @param left Left operand (array).
     * @param right Right operaand (scalar).
     * @returns Result of operation.
     */
    public static readonly MultiArrayOpScalar = (op: TBinaryOperationName, left: MultiArray, right: ComplexType): MultiArray => {
        const result = new MultiArray(left.dimension);
        result.array = left.array.map((row) => row.map((value) => Complex[op](value as ComplexType, right)));
        MultiArray.setType(result);
        return result;
    };

    /**
     * Unary left operation.
     * @param op Unary operation name.
     * @param right Operand (array)
     * @returns Result of operation.
     */
    public static readonly leftOperation = (op: TUnaryOperationLeftName, right: MultiArray): MultiArray => {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => Complex[op](value as ComplexType)));
        MultiArray.setType(result);
        return result;
    };

    /**
     * Binary element-wise operation with full MATLAB-compatible broadcasting.
     * Supports N-D arrays and row/column vector expansion.
     * @param op Binary operation.
     * @param left Left operand.
     * @param right Right operand.
     * @returns Binary element-wise result.
     */
    public static readonly elementWiseOperation = (op: TBinaryOperationName, left: MultiArray, right: MultiArray): MultiArray => {
        /* Clone the dimensions */
        let leftDim = left.dimension.slice();
        let rightDim = right.dimension.slice();
        /* Normalizes the number of dimensions. */
        const maxDim = Math.max(leftDim.length, rightDim.length);
        while (leftDim.length < maxDim) leftDim.push(1);
        while (rightDim.length < maxDim) rightDim.push(1);
        /* It verifies conformity and determines resulting dimensions. */
        const resultDim = new Array<number>(maxDim);
        const leftBroadcast = new Array<boolean>(maxDim);
        const rightBroadcast = new Array<boolean>(maxDim);
        for (let i = 0; i < maxDim; i++) {
            const ld = leftDim[i];
            const rd = rightDim[i];
            if (ld === rd) {
                resultDim[i] = ld;
                leftBroadcast[i] = rightBroadcast[i] = false;
            } else if (ld === 1) {
                resultDim[i] = rd;
                leftBroadcast[i] = true;
                rightBroadcast[i] = false;
            } else if (rd === 1) {
                resultDim[i] = ld;
                leftBroadcast[i] = false;
                rightBroadcast[i] = true;
            } else {
                throw new EvalError(`operator ${op}: nonconformant arguments (op1 is ${leftDim.join('x')}, op2 is ${rightDim.join('x')}).`);
            }
        }
        const leftStrides = MultiArray.computeStrides(leftDim);
        const rightStrides = MultiArray.computeStrides(rightDim);
        const resultStrides = MultiArray.computeStrides(resultDim);
        const totalElements = resultDim.reduce((a, b) => a * b, 1);
        const result = new MultiArray(resultDim);
        /* physical parameters for mapping linear -> (row,col) in physical storage (column-major) */
        const rowsL = leftDim[0],
            colsL = leftDim[1] || 1,
            pageLenL = rowsL * colsL;
        const rowsR = rightDim[0],
            colsR = rightDim[1] || 1,
            pageLenR = rowsR * colsR;
        const rowsO = resultDim[0],
            colsO = resultDim[1] || 1,
            pageLenO = rowsO * colsO;
        /* Main linear loop (optimized). */
        for (let n = 0; n < totalElements; n++) {
            /* 1) compute ND coords (0-based) in column-major using forward strides */
            let leftIndexLinear = 0;
            let rightIndexLinear = 0;
            for (let d = 0; d < maxDim; d++) {
                const coord = Math.floor(n / resultStrides[d]) % resultDim[d]; /* 0-based */
                const lcoord = leftBroadcast[d] ? 0 : coord;
                const rcoord = rightBroadcast[d] ? 0 : coord;
                leftIndexLinear += lcoord * leftStrides[d];
                rightIndexLinear += rcoord * rightStrides[d];
            }
            /* 2) map leftLinear -> physical (i,j) */
            const pageL = Math.floor(leftIndexLinear / pageLenL);
            const indexPageL = leftIndexLinear - pageL * pageLenL; /* leftIndexLinear % pageLenL */
            const i = pageL * rowsL + (indexPageL % rowsL);
            const j = Math.floor(indexPageL / rowsL);
            /* 3) map rightLinear -> physical (k,l) */
            const pageR = Math.floor(rightIndexLinear / pageLenR);
            const indexPageR = rightIndexLinear - pageR * pageLenR;
            const k = pageR * rowsR + (indexPageR % rowsR);
            const l = Math.floor(indexPageR / rowsR);
            /* 4) map result linear n -> physical (o,p) */
            const pageO = Math.floor(n / pageLenO);
            const indexPageO = n - pageO * pageLenO;
            const o = pageO * rowsO + (indexPageO % rowsO);
            const p = Math.floor(indexPageO / rowsO);
            /* 5) perform op */
            result.array[o][p] = Complex[op](left.array[i][j] as ComplexType, right.array[k][l] as ComplexType);
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results.
     * @param M MultiArray.
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static readonly rawMap = (M: MultiArray, callback: Function): MultiArray => {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row) => row.map(callback as (value: ElementType, index: number, array: ElementType[]) => ElementType));
        MultiArray.setType(result);
        return result;
    };

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results. Pass indices
     * to callback function. The index parameter is the array linear index
     * of element parameter.
     * @param M MultiArray
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static readonly rawMapRowColumn = (M: MultiArray, callback: (element: ElementType, i: number, j: number) => ElementType): MultiArray => {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row, i) => row.map((element, j) => callback(element, i, j)));
        MultiArray.setType(result);
        return result;
    };

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results. Pass indices
     * to callback function. The index parameter is the array linear index
     * of element parameter.
     * @param M MultiArray.
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static readonly rawMapLinearIndex = (M: MultiArray, callback: (element: ElementType, index: number, i?: number, j?: number) => ElementType): MultiArray => {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row, i) =>
            row.map((element, j) => callback(element, Math.floor(i / M.dimension[0]) * M.dimension[0] * M.dimension[1] + j * M.dimension[0] + (i % M.dimension[0]), i, j)),
        );
        MultiArray.setType(result);
        return result;
    };

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * along a specified dimension, and returns an MultiArray that contains
     * the results. Pass dimension index and MultiArray row and column to
     * callback function.
     * @param dimension Dimension to map.
     * @param M MultiArray
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static readonly alongDimensionMap = (dimension: number, M: MultiArray, callback: (element: ElementType, d: number, i: number, j: number) => ElementType): MultiArray => {
        const result = new MultiArray(M.dimension);
        if (dimension >= M.dimension.length) {
            result.array = M.array.map((row, i) => row.map((element, j) => callback(element, 0, i, j)));
        } else {
            const subscriptC = M.dimension.slice();
            subscriptC[dimension] = 1;
            const length = subscriptC.reduce((p, c) => p * c, 1);
            const range = subscriptC.map((s) => MultiArray.rangeArray(s));
            for (let n = 0; n < length; n++) {
                for (let d = 1; d <= M.dimension[dimension]; d++) {
                    const args = range.slice();
                    args[dimension] = [d];
                    const subscriptM = MultiArray.linearIndexToSubscript(subscriptC, n).map((s, r) => args[r][s - 1]);
                    const [i, j] = MultiArray.subscriptToMultiArrayRowColumn(M.dimension, subscriptM);
                    if (!result.array[i]) {
                        result.array[i] = [];
                    }
                    result.array[i][j] = callback(M.array[i][j], subscriptM[dimension] - 1, i, j);
                }
            }
        }
        MultiArray.setType(result);
        return result;
    };

    /**
     *
     * @param M
     * @param DIM
     * @returns
     */
    public static readonly sizeAlongDimension = (M: MultiArray, DIM?: ElementType): number => {
        const dim = typeof DIM !== 'undefined' ? Complex.realToNumber(MultiArray.firstElement(DIM) as ComplexType) - 1 : Math.max(0, MultiArray.firstNonSingleDimension(M));
        return M.dimension[dim];
    };

    /**
     * Returns the element at the given index along the specified dimension.
     * @param M MultiArray instance
     * @param dimension Dimension index (0-based)
     * @param index Index along the dimension (0-based)
     * @returns ElementType
     */
    public static readonly getElementAlongDimension = (M: MultiArray, dimension: number, index: number): ElementType => {
        const dims = M.dimension;
        if (dimension < 0 || dimension >= dims.length) {
            throw new RangeError(`getElementAlongDimension: invalid dimension ${dimension} for array of ${dims.length}D`);
        }
        if (index < 0 || index >= dims[dimension]) {
            throw new RangeError(`getElementAlongDimension: index ${index} out of bounds for dimension ${dimension} of size ${dims[dimension]}`);
        }
        /* To construct the access subscripts, we take all indices 1..N, except for the desired dimension. */
        const subscripts = new Array(dims.length).fill(1);
        subscripts[dimension] = index + 1; // +1 because subscript is 1-based in its implementation of subscriptToLinearIndex.
        const linearIndex = MultiArray.subscriptToLinearIndex(dims, subscripts);
        const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(dims[0], dims[1], linearIndex);
        return M.array[i][j];
    };

    /**
     *
     * @param elem
     * @param scalar
     * @returns
     */
    public static readonly divideElementByScalar = (elem: ElementType, scalar: ComplexType): ElementType => {
        if (MultiArray.isInstanceOf(elem)) {
            return MultiArray.rawMap(elem, (el: ElementType) => Complex.rdiv(el as ComplexType, scalar));
        } else {
            return Complex.rdiv(elem as ComplexType, scalar);
        }
    };

    /**
     *
     * @param meanElem
     * @param dim
     * @param d
     * @returns
     */
    public static readonly getMeanElementForPosition = (meanElem: ElementType, dim: number, d: number): ElementType => {
        if (MultiArray.isInstanceOf(meanElem)) {
            /* d is 1-based in alongDimensionMap, so we need (d - 1). */
            return MultiArray.getElementAlongDimension(meanElem, dim, d - 1);
        } else {
            return meanElem as ElementType;
        }
    };

    /**
     * Reduce one dimension of MultiArray putting entire dimension in one
     * element of resulting MultiArray as an Array. The resulting MultiArray
     * cannot be unparsed or used as argument of any other method of
     * MultiArray class.
     * @param dimension Dimension to reduce to Array
     * @param M MultiArray to be reduced.
     * @returns MultiArray reduced.
     */
    public static readonly reduceToArray = (dimension: number, M: MultiArray): MultiArray => {
        /* TODO: check if subscriptC inside for can be removed and if forS can be inverted like in mapAlongDimension. */
        if (dimension >= M.dimension.length) {
            /* TODO: check if it is consistent */
            return M;
        } else {
            const dimResult = M.dimension.slice();
            dimResult[dimension] = 1;
            const result = new MultiArray(dimResult);
            const subscriptC = M.dimension.slice();
            subscriptC[dimension] = 1;
            const length = subscriptC.reduce((p, c) => p * c, 1);
            for (let d = 1; d <= M.dimension[dimension]; d++) {
                const subscriptC = M.dimension.slice();
                subscriptC[dimension] = 1;
                const args = subscriptC.map((s) => MultiArray.rangeArray(s));
                args[dimension] = [d];
                for (let n = 0; n < length; n++) {
                    const subscriptM = MultiArray.linearIndexToSubscript(subscriptC, n).map((s, r) => args[r][s - 1]);
                    const linearM = MultiArray.subscriptToLinearIndex(M.dimension, subscriptM);
                    const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearM);
                    const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
                    if (d === 1) {
                        result.array[p][q] = [M.array[i][j]] as unknown as ElementType;
                    } else {
                        (result.array[p][q] as unknown as ElementType[]).push(M.array[i][j]);
                    }
                }
            }
            result.type = M.type;
            return result;
        }
    };

    /**
     * Contract MultiArray along `dimension` calling callback. This method is
     * analogous to the JavaScript Array.reduce function.
     * @param dimension Dimension to operate callback and contract.
     * @param M Multidimensional array.
     * @param callback Reduce function.
     * @param initial Optional initial value to set as previous in the first
     * call of callback. If not set the previous will be set to the first
     * element of dimension.
     * @returns Multiarray with `dimension` reduced using `callback`.
     */
    public static readonly reduce = (
        dimension: number,
        M: MultiArray,
        callback: (previous: ElementType, current: ElementType, index?: number) => ElementType,
        initial?: ElementType,
    ): ElementType => {
        if (dimension >= M.dimension.length) {
            return M;
        } else {
            const dimResult = M.dimension.slice();
            dimResult[dimension] = 1;
            const result = new MultiArray(dimResult);
            const subscriptC = M.dimension.slice();
            subscriptC[dimension] = 1;
            const length = subscriptC.reduce((p, c) => p * c, 1);
            const args = subscriptC.map((s) => MultiArray.rangeArray(s));
            for (let n = 0; n < length; n++) {
                const subscriptM = MultiArray.linearIndexToSubscript(subscriptC, n).map((s, r) => args[r][s - 1]);
                const linearM = MultiArray.subscriptToLinearIndex(M.dimension, subscriptM);
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearM);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
                result.array[p][q] = initial ? callback(initial, M.array[i][j], n) : M.array[i][j];
            }
            for (let d = 2; d <= M.dimension[dimension]; d++) {
                const subscriptC = M.dimension.slice();
                subscriptC[dimension] = 1;
                const args = subscriptC.map((s) => MultiArray.rangeArray(s));
                args[dimension] = [d];
                for (let n = 0; n < length; n++) {
                    const subscriptM = MultiArray.linearIndexToSubscript(subscriptC, n).map((s, r) => args[r][s - 1]);
                    const linearM = MultiArray.subscriptToLinearIndex(M.dimension, subscriptM);
                    const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearM);
                    const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
                    const subscriptP = MultiArray.linearIndexToSubscript(result.dimension, n);
                    subscriptP[dimension] = 1;
                    const [r, s] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, subscriptP);
                    result.array[p][q] = callback(result.array[r][s], M.array[i][j], n);
                }
            }
            MultiArray.setType(result);
            return MultiArray.MultiArrayToScalar(result);
        }
    };

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along `dimension` parameter (zero-based).
     * @param dimension Dimension of concatenation.
     * @param fname Function name (for error messages).
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along `dimension` parameter.
     */
    public static readonly concatenate = (dimension: number, fname: string, ...ARRAY: MultiArray[]): MultiArray => {
        /* Get all ARRAY dimension and set 0 at dimension[dimension] */
        const catDims: number[] = [];
        const dims = ARRAY.map((array) => {
            const dim = array.dimension.slice();
            MultiArray.appendSingletonTail(dim, dimension + 1);
            catDims.push(dim[dimension]);
            dim[dimension] = 0;
            return dim;
        });
        /* Check if all ARRAY dimensions are equals except for dimension parameter. */
        if (!dims.every((dim) => MultiArray.arrayEquals(dim, dims[0]))) {
            throw new EvalError(`${fname}: dimension mismatch`);
        }
        const resultDim = dims[0].slice();
        resultDim[dimension] = catDims.reduce((p, c) => p + c, 0);
        const result = new MultiArray(resultDim);
        ARRAY.forEach((array, a) => {
            const shift = catDims.slice(0, a).reduce((p, c) => p + c, 0);
            for (let n = 0; n < MultiArray.linearLength(array); n++) {
                const arrayDim = array.dimension.slice();
                MultiArray.appendSingletonTail(arrayDim, dimension + 1);
                const subscript = MultiArray.linearIndexToSubscript(arrayDim, n);
                subscript[dimension] += shift;
                const [i, j] = MultiArray.subscriptToMultiArrayRowColumn(result.dimension, subscript);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(array.dimension[0], array.dimension[1], n);
                result.array[i][j] = array.array[p][q];
            }
        });
        MultiArray.setType(result);
        return result;
    };

    /**
     * Split the MultiArray in the last dimension.
     * @param M
     * @returns
     */
    private static readonly splitLastDimension = (M: MultiArray): MultiArray[] => {
        const result = [];
        const lastDim = M.dimension[M.dimension.length - 1];
        for (let i = 0; i < lastDim; i++) {
            const sliceLength = M.array.length / lastDim;
            const array = new MultiArray(M.dimension.slice(0, -1));
            array.array = M.array.slice(i * sliceLength, (i + 1) * sliceLength);
            result.push(array);
        }
        return result;
    };

    /**
     * Calls `splitLastDimension` and recursively calls `evaluate` for each
     * result, concatenating on the last dimension, until the array is 2-D,
     * then then concatenates the elements row by row horizontally, then
     * concatenates the rows vertically.
     * @param M MultiArray object.
     * @param interpreter Interpreter instance.
     * @param local Local context (function evaluation).
     * @param fname Function name (context).
     * @returns Evaluated MultiArray object.
     */
    private static readonly evaluateRecursive = (M: MultiArray, interpreter: Interpreter | null | undefined, scope?: Scope): MultiArray => {
        if (M.dimension.length > 2) {
            return MultiArray.concatenate(M.dimension.length - 1, 'evaluate', ...MultiArray.splitLastDimension(M).map((S) => MultiArray.evaluate(S, interpreter, scope)));
        } else {
            return MultiArray.concatenate(
                0,
                'evaluate',
                ...M.array.map((row) =>
                    MultiArray.concatenate(1, 'evaluate', ...row.map((element) => MultiArray.scalarToMultiArray(interpreter ? interpreter.Evaluator(element, scope) : element))),
                ),
            );
        }
    };

    /**
     * Wrapper to not pass the null array to `MultiArray.interpreterRecursive`.
     * @param M MultiArray object.
     * @param interpreter Interpreter instance.
     * @param local Local context (function evaluation).
     * @param fname Function name (context).
     * @returns Evaluated MultiArray object.
     */
    public static readonly evaluate = (M: MultiArray, interpreter?: Interpreter | null | undefined, scope?: Scope): MultiArray => {
        if (MultiArray.isEmpty(M)) {
            return M;
        } else {
            const result = MultiArray.evaluateRecursive(M, interpreter, scope);
            result.isCell = M.isCell;
            MultiArray.setType(result);
            return result;
        }
    };

    /**
     * # MATLAB/Octave Array Indexing - Complete Rules (Concise Specification)
     *
     * This document synthesizes the official rules of MATLAB/Octave array indexing,
     * based on MathWorks documentation and related references. It defines how arrays
     * are accessed, reshaped, and modified under all indexing modes.
     *
     * ## 1. Core Concepts
     *
     * - Arrays use **1-based indexing**.
     * - Storage and traversal follow **column-major order**.
     * - Indexing modes:
     *   - **Linear indexing** (single index)
     *   - **Subscript indexing** (multiple indices)
     *   - **Logical indexing**
     *
     * ## 2. Linear Indexing
     *
     * ```matlab
     * A(k)
     * ```
     *
     * - Treats `A` as a single column vector in column-major order.
     * - Accesses elements sequentially down columns.
     * - Result:
     *   - Same number of elements as index
     *   - Orientation follows index (row vs column)
     *
     * ### Special Case: `(:)`
     *
     * ```matlab
     * A(:)
     * ```
     *
     * - Returns all elements as a **column vector**
     * - Equivalent to full linearization
     *
     * ## 3. Subscript (Multidimensional) Indexing
     *
     * ```matlab
     * A(i,j,k,...)
     * ```
     *
     * - Each index corresponds to one dimension.
     * - Indices may be scalars, vectors, or `:`.
     * - Result size:
     *
     * ```text
     * size(A(i,j,k,...)) = [numel(i), numel(j), numel(k), ...]
     * ```

     *
     * - Colon `:` selects all elements in that dimension.
     *
     * ## 4. Index Vectors and Shape Rules
     *
     * - For `A(id)`:
     *   - Result has same number of elements as `id`
     *   - Orientation follows `A` if both are vectors
     *
     * - For `A(id1,id2)`:
     *   - Result is a matrix of size:
     *
     * ```text
     * [numel(id1), numel(id2)]
     * ```

     *
     * - General case:
     *
     * ```text
     * size = [numel(id1), numel(id2), ..., numel(idn)]
     * ```
     *
     * ## 5. Fewer Indices Than Dimensions (Dimension Folding)
     *
     * If fewer indices are provided than dimensions:
     *
     * ```matlab
     * A(i,j)   % A is N-D
     * ```
     *
     * - MATLAB **folds all remaining dimensions into the last index**.
     * - Equivalent to reshaping:
     *
     * ```matlab
     * reshape(A, dim1, dim2*dim3*...)
     * ```

     *
     * ### Consequences
     *
     * - `A(:, :)` flattens higher dimensions into columns
     * - `A(i,:)` traverses across all higher dimensions
     * - `A(:,j)` does **not** traverse higher dimensions
     *
     * ## 6. Colon Operator (`:`)
     *
     * - Selects full dimension:
     *
     * ```matlab
     * A(:,j)
     * A(i,:)
     * ```
     *
     * - Equivalent to `1:end` in that dimension
     *
     * - Also used to generate ranges:
     *
     * ```matlab
     * a:b
     * a:s:b
     * ```
     *
     * ## 7. Logical Indexing
     *
     * ```matlab
     * A(mask)
     * ```
     *
     * - `mask` is evaluated in **linear order**
     * - Must not exceed `numel(A)`
     * - Result:
     *   - Column vector of selected elements
     *
     * ## 8. The `end` Keyword
     *
     * - Refers to last index of a dimension:
     *
     * ```matlab
     * A(end)
     * A(1:end)
     * A(:,end)
     * ```
     *
     * - Evaluated independently per dimension
     *
     * ## 9. Indexed Assignment
     *
     * ```matlab
     * A(I) = B
     * ```
     *
     * ### Rules
     *
     * - If `B` is scalar → scalar expansion
     * - Otherwise:
     *
     * ```text
     * numel(B) == numel(I)
     * ```
     *
     * - Indices may be repeated (last assignment wins)
     * - Colon selects full dimension
     *
     * ## 10. Deletion via Empty Array
     *
     * ```matlab
     * A(I) = []
     * ```
     *
     * ### Rules
     *
     * - Removes elements along **one dimension only**
     * - Valid when indexing selects:
     *   - Entire rows
     *   - Entire columns
     *   - Entire slices of a single dimension
     *
     * - Invalid if assignment would produce irregular shape
     *
     * ## 11. Array Expansion
     *
     * ```matlab
     * A(10) = 5
     * ```
     *
     * - Array automatically grows
     * - Missing elements filled with default values (e.g., `0`)
     *
     * ## 12. Linear vs Subscript Distinction
     *
     * ```matlab
     * A(2)    % linear
     * A(2,:)  % subscript
     * ```
     *
     * - These operations are **fundamentally different**
     * - Linear indexing ignores dimensions
     * - Subscript indexing respects dimensional structure
     *
     * ## 13. Evaluation Order
     *
     * 1. Index expressions evaluated
     * 2. Converted to subscripts or linear indices
     * 3. Bounds checked
     * 4. Elements accessed or assigned
     *
     * ## 14. Key Behavioral Summary
     *
     * - Column-major order governs all indexing
     * - `(:)` always returns a column vector
     * - Logical indexing returns column vectors
     * - Subscript indexing defines output shape explicitly
     * - Fewer indices ⇒ dimension folding
     * - Assignment enforces size compatibility or scalar expansion
     * - Deletion is restricted to one dimension
     *
     * ## 15. MathJSLab Engine Implementation Notes
     *
     * This section documents how the MathJSLab engine concretely implements
     * the indexing semantics described above. While fully aligned with MATLAB
     * behavior, the engine introduces a **unified linear-index pipeline**
     * to simplify execution and ensure consistency across all operations.
     *
     * ### 15.1 Unified Index Resolution
     *
     * All indexing modes (linear, subscript, logical) are internally reduced to:
     *
     * ```text
     * → a list of 0-based linear indices
     * ```
     *
     * This is performed by:
     *
     * ```ts
     * resolveLinearIndices(...)
     * ```
     *
     * Responsibilities:
     * - Detect logical vs numeric indexing
     * - Normalize scalar logicals (`true` → `[1]`, `false` → `[]`)
     * - Delegate numeric interpretation to:
     *   - `computeIndexingStructure`
     *   - `iterateWithLinearIndex`
     *
     * This guarantees a **single source of truth** for index resolution.
     *
     *
     * ### 15.2 Index Normalization Pipeline
     *
     * The engine separates indexing into three distinct phases:
     *
     * 1. **Structure normalization**
     *    ```ts
     *    computeIndexingStructure(...)
     *    ```
     *    - Expands missing dimensions with `:`
     *    - Linearizes all index arguments
     *    - Computes total iteration size
     *
     * 2. **Index evaluation**
     *    ```ts
     *    iterateWithLinearIndex(...)
     *    ```
     *    - Resolves `end`
     *    - Converts subscripts → linear indices
     *    - Performs bounds validation via `parseSubscript`
     *
     * 3. **Collection**
     *    ```ts
     *    collectLinearIndices(...)
     *    ```
     *    - Produces final linear index list
     *
     *
     * ### 15.3 Selection Pipeline
     *
     * Element access follows:
     *
     * ```text
     * indices → applyLinearSelection → shape reconstruction
     * ```
     *
     * - `applyLinearSelection(...)`
     *   - Retrieves elements using `getElementByLinearIndex`
     *
     * - Shape reconstruction:
     *   - Logical indexing → column vector (or mask-shaped vector)
     *   - Linear indexing:
     *     - `(:)` → column vector
     *     - otherwise → row vector
     *   - Subscript indexing:
     *     - Uses `computeIndexingStructure`
     *     - Uses `resolveIndexPlan`
     *     - Final adjustment via `collapseResult`
     *
     *
     * ### 15.4 Assignment Pipeline
     *
     * Assignment is centralized via:
     *
     * ```ts
     * applyLinearAssignment(...)
     * ```
     *
     * Features:
     * - Scalar expansion
     * - Strict size validation
     * - Field-aware assignment (structures supported)
     * - Deterministic overwrite (last index wins)
     *
     * High-level flow:
     *
     * ```text
     * resolve indices → expand target → assign values
     * ```
     *
     * Expansion rules:
     * - Linear growth allowed only for vectors
     * - Multidimensional growth uses `expand(...)`
     *
     *
     * ### 15.5 Deletion Semantics
     *
     * Deletion is handled in two layers:
     *
     * - High-level:
     *   ```ts
     *   deleteElements(...)
     *   ```
     *   - Enforces MATLAB rule:
     *     → exactly one non-colon dimension
     *
     * - Low-level:
     *   ```ts
     *   applyDeletionFromIndices(...)
     *   ```
     *   - Removes elements using linear filtering
     *   - Preserves vector orientation when applicable
     *
     *
     * ### 15.6 Logical Indexing Implementation
     *
     * Logical indexing is treated as a specialization of linear indexing:
     *
     * ```text
     * mask → logicalToLinearIndices → linear pipeline
     * ```
     *
     * Rules:
     * - Mask is always linearized
     * - `true` selects index
     * - `false` skips index
     * - Scalar logical:
     *   - `true` → first element
     *   - `false` → empty result
     *
     * Output shape:
     * - Always column vector unless mask is a vector (row preserved)
     *
     *
     * ### 15.7 Shape Resolution Strategy
     *
     * Shape is **not derived from indices directly**, but from a plan:
     *
     * ```ts
     * resolveIndexPlan(...)
     * ```
     *
     * This determines:
     * - Linear vs multidimensional behavior
     * - Full slice detection (`:`)
     * - Scalar vs vector indexing
     * - Active dimensions
     * - Whether collapse is required
     *
     * Final shape adjustments:
     * - `collapseResult(...)`
     *   - Handles dimension folding
     *   - Preserves MATLAB-compatible edge cases:
     *     - `A(:,j)`
     *     - `A(i,:)`
     *     - N-D flattening
     *
     *
     * ### 15.8 Design Principles
     *
     * The implementation follows strict architectural rules:
     *
     * - **Single responsibility**
     *   - Index resolution, selection, assignment, and shape are separated
     *
     * - **Linear-first execution model**
     *   - All operations operate on linear indices internally
     *
     * - **MATLAB compatibility as constraint**
     *   - Edge cases explicitly preserved
     *
     * - **Deterministic behavior**
     *   - No ambiguity in index interpretation
     *
     * - **Extensibility**
     *   - Logical, numeric, and future index types share the same pipeline
     *
     *
     * ### 15.9 Summary
     *
     * The MathJSLab engine implements MATLAB indexing through:
     *
     * ```text
     * Normalize → Resolve → Linearize → Apply → Reshape
     * ```
     *
     * This unified model ensures:
     * - Correctness
     * - Maintainability
     * - Full compatibility with MATLAB semantics
     *
     * while keeping the internal execution model simple and robust.
     *
     * ## Sources
     *
     * - [MathWorks - Matrix Indexing in MATLAB](https://www.mathworks.com/company/technical-articles/matrix-indexing-in-matlab.html)
     * - [MathWorks - Array Indexing](https://www.mathworks.com/help/matlab/math/array-indexing.html)
     * - [MathWorks - Detailed Rules About Array Indexing](https://www.mathworks.com/help/matlab/learn_matlab/array-indexing.html)
     * - [MathWorks - Indexed Assignment](https://www.mathworks.com/help/matlab/math/detailed-rules-about-array-indexing.html)
     * - [MathWorks - Learn MATLAB: Array Indexing](https://www.mathworks.com/help/matlab/math/indexed-assignment.html)
     * - [TutorialsPoint - MATLAB Array Indexing](https://www.tutorialspoint.com/matlab/matlab_array_indexing.htm)
     */

    private static colon(n: number): MultiArray {
        const arr = new MultiArray([1, n], Complex.zero());
        for (let i = 0; i < n; i++) {
            arr.array[0][i] = Complex.create(i + 1);
        }
        return arr;
    }

    /**
     * Normalize an indexing expression into a canonical structure used by
     * MultiArray get/set/delete operations.
     *
     * This function is the entry point for interpreting MATLAB-like indexing.
     * It converts the raw `indexList` (which may contain scalars, vectors,
     * or MultiArray objects) into a uniform representation that can be used
     * by iteration and linear index resolution.
     *
     * Behavior:
     * - Detects linear indexing when a single index argument is provided.
     * - Expands missing dimensions with implicit colon (:) to match the
     *   number of dimensions of the target array.
     * - Linearizes all index arguments into flat arrays.
     * - Computes the total number of indexed elements (cartesian product).
     *
     * Notes:
     * - This function does NOT validate bounds or apply indexing; it only
     *   prepares structural information.
     * - Logical indexing is NOT handled here and must be intercepted before
     *   calling this function.
     *
     * @param dimension Shape of the target MultiArray (e.g. [m, n, ...]).
     * @param indexList Raw index arguments as provided by the interpreter.
     *
     * @returns An object describing the normalized indexing plan:
     * - isLinear: true if indexing uses a single argument (linear indexing)
     * - originalIndexCount: number of indices provided by the user
     * - args: array of linearized index arrays (one per dimension)
     * - argsLength: length of each index array
     * - total: total number of indexed elements (product of argsLength)
     *
     * @throws RangeError if indexList is empty
     */
    private static readonly computeIndexingStructure = (
        dimension: number[],
        indexList: (ComplexType | MultiArray)[],
    ): {
        isLinear: boolean;
        originalIndexCount: number;
        args: ElementType[][];
        argsLength: number[];
        total: number;
    } => {
        if (indexList.length === 0) {
            throw new RangeError('invalid empty index list.');
        }
        const nd = dimension.length;
        const originalIndexCount = indexList.length;
        /* Linear case */
        if (indexList.length === 1) {
            const arg = MultiArray.linearize(indexList[0]);
            return {
                isLinear: true,
                originalIndexCount,
                args: [arg],
                argsLength: [arg.length],
                total: arg.length,
            };
        }
        /* Fill dimensions with ":"" */
        const indexListFull = indexList.slice();
        while (indexListFull.length < nd) {
            indexListFull.push(MultiArray.colon(dimension[indexListFull.length]));
        }
        /* Linearize */
        const args = indexListFull.map((index) => MultiArray.linearize(index));
        const argsLength = args.map((arg) => arg.length);
        const total = argsLength.reduce((p, c) => p * c, 1);
        return {
            isLinear: false,
            originalIndexCount,
            args,
            argsLength,
            total,
        };
    };

    /**
     * Iterate over a normalized indexing structure and resolve each position
     * into a linear index of the target MultiArray.
     *
     * This function bridges the gap between:
     * - The cartesian product of index arguments (produced by computeIndexingStructure)
     * - The actual linear indices used to access elements in memory
     *
     * Behavior:
     * - Iterates over all combinations of indices (cartesian product)
     * - Converts each iteration step `n` into a multi-dimensional subscript
     *   relative to the index arguments (not the target array)
     * - Maps those subscripts into actual index values (subscriptArgs)
     * - Resolves each subscriptArgs into a linear index using MATLAB rules
     *   (including support for `end` via parseSubscript)
     * - Invokes the callback with:
     *   - subscriptArgs: the resolved indices per dimension (1-based)
     *   - linearIndex: the corresponding linear index in the target array (0-based)
     *   - n: the iteration counter (0-based)
     *
     * Notes:
     * - This function assumes `idx` was produced by computeIndexingStructure.
     * - Bounds checking and `end` resolution are delegated to parseSubscript.
     * - The iteration order follows column-major semantics (MATLAB-compatible).
     * - This function does NOT perform any read/write; it only drives iteration.
     *
     * @param idx Normalized indexing structure (args, argsLength, total).
     * @param dimension Shape of the target MultiArray.
     * @param callback Function invoked for each indexed element.
     * @param input Optional input string (used for error reporting).
     * @param interpreter Optional interpreter (used for resolving expressions like `end`).
     */
    private static readonly iterateWithLinearIndex = (
        idx: {
            args: ElementType[][];
            argsLength: number[];
            total: number;
        },
        dimension: number[],
        callback: (subscriptArgs: ComplexType[], linearIndex: number, n: number) => void,
        input?: string,
        interpreter?: Interpreter,
    ): void => {
        for (let n = 0; n < idx.total; n++) {
            const subscript = MultiArray.linearIndexToSubscript(idx.argsLength, n);
            const subscriptArgs: ComplexType[] = subscript.map((s, r) => idx.args[r][s - 1] as ComplexType);
            const linearIndex = MultiArray.parseSubscript(dimension, subscriptArgs, input, interpreter);
            callback(subscriptArgs, linearIndex, n);
        }
    };

    /**
     * Resolve the structural "indexing plan" for a given indexing operation.
     *
     * This function analyzes the normalized indexing structure and extracts
     * semantic information about how the result should be shaped and interpreted.
     *
     * It does NOT perform indexing itself. Instead, it provides metadata used by:
     * - getElements → to shape the output (row/column/folding)
     * - collapseResult → to decide dimensional reduction
     *
     * The plan captures both:
     * 1. Legacy compatibility flags (MATLAB-like behavior)
     * 2. Structural semantics per dimension (more expressive and future-proof)
     *
     * ------------------------------------------------------------
     * CONCEPTUAL MODEL
     * ------------------------------------------------------------
     *
     * Each dimension is classified as:
     * - full slice   → ":" (entire dimension selected)
     * - scalar index → single position (dimension collapses)
     * - partial      → subset of elements
     *
     * From this, we derive:
     * - activeDimensions → dimensions that are actually being restricted
     * - isFullSlice      → per-dimension ":" detection
     * - isScalarIndex    → per-dimension scalar selection
     *
     * ------------------------------------------------------------
     * SPECIAL CASE: LINEAR INDEXING
     * ------------------------------------------------------------
     *
     * When idx.isLinear === true:
     * - The operation ignores multi-dimensional structure
     * - The array is treated as a column-major linear vector
     * - activeDimensions is reduced to a single conceptual dimension
     *
     * ------------------------------------------------------------
     * COMPATIBILITY FLAGS (LEGACY BEHAVIOR)
     * ------------------------------------------------------------
     *
     * These flags preserve MATLAB-like shaping behavior:
     *
     * - isColonOnly:
     *   True when linear indexing selects the entire array (A(:))
     *
     * - isRowSelection:
     *   Detects A(1,:) pattern → result should be a row vector
     *
     * - isColumnSelection:
     *   Detects A(:,1) pattern → result should be a column vector
     *
     * - requiresCollapse:
     *   True when fewer indices than dimensions were provided.
     *   This triggers dimensional folding (e.g., A(2,:) on 3D arrays)
     *
     * ------------------------------------------------------------
     * NOTES
     * ------------------------------------------------------------
     *
     * - Dimension padding with ":" is applied implicitly before classification.
     * - This function is purely analytical (no data access or mutation).
     * - The returned plan is consumed downstream by shape resolution logic.
     *
     * @param dimension Shape of the target MultiArray.
     * @param idx Normalized indexing structure from computeIndexingStructure.
     *
     * @returns Indexing plan describing structural semantics of the operation.
     */
    private static readonly resolveIndexPlan = (
        dimension: number[],
        idx: {
            isLinear: boolean;
            originalIndexCount: number;
            args: ElementType[][];
            argsLength: number[];
            total: number;
        },
    ): {
        isLinear: boolean;
        isColonOnly: boolean;
        isRowSelection: boolean;
        isColumnSelection: boolean;
        requiresCollapse: boolean;
        /* real structural semantics */
        activeDimensions: number[];
        isFullSlice: boolean[];
        isScalarIndex: boolean[];
    } => {
        const nd = dimension.length;
        /* Linear case */
        if (idx.isLinear) {
            const totalLength = dimension.reduce((p, c) => p * c, 1);
            return {
                isLinear: true,
                isColonOnly: idx.argsLength[0] === totalLength,
                isRowSelection: false,
                isColumnSelection: false,
                requiresCollapse: false,
                activeDimensions: [0],
                isFullSlice: [idx.argsLength[0] === totalLength],
                isScalarIndex: [idx.argsLength[0] === 1],
            };
        }
        /* Normalize dimensions (implicit padding with :) */
        const fullArgsLength = idx.argsLength.slice();
        while (fullArgsLength.length < nd) {
            fullArgsLength.push(dimension[fullArgsLength.length]);
        }
        /* Classification by dimension. */
        const isFullSlice: boolean[] = [];
        const isScalarIndex: boolean[] = [];
        const activeDimensions: number[] = [];
        for (let d = 0; d < nd; d++) {
            const len = fullArgsLength[d];
            const dim = dimension[d];
            const full = len === dim;
            const scalar = len === 1;
            isFullSlice.push(full);
            isScalarIndex.push(scalar);
            /* active dimension = not complete ":" */
            if (!full) {
                activeDimensions.push(d);
            }
        }
        /* Flags */
        const isRowSelection = idx.originalIndexCount === 2 && idx.argsLength[0] === 1;
        const isColumnSelection = idx.originalIndexCount === 2 && idx.argsLength[1] === 1;
        const requiresCollapse = idx.originalIndexCount < nd;
        /* Result */
        return {
            isLinear: false,
            isColonOnly: false,
            isRowSelection,
            isColumnSelection,
            requiresCollapse,
            activeDimensions,
            isFullSlice,
            isScalarIndex,
        };
    };

    /**
     * Retrieve an element from a MultiArray using a 0-based linear index.
     *
     * This method provides a unified access path for both plain values and
     * structured field access. It converts the linear index into (row, column)
     * coordinates assuming column-major order (MATLAB semantics), then retrieves
     * the corresponding element.
     *
     * If a non-empty `field` path is provided, the access is delegated to
     * Structure.getField, allowing nested field resolution (e.g., A(i).field.subfield).
     *
     * @param M Source MultiArray.
     * @param linearIndex Zero-based linear index (column-major order).
     * @param field Structure field access path. If empty, returns the raw element.
     * @returns The selected element or nested field value.
     *
     * @throws RangeError If the linear index is out of bounds (indirectly via index conversion).
     *
     * @remarks
     * - Assumes that `linearIndex` has already been validated.
     * - This function is intentionally minimal and side-effect free.
     * - Used as the core primitive by higher-level selection helpers such as
     *   `applyLinearSelection` and indexing pipelines.
     */
    private static readonly getElementByLinearIndex = (M: MultiArray, linearIndex: number, field: string[]): ElementType => {
        const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearIndex);
        return field.length > 0 ? Structure.getField(M.array[i][j], field) : M.array[i][j];
    };

    /**
     * Set element in a MultiArray using a linear index (column-major order).
     *
     * This function is the write counterpart of `getElementByLinearIndex` and
     * centralizes all element assignment at the lowest level of the indexing pipeline.
     *
     * The linear index is assumed to be **0-based** and mapped to (row, column)
     * coordinates according to MATLAB/Octave column-major semantics.
     *
     * If a field path is provided, the assignment is performed on a nested
     * structure field instead of directly replacing the element.
     *
     * @param M Target MultiArray.
     * @param linearIndex Zero-based linear index in column-major order.
     * @param value Value to assign at the specified position.
     * @param field Optional structure field access path.
     *
     * @throws RangeError If the linear index is out of bounds (indirectly via index conversion).
     * @throws Error If field access is invalid for the target element.
     */
    private static readonly setElementByLinearIndex = (M: MultiArray, linearIndex: number, value: ElementType, field: string[]): void => {
        const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearIndex);
        if (field.length > 0) {
            Structure.setField(M.array[i][j] as Structure, field, value);
        } else {
            M.array[i][j] = value;
        }
    };

    /**
     * Collapse an intermediate indexing result to its final shape according to MATLAB rules.
     *
     * After element selection, the intermediate result (`resultFull`) is typically constructed
     * as a full N-dimensional array. This function applies MATLAB's post-processing rules
     * to determine the final output shape, including dimension collapsing and vector orientation.
     *
     * Behavior:
     *
     * 1) No collapse required:
     *    - If the number of index arguments matches the array dimensionality,
     *      the result is returned as-is.
     *
     * 2) Special 2D cases (highest priority, MATLAB-compatible):
     *    - Column selection: A(:, j)
     *        → returns a column vector (n×1)
     *
     *    - Row selection: A(i, :)
     *        → returns a row vector (1×n)
     *        → also applies to higher dimensions with implicit folding
     *
     * 3) General MATLAB folding rule:
     *    - When indexing reduces dimensionality (partial indexing),
     *      higher dimensions are folded into columns.
     *    - Result becomes a 2D matrix:
     *        rows = size along first dimension
     *        cols = total elements / rows
     *
     *    - Elements are filled in column-major order (MATLAB layout).
     *
     * 4) Default:
     *    - If none of the above applies, the intermediate result is returned unchanged.
     *
     * Notes:
     * - This function enforces MATLAB-compatible shape semantics after indexing.
     * - It does not modify element values, only their arrangement.
     * - The `plan` parameter encodes structural properties of the indexing operation,
     *   but only a subset is currently used for collapse decisions.
     *
     * @param resultFull Intermediate full result (before collapse).
     * @param originalDimension Original dimensions of the source array.
     * @param idx Indexing structure (argument counts and shapes).
     * @param plan Precomputed indexing plan describing selection semantics.
     *
     * @returns Final MultiArray with correct MATLAB-compatible shape.
     */
    private static readonly collapseResult = (
        resultFull: MultiArray,
        originalDimension: number[],
        idx: {
            originalIndexCount: number;
            argsLength: number[];
        },
        plan: {
            isLinear: boolean;
            isColonOnly: boolean;
            isRowSelection: boolean;
            isColumnSelection: boolean;
            requiresCollapse: boolean;

            activeDimensions: number[];
            isFullSlice: boolean[];
            isScalarIndex: boolean[];
        },
    ): MultiArray => {
        /* No collapse */
        if (!plan.requiresCollapse) {
            return resultFull;
        }
        const linear = MultiArray.linearize(resultFull);
        /* Classic cases */
        /* A(:,3) → column vector */
        if (idx.originalIndexCount === 2 && idx.argsLength[1] === 1) {
            const rows = idx.argsLength[0];
            const result = new MultiArray([rows, 1]);
            for (let i = 0; i < rows; i++) {
                result.array[i][0] = resultFull.array[i][0];
            }
            MultiArray.setType(result);
            return result;
        }
        /* A(2,:) → row vector (includes 3D folding) */
        if (idx.originalIndexCount === 2 && idx.argsLength[0] === 1) {
            const result = MultiArray.toRowVector(linear);
            MultiArray.setType(result);
            return result;
        }
        /* General MATLAB case → Folding to 2D */
        if (resultFull.dimension.length > 2) {
            const rows = resultFull.dimension[0];
            const cols = linear.length / rows;
            const result = new MultiArray([rows, cols]);
            let k = 0;
            for (let j = 0; j < cols; j++) {
                for (let i = 0; i < rows; i++) {
                    result.array[i][j] = linear[k++];
                }
            }
            MultiArray.setType(result);
            return result;
        }
        return resultFull;
    };

    /**
     * Convert a logical mask into a list of linear indices (0-based).
     *
     * MATLAB semantics:
     * - Logical indexing is interpreted in linear (column-major) order.
     * - The mask is first linearized, then applied element-wise to the
     *   linearized target array.
     * - Each `true` value selects the corresponding linear position.
     * - `false` values are ignored.
     *
     * Validation rules:
     * - The mask length must not exceed the number of elements in `M`.
     * - If the mask is shorter than `M`, it is applied only to the
     *   corresponding leading elements (MATLAB-compatible behavior).
     *
     * Notes:
     * - Returned indices are 0-based (internal engine convention).
     * - The returned list may be empty (e.g., when mask is all false).
     * - This function does NOT handle scalar logicals; those must be
     *   normalized beforehand by the caller (e.g., via `scalarToMultiArray`).
     *
     * @param M Target MultiArray being indexed.
     * @param items Logical mask as a MultiArray.
     * @param id Optional identifier (used for error messages).
     * @returns Array of selected linear indices (0-based).
     *
     * @throws EvalError If the mask length exceeds the number of elements in `M`.
     */
    private static readonly logicalToLinearIndices = (M: MultiArray, items: MultiArray, id?: string): number[] => {
        const linearM = MultiArray.linearize(M);
        const mask = MultiArray.linearize(items) as ComplexType[];
        if (mask.length > linearM.length) {
            throw new EvalError(`${id ?? ''}(${mask.length}): out of bound ${linearM.length} (dimensions are ${M.dimension.join('x')})`);
        }
        const result: number[] = [];
        for (let i = 0; i < mask.length; i++) {
            if (Complex.realToNumber(mask[i])) {
                result.push(i); // 0-based linear index.
            }
        }
        return result;
    };

    /**
     * Normalize logical indexing input into a list of linear indices (0-based).
     *
     * This is a thin wrapper around {@link logicalToLinearIndices}, introduced to:
     * - Provide a stable abstraction point for logical index resolution
     * - Allow future extensions (e.g., scalar logical handling, special cases)
     * - Keep dispatcher and high-level indexing code decoupled from low-level logic
     *
     * The logical mask is interpreted in linear (column-major) order, following
     * MATLAB semantics:
     * - True values select corresponding linear positions
     * - False values are ignored
     * - Mask length must not exceed the number of elements in `M`
     *
     * @param M Target MultiArray being indexed.
     * @param items Logical mask as a MultiArray.
     * @param id Identifier (used for error reporting).
     * @returns Array of selected linear indices (0-based).
     */
    private static logicalMaskToIndexList = (M: MultiArray, items: MultiArray, id: string): number[] => {
        return MultiArray.logicalToLinearIndices(M, items, id);
    };

    /**
     * Determine whether an argument represents logical indexing.
     *
     * This function identifies both supported forms of logical indices:
     *
     * 1) Logical MultiArray
     *    - e.g., A([true false true])
     *
     * 2) Logical scalar (Complex)
     *    - e.g., A(true), A(false)
     *
     * This distinction is important because scalar logicals behave differently
     * from numeric scalars:
     * - A(true)  → selects the first element (linear index 1 in MATLAB)
     * - A(false) → selects no elements (returns empty array)
     *
     * Notes:
     * - This function is used by indexing dispatchers to route execution
     *   into the logical indexing pipeline.
     * - It does not validate shape or size compatibility; it only detects type.
     * - Scalar logicals must be normalized (e.g., via scalarToMultiArray)
     *   before further processing.
     *
     * @param arg Index argument (scalar or MultiArray).
     * @returns True if the argument should be treated as logical indexing.
     */
    private static isLogicalIndex(arg: any): boolean {
        return (MultiArray.isInstanceOf(arg) && arg.type === Complex.LOGICAL) || (Complex.isInstanceOf(arg) && arg.type === Complex.LOGICAL);
    }

    /**
     * Apply linear selection on a MultiArray and return the extracted elements.
     *
     * This function performs the core data extraction step of the indexing pipeline:
     * given a list of linear indices (0-based), it retrieves the corresponding
     * elements from the source array in order.
     *
     * Selection follows MATLAB semantics:
     * - Indices refer to positions in column-major (linearized) order
     * - The output preserves the order of `indices`
     * - No reshaping is performed here (result is always a flat array)
     *
     * If a field path is provided, each selected element is resolved through
     * structure field access instead of returning the raw element.
     *
     * @param M Source MultiArray.
     * @param indices Linear indices (0-based, column-major order).
     * @param field Optional structure field access path.
     * @returns Flat array of selected elements, in the same order as `indices`.
     *
     * @remarks
     * - This function is side-effect free.
     * - It assumes indices have already been validated.
     * - Shape/orientation (row/column/matrix) is handled later in the pipeline
     *   (e.g., in getElements and collapseResult).
     * - Acts as the core primitive for both numeric and logical indexing.
     */
    private static applyLinearSelection = (M: MultiArray, indices: number[], field: string[]): ElementType[] => {
        const result: ElementType[] = [];
        for (const lin of indices) {
            result.push(MultiArray.getElementByLinearIndex(M, lin, field));
        }
        return result;
    };

    /**
     * Apply linear assignment on a MultiArray using a list of linear indices.
     *
     * This function performs the core write operation of the indexing pipeline.
     * Given a set of linear indices (0-based), it assigns values to the corresponding
     * positions in the target array, following MATLAB assignment semantics.
     *
     * Behavior:
     *
     * 1) Scalar expansion (broadcast):
     *    - If `values` contains a single element, it is assigned to all indices.
     *
     * 2) Element-wise assignment:
     *    - If `values.length > 1`, its length must match `indices.length`.
     *    - Each value is assigned to the corresponding index in order.
     *
     * 3) Structure field assignment:
     *    - If a non-empty `field` path is provided, assignment is delegated to
     *      nested structure fields instead of replacing the element itself.
     *
     * Validation:
     * - Throws if the number of values does not match the number of indices
     *   (unless scalar expansion applies).
     *
     * @param M Target MultiArray.
     * @param indices Linear indices (0-based, column-major order).
     * @param values Linearized right-hand side values.
     * @param field Optional structure field access path.
     *
     * @throws EvalError If dimensions are nonconformant.
     *
     * @remarks
     * - This function does not handle deletion (A(I) = []); that is handled upstream.
     * - Assumes indices are already validated and within bounds.
     * - Does not perform resizing or expansion of `M`; that is also handled upstream.
     * - Acts as the unified assignment primitive for both numeric and logical indexing.
     */
    private static applyLinearAssignment = (M: MultiArray, indices: number[], values: ElementType[], field: string[]): void => {
        const isScalar = values.length === 1;
        if (!isScalar && values.length !== indices.length) {
            throw new EvalError(`=: nonconformant arguments (op1 is ${indices.length}x1, op2 is ${values.length}x1)`);
        }
        for (let n = 0; n < indices.length; n++) {
            const value = isScalar ? values[0] : values[n];
            MultiArray.setElementByLinearIndex(M, indices[n], value, field);
        }
    };

    /**
     * Resolve an index list (logical or numeric) into linear indices (0-based).
     *
     * This function is the core of the indexing engine. It normalizes all supported
     * indexing modes into a unified representation: a list of linear indices in
     * column-major order.
     *
     * It does NOT perform element access or assignment — only index resolution.
     *
     * Supported indexing modes:
     *
     * 1) Logical indexing:
     *    - Triggered when a single logical argument is provided.
     *    - Accepts both logical MultiArray and logical scalar.
     *    - Scalar logicals are normalized:
     *        true  → selects first element
     *        false → selects no elements
     *    - The mask is applied in linear (column-major) order.
     *
     * 2) Numeric indexing:
     *    - Supports linear indexing (single argument)
     *    - Supports multi-dimensional indexing (A(i,j,...))
     *    - Supports colon (:) and range expressions
     *    - Supports `end` keyword via interpreter
     *
     * Processing steps (numeric case):
     *    a) Normalize index structure via `computeIndexingStructure`
     *    b) Iterate over all index combinations
     *    c) Convert each subscript tuple into a linear index using `parseSubscript`
     *
     * Output:
     * - A flat array of 0-based linear indices
     * - Order matches MATLAB evaluation order (column-major traversal)
     *
     * @param M Target MultiArray being indexed.
     * @param id Identifier (used for error reporting and `end` resolution).
     * @param indexList Raw index arguments (scalars, arrays, or logical masks).
     * @param interpreter Optional interpreter used to resolve dynamic expressions (e.g., `end`).
     *
     * @returns Array of linear indices (0-based).
     *
     * @throws EvalError or RangeError for invalid indices or out-of-bounds access.
     *
     * @remarks
     * - This function unifies logical and numeric indexing into a single pipeline.
     * - It is side-effect free.
     * - It guarantees that downstream operations (selection or assignment)
     *   operate only on validated linear indices.
     *
     * - The returned indices may:
     *     * be empty (e.g., a(false))
     *     * contain duplicates (allowed in MATLAB)
     *     * be unordered (depending on index expressions)
     *
     * - Shape/orientation semantics are handled separately (e.g., in getElements
     *   and collapseResult).
     */
    private static resolveLinearIndices = (M: MultiArray, id: string, indexList: (ComplexType | MultiArray)[], interpreter?: Interpreter): number[] => {
        /* Logical indexing */
        if (indexList.length === 1 && MultiArray.isLogicalIndex(indexList[0])) {
            let mask: MultiArray;
            const arg0 = indexList[0];
            if (Complex.isInstanceOf(arg0)) {
                mask = MultiArray.scalarToMultiArray(arg0);
            } else {
                mask = arg0 as MultiArray;
            }
            return MultiArray.logicalToLinearIndices(M, mask, id);
        }
        /* Numerical indexing */
        const idx = MultiArray.computeIndexingStructure(M.dimension, indexList);
        const indices: number[] = [];
        MultiArray.iterateWithLinearIndex(
            idx,
            M.dimension,
            (_, linearIndex) => {
                indices.push(linearIndex);
            },
            id,
            interpreter,
        );
        return indices;
    };

    /**
     * Collect linear indices from a normalized indexing structure.
     *
     * This is a convenience wrapper around {@link iterateWithLinearIndex} that
     * gathers all computed linear indices into a flat array.
     *
     * It is used in numeric indexing to convert a precomputed indexing structure
     * (`idx`) into a list of linear indices (0-based), ready for selection or
     * assignment.
     *
     * Behavior:
     * - Iterates over all index combinations defined in `idx`
     * - Converts each subscript tuple into a linear index
     * - Preserves iteration order (column-major traversal)
     *
     * @param idx Normalized indexing structure (from computeIndexingStructure).
     * @param dimension Target array dimensions.
     * @param input Optional input string (used for error reporting).
     * @param interpreter Optional interpreter (used to resolve dynamic expressions such as `end`).
     *
     * @returns Array of linear indices (0-based).
     *
     * @remarks
     * - This function is side-effect free.
     * - It does not perform validation; assumes `idx` is already normalized.
     * - Equivalent to manually accumulating results from iterateWithLinearIndex.
     * - Used to simplify and centralize index collection logic.
     */
    private static collectLinearIndices = (idx: any, dimension: number[], input?: string, interpreter?: Interpreter): number[] => {
        const indices: number[] = [];
        MultiArray.iterateWithLinearIndex(
            idx,
            dimension,
            (_, linearIndex) => {
                indices.push(linearIndex);
            },
            input,
            interpreter,
        );
        return indices;
    };

    /**
     * Apply deletion on a MultiArray using a list of linear indices.
     *
     * This function performs linear deletion (A(I) = []) by removing the elements
     * at the specified linear indices and compacting the remaining data.
     *
     * Behavior:
     * - The array is first linearized (column-major order)
     * - Elements at positions in `indices` are removed
     * - The remaining elements are compacted into a new linear sequence
     *
     * Shape reconstruction:
     * - If the original array is a vector:
     *     - Row vector: result remains a row vector
     *     - Column vector: result remains a column vector
     *
     * - If the original array is not a vector:
     *     - The result is converted to a column vector
     *     - This matches MATLAB behavior for ambiguous linear deletions
     *
     * Notes:
     * - Indices are assumed to be 0-based and already validated
     * - Duplicate indices are ignored (set semantics)
     * - Order of remaining elements is preserved
     *
     * @param M Target MultiArray (modified in-place).
     * @param indices Linear indices to remove (0-based).
     *
     * @remarks
     * - This function implements the core of logical and linear deletion.
     * - It does not validate index correctness or dimensional constraints;
     *   such checks must be performed upstream.
     * - Multi-dimensional structural deletions (e.g., A(:,2) = []) are handled
     *   elsewhere (e.g., in deleteElements).
     */
    private static applyDeletionFromIndices = (M: MultiArray, indices: number[]): void => {
        const linear = MultiArray.linearize(M);
        const removeSet = new Set(indices);
        const resultLinear = linear.filter((_, i) => !removeSet.has(i));
        let result: MultiArray;
        if (MultiArray.arrayIsVector(M)) {
            result = MultiArray.isRowVector(M) ? MultiArray.toRowVector(resultLinear) : MultiArray.toColumnVector(resultLinear);
        } else {
            /* Safe fallback (MATLAB tends to collapse to column in ambiguous linear deletions) */
            result = MultiArray.toColumnVector(resultLinear);
        }
        M.array = result.array;
        M.dimension = result.dimension;
    };

    /**
     * Retrieve elements from a MultiArray using MATLAB-like indexing semantics.
     *
     * This is the main entry point for element access (RHS indexing). It supports
     * both logical and numeric indexing, including multi-dimensional access,
     * linear indexing, colon expressions, and `end`.
     *
     * The indexing pipeline is divided into three stages:
     *
     * 1) Index resolution:
     *    - All index expressions are normalized into linear indices (0-based)
     *    - Performed by {@link resolveLinearIndices}
     *
     * 2) Element selection:
     *    - Elements are extracted in column-major order
     *    - Performed by {@link applyLinearSelection}
     *
     * 3) Shape reconstruction:
     *    - Result is reshaped according to MATLAB rules
     *    - Includes special handling for logical indexing and partial indexing
     *
     * Supported indexing modes:
     *
     * - Logical indexing:
     *     A(mask)
     *     • mask may be a logical array or scalar
     *     • scalar true  → selects first element
     *     • scalar false → returns empty array
     *     • result shape follows mask orientation:
     *         - vector mask → preserves row/column orientation
     *         - matrix mask → result is a column vector
     *
     * - Linear indexing:
     *     A(I)
     *     • returns row vector unless I is ":" (full selection)
     *     • A(:) → column vector
     *
     * - Multi-dimensional indexing:
     *     A(i,j,...)
     *     • supports colon (:), ranges, and `end`
     *     • result shape determined by MATLAB collapsing rules
     *
     * @param M Source MultiArray.
     * @param id Identifier (used for error reporting and `end` resolution).
     * @param field Optional structure field access path.
     * @param indexList Index arguments (numeric or logical).
     * @param interpreter Optional interpreter (used for dynamic expressions such as `end`).
     *
     * @returns Resulting element(s), as a MultiArray or scalar.
     *
     * @throws EvalError or RangeError for invalid indexing operations.
     *
     * @remarks
     * - This function is side-effect free.
     * - Logical indexing is handled as a special case due to its distinct
     *   shape semantics.
     * - Numeric indexing follows a unified pipeline using index structures
     *   and index plans.
     *
     * - Internally, all indexing is reduced to linear index operations,
     *   ensuring a consistent and extensible implementation.
     */
    public static readonly getElements = (M: MultiArray, id: string, field: string[], indexList: (ComplexType | MultiArray)[], interpreter?: Interpreter): ElementType => {
        if (indexList.length === 0) {
            return M;
        }
        /* Solve indexes (unified) */
        const indices = MultiArray.resolveLinearIndices(M, id, indexList, interpreter);
        const selected = MultiArray.applyLinearSelection(M, indices, field);
        /* Logical case → special shape */
        if (indexList.length === 1 && MultiArray.isLogicalIndex(indexList[0])) {
            let mask: MultiArray;
            const arg0 = indexList[0];
            if (Complex.isInstanceOf(arg0)) {
                mask = MultiArray.scalarToMultiArray(arg0);
            } else {
                mask = arg0 as MultiArray;
            }
            let result: MultiArray;
            if (MultiArray.arrayIsVector(mask)) {
                result = MultiArray.isRowVector(mask) ? MultiArray.toRowVector(selected) : MultiArray.toColumnVector(selected);
            } else {
                result = MultiArray.toColumnVector(selected);
            }
            MultiArray.setType(result);
            return result;
        }
        /* Numerical case → original shape pipeline */
        const idx = MultiArray.computeIndexingStructure(M.dimension, indexList);
        const plan = MultiArray.resolveIndexPlan(M.dimension, idx);
        /* Linear */
        if (idx.isLinear) {
            const result = plan.isColonOnly ? MultiArray.toColumnVector(selected) : MultiArray.toRowVector(selected);
            MultiArray.setType(result);
            return result;
        }
        /* N-D */
        const resultFull = new MultiArray(idx.argsLength);
        for (let n = 0; n < selected.length; n++) {
            const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(resultFull.dimension[0], resultFull.dimension[1], n);
            resultFull.array[p][q] = selected[n];
        }
        MultiArray.setType(resultFull);
        return MultiArray.collapseResult(resultFull, M.dimension, idx, plan);
    };

    /**
     * Assign values to elements of a MultiArray using numerical (non-logical) indexing.
     *
     * This method implements MATLAB-compatible assignment semantics, including:
     *
     * • Linear indexing:
     *   A(I) = V
     *
     * • Subscript indexing:
     *   A(i, j, k, ...) = V
     *
     * • Scalar expansion (broadcasting):
     *   A(I) = scalar → scalar is replicated to match target size
     *
     * • Shape conformity:
     *   numel(V) must be either 1 or equal to the number of indexed elements
     *
     * • Automatic array expansion:
     *   - Vectors grow when indexed beyond current bounds
     *   - N-D arrays expand per-dimension when valid
     *
     * • Deletion via empty assignment:
     *   A(I) = []
     *   - Only allowed when exactly one index is non-colon
     *   - Delegated to deleteElements()
     *
     * Internal pipeline:
     *
     * 1. Linearize RHS → `linearizedRight`
     * 2. Handle deletion case early
     * 3. Normalize indexing via computeIndexingStructure()
     * 4. Validate RHS conformity
     * 5. Resolve or create target array (including expansion)
     * 6. Collect linear indices via collectLinearIndices()
     *    → fully supports `end` and N-D indexing
     * 7. Apply assignment via applyLinearAssignment()
     *
     * Notes:
     *
     * • Index validation and bounds checking are delegated to:
     *   - testIndex()
     *   - parseSubscript()
     *
     * • This function does NOT handle logical indexing.
     *   Logical indexing is resolved upstream via resolveLinearIndices().
     *
     * • Deletion logic is intentionally separated to preserve MATLAB constraints.
     *
     *
     * @param scope Execution scope (symbol table)
     * @param id Target variable name
     * @param field Structure field access path (empty if none)
     * @param indexList Raw index expressions (already evaluated)
     * @param right Right-hand side MultiArray
     * @param input Optional original expression (for error reporting / `end`)
     * @param interpreter Interpreter instance (used for `end` resolution)
     *
     * @throws RangeError If indexing is invalid or nonconformant
     * @throws EvalError If assignment dimensions are incompatible
     */
    private static readonly setElementsNumerical = (
        scope: Scope,
        id: string,
        field: string[],
        indexList: (ComplexType | MultiArray)[],
        right: MultiArray,
        input?: string,
        interpreter?: Interpreter,
    ): void => {
        const linearizedRight = MultiArray.linearize(right);
        /* Deletion (A(I) = []) */
        if (linearizedRight.length === 0) {
            const entry = scope.resolveName(id);
            if (!entry) {
                throw new RangeError(`A(I) = []: index out of bounds: value ${MultiArray.firstElement(indexList[0])} out of bound 0`);
            }
            let nonColon = 0;
            for (let i = 0; i < indexList.length; i++) {
                const linearizedIndex = MultiArray.linearize(indexList[i]);
                if (Complex.realToNumber(linearizedIndex[0] as ComplexType) !== 1 || linearizedIndex.length !== entry.node.dimension[i]) {
                    nonColon++;
                }
            }
            if (nonColon !== 1) {
                throw new RangeError('a null assignment can only have one non-colon index');
            }
            MultiArray.deleteElements(entry.node, indexList, input, interpreter);
            return;
        }
        /* Basic validation */
        if (indexList.length === 0) {
            throw new RangeError('invalid empty index list.');
        }
        const entryOriginal = scope.resolveName(id);
        const idx = MultiArray.computeIndexingStructure(entryOriginal?.node?.dimension ?? [1], indexList);
        /* RHS compliance */
        const isScalar = linearizedRight.length === 1;
        if (!isScalar && linearizedRight.length !== idx.total) {
            throw new RangeError(`=: nonconformant arguments (op1 is ${idx.argsLength.join('x')}, op2 is ${right.dimension.join('x')})`);
        }
        /* Resolve target array (expansion) */
        let entry = entryOriginal;
        const argsMax = idx.args.map((arg) => Math.max(...arg.map((v) => MultiArray.testIndex(v as ComplexType))));
        if (entry) {
            if (entry.node instanceof MultiArray) {
                if (idx.isLinear) {
                    if (argsMax[0] > MultiArray.linearLength(entry.node)) {
                        if (MultiArray.arrayIsVector(entry.node)) {
                            if (entry.node.dimension[0] === 1) {
                                MultiArray.expand(entry.node, [1, argsMax[0]]);
                            } else {
                                MultiArray.expand(entry.node, [argsMax[0], 1]);
                            }
                        } else {
                            throw new RangeError('Invalid resizing operation or ambiguous assignment to an out-of-bounds array element.');
                        }
                    }
                } else {
                    MultiArray.expand(entry.node, argsMax);
                }
            } else {
                const value = entry.node;
                const blankValue: ElementType = value instanceof Structure ? Structure.cloneFields(value) : Complex.zero();
                if (idx.isLinear) {
                    entry = scope.defineName(id, new MultiArray([1, argsMax[0]], blankValue));
                } else {
                    entry = scope.defineName(id, new MultiArray(argsMax, blankValue));
                }
                entry.node.array[0][0] = value;
            }
        } else {
            const blankValue: ElementType = field.length > 0 ? new Structure(field) : Complex.zero();
            if (idx.isLinear) {
                entry = scope.defineName(id, new MultiArray([1, argsMax[0]], blankValue));
            } else {
                entry = scope.defineName(id, new MultiArray(argsMax, blankValue));
            }
        }
        const M: MultiArray = entry.node;
        if (field.length > 0) {
            Structure.setEmptyField(M, field[0]);
        }
        const dimension = M.dimension.slice();
        /* Collect linear indices (with `end` support) */
        const indices = MultiArray.collectLinearIndices(idx, dimension, input, interpreter);
        /* Centralized assignment */
        MultiArray.applyLinearAssignment(M, indices, linearizedRight, field);
    };

    /**
     * Unified assignment entry point for MultiArray.
     *
     * Dispatches between logical indexing and numerical indexing semantics,
     * implementing MATLAB-compatible behavior.
     *
     * Supported assignment modes:
     * - Logical indexing:     A(mask) = value
     * - Linear indexing:      A(I) = value
     * - Subscript indexing:   A(i,j,k,...) = value
     *
     * Logical indexing behavior:
     * - The mask is interpreted in linear (column-major) order
     * - Scalar logicals are promoted to a 1-element mask:
     *     - true  → selects first element
     *     - false → selects no elements
     * - Deletion is supported: A(mask) = []
     * - Shape of the mask does not need to match M exactly (linear semantics)
     *
     * Numerical indexing behavior:
     * - Delegated to setElementsNumerical
     * - Supports:
     *     - multi-dimensional indexing
     *     - `end` keyword (via interpreter)
     *     - scalar expansion (broadcasting)
     *     - automatic array expansion
     *     - deletion via []
     *
     * Deletion semantics:
     * - Logical deletion: handled here via linear filtering
     * - Numerical deletion: delegated to deleteElements (MATLAB constraints apply)
     *
     * Structure field assignment:
     * - If `field` is provided, assignment targets nested structure fields
     *
     * Error handling:
     * - Invalid variable or non-MultiArray target → EvalError
     * - Conformance and bounds errors are delegated to lower-level helpers
     *
     * @param scope     Execution scope (variable resolution)
     * @param id        Target variable name
     * @param field     Structure field access path (empty for direct assignment)
     * @param indexList Raw index expressions (logical or numeric)
     * @param right     Right-hand side value (MultiArray)
     * @param input     Optional source string (used for error reporting / `end`)
     * @param interpreter Optional interpreter for dynamic expressions (e.g., `end`)
     */
    public static readonly setElements = (
        scope: Scope,
        id: string,
        field: string[],
        indexList: (ComplexType | MultiArray)[],
        right: MultiArray,
        input?: string,
        interpreter?: Interpreter,
    ): void => {
        /* Logical indexing (single argument) */
        if (indexList.length === 1 && MultiArray.isLogicalIndex(indexList[0])) {
            let mask: MultiArray;
            const arg0 = indexList[0];
            /* logical scalar → turn into a MultiArray */
            if (Complex.isInstanceOf(arg0)) {
                mask = MultiArray.scalarToMultiArray(arg0);
            } else {
                mask = arg0 as MultiArray;
            }
            const entry = scope.resolveName(id);
            if (!entry || !(entry.node instanceof MultiArray)) {
                throw new EvalError(`${id}(_): invalid matrix indexing.`);
            }
            const M = entry.node;
            const indices = MultiArray.logicalMaskToIndexList(M, mask, id);
            const values = MultiArray.linearize(right);
            const isDelete = values.length === 0;
            /* Logical deletion */
            if (isDelete) {
                const linear = MultiArray.linearize(M);
                const removeSet = new Set(indices);
                const resultLinear = linear.filter((_, i) => !removeSet.has(i));
                let result: MultiArray;
                if (MultiArray.isRowVector(M)) {
                    result = MultiArray.toRowVector(resultLinear);
                } else {
                    result = MultiArray.toColumnVector(resultLinear);
                }
                M.array = result.array;
                M.dimension = result.dimension;
                return;
            }
            /* Assignment (uses unified helper) */
            MultiArray.applyLinearAssignment(M, indices, values, field);
            return;
        }
        /* Numerical indexing (standard) */
        MultiArray.setElementsNumerical(scope, id, field, indexList, right, input, interpreter);
    };

    /**
     * Delete elements from a MultiArray using MATLAB-compatible semantics.
     *
     * This function implements deletion via empty assignment:
     *   A(I) = []
     *
     * Supported modes:
     *
     * 1) Linear deletion
     *    - Triggered when a single index is provided (A(I))
     *    - Indices are resolved in column-major linear order
     *    - Result is a vector:
     *        - Preserves orientation if A is already a vector
     *        - Falls back to column vector otherwise
     *
     * 2) Dimension-based deletion (subscript indexing)
     *    Examples:
     *        A(:, j)   → remove columns
     *        A(i, :)   → remove rows
     *        A(:, :, k) → remove slices (N-D)
     *
     *    Rules (MATLAB-compatible):
     *    - Exactly ONE dimension may differ from a full slice (:)
     *    - All other dimensions must be complete (i.e., ":" behavior)
     *    - The size of the affected dimension is reduced accordingly
     *
     * Behavior details:
     * - Indices are first normalized via computeIndexingStructure
     * - Subscripts (including "end") are resolved via parseSubscript
     * - Linear indices are collected through iterateWithLinearIndex
     * - Deletion is performed by filtering the linearized data and rebuilding
     *   the array with updated dimensions
     *
     * Error conditions:
     * - Empty index list → RangeError
     * - More than one non-colon dimension → RangeError
     * - No effective deletion dimension → RangeError
     *
     * Notes:
     * - Linear deletion is delegated to applyDeletionFromIndices
     * - N-D deletion reconstructs the array in column-major order
     * - Structure fields are preserved during deletion
     *
     * @param M Target MultiArray (modified in-place)
     * @param indexList Raw index expressions (logical or numeric)
     * @param input Optional original input string (used for error context)
     * @param interpreter Optional interpreter (used to resolve expressions like "end")
     */
    public static readonly deleteElements = (M: MultiArray, indexList: (ComplexType | MultiArray)[], input?: string, interpreter?: Interpreter): void => {
        if (indexList.length === 0) {
            throw new RangeError('invalid empty index list.');
        }
        const idx = MultiArray.computeIndexingStructure(M.dimension, indexList);
        /* Linear case → direct delegation */
        if (idx.isLinear) {
            const indices = MultiArray.collectLinearIndices(idx, M.dimension, input, interpreter);
            MultiArray.applyDeletionFromIndices(M, indices);
            return;
        }
        /* MATLAB validation: only one dimension can not be ":" */
        let nonColonDim = -1;
        for (let d = 0; d < idx.argsLength.length; d++) {
            if (idx.argsLength[d] !== M.dimension[d]) {
                if (nonColonDim !== -1) {
                    throw new RangeError('a null assignment can only have one non-colon index');
                }
                nonColonDim = d;
            }
        }
        if (nonColonDim === -1) {
            throw new RangeError('a null assignment can only have one non-colon index');
        }
        /* Collect linear indices */
        const indices = MultiArray.collectLinearIndices(idx, M.dimension, input, interpreter);
        const removeSet = new Set(indices);
        /* Reconstruct array (N-D) */
        const newDimension = M.dimension.slice();
        newDimension[nonColonDim] = 0;
        const linear = MultiArray.linearize(M);
        const kept: ElementType[] = [];
        for (let i = 0; i < linear.length; i++) {
            if (!removeSet.has(i)) {
                kept.push(linear[i]);
            }
        }
        /* Rebuild dimension */
        const sliceSize = linear.length / M.dimension[nonColonDim];
        const newSize = kept.length / sliceSize;
        newDimension[nonColonDim] = newSize;
        const result = new MultiArray(newDimension);
        let k = 0;
        for (let i = 0; i < kept.length; i++) {
            const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], i);
            result.array[p][q] = kept[k++];
        }
        MultiArray.setType(result);
        M.array = result.array;
        M.dimension = result.dimension;
    };

    /**
     * Factory function that creates MATLAB-compatible reduction functions
     * (e.g., sum, prod, min, max, all, any) using MultiArray.reduce.
     * @param callback Binary operation applied elementwise along dimension.
     * @param type
     * @param initial Optional initial value for reduction.
     * @returns A function (M, DIM?) -> ElementType or MultiArray
     */
    public static readonly reduceFactory = (callback: ReduceCallbackOrComparisonType, type: ReduceType, initial?: ReduceInitialType): ReduceHandlerType => {
        switch (type as ReduceType) {
            case 'reduce':
                /* Non-accumulative standard reduce. */
                if (typeof initial !== 'undefined') {
                    return (M: ElementType, DIM?: ElementType): ElementType => {
                        const MA = MultiArray.scalarToMultiArray(M);
                        const dim =
                            typeof DIM !== 'undefined'
                                ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1
                                : Math.max(0, MultiArray.firstNonSingleDimension(MA));
                        return MultiArray.reduce(dim, MA, callback as ReduceCallbackType, initial);
                    };
                } else {
                    return (M: ElementType, DIM?: ElementType): ElementType => {
                        const MA = MultiArray.scalarToMultiArray(M);
                        const dim =
                            typeof DIM !== 'undefined'
                                ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1
                                : Math.max(0, MultiArray.firstNonSingleDimension(MA));
                        return MultiArray.reduce(dim, MA, callback as ReduceCallbackType);
                    };
                }
            case 'cumulative':
                /* Cumulative functions. */
                if (typeof initial !== 'undefined') {
                    return (M: ElementType, DIM?: ElementType): ElementType => {
                        const MA = MultiArray.scalarToMultiArray(M);
                        const dim =
                            typeof DIM !== 'undefined' ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(MA);

                        const result = MultiArray.alongDimensionMap(
                            dim,
                            MA,
                            ((acc?: ElementType) => (element: ElementType, d: number) => {
                                acc = d === 0 ? (callback as ReduceCallbackType)(initial, element) : (callback as ReduceCallbackType)(acc, element);
                                return acc;
                            })(undefined),
                        );
                        MultiArray.setType(result);
                        return result;
                    };
                } else {
                    return (M: ElementType, DIM?: ElementType): ElementType => {
                        const MA = MultiArray.scalarToMultiArray(M);
                        const dim =
                            typeof DIM !== 'undefined' ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(MA);

                        const result = MultiArray.alongDimensionMap(
                            dim,
                            MA,
                            ((acc?: ElementType) => (element: ElementType, d: number) => {
                                acc = d === 0 ? (element as ElementType) : (callback as ReduceCallbackType)(acc, element);
                                return acc;
                            })(undefined),
                        );
                        MultiArray.setType(result);
                        return result;
                    };
                }
            case 'cumcomparison':
                return (M: ElementType, DIM?: ElementType): MultiArray | NodeReturnList | undefined => {
                    const MA = MultiArray.scalarToMultiArray(M);
                    const dim = DIM ? Complex.realToNumber(MultiArray.firstElement(DIM as ElementType) as ComplexType) - 1 : MultiArray.firstNonSingleDimension(MA);
                    const indexM = new MultiArray(MA.dimension);
                    let best: ComplexType;
                    let bestIndex: ComplexType;
                    const resultM = MultiArray.alongDimensionMap(dim, MA, (element, d, i, j) => {
                        if (d === 0) {
                            best = element as ComplexType;
                            bestIndex = Complex.one();
                        } else {
                            if (Complex.realToNumber(Complex[callback as ReduceComparisonType](element as ComplexType, best))) {
                                best = element as ComplexType;
                                bestIndex = Complex.create(d + 1);
                            }
                        }
                        indexM.array[i][j] = bestIndex;
                        return best;
                    });
                    MultiArray.setType(resultM);
                    MultiArray.setType(indexM);
                    return AST.nodeReturnList(
                        (evaluated: ReturnHandlerResult, index: number): ElementType => {
                            if (evaluated.length === 1) return MultiArray.MultiArrayToScalar(resultM);
                            if (evaluated.length === 2) return MultiArray.MultiArrayToScalar(index === 0 ? resultM : indexM);
                            AST.throwErrorIfGreaterThanReturnList(2, evaluated.length);
                        },
                        (length: number): ReturnHandlerResult => ({ length }),
                    );
                };
            case 'comparison':
                const op = (callback as ReduceComparisonType) === 'lt' ? 'min' : 'max';
                return (...args: ElementType[]): MultiArray | NodeReturnList | undefined => {
                    const minMaxAlongDimension = (M: MultiArray, dimension: number) => {
                        /* It reduces the matrix along one dimension, storing values and indices. */
                        const reduced = MultiArray.reduceToArray(dimension, M);
                        const resultM = new MultiArray(reduced.dimension);
                        const indexM = new MultiArray(reduced.dimension);
                        for (let i = 0; i < indexM.array.length; i++) {
                            for (let j = 0; j < indexM.array[i].length; j++) {
                                const arrayLine = reduced.array[i][j] as unknown as ComplexType[];
                                let best = arrayLine[0];
                                let bestIndex = 1;
                                for (let d = 1; d < arrayLine.length; d++) {
                                    const curr = arrayLine[d];
                                    if (Complex.realToNumber(Complex[callback as ReduceComparisonType](curr, best))) {
                                        best = curr;
                                        bestIndex = d + 1;
                                    }
                                }
                                resultM.array[i][j] = best;
                                indexM.array[i][j] = Complex.create(bestIndex);
                            }
                        }
                        MultiArray.setType(resultM);
                        MultiArray.setType(indexM);
                        return AST.nodeReturnList(
                            (evaluated: ReturnHandlerResult, index: number): ElementType => {
                                if (evaluated.length === 1) return MultiArray.MultiArrayToScalar(resultM);
                                if (evaluated.length === 2) return MultiArray.MultiArrayToScalar(index === 0 ? resultM : indexM);
                                AST.throwErrorIfGreaterThanReturnList(2, evaluated.length);
                            },
                            (length: number): ReturnHandlerResult => ({ length }),
                        );
                    };
                    switch (args.length) {
                        case 1: {
                            const M = MultiArray.scalarToMultiArray(args[0]);
                            const dim = MultiArray.firstNonSingleDimension(M);
                            return minMaxAlongDimension(M, dim);
                        }
                        case 2: {
                            const A = MultiArray.scalarToMultiArray(args[0]);
                            const B = args[1];
                            /* If the second argument is a real scalar → treat it as a dimension. */
                            if (MultiArray.isScalar(B)) {
                                const dim = MultiArray.testInteger(B as ComplexType, 'reduceFactory', 'dimension', [1, Infinity]) - 1;
                                return minMaxAlongDimension(A, dim);
                            }
                            /* If it's an array, perform an element-by-element operation. */
                            const Bm = MultiArray.scalarToMultiArray(B);
                            return MultiArray.elementWiseOperation((op + 'Wise') as TBinaryOperationName, A, Bm);
                        }
                        case 3: {
                            /* min(M, [], dim) */
                            if (!MultiArray.isEmpty(args[1])) {
                                throw new Error(`${op}: second argument must be [] or omitted`);
                            }
                            const M = MultiArray.scalarToMultiArray(args[0]);
                            const dim = Complex.realToNumber(MultiArray.firstElement(args[2]) as ComplexType) - 1;
                            return minMaxAlongDimension(M, dim);
                        }
                        default:
                            AST.throwInvalidCallError(op);
                    }
                };
            default:
                throw TypeError(`reduceFactory: invalid type argument: ${type}`);
        }
    };
}

export { type ElementType, MultiArray };
export default { MultiArray };
