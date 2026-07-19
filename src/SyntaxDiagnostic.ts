import { SyntaxError } from './InterpreterError';

/**
 * Build project-level syntax errors from lexer/parser diagnostics.
 */
class SyntaxDiagnostic {
    /**
     * End-of-input diagnostics that ANTLR may emit for REPL-style snippets that
     * MathJSLab accepts without a trailing separator.
     */
    private static readonly benignEndOfInputMessages = new Set([
        "mismatched input '' expecting {';', SP}",
        "missing ';' at ''",
        "mismatched input '' expecting",
        "mismatched input '' expecting ",
    ]);

    /**
     * Create a syntax error with source location and a one-line excerpt.
     *
     * @param msg ANTLR diagnostic message.
     * @param line One-based source line.
     * @param column Zero-based source column.
     * @param source Original source text, when available.
     * @returns SyntaxError with normalized diagnostic text.
     */
    public static readonly error = (msg: string, line: number, column: number, source = ''): SyntaxError => {
        const header = `syntax error at ${Math.max(1, line)}:${Math.max(1, column + 1)}: ${SyntaxDiagnostic.normalizeMessage(msg)}`;
        const sourceLine = SyntaxDiagnostic.sourceLine(source, line);
        if (!sourceLine) {
            return new SyntaxError(header);
        }
        const caretColumn = SyntaxDiagnostic.displayColumn(sourceLine, column);
        return new SyntaxError(`${header}\n${sourceLine}\n${' '.repeat(caretColumn)}^`);
    };

    /**
     * Test whether an ANTLR diagnostic can be ignored for an accepted EOF form.
     *
     * @param msg ANTLR diagnostic message.
     * @returns `true` when the message is a known benign EOF diagnostic.
     */
    public static readonly isBenignEndOfInput = (msg: string): boolean => SyntaxDiagnostic.benignEndOfInputMessages.has(msg);

    /**
     * Normalize unstable ANTLR message details before exposing them publicly.
     *
     * @param msg ANTLR diagnostic message.
     * @returns Stable diagnostic message.
     */
    private static readonly normalizeMessage = (msg: string): string =>
        msg.replace(/\bEOF\b/g, (match, offset, text) => (text[offset - 1] === '<' && text[offset + match.length] === '>' ? match : '<EOF>'));

    /**
     * Convert a zero-based source column to a rendered caret column.
     *
     * Tabs are preserved in the source excerpt but expanded to four columns for
     * the caret line so diagnostics stay visually aligned in terminals.
     *
     * @param sourceLine Source line text.
     * @param column Zero-based source column.
     * @returns Zero-based display column.
     */
    private static readonly displayColumn = (sourceLine: string, column: number): number => {
        const caretColumn = Math.max(0, Math.min(column, sourceLine.length));
        return [...sourceLine.slice(0, caretColumn)].reduce((count, char) => count + (char === '\t' ? 4 : 1), 0);
    };

    /**
     * Return one source line using ANTLR's one-based line number.
     *
     * @param source Original source text.
     * @param line One-based line number.
     * @returns Source line text, or an empty string when unavailable.
     */
    private static readonly sourceLine = (source: string, line: number): string => source.replace(/\r\n?/g, '\n').split('\n')[line - 1] ?? '';
}

export { SyntaxDiagnostic };
export default { SyntaxDiagnostic };
