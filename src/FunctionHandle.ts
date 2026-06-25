import { Complex, ComplexType } from './Complex';
import { NodeExpr } from './AST';
import { Scope, Interpreter } from './Interpreter';

/**
 * # FunctionHandle
 *
 * Represents a MATLAB/Octave-like **function handle**.
 *
 * A function handle can represent either:
 *
 * - A **reference to a named function**
 * - An **anonymous function (lambda expression)**
 *
 * The distinction is defined by the presence of `id`:
 *
 * ```ts
 * if (id !== undefined) → named function reference
 * else → anonymous function (lambda)
 * ```
 *
 * ---
 *
 * ## Internal Representation
 *
 * | Case              | `id`        | `expression` | `parameter` | Meaning                     |
 * |-------------------|-------------|--------------|-------------|-----------------------------|
 * | `@sin`            | `"sin"`     | `null`       | `[]`        | Named function reference    |
 * | `@(x) x^2`        | `undefined` | AST          | params      | Anonymous function (lambda) |
 * | `f =` `@sin`      | `"sin"`     | `null`       | `[]`        | Persistent reference        |
 * | `f =` `@(x)x^2`   | `undefined` | AST          | params      | Persistent lambda           |
 *
 * ---
 *
 * ## Closure Semantics
 *
 * When representing an anonymous function, a `closure` may be attached.
 * This closure captures the lexical environment (`Scope`) at the moment
 * the function handle is created.
 *
 * This enables proper implementation of:
 * - lexical scoping
 * - variable capture
 * - higher-order functions
 *
 * ---
 *
 * ## Notes
 *
 * - `expression` is only meaningful for anonymous functions.
 * - `parameter` defines the formal parameters of the lambda.
 * - `closure` is optional and only relevant for lambdas.
 * - This class does **not** execute functions — it only represents them.
 *
 * ---
 *
 * ## References
 * - https://www.mathworks.com/help/matlab/function-handles.html
 * - https://www.mathworks.com/help/matlab/matlab_prog/creating-a-function-handle.html
 * - https://www.mathworks.com/help/matlab/matlab_prog/pass-a-function-to-another-function.html
 * - https://www.mathworks.com/help/matlab/math/parameterizing-functions.html
 * - https://www.mathworks.com/help/matlab/matlab_prog/call-local-functions-using-function-handles.html
 * - https://www.mathworks.com/help/matlab/matlab_prog/compare-function-handles.html
 * - https://www.mathworks.com/help/matlab/matlab_prog/anonymous-functions.html
 * - https://www.mathworks.com/help/matlab/ref/function_handle.html
 * - https://www.mathworks.com/help/matlab/ref/functions.html
 * - https://docs.octave.org/latest/Function-Handles-and-Anonymous-Functions.html
 * - https://docs.octave.org/latest/Function-Handles.html
 * - https://docs.octave.org/latest/Anonymous-Functions.html
 * - https://en.wikipedia.org/wiki/Closure_(computer_programming)
 */
class FunctionHandle {
    /**
     * Internal numeric type identifier.
     */
    public static readonly FUNCTION_HANDLE = 5;

    /**
     * Runtime type tag.
     */
    public readonly type = FunctionHandle.FUNCTION_HANDLE;

    /**
     * Parent AST node (if attached to a tree).
     */
    public parent: any;

    /**
     * Name of the referenced function.
     *
     * - Defined → named function (`@sin`)
     * - Undefined → anonymous function (`@(x) x^2`)
     */
    public id?: string;

    /**
     * Formal parameters (AST nodes representing identifiers).
     *
     * Only meaningful for anonymous functions.
     */
    public parameter: NodeExpr[] = [];

    /**
     * Function body as an AST node.
     *
     * Only meaningful for anonymous functions.
     *
     * May be `null` when representing a named function handle.
     */
    public expression!: NodeExpr;

    /**
     * Captured lexical scope (closure).
     *
     * Only defined for anonymous functions that capture variables.
     */
    public closure?: Scope;

    /**
     * Type guard for FunctionHandle.
     *
     * @param obj - Value to test
     * @returns True if `obj` is a FunctionHandle
     */
    public static isInstanceOf = (obj: unknown): obj is FunctionHandle => obj instanceof FunctionHandle;

    /**
     * Private constructor.
     *
     * Use {@link FunctionHandle.create} instead.
     *
     * @param id - Function name (for named handles)
     * @param parameter - Formal parameters (lambda only)
     * @param expression - Function body AST (lambda only)
     * @param closure - Captured scope (optional)
     */
    private constructor(id?: string, parameter: NodeExpr[] = [], expression: NodeExpr = null, closure?: Scope) {
        this.id = id;
        this.parameter = parameter ?? [];
        this.expression = expression;

        if (closure) {
            this.closure = closure;
        }
    }

    /**
     * Factory method for creating a FunctionHandle.
     *
     * @param id - Function name (optional)
     * @param parameter - Formal parameters
     * @param expression - Function body AST
     * @param closure - Captured scope
     * @returns A new FunctionHandle instance
     */
    public static create = (id?: string, parameter: NodeExpr[] = [], expression: NodeExpr = null, closure?: Scope) => new FunctionHandle(id, parameter, expression, closure);

    /**
     * Converts a FunctionHandle back to source code representation.
     *
     * @param fhandle - Function handle to unparse
     * @param interpreter - Interpreter used for AST unparsing
     * @param parentPrecedence - Operator precedence (currently unused)
     * @returns String representation (MATLAB-like syntax)
     */
    public static unparse = (fhandle: FunctionHandle, interpreter: Interpreter, parentPrecedence = 0): string => {
        if (fhandle.id) {
            return '@' + fhandle.id;
        } else {
            return '@(' + fhandle.parameter.map((param: NodeExpr) => interpreter.Unparse(param)).join(',') + ') ' + interpreter.Unparse(fhandle.expression);
        }
    };

    /**
     * Human-readable string representation.
     *
     * Does not fully reconstruct anonymous functions.
     *
     * @param fhandle - Function handle
     * @returns Short string description
     */
    public static toString = (fhandle: FunctionHandle): string => {
        if (fhandle.id) {
            return '@' + fhandle.id;
        } else {
            return '@anonymous function handle';
        }
    };

    /**
     * Instance version of {@link FunctionHandle.toString}.
     */
    public toString(): string {
        return FunctionHandle.toString(this);
    }

    /**
     * Converts the function handle into MathML representation.
     *
     * @param fhandle - Function handle
     * @param interpreter - Interpreter for AST conversion
     * @param parentPrecedence - Operator precedence (unused)
     * @returns MathML string
     */
    public static unparseMathML = (fhandle: FunctionHandle, interpreter: Interpreter, parentPrecedence = 0): string => {
        if (fhandle.id) {
            return `<mo>@</mo><mi>${fhandle.id}</mi>`;
        } else {
            return (
                '<mo>@</mo><mo fence="true" stretchy="true">(</mo>' +
                fhandle.parameter.map((param: NodeExpr) => interpreter.UnparserMathML(param)).join('<mo>,</mo>') +
                '<mo fence="true" stretchy="true">)</mo><mspace width="0.8em"/>' +
                interpreter.UnparserMathML(fhandle.expression)
            );
        }
    };

    /**
     * Creates a shallow copy of a FunctionHandle.
     *
     * Notes:
     * - AST nodes (`parameter`, `expression`) are **not cloned**
     * - `closure` is not copied
     *
     * @param fhandle - Source handle
     * @returns New FunctionHandle instance
     */
    public static copy = (fhandle: FunctionHandle): FunctionHandle => {
        const result = new FunctionHandle(fhandle.id, fhandle.parameter, fhandle.expression);
        result.parent = fhandle.parent;
        return result;
    };

    /**
     * Instance version of {@link FunctionHandle.copy}.
     *
     * @returns Shallow copy
     */
    public copy(): FunctionHandle {
        const result = new FunctionHandle(this.id, this.parameter, this.expression);
        result.parent = this.parent;
        return result;
    }

    /**
     * Converts the function handle to a logical value.
     *
     * MATLAB/Octave semantics:
     * Function handles are always considered **false** in logical context.
     *
     * @param fhandle - Function handle
     * @returns Logical false
     */
    public static toLogical = (fhandle: FunctionHandle): ComplexType => Complex.false();

    /**
     * Instance version of {@link FunctionHandle.toLogical}.
     *
     * @returns Logical false
     */
    public toLogical(): ComplexType {
        return Complex.false();
    }
}

export { FunctionHandle };
export default { FunctionHandle };
