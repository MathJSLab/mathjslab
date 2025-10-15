import type { TUnaryOperationLeftName, TBinaryOperationName } from './ComplexInterface';
import { Complex, ComplexType } from './Complex';
import { CharString } from './CharString';
import { Evaluator, NameTable } from './Evaluator';
import { FunctionHandle } from './FunctionHandle';
import { Structure } from './Structure';

/**
 * MultiArray Element type.
 */
type ElementType = MultiArray | ComplexType | CharString | Structure | FunctionHandle | null | undefined;

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

    public static isInstanceOf = (value: unknown): boolean => value instanceof MultiArray;

    public static LOGICAL = Complex.LOGICAL;
    public static REAL = Complex.REAL;
    public static COMPLEX = Complex.COMPLEX;
    public static STRING = CharString.STRING;
    public static STRUCTURE = Structure.STRUCTURE;
    public static FUNCTION_HANDLE = FunctionHandle.FUNCTION_HANDLE;

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
                this.isCell = iscell ?? false;
            } else {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i] = new Array(this.dimension[1]);
                    for (let j = 0; j < this.dimension[1]; j++) {
                        this.array[i][j] = { type: -1 } as ElementType;
                    }
                }
                this.type = -1;
                this.isCell = iscell ?? false;
            }
        } else {
            this.dimension = [0, 0];
            this.array = [];
            this.type = -1;
            this.isCell = iscell ?? false;
        }
    }

    /**
     * Check if object is a scalar.
     * @param obj Any object.
     * @returns `true` if object is a scalar. false otherwise.
     */
    public static isScalar(obj: any): boolean {
        return !(obj instanceof MultiArray && obj.dimension.reduce((p, c) => p * c, 1) > 1);
    }

    /**
     * Check if object is a MultiArray and it is a row vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static isRowVector(obj: any): boolean {
        return obj instanceof MultiArray && obj.dimension.length === 2 && obj.dimension[0] === 1;
    }

    /**
     * Check if object is a MultiArray and it is a row vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static isColumnVector(obj: any): boolean {
        return obj instanceof MultiArray && obj.dimension.length === 2 && obj.dimension[1] === 1;
    }

    /**
     * Check if object is a MultiArray and it is a row vector or a column vector.
     * @param obj Any object.
     * @returns `true` if object is a row vector or a column vector. false otherwise.
     */
    public static isVector(obj: any): boolean {
        return obj instanceof MultiArray && obj.dimension.length === 2 && (obj.dimension[0] === 1 || obj.dimension[1] === 1);
    }

    /**
     * Check if object is a scalar or a 2-D MultiArray.
     * @param obj Any object.
     * @returns `true` if object is a row vector or a column vector. false otherwise.
     */
    public static isMatrix(obj: any): boolean {
        return !(obj instanceof MultiArray) || obj.dimension.length === 2;
    }

    /**
     * Returns `true` if `obj` any one of its dimensions is zero.
     * Returns `false` otherwise.
     * @param obj Any object.
     * @returns `true` if object is an empty array.
     */
    public static isEmpty(obj: any): boolean {
        return obj instanceof MultiArray && (obj as MultiArray).dimension.reduce((p, c) => p * c, 1) === 0;
    }

    /**
     * Check if object is a MultiArray and it is a cell array.
     * @param obj Any object.
     * @returns `true` if object is a cell array. false otherwise.
     */
    public static isCellArray(obj: any): boolean {
        return obj instanceof MultiArray && obj.isCell;
    }

    /**
     * Set type property in place with maximum value of array items type.
     * @param M MultiArray to set type property.
     */
    public static setType(M: MultiArray): void {
        M.type = Math.max(...M.array.map((row) => Math.max(...row.map((value) => value!.type))));
    }

    /**
     * Test if two array are equals.
     * @param left Array<boolean | number | string>.
     * @param right Array<boolean | number | string>.
     * @returns true if two arrays are equals. false otherwise.
     */
    public static arrayEquals(a: (boolean | number | string)[], b: (boolean | number | string)[]): boolean {
        return a.length === b.length && a.every((value, index) => value === b[index]);
    }

    /**
     * Returns a one-based range array ([1, 2, ..., length]).
     * @param length Length or last value of range array.
     * @returns Range array.
     */
    public static rangeArray(length: number): number[] {
        const result = [];
        for (let i = 1; i <= length; i++) {
            result.push(i);
        }
        return result;
    }

    /**
     * Converts linear index to subscript.
     * @param dimension Dimensions of multidimensional array ([line, column, page, block, ...]).
     * @param index Zero-based linear index.
     * @returns One-based subscript ([line, column, page, block, ...]).
     */
    public static linearIndexToSubscript(dimension: number[], index: number): number[] {
        return dimension.map((dim, i) => (Math.floor(index / dimension.slice(0, i).reduce((p, c) => p * c, 1)) % dim) + 1);
    }

    /**
     * Converts subscript to linear index.
     * @param dimension Dimensions of multidimensional array ([line, column, page, block, ...]).
     * @param subscript One-based subscript ([line, column, page, block, ...]).
     * @returns Zero-based linear index.
     */
    public static subscriptToLinearIndex(dimension: number[], subscript: number[]): number {
        return subscript.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);
    }

    /**
     * Converts linear index to Multiarray.array subscript.
     * @param row Row dimension.
     * @param column Column dimension.
     * @param index Zero-based linear index.
     * @returns Multiarray.array subscript ([row, column]).
     */
    public static linearIndexToMultiArrayRowColumn(row: number, column: number, index: number): [number, number] {
        const pageLength = row * column;
        const indexPage = index % pageLength;
        return [Math.floor(index / pageLength) * row + (indexPage % row), Math.floor(indexPage / row)];
    }

    /**
     * Converts MultiArray subscript to Multiarray.array subscript.
     * @param dimension MultiArray dimension.
     * @param subscript Subscript.
     * @returns Multiarray.array subscript ([row, column]).
     */
    public static subscriptToMultiArrayRowColumn(dimension: number[], subscript: number[]): [number, number] {
        const index = subscript.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);
        const pageLength = dimension[0] * dimension[1];
        const indexPage = index % pageLength;
        return [Math.floor(index / pageLength) * dimension[0] + (indexPage % dimension[0]), Math.floor(indexPage / dimension[0])];
    }

    /**
     * Converts MultiArray raw row and column to MultiArray linear index.
     * @param dimension MultiArray dimension (can be only the two first dimensions)
     * @param i Raw row
     * @param j Raw column
     * @returns Linear index
     */
    public static rowColumnToLinearIndex(dimension: number[], i: number, j: number): number {
        return Math.floor(i / dimension[0]) * dimension[0] * dimension[1] + j * dimension[0] + (i % dimension[0]);
    }

    /**
     * Base method of the ind2sub function. Returns dimension.length + 1
     * dimensions. If the index exceeds the dimensions, the last dimension
     * will contain the multiplier of the other dimensions. Otherwise it will
     * be 1.
     * @param dimension Array of dimensions.
     * @param index One-base linear index.
     * @returns One-based subscript ([line, column, page, block, ...]).
     */
    public static ind2subNumber(dimension: number[], index: number): number[] {
        dimension = [...dimension, index + 1];
        return dimension.map((dim, i) => Math.floor((index - 1) / dimension.slice(0, i).reduce((p, c) => p * c, 1)) % dim).map((d) => d + 1);
    }

    /**
     * Returns the number of elements in M.
     * @param M Multidimensional array.
     * @returns Number of elements in M.
     */
    public static linearLength(M: MultiArray): number {
        return M.array.length * M.dimension[1];
    }

    /**
     * Get dimension at index d of MultiArray M
     * @param M Multiarray.
     * @param d Zero-based dimension index.
     * @returns Dimension d.
     */
    public static getDimension(M: MultiArray, d: number): number {
        return d < M.dimension.length ? M.dimension[d] : 1;
    }

    /**
     * Remove singleton tail of dimension array in place.
     * @param dimension Dimension array.
     */
    public static removeSingletonTail(dimension: number[]): void {
        let i = dimension.length - 1;
        while (dimension[i] === 1 && i > 1) {
            dimension.pop();
            i--;
        }
    }

    /**
     * Append singleton tail of dimension array in place.
     * @param dimension Dimension array.
     * @param length Resulting length of dimension array.
     */
    public static appendSingletonTail(dimension: number[], length: number): void {
        if (length > dimension.length) {
            dimension.push(...new Array(length - dimension.length).fill(1));
        }
    }

    /**
     * Find first non-single dimension.
     * @param M MultiArray.
     * @returns First non-single dimension of `M`.
     */
    public static firstNonSingleDimension(M: MultiArray): number {
        for (let i = 0; i < M.dimension.length; i++) {
            if (M.dimension[i] !== 1) {
                return i;
            }
        }
        return M.dimension.length - 1;
    }

    /**
     * Creates a MultiArray object from the first row of elements (for
     * parsing purposes).
     * @param row Array of objects.
     * @returns MultiArray with `row` parameter as first line.
     */
    public static firstRow(row: ElementType[], iscell?: boolean): MultiArray {
        const result = new MultiArray([1, row.length]);
        result.array[0] = row;
        result.isCell = iscell ?? false;
        return result;
    }

    /**
     * Append a row of elements to a MultiArray object (for parsing
     * purposes).
     * @param M MultiArray.
     * @param row Array of objects to append as row of MultiArray.
     * @returns MultiArray with row appended.
     */
    public static appendRow(M: MultiArray, row: ElementType[]): MultiArray {
        M.array.push(row);
        M.dimension[0]++;
        return M;
    }

    /**
     * Swap two rows of a MultiArray in place.
     * @param M
     * @param m
     * @param n
     */
    public static swapRows(M: MultiArray, m: number, n: number): void {
        const row = M.array[m];
        M.array[m] = M.array[n];
        M.array[n] = row;
    }

    /**
     * Unparse MultiArray.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray.
     */
    public static unparse(M: MultiArray, evaluator: Evaluator, parentPrecedence = 0): string {
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
    }

    /**
     * Unparse MultiArray as MathML language.
     * @param M MultiArray object.
     * @returns String of unparsed MultiArray in MathML language.
     */
    public static unparseMathML(M: MultiArray, evaluator: Evaluator, parentPrecedence = 0): string {
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
    }

    /**
     * Converts CharString to MultiArray.
     * @param text CharString.
     * @returns MultiArray with character codes as integer.
     */
    public static fromCharString(text: CharString): MultiArray {
        if (text.str.length > 0) {
            const result = new MultiArray([1, text.str.length]);
            result.array = [text.str.split('').map((char) => Complex.create(char.charCodeAt(0)))];
            result.type = Complex.REAL;
            return MultiArray.MultiArrayToScalar(result) as MultiArray;
        } else {
            return MultiArray.emptyArray();
        }
    }

    /**
     * Linearize MultiArray in an array of ElementType using column-major
     * order.
     * @param M Multidimensional array.
     * @returns `ElementType[]` of multidimensional array `M` linearized.
     */
    public static linearize(M: ElementType): ElementType[] {
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
    }

    /**
     * Returns a empty array (0x0 matrix).
     * @returns Empty array (0x0 matrix).
     */
    public static emptyArray(iscell?: boolean): MultiArray {
        const result = new MultiArray([0, 0]);
        result.isCell = iscell ?? false;
        return result;
    }

    /**
     * Convert scalar to MultiArray with aditional test if it is MultiArray.
     * @param value
     * @param test
     * @returns
     */
    private static scalarToMultiArrayWithTest(value: ElementType, test: boolean): MultiArray {
        if (value instanceof MultiArray && test) {
            return value;
        } else {
            const result = new MultiArray([1, 1]);
            result.array[0] = [value];
            result.type = value!.type ?? -1;
            return result;
        }
    }

    /**
     * If value is a scalar then convert to a 1x1 MultiArray. If is cell array
     * the cell is put in a 1x1 MultiArray too.
     * @param value MultiArray or scalar.
     * @returns MultiArray 1x1 if value is scalar.
     */
    public static scalarToMultiArray(value: ElementType): MultiArray {
        return MultiArray.scalarToMultiArrayWithTest(value, !(value as MultiArray).isCell);
    }

    /**
     * If value is a scalar then convert to a 1x1 MultiArray. If is common
     * array or cell array returns `value` unchanged.
     * @param value MultiArray or scalar.
     * @returns MultiArray 1x1 if value is scalar.
     */
    public static scalarOrCellToMultiArray(value: ElementType): MultiArray {
        return MultiArray.scalarToMultiArrayWithTest(value, true);
    }

    /**
     * If `value` parameter is a MultiArray of size 1x1 then returns as scalar.
     * @param value MultiArray or scalar.
     * @returns Scalar value if `value` parameter has all dimensions as singular.
     */
    public static MultiArrayToScalar(value: ElementType): ElementType {
        if (value instanceof MultiArray && value.dimension.length === 2 && value.dimension[0] === 1 && value.dimension[1] === 1) {
            return value.array[0][0];
        } else {
            return value;
        }
    }

    /**
     * If `value` parameter is a non empty MultiArray returns it's first element.
     * Otherwise returns `value` parameter.
     * @param value
     * @returns
     */
    public static firstElement(value: ElementType): ElementType {
        if (value instanceof MultiArray) {
            // It is a MultiArray.
            if (value.dimension.reduce((p: number, c: number) => p * c, 1) > 0) {
                // Return first element.
                return value.array[0][0];
            } else {
                // Some dimension is null.
                return value;
            }
        } else {
            // It is not a MultiArray.
            return value;
        }
    }

    /**
     * If M is a line vector then return the line of M else return first column of M.
     * @param M
     * @returns
     */
    public static firstVector(M: ElementType): ElementType[] {
        if (M instanceof MultiArray) {
            if (M.dimension[0] === 1) {
                return M.array[0];
            } else {
                return M.array.map((row) => row[0]);
            }
        } else {
            return [M];
        }
    }

    /**
     * Copy of MultiArray.
     * @param M MultiArray.
     * @returns Copy of MultiArray.
     */
    public static copy(M: MultiArray): MultiArray {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row) => row.map((value) => value!.copy()));
        result.type = M.type;
        return result;
    }

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
    public static toLogical(M: MultiArray): ComplexType {
        for (let i = 0; i < M.array.length; i++) {
            const row = M.array[i];
            for (let j = 0; j < M.dimension[1]; j++) {
                const value = (row[j] as ComplexType).toLogical();
                if (Complex.realEquals(value, 0)) {
                    // if (value.re.eq(0)) {
                    return Complex.false();
                }
            }
        }
        return Complex.true();
    }

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
                    // if (value.re.eq(0)) {
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
    public static expand(M: MultiArray, dim: number[]): void {
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
    }

    /**
     * Reshape an array acording dimensions in `dim`.
     * @param M MultiArray.
     * @param dim Result dimensions.
     * @param d Undefined dimension index (optional).
     * @returns
     */
    public static reshape(M: MultiArray, dim: number[], d?: number): MultiArray {
        const lengthM = M.dimension.reduce((p, c) => p * c, 1);
        const dimension = dim.slice();
        if (typeof d !== 'undefined') {
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
        return result;
    }

    /**
     * Expand range.
     * @param startNode Start of range.
     * @param stopNode Stop of range.
     * @param strideNode Optional stride value.
     * @returns MultiArray of range expanded.
     */
    public static expandRange(start: ComplexType, stop: ComplexType, stride?: ComplexType | null): MultiArray {
        const expanded = [];
        const s = stride ? Complex.realToNumber(stride) : 1;
        // const s = stride ? stride.re.toNumber() : 1;
        for (let n = Complex.realToNumber(start), i = 0; s > 0 ? n <= Complex.realToNumber(stop) : n >= Complex.realToNumber(stop); n += s, i++) {
            // for (let n = start.re.toNumber(), i = 0; s > 0 ? n <= stop.re.toNumber() : n >= stop.re.toNumber(); n += s, i++) {
            expanded[i] = Complex.create(n);
        }
        const result = new MultiArray([1, expanded.length]);
        result.array = [expanded];
        MultiArray.setType(result);
        return result;
    }

    /**
     * Expand colon to a column vector.
     * @param length
     * @returns
     */
    public static expandColon(length: number): MultiArray {
        const result = new MultiArray([length, 1]);
        for (let i = 0; i < length; i++) {
            result.array[i] = [Complex.create(i + 1)];
        }
        MultiArray.setType(result);
        return result;
    }

    /**
     * Check if subscript is a integer number, convert Complex to
     * number.
     * @param k Index as Complex.
     * @param input Optional id reference of object.
     * @returns k as number, if real part is integer greater than 1 and imaginary part is 0.
     */
    public static testIndex(k: ComplexType, input?: string): number {
        if (!Complex.realIsInteger(k) || Complex.realLessThan(k, 1)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be either integers greater than or equal 1 or logicals.`);
        }
        if (!Complex.imagEquals(k, 0)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be real.`);
        }
        return Complex.realToNumber(k);
    }

    /**
     * Check if subscript is a integer number, convert Complex to
     * number, then check if it's less than bound.
     * @param k Index as Complex.
     * @param bound Maximum acceptable value for the index
     * @param dim Dimensions (to generate error message)
     * @param input Optional string to generate error message.
     * @returns Index as number.
     */
    public static testIndexBound(k: ComplexType, bound: number, dim: number[], input?: string): number {
        const result = MultiArray.testIndex(k, input);
        if (result > bound) {
            throw new RangeError(`${input ? `${input}: ` : ``}out of bound ${bound} (dimensions are ${dim.join('x')}).`);
        }
        return result;
    }

    /**
     * Converts subscript to linear index. Performs checks and throws
     * comprehensive errors if dimension bounds are exceeded.
     * @param dimension Dimension of multidimensional array ([line, column, page, block, ...]) as number[].
     * @param subscript Subscript ([line, column, page, block, ...]) as a Complex[].
     * @param input Input string to generate error messages (the id of array).
     * @returns linear index.
     */
    public static parseSubscript(dimension: number[], subscript: ComplexType[], input?: string, evaluator?: Evaluator): number {
        // Converts Complex[] subscript parameter to number[].
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
        // Copy index to indexReduced and remove singleton tail.
        const indexReduced = index.slice();
        MultiArray.removeSingletonTail(indexReduced);
        if (indexReduced.length > dimension.length) {
            // Error if indexReduced has more dimensions than dimension parameter.
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                throwError(dimFail, 1);
            }
        }
        let dim: number[];
        if (index.length < dimension.length) {
            // Copy dimension parameter.
            dim = dimension.slice();
            // Test if some index greater than dim.
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                if (dimFail === index.length - 1) {
                    // Last index is greater than corresponding dimension. Test if it's greater than dimension tail.
                    const bound = dim.slice(index.length - 1).reduce((p, c) => p * c, 1);
                    if (index[index.length - 1] > bound) {
                        throwError(dimFail, bound);
                    }
                } else {
                    // Error before last index.
                    throwError(dimFail, dim[dimFail]);
                }
            }
        } else {
            // Copy dimension parameter and append 1 until it has the same length of index if necessary.
            dim = dimension.concat(new Array(index.length - dimension.length).fill(1));
            // Test if some index greater than dim.
            const test = index.map((i, n) => i > dimension[n]);
            const dimFail = test.indexOf(true);
            if (dimFail >= 0) {
                throwError(dimFail, dim[dimFail]);
            }
        }
        return indexReduced.reduce((p, c, i) => p + (c - 1) * dimension.slice(0, i).reduce((p, c) => p * c, 1), 0);
    }

    /**
     * Binary operation 'scalar `operation` array'.
     * @param op Binary operation name.
     * @param left Left operand (scalar).
     * @param right Right operand (array).
     * @returns Result of operation.
     */
    public static scalarOpMultiArray(op: TBinaryOperationName, left: ComplexType, right: MultiArray): MultiArray {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => Complex[op](left, value as ComplexType)));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Binary operation 'array `operation` scalar'.
     * @param op Binary operation name.
     * @param left Left operand (array).
     * @param right Right operaand (scalar).
     * @returns Result of operation.
     */
    public static MultiArrayOpScalar(op: TBinaryOperationName, left: MultiArray, right: ComplexType): MultiArray {
        const result = new MultiArray(left.dimension);
        result.array = left.array.map((row) => row.map((value) => Complex[op](value as ComplexType, right)));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Unary left operation.
     * @param op Unary operation name.
     * @param right Operand (array)
     * @returns Result of operation.
     */
    public static leftOperation(op: TUnaryOperationLeftName, right: MultiArray): MultiArray {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => Complex[op](value as ComplexType)));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Binary element-wise operatior.
     * @param op Binary operatior.
     * @param left Left operand.
     * @param right Right operand.
     * @returns Binary element-wise result.
     */
    public static elementWiseOperation(op: TBinaryOperationName, left: MultiArray, right: MultiArray): MultiArray {
        let leftDimension = left.dimension.slice();
        let rightDimension = right.dimension.slice();
        if (leftDimension.length < rightDimension.length) {
            leftDimension = leftDimension.concat(new Array(rightDimension.length - leftDimension.length).fill(1));
        }
        if (rightDimension.length < leftDimension.length) {
            rightDimension = rightDimension.concat(new Array(leftDimension.length - rightDimension.length).fill(1));
        }
        if (MultiArray.arrayEquals(leftDimension, rightDimension)) {
            // No broadcasting.
            const result = new MultiArray(leftDimension);
            result.array = left.array.map((row, i) => row.map((value, j) => Complex[op](value as ComplexType, right.array[i][j] as ComplexType)));
            MultiArray.setType(result);
            return result;
        } else {
            // Broadcasting
            const leftBroadcast = new Array(leftDimension.length);
            const rightBroadcast = new Array(rightDimension.length);
            const resultDimension = new Array(leftDimension.length);
            for (let d = 0; d < leftDimension.length; d++) {
                // TODO: check if more than one dimension can broadcast (Check in MATLAB broadcasting rules!). If not this code must be changed.
                if (leftDimension[d] === rightDimension[d]) {
                    leftBroadcast[d] = false;
                    rightBroadcast[d] = false;
                    resultDimension[d] = leftDimension[d];
                } else if (leftDimension[d] === 1) {
                    leftBroadcast[d] = true;
                    rightBroadcast[d] = false;
                    resultDimension[d] = rightDimension[d];
                } else if (rightDimension[d] === 1) {
                    leftBroadcast[d] = false;
                    rightBroadcast[d] = true;
                    resultDimension[d] = leftDimension[d];
                } else {
                    throw new EvalError(`operator ${op}: nonconformant arguments (op1 is ${left.dimension.join('x')}, op2 is ${right.dimension.join('x')}).`);
                }
            }
            const result = new MultiArray(resultDimension);
            const resultLinearLength = MultiArray.subscriptToLinearIndex(resultDimension, resultDimension) + 1;
            for (let n = 0; n < resultLinearLength; n++) {
                const resultSubscript = MultiArray.linearIndexToSubscript(resultDimension, n);
                const leftSubscript = resultSubscript.map((s, i) => (leftBroadcast[i] ? 1 : s));
                const leftLinear = MultiArray.subscriptToLinearIndex(leftDimension, leftSubscript);
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(leftDimension[0], leftDimension[1], leftLinear);
                const rightSubscript = resultSubscript.map((s, i) => (rightBroadcast[i] ? 1 : s));
                const rightLinear = MultiArray.subscriptToLinearIndex(rightDimension, rightSubscript);
                const [k, l] = MultiArray.linearIndexToMultiArrayRowColumn(rightDimension[0], rightDimension[1], rightLinear);
                const [o, p] = MultiArray.linearIndexToMultiArrayRowColumn(resultDimension[0], resultDimension[1], n);
                result.array[o][p] = Complex[op](left.array[i][j] as ComplexType, right.array[k][l] as ComplexType);
            }
            MultiArray.setType(result);
            return result;
        }
    }

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results.
     * @param M MultiArray.
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static rawMap(M: MultiArray, callback: Function): MultiArray {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row) => row.map(callback as any));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results. Pass indices
     * to callback function. The index parameter is the array linear index
     * of element parameter.
     * @param M MultiArray
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static rawMapRowColumn(M: MultiArray, callback: (element: ElementType, i: number, j: number) => ElementType): MultiArray {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row, i) => row.map((element, j) => callback(element, i, j)));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Calls a defined callback function on each element of an MultiArray,
     * and returns an MultiArray that contains the results. Pass indices
     * to callback function. The index parameter is the array linear index
     * of element parameter.
     * @param M MultiArray.
     * @param callback Callback function.
     * @returns A new MultiArray with each element being the result of the callback function.
     */
    public static rawMapLinearIndex(M: MultiArray, callback: (element: ElementType, index: number, i?: number, j?: number) => ElementType): MultiArray {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row, i) =>
            row.map((element, j) => callback(element, Math.floor(i / M.dimension[0]) * M.dimension[0] * M.dimension[1] + j * M.dimension[0] + (i % M.dimension[0]), i, j)),
        );
        MultiArray.setType(result);
        return result;
    }

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
    public static alongDimensionMap(dimension: number, M: MultiArray, callback: (element: ElementType, d: number, i: number, j: number) => ElementType): MultiArray {
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
                    result.array[i][j] = callback(M.array[i][j], subscriptM[dimension] - 1, i, j);
                }
            }
        }
        MultiArray.setType(result);
        return result;
    }

    /**
     * Reduce one dimension of MultiArray putting entire dimension in one
     * element of resulting MultiArray as an Array. The resulting MultiArray
     * cannot be unparsed or used as argument of any other method of
     * MultiArray class.
     * @param dimension Dimension to reduce to Array
     * @param M MultiArray to be reduced.
     * @returns MultiArray reduced.
     */
    public static reduceToArray(dimension: number, M: MultiArray): MultiArray {
        // TODO: check if subscriptC inside for can be removed and if forS can be inverted like in mapAlongDimension.
        if (dimension >= M.dimension.length) {
            // TODO: check if it is consistent
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
    }

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
    public static reduce(dimension: number, M: MultiArray, callback: (previous: ElementType, current: ElementType, index?: number) => ElementType, initial?: ElementType): ElementType {
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
    }

    /**
     * Return the concatenation of N-D array objects, ARRAY1, ARRAY2, ...,
     * ARRAYN along `dimension` parameter (zero-based).
     * @param dimension Dimension of concatenation.
     * @param fname Function name (for error messages).
     * @param ARRAY Arrays to concatenate.
     * @returns Concatenated arrays along `dimension` parameter.
     */
    public static concatenate(dimension: number, fname: string, ...ARRAY: MultiArray[]): MultiArray {
        // Get all ARRAY dimension and set 0 at dimension[dimension]
        const catDims: number[] = [];
        const dims = ARRAY.map((array) => {
            const dim = array.dimension.slice();
            MultiArray.appendSingletonTail(dim, dimension + 1);
            catDims.push(dim[dimension]);
            dim[dimension] = 0;
            return dim;
        });
        // Check if all ARRAY dimensions are equals except for dimension parameter.
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
    }

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
    public static evaluate(M: MultiArray, evaluator?: Evaluator | null | undefined, local: boolean = false, fname: string = ''): MultiArray {
        if (MultiArray.isEmpty(M)) {
            return M;
        } else {
            const result = MultiArray.evaluateRecursive(M, evaluator, local, fname);
            result.isCell = M.isCell;
            MultiArray.setType(result);
            return result;
        }
    }

    /**
     * Get selected items from MultiArray by linear indices or subscripts.
     * @param M MultiArray.
     * @param id Identifier.
     * @param indexList Linear index or subscript.
     * @returns MultiArray of selected items.
     */
    public static getElements(M: MultiArray, id: string, field: string[], indexList: (ComplexType | MultiArray)[]): ElementType {
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
    }

    /**
     * Get selected items from MultiArray by logical indexing.
     * @param M MultiArray.
     * @param id Identifier.
     * @param items Logical index.
     * @returns MultiArray of selected items.
     */
    public static getElementsLogical(M: MultiArray, id: string, field: string[], items: MultiArray): ElementType {
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
    }

    /**
     * Set selected items from MultiArray by linear index or subscripts.
     * @param nameTable Name Table.
     * @param id Identifier.
     * @param args Linear indices or subscripts.
     * @param right Value to assign.
     */
    public static setElements(nameTable: NameTable, id: string, field: string[], indexList: (ComplexType | MultiArray)[], right: MultiArray, input?: string, evaluator?: Evaluator): void {
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
    }

    /**
     * Set selected items from MultiArray by logical indexing.
     * @param nameTable Name Table.
     * @param id Identifier.
     * @param arg Logical index.
     * @param right Value to assign.
     */
    public static setElementsLogical(nameTable: NameTable, id: string, field: string[], arg: ComplexType[], right: MultiArray): void {
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
    }
}
export type { ElementType };
export { MultiArray };
export default { MultiArray };
