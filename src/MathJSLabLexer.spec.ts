/// <reference types="jest" />
import { CharStreams, Token } from 'antlr4';
import MathJSLabLexer from './MathJSLabLexer';

describe('MathJSLabLexer unit test.', () => {
    it('Should tokenize a simple MATLAB/Octave-like assignment.', () => {
        const lexer = new MathJSLabLexer(CharStreams.fromString('x = 1;'));
        const tokens = lexer.getAllTokens();

        expect(tokens.map((token) => token.text)).toEqual(['x', '=', '1', ';']);
        expect(tokens.map((token) => token.type)).toEqual([MathJSLabLexer.IDENTIFIER, MathJSLabLexer.EQ, MathJSLabLexer.FLOAT_NUMBER, MathJSLabLexer.SEMICOLON]);
        expect(Token.EOF).toBe(-1);
    });
});
