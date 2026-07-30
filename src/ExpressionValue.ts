import { AST, type ExpressionBoundaryValue, type RuntimeExpressionValue } from './AST';

/** Callback used by expression-boundary helpers to report runtime errors. */
type ThrowExpressionError = (message: string) => never;

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
const expressionValue = (value: unknown, name: string, role: string, throwError: ThrowExpressionError): ExpressionBoundaryValue => {
    if (!AST.isExpressionBoundaryValue(value)) {
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
const expressionValues = (values: unknown[], namePrefix: string, role: string, throwError: ThrowExpressionError): ExpressionBoundaryValue[] =>
    values.map((value, index) => expressionValue(value, `${namePrefix}${index + 1}`, role, throwError));

/**
 * Validate one evaluated expression and require concrete runtime storage shape.
 *
 * This is stricter than {@link expressionValue}: it rejects parser-only
 * expression carriers such as `NodeList`, ignored targets, and operation nodes.
 * Use it when a value is about to enter runtime containers or validator logic
 * that inspects MATLAB/Octave data rather than syntax.
 *
 * @param value Evaluated value to validate.
 * @param name Diagnostic name for the value.
 * @param role Diagnostic role, such as `Argument value` or `Expression value`.
 * @param throwError Error callback owned by the caller's context.
 * @returns The same value narrowed to concrete runtime position.
 */
const runtimeExpressionValue = (value: unknown, name: string, role: string, throwError: ThrowExpressionError): RuntimeExpressionValue => {
    expressionValue(value, name, role, throwError);
    if (!AST.isRuntimeExpressionValue(value)) {
        throwError(`${role} '${name}' is not a runtime value.`);
    }
    return value;
};

/**
 * Validate a list of concrete runtime expression values.
 *
 * @param values Evaluated values to validate.
 * @param namePrefix Prefix used in generated diagnostic names.
 * @param role Diagnostic role for every value.
 * @param throwError Error callback owned by the caller's context.
 * @returns Values narrowed to concrete runtime position.
 */
const runtimeExpressionValues = (values: unknown[], namePrefix: string, role: string, throwError: ThrowExpressionError): RuntimeExpressionValue[] =>
    values.map((value, index) => runtimeExpressionValue(value, `${namePrefix}${index + 1}`, role, throwError));

/**
 * Return a runtime expression value when the candidate already has that shape.
 *
 * This non-throwing helper is useful for predicate-style built-ins and
 * validators that should simply return false for unsupported value shapes.
 *
 * @param value Candidate value.
 * @returns The value narrowed to concrete runtime position, or `undefined`.
 */
const optionalRuntimeExpressionValue = (value: unknown): RuntimeExpressionValue | undefined => (AST.isRuntimeExpressionValue(value) ? value : undefined);

export { expressionValue, expressionValues, runtimeExpressionValue, runtimeExpressionValues, optionalRuntimeExpressionValue };
export type { ThrowExpressionError };
