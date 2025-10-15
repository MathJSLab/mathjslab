import { ErrorListener, RecognitionException, Recognizer, Token } from 'antlr4';

class ParserErrorListener extends ErrorListener<Token> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    syntaxError(recognizer: Recognizer<Token>, offendingSymbol: Token, line: number, column: number, msg: string, e: RecognitionException | undefined): void {
        if (msg === "mismatched input '' expecting {';', SP}") {
            // suppress error about missing semicolon at the end of a query
            return;
        }
        if (msg === "missing ';' at ''") {
            return;
        }
        if (msg === "mismatched input '' expecting") {
            return;
        }
        throw new SyntaxError(`${msg} (${line}:${column})`);
    }
}
export { ParserErrorListener };
export default { ParserErrorListener };
