import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { Evaluator, TNameTable } from './Evaluator';

/**
 * MultiArray Element type.
 */
export type ElementType = ComplexDecimal | CharString | MultiArray;

/**
 * # MultiArray
 *
 * A multimensional array library.
 */
export class MultiArray {
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
     * @param shape Array<number> of dimensions ([rows, columns, pages, blocks, ...]).
     * @param fill Data to fill MultiArray. The same object will be put in all elements of MultiArray.
     */
    public constructor(shape?: number[], fill?: ElementType) {
        if (shape) {
            this.dimension = shape.slice();
            MultiArray.appendSingletonTail(this.dimension, 2);
            MultiArray.removeSingletonTail(this.dimension);
            this.array = new Array(this.dimensionR.reduce((p, c) => p * c, 1));
            if (fill) {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i] = new Array(this.dimension[1]).fill(fill);
                }
                this.type = fill.type;
            } else {
                for (let i = 0; i < this.array.length; i++) {
                    this.array[i] = new Array(this.dimension[1]).fill({ type: -1 });
                }
                this.type = -1;
                this.isCell = false;
            }
        } else {
            this.dimension = [0, 0];
            this.array = [];
            this.type = -1;
            this.isCell = false;
        }
    }

    /**
     * Check if object is a MultiArray and it is a row vector. To be used
     * only in Evaluator to test multiple assignment. The restrictions
     * imposed by parser can restrict the check only to `obj.dimension[0] === 1`.
     * @param obj Any object.
     * @returns `true` if object is a row vector. false otherwise.
     */
    public static isRowVector(obj: any): boolean {
        return obj instanceof MultiArray && obj.dimension[0] === 1;
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
     * Set type property in place with maximum value of array items type.
     * @param M MultiArray to set type property.
     */
    public static setType(M: MultiArray): void {
        M.type = Math.max(...M.array.map((row) => Math.max(...row.map((value) => value.type))));
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
    public static unparse(M: MultiArray, evaluator: Evaluator): string {
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
    public static unparseMathML(M: MultiArray, evaluator: Evaluator): string {
        const unparseRows = (row: ElementType[]) => `<mtr>${row.map((value) => `<mtd>${evaluator.unparserMathML(value)}</mtd>`).join('')}</mtr>`;
        const buildMrow = (rows: string) => `<mrow><mo>${M.isCell ? '{' : '['}</mo><mtable>${rows}</mtable><mo>${M.isCell ? '}' : ']'}</mo></mrow>`;
        if (M.dimension.reduce((p, c) => p * c, 1) === 0) {
            return `${buildMrow('<mspace width="0.5em"/>')}<mo>(</mo><mn>${M.dimension.join('</mn><mi>&times;</mi><mn>')}</mn><mo>)</mo>`;
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
                result += `<mtr><mtd><msub>${buildMrow(array)}<mrow><mo>(</mo><mo>:</mo><mo>,</mo><mo>:</mo><mo>,</mo>${subscript}<mo>)</mo></mrow></msub></mtd></mtr>`;
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
            result.array = [text.str.split('').map((char) => new ComplexDecimal(char.charCodeAt(0)))];
            result.type = ComplexDecimal.numberClass.real;
            return MultiArray.MultiArrayToScalar(result) as MultiArray;
        } else {
            return MultiArray.emptyArray();
        }
    }

    /**
     * Evaluate array. Calls `evaluator.Evaluator` for each
     * element of page (matrix row-ordered). Performs horizontal or vertical
     * concatenation if the evaluation of element results in an MultiArray.
     * @param array MultiArray page.
     * @param local `local` Evaluator parameter.
     * @param fname `fname` Evaluator parameter.
     * @param parent Parent node of items in page.
     * @returns Evaluated matrix.
     */
    private static evaluatePage(array: ElementType[][], evaluator: Evaluator, local: boolean = false, fname: string = '', iscell: boolean = false, parent: any): ElementType[][] {
        const result: ElementType[][] = [];
        for (let i = 0, k = 0; i < array.length; i++, k++) {
            result.push([]);
            let h = 1;
            for (let j = 0; j < array[i].length; j++) {
                array[i][j].parent = parent;
                const element = evaluator.Evaluator(array[i][j], local, fname);
                if (element instanceof MultiArray && !iscell) {
                    if (j === 0) {
                        h = element.array.length;
                        result.splice(k, 1, element.array[0]);
                        for (let n = 1; n < h; n++) {
                            result.splice(k + n, 0, element.array[n]);
                        }
                    } else {
                        for (let n = 0; n < element.array.length; n++) {
                            result[k + n].push(...element.array[n]);
                        }
                    }
                } else {
                    result[k][j] = element;
                }
            }
            k += h - 1;
            if (i != 0) {
                if (result[i].length != result[0].length) {
                    throw new EvalError(`vertical dimensions mismatch (${k}x${result[0].length} vs 1x${result[i].length}).`);
                }
            }
        }
        return result;
    }

    /**
     * Evaluate MultiArray object. Calls `MultiArray.evaluatePage` method for each page of
     * multidimensional array.
     * @param M MultiArray object.
     * @param local Local context (function evaluation).
     * @param fname Function name (context).
     * @returns Evaluated MultiArray object.
     */
    public static evaluate(M: MultiArray, evaluator: Evaluator, local: boolean = false, fname: string = ''): MultiArray {
        const result: MultiArray = new MultiArray();
        result.isCell = M.isCell;
        for (let p = 0; p < M.array.length; p += M.dimension[0]) {
            const page = MultiArray.evaluatePage(M.array.slice(p, p + M.dimension[0]), evaluator, local, fname, M.isCell, result);
            if (p === 0) {
                result.dimension = [page.length, page[0].length, ...M.dimension.slice(2)];
            } else {
                if (result.dimension[0] !== page.length || result.dimension[1] !== page[0].length) {
                    throw new EvalError(`page dimensions mismatch (${result.dimension[0]}x${result.dimension[1]} vs ${page.length}x${page[0].length}).`);
                }
            }
            for (let i = 0; i < page.length; i++) {
                result.array[p + i] = page[i];
            }
        }
        MultiArray.setType(result);
        return result;
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
     * Convert a scalar value to 1x1 MultiArray.
     * @param value MultiArray or scalar.
     * @returns MultiArray 1x1 if value is scalar.
     */
    public static scalarToMultiArray(value: ElementType): MultiArray {
        if (value instanceof MultiArray) {
            return value;
        } else {
            const result = new MultiArray([1, 1]);
            result.array[0] = [value];
            result.type = value.type;
            return result;
        }
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
     * Copy of MultiArray.
     * @param M MultiArray.
     * @returns Copy of MultiArray.
     */
    public static copy(M: MultiArray): MultiArray {
        const result = new MultiArray(M.dimension);
        result.array = M.array.map((row) => row.map((value) => value.copy()));
        result.type = M.type;
        return result;
    }

    public copy(): MultiArray {
        const result = new MultiArray(this.dimension);
        result.array = this.array.map((row) => row.map((value) => value.copy()));
        result.type = this.type;
        return result;
    }

    /**
     * Convert MultiArray to logical value. It's true if all elements is
     * non-null. Otherwise is false.
     * @param M
     * @returns
     */
    public static toLogical(M: MultiArray): ComplexDecimal {
        for (let i = 0; i < M.array.length; i++) {
            const row = M.array[i];
            for (let j = 0; j < M.dimension[1]; j++) {
                const value = row[j].toLogical();
                if (value.re.eq(0)) {
                    return ComplexDecimal.false();
                }
            }
        }
        return ComplexDecimal.true();
    }

    public toLogical(): ComplexDecimal {
        for (let i = 0; i < this.array.length; i++) {
            const row = this.array[i];
            for (let j = 0; j < this.dimension[1]; j++) {
                const value = row[j].toLogical();
                if (value.re.eq(0)) {
                    return ComplexDecimal.false();
                }
            }
        }
        return ComplexDecimal.true();
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
        const result = new MultiArray(resultDimension, ComplexDecimal.zero());
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
        const result = new MultiArray(dimension);
        MultiArray.rawMapLinearIndex(M, (element, index) => {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
            result.array[i][j] = element;
            return element;
        });
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
    public static expandRange(startNode: ComplexDecimal, stopNode: ComplexDecimal, strideNode?: ComplexDecimal | null): MultiArray {
        const expanded = [];
        const s = strideNode ? strideNode.re.toNumber() : 1;
        for (let n = startNode.re.toNumber(), i = 0; s > 0 ? n <= stopNode.re.toNumber() : n >= stopNode.re.toNumber(); n += s, i++) {
            expanded[i] = new ComplexDecimal(n);
        }
        const result = new MultiArray([1, expanded.length]);
        result.array = [expanded];
        MultiArray.setType(result);
        return result;
    }

    /**
     * Check if subscript is a integer number, convert ComplexDecimal to
     * number.
     * @param k Index as ComplexDecimal.
     * @param input Optional id reference of object.
     * @returns k as number, if real part is integer greater than 1 and imaginary part is 0.
     */
    public static testIndex(k: ComplexDecimal, input?: string): number {
        if (!k.re.isInteger() || k.re.lt(1)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be either integers greater than or equal 1 or logicals.`);
        }
        if (!k.im.eq(0)) {
            throw new RangeError(`${input ? `${input}: ` : ``}subscripts must be real.`);
        }
        return k.re.toNumber();
    }

    /**
     * Check if subscript is a integer number, convert ComplexDecimal to
     * number, then check if it's less than bound.
     * @param k Index as ComplexDecimal.
     * @param bound Maximum acceptable value for the index
     * @param dim Dimensions (to generate error message)
     * @param input Optional string to generate error message.
     * @returns Index as number.
     */
    public static testIndexBound(k: ComplexDecimal, bound: number, dim: number[], input?: string): number {
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
     * @param subscript Subscript ([line, column, page, block, ...]) as a ComplexDecimal[].
     * @param input Input string to generate error messages (the id of array).
     * @returns linear index.
     */
    public static parseSubscript(dimension: number[], subscript: ComplexDecimal[], input?: string, evaluator?: Evaluator): number {
        // Converts ComplexDecimal[] subscript parameter to number[].
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
                `${input ? input : ''}(${left}${!!left ? ',' : ''}${index[indexPosition]}${!!right ? ',' : ''}${right}): out of bound ${bound} (dimensions are ${dimension.join(
                    'x',
                )}).`,
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
    public static scalarOpMultiArray(op: ComplexDecimal.TBinaryOperationName, left: ComplexDecimal, right: MultiArray): MultiArray {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => ComplexDecimal[op](left, value as ComplexDecimal)));
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
    public static MultiArrayOpScalar(op: ComplexDecimal.TBinaryOperationName, left: MultiArray, right: ComplexDecimal): MultiArray {
        const result = new MultiArray(left.dimension);
        result.array = left.array.map((row) => row.map((value) => ComplexDecimal[op](value as ComplexDecimal, right)));
        MultiArray.setType(result);
        return result;
    }

    /**
     * Unary left operation.
     * @param op Unary operation name.
     * @param right Operand (array)
     * @returns Result of operation.
     */
    public static leftOperation(op: ComplexDecimal.TUnaryOperationLeftName, right: MultiArray): MultiArray {
        const result = new MultiArray(right.dimension);
        result.array = right.array.map((row) => row.map((value) => ComplexDecimal[op](value as ComplexDecimal)));
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
    public static elementWiseOperation(op: ComplexDecimal.TBinaryOperationName, left: MultiArray, right: MultiArray): MultiArray {
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
            result.array = left.array.map((row, i) => row.map((value, j) => ComplexDecimal[op](value as ComplexDecimal, right.array[i][j] as ComplexDecimal)));
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
                result.array[o][p] = ComplexDecimal[op](left.array[i][j] as ComplexDecimal, right.array[k][l] as ComplexDecimal);
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
    public static reduce(
        dimension: number,
        M: MultiArray,
        callback: (previous: ElementType, current: ElementType, index?: number) => ElementType,
        initial?: ElementType,
    ): ElementType {
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
     * Get selected items from MultiArray by linear indices or subscripts.
     * @param M MultiArray.
     * @param id Identifier.
     * @param indexList Linear index or subscript.
     * @returns MultiArray of selected items.
     */
    public static getElements(M: MultiArray, id: string, indexList: (ComplexDecimal | MultiArray)[]): ElementType {
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
                const subscriptM = MultiArray.linearIndexToSubscript(argsLength, n).map((s, r) => args[r][s - 1]);
                const linearM = MultiArray.parseSubscript(M.dimension, subscriptM as ComplexDecimal[], id);
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(M.dimension[0], M.dimension[1], linearM);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
                result.array[p][q] = M.array[i][j];
            }
            MultiArray.setType(result);
            return MultiArray.MultiArrayToScalar(result);
        }
    }

    /**
     * Get selected items from MultiArray by logical indexing.
     * @param M MultiArray.
     * @param id Identifier.
     * @param items Logical index.
     * @returns MultiArray of selected items.
     */
    public static getElementsLogical(M: MultiArray, id: string, items: MultiArray): ElementType {
        const result = new MultiArray();
        const linM = MultiArray.linearize(M);
        const test = (MultiArray.linearize(items) as ComplexDecimal[]).map((value: ComplexDecimal) => value.re.toNumber());
        if (test.length > linM.length) {
            const dimM = M.dimension.slice();
            throw new EvalError(`${id}(${test.length}): out of bound ${linM.length} (dimensions are ${dimM.join('x')})`);
        }
        for (let n = 0; n < linM.length; n++) {
            if (test[n]) {
                result.array.push([linM[n]]);
            }
        }
        result.dimension = [result.array.length, 1];
        return MultiArray.MultiArrayToScalar(result);
    }

    /**
     * Set selected items from MultiArray by linear index or subscripts.
     * @param nameTable Name Table.
     * @param id Identifier.
     * @param args Linear indices or subscripts.
     * @param right Value to assign.
     */
    public static setElements(nameTable: TNameTable, id: string, indexList: (ComplexDecimal | MultiArray)[], right: MultiArray, input?: string, evaluator?: Evaluator): void {
        if (indexList.length === 0) {
            throw new RangeError('invalid empty index list.');
        } else {
            const linright = MultiArray.linearize(right);
            const isLinearIndex = indexList.length === 1;
            const args = indexList.map((index) => MultiArray.linearize(index));
            const argsLength = args.map((arg) => arg.length);
            const argsParsed = args.map((arg) =>
                arg.map((i) =>
                    MultiArray.testIndex(
                        i as ComplexDecimal,
                        `${input ? input : ''}${evaluator ? '(' + args.map((arg) => arg.map((i) => evaluator.Unparse(i))).join() + ')' : ''}`,
                    ),
                ),
            );
            const argsMax = argsParsed.map((arg) => Math.max(...arg));
            if (linright.length !== 1 && linright.length !== argsLength.reduce((p, c) => p * c, 1)) {
                throw new RangeError(`=: nonconformant arguments (op1 is ${argsLength.join('x')}, op2 is ${right.dimension.join('x')})`);
            }
            if (typeof nameTable[id] !== 'undefined' && nameTable[id].expr instanceof MultiArray) {
                if (isLinearIndex) {
                    if (argsMax[0] > MultiArray.linearLength(nameTable[id].expr)) {
                        throw new RangeError('Invalid resizing operation or ambiguous assignment to an out-of-bounds array element.');
                    }
                } else {
                    MultiArray.expand(nameTable[id].expr, argsMax);
                }
            } else {
                if (isLinearIndex) {
                    nameTable[id] = {
                        args: [],
                        expr: new MultiArray([1, argsMax[0]], ComplexDecimal.zero()),
                    };
                } else {
                    nameTable[id] = {
                        args: [],
                        expr: new MultiArray(argsMax, ComplexDecimal.zero()),
                    };
                }
            }
            const array: MultiArray = nameTable[id].expr;
            const dimension: number[] = nameTable[id].expr.dimension.slice();
            for (let n = 0; n < argsLength.reduce((p, c) => p * c, 1); n++) {
                const subscript = MultiArray.linearIndexToSubscript(argsLength, n);
                const subscriptArgs: number[] = subscript.map((s, r) =>
                    MultiArray.testIndex(
                        args[r][s - 1] as ComplexDecimal,
                        `${input ? input : ''}${evaluator ? '(' + subscript.map((i) => evaluator.Unparse(new ComplexDecimal(i))).join() + ')' : ''}`,
                    ),
                );
                const indexLinear = MultiArray.subscriptToLinearIndex(dimension, subscriptArgs);
                const [p, q] = MultiArray.linearIndexToMultiArrayRowColumn(dimension[0], dimension[1], indexLinear);
                array.array[p][q] = linright.length === 1 ? linright[0] : linright[n];
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
    public static setElementsLogical(nameTable: TNameTable, id: string, arg: ComplexDecimal[], right: MultiArray): void {
        const linright = MultiArray.linearize(right);
        const test = arg.map((value: ComplexDecimal) => value.re.toNumber());
        const testCount = test.reduce((p, c) => p + c, 0);
        if (testCount !== linright.length) {
            throw new EvalError(`=: nonconformant arguments (op1 is ${testCount}x1, op2 is ${right.dimension[0]}x${right.dimension[1]})`);
        }
        const isDefinedId = typeof nameTable[id] !== 'undefined';
        const isNotFunction = isDefinedId && nameTable[id].args.length === 0;
        const isMultiArray = isNotFunction && nameTable[id].expr instanceof MultiArray;
        if (isMultiArray) {
            for (let j = 0, n = 0, r = 0; j < nameTable[id].expr.dimension[1]; j++) {
                for (let i = 0; i < nameTable[id].expr.dimension[0]; i++, r++) {
                    if (test[r]) {
                        nameTable[id].expr.array[i][j] = linright[n];
                        n++;
                    }
                }
            }
        } else {
            throw new EvalError(`${id}(_): invalid matrix indexing.`);
        }
    }
}
