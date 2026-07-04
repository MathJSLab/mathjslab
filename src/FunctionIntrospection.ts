import type { FunctionTable, NodeExpr, NodeInput } from './AST';
import { CharString, Complex, MultiArray, Structure } from './AST';
import { FunctionHandle } from './FunctionHandle';

/**
 * Minimal scope contract required by introspection helpers.
 */
type IntrospectionScope = {
    /**
     * Functions visible from the inspected workspace.
     */
    functionTable: FunctionTable;
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
    /**
     * Return handles for user-defined functions visible in the nearest function scope.
     */
    public static localFunctionHandles(currentFrame: IntrospectionFrame | undefined, currentScope: IntrospectionScope): MultiArray {
        const functionFrame = this.nearestFunctionFrame(currentFrame);
        const scope = functionFrame?.scope ?? currentScope;
        const names = Object.keys(scope.functionTable)
            .filter((name) => scope.functionTable[name]?.type === 'FCNDEF')
            .sort();
        const result = new MultiArray([names.length, 1], null, true);
        result.array = names.map((name) => {
            const closure = functionFrame ? scope : undefined;
            return [FunctionHandle.create(name, [], null, closure as any)];
        });
        return result;
    }

    /**
     * Compute the display name for a stack frame.
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
