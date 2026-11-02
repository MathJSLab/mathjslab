import { CharStream } from 'antlr4';
import MathJSLabLexer from './MathJSLabLexer';
import type { NodeList } from './AST';
import { Interpreter } from './Interpreter';

describe('source coordinates', () => {
    it.each(['.*', './', '.\\', '.^', ".'"])('rewinds both stream and column for %s', (operator) => {
        const source = `12${operator}2; predictions = 3`;
        const tokens = new MathJSLabLexer(new CharStream(source)).getAllTokens();
        for (const token of tokens) {
            expect(token.column).toBe(token.start);
            expect(source.slice(token.start, token.stop + 1)).toBe(token.text);
        }
    });

    it.each(['\n', '\r\n'])('uses finite inclusive ranges with %j', (newline) => {
        const nodes = (Interpreter.Create().Parse(`a = 1./2; b = [1;${newline}2]; c = 3  `) as NodeList).list;
        expect(nodes.map((node) => [node.start, node.stop, !!node.omitOutput])).toEqual([
            [{ line: 1, column: 0 }, { line: 1, column: 8 }, true],
            [{ line: 1, column: 10 }, { line: 2, column: 2 }, true],
            [{ line: 2, column: 4 }, { line: 2, column: 8 }, false],
        ]);
    });

    it('ends at the last token before a newline or EOF', () => {
        const nodes = (Interpreter.Create().Parse('a = 1  \n b = 2   ') as NodeList).list;
        expect(nodes.map((node) => node.stop)).toEqual([
            { line: 1, column: 4 },
            { line: 2, column: 5 },
        ]);
    });

    it.each(['\n', '\r\n'])('locates every classifier command in the original source with %j', (newline) => {
        const commands = [
            'features = [-2,-1,0,1,2];',
            'scores = 2*features-0.5;',
            'probabilities = 1./(1+exp(-scores));',
            'predictions = probabilities >= 0.5;',
            'example_check = all(predictions == [0,0,0,1,1]) && all(probabilities > 0 & probabilities < 1)',
        ];
        const lines = [commands.slice(0, 2).join(' '), commands.slice(2, 4).join(' '), commands[4]];
        const nodes = (Interpreter.Create().Parse(lines.join(newline)) as NodeList).list;
        expect(nodes.map((node) => lines[node.start!.line - 1].slice(node.start!.column, node.stop!.column + 1))).toEqual(commands);
        expect(nodes.map((node) => !!node.omitOutput)).toEqual([true, true, true, true, false]);
    });
});
