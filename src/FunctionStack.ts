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
    public static callerWorkspace(frames: FunctionFrame[], globalScope: WorkspaceScope, createScope: CreateScope, forAssignment = false): WorkspaceScope {
        const currentCallableFrame = this.currentFunctionCountFrame(frames);
        if (currentCallableFrame?.func?.type === 'LAMBDA' && !forAssignment) {
            return this.anonymousCallerWorkspace(currentCallableFrame, globalScope, createScope);
        }
        const frame = this.skipBuiltInFrames(currentCallableFrame?.parentFrame);
        return frame?.scope ?? globalScope;
    }

    /**
     * Build the anonymous-function caller overlay used by `evalin`.
     */
    private static anonymousCallerWorkspace(lambdaFrame: FunctionFrame, globalScope: WorkspaceScope, createScope: CreateScope): WorkspaceScope {
        const callerFrame = this.skipBuiltInFrames(lambdaFrame.parentFrame);
        const workspace = createScope(lambdaFrame.scope.parent);
        FunctionWorkspace.copyVisibleScopeEntries(workspace, callerFrame?.scope ?? globalScope);
        Object.assign(workspace.nameTable, lambdaFrame.scope.nameTable);
        Object.assign(workspace.functionTable, lambdaFrame.scope.functionTable);
        return workspace;
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
