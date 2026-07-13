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
    NodeBuiltInFunction,
    NodeClassDef,
    NodeArgumentValidation,
    NodeClassAttribute,
    NodeClassSection,
    BuiltInFunctionInputSignature,
    BuiltInFunctionSignature,
    NameEntry,
    AliasNameTable,
    BuiltInFunctionTable,
    CommandWordListTable,
    FunctionSignatureEntry,
    IndexingDelimiterType,
} from './AST';
import {
    AST,
    CharString,
    Complex,
    ComplexType,
    MultiArray,
    Structure,
    FunctionHandle,
    ClassDefinition,
    ClassInstance,
    ClassBoundMethod,
    ClassStaticMethod,
    ClassEmptyMethod,
    ClassEnumerationValue,
    ClassEventListener,
    ClassEventData,
    ClassPropertyEvent,
    ClassMetaObject,
    ClassMetaClass,
} from './AST';
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
import { FunctionCall } from './FunctionCall';
import { FunctionWorkspace } from './FunctionWorkspace';
import { FunctionIntrospection } from './FunctionIntrospection';
import { FunctionLookup } from './FunctionLookup';
import { Scope } from './Scope';
import { CallFrame } from './CallFrame';
import { Callables, type Callable, type FunctionDefinitionCallable } from './Callable';
import type { ClassEventDefinition, ClassMethodDefinition, ClassPropertyDefinition } from './ClassMember';
import { BreakSignal, Context, ContinueSignal, ReturnSignal } from './Context';
import { CircularReferenceError, EvalError, InterpreterError, ReferenceError, SyntaxError, UndefinedReferenceError } from './InterpreterError';

/**
 * Numeric exit status used by the public `exitStatus` property.
 */
type ExitStatus = number;
/** Named exit status table. */
type ExitStatusValues = Record<string, ExitStatus>;

/**
 * Host-provided class source entry.
 *
 * Browser-first execution cannot assume filesystem access, so external classes
 * are supplied by explicit source strings or providers.
 */
type ClassSource = {
    /** Optional canonical class name. */
    name?: string;
    /** Source text containing the classdef. */
    source: string;
};

/**
 * Callback used to provide classdef source for a class name.
 */
type ClassSourceProvider = (name: string) => string | ClassSource | undefined;
/** Table of host-provided class sources keyed by class name. */
type ClassSourceTable = Record<string, string | ClassSource>;

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
    /** Host-provided class source strings. */
    classSourceTable?: ClassSourceTable;
    /** Lazy host-provided class source callback. */
    classSourceProvider?: ClassSourceProvider;
    /**
     * Compatibility alias for early class-loader experiments. Prefer
     * `classSourceTable` for browser/host-provided class sources.
     */
    externalClassSourceTable?: Record<string, string>;
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
type AssignmentTarget = { id: string; index?: NodeExpr[]; delimiter?: IndexingDelimiterType; field: string[]; descriptors?: Structure[] };

/**
 * Interpreter instance interface.
 */
interface InterpreterInterface {
    debug: boolean;
    context: Context;
    exitStatus: ExitStatus;
    precedenceTable: { [key: string]: number };
    Parse(input: string): NodeInput;
    Restart(): void;
    Clear(...names: string[]): void;
    Evaluator(tree: NodeInput, scope?: Scope): NodeInput;
    Evaluate(tree: NodeInput): NodeInput;
    Execute(input: string): NodeInput;
    Unparse(tree: NodeInput, parentPrecedence?: number): string;
    UnparserMathML(tree: NodeInput, parentPrecedence: number): string;
    UnparseMathML(tree: NodeInput, display: 'inline' | 'block' | 'none'): string;
    ToMathML(input: string, display: 'inline' | 'block' | 'none'): string;
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
     * Host-provided class sources keyed by class name.
     *
     * MathJSLab is browser-first, so the engine does not read files directly.
     * Hosts may inject sources here from memory, bundles, virtual filesystems,
     * network caches, or a future file-access layer.
     */
    private classSourceTable: ClassSourceTable = Object.create(null);

    /**
     * Optional host resolver for class sources not present in
     * {@link classSourceTable}.
     */
    private classSourceProvider?: ClassSourceProvider;

    /**
     * Class names currently being loaded, used to avoid recursive loader loops.
     */
    private loadingClassNames = new Set<string>();

    /**
     * Interpreter exit status.
     */
    private _exitStatus: ExitStatus;

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
        } else if (tree.type === 'IDX') {
            const aliasTreeName = this.context.aliasNameFunction(tree.expr.id);
            return tree.expr.type === 'IDENT' &&
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
            target = source.startsWith('@') ? (this.functions.str2func.func as (source: CharString) => FunctionHandle)(arg) : FunctionHandle.create(source);
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

    private localFunctionHandles(): MultiArray {
        return FunctionIntrospection.localFunctionHandles(this.context.currentFrame, this.context.currentScope);
    }

    private dbstackResult(args: NodeInput[]): MultiArray {
        return FunctionIntrospection.dbstackResult(args, this.context.callStack, (message) => this.context.throwSyntaxError(message));
    }

    private exceptionToStruct(error: unknown): Structure {
        const err = error as Error & { identifier?: string };
        return new Structure({
            message: new CharString(err?.message ?? String(error)),
            identifier: new CharString(err?.identifier ?? ''),
            stack: FunctionIntrospection.dbstackResult([], this.context.callStack, (message) => this.context.throwSyntaxError(message)),
        });
    }

    private forLoopValues(value: NodeInput): NodeExpr[] {
        if (!MultiArray.isInstanceOf(value)) {
            return [value as NodeExpr];
        }
        if (value.dimension[0] === 0 || value.dimension[1] === 0) {
            return [];
        }
        if (value.dimension[0] === 1) {
            return value.array[0] as NodeExpr[];
        }
        const result: NodeExpr[] = [];
        for (let column = 0; column < value.dimension[1]; column++) {
            const columnValue = new MultiArray([value.dimension[0], 1], undefined, value.isCell);
            for (let row = 0; row < value.dimension[0]; row++) {
                columnValue.array[row][0] = value.array[row][column];
            }
            result.push(columnValue as NodeExpr);
        }
        return result;
    }

    private forLoopAssignmentValue(target: NodeExpr, value: NodeExpr): NodeExpr {
        if (!MultiArray.isRowVector(target)) {
            return MathOperation.copy(value as MathObject) as NodeExpr;
        }
        const values = MultiArray.linearize(value as MathObject);
        return AST.nodeReturnList(
            (_evaluated: ReturnHandlerResult, index: number) => {
                if (index < values.length) {
                    return MathOperation.copy(values[index] as MathObject) as NodeExpr;
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

    private topLevelClassDefinitions(tree: NodeInput): NodeClassDef[] {
        if (tree.type === 'CLASSDEF') {
            return [tree as NodeClassDef];
        }
        if (tree.type !== 'LIST') {
            return [];
        }
        return tree.list.filter((item: NodeInput): item is NodeClassDef => item.type === 'CLASSDEF');
    }

    private parseClassSource(name: string, source: string): NodeClassDef {
        const simpleName = name.split('.').pop() ?? name;
        const definitions = this.topLevelClassDefinitions(this.Parse(source));
        const definition = definitions.find((item) => item.id === simpleName);
        if (!definition) {
            this.context.throwEvalError(`class '${name}' could not be loaded: source does not contain classdef ${simpleName}.`);
        }
        definition.id = name;
        return definition;
    }

    private resolveClassSource(name: string): ClassSource | undefined {
        const entry = this.classSourceTable[name] ?? this.classSourceProvider?.(name);
        if (typeof entry === 'undefined') {
            return undefined;
        }
        return typeof entry === 'string' ? { name, source: entry } : { name: entry.name ?? name, source: entry.source };
    }

    public loadClassDefinition(name: string, scope: Scope): ClassDefinition | undefined {
        const source = this.resolveClassSource(name);
        if (!source || this.loadingClassNames.has(name)) {
            return undefined;
        }
        this.loadingClassNames.add(name);
        try {
            const definition = ClassDefinition.create(this.parseClassSource(source.name ?? name, source.source));
            definition.resolveSuperclasses(
                (superclassName) => this.context.resolveClassDefinition(superclassName, scope),
                (message) => this.context.throwEvalError(message),
            );
            return definition;
        } finally {
            this.loadingClassNames.delete(name);
        }
    }

    private qualifiedReferenceParts(tree: NodeIndirectRef): string[] | undefined {
        if (tree.obj.type !== 'IDENT' || tree.field.some((field) => typeof field !== 'string')) {
            return undefined;
        }
        return [tree.obj.id, ...(tree.field as string[])];
    }

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

    private resolveQualifiedNameAccess(tree: NodeIndirectRef, scope: Scope): NodeInput | undefined {
        const parts = this.qualifiedReferenceParts(tree);
        if (!parts || parts.length < 2 || scope.resolveName(parts[0])) {
            return undefined;
        }
        for (let prefixLength = parts.length; prefixLength >= 2; prefixLength--) {
            const name = parts.slice(0, prefixLength).join('.');
            const definition = this.context.resolveClassDefinition(name, scope);
            if (definition) {
                definition.parent = tree;
                return this.resolveClassDefinitionMemberChain(definition, parts.slice(prefixLength), scope);
            }
        }
        const name = parts.join('.');
        if (this.context.resolveFunction(name)) {
            const handle = FunctionHandle.create(name);
            handle.parent = tree;
            return handle;
        }
        return undefined;
    }

    private hasQualifiedNameAccessOperand(tree: NodeInput, scope: Scope): boolean {
        if (tree.type === '.') {
            if (typeof this.resolveQualifiedNameAccess(tree as NodeIndirectRef, scope) !== 'undefined') {
                return true;
            }
            return this.hasQualifiedNameAccessOperand((tree as NodeIndirectRef).obj, scope);
        }
        if (tree.type === 'IDX') {
            return this.hasQualifiedNameAccessOperand((tree as NodeIndexExpr).expr, scope);
        }
        return false;
    }

    private resolveMetaclassLiteral(className: string, scope: Scope): NodeInput {
        const parts = className.split('.');
        for (let prefixLength = parts.length; prefixLength >= 1; prefixLength--) {
            const name = parts.slice(0, prefixLength).join('.');
            const definition = this.context.resolveClassDefinition(name, scope);
            if (!definition) {
                continue;
            }
            let current: NodeInput = ClassMetaClass.create(definition);
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

    private existCode(name: string, kind?: string): number {
        const variable = this.context.resolveName(name);
        const func = this.context.resolveFunction(name);
        const normalizedKind = kind?.toLowerCase();
        const shouldResolveClass = normalizedKind === 'class' || (typeof normalizedKind === 'undefined' && !variable && !func);
        return FunctionLookup.existCode(name, kind, variable, func, shouldResolveClass ? !!this.context.resolveClassDefinition(name) : false);
    }

    private whichResult(name: string, handle?: FunctionHandle): CharString {
        const func = handle
            ? FunctionLookup.resolveHandleFunction(
                  handle,
                  name,
                  (item) => this.context.aliasNameFunction(item),
                  (item) => this.context.resolveFunction(item),
              )
            : this.context.resolveFunction(name);
        const variable = this.context.resolveName(name);
        const classDefined = !handle && !variable && !func ? !!this.context.resolveClassDefinition(name) : false;
        return FunctionLookup.whichResult(name, variable, func, handle, (item) => FunctionHandle.unparse(item, this), classDefined);
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
            return ClassMetaClass.create(value);
        }
        if (ClassInstance.isInstanceOf(value) || ClassEnumerationValue.isInstanceOf(value)) {
            return ClassMetaClass.create(value.classDefinition);
        }
        if (CharString.isInstanceOf(value)) {
            const definition = this.context.resolveClassDefinition(value.str);
            if (definition) {
                return ClassMetaClass.create(definition);
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
            this.context.apply(listener.callback as NodeExpr, [source as NodeExpr, data as NodeExpr], AST.nodeIdentifier('notify'));
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
                return definition ? ClassMetaClass.create(definition) : MultiArray.emptyArray();
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
            func: (...args: NodeInput[]): ComplexType => CoreFunctions.isprop(this.classIntrospectionArgument('isprop', args[0]), args[1]),
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
                return FunctionLookup.str2func(
                    (args[0] as CharString).str,
                    (source) => {
                        const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(this.Parse(source), this.context.currentScope));
                        return evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
                    },
                    (message) => this.context.throwEvalError(message),
                );
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'source', classes: ['char'] }] }, outputs: { arity: 1 } },
        },
        builtin: {
            func: (...args: NodeInput[]): NodeExpr => {
                const source = (args[0] as CharString).str.trim();
                const canonical = this.context.aliasNameFunction(source);
                const builtin = this.context.builtInFunctionTable[canonical];
                if (!builtin) {
                    this.context.throwEvalError(`builtin: '${source}' is not a built-in function.`);
                }
                return this.context.callCallable(Callables.builtin(builtin), args.slice(1) as NodeExpr[], AST.nodeIdentifier('builtin'));
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
                let target = args[0] as NodeExpr;
                if (CharString.isInstanceOf(target)) {
                    const source = target.str.trim();
                    target = source.startsWith('@') ? (this.functions.str2func.func as (source: CharString) => FunctionHandle)(target) : FunctionHandle.create(source);
                }
                const callable = this.context.resolveCallable(target);
                if (!callable) {
                    this.context.throwEvalError('feval: first argument must be a function handle or function name.');
                }
                return this.context.callCallable(callable, args.slice(1) as NodeExpr[], AST.nodeIdentifier('feval'));
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
                );
            },
            signature: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        },
        localfunctions: {
            func: (...args: NodeInput[]): MultiArray => {
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
                return this.context.currentFunctionInputName(args[0]);
            },
            signature: {
                inputs: { arity: 1, parameters: [{ name: 'argumentNumber', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] }] },
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
                return FunctionWorkspace.evaluateWithCatch(scope, (args[1] as CharString).str, args.length === 3 ? (args[2] as CharString).str : undefined, (source, itemScope) =>
                    this.evalStringInScope(source, itemScope as Scope),
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
     * Load the `Interpreter`.
     * @param config
     */
    private loadInterpreter(config?: InterpreterConfig) {
        this._exitStatus = Interpreter.response.OK;
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
            this.classSourceTable = config.classSourceTable ?? config.externalClassSourceTable ?? Object.create(null);
            this.classSourceProvider = config.classSourceProvider;
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
                this.commandWordListNameSet = new Set(Object.keys(this.commandWordListTable));
            }
        } else {
            this.context.aliasNameFunction = (name: string): string => name;
            this.classSourceTable = Object.create(null);
            this.classSourceProvider = undefined;
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
        lexer.addErrorListener(new LexerErrorListener());
        parser.removeErrorListeners();
        parser.addErrorListener(new ParserErrorListener());
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
     * Reset the interpreter to a fresh runtime context while preserving the
     * construction-time configuration.
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
                this.context.currentScope.removeName(name);
                const func = this.context.currentScope.functionTable[name];
                if (func?.type === 'FCNDEF') {
                    this.context.currentScope.removeFunction(name);
                }
                if (this.context.nativeNameSet.has(name)) {
                    this.context.globalScope!.defineName(name, this.context.nativeNameTable[name]);
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
        if (tree.type === 'IDENT') {
            return [
                {
                    id: tree.id,
                    field: [],
                },
            ];
        } else if (tree.type === 'IDX' && tree.expr.type === 'IDENT') {
            return [
                {
                    id: tree.expr.id,
                    index: tree.args,
                    delimiter: tree.delim,
                    field: [],
                },
            ];
        } else if (tree.type === '.') {
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
            if (tree.obj.type === 'IDENT') {
                return [
                    {
                        id: tree.obj.id,
                        field,
                    },
                ];
            } else if (tree.obj.type === 'IDX' && tree.obj.expr.type === 'IDENT') {
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
        } else if (tree.type === '<~>') {
            return [
                {
                    id: '~',
                    field: [],
                },
            ];
        } else if (shallow && MultiArray.isRowVector(tree)) {
            return tree.array[0].map((left: NodeExpr) => this.validateAssignment(left, false, scope)[0]);
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
        if (Complex.isInstanceOf(tree)) {
            return Boolean(Complex.realToNumber(value) || Complex.imagToNumber(value));
        } else {
            return !!value.str;
        }
    }

    private switchCaseMatches(switchValue: NodeExpr, caseValue: NodeExpr, scope: Scope): boolean {
        const candidates = MultiArray.isInstanceOf(caseValue) && caseValue.isCell ? MultiArray.linearize(caseValue) : [caseValue];
        for (const candidate of candidates) {
            const matches = AST.reduceToFirstIfReturnList(
                this.Evaluator(AST.nodeOperation('==', MathOperation.copy(switchValue as MathObject) as NodeExpr, MathOperation.copy(candidate as MathObject) as NodeExpr), scope),
            );
            if (this.toBoolean(matches)) {
                return true;
            }
        }
        return false;
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
            return { receiver: value, method, args: value === left ? [right as NodeExpr] : [left as NodeExpr] };
        };
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

    private evaluateBinaryOperation(tree: NodeInput, scope: Scope): NodeInput {
        tree.left.parent = tree;
        tree.right.parent = tree;
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

    private evaluateUnaryOperation(tree: NodeInput, scope: Scope, operandSide: 'left' | 'right'): NodeInput {
        const operand = operandSide === 'left' ? tree.left : tree.right;
        operand.parent = tree;
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
        if (property?.isDependent) {
            const setter = instance.classDefinition.findMethod(`set.${field}`, (item) => !item.isStatic);
            if (!setter) {
                this.context.throwEvalError(`cannot assign to dependent property '${field}' for class ${instance.classDefinition.name} without a set accessor.`);
            }
            const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, setter, [value as NodeExpr], parent));
            if (!ClassInstance.isInstanceOf(updated)) {
                this.context.throwEvalError(`set accessor for dependent property '${field}' must return an object of class ${instance.classDefinition.name}.`);
            }
            if (property.isSetObservable) {
                this.dispatchClassEvent(updated, field, this.propertyEventData(updated, field));
            }
            return updated;
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
        const values = MultiArray.linearize(value as NodeExpr);
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
        const values = MultiArray.linearize(value as NodeExpr);
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
        const evaluatedIndex = index.map((arg: NodeExpr, i: number) => {
            arg.parent = parent;
            arg.index = i;
            return AST.reduceToFirstIfReturnList(this.Evaluator(arg, scope));
        });
        const selected = MultiArray.getElements(array, id, [], evaluatedIndex);
        const selectedValues = MultiArray.linearize(selected as NodeExpr);
        const values = MultiArray.linearize(value as NodeExpr);
        if (values.length !== 1 && values.length !== selectedValues.length) {
            this.context.throwEvalError(`assignment value count ${values.length} does not match selected object count ${selectedValues.length}.`);
        }
        const selectedArray = MultiArray.isInstanceOf(selected) ? selected : MultiArray.scalarToMultiArray(selected as NodeExpr);
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
        if (this.context.requestedOutputCount > 1 && !values.every((value) => ClassBoundMethod.isInstanceOf(value))) {
            return AST.nodeReturnList(
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
                        out[`out${index}`] = values[index] as NodeExpr;
                    }
                    return out;
                },
            );
        }
        return result;
    }

    private resolveStructureLikeField(value: NodeInput, field: string, isLastField: boolean): NodeInput {
        if (MultiArray.isInstanceOf(value) && Structure.isStructure(value)) {
            const fields = Structure.getFields(value, [field]);
            return isLastField && fields.length > 1 ? AST.nodeList(fields as NodeExpr[]) : MultiArray.MultiArrayToScalar(MultiArray.toRowVector(fields));
        }
        return Structure.getField(value, [field]);
    }

    private createSubscriptDescriptor(delimiter: IndexingDelimiterType | '.', args: NodeExpr[], parent: NodeInput, scope: Scope): Structure {
        const subs = new MultiArray([1, args.length]);
        subs.isCell = true;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            arg.parent = parent;
            arg.index = i;
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
        return this.createSubscriptDescriptor('.', [CharString.create(field) as NodeExpr], parent, scope);
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
            this.callClassInstanceMethodWithOutputCount(instance, method, [descriptor as NodeExpr, CharString.create('subsref') as NodeExpr], parent, 1),
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
            return AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, [descriptor as NodeExpr], parent));
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
                const result = this.callClassInstanceMethodWithOutputCount(instance, method, [descriptor as NodeExpr], parent, length);
                const out: ReturnHandlerResult = { length };
                if (result.type === 'RETLIST') {
                    const returnList = result as NodeReturnList;
                    const evaluated = returnList.handler(length);
                    for (let index = 0; index < length; index++) {
                        out[`out${index}`] = returnList.selector(evaluated, index);
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
            if (current.type === 'IDENT') {
                return { id: current.id, descriptors: [] };
            }
            if (current.type === 'IDX') {
                const base = collect(current.expr);
                if (!base) {
                    return undefined;
                }
                base.descriptors.push(this.createSubscriptDescriptor(current.delim, current.args, current, scope));
                return base;
            }
            if (current.type === '.') {
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

    private callClassSubsasgn(instance: ClassInstance, index: NodeExpr[], delimiter: IndexingDelimiterType, value: NodeInput, parent: NodeInput, scope: Scope): ClassInstance | undefined {
        const method = instance.classDefinition.findMethod('subsasgn', (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.context.canAccessClassMember(method.classDefinition, method.access)) {
            this.context.throwEvalError(`method 'subsasgn' has ${method.access} access for class ${instance.classDefinition.name}.`);
        }
        const descriptor = this.createSubsasgnDescriptor(index, delimiter, parent, scope);
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, [descriptor as NodeExpr, value as NodeExpr], parent));
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
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, [descriptor as NodeExpr, value as NodeExpr], parent));
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
        const updated = AST.reduceToFirstIfReturnList(this.context.callClassInstanceMethod(instance, method, [descriptor as NodeExpr, value as NodeExpr], parent));
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
            this.context.callClassInstanceMethod(instance, method, [Complex.create(indexPosition) as NodeExpr, Complex.create(indexCount) as NodeExpr], parent),
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

    private validateFunctionSignatureList(nodes: NodeInput[], variadicName: 'varargin' | 'varargout', listKind: 'parameter' | 'return', functionDisplayName: string): void {
        const seen = new Set<string>();
        nodes.forEach((node, index) => {
            if (node.type === '<~>') {
                return;
            }
            if (node.type !== 'IDENT') {
                this.context.throwSyntaxError(`invalid ${listKind} list in ${functionDisplayName}.`);
            }
            const name = (node as NodeIdentifier).id;
            if (seen.has(name)) {
                this.context.throwSyntaxError(`duplicate ${listKind} name '${name}' in ${functionDisplayName}.`);
            }
            seen.add(name);
            if (name === variadicName && index !== nodes.length - 1) {
                this.context.throwSyntaxError(`${variadicName} must be the last ${listKind} in ${functionDisplayName}.`);
            }
        });
    }

    private validateFunctionSignature(func: NodeFunctionDefinition): void {
        const functionDisplayName = `function ${func.id}`;
        this.validateFunctionSignatureList(func.parameter.list, 'varargin', 'parameter', functionDisplayName);
        this.validateFunctionSignatureList(func.return.list, 'varargout', 'return', functionDisplayName);
    }

    private validateAnonymousFunctionSignature(handle: FunctionHandle): void {
        this.validateFunctionSignatureList(handle.parameter, 'varargin', 'parameter', 'anonymous function');
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
                throwEvalError: (message) => this.context.throwEvalError(message),
                throwSyntaxError: (message) => this.context.throwSyntaxError(message),
            },
            localNamesOnly,
            displayName,
        );
    }

    private validateFunctionArguments(func: NodeFunctionDefinition, scope: Scope, targetAttribute: 'Input' | 'Output', namesToValidate?: Set<string>, localNamesOnly = false): void {
        FunctionArguments.validateFunctionArguments(
            func,
            targetAttribute,
            {
                resolveEntry: (validation, namesOnly) => this.getArgumentValidationEntry(validation, scope, namesOnly),
                evaluate: (expr) => AST.reduceToFirstIfReturnList(this.Evaluator(expr, scope)),
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
            if (statement.type !== 'FCNDEF') {
                continue;
            }
            const nested = {
                ...(statement as NodeFunctionDefinition),
                attributes: { ...((statement as NodeFunctionDefinition).attributes ?? {}) },
            } as NodeFunctionDefinition;
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
                if (tree.id && !tree.closure && scope.resolveFunction(this.context.aliasNameFunction(tree.id))) {
                    const handle = FunctionHandle.copy(tree);
                    handle.closure = scope.capture((node) => MathOperation.copy(node), this.context.allowForwardReference);
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
                    case '&&':
                    case '||':
                        return this.evaluateBinaryOperation(tree, scope);
                    case '()':
                        tree.right.parent = tree;
                        return AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        return this.evaluateUnaryOperation(tree, scope, 'right');
                    case '++_':
                    case '--_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.right);
                    case ".'":
                    case "'":
                        return this.evaluateUnaryOperation(tree, scope, 'left');
                    case '_++':
                    case '_--':
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.left);
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
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        const assignment = this.validateAssignment(tree.left, true, scope);
                        const op: OperatorType | '' = tree.type.substring(0, tree.type.length - 1);
                        if (assignment.length > 1 && op.length > 0) {
                            this.context.throwEvalError('computed multiple assignment not allowed.');
                        }
                        let right: NodeExpr;
                        let undefinedReference: string | undefined;
                        let error: Error | undefined;
                        this.context.pushForwardReferenceTargets(assignment.map(({ id }) => id).filter((id) => id !== '~'));
                        this.context.pushRequestedOutputCount(assignment.length);
                        try {
                            right = tree.right.type === 'RETLIST' ? tree.right : MathOperation.copy(this.Evaluator(tree.right, scope));
                        } catch (e: unknown) {
                            if (!this.context.allowForwardReference) {
                                throw e as Error;
                            }
                            if (!this.isLocalUndefinedReference(e)) {
                                throw e as Error;
                            }
                            error = e as Error;
                            right = MathOperation.copy(tree.right);
                            undefinedReference = e.identifier;
                        } finally {
                            this.context.popRequestedOutputCount();
                            this.context.popForwardReferenceTargets();
                        }
                        /* Convert `right` to `'RETLIST'` if the node is not already of that type. */
                        if (right.type !== 'RETLIST') {
                            const result = right;
                            right = AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number) => {
                                if (index === 0) {
                                    return result;
                                } else {
                                    AST.throwErrorIfGreaterThanReturnList(1, index + 1, (message) => this.context.throwEvalError(message));
                                }
                            });
                        }
                        const resultList = AST.nodeListFirst();
                        const evaluated = (right as NodeReturnList).handler(assignment.length);
                        for (let n = 0; n < assignment.length; n++) {
                            const { id, index, delimiter, field, descriptors } = assignment[n];
                            if (id !== '~') {
                                /* Apply one assignment target. */
                                if (descriptors && descriptors.length > 0 && !op) {
                                    const entry = scope.resolveName(id);
                                    const rightValue = AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)));
                                    if (entry && ClassInstance.isInstanceOf(entry.node) && !this.context.canAccessClassMember(entry.node.classDefinition, 'private')) {
                                        const updated = this.callClassSubsasgnDescriptors(entry.node, descriptors, rightValue, tree);
                                        if (updated) {
                                            entry.node = updated;
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                            continue;
                                        }
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
                                                                    MultiArray.scalarToMultiArray(
                                                                        AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n))),
                                                                    ),
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
                                        const rightValue = AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)));
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
                                            const evaluatedIndex = index.map((arg: NodeExpr, i: number) => {
                                                arg.parent = tree.left;
                                                arg.index = i;
                                                return AST.reduceToFirstIfReturnList(this.Evaluator(arg));
                                            });
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
                                            entry.node = this.assignClassArrayIndexedField(id, entry.node, index, field[0], rightValue, tree.left, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                            continue;
                                        }
                                        MultiArray.setElements(
                                            scope,
                                            id,
                                            field,
                                            index.map((arg: NodeExpr, i: number) => {
                                                arg.parent = tree.left;
                                                arg.index = i;
                                                return AST.reduceToFirstIfReturnList(this.Evaluator(arg));
                                            }),
                                            MultiArray.scalarToMultiArray(rightValue),
                                        );
                                        AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), scope.resolveName(id)!.node));
                                    }
                                } else {
                                    /* Name or structure-field assignment. */
                                    const rightN = (right as NodeReturnList).selector(evaluated, n);
                                    rightN.parent = tree.right;
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
                                            } else if (ClassInstance.isInstanceOf(entry.node)) {
                                                const value = AST.reduceToFirstIfReturnList(expr);
                                                entry.node = this.assignNestedClassInstanceField(entry.node, field, value, tree, scope);
                                            } else if (MultiArray.isInstanceOf(entry.node) && this.hasClassInstanceElement(entry.node)) {
                                                entry.node = this.assignNestedClassArrayField(entry.node, field, AST.reduceToFirstIfReturnList(expr), tree, scope);
                                            } else if (ClassEventListener.isInstanceOf(entry.node)) {
                                                if (field.length !== 1) {
                                                    this.context.throwEvalError('nested event.listener property assignment is not supported yet.');
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
                        if (tree.parent === null || tree.parent.parent === null) {
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
                            return (resultList.list[0] as NodeExpr).right;
                        }
                    }
                    case 'IDENT':
                        return this.context.resolveIdentifier(tree, scope);
                    case 'RETURN':
                        if (this.context.currentFrame?.func?.type !== 'FCNDEF') {
                            this.context.throwEvalError('return is only valid inside a function.');
                        }
                        throw new ReturnSignal();
                    case 'BREAK':
                        throw new BreakSignal();
                    case 'CONTINUE':
                        throw new ContinueSignal();
                    case 'FCNDEF': {
                        const func = tree as NodeFunctionDefinition;
                        if (this.context.currentFrame?.func?.type === 'FCNDEF' && scope.hasLocalFunction(func.id)) {
                            return AST.nodeVoid();
                        }
                        this.validateFunctionSignature(func);
                        this.validateFunctionArgumentsBlocks(func);
                        /* Register function in the current scope. */
                        scope.defineFunction(func.id, func);
                        if (this.context.currentFrame?.func?.type === 'FCNDEF') {
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
                            if (declarationNode.type === 'IDENT') {
                                this.context.declareGlobal(declarationNode.id, undefined, scope);
                            } else if (declarationNode.type === '=' && declarationNode.left.type === 'IDENT') {
                                declarationNode.right.parent = declarationNode;
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
                            if (declarationNode.type === 'IDENT') {
                                this.context.declarePersistent(declarationNode.id, undefined, scope);
                            } else if (declarationNode.type === '=' && declarationNode.left.type === 'IDENT') {
                                declarationNode.right.parent = declarationNode;
                                const value = AST.reduceToFirstIfReturnList(this.Evaluator(declarationNode.right, scope));
                                this.context.declarePersistent(declarationNode.left.id, value, scope);
                            } else {
                                this.context.throwSyntaxError('invalid persistent declaration.');
                            }
                        }
                        return AST.nodeVoid();
                    }
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
                            let current: NodeInput = obj;
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
                        const result = Structure.getFields(obj, fields);
                        if (result.length === 1) {
                            return result[0];
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
                            tree.list[i].parent = result;
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
                        tree.start_.parent = tree;
                        tree.stop_.parent = tree;
                        if (tree.stride_) {
                            tree.stride_.parent = tree;
                        }
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
                        tree.expr.parent = tree;
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
                        const result = this.commandWordListTable[tree.id].func(...tree.args.map((word: CharString) => word.str));
                        return typeof result !== 'undefined' ? result : tree;
                    }
                    case 'IF': {
                        for (let ifTest = 0; ifTest < tree.expression.length; ifTest++) {
                            tree.expression[ifTest].parent = tree;
                            if (this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression[ifTest], scope)))) {
                                tree.then[ifTest].parent = tree;
                                return AST.reduceToFirstIfReturnList(this.Evaluator(tree.then[ifTest], scope));
                            }
                        }
                        /* No one `then` clause. */
                        if (tree.else) {
                            tree.else.parent = tree;
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
                        tree.expression.parent = tree;
                        const switchValue = AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope));
                        for (const switchCase of tree.cases) {
                            switchCase.parent = tree;
                            switchCase.expression.parent = switchCase;
                            const caseValue = AST.reduceToFirstIfReturnList(this.Evaluator(switchCase.expression, scope));
                            if (this.switchCaseMatches(switchValue, caseValue, scope)) {
                                switchCase.then.parent = switchCase;
                                return AST.reduceToFirstIfReturnList(this.Evaluator(switchCase.then, scope));
                            }
                        }
                        if (tree.otherwise) {
                            tree.otherwise.parent = tree;
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
                            tree.expression.parent = tree;
                            if (!this.toBoolean(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope)))) {
                                return result;
                            }
                            try {
                                tree.body.parent = tree;
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
                                tree.body.parent = tree;
                                result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                            } catch (e: unknown) {
                                if (e instanceof BreakSignal) {
                                    return result;
                                }
                                if (!(e instanceof ContinueSignal)) {
                                    throw e;
                                }
                            }
                            tree.expression.parent = tree;
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
                        tree.expression.parent = tree;
                        const values = this.forLoopValues(AST.reduceToFirstIfReturnList(this.Evaluator(tree.expression, scope)));
                        for (const value of values) {
                            const assignment = AST.nodeOperation('=', tree.target, this.forLoopAssignmentValue(tree.target, value));
                            assignment.parent = tree;
                            this.Evaluator(assignment, scope);
                            try {
                                tree.body.parent = tree;
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
                        tree.body.parent = tree;
                        return AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                    case 'TRY': {
                        try {
                            tree.body.parent = tree;
                            return AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                        } catch (e: unknown) {
                            if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) {
                                throw e;
                            }
                            if (tree.catchBody) {
                                if (tree.catchIdentifier) {
                                    scope.defineName(tree.catchIdentifier.id, this.exceptionToStruct(e));
                                }
                                tree.catchBody.parent = tree;
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
                            tree.body.parent = tree;
                            result = AST.reduceToFirstIfReturnList(this.Evaluator(tree.body, scope));
                        } catch (e: unknown) {
                            thrown = e;
                            didThrow = true;
                        }
                        tree.cleanup.parent = tree;
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
                this.context.throwEvalError('break is only valid inside a loop.');
            }
            if (e instanceof ContinueSignal) {
                this.context.throwEvalError('continue is only valid inside a loop.');
            }
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
        return this.Evaluate(this.Parse(input));
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
        const leftUnparse = (type: NodeType | number, tree: NodeInput) => {
            const precedence = this.nodePrecedence(tree);
            const leftUnparse = this.Unparse(tree.left, precedence);
            return (this.nodePrecedence(tree.right) < precedence ? '(' + leftUnparse + ')' : leftUnparse) + type;
        };
        const rightUnparse = (type: NodeType | number, tree: NodeInput) => {
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
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.Unparse(tree.left, precedence);
                            const rightUnparse = this.Unparse(tree.right, precedence);
                            return (
                                (this.nodePrecedence(tree.left) < precedence ? '(' + leftUnparse + ')' : leftUnparse) +
                                tree.type +
                                (this.nodePrecedence(tree.right) < precedence ? '(' + rightUnparse + ')' : rightUnparse)
                            );
                        }
                        case '()': {
                            const precedence = this.nodePrecedence(tree.right);
                            const rightUnparse = this.Unparse(tree.right, precedence);
                            return precedence < parentPrecedence ? '(' + rightUnparse + ')' : rightUnparse;
                        }
                        case '!':
                        case '~':
                            return rightUnparse(tree.type, tree);
                        case '+_':
                            return rightUnparse('+', tree);
                        case '-_':
                            return rightUnparse('-', tree);
                        case '++_':
                            return rightUnparse('++' as NodeType, tree);
                        case '--_':
                            return rightUnparse('--' as NodeType, tree);
                        case ".'":
                        case "'":
                            return leftUnparse(tree.type, tree);
                        case '_++':
                            return leftUnparse('++' as NodeType, tree);
                        case '_--':
                            return leftUnparse('--' as NodeType, tree);
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
                                this.Unparse(tree.target) +
                                '=' +
                                this.Unparse(tree.expression) +
                                '\n' +
                                this.Unparse(tree.body) +
                                (tree.parallel ? '\nENDPARFOR' : '\nENDFOR')
                            );
                        case 'SPMD':
                            return 'SPMD\n' + this.Unparse(tree.body) + '\nENDSPMD';
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
                                (tree.superclasses.length > 0 ? ' < ' + tree.superclasses.map((superclass: NodeIdentifier) => this.Unparse(superclass)).join(',') : '') +
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
                            return tree.id + (tree.defaultValue ? '=' + this.Unparse(tree.defaultValue).trimEnd() : '');
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
        } catch (e) {
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
                            const precedence = this.nodePrecedence(tree.right);
                            const rightUnparse = this.UnparserMathML(tree.right, precedence);
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
                            const precedence = this.nodePrecedence(tree);
                            const leftUnparse = this.UnparserMathML(tree.left, precedence);
                            const rightUnparse = this.UnparserMathML(tree.right, precedence);
                            return MathML.format[tree.type](
                                this.nodePrecedence(tree.left) < precedence ? MathML.format['()']('(', leftUnparse, ')') : leftUnparse,
                                this.nodePrecedence(tree.right) < precedence ? MathML.format['()']('(', rightUnparse, ')') : rightUnparse,
                            );
                        }
                        case '/':
                            return MathML.format[tree.type](this.UnparserMathML(tree.left), this.UnparserMathML(tree.right));
                        case '**':
                        case '^':
                            return MathML.format[tree.type](this.UnparserMathML(tree.left, this.precedenceTable['_' + tree.type]), this.UnparserMathML(tree.right));
                        case '!':
                        case '~':
                        case '+_':
                        case '-_':
                        case '++_':
                        case '--_':
                            return MathML.format[tree.type](this.UnparserMathML(tree.right));
                        case '_++':
                        case '_--':
                        case ".'":
                        case "'":
                            return MathML.format[tree.type](this.UnparserMathML(tree.left, this.precedenceTable['_' + tree.type]));
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
                            return MathML.format[tree.type]();
                        case 'IDX':
                            if (tree.args.length === 0) {
                                return MathML.format['IDX'](this.UnparserMathML(tree.expr), tree.delim[0], [], tree.delim[1]);
                            } else {
                                let unparse;
                                if (tree.expr.type === 'IDENT') {
                                    const aliasTreeName = this.context.aliasNameFunction(tree.expr.id);
                                    if (aliasTreeName in this.context.builtInFunctionTable && this.context.builtInFunctionTable[aliasTreeName].UnparserMathML) {
                                        unparse = this.context.builtInFunctionTable[aliasTreeName].UnparserMathML(tree);
                                    } else if (aliasTreeName in this.context.builtInFunctionTable && aliasTreeName in MathML.format) {
                                        unparse = MathML.format[aliasTreeName](...tree.args.map((arg: NodeExpr) => this.UnparserMathML(arg)));
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
                        case 'GLOBAL':
                            return declarationUnparseMathML('global', tree);
                        case 'PERSIST':
                            return declarationUnparseMathML('persistent', tree);
                        case 'RETURN':
                            return '<mi>return</mi>';
                        case 'IF':
                            const ifThenArray = tree.expression.map(
                                (expr: NodeInput, i: number) =>
                                    `<mtr><mtd><mo>${i === 0 ? '<b>if</b>' : '<b>elseif</b>'}</mo></mtd><mtd>${this.UnparserMathML(
                                        tree.expression[0],
                                    )}</mtd></mtr><mtr><mtd></mtd><mtd>${this.UnparserMathML(tree.then[0])}</mtd></mtr>`,
                            );
                            const ifElse = tree.else ? `<mtr><mtd><mo><b>else</b></mo></mtd></mtr><mtr><mtd></mtd><mtd>${this.UnparserMathML(tree.else)}</mtd></mtr>` : '';
                            return `<mtable>${ifThenArray.join('')}${ifElse}<mtr><mtd><mo><b>endif</b></mo></mtd></mtr></mtable>`;
                        case 'FCNDEF':
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

export type { ClassSource, ClassSourceProvider, ClassSourceTable, InterpreterConfig, IncDecOperator };
export type { BuiltinCallable, Callable, FunctionDefinitionCallable, LambdaCallable } from './Callable';
export { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
export default { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
