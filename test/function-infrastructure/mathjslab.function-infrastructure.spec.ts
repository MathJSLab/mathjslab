import { Interpreter } from '../../src/Interpreter';

const unparse = (interpreter: Interpreter, source: string): string => interpreter.Unparse(interpreter.Execute(source));

describe('Function infrastructure integration test.', () => {
    describe('Built-in signature validation', () => {
        it('Should enforce declarative signatures across core, configuration and linear algebra functions.', () => {
            const interpreter = Interpreter.Create();

            expect(unparse(interpreter, 'size([1, 2; 3, 4]); size([1, 2; 3, 4], 1); zeros(2, 3); eye([2, 3]); configure("precision", 34); getconfig("precision")')).toBe(
                "[2,2]\n2\n[0,0,0;\n0,0,0]\n[1,0,0;\n0,1,0]\nConfiguration parameter 'precision' set to '34'\n{precision,34}\n",
            );
            expect(() => interpreter.Execute('eye("bad")')).toThrow('Invalid call to eye.');
            expect(() => interpreter.Execute('getconfig(12)')).toThrow('Invalid call to getconfig.');
            expect(() => interpreter.Execute('sum([1, 2], "bad")')).toThrow('Invalid call to sum.');
        });
    });

    describe('User function calls and arguments blocks', () => {
        it('Should combine defaults, name-value arguments, repeating arguments and nargin.', () => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(
                [
                    'function y = scaledwithoption(x, opts)',
                    '  arguments',
                    '    x double',
                    '    opts.Scale (1,1) double {mustBePositive} = 1',
                    '    opts.Offset (1,1) double = 0',
                    '  end',
                    '  y = x * opts.Scale + opts.Offset + nargin;',
                    'end',
                    'function y = countpositive(x, varargin)',
                    '  arguments',
                    '    x double',
                    '  end',
                    '  arguments (Repeating)',
                    '    value double {mustBePositive}',
                    '  end',
                    '  y = nargin + numel(varargin);',
                    'end',
                ].join('\n'),
            );

            expect(unparse(interpreter, 'scaledwithoption(5); scaledwithoption(5, Scale=3, Offset=4); countpositive(1, 2, 3)')).toBe('6\n22\n5\n');
            expect(() => interpreter.Execute('scaledwithoption(5, Scale=-1)')).toThrow("arguments block validation failed for 'opts.Scale': mustBePositive.");
            expect(() => interpreter.Execute('countpositive(1, -2)')).toThrow("arguments block validation failed for 'value{1}': mustBePositive.");
        });

        it('Should validate requested output arguments only when they are requested.', () => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(['function [a, b] = maybeone()', '  arguments (Output)', '    a double', '    b double', '  end', '  a = 1;', 'end'].join('\n'));

            expect(unparse(interpreter, 'x = maybeone()')).toBe('x=1\n');
            expect(() => interpreter.Execute('[x, y] = maybeone()')).toThrow("'b' undefined.");
        });
    });

    describe('Function workspaces and closures', () => {
        it('Should preserve persistent and global workspace behavior across calls.', () => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(['global g', 'g = 3', 'function y = stateful(x)', '  persistent p = 0', '  global g', '  p = p + 1;', '  y = x + p + g;', 'end'].join('\n'));

            expect(unparse(interpreter, 'stateful(10); stateful(10)')).toBe('14\n15\n');
            expect(unparse(interpreter, 'assignin("base", "g", 20); stateful(10)')).toBe('33\n');
        });

        it('Should preserve lexical handles through nested functions and feval.', () => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(['function f = makeadder(a)', '  function y = add(x)', '    y = x + a + nargin + nargout;', '  end', '  f = @add;', 'end'].join('\n'));

            expect(unparse(interpreter, 'h = makeadder(10); feval(h, 5)')).toBe('h=@add\n17\n');
        });

        it('Should let evalin read anonymous closure values while assignin writes to the caller workspace.', () => {
            const interpreter = Interpreter.Create();
            interpreter.Execute(
                [
                    'function f = makeworkspaceprobe(t)',
                    '  f = @(x) evalin("caller", "x + t");',
                    'end',
                    'function y = assigncaller()',
                    '  y = 1;',
                    '  assignin("caller", "outer", 9);',
                    'end',
                ].join('\n'),
            );

            expect(unparse(interpreter, 'probe = makeworkspaceprobe(4); probe(6)')).toBe('probe=@(x) evalin(caller,x + t)\n10\n');
            expect(unparse(interpreter, 'outer = 1; assigncaller(); outer')).toBe('outer=1\n1\n9\n');
        });
    });
});
