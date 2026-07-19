import type { FunctionTable, NodeExpr, NodeInput } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { Structure } from './Structure';
import { FunctionHandle } from './FunctionHandle';

/**
 * Minimal scope contract required by introspection helpers.
 */
type IntrospectionScope = {
    /**
     * Functions visible from the inspected workspace.
     */
    functionTable: FunctionTable;
    /**
     * Lexical parent scope, used by function-file calls whose subfunctions live
     * in the definition scope rather than in the transient call scope.
     */
    parent?: IntrospectionScope;
};

/**
 * Minimal call-frame contract required by `dbstack` and `localfunctions`.
 */
type IntrospectionFrame = {
    /**
     * Workspace associated with the frame.
     */
    scope: IntrospectionScope;
    /**
     * Callable metadata, when the frame represents a function call.
     */
    func?: { type: string; node?: { id?: string } };
    /**
     * AST node that originated the call, used for line information.
     */
    callSite?: NodeExpr;
    /**
     * Explicit frame display name, if one was supplied by the caller.
     */
    name?: string;
    /**
     * Caller frame.
     */
    parentFrame?: IntrospectionFrame;
};

/**
 * Syntax-error callback supplied by the interpreter.
 */
type ThrowSyntaxError = (message: string) => never;

/**
 * Implements stack and local-function introspection built-ins.
 *
 * The browser runtime has no real MATLAB/Octave file stack, so file names are
 * intentionally empty. Function names, line numbers, and local function handles
 * are still derived from active call frames and scopes.
 */
class FunctionIntrospection {
    private static functionNames(scope: IntrospectionScope): string[] {
        return Object.keys(scope.functionTable).filter((name) => scope.functionTable[name]?.type === 'FCNDEF');
    }

    private static nearestFunctionScope(
        frame: IntrospectionFrame | undefined,
        currentScope: IntrospectionScope,
    ): { scope: IntrospectionScope; excludeName?: string; hasFunctionFrame: boolean } {
        if (!frame) {
            return { scope: currentScope, hasFunctionFrame: false };
        }
        if (this.functionNames(frame.scope).length > 0) {
            return { scope: frame.scope, hasFunctionFrame: true };
        }
        let scope = frame.scope.parent;
        while (scope) {
            if (this.functionNames(scope).length > 0) {
                return { scope, excludeName: frame.func?.node?.id, hasFunctionFrame: true };
            }
            scope = scope.parent;
        }
        return { scope: frame.scope, hasFunctionFrame: true };
    }

    /**
     * Return handles for user-defined functions visible in the nearest function scope.
     *
     * @param currentFrame Active call frame.
     * @param currentScope Active scope used when no function frame exists.
     * @returns Column cell array of function handles.
     */
    public static localFunctionHandles(currentFrame: IntrospectionFrame | undefined, currentScope: IntrospectionScope): MultiArray {
        const functionFrame = this.nearestFunctionFrame(currentFrame);
        const { scope, excludeName, hasFunctionFrame } = this.nearestFunctionScope(functionFrame, currentScope);
        const names = this.functionNames(scope)
            .filter((name) => name !== excludeName)
            .sort();
        const result = new MultiArray([names.length, 1], null, true);
        result.array = names.map((name) => {
            const closure = hasFunctionFrame ? scope : undefined;
            return [FunctionHandle.create(name, [], null, closure as unknown as Parameters<typeof FunctionHandle.create>[3])];
        });
        return result;
    }

    /**
     * Compute the display name for a stack frame.
     *
     * @param frame Frame to inspect.
     * @returns User-facing function/frame name.
     */
    public static frameName(frame: IntrospectionFrame): string {
        if (frame.name) return frame.name;
        const func = frame.func;
        if (!func) return '';
        switch (func.type) {
            case 'BUILTIN':
                return func.node?.id ?? '<builtin>';
            case 'LAMBDA':
                return '<anonymous>';
            case 'FCNDEF':
                return func.node?.id ?? '<function>';
            default:
                return '';
        }
    }

    /**
     * Build the structure array returned by `dbstack`.
     *
     * @param args Evaluated `dbstack` arguments.
     * @param callStack Current call stack.
     * @param throwSyntaxError Syntax-error callback for invalid options.
     * @returns Structure array with `file`, `name`, and `line` fields.
     */
    public static dbstackResult(args: NodeInput[], callStack: IntrospectionFrame[], throwSyntaxError: ThrowSyntaxError): MultiArray {
        const skip = this.dbstackSkip(args, throwSyntaxError);
        const frames = callStack
            .filter((frame) => frame.func?.type === 'FCNDEF' || frame.func?.type === 'LAMBDA')
            .slice()
            .reverse()
            .slice(skip);
        const result = new MultiArray([frames.length, 1]);
        result.array = frames.map((frame) => [
            new Structure({
                file: new CharString(''),
                name: new CharString(this.frameName(frame)),
                line: Complex.create(frame.callSite?.start?.line ?? 0),
            }),
        ]);
        result.type = Structure.STRUCTURE;
        return result;
    }

    /**
     * Find the nearest user-defined function frame.
     *
     * @param currentFrame Active call frame.
     * @returns Nearest enclosing function frame, if any.
     */
    private static nearestFunctionFrame(currentFrame: IntrospectionFrame | undefined): IntrospectionFrame | undefined {
        let functionFrame = currentFrame;
        while (functionFrame && functionFrame.func?.type !== 'FCNDEF') {
            functionFrame = functionFrame.parentFrame;
        }
        return functionFrame;
    }

    /**
     * Parse `dbstack` skip/options arguments.
     *
     * @param args Evaluated `dbstack` arguments.
     * @param throwSyntaxError Syntax-error callback.
     * @returns Number of frames to omit from the top of the stack.
     */
    private static dbstackSkip(args: NodeInput[], throwSyntaxError: ThrowSyntaxError): number {
        let skip = 0;
        for (const arg of args) {
            const value = MultiArray.isInstanceOf(arg) && MultiArray.isScalar(arg) ? MultiArray.firstElement(arg) : arg;
            if (Complex.isInstanceOf(value)) {
                const number = Complex.realToNumber(value);
                if (!Complex.imagIsZero(value) || !Number.isInteger(number) || number < 0) {
                    throwSyntaxError('dbstack: omitted frame count must be a nonnegative integer.');
                }
                skip = number;
            } else if (CharString.isInstanceOf(value)) {
                if (value.str !== '-completenames') {
                    throwSyntaxError(`dbstack: unsupported option '${value.str}'.`);
                }
            } else {
                throwSyntaxError('dbstack: arguments must be a frame count or option string.');
            }
        }
        return skip;
    }
}

export type { IntrospectionFrame, IntrospectionScope };
export { FunctionIntrospection };
export default { FunctionIntrospection };
