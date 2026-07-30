/// <reference types="jest" />
import { Token } from 'antlr4';
import { SyntaxError } from './InterpreterError';
import { ParserErrorListener } from './ParserErrorListener';

describe('ParserErrorListener unit test.', () => {
    it('Should convert parser diagnostics to project syntax errors.', () => {
        const listener = new ParserErrorListener('if 1\nend');

        expect(() => listener.syntaxError({} as never, {} as Token, 2, 0, 'mismatched input EOF expecting END', undefined)).toThrow(SyntaxError);
        expect(() => listener.syntaxError({} as never, {} as Token, 2, 0, 'mismatched input EOF expecting END', undefined)).toThrow(
            'syntax error at 2:1: mismatched input <EOF> expecting END\nend\n^',
        );
    });

    it('Should ignore known benign end-of-input diagnostics.', () => {
        const listener = new ParserErrorListener('x');

        expect(() => listener.syntaxError({} as never, {} as Token, 1, 1, "mismatched input '' expecting", undefined)).not.toThrow();
    });
});
