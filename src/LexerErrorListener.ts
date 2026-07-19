import { ErrorListener, RecognitionException, Recognizer } from 'antlr4';

import { SyntaxDiagnostic } from './SyntaxDiagnostic';

/**
 * Converts ANTLR lexer diagnostics into MathJSLab syntax errors.
 *
 * ANTLR emits a few benign end-of-input diagnostics for REPL-style snippets
 * without a trailing separator. Those messages are filtered here so callers see
 * the same accepted language surface as the parser/interpreter pipeline.
 */
class LexerErrorListener extends ErrorListener<number> {
    /**
     * @param source Original source text used to enrich diagnostics.
     */
    public constructor(private readonly source = '') {
        super();
    }

    /**
     * Handle a lexer diagnostic emitted by ANTLR.
     *
     * @param _recognizer Lexer recognizer that produced the diagnostic.
     * @param _offendingSymbol Numeric token/symbol reported by ANTLR.
     * @param line One-based source line.
     * @param column Zero-based source column.
     * @param msg ANTLR diagnostic message.
     * @param _e Recognition exception, when ANTLR provides one.
     */
    syntaxError(_recognizer: Recognizer<number>, _offendingSymbol: number, line: number, column: number, msg: string, _e: RecognitionException | undefined): void {
        if (SyntaxDiagnostic.isBenignEndOfInput(msg)) {
            return;
        }
        throw SyntaxDiagnostic.error(msg, line, column, this.source);
    }
}
export { LexerErrorListener };
export default { LexerErrorListener };
