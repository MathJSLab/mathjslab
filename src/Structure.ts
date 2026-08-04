import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import type { RuntimeDisplay } from './RuntimeDisplay';
import { RuntimeValue } from './RuntimeValue';

/** Concrete runtime value that may be stored in a structure field. */
type StructureFieldValue = Exclude<ElementType, null | undefined>;

/**
 * Runtime representation of a MATLAB/Octave structure scalar.
 *
 * Structure arrays are represented as `MultiArray` values whose elements are
 * `Structure` instances. A scalar `Structure` stores fields in a plain object
 * keyed by field name.
 */
class Structure {
    /** Runtime type tag used by interpreter predicates. */
    public static readonly STRUCTURE = 4;
    /** Runtime type tag stored on the structure value. */
    public readonly type = Structure.STRUCTURE;
    /** Optional AST-style parent pointer used by generic value handling. */
    public parent?: unknown;
    /** Field storage keyed by field name. */
    public field: Record<string, StructureFieldValue>;
    /** Shared diagnostic for invalid dot-indexing targets. */
    private static readonly invalidReferenceMessage = 'value cannot be indexed with .';

    /**
     * Test whether an object is a `Structure` instance.
     *
     * @param obj Object to test.
     * @returns `true` when `obj` is a `Structure`.
     */
    public static isInstanceOf = (obj: unknown): obj is Structure => obj instanceof Structure;

    /**
     * Structure constructor. If an object is passed as parameter then create
     * a Structure with same fields and values of object. If an array of field
     * names as string is passed then create a Structure with this field
     * branch and nested field value set to empty array.
     *
     * @param field An object with fields and values or an array of field names.
     */
    constructor(field: Record<string, StructureFieldValue> | string[]) {
        this.field = {};
        if (Array.isArray(field)) {
            let struct: Structure = this;
            for (let i = 0; i < field.length - 1; i++) {
                const nested = new Structure({});
                struct.field[field[i]] = nested;
                struct = nested;
            }
            struct.field[field[field.length - 1]] = MultiArray.emptyArray();
        } else {
            for (const [name, value] of Object.entries(field)) {
                this.field[name] = RuntimeValue.copy(value);
            }
        }
    }

    /**
     * Return the structure elements stored by a scalar or non-empty structure
     * array.
     *
     * @param obj Value to inspect.
     * @returns Structure elements in linear order, or an empty list when the
     * value is not structurally a MATLAB structure array.
     */
    public static structureElements = (obj: ElementType): Structure[] => {
        if (obj instanceof Structure) {
            return [obj];
        }
        if (obj instanceof MultiArray && !obj.isCell) {
            const elements = MultiArray.linearize(obj);
            if (elements.length === 0 || !elements.every(Structure.isInstanceOf)) {
                return [];
            }
            return elements;
        }
        return [];
    };

    /**
     * Test whether a value is a structure scalar or non-empty structure array.
     *
     * @param obj Value to test.
     * @returns `true` when the value can be dot-indexed as a structure.
     */
    public static isStructure = (obj: ElementType): boolean => Structure.structureElements(obj).length > 0;

    /**
     * Return sorted field names for a structure scalar or structure array.
     *
     * MATLAB structure arrays share a field schema. The first element therefore
     * provides the visible field-name list after callers have validated the
     * value as a structure.
     *
     * @param obj Structure scalar or structure array.
     * @returns Sorted field names, or an empty list for non-structures.
     */
    public static fieldNames = (obj: ElementType): string[] => Object.keys(Structure.structureElements(obj)[0]?.field ?? {}).sort();

    /**
     * Test whether every element in a structure scalar/array defines a field.
     *
     * @param obj Structure scalar or structure array.
     * @param field Field name to test.
     * @returns `true` when all structure elements define `field`.
     */
    public static hasField = (obj: ElementType, field: string): boolean => {
        const elements = Structure.structureElements(obj);
        return elements.length > 0 && elements.every((structure) => RuntimeValue.hasOwnField(structure.field, field));
    };

    /**
     * Test whether a value should create a missing intermediate field.
     *
     * @param value Existing field value.
     * @returns `true` for missing or empty-array values.
     */
    private static isMissingOrEmpty = (value: StructureFieldValue | undefined): boolean => typeof value === 'undefined' || MultiArray.isEmpty(value);

    /**
     * Resolve or create an intermediate value that supports further dot access.
     *
     * @param value Existing intermediate field value.
     * @returns Structure scalar or structure array ready for nested assignment.
     * @throws EvalError when the existing value cannot be dot-indexed.
     */
    private static ensureStructureLike = (value: StructureFieldValue | undefined): Structure | MultiArray => {
        if (Structure.isMissingOrEmpty(value)) {
            return new Structure({});
        }
        if (value instanceof Structure) {
            return value;
        }
        if (value instanceof MultiArray && Structure.isStructure(value)) {
            return value;
        }
        throw new EvalError(Structure.invalidReferenceMessage);
    };

    /**
     * Assign a field path inside a structure scalar or every element of a
     * structure array.
     *
     * @param target Structure scalar or structure array to mutate.
     * @param field Field path to assign.
     * @param value Value to store, or an empty array when omitted.
     */
    private static assignFieldPath = (target: Structure | MultiArray, field: string[], value?: StructureFieldValue): void => {
        if (target instanceof MultiArray) {
            const elements = Structure.structureElements(target);
            if (elements.length === 0) {
                throw new EvalError(Structure.invalidReferenceMessage);
            }
            elements.forEach((structure) => Structure.assignFieldPath(structure, field, value));
            return;
        }
        if (field.length === 0) {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
        if (field.length === 1) {
            target.field[field[0]] = value ?? MultiArray.emptyArray();
            return;
        }
        const head = field[0];
        const nested = Structure.ensureStructureLike(target.field[head]);
        target.field[head] = nested;
        Structure.assignFieldPath(nested, field.slice(1), value);
    };

    /**
     * Collect values reached by a nested field path.
     *
     * @param obj Structure scalar or structure array to read from.
     * @param field Field path to resolve.
     * @returns Values reached by the path in linear order.
     * @throws EvalError when any target cannot be dot-indexed.
     */
    private static collectFieldPath = (obj: ElementType, field: string[]): StructureFieldValue[] => {
        if (obj === null || typeof obj === 'undefined') {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
        if (field.length === 0) {
            return [obj];
        }
        if (obj instanceof MultiArray && Structure.isStructure(obj)) {
            return Structure.structureElements(obj).flatMap((structure) => Structure.collectFieldPath(structure, field));
        }
        if (obj instanceof Structure) {
            const value = obj.field[field[0]];
            if (typeof value === 'undefined') {
                throw new EvalError(Structure.invalidReferenceMessage);
            }
            return field.length === 1 ? [value] : Structure.collectFieldPath(value, field.slice(1));
        }
        throw new EvalError(Structure.invalidReferenceMessage);
    };

    /**
     * Assign a nested field path, replacing intermediate values with
     * structures.
     *
     * @param S Structure scalar or structure array to mutate.
     * @param field Field path to assign.
     * @param value Value to store, or an empty array when omitted.
     */
    public static setField = (S: Structure | MultiArray, field: string[], value?: StructureFieldValue): void => {
        Structure.assignFieldPath(S, field, value);
    };

    /**
     * Assign a nested field path while preserving existing non-structure values.
     *
     * @param S Structure scalar or structure array to mutate.
     * @param field Field path to assign.
     * @param value Value to store, or an empty array when omitted.
     * @throws EvalError when an intermediate field cannot be dot-indexed.
     */
    public static setNewField = (S: Structure | MultiArray, field: string[], value?: StructureFieldValue): void => {
        Structure.assignFieldPath(S, field, value);
    };

    /**
     * Read a nested field path from a structure scalar.
     *
     * @param obj Value to read from.
     * @param field Field path to resolve.
     * @returns Field value.
     * @throws EvalError when the target or path cannot be dot-indexed.
     */
    public static getField = (obj: ElementType, field: string[]): StructureFieldValue => {
        const values = Structure.collectFieldPath(obj, field);
        return values.length === 1 ? values[0] : MultiArray.toRowVector(values);
    };

    /**
     * Read a nested field path from a structure scalar or structure array.
     *
     * @param obj Structure scalar or structure array.
     * @param field Field path to resolve.
     * @returns Field values in linear order.
     */
    public static getFields = (obj: ElementType, field: string[]): StructureFieldValue[] => {
        return Structure.collectFieldPath(obj, field);
    };

    /**
     * Return a copy of a structure scalar or structure array without selected
     * fields.
     *
     * @param obj Structure scalar or structure array.
     * @param fields Field names to remove from every structure element.
     * @returns Copied structure value with the requested fields removed.
     * @throws EvalError when `obj` is not a structure.
     */
    public static removeFields = (obj: Structure | MultiArray, fields: string[]): Structure | MultiArray => {
        if (obj instanceof Structure) {
            const result = Structure.copy(obj);
            fields.forEach((field) => {
                delete result.field[field];
            });
            return result;
        }
        const elements = Structure.structureElements(obj);
        if (elements.length === 0) {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
        const result = MultiArray.copy(obj);
        Structure.structureElements(result).forEach((structure) => {
            fields.forEach((field) => {
                delete structure.field[field];
            });
        });
        return result;
    };

    /**
     * Return a copy of a structure scalar or structure array with fields sorted
     * alphabetically.
     *
     * @param obj Structure scalar or structure array.
     * @returns Copied structure value with deterministic top-level field order.
     * @throws EvalError when `obj` is not a structure.
     */
    public static orderFields = (obj: Structure | MultiArray): Structure | MultiArray => {
        const orderScalar = (structure: Structure): Structure => {
            const result = new Structure({});
            for (const name of Object.keys(structure.field).sort()) {
                result.field[name] = RuntimeValue.copy(structure.field[name]);
            }
            return result;
        };
        if (obj instanceof Structure) {
            return orderScalar(obj);
        }
        const elements = Structure.structureElements(obj);
        if (elements.length === 0) {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
        const result = MultiArray.copy(obj);
        const ordered = elements.map(orderScalar);
        for (let index = 0; index < ordered.length; index++) {
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
            result.array[row][column] = ordered[index];
        }
        return result;
    };

    /**
     * Render a structure as source-like text.
     *
     * @param S Structure to render.
     * @param interpreter Interpreter that owns the unparser.
     * @param _parentPrecedence Parent operator precedence, unused.
     * @returns Source-like structure representation.
     */
    public static unparse = (S: Structure, interpreter: RuntimeDisplay, _parentPrecedence = 0): string => {
        return `struct {\n${Object.entries(S.field)
            .map((entry) => `${entry[0]}: ${interpreter.Unparse(entry[1])}`)
            .join('\n')}\n}`;
    };

    /**
     * Render a structure as MathML.
     *
     * @param S Structure to render.
     * @param interpreter Interpreter that owns the MathML unparser.
     * @param _parentPrecedence Parent operator precedence, unused.
     * @returns MathML table fragment.
     */
    public static unparseMathML = (S: Structure, interpreter: RuntimeDisplay, _parentPrecedence = 0): string => {
        let result = `<mtr><mtd columnspan="2"><mtext>struct {</mtext></mtd></mtr>`;
        result += Object.entries(S.field)
            .map((entry) => `<mtr><mtd><mi>${entry[0]}</mi><mo>:</mo></mtd><mtd>${interpreter.UnparserMathML(entry[1])}</mtd></mtr>`)
            .join('');
        result += `<mtr><mtd columnspan="2"><mtext>}</mtext></mtd></mtr>`;
        return `<mtable>${result}</mtable>`;
    };

    /**
     * Deep-copy a structure scalar.
     *
     * @param S Structure to copy.
     * @returns Copied structure with copied field values.
     */
    public static copy = (S: Structure): Structure => {
        const result = new Structure({});
        for (const [name, value] of Object.entries(S.field)) {
            result.field[name] = RuntimeValue.copy(value);
        }
        return result;
    };

    /**
     * Deep-copy this structure scalar.
     *
     * @returns Copied structure.
     */
    public copy(): Structure {
        return Structure.copy(this);
    }

    /**
     * Clone only the field names of a structure, filling every field with an
     * empty array.
     *
     * @param S Structure whose field names should be cloned.
     * @returns Structure with the same field names and empty values.
     */
    public static cloneFields = (S: Structure): Structure => {
        const result = new Structure({});
        Object.keys(S.field).forEach((key) => {
            result.field[key] = MultiArray.emptyArray();
        });
        return result;
    };

    /**
     * Convert a structure to a logical scalar.
     *
     * @param S Structure to convert.
     * @returns `true` when the structure has at least one field.
     */
    public static toLogical = (S: Structure): ComplexType => (Object.keys(S.field).length > 0 ? Complex.true() : Complex.false());

    /**
     * Convert this structure to a logical scalar.
     *
     * @returns `true` when this structure has at least one field.
     */
    public toLogical(): ComplexType {
        return Structure.toLogical(this);
    }

    /**
     * Add an empty field to every element of a structure array when the field
     * does not already exist.
     *
     * @param M Structure array to mutate.
     * @param field Field name to add.
     * @throws EvalError when the array does not contain structures.
     */
    public static setEmptyField = (M: MultiArray, field: string): void => {
        const elements = Structure.structureElements(M);
        if (elements.length === 0) {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
        if (!M.isCell && !Structure.hasField(M, field)) {
            elements.forEach((structure) => {
                structure.field[field] = MultiArray.emptyArray();
            });
        }
    };
}

export { Structure };
export type { StructureFieldValue };
export default { Structure };

RuntimeValue.registerStructureFactory((field) => new Structure(field as Record<string, StructureFieldValue> | string[]));
