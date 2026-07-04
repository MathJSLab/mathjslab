import type { BuiltInFunctionInputSignature, NodeBuiltInFunction, NodeInput } from './AST';
import { FunctionValidation } from './FunctionValidation';

/**
 * Utilities for the declarative built-in function signature table.
 *
 * Signatures describe valid input/output arities and parameter validators in a
 * form that can be shared by built-ins instead of hand-written argument checks.
 */
class FunctionSignature {
    /**
     * Normalize a built-in's input signature declaration to an array.
     */
    public static inputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        const inputs = node.signature?.inputs;
        if (!inputs) {
            return [];
        }
        return Array.isArray(inputs) ? inputs : [inputs];
    }

    /**
     * Normalize a built-in's output signature declaration to an array.
     */
    public static outputSignatures(node: NodeBuiltInFunction): BuiltInFunctionInputSignature[] {
        const outputs = node.signature?.outputs;
        if (!outputs) {
            return [];
        }
        return Array.isArray(outputs) ? outputs : [outputs];
    }

    /**
     * Minimum accepted argument count for one signature.
     */
    public static arityMinimum(signature: BuiltInFunctionInputSignature): number {
        return signature.min ?? (signature.arity < 0 ? Math.max(Math.abs(signature.arity) - 1, 0) : signature.arity);
    }

    /**
     * Maximum accepted argument count for one signature.
     */
    public static arityMaximum(signature: BuiltInFunctionInputSignature): number {
        return signature.max ?? (signature.arity < 0 ? Infinity : signature.arity);
    }

    /**
     * Return the 1-based variadic position, when a signature is variadic.
     */
    public static variadicPosition(signature: BuiltInFunctionInputSignature, preferParameterPosition = false): number | undefined {
        const parameterPosition = signature.parameters?.findIndex((parameter) => parameter.variadic) ?? -1;
        if (preferParameterPosition && parameterPosition >= 0) {
            return parameterPosition + 1;
        }
        if (signature.arity < 0) {
            return Math.abs(signature.arity);
        }
        if (parameterPosition >= 0) {
            return parameterPosition + 1;
        }
        return undefined;
    }

    /**
     * Derive the `nargin`/`nargout` display arity for one or more overloads.
     */
    public static declaredArity(signatures: BuiltInFunctionInputSignature[]): number | undefined {
        if (signatures.length === 0) {
            return undefined;
        }
        const minimums = signatures.map((signature) => this.arityMinimum(signature));
        const maximums = signatures.map((signature) => this.arityMaximum(signature));
        const hasVariableArity = maximums.some((maximum) => maximum === Infinity) || !minimums.every((minimum, index) => minimum === maximums[index]);
        if (!hasVariableArity && minimums.every((minimum) => minimum === minimums[0])) {
            return minimums[0];
        }
        if (maximums.some((maximum) => maximum === Infinity)) {
            const variadicPositions = signatures
                .filter((signature, index) => maximums[index] === Infinity)
                .map((signature) => this.variadicPosition(signature, signatures.length > 1))
                .filter((position): position is number => typeof position === 'number');
            if (variadicPositions.length > 0) {
                return -Math.min(...variadicPositions);
            }
        }
        const finiteMaximums = maximums.filter((maximum) => maximum !== Infinity);
        if (finiteMaximums.length > 0) {
            return -Math.max(...finiteMaximums);
        }
        return -Math.max(...signatures.map((signature) => this.variadicPosition(signature) ?? Math.abs(signature.arity)));
    }

    /**
     * Check whether a count satisfies one signature's arity interval.
     */
    public static arityMatches(signature: BuiltInFunctionInputSignature, argCount: number): boolean {
        const min = this.arityMinimum(signature);
        const max = this.arityMaximum(signature);
        return argCount >= min && argCount <= max;
    }

    /**
     * Return input overloads whose arity matches the supplied arguments.
     */
    public static matchingInputSignatures(node: NodeBuiltInFunction, argCount: number): BuiltInFunctionInputSignature[] {
        return this.inputSignatures(node).filter((input) => this.arityMatches(input, argCount));
    }

    /**
     * Check whether a built-in accepts the supplied number of inputs.
     */
    public static inputArityIsValid(node: NodeBuiltInFunction, argCount: number): boolean {
        const inputs = this.inputSignatures(node);
        return inputs.length === 0 || inputs.some((input) => this.arityMatches(input, argCount));
    }

    /**
     * Check whether at least one matching overload accepts the argument values.
     */
    public static inputParametersAreValid(node: NodeBuiltInFunction, args: NodeInput[]): boolean {
        const inputs = this.matchingInputSignatures(node, args.length);
        return inputs.length === 0 || inputs.some((input) => FunctionValidation.argumentsMatchBuiltInParameters(args, input.parameters));
    }
}

export { FunctionSignature };
export default { FunctionSignature };
