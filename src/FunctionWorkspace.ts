import type { ExpressionBoundaryValue, FunctionTable, NameEntry, NameTable, NodeExpr, NodeFunctionDefinition, NodeInput, RuntimeExpressionValue } from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { runtimeExpressionValue } from './ExpressionValue';
import { MultiArray } from './MultiArray';
import { RuntimeValue } from './RuntimeValue';

type WorkspaceScope = {
    parent?: WorkspaceScope;
    nameTable: NameTable;
    functionTable: FunctionTable;
    resolveParentNames: boolean;
    rejectDynamicNameCreation?: boolean;
    staticWorkspaceNameSet?: Set<string>;
    globalDeclarationTarget?: WorkspaceScope;
    defineName(name: string, node: NodeInput, undefinedReference?: string): NameEntry;
    assignName?(name: string, node: NodeInput, undefinedReference?: string): NameEntry;
    removeName?(name: string): void;
    clearName?(name: string): void;
    hasLocalName(name: string): boolean;
};

type RuntimeNameWriter = {
    nameTable?: NameTable;
    defineName(name: string, node: RuntimeExpressionValue): NameEntry;
    assignName?(name: string, node: RuntimeExpressionValue): NameEntry;
};

type ThrowSyntaxError = (message: string) => never;
type EvaluateInScope = (source: string, scope: WorkspaceScope) => NodeInput;
type UnparseInputArgument = (arg: ExpressionBoundaryValue) => string;
type IsCatchableError = (error: unknown) => boolean;
type OnCatchError = (error: unknown) => void;

/**
 * Workspace helpers shared by function calls and MATLAB/Octave workspace
 * built-ins.
 *
 * This module owns the non-parser parts of `persistent`, `global`, `inputname`,
 * `eval`, `evalin`, and `assignin`. Keeping these operations outside
 * `Interpreter.ts` makes the execution rules visible and testable without
 * requiring a full interpreter instance.
 */
class FunctionWorkspace {
    /**
     * Ensure that a function definition has its persistent-variable table.
     *
     * Persistent storage lives on the function definition node itself, matching
     * the lifetime of a parsed function definition. Call scopes receive copies
     * when the function is entered and write values back when it returns.
     */
    public static ensurePersistentTable(func: NodeFunctionDefinition): Record<string, RuntimeExpressionValue> {
        if (!func.attributes) {
            func.attributes = {};
        }
        if (!func.attributes.persistent) {
            func.attributes.persistent = Object.create(null);
        }
        const table = func.attributes.persistent!;
        return table;
    }

    /**
     * Copy all variable/function entries visible from `source` into `target`.
     *
     * The copy walks from outermost to innermost scope so local entries shadow
     * parent entries. It stops when a scope disables parent-name resolution,
     * preserving detached closure snapshots.
     */
    public static copyVisibleScopeEntries(target: Pick<WorkspaceScope, 'nameTable' | 'functionTable'>, source?: WorkspaceScope, includeFunctions = true): void {
        if (!source) {
            return;
        }
        const chain: WorkspaceScope[] = [];
        let scope: WorkspaceScope | undefined = source;
        while (scope) {
            chain.unshift(scope);
            if (!scope.resolveParentNames) {
                break;
            }
            scope = scope.parent;
        }
        for (const item of chain) {
            Object.assign(target.nameTable, item.nameTable);
            if (includeFunctions) {
                Object.assign(target.functionTable, item.functionTable);
            }
        }
    }

    /**
     * Implement `inputname(n[, onlyVariableNames])`.
     *
     * With the default `onlyVariableNames = true`, MATLAB/Octave return an
     * empty string unless the selected argument is a plain variable name. When
     * `onlyVariableNames` is false, the original caller expression is returned
     * when an unparser is supplied.
     */
    public static inputName(
        inputArgs: ExpressionBoundaryValue[],
        indexNode: NodeInput,
        throwSyntaxError: ThrowSyntaxError,
        onlyVariableNames = true,
        unparse?: UnparseInputArgument,
    ): CharString {
        const valueNode = MultiArray.isInstanceOf(indexNode) && MultiArray.isScalar(indexNode) ? MultiArray.firstElement(indexNode) : indexNode;
        if (!Complex.isInstanceOf(valueNode) || !Complex.imagIsZero(valueNode)) {
            throwSyntaxError('inputname: argument number must be a positive integer.');
        }
        const index = Complex.realToNumber(valueNode);
        if (!Number.isInteger(index) || index < 1) {
            throwSyntaxError('inputname: argument number must be a positive integer.');
        }
        const arg = inputArgs[index - 1];
        if (!arg) {
            return new CharString('');
        }
        if (AST.isNodeIdentifier(arg)) {
            return new CharString(arg.id);
        }
        return new CharString(!onlyVariableNames && unparse ? unparse(arg).trim() : '');
    }

    /**
     * Resolve `base` and `caller` workspace names for `evalin` and `assignin`.
     *
     * External files are intentionally not handled here; the browser UI owns
     * external-file access, so this helper only models in-memory workspaces.
     */
    public static resolveWorkspace(name: string, baseScope: WorkspaceScope, callerScope: WorkspaceScope, throwSyntaxError: ThrowSyntaxError): WorkspaceScope {
        switch (name) {
            case 'base':
                return baseScope;
            case 'caller':
                return callerScope;
            default:
                throwSyntaxError(`unsupported workspace '${name}'.`);
        }
    }

    /**
     * Evaluate source in a target workspace, optionally running a catch string.
     *
     * This models the two-argument `eval`/three-argument `evalin` form while
     * leaving parsing and execution to the callback supplied by the interpreter.
     * The optional predicate lets the interpreter keep control-flow signals
     * such as `return`, `break`, and `continue` out of the catch string path.
     * The optional catch hook records the original error before catch source
     * execution so `lasterr`/`lasterror` see the same state as `try/catch`.
     */
    public static evaluateWithCatch(
        scope: WorkspaceScope,
        source: string,
        catchSource: string | undefined,
        evaluate: EvaluateInScope,
        isCatchableError: IsCatchableError = () => true,
        onCatchError?: OnCatchError,
    ): NodeInput {
        try {
            return evaluate(source, scope);
        } catch (e: unknown) {
            if (typeof catchSource === 'undefined' || !isCatchableError(e)) {
                throw e;
            }
            onCatchError?.(e);
            return evaluate(catchSource, scope);
        }
    }

    /**
     * Implement `assignin` after the interpreter has resolved the workspace.
     *
     * Values are copied before storage to avoid aliasing the caller's AST node.
     * The result is `VOID` because assignment-by-side-effect should not display
     * an answer in the command UI.
     */
    public static assignIn(scope: RuntimeNameWriter, name: string, value: RuntimeExpressionValue): NodeInput {
        const copied = RuntimeValue.copy(value);
        if (scope.assignName) {
            scope.assignName(name, copied);
        } else {
            scope.defineName(name, copied);
        }
        return AST.nodeVoid();
    }

    /**
     * Declare or initialize a persistent variable for a function call.
     *
     * A declaration without initializer creates an empty-array persistent value
     * on first use. A declaration with initializer only initializes the table if
     * the name has not been seen before, matching MATLAB/Octave persistent
     * semantics.
     */
    public static declarePersistent(name: string, value: RuntimeExpressionValue | undefined, func: NodeFunctionDefinition, scope: RuntimeNameWriter): void {
        const table = this.ensurePersistentTable(func);
        if (scope.nameTable?.[name]?.persistent) {
            return;
        }
        if (typeof value !== 'undefined' && typeof table[name] === 'undefined') {
            table[name] = RuntimeValue.copy(value);
        } else if (typeof table[name] === 'undefined') {
            table[name] = AST.emptyArray();
        }
        const entry = scope.defineName(name, RuntimeValue.copy(table[name]));
        entry.persistent = true;
    }

    /**
     * Load all persistent variables into a fresh function-call scope.
     */
    public static loadPersistentVariables(func: NodeFunctionDefinition, scope: RuntimeNameWriter): void {
        const table = this.ensurePersistentTable(func);
        for (const name of Object.keys(table)) {
            if (typeof table[name] === 'undefined') {
                table[name] = AST.emptyArray();
            }
            const entry = scope.defineName(name, RuntimeValue.copy(table[name]));
            entry.persistent = true;
        }
    }

    /**
     * Store changed persistent variables back into the function definition.
     *
     * Only names known to the persistent table are saved. This prevents ordinary
     * local variables from becoming persistent accidentally.
     */
    public static storePersistentVariables(func: NodeFunctionDefinition, scope: Pick<WorkspaceScope, 'hasLocalName' | 'nameTable'>): void {
        const table = this.ensurePersistentTable(func);
        for (const name of Object.keys(table)) {
            const entry = scope.hasLocalName(name) ? scope.nameTable[name] : undefined;
            if (entry && typeof entry.node !== 'undefined') {
                table[name] = RuntimeValue.copy(
                    runtimeExpressionValue(entry.node, name, 'persistent variable', (message) => {
                        throw new EvalError(message);
                    }),
                );
            }
        }
    }

    /**
     * Declare a global binding in the current scope.
     *
     * Local and global scopes share the same `NameEntry` object. Mutating one
     * side therefore updates the other, which is the behavior expected by
     * MATLAB/Octave-like `global` declarations.
     *
     * Octave-style `global name = value` initializes a global binding only once
     * through declaration syntax. Later global declarations for the same name
     * reattach the existing binding without overwriting user changes.
     */
    public static declareGlobal(
        name: string,
        value: RuntimeExpressionValue | undefined,
        globalNameSet: Set<string>,
        globalNameTable: NameTable,
        scopeNameTable: NameTable,
        globalInitializedNameSet?: Set<string>,
    ): void {
        globalNameSet.add(name);
        let entry = globalNameTable[name];
        if (!entry) {
            entry = globalNameTable[name] = {};
        }
        entry.global = true;
        const initialized = Boolean(entry.globalInitialized || globalInitializedNameSet?.has(name));
        if (typeof value !== 'undefined' && !initialized) {
            entry.node = RuntimeValue.copy(value);
            delete entry.undefinedReference;
            entry.globalInitialized = true;
            globalInitializedNameSet?.add(name);
        } else if (typeof entry.node === 'undefined') {
            entry.node = AST.emptyArray();
        }
        scopeNameTable[name] = entry;
    }

    /**
     * Clear global variables from global, active, and captured scopes.
     *
     * Function handles and nested functions can keep references to defining
     * scopes. The recursive walk follows those defining scopes so `clear global`
     * does not leave stale global aliases hidden in closures.
     *
     * @param globalNameSet Names currently declared as global.
     * @param globalScope Base global scope.
     * @param callScopes Active call scopes that may contain global aliases.
     * @param requestedNames Optional subset of global names to remove.
     */
    public static clearGlobalVariables(globalNameSet: Set<string>, globalScope: WorkspaceScope | undefined, callScopes: WorkspaceScope[], requestedNames?: string[]): void {
        const names = requestedNames ? requestedNames.filter((name) => globalNameSet.has(name)) : [...globalNameSet];
        const visited = new Set<WorkspaceScope>();
        const clearFromScopeChain = (scope?: WorkspaceScope) => {
            while (scope && !visited.has(scope)) {
                visited.add(scope);
                for (const name of names) {
                    if (scope.nameTable[name]?.global) {
                        delete scope.nameTable[name];
                    }
                }
                for (const func of Object.values(scope.functionTable)) {
                    clearFromScopeChain(func.definingScope as WorkspaceScope | undefined);
                }
                scope = scope.parent;
            }
        };
        clearFromScopeChain(globalScope);
        for (const scope of callScopes) {
            clearFromScopeChain(scope);
        }
        if (requestedNames) {
            for (const name of names) {
                globalNameSet.delete(name);
            }
        } else {
            globalNameSet.clear();
        }
    }
}

export type { WorkspaceScope };
export { FunctionWorkspace };
export default { FunctionWorkspace };
