/// <reference types="jest" />
import { CharStreams, CommonTokenStream } from 'antlr4';
import MathJSLabLexer from './MathJSLabLexer';
import MathJSLabParser from './MathJSLabParser';

describe('MathJSLabParser unit test.', () => {
    it('Should parse a simple assignment without syntax errors.', () => {
        const lexer = new MathJSLabLexer(CharStreams.fromString('x = 1;'));
        const parser = new MathJSLabParser(new CommonTokenStream(lexer));
        parser.removeErrorListeners();
        const tree = parser.input();

        expect(tree.node.type).toBe('LIST');
        expect(tree.node.list).toHaveLength(1);
    });

    it('Should parse matrices and cells without interpreter-side AST reload.', () => {
        const lexer = new MathJSLabLexer(CharStreams.fromString('A = [1, 2; 3, 4]; C = {A, 5};'));
        const parser = new MathJSLabParser(new CommonTokenStream(lexer));
        parser.removeErrorListeners();
        const tree = parser.input();

        expect(tree.node.type).toBe('LIST');
        expect(tree.node.list).toHaveLength(2);
    });
});
