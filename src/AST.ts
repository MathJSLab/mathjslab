import { CharString, StringQuoteCharacter } from './CharString';
import { Complex, ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { type ElementType, MultiArray } from './MultiArray';

/**
 * AST (Abstract Syntax Tree).
 */

/**
 * Operator type.
 */
type OperatorType =
    | '+'
    | '-'
    | '.*'
    | '*'
    | './'
    | '/'
    | '.\\'
    | '\\'
    | '.^'
    | '^'
    | '.**'
    | '**'
    | '<'
    | '<='
    | '=='
    | '>='
    | '>'
    | '!='
    | '~='
    | '&'
    | '|'
    | '&&'
    | '||'
    | '='
    | '+='
    | '-='
    | '*='
    | '/='
    | '\\='
    | '^='
    | '**='
    | '.*='
    | './='
    | '.\\='
    | '.^='
    | '.**='
    | '&='
    | '|='
    | '()'
    | '!'
    | '~'
    | '+_'
    | '-_'
    | '++_'
    | '--_'
    | ".'"
    | "'"
    | '_++'
    | '_--';

/**
 * NodeType
 */
type NodeType = 'IDENT' | 'CMDWLIST' | 'IDX' | 'RANGE' | 'ENDRANGE' | 'LIST' | '.' | ':' | '<~>' | 'RETLIST' | 'FCN' | 'GLOBAL' | 'PERSIST' | 'IF' | OperatorType;

/**
 * Node base.
 */
interface NodeBase {
    type: NodeType | number;
    parent?: any;
    index?: number;
    omitOutput?: boolean;
    omitAnswer?: boolean; // To omit result to be stored in 'ans' variable.
    start?: { line: number; column: number };
    stop?: { line: number; column: number };
}

type NodeInput = NodeExpr | NodeList | NodeDeclaration | NodeIf;

/**
 * Expression node.
 */
type NodeExpr = ElementType | NodeIdentifier | NodeIndexExpr | NodeOperation | NodeRange | NodeIndirectRef | NodeReturnList | any;

/**
 * Reserved node.
 */
interface NodeReserved extends NodeBase {}

/**
 * Literal node.
 */
interface NodeLiteral extends NodeBase {}

/**
 * Name node.
 */
interface NodeIdentifier extends NodeBase {
    type: 'IDENT';
    id: string;
}

/**
 * Command word list node.
 */
interface NodeCmdWList extends NodeBase {
    type: 'CMDWLIST';
    id: string;
    args: CharString[];
}

/**
 * Expression and arguments node.
 */
interface NodeIndexExpr extends NodeBase {
    type: 'IDX';
    expr: NodeExpr;
    args: NodeExpr[];
    delim: '()' | '{}';
}

/**
 * Range node.
 */
interface NodeRange extends NodeBase {
    type: 'RANGE';
    start_: NodeExpr | null;
    stop_: NodeExpr | null;
    stride_: NodeExpr | null;
}

/**
 * Operation node.
 */
type NodeOperation = UnaryOperation | BinaryOperation;

/**
 * Unary operation node.
 */
type UnaryOperation = UnaryOperationL | UnaryOperationR;

/**
 * Right unary operation node.
 */
interface UnaryOperationR extends NodeBase {
    right: NodeExpr;
}

/**
 * Left unary operation node.
 */
interface UnaryOperationL extends NodeBase {
    left: NodeExpr;
}

/**
 * Binary operation.
 */
interface BinaryOperation extends NodeBase {
    left: NodeExpr;
    right: NodeExpr;
}

/**
 * List node
 */
interface NodeList extends NodeBase {
    type: 'LIST';
    list: NodeInput[];
}

interface NodeIndirectRef extends NodeBase {
    type: '.';
    obj: NodeExpr;
    field: (string | NodeExpr)[];
}

type ReturnHandlerResult = { length: number } & Record<string, NodeExpr>;
type ReturnSelector = (evaluated: ReturnHandlerResult, index: number) => NodeExpr;
type ReturnHandler = (length: number) => ReturnHandlerResult;

/**
 * Return list node
 */
interface NodeReturnList extends NodeBase {
    type: 'RETLIST';
    selector: ReturnSelector;
    handler: ReturnHandler;
}

interface NodeFunction extends NodeBase {
    type: 'FCN';
    id: string;
    return: NodeInput[];
    parameter: NodeInput[];
    arguments: NodeInput[];
    statements: NodeInput[];
}

interface NodeArgumentValidation {
    name: NodeIdentifier;
    size: NodeInput[];
    class: NodeIdentifier | null;
    functions: NodeInput[];
    default: NodeExpr; // NodeExpr can be null.
}

interface NodeArguments {
    attribute: NodeIdentifier | null;
    validation: NodeArgumentValidation[];
}

interface NodeDeclaration extends NodeBase {
    type: 'GLOBAL' | 'PERSIST';
    list: NodeExpr[];
}

interface NodeIf extends NodeBase {
    type: 'IF';
    expression: NodeExpr[];
    then: NodeList[];
    else: NodeList | null;
}

interface NodeElseIf {
    expression: NodeExpr;
    then: NodeList;
}

interface NodeElse {
    else: NodeList;
}

/**
 * AST (Abstract Syntax Tree) node factory methods.
 */
abstract class AST {
    /**
     * External node factory methods.
     */
    public static nodeString: (str: string, quote?: StringQuoteCharacter) => CharString;
    public static nodeNumber: (value: string) => ComplexType;
    public static firstRow: (row: ElementType[], iscell?: boolean) => MultiArray;
    public static appendRow: (M: MultiArray, row: ElementType[]) => MultiArray;
    public static emptyArray: (iscell?: boolean | undefined) => MultiArray;

    /**
     * Reload external node factory methods.
     */
    public static readonly reload = (): void => {
        AST.nodeString = CharString.create;
        AST.nodeNumber = Complex.parse;
        AST.firstRow = MultiArray.firstRow;
        AST.appendRow = MultiArray.appendRow;
        AST.emptyArray = MultiArray.emptyArray;
    };

    /**
     * Node types that, by definition, should omit writing to the `ans`
     * variable.
     */
    public static readonly omitAnswerTable: (NodeType | number)[] = [
        '=',
        '+=',
        '-=',
        '*=',
        '/=',
        '\\=',
        '^=',
        '**=',
        '.*=',
        './=',
        '.\\=',
        '.^=',
        '.**=',
        '&=',
        '|=',
        '++_',
        '--_',
        '_++',
        '_--',
        'CMDWLIST',
        'IF',
    ];

    /**
     * Tests whether the node should omit writing to the `ans` variable.
     * @param node
     * @returns
     */
    public static readonly omitAnswer = (node: NodeInput): boolean => AST.omitAnswerTable.includes(node.type) || node.omitAnswer;

    /**
     * Create literal node.
     * @param type
     * @returns
     */
    public static readonly nodeLiteral = (type: NodeType): NodeLiteral => ({ type });

    /**
     * Create name node.
     * @param nodeid
     * @returns
     */
    public static readonly nodeIdentifier = (id: string): NodeIdentifier => ({
        type: 'IDENT',
        id: id.replace(/(\r\n|[\n\r])|[\ ]/gm, ''),
    });

    /**
     * Create command word list node.
     * @param nodename
     * @param nodelist
     * @returns
     */
    public static readonly nodeCmdWList = (nodename: NodeIdentifier, nodelist: NodeList): NodeCmdWList => ({
        type: 'CMDWLIST',
        id: nodename.id,
        args: nodelist ? (nodelist.list as CharString[]) : [],
    });

    /**
     * Create expression and arguments node.
     * @param nodeexpr
     * @param nodelist
     * @returns
     */
    public static readonly nodeIndexExpr = (nodeexpr: NodeExpr, nodelist: NodeList | null = null, delimiter: '()' | '{}' = '()'): NodeIndexExpr => ({
        type: 'IDX',
        expr: nodeexpr,
        args: nodelist ? (nodelist.list as NodeExpr[]) : [],
        delim: delimiter,
    });

    /**
     * Create range node.
     * @param start_
     * @param stop_
     * @param stride_
     * @returns NodeRange.
     */
    public static readonly nodeRange = (start_: NodeExpr, stop_: NodeExpr, stride_?: NodeExpr): NodeRange => ({
        type: 'RANGE',
        start_,
        stop_,
        stride_: stride_ ?? null,
    });

    /**
     * Create operator node.
     * @param op
     * @param data1
     * @param data2
     * @returns
     */
    public static readonly nodeOp = (op: OperatorType, data1: NodeExpr, data2?: NodeExpr): NodeOperation => {
        switch (op) {
            case '+':
            case '-':
            case '.*':
            case '*':
            case './':
            case '/':
            case '.\\':
            case '\\':
            case '.^':
            case '^':
            case '.**':
            case '**':
            case '<':
            case '<=':
            case '==':
            case '>=':
            case '>':
            case '!=':
            case '~=':
            case '&':
            case '|':
            case '&&':
            case '||':
                return { type: op, left: data1, right: data2 };
            case '=':
            case '+=':
            case '-=':
            case '*=':
            case '/=':
            case '\\=':
            case '^=':
            case '**=':
            case '.*=':
            case './=':
            case '.\\=':
            case '.^=':
            case '.**=':
            case '&=':
            case '|=':
                return { type: op, left: data1, right: data2 };
            case '()':
            case '!':
            case '~':
            case '+_':
            case '-_':
                return { type: op, right: data1 };
            case '++_':
            case '--_':
                return { type: op, right: data1 };
            case ".'":
            case "'":
                return { type: op, left: data1 };
            case '_++':
            case '_--':
                return { type: op, left: data1 };
            default:
                return { type: `INVALID:${op}` as NodeType } as NodeOperation;
        }
    };

    /**
     * Create first element of list node.
     * @param node First element of list node.
     * @returns A NodeList.
     */
    public static readonly nodeListFirst = (node?: NodeInput): NodeList => {
        if (node) {
            const result = {
                type: 'LIST',
                list: [node],
            };
            node.parent = result;
            return result as NodeList;
        } else {
            return {
                type: 'LIST',
                list: [],
            };
        }
    };

    /**
     * Append node to list node.
     * @param lnode NodeList.
     * @param node Element to append to list.
     * @returns NodeList with element appended.
     */
    public static readonly appendNodeList = (lnode: NodeList, node: NodeInput): NodeList => {
        node!.parent = lnode;
        lnode.list.push(node);
        return lnode;
    };

    /**
     *
     * @param list
     * @returns
     */
    public static readonly nodeList = (list: NodeInput[]): NodeList => ({
        type: 'LIST',
        list,
    });

    /**
     * Create first row of a MultiArray.
     * @param row
     * @returns
     */
    public static readonly nodeFirstRow = (row: NodeList | null = null, iscell?: boolean): MultiArray => (row ? AST.firstRow(row.list as ElementType[], iscell) : AST.emptyArray(iscell));

    /**
     * Append row to MultiArray.
     * @param M
     * @param row
     * @returns
     */
    public static readonly nodeAppendRow = (M: MultiArray, row: NodeList | null = null): MultiArray => (row ? AST.appendRow(M, row.list as ElementType[]) : M);

    /**
     *
     * @param left
     * @param right
     * @returns
     */
    public static readonly nodeIndirectRef = (left: NodeExpr, right: string | NodeExpr): NodeIndirectRef => {
        if (left.type === '.') {
            left.field.push(right);
            return left;
        } else {
            return {
                type: '.',
                obj: left,
                field: [right],
            };
        }
    };

    /**
     * Creates NodeReturnList (multiple assignment)
     * @param selector Left side selector function.
     * @returns Return list node.
     */
    public static readonly nodeReturnList = (selector: ReturnSelector, handler?: ReturnHandler): NodeReturnList => {
        return {
            type: 'RETLIST',
            selector,
            ...(typeof handler === 'undefined' ? { handler: (length: number) => ({ length }) } : typeof handler === 'function' ? { handler } : handler),
        };
    };

    /**
     * Throws error if left hand side length of multiple assignment greater
     * than maximum length (to be used in ReturnSelector functions).
     * @param maxLength Maximum length of return list.
     * @param currentLength Requested length of return list.
     */
    public static readonly throwErrorIfGreaterThanReturnList = (maxLength: number, currentLength: number): void | never => {
        if (currentLength > maxLength) {
            throw new EvalError(`element number ${maxLength + 1} undefined in return list`);
        }
    };

    /**
     * Tests if it is a NodeReturnList and if so reduces it to its first
     * element.
     * @param value A node.
     * @returns Reduced node if `tree` is a NodeReturnList.
     */
    public static readonly reduceToFirstIfReturnList = (tree: NodeInput): NodeInput => {
        if (tree.type === 'RETLIST') {
            const result =
                typeof (tree as NodeReturnList).handler !== 'undefined'
                    ? (tree as NodeReturnList).selector((tree as NodeReturnList).handler(1), 0)
                    : (tree as NodeReturnList).selector({ length: 1 }, 0);
            result.parent = tree.parent;
            return result;
        } else {
            return tree;
        }
    };

    /**
     * Throw invalid call error if (optional) test is true.
     * @param name
     */
    public static readonly throwInvalidCallError = (name: string, test: boolean = true): void => {
        if (test) {
            throw new Error(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
        }
    };

    /**
     *
     * @param id
     * @param parameter_list
     * @param expression
     * @returns
     */
    public static readonly nodeFunctionHandle = (id: NodeIdentifier | null = null, parameter_list: NodeList | null = null, expression: NodeExpr = null): FunctionHandle =>
        new FunctionHandle(id ? id.id : null, true, parameter_list ? parameter_list.list : [], expression);

    /**
     *
     * @param id
     * @param return_list
     * @param parameter_list
     * @param arguments_list
     * @param statements_list
     * @returns
     */
    public static readonly nodeFunction = (id: NodeIdentifier, return_list: NodeList, parameter_list: NodeList, arguments_list: NodeList, statements_list: NodeList): NodeFunction => ({
        type: 'FCN',
        id: id.id,
        return: return_list.list,
        parameter: parameter_list.list,
        arguments: arguments_list.list,
        statements: statements_list.list,
    });

    /**
     *
     * @param name
     * @param size
     * @param cl
     * @param functions
     * @param dflt
     * @returns
     */
    public static readonly nodeArgumentValidation = (
        name: NodeIdentifier,
        size: NodeList,
        cl: NodeIdentifier | null = null,
        functions: NodeList,
        dflt: NodeExpr = null,
    ): NodeArgumentValidation => ({
        name,
        size: size.list,
        class: cl,
        functions: functions.list,
        default: dflt,
    });

    /**
     *
     * @param attribute
     * @param validationList
     * @returns
     */
    public static readonly nodeArguments = (attribute: NodeIdentifier | null, validationList: NodeList): NodeArguments => ({
        attribute,
        validation: validationList.list as unknown as NodeArgumentValidation[],
    });

    /**
     *
     * @param type
     * @returns
     */
    public static readonly nodeDeclarationFirst = (type: 'GLOBAL' | 'PERSIST'): NodeDeclaration => ({
        type,
        list: [],
    });

    /**
     *
     * @param node
     * @param declaration
     * @returns
     */
    public static readonly nodeAppendDeclaration = (node: NodeDeclaration, declaration: NodeExpr): NodeDeclaration => {
        node.list.push(declaration);
        return node;
    };

    /**
     *
     * @param expression
     * @param then
     * @returns
     */
    public static readonly nodeIfBegin = (expression: NodeExpr, then: NodeList): NodeIf => ({
        type: 'IF',
        expression: [expression],
        then: [then],
        else: null,
    });

    /**
     *
     * @param nodeIf
     * @param nodeElse
     * @returns
     */
    public static readonly nodeIfAppendElse = (nodeIf: NodeIf, nodeElse: NodeElse): NodeIf => {
        nodeIf.else = nodeElse.else;
        return nodeIf;
    };

    /**
     *
     * @param nodeIf
     * @param nodeElseIf
     * @returns
     */
    public static readonly nodeIfAppendElseIf = (nodeIf: NodeIf, nodeElseIf: NodeElseIf): NodeIf => {
        nodeIf.expression.push(nodeElseIf.expression);
        nodeIf.then.push(nodeElseIf.then);
        return nodeIf;
    };

    /**
     *
     * @param expression
     * @param then
     * @returns
     */
    public static readonly nodeElseIf = (expression: NodeExpr, then: NodeList): NodeElseIf => ({
        expression,
        then,
    });

    /**
     *
     * @param elseStmt
     * @returns
     */
    public static readonly nodeElse = (elseStmt: NodeList): NodeElse => ({
        else: elseStmt,
    });
}

export type {
    OperatorType,
    NodeBase,
    NodeInput,
    NodeExpr,
    NodeReserved,
    NodeLiteral,
    NodeIdentifier,
    NodeCmdWList,
    NodeIndexExpr,
    NodeRange,
    NodeOperation,
    UnaryOperation,
    UnaryOperationR,
    UnaryOperationL,
    BinaryOperation,
    NodeList,
    NodeIndirectRef,
    ReturnHandlerResult,
    ReturnHandler,
    ReturnSelector,
    NodeReturnList,
    NodeFunction,
    NodeArgumentValidation,
    NodeArguments,
    NodeDeclaration,
    NodeIf,
    NodeElseIf,
    NodeElse,
};
export { AST };
export default { AST };

/**
 * External exports.
 */
export type { SingleQuoteCharacter, DoubleQuoteCharacter, StringQuoteCharacter } from './CharString';
export { singleQuoteCharacter, doubleQuoteCharacter, stringClass, CharString } from './CharString';
export type { Decimal, RealType, NumberObjectType, RealTypeDescriptor, ComplexType } from './Complex';
export { Complex } from './Complex';
export type { ElementType } from './MultiArray';
export { MultiArray } from './MultiArray';
export { Structure } from './Structure';
export { FunctionHandle } from './FunctionHandle';
