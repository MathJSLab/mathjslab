import { CharString, StringQuoteCharacter } from './CharString';
import { Complex, ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { type ElementType, MultiArray } from './MultiArray';

/**
 * Normalized AST and runtime node contracts used by parser, evaluator,
 * unparser, MathML rendering, and diagnostics.
 *
 * Parser actions should create nodes through `AST` factory methods whenever
 * possible. The factories encode parent-pointer conventions, output/answer
 * suppression flags, and MATLAB/Octave-specific structural choices such as
 * return lists, command-form calls, `arguments` blocks, and `classdef` sections.
 */

/**
 * Operators accepted by the normalized expression AST.
 *
 * Suffix/prefix encodings such as `+_`, `_++`, and `.'` disambiguate source
 * syntax that shares a token but has different precedence or operand position.
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
 * Discriminant values for AST nodes and runtime objects that participate in
 * generic interpreter dispatch.
 *
 * Numeric runtime tags are used by value classes such as `Complex`,
 * `MultiArray`, and class infrastructure objects. String tags are reserved for
 * parser-created AST nodes.
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
    | 'IMPORT'
    | 'RETURN'
    | 'BREAK'
    | 'CONTINUE'
    | 'IF'
    | 'ELSEIF'
    | 'ELSE'
    | 'SWITCH'
    | 'CASE'
    | 'WHILE'
    | 'DO_UNTIL'
    | 'FOR'
    | 'SPMD'
    | 'TRY'
    | 'UNWIND_PROTECT'
    | 'CLASSDEF'
    | 'CLASS_SECTION'
    | 'CLASS_PROPERTY'
    | 'CLASS_EVENT'
    | 'CLASS_ENUMERATION'
    | 'CLASS_ATTRIBUTE'
    | 'SUPERCLASS_CTOR'
    | 'METACLASS'
    | OperatorType;

/**
 * Table of symbolic aliases recognized by the lexer/parser layer.
 */
type AliasNameTable = Record<string, RegExp>;
type DefiningScope = unknown;

/**
 * Common metadata carried by all AST nodes.
 *
 * `parent` and `index` are best-effort navigation aids; evaluation logic should
 * not require them for correctness. `omitOutput` models MATLAB/Octave semicolon
 * suppression, while `omitAnswer` prevents helper statements such as
 * declarations and function definitions from updating `ans`.
 */
interface NodeBase {
    /** Node discriminant. */
    type: NodeType | number;
    /** Parent AST node or runtime wrapper, when known. */
    parent?: NodeBase;
    /** Index inside a parent list, when the node belongs to a list. */
    index?: number;
    /** Whether evaluation output should be suppressed. */
    omitOutput?: boolean;
    /** Whether the result should avoid assignment to `ans`. */
    omitAnswer?: boolean;
    /** Source start position, when supplied by the parser. */
    start?: { line: number; column: number };
    /** Source stop position, when supplied by the parser. */
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
type NodeInput =
    | NodeExpr
    | NodeList
    | NodeDeclaration
    | NodeImport
    | NodeReturn
    | NodeBreak
    | NodeContinue
    | NodeIf
    | NodeSwitch
    | NodeWhile
    | NodeDoUntil
    | NodeFor
    | NodeSpmd
    | NodeTry
    | NodeUnwindProtect
    | NodeClassDef
    | NodeClassSection
    | NodeClassProperty
    | NodeClassEvent
    | NodeClassEnumeration
    | NodeClassAttribute;

/**
 * AST node that can appear in expression position.
 *
 * Strict expression shape used by new code that can stay inside the typed AST
 * and runtime-value surface.
 */
type StrictNodeExpr =
    | Exclude<ElementType, null | undefined>
    | NodeVoid
    | NodeIdentifier
    | NodeCmdWList
    | NodeIndexExpr
    | NodeSuperclassConstructor
    | NodeMetaClass
    | NodeRange
    | NodeColon
    | NodeEndRange
    | NodeOperation
    | NodeIgnoredTarget
    | NodeIndirectRef
    | NodeReturnList;

/**
 * Non-expression AST nodes that are stored in `NodeList` while a surrounding
 * builder assembles a larger statement node.
 */
type NodeListElement =
    | NodeExpr
    | NodeElseIf
    | NodeElse
    | NodeSwitchCase
    | NodeFunctionDefinition
    | NodeArgumentValidation
    | NodeArguments
    | NodeClassSection
    | NodeClassProperty
    | NodeClassEvent
    | NodeClassEnumeration
    | NodeClassAttribute;

/**
 * AST node that can appear in expression position.
 *
 * The `any` tail is retained for historical compatibility with generated
 * parser actions and evaluator paths that still use expression nodes as a broad
 * intermediate carrier. Prefer `StrictNodeExpr` in new hand-written code when a
 * fully typed expression contract is practical.
 */
type NodeExpr = StrictNodeExpr | any;

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
 * Explicit superclass constructor call, e.g. `obj@Base(args...)`.
 */
interface NodeSuperclassConstructor extends NodeBase {
    type: 'SUPERCLASS_CTOR';
    instance: NodeExpr;
    superclass: NodeIdentifier;
    args: NodeExpr[];
}

/**
 * Metaclass literal, e.g. `?ClassName`.
 */
interface NodeMetaClass extends NodeBase {
    type: 'METACLASS';
    className: NodeIdentifier;
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
 * Return-list entry accepted by MATLAB/Octave function definitions.
 */
type NodeFunctionReturn = NodeIdentifier | NodeIgnoredTarget;

/**
 * Parameter-list entry accepted by MATLAB/Octave function definitions.
 */
type NodeFunctionParameter = NodeIdentifier | NodeIgnoredTarget | NodeOperation;

/**
 * List node
 */
interface NodeList extends NodeBase {
    type: 'LIST';
    list: NodeListElement[];
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
 *
 * `length` is metadata, while dynamic output fields hold expression values.
 */
type ReturnHandlerResult = {
    length: number;
    [name: string]: NodeExpr | number | undefined;
};

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
 * Callable implementation stored in built-in registration tables.
 *
 * The concrete built-ins use specialized parameter and return types, so the
 * registry keeps only the common "callable" shape and lets the interpreter
 * perform the runtime dispatch.
 */
type BuiltInFunctionImplementation = (...args: never[]) => unknown;

/**
 * Return list node
 */
interface NodeReturnList extends NodeBase {
    type: 'RETLIST';
    selector: ReturnSelector;
    handler: ReturnHandler;
    commaSeparated?: boolean;
    returnListLength?: number;
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
    definingScope?: DefiningScope;
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

        /**
         * Marks a classdef method declaration without an inline function body.
         */
        prototype?: boolean;

        /**
         * Marks a subfunction registered from a function-file source.
         *
         * Function-file subfunctions share the file function table with the
         * primary function, but they are not exported to the caller/base scope.
         */
        subfunction?: boolean;
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

interface FunctionSignatureEntry {
    func: BuiltInFunctionImplementation;
    signature: BuiltInFunctionSignature;
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
type UndefinedReferenceTable = Record<string, Set<string>>;

/**
 * Command-form external function.
 *
 * Returning `undefined` leaves evaluation with the original command-word-list
 * node; returning a value supplies the evaluated result.
 */
type CommandWordListFunction = (...args: string[]) => NodeInput | void;

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
 * MATLAB-style package/class import declaration.
 */
interface NodeImport extends NodeBase {
    type: 'IMPORT';
    imports: NodeIdentifier[];
}

/**
 * `return` statement node.
 */
interface NodeReturn extends NodeBase {
    type: 'RETURN';
}

/**
 * `break` statement node.
 */
interface NodeBreak extends NodeBase {
    type: 'BREAK';
}

/**
 * `continue` statement node.
 */
interface NodeContinue extends NodeBase {
    type: 'CONTINUE';
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
 * `while` statement node.
 */
interface NodeWhile extends NodeBase {
    type: 'WHILE';
    expression: NodeExpr;
    body: NodeList;
}

/**
 * `do ... until` statement node.
 */
interface NodeDoUntil extends NodeBase {
    type: 'DO_UNTIL';
    body: NodeList;
    expression: NodeExpr;
}

/**
 * `for` statement node.
 */
interface NodeFor extends NodeBase {
    type: 'FOR';
    target: NodeExpr;
    expression: NodeExpr;
    workers: NodeExpr | null;
    body: NodeList;
    parallel: boolean;
}

/**
 * `spmd` statement node.
 */
interface NodeSpmd extends NodeBase {
    type: 'SPMD';
    workers: NodeList | null;
    body: NodeList;
}

/**
 * `try ... catch` statement node.
 */
interface NodeTry extends NodeBase {
    type: 'TRY';
    body: NodeList;
    catchIdentifier: NodeIdentifier | null;
    catchBody: NodeList | null;
}

/**
 * `unwind_protect ... unwind_protect_cleanup` statement node.
 */
interface NodeUnwindProtect extends NodeBase {
    type: 'UNWIND_PROTECT';
    body: NodeList;
    cleanup: NodeList;
}

/**
 * Supported `classdef` section kinds.
 */
type ClassSectionKind = 'PROPERTIES' | 'METHODS' | 'EVENTS' | 'ENUMERATION';

/**
 * Duplicate-preserving class attribute table keyed by attribute name.
 *
 * MATLAB/Octave diagnostics need to distinguish a repeated attribute from an
 * effective attribute value, so the AST keeps the full list for each key.
 */
type ClassAttributeTable = Record<string, NodeClassAttribute[]>;

/**
 * `classdef` declaration node.
 */
interface NodeClassDef extends NodeBase {
    type: 'CLASSDEF';
    /** Class name declared after `classdef`. */
    id: string;
    /** Attribute nodes declared in the class header. */
    attributes: NodeClassAttribute[];
    /** Attribute nodes grouped by name while preserving duplicates. */
    attributeTable: ClassAttributeTable;
    /** Direct superclass identifiers from the `< A & B` clause. */
    superclasses: NodeIdentifier[];
    /** Ordered `properties`, `methods`, `events`, and `enumeration` sections. */
    sections: NodeClassSection[];
}

/**
 * Section inside a `classdef` block.
 */
interface NodeClassSection extends NodeBase {
    type: 'CLASS_SECTION';
    /** Section kind, normalized independently from the concrete end keyword. */
    kind: ClassSectionKind;
    /** Section-level attributes such as `Access`, `Static`, or `Hidden`. */
    attributes: NodeClassAttribute[];
    /** Section attributes grouped by name while preserving duplicates. */
    attributeTable: ClassAttributeTable;
    /** Member list for this section. */
    members: NodeList;
}

/**
 * Property declaration inside a `properties` section.
 */
interface NodeClassProperty extends NodeBase {
    type: 'CLASS_PROPERTY';
    /** Property name as source text. */
    id: string;
    /**
     * Canonical argument-validation-shaped declaration.
     *
     * Class property declarations reuse MATLAB's `arguments` validation syntax,
     * so downstream code can validate size, class, and `mustBe*` functions
     * through the same infrastructure used for function arguments.
     */
    validation: NodeArgumentValidation;
    /** Identifier node for diagnostics and metadata construction. */
    name: NodeIdentifier;
    /** Literal/symbolic size validation list. */
    size: NodeInput[];
    /** Class validation node, or an empty list/null when absent. */
    class: NodeInput | null;
    /** Validator function declarations. */
    functions: NodeInput[];
    /** Default value expression, when declared. */
    defaultValue: NodeExpr | null;
}

/**
 * Event declaration inside an `events` section.
 */
interface NodeClassEvent extends NodeBase {
    type: 'CLASS_EVENT';
    /** Event name. */
    id: string;
}

/**
 * Enumeration declaration inside an `enumeration` section.
 */
interface NodeClassEnumeration extends NodeBase {
    type: 'CLASS_ENUMERATION';
    /** Enumeration member name. */
    id: string;
    /** Constructor-like arguments attached to the member declaration. */
    args: NodeExpr[];
}

/**
 * Attribute declaration for `classdef`, `properties`, and `methods`.
 */
interface NodeClassAttribute extends NodeBase {
    type: 'CLASS_ATTRIBUTE';
    /** Attribute name as declared in source. */
    id: string;
    /** Optional attribute value, including identifiers, strings, cells, or negated markers. */
    value: NodeExpr | null;
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
     * Test whether an unknown value has the common AST/runtime node shape.
     */
    public static readonly isNodeBase = (value: unknown): value is NodeBase =>
        typeof value === 'object' && value !== null && 'type' in value && (typeof (value as NodeBase).type === 'string' || typeof (value as NodeBase).type === 'number');

    /**
     * Test whether an unknown value is an identifier node.
     */
    public static readonly isNodeIdentifier = (value: unknown): value is NodeIdentifier =>
        AST.isNodeBase(value) && value.type === 'IDENT' && typeof (value as NodeIdentifier).id === 'string';

    /**
     * Test whether an unknown value is a list node.
     */
    public static readonly isNodeList = (value: unknown): value is NodeList => AST.isNodeBase(value) && value.type === 'LIST' && Array.isArray((value as NodeList).list);

    /**
     * Test whether an unknown value is an index expression node.
     */
    public static readonly isNodeIndexExpr = (value: unknown): value is NodeIndexExpr =>
        AST.isNodeBase(value) && value.type === 'IDX' && ((value as NodeIndexExpr).delim === '()' || (value as NodeIndexExpr).delim === '{}') && Array.isArray((value as NodeIndexExpr).args);

    /**
     * Test whether an unknown value is a dot-reference node.
     */
    public static readonly isNodeIndirectRef = (value: unknown): value is NodeIndirectRef => AST.isNodeBase(value) && value.type === '.' && Array.isArray((value as NodeIndirectRef).field);

    /**
     * Test whether an unknown value is a lazy return-list node.
     */
    public static readonly isNodeReturnList = (value: unknown): value is NodeReturnList =>
        AST.isNodeBase(value) && value.type === 'RETLIST' && typeof (value as NodeReturnList).selector === 'function' && typeof (value as NodeReturnList).handler === 'function';

    /**
     * Test whether an unknown value is an ignored target (`~`) node.
     */
    public static readonly isNodeIgnoredTarget = (value: unknown): value is NodeIgnoredTarget => AST.isNodeBase(value) && value.type === '<~>';

    /**
     * Test whether an unknown value is a function return-list entry.
     */
    public static readonly isNodeFunctionReturn = (value: unknown): value is NodeFunctionReturn => AST.isNodeIdentifier(value) || AST.isNodeIgnoredTarget(value);

    /**
     * Test whether an unknown value is a defaulted function parameter.
     */
    public static readonly isNodeDefaultedParameter = (value: unknown): value is NodeOperation & { type: '='; left: NodeIdentifier; right: NodeExpr } =>
        AST.isNodeBase(value) && value.type === '=' && AST.isNodeIdentifier((value as NodeOperation & { left?: unknown }).left) && 'right' in value;

    /**
     * Test whether an unknown value is a function parameter-list entry.
     */
    public static readonly isNodeFunctionParameter = (value: unknown): value is NodeFunctionParameter =>
        AST.isNodeIdentifier(value) || AST.isNodeIgnoredTarget(value) || AST.isNodeDefaultedParameter(value);

    /**
     * Test whether an unknown value is a function definition node.
     */
    public static readonly isNodeFunctionDefinition = (value: unknown): value is NodeFunctionDefinition => AST.isNodeBase(value) && value.type === 'FCNDEF';

    /**
     * Test whether an unknown value is a class definition node.
     */
    public static readonly isNodeClassDef = (value: unknown): value is NodeClassDef => AST.isNodeBase(value) && value.type === 'CLASSDEF';

    /**
     * Test whether an unknown value is an `arguments` block node.
     */
    public static readonly isNodeArguments = (value: unknown): value is NodeArguments => AST.isNodeBase(value) && value.type === 'ARGS' && Array.isArray((value as NodeArguments).validation);

    /**
     * Test whether an unknown value is one declaration inside an `arguments` block.
     */
    public static readonly isNodeArgumentValidation = (value: unknown): value is NodeArgumentValidation =>
        AST.isNodeBase(value) && value.type === 'ARGVALID' && 'name' in value && Array.isArray((value as NodeArgumentValidation).size);

    /**
     * Test whether an unknown value is a `case` clause node.
     */
    public static readonly isNodeSwitchCase = (value: unknown): value is NodeSwitchCase => AST.isNodeBase(value) && value.type === 'CASE';

    /**
     * Test whether an unknown value is a class section node.
     */
    public static readonly isNodeClassSection = (value: unknown): value is NodeClassSection => AST.isNodeBase(value) && value.type === 'CLASS_SECTION';

    /**
     * Test whether an unknown value is a class attribute node.
     */
    public static readonly isNodeClassAttribute = (value: unknown): value is NodeClassAttribute => AST.isNodeBase(value) && value.type === 'CLASS_ATTRIBUTE';

    /**
     * Test whether an unknown value is a class enumeration member node.
     */
    public static readonly isNodeClassEnumeration = (value: unknown): value is NodeClassEnumeration => AST.isNodeBase(value) && value.type === 'CLASS_ENUMERATION';

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
     * Create a metaclass literal node (`?ClassName`).
     */
    public static readonly nodeMetaClass = (className: NodeIdentifier): NodeMetaClass => {
        const result: NodeMetaClass = {
            type: 'METACLASS',
            className,
            omitAnswer: false,
            omitOutput: false,
        };
        result.className.parent = result;
        return result;
    };

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
        result.args.forEach((node, index) => {
            node.parent = result;
            node.index = index;
        });
        return result;
    };

    /**
     * Create an explicit superclass constructor call node.
     */
    public static readonly nodeSuperclassConstructor = (instance: NodeExpr, superclass: NodeIdentifier, args: NodeList | null = null): NodeSuperclassConstructor => {
        const result: NodeSuperclassConstructor = {
            type: 'SUPERCLASS_CTOR',
            instance,
            superclass,
            args: args ? (args.list as NodeExpr[]) : [],
            omitAnswer: false,
            omitOutput: false,
        };
        result.instance.parent = result;
        result.superclass.parent = result;
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
    private static readonly omitAnswerNodeOperation = new Set<NodeType | number>([
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
    ]);

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
        result.omitAnswer = AST.omitAnswerNodeOperation.has(result.type);
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
    public static readonly nodeListFirst = (node?: NodeListElement): NodeList => {
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
    public static readonly appendNodeList = (lnode: NodeList, node: NodeListElement): NodeList => {
        node.parent = lnode;
        lnode.list.push(node);
        return lnode;
    };

    /**
     *
     * @param list
     * @returns
     */
    public static readonly nodeList = (list: NodeListElement[]): NodeList => {
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
            if (typeof right !== 'string') {
                right.parent = left;
            }
            return left;
        } else {
            const result: NodeIndirectRef = {
                type: '.',
                obj: left,
                field: [right],
                omitAnswer: false,
                omitOutput: false,
            };
            result.obj.parent = result;
            if (typeof right !== 'string') {
                right.parent = result;
            }
            return result;
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
        if (AST.isNodeReturnList(node)) {
            return node;
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
        if (AST.isNodeReturnList(tree)) {
            const result = tree.selector(tree.handler(1), 0);
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
     * Build a name-keyed view of class attributes while preserving duplicates.
     */
    private static readonly nodeClassAttributeTable = (attributes: NodeClassAttribute[]): ClassAttributeTable => {
        const table: ClassAttributeTable = {};
        for (const attribute of attributes) {
            table[attribute.id] ??= [];
            table[attribute.id].push(attribute);
        }
        return table;
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
    public static readonly nodeArgumentValidation = (name: NodeExpr, size: NodeList, cl: NodeInput | null = null, functions: NodeList, dflt: NodeExpr = null): NodeArgumentValidation => {
        const result = {
            type: 'ARGVALID',
            name,
            size: size.list,
            class: cl,
            functions: functions.list,
            default: dflt,
            omitAnswer: true,
            omitOutput: true,
        } as NodeArgumentValidation;
        result.name.parent = result;
        result.size.forEach((node) => (node.parent = result));
        if (result.class) {
            result.class.parent = result;
        }
        result.functions.forEach((node) => (node.parent = result));
        if (result.default) {
            result.default.parent = result;
        }
        return result;
    };

    /**
     * Create an `arguments` block.
     *
     * @param attribute Optional block attribute (`Input`, `Output`, `Repeating`).
     * @param validationList Declaration list.
     * @returns Arguments block node.
     */
    public static readonly nodeArguments = (attribute: NodeIdentifier | null, validationList: NodeList): NodeArguments => {
        const result = {
            type: 'ARGS',
            attribute,
            validation: validationList.list.filter(AST.isNodeArgumentValidation),
            omitAnswer: true,
            omitOutput: true,
        } as NodeArguments;
        if (result.attribute) {
            result.attribute.parent = result;
        }
        result.validation.forEach((node) => (node.parent = result));
        return result;
    };

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
     * Create a `break` statement node.
     */
    public static readonly nodeBreak = (): NodeBreak => ({
        type: 'BREAK',
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create a `continue` statement node.
     */
    public static readonly nodeContinue = (): NodeContinue => ({
        type: 'CONTINUE',
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
        const declarationNode = AST.getDeclarationNode(declaration);
        declarationNode.parent = node;
        node.list.push(declarationNode);
        return node;
    };

    /**
     * Create the first node for a MATLAB-style `import` declaration.
     *
     * @param importName Fully qualified class/package name, optionally ending in `.*`.
     * @returns Import declaration node.
     */
    public static readonly nodeImportFirst = (importName: NodeIdentifier): NodeImport =>
        AST.nodeAppendImport(
            {
                type: 'IMPORT',
                imports: [],
                omitAnswer: true,
                omitOutput: true,
            } as NodeImport,
            importName,
        );

    /**
     * Append one fully qualified import name to an `import` declaration.
     *
     * @param node Import declaration to extend.
     * @param importName Fully qualified class/package name.
     * @returns The same import declaration node.
     */
    public static readonly nodeAppendImport = (node: NodeImport, importName: NodeIdentifier): NodeImport => {
        importName.parent = node;
        importName.index = node.imports.length;
        node.imports.push(importName);
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
    public static readonly nodeElseIf = (expression: NodeExpr, then: NodeList): NodeElseIf => {
        const result: NodeElseIf = {
            type: 'ELSEIF',
            expression,
            then,
            omitAnswer: true,
            omitOutput: true,
        };
        result.expression.parent = result;
        result.then.parent = result;
        return result;
    };

    /**
     *
     * @param elseStmt
     * @returns
     */
    public static readonly nodeElse = (elseStmt: NodeList): NodeElse => {
        const result: NodeElse = {
            type: 'ELSE',
            else: elseStmt,
            omitAnswer: true,
            omitOutput: true,
        };
        result.else.parent = result;
        return result;
    };

    /**
     * Create a `switch` statement node.
     */
    public static readonly nodeSwitch = (expression: NodeExpr, cases: NodeList, otherwise: NodeList | null = null): NodeSwitch => {
        const result = {
            type: 'SWITCH',
            expression,
            cases: cases.list.filter(AST.isNodeSwitchCase),
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

    /**
     * Create a `while` statement node.
     */
    public static readonly nodeWhile = (expression: NodeExpr, body: NodeList): NodeWhile => {
        const result = {
            type: 'WHILE',
            expression,
            body,
            omitAnswer: true,
            omitOutput: true,
        } as NodeWhile;
        result.expression.parent = result;
        result.body.parent = result;
        return result;
    };

    /**
     * Create a `do ... until` statement node.
     */
    public static readonly nodeDoUntil = (body: NodeList, expression: NodeExpr): NodeDoUntil => {
        const result = {
            type: 'DO_UNTIL',
            body,
            expression,
            omitAnswer: true,
            omitOutput: true,
        } as NodeDoUntil;
        result.body.parent = result;
        result.expression.parent = result;
        return result;
    };

    /**
     * Create a `for` statement node.
     */
    public static readonly nodeFor = (target: NodeExpr, expression: NodeExpr, body: NodeList, parallel: boolean = false, workers: NodeExpr | null = null): NodeFor => {
        const result = {
            type: 'FOR',
            target,
            expression,
            workers,
            body,
            parallel,
            omitAnswer: true,
            omitOutput: true,
        } as NodeFor;
        result.target.parent = result;
        result.expression.parent = result;
        if (result.workers) {
            result.workers.parent = result;
        }
        result.body.parent = result;
        return result;
    };

    /**
     * Create an `spmd` statement node.
     */
    public static readonly nodeSpmd = (body: NodeList, workers: NodeList | null = null): NodeSpmd => {
        const result = {
            type: 'SPMD',
            workers,
            body,
            omitAnswer: true,
            omitOutput: true,
        } as NodeSpmd;
        if (result.workers) {
            result.workers.parent = result;
        }
        result.body.parent = result;
        return result;
    };

    /**
     * Create a `try ... catch` statement node.
     */
    public static readonly nodeTry = (body: NodeList, catchBody: NodeList | null = null, catchIdentifier: NodeIdentifier | null = null): NodeTry => {
        const result = {
            type: 'TRY',
            body,
            catchIdentifier,
            catchBody,
            omitAnswer: true,
            omitOutput: true,
        } as NodeTry;
        result.body.parent = result;
        if (result.catchIdentifier) {
            result.catchIdentifier.parent = result;
        }
        if (result.catchBody) {
            result.catchBody.parent = result;
        }
        return result;
    };

    /**
     * Create an `unwind_protect ... unwind_protect_cleanup` statement node.
     */
    public static readonly nodeUnwindProtect = (body: NodeList, cleanup: NodeList): NodeUnwindProtect => {
        const result = {
            type: 'UNWIND_PROTECT',
            body,
            cleanup,
            omitAnswer: true,
            omitOutput: true,
        } as NodeUnwindProtect;
        result.body.parent = result;
        result.cleanup.parent = result;
        return result;
    };

    /**
     * Create a minimal `classdef` node.
     */
    public static readonly nodeClassDef = (
        id: NodeIdentifier,
        sections: NodeList,
        attributes: NodeList = AST.nodeListFirst(),
        superclasses: NodeList = AST.nodeListFirst(),
    ): NodeClassDef => {
        const result = {
            type: 'CLASSDEF',
            id: id.id,
            attributes: attributes.list.filter(AST.isNodeClassAttribute),
            attributeTable: {},
            superclasses: superclasses.list.filter(AST.isNodeIdentifier),
            sections: sections.list.filter(AST.isNodeClassSection),
            omitAnswer: true,
            omitOutput: true,
        } as NodeClassDef;
        result.attributeTable = AST.nodeClassAttributeTable(result.attributes);
        result.attributes.forEach((node) => (node.parent = result));
        result.superclasses.forEach((node) => (node.parent = result));
        result.sections.forEach((node) => (node.parent = result));
        return result;
    };

    /**
     * Create a `properties` or `methods` section.
     */
    public static readonly nodeClassSection = (kind: ClassSectionKind, members: NodeList, attributes: NodeList = AST.nodeListFirst()): NodeClassSection => {
        const result = {
            type: 'CLASS_SECTION',
            kind,
            attributes: attributes.list.filter(AST.isNodeClassAttribute),
            attributeTable: {},
            members,
            omitAnswer: true,
            omitOutput: true,
        } as NodeClassSection;
        result.attributeTable = AST.nodeClassAttributeTable(result.attributes);
        result.attributes.forEach((node) => (node.parent = result));
        result.members.parent = result;
        result.members.list.forEach((node) => (node.parent = result));
        return result;
    };

    /**
     * Create a simple class property declaration.
     */
    public static readonly nodeClassProperty = (
        id: NodeIdentifier,
        sizeOrDefaultValue: NodeList | NodeExpr | null = AST.nodeListFirst(),
        cl: NodeInput | null = null,
        functions: NodeList = AST.nodeListFirst(),
        defaultValue: NodeExpr | null = null,
    ): NodeClassProperty => {
        const legacyDefaultValue = sizeOrDefaultValue && sizeOrDefaultValue.type !== 'LIST' ? (sizeOrDefaultValue as NodeExpr) : null;
        const size = sizeOrDefaultValue && sizeOrDefaultValue.type === 'LIST' ? (sizeOrDefaultValue as NodeList) : AST.nodeListFirst();
        const validation = AST.nodeArgumentValidation(id, size, cl, functions, legacyDefaultValue ?? defaultValue);
        const result = {
            type: 'CLASS_PROPERTY',
            id: id.id,
            validation,
            name: validation.name as NodeIdentifier,
            size: validation.size,
            class: validation.class,
            functions: validation.functions,
            defaultValue: validation.default,
            omitAnswer: true,
            omitOutput: true,
        } as NodeClassProperty;
        result.validation.parent = result;
        return result;
    };

    /**
     * Create a simple class event declaration.
     */
    public static readonly nodeClassEvent = (id: NodeIdentifier): NodeClassEvent => ({
        type: 'CLASS_EVENT',
        id: id.id,
        omitAnswer: true,
        omitOutput: true,
    });

    /**
     * Create a class enumeration declaration.
     */
    public static readonly nodeClassEnumeration = (id: NodeIdentifier, args: NodeList = AST.nodeListFirst()): NodeClassEnumeration => {
        const result = {
            type: 'CLASS_ENUMERATION',
            id: id.id,
            args: args.list.filter((node): node is NodeExpr => !AST.isNodeClassSection(node) && !AST.isNodeClassAttribute(node) && !AST.isNodeClassEnumeration(node)),
            omitAnswer: true,
            omitOutput: true,
        } as NodeClassEnumeration;
        result.args.forEach((node) => (node.parent = result));
        return result;
    };

    /**
     * Create a class attribute declaration.
     */
    public static readonly nodeClassAttribute = (id: NodeIdentifier, value: NodeExpr | null = null): NodeClassAttribute => {
        const result = {
            type: 'CLASS_ATTRIBUTE',
            id: id.id,
            value,
            omitAnswer: true,
            omitOutput: true,
        } as NodeClassAttribute;
        if (result.value) {
            result.value.parent = result;
        }
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
    NodeListElement,
    StrictNodeExpr,
    NodeExpr,
    NodeReserved,
    NodeLiteral,
    NodeIdentifier,
    NodeCmdWList,
    NodeIndexExpr,
    NodeSuperclassConstructor,
    NodeMetaClass,
    NodeRange,
    NodeColon,
    NodeEndRange,
    NodeOperation,
    UnaryOperation,
    UnaryOperationR,
    UnaryOperationL,
    BinaryOperation,
    NodeIgnoredTarget,
    NodeFunctionReturn,
    NodeFunctionParameter,
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
    BuiltInFunctionImplementation,
    FunctionSignatureEntry,
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
    NodeImport,
    NodeReturn,
    NodeBreak,
    NodeContinue,
    NodeIf,
    NodeElseIf,
    NodeElse,
    NodeSwitch,
    NodeSwitchCase,
    NodeWhile,
    NodeDoUntil,
    NodeFor,
    NodeSpmd,
    NodeTry,
    NodeUnwindProtect,
    ClassSectionKind,
    ClassAttributeTable,
    NodeClassDef,
    NodeClassSection,
    NodeClassProperty,
    NodeClassEvent,
    NodeClassEnumeration,
    NodeClassAttribute,
};
export { AST };
export default { AST };
