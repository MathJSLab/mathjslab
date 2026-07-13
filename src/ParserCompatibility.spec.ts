/// <reference types="jest" />
import { CharString } from './AST';
import { Interpreter } from './Interpreter';

describe('Parser compatibility fixtures.', () => {
    it('Should execute script-like separators, continuations, and comments together.', () => {
        const interpreter = Interpreter.Create();
        const source = ['x = 1+...', '% comment', '2;', 'y = (x', '%{', 'block', '%}', '+ 3);', 'z = y'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=3\ny=6\nz=6\n');
    });

    it('Should parse and execute Octave-like indexing and field names in one script.', () => {
        const interpreter = Interpreter.Create();
        const source = ['A = [10, 20, 30, 40];', 'last = A(end);', 'tail = A(2:end);', 'field.end = last;', 'dyn = "end";', 'again = field.(dyn);'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('A=[10,20,30,40]\nlast=40\ntail=[20,30,40]\nfield=struct {\nend: 40\n}\ndyn=end\nagain=40\n');
    });

    it('Should preserve cell elements as values before chained indexing.', () => {
        const interpreter = Interpreter.Create();
        const source = ['C = {[1, 2, 3], [4; 5; 6]};', 'first = C{1};', 'second = C{2};', 'picked = C{1}(2);'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('C={[1,2,3],[4;\n5;\n6]}\nfirst=[1,2,3]\nsecond=[4;\n5;\n6]\npicked=2\n');
    });

    it('Should keep MATLAB command syntax intact across continuation comments.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });
        const source = ['cmdprobe alpha ...', '% comment', 'beta', 'cmdprobe gamma ... % trailing comment', 'delta', 'cmdprobe epsilon ...', '%{', 'block', '%}', 'zeta'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('alpha|beta\ngamma|delta\nepsilon|zeta\n');
    });

    it('Should parse classdef method prototypes and negated attributes.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PrototypeClass',
            '  properties (~Dependent, !Hidden)',
            '    x',
            '  end',
            '  methods (Abstract)',
            '    y = foo(obj, x)',
            '    bar(obj)',
            '  end',
            'end',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'CLASSDEF PrototypeClass\nPROPERTIES (~Dependent,!Hidden)\nx\nENDPROPERTIES\nMETHODS (Abstract)\ny=foo(obj,x)\nbar(obj)\nENDMETHODS\nENDCLASSDEF\n',
        );
    });

    it('Should parse empty input and output arguments blocks.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = emptyarguments(x)', '  arguments', '  end', '  arguments (Output)', '  end', '  y = x;', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION y=emptyarguments(x)\nARGUMENTS\nENDARGUMENTS\nARGUMENTS (Output)\nENDARGUMENTS\ny=x\nENDFUNCTION\n');
        expect(interpreter.Unparse(interpreter.Execute([source, 'emptyarguments(7)'].join('\n')))).toBe('7\n');
    });
});
