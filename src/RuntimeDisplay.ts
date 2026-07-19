/**
 * Minimal rendering surface required by runtime values.
 *
 * Runtime values should not depend on the concrete `Interpreter` class just to
 * render child values or inspect operator precedence. The interpreter implements
 * this interface, but tests and future renderers can provide smaller objects.
 */
type RuntimeDisplay = {
    /** Operator precedence table used when adding parentheses. */
    precedenceTable: Record<string, number>;
    /** Render a runtime or AST value as source-like text. */
    Unparse(value: unknown, parentPrecedence?: number): string;
    /** Render a runtime or AST value as MathML. */
    UnparserMathML(value: unknown, parentPrecedence?: number): string;
};

/**
 * Minimal evaluation surface required when runtime containers evaluate their
 * child expressions.
 */
type RuntimeEvaluationContext = RuntimeDisplay & {
    /** Evaluate a runtime/AST value inside an optional caller scope. */
    Evaluator(value: unknown, scope?: unknown): unknown;
    /** Comma-list expansion hooks used when array literals evaluate elements. */
    context: {
        pushCommaListExpansion(): void;
        popCommaListExpansion(): void;
        expandCommaSeparatedList(value: unknown): unknown[];
    };
};

export type { RuntimeDisplay, RuntimeEvaluationContext };
