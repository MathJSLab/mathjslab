import type { ExpressionBoundaryValue, NodeFunctionDefinition } from './AST';
import { FunctionWorkspace, type WorkspaceScope } from './FunctionWorkspace';

type FunctionFrame = {
    func?: { type: string; node?: unknown };
    scope: WorkspaceScope;
    parentFrame?: FunctionFrame;
    name?: string;
    nargin: number;
    nargout: number;
    inputArgs: ExpressionBoundaryValue[];
    outputMask?: boolean[];
};

type CreateScope = (parent?: WorkspaceScope) => WorkspaceScope;

/**
 * Stack helpers for MATLAB/Octave-like function metadata.
 *
 * The interpreter keeps concrete `CallFrame` objects, but this module only
 * depends on the structural `FunctionFrame` shape. That lets unit tests cover
 * stack behavior without instantiating a full interpreter.
 */
class FunctionStack {
    /**
     * Return the active user-defined function definition, if any.
     */
    public static currentFunctionDefinition(frames: FunctionFrame[]): NodeFunctionDefinition | undefined {
        return this.currentFunctionFrame(frames)?.func?.node as NodeFunctionDefinition | undefined;
    }

    /**
     * Return the nearest user-defined function frame.
     *
     * Built-ins and anonymous-function frames are skipped because persistent
     * declarations and function-name introspection are tied to `function`
     * definitions, not to all callable forms.
     */
    public static currentFunctionFrame(frames: FunctionFrame[]): FunctionFrame | undefined {
        for (let i = frames.length - 1; i >= 0; i--) {
            if (frames[i].func?.type === 'FCNDEF') {
                return frames[i];
            }
        }
        return undefined;
    }

    /**
     * Return the nearest frame that contributes `nargin`/`nargout`.
     *
     * Both ordinary functions and anonymous function handles have call counts.
     * Built-ins are skipped so helper built-ins such as `eval` do not mask the
     * user-visible caller.
     */
    public static currentFunctionCountFrame(frames: FunctionFrame[]): FunctionFrame | undefined {
        for (let i = frames.length - 1; i >= 0; i--) {
            const type = frames[i].func?.type;
            if (type === 'FCNDEF' || type === 'LAMBDA') {
                return frames[i];
            }
        }
        return undefined;
    }

    /**
     * Return the display name of the current user-defined function.
     */
    public static currentFunctionName(frames: FunctionFrame[]): string {
        return this.currentFunctionFrame(frames)?.name ?? '';
    }

    /**
     * Return the caller-supplied input argument count for `nargin`.
     */
    public static currentArgumentCount(frames: FunctionFrame[]): number | undefined {
        return this.currentFunctionCountFrame(frames)?.nargin;
    }

    /**
     * Return the caller-requested output count for `nargout`.
     */
    public static currentOutputCount(frames: FunctionFrame[]): number | undefined {
        return this.currentFunctionCountFrame(frames)?.nargout;
    }

    /**
     * Resolve the caller workspace for `evalin('caller', ...)` and `assignin`.
     *
     * Anonymous functions need a special overlay for read-only caller lookup:
     * MATLAB/Octave-style closures should see captured variables while still
     * exposing caller-visible names to `evalin`. For assignment, the real caller
     * workspace is used instead of the overlay.
     */
    public static callerWorkspace(frames: FunctionFrame[], globalScope: WorkspaceScope, createScope: CreateScope, forAssignment = false, variablesOnly = false): WorkspaceScope {
        const currentCallableFrame = this.currentFunctionCountFrame(frames);
        if (currentCallableFrame?.func?.type === 'LAMBDA' && !forAssignment && variablesOnly) {
            return this.anonymousCallerWorkspace(currentCallableFrame, globalScope, createScope);
        }
        const frame = this.skipBuiltInFrames(currentCallableFrame?.parentFrame);
        const scope = frame?.scope ?? globalScope;
        return !forAssignment && variablesOnly ? this.variableOnlyCallerWorkspace(scope, createScope) : scope;
    }

    /**
     * Build the anonymous-function caller overlay used by `evalin`.
     */
    private static anonymousCallerWorkspace(lambdaFrame: FunctionFrame, globalScope: WorkspaceScope, createScope: CreateScope): WorkspaceScope {
        const callerFrame = this.skipBuiltInFrames(lambdaFrame.parentFrame);
        const workspace = createScope();
        const sourceScopes = new Map<string, WorkspaceScope>();
        this.copyVisibleVariablesWithSources(workspace, callerFrame?.scope ?? globalScope, sourceScopes);
        this.copyVisibleVariablesWithSources(workspace, lambdaFrame.scope, sourceScopes);
        workspace.rejectDynamicNameCreation = lambdaFrame.scope.rejectDynamicNameCreation;
        workspace.staticWorkspaceNameSet = lambdaFrame.scope.staticWorkspaceNameSet ? new Set(lambdaFrame.scope.staticWorkspaceNameSet) : undefined;
        workspace.globalDeclarationTarget = lambdaFrame.scope;
        this.attachVariableOnlyWriteThrough(workspace, (name) => sourceScopes.get(name) ?? lambdaFrame.scope);
        return workspace;
    }

    /**
     * Build the ordinary `evalin('caller', ...)` overlay.
     *
     * MATLAB documents `evalin('caller', ...)` as resolving caller variables
     * but not functions. The overlay shares name entries with the real caller
     * so assignments update the caller workspace while function lookup remains
     * intentionally empty and parentless.
     */
    private static variableOnlyCallerWorkspace(scope: WorkspaceScope, createScope: CreateScope): WorkspaceScope {
        const workspace = createScope();
        FunctionWorkspace.copyVisibleScopeEntries(workspace, scope, false);
        workspace.rejectDynamicNameCreation = scope.rejectDynamicNameCreation;
        workspace.staticWorkspaceNameSet = scope.staticWorkspaceNameSet ? new Set(scope.staticWorkspaceNameSet) : undefined;
        workspace.globalDeclarationTarget = scope;
        this.attachVariableOnlyWriteThrough(workspace, () => scope);
        return workspace;
    }

    /**
     * Copy visible variable entries and remember the scope that owns each name.
     */
    private static copyVisibleVariablesWithSources(target: WorkspaceScope, source: WorkspaceScope | undefined, sourceScopes: Map<string, WorkspaceScope>): void {
        const chain: WorkspaceScope[] = [];
        let current = source;
        while (current) {
            chain.push(current);
            if (!current.resolveParentNames) {
                break;
            }
            current = current.parent;
        }
        for (let index = chain.length - 1; index >= 0; index--) {
            const item = chain[index];
            Object.assign(target.nameTable, item.nameTable);
            for (const name of Object.keys(item.nameTable)) {
                sourceScopes.set(name, item);
            }
        }
    }

    /**
     * Attach variable write-through methods to a variable-only overlay.
     */
    private static attachVariableOnlyWriteThrough(workspace: WorkspaceScope, sourceForName: (name: string) => WorkspaceScope): void {
        const writeThroughScope = (scope: WorkspaceScope, writer: () => ReturnType<WorkspaceScope['defineName']>) => {
            const previous = scope.rejectDynamicNameCreation;
            if (workspace.rejectDynamicNameCreation) {
                scope.rejectDynamicNameCreation = true;
            }
            try {
                return writer();
            } finally {
                scope.rejectDynamicNameCreation = previous;
            }
        };
        workspace.defineName = (name, node, undefinedReference) => {
            const scope = sourceForName(name);
            const entry = writeThroughScope(scope, () => scope.defineName(name, node, undefinedReference));
            workspace.nameTable[name] = entry;
            return entry;
        };
        workspace.assignName = (name, node, undefinedReference) => {
            const scope = sourceForName(name);
            const assignName = scope.assignName?.bind(scope);
            const entry = writeThroughScope(scope, () => (assignName ? assignName(name, node, undefinedReference) : scope.defineName(name, node, undefinedReference)));
            workspace.nameTable[name] = entry;
            return entry;
        };
        workspace.removeName = (name) => {
            const scope = sourceForName(name);
            if (scope.removeName) {
                scope.removeName(name);
            } else {
                delete scope.nameTable[name];
            }
            delete workspace.nameTable[name];
        };
        workspace.clearName = (name) => {
            const scope = sourceForName(name);
            if (scope.clearName) {
                scope.clearName(name);
            } else if (scope.removeName) {
                scope.removeName(name);
            } else {
                delete scope.nameTable[name];
            }
            delete workspace.nameTable[name];
        };
    }

    /**
     * Skip built-in helper frames while walking toward user-visible callers.
     */
    private static skipBuiltInFrames(frame?: FunctionFrame): FunctionFrame | undefined {
        while (frame?.func?.type === 'BUILTIN') {
            frame = frame.parentFrame;
        }
        return frame;
    }
}

export type { FunctionFrame };
export { FunctionStack };
export default { FunctionStack };
