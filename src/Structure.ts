import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Interpreter } from './Interpreter';

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
    public parent: any;
    /** Field storage keyed by field name. */
    public field: Record<string, ElementType>;
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
    constructor(field: Record<string, ElementType> | string[]) {
        this.field = {};
        if (Array.isArray(field)) {
            let struct = this as Structure;
            for (let i = 0; i < field.length - 1; i++) {
                struct.field[field[i]] = new Structure({});
                struct = struct.field[field[i]] as Structure;
            }
            struct.field[field[field.length - 1]] = MultiArray.emptyArray();
        } else {
            for (const f in field) {
                this.field[f] = field[f]!.copy();
            }
        }
    }

    /**
     * Test whether a value is a structure scalar or non-empty structure array.
     *
     * @param obj Value to test.
     * @returns `true` when the value can be dot-indexed as a structure.
     */
    public static isStructure = (obj: ElementType): boolean =>
        obj instanceof Structure || (obj instanceof MultiArray && !obj.isCell && obj.dimension[0] > 0 && obj.dimension[1] > 0 && obj.array[0][0] instanceof Structure);

    /**
     * Assign a nested field path, replacing intermediate values with
     * structures.
     *
     * @param S Structure to mutate.
     * @param field Field path to assign.
     * @param value Value to store, or an empty array when omitted.
     */
    public static setField = (S: Structure, field: string[], value?: ElementType): void => {
        // TODO: check if struct.field[field[i]] exists, if it is a MultiArray of Structure...
        let struct = S;
        for (let i = 0; i < field.length - 1; i++) {
            struct.field[field[i]] = new Structure({});
            struct = struct.field[field[i]] as Structure;
        }
        struct.field[field[field.length - 1]] = value ?? MultiArray.emptyArray();
    };

    /**
     * Assign a nested field path while preserving existing non-structure values.
     *
     * @param S Structure to mutate.
     * @param field Field path to assign.
     * @param value Value to store, or an empty array when omitted.
     * @throws EvalError when an intermediate field cannot be dot-indexed.
     */
    public static setNewField = (S: Structure, field: string[], value?: ElementType): void => {
        let struct = S;
        for (let i = 0; i < field.length - 1; i++) {
            if (!(struct.field[field[i]] instanceof Structure)) {
                if (typeof struct.field[field[i]] === 'undefined' || MultiArray.isEmpty(struct.field[field[i]])) {
                    struct.field[field[i]] = new Structure({});
                } else {
                    throw new EvalError(Structure.invalidReferenceMessage);
                }
            }
            struct = struct.field[field[i]] as Structure;
        }
        struct.field[field[field.length - 1]] = value ?? MultiArray.emptyArray();
    };

    /**
     * Read a nested field path from a structure scalar.
     *
     * @param obj Value to read from.
     * @param field Field path to resolve.
     * @returns Field value.
     * @throws EvalError when the target or path cannot be dot-indexed.
     */
    public static getField = (obj: ElementType, field: string[]): ElementType => {
        if (obj instanceof Structure) {
            let struct = obj;
            let i;
            for (i = 0; i < field.length - 1; i++) {
                if (struct instanceof Structure && typeof struct.field[field[i]] !== 'undefined') {
                    struct = struct.field[field[i]] as Structure;
                } else {
                    break;
                }
            }
            if (i === field.length - 1 && struct instanceof Structure && typeof struct.field[field[field.length - 1]] !== 'undefined') {
                return struct.field[field[field.length - 1]];
            } else {
                throw new EvalError(Structure.invalidReferenceMessage);
            }
        } else {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
    };

    /**
     * Read a nested field path from a structure scalar or structure array.
     *
     * @param obj Structure scalar or structure array.
     * @param field Field path to resolve.
     * @returns Field values in linear order.
     */
    public static getFields = (obj: ElementType, field: string[]): ElementType[] => {
        return obj instanceof MultiArray && obj.array.length > 0 && obj.array[0].length > 0 && obj.array[0][0] instanceof Structure
            ? MultiArray.linearize(obj).map((S) => Structure.getField(S, field))
            : [Structure.getField(obj, field)];
    };

    /**
     * Render a structure as source-like text.
     *
     * @param S Structure to render.
     * @param interpreter Interpreter that owns the unparser.
     * @param parentPrecedence Parent operator precedence, unused.
     * @returns Source-like structure representation.
     */
    public static unparse = (S: Structure, interpreter: Interpreter, parentPrecedence = 0): string => {
        return `struct {\n${Object.entries(S.field)
            .map((entry) => `${entry[0]}: ${interpreter.Unparse(entry[1])}`)
            .join('\n')}\n}`;
    };

    /**
     * Render a structure as MathML.
     *
     * @param S Structure to render.
     * @param interpreter Interpreter that owns the MathML unparser.
     * @param parentPrecedence Parent operator precedence, unused.
     * @returns MathML table fragment.
     */
    public static unparseMathML = (S: Structure, interpreter: Interpreter, parentPrecedence = 0): string => {
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
        for (const f in S.field) {
            result.field[f] = S.field[f]!.copy();
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
        if (M.array[0][0] instanceof Structure) {
            if (!(M.isCell || field in M.array[0][0].field)) {
                for (let i = 0; i < M.array.length; i++) {
                    for (let j = 0; j < M.dimension[1]; j++) {
                        (M.array[i][j] as Structure).field[field] = MultiArray.emptyArray();
                    }
                }
            }
        } else {
            throw new EvalError(Structure.invalidReferenceMessage);
        }
    };
}

export { Structure };
export default { Structure };
