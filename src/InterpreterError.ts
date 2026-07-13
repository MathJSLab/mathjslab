import type { CallFrame } from './CallFrame';

/**
 * # InterpreterError
 *
 * Base class for all evaluation-related errors.
 *
 * This class extends the native `Error` and adds optional
 * support for stack trace frames (`CallFrame[]`), enabling
 * MATLAB/Octave-like error reporting.
 *
 * ## Notes
 *
 * - `stackFrames` is optional to support legacy code paths
 * - Formatting is deferred to `toString()` / `format()`
 */
class InterpreterError extends Error {
    /**
     * Optional call stack snapshot.
     *
     * Top frame should be the first element.
     */
    public readonly stackFrames?: CallFrame[];

    /**
     * Creates a new InterpreterError.
     *
     * @param message - Error message
     * @param stackFrames - Optional stack trace snapshot
     */
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message);
        this.name = 'InterpreterError';
        this.stackFrames = stackFrames;
    }

    /**
     * Formats the error message with optional stack trace.
     *
     * @returns Formatted error string
     */
    public format(): string {
        let result = `Error: ${this.message}`;

        if (!this.stackFrames || this.stackFrames.length === 0) {
            return result;
        }

        const lines: string[] = [];

        for (const frame of this.stackFrames) {
            const name = this.getFrameName(frame);

            // Skip the synthetic global frame and anonymous frames that do not help users locate the error.
            if (!name || name === '<anonymous>') continue;

            let lineInfo = '';

            const site = frame.callSite;

            if (site?.start) {
                const { line, column } = site.start;

                if (line !== undefined && column !== undefined) {
                    lineInfo = ` (line ${line}, column ${column})`;
                } else if (line !== undefined) {
                    lineInfo = ` (line ${line})`;
                }
            }

            lines.push(`Error in ${name}${lineInfo}`);
        }

        if (lines.length > 0) {
            result += '\n' + lines.join('\n');
        }

        return result;
    }

    /**
     * Derives a human-readable name for a frame.
     */
    protected getFrameName(frame: CallFrame): string {
        if (frame.name) return frame.name;

        const func = frame.func;

        if (!func) return '';

        switch (func.type) {
            case 'BUILTIN':
                return func.node.id ?? '<builtin>';

            case 'LAMBDA':
                return '<anonymous>';

            case 'FCNDEF':
                return func.node.id ?? '<function>';

            default:
                return '<unknown>';
        }
    }

    /**
     * Default string representation.
     */
    public toString(): string {
        return this.format();
    }
}

/**
 * # EvalError
 *
 * Represents a general runtime evaluation error.
 *
 * Examples:
 * - invalid operations
 * - domain errors
 */
class EvalError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'EvalError';
    }
}

/**
 * # ReferenceError
 *
 * Represents errors related to undefined identifiers.
 *
 * Examples:
 * - undefined variable
 * - undefined function
 */
class ReferenceError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'ReferenceError';
    }
}

/**
 * # UndefinedReferenceError
 *
 * Represents an unresolved identifier that may be registered as a
 * forward reference when the current evaluation mode allows it.
 */
class UndefinedReferenceError extends ReferenceError {
    public constructor(
        public readonly identifier: string,
        stackFrames?: CallFrame[],
    ) {
        super(`'${identifier}' undefined.`, stackFrames);
        this.name = 'UndefinedReferenceError';
    }
}

/**
 * # CircularReferenceError
 *
 * Represents a circular dependency between unresolved forward references.
 */
class CircularReferenceError extends InterpreterError {
    public constructor(
        public readonly chain: string[],
        stackFrames?: CallFrame[],
    ) {
        super(`Circular reference detected: ${chain.join(' → ')}`, stackFrames);
        this.name = 'CircularReferenceError';
    }
}

/**
 * # SyntaxError
 *
 * Represents syntax-related errors detected during parsing or preprocessing.
 */
class SyntaxError extends InterpreterError {
    public constructor(message: string, stackFrames?: CallFrame[]) {
        super(message, stackFrames);
        this.name = 'SyntaxError';
    }
}

export { InterpreterError, EvalError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError };
