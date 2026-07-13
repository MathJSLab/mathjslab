import type { NodeIdentifier, NodeIgnoredTarget, NodeInput } from './AST';
import { Complex, MultiArray } from './AST';
import type { Callable as ArityCallable } from './Callable';
import { FunctionSignature } from './FunctionSignature';

type ArityCheckName = 'narginchk' | 'nargoutchk';

type ThrowError = (message: string) => never;
type ArityName = NodeIdentifier | NodeIgnoredTarget;

/**
 * Implements arity introspection and arity-check helper built-ins.
 *
 * The returned arity convention follows MATLAB/Octave-style `nargin(fun)` and
 * `nargout(fun)`: fixed arity is nonnegative, while variadic signatures are
 * negative and encode the position of `varargin`/`varargout`.
 */
class FunctionArity {
    /**
     * Compute the number of accepted input arguments for a callable.
     */
    public static inputArity(callable: ArityCallable): number {
        switch (callable.type) {
            case 'LAMBDA': {
                const params = callable.node.parameter as ArityName[];
                return this.identifierListArity(params, 'varargin');
            }
            case 'FCNDEF': {
                const params = callable.node.parameter.list as ArityName[];
                return this.identifierListArity(params, 'varargin');
            }
            case 'BUILTIN':
                return FunctionSignature.declaredArity(FunctionSignature.inputSignatures(callable.node)) ?? callable.node.func.length;
        }
    }

    /**
     * Compute the number of produced/requestable output arguments for a callable.
     */
    public static outputArity(callable: ArityCallable): number {
        switch (callable.type) {
            case 'LAMBDA':
                return 1;
            case 'FCNDEF': {
                const returnNames = callable.node.return.list as ArityName[];
                return this.identifierListArity(returnNames, 'varargout');
            }
            case 'BUILTIN':
                return FunctionSignature.declaredArity(FunctionSignature.outputSignatures(callable.node)) ?? 1;
        }
    }

    /**
     * Validate and convert a `narginchk`/`nargoutchk` bound.
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
     */
    private static identifierListArity(items: ArityName[], variadicName: 'varargin' | 'varargout'): number {
        const last = items[items.length - 1];
        return items.length > 0 && last.type === 'IDENT' && last.id === variadicName ? -items.length : items.length;
    }
}

export type { ArityCallable, ArityCheckName };
export { FunctionArity };
export default { FunctionArity };
