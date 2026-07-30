/// <reference types="jest" />
import { SyntaxError } from './InterpreterError';
import { LexerErrorListener } from './LexerErrorListener';

describe('LexerErrorListener unit test.', () => {
    it('Should convert lexer diagnostics to project syntax errors.', () => {
        const listener = new LexerErrorListener('x\n@');

        expect(() => listener.syntaxError({} as never, 0, 2, 0, "token recognition error at: '@'", undefined)).toThrow(SyntaxError);
        expect(() => listener.syntaxError({} as never, 0, 2, 0, "token recognition error at: '@'", undefined)).toThrow("syntax error at 2:1: token recognition error at: '@'\n@\n^");
    });

    it('Should ignore known benign end-of-input diagnostics.', () => {
        const listener = new LexerErrorListener('x');

        expect(() => listener.syntaxError({} as never, 0, 1, 1, "missing ';' at ''", undefined)).not.toThrow();
    });
});
