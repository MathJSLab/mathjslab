import type { NodeFunctionParameter, NodeFunctionReturn, NodeInput } from './AST';
import { AST } from './AST';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import type { Callable as ArityCallable } from './Callable';
import { FunctionSignature } from './FunctionSignature';

type ArityCheckName = 'narginchk' | 'nargoutchk';

/** Error callback used by arity helpers. */
type ThrowError = (message: string) => never;
/** Header node used by `nargin`/`nargout` arity extraction. */
type ArityName = NodeFunctionParameter | NodeFunctionReturn;

/**
 * Implements arity introspection and arity-check helper built-ins.
 *
 * The returned arity convention follows MATLAB/Octave-style `nargin(fun)` and
 * `nargout(fun)`: fixed arity is nonnegative, while variadic signatures are
 * negative and encode the position of `varargin`/`varargout`.
 */
class FunctionArity {
    /**
     * Validate arity metadata that should already be guaranteed by AST factories.
     */
    private static checkedList<NODE>(items: unknown[], guard: (value: unknown) => value is NODE, role: string): NODE[] {
        return items.map((item, index) => {
            if (!guard(item)) {
                throw new TypeError(`internal AST error: ${role} ${index + 1} has invalid node type.`);
            }
            return item;
        });
    }

    /**
     * Compute the number of accepted input arguments for a callable.
     *
     * @param callable Callable to inspect.
     * @returns Fixed arity or negative variadic arity.
     */
    public static inputArity(callable: ArityCallable): number {
        switch (callable.type) {
            case 'LAMBDA': {
                const params = this.checkedList(callable.node.parameter, AST.isNodeFunctionParameter, 'function handle parameter');
                return this.identifierListArity(params, 'varargin');
            }
            case 'FCNDEF': {
                const params = this.checkedList(callable.node.parameter.list, AST.isNodeFunctionParameter, 'function parameter');
                return this.identifierListArity(params, 'varargin');
            }
            case 'STATIC_METHOD': {
                const params = this.checkedList(callable.node.method.node.parameter.list, AST.isNodeFunctionParameter, 'static method parameter');
                return this.identifierListArity(params, 'varargin');
            }
            case 'BUILTIN':
                return FunctionSignature.declaredArity(FunctionSignature.inputSignatures(callable.node)) ?? callable.node.func.length;
        }
    }

    /**
     * Compute the number of produced/requestable output arguments for a callable.
     *
     * @param callable Callable to inspect.
     * @returns Fixed arity or negative variadic arity.
     */
    public static outputArity(callable: ArityCallable): number {
        switch (callable.type) {
            case 'LAMBDA':
                return 1;
            case 'FCNDEF': {
                const returnNames = this.checkedList(callable.node.return.list, AST.isNodeFunctionReturn, 'function return');
                return this.identifierListArity(returnNames, 'varargout');
            }
            case 'STATIC_METHOD': {
                const returnNames = this.checkedList(callable.node.method.node.return.list, AST.isNodeFunctionReturn, 'static method return');
                return this.identifierListArity(returnNames, 'varargout');
            }
            case 'BUILTIN':
                return FunctionSignature.declaredArity(FunctionSignature.outputSignatures(callable.node)) ?? 1;
        }
    }

    /**
     * Validate and convert a `narginchk`/`nargoutchk` bound.
     *
     * @param name Built-in name used in diagnostics.
     * @param bound Evaluated bound value.
     * @param allowInfinity Whether positive infinity is accepted.
     * @param throwSyntaxError Syntax-error callback.
     * @returns Numeric bound.
     */
    public static countBound(name: ArityCheckName, bound: NodeInput, allowInfinity: boolean, throwSyntaxError: ThrowError): number {
        const valueNode = MultiArray.isInstanceOf(bound) && MultiArray.isScalar(bound) ? MultiArray.firstElement(bound) : bound;
        if (!Complex.isInstanceOf(valueNode) || !Complex.imagIsZero(valueNode) || (!allowInfinity && !Number.isFinite(Complex.realToNumber(valueNode)))) {
            throwSyntaxError(`${name}: bounds must be real scalar numbers.`);
        }
        const value = Complex.realToNumber(valueNode);
        if (value < 0 || (!Number.isInteger(value) && !(allowInfinity && value === Infinity))) {
            throwSyntaxError(`${name}: bounds must be nonnegative integers.`);
        }
        return value;
    }

    /**
     * Implement the range check shared by `narginchk` and `nargoutchk`.
     *
     * @param name Built-in name used in diagnostics.
     * @param min Minimum bound value.
     * @param max Maximum bound value.
     * @param count Actual argument count.
     * @param throwSyntaxError Syntax-error callback.
     * @param throwEvalError Evaluation-error callback.
     */
    public static checkFunctionCount(name: ArityCheckName, min: NodeInput, max: NodeInput, count: number, throwSyntaxError: ThrowError, throwEvalError: ThrowError): void {
        const minimum = this.countBound(name, min, false, throwSyntaxError);
        const maximum = this.countBound(name, max, true, throwSyntaxError);
        if (maximum < minimum) {
            throwSyntaxError(`${name}: maximum count must be greater than or equal to minimum count.`);
        }
        if (count < minimum || count > maximum) {
            throwEvalError(`${name}: invalid number of ${name === 'narginchk' ? 'input' : 'output'} arguments.`);
        }
    }

    /**
     * Convert an identifier list to the fixed/variadic arity convention.
     *
     * @param items Parameter or return-name nodes.
     * @param variadicName Expected trailing variadic identifier.
     * @returns Fixed list length or negative variadic position.
     */
    private static identifierListArity(items: ArityName[], variadicName: 'varargin' | 'varargout'): number {
        const last = items[items.length - 1];
        return items.length > 0 && AST.isNodeIdentifier(last) && last.id === variadicName ? -items.length : items.length;
    }
}

export type { ArityCallable, ArityCheckName };
export { FunctionArity };
export default { FunctionArity };
