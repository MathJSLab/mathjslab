import type {
    AliasNameTable,
    BuiltInFunctionInputSignature,
    BuiltInFunctionSignature,
    ExpressionBoundaryValue,
    NameEntry,
    NodeBuiltInFunction,
    NodeExpr,
    NodeInput,
    NodeFunctionDefinition,
    NodeReturnList,
    ReturnHandlerResult,
    RuntimeExpressionValue,
} from './AST';
import type { ClassMethodDefinition as ClassMethodDefinitionBase } from './ClassMember';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex, type ComplexType } from './Complex';
import { FunctionHandle } from './FunctionHandle';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { ClassDefinition } from './ClassDefinition';
import { ClassInstance } from './ClassInstance';
import { ClassBoundMethod } from './ClassBoundMethod';
import { ClassStaticMethod } from './ClassStaticMethod';
import { ClassEmptyMethod } from './ClassEmptyMethod';
import { ClassEventListener } from './ClassEventListener';
import type { BinaryMathOperation, KeyOfTypeOfMathOperation, UnaryMathOperation } from './MathOperation';
import { Scope } from './Scope';
import { CallFrame } from './CallFrame';
import { Callables, type Callable, type FunctionDefinitionCallable } from './Callable';
import { FunctionSignature } from './FunctionSignature';
import type { CallArgumentValue, FunctionParameter } from './FunctionCall';
import { FunctionCall } from './FunctionCall';
import { FunctionStack } from './FunctionStack';
import { FunctionWorkspace } from './FunctionWorkspace';
import { CircularReferenceError, EvalError, ReferenceError, SyntaxError, UndefinedReferenceError } from './InterpreterError';
import { expressionValue, expressionValues, runtimeExpressionValue } from './ExpressionValue';
import { RuntimeValue } from './RuntimeValue';

type ClassMethodDefinition = ClassMethodDefinitionBase<ClassDefinition>;

/** Symbol-table entry with a materialized runtime/AST value. */
type ResolvedNameEntry = NameEntry & { node: NodeInput };

/**
 * Interpreter services used by `Context`.
 *
 * Keeping this as a narrow structural interface avoids a hard cycle between the
 * execution context and the full interpreter implementation while still letting
 * the context call back into parsing/evaluation-sensitive operations.
 */
interface ContextInterpreter {
    /** Whether debug tracing is enabled for call/index dispatch. */
    debug: boolean;
    /** Evaluate one AST/runtime node in a scope. */
    Evaluator(tree: NodeInput, scope?: Scope): NodeInput;
    /** Return parameters backed exclusively by name-value declarations. */
    getFunctionNameValueParameters(func: NodeFunctionDefinition): Set<string>;
    /** Split call-site expressions into positional and name-value groups. */
    splitFunctionCallNameValueArguments(func: NodeFunctionDefinition, args: CallArgumentValue[]): { positional: CallArgumentValue[]; named: Map<string, CallArgumentValue> };
    /** Return default input expressions keyed by parameter name. */
    getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, NodeExpr>;
    /** Return the `arguments (Output,Repeating)` output name, when present. */
    getFunctionOutputRepeatingName(func: NodeFunctionDefinition): string | undefined;
    /** Bind evaluated name-value arguments into a function call scope. */
    bindFunctionNameValueArguments(func: NodeFunctionDefinition, scope: Scope, values: Map<string, ExpressionBoundaryValue>): void;
    /** Preprocess imports that apply to an entire script/function scope. */
    applyScopedImports(tree: NodeInput, scope: Scope): void;
    /** Register nested functions visible from a function body. */
    registerNestedFunctions(func: NodeFunctionDefinition, scope: Scope): void;
    /** Configure static-workspace metadata for nested-function-compatible calls. */
    configureFunctionWorkspace(func: NodeFunctionDefinition, scope: Scope): void;
    /** Validate input `arguments` blocks after inputs are bound. */
    validateFunctionInputArguments(func: NodeFunctionDefinition, scope: Scope): void;
    /** Validate `arguments (Repeating)` declarations against `varargin`. */
    validateFunctionRepeatingArguments(func: NodeFunctionDefinition, scope: Scope, values: ExpressionBoundaryValue[]): void;
    /** Validate output `arguments` blocks after the body executes. */
    validateFunctionOutputArguments(func: NodeFunctionDefinition, scope: Scope, requestedOutputCount: number, outputMask?: boolean[]): void;
    /** Validate property defaults for a newly instantiated class object. */
    validateClassInstancePropertyDefaults(instance: ClassInstance, scope: Scope): void;
    /** Resolve a function source through the configured function provider API. */
    loadFunctionDefinition(name: string, scope: Scope): NodeFunctionDefinition | undefined;
    /** Resolve a class source through the configured class provider API. */
    loadClassDefinition(name: string, scope: Scope): ClassDefinition | undefined;
    /** Resolve a class method source for a prototype declared in a classdef block. */
    loadClassMethodDefinition(className: string, methodName: string, scope: Scope): NodeFunctionDefinition | undefined;
    /** Resolve a static class method selected by qualified name or visible imports. */
    resolveStaticMethod(name: string, scope: Scope): ClassStaticMethod | undefined;
    /** Dispatch a functional operator call through class overload semantics, when applicable. */
    callFunctionalOperatorOverload(node: NodeBuiltInFunction, args: CallArgumentValue[], parent: NodeInput): NodeExpr | undefined;
    /** Convert object values used as native array indices through `subsindex`. */
    convertIndexArgument(value: NodeInput, parent: NodeInput): NodeInput;
}

/** Structural node shape used when walking parent links for diagnostics. */
type ParentLinkedNode = NodeExpr & {
    start?: unknown;
    parent?: unknown;
};

/** Structural shape for debug output that only needs an optional identifier. */
type IdentifierLikeNode = {
    id?: unknown;
};

/**
 * Kinds of MATLAB/Octave symbols that can be resolved from a name.
 */
type SymbolResolutionKind = 'variable' | 'class' | 'function' | 'builtin' | 'script' | 'directory';

/**
 * Source tier that produced a resolved symbol.
 */
type SymbolResolutionSource = 'local' | 'import' | 'builtin';

/**
 * Options that tune name lookup while keeping the default MATLAB/Octave
 * precedence intact.
 */
type SymbolResolutionOptions = {
    /** Whether variable bindings should be considered. */
    variables?: boolean;
    /** Whether class definitions should be considered. */
    classes?: boolean;
    /** Whether class source providers may be loaded as part of class lookup. */
    loadClasses?: boolean;
    /** Whether function source providers may be loaded as part of function lookup. */
    loadFunctions?: boolean;
    /** Whether user functions and built-ins should be considered. */
    functions?: boolean;
    /** Whether imported simple-name candidates may be considered. */
    imports?: boolean;
};

/**
 * Structured result for one resolved name.
 */
type SymbolResolution = {
    /** Symbol category selected by name precedence. */
    kind: SymbolResolutionKind;
    /** Name requested by the caller. */
    name: string;
    /** Canonical name actually resolved after aliases/imports. */
    resolvedName: string;
    /** Lookup tier that produced the result. */
    source: SymbolResolutionSource;
    /** Variable entry when {@link kind} is `variable`. */
    entry?: NameEntry;
    /** Class definition when {@link kind} is `class`. */
    classDefinition?: ClassDefinition;
    /** Function node when {@link kind} is `function` or `builtin`. */
    functionDefinition?: NodeFunctionDefinition | NodeBuiltInFunction;
    /** Virtual `.m` source identity when lookup only materialized source metadata. */
    sourceName?: string;
};

/**
 * Kinds of call/index dispatch selected after a callee expression is evaluated.
 */
type CallDispatchKind = 'callable' | 'bound-method' | 'bound-method-array' | 'static-method' | 'empty-method' | 'constructor' | 'functional-class-method' | 'undefined-function' | 'indexing';

/**
 * Structured call/index dispatch decision.
 */
type CallDispatch =
    | { kind: 'callable'; callable: Callable; expr: NodeExpr }
    | { kind: 'bound-method'; expr: ClassBoundMethod }
    | { kind: 'bound-method-array'; expr: MultiArray }
    | { kind: 'static-method'; expr: ClassStaticMethod }
    | { kind: 'empty-method'; expr: ClassEmptyMethod }
    | { kind: 'constructor'; expr: ClassDefinition }
    | { kind: 'functional-class-method'; expr: NodeExpr; functionalName: string; functionalReceiver: NodeInput }
    | { kind: 'undefined-function'; expr: NodeExpr; functionalName: string }
    | { kind: 'indexing'; expr: NodeExpr };

/** Optional callable metadata captured by anonymous handles. */
type CallableClassMetadata = { className?: string };

/**
 * Internal control-flow signal used to leave a function body on `return`.
 */
class ReturnSignal extends Error {
    public constructor() {
        super('return');
        this.name = 'ReturnSignal';
    }
}

/**
 * Internal control-flow signal used to leave loop bodies on `break`.
 */
class BreakSignal extends Error {
    public constructor() {
        super('break');
        this.name = 'BreakSignal';
    }
}

/**
 * Internal control-flow signal used to continue loop bodies on `continue`.
 */
class ContinueSignal extends Error {
    public constructor() {
        super('continue');
        this.name = 'ContinueSignal';
    }
}

/**
 * Execution context for MathJSLab evaluation.
 *
 * `Context` owns the call stack, global workspace, built-in table, arity state,
 * comma-separated-list expansion state, class access stack, and MATLAB-like
 * workspace helpers. The interpreter owns AST traversal and delegates runtime
 * mechanics here so function calls, built-ins, class dispatch, and diagnostics
 * share one consistent state model.
 */
class Context {
    /** Built-ins that MATLAB/Octave users commonly invoke without parentheses. */
    private static readonly bareZeroArgumentBuiltins = new Set(['lastwarn', 'lasterr', 'lasterror', 'localfunctions', 'mfilename']);

    /**
     * Built-in function names that are also operator method names.
     *
     * Direct calls such as `lt(a,b)` and handles such as `f = @plus; f(a,b)`
     * must give class operands the same overload opportunity as symbolic
     * operators (`a < b`, `a + b`). Keeping the list here avoids importing
     * `MathOperation` as a runtime value into `Context`.
     */
    private static readonly operatorFunctionNames = new Set([
        'uplus',
        'uminus',
        'not',
        'transpose',
        'ctranspose',
        'minus',
        'mod',
        'rem',
        'rdivide',
        'mrdivide',
        'ldivide',
        'mldivide',
        'power',
        'mpower',
        'lt',
        'le',
        'ge',
        'gt',
        'eq',
        'ne',
        'plus',
        'times',
        'mtimes',
        'and',
        'or',
        'xor',
        'colon',
        'cat',
        'horzcat',
        'vertcat',
    ]);

    /**
     * Built-ins whose MATLAB class implementations are ordinary instance
     * methods when the first argument is an object.
     */
    private static readonly classBuiltinMethodFunctionNames = new Set([
        'size',
        'numel',
        'length',
        'ndims',
        'rows',
        'columns',
        'isempty',
        'isequal',
        'double',
        'char',
        'logical',
        'cell',
        'cellstr',
        'num2cell',
        'cell2mat',
        'cell2struct',
        'mat2cell',
        'isscalar',
        'ismatrix',
        'isvector',
        'isrow',
        'iscolumn',
        'iscell',
        'iscellstr',
        'isstruct',
        'struct',
        'fieldnames',
        'properties',
        'methods',
        'events',
        'enumeration',
        'superclasses',
        'isfield',
        'isprop',
        'ismethod',
        'numfields',
        'getfield',
        'setfield',
        'rmfield',
        'orderfields',
        'struct2cell',
        'ischar',
        'isstring',
        'issparse',
        'full',
        'sparse',
        'spalloc',
        'nnz',
        'nzmax',
        'nonzeros',
        'isnan',
        'isinf',
        'isfinite',
        'isfloat',
        'isinteger',
        'isnumeric',
        'islogical',
        'isreal',
        'isobject',
        'isvalid',
        'find',
        'ind2sub',
        'sub2ind',
        'sort',
        'all',
        'any',
        'sum',
        'prod',
        'sumsq',
        'cumsum',
        'cumprod',
        'min',
        'max',
        'cummin',
        'cummax',
        'mean',
        'var',
        'std',
        'linspace',
        'logspace',
        'meshgrid',
        'ndgrid',
        'zeros',
        'ones',
        'rand',
        'randi',
        'repmat',
        'reshape',
        'squeeze',
        'flip',
        'fliplr',
        'flipud',
        'rot90',
        'permute',
        'ipermute',
        'circshift',
        'shiftdim',
        'norm',
    ]);

    /**
     * Function call stack.
     */
    public callStack: CallFrame[] = [];

    /**
     * Reset the execution context to a provided scope/stack or to a fresh global state.
     *
     * @param globalScope Optional global scope to install.
     * @param callStack Optional call stack to install.
     */
    public loadContext(globalScope?: Scope, callStack?: CallFrame[]): void {
        if (globalScope) {
            this.globalScope = globalScope;
        } else {
            this.globalScope = Scope.create();
            this.globalScope.nameTable = Object.create(null);
            this.globalScope.functionTable = Object.create(null);
            this.globalScope.undefinedReferenceTable = Object.create(null);
        }
        this.globalNameSet = new Set<string>();
        this.globalInitializedNameSet = new Set<string>();
        this.callStack = callStack ?? [new CallFrame(this.globalScope)];
    }

    /**
     * Private constructor (only used by `create` static method).
     * @param globalScope Optional global scope reference.
     * @param callStack Optional function call stack reference.
     */
    private constructor(
        /**
         * Interpreter instance associated to this context.
         */
        public interpreter?: ContextInterpreter,
        /**
         * Global scope.
         */
        public globalScope?: Scope,
        callStack?: CallFrame[],
        /**
         * Built-in function table.
         */
        public builtInFunctionTable: Record<string, NodeBuiltInFunction> = Object.create(null),
        /**
         * Whether assignments may keep unresolved identifiers for later resolution.
         */
        public allowForwardReference: boolean = true,
        /**
         * Names declared as global in the current context.
         */
        public globalNameSet: Set<string> = new Set<string>(),
        /**
         * Global names initialized by Octave-style `global name = value`
         * declarations during this context lifetime.
         */
        public globalInitializedNameSet: Set<string> = new Set<string>(),
        /**
         * Assignment targets whose right-hand side is currently being evaluated.
         *
         * This stack lets undefined-reference handling distinguish a local
         * forward reference from a dependency cycle such as `A -> B -> A`.
         */
        private forwardReferenceTargetStack: string[][] = [],
        /**
         * Requested output counts for expressions currently being evaluated.
         */
        private requestedOutputCountStack: number[] = [],
        /**
         * Per-output request masks for expressions currently being evaluated.
         */
        private requestedOutputMaskStack: { depth: number; mask: boolean[] }[] = [],
        /**
         * Whether the current evaluation context should expand comma-separated lists.
         */
        private commaListExpansionStack: boolean[] = [],
        /**
         * Classes whose method bodies are currently executing.
         */
        private classAccessStack: ClassDefinition[] = [],
    ) {
        this.loadContext(globalScope, callStack);
    }

    /**
     * Create {@link Context} object.
     * @param interpreter Optional interpreter instance associated with the context.
     * @param globalScope Optional global scope reference.
     * @param callStack Optional function call stack reference.
     * @returns New interpreter context.
     */
    public static readonly create = (interpreter?: ContextInterpreter, globalScope?: Scope, callStack?: CallFrame[]): Context => new Context(interpreter, globalScope, callStack);

    /**
     * Native constants inserted into the global name table during interpreter loading.
     */
    public nativeNameTable: Record<string, ComplexType>;

    /**
     * Names provided by {@link nativeNameTable}.
     */
    public nativeNameSet: Set<string>;

    /**
     * Alias name table.
     */
    private aliasNameTable: AliasNameTable;

    /**
     * Alias name function. This property is set at Interpreter instantiation.
     * @param name Alias name.
     * @returns Canonical name.
     */
    public aliasNameFunction = (name: string): string => name;

    /**
     * Configure aliases that map alternative spellings to canonical function names.
     * @param aliasNameTable Alias patterns keyed by canonical names.
     */
    public setAliasNameTable(aliasNameTable?: AliasNameTable): void {
        if (aliasNameTable) {
            this.aliasNameTable = Object.create(null);
            for (const [aliasName, pattern] of Object.entries(aliasNameTable)) {
                this.aliasNameTable[aliasName] = pattern;
            }
            this.aliasNameFunction = (name: string): string => {
                for (const [aliasName, pattern] of Object.entries(this.aliasNameTable)) {
                    if (pattern.test(name)) {
                        return aliasName;
                    }
                }
                return name;
            };
        } else {
            this.aliasNameFunction = (name: string): string => name;
        }
    }

    /**
     * Get a list of names of defined functions in builtInFunctionTable.
     */
    public get builtInFunctionList(): string[] {
        return Object.keys(this.builtInFunctionTable);
    }

    /**
     * Current frame (top of call stack) getter.
     */
    public get currentFrame(): CallFrame | undefined {
        return this.callStack[this.callStack.length - 1];
    }

    /**
     * Current scope (top of call stack) getter.
     */
    public get currentScope(): Scope {
        return this.currentFrame!.scope;
    }

    /**
     * Resolve a variable name from the current scope chain.
     * @param name Identifier to resolve.
     * @returns Matching name entry, or `undefined` when not found.
     */
    public resolveName(name: string): NameEntry | undefined {
        return this.currentScope.resolveName(name);
    }

    /**
     * Resolve a name using the current MATLAB/Octave-like precedence model.
     *
     * The default order is variable, registered class, local/provider function,
     * host-loadable class, explicit/wildcard imports for class/function
     * candidates, and finally built-ins. Returning a structured result keeps
     * this order visible to dispatch, `exist`, `which`, and future
     * filesystem-like lookup work.
     *
     * @param name Name requested by source code.
     * @param scope Lookup scope.
     * @param options Optional switches for focused lookup callers.
     * @returns Structured resolution result, if any.
     */
    public resolveSymbol(name: string, scope: Scope = this.currentScope, options: SymbolResolutionOptions = {}): SymbolResolution | undefined {
        const variables = options.variables ?? true;
        const classes = options.classes ?? true;
        const loadClasses = options.loadClasses ?? true;
        const loadFunctions = options.loadFunctions ?? true;
        const functions = options.functions ?? true;
        const imports = options.imports ?? true;
        const canonical = this.aliasNameFunction(name);
        const resolveImportedCandidate = (importedName: string): SymbolResolution | undefined => {
            const importedCanonical = this.aliasNameFunction(importedName);
            if (classes) {
                const importedClass = this.resolveClassDefinitionByExactName(importedCanonical, scope, false);
                if (importedClass) {
                    return { kind: 'class', name, resolvedName: importedCanonical, source: 'import', classDefinition: importedClass };
                }
            }
            if (functions) {
                const importedFunction = scope.resolveFunction(importedCanonical);
                if (importedFunction) {
                    return {
                        kind: importedFunction.type === 'BUILTIN' ? 'builtin' : 'function',
                        name,
                        resolvedName: importedCanonical,
                        source: importedFunction.type === 'BUILTIN' ? 'builtin' : 'import',
                        functionDefinition: importedFunction,
                    };
                }
                if (loadFunctions) {
                    const importedLoaded = this.interpreter?.loadFunctionDefinition(importedCanonical, scope);
                    if (importedLoaded) {
                        return { kind: 'function', name, resolvedName: importedCanonical, source: 'import', functionDefinition: importedLoaded };
                    }
                }
            }
            if (classes && loadClasses) {
                const importedLoadedClass = this.resolveClassDefinitionByExactName(importedCanonical, scope, true);
                if (importedLoadedClass) {
                    return { kind: 'class', name, resolvedName: importedCanonical, source: 'import', classDefinition: importedLoadedClass };
                }
            }
            return undefined;
        };

        if (variables) {
            const entry = scope.resolveName(canonical);
            if (entry && typeof entry.node !== 'undefined' && !ClassDefinition.isInstanceOf(entry.node)) {
                return { kind: 'variable', name, resolvedName: canonical, source: 'local', entry };
            }
        }

        if (classes) {
            const directClass = this.resolveClassDefinitionByExactName(canonical, scope, false);
            if (directClass) {
                return { kind: 'class', name, resolvedName: canonical, source: 'local', classDefinition: directClass };
            }
        }

        if (functions) {
            const directFunction = scope.resolveFunction(canonical);
            if (directFunction) {
                return {
                    kind: directFunction.type === 'BUILTIN' ? 'builtin' : 'function',
                    name,
                    resolvedName: canonical,
                    source: directFunction.type === 'BUILTIN' ? 'builtin' : 'local',
                    functionDefinition: directFunction,
                };
            }
            if (loadFunctions) {
                const loadedFunction = this.interpreter?.loadFunctionDefinition(canonical, scope);
                if (loadedFunction) {
                    return { kind: 'function', name, resolvedName: canonical, source: 'local', functionDefinition: loadedFunction };
                }
            }
        }

        if (classes && loadClasses) {
            const loadedClass = this.resolveClassDefinitionByExactName(canonical, scope, true);
            if (loadedClass) {
                return { kind: 'class', name, resolvedName: canonical, source: 'local', classDefinition: loadedClass };
            }
        }

        if (imports && !canonical.includes('.')) {
            const imported = [
                ...new Map(
                    scope
                        .importedNameCandidates(canonical)
                        .map(resolveImportedCandidate)
                        .filter((item): item is SymbolResolution => typeof item !== 'undefined')
                        .map((item) => [item.resolvedName, item]),
                ).values(),
            ];
            if (imported.length > 1) {
                this.throwEvalError(`imported name '${canonical}' is ambiguous: ${imported.map((item) => item.resolvedName).join(', ')}.`);
            }
            if (imported.length === 1) {
                return imported[0];
            }
        }

        if (functions) {
            const builtin = this.builtInFunctionTable[canonical];
            if (builtin) {
                return { kind: 'builtin', name, resolvedName: canonical, source: 'builtin', functionDefinition: builtin };
            }
        }

        return undefined;
    }

    /**
     * Resolve a function by name from lexical scope, provider API, or built-ins.
     *
     * @param name Function name or alias.
     * @param scope Lookup scope, defaulting to the current scope.
     * @returns User-defined or built-in function node, if found.
     */
    public resolveFunction(name: string, scope: Scope = this.currentScope): NodeFunctionDefinition | NodeBuiltInFunction | undefined {
        return this.resolveSymbol(name, scope, { variables: false, classes: false })?.functionDefinition;
    }

    /**
     * Resolve a class definition by name.
     *
     * In-memory class definitions are stored as names. Provider-loaded classes
     * are registered into the global scope so later lookups reuse the same
     * metadata object.
     *
     * @param name Class name.
     * @param scope Lookup scope, defaulting to the current scope.
     * @returns Class definition, if found.
     */
    public resolveClassDefinition(name: string, scope: Scope = this.currentScope): ClassDefinition | undefined {
        return this.resolveSymbol(name, scope, { variables: false, functions: false })?.classDefinition;
    }

    private resolveClassDefinitionByExactName(name: string, scope: Scope = this.currentScope, loadFromProvider = true): ClassDefinition | undefined {
        const entry = scope.resolveName(name);
        if (entry && ClassDefinition.isInstanceOf(entry.node)) {
            return entry.node;
        }
        if (!loadFromProvider) {
            return undefined;
        }
        const loaded = this.interpreter?.loadClassDefinition(name, scope);
        if (!loaded) {
            return undefined;
        }
        const targetScope = this.globalScope ?? scope;
        this.defineClassDefinition(loaded, targetScope);
        return loaded;
    }

    /**
     * Register one package/class import in a scope.
     *
     * @param qualifiedName Fully qualified import name.
     * @param scope Scope receiving the import.
     */
    public defineImport(qualifiedName: string, scope: Scope = this.currentScope): void {
        const name = qualifiedName.trim();
        const prefix = name.endsWith('.*') ? name.slice(0, -2) : undefined;
        if (!name || (!prefix && !name.includes('.')) || prefix === '') {
            this.throwSyntaxError('import: imported name must be qualified.');
        }
        scope.defineImport(qualifiedName);
    }

    /**
     * Define or replace a variable in the current scope.
     *
     * @param name Variable name.
     * @param value Value to store.
     */
    public assignName(name: string, value: NodeInput) {
        this.currentScope.defineName(name, value);
    }

    /**
     * Validate a resolved variable value before exposing it as an identifier expression.
     */
    private resolvedIdentifierExpression(entry: ResolvedNameEntry, name: string, parent: NodeInput): NodeExpr {
        const value = expressionValue(entry.node, name, 'Identifier value', (message) => this.throwEvalError(message));
        value.parent = parent;
        return value;
    }

    /**
     * Keep an unresolved identifier as a call target placeholder.
     */
    private unresolvedCallTargetExpression(tree: unknown): NodeExpr {
        if (!AST.isNodeIdentifier(tree)) {
            this.throwEvalError('invalid unresolved call target.');
        }
        return tree;
    }

    /**
     * Define or replace a user function in the current scope.
     *
     * @param name Function name.
     * @param func Function definition node.
     */
    public assignFunction(name: string, func: NodeFunctionDefinition) {
        this.currentScope.defineFunction(name, func);
    }

    /**
     * Register a class definition as a named runtime value.
     *
     * @param definition Class metadata to register.
     * @param scope Scope that should receive the class name.
     * @returns The same class definition for fluent callers.
     */
    public defineClassDefinition(definition: ClassDefinition, scope: Scope = this.currentScope): ClassDefinition {
        scope.defineName(definition.name, definition);
        return definition;
    }

    /**
     * Create a child lexical scope.
     *
     * @param parent Parent scope, defaulting to the current scope.
     * @returns New child scope.
     */
    public createChildScope(parent: Scope = this.currentScope): Scope {
        return Scope.create(parent);
    }

    /**
     * Track assignment targets while their right-hand side is evaluated.
     * @param targets Assignment target identifiers.
     */
    public pushForwardReferenceTargets(targets: string[]): void {
        this.forwardReferenceTargetStack.push(targets);
    }

    /**
     * Stop tracking the current right-hand-side assignment targets.
     * @returns Removed target list, if any.
     */
    public popForwardReferenceTargets(): string[] | undefined {
        return this.forwardReferenceTargetStack.pop();
    }

    /**
     * Track how many outputs the current expression context asks from a call.
     * @param count Requested output count.
     */
    public pushRequestedOutputCount(count: number): void {
        this.requestedOutputCountStack.push(count);
    }

    /**
     * Stop tracking the current requested output count.
     * @returns Removed requested output count, if any.
     */
    public popRequestedOutputCount(): number | undefined {
        return this.requestedOutputCountStack.pop();
    }

    /**
     * Track which requested outputs are actually assigned by the caller.
     *
     * A `false` entry corresponds to a `~` placeholder in a multiple-output
     * assignment and is exposed inside user functions through `isargout`.
     *
     * @param mask Per-output assignment flags.
     */
    public pushRequestedOutputMask(mask: boolean[]): void {
        this.requestedOutputMaskStack.push({ depth: this.requestedOutputCountStack.length, mask: mask.slice() });
    }

    /**
     * Stop tracking the current requested-output mask.
     *
     * @returns Removed output mask, if any.
     */
    public popRequestedOutputMask(): boolean[] | undefined {
        return this.requestedOutputMaskStack.pop()?.mask;
    }

    /**
     * Output count requested by the nearest evaluation context.
     */
    public get requestedOutputCount(): number {
        return this.requestedOutputCountStack[this.requestedOutputCountStack.length - 1] ?? 1;
    }

    /**
     * Return per-output assignment flags for the current expression context.
     *
     * Contexts without an explicit mask behave as though all requested outputs
     * were assigned.
     *
     * @param count Output count to materialize.
     * @returns Boolean request mask.
     */
    public requestedOutputMask(count = this.requestedOutputCount): boolean[] {
        const entry = this.requestedOutputMaskStack[this.requestedOutputMaskStack.length - 1];
        const mask = entry?.depth === this.requestedOutputCountStack.length ? entry.mask : undefined;
        return Array.from({ length: count }, (_value, index) => mask?.[index] ?? true);
    }

    /**
     * Enter a context where comma-separated lists should expand.
     *
     * @param enabled Whether expansion is enabled for the nested evaluation.
     */
    public pushCommaListExpansion(enabled = true): void {
        this.commaListExpansionStack.push(enabled);
    }

    /**
     * Leave the current comma-separated-list expansion context.
     *
     * @returns Removed expansion flag, if any.
     */
    public popCommaListExpansion(): boolean | undefined {
        return this.commaListExpansionStack.pop();
    }

    /**
     * Whether the current evaluation context expands comma-separated lists.
     */
    public get commaListExpansionEnabled(): boolean {
        return this.commaListExpansionStack[this.commaListExpansionStack.length - 1] ?? false;
    }

    /**
     * Test class member access against the active class access stack.
     *
     * @param classDefinition Class that owns the member.
     * @param access Effective access string (`public`, `protected`, `private`, or friend list).
     * @returns `true` when the current class execution context may access the member.
     */
    public canAccessClassMember(classDefinition: ClassDefinition, access = 'public'): boolean {
        if (access === 'public') {
            return true;
        }
        if (access === 'private') {
            return this.classAccessStack.includes(classDefinition);
        }
        if (access === 'protected') {
            return this.classAccessStack.some((currentClass) => currentClass === classDefinition || currentClass.isSubclassOf(classDefinition));
        }
        const friendClassNames = access.startsWith('{') && access.endsWith('}') ? access.slice(1, -1).split(',') : [access];
        if (friendClassNames.every((name) => name.startsWith('?'))) {
            return friendClassNames.some((name) => {
                const friendClassName = name.slice(1);
                return this.classAccessStack.some((currentClass) => currentClass.name === friendClassName || currentClass.isSubclassOfName(friendClassName));
            });
        }
        return this.classAccessStack.includes(classDefinition);
    }

    /**
     * Return the innermost class currently granting method-access privileges.
     *
     * This is used by public introspection built-ins such as
     * `mfilename("class")`; it intentionally exposes only the class name, not
     * the mutable access stack itself.
     *
     * @returns Current executing class name, or an empty string outside class methods.
     */
    public currentClassAccessName(): string {
        const activeClassName = this.classAccessStack[this.classAccessStack.length - 1]?.name;
        if (activeClassName) {
            return activeClassName;
        }
        for (let i = this.callStack.length - 1; i >= 0; i--) {
            const className = (this.callStack[i].func?.node as CallableClassMetadata | undefined)?.className;
            if (className) {
                return className;
            }
        }
        return '';
    }

    private withClassAccess<T>(classDefinition: ClassDefinition, callback: () => T): T {
        this.classAccessStack.push(classDefinition);
        try {
            return callback();
        } finally {
            this.classAccessStack.pop();
        }
    }

    private get currentForwardReferenceTargets(): string[] {
        return this.forwardReferenceTargetStack[this.forwardReferenceTargetStack.length - 1] ?? [];
    }

    /**
     * Follow unresolved-reference metadata to build a dependency chain.
     *
     * Pending expressions can be partially re-linked while forward references
     * are resolved, so this also inspects the stored expression tree to retain
     * useful chains such as `A -> B -> C -> A`.
     */
    private getUndefinedReferenceChain(name: string, scope: Scope): string[] {
        const chain = [name];
        const seen = new Set<string>(chain);
        let current = name;
        while (true) {
            const next = this.getNextUndefinedReference(current, scope);
            if (!next) {
                return chain;
            }
            chain.push(next);
            if (seen.has(next)) {
                return chain;
            }
            seen.add(next);
            current = next;
        }
    }

    private getNextUndefinedReference(name: string, scope: Scope): string | undefined {
        const entry = scope.resolveName(name);
        if (!entry) {
            return undefined;
        }
        const expressionReference = this.findPendingIdentifier(entry.node, scope, entry.undefinedReference);
        return expressionReference ?? entry.undefinedReference;
    }

    /**
     * Find the next pending identifier inside a stored expression tree.
     */
    private findPendingIdentifier(node: unknown, scope: Scope, fallback?: string, seen = new WeakSet<object>()): string | undefined {
        if (!node || typeof node !== 'object') {
            return undefined;
        }
        if (seen.has(node)) {
            return undefined;
        }
        seen.add(node);
        const record = node as Record<string, unknown>;
        if (AST.isNodeIdentifier(node)) {
            const entry = scope.resolveName(node.id);
            if (entry?.undefinedReference || (!entry && node.id === fallback)) {
                return node.id;
            }
        }
        for (const key of Object.keys(record)) {
            if (key === 'parent' || key === 'start' || key === 'stop') {
                continue;
            }
            const value = record[key];
            if (Array.isArray(value)) {
                for (const item of value) {
                    const pending = this.findPendingIdentifier(item, scope, fallback, seen);
                    if (pending) {
                        return pending;
                    }
                }
            } else {
                const pending = this.findPendingIdentifier(value, scope, fallback, seen);
                if (pending) {
                    return pending;
                }
            }
        }
        return undefined;
    }

    /**
     * Throw when resolving `name` would close an unresolved-reference cycle.
     */
    private throwIfCircularReference(name: string, scope: Scope): void {
        const chain = this.getUndefinedReferenceChain(name, scope);
        const last = chain[chain.length - 1];
        const repeatedIndex = chain.slice(0, -1).indexOf(last);
        if (repeatedIndex >= 0) {
            this.throwCircularReferenceError(chain.slice(repeatedIndex));
        }
        const target = this.currentForwardReferenceTargets.find((candidate) => chain.includes(candidate));
        if (target) {
            this.throwCircularReferenceError([...chain.slice(0, chain.indexOf(target) + 1), name]);
        }
    }

    /**
     * Resolve a value expression to a callable wrapper when possible.
     *
     * @param expr Evaluated expression that may be a function handle.
     * @returns Callable wrapper for function handles, or `undefined`.
     */
    public resolveCallable(expr: NodeExpr): Callable | undefined {
        /* Function handles may point to named functions or inline lambda bodies. */
        if (FunctionHandle.isInstanceOf(expr)) {
            /* Named handle, for example `@sin`. */
            if (expr.id) {
                const scope = (expr.closure as Scope | undefined) ?? this.currentScope;
                const resolved = this.resolveSymbol(expr.id, scope, { variables: false, classes: false });
                const func = resolved?.functionDefinition;
                if (expr.disallowNestedResolution && func?.type === 'FCNDEF' && func.attributes?.nested) {
                    this.throwReferenceError(`'${expr.id}' undefined.`);
                }
                if (func) {
                    return Callables.fromFunctionNode(func);
                }
                const staticMethod = this.interpreter?.resolveStaticMethod(expr.id, scope);
                if (staticMethod) {
                    return Callables.staticMethod(staticMethod);
                }
                if (!func) {
                    this.throwReferenceError(`'${expr.id}' undefined.`);
                }
            }
            if (FunctionHandle.isAnonymous(expr)) {
                return Callables.lambda(expr);
            }
        }
        return undefined;
    }

    /**
     * Resolve an identifier according to MATLAB/Octave name precedence.
     *
     * Variables are preferred, followed by call-frame metadata such as
     * `nargin`, class definitions, functions, and finally undefined-reference
     * handling. When the identifier is part of a call expression, unresolved
     * names may remain as call targets for later dispatch.
     *
     * @param tree Identifier node.
     * @param scope Scope used for lookup.
     * @returns Resolved runtime value or callable placeholder.
     */
    public resolveIdentifier(tree: NodeInput, scope: Scope): NodeExpr {
        const name = tree.id;
        /* 1. Variable lookup. */
        const variable = this.resolveSymbol(name, scope, { classes: false, functions: false, imports: false });
        if (variable?.kind === 'variable') {
            const entry = variable.entry! as ResolvedNameEntry;
            if (this.allowForwardReference && entry.undefinedReference) {
                this.throwIfCircularReference(name, scope);
                this.throwUndefinedReferenceError(entry.undefinedReference);
            }
            return this.resolvedIdentifierExpression(entry, name, tree);
        }
        /* 2. Function call-frame metadata. */
        if (name === 'nargin' && !AST.isNodeIndexExpr(tree.parent)) {
            return this.currentFunctionArgumentCount(name);
        }
        if (name === 'nargout' && !AST.isNodeIndexExpr(tree.parent)) {
            return this.currentFunctionOutputCount(name);
        }
        if (name === 'meta') {
            return new Structure({
                class: new Structure({
                    fromName: FunctionHandle.create('__meta_class_fromName'),
                }),
            });
        }
        /* 3. Structured class/function precedence. */
        const resolved = this.resolveSymbol(name, scope, { variables: false });
        switch (resolved?.kind) {
            case 'variable': {
                const entry = resolved.entry! as ResolvedNameEntry;
                if (this.allowForwardReference && entry.undefinedReference) {
                    this.throwIfCircularReference(name, scope);
                    this.throwUndefinedReferenceError(entry.undefinedReference);
                }
                return this.resolvedIdentifierExpression(entry, name, tree);
            }
            case 'class':
                resolved.classDefinition!.parent = tree;
                return resolved.classDefinition!;
            case 'function':
            case 'builtin':
                /* A function name may be converted to a handle when it is being called. */
                if (AST.isNodeIndexExpr(tree.parent)) {
                    const handle = FunctionHandle.create(resolved.resolvedName);
                    handle.parent = tree;
                    return handle;
                }
                if (resolved.kind === 'builtin' && Context.bareZeroArgumentBuiltins.has(name)) {
                    return this.callCallable(Callables.builtin(resolved.functionDefinition! as NodeBuiltInFunction), [], tree);
                }
                /* Otherwise a bare function name is an invalid MATLAB-like call. */
                AST.throwInvalidCallError(name, true, (message) => this.throwSyntaxError(message));
        }
        const staticMethod = AST.isNodeIndexExpr(tree.parent) ? this.interpreter?.resolveStaticMethod(name, scope) : undefined;
        if (staticMethod) {
            staticMethod.parent = tree;
            return staticMethod;
        }
        /* 4. Undefined identifier. */
        if (AST.isNodeIndexExpr(tree.parent)) {
            return this.unresolvedCallTargetExpression(tree);
        }
        this.throwUndefinedReferenceError(name);
    }

    /**
     * Expand a comma-separated return list into individual values.
     *
     * Non-list values are reduced to their first return value and wrapped in a
     * single-element array. This mirrors MATLAB/Octave behavior for cell and
     * struct comma-separated lists in calls and assignments.
     *
     * @param value Evaluated value or return list.
     * @returns Expanded values.
     */
    public expandCommaSeparatedList(value: NodeInput): NodeInput[] {
        if (!AST.isNodeReturnList(value) || !value.commaSeparated) {
            return [this.reducedCommaListScalar(value)];
        }
        const length = value.returnListLength ?? value.handler(0).length;
        const evaluated = value.handler(length);
        const result: NodeInput[] = [];
        for (let index = 0; index < length; index++) {
            result.push(value.selector(evaluated, index));
        }
        return result;
    }

    /**
     * Reduce a non-comma-list value before treating it as one scalar expansion
     * item.
     */
    private reducedCommaListScalar(value: NodeInput): NodeInput {
        return AST.reduceToFirstIfReturnList(value);
    }

    /**
     * Evaluate one call/assignment expression with comma-list expansion enabled.
     *
     * @param arg Expression to evaluate.
     * @returns Expanded values produced by the expression.
     */
    public evaluateCommaListExpression(arg: NodeExpr): NodeInput[] {
        this.pushRequestedOutputCount(1);
        this.pushCommaListExpansion();
        try {
            return this.expandCommaSeparatedList(this.rawEvaluationResult(arg, this.currentScope));
        } finally {
            this.popCommaListExpansion();
            this.popRequestedOutputCount();
        }
    }

    /**
     * Evaluate and expand a list of positional call arguments.
     *
     * @param args Argument expressions.
     * @returns Expanded argument values retyped for call helpers.
     */
    public expandCommaListArguments(args: CallArgumentValue[]): CallArgumentValue[] {
        return args.flatMap((arg) => this.expressionValues(this.evaluateCommaListExpression(arg), 'arg'));
    }

    /**
     * Evaluate one call argument with comma-list expansion and expression
     * validation.
     */
    private evaluateExpandedArgument(arg: CallArgumentValue, namePrefix = 'arg'): CallArgumentValue[] {
        return this.expressionValues(this.evaluateCommaListExpression(arg), namePrefix);
    }

    private evaluateArgs(args: CallArgumentValue[], parent: NodeInput, mode: 'all' | boolean[]): CallArgumentValue[] {
        void parent;
        return args.flatMap((arg: CallArgumentValue, i: number) => {
            if (mode === 'all') {
                return this.evaluateExpandedArgument(arg);
            }
            const ev = mode;
            if (ev.length > 0 && i < ev.length && !ev[i]) {
                return [arg];
            }
            return this.evaluateExpandedArgument(arg);
        });
    }

    /**
     * Evaluate built-in arguments while preserving MATLAB SetGet `Name=Value`
     * syntax for the public `set` function.
     *
     * General built-ins receive evaluated positional values. `set` is special:
     * MATLAB treats top-level `Name=Value` arguments as property/value pairs,
     * not as ordinary assignment expressions. Keeping the conversion here keeps
     * the behavior local to the built-in dispatch path.
     *
     * @param node Built-in function node.
     * @param args Raw call argument expressions.
     * @param parent Call-site node used for diagnostics.
     * @returns Evaluated argument values.
     */
    public evaluateBuiltInArgs(node: NodeBuiltInFunction, args: CallArgumentValue[], parent: NodeInput): ExpressionBoundaryValue[] {
        if (node.id === 'feval' || node.id === 'builtin') {
            return args.length > 0 ? [this.evaluateArgs([args[0]], parent, 'all')[0], ...args.slice(1)] : [];
        }
        const alias = this.aliasNameFunction(node.id);
        if (alias !== 'set') {
            return this.evaluateArgs(args, parent, node.ev);
        }
        const evaluated: ExpressionBoundaryValue[] = [];
        args.forEach((arg, index) => {
            if (index > 0 && AST.isNodeBinaryOperation(arg) && arg.type === '=' && AST.isNodeIdentifier(arg.left)) {
                evaluated.push(new CharString(arg.left.id));
                evaluated.push(...this.evaluateArgs([arg.right], parent, node.ev));
                return;
            }
            evaluated.push(...this.evaluateArgs([arg], parent, node.ev));
        });
        return evaluated;
    }

    /**
     * Throw an evaluation error annotated with the current stack trace.
     *
     * @param message Error message.
     */
    public throwEvalError(message: string): never {
        throw new EvalError(message, this.getStackTrace());
    }

    /**
     * Throw a reference error annotated with the current stack trace.
     *
     * @param message Error message.
     */
    public throwReferenceError(message: string): never {
        throw new ReferenceError(message, this.getStackTrace());
    }

    /**
     * Throw an undefined-reference error annotated with the current stack trace.
     *
     * @param identifier Missing identifier.
     */
    public throwUndefinedReferenceError(identifier: string): never {
        throw new UndefinedReferenceError(identifier, this.getStackTrace());
    }

    /**
     * Throw a circular-reference error annotated with the current stack trace.
     *
     * @param chain Dependency chain that closes the cycle.
     */
    public throwCircularReferenceError(chain: string[]): never {
        throw new CircularReferenceError(chain, this.getStackTrace());
    }

    /**
     * Throw a syntax error annotated with the current stack trace.
     *
     * @param message Error message.
     */
    public throwSyntaxError(message: string): never {
        throw new SyntaxError(message, this.getStackTrace());
    }

    private getCurrentFunctionDefinition(): NodeFunctionDefinition | undefined {
        return FunctionStack.currentFunctionDefinition(this.callStack);
    }

    /**
     * Return whether execution is currently inside a user-defined function.
     *
     * Built-in helper frames and temporary eval frames may sit on top of the
     * stack, so this intentionally searches the stack instead of inspecting
     * only the current top frame.
     */
    public isInsideUserFunction(): boolean {
        return typeof this.getCurrentFunctionDefinition() !== 'undefined';
    }

    /**
     * Return the virtual source name of the current user-defined callable.
     */
    public currentFunctionSourceName(): string {
        for (let i = this.callStack.length - 1; i >= 0; i--) {
            const node = this.callStack[i].func?.node;
            const sourceName = node && typeof node === 'object' && 'sourceName' in node ? (node as { sourceName?: unknown }).sourceName : undefined;
            if (sourceName) {
                return typeof sourceName === 'string' ? sourceName : '';
            }
        }
        return '';
    }

    private getCurrentFunctionCountFrame(): CallFrame | undefined {
        return FunctionStack.currentFunctionCountFrame(this.callStack) as CallFrame | undefined;
    }

    private getCallerWorkspace(forAssignment = false, variablesOnly = false): Scope {
        return FunctionStack.callerWorkspace(this.callStack, this.globalScope!, (parent) => Scope.create(parent as Scope | undefined), forAssignment, variablesOnly) as Scope;
    }

    /**
     * Resolve a MATLAB-like workspace selector.
     *
     * @param name Workspace name such as `base` or `caller`.
     * @param forAssignment Whether the resolved workspace will be assigned into.
     * @returns Target scope.
     */
    public resolveWorkspace(name: string, forAssignment = false, variablesOnly = false): Scope {
        return FunctionWorkspace.resolveWorkspace(name, this.globalScope!, this.getCallerWorkspace(forAssignment, variablesOnly), (message) => this.throwSyntaxError(message)) as Scope;
    }

    /**
     * Return the current function's input argument count.
     *
     * @param name Built-in name used for diagnostics.
     * @returns Numeric scalar count.
     */
    public currentFunctionArgumentCount(name: 'nargin' | 'nargout'): ComplexType {
        const count = FunctionStack.currentArgumentCount(this.callStack);
        if (typeof count === 'undefined') {
            this.throwEvalError(`${name} is only valid inside a function.`);
        }
        return Complex.create(count);
    }

    /**
     * Return the current function's input count, or zero outside a function.
     */
    public currentFunctionArgumentCountOrZero(): ComplexType {
        return Complex.create(FunctionStack.currentArgumentCount(this.callStack) ?? 0);
    }

    /**
     * Return the output count requested from the current function.
     *
     * @param name Built-in name used for diagnostics.
     * @returns Numeric scalar count.
     */
    public currentFunctionOutputCount(name: 'nargin' | 'nargout'): ComplexType {
        const count = FunctionStack.currentOutputCount(this.callStack);
        if (typeof count === 'undefined') {
            this.throwEvalError(`${name} is only valid inside a function.`);
        }
        return Complex.create(count);
    }

    /**
     * Return the current requested output count, or zero outside a function.
     */
    public currentFunctionOutputCountOrZero(): ComplexType {
        return Complex.create(FunctionStack.currentOutputCount(this.callStack) ?? 0);
    }

    /**
     * Return whether one or more current function outputs are requested.
     *
     * `isargout` is true only for output positions within `nargout` whose
     * caller-side target was not `~`.
     *
     * @param indexNode One-based output index or numeric array of indexes.
     * @returns Logical scalar or array matching the input shape.
     */
    public currentFunctionOutputIsRequested(indexNode: NodeInput): NodeInput {
        const frame = this.getCurrentFunctionCountFrame();
        if (!frame) {
            this.throwEvalError('isargout is only valid inside a function.');
        }
        const evaluateIndex = (value: NodeInput): ComplexType => {
            if (!Complex.isInstanceOf(value) || !Complex.imagIsZero(value)) {
                this.throwEvalError('isargout: argument must be a positive integer.');
            }
            const index = Complex.realToNumber(value);
            if (!Number.isInteger(index) || index < 1) {
                this.throwEvalError('isargout: argument must be a positive integer.');
            }
            return index <= frame.nargout && (frame.outputMask?.[index - 1] ?? true) ? Complex.true() : Complex.false();
        };
        if (MultiArray.isInstanceOf(indexNode)) {
            const result = new MultiArray(indexNode.dimension, undefined, false);
            for (let n = 0; n < MultiArray.linearLength(indexNode); n++) {
                const [row, column] = MultiArray.linearIndexToMultiArrayRowColumn(indexNode.dimension[0], indexNode.dimension[1], n);
                result.array[row][column] = evaluateIndex(indexNode.array[row][column]);
            }
            MultiArray.setType(result);
            return result;
        }
        return evaluateIndex(indexNode);
    }

    /**
     * Implement `inputname` for the current function frame.
     *
     * @param indexNode One-based argument index.
     * @returns Original caller expression text when available.
     */
    public currentFunctionInputName(indexNode: NodeInput, onlyVariableNames = true, unparse?: (arg: ExpressionBoundaryValue) => string): CharString {
        const frame = this.getCurrentFunctionCountFrame();
        if (!frame) {
            this.throwEvalError('inputname is only valid inside a function.');
        }
        return FunctionWorkspace.inputName(frame.inputArgs, indexNode, (message) => this.throwSyntaxError(message), onlyVariableNames, unparse);
    }

    /**
     * Return the current function display name.
     */
    public currentFunctionName(): string {
        return FunctionStack.currentFunctionName(this.callStack);
    }

    /**
     * Declare a persistent variable in the current function.
     *
     * @param name Variable name.
     * @param value Initial value, when supplied by the declaration.
     * @param scope Function scope receiving the live binding.
     */
    public declarePersistent(name: string, value: RuntimeExpressionValue | undefined, scope: Scope): void {
        const func = this.getCurrentFunctionDefinition();
        if (!func) {
            this.throwSyntaxError('persistent declaration is only valid inside a function.');
        }
        FunctionWorkspace.declarePersistent(name, value, func, scope);
    }

    /**
     * Load persistent variables into a function call scope.
     *
     * @param func Function definition whose persistent storage should be loaded.
     * @param scope Function call scope.
     */
    public loadPersistentVariables(func: NodeFunctionDefinition, scope: Scope): void {
        FunctionWorkspace.loadPersistentVariables(func, scope);
    }

    /**
     * Store persistent variables after a function call completes.
     *
     * @param func Function definition whose persistent storage should be updated.
     * @param scope Function call scope.
     */
    public storePersistentVariables(func: NodeFunctionDefinition, scope: Scope): void {
        FunctionWorkspace.storePersistentVariables(func, scope);
    }

    /**
     * Declare a variable as global in a scope.
     *
     * @param name Global variable name.
     * @param value Optional initial value.
     * @param scope Scope that should reference the global binding.
     */
    public declareGlobal(name: string, value: RuntimeExpressionValue | undefined, scope: Scope): void {
        const targetScope = scope.globalDeclarationTarget ?? scope;
        FunctionWorkspace.declareGlobal(name, value, this.globalNameSet, this.globalScope!.nameTable, targetScope.nameTable, this.globalInitializedNameSet);
    }

    /**
     * Clear global bindings from the global scope and active frames.
     *
     * @param names Optional subset of global names to clear.
     */
    public clearGlobalVariables(names?: string[]): void {
        FunctionWorkspace.clearGlobalVariables(
            this.globalNameSet,
            this.globalScope,
            this.callStack.map((frame) => frame.scope),
            names,
        );
    }

    /**
     * Clear loaded class definitions from the global scope and active frames.
     *
     * Host/source resolvers are intentionally left untouched so qualified or
     * imported class names can be loaded again after `clear classes`.
     */
    public clearClassDefinitions(): void {
        const scopes = [this.globalScope, ...this.callStack.map((frame) => frame.scope)].filter((scope): scope is Scope => typeof scope !== 'undefined');
        for (const scope of scopes) {
            for (const name of Object.keys(scope.nameTable)) {
                if (ClassDefinition.isInstanceOf(scope.nameTable[name]?.node)) {
                    scope.removeName(name);
                }
            }
        }
    }

    /**
     * Clear ordinary variables from the current workspace.
     *
     * Native constants and class definitions are intentionally preserved. The
     * latter are runtime type metadata rather than user workspace variables.
     */
    public clearCurrentVariables(names?: string[]): void {
        const nativeNames = this.nativeNameSet instanceof Set ? this.nativeNameSet : new Set<string>();
        const targetNames = names ? names : Object.keys(this.currentScope.nameTable);
        for (const name of targetNames) {
            const entry = this.currentScope.nameTable[name];
            if (!nativeNames.has(name) && !ClassDefinition.isInstanceOf(entry?.node)) {
                this.currentScope.removeName(name);
            }
        }
    }

    private resolveCallSite(node: NodeInput | undefined): NodeExpr | undefined {
        let current: ParentLinkedNode | undefined = node as ParentLinkedNode | undefined;
        while (current) {
            if (current.start) return current;
            current = current.parent as ParentLinkedNode | undefined;
        }
        return undefined;
    }

    private static debugIdentifier(value: unknown): string | undefined {
        const id = (value as IdentifierLikeNode | undefined)?.id;
        return typeof id === 'string' ? id : undefined;
    }

    /**
     * Return normalized input signatures for a built-in node.
     *
     * @param node Built-in function node.
     * @returns Input signature overloads.
     */
    public builtInInputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        return FunctionSignature.inputSignatures(node);
    }

    /**
     * Return normalized output signatures for a built-in node.
     *
     * @param node Built-in function node.
     * @returns Output signature overloads.
     */
    public builtInOutputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        return FunctionSignature.outputSignatures(node);
    }

    /**
     * Compute the MATLAB-like declared arity for built-in signatures.
     *
     * @param signatures Input or output signature overloads.
     * @returns Fixed or negative variadic arity, when declared.
     */
    public builtInDeclaredArity(signatures: BuiltInFunctionInputSignature[]): number | undefined {
        return FunctionSignature.declaredArity(signatures);
    }

    public validateBuiltInInputArity(node: NodeBuiltInFunction, argCount: number): void {
        AST.throwInvalidCallError(node.id, !FunctionSignature.inputArityIsValid(node, argCount), (message) => this.throwSyntaxError(message));
    }

    public validateBuiltInInputParameters(node: NodeBuiltInFunction, args: NodeInput[]): void {
        AST.throwInvalidCallError(node.id, !FunctionSignature.inputParametersAreValid(node, args), (message) => this.throwSyntaxError(message));
    }

    private valueDimensions(value: NodeInput): number[] {
        return RuntimeValue.dimensions(value);
    }

    private sizeReturnList(value: NodeInput): NodeReturnList {
        const size = this.valueDimensions(value);
        const outputMask = this.requestedOutputMask(Math.max(this.requestedOutputCount, size.length));
        const outputIsRequested = (index: number): boolean => outputMask[index] ?? true;
        return AST.nodeReturnList(
            (evaluated, index) => {
                const value = evaluated[`dim${index}`];
                if (value === undefined) {
                    AST.throwErrorIfGreaterThanReturnList(evaluated.length, index + 1, (message) => this.throwEvalError(message));
                }
                return value;
            },
            (length: number) => {
                const dims = size.slice();
                MultiArray.appendSingletonTail(dims, Math.max(length, 2));
                const out: ReturnHandlerResult = { length };
                for (let index = 0; index < length; index++) {
                    if (!outputIsRequested(index)) {
                        continue;
                    }
                    const value = index === length - 1 ? dims.slice(index).reduce((product, dim) => product * dim, 1) : dims[index];
                    out[`dim${index}`] = Complex.create(value);
                }
                return out;
            },
        );
    }

    /**
     * Give scalar class objects the normal MATLAB overload opportunity for
     * selected built-ins before the native implementation runs.
     *
     * @param node Built-in function node being invoked.
     * @param evaluatedArgs Already evaluated call arguments.
     * @param parent Call-site node used for diagnostics.
     * @returns Class method result when an accessible overload exists.
     */
    private callClassBuiltinMethod(node: NodeBuiltInFunction, evaluatedArgs: ExpressionBoundaryValue[], parent: NodeInput): NodeExpr | undefined {
        const name = this.aliasNameFunction(node.id);
        if (AST.isNodeIdentifier(parent) && parent.id === 'builtin') {
            return undefined;
        }
        if (!Context.classBuiltinMethodFunctionNames.has(name) || evaluatedArgs.length === 0) {
            return undefined;
        }
        const receiver = evaluatedArgs[0];
        if (!ClassInstance.isInstanceOf(receiver)) {
            return undefined;
        }
        const method = receiver.classDefinition.findMethod(name, (item) => !item.isStatic);
        if (!method) {
            return undefined;
        }
        if (!this.canAccessClassMember(method.classDefinition, method.access)) {
            this.throwEvalError(`method '${name}' has ${method.access} access for class ${receiver.classDefinition.name}.`);
        }
        const methodArgs = evaluatedArgs.slice(1).map((arg, index) => expressionValue(arg, `argument ${index + 2}`, 'Argument value', (message) => this.throwEvalError(message)));
        return this.callClassInstanceMethod(receiver, method, methodArgs, parent);
    }

    private callFunctionDefinition(callable: FunctionDefinitionCallable, args: CallArgumentValue[], parent: NodeInput, requestedOutputCount: number): NodeExpr {
        const func = callable.node;
        const { inputLayout, returnLayout, callArguments, inputDefaults } = FunctionCall.prepareFunctionCall(func, args, requestedOutputCount, {
            nameValueParameters: (item) => this.interpreter!.getFunctionNameValueParameters(item),
            splitCallArguments: (item, itemArgs) => this.interpreter!.splitFunctionCallNameValueArguments(item, itemArgs),
            expandPositionalArguments: (itemArgs) => this.expandCommaListArguments(itemArgs),
            inputDefaults: (item) => this.interpreter!.getFunctionInputArgumentDefaults(item),
            outputRepeatingName: (item) => this.interpreter!.getFunctionOutputRepeatingName(item),
            throwEvalError: (message) => this.throwEvalError(message),
        });
        /* Create a function scope, preserving the definition scope when available. */
        const functionScope = Scope.create((func.definingScope as Scope | undefined) ?? this.currentScope);
        functionScope.assignExistingParentNames = Boolean(func.attributes?.nested);
        this.interpreter!.configureFunctionWorkspace(func, functionScope);
        FunctionCall.initializeFixedReturnSlots(returnLayout.returnNames, functionScope.nameTable);
        /* Bind evaluated arguments to formal parameter names. */
        const evaluateCallArgument = (arg: CallArgumentValue): NodeInput => {
            this.pushRequestedOutputCount(1);
            try {
                return this.evaluatedExpressionValue(arg, this.currentScope, 'argument');
            } finally {
                this.popRequestedOutputCount();
            }
        };
        const evaluatedArgs = FunctionCall.evaluateCallArguments(callArguments.positional, parent, evaluateCallArgument, (message) => this.throwEvalError(message), 0, true);
        const evaluatedNameValueArgs = FunctionCall.evaluateNameValueArguments(callArguments.named, parent, evaluateCallArgument, (message) => this.throwEvalError(message));
        FunctionCall.bindPositionalInputs(
            func,
            inputLayout,
            evaluatedArgs,
            inputDefaults,
            (name, value) => functionScope.defineName(name, value),
            (_name, defaultValue) => {
                this.pushRequestedOutputCount(1);
                try {
                    return this.evaluatedExpressionValue(defaultValue, functionScope, 'default argument');
                } finally {
                    this.popRequestedOutputCount();
                }
            },
            (message) => this.throwEvalError(message),
        );
        this.interpreter!.bindFunctionNameValueArguments(func, functionScope, evaluatedNameValueArgs);
        FunctionCall.bindVarargin(inputLayout, evaluatedArgs, (name, value) => functionScope.defineName(name, value));
        FunctionCall.bindVarargout(returnLayout, requestedOutputCount, (name, value) => functionScope.defineName(name, value));
        /* Push the user-defined function frame for stack trace reporting. */
        const inputCount = callArguments.positional.length + args.length - (callArguments.rawPositionalCount ?? callArguments.positional.length);
        this.pushCallStackFrame(
            new CallFrame(functionScope, callable, this.resolveCallSite(parent), func.id, inputCount, requestedOutputCount, args, undefined, this.requestedOutputMask(requestedOutputCount)),
        );
        this.loadPersistentVariables(func, functionScope);
        let result: NodeExpr;
        try {
            this.interpreter!.applyScopedImports(func.statements, functionScope);
            this.interpreter!.registerNestedFunctions(func, functionScope);
            this.interpreter!.validateFunctionInputArguments(func, functionScope);
            this.interpreter!.validateFunctionRepeatingArguments(
                func,
                functionScope,
                FunctionCall.expressionArgumentValues(evaluatedArgs.slice(inputLayout.positionalParamCount), 'repeating argument', (message) => this.throwEvalError(message)),
            );
            /* Execute the function body. */
            try {
                if (func.statements.list.length > 0) {
                    this.evaluatedExecutionResult(func.statements, functionScope);
                }
            } catch (e: unknown) {
                if (!(e instanceof ReturnSignal)) {
                    throw e;
                }
            }
            const outputMask = this.requestedOutputMask(requestedOutputCount);
            this.interpreter!.validateFunctionOutputArguments(func, functionScope, requestedOutputCount, outputMask);
            /* Build a lazy return list backed by the function scope. */
            result = FunctionCall.createReturnList(returnLayout, functionScope.nameTable, (message) => this.throwEvalError(message), outputMask);
        } finally {
            this.storePersistentVariables(func, functionScope);
            this.popCallStackFrame();
        }
        return result;
    }

    private instantiateClassDefaults(classDefinition: ClassDefinition): ClassInstance {
        const instance = ClassInstance.instantiate(classDefinition, (defaultValue) => {
            this.pushRequestedOutputCount(1);
            try {
                return this.runtimeExpressionValue(this.evaluatedExecutionResult(defaultValue, this.currentScope), 'property default');
            } finally {
                this.popRequestedOutputCount();
            }
        });
        this.interpreter!.validateClassInstancePropertyDefaults(instance, this.currentScope);
        return instance;
    }

    private constructClassInstance(classDefinition: ClassDefinition, args: CallArgumentValue[], parent: NodeInput): ClassInstance {
        if (classDefinition.isEffectivelyAbstract()) {
            const abstractMethods = classDefinition.unresolvedAbstractMethods().map((method) => method.name);
            const abstractProperties = classDefinition.unresolvedAbstractProperties().map((property) => property.name);
            const missingImplementations = [...abstractMethods, ...abstractProperties];
            this.throwEvalError(
                missingImplementations.length > 0
                    ? `cannot instantiate abstract class ${classDefinition.name}: missing implementations for ${missingImplementations.join(', ')}.`
                    : `cannot instantiate abstract class ${classDefinition.name}.`,
            );
        }
        const instance = this.instantiateClassDefaults(classDefinition);
        return this.constructClassInstanceWithInstance(classDefinition, instance, args, parent);
    }

    public constructSuperclassInstance(instance: ClassInstance, superclassDefinition: ClassDefinition, args: CallArgumentValue[], parent: NodeInput): ClassInstance {
        if (!instance.classDefinition.isSubclassOf(superclassDefinition)) {
            this.throwEvalError(`class ${superclassDefinition.name} is not a superclass of class ${instance.classDefinition.name}.`);
        }
        return this.constructClassInstanceWithInstance(superclassDefinition, instance, args, parent);
    }

    private constructClassInstanceWithInstance(classDefinition: ClassDefinition, instance: ClassInstance, args: CallArgumentValue[], parent: NodeInput): ClassInstance {
        const constructorMethod = classDefinition.findConstructor();
        if (!constructorMethod) {
            if (args.length > 0) {
                this.throwEvalError(`constructor for class ${classDefinition.name} accepts no input arguments.`);
            }
            return instance;
        }

        this.ensureConcreteClassMethod(constructorMethod);
        const func = constructorMethod.node;
        const requestedOutputCount = 1;
        const { inputLayout, returnLayout, callArguments, inputDefaults } = FunctionCall.prepareFunctionCall(func, args, requestedOutputCount, {
            nameValueParameters: (item) => this.interpreter!.getFunctionNameValueParameters(item),
            splitCallArguments: (item, itemArgs) => this.interpreter!.splitFunctionCallNameValueArguments(item, itemArgs),
            expandPositionalArguments: (itemArgs) => this.expandCommaListArguments(itemArgs),
            inputDefaults: (item) => this.interpreter!.getFunctionInputArgumentDefaults(item),
            outputRepeatingName: (item) => this.interpreter!.getFunctionOutputRepeatingName(item),
            throwEvalError: (message) => this.throwEvalError(message),
        });
        const functionScope = Scope.create((func.definingScope as Scope | undefined) ?? this.currentScope);
        this.interpreter!.configureFunctionWorkspace(func, functionScope);
        FunctionCall.initializeFixedReturnSlots(returnLayout.returnNames, functionScope.nameTable);
        const firstReturn = returnLayout.returnNames[0];
        if (firstReturn && firstReturn.type !== '<~>') {
            functionScope.defineName(firstReturn.id, instance);
        }

        const evaluateCallArgument = (arg: CallArgumentValue): NodeInput => {
            this.pushRequestedOutputCount(1);
            try {
                return this.evaluatedExpressionValue(arg, this.currentScope, 'argument');
            } finally {
                this.popRequestedOutputCount();
            }
        };
        const evaluatedArgs = FunctionCall.evaluateCallArguments(callArguments.positional, parent, evaluateCallArgument, (message) => this.throwEvalError(message), 0, true);
        const evaluatedNameValueArgs = FunctionCall.evaluateNameValueArguments(callArguments.named, parent, evaluateCallArgument, (message) => this.throwEvalError(message));
        FunctionCall.bindPositionalInputs(
            func,
            inputLayout,
            evaluatedArgs,
            inputDefaults,
            (name, value) => functionScope.defineName(name, value),
            (_name, defaultValue) => {
                this.pushRequestedOutputCount(1);
                try {
                    return this.evaluatedExpressionValue(defaultValue, functionScope, 'default argument');
                } finally {
                    this.popRequestedOutputCount();
                }
            },
            (message) => this.throwEvalError(message),
        );
        this.interpreter!.bindFunctionNameValueArguments(func, functionScope, evaluatedNameValueArgs);
        FunctionCall.bindVarargin(inputLayout, evaluatedArgs, (name, value) => functionScope.defineName(name, value));
        FunctionCall.bindVarargout(returnLayout, requestedOutputCount, (name, value) => functionScope.defineName(name, value));

        const callable = Callables.fromFunctionNode(func);
        const inputCount = callArguments.positional.length + args.length - (callArguments.rawPositionalCount ?? callArguments.positional.length);
        this.pushCallStackFrame(new CallFrame(functionScope, callable, this.resolveCallSite(parent), func.id, inputCount, requestedOutputCount, args));
        this.loadPersistentVariables(func, functionScope);
        this.classAccessStack.push(classDefinition);
        try {
            this.interpreter!.applyScopedImports(func.statements, functionScope);
            this.interpreter!.registerNestedFunctions(func, functionScope);
            this.interpreter!.validateFunctionInputArguments(func, functionScope);
            this.interpreter!.validateFunctionRepeatingArguments(
                func,
                functionScope,
                FunctionCall.expressionArgumentValues(evaluatedArgs.slice(inputLayout.positionalParamCount), 'repeating argument', (message) => this.throwEvalError(message)),
            );
            try {
                if (func.statements.list.length > 0) {
                    this.evaluatedExecutionResult(func.statements, functionScope);
                }
            } catch (e: unknown) {
                if (!(e instanceof ReturnSignal)) {
                    throw e;
                }
            }
            this.interpreter!.validateFunctionOutputArguments(func, functionScope, requestedOutputCount);
        } finally {
            this.classAccessStack.pop();
            this.storePersistentVariables(func, functionScope);
            this.popCallStackFrame();
        }

        if (!firstReturn || firstReturn.type === '<~>') {
            return instance;
        }
        const constructed = functionScope.nameTable[firstReturn.id]?.node;
        if (!ClassInstance.isInstanceOf(constructed) || (constructed.classDefinition !== classDefinition && !constructed.classDefinition.isSubclassOf(classDefinition))) {
            this.throwEvalError(`constructor for class ${classDefinition.name} must return an object of class ${classDefinition.name}.`);
        }
        return constructed;
    }

    /**
     * Call an instance method with class access and value/handle receiver rules.
     *
     * @param instance Receiver object.
     * @param method Method metadata selected from the class hierarchy.
     * @param args Explicit method arguments, excluding the receiver.
     * @param parent Call-site node used for stack traces.
     * @returns Method return expression or return list.
     */
    public callClassInstanceMethod(instance: ClassInstance, method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        if (method.isAbstract) {
            this.throwEvalError(`cannot call abstract method '${method.name}' for class ${method.classDefinition.name}.`);
        }
        this.ensureConcreteClassMethod(method);
        try {
            ClassInstance.throwIfDeleted(instance);
        } catch (e: unknown) {
            this.throwEvalError((e as Error).message);
        }
        return this.withClassAccess(method.classDefinition, () =>
            this.callFunctionDefinition(Callables.functionDefinition(method.node), [this.classMethodReceiverArgument(instance), ...args], parent, this.requestedOutputCount),
        );
    }

    /**
     * Validate the implicit object argument passed to instance method bodies.
     */
    private classMethodReceiverArgument(instance: ClassInstance): NodeExpr {
        return expressionValue(ClassInstance.methodArgument(instance), 'obj', 'Argument value', (message) => this.throwEvalError(message));
    }

    /**
     * Call a static class method with class access enabled.
     *
     * @param method Static method metadata.
     * @param args Method argument expressions.
     * @param parent Call-site node used for stack traces.
     * @returns Method return expression or return list.
     */
    public callClassStaticMethod(method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        if (method.isAbstract) {
            this.throwEvalError(`cannot call abstract method '${method.name}' for class ${method.classDefinition.name}.`);
        }
        this.ensureConcreteClassMethod(method);
        return this.withClassAccess(method.classDefinition, () => this.callFunctionDefinition(Callables.functionDefinition(method.node), args, parent, this.requestedOutputCount));
    }

    /**
     * Materialize a concrete class method body from an external method file.
     *
     * @param method Method metadata whose AST node may still be a classdef prototype.
     */
    private ensureConcreteClassMethod(method: ClassMethodDefinition): void {
        if (!method.node.attributes?.prototype) {
            return;
        }
        const loaded = this.interpreter?.loadClassMethodDefinition(method.classDefinition.name, method.name, this.currentScope);
        if (!loaded) {
            this.throwEvalError(`method '${method.name}' for class ${method.classDefinition.name} is declared without a body.`);
        }
        this.validateLoadedClassMethodSignature(method, loaded);
        method.node = loaded;
    }

    private validateLoadedClassMethodSignature(method: ClassMethodDefinition, loaded: NodeFunctionDefinition): void {
        if (loaded.parameter.list.length !== method.node.parameter.list.length || loaded.return.list.length !== method.node.return.list.length) {
            this.throwEvalError(`method '${method.name}' for class ${method.classDefinition.name} external definition does not match its classdef prototype.`);
        }
    }

    private callClassEmptyMethod(emptyMethod: ClassEmptyMethod, args: CallArgumentValue[], parent: NodeInput): MultiArray {
        const evaluatedArgs = this.evaluateArgs(args, parent, 'all');
        const dimensionValues =
            evaluatedArgs.length === 0
                ? [Complex.zero(), Complex.zero()]
                : evaluatedArgs.length === 1 && MultiArray.isInstanceOf(evaluatedArgs[0])
                  ? MultiArray.linearize(evaluatedArgs[0])
                  : evaluatedArgs;
        const dimensions = dimensionValues.map((value) => {
            if (!Complex.isInstanceOf(value) || !Complex.imagEquals(value, 0) || !Complex.realIsInteger(value) || Complex.realLessThan(value, 0)) {
                this.throwEvalError(`${emptyMethod.classDefinition.name}.empty dimensions must be nonnegative integer scalars.`);
            }
            return Complex.realToNumber(value);
        });
        if (dimensions.length === 0) {
            this.throwEvalError(`${emptyMethod.classDefinition.name}.empty requires at least one dimension.`);
        }
        if (!dimensions.some((dimension) => dimension === 0)) {
            this.throwEvalError(`${emptyMethod.classDefinition.name}.empty requires at least one zero dimension.`);
        }
        return new MultiArray(dimensions);
    }

    /**
     * Validate expanded positional argument values.
     */
    private expressionValues(values: NodeInput[], namePrefix: string): ExpressionBoundaryValue[] {
        return expressionValues(values, namePrefix, 'Argument value', (message) => this.throwEvalError(message));
    }

    /**
     * Validate one value before exposing it as an ordinary argument expression.
     */
    private expressionValue(value: unknown, name: string): ExpressionBoundaryValue {
        return expressionValue(value, name, 'Argument value', (message) => this.throwEvalError(message));
    }

    /**
     * Validate one evaluated value before storing it in runtime-owned state.
     */
    private runtimeExpressionValue(value: unknown, name: string): RuntimeExpressionValue {
        return runtimeExpressionValue(value, name, 'Argument value', (message) => this.throwEvalError(message));
    }

    /**
     * Evaluate one AST node through the interpreter and reduce lazy return-list
     * carriers without applying expression-only validation.
     */
    private evaluatedExecutionResult(tree: NodeInput, scope: Scope = this.currentScope): NodeInput {
        return AST.reduceToFirstIfReturnList(this.rawEvaluationResult(tree, scope));
    }

    /**
     * Evaluate one AST node without reducing comma-separated return-list
     * carriers, for contexts that must expand them explicitly.
     */
    private rawEvaluationResult(tree: NodeInput, scope: Scope = this.currentScope): NodeInput {
        return this.interpreter!.Evaluator(tree, scope);
    }

    /**
     * Evaluate one AST expression and validate the reduced value before it
     * crosses a context-owned argument/default/receiver boundary.
     */
    private evaluatedExpressionValue(tree: NodeExpr, scope: Scope, name: string): ExpressionBoundaryValue {
        return this.expressionValue(this.evaluatedExecutionResult(tree, scope), name);
    }

    /**
     * Validate values that are exposed through lazy return-list helpers.
     */
    private returnExpression(value: unknown, name: string): ExpressionBoundaryValue {
        return expressionValue(value, name, 'Return value', (message) => this.throwEvalError(message));
    }

    /**
     * Validate several values before exposing them through lazy return lists.
     */
    private returnExpressions(values: unknown[], namePrefix: string): ExpressionBoundaryValue[] {
        return expressionValues(values, namePrefix, 'Return value', (message) => this.throwEvalError(message));
    }

    /**
     * Reduce a class-dispatch result array to its scalar/array return value and
     * validate scalar 1x1 contents before exposing them as expression results.
     */
    private scalarArrayReturnExpression(value: MultiArray, name: string): ExpressionBoundaryValue {
        return this.returnExpression(MultiArray.MultiArrayToScalar(value), name);
    }

    /**
     * Test whether every element in a dispatch result array is a void marker.
     */
    private allVoidArrayResults(value: MultiArray): boolean {
        return MultiArray.linearize(value).every((item: unknown) => AST.isNodeBase(item) && (item as { type: unknown }).type === 'VOID');
    }

    /**
     * Invoke one class method expecting a single output and reduce lazy
     * return-list carriers before storing the result in array dispatch paths.
     */
    private reducedClassMethodResult(instance: ClassInstance, method: ClassMethodDefinition, args: CallArgumentValue[], parent: NodeInput): NodeInput {
        this.pushRequestedOutputCount(1);
        try {
            return AST.reduceToFirstIfReturnList(this.callClassInstanceMethod(instance, method, args, parent));
        } finally {
            this.popRequestedOutputCount();
        }
    }

    /**
     * Read one class-instance element from an object array.
     */
    private classInstanceArrayElement(array: MultiArray, row: number, column: number, name: string): ClassInstance {
        const instance = array.array[row][column];
        if (!ClassInstance.isInstanceOf(instance)) {
            this.throwUndefinedReferenceError(name);
        }
        return instance;
    }

    /**
     * Invoke each bound method stored in an object array.
     *
     * MATLAB/Octave dot access can produce arrays of method handles. Calling
     * that array evaluates each bound method with one requested output and then
     * normalizes the scalar array result through the shared return-expression
     * boundary before exposing it to the caller.
     *
     * @param expr Array containing bound method runtime values.
     * @param args Call arguments.
     * @param parent AST node that owns the call.
     * @returns Scalar or array expression result.
     */
    private callClassBoundMethodArray(expr: MultiArray, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        const methods = MultiArray.linearize(expr);
        if (methods.length > 0 && methods.every((item) => ClassBoundMethod.isInstanceOf(item) && item.method.name === 'delete')) {
            for (const item of methods) {
                if (!ClassBoundMethod.isInstanceOf(item)) {
                    this.throwEvalError('internal error: bound method array contains a non-method value.');
                }
                this.deleteClassInstance(item.instance, parent);
            }
            return AST.nodeVoid();
        }
        const result = new MultiArray(expr.dimension);
        for (let n = 0; n < MultiArray.linearLength(expr); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(expr.dimension[0], expr.dimension[1], n);
            const boundMethod = expr.array[i][j];
            if (!ClassBoundMethod.isInstanceOf(boundMethod)) {
                this.throwEvalError('internal error: bound method array contains a non-method value.');
            }
            result.array[i][j] = this.reducedClassMethodResult(boundMethod.instance, boundMethod.method, args, parent);
        }
        MultiArray.setType(result);
        if (this.allVoidArrayResults(result)) {
            return AST.nodeVoid();
        }
        if (this.requestedOutputCount > 1) {
            const values = MultiArray.linearize(result);
            return this.valueReturnList(values);
        }
        return this.scalarArrayReturnExpression(result, 'ans');
    }

    /**
     * Invoke a bound method value produced outside ordinary call syntax.
     *
     * Public `subsref` descriptors may resolve `.` to a bound method and then
     * apply a following `()` descriptor. This bridge reuses the same scalar and
     * array method-dispatch semantics used by parser-built dotted calls.
     *
     * @param expr Bound method or homogeneous array of bound methods.
     * @param args Already evaluated method arguments.
     * @param parent AST/runtime node that owns the public descriptor call.
     * @returns Method dispatch result.
     */
    public callClassBoundMethodValue(expr: ClassBoundMethod | MultiArray, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        if (ClassBoundMethod.isInstanceOf(expr)) {
            return this.callClassInstanceMethod(expr.instance, expr.method, args, parent);
        }
        return this.callClassBoundMethodArray(expr, args, parent);
    }

    private callFunctionalClassMethodArray(name: string, receiver: MultiArray, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        if (MultiArray.linearLength(receiver) === 0 || !MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item))) {
            this.throwUndefinedReferenceError(name);
        }
        if (name === 'delete') {
            for (let n = 0; n < MultiArray.linearLength(receiver); n++) {
                const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(receiver.dimension[0], receiver.dimension[1], n);
                this.deleteClassInstance(this.classInstanceArrayElement(receiver, i, j, name), parent);
            }
            return AST.nodeVoid();
        }
        const result = new MultiArray(receiver.dimension);
        for (let n = 0; n < MultiArray.linearLength(receiver); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(receiver.dimension[0], receiver.dimension[1], n);
            const instance = this.classInstanceArrayElement(receiver, i, j, name);
            const method = instance.classDefinition.findMethod(name, (item) => !item.isStatic);
            if (!method) {
                this.throwEvalError(`unknown method '${name}' for class ${instance.classDefinition.name}.`);
            }
            if (!this.canAccessClassMember(method.classDefinition, method.access)) {
                this.throwEvalError(`method '${name}' has ${method.access} access for class ${instance.classDefinition.name}.`);
            }
            result.array[i][j] = this.reducedClassMethodResult(instance, method, args, parent);
        }
        MultiArray.setType(result);
        if (this.allVoidArrayResults(result)) {
            return AST.nodeVoid();
        }
        if (this.requestedOutputCount > 1) {
            const values = MultiArray.linearize(result);
            return this.valueReturnList(values);
        }
        return this.scalarArrayReturnExpression(result, 'ans');
    }

    /**
     * Delete a handle class instance, honoring an overloadable `delete` method.
     *
     * @param instance Handle instance to delete.
     * @param parent Call-site node used for stack traces.
     * @returns Void node.
     */
    public deleteClassInstance(instance: ClassInstance, parent: NodeInput): NodeExpr {
        if (!instance.classDefinition.isHandleClass()) {
            this.throwEvalError(`delete is only supported for handle class instances.`);
        }
        try {
            ClassInstance.throwIfDeleted(instance);
        } catch (e: unknown) {
            this.throwEvalError((e as Error).message);
        }
        const deleteMethod = instance.classDefinition.findMethod('delete', (item) => !item.isStatic);
        if (deleteMethod) {
            this.callClassInstanceMethod(instance, deleteMethod, [], parent);
        }
        ClassInstance.delete(instance);
        return AST.nodeVoid();
    }

    private evaluateFunctionalClassMethodReceiver(args: CallArgumentValue[], parent: NodeInput): NodeInput | undefined {
        if (args.length === 0) {
            return undefined;
        }
        const receiverExpression = args[0];
        if (!this.interpreter) {
            return receiverExpression;
        }
        if (AST.isNodeBase(receiverExpression)) {
            receiverExpression.parent = parent;
            receiverExpression.index = 0;
        }
        this.pushRequestedOutputCount(1);
        let receiver: NodeInput;
        try {
            receiver = this.evaluatedExpressionValue(receiverExpression, this.currentScope, 'method receiver');
        } finally {
            this.popRequestedOutputCount();
        }
        return receiver;
    }

    private isFunctionalClassMethodReceiver(receiver: NodeInput | undefined): boolean {
        return (
            ClassInstance.isInstanceOf(receiver) ||
            ClassEventListener.isInstanceOf(receiver) ||
            (MultiArray.isInstanceOf(receiver) &&
                MultiArray.linearLength(receiver) > 0 &&
                MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item) || ClassEventListener.isInstanceOf(item)))
        );
    }

    private callFunctionalClassMethod(name: string, args: CallArgumentValue[], parent: NodeInput, receiver = this.evaluateFunctionalClassMethodReceiver(args, parent)): NodeExpr {
        if (!receiver) {
            this.throwUndefinedReferenceError(name);
        }
        if (name === 'delete' && ClassEventListener.isInstanceOf(receiver)) {
            ClassEventListener.delete(receiver);
            return AST.nodeVoid();
        }
        if (name === 'delete' && MultiArray.isInstanceOf(receiver) && MultiArray.linearLength(receiver) > 0 && MultiArray.linearize(receiver).every(ClassEventListener.isInstanceOf)) {
            for (const listener of MultiArray.linearize(receiver)) {
                if (!ClassEventListener.isInstanceOf(listener)) {
                    this.throwEvalError('internal error: event listener array contains a non-listener value.');
                }
                ClassEventListener.delete(listener);
            }
            return AST.nodeVoid();
        }
        if (MultiArray.isInstanceOf(receiver) && MultiArray.linearLength(receiver) > 0 && MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item))) {
            return this.callFunctionalClassMethodArray(name, receiver, args.slice(1), parent);
        }
        if (!ClassInstance.isInstanceOf(receiver)) {
            this.throwUndefinedReferenceError(name);
        }
        if (name === 'delete') {
            return this.deleteClassInstance(receiver, parent);
        }
        const method = receiver.classDefinition.findMethod(name, (item) => !item.isStatic);
        if (!method) {
            this.throwEvalError(`unknown method '${name}' for class ${receiver.classDefinition.name}.`);
        }
        if (!this.canAccessClassMember(method.classDefinition, method.access)) {
            this.throwEvalError(`method '${name}' has ${method.access} access for class ${receiver.classDefinition.name}.`);
        }
        return this.callClassInstanceMethod(receiver, method, args.slice(1), parent);
    }

    /**
     * Dispatch a built-in, anonymous function, or user-defined function call.
     *
     * @param callable Resolved callable wrapper.
     * @param args Raw call argument expressions.
     * @param parent Call-site node used for metadata and stack traces.
     * @returns Call result.
     */
    callCallable(callable: Callable, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        const requestedOutputCount = this.requestedOutputCount;
        switch (callable.type) {
            case 'BUILTIN': {
                const node = callable.node;
                const alias = this.aliasNameFunction(node.id);
                const operatorOverload = this.callCallableFunctionalOperatorOverload(node, args, parent);
                if (operatorOverload) {
                    return operatorOverload;
                }
                const evaluatedArgs = this.evaluateBuiltInArgs(node, args, parent);
                this.validateBuiltInInputArity(node, evaluatedArgs.length);
                /* Push a frame before entering the built-in so errors can capture this call. */
                this.pushCallStackFrame(new CallFrame(this.currentScope, callable, this.resolveCallSite(parent), node.id, evaluatedArgs.length, requestedOutputCount, args));
                try {
                    const classMethodResult = this.callClassBuiltinMethod(node, evaluatedArgs, parent);
                    if (typeof classMethodResult !== 'undefined') {
                        return classMethodResult;
                    }
                    this.validateBuiltInInputParameters(node, evaluatedArgs);
                    if (node.mapper && evaluatedArgs.length !== 1) {
                        this.throwEvalError(`Invalid call to ${alias}.`);
                    }
                    if (alias === 'size' && evaluatedArgs.length === 1 && requestedOutputCount > 1) {
                        return this.sizeReturnList(evaluatedArgs[0]);
                    }
                    return node.mapper && evaluatedArgs.length === 1 && MultiArray.isInstanceOf(evaluatedArgs[0])
                        ? MultiArray.rawMap(evaluatedArgs[0], node.func)
                        : node.func(...evaluatedArgs);
                } finally {
                    /* Always restore the caller frame, even when the built-in throws. */
                    this.popCallStackFrame();
                }
            }
            case 'LAMBDA': {
                const lambda = callable.node;
                const params = lambda.parameter as FunctionParameter[];
                const { hasVarargin, fixedParamCount } = FunctionCall.lambdaInputLayout(params);
                const callArgs = this.expandCommaListArguments(args);
                FunctionCall.validateLambdaInputArity(callArgs.length, hasVarargin, fixedParamCount, (message) => this.throwEvalError(message));
                const lambdaScope = Scope.create((lambda.closure as Scope | undefined) ?? this.currentScope);
                this.configureAnonymousFunctionWorkspace(lambda, lambdaScope);
                FunctionCall.bindLambdaInputs(
                    params,
                    callArgs,
                    parent,
                    hasVarargin,
                    fixedParamCount,
                    (name, value) => lambdaScope.defineName(name, value),
                    (arg) => {
                        this.pushRequestedOutputCount(1);
                        try {
                            return this.evaluatedExpressionValue(arg, this.currentScope, 'argument');
                        } finally {
                            this.popRequestedOutputCount();
                        }
                    },
                    (message) => this.throwEvalError(message),
                );
                this.pushCallStackFrame(
                    new CallFrame(
                        lambdaScope,
                        callable,
                        this.resolveCallSite(parent),
                        FunctionHandle.toString(lambda),
                        callArgs.length,
                        requestedOutputCount,
                        args,
                        undefined,
                        this.requestedOutputMask(requestedOutputCount),
                    ),
                );
                try {
                    return this.rawEvaluationResult(lambda.expression, lambdaScope);
                } finally {
                    this.popCallStackFrame();
                }
            }
            case 'FCNDEF': {
                return this.callFunctionDefinition(callable, args, parent, requestedOutputCount);
            }
            case 'STATIC_METHOD': {
                return this.callClassStaticMethod(callable.node.method, args, parent);
            }
            default:
                throw new Error('Invalid callable.');
        }
    }

    /**
     * Configure the static workspace used by anonymous functions.
     *
     * MATLAB treats anonymous-function workspaces as static: dynamic code such
     * as `eval` may use names that appear in the expression or parameter list,
     * but may not introduce brand-new names from strings.
     */
    private configureAnonymousFunctionWorkspace(lambda: FunctionHandle, scope: Scope): void {
        const names = new Set<string>();
        for (const parameter of lambda.parameter) {
            if (AST.isNodeIdentifier(parameter)) {
                names.add(parameter.id);
            }
        }
        this.collectAnonymousExpressionNames(lambda.expression, names);
        scope.allowStaticWorkspaceNames(names);
    }

    /**
     * Collect identifier names that appear textually in an anonymous expression.
     */
    private collectAnonymousExpressionNames(node: unknown, names: Set<string>, seen = new WeakSet<object>()): void {
        if (!node || typeof node !== 'object' || seen.has(node)) {
            return;
        }
        seen.add(node);
        if (AST.isNodeIdentifier(node)) {
            names.add(node.id);
        }
        const record = node as Record<string, unknown>;
        for (const [key, value] of Object.entries(record)) {
            if (key === 'parent' || key === 'start' || key === 'stop') {
                continue;
            }
            if (Array.isArray(value)) {
                for (const item of value) {
                    this.collectAnonymousExpressionNames(item, names, seen);
                }
            } else {
                this.collectAnonymousExpressionNames(value, names, seen);
            }
        }
    }

    private valueReturnList(values: NodeInput[]): NodeReturnList {
        const outputMask = this.requestedOutputMask(values.length);
        const outputIsRequested = (index: number): boolean => outputMask[index] ?? true;
        return AST.nodeCommaSeparatedReturnList(
            values.length,
            (evaluated: ReturnHandlerResult, index: number): NodeExpr => {
                const value = evaluated[`out${index}`];
                if (typeof value === 'undefined') {
                    AST.throwErrorIfGreaterThanReturnList(index, index + 1, (message) => this.throwEvalError(message));
                }
                return value;
            },
            (length: number): ReturnHandlerResult => {
                AST.throwErrorIfGreaterThanReturnList(values.length, length, (message) => this.throwEvalError(message));
                const out: ReturnHandlerResult = { length };
                for (let index = 0; index < length; index++) {
                    if (!outputIsRequested(index)) {
                        continue;
                    }
                    out[`out${index}`] = this.returnExpression(values[index], `out${index + 1}`);
                }
                return out;
            },
        );
    }

    private callFunctionalOperatorOverload(dispatch: CallDispatch, parent: NodeInput, args: CallArgumentValue[]): NodeExpr | undefined {
        if (parent.delim !== '()' || dispatch.kind !== 'callable' || !Callables.isBuiltin(dispatch.callable) || !Context.operatorFunctionNames.has(dispatch.callable.node.id)) {
            return undefined;
        }
        return this.interpreter?.callFunctionalOperatorOverload(dispatch.callable.node, args, parent);
    }

    /**
     * Dispatch built-in operator functions reached without an index-expression
     * wrapper, such as `feval('plus', obj, obj)`.
     */
    private callCallableFunctionalOperatorOverload(node: NodeBuiltInFunction, args: CallArgumentValue[], parent: NodeInput): NodeExpr | undefined {
        if ((AST.isNodeIdentifier(parent) && parent.id === 'builtin') || !Context.operatorFunctionNames.has(node.id)) {
            return undefined;
        }
        return this.interpreter?.callFunctionalOperatorOverload(node, args, parent);
    }

    /**
     * Classify an evaluated expression before applying call/index syntax.
     *
     * This helper keeps MATLAB/Octave dispatch precedence visible in one
     * place: callable handles/functions first, class method wrappers next,
     * constructors and functional method syntax after that, and native indexing
     * as the final fallback.
     *
     * @param expr Evaluated callee or indexed expression.
     * @param parent Index expression node carrying delimiter metadata.
     * @param args Raw call/index arguments, used only to classify functional method calls.
     * @returns Structured dispatch decision.
     */
    public resolveCallDispatch(expr: NodeExpr, parent: NodeInput, args: CallArgumentValue[] = []): CallDispatch {
        const callable = this.resolveCallable(expr);
        if (!callable && FunctionHandle.isInstanceOf(expr)) {
            throw new Error('Unexpected non-callable FunctionHandle.');
        }
        if (callable) {
            return { kind: 'callable', callable, expr };
        }
        if (ClassBoundMethod.isInstanceOf(expr)) {
            return { kind: 'bound-method', expr };
        }
        if (MultiArray.isInstanceOf(expr) && MultiArray.linearLength(expr) > 0 && MultiArray.linearize(expr).every((item) => ClassBoundMethod.isInstanceOf(item))) {
            return { kind: 'bound-method-array', expr };
        }
        if (ClassStaticMethod.isInstanceOf(expr)) {
            return { kind: 'static-method', expr };
        }
        if (ClassEmptyMethod.isInstanceOf(expr)) {
            return { kind: 'empty-method', expr };
        }
        if (ClassDefinition.isInstanceOf(expr)) {
            return { kind: 'constructor', expr };
        }
        if (AST.isNodeIdentifier(expr) && parent.delim === '()') {
            const receiver = this.evaluateFunctionalClassMethodReceiver(args, parent);
            return this.isFunctionalClassMethodReceiver(receiver)
                ? { kind: 'functional-class-method', expr, functionalName: expr.id, functionalReceiver: receiver }
                : { kind: 'undefined-function', expr, functionalName: expr.id };
        }
        return { kind: 'indexing', expr };
    }

    /**
     * Execute one non-indexing call dispatch decision.
     *
     * @param dispatch Structured dispatch decision.
     * @param args Raw call argument expressions.
     * @param parent Index expression node carrying delimiter metadata.
     * @returns Call result, or `undefined` when native indexing should handle it.
     */
    private applyCallDispatch(dispatch: CallDispatch, args: CallArgumentValue[], parent: NodeInput): NodeExpr | undefined {
        switch (dispatch.kind) {
            case 'callable':
                return this.callCallable(dispatch.callable, args, parent);
            case 'bound-method':
                return this.callClassInstanceMethod(dispatch.expr.instance, dispatch.expr.method, args, parent);
            case 'bound-method-array':
                return this.callClassBoundMethodArray(dispatch.expr, args, parent);
            case 'static-method':
                return this.callClassStaticMethod(dispatch.expr.method, args, parent);
            case 'empty-method':
                return this.callClassEmptyMethod(dispatch.expr, args, parent);
            case 'constructor':
                return this.constructClassInstance(dispatch.expr, args, parent);
            case 'functional-class-method':
                return this.callFunctionalClassMethod(dispatch.functionalName, args, parent, dispatch.functionalReceiver);
            case 'undefined-function':
                this.throwUndefinedReferenceError(dispatch.functionalName);
            case 'indexing':
                return undefined;
        }
    }

    /**
     * Apply native MATLAB/Octave indexing after call dispatch declines.
     *
     * @param expr Evaluated indexed expression.
     * @param args Raw index expressions.
     * @param parent Index expression node carrying delimiter metadata.
     * @returns Indexed value or comma-separated return list.
     */
    private applyNativeIndexing(expr: NodeExpr, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        const evaluatedIndexArguments = (): ReturnType<typeof MultiArray.indexArguments> => {
            const values = this.evaluateArgs(args, parent, 'all').map((value) => this.interpreter?.convertIndexArgument(value, parent) ?? value);
            return MultiArray.indexArguments(values);
        };
        if (CharString.isInstanceOf(expr)) {
            if (parent.delim === '{}') {
                this.throwEvalError('matrix cannot be indexed with {');
            }
            const array = MultiArray.characterVectorFromCharString(expr);
            const evaluatedArgs = evaluatedIndexArguments();
            const result = MultiArray.getElements(array, parent.expr.id, [], evaluatedArgs);
            result!.parent = parent;
            return MultiArray.charStringFromCharacterVectorResult(result, expr.quote);
        }
        if (parent.delim === '{}' && !(MultiArray.isInstanceOf(expr) && expr.isCell)) {
            this.throwEvalError('matrix cannot be indexed with {');
        }
        const array = MultiArray.scalarOrCellToMultiArray(expr);
        const evaluatedArgs = evaluatedIndexArguments();
        const result = MultiArray.getElements(array, parent.expr.id, [], evaluatedArgs);
        result!.parent = parent;
        if (array.isCell && parent.delim === '()') {
            if (!MultiArray.isInstanceOf(result)) {
                this.throwEvalError('internal error: cell parenthesis indexing did not produce a cell array.');
            }
            result.isCell = true;
            return result;
        }
        if (array.isCell && parent.delim === '{}' && (this.requestedOutputCount > 1 || this.commaListExpansionEnabled)) {
            const values = MultiArray.linearize(result);
            if (values.length > 1) {
                return this.valueReturnList(this.returnExpressions(values, 'out'));
            }
        }
        return MultiArray.MultiArrayToScalar(result);
    }

    /**
     * Apply call or indexing syntax to an evaluated expression.
     *
     * MATLAB/Octave use the same parentheses for function calls and array
     * indexing. This dispatcher first attempts callable/class dispatch and then
     * falls back to array/cell indexing, including comma-separated-list rules.
     *
     * @param expr Evaluated callee/indexed expression.
     * @param args Raw index or call argument expressions.
     * @param parent Index expression node carrying delimiter metadata.
     * @returns Call or indexing result.
     */
    apply(expr: NodeExpr, args: CallArgumentValue[], parent: NodeInput): NodeExpr {
        /* Debug-only structural trace for call/index dispatch. */
        if (this.interpreter!.debug) {
            console.log('[APPLY]', {
                exprType: expr?.type,
                isFunctionHandle: FunctionHandle.isInstanceOf(expr),
                exprId: Context.debugIdentifier(expr),
                delim: parent.delim,
                argsCount: args.length,
            });
        }
        const dispatch = this.resolveCallDispatch(expr, parent, args);
        const operatorOverload = this.callFunctionalOperatorOverload(dispatch, parent, args);
        if (operatorOverload) {
            return operatorOverload;
        }
        if (this.interpreter!.debug) {
            console.log('[DISPATCH]', dispatch.kind, dispatch.kind === 'callable' ? dispatch.callable.type : '');
        }
        const callResult = this.applyCallDispatch(dispatch, args, parent);
        if (callResult) {
            return callResult;
        }
        /* Fall back to indexing when the expression is not callable. */
        if (this.interpreter!.debug) {
            console.warn('[FALLBACK → INDEX]', {
                exprType: expr?.type,
                exprId: Context.debugIdentifier(expr),
            });
        }
        return this.applyNativeIndexing(expr, args, parent);
    }

    /**
     * Define function in builtInFunctionTable.
     * @param id Name of function.
     * @param func Function body.
     * @param map `true` if function is a mapper function.
     * @param ev A `boolean` array indicating which function argument should
     * be evaluated before executing the function. If array is zero-length all
     * arguments are evaluated.
     */
    public defineBuiltInFunction(id: string, func: Function, mapper: boolean = false, ev: boolean[] = [], signature?: BuiltInFunctionSignature): void {
        this.builtInFunctionTable[id] = { type: 'BUILTIN', id, mapper, ev, func, definingScope: this.globalScope!, signature };
    }

    /**
     * Merge external built-in functions into the current built-in table.
     * @param table Built-in functions to add or override.
     */
    public assignBuiltInFunctionTable(table?: Record<string, NodeBuiltInFunction>): void {
        if (table) {
            Object.assign(this.builtInFunctionTable, table);
        }
    }

    /**
     * Define unary operator function in builtInFunctionTable.
     * @param id Name of function.
     * @param func Function body.
     */
    public defineUnaryOperatorFunction(id: KeyOfTypeOfMathOperation, func: UnaryMathOperation): void {
        this.builtInFunctionTable[id] = {
            type: 'BUILTIN',
            id,
            mapper: false,
            ev: [],
            func: (...operand: NodeExpr) => {
                if (operand.length === 1) {
                    return func(operand[0]);
                } else {
                    this.throwEvalError(`Invalid call to ${id}. Type 'help ${id}' to see correct usage.`);
                }
            },
            definingScope: this.globalScope!,
            signature: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        };
    }

    /**
     * Define binary operator function in builtInFunctionTable.
     * @param id Name of function.
     * @param func Function body.
     */
    public defineBinaryOperatorFunction(id: KeyOfTypeOfMathOperation, func: BinaryMathOperation): void {
        this.builtInFunctionTable[id] = {
            type: 'BUILTIN',
            id,
            mapper: false,
            ev: [],
            func: (left: NodeExpr, ...right: NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else {
                    this.throwEvalError(`Invalid call to ${id}. Type 'help ${id}' to see correct usage.`);
                }
            },
            definingScope: this.globalScope!,
            signature: { inputs: { arity: 2 }, outputs: { arity: 1 } },
        };
    }

    /**
     * Define a left-associative operator function that accepts two or more operands.
     * @param id Operator name.
     * @param func Binary operation used to fold the operands.
     */
    public defineLeftAssociativeMultipleOperationFunction(id: KeyOfTypeOfMathOperation, func: BinaryMathOperation): void {
        this.builtInFunctionTable[id] = {
            type: 'BUILTIN',
            id,
            mapper: false,
            ev: [],
            func: (left: NodeExpr, ...right: NodeExpr) => {
                if (right.length === 1) {
                    return func(left, right[0]);
                } else if (right.length > 1) {
                    let result = func(left, right[0]);
                    for (let i = 1; i < right.length; i++) {
                        result = func(result, right[i]);
                    }
                    return result;
                } else {
                    this.throwEvalError(`Invalid call to ${id}. Type 'help ${id}' to see correct usage.`);
                }
            },
            definingScope: this.globalScope!,
            signature: { inputs: { arity: -2 }, outputs: { arity: 1 } },
        };
    }

    /**
     * Push a new frame onto the call stack.
     *
     * @param frame - CallFrame to push
     */
    public pushCallStackFrame(frame: CallFrame): void {
        const parent = this.currentFrame;
        frame.parentFrame = parent;
        this.callStack.push(frame);
    }

    /**
     * Pop the current frame from the call stack.
     *
     * @returns Removed frame
     */
    public popCallStackFrame(): CallFrame | undefined {
        return this.callStack.pop();
    }

    /**
     * Returns a snapshot of the current stack trace.
     *
     * Top frame is the first element.
     */
    private getStackTrace(): CallFrame[] {
        /* remove frame global (without func) */
        return this.callStack
            .filter((f) => f.func !== undefined)
            .slice()
            .reverse(); /* internal → external */
    }
}

export type { CallDispatch, CallDispatchKind, SymbolResolution, SymbolResolutionKind, SymbolResolutionOptions, SymbolResolutionSource };
export { Context, ReturnSignal, BreakSignal, ContinueSignal };
export default Context;
