import type { TUnaryOperationLeftName, TBinaryOperationName } from './ComplexInterface';
import { Complex, ComplexType } from './Complex';
import { CharString } from './CharString';
import { Evaluator, NameTable } from './Evaluator';
import { FunctionHandle } from './FunctionHandle';
import { Structure } from './Structure';
import { AST, NodeReturnList, ReturnHandlerResult } from './AST';

/**
 * MultiArray Element type.
 */
type ElementType = MultiArray | ComplexType | CharString | Structure | FunctionHandle | null | undefined;

/**
 * Reduce factory function types.
 */

type ReduceComparisonType = 'lt' | 'gt';
type ReduceType = 'reduce' | 'cumulative' | 'cumcomparison' | 'comparison';
type ReduceElementType = ElementType;
type ReduceCallbackType = (prev: ReduceElementType, curr: ReduceElementType, index?: number) => ReduceElementType;
type ReduceCallbackOrComparisonType = ReduceCallbackType | ReduceComparisonType;
type ReduceInitialType = ReduceElementType;
type ReduceReduceHandlerType = (M: ReduceElementType, DIM?: ReduceElementType) => ReduceElementType;
type ReduceComparisonHandlerType = (...args: ElementType[]) => MultiArray | NodeReturnList | undefined;
type ReduceHandlerType = ReduceReduceHandlerType | ReduceComparisonHandlerType;

/**
 * # MultiArray
 *
 * Multimensional array library. This class represents common arrays and cell arrays.
 */
class MultiArray {
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
    public array: ElementType[][];

    /**
     * Type attribute.
     */
    public type: number;

    public static readonly isInstanceOf = (value: unknown): value is MultiArray => value instanceof MultiArray;

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
    public constructor(shape?: number[], fill?: ElementType, iscell?: boolean) {
        if (shape) {
            this.dimension = shape.slice();
            MultiArray.appendSingletonTail(this.dimension, 2);
            MultiArray.removeSingletonTail(this.dimension);
            this.array = new Array(this.dimensionR.reduce((p, c) => p * c, 1));
            if (fill) {
                if (fill instanceof MultiArray || fill instanceof Structure) {
                    for (let i = 0; i < this.array.length; i++) {
                        this.array[i] = new Array(this.dimension[1]);
                        for (let j = 0; j < this.dimension[1]; j++) {
                            this.array[i][j] = fill.copy();
                        }
                    }
                } else {
                    for (let i = 0; i < this.array.length; i++) {
                        this.array[i] = new Array(this.dimension[1]).fill(fill);
                    }
                }
                this.type = fill.type;
            } else {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i] = new Array(this.dimension[1]);
                    for (let j = 0; j < this.dimension[1]; j++) {
                        this.array[i][j] = Complex.zero();
                    }
                }
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
     * Check if object is a MultiArray and it is a row vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static readonly isColumnVector = (obj: unknown): boolean => obj instanceof MultiArray && obj.dimension.length === 2 && obj.dimension[1] === 1;

    /**
     * Check if object is a MultiArray and it is a row vector or a column vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector or a column vector. false otherwise.
     */
    public static readonly isVector = (obj: unknown): boolean => obj instanceof MultiArray && obj.dimension.length === 2 && (obj.dimension[0] === 1 || obj.dimension[1] === 1);

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
        /* Trate o caso escalar e qualquer array sem dimensões > 1 */
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
        M.array.push(row);
        M.dimension[0]++;
        return M;
    };

    /**
     * Unparse MultiArray.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray.
     */
    public static readonly unparse = (M: MultiArray, evaluator: Evaluator, parentPrecedence = 0): string => {
        const unparseRows = (row: ElementType[]) => row.map((value) => evaluator.Unparse(value)).join() + ';\n';
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
     * Unparse MultiArray as MathML language.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray in MathML language.
     */
    public static readonly unparseMathML = (M: MultiArray, evaluator: Evaluator, parentPrecedence = 0): string => {
        const unparseRows = (row: ElementType[]) => `<mtr>${row.map((value) => `<mtd>${evaluator.unparserMathML(value)}</mtd>`).join('')}</mtr>`;
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
        // if (value instanceof MultiArray) {
        //     /* It is a MultiArray. */
        //     if (value.dimension.reduce((p: number, c: number) => p * c, 1) > 0) {
        //         /* Return first element. */
        //         return value.array[0][0];
        //     } else {
        //         /* Some dimension is null. */
        //         return value;
        //     }
        // } else {
        //     /* It is not a MultiArray. */
        //     return value;
        // }
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
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row) => row.map((value) => value!.copy()));
        result.type = M.type;
        return result;
    };

    /**
     * Copy method (for element's generics).
     * @returns
     */
    public copy(): MultiArray {
        const result = new MultiArray(this.dimension);
        result.array = this.array.map((row) => row.map((value) => value!.copy()));
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
    public static readonly parseSubscript = (dimension: number[], subscript: ComplexType[], input?: string, evaluator?: Evaluator): number => {
        /* Converts Complex[] subscript parameter to number[]. */
        const index = subscript.map((i) => MultiArray.testIndex(i, `${input ? input : ''}${evaluator ? '(' + subscript.map((i) => evaluator.Unparse(i)).join() + ')' : ''}`));
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
        result.array = M.array.map((row) => row.map(callback as any));
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
            return MultiArray.rawMap(elem, (el: ComplexType) => Complex.rdiv(el, scalar));
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
    private static splitLastDimension(M: MultiArray): MultiArray[] {
        const result = [];
        const lastDim = M.dimension[M.dimension.length - 1];
        for (let i = 0; i < lastDim; i++) {
            const sliceLength = M.array.length / lastDim;
            const array = new MultiArray(M.dimension.slice(0, -1));
            array.array = M.array.slice(i * sliceLength, (i + 1) * sliceLength);
            result.push(array);
        }
        return result;
    }

    /**
     * Calls `splitLastDimension` and recursively calls `evaluate` for each
     * result, concatenating on the last dimension, until the array is 2-D,
     * then then concatenates the elements row by row horizontally, then
     * concatenates the rows vertically.
     * @param M MultiArray object.
     * @param evaluator Evaluator instance.
     * @param local Local context (function evaluation).
     * @param fname Function name (context).
     * @returns Evaluated MultiArray object.
     */
    private static evaluateRecursive(M: MultiArray, evaluator?: Evaluator | null | undefined, local: boolean = false, fname: string = ''): MultiArray {
        if (M.dimension.length > 2) {
            return MultiArray.concatenate(M.dimension.length - 1, 'evaluate', ...MultiArray.splitLastDimension(M).map((S) => MultiArray.evaluate(S)));
        } else {
            return MultiArray.concatenate(
                0,
                'evaluate',
                ...M.array.map((row) =>
                    MultiArray.concatenate(1, 'evaluate', ...row.map((element) => MultiArray.scalarToMultiArray(evaluator ? evaluator.Evaluator(element, local, fname) : element))),
                ),
            );
        }
    }

    /**
     * Wrapper to not pass the null array to `MultiArray.evaluatorRecursive`.
     * @param M MultiArray object.
     * @param evaluator Evaluator instance.
     * @param local Local context (function evaluation).
     * @param fname Function name (context).
     * @returns Evaluated MultiArray object.
     */
    public static readonly evaluate = (M: MultiArray, evaluator?: Evaluator | null | undefined, local: boolean = false, fname: string = ''): MultiArray => {
        if (MultiArray.isEmpty(M)) {
            return M;
        } else {
            const result = MultiArray.evaluateRecursive(M, evaluator, local, fname);
            result.isCell = M.isCell;
            MultiArray.setType(result);
            return result;
        }
    };

    /**
     * Get selected items from MultiArray by linear indices or subscripts.
     * @param M MultiArray.
     * @param id Identifier.
     * @param indexList Linear index or subscript.
     * @returns MultiArray of selected items.
     */
    public static readonly getElements = (M: MultiArray, id: string, field: string[], indexList: (ComplexType | MultiArray)[]): ElementType => {
        let result: MultiArray;
        if (indexList.length === 0) {
            return M;
        } else {
            const args = indexList.map((index) => MultiArray.linearize(index));
            const argsLength = args.map((arg) => arg.length);
            if (indexList.length === 1 && indexList[0] instanceof MultiArray) {
                result = new MultiArray(indexList[0].dimension);
            } else {
                result = new MultiArray(argsLength.length > 1 ? argsLength : [argsLength[0], 1]);
            }
            for (let n = 0; n < argsLength.reduce((p, c) => p * c, 1); n++) {
                const subscriptM = MultiArray.linearIndexToSubscript(argsLength, n).map((s, r) => args[r][s - 1]) as ComplexType[];
                const linearM = MultiArray.parseSubscript(M.dimension, subscriptM, id);
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearM);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
                if (field.length > 0) {
                    result.array[p][q] = Structure.getField(M.array[i][j], field);
                } else {
                    result.array[p][q] = M.array[i][j];
                }
            }
            MultiArray.setType(result);
            return result;
        }
    };

    /**
     * Get selected items from MultiArray by logical indexing.
     * @param M MultiArray.
     * @param id Identifier.
     * @param items Logical index.
     * @returns MultiArray of selected items.
     */
    public static readonly getElementsLogical = (M: MultiArray, id: string, field: string[], items: MultiArray): ElementType => {
        const result = new MultiArray();
        const linM = MultiArray.linearize(M);
        const test = (MultiArray.linearize(items) as ComplexType[]).map((value: ComplexType) => Complex.realToNumber(value));
        const itemsIsRowVector = MultiArray.isRowVector(items);
        if (itemsIsRowVector) {
            result.array[0] = [];
        }
        if (test.length > linM.length) {
            throw new EvalError(`${id}(${test.length}): out of bound ${linM.length} (dimensions are ${M.dimension.join('x')})`);
        }
        for (let n = 0; n < linM.length; n++) {
            if (test[n]) {
                if (itemsIsRowVector) {
                    result.array[0].push(linM[n]);
                } else {
                    result.array.push([linM[n]]);
                }
            }
        }
        result.dimension = itemsIsRowVector ? [1, result.array[0].length] : [result.array.length, 1];
        return result;
    };

    /**
     * Set selected items from MultiArray by linear index or subscripts.
     * @param nameTable Name Table.
     * @param id Identifier.
     * @param args Linear indices or subscripts.
     * @param right Value to assign.
     */
    public static readonly setElements = (
        nameTable: NameTable,
        id: string,
        field: string[],
        indexList: (ComplexType | MultiArray)[],
        right: MultiArray,
        input?: string,
        evaluator?: Evaluator,
    ): void => {
        if (indexList.length === 0) {
            throw new RangeError('invalid empty index list.');
        } else {
            const linright = MultiArray.linearize(right);
            const isLinearIndex = indexList.length === 1;
            const args = indexList.map((index) => MultiArray.linearize(index));
            const argsLength = args.map((arg) => arg.length);
            const argsParsed = args.map((arg) =>
                arg.map((i) => MultiArray.testIndex(i as ComplexType, `${input ? input : ''}${evaluator ? '(' + args.map((arg) => arg.map((i) => evaluator.Unparse(i))).join() + ')' : ''}`)),
            );
            const argsMax = argsParsed.map((arg) => Math.max(...arg));
            if (linright.length !== 1 && linright.length !== argsLength.reduce((p, c) => p * c, 1)) {
                throw new RangeError(`=: nonconformant arguments (op1 is ${argsLength.join('x')}, op2 is ${right.dimension.join('x')})`);
            }
            if (typeof nameTable[id] !== 'undefined') {
                if (nameTable[id] instanceof MultiArray) {
                    if (isLinearIndex) {
                        if (argsMax[0] > MultiArray.linearLength(nameTable[id])) {
                            throw new RangeError('Invalid resizing operation or ambiguous assignment to an out-of-bounds array element.');
                        }
                    } else {
                        MultiArray.expand(nameTable[id], argsMax);
                    }
                } else {
                    const value = nameTable[id];
                    const blankValue: ElementType = value instanceof Structure ? Structure.cloneFields(value) : Complex.zero();
                    if (isLinearIndex) {
                        nameTable[id] = new MultiArray([1, argsMax[0]], blankValue);
                    } else {
                        nameTable[id] = new MultiArray(argsMax, blankValue);
                    }
                    nameTable[id].array[0][0] = value;
                }
            } else {
                const blankValue: ElementType = field.length > 0 ? new Structure(field) : Complex.zero();
                if (isLinearIndex) {
                    nameTable[id] = new MultiArray([1, argsMax[0]], blankValue);
                } else {
                    nameTable[id] = new MultiArray(argsMax, blankValue);
                }
            }
            const array: MultiArray = nameTable[id];
            if (field.length > 0) {
                Structure.setEmptyField(array, field[0]);
            }
            const dimension: number[] = nameTable[id].dimension.slice();
            for (let n = 0; n < argsLength.reduce((p, c) => p * c, 1); n++) {
                const subscript = MultiArray.linearIndexToSubscript(argsLength, n);
                const subscriptArgs: number[] = subscript.map((s, r) =>
                    MultiArray.testIndex(
                        args[r][s - 1] as ComplexType,
                        `${input ? input : ''}${evaluator ? '(' + subscript.map((i) => evaluator.Unparse(Complex.create(i))).join() + ')' : ''}`,
                    ),
                );
                const indexLinear = MultiArray.subscriptToLinearIndex(dimension, subscriptArgs);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(dimension[0], dimension[1], indexLinear);
                if (field.length > 0) {
                    Structure.setField(array.array[p][q] as Structure, field, linright.length === 1 ? linright[0] : linright[n]);
                } else {
                    array.array[p][q] = linright.length === 1 ? linright[0] : linright[n];
                }
            }
        }
    };

    /**
     * Set selected items from MultiArray by logical indexing.
     * @param nameTable Name Table.
     * @param id Identifier.
     * @param arg Logical index.
     * @param right Value to assign.
     */
    public static readonly setElementsLogical = (nameTable: NameTable, id: string, field: string[], arg: ComplexType[], right: MultiArray): void => {
        const linright = MultiArray.linearize(right);
        const test = arg.map((value: ComplexType) => Complex.realToNumber(value));
        const testCount = test.reduce((p, c) => p + c, 0);
        if (testCount !== linright.length) {
            throw new EvalError(`=: nonconformant arguments (op1 is ${testCount}x1, op2 is ${right.dimension[0]}x${right.dimension[1]})`);
        }
        const isDefinedId = typeof nameTable[id] !== 'undefined';
        const isNotFunction = isDefinedId && !(nameTable[id] instanceof FunctionHandle);
        const isMultiArray = isNotFunction && nameTable[id] instanceof MultiArray;
        if (isMultiArray) {
            const array: MultiArray = nameTable[id];
            for (let j = 0, n = 0, r = 0; j < array.dimension[1]; j++) {
                for (let i = 0; i < array.dimension[0]; i++, r++) {
                    if (test[r]) {
                        if (field.length > 0) {
                            Structure.setField(array.array[i][j] as Structure, field, linright[n]);
                        } else {
                            array.array[i][j] = linright[n];
                        }
                        n++;
                    }
                }
            }
        } else {
            throw new EvalError(`${id}(_): invalid matrix indexing.`);
        }
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
                        (evaluated: ReturnHandlerResult, index: number): any => {
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
                            (evaluated: ReturnHandlerResult, index: number): any => {
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
                                /* const dim = Complex.realToNumber(B as ComplexType) - 1; */
                                const dim = MultiArray.testInteger(B as ComplexType, 'reduceFactory', 'dimension', [1, Infinity]) - 1;
                                return minMaxAlongDimension(A, dim);
                            }
                            /* If it's an array, perform an element-by-element operation. */
                            const Bm = MultiArray.scalarToMultiArray(B);
                            return MultiArray.elementWiseOperation((op + 'Wise') as TBinaryOperationName, A, Bm);
                        }
                        case 3: {
                            /* min(A, [], dim) */
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
