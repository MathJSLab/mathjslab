import type {
    AliasNameTable,
    BuiltInFunctionInputSignature,
    BuiltInFunctionSignature,
    NameEntry,
    NodeBuiltInFunction,
    NodeExpr,
    NodeIdentifier,
    NodeInput,
    NodeFunctionDefinition,
    NodeReturnList,
    ReturnHandlerResult,
} from './AST';
import type { ClassMethodDefinition } from './ClassMember';
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
import type { FunctionParameter } from './FunctionCall';
import { FunctionCall } from './FunctionCall';
import { FunctionStack } from './FunctionStack';
import { FunctionWorkspace } from './FunctionWorkspace';
import { CircularReferenceError, EvalError, ReferenceError, SyntaxError, UndefinedReferenceError } from './InterpreterError';
import { RuntimeValue } from './RuntimeValue';

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
    splitFunctionCallNameValueArguments(func: NodeFunctionDefinition, args: NodeExpr[]): { positional: NodeExpr[]; named: Map<string, NodeExpr> };
    /** Return default input expressions keyed by parameter name. */
    getFunctionInputArgumentDefaults(func: NodeFunctionDefinition): Map<string, NodeExpr>;
    /** Bind evaluated name-value arguments into a function call scope. */
    bindFunctionNameValueArguments(func: NodeFunctionDefinition, scope: Scope, values: Map<string, NodeInput>): void;
    /** Register nested functions visible from a function body. */
    registerNestedFunctions(func: NodeFunctionDefinition, scope: Scope): void;
    /** Validate input `arguments` blocks after inputs are bound. */
    validateFunctionInputArguments(func: NodeFunctionDefinition, scope: Scope): void;
    /** Validate `arguments (Repeating)` declarations against `varargin`. */
    validateFunctionRepeatingArguments(func: NodeFunctionDefinition, scope: Scope, values: NodeInput[]): void;
    /** Validate output `arguments` blocks after the body executes. */
    validateFunctionOutputArguments(func: NodeFunctionDefinition, scope: Scope, requestedOutputCount: number): void;
    /** Validate property defaults for a newly instantiated class object. */
    validateClassInstancePropertyDefaults(instance: ClassInstance, scope: Scope): void;
    /** Resolve a function source through the configured function provider API. */
    loadFunctionDefinition(name: string, scope: Scope): NodeFunctionDefinition | undefined;
    /** Resolve a class source through the configured class provider API. */
    loadClassDefinition(name: string, scope: Scope): ClassDefinition | undefined;
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
type SymbolResolutionKind = 'variable' | 'class' | 'function' | 'builtin';

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
};

/**
 * Kinds of call/index dispatch selected after a callee expression is evaluated.
 */
type CallDispatchKind = 'callable' | 'bound-method' | 'bound-method-array' | 'static-method' | 'empty-method' | 'constructor' | 'functional-class-method' | 'undefined-function' | 'indexing';

/**
 * Structured call/index dispatch decision.
 */
type CallDispatch = {
    /** Selected dispatch category. */
    kind: CallDispatchKind;
    /** Callable wrapper for built-ins, user functions, and anonymous handles. */
    callable?: Callable;
    /** Evaluated callee or indexed value. */
    expr: NodeExpr;
    /** Unresolved functional method name for `method(obj, ...)` syntax. */
    functionalName?: string;
    /** Pre-evaluated receiver for functional class method dispatch. */
    functionalReceiver?: NodeInput;
};

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
            this.aliasNameTable = aliasNameTable;
            this.aliasNameFunction = (name: string): string => {
                let result = false;
                let aliasname = '';
                for (const i in this.aliasNameTable) {
                    if (this.aliasNameTable[i].test(name)) {
                        result = true;
                        aliasname = i;
                        break;
                    }
                }
                if (result) {
                    return aliasname;
                } else {
                    return name;
                }
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
        const functions = options.functions ?? true;
        const imports = options.imports ?? true;
        const canonical = this.aliasNameFunction(name);

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
            const loadedFunction = this.interpreter?.loadFunctionDefinition(canonical, scope);
            if (loadedFunction) {
                return { kind: 'function', name, resolvedName: canonical, source: 'local', functionDefinition: loadedFunction };
            }
        }

        if (classes && loadClasses) {
            const loadedClass = this.resolveClassDefinitionByExactName(canonical, scope, true);
            if (loadedClass) {
                return { kind: 'class', name, resolvedName: canonical, source: 'local', classDefinition: loadedClass };
            }
        }

        if (imports && !canonical.includes('.')) {
            for (const importedName of scope.importedNameCandidates(canonical)) {
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
                    const importedLoaded = this.interpreter?.loadFunctionDefinition(importedCanonical, scope);
                    if (importedLoaded) {
                        return { kind: 'function', name, resolvedName: importedCanonical, source: 'import', functionDefinition: importedLoaded };
                    }
                }
                if (classes && loadClasses) {
                    const importedLoadedClass = this.resolveClassDefinitionByExactName(importedCanonical, scope, true);
                    if (importedLoadedClass) {
                        return { kind: 'class', name, resolvedName: importedCanonical, source: 'import', classDefinition: importedLoadedClass };
                    }
                }
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
     * Output count requested by the nearest evaluation context.
     */
    public get requestedOutputCount(): number {
        return this.requestedOutputCountStack[this.requestedOutputCountStack.length - 1] ?? 1;
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
                const resolved = this.resolveSymbol(expr.id, (expr.closure as Scope | undefined) ?? this.currentScope, { variables: false, classes: false });
                const func = resolved?.functionDefinition;
                if (!func) {
                    this.throwReferenceError(`'${expr.id}' undefined.`);
                }
                return Callables.fromFunctionNode(func);
            }
            /* Lambda handle, for example `@(x)x^2`. */
            return Callables.lambda(expr as FunctionHandle & { id: undefined });
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
            const entry = variable.entry!;
            if (this.allowForwardReference && entry.undefinedReference) {
                this.throwIfCircularReference(name, scope);
                this.throwUndefinedReferenceError(entry.undefinedReference);
            }
            entry.node!.parent = tree;
            return entry.node as NodeExpr;
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
                const entry = resolved.entry!;
                if (this.allowForwardReference && entry.undefinedReference) {
                    this.throwIfCircularReference(name, scope);
                    this.throwUndefinedReferenceError(entry.undefinedReference);
                }
                entry.node!.parent = tree;
                return entry.node as NodeExpr;
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
                /* Otherwise a bare function name is an invalid MATLAB-like call. */
                AST.throwInvalidCallError(name, true, (message) => this.throwSyntaxError(message));
        }
        /* 4. Undefined identifier. */
        if (AST.isNodeIndexExpr(tree.parent)) {
            return tree as NodeExpr;
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
            return [AST.reduceToFirstIfReturnList(value)];
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
     * Evaluate one call/assignment expression with comma-list expansion enabled.
     *
     * @param arg Expression to evaluate.
     * @returns Expanded values produced by the expression.
     */
    public evaluateCommaListExpression(arg: NodeExpr): NodeInput[] {
        this.pushRequestedOutputCount(1);
        this.pushCommaListExpansion();
        try {
            return this.expandCommaSeparatedList(this.interpreter!.Evaluator(arg, this.currentScope));
        } finally {
            this.popCommaListExpansion();
            this.popRequestedOutputCount();
        }
    }

    /**
     * Evaluate and expand a list of positional call arguments.
     *
     * @param args Argument expressions.
     * @returns Expanded argument values retyped as expressions for call helpers.
     */
    public expandCommaListArguments(args: NodeExpr[]): NodeExpr[] {
        return args.flatMap((arg) => this.evaluateCommaListExpression(arg)) as NodeExpr[];
    }

    private evaluateArgs(args: NodeExpr[], parent: NodeInput, mode: 'all' | boolean[]): NodeExpr[] {
        return args.flatMap((arg: NodeExpr, i: number) => {
            if (mode === 'all') {
                this.pushRequestedOutputCount(1);
                this.pushCommaListExpansion();
                try {
                    return this.expandCommaSeparatedList(this.interpreter!.Evaluator(arg, this.currentScope)) as NodeExpr[];
                } finally {
                    this.popCommaListExpansion();
                    this.popRequestedOutputCount();
                }
            }
            const ev = mode;
            if (ev.length > 0 && i < ev.length && !ev[i]) {
                return [arg];
            }
            this.pushRequestedOutputCount(1);
            this.pushCommaListExpansion();
            try {
                return this.expandCommaSeparatedList(this.interpreter!.Evaluator(arg, this.currentScope)) as NodeExpr[];
            } finally {
                this.popCommaListExpansion();
                this.popRequestedOutputCount();
            }
        });
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

    private getCurrentFunctionCountFrame(): CallFrame | undefined {
        return FunctionStack.currentFunctionCountFrame(this.callStack) as CallFrame | undefined;
    }

    private getCallerWorkspace(forAssignment = false): Scope {
        return FunctionStack.callerWorkspace(this.callStack, this.globalScope!, (parent) => Scope.create(parent as Scope | undefined), forAssignment) as Scope;
    }

    /**
     * Resolve a MATLAB-like workspace selector.
     *
     * @param name Workspace name such as `base` or `caller`.
     * @param forAssignment Whether the resolved workspace will be assigned into.
     * @returns Target scope.
     */
    public resolveWorkspace(name: string, forAssignment = false): Scope {
        return FunctionWorkspace.resolveWorkspace(name, this.globalScope!, this.getCallerWorkspace(forAssignment), (message) => this.throwSyntaxError(message)) as Scope;
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
     * Implement `inputname` for the current function frame.
     *
     * @param indexNode One-based argument index.
     * @returns Original caller expression text when available.
     */
    public currentFunctionInputName(indexNode: NodeInput, onlyVariableNames = true, unparse?: (arg: NodeExpr) => string): CharString {
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
    public declarePersistent(name: string, value: NodeInput | undefined, scope: Scope): void {
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
    public declareGlobal(name: string, value: NodeInput | undefined, scope: Scope): void {
        FunctionWorkspace.declareGlobal(name, value, this.globalNameSet, this.globalScope!.nameTable, scope.nameTable);
    }

    /**
     * Clear all global bindings from the global scope and active frames.
     */
    public clearGlobalVariables(): void {
        FunctionWorkspace.clearGlobalVariables(
            this.globalNameSet,
            this.globalScope,
            this.callStack.map((frame) => frame.scope),
        );
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

    private validateBuiltInInputArity(node: NodeBuiltInFunction, argCount: number): void {
        AST.throwInvalidCallError(node.id, !FunctionSignature.inputArityIsValid(node, argCount), (message) => this.throwSyntaxError(message));
    }

    private validateBuiltInInputParameters(node: NodeBuiltInFunction, args: NodeInput[]): void {
        AST.throwInvalidCallError(node.id, !FunctionSignature.inputParametersAreValid(node, args), (message) => this.throwSyntaxError(message));
    }

    private valueDimensions(value: NodeInput): number[] {
        return RuntimeValue.dimensions(value);
    }

    private sizeReturnList(value: NodeInput): NodeReturnList {
        const size = this.valueDimensions(value);
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
                    const value = index === length - 1 ? dims.slice(index).reduce((product, dim) => product * dim, 1) : dims[index];
                    out[`dim${index}`] = Complex.create(value);
                }
                return out;
            },
        );
    }

    private callFunctionDefinition(callable: FunctionDefinitionCallable, args: NodeExpr[], parent: NodeInput, requestedOutputCount: number): NodeExpr {
        const func = callable.node;
        const { inputLayout, returnLayout, callArguments, inputDefaults } = FunctionCall.prepareFunctionCall(func, args, requestedOutputCount, {
            nameValueParameters: (item) => this.interpreter!.getFunctionNameValueParameters(item),
            splitCallArguments: (item, itemArgs) => this.interpreter!.splitFunctionCallNameValueArguments(item, itemArgs),
            expandPositionalArguments: (itemArgs) => this.expandCommaListArguments(itemArgs),
            inputDefaults: (item) => this.interpreter!.getFunctionInputArgumentDefaults(item),
            throwEvalError: (message) => this.throwEvalError(message),
        });
        /* Create a function scope, preserving the definition scope when available. */
        const functionScope = Scope.create((func.definingScope as Scope | undefined) ?? this.currentScope);
        functionScope.assignExistingParentNames = Boolean(func.attributes?.nested);
        FunctionCall.initializeFixedReturnSlots(returnLayout.returnNames, functionScope.nameTable);
        /* Bind evaluated arguments to formal parameter names. */
        const evaluateCallArgument = (arg: NodeExpr): NodeInput => {
            this.pushRequestedOutputCount(1);
            try {
                return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
            } finally {
                this.popRequestedOutputCount();
            }
        };
        const evaluatedArgs = FunctionCall.evaluateCallArguments(callArguments.positional, parent, evaluateCallArgument);
        const evaluatedNameValueArgs = FunctionCall.evaluateNameValueArguments(callArguments.named, parent, evaluateCallArgument);
        FunctionCall.bindPositionalInputs(
            func,
            inputLayout,
            evaluatedArgs,
            inputDefaults,
            (name, value) => functionScope.defineName(name, value),
            (_name, defaultValue) => {
                this.pushRequestedOutputCount(1);
                try {
                    return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(defaultValue, functionScope));
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
        this.pushCallStackFrame(new CallFrame(functionScope, callable, this.resolveCallSite(parent), func.id, inputCount, requestedOutputCount, args));
        this.loadPersistentVariables(func, functionScope);
        let result: NodeExpr;
        try {
            this.interpreter!.registerNestedFunctions(func, functionScope);
            this.interpreter!.validateFunctionInputArguments(func, functionScope);
            this.interpreter!.validateFunctionRepeatingArguments(func, functionScope, evaluatedArgs.slice(inputLayout.positionalParamCount));
            /* Execute the function body. */
            try {
                if (func.statements.list.length > 0) {
                    this.interpreter!.Evaluator(func.statements, functionScope);
                }
            } catch (e: unknown) {
                if (!(e instanceof ReturnSignal)) {
                    throw e;
                }
            }
            this.interpreter!.validateFunctionOutputArguments(func, functionScope, requestedOutputCount);
            /* Build a lazy return list backed by the function scope. */
            result = FunctionCall.createReturnList(returnLayout, functionScope.nameTable, (message) => this.throwEvalError(message));
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
                return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(defaultValue, this.currentScope));
            } finally {
                this.popRequestedOutputCount();
            }
        });
        this.interpreter!.validateClassInstancePropertyDefaults(instance, this.currentScope);
        return instance;
    }

    private constructClassInstance(classDefinition: ClassDefinition, args: NodeExpr[], parent: NodeInput): ClassInstance {
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

    public constructSuperclassInstance(instance: ClassInstance, superclassDefinition: ClassDefinition, args: NodeExpr[], parent: NodeInput): ClassInstance {
        if (!instance.classDefinition.isSubclassOf(superclassDefinition)) {
            this.throwEvalError(`class ${superclassDefinition.name} is not a superclass of class ${instance.classDefinition.name}.`);
        }
        return this.constructClassInstanceWithInstance(superclassDefinition, instance, args, parent);
    }

    private constructClassInstanceWithInstance(classDefinition: ClassDefinition, instance: ClassInstance, args: NodeExpr[], parent: NodeInput): ClassInstance {
        const constructorMethod = classDefinition.methodTable[classDefinition.name]?.find((method) => !method.isStatic);
        if (!constructorMethod) {
            if (args.length > 0) {
                this.throwEvalError(`constructor for class ${classDefinition.name} accepts no input arguments.`);
            }
            return instance;
        }

        const func = constructorMethod.node;
        const requestedOutputCount = 1;
        const { inputLayout, returnLayout, callArguments, inputDefaults } = FunctionCall.prepareFunctionCall(func, args, requestedOutputCount, {
            nameValueParameters: (item) => this.interpreter!.getFunctionNameValueParameters(item),
            splitCallArguments: (item, itemArgs) => this.interpreter!.splitFunctionCallNameValueArguments(item, itemArgs),
            expandPositionalArguments: (itemArgs) => this.expandCommaListArguments(itemArgs),
            inputDefaults: (item) => this.interpreter!.getFunctionInputArgumentDefaults(item),
            throwEvalError: (message) => this.throwEvalError(message),
        });
        const functionScope = Scope.create((func.definingScope as Scope | undefined) ?? this.currentScope);
        FunctionCall.initializeFixedReturnSlots(returnLayout.returnNames, functionScope.nameTable);
        const firstReturn = returnLayout.returnNames[0];
        if (firstReturn && firstReturn.type !== '<~>') {
            functionScope.defineName(firstReturn.id, instance);
        }

        const evaluateCallArgument = (arg: NodeExpr): NodeInput => {
            this.pushRequestedOutputCount(1);
            try {
                return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
            } finally {
                this.popRequestedOutputCount();
            }
        };
        const evaluatedArgs = FunctionCall.evaluateCallArguments(callArguments.positional, parent, evaluateCallArgument);
        const evaluatedNameValueArgs = FunctionCall.evaluateNameValueArguments(callArguments.named, parent, evaluateCallArgument);
        FunctionCall.bindPositionalInputs(
            func,
            inputLayout,
            evaluatedArgs,
            inputDefaults,
            (name, value) => functionScope.defineName(name, value),
            (_name, defaultValue) => {
                this.pushRequestedOutputCount(1);
                try {
                    return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(defaultValue, functionScope));
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
            this.interpreter!.registerNestedFunctions(func, functionScope);
            this.interpreter!.validateFunctionInputArguments(func, functionScope);
            this.interpreter!.validateFunctionRepeatingArguments(func, functionScope, evaluatedArgs.slice(inputLayout.positionalParamCount));
            try {
                if (func.statements.list.length > 0) {
                    this.interpreter!.Evaluator(func.statements, functionScope);
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
    public callClassInstanceMethod(instance: ClassInstance, method: ClassMethodDefinition, args: NodeExpr[], parent: NodeInput): NodeExpr {
        if (method.isAbstract) {
            this.throwEvalError(`cannot call abstract method '${method.name}' for class ${method.classDefinition.name}.`);
        }
        if (method.node.attributes?.prototype) {
            this.throwEvalError(`method '${method.name}' for class ${method.classDefinition.name} is declared without a body.`);
        }
        try {
            ClassInstance.throwIfDeleted(instance);
        } catch (e: unknown) {
            this.throwEvalError((e as Error).message);
        }
        return this.withClassAccess(method.classDefinition, () =>
            this.callFunctionDefinition(Callables.functionDefinition(method.node), [ClassInstance.methodArgument(instance) as NodeExpr, ...args], parent, this.requestedOutputCount),
        );
    }

    /**
     * Call a static class method with class access enabled.
     *
     * @param method Static method metadata.
     * @param args Method argument expressions.
     * @param parent Call-site node used for stack traces.
     * @returns Method return expression or return list.
     */
    public callClassStaticMethod(method: ClassMethodDefinition, args: NodeExpr[], parent: NodeInput): NodeExpr {
        if (method.isAbstract) {
            this.throwEvalError(`cannot call abstract method '${method.name}' for class ${method.classDefinition.name}.`);
        }
        if (method.node.attributes?.prototype) {
            this.throwEvalError(`method '${method.name}' for class ${method.classDefinition.name} is declared without a body.`);
        }
        return this.withClassAccess(method.classDefinition, () => this.callFunctionDefinition(Callables.functionDefinition(method.node), args, parent, this.requestedOutputCount));
    }

    private callClassEmptyMethod(emptyMethod: ClassEmptyMethod, args: NodeExpr[], parent: NodeInput): MultiArray {
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

    private callClassBoundMethodArray(expr: MultiArray, args: NodeExpr[], parent: NodeInput): NodeExpr {
        const result = new MultiArray(expr.dimension);
        for (let n = 0; n < MultiArray.linearLength(expr); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(expr.dimension[0], expr.dimension[1], n);
            const boundMethod = expr.array[i][j] as ClassBoundMethod;
            this.pushRequestedOutputCount(1);
            try {
                result.array[i][j] = AST.reduceToFirstIfReturnList(this.callClassInstanceMethod(boundMethod.instance, boundMethod.method, args, parent));
            } finally {
                this.popRequestedOutputCount();
            }
        }
        MultiArray.setType(result);
        if (this.requestedOutputCount > 1) {
            const values = MultiArray.linearize(result);
            return AST.nodeReturnList(
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
                        out[`out${index}`] = values[index] as NodeExpr;
                    }
                    return out;
                },
            );
        }
        return MultiArray.MultiArrayToScalar(result) as NodeExpr;
    }

    private callFunctionalClassMethodArray(name: string, receiver: MultiArray, args: NodeExpr[], parent: NodeInput): NodeExpr {
        if (!MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item))) {
            this.throwUndefinedReferenceError(name);
        }
        const result = new MultiArray(receiver.dimension);
        for (let n = 0; n < MultiArray.linearLength(receiver); n++) {
            const [i, j] = MultiArray.linearIndexToMultiArrayRowColumn(receiver.dimension[0], receiver.dimension[1], n);
            const instance = receiver.array[i][j] as ClassInstance;
            if (name === 'delete') {
                result.array[i][j] = this.deleteClassInstance(instance, parent);
                continue;
            }
            const method = instance.classDefinition.findMethod(name, (item) => !item.isStatic);
            if (!method) {
                this.throwEvalError(`unknown method '${name}' for class ${instance.classDefinition.name}.`);
            }
            if (!this.canAccessClassMember(method.classDefinition, method.access)) {
                this.throwEvalError(`method '${name}' has ${method.access} access for class ${instance.classDefinition.name}.`);
            }
            this.pushRequestedOutputCount(1);
            try {
                result.array[i][j] = AST.reduceToFirstIfReturnList(this.callClassInstanceMethod(instance, method, args, parent));
            } finally {
                this.popRequestedOutputCount();
            }
        }
        MultiArray.setType(result);
        if (this.requestedOutputCount > 1) {
            const values = MultiArray.linearize(result);
            return AST.nodeReturnList(
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
                        out[`out${index}`] = values[index] as NodeExpr;
                    }
                    return out;
                },
            );
        }
        return MultiArray.MultiArrayToScalar(result) as NodeExpr;
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

    private evaluateFunctionalClassMethodReceiver(args: NodeExpr[], parent: NodeInput): NodeInput | undefined {
        if (args.length === 0) {
            return undefined;
        }
        const receiverExpression = args[0];
        if (!this.interpreter) {
            return receiverExpression;
        }
        receiverExpression.parent = parent;
        receiverExpression.index = 0;
        this.pushRequestedOutputCount(1);
        let receiver: NodeInput;
        try {
            receiver = AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(receiverExpression, this.currentScope));
        } finally {
            this.popRequestedOutputCount();
        }
        return receiver;
    }

    private isFunctionalClassMethodReceiver(receiver: NodeInput | undefined): boolean {
        return (
            ClassInstance.isInstanceOf(receiver) ||
            ClassEventListener.isInstanceOf(receiver) ||
            (MultiArray.isInstanceOf(receiver) && MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item)))
        );
    }

    private callFunctionalClassMethod(name: string, args: NodeExpr[], parent: NodeInput, receiver = this.evaluateFunctionalClassMethodReceiver(args, parent)): NodeExpr {
        if (!receiver) {
            this.throwUndefinedReferenceError(name);
        }
        if (name === 'delete' && ClassEventListener.isInstanceOf(receiver)) {
            ClassEventListener.delete(receiver);
            return AST.nodeVoid();
        }
        if (MultiArray.isInstanceOf(receiver) && MultiArray.linearize(receiver).every((item) => ClassInstance.isInstanceOf(item))) {
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
    callCallable(callable: Callable, args: NodeExpr[], parent: NodeInput): NodeExpr {
        const requestedOutputCount = this.requestedOutputCount;
        switch (callable.type) {
            case 'BUILTIN': {
                const node = callable.node;
                const alias = this.aliasNameFunction(node.id);
                const evaluatedArgs =
                    (node.id === 'feval' || node.id === 'builtin') && args.length > 0
                        ? [this.evaluateArgs([args[0]], parent, 'all')[0], ...args.slice(1)]
                        : this.evaluateArgs(args, parent, node.ev);
                this.validateBuiltInInputArity(node, evaluatedArgs.length);
                /* Push a frame before entering the built-in so errors can capture this call. */
                this.pushCallStackFrame(new CallFrame(this.currentScope, callable, this.resolveCallSite(parent), node.id, evaluatedArgs.length, requestedOutputCount, args));
                try {
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
                            return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
                        } finally {
                            this.popRequestedOutputCount();
                        }
                    },
                );
                this.pushCallStackFrame(new CallFrame(lambdaScope, callable, this.resolveCallSite(parent), FunctionHandle.toString(lambda), callArgs.length, requestedOutputCount, args));
                try {
                    const result = this.interpreter!.Evaluator(lambda.expression, lambdaScope);
                    return result;
                } finally {
                    this.popCallStackFrame();
                }
            }
            case 'FCNDEF': {
                return this.callFunctionDefinition(callable, args, parent, requestedOutputCount);
            }
            default:
                throw new Error('Invalid callable.');
        }
    }

    private valueReturnList(values: NodeInput[]): NodeReturnList {
        const result = AST.nodeReturnList(
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
                    out[`out${index}`] = values[index] as NodeExpr;
                }
                return out;
            },
        );
        result.commaSeparated = true;
        result.returnListLength = values.length;
        return result;
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
    public resolveCallDispatch(expr: NodeExpr, parent: NodeInput, args: NodeExpr[] = []): CallDispatch {
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
        if (MultiArray.isInstanceOf(expr) && MultiArray.linearize(expr).every((item) => ClassBoundMethod.isInstanceOf(item))) {
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
    private applyCallDispatch(dispatch: CallDispatch, args: NodeExpr[], parent: NodeInput): NodeExpr | undefined {
        switch (dispatch.kind) {
            case 'callable':
                return this.callCallable(dispatch.callable!, args, parent);
            case 'bound-method':
                return this.callClassInstanceMethod((dispatch.expr as ClassBoundMethod).instance, (dispatch.expr as ClassBoundMethod).method, args, parent);
            case 'bound-method-array':
                return this.callClassBoundMethodArray(dispatch.expr as MultiArray, args, parent);
            case 'static-method':
                return this.callClassStaticMethod((dispatch.expr as ClassStaticMethod).method, args, parent);
            case 'empty-method':
                return this.callClassEmptyMethod(dispatch.expr as ClassEmptyMethod, args, parent);
            case 'constructor':
                return this.constructClassInstance(dispatch.expr as ClassDefinition, args, parent);
            case 'functional-class-method':
                return this.callFunctionalClassMethod(dispatch.functionalName!, args, parent, dispatch.functionalReceiver);
            case 'undefined-function':
                this.throwUndefinedReferenceError(dispatch.functionalName!);
            case 'indexing':
                return undefined;
        }
    }

    private charStringIndexArray(value: CharString): MultiArray {
        const result = new MultiArray(value.dimension);
        result.array[0] = value.toCharacterScalars();
        MultiArray.setType(result);
        return result;
    }

    private charStringIndexResult(value: NodeExpr, quote: CharString['quote']): CharString {
        const selected = MultiArray.isInstanceOf(value) ? MultiArray.linearize(value) : [value];
        if (!selected.every((item) => CharString.isInstanceOf(item))) {
            this.throwEvalError('character string indexing produced a non-character value.');
        }
        return CharString.fromCharacterScalars(selected as CharString[], quote);
    }

    /**
     * Apply native MATLAB/Octave indexing after call dispatch declines.
     *
     * @param expr Evaluated indexed expression.
     * @param args Raw index expressions.
     * @param parent Index expression node carrying delimiter metadata.
     * @returns Indexed value or comma-separated return list.
     */
    private applyNativeIndexing(expr: NodeExpr, args: NodeExpr[], parent: NodeInput): NodeExpr {
        if (CharString.isInstanceOf(expr)) {
            if (parent.delim === '{}') {
                this.throwEvalError('matrix cannot be indexed with {');
            }
            const array = this.charStringIndexArray(expr);
            const evaluatedArgs = this.evaluateArgs(args, parent, 'all');
            const result = MultiArray.getElements(array, parent.expr.id, [], evaluatedArgs);
            result!.parent = parent;
            return this.charStringIndexResult(result, expr.quote);
        }
        if (parent.delim === '{}' && !(MultiArray.isInstanceOf(expr) && expr.isCell)) {
            this.throwEvalError('matrix cannot be indexed with {');
        }
        const array = MultiArray.scalarOrCellToMultiArray(expr);
        const evaluatedArgs = this.evaluateArgs(args, parent, 'all');
        const result = MultiArray.getElements(array, parent.expr.id, [], evaluatedArgs);
        result!.parent = parent;
        if (array.isCell && parent.delim === '()') {
            (result as MultiArray).isCell = true;
            return result;
        }
        if (array.isCell && parent.delim === '{}' && (this.requestedOutputCount > 1 || this.commaListExpansionEnabled)) {
            const values = MultiArray.linearize(result);
            if (values.length > 1) {
                return this.valueReturnList(values as NodeInput[]);
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
    apply(expr: NodeExpr, args: NodeExpr[], parent: NodeInput): NodeExpr {
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
        if (this.interpreter!.debug) {
            console.log('[DISPATCH]', dispatch.kind, dispatch.callable?.type ?? '');
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
                    this.throwEvalError(`Invalid call to ${name}. Type 'help ${name}' to see correct usage.`);
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
