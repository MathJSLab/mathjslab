import { CharString, StringQuoteCharacter } from './CharString';
import { Complex, ComplexType } from './Complex';
import { Scope } from './Scope';
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
 * Delimiter used by an index expression.
 *
 * Parentheses mean ordinary array/function indexing; braces mean cell-array
 * content indexing.
 */
type IndexingDelimiterType = '()' | '{}';

/**
 * NodeType
 */
type NodeType =
    | 'IDENT'
    | 'CMDWLIST'
    | 'IDX'
    | 'RANGE'
    | 'ENDRANGE'
    | 'LIST'
    | '.'
    | ':'
    | '<~>'
    | 'VOID'
    | 'RETLIST'
    | 'FCNDEF'
    | 'USERFCN'
    | 'BUILTIN'
    | 'ARGVALID'
    | 'ARGS'
    | 'GLOBAL'
    | 'PERSIST'
    | 'RETURN'
    | 'IF'
    | 'ELSEIF'
    | 'ELSE'
    | 'SWITCH'
    | 'CASE'
    | OperatorType;

/**
 * Table of symbolic aliases recognized by the lexer/parser layer.
 */
type AliasNameTable = Record<string, RegExp>;

/**
 * Node base.
 */
interface NodeBase {
    /* Type of node. */
    type: NodeType | number;
    /* Parent node. */
    parent?: any;
    /* Index number in a parent list. */
    index?: number;
    /* To omit output result. */
    omitOutput?: boolean;
    /* To omit result to be stored in 'ans' variable. */
    omitAnswer?: boolean;
    /* Source start position */
    start?: { line: number; column: number };
    /* Source stop position */
    stop?: { line: number; column: number };
}

/**
 * Explicit "no value" node.
 */
interface NodeVoid extends NodeBase {
    type: 'VOID';
}

/**
 * Any AST node that can be used as an executable/evaluable input.
 */
type NodeInput = NodeExpr | NodeList | NodeDeclaration | NodeReturn | NodeIf | NodeSwitch;

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
    exprEvaluated?: NodeExpr;
    args: NodeExpr[];
    delim: IndexingDelimiterType;
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
 * Colon token node used by ranges and indexing.
 */
interface NodeColon extends NodeBase {
    type: ':';
}

/**
 * `end` token node used inside indexing ranges.
 */
interface NodeEndRange extends NodeBase {
    type: 'ENDRANGE';
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
 * Ignored return target (`~`) in a return or assignment list.
 */
interface NodeIgnoredTarget extends NodeBase {
    type: '<~>';
}

/**
 * List node
 */
interface NodeList extends NodeBase {
    type: 'LIST';
    list: NodeInput[];
}

/**
 * Dot-reference node for structures and chained field access.
 */
interface NodeIndirectRef extends NodeBase {
    type: '.';
    obj: NodeExpr;
    field: (string | NodeExpr)[];
}

/**
 * Lazily evaluated return values keyed by result name.
 */
type ReturnHandlerResult = { length: number } & Record<string, NodeExpr>;

/**
 * Select a single output from a realized return handler result.
 */
type ReturnSelector = (evaluated: ReturnHandlerResult, index: number) => NodeExpr;

/**
 * Materialize the outputs requested by a caller.
 */
type ReturnHandler = (length: number) => ReturnHandlerResult;

/**
 * Error callback used by AST helpers that should not depend on Interpreter.
 */
type ThrowError = (message: string) => never;

/**
 * Return list node
 */
interface NodeReturnList extends NodeBase {
    type: 'RETLIST';
    selector: ReturnSelector;
    handler: ReturnHandler;
}

/**
 * Common fields shared by user-defined and built-in functions.
 */
interface NodeFunction extends NodeBase {
    type: 'FCNDEF' | 'BUILTIN';
    id: string;
    mapper: boolean;
    ev: boolean[];
    func: Function;
    definingScope?: Scope;
    attributes?: {
        /**
         * Per-function persistent variable storage.
         *
         * Values are copied into the call scope at function entry and copied
         * back after execution. The table lives on the function node so it
         * survives between calls while the definition remains registered.
         */
        persistent?: Record<string, NodeInput>;

        /**
         * Marks function definitions registered from inside another function.
         *
         * Nested functions share selected parent-scope bindings and are reported
         * as nested by introspection helpers such as `which` and `functions`.
         */
        nested?: boolean;
    };
}

/**
 * AST node for a MATLAB/Octave-like user function definition.
 */
interface NodeFunctionDefinition extends NodeFunction {
    type: 'FCNDEF';

    /**
     * Return variables (IDENT nodes)
     * Example: function [a,b] = f(x)
     */
    return: NodeList;

    /**
     * Formal parameters (IDENT nodes)
     */
    parameter: NodeList;

    /**
     * Argument validation blocks (MATLAB-style).
     *
     * These blocks are validated during definition registration and function
     * calls. They support Input, Output, Repeating, defaults, name-value
     * declarations, size/class declarations, and supported validator functions.
     */
    arguments: NodeList;

    /**
     * Function body statements
     */
    statements: NodeList;
}

/**
 * Declarative arity shape for built-ins.
 *
 * `arity < 0` denotes a variadic signature. The absolute value is the 1-based
 * position where variadic arguments begin, matching the convention used by
 * MATLAB/Octave `nargin`/`nargout` introspection.
 */
interface BuiltInFunctionArity {
    arity: number;
    min?: number;
    max?: number;
}

/**
 * Supported declarative validators for built-in function parameters.
 */
type BuiltInFunctionParameterValidator =
    | 'numeric'
    | 'numericOrLogical'
    | 'text'
    | 'textScalar'
    | 'scalar'
    | 'scalarOrEmpty'
    | 'scalarOrVector'
    | 'empty'
    | 'matrix2d'
    | 'squareMatrix'
    | 'vector'
    | 'twoElement'
    | 'oneOrTwoElement'
    | 'dimension'
    | 'dimensionGreaterThanOne'
    | 'dimensionVector'
    | 'reshapeDimension'
    | 'reshapeDimensionVector'
    | 'nonempty'
    | 'positive'
    | 'nonnegative'
    | 'nonzero'
    | 'zeroOrOne'
    | 'integer'
    | 'finite'
    | 'real';

/**
 * One declarative built-in parameter.
 *
 * The signature validator uses these records to replace ad hoc argument checks
 * inside individual built-ins.
 */
interface BuiltInFunctionParameter {
    name: string;
    classes?: string[];
    validators?: BuiltInFunctionParameterValidator[];
    allowedStrings?: string[];
    identifier?: boolean;
    alternatives?: BuiltInFunctionParameter[];
    variadicGroup?: BuiltInFunctionParameter[];
    allowInfinity?: boolean;
    optional?: boolean;
    variadic?: boolean;
}

/**
 * One input overload for a built-in function.
 */
interface BuiltInFunctionInputSignature extends BuiltInFunctionArity {
    parameters?: BuiltInFunctionParameter[];
}

/**
 * Declarative built-in signature metadata.
 */
interface BuiltInFunctionSignature {
    inputs?: BuiltInFunctionInputSignature | BuiltInFunctionInputSignature[];
    outputs?: BuiltInFunctionArity | BuiltInFunctionArity[];
}

/**
 * Built-in function node registered by the runtime.
 */
interface NodeBuiltInFunction extends NodeFunction {
    type: 'BUILTIN';
    /**
     * Optional declarative call signature used by the shared validator.
     */
    signature?: BuiltInFunctionSignature;
    UnparserMathML?: (tree: NodeInput) => string;
}

/**
 * `builtInFunctionTable` type.
 */
type BuiltInFunctionTable = Record<string, NodeBuiltInFunction>;

/**
 * User-defined function table keyed by function name.
 */
type FunctionTable = Record<string, NodeFunctionDefinition>;

/**
 * One variable binding in a scope name table.
 */
type NameEntry = {
    /**
     * Identifier that blocked evaluation when forward references are enabled.
     */
    undefinedReference?: string;

    /**
     * Bound value, if the entry has been assigned.
     */
    node?: NodeInput;

    /**
     * Marks shared entries created by `global`.
     */
    global?: boolean;
};

/**
 * Variable binding table keyed by identifier.
 */
type NameTable = Record<string, NameEntry>;

/**
 * Forward-reference dependency table keyed by identifier.
 */
type UndefinedReferenceTable = Record<string, string[]>;

/**
 * `commandWordListFunction` type.
 */
type CommandWordListFunction = (...args: string[]) => any;

/**
 * `commandWordListTable` entry type.
 */
type CommandWordListEntry = {
    func: CommandWordListFunction;
};

/**
 * `commandWordListTable` type.
 */
type CommandWordListTable = Record<string, CommandWordListEntry>;

/**
 * One declaration inside an `arguments` block.
 */
interface NodeArgumentValidation extends NodeBase {
    type: 'ARGVALID';
    /**
     * Identifier or name-value target such as `opts.Name`.
     */
    name: NodeExpr;
    /**
     * Literal/symbolic size declaration.
     */
    size: NodeInput[];
    /**
     * Class declaration. May be a single identifier or a list.
     */
    class: NodeInput | null;
    /**
     * Validator function declarations.
     */
    functions: NodeInput[];
    /**
     * Default expression, when declared for an input argument.
     */
    default: NodeExpr;
}

/**
 * `arguments` block node.
 */
interface NodeArguments extends NodeBase {
    type: 'ARGS';
    attribute: NodeIdentifier | null;
    validation: NodeArgumentValidation[];
}

/**
 * Declaration node for `global` and `persistent`.
 */
interface NodeDeclaration extends NodeBase {
    type: 'GLOBAL' | 'PERSIST';
    list: NodeExpr[];
}

/**
 * `return` statement node.
 */
interface NodeReturn extends NodeBase {
    type: 'RETURN';
}

/**
 * `if` statement node.
 */
interface NodeIf extends NodeBase {
    type: 'IF';
    expression: NodeExpr[];
    then: NodeList[];
    else: NodeList | null;
}

/**
 * `elseif` clause node.
 */
interface NodeElseIf extends NodeBase {
    type: 'ELSEIF';
    expression: NodeExpr;
    then: NodeList;
}

/**
 * `else` clause node.
 */
interface NodeElse extends NodeBase {
    type: 'ELSE';
    else: NodeList;
}

/**
 * `case` clause node.
 */
interface NodeSwitchCase extends NodeBase {
    type: 'CASE';
    expression: NodeExpr;
    then: NodeList;
}

/**
 * `switch` statement node.
 */
interface NodeSwitch extends NodeBase {
    type: 'SWITCH';
    expression: NodeExpr;
    cases: NodeSwitchCase[];
    otherwise: NodeList | null;
}

/**
 * AST (Abstract Syntax Tree) node factory methods.
 */
abstract class AST {
    /**
     * External node factory methods.
     */
    public static nodeString: (str: string, quote?: StringQuoteCharacter) => CharString;
    /**
     * External number factory, rebound by `reload`.
     */
    public static nodeNumber: (value: string) => ComplexType;
    /**
     * External first-row matrix factory, rebound by `reload`.
     */
    public static firstRow: (row: ElementType[], iscell?: boolean) => MultiArray;
    /**
     * External row-append matrix factory, rebound by `reload`.
     */
    public static appendRow: (M: MultiArray, row: ElementType[]) => MultiArray;
    /**
     * External empty-array factory, rebound by `reload`.
     */
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
     * It makes a shallow copy of the node.
     * @param node AST node to copy.
     * @returns Shallow copy of `node`.
     */
    public static readonly nodeCopy = <T = object>(node: T): T => Object.assign({}, node);

    /**
     * Create an explicit no-value node.
     */
    public static readonly nodeVoid = (): NodeVoid => ({
        type: 'VOID',
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create name node.
     * @param nodeid
     * @returns
     */
    public static readonly nodeIdentifier = (id: string): NodeIdentifier => ({
        type: 'IDENT',
        id: id.replace(/(\r\n|[\n\r])|[\ ]/gm, ''),
        omitAnswer: false,
        omitOutput: false,
    });

    /**
     * Create command word list node.
     * @param nodename
     * @param nodelist
     * @returns
     */
    public static readonly nodeCmdWList = (nodename: NodeIdentifier, nodelist: NodeList): NodeCmdWList => {
        const result: NodeCmdWList = {
            type: 'CMDWLIST',
            id: nodename.id,
            args: nodelist ? (nodelist.list as CharString[]) : [],
        };
        nodename.parent = result;
        result.args.forEach((node) => {
            node.parent = result;
        });
        result.omitAnswer = true;
        result.omitOutput = false;
        return result;
    };

    /**
     * Create expression and arguments node.
     * @param nodeexpr
     * @param nodelist
     * @returns
     */
    public static readonly nodeIndexExpr = (nodeexpr: NodeExpr, nodelist: NodeList | null = null, delimiter: IndexingDelimiterType = '()'): NodeIndexExpr => {
        const result: NodeIndexExpr = {
            type: 'IDX',
            expr: nodeexpr,
            args: nodelist ? (nodelist.list as NodeExpr[]) : [],
            delim: delimiter,
            omitAnswer: false,
            omitOutput: false,
        };
        result.expr.parent = result;
        result.args.forEach((node) => {
            node.parent = result;
        });
        return result;
    };

    /**
     * Create range node.
     * @param start_
     * @param stop_
     * @param stride_
     * @returns NodeRange.
     */
    public static readonly nodeRange = (start_: NodeExpr, stop_: NodeExpr, stride_?: NodeExpr): NodeRange => {
        const result: NodeRange = {
            type: 'RANGE',
            start_,
            stop_,
            stride_: stride_ ?? null,
            omitAnswer: false,
            omitOutput: false,
        };
        result.start_.parent = result;
        result.stop_.parent = result;
        if (stride_) {
            result.stride_.parent = result;
        }
        return result;
    };

    /**
     * Create a colon token node.
     */
    public static readonly nodeColon = (): NodeColon => ({
        type: ':',
        omitAnswer: false,
        omitOutput: false,
    });

    /**
     * Create an `end` token node for indexing ranges.
     */
    public static readonly nodeEndRange = (): NodeEndRange => ({
        type: 'ENDRANGE',
        omitAnswer: false,
        omitOutput: false,
    });

    /**
     * Node types that, by definition, should omit writing to the `ans`
     * variable.
     */
    private static readonly omitAnswerNodeOperation: (NodeType | number)[] = [
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
    ];

    /**
     * Create operator node.
     * @param op
     * @param data1
     * @param data2
     * @returns
     */
    public static readonly nodeOperation = (op: OperatorType, data1: NodeExpr, data2?: NodeExpr): NodeOperation => {
        let result: NodeOperation;
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
                result = { type: op, left: data1, right: data2 };
                result.left.parent = result;
                result.right.parent = result;
                break;
            case '()':
            case '!':
            case '~':
            case '+_':
            case '-_':
            case '++_':
            case '--_':
                result = { type: op, right: data1 };
                result.right.parent = result;
                break;
            case ".'":
            case "'":
            case '_++':
            case '_--':
                result = { type: op, left: data1 };
                result.left.parent = result;
                break;
            default:
                result = { type: `INVALID:${op}` as NodeType } as NodeOperation;
                break;
        }
        result.omitAnswer = AST.omitAnswerNodeOperation.includes(result.type);
        result.omitOutput = false;
        return result;
    };

    /**
     * Create an ignored return/assignment target node.
     */
    public static readonly nodeIgnoredTarget = (): NodeIgnoredTarget => ({
        type: '<~>',
        omitAnswer: true,
        omitOutput: false,
    });

    /**
     * Create first element of list node.
     * @param node First element of list node.
     * @returns A NodeList.
     */
    public static readonly nodeListFirst = (node?: NodeInput): NodeList => {
        const result: NodeList = {
            type: 'LIST',
            list: node ? [node] : [],
            omitAnswer: false,
            omitOutput: false,
        };
        if (node) {
            result.list[0].parent = result;
        }
        return result;
    };

    /**
     * Append node to list node.
     * @param lnode NodeList.
     * @param node Element to append to list.
     * @returns NodeList with element appended.
     */
    public static readonly appendNodeList = (lnode: NodeList, node: NodeInput): NodeList => {
        node.parent = lnode;
        lnode.list.push(node);
        return lnode;
    };

    /**
     *
     * @param list
     * @returns
     */
    public static readonly nodeList = (list: NodeInput[]): NodeList => {
        const result: NodeList = {
            type: 'LIST',
            list,
            omitAnswer: false,
            omitOutput: false,
        };
        result.list.forEach((node) => (node.parent = result));
        return result;
    };

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
                omitAnswer: false,
                omitOutput: false,
            };
        }
    };

    /**
     * Creates NodeReturnList (multiple assignment)
     * @param selector Left side selector function.
     * @param handler A handler that returns an object containing the length
     * of the multiple assignment and the values evaluated by the function in
     * a single execution. The `selector` function uses these values.
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
     * Ensures that the node is of type `NodeReturnList`.
     * @param node A `NodeExpr`
     * @returns `node` as NodeReturnList
     */
    public static readonly ensureReturnList = (node: NodeExpr): NodeReturnList => {
        if (node.type === 'RETLIST') {
            return node as NodeReturnList;
        }
        const result = node;
        return AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number): NodeExpr | never => {
            if (index === 0) {
                return result;
            } else {
                AST.throwErrorIfGreaterThanReturnList(evaluated.length, index);
            }
        });
    };

    /**
     * Throws error if left hand side length of multiple assignment greater
     * than maximum length (to be used in ReturnSelector functions).
     * @param maxLength Maximum length of return list.
     * @param currentLength Requested length of return list.
     */
    public static readonly throwErrorIfGreaterThanReturnList = (maxLength: number, currentLength: number, throwError?: ThrowError): void | never => {
        if (currentLength > maxLength) {
            const message = `element number ${maxLength + 1} undefined in return list`;
            if (throwError) {
                throwError(message);
            }
            throw new EvalError(message);
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
    public static readonly throwInvalidCallError = (name: string, test: boolean = true, throwError?: ThrowError): void | never => {
        if (test) {
            const message = `Invalid call to ${name}. Type 'help ${name}' to see correct usage.`;
            if (throwError) {
                throwError(message);
            }
            throw new SyntaxError(message);
        }
    };

    /**
     *
     * @param id
     * @param parameter_list
     * @param expression
     * @returns
     */
    public static readonly nodeFunctionHandle = (id: NodeIdentifier | null = null, parameter_list: NodeList | null = null, expression: NodeExpr = null): FunctionHandle => {
        const result = FunctionHandle.create(id ? id.id : undefined, parameter_list ? parameter_list.list : [], expression);
        result.parameter.forEach((node) => {
            node.parent = result;
        });
        if (result.expression) {
            result.expression.parent = result;
        }
        return result;
    };

    /**
     *
     * @param id
     * @param return_list
     * @param parameter_list
     * @param arguments_list
     * @param statements_list
     * @returns
     */
    public static readonly nodeFunctionDefinition = (
        id: NodeIdentifier,
        return_list: NodeList,
        parameter_list: NodeList,
        arguments_list: NodeList,
        statements_list: NodeList,
    ): NodeFunctionDefinition => {
        const result = {
            type: 'FCNDEF',
            id: id.id,
            mapper: parameter_list.list.length === 1 && return_list.list.length === 1,
            ev: new Array(parameter_list.list.length).fill(true),
            func: null as unknown as Function,
            return: return_list,
            parameter: parameter_list,
            arguments: arguments_list,
            statements: statements_list,
            omitAnswer: true,
            omitOutput: true,
        } as NodeFunctionDefinition;
        result.return.list.forEach((node) => (node.parent = result));
        result.parameter.list.forEach((node) => (node.parent = result));
        result.arguments.list.forEach((node) => (node.parent = result));
        result.statements.list.forEach((node) => (node.parent = result));
        return result;
    };

    /**
     * Create one `arguments` block declaration.
     *
     * @param name Identifier or name-value field target.
     * @param size Size declaration list.
     * @param cl Class declaration node.
     * @param functions Validator function list.
     * @param dflt Default expression.
     * @returns Argument validation node.
     */
    public static readonly nodeArgumentValidation = (name: NodeExpr, size: NodeList, cl: NodeInput | null = null, functions: NodeList, dflt: NodeExpr = null): NodeArgumentValidation => ({
        type: 'ARGVALID',
        name,
        size: size.list,
        class: cl,
        functions: functions.list,
        default: dflt,
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create an `arguments` block.
     *
     * @param attribute Optional block attribute (`Input`, `Output`, `Repeating`).
     * @param validationList Declaration list.
     * @returns Arguments block node.
     */
    public static readonly nodeArguments = (attribute: NodeIdentifier | null, validationList: NodeList): NodeArguments => ({
        type: 'ARGS',
        attribute,
        validation: validationList.list as unknown as NodeArgumentValidation[],
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create the first node for a `global` or `persistent` declaration list.
     */
    public static readonly nodeDeclarationFirst = (type: 'GLOBAL' | 'PERSIST'): NodeDeclaration => ({
        type,
        list: [],
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create a `return` statement node.
     */
    public static readonly nodeReturn = (): NodeReturn => ({
        type: 'RETURN',
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Normalize declaration list entries.
     *
     * Older generated parser code may append the parser context instead of
     * the AST node itself; in that case the actual node is stored in `.node`.
     *
     * @param declaration Declaration list entry.
     * @returns AST node for the declaration entry.
     */
    public static readonly getDeclarationNode = (declaration: NodeExpr | { node: NodeExpr }): NodeExpr => ('node' in declaration ? declaration.node : declaration);

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
    public static readonly nodeIfBegin = (expression: NodeExpr, then: NodeList): NodeIf => {
        const result = {
            type: 'IF',
            expression: [expression],
            then: [then],
            else: null,
            omitAnswer: true,
            omitOutput: true,
        } as NodeIf;
        result.expression[0].parent = result;
        result.then[0].parent = result;
        return result;
    };

    /**
     *
     * @param nodeIf
     * @param nodeElse
     * @returns
     */
    public static readonly nodeIfAppendElse = (nodeIf: NodeIf, nodeElse: NodeElse): NodeIf => {
        nodeIf.else = nodeElse.else;
        nodeIf.else.parent = nodeIf;
        return nodeIf;
    };

    /**
     *
     * @param nodeIf
     * @param nodeElseIf
     * @returns
     */
    public static readonly nodeIfAppendElseIf = (nodeIf: NodeIf, nodeElseIf: NodeElseIf): NodeIf => {
        nodeElseIf.expression.parent = nodeIf;
        nodeIf.expression.push(nodeElseIf.expression);
        nodeElseIf.then.parent = nodeIf;
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
        type: 'ELSEIF',
        expression,
        then,
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     *
     * @param elseStmt
     * @returns
     */
    public static readonly nodeElse = (elseStmt: NodeList): NodeElse => ({
        type: 'ELSE',
        else: elseStmt,
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create a `switch` statement node.
     */
    public static readonly nodeSwitch = (expression: NodeExpr, cases: NodeList, otherwise: NodeList | null = null): NodeSwitch => {
        const result = {
            type: 'SWITCH',
            expression,
            cases: cases.list as unknown as NodeSwitchCase[],
            otherwise,
            omitAnswer: true,
            omitOutput: true,
        } as NodeSwitch;
        result.expression.parent = result;
        result.cases.forEach((node) => (node.parent = result));
        if (result.otherwise) {
            result.otherwise.parent = result;
        }
        return result;
    };

    /**
     * Create a `case` clause node.
     */
    public static readonly nodeSwitchCase = (expression: NodeExpr, then: NodeList): NodeSwitchCase => {
        const result = {
            type: 'CASE',
            expression,
            then,
            omitAnswer: true,
            omitOutput: true,
        } as NodeSwitchCase;
        result.expression.parent = result;
        result.then.parent = result;
        return result;
    };
}

export type {
    OperatorType,
    IndexingDelimiterType,
    NodeType,
    AliasNameTable,
    NodeBase,
    NodeInput,
    NodeExpr,
    NodeReserved,
    NodeLiteral,
    NodeIdentifier,
    NodeCmdWList,
    NodeIndexExpr,
    NodeRange,
    NodeColon,
    NodeEndRange,
    NodeOperation,
    UnaryOperation,
    UnaryOperationR,
    UnaryOperationL,
    BinaryOperation,
    NodeIgnoredTarget,
    NodeList,
    NodeIndirectRef,
    ReturnHandlerResult,
    ReturnHandler,
    ReturnSelector,
    NodeReturnList,
    NodeFunction,
    NodeFunctionDefinition,
    BuiltInFunctionParameterValidator,
    BuiltInFunctionParameter,
    BuiltInFunctionInputSignature,
    BuiltInFunctionSignature,
    NodeBuiltInFunction,
    BuiltInFunctionTable,
    FunctionTable,
    NameEntry,
    NameTable,
    UndefinedReferenceTable,
    CommandWordListFunction,
    CommandWordListEntry,
    CommandWordListTable,
    NodeArgumentValidation,
    NodeArguments,
    NodeDeclaration,
    NodeReturn,
    NodeIf,
    NodeElseIf,
    NodeElse,
    NodeSwitch,
    NodeSwitchCase,
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
