import { Complex, ComplexType } from './Complex';
import { type ElementType, MultiArray } from './MultiArray';
import { Evaluator } from './Evaluator';

class Structure {
    public static readonly STRUCTURE = 4;
    public readonly type = Structure.STRUCTURE;
    public parent: any;
    public field: Record<string, ElementType>;
    private static readonly invalidReferenceMessage = 'value cannot be indexed with .';

    public static isInstanceOf = (value: unknown): boolean => value instanceof Structure;

    /**
     * Structure constructor. If an object is passed as parameter then create
     * a Structure with same fields and values of object. If an array of field
     * names as string is passed then create a Structure with this field
     * branch and nested field value set to empty array.
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
     * Return true if obj is a structure or a structure array.
     * @param obj
     * @returns
     */
    public static isStructure = (obj: ElementType): boolean =>
        obj instanceof Structure || (obj instanceof MultiArray && !obj.isCell && obj.dimension[0] > 0 && obj.dimension[1] > 0 && obj.array[0][0] instanceof Structure);

    /**
     *
     * @param S
     * @param field
     * @param value
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
     *
     * @param S
     * @param field
     * @param value
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
     *
     * @param obj
     * @param field
     * @returns
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
     *
     * @param obj
     * @param field
     * @returns
     */
    public static getFields = (obj: ElementType, field: string[]): ElementType[] => {
        return obj instanceof MultiArray && obj.array.length > 0 && obj.array[0].length > 0 && obj.array[0][0] instanceof Structure
            ? MultiArray.linearize(obj).map((S) => Structure.getField(S, field))
            : [Structure.getField(obj, field)];
    };

    /**
     *
     * @param S
     * @param evaluator
     * @returns
     */
    public static unparse = (S: Structure, evaluator: Evaluator, parentPrecedence = 0): string => {
        return `struct {\n${Object.entries(S.field)
            .map((entry) => `${entry[0]}: ${evaluator.Unparse(entry[1])}`)
            .join('\n')}\n}`;
    };

    /**
     *
     * @param S
     * @param evaluator
     * @returns
     */
    public static unparseMathML = (S: Structure, evaluator: Evaluator, parentPrecedence = 0): string => {
        let result = `<mtr><mtd columnspan="2"><mtext>struct {</mtext></mtd></mtr>`;
        result += Object.entries(S.field)
            .map((entry) => `<mtr><mtd><mi>${entry[0]}</mi><mo>:</mo></mtd><mtd>${evaluator.unparserMathML(entry[1])}</mtd></mtr>`)
            .join('');
        result += `<mtr><mtd columnspan="2"><mtext>}</mtext></mtd></mtr>`;
        return `<mtable>${result}</mtable>`;
    };

    /**
     *
     * @param S
     * @returns
     */
    public static copy = (S: Structure): Structure => {
        const result = new Structure({});
        for (const f in S.field) {
            result.field[f] = S.field[f]!.copy();
        }
        return result;
    };

    /**
     *
     * @returns
     */
    public copy(): Structure {
        return Structure.copy(this);
    }

    /**
     *
     * @param S
     * @returns
     */
    public static cloneFields = (S: Structure): Structure => {
        const result = new Structure({});
        Object.keys(S.field).forEach((key) => {
            result.field[key] = MultiArray.emptyArray();
        });
        return result;
    };

    /**
     *
     * @param S
     * @returns
     */
    public static toLogical = (S: Structure): ComplexType => (Object.keys(S.field).length > 0 ? Complex.true() : Complex.false());

    /**
     *
     * @returns
     */
    public toLogical(): ComplexType {
        return Structure.toLogical(this);
    }

    /**
     * Set empty field in all elements of MultiArray if it is not cell array and if field not defined.
     * @param M
     * @param field
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
