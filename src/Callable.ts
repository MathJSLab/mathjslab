import type { NodeBuiltInFunction, NodeFunctionDefinition } from './AST';
import type { AnonymousFunctionHandle } from './FunctionHandle';

/**
 * Runtime representation of a built-in function after name/handle resolution.
 *
 * Built-ins are stored as AST/runtime nodes in the interpreter function table,
 * but the call engine works with this wrapper so all callable forms share the
 * same discriminated-union shape.
 */
interface BuiltinCallable {
    type: 'BUILTIN';
    node: NodeBuiltInFunction;
}

/**
 * Runtime representation of an anonymous function handle.
 *
 * MATLAB/Octave anonymous functions do not have a function-table name. The
 * narrowed `id: undefined` type documents that this callable is backed by the
 * handle expression itself, including its parameter list, expression body, and
 * captured closure.
 */
interface LambdaCallable {
    type: 'LAMBDA';
    node: AnonymousFunctionHandle;
}

/**
 * Runtime representation of a user-defined function.
 *
 * This covers ordinary function definitions as well as nested/local functions;
 * the function node carries attributes such as `nested` and persistent storage.
 */
interface FunctionDefinitionCallable {
    type: 'FCNDEF';
    node: NodeFunctionDefinition;
}

/**
 * Unified callable abstraction used by call dispatch, `nargin`, `nargout`,
 * stack frames, function handles, and introspection.
 *
 * Keeping this union outside `Interpreter.ts` avoids parallel structural
 * definitions drifting apart as the MATLAB/Octave-like function engine grows.
 */
type Callable = BuiltinCallable | LambdaCallable | FunctionDefinitionCallable;

/**
 * Factory and type-guard helpers for the `Callable` union.
 *
 * The helpers intentionally return tiny immutable wrapper objects instead of
 * mutating AST/function-handle nodes. This keeps function definitions, built-in
 * nodes, and handles usable in more than one call context.
 */
const Callables = {
    /**
     * Wrap a built-in runtime node for uniform dispatch.
     */
    builtin(node: NodeBuiltInFunction): BuiltinCallable {
        return { type: 'BUILTIN', node };
    },

    /**
     * Wrap an anonymous function handle.
     */
    lambda(node: AnonymousFunctionHandle): LambdaCallable {
        return { type: 'LAMBDA', node };
    },

    /**
     * Wrap a user-defined function definition.
     */
    functionDefinition(node: NodeFunctionDefinition): FunctionDefinitionCallable {
        return { type: 'FCNDEF', node };
    },

    /**
     * Wrap a function-table node while preserving its concrete kind.
     */
    fromFunctionNode(node: NodeBuiltInFunction | NodeFunctionDefinition): BuiltinCallable | FunctionDefinitionCallable {
        return node.type === 'BUILTIN' ? this.builtin(node) : this.functionDefinition(node);
    },

    /**
     * Narrow a callable to the built-in variant.
     */
    isBuiltin(callable: Callable): callable is BuiltinCallable {
        return callable.type === 'BUILTIN';
    },

    /**
     * Narrow a callable to the anonymous-function variant.
     */
    isLambda(callable: Callable): callable is LambdaCallable {
        return callable.type === 'LAMBDA';
    },

    /**
     * Narrow a callable to the user-defined-function variant.
     */
    isFunctionDefinition(callable: Callable): callable is FunctionDefinitionCallable {
        return callable.type === 'FCNDEF';
    },
};

export type { BuiltinCallable, LambdaCallable, FunctionDefinitionCallable, Callable };
export { Callables };
export default Callables;
