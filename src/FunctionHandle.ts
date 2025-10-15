import { Complex, ComplexType } from './Complex';
import * as AST from './AST';
import { Evaluator } from './Evaluator';

class FunctionHandle {
    public static readonly FUNCTION_HANDLE = 5;
    public readonly type = FunctionHandle.FUNCTION_HANDLE;
    public parent: any;
    public id: string | null;
    public commat: boolean;
    public parameter: AST.NodeExpr[];
    public expression: AST.NodeExpr;

    /**
     *
     * @param value
     * @returns
     */
    public static isInstanceOf = (value: unknown): boolean => value instanceof FunctionHandle;

    /**
     *
     * @param id
     * @param commat
     * @param parameter
     * @param expression
     */
    constructor(id: string | null = null, commat: boolean = false, parameter: AST.NodeExpr[] | null = null, expression: AST.NodeExpr = null) {
        this.id = id;
        this.commat = commat;
        this.parameter = parameter ?? [];
        this.expression = expression;
    }

    /**
     *
     * @param id
     * @param commat
     * @param parameter
     * @param expression
     * @returns
     */
    public static create = (id: string | null = null, commat: boolean = false, parameter: AST.NodeExpr[] | null = null, expression: AST.NodeExpr = null) =>
        new FunctionHandle(id, commat, parameter, expression);

    /**
     *
     * @param fhandle
     * @param evaluator
     * @param parentPrecedence
     * @returns
     */
    public static unparse = (fhandle: FunctionHandle, evaluator: Evaluator, parentPrecedence = 0): string => {
        if (fhandle.id) {
            return (fhandle.commat ? '@' : '') + fhandle.id;
        } else {
            return '@(' + fhandle.parameter.map((param: AST.NodeExpr) => evaluator.Unparse(param)).join(',') + ') ' + evaluator.Unparse(fhandle.expression);
        }
    };

    /**
     *
     * @param fhandle
     * @param evaluator
     * @param parentPrecedence
     * @returns
     */
    public static unparseMathML = (fhandle: FunctionHandle, evaluator: Evaluator, parentPrecedence = 0): string => {
        if (fhandle.id) {
            return `${fhandle.commat ? '<mo>@</mo><mi>' : ''}${fhandle.id}</mi>`;
        } else {
            return (
                '<mo>@</mo><mo fence="true" stretchy="true">(</mo>' +
                fhandle.parameter.map((param: AST.NodeExpr) => evaluator.unparserMathML(param)).join('<mo>,</mo>') +
                '<mo fence="true" stretchy="true">)</mo><mspace width="0.8em"/>' +
                evaluator.unparserMathML(fhandle.expression)
            );
        }
    };

    /**
     *
     * @param fhandle
     * @returns
     */
    public static copy = (fhandle: FunctionHandle): FunctionHandle => {
        const result = new FunctionHandle(fhandle.id, fhandle.commat, fhandle.parameter, fhandle.expression);
        result.parent = fhandle.parent;
        return result;
    };

    /**
     *
     * @returns
     */
    public copy(): FunctionHandle {
        const result = new FunctionHandle(this.id, this.commat, this.parameter, this.expression);
        result.parent = this.parent;
        return result;
    }

    /**
     *
     * @param fhandle
     * @returns
     */
    public static toLogical = (fhandle: FunctionHandle): ComplexType => Complex.false();

    /**
     *
     * @returns
     */
    public toLogical(): ComplexType {
        return Complex.false();
    }
}

export { FunctionHandle };
export default { FunctionHandle };
