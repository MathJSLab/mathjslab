/**
 * MATLAB®/Octave like syntax parser/interpreter/compiler.
 */

import { CharStreams, CommonTokenStream, DiagnosticErrorListener, PredictionMode } from 'antlr4';

import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';
import { LexerErrorListener } from './LexerErrorListener';
import { ParserErrorListener } from './ParserErrorListener';
import type {
    OperatorType,
    NodeInput,
    NodeExpr,
    NodeIdentifier,
    NodeIndexExpr,
    ReturnHandlerResult,
    NodeReturnList,
    NodeType,
    NodeFunctionDefinition,
    NodeBuiltInFunction,
    NodeArgumentValidation,
    BuiltInFunctionInputSignature,
    BuiltInFunctionSignature,
    NameEntry,
    AliasNameTable,
    BuiltInFunctionTable,
    CommandWordListTable,
} from './AST';
import { AST, CharString, Complex, ComplexType, MultiArray, Structure, FunctionHandle } from './AST';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, KeyOfTypeOfMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { substSymbol } from './substSymbol';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import { Configuration } from './Configuration';
import { MathML } from './MathML';
import { FunctionValidation } from './FunctionValidation';
import { FunctionSignature } from './FunctionSignature';
import { FunctionArguments } from './FunctionArguments';
import { FunctionArity } from './FunctionArity';
import { FunctionCall } from './FunctionCall';
import { FunctionStack } from './FunctionStack';
import { FunctionWorkspace } from './FunctionWorkspace';
import { FunctionIntrospection } from './FunctionIntrospection';
import { FunctionLookup } from './FunctionLookup';
import { Scope } from './Scope';
import { CallFrame } from './CallFrame';
import { Callables, type Callable, type FunctionDefinitionCallable } from './Callable';

/**
 * `response` type
 */
type ExitStatus = number;
type ExitStatusValues = Record<string, ExitStatus>;

/**
 * # InterpreterError
 *
 * Base class for all evaluation-related errors.
 *
 * This class extends the native `Error` and adds optional
 * support for stack trace frames (`CallFrame[]`), enabling
 * MATLAB/Octave-like error reporting.
 *
 * ---
 *
 * ## Design Goals
 *
 * - Backward compatible with existing `throw new Error(...)`
 * - Allows incremental adoption of stack traces
 * - Provides a unified error hierarchy
 *
 * ---
 *
 * ## Notes
 *
 * - `stackFrames` is optional to support legacy code paths
 * - Formatting is deferred to `toString()` / `format()`
 */
class InterpreterError extends Error {
    /**
     * Optional call stack snapshot.
     *
     * Top frame should be the first element.
     */
    public readonly stackFrames?: CallFrame[];

    /**
     * Creates a new InterpreterError.
     *
     * @param message - Error message
     * @param stackFrames - Optional stack trace snapshot
     */
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message);
        this.name = 'InterpreterError';
        this.stackFrames = stackFrames;
    }

    /**
     * Formats the error message with optional stack trace.
     *
     * @returns Formatted error string
     */
    public format(): string {
        let result = `Error: ${this.message}`;

        if (!this.stackFrames || this.stackFrames.length === 0) {
            return result;
        }

        const lines: string[] = [];

        for (const frame of this.stackFrames) {
            const name = this.getFrameName(frame);

            // Skip the synthetic global frame and anonymous frames that do not help users locate the error.
            if (!name || name === '<anonymous>') continue;

            let lineInfo = '';

            const site = frame.callSite;

            if (site?.start) {
                const { line, column } = site.start;

                if (line !== undefined && column !== undefined) {
                    lineInfo = ` (line ${line}, column ${column})`;
                } else if (line !== undefined) {
                    lineInfo = ` (line ${line})`;
                }
            }

            lines.push(`Error in ${name}${lineInfo}`);
        }

        if (lines.length > 0) {
            result += '\n' + lines.join('\n');
        }

        return result;
    }

    /**
     * Derives a human-readable name for a frame.
     */
    protected getFrameName(frame: CallFrame): string {
        if (frame.name) return frame.name;

        const func = frame.func;

        if (!func) return '';

        switch (func.type) {
            case 'BUILTIN':
                return func.node.id ?? '<builtin>';

            case 'LAMBDA':
                return '<anonymous>';

            case 'FCNDEF':
                return func.node.id ?? '<function>';

            default:
                return '<unknown>';
        }
    }

    /**
     * Default string representation.
     */
    public toString(): string {
        return this.format();
    }
}

/**
 * # EvalError
 *
 * Represents a general runtime evaluation error.
 *
 * Examples:
 * - invalid operations
 * - domain errors
 */
class EvalError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'EvalError';
    }
}

/**
 * # ReferenceError
 *
 * Represents errors related to undefined identifiers.
 *
 * Examples:
 * - undefined variable
 * - undefined function
 */
class ReferenceError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'ReferenceError';
    }
}

/**
 * # UndefinedReferenceError
 *
 * Represents an unresolved identifier that may be registered as a
 * forward reference when the current evaluation mode allows it.
 */
class UndefinedReferenceError extends ReferenceError {
    public constructor(
        public readonly identifier: string,
        stackFrames?: CallFrame[],
    ) {
        super(`'${identifier}' undefined.`, stackFrames);
        this.name = 'UndefinedReferenceError';
    }
}

/**
 * # CircularReferenceError
 *
 * Represents a circular dependency between unresolved forward references.
 */
class CircularReferenceError extends InterpreterError {
    public constructor(
        public readonly chain: string[],
        stackFrames?: CallFrame[],
    ) {
        super(`Circular reference detected: ${chain.join(' → ')}`, stackFrames);
        this.name = 'CircularReferenceError';
    }
}

/**
 * # SyntaxError
 *
 * Represents syntax-related errors detected during parsing or preprocessing.
 */
class SyntaxError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'SyntaxError';
    }
}

class ReturnSignal extends Error {
    public constructor() {
        super('return');
        this.name = 'ReturnSignal';
    }
}

class Context {
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
        public interpreter?: Interpreter,
        /**
         * Global scope.
         */
        public globalScope?: Scope,
        /**
         * Function call stack.
         */
        public callStack: CallFrame[] = [],
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
    public static readonly create = (interpreter?: Interpreter, globalScope?: Scope, callStack?: CallFrame[]): Context => new Context(interpreter, globalScope, callStack);
    /**
     * Native constants inserted into the global name table during interpreter loading.
     */
    public nativeNameTable: Record<string, ComplexType>;
    /**
     * Names provided by {@link nativeNameTable}.
     */
    public nativeNameTableList: string[];
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
    public resolveFunction(name: string): NodeFunctionDefinition | NodeBuiltInFunction | undefined {
        const canonical = this.aliasNameFunction(name);
        const func = this.currentScope.resolveFunction(canonical);
        if (func) return func;
        return this.builtInFunctionTable[canonical];
    }
    public assignName(name: string, value: NodeInput) {
        this.currentScope.defineName(name, value);
    }
    public assignFunction(name: string, func: NodeFunctionDefinition) {
        this.currentScope.defineFunction(name, func);
    }
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
        if (record.type === 'IDENT' && typeof record.id === 'string') {
            const entry = scope.resolveName(record.id);
            if (entry?.undefinedReference || (!entry && record.id === fallback)) {
                return record.id;
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
    public resolveCallable(expr: NodeExpr): Callable | undefined {
        /* Function handles may point to named functions or inline lambda bodies. */
        if (FunctionHandle.isInstanceOf(expr)) {
            /* Named handle, for example `@sin`. */
            if (expr.id) {
                const canonical = this.aliasNameFunction(expr.id);
                const func = expr.closure?.resolveFunction(canonical) ?? this.resolveFunction(expr.id);
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
    public resolveIdentifier(tree: NodeInput, scope: Scope): NodeExpr {
        const name = tree.id;
        /* 1. Variable lookup. */
        const entry = scope.resolveName(name);
        if (entry && entry.node) {
            if (this.allowForwardReference && entry.undefinedReference) {
                this.throwIfCircularReference(name, scope);
                this.throwUndefinedReferenceError(entry.undefinedReference);
            }
            entry.node.parent = tree;
            return entry.node;
        }
        /* 2. Function call-frame metadata. */
        if (name === 'nargin' && !(tree.parent && tree.parent.type === 'IDX')) {
            return this.currentFunctionArgumentCount(name);
        }
        if (name === 'nargout' && !(tree.parent && tree.parent.type === 'IDX')) {
            return this.currentFunctionOutputCount(name);
        }
        /* 3. Function lookup. */
        const func = this.resolveFunction(name);
        if (func) {
            /* A function name may be converted to a handle when it is being called. */
            if (tree.parent && tree.parent.type === 'IDX') {
                const handle = FunctionHandle.create(name);
                handle.parent = tree;
                return handle;
            }
            /* Otherwise a bare function name is an invalid MATLAB-like call. */
            AST.throwInvalidCallError(name, true, (message) => this.throwSyntaxError(message));
        }
        /* 4. Undefined identifier. */
        this.throwUndefinedReferenceError(name);
    }
    private evaluateArgs(args: NodeExpr[], parent: NodeInput, mode: 'all' | boolean[]): NodeExpr[] {
        return args.map((arg: NodeExpr, i: number) => {
            arg.parent = parent;
            arg.index = i;
            if (mode === 'all') {
                this.pushRequestedOutputCount(1);
                try {
                    return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
                } finally {
                    this.popRequestedOutputCount();
                }
            }
            const ev = mode;
            if (ev.length > 0 && i < ev.length && !ev[i]) {
                return arg;
            }
            this.pushRequestedOutputCount(1);
            try {
                return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
            } finally {
                this.popRequestedOutputCount();
            }
        });
    }
    public throwEvalError(message: string): never {
        throw new EvalError(message, this.getStackTrace());
    }
    public throwReferenceError(message: string): never {
        throw new ReferenceError(message, this.getStackTrace());
    }
    public throwUndefinedReferenceError(identifier: string): never {
        throw new UndefinedReferenceError(identifier, this.getStackTrace());
    }
    public throwCircularReferenceError(chain: string[]): never {
        throw new CircularReferenceError(chain, this.getStackTrace());
    }
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
    public resolveWorkspace(name: string, forAssignment = false): Scope {
        return FunctionWorkspace.resolveWorkspace(name, this.globalScope!, this.getCallerWorkspace(forAssignment), (message) => this.throwSyntaxError(message)) as Scope;
    }
    public currentFunctionArgumentCount(name: 'nargin' | 'nargout'): ComplexType {
        const count = FunctionStack.currentArgumentCount(this.callStack);
        if (typeof count === 'undefined') {
            this.throwEvalError(`${name} is only valid inside a function.`);
        }
        return Complex.create(count);
    }
    public currentFunctionArgumentCountOrZero(): ComplexType {
        return Complex.create(FunctionStack.currentArgumentCount(this.callStack) ?? 0);
    }
    public currentFunctionOutputCount(name: 'nargin' | 'nargout'): ComplexType {
        const count = FunctionStack.currentOutputCount(this.callStack);
        if (typeof count === 'undefined') {
            this.throwEvalError(`${name} is only valid inside a function.`);
        }
        return Complex.create(count);
    }
    public currentFunctionOutputCountOrZero(): ComplexType {
        return Complex.create(FunctionStack.currentOutputCount(this.callStack) ?? 0);
    }
    public currentFunctionInputName(indexNode: NodeInput): CharString {
        const frame = this.getCurrentFunctionCountFrame();
        if (!frame) {
            this.throwEvalError('inputname is only valid inside a function.');
        }
        return FunctionWorkspace.inputName(frame.inputArgs, indexNode, (message) => this.throwSyntaxError(message));
    }
    public currentFunctionName(): string {
        return FunctionStack.currentFunctionName(this.callStack);
    }
    public declarePersistent(name: string, value: NodeInput | undefined, scope: Scope): void {
        const func = this.getCurrentFunctionDefinition();
        if (!func) {
            this.throwSyntaxError('persistent declaration is only valid inside a function.');
        }
        FunctionWorkspace.declarePersistent(name, value, func, scope);
    }
    public loadPersistentVariables(func: NodeFunctionDefinition, scope: Scope): void {
        FunctionWorkspace.loadPersistentVariables(func, scope);
    }
    public storePersistentVariables(func: NodeFunctionDefinition, scope: Scope): void {
        FunctionWorkspace.storePersistentVariables(func, scope);
    }
    public declareGlobal(name: string, value: NodeInput | undefined, scope: Scope): void {
        FunctionWorkspace.declareGlobal(name, value, this.globalNameSet, this.globalScope!.nameTable, scope.nameTable);
    }
    public clearGlobalVariables(): void {
        FunctionWorkspace.clearGlobalVariables(
            this.globalNameSet,
            this.globalScope,
            this.callStack.map((frame) => frame.scope),
        );
    }
    private resolveCallSite(node: NodeInput | undefined): NodeExpr | undefined {
        let current: any = node;
        while (current) {
            if (current.start) return current;
            current = current.parent;
        }
        return undefined;
    }
    public builtInInputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        return FunctionSignature.inputSignatures(node);
    }
    public builtInOutputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        return FunctionSignature.outputSignatures(node);
    }
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
        return MultiArray.isInstanceOf(value) ? (value as MultiArray).dimension.slice() : [1, 1];
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
            inputDefaults: (item) => this.interpreter!.getFunctionInputArgumentDefaults(item),
            throwEvalError: (message) => this.throwEvalError(message),
        });
        /* Create a function scope, preserving the definition scope when available. */
        const functionScope = Scope.create(func.definingScope ?? this.currentScope);
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
        this.pushCallStackFrame(new CallFrame(functionScope, callable, this.resolveCallSite(parent), func.id, args.length, requestedOutputCount, args));
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

    callCallable(callable: Callable, args: NodeExpr[], parent: NodeInput): NodeExpr {
        const requestedOutputCount = this.requestedOutputCount;
        switch (callable.type) {
            case 'BUILTIN': {
                const node = callable.node;
                const alias = this.aliasNameFunction(node.id);
                this.validateBuiltInInputArity(node, args.length);
                const evaluatedArgs =
                    (node.id === 'feval' || node.id === 'builtin') && args.length > 0
                        ? [this.evaluateArgs([args[0]], parent, 'all')[0], ...args.slice(1)]
                        : this.evaluateArgs(args, parent, node.ev);
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
                const params = lambda.parameter as NodeIdentifier[];
                const { hasVarargin, fixedParamCount } = FunctionCall.lambdaInputLayout(params);
                FunctionCall.validateLambdaInputArity(args.length, hasVarargin, fixedParamCount, (message) => this.throwEvalError(message));
                const lambdaScope = Scope.create(lambda.closure ?? this.currentScope);
                FunctionCall.bindLambdaInputs(
                    params,
                    args,
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
                this.pushCallStackFrame(new CallFrame(lambdaScope, callable, this.resolveCallSite(parent), FunctionHandle.toString(lambda), args.length, requestedOutputCount, args));
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
    apply(expr: NodeExpr, args: NodeExpr[], parent: NodeInput): NodeExpr {
        /* Debug-only structural trace for call/index dispatch. */
        if (this.interpreter!.debug) {
            console.log('[APPLY]', {
                exprType: expr?.type,
                isFunctionHandle: FunctionHandle.isInstanceOf(expr),
                exprId: (expr as any)?.id,
                delim: parent.delim,
                argsCount: args.length,
            });
        }
        /* First try function-call semantics. */
        const callable = this.resolveCallable(expr);
        if (this.interpreter!.debug) {
            console.log('[CALLABLE]', callable?.type ?? 'NONE');
        }
        /* A function handle should have resolved to a callable by this point. */
        if (!callable && FunctionHandle.isInstanceOf(expr)) {
            throw new Error('Unexpected non-callable FunctionHandle.');
        }
        if (callable) {
            return this.callCallable(callable, args, parent);
        }
        /* Fall back to indexing when the expression is not callable. */
        if (this.interpreter!.debug) {
            console.warn('[FALLBACK → INDEX]', {
                exprType: expr?.type,
                exprId: (expr as any)?.id,
            });
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
        return MultiArray.MultiArrayToScalar(result);
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

/**
 * InterpreterConfig type.
 */
type InterpreterConfig = {
    aliasNameTable?: AliasNameTable;
    externalFunctionTable?: BuiltInFunctionTable;
    externalCmdWListTable?: CommandWordListTable;
};

/**
 * Increment and decrement operator handler type.
 */
type IncDecOperator = (tree: NodeIdentifier) => MathObject;

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
    UnparseMathML(tree: NodeInput, display: 'inline' | 'block'): string;
    ToMathML(input: string, display: 'inline' | 'block'): string;
}

/**
 * `Interpreter` object.
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
                    return this.functions.which(value);
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
            target = source.startsWith('@') ? this.functions.str2func(arg) : FunctionHandle.create(source);
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
        return FunctionLookup.existCode(name, kind, this.context.resolveName(name), this.context.resolveFunction(name));
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
        return FunctionLookup.whichResult(name, this.context.resolveName(name), func, handle, (item) => FunctionHandle.unparse(item, this));
    }

    private valueIsRuntimeClass(value: NodeInput, className: string): boolean {
        switch (className) {
            case 'double':
            case 'char':
            case 'cell':
            case 'struct':
            case 'function_handle':
                return this.getValueClassName(value) === className;
            default:
                return false;
        }
    }

    private readonly interpreterFunctionSignatures: Record<string, BuiltInFunctionSignature> = {
        unparse: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        class: { inputs: { arity: 1 }, outputs: { arity: 1 } },
        isa: { inputs: { arity: 2, parameters: [{ name: 'value' }, { name: 'className', classes: ['char'] }] }, outputs: { arity: 1 } },
        mfilename: {
            inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'option', classes: ['char'], allowedStrings: ['fullpath', 'class'], optional: true }] },
            outputs: { arity: 1 },
        },
        dbstack: {
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
        exist: {
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
        which: { inputs: { arity: 1, parameters: [{ name: 'name', classes: ['char', 'function_handle'] }] }, outputs: { arity: 1 } },
        func2str: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        str2func: { inputs: { arity: 1, parameters: [{ name: 'source', classes: ['char'] }] }, outputs: { arity: 1 } },
        builtin: {
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
        feval: {
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
        functions: { inputs: { arity: 1, parameters: [{ name: 'functionHandle', classes: ['function_handle'] }] }, outputs: { arity: 1 } },
        localfunctions: { inputs: { arity: 0 }, outputs: { arity: 1 } },
        nargin: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
        narginchk: {
            inputs: {
                arity: 2,
                parameters: [
                    { name: 'min', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'max', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'integer', 'nonnegative'], allowInfinity: true },
                ],
            },
            outputs: { arity: 0 },
        },
        nargout: { inputs: { arity: -1, min: 0, max: 1, parameters: [{ name: 'function', classes: ['char', 'function_handle'], optional: true }] }, outputs: { arity: 1 } },
        nargoutchk: {
            inputs: {
                arity: 2,
                parameters: [
                    { name: 'min', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative'] },
                    { name: 'max', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'integer', 'nonnegative'], allowInfinity: true },
                ],
            },
            outputs: { arity: 0 },
        },
        inputname: {
            inputs: { arity: 1, parameters: [{ name: 'argumentNumber', classes: ['double'], validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'positive'] }] },
            outputs: { arity: 1 },
        },
        eval: {
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
        evalin: {
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
        assignin: {
            inputs: {
                arity: 3,
                parameters: [{ name: 'workspace', classes: ['char'], allowedStrings: ['base', 'caller'] }, { name: 'name', classes: ['char'], identifier: true }, { name: 'value' }],
            },
            outputs: { arity: 0 },
        },
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
        log2: { inputs: { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] }, outputs: { arity: 1 } },
        log10: { inputs: { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] }, outputs: { arity: 1 } },
        factorial: { inputs: { arity: 1, parameters: [{ name: 'value', classes: ['double'] }] }, outputs: { arity: 1 } },
    };

    private readonly functions: Record<string, Function> = {
        unparse: (tree: NodeInput): CharString => new CharString(this.Unparse(tree)),
        class: (...args: NodeInput[]): CharString => {
            return new CharString(this.getValueClassName(args[0]));
        },
        isa: (...args: NodeInput[]): ComplexType => {
            return this.valueIsRuntimeClass(args[0], (args[1] as CharString).str) ? Complex.true() : Complex.false();
        },
        mfilename: (...args: NodeInput[]): CharString => {
            if (args.length === 1 && (args[0] as CharString).str === 'class') {
                return new CharString('');
            }
            return new CharString(this.context.currentFunctionName());
        },
        dbstack: (...args: NodeInput[]): MultiArray => {
            return this.dbstackResult(args);
        },
        exist: (...args: NodeInput[]): ComplexType => {
            return Complex.create(this.existCode((args[0] as CharString).str, args.length === 2 ? (args[1] as CharString).str : undefined));
        },
        which: (...args: NodeInput[]): CharString => {
            if (FunctionHandle.isInstanceOf(args[0])) {
                const handle = args[0] as FunctionHandle;
                return this.whichResult(handle.id ?? FunctionHandle.unparse(handle, this).trim(), handle);
            }
            return this.whichResult((args[0] as CharString).str);
        },
        func2str: (...args: NodeInput[]): CharString => {
            return FunctionLookup.func2str(args[0] as FunctionHandle, (handle) => FunctionHandle.unparse(handle, this));
        },
        str2func: (...args: NodeInput[]): FunctionHandle => {
            return FunctionLookup.str2func(
                (args[0] as CharString).str,
                (source) => {
                    const evaluated = AST.reduceToFirstIfReturnList(this.Evaluator(this.Parse(source), this.context.currentScope));
                    return evaluated.type === 'LIST' && evaluated.list.length === 1 ? evaluated.list[0] : evaluated;
                },
                (message) => this.context.throwEvalError(message),
            );
        },
        builtin: (...args: NodeInput[]): NodeExpr => {
            const source = (args[0] as CharString).str.trim();
            const canonical = this.context.aliasNameFunction(source);
            const builtin = this.context.builtInFunctionTable[canonical];
            if (!builtin) {
                this.context.throwEvalError(`builtin: '${source}' is not a built-in function.`);
            }
            return this.context.callCallable(Callables.builtin(builtin), args.slice(1) as NodeExpr[], AST.nodeIdentifier('builtin'));
        },
        feval: (...args: NodeInput[]): NodeExpr => {
            let target = args[0] as NodeExpr;
            if (CharString.isInstanceOf(target)) {
                const source = target.str.trim();
                target = source.startsWith('@') ? this.functions.str2func(target) : FunctionHandle.create(source);
            }
            const callable = this.context.resolveCallable(target);
            if (!callable) {
                this.context.throwEvalError('feval: first argument must be a function handle or function name.');
            }
            return this.context.callCallable(callable, args.slice(1) as NodeExpr[], AST.nodeIdentifier('feval'));
        },
        functions: (...args: NodeInput[]): Structure => {
            return FunctionLookup.functionsInfo(
                args[0] as FunctionHandle,
                (name) => this.context.aliasNameFunction(name),
                (name) => this.context.resolveFunction(name),
                (handle) => FunctionHandle.unparse(handle, this),
            );
        },
        localfunctions: (...args: NodeInput[]): MultiArray => {
            return this.localFunctionHandles();
        },
        nargin: (...args: NodeInput[]): ComplexType => {
            return args.length === 0 ? this.context.currentFunctionArgumentCount('nargin') : Complex.create(this.functionArgumentArity(this.functionArityCallable('nargin', args[0])));
        },
        narginchk: (...args: NodeInput[]): NodeInput => {
            return this.checkFunctionCount('narginchk', args[0], args[1]);
        },
        nargout: (...args: NodeInput[]): ComplexType => {
            return args.length === 0 ? this.context.currentFunctionOutputCount('nargout') : Complex.create(this.functionOutputArity(this.functionArityCallable('nargout', args[0])));
        },
        nargoutchk: (...args: NodeInput[]): NodeInput => {
            return this.checkFunctionCount('nargoutchk', args[0], args[1]);
        },
        inputname: (...args: NodeInput[]): CharString => {
            return this.context.currentFunctionInputName(args[0]);
        },
        eval: (...args: NodeInput[]): NodeInput => {
            return FunctionWorkspace.evaluateWithCatch(this.context.currentScope, (args[0] as CharString).str, args.length === 2 ? (args[1] as CharString).str : undefined, (source, scope) =>
                this.evalStringInScope(source, scope as Scope),
            );
        },
        evalin: (...args: NodeInput[]): NodeInput => {
            const scope = this.context.resolveWorkspace((args[0] as CharString).str);
            return FunctionWorkspace.evaluateWithCatch(scope, (args[1] as CharString).str, args.length === 3 ? (args[2] as CharString).str : undefined, (source, itemScope) =>
                this.evalStringInScope(source, itemScope as Scope),
            );
        },
        assignin: (...args: NodeInput[]): NodeInput => {
            return FunctionWorkspace.assignIn(this.context.resolveWorkspace((args[0] as CharString).str, true), (args[1] as CharString).str, args[2]);
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
        this.context.nativeNameTableList = Object.keys(this.context.nativeNameTable);
        this.context.globalScope!.defineNameTable(this.context.nativeNameTable);
        /* Define Interpreter functions */
        for (const func in this.functions) {
            this.context.defineBuiltInFunction(func, this.functions[func], false, [], this.interpreterFunctionSignatures[func]);
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
            this.context.defineBuiltInFunction(func, Complex.mapFunction[func], true, [], this.interpreterFunctionSignatures[func] ?? complexMapFunctionSignature);
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
        for (const func in Complex.twoArgFunction) {
            this.context.defineBuiltInFunction(func, Complex.twoArgFunction[func], false, [], this.interpreterFunctionSignatures[func] ?? complexTwoArgFunctionSignature);
        }
        /* Define Configuration functions */
        for (const func in Configuration.functions) {
            this.context.defineBuiltInFunction(func, Configuration.functions[func], false, [], Configuration.signatures[func]);
        }
        /* Define CoreFunctions functions */
        for (const func in CoreFunctions.functions) {
            this.context.defineBuiltInFunction(func, CoreFunctions.functions[func], false, [], CoreFunctions.signatures[func]);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.context.defineBuiltInFunction(func, LinearAlgebra.functions[func as keyof LinearAlgebra], false, [], LinearAlgebra.signatures[func]);
        }
        /* Load UnparserMathML for special functions */
        for (const func in this.unparseMathMLFunctions) {
            this.context.builtInFunctionTable[func].UnparserMathML = this.unparseMathMLFunctions[func];
        }
        if (config) {
            this.context.setAliasNameTable(config.aliasNameTable);
            this.context.assignBuiltInFunctionTable(config.externalFunctionTable);
            if (config.externalCmdWListTable) {
                Object.assign(this.commandWordListTable, config.externalCmdWListTable);
            }
        } else {
            this.context.aliasNameFunction = (name: string): string => name;
        }
    }

    /**
     * `Interpreter` object private constructor
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
     * Parse input string.
     * @param input String to parse.
     * @returns Abstract syntax tree of input.
     */
    public Parse(input: string): NodeInput {
        /* Give the lexer the input as a stream of characters. */
        const inputStream = CharStreams.fromString(input);
        const lexer = new MathJSLabLexer(inputStream);

        /* Set word-list commands in lexer. */
        lexer.commandNames = Object.keys(this.commandWordListTable);

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
     * Restart interpreter.
     */
    public Restart(): void {
        this.loadInterpreter();
    }

    /**
     * Clear variables/functions. When no names are provided, restart the interpreter.
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
                if (this.context.nativeNameTableList.includes(name)) {
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
    private validateAssignment(tree: NodeExpr, shallow: boolean, scope: Scope = this.context.currentScope): { id: string; index?: NodeExpr[]; field: string[] }[] {
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
                        field,
                    },
                ];
            } else {
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
            if (typeof scope.undefinedReferenceTable[id] !== 'undefined') {
                /* Remove duplicate and empty entries. */
                scope.undefinedReferenceTable[id] = scope.undefinedReferenceTable[id].filter((value, index, self) => value && self.indexOf(value) === index);
                /* Work on a copy while the table is updated. */
                let undefinedReferenceEntry = scope.undefinedReferenceTable[id].slice();
                /* References that became fully resolved in this pass. */
                const solvedReference: string[] = [];
                scope.undefinedReferenceTable[id].forEach((ref, index) => {
                    if (typeof scope.nameTable[ref] !== 'undefined') {
                        try {
                            scope.nameTable[ref].node = AST.reduceToFirstIfReturnList(this.Evaluator(scope.nameTable[ref].node, scope));
                            delete scope.nameTable[ref].undefinedReference;
                            undefinedReferenceEntry[index] = undefined as unknown as string;
                            solvedReference.push(ref);
                        } catch (e: unknown) {
                            if (e instanceof UndefinedReferenceError) {
                                undefinedReferenceEntry[index] = e.identifier;
                                scope.nameTable[ref].undefinedReference = e.identifier;
                            }
                        }
                    } else {
                        undefinedReferenceEntry[index] = undefined as unknown as string;
                    }
                });
                scope.undefinedReferenceTable[id] = undefinedReferenceEntry.filter((value) => value);
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
                    const handle = FunctionHandle.copy(tree);
                    handle.closure = scope.snapshot((node) => MathOperation.copy(node));
                    return handle;
                }
                return tree;
            } else if (Complex.isInstanceOf(tree) || CharString.isInstanceOf(tree) || Structure.isInstanceOf(tree)) {
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
                        tree.left.parent = tree;
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as BinaryMathOperation)(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, scope)),
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope)),
                        );
                    case '()':
                        tree.right.parent = tree;
                        return AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope));
                    case '!':
                    case '~':
                    case '+_':
                    case '-_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(AST.reduceToFirstIfReturnList(this.Evaluator(tree.right, scope)));
                    case '++_':
                    case '--_':
                        tree.right.parent = tree;
                        return (this.opTable[tree.type] as IncDecOperator)(tree.right);
                    case ".'":
                    case "'":
                        tree.left.parent = tree;
                        return (this.opTable[tree.type] as UnaryMathOperation)(AST.reduceToFirstIfReturnList(this.Evaluator(tree.left, scope)));
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
                            right = MathOperation.copy(this.Evaluator(tree.right, scope));
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
                            const { id, index, field } = assignment[n];
                            if (id !== '~') {
                                /* Apply one assignment target. */
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
                                        MultiArray.setElements(
                                            scope,
                                            id,
                                            field,
                                            index.map((arg: NodeExpr, i: number) => {
                                                arg.parent = tree.left;
                                                arg.index = i;
                                                return AST.reduceToFirstIfReturnList(this.Evaluator(arg));
                                            }),
                                            MultiArray.scalarToMultiArray(AST.reduceToFirstIfReturnList(this.Evaluator((right as NodeReturnList).selector(evaluated, n)))),
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
                                        if (this.context.allowForwardReference) {
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
                    case 'FCNDEF': {
                        const func = tree as NodeFunctionDefinition;
                        if (this.context.currentFrame?.func?.type === 'FCNDEF' && scope.hasLocalFunction(func.id)) {
                            return AST.nodeVoid();
                        }
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
                        const result = Structure.getFields(
                            AST.reduceToFirstIfReturnList(this.Evaluator(tree.obj, scope)),
                            tree.field.map((field: NodeExpr) => {
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
                            }),
                        );
                        if (result.length === 1) {
                            return result[0];
                        } else {
                            return AST.nodeList(result);
                        }
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
                            if (tree.list[i].type === 'IDENT' && !scope.resolveName(tree.list[i].id) && Object.keys(this.commandWordListTable).indexOf(tree.list[i].id) >= 0) {
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
                            if (MultiArray.isInstanceOf(expr)) {
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
                        tree.expr.parent = tree;
                        const expr = AST.reduceToFirstIfReturnList(this.Evaluator(tree.expr, scope));
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
                    default:
                        this.context.throwEvalError(`evaluating undefined type '${tree.type}'.`);
                }
            }
        } else {
            return null;
        }
    }

    /**
     * Evaluate expression `tree`.
     * @param tree Expression to evaluate.
     * @returns Expression `tree` evaluated.
     */
    public Evaluate(tree: NodeInput): NodeInput {
        try {
            this._exitStatus = Interpreter.response.OK;
            tree.parent = null;
            return this.Evaluator(tree);
        } catch (e) {
            this._exitStatus = Interpreter.response.EVAL_ERROR;
            throw e;
        }
    }

    /**
     * Executes the `Parse` and `Evaluate` methods on an input string, returning the computed result.
     * @param input String to parse and evaluate.
     * @returns Computed result of input.
     */
    public Execute(input: string): NodeInput {
        return this.Evaluate(this.Parse(input));
    }

    /**
     * Unparse expression `tree`.
     * @param tree Expression to unparse.
     * @returns Expression `tree` unparsed.
     */
    public Unparse(tree: NodeInput, parentPrecedence = 0): string {
        const declarationUnparse = (keyword: string, tree: NodeInput): string => keyword + ' ' + tree.list.map((node: NodeExpr) => this.Unparse(AST.getDeclarationNode(node))).join(' ');
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
                        case 'RETLIST':
                            return '<RETLIST>';
                        case 'CMDWLIST':
                            return (tree.id + ' ' + tree.args.map((arg: CharString) => this.Unparse(arg)).join(' ')).trimEnd();
                        case 'GLOBAL':
                            return declarationUnparse('global', tree);
                        case 'PERSIST':
                            return declarationUnparse('persistent', tree);
                        case 'RETURN':
                            return 'return';
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
                        case 'FCNDEF':
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
     * Unparse recursively expression tree generating MathML representation.
     * @param tree Expression tree.
     * @returns String of expression `tree` unparsed as MathML language.
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
     * Unparse Expression tree in MathML.
     * @param tree Expression tree.
     * @returns String of expression unparsed as MathML language.
     */
    public UnparseMathML(tree: NodeInput, display: 'inline' | 'block' = 'block'): string {
        let result: string = this.UnparserMathML(tree);
        if (result) {
            return MathML.format.math(MathML.format.errorReplace(result), display);
        } else {
            return '<b>Unparse error.</b>';
        }
    }

    /**
     * Generates MathML representation of input without evaluation.
     * @param input Input to parse and generate MathML representation.
     * @param display `'inline'` or `'block'`.
     * @returns MathML representation of input.
     */
    public ToMathML(input: string, display: 'inline' | 'block' = 'block'): string {
        return this.UnparseMathML(this.Parse(input), display);
    }
}

export type { InterpreterConfig, IncDecOperator };
export type { BuiltinCallable, Callable, FunctionDefinitionCallable, LambdaCallable } from './Callable';
export { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
export default { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, Context, Interpreter };
