import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { Evaluator } from './Evaluator';
import { ElementType, MultiArray } from './MultiArray';

export class Structure {
    public static readonly STRUCTURE = CharString.STRING + 1;
    public readonly type = Structure.STRUCTURE;
    parent: any;
    public field: Record<string, ElementType>;
    private static readonly invalidReferenceMessage = 'value cannot be indexed with .';

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
     *
     * @param S
     * @param field
     * @param value
     */
    public static setField(S: Structure, field: string[], value?: ElementType): void {
        // TODO: check if struct.field[field[i]] exists, if it is a MultiArray of Structure...
        let struct = S;
        for (let i = 0; i < field.length - 1; i++) {
            struct.field[field[i]] = new Structure({});
            struct = struct.field[field[i]] as Structure;
        }
        struct.field[field[field.length - 1]] = value ?? MultiArray.emptyArray();
    }

    /**
     *
     * @param S
     * @param field
     * @param value
     */
    public static setNewField(S: Structure, field: string[], value?: ElementType): void {
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
    }

    /**
     *
     * @param obj
     * @param field
     * @returns
     */
    public static getField(obj: ElementType, field: string[]): ElementType {
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
    }

    public static getFields(obj: ElementType, field: string[]): ElementType[] {
        return obj instanceof MultiArray && obj.array.length > 0 && obj.array[0].length > 0 && obj.array[0][0] instanceof Structure
            ? MultiArray.linearize(obj).map((S) => Structure.getField(S, field))
            : [Structure.getField(obj, field)];
    }

    /**
     *
     * @param S
     * @param evaluator
     * @returns
     */
    public static unparse(S: Structure, evaluator: Evaluator): string {
        return `struct {\n${Object.entries(S.field)
            .map((entry) => `${entry[0]}: ${evaluator.Unparse(entry[1])}`)
            .join('\n')}\n}`;
    }

    /**
     *
     * @param S
     * @param evaluator
     * @returns
     */
    public static unparseMathML(S: Structure, evaluator: Evaluator): string {
        let result = `<mtr><mtd columnspan="2"><mtext>struct {</mtext></mtd></mtr>`;
        result += Object.entries(S.field)
            .map((entry) => `<mtr><mtd><mi>${entry[0]}</mi><mo>:</mo></mtd><mtd>${evaluator.unparserMathML(entry[1])}</mtd></mtr>`)
            .join('');
        result += `<mtr><mtd columnspan="2"><mtext>}</mtext></mtd></mtr>`;
        return `<mtable>${result}</mtable>`;
    }

    /**
     *
     * @param S
     * @returns
     */
    public static copy(S: Structure): Structure {
        const result = new Structure({});
        for (const f in S.field) {
            result.field[f] = S.field[f]!.copy();
        }
        return result;
    }

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
    public static cloneFields(S: Structure): Structure {
        const result = new Structure({});
        Object.keys(S.field).forEach((key) => {
            result.field[key] = MultiArray.emptyArray();
        });
        return result;
    }

    /**
     *
     * @param S
     * @returns
     */
    public static toLogical(S: Structure): ComplexDecimal {
        return Object.keys(S.field).length > 0 ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     *
     * @returns
     */
    public toLogical(): ComplexDecimal {
        return Object.keys(this.field).length > 0 ? ComplexDecimal.true() : ComplexDecimal.false();
    }

    /**
     * Set empty field in all elements of MultiArray if it is not cell array and if field not defined.
     * @param M
     * @param field
     */
    public static setEmptyField(M: MultiArray, field: string): void {
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
    }
}
