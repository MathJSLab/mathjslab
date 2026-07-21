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
    NodeClassDef,
    NodeArgumentValidation,
    NodeClassAttribute,
    NodeClassSection,
    NodeSwitchCase,
    BinaryOperation,
    PrefixUnaryOperation,
    PostfixUnaryOperation,
    BuiltInFunctionSignature,
    NameEntry,
    AliasNameTable,
    BuiltInFunctionTable,
    CommandWordListTable,
    FunctionSignatureEntry,
    IndexingDelimiterType,
} from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
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
import { ClassMetaObject, ClassMetaClass } from './ClassMeta';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, KeyOfTypeOfMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { substSymbol } from './substSymbol';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import { Configuration } from './Configuration';
import { MathML } from './MathML';
import { FunctionValidation } from './FunctionValidation';
import { FunctionArguments } from './FunctionArguments';
import { FunctionArity } from './FunctionArity';
import { FunctionWorkspace } from './FunctionWorkspace';
import { FunctionIntrospection } from './FunctionIntrospection';
import { FunctionLookup } from './FunctionLookup';
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
import { expressionValue } from './ExpressionValue';

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
type IncDecOperator = (tree: NodeIdentifier) => MathObject;

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
    index?: NodeExpr[];
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
            func: (...args: string[]): NodeInput => {
                this.Clear(...args);
                return AST.nodeVoid();
            },
        },
        which: {
            func: (...args: string[]): CharString => {
                const source = args.join(' ');
                const expressionMatch = source.match(/^\(([\s\S]*)\)$/);
                if (expressionMatch) {
                    const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(this.Parse(expressionMatch[1]), this.context.currentScope));
                    const value = evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
                    return (this.functions.which.func as (value: NodeInput) => CharString)(value);
                }
                AST.throwInvalidCallError('which', args.length !== 1, (message) => this.context.throwSyntaxError(message));
                return this.whichResult(args[0]);
            },
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
    private commandWordListNameSet = new Set(Object.keys(this.commandWordListTable));

    /**
     * Unified virtual source resolver for browser/host-provided `.m` files.
     */
    private sourceResolver: SourceResolver = TableSourceResolver.create();

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
     * Interpreter exit status getter.
     */
    public get exitStatus(): ExitStatus {
        return this._exitStatus;
    }

    /**
     * Increment and decrement operator
     * @param pre `true` if prefixed. `false` if postfixed.
     * @param operation Operation (`'plus'` or `'minus'`).
     * @returns Operator function with signature `(tree: NodeIdentifier) => MathObject`.
     */
    private incDecOpFactory(pre: boolean, operation: 'plus' | 'minus'): IncDecOperator {
        if (pre) {
            return (tree: NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    const variable = this.context.resolveName(tree.id);
                    if (variable) {
                        variable.node = MathOperation[operation](variable.node, Complex.one());
                        return variable.node;
                    } else {
                        this.context.throwEvalError(`in ${operation === 'plus' ? '++' : '--'}${tree.id}, ${tree.id} must be defined first.`);
                    }
                } else {
                    this.context.throwSyntaxError(`invalid prefixed ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        } else {
            return (tree: NodeIdentifier): MathObject => {
                if (tree.type === 'IDENT') {
                    const variable = this.context.resolveName(tree.id);
                    if (variable) {
                        const value = MathOperation.copy(variable.node);
                        variable.node = MathOperation[operation](variable.node, Complex.one());
                        return value;
                    } else {
                        this.context.throwEvalError(`in ${tree.id}${operation === 'plus' ? '++' : '--'}, ${tree.id} must be defined first.`);
                    }
                } else {
                    this.context.throwSyntaxError(`invalid postfixed ${operation === 'plus' ? 'increment' : 'decrement'} variable.`);
                }
            };
        }
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
            target = source.startsWith('@') ? (this.functions.str2func.func as (source: CharString) => FunctionHandle)(arg) : this.createResolvedFunctionHandle(source);
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
    private createResolvedFunctionHandle(name: string, scope: Scope = this.context.currentScope, parent?: NodeInput, captureLexical = false): FunctionHandle {
        const resolved = this.resolveRuntimeFunction(name, scope);
        const canonical = this.context.aliasNameFunction(name);
        const handleName = name.includes('.') && resolved?.functionDefinition ? resolved.resolvedName : canonical;
        const handle = FunctionHandle.create(handleName);
        handle.parent = parent;
        if (captureLexical && resolved?.functionDefinition?.type === 'FCNDEF') {
            handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
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
    private functionHandleWorkspaceValue(value: unknown, name: string): NodeInput {
        return this.expressionValue(RuntimeValue.copy(value), `workspace ${name}`);
    }

    private functionHandleWorkspaceInfo(handle: FunctionHandle): MultiArray {
        if (!handle.closure) {
            return MultiArray.emptyArray(true);
        }

        const fields: Record<string, NodeInput> = {};
        for (const name in handle.closure.nameTable) {
            const entry = handle.closure.nameTable[name];
            if (!entry || entry.global || typeof entry.node === 'undefined' || ClassDefinition.isInstanceOf(entry.node)) {
                continue;
            }
            fields[name] = this.functionHandleWorkspaceValue(entry.node, name);
        }

        const result = MultiArray.scalarToMultiArray(new Structure(fields));
        result.isCell = true;
        return result;
    }

    private dbstackResult(args: NodeInput[]): MultiArray {
        return FunctionIntrospection.dbstackResult(args, this.context.callStack, (message) => this.context.throwSyntaxError(message));
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
        const err = error as Error & { identifier?: string };
        return new Structure({
            message: new CharString(err?.message ?? String(error)),
            identifier: new CharString(err?.identifier ?? ''),
            stack: FunctionIntrospection.dbstackResult([], error instanceof InterpreterError && error.stackFrames ? error.stackFrames.slice().reverse() : this.context.callStack, (message) =>
                this.context.throwSyntaxError(message),
            ),
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
        return this.lastError ? this.exceptionToStruct(this.lastError) : new Structure({ message: new CharString(''), identifier: new CharString(''), stack: MultiArray.emptyArray() });
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
     * Implement the public `warning` built-in subset.
     *
     * The current browser-first runtime records warning state instead of
     * writing to a console or warning manager. This supports the common
     * MATLAB/Octave forms `warning(msg)` and `warning(id, msg)` and leaves more
     * advanced warning controls for a future warning subsystem.
     *
     * @param args Evaluated built-in arguments.
     * @returns Void node because warnings do not produce expression output.
     */
    private warningResult(args: NodeInput[]): NodeInput {
        if (args.length === 1) {
            this.setLastWarning((args[0] as CharString).str);
        } else {
            this.setLastWarning((args[1] as CharString).str, (args[0] as CharString).str);
        }
        this._exitStatus = Interpreter.response.WARNING;
        return AST.nodeVoid();
    }

    /**
     * Implement the public `error` built-in subset.
     *
     * Supported MATLAB/Octave forms are `error(message)` and
     * `error(identifier, message)`. The thrown error keeps the current call
     * stack through `Context.throwEvalError`, and the optional identifier is
     * attached for `catch ME` and `lasterror`.
     *
     * @param args Evaluated error arguments.
     */
    private errorResult(args: NodeInput[]): never {
        const message = (args.length === 1 ? args[0] : args[1]) as CharString;
        const identifier = args.length === 2 ? (args[0] as CharString).str : '';
        try {
            this.context.throwEvalError(message.str);
        } catch (error) {
            if (identifier) {
                (error as Error & { identifier?: string }).identifier = identifier;
            }
            throw error;
        }
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
        if (!CharString.isInstanceOf(message) || !CharString.isInstanceOf(identifier) || typeof errorStruct.field.stack === 'undefined') {
            this.context.throwEvalError('rethrow: input must be an error structure.');
        }
        try {
            this.context.throwEvalError(message.str);
        } catch (error) {
            if (identifier.str) {
                (error as Error & { identifier?: string }).identifier = identifier.str;
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
            this.setLastWarning((args[0] as CharString).str);
        } else if (args.length === 2) {
            this.setLastWarning((args[0] as CharString).str, (args[1] as CharString).str);
        }
        return this.valueReturnList([new CharString(this.lastWarning.message), new CharString(this.lastWarning.identifier)]);
    }

    /**
     * Validate one evaluated value before exposing it as an ordinary expression.
     */
    private expressionValue(value: unknown, name: string): NodeExpr {
        return expressionValue(value, name, 'Expression value', (message) => this.context.throwEvalError(message));
    }

    /**
     * Validate evaluated variadic call arguments before forwarding them.
     */
    private callArgumentValues(values: NodeInput[], prefix: string): NodeExpr[] {
        return values.map((value, index) => this.expressionValue(value, `${prefix}${index + 1}`));
    }

    /**
     * Validate a built-in control argument that must be a character string.
     */
    private charControlArgument(value: unknown, name: string): CharString {
        const expression = this.expressionValue(value, name);
        if (!CharString.isInstanceOf(expression)) {
            this.context.throwEvalError(`${name} must be a character string.`);
        }
        return expression;
    }

    /**
     * Validate an optional boolean-like control argument.
     */
    private booleanControlArgument(value: unknown, name: string): boolean {
        return this.toBoolean(this.expressionValue(value, name));
    }

    /**
     * Validate runtime values before forwarding them to user-defined class methods.
     */
    private classMethodArgumentValues(values: NodeInput[], prefix: string): NodeExpr[] {
        return values.map((value, index) => this.expressionValue(value, `${prefix}${index + 1}`));
    }

    /**
     * Validate and linearize values before assigning them to object arrays.
     */
    private assignmentValues(value: unknown, prefix: string): NodeExpr[] {
        return MultiArray.linearize(this.expressionValue(value, prefix)).map((item, index) => this.expressionValue(item, `${prefix}${index + 1}`));
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
        if (Structure.isInstanceOf(value)) {
            const targetWidth = MultiArray.isRowVector(target) ? MultiArray.linearize(this.expressionValue(target, 'for target')).length : 1;
            return Object.entries(value.field).map(([field, fieldValue]) => {
                const valueExpression = this.expressionValue(fieldValue, field);
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
            return value.array[0].map((item, index) => this.expressionValue(item, `for${index + 1}`));
        }
        const result: NodeExpr[] = [];
        for (let column = 0; column < value.dimension[1]; column++) {
            const columnValue = new MultiArray([value.dimension[0], 1], undefined, value.isCell);
            for (let row = 0; row < value.dimension[0]; row++) {
                columnValue.array[row][0] = value.array[row][column];
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
    private valueReturnList(values: unknown[]): NodeReturnList {
        const result = AST.nodeReturnList(
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
                    out[`out${index}`] = this.returnListValue(values[index], `out${index + 1}`);
                }
                return out;
            },
        );
        result.commaSeparated = true;
        result.returnListLength = values.length;
        return result;
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
    private evalStringInScope(source: string, scope: Scope): NodeInput {
        const tree = this.Parse(source);
        tree.parent = null;
        this.context.pushCallStackFrame(new CallFrame(scope));
        try {
            this.context.pushRequestedOutputCount(1);
            try {
                return this.Evaluator(tree, scope);
            } finally {
                this.context.popRequestedOutputCount();
            }
        } finally {
            this.context.popCallStackFrame();
        }
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
        const definitions = this.topLevelFunctionDefinitions(this.Parse(source));
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
    private registerFunctionFileDefinition(primary: NodeFunctionDefinition, subfunctions: NodeFunctionDefinition[], scope: Scope): NodeFunctionDefinition {
        this.validateFunctionSignature(primary);
        this.validateFunctionArgumentsBlocks(primary);
        const fileScope = Scope.create(scope, false);
        fileScope.defineFunction(primary.id, primary);
        primary.definingScope = fileScope;
        if (primary.attributes?.nested || primary.attributes?.subfunction) {
            primary.attributes = { ...primary.attributes };
            delete primary.attributes.nested;
            delete primary.attributes.subfunction;
        }
        for (const subfunction of subfunctions) {
            if (subfunction.id === primary.id || subfunction.id in fileScope.functionTable) {
                this.context.throwSyntaxError(`duplicate function '${subfunction.id}' in function file ${primary.id}.`);
            }
            this.validateFunctionSignature(subfunction);
            this.validateFunctionArgumentsBlocks(subfunction);
            subfunction.definingScope = fileScope;
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
    public LoadFunctionFile(name: string, source: string, scope: Scope = this.context.globalScope ?? this.context.currentScope): NodeFunctionDefinition {
        const parsed = this.parseFunctionSource(name, source);
        return this.registerFunctionFileDefinition(parsed.primary, parsed.subfunctions, scope);
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
            return this.LoadFunctionFile(source.name ?? name, source.source, this.context.globalScope ?? scope);
        } finally {
            this.loadingFunctionNames.delete(name);
        }
    }

    /**
     * Normalize script lookup names for browser-provided source tables.
     *
     * @param name Script name or path-like string.
     * @returns Basename without a trailing `.m` suffix.
     */
    private normalizeScriptSourceName(name: string): string {
        return name.replace(/\\/g, '/').split('/').pop()?.replace(/\.m$/i, '') ?? name;
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

    private hasScriptSource(name: string): boolean {
        return typeof this.resolveScriptSource(name) !== 'undefined';
    }

    /**
     * Execute a parsed script while temporarily exposing script-local functions.
     *
     * @param tree Parsed script source tree.
     * @param scope Workspace where script statements execute.
     * @returns Evaluated script result.
     */
    private executeScriptTree(tree: NodeInput, scope: Scope): NodeInput {
        const localFunctions = this.topLevelFunctionDefinitions(tree);
        const previousFunctions = new Map<string, NodeFunctionDefinition | undefined>();
        for (const func of localFunctions) {
            if (!previousFunctions.has(func.id)) {
                previousFunctions.set(func.id, scope.functionTable[func.id]);
            }
        }
        this.scriptExecutionDepth++;
        try {
            return this.Evaluator(tree, scope);
        } catch (e: unknown) {
            if (e instanceof ReturnSignal) {
                return AST.nodeVoid();
            }
            throw e;
        } finally {
            this.scriptExecutionDepth--;
            for (const [name, previous] of previousFunctions) {
                if (previous) {
                    scope.defineFunction(name, previous);
                } else {
                    scope.removeFunction(name);
                }
            }
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
     * @returns Evaluated script result.
     */
    public LoadScriptFile(name: string, source: string, scope: Scope = this.context.currentScope): NodeInput {
        const tree = this.Parse(source);
        tree.parent = null;
        return this.executeScriptTree(tree, scope);
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
        return this.LoadScriptFile(source.name ?? name, source.source, scope);
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
        const definitions = this.topLevelFunctionDefinitions(this.Parse(source));
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
        const source = this.resolveClassSource(name);
        return typeof source !== 'undefined' && typeof this.tryParseClassSource(source.name ?? name, source.source) !== 'undefined';
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
            this.validateFunctionSignature(parsed.primary);
            this.validateFunctionArgumentsBlocks(parsed.primary);
            parsed.primary.definingScope = fileScope;
            fileScope.defineFunction(parsed.primary.id, parsed.primary);
            for (const subfunction of parsed.subfunctions) {
                if (subfunction.id === parsed.primary.id || subfunction.id in fileScope.functionTable) {
                    this.context.throwSyntaxError(`duplicate function '${subfunction.id}' in method file ${sourceName}.`);
                }
                this.validateFunctionSignature(subfunction);
                this.validateFunctionArgumentsBlocks(subfunction);
                subfunction.definingScope = fileScope;
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
                    current = property.defaultValue ? AST.reduceToFirstIfReturnList(this.Evaluator(property.defaultValue, scope)) : MultiArray.emptyArray();
                    continue;
                }
                const enumeration = current.findEnumeration(field);
                if (enumeration) {
                    const args = enumeration.args.map((arg) => AST.reduceToFirstIfReturnList(this.Evaluator(arg, scope)));
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
        if (!parts || parts.length < 2 || scope.resolveName(parts[0])) {
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
        return ClassMetaClass.create(definition, (property) => (property.defaultValue ? AST.reduceToFirstIfReturnList(this.Evaluator(property.defaultValue, scope)) : undefined));
    }

    private checkFunctionCount(name: 'narginchk' | 'nargoutchk', min: NodeInput, max: NodeInput): NodeInput {
        const count = name === 'narginchk' ? Complex.realToNumber(this.context.currentFunctionArgumentCountOrZero()) : Complex.realToNumber(this.context.currentFunctionOutputCountOrZero());
        FunctionArity.checkFunctionCount(
            name,
            min,
            max,
            count,
            (message) => this.context.throwSyntaxError(message),
            (message) => this.context.throwEvalError(message),
        );
        return AST.nodeVoid();
    }

    private lookupClassSourceResolution(name: string, scope: Scope): SymbolResolution | undefined {
        const canonical = this.context.aliasNameFunction(name);
        if (this.hasClassSource(canonical)) {
            return { kind: 'class', name, resolvedName: canonical, source: 'local' };
        }
        if (!canonical.includes('.')) {
            for (const importedName of scope.importedNameCandidates(canonical)) {
                const importedCanonical = this.context.aliasNameFunction(importedName);
                if (this.hasClassSource(importedCanonical)) {
                    return { kind: 'class', name, resolvedName: importedCanonical, source: 'import' };
                }
            }
        }
        return undefined;
    }

    private lookupScriptSourceResolution(name: string): SymbolResolution | undefined {
        const canonical = this.context.aliasNameFunction(name);
        if (this.hasScriptSource(canonical)) {
            return { kind: 'script', name, resolvedName: canonical, source: 'local' };
        }
        return undefined;
    }

    private resolveLookupSymbol(name: string, kind?: string): SymbolResolution | undefined {
        const normalizedKind = kind?.toLowerCase();
        const scope = this.context.currentScope;
        const classes = normalizedKind === 'class' || typeof normalizedKind === 'undefined';
        const scripts = normalizedKind === 'file' || typeof normalizedKind === 'undefined';
        const resolved = this.resolveRuntimeSymbol(name, scope, {
            variables: normalizedKind !== 'class' && normalizedKind !== 'builtin' && normalizedKind !== 'file' && normalizedKind !== 'function',
            classes,
            loadClasses: false,
            functions: normalizedKind !== 'class' && normalizedKind !== 'var' && normalizedKind !== 'variable',
        });
        if (resolved) {
            return resolved;
        }
        return (classes ? this.lookupClassSourceResolution(name, scope) : undefined) ?? (scripts ? this.lookupScriptSourceResolution(name) : undefined);
    }

    private existCode(name: string, kind?: string): number {
        const resolved = this.resolveLookupSymbol(name, kind);
        return FunctionLookup.existCodeFromResolution(name, kind, resolved);
    }

    private whichResult(name: string, handle?: FunctionHandle): CharString {
        const resolved = handle
            ? handle.id
                ? this.resolveRuntimeFunction(handle.id, (handle.closure as Scope | undefined) ?? this.context.currentScope)
                : undefined
            : this.resolveLookupSymbol(name);
        return FunctionLookup.whichResultFromResolution(name, resolved, handle, (item) => FunctionHandle.unparse(item, this));
    }

    private isClassName(name: string): boolean {
        return FunctionLookup.isRuntimeClassName(name) || Boolean(this.context.resolveClassDefinition(name));
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
            case 'event.EventData':
                return ClassEventData.isInstanceOf(value);
            case 'event.PropertyEvent':
                return ClassPropertyEvent.isInstanceOf(value);
            default:
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

    private valueMatchesValidationClass(value: NodeInput, className: string, scope: Scope): boolean {
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
        return MultiArray.isInstanceOf(value) ? MultiArray.linearize(value).every(matchesDefinition) : matchesDefinition(value);
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

    private propertyEventData(source: ClassInstance, propertyName: string): ClassPropertyEvent {
        return ClassPropertyEvent.create(source, propertyName);
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

    private addClassListener(source: NodeInput, event: NodeInput, callback: NodeInput): ClassEventListener {
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError('addlistener: source must be a class instance.');
        }
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError('addlistener: source must be a handle object.');
        }
        if (!CharString.isInstanceOf(event)) {
            this.context.throwEvalError('addlistener: event name must be a string.');
        }
        if (!FunctionHandle.isInstanceOf(callback)) {
            this.context.throwEvalError('addlistener: callback must be a function handle.');
        }
        this.validateClassEventAccess(source, event.str, 'listen');
        return ClassInstance.addListener(source, event.str, callback);
    }

    private notifyClassEvent(source: NodeInput, event: NodeInput): NodeInput {
        if (!ClassInstance.isInstanceOf(source)) {
            this.context.throwEvalError('notify: source must be a class instance.');
        }
        if (!source.classDefinition.isHandleClass()) {
            this.context.throwEvalError('notify: source must be a handle object.');
        }
        if (!CharString.isInstanceOf(event)) {
            this.context.throwEvalError('notify: event name must be a string.');
        }
        this.validateClassEventAccess(source, event.str, 'notify');
        this.dispatchClassEvent(source, event.str, this.eventData(source, event.str));
        return AST.nodeVoid();
    }

    private dispatchClassEvent(source: ClassInstance, eventName: string, data: ClassEventData = this.eventData(source, eventName)): void {
        for (const listener of ClassInstance.listenersFor(source, eventName)) {
            this.context.apply(this.expressionValue(listener.callback, 'event callback'), this.classMethodArgumentValues([source, data], 'event'), AST.nodeIdentifier('notify'));
        }
    }

    private resolveClassEventDataField(eventData: ClassEventData | ClassPropertyEvent, field: string): NodeInput {
        const value = ClassPropertyEvent.isInstanceOf(eventData) ? ClassPropertyEvent.getProperty(eventData, field) : ClassEventData.getProperty(eventData, field);
        if (typeof value === 'undefined') {
            this.context.throwEvalError(`unknown property '${field}' for ${ClassPropertyEvent.isInstanceOf(eventData) ? 'event.PropertyEvent' : 'event.EventData'}.`);
        }
        return value;
    }

    private resolveClassEventListenerField(listener: ClassEventListener, field: string): NodeInput {
        if (!ClassEventListener.isValid(listener)) {
            this.context.throwEvalError('invalid or deleted event listener.');
        }
        switch (field) {
            case 'Enabled':
                return listener.enabled ? Complex.true() : Complex.false();
            case 'EventName':
                return CharString.create(listener.eventName);
            case 'Source':
                return listener.source;
            default:
                this.context.throwEvalError(`unknown property '${field}' for event.listener.`);
        }
    }

    private setClassEventListenerField(listener: ClassEventListener, field: string, value: NodeInput): void {
        if (!ClassEventListener.isValid(listener)) {
            this.context.throwEvalError('invalid or deleted event listener.');
        }
        if (field !== 'Enabled') {
            this.context.throwEvalError(`cannot assign to read-only property '${field}' for event.listener.`);
        }
        listener.enabled = this.toBoolean(value);
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

    private setGetStructure(instance: ClassInstance): Structure {
        const result: Record<string, NodeInput> = {};
        for (const property of instance.classDefinition.allProperties().filter((item) => !item.isHidden && item.getAccess === 'public')) {
            result[property.name] = this.resolveClassInstanceField(instance, property.name, AST.nodeIdentifier('get'));
        }
        return new Structure(result);
    }

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

    private setGetPropertyNames(value: NodeInput, functionName: 'get' | 'set'): string[] {
        if (CharString.isInstanceOf(value)) {
            return [value.str];
        }
        if (MultiArray.isInstanceOf(value) && value.isCell) {
            const names = MultiArray.linearize(value);
            if (names.every(CharString.isInstanceOf)) {
                return (names as CharString[]).map((name) => name.str);
            }
        }
        AST.throwInvalidCallError(functionName);
        return [];
    }

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
        const properties = (names as CharString[]).map((name) => {
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

    private setGetSettableStructure(instance: ClassInstance): Structure {
        const result: Record<string, NodeInput> = {};
        for (const property of instance.classDefinition.allProperties().filter((item) => !item.isHidden && this.isSetGetSettableProperty(item))) {
            result[property.name] = MultiArray.emptyArray(true);
        }
        return new Structure(result);
    }

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
        class: {
            func: (...args: NodeInput[]): CharString => {
                return new CharString(this.getValueClassName(args[0]));
            },
            signature: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        },
        isa: {
            func: (...args: NodeInput[]): ComplexType => {
                return this.valueIsRuntimeClass(args[0], (args[1] as CharString).str) ? Complex.true() : Complex.false();
            },
            signature: { inputs: { arity: 2, parameters: [{ name: 'value' }, { name: 'className', classes: ['char'] }] }, outputs: { arity: 1 } },
        },
        isclass: {
            func: (...args: NodeInput[]): ComplexType => (this.isClassName((args[0] as CharString).str) ? Complex.true() : Complex.false()),
            signature: { inputs: { arity: 1, parameters: [{ name: 'className', classes: ['char'] }] }, outputs: { arity: 1 } },
        },
        metaclass: {
            func: (...args: NodeInput[]): ClassMetaClass => this.metaclassArgument(args[0]),
            signature: { inputs: { arity: 1, parameters: [{ name: 'object' }] }, outputs: { arity: 1 } },
        },
        __meta_class_fromName: {
            func: (...args: NodeInput[]): ClassMetaClass | MultiArray => {
                const definition = this.context.resolveClassDefinition((args[0] as CharString).str);
                return definition ? this.createClassMetaClass(definition) : MultiArray.emptyArray();
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'className', classes: ['char'] }] }, outputs: { arity: 1 } },
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
            func: (...args: NodeInput[]): ClassEventListener => this.addClassListener(args[0], args[1], args[2]),
            signature: { inputs: { arity: 3, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char'] }, { name: 'callback' }] }, outputs: { arity: 1 } },
        },
        notify: {
            func: (...args: NodeInput[]): NodeInput => this.notifyClassEvent(args[0], args[1]),
            signature: { inputs: { arity: 2, parameters: [{ name: 'source' }, { name: 'eventName', classes: ['char'] }] }, outputs: { arity: 0 } },
        },
        get: {
            func: (...args: NodeInput[]): NodeInput => this.getSetGetProperty(args),
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'object' }] },
                    { arity: 2, parameters: [{ name: 'object' }, { name: 'propertyName', classes: ['char', 'cell'] }] },
                ],
                outputs: { arity: 1 },
            },
        },
        set: {
            func: (...args: NodeInput[]): NodeInput => this.setSetGetProperties(args),
            signature: {
                inputs: [
                    { arity: 1, parameters: [{ name: 'object' }] },
                    { arity: 2, parameters: [{ name: 'object' }, { name: 'propertyNameOrStruct' }] },
                    { arity: -1, min: 3, parameters: [{ name: 'object' }, { name: 'propertyName', classes: ['char', 'cell', 'struct'] }, { name: 'propertyValue', variadic: true }] },
                ],
                outputs: { arity: -1, min: 0, max: 1 },
            },
        },
        mfilename: {
            func: (...args: NodeInput[]): CharString => {
                if (args.length === 1 && (args[0] as CharString).str === 'class') {
                    return new CharString('');
                }
                return new CharString(this.context.currentFunctionName());
            },
            signature: {
                inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'option', classes: ['char'], allowedStrings: ['fullpath', 'class'], optional: true }] },
                outputs: { arity: 1 },
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
                                { name: 'option', classes: ['char'], allowedStrings: ['-completenames'] },
                                { name: 'count', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        lasterror: {
            func: (): Structure => this.lastErrorStruct(),
            signature: { inputs: { arity: 0 }, outputs: { arity: 1 } },
        },
        lastwarn: {
            func: (...args: NodeInput[]): NodeReturnList => this.lastWarningResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 0,
                    max: 2,
                    parameters: [
                        { name: 'message', classes: ['char'], optional: true },
                        { name: 'identifier', classes: ['char'], optional: true },
                    ],
                },
                outputs: { arity: -2 },
            },
        },
        warning: {
            func: (...args: NodeInput[]): NodeInput => this.warningResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'identifierOrMessage', classes: ['char'] },
                        { name: 'message', classes: ['char'], optional: true },
                    ],
                },
                outputs: { arity: 0 },
            },
        },
        error: {
            func: (...args: NodeInput[]): never => this.errorResult(args),
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'identifierOrMessage', classes: ['char'] },
                        { name: 'message', classes: ['char'], optional: true },
                    ],
                },
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
                return Complex.create(this.existCode((args[0] as CharString).str, args.length === 2 ? (args[1] as CharString).str : undefined));
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'name', classes: ['char'] },
                        { name: 'kind', classes: ['char'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        which: {
            func: (...args: NodeInput[]): CharString => {
                if (FunctionHandle.isInstanceOf(args[0])) {
                    const handle = args[0] as FunctionHandle;
                    return this.whichResult(handle.id ?? FunctionHandle.unparse(handle, this).trim(), handle);
                }
                return this.whichResult((args[0] as CharString).str);
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'name', classes: ['char', 'function_handle'] }] }, outputs: { arity: 1 } },
        },
        func2str: {
            func: (...args: NodeInput[]): CharString => {
                return FunctionLookup.func2str(args[0] as FunctionHandle, (handle) => FunctionHandle.unparse(handle, this));
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        },
        str2func: {
            func: (...args: NodeInput[]): FunctionHandle => {
                const handle = FunctionLookup.str2func(
                    (args[0] as CharString).str,
                    (source) => {
                        const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(this.Parse(source), this.context.currentScope));
                        return evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
                    },
                    (message) => this.context.throwEvalError(message),
                );
                return handle.id && !handle.closure ? this.createResolvedFunctionHandle(handle.id, this.context.currentScope, handle, true) : handle;
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'source', classes: ['char'] }] }, outputs: { arity: 1 } },
        },
        builtin: {
            func: (...args: NodeInput[]): NodeExpr => {
                const source = this.charControlArgument(args[0], 'builtin function').str.trim();
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
                        { name: 'function', classes: ['char'] },
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
                    target = source.startsWith('@') ? (this.functions.str2func.func as (source: CharString) => FunctionHandle)(target) : this.createResolvedFunctionHandle(source);
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
                        { name: 'function', classes: ['char', 'function_handle'] },
                        { name: 'argument', variadic: true },
                    ],
                },
                outputs: { arity: -1 },
            },
        },
        functions: {
            func: (...args: NodeInput[]): Structure => {
                return FunctionLookup.functionsInfo(
                    args[0] as FunctionHandle,
                    (name) => this.context.aliasNameFunction(name),
                    (name) => this.context.resolveFunction(name),
                    (handle) => FunctionHandle.unparse(handle, this),
                    (handle) => this.functionHandleWorkspaceInfo(handle),
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
            signature: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
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
        nargout: {
            func: (...args: NodeInput[]): ComplexType => {
                return args.length === 0 ? this.context.currentFunctionOutputCount('nargout') : Complex.create(this.functionOutputArity(this.functionArityCallable('nargout', args[0])));
            },
            signature: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
        },
        nargoutchk: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.checkFunctionCount('nargoutchk', args[0], args[1]);
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
                    (args[0] as CharString).str,
                    args.length === 2 ? (args[1] as CharString).str : undefined,
                    (source, scope) => this.evalStringInScope(source, scope as Scope),
                    (error) => this.isEvalCatchableError(error),
                );
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'code', classes: ['char'] },
                        { name: 'catchCode', classes: ['char'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        evalin: {
            func: (...args: NodeInput[]): NodeInput => {
                const scope = this.context.resolveWorkspace((args[0] as CharString).str);
                return FunctionWorkspace.evaluateWithCatch(
                    scope,
                    (args[1] as CharString).str,
                    args.length === 3 ? (args[2] as CharString).str : undefined,
                    (source, itemScope) => this.evalStringInScope(source, itemScope as Scope),
                    (error) => this.isEvalCatchableError(error),
                );
            },
            signature: {
                inputs: {
                    arity: -3,
                    min: 2,
                    max: 3,
                    parameters: [
                        { name: 'workspace', classes: ['char'], allowedStrings: ['base', 'caller'] },
                        { name: 'code', classes: ['char'] },
                        { name: 'catchCode', classes: ['char'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        run: {
            func: (...args: NodeInput[]): NodeInput => {
                return this.RunScriptFile((args[0] as CharString).str, this.context.currentScope);
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'script', classes: ['char'] }] }, outputs: { arity: 1 } },
        },
        source: {
            func: (...args: NodeInput[]): NodeInput => {
                const scope = args.length === 2 ? this.context.resolveWorkspace((args[1] as CharString).str) : this.context.currentScope;
                return this.RunScriptFile((args[0] as CharString).str, scope);
            },
            signature: {
                inputs: {
                    arity: -2,
                    min: 1,
                    max: 2,
                    parameters: [
                        { name: 'script', classes: ['char'] },
                        { name: 'workspace', classes: ['char'], allowedStrings: ['base', 'caller'], optional: true },
                    ],
                },
                outputs: { arity: 1 },
            },
        },
        assignin: {
            func: (...args: NodeInput[]): NodeInput => {
                return FunctionWorkspace.assignIn(this.context.resolveWorkspace((args[0] as CharString).str, true), (args[1] as CharString).str, args[2]);
            },
            signature: {
                inputs: {
                    arity: 3,
                    parameters: [{ name: 'workspace', classes: ['char'], allowedStrings: ['base', 'caller'] }, { name: 'name', classes: ['char'], identifier: true }, { name: 'value' }],
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
        this.lastError = undefined;
        this.setLastWarning('');
        AST.reload();
        this.context.loadContext();
        this.context.nativeNameTable = Interpreter.nativeNameTableFactory();
        this.context.nativeNameSet = new Set(Object.keys(this.context.nativeNameTable));
        this.context.globalScope!.defineNameTable(this.context.nativeNameTable);
        /* Define Interpreter functions */
        for (const func in this.functions) {
            this.context.defineBuiltInFunction(func, this.functions[func].func, false, [], this.functions[func].signature);
        }
        /* Define function operators */
        for (const func in MathOperation.leftAssociativeMultipleOperations) {
            this.context.defineLeftAssociativeMultipleOperationFunction(func as KeyOfTypeOfMathOperation, MathOperation.leftAssociativeMultipleOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.binaryOperations) {
            this.context.defineBinaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.binaryOperations[func as KeyOfTypeOfMathOperation]!);
        }
        for (const func in MathOperation.unaryOperations) {
            this.context.defineUnaryOperatorFunction(func as KeyOfTypeOfMathOperation, MathOperation.unaryOperations[func as KeyOfTypeOfMathOperation]!);
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
        for (const func of ['properties', 'fieldnames', 'methods', 'events', 'enumeration', 'superclasses', 'isprop', 'ismethod']) {
            this.context.defineBuiltInFunction(func, this.functions[func].func, false, [], this.functions[func].signature);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.context.defineBuiltInFunction(func, LinearAlgebra.functions[func].func, false, [], LinearAlgebra.functions[func].signature);
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
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
                this.commandWordListNameSet = new Set(Object.keys(this.commandWordListTable));
            }
        } else {
            this.context.aliasNameFunction = (name: string): string => name;
            this.sourceResolver = TableSourceResolver.create();
        }
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
        return parser.input().node;
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
     * Clear variables or user-defined functions.
     *
     * With no names, this restarts the interpreter. The special name
     * `functions` clears user-defined functions while preserving built-ins,
     * matching MATLAB/Octave-style `clear functions`.
     *
     * @param names Variable/function names to clear in the current scope.
     */
    public Clear(...names: string[]): void {
        if (names.length === 0) {
            if (this._debug) {
                console.clear();
            }
            this.Restart();
        } else {
            names.forEach((name) => {
                if (name === 'functions') {
                    for (const functionName of Object.keys(this.context.currentScope.functionTable)) {
                        if (this.context.currentScope.functionTable[functionName]?.type === 'FCNDEF') {
                            this.context.currentScope.removeFunction(functionName);
                        }
                    }
                    return;
                }
                if (name === 'global') {
                    this.context.clearGlobalVariables();
                    return;
                }
                const resolved = this.resolveRuntimeSymbol(name, this.context.currentScope, { loadClasses: false });
                const resolvedName = resolved?.resolvedName ?? this.context.aliasNameFunction(name);
                for (const candidate of new Set([name, resolvedName])) {
                    this.context.currentScope.removeName(candidate);
                    const func = this.context.currentScope.functionTable[candidate];
                    if (func?.type === 'FCNDEF') {
                        this.context.currentScope.removeFunction(candidate);
                    }
                    if (this.context.nativeNameSet.has(candidate)) {
                        this.context.globalScope!.defineName(candidate, this.context.nativeNameTable[candidate]);
                    }
                }
            });
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
                    const evaluatedIndex = tree.args.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg, scope)));
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
                } else {
                    const result = AST.reduceToFirstIfReturnList(this.Evaluator(field, scope));
                    if (CharString.isInstanceOf(result)) {
                        return result.str;
                    } else {
                        this.context.throwEvalError(`${invalidLeftAssignmentMessage}: dynamic structure field names must be strings.`);
                    }
                }
            });
            if (AST.isNodeIdentifier(tree.obj)) {
                return [
                    {
                        id: tree.obj.id,
                        field,
                    },
                ];
            } else if (AST.isNodeIndexExpr(tree.obj) && AST.isNodeIdentifier(tree.obj.expr)) {
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
                    return [target];
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
                return [target];
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
        const value = MultiArray.isInstanceOf(tree) ? MultiArray.toLogical(tree) : tree;
        if (Complex.isInstanceOf(value)) {
            return Boolean(Complex.realToNumber(value) || Complex.imagToNumber(value));
        } else {
            return !!value.str;
        }
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
        return RuntimeEquality.valuesEqual(this.switchComparableValue(switchValue), this.switchComparableValue(candidate));
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

    private classBinaryOperatorMethod(left: NodeInput, right: NodeInput, methodName: string): { receiver: ClassInstance; method: ClassMethodDefinition; args: NodeExpr[] } | undefined {
        const findMethod = (value: NodeInput): { receiver: ClassInstance; method: ClassMethodDefinition; args: NodeExpr[] } | undefined => {
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
        const leftDim = leftArray.dimension.slice();
        const rightDim = rightArray.dimension.slice();
        const maxDim = Math.max(leftDim.length, rightDim.length);
        while (leftDim.length < maxDim) leftDim.push(1);
        while (rightDim.length < maxDim) rightDim.push(1);
        const resultDim = new Array<number>(maxDim);
        const leftBroadcast = new Array<boolean>(maxDim);
        const rightBroadcast = new Array<boolean>(maxDim);
        for (let i = 0; i < maxDim; i++) {
            if (leftDim[i] === rightDim[i]) {
                resultDim[i] = leftDim[i];
                leftBroadcast[i] = rightBroadcast[i] = false;
            } else if (leftDim[i] === 1) {
                resultDim[i] = rightDim[i];
                leftBroadcast[i] = true;
                rightBroadcast[i] = false;
            } else if (rightDim[i] === 1) {
                resultDim[i] = leftDim[i];
                leftBroadcast[i] = false;
                rightBroadcast[i] = true;
            } else {
                this.context.throwEvalError(`operator ${methodName}: nonconformant arguments (op1 is ${leftDim.join('x')}, op2 is ${rightDim.join('x')}).`);
            }
        }
        const firstLeft = leftArray.array[0]?.[0];
        const firstRight = rightArray.array[0]?.[0];
        if (!this.classBinaryOperatorMethod(firstLeft, firstRight, methodName)) {
            return undefined;
        }
        const leftStrides = MultiArray.computeStrides(leftDim);
        const rightStrides = MultiArray.computeStrides(rightDim);
        const resultStrides = MultiArray.computeStrides(resultDim);
        const result = new MultiArray(resultDim);
        const totalElements = resultDim.reduce((a, b) => a * b, 1);
        for (let n = 0; n < totalElements; n++) {
            let leftIndexLinear = 0;
            let rightIndexLinear = 0;
            for (let d = 0; d < maxDim; d++) {
                const coord = Math.floor(n / resultStrides[d]) % resultDim[d];
                leftIndexLinear += (leftBroadcast[d] ? 0 : coord) * leftStrides[d];
                rightIndexLinear += (rightBroadcast[d] ? 0 : coord) * rightStrides[d];
            }
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(leftDim[0], leftDim[1], leftIndexLinear);
            const [k, l] = MultiArray.linearIndexToMultiArrayRowColumn(rightDim[0], rightDim[1], rightIndexLinear);
            const [o, p] = MultiArray.linearIndexToMultiArrayRowColumn(resultDim[0], resultDim[1], n);
            const overload = this.classBinaryOperatorMethod(leftArray.array[i][j], rightArray.array[k][l], methodName);
            if (!overload) {
                this.context.throwEvalError(`operator ${methodName} is not defined for class array element.`);
            }
            result.array[o][p] = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(overload.receiver, overload.method, overload.args, parent));
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
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
        const left = AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, scope));
        const right = AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope));
        const methodName = Interpreter.binaryOperatorMethodTable[tree.type];
        if (methodName) {
            const arrayOverload = this.classBinaryOperatorArray(left, right, methodName, tree);
            if (arrayOverload) {
                return arrayOverload;
            }
            const overload = this.classBinaryOperatorMethod(left, right, methodName);
            if (overload) {
                return this.context.callClassInstanceMethod(overload.receiver, overload.method, overload.args, tree);
            }
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
        const left = AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, scope));
        const leftValue = this.toBoolean(left);
        if (tree.type === '&&') {
            if (!leftValue) {
                return Complex.false();
            }
            return this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope))) ? Complex.true() : Complex.false();
        }
        if (leftValue) {
            return Complex.true();
        }
        return this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope))) ? Complex.true() : Complex.false();
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
            result.array[i][j] = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(overload.receiver, overload.method, [], parent));
        }
        MultiArray.setType(result);
        return MultiArray.MultiArrayToScalar(result);
    }

    private evaluateUnaryOperation(tree: PrefixUnaryOperation | PostfixUnaryOperation, scope: Scope): NodeInput {
        const operand = AST.isNodePrefixOperation(tree) ? tree.right : tree.left;
        const value = AST.reduceToFirstIfReturnList(this.Evaluator(operand, scope));
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
        if (!this.context.canAccessClassMember(instance.classDefinition, 'private')) {
            const subsrefResult = this.callClassDotSubsref(instance, field, parent, this.context.currentScope);
            if (typeof subsrefResult !== 'undefined') {
                return subsrefResult;
            }
        }
        const property = instance.classDefinition.findProperty(field);
        if (property?.getMethodName) {
            this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
            const getter = instance.classDefinition.findMethod(property.getMethodName, (item) => !item.isStatic);
            if (!getter) {
                this.context.throwEvalError(`GetMethod '${property.getMethodName}' for property '${field}' in class ${instance.classDefinition.name} is not defined.`);
            }
            const result = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, getter, [], parent));
            if (property.isGetObservable) {
                this.dispatchClassEvent(instance, field, this.propertyEventData(instance, field));
            }
            return result;
        }
        if (property?.isDependent) {
            this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
            const getter = instance.classDefinition.findMethod(`get.${field}`, (item) => !item.isStatic);
            if (!getter) {
                this.context.throwEvalError(`dependent property '${field}' for class ${instance.classDefinition.name} has no get accessor.`);
            }
            const result = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, getter, [], parent));
            if (property.isGetObservable) {
                this.dispatchClassEvent(instance, field, this.propertyEventData(instance, field));
            }
            return result;
        }
        const value = ClassInstance.getProperty(instance, field);
        if (typeof value !== 'undefined') {
            if (property) {
                this.assertCanReadClassProperty(property, field, instance.classDefinition.name);
                if (property.isGetObservable) {
                    this.dispatchClassEvent(instance, field, this.propertyEventData(instance, field));
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
            const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, setter, this.classMethodArgumentValues([value], `set.${field}`), parent));
            if (!ClassInstance.isInstanceOf(updated)) {
                this.context.throwEvalError(`set accessor for property '${field}' must return an object of class ${instance.classDefinition.name}.`);
            }
            if (property.isSetObservable) {
                this.dispatchClassEvent(updated, field, this.propertyEventData(updated, field));
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
            this.dispatchClassEvent(instance, field, this.propertyEventData(instance, field));
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
            Structure.setNewField(structure, nestedField, value);
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

    private assignClassArrayIndexedField(id: string, array: MultiArray, index: NodeExpr[], field: string, value: NodeInput, parent: NodeInput, scope: Scope): MultiArray {
        const evaluatedIndex = index.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg, scope)));
        const selected = MultiArray.getElements(array, id, [], evaluatedIndex);
        const selectedValues = this.assignmentValues(selected, 'selection');
        const values = this.assignmentValues(value, 'assignment');
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
        return scope.resolveName(id)!.node as MultiArray;
    }

    private resolveClassArrayField(array: MultiArray, field: string, parent: NodeInput): NodeInput {
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

    private createSubscriptDescriptor(delimiter: IndexingDelimiterType | '.', args: NodeExpr[], parent: NodeInput, scope: Scope): Structure {
        const subs = new MultiArray([1, args.length]);
        subs.isCell = true;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            subs.array[0][i] = arg.type === ':' ? CharString.create(':') : AST.reduceToFirstIfReturnList(this.Evaluator(arg, scope));
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

    private createDotSubscriptDescriptor(field: string, parent: NodeInput, scope: Scope): Structure {
        return this.createSubscriptDescriptor('.', this.expressionList([CharString.create(field)], 'dot subscript'), parent, scope);
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

    private callClassInstanceMethodWithOutputCount(instance: ClassInstance, method: ClassMethodDefinition, args: NodeExpr[], parent: NodeInput, outputCount: number): NodeExpr {
        this.context.pushRequestedOutputCount(outputCount);
        try {
            return this.context.callClassInstanceMethod(instance, method, args, parent);
        } finally {
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
        const result = AST.reduceToFirstIfReturnList(
            this.callClassInstanceMethodWithOutputCount(instance, method, this.classMethodArgumentValues([descriptor, CharString.create('subsref')], 'numArgumentsFromSubscript'), parent, 1),
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
            return AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, this.classMethodArgumentValues([descriptor], 'subsref'), parent));
        }

        const maxOutputCount = this.callClassNumArgumentsFromSubscript(instance, descriptor, parent) ?? requestedOutputCount;
        AST.throwErrorIfGreaterThanReturnList(maxOutputCount, requestedOutputCount, (message) => this.context.throwEvalError(message));

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
                const result = this.callClassInstanceMethodWithOutputCount(instance, method, this.classMethodArgumentValues([descriptor], 'subsref'), parent, length);
                const out: ReturnHandlerResult = { length };
                if (AST.isNodeReturnList(result)) {
                    const evaluated = result.handler(length);
                    for (let index = 0; index < length; index++) {
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
                const target = AST.reduceToFirstIfReturnList(this.Evaluator(node.expr, scope));
                if (MultiArray.isInstanceOf(target) && this.hasClassInstanceElement(target)) {
                    const selected = AST.reduceToFirstIfReturnList(this.context.apply(target, node.args, node));
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
                const fieldName =
                    typeof field === 'string'
                        ? field
                        : (() => {
                              const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(field, scope));
                              if (!CharString.isInstanceOf(evaluated)) {
                                  this.context.throwEvalError('Dynamic structure field names must be strings.');
                              }
                              return evaluated.str;
                          })();
                base.descriptors.push(this.createDotSubscriptDescriptor(fieldName, node, scope));
            }
            return base;
        }
        const value = AST.reduceToFirstIfReturnList(this.Evaluator(node, scope));
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
                            : (() => {
                                  const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(field, scope));
                                  if (!CharString.isInstanceOf(evaluated)) {
                                      this.context.throwEvalError('invalid left hand side of assignment: dynamic structure field names must be strings.');
                                  }
                                  return evaluated.str;
                              })();
                    base.descriptors.push(this.createDotSubscriptDescriptor(fieldName, current, scope));
                }
                return base;
            }
            return undefined;
        };
        const result = collect(node);
        return result && result.descriptors.length > 0 ? { id: result.id, field: [], descriptors: result.descriptors } : undefined;
    }

    private indexedAssignmentRhs(delimiter: IndexingDelimiterType | undefined, value: NodeInput): MultiArray {
        return delimiter === '{}' ? AST.nodeFirstRow(AST.nodeList([value]), true) : MultiArray.scalarToMultiArray(value);
    }

    private readNativeSubscriptDescriptor(descriptor: Structure): NativeSubscriptDescriptor {
        const type = descriptor.field.type;
        const subs = descriptor.field.subs;
        if (!CharString.isInstanceOf(type) || (type.str !== '()' && type.str !== '{}' && type.str !== '.')) {
            this.context.throwEvalError('invalid subsasgn descriptor.');
        }
        if (!MultiArray.isInstanceOf(subs) || !subs.isCell) {
            this.context.throwEvalError('invalid subsasgn descriptor.');
        }
        return {
            type: type.str as IndexingDelimiterType | '.',
            subs: this.descriptorSubscripts(subs),
        };
    }

    /**
     * Validate subscript descriptor payloads before native indexing consumes them.
     */
    private descriptorSubscripts(subs: MultiArray): NodeExpr[] {
        return MultiArray.linearize(subs).map((subscript, index) => this.expressionValue(subscript, `subscript${index + 1}`));
    }

    private nativeDescriptorIndexList(descriptor: NativeSubscriptDescriptor, target: MultiArray): (ComplexType | MultiArray)[] {
        return descriptor.subs.map((subscript, index) => {
            if (CharString.isInstanceOf(subscript) && subscript.str === ':') {
                return descriptor.subs.length === 1 ? MultiArray.expandColon(MultiArray.linearLength(target)) : MultiArray.expandColon(MultiArray.getDimension(target, index));
            }
            return subscript as ComplexType | MultiArray;
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
        if (!MultiArray.isInstanceOf(target)) {
            this.context.throwEvalError(`matrix cannot be indexed with ${descriptor.type[0]}`);
        }
        const indices = this.nativeDescriptorIndexList(descriptor, target);
        const selected = MultiArray.getElements(target, '', [], indices, this);
        return this.expressionValue(MultiArray.MultiArrayToScalar(selected), 'indexed value');
    }

    private setNativeIndexedValue(target: MultiArray, descriptor: NativeSubscriptDescriptor, value: NodeInput): MultiArray {
        const result = MultiArray.copy(target);
        const tempScope = Scope.create();
        tempScope.defineName('__subsasgn__', result);
        MultiArray.setElements(
            tempScope,
            '__subsasgn__',
            [],
            this.nativeDescriptorIndexList(descriptor, result),
            this.indexedAssignmentRhs(descriptor.type as IndexingDelimiterType, value),
            undefined,
            this,
        );
        return tempScope.resolveName('__subsasgn__')!.node as MultiArray;
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

    private assignNativeSubsasgnDescriptors(target: NodeInput, descriptors: Structure[], value: NodeInput): NodeInput {
        if (descriptors.length === 0) {
            return value;
        }
        const nativeDescriptors = descriptors.map((descriptor) => this.readNativeSubscriptDescriptor(descriptor));
        const assign = (current: NodeInput, index: number): NodeInput => {
            const descriptor = nativeDescriptors[index];
            if (!descriptor) {
                return value;
            }
            if (descriptor.type === '.') {
                const field = descriptor.subs[0];
                if (!CharString.isInstanceOf(field)) {
                    this.context.throwEvalError('invalid subsasgn descriptor.');
                }
                if (!Structure.isInstanceOf(current) && !Structure.isStructure(current)) {
                    this.context.throwEvalError('value cannot be indexed with .');
                }
                const result = Structure.isInstanceOf(current) ? Structure.copy(current) : MultiArray.copy(current as MultiArray);
                let currentField: NodeInput;
                try {
                    currentField = this.expressionValue(Structure.getField(result, [field.str]), `field ${field.str}`);
                } catch {
                    currentField = this.blankNativeSubsasgnValue(nativeDescriptors[index + 1]);
                }
                const nested = index === descriptors.length - 1 ? value : assign(currentField, index + 1);
                Structure.setNewField(result, [field.str], nested);
                return result;
            }
            if (!MultiArray.isInstanceOf(current)) {
                this.context.throwEvalError(`matrix cannot be indexed with ${descriptor.type[0]}`);
            }
            const nested = index === descriptors.length - 1 ? value : assign(this.nativeSubscriptScalarForAssignment(current, descriptor, nativeDescriptors[index + 1]), index + 1);
            return this.setNativeIndexedValue(current, descriptor, nested);
        };
        return assign(target, 0);
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

    private callClassSubsasgn(instance: ClassInstance, index: NodeExpr[], delimiter: IndexingDelimiterType, value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance | undefined {
        const method = instance.classDefinition.findMethod('subsasgn', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsasgn' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubsasgnDescriptor(index, delimiter, parent, scope);
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent));
        if (!ClassInstance.isInstanceOf(updated)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        if (updated.classDefinition !== instance.classDefinition && !updated.classDefinition.isSubclassOf(instance.classDefinition)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        return updated;
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
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent));
        if (!ClassInstance.isInstanceOf(updated)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        if (updated.classDefinition !== instance.classDefinition && !updated.classDefinition.isSubclassOf(instance.classDefinition)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        return updated;
    }

    private createSubsasgnDescriptor(index: NodeExpr[], delimiter: IndexingDelimiterType, parent: NodeInput, scope: Scope): Structure {
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
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, this.classMethodArgumentValues([descriptor, value], 'subsasgn'), parent));
        if (!ClassInstance.isInstanceOf(updated)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        if (updated.classDefinition !== instance.classDefinition && !updated.classDefinition.isSubclassOf(instance.classDefinition)) {
            this.context.throwEvalError(`subsasgn for class ${instance.classDefinition.name} must return an object of class ${instance.classDefinition.name}.`);
        }
        return updated;
    }

    private callClassEnd(instance: ClassInstance, indexPosition: number, indexCount: number, parent: NodeInput): NodeInput | undefined {
        const method = instance.classDefinition.findMethod('end', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'end' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        return AST.reduceToFirstIfReturnList(
            this.context.callClassInstanceMethod(instance, method, this.classMethodArgumentValues([Complex.create(indexPosition), Complex.create(indexCount)], 'end'), parent),
        );
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
                            scope.nameTable[ref].node = AST.reduceToFirstIfReturnList(this.Evaluator(scope.nameTable[ref].node, scope));
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
        this.validateFunctionArgumentsBlocks(func);
        scope.defineFunction(func.id, func);
        if (nested) {
            func.definingScope = scope;
            func.attributes = { ...(func.attributes ?? {}), nested: true };
        } else {
            /* Store a lexical capture overlay while keeping live fallback for forward references. */
            func.definingScope = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
            if (func.attributes?.nested) {
                func.attributes = { ...func.attributes };
                delete func.attributes.nested;
            }
        }
    }

    private preregisterScriptLocalFunctions(list: NodeList, scope: Scope): void {
        if (list.parent !== null) {
            return;
        }
        if (this.context.currentFrame?.func?.type === 'FCNDEF') {
            return;
        }
        for (const statement of list.list) {
            if (!AST.isNodeFunctionDefinition(statement)) {
                continue;
            }
            if (scope.functionTable[statement.id] === statement) {
                continue;
            }
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
    }

    private validateAnonymousFunctionSignature(handle: FunctionHandle): void {
        this.validateFunctionSignatureList(handle.parameter, AST.isNodeFunctionParameter, 'varargin', 'parameter', 'anonymous function');
    }

    private getValueClassName(value: NodeInput): string {
        return FunctionValidation.className(value);
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
                evaluate: (expr) => AST.reduceToFirstIfReturnList(this.Evaluator(expr, scope)),
                matchesClass: (value, className) => this.valueMatchesValidationClass(value, className, scope),
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

    private validateClassPropertyValue(property: ClassPropertyDefinition, value: NodeInput, scope: Scope): void {
        const validation = this.classPropertyValidationNode(property);
        FunctionArguments.validateArgumentValidation(
            validation,
            new Map<string, number>(),
            {
                resolveEntry: () => ({ node: value }),
                evaluate: (expr) => AST.reduceToFirstIfReturnList(this.Evaluator(expr, scope)),
                matchesClass: (item, className) => this.valueMatchesValidationClass(item, className, scope),
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
                this.validateClassPropertyValue(property, ClassInstance.getProperty(instance, property.name)!, scope);
            }
        }
    }

    private validateFunctionArguments(func: NodeFunctionDefinition, scope: Scope, targetAttribute: 'Input' | 'Output', namesToValidate?: Set<string>, localNamesOnly = false): void {
        FunctionArguments.validateFunctionArguments(
            func,
            targetAttribute,
            {
                resolveEntry: (validation, namesOnly) => this.getArgumentValidationEntry(validation, scope, namesOnly),
                evaluate: (expr) => AST.reduceToFirstIfReturnList(this.Evaluator(expr, scope)),
                matchesClass: (value, className) => this.valueMatchesValidationClass(value, className, scope),
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

    public validateFunctionRepeatingArguments(func: NodeFunctionDefinition, scope: Scope, values: NodeInput[]): void {
        FunctionArguments.validateRepeatingArguments(func, values, {
            evaluate: (expr) => AST.reduceToFirstIfReturnList(this.Evaluator(expr, scope)),
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

    public splitFunctionCallNameValueArguments(func: NodeFunctionDefinition, args: NodeExpr[]): { positional: NodeExpr[]; named: Map<string, NodeExpr> } {
        return FunctionArguments.splitCallNameValueArguments(
            func,
            args,
            (message) => this.context.throwEvalError(message),
            (message) => this.context.throwSyntaxError(message),
        );
    }

    public bindFunctionNameValueArguments(func: NodeFunctionDefinition, scope: Scope, values: Map<string, NodeInput>): void {
        const declarations = this.getFunctionNameValueDeclarations(func);
        for (const [parameter, fields] of declarations) {
            const options = new Structure({});
            for (const [field, validation] of fields) {
                this.context.pushRequestedOutputCount(1);
                try {
                    Structure.setNewField(options, [field], AST.reduceToFirstIfReturnList(this.Evaluator(validation.default, scope)));
                } finally {
                    this.context.popRequestedOutputCount();
                }
            }
            for (const [field, value] of values) {
                if (fields.has(field)) {
                    Structure.setNewField(options, [field], value);
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
                attributes: { ...(statement.attributes ?? {}) },
            };
            this.validateFunctionSignature(nested);
            this.validateFunctionArgumentsBlocks(nested);
            nested.definingScope = scope;
            nested.attributes = { ...(nested.attributes ?? {}), nested: true };
            scope.defineFunction(nested.id, nested);
        }
    }

    public validateFunctionOutputArguments(func: NodeFunctionDefinition, scope: Scope, requestedOutputCount: number): void {
        const requestedNames = FunctionArguments.outputNamesToValidate(func, requestedOutputCount);
        if (!requestedNames) {
            return;
        }
        this.validateFunctionArguments(func, scope, 'Output', requestedNames, true);
    }

    public getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, NodeExpr> {
        return FunctionArguments.inputArgumentDefaults(func, (message) => this.context.throwSyntaxError(message));
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
                const resolvedFunctionHandleTarget = tree.id && !tree.closure ? this.resolveRuntimeFunction(tree.id, scope) : undefined;
                if (resolvedFunctionHandleTarget?.functionDefinition) {
                    const handle = FunctionHandle.copy(tree);
                    handle.id = tree.id!.includes('.') ? resolvedFunctionHandleTarget.resolvedName : this.context.aliasNameFunction(tree.id!);
                    if (resolvedFunctionHandleTarget.functionDefinition.type === 'FCNDEF') {
                        handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
                    }
                    return handle;
                }
                if (!tree.id && !tree.closure) {
                    this.validateAnonymousFunctionSignature(tree);
                    const handle = FunctionHandle.copy(tree);
                    handle.closure = scope.snapshot((node) => MathOperation.copy(node));
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
                        return AST.reduceToFirstIfReturnList(this.Evaluator(this.requirePrefixOperation(tree).right, scope));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        return this.evaluateUnaryOperation(this.requirePrefixOperation(tree), scope);
                    case '++_':
                    case '--_':
                        return (this.opTable[tree.type] as IncDecOperator)(this.requirePrefixOperation(tree).right as NodeIdentifier);
                    case ".'":
                    case "'":
                        return this.evaluateUnaryOperation(this.requirePostfixOperation(tree), scope);
                    case '_++':
                    case '_--':
                        return (this.opTable[tree.type] as IncDecOperator)(this.requirePostfixOperation(tree).left as NodeIdentifier);
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
                                    const rightValue = AST.reduceToFirstIfReturnList(this.Evaluator(selectRightValue(n)));
                                    if (entry && ClassInstance.isInstanceOf(entry.node) && !this.context.canAccessClassMember(entry.node.classDefinition, 'private')) {
                                        const updated = this.callClassSubsasgnDescriptors(entry.node, descriptors, rightValue, tree);
                                        if (updated) {
                                            entry.node = updated;
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
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
                                        (MultiArray.isInstanceOf(entry.node) || Structure.isInstanceOf(entry.node) || Structure.isStructure(entry.node))
                                    ) {
                                        entry.node = this.assignNativeSubsasgnDescriptors(entry.node, descriptors, rightValue);
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                        continue;
                                    }
                                }
                                if (index) {
                                    /* Computed assignment to an indexed matrix element. */
                                    if (op) {
                                        const entry = scope.resolveName(id);
                                        if (typeof entry !== 'undefined') {
                                            if (!FunctionHandle.isInstanceOf(entry.node)) {
                                                /* Read-modify-write assignment on an indexed matrix element. */
                                                MultiArray.setElements(
                                                    scope,
                                                    id,
                                                    field,
                                                    index.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg))),
                                                    MultiArray.scalarToMultiArray(
                                                        AST.reduceToFirstIfReturnList(
                                                            this.Evaluator(
                                                                AST.nodeOperation(
                                                                    op,
                                                                    MultiArray.getElements(entry.node, id, field, index),
                                                                    MultiArray.scalarToMultiArray(AST.reduceToFirstIfReturnList(this.Evaluator(selectRightValue(n)))),
                                                                ),
                                                                scope,
                                                            ),
                                                        ),
                                                    ),
                                                );
                                                AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                                continue;
                                            } else {
                                                this.context.throwEvalError(`can't perform indexed assignment for function handle type.`);
                                            }
                                        } else {
                                            this.context.throwEvalError(`in computed assignment ${id}(index) OP= X, ${id} must be defined first.`);
                                        }
                                    } else {
                                        /* Direct assignment to an indexed matrix element. */
                                        const rightValue = AST.reduceToFirstIfReturnList(this.Evaluator(selectRightValue(n)));
                                        const entry = scope.resolveName(id);
                                        if (entry && ClassInstance.isInstanceOf(entry.node) && field.length === 0) {
                                            const updated = this.callClassSubsasgn(entry.node, index, delimiter ?? '()', rightValue, tree, scope);
                                            if (updated) {
                                                entry.node = updated;
                                                AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                                continue;
                                            }
                                        }
                                        if (entry && MultiArray.isInstanceOf(entry.node) && field.length === 0 && this.hasClassInstanceElement(entry.node)) {
                                            const evaluatedIndex = index.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg)));
                                            const selected = MultiArray.MultiArrayToScalar(AST.reduceToFirstIfReturnList(MultiArray.getElements(entry.node, id, [], evaluatedIndex)));
                                            if (ClassInstance.isInstanceOf(selected)) {
                                                const updated = this.callClassSubsasgn(selected, index, delimiter ?? '()', rightValue, tree, scope);
                                                if (updated) {
                                                    MultiArray.setElements(scope, id, [], evaluatedIndex, MultiArray.scalarToMultiArray(updated));
                                                    AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), scope.resolveName(id)!.node));
                                                    continue;
                                                }
                                            }
                                        }
                                        if (entry && MultiArray.isInstanceOf(entry.node) && field.length === 1 && this.hasClassInstanceElement(entry.node)) {
                                            entry.node = this.assignClassArrayIndexedField(id, entry.node, index, field[0], rightValue, assignmentTree.left, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                            continue;
                                        }
                                        MultiArray.setElements(
                                            scope,
                                            id,
                                            field,
                                            index.map((arg: NodeExpr) => AST.reduceToFirstIfReturnList(this.Evaluator(arg))),
                                            this.indexedAssignmentRhs(delimiter, rightValue),
                                        );
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), scope.resolveName(id)!.node));
                                    }
                                } else {
                                    /* Name or structure-field assignment. */
                                    const rightN = selectRightValue(n);
                                    rightN.parent = assignmentTree.right;
                                    const expr = op.length
                                        ? typeof error !== 'undefined'
                                            ? AST.nodeOperation(op as OperatorType, AST.nodeIdentifier(id), rightN)
                                            : this.Evaluator(AST.nodeOperation(op as OperatorType, AST.nodeIdentifier(id), rightN))
                                        : rightN;
                                    try {
                                        if (field.length > 0) {
                                            let entry = scope.resolveName(id);
                                            if (typeof entry === 'undefined') {
                                                entry = scope.defineName(id, new Structure({}));
                                            }
                                            if (Structure.isInstanceOf(entry.node)) {
                                                Structure.setNewField(entry.node, field, AST.reduceToFirstIfReturnList(expr));
                                            } else if (MultiArray.isInstanceOf(entry.node) && Structure.isStructure(entry.node)) {
                                                Structure.setNewField(entry.node, field, AST.reduceToFirstIfReturnList(expr));
                                            } else if (ClassInstance.isInstanceOf(entry.node)) {
                                                const value = AST.reduceToFirstIfReturnList(expr);
                                                entry.node = this.assignNestedClassInstanceField(entry.node, field, value, tree, scope);
                                            } else if (MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node)) {
                                                entry.node = this.assignNestedClassArrayField(entry.node, field, AST.reduceToFirstIfReturnList(expr), tree, scope);
                                            } else if (ClassEventListener.isInstanceOf(entry.node)) {
                                                if (field.length !== 1) {
                                                    this.context.throwEvalError(`cannot assign nested property '${field.join('.')}' for event.listener.`);
                                                }
                                                this.setClassEventListenerField(entry.node, field[0], AST.reduceToFirstIfReturnList(expr));
                                            } else {
                                                this.context.throwEvalError('in indexed assignment.');
                                            }
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                        } else {
                                            let entry: NameEntry;
                                            if (undefinedReference) {
                                                if (this.context.allowForwardReference) {
                                                    scope.defineUndefinedReference(undefinedReference, id);
                                                    entry = scope.assignName(id, AST.reduceToFirstIfReturnList(expr), undefinedReference);
                                                } else {
                                                    if (error) throw error;
                                                    this.context.throwUndefinedReferenceError(undefinedReference);
                                                }
                                            } else {
                                                entry = scope.assignName(id, AST.reduceToFirstIfReturnList(expr));
                                            }
                                            this.solveUndefined(id, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                            if (error) throw error;
                                        }
                                    } catch (e: unknown) {
                                        if (this.context.allowForwardReference && this.isLocalUndefinedReference(e)) {
                                            scope.assignName(id, expr, undefinedReference);
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
                        if (!this.context.isInsideUserFunction() && this.scriptExecutionDepth === 0) {
                            this.context.throwEvalError('return is only valid inside a function or script.');
                        }
                        throw new ReturnSignal();
                    case 'BREAK':
                        throw new BreakSignal();
                    case 'CONTINUE':
                        throw new ContinueSignal();
                    case 'FCNDEF': {
                        const func = AST.isNodeFunctionDefinition(tree) ? tree : this.context.throwEvalError(`invalid function definition AST node '${tree.type}'.`);
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
                            const definition = ClassDefinition.create(tree);
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
                                const value = AST.reduceToFirstIfReturnList(this.Evaluator(declarationNode.right, scope));
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
                                const value = AST.reduceToFirstIfReturnList(this.Evaluator(declarationNode.right, scope));
                                this.context.declarePersistent(declarationNode.left.id, value, scope);
                            } else {
                                this.context.throwSyntaxError('invalid persistent declaration.');
                            }
                        }
                        return AST.nodeVoid();
                    }
                    case 'IMPORT':
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
                        const obj = AST.reduceToFirstIfReturnList(this.Evaluator(tree.obj, scope));
                        const fields = tree.field.map((field: NodeExpr) => {
                            if (typeof field === 'string') {
                                return field;
                            } else {
                                const result = AST.reduceToFirstIfReturnList(this.Evaluator(field, scope));
                                if (CharString.isInstanceOf(result)) {
                                    return result.str;
                                } else {
                                    this.context.throwEvalError(`Dynamic structure field names must be strings.`);
                                }
                            }
                        });
                        if (ClassInstance.isInstanceOf(obj)) {
                            let current: NodeInput = obj;
                            for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                                const field = fields[fieldIndex];
                                if (ClassInstance.isInstanceOf(current)) {
                                    current = this.resolveClassInstanceField(current, field, tree);
                                } else if (MultiArray.isInstanceOf(current) && this.hasClassInstanceElement(current)) {
                                    current = this.resolveClassArrayField(current, field, tree);
                                } else {
                                    current = this.resolveStructureLikeField(current, field, fieldIndex === fields.length - 1);
                                }
                            }
                            return current;
                        }
                        if (MultiArray.isInstanceOf(obj) && this.hasClassInstanceElement(obj)) {
                            let current: NodeInput = obj;
                            for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
                                const field = fields[fieldIndex];
                                if (ClassInstance.isInstanceOf(current)) {
                                    current = this.resolveClassInstanceField(current, field, tree);
                                } else if (MultiArray.isInstanceOf(current) && this.hasClassInstanceElement(current)) {
                                    current = this.resolveClassArrayField(current, field, tree);
                                } else {
                                    current = this.resolveStructureLikeField(current, field, fieldIndex === fields.length - 1);
                                }
                            }
                            return current;
                        }
                        if (ClassEventListener.isInstanceOf(obj)) {
                            let current: NodeInput = obj;
                            for (const field of fields) {
                                if (ClassEventListener.isInstanceOf(current)) {
                                    current = this.resolveClassEventListenerField(current, field);
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
                                    current = this.resolveClassInstanceField(current, field, tree);
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
                    case 'SUPERCLASS_CTOR': {
                        const node = tree as NodeSuperclassConstructor;
                        const directTarget = node.instance.type === 'IDENT' ? scope.resolveName(node.instance.id)?.node : undefined;
                        if (node.instance.type === 'IDENT' && !ClassInstance.isInstanceOf(directTarget)) {
                            if (node.args.length === 0) {
                                this.context.throwEvalError(`superclass method '${node.instance.id}' requires an object argument.`);
                            }
                            const receiver = AST.reduceToFirstIfReturnList(this.Evaluator(node.args[0], scope));
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
                        const instance = ClassInstance.isInstanceOf(directTarget) ? directTarget : AST.reduceToFirstIfReturnList(this.Evaluator(node.instance, scope));
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
                        for (let i = 0; i < tree.list.length; i++) {
                            /* Convert undefined name, defined in word-list command, to word-list command.
                             * (Null length word-list command) */
                            if (tree.list[i].type === 'IDENT' && !scope.resolveName(tree.list[i].id) && this.commandWordListNameSet.has(tree.list[i].id)) {
                                tree.list[i].type = 'CMDWLIST';
                                tree.list[i]['args'] = [];
                            }
                            /* PHASE 1: Prepare input node. */
                            tree.list[i].index = i;
                            /* Evaluate */
                            const item = AST.reduceToFirstIfReturnList(this.Evaluator(tree.list[i], scope));
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
                    case 'RANGE':
                        return MultiArray.expandRange(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.start_, scope)),
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.stop_, scope)),
                            tree.stride_ ? AST.reduceToFirstIfReturnList(this.Evaluator(tree.stride_, scope)) : null,
                        );
                    case 'ENDRANGE': {
                        let parent = tree.parent;
                        let index = tree.index;
                        /* Search for 'IDX' node until reach 'IDX' or root node */
                        while (parent !== null && parent.type !== 'IDX') {
                            index = parent.index;
                            parent = parent.parent;
                        }
                        if (parent && parent.type === 'IDX') {
                            const expr = AST.reduceToFirstIfReturnList(this.Evaluator(parent.expr, scope));
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
                        if (tree.parent.type === 'IDX') {
                            const expr = AST.reduceToFirstIfReturnList(this.Evaluator(tree.parent.expr, scope));
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
                        if (!this.hasQualifiedNameAccessOperand(tree, scope)) {
                            const chain = this.collectClassSubsrefChain(tree, scope);
                            if (chain && chain.descriptors.length > 0) {
                                const chainedResult = this.callClassSubsrefDescriptors(chain.instance, chain.descriptors, tree);
                                if (typeof chainedResult !== 'undefined') {
                                    return chainedResult;
                                }
                            }
                        }
                        const expr = AST.reduceToFirstIfReturnList(this.Evaluator(tree.expr, scope));
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
                        const result = entry.func(...tree.args.map((word: CharString) => word.str));
                        return typeof result !== 'undefined' ? result : tree;
                    }
                    case 'IF': {
                        for (let ifTest = 0; ifTest < tree.expression.length; ifTest++) {
                            if (this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression[ifTest], scope)))) {
                                return AST.reduceToFirstIfReturnList(this.Evaluator(tree.then[ifTest], scope));
                            }
                        }
                        /* No one `then` clause. */
                        if (tree.else) {
                            return AST.reduceToFirstIfReturnList(this.Evaluator(tree.else, scope));
                        }
                        /* Return null NodeList. */
                        return {
                            type: 'LIST',
                            list: [],
                            parent: tree,
                        };
                    }
                    case 'SWITCH': {
                        const switchValue = AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope));
                        for (const switchCase of tree.cases) {
                            const caseValue = AST.reduceToFirstIfReturnList(this.Evaluator(switchCase.expression, scope));
                            if (this.switchCaseMatches(switchValue, caseValue)) {
                                return AST.reduceToFirstIfReturnList(this.Evaluator(switchCase.then, scope));
                            }
                        }
                        if (tree.otherwise) {
                            return AST.reduceToFirstIfReturnList(this.Evaluator(tree.otherwise, scope));
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
                            if (!this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope)))) {
                                return result;
                            }
                            try {
                                result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
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
                                result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                            } catch (e: unknown) {
                                if (e instanceof BreakSignal) {
                                    return result;
                                }
                                if (!(e instanceof ContinueSignal)) {
                                    throw e;
                                }
                            }
                            if (this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope)))) {
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
                        const values = this.forLoopValues(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope)), tree.target);
                        for (const value of values) {
                            const assignment = AST.nodeOperation('=', this.cloneAssignmentTarget(tree.target), this.forLoopAssignmentValue(tree.target, value));
                            this.Evaluator(assignment, scope);
                            try {
                                result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
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
                        return AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                    case 'TRY': {
                        try {
                            return AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                        } catch (e: unknown) {
                            if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) {
                                throw e;
                            }
                            if (tree.catchBody) {
                                if (tree.catchIdentifier) {
                                    scope.defineName(tree.catchIdentifier.id, this.exceptionToStruct(e));
                                }
                                return AST.reduceToFirstIfReturnList(this.Evaluator(tree.catchBody, scope));
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
                            result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                        } catch (e: unknown) {
                            thrown = e;
                            didThrow = true;
                        }
                        AST.reduceToFirstIfReturnList(this.Evaluator(tree.cleanup, scope));
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
            return this.Evaluator(tree);
        } catch (e) {
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
                                (this.nodePrecedence(operation.left) < precedence ? '(' + leftUnparse + ')' : leftUnparse) +
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
                                (tree.attribute ? ' (' + this.Unparse(tree.attribute) + ')' : '') +
                                (tree.validation.length > 0 ? '\n' + tree.validation.map((validation: NodeArgumentValidation) => this.Unparse(validation)).join('\n') : '') +
                                '\nENDARGUMENTS'
                            );
                        case 'GLOBAL':
                            return declarationUnparse('global', tree);
                        case 'PERSIST':
                            return declarationUnparse('persistent', tree);
                        case 'IMPORT':
                            return 'import ' + tree.imports.map((entry: NodeIdentifier) => this.Unparse(entry)).join(' ');
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
                            return `<mtable>${keywordRow('arguments', tree.attribute ? this.UnparserMathML(tree.attribute) : undefined)}${tree.validation
                                .map((validation: NodeArgumentValidation) => bodyRow(validation))
                                .join('')}${keywordRow('endarguments')}</mtable>`;
                        case 'GLOBAL':
                            return declarationUnparseMathML('global', tree);
                        case 'PERSIST':
                            return declarationUnparseMathML('persistent', tree);
                        case 'IMPORT':
                            return '<mrow><mi>import</mi><mspace width="0.33em"/>' + tree.imports.map((entry: NodeIdentifier) => this.UnparserMathML(entry)).join('<mo>,</mo>') + '</mrow>';
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
