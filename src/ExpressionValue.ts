import { AST, type NodeExpr } from './AST';

/** Callback used by expression-boundary helpers to report runtime errors. */
type ThrowExpressionError = (message: string) => void;

/**
 * Validate one evaluated value before exposing it in an expression-only slot.
 *
 * Runtime expression values and strict AST expressions are accepted. `NodeList`
 * is also accepted as an explicit execution-result carrier because `eval` and
 * `evalin` can propagate it legitimately. Control-flow statements and other
 * non-expression AST nodes are rejected at the boundary.
 *
 * @param value Evaluated value to validate.
 * @param name Diagnostic name for the value.
 * @param role Diagnostic role, such as `Return value` or `Argument value`.
 * @param throwError Error callback owned by the caller's context.
 * @returns The same value narrowed to expression position.
 */
const expressionValue = (value: unknown, name: string, role: string, throwError: ThrowExpressionError): NodeExpr => {
    if (!AST.isStrictNodeExpr(value) && !AST.isNodeList(value)) {
        throwError(`${role} '${name}' is not an expression.`);
    }
    return value;
};

/**
 * Validate a list of evaluated values before exposing them in expression-only slots.
 *
 * @param values Evaluated values to validate.
 * @param namePrefix Prefix used in generated diagnostic names.
 * @param role Diagnostic role for every value.
 * @param throwError Error callback owned by the caller's context.
 * @returns Values narrowed to expression position.
 */
const expressionValues = (values: unknown[], namePrefix: string, role: string, throwError: ThrowExpressionError): NodeExpr[] =>
    values.map((value, index) => expressionValue(value, `${namePrefix}${index + 1}`, role, throwError));

export { expressionValue, expressionValues };
export type { ThrowExpressionError };
