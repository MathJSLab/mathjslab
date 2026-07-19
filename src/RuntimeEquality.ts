type RuntimeElement = unknown;
type ComplexLike = { re: unknown; im: unknown };
type CharStringLike = { str: string };
type ArrayLikeValue = { dimension: number[]; array: RuntimeElement[][]; isCell: boolean };
type StructureLike = { field: Record<string, RuntimeElement> };
type FunctionHandleLike = { type: 5; id?: string };
type ClassDefinitionLike = { isHandleClass(): boolean };
type ClassInstanceLike = { type: 7; classDefinition: ClassDefinitionLike; properties: Record<string, RuntimeElement> };
type ClassEnumerationValueLike = { type: 10; classDefinition: ClassDefinitionLike; enumeration: { name: string }; args: RuntimeElement[] };

/**
 * MATLAB/Octave-like runtime equality helpers.
 *
 * This module owns the value comparison contract used by `isequal` and by
 * runtime features, such as `AbortSet`, that need the same user-visible
 * equality semantics without depending on the built-in function registry.
 */
abstract class RuntimeEquality {
    private static readonly isObject = (value: RuntimeElement): value is Record<string, unknown> => !!value && typeof value === 'object';

    private static readonly isComplexLike = (value: RuntimeElement): value is ComplexLike =>
        RuntimeEquality.isObject(value) && Object.prototype.hasOwnProperty.call(value, 're') && Object.prototype.hasOwnProperty.call(value, 'im');

    private static readonly isCharStringLike = (value: RuntimeElement): value is CharStringLike => RuntimeEquality.isObject(value) && typeof value.str === 'string';

    private static readonly isArrayLike = (value: RuntimeElement): value is ArrayLikeValue =>
        RuntimeEquality.isObject(value) && Array.isArray(value.dimension) && Array.isArray(value.array) && typeof value.isCell === 'boolean';

    private static readonly isStructureLike = (value: RuntimeElement): value is StructureLike => RuntimeEquality.isObject(value) && RuntimeEquality.isObject(value.field);

    private static readonly isFunctionHandleLike = (value: RuntimeElement): value is FunctionHandleLike => RuntimeEquality.isObject(value) && value.type === 5;

    private static readonly isClassInstanceLike = (value: RuntimeElement): value is ClassInstanceLike =>
        RuntimeEquality.isObject(value) && value.type === 7 && RuntimeEquality.isObject(value.classDefinition) && RuntimeEquality.isObject(value.properties);

    private static readonly isClassEnumerationValueLike = (value: RuntimeElement): value is ClassEnumerationValueLike =>
        RuntimeEquality.isObject(value) &&
        value.type === 10 &&
        RuntimeEquality.isObject(value.classDefinition) &&
        RuntimeEquality.isObject(value.enumeration) &&
        typeof value.enumeration.name === 'string' &&
        Array.isArray(value.args);

    private static readonly scalarPartEqual = (left: unknown, right: unknown): boolean => {
        if (left === right) {
            return true;
        }
        const leftValue = RuntimeEquality.partToString(left);
        const rightValue = RuntimeEquality.partToString(right);
        return typeof leftValue !== 'undefined' && leftValue === rightValue;
    };

    private static readonly partToString = (value: unknown): string | undefined => {
        if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean' || typeof value === 'string') {
            return String(value);
        }
        if (RuntimeEquality.isObject(value) && typeof value.toString === 'function') {
            return value.toString();
        }
        return undefined;
    };

    /**
     * Compare two runtime values using `isequal`-style semantics.
     *
     * @param left Left value.
     * @param right Right value.
     * @returns `true` when both values should be considered equal.
     */
    public static readonly valuesEqual = (left: RuntimeElement, right: RuntimeElement): boolean => {
        if (left === right) {
            return true;
        }
        if (left === null || right === null || typeof left === 'undefined' || typeof right === 'undefined') {
            return left === right;
        }
        if (RuntimeEquality.isComplexLike(left) && RuntimeEquality.isComplexLike(right)) {
            return RuntimeEquality.scalarPartEqual(left.re, right.re) && RuntimeEquality.scalarPartEqual(left.im, right.im);
        }
        if (RuntimeEquality.isCharStringLike(left) && RuntimeEquality.isCharStringLike(right)) {
            return left.str === right.str;
        }
        if (RuntimeEquality.isArrayLike(left) && RuntimeEquality.isArrayLike(right)) {
            return RuntimeEquality.multiArraysEqual(left, right);
        }
        if (RuntimeEquality.isStructureLike(left) && RuntimeEquality.isStructureLike(right)) {
            return RuntimeEquality.structuresEqual(left, right);
        }
        if (RuntimeEquality.isFunctionHandleLike(left) && RuntimeEquality.isFunctionHandleLike(right)) {
            return left.id === right.id && RuntimeEquality.functionHandleString(left) === RuntimeEquality.functionHandleString(right);
        }
        if (RuntimeEquality.isClassInstanceLike(left) && RuntimeEquality.isClassInstanceLike(right)) {
            if (left.classDefinition !== right.classDefinition) {
                return false;
            }
            if (left.classDefinition.isHandleClass() || right.classDefinition.isHandleClass()) {
                return left === right;
            }
            return RuntimeEquality.propertyTablesEqual(left.properties, right.properties);
        }
        if (RuntimeEquality.isClassEnumerationValueLike(left) && RuntimeEquality.isClassEnumerationValueLike(right)) {
            return left.classDefinition === right.classDefinition && left.enumeration.name === right.enumeration.name && RuntimeEquality.elementListsEqual(left.args, right.args);
        }
        return false;
    };

    private static readonly functionHandleString = (value: FunctionHandleLike): string => (value.id ? '@' + value.id : '@anonymous function handle');

    private static readonly multiArraysEqual = (left: ArrayLikeValue, right: ArrayLikeValue): boolean =>
        left.isCell === right.isCell &&
        RuntimeEquality.arrayEquals(left.dimension, right.dimension) &&
        RuntimeEquality.elementListsEqual(RuntimeEquality.linearize(left), RuntimeEquality.linearize(right));

    private static readonly structuresEqual = (left: StructureLike, right: StructureLike): boolean => RuntimeEquality.propertyTablesEqual(left.field, right.field);

    private static readonly propertyTablesEqual = (left: Record<string, RuntimeElement>, right: Record<string, RuntimeElement>): boolean => {
        const leftKeys = Object.keys(left).sort();
        const rightKeys = Object.keys(right).sort();
        return RuntimeEquality.arrayEquals(leftKeys, rightKeys) && leftKeys.every((key) => RuntimeEquality.valuesEqual(left[key], right[key]));
    };

    private static readonly elementListsEqual = (left: RuntimeElement[], right: RuntimeElement[]): boolean =>
        left.length === right.length && left.every((value, index) => RuntimeEquality.valuesEqual(value, right[index]));

    private static readonly arrayEquals = <T>(left: T[], right: T[]): boolean => left.length === right.length && left.every((value, index) => value === right[index]);

    private static readonly linearize = (value: ArrayLikeValue): RuntimeElement[] => {
        const result: RuntimeElement[] = [];
        for (let page = 0; page < value.array.length; page += value.dimension[0]) {
            for (let column = 0; column < value.dimension[1]; column++) {
                result.push(...value.array.slice(page, page + value.dimension[0]).map((row) => row[column]));
            }
        }
        return result;
    };
}

export { RuntimeEquality };
export default RuntimeEquality;
