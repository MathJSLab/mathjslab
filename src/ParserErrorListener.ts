import { ErrorListener, RecognitionException, Recognizer, Token } from 'antlr4';

import { SyntaxDiagnostic } from './SyntaxDiagnostic';

/**
 * Converts ANTLR parser diagnostics into MathJSLab syntax errors.
 *
 * The parser listener mirrors the lexer listener so syntax errors include a
 * stable location header and, when source text is available, the offending line
 * with a caret. A few REPL-compatible end-of-input diagnostics are ignored.
 */
class ParserErrorListener extends ErrorListener<Token> {
    /**
     * @param source Original source text used to enrich diagnostics.
     */
    public constructor(private readonly source = '') {
        super();
    }

    /**
     * Handle a parser diagnostic emitted by ANTLR.
     *
     * @param _recognizer Parser recognizer that produced the diagnostic.
     * @param _offendingSymbol Token reported by ANTLR.
     * @param line One-based source line.
     * @param column Zero-based source column.
     * @param msg ANTLR diagnostic message.
     * @param _e Recognition exception, when ANTLR provides one.
     */
    syntaxError(_recognizer: Recognizer<Token>, _offendingSymbol: Token, line: number, column: number, msg: string, _e: RecognitionException | undefined): void {
        if (SyntaxDiagnostic.isBenignEndOfInput(msg)) {
            return;
        }
        throw SyntaxDiagnostic.error(msg, line, column, this.source);
    }
}
export { ParserErrorListener };
export default { ParserErrorListener };
