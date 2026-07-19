/// <reference types="jest" />
import { SyntaxError } from './InterpreterError';
import { SyntaxDiagnostic } from './SyntaxDiagnostic';

describe('SyntaxDiagnostic unit test.', () => {
    it('Should build syntax errors with source excerpts and caret locations.', () => {
        const error = SyntaxDiagnostic.error("no viable alternative at input '@'", 1, 1, '\t@');

        expect(error).toBeInstanceOf(SyntaxError);
        expect(error.message).toBe("syntax error at 1:2: no viable alternative at input '@'\n\t@\n    ^");
    });

    it('Should normalize EOF spellings in parser diagnostics.', () => {
        const error = SyntaxDiagnostic.error('mismatched input EOF expecting END', 2, 7, 'if 1\n  x = 2');

        expect(error.message).toBe('syntax error at 2:8: mismatched input <EOF> expecting END\n  x = 2\n       ^');
    });

    it('Should identify benign end-of-input diagnostics.', () => {
        expect(SyntaxDiagnostic.isBenignEndOfInput("mismatched input '' expecting {';', SP}")).toBe(true);
        expect(SyntaxDiagnostic.isBenignEndOfInput("missing ';' at ''")).toBe(true);
        expect(SyntaxDiagnostic.isBenignEndOfInput("mismatched input '' expecting")).toBe(true);
        expect(SyntaxDiagnostic.isBenignEndOfInput("mismatched input '<EOF>' expecting END")).toBe(false);
    });
});
