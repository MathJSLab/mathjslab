import type { ExpressionBoundaryValue, NodeInput } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';

type DiagnosticFunctionName = 'warning' | 'error';

type DiagnosticMessageCallbacks = {
    expressionValue(value: unknown, name: string): ExpressionBoundaryValue;
    unparse(value: NodeInput): string;
    throwEvalError(message: string): never;
};

type DiagnosticMessageParts = {
    identifier: string;
    message: string;
};

/**
 * Shared formatting helpers for MATLAB/Octave-style diagnostic functions.
 *
 * `warning` and `error` both accept message-only forms, identifier/message
 * forms, and `sprintf`-style formatting arguments. This module keeps that
 * policy outside `Interpreter` while still delegating value validation and
 * rendering back to the active runtime.
 */
class DiagnosticMessage {
    /**
     * Convert one formatting argument to inserted text.
     *
     * @param value Evaluated formatting argument.
     * @param specifier Conversion specifier.
     * @param callbacks Runtime callbacks for value validation and display.
     * @returns Text inserted into the diagnostic message.
     */
    private static formatArgument(value: NodeInput, specifier: string, callbacks: DiagnosticMessageCallbacks): string {
        const expression = callbacks.expressionValue(value, 'diagnostic format argument');
        if (specifier === 's') {
            return CharString.isInstanceOf(expression) ? expression.str : callbacks.unparse(expression).trimEnd();
        }
        const scalar = MultiArray.isInstanceOf(expression) ? MultiArray.MultiArrayToScalar(expression) : expression;
        if (!Complex.isInstanceOf(scalar) || !Complex.imagIsZero(scalar)) {
            callbacks.throwEvalError('diagnostic format argument must be a real numeric scalar.');
        }
        const numberValue = Complex.realToNumber(scalar);
        switch (specifier) {
            case 'd':
            case 'i':
                return Math.trunc(numberValue).toString();
            case 'f':
                return numberValue.toFixed(6);
            case 'g':
                return numberValue.toString();
            default:
                return callbacks.unparse(expression).trimEnd();
        }
    }

    /**
     * Apply the supported diagnostic formatting subset.
     *
     * Supported conversions are `%s`, `%d`, `%i`, `%f`, `%g`, and `%%`.
     * Width/precision flags are recognized enough to find the conversion;
     * precision currently affects `%f`.
     *
     * @param format Diagnostic format string.
     * @param values Evaluated values inserted into the format string.
     * @param callbacks Runtime callbacks for validation and display.
     * @returns Formatted diagnostic message.
     */
    public static format(format: string, values: NodeInput[], callbacks: DiagnosticMessageCallbacks): string {
        let index = 0;
        return format.replace(/%([-+0 #]*)(\d*)(?:\.(\d+))?([sdifg%])/g, (_match: string, _flags: string, _width: string, precision: string | undefined, specifier: string): string => {
            if (specifier === '%') {
                return '%';
            }
            if (index >= values.length) {
                callbacks.throwEvalError('not enough arguments for diagnostic format string.');
            }
            if (specifier === 'f' && typeof precision !== 'undefined') {
                const expression = callbacks.expressionValue(values[index++], 'diagnostic format argument');
                const scalar = MultiArray.isInstanceOf(expression) ? MultiArray.MultiArrayToScalar(expression) : expression;
                if (!Complex.isInstanceOf(scalar) || !Complex.imagIsZero(scalar)) {
                    callbacks.throwEvalError('diagnostic format argument must be a real numeric scalar.');
                }
                return Complex.realToNumber(scalar).toFixed(Number(precision));
            }
            return this.formatArgument(values[index++], specifier, callbacks);
        });
    }

    /**
     * Split diagnostic arguments into optional identifier, message, and values.
     *
     * A leading string containing `:` is treated as a message identifier when a
     * second string is present. Otherwise the first string is the message
     * format.
     *
     * @param args Evaluated diagnostic arguments.
     * @param functionName Built-in name used in diagnostics.
     * @param charArgument Runtime character-string validator.
     * @param callbacks Runtime callbacks for formatting.
     * @returns Identifier/message pair.
     */
    public static parts(
        args: NodeInput[],
        functionName: DiagnosticFunctionName,
        charArgument: (value: unknown, name: string) => CharString,
        callbacks: DiagnosticMessageCallbacks,
    ): DiagnosticMessageParts {
        const first = charArgument(args[0], `${functionName} identifier or message`);
        if (args.length >= 2) {
            const second = callbacks.expressionValue(args[1], `${functionName} message`);
            if (first.str.includes(':') && CharString.isInstanceOf(second)) {
                return {
                    identifier: first.str,
                    message: this.format(second.str, args.slice(2), callbacks),
                };
            }
        }
        return {
            identifier: '',
            message: this.format(first.str, args.slice(1), callbacks),
        };
    }
}

export type { DiagnosticMessageCallbacks, DiagnosticMessageParts };
export { DiagnosticMessage };
export default { DiagnosticMessage };
