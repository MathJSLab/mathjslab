/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import { CharStreams, CommonTokenStream } from 'antlr4';
// import { DiagnosticErrorListener, PredictionMode } from 'antlr4';

import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';
import { LexerErrorListener } from './LexerErrorListener';
import { ParserErrorListener } from './ParserErrorListener';
import type {
    OperatorType,
    NodeInput,
    NodeExpr,
    NodeIdentifier,
    NodeIndirectRef,
    NodeIndexExpr,
    NodeSuperclassConstructor,
    ReturnHandlerResult,
    NodeReturnList,
    NodeType,
    NodeFunctionDefinition,
    NodeFunctionParameter,
    NodeFunctionReturn,
    NodeList,
    NodeDeclaration,
    NodeImport,
    NodeClassDef,
    NodeArgumentValidation,
    NodeClassAttribute,
    NodeClassSection,
    NodeSwitchCase,
    BinaryOperation,
    PrefixUnaryOperation,
    PostfixUnaryOperation,
    BuiltInFunctionSignature,
    BuiltInFunctionParameterValidator,
    NodeBuiltInFunction,
    NameEntry,
    AliasNameTable,
    BuiltInFunctionTable,
    CommandWordListFunction,
    CommandWordListTable,
    FunctionSignatureEntry,
    IndexingDelimiterType,
    ExpressionBoundaryValue,
    RuntimeExpressionValue,
} from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { MultiArray, type ElementType, type IndexArgument } from './MultiArray';
import { Structure, type StructureFieldValue } from './Structure';
import { FunctionHandle } from './FunctionHandle';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { ClassBoundMethod } from './ClassBoundMethod';
import { ClassStaticMethod } from './ClassStaticMethod';
import { ClassEmptyMethod } from './ClassEmptyMethod';
import { ClassEnumerationValue } from './ClassEnumerationValue';
import { ClassEventListener } from './ClassEventListener';
import { ClassEventData } from './ClassEventData';
import { ClassPropertyEvent } from './ClassPropertyEvent';
import { ClassMetaObject, ClassMetaClass, ClassMetaProperty } from './ClassMeta';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, KeyOfTypeOfMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { substSymbol } from './substSymbol';
import { CoreFunctions } from './CoreFunctions';
import { DiagnosticMessage } from './DiagnosticMessage';
import { LinearAlgebra } from './LinearAlgebra';
import { Configuration } from './Configuration';
import { MathML } from './MathML';
import { FunctionValidation } from './FunctionValidation';
import { FunctionArguments, type PathValidationCallbacks } from './FunctionArguments';
import { FunctionArity } from './FunctionArity';
import { FunctionWorkspace } from './FunctionWorkspace';
import { FunctionIntrospection } from './FunctionIntrospection';
import { FunctionLookup, type StaticMethodInfo } from './FunctionLookup';
import { RuntimeEquality } from './RuntimeEquality';
import { RuntimeValue } from './RuntimeValue';
import { Scope } from './Scope';
import { CallFrame } from './CallFrame';
import { Callables, type Callable } from './Callable';
import type {
    ClassEventDefinition as ClassEventDefinitionBase,
    ClassMethodDefinition as ClassMethodDefinitionBase,
    ClassPropertyDefinition as ClassPropertyDefinitionBase,
} from './ClassMember';
import type { SourceEntry, SourceProvider, SourceResolver, SourceTable } from './SourceResolver';
import { TableSourceResolver } from './SourceResolver';
import { BreakSignal, Context, ContinueSignal, ReturnSignal } from './Context';
import type { SymbolResolution, SymbolResolutionOptions } from './Context';
import { CircularReferenceError, EvalError, InterpreterError, ReferenceError, SyntaxError, UndefinedReferenceError } from './InterpreterError';
import { expressionValue, runtimeExpressionValue } from './ExpressionValue';
import type { CallArgumentValue } from './FunctionCall';

/**
 * Numeric exit status used by the public `exitStatus` property.
 */
type ExitStatus = number;
/** Named exit status table. */
type ExitStatusValues = Record<string, ExitStatus>;

/** Host-provided class source entry. */
type ClassSource = SourceEntry;
type ClassPropertyDefinition = ClassPropertyDefinitionBase<ClassDefinition>;
type ClassMethodDefinition = ClassMethodDefinitionBase<ClassDefinition>;
type ClassEventDefinition = ClassEventDefinitionBase<ClassDefinition>;

/** Host-provided function-file source entry. */
type FunctionSource = SourceEntry;

/** Host-provided script-file source entry. */
type ScriptSource = SourceEntry;

/** Callback used to provide classdef source for a class name. */
type ClassSourceProvider = SourceProvider;
/** Table of host-provided class sources keyed by class name. */
type ClassSourceTable = SourceTable;
/** Callback used to provide function-file source for a function name. */
type FunctionSourceProvider = SourceProvider;
/** Table of host-provided function-file sources keyed by primary function name. */
type FunctionSourceTable = SourceTable;
/** Callback used to provide script-file source for a script name. */
type ScriptSourceProvider = SourceProvider;
/** Table of host-provided script-file sources keyed by script name. */
type ScriptSourceTable = SourceTable;

/** Error object carrying a MATLAB/Octave public stack captured by `rethrow`. */
type PublicStackError = Error & { identifier?: string; publicStack?: RuntimeExpressionValue };

/** Warning-state values accepted by MATLAB/Octave warning controls. */
type WarningState = 'on' | 'off' | 'error';

/** Clear command categories selected by MATLAB/Octave options. */
type ClearCategory = 'visible' | 'variables' | 'functions' | 'classes' | 'global';

/** Normalized command-form `clear` options. */
type ClearCommandOptions = {
    /** Category selected by `clear` options, or visible names when absent. */
    category: ClearCategory;
    /** Whether patterns are JavaScript regular expressions. */
    regexp: boolean;
    /** Whether matching patterns are keep-patterns instead of clear-patterns. */
    exclusive: boolean;
    /** Non-option patterns remaining after option normalization. */
    patterns: string[];
};

/** Normalized workspace listing options for `who` and `whos`. */
type WorkspaceListingOptions = {
    /** Whether only global variables should be listed. */
    globalOnly: boolean;
    /** Whether patterns are JavaScript regular expressions. */
    regexp: boolean;
    /** Non-option patterns remaining after option normalization. */
    patterns: string[];
};

/**
 * Interpreter construction options.
 *
 * All extension points are explicit so the engine remains browser-compatible:
 * callers can inject aliases, built-ins, command-form functions, and class
 * sources without requiring ambient filesystem or module loading.
 */
type InterpreterConfig = {
    /** Lexer/parser alias table for symbolic names. */
    aliasNameTable?: AliasNameTable;
    /** Additional built-in functions registered at startup. */
    externalFunctionTable?: BuiltInFunctionTable;
    /** Additional command-form functions registered at startup. */
    externalCmdWListTable?: CommandWordListTable;
    /** Unified virtual `.m` source resolver. */
    sourceResolver?: SourceResolver;
    /** Host predicate used by `mustBeFile` argument/property validation. */
    fileExists?: (path: string) => boolean;
    /** Host predicate used by `mustBeFolder` argument/property validation. */
    folderExists?: (path: string) => boolean;
    /** Host-provided function-file source strings. */
    functionSourceTable?: FunctionSourceTable;
    /** Lazy host-provided function-file source callback. */
    functionSourceProvider?: FunctionSourceProvider;
    /** Host-provided script-file source strings. */
    scriptSourceTable?: ScriptSourceTable;
    /** Lazy host-provided script-file source callback. */
    scriptSourceProvider?: ScriptSourceProvider;
    /** Host-provided class source strings. */
    classSourceTable?: ClassSourceTable;
    /** Lazy host-provided class source callback. */
    classSourceProvider?: ClassSourceProvider;
    /**
     * Compatibility alias for early class-loader experiments. Prefer
     * `classSourceTable` for browser/host-provided class sources.
     */
    externalClassSourceTable?: Record<string, string>;
    /**
     * Compatibility alias for early function-loader experiments. Prefer
     * `functionSourceTable` for browser/host-provided function sources.
     */
    externalFunctionSourceTable?: Record<string, string>;
    /**
     * Compatibility alias for early script-loader experiments. Prefer
     * `scriptSourceTable` for browser/host-provided script sources.
     */
    externalScriptSourceTable?: Record<string, string>;
};

/**
 * Increment and decrement operator handler type.
 */
type IncDecOperator = (tree: NodeExpr, scope: Scope) => NodeInput;

/**
 * Full parse/evaluate/unparse bundle returned by `Interprets`.
 */
type InterpretsResult = {
    /** Original input string. */
    input: string;
    /** AST produced from the original input. */
    inputParsed: NodeInput;
    /** Textual unparse of the evaluated input. */
    inputUnparsed: string;
    /** MathML rendering of the evaluated input. */
    inputUnparsedMathML: string;
    /** Evaluated runtime value or AST result. */
    evaluated: NodeInput;
    /** Textual unparse of the evaluated result. */
    evaluatedUnparsed: string;
    /** MathML rendering of the evaluated result. */
    evaluatedUnparsedMathML: string;
};

/**
 * Normalized assignment target produced while evaluating assignment syntax.
 */
type AssignmentTarget = {
    /** Base variable or pseudo-target identifier. */
    id: string;
    /** Ordinary evaluated index expressions for direct array/cell assignment. */
    index?: ExpressionBoundaryValue[];
    /** Indexing delimiter associated with {@link index}. */
    delimiter?: IndexingDelimiterType;
    /** Dot-reference field chain applied after the base/index target. */
    field: string[];
    /** MATLAB-like `subsasgn` descriptors used by class assignment dispatch. */
    descriptors?: Structure[];
};

/**
 * MATLAB-like subscript descriptor used by class `subsref`/`subsasgn` methods.
 */
type NativeSubscriptDescriptor = {
    /** Descriptor type: `()`, `{}`, or `.`. */
    type: IndexingDelimiterType | '.';
    /** Descriptor subscripts; dot descriptors store their field name here. */
    subs: NodeInput[];
};

/**
 * Class property descriptor chain recognized by native `subsref`/`subsasgn`
 * fallback when a class does not overload those methods.
 */
type ClassPropertyDescriptorChain = {
    /** Optional object-array selection before the property chain. */
    leadingIndex?: NativeSubscriptDescriptor;
    /** Property names selected through dot descriptors. */
    fields: string[];
    /** Optional final indexing operation applied to the selected property. */
    finalIndex?: NativeSubscriptDescriptor;
    /** Remaining native descriptors applied inside the selected property. */
    tailDescriptors?: NativeSubscriptDescriptor[];
};

/**
 * Qualified symbolic access selected before ordinary dot indexing.
 */
type QualifiedAccessResolution = {
    /** Selected qualified access category. */
    kind: 'class-member-chain' | 'function';
    /** Original dotted name parts. */
    parts: string[];
    /** Number of parts consumed by the class/function prefix. */
    prefixLength: number;
    /** Canonical class or function name resolved by the lookup layer. */
    resolvedName: string;
    /** Class definition for class-member chains. */
    classDefinition?: ClassDefinition;
    /** Function handle used for qualified function calls. */
    functionHandle?: FunctionHandle;
};

/**
 * Interpreter instance interface.
 */
interface InterpreterInterface {
    /** Whether debug diagnostics and fallback tracing are enabled. */
    debug: boolean;
    /** Runtime context owned by this interpreter. */
    context: Context;
    /** Last public execution status. */
    exitStatus: ExitStatus;
    /** Operator precedence table used by unparsers. */
    precedenceTable: { [key: string]: number };
    /** Parse source text into an AST/runtime node. */
    Parse(input: string): NodeInput;
    /** Reset runtime state while preserving constructor-level configuration defaults. */
    Restart(): void;
    /** Clear variables/functions, or reset the interpreter when no names are supplied. */
    Clear(...names: string[]): void;
    /** Evaluate one AST/runtime node in a scope. */
    Evaluator(tree: NodeInput, scope?: Scope): NodeInput;
    /** Evaluate one parsed AST from the public top-level entry point. */
    Evaluate(tree: NodeInput): NodeInput;
    /** Parse and evaluate source text in one call. */
    Execute(input: string): NodeInput;
    /** Convert a runtime/AST node back to normalized source-like text. */
    Unparse(tree: NodeInput, parentPrecedence?: number): string;
    /** Convert a runtime/AST node to a MathML fragment. */
    UnparserMathML(tree: NodeInput, parentPrecedence: number): string;
    /** Convert a runtime/AST node to a complete MathML string. */
    UnparseMathML(tree: NodeInput, display: 'inline' | 'block' | 'none'): string;
    /** Parse source text and render its AST as MathML. */
    ToMathML(input: string, display: 'inline' | 'block' | 'none'): string;
    /** Return parsed/evaluated/unparsed forms for host diagnostics and demos. */
    Interprets(input: string, display: 'inline' | 'block' | 'none'): InterpretsResult;
}

/**
 * MATLAB/Octave-like parser, evaluator, unparser, and host integration point.
 *
 * `Interpreter` owns the ANTLR parser pipeline, runtime context, built-in
 * tables, command-form functions, class loading contracts, and display
 * unparsers. Most semantic helpers are delegated to smaller modules; this
 * class coordinates them around one active `Context`.
 */
class Interpreter implements InterpreterInterface {
    /** MATLAB-compatible maximum identifier length exposed by `namelengthmax`. */
    private static readonly nameLengthMax = 63;
    /** Sorted language keywords as recognized by the lexer. */
    private static readonly keywordNames = MathJSLabLexer.keywordNames.filter((name): name is string => typeof name === 'string' && name.length > 0).sort();
    /** Keyword lookup set used by `iskeyword` and `isvarname`. */
    private static readonly keywordNameSet = new Set(Interpreter.keywordNames);
    /** Public MATLAB validator functions backed by the `arguments` validator engine. */
    private static readonly publicArgumentValidators = [
        'mustBeNumeric',
        'mustBeFloat',
        'mustBeNumericOrLogical',
        'mustBeText',
        'mustBeTextScalar',
        'mustBeNonzeroLengthText',
        'mustBeValidVariableName',
        'mustBeFile',
        'mustBeFolder',
        'mustBeScalarOrEmpty',
        'mustBeScalar',
        'mustBeMatrix',
        'mustBeSquare',
        'mustBeVector',
        'mustBeRow',
        'mustBeColumn',
        'mustBeNonempty',
        'mustBePositive',
        'mustBeNonnegative',
        'mustBeNegative',
        'mustBeNonpositive',
        'mustBeNonzero',
        'mustBeNonNan',
        'mustBeNonmissing',
        'mustBeNonsparse',
        'mustBeSparse',
        'mustBeInteger',
        'mustBeOdd',
        'mustBeFinite',
        'mustBeReal',
        'mustBeGreaterThan',
        'mustBeGreaterThanOrEqual',
        'mustBeLessThan',
        'mustBeLessThanOrEqual',
        'mustBeInRange',
        'mustBeBetween',
        'mustBeMember',
        'mustBeA',
        'mustBeUnderlyingType',
    ] as const;

    /**
     * After run `Evaluate` method, the `exitStatus` property will contains
     * exit state of evaluation.
     */
    public static readonly response: ExitStatusValues = {
        EXTERNAL: -2,
        WARNING: -1,
        OK: 0,
        LEX_ERROR: 1,
        PARSER_ERROR: 2,
        EVAL_ERROR: 3,
    };

    /**
     * Private debug flag.
     */
    private _debug: boolean = false;

    /**
     * `debug` getter.
     */
    public get debug(): boolean {
        return this._debug;
    }

    /**
     * `debug` setter.
     */
    public set debug(value: boolean) {
        this._debug = value;
    }

    /**
     * Interpreter context.
     */
    public context: Context;

    /**
     * Command word list table.
     */
    private commandWordListTable: CommandWordListTable = {
        clear: {
            preserveAssignment: true,
            func: (...args: string[]): NodeInput => {
                this.Clear(...args);
                return AST.nodeVoid();
            },
        },
        run: {
            preserveAssignment: true,
            func: (...args: string[]): NodeInput => {
                if (args.length !== 1) {
                    this.context.throwEvalError('Invalid call to run.');
                }
                return this.RunScriptFile(args[0], this.context.currentScope);
            },
        },
        source: {
            preserveAssignment: true,
            func: (...args: string[]): NodeInput => {
                if (args.length < 1 || args.length > 2) {
                    this.context.throwEvalError('Invalid call to source.');
                }
                const scope = args.length === 2 ? this.context.resolveWorkspace(args[1]) : this.context.currentScope;
                return this.RunScriptFile(args[0], scope);
            },
        },
        exist: {
            preserveAssignment: true,
            func: (...args: string[]): ComplexType => {
                if (args.length < 1 || args.length > 2) {
                    AST.throwInvalidCallError('exist', true, (message) => this.context.throwSyntaxError(message));
                }
                return Complex.create(this.existCode(args[0], args[1]));
            },
        },
        which: {
            preserveAssignment: true,
            func: (...args: string[]): CharString => {
                const source = args.join(' ');
                const expressionMatch = source.match(/^\(([\s\S]*)\)$/);
                if (expressionMatch) {
                    const evaluated = this.evaluatedExecutionResult(this.Parse(expressionMatch[1]), this.context.currentScope);
                    const value = evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
                    return (this.functions.which.func as (value: NodeInput) => CharString)(value);
                }
                AST.throwInvalidCallError('which', args.length < 1, (message) => this.context.throwSyntaxError(message));
                return new CharString(args.map((name) => this.whichResult(name).str).join('\n'));
            },
        },
        who: {
            func: (...args: string[]): MultiArray => this.whoResultFromPatterns(args),
        },
        whos: {
            func: (...args: string[]): MultiArray => this.whosResultFromPatterns(args),
        },
        isglobal: {
            func: (...args: string[]): NodeInput => {
                AST.throwInvalidCallError('isglobal', args.length !== 1, (message) => this.context.throwSyntaxError(message));
                return this.isGlobalName(args[0]) ? Complex.true() : Complex.false();
            },
        },
        dbstack: {
            func: (...args: string[]): MultiArray => {
                const values = args.map((arg) => (/^\d+$/.test(arg) ? Complex.create(Number(arg)) : new CharString(arg)));
                return this.dbstackResult(values);
            },
        },
        warning: {
            func: (...args: string[]): NodeInput => {
                const control = this.warningControlResult(args.map((arg) => new CharString(arg)));
                if (control) {
                    return args[0]?.toLowerCase() === 'query' ? control : AST.nodeVoid();
                }
                return this.warningResult(this.diagnosticCommandArguments(args));
            },
        },
        error: {
            func: (...args: string[]): NodeInput => this.errorResult(this.diagnosticCommandArguments(args)),
        },
        /* Debug purpose commands */
        __operators__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const operators = Object.keys(this.opTable).sort();
                const result = new MultiArray([operators.length, 1], null, true);
                result.array = operators.map((operator) => [new CharString(operator)]);
                return result;
            },
        },
        __keywords__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const keywords = MathJSLabLexer.keywordNames.slice(1).sort() as string[];
                const result = new MultiArray([keywords.length, 1], null, true);
                result.array = keywords.map((keyword) => [new CharString(keyword)]);
                return result;
            },
        },
        __builtins__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                const result = new MultiArray([this.context.builtInFunctionList.length, 1], null, true);
                result.array = this.context.builtInFunctionList.sort().map((name) => [new CharString(name)]);
                return result;
            },
        },
        __list_functions__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                return MultiArray.emptyArray(true);
            },
        },
        __dump_symtab_info__: {
            /* eslint-disable-next-line  @typescript-eslint/no-unused-vars */
            func: (...args: string[]): MultiArray => {
                return MultiArray.emptyArray(true);
            },
        },
    };
    private commandWordListNameSet: Set<string> = new Set();
    private assignmentSensitiveCommandNameSet: Set<string> = new Set();
    /** Operators that introduce or update assignment targets. */
    private static readonly assignmentOperatorNames = new Set<NodeType | number>(['=', '+=', '-=', '*=', '/=', '\\=', '^=', '**=', '.*=', './=', '.\\=', '.^=', '.**=', '&=', '|=']);

    /**
     * Unified virtual source resolver for browser/host-provided `.m` files.
     */
    private sourceResolver: SourceResolver = TableSourceResolver.create();
    /** Host path predicates used by MATLAB-style file/folder validators. */
    private pathValidationCallbacks: PathValidationCallbacks = {};

    /**
     * Refresh lexer-facing command-name sets after command table changes.
     */
    private refreshCommandWordListNames(): void {
        this.commandWordListNameSet = new Set(Object.keys(this.commandWordListTable));
        this.assignmentSensitiveCommandNameSet = new Set(
            Object.entries(this.commandWordListTable)
                .filter(([, entry]) => entry.preserveAssignment)
                .map(([name]) => name),
        );
    }

    /**
     * Function names currently being loaded, used to avoid recursive loader loops.
     */
    private loadingFunctionNames = new Set<string>();

    /**
     * Class names currently being loaded, used to avoid recursive loader loops.
     */
    private loadingClassNames = new Set<string>();

    /**
     * Class method names currently being loaded, used to avoid recursive loader loops.
     */
    private loadingClassMethodNames = new Set<string>();

    /**
     * Nesting level of host-provided script execution.
     *
     * A script is not a function frame, but MATLAB/Octave still allow `return`
     * to stop the current script. Keeping that state in the interpreter lets
     * interactive/top-level `return` remain invalid while scripts loaded
     * through the browser-safe source APIs can exit early.
     */
    private scriptExecutionDepth = 0;

    /**
     * Virtual source identities for currently executing scripts.
     *
     * Script-local functions are ordinary function definitions registered
     * temporarily in the caller workspace; this stack lets that registration
     * attach the surrounding script's browser-hosted source identity.
     */
    private scriptSourceNameStack: (string | undefined)[] = [];

    /**
     * Interpreter exit status.
     */
    private _exitStatus: ExitStatus;

    /**
     * Last uncaught public evaluation error, exposed through `lasterror`.
     */
    private lastError?: unknown;

    /**
     * Last warning state exposed through `lastwarn`.
     *
     * Warning emission is still intentionally conservative, but keeping the
     * state here gives the public API a stable MATLAB/Octave-like contract.
     */
    private lastWarning: { message: string; identifier: string } = { message: '', identifier: '' };

    /**
     * Global warning state used by `warning("on"|"off"|"error")`.
     */
    private globalWarningState: WarningState = 'on';

    /**
     * Per-identifier warning emission overrides.
     */
    private warningIdentifierStates = new Map<string, WarningState>();

    /**
     * Interpreter exit status getter.
     */
    public get exitStatus(): ExitStatus {
        return this._exitStatus;
    }

    /**
     * Increment and decrement operator
     * @param pre `true` if prefixed. `false` if postfixed.
     * @param operation Operation (`'plus'` or `'minus'`).
     * @returns Operator function that updates an assignable expression.
     */
    private incDecOpFactory(pre: boolean, operation: 'plus' | 'minus'): IncDecOperator {
        return (tree: NodeExpr, scope: Scope): NodeInput => {
            const value = pre ? undefined : RuntimeValue.copy(this.evaluatedExpressionValue(tree, scope, `${operation === 'plus' ? 'increment' : 'decrement'} target`));
            const assignment = AST.nodeOperation(operation === 'plus' ? '+=' : '-=', this.cloneAssignmentTarget(tree), Complex.one());
            assignment.parent = tree.parent;
            this.Evaluator(assignment, scope);
            return pre ? this.evaluatedExpressionValue(tree, scope, `${operation === 'plus' ? 'increment' : 'decrement'} target`) : value;
        };
    }

    /**
     * Operator table.
     */
    private readonly opTable: Record<string, MathOperationType | IncDecOperator> = {
        '+': MathOperation.plus,
        '-': MathOperation.minus,
        '.*': MathOperation.times,
        '*': MathOperation.mtimes,
        './': MathOperation.rdivide,
        '/': MathOperation.mrdivide,
        '.\\': MathOperation.ldivide,
        '\\': MathOperation.mldivide,
        '.^': MathOperation.power,
        '^': MathOperation.mpower,
        '+_': MathOperation.uplus,
        '-_': MathOperation.uminus,
        ".'": MathOperation.transpose,
        "'": MathOperation.ctranspose,
        '<': MathOperation.lt,
        '<=': MathOperation.le,
        '==': MathOperation.eq,
        '>=': MathOperation.ge,
        '>': MathOperation.gt,
        '!=': MathOperation.ne,
        '&': MathOperation.and,
        '|': MathOperation.or,
        '!': MathOperation.not,
        '&&': MathOperation.mand,
        '||': MathOperation.mor,
        '++_': this.incDecOpFactory(true, 'plus'),
        '--_': this.incDecOpFactory(true, 'minus'),
        '_++': this.incDecOpFactory(false, 'plus'),
        '_--': this.incDecOpFactory(false, 'minus'),
    };

    private static readonly binaryOperatorMethodTable: Record<string, string> = {
        '+': 'plus',
        '-': 'minus',
        '.*': 'times',
        '*': 'mtimes',
        './': 'rdivide',
        '/': 'mrdivide',
        '.\\': 'ldivide',
        '\\': 'mldivide',
        '.^': 'power',
        '^': 'mpower',
        '<': 'lt',
        '<=': 'le',
        '==': 'eq',
        '>=': 'ge',
        '>': 'gt',
        '!=': 'ne',
        '~=': 'ne',
        '&': 'and',
        '|': 'or',
        '&&': 'and',
        '||': 'or',
    };

    private static readonly unaryOperatorMethodTable: Record<string, string> = {
        '+_': 'uplus',
        '-_': 'uminus',
        '!': 'not',
        '~': 'not',
        ".'": 'transpose',
        "'": 'ctranspose',
    };

    /**
     * Precedence definitions.
     */
    private static readonly precedence: string[][] = [
        ['min', '=', '+=', '-=', '*=', '/=', '\\='],
        ['||'],
        ['&&'],
        ['|'],
        ['&'],
        ['!=', '<', '>', '<=', '>='],
        ['+', '-'],
        ['.*', '*', './', '/', '.\\', '\\'],
        ['^', '.**', '**', ".'", "'"],
        ['!', '~', '-_', '+_'],
        ['preMax', '_.^', '_.**', '_^', '_**', "__.'", "__'", '__++'],
        ['max', '()', 'IDENT', 'ENDRANGE', ':', '<~>', '.'],
    ];

    /**
     * Operator precedence table.
     */
    public precedenceTable: { [key: string]: number };

    /**
     * Get tree node precedence.
     * @param tree Tree node.
     * @returns Node precedence.
     */
    private nodePrecedence(tree: NodeInput): number {
        if (typeof tree.type === 'number') {
            /* If `typeof tree.type === 'number'` then tree is a literal number or singleton element.  */
            if (Complex.isInstanceOf(tree)) {
                return Complex.precedence(tree, this);
            } else {
                return this.precedenceTable.max;
            }
        } else if (AST.isNodeIndexExpr(tree)) {
            const aliasTreeName = AST.isNodeIdentifier(tree.expr) ? this.context.aliasNameFunction(tree.expr.id) : '';
            return AST.isNodeIdentifier(tree.expr) &&
                aliasTreeName in this.context.builtInFunctionTable &&
                (!!this.context.builtInFunctionTable[aliasTreeName].UnparserMathML || aliasTreeName in MathML.format)
                ? this.precedenceTable.max
                : this.precedenceTable.preMax;
        } else if (tree.type === 'RANGE') {
            return tree.start_ && tree.stop_ ? this.precedenceTable.min : this.precedenceTable.max;
        } else {
            return this.precedenceTable[tree.type] || 0;
        }
    }

    /**
     * User functions.
     */
    private functionArityCallable(name: 'nargin' | 'nargout', arg: NodeInput): Callable {
        let target: NodeExpr;
        if (FunctionHandle.isInstanceOf(arg)) {
            target = arg;
        } else if (CharString.isInstanceOf(arg)) {
            const source = arg.str.trim();
            if (source.length === 0) {
                this.context.throwEvalError(`${name}: function name cannot be empty.`);
            }
            target = source.startsWith('@') ? this.functionHandleFromString(arg) : this.createResolvedFunctionHandle(source, this.context.currentScope, undefined, false, true);
        } else {
            this.context.throwSyntaxError(`${name}: argument must be a function handle or function name.`);
        }
        const callable = this.context.resolveCallable(target);
        if (!callable) {
            this.context.throwEvalError(`${name}: invalid function.`);
        }
        return callable;
    }

    private functionArgumentArity(callable: Callable): number {
        return FunctionArity.inputArity(callable);
    }

    private functionOutputArity(callable: Callable): number {
        return FunctionArity.outputArity(callable);
    }

    /**
     * Parse or resolve a textual function-handle source.
     */
    private functionHandleFromString(sourceValue: CharString, useGlobalScope = false): FunctionHandle {
        const globalScope = this.context.globalScope ?? this.context.currentScope;
        const lookupScope = useGlobalScope ? globalScope : this.context.currentScope;
        const handle = FunctionLookup.str2func(
            sourceValue.str,
            (source) => {
                const evaluated = this.evaluatedExecutionResult(this.Parse(source), globalScope);
                return evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
            },
            (message) => this.context.throwEvalError(message),
        );
        if (!handle.id || handle.closure) {
            return handle;
        }
        if (!useGlobalScope) {
            const imported = this.createResolvedFunctionHandle(handle.id, lookupScope, handle, 'importsOnly');
            if (imported.closure) {
                return imported;
            }
        }
        return this.createResolvedFunctionHandle(handle.id, globalScope, handle, 'global');
    }

    /**
     * Resolve a runtime symbol through the interpreter-owned lookup facade.
     *
     * Keeping this indirection inside `Interpreter` prevents parser/evaluator
     * code from depending directly on the exact `Context.resolveSymbol` option
     * shape and gives lookup-sensitive features one place to evolve.
     *
     * @param name Name requested by source text.
     * @param scope Lookup scope.
     * @param options Resolution switches.
     * @returns Structured symbol resolution, if any.
     */
    private resolveRuntimeSymbol(name: string, scope: Scope = this.context.currentScope, options: SymbolResolutionOptions = {}): SymbolResolution | undefined {
        return this.context.resolveSymbol(name, scope, options);
    }

    /** Resolve a function-like runtime symbol without considering variables or classes. */
    private resolveRuntimeFunction(name: string, scope: Scope = this.context.currentScope, options: SymbolResolutionOptions = {}): SymbolResolution | undefined {
        return this.resolveRuntimeSymbol(name, scope, { ...options, variables: false, classes: false });
    }

    /** Resolve a class runtime symbol without considering variables or functions. */
    private resolveRuntimeClass(name: string, scope: Scope = this.context.currentScope, options: SymbolResolutionOptions = {}): SymbolResolution | undefined {
        return this.resolveRuntimeSymbol(name, scope, { ...options, variables: false, functions: false });
    }

    /**
     * Create a named function handle using the current structured lookup layer.
     *
     * Qualified names and aliases are normalized to their runtime spelling.
     * Simple imported names keep their source spelling and rely on the captured
     * import table, matching MATLAB/Octave display behavior for `@name`.
     * When requested, user-function handles keep a lexical overlay so returned
     * handles remain bound to local/nested functions and in-scope imports.
     *
     * @param name Function name supplied by source text or a character string.
     * @param scope Lookup scope used to resolve imports and local functions.
     * @param parent Optional AST parent for the new handle.
     * @param captureLexical Whether to capture a lexical overlay for user functions.
     * @returns Named function handle.
     */
    private createResolvedFunctionHandle(
        name: string,
        scope: Scope = this.context.currentScope,
        parent?: NodeInput,
        captureLexical: boolean | 'importsOnly' | 'global' = false,
        disallowNestedResolution = false,
    ): FunctionHandle {
        const resolved = this.resolveRuntimeFunction(name, scope, { loadFunctions: false });
        const sourceResolved = resolved?.functionDefinition ? undefined : this.lookupFunctionSourceResolution(name, scope);
        const effectiveResolved = resolved ?? sourceResolved;
        const canonical = this.context.aliasNameFunction(name);
        const handleName = name.includes('.') && effectiveResolved ? effectiveResolved.resolvedName : canonical;
        const handle = FunctionHandle.create(handleName);
        handle.parent = parent;
        handle.sourceName = sourceResolved?.sourceName;
        handle.disallowNestedResolution = disallowNestedResolution;
        const importedStaticMethod = !name.includes('.') && this.resolveImportedStaticMethod(name, scope);
        const shouldCapture =
            captureLexical === true
                ? resolved?.functionDefinition?.type === 'FCNDEF' || sourceResolved?.source === 'import' || importedStaticMethod
                : captureLexical === 'importsOnly'
                  ? sourceResolved?.source === 'import' || importedStaticMethod
                  : false;
        if (shouldCapture) {
            handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
        }
        if (captureLexical === 'global') {
            handle.closure = scope;
        }
        return handle;
    }

    private localFunctionHandles(): MultiArray {
        return FunctionIntrospection.localFunctionHandles(this.context.currentFrame, this.context.currentScope);
    }

    /**
     * Copy and validate one captured workspace value before exposing it through
     * the MATLAB/Octave `functions(handle).workspace` metadata struct.
     */
    private functionHandleWorkspaceValue(value: unknown, name: string): StructureFieldValue {
        return this.runtimeExpressionValue(RuntimeValue.copy(value), `workspace ${name}`);
    }

    private functionHandleWorkspaceInfo(handle: FunctionHandle): MultiArray {
        if (!handle.closure) {
            return MultiArray.emptyArray(true);
        }

        const fields: Record<string, StructureFieldValue> = {};
        for (const [name, entry] of Object.entries(handle.closure.nameTable)) {
            if (!entry || entry.global || typeof entry.node === 'undefined' || ClassDefinition.isInstanceOf(entry.node)) {
                continue;
            }
            fields[name] = this.functionHandleWorkspaceValue(entry.node, name);
        }

        const result = MultiArray.scalarToMultiArray(new Structure(fields));
        result.isCell = true;
        return result;
    }

    private staticMethodInfo(name: string, scope: Scope): StaticMethodInfo | undefined {
        const method = this.resolveStaticMethod(name, scope);
        return method
            ? {
                  className: method.classDefinition.name,
                  methodName: method.method.name,
                  sourceName: method.method.node.sourceName,
              }
            : undefined;
    }

    private dbstackResult(args: NodeInput[]): NodeInput {
        const stack = FunctionIntrospection.dbstackResult(args, this.context.callStack, (message) => this.context.throwSyntaxError(message));
        if (this.context.requestedOutputCount > 1) {
            const workspaceIndex = MultiArray.linearLength(stack) > 0 ? 1 : 0;
            return this.valueReturnList([stack, Complex.create(workspaceIndex)]);
        }
        return stack;
    }

    /**
     * Return the MATLAB/Octave `mfilename` value for the current function.
     *
     * When a browser-hosted source provides a virtual path, plain `mfilename`
     * reports the file basename without the `.m` suffix while
     * `mfilename("fullpath")` keeps the complete virtual identity.
     */
    private currentMFilename(): string {
        const sourceName = this.currentHandleSourceName();
        if (!sourceName) {
            return this.context.currentFunctionName();
        }
        const basename = sourceName.replace(/\\/g, '/').split(/[?#]/, 1)[0].split('/').pop()?.replace(/\.m$/i, '');
        return basename || this.context.currentFunctionName();
    }

    /**
     * Return the MATLAB/Octave `mfilename("fullpath")` identity.
     *
     * For browser-hosted code, "fullpath" means the complete virtual source
     * identity supplied by the host resolver. Unlike plain `mfilename`, this
     * intentionally keeps the configured `.m`-like suffix because source
     * metadata, `functions`, and stack display share that identity.
     */
    private currentMFilenameFullPath(): string {
        return this.currentHandleSourceName() || this.context.currentFunctionName();
    }

    /**
     * Return the best virtual source identity for a handle created now.
     */
    private currentHandleSourceName(): string | undefined {
        return this.context.currentFunctionSourceName() || this.scriptSourceNameStack[this.scriptSourceNameStack.length - 1];
    }

    /**
     * Return the class context that should be captured by a handle created now.
     */
    private currentHandleClassName(): string | undefined {
        return this.context.currentClassAccessName() || undefined;
    }

    /**
     * Convert a native or interpreter error into the struct shape used by
     * MATLAB/Octave-style `catch ME` and `lasterror`.
     *
     * `InterpreterError.stackFrames` stores the most recent frame first, while
     * `dbstackResult` expects the live call-stack order and reverses it during
     * formatting. The local reversal preserves the captured thrown stack instead
     * of rebuilding it from the current catch/evaluation context.
     *
     * @param error Error object or thrown value.
     * @returns Structure with `message`, `identifier`, and `stack` fields.
     */
    private exceptionToStruct(error: unknown): Structure {
        if (Structure.isInstanceOf(error)) {
            return Structure.copy(error);
        }
        const err = error as PublicStackError;
        const publicStack =
            typeof err?.publicStack !== 'undefined'
                ? this.runtimeExpressionValue(RuntimeValue.copy(err.publicStack), 'error stack')
                : FunctionIntrospection.dbstackResult([], error instanceof InterpreterError && error.stackFrames ? error.stackFrames.slice().reverse() : this.context.callStack, (message) =>
                      this.context.throwSyntaxError(message),
                  );
        return new Structure({
            message: new CharString(err?.message ?? String(error)),
            identifier: new CharString(err?.identifier ?? ''),
            stack: publicStack,
        });
    }

    /**
     * Return the current `lasterror` value.
     *
     * MATLAB/Octave keep the last uncaught error until it is replaced or the
     * interpreter state is reset. When no error has escaped yet, the empty
     * structure uses the same fields so callers can index it without special
     * casing the initial state.
     *
     * @returns MATLAB-like last-error structure.
     */
    private lastErrorStruct(): Structure {
        return this.lastError ? this.exceptionToStruct(this.lastError) : this.emptyLastErrorStruct();
    }

    /**
     * Return the default `lasterror` structure.
     */
    private emptyLastErrorStruct(): Structure {
        return new Structure({ message: new CharString(''), identifier: new CharString(''), stack: MultiArray.emptyArray() });
    }

    /**
     * Reset `lasterror` to its initial state.
     */
    private resetLastError(): void {
        this.lastError = undefined;
    }

    /**
     * Store an error as the current MATLAB/Octave last-error state.
     *
     * Caught errors must be visible to `lasterr`/`lasterror` while the `catch`
     * block executes, matching Octave's documented try/catch behavior and the
     * legacy MATLAB diagnostic APIs.
     */
    private rememberLastError(error: unknown): Structure {
        this.lastError = error;
        return this.exceptionToStruct(error);
    }

    /**
     * Normalize a user-provided error structure for storage in `lasterror`.
     *
     * MATLAB/Octave accept structures with any subset of the public fields and
     * fill missing fields with defaults. Present `message` and `identifier`
     * fields must still be character values because they are consumed by
     * `rethrow` and catch-state introspection.
     */
    private normalizeLastErrorStruct(errorStruct: Structure): Structure {
        const field = errorStruct.field;
        const message = typeof field.message === 'undefined' ? new CharString('') : field.message;
        const identifier = typeof field.identifier === 'undefined' ? new CharString('') : field.identifier;
        const stack = typeof field.stack === 'undefined' ? MultiArray.emptyArray() : field.stack;
        if (!CharString.isInstanceOf(message) || !CharString.isInstanceOf(identifier)) {
            this.context.throwEvalError('lasterror: error structure message and identifier fields must be strings.');
        }
        return new Structure({
            message,
            identifier,
            stack: this.runtimeExpressionValue(stack, 'error stack'),
        });
    }

    /**
     * Implement `lasterror`, `lasterror("reset")`, and `lasterror(err)`.
     */
    private lastErrorResult(args: NodeInput[] = []): Structure {
        const previous = this.lastErrorStruct();
        if (args.length === 0) {
            return previous;
        }
        if (CharString.isInstanceOf(args[0]) && args[0].str === 'reset') {
            this.resetLastError();
            return previous;
        }
        if (Structure.isInstanceOf(args[0])) {
            this.lastError = this.normalizeLastErrorStruct(args[0]);
            return previous;
        }
        AST.throwInvalidCallError('lasterror');
        throw new Error('unreachable');
    }

    /**
     * Implement `lasterr`, the message/id companion to `lasterror`.
     */
    private lastErrorMessageResult(args: NodeInput[] = []): NodeReturnList {
        if (args.length > 0) {
            this.lastError = this.normalizeLastErrorStruct(
                new Structure({
                    message: this.charControlArgument(args[0], 'error message'),
                    identifier: args.length === 2 ? this.charControlArgument(args[1], 'error identifier') : new CharString(''),
                }),
            );
        }
        const current = this.lastErrorStruct();
        return this.valueReturnList([this.charControlArgument(current.field.message, 'error message'), this.charControlArgument(current.field.identifier, 'error identifier')]);
    }

    /**
     * Store the warning state returned by `lastwarn`.
     *
     * @param message Warning message.
     * @param identifier Optional warning identifier.
     */
    private setLastWarning(message: string, identifier = ''): void {
        this.lastWarning = { message, identifier };
    }

    /**
     * Reset warning state to the MATLAB/Octave default.
     */
    private resetWarningState(): void {
        this.setLastWarning('');
        this.globalWarningState = 'on';
        this.warningIdentifierStates.clear();
    }

    /**
     * Return the effective warning state for an identifier.
     */
    private warningState(identifier = 'all'): WarningState {
        if (identifier === 'last') {
            return this.warningState(this.lastWarning.identifier || 'all');
        }
        if (identifier === 'all' || identifier.length === 0) {
            return this.globalWarningState;
        }
        return this.warningIdentifierStates.get(identifier) ?? this.globalWarningState;
    }

    /**
     * Test whether a string is a supported warning state.
     */
    private isWarningState(value: string): value is WarningState {
        return value === 'on' || value === 'off' || value === 'error';
    }

    /**
     * Build the structure returned by `warning("query", id)`.
     */
    private warningStateStruct(identifier = 'all'): Structure {
        const resolvedIdentifier = identifier === 'last' ? this.lastWarning.identifier || 'all' : identifier;
        return new Structure({ identifier: new CharString(resolvedIdentifier), state: new CharString(this.warningState(resolvedIdentifier)) });
    }

    /**
     * Build a MATLAB/Octave warning-state snapshot.
     *
     * The first element always represents the global `all` state. Additional
     * entries record warning identifiers that differ from the global default or
     * that were explicitly modified during this interpreter session, matching
     * the save/restore workflow of `s = warning; warning(s)`.
     */
    private warningStateSnapshot(): Structure | MultiArray {
        const identifiers = [...this.warningIdentifierStates.keys()].sort();
        const states = [this.warningStateStruct('all'), ...identifiers.map((identifier) => this.warningStateStruct(identifier))];
        if (states.length === 1) {
            return states[0];
        }
        const result = new MultiArray([states.length, 1]);
        states.forEach((state, index) => {
            result.array[index][0] = state;
        });
        MultiArray.setType(result);
        return result;
    }

    /**
     * Read a MATLAB/Octave warning-state structure.
     */
    private warningStateStructParts(value: Structure): { identifier: string; state: WarningState } {
        const identifier = value.field.identifier;
        const state = value.field.state;
        if (!CharString.isInstanceOf(identifier) || !CharString.isInstanceOf(state) || !this.isWarningState(state.str)) {
            this.context.throwEvalError('warning: state structure must contain string identifier and state fields.');
        }
        return { identifier: identifier.str, state: state.str };
    }

    /**
     * Restore one warning state entry.
     */
    private restoreWarningState(identifier: string, state: WarningState): void {
        const targetIdentifier = identifier === 'last' ? this.lastWarning.identifier || 'all' : identifier;
        if (targetIdentifier === 'all' || targetIdentifier.length === 0) {
            this.globalWarningState = state;
        } else {
            this.warningIdentifierStates.set(targetIdentifier, state);
        }
    }

    /**
     * Restore warning state from a MATLAB/Octave-style structure scalar or array.
     */
    private restoreWarningStateStruct(value: NodeInput): NodeInput {
        let states: Structure[];
        if (Structure.isInstanceOf(value)) {
            states = [value];
        } else if (MultiArray.isInstanceOf(value) && Structure.isStructure(value)) {
            const values = MultiArray.linearize(value);
            states = values.map((item) => {
                if (!Structure.isInstanceOf(item)) {
                    AST.throwInvalidCallError('warning');
                    throw new Error('unreachable');
                }
                return item;
            });
        } else {
            AST.throwInvalidCallError('warning');
            throw new Error('unreachable');
        }
        for (const state of states) {
            const parts = this.warningStateStructParts(state);
            this.restoreWarningState(parts.identifier, parts.state);
        }
        return AST.nodeVoid();
    }

    /**
     * Apply `warning` state/query commands when the argument pattern matches.
     */
    private warningControlResult(args: NodeInput[]): NodeInput | undefined {
        if (args.length === 0) {
            return this.warningStateSnapshot();
        }
        if (args.length === 1 && (Structure.isInstanceOf(args[0]) || (MultiArray.isInstanceOf(args[0]) && Structure.isStructure(args[0])))) {
            return this.restoreWarningStateStruct(args[0]);
        }
        if (!CharString.isInstanceOf(args[0])) {
            return undefined;
        }
        const action = args[0].str.toLowerCase();
        if (!this.isWarningState(action) && action !== 'query') {
            return undefined;
        }
        if (args.length > 2 || (args.length === 2 && !CharString.isInstanceOf(args[1]))) {
            return undefined;
        }
        const identifier = args.length === 2 ? args[1].str : 'all';
        if (action === 'query') {
            return args.length === 1 ? this.warningStateSnapshot() : this.warningStateStruct(identifier);
        }
        const previous = this.warningStateStruct(identifier);
        const targetIdentifier = identifier === 'last' ? this.lastWarning.identifier || 'all' : identifier;
        this.restoreWarningState(targetIdentifier, action);
        return previous;
    }

    /**
     * Split diagnostic arguments into optional identifier, format, and values.
     *
     * A leading string containing `:` is treated as a message identifier when a
     * second string is present. Otherwise the first string is the message format.
     */
    private diagnosticMessageParts(args: NodeInput[], functionName: 'warning' | 'error'): { identifier: string; message: string } {
        return DiagnosticMessage.parts(args, functionName, (value, name) => this.charControlArgument(value, name), {
            expressionValue: (value, name) => this.expressionValue(value, name),
            unparse: (value) => this.Unparse(value),
            throwEvalError: (message) => this.context.throwEvalError(message),
        });
    }

    /**
     * Convert command-form diagnostic words to function-form arguments.
     *
     * `warning id:tag message words` and `error id:tag message words` map to
     * identifier/message calls, while ordinary words map to one message string.
     */
    private diagnosticCommandArguments(args: string[]): CharString[] {
        if (args.length > 1 && args[0].includes(':')) {
            return [new CharString(args[0]), new CharString(args.slice(1).join(' '))];
        }
        return [new CharString(args.join(' '))];
    }

    /**
     * Implement the public `warning` built-in subset.
     *
     * The current browser-first runtime records warning state instead of
     * writing to a console or warning manager. This supports the common message
     * and identifier/message forms, a small diagnostic formatting subset, and
     * the common `on`/`off`/`query` state controls.
     *
     * @param args Evaluated built-in arguments.
     * @returns Void node because warnings do not produce expression output.
     */
    private warningResult(args: NodeInput[]): NodeInput {
        const control = this.warningControlResult(args);
        if (control) {
            return control;
        }
        const { identifier, message } = this.diagnosticMessageParts(args, 'warning');
        this.setLastWarning(message, identifier);
        if (this.warningState(identifier) === 'error') {
            try {
                this.context.throwEvalError(message);
            } catch (error) {
                if (identifier) {
                    (error as Error & { identifier?: string }).identifier = identifier;
                }
                throw error;
            }
        }
        this._exitStatus = Interpreter.response.WARNING;
        return AST.nodeVoid();
    }

    /**
     * Implement the public `error` built-in subset.
     *
     * Supported MATLAB/Octave forms are `error(message)`,
     * `error(identifier, message)`, and formatted variants of those forms. The
     * thrown error keeps the current call stack through `Context.throwEvalError`,
     * and the optional identifier is attached for `catch ME` and `lasterror`.
     *
     * @param args Evaluated error arguments.
     */
    private errorResult(args: NodeInput[]): NodeInput {
        if (args.length === 1 && Structure.isInstanceOf(args[0])) {
            const message = this.charControlArgument(args[0].field.message ?? new CharString(''), 'error structure message').str;
            const identifier = this.charControlArgument(args[0].field.identifier ?? new CharString(''), 'error structure identifier').str;
            if (!message) {
                return AST.nodeVoid();
            }
            try {
                this.context.throwEvalError(message);
            } catch (error) {
                if (identifier) {
                    (error as Error & { identifier?: string }).identifier = identifier;
                }
                throw error;
            }
        }
        const { identifier, message } = this.diagnosticMessageParts(args, 'error');
        if (!identifier && !message) {
            return AST.nodeVoid();
        }
        try {
            this.context.throwEvalError(message);
        } catch (error) {
            if (identifier) {
                (error as Error & { identifier?: string }).identifier = identifier;
            }
            throw error;
        }
    }

    /**
     * Decide whether an `assert` call is the condition/message form.
     */
    private assertUsesDiagnosticForm(args: NodeInput[]): boolean {
        return args.length === 1 || (args.length >= 2 && CharString.isInstanceOf(args[1]) && !CharString.isInstanceOf(args[0]));
    }

    /**
     * Extract numeric elements for tolerance-based `assert` comparison.
     */
    private assertNumericElements(value: NodeInput, name: string): { dimensions: number[]; elements: ComplexType[] } {
        const array = MultiArray.scalarToMultiArray(value as ElementType);
        const elements = MultiArray.linearize(array);
        if (array.isCell || !elements.every(Complex.isInstanceOf)) {
            this.context.throwEvalError(`assert: ${name} must be numeric when tolerance is specified.`);
        }
        return { dimensions: array.dimension.slice(), elements: elements as ComplexType[] };
    }

    /**
     * Test numerical equality using Octave-style absolute/relative tolerance.
     */
    private assertValuesEqualWithinTolerance(actual: NodeInput, expected: NodeInput, tolerance: NodeInput): boolean {
        const actualValues = this.assertNumericElements(actual, 'actual value');
        const expectedValues = this.assertNumericElements(expected, 'expected value');
        if (actualValues.dimensions.length !== expectedValues.dimensions.length || actualValues.dimensions.some((dimension, index) => dimension !== expectedValues.dimensions[index])) {
            return false;
        }
        const toleranceValue = this.validateattributesNumericScalar(tolerance, 'assert tolerance');
        const absoluteTolerance = Math.abs(toleranceValue);
        const relative = toleranceValue < 0;
        return actualValues.elements.every((actualElement, index) => {
            const expectedElement = expectedValues.elements[index];
            const delta = Complex.abs(Complex.sub(actualElement, expectedElement));
            const deltaValue = Complex.realToNumber(delta);
            const limit = relative ? absoluteTolerance * Complex.realToNumber(Complex.abs(expectedElement)) : absoluteTolerance;
            return deltaValue <= limit;
        });
    }

    /**
     * Split comparison-form `assert` arguments into comparison and diagnostic
     * parts.
     */
    private assertComparisonParts(args: NodeInput[]): { tolerance?: NodeInput; diagnostic: NodeInput[] } {
        if (args.length <= 2) {
            return { diagnostic: [] };
        }
        if (CharString.isInstanceOf(args[2])) {
            return { diagnostic: args.slice(2) };
        }
        return { tolerance: args[2], diagnostic: args.slice(3) };
    }

    /**
     * Implement `assert(actual, expected[, tolerance][, message...])`.
     */
    private assertComparisonResult(args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('assert', args.length < 2, (message) => this.context.throwEvalError(message));
        const actual = this.expressionValue(args[0], 'assert actual value');
        const expected = this.expressionValue(args[1], 'assert expected value');
        const parts = this.assertComparisonParts(args);
        const matches = parts.tolerance ? this.assertValuesEqualWithinTolerance(actual, expected, parts.tolerance) : RuntimeEquality.valuesEqual(actual, expected);
        if (matches) {
            return AST.nodeVoid();
        }
        if (parts.diagnostic.length > 0) {
            return this.errorResult(parts.diagnostic);
        }
        this.context.throwEvalError('assertion failed: observed value does not match expected value.');
    }

    /**
     * Implement the public `assert` built-in subset.
     *
     * MATLAB/Octave treat a false condition as an error and pass the remaining
     * arguments through the same identifier/format pipeline used by `error`.
     */
    private assertResult(args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('assert', args.length === 0, (message) => this.context.throwEvalError(message));
        if (!this.assertUsesDiagnosticForm(args)) {
            return this.assertComparisonResult(args);
        }
        if (this.toBoolean(this.expressionValue(args[0], 'assert condition'))) {
            return AST.nodeVoid();
        }
        if (args.length === 1) {
            this.context.throwEvalError('assertion failed.');
        }
        return this.errorResult(args.slice(1));
    }

    /**
     * Extract MATLAB text-list arguments accepted by validation functions.
     *
     * The documented APIs accept a character vector, string scalar, string
     * array, or cell array of character vectors. The interpreter stores each as
     * `CharString` elements, so this helper normalizes the public forms without
     * losing order.
     */
    private validationTextList(value: NodeInput, functionName: string, argumentName: string): string[] {
        if (CharString.isInstanceOf(value)) {
            return [value.str];
        }
        if (MultiArray.isInstanceOf(value)) {
            const elements = MultiArray.linearize(value);
            if (elements.every(CharString.isInstanceOf)) {
                return elements.map((item) => item.str);
            }
        }
        this.context.throwEvalError(`${functionName}: ${argumentName} must be a string or cell array of strings.`);
    }

    /**
     * Extract one text item from a mixed MATLAB validation cell array.
     */
    private validationTextItem(value: NodeInput, functionName: string, argumentName: string): string {
        if (CharString.isInstanceOf(value)) {
            return value.str;
        }
        this.context.throwEvalError(`${functionName}: ${argumentName} must be a string.`);
    }

    /**
     * Return raw validation-list items, preserving non-text parameters.
     */
    private validationListItems(value: NodeInput, functionName: string, argumentName: string): NodeInput[] {
        if (CharString.isInstanceOf(value)) {
            return [value];
        }
        if (MultiArray.isInstanceOf(value)) {
            return MultiArray.linearize(value);
        }
        this.context.throwEvalError(`${functionName}: ${argumentName} must be a string or cell array.`);
    }

    /**
     * Implement MATLAB's unique-prefix, case-insensitive `validatestring`.
     */
    private validatestringResult(args: NodeInput[]): CharString {
        const candidate = this.charControlArgument(args[0], 'validatestring string').str;
        const allowed = this.validationTextList(args[1], 'validatestring', 'valid strings');
        const lowerCandidate = candidate.toLowerCase();
        const prefix = this.validatestringDiagnosticPrefix(args);
        const exactMatches = allowed.filter((item) => item.toLowerCase() === lowerCandidate);
        if (exactMatches.length > 0) {
            return new CharString(exactMatches[0]);
        }
        const matches = allowed.filter((item) => item.toLowerCase().startsWith(lowerCandidate));
        if (matches.length === 1) {
            return new CharString(matches[0]);
        }
        if (matches.length > 1) {
            this.context.throwEvalError(`${prefix} ambiguous string '${candidate}'.`);
        }
        this.context.throwEvalError(`${prefix} expected one of: ${allowed.join(', ')}.`);
    }

    /**
     * Build the optional function/variable context used by `validatestring`.
     */
    private validatestringDiagnosticPrefix(args: NodeInput[]): string {
        if (args.length < 3) {
            return 'validatestring:';
        }
        const functionName = this.charControlArgument(args[2], 'validatestring function name').str;
        if (args.length < 4) {
            return `validatestring: input for function '${functionName}'`;
        }
        const variableName = this.charControlArgument(args[3], 'validatestring variable name').str;
        if (args.length < 5) {
            return `validatestring: variable '${variableName}' for function '${functionName}'`;
        }
        const position = this.validateattributesNumericScalar(args[4], 'validatestring argument position');
        return `validatestring: argument ${position} '${variableName}' for function '${functionName}'`;
    }

    /**
     * Map public `validateattributes` attribute names to shared validator keys.
     */
    private validateattributesValidator(attribute: string): BuiltInFunctionParameterValidator | undefined {
        switch (attribute.toLowerCase()) {
            case 'scalar':
                return 'scalar';
            case 'vector':
                return 'vector';
            case 'row':
                return 'rowVector';
            case 'column':
                return 'columnVector';
            case '2d':
                return 'matrix2d';
            case 'square':
                return 'squareMatrix';
            case 'nonempty':
                return 'nonempty';
            case 'empty':
                return 'empty';
            case 'real':
                return 'real';
            case 'finite':
                return 'finite';
            case 'nonnan':
                return 'nonnan';
            case 'positive':
                return 'positive';
            case 'nonnegative':
                return 'nonnegative';
            case 'negative':
                return 'negative';
            case 'nonpositive':
                return 'nonpositive';
            case 'nonzero':
                return 'nonzero';
            case 'integer':
                return 'integer';
            case 'nonsparse':
                return 'nonsparse';
            case 'sparse':
                return 'sparse';
            default:
                return undefined;
        }
    }

    /**
     * Return dimensions as `validateattributes` should see them.
     *
     * The runtime stores both character vectors and string scalars in
     * `CharString`; MATLAB treats string scalars as `1x1`, while character
     * vectors remain `1xN`.
     */
    private validateattributesDimensions(value: NodeInput): number[] {
        return CharString.isString(value) ? [1, 1] : RuntimeValue.dimensions(value);
    }

    /**
     * Return real numeric elements for attributes that inspect values directly.
     */
    private validateattributesRealNumericElements(value: NodeInput, attribute: string): ComplexType[] {
        const elements = MultiArray.linearize(MultiArray.scalarToMultiArray(value as ElementType));
        if (!elements.every((item) => Complex.isInstanceOf(item) && Complex.imagIsZero(item))) {
            this.context.throwEvalError(`validateattributes: ${attribute} requires real numeric input.`);
        }
        return elements as ComplexType[];
    }

    /**
     * Extract a real numeric scalar used as a `validateattributes` parameter.
     */
    private validateattributesNumericScalar(value: NodeInput, attribute: string): number {
        const scalar = MultiArray.isInstanceOf(value) && RuntimeValue.isScalar(value) ? MultiArray.firstElement(value) : value;
        if (!Complex.isInstanceOf(scalar) || !Complex.imagIsZero(scalar)) {
            this.context.throwEvalError(`validateattributes: attribute '${attribute}' parameter must be a real numeric scalar.`);
        }
        return Complex.realToNumber(scalar);
    }

    /**
     * Extract a real numeric vector used by `validateattributes('size', ...)`.
     */
    private validateattributesNumericVector(value: NodeInput, attribute: string): number[] {
        const array = MultiArray.scalarToMultiArray(value as ElementType);
        const elements = MultiArray.linearize(array);
        if (array.isCell || !RuntimeValue.isVector(array) || !elements.every((item) => Complex.isInstanceOf(item) && Complex.imagIsZero(item))) {
            this.context.throwEvalError(`validateattributes: attribute '${attribute}' parameter must be a real numeric vector.`);
        }
        return elements.map((item) => Complex.realToNumber(item as ComplexType));
    }

    /**
     * Test all numeric elements of a value against a scalar comparison.
     */
    private validateattributesNumericComparison(value: NodeInput, attribute: string, limit: number): boolean {
        const elements = this.validateattributesRealNumericElements(value, attribute);
        switch (attribute) {
            case '>':
                return elements.every((item) => Complex.realGreaterThan(item, limit));
            case '>=':
                return elements.every((item) => Complex.realGreaterThanOrEqualTo(item, limit));
            case '<':
                return elements.every((item) => Complex.realLessThan(item, limit));
            case '<=':
                return elements.every((item) => Complex.realLessThanOrEqualTo(item, limit));
            default:
                return false;
        }
    }

    /**
     * Test MATLAB/Octave monotonic attributes independently for each stored
     * column.  `MultiArray` stacks pages in the physical row axis, so each
     * page-stride row group represents the rows of one logical page.
     */
    private validateattributesMonotonicColumns(value: NodeInput, attribute: string): boolean {
        const array = MultiArray.scalarToMultiArray(value as ElementType);
        if (array.isCell) {
            this.context.throwEvalError(`validateattributes: ${attribute} requires real numeric input.`);
        }
        for (let pageRow = 0; pageRow < array.array.length; pageRow += array.dimension[0]) {
            for (let column = 0; column < array.dimension[1]; column++) {
                for (let row = 1; row < array.dimension[0]; row++) {
                    const previous = array.array[pageRow + row - 1][column];
                    const current = array.array[pageRow + row][column];
                    if (!Complex.isInstanceOf(previous) || !Complex.imagIsZero(previous) || !Complex.isInstanceOf(current) || !Complex.imagIsZero(current)) {
                        this.context.throwEvalError(`validateattributes: ${attribute} requires real numeric input.`);
                    }
                    const ok =
                        attribute === 'increasing'
                            ? Complex.realGreaterThan(current, Complex.realToNumber(previous))
                            : attribute === 'decreasing'
                              ? Complex.realLessThan(current, Complex.realToNumber(previous))
                              : attribute === 'nondecreasing'
                                ? Complex.realGreaterThanOrEqualTo(current, Complex.realToNumber(previous))
                                : Complex.realLessThanOrEqualTo(current, Complex.realToNumber(previous));
                    if (!ok) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Test non-parameterized `validateattributes` attributes not covered by the
     * shared validator table.
     */
    private validateattributesSpecialAttribute(value: NodeInput, attribute: string): boolean | undefined {
        const lowerAttribute = attribute.toLowerCase();
        switch (lowerAttribute) {
            case '3d':
                return this.validateattributesDimensions(value).length <= 3;
            case 'scalartext':
                return (
                    CharString.isInstanceOf(value) ||
                    (MultiArray.isInstanceOf(value) && !value.isCell && RuntimeValue.isScalar(value) && CharString.isInstanceOf(MultiArray.firstElement(value)))
                );
            case 'even':
            case 'odd': {
                const elements = this.validateattributesRealNumericElements(value, attribute);
                return elements.every((item) => Complex.realIsInteger(item) && Math.abs(Complex.realToNumber(item) % 2) === (lowerAttribute === 'odd' ? 1 : 0));
            }
            case 'binary': {
                const elements = this.validateattributesRealNumericElements(value, attribute);
                return elements.every((item) => Complex.realEquals(item, 0) || Complex.realEquals(item, 1));
            }
            case 'diag':
            case 'diagonal': {
                const dimensions = this.validateattributesDimensions(value);
                if (dimensions.length !== 2 || dimensions[0] !== dimensions[1]) {
                    return false;
                }
                const array = MultiArray.scalarToMultiArray(value as ElementType);
                if (array.isCell) {
                    this.context.throwEvalError(`validateattributes: ${attribute} requires real numeric input.`);
                }
                for (let row = 0; row < dimensions[0]; row++) {
                    for (let column = 0; column < dimensions[1]; column++) {
                        const item = array.array[row][column];
                        if (!Complex.isInstanceOf(item) || !Complex.imagIsZero(item)) {
                            this.context.throwEvalError(`validateattributes: ${attribute} requires real numeric input.`);
                        }
                        if (row !== column && !Complex.realEquals(item, 0)) {
                            return false;
                        }
                    }
                }
                return true;
            }
            case 'increasing':
            case 'decreasing':
            case 'nondecreasing':
            case 'nonincreasing':
                return this.validateattributesMonotonicColumns(value, lowerAttribute);
            default:
                return undefined;
        }
    }

    /**
     * Test one shared `validateattributes` validator with public string-scalar
     * shape semantics.
     */
    private validateattributesMatchesValidator(value: NodeInput, validator: BuiltInFunctionParameterValidator): boolean {
        if (validator === 'scalar' && CharString.isString(value)) {
            return true;
        }
        return FunctionValidation.matchesBuiltInValidator(value as RuntimeExpressionValue, validator);
    }

    /**
     * Apply one parameterized `validateattributes` attribute.
     */
    private validateattributesParameterizedAttribute(value: NodeInput, attribute: string, parameter: NodeInput, subject: string): void {
        const dimensions = this.validateattributesDimensions(value);
        const lowerAttribute = attribute.toLowerCase();
        switch (lowerAttribute) {
            case 'size': {
                const expected = this.validateattributesNumericVector(parameter, attribute);
                const matches =
                    expected.length <= dimensions.length &&
                    expected.every((dimension, index) => Number.isNaN(dimension) || dimensions[index] === dimension) &&
                    dimensions.slice(expected.length).every((dimension) => dimension === 1);
                if (!matches) {
                    this.context.throwEvalError(`validateattributes: ${subject} must have size ${expected.join('x')}.`);
                }
                return;
            }
            case 'numel': {
                const expected = this.validateattributesNumericVector(parameter, attribute);
                if (!expected.includes(RuntimeValue.elementCount(value))) {
                    this.context.throwEvalError(`validateattributes: ${subject} must have ${expected.join(' or ')} elements.`);
                }
                return;
            }
            case 'numrows':
            case 'nrows': {
                const expected = this.validateattributesNumericScalar(parameter, attribute);
                if (dimensions[0] !== expected) {
                    this.context.throwEvalError(`validateattributes: ${subject} must have ${expected} rows.`);
                }
                return;
            }
            case 'numcols':
            case 'ncols': {
                const expected = this.validateattributesNumericScalar(parameter, attribute);
                if (dimensions[1] !== expected) {
                    this.context.throwEvalError(`validateattributes: ${subject} must have ${expected} columns.`);
                }
                return;
            }
            case 'ndims': {
                const expected = this.validateattributesNumericScalar(parameter, attribute);
                if (dimensions.length !== expected) {
                    this.context.throwEvalError(`validateattributes: ${subject} must have ${expected} dimensions.`);
                }
                return;
            }
            case '>':
            case '>=':
            case '<':
            case '<=': {
                const limit = this.validateattributesNumericScalar(parameter, attribute);
                if (!this.validateattributesNumericComparison(value, attribute, limit)) {
                    this.context.throwEvalError(`validateattributes: ${subject} must be ${attribute} ${limit}.`);
                }
                return;
            }
            default:
                this.context.throwEvalError(`validateattributes: unsupported attribute '${attribute}'.`);
        }
    }

    /**
     * Build the subject text used by `validateattributes` diagnostics.
     */
    private validateattributesSubject(args: NodeInput[]): string {
        if (args.length >= 6) {
            const functionName = this.charControlArgument(args[3], 'validateattributes function name').str;
            const variableName = this.charControlArgument(args[4], 'validateattributes variable name').str;
            const position = this.validateattributesNumericScalar(args[5], 'validateattributes argument position');
            return `argument ${position} '${variableName}' for function '${functionName}'`;
        }
        if (args.length >= 5) {
            return this.charControlArgument(args[4], 'validateattributes variable name').str;
        }
        if (args.length >= 4) {
            if (!CharString.isInstanceOf(args[3])) {
                const position = this.validateattributesNumericScalar(args[3], 'validateattributes argument position');
                return `argument ${position}`;
            }
            return `input for function '${this.charControlArgument(args[3], 'validateattributes function name').str}'`;
        }
        return 'input';
    }

    /**
     * Test a `validateattributes` class constraint against runtime values.
     */
    private validateattributesMatchesClass(value: NodeInput, className: string): boolean {
        switch (className.toLowerCase()) {
            case 'numeric':
                return FunctionValidation.matchesBuiltInValidator(value as RuntimeExpressionValue, 'numeric');
            case 'float':
                return FunctionValidation.matchesBuiltInValidator(value as RuntimeExpressionValue, 'float');
            case 'integer':
                return FunctionValidation.matchesBuiltInValidator(value as RuntimeExpressionValue, 'integer');
            case 'object':
                return ClassInstance.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && MultiArray.linearize(value).some(ClassInstance.isInstanceOf));
            default:
                return FunctionValidation.matchesClass(value as RuntimeExpressionValue, className) || this.valueIsRuntimeClass(value, className);
        }
    }

    /**
     * Implement the common MATLAB/Octave `validateattributes` forms.
     *
     * The browser runtime has no sparse storage type; sparse-compatible APIs are
     * kept explicit through the shared validator, where `sparse` always fails
     * and `nonsparse` always succeeds.
     */
    private validateattributesResult(args: NodeInput[]): NodeInput {
        const value = this.expressionValue(args[0], 'validateattributes value');
        const classNames = this.validationTextList(args[1], 'validateattributes', 'class list');
        const attributes = this.validationListItems(args[2], 'validateattributes', 'attribute list');
        const subject = this.validateattributesSubject(args);
        if (classNames.length > 0 && !classNames.some((className) => this.validateattributesMatchesClass(value, className))) {
            this.context.throwEvalError(`validateattributes: ${subject} must be one of: ${classNames.join(', ')}.`);
        }
        for (let index = 0; index < attributes.length; index++) {
            const attribute = this.validationTextItem(attributes[index], 'validateattributes', 'attribute');
            const validator = this.validateattributesValidator(attribute);
            if (!validator) {
                const specialMatch = this.validateattributesSpecialAttribute(value, attribute);
                if (typeof specialMatch !== 'undefined') {
                    if (!specialMatch) {
                        this.context.throwEvalError(`validateattributes: ${subject} must be ${attribute}.`);
                    }
                    continue;
                }
                if (index + 1 >= attributes.length) {
                    this.context.throwEvalError(`validateattributes: attribute '${attribute}' requires a parameter.`);
                }
                this.validateattributesParameterizedAttribute(value, attribute, attributes[++index], subject);
                continue;
            }
            if (!this.validateattributesMatchesValidator(value, validator)) {
                this.context.throwEvalError(`validateattributes: ${subject} must be ${attribute}.`);
            }
        }
        return AST.nodeVoid();
    }

    /**
     * Return supported public `mustBe*` call arity limits.
     */
    private mustBeArity(validator: string): { min: number; max: number } {
        switch (validator) {
            case 'mustBeGreaterThan':
            case 'mustBeGreaterThanOrEqual':
            case 'mustBeLessThan':
            case 'mustBeLessThanOrEqual':
            case 'mustBeMember':
            case 'mustBeA':
            case 'mustBeUnderlyingType':
                return { min: 2, max: 2 };
            case 'mustBeInRange':
            case 'mustBeBetween':
                return { min: 3, max: 4 };
            default:
                return { min: 1, max: 1 };
        }
    }

    /**
     * Implement public MATLAB `mustBe*` validator functions.
     */
    private mustBeResult(validator: string, args: NodeInput[]): NodeInput {
        const arity = this.mustBeArity(validator);
        AST.throwInvalidCallError(validator, args.length < arity.min || args.length > arity.max, (message) => this.context.throwEvalError(message));
        const value = this.runtimeExpressionValue(args[0], `${validator} value`);
        const bounds = args.slice(1).map((arg, index) => this.runtimeExpressionValue(arg, `${validator} bound ${index + 1}`));
        if (validator === 'mustBeA') {
            const classNames = this.validationTextList(bounds[0], validator, 'class list');
            if (!classNames.some((className) => this.valueMatchesValidationClass(value, className, this.context.currentScope))) {
                this.context.throwEvalError(`${validator} validation failed for 'input': ${validator}.`);
            }
            return AST.nodeVoid();
        }
        if (validator === 'mustBeUnderlyingType') {
            const classNames = this.validationTextList(bounds[0], validator, 'type list');
            if (!classNames.includes(FunctionValidation.underlyingType(value))) {
                this.context.throwEvalError(`${validator} validation failed for 'input': ${validator}.`);
            }
            return AST.nodeVoid();
        }
        FunctionArguments.validateArgumentFunction(
            'input',
            value,
            validator,
            bounds,
            (message) => this.context.throwEvalError(message),
            (message) => this.context.throwSyntaxError(message),
            this.pathValidationCallbacks,
            validator,
        );
        return AST.nodeVoid();
    }

    /**
     * Build registry entries for public `mustBe*` validators.
     */
    private mustBeFunctionEntries(): Record<string, FunctionSignatureEntry> {
        return Object.fromEntries(
            Interpreter.publicArgumentValidators.map((validator) => [
                validator,
                {
                    func: (...args: NodeInput[]): NodeInput => this.mustBeResult(validator, args),
                    signature: { inputs: { arity: -1, min: 1, parameters: [{ name: 'argument', variadic: true }] }, outputs: { arity: 0 } },
                },
            ]),
        );
    }

    /**
     * Normalize command-form results returned by host-provided integrations.
     *
     * External command handlers often return plain JavaScript primitives. The
     * interpreter boundary converts those values into ordinary runtime nodes so
     * command-form parsing can be used safely by browser-hosted commands such
     * as `help`.
     */
    private commandWordListResult(value: ReturnType<CommandWordListFunction>): NodeInput | undefined {
        if (typeof value === 'undefined') {
            return undefined;
        }
        if (typeof value === 'string') {
            return new CharString(value);
        }
        if (typeof value === 'number') {
            return Complex.create(value);
        }
        if (typeof value === 'boolean') {
            return value ? Complex.true() : Complex.false();
        }
        return value;
    }

    /**
     * Implement `rethrow(ME)` for MATLAB/Octave-style caught error structs.
     *
     * The current runtime represents `catch ME` as a structure with `message`,
     * `identifier`, and `stack` fields. `rethrow` validates that shape and
     * raises a new evaluation error while preserving the public message and
     * identifier fields used by subsequent `catch` blocks and `lasterror`.
     *
     * @param errorStruct Error structure captured by a `catch` identifier.
     */
    private rethrowResult(errorStruct: NodeInput): never {
        if (!Structure.isInstanceOf(errorStruct)) {
            this.context.throwEvalError('rethrow: input must be an error structure.');
        }
        const message = errorStruct.field.message;
        const identifier = errorStruct.field.identifier;
        const stack = errorStruct.field.stack;
        if (!CharString.isInstanceOf(message) || !CharString.isInstanceOf(identifier) || typeof stack === 'undefined') {
            this.context.throwEvalError('rethrow: input must be an error structure.');
        }
        const publicStack = this.runtimeExpressionValue(stack, 'error stack');
        try {
            this.context.throwEvalError(message.str);
        } catch (error) {
            (error as PublicStackError).publicStack = publicStack;
            if (identifier.str) {
                (error as PublicStackError).identifier = identifier.str;
            }
            throw error;
        }
    }

    /**
     * Implement `lastwarn` getter/setter behavior.
     *
     * With no arguments it returns the current message and identifier. With one
     * or two string arguments it updates the stored warning state before
     * returning it, matching the MATLAB/Octave convention used by tests and
     * user code.
     *
     * @param args Optional message and identifier setter arguments.
     * @returns Comma-separated return list `[message, identifier]`.
     */
    private lastWarningResult(args: NodeInput[] = []): NodeReturnList {
        if (args.length === 1) {
            this.setLastWarning(this.charControlArgument(args[0], 'warning message').str);
        } else if (args.length === 2) {
            this.setLastWarning(this.charControlArgument(args[0], 'warning message').str, this.charControlArgument(args[1], 'warning identifier').str);
        }
        return this.valueReturnList([new CharString(this.lastWarning.message), new CharString(this.lastWarning.identifier)]);
    }

    /**
     * Implement MATLAB/Octave `deal` output distribution.
     *
     * With one input, every requested output receives that value. With multiple
     * inputs, a scalar-output call returns the first value; multiple-output
     * calls must match the input count and distribute values positionally.
     */
    private dealResult(values: NodeInput[]): NodeReturnList {
        const outputMask = this.context.requestedOutputMask(Math.max(this.context.requestedOutputCount, values.length));
        const outputIsRequested = (index: number): boolean => outputMask[index] ?? true;
        return AST.nodeCommaSeparatedReturnList(
            values.length,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                const value = evaluated[`out${index}`];
                if (typeof value === 'undefined') {
                    AST.throwErrorIfGreaterThanReturnList(index, index + 1, (message) => this.context.throwEvalError(message));
                }
                return value;
            },
            (length: number): ReturnHandlerResult => {
                if (values.length !== 1 && length !== 1 && length !== values.length) {
                    this.context.throwEvalError('deal: nargin and nargout must match unless there is exactly one input.');
                }
                const out: ReturnHandlerResult = { length };
                for (let index = 0; index < length; index++) {
                    if (!outputIsRequested(index)) {
                        continue;
                    }
                    const value = values.length === 1 ? values[0] : values[index];
                    out[`out${index}`] = this.returnListValue(value, `out${index + 1}`);
                }
                return out;
            },
        );
    }

    /**
     * Read one positive integer index for output-selection helpers.
     */
    private positiveIntegerIndex(value: NodeInput, name: string): number {
        const scalar = MultiArray.isInstanceOf(value) && MultiArray.isScalar(value) ? MultiArray.firstElement(value) : value;
        if (!Complex.isInstanceOf(scalar) || !Complex.imagIsZero(scalar)) {
            this.context.throwEvalError(`${name} must be a positive integer.`);
        }
        const index = Complex.realToNumber(scalar);
        if (!Number.isInteger(index) || index < 1) {
            this.context.throwEvalError(`${name} must be a positive integer.`);
        }
        return index;
    }

    /**
     * Read scalar or vector output indexes for `nthargout`.
     */
    private nthargoutIndexes(value: NodeInput): { indexes: number[]; vector: boolean } {
        if (!MultiArray.isInstanceOf(value)) {
            return { indexes: [this.positiveIntegerIndex(value, 'nthargout index')], vector: false };
        }
        const values = MultiArray.linearize(value);
        if (values.length === 0) {
            this.context.throwEvalError('nthargout index must be a positive integer.');
        }
        return { indexes: values.map((item) => this.positiveIntegerIndex(item, 'nthargout index')), vector: values.length > 1 };
    }

    /**
     * Resolve the callable argument accepted by `nthargout`.
     */
    private nthargoutCallable(value: NodeInput): Callable {
        let target = this.expressionValue(value, 'nthargout function');
        if (CharString.isInstanceOf(target)) {
            const source = target.str.trim();
            if (source.length === 0) {
                this.context.throwEvalError('nthargout: function name cannot be empty.');
            }
            target = source.startsWith('@') ? this.functionHandleFromString(target) : this.createResolvedFunctionHandle(source, this.context.currentScope, undefined, false, true);
        }
        const callable = this.context.resolveCallable(target);
        if (!callable) {
            this.context.throwEvalError('nthargout: function must be a function handle or function name.');
        }
        return callable;
    }

    /**
     * Implement Octave-compatible `nthargout`.
     */
    private nthargoutResult(args: NodeInput[]): NodeInput {
        const { indexes, vector } = this.nthargoutIndexes(args[0]);
        const hasExplicitOutputCount =
            args.length >= 3 && Complex.isInstanceOf(MultiArray.isInstanceOf(args[1]) && MultiArray.isScalar(args[1]) ? MultiArray.firstElement(args[1]) : args[1]);
        const totalOutputCount = hasExplicitOutputCount ? this.positiveIntegerIndex(args[1], 'nthargout total output count') : Math.max(...indexes);
        if (totalOutputCount < Math.max(...indexes)) {
            this.context.throwEvalError('nthargout total output count must be at least the largest requested output index.');
        }
        const functionArgIndex = hasExplicitOutputCount ? 2 : 1;
        const callable = this.nthargoutCallable(args[functionArgIndex]);
        this.context.pushRequestedOutputCount(totalOutputCount);
        this.context.pushRequestedOutputMask(Array.from({ length: totalOutputCount }, () => true));
        let called: NodeInput;
        try {
            called = this.context.callCallable(callable, this.callArgumentValues(args.slice(functionArgIndex + 1), 'nthargout'), AST.nodeIdentifier('nthargout'));
        } finally {
            this.context.popRequestedOutputMask();
            this.context.popRequestedOutputCount();
        }
        const returnList = AST.ensureReturnList(this.expressionValue(called, 'nthargout result'));
        const evaluated = returnList.handler(totalOutputCount);
        const selected = indexes.map((index) => this.returnListValue(returnList.selector(evaluated, index - 1), `nthargout output ${index}`));
        if (!vector) {
            return selected[0];
        }
        const result = MultiArray.toRowVector(selected);
        result.isCell = true;
        return result;
    }

    /**
     * Validate one evaluated value before exposing it as an ordinary expression.
     */
    private expressionValue(value: unknown, name: string): NodeExpr {
        return expressionValue(value, name, 'Expression value', (message) => this.context.throwEvalError(message));
    }

    /**
     * Validate an evaluated value that must be stored in runtime data
     * containers such as structures.
     */
    private runtimeExpressionValue(value: unknown, name: string): RuntimeExpressionValue {
        return runtimeExpressionValue(value, name, 'Expression value', (message) => this.context.throwEvalError(message));
    }

    /**
     * Evaluate an expression, reduce return-list carriers, and validate the
     * resulting value before it crosses an interpreter expression boundary.
     */
    private evaluatedExpressionValue(tree: NodeExpr, scope: Scope, name: string): NodeExpr {
        return this.expressionValue(AST.reduceToFirstIfReturnList(this.Evaluator(tree, scope)), name);
    }

    /**
     * Evaluate one executable AST node and normalize lazy return-list carriers.
     *
     * This is intentionally broader than `evaluatedExpressionValue`: block and
     * top-level execution may legitimately produce `LIST`, `VOID`, or control
     * carrier nodes that are not ordinary expression values.
     */
    private evaluatedExecutionResult(tree: NodeInput, scope: Scope): NodeInput {
        return AST.reduceToFirstIfReturnList(this.Evaluator(tree, scope));
    }

    /**
     * Read a scope entry and validate it before reusing it as an expression.
     */
    private scopedExpressionValue(scope: Scope, id: string, name: string): NodeExpr {
        const entry = scope.resolveName(id);
        if (!entry || typeof entry.node === 'undefined') {
            this.context.throwEvalError(`internal error: missing scoped expression '${id}'.`);
        }
        return this.expressionValue(entry.node, name);
    }

    /**
     * Read a scope entry that must contain a native array value.
     */
    private scopedMultiArrayValue(scope: Scope, id: string, name: string): MultiArray {
        const value = this.scopedExpressionValue(scope, id, name);
        if (!MultiArray.isInstanceOf(value)) {
            this.context.throwEvalError(`internal error: scoped expression '${id}' is not an array.`);
        }
        return value;
    }

    /**
     * Validate evaluated variadic call arguments before forwarding them.
     *
     * @param values Runtime arguments after ordinary evaluator reduction.
     * @param prefix Diagnostic prefix used to identify the failing argument.
     * @returns Arguments narrowed to expression values.
     */
    private callArgumentValues(values: NodeInput[], prefix: string): ExpressionBoundaryValue[] {
        return values.map((value, index) => this.expressionValue(value, `${prefix}${index + 1}`));
    }

    /**
     * Validate a built-in control argument that must be a character string.
     *
     * @param value Candidate argument.
     * @param name Diagnostic role name.
     * @returns Validated character string.
     */
    private charControlArgument(value: unknown, name: string): CharString {
        const expression = this.expressionValue(value, name);
        if (!CharString.isInstanceOf(expression)) {
            this.context.throwEvalError(`${name} must be a character string.`);
        }
        return expression;
    }

    /**
     * Validate a list whose elements must all be character strings.
     *
     * MATLAB Set/Get APIs accept property-name cell arrays. This helper keeps
     * the cell-content validation explicit after `MultiArray.linearize`.
     *
     * @param values Candidate cell contents.
     * @param name Diagnostic role name.
     * @returns The same values narrowed to character strings.
     */
    private charStringList(values: unknown[], name: string): CharString[] {
        if (!values.every(CharString.isInstanceOf)) {
            this.context.throwEvalError(`${name} must contain character strings.`);
        }
        return values;
    }

    /**
     * Validate a built-in control argument that must be a function handle.
     *
     * @param value Candidate argument.
     * @param name Diagnostic role name.
     * @returns Validated function handle.
     */
    private functionHandleControlArgument(value: unknown, name: string): FunctionHandle {
        const expression = this.expressionValue(value, name);
        if (!FunctionHandle.isInstanceOf(expression)) {
            this.context.throwEvalError(`${name} must be a function handle.`);
        }
        return expression;
    }

    /**
     * Validate an optional boolean-like control argument.
     *
     * @param value Candidate argument.
     * @param name Diagnostic role name.
     * @returns JavaScript boolean following MATLAB/Octave truthiness.
     */
    private booleanControlArgument(value: unknown, name: string): boolean {
        return this.toBoolean(this.expressionValue(value, name));
    }

    /**
     * Validate worker-count expressions accepted by sequential parallel fallbacks.
     *
     * MATLAB requires `parfor(..., M)` to use a nonnegative integer worker
     * limit. `spmd(n)` and `spmd(m,n)` use the same numeric count shape, with
     * zero selecting local execution in environments without workers.
     *
     * @param value Evaluated worker-count expression.
     * @param name Diagnostic role name.
     * @returns Validated worker count.
     */
    private workerCountControlArgument(value: unknown, name: string): number {
        const expression = this.expressionValue(value, name);
        const scalar = MultiArray.isScalar(expression) ? MultiArray.firstElement(expression) : expression;
        if (!Complex.isInstanceOf(scalar) || Complex.imagToNumber(scalar) !== 0) {
            this.context.throwEvalError(`${name} must be a nonnegative integer.`);
        }
        const count = Complex.realToNumber(scalar);
        if (!Number.isFinite(count) || !Number.isInteger(count) || count < 0) {
            this.context.throwEvalError(`${name} must be a nonnegative integer.`);
        }
        return count;
    }

    /**
     * Validate runtime values before forwarding them to user-defined class methods.
     */
    private classMethodArgumentValues(values: NodeInput[], prefix: string): ExpressionBoundaryValue[] {
        return values.map((value, index) => this.expressionValue(value, `${prefix}${index + 1}`));
    }

    /**
     * Invoke one class instance method and reduce lazy return-list carriers at
     * the class-dispatch boundary.
     */
    private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: ExpressionBoundaryValue[], parent: NodeInput): NodeInput {
        return AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, args, parent));
    }

    /**
     * Invoke one class method with an explicit output count and reduce the
     * scalar result expected by helper protocols such as `numArgumentsFromSubscript`.
     */
    private reducedClassMethodResultWithOutputCount(
        instance: ClassInstance,
        method: ClassMethodDefinition,
        args: ExpressionBoundaryValue[],
        parent: NodeInput,
        outputCount: number,
    ): NodeInput {
        return AST.reduceToFirstIfReturnList(this.callClassInstanceMethodWithOutputCount(instance, method, args, parent, outputCount));
    }

    /**
     * Validate the object returned by class `subsasgn` overloads.
     */
    private classSubsasgnResult(instance: ClassInstance, method: ClassMethodDefinition, args: ExpressionBoundaryValue[], parent: NodeInput): ClassInstance {
        const updated = this.reducedClassMethodResult(instance, method, args, parent);
        if (!ClassInstance.isInstanceOf(updated)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        if (updated.classDefinition !== instance.classDefinition && !updated.classDefinition.isSubclassOf(instance.classDefinition)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        return updated;
    }

    /**
     * Normalize a value produced by assignment RHS evaluation before storing it
     * into a name, field, or object property.
     */
    private reducedAssignmentValue(value: NodeInput): NodeInput {
        return AST.reduceToFirstIfReturnList(value);
    }

    /**
     * Normalize and validate an assignment RHS before storing it in a runtime
     * structure field.
     */
    private structureAssignmentValue(value: NodeInput, name: string): RuntimeExpressionValue {
        return this.runtimeExpressionValue(this.reducedAssignmentValue(value), name);
    }

    /**
     * Store a field-assignment value, scattering compound structure-array
     * results when the operation produced one value per target element.
     */
    private assignStructureFieldValue(target: Structure | MultiArray, field: string[], value: RuntimeExpressionValue, scatterArrayValue: boolean): void {
        if (scatterArrayValue && MultiArray.isInstanceOf(target) && Structure.isStructure(target)) {
            const elements = Structure.structureElements(target);
            const values = MultiArray.isInstanceOf(value) ? MultiArray.linearize(value) : [value];
            if (values.length === elements.length) {
                elements.forEach((structure, index) => {
                    Structure.setNewField(structure, field, this.runtimeExpressionValue(values[index], `field ${field.join('.')} element ${index + 1}`));
                });
                return;
            }
        }
        Structure.setNewField(target, field, value);
    }

    /**
     * Reduce values produced by scalar indexing/dispatch paths before checking
     * their runtime shape or class.
     */
    private reducedIndexingResult(value: NodeInput): NodeInput {
        return AST.reduceToFirstIfReturnList(value);
    }

    /**
     * Validate and linearize values before assigning them to object arrays.
     */
    private assignmentValues(value: unknown, prefix: string): NodeExpr[] {
        return MultiArray.linearize(this.expressionValue(value, prefix)).map((item, index) => this.expressionValue(item, `${prefix}${index + 1}`));
    }

    /**
     * Prepare a value for distribution across selected object-property paths.
     *
     * A tail descriptor means the assignment targets an indexed value inside
     * each selected property. In that position `[]` is a scalar deletion value
     * to apply per target, not a zero-length list to distribute.
     */
    private classPropertyPathAssignmentValues(value: NodeInput, selectedCount: number, chain: ClassPropertyDescriptorChain): NodeExpr[] {
        if (selectedCount === 1 || (chain.tailDescriptors && chain.tailDescriptors.length > 0 && MultiArray.isInstanceOf(value) && MultiArray.isEmpty(value))) {
            return [this.expressionValue(value, 'assignment')];
        }
        return this.assignmentValues(value, 'assignment');
    }

    /**
     * Validate a sequence before storing it in an AST expression list.
     */
    private expressionList(values: unknown[], prefix: string): NodeExpr[] {
        return values.map((value, index) => this.expressionValue(value, `${prefix}${index + 1}`));
    }

    /**
     * Validate and linearize an expression value without crossing the generic
     * `MathObject` operation surface.
     */
    private linearExpressionValues(value: unknown, prefix: string): NodeExpr[] {
        const expression = this.expressionValue(value, prefix);
        return MultiArray.isInstanceOf(expression) ? MultiArray.linearize(expression).map((item, index) => this.expressionValue(item, `${prefix}${index + 1}`)) : [expression];
    }

    /**
     * Validate and copy one expression value through the runtime copy protocol.
     */
    private copyExpressionValue(value: unknown, name: string): NodeExpr {
        const expression = this.expressionValue(value, name);
        return this.expressionValue(RuntimeValue.copy(expression), name);
    }

    /**
     * Expand a `for` loop expression into the sequence assigned to the target.
     *
     * MATLAB/Octave `for` assignment iterates over columns. Numeric row vectors
     * and scalars produce scalar loop values, while matrices and cell arrays
     * produce one column value per iteration. Cell columns remain cell arrays;
     * their contents are not unwrapped by the loop assignment.
     *
     * @param value Evaluated loop expression.
     * @param target Loop assignment target.
     * @returns Values assigned on each loop iteration.
     */
    private forLoopValues(value: NodeInput, target: NodeExpr): NodeExpr[] {
        if (Structure.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && Structure.isStructure(value))) {
            const targetWidth = MultiArray.isRowVector(target) ? MultiArray.linearize(this.expressionValue(target, 'for target')).length : 1;
            const elements = Structure.structureElements(value);
            if (elements.length === 0) {
                return [];
            }
            const firstStructure = elements[0];
            return Object.keys(firstStructure.field).map((field) => {
                const valueExpression = this.expressionValue(Structure.getField(value, [field]), field);
                return targetWidth > 1 ? this.expressionValue(new MultiArray([1, 2], [[valueExpression, CharString.create(field)]]), field) : valueExpression;
            });
        }
        if (CharString.isInstanceOf(value)) {
            return value.toCharacterScalars();
        }
        if (!MultiArray.isInstanceOf(value)) {
            return [this.expressionValue(value, 'for')];
        }
        if (value.dimension[0] === 0 || value.dimension[1] === 0) {
            return [];
        }
        if (value.dimension[0] === 1 && !value.isCell) {
            return MultiArray.linearize(value).map((item, index) => this.expressionValue(item, `for${index + 1}`));
        }
        const result: NodeExpr[] = [];
        const rows = value.dimension[0];
        const columns = value.dimension.slice(1).reduce((product, dimension) => product * dimension, 1);
        for (let column = 0; column < columns; column++) {
            const columnValue = new MultiArray([value.dimension[0], 1], undefined, value.isCell);
            for (let row = 0; row < rows; row++) {
                const linearIndex = column * rows + row;
                const [sourceRow, sourceColumn] = MultiArray.linearIndexToMultiArrayRowColumn(value.dimension[0], value.dimension[1], linearIndex);
                columnValue.array[row][0] = RuntimeValue.copy(value.array[sourceRow][sourceColumn]) as NodeExpr;
            }
            result.push(this.expressionValue(columnValue, `for${column + 1}`));
        }
        return result;
    }

    /**
     * Build the value assigned by one `for` iteration.
     *
     * Scalar targets receive a copied expression value. Row-vector targets use
     * a lazy return list so multi-target loop assignments can request each
     * element independently, matching the same comma-separated-list machinery
     * used elsewhere in the interpreter.
     *
     * @param target Loop assignment target.
     * @param value Iteration value to assign.
     * @returns Scalar assignment value or lazy return-list carrier.
     */
    private forLoopAssignmentValue(target: NodeExpr, value: NodeExpr): NodeExpr {
        if (!MultiArray.isRowVector(target)) {
            return this.copyExpressionValue(value, 'for');
        }
        const values = this.linearExpressionValues(value, 'for');
        return AST.nodeReturnList(
            (_evaluated: ReturnHandlerResult, index: number) => {
                if (index < values.length) {
                    return this.copyExpressionValue(values[index], `for${index + 1}`);
                }
                AST.throwErrorIfGreaterThanReturnList(values.length, index + 1, (message) => this.context.throwEvalError(message));
            },
            (length: number) => {
                if (length > values.length) {
                    AST.throwErrorIfGreaterThanReturnList(values.length, length, (message) => this.context.throwEvalError(message));
                }
                return { length };
            },
        );
    }

    /**
     * Validate the subset of MATLAB `parfor` semantics that remains meaningful
     * for the browser's sequential fallback execution.
     *
     * Unlike ordinary `for`, MATLAB `parfor` uses a simple loop variable and a
     * consecutive integer iteration vector. The runtime still executes
     * sequentially, but it rejects shapes that would not be valid parallel loop
     * headers.
     *
     * @param target Loop assignment target from the parser.
     * @param value Evaluated loop expression.
     */
    private validateParforHeader(target: NodeExpr, value: NodeInput): void {
        if (!AST.isNodeIdentifier(target)) {
            this.context.throwEvalError('parfor loop variable must be a simple identifier.');
        }
        const values = (() => {
            if (MultiArray.isInstanceOf(value)) {
                if (value.isCell || value.dimension[0] !== 1) {
                    this.context.throwEvalError('parfor range must be a row vector of consecutive integer values.');
                }
                return MultiArray.linearize(value);
            }
            return [value];
        })();
        const numeric = values.map((item, index) => {
            const expression = this.expressionValue(item, `parfor range ${index + 1}`);
            if (!Complex.isInstanceOf(expression) || Complex.imagToNumber(expression) !== 0) {
                this.context.throwEvalError('parfor range must be a row vector of consecutive integer values.');
            }
            const number = Complex.realToNumber(expression);
            if (!Number.isFinite(number) || !Number.isInteger(number)) {
                this.context.throwEvalError('parfor range must be a row vector of consecutive integer values.');
            }
            return number;
        });
        if (numeric.length <= 1) {
            return;
        }
        const step = numeric[1] - numeric[0];
        if (Math.abs(step) !== 1) {
            this.context.throwEvalError('parfor range must be a row vector of consecutive integer values.');
        }
        for (let index = 2; index < numeric.length; index++) {
            if (numeric[index] - numeric[index - 1] !== step) {
                this.context.throwEvalError('parfor range must be a row vector of consecutive integer values.');
            }
        }
    }

    /**
     * Validate `parfor` body restrictions that can be checked from the AST.
     *
     * The sequential browser fallback keeps execution deterministic, but the
     * accepted source must still respect MATLAB `parfor` structural rules so
     * code does not become valid here and invalid in MATLAB/Octave-compatible
     * environments.
     *
     * @param body Loop body to inspect.
     * @param loopVariable Simple loop variable name.
     */
    private validateParforBody(body: NodeList, loopVariable: string): void {
        const assignmentTypes = new Set<OperatorType>(['=', '+=', '-=', '*=', '/=', '\\=', '^=', '**=', '.*=', './=', '.\\=', '.^=', '.**=', '&=', '|=']);
        const isClearFunctionCall = (node: NodeInput): boolean => AST.isNodeIndexExpr(node) && AST.isNodeIdentifier(node.expr) && node.expr.id === 'clear' && node.delim === '()';
        const targetTouchesLoopVariable = (target: NodeInput): boolean => {
            if (AST.isNodeIdentifier(target)) {
                return target.id === loopVariable;
            }
            if (AST.isNodeIndexExpr(target)) {
                return targetTouchesLoopVariable(target.expr);
            }
            if (AST.isNodeIndirectRef(target)) {
                return targetTouchesLoopVariable(target.obj);
            }
            if (AST.isNodeList(target)) {
                return target.list.some(targetTouchesLoopVariable);
            }
            if (MultiArray.isInstanceOf(target)) {
                return MultiArray.linearize(target).some(targetTouchesLoopVariable);
            }
            return false;
        };
        const visit = (node: NodeInput): void => {
            if (!AST.isNodeBase(node)) {
                return;
            }
            if (node.type === 'BREAK' || node.type === 'RETURN') {
                this.context.throwEvalError(`${node.type === 'BREAK' ? 'break' : 'return'} is not allowed inside a parfor loop.`);
            }
            if (AST.isNodeDeclaration(node)) {
                this.context.throwEvalError(`${node.type === 'GLOBAL' ? 'global' : 'persistent'} declarations are not allowed inside a parfor loop.`);
            }
            if (AST.isNodeCmdWList(node) && node.id === 'clear') {
                this.context.throwEvalError('clear is not allowed inside a parfor loop.');
            }
            if (isClearFunctionCall(node)) {
                this.context.throwEvalError('clear is not allowed inside a parfor loop.');
            }
            if (node.type === 'SPMD') {
                this.context.throwEvalError('spmd is not allowed inside a parfor loop.');
            }
            if (node.type === 'FOR' && Reflect.get(node, 'parallel') === true) {
                this.context.throwEvalError('nested parfor loops are not allowed.');
            }
            if (AST.isNodeBinaryOperation(node)) {
                if (assignmentTypes.has(node.type as OperatorType) && targetTouchesLoopVariable(node.left)) {
                    this.context.throwEvalError(`assignment to parfor loop variable '${loopVariable}' is not allowed.`);
                }
                visit(node.left);
                visit(node.right);
                return;
            }
            if (AST.isNodePrefixOperation(node)) {
                if ((node.type === '++_' || node.type === '--_') && targetTouchesLoopVariable(node.right)) {
                    this.context.throwEvalError(`assignment to parfor loop variable '${loopVariable}' is not allowed.`);
                }
                visit(node.right);
                return;
            }
            if (AST.isNodePostfixOperation(node)) {
                if ((node.type === '_++' || node.type === '_--') && targetTouchesLoopVariable(node.left)) {
                    this.context.throwEvalError(`assignment to parfor loop variable '${loopVariable}' is not allowed.`);
                }
                visit(node.left);
                return;
            }
            if (AST.isNodeIndexExpr(node)) {
                visit(node.expr);
                node.args.forEach(visit);
                return;
            }
            if (AST.isNodeIndirectRef(node)) {
                visit(node.obj);
                node.field.forEach((field) => {
                    if (typeof field !== 'string') {
                        visit(field);
                    }
                });
                return;
            }
            if (AST.isNodeList(node)) {
                node.list.forEach(visit);
                return;
            }
            switch (node.type) {
                case 'IF':
                    Reflect.get(node, 'expression').forEach(visit);
                    Reflect.get(node, 'then').forEach(visit);
                    if (Reflect.get(node, 'else')) {
                        visit(Reflect.get(node, 'else'));
                    }
                    break;
                case 'SWITCH':
                    visit(Reflect.get(node, 'expression'));
                    Reflect.get(node, 'cases').forEach(visit);
                    if (Reflect.get(node, 'otherwise')) {
                        visit(Reflect.get(node, 'otherwise'));
                    }
                    break;
                case 'CASE':
                    visit(Reflect.get(node, 'expression'));
                    visit(Reflect.get(node, 'then'));
                    break;
                case 'WHILE':
                case 'DO_UNTIL':
                    visit(Reflect.get(node, 'expression'));
                    visit(Reflect.get(node, 'body'));
                    break;
                case 'FOR':
                    visit(Reflect.get(node, 'target'));
                    visit(Reflect.get(node, 'expression'));
                    visit(Reflect.get(node, 'body'));
                    break;
                case 'TRY':
                    visit(Reflect.get(node, 'body'));
                    if (Reflect.get(node, 'catchBody')) {
                        visit(Reflect.get(node, 'catchBody'));
                    }
                    break;
                case 'UNWIND_PROTECT':
                    visit(Reflect.get(node, 'body'));
                    visit(Reflect.get(node, 'cleanup'));
                    break;
            }
        };
        visit(body);
    }

    /**
     * Validate `spmd` body restrictions that remain relevant for the browser's
     * single-worker fallback.
     *
     * MATLAB rejects several control-flow and parallel constructs inside
     * `spmd` blocks because workers execute separately from the client
     * workspace. MathJSLab executes the block sequentially, but preserving the
     * structural restrictions prevents non-portable code from being accepted.
     *
     * @param body SPMD body to inspect before execution.
     */
    private validateSpmdBody(body: NodeList): void {
        const isClearFunctionCall = (node: NodeInput): boolean => AST.isNodeIndexExpr(node) && AST.isNodeIdentifier(node.expr) && node.expr.id === 'clear' && node.delim === '()';
        const visit = (node: NodeInput): void => {
            if (FunctionHandle.isInstanceOf(node)) {
                if (typeof node.id === 'undefined') {
                    this.context.throwEvalError('anonymous function definitions are not allowed inside an spmd block.');
                }
                return;
            }
            if (!AST.isNodeBase(node)) {
                return;
            }
            if (node.type === 'BREAK' || node.type === 'CONTINUE' || node.type === 'RETURN') {
                this.context.throwEvalError(`${node.type === 'BREAK' ? 'break' : node.type === 'CONTINUE' ? 'continue' : 'return'} is not allowed inside an spmd block.`);
            }
            if (AST.isNodeDeclaration(node)) {
                this.context.throwEvalError(`${node.type === 'GLOBAL' ? 'global' : 'persistent'} declarations are not allowed inside an spmd block.`);
            }
            if (AST.isNodeCmdWList(node) && node.id === 'clear') {
                this.context.throwEvalError('clear is not allowed inside an spmd block.');
            }
            if (isClearFunctionCall(node)) {
                this.context.throwEvalError('clear is not allowed inside an spmd block.');
            }
            if (node.type === 'SPMD') {
                this.context.throwEvalError('nested spmd blocks are not allowed.');
            }
            if (node.type === 'FOR' && Reflect.get(node, 'parallel') === true) {
                this.context.throwEvalError('parfor is not allowed inside an spmd block.');
            }
            if (AST.isNodeBinaryOperation(node)) {
                visit(node.left);
                visit(node.right);
                return;
            }
            if (AST.isNodePrefixOperation(node)) {
                visit(node.right);
                return;
            }
            if (AST.isNodePostfixOperation(node)) {
                visit(node.left);
                return;
            }
            if (AST.isNodeIndexExpr(node)) {
                visit(node.expr);
                node.args.forEach(visit);
                return;
            }
            if (AST.isNodeIndirectRef(node)) {
                visit(node.obj);
                node.field.forEach((field) => {
                    if (typeof field !== 'string') {
                        visit(field);
                    }
                });
                return;
            }
            if (AST.isNodeList(node)) {
                node.list.forEach(visit);
                return;
            }
            switch (node.type) {
                case 'IF':
                    Reflect.get(node, 'expression').forEach(visit);
                    Reflect.get(node, 'then').forEach(visit);
                    if (Reflect.get(node, 'else')) {
                        visit(Reflect.get(node, 'else'));
                    }
                    break;
                case 'SWITCH':
                    visit(Reflect.get(node, 'expression'));
                    Reflect.get(node, 'cases').forEach(visit);
                    if (Reflect.get(node, 'otherwise')) {
                        visit(Reflect.get(node, 'otherwise'));
                    }
                    break;
                case 'CASE':
                    visit(Reflect.get(node, 'expression'));
                    visit(Reflect.get(node, 'then'));
                    break;
                case 'WHILE':
                case 'DO_UNTIL':
                    visit(Reflect.get(node, 'expression'));
                    visit(Reflect.get(node, 'body'));
                    break;
                case 'FOR':
                    visit(Reflect.get(node, 'target'));
                    visit(Reflect.get(node, 'expression'));
                    if (Reflect.get(node, 'workers')) {
                        visit(Reflect.get(node, 'workers'));
                    }
                    visit(Reflect.get(node, 'body'));
                    break;
                case 'TRY':
                    visit(Reflect.get(node, 'body'));
                    if (Reflect.get(node, 'catchBody')) {
                        visit(Reflect.get(node, 'catchBody'));
                    }
                    break;
                case 'UNWIND_PROTECT':
                    visit(Reflect.get(node, 'body'));
                    visit(Reflect.get(node, 'cleanup'));
                    break;
            }
        };
        visit(body);
    }

    /**
     * Clone an assignment target while preserving only expression-compatible shapes.
     *
     * Assignment lowering can duplicate identifiers, indexing chains, indirect
     * references, and runtime values before the actual write occurs. Every
     * cloned branch is routed back through the expression boundary so malformed
     * statement/control-flow nodes cannot enter the assignment pipeline.
     *
     * @param target Assignment target or runtime value to clone.
     * @returns Copied target constrained to expression position.
     */
    private cloneAssignmentTarget(target: unknown): NodeExpr {
        if (
            Complex.isInstanceOf(target) ||
            CharString.isInstanceOf(target) ||
            Structure.isInstanceOf(target) ||
            FunctionHandle.isInstanceOf(target) ||
            ClassDefinition.isInstanceOf(target) ||
            ClassInstance.isInstanceOf(target) ||
            ClassBoundMethod.isInstanceOf(target) ||
            ClassStaticMethod.isInstanceOf(target) ||
            ClassEmptyMethod.isInstanceOf(target) ||
            ClassEnumerationValue.isInstanceOf(target) ||
            ClassMetaObject.isInstanceOf(target)
        ) {
            return this.copyExpressionValue(target, 'assignment target');
        }
        if (AST.isNodeIdentifier(target)) {
            return AST.nodeIdentifier(target.id);
        }
        if (AST.isNodeIgnoredTarget(target)) {
            return AST.nodeIgnoredTarget();
        }
        if (AST.isNodeIndexExpr(target)) {
            return AST.nodeIndexExpr(this.cloneAssignmentTarget(target.expr), AST.nodeList(target.args.map((arg) => this.cloneAssignmentTarget(arg))), target.delim);
        }
        if (AST.isNodeIndirectRef(target)) {
            const firstField = target.field[0];
            let result = AST.nodeIndirectRef(this.cloneAssignmentTarget(target.obj), typeof firstField === 'string' ? firstField : this.cloneAssignmentTarget(firstField));
            for (let i = 1; i < target.field.length; i++) {
                const field = target.field[i];
                result = AST.nodeIndirectRef(result, typeof field === 'string' ? field : this.cloneAssignmentTarget(field));
            }
            return result;
        }
        if (MultiArray.isInstanceOf(target)) {
            const source = target;
            const result = new MultiArray(source.dimension, undefined, source.isCell);
            for (let row = 0; row < source.dimension[0]; row++) {
                for (let column = 0; column < source.dimension[1]; column++) {
                    result.array[row][column] = this.cloneAssignmentTarget(source.array[row][column]);
                }
            }
            MultiArray.setType(result);
            return this.expressionValue(result, 'assignment target');
        }
        return this.expressionValue(AST.nodeCopy(this.expressionValue(target, 'assignment target')), 'assignment target');
    }

    /**
     * Validate values before exposing them through an interpreter-owned comma
     * separated return list.
     */
    private returnListValue(value: unknown, name: string): NodeExpr {
        return expressionValue(value, name, 'Return value', (message) => this.context.throwEvalError(message));
    }

    /**
     * Create a lazy comma-separated return list from already evaluated values.
     *
     * Values are validated only when selected so the return list can honor the
     * caller-requested output count while still rejecting non-expression values
     * before they cross an expression boundary.
     *
     * @param values Candidate output values.
     * @returns Lazy comma-separated return list.
     */
    private valueReturnList(values: unknown[], outputMask?: boolean[]): NodeReturnList {
        const capturedOutputMask = outputMask ?? this.context.requestedOutputMask(values.length);
        const outputIsRequested = (index: number): boolean => capturedOutputMask[index] ?? true;
        return AST.nodeCommaSeparatedReturnList(
            values.length,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                const value = evaluated[`out${index}`];
                if (typeof value === 'undefined') {
                    AST.throwErrorIfGreaterThanReturnList(index, index + 1, (message) => this.context.throwEvalError(message));
                }
                return value;
            },
            (length: number): ReturnHandlerResult => {
                AST.throwErrorIfGreaterThanReturnList(values.length, length, (message) => this.context.throwEvalError(message));
                const out: ReturnHandlerResult = { length };
                for (let index = 0; index < length; index++) {
                    if (!outputIsRequested(index)) {
                        continue;
                    }
                    out[`out${index}`] = this.returnListValue(values[index], `out${index + 1}`);
                }
                return out;
            },
        );
    }

    /**
     * Convert comma-separated values into a row vector for scalar operations.
     *
     * Native brace and structure-field descriptor chains may return a lazy
     * comma-separated list. Compound assignments need an expression value that
     * can participate in `+`, `-`, etc., so the selected list is materialized in
     * the same row-vector shape used by explicit concatenation contexts.
     */
    private compoundAssignmentOperand(value: NodeInput, name: string): NodeExpr {
        if (!AST.isNodeReturnList(value) || !value.commaSeparated) {
            return this.expressionValue(value, name);
        }
        const length = value.returnListLength ?? value.handler(0).length;
        const evaluated = value.handler(length);
        const values: NodeExpr[] = [];
        for (let index = 0; index < length; index++) {
            values.push(this.expressionValue(value.selector(evaluated, index), `${name}${index + 1}`));
        }
        return MultiArray.toRowVector(values);
    }

    /**
     * Read the assigned value from an internal assignment-result list.
     */
    private nestedAssignmentValue(resultList: NodeList): NodeExpr {
        const assignment = resultList.list[0];
        if (!AST.isNodeBinaryOperation(assignment) || assignment.type !== '=') {
            this.context.throwEvalError('invalid nested assignment result.');
        }
        return this.expressionValue(assignment.right, 'assignment result');
    }

    /**
     * Parse and evaluate source text in a specific scope.
     *
     * This is shared by `eval`/`evalin` and deliberately creates a transient
     * call-stack frame so introspection and argument helpers observe the scope
     * in which the string is evaluated.
     *
     * @param source Source code to parse.
     * @param scope Scope used for evaluation.
     * @returns Evaluated result tree or runtime value.
     */
    private evalStringInScope(source: string, scope: Scope, options: { requestedOutputCount?: number; requestedOutputMask?: boolean[]; topLevelReturn?: boolean } = {}): NodeInput {
        const tree = this.Parse(source);
        tree.parent = null;
        this.validateDeclarationPlacement(tree);
        const restoreDynamicGuard = this.pushDynamicNameCreationGuard(scope);
        this.context.pushCallStackFrame(new CallFrame(scope));
        try {
            const requestedOutputCount = options.requestedOutputCount ?? this.context.requestedOutputCount;
            const requestedOutputMask = options.requestedOutputMask ?? this.context.requestedOutputMask(requestedOutputCount);
            this.context.pushRequestedOutputCount(requestedOutputCount);
            this.context.pushRequestedOutputMask(requestedOutputMask);
            try {
                if (AST.isNodeList(tree) && tree.list.length === 1 && !tree.list[0].omitOutput) {
                    let node = tree.list[0];
                    if (AST.isNodeIdentifier(node) && !scope.resolveName(node.id) && this.commandWordListNameSet.has(node.id)) {
                        node = AST.nodeEmptyCmdWList(node);
                        tree.list[0] = node;
                    }
                    node.index = 0;
                    return this.Evaluator(node, scope);
                }
                const result = this.Evaluator(tree, scope);
                if (AST.isNodeList(result) && result.list.length === 1 && AST.isNodeReturnList(result.list[0])) {
                    return result.list[0];
                }
                return result;
            } catch (e: unknown) {
                if (options.topLevelReturn && e instanceof ReturnSignal) {
                    return AST.nodeVoid();
                }
                throw e;
            } finally {
                this.context.popRequestedOutputMask();
                this.context.popRequestedOutputCount();
            }
        } finally {
            this.context.popCallStackFrame();
            restoreDynamicGuard();
        }
    }

    /**
     * Temporarily reject dynamic variable creation in static function workspaces.
     *
     * MATLAB static workspaces allow `eval`/script code to update variables that
     * appear in function text, but reject brand-new variable names. Normal parsed
     * statement execution does not enable this guard.
     *
     * @param scope Workspace that will run dynamic code.
     * @returns Restorer for the previous guard state.
     */
    private pushDynamicNameCreationGuard(scope: Scope): () => void {
        const previous = scope.rejectDynamicNameCreation;
        if (scope.staticWorkspaceNameSet) {
            scope.rejectDynamicNameCreation = true;
        }
        return () => {
            scope.rejectDynamicNameCreation = previous;
        };
    }

    /**
     * Determine whether an error can be handled by an `eval` catch string.
     *
     * MATLAB/Octave control-flow signals must propagate through `eval`; only
     * ordinary runtime errors are catchable by the optional catch source.
     *
     * @param error Error or control-flow signal thrown by evaluation.
     * @returns `true` when the catch string may handle the error.
     */
    private isEvalCatchableError(error: unknown): boolean {
        return !(error instanceof ReturnSignal || error instanceof BreakSignal || error instanceof ContinueSignal);
    }

    /**
     * Evaluate source like `eval` while returning captured display text first.
     *
     * MATLAB `evalc` returns command-window output in the first result and the
     * evaluated expression outputs in subsequent result slots. The engine has
     * no separate command-window stream, so capture uses the same textual
     * representation that top-level evaluation would expose through `Unparse`.
     *
     * @param source Source code to parse and evaluate.
     * @param catchSource Optional catch source evaluated after ordinary errors.
     * @returns Captured output string, optionally followed by evaluated outputs.
     */
    private evalcResult(source: string, catchSource?: string): NodeInput {
        const requestedOutputCount = this.context.requestedOutputCount;
        const evaluatedOutputCount = Math.max(requestedOutputCount - 1, 1);
        const callerOutputMask = this.context.requestedOutputMask(requestedOutputCount);
        const evaluatedOutputMask = Array.from({ length: evaluatedOutputCount }, (_value, index) => callerOutputMask[index + 1] ?? true);
        let result: NodeInput;
        result = FunctionWorkspace.evaluateWithCatch(
            this.context.currentScope,
            source,
            catchSource,
            (itemSource, scope) => this.evalStringInScope(itemSource, scope as Scope, { requestedOutputCount: evaluatedOutputCount, requestedOutputMask: evaluatedOutputMask }),
            (error) => this.isEvalCatchableError(error),
            (error) => this.rememberLastError(error),
        );
        const evaluatedValues: NodeInput[] = new Array(evaluatedOutputCount);
        let capturedValue: NodeInput = result;
        if (AST.isNodeReturnList(result)) {
            const evaluated = result.handler(evaluatedOutputCount);
            for (let index = 0; index < evaluatedOutputCount; index++) {
                if (!evaluatedOutputMask[index]) {
                    continue;
                }
                evaluatedValues[index] = this.returnListValue(result.selector(evaluated, index), `evalc output ${index + 1}`);
            }
            const capturedValues = evaluatedValues.filter((value): value is NodeInput => typeof value !== 'undefined');
            capturedValue =
                capturedValues.length === 0
                    ? AST.nodeVoid()
                    : capturedValues.length === 1
                      ? capturedValues[0]
                      : AST.nodeList(capturedValues.map((value) => this.returnListValue(value, 'evalc display value')));
        } else if (result.type !== 'VOID') {
            evaluatedValues[0] = this.returnListValue(result, 'evalc output 1');
        }
        const capture = new CharString(this.Unparse(capturedValue));
        return requestedOutputCount > 1 ? this.valueReturnList([capture, ...evaluatedValues], callerOutputMask) : capture;
    }

    /**
     * Extract top-level class definitions from a parsed source tree.
     *
     * Host-provided class sources are parsed as ordinary snippets; this helper
     * isolates classdef nodes without executing unrelated statements.
     *
     * @param tree Parsed source tree.
     * @returns Top-level class definitions in source order.
     */
    private topLevelClassDefinitions(tree: NodeInput): NodeClassDef[] {
        if (AST.isNodeClassDef(tree)) {
            return [tree];
        }
        if (!AST.isNodeList(tree)) {
            return [];
        }
        return tree.list.filter(AST.isNodeClassDef);
    }

    /**
     * Extract top-level function definitions from a parsed source tree.
     *
     * This is used by function-file loading and script-local function
     * pre-registration, keeping MATLAB/Octave function discovery separate from
     * statement execution.
     *
     * @param tree Parsed source tree.
     * @returns Top-level function definitions in source order.
     */
    private topLevelFunctionDefinitions(tree: NodeInput): NodeFunctionDefinition[] {
        if (AST.isNodeFunctionDefinition(tree)) {
            return [tree];
        }
        if (!AST.isNodeList(tree)) {
            return [];
        }
        return tree.list.filter(AST.isNodeFunctionDefinition);
    }

    /**
     * Parse a host-provided function-file source.
     *
     * The selected primary function is renamed to the requested canonical name
     * so package/import aliases can load source supplied under a fully
     * qualified runtime name while preserving MATLAB/Octave function-file
     * lookup behavior.
     *
     * @param name Canonical function name requested by lookup.
     * @param source Source text containing one primary function and optional subfunctions.
     * @returns Primary function plus private subfunctions.
     */
    private parseFunctionSource(name: string, source: string): { primary: NodeFunctionDefinition; subfunctions: NodeFunctionDefinition[] } {
        const simpleName = name.split('.').pop() ?? name;
        const tree = this.Parse(source);
        this.validateDeclarationPlacement(tree);
        const definitions = this.topLevelFunctionDefinitions(tree);
        const primary = definitions.find((item) => item.id === simpleName || item.id === name);
        if (!primary) {
            this.context.throwEvalError(`function '${name}' could not be loaded: source does not contain primary function ${simpleName}.`);
        }
        primary.id = name;
        return {
            primary,
            subfunctions: definitions.filter((item) => item !== primary),
        };
    }

    /**
     * Resolve function-file source through the configured host tables/providers.
     *
     * @param name Canonical function name requested by lookup.
     * @returns Normalized source entry, if the host can supply one.
     */
    private resolveFunctionSource(name: string): FunctionSource | undefined {
        return this.sourceResolver.resolve('function', name);
    }

    /**
     * Test whether a semantically valid host-provided function source exists.
     *
     * The probe parses and validates the source without registering it, so
     * introspection such as `exist` and `which` cannot mutate the runtime.
     *
     * @param name Function name requested by lookup.
     * @returns `true` when a loadable function source is available.
     */
    private hasFunctionSource(name: string): boolean {
        return Boolean(this.validFunctionSource(name));
    }

    /**
     * Resolve and validate a function source without registering it.
     *
     * This mirrors the static checks performed by lazy function loading:
     * primary-function matching, declaration placement, signature validation,
     * `arguments` blocks, and duplicate subfunction names.
     *
     * @param name Function name requested by lookup.
     * @returns Normalized source entry, or `undefined` when unavailable/invalid.
     */
    private validFunctionSource(name: string): FunctionSource | undefined {
        const source = this.resolveFunctionSource(name);
        if (typeof source === 'undefined') {
            return undefined;
        }
        try {
            const parsed = this.parseFunctionSource(source.name ?? name, source.source);
            this.validateFunctionFileDefinitions(parsed.primary, parsed.subfunctions, `function file ${source.name ?? name}`);
            return source;
        } catch (_error: unknown) {
            return undefined;
        }
    }

    /**
     * Validate a parsed function file before it is reported or registered.
     *
     * Host probes and lazy loading both use this single gate so externally
     * supplied primary functions, subfunctions, and class method files obey the
     * same signature and `arguments`-block rules.
     *
     * @param primary Primary function selected from the file.
     * @param subfunctions Private top-level subfunctions from the same source.
     * @param duplicateContext Source label used in duplicate-function diagnostics.
     */
    private validateFunctionFileDefinitions(primary: NodeFunctionDefinition, subfunctions: NodeFunctionDefinition[], duplicateContext = `function file ${primary.id}`): void {
        this.validateFunctionSignature(primary);
        this.validateFunctionArgumentsBlocks(primary);
        const names = new Set([primary.id]);
        for (const subfunction of subfunctions) {
            if (names.has(subfunction.id)) {
                this.context.throwSyntaxError(`duplicate function '${subfunction.id}' in ${duplicateContext}.`);
            }
            names.add(subfunction.id);
            this.validateFunctionSignature(subfunction);
            this.validateFunctionArgumentsBlocks(subfunction);
        }
    }

    /**
     * Register a parsed function-file definition in a target scope.
     *
     * The primary function is visible from the caller scope. Subfunctions are
     * stored in the primary function's file scope so they remain private to the
     * loaded function file, which matches MATLAB/Octave file scoping.
     *
     * @param primary Primary function definition.
     * @param subfunctions Private top-level subfunctions from the same source.
     * @param scope Scope receiving the primary function.
     * @returns Registered primary function definition.
     */
    private registerFunctionFileDefinition(primary: NodeFunctionDefinition, subfunctions: NodeFunctionDefinition[], scope: Scope, sourceName = primary.id): NodeFunctionDefinition {
        this.validateFunctionFileDefinitions(primary, subfunctions, `function file ${primary.id}`);
        const fileScope = Scope.create(scope, false);
        fileScope.defineFunction(primary.id, primary);
        primary.definingScope = fileScope;
        primary.sourceName = sourceName;
        if (primary.attributes?.nested || primary.attributes?.subfunction) {
            primary.attributes = { ...primary.attributes };
            delete primary.attributes.nested;
            delete primary.attributes.subfunction;
        }
        for (const subfunction of subfunctions) {
            subfunction.definingScope = fileScope;
            subfunction.sourceName = sourceName;
            subfunction.attributes = { ...(subfunction.attributes ?? {}), subfunction: true };
            delete subfunction.attributes.nested;
            fileScope.defineFunction(subfunction.id, subfunction);
        }
        scope.defineFunction(primary.id, primary);
        return primary;
    }

    /**
     * Load a MATLAB/Octave-like function file from host-provided source text.
     *
     * The primary function is exported to the target scope. Additional
     * top-level function definitions become private subfunctions visible only
     * through the primary function's file scope.
     *
     * @param name Canonical primary function name.
     * @param source Source text containing the function file.
     * @param scope Scope that receives the primary function.
     * @returns Registered primary function definition.
     */
    public LoadFunctionFile(name: string, source: string, scope: Scope = this.context.globalScope ?? this.context.currentScope, sourceName = name): NodeFunctionDefinition {
        const parsed = this.parseFunctionSource(name, source);
        return this.registerFunctionFileDefinition(parsed.primary, parsed.subfunctions, scope, sourceName);
    }

    /**
     * Resolve and register a function definition through host-provided sources.
     *
     * @param name Function name requested by lookup.
     * @param scope Scope that should receive the loaded primary function.
     * @returns Registered function definition, or `undefined` when unavailable.
     */
    public loadFunctionDefinition(name: string, scope: Scope): NodeFunctionDefinition | undefined {
        const source = this.resolveFunctionSource(name);
        if (!source || this.loadingFunctionNames.has(name)) {
            return undefined;
        }
        this.loadingFunctionNames.add(name);
        try {
            return this.LoadFunctionFile(source.name ?? name, source.source, this.context.globalScope ?? scope, source.sourceName ?? source.name ?? name);
        } finally {
            this.loadingFunctionNames.delete(name);
        }
    }

    /**
     * Resolve script source through the configured host tables/providers.
     *
     * @param name Script name requested by lookup.
     * @returns Normalized source entry, if the host can supply one.
     */
    private resolveScriptSource(name: string): ScriptSource | undefined {
        return this.sourceResolver.resolve('script', name);
    }

    /**
     * Test whether a semantically valid host-provided script source exists.
     *
     * The script is parsed and checked for declaration-placement violations,
     * but it is not executed and script-local functions are not registered.
     *
     * @param name Script name requested by lookup.
     * @returns `true` when a runnable script source is available.
     */
    private hasScriptSource(name: string): boolean {
        return Boolean(this.validScriptSource(name));
    }

    /**
     * Resolve and validate a script source without executing it.
     *
     * @param name Script name requested by lookup.
     * @returns Normalized source entry, or `undefined` when unavailable/invalid.
     */
    private validScriptSource(name: string): ScriptSource | undefined {
        const source = this.resolveScriptSource(name);
        if (typeof source === 'undefined') {
            return undefined;
        }
        try {
            const tree = this.Parse(source.source);
            this.validateDeclarationPlacement(tree);
            return source;
        } catch (_error: unknown) {
            return undefined;
        }
    }

    /**
     * Execute a parsed script while temporarily exposing script-local functions.
     *
     * @param tree Parsed script source tree.
     * @param scope Workspace where script statements execute.
     * @returns Evaluated script result.
     */
    private executeScriptTree(tree: NodeInput, scope: Scope, sourceName?: string): NodeInput {
        const localFunctions = this.topLevelFunctionDefinitions(tree);
        const previousFunctions = new Map<string, NodeFunctionDefinition | undefined>();
        const previousImports = scope.importSnapshot();
        const restoreDynamicGuard = this.pushDynamicNameCreationGuard(scope);
        for (const func of localFunctions) {
            if (!previousFunctions.has(func.id)) {
                previousFunctions.set(func.id, scope.functionTable[func.id]);
            }
        }
        this.scriptExecutionDepth++;
        this.scriptSourceNameStack.push(sourceName);
        try {
            this.applyScopedImports(tree, scope);
            return this.Evaluator(tree, scope);
        } catch (e: unknown) {
            if (e instanceof ReturnSignal) {
                return AST.nodeVoid();
            }
            throw e;
        } finally {
            this.scriptSourceNameStack.pop();
            this.scriptExecutionDepth--;
            restoreDynamicGuard();
            for (const [name, previous] of previousFunctions) {
                if (previous) {
                    scope.defineFunction(name, previous);
                } else {
                    scope.removeFunction(name);
                }
            }
            scope.restoreImports(previousImports);
        }
    }

    /**
     * Execute MATLAB/Octave-like script source in a workspace.
     *
     * Script-local functions are visible while the script executes and hidden
     * afterward. Function handles created by the script keep captured closures,
     * so they remain callable even after the temporary function table is
     * restored.
     *
     * @param name Script name used for diagnostics.
     * @param source Source text containing the script.
     * @param scope Workspace where script statements execute.
     * @param sourceName Optional virtual source identity for script-local functions.
     * @returns Evaluated script result.
     */
    public LoadScriptFile(name: string, source: string, scope: Scope = this.context.currentScope, sourceName = name): NodeInput {
        const tree = this.Parse(source);
        tree.parent = null;
        this.validateDeclarationPlacement(tree);
        return this.executeScriptTree(tree, scope, sourceName);
    }

    /**
     * Resolve and execute a host-provided script file by name.
     *
     * @param name Script name or `.m` filename.
     * @param scope Workspace where script statements execute.
     * @returns Evaluated script result.
     */
    public RunScriptFile(name: string, scope: Scope = this.context.currentScope): NodeInput {
        const source = this.resolveScriptSource(name);
        if (!source) {
            this.context.throwEvalError(`script '${name}' could not be loaded.`);
        }
        return this.LoadScriptFile(source.name ?? name, source.source, scope, source.sourceName ?? source.name ?? name);
    }

    /**
     * Parse a host-provided class source and select the requested classdef.
     *
     * @param name Canonical class name requested by lookup.
     * @param source Source text containing the classdef.
     * @returns Classdef AST node with canonical runtime name.
     */
    private parseClassSource(name: string, source: string): NodeClassDef {
        const definition = this.tryParseClassSource(name, source);
        if (!definition) {
            const simpleName = name.split('.').pop() ?? name;
            this.context.throwEvalError(`class '${name}' could not be loaded: source does not contain classdef ${simpleName}.`);
        }
        return definition;
    }

    /**
     * Parse a class source if it contains the requested classdef.
     *
     * @param name Canonical class name requested by lookup.
     * @param source Source text containing a possible classdef.
     * @returns Matching classdef AST node, or `undefined` when the source is not a classdef file.
     */
    private tryParseClassSource(name: string, source: string): NodeClassDef | undefined {
        const simpleName = name.split('.').pop() ?? name;
        const tree = this.Parse(source);
        this.validateDeclarationPlacement(tree);
        const definitions = this.topLevelClassDefinitions(tree);
        const definition = definitions.find((item) => item.id === simpleName);
        if (!definition) {
            return undefined;
        }
        definition.id = name;
        return definition;
    }

    /**
     * Test whether source text looks like a function/method file rather than a classdef file.
     *
     * Class lookup probes can reach sibling `@Class/method.m` files while
     * resolving qualified member chains. Function-only sources should decline
     * class loading quietly so the shorter class prefix can be selected.
     *
     * @param source Source text to inspect.
     * @returns `true` when the source contains top-level functions and no classdef.
     */
    private isFunctionOnlySource(source: string): boolean {
        const tree = this.Parse(source);
        this.validateDeclarationPlacement(tree);
        return this.topLevelClassDefinitions(tree).length === 0 && this.topLevelFunctionDefinitions(tree).length > 0;
    }

    /**
     * Parse a host-provided class method source selected by a classdef prototype.
     *
     * MATLAB/Octave allow classdef files to declare method signatures while
     * concrete bodies live in sibling `@Class/method.m` files. The primary
     * function is stored under the prototype method name so class metadata and
     * stack traces keep the source-level method spelling.
     *
     * @param className Canonical class name that owns the prototype.
     * @param methodName Method name declared in the classdef prototype.
     * @param sourceName Canonical source entry name resolved by the host.
     * @param source Source text containing one method function and optional private subfunctions.
     * @returns Primary method plus private subfunctions.
     */
    private parseClassMethodSource(className: string, methodName: string, sourceName: string, source: string): { primary: NodeFunctionDefinition; subfunctions: NodeFunctionDefinition[] } {
        const acceptedNames = new Set([methodName, sourceName]);
        if (!methodName.includes('.')) {
            acceptedNames.add(sourceName.split('.').pop() ?? sourceName);
        }
        const tree = this.Parse(source);
        this.validateDeclarationPlacement(tree);
        const definitions = this.topLevelFunctionDefinitions(tree);
        const primary = definitions.find((item) => acceptedNames.has(item.id));
        if (!primary) {
            this.context.throwEvalError(`method '${methodName}' for class ${className} could not be loaded: source does not contain primary function ${methodName}.`);
        }
        primary.id = methodName;
        if (primary.attributes?.prototype) {
            primary.attributes = { ...primary.attributes };
            delete primary.attributes.prototype;
        }
        return {
            primary,
            subfunctions: definitions.filter((item) => item !== primary),
        };
    }

    /**
     * Resolve class source through the configured host tables/providers.
     *
     * @param name Canonical class name requested by lookup.
     * @returns Normalized source entry, if the host can supply one.
     */
    private resolveClassSource(name: string): ClassSource | undefined {
        return this.sourceResolver.resolve('class', name);
    }

    /**
     * Test whether a host class source is available without parsing/registering it.
     *
     * Lookup helpers such as `exist` and `which` should report browser-provided
     * class sources without mutating the runtime class registry, otherwise a
     * metadata query can change later function/class precedence.
     *
     * @param name Canonical class name requested by lookup.
     * @returns `true` when the configured resolver can provide class source.
     */
    private hasClassSource(name: string): boolean {
        return Boolean(this.validClassSource(name));
    }

    /**
     * Resolve and validate a class source without registering it.
     *
     * The check is intentionally local: it rejects malformed classdef metadata
     * while avoiding superclass resolution, dependency loading, and mutations
     * to the class registry.
     *
     * @param name Class name requested by lookup.
     * @returns Normalized source entry, or `undefined` when unavailable/invalid.
     */
    private validClassSource(name: string): ClassSource | undefined {
        const source = this.resolveClassSource(name);
        if (typeof source === 'undefined') {
            return undefined;
        }
        try {
            const classNode = this.tryParseClassSource(source.name ?? name, source.source);
            if (!classNode) {
                return undefined;
            }
            const definition = ClassDefinition.create(classNode);
            definition.validateLocalDefinition((message) => this.context.throwEvalError(message));
            return source;
        } catch (_error: unknown) {
            return undefined;
        }
    }

    /**
     * Attach a virtual source identity to methods declared inside a loaded classdef.
     *
     * External `@Class/method.m` files receive their own identity when they are
     * materialized. Inline methods in a host-provided classdef share the class
     * file identity, matching MATLAB/Octave source-level introspection.
     */
    private attachClassDefinitionSourceName(definition: ClassDefinition, sourceName: string): void {
        for (const method of definition.methods) {
            method.node.sourceName = sourceName;
        }
    }

    /**
     * Resolve and register a class definition through host-provided sources.
     *
     * @param name Class name requested by lookup.
     * @param scope Scope used to resolve superclass dependencies.
     * @returns Loaded class definition, or `undefined` when unavailable.
     */
    public loadClassDefinition(name: string, scope: Scope): ClassDefinition | undefined {
        const source = this.resolveClassSource(name);
        if (!source || this.loadingClassNames.has(name)) {
            return undefined;
        }
        this.loadingClassNames.add(name);
        try {
            const classNode = this.tryParseClassSource(source.name ?? name, source.source);
            if (!classNode) {
                if (this.isFunctionOnlySource(source.source)) {
                    return undefined;
                }
                this.parseClassSource(source.name ?? name, source.source);
                return undefined;
            }
            const definition = ClassDefinition.create(classNode);
            this.attachClassDefinitionSourceName(definition, source.sourceName ?? source.name ?? name);
            definition.resolveSuperclasses(
                (superclassName) => this.context.resolveClassDefinition(superclassName, scope),
                (message) => this.context.throwEvalError(message),
            );
            return definition;
        } finally {
            this.loadingClassNames.delete(name);
        }
    }

    /**
     * Resolve a concrete method body for a classdef prototype.
     *
     * The lookup key is `ClassName.methodName`, which maps naturally to
     * browser-hosted paths such as `+pkg/@Class/method.m` through the shared
     * class-source resolver.
     *
     * @param className Canonical class name.
     * @param methodName Method prototype name.
     * @param scope Scope used as parent for the method-file private scope.
     * @returns Loaded method body, or `undefined` when no external method file exists.
     */
    public loadClassMethodDefinition(className: string, methodName: string, scope: Scope): NodeFunctionDefinition | undefined {
        const sourceName = `${className}.${methodName}`;
        const source = this.resolveClassSource(sourceName);
        if (!source || this.loadingClassMethodNames.has(sourceName)) {
            return undefined;
        }
        this.loadingClassMethodNames.add(sourceName);
        try {
            const parsed = this.parseClassMethodSource(className, methodName, source.name ?? sourceName, source.source);
            const fileScope = Scope.create(this.context.globalScope ?? scope, false);
            this.validateFunctionFileDefinitions(parsed.primary, parsed.subfunctions, `method file ${sourceName}`);
            parsed.primary.definingScope = fileScope;
            parsed.primary.sourceName = source.sourceName ?? source.name ?? sourceName;
            fileScope.defineFunction(parsed.primary.id, parsed.primary);
            for (const subfunction of parsed.subfunctions) {
                subfunction.definingScope = fileScope;
                subfunction.sourceName = source.sourceName ?? source.name ?? sourceName;
                subfunction.attributes = { ...(subfunction.attributes ?? {}), subfunction: true };
                delete subfunction.attributes.nested;
                fileScope.defineFunction(subfunction.id, subfunction);
            }
            return parsed.primary;
        } finally {
            this.loadingClassMethodNames.delete(sourceName);
        }
    }

    /**
     * Convert a dotted identifier chain into name parts when it is purely symbolic.
     *
     * @param tree Dotted reference node.
     * @returns Qualified name parts, or `undefined` for dynamic field access.
     */
    private qualifiedReferenceParts(tree: NodeIndirectRef): string[] | undefined {
        if (tree.obj.type !== 'IDENT' || tree.field.some((field) => typeof field !== 'string')) {
            return undefined;
        }
        return [tree.obj.id, ...(tree.field as string[])];
    }

    /**
     * Resolve static class members, constants, and enumeration members.
     *
     * @param definition Class definition that matched the qualified prefix.
     * @param fields Remaining field chain after the class name.
     * @param scope Evaluation scope for constant defaults and enumeration arguments.
     * @returns Runtime value selected by the member chain.
     */
    private resolveClassDefinitionMemberChain(definition: ClassDefinition, fields: string[], scope: Scope): NodeInput {
        let current: NodeInput = definition;
        for (const field of fields) {
            if (ClassDefinition.isInstanceOf(current)) {
                const property = current.findProperty(field);
                if (property?.isConstant) {
                    this.assertCanReadClassProperty(property, field, current.name);
                    current = property.defaultValue ? this.evaluatedExpressionValue(property.defaultValue, scope, `constant property ${field}`) : MultiArray.emptyArray();
                    continue;
                }
                const enumeration = current.findEnumeration(field);
                if (enumeration) {
                    const args = enumeration.args.map((arg, index) =>
                        this.runtimeExpressionValue(this.evaluatedExpressionValue(arg, scope, `enumeration argument ${index + 1}`), `enumeration argument ${index + 1}`),
                    );
                    current = ClassEnumerationValue.create(enumeration.classDefinition, enumeration, args);
                    continue;
                }
                if (field === 'empty') {
                    current = ClassEmptyMethod.bind(current);
                    continue;
                }
                const method = current.findMethod(field, (item) => item.isStatic);
                if (method) {
                    if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
                        this.context.throwEvalError(`method '${field}' has ${method.access} access for class ${current.name}.`);
                    }
                    current = ClassStaticMethod.bind(current, method);
                    continue;
                }
                this.context.throwEvalError(`unknown static method '${field}' for class ${current.name}.`);
            } else {
                current = Structure.getField(current, [field]);
            }
        }
        return current;
    }

    /**
     * Resolve a symbolic dotted chain as a package/class-qualified access.
     *
     * The resolver classifies the qualified prefix without evaluating ordinary
     * dot indexing. Local variables intentionally block package/class
     * interpretation of the same first component, preserving MATLAB/Octave
     * precedence for expressions such as `pkg.field` when `pkg` is a variable.
     *
     * @param tree Dotted reference node.
     * @param scope Lookup scope.
     * @returns Structured qualified access result, if the chain is symbolic.
     */
    private resolveQualifiedAccess(tree: NodeIndirectRef, scope: Scope): QualifiedAccessResolution | undefined {
        const parts = this.qualifiedReferenceParts(tree);
        if (!parts || parts.length < 2 || this.hasConcreteName(scope, parts[0])) {
            return undefined;
        }
        for (let prefixLength = parts.length; prefixLength >= 2; prefixLength--) {
            const name = parts.slice(0, prefixLength).join('.');
            const resolved = this.resolveRuntimeClass(name, scope, { imports: false });
            if (resolved?.kind === 'class') {
                return {
                    kind: 'class-member-chain',
                    parts,
                    prefixLength,
                    resolvedName: resolved.resolvedName,
                    classDefinition: resolved.classDefinition,
                };
            }
        }
        const name = parts.join('.');
        const resolved = this.resolveRuntimeFunction(name, scope, { imports: false });
        if (resolved?.functionDefinition) {
            const handle = FunctionHandle.create(resolved.resolvedName);
            handle.parent = tree;
            return {
                kind: 'function',
                parts,
                prefixLength: parts.length,
                resolvedName: resolved.resolvedName,
                functionHandle: handle,
            };
        }
        return undefined;
    }

    /**
     * Resolve package/class-qualified names before ordinary dot indexing.
     *
     * MATLAB/Octave allow expressions such as `pkg.Class.staticMethod`,
     * `Class.Constant`, and fully qualified function handles. This helper
     * recognizes those symbolic chains while leaving normal struct/object field
     * indexing to the evaluator.
     *
     * @param tree Dotted reference node.
     * @param scope Lookup scope.
     * @returns Resolved runtime value, or `undefined` when the reference is ordinary dot indexing.
     */
    private resolveQualifiedNameAccess(tree: NodeIndirectRef, scope: Scope): NodeInput | undefined {
        const resolved = this.resolveQualifiedAccess(tree, scope);
        if (!resolved) {
            return undefined;
        }
        switch (resolved.kind) {
            case 'class-member-chain':
                resolved.classDefinition!.parent = tree;
                return this.resolveClassDefinitionMemberChain(resolved.classDefinition!, resolved.parts.slice(resolved.prefixLength), scope);
            case 'function':
                return resolved.functionHandle;
        }
    }

    private hasConcreteName(scope: Scope, name: string): boolean {
        const entry = scope.resolveName(name);
        return typeof entry?.node !== 'undefined' && !entry.undefinedReference;
    }

    /**
     * Resolve a simple imported name as a static class method.
     *
     * This supports MATLAB-style declarations such as
     * `import pkg.Class.method`, allowing `method(args)` to dispatch through
     * the same `ClassStaticMethod` path used by `pkg.Class.method(args)`.
     *
     * @param name Simple method name being called.
     * @param scope Scope whose import table should be searched.
     * @returns Static method wrapper, or `undefined` when no import resolves.
     */
    public resolveImportedStaticMethod(name: string, scope: Scope): ClassStaticMethod | undefined {
        const resolvedMethods = [
            ...new Map(
                scope
                    .importedNameCandidates(name)
                    .map((candidate) => this.importedStaticMethodCandidate(candidate, scope))
                    .filter((item): item is { name: string; method: ClassStaticMethod } => typeof item !== 'undefined')
                    .map((item) => [item.name, item.method]),
            ).entries(),
        ];
        if (resolvedMethods.length > 1) {
            this.context.throwEvalError(`imported name '${name}' is ambiguous: ${resolvedMethods.map(([candidate]) => candidate).join(', ')}.`);
        }
        return resolvedMethods[0]?.[1];
    }

    /**
     * Resolve a static method by fully qualified name or by visible imports.
     *
     * Direct dotted calls such as `pkg.Class.method()` already resolve through
     * `resolveQualifiedNameAccess`. Named handles and textual calls (`@...`,
     * `str2func`, `feval`, `nargin`, `nargout`) need the same dispatch decision
     * without first building a dotted AST node.
     *
     * @param name Method name written in source text.
     * @param scope Scope used for class lookup and simple-name imports.
     * @returns Bound static method, or `undefined` when the name is not a static method.
     */
    public resolveStaticMethod(name: string, scope: Scope): ClassStaticMethod | undefined {
        const canonical = this.context.aliasNameFunction(name);
        if (!canonical.includes('.')) {
            return this.resolveImportedStaticMethod(canonical, scope);
        }
        const parts = canonical.split('.');
        const methodName = parts[parts.length - 1];
        const className = parts.slice(0, -1).join('.');
        const resolved = this.resolveRuntimeClass(className, scope, { imports: false });
        if (resolved?.kind !== 'class' || !resolved.classDefinition) {
            return undefined;
        }
        const method = resolved.classDefinition.findMethod(methodName, (item) => item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method '${methodName}' has ${method.access} access for class ${resolved.classDefinition.name}.`);
        }
        return ClassStaticMethod.bind(resolved.classDefinition, method);
    }

    private importedStaticMethodCandidate(candidate: string, scope: Scope): { name: string; method: ClassStaticMethod } | undefined {
        const parts = candidate.split('.');
        if (parts.length < 2) {
            return undefined;
        }
        const methodName = parts[parts.length - 1];
        const className = parts.slice(0, -1).join('.');
        const resolved = this.resolveRuntimeClass(className, scope, { imports: false });
        if (resolved?.kind !== 'class' || !resolved.classDefinition) {
            return undefined;
        }
        const method = resolved.classDefinition.findMethod(methodName, (item) => item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method '${methodName}' has ${method.access} access for class ${resolved.classDefinition.name}.`);
        }
        return { name: candidate, method: ClassStaticMethod.bind(resolved.classDefinition, method) };
    }

    /**
     * Detect whether an indexing expression contains a resolvable qualified name.
     *
     * @param tree Expression subtree to inspect.
     * @param scope Lookup scope.
     * @returns `true` when a dotted operand resolves as a package/class-qualified symbol.
     */
    private hasQualifiedNameAccessOperand(tree: NodeInput, scope: Scope): boolean {
        if (AST.isNodeIndirectRef(tree)) {
            if (typeof this.resolveQualifiedAccess(tree, scope) !== 'undefined') {
                return true;
            }
            return this.hasQualifiedNameAccessOperand(tree.obj, scope);
        }
        if (AST.isNodeIndexExpr(tree)) {
            return this.hasQualifiedNameAccessOperand(tree.expr, scope);
        }
        return false;
    }

    /**
     * Resolve a `?ClassName` metaclass literal, including meta-object fields.
     *
     * @param className Class or meta-object field chain from the literal.
     * @param scope Lookup scope.
     * @returns Meta-class object or selected meta-object field.
     */
    private resolveMetaclassLiteral(className: string, scope: Scope): NodeInput {
        const parts = className.split('.');
        for (let prefixLength = parts.length; prefixLength >= 1; prefixLength--) {
            const name = parts.slice(0, prefixLength).join('.');
            const definition = this.context.resolveClassDefinition(name, scope);
            if (!definition) {
                continue;
            }
            let current: NodeInput = this.createClassMetaClass(definition, scope);
            for (const field of parts.slice(prefixLength)) {
                if (ClassMetaObject.isInstanceOf(current)) {
                    const value = current.getProperty(field);
                    if (typeof value === 'undefined') {
                        this.context.throwEvalError(`unknown property '${field}' for ${current.kind}.`);
                    }
                    current = value;
                } else {
                    current = Structure.getField(current, [field]);
                }
            }
            return current;
        }
        this.context.throwEvalError(`metaclass: class '${className}' is not defined.`);
    }

    /**
     * Create a runtime `meta.class` object with lazy property default
     * evaluation.
     *
     * Parsed class metadata keeps default expressions as AST. Runtime meta
     * access should expose evaluated default values, so the provider evaluates
     * the default only when `meta.property.DefaultValue` or validation metadata
     * asks for it.
     *
     * @param definition Class metadata to wrap.
     * @param scope Scope used to evaluate property default expressions.
     * @returns Runtime meta-class object.
     */
    private createClassMetaClass(definition: ClassDefinition, scope: Scope = this.context.currentScope): ClassMetaClass {
        return ClassMetaClass.create(definition, (property) =>
            property.defaultValue
                ? this.runtimeExpressionValue(this.evaluatedExpressionValue(property.defaultValue, scope, `property ${property.name} default`), `property ${property.name} default`)
                : undefined,
        );
    }

    /**
     * Create a runtime `meta.property` object with the same lazy default
     * evaluation used by `meta.class.PropertyList`.
     *
     * @param property Property metadata to wrap.
     * @param scope Scope used to evaluate property default expressions.
     * @returns Runtime meta-property object.
     */
    private createClassMetaProperty(property: ClassDefinition['properties'][number], scope: Scope = this.context.currentScope): ClassMetaProperty {
        return ClassMetaProperty.create(property, (propertyDefinition) =>
            propertyDefinition.defaultValue
                ? this.runtimeExpressionValue(
                      this.evaluatedExpressionValue(propertyDefinition.defaultValue, scope, `property ${propertyDefinition.name} default`),
                      `property ${propertyDefinition.name} default`,
                  )
                : undefined,
        );
    }

    /**
     * Return the MATLAB diagnostic for one argument-count mismatch.
     */
    private functionCountMessage(name: 'nargchk' | 'narginchk' | 'nargoutchk', kind: 'low' | 'high'): { message: string; identifier: string } {
        if (name === 'nargchk') {
            return kind === 'low'
                ? { message: 'Not enough input arguments.', identifier: 'MATLAB:nargchk:notEnoughInputs' }
                : { message: 'Too many input arguments.', identifier: 'MATLAB:nargchk:tooManyInputs' };
        }
        if (name === 'narginchk') {
            return kind === 'low'
                ? { message: 'Not enough input arguments.', identifier: 'MATLAB:narginchk:notEnoughInputs' }
                : { message: 'Too many input arguments.', identifier: 'MATLAB:narginchk:tooManyInputs' };
        }
        return kind === 'low'
            ? { message: 'Not enough output arguments.', identifier: 'MATLAB:nargoutchk:notEnoughOutputs' }
            : { message: 'Too many output arguments.', identifier: 'MATLAB:nargoutchk:tooManyOutputs' };
    }

    /**
     * Classify an argument-count check without deciding how to report it.
     */
    private functionCountStatus(name: 'nargchk' | 'narginchk' | 'nargoutchk', min: NodeInput, max: NodeInput, count: number): 'ok' | 'low' | 'high' {
        const minimum = FunctionArity.countBound(name, min, false, (message) => this.context.throwSyntaxError(message));
        const maximum = FunctionArity.countBound(name, max, true, (message) => this.context.throwSyntaxError(message));
        if (maximum < minimum) {
            this.context.throwSyntaxError(`${name}: maximum count must be greater than or equal to minimum count.`);
        }
        return count < minimum ? 'low' : count > maximum ? 'high' : 'ok';
    }

    /**
     * Implement `narginchk` and the throwing two-argument form of `nargoutchk`.
     */
    private checkFunctionCount(name: 'narginchk' | 'nargoutchk', min: NodeInput, max: NodeInput): NodeInput {
        const count = name === 'narginchk' ? Complex.realToNumber(this.context.currentFunctionArgumentCountOrZero()) : Complex.realToNumber(this.context.currentFunctionOutputCountOrZero());
        const status = this.functionCountStatus(name, min, max, count);
        if (status !== 'ok') {
            this.context.throwEvalError(`${name}: invalid number of ${name === 'narginchk' ? 'input' : 'output'} arguments.`);
        }
        return AST.nodeVoid();
    }

    /**
     * Build the message-return forms shared by `nargchk` and `nargoutchk`.
     */
    private functionCountMessageResult(name: 'nargchk' | 'nargoutchk', args: NodeInput[]): NodeInput {
        const count = FunctionArity.countBound(name, args[2], false, (message) => this.context.throwSyntaxError(message));
        const status = this.functionCountStatus(name, args[0], args[1], count);
        if (args.length === 4) {
            const outputKind = this.charControlArgument(args[3], `${name} output kind`).str;
            AST.throwInvalidCallError(name, outputKind !== 'struct' && outputKind !== 'string', (message) => this.context.throwSyntaxError(message));
            if (outputKind === 'string') {
                return status === 'ok' ? new CharString('') : CharString.create(this.functionCountMessage(name, status).message, "'");
            }
            if (status === 'ok') {
                return new Structure({});
            }
            const diagnostic = this.functionCountMessage(name, status);
            return new Structure({ message: CharString.create(diagnostic.message, "'"), identifier: CharString.create(diagnostic.identifier, "'") });
        }
        return status === 'ok' ? new CharString('') : CharString.create(this.functionCountMessage(name, status).message, "'");
    }

    /**
     * Implement all supported `nargoutchk` forms.
     */
    private nargoutchkResult(args: NodeInput[]): NodeInput {
        return args.length === 2 ? this.checkFunctionCount('nargoutchk', args[0], args[1]) : this.functionCountMessageResult('nargoutchk', args);
    }

    /**
     * Implement legacy MATLAB/Octave `nargchk`.
     */
    private nargchkResult(args: NodeInput[]): NodeInput {
        return this.functionCountMessageResult('nargchk', args);
    }

    private lookupImportedSourceResolution(
        name: string,
        scope: Scope,
        kind: 'class' | 'function',
        resolveValidSource: (name: string) => SourceEntry | undefined,
    ): SymbolResolution | undefined {
        const canonical = this.context.aliasNameFunction(name);
        const directSource = resolveValidSource(canonical);
        if (directSource) {
            return { kind, name, resolvedName: canonical, source: 'local', sourceName: directSource.sourceName ?? directSource.name ?? canonical };
        }
        if (!canonical.includes('.')) {
            const imported = [
                ...new Map(
                    scope
                        .importedNameCandidates(canonical)
                        .map((importedName) => this.context.aliasNameFunction(importedName))
                        .map((importedCanonical) => ({ importedCanonical, source: resolveValidSource(importedCanonical) }))
                        .filter((item): item is { importedCanonical: string; source: SourceEntry } => typeof item.source !== 'undefined')
                        .map(({ importedCanonical, source }) => [
                            importedCanonical,
                            { kind, name, resolvedName: importedCanonical, source: 'import' as const, sourceName: source.sourceName ?? source.name ?? importedCanonical },
                        ]),
                ).values(),
            ];
            if (imported.length > 1) {
                this.context.throwEvalError(`imported name '${canonical}' is ambiguous: ${imported.map((item) => item.resolvedName).join(', ')}.`);
            }
            if (imported.length === 1) {
                return imported[0];
            }
        }
        return undefined;
    }

    private lookupClassSourceResolution(name: string, scope: Scope): SymbolResolution | undefined {
        return this.lookupImportedSourceResolution(name, scope, 'class', (candidate) => this.validClassSource(candidate));
    }

    private lookupFunctionSourceResolution(name: string, scope: Scope): SymbolResolution | undefined {
        return this.lookupImportedSourceResolution(name, scope, 'function', (candidate) => this.validFunctionSource(candidate));
    }

    private lookupScriptSourceResolution(name: string): SymbolResolution | undefined {
        const canonical = this.context.aliasNameFunction(name);
        const source = this.validScriptSource(canonical);
        if (source) {
            return { kind: 'script', name, resolvedName: canonical, source: 'local', sourceName: source.sourceName ?? source.name ?? canonical };
        }
        return undefined;
    }

    /**
     * Resolve browser-hosted virtual source directories for `exist`/`which`.
     */
    private lookupDirectorySourceResolution(name: string): SymbolResolution | undefined {
        const canonical = this.context.aliasNameFunction(name);
        return this.sourceResolver.hasDirectory(canonical) ? { kind: 'directory', name, resolvedName: canonical, source: 'local' } : undefined;
    }

    private resolveLookupSymbol(name: string, kind?: string, scope: Scope = this.context.currentScope): SymbolResolution | undefined {
        const normalizedKind = kind?.trim().toLowerCase();
        if (normalizedKind === 'dir') {
            return this.lookupDirectorySourceResolution(name);
        }
        if (normalizedKind === 'builtin') {
            const canonical = this.context.aliasNameFunction(name);
            const builtin = this.context.builtInFunctionTable[canonical];
            return builtin ? { kind: 'builtin', name, resolvedName: canonical, source: 'builtin', functionDefinition: builtin } : undefined;
        }
        const classes = normalizedKind === 'class' || typeof normalizedKind === 'undefined';
        const classSources = classes || normalizedKind === 'file';
        const scripts = normalizedKind === 'file' || typeof normalizedKind === 'undefined';
        const functions = normalizedKind !== 'class' && normalizedKind !== 'var' && normalizedKind !== 'variable';
        const resolved = this.resolveRuntimeSymbol(name, scope, {
            variables: normalizedKind !== 'class' && normalizedKind !== 'file' && normalizedKind !== 'function',
            classes,
            loadClasses: false,
            functions,
            loadFunctions: false,
        });
        if (resolved) {
            if (functions && resolved.kind === 'builtin') {
                const sourceFunction = this.lookupFunctionSourceResolution(name, scope);
                if (sourceFunction) {
                    return sourceFunction;
                }
            }
            return resolved;
        }
        return (
            (functions ? this.lookupFunctionSourceResolution(name, scope) : undefined) ??
            (classSources ? this.lookupClassSourceResolution(name, scope) : undefined) ??
            (scripts ? this.lookupScriptSourceResolution(name) : undefined) ??
            (normalizedKind === 'file' || typeof normalizedKind === 'undefined' ? this.lookupDirectorySourceResolution(name) : undefined)
        );
    }

    private existCode(name: string, kind?: string): number {
        const resolved = this.resolveLookupSymbol(name, kind);
        return FunctionLookup.existCodeFromResolution(name, kind, resolved);
    }

    private whichResult(name: string, handle?: FunctionHandle): CharString {
        const scope = (handle?.closure as Scope | undefined) ?? this.context.currentScope;
        const resolved = handle ? (handle.id ? this.resolveLookupSymbol(handle.id, 'function', scope) : undefined) : this.resolveLookupSymbol(name);
        const staticMethod = !resolved && name ? this.staticMethodInfo(name, scope) : undefined;
        return FunctionLookup.whichResultFromResolution(name, resolved, handle, (item) => FunctionHandle.unparse(item, this), staticMethod);
    }

    private isClassName(name: string, scope: Scope = this.context.currentScope): boolean {
        return FunctionLookup.isRuntimeClassName(name) || Boolean(this.resolveRuntimeClass(name, scope, { loadClasses: false })) || Boolean(this.lookupClassSourceResolution(name, scope));
    }

    private valueIsRuntimeClass(value: NodeInput, className: string): boolean {
        switch (className) {
            case 'double':
                return this.getValueClassName(value) === className;
            case 'logical':
            case 'char':
            case 'cell':
            case 'struct':
            case 'function_handle':
                return this.getValueClassName(value) === className;
            case 'event.listener':
                return ClassEventListener.isInstanceOf(value);
            case 'event.proplistener':
                return ClassEventListener.isInstanceOf(value) && value.kind === 'event.proplistener';
            case 'event.EventData':
                return ClassEventData.isInstanceOf(value) || (ClassInstance.isInstanceOf(value) && value.classDefinition.isSubclassOfName('event.EventData'));
            case 'event.PropertyEvent':
                return ClassPropertyEvent.isInstanceOf(value);
            default:
                if (MultiArray.isInstanceOf(value)) {
                    const values = MultiArray.linearize(value);
                    return values.length > 0 && values.every((item) => this.valueIsRuntimeClass(item, className));
                }
                if (ClassMetaObject.isInstanceOf(value)) {
                    return value.kind === className;
                }
                if (ClassInstance.isInstanceOf(value)) {
                    return value.classDefinition.name === className || value.classDefinition.isSubclassOfName(className);
                }
                if (ClassEnumerationValue.isInstanceOf(value)) {
                    return value.classDefinition.name === className || value.classDefinition.isSubclassOfName(className);
                }
                return false;
        }
    }

    private valueMatchesValidationClass(value: NodeInput, className: string, scope: Scope, allowEmptyObjectPlaceholder = false): boolean {
        if (FunctionValidation.matchesClass(value, className) || this.valueIsRuntimeClass(value, className)) {
            return true;
        }
        const definition = this.context.resolveClassDefinition(className, scope);
        if (!definition) {
            return false;
        }
        const matchesDefinition = (item: NodeInput): boolean => {
            if (ClassInstance.isInstanceOf(item) || ClassEnumerationValue.isInstanceOf(item)) {
                return item.classDefinition === definition || item.classDefinition.isSubclassOf(definition);
            }
            return false;
        };
        if (MultiArray.isInstanceOf(value)) {
            const values = MultiArray.linearize(value);
            if (values.length === 0 && allowEmptyObjectPlaceholder && MultiArray.isEmpty(value)) {
                return true;
            }
            return values.length > 0 && values.every(matchesDefinition);
        }
        return matchesDefinition(value);
    }

    private classIntrospectionArgument(name: 'properties' | 'fieldnames' | 'methods' | 'events' | 'enumeration' | 'superclasses' | 'isprop' | 'ismethod', value: NodeInput): NodeInput {
        if (!CharString.isInstanceOf(value)) {
            return value;
        }
        const className = value.str;
        const definition = this.context.resolveClassDefinition(className);
        if (definition) {
            return definition;
        }
        this.context.throwEvalError(`${name}: class '${className}' is not defined.`);
    }

    private metaclassArgument(value: NodeInput): ClassMetaClass {
        if (ClassMetaClass.isInstanceOf(value)) {
            return value;
        }
        if (ClassDefinition.isInstanceOf(value)) {
            return this.createClassMetaClass(value);
        }
        if (ClassInstance.isInstanceOf(value) || ClassEnumerationValue.isInstanceOf(value)) {
            return this.createClassMetaClass(value.classDefinition);
        }
        if (CharString.isInstanceOf(value)) {
            const definition = this.context.resolveClassDefinition(value.str);
            if (definition) {
                return this.createClassMetaClass(definition);
            }
            this.context.throwEvalError(`metaclass: class '${value.str}' is not defined.`);
        }
        this.context.throwEvalError('metaclass: input must be a class object or class name.');
    }

    private eventData(source: ClassInstance, eventName: string): ClassEventData {
        return ClassEventData.create(source, eventName);
    }

    private propertyEventData(source: ClassInstance, propertyName: string, eventName: string = propertyName, propertySource: NodeInput = source): ClassPropertyEvent {
        return ClassPropertyEvent.create(source, propertyName, eventName, propertySource);
    }

    private isEventDataObject(value: NodeInput): value is ClassEventData | ClassInstance {
        return ClassEventData.isInstanceOf(value) || (ClassInstance.isInstanceOf(value) && value.classDefinition.isSubclassOfName('event.EventData'));
    }

    private prepareEventDataObject(source: ClassInstance, eventName: string, data: ClassEventData | ClassInstance): ClassEventData | ClassInstance {
        if (ClassEventData.isInstanceOf(data)) {
            data.source = source;
            data.eventName = eventName;
        } else if (ClassInstance.isInstanceOf(data)) {
            data.eventDataSource = source;
            data.eventDataEventName = eventName;
        }
        return data;
    }

    private propertyEventKey(propertyName: string, eventName: string): string {
        return `${propertyName}:${eventName}`;
    }

    private validateClassEventAccess(instance: ClassInstance, eventName: string, action: 'listen' | 'notify'): ClassEventDefinition | undefined {
        const event = instance.classDefinition.findEvent(eventName);
        if (event) {
            const access = action === 'listen' ? event.listenAccess : event.notifyAccess;
            if (!this.context.canAccessClassMember(event.classDefinition, access)) {
                this.context.throwEvalError(`event '${eventName}' has ${access} ${action} access for class ${instance.classDefinition.name}.`);
            }
            return event;
        }
        const property = instance.classDefinition.findProperty(eventName);
        if (property && (property.isGetObservable || property.isSetObservable)) {
            return undefined;
        }
        this.context.throwEvalError(`unknown event '${eventName}' for class ${instance.classDefinition.name}.`);
    }

    private validatePropertyEventAccess(instance: ClassInstance, propertyName: string, eventName: string): void {
        const property = instance.classDefinition.findProperty(propertyName);
        if (!property) {
            this.context.throwEvalError(`unknown property '${propertyName}' for class ${instance.classDefinition.name}.`);
        }
        switch (eventName) {
            case 'PreGet':
            case 'PostGet':
                if (!property.isGetObservable) {
                    this.context.throwEvalError(`property '${propertyName}' is not GetObservable for class ${instance.classDefinition.name}.`);
                }
                return;
            case 'PreSet':
            case 'PostSet':
                if (!property.isSetObservable) {
                    this.context.throwEvalError(`property '${propertyName}' is not SetObservable for class ${instance.classDefinition.name}.`);
                }
                return;
            default:
                this.context.throwEvalError(`unknown property event '${eventName}' for class ${instance.classDefinition.name}.`);
        }
    }

    private propertyListenerName(instance: ClassInstance, property: NodeInput, functionName: 'addlistener' | 'listener'): string {
        if (CharString.isInstanceOf(property)) {
            return property.str;
        }
        if (ClassMetaProperty.isInstanceOf(property)) {
            const effectiveProperty = instance.classDefinition.findProperty(property.property.name);
            if (!effectiveProperty || effectiveProperty !== property.property) {
                this.context.throwEvalError(`property '${property.property.name}' is not a property of class ${instance.classDefinition.name}.`);
            }
            return property.property.name;
        }
        this.context.throwEvalError(`${functionName}: property name must be a string or meta.property.`);
    }

    private propertyListenerNameList(instance: ClassInstance, property: MultiArray, functionName: 'addlistener' | 'listener'): string[] {
        return MultiArray.linearize(property).map((item, index) => this.propertyListenerName(instance, this.expressionValue(item, `property${index + 1}`), functionName));
    }

    private addClassPropertyListenerArray(
        functionName: 'addlistener' | 'listener',
        source: ClassInstance,
        properties: MultiArray,
        propertyEventName: NodeInput,
        callback: NodeInput,
    ): MultiArray {
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError(`${functionName}: source must be a handle object.`);
        }
        if (!CharString.isInstanceOf(propertyEventName)) {
            this.context.throwEvalError(`${functionName}: property event name must be a string.`);
        }
        if (!FunctionHandle.isInstanceOf(callback)) {
            this.context.throwEvalError(`${functionName}: callback must be a function handle.`);
        }
        const names = this.propertyListenerNameList(source, properties, functionName);
        const result = new MultiArray(properties.dimension);
        for (let index = 0; index < names.length; index++) {
            const propertyName = names[index];
            this.validatePropertyEventAccess(source, propertyName, propertyEventName.str);
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
            result.array[row][column] = ClassInstance.addListener(source, propertyEventName.str, callback, this.propertyEventKey(propertyName, propertyEventName.str), 'event.proplistener');
        }
        MultiArray.setType(result);
        return result;
    }

    private addClassListenerForSource(
        functionName: 'addlistener' | 'listener',
        source: ClassInstance,
        event: NodeInput,
        maybeEventName: NodeInput,
        maybeCallback: NodeInput,
        arity: number,
    ): ClassEventListener {
        const callback = arity === 4 ? maybeCallback : maybeEventName;
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError(`${functionName}: source must be a handle object.`);
        }
        if (!FunctionHandle.isInstanceOf(callback)) {
            this.context.throwEvalError(`${functionName}: callback must be a function handle.`);
        }
        if (arity === 4) {
            if (!CharString.isInstanceOf(maybeEventName)) {
                this.context.throwEvalError(`${functionName}: property event name must be a string.`);
            }
            const propertyName = this.propertyListenerName(source, event, functionName);
            this.validatePropertyEventAccess(source, propertyName, maybeEventName.str);
            return ClassInstance.addListener(source, maybeEventName.str, callback, this.propertyEventKey(propertyName, maybeEventName.str), 'event.proplistener');
        }
        if (!CharString.isInstanceOf(event)) {
            this.context.throwEvalError(`${functionName}: event name must be a string.`);
        }
        this.validateClassEventAccess(source, event.str, 'listen');
        const property = source.classDefinition.findProperty(event.str);
        return ClassInstance.addListener(source, event.str, callback, event.str, property ? 'event.proplistener' : 'event.listener');
    }

    private addClassListener(functionName: 'addlistener' | 'listener', ...args: NodeInput[]): NodeInput {
        const [source, event, maybeEventName, maybeCallback] = args;
        if (MultiArray.isInstanceOf(source) && this.hasClassInstanceElement(source)) {
            const result = new MultiArray(source.dimension);
            const sources = MultiArray.linearize(source);
            for (let index = 0; index < sources.length; index++) {
                const item = this.expressionValue(sources[index], `source${index + 1}`);
                if (!ClassInstance.isInstanceOf(item)) {
                    this.context.throwEvalError(`${functionName}: source array must contain class instances.`);
                }
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
                result.array[row][column] = this.addClassListenerForSource(functionName, item, event, maybeEventName, maybeCallback, args.length);
            }
            MultiArray.setType(result);
            return result;
        }
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError(`${functionName}: source must be a class instance.`);
        }
        if (args.length === 4 && MultiArray.isInstanceOf(event)) {
            return this.addClassPropertyListenerArray(functionName, source, event, maybeEventName, maybeCallback);
        }
        return this.addClassListenerForSource(functionName, source, event, maybeEventName, maybeCallback, args.length);
    }

    private createClassEventListenerForSource(source: ClassInstance, event: NodeInput, callback: NodeInput): ClassEventListener {
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError('event.listener: source must be a class instance.');
        }
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError('event.listener: source must be a handle object.');
        }
        if (!CharString.isInstanceOf(event)) {
            this.context.throwEvalError('event.listener: event name must be a string.');
        }
        if (!FunctionHandle.isInstanceOf(callback)) {
            this.context.throwEvalError('event.listener: callback must be a function handle.');
        }
        if (!this.validateClassEventAccess(source, event.str, 'listen')) {
            this.context.throwEvalError('event.listener: event name must name a class event.');
        }
        return ClassInstance.addListener(source, event.str, callback, event.str, 'event.listener');
    }

    private createClassEventListener(...args: NodeInput[]): NodeInput {
        const [source, event, callback] = args;
        if (MultiArray.isInstanceOf(source) && this.hasClassInstanceElement(source)) {
            const result = new MultiArray(source.dimension);
            const sources = MultiArray.linearize(source);
            for (let index = 0; index < sources.length; index++) {
                const item = this.expressionValue(sources[index], `source${index + 1}`);
                if (!ClassInstance.isInstanceOf(item)) {
                    this.context.throwEvalError('event.listener: source array must contain class instances.');
                }
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], index);
                result.array[row][column] = this.createClassEventListenerForSource(item, event, callback);
            }
            MultiArray.setType(result);
            return result;
        }
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError('event.listener: source must be a class instance.');
        }
        return this.createClassEventListenerForSource(source, event, callback);
    }

    private createClassPropertyListener(...args: NodeInput[]): NodeInput {
        if (args.length !== 4) {
            AST.throwInvalidCallError('event.proplistener', true, (message) => this.context.throwEvalError(message));
        }
        return this.addClassListener('listener', ...args);
    }

    private notifyClassEventForSource(source: ClassInstance, eventName: string, data?: ClassEventData | ClassInstance): void {
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError('notify: source must be a handle object.');
        }
        this.validateClassEventAccess(source, eventName, 'notify');
        this.dispatchClassEvent(source, eventName, data ? this.prepareEventDataObject(source, eventName, data) : this.eventData(source, eventName));
    }

    private notifyClassEvent(source: NodeInput, event: NodeInput, data?: NodeInput): NodeInput {
        if (!CharString.isInstanceOf(event)) {
            this.context.throwEvalError('notify: event name must be a string.');
        }
        if (typeof data !== 'undefined' && !this.isEventDataObject(data)) {
            this.context.throwEvalError('notify: event data must be an event.EventData object.');
        }
        if (MultiArray.isInstanceOf(source) && this.hasClassInstanceElement(source)) {
            for (const item of MultiArray.linearize(source)) {
                const value = this.expressionValue(item, 'source');
                if (!ClassInstance.isInstanceOf(value)) {
                    this.context.throwEvalError('notify: source array must contain class instances.');
                }
                this.notifyClassEventForSource(value, event.str, data);
            }
            return AST.nodeVoid();
        }
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError('notify: source must be a class instance.');
        }
        this.notifyClassEventForSource(source, event.str, data);
        return AST.nodeVoid();
    }

    private dispatchClassEvent(source: ClassInstance, eventName: string, data: ClassEventData | ClassInstance = this.eventData(source, eventName)): void {
        for (const listener of ClassInstance.listenersFor(source, eventName)) {
            if (listener.notifying && !listener.recursive) {
                continue;
            }
            listener.notifying = true;
            try {
                this.context.apply(this.expressionValue(listener.callback, 'event callback'), this.classMethodArgumentValues([source, data], 'event'), AST.nodeIdentifier('notify'));
            } finally {
                listener.notifying = false;
            }
        }
    }

    private dispatchClassPropertyEvent(source: ClassInstance, propertyName: string, eventName: 'PreGet' | 'PostGet' | 'PreSet' | 'PostSet'): void {
        const property = source.classDefinition.findProperty(propertyName);
        if (!property) {
            this.context.throwEvalError(`unknown property '${propertyName}' for class ${source.classDefinition.name}.`);
        }
        const metaProperty = this.createClassMetaProperty(property);
        const propertyData = this.propertyEventData(source, propertyName, eventName, metaProperty);
        for (const listener of ClassInstance.listenersFor(source, this.propertyEventKey(propertyName, eventName))) {
            if (listener.notifying && !listener.recursive) {
                continue;
            }
            listener.notifying = true;
            try {
                this.context.apply(
                    this.expressionValue(listener.callback, 'property event callback'),
                    this.classMethodArgumentValues([metaProperty, propertyData], 'property event'),
                    AST.nodeIdentifier('addlistener'),
                );
            } finally {
                listener.notifying = false;
            }
        }
        if (eventName === 'PostGet' || eventName === 'PostSet') {
            const shortData = this.propertyEventData(source, propertyName, propertyName, metaProperty);
            for (const listener of ClassInstance.listenersFor(source, propertyName)) {
                if (listener.notifying && !listener.recursive) {
                    continue;
                }
                listener.notifying = true;
                try {
                    this.context.apply(
                        this.expressionValue(listener.callback, 'property event callback'),
                        this.classMethodArgumentValues([metaProperty, shortData], 'property event'),
                        AST.nodeIdentifier('addlistener'),
                    );
                } finally {
                    listener.notifying = false;
                }
            }
        }
    }

    private resolveClassEventDataField(eventData: ClassEventData | ClassPropertyEvent, field: string): NodeInput {
        const value = ClassPropertyEvent.isInstanceOf(eventData) ? ClassPropertyEvent.getProperty(eventData, field) : ClassEventData.getProperty(eventData, field);
        if (typeof value === 'undefined') {
            if (field === 'Source' || field === 'EventName') {
                this.context.throwEvalError(`event data ${field} is not assigned until notify dispatch.`);
            }
            this.context.throwEvalError(`unknown property '${field}' for ${ClassPropertyEvent.isInstanceOf(eventData) ? 'event.PropertyEvent' : 'event.EventData'}.`);
        }
        return value;
    }

    private setClassEventDataField(eventData: ClassEventData | ClassPropertyEvent, field: string): void {
        this.context.throwEvalError(`cannot assign to read-only property '${field}' for ${ClassPropertyEvent.isInstanceOf(eventData) ? 'event.PropertyEvent' : 'event.EventData'}.`);
    }

    private resolveClassEventListenerField(listener: ClassEventListener, field: string): NodeInput {
        if (!ClassEventListener.isValid(listener)) {
            this.context.throwEvalError('invalid or deleted event listener.');
        }
        switch (field) {
            case 'Callback':
                return listener.callback;
            case 'Enabled':
                return listener.enabled ? Complex.true() : Complex.false();
            case 'EventName':
                return CharString.create(listener.eventName);
            case 'Recursive':
                return listener.recursive ? Complex.true() : Complex.false();
            case 'Source':
            case 'Object':
                return listener.source;
            default:
                this.context.throwEvalError(`unknown property '${field}' for ${listener.kind}.`);
        }
    }

    private removeClassEventListenerRegistration(listener: ClassEventListener): void {
        if (!ClassInstance.isInstanceOf(listener.source)) {
            return;
        }
        const listeners = listener.source.listeners[listener.listenerKey];
        if (!listeners) {
            return;
        }
        const index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
            delete listener.source.listeners[listener.listenerKey];
        }
    }

    private addClassEventListenerRegistration(listener: ClassEventListener, listenerKey: string): void {
        if (!ClassInstance.isInstanceOf(listener.source)) {
            return;
        }
        listener.source.listeners[listenerKey] ??= [];
        if (!listener.source.listeners[listenerKey].includes(listener)) {
            listener.source.listeners[listenerKey].push(listener);
        }
    }

    private setClassEventListenerEventName(listener: ClassEventListener, value: NodeInput): void {
        if (!CharString.isInstanceOf(value)) {
            this.context.throwEvalError(`event listener EventName must be a string.`);
        }
        if (!ClassInstance.isInstanceOf(listener.source)) {
            this.context.throwEvalError(`cannot assign EventName for ${listener.kind}.`);
        }
        let listenerKey = value.str;
        if (listener.kind === 'event.proplistener') {
            const [propertyName, phaseName] = listener.listenerKey.split(':');
            if (typeof phaseName === 'undefined') {
                this.context.throwEvalError(`cannot assign EventName for ${listener.kind}.`);
            }
            this.validatePropertyEventAccess(listener.source, propertyName, value.str);
            listenerKey = this.propertyEventKey(propertyName, value.str);
        } else {
            if (!this.validateClassEventAccess(listener.source, value.str, 'listen')) {
                this.context.throwEvalError(`event listener EventName must name a class event.`);
            }
        }
        this.removeClassEventListenerRegistration(listener);
        listener.eventName = value.str;
        listener.listenerKey = listenerKey;
        this.addClassEventListenerRegistration(listener, listenerKey);
    }

    private setClassEventListenerSource(listener: ClassEventListener, value: NodeInput): void {
        if (!ClassInstance.isInstanceOf(value)) {
            this.context.throwEvalError(`event listener Source must be a class instance.`);
        }
        if (!value.classDefinition.isHandleClass()) {
            this.context.throwEvalError(`event listener Source must be a handle object.`);
        }
        if (listener.kind === 'event.proplistener') {
            const [propertyName, phaseName] = listener.listenerKey.split(':');
            if (typeof phaseName === 'undefined') {
                this.validateClassEventAccess(value, listener.eventName, 'listen');
            } else {
                this.validatePropertyEventAccess(value, propertyName, listener.eventName);
            }
        } else if (!this.validateClassEventAccess(value, listener.eventName, 'listen')) {
            this.context.throwEvalError('event listener Source must define the listener EventName as a class event.');
        }
        this.removeClassEventListenerRegistration(listener);
        listener.source = value;
        this.addClassEventListenerRegistration(listener, listener.listenerKey);
    }

    private setClassEventListenerField(listener: ClassEventListener, field: string, value: NodeInput): void {
        if (!ClassEventListener.isValid(listener)) {
            this.context.throwEvalError('invalid or deleted event listener.');
        }
        switch (field) {
            case 'Callback':
                if (!FunctionHandle.isInstanceOf(value)) {
                    this.context.throwEvalError(`event listener Callback must be a function handle.`);
                }
                listener.callback = value;
                return;
            case 'Enabled':
                listener.enabled = this.toBoolean(value);
                return;
            case 'EventName':
                this.setClassEventListenerEventName(listener, value);
                return;
            case 'Recursive':
                listener.recursive = this.toBoolean(value);
                return;
            case 'Source':
            case 'Object':
                this.setClassEventListenerSource(listener, value);
                return;
            default:
                this.context.throwEvalError(`cannot assign to read-only property '${field}' for ${listener.kind}.`);
        }
    }

    /**
     * Resolve a property name passed to MATLAB's Set/Get mixin methods.
     *
     * Exact-name classes require an exact property name. Other SetGet classes
     * accept full case-insensitive names before considering partial matches,
     * where the lowest `PartialMatchPriority` value wins ambiguous prefixes.
     */
    private resolveSetGetProperty(instance: ClassInstance, name: string, functionName: 'get' | 'set'): ClassPropertyDefinition {
        if (!instance.classDefinition.isSetGetClass()) {
            this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
        }
        const properties = instance.classDefinition.allProperties();
        const exactCaseMatches = properties.filter((property) => property.name === name);
        if (exactCaseMatches.length === 1) {
            return exactCaseMatches[0];
        }
        if (exactCaseMatches.length > 1) {
            this.context.throwEvalError(`${functionName}: ambiguous property name '${name}' for class ${instance.classDefinition.name}.`);
        }
        if (instance.classDefinition.isSetGetExactNamesClass()) {
            this.context.throwEvalError(`${functionName}: unknown property '${name}' for class ${instance.classDefinition.name}.`);
        }
        const lowerName = name.toLowerCase();
        const exactMatches = properties.filter((property) => property.name.toLowerCase() === lowerName);
        if (exactMatches.length === 1) {
            return exactMatches[0];
        }
        if (exactMatches.length > 1) {
            this.context.throwEvalError(`${functionName}: ambiguous property name '${name}' for class ${instance.classDefinition.name}.`);
        }
        const partialMatches = properties.filter((property) => property.name.toLowerCase().startsWith(lowerName));
        if (partialMatches.length === 0) {
            this.context.throwEvalError(`${functionName}: unknown property '${name}' for class ${instance.classDefinition.name}.`);
        }
        const bestPriority = Math.min(...partialMatches.map((property) => property.partialMatchPriority));
        const bestMatches = partialMatches.filter((property) => property.partialMatchPriority === bestPriority);
        if (bestMatches.length !== 1) {
            this.context.throwEvalError(`${functionName}: ambiguous partial property name '${name}' for class ${instance.classDefinition.name}.`);
        }
        return bestMatches[0];
    }

    private isSetGetSettableProperty(property: ClassPropertyDefinition): boolean {
        return (
            !property.isConstant &&
            property.setAccess === 'public' &&
            (!property.isDependent || !!property.setMethodName || !!property.classDefinition.findMethod(`set.${property.name}`, (item) => !item.isStatic))
        );
    }

    private assertSetGetSettableProperty(property: ClassPropertyDefinition, functionName: 'set'): void {
        if (!this.isSetGetSettableProperty(property)) {
            this.context.throwEvalError(`${functionName}: property '${property.name}' is not publicly settable for class ${property.classDefinition.name}.`);
        }
    }

    private setGetObject(value: NodeInput, functionName: 'get' | 'set'): ClassInstance | MultiArray {
        if (MultiArray.isInstanceOf(value) && this.hasClassInstanceElement(value)) {
            this.setGetArrayRepresentative(value, functionName);
            return value;
        }
        if (!ClassInstance.isInstanceOf(value)) {
            this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
        }
        try {
            ClassInstance.throwIfDeleted(value);
        } catch (e: unknown) {
            this.context.throwEvalError((e as Error).message);
        }
        if (!value.classDefinition.isSetGetClass()) {
            this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
        }
        return value;
    }

    private setGetArrayRepresentative(value: MultiArray, functionName: 'get' | 'set'): ClassInstance {
        const instances = MultiArray.linearize(value);
        if (instances.length === 0) {
            this.context.throwEvalError(`${functionName}: first argument must be a nonempty matlab.mixin.SetGet object array.`);
        }
        const first = instances[0];
        if (!ClassInstance.isInstanceOf(first)) {
            this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
        }
        for (const instance of instances) {
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
            }
            try {
                ClassInstance.throwIfDeleted(instance);
            } catch (e: unknown) {
                this.context.throwEvalError((e as Error).message);
            }
            if (!instance.classDefinition.isSetGetClass()) {
                this.context.throwEvalError(`${functionName}: first argument must be a matlab.mixin.SetGet object.`);
            }
        }
        return first;
    }

    /**
     * Build the scalar structure returned by `get(obj)` for one Set/Get object.
     *
     * Only visible public readable properties are exposed, matching the subset
     * of MATLAB's `matlab.mixin.SetGet` behavior implemented by the runtime.
     *
     * @param instance Set/Get-compatible object instance.
     * @returns Structure whose fields are public property values.
     */
    private setGetStructure(instance: ClassInstance): Structure {
        const result: Record<string, StructureFieldValue> = {};
        for (const property of instance.classDefinition.allProperties().filter((item) => !item.isHidden && item.getAccess === 'public')) {
            result[property.name] = this.runtimeExpressionValue(this.resolveClassInstanceField(instance, property.name, AST.nodeIdentifier('get')), `property ${property.name}`);
        }
        return new Structure(result);
    }

    /**
     * Build the column structure array returned by `get(objArray)`.
     *
     * @param array Object array containing Set/Get-compatible instances.
     * @returns Column vector with one property structure per object.
     */
    private setGetStructureArray(array: MultiArray): MultiArray {
        const result = new MultiArray([MultiArray.linearLength(array), 1]);
        for (let n = 0; n < MultiArray.linearLength(array); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(array.dimension[0], array.dimension[1], n);
            const instance = array.array[i][j];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError('get: first argument must be a matlab.mixin.SetGet object.');
            }
            result.array[n][0] = this.setGetStructure(instance);
        }
        MultiArray.setType(result);
        return result;
    }

    /**
     * Normalize a property-name argument accepted by `get` and `set`.
     *
     * @param value Character name or cell array of character names.
     * @param functionName Built-in name used for diagnostics.
     * @returns Property names in linear cell order.
     */
    private setGetPropertyNames(value: NodeInput, functionName: 'get' | 'set'): string[] {
        if (CharString.isInstanceOf(value)) {
            return [value.str];
        }
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            const names = MultiArray.linearize(value);
            if (names.every(CharString.isInstanceOf)) {
                return this.charStringList(names, `${functionName} property name cell array`).map((name) => name.str);
            }
        }
        AST.throwInvalidCallError(functionName);
        return [];
    }

    /**
     * Evaluate `get(objArray, propertyNamesCell)`.
     *
     * MATLAB returns a cell array whose rows correspond to objects and columns
     * correspond to requested properties.
     *
     * @param target Scalar object or object array.
     * @param properties Resolved readable property definitions.
     * @returns Cell array of property values.
     */
    private getSetGetPropertyCell(target: ClassInstance | MultiArray, properties: ClassPropertyDefinition[]): MultiArray {
        const instances = ClassInstance.isInstanceOf(target) ? [target] : MultiArray.linearize(target);
        const result = new MultiArray([instances.length, properties.length], undefined, true);
        instances.forEach((instance, row) => {
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError('get: first argument must be a matlab.mixin.SetGet object.');
            }
            properties.forEach((property, column) => {
                result.array[row][column] = this.resolveClassInstanceField(instance, property.name, AST.nodeIdentifier('get'));
            });
        });
        MultiArray.setType(result);
        return result;
    }

    /**
     * Apply `set(objArray, propertyNamesCell, propertyValuesCell)`.
     *
     * The value cell array must have one row per object and one column per
     * property name, matching MATLAB's Set/Get table assignment form.
     *
     * @param target Scalar object or object array to mutate.
     * @param propertyNames Row cell array of property names.
     * @param propertyValues Cell array of assigned values.
     */
    private setSetGetPropertyCell(target: ClassInstance | MultiArray, propertyNames: MultiArray, propertyValues: MultiArray): void {
        if (!propertyNames.isCell || propertyNames.dimension[0] !== 1) {
            this.context.throwEvalError('set: property name cell array must be 1-by-N.');
        }
        if (!propertyValues.isCell) {
            AST.throwInvalidCallError('set');
        }
        const names = MultiArray.linearize(propertyNames);
        if (!names.every(CharString.isInstanceOf)) {
            AST.throwInvalidCallError('set');
        }
        const instances = ClassInstance.isInstanceOf(target) ? [target] : MultiArray.linearize(target);
        const propertyCount = names.length;
        if (propertyValues.dimension[0] !== instances.length || propertyValues.dimension[1] !== propertyCount) {
            this.context.throwEvalError(`set: property value cell array must be ${instances.length}-by-${propertyCount}.`);
        }
        const representative = ClassInstance.isInstanceOf(target) ? target : this.setGetArrayRepresentative(target, 'set');
        const properties = this.charStringList(names, 'set property name cell array').map((name) => {
            const property = this.resolveSetGetProperty(representative, name.str, 'set');
            this.assertSetGetSettableProperty(property, 'set');
            return property;
        });
        instances.forEach((instance, row) => {
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError('set: first argument must be a matlab.mixin.SetGet object.');
            }
            properties.forEach((property, column) => {
                const updated = this.assignClassInstanceField(instance, property.name, propertyValues.array[row][column], AST.nodeIdentifier('set'), this.context.currentScope);
                if (MultiArray.isInstanceOf(target)) {
                    const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(target.dimension[0], target.dimension[1], row);
                    target.array[i][j] = updated;
                }
            });
        });
        if (MultiArray.isInstanceOf(target)) {
            MultiArray.setType(target);
        }
    }

    /**
     * Assign one Set/Get property on a scalar object or every object in an array.
     *
     * @param target Scalar object or object array.
     * @param name Property name.
     * @param value Value to assign.
     */
    private assignSetGetProperty(target: ClassInstance | MultiArray, name: string, value: NodeInput): void {
        const instance = ClassInstance.isInstanceOf(target) ? target : this.setGetArrayRepresentative(target, 'set');
        const property = this.resolveSetGetProperty(instance, name, 'set');
        this.assertSetGetSettableProperty(property, 'set');
        if (ClassInstance.isInstanceOf(target)) {
            this.assignClassInstanceField(target, property.name, value, AST.nodeIdentifier('set'), this.context.currentScope);
        } else {
            this.assignClassArrayField(target, property.name, value, AST.nodeIdentifier('set'), this.context.currentScope);
        }
    }

    /**
     * Build the structure returned by `set(obj)` listing assignable properties.
     *
     * @param instance Set/Get-compatible object instance.
     * @returns Structure with one empty cell field per settable property.
     */
    private setGetSettableStructure(instance: ClassInstance): Structure {
        const result: Record<string, StructureFieldValue> = {};
        for (const property of instance.classDefinition.allProperties().filter((item) => !item.isHidden && this.isSetGetSettableProperty(item))) {
            result[property.name] = MultiArray.emptyArray(true);
        }
        return new Structure(result);
    }

    /**
     * Implement the public `get` built-in for Set/Get-compatible objects.
     *
     * @param args Evaluated built-in arguments.
     * @returns Property structure, scalar property value, or cell value table.
     */
    private getSetGetProperty(args: NodeInput[]): NodeInput {
        const target = this.setGetObject(args[0], 'get');
        if (args.length === 1) {
            if (ClassInstance.isInstanceOf(target)) {
                return this.setGetStructure(target);
            }
            return this.setGetStructureArray(target);
        }
        if (args.length !== 2 || !CharString.isInstanceOf(args[1])) {
            if (args.length !== 2 || !(MultiArray.isInstanceOf(args[1]) && args[1].isCell)) {
                AST.throwInvalidCallError('get');
            }
        }
        const instance = ClassInstance.isInstanceOf(target) ? target : this.setGetArrayRepresentative(target, 'get');
        const propertyNames = this.setGetPropertyNames(args[1], 'get');
        const properties = propertyNames.map((name) => this.resolveSetGetProperty(instance, name, 'get'));
        if (ClassInstance.isInstanceOf(target) && CharString.isInstanceOf(args[1])) {
            return this.resolveClassInstanceField(target, properties[0].name, AST.nodeIdentifier('get'));
        }
        if (MultiArray.isInstanceOf(target) && CharString.isInstanceOf(args[1])) {
            const result = new MultiArray(target.dimension, undefined, true);
            for (let n = 0; n < MultiArray.linearLength(target); n++) {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(target.dimension[0], target.dimension[1], n);
                const item = target.array[i][j];
                if (!ClassInstance.isInstanceOf(item)) {
                    this.context.throwEvalError('get: first argument must be a matlab.mixin.SetGet object.');
                }
                result.array[i][j] = this.resolveClassInstanceField(item, properties[0].name, AST.nodeIdentifier('get'));
            }
            MultiArray.setType(result);
            return result;
        }
        return this.getSetGetPropertyCell(target, properties);
    }

    /**
     * Implement the public `set` built-in for Set/Get-compatible objects.
     *
     * The supported forms cover query mode (`set(obj)`), property query mode
     * (`set(obj, name)`), scalar name/value assignment, structure assignment,
     * and the MATLAB table form with property-name and property-value cells.
     *
     * @param args Evaluated built-in arguments.
     * @returns Void for assignment forms, or a structure/cell query result.
     */
    private setSetGetProperties(args: NodeInput[]): NodeInput {
        const target = this.setGetObject(args[0], 'set');
        if (args.length === 1) {
            if (ClassInstance.isInstanceOf(target)) {
                return this.setGetSettableStructure(target);
            }
            AST.throwInvalidCallError('set');
        }
        if (args.length === 2) {
            if (CharString.isInstanceOf(args[1])) {
                const instance = ClassInstance.isInstanceOf(target) ? target : this.setGetArrayRepresentative(target, 'set');
                const property = this.resolveSetGetProperty(instance, args[1].str, 'set');
                this.assertSetGetSettableProperty(property, 'set');
                return MultiArray.emptyArray(true);
            }
            if (Structure.isInstanceOf(args[1])) {
                for (const [name, value] of Object.entries(args[1].field)) {
                    this.assignSetGetProperty(target, name, value);
                }
                return AST.nodeVoid();
            }
            AST.throwInvalidCallError('set');
        }
        if (Structure.isInstanceOf(args[1])) {
            if ((args.length - 2) % 2 !== 0) {
                AST.throwInvalidCallError('set');
            }
            for (const [name, value] of Object.entries(args[1].field)) {
                this.assignSetGetProperty(target, name, value);
            }
            for (let index = 2; index < args.length; index += 2) {
                const propertyName = args[index];
                if (!CharString.isInstanceOf(propertyName)) {
                    AST.throwInvalidCallError('set');
                }
                this.assignSetGetProperty(target, propertyName.str, args[index + 1]);
            }
            return AST.nodeVoid();
        }
        if (MultiArray.isInstanceOf(args[1]) && args[1].isCell) {
            if (!MultiArray.isInstanceOf(args[2]) || !args[2].isCell) {
                AST.throwInvalidCallError('set');
            }
            this.setSetGetPropertyCell(target, args[1], args[2]);
            if ((args.length - 3) % 2 !== 0) {
                AST.throwInvalidCallError('set');
            }
            for (let index = 3; index < args.length; index += 2) {
                const propertyName = args[index];
                if (!CharString.isInstanceOf(propertyName)) {
                    AST.throwInvalidCallError('set');
                }
                this.assignSetGetProperty(target, propertyName.str, args[index + 1]);
            }
            return AST.nodeVoid();
        }
        if (args.length % 2 === 0) {
            AST.throwInvalidCallError('set');
        }
        for (let index = 1; index < args.length; index += 2) {
            const propertyName = args[index];
            if (!CharString.isInstanceOf(propertyName)) {
                AST.throwInvalidCallError('set');
            }
            this.assignSetGetProperty(target, propertyName.str, args[index + 1]);
        }
        return AST.nodeVoid();
    }

    private readonly functions: Record<string, FunctionSignatureEntry> = {
        unparse: {
            func: (tree: NodeInput): CharString => new CharString(this.Unparse(tree)),
            signature: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        },
        clear: {
            func: (...args: NodeInput[]): NodeInput => {
                this.Clear(...args.map((arg) => this.charControlArgument(arg, 'clear name').str));
                return AST.nodeVoid();
            },
            signature: { inputs: { arity: -1, min: 0, parameters: [{ name: 'name', classes: ['char', 'string'], variadic: true }] }, outputs: { arity: 0 } },
        },
        who: {
            func: (...args: NodeInput[]): MultiArray => this.whoResult(args),
            signature: { inputs: { arity: -1, min: 0, parameters: [{ name: 'pattern', classes: ['char', 'string'], variadic: true }] }, outputs: { arity: 1 } },
        },
        whos: {
            func: (...args: NodeInput[]): MultiArray => this.whosResult(args),
            signature: { inputs: { arity: -1, min: 0, parameters: [{ name: 'pattern', classes: ['char', 'string'], variadic: true }] }, outputs: { arity: 1 } },
        },
        iskeyword: {
            func: (...args: NodeInput[]): NodeInput => this.isKeywordResult(args),
            signature: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'name', classes: ['char', 'string', 'cell'], optional: true }] }, outputs: { arity: 1 } },
        },
        isvarname: {
            func: (...args: NodeInput[]): NodeInput => this.isVarNameResult(args),
            signature: { inputs: { arity: 1, parameters: [{ name: 'name', classes: ['char', 'string', 'cell'] }] }, outputs: { arity: 1 } },
        },
        isglobal: {
            func: (...args: NodeInput[]): NodeInput => this.isGlobalResult(args),
            signature: { inputs: { arity: 1, parameters: [{ name: 'name', classes: ['char', 'string', 'cell'] }] }, outputs: { arity: 1 } },
        },
        namelengthmax: {
            func: (...args: NodeInput[]): ComplexType => {
                AST.throwInvalidCallError('namelengthmax', args.length !== 0, (message) => this.context.throwEvalError(message));
                return Complex.create(Interpreter.nameLengthMax);
            },
            signature: { inputs: { arity: 0 }, outputs: { arity: 1 } },
        },
        class: {
            func: (...args: NodeInput[]): CharString => {
                return new CharString(this.getValueClassName(args[0]));
            },
            signature: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        },
        isa: {
            func: (...args: NodeInput[]): ComplexType => {
                return this.valueIsRuntimeClass(args[0], this.charControlArgument(args[1], 'class name').str) ? Complex.true() : Complex.false();
            },
            signature: { inputs: { arity: 2, parameters: [{ name: 'value' }, { name: 'className', classes: ['char', 'string'] }] }, outputs: { arity: 1 } },
        },
        isclass: {
            func: (...args: NodeInput[]): ComplexType => (this.isClassName(this.charControlArgument(args[0], 'class name').str) ? Complex.true() : Complex.false()),
            signature: { inputs: { arity: 1, parameters: [{ name: 'className', classes: ['char', 'string'] }] }, outputs: { arity: 1 } },
        },
        metaclass: {
            func: (...args: NodeInput[]): ClassMetaClass => this.metaclassArgument(args[0]),
            signature: { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } },
        },
        __meta_class_fromName: {
            func: (...args: NodeInput[]): ClassMetaClass | MultiArray => {
                const definition = this.context.resolveClassDefinition(this.charControlArgument(args[0], 'class name').str);
                return definition ? this.createClassMetaClass(definition) : MultiArray.emptyArray();
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'className', classes: ['char', 'string'] }] }, outputs: { arity: 1 } },
        },
        properties: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.properties(this.classIntrospectionArgument('properties', args[0])),
            signature: CoreFunctions.propertiesSignature,
        },
        fieldnames: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.fieldnames(this.classIntrospectionArgument('fieldnames', args[0])),
            signature: CoreFunctions.fieldnamesSignature,
        },
        methods: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.methods(this.classIntrospectionArgument('methods', args[0])),
            signature: CoreFunctions.methodsSignature,
        },
        events: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.events(this.classIntrospectionArgument('events', args[0])),
            signature: CoreFunctions.eventsSignature,
        },
        enumeration: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.enumeration(this.classIntrospectionArgument('enumeration', args[0])),
            signature: CoreFunctions.enumerationSignature,
        },
        superclasses: {
            func: (...args: NodeInput[]): MultiArray => CoreFunctions.superclasses(this.classIntrospectionArgument('superclasses', args[0])),
            signature: CoreFunctions.superclassesSignature,
        },
        isprop: {
            func: (...args: NodeInput[]): NodeInput => CoreFunctions.isprop(this.classIntrospectionArgument('isprop', args[0]), args[1]),
            signature: CoreFunctions.ispropSignature,
        },
        ismethod: {
            func: (...args: NodeInput[]): ComplexType => CoreFunctions.ismethod(this.classIntrospectionArgument('ismethod', args[0]), args[1]),
            signature: CoreFunctions.ismethodSignature,
        },
        addlistener: {
            func: (...args: NodeInput[]): ClassEventListener => this.addClassListener('addlistener', ...args),
            signature: {
                inputs: [
                    { arity: 3, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char', 'string'] }, { name: 'callback' }] },
                    {
                        arity: 4,
                        parameters: [{ name: 'source' }, { name: 'propertyName' }, { name: 'propertyEventName', classes: ['char', 'string'] }, { name: 'callback' }],
                    },
                ],
                outputs: { arity: 1 },
            },
        },
        listener: {
            func: (...args: NodeInput[]): ClassEventListener => this.addClassListener('listener', ...args),
            signature: {
                inputs: [
                    { arity: 3, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char', 'string'] }, { name: 'callback' }] },
                    {
                        arity: 4,
                        parameters: [{ name: 'source' }, { name: 'propertyName' }, { name: 'propertyEventName', classes: ['char', 'string'] }, { name: 'callback' }],
                    },
                ],
                outputs: { arity: 1 },
            },
        },
        'event.listener': {
            func: (...args: NodeInput[]): NodeInput => this.createClassEventListener(...args),
            signature: {
                inputs: { arity: 3, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char', 'string'] }, { name: 'callback' }] },
                outputs: { arity: 1 },
            },
        },
        'event.EventData': {
            func: (): ClassEventData => ClassEventData.create(),
            signature: { inputs: { arity: 0 }, outputs: { arity: 1 } },
        },
        'event.proplistener': {
            func: (...args: NodeInput[]): NodeInput => this.createClassPropertyListener(...args),
            signature: {
                inputs: {
                    arity: 4,
                    parameters: [{ name: 'source' }, { name: 'propertyName' }, { name: 'propertyEventName', classes: ['char', 'string'] }, { name: 'callback' }],
                },
                outputs: { arity: 1 },
            },
        },
        notify: {
            func: (...args: NodeInput[]): NodeInput => this.notifyClassEvent(args[0], args[1], args[2]),
            signature: {
                inputs: [
                    { arity: 2, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char', 'string'] }] },
                    { arity: 3, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char', 'string'] }, { name: 'eventData' }] },
                ],
                outputs: { arity: 0 },
            },
        },
        get: {
            func: (...args: NodeInput[]): NodeInput => this.getSetGetProperty(args),
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'object' }] },
                    { arity: 2, parameters: [{ name: 'object' }, { name: 'propertyName', classes: ['char', 'string', 'cell'] }] },
                ],
                outputs: { arity: -1 },
            },
        },
        set: {
            func: (...args: NodeInput[]): NodeInput => this.setSetGetProperties(args),
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'object' }] },
                    { arity: 2, parameters: [{ name: 'object' }, { name: 'propertyNameOrStruct' }] },
                    {
                        arity: -1,
                        min: 3,
                        parameters: [{ name: 'object' }, { name: 'propertyName', classes: ['char', 'string', 'cell', 'struct'] }, { name: 'propertyValue', variadic: true }],
                    },
                ],
                outputs: { arity: -1, min: 0, max: 1 },
            },
        },
        mfilename: {
            func: (...args: NodeInput[]): CharString => {
                const option = args.length === 1 ? this.charControlArgument(args[0], 'mfilename option').str : '';
                if (option === 'class') {
                    return new CharString(this.context.currentClassAccessName());
                }
                if (option === 'fullpath') {
                    return new CharString(this.currentMFilenameFullPath());
                }
                return new CharString(this.currentMFilename());
            },
            signature: {
                inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'option', classes: ['char', 'string'], optional: true }] },
                outputs: { arity: -1 },
            },
        },
        dbstack: {
            func: (...args: NodeInput[]): MultiArray => {
                return this.dbstackResult(args);
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 0,
                    max: 2,
                    parameters: [
                        {
                            name: 'optionOrCount',
                            optional: true,
                            variadic: true,
                            alternatives: [
                                { name: 'option', classes: ['char', 'string'], allowedStrings: ['-completenames'] },
                                { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        lasterror: {
            func: (...args: NodeInput[]): Structure => this.lastErrorResult(args),
            signature: {
                inputs: {
                    arity: -1,
                    min: 0,
                    max: 1,
                    parameters: [
                        {
                            name: 'error',
                            optional: true,
                            alternatives: [
                                { name: 'reset', classes: ['char', 'string'], allowedStrings: ['reset'] },
                                { name: 'errorStruct', classes: ['struct'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        lasterr: {
            func: (...args: NodeInput[]): NodeReturnList => this.lastErrorMessageResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 0,
                    max: 2,
                    parameters: [
                        { name: 'message', classes: ['char', 'string'], optional: true },
                        { name: 'identifier', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: -2 },
            },
        },
        lastwarn: {
            func: (...args: NodeInput[]): NodeReturnList => this.lastWarningResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 0,
                    max: 2,
                    parameters: [
                        { name: 'message', classes: ['char', 'string'], optional: true },
                        { name: 'identifier', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: -2 },
            },
        },
        deal: {
            func: (...args: NodeInput[]): NodeReturnList => this.dealResult(args),
            signature: {
                inputs: {
                    arity: -1,
                    min: 1,
                    parameters: [{ name: 'value', variadic: true }],
                },
                outputs: { arity: -1 },
            },
        },
        getfield: {
            func: (...args: NodeInput[]): NodeInput => this.getfieldResult(args[0], args.slice(1)),
            signature: CoreFunctions.getfieldSignature,
        },
        setfield: {
            func: (...args: NodeInput[]): NodeInput => this.setfieldResult(args[0], args.slice(1)),
            signature: CoreFunctions.setfieldSignature,
        },
        subsref: {
            func: (...args: NodeInput[]): NodeInput => this.subsrefResult(args[0], args[1]),
            signature: {
                inputs: { arity: 2, parameters: [{ name: 'value' }, { name: 'subscript', classes: ['struct'] }] },
                outputs: { arity: -1, min: 0 },
            },
        },
        subsasgn: {
            func: (...args: NodeInput[]): NodeInput => this.subsasgnResult(args[0], args[1], args[2]),
            signature: {
                inputs: { arity: 3, parameters: [{ name: 'value' }, { name: 'subscript', classes: ['struct'] }, { name: 'newValue' }] },
                outputs: { arity: 1 },
            },
        },
        warning: {
            func: (...args: NodeInput[]): NodeInput => this.warningResult(args),
            signature: {
                inputs: [
                    { arity: 0 },
                    { arity: 1, parameters: [{ name: 'stateStruct', classes: ['struct'] }] },
                    {
                        arity: -1,
                        min: 1,
                        parameters: [
                            { name: 'message', classes: ['char', 'string'] },
                            { name: 'formatValue', variadic: true },
                        ],
                    },
                    {
                        arity: -2,
                        min: 2,
                        parameters: [
                            { name: 'identifier', classes: ['char', 'string'] },
                            { name: 'message', classes: ['char', 'string'] },
                            { name: 'formatValue', variadic: true },
                        ],
                    },
                ],
                outputs: { arity: -1, min: 0, max: 1 },
            },
        },
        error: {
            func: (...args: NodeInput[]): NodeInput => this.errorResult(args),
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'errorStruct', classes: ['struct'] }] },
                    {
                        arity: -1,
                        min: 1,
                        parameters: [
                            { name: 'message', classes: ['char', 'string'] },
                            { name: 'formatValue', variadic: true },
                        ],
                    },
                    {
                        arity: -2,
                        min: 2,
                        parameters: [
                            { name: 'identifier', classes: ['char', 'string'] },
                            { name: 'message', classes: ['char', 'string'] },
                            { name: 'formatValue', variadic: true },
                        ],
                    },
                ],
                outputs: { arity: 0 },
            },
        },
        assert: {
            func: (...args: NodeInput[]): NodeInput => this.assertResult(args),
            signature: {
                inputs: { arity: -1, min: 1, parameters: [{ name: 'argument', variadic: true }] },
                outputs: { arity: 0 },
            },
        },
        rethrow: {
            func: (...args: NodeInput[]): never => this.rethrowResult(args[0]),
            signature: {
                inputs: { arity: 1, parameters: [{ name: 'errorStruct', classes: ['struct'] }] },
                outputs: { arity: 0 },
            },
        },
        exist: {
            func: (...args: NodeInput[]): ComplexType => {
                return Complex.create(this.existCode(this.charControlArgument(args[0], 'name').str, args.length === 2 ? this.charControlArgument(args[1], 'kind').str : undefined));
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'name', classes: ['char', 'string'] },
                        { name: 'kind', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        which: {
            func: (...args: NodeInput[]): CharString => {
                if (FunctionHandle.isInstanceOf(args[0])) {
                    const handle = this.functionHandleControlArgument(args[0], 'function handle');
                    return this.whichResult(handle.id ?? FunctionHandle.unparse(handle, this).trim(), handle);
                }
                return this.whichResult(this.charControlArgument(args[0], 'name').str);
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'name', classes: ['char', 'string', 'function_handle'] }] }, outputs: { arity: 1 } },
        },
        validatestring: {
            func: (...args: NodeInput[]): CharString => this.validatestringResult(args),
            signature: {
                inputs: {
                    arity: -1,
                    min: 2,
                    max: 5,
                    parameters: [
                        { name: 'string', classes: ['char', 'string'] },
                        { name: 'validStrings', classes: ['char', 'string', 'cell'] },
                        { name: 'functionName', classes: ['char', 'string'], optional: true },
                        { name: 'variableName', classes: ['char', 'string'], optional: true },
                        { name: 'argumentPosition', optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        validateattributes: {
            func: (...args: NodeInput[]): NodeInput => this.validateattributesResult(args),
            signature: {
                inputs: {
                    arity: -1,
                    min: 3,
                    max: 6,
                    parameters: [
                        { name: 'value' },
                        { name: 'classes', classes: ['char', 'string', 'cell'] },
                        { name: 'attributes', classes: ['char', 'string', 'cell'] },
                        { name: 'functionNameOrArgumentPosition', optional: true },
                        { name: 'variableName', classes: ['char', 'string'], optional: true },
                        { name: 'argumentPosition', optional: true },
                    ],
                },
                outputs: { arity: 0 },
            },
        },
        ...this.mustBeFunctionEntries(),
        func2str: {
            func: (...args: NodeInput[]): CharString => {
                return FunctionLookup.func2str(this.functionHandleControlArgument(args[0], 'function handle'), (handle) => FunctionHandle.unparse(handle, this));
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        },
        str2func: {
            func: (...args: NodeInput[]): FunctionHandle => {
                const scopeMode = args.length > 1 ? this.charControlArgument(args[1], 'scope').str.trim().toLowerCase() : '';
                return this.functionHandleFromString(this.charControlArgument(args[0], 'source'), scopeMode === 'global');
            },
            signature: {
                inputs: {
                    arity: -1,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'source', classes: ['char', 'string'] },
                        { name: 'scope', classes: ['char', 'string'], allowedStrings: ['global'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        builtin: {
            func: (...args: NodeInput[]): NodeExpr => {
                const source = this.charControlArgument(args[0], 'builtin function').str.trim();
                if (source.length === 0) {
                    this.context.throwEvalError('builtin: function name cannot be empty.');
                }
                const canonical = this.context.aliasNameFunction(source);
                const builtin = this.context.builtInFunctionTable[canonical];
                if (!builtin) {
                    this.context.throwEvalError(`builtin: '${source}' is not a built-in function.`);
                }
                return this.context.callCallable(Callables.builtin(builtin), this.callArgumentValues(args.slice(1), 'builtin'), AST.nodeIdentifier('builtin'));
            },
            signature: {
                inputs: {
                    arity: -1,
                    min: 1,
                    parameters: [
                        { name: 'function', classes: ['char', 'string'] },
                        { name: 'argument', variadic: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        feval: {
            func: (...args: NodeInput[]): NodeExpr => {
                let target = this.expressionValue(args[0], 'feval target');
                if (CharString.isInstanceOf(target)) {
                    const source = target.str.trim();
                    if (source.length === 0) {
                        this.context.throwEvalError('feval: function name cannot be empty.');
                    }
                    const staticMethod = source.startsWith('@') ? undefined : this.resolveStaticMethod(source, this.context.currentScope);
                    if (staticMethod) {
                        return this.context.callClassStaticMethod(staticMethod.method, this.callArgumentValues(args.slice(1), 'feval'), AST.nodeIdentifier('feval'));
                    }
                    target = source.startsWith('@') ? this.functionHandleFromString(target) : this.createResolvedFunctionHandle(source, this.context.currentScope, undefined, false, true);
                }
                const callable = this.context.resolveCallable(target);
                if (!callable) {
                    this.context.throwEvalError('feval: first argument must be a function handle or function name.');
                }
                return this.context.callCallable(callable, this.callArgumentValues(args.slice(1), 'feval'), AST.nodeIdentifier('feval'));
            },
            signature: {
                inputs: {
                    arity: -1,
                    min: 1,
                    parameters: [
                        { name: 'function', classes: ['char', 'string', 'function_handle'] },
                        { name: 'argument', variadic: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        spfun: {
            func: (...args: NodeInput[]): NodeExpr => {
                const callable = this.context.resolveCallable(this.expressionValue(args[0], 'spfun function'));
                if (!callable) {
                    this.context.throwEvalError('spfun: first argument must be a function handle.');
                }
                const source = MultiArray.scalarToMultiArray(this.expressionValue(args[1], 'spfun input'));
                const result = new MultiArray(source.dimension, Complex.zero());
                const sourceValues = MultiArray.linearize(source);
                for (let linearIndex = 0; linearIndex < sourceValues.length; linearIndex++) {
                    if (!CoreFunctions.isNonzeroElement(sourceValues[linearIndex])) {
                        continue;
                    }
                    const value = this.expressionValue(RuntimeValue.copy(sourceValues[linearIndex]), 'spfun value');
                    const mapped = this.expressionValue(this.context.callCallable(callable, [value], AST.nodeIdentifier('spfun')), 'spfun result');
                    const scalar = MultiArray.MultiArrayToScalar(mapped);
                    if (MultiArray.isInstanceOf(scalar)) {
                        this.context.throwEvalError('spfun: function must return a scalar value for each nonzero element.');
                    }
                    const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(source.dimension[0], source.dimension[1], linearIndex);
                    result.array[row][column] = RuntimeValue.copy(scalar as ElementType);
                }
                MultiArray.setType(result);
                return MultiArray.MultiArrayToScalar(result);
            },
            signature: {
                inputs: {
                    arity: 2,
                    parameters: [
                        { name: 'function', classes: ['function_handle'] },
                        {
                            name: 'value',
                            alternatives: [
                                { name: 'numericValue', classes: ['double'] },
                                { name: 'logicalValue', classes: ['logical'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        functions: {
            func: (...args: NodeInput[]): Structure => {
                const handle = this.functionHandleControlArgument(args[0], 'function handle');
                const scope = (handle.closure as Scope | undefined) ?? this.context.currentScope;
                return FunctionLookup.functionsInfo(
                    handle,
                    (name) => this.context.aliasNameFunction(name),
                    (name) => this.context.resolveSymbol(name, scope, { variables: false, classes: false, loadFunctions: false })?.functionDefinition,
                    (handle) => FunctionHandle.unparse(handle, this),
                    (handle) => this.functionHandleWorkspaceInfo(handle),
                    (name, handle) => this.staticMethodInfo(name, (handle?.closure as Scope | undefined) ?? this.context.currentScope),
                );
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        },
        localfunctions: {
            func: (..._args: NodeInput[]): MultiArray => {
                return this.localFunctionHandles();
            },
            signature: { inputs: { arity: 0 }, outputs: { arity: 1 } },
        },
        nargin: {
            func: (...args: NodeInput[]): ComplexType => {
                return args.length === 0 ? this.context.currentFunctionArgumentCount('nargin') : Complex.create(this.functionArgumentArity(this.functionArityCallable('nargin', args[0])));
            },
            signature: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'string', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
        },
        narginchk: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.checkFunctionCount('narginchk', args[0], args[1]);
            },
            signature: {
                inputs: {
                    arity: 2,
                    parameters: [
                        { name: 'min', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                        { name: 'max', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'integer', 'nonnegative'], allowInfinity: true },
                    ],
                },
                outputs: { arity: 0 },
            },
        },
        nargchk: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.nargchkResult(args);
            },
            signature: {
                inputs: {
                    arity: -1,
                    min: 3,
                    max: 4,
                    parameters: [
                        { name: 'min', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                        { name: 'max', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'integer', 'nonnegative'], allowInfinity: true },
                        { name: 'inputCount', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                        { name: 'outputKind', classes: ['char', 'string'], allowedStrings: ['struct', 'string'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        nargout: {
            func: (...args: NodeInput[]): ComplexType => {
                return args.length === 0 ? this.context.currentFunctionOutputCount('nargout') : Complex.create(this.functionOutputArity(this.functionArityCallable('nargout', args[0])));
            },
            signature: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'string', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
        },
        isargout: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.context.currentFunctionOutputIsRequested(args[0]);
            },
            signature: {
                inputs: { arity: 1, parameters: [{ name: 'outputNumber', classes: ['double'], validators: ['numeric', 'real', 'integer', 'positive'] }] },
                outputs: { arity: 1 },
            },
        },
        nargoutchk: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.nargoutchkResult(args);
            },
            signature: {
                inputs: {
                    arity: -1,
                    min: 2,
                    max: 4,
                    parameters: [
                        { name: 'min', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                        { name: 'max', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'integer', 'nonnegative'], allowInfinity: true },
                        { name: 'outputCount', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'], optional: true },
                        { name: 'outputKind', classes: ['char', 'string'], allowedStrings: ['struct', 'string'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        nthargout: {
            func: (...args: NodeInput[]): NodeInput => this.nthargoutResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 2,
                    parameters: [
                        { name: 'outputNumber', classes: ['double'], validators: ['numeric', 'real', 'integer', 'positive'] },
                        { name: 'functionOrTotalOutputCount' },
                        { name: 'argument', variadic: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        inputname: {
            func: (...args: NodeInput[]): CharString => {
                const onlyVariableNames = args.length === 2 ? this.booleanControlArgument(args[1], 'inputname onlyVariableNames') : true;
                return this.context.currentFunctionInputName(args[0], onlyVariableNames, (arg) => this.Unparse(arg));
            },
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'argumentNumber', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] }] },
                    {
                        arity: 2,
                        parameters: [
                            { name: 'argumentNumber', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] },
                            { name: 'onlyVariableNames', classes: ['logical'], validators: ['scalar'] },
                        ],
                    },
                ],
                outputs: { arity: 1 },
            },
        },
        eval: {
            func: (...args: NodeInput[]): NodeInput => {
                return FunctionWorkspace.evaluateWithCatch(
                    this.context.currentScope,
                    this.charControlArgument(args[0], 'eval code').str,
                    args.length === 2 ? this.charControlArgument(args[1], 'eval catch code').str : undefined,
                    (source, scope) => this.evalStringInScope(source, scope as Scope),
                    (error) => this.isEvalCatchableError(error),
                    (error) => this.rememberLastError(error),
                );
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'code', classes: ['char', 'string'] },
                        { name: 'catchCode', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        evalc: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.evalcResult(this.charControlArgument(args[0], 'evalc code').str, args.length === 2 ? this.charControlArgument(args[1], 'evalc catch code').str : undefined);
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'code', classes: ['char', 'string'] },
                        { name: 'catchCode', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        evalin: {
            func: (...args: NodeInput[]): NodeInput => {
                const workspace = this.charControlArgument(args[0], 'workspace').str;
                const scope = this.context.resolveWorkspace(workspace, false, workspace === 'caller');
                return FunctionWorkspace.evaluateWithCatch(
                    scope,
                    this.charControlArgument(args[1], 'evalin code').str,
                    args.length === 3 ? this.charControlArgument(args[2], 'evalin catch code').str : undefined,
                    (source, itemScope) => this.evalStringInScope(source, itemScope as Scope, { topLevelReturn: workspace === 'base' }),
                    (error) => this.isEvalCatchableError(error),
                    (error) => this.rememberLastError(error),
                );
            },
            signature: {
                inputs: {
                    arity: -3,
                    min: 2,
                    max: 3,
                    parameters: [
                        { name: 'workspace', classes: ['char', 'string'], allowedStrings: ['base', 'caller'] },
                        { name: 'code', classes: ['char', 'string'] },
                        { name: 'catchCode', classes: ['char', 'string'], optional: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        run: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.RunScriptFile(this.charControlArgument(args[0], 'script').str, this.context.currentScope);
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'script', classes: ['char', 'string'] }] }, outputs: { arity: 1 } },
        },
        source: {
            func: (...args: NodeInput[]): NodeInput => {
                const scope = args.length === 2 ? this.context.resolveWorkspace(this.charControlArgument(args[1], 'workspace').str) : this.context.currentScope;
                return this.RunScriptFile(this.charControlArgument(args[0], 'script').str, scope);
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'script', classes: ['char', 'string'] },
                        { name: 'workspace', classes: ['char', 'string'], allowedStrings: ['base', 'caller'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        assignin: {
            func: (...args: NodeInput[]): NodeInput => {
                const scope = this.context.resolveWorkspace(this.charControlArgument(args[0], 'workspace').str, true);
                const restoreDynamicGuard = this.pushDynamicNameCreationGuard(scope);
                try {
                    return FunctionWorkspace.assignIn(scope, this.charControlArgument(args[1], 'name').str, this.runtimeExpressionValue(args[2], 'assignin value'));
                } finally {
                    restoreDynamicGuard();
                }
            },
            signature: {
                inputs: {
                    arity: 3,
                    parameters: [
                        { name: 'workspace', classes: ['char', 'string'], allowedStrings: ['base', 'caller'] },
                        { name: 'name', classes: ['char', 'string'], identifier: true },
                        { name: 'value' },
                    ],
                },
                outputs: { arity: 0 },
            },
        },
    };

    /**
     * Special functions MathML unparser.
     */
    private readonly unparseMathMLFunctions: Record<string, (tree: NodeIndexExpr) => string> = {
        logb: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[1]);
            if (this.nodePrecedence(tree.args[1]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['logb'](this.UnparserMathML(tree.args[0]), unparseArgument);
        },
        log2: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log2'](unparseArgument);
        },
        log10: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['log10'](unparseArgument);
        },
        factorial: (tree: NodeIndexExpr): string => {
            let unparseArgument = this.UnparserMathML(tree.args[0]);
            if (this.nodePrecedence(tree.args[0]) < this.precedenceTable.max) {
                unparseArgument = MathML.format['()']('(', unparseArgument, ')');
            }
            return MathML.format['factorial'](unparseArgument);
        },
    };

    /**
     * Load or reload the interpreter runtime state.
     *
     * When `config` is supplied, host-provided aliases, functions, command-word
     * entries, and source providers are installed. A reload without `config`
     * resets those extension tables to the default browser-safe state.
     *
     * @param config Optional host integration/configuration.
     */
    private loadInterpreter(config?: InterpreterConfig) {
        this._exitStatus = Interpreter.response.OK;
        this.resetLastError();
        this.resetWarningState();
        AST.reload();
        this.context.loadContext();
        this.context.nativeNameTable = Interpreter.nativeNameTableFactory();
        this.context.nativeNameSet = new Set(Object.keys(this.context.nativeNameTable));
        this.context.globalScope!.defineNameTable(this.context.nativeNameTable);
        /* Define Interpreter functions */
        for (const func in this.functions) {
            this.context.defineBuiltInFunction(func, this.functions[func].func, false, [], this.functions[func].signature);
        }
        /* Define function mappers */
        const complexMapFunctionSignature: BuiltInFunctionSignature = { inputs: { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] }, outputs: { arity: 1 } };
        for (const func in Complex.mapFunction) {
            this.context.defineBuiltInFunction(func, Complex.mapFunction[func], true, [], complexMapFunctionSignature);
        }
        /* Define other functions */
        const complexTwoArgFunctionSignature: BuiltInFunctionSignature = {
            inputs: {
                arity: 2,
                parameters: [
                    { name: 'left', classes: ['double'] },
                    { name: 'right', classes: ['double'] },
                ],
            },
            outputs: { arity: 1 },
        };
        const specialComplexTwoArgFunctionSignatures: Record<string, BuiltInFunctionSignature> = {
            logb: {
                inputs: {
                    arity: 2,
                    parameters: [
                        { name: 'value', classes: ['double'] },
                        { name: 'base', classes: ['double'] },
                    ],
                },
                outputs: { arity: 1 },
            },
        };
        for (const func in Complex.twoArgFunction) {
            this.context.defineBuiltInFunction(func, Complex.twoArgFunction[func], false, [], specialComplexTwoArgFunctionSignatures[func] ?? complexTwoArgFunctionSignature);
        }
        /* Define Configuration functions */
        for (const func in Configuration.functions) {
            this.context.defineBuiltInFunction(func, Configuration.functions[func].func, false, [], Configuration.functions[func].signature);
        }
        /* Define CoreFunctions functions */
        for (const func in CoreFunctions.functions) {
            this.context.defineBuiltInFunction(func, CoreFunctions.functions[func].func, false, [], CoreFunctions.functions[func].signature);
        }
        for (const func of ['properties', 'fieldnames', 'methods', 'events', 'enumeration', 'superclasses', 'isprop', 'ismethod', 'getfield', 'setfield']) {
            this.context.defineBuiltInFunction(func, this.functions[func].func, false, [], this.functions[func].signature);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.context.defineBuiltInFunction(func, LinearAlgebra.functions[func].func, false, [], LinearAlgebra.functions[func].signature);
        }
        /* Define operator functions after numeric helpers so names such as
         * power, transpose, and not keep their MATLAB/Octave operator
         * semantics when called in function form. */
        for (const func in MathOperation.leftAssociativeMultipleOperations) {
            this.context.defineLeftAssociativeMultipleOperationFunction(func as KeyOfTypeOfMathOperation, MathOperation.leftAssociativeMultipleOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.binaryOperations) {
            this.context.defineBinaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.binaryOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.unaryOperations) {
            this.context.defineUnaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.unaryOperations[func as KeyOfTypeOfMathOperation]!);
        }
        /* Load UnparserMathML for special functions */
        for (const func in this.unparseMathMLFunctions) {
            this.context.builtInFunctionTable[func].UnparserMathML = this.unparseMathMLFunctions[func];
        }
        if (config) {
            this.context.setAliasNameTable(config.aliasNameTable);
            this.context.assignBuiltInFunctionTable(config.externalFunctionTable);
            this.sourceResolver =
                config.sourceResolver ??
                TableSourceResolver.create({
                    functionSourceTable: config.functionSourceTable ?? config.externalFunctionSourceTable ?? Object.create(null),
                    functionSourceProvider: config.functionSourceProvider,
                    scriptSourceTable: config.scriptSourceTable ?? config.externalScriptSourceTable ?? Object.create(null),
                    scriptSourceProvider: config.scriptSourceProvider,
                    classSourceTable: config.classSourceTable ?? config.externalClassSourceTable ?? Object.create(null),
                    classSourceProvider: config.classSourceProvider,
                });
            this.pathValidationCallbacks = { fileExists: config.fileExists, folderExists: config.folderExists };
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
            }
        } else {
            this.context.aliasNameFunction = (name: string): string => name;
            this.sourceResolver = TableSourceResolver.create();
            this.pathValidationCallbacks = {};
        }
        this.refreshCommandWordListNames();
    }

    /**
     * Create an interpreter.
     *
     * Use `Interpreter.Create` for public construction. The private constructor
     * wires operator aliases, precedence aliases, context ownership, and host
     * extension tables in one place.
     *
     * @param config Optional host integration/configuration.
     * @param context Optional pre-built runtime context.
     */
    private constructor(config?: InterpreterConfig, context?: Context) {
        /* Set opTable aliases */
        this.opTable['**'] = this.opTable['^'];
        this.opTable['.**'] = this.opTable['.^'];
        this.opTable['~='] = this.opTable['!='];
        this.opTable['~'] = this.opTable['!'];
        /* Load precedence table */
        this.precedenceTable = {};
        Interpreter.precedence.forEach((list, precedence) => {
            list.forEach((field) => {
                this.precedenceTable[field] = precedence + 1;
            });
        });
        /* Set precedenceTable aliases */
        this.precedenceTable['**'] = this.precedenceTable['^'];
        this.precedenceTable['.**'] = this.precedenceTable['.^'];
        this.precedenceTable['_**'] = this.precedenceTable['_^'];
        this.precedenceTable['_.**'] = this.precedenceTable['_.^'];
        this.precedenceTable['~='] = this.precedenceTable['!='];
        this.precedenceTable['~'] = this.precedenceTable['!'];
        if (context) {
            this.context = context;
            this.context.interpreter = this;
        } else {
            this.context = Context.create(this);
        }
        this.loadInterpreter(config);
    }

    /**
     * Creates an instance of the `Interpreter` object.
     * @param config Optional interpreter configuration.
     * @param context Optional pre-built interpreter context.
     * @returns New interpreter instance.
     */
    public static readonly Create = (config?: InterpreterConfig, context?: Context): Interpreter => new Interpreter(config, context);

    /**
     * Parse MATLAB/Octave-like source text into the normalized AST.
     *
     * The lexer receives the current command-word list so command syntax can be
     * recognized without hard-coding host-provided command names in the grammar.
     *
     * @param input Source text to parse.
     * @returns Root AST node.
     */
    public Parse(input: string): NodeInput {
        /* Give the lexer the input as a stream of characters. */
        const inputStream = CharStreams.fromString(input);
        const lexer = new MathJSLabLexer(inputStream);

        /* Set word-list commands in lexer. */
        lexer.commandNames = this.commandWordListNameSet;
        lexer.assignmentSensitiveCommandNames = this.assignmentSensitiveCommandNameSet;

        /* Create a stream of tokens and give it to the parser. Set parser to construct a parse tree. */
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new MathJSLabParser(tokenStream);
        parser.buildParseTrees = true;

        /* Remove error listeners and add LexerErrorListener and ParserErrorListener. */
        lexer.removeErrorListeners();
        lexer.addErrorListener(new LexerErrorListener(input));
        parser.removeErrorListeners();
        parser.addErrorListener(new ParserErrorListener(input));
        if (this._debug) {
            // Add DiagnosticErrorListener to parser to notify when the parser
            // detects an ambiguity. Set prediction mode to report all ambiguities.
            // parser.addErrorListener(new DiagnosticErrorListener());
            // parser._interp.predictionMode = PredictionMode.LL_EXACT_AMBIG_DETECTION;
        }

        /* Parse input and return AST. */
        return parser.input().node ?? AST.nodeVoid();
    }

    /**
     * Native name table factory.
     * @returns Native name table with actual `Complex` facade.
     */
    private static readonly nativeNameTableFactory = () => ({
        false: Complex.false(),
        true: Complex.true(),
        i: Complex.onei(),
        I: Complex.onei(),
        j: Complex.onei(),
        J: Complex.onei(),
        e: Complex.e(),
        pi: Complex.pi(),
        inf: Complex.inf_0(),
        Inf: Complex.inf_0(),
        nan: Complex.NaN_0(),
        NaN: Complex.NaN_0(),
    });

    /**
     * Reset the interpreter to a fresh default runtime context.
     *
     * This clears workspaces, loaded functions/classes, host extension tables,
     * and diagnostic state such as `lasterror` and `lastwarn`.
     */
    public Restart(): void {
        this.loadInterpreter();
    }

    /**
     * Clear workspace variables, imports, classes, or user-defined functions.
     *
     * With no names, this clears ordinary variables in the current workspace.
     * The special name `all` clears variables, globals, imports, classes, and
     * user functions while preserving host source providers. `functions`,
     * `classes`, `global`, `import`, and `variables` map to narrower
     * MATLAB/Octave-like workspace categories.
     *
     * @param names Variable/function names to clear in the current scope.
     */
    public Clear(...names: string[]): void {
        if (names.length === 0) {
            this.context.clearCurrentVariables();
        } else {
            const options = this.clearCommandOptions(names);
            if (!options) {
                return;
            }
            this.clearCommandCategory(options);
        }
    }

    /**
     * Clear every category covered by MATLAB/Octave `clear all`.
     */
    private clearAllWorkspaceCategories(): void {
        this.context.clearCurrentVariables();
        this.context.clearGlobalVariables();
        this.context.clearClassDefinitions();
        this.context.currentScope.clearImports();
        this.clearUserFunctions();
    }

    /**
     * Normalize command-form `clear` options before applying them.
     *
     * Octave permits long options without a dash except for `exclusive`, so
     * `clear regexp x` is accepted while bare `exclusive` remains a target.
     *
     * @param names Command-form words following `clear`.
     * @returns Normalized options, or `undefined` when the command was fully handled.
     */
    private clearCommandOptions(names: string[]): ClearCommandOptions | undefined {
        const options: ClearCommandOptions = { category: 'visible', regexp: false, exclusive: false, patterns: [] };
        for (let index = 0; index < names.length; index++) {
            const name = names[index];
            switch (name) {
                case 'all':
                case '-all':
                case '-a':
                    this.clearAllWorkspaceCategories();
                    return undefined;
                case 'import':
                    if (this.context.isInsideUserFunction() || this.scriptExecutionDepth > 0) {
                        this.context.throwEvalError('clear import is not allowed inside a function or script.');
                    }
                    this.context.currentScope.clearImports();
                    return undefined;
                case 'variables':
                case '-variables':
                case '-v':
                    options.category = 'variables';
                    break;
                case 'functions':
                case '-functions':
                case '-f':
                    options.category = 'functions';
                    break;
                case 'classes':
                case '-classes':
                case '-c':
                    options.category = 'classes';
                    break;
                case 'global':
                case '-global':
                case '-g':
                    options.category = 'global';
                    break;
                case 'regexp':
                case '-regexp':
                case '-r':
                    options.regexp = true;
                    break;
                case '-exclusive':
                case '-x':
                    options.exclusive = true;
                    break;
                default:
                    options.patterns = names.slice(index);
                    return options;
            }
        }
        return options;
    }

    /**
     * Apply normalized `clear` options to the selected workspace category.
     *
     * @param options Normalized command options.
     */
    private clearCommandCategory(options: ClearCommandOptions): void {
        switch (options.category) {
            case 'variables':
                this.context.clearCurrentVariables(this.selectClearPatternMatches(options.patterns, this.clearVariableCandidates(), options));
                return;
            case 'functions':
                this.clearUserFunctions(this.selectClearPatternMatches(options.patterns, this.clearFunctionCandidates(), options));
                return;
            case 'classes':
                this.clearClassDefinitions(this.selectClearPatternMatches(options.patterns, this.clearClassCandidates(), options));
                return;
            case 'global':
                this.context.clearGlobalVariables(this.selectClearPatternMatches(options.patterns, [...this.context.globalNameSet], options));
                return;
            case 'visible':
                this.clearVisibleSymbols(options);
                return;
        }
    }

    /**
     * Clear visible variables, functions, and classes with exact or pattern targets.
     *
     * @param options Normalized command options.
     */
    private clearVisibleSymbols(options: ClearCommandOptions): void {
        if (options.patterns.length === 0) {
            if (options.regexp || options.exclusive) {
                return;
            }
            this.context.clearCurrentVariables();
            return;
        }
        const initial = { regexp: options.regexp, exclusive: options.exclusive };
        if (options.exclusive) {
            this.context.clearCurrentVariables(this.selectClearPatternMatches(options.patterns, this.clearVariableCandidates(), initial));
            return;
        }
        if (options.regexp || options.patterns.some((pattern) => this.clearPatternHasWildcards(pattern))) {
            for (const matchedName of this.selectClearPatternMatches(options.patterns, this.clearVisibleCandidates(), initial) ?? []) {
                this.clearNamedSymbol(matchedName);
            }
            return;
        }
        for (const pattern of options.patterns) {
            this.clearNamedSymbol(pattern);
        }
    }

    /**
     * Test whether a clear target uses MATLAB/Octave wildcard syntax.
     *
     * @param pattern User-supplied clear target.
     * @returns `true` when wildcard expansion is required.
     */
    private clearPatternHasWildcards(pattern: string): boolean {
        return /[*?\[]/.test(pattern);
    }

    /**
     * Convert a MATLAB/Octave clear wildcard pattern to a JavaScript regexp.
     *
     * The supported syntax follows Octave `clear`: `*`, `?`, and bracket
     * character classes. Other regexp metacharacters are matched literally.
     *
     * @param pattern Clear wildcard pattern.
     * @returns Anchored regular expression.
     */
    private clearPatternRegExp(pattern: string): RegExp {
        let source = '^';
        for (let index = 0; index < pattern.length; index++) {
            const char = pattern[index];
            if (char === '*') {
                source += '.*';
            } else if (char === '?') {
                source += '.';
            } else if (char === '[') {
                const close = pattern.indexOf(']', index + 1);
                if (close > index + 1) {
                    const content = pattern.slice(index + 1, close).replace(/\\/g, '\\\\');
                    source += `[${content}]`;
                    index = close;
                } else {
                    source += '\\[';
                }
            } else {
                source += char.replace(/[\\^$+?.()|{}]/g, '\\$&');
            }
        }
        return new RegExp(source + '$');
    }

    /**
     * Normalize leading clear pattern options.
     *
     * @param patterns Raw clear pattern arguments.
     * @param initial Initial mode flags selected by the caller.
     * @returns Remaining patterns and normalized flags.
     */
    private clearPatternOptions(patterns: string[], initial: { regexp?: boolean; exclusive?: boolean } = {}): { patterns: string[]; regexp: boolean; exclusive: boolean } {
        let regexp = initial.regexp ?? false;
        let exclusive = initial.exclusive ?? false;
        let index = 0;
        while (index < patterns.length) {
            const option = patterns[index];
            if (option === '-regexp' || option === '-r' || option === 'regexp') {
                regexp = true;
                index++;
            } else if (option === '-exclusive' || option === '-x') {
                exclusive = true;
                index++;
            } else {
                break;
            }
        }
        return { patterns: patterns.slice(index), regexp, exclusive };
    }

    /**
     * Test one candidate against one clear pattern.
     *
     * @param candidate Visible name.
     * @param pattern User-supplied pattern.
     * @param regexp Whether `pattern` is a JavaScript-style regular expression.
     * @returns `true` when the candidate matches.
     */
    private clearPatternMatches(candidate: string, pattern: string, regexp: boolean): boolean {
        return regexp ? new RegExp(pattern).test(candidate) : this.clearPatternRegExp(pattern).test(candidate);
    }

    /**
     * Select names matched by clear patterns against a candidate name list.
     *
     * Exact names are preserved even when they are not currently present, so
     * the normal exact-name clear path can still apply aliases and imports.
     *
     * @param patterns User-supplied clear targets.
     * @param candidates Names visible for wildcard expansion.
     * @param initial Initial mode flags selected by the caller.
     * @returns Expanded names in input order without duplicates.
     */
    private selectClearPatternMatches(patterns: string[] | undefined, candidates: string[], initial: { regexp?: boolean; exclusive?: boolean } = {}): string[] | undefined {
        if (!patterns) {
            return undefined;
        }
        if (patterns.length === 0) {
            return initial.regexp || initial.exclusive ? [] : undefined;
        }
        const options = this.clearPatternOptions(patterns, initial);
        if (options.patterns.length === 0) {
            return initial.regexp || initial.exclusive ? [] : undefined;
        }
        if (options.exclusive) {
            return candidates.filter((candidate) => !options.patterns.some((pattern) => this.clearPatternMatches(candidate, pattern, options.regexp)));
        }
        const result: string[] = [];
        const append = (name: string): void => {
            if (!result.includes(name)) {
                result.push(name);
            }
        };
        for (const pattern of options.patterns) {
            if (!options.regexp && !this.clearPatternHasWildcards(pattern)) {
                append(pattern);
                continue;
            }
            candidates.filter((candidate) => this.clearPatternMatches(candidate, pattern, options.regexp)).forEach(append);
        }
        return result;
    }

    /**
     * Return ordinary variable names that can be matched by clear patterns.
     */
    private clearVariableCandidates(): string[] {
        return Object.keys(this.context.currentScope.nameTable).filter((name) => {
            const entry = this.context.currentScope.nameTable[name];
            return !this.context.nativeNameSet.has(name) && !ClassDefinition.isInstanceOf(entry?.node);
        });
    }

    /**
     * Return ordinary variables visible to workspace-introspection commands.
     *
     * `who` and `whos` report variables from the active workspace. Class
     * definitions are stored in the same low-level table, so they are filtered
     * out to keep the result aligned with MATLAB/Octave user variables.
     */
    private visibleWorkspaceVariableEntries(): [string, NameEntry][] {
        return Object.entries(this.context.currentScope.nameTable)
            .filter(([name, entry]) => !this.context.nativeNameSet.has(name) && !ClassDefinition.isInstanceOf(entry?.node))
            .sort(([left], [right]) => left.localeCompare(right));
    }

    /**
     * Normalize MATLAB/Octave workspace listing options.
     */
    private workspaceListingOptions(patterns: string[], commandName: 'who' | 'whos'): WorkspaceListingOptions {
        const result: WorkspaceListingOptions = { globalOnly: false, regexp: false, patterns: [] };
        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const option = pattern.toLowerCase();
            if (option === 'global' || option === '-global') {
                result.globalOnly = true;
            } else if (option === '-regexp' || option === '-r' || option === 'regexp') {
                result.regexp = true;
            } else if (option === '-file' || option === 'file') {
                this.context.throwEvalError(`${commandName}: MAT-file workspace listing is not supported in the browser runtime.`);
            } else {
                result.patterns.push(pattern);
            }
        }
        return result;
    }

    /**
     * Select workspace variable names by MATLAB/Octave wildcard or regexp patterns.
     */
    private workspaceVariableNamesByPatterns(patterns: string[], commandName: 'who' | 'whos'): string[] {
        const options = this.workspaceListingOptions(patterns, commandName);
        const candidates = this.visibleWorkspaceVariableEntries()
            .filter(([name]) => !options.globalOnly || this.context.globalNameSet.has(name))
            .map(([name]) => name);
        if (options.patterns.length === 0) {
            return options.regexp ? [] : candidates;
        }
        const result: string[] = [];
        const append = (name: string): void => {
            if (!result.includes(name)) {
                result.push(name);
            }
        };
        for (const pattern of options.patterns) {
            const hasWildcards = this.clearPatternHasWildcards(pattern);
            candidates.filter((candidate) => (options.regexp || hasWildcards ? this.clearPatternMatches(candidate, pattern, options.regexp) : candidate === pattern)).forEach(append);
        }
        return result;
    }

    /**
     * Build a MATLAB-like cellstr column vector for `who`.
     */
    private whoResult(args: NodeInput[]): MultiArray {
        const patterns = args.map((arg) => this.charControlArgument(arg, 'who pattern').str);
        return this.whoResultFromPatterns(patterns);
    }

    /**
     * Build `who` output from already-normalized command or function patterns.
     */
    private whoResultFromPatterns(patterns: string[]): MultiArray {
        const result = MultiArray.toColumnVector(this.workspaceVariableNamesByPatterns(patterns, 'who').map((name) => CharString.create(name, "'")));
        result.isCell = true;
        return result;
    }

    /**
     * Return dimensions reported by `whos` for a runtime value.
     */
    private whosValueSize(value: NodeInput): number[] {
        if (MultiArray.isInstanceOf(value)) {
            return value.dimension;
        }
        if (CharString.isChar(value)) {
            return [1, value.str.length];
        }
        return [1, 1];
    }

    /**
     * Return a stable, approximate byte count for `whos` metadata.
     */
    private whosValueBytes(value: NodeInput): number {
        if (Complex.isInstanceOf(value)) {
            return 16;
        }
        if (CharString.isInstanceOf(value)) {
            return value.str.length * 2;
        }
        if (MultiArray.isInstanceOf(value)) {
            return MultiArray.linearize(value).reduce((sum, item) => sum + this.whosValueBytes(this.expressionValue(item, 'whos element')), 0);
        }
        if (Structure.isInstanceOf(value)) {
            return Object.values(value.field).reduce((sum, item) => sum + this.whosValueBytes(this.expressionValue(item, 'whos field')), 0);
        }
        return 0;
    }

    /**
     * Test whether a value contains complex numeric data for `whos`.
     */
    private whosValueIsComplex(value: NodeInput): boolean {
        if (Complex.isInstanceOf(value)) {
            return !Complex.isRealValue(value);
        }
        return MultiArray.isInstanceOf(value) && MultiArray.linearize(value).some((item) => Complex.isInstanceOf(item) && !Complex.isRealValue(item));
    }

    /**
     * Build a struct array describing current workspace variables.
     */
    private whosResult(args: NodeInput[]): MultiArray {
        const patterns = args.map((arg) => this.charControlArgument(arg, 'whos pattern').str);
        return this.whosResultFromPatterns(patterns);
    }

    /**
     * Build `whos` output from already-normalized command or function patterns.
     */
    private whosResultFromPatterns(patterns: string[]): MultiArray {
        const names = new Set(this.workspaceVariableNamesByPatterns(patterns, 'whos'));
        const entries = this.visibleWorkspaceVariableEntries().filter(([name]) => names.has(name));
        const result = MultiArray.toColumnVector(
            entries.map(([name, entry]) => {
                const value = this.expressionValue(entry.node, `workspace variable ${name}`);
                return new Structure({
                    name: CharString.create(name, "'"),
                    size: MultiArray.toRowVector(this.whosValueSize(value).map((dimension) => Complex.create(dimension))),
                    bytes: Complex.create(this.whosValueBytes(value)),
                    class: CharString.create(this.getValueClassName(value), "'"),
                    global: this.context.globalNameSet.has(name) ? Complex.true() : Complex.false(),
                    sparse: Complex.false(),
                    complex: this.whosValueIsComplex(value) ? Complex.true() : Complex.false(),
                    nesting: new Structure({ function: CharString.create('', "'"), level: Complex.create(0) }),
                    persistent: Complex.false(),
                });
            }),
        );
        MultiArray.setType(result);
        return result;
    }

    /**
     * Build a cell column vector with the current lexer keyword list.
     */
    private keywordListResult(): MultiArray {
        const result = MultiArray.toColumnVector(Interpreter.keywordNames.map((name) => CharString.create(name, "'")));
        result.isCell = true;
        return result;
    }

    /**
     * Apply a scalar text predicate to a scalar string or text array.
     */
    private textNamePredicateResult(value: NodeInput, functionName: 'iskeyword' | 'isvarname' | 'isglobal', predicate: (name: string) => boolean): NodeInput {
        if (CharString.isInstanceOf(value)) {
            return predicate(value.str) ? Complex.true() : Complex.false();
        }
        if (!MultiArray.isInstanceOf(value)) {
            AST.throwInvalidCallError(functionName, true, (message) => this.context.throwEvalError(message));
        }
        const result = new MultiArray(value.dimension);
        for (let n = 0; n < MultiArray.linearLength(value); n++) {
            const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(value.dimension[0], value.dimension[1], n);
            const item = value.array[row][column];
            result.array[row][column] = CharString.isInstanceOf(item) && predicate(item.str) ? Complex.true() : Complex.false();
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    }

    /**
     * MATLAB/Octave language keyword predicate.
     */
    private isKeywordResult(args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('iskeyword', args.length > 1, (message) => this.context.throwEvalError(message));
        if (args.length === 0) {
            return this.keywordListResult();
        }
        return this.textNamePredicateResult(args[0], 'iskeyword', (name) => Interpreter.keywordNameSet.has(name));
    }

    /**
     * MATLAB-compatible variable-name predicate.
     */
    private isVarNameResult(args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('isvarname', args.length !== 1, (message) => this.context.throwEvalError(message));
        return this.textNamePredicateResult(
            args[0],
            'isvarname',
            (name) => /^[A-Za-z][A-Za-z0-9_]*$/.test(name) && name.length <= Interpreter.nameLengthMax && !Interpreter.keywordNameSet.has(name),
        );
    }

    /**
     * Test whether a name is currently declared global.
     */
    private isGlobalName(name: string): boolean {
        return this.context.globalNameSet.has(name);
    }

    /**
     * MATLAB/Octave workspace global-name predicate.
     */
    private isGlobalResult(args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('isglobal', args.length !== 1, (message) => this.context.throwEvalError(message));
        return this.textNamePredicateResult(args[0], 'isglobal', (name) => this.isGlobalName(name));
    }

    /**
     * Return user-defined function names that can be matched by clear patterns.
     */
    private clearFunctionCandidates(): string[] {
        return this.visibleUserFunctionNames();
    }

    /**
     * Return visible user-defined function names in shadowing order.
     *
     * Function scopes can execute `clear functions` while the cached
     * function-file definitions live in a parent scope. Walking the visible
     * chain keeps command-form clear semantics aligned with runtime
     * resolution without touching built-ins or host-registered native
     * functions.
     */
    private visibleUserFunctionNames(): string[] {
        const names: string[] = [];
        const seen = new Set<string>();
        let scope: Scope | undefined = this.context.currentScope;
        while (scope) {
            for (const [name, func] of Object.entries(scope.functionTable)) {
                if (!seen.has(name) && func?.type === 'FCNDEF') {
                    names.push(name);
                    seen.add(name);
                }
            }
            scope = scope.parent;
        }
        return names;
    }

    /**
     * Test whether a visible function-table entry is a user function.
     *
     * @param name Function or imported alias candidate.
     * @returns `true` when clearing this name may remove a user function.
     */
    private hasVisibleUserFunction(name: string): boolean {
        let scope: Scope | undefined = this.context.currentScope;
        while (scope) {
            if (scope.functionTable[name]?.type === 'FCNDEF') {
                return true;
            }
            scope = scope.parent;
        }
        return false;
    }

    /**
     * Remove a visible user function from the current scope chain.
     *
     * @param name Function-table key to remove.
     * @returns `true` when a user function was visible for this name.
     */
    private clearVisibleUserFunction(name: string): boolean {
        if (!this.hasVisibleUserFunction(name)) {
            return false;
        }
        this.context.currentScope.clearFunction(name);
        return true;
    }

    /**
     * Return loaded class names that can be matched by clear patterns.
     */
    private clearClassCandidates(): string[] {
        return Object.keys(this.context.currentScope.nameTable).filter((name) => ClassDefinition.isInstanceOf(this.context.currentScope.nameTable[name]?.node));
    }

    /**
     * Return every visible loaded name category supported by clear patterns.
     */
    private clearVisibleCandidates(): string[] {
        return [...this.clearVariableCandidates(), ...this.clearFunctionCandidates(), ...this.clearClassCandidates()];
    }

    /**
     * Clear class definitions by selected names, or all loaded classes.
     *
     * @param names Optional loaded class names to clear.
     */
    private clearClassDefinitions(names?: string[]): void {
        if (!names) {
            this.context.clearClassDefinitions();
            return;
        }
        for (const className of names) {
            this.clearNamedSymbol(className);
        }
    }

    /**
     * Clear one exact name or wildcard pattern from visible variables/functions.
     *
     * @param pattern Exact clear target or wildcard pattern.
     */
    private clearNamedPattern(pattern: string): void {
        if (!this.clearPatternHasWildcards(pattern)) {
            this.clearNamedSymbol(pattern);
            return;
        }
        const candidates = [...this.clearVariableCandidates(), ...this.clearFunctionCandidates(), ...this.clearClassCandidates()];
        for (const name of this.selectClearPatternMatches([pattern], candidates) ?? []) {
            this.clearNamedSymbol(name);
        }
    }

    /**
     * Clear one visible symbol with MATLAB/Octave shadowing precedence.
     *
     * A variable shadows a function of the same name, so `clear name` removes
     * the variable first. Calling `clear name` again can then remove the
     * now-visible user function. Class definitions are stored as names and are
     * cleared through the same name path.
     *
     * @param name User-supplied symbol or imported alias to clear.
     */
    private clearNamedSymbol(name: string): void {
        const resolved = this.resolveRuntimeSymbol(name, this.context.currentScope, { loadClasses: false, loadFunctions: false });
        const resolvedName = resolved?.resolvedName ?? this.context.aliasNameFunction(name);
        const candidates = new Set([name, resolvedName]);
        let removedName = false;
        for (const candidate of candidates) {
            if (this.context.currentScope.hasLocalName(candidate)) {
                this.context.currentScope.removeName(candidate);
                removedName = true;
                if (this.context.nativeNameSet.has(candidate)) {
                    this.context.globalScope!.defineName(candidate, this.context.nativeNameTable[candidate]);
                }
            }
        }
        if (removedName) {
            return;
        }
        for (const candidate of candidates) {
            if (this.clearVisibleUserFunction(candidate)) {
                break;
            }
        }
    }

    /**
     * Remove user-defined functions from visible function tables.
     *
     * Built-ins and operator functions are registered separately and remain
     * available after `clear functions` or `clear all`.
     */
    private clearUserFunctions(names?: string[]): void {
        const functionNames = names ? names : this.clearFunctionCandidates();
        for (const functionName of functionNames) {
            const resolved = this.resolveRuntimeSymbol(functionName, this.context.currentScope, { variables: false, classes: false, loadClasses: false, loadFunctions: false });
            const resolvedName = resolved?.resolvedName ?? this.context.aliasNameFunction(functionName);
            for (const candidate of new Set([functionName, resolvedName])) {
                this.clearVisibleUserFunction(candidate);
            }
        }
    }

    /**
     * Validate left side of assignment node.
     * @param tree Left side of assignment node.
     * @param shallow True if tree is a left root of assignment.
     * @returns An object with four properties: `left`, `id`, `args` and `field`.
     */
    private validateAssignment(tree: NodeExpr, shallow: boolean, scope: Scope = this.context.currentScope): AssignmentTarget[] {
        const invalidLeftAssignmentMessage = 'invalid left hand side of assignment';
        const scalarSelectionTarget = (node: NodeExpr, delimiter: IndexingDelimiterType, linearIndex: number, mode: 'insert-at-identifier' | 'replace-first-index'): NodeExpr => {
            const state = { done: false };
            const indexList = (): NodeList => AST.nodeList([this.expressionValue(Complex.create(linearIndex + 1), 'index')]);
            const clone = (current: NodeExpr): NodeExpr => {
                if (AST.isNodeIdentifier(current)) {
                    const identifier = AST.nodeIdentifier(current.id);
                    if (mode === 'insert-at-identifier' && !state.done) {
                        state.done = true;
                        return AST.nodeIndexExpr(identifier, indexList(), delimiter);
                    }
                    return identifier;
                }
                if (AST.isNodeIgnoredTarget(current)) {
                    return AST.nodeIgnoredTarget();
                }
                if (AST.isNodeIndexExpr(current)) {
                    const expr = clone(current.expr);
                    if (mode === 'replace-first-index' && !state.done) {
                        state.done = true;
                        return AST.nodeIndexExpr(expr, indexList(), delimiter);
                    }
                    return AST.nodeIndexExpr(expr, AST.nodeList(current.args.map((arg) => this.cloneAssignmentTarget(arg))), current.delim);
                }
                if (AST.isNodeIndirectRef(current)) {
                    const firstField = current.field[0];
                    let result = AST.nodeIndirectRef(clone(current.obj), typeof firstField === 'string' ? firstField : this.cloneAssignmentTarget(firstField));
                    for (let i = 1; i < current.field.length; i++) {
                        const field = current.field[i];
                        result = AST.nodeIndirectRef(result, typeof field === 'string' ? field : this.cloneAssignmentTarget(field));
                    }
                    return result;
                }
                return this.cloneAssignmentTarget(current);
            };
            return clone(node);
        };
        const expandChainedTarget = (target: AssignmentTarget): AssignmentTarget[] => {
            if (shallow || !target.descriptors || target.descriptors.length === 0) {
                return [target];
            }
            const entry = scope.resolveName(target.id);
            if (!entry || !MultiArray.isInstanceOf(entry.node)) {
                return [target];
            }
            const firstDescriptor = this.readNativeSubscriptDescriptor(target.descriptors[0], 'subsasgn');
            const secondDescriptor = target.descriptors[1] ? this.readNativeSubscriptDescriptor(target.descriptors[1], 'subsasgn') : undefined;
            const cellContentSelection = entry.node.isCell && firstDescriptor.type === '()' && secondDescriptor?.type === '{}';
            if (entry.node.isCell && firstDescriptor.type !== '{}' && !cellContentSelection) {
                return [target];
            }
            if (!entry.node.isCell && !Structure.isStructure(entry.node) && !this.hasClassInstanceElement(entry.node)) {
                return [target];
            }
            const hasLeadingIndex = firstDescriptor.type === '()';
            const hasLeadingCellIndex = firstDescriptor.type === '{}';
            const selectedIndices =
                hasLeadingIndex || hasLeadingCellIndex
                    ? MultiArray.resolveLinearIndices(entry.node, target.id, this.nativeDescriptorIndexList(firstDescriptor, entry.node), this)
                    : MultiArray.resolveLinearIndices(entry.node, target.id, [MultiArray.expandColon(MultiArray.linearLength(entry.node))], this);
            const leadingDelimiter: IndexingDelimiterType = hasLeadingCellIndex ? '{}' : '()';
            return selectedIndices.map((linearIndex) => {
                const selectedTree = scalarSelectionTarget(tree, leadingDelimiter, linearIndex, hasLeadingIndex || hasLeadingCellIndex ? 'replace-first-index' : 'insert-at-identifier');
                const selectedTarget = this.collectSubsasgnAssignmentTarget(selectedTree, scope);
                if (selectedTarget) {
                    return selectedTarget;
                }
                return {
                    id: target.id,
                    index: [this.expressionValue(Complex.create(linearIndex + 1), 'index')],
                    delimiter: leadingDelimiter,
                    field: [],
                    descriptors: [this.createSubscriptDescriptor(leadingDelimiter, [this.expressionValue(Complex.create(linearIndex + 1), 'index')], tree, scope)],
                };
            });
        };
        if (AST.isNodeIdentifier(tree)) {
            return [
                {
                    id: tree.id,
                    field: [],
                },
            ];
        } else if (AST.isNodeIndexExpr(tree) && AST.isNodeIdentifier(tree.expr)) {
            if (!shallow && tree.delim === '{}') {
                const entry = scope.resolveName(tree.expr.id);
                if (entry && MultiArray.isInstanceOf(entry.node) && entry.node.isCell) {
                    const evaluatedIndex = this.evaluatedIndexArguments(tree.args, scope);
                    return MultiArray.resolveLinearIndices(entry.node, tree.expr.id, evaluatedIndex).map((linearIndex) => ({
                        id: tree.expr.id,
                        index: [this.expressionValue(Complex.create(linearIndex + 1), 'index')],
                        delimiter: tree.delim,
                        field: [],
                    }));
                }
            }
            return [
                {
                    id: tree.expr.id,
                    index: tree.args,
                    delimiter: tree.delim,
                    field: [],
                },
            ];
        } else if (AST.isNodeIndirectRef(tree)) {
            const field = tree.field.map((field: NodeExpr) => {
                if (typeof field === 'string') {
                    return field;
                }
                return this.evaluatedDynamicFieldName(field, scope, `${invalidLeftAssignmentMessage}: dynamic structure field names must be strings.`);
            });
            if (AST.isNodeIdentifier(tree.obj)) {
                if (!shallow) {
                    const entry = scope.resolveName(tree.obj.id);
                    if (entry && MultiArray.isInstanceOf(entry.node) && (Structure.isStructure(entry.node) || this.hasClassInstanceElement(entry.node))) {
                        return MultiArray.resolveLinearIndices(entry.node, tree.obj.id, [MultiArray.expandColon(MultiArray.linearLength(entry.node))], this).map((linearIndex) => ({
                            id: tree.obj.id,
                            index: [this.expressionValue(Complex.create(linearIndex + 1), 'index')],
                            delimiter: '()',
                            field,
                        }));
                    }
                }
                return [
                    {
                        id: tree.obj.id,
                        field,
                    },
                ];
            } else if (AST.isNodeIndexExpr(tree.obj) && AST.isNodeIdentifier(tree.obj.expr)) {
                if (!shallow && tree.obj.delim === '{}') {
                    const entry = scope.resolveName(tree.obj.expr.id);
                    if (entry && MultiArray.isInstanceOf(entry.node) && entry.node.isCell) {
                        const evaluatedIndex = this.evaluatedIndexArguments(tree.obj.args, scope);
                        return MultiArray.resolveLinearIndices(entry.node, tree.obj.expr.id, evaluatedIndex, this).map((linearIndex) => ({
                            id: tree.obj.expr.id,
                            index: [this.expressionValue(Complex.create(linearIndex + 1), 'index')],
                            delimiter: tree.obj.delim,
                            field: [],
                            descriptors: [
                                this.createSubscriptDescriptor(tree.obj.delim, [this.expressionValue(Complex.create(linearIndex + 1), 'index')], tree.obj, scope),
                                ...field.map((item: string) => this.createDotSubscriptDescriptor(item, tree, scope)),
                            ],
                        }));
                    }
                }
                if (!shallow && tree.obj.delim === '()') {
                    const entry = scope.resolveName(tree.obj.expr.id);
                    if (entry && MultiArray.isInstanceOf(entry.node) && (Structure.isStructure(entry.node) || this.hasClassInstanceElement(entry.node))) {
                        const evaluatedIndex = this.evaluatedIndexArguments(tree.obj.args, scope);
                        return MultiArray.resolveLinearIndices(entry.node, tree.obj.expr.id, evaluatedIndex, this).map((linearIndex) => ({
                            id: tree.obj.expr.id,
                            index: [this.expressionValue(Complex.create(linearIndex + 1), 'index')],
                            delimiter: tree.obj.delim,
                            field,
                            descriptors: [
                                this.createSubscriptDescriptor(tree.obj.delim, [this.expressionValue(Complex.create(linearIndex + 1), 'index')], tree.obj, scope),
                                ...field.map((item: string) => this.createDotSubscriptDescriptor(item, tree, scope)),
                            ],
                        }));
                    }
                }
                return [
                    {
                        id: tree.obj.expr.id,
                        index: tree.obj.args,
                        delimiter: tree.obj.delim,
                        field,
                        descriptors: [
                            this.createSubscriptDescriptor(tree.obj.delim, tree.obj.args, tree.obj, scope),
                            ...field.map((item: string) => this.createDotSubscriptDescriptor(item, tree, scope)),
                        ],
                    },
                ];
            } else {
                const target = this.collectSubsasgnAssignmentTarget(tree, scope);
                if (target) {
                    return expandChainedTarget(target);
                }
                this.context.throwEvalError(`${invalidLeftAssignmentMessage}.`);
            }
        } else if (AST.isNodeIgnoredTarget(tree)) {
            return [
                {
                    id: '~',
                    field: [],
                },
            ];
        } else if (shallow && MultiArray.isRowVector(tree)) {
            return tree.array[0].flatMap((left: NodeExpr) => this.validateAssignment(left, false, scope));
        } else {
            const target = this.collectSubsasgnAssignmentTarget(tree, scope);
            if (target) {
                return expandChainedTarget(target);
            }
            this.context.throwEvalError(`${invalidLeftAssignmentMessage}.`);
        }
    }

    /**
     * Convert an evaluated expression to a boolean condition.
     * @param tree Evaluated expression.
     * @returns Boolean truth value.
     */
    private toBoolean(tree: NodeExpr): boolean {
        if (MultiArray.isInstanceOf(tree)) {
            if (tree.isCell) {
                this.context.throwEvalError('invalid conversion from cell to logical.');
            }
            if (this.hasClassInstanceElement(tree)) {
                const converted = this.classUnaryOperatorArray(tree, 'logical', AST.nodeIdentifier('logical'));
                if (converted) {
                    return this.toBoolean(this.expressionValue(converted, 'logical conversion'));
                }
                this.context.throwEvalError(`invalid conversion from ${this.getValueClassName(tree)} to logical.`);
            }
            return this.complexConditionValue(MultiArray.toLogical(tree));
        }
        if (Complex.isInstanceOf(tree)) {
            return this.complexConditionValue(tree);
        }
        if (CharString.isInstanceOf(tree)) {
            return !!tree.str;
        }
        if (ClassInstance.isInstanceOf(tree)) {
            const overload = this.classUnaryOperatorMethod(tree, 'logical');
            if (overload) {
                return this.toBoolean(this.expressionValue(this.reducedClassMethodResult(overload.receiver, overload.method, [], AST.nodeIdentifier('logical')), 'logical conversion'));
            }
        }
        this.context.throwEvalError(`invalid conversion from ${this.getValueClassName(tree)} to logical.`);
    }

    /**
     * Convert a scalar complex/logical value to a JavaScript condition flag.
     *
     * @param value Numeric or logical scalar.
     * @returns `true` when either numeric component is nonzero.
     */
    private complexConditionValue(value: ComplexType): boolean {
        return Boolean(Complex.realToNumber(value) || Complex.imagToNumber(value));
    }

    /**
     * Evaluate a control-flow condition using MATLAB/Octave truth rules.
     *
     * In condition contexts, MATLAB treats `&` and `|` as short-circuit
     * operators, matching `&&` and `||`. Ordinary expression evaluation keeps
     * `&` and `|` element-wise, so the special handling stays local to control
     * predicates.
     *
     * @param tree Condition expression.
     * @param scope Scope used while evaluating operands.
     * @param name Human-readable expression name for diagnostics.
     * @returns Boolean condition value.
     */
    private evaluatedCondition(tree: NodeExpr, scope: Scope, name: string): boolean {
        return this.toBoolean(this.evaluatedConditionExpression(tree, scope, name));
    }

    /**
     * Evaluate a condition expression, preserving conditional short-circuiting.
     *
     * @param tree Condition expression.
     * @param scope Scope used while evaluating operands.
     * @param name Human-readable expression name for diagnostics.
     * @returns Evaluated condition value.
     */
    private evaluatedConditionExpression(tree: NodeExpr, scope: Scope, name: string): NodeExpr {
        if (AST.isNodeBinaryOperation(tree) && (tree.type === '&' || tree.type === '|' || tree.type === '&&' || tree.type === '||')) {
            return this.evaluateConditionalLogicalOperation(tree, scope);
        }
        return this.evaluatedExpressionValue(tree, scope, name);
    }

    /**
     * Evaluate a logical operator inside a control-flow condition.
     *
     * @param tree Logical binary operation.
     * @param scope Scope used while evaluating operands.
     * @returns Logical scalar result.
     */
    private evaluateConditionalLogicalOperation(tree: BinaryOperation, scope: Scope): NodeExpr {
        const leftValue = this.evaluatedCondition(tree.left, scope, 'left condition operand');
        if (tree.type === '&' || tree.type === '&&') {
            if (!leftValue) {
                return Complex.false();
            }
            return this.evaluatedCondition(tree.right, scope, 'right condition operand') ? Complex.true() : Complex.false();
        }
        if (leftValue) {
            return Complex.true();
        }
        return this.evaluatedCondition(tree.right, scope, 'right condition operand') ? Complex.true() : Complex.false();
    }

    private switchComparableValue(value: NodeInput): NodeInput {
        if (MultiArray.isInstanceOf(value) && !value.isCell && value.dimension.length === 2 && value.dimension[0] === 1 && value.dimension[1] === 1) {
            return this.expressionValue(value.array[0][0], 'switch value');
        }
        return value;
    }

    private switchCaseMatches(switchValue: NodeInput, caseValue: NodeInput): boolean {
        const candidates = MultiArray.isInstanceOf(caseValue) && caseValue.isCell ? this.expressionList(MultiArray.linearize(caseValue), 'switch case') : [caseValue];
        for (const candidate of candidates) {
            if (this.switchCandidateMatches(switchValue, candidate)) {
                return true;
            }
        }
        return false;
    }

    private switchCandidateMatches(switchValue: NodeInput, candidate: NodeInput): boolean {
        const left = this.switchComparableValue(candidate);
        const right = this.switchComparableValue(switchValue);
        const overload = this.classBinaryOperatorMethod(left, right, 'eq');
        if (overload) {
            return this.toBoolean(this.expressionValue(this.reducedClassMethodResult(overload.receiver, overload.method, overload.args, AST.nodeIdentifier('switch')), 'switch case'));
        }
        return RuntimeEquality.valuesEqual(right, left);
    }

    private classDefinitionForOperatorValue(value: NodeInput): ClassDefinition | undefined {
        return ClassInstance.isInstanceOf(value) ? value.classDefinition : undefined;
    }

    private classNameForOperatorValue(value: NodeInput): string {
        return ClassInstance.isInstanceOf(value) ? value.classDefinition.name : this.getValueClassName(value);
    }

    private classDeclaresInferior(definition: ClassDefinition | undefined, value: NodeInput): boolean {
        if (!definition) {
            return false;
        }
        const valueDefinition = this.classDefinitionForOperatorValue(value);
        const valueClassName = this.classNameForOperatorValue(value);
        return definition.inferiorClasses.some((className) => {
            if (className === valueClassName) {
                return true;
            }
            return valueDefinition ? valueDefinition.name === className || valueDefinition.isSubclassOfName(className) : false;
        });
    }

    private classBinaryOperatorMethod(
        left: NodeInput,
        right: NodeInput,
        methodName: string,
    ): { receiver: ClassInstance; method: ClassMethodDefinition; args: ExpressionBoundaryValue[] } | undefined {
        const findMethod = (value: NodeInput): { receiver: ClassInstance; method: ClassMethodDefinition; args: ExpressionBoundaryValue[] } | undefined => {
            if (!ClassInstance.isInstanceOf(value)) {
                return undefined;
            }
            const method = value.classDefinition.findMethod(methodName, (item) => !item.isStatic);
            if (!method) {
                return undefined;
            }
            if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
                this.context.throwEvalError(`method '${methodName}' has ${method.access} access for class ${value.classDefinition.name}.`);
            }
            return { receiver: value, method, args: this.classMethodArgumentValues([value === left ? right : left], 'operator') };
        };
        const leftDefinition = this.classDefinitionForOperatorValue(left);
        const rightDefinition = this.classDefinitionForOperatorValue(right);
        if (this.classDeclaresInferior(rightDefinition, left) && !this.classDeclaresInferior(leftDefinition, right)) {
            return findMethod(right) ?? findMethod(left);
        }
        return findMethod(left) ?? findMethod(right);
    }

    private hasClassInstanceElement(value: NodeInput): boolean {
        return ClassInstance.isInstanceOf(value) || (MultiArray.isInstanceOf(value) && MultiArray.linearize(value).some((element) => ClassInstance.isInstanceOf(element)));
    }

    private classBinaryOperatorArray(left: NodeInput, right: NodeInput, methodName: string, parent: NodeInput): NodeInput | undefined {
        if (!this.hasClassInstanceElement(left) && !this.hasClassInstanceElement(right)) {
            return undefined;
        }
        const leftArray = MultiArray.scalarToMultiArray(left);
        const rightArray = MultiArray.scalarToMultiArray(right);
        const firstLeft = leftArray.array[0]?.[0];
        const firstRight = rightArray.array[0]?.[0];
        if (!this.classBinaryOperatorMethod(firstLeft, firstRight, methodName)) {
            return undefined;
        }
        const result = MultiArray.mapBroadcasted(leftArray, rightArray, `operator ${methodName}`, (leftValue, rightValue) => {
            const overload = this.classBinaryOperatorMethod(leftValue, rightValue, methodName);
            if (!overload) {
                this.context.throwEvalError(`operator ${methodName} is not defined for class array element.`);
            }
            return this.reducedClassMethodResult(overload.receiver, overload.method, overload.args, parent);
        });
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    }

    private evaluateBinaryOperatorWithClassDispatch(left: NodeInput, right: NodeInput, methodName: string, operationName: string, parent: NodeInput): NodeInput {
        const arrayOverload = this.classBinaryOperatorArray(left, right, methodName, parent);
        if (arrayOverload) {
            return arrayOverload;
        }
        const overload = this.classBinaryOperatorMethod(left, right, methodName);
        if (overload) {
            return this.context.callClassInstanceMethod(overload.receiver, overload.method, overload.args, parent);
        }
        return (MathOperation[operationName as KeyOfTypeOfMathOperation] as BinaryMathOperation)(left, right);
    }

    private classVariadicOperatorMethod(values: NodeInput[], methodName: string): { receiver: ClassInstance; method: ClassMethodDefinition; args: ExpressionBoundaryValue[] } | undefined {
        for (let receiverIndex = 0; receiverIndex < values.length; receiverIndex++) {
            const value = values[receiverIndex];
            if (!ClassInstance.isInstanceOf(value)) {
                continue;
            }
            const method = value.classDefinition.findMethod(methodName, (item) => !item.isStatic);
            if (!method) {
                continue;
            }
            if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
                this.context.throwEvalError(`method '${methodName}' has ${method.access} access for class ${value.classDefinition.name}.`);
            }
            return {
                receiver: value,
                method,
                args: this.classMethodArgumentValues(
                    values.filter((_item, index) => index !== receiverIndex),
                    'operator',
                ),
            };
        }
        return undefined;
    }

    private evaluateColonWithClassDispatch(values: NodeInput[], parent: NodeInput): NodeInput | undefined {
        if (!values.some((value) => this.hasClassInstanceElement(value))) {
            return undefined;
        }
        const overload = this.classVariadicOperatorMethod(values, 'colon');
        if (overload) {
            return this.context.callClassInstanceMethod(overload.receiver, overload.method, overload.args, parent);
        }
        this.context.throwEvalError('operator colon is not defined for class operands.');
    }

    /**
     * Dispatch MATLAB/Octave concatenation overloads for class operands.
     *
     * Used both by function-form calls (`horzcat(a,b)`) and by array literals
     * (`[a,b]`, `[a;b]`) through the runtime container hook.
     */
    public concatenateOverload(name: 'cat' | 'horzcat' | 'vertcat', values: unknown[], parent: NodeInput): NodeInput | undefined {
        const expressions = values.map((value, index) => this.expressionValue(value, `${name} argument ${index + 1}`));
        if (!expressions.some((value) => this.hasClassInstanceElement(value))) {
            return undefined;
        }
        const overload = this.classVariadicOperatorMethod(expressions, name);
        if (overload) {
            return this.reducedClassMethodResult(overload.receiver, overload.method, overload.args, parent);
        }
        return undefined;
    }

    /**
     * Dispatch a functional operator call such as `plus(a,b)` or `colon(a,b)`.
     *
     * Function-form operator calls use the same overload opportunity as their
     * symbolic counterparts. The method also performs the native fallback with
     * the already evaluated arguments, avoiding duplicate evaluation for calls
     * such as `plus(f(), g())`.
     */
    public callFunctionalOperatorOverload(node: NodeBuiltInFunction, args: CallArgumentValue[], parent: NodeInput): NodeInput | undefined {
        const name = node.id;
        const unaryOperation = MathOperation.unaryOperations[name as KeyOfTypeOfMathOperation];
        const binaryOperation = MathOperation.binaryOperations[name as KeyOfTypeOfMathOperation];
        const leftAssociativeOperation = MathOperation.leftAssociativeMultipleOperations[name as KeyOfTypeOfMathOperation];
        const isColon = name === 'colon';
        const isCat = name === 'cat';
        const isConcatenation = name === 'horzcat' || name === 'vertcat';
        if (!unaryOperation && !binaryOperation && !leftAssociativeOperation && !isColon && !isCat && !isConcatenation) {
            return undefined;
        }
        const evaluatedArgs = this.context.evaluateBuiltInArgs(node, args, parent).map((value, index) => this.expressionValue(value, `operator argument ${index + 1}`));
        this.context.validateBuiltInInputArity(node, evaluatedArgs.length);
        const hasClassOperand = evaluatedArgs.some((value) => this.hasClassInstanceElement(value));
        if (!hasClassOperand || isCat || isConcatenation) {
            this.context.validateBuiltInInputParameters(node, evaluatedArgs);
        }
        if (isColon) {
            if (evaluatedArgs.length !== 2 && evaluatedArgs.length !== 3) {
                AST.throwInvalidCallError(name, false, (message) => this.context.throwEvalError(message));
            }
            return this.evaluateColonWithClassDispatch(evaluatedArgs, parent) ?? CoreFunctions.colon(...(evaluatedArgs as ElementType[]));
        }
        if (isCat) {
            const overload = this.concatenateOverload(name, evaluatedArgs, parent);
            if (overload) {
                return overload;
            }
            const [dimension, ...arrays] = evaluatedArgs as ElementType[];
            return CoreFunctions.cat(dimension, ...arrays);
        }
        if (isConcatenation) {
            const overload = this.concatenateOverload(name, evaluatedArgs, parent);
            if (overload) {
                return overload;
            }
            return (name === 'horzcat' ? CoreFunctions.horzcat : CoreFunctions.vertcat)(...(evaluatedArgs as ElementType[]));
        }
        if (unaryOperation) {
            if (evaluatedArgs.length !== 1) {
                AST.throwInvalidCallError(name, false, (message) => this.context.throwEvalError(message));
            }
            const value = evaluatedArgs[0];
            const arrayOverload = this.classUnaryOperatorArray(value, name, parent);
            if (arrayOverload) {
                return arrayOverload;
            }
            const overload = this.classUnaryOperatorMethod(value, name);
            if (overload) {
                return this.context.callClassInstanceMethod(overload.receiver, overload.method, [], parent);
            }
            return unaryOperation(value as MathObject);
        }
        if (binaryOperation) {
            if (evaluatedArgs.length !== 2) {
                AST.throwInvalidCallError(name, false, (message) => this.context.throwEvalError(message));
            }
            return this.evaluateBinaryOperatorWithClassDispatch(evaluatedArgs[0], evaluatedArgs[1], name, name, parent);
        }
        if (leftAssociativeOperation) {
            if (evaluatedArgs.length < 2) {
                AST.throwInvalidCallError(name, false, (message) => this.context.throwEvalError(message));
            }
            let result = this.evaluateBinaryOperatorWithClassDispatch(evaluatedArgs[0], evaluatedArgs[1], name, name, parent);
            for (let i = 2; i < evaluatedArgs.length; i++) {
                result = this.evaluateBinaryOperatorWithClassDispatch(result, evaluatedArgs[i], name, name, parent);
            }
            return result;
        }
        return undefined;
    }

    private requireBinaryOperation(tree: NodeInput): BinaryOperation {
        if (AST.isNodeBinaryOperation(tree)) {
            return tree;
        }
        this.context.throwEvalError(`invalid binary operation AST node '${tree.type}'.`);
    }

    private requirePrefixOperation(tree: NodeInput): PrefixUnaryOperation {
        if (AST.isNodePrefixOperation(tree)) {
            return tree;
        }
        this.context.throwEvalError(`invalid prefix operation AST node '${tree.type}'.`);
    }

    private requirePostfixOperation(tree: NodeInput): PostfixUnaryOperation {
        if (AST.isNodePostfixOperation(tree)) {
            return tree;
        }
        this.context.throwEvalError(`invalid postfix operation AST node '${tree.type}'.`);
    }

    private evaluateBinaryOperation(tree: BinaryOperation, scope: Scope): NodeInput {
        const left = this.evaluatedExpressionValue(tree.left, scope, 'left operand');
        const right = this.evaluatedExpressionValue(tree.right, scope, 'right operand');
        const methodName = Interpreter.binaryOperatorMethodTable[tree.type];
        if (methodName) {
            return this.evaluateBinaryOperatorWithClassDispatch(left, right, methodName, methodName, tree);
        }
        return (this.opTable[tree.type] as BinaryMathOperation)(left, right);
    }

    /**
     * Evaluate MATLAB/Octave scalar short-circuit logical operators.
     *
     * Unlike `&` and `|`, `&&` and `||` decide whether the right-hand operand is
     * evaluated from the truth value of the left-hand operand. The resulting
     * value is always a logical scalar.
     *
     * @param tree Operation node for `&&` or `||`.
     * @param scope Scope used while evaluating operands.
     * @returns Logical scalar result.
     */
    private evaluateShortCircuitOperation(tree: BinaryOperation, scope: Scope): NodeInput {
        const left = this.evaluatedExpressionValue(tree.left, scope, 'left operand');
        const leftValue = this.toBoolean(left);
        if (tree.type === '&&') {
            if (!leftValue) {
                return Complex.false();
            }
            return this.toBoolean(this.evaluatedExpressionValue(tree.right, scope, 'right operand')) ? Complex.true() : Complex.false();
        }
        if (leftValue) {
            return Complex.true();
        }
        return this.toBoolean(this.evaluatedExpressionValue(tree.right, scope, 'right operand')) ? Complex.true() : Complex.false();
    }

    private classUnaryOperatorMethod(value: NodeInput, methodName: string): { receiver: ClassInstance; method: ClassMethodDefinition } | undefined {
        if (!ClassInstance.isInstanceOf(value)) {
            return undefined;
        }
        const method = value.classDefinition.findMethod(methodName, (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method '${methodName}' has ${method.access} access for class ${value.classDefinition.name}.`);
        }
        return { receiver: value, method };
    }

    private classUnaryOperatorArray(value: NodeInput, methodName: string, parent: NodeInput): NodeInput | undefined {
        if (!MultiArray.isInstanceOf(value) || !this.hasClassInstanceElement(value)) {
            return undefined;
        }
        const first = value.array[0]?.[0];
        if (!this.classUnaryOperatorMethod(first, methodName)) {
            return undefined;
        }
        const result = new MultiArray(value.dimension);
        for (let n = 0; n < MultiArray.linearLength(value); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(value.dimension[0], value.dimension[1], n);
            const overload = this.classUnaryOperatorMethod(value.array[i][j], methodName);
            if (!overload) {
                this.context.throwEvalError(`operator ${methodName} is not defined for class array element.`);
            }
            result.array[i][j] = this.reducedClassMethodResult(overload.receiver, overload.method, [], parent);
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    }

    private evaluateUnaryOperation(tree: PrefixUnaryOperation | PostfixUnaryOperation, scope: Scope): NodeInput {
        const operand = AST.isNodePrefixOperation(tree) ? tree.right : tree.left;
        const value = this.evaluatedExpressionValue(operand, scope, 'unary operand');
        const methodName = Interpreter.unaryOperatorMethodTable[tree.type];
        if (methodName) {
            const arrayOverload = this.classUnaryOperatorArray(value, methodName, tree);
            if (arrayOverload) {
                return arrayOverload;
            }
            const overload = this.classUnaryOperatorMethod(value, methodName);
            if (overload) {
                return this.context.callClassInstanceMethod(overload.receiver, overload.method, [], tree);
            }
        }
        return (this.opTable[tree.type] as UnaryMathOperation)(value);
    }

    private resolveClassInstanceField(instance: ClassInstance, field: string, parent: NodeInput): NodeInput {
        try {
            ClassInstance.throwIfDeleted(instance);
        } catch (e: unknown) {
            this.context.throwEvalError((e as Error).message);
        }
        if (instance.classDefinition.isSubclassOfName('event.EventData')) {
            if (field === 'Source') {
                if (!instance.eventDataSource) {
                    this.context.throwEvalError(`event data Source is not assigned until notify dispatch.`);
                }
                return instance.eventDataSource;
            }
            if (field === 'EventName') {
                if (!instance.eventDataEventName) {
                    this.context.throwEvalError(`event data EventName is not assigned until notify dispatch.`);
                }
                return CharString.create(instance.eventDataEventName);
            }
        }
        if (!this.context.canAccessClassMember(instance.classDefinition, 'private')) {
            const subsrefResult = this.callClassDotSubsref(instance, field, parent, this.context.currentScope);
            if (typeof subsrefResult !== 'undefined') {
                return subsrefResult;
            }
        }
        const property = instance.classDefinition.findProperty(field);
        if (property?.getMethodName) {
            this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
            if (property.isGetObservable) {
                this.dispatchClassPropertyEvent(instance, field, 'PreGet');
            }
            const getter = instance.classDefinition.findMethod(property.getMethodName, (item) => !item.isStatic);
            if (!getter) {
                this.context.throwEvalError(`GetMethod '${property.getMethodName}' for property '${field}' in class ${instance.classDefinition.name} is not defined.`);
            }
            const result = this.reducedClassMethodResult(instance, getter, [], parent);
            if (property.isGetObservable) {
                this.dispatchClassPropertyEvent(instance, field, 'PostGet');
            }
            return result;
        }
        if (property?.isDependent) {
            this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
            if (property.isGetObservable) {
                this.dispatchClassPropertyEvent(instance, field, 'PreGet');
            }
            const getter = instance.classDefinition.findMethod(`get.${field}`, (item) => !item.isStatic);
            if (!getter) {
                this.context.throwEvalError(`dependent property '${field}' for class ${instance.classDefinition.name} has no get accessor.`);
            }
            const result = this.reducedClassMethodResult(instance, getter, [], parent);
            if (property.isGetObservable) {
                this.dispatchClassPropertyEvent(instance, field, 'PostGet');
            }
            return result;
        }
        const value = ClassInstance.getProperty(instance, field);
        if (typeof value !== 'undefined') {
            if (property) {
                this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
                if (property.isGetObservable) {
                    this.dispatchClassPropertyEvent(instance, field, 'PreGet');
                    this.dispatchClassPropertyEvent(instance, field, 'PostGet');
                }
            }
            return value;
        }
        const method = instance.classDefinition.findMethod(field, (item) => !item.isStatic);
        if (method) {
            if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
                this.context.throwEvalError(`method '${field}' has ${method.access} access for class ${instance.classDefinition.name}.`);
            }
            return ClassBoundMethod.bind(instance, method);
        }
        this.context.throwEvalError(`unknown property or method '${field}' for class ${instance.classDefinition.name}.`);
    }

    private assertCanReadClassProperty(property: ClassPropertyDefinition, name: string, className: string): void {
        if (!this.context.canAccessClassMember(property.classDefinition, property.getAccess)) {
            this.context.throwEvalError(`property '${name}' has ${property.getAccess} get access for class ${className}.`);
        }
    }

    private assertCanWriteClassProperty(property: ClassPropertyDefinition, name: string, className: string): void {
        if (!this.context.canAccessClassMember(property.classDefinition, property.setAccess)) {
            this.context.throwEvalError(`property '${name}' has ${property.setAccess} set access for class ${className}.`);
        }
    }

    /**
     * Test whether an `AbortSet` property assignment can be skipped.
     *
     * MATLAB skips observable set work when a stored non-dependent property is
     * assigned an equal value. The comparison delegates to shared `isequal`
     * semantics.
     *
     * @param instance Target object.
     * @param property Property being assigned.
     * @param value New value.
     * @returns `true` when assignment side effects should be suppressed.
     */
    private shouldAbortClassPropertySet(instance: ClassInstance, property: ClassPropertyDefinition, value: NodeInput): boolean {
        return (
            property.isAbortSet &&
            !property.isDependent &&
            ClassInstance.hasProperty(instance, property.name) &&
            RuntimeEquality.valuesEqual(ClassInstance.getProperty(instance, property.name)!, value)
        );
    }

    private assignClassInstanceField(instance: ClassInstance, field: string, value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance {
        if (!this.context.canAccessClassMember(instance.classDefinition, 'private')) {
            const updated = this.callClassDotSubsasgn(instance, field, value, parent, scope);
            if (updated) {
                return updated;
            }
        }
        if (instance.classDefinition.isSubclassOfName('event.EventData') && (field === 'Source' || field === 'EventName')) {
            this.context.throwEvalError(`cannot assign to read-only property '${field}' for class ${instance.classDefinition.name}.`);
        }
        const property = instance.classDefinition.findProperty(field);
        if (property) {
            this.assertCanWriteClassProperty(property, field, instance.classDefinition.name);
        }
        if (property?.isConstant) {
            this.context.throwEvalError(`cannot assign to constant property '${field}' for class ${instance.classDefinition.name}.`);
        }
        if (property && this.shouldAbortClassPropertySet(instance, property, value)) {
            return instance;
        }
        if (property?.isSetObservable) {
            this.dispatchClassPropertyEvent(instance, field, 'PreSet');
        }
        if (property?.setMethodName || property?.isDependent) {
            this.validateClassPropertyValue(property, value, scope);
            const setterName = property.setMethodName ?? `set.${field}`;
            const setter = instance.classDefinition.findMethod(setterName, (item) => !item.isStatic);
            if (!setter) {
                if (property.setMethodName) {
                    this.context.throwEvalError(`SetMethod '${property.setMethodName}' for property '${field}' in class ${instance.classDefinition.name} is not defined.`);
                }
                this.context.throwEvalError(`cannot assign to dependent property '${field}' for class ${instance.classDefinition.name} without a set accessor.`);
            }
            const updated = this.reducedClassMethodResult(instance, setter, this.classMethodArgumentValues([value], `set.${field}`), parent);
            if (!ClassInstance.isInstanceOf(updated)) {
                this.context.throwEvalError(`set accessor for property '${field}' must return an object of class ${instance.classDefinition.name}.`);
            }
            if (property.isSetObservable) {
                this.dispatchClassPropertyEvent(updated, field, 'PostSet');
            }
            return updated;
        }
        if (property) {
            this.validateClassPropertyValue(property, value, scope);
        }
        try {
            ClassInstance.setProperty(instance, field, value);
        } catch (e: unknown) {
            this.context.throwEvalError((e as Error).message);
        }
        if (property?.isSetObservable) {
            this.dispatchClassPropertyEvent(instance, field, 'PostSet');
        }
        return instance;
    }

    private assignNestedClassInstanceField(instance: ClassInstance, field: string[], value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance {
        if (field.length === 1) {
            return this.assignClassInstanceField(instance, field[0], value, parent, scope);
        }
        const rootField = field[0];
        const nestedField = field.slice(1);
        let rootValue = this.resolveClassInstanceField(instance, rootField, parent);
        if (MultiArray.isEmpty(rootValue)) {
            rootValue = new Structure({});
        }
        let updatedRoot: NodeInput;
        if (Structure.isInstanceOf(rootValue)) {
            const structure = Structure.copy(rootValue);
            Structure.setNewField(structure, nestedField, this.runtimeExpressionValue(value, `field ${field.join('.')}`));
            updatedRoot = structure;
        } else if (ClassInstance.isInstanceOf(rootValue)) {
            updatedRoot = this.assignNestedClassInstanceField(rootValue, nestedField, value, parent, scope);
        } else {
            this.context.throwEvalError('value cannot be indexed with .');
        }
        return this.assignClassInstanceField(instance, rootField, updatedRoot, parent, scope);
    }

    private assignClassArrayField(array: MultiArray, field: string, value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        const result = MultiArray.copy(array);
        const values = this.assignmentValues(value, 'assignment');
        const targetLength = MultiArray.linearLength(result);
        if (values.length !== 1 && values.length !== targetLength) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match object array length ${targetLength}.`);
        }
        for (let n = 0; n < targetLength; n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            const instance = result.array[i][j];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array field assignment requires class instance elements.`);
            }
            result.array[i][j] = this.assignClassInstanceField(instance, field, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(result);
        return result;
    }

    private assignNestedClassArrayField(array: MultiArray, field: string[], value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        if (field.length === 1) {
            return this.assignClassArrayField(array, field[0], value, parent, scope);
        }
        const result = MultiArray.copy(array);
        const values = this.assignmentValues(value, 'assignment');
        const targetLength = MultiArray.linearLength(result);
        if (values.length !== 1 && values.length !== targetLength) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match object array length ${targetLength}.`);
        }
        for (let n = 0; n < targetLength; n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            const instance = result.array[i][j];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array field assignment requires class instance elements.`);
            }
            result.array[i][j] = this.assignNestedClassInstanceField(instance, field, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(result);
        return result;
    }

    private assignClassArrayIndexedField(id: string, array: MultiArray, index: ExpressionBoundaryValue[], field: string, value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        const evaluatedIndex = this.evaluatedIndexArguments(index, scope);
        const selected = MultiArray.getElements(array, id, [], evaluatedIndex);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = selectedValues.length === 1 ? [value] : this.assignmentValues(value, 'assignment');
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignClassInstanceField(instance, field, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        MultiArray.setElements(scope, id, [], evaluatedIndex, updated);
        return this.scopedMultiArrayValue(scope, id, 'object array assignment result');
    }

    private assignClassArrayIndexedNestedField(
        id: string,
        array: MultiArray,
        index: ExpressionBoundaryValue[],
        field: string[],
        value: NodeInput,
        parent: NodeInput,
        scope: Scope,
    ): MultiArray {
        if (field.length === 1) {
            return this.assignClassArrayIndexedField(id, array, index, field[0], value, parent, scope);
        }
        const evaluatedIndex = this.evaluatedIndexArguments(index, scope);
        const selected = MultiArray.getElements(array, id, [], evaluatedIndex);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = selectedValues.length === 1 ? [value] : this.assignmentValues(value, 'assignment');
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignNestedClassInstanceField(instance, field, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        MultiArray.setElements(scope, id, [], evaluatedIndex, updated);
        return this.scopedMultiArrayValue(scope, id, 'object array assignment result');
    }

    private assignClassArrayDescriptorField(array: MultiArray, indexList: IndexArgument[], field: string[], value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        const result = MultiArray.copy(array);
        const selected = MultiArray.getElements(result, '', [], indexList);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = selectedValues.length === 1 ? [value] : this.assignmentValues(value, 'assignment');
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignNestedClassInstanceField(instance, field, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        const tempScope = Scope.create();
        tempScope.defineName('__object_array_subsasgn__', result);
        MultiArray.setElements(tempScope, '__object_array_subsasgn__', [], indexList, updated, undefined, this);
        return this.scopedMultiArrayValue(tempScope, '__object_array_subsasgn__', 'object array assignment result');
    }

    /**
     * Evaluate AST subscript expressions and narrow them to native index values.
     */
    private evaluatedIndexArguments(index: ExpressionBoundaryValue[], scope: Scope): IndexArgument[] {
        return MultiArray.indexArguments(
            index.map((arg: NodeExpr, itemIndex) => this.convertIndexArgument(this.evaluatedExpressionValue(arg, scope, `index${itemIndex + 1}`), arg)),
            'index',
        );
    }

    /**
     * Evaluate one dynamic field-name expression and normalize it to text.
     */
    private evaluatedDynamicFieldName(field: NodeExpr, scope: Scope, message: string): string {
        const evaluated = this.evaluatedExpressionValue(field, scope, 'dynamic field name');
        if (!CharString.isInstanceOf(evaluated)) {
            this.context.throwEvalError(message);
        }
        return evaluated.str;
    }

    /**
     * Evaluate a receiver in a context that preserves comma-separated lists.
     *
     * Chained access such as `C{:}.field` or `C{:}(idx)` must apply the
     * following subscript to every comma-list element instead of reducing the
     * receiver to its first value.
     */
    private evaluatedCommaSeparatedReceiver(expr: NodeExpr, scope: Scope): NodeInput[] | undefined {
        this.context.pushRequestedOutputCount(1);
        this.context.pushCommaListExpansion();
        try {
            const value = this.Evaluator(expr, scope);
            return AST.isNodeReturnList(value) && value.commaSeparated ? this.context.expandCommaSeparatedList(value) : undefined;
        } finally {
            this.context.popCommaListExpansion();
            this.context.popRequestedOutputCount();
        }
    }

    /**
     * Return a chained comma-list result in the form expected by the caller.
     */
    private chainedCommaListResult(values: unknown[]): NodeInput {
        if (values.length === 1) {
            return this.returnListValue(values[0], 'out1');
        }
        return this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled ? this.valueReturnList(values) : AST.nodeList(this.expressionList(values, 'out'));
    }

    /**
     * Apply one chained call/index operation while building a comma-separated list.
     *
     * Each item in constructs such as `C{:}.method()` contributes one value to
     * the outer comma-separated list, even when the surrounding assignment asks
     * for multiple outputs.
     */
    private chainedCommaItemApply(value: NodeInput, args: CallArgumentValue[], parent: NodeInput): NodeInput {
        this.context.pushRequestedOutputCount(1);
        try {
            const indexedValue = this.context.apply(this.expressionValue(value, 'indexed expression'), args, parent);
            return this.reducedIndexingResult(indexedValue);
        } finally {
            this.context.popRequestedOutputCount();
        }
    }

    /**
     * Find the prefix of a dotted chain that expands to a comma-separated list.
     *
     * For `S.obj.method()`, the comma list may be produced by `S.obj` rather
     * than by the first receiver `S`. Returning the remaining field suffix lets
     * the caller apply `method` to every expanded object.
     */
    private dottedCommaReceiver(node: NodeIndirectRef, scope: Scope): { values: NodeInput[]; fields: (string | NodeExpr)[] } | undefined {
        const commaReceiverOrUndefined = (expr: NodeExpr): NodeInput[] | undefined => {
            try {
                return this.evaluatedCommaSeparatedReceiver(expr, scope);
            } catch {
                return undefined;
            }
        };
        let prefix = node.obj;
        for (let consumed = 0; consumed < node.field.length; consumed++) {
            const values = commaReceiverOrUndefined(prefix);
            if (values) {
                return { values, fields: node.field.slice(consumed) };
            }
            prefix = AST.nodeIndirectRef(AST.isNodeIndirectRef(prefix) ? { ...prefix, field: [...prefix.field] } : prefix, node.field[consumed]);
        }
        const values = commaReceiverOrUndefined(prefix);
        return values ? { values, fields: [] } : undefined;
    }

    /**
     * Apply a dot-field chain to one already evaluated receiver.
     */
    private resolveDotFieldChain(obj: NodeInput, fields: string[], parent: NodeInput, scope: Scope): NodeInput {
        if (ClassInstance.isInstanceOf(obj)) {
            return this.resolveClassFieldChain(obj, fields, parent);
        }
        if (MultiArray.isInstanceOf(obj) && this.hasClassInstanceElement(obj)) {
            return this.resolveClassFieldChain(obj, fields, parent);
        }
        if (ClassEventListener.isInstanceOf(obj)) {
            let current: NodeInput = obj;
            for (const field of fields) {
                if (ClassEventListener.isInstanceOf(current)) {
                    current = this.resolveClassEventListenerField(current, field);
                } else if (ClassInstance.isInstanceOf(current)) {
                    current = this.resolveClassInstanceField(current, field, parent);
                } else {
                    current = Structure.getField(current, [field]);
                }
            }
            return current;
        }
        if (ClassEventData.isInstanceOf(obj) || ClassPropertyEvent.isInstanceOf(obj)) {
            let current: NodeInput = obj;
            for (const field of fields) {
                if (ClassEventData.isInstanceOf(current) || ClassPropertyEvent.isInstanceOf(current)) {
                    current = this.resolveClassEventDataField(current, field);
                } else if (ClassInstance.isInstanceOf(current)) {
                    current = this.resolveClassInstanceField(current, field, parent);
                } else if (ClassMetaObject.isInstanceOf(current)) {
                    const value = current.getProperty(field);
                    if (typeof value === 'undefined') {
                        this.context.throwEvalError(`unknown property '${field}' for ${current.kind}.`);
                    }
                    current = value;
                } else {
                    current = Structure.getField(current, [field]);
                }
            }
            return current;
        }
        if (ClassMetaObject.isInstanceOf(obj)) {
            let current: NodeInput = obj;
            for (const field of fields) {
                if (ClassMetaObject.isInstanceOf(current)) {
                    const value = current.getProperty(field);
                    if (typeof value === 'undefined') {
                        this.context.throwEvalError(`unknown property '${field}' for ${current.kind}.`);
                    }
                    current = value;
                } else {
                    current = Structure.getField(current, [field]);
                }
            }
            return current;
        }
        if (ClassDefinition.isInstanceOf(obj)) {
            return this.resolveClassDefinitionMemberChain(obj, fields, scope);
        }
        const result = Structure.getFields(obj, fields);
        if (result.length === 1) {
            return result[0];
        } else if (this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled) {
            return this.valueReturnList(result);
        } else {
            return AST.nodeList(result);
        }
    }

    private resolveClassArrayField(array: MultiArray, field: string, parent: NodeInput, expandCommaList = true): NodeInput {
        const result = new MultiArray(array.dimension);
        for (let n = 0; n < MultiArray.linearLength(array); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(array.dimension[0], array.dimension[1], n);
            const value = array.array[i][j];
            if (!ClassInstance.isInstanceOf(value)) {
                this.context.throwEvalError(`object array field access requires class instance elements.`);
            }
            result.array[i][j] = this.resolveClassInstanceField(value, field, parent);
        }
        MultiArray.setType(result);
        const values = MultiArray.linearize(result);
        if (expandCommaList && (this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled) && !values.every((value) => ClassBoundMethod.isInstanceOf(value))) {
            return this.valueReturnList(values);
        }
        return result;
    }

    private resolveClassFieldChain(value: NodeInput, fields: string[], parent: NodeInput): NodeInput {
        let current = value;
        for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
            const field = fields[fieldIndex];
            const isLastField = fieldIndex === fields.length - 1;
            if (ClassInstance.isInstanceOf(current)) {
                current = this.resolveClassInstanceField(current, field, parent);
            } else if (MultiArray.isInstanceOf(current) && this.hasClassInstanceElement(current)) {
                current = this.resolveClassArrayField(current, field, parent, isLastField);
            } else {
                current = this.resolveStructureLikeField(current, field, isLastField);
            }
        }
        return current;
    }

    /**
     * Evaluate arguments passed to inherited handle pseudo-methods.
     */
    private evaluatedCallArguments(args: ExpressionBoundaryValue[], scope: Scope, prefix: string): NodeInput[] {
        return args.map((arg: NodeExpr, index) => this.evaluatedExpressionValue(arg, scope, `${prefix}${index + 1}`));
    }

    /**
     * Test whether a value is an array containing only class instances.
     */
    private isClassInstanceArray(value: NodeInput): value is MultiArray {
        return MultiArray.isInstanceOf(value) && MultiArray.linearLength(value) > 0 && MultiArray.linearize(value).every(ClassInstance.isInstanceOf);
    }

    /**
     * Test whether a value is an array containing only event listeners.
     */
    private isClassEventListenerArray(value: NodeInput): value is MultiArray {
        return MultiArray.isInstanceOf(value) && MultiArray.linearLength(value) > 0 && MultiArray.linearize(value).every(ClassEventListener.isInstanceOf);
    }

    /**
     * Implement inherited methods supplied by MATLAB's `handle` base class.
     *
     * Classdef method tables contain only user-declared methods. Plain handle
     * subclasses still inherit public operations such as `delete`, `isvalid`,
     * `notify`, and `addlistener`, so dotted calls need a bridge to the same
     * runtime implementations used by the functional forms.
     */
    private inheritedHandleMethodCall(node: NodeIndexExpr, scope: Scope): NodeInput | undefined {
        if (node.delim !== '()' || !AST.isNodeIndirectRef(node.expr) || this.hasQualifiedNameAccessOperand(node.expr, scope)) {
            return undefined;
        }
        const methodRef = node.expr;
        const methodName = methodRef.field[methodRef.field.length - 1];
        if (typeof methodName !== 'string' || !['addlistener', 'delete', 'isvalid', 'notify'].includes(methodName)) {
            return undefined;
        }
        const receiverFields = methodRef.field.slice(0, -1).map((field: string | NodeExpr) => {
            if (typeof field === 'string') {
                return field;
            }
            return this.evaluatedDynamicFieldName(field, scope, `Dynamic structure field names must be strings.`);
        });
        let receiver = this.evaluatedExpressionValue(methodRef.obj, scope, `${methodName} receiver`);
        if (receiverFields.length > 0) {
            receiver = this.resolveDotFieldChain(receiver, receiverFields, methodRef, scope);
        }
        if (ClassEventListener.isInstanceOf(receiver)) {
            switch (methodName) {
                case 'delete':
                    AST.throwInvalidCallError('delete', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    ClassEventListener.delete(receiver);
                    return AST.nodeVoid();
                case 'isvalid':
                    AST.throwInvalidCallError('isvalid', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    return CoreFunctions.isvalid(receiver);
                default:
                    return undefined;
            }
        }
        if (this.isClassEventListenerArray(receiver)) {
            switch (methodName) {
                case 'delete':
                    AST.throwInvalidCallError('delete', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    for (const listener of MultiArray.linearize(receiver)) {
                        if (!ClassEventListener.isInstanceOf(listener)) {
                            this.context.throwEvalError('internal error: event listener array contains a non-listener value.');
                        }
                        ClassEventListener.delete(listener);
                    }
                    return AST.nodeVoid();
                case 'isvalid':
                    AST.throwInvalidCallError('isvalid', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    return CoreFunctions.isvalid(receiver);
                default:
                    return undefined;
            }
        }
        const receiverDefinition = ClassInstance.isInstanceOf(receiver)
            ? receiver.classDefinition
            : this.isClassInstanceArray(receiver)
              ? (MultiArray.linearize(receiver).find(ClassInstance.isInstanceOf) as ClassInstance).classDefinition
              : undefined;
        if (!receiverDefinition?.isHandleClass()) {
            return undefined;
        }
        if (methodName !== 'delete' && receiverDefinition.findMethod(methodName, (item) => !item.isStatic)) {
            return undefined;
        }
        const evaluatedArgs = (): NodeInput[] => this.evaluatedCallArguments(node.args, scope, `${methodName} argument `);
        if (ClassInstance.isInstanceOf(receiver)) {
            switch (methodName) {
                case 'addlistener':
                    return this.addClassListener('addlistener', receiver, ...evaluatedArgs());
                case 'delete':
                    AST.throwInvalidCallError('delete', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    return this.context.deleteClassInstance(receiver, node);
                case 'isvalid':
                    AST.throwInvalidCallError('isvalid', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    return CoreFunctions.isvalid(receiver);
                case 'notify': {
                    const args = evaluatedArgs();
                    AST.throwInvalidCallError('notify', args.length < 1 || args.length > 2, (message) => this.context.throwEvalError(message));
                    return this.notifyClassEvent(receiver, args[0], args[1]);
                }
                default:
                    return undefined;
            }
        }
        if (this.isClassInstanceArray(receiver)) {
            switch (methodName) {
                case 'addlistener':
                    return this.addClassListener('addlistener', receiver, ...evaluatedArgs());
                case 'delete':
                    AST.throwInvalidCallError('delete', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    for (const item of MultiArray.linearize(receiver)) {
                        if (!ClassInstance.isInstanceOf(item)) {
                            this.context.throwEvalError('internal error: object array contains a non-object value.');
                        }
                        this.context.deleteClassInstance(item, node);
                    }
                    return AST.nodeVoid();
                case 'isvalid':
                    AST.throwInvalidCallError('isvalid', node.args.length !== 0, (message) => this.context.throwEvalError(message));
                    return CoreFunctions.isvalid(receiver);
                case 'notify': {
                    const args = evaluatedArgs();
                    AST.throwInvalidCallError('notify', args.length < 1 || args.length > 2, (message) => this.context.throwEvalError(message));
                    return this.notifyClassEvent(receiver, args[0], args[1]);
                }
                default:
                    return undefined;
            }
        }
        return undefined;
    }

    private resolveNestedClassInstanceIndexedField(instance: ClassInstance, fields: string[], descriptor: NativeSubscriptDescriptor, parent: NodeInput): NodeInput {
        const fieldValue = this.resolveClassFieldChain(instance, fields, parent);
        return this.nativeSubscriptScalar(fieldValue, descriptor);
    }

    private resolveClassArrayDescriptorIndexedField(
        array: MultiArray,
        indexList: IndexArgument[],
        fields: string[],
        descriptor: NativeSubscriptDescriptor,
        parent: NodeInput,
        resultDimension?: number[],
    ): NodeInput {
        const selected = MultiArray.getElements(array, '', [], indexList, this);
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const result = new MultiArray(resultDimension ?? selectedArray.dimension);
        const selectedValues = MultiArray.linearize(selectedArray);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field access requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[i][j] = this.resolveNestedClassInstanceIndexedField(instance, fields, descriptor, parent);
        }
        MultiArray.setType(result);
        const values = MultiArray.linearize(result);
        if (values.length === 1) {
            return this.expressionValue(MultiArray.MultiArrayToScalar(result), 'indexed property');
        }
        if ((this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled) && !values.every((value) => ClassBoundMethod.isInstanceOf(value))) {
            return this.valueReturnList(values);
        }
        return result;
    }

    private resolveStructureLikeField(value: NodeInput, field: string, isLastField: boolean): NodeInput {
        if (MultiArray.isInstanceOf(value) && Structure.isStructure(value)) {
            const fields = Structure.getFields(value, [field]);
            return isLastField && fields.length > 1 ? AST.nodeList(this.expressionList(fields, field)) : MultiArray.MultiArrayToScalar(MultiArray.toRowVector(fields));
        }
        return Structure.getField(value, [field]);
    }

    private createSubscriptDescriptor(delimiter: IndexingDelimiterType | '.', args: ExpressionBoundaryValue[], parent: NodeInput, scope: Scope): Structure {
        const subs = new MultiArray([1, args.length]);
        subs.isCell = true;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            subs.array[0][i] = arg.type === ':' ? CharString.create(':') : this.evaluatedExpressionValue(arg, scope, `subscript${i + 1}`);
        }
        MultiArray.setType(subs);
        return new Structure({
            type: CharString.create(delimiter),
            subs,
        });
    }

    private createSubsrefDescriptor(tree: NodeIndexExpr, scope: Scope): Structure {
        return this.createSubscriptDescriptor(tree.delim, tree.args, tree, scope);
    }

    private createDotSubscriptDescriptor(field: string, _parent: NodeInput, _scope: Scope): Structure {
        this.expressionValue(CharString.create(field), 'dot subscript');
        return new Structure({
            type: CharString.create('.'),
            subs: CharString.create(field),
        });
    }

    private createSubscriptDescriptorArray(descriptors: Structure[]): Structure | MultiArray {
        if (descriptors.length === 1) {
            return descriptors[0];
        }
        const result = new MultiArray([1, descriptors.length]);
        for (let i = 0; i < descriptors.length; i++) {
            result.array[0][i] = descriptors[i];
        }
        MultiArray.setType(result);
        return result;
    }

    private numericScalarToNumber(value: NodeInput, message: string): number {
        const scalar = MultiArray.firstElement(value);
        if (!Complex.isInstanceOf(scalar)) {
            this.context.throwEvalError(message);
        }
        return Complex.realToNumber(scalar);
    }

    private callClassInstanceMethodWithOutputCount(
        instance: ClassInstance,
        method: ClassMethodDefinition,
        args: ExpressionBoundaryValue[],
        parent: NodeInput,
        outputCount: number,
        outputMask?: boolean[],
    ): NodeExpr {
        this.context.pushRequestedOutputCount(outputCount);
        if (outputMask) {
            this.context.pushRequestedOutputMask(outputMask);
        }
        try {
            return this.context.callClassInstanceMethod(instance, method, args, parent);
        } finally {
            if (outputMask) {
                this.context.popRequestedOutputMask();
            }
            this.context.popRequestedOutputCount();
        }
    }

    private callClassNumArgumentsFromSubscript(instance: ClassInstance, descriptor: Structure | MultiArray, parent: NodeInput): number | undefined {
        const method = instance.classDefinition.findMethod('numArgumentsFromSubscript', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'numArgumentsFromSubscript' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const result = this.reducedClassMethodResultWithOutputCount(
            instance,
            method,
            this.classMethodArgumentValues([descriptor, CharString.create('subsref')], 'numArgumentsFromSubscript'),
            parent,
            1,
        );
        const count = this.numericScalarToNumber(result, `numArgumentsFromSubscript for class ${instance.classDefinition.name} must return a numeric scalar.`);
        if (!Number.isFinite(count) || !Number.isInteger(count) || count < 0) {
            this.context.throwEvalError(`numArgumentsFromSubscript for class ${instance.classDefinition.name} must return a nonnegative integer scalar.`);
        }
        return count;
    }

    private callClassSubsrefMethod(instance: ClassInstance, method: ClassMethodDefinition, descriptor: Structure | MultiArray, parent: NodeInput): NodeInput {
        const requestedOutputCount = this.context.requestedOutputCount;
        if (requestedOutputCount <= 1) {
            return this.reducedClassMethodResult(instance, method, this.classMethodArgumentValues([descriptor], 'subsref'), parent);
        }

        const maxOutputCount = this.callClassNumArgumentsFromSubscript(instance, descriptor, parent) ?? requestedOutputCount;
        AST.throwErrorIfGreaterThanReturnList(maxOutputCount, requestedOutputCount, (message) => this.context.throwEvalError(message));
        const outputMask = this.context.requestedOutputMask(requestedOutputCount);
        const outputIsRequested = (index: number): boolean => outputMask[index] ?? true;

        return AST.nodeReturnList(
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                const value = evaluated[`out${index}`];
                if (typeof value === 'undefined') {
                    AST.throwErrorIfGreaterThanReturnList(index, index + 1, (message) => this.context.throwEvalError(message));
                }
                return value;
            },
            (length: number): ReturnHandlerResult => {
                AST.throwErrorIfGreaterThanReturnList(maxOutputCount, length, (message) => this.context.throwEvalError(message));
                const result = this.callClassInstanceMethodWithOutputCount(
                    instance,
                    method,
                    this.classMethodArgumentValues([descriptor], 'subsref'),
                    parent,
                    length,
                    outputMask.slice(0, length),
                );
                const out: ReturnHandlerResult = { length };
                if (AST.isNodeReturnList(result)) {
                    const evaluated = result.handler(length);
                    for (let index = 0; index < length; index++) {
                        if (!outputIsRequested(index)) {
                            continue;
                        }
                        out[`out${index}`] = result.selector(evaluated, index);
                    }
                    return out;
                }
                if (length > 1) {
                    AST.throwErrorIfGreaterThanReturnList(1, length, (message) => this.context.throwEvalError(message));
                }
                out.out0 = result;
                return out;
            },
        );
    }

    private callClassSubsref(instance: ClassInstance, tree: NodeIndexExpr, scope: Scope): NodeInput | undefined {
        const method = instance.classDefinition.findMethod('subsref', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsref' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubsrefDescriptor(tree, scope);
        return this.callClassSubsrefMethod(instance, method, descriptor, tree);
    }

    private callClassSubsrefDescriptors(instance: ClassInstance, descriptors: Structure[], parent: NodeInput): NodeInput | undefined {
        const method = instance.classDefinition.findMethod('subsref', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsref' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubscriptDescriptorArray(descriptors);
        return this.callClassSubsrefMethod(instance, method, descriptor, parent);
    }

    private callClassDotSubsref(instance: ClassInstance, field: string, parent: NodeInput, scope: Scope): NodeInput | undefined {
        const method = instance.classDefinition.findMethod('subsref', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsref' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createDotSubscriptDescriptor(field, parent, scope);
        return this.callClassSubsrefMethod(instance, method, descriptor, parent);
    }

    private collectClassSubsrefChain(node: NodeExpr, scope: Scope): { instance: ClassInstance; descriptors: Structure[] } | undefined {
        if (node.type === 'IDX') {
            const base = this.collectClassSubsrefChain(node.expr, scope);
            if (!base) {
                const target = this.evaluatedExpressionValue(node.expr, scope, 'subsref chain receiver');
                if (MultiArray.isInstanceOf(target) && this.hasClassInstanceElement(target)) {
                    const selected = this.reducedIndexingResult(this.context.apply(target, node.args, node));
                    if (ClassInstance.isInstanceOf(selected)) {
                        return { instance: selected, descriptors: [this.createSubsrefDescriptor(node, scope)] };
                    }
                }
                return undefined;
            }
            base.descriptors.push(this.createSubsrefDescriptor(node, scope));
            return base;
        }
        if (node.type === '.') {
            const base = this.collectClassSubsrefChain(node.obj, scope);
            if (!base) {
                return undefined;
            }
            for (const field of node.field) {
                const fieldName = typeof field === 'string' ? field : this.evaluatedDynamicFieldName(field, scope, 'Dynamic structure field names must be strings.');
                base.descriptors.push(this.createDotSubscriptDescriptor(fieldName, node, scope));
            }
            return base;
        }
        const value = this.evaluatedExpressionValue(node, scope, 'subsref chain receiver');
        return ClassInstance.isInstanceOf(value) ? { instance: value, descriptors: [] } : undefined;
    }

    private collectSubsasgnAssignmentTarget(node: NodeExpr, scope: Scope): AssignmentTarget | undefined {
        const collect = (current: NodeExpr): { id: string; descriptors: Structure[] } | undefined => {
            if (AST.isNodeIdentifier(current)) {
                return { id: current.id, descriptors: [] };
            }
            if (AST.isNodeIndexExpr(current)) {
                const base = collect(current.expr);
                if (!base) {
                    return undefined;
                }
                base.descriptors.push(this.createSubscriptDescriptor(current.delim, current.args, current, scope));
                return base;
            }
            if (AST.isNodeIndirectRef(current)) {
                const base = collect(current.obj);
                if (!base) {
                    return undefined;
                }
                for (const field of current.field) {
                    const fieldName =
                        typeof field === 'string'
                            ? field
                            : this.evaluatedDynamicFieldName(field, scope, 'invalid left hand side of assignment: dynamic structure field names must be strings.');
                    base.descriptors.push(this.createDotSubscriptDescriptor(fieldName, current, scope));
                }
                return base;
            }
            return undefined;
        };
        const result = collect(node);
        return result && result.descriptors.length > 0 ? { id: result.id, field: [], descriptors: result.descriptors } : undefined;
    }

    private indexedAssignmentRhs(delimiter: IndexingDelimiterType | undefined, value: NodeInput, target?: NodeInput, wrapCellValue = false): MultiArray {
        if (delimiter === '{}') {
            if (typeof target !== 'undefined' && MultiArray.isInstanceOf(target) && !target.isCell) {
                this.context.throwEvalError('matrix cannot be indexed with {');
            }
            return MultiArray.firstRow([this.runtimeExpressionValue(value, 'cell assignment value')], true);
        }
        if (wrapCellValue) {
            return new MultiArray([1, 1], [[this.runtimeExpressionValue(value, 'cell assignment value')]]);
        }
        if (!wrapCellValue && delimiter === '()' && MultiArray.isInstanceOf(value) && value.isCell) {
            if (typeof target !== 'undefined' && MultiArray.isInstanceOf(target) && !target.isCell) {
                this.context.throwEvalError('cell array assignment requires a cell array target.');
            }
            return value;
        }
        if (delimiter === '()' && MultiArray.isInstanceOf(target) && target.isCell) {
            if (MultiArray.isInstanceOf(value) && !value.isCell && MultiArray.isEmpty(value)) {
                return value;
            }
            if (!MultiArray.isInstanceOf(value) || !value.isCell) {
                this.context.throwEvalError('cell array assignment requires a cell array value.');
            }
            return value;
        }
        return MultiArray.scalarToMultiArray(this.runtimeExpressionValue(value, 'indexed assignment value'));
    }

    private readNativeSubscriptDescriptor(descriptor: Structure, functionName = 'subsasgn'): NativeSubscriptDescriptor {
        const type = descriptor.field.type;
        const subs = descriptor.field.subs;
        if (!CharString.isInstanceOf(type) || (type.str !== '()' && type.str !== '{}' && type.str !== '.')) {
            this.context.throwEvalError(`invalid ${functionName} descriptor.`);
        }
        if (type.str === '.') {
            if (CharString.isInstanceOf(subs)) {
                return {
                    type: '.',
                    subs: [subs],
                };
            }
            if (MultiArray.isInstanceOf(subs) && subs.isCell) {
                const legacySubs = this.descriptorSubscripts(subs);
                if (legacySubs.length === 1 && CharString.isInstanceOf(legacySubs[0])) {
                    return {
                        type: '.',
                        subs: legacySubs,
                    };
                }
            }
            this.context.throwEvalError(`invalid ${functionName} descriptor.`);
        }
        if (!MultiArray.isInstanceOf(subs) || !subs.isCell) {
            this.context.throwEvalError(`invalid ${functionName} descriptor.`);
        }
        return {
            type: type.str as IndexingDelimiterType | '.',
            subs: this.descriptorSubscripts(subs),
        };
    }

    /**
     * Validate subscript descriptor payloads before native indexing consumes them.
     */
    private descriptorSubscripts(subs: MultiArray): ExpressionBoundaryValue[] {
        return MultiArray.linearize(subs).map((subscript, index) => this.expressionValue(subscript, `subscript${index + 1}`));
    }

    /**
     * Normalize a public `substruct` descriptor argument into descriptor
     * structures stored in linear order.
     *
     * @param descriptor Public `substruct` scalar or structure array.
     * @param functionName Built-in name used in diagnostics.
     * @returns Descriptor structures ready for native or class dispatch.
     */
    private subscriptDescriptorStructures(descriptor: NodeInput, functionName: 'subsref' | 'subsasgn'): Structure[] {
        const descriptors = Structure.structureElements(descriptor);
        if (descriptors.length === 0) {
            this.context.throwEvalError(`${functionName}: subscript argument must be a structure array.`);
        }
        descriptors.forEach((item) => this.readNativeSubscriptDescriptor(item, functionName));
        return descriptors;
    }

    /**
     * Apply a public `subsref` descriptor chain to a native runtime value.
     *
     * Intermediate `.` and `{}` descriptors may produce MATLAB/Octave
     * comma-separated lists. When that happens, the following descriptor must
     * be applied to each expanded element instead of reducing the list to its
     * first value.
     *
     * @param target Value being indexed.
     * @param nativeDescriptors Descriptor chain already normalized from a
     * public `substruct` structure array.
     * @returns Referenced value.
     */
    private nativeSubsrefNativeDescriptors(target: NodeInput, nativeDescriptors: NativeSubscriptDescriptor[]): NodeInput {
        let current = target;
        for (let index = 0; index < nativeDescriptors.length; index++) {
            const descriptor = nativeDescriptors[index];
            const isLast = index === nativeDescriptors.length - 1;
            const applyDescriptor = (value: NodeInput): NodeInput => {
                if (
                    descriptor.type === '()' &&
                    (ClassBoundMethod.isInstanceOf(value) ||
                        (MultiArray.isInstanceOf(value) && MultiArray.linearLength(value) > 0 && MultiArray.linearize(value).every(ClassBoundMethod.isInstanceOf)))
                ) {
                    const args = descriptor.subs.map((item, argIndex) => this.expressionValue(item, `subsref method argument ${argIndex + 1}`));
                    return this.context.callClassBoundMethodValue(value, args, AST.nodeIdentifier('subsref'));
                }
                if (descriptor.type === '.') {
                    return this.nativeDotSubsrefResult(value, descriptor);
                }
                if (descriptor.type === '{}') {
                    return this.nativeBraceSubsrefResult(value, descriptor);
                }
                if (isLast && descriptor.type === '()') {
                    return this.nativeParenSubsrefResult(value, descriptor);
                }
                return this.nativeSubscriptScalar(value, descriptor);
            };
            if (AST.isNodeReturnList(current) && current.commaSeparated) {
                current = this.chainedCommaListResult(this.context.expandCommaSeparatedList(current).map((value) => applyDescriptor(value)));
            } else {
                current = applyDescriptor(current);
            }
        }
        return current;
    }

    private nativeSubsrefDescriptors(target: NodeInput, descriptors: Structure[]): NodeInput {
        return this.nativeSubsrefNativeDescriptors(
            target,
            descriptors.map((descriptor) => this.readNativeSubscriptDescriptor(descriptor, 'subsref')),
        );
    }

    /**
     * Apply the final public `.` descriptor and preserve structure-array
     * comma-list results.
     *
     * @param target Structure scalar or array being indexed.
     * @param descriptor Final dot descriptor.
     * @returns A scalar field value or a comma-separated return list.
     */
    private nativeDotSubsrefResult(target: NodeInput, descriptor: NativeSubscriptDescriptor): NodeInput {
        const field = descriptor.subs[0];
        if (!CharString.isInstanceOf(field)) {
            this.context.throwEvalError('invalid subsref descriptor.');
        }
        const values = Structure.getFields(target, [field.str]);
        if (values.length > 1) {
            return this.valueReturnList(values);
        }
        if (values.length === 0) {
            return MultiArray.toRowVector([]);
        }
        return this.expressionValue(values[0], `field ${field.str}`);
    }

    /**
     * Apply the final public `{}` descriptor and preserve comma-list results.
     *
     * @param target Cell array being indexed.
     * @param descriptor Final brace descriptor.
     * @returns A scalar cell content or a comma-separated return list.
     */
    private nativeBraceSubsrefResult(target: NodeInput, descriptor: NativeSubscriptDescriptor): NodeInput {
        if (!MultiArray.isInstanceOf(target) || !target.isCell) {
            this.context.throwEvalError('matrix cannot be indexed with {');
        }
        const selected = MultiArray.getElements(target, '', [], this.nativeDescriptorIndexList(descriptor, target), this);
        const values = MultiArray.linearize(selected);
        if (values.length > 1) {
            return this.valueReturnList(values);
        }
        return this.expressionValue(MultiArray.MultiArrayToScalar(selected), 'indexed value');
    }

    /**
     * Apply the final public `()` descriptor and preserve cell-array
     * parenthesis indexing as a cell array result.
     *
     * @param target Array or character string being indexed.
     * @param descriptor Final parenthesis descriptor.
     * @returns Indexed value, array, cell array, or character string.
     */
    private nativeParenSubsrefResult(target: NodeInput, descriptor: NativeSubscriptDescriptor): NodeInput {
        if (CharString.isInstanceOf(target)) {
            const array = MultiArray.characterVectorFromCharString(target);
            const selected = MultiArray.getElements(array, '', [], this.nativeDescriptorIndexList(descriptor, array), this);
            return MultiArray.charStringFromCharacterVectorResult(selected, target.quote);
        }
        if (!MultiArray.isInstanceOf(target)) {
            this.context.throwEvalError('matrix cannot be indexed with (');
        }
        const selected = MultiArray.getElements(target, '', [], this.nativeDescriptorIndexList(descriptor, target), this);
        if (target.isCell) {
            if (!MultiArray.isInstanceOf(selected)) {
                this.context.throwEvalError('internal error: cell parenthesis indexing did not produce a cell array.');
            }
            selected.isCell = true;
            return selected;
        }
        return this.expressionValue(MultiArray.MultiArrayToScalar(selected), 'indexed value');
    }

    private numericCodeToCharString(value: ComplexType, quote: CharString['quote'] = '"'): CharString {
        if (Complex.imagToNumber(value) !== 0) {
            this.context.throwEvalError('character string assignment requires real character codes.');
        }
        return CharString.fromNumericCode(Complex.realToNumber(value), quote);
    }

    private charStringAssignmentElement(value: NodeInput, quote: CharString['quote'] = '"'): CharString {
        if (CharString.isInstanceOf(value)) {
            return value;
        }
        if (Complex.isInstanceOf(value)) {
            return this.numericCodeToCharString(value, quote);
        }
        this.context.throwEvalError('character string assignment requires character or numeric values.');
    }

    private charStringAssignmentRhs(value: NodeInput, quote: CharString['quote'] = '"'): MultiArray {
        if (CharString.isInstanceOf(value)) {
            return MultiArray.characterVectorFromCharString(value);
        }
        if (MultiArray.isInstanceOf(value) && !value.isCell) {
            const result = new MultiArray(value.dimension);
            for (let n = 0; n < MultiArray.linearLength(value); n++) {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(value.dimension[0], value.dimension[1], n);
                result.array[i][j] = this.charStringAssignmentElement(value.array[i][j], quote);
            }
            MultiArray.setType(result);
            return result;
        }
        return MultiArray.scalarToMultiArray(this.charStringAssignmentElement(value, quote));
    }

    /**
     * Select a scalar class instance from an object array using the first
     * public subscript descriptor.
     *
     * @param target Candidate object array.
     * @param descriptors Public descriptor chain.
     * @returns Selected scalar object when the first descriptor selects one.
     */
    private publicObjectArraySubscriptTarget(target: NodeInput, descriptors: Structure[]): ClassInstance | undefined {
        if (!MultiArray.isInstanceOf(target) || !this.hasClassInstanceElement(target) || descriptors.length === 0) {
            return undefined;
        }
        const firstDescriptor = this.readNativeSubscriptDescriptor(descriptors[0]);
        if (firstDescriptor.type === '.') {
            return undefined;
        }
        const selected = this.singleOutputNativeSubscriptScalar(target, firstDescriptor);
        return ClassInstance.isInstanceOf(selected) ? selected : undefined;
    }

    /**
     * Apply one native descriptor for an internal selection probe.
     *
     * These probes only decide whether a public descriptor chain should route
     * to class overloads. They must not inherit the caller's multi-output
     * request, because helper calls such as `subsindex` are scalar protocols.
     */
    private singleOutputNativeSubscriptScalar(target: NodeInput, descriptor: NativeSubscriptDescriptor): NodeInput {
        this.context.pushRequestedOutputCount(1);
        try {
            return this.reducedIndexingResult(this.nativeSubscriptScalar(target, descriptor));
        } finally {
            this.context.popRequestedOutputCount();
        }
    }

    /**
     * Select a scalar class instance from cell-content public descriptors.
     *
     * A public descriptor chain may reach an object through `C{i}.field` or
     * through a selected sub-cell such as `C(idx){j}.field`. The cell indexing
     * belongs to the container, so any class overload receives only the
     * remaining object descriptors while assignment later reinserts the updated
     * object into the original cell shape.
     */
    private publicCellContentSubscriptSelection(
        target: NodeInput,
        descriptors: Structure[],
    ):
        | {
              instance: ClassInstance;
              objectDescriptors: Structure[];
              contentDescriptor: NativeSubscriptDescriptor;
              outerDescriptor?: NativeSubscriptDescriptor;
              selectedCell?: MultiArray;
          }
        | undefined {
        if (!MultiArray.isInstanceOf(target) || !target.isCell || descriptors.length === 0) {
            return undefined;
        }
        const firstDescriptor = this.readNativeSubscriptDescriptor(descriptors[0]);
        if (firstDescriptor.type === '{}') {
            const selected = this.singleOutputNativeSubscriptScalar(target, firstDescriptor);
            return ClassInstance.isInstanceOf(selected)
                ? {
                      instance: selected,
                      objectDescriptors: descriptors.slice(1),
                      contentDescriptor: firstDescriptor,
                  }
                : undefined;
        }
        if (firstDescriptor.type !== '()' || descriptors.length < 2) {
            return undefined;
        }
        const secondDescriptor = this.readNativeSubscriptDescriptor(descriptors[1]);
        if (secondDescriptor.type !== '{}') {
            return undefined;
        }
        const selectedCell = this.nativeParenSubsrefResult(target, firstDescriptor);
        if (!MultiArray.isInstanceOf(selectedCell) || !selectedCell.isCell) {
            return undefined;
        }
        const selected = this.singleOutputNativeSubscriptScalar(selectedCell, secondDescriptor);
        return ClassInstance.isInstanceOf(selected)
            ? {
                  instance: selected,
                  objectDescriptors: descriptors.slice(2),
                  contentDescriptor: secondDescriptor,
                  outerDescriptor: firstDescriptor,
                  selectedCell,
              }
            : undefined;
    }

    private dotDescriptorFieldChain(descriptors: NativeSubscriptDescriptor[], functionName: 'subsref' | 'subsasgn' = 'subsasgn'): string[] | undefined {
        const fields: string[] = [];
        for (const descriptor of descriptors) {
            if (descriptor.type !== '.') {
                return undefined;
            }
            const field = descriptor.subs[0];
            if (!CharString.isInstanceOf(field)) {
                this.context.throwEvalError(`invalid ${functionName} descriptor.`);
            }
            fields.push(field.str);
        }
        return fields;
    }

    private classPropertyDescriptorChain(descriptors: NativeSubscriptDescriptor[], functionName: 'subsref' | 'subsasgn'): ClassPropertyDescriptorChain | undefined {
        const chain: ClassPropertyDescriptorChain = { fields: [] };
        let index = 0;
        if (descriptors[0]?.type === '()') {
            chain.leadingIndex = descriptors[0];
            index = 1;
        } else if (descriptors[0]?.type === '{}') {
            return undefined;
        }
        for (; index < descriptors.length; index++) {
            const descriptor = descriptors[index];
            if (descriptor.type !== '.') {
                break;
            }
            const field = descriptor.subs[0];
            if (!CharString.isInstanceOf(field)) {
                this.context.throwEvalError(`invalid ${functionName} descriptor.`);
            }
            chain.fields.push(field.str);
        }
        if (chain.fields.length === 0) {
            return undefined;
        }
        if (index < descriptors.length) {
            if (index !== descriptors.length - 1 || descriptors[index].type === '.') {
                return undefined;
            }
            chain.finalIndex = descriptors[index];
        }
        return chain;
    }

    private classPropertyDescriptorPath(descriptors: NativeSubscriptDescriptor[], functionName: 'subsref' | 'subsasgn'): ClassPropertyDescriptorChain | undefined {
        const chain: ClassPropertyDescriptorChain = { fields: [] };
        let index = 0;
        if (descriptors[0]?.type === '()') {
            chain.leadingIndex = descriptors[0];
            index = 1;
        } else if (descriptors[0]?.type === '{}') {
            return undefined;
        }
        for (; index < descriptors.length && descriptors[index].type === '.'; index++) {
            const field = descriptors[index].subs[0];
            if (!CharString.isInstanceOf(field)) {
                this.context.throwEvalError(`invalid ${functionName} descriptor.`);
            }
            chain.fields.push(field.str);
        }
        if (chain.fields.length === 0) {
            return undefined;
        }
        chain.tailDescriptors = descriptors.slice(index);
        if (chain.tailDescriptors.length === 1) {
            chain.finalIndex = chain.tailDescriptors[0];
        }
        return chain;
    }

    private indexedClassPropertyValue(target: NodeInput, descriptor: NativeSubscriptDescriptor, value: NodeInput): NodeInput {
        if (!MultiArray.isInstanceOf(target)) {
            this.context.throwEvalError(`matrix cannot be indexed with ${descriptor.type[0]}`);
        }
        return this.setNativeIndexedValue(target, descriptor, value);
    }

    private assignNestedClassInstanceIndexedField(
        instance: ClassInstance,
        field: string[],
        descriptor: NativeSubscriptDescriptor,
        value: NodeInput,
        parent: NodeInput,
        scope: Scope,
    ): ClassInstance {
        const fieldValue = this.resolveClassFieldChain(instance, field, parent);
        const updatedField = this.indexedClassPropertyValue(fieldValue, descriptor, value);
        return this.assignNestedClassInstanceField(instance, field, updatedField, parent, scope);
    }

    private resolveClassSubsrefDescriptors(target: NodeInput, descriptors: NativeSubscriptDescriptor[], parent: NodeInput): NodeInput | undefined {
        const chain = this.classPropertyDescriptorPath(descriptors, 'subsref');
        if (ClassInstance.isInstanceOf(target)) {
            if (!chain || chain.leadingIndex) {
                return undefined;
            }
            const fieldValue = this.resolveClassFieldChain(target, chain.fields, parent);
            return chain.tailDescriptors && chain.tailDescriptors.length > 0 ? this.nativeSubsrefNativeDescriptors(fieldValue, chain.tailDescriptors) : fieldValue;
        }
        if (!chain || !MultiArray.isInstanceOf(target) || !this.hasClassInstanceElement(target) || descriptors.length === 0) {
            return undefined;
        }
        if (chain.leadingIndex) {
            const indexList = this.nativeDescriptorIndexList(chain.leadingIndex, target);
            return this.resolveClassArrayPropertyPath(target, indexList, chain, parent);
        }
        return this.resolveClassArrayPropertyPath(target, [MultiArray.expandColon(MultiArray.linearLength(target))], chain, parent, target.dimension);
    }

    private assignClassArrayDescriptorIndexedField(
        array: MultiArray,
        indexList: IndexArgument[],
        field: string[],
        descriptor: NativeSubscriptDescriptor,
        value: NodeInput,
        parent: NodeInput,
        scope: Scope,
    ): MultiArray {
        const result = MultiArray.copy(array);
        const selected = MultiArray.getElements(result, '', [], indexList);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = selectedValues.length === 1 ? [value] : this.assignmentValues(value, 'assignment');
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignNestedClassInstanceIndexedField(instance, field, descriptor, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        const tempScope = Scope.create();
        tempScope.defineName('__object_array_subsasgn__', result);
        MultiArray.setElements(tempScope, '__object_array_subsasgn__', [], indexList, updated, undefined, this);
        return this.scopedMultiArrayValue(tempScope, '__object_array_subsasgn__', 'object array assignment result');
    }

    private resolveClassArrayPropertyPath(array: MultiArray, indexList: IndexArgument[], chain: ClassPropertyDescriptorChain, parent: NodeInput, resultDimension?: number[]): NodeInput {
        const selected = MultiArray.getElements(array, '', [], indexList, this);
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const selectedValues = MultiArray.linearize(selectedArray);
        const readInstance = (instance: NodeInput, forceSingleOutput: boolean): NodeInput => {
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed property access requires class instance elements.`);
            }
            if (forceSingleOutput) {
                this.context.pushRequestedOutputCount(1);
            }
            try {
                const fieldValue = this.resolveClassFieldChain(instance, chain.fields, parent);
                return chain.tailDescriptors && chain.tailDescriptors.length > 0 ? this.nativeSubsrefNativeDescriptors(fieldValue, chain.tailDescriptors) : fieldValue;
            } finally {
                if (forceSingleOutput) {
                    this.context.popRequestedOutputCount();
                }
            }
        };
        if (selectedValues.length === 1 && !resultDimension) {
            return readInstance(selectedValues[0], false);
        }
        const result = new MultiArray(resultDimension ?? selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[i][j] = readInstance(selectedValues[n], true);
        }
        MultiArray.setType(result);
        const values = MultiArray.linearize(result);
        if (values.length === 1) {
            return this.expressionValue(MultiArray.MultiArrayToScalar(result), 'indexed property');
        }
        if ((this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled) && !values.every((value) => ClassBoundMethod.isInstanceOf(value))) {
            return this.valueReturnList(values);
        }
        return result;
    }

    private resolveClassCellContentPropertyPath(cellArray: MultiArray, descriptor: NativeSubscriptDescriptor, chain: ClassPropertyDescriptorChain, parent: NodeInput): NodeInput {
        const selected = MultiArray.getElements(cellArray, '', [], this.nativeDescriptorIndexList(descriptor, cellArray), this);
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const selectedValues = MultiArray.linearize(selectedArray);
        const readInstance = (instance: NodeInput, forceSingleOutput: boolean): NodeInput => {
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`cell content property access requires class instance elements.`);
            }
            if (forceSingleOutput) {
                this.context.pushRequestedOutputCount(1);
            }
            try {
                const fieldValue = this.resolveClassFieldChain(instance, chain.fields, parent);
                return chain.tailDescriptors && chain.tailDescriptors.length > 0 ? this.nativeSubsrefNativeDescriptors(fieldValue, chain.tailDescriptors) : fieldValue;
            } finally {
                if (forceSingleOutput) {
                    this.context.popRequestedOutputCount();
                }
            }
        };
        if (selectedValues.length === 1) {
            return readInstance(selectedValues[0], false);
        }
        const result = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(result.dimension[0], result.dimension[1], n);
            result.array[i][j] = readInstance(selectedValues[n], true);
        }
        MultiArray.setType(result);
        const values = MultiArray.linearize(result);
        return this.context.requestedOutputCount > 1 || this.context.commaListExpansionEnabled ? this.valueReturnList(values) : result;
    }

    /**
     * Test whether a cell-content descriptor selects only class instances.
     *
     * Public `subsref/subsasgn` for cells must leave structures and other native
     * values to the native descriptor path. The class shortcut is valid only for
     * cell contents that are actually objects.
     */
    private selectedCellContentsAreClassInstances(cellArray: MultiArray, descriptor: NativeSubscriptDescriptor): boolean {
        this.context.pushRequestedOutputCount(1);
        try {
            const selected = MultiArray.getElements(cellArray, '', [], this.nativeDescriptorIndexList(descriptor, cellArray), this);
            const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
            return MultiArray.linearize(selectedArray).every((value) => ClassInstance.isInstanceOf(value));
        } finally {
            this.context.popRequestedOutputCount();
        }
    }

    private assignClassInstancePropertyPath(instance: ClassInstance, chain: ClassPropertyDescriptorChain, value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance {
        if (!chain.tailDescriptors || chain.tailDescriptors.length === 0) {
            return this.assignNestedClassInstanceField(instance, chain.fields, value, parent, scope);
        }
        const fieldValue = this.resolveClassFieldChain(instance, chain.fields, parent);
        const updatedField = this.assignNativeSubsasgnNativeDescriptors(fieldValue, chain.tailDescriptors, value);
        return this.assignNestedClassInstanceField(instance, chain.fields, updatedField, parent, scope);
    }

    private assignClassArrayPropertyPath(array: MultiArray, indexList: IndexArgument[], chain: ClassPropertyDescriptorChain, value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        const result = MultiArray.copy(array);
        const selected = MultiArray.getElements(result, '', [], indexList);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = this.classPropertyPathAssignmentValues(value, selectedValues.length, chain);
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`object array indexed field assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignClassInstancePropertyPath(instance, chain, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        const tempScope = Scope.create();
        tempScope.defineName('__object_array_subsasgn__', result);
        MultiArray.setElements(tempScope, '__object_array_subsasgn__', [], indexList, updated, undefined, this);
        return this.scopedMultiArrayValue(tempScope, '__object_array_subsasgn__', 'object array assignment result');
    }

    private assignClassCellContentPropertyPath(
        cellArray: MultiArray,
        descriptor: NativeSubscriptDescriptor,
        chain: ClassPropertyDescriptorChain,
        value: NodeInput,
        parent: NodeInput,
        scope: Scope,
    ): MultiArray {
        const result = MultiArray.copy(cellArray);
        const indexList = this.nativeDescriptorIndexList(descriptor, result);
        const selected = MultiArray.getElements(result, '', [], indexList);
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(this.expressionValue(selected, 'selection'));
        const selectedValues = MultiArray.linearize(selectedArray).map((item, index) => this.expressionValue(item, `selection${index + 1}`));
        const values = this.classPropertyPathAssignmentValues(value, selectedValues.length, chain);
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const updated = new MultiArray(selectedArray.dimension);
        for (let n = 0; n < selectedValues.length; n++) {
            const instance = selectedValues[n];
            if (!ClassInstance.isInstanceOf(instance)) {
                this.context.throwEvalError(`cell content property assignment requires class instance elements.`);
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(updated.dimension[0], updated.dimension[1], n);
            updated.array[i][j] = this.assignClassInstancePropertyPath(instance, chain, values.length === 1 ? values[0] : values[n], parent, scope);
        }
        MultiArray.setType(updated);
        const replacement = selectedValues.length === 1 ? this.expressionValue(MultiArray.MultiArrayToScalar(updated), 'cell object assignment value') : updated;
        const assigned = this.setNativeIndexedValue(result, descriptor, replacement);
        if (!MultiArray.isInstanceOf(assigned)) {
            this.context.throwEvalError('internal error: cell object assignment result is not an array.');
        }
        return assigned;
    }

    private assignClassSubsasgnDescriptors(target: NodeInput, descriptors: NativeSubscriptDescriptor[], value: NodeInput, parent: NodeInput): NodeInput | undefined {
        const scope = this.context.currentScope;
        if (MultiArray.isInstanceOf(target) && target.isCell && descriptors[0]?.type === '{}') {
            const chain = this.classPropertyDescriptorPath(descriptors.slice(1), 'subsasgn');
            if (chain && !chain.leadingIndex && this.selectedCellContentsAreClassInstances(target, descriptors[0])) {
                return this.assignClassCellContentPropertyPath(target, descriptors[0], chain, value, parent, scope);
            }
        }
        if (MultiArray.isInstanceOf(target) && target.isCell && descriptors[0]?.type === '()' && descriptors[1]?.type === '{}') {
            const selected = this.nativeParenSubsrefResult(target, descriptors[0]);
            if (MultiArray.isInstanceOf(selected) && selected.isCell) {
                const chain = this.classPropertyDescriptorPath(descriptors.slice(2), 'subsasgn');
                if (chain && !chain.leadingIndex && this.selectedCellContentsAreClassInstances(selected, descriptors[1])) {
                    const updatedSelected = this.assignClassCellContentPropertyPath(selected, descriptors[1], chain, value, parent, scope);
                    return this.setNativeIndexedValue(target, descriptors[0], updatedSelected);
                }
            }
        }
        const chain = this.classPropertyDescriptorPath(descriptors, 'subsasgn');
        if (ClassInstance.isInstanceOf(target)) {
            if (!chain || chain.leadingIndex) {
                return undefined;
            }
            return this.assignClassInstancePropertyPath(ClassInstance.copy(target), chain, value, parent, scope);
        }
        if (!chain || !MultiArray.isInstanceOf(target) || !this.hasClassInstanceElement(target)) {
            return undefined;
        }
        if (chain.leadingIndex) {
            const indexList = this.nativeDescriptorIndexList(chain.leadingIndex, target);
            return this.assignClassArrayPropertyPath(target, indexList, chain, value, parent, scope);
        }
        return this.assignClassArrayPropertyPath(target, [MultiArray.expandColon(MultiArray.linearLength(target))], chain, value, parent, scope);
    }

    private resolveClassCellSubsrefDescriptors(target: NodeInput, descriptors: NativeSubscriptDescriptor[], parent: NodeInput): NodeInput | undefined {
        if (!MultiArray.isInstanceOf(target) || !target.isCell || descriptors[0]?.type !== '{}') {
            if (MultiArray.isInstanceOf(target) && target.isCell && descriptors[0]?.type === '()' && descriptors[1]?.type === '{}') {
                const selected = this.nativeParenSubsrefResult(target, descriptors[0]);
                if (MultiArray.isInstanceOf(selected) && selected.isCell) {
                    const chain = this.classPropertyDescriptorPath(descriptors.slice(2), 'subsref');
                    if (chain && !chain.leadingIndex && this.selectedCellContentsAreClassInstances(selected, descriptors[1])) {
                        return this.resolveClassCellContentPropertyPath(selected, descriptors[1], chain, parent);
                    }
                }
            }
            return undefined;
        }
        const chain = this.classPropertyDescriptorPath(descriptors.slice(1), 'subsref');
        if (!chain || chain.leadingIndex) {
            return undefined;
        }
        if (!this.selectedCellContentsAreClassInstances(target, descriptors[0])) {
            return undefined;
        }
        return this.resolveClassCellContentPropertyPath(target, descriptors[0], chain, parent);
    }

    /**
     * Public `subsref` built-in implementation.
     *
     * @param target Value being indexed.
     * @param descriptor Public `substruct` descriptor scalar or array.
     * @returns Referenced value, or a class overload result.
     */
    private subsrefResult(target: NodeInput, descriptor: NodeInput): NodeInput {
        const descriptors = this.subscriptDescriptorStructures(descriptor, 'subsref');
        const nativeDescriptors = descriptors.map((item) => this.readNativeSubscriptDescriptor(item, 'subsref'));
        if (ClassInstance.isInstanceOf(target)) {
            const overloaded = this.callClassSubsrefDescriptors(target, descriptors, AST.nodeIdentifier('subsref'));
            if (typeof overloaded !== 'undefined') {
                return overloaded;
            }
            const resolved = this.resolveClassSubsrefDescriptors(target, nativeDescriptors, AST.nodeIdentifier('subsref'));
            if (typeof resolved !== 'undefined') {
                return resolved;
            }
        }
        const selectedObject = this.publicObjectArraySubscriptTarget(target, descriptors);
        if (selectedObject) {
            const overloaded = this.callClassSubsrefDescriptors(selectedObject, descriptors, AST.nodeIdentifier('subsref'));
            if (typeof overloaded !== 'undefined') {
                return overloaded;
            }
        }
        const selectedCellObject = this.publicCellContentSubscriptSelection(target, descriptors);
        if (selectedCellObject && selectedCellObject.objectDescriptors.length > 0) {
            const overloaded = this.callClassSubsrefDescriptors(selectedCellObject.instance, selectedCellObject.objectDescriptors, AST.nodeIdentifier('subsref'));
            if (typeof overloaded !== 'undefined') {
                return overloaded;
            }
        }
        const resolved = this.resolveClassSubsrefDescriptors(target, nativeDescriptors, AST.nodeIdentifier('subsref'));
        if (typeof resolved !== 'undefined') {
            return resolved;
        }
        const resolvedCellContent = this.resolveClassCellSubsrefDescriptors(target, nativeDescriptors, AST.nodeIdentifier('subsref'));
        if (typeof resolvedCellContent !== 'undefined') {
            return resolvedCellContent;
        }
        return this.nativeSubsrefDescriptors(target, descriptors);
    }

    /**
     * Public `subsasgn` built-in implementation.
     *
     * @param target Value being assigned into.
     * @param descriptor Public `substruct` descriptor scalar or array.
     * @param value Value to store.
     * @returns Updated value.
     */
    private subsasgnResult(target: NodeInput, descriptor: NodeInput, value: NodeInput): NodeInput {
        const descriptors = this.subscriptDescriptorStructures(descriptor, 'subsasgn');
        const nativeDescriptors = descriptors.map((item) => this.readNativeSubscriptDescriptor(item, 'subsasgn'));
        if (ClassInstance.isInstanceOf(target)) {
            const overloaded = this.callClassSubsasgnDescriptors(target, descriptors, value, AST.nodeIdentifier('subsasgn'));
            if (typeof overloaded !== 'undefined') {
                return overloaded;
            }
            const assigned = this.assignClassSubsasgnDescriptors(target, nativeDescriptors, value, AST.nodeIdentifier('subsasgn'));
            if (typeof assigned !== 'undefined') {
                return assigned;
            }
        }
        const selectedObject = this.publicObjectArraySubscriptTarget(target, descriptors);
        if (selectedObject) {
            const overloaded = this.callClassSubsasgnDescriptors(selectedObject, descriptors, value, AST.nodeIdentifier('subsasgn'));
            if (typeof overloaded !== 'undefined') {
                if (!MultiArray.isInstanceOf(target)) {
                    this.context.throwEvalError('internal error: object-array subsasgn target is not an array.');
                }
                return this.setNativeIndexedValue(target, this.readNativeSubscriptDescriptor(descriptors[0]), overloaded);
            }
        }
        const selectedCellObject = this.publicCellContentSubscriptSelection(target, descriptors);
        if (selectedCellObject && selectedCellObject.objectDescriptors.length > 0) {
            const overloaded = this.callClassSubsasgnDescriptors(selectedCellObject.instance, selectedCellObject.objectDescriptors, value, AST.nodeIdentifier('subsasgn'));
            if (typeof overloaded !== 'undefined') {
                if (!MultiArray.isInstanceOf(target)) {
                    this.context.throwEvalError('internal error: cell-object subsasgn target is not an array.');
                }
                if (selectedCellObject.outerDescriptor && selectedCellObject.selectedCell) {
                    const updatedSelectedCell = this.setNativeIndexedValue(selectedCellObject.selectedCell, selectedCellObject.contentDescriptor, overloaded);
                    if (!MultiArray.isInstanceOf(updatedSelectedCell) || !updatedSelectedCell.isCell) {
                        this.context.throwEvalError('internal error: selected cell-object subsasgn result is not a cell array.');
                    }
                    return this.setNativeIndexedValue(target, selectedCellObject.outerDescriptor, updatedSelectedCell);
                }
                return this.setNativeIndexedValue(target, selectedCellObject.contentDescriptor, overloaded);
            }
        }
        const assigned = this.assignClassSubsasgnDescriptors(target, nativeDescriptors, value, AST.nodeIdentifier('subsasgn'));
        if (typeof assigned !== 'undefined') {
            return assigned;
        }
        return this.assignNativeSubsasgnDescriptors(target, descriptors, value);
    }

    private nativeDescriptorIndexList(descriptor: NativeSubscriptDescriptor, target: MultiArray): IndexArgument[] {
        return descriptor.subs.map((subscript, index) => {
            if (CharString.isInstanceOf(subscript) && subscript.str === ':') {
                return descriptor.subs.length === 1 ? MultiArray.expandColon(MultiArray.linearLength(target)) : MultiArray.expandColon(MultiArray.getDimension(target, index));
            }
            const converted = this.convertIndexArgument(subscript, AST.nodeIdentifier('subsindex'));
            if (!MultiArray.isIndexArgument(converted)) {
                this.context.throwEvalError(`subscript${index + 1}: invalid subscript type.`);
            }
            return converted;
        });
    }

    private nativeSubscriptScalar(target: NodeInput, descriptor: NativeSubscriptDescriptor): NodeInput {
        if (descriptor.type === '.') {
            const field = descriptor.subs[0];
            if (!CharString.isInstanceOf(field)) {
                this.context.throwEvalError('invalid subsasgn descriptor.');
            }
            return this.expressionValue(Structure.getField(target, [field.str]), `field ${field.str}`);
        }
        if (CharString.isInstanceOf(target)) {
            if (descriptor.type === '{}') {
                this.context.throwEvalError('matrix cannot be indexed with {');
            }
            const array = MultiArray.characterVectorFromCharString(target);
            const selected = MultiArray.getElements(array, '', [], this.nativeDescriptorIndexList(descriptor, array), this);
            return MultiArray.charStringFromCharacterVectorResult(selected, target.quote);
        }
        if (!MultiArray.isInstanceOf(target)) {
            this.context.throwEvalError(`matrix cannot be indexed with ${descriptor.type[0]}`);
        }
        if (descriptor.type === '{}' && !target.isCell) {
            this.context.throwEvalError('matrix cannot be indexed with {');
        }
        const indices = this.nativeDescriptorIndexList(descriptor, target);
        const selected = MultiArray.getElements(target, '', [], indices, this);
        if (descriptor.type === '()' && target.isCell) {
            if (!MultiArray.isInstanceOf(selected)) {
                this.context.throwEvalError('internal error: cell parenthesis indexing did not produce a cell array.');
            }
            selected.isCell = true;
            return selected;
        }
        return this.expressionValue(MultiArray.MultiArrayToScalar(selected), 'indexed value');
    }

    /** Validate one `getfield`/`setfield` field-name argument. */
    private fieldAccessNameArgument(value: NodeInput, functionName: 'getfield' | 'setfield', argumentIndex: number): string {
        const expression = this.expressionValue(value, `${functionName} argument ${argumentIndex}`);
        if (!CharString.isInstanceOf(expression)) {
            this.context.throwEvalError(`${functionName}: argument ${argumentIndex} must be a string.`);
        }
        return expression.str;
    }

    /**
     * Build native descriptors for MATLAB/Octave `getfield`/`setfield` forms.
     *
     * Field names become dot descriptors, while cell-array arguments become
     * parenthesis descriptors selecting structure elements or field elements.
     */
    private fieldAccessDescriptors(args: NodeInput[], functionName: 'getfield' | 'setfield'): NativeSubscriptDescriptor[] {
        const descriptors: NativeSubscriptDescriptor[] = [];
        let sawField = false;
        let index = 0;
        const isIndexCell = (value: NodeInput): value is MultiArray => MultiArray.isInstanceOf(value) && value.isCell;
        const appendIndex = (value: MultiArray): void => {
            descriptors.push({ type: '()', subs: this.descriptorSubscripts(value) });
        };
        if (args.length > 0 && isIndexCell(args[0])) {
            appendIndex(args[0]);
            index = 1;
        }
        while (index < args.length) {
            if (isIndexCell(args[index])) {
                this.context.throwEvalError(`${functionName}: argument ${index + 2} must be a string.`);
            }
            const field = this.fieldAccessNameArgument(args[index], functionName, index + 2);
            descriptors.push({ type: '.', subs: [CharString.create(field)] });
            sawField = true;
            index++;
            if (index < args.length && isIndexCell(args[index])) {
                appendIndex(args[index]);
                index++;
            }
        }
        if (!sawField) {
            AST.throwInvalidCallError(functionName, true);
        }
        return descriptors;
    }

    /**
     * Insert MATLAB's default first-element structure index for `getfield` and
     * `setfield` calls on nonscalar structure arrays when no explicit leading
     * index was supplied.
     */
    private defaultStructureArrayFieldIndex(target: NodeInput, descriptors: NativeSubscriptDescriptor[]): NativeSubscriptDescriptor[] {
        if (descriptors[0]?.type === '.' && MultiArray.isInstanceOf(target) && Structure.isStructure(target) && !MultiArray.isEmpty(target) && MultiArray.linearLength(target) > 1) {
            return [{ type: '()', subs: [Complex.one()] }, ...descriptors];
        }
        return descriptors;
    }

    /** Interpreter-aware `getfield` implementation supporting indexed forms. */
    private getfieldResult(target: NodeInput, args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('getfield', !(typeof target !== 'undefined' && args.length > 0 && Structure.isStructure(target)));
        const descriptors = this.defaultStructureArrayFieldIndex(target, this.fieldAccessDescriptors(args, 'getfield'));
        return this.nativeSubsrefNativeDescriptors(target, descriptors);
    }

    /** Interpreter-aware `setfield` implementation supporting indexed forms. */
    private setfieldResult(target: NodeInput, args: NodeInput[]): NodeInput {
        AST.throwInvalidCallError('setfield', !(typeof target !== 'undefined' && args.length >= 2 && Structure.isStructure(target)));
        const descriptors = this.defaultStructureArrayFieldIndex(target, this.fieldAccessDescriptors(args.slice(0, -1), 'setfield'));
        return this.assignNativeSubsasgnNativeDescriptors(target, descriptors, args[args.length - 1]);
    }

    /**
     * Complete values assigned into an indexed empty structure array with that
     * array's known schema. This keeps `S(1).field = value` from losing other
     * fields declared by `struct("a", {}, "b", {})`.
     */
    private emptyStructureSchemaAssignmentValue(target: MultiArray, value: NodeInput): NodeInput {
        if (!MultiArray.isEmpty(target) || !Structure.isStructure(target)) {
            return value;
        }
        const schema = Structure.fieldNames(target);
        if (schema.length === 0) {
            return value;
        }
        const fillMissingFields = (structure: Structure): void => {
            schema.forEach((field) => {
                if (!RuntimeValue.hasOwnField(structure.field, field)) {
                    structure.field[field] = MultiArray.emptyArray();
                }
            });
        };
        if (Structure.isInstanceOf(value)) {
            const result = Structure.copy(value);
            fillMissingFields(result);
            return result;
        }
        if (MultiArray.isInstanceOf(value) && Structure.isStructure(value)) {
            const result = MultiArray.copy(value);
            Structure.structureElements(result).forEach(fillMissingFields);
            return result;
        }
        return value;
    }

    /** Ensure every element of a structure array has the same top-level fields. */
    private normalizeStructureArrayFields(value: NodeInput): void {
        if (!MultiArray.isInstanceOf(value) || !Structure.isStructure(value)) {
            return;
        }
        const elements = Structure.structureElements(value);
        if (elements.length <= 1) {
            return;
        }
        const fields = [...new Set(elements.flatMap((structure) => Object.keys(structure.field)))].sort();
        fields.forEach((field) => Structure.setEmptyField(value, field));
    }

    private setNativeIndexedValue(target: MultiArray | CharString, descriptor: NativeSubscriptDescriptor, value: NodeInput): NodeInput {
        if (CharString.isInstanceOf(target)) {
            if (descriptor.type === '{}') {
                this.context.throwEvalError('matrix cannot be indexed with {');
            }
            const result = MultiArray.characterVectorFromCharString(target);
            const tempScope = Scope.create();
            tempScope.defineName('__subsasgn__', result);
            MultiArray.setElements(tempScope, '__subsasgn__', [], this.nativeDescriptorIndexList(descriptor, result), this.charStringAssignmentRhs(value, target.quote), undefined, this);
            return MultiArray.charStringFromCharacterVectorResult(this.scopedExpressionValue(tempScope, '__subsasgn__', 'character assignment result'), target.quote);
        }
        if (descriptor.type === '{}' && !target.isCell) {
            this.context.throwEvalError('matrix cannot be indexed with {');
        }
        const result = MultiArray.copy(target);
        const schemaAwareValue = descriptor.type === '()' ? this.emptyStructureSchemaAssignmentValue(target, value) : value;
        let right = this.indexedAssignmentRhs(descriptor.type as IndexingDelimiterType, schemaAwareValue, result);
        if (descriptor.type === '{}' && MultiArray.isInstanceOf(value) && !value.isCell) {
            try {
                const selectedCount = MultiArray.linearize(MultiArray.getElements(result, '', [], this.nativeDescriptorIndexList(descriptor, result), this)).length;
                if (selectedCount > 1 && selectedCount === MultiArray.linearLength(value)) {
                    right = MultiArray.firstRow(MultiArray.linearize(value), true);
                }
            } catch {
                right = this.indexedAssignmentRhs(descriptor.type as IndexingDelimiterType, value, result);
            }
        }
        const tempScope = Scope.create();
        tempScope.defineName('__subsasgn__', result);
        MultiArray.setElements(tempScope, '__subsasgn__', [], this.nativeDescriptorIndexList(descriptor, result), right, undefined, this);
        const assigned = this.scopedMultiArrayValue(tempScope, '__subsasgn__', 'indexed assignment result');
        this.normalizeStructureArrayFields(assigned);
        return assigned;
    }

    private blankNativeSubsasgnValue(nextDescriptor?: NativeSubscriptDescriptor): NodeInput {
        if (!nextDescriptor || nextDescriptor.type === '.') {
            return new Structure({});
        }
        if (nextDescriptor.type === '()' && nextDescriptor.subs.length === 1) {
            return new MultiArray([1, 0], undefined, false);
        }
        if (nextDescriptor.type === '{}' && nextDescriptor.subs.length === 1) {
            return new MultiArray([1, 0], undefined, true);
        }
        return MultiArray.emptyArray(nextDescriptor.type === '{}');
    }

    private nativeSubscriptScalarForAssignment(target: NodeInput, descriptor: NativeSubscriptDescriptor, nextDescriptor?: NativeSubscriptDescriptor): NodeInput {
        try {
            return this.nativeSubscriptScalar(target, descriptor);
        } catch (error: unknown) {
            if (MultiArray.isInstanceOf(target)) {
                return this.blankNativeSubsasgnValue(nextDescriptor);
            }
            throw error as Error;
        }
    }

    private assignNativeSubsasgnNativeDescriptors(target: NodeInput, nativeDescriptors: NativeSubscriptDescriptor[], value: NodeInput): NodeInput {
        if (nativeDescriptors.length === 0) {
            return value;
        }
        /**
         * Pick the values distributed over structure-array branches.
         *
         * Empty arrays are scalar deletion values whenever more descriptors
         * remain below the current branch.
         */
        const branchAssignmentValues = (assignedValue: NodeInput, selectedCount: number, hasTail: boolean): NodeExpr[] => {
            if (selectedCount === 1 || (hasTail && MultiArray.isInstanceOf(assignedValue) && MultiArray.isEmpty(assignedValue))) {
                return [this.expressionValue(assignedValue, 'assignment')];
            }
            return this.assignmentValues(assignedValue, 'assignment');
        };
        const assign = (current: NodeInput, index: number, assignedValue: NodeInput = value): NodeInput => {
            const descriptor = nativeDescriptors[index];
            if (!descriptor) {
                return assignedValue;
            }
            if (descriptor.type === '.') {
                const field = descriptor.subs[0];
                if (!CharString.isInstanceOf(field)) {
                    this.context.throwEvalError('invalid subsasgn descriptor.');
                }
                if (MultiArray.isEmpty(current) && !Structure.isStructure(current)) {
                    current = new Structure({});
                }
                if (!Structure.isInstanceOf(current) && !Structure.isStructure(current)) {
                    this.context.throwEvalError('value cannot be indexed with .');
                }
                const result = Structure.isInstanceOf(current) ? Structure.copy(current) : MultiArray.isInstanceOf(current) ? MultiArray.copy(current) : undefined;
                if (!result) {
                    this.context.throwEvalError('value cannot be indexed with .');
                }
                const elements = Structure.structureElements(result);
                if (elements.length > 1 && index < nativeDescriptors.length - 1) {
                    const values = branchAssignmentValues(assignedValue, elements.length, true);
                    if (values.length !== 1 && values.length !== elements.length) {
                        this.context.throwEvalError(`assignment value count ${values.length} does not match selected structure count ${elements.length}.`);
                    }
                    elements.forEach((structure, elementIndex) => {
                        let currentField: NodeInput;
                        try {
                            currentField = this.expressionValue(Structure.getField(structure, [field.str]), `field ${field.str}`);
                        } catch {
                            currentField = this.blankNativeSubsasgnValue(nativeDescriptors[index + 1]);
                        }
                        const nested = assign(currentField, index + 1, values.length === 1 ? values[0] : values[elementIndex]);
                        Structure.setNewField(structure, [field.str], this.runtimeExpressionValue(nested, `field ${field.str}`));
                    });
                    return result;
                }
                let currentField: NodeInput;
                try {
                    currentField = this.expressionValue(Structure.getField(result, [field.str]), `field ${field.str}`);
                } catch {
                    currentField = this.blankNativeSubsasgnValue(nativeDescriptors[index + 1]);
                }
                const nested = index === nativeDescriptors.length - 1 ? assignedValue : assign(currentField, index + 1, assignedValue);
                Structure.setNewField(result, [field.str], this.runtimeExpressionValue(nested, `field ${field.str}`));
                return result;
            }
            if (!MultiArray.isInstanceOf(current) && !CharString.isInstanceOf(current)) {
                this.context.throwEvalError(`matrix cannot be indexed with ${descriptor.type[0]}`);
            }
            const nested =
                index === nativeDescriptors.length - 1
                    ? assignedValue
                    : assign(this.nativeSubscriptScalarForAssignment(current, descriptor, nativeDescriptors[index + 1]), index + 1, assignedValue);
            return this.setNativeIndexedValue(current, descriptor, nested);
        };
        return assign(target, 0);
    }

    private assignNativeSubsasgnDescriptors(target: NodeInput, descriptors: Structure[], value: NodeInput): NodeInput {
        return this.assignNativeSubsasgnNativeDescriptors(
            target,
            descriptors.map((descriptor) => this.readNativeSubscriptDescriptor(descriptor, 'subsasgn')),
            value,
        );
    }

    private shouldUseNativeChainedSubsasgn(descriptors: Structure[]): boolean {
        if (descriptors.length > 2) {
            return true;
        }
        if (descriptors.length < 2) {
            return false;
        }
        const [first, second] = descriptors.map((descriptor) => this.readNativeSubscriptDescriptor(descriptor).type);
        return !(first === '()' && second === '.');
    }

    private callClassSubsasgn(
        instance: ClassInstance,
        index: ExpressionBoundaryValue[],
        delimiter: IndexingDelimiterType,
        value: NodeInput,
        parent: NodeInput,
        scope: Scope,
    ): ClassInstance | undefined {
        const method = instance.classDefinition.findMethod('subsasgn', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsasgn' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubsasgnDescriptor(index, delimiter, parent, scope);
        return this.classSubsasgnResult(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent);
    }

    private callClassSubsasgnDescriptors(instance: ClassInstance, descriptors: Structure[], value: NodeInput, parent: NodeInput): ClassInstance | undefined {
        const method = instance.classDefinition.findMethod('subsasgn', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsasgn' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubscriptDescriptorArray(descriptors);
        return this.classSubsasgnResult(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent);
    }

    private createSubsasgnDescriptor(index: ExpressionBoundaryValue[], delimiter: IndexingDelimiterType, parent: NodeInput, scope: Scope): Structure {
        return this.createSubscriptDescriptor(delimiter, index, parent, scope);
    }

    private callClassDotSubsasgn(instance: ClassInstance, field: string, value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance | undefined {
        const method = instance.classDefinition.findMethod('subsasgn', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsasgn' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createDotSubscriptDescriptor(field, parent, scope);
        return this.classSubsasgnResult(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent);
    }

    private callClassEnd(instance: ClassInstance, indexPosition: number, indexCount: number, parent: NodeInput): NodeInput | undefined {
        const method = instance.classDefinition.findMethod('end', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'end' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        return this.reducedClassMethodResult(instance, method, this.classMethodArgumentValues([Complex.create(indexPosition), Complex.create(indexCount)], 'end'), parent);
    }

    private callClassSubsindex(instance: ClassInstance, parent: NodeInput): NodeInput {
        const method = instance.classDefinition.findMethod('subsindex', (item) => !item.isStatic);
        if (!method) {
            this.context.throwEvalError(`object of class ${instance.classDefinition.name} cannot be used as an index without a subsindex method.`);
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsindex' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        return this.reducedClassMethodResultWithOutputCount(instance, method, [], parent, 1);
    }

    private zeroBasedSubsindexValue(value: NodeInput, parent: NodeInput, label: string): NodeInput {
        const scalarIndex = (item: NodeInput, itemLabel: string): ComplexType => {
            const indexValue = this.expressionValue(item, itemLabel);
            if (!Complex.isInstanceOf(indexValue) || !Complex.imagIsZero(indexValue)) {
                this.context.throwEvalError('subsindex must return zero-based real integer indices.');
            }
            const index = Complex.realToNumber(indexValue);
            if (!Number.isInteger(index) || index < 0) {
                this.context.throwEvalError('subsindex must return zero-based real integer indices.');
            }
            return Complex.create(index + 1);
        };
        const rawValue = this.expressionValue(value, label);
        if (MultiArray.isInstanceOf(rawValue)) {
            const result = new MultiArray(rawValue.dimension, undefined, false);
            for (let n = 0; n < MultiArray.linearLength(rawValue); n++) {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(rawValue.dimension[0], rawValue.dimension[1], n);
                result.array[i][j] = scalarIndex(this.expressionValue(rawValue.array[i][j], `${label}${n + 1}`), `${label}${n + 1}`);
            }
            MultiArray.setType(result);
            result.parent = parent;
            return result;
        }
        return scalarIndex(rawValue, label);
    }

    /**
     * Convert class objects used as native array indices through `subsindex`.
     *
     * MATLAB/Octave `subsindex` returns zero-based indices; MathJSLab's native
     * indexing core consumes ordinary one-based MATLAB indices, so this helper
     * validates the method result and shifts it by one at the boundary.
     */
    public convertIndexArgument(value: NodeInput, parent: NodeInput): NodeInput {
        if (ClassInstance.isInstanceOf(value)) {
            return this.zeroBasedSubsindexValue(this.callClassSubsindex(value, parent), parent, 'subsindex');
        }
        if (MultiArray.isInstanceOf(value) && this.hasClassInstanceElement(value)) {
            const result = new MultiArray(value.dimension, undefined, false);
            for (let n = 0; n < MultiArray.linearLength(value); n++) {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(value.dimension[0], value.dimension[1], n);
                const item = value.array[i][j];
                if (!ClassInstance.isInstanceOf(item)) {
                    this.context.throwEvalError('object index arrays must contain class instance elements.');
                }
                const converted = this.zeroBasedSubsindexValue(this.callClassSubsindex(item, parent), parent, `subsindex${n + 1}`);
                if (!Complex.isInstanceOf(converted)) {
                    this.context.throwEvalError('subsindex for object index arrays must return scalar indices.');
                }
                result.array[i][j] = converted;
            }
            MultiArray.setType(result);
            result.parent = parent;
            return result;
        }
        return value;
    }

    /**
     * Re-evaluate expressions waiting for a newly defined forward reference.
     * @param id Identifier that may unblock pending references.
     * @param scope Scope that stores the pending references.
     * @param resolving Resolution chain used to detect recursive cycles.
     */
    private solveUndefined(id: string, scope: Scope = this.context.currentScope, resolving: string[] = []): void {
        if (this.context.allowForwardReference) {
            const circularIndex = resolving.indexOf(id);
            if (circularIndex >= 0) {
                this.context.throwCircularReferenceError([...resolving.slice(circularIndex), id]);
            }
            const pendingReferences = scope.undefinedReferenceTable[id];
            if (typeof pendingReferences !== 'undefined') {
                /* Work on a copy while the table is updated. */
                const pendingReferenceList = [...pendingReferences].filter((value) => value);
                const nextPendingReferences = new Set<string>();
                /* References that became fully resolved in this pass. */
                const solvedReference: string[] = [];
                pendingReferenceList.forEach((ref) => {
                    if (typeof scope.nameTable[ref] !== 'undefined') {
                        try {
                            scope.nameTable[ref].node = this.evaluatedExecutionResult(scope.nameTable[ref].node, scope);
                            delete scope.nameTable[ref].undefinedReference;
                            solvedReference.push(ref);
                        } catch (e: unknown) {
                            if (e instanceof UndefinedReferenceError) {
                                nextPendingReferences.add(e.identifier);
                                scope.nameTable[ref].undefinedReference = e.identifier;
                            } else {
                                nextPendingReferences.add(ref);
                            }
                        }
                    }
                });
                scope.undefinedReferenceTable[id] = nextPendingReferences;
                solvedReference.forEach((ref) => this.solveUndefined(ref, scope, [...resolving, id]));
            }
        }
    }

    /**
     * A forward reference is recoverable only when it was raised in the
     * currently executing callable. Errors propagated from deeper calls must
     * keep their original stack trace and should not be registered as local
     * pending assignments.
     */
    private isLocalUndefinedReference(error: unknown): error is UndefinedReferenceError {
        if (!(error instanceof UndefinedReferenceError)) {
            return false;
        }
        const callableFrames = this.context.callStack.filter((frame) => frame.func !== undefined);
        const currentCallableFrame = callableFrames[callableFrames.length - 1];
        return error.stackFrames?.[0] === currentCallableFrame;
    }

    private registerFunctionDefinition(func: NodeFunctionDefinition, scope: Scope, nested: boolean): void {
        this.validateFunctionSignature(func);
        this.validateDeclarationPlacement(func);
        if (nested) {
            func.attributes = { ...(func.attributes ?? {}), nested: true };
        } else if (func.attributes?.nested) {
            func.attributes = { ...func.attributes };
            delete func.attributes.nested;
        }
        this.validateFunctionArgumentsBlocks(func);
        scope.defineFunction(func.id, func);
        if (nested) {
            func.definingScope = scope;
        } else {
            /* Store a lexical capture overlay while keeping live fallback for forward references. */
            func.definingScope = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
        }
    }

    /**
     * Test whether a parsed declaration sits inside an executable control
     * block rather than directly in a script, function, or class section body.
     *
     * MATLAB/Octave declarations are not statements that can be conditionally
     * introduced by `if`, `for`, `try`, and similar blocks. The parser can
     * still build these shapes because command lists are intentionally generic;
     * the interpreter rejects them before registration.
     */
    private isNodeInsideExecutableBlock(node: NodeFunctionDefinition | NodeClassDef | NodeImport): boolean {
        const listParent = node.parent;
        const owner = listParent?.parent;
        return (
            AST.isNodeBase(owner) &&
            (owner.type === 'IF' ||
                owner.type === 'SWITCH' ||
                owner.type === 'CASE' ||
                owner.type === 'WHILE' ||
                owner.type === 'DO_UNTIL' ||
                owner.type === 'FOR' ||
                owner.type === 'SPMD' ||
                owner.type === 'TRY' ||
                owner.type === 'UNWIND_PROTECT')
        );
    }

    /**
     * Validate declaration placement for a parsed tree before execution.
     *
     * Command lists are intentionally generic so the parser can preserve rich
     * MATLAB/Octave syntax and parent links. This semantic pass rejects
     * definition/declaration placements that are structurally invalid even when
     * the containing branch would not run at runtime.
     *
     * @param tree Parsed AST to validate.
     */
    private validateDeclarationPlacement(tree: NodeInput): void {
        const visit = (node: NodeInput | null | undefined, insideFunction: boolean): void => {
            if (!node) {
                return;
            }
            if (AST.isNodeList(node)) {
                node.list.forEach((entry: NodeInput) => visit(entry, insideFunction));
                return;
            }
            if (AST.isNodeFunctionDefinition(node)) {
                if (this.isNodeInsideExecutableBlock(node)) {
                    this.context.throwSyntaxError(`function definition '${node.id}' is not allowed inside a control block.`);
                }
                visit(node.arguments, true);
                visit(node.statements, true);
                return;
            }
            if (AST.isNodeClassDef(node)) {
                if (this.isNodeInsideExecutableBlock(node)) {
                    this.context.throwSyntaxError(`class definition '${node.id}' is not allowed inside a control block.`);
                }
                if (insideFunction) {
                    this.context.throwSyntaxError(`class definition '${node.id}' is not allowed inside a function.`);
                }
                node.sections.forEach((section: NodeInput) => visit(section, insideFunction));
                return;
            }
            if (AST.isNodeImport(node) && node.imports.length > 0 && this.isNodeInsideExecutableBlock(node)) {
                this.context.throwSyntaxError('import declaration is not allowed inside a control block.');
            }
            if (node.type === 'PERSIST' && !insideFunction) {
                this.context.throwSyntaxError('persistent declaration is only valid inside a function.');
            }
            switch (node.type) {
                case 'IF':
                    node.then.forEach((branch: NodeInput) => visit(branch, insideFunction));
                    visit(node.else, insideFunction);
                    break;
                case 'SWITCH':
                    node.cases.forEach((caseNode: NodeInput) => visit(caseNode, insideFunction));
                    visit(node.otherwise, insideFunction);
                    break;
                case 'CASE':
                    visit(node.then, insideFunction);
                    break;
                case 'WHILE':
                case 'DO_UNTIL':
                case 'FOR':
                case 'SPMD':
                    visit(node.body, insideFunction);
                    break;
                case 'TRY':
                    visit(node.body, insideFunction);
                    visit(node.catchBody, insideFunction);
                    break;
                case 'UNWIND_PROTECT':
                    visit(node.body, insideFunction);
                    visit(node.cleanup, insideFunction);
                    break;
                case 'CLASS_SECTION':
                    visit(node.members, insideFunction);
                    break;
            }
        };
        visit(tree, false);
    }

    private preregisterScriptLocalFunctions(list: NodeList, scope: Scope): void {
        if (list.parent !== null) {
            return;
        }
        if (this.context.currentFrame?.func?.type === 'FCNDEF') {
            return;
        }
        const sourceName = this.scriptSourceNameStack[this.scriptSourceNameStack.length - 1];
        for (const statement of list.list) {
            if (!AST.isNodeFunctionDefinition(statement)) {
                continue;
            }
            if (scope.functionTable[statement.id] === statement) {
                continue;
            }
            statement.sourceName = sourceName;
            this.registerFunctionDefinition(statement, scope, false);
        }
    }

    private getArgumentValidationName(validation: NodeArgumentValidation): string {
        return FunctionArguments.validationName(validation, (message) => this.context.throwSyntaxError(message));
    }

    private getNameValueArgumentTarget(validation: NodeArgumentValidation): { parameter: string; field: string } | undefined {
        return FunctionArguments.nameValueTarget(validation, (message) => this.context.throwSyntaxError(message));
    }

    private getArgumentValidationDisplayName(validation: NodeArgumentValidation): string {
        return FunctionArguments.validationDisplayName(validation, (message) => this.context.throwSyntaxError(message));
    }

    private validateFunctionArgumentsBlocks(func: NodeFunctionDefinition): void {
        FunctionArguments.validateBlocks(func, (message) => this.context.throwSyntaxError(message));
    }

    private validateFunctionSignatureList<T extends NodeFunctionParameter | NodeFunctionReturn>(
        nodes: readonly unknown[],
        isValidEntry: (node: unknown) => node is T,
        variadicName: 'varargin' | 'varargout',
        listKind: 'parameter' | 'return',
        functionDisplayName: string,
    ): void {
        const seen = new Set<string>();
        nodes.forEach((node, index) => {
            if (!isValidEntry(node)) {
                this.context.throwSyntaxError(`invalid ${listKind} list in ${functionDisplayName}.`);
            }
            if (AST.isNodeIgnoredTarget(node)) {
                return;
            }
            let name: string;
            if (AST.isNodeDefaultedParameter(node)) {
                if (listKind !== 'parameter' || functionDisplayName === 'anonymous function') {
                    this.context.throwSyntaxError(`invalid ${listKind} list in ${functionDisplayName}.`);
                }
                name = node.left.id;
            } else if (AST.isNodeIdentifier(node)) {
                name = node.id;
            } else {
                this.context.throwSyntaxError(`invalid ${listKind} list in ${functionDisplayName}.`);
            }
            if (seen.has(name)) {
                this.context.throwSyntaxError(`duplicate ${listKind} name '${name}' in ${functionDisplayName}.`);
            }
            seen.add(name);
            if (name === variadicName && index !== nodes.length - 1) {
                this.context.throwSyntaxError(`${variadicName} must be the last ${listKind} in ${functionDisplayName}.`);
            }
            if (node.type === '=' && name === variadicName) {
                this.context.throwSyntaxError(`${variadicName} default value is not supported in ${functionDisplayName}.`);
            }
        });
    }

    private validateFunctionSignature(func: NodeFunctionDefinition): void {
        const functionDisplayName = `function ${func.id}`;
        this.validateFunctionSignatureList(func.parameter.list, AST.isNodeFunctionParameter, 'varargin', 'parameter', functionDisplayName);
        this.validateFunctionSignatureList(func.return.list, AST.isNodeFunctionReturn, 'varargout', 'return', functionDisplayName);
        this.validateFunctionDeclarations(func, functionDisplayName);
    }

    private validateAnonymousFunctionSignature(handle: FunctionHandle): void {
        this.validateFunctionSignatureList(handle.parameter, AST.isNodeFunctionParameter, 'varargin', 'parameter', 'anonymous function');
    }

    /**
     * Extract the declared name from a `global` or `persistent` list entry.
     *
     * @param declaration Declaration list element.
     * @param declarationKind Display name for diagnostics.
     * @returns Declared identifier.
     */
    private declarationName(declaration: NodeExpr, declarationKind: string): string {
        const declarationNode = AST.getDeclarationNode(declaration);
        if (AST.isNodeIdentifier(declarationNode)) {
            return declarationNode.id;
        }
        if (AST.isNodeDefaultedParameter(declarationNode)) {
            return declarationNode.left.id;
        }
        this.context.throwSyntaxError(`invalid ${declarationKind} declaration.`);
    }

    /**
     * Return the non-ignored names declared by one function signature list.
     *
     * @param nodes Function parameters or returns.
     * @returns Set of declared names.
     */
    private signatureNameSet(nodes: readonly (NodeFunctionParameter | NodeFunctionReturn)[]): Set<string> {
        const names = new Set<string>();
        nodes.forEach((node) => {
            if (AST.isNodeDefaultedParameter(node)) {
                names.add(node.left.id);
            } else if (AST.isNodeIdentifier(node)) {
                names.add(node.id);
            }
        });
        return names;
    }

    /**
     * Collect identifier references from a subtree without following parent links.
     *
     * @param node AST fragment to inspect.
     * @param names Accumulator receiving referenced identifier names.
     */
    private collectIdentifierReferences(node: unknown, names: Set<string>): void {
        if (!node || typeof node !== 'object') {
            return;
        }
        if (AST.isNodeIdentifier(node)) {
            names.add(node.id);
            return;
        }
        if (AST.isNodeFunctionDefinition(node) || AST.isNodeClassDef(node)) {
            return;
        }
        if (node instanceof CharString || node instanceof Complex || node instanceof FunctionHandle) {
            return;
        }
        if (MultiArray.isInstanceOf(node)) {
            MultiArray.linearize(node).forEach((entry: unknown) => this.collectIdentifierReferences(entry, names));
            return;
        }
        if (Structure.isInstanceOf(node)) {
            Object.values(node.field).forEach((entry: unknown) => this.collectIdentifierReferences(entry, names));
            return;
        }
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
            if (key !== 'parent') {
                this.collectIdentifierReferences(value, names);
            }
        });
    }

    /**
     * Validate MATLAB/Octave restrictions for function declarations.
     *
     * Global and persistent variables must not reuse formal input/output names,
     * and the first declaration must appear before any previous reference to the
     * same local name in the function body.
     *
     * @param func Function definition to validate.
     * @param functionDisplayName Human-readable function name.
     */
    private validateFunctionDeclarations(func: NodeFunctionDefinition, functionDisplayName: string): void {
        const argumentNames = this.signatureNameSet(func.parameter.list);
        const returnNames = this.signatureNameSet(func.return.list);
        const referencedNames = new Set<string>();
        const declaredPersistentNames = new Set<string>();
        const declaredGlobalNames = new Set<string>();
        const validateDeclaration = (declaration: NodeDeclaration): void => {
            declaration.list.forEach((entry: NodeExpr) => {
                const name = this.declarationName(entry, declaration.type === 'PERSIST' ? 'persistent' : 'global');
                const kind = declaration.type === 'PERSIST' ? 'persistent' : 'global';
                const declaredNames = declaration.type === 'PERSIST' ? declaredPersistentNames : declaredGlobalNames;
                if (argumentNames.has(name) || returnNames.has(name)) {
                    this.context.throwSyntaxError(`can't make function parameter ${name} ${kind}.`);
                }
                if (!declaredNames.has(name) && referencedNames.has(name)) {
                    this.context.throwSyntaxError(`${kind} declaration '${name}' must appear before any use in ${functionDisplayName}.`);
                }
                declaredNames.add(name);
            });
        };
        const visitStatement = (statement: NodeInput): void => {
            if (AST.isNodeDeclaration(statement)) {
                validateDeclaration(statement);
                this.collectIdentifierReferences(statement, referencedNames);
                return;
            }
            switch (statement.type) {
                case 'IF':
                    statement.expression.forEach((expression: NodeExpr) => this.collectIdentifierReferences(expression, referencedNames));
                    statement.then.forEach(visitStatements);
                    if (statement.else) {
                        visitStatements(statement.else);
                    }
                    return;
                case 'SWITCH':
                    this.collectIdentifierReferences(statement.expression, referencedNames);
                    statement.cases.forEach((caseNode: NodeSwitchCase) => {
                        this.collectIdentifierReferences(caseNode.expression, referencedNames);
                        visitStatements(caseNode.then);
                    });
                    if (statement.otherwise) {
                        visitStatements(statement.otherwise);
                    }
                    return;
                case 'WHILE':
                    this.collectIdentifierReferences(statement.expression, referencedNames);
                    visitStatements(statement.body);
                    return;
                case 'DO_UNTIL':
                    visitStatements(statement.body);
                    this.collectIdentifierReferences(statement.expression, referencedNames);
                    return;
                case 'FOR':
                    this.collectIdentifierReferences(statement.target, referencedNames);
                    this.collectIdentifierReferences(statement.expression, referencedNames);
                    this.collectIdentifierReferences(statement.workers, referencedNames);
                    visitStatements(statement.body);
                    return;
                case 'SPMD':
                    this.collectIdentifierReferences(statement.workers, referencedNames);
                    visitStatements(statement.body);
                    return;
                case 'TRY':
                    visitStatements(statement.body);
                    this.collectIdentifierReferences(statement.catchIdentifier, referencedNames);
                    if (statement.catchBody) {
                        visitStatements(statement.catchBody);
                    }
                    return;
                case 'UNWIND_PROTECT':
                    visitStatements(statement.body);
                    visitStatements(statement.cleanup);
                    return;
                case 'FCNDEF':
                case 'CLASSDEF':
                    return;
                default:
                    this.collectIdentifierReferences(statement, referencedNames);
            }
        };
        const visitStatements = (list: NodeList): void => {
            list.list.forEach((statement) => {
                visitStatement(statement);
            });
        };
        visitStatements(func.statements);
    }

    private getValueClassName(value: NodeInput): string {
        if (MultiArray.isInstanceOf(value) && !value.isCell) {
            const values = MultiArray.linearize(value);
            if (values.length > 0) {
                const className = this.objectArrayClassName(values);
                if (className) {
                    return className;
                }
            }
        }
        return FunctionValidation.className(value);
    }

    private objectArrayClassName(values: NodeInput[]): string | undefined {
        const classNameOf = (value: NodeInput): string | undefined => {
            if (ClassInstance.isInstanceOf(value) || ClassEnumerationValue.isInstanceOf(value)) {
                return value.classDefinition.name;
            }
            if (ClassMetaObject.isInstanceOf(value)) {
                return value.kind;
            }
            return undefined;
        };
        const classNames = values.map(classNameOf);
        if (!classNames.every((className): className is string => typeof className !== 'undefined')) {
            return undefined;
        }
        const first = classNames[0];
        return classNames.every((className) => className === first) ? first : undefined;
    }

    private getArgumentValidationEntry(validation: NodeArgumentValidation, scope: Scope, localNamesOnly: boolean): { node?: NodeInput } | undefined {
        const nameValue = this.getNameValueArgumentTarget(validation);
        if (!nameValue) {
            const name = this.getArgumentValidationName(validation);
            return localNamesOnly ? scope.nameTable[name] : scope.resolveName(name);
        }
        const entry = localNamesOnly ? scope.nameTable[nameValue.parameter] : scope.resolveName(nameValue.parameter);
        if (!entry || typeof entry.node === 'undefined') {
            return undefined;
        }
        try {
            return { node: Structure.getField(entry.node, [nameValue.field]) };
        } catch {
            return undefined;
        }
    }

    private validateArgumentValidation(
        validation: NodeArgumentValidation,
        scope: Scope,
        symbolicDimensions: Map<string, number>,
        localNamesOnly = false,
        displayName = this.getArgumentValidationDisplayName(validation),
    ): void {
        FunctionArguments.validateArgumentValidation(
            validation,
            symbolicDimensions,
            {
                resolveEntry: (item, namesOnly) => this.getArgumentValidationEntry(item, scope, namesOnly),
                evaluate: (expr) => this.evaluatedExpressionValue(expr, scope, 'argument validation expression'),
                matchesClass: (value, className) => this.valueMatchesValidationClass(value, className, scope),
                ...this.pathValidationCallbacks,
                throwEvalError: (message) => this.context.throwEvalError(message),
                throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            },
            localNamesOnly,
            displayName,
        );
    }

    private classPropertyValidationNode(property: ClassPropertyDefinition): NodeArgumentValidation {
        return {
            type: 'ARGVALID',
            name: property.node.name,
            size: property.size,
            class: property.class,
            functions: property.functions,
            default: property.defaultValue,
            omitAnswer: true,
            omitOutput: true,
        } as NodeArgumentValidation;
    }

    private validateClassPropertyValue(property: ClassPropertyDefinition, value: NodeInput, scope: Scope, allowEmptyObjectPlaceholder = false): void {
        const validation = this.classPropertyValidationNode(property);
        const validationScope = Scope.create(scope);
        validationScope.defineName(property.name, value);
        FunctionArguments.validateArgumentValidation(
            validation,
            new Map<string, number>(),
            {
                resolveEntry: () => ({ node: value }),
                evaluate: (expr) => this.evaluatedExpressionValue(expr, validationScope, 'property validation expression'),
                matchesClass: (item, className) => this.valueMatchesValidationClass(item, className, validationScope, allowEmptyObjectPlaceholder),
                ...this.pathValidationCallbacks,
                throwEvalError: (message) => this.context.throwEvalError(message),
                throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            },
            false,
            property.name,
            'property',
        );
    }

    public validateClassInstancePropertyDefaults(instance: ClassInstance, scope: Scope): void {
        for (const property of instance.classDefinition.allProperties()) {
            if (!property.isDependent && ClassInstance.hasProperty(instance, property.name)) {
                this.validateClassPropertyValue(property, ClassInstance.getProperty(instance, property.name)!, scope, true);
            }
        }
    }

    private validateFunctionArguments(func: NodeFunctionDefinition, scope: Scope, targetAttribute: 'Input' | 'Output', namesToValidate?: Set<string>, localNamesOnly = false): void {
        FunctionArguments.validateFunctionArguments(
            func,
            targetAttribute,
            {
                resolveEntry: (validation, namesOnly) => this.getArgumentValidationEntry(validation, scope, namesOnly),
                evaluate: (expr) => this.evaluatedExpressionValue(expr, scope, 'argument validation expression'),
                matchesClass: (value, className) => this.valueMatchesValidationClass(value, className, scope),
                ...this.pathValidationCallbacks,
                throwEvalError: (message) => this.context.throwEvalError(message),
                throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            },
            namesToValidate,
            localNamesOnly,
        );
    }

    public validateFunctionInputArguments(func: NodeFunctionDefinition, scope: Scope): void {
        this.validateFunctionArguments(func, scope, 'Input');
    }

    public validateFunctionRepeatingArguments(func: NodeFunctionDefinition, scope: Scope, values: ExpressionBoundaryValue[]): void {
        FunctionArguments.validateRepeatingArguments(func, values, {
            evaluate: (expr) => this.evaluatedExpressionValue(expr, scope, 'repeating argument validation expression'),
            ...this.pathValidationCallbacks,
            throwEvalError: (message) => this.context.throwEvalError(message),
            throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            validateRepeatingValue: (validation, validationName, value, displayName, symbolicDimensions) => {
                const validationScope = Scope.create(scope);
                validationScope.defineName(validationName, value);
                this.validateArgumentValidation(validation, validationScope, symbolicDimensions, true, displayName);
            },
        });
    }

    public getFunctionNameValueParameters(func: NodeFunctionDefinition): Set<string> {
        return FunctionArguments.nameValueParameters(func, (message) => this.context.throwSyntaxError(message));
    }

    private getFunctionNameValueDeclarations(func: NodeFunctionDefinition): Map<string, Map<string, NodeArgumentValidation>> {
        return FunctionArguments.nameValueDeclarations(func, (message) => this.context.throwSyntaxError(message));
    }

    public splitFunctionCallNameValueArguments(
        func: NodeFunctionDefinition,
        args: ExpressionBoundaryValue[],
    ): { positional: ExpressionBoundaryValue[]; named: Map<string, ExpressionBoundaryValue> } {
        return FunctionArguments.splitCallNameValueArguments(
            func,
            args,
            (message) => this.context.throwEvalError(message),
            (message) => this.context.throwSyntaxError(message),
        );
    }

    public bindFunctionNameValueArguments(func: NodeFunctionDefinition, scope: Scope, values: Map<string, ExpressionBoundaryValue>): void {
        const declarations = this.getFunctionNameValueDeclarations(func);
        for (const [parameter, fields] of declarations) {
            const options = new Structure({});
            for (const [field, validation] of fields) {
                if (!validation.default) {
                    continue;
                }
                this.context.pushRequestedOutputCount(1);
                try {
                    Structure.setNewField(
                        options,
                        [field],
                        this.runtimeExpressionValue(
                            this.evaluatedExpressionValue(validation.default, scope, `name-value default ${parameter}.${field}`),
                            `name-value default ${parameter}.${field}`,
                        ),
                    );
                } finally {
                    this.context.popRequestedOutputCount();
                }
            }
            for (const [field, value] of values) {
                if (fields.has(field)) {
                    Structure.setNewField(options, [field], this.runtimeExpressionValue(value, `name-value argument ${field}`));
                }
            }
            scope.defineName(parameter, options);
        }
    }

    public registerNestedFunctions(func: NodeFunctionDefinition, scope: Scope): void {
        for (const statement of func.statements.list) {
            if (!AST.isNodeFunctionDefinition(statement)) {
                continue;
            }
            const nested: NodeFunctionDefinition = {
                ...statement,
                attributes: { ...(statement.attributes ?? {}), nested: true },
            };
            this.validateFunctionSignature(nested);
            this.validateFunctionArgumentsBlocks(nested);
            nested.definingScope = scope;
            nested.sourceName = func.sourceName;
            scope.defineFunction(nested.id, nested);
        }
    }

    /**
     * Configure MATLAB static-workspace metadata for function calls.
     *
     * Workspaces for nested functions, and functions that contain nested
     * functions, cannot receive brand-new variable names from dynamic code such
     * as `eval`, `evalin`, `assignin`, or scripts. The allowlist is derived from
     * names that appear textually in the function signature/body.
     *
     * @param func Function definition being called.
     * @param scope Fresh call scope associated with the function.
     */
    public configureFunctionWorkspace(func: NodeFunctionDefinition, scope: Scope): void {
        if (!func.attributes?.nested && !this.functionContainsNestedDefinitions(func)) {
            return;
        }
        scope.allowStaticWorkspaceNames(this.staticWorkspaceTextNames(func));
    }

    /**
     * Test whether a function body declares nested functions directly.
     */
    private functionContainsNestedDefinitions(func: NodeFunctionDefinition): boolean {
        return func.statements.list.some(AST.isNodeFunctionDefinition);
    }

    /**
     * Collect variable names that are visible in function text.
     */
    private staticWorkspaceTextNames(func: NodeFunctionDefinition): Set<string> {
        const names = new Set<string>();
        const addListEntries = (entries: NodeFunctionParameter[] | NodeFunctionReturn[]): void => {
            for (const entry of entries) {
                if (AST.isNodeIdentifier(entry)) {
                    names.add(entry.id);
                } else if (AST.isNodeDefaultedParameter(entry)) {
                    names.add(entry.left.id);
                }
            }
        };
        addListEntries(func.parameter.list);
        addListEntries(func.return.list);
        this.collectStaticWorkspaceTextNames(func.statements, names);
        return names;
    }

    /**
     * Walk a statement tree and collect assignment/declaration root names.
     */
    private collectStaticWorkspaceTextNames(node: NodeInput, names: Set<string>): void {
        if (AST.isNodeFunctionDefinition(node)) {
            return;
        }
        if (AST.isNodeIdentifier(node)) {
            names.add(node.id);
        } else if (AST.isNodeDeclaration(node)) {
            for (const declaration of node.list) {
                if (AST.isNodeIdentifier(declaration)) {
                    names.add(declaration.id);
                } else if (AST.isNodeDefaultedParameter(declaration)) {
                    names.add(declaration.left.id);
                }
            }
        } else if (AST.isNodeBinaryOperation(node) && Interpreter.assignmentOperatorNames.has(node.type)) {
            this.collectStaticAssignmentTargetNames(node.left, names);
        }
        if (!node || typeof node !== 'object') {
            return;
        }
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
            if (key === 'parent' || key === 'start' || key === 'stop') {
                continue;
            }
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item && typeof item === 'object') {
                        this.collectStaticWorkspaceTextNames(item as NodeInput, names);
                    }
                }
            } else if (value && typeof value === 'object') {
                this.collectStaticWorkspaceTextNames(value as NodeInput, names);
            }
        }
    }

    /**
     * Collect assignment root names from one left-hand-side shape.
     */
    private collectStaticAssignmentTargetNames(target: NodeInput, names: Set<string>): void {
        if (AST.isNodeIdentifier(target)) {
            names.add(target.id);
            return;
        }
        if (AST.isNodeIgnoredTarget(target)) {
            return;
        }
        if (AST.isNodeIndexExpr(target)) {
            this.collectStaticAssignmentTargetNames(target.expr, names);
            return;
        }
        if (AST.isNodeIndirectRef(target)) {
            this.collectStaticAssignmentTargetNames(target.obj, names);
            return;
        }
        if (MultiArray.isInstanceOf(target)) {
            for (const item of MultiArray.linearize(target)) {
                this.collectStaticAssignmentTargetNames(item, names);
            }
        }
    }

    /**
     * Preprocess imports that belong to a script or function body scope.
     *
     * MATLAB applies imports to the whole script/function scope, including
     * statements that appear textually before the `import` command. Execution
     * still visits the `IMPORT` nodes later, but re-registering the same import
     * is harmless because `Scope` deduplicates entries.
     *
     * @param tree Script/function statement tree to scan.
     * @param scope Scope receiving the imports.
     */
    public applyScopedImports(tree: NodeInput, scope: Scope): void {
        const statements = AST.isNodeList(tree) ? tree.list : [tree];
        for (const statement of statements) {
            if (AST.isNodeImport(statement)) {
                for (const importName of statement.imports) {
                    this.context.defineImport(importName.id, scope);
                }
            }
        }
    }

    public validateFunctionOutputArguments(func: NodeFunctionDefinition, scope: Scope, requestedOutputCount: number, outputMask: boolean[] = []): void {
        const requestedNames = FunctionArguments.outputNamesToValidate(func, requestedOutputCount, outputMask);
        if (requestedNames) {
            this.validateFunctionArguments(func, scope, 'Output', requestedNames, true);
        }
        const repeating = FunctionArguments.outputRepeatingInfo(func, (message) => this.context.throwSyntaxError(message));
        if (!repeating) {
            return;
        }
        const requestedRepeatingCount = Math.max(requestedOutputCount - repeating.fixedReturnCount, 0);
        if (requestedRepeatingCount === 0) {
            return;
        }
        const entry = scope.nameTable[repeating.name];
        if (!entry || !(entry.node instanceof MultiArray) || !entry.node.isCell) {
            this.context.throwEvalError(`Undefined return variable '${repeating.name}'`);
        }
        const values = MultiArray.linearize(entry.node)
            .slice(0, requestedRepeatingCount)
            .map((value, index) =>
                !(outputMask[repeating.fixedReturnCount + index] ?? true) || typeof value === 'undefined'
                    ? undefined
                    : { value: this.expressionValue(value, `${repeating.name}{${index + 1}}`), index: index + 1 },
            )
            .filter((value): value is { value: ExpressionBoundaryValue; index: number } => typeof value !== 'undefined');
        FunctionArguments.validateRepeatingOutputArguments(func, values, {
            evaluate: (expr) => this.evaluatedExpressionValue(expr, scope, 'repeating output validation expression'),
            ...this.pathValidationCallbacks,
            throwEvalError: (message) => this.context.throwEvalError(message),
            throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            validateRepeatingValue: (validation, validationName, value, displayName, symbolicDimensions) => {
                const validationScope = Scope.create(scope);
                validationScope.defineName(validationName, value);
                this.validateArgumentValidation(validation, validationScope, symbolicDimensions, true, displayName);
            },
        });
    }

    public getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, NodeExpr> {
        return FunctionArguments.inputArgumentDefaults(func, (message) => this.context.throwSyntaxError(message));
    }

    public getFunctionOutputRepeatingName(func: NodeFunctionDefinition): string | undefined {
        return FunctionArguments.outputRepeatingName(func, (message) => this.context.throwSyntaxError(message));
    }

    /**
     * Expression tree recursive interpreter.
     * @param tree Expression to evaluate.
     * @param scope Scope of execution.
     * @returns Expression `tree` evaluated.
     */
    public Evaluator(tree: NodeInput, scope: Scope = this.context.currentScope): NodeInput {
        if (this._debug) {
            console.log(`Interpreter(\ntree:${JSON.stringify(tree, (key: string, value: NodeInput) => (key !== 'parent' ? value : value === null ? 'root' : true), 2)},\n);`);
        }
        if (tree) {
            if (FunctionHandle.isInstanceOf(tree)) {
                const resolvedFunctionHandleTarget = tree.id && !tree.closure ? this.resolveRuntimeFunction(tree.id, scope, { loadFunctions: false }) : undefined;
                const resolvedFunctionSourceTarget =
                    tree.id && !tree.closure && !resolvedFunctionHandleTarget?.functionDefinition ? this.lookupFunctionSourceResolution(tree.id, scope) : undefined;
                if (resolvedFunctionHandleTarget?.functionDefinition) {
                    const handle = FunctionHandle.copy(tree);
                    handle.id = tree.id!.includes('.') ? resolvedFunctionHandleTarget.resolvedName : this.context.aliasNameFunction(tree.id!);
                    if (resolvedFunctionHandleTarget.functionDefinition.type === 'FCNDEF') {
                        handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
                    }
                    return handle;
                }
                if (resolvedFunctionSourceTarget) {
                    const handle = FunctionHandle.copy(tree);
                    handle.id = tree.id!.includes('.') ? resolvedFunctionSourceTarget.resolvedName : this.context.aliasNameFunction(tree.id!);
                    handle.sourceName = resolvedFunctionSourceTarget.sourceName;
                    if (resolvedFunctionSourceTarget.source === 'import') {
                        handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
                    }
                    return handle;
                }
                if (tree.id && !tree.closure && this.resolveImportedStaticMethod(tree.id, scope)) {
                    const handle = FunctionHandle.copy(tree);
                    handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
                    return handle;
                }
                if (!tree.id && !tree.closure) {
                    this.validateAnonymousFunctionSignature(tree);
                    const handle = FunctionHandle.copy(tree);
                    handle.closure = scope.snapshot((node) => MathOperation.copy(node));
                    handle.sourceName = this.currentHandleSourceName();
                    handle.className = this.currentHandleClassName();
                    return handle;
                }
                return tree;
            } else if (
                Complex.isInstanceOf(tree) ||
                CharString.isInstanceOf(tree) ||
                Structure.isInstanceOf(tree) ||
                ClassDefinition.isInstanceOf(tree) ||
                ClassInstance.isInstanceOf(tree) ||
                ClassBoundMethod.isInstanceOf(tree) ||
                ClassStaticMethod.isInstanceOf(tree) ||
                ClassEmptyMethod.isInstanceOf(tree) ||
                ClassEnumerationValue.isInstanceOf(tree) ||
                ClassEventListener.isInstanceOf(tree) ||
                ClassEventData.isInstanceOf(tree) ||
                ClassPropertyEvent.isInstanceOf(tree) ||
                ClassMetaObject.isInstanceOf(tree)
            ) {
                return tree;
            } else if (MultiArray.isInstanceOf(tree)) {
                return MultiArray.evaluate(tree, this, scope);
            } else {
                switch (tree.type) {
                    case 'VOID':
                        return tree;
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
                        return this.evaluateBinaryOperation(this.requireBinaryOperation(tree), scope);
                    case '&&':
                    case '||':
                        return this.evaluateShortCircuitOperation(this.requireBinaryOperation(tree), scope);
                    case '()':
                        return this.evaluatedExpressionValue(this.requirePrefixOperation(tree).right, scope, 'parenthesized expression');
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        return this.evaluateUnaryOperation(this.requirePrefixOperation(tree), scope);
                    case '++_':
                    case '--_':
                        return (this.opTable[tree.type] as IncDecOperator)(this.requirePrefixOperation(tree).right, scope);
                    case ".'":
                    case "'":
                        return this.evaluateUnaryOperation(this.requirePostfixOperation(tree), scope);
                    case '_++':
                    case '_--':
                        return (this.opTable[tree.type] as IncDecOperator)(this.requirePostfixOperation(tree).left, scope);
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
                    case '|=': {
                        /* `tree` is an assignment */
                        const assignmentTree = this.requireBinaryOperation(tree);
                        const assignment = this.validateAssignment(assignmentTree.left, true, scope);
                        const assignmentOperator = assignmentTree.type as OperatorType;
                        const op: OperatorType | '' = assignmentOperator.substring(0, assignmentOperator.length - 1) as OperatorType | '';
                        if (assignment.length > 1 && op.length > 0) {
                            this.context.throwEvalError('computed multiple assignment not allowed.');
                        }
                        let right: NodeExpr;
                        let undefinedReference: string | undefined;
                        let error: Error | undefined;
                        this.context.pushForwardReferenceTargets(assignment.map(({ id }) => id).filter((id) => id !== '~'));
                        this.context.pushRequestedOutputCount(assignment.length);
                        this.context.pushRequestedOutputMask(assignment.map(({ id }) => id !== '~'));
                        try {
                            right = AST.isNodeReturnList(assignmentTree.right) ? assignmentTree.right : MathOperation.copy(this.Evaluator(assignmentTree.right, scope));
                        } catch (e: unknown) {
                            if (!this.context.allowForwardReference) {
                                throw e as Error;
                            }
                            if (!this.isLocalUndefinedReference(e)) {
                                throw e as Error;
                            }
                            error = e as Error;
                            right = MathOperation.copy(assignmentTree.right);
                            undefinedReference = e.identifier;
                        } finally {
                            this.context.popRequestedOutputMask();
                            this.context.popRequestedOutputCount();
                            this.context.popForwardReferenceTargets();
                        }
                        const rightReturnList = AST.ensureReturnList(right);
                        const resultList = AST.nodeListFirst();
                        const evaluated = rightReturnList.handler(assignment.length);
                        const selectRightValue = (index: number): NodeExpr => {
                            const value = rightReturnList.selector(evaluated, index);
                            if (typeof value === 'undefined') {
                                AST.throwErrorIfGreaterThanReturnList(index, index + 1, (message) => this.context.throwEvalError(message));
                            }
                            return value;
                        };
                        for (let n = 0; n < assignment.length; n++) {
                            const { id, index, delimiter, field, descriptors } = assignment[n];
                            if (id !== '~') {
                                /* Apply one assignment target. */
                                if (descriptors && descriptors.length > 0 && !op) {
                                    const entry = scope.resolveName(id);
                                    const rightValue = this.evaluatedExpressionValue(selectRightValue(n), scope, 'assignment value');
                                    if (entry && ClassInstance.isInstanceOf(entry.node) && !this.context.canAccessClassMember(entry.node.classDefinition, 'private')) {
                                        const updated = this.callClassSubsasgnDescriptors(entry.node, descriptors, rightValue, tree);
                                        if (updated) {
                                            entry.node = updated;
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                            continue;
                                        }
                                    }
                                    if (entry && (ClassInstance.isInstanceOf(entry.node) || (MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node)))) {
                                        const assigned = this.assignClassSubsasgnDescriptors(
                                            entry.node,
                                            descriptors.map((item) => this.readNativeSubscriptDescriptor(item, 'subsasgn')),
                                            rightValue,
                                            tree,
                                        );
                                        if (typeof assigned !== 'undefined') {
                                            entry.node = assigned;
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                            continue;
                                        }
                                    }
                                    if (!entry && this.shouldUseNativeChainedSubsasgn(descriptors)) {
                                        const firstDescriptor = this.readNativeSubscriptDescriptor(descriptors[0]);
                                        const initialValue = this.blankNativeSubsasgnValue(firstDescriptor);
                                        const assigned = this.assignNativeSubsasgnDescriptors(initialValue, descriptors, rightValue);
                                        const newEntry = scope.defineName(id, assigned);
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), newEntry.node));
                                        continue;
                                    }
                                    if (
                                        entry &&
                                        this.shouldUseNativeChainedSubsasgn(descriptors) &&
                                        (MultiArray.isInstanceOf(entry.node) || Structure.isInstanceOf(entry.node) || Structure.isStructure(entry.node)) &&
                                        !(MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node))
                                    ) {
                                        entry.node = this.assignNativeSubsasgnDescriptors(entry.node, descriptors, rightValue);
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                        continue;
                                    }
                                }
                                if (descriptors && descriptors.length > 0 && op) {
                                    const entry = scope.resolveName(id);
                                    if (!entry) {
                                        this.context.throwEvalError(`in computed assignment ${id} OP= X, ${id} must be defined first.`);
                                    }
                                    if (
                                        this.shouldUseNativeChainedSubsasgn(descriptors) &&
                                        (MultiArray.isInstanceOf(entry.node) || Structure.isInstanceOf(entry.node) || Structure.isStructure(entry.node)) &&
                                        !(MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node))
                                    ) {
                                        const currentValue = this.nativeSubsrefDescriptors(entry.node, descriptors);
                                        const computedValue = this.evaluatedExpressionValue(
                                            AST.nodeOperation(
                                                op,
                                                this.compoundAssignmentOperand(currentValue, 'compound assignment target value'),
                                                this.evaluatedExpressionValue(selectRightValue(n), scope, 'assignment value'),
                                            ),
                                            scope,
                                            'compound assignment value',
                                        );
                                        entry.node = this.assignNativeSubsasgnDescriptors(entry.node, descriptors, computedValue);
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                        continue;
                                    }
                                }
                                if (index) {
                                    /* Computed assignment to an indexed matrix element. */
                                    if (op) {
                                        const entry = scope.resolveName(id);
                                        if (typeof entry !== 'undefined') {
                                            if (!FunctionHandle.isInstanceOf(entry.node)) {
                                                const evaluatedIndex = this.evaluatedIndexArguments(index, scope);
                                                if (
                                                    field.length > 0 &&
                                                    AST.isNodeIndexExpr(assignmentTree.left) &&
                                                    AST.isNodeIndirectRef(assignmentTree.left.expr) &&
                                                    (Structure.isInstanceOf(entry.node) || (MultiArray.isInstanceOf(entry.node) && Structure.isStructure(entry.node)))
                                                ) {
                                                    const fieldValue = Structure.getField(entry.node, field);
                                                    if (MultiArray.isInstanceOf(fieldValue) && !MultiArray.isEmpty(fieldValue)) {
                                                        const computedValue = this.evaluatedExpressionValue(
                                                            AST.nodeOperation(
                                                                op,
                                                                MultiArray.getElements(fieldValue, '__field_assignment__', [], evaluatedIndex, this),
                                                                MultiArray.scalarToMultiArray(this.evaluatedExpressionValue(selectRightValue(n), scope, 'assignment value')),
                                                            ),
                                                            scope,
                                                            'compound field assignment value',
                                                        );
                                                        const tempScope = Scope.create();
                                                        tempScope.defineName('__field_assignment__', fieldValue);
                                                        MultiArray.setElements(
                                                            tempScope,
                                                            '__field_assignment__',
                                                            [],
                                                            evaluatedIndex,
                                                            this.indexedAssignmentRhs(delimiter, computedValue, fieldValue),
                                                            undefined,
                                                            this,
                                                        );
                                                        Structure.setNewField(
                                                            entry.node,
                                                            field,
                                                            this.runtimeExpressionValue(
                                                                this.scopedExpressionValue(tempScope, '__field_assignment__', 'field assignment result'),
                                                                'field assignment result',
                                                            ),
                                                        );
                                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                                        continue;
                                                    }
                                                }
                                                /* Read-modify-write assignment on an indexed matrix element. */
                                                MultiArray.setElements(
                                                    scope,
                                                    id,
                                                    field,
                                                    evaluatedIndex,
                                                    MultiArray.scalarToMultiArray(
                                                        this.evaluatedExpressionValue(
                                                            AST.nodeOperation(
                                                                op,
                                                                MultiArray.getElements(entry.node, id, field, evaluatedIndex),
                                                                MultiArray.scalarToMultiArray(this.evaluatedExpressionValue(selectRightValue(n), scope, 'assignment value')),
                                                            ),
                                                            scope,
                                                            'compound assignment value',
                                                        ),
                                                    ),
                                                );
                                                AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                                continue;
                                            } else {
                                                this.context.throwEvalError(`can't perform indexed assignment for function handle type.`);
                                            }
                                        } else {
                                            this.context.throwEvalError(`in computed assignment ${id}(index) OP= X, ${id} must be defined first.`);
                                        }
                                    } else {
                                        /* Direct assignment to an indexed matrix element. */
                                        const rightValue = this.evaluatedExpressionValue(selectRightValue(n), scope, 'assignment value');
                                        const entry = scope.resolveName(id);
                                        if (entry && ClassInstance.isInstanceOf(entry.node) && field.length === 0) {
                                            const updated = this.callClassSubsasgn(entry.node, index, delimiter ?? '()', rightValue, tree, scope);
                                            if (updated) {
                                                entry.node = updated;
                                                AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                                continue;
                                            }
                                        }
                                        if (entry && MultiArray.isInstanceOf(entry.node) && field.length === 0 && this.hasClassInstanceElement(entry.node)) {
                                            const evaluatedIndex = this.evaluatedIndexArguments(index, scope);
                                            try {
                                                const selected = MultiArray.MultiArrayToScalar(this.reducedIndexingResult(MultiArray.getElements(entry.node, id, [], evaluatedIndex)));
                                                if (ClassInstance.isInstanceOf(selected)) {
                                                    const updated = this.callClassSubsasgn(selected, index, delimiter ?? '()', rightValue, tree, scope);
                                                    if (updated) {
                                                        MultiArray.setElements(scope, id, [], evaluatedIndex, MultiArray.scalarToMultiArray(updated));
                                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), scope.resolveName(id)!.node));
                                                        continue;
                                                    }
                                                }
                                            } catch (error) {
                                                if (!(error instanceof RangeError)) {
                                                    throw error;
                                                }
                                            }
                                        }
                                        if (entry && MultiArray.isInstanceOf(entry.node) && field.length > 0 && this.hasClassInstanceElement(entry.node)) {
                                            entry.node = this.assignClassArrayIndexedNestedField(id, entry.node, index, field, rightValue, assignmentTree.left, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                            continue;
                                        }
                                        if (entry && CharString.isInstanceOf(entry.node) && field.length === 0) {
                                            if (delimiter === '{}') {
                                                this.context.throwEvalError('matrix cannot be indexed with {');
                                            }
                                            const target = MultiArray.characterVectorFromCharString(entry.node);
                                            const tempScope = Scope.create();
                                            tempScope.defineName('__char_assignment__', target);
                                            MultiArray.setElements(
                                                tempScope,
                                                '__char_assignment__',
                                                [],
                                                this.evaluatedIndexArguments(index, scope),
                                                this.charStringAssignmentRhs(rightValue, entry.node.quote),
                                                undefined,
                                                this,
                                            );
                                            entry.node = MultiArray.charStringFromCharacterVectorResult(
                                                this.scopedMultiArrayValue(tempScope, '__char_assignment__', 'character assignment result'),
                                                entry.node.quote,
                                            );
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                            continue;
                                        }
                                        if (
                                            entry &&
                                            field.length > 0 &&
                                            AST.isNodeIndexExpr(assignmentTree.left) &&
                                            AST.isNodeIndirectRef(assignmentTree.left.expr) &&
                                            (Structure.isInstanceOf(entry.node) || (MultiArray.isInstanceOf(entry.node) && Structure.isStructure(entry.node)))
                                        ) {
                                            const fieldValue = Structure.getField(entry.node, field);
                                            if (MultiArray.isInstanceOf(fieldValue) && !MultiArray.isEmpty(fieldValue)) {
                                                const tempScope = Scope.create();
                                                tempScope.defineName('__field_assignment__', fieldValue);
                                                MultiArray.setElements(
                                                    tempScope,
                                                    '__field_assignment__',
                                                    [],
                                                    this.evaluatedIndexArguments(index, scope),
                                                    this.indexedAssignmentRhs(delimiter, rightValue, fieldValue),
                                                );
                                                Structure.setNewField(
                                                    entry.node,
                                                    field,
                                                    this.runtimeExpressionValue(
                                                        this.scopedExpressionValue(tempScope, '__field_assignment__', 'field assignment result'),
                                                        'field assignment result',
                                                    ),
                                                );
                                                AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                                continue;
                                            }
                                        }
                                        MultiArray.setElements(
                                            scope,
                                            id,
                                            field,
                                            this.evaluatedIndexArguments(index, scope),
                                            this.indexedAssignmentRhs(delimiter, rightValue, field.length === 0 ? entry?.node : undefined, field.length > 0),
                                        );
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(scope.resolveName(id)!.node)));
                                    }
                                } else {
                                    /* Name or structure-field assignment. */
                                    const rightN = selectRightValue(n);
                                    rightN.parent = assignmentTree.right;
                                    let catchAssignmentValue: NodeInput = rightN;
                                    try {
                                        if (field.length > 0) {
                                            let entry = scope.resolveName(id);
                                            if (op.length && typeof entry === 'undefined') {
                                                this.context.throwEvalError(`in computed assignment ${id}.${field.join('.')} OP= X, ${id}.${field.join('.')} must be defined first.`);
                                            }
                                            if (typeof entry === 'undefined') {
                                                entry = scope.defineName(id, new Structure({}));
                                            } else if (MultiArray.isInstanceOf(entry.node) && !entry.node.isCell && MultiArray.isEmpty(entry.node) && !Structure.isStructure(entry.node)) {
                                                entry.node = new Structure({});
                                            }
                                            const fieldExpressionValue = (): NodeExpr => {
                                                if (Structure.isInstanceOf(entry.node) || (MultiArray.isInstanceOf(entry.node) && Structure.isStructure(entry.node))) {
                                                    return this.expressionValue(Structure.getField(entry.node, field), `field ${field.join('.')}`);
                                                }
                                                if (ClassInstance.isInstanceOf(entry.node)) {
                                                    return this.expressionValue(this.resolveClassFieldChain(entry.node, field, tree), `field ${field.join('.')}`);
                                                }
                                                if (MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node)) {
                                                    return this.expressionValue(this.resolveClassFieldChain(entry.node, field, tree), `field ${field.join('.')}`);
                                                }
                                                this.context.throwEvalError('in indexed assignment.');
                                            };
                                            const expr = op.length
                                                ? typeof error !== 'undefined'
                                                    ? AST.nodeOperation(op as OperatorType, fieldExpressionValue(), rightN)
                                                    : this.Evaluator(AST.nodeOperation(op as OperatorType, fieldExpressionValue(), rightN))
                                                : rightN;
                                            catchAssignmentValue = expr;
                                            if (Structure.isInstanceOf(entry.node)) {
                                                this.assignStructureFieldValue(entry.node, field, this.structureAssignmentValue(expr, `field ${field.join('.')}`), false);
                                            } else if (MultiArray.isInstanceOf(entry.node) && Structure.isStructure(entry.node)) {
                                                this.assignStructureFieldValue(entry.node, field, this.structureAssignmentValue(expr, `field ${field.join('.')}`), op.length > 0);
                                            } else if (ClassInstance.isInstanceOf(entry.node)) {
                                                const value = this.reducedAssignmentValue(expr);
                                                entry.node = this.assignNestedClassInstanceField(entry.node, field, value, tree, scope);
                                            } else if (MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node)) {
                                                entry.node = this.assignNestedClassArrayField(entry.node, field, this.reducedAssignmentValue(expr), tree, scope);
                                            } else if (ClassEventListener.isInstanceOf(entry.node)) {
                                                if (field.length !== 1) {
                                                    this.context.throwEvalError(`cannot assign nested property '${field.join('.')}' for ${entry.node.kind}.`);
                                                }
                                                this.setClassEventListenerField(entry.node, field[0], this.reducedAssignmentValue(expr));
                                            } else if (ClassEventData.isInstanceOf(entry.node) || ClassPropertyEvent.isInstanceOf(entry.node)) {
                                                if (field.length !== 1) {
                                                    this.context.throwEvalError(
                                                        `cannot assign nested property '${field.join('.')}' for ${ClassPropertyEvent.isInstanceOf(entry.node) ? 'event.PropertyEvent' : 'event.EventData'}.`,
                                                    );
                                                }
                                                this.setClassEventDataField(entry.node, field[0]);
                                            } else {
                                                this.context.throwEvalError('in indexed assignment.');
                                            }
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                        } else {
                                            const expr = op.length
                                                ? typeof error !== 'undefined'
                                                    ? AST.nodeOperation(op as OperatorType, AST.nodeIdentifier(id), rightN)
                                                    : this.Evaluator(AST.nodeOperation(op as OperatorType, AST.nodeIdentifier(id), rightN))
                                                : rightN;
                                            catchAssignmentValue = expr;
                                            let entry: NameEntry;
                                            if (undefinedReference) {
                                                if (this.context.allowForwardReference) {
                                                    scope.defineUndefinedReference(undefinedReference, id);
                                                    entry = scope.assignName(id, this.reducedAssignmentValue(expr), undefinedReference);
                                                } else {
                                                    if (error) throw error;
                                                    this.context.throwUndefinedReferenceError(undefinedReference);
                                                }
                                            } else {
                                                entry = scope.assignName(id, this.reducedAssignmentValue(expr));
                                            }
                                            this.solveUndefined(id, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), RuntimeValue.copy(entry.node)));
                                            if (error) throw error;
                                        }
                                    } catch (e: unknown) {
                                        if (this.context.allowForwardReference && this.isLocalUndefinedReference(e)) {
                                            scope.assignName(id, catchAssignmentValue, undefinedReference);
                                        }
                                        throw e as Error;
                                    }
                                }
                            }
                        }
                        if (!tree.parent || !tree.parent.parent) {
                            /* Assignment at the root expression returns the assignment result. */
                            if (resultList.list.length === 1) {
                                /* Single assignment returns its only assignment node. */
                                return resultList.list[0];
                            } else {
                                /* Multiple assignment returns the whole result list. */
                                return resultList;
                            }
                        } else {
                            /* Nested assignment returns the assigned value. */
                            return this.nestedAssignmentValue(resultList);
                        }
                    }
                    case 'IDENT':
                        return this.context.resolveIdentifier(tree, scope);
                    case 'RETURN':
                        throw new ReturnSignal();
                    case 'BREAK':
                        throw new BreakSignal();
                    case 'CONTINUE':
                        throw new ContinueSignal();
                    case 'FCNDEF': {
                        const func = AST.isNodeFunctionDefinition(tree) ? tree : this.context.throwEvalError(`invalid function definition AST node '${tree.type}'.`);
                        if (this.isNodeInsideExecutableBlock(func)) {
                            this.context.throwSyntaxError(`function definition '${func.id}' is not allowed inside a control block.`);
                        }
                        if (this.context.currentFrame?.func?.type === 'FCNDEF' && scope.hasLocalFunction(func.id)) {
                            return AST.nodeVoid();
                        }
                        if (scope.functionTable[func.id] === func) {
                            return AST.nodeVoid();
                        }
                        this.registerFunctionDefinition(func, scope, this.context.currentFrame?.func?.type === 'FCNDEF');
                        /* MATLAB-like behavior: function definition does not execute anything. */
                        return AST.nodeVoid();
                    }
                    case 'CLASSDEF':
                        {
                            const classDef = AST.isNodeClassDef(tree) ? tree : this.context.throwEvalError(`invalid class definition AST node '${tree.type}'.`);
                            if (this.isNodeInsideExecutableBlock(classDef)) {
                                this.context.throwSyntaxError(`class definition '${classDef.id}' is not allowed inside a control block.`);
                            }
                            const definition = ClassDefinition.create(classDef);
                            definition.resolveSuperclasses(
                                (name) => this.context.resolveClassDefinition(name, scope),
                                (message) => this.context.throwEvalError(message),
                            );
                            this.context.defineClassDefinition(definition, scope);
                        }
                        return AST.nodeVoid();
                    case 'GLOBAL': {
                        for (const declaration of tree.list) {
                            const declarationNode = AST.getDeclarationNode(declaration);
                            if (AST.isNodeIdentifier(declarationNode)) {
                                this.context.declareGlobal(declarationNode.id, undefined, scope);
                            } else if (AST.isNodeDefaultedParameter(declarationNode)) {
                                const value = this.runtimeExpressionValue(
                                    this.evaluatedExpressionValue(declarationNode.right, scope, `global ${declarationNode.left.id} default`),
                                    `global ${declarationNode.left.id} default`,
                                );
                                this.context.declareGlobal(declarationNode.left.id, value, scope);
                            } else {
                                this.context.throwSyntaxError('invalid global declaration.');
                            }
                        }
                        return AST.nodeVoid();
                    }
                    case 'PERSIST': {
                        for (const declaration of tree.list) {
                            const declarationNode = AST.getDeclarationNode(declaration);
                            if (AST.isNodeIdentifier(declarationNode)) {
                                this.context.declarePersistent(declarationNode.id, undefined, scope);
                            } else if (AST.isNodeDefaultedParameter(declarationNode)) {
                                const value = this.runtimeExpressionValue(
                                    this.evaluatedExpressionValue(declarationNode.right, scope, `persistent ${declarationNode.left.id} default`),
                                    `persistent ${declarationNode.left.id} default`,
                                );
                                this.context.declarePersistent(declarationNode.left.id, value, scope);
                            } else {
                                this.context.throwSyntaxError('invalid persistent declaration.');
                            }
                        }
                        return AST.nodeVoid();
                    }
                    case 'IMPORT':
                        if (tree.imports.length === 0) {
                            const result = MultiArray.toColumnVector(scope.importList().map((qualifiedName) => CharString.create(qualifiedName)));
                            result.isCell = true;
                            return result;
                        }
                        for (const importName of tree.imports) {
                            this.context.defineImport(importName.id, scope);
                        }
                        return AST.nodeVoid();
                    case '.': {
                        const qualifiedNameAccess = this.resolveQualifiedNameAccess(tree, scope);
                        if (typeof qualifiedNameAccess !== 'undefined') {
                            return qualifiedNameAccess;
                        }
                        if (!this.hasQualifiedNameAccessOperand(tree, scope)) {
                            const chain = this.collectClassSubsrefChain(tree, scope);
                            if (chain && chain.descriptors.length > 0 && !this.context.canAccessClassMember(chain.instance.classDefinition, 'private')) {
                                const chainedResult = this.callClassSubsrefDescriptors(chain.instance, chain.descriptors, tree);
                                if (typeof chainedResult !== 'undefined') {
                                    return chainedResult;
                                }
                            }
                        }
                        const fields = tree.field.map((field: NodeExpr) => {
                            if (typeof field === 'string') {
                                return field;
                            }
                            return this.evaluatedDynamicFieldName(field, scope, `Dynamic structure field names must be strings.`);
                        });
                        const commaReceiver = this.evaluatedCommaSeparatedReceiver(tree.obj, scope);
                        if (commaReceiver) {
                            return this.chainedCommaListResult(commaReceiver.map((value) => this.resolveDotFieldChain(value, fields, tree, scope)));
                        }
                        const obj = this.evaluatedExpressionValue(tree.obj, scope, 'dot receiver');
                        return this.resolveDotFieldChain(obj, fields, tree, scope);
                    }
                    case 'SUPERCLASS_CTOR': {
                        const node = tree as NodeSuperclassConstructor;
                        const directTarget = node.instance.type === 'IDENT' ? scope.resolveName(node.instance.id)?.node : undefined;
                        if (node.instance.type === 'IDENT' && !ClassInstance.isInstanceOf(directTarget)) {
                            if (node.args.length === 0) {
                                this.context.throwEvalError(`superclass method '${node.instance.id}' requires an object argument.`);
                            }
                            const receiver = this.evaluatedExpressionValue(node.args[0], scope, 'superclass method receiver');
                            if (!ClassInstance.isInstanceOf(receiver)) {
                                this.context.throwEvalError(`superclass method '${node.instance.id}' requires a class instance.`);
                            }
                            const superclassDefinition = receiver.classDefinition.findSuperclass(node.superclass.id);
                            if (!superclassDefinition) {
                                this.context.throwEvalError(`class ${node.superclass.id} is not a superclass of class ${receiver.classDefinition.name}.`);
                            }
                            if (!this.context.canAccessClassMember(superclassDefinition, 'protected')) {
                                this.context.throwEvalError(`superclass method '${node.instance.id}' is only accessible from class methods.`);
                            }
                            const method = superclassDefinition.findMethod(node.instance.id, (item) => !item.isStatic);
                            if (!method) {
                                this.context.throwEvalError(`unknown superclass method '${node.instance.id}' for class ${superclassDefinition.name}.`);
                            }
                            if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
                                this.context.throwEvalError(`method '${node.instance.id}' has ${method.access} access for class ${receiver.classDefinition.name}.`);
                            }
                            return this.context.callClassInstanceMethod(receiver, method, node.args.slice(1), node);
                        }
                        const instance = ClassInstance.isInstanceOf(directTarget) ? directTarget : this.evaluatedExpressionValue(node.instance, scope, 'superclass constructor receiver');
                        if (!ClassInstance.isInstanceOf(instance)) {
                            this.context.throwEvalError('superclass constructor target must be a class instance.');
                        }
                        const superclassDefinition = instance.classDefinition.findSuperclass(node.superclass.id);
                        if (!superclassDefinition) {
                            this.context.throwEvalError(`class ${node.superclass.id} is not a superclass of class ${instance.classDefinition.name}.`);
                        }
                        if (!this.context.canAccessClassMember(superclassDefinition, 'protected')) {
                            this.context.throwEvalError(`superclass constructor '${node.superclass.id}' is only accessible from class methods.`);
                        }
                        return this.context.constructSuperclassInstance(instance, superclassDefinition, node.args, node);
                    }
                    case 'METACLASS': {
                        return this.resolveMetaclassLiteral(tree.className.id, scope);
                    }
                    case 'LIST': {
                        this.preregisterScriptLocalFunctions(tree, scope);
                        const result = {
                            type: 'LIST',
                            list: new Array(tree.list.length),
                            parent: tree.parent === null ? null : tree,
                        };
                        let n = 0;
                        let stoppedByTopLevelReturn = false;
                        for (let i = 0; i < tree.list.length; i++) {
                            /* Convert undefined name, defined in word-list command, to word-list command.
                             * (Null length word-list command) */
                            if (AST.isNodeIdentifier(tree.list[i]) && !scope.resolveName(tree.list[i].id) && this.commandWordListNameSet.has(tree.list[i].id)) {
                                tree.list[i] = AST.nodeEmptyCmdWList(tree.list[i]);
                            }
                            /* PHASE 1: Prepare input node. */
                            tree.list[i].index = i;
                            /* Evaluate */
                            let item: NodeInput;
                            try {
                                item = this.evaluatedExecutionResult(tree.list[i], scope);
                            } catch (e: unknown) {
                                if (e instanceof ReturnSignal && tree.parent === null && !this.context.isInsideUserFunction() && this.scriptExecutionDepth === 0) {
                                    stoppedByTopLevelReturn = true;
                                    break;
                                }
                                throw e;
                            }
                            if (item.type === 'LIST') {
                                /* Flatten list. */
                                for (let j = 0; j < item.list.length; j++) {
                                    const sub = item.list[j];
                                    if (sub.type === 'VOID') continue;
                                    /* PHASE 2: Adjust evaluated node. */
                                    item.list[j].parent = result;
                                    item.list[j].index = n;
                                    result.list[n] = sub;
                                    if (tree.parent === null && !sub.omitAnswer) {
                                        scope.defineName('ans', sub);
                                    }
                                    n++;
                                }
                            } else {
                                if (item.type === 'VOID') {
                                    const placeholder = tree.list[i];
                                    placeholder.omitAnswer = true;
                                    placeholder.omitOutput = true;
                                    placeholder.parent = result;
                                    placeholder.index = n;
                                    result.list[n] = placeholder;
                                    n++;
                                } else {
                                    /* PHASE 2: Adjust evaluated node. */
                                    item.parent = result;
                                    item.index = n;
                                    result.list[n] = item;
                                    if (tree.parent === null && !item.omitAnswer) {
                                        scope.defineName('ans', item);
                                    }
                                    n++;
                                }
                            }
                        }
                        result.list.length = n;
                        if (stoppedByTopLevelReturn && n === 0) {
                            return AST.nodeVoid();
                        }
                        const visible = result.list.filter((node: NodeInput) => !node.omitOutput);
                        if (visible.length > 0 && visible.length < result.list.length) {
                            result.list = visible;
                            result.list.forEach((node: NodeInput, index: number) => {
                                node.parent = result;
                                node.index = index;
                            });
                        }
                        return result;
                    }
                    case 'RANGE': {
                        const start = this.evaluatedExpressionValue(tree.start_, scope, 'range start');
                        const stop = this.evaluatedExpressionValue(tree.stop_, scope, 'range stop');
                        const stride = tree.stride_ ? this.evaluatedExpressionValue(tree.stride_, scope, 'range stride') : null;
                        const overload = this.evaluateColonWithClassDispatch(stride ? [start, stride, stop] : [start, stop], tree);
                        if (overload) {
                            return overload;
                        }
                        return MultiArray.expandRange(start, stop, stride);
                    }
                    case 'ENDRANGE': {
                        let parent = tree.parent;
                        let index = tree.index;
                        /* Search for 'IDX' node until reach 'IDX' or root node */
                        while (AST.isNodeBase(parent) && parent.type !== 'IDX') {
                            index = parent.index;
                            parent = parent.parent;
                        }
                        if (AST.isNodeIndexExpr(parent)) {
                            const expr = this.evaluatedExpressionValue(parent.expr, scope, 'indexed expression');
                            if (ClassInstance.isInstanceOf(expr)) {
                                const customEnd = this.callClassEnd(expr, index + 1, parent.args.length, parent);
                                if (typeof customEnd !== 'undefined') {
                                    return customEnd;
                                }
                                return Complex.one();
                            } else if (MultiArray.isInstanceOf(expr)) {
                                return parent.args.length === 1 ? Complex.create(MultiArray.linearLength(expr)) : Complex.create(MultiArray.getDimension(expr, index));
                            } else if (CharString.isInstanceOf(expr)) {
                                return Complex.create(expr.length);
                            } else {
                                return Complex.one();
                            }
                        } else {
                            this.context.throwSyntaxError("indeterminate end of range. The word 'end' to refer a value is valid only in indexing.");
                        }
                    }
                    case ':':
                        if (AST.isNodeIndexExpr(tree.parent)) {
                            const expr = this.evaluatedExpressionValue(tree.parent.expr, scope, 'indexed expression');
                            if (MultiArray.isInstanceOf(expr)) {
                                return tree.parent.args.length === 1
                                    ? MultiArray.expandColon(MultiArray.linearLength(expr))
                                    : MultiArray.expandColon(MultiArray.getDimension(expr, tree.index));
                            } else if (CharString.isInstanceOf(expr)) {
                                return MultiArray.expandColon(expr.length);
                            } else {
                                return Complex.one();
                            }
                        } else {
                            this.context.throwSyntaxError('indeterminate colon. The colon to refer a range is valid only in indexing.');
                        }
                    case 'IDX': {
                        if (!tree.expr) {
                            this.context.throwReferenceError(`'${tree.id}' undefined.`);
                        }
                        const inheritedHandleMethod = this.inheritedHandleMethodCall(tree, scope);
                        if (typeof inheritedHandleMethod !== 'undefined') {
                            return inheritedHandleMethod;
                        }
                        if (!this.hasQualifiedNameAccessOperand(tree, scope) && AST.isNodeIndirectRef(tree.expr)) {
                            const dottedCommaReceiver = this.dottedCommaReceiver(tree.expr, scope);
                            if (dottedCommaReceiver) {
                                const fields = dottedCommaReceiver.fields.map((field: string | NodeExpr) => {
                                    if (typeof field === 'string') {
                                        return field;
                                    }
                                    return this.evaluatedDynamicFieldName(field, scope, `Dynamic structure field names must be strings.`);
                                });
                                return this.chainedCommaListResult(
                                    dottedCommaReceiver.values.map((value) => {
                                        const fieldValue = this.resolveDotFieldChain(value, fields, tree.expr!, scope);
                                        return this.chainedCommaItemApply(fieldValue, tree.args, tree);
                                    }),
                                );
                            }
                        }
                        if (!this.hasQualifiedNameAccessOperand(tree, scope)) {
                            const chain = this.collectClassSubsrefChain(tree, scope);
                            if (chain && chain.descriptors.length > 0) {
                                const chainedResult = this.callClassSubsrefDescriptors(chain.instance, chain.descriptors, tree);
                                if (typeof chainedResult !== 'undefined') {
                                    return chainedResult;
                                }
                            }
                        }
                        const commaReceiver = this.evaluatedCommaSeparatedReceiver(tree.expr, scope);
                        if (commaReceiver) {
                            return this.chainedCommaListResult(commaReceiver.map((value) => this.chainedCommaItemApply(value, tree.args, tree)));
                        }
                        const expr = this.evaluatedExpressionValue(tree.expr, scope, 'indexed expression');
                        if (ClassInstance.isInstanceOf(expr)) {
                            const subsrefResult = this.callClassSubsref(expr, tree, scope);
                            if (typeof subsrefResult !== 'undefined') {
                                return subsrefResult;
                            }
                        }
                        return this.context.apply(expr, tree.args, tree);
                    }
                    case 'CMDWLIST': {
                        const entry = this.commandWordListTable[tree.id];
                        if (!entry) {
                            this.context.throwUndefinedReferenceError(tree.id);
                        }
                        const result = this.commandWordListResult(entry.func(...tree.args.map((word: CharString) => word.str)));
                        return typeof result !== 'undefined' ? result : tree;
                    }
                    case 'IF': {
                        for (let ifTest = 0; ifTest < tree.expression.length; ifTest++) {
                            if (this.evaluatedCondition(tree.expression[ifTest], scope, 'if condition')) {
                                return this.evaluatedExecutionResult(tree.then[ifTest], scope);
                            }
                        }
                        /* No one `then` clause. */
                        if (tree.else) {
                            return this.evaluatedExecutionResult(tree.else, scope);
                        }
                        /* Return null NodeList. */
                        return {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                    }
                    case 'SWITCH': {
                        const switchValue = this.evaluatedExpressionValue(tree.expression, scope, 'switch expression');
                        for (const switchCase of tree.cases) {
                            const caseValue = this.evaluatedExpressionValue(switchCase.expression, scope, 'switch case');
                            if (this.switchCaseMatches(switchValue, caseValue)) {
                                return this.evaluatedExecutionResult(switchCase.then, scope);
                            }
                        }
                        if (tree.otherwise) {
                            return this.evaluatedExecutionResult(tree.otherwise, scope);
                        }
                        return {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                    }
                    case 'WHILE': {
                        let result: NodeInput = {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                        while (true) {
                            if (!this.evaluatedCondition(tree.expression, scope, 'while condition')) {
                                return result;
                            }
                            try {
                                result = this.evaluatedExecutionResult(tree.body, scope);
                            } catch (e: unknown) {
                                if (e instanceof ContinueSignal) {
                                    continue;
                                }
                                if (e instanceof BreakSignal) {
                                    return result;
                                }
                                throw e;
                            }
                        }
                    }
                    case 'DO_UNTIL': {
                        let result: NodeInput = {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                        while (true) {
                            try {
                                result = this.evaluatedExecutionResult(tree.body, scope);
                            } catch (e: unknown) {
                                if (e instanceof BreakSignal) {
                                    return result;
                                }
                                if (!(e instanceof ContinueSignal)) {
                                    throw e;
                                }
                            }
                            if (this.evaluatedCondition(tree.expression, scope, 'until condition')) {
                                return result;
                            }
                        }
                    }
                    case 'FOR': {
                        let result: NodeInput = {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                        if (tree.workers) {
                            this.workerCountControlArgument(this.evaluatedExpressionValue(tree.workers, scope, 'parfor workers'), 'parfor workers');
                        }
                        const loopExpression = this.evaluatedExpressionValue(tree.expression, scope, 'for expression');
                        if (tree.parallel) {
                            this.validateParforHeader(tree.target, loopExpression);
                            this.validateParforBody(tree.body, (tree.target as NodeIdentifier).id);
                        }
                        const values = this.forLoopValues(loopExpression, tree.target);
                        for (const value of values) {
                            const assignment = AST.nodeOperation('=', this.cloneAssignmentTarget(tree.target), this.forLoopAssignmentValue(tree.target, value));
                            this.Evaluator(assignment, scope);
                            try {
                                result = this.evaluatedExecutionResult(tree.body, scope);
                            } catch (e: unknown) {
                                if (e instanceof ContinueSignal) {
                                    continue;
                                }
                                if (e instanceof BreakSignal) {
                                    return result;
                                }
                                throw e;
                            }
                        }
                        return result;
                    }
                    case 'SPMD':
                        this.validateSpmdBody(tree.body);
                        if (tree.workers) {
                            const workerCounts = tree.workers.list.map((worker: NodeInput, index: number) =>
                                this.workerCountControlArgument(
                                    this.evaluatedExpressionValue(this.expressionValue(worker, `spmd worker ${index + 1}`), scope, `spmd worker ${index + 1}`),
                                    `spmd worker ${index + 1}`,
                                ),
                            );
                            if (workerCounts.length === 2 && workerCounts[0] > workerCounts[1]) {
                                this.context.throwEvalError('spmd minimum worker count cannot exceed maximum worker count.');
                            }
                        }
                        const localSpmdNames = ['spmdIndex', 'spmdSize'];
                        const savedSpmdNames = new Map<string, NameEntry | undefined>();
                        localSpmdNames.forEach((name: string) => {
                            savedSpmdNames.set(name, scope.hasLocalName(name) ? { ...scope.nameTable[name] } : undefined);
                        });
                        scope.defineName('spmdIndex', Complex.one());
                        scope.defineName('spmdSize', Complex.one());
                        try {
                            return this.evaluatedExecutionResult(tree.body, scope);
                        } finally {
                            localSpmdNames.forEach((name: string) => {
                                const saved = savedSpmdNames.get(name);
                                if (saved) {
                                    scope.nameTable[name] = saved;
                                } else {
                                    scope.removeName(name);
                                }
                            });
                        }
                    case 'TRY': {
                        try {
                            return this.evaluatedExecutionResult(tree.body, scope);
                        } catch (e: unknown) {
                            if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) {
                                throw e;
                            }
                            const errorStruct = this.rememberLastError(e);
                            if (tree.catchBody) {
                                if (tree.catchIdentifier) {
                                    scope.defineName(tree.catchIdentifier.id, errorStruct);
                                }
                                return this.evaluatedExecutionResult(tree.catchBody, scope);
                            }
                            return {
                                type: 'LIST',
                                list: [],
                                parent: tree,
                            };
                        }
                    }
                    case 'UNWIND_PROTECT': {
                        let result: NodeInput = {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                        let thrown: unknown;
                        let didThrow = false;
                        try {
                            result = this.evaluatedExecutionResult(tree.body, scope);
                        } catch (e: unknown) {
                            thrown = e;
                            didThrow = true;
                        }
                        this.evaluatedExecutionResult(tree.cleanup, scope);
                        if (didThrow) {
                            throw thrown;
                        }
                        return result;
                    }
                    default:
                        this.context.throwEvalError(`evaluating undefined type '${tree.type}'.`);
                }
            }
        } else {
            return null;
        }
    }

    /**
     * Evaluate a parsed AST from the top-level entry point.
     *
     * This method resets `exitStatus`, detaches the root parent pointer, and
     * converts loop-control signals that escaped their valid context into
     * user-facing evaluation errors.
     *
     * @param tree AST node to evaluate.
     * @returns Evaluated runtime value or AST result.
     */
    public Evaluate(tree: NodeInput): NodeInput {
        try {
            this._exitStatus = Interpreter.response.OK;
            tree.parent = null;
            this.validateDeclarationPlacement(tree);
            return this.Evaluator(tree);
        } catch (e) {
            if (e instanceof ReturnSignal && !this.context.isInsideUserFunction() && this.scriptExecutionDepth === 0) {
                return AST.nodeVoid();
            }
            this._exitStatus = Interpreter.response.EVAL_ERROR;
            if (e instanceof BreakSignal) {
                try {
                    this.context.throwEvalError('break is only valid inside a loop.');
                } catch (error) {
                    this.lastError = error;
                    throw error;
                }
            }
            if (e instanceof ContinueSignal) {
                try {
                    this.context.throwEvalError('continue is only valid inside a loop.');
                } catch (error) {
                    this.lastError = error;
                    throw error;
                }
            }
            this.lastError = e;
            throw e;
        }
    }

    /**
     * Parse and evaluate source text in one call.
     *
     * @param input Source text to execute.
     * @returns Evaluated runtime value or AST result.
     */
    public Execute(input: string): NodeInput {
        try {
            return this.Evaluate(this.Parse(input));
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    /**
     * Convert an AST/runtime value back to MathJSLab source-like text.
     *
     * The unparser is intentionally normalized rather than source-preserving:
     * it reflects the AST contract used by tests, diagnostics, and display
     * output, not the exact whitespace/comments of the original input.
     *
     * @param tree AST/runtime value to unparse.
     * @param parentPrecedence Parent operator precedence.
     * @returns Normalized source-like text.
     */
    public Unparse(tree: NodeInput, parentPrecedence = 0): string {
        const declarationUnparse = (keyword: string, tree: NodeInput): string => keyword + ' ' + tree.list.map((node: NodeExpr) => this.Unparse(AST.getDeclarationNode(node))).join(' ');
        const nodeListInlineUnparse = (list: NodeInput[]): string => list.map((node) => this.Unparse(node)).join(',');
        const isEmptyListNode = (node: NodeInput | null): boolean => !!node && node.type === 'LIST' && node.list.length === 0;
        const classAttributeListUnparse = (attributes: NodeClassAttribute[]): string =>
            attributes.length > 0 ? '(' + attributes.map((attribute) => this.Unparse(attribute)).join(',') + ')' : '';
        const classSectionEndKeyword = (kind: string): string => {
            switch (kind) {
                case 'PROPERTIES':
                    return 'ENDPROPERTIES';
                case 'METHODS':
                    return 'ENDMETHODS';
                case 'EVENTS':
                    return 'ENDEVENTS';
                case 'ENUMERATION':
                    return 'ENDENUMERATION';
                default:
                    return 'END';
            }
        };
        const functionDefinitionUnparse = (func: NodeFunctionDefinition): string => {
            const returns = func.return.list.length === 0 ? '' : func.return.list.length === 1 ? this.Unparse(func.return.list[0]) : '[' + nodeListInlineUnparse(func.return.list) + ']';
            const params = '(' + nodeListInlineUnparse(func.parameter.list) + ')';
            if (func.attributes?.prototype) {
                return (returns ? returns + '=' : '') + func.id + params;
            }
            const argumentsBlocks = func.arguments.list.length > 0 ? '\n' + func.arguments.list.map((node: NodeInput) => this.Unparse(node)).join('\n') : '';
            return (
                'FUNCTION ' +
                (returns ? returns + '=' : '') +
                func.id +
                params +
                argumentsBlocks +
                (func.statements.list.length > 0 ? '\n' + this.Unparse(func.statements).trimEnd() : '') +
                '\nENDFUNCTION'
            );
        };
        const leftUnparse = (type: NodeType | number, tree: PostfixUnaryOperation) => {
            const precedence = this.nodePrecedence(tree);
            const leftUnparse = this.Unparse(tree.left, precedence);
            return (this.nodePrecedence(tree.left) < precedence ? '(' + leftUnparse + ')' : leftUnparse) + type;
        };
        const rightUnparse = (type: NodeType | number, tree: PrefixUnaryOperation) => {
            const precedence = this.nodePrecedence(tree);
            const rightUnparse = this.Unparse(tree.right, precedence);
            return type + (this.nodePrecedence(tree.right) < precedence ? '(' + rightUnparse + ')' : rightUnparse);
        };
        const isPrefixUnaryOperation = (node: NodeInput): boolean => AST.isNodeOperation(node) && typeof node.type === 'string' && ['!', '~', '+_', '-_', '++_', '--_'].includes(node.type);
        const isParenthesizedPrefixUnaryOperation = (node: NodeInput): boolean =>
            AST.isNodeOperation(node) && node.type === '()' && isPrefixUnaryOperation(this.requirePrefixOperation(node).right);
        const binaryLeftNeedsParentheses = (operation: BinaryOperation): boolean => {
            const precedence = this.nodePrecedence(operation);
            return (
                this.nodePrecedence(operation.left) < precedence ||
                ((operation.type === '^' || operation.type === '.^' || operation.type === '**' || operation.type === '.**') &&
                    (isPrefixUnaryOperation(operation.left) || isParenthesizedPrefixUnaryOperation(operation.left)))
            );
        };
        try {
            if (tree) {
                if (tree === undefined) {
                    return '<UNDEFINED>';
                } else if (Complex.isInstanceOf(tree)) {
                    return Complex.unparse(tree, this, parentPrecedence);
                } else if (CharString.isInstanceOf(tree)) {
                    return CharString.unparse(tree, parentPrecedence);
                } else if (MultiArray.isInstanceOf(tree)) {
                    return MultiArray.unparse(tree, this, parentPrecedence);
                } else if (Structure.isInstanceOf(tree)) {
                    return Structure.unparse(tree, this, parentPrecedence);
                } else if (FunctionHandle.isInstanceOf(tree)) {
                    return FunctionHandle.unparse(tree, this, parentPrecedence);
                } else if (ClassDefinition.isInstanceOf(tree)) {
                    return ClassDefinition.unparse(tree, this);
                } else if (ClassInstance.isInstanceOf(tree)) {
                    return ClassInstance.unparse(tree, this);
                } else if (ClassBoundMethod.isInstanceOf(tree)) {
                    return ClassBoundMethod.unparse(tree, this);
                } else if (ClassStaticMethod.isInstanceOf(tree)) {
                    return ClassStaticMethod.unparse(tree, this);
                } else if (ClassEmptyMethod.isInstanceOf(tree)) {
                    return ClassEmptyMethod.unparse(tree, this);
                } else if (ClassEnumerationValue.isInstanceOf(tree)) {
                    return ClassEnumerationValue.unparse(tree, this);
                } else if (ClassEventListener.isInstanceOf(tree)) {
                    return ClassEventListener.unparse(tree, this);
                } else if (ClassPropertyEvent.isInstanceOf(tree)) {
                    return ClassPropertyEvent.unparse(tree, this);
                } else if (ClassEventData.isInstanceOf(tree)) {
                    return ClassEventData.unparse(tree, this);
                } else if (ClassMetaObject.isInstanceOf(tree)) {
                    return ClassMetaObject.unparse(tree, this);
                } else {
                    switch (tree.type) {
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
                        case '|=': {
                            const operation = this.requireBinaryOperation(tree);
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.Unparse(operation.left, precedence);
                            const rightUnparse = this.Unparse(operation.right, precedence);
                            return (
                                (binaryLeftNeedsParentheses(operation) ? '(' + leftUnparse + ')' : leftUnparse) +
                                tree.type +
                                (this.nodePrecedence(operation.right) < precedence ? '(' + rightUnparse + ')' : rightUnparse)
                            );
                        }
                        case '()': {
                            const operation = this.requirePrefixOperation(tree);
                            const precedence = this.nodePrecedence(operation.right);
                            const rightUnparse = this.Unparse(operation.right, precedence);
                            return precedence < parentPrecedence ? '(' + rightUnparse + ')' : rightUnparse;
                        }
                        case '!':
                        case '~':
                            return rightUnparse(tree.type, this.requirePrefixOperation(tree));
                        case '+_':
                            return rightUnparse('+', this.requirePrefixOperation(tree));
                        case '-_':
                            return rightUnparse('-', this.requirePrefixOperation(tree));
                        case '++_':
                            return rightUnparse('++' as NodeType, this.requirePrefixOperation(tree));
                        case '--_':
                            return rightUnparse('--' as NodeType, this.requirePrefixOperation(tree));
                        case ".'":
                        case "'":
                            return leftUnparse(tree.type, this.requirePostfixOperation(tree));
                        case '_++':
                            return leftUnparse('++' as NodeType, this.requirePostfixOperation(tree));
                        case '_--':
                            return leftUnparse('--' as NodeType, this.requirePostfixOperation(tree));
                        case 'IDENT':
                            return tree.id;
                        case '.':
                            return (
                                this.Unparse(tree.obj) + '.' + tree.field.map((value: string | NodeExpr) => (typeof value === 'string' ? value : '(' + this.Unparse(value) + ')')).join('.')
                            );
                        case 'LIST':
                            return tree.list.map((value: NodeInput) => this.Unparse(value)).join('\n') + '\n';
                        case 'RANGE':
                            if (tree.start_ && tree.stop_) {
                                if (tree.stride_) {
                                    return this.Unparse(tree.start_) + ':' + this.Unparse(tree.stride_) + ':' + this.Unparse(tree.stop_);
                                } else {
                                    return this.Unparse(tree.start_) + ':' + this.Unparse(tree.stop_);
                                }
                            } else {
                                return ':';
                            }
                        case 'ENDRANGE':
                            return 'end';
                        case ':':
                            return ':';
                        case '<~>':
                            return '~';
                        case 'IDX':
                            return this.Unparse(tree.expr) + tree.delim[0] + tree.args.map((value: NodeExpr) => this.Unparse(value)).join(',') + tree.delim[1];
                        case 'SUPERCLASS_CTOR':
                            return (
                                this.Unparse(tree.instance) + '@' + this.Unparse(tree.superclass) + '(' + tree.args.map((value: NodeExpr) => this.Unparse(value).trimEnd()).join(',') + ')'
                            );
                        case 'METACLASS':
                            return '?' + this.Unparse(tree.className);
                        case 'RETLIST':
                            return '<RETLIST>';
                        case 'CMDWLIST':
                            return (tree.id + ' ' + tree.args.map((arg: CharString) => this.Unparse(arg)).join(' ')).trimEnd();
                        case 'ARGVALID': {
                            const size = tree.size.length > 0 ? '(' + nodeListInlineUnparse(tree.size) + ')' : '';
                            const cl = tree.class && !isEmptyListNode(tree.class) ? ' ' + this.Unparse(tree.class).trimEnd() : '';
                            const functions = tree.functions.length > 0 ? ' {' + nodeListInlineUnparse(tree.functions) + '}' : '';
                            const dflt = tree.default ? '=' + this.Unparse(tree.default) : '';
                            return this.Unparse(tree.name) + size + cl + functions + dflt;
                        }
                        case 'ARGS':
                            return (
                                'ARGUMENTS' +
                                (tree.attributes.length > 0 ? ' (' + tree.attributes.map((attribute: NodeIdentifier) => this.Unparse(attribute)).join(',') + ')' : '') +
                                (tree.validation.length > 0 ? '\n' + tree.validation.map((validation: NodeArgumentValidation) => this.Unparse(validation)).join('\n') : '') +
                                '\nENDARGUMENTS'
                            );
                        case 'GLOBAL':
                            return declarationUnparse('global', tree);
                        case 'PERSIST':
                            return declarationUnparse('persistent', tree);
                        case 'IMPORT':
                            return 'import' + (tree.imports.length > 0 ? ' ' + tree.imports.map((entry: NodeIdentifier) => this.Unparse(entry)).join(' ') : '');
                        case 'RETURN':
                            return 'return';
                        case 'BREAK':
                            return 'break';
                        case 'CONTINUE':
                            return 'continue';
                        case 'IF':
                            let ifstr = 'IF ' + this.Unparse(tree.expression[0]) + '\n';
                            ifstr += this.Unparse(tree.then[0]) + '\n';
                            for (let i = 1; i < tree.expression.length; i++) {
                                ifstr += 'ELSEIF ' + this.Unparse(tree.expression[i]) + '\n';
                                ifstr += this.Unparse(tree.then[i]) + '\n';
                            }
                            if (tree.else) {
                                ifstr += 'ELSE' + '\n' + this.Unparse(tree.else) + '\n';
                            }
                            ifstr += 'ENDIF';
                            return ifstr;
                        case 'SWITCH':
                            let switchstr = 'SWITCH ' + this.Unparse(tree.expression) + '\n';
                            for (const switchCase of tree.cases) {
                                switchstr += 'CASE ' + this.Unparse(switchCase.expression) + '\n';
                                switchstr += this.Unparse(switchCase.then) + '\n';
                            }
                            if (tree.otherwise) {
                                switchstr += 'OTHERWISE\n' + this.Unparse(tree.otherwise) + '\n';
                            }
                            switchstr += 'ENDSWITCH';
                            return switchstr;
                        case 'WHILE':
                            return 'WHILE ' + this.Unparse(tree.expression) + '\n' + this.Unparse(tree.body) + '\nENDWHILE';
                        case 'DO_UNTIL':
                            return 'DO\n' + this.Unparse(tree.body) + '\nUNTIL ' + this.Unparse(tree.expression);
                        case 'FOR':
                            return (
                                (tree.parallel ? 'PARFOR ' : 'FOR ') +
                                (tree.workers ? '(' : '') +
                                this.Unparse(tree.target) +
                                '=' +
                                this.Unparse(tree.expression) +
                                (tree.workers ? ',' + this.Unparse(tree.workers) + ')' : '') +
                                '\n' +
                                this.Unparse(tree.body) +
                                (tree.parallel ? '\nENDPARFOR' : '\nENDFOR')
                            );
                        case 'SPMD':
                            return (
                                'SPMD' +
                                (tree.workers ? ' (' + tree.workers.list.map((worker: NodeInput) => this.Unparse(worker)).join(',') + ')' : '') +
                                '\n' +
                                this.Unparse(tree.body) +
                                '\nENDSPMD'
                            );
                        case 'TRY':
                            return (
                                'TRY\n' +
                                this.Unparse(tree.body) +
                                (tree.catchBody ? '\nCATCH' + (tree.catchIdentifier ? ' ' + this.Unparse(tree.catchIdentifier) : '') + '\n' + this.Unparse(tree.catchBody) : '') +
                                '\nEND_TRY_CATCH'
                            );
                        case 'UNWIND_PROTECT':
                            return 'UNWIND_PROTECT\n' + this.Unparse(tree.body) + '\nUNWIND_PROTECT_CLEANUP\n' + this.Unparse(tree.cleanup) + '\nEND_UNWIND_PROTECT';
                        case 'CLASSDEF':
                            return (
                                'CLASSDEF ' +
                                classAttributeListUnparse(tree.attributes) +
                                (tree.attributes.length > 0 ? ' ' : '') +
                                tree.id +
                                (tree.superclasses.length > 0 ? ' < ' + tree.superclasses.map((superclass: NodeIdentifier) => this.Unparse(superclass)).join('&') : '') +
                                (tree.sections.length > 0 ? '\n' + tree.sections.map((section: NodeClassSection) => this.Unparse(section)).join('\n') : '') +
                                '\nENDCLASSDEF'
                            );
                        case 'CLASS_SECTION':
                            return (
                                tree.kind +
                                (tree.attributes.length > 0 ? ' ' + classAttributeListUnparse(tree.attributes) : '') +
                                (tree.members.list.length > 0 ? '\n' + this.Unparse(tree.members).trimEnd() : '') +
                                '\n' +
                                classSectionEndKeyword(tree.kind)
                            );
                        case 'CLASS_PROPERTY':
                            return (
                                tree.id +
                                (tree.size.length > 0 ? '(' + nodeListInlineUnparse(tree.size) + ')' : '') +
                                (tree.class && !isEmptyListNode(tree.class) ? ' ' + this.Unparse(tree.class).trimEnd() : '') +
                                (tree.functions.length > 0 ? ' {' + nodeListInlineUnparse(tree.functions) + '}' : '') +
                                (tree.defaultValue ? '=' + this.Unparse(tree.defaultValue).trimEnd() : '')
                            );
                        case 'CLASS_EVENT':
                            return tree.id;
                        case 'CLASS_ENUMERATION':
                            return tree.id + (tree.args.length > 0 ? '(' + tree.args.map((arg: NodeExpr) => this.Unparse(arg).trimEnd()).join(',') + ')' : '');
                        case 'CLASS_ATTRIBUTE': {
                            if (tree.value && (tree.value.type === '~' || tree.value.type === '!')) {
                                return tree.value.type + tree.id;
                            }
                            return tree.id + (tree.value ? '=' + this.Unparse(tree.value).trimEnd() : '');
                        }
                        case 'FCNDEF':
                            return functionDefinitionUnparse(tree);
                        case 'VOID':
                            return '';
                        default:
                            return '<INVALID>';
                    }
                }
            } else {
                return '';
            }
        } catch {
            return '<ERROR>';
        }
    }

    /**
     * Convert an AST/runtime value to a MathML fragment.
     *
     * This method returns only the inner fragment. Use `UnparseMathML` when the
     * caller needs the full `<math>` wrapper and display-mode handling.
     *
     * @param tree AST/runtime value to render.
     * @param parentPrecedence Parent operator precedence.
     * @returns MathML fragment.
     */
    public UnparserMathML(tree: NodeInput, parentPrecedence = 0): string {
        const declarationUnparseMathML = (keyword: string, tree: NodeInput): string =>
            `<mrow><mi>${keyword}</mi><mspace width="0.4em"/>${tree.list.map((node: NodeExpr) => this.UnparserMathML(AST.getDeclarationNode(node))).join('<mspace width="0.4em"/>')}</mrow>`;
        const inlineListMathML = (list: NodeInput[]): string => list.map((node) => this.UnparserMathML(node)).join('<mo>,</mo>');
        const isEmptyListNode = (node: NodeInput | null): boolean => !!node && node.type === 'LIST' && node.list.length === 0;
        const keywordRow = (keyword: string, expression?: string): string =>
            `<mtr><mtd><mo><b>${keyword}</b></mo></mtd>${typeof expression === 'undefined' ? '' : `<mtd>${expression}</mtd>`}</mtr>`;
        const bodyRow = (body: NodeInput): string => `<mtr><mtd></mtd><mtd>${this.UnparserMathML(body)}</mtd></mtr>`;
        const controlBlockMathML = (begin: string, body: NodeInput, end: string, expression?: string): string =>
            `<mtable>${keywordRow(begin, expression)}${bodyRow(body)}${keywordRow(end)}</mtable>`;
        const fencedMathML = (left: string, inner: string, right: string): string => MathML.format['()'](left, inner, right);
        const classAttributeListMathML = (attributes: NodeClassAttribute[]): string => (attributes.length > 0 ? fencedMathML('(', inlineListMathML(attributes), ')') : '');
        const classSectionEndKeyword = (kind: string): string => {
            switch (kind) {
                case 'PROPERTIES':
                    return 'endproperties';
                case 'METHODS':
                    return 'endmethods';
                case 'EVENTS':
                    return 'endevents';
                case 'ENUMERATION':
                    return 'endenumeration';
                default:
                    return 'end';
            }
        };
        const argumentValidationMathML = (validation: NodeArgumentValidation): string => {
            const size = validation.size.length > 0 ? fencedMathML('(', inlineListMathML(validation.size), ')') : '';
            const cl = validation.class && !isEmptyListNode(validation.class) ? '<mspace width="0.33em"/>' + this.UnparserMathML(validation.class) : '';
            const functions = validation.functions.length > 0 ? '<mspace width="0.33em"/>' + fencedMathML('{', inlineListMathML(validation.functions), '}') : '';
            const dflt = validation.default ? '<mo>=</mo>' + this.UnparserMathML(validation.default) : '';
            return `<mrow>${this.UnparserMathML(validation.name)}${size}${cl}${functions}${dflt}</mrow>`;
        };
        const functionHeaderMathML = (func: NodeFunctionDefinition): string => {
            const returns =
                func.return.list.length === 0 ? '' : func.return.list.length === 1 ? this.UnparserMathML(func.return.list[0]) : fencedMathML('[', inlineListMathML(func.return.list), ']');
            const params = fencedMathML('(', inlineListMathML(func.parameter.list), ')');
            return `${returns ? returns + '<mo>=</mo>' : ''}${MathML.format['IDENT'](func.id)}${params}`;
        };
        const functionDefinitionMathML = (func: NodeFunctionDefinition): string => {
            if (func.attributes?.prototype) {
                return functionHeaderMathML(func);
            }
            const argumentRows = func.arguments.list.map((node: NodeInput) => bodyRow(node)).join('');
            return `<mtable>${keywordRow('function', functionHeaderMathML(func))}${argumentRows}${bodyRow(func.statements)}${keywordRow('endfunction')}</mtable>`;
        };
        try {
            if (tree) {
                if (tree === undefined) {
                    return MathML.format['UNDEFINED']();
                } else if (Complex.isInstanceOf(tree)) {
                    return Complex.unparseMathML(tree, this, parentPrecedence);
                } else if (CharString.isInstanceOf(tree)) {
                    return CharString.unparseMathML(tree, parentPrecedence);
                } else if (MultiArray.isInstanceOf(tree)) {
                    return MultiArray.unparseMathML(tree, this, parentPrecedence);
                } else if (Structure.isInstanceOf(tree)) {
                    return Structure.unparseMathML(tree, this, parentPrecedence);
                } else if (FunctionHandle.isInstanceOf(tree)) {
                    return FunctionHandle.unparseMathML(tree, this, parentPrecedence);
                } else {
                    switch (tree.type) {
                        case '()': {
                            const operation = this.requirePrefixOperation(tree);
                            const precedence = this.nodePrecedence(operation.right);
                            const rightUnparse = this.UnparserMathML(operation.right, precedence);
                            return precedence < parentPrecedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse;
                        }
                        case '+':
                        case '-':
                        case '*':
                        case '.*':
                        case './':
                        case '.\\':
                        case '\\':
                        case '.^':
                        case '.**':
                        case '<':
                        case '>':
                        case '==':
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
                        case '<=':
                        case '>=':
                        case '!=':
                        case '~=': {
                            const operation = this.requireBinaryOperation(tree);
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.UnparserMathML(operation.left, precedence);
                            const rightUnparse = this.UnparserMathML(operation.right, precedence);
                            return MathML.formatDynamic(
                                tree.type,
                                this.nodePrecedence(operation.left) < precedence ? MathML.format['()']('(', leftUnparse, ')') : leftUnparse,
                                this.nodePrecedence(operation.right) < precedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse,
                            );
                        }
                        case '/': {
                            const operation = this.requireBinaryOperation(tree);
                            return MathML.formatDynamic(tree.type, this.UnparserMathML(operation.left), this.UnparserMathML(operation.right));
                        }
                        case '**':
                        case '^': {
                            const operation = this.requireBinaryOperation(tree);
                            return MathML.formatDynamic(tree.type, this.UnparserMathML(operation.left, this.precedenceTable['_' + tree.type]), this.UnparserMathML(operation.right));
                        }
                        case '!':
                        case '~':
                        case '+_':
                        case '-_':
                        case '++_':
                        case '--_': {
                            const operation = this.requirePrefixOperation(tree);
                            return MathML.formatDynamic(tree.type, this.UnparserMathML(operation.right));
                        }
                        case '_++':
                        case '_--':
                        case ".'":
                        case "'": {
                            const operation = this.requirePostfixOperation(tree);
                            return MathML.formatDynamic(tree.type, this.UnparserMathML(operation.left, this.precedenceTable['_' + tree.type]));
                        }
                        case 'IDENT':
                            return MathML.format['IDENT'](substSymbol(tree.id));
                        case '.':
                            return MathML.format['.'](
                                this.UnparserMathML(tree.obj),
                                tree.field.map((value: string | NodeExpr) =>
                                    typeof value === 'string' ? MathML.format['IDENT'](value) : MathML.format['()']('(', this.UnparserMathML(value), ')'),
                                ),
                            );
                        case 'LIST':
                            return MathML.format['LIST'](tree.list.map((value: NodeInput) => this.UnparserMathML(value)));
                        case 'RANGE':
                            if (tree.start_ && tree.stop_) {
                                if (tree.stride_) {
                                    return MathML.format['RANGE'](this.UnparserMathML(tree.start_), this.UnparserMathML(tree.stride_), this.UnparserMathML(tree.stop_));
                                } else {
                                    return MathML.format['RANGE'](this.UnparserMathML(tree.start_), this.UnparserMathML(tree.stop_));
                                }
                            } else {
                                return MathML.format['RANGE']();
                            }
                        case 'ENDRANGE':
                        case ':':
                        case '<~>':
                            return MathML.formatDynamic(tree.type);
                        case 'IDX':
                            if (tree.args.length === 0) {
                                return MathML.format['IDX'](this.UnparserMathML(tree.expr), tree.delim[0], [], tree.delim[1]);
                            } else {
                                let unparse;
                                if (tree.expr.type === 'IDENT') {
                                    const aliasTreeName = this.context.aliasNameFunction(tree.expr.id);
                                    if (aliasTreeName in this.context.builtInFunctionTable && this.context.builtInFunctionTable[aliasTreeName].UnparserMathML) {
                                        unparse = this.context.builtInFunctionTable[aliasTreeName].UnparserMathML(tree);
                                    } else if (aliasTreeName in this.context.builtInFunctionTable && MathML.formatFunction(aliasTreeName)) {
                                        unparse = MathML.formatDynamic(aliasTreeName, ...tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)));
                                    } else {
                                        unparse = MathML.format['IDX'](
                                            MathML.format['IDENT'](substSymbol(tree.expr.id)),
                                            tree.delim[0],
                                            tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)),
                                            tree.delim[1],
                                        );
                                    }
                                } else {
                                    unparse = MathML.format['IDX'](
                                        this.UnparserMathML(tree.expr, parentPrecedence),
                                        tree.delim[0],
                                        tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)),
                                        tree.delim[1],
                                    );
                                }
                                return this.nodePrecedence(tree) > parentPrecedence ? unparse : MathML.format['()']('(', unparse, ')');
                            }
                        case 'RETLIST':
                            return MathML.format['RETLIST']();
                        case 'CMDWLIST':
                            return MathML.format['CMDWLIST'](
                                tree.id,
                                tree.args.map((arg: CharString) => this.UnparserMathML(arg)),
                            );
                        case 'ARGVALID':
                            return argumentValidationMathML(tree);
                        case 'ARGS':
                            return `<mtable>${keywordRow(
                                'arguments',
                                tree.attributes.length > 0 ? tree.attributes.map((attribute: NodeIdentifier) => this.UnparserMathML(attribute)).join('<mo>,</mo>') : undefined,
                            )}${tree.validation.map((validation: NodeArgumentValidation) => bodyRow(validation)).join('')}${keywordRow('endarguments')}</mtable>`;
                        case 'GLOBAL':
                            return declarationUnparseMathML('global', tree);
                        case 'PERSIST':
                            return declarationUnparseMathML('persistent', tree);
                        case 'IMPORT':
                            return (
                                '<mrow><mi>import</mi>' +
                                (tree.imports.length > 0 ? '<mspace width="0.33em"/>' + tree.imports.map((entry: NodeIdentifier) => this.UnparserMathML(entry)).join('<mo>,</mo>') : '') +
                                '</mrow>'
                            );
                        case 'RETURN':
                            return '<mi>return</mi>';
                        case 'BREAK':
                            return '<mi>break</mi>';
                        case 'CONTINUE':
                            return '<mi>continue</mi>';
                        case 'IF':
                            const ifThenArray = tree.expression.map(
                                (expr: NodeInput, i: number) => `${keywordRow(i === 0 ? 'if' : 'elseif', this.UnparserMathML(expr))}${bodyRow(tree.then[i])}`,
                            );
                            const ifElse = tree.else ? `${keywordRow('else')}${bodyRow(tree.else)}` : '';
                            return `<mtable>${ifThenArray.join('')}${ifElse}${keywordRow('endif')}</mtable>`;
                        case 'SWITCH':
                            return `<mtable>${keywordRow('switch', this.UnparserMathML(tree.expression))}${tree.cases
                                .map((caseNode: NodeSwitchCase) => `${keywordRow('case', this.UnparserMathML(caseNode.expression))}${bodyRow(caseNode.then)}`)
                                .join('')}${tree.otherwise ? `${keywordRow('otherwise')}${bodyRow(tree.otherwise)}` : ''}${keywordRow('endswitch')}</mtable>`;
                        case 'WHILE':
                            return controlBlockMathML('while', tree.body, 'endwhile', this.UnparserMathML(tree.expression));
                        case 'DO_UNTIL':
                            return `<mtable>${keywordRow('do')}${bodyRow(tree.body)}${keywordRow('until', this.UnparserMathML(tree.expression))}</mtable>`;
                        case 'FOR':
                            return controlBlockMathML(
                                tree.parallel ? 'parfor' : 'for',
                                tree.body,
                                tree.parallel ? 'endparfor' : 'endfor',
                                this.UnparserMathML(tree.target) +
                                    '<mo form="infix" stretchy="true">=</mo>' +
                                    this.UnparserMathML(tree.expression) +
                                    (tree.workers ? '<mo>,</mo>' + this.UnparserMathML(tree.workers) : ''),
                            );
                        case 'SPMD':
                            return controlBlockMathML('spmd', tree.body, 'endspmd', tree.workers ? this.UnparserMathML(tree.workers) : undefined);
                        case 'TRY':
                            return `<mtable>${keywordRow('try')}${bodyRow(tree.body)}${
                                tree.catchBody ? keywordRow('catch', tree.catchIdentifier ? this.UnparserMathML(tree.catchIdentifier) : undefined) + bodyRow(tree.catchBody) : ''
                            }${keywordRow('end_try_catch')}</mtable>`;
                        case 'UNWIND_PROTECT':
                            return `<mtable>${keywordRow('unwind_protect')}${bodyRow(tree.body)}${keywordRow('unwind_protect_cleanup')}${bodyRow(tree.cleanup)}${keywordRow(
                                'end_unwind_protect',
                            )}</mtable>`;
                        case 'CLASSDEF':
                            return `<mtable>${keywordRow(
                                'classdef',
                                `${classAttributeListMathML(tree.attributes)}${tree.attributes.length > 0 ? '<mspace width="0.33em"/>' : ''}${MathML.format['IDENT'](tree.id)}${
                                    tree.superclasses.length > 0
                                        ? '<mspace width="0.33em"/><mo>&lt;</mo><mspace width="0.33em"/>' +
                                          tree.superclasses.map((superclass: NodeIdentifier) => this.UnparserMathML(superclass)).join('<mo>&amp;</mo>')
                                        : ''
                                }`,
                            )}${tree.sections.map((section: NodeClassSection) => bodyRow(section)).join('')}${keywordRow('endclassdef')}</mtable>`;
                        case 'CLASS_SECTION':
                            return `<mtable>${keywordRow(
                                tree.kind.toLowerCase(),
                                tree.attributes.length > 0 ? classAttributeListMathML(tree.attributes) : undefined,
                            )}${bodyRow(tree.members)}${keywordRow(classSectionEndKeyword(tree.kind))}</mtable>`;
                        case 'CLASS_PROPERTY':
                            return argumentValidationMathML(tree.validation);
                        case 'CLASS_EVENT':
                            return MathML.format['IDENT'](tree.id);
                        case 'CLASS_ENUMERATION':
                            return `<mrow>${MathML.format['IDENT'](tree.id)}${tree.args.length > 0 ? fencedMathML('(', inlineListMathML(tree.args), ')') : ''}</mrow>`;
                        case 'CLASS_ATTRIBUTE':
                            if (tree.value && (tree.value.type === '~' || tree.value.type === '!')) {
                                return `<mrow><mo>${tree.value.type}</mo>${MathML.format['IDENT'](tree.id)}</mrow>`;
                            }
                            return `<mrow>${MathML.format['IDENT'](tree.id)}${tree.value ? '<mo>=</mo>' + this.UnparserMathML(tree.value) : ''}</mrow>`;
                        case 'FCNDEF':
                            return functionDefinitionMathML(tree);
                        case 'VOID':
                            return MathML.format['VOID']();
                        default:
                            return MathML.format['INVALID']();
                    }
                }
            } else {
                return MathML.format['UNDEFINED']();
            }
        } catch (e) {
            if (this._debug) {
                throw e;
            } else {
                return MathML.format['ERROR']();
            }
        }
    }

    /**
     * Wrap a MathML fragment for display.
     *
     * @param tree AST/runtime value to render.
     * @param display MathML display mode.
     * @returns Full MathML string.
     */
    public UnparseMathML(tree: NodeInput, display: 'inline' | 'block' | 'none' = 'block'): string {
        let result: string = this.UnparserMathML(tree);
        if (result) {
            return MathML.format.math(MathML.format.errorReplace(result), display);
        } else {
            return '<b>Unparse error.</b>';
        }
    }

    /**
     * Generate MathML for parsed input without evaluating it.
     *
     * @param input Source text to parse.
     * @param display MathML display mode.
     * @returns MathML rendering of the parsed input.
     */
    public ToMathML(input: string, display: 'inline' | 'block' | 'none' = 'block'): string {
        return this.UnparseMathML(this.Parse(input), display);
    }

    /**
     * Parse, evaluate, unparse, and MathML-render source text.
     *
     * This convenience API is useful for demos and diagnostics that need every
     * stage of the interpreter pipeline at once.
     *
     * @param input Source text to process.
     * @param display MathML display mode for the evaluated result.
     * @returns Bundle containing parse, evaluation, unparse, and MathML results.
     */
    public Interprets(input: string, display: 'inline' | 'block' | 'none' = 'none'): InterpretsResult {
        const inputParsed = this.Parse(input);
        const evaluated = this.Evaluate(inputParsed);
        const inputUnparsed = this.Unparse(evaluated);
        const inputUnparsedMathML = this.UnparseMathML(evaluated);
        const evaluatedUnparsed = this.Unparse(evaluated);
        const evaluatedUnparsedMathML = this.UnparseMathML(evaluated, display);
        return {
            input,
            inputParsed,
            inputUnparsed,
            inputUnparsedMathML,
            evaluated,
            evaluatedUnparsed,
            evaluatedUnparsedMathML,
        };
    }
}

export type {
    ClassSource,
    ClassSourceProvider,
    ClassSourceTable,
    FunctionSource,
    FunctionSourceProvider,
    FunctionSourceTable,
    InterpreterConfig,
    IncDecOperator,
    ScriptSource,
    ScriptSourceProvider,
    ScriptSourceTable,
    SourceResolver,
};
export type { BuiltinCallable, Callable, FunctionDefinitionCallable, LambdaCallable } from './Callable';
export { ManifestSourceResolver, TableSourceResolver } from './SourceResolver';
export { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
export default { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
