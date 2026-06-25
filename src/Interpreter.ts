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
    NameEntry,
    NameTable,
    FunctionTable,
    AliasNameTable,
    BuiltInFunctionTable,
    CommandWordListTable,
    UndefinedReferenceTable,
} from './AST';
import { AST, CharString, Complex, ComplexType, MultiArray, Structure, FunctionHandle } from './AST';
import type { MathObject, MathOperationType, UnaryMathOperation, BinaryMathOperation, KeyOfTypeOfMathOperation } from './MathOperation';
import { MathOperation } from './MathOperation';
import { substSymbol } from './substSymbol';
import { CoreFunctions } from './CoreFunctions';
import { LinearAlgebra } from './LinearAlgebra';
import { Configuration } from './Configuration';
import { MathML } from './MathML';

/**
 * `response` type
 */
type ExitStatus = number;
type ExitStatusValues = Record<string, ExitStatus>;

/**
 * # Scope
 *
 * Represents a **lexical scope**.
 *
 * A `Scope` stores:
 * - variable bindings (`nameTable`)
 * - function bindings (`functionTable`)
 * - unresolved references for forward reference resolution (`undefinedReferenceTable`)
 *
 * Scopes are organized in a **parent chain**, forming a lexical environment.
 *
 * ---
 *
 * ## Resolution Model
 *
 * Name and function resolution follow this order:
 *
 * 1. Current scope
 * 2. Parent scope
 * 3. Recursively upward
 *
 * ---
 *
 * ## Mutation Semantics
 *
 * - `define*` → affects **current scope only**
 * - `remove*` → removes from **current scope only**
 * - `clear*` → removes from **entire scope chain**
 *
 * ---
 *
 * ## Notes
 *
 * - Tables use `Object.create(null)` to avoid prototype pollution.
 * - Resolution is read-only (no mutation).
 * - Supports shadowing (local overrides parent).
 */
class Scope {
    /**
     * Private constructor.
     *
     * Use {@link Scope.create} to create a new `Scope` instance.
     *
     * @param parent - Parent scope (optional)
     * @param nameTable - Variable table (optional)
     * @param functionTable - Function table (optional)
     * @param undefinedReferenceTable - Undefined references table (optional)
     */
    private constructor(
        public parent?: Scope,
        public nameTable: NameTable = Object.create(null),
        public functionTable: FunctionTable = Object.create(null),
        public undefinedReferenceTable: UndefinedReferenceTable = Object.create(null),
    ) {}

    /**
     * Factory method for creating a new scope.
     *
     * @param parent - Parent scope (optional)
     * @returns New `Scope` instance
     */
    public static readonly create = (parent?: Scope) => new Scope(parent);

    /**
     * Defines a variable in the current scope.
     *
     * Overwrites existing local definition if present.
     *
     * @param name - Identifier
     * @param node - Value node
     * @param undefinedReference - Optional unresolved reference tag
     * @returns Created/updated entry
     */
    public defineName(name: string, node: NodeInput, undefinedReference?: string): NameEntry {
        return undefinedReference ? (this.nameTable[name] = { undefinedReference, node }) : (this.nameTable[name] = { node });
    }

    /**
     * Defines multiple variables in the current scope.
     *
     * @param table - Map of name → node
     */
    public defineNameTable(table: Record<string, NodeInput>): void {
        for (const name in table) {
            this.nameTable[name] = { node: table[name] };
        }
    }

    /**
     * Resolves a variable using lexical lookup.
     *
     * @param name - Identifier
     * @returns First matching entry or `undefined`
     */
    public resolveName(name: string): NameEntry | undefined {
        const entry = this.nameTable[name];
        return entry ? entry : this.parent ? this.parent.resolveName(name) : undefined;
    }

    /**
     * Checks if a variable exists in the current scope.
     *
     * @param name - Identifier
     * @returns `true` if exists locally
     */
    public hasLocalName(name: string): boolean {
        return name in this.nameTable;
    }

    /**
     * Removes a variable from the current scope only.
     *
     * @param name - Identifier
     */
    public removeName(name: string): void {
        delete this.nameTable[name];
    }

    /**
     * Removes a variable from the entire scope chain.
     *
     * @param name - Identifier
     */
    public clearName(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.nameTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Defines a function in the current scope.
     *
     * @param name - Function name
     * @param func - Function definition
     * @returns Stored function
     */
    public defineFunction(name: string, func: NodeFunctionDefinition): NodeFunctionDefinition {
        return (this.functionTable[name] = func);
    }

    /**
     * Defines multiple functions in the current scope.
     *
     * @param table - Function table
     */
    public defineFunctionTable(table: FunctionTable): void {
        Object.assign(this.functionTable, table);
    }

    /**
     * Resolves a function using lexical lookup.
     *
     * @param name - Function name
     * @returns Function or `undefined`
     */
    public resolveFunction(name: string): NodeFunctionDefinition | NodeBuiltInFunction | undefined {
        const entry = this.functionTable[name];
        return entry ? entry : this.parent ? this.parent.resolveFunction(name) : undefined;
    }

    /**
     * Checks if a function exists in the current scope.
     *
     * @param name - Function name
     * @returns `true` if exists locally
     */
    public hasLocalFunction(name: string): boolean {
        return name in this.functionTable;
    }

    /**
     * Removes a function from the current scope only.
     *
     * @param name - Function name
     */
    public removeFunction(name: string): void {
        delete this.functionTable[name];
    }

    /**
     * Removes a function from the entire scope chain.
     *
     * @param name - Function name
     */
    public clearFunction(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.functionTable[name];
            scope = scope.parent;
        }
    }

    /**
     * Binds parameters to arguments in the current scope.
     *
     * No validation is performed.
     *
     * @param names - Parameter names
     * @param args - Argument expressions
     */
    public bindParameters(names: string[], args: NodeExpr[]): void {
        for (let i = 0; i < names.length; i++) {
            this.defineName(names[i], args[i]);
        }
    }

    /**
     * Binds parameters to arguments with arity checking.
     *
     * Throws an error if the number of arguments does not match
     * the number of parameters.
     *
     * @param names - Parameter names
     * @param args - Argument expressions
     * @throws Error if arity mismatch
     */
    public bindParametersChecked(names: string[], args: NodeExpr[]): void {
        if (names.length !== args.length) {
            throw new Error(`Arity mismatch: expected ${names.length} argument(s), got ${args.length}`);
        }
        this.bindParameters(names, args);
    }

    /**
     * Registers an unresolved reference (forward reference).
     *
     * @param name - Identifier
     * @param undefinedReference - Reference id
     * @returns Updated reference list
     */
    public defineUndefinedReference(name: string, undefinedReference: string) {
        const entry = this.resolveUndefinedReference(name);
        if (entry) {
            if (!entry.includes(undefinedReference)) {
                entry.push(undefinedReference);
            }
            return entry;
        } else {
            return (this.undefinedReferenceTable[name] = [undefinedReference]);
        }
    }

    /**
     * Resolves unresolved references using lexical lookup.
     *
     * @param name - Identifier
     * @returns Array of references or `undefined`
     */
    public resolveUndefinedReference(name: string): string[] | undefined {
        const entry = this.undefinedReferenceTable[name];
        return entry ? entry : this.parent ? this.parent.resolveUndefinedReference(name) : undefined;
    }

    /**
     * Removes unresolved references from the current scope only.
     *
     * @param name - Identifier
     */
    public removeUndefinedReference(name: string): void {
        delete this.undefinedReferenceTable[name];
    }

    /**
     * Removes unresolved references from the entire scope chain.
     *
     * @param name - Identifier
     */
    public clearUndefinedReference(name: string): void {
        let scope: Scope | undefined = this;
        while (scope) {
            delete scope.undefinedReferenceTable[name];
            scope = scope.parent;
        }
    }
}

/**
 * # Callable
 *
 * Discriminated union representing any **callable entity** in the engine.
 *
 * A callable is anything that can be invoked during evaluation.
 *
 * ---
 *
 * ## Variants
 *
 * - `BUILTIN` → Built-in function implemented in the runtime
 * - `LAMBDA` → Anonymous function (function handle with expression)
 * - `FCNDEF` → User-defined function (declared with `function`)
 *
 * ---
 *
 * ## Design Notes
 *
 * This abstraction allows the interpreter to treat all callable entities
 * uniformly, while preserving their specific execution semantics.
 *
 * Each variant wraps a different underlying AST/runtime representation.
 */
type Callable = BuiltinCallable | LambdaCallable | FunctionDefinitionCallable;

/**
 * Represents a **built-in callable function**.
 *
 * Built-in functions are implemented directly in the runtime
 * (e.g., `sin`, `cos`, `exp`).
 */
interface BuiltinCallable {
    /**
     * Discriminator tag.
     */
    type: 'BUILTIN';

    /**
     * AST node representing the built-in function.
     */
    node: NodeBuiltInFunction;
}

/**
 * Represents an **anonymous function (lambda)**.
 *
 * This wraps a {@link FunctionHandle} whose `id` is `undefined`
 * and contains:
 * - parameter list
 * - expression body
 * - optional closure
 */
interface LambdaCallable {
    /**
     * Discriminator tag.
     */
    type: 'LAMBDA';

    /**
     * Function handle representing the lambda.
     */
    node: FunctionHandle & { id: undefined };
}

/**
 * Represents a **defined function**.
 *
 * Typically declared using a function definition construct.
 */
interface FunctionDefinitionCallable {
    /**
     * Discriminator tag.
     */
    type: 'FCNDEF';

    /**
     * AST node representing the function definition.
     */
    node: NodeFunctionDefinition;
}

/**
 * # CallFrame
 *
 * Represents a **function call frame** in the evaluation stack ({@link InterpreterContext.callStack}).
 *
 * A call frame encapsulates:
 * - the **execution scope** for the call
 * - the **callable being executed**
 * - a link to the **caller frame** (stack chain)
 *
 * ---
 *
 * ## Role in Evaluation
 *
 * During function invocation, a new `CallFrame` is created:
 *
 * 1. A new `Scope` is created (child of the defining scope or global scope)
 * 2. Parameters are bound in that scope
 * 3. The callable is associated with the frame
 * 4. The frame is pushed onto the call stack
 *
 * This enables:
 * - proper lexical scoping
 * - recursion
 * - nested calls
 * - stack trace reconstruction
 *
 * ---
 *
 * ## Stack Structure
 *
 * Frames form a linked structure:
 *
 * ```text
 * currentFrame → parentFrame → parentFrame → ...
 * ```
 *
 * ---
 *
 * ## Debugging Support
 *
 * Additional metadata is stored to support stack traces:
 *
 * - `callSite` → AST node where the call occurred
 * - `name` → human-readable function name
 *
 * ---
 *
 * ## Notes
 *
 * - `func` may be `undefined` for temporary frames
 * - `parentFrame` should be consistent with the call stack array
 */
class CallFrame {
    /**
     * Creates a new call frame.
     *
     * @param scope - Execution {@link Scope} for this frame
     * @param func - Callable associated with this frame (optional)
     * @param callSite - {@link AST} node representing the call site (optional)
     * @param name - Human-readable function name (optional)
     * @param parentFrame - Caller frame (optional)
     */
    public constructor(
        /**
         * Execution {@link Scope} for this frame.
         */
        public scope: Scope,

        /**
         * {@link Callable} being executed in this frame.
         */
        public func?: Callable,

        /**
         * AST node where the function call originated.
         *
         * Useful for error reporting (line/column in future).
         */
        public callSite?: NodeExpr,

        /**
         * Human-readable function name.
         *
         * Examples:
         * - "sin"
         * - "f"
         * - "@(x)x^2"
         */
        public name?: string,

        /**
         * Parent frame in the call stack.
         */
        public parentFrame?: CallFrame,
    ) {}
}

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

class InterpreterContext {
    /**
     * Reset the execution context to a provided scope/stack or to a fresh global state.
     *
     * @param globalScope Optional global scope to install.
     * @param callStack Optional call stack to install.
     */
    public loadInterpreterContext(globalScope?: Scope, callStack?: CallFrame[]): void {
        if (globalScope) {
            this.globalScope = globalScope;
        } else {
            this.globalScope = Scope.create();
            this.globalScope.nameTable = Object.create(null);
            this.globalScope.functionTable = Object.create(null);
            this.globalScope.undefinedReferenceTable = Object.create(null);
        }
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
         * Assignment targets whose right-hand side is currently being evaluated.
         *
         * This stack lets undefined-reference handling distinguish a local
         * forward reference from a dependency cycle such as `A -> B -> A`.
         */
        private forwardReferenceTargetStack: string[][] = [],
    ) {
        this.loadInterpreterContext(globalScope, callStack);
    }
    /**
     * Create {@link InterpreterContext} object.
     * @param interpreter Optional interpreter instance associated with the context.
     * @param globalScope Optional global scope reference.
     * @param callStack Optional function call stack reference.
     * @returns New interpreter context.
     */
    public static readonly create = (interpreter?: Interpreter, globalScope?: Scope, callStack?: CallFrame[]): InterpreterContext =>
        new InterpreterContext(interpreter, globalScope, callStack);
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
                const func = this.resolveFunction(expr.id);
                if (!func) {
                    this.throwReferenceError(`'${expr.id}' undefined.`);
                }
                if (func.type === 'BUILTIN') {
                    return { type: 'BUILTIN', node: func };
                }
                if (func.type === 'FCNDEF') {
                    return { type: 'FCNDEF', node: func };
                }
            }
            /* Lambda handle, for example `@(x)x^2`. */
            return {
                type: 'LAMBDA',
                node: expr as FunctionHandle & { id: undefined },
            };
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
        /* 2. Function lookup. */
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
        /* 3. Undefined identifier. */
        this.throwUndefinedReferenceError(name);
    }
    private evaluateArgs(args: NodeExpr[], parent: NodeInput, mode: 'all' | boolean[]): NodeExpr[] {
        return args.map((arg: NodeExpr, i: number) => {
            arg.parent = parent;
            arg.index = i;
            if (mode === 'all') {
                return AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
            }
            const ev = mode;
            return ev.length > 0 && i < ev.length && !ev[i] ? arg : AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(arg, this.currentScope));
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
    private resolveCallSite(node: NodeInput | undefined): NodeExpr | undefined {
        let current: any = node;
        while (current) {
            if (current.start) return current;
            current = current.parent;
        }
        return undefined;
    }
    callCallable(callable: Callable, args: NodeExpr[], parent: NodeInput): NodeExpr {
        switch (callable.type) {
            case 'BUILTIN': {
                const node = callable.node;
                const alias = this.aliasNameFunction(node.id);
                const evaluatedArgs = this.evaluateArgs(args, parent, node.ev);
                /* Push a frame before entering the built-in so errors can capture this call. */
                this.pushCallStackFrame(new CallFrame(this.currentScope, callable, this.resolveCallSite(parent), node.id));
                try {
                    if (node.mapper && evaluatedArgs.length !== 1) {
                        this.throwEvalError(`Invalid call to ${alias}.`);
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
                if (lambda.parameter.length !== args.length) {
                    this.throwEvalError(`invalid number of arguments.`);
                }
                const lambdaScope = Scope.create(lambda.closure ?? this.currentScope);
                for (let i = 0; i < args.length; i++) {
                    args[i].parent = parent;
                    args[i].index = i;
                    const value = AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(args[i], this.currentScope));
                    lambdaScope.defineName(lambda.parameter[i].id, value);
                }
                this.pushCallStackFrame(new CallFrame(lambdaScope, callable, this.resolveCallSite(parent), FunctionHandle.toString(lambda)));
                try {
                    const result = AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(lambda.expression, lambdaScope));
                    return result;
                } finally {
                    this.popCallStackFrame();
                }
            }
            case 'FCNDEF': {
                const func = callable.node;
                const paramCount = func.parameter.list.length;
                if (paramCount !== args.length) {
                    this.throwEvalError(`invalid number of arguments in function ${func.id}`);
                }
                /* Create a function scope, preserving the definition scope when available. */
                const functionScope = Scope.create(func.definingScope ?? this.currentScope);
                /* Bind evaluated arguments to formal parameter names. */
                for (let i = 0; i < paramCount; i++) {
                    args[i].parent = parent;
                    args[i].index = i;
                    const value = AST.reduceToFirstIfReturnList(this.interpreter!.Evaluator(args[i], this.currentScope));
                    const paramName = func.parameter.list[i].id;
                    functionScope.defineName(paramName, value);
                }
                /* Push the user-defined function frame for stack trace reporting. */
                this.pushCallStackFrame(new CallFrame(functionScope, callable, this.resolveCallSite(parent), func.id));
                let result: NodeExpr;
                try {
                    /* Execute the function body. */
                    if (func.statements.list.length > 0) {
                        this.interpreter!.Evaluator(func.statements, functionScope);
                    }
                    /* Build a lazy return list backed by the function scope. */
                    if (func.return.list.length > 0) {
                        const names = func.return.list.map((r) => r.id);
                        result = AST.nodeReturnList(
                            (evaluated, index) => {
                                const key = names[index];
                                const value = evaluated[key];
                                if (value === undefined) {
                                    this.throwEvalError(`Undefined return value '${key}'`);
                                }
                                return value;
                            },
                            (length: number) => {
                                const out: any = { length };
                                for (let i = 0; i < length; i++) {
                                    const name = names[i];
                                    const entry = functionScope.resolveName(name);
                                    if (!entry || !entry.node) {
                                        this.throwEvalError(`Undefined return variable '${name}'`);
                                    }
                                    out[name] = entry.node as NodeExpr;
                                }
                                return out;
                            },
                        );
                    } else {
                        result = AST.nodeVoid();
                    }
                } finally {
                    this.popCallStackFrame();
                }
                return result;
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
    public defineBuiltInFunction(id: string, func: Function, mapper: boolean = false, ev: boolean[] = []): void {
        this.builtInFunctionTable[id] = { type: 'BUILTIN', id, mapper, ev, func, definingScope: this.globalScope! };
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
    context: InterpreterContext;
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
    public context: InterpreterContext;

    /**
     * Command word list table.
     */
    private commandWordListTable: CommandWordListTable = {
        clear: {
            func: (...args: string[]): void => this.Clear(...args),
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
        localfunctions: {
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
    private readonly functions: Record<string, Function> = {
        unparse: (tree: NodeInput): CharString => new CharString(this.Unparse(tree)),
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
        this.context.loadInterpreterContext();
        this.context.nativeNameTable = Interpreter.nativeNameTableFactory();
        this.context.nativeNameTableList = Object.keys(this.context.nativeNameTable);
        this.context.globalScope!.defineNameTable(this.context.nativeNameTable);
        /* Define Interpreter functions */
        for (const func in this.functions) {
            this.context.defineBuiltInFunction(func, this.functions[func]);
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
        for (const func in Complex.mapFunction) {
            this.context.defineBuiltInFunction(func, Complex.mapFunction[func], true);
        }
        /* Define other functions */
        for (const func in Complex.twoArgFunction) {
            this.context.defineBuiltInFunction(func, Complex.twoArgFunction[func]);
        }
        /* Define Configuration functions */
        for (const func in Configuration.functions) {
            this.context.defineBuiltInFunction(func, Configuration.functions[func]);
        }
        /* Define CoreFunctions functions */
        for (const func in CoreFunctions.functions) {
            this.context.defineBuiltInFunction(func, CoreFunctions.functions[func]);
        }
        /* Define LinearAlgebra functions */
        for (const func in LinearAlgebra.functions) {
            this.context.defineBuiltInFunction(func, LinearAlgebra.functions[func as keyof LinearAlgebra]);
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
    private constructor(config?: InterpreterConfig, context?: InterpreterContext) {
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
            this.context = InterpreterContext.create(this);
        }
        this.loadInterpreter(config);
    }

    /**
     * Creates an instance of the `Interpreter` object.
     * @param config Optional interpreter configuration.
     * @param context Optional pre-built interpreter context.
     * @returns New interpreter instance.
     */
    public static readonly Create = (config?: InterpreterConfig, context?: InterpreterContext): Interpreter => new Interpreter(config, context);

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
     * Clear variables. When no names are provided, restart the interpreter.
     * @param names Variable names to clear in nameTable and builtInFunctionTable.
     */
    public Clear(...names: string[]): void {
        if (names.length === 0) {
            if (this._debug) {
                console.clear();
            }
            this.Restart();
        } else {
            names.forEach((name) => {
                this.context.currentScope.removeName(name);
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
            if (Complex.isInstanceOf(tree) || FunctionHandle.isInstanceOf(tree) || CharString.isInstanceOf(tree) || Structure.isInstanceOf(tree)) {
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
                            this.context.popForwardReferenceTargets();
                        }
                        /* Convert `right` to `'RETLIST'` if the node is not already of that type. */
                        if (right.type !== 'RETLIST') {
                            const result = right;
                            right = AST.nodeReturnList((evaluated: ReturnHandlerResult, index: number) => {
                                if (index === 0) {
                                    return result;
                                } else {
                                    AST.throwErrorIfGreaterThanReturnList(evaluated.length, index, (message) => this.context.throwEvalError(message));
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
                                                    entry = scope.defineName(id, AST.reduceToFirstIfReturnList(expr), undefinedReference);
                                                } else {
                                                    if (error) throw error;
                                                    this.context.throwUndefinedReferenceError(undefinedReference);
                                                }
                                            } else {
                                                entry = scope.defineName(id, AST.reduceToFirstIfReturnList(expr));
                                            }
                                            this.solveUndefined(id, scope);
                                            AST.appendNodeList(resultList, AST.nodeOperation('=', AST.nodeIdentifier(id), entry.node));
                                            if (error) throw error;
                                        }
                                    } catch (e: unknown) {
                                        if (this.context.allowForwardReference) {
                                            scope.defineName(id, expr, undefinedReference);
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
                    case 'FCNDEF': {
                        const func = tree as NodeFunctionDefinition;
                        /* Register function in the current scope. */
                        scope.defineFunction(func.id, func);
                        /* Store the definition scope so calls can resolve lexical captures. */
                        func.definingScope = scope;
                        /* MATLAB-like behavior: function definition does not execute anything. */
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
                                if (item.type !== 'VOID') {
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
export { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, InterpreterContext, Interpreter };
export default { Scope, CallFrame, InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError, InterpreterContext, Interpreter };
