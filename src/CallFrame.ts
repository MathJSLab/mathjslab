import type { ExpressionBoundaryValue, NodeExpr } from './AST';
import type { Callable } from './Callable';
import type { Scope } from './Scope';

/**
 * Represents one interpreter call-frame.
 *
 * Frames are pushed for built-ins, user-defined functions, anonymous function
 * handles, and temporary `eval` execution. They provide:
 *
 * - the active workspace for lookup and assignment,
 * - the callable currently being executed,
 * - metadata used by `nargin`, `nargout`, `inputname`, and stack traces,
 * - a linked `parentFrame` chain for MATLAB/Octave-like caller lookup.
 *
 * Stack/error formatting lives outside this class; this remains a small data
 * holder so stack-management helpers can use it without depending on the full
 * interpreter implementation.
 */
class CallFrame {
    /**
     * Create a call frame.
     *
     * @param scope Workspace associated with this frame.
     * @param func Callable being executed, when the frame represents a call.
     * @param callSite AST node that originated the call, used for diagnostics.
     * @param name Display name used by stack traces and introspection.
     * @param nargin Number of input arguments supplied by the caller.
     * @param nargout Number of output values requested by the caller.
     * @param inputArgs Original unevaluated call arguments, used by `inputname`.
     * @param parentFrame Caller frame.
     * @param outputMask Per-output request flags used by `isargout`.
     */
    public constructor(
        public scope: Scope,
        public func?: Callable,
        public callSite?: NodeExpr,
        public name?: string,
        public nargin: number = 0,
        public nargout: number = 0,
        public inputArgs: ExpressionBoundaryValue[] = [],
        public parentFrame?: CallFrame,
        public outputMask: boolean[] = [],
    ) {}
}

export { CallFrame };
export default CallFrame;
