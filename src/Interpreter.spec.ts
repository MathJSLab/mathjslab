/// <reference types="jest" />
import path from 'node:path';
import { CircularReferenceError, EvalError, Interpreter, InterpreterError, ReferenceError, SyntaxError, UndefinedReferenceError } from './Interpreter';
import { CharString, ClassDefinition } from './AST';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

/**
 * Shared interpreter used by the basic construction and evaluation tests.
 */
let interpreter: Interpreter;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    beforeAll(() => {
        interpreter = Interpreter.Create();
    });

    describe('Behavior', () => {
        it(`${unitName} should be defined and instantiated.`, () => {
            expect(Interpreter).toBeDefined();
            expect(interpreter).toBeInstanceOf(Interpreter);
        });

        it('Should export the public interpreter error hierarchy.', () => {
            expect(new EvalError('eval')).toBeInstanceOf(InterpreterError);
            expect(new ReferenceError('reference')).toBeInstanceOf(InterpreterError);
            expect(new UndefinedReferenceError('x')).toBeInstanceOf(ReferenceError);
            expect(new CircularReferenceError(['A', 'B', 'A'])).toBeInstanceOf(InterpreterError);
            expect(new SyntaxError('syntax')).toBeInstanceOf(InterpreterError);
        });

        it('Should parse, evaluate and unparse a simple real expression.', () => {
            const tree = interpreter.Parse('1+2*3');
            const value = interpreter.Evaluate(tree);
            const unparsed = interpreter.Unparse(tree);
            expect(value.list[0].re.toNumber()).toBe(7);
            expect(unparsed === '1+2*3\n').toBe(true);
        });

        it('Should continue logical lines with ellipsis without requiring leading whitespace.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n% comment\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n%{\nblock\n%}\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n\n2; x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1,...\n2]; A'))).toBe('A=[1,2]\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1,...\n%{\nblock\n%}\n2]; A'))).toBe('A=[1,2]\n[1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute(['f = @(x, y) x + y;', 'f(1,...', '2)'].join('\n')))).toBe('f=@(x,y) x+y\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = sin(...\n0)'))).toBe('x=0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 1+...\n2\n% comment\ny = 3; x + y'))).toBe('x=3\ny=3\n6\n');
        });

        it('Should continue logical lines inside parentheses.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n+ 2); x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = sin(\n0\n); x'))).toBe('x=0\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [10, 20, 30]; x = A(\n2\n); x'))).toBe('A=[10,20,30]\nx=20\n20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n% comment\n+ 2); x'))).toBe('x=3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = (1\n%{\nblock\n%}\n+ 2); x'))).toBe('x=3\n3\n');
            localInterpreter.Execute(['function y = addtwolines(a, b)', '  y = a + b;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = addtwolines(1,\n2); x'))).toBe('x=3\n3\n');
        });

        it('Should evaluate a switch case that matches the selector.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 2;', 'switch x', 'case 1', '  y = 10;', 'case 2', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=2\n20\n20\n');
        });

        it('Should evaluate switch otherwise when no case matches.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case 1', '  y = 10;', 'case 2', '  y = 20;', 'otherwise', '  y = 30;', 'endswitch', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n30\n30\n');
        });

        it('Should match switch cases against cell-array alternatives.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case {1, 2}', '  y = 10;', 'case {3, 4}', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n20\n20\n');
        });

        it('Should skip switch cell-array cases when no element matches.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 5;', 'switch x', 'case {1, 2}', '  y = 10;', 'case {3, 4}', '  y = 20;', 'otherwise', '  y = 30;', 'end', 'y'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=5\n30\n30\n');
        });

        it('Should allow a switch without a matching case or otherwise.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['x = 3;', 'switch x', 'case 1', '  y = 10;', 'end', 'x'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('x=3\n3\n');
        });

        it('Should evaluate a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 3', '  x = x + 1;', '  s = s + x;', 'endwhile'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should continue a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 5', '  x = x + 1;', '  if x == 3', '    continue', '  endif', '  s = s + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a while loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'while x < 5', '  x = x + 1;', '  if x == 3', '    break', '  endif', '  s = s + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should evaluate a do until loop at least once.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 10;', 'do', '  x = x + 1;', 'until x > 0'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('11\n');
        });

        it('Should evaluate a do until loop until its condition is true.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  s = s + x;', 'until x >= 3'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should continue a do until loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  if x == 3', '    continue', '  endif', '  s = s + x;', 'until x >= 5'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a do until loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 's = 0;', 'do', '  x = x + 1;', '  if x == 3', '    break', '  endif', '  s = s + x;', 'until x >= 5'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should evaluate a for loop over a range.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:3', '  s = s + i;', 'endfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a for loop over a row vector.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = [10, 20, 30]', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('60\n');
        });

        it('Should evaluate for loops over matrix columns.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['count = 0;', 'last = 0;', 'for v = [1, 3; 2, 4]', '  count = count + 1;', '  last = v(2);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('count; last'))).toBe('2\n4\n');
        });

        it('Should evaluate complex for loop targets.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['for [a, b] = [1, 3; 2, 4]', '  s = a + b;', 'end'].join('\n')))).toBe('FOR [a,b]=[1,3;\n2,4]\ns=a+b\n\nENDFOR\n');
            localInterpreter.Execute(['total = 0;', 'for [a, b] = [1, 3; 2, 4]', '  total = total + a * b;', 'end'].join('\n'));
            localInterpreter.Execute(['last = 0;', 'for [~, b] = [1, 3; 2, 4]', '  last = b;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('total; last'))).toBe('14\n4\n');
        });

        it('Should continue a for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:5', '  if i == 3', '    continue', '  endif', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('12\n');
        });

        it('Should break out of a for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for i = 1:5', '  if i == 3', '    break', '  endif', '  s = s + i;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('3\n');
        });

        it('Should assign for loop values to a structure field target.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['for s.value = 1:3', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s.value'))).toBe('3\n');
        });

        it('Should assign for loop values to an indexed target.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['A = [0, 0];', 'for A(2) = 1:3', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('A(2)'))).toBe('3\n');
        });

        it('Should evaluate a parenthesized for loop.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'for (i = 1:3)', '  s = s + i;', 'endfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a parfor loop sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'parfor i = 1:3', '  s = s + i;', 'endparfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should evaluate a parenthesized parfor loop with a worker expression.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['s = 0;', 'parfor (i = 1:3, 2)', '  s = s + i;', 'endparfor'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('s'))).toBe('6\n');
        });

        it('Should parse and evaluate an spmd block sequentially.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['spmd', '  x = 1;', '  y = x + 2;', 'endspmd'].join('\n')))).toBe('SPMD\nx=1\ny=x+2\n\nENDSPMD\n');
            localInterpreter.Execute(['x = 0;', 'spmd', '  x = x + 1;', '  y = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x; y'))).toBe('1\n3\n');
        });

        it('Should not treat spmd as a loop for break and continue.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['spmd', '  break', 'endspmd'].join('\n'))).toThrow('break is only valid inside a loop.');
            expect(() => localInterpreter.Execute(['spmd', '  continue', 'endspmd'].join('\n'))).toThrow('continue is only valid inside a loop.');
        });

        it('Should reject break and continue outside loops.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('break')).toThrow('break is only valid inside a loop.');
            expect(() => localInterpreter.Execute('continue')).toThrow('continue is only valid inside a loop.');
        });

        it('Should evaluate a try body when no error is thrown.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  x = 1;', 'catch', '  x = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('1\n');
        });

        it('Should evaluate a catch body when the try body throws.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['try', '  x = missing + 1;', 'catch', '  x = 2;', 'end_try_catch'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should bind a MATLAB-like catch identifier.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['try', '  missing;', 'catch ME', '  msg = ME.message;', 'end'].join('\n')))).toBe(
                'TRY\nmissing\n\nCATCH ME\nmsg=ME.message\n\nEND_TRY_CATCH\n',
            );
            localInterpreter.Execute(['try', '  missing;', 'catch ME', '  msg = ME.message;', '  id = ME.identifier;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('msg; id'))).toBe("'missing' undefined.\nmissing\n");
        });

        it('Should let errors thrown by a catch body propagate.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['try', '  missing;', 'catch', '  alsoMissing;', 'end'].join('\n'))).toThrow("'alsoMissing' undefined.");
        });

        it('Should ignore try errors when no catch body is provided.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 1;', 'try', '  missing;', 'end', 'x = x + 1;'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should not catch return inside a function.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = tryreturn()', '  y = 1;', '  try', '    return', '  catch', '    y = 2;', '  end', '  y = 3;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('tryreturn()'))).toBe('1\n');
        });

        it('Should run unwind cleanup after a successful body.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['x = 0;', 'unwind_protect', '  x = 1;', 'unwind_protect_cleanup', '  x = x + 1;', 'end_unwind_protect'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('2\n');
        });

        it('Should run unwind cleanup before propagating a body error.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['x = 0;', 'unwind_protect', '  missing;', 'unwind_protect_cleanup', '  x = 3;', 'end'].join('\n'))).toThrow("'missing' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('x'))).toBe('3\n');
        });

        it('Should let unwind cleanup errors override body errors.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['unwind_protect', '  missing;', 'unwind_protect_cleanup', '  alsoMissing;', 'end_unwind_protect'].join('\n'))).toThrow(
                "'alsoMissing' undefined.",
            );
        });

        it('Should run unwind cleanup before returning from a function.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['function y = unwindreturn()', '  y = 1;', '  unwind_protect', '    return', '  unwind_protect_cleanup', '    y = y + 1;', '  end', '  y = 10;', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('unwindreturn()'))).toBe('2\n');
        });

        it('Should parse and unparse an empty classdef.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef EmptyClass', 'end'].join('\n')))).toBe('CLASSDEF EmptyClass\nENDCLASSDEF\n');
        });

        it('Should parse classdef attributes and superclass lists.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef (Abstract) Child < Base', 'end'].join('\n')))).toBe('CLASSDEF (Abstract) Child < Base\nENDCLASSDEF\n');
        });

        it('Should parse qualified class names and superclass lists.', () => {
            const localInterpreter = Interpreter.Create();
            const tree = localInterpreter.Parse(['classdef pkg.Child < pkg.Base, handle', 'end'].join('\n')) as any;
            const classNode = tree.list[0];

            expect(localInterpreter.Unparse(tree)).toBe('CLASSDEF pkg.Child < pkg.Base,handle\nENDCLASSDEF\n');
            expect(classNode.id).toBe('pkg.Child');
            expect(classNode.superclasses.map((node: any) => node.id)).toEqual(['pkg.Base', 'handle']);
        });

        it('Should parse classdef properties sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Point', '  properties', '    x = 1;', '    y', '  end', 'endclassdef'].join('\n')))).toBe(
                'CLASSDEF Point\nPROPERTIES\nx=1\ny\nENDPROPERTIES\nENDCLASSDEF\n',
            );
        });

        it('Should parse classdef section attributes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Parse(
                        [
                            'classdef Decorated',
                            '  properties (Access = private)',
                            '    x = 1;',
                            '  end',
                            '  methods (Static)',
                            '    function y = f()',
                            '      y = 2;',
                            '    end',
                            '  end',
                            'end',
                        ].join('\n'),
                    ),
                ),
            ).toBe('CLASSDEF Decorated\nPROPERTIES (Access=private)\nx=1\nENDPROPERTIES\nMETHODS (Static)\nFUNCTION y=f()\ny=2\nENDFUNCTION\nENDMETHODS\nENDCLASSDEF\n');
        });

        it('Should expose normalized class attribute tables in the AST.', () => {
            const localInterpreter = Interpreter.Create();
            const tree = localInterpreter.Parse(
                ['classdef (Abstract, Sealed) AttributeDemo', '  methods (Static, Access = private)', '    function y = f()', '      y = 2;', '    end', '  end', 'end'].join('\n'),
            ) as any;
            const classNode = tree.list[0];
            const methodsSection = classNode.sections[0];

            expect(classNode.attributeTable.Abstract[0].value).toBeNull();
            expect(classNode.attributeTable.Sealed[0].value).toBeNull();
            expect(methodsSection.attributeTable.Static[0].value).toBeNull();
            expect(methodsSection.attributeTable.Access[0].value.id).toBe('private');
        });

        it('Should parse classdef methods sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(localInterpreter.Parse(['classdef Counter', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'))),
            ).toBe('CLASSDEF Counter\nMETHODS\nFUNCTION y=value(obj)\ny=1\nENDFUNCTION\nENDMETHODS\nENDCLASSDEF\n');
        });

        it('Should parse classdef events sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Signal', '  events (ListenAccess = public)', '    Changed', '    Reset', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF Signal\nEVENTS (ListenAccess=public)\nChanged\nReset\nENDEVENTS\nENDCLASSDEF\n',
            );
        });

        it('Should parse classdef enumeration sections.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse(['classdef Color', '  enumeration', '    Red', '    Blue(2)', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF Color\nENUMERATION\nRed\nBlue(2)\nENDENUMERATION\nENDCLASSDEF\n',
            );
        });

        it('Should evaluate classdef structurally without executing members.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute(['classdef StoredClass', '  properties', '    x = missing;', '  end', 'end'].join('\n')))).toBe(
                'CLASSDEF StoredClass\nPROPERTIES\nx=missing\nENDPROPERTIES\nENDCLASSDEF\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('StoredClass'))).toBe('CLASSDEF StoredClass\nPROPERTIES\nx=missing\nENDPROPERTIES\nENDCLASSDEF\n');
        });

        it('Should register classdef as a runtime class definition.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef RuntimeClass',
                    '  properties (Access = private)',
                    '    value = 1;',
                    '  end',
                    '  methods (Static)',
                    '    function y = make()',
                    '      y = 1;',
                    '    end',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.value;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            const definition = (localInterpreter.Execute('RuntimeClass') as any).list[0] as ClassDefinition;

            expect(ClassDefinition.isInstanceOf(definition)).toBe(true);
            expect(definition.properties[0].access).toBe('private');
            expect(definition.staticMethods.map((method) => method.name)).toEqual(['make']);
            expect(definition.instanceMethods.map((method) => method.name)).toEqual(['read']);
            expect(definition.methodsByAccess.public.map((method) => method.name)).toEqual(['make', 'read']);
        });

        it('Should instantiate a class with default property values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef Point', '  properties', '    x = 3;', '    y', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = Point()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(p.y)'))).toBe('true\n');
        });

        it('Should evaluate class property defaults when instantiating.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NeedsDefault', '  properties', '    x = missingDefault;', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('NeedsDefault()')).toThrow("'missingDefault' undefined.");
        });

        it('Should assign class instance properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef MutablePoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = MutablePoint()');
            localInterpreter.Execute('p.x = 10');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
        });

        it('Should reject assignment to undeclared class instance properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef StrictPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('p = StrictPoint()');

            expect(() => localInterpreter.Execute('p.y = 10')).toThrow("unknown property 'y' for class StrictPoint.");
        });

        it('Should run class constructors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ConstructedPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = ConstructedPoint(x)',
                    '      obj.x = x;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('p = ConstructedPoint(5)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('5\n');
        });

        it('Should reject constructor arguments when no constructor method exists.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PlainClass', '  properties', '    x = 0;', '  end', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('PlainClass(5)')).toThrow('constructor arguments are not supported yet for class PlainClass.');
        });

        it('Should call class instance methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ReadablePoint',
                    '  properties',
                    '    x = 4;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = plusx(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('p = ReadablePoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.read()'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p.plusx(6)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('read(p)'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusx(p, 6)'))).toBe('10\n');
            expect(() => localInterpreter.Execute('missingmethod(p)')).toThrow("unknown method 'missingmethod' for class ReadablePoint.");
        });

        it('Should use value semantics for class instance methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef ValuePoint', '  properties', '    x = 0;', '  end', '  methods', '    function obj = setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('p = ValuePoint()');
            localInterpreter.Execute('p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('0\n');

            localInterpreter.Execute('p = p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
        });

        it('Should use reference semantics for handle classes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef HandlePoint < handle', '  properties', '    x = 0;', '  end', '  methods', '    function setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('p = HandlePoint()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('p.setX(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('q.x'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(p, 'handle')"))).toBe('true\n');
        });

        it('Should delete handle class instances.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef DisposablePoint < handle', '  properties', '    x = 0;', '  end', '  methods', '    function setX(obj, x)', '      obj.x = x;', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute('p = DisposablePoint()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('delete(p)');

            expect(() => localInterpreter.Execute('p.x')).toThrow('invalid or deleted object for class DisposablePoint.');
            expect(() => localInterpreter.Execute('q.setX(3)')).toThrow('invalid or deleted object for class DisposablePoint.');
            expect(() => localInterpreter.Execute('delete(q)')).toThrow('invalid or deleted object for class DisposablePoint.');
        });

        it('Should call handle class delete methods before invalidating instances.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ThrowingDelete < handle', '  methods', '    function delete(obj)', '      missingDeleteHook();', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute('t = ThrowingDelete()');

            expect(() => localInterpreter.Execute('delete(t)')).toThrow("'missingDeleteHook' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(t, 'ThrowingDelete')"))).toBe('true\n');
        });

        it('Should report handle validity.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ValidHandle()');
            localInterpreter.Execute('q = p');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(p)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == q'))).toBe('true\n');
            localInterpreter.Execute('delete(p)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(q)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == q'))).toBe('true\n');
        });

        it('Should report validity for handle arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ValidHandleArray < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ValidHandleArray()');
            localInterpreter.Execute('q = ValidHandleArray()');
            localInterpreter.Execute('handles = [p, q]');
            localInterpreter.Execute('delete(p)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(handles)'))).toBe('[false,true]\n');
        });

        it('Should compare handle arrays by identity.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ComparableHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = ComparableHandle()');
            localInterpreter.Execute('q = ComparableHandle()');
            localInterpreter.Execute('handles = [p, q]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('handles == p'))).toBe('[true,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('p == handles'))).toBe('[true,false]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('handles ~= q'))).toBe('[true,false]\n');
            expect(() => localInterpreter.Execute('handles == 1')).toThrow("binary operator 'eq' not implemented for class instance operands.");
        });

        it('Should report objects and compare handles with isequal.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EqualHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute('p = EqualHandle()');
            localInterpreter.Execute('q = p');
            localInterpreter.Execute('r = EqualHandle()');
            localInterpreter.Execute('handles = [p, r]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(p)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(handles)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(1)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, q)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, r)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(handles, [p, r])'))).toBe('true\n');
            localInterpreter.Execute('delete(p)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(p, q)'))).toBe('true\n');
        });

        it('Should compare value class instances with isequal.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EqualValue', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = EqualValue()');
            localInterpreter.Execute('b = EqualValue()');
            localInterpreter.Execute('c = EqualValue()');
            localInterpreter.Execute('c.x = 1');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(a)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(a, b)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal(a, c)'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isequal([a, b], [a, b])'))).toBe('true\n');
        });

        it('Should dispatch class equality operator methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef OverloadedEquality',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = eq(obj, other)',
                    "      if isa(other, 'OverloadedEquality')",
                    '        y = obj.x == other.x;',
                    '      else',
                    '        y = obj.x == other;',
                    '      end',
                    '    end',
                    '    function y = ne(obj, other)',
                    '      y = !(obj == other);',
                    '    end',
                    '    function y = plus(obj, other)',
                    "      if isa(other, 'OverloadedEquality')",
                    '        y = obj.x + other.x;',
                    '      else',
                    '        y = obj.x + other;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = OverloadedEquality()');
            localInterpreter.Execute('b = OverloadedEquality()');
            localInterpreter.Execute('c = OverloadedEquality()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 3');
            localInterpreter.Execute('c.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a == b'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a ~= c'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a == 3'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('3 == a'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a + c'))).toBe('7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('2 + a'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, c] + 1'))).toBe('[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('1 + [a, c]'))).toBe('[4,5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, c] + [b, c]'))).toBe('[6,8]\n');
        });

        it('Should dispatch class unary operator methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef OverloadedUnary',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = uplus(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = uminus(obj)',
                    '      y = -obj.x;',
                    '    end',
                    '    function y = not(obj)',
                    '      y = obj.x == 0;',
                    '    end',
                    '    function y = transpose(obj)',
                    '      y = obj.x + 10;',
                    '    end',
                    '    function y = ctranspose(obj)',
                    '      y = obj.x + 20;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = OverloadedUnary()');
            localInterpreter.Execute('b = OverloadedUnary()');
            localInterpreter.Execute('z = OverloadedUnary()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('+a'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('-a'))).toBe('-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('~a'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("a.'"))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("a'"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('-[a, b]'))).toBe('[-3,-4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('~[a, z]'))).toBe('[false,true]\n');
        });

        it('Should call methods on class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayMethodPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = add(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayMethodPoint()');
            localInterpreter.Execute('b = ArrayMethodPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].read()'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b].add(10)'))).toBe('[13,14]\n');
        });

        it('Should expand class instance array method calls for multiple outputs.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayMethodListPoint',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = add(obj, n)',
                    '      y = obj.x + n;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayMethodListPoint()');
            localInterpreter.Execute('b = ArrayMethodListPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('[first, second] = objs.read()');
            localInterpreter.Execute('[plusFirst, plusSecond] = objs.add(10)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.read()'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusFirst'))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('plusSecond'))).toBe('14\n');
            expect(() => localInterpreter.Execute('[one, two, three] = objs.read()')).toThrow('element number 3 undefined in return list');
        });

        it('Should expand class instance array properties for multiple outputs.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ArrayPropertyPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ArrayPropertyPoint()');
            localInterpreter.Execute('b = ArrayPropertyPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('[first, second] = objs.x');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('4\n');
            expect(() => localInterpreter.Execute('[one, two, three] = objs.x')).toThrow('element number 3 undefined in return list');
        });

        it('Should assign class instance array properties element-wise.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ArrayPropertyAssignmentPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('b = ArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('objs.x = [10, 20]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[10,20]\n');

            localInterpreter.Execute('objs.x = 7');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[7,7]\n');
            expect(() => localInterpreter.Execute('objs.x = [1, 2, 3]')).toThrow('assignment value count 3 does not match object array length 2.');
        });

        it('Should assign indexed class instance array properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef IndexedArrayPropertyAssignmentPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('b = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('c = IndexedArrayPropertyAssignmentPoint()');
            localInterpreter.Execute('objs = [a, b, c]');

            localInterpreter.Execute('objs(2).x = 20');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[0,20,0]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2).x'))).toBe('20\n');

            localInterpreter.Execute('objs([1, 3]).x = [10, 30]');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[10,20,30]\n');

            localInterpreter.Execute('objs([1, 3]).x = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.x'))).toBe('[5,20,5]\n');
            expect(() => localInterpreter.Execute('objs([1, 3]).x = [1, 2, 3]')).toThrow('assignment value count 3 does not match selected object count 2.');
        });

        it('Should assign nested class properties through structure and object values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NestedChildValue', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef NestedPropertyBox', '  properties', '    s', '    child = NestedChildValue();', '  end', 'end'].join('\n'));
            localInterpreter.Execute('box = NestedPropertyBox()');

            localInterpreter.Execute('box.s.a = 3');
            localInterpreter.Execute('box.child.x = 7');

            expect(localInterpreter.Unparse(localInterpreter.Execute('box.s.a; box.child.x'))).toBe('3\n7\n');
        });

        it('Should assign nested class properties across object arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef NestedArrayPropertyBox', '  properties', '    s', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = NestedArrayPropertyBox()');
            localInterpreter.Execute('b = NestedArrayPropertyBox()');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('objs.s.a = [10, 20]');
            localInterpreter.Execute('objs.s.b = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs.s.a; objs.s.b'))).toBe('10\n20\n5\n5\n');
            expect(() => localInterpreter.Execute('objs.s.c = [1, 2, 3]')).toThrow('assignment value count 3 does not match object array length 2.');
        });

        it('Should concatenate only homogeneous class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef HomogeneousArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef OtherHomogeneousArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = HomogeneousArrayPoint()');
            localInterpreter.Execute('b = HomogeneousArrayPoint()');
            localInterpreter.Execute('a.x = 3');
            localInterpreter.Execute('b.x = 4');

            localInterpreter.Execute('row = [a, b]');
            localInterpreter.Execute('column = [a; b]');
            localInterpreter.Execute('pages = cat(3, a, b)');
            localInterpreter.Execute('page = pages(:, :, 2)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('row.x'))).toBe('[3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('column.x'))).toBe('[3;\n4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('page.x'))).toBe('4\n');
            expect(() => localInterpreter.Execute('[HomogeneousArrayPoint(), OtherHomogeneousArrayPoint()]')).toThrow('object arrays must contain objects of the same class.');
            expect(() => localInterpreter.Execute('[HomogeneousArrayPoint(); OtherHomogeneousArrayPoint()]')).toThrow('object arrays must contain objects of the same class.');
            expect(() => localInterpreter.Execute('horzcat(HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow(
                'horzcat: object arrays must contain objects of the same class.',
            );
            expect(() => localInterpreter.Execute('vertcat(HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow(
                'vertcat: object arrays must contain objects of the same class.',
            );
            expect(() => localInterpreter.Execute('cat(3, HomogeneousArrayPoint(), OtherHomogeneousArrayPoint())')).toThrow('cat: object arrays must contain objects of the same class.');
        });

        it('Should reshape, repeat, logically index, assign and delete class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ShapeArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('a = ShapeArrayPoint()');
            localInterpreter.Execute('b = ShapeArrayPoint()');
            localInterpreter.Execute('a.x = 1');
            localInterpreter.Execute('b.x = 2');
            localInterpreter.Execute('objs = [a, b]');

            localInterpreter.Execute('reshaped = reshape(objs, 2, 1)');
            localInterpreter.Execute('picked = objs([true, false])');
            localInterpreter.Execute('objs([false, true]).x = 9');
            localInterpreter.Execute('objs([true, false]) = []');
            localInterpreter.Execute('repeated = repmat(a, 1, 2)');
            localInterpreter.Execute('repeated(2).x = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('reshaped.x'))).toBe('[1;\n2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('picked.x'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('numel(objs); objs(1).x'))).toBe('1\n9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('repeated.x'))).toBe('[1,5]\n');
        });

        it('Should preallocate class instance arrays without numeric holes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef PreallocatedArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));
            localInterpreter.Execute('objs(3) = PreallocatedArrayPoint()');
            localInterpreter.Execute('objs(2).x = 5');
            localInterpreter.Execute('grid(2, 2) = PreallocatedArrayPoint()');
            localInterpreter.Execute('grid(1, 1).x = 7');

            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(objs); objs.x'))).toBe('true\n[0,5,0]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(grid); grid.x'))).toBe('true\n[7,0;\n0,0]\n');
        });

        it('Should dispatch class subsref methods for indexed references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef IndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      if numel(s) == 2',
                    "        if isequal(s(1).type, '()')",
                    '          y = obj.x + s(1).subs{1} + 100;',
                    '        else',
                    '          y = obj.x + s(2).subs{1} + 200;',
                    '        end',
                    "      elseif isequal(s.type, '()')",
                    "        if isequal(s.subs{1}, ':')",
                    '          y = obj.x + 100;',
                    '        else',
                    '          y = obj.x + s.subs{1};',
                    '        end',
                    '      else',
                    '        y = obj.x + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = IndexedValue()');
            localInterpreter.Execute('a.x = 10');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a(5)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(:)'))).toBe('110\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a{7}'))).toBe('17\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(5).virtual'))).toBe('115\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.virtual(7)'))).toBe('217\n');
        });

        it('Should dispatch class end methods for indexed references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef EndIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = end(obj, k, n)',
                    '      y = obj.x + 10 * k + n;',
                    '    end',
                    '    function y = subsref(obj, s)',
                    '      if numel(s.subs) == 1',
                    '        y = s.subs{1};',
                    '      else',
                    '        y = s.subs{2};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = EndIndexedValue()');
            localInterpreter.Execute('a.x = 5');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a(end)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a(1, end)'))).toBe('27\n');
        });

        it('Should dispatch multiple outputs from class subsref using numArgumentsFromSubscript.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef MultiOutputIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      if isequal(context, "subsref")',
                    '        n = 2;',
                    '      else',
                    '        n = 1;',
                    '      end',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      if numel(s) == 2',
                    '        a = obj.x + s(1).subs{1} + 100;',
                    '        if isequal(s(2).type, ".")',
                    '          b = obj.x + s(1).subs{1} + 200;',
                    '        else',
                    '          b = obj.x + s(2).subs{1} + 200;',
                    '        end',
                    '      else',
                    '        a = obj.x + s.subs{1};',
                    '        b = obj.x + s.subs{1} + 10;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = MultiOutputIndexedValue()');
            localInterpreter.Execute('a.x = 5');

            localInterpreter.Execute('[first, second] = a(3)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('first'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('second'))).toBe('18\n');

            localInterpreter.Execute('[chainedFirst, chainedSecond] = a(3).virtual');
            expect(localInterpreter.Unparse(localInterpreter.Execute('chainedFirst'))).toBe('108\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('chainedSecond'))).toBe('208\n');
        });

        it('Should reject too many class subsref outputs using numArgumentsFromSubscript.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef LimitedOutputIndexedValue',
                    '  methods',
                    '    function n = numArgumentsFromSubscript(obj, s, context)',
                    '      n = 1;',
                    '    end',
                    '    function [a, b] = subsref(obj, s)',
                    '      a = 10;',
                    '      b = 20;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = LimitedOutputIndexedValue()');

            expect(() => localInterpreter.Execute('[first, second] = a(1)')).toThrow('element number 2 undefined in return list');
        });

        it('Should dispatch class subsasgn methods for indexed assignments.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef AssignedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function obj = subsasgn(obj, s, value)',
                    '      if numel(s) == 2',
                    "        if isequal(s(1).type, '()')",
                    '          obj.x = value + s(1).subs{1} + 100;',
                    '        else',
                    '          obj.x = value + s(2).subs{1} + 200;',
                    '        end',
                    "      elseif isequal(s.type, '()')",
                    "        if isequal(s.subs{1}, ':')",
                    '          obj.x = value + 100;',
                    '        else',
                    '          obj.x = value + s.subs{1};',
                    '        end',
                    '      else',
                    '        obj.x = value + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = AssignedValue()');

            localInterpreter.Execute('a(5) = 12');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('17\n');

            localInterpreter.Execute('a(:) = 1');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('101\n');

            localInterpreter.Execute('a{7} = 20');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('27\n');

            localInterpreter.Execute('a(5).virtual = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('115\n');

            localInterpreter.Execute('a.virtual(7) = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('217\n');
        });

        it('Should dispatch class subsref methods for selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ArrayIndexedOverload',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    '      if numel(s) == 2',
                    '        y = 1000 + s(1).subs{1};',
                    '      else',
                    '        y = 10 + s.subs{1};',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = ArrayIndexedOverload()');
            localInterpreter.Execute('b = ArrayIndexedOverload()');
            localInterpreter.Execute('a.x = 1');
            localInterpreter.Execute('b.x = 2');
            localInterpreter.Execute('objs = [a, b]');

            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2)'))).toBe('12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('objs(2).virtual'))).toBe('1002\n');
        });

        it('Should dispatch class subsasgn methods for selected object array elements.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef ArrayAssignedOverload', '  methods', '    function obj = subsasgn(obj, s, value)', '      obj = value;', '    end', '  end', 'end'].join('\n'),
            );
            localInterpreter.Execute('a = ArrayAssignedOverload()');
            localInterpreter.Execute('b = ArrayAssignedOverload()');
            localInterpreter.Execute('objs = [a, b]');

            expect(() => localInterpreter.Execute('objs(2) = 5')).toThrow('subsasgn for class ArrayAssignedOverload must return an object of class ArrayAssignedOverload.');
        });

        it('Should dispatch class subsref and subsasgn methods for dot references.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef DotIndexedValue',
                    '  properties',
                    '    x = 0;',
                    '  end',
                    '  methods',
                    '    function y = subsref(obj, s)',
                    "      if isequal(s.type, '.') && isequal(s.subs{1}, 'virtual')",
                    '        y = obj.x + 10;',
                    '      else',
                    '        y = obj.x;',
                    '      end',
                    '    end',
                    '    function obj = subsasgn(obj, s, value)',
                    "      if isequal(s.type, '.') && isequal(s.subs{1}, 'virtual')",
                    '        obj.x = value + 20;',
                    '      else',
                    '        obj.x = value;',
                    '      end',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = DotIndexedValue()');
            localInterpreter.Execute('a.x = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.virtual'))).toBe('13\n');
            localInterpreter.Execute('a.virtual = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.x'))).toBe('25\n');
        });

        it('Should call class static methods.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef StaticCalculator',
                    '  methods (Static)',
                    '    function y = add(a, b)',
                    '      y = a + b;',
                    '    end',
                    '  end',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('StaticCalculator.add(2, 3)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('StaticCalculator.value()')).toThrow("unknown static method 'value' for class StaticCalculator.");
        });

        it('Should create empty class instance arrays.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef EmptyArrayPoint', '  properties', '    x = 0;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty()'))).toBe('[ ](0x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty(0, 2)'))).toBe('[ ](0x2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('EmptyArrayPoint.empty([2, 0])'))).toBe('[ ](2x0)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(EmptyArrayPoint.empty(0, 1))'))).toBe('true\n');
            expect(() => localInterpreter.Execute('EmptyArrayPoint.empty(1, 1)')).toThrow('EmptyArrayPoint.empty requires at least one zero dimension.');
            expect(() => localInterpreter.Execute('EmptyArrayPoint.empty(-1, 0)')).toThrow('EmptyArrayPoint.empty dimensions must be nonnegative integer scalars.');
        });

        it('Should enforce private class member access.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef SecretBox',
                    '  properties (Access = private)',
                    '    x = 7;',
                    '  end',
                    '  methods',
                    '    function y = read(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = reveal(obj)',
                    '      y = obj.hidden();',
                    '    end',
                    '  end',
                    '  methods (Access = private)',
                    '    function y = hidden(obj)',
                    '      y = obj.x + 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Access = private)',
                    '    function y = privateStatic()',
                    '      y = 11;',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = publicStatic()',
                    '      y = SecretBox.privateStatic();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('b = SecretBox()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('b.read()'))).toBe('7\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('b.reveal()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('SecretBox.publicStatic()'))).toBe('11\n');
            expect(() => localInterpreter.Execute('b.x')).toThrow("property 'x' has private get access for class SecretBox.");
            expect(() => localInterpreter.Execute('b.hidden()')).toThrow("method 'hidden' has private access for class SecretBox.");
            expect(() => localInterpreter.Execute('SecretBox.privateStatic()')).toThrow("method 'privateStatic' has private access for class SecretBox.");
        });

        it('Should allow protected class member access from subclasses.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef BaseProtected',
                    '  properties (Access = protected)',
                    '    x = 5;',
                    '  end',
                    '  methods (Access = protected)',
                    '    function y = hiddenBase(obj)',
                    '      y = obj.x + 1;',
                    '    end',
                    '  end',
                    '  methods (Static, Access = protected)',
                    '    function y = hiddenStatic()',
                    '      y = 13;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef ChildProtected < BaseProtected',
                    '  methods',
                    '    function y = readBase(obj)',
                    '      y = obj.x;',
                    '    end',
                    '    function y = revealBase(obj)',
                    '      y = obj.hiddenBase();',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = revealStatic()',
                    '      y = ChildProtected.hiddenStatic();',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildProtected()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.readBase()'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.revealBase()'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ChildProtected.revealStatic()'))).toBe('13\n');
            expect(() => localInterpreter.Execute('c.x')).toThrow("property 'x' has protected get access for class ChildProtected.");
            expect(() => localInterpreter.Execute('c.hiddenBase()')).toThrow("method 'hiddenBase' has protected access for class ChildProtected.");
            expect(() => localInterpreter.Execute('ChildProtected.hiddenStatic()')).toThrow("method 'hiddenStatic' has protected access for class ChildProtected.");
        });

        it('Should call superclass constructors from subclass constructors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                ['classdef BaseConstructed', '  properties', '    x = 0;', '  end', '  methods', '    function obj = BaseConstructed(x)', '      obj.x = x;', '    end', '  end', 'end'].join(
                    '\n',
                ),
            );
            localInterpreter.Execute(
                [
                    'classdef ChildConstructed < BaseConstructed',
                    '  properties',
                    '    y = 0;',
                    '  end',
                    '  methods',
                    '    function obj = ChildConstructed(x, y)',
                    '      obj = obj@BaseConstructed(x);',
                    '      obj.y = y;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildConstructed(4, 9)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.x'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.y'))).toBe('9\n');
            expect(() => localInterpreter.Execute('c@BaseConstructed(1)')).toThrow("superclass constructor 'BaseConstructed' is only accessible from class methods.");
        });

        it('Should override inherited methods and call superclass methods explicitly.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef BaseOverride', '  methods', '    function y = value(obj)', '      y = 1;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(
                [
                    'classdef ChildOverride < BaseOverride',
                    '  methods',
                    '    function y = value(obj)',
                    '      y = 2;',
                    '    end',
                    '    function y = baseValue(obj)',
                    '      y = value@BaseOverride(obj);',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = ChildOverride()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.value()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.baseValue()'))).toBe('1\n');
            expect(() => localInterpreter.Execute('value@BaseOverride(c)')).toThrow("superclass method 'value' is only accessible from class methods.");
        });

        it('Should enforce abstract and sealed class attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef (Abstract) AbstractShape', '  methods (Abstract)', '    function y = area(obj)', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef CircleShape < AbstractShape', '  methods', '    function y = area(obj)', '      y = 12;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef PendingShape < AbstractShape', 'end'].join('\n'));
            localInterpreter.Execute(['classdef StaticAreaShape < AbstractShape', '  methods (Static)', '    function y = area()', '      y = 99;', '    end', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef (Sealed) FinalShape', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('AbstractShape()')).toThrow('cannot instantiate abstract class AbstractShape: missing implementations for area.');
            expect(() => localInterpreter.Execute('PendingShape()')).toThrow('cannot instantiate abstract class PendingShape: missing implementations for area.');
            expect(() => localInterpreter.Execute('StaticAreaShape()')).toThrow('cannot instantiate abstract class StaticAreaShape: missing implementations for area.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('CircleShape().area()'))).toBe('12\n');
            expect(() => localInterpreter.Execute(['classdef IllegalShape < FinalShape', 'end'].join('\n'))).toThrow('class IllegalShape cannot inherit from sealed class FinalShape.');
        });

        it('Should support constant class properties.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef ConstantsBase',
                    '  properties (Constant)',
                    '    Answer = 42;',
                    '  end',
                    '  properties (Constant, Access = private)',
                    '    Secret = 7;',
                    '  end',
                    '  methods (Static)',
                    '    function y = reveal()',
                    '      y = ConstantsBase.Secret;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef ConstantsChild < ConstantsBase', 'end'].join('\n'));
            localInterpreter.Execute('c = ConstantsChild()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsBase.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsChild.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Answer'))).toBe('42\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ConstantsBase.reveal()'))).toBe('7\n');
            expect(() => localInterpreter.Execute('ConstantsBase.Secret')).toThrow("property 'Secret' has private get access for class ConstantsBase.");
            expect(() => localInterpreter.Execute('c.Answer = 10')).toThrow("cannot assign to constant property 'Answer' for class ConstantsChild.");
        });

        it('Should enforce independent GetAccess and SetAccess property attributes.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef AccessControlledValue < handle',
                    '  properties (GetAccess = private, SetAccess = public)',
                    '    HiddenValue = 1;',
                    '  end',
                    '  properties (GetAccess = public, SetAccess = private)',
                    '    LockedValue = 2;',
                    '  end',
                    '  methods',
                    '    function y = readHidden(obj)',
                    '      y = obj.HiddenValue;',
                    '    end',
                    '    function y = writeLocked(obj, value)',
                    '      obj.LockedValue = value;',
                    '      y = obj.LockedValue;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('a = AccessControlledValue()');

            expect(() => localInterpreter.Execute('a.HiddenValue')).toThrow("property 'HiddenValue' has private get access for class AccessControlledValue.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.readHidden()'))).toBe('1\n');

            localInterpreter.Execute('a.HiddenValue = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.readHidden()'))).toBe('10\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute('a.LockedValue'))).toBe('2\n');
            expect(() => localInterpreter.Execute('a.LockedValue = 20')).toThrow("property 'LockedValue' has private set access for class AccessControlledValue.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.writeLocked(30)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a.LockedValue'))).toBe('30\n');
        });

        it('Should notify class event and observable property listeners.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute('global eventCount lastEvent lastEventClass lastPropertyName lastAffectedClass');
            localInterpreter.Execute('eventCount = 0');
            localInterpreter.Execute(
                [
                    'function recordEvent(src, eventData)',
                    '  global eventCount lastEvent lastEventClass',
                    '  eventCount = eventCount + 1;',
                    '  lastEvent = eventData.EventName;',
                    '  lastEventClass = class(eventData);',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'function recordPropertyEvent(src, eventData)',
                    '  global eventCount lastEvent lastEventClass lastPropertyName lastAffectedClass',
                    '  eventCount = eventCount + 1;',
                    '  lastEvent = eventData.EventName;',
                    '  lastEventClass = class(eventData);',
                    '  lastPropertyName = eventData.PropertyName;',
                    '  lastAffectedClass = class(eventData.AffectedObject);',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef EventSource < handle',
                    '  events',
                    '    Changed',
                    '  end',
                    '  properties (GetObservable, SetObservable)',
                    '    Value = 0;',
                    '  end',
                    '  methods',
                    '    function fire(obj)',
                    '      notify(obj, "Changed");',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('s = EventSource()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('listener = addlistener(s, "Changed", @recordEvent)'))).toBe('listener=event.listener EventSource.Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(listener)'))).toBe('event.listener\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(listener)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('listener.Enabled'))).toBe('true\n');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEventClass'))).toBe('event.EventData\n');

            localInterpreter.Execute('listener.Enabled = false');
            expect(localInterpreter.Unparse(localInterpreter.Execute('listener.Enabled'))).toBe('false\n');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('1\n');
            localInterpreter.Execute('listener.Enabled = true');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('2\n');
            localInterpreter.Execute('delete(listener)');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isvalid(listener)'))).toBe('false\n');
            localInterpreter.Execute('notify(s, "Changed")');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('2\n');
            expect(() => localInterpreter.Execute('listener.Enabled')).toThrow('invalid or deleted event listener.');

            localInterpreter.Execute('addlistener(s, "Value", @recordPropertyEvent)');
            localInterpreter.Execute('s.Value');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEventClass'))).toBe('event.PropertyEvent\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastPropertyName'))).toBe('Value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastAffectedClass'))).toBe('EventSource\n');

            localInterpreter.Execute('s.Value = 5');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eventCount'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('lastEvent'))).toBe('Value\n');
            expect(() => localInterpreter.Execute('addlistener(s, "Missing", @recordEvent)')).toThrow("unknown event 'Missing' for class EventSource.");
        });

        it('Should read dependent properties through get accessors.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef DependentCircle',
                    '  properties',
                    '    Radius = 3;',
                    '  end',
                    '  properties (Dependent)',
                    '    Area',
                    '  end',
                    '  methods',
                    '    function y = get.Area(obj)',
                    '      y = obj.Radius * obj.Radius;',
                    '    end',
                    '    function obj = set.Area(obj, value)',
                    '      obj.Radius = value / 2;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef ReadOnlyDependentCircle',
                    '  properties (Dependent)',
                    '    Area',
                    '  end',
                    '  methods',
                    '    function y = get.Area(obj)',
                    '      y = 1;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute('c = DependentCircle()');
            localInterpreter.Execute('r = ReadOnlyDependentCircle()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Area'))).toBe('9\n');
            localInterpreter.Execute('c.Area = 10');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Radius'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('c.Area'))).toBe('25\n');
            expect(() => localInterpreter.Execute('r.Area = 10')).toThrow("cannot assign to dependent property 'Area' for class ReadOnlyDependentCircle without a set accessor.");
        });

        it('Should resolve class enumeration values.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef ColorChoice', '  enumeration', '    Red', '    Blue(2)', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['classdef MoreColorChoice < ColorChoice', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('ColorChoice.Red'))).toBe('ColorChoice.Red\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ColorChoice.Blue'))).toBe('ColorChoice.Blue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('MoreColorChoice.Red'))).toBe('ColorChoice.Red\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(ColorChoice.Red)'))).toBe('ColorChoice\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(ColorChoice.Red, 'ColorChoice')"))).toBe('true\n');
        });

        it('Should introspect class members.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef IntrospectionBase',
                    '  properties',
                    '    baseValue = 1;',
                    '  end',
                    '  methods',
                    '    function y = baseMethod(obj)',
                    '      y = obj.baseValue;',
                    '    end',
                    '  end',
                    '  events',
                    '    BaseChanged',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                [
                    'classdef IntrospectionChild < IntrospectionBase',
                    '  properties',
                    '    childValue = 2;',
                    '  end',
                    '  properties (Hidden)',
                    '    hiddenValue = 3;',
                    '  end',
                    '  methods',
                    '    function y = childMethod(obj)',
                    '      y = obj.childValue;',
                    '    end',
                    '  end',
                    '  methods (Hidden)',
                    '    function y = hiddenMethod(obj)',
                    '      y = 0;',
                    '    end',
                    '  end',
                    '  events',
                    '    ChildChanged',
                    '  end',
                    '  events (Hidden)',
                    '    HiddenChanged',
                    '  end',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(['classdef IntrospectionHandle < handle', 'end'].join('\n'));
            localInterpreter.Execute(['classdef IntrospectionEnum', '  enumeration', '    Red', '    Blue', '  end', 'end'].join('\n'));
            localInterpreter.Execute('obj = IntrospectionChild()');

            localInterpreter.Execute('p = properties(obj)');
            localInterpreter.Execute('fp = fieldnames(obj)');
            localInterpreter.Execute('m = methods(obj)');
            localInterpreter.Execute('e = events(obj)');
            localInterpreter.Execute('n = enumeration(IntrospectionEnum.Red)');
            localInterpreter.Execute('s.z = 1; s.a = 2; fs = fieldnames(s)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p{1}; p{2}'))).toBe('baseValue\nchildValue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fp{1}; fp{2}'))).toBe('baseValue\nchildValue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fs{1}; fs{2}'))).toBe('a\nz\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('m{1}; m{2}'))).toBe('baseMethod\nchildMethod\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('e{1}; e{2}'))).toBe('BaseChanged\nChildChanged\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('n{1}; n{2}'))).toBe('Blue\nRed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('properties(IntrospectionChild)'))).toBe('{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fieldnames("IntrospectionChild")'))).toBe('{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('methods("IntrospectionChild")'))).toBe('{baseMethod;\nchildMethod}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("events('IntrospectionChild')"))).toBe('{BaseChanged;\nChildChanged}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('enumeration("IntrospectionEnum")'))).toBe('{Blue;\nRed}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses("IntrospectionChild")'))).toBe('{IntrospectionBase}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses(IntrospectionHandle())'))).toBe('{handle}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(obj, "baseValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop("IntrospectionChild", "childValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop("IntrospectionChild", "missingValue")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod(obj, "baseMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod("IntrospectionChild", "childMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod("IntrospectionChild", "missingMethod")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc = metaclass(obj); properties(mc)'))).toBe('mc=meta.class IntrospectionChild\n{baseValue;\nchildValue}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('methods(mc)'))).toBe('{baseMethod;\nchildMethod}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('events(mc)'))).toBe('{BaseChanged;\nChildChanged}\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isprop(mc, "baseValue")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ismethod(mc, "childMethod")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isobject(mc)'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(1 == 1)'))).toBe('logical\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(1 == 1, 'logical')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(mc, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("IntrospectionChild")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isclass("MissingIntrospectionClass")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("IntrospectionChild", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("IntrospectionChild")'))).toBe('IntrospectionChild is a class\n');
            expect(() => localInterpreter.Execute('properties(1)')).toThrow('properties: input must be a class object.');
            expect(() => localInterpreter.Execute('properties("MissingIntrospectionClass")')).toThrow("properties: class 'MissingIntrospectionClass' is not defined.");
            expect(() => localInterpreter.Execute('isprop("MissingIntrospectionClass", "x")')).toThrow("isprop: class 'MissingIntrospectionClass' is not defined.");
        });

        it('Should lazily load class definitions from configured class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    ExternalPoint: [
                        'classdef ExternalPoint',
                        '  properties',
                        '    x = 4;',
                        '  end',
                        '  methods',
                        '    function y = read(obj)',
                        '      y = obj.x;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ExternalPoint", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("ExternalPoint")'))).toBe('ExternalPoint is a class\n');

            localInterpreter.Execute('p = ExternalPoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.read()'))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('properties("ExternalPoint")'))).toBe('{x}\n');
        });

        it('Should lazily load class superclasses from configured class sources.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceTable: {
                    ExternalBase: ['classdef ExternalBase', '  properties', '    baseValue = 3;', '  end', 'end'].join('\n'),
                    ExternalChild: [
                        'classdef ExternalChild < ExternalBase',
                        '  properties',
                        '    childValue = 5;',
                        '  end',
                        '  methods',
                        '    function y = total(obj)',
                        '      y = obj.baseValue + obj.childValue;',
                        '    end',
                        '  end',
                        'end',
                    ].join('\n'),
                },
            });

            localInterpreter.Execute('obj = ExternalChild()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('obj.total()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('superclasses("ExternalChild")'))).toBe('{ExternalBase}\n');
        });

        it('Should lazily load class definitions from a host class source provider.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'ProvidedPoint'
                        ? {
                              name,
                              source: ['classdef ProvidedPoint', '  properties', '    x = 6;', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            localInterpreter.Execute('p = ProvidedPoint()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('p.x'))).toBe('6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("ProvidedPoint", "class")'))).toBe('8\n');
        });

        it('Should expose MATLAB-like class metadata objects.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(
                [
                    'classdef MetaPoint',
                    '  properties (SetObservable)',
                    '    x = 1;',
                    '  end',
                    '  methods (Static, Sealed)',
                    '    function [y,z] = make(x)',
                    '      arguments',
                    '        x (1,1) double = 2',
                    '      end',
                    '      y = x;',
                    '      z = x;',
                    '    end',
                    '  end',
                    '  events (ListenAccess = private, NotifyAccess = protected)',
                    '    Changed',
                    '  end',
                    '  enumeration',
                    '    One(1)',
                    '  end',
                    'end',
                ].join('\n'),
            );

            localInterpreter.Execute('mc = metaclass(MetaPoint())');

            expect(localInterpreter.Unparse(localInterpreter.Execute('class(mc)'))).toBe('meta.class\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(mc, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.Name'))).toBe('MetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.Sealed'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.HandleCompatible'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).SetObservable'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.PropertyList(1).HasDefault'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Name'))).toBe('make\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Static'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).Sealed'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).InputNames{1}'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).OutputNames{1}; mc.MethodList(1).OutputNames{2}'))).toBe('y\nz\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.MethodList(1).InputValidation{1}.Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).Name'))).toBe('Changed\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).ListenAccess'))).toBe('private\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EventList(1).NotifyAccess'))).toBe('protected\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EnumerationMemberList(1).Name'))).toBe('One\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc.EnumerationMemberList(1).ConstructorArguments{1}'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('metaclass("MetaPoint").Name'))).toBe('MetaPoint\n');
        });

        it('Should parse and evaluate MATLAB-like metaclass literals.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['classdef LiteralMetaPoint', '  properties', '    x = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('?LiteralMetaPoint'))).toBe('?LiteralMetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('mc = ?LiteralMetaPoint; mc.Name'))).toBe('mc=meta.class LiteralMetaPoint\nLiteralMetaPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa(?LiteralMetaPoint, 'meta.class')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?LiteralMetaPoint.PropertyList(1).Name'))).toBe('x\n');
        });

        it('Should resolve qualified class names from the class source provider.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'pkg.ProvidedPoint'
                        ? {
                              name,
                              source: [
                                  'classdef ProvidedPoint',
                                  '  properties',
                                  '    x = 9;',
                                  '  end',
                                  '  methods (Static)',
                                  '    function y = make()',
                                  '      y = 11;',
                                  '    end',
                                  '  end',
                                  'end',
                              ].join('\n'),
                          }
                        : undefined,
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.ProvidedPoint().x'))).toBe('9\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.ProvidedPoint.make()'))).toBe('11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('?pkg.ProvidedPoint.Name'))).toBe('pkg.ProvidedPoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("pkg.ProvidedPoint").PropertyList(1).Name'))).toBe('x\n');
        });

        it('Should resolve meta.class.fromName through the runtime class registry.', () => {
            const localInterpreter = Interpreter.Create({
                classSourceProvider: (name) =>
                    name === 'ProvidedMetaPoint'
                        ? {
                              name,
                              source: ['classdef ProvidedMetaPoint', '  properties', '    x = 9;', '  end', 'end'].join('\n'),
                          }
                        : undefined,
            });

            localInterpreter.Execute(['classdef FromNamePoint', '  properties', '    x = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("FromNamePoint").Name'))).toBe('FromNamePoint\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('meta.class.fromName("ProvidedMetaPoint").PropertyList(1).Name'))).toBe('x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty(meta.class.fromName("MissingMetaPoint"))'))).toBe('true\n');
        });

        /**
         * Error handling regressions.
         */
        it('Should preserve the interpreter stack trace across nested function calls.', () => {
            const localInterpreter = Interpreter.Create();
            const input = [
                'function y = f(x) % start stack trace error test',
                '  y = g(x);',
                'end',
                '',
                'function z = g(x)',
                '  z = h(x);',
                'end',
                '',
                'function w = h(x)',
                '  w = x + unknownVar;',
                'end',
                '',
                'f(2) % error: show stack trace',
            ].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain("Error: 'unknownVar' undefined.");
            expect(errorText).toContain('Error in h');
            expect(errorText).toContain('Error in g');
            expect(errorText).toContain('Error in f');
        });

        it('Should register and later resolve a local forward reference when enabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('a = b')).toThrow("'b' undefined.");
            localInterpreter.Execute('b = 2');
            const value = localInterpreter.Execute('a');

            expect(localInterpreter.Unparse(value)).toBe('2\n');
        });

        it('Should not treat propagated nested function errors as forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;
            const input = [
                'function y = f(x)',
                '  y = g(x);',
                'end',
                '',
                'function z = g(x)',
                '  z = h(x);',
                'end',
                '',
                'function w = h(x)',
                '  w = x + unknownVar;',
                'end',
                '',
                'f(2)',
            ].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain("Error: 'unknownVar' undefined.");
            expect(errorText).toContain('Error in h');
            expect(errorText).toContain('Error in g');
            expect(errorText).toContain('Error in f');
            expect(localInterpreter.context.currentScope.resolveName('y')).toBeUndefined();
            expect(localInterpreter.context.currentScope.resolveName('z')).toBeUndefined();
        });

        it('Should report a circular dependency between two forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('A = B + 1')).toThrow("'B' undefined.");
            expect(() => localInterpreter.Execute('B = A + 1')).toThrow('Circular reference detected: A → B → A');
        });

        it('Should report a circular dependency chain across multiple forward references.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            expect(() => localInterpreter.Execute('A = B + 1')).toThrow("'B' undefined.");
            expect(() => localInterpreter.Execute('B = C + 1')).toThrow("'C' undefined.");
            expect(() => localInterpreter.Execute('C = A + 1')).toThrow('Circular reference detected: A → B → C → A');
        });

        it('Should include stack trace for invalid function calls reported by AST helpers.', () => {
            const localInterpreter = Interpreter.Create();
            const input = ['function y = f(x)', '  y = sin;', 'end', '', 'f(2)'].join('\n');

            let errorText = '';
            try {
                localInterpreter.Execute(input);
            } catch (e: unknown) {
                errorText = String(e);
            }

            expect(errorText).toContain('Invalid call to sin.');
            expect(errorText).toContain('Error in f');
        });

        it('Should capture anonymous function variables when the handle is created.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute('a = 10; f = @(x) x + a; a = 20; f(1)');

            expect(localInterpreter.Unparse(value)).toBe('a=10\nf=@(x) x+a\na=20\n11\n');
        });

        it('Should preserve anonymous function closures when handles are copied.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute('a = 10; f = @(x) x + a; g = f; a = 20; g(1)');

            expect(localInterpreter.Unparse(value)).toBe('a=10\nf=@(x) x+a\ng=@(x) x+a\na=20\n11\n');
        });

        it('Should let returned anonymous functions keep their defining function scope.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['function f = makeAdder(a)', '  f = @(x) x + a;', 'end', '', 'add10 = makeAdder(10);', 'add10(1)'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('add10=@(x) x+a\n11\n');
        });

        it('Should call nested functions before their textual definition.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outercallbefore(x)', '  a = 10;', '  y = inner(x);', '  function z = inner(t)', '    z = t + a;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outercallbefore(5)'))).toBe('15\n');
        });

        it('Should let nested functions update existing outer workspace variables.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerwrite()', '  a = 1;', '  inner();', '  y = a;', '  function inner()', '    a = 5;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerwrite()'))).toBe('5\n');
        });

        it('Should keep nested function parameters local while reading outer variables.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = outershadow()', '  a = 10;', '  y = inner(3) + a;', '  function z = inner(a)', '    a = a + 1;', '    z = a;', '  end', 'end'].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('outershadow()'))).toBe('14\n');
        });

        it('Should not leak nested functions into the caller scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outernoleak()', '  y = inner();', '  function z = inner()', '    z = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outernoleak()'))).toBe('1\n');
            expect(() => localInterpreter.Execute('inner()')).toThrow("'inner' undefined.");
        });

        it('Should allow nested functions to update outer return values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerreturnupdate()', '  y = 1;', '  bump();', '  function bump()', '    y = y + 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerreturnupdate()'))).toBe('2\n');
        });

        it('Should let returned nested function handles keep their outer workspace.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(
                ['function f = makenested(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end', '', 'h = makenested(10);', 'h(5)'].join('\n'),
            );

            expect(localInterpreter.Unparse(value)).toBe('h=@inner\n15\n');
        });

        it('Should preserve mutable outer workspace state in returned nested function handles.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(
                [
                    'function f = makecounter()',
                    '  c = 0;',
                    '  function z = bump()',
                    '    c = c + 1;',
                    '    z = c;',
                    '  end',
                    '  f = @bump;',
                    'end',
                    '',
                    'h = makecounter();',
                    'h()',
                    'h()',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(value)).toBe('h=@bump\n1\n2\n');
        });

        it('Should keep returned nested function handle workspaces independent.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makecounter()', '  c = 0;', '  function z = bump()', '    c = c + 1;', '    z = c;', '  end', '  f = @bump;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h1 = makecounter(); h2 = makecounter(); h1(); h1(); h2()'))).toBe('h1=@bump\nh2=@bump\n1\n2\n1\n');
        });

        it('Should convert function handles to strings.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@sin)'))).toBe('sin\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@(x) x + 1)'))).toBe('@(x) x+1\n');
        });

        it('Should support ignored parameters in anonymous and user functions.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = ignorefirst(~, x)', '  y = nargin + x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('@(~, x) x'))).toBe('@(~,x) x\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(~, x) x + nargin; f(99, 3)'))).toBe('f=@(~,x) x+nargin\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(~, x) x)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('ignorefirst(99, 3)'))).toBe('5\n');
        });

        it('Should parse and call qualified function names and handles.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function y = pkg.double(x)', '  y = 2 * x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Parse('@pkg.double'))).toBe('@pkg.double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('pkg.double(4)'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @pkg.double; func2str(f); f(5)'))).toBe('f=@pkg.double\npkg.double\n10\n');
        });

        it('Should convert strings to callable function handles.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = str2func("sin"); f(0)'))).toBe('f=@sin\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = str2func("@(x) x + 1"); g(4)'))).toBe('g=@(x) x+1\n5\n');
        });

        it('Should keep named function handles bound to resolved user functions after clear.', () => {
            const localInterpreter = Interpreter.Create();
            const value = localInterpreter.Execute(['function y = sin(x)', '  y = x + 10;', 'end', 'f = @sin;', 'clear sin', 'which(f)', 'f(1)', 'which("sin")', 'sin(0)'].join('\n'));

            expect(localInterpreter.Unparse(value)).toBe('f=@sin\nsin is a user-defined function\n11\nsin is a built-in function\n0\n');
        });

        it('Should call built-in functions explicitly with builtin when names are shadowed.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = sin(x)', '  y = x + 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('sin(1); builtin("sin", 0); builtin("which", "sin")'))).toBe('11\n0\nsin is a user-defined function\n');
            expect(() => localInterpreter.Execute('builtin("missing_builtin")')).toThrow("builtin: 'missing_builtin' is not a built-in function.");
        });

        it('Should report basic function handle metadata.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makenestedmeta(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('info = functions(@sin); info.function'))).toBe(
                'info=struct {\nfunction: sin\ntype: simple\nworkspace: false\n}\nsin\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('info = functions(@(x) x + 1); info.type'))).toBe(
                'info=struct {\nfunction: @(x) x+1\ntype: anonymous\nworkspace: true\n}\nanonymous\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makenestedmeta(10); info = functions(h); info.type'))).toBe(
                'h=@inner\ninfo=struct {\nfunction: inner\ntype: nested\nworkspace: true\n}\nnested\n',
            );
        });

        it('Should return handles for functions defined in the current scope with localfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = localfirst(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = localsecond(x)', '  y = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('c = localfunctions(); func2str(c{1}); feval(c{2}, 5)'))).toBe('c={@localfirst;\n@localsecond}\nlocalfirst\n7\n');
        });

        it('Should return lexical nested function handles with localfunctions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [name, y, kind, workspace] = outermakehandles(a)',
                    '  c = localfunctions();',
                    '  h = c{1};',
                    '  info = functions(h);',
                    '  name = func2str(h);',
                    '  y = h(5);',
                    '  kind = info.type;',
                    '  workspace = info.workspace;',
                    '  function z = inner(x)',
                    '    z = x + a;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[name, y, kind, workspace] = outermakehandles(10)'))).toBe('name=inner\ny=15\nkind=nested\nworkspace=true\n');
        });

        it('Should call function handles and function names through feval.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('feval(@sin, 0)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("sin", 0)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("@(x) x + 1", 4)'))).toBe('5\n');
        });

        it('Should preserve requested output count through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = fevalpair(x)', '  a = nargout;', '  b = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = feval(@fevalpair, 10)'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = feval("fevalpair", 10)'))).toBe('x=2\ny=11\n');
        });

        it('Should call returned nested function handles through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makefevalnested(a)', '  function z = inner(x)', '    z = x + a;', '  end', '  f = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makefevalnested(10); feval(h, 5)'))).toBe('h=@inner\n15\n');
        });

        it('Should preserve anonymous function call metadata through feval.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin + nargout; feval(f, 1, 2)'))).toBe('f=@(x,y) nargin+nargout\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); source = 10; feval(f, source)'))).toBe('f=@(x) inputname(1)\nsource=10\nsource\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('feval("@(x) inputname(1)", source)'))).toBe('source\n');
        });

        it('Should preserve caller workspaces through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = fevalreadcallerx()', '  y = evalin("caller", "x");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = fevaloutercaller()', '  x = 7;', '  f = @(t) evalin("caller", "x + t");', '  y = feval(f, 3);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) fevalreadcallerx(); feval(f, 10)'))).toBe('f=@(x) fevalreadcallerx()\n10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('fevaloutercaller()'))).toBe('10\n');
        });

        it('Should preserve input names for user functions called through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function name = fevalinputname(x)', '  name = inputname(1);', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 20; feval(@fevalinputname, source); feval("fevalinputname", source)'))).toBe('source=20\nsource\nsource\n');
        });

        it('Should report variables and functions with exist.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = existuser(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("existuser")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin")'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("missing_name")'))).toBe('0\n');
        });

        it('Should filter exist queries by kind.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = existfilter(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "var")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("x", "builtin")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin", "builtin")'))).toBe('5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("existfilter", "file")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("double", "class")'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("unknown", "class")'))).toBe('0\n');
        });

        it('Should see nested functions only inside their lexical function scope with exist.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outerexist()', '  y = exist("inner");', '  function z = inner()', '    z = 1;', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerexist()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("inner")'))).toBe('0\n');
        });

        it('Should describe resolved names with which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('x = 1');
            localInterpreter.Execute(['function y = whichuser(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('which("x")'))).toBe('x is a variable\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("whichuser")'))).toBe('whichuser is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("sin")'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("missing_name")'))).toBe('missing_name not found\n');
        });

        it('Should support command-style which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = whichcmd(x)', '  y = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('which("sin")'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('func2str(@which)'))).toBe('which\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which sin'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which whichcmd'))).toBe('whichcmd is a user-defined function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which (@which)'))).toBe('which is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which "sin"'))).toBe('sin is a built-in function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("which 'sin'"))).toBe('sin is a built-in function\n');
        });

        it('Should parse MATLAB command syntax as word lists.', () => {
            const localInterpreter = Interpreter.Create({
                externalCmdWListTable: {
                    cmdprobe: {
                        func: (...args: string[]): CharString => new CharString(args.join('|')),
                    },
                },
            });

            expect(localInterpreter.Unparse(localInterpreter.Parse('cmdprobe alpha beta'))).toBe('cmdprobe alpha beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha beta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ... % comment\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\n% comment\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha ...\n%{\nblock\n%}\nbeta'))).toBe('alpha|beta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe alpha % comment\ncmdprobe beta'))).toBe('alpha\nbeta\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe "alpha beta" \'gamma delta\' -flag key=value'))).toBe('alpha beta|gamma delta|-flag|key=value\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('cmdprobe if end properties'))).toBe('if|end|properties\n');
            expect(() => localInterpreter.Execute('cmdprobe(1)')).toThrow("'cmdprobe' undefined.");
        });

        it('Should describe returned nested function handles with which.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function h = makewhichnested()', '  function y = inner(x)', '    y = x;', '  end', '  h = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makewhichnested(); which(h)'))).toBe('h=@inner\ninner is a nested function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which("inner")'))).toBe('inner not found\n');
        });

        it('Should describe anonymous function handles with which.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) x + 1; which(g)'))).toBe('g=@(x) x+1\n@(x) x+1 is an anonymous function\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('which(@(x) x + 1)'))).toBe('@(x) x+1 is an anonymous function\n');
        });

        it('Should report runtime value classes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('class(1)'))).toBe('double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class([1,2])'))).toBe('double\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("class('abc')"))).toBe('char\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class({1,2})'))).toBe('cell\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(struct())'))).toBe('struct\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('class(@sin)'))).toBe('function_handle\n');
        });

        it('Should test runtime value classes with isa.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa([1,2], "double")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("isa('abc', 'char')"))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa({1,2}, "cell")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(struct(), "struct")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(@sin, "function_handle")'))).toBe('true\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "char")'))).toBe('false\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('isa(1, "single")'))).toBe('false\n');
        });

        it('Should report the current function name with mfilename.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = currentfile()', '  y = mfilename();', 'end'].join('\n'));
            localInterpreter.Execute(['function y = currentfilefullpath()', '  y = mfilename("fullpath");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('mfilename()'))).toBe('\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('currentfile()'))).toBe('currentfile\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('currentfilefullpath()'))).toBe('currentfilefullpath\n');
            expect(() => localInterpreter.Execute('mfilename("bad")')).toThrow('Invalid call to mfilename.');
        });

        it('Should report nested function names with mfilename.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = outermfilename()', '  y = inner();', '  function z = inner()', '    z = mfilename();', '  end', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('outermfilename()'))).toBe('inner\n');
        });

        it('Should report user function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackcaller()',
                    '  [current, caller] = stackleaf();',
                    'end',
                    'function [current, caller] = stackleaf()',
                    '  s = dbstack();',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackcaller()'))).toBe('current=stackleaf\ncaller=stackcaller\n');
        });

        it('Should omit leading user function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function caller = stackskipcaller()', '  caller = stackskipleaf();', 'end', 'function caller = stackskipleaf()', '  s = dbstack(1);', '  caller = s(1).name;', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackskipcaller()'))).toBe('stackskipcaller\n');
        });

        it('Should report nested function call frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stacknested()',
                    '  [current, caller] = inner();',
                    '  function [a, b] = inner()',
                    '    s = dbstack();',
                    '    a = s(1).name;',
                    '    b = s(2).name;',
                    '  end',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stacknested()'))).toBe('current=inner\ncaller=stacknested\n');
        });

        it('Should report anonymous function frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackthroughanon()',
                    '  f = @() stackleafstack();',
                    '  s = f();',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                    'function s = stackleafstack()',
                    '  s = dbstack();',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackthroughanon()'))).toBe('current=stackleafstack\ncaller=@anonymous function handle\n');
        });

        it('Should omit leading anonymous frames with dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function caller = stackskipanon()', '  f = @() dbstack(1);', '  s = f();', '  caller = s(1).name;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('stackskipanon()'))).toBe('stackskipanon\n');
        });

        it('Should omit built-in feval frames from dbstack.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [current, caller] = stackthroughfeval()',
                    '  f = @() stackleafstack();',
                    '  s = feval(f);',
                    '  current = s(1).name;',
                    '  caller = s(2).name;',
                    'end',
                    'function s = stackleafstack()',
                    '  s = dbstack();',
                    'end',
                ].join('\n'),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('[current, caller] = stackthroughfeval()'))).toBe('current=stackleafstack\ncaller=@anonymous function handle\n');
        });

        it('Should include anonymous frames in stack traces through feval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = stackerrorleaf()', '  y = missingStackValue;', 'end'].join('\n'));

            let error: unknown;
            try {
                localInterpreter.Execute('f = @() stackerrorleaf(); feval(f)');
            } catch (e) {
                error = e;
            }

            expect(error).toBeDefined();
            const errorText = `${error}`;
            expect(errorText).toContain('Error in stackerrorleaf');
            expect(errorText).toContain('Error in @anonymous function handle');
        });

        it('Should capture existing names in redefined functions while preserving forward references when enabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = true;

            localInterpreter.Execute(['function y = f(x)', '  y = g(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function z = g(x)', '  z = h(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 1'))).toBe('unknownVar=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('3\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 3'))).toBe('unknownVar=3\n');
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('5\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(['unknownVar = 1', 'f(2)'].join('\n')))).toBe('unknownVar=1\n5\n');
        });

        it('Should not resolve missing function variables through late binding when forward references are disabled.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.allowForwardReference = false;

            localInterpreter.Execute(['function y = f(x)', '  y = g(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function z = g(x)', '  z = h(x);', 'end'].join('\n'));
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 1'))).toBe('unknownVar=1\n');
            expect(() => localInterpreter.Execute('f(2)')).toThrow("'unknownVar' undefined.");

            expect(localInterpreter.Unparse(localInterpreter.Execute('unknownVar = 3'))).toBe('unknownVar=3\n');
            localInterpreter.Execute(['function w = h(x)', '  w = x + unknownVar;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f(2)'))).toBe('5\n');

            expect(localInterpreter.Unparse(localInterpreter.Execute(['unknownVar = 1', 'f(2)'].join('\n')))).toBe('unknownVar=1\n5\n');
        });

        it('Should preserve persistent variables between calls without leaking them globally.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = counter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('2\n');
            expect(localInterpreter.context.currentScope.resolveName('c')).toBeUndefined();
        });

        it('Should reset persistent variables when a function is redefined.', () => {
            const localInterpreter = Interpreter.Create();
            const definition = ['function y = counter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('2\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('counter()'))).toBe('1\n');
        });

        it('Should clear user-defined functions by name.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearuser()', '  y = 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearuser()'))).toBe('10\n');
            localInterpreter.Execute('clear clearuser');
            expect(() => localInterpreter.Execute('clearuser()')).toThrow("'clearuser' undefined.");
        });

        it('Should clear all user-defined functions with clear functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearone()', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = cleartwo()', '  y = 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearone")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("cleartwo")'))).toBe('2\n');
            localInterpreter.Execute('clear functions');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearone")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("cleartwo")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("sin")'))).toBe('5\n');
        });

        it('Should clear variables and functions with the same name.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = clearshadow()', '  y = 5;', 'end'].join('\n'));
            localInterpreter.Execute('clearshadow = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearshadow'))).toBe('3\n');
            localInterpreter.Execute('clear clearshadow');
            expect(() => localInterpreter.Execute('clearshadow()')).toThrow("'clearshadow' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("clearshadow")'))).toBe('0\n');
        });

        it('Should reset persistent variables after clearing and redefining a function.', () => {
            const localInterpreter = Interpreter.Create();
            const definition = ['function y = clearcounter()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n');

            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('2\n');
            localInterpreter.Execute('clear clearcounter');
            localInterpreter.Execute(definition);
            expect(localInterpreter.Unparse(localInterpreter.Execute('clearcounter()'))).toBe('1\n');
        });

        it('Should reject persistent declarations outside function bodies.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('persistent c')).toThrow('persistent declaration is only valid inside a function.');
        });

        it('Should share global variables between global scope and function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = readg()', '  global g', '  y = g;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('readg()'))).toBe('10\n');
        });

        it('Should update global variables assigned inside functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setg(x)', '  global g', '  g = x;', 'end'].join('\n'));

            localInterpreter.Execute('setg(7)');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('7\n');
        });

        it('Should keep local variables separate from globals when global is not declared in the function.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = localg()', '  g = 2;', '  y = g;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('localg()'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('10\n');
        });

        it('Should clear all global variables with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g h');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute('h = 20');
            localInterpreter.Execute('localValue = 30');

            localInterpreter.Execute('clear global');

            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("g", "var")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("h", "var")'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('localValue'))).toBe('30\n');
        });

        it('Should remove global aliases from active function workspaces with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = clearandreadglobal()', '  global g', '  clear global', '  y = exist("g", "var");', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('clearandreadglobal()'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('exist("g", "var")'))).toBe('0\n');
        });

        it('Should allow global variables to be recreated after clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute('clear global');
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 3');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('3\n');
        });

        it('Should remove global entries from captured function definition scopes with clear global.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('global g');
            localInterpreter.Execute('g = 10');
            localInterpreter.Execute(['function y = capturedglobalexists()', '  y = exist("g", "var");', 'end'].join('\n'));
            localInterpreter.Execute('clear global');

            expect(localInterpreter.Unparse(localInterpreter.Execute('capturedglobalexists()'))).toBe('0\n');
        });

        it('Should allow global declarations with initial values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setinitial()', '  global g = 4', 'end'].join('\n'));

            localInterpreter.Execute('setinitial()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('4\n');
        });

        it('Should allow comma-separated global declarations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse('global a, b = 2, c'))).toBe('global a b=2 c\n');
            localInterpreter.Execute(['function setcommaglobals()', '  global a, b = 2, c = 3', 'end'].join('\n'));
            localInterpreter.Execute('setcommaglobals()');

            expect(localInterpreter.Unparse(localInterpreter.Execute('b; c'))).toBe('2\n3\n');
        });

        it('Should allow comma-separated persistent declarations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = commapersistent()', '  persistent a = 1, b = 10', '  a = a + 1;', '  b = b + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = commapersistent(); [a, b] = commapersistent()'))).toBe('a=2\nb=12\na=3\nb=14\n');
        });

        it('Should unparse global and persistent declarations.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Parse('global g'))).toBe('global g\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('persistent c = 0'))).toBe('persistent c=0\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('global a b c'))).toBe('global a b c\n');
            expect(localInterpreter.Unparse(localInterpreter.Parse('global a, b, c'))).toBe('global a b c\n');
        });

        it('Should unparse global and persistent declarations as MathML without invalid nodes.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.ToMathML('global g')).not.toContain('invalid');
            expect(localInterpreter.ToMathML('persistent c = 0')).not.toContain('invalid');
            expect(localInterpreter.ToMathML('global a b c')).not.toContain('invalid');
        });

        it('Should evaluate declaration-only lists to matching omitted declaration placeholders.', () => {
            const localInterpreter = Interpreter.Create();

            const globalResult = localInterpreter.Execute('global a b c');
            expect(globalResult.type).toBe('LIST');
            expect(globalResult.list[0].omitOutput).toBe(true);
            expect(localInterpreter.Unparse(globalResult)).toBe(localInterpreter.Unparse(localInterpreter.Parse('global a b c')));
            expect(localInterpreter.Unparse(localInterpreter.Execute(['global a b c', 'a = 1'].join('\n')))).toBe('a=1\n');
        });

        it('Should preserve no-output function calls as omitted list placeholders.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setg(x)', '  global g', '  g = x;', 'end'].join('\n'));

            const result = localInterpreter.Execute('setg(7)');

            expect(result.type).toBe('LIST');
            expect(result.list[0].omitOutput).toBe(true);
            expect(localInterpreter.Unparse(result)).toBe(localInterpreter.Unparse(localInterpreter.Parse('setg(7)')));
            expect(localInterpreter.Unparse(localInterpreter.Execute('g'))).toBe('7\n');
        });

        it('Should assign multiple outputs from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[u, v] = pair(10)');

            expect(localInterpreter.Unparse(result)).toBe('u=10\nv=11\n');
        });

        it('Should allow ignored outputs in user-defined function return lists.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [~, b] = ignoredfirst(x)', '  b = x + 1;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[~, y] = ignoredfirst(10)');

            expect(localInterpreter.Unparse(result)).toBe('y=11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@ignoredfirst)'))).toBe('2\n');
        });

        it('Should report too many requested outputs from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));

            expect(() => localInterpreter.Execute('[u, v, w] = pair(10)')).toThrow('element number 3 undefined in return list');
        });

        it('Should request one output from calls used as function arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pair(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = echo(x)', '  y = x;', 'end'].join('\n'));

            const result = localInterpreter.Execute('[u, v] = pair(echo(pair(10)))');

            expect(localInterpreter.Unparse(result)).toBe('u=10\nv=11\n');
        });

        it('Should expose nargin inside user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('clear');
            localInterpreter.Execute(['function y = countargs(a, b)', '  y = nargin;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('countargs(1, 2)'))).toBe('2\n');
        });

        it('Should expose nargout inside user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = countouts()', '  a = nargout;', '  b = nargout + 10;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('x = countouts()'))).toBe('x=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = countouts()'))).toBe('x=2\ny=12\n');
        });

        it('Should expose nargin and nargout as zero-argument calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = counts(x)', '  a = nargin();', '  b = nargout();', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = counts(7)'))).toBe('x=1\ny=2\n');
        });

        it('Should report declared function arity with nargin and nargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = declaredarity(x, y)', '  a = x;', '  b = y;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@declaredarity)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@declaredarity)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("declaredarity")'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("declaredarity")'))).toBe('2\n');
        });

        it('Should report variable input and output arity with negative counts.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = varinarity(x, varargin)', '  y = nargin;', 'end'].join('\n'));
            localInterpreter.Execute(['function varargout = varoutarity(x)', '  varargout{1} = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, varargout] = mixedvaroutarity(x)', '  a = x;', '  varargout{1} = x + 1;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@varinarity)'))).toBe('-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("varinarity")'))).toBe('-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout(@varoutarity)'))).toBe('-1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("mixedvaroutarity")'))).toBe('-2\n');
        });

        it('Should assign fixed outputs followed by varargout outputs.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, varargout] = mixedoutvalues(x, varargin)', '  a = x;', '  varargout{1} = nargin;', '  varargout{2} = x + 2;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('a = mixedoutvalues(5)'))).toBe('a=5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = mixedoutvalues(5, 6, 7)'))).toBe('a=5\nb=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b, c] = mixedoutvalues(5, 6, 7)'))).toBe('a=5\nb=3\nc=7\n');
        });

        it('Should report anonymous and nested function handle arity.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function h = makenestedarity(a)', '  function [u, v] = inner(x, y)', '    u = x + a;', '    v = y + a;', '  end', '  h = @inner;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(x, y) x + y)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("@(x, y) x + y")'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makenestedarity(10); nargin(h); nargout(h)'))).toBe('h=@inner\n2\n2\n');
        });

        it('Should report built-in function arity from signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sin"); nargout("sin")'))).toBe('1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("feval"); nargout("feval")'))).toBe('-1\n-1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("eval"); nargin("evalin"); nargin("assignin")'))).toBe('-2\n-3\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("dbstack"); nargin("localfunctions"); nargout("assignin")'))).toBe('-2\n0\n0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("nargin"); nargout("nargout")'))).toBe('-1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sin"); nargin("factorial"); nargin("logb"); nargin("hypot"); nargout("atan2")'))).toBe('1\n1\n2\n2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("isempty"); nargin("size"); nargin("numel"); nargin("ind2sub"); nargin("sub2ind")'))).toBe('1\n-2\n-2\n2\n-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("size"); nargout("ind2sub"); nargout("numel")'))).toBe('-1\n-1\n1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("zeros"); nargin("ones"); nargin("rand"); nargin("randi"); nargin("reshape"); nargin("repmat"); nargin("squeeze")'),
                ),
            ).toBe('-1\n-1\n-1\n-2\n-2\n-2\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("colon"); nargin("linspace"); nargin("logspace"); nargin("cat"); nargin("horzcat"); nargin("vertcat")'))).toBe(
                '-3\n-3\n-3\n-2\n-1\n-1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("meshgrid"); nargout("meshgrid"); nargin("ndgrid"); nargout("ndgrid")'))).toBe('-3\n-3\n-1\n-1\n');
            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute('nargin("all"); nargin("sum"); nargin("cumsum"); nargin("min"); nargin("max"); nargin("mean"); nargin("var"); nargin("std")'),
                ),
            ).toBe('-2\n-2\n-2\n-3\n-3\n-2\n-3\n-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("all"); nargout("sum"); nargout("min"); nargout("max"); nargout("cummin"); nargout("cummax")'))).toBe(
                '1\n1\n-2\n-2\n-2\n-2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("struct"); nargout("struct")'))).toBe('-1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("eye"); nargin("diag"); nargin("trace"); nargin("det"); nargin("inv"); nargin("gauss")'))).toBe(
                '-2\n-3\n1\n1\n1\n2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("lu"); nargin("dot"); nargin("cross"); nargin("kron"); nargin("qr"); nargin("eig")'))).toBe(
                '1\n-3\n-3\n2\n1\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargout("lu"); nargout("qr"); nargout("eig"); nargout("dot"); nargout("kron")'))).toBe('-3\n-3\n-3\n1\n1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("configure"); nargout("configure"); nargin("getconfig"); nargout("getconfig")'))).toBe('-2\n1\n-1\n1\n');
        });

        it('Should derive built-in function arity from overloaded signatures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.defineBuiltInFunction('sigfixedoverload', (...args: any[]) => args[0], false, [], {
                inputs: [{ arity: 1 }, { arity: 3 }],
                outputs: [{ arity: 1 }, { arity: 2 }],
            });
            localInterpreter.context.defineBuiltInFunction('sigboundedrange', (...args: any[]) => args[0], false, [], {
                inputs: { arity: -4, min: 2, max: 4 },
                outputs: { arity: -3, min: 1, max: 3 },
            });
            localInterpreter.context.defineBuiltInFunction('sigunboundedvarargin', (...args: any[]) => args[0], false, [], {
                inputs: [{ arity: 0 }, { arity: -3, min: 2, parameters: [{ name: 'a' }, { name: 'b' }, { name: 'rest', variadic: true }] }],
                outputs: { arity: -2 },
            });

            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigfixedoverload"); nargout("sigfixedoverload")'))).toBe('-3\n-2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigboundedrange"); nargout("sigboundedrange")'))).toBe('-4\n-3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("sigunboundedvarargin"); nargout("sigunboundedvarargin")'))).toBe('-3\n-2\n');
        });

        it('Should validate built-in input counts from signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('class()')).toThrow('Invalid call to class.');
            expect(() => localInterpreter.Execute('localfunctions(1)')).toThrow('Invalid call to localfunctions.');
            expect(() => localInterpreter.Execute('feval()')).toThrow('Invalid call to feval.');
            expect(() => localInterpreter.Execute('eval()')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", "2", "3")')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('evalin("base")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('evalin("base", "1", "2", "3")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", "x")')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('nargin(1, 2)')).toThrow('Invalid call to nargin.');
            expect(() => localInterpreter.Execute('dbstack(1, "-completenames", 2)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('sin()')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('sin(1, 2)')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('logb(2)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('logb(2, 10, 3)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('isempty()')).toThrow('Invalid call to isempty.');
            expect(() => localInterpreter.Execute('isempty(1, 2)')).toThrow('Invalid call to isempty.');
            expect(() => localInterpreter.Execute('size()')).toThrow('Invalid call to size.');
            expect(() => localInterpreter.Execute('numel()')).toThrow('Invalid call to numel.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2])')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2])')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('randi()')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('reshape([1, 2])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('repmat(1)')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('squeeze()')).toThrow('Invalid call to squeeze.');
            expect(() => localInterpreter.Execute('squeeze(1, 2)')).toThrow('Invalid call to squeeze.');
            expect(() => localInterpreter.Execute('colon(1)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, 2, 3, 4)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('linspace(1)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace(1, 2, 3, 4)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('logspace(1)')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('meshgrid()')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('meshgrid(1, 2, 3, 4)')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('ndgrid()')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('cat(1)')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('sum()')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('sum(1, 2, 3)')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('cumsum()')).toThrow('Invalid call to cumsum.');
            expect(() => localInterpreter.Execute('max()')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('max(1, [], 1, 2)')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('mean()')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('var(1, 0, 1, 2)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('struct(1, 2)')).toThrow('Invalid call to struct.');
            expect(() => localInterpreter.Execute('eye(1, 2, 3)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('diag()')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1], 0, 1, 2)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('trace()')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('det(1, 2)')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('gauss([1])')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('dot([1], [1], 1, 2)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('cross([1], [1], 1, 2)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('kron([1])')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('qr()')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('eig([1], 2)')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('configure(1, 2, 3)')).toThrow('Invalid call to configure.');
            expect(() => localInterpreter.Execute('getconfig(1, 2)')).toThrow('Invalid call to getconfig.');
        });

        it('Should validate built-in input parameter classes from signatures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.context.defineBuiltInFunction('sigalt', (...args: any[]) => args[0], false, [], {
                inputs: {
                    arity: 1,
                    parameters: [
                        {
                            name: 'value',
                            classes: ['double'],
                            alternatives: [
                                { name: 'scalar', validators: ['scalar'] },
                                { name: 'vector', validators: ['vector'] },
                            ],
                        },
                    ],
                },
                outputs: { arity: 1 },
            } as any);

            expect(localInterpreter.Unparse(localInterpreter.Execute('sigalt(1); sigalt([1, 2])'))).toBe('1\n[1,2]\n');
            expect(() => localInterpreter.Execute('sigalt("x")')).toThrow('Invalid call to sigalt.');
            expect(() => localInterpreter.Execute('sigalt([1, 2; 3, 4])')).toThrow('Invalid call to sigalt.');
            localInterpreter.context.defineBuiltInFunction('signormalized', (...args: any[]) => args[0], false, [], {
                inputs: {
                    arity: 1,
                    parameters: [
                        {
                            name: 'dimension',
                            classes: ['double'],
                            validators: ['numeric', 'scalar', 'real', 'finite', 'integer', 'nonnegative', 'dimension', 'positive'],
                        },
                    ],
                },
                outputs: { arity: 1 },
            });
            expect(localInterpreter.Unparse(localInterpreter.Execute('signormalized(2)'))).toBe('2\n');
            expect(() => localInterpreter.Execute('signormalized(0)')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('signormalized(2.5)')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('signormalized([1, 2])')).toThrow('Invalid call to signormalized.');
            expect(() => localInterpreter.Execute('isa(1, 2)')).toThrow('Invalid call to isa.');
            expect(() => localInterpreter.Execute('func2str("sin")')).toThrow('Invalid call to func2str.');
            expect(() => localInterpreter.Execute('str2func(1)')).toThrow('Invalid call to str2func.');
            expect(() => localInterpreter.Execute('functions("sin")')).toThrow('Invalid call to functions.');
            expect(() => localInterpreter.Execute('eval(1)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", 2)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('evalin(1, "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('evalin("base", 1)')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", 1, 2)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('inputname("1")')).toThrow('Invalid call to inputname.');
            expect(() => localInterpreter.Execute('narginchk(-1, 2)')).toThrow('Invalid call to narginchk.');
            expect(() => localInterpreter.Execute('narginchk(0.5, 2)')).toThrow('Invalid call to narginchk.');
            expect(() => localInterpreter.Execute('nargoutchk(0, -1)')).toThrow('Invalid call to nargoutchk.');
            expect(() => localInterpreter.Execute('nargoutchk(0, 1.5)')).toThrow('Invalid call to nargoutchk.');
            expect(() => localInterpreter.Execute('dbstack(-1)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('dbstack(1.5)')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('dbstack("bad")')).toThrow('Invalid call to dbstack.');
            expect(() => localInterpreter.Execute('evalin("unknown", "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("unknown", "x", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('assignin("base", "bad-name", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('sin("x")')).toThrow('Invalid call to sin.');
            expect(() => localInterpreter.Execute('logb("x", 2)')).toThrow('Invalid call to logb.');
            expect(() => localInterpreter.Execute('hypot(3, "x")')).toThrow('Invalid call to hypot.');
            expect(() => localInterpreter.Execute('size([1, 2], "1")')).toThrow('Invalid call to size.');
            expect(() => localInterpreter.Execute('find("x")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], "1")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], 1.5)')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], -1)')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('find([1, 0], 1, "middle")')).toThrow('Invalid call to find.');
            expect(() => localInterpreter.Execute('sort("x")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 0)')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 1.5)')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], "up")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('sort([1, 2], 1, "up")')).toThrow('Invalid call to sort.');
            expect(() => localInterpreter.Execute('ind2sub("bad", 1)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2; 3, 3], 1)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], 0)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], 1.5)')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('ind2sub([2, 2], [1, 2.5])')).toThrow('Invalid call to ind2sub.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], "1")')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2; 3, 3], 1, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], 0, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], 1.5, 1)')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('sub2ind([2, 2], [1, 2.5], [1, 2])')).toThrow('Invalid call to sub2ind.');
            expect(() => localInterpreter.Execute('zeros("2")')).toThrow('Invalid call to zeros.');
            expect(() => localInterpreter.Execute('ones(2, "3")')).toThrow('Invalid call to ones.');
            expect(() => localInterpreter.Execute('rand("2")')).toThrow('Invalid call to rand.');
            expect(() => localInterpreter.Execute('zeros(1.5)')).toThrow('Invalid call to zeros.');
            expect(() => localInterpreter.Execute('ones(-1)')).toThrow('Invalid call to ones.');
            expect(() => localInterpreter.Execute('rand([1, 2; 3, 4])')).toThrow('Invalid call to rand.');
            expect(() => localInterpreter.Execute('randi("10")')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(2.5)')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi([1, 5, 9])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi([1.5, 5])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(5, [1, 2; 3, 4])')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('randi(5, 1.5)')).toThrow('Invalid call to randi.');
            expect(() => localInterpreter.Execute('reshape([1, 2], "2")')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], [1, 2; 3, 4])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], 1.5, [])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('reshape([1, 2], -1, [])')).toThrow('Invalid call to reshape.');
            expect(() => localInterpreter.Execute('repmat(1, "2")')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, [1, 2; 3, 4])')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, 1.5, 2)')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('repmat(1, [])')).toThrow('Invalid call to repmat.');
            expect(() => localInterpreter.Execute('colon("1", 2)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon([1, 2], 3)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, [2, 3])')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon(1, 2, [3, 4])')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('colon([1, 2; 3, 4], 5)')).toThrow('Invalid call to colon.');
            expect(() => localInterpreter.Execute('linspace(1, 2, "3")')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace([1, 2; 3, 4], 5)')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('linspace(1, [2, 3; 4, 5])')).toThrow('Invalid call to linspace.');
            expect(() => localInterpreter.Execute('logspace(1, "2")')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('logspace([1, 2; 3, 4], 5)')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('logspace(1, [2, 3; 4, 5])')).toThrow('Invalid call to logspace.');
            expect(() => localInterpreter.Execute('cat("1", [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(1.5, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(0, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('cat(-1, [1], [2])')).toThrow('Invalid call to cat.');
            expect(() => localInterpreter.Execute('sum([1, 2], "2")')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('all([1, 2], 0)')).toThrow('Invalid call to all.');
            expect(() => localInterpreter.Execute('any([1, 2], -1)')).toThrow('Invalid call to any.');
            expect(() => localInterpreter.Execute('sum([1, 2], 1.5)')).toThrow('Invalid call to sum.');
            expect(() => localInterpreter.Execute('prod([1, 2], [1, 2])')).toThrow('Invalid call to prod.');
            expect(() => localInterpreter.Execute('sumsq([1, 2], [])')).toThrow('Invalid call to sumsq.');
            expect(() => localInterpreter.Execute('cumsum([1, 2], "2")')).toThrow('Invalid call to cumsum.');
            expect(() => localInterpreter.Execute('cumprod([1, 2], 0)')).toThrow('Invalid call to cumprod.');
            expect(() => localInterpreter.Execute('max([1, 2], [], "2")')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('min([1, 2], 1, 2)')).toThrow('Invalid call to min.');
            expect(() => localInterpreter.Execute('min([1, 2], [], 0)')).toThrow('Invalid call to min.');
            expect(() => localInterpreter.Execute('max([1, 2], [], 1.5)')).toThrow('Invalid call to max.');
            expect(() => localInterpreter.Execute('cummin([1, 2], [])')).toThrow('Invalid call to cummin.');
            expect(() => localInterpreter.Execute('cummax([1, 2], -1)')).toThrow('Invalid call to cummax.');
            expect(() => localInterpreter.Execute('mean([1, 2], "2")')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('mean([1, 2], 0)')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('mean([1, 2], 1.5)')).toThrow('Invalid call to mean.');
            expect(() => localInterpreter.Execute('var([1, 2], "0")')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0.5)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0, 0)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('var([1, 2], 0, 1.5)')).toThrow('Invalid call to var.');
            expect(() => localInterpreter.Execute('std([1, 2], 0, "2")')).toThrow('Invalid call to std.');
            expect(() => localInterpreter.Execute('std([1, 2], 1, -1)')).toThrow('Invalid call to std.');
            expect(() => localInterpreter.Execute('struct("a", 1, 2, 3)')).toThrow('Invalid call to struct.');
            expect(() => localInterpreter.Execute('meshgrid("x")')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('meshgrid([1, 2; 3, 4])')).toThrow('Invalid call to meshgrid.');
            expect(() => localInterpreter.Execute('ndgrid("x")')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('ndgrid([1, 2; 3, 4])')).toThrow('Invalid call to ndgrid.');
            expect(() => localInterpreter.Execute('eye("2")')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye([1, 2, 3])')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye(1.5)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('eye(-1)')).toThrow('Invalid call to eye.');
            expect(() => localInterpreter.Execute('diag([1], "0")')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1], 0.5)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1, 2], 2, 1.5)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('diag([1, 2; 3, 4], 2, 2)')).toThrow('Invalid call to diag.');
            expect(() => localInterpreter.Execute('trace("x")')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('trace(reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to trace.');
            expect(() => localInterpreter.Execute('det("x")')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('det([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to det.');
            expect(() => localInterpreter.Execute('inv("x")')).toThrow('Invalid call to inv.');
            expect(() => localInterpreter.Execute('inv([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to inv.');
            expect(() => localInterpreter.Execute('gauss([1], "x")')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('gauss([1, 2, 3; 4, 5, 6], [1; 2])')).toThrow('Invalid call to gauss.');
            expect(() => localInterpreter.Execute('dot([1], "x")')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], 0)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], 1.5)')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('dot([1], [1], [])')).toThrow('Invalid call to dot.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], "1")')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], 0)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], 1.5)')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('cross([1, 0, 0], [0, 1, 0], [])')).toThrow('Invalid call to cross.');
            expect(() => localInterpreter.Execute('kron([1], "x")')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('kron(reshape(1:8, 2, 2, 2), [1])')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('kron([1], reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to kron.');
            expect(() => localInterpreter.Execute('qr("x")')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('qr(reshape(1:8, 2, 2, 2))')).toThrow('Invalid call to qr.');
            expect(() => localInterpreter.Execute('eig("x")')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('eig([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to eig.');
            expect(() => localInterpreter.Execute('test([1, 2, 3; 4, 5, 6])')).toThrow('Invalid call to test.');
            expect(() => localInterpreter.Execute('norm("x")')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], "bad")')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], 0)')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], -1)')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('norm([1, 2], [1, 2])')).toThrow('Invalid call to norm.');
            expect(() => localInterpreter.Execute('configure(1, 2)')).toThrow('Invalid call to configure.');
            expect(() => localInterpreter.Execute('getconfig(123)')).toThrow('Invalid call to getconfig.');
            expect(() => localInterpreter.Execute('feval(123, 1)')).toThrow('Invalid call to feval.');
            expect(() => localInterpreter.Execute('feval("which", 1)')).toThrow('Invalid call to which.');
            expect(() => localInterpreter.Execute('exist(1)')).toThrow('Invalid call to exist.');
        });

        it('Should use core function signatures for dimension and shape helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('isempty([]); isscalar(1); isvector([1, 2]); isrow([1, 2]); iscolumn([1; 2])'))).toBe('true\ntrue\ntrue\ntrue\ntrue\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('size([1, 2; 3, 4]); size([1, 2; 3, 4], 1); size([1, 2; 3, 4], [1, 2])'))).toBe('[2,2]\n2\n[2,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = reshape(1:24, 2, 3, 4); [m, n] = size(A); [p, q, r, s] = size(A); m; n; p; q; r; s'))).toBe(
                'A=[1,3,5;\n2,4,6] (:,:,1)\n[7,9,11;\n8,10,12] (:,:,2)\n[13,15,17;\n14,16,18] (:,:,3)\n[19,21,23;\n20,22,24] (:,:,4)\n\nm=2\nn=12\np=2\nq=3\nr=4\ns=1\n2\n12\n2\n3\n4\n1\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('numel([1, 2; 3, 4]); ndims([1, 2; 3, 4]); rows([1, 2; 3, 4]); columns([1, 2; 3, 4]); length([1; 2; 3])'))).toBe(
                '4\n2\n2\n2\n3\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[r, c] = ind2sub([2, 3], 5); sub2ind([2, 3], r, c)'))).toBe('r=1\nc=3\n5\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('find([0, 4, 0; 5, 0, 6]); find([0, 4, 0; 5, 0, 6], 2); find([0, 4, 0; 5, 0, 6], 2, "last")'))).toBe(
                '[2;\n3;\n6]\n[2;\n3]\n[3;\n6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[i, j, v] = find([0, 4, 0; 5, 0, 6]); i; j; v'))).toBe(
                'i=[2;\n1;\n2]\nj=[1;\n2;\n3]\nv=[5;\n4;\n6]\n[2;\n1;\n2]\n[1;\n2;\n3]\n[5;\n4;\n6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('sort([3, 1, 2]); sort([3, 1, 2], "descend"); A = [3, 1; 2, 4]; sort(A); sort(A, 2)'))).toBe(
                '[1,2,3]\n[3,2,1]\nA=[3,1;\n2,4]\n[2,1;\n3,4]\n[1,3;\n2,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[B, I] = sort([30, 10, 20]); B; I; [C, J] = sort([3, 1; 2, 4], 2, "descend"); C; J'))).toBe(
                'B=[10,20,30]\nI=[2,3,1]\n[10,20,30]\n[2,3,1]\nC=[3,1;\n4,2]\nJ=[1,2;\n2,1]\n[3,1;\n4,2]\n[1,2;\n2,1]\n',
            );
        });

        it('Should use core function signatures for array creation and reshaping helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('zeros(); ones(2); zeros(2, 3); ones([1, 3])'))).toBe('0\n[1,1;\n1,1]\n[0,0,0;\n0,0,0]\n[1,1,1]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('zeros([2; 1]); size(ones([1; 3])); size(rand([2; 3]))'))).toBe('[0;\n0]\n[1,3]\n[2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('size(randi(5)); size(randi(5, 2)); size(randi([2, 5], [2; 3])); size(randi([2; 5], 1, 2))'))).toBe(
                '[1,1]\n[2,2]\n[2,3]\n[1,2]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('reshape([1, 2, 3, 4], 2, 2); reshape([1, 2, 3, 4], [2, 2]); reshape(1:6, 2, []); reshape(1:6, [], 3)'))).toBe(
                '[1,3;\n2,4]\n[1,3;\n2,4]\n[1,3,5;\n2,4,6]\n[1,3,5;\n2,4,6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('repmat(5, 1, 3); repmat([1, 2], 2, 1); repmat(5, [1; 3]); squeeze(reshape([1, 2], 1, 1, 2))'))).toBe(
                '[5,5,5]\n[1,2;\n1,2]\n[5,5,5]\n[1;\n2]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('size(rand(2, 3)); size(randi(5, 2, 3)); size(randi([2, 5], [2, 3]))'))).toBe('[2,3]\n[2,3]\n[2,3]\n');
        });

        it('Should use core function signatures for sequence and concatenation helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('colon(1, 4); colon(1, 2, 5); linspace(1, 5, 3); logspace(1, 3, 3)'))).toBe(
                '[1,2,3,4]\n[1,3,5]\n[1,3,5]\n[10,100,1000]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[X, Y] = meshgrid(1:3, 4:5); X; Y; [A, B] = ndgrid(1:2, 3:4); A; B'))).toBe(
                'X=[1,2,3;\n1,2,3]\nY=[4,4,4;\n5,5,5]\n[1,2,3;\n1,2,3]\n[4,4,4;\n5,5,5]\nA=[1,1;\n2,2]\nB=[3,4;\n3,4]\n[1,1;\n2,2]\n[3,4;\n3,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('cat(1, [1, 2], [3, 4]); horzcat([1; 2], [3; 4]); vertcat([1, 2], [3, 4])'))).toBe(
                '[1,2;\n3,4]\n[1,3;\n2,4]\n[1,2;\n3,4]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('cat(3, [1, 2], [3, 4]); horzcat(); vertcat()'))).toBe('[1,2] (:,:,1)\n[3,4] (:,:,2)\n\n[ ](0x0)\n[ ](0x0)\n');
        });

        it('Should use core function signatures for reduction and accumulation helpers.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; all(A); all(A, 2); any([0, 1; 0, 0])'))).toBe(
                'A=[1,2;\n3,4]\n[true,true]\n[true;\ntrue]\n[false,true]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; sum(A); sum(A, 2); prod(A); sumsq([1, 2, 3]); cumsum([1, 2, 3]); cumprod([1, 2, 3])'))).toBe(
                'A=[1,2;\n3,4]\n[4,6]\n[3;\n7]\n[3,8]\n14\n[1,3,6]\n[1,2,6]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; max(A); min(A, [], 2); [m, idx] = max(A); m; idx'))).toBe(
                'A=[1,2;\n3,4]\n[3,4]\n[1;\n3]\nm=[3,4]\nidx=[2,2]\n[3,4]\n[2,2]\n',
            );
            expect(
                localInterpreter.Unparse(localInterpreter.Execute('A = [3, 1; 2, 4]; max(A, [], 2); min(A, [2, 2; 2, 2]); [v, idx] = cummin(A); v; idx; [w, j] = cummax(A, 2); w; j')),
            ).toBe('A=[3,1;\n2,4]\n[3;\n4]\n[2,1;\n2,2]\nv=[3,1;\n2,1]\nidx=[1,1;\n2,1]\n[3,1;\n2,1]\n[1,1;\n2,1]\nw=[3,3;\n2,4]\nj=[1,1;\n1,2]\n[3,3;\n2,4]\n[1,1;\n1,2]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; mean(A); mean(A, 2); var([1, 2, 3]); std([1, 2, 3])'))).toBe(
                'A=[1,2;\n3,4]\n[2,3]\n[1.5;\n3.5]\n[1]\n[1]\n',
            );
        });

        it('Should use core function signatures for struct construction.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('s = struct(); t = struct("a", 1, "b", [2, 3]); t.a; t.b'))).toBe(
                's=struct {\n\n}\nt=struct {\na: 1\nb: [2,3]\n}\n1\n[2,3]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('u = struct(t); u.a; u.b'))).toBe('u=struct {\na: 1\nb: [2,3]\n}\n1\n[2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin("struct"); nargout("struct")'))).toBe('-1\n1\n');
            expect(() => localInterpreter.Execute('struct(@sin)')).toThrow('Invalid call to struct.');
        });

        it('Should use linear algebra function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(
                localInterpreter.Unparse(
                    localInterpreter.Execute(
                        'A = [1, 2; 3, 4]; eye(); eye(2); eye(2, 3); eye([1; 2]); diag([1, 2, 3]); diag([1, 2, 3], 1); diag([1, 2], 2, 3); diag(A); trace(A); det(A); inv(A)',
                    ),
                ),
            ).toBe('A=[1,2;\n3,4]\n1\n[1,0;\n0,1]\n[1,0,0;\n0,1,0]\n[1,0]\n[1,0,0;\n0,2,0;\n0,0,3]\n[0,1,0;\n0,0,2;\n0,0,0]\n[1,0,0;\n0,2,0]\n[1;\n4]\n5\n-2\n[-2,1;\n1.5,-0.5]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; [L, U, P] = lu(A); L; U; P'))).toBe(
                'A=[1,2;\n3,4]\nL=[1,0;\n0.333333333333333333,1]\nU=[3,4;\n0,0.666666666666666666]\nP=[0,1;\n1,0]\n[1,0;\n0.333333333333333333,1]\n[3,4;\n0,0.666666666666666666]\n[0,1;\n1,0]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('dot([1, 2, 3], [4, 5, 6]); cross([1, 0, 0], [0, 1, 0]); kron([1, 2], [3; 4]); kron(2, [3, 4])'))).toBe(
                '32\n[0,0,1]\n[3,6;\n4,8]\n[6,8]\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('norm([3, 4]); norm([1, -2, 3], 1); norm([1, -2, 3], inf); norm([1, 2; 3, 4], "fro")'))).toBe(
                '5\n6\n3\n5.477225575051661134\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('A = [1, 2; 3, 4]; [Q, R] = qr(A); size(Q); size(R); [V, D] = eig([2, 1; 1, 2]); size(V); D'))).toBe(
                'A=[1,2;\n3,4]\nQ=[-0.31622776601683793,-0.94868329805051379;\n-0.94868329805051379,0.316227766016837933]\nR=[-3.16227766016837933,-4.42718872423573106;\n0,-0.63245553203367586]\n[2,2]\n[2,2]\nV=[0.707106781186547524,0.707106781186547524;\n-0.70710678118654752,0.707106781186547524]\nD=[1,0;\n0,3]\n[2,2]\n[1,0;\n0,3]\n',
            );
        });

        it('Should use configuration function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(localInterpreter.Unparse(localInterpreter.Execute('getconfig("precision"); configure("precision", 34); getconfig("precision"); configure()'))).toBe(
                "{precision,336}\nConfiguration parameter 'precision' set to '34'\n{precision,34}\nAll configuration set to default values.\n",
            );
        });

        it('Should provide signatures for all registered built-in functions.', () => {
            const localInterpreter = Interpreter.Create();
            const missingSignatures = localInterpreter.context.builtInFunctionList.filter((name: string) => !localInterpreter.context.builtInFunctionTable[name].signature);
            const arityFailures: string[] = [];
            for (const name of localInterpreter.context.builtInFunctionList) {
                try {
                    localInterpreter.Execute(`nargin("${name}"); nargout("${name}")`);
                } catch (error: unknown) {
                    arityFailures.push(`${name}: ${(error as Error).message}`);
                }
            }
            expect(missingSignatures).toEqual([]);
            expect(arityFailures).toEqual([]);
        });

        it('Should expose nargin and nargout inside anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin; f(1, 2)'))).toBe('f=@(x,y) nargin\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, y) nargin(); f(1, 2)'))).toBe('f=@(x,y) nargin()\n2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) nargout; a = g(10)'))).toBe('g=@(x) nargout\na=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) nargout(); a = g(10)'))).toBe('g=@(x) nargout()\na=1\n');
        });

        it('Should expose anonymous function call metadata through returned closures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makeanonymouscounter(offset)', '  f = @(x, y) nargin + nargout + offset;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makeanonymouscounter(10); h(1, 2)'))).toBe('h=@(x,y) nargin+nargout+offset\n13\n');
        });

        it('Should support varargin in anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x, varargin) x + varargin{1} + nargin; f(1, 2, 3)'))).toBe('f=@(x,varargin) x+varargin{1}+nargin\n6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(varargin) nargin; g(); g(1, 2, 3)'))).toBe('g=@(varargin) nargin\n0\n3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = @(x, varargin) nargin; feval(h, 1, 2, 3, 4)'))).toBe('h=@(x,varargin) nargin\n4\n');
            expect(() => localInterpreter.Execute('f = @(x, varargin) x; f()')).toThrow('invalid number of arguments.');
        });

        it('Should validate anonymous function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute('f = @(x, x) x')).toThrow("duplicate parameter name 'x' in anonymous function.");
            expect(() => localInterpreter.Execute('f = @(varargin, x) x')).toThrow('varargin must be the last parameter in anonymous function.');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(~, x, ~) x + nargin; f(1, 5, 9)'))).toBe('f=@(~,x,~) x+nargin\n8\n');
        });

        it('Should report variadic anonymous function handle arity.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargin(@(x, varargin) x); nargin("@(x, varargin) x"); nargout(@(varargin) nargin)'))).toBe('-2\n-2\n1\n');
        });

        it('Should forward multiple outputs from anonymous function expressions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = pairfromanon(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) pairfromanon(x); [a, b] = f(5)'))).toBe('f=@(x) pairfromanon(x)\na=5\nb=6\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('g = @(x) size(x); [m, n] = g([1, 2, 3])'))).toBe('g=@(x) size(x)\nm=1\nn=3\n');
            expect(() => localInterpreter.Execute('h = @() nargout; [a, b] = h()')).toThrow('element number 2 undefined in return list');
        });

        it('Should reject invalid nargin and nargout introspection targets.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('nargin(3)')).toThrow('Invalid call to nargin.');
            expect(() => localInterpreter.Execute('nargout("missingarity")')).toThrow("'missingarity' undefined.");
        });

        it('Should validate current input count with narginchk.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = checkedinputs(a, varargin)', '  narginchk(1, 3)', '  y = nargin;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = checkedinputsinf(a, varargin)', '  narginchk(1, Inf)', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('narginchk(0, 2)'))).toBe('narginchk(0,2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('narginchk(0, Inf)'))).toBe('narginchk(0,Inf)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputs(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputs(1, 2, 3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedinputsinf(1, 2, 3, 4)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('checkedinputs(1, 2, 3, 4)')).toThrow('narginchk: invalid number of input arguments.');
        });

        it('Should validate requested output count with nargoutchk.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = checkedoutputs(x)', '  nargoutchk(1, 2)', '  a = nargout;', '  b = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(
                ['function varargout = checkedvaroutputs(x)', '  nargoutchk(1, 2)', '  varargout{1} = nargout;', '  varargout{2} = x + 1;', '  varargout{3} = x + 2;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargoutchk(0, 2)'))).toBe('nargoutchk(0,2)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('nargoutchk(0, Inf)'))).toBe('nargoutchk(0,Inf)\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = checkedoutputs(10)'))).toBe('a=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedoutputs(10)'))).toBe('a=2\nb=11\n');
            expect(() => localInterpreter.Execute('[a, b, c] = checkedoutputs(10)')).toThrow('element number 3 undefined in return list');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedvaroutputs(10)'))).toBe('a=2\nb=11\n');
            expect(() => localInterpreter.Execute('[a, b, c] = checkedvaroutputs(10)')).toThrow('nargoutchk: invalid number of output arguments.');
        });

        it('Should report simple caller argument names with inputname.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [first, second, third, fourth] = namesofinputs(x, y, z)',
                    '  first = inputname(1);',
                    '  second = inputname(2);',
                    '  third = inputname(3);',
                    '  fourth = inputname(4);',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = 10; b = 20; [first, second, third, fourth] = namesofinputs(a, b + 1, 30)'))).toBe(
                'a=10\nb=20\nfirst=a\nsecond=\nthird=\nfourth=\n',
            );
        });

        it('Should report immediate caller argument names through inputname in nested function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function name = outerinputname(x)', '  name = inner(x);', '  function y = inner(value)', '    y = inputname(1);', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 5; outerinputname(source)'))).toBe('source=5\nx\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('outerinputname(5)'))).toBe('x\n');
        });

        it('Should report caller argument names inside anonymous functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); source = 10; f(source)'))).toBe('f=@(x) inputname(1)\nsource=10\nsource\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) inputname(1); f(10)'))).toBe('f=@(x) inputname(1)\n\n');
        });

        it('Should report caller argument names inside returned anonymous closures.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function f = makeinputnameanon()', '  f = @(x) inputname(1);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h = makeinputnameanon(); source = 20; h(source)'))).toBe('h=@(x) inputname(1)\nsource=20\nsource\n');
        });

        it('Should reject inputname outside functions and invalid argument numbers.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = badinputname(n)', '  y = inputname(n);', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('inputname(1)')).toThrow('inputname is only valid inside a function.');
            expect(() => localInterpreter.Execute('badinputname(0)')).toThrow('Invalid call to inputname.');
            expect(() => localInterpreter.Execute('badinputname(1.5)')).toThrow('Invalid call to inputname.');
        });

        it('Should evaluate code in caller and base workspaces with evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = readcallerexpr()', '  x = 10;', '  y = evalin("caller", "x + 1");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = readbaseexpr()', '  x = 10;', '  y = evalin("base", "x + 1");', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 20; readcallerexpr()'))).toBe('x=20\n21\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('readbaseexpr()'))).toBe('21\n');
        });

        it('Should evaluate code in anonymous caller workspaces with evalin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = readcallerx()', '  y = evalin("caller", "x");', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinlambdaouter()', '  x = 7;', '  f = @(t) evalin("caller", "x + 1");', '  y = f(3);', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinlambdaarg()', '  f = @(x) evalin("caller", "x + 5");', '  y = f(20);', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalinreturnedlambda()', '  x = 30;', '  f = makereadcallerlambda();', '  y = f(1);', 'end'].join('\n'));
            localInterpreter.Execute(['function f = makereadcallerlambda()', '  f = @(t) evalin("caller", "x + t");', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('f = @(x) readcallerx(); f(10)'))).toBe('f=@(x) readcallerx()\n10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlambdaouter()'))).toBe('8\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinlambdaarg()'))).toBe('25\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinreturnedlambda()'))).toBe('31\n');
        });

        it('Should assign variables in caller and base workspaces with assignin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function setcaller()', '  assignin("caller", "createdByCaller", 99)', 'end'].join('\n'));
            localInterpreter.Execute(['function setbase()', '  assignin("base", "createdByBase", 123)', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('setcaller(); createdByCaller'))).toBe('99\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('setbase(); createdByBase'))).toBe('123\n');
        });

        it('Should assign into the calling user function workspace with assignin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = outerassignin()', '  innerassignin();', '  y = localValue;', '  function innerassignin()', '    assignin("caller", "localValue", 7)', '  end', 'end'].join(
                    '\n',
                ),
            );

            expect(localInterpreter.Unparse(localInterpreter.Execute('outerassignin()'))).toBe('7\n');
            expect(localInterpreter.context.currentScope.resolveName('localValue')).toBeUndefined();
        });

        it('Should assign into anonymous caller workspaces with assignin caller.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = assigninlambdaouter()', '  f = @() assignin("caller", "createdInOuter", 9);', '  f();', '  y = createdInOuter;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('assigninlambdaouter()'))).toBe('9\n');
            expect(localInterpreter.context.currentScope.resolveName('createdInOuter')).toBeUndefined();
        });

        it('Should reject unsupported evalin and assignin forms.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('evalin("unknown", "1")')).toThrow('Invalid call to evalin.');
            expect(() => localInterpreter.Execute('assignin("base", "bad-name", 1)')).toThrow('Invalid call to assignin.');
            expect(() => localInterpreter.Execute('assignin("base", "x")')).toThrow('Invalid call to assignin.');
        });

        it('Should evaluate code in the current workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Execute('x = 10; eval("y = x + 1"); y'))).toBe('x=10\ny=11\n11\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("x + y")'))).toBe('21\n');
        });

        it('Should evaluate code in a user function workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalinside(x)', '  eval("z = x + 1");', '  y = z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalinside(10)'))).toBe('11\n');
            expect(localInterpreter.context.currentScope.resolveName('z')).toBeUndefined();
        });

        it('Should evaluate code in a nested function workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalnested()', '  x = 1;', '  inner();', '  y = x;', '  function inner()', '    eval("x = x + 4");', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalnested()'))).toBe('5\n');
        });

        it('Should call nested functions from eval code.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('z = 21');
            localInterpreter.Execute(['function y = evalcallsfunction(x)', '  eval("t = helper(x)");', '  y = t;', '  function z = helper(v)', '    z = v * 2;', '  end', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalcallsfunction(8)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('z'))).toBe('21\n');
        });

        it('Should evaluate catch code in the current workspace with eval.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalcatchinside()', '  eval("missingName + 1", "fallback = 42");', '  y = fallback;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('eval("missingValue + 1", "caughtValue = 12"); caughtValue'))).toBe('caughtValue=12\n12\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalcatchinside()'))).toBe('42\n');
            expect(localInterpreter.context.currentScope.resolveName('fallback')).toBeUndefined();
        });

        it('Should evaluate catch code in the selected workspace with evalin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = evalincatchcaller()', '  evalin("caller", "missingCaller + 1", "callerFallback = 33");', '  y = 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = evalincatchbase()', '  evalin("base", "missingBase + 1", "baseFallback = 44");', '  y = 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalincatchcaller(); callerFallback'))).toBe('1\n33\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('evalincatchbase(); baseFallback'))).toBe('1\n44\n');
        });

        it('Should propagate catch errors from eval and evalin.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('eval("missingPrimary", "missingCatch")')).toThrow("'missingCatch' undefined.");
            expect(() => localInterpreter.Execute('evalin("base", "missingPrimary", "missingCatch")')).toThrow("'missingCatch' undefined.");
        });

        it('Should reject unsupported eval forms.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('eval(1)')).toThrow('Invalid call to eval.');
            expect(() => localInterpreter.Execute('eval("1", 2)')).toThrow('Invalid call to eval.');
        });

        it('Should return early from user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = early(x)', '  y = x;', '  return', '  y = x + 100;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('early(5)'))).toBe('5\n');
        });

        it('Should return early from nested statement lists inside functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = abszero(x)', '  if x < 0', '    y = 0;', '    return', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('abszero(-5)'))).toBe('0\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('abszero(7)'))).toBe('7\n');
        });

        it('Should preserve persistent variables when returning early.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = earlycounter(stop)', '  persistent c = 0;', '  c = c + 1;', '  y = c;', '  if stop', '    return', '  end', '  y = c + 100;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('earlycounter(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('earlycounter(0)'))).toBe('102\n');
        });

        it('Should reject return outside user-defined functions.', () => {
            const localInterpreter = Interpreter.Create();
            expect(localInterpreter.Unparse(localInterpreter.Parse('return'))).toBe('return\n');
            expect(() => localInterpreter.Execute('return')).toThrow('return is only valid inside a function.');
        });

        it('Should validate requested outputs after an early return.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [a, b] = earlypair()', '  a = 1;', '  return', '  b = 2;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = earlypair()'))).toBe('a=1\n');
            expect(() => localInterpreter.Execute('[a, b] = earlypair()')).toThrow("Undefined return variable 'b'");
        });

        it('Should keep nested function call metadata isolated.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = inner()', '  y = nargout;', 'end'].join('\n'));
            localInterpreter.Execute(['function [a, b] = outer()', '  a = inner();', '  b = nargout;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[x, y] = outer()'))).toBe('x=1\ny=2\n');
        });

        it('Should reject nargin and nargout outside function bodies.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute('nargin')).toThrow('nargin is only valid inside a function.');
            expect(() => localInterpreter.Execute('nargout')).toThrow('nargout is only valid inside a function.');
        });

        it('Should bind extra function arguments into varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = firstextra(a, varargin)', '  y = a + varargin{1};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('firstextra(10, 3, 4)'))).toBe('13\n');
        });

        it('Should bind all function arguments into varargin when it is the only parameter.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = addfirsttwo(varargin)', '  y = varargin{1} + varargin{2};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('addfirsttwo(5, 7)'))).toBe('12\n');
        });

        it('Should count all supplied arguments when using varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = countall(a, varargin)', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('countall(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('countall(1, 2, 3)'))).toBe('3\n');
        });

        it('Should reject calls with fewer arguments than fixed parameters before varargin.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = needsfixed(a, b, varargin)', '  y = nargin;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('needsfixed(1)')).toThrow('invalid number of arguments in function needsfixed');
        });

        it('Should assign a single output from varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = splitvar(x)', '  varargout{1} = x;', '  varargout{2} = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = splitvar(10)'))).toBe('a=10\n');
        });

        it('Should assign multiple outputs from varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = splitvar(x)', '  varargout{1} = x;', '  varargout{2} = x + 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = splitvar(10)'))).toBe('a=10\nb=11\n');
        });

        it('Should expose requested output count while assigning varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = countvarouts()', '  varargout{1} = nargout;', '  varargout{2} = nargout + 10;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = countvarouts()'))).toBe('a=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = countvarouts()'))).toBe('a=2\nb=12\n');
        });

        it('Should report unassigned requested varargout elements.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = oneout(x)', '  varargout{1} = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('[a, b] = oneout(10)')).toThrow('element number 2 undefined in return list');
        });

        it('Should combine varargin and varargout.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function varargout = echoextras(varargin)', '  varargout{1} = varargin{1};', '  varargout{2} = varargin{2};', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = echoextras(3, 4)'))).toBe('a=3\nb=4\n');
        });

        it('Should validate duplicate function signature names.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = dupinput(x, x)', '  y = x;', 'end'].join('\n'))).toThrow("duplicate parameter name 'x' in function dupinput.");
            expect(() => localInterpreter.Execute(['function [y, y] = dupoutput()', '  y = 1;', 'end'].join('\n'))).toThrow("duplicate return name 'y' in function dupoutput.");
            localInterpreter.Execute(['function y = outerdupnested()', '  y = inner(1);', '  function z = inner(x, x)', '    z = x;', '  end', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('outerdupnested()')).toThrow("duplicate parameter name 'x' in function inner.");
        });

        it('Should validate variadic function signature positions.', () => {
            const localInterpreter = Interpreter.Create();

            expect(() => localInterpreter.Execute(['function y = badvarargin(varargin, x)', '  y = nargin;', 'end'].join('\n'))).toThrow(
                'varargin must be the last parameter in function badvarargin.',
            );
            expect(() => localInterpreter.Execute(['function [varargout, y] = badvarargout()', '  y = 1;', 'end'].join('\n'))).toThrow(
                'varargout must be the last return in function badvarargout.',
            );
        });

        it('Should ignore tilde placeholders while validating function signatures.', () => {
            const localInterpreter = Interpreter.Create();

            localInterpreter.Execute(['function [~, ~, y] = ignoredsignature(~, x, ~)', '  y = x + nargin;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, ~, z] = ignoredsignature(1, 5, 9)'))).toBe('z=8\n');
        });

        it('Should validate repeating arguments against varargin extras.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = countpositive(x, varargin)',
                    '  arguments',
                    '    x double',
                    '  end',
                    '  arguments (Repeating)',
                    '    value double {mustBePositive}',
                    '  end',
                    '  y = nargin;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('countpositive(1)'))).toBe('1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('countpositive(1, 2, 3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute("countpositive(1, 'a')")).toThrow("arguments block validation failed for 'value{1}': expected class double, got char.");
            expect(() => localInterpreter.Execute('countpositive(1, 2, -3)')).toThrow("arguments block validation failed for 'value{2}': mustBePositive.");
        });

        it('Should validate repeating argument sizes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = countrows(varargin)', '  arguments (Repeating)', '    row (1,2) double', '  end', '  y = nargin;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('countrows([1,2], [3,4])'))).toBe('2\n');
            expect(() => localInterpreter.Execute('countrows([1;2])')).toThrow("arguments block validation failed for 'row{1}': expected size 1x2, got 2x1.");
        });

        it('Should validate repeating argument groups.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = repeatpairs(varargin)', '  arguments (Repeating)', '    left double {mustBePositive}', '    right char', '  end', '  y = nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute("repeatpairs(1, 'a', 2, 'b')"))).toBe('4\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('repeatpairs()'))).toBe('0\n');
            expect(() => localInterpreter.Execute("repeatpairs(1, 'a', 2)")).toThrow('invalid number of repeating arguments in function repeatpairs');
            expect(() => localInterpreter.Execute("repeatpairs(1, 'a', -2, 'b')")).toThrow("arguments block validation failed for 'left{2}': mustBePositive.");
            expect(() => localInterpreter.Execute('repeatpairs(1, 2)')).toThrow("arguments block validation failed for 'right{1}': expected class char, got double.");
        });

        it('Should reject repeating arguments blocks without varargin.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute(['function y = repeatwithoutvarargin(x)', '  arguments (Repeating)', '    value double', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                'arguments (Repeating) requires a varargin parameter in function repeatwithoutvarargin.',
            );
        });

        it('Should bind name-value arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = scaleoffset(x, options)',
                    '  arguments',
                    '    x double',
                    '    options.factor double = 1',
                    '    options.offset double = 0',
                    '  end',
                    '  y = x * options.factor + options.offset;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2, offset=3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2)"))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, 'offset', 3)"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, offset=3)"))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2, "offset", 3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "factor", 2, offset=3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, fac=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'off', 3)"))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "fac", 2, "off", 3)'))).toBe('23\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, Factor=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'Fac', 2)"))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "OFFSET", 3)'))).toBe('13\n');
        });

        it('Should count original inputs for functions called with name-value arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [count, first, second, third, scale] = namevaluemetadata(x, options)',
                    '  arguments',
                    '    x',
                    '    options.scale double = 1',
                    '  end',
                    '  count = nargin;',
                    '  first = inputname(1);',
                    '  second = inputname(2);',
                    '  third = inputname(3);',
                    '  scale = options.scale;',
                    'end',
                ].join('\n'),
            );
            localInterpreter.Execute(
                ['function y = needsnamedcount(x, options)', '  arguments', '    x', '    options.scale double = 1', '  end', '  narginchk(2, 2)', '  y = nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('source = 10; [count, first, second, third, scale] = namevaluemetadata(source, scale=2)'))).toBe(
                'source=10\ncount=2\nfirst=source\nsecond=\nthird=\nscale=2\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('value = 3; [count, first, second, third, scale] = namevaluemetadata(source, "scale", value)'))).toBe(
                'value=3\ncount=3\nfirst=source\nsecond=\nthird=value\nscale=3\n',
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('needsnamedcount(10, scale=2)'))).toBe('2\n');
            expect(() => localInterpreter.Execute('needsnamedcount(10)')).toThrow('narginchk: invalid number of input arguments.');
        });

        it('Should distinguish optional positional strings from declared name-value strings.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [label, scale] = labelscale(x, label, options)',
                    '  arguments',
                    '    x',
                    "    label char = 'default'",
                    '    options.Scale double = 1',
                    '  end',
                    '  scale = options.Scale;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "hello")'))).toBe('label=hello\nscale=1\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "Scale", 3)'))).toBe('label=default\nscale=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[label, scale] = labelscale(5, "hello", "Scale", 3)'))).toBe('label=hello\nscale=3\n');
            expect(() => localInterpreter.Execute('[label, scale] = labelscale(5, "unknown", 3)')).toThrow('invalid number of arguments in function labelscale');
            expect(() => localInterpreter.Execute('[label, scale] = labelscale(5, "hello", "unknown", 3)')).toThrow("unknown name-value argument 'unknown' in function labelscale");
        });

        it('Should separate varargin extras from declared name-value arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function [count, firstExtra, scale] = mixedvarname(x, options, varargin)',
                    '  arguments',
                    '    x',
                    '    options.Scale double = 1',
                    '    varargin',
                    '  end',
                    '  count = nargin;',
                    '  firstExtra = varargin{1};',
                    '  scale = options.Scale;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[count, firstExtra, scale] = mixedvarname(10, 20, Scale=3)'))).toBe('count=3\nfirstExtra=20\nscale=3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('[count, firstExtra, scale] = mixedvarname(10, 20, "Scale", 4)'))).toBe('count=4\nfirstExtra=20\nscale=4\n');
            expect(() => localInterpreter.Execute('mixedvarname(10, Scale=3, 20)')).toThrow('positional arguments cannot follow name-value arguments in function mixedvarname');
        });

        it('Should validate name-value arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = bounded(x, options)', '  arguments', '    x double', '    options.factor double {mustBePositive} = 1', '  end', '  y = x * options.factor;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('bounded(5, factor=3)'))).toBe('15\n');
            expect(() => localInterpreter.Execute('bounded(5, factor=-1)')).toThrow("arguments block validation failed for 'options.factor': mustBePositive.");
            expect(() => localInterpreter.Execute("bounded(5, factor='abc')")).toThrow("arguments block validation failed for 'options.factor': expected class double, got char.");
        });

        it('Should reject invalid name-value argument calls and declarations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = scaleoffset(x, options)', '  arguments', '    x double', '    options.factor double = 1', '  end', '  y = x * options.factor;', 'end'].join('\n'),
            );
            expect(() => localInterpreter.Execute('scaleoffset(10, unknown=2)')).toThrow("unknown name-value argument 'unknown' in function scaleoffset");
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, factor=2, factor=3)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, fac=2, factor=3)'))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute("scaleoffset(10, 'factor', 2, factor=3)"))).toBe('30\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaleoffset(10, "Factor", 2, factor=3)'))).toBe('30\n');
            expect(() => localInterpreter.Execute("scaleoffset(10, 'factor')")).toThrow("missing value for name-value argument 'factor' in function scaleoffset");
            expect(() => localInterpreter.Execute('scaleoffset(10, "factor")')).toThrow("missing value for name-value argument 'factor' in function scaleoffset");
            expect(() => localInterpreter.Execute('scaleoffset(10, factor=2, 3)')).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute("scaleoffset(10, 'factor', 2, 3)")).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute('scaleoffset(10, "factor", 2, 3)')).toThrow('positional arguments cannot follow name-value arguments in function scaleoffset');
            expect(() => localInterpreter.Execute('scaleoffset(10, "unknown", 2)')).toThrow("unknown name-value argument 'unknown' in function scaleoffset");
            expect(() => localInterpreter.Execute(['function y = missingdefault(x, options)', '  arguments', '    options.factor double', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                "arguments block name-value declaration 'options.factor' requires a default value.",
            );
        });

        it('Should reject ambiguous name-value abbreviations.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = twofa(x, options)',
                    '  arguments',
                    '    x double',
                    '    options.factor double = 1',
                    '    options.fade double = 0',
                    '  end',
                    '  y = x * options.factor + options.fade;',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, fact=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, fad=3)'))).toBe('13\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, FACT=2)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('twofa(10, "FAD", 3)'))).toBe('13\n');
            expect(() => localInterpreter.Execute('twofa(10, fa=2)')).toThrow("ambiguous name-value argument 'fa' in function twofa");
            expect(() => localInterpreter.Execute('twofa(10, "fa", 2)')).toThrow("ambiguous name-value argument 'fa' in function twofa");
            expect(() => localInterpreter.Execute('twofa(10, "FA", 2)')).toThrow("ambiguous name-value argument 'FA' in function twofa");
        });

        it('Should accept arguments blocks that declare function parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = checkedarg(x)', '  arguments', '    x', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedarg(5)'))).toBe('5\n');
        });

        it('Should reject arguments blocks that declare unknown parameters.', () => {
            const localInterpreter = Interpreter.Create();
            expect(() => localInterpreter.Execute(['function y = checkedarg(x)', '  arguments', '    z', '  end', '  y = x;', 'end'].join('\n'))).toThrow(
                "arguments block declaration 'z' does not match a function parameter in function checkedarg.",
            );
        });

        it('Should validate symbolic argument dimensions declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = columnany(x)', '  arguments', '    x (n,1)', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = sameheight(x, z)', '  arguments', '    x (n,1)', '    z (n,1)', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('columnany([1;2;3])'))).toBe('[1;\n2;\n3]\n');
            expect(() => localInterpreter.Execute('columnany([1,2,3])')).toThrow("arguments block validation failed for 'x': expected size nx1, got 1x3.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('sameheight([1;2], [3;4])'))).toBe('[4;\n6]\n');
            expect(() => localInterpreter.Execute('sameheight([1;2], [3;4;5])')).toThrow("arguments block validation failed for 'z': expected size nx1, got 3x1.");
        });

        it('Should validate scalar argument sizes declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = scalaronly(x)', '  arguments', '    x (1,1)', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalaronly(5)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('scalaronly([1,2])')).toThrow("arguments block validation failed for 'x': expected size 1x1, got 1x2.");
        });

        it('Should validate vector argument sizes declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = rowonly(x)', '  arguments', '    x (1,2)', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('rowonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('rowonly([1;2])')).toThrow("arguments block validation failed for 'x': expected size 1x2, got 2x1.");
        });

        it('Should validate default argument values against declared sizes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = defaultscalar(x)', '  arguments', '    x (1,1) = 4', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultscalar()'))).toBe('4\n');
            expect(() => localInterpreter.Execute('defaultscalar([1,2])')).toThrow("arguments block validation failed for 'x': expected size 1x1, got 1x2.");
        });

        it('Should validate double arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = doubleonly(x)', '  arguments', '    x double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('doubleonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("doubleonly('abc')")).toThrow("arguments block validation failed for 'x': expected class double, got char.");
        });

        it('Should validate char arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = charonly(x)', '  arguments', '    x char', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute("charonly('abc')"))).toBe('abc\n');
            expect(() => localInterpreter.Execute('charonly(3)')).toThrow("arguments block validation failed for 'x': expected class char, got double.");
        });

        it('Should validate cell arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = cellonly(x)', '  arguments', '    x cell', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('cellonly({1,2})'))).toBe('{1,2}\n');
            expect(() => localInterpreter.Execute('cellonly([1,2])')).toThrow("arguments block validation failed for 'x': expected class cell, got double.");
        });

        it('Should validate struct arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = structonly(x)', '  arguments', '    x struct', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('structonly(struct())'))).toBe('struct {\n\n}\n');
            expect(() => localInterpreter.Execute('structonly(3)')).toThrow("arguments block validation failed for 'x': expected class struct, got double.");
        });

        it('Should validate function_handle arguments declared in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = handleonly(f)', '  arguments', '    f function_handle', '  end', '  y = f(3);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('handleonly(@(x) x + 1)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('handleonly(3)')).toThrow("arguments block validation failed for 'f': expected class function_handle, got double.");
        });

        it('Should parse qualified class names in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            const tree = localInterpreter.Parse(['function y = qualifiedarg(x)', '  arguments', '    x pkg.Value', '  end', '  y = x;', 'end'].join('\n')) as any;
            const func = tree.type === 'FCNDEF' ? tree : tree.list[0];
            const validation = func.arguments.list[0].validation[0];

            expect(validation.name.id).toBe('x');
            expect(validation.class.id).toBe('pkg.Value');
        });

        it('Should combine size and class validation in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = typedrow(x)', '  arguments', '    x (1,2) double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('typedrow([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('typedrow([1;2])')).toThrow("arguments block validation failed for 'x': expected size 1x2, got 2x1.");
            expect(() => localInterpreter.Execute('typedrow({1,2})')).toThrow("arguments block validation failed for 'x': expected class double, got cell.");
        });

        it('Should validate colon wildcard dimensions in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = anywidthrow(x)', '  arguments', '    x (1,:) double', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = anyheightcolumn(x)', '  arguments', '    x (:,1) double', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('anywidthrow([1,2,3])'))).toBe('[1,2,3]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('anyheightcolumn([1;2;3])'))).toBe('[1;\n2;\n3]\n');
            expect(() => localInterpreter.Execute('anywidthrow([1;2])')).toThrow("arguments block validation failed for 'x': expected size (1,:), got 2x1.");
            expect(() => localInterpreter.Execute('anyheightcolumn([1,2])')).toThrow("arguments block validation failed for 'x': expected size (:,1), got 1x2.");
        });

        it('Should validate single arguments as numeric arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = singleonly(x)', '  arguments', '    x single', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('singleonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("singleonly('abc')")).toThrow("arguments block validation failed for 'x': expected class single, got char.");
        });

        it('Should validate numeric and text argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = numericonly(x)', '  arguments', '    x {mustBeNumeric}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = textonly(x)', '  arguments', '    x {mustBeText}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericonly([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute("numericonly('abc')")).toThrow("arguments block validation failed for 'x': mustBeNumeric.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("textonly('abc')"))).toBe('abc\n');
            expect(() => localInterpreter.Execute('textonly(3)')).toThrow("arguments block validation failed for 'x': mustBeText.");
        });

        it('Should validate shape argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = scalarvalidated(x)', '  arguments', '    x {mustBeScalar}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = vectorvalidated(x)', '  arguments', '    x {mustBeVector}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = scalarorempty(x)', '  arguments', '    x {mustBeScalarOrEmpty}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonemptyvalidated(x)', '  arguments', '    x {mustBeNonempty}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalarvalidated(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('scalarvalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeScalar.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('vectorvalidated([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('vectorvalidated([1,2;3,4])')).toThrow("arguments block validation failed for 'x': mustBeVector.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('scalarorempty([])'))).toBe('[ ](0x0)\n');
            expect(() => localInterpreter.Execute('nonemptyvalidated([])')).toThrow("arguments block validation failed for 'x': mustBeNonempty.");
        });

        it('Should validate additional MATLAB-like shape and text argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = matrixvalidated(x)', '  arguments', '    x {mustBeMatrix}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = squarevalidated(x)', '  arguments', '    x {mustBeSquare}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = textscalarvalidated(x)', '  arguments', '    x {mustBeTextScalar}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('matrixvalidated([1,2;3,4])'))).toBe('[1,2;\n3,4]\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('matrixvalidated(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('squarevalidated([1,2;3,4])'))).toBe('[1,2;\n3,4]\n');
            expect(() => localInterpreter.Execute('squarevalidated([1,2])')).toThrow("arguments block validation failed for 'x': mustBeSquare.");
            expect(localInterpreter.Unparse(localInterpreter.Execute("textscalarvalidated('abc')"))).toBe('abc\n');
            expect(() => localInterpreter.Execute('textscalarvalidated(3)')).toThrow("arguments block validation failed for 'x': mustBeTextScalar.");
        });

        it('Should validate numeric property argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = positiveinteger(x)', '  arguments', '    x double {mustBePositive, mustBeInteger}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonnegativevalidated(x)', '  arguments', '    x double {mustBeNonnegative}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = finitevalidated(x)', '  arguments', '    x double {mustBeFinite}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = realonly(x)', '  arguments', '    x double {mustBeReal}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = numericorlogicalvalidated(x)', '  arguments', '    x {mustBeNumericOrLogical}', '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = nonzerovalidated(x)', '  arguments', '    x {mustBeNonzero}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('positiveinteger(2)'))).toBe('2\n');
            expect(() => localInterpreter.Execute('positiveinteger(-1)')).toThrow("arguments block validation failed for 'x': mustBePositive.");
            expect(() => localInterpreter.Execute('positiveinteger(2.5)')).toThrow("arguments block validation failed for 'x': mustBeInteger.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('nonnegativevalidated(0)'))).toBe('0\n');
            expect(() => localInterpreter.Execute('nonnegativevalidated(-1)')).toThrow("arguments block validation failed for 'x': mustBeNonnegative.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('finitevalidated(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('finitevalidated(1/0)')).toThrow("arguments block validation failed for 'x': mustBeFinite.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('realonly(3)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('realonly(1+2i)')).toThrow("arguments block validation failed for 'x': mustBeReal.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('numericorlogicalvalidated([0,1])'))).toBe('[0,1]\n');
            expect(() => localInterpreter.Execute("numericorlogicalvalidated('abc')")).toThrow("arguments block validation failed for 'x': mustBeNumericOrLogical.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('nonzerovalidated([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('nonzerovalidated([1,0])')).toThrow("arguments block validation failed for 'x': mustBeNonzero.");
        });

        it('Should validate mustBeOdd argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = oddonly(x)', '  arguments', '    x {mustBeOdd}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('oddonly(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('oddonly([-3,1,5])'))).toBe('[-3,1,5]\n');
            expect(() => localInterpreter.Execute('oddonly(2)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
            expect(() => localInterpreter.Execute('oddonly(2.5)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
            expect(() => localInterpreter.Execute('oddonly(1+2i)')).toThrow("arguments block validation failed for 'x': mustBeOdd.");
        });

        it('Should call custom unary argument validator functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function mustBeAtLeastThree(x)', '  if x < 3', '    customValidatorFailed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['function y = customvalidated(x)', '  arguments', '    x {mustBeAtLeastThree}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('customvalidated(3)'))).toBe('3\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('customvalidated([3,4])'))).toBe('[3,4]\n');
            expect(() => localInterpreter.Execute('customvalidated(2)')).toThrow("'customValidatorFailed' undefined.");
        });

        it('Should call explicit custom argument validator functions with function-scope values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function mustBeAbove(x, limit)', '  if x <= limit', '    customLimitValidatorFailed', '  end', 'end'].join('\n'));
            localInterpreter.Execute(['function y = customparamvalidated(x, limit)', '  arguments', '    x {mustBeAbove(x, limit)}', '    limit', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('customparamvalidated(5, 3)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('customparamvalidated(3, 3)')).toThrow("'customLimitValidatorFailed' undefined.");
        });

        it('Should resolve missing custom argument validators at call time.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = missingcustomvalidator(x)', '  arguments', '    x {mustBeMissingValidator}', '  end', '  y = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('missingcustomvalidator(1)')).toThrow("'mustBeMissingValidator' undefined.");
        });

        it('Should validate parametrized comparison argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = unitinterval(x)', '  arguments', '    x double {mustBeGreaterThanOrEqual(x, 0), mustBeLessThanOrEqual(x, 1)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            localInterpreter.Execute(
                ['function y = strictpositivebelowten(x)', '  arguments', '    x double {mustBeGreaterThan(x, 0), mustBeLessThan(x, 10)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('unitinterval([0,0.5,1])'))).toBe('[0,0.5,1]\n');
            expect(() => localInterpreter.Execute('unitinterval(-0.1)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThanOrEqual.");
            expect(() => localInterpreter.Execute('unitinterval(1.1)')).toThrow("arguments block validation failed for 'x': mustBeLessThanOrEqual.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('strictpositivebelowten(5)'))).toBe('5\n');
            expect(() => localInterpreter.Execute('strictpositivebelowten(0)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
            expect(() => localInterpreter.Execute('strictpositivebelowten(10)')).toThrow("arguments block validation failed for 'x': mustBeLessThan.");
        });

        it('Should evaluate parametrized comparison bounds in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = greaterthanbase(base, x)', '  arguments', '    base double', '    x double {mustBeGreaterThan(x, base)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('greaterthanbase(3, 4)'))).toBe('4\n');
            expect(() => localInterpreter.Execute('greaterthanbase(3, 3)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
        });

        it('Should evaluate parametrized comparison validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reversecomparison(x)', '  arguments', '    x {mustBeGreaterThan(0, x)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reversecomparison(-1)'))).toBe('-1\n');
            expect(() => localInterpreter.Execute('reversecomparison(1)')).toThrow("arguments block validation failed for 'x': mustBeGreaterThan.");
        });

        it('Should validate mustBeInRange argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = ranged(x)', '  arguments', '    x double {mustBeInRange(x, 0, 1)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('ranged([0,0.5,1])'))).toBe('[0,0.5,1]\n');
            expect(() => localInterpreter.Execute('ranged(-0.1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('ranged(1.1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should evaluate mustBeInRange bounds in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = rangedbyparams(lo, hi, x)', '  arguments', '    lo double', '    hi double', '    x double {mustBeInRange(x, lo, hi)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('rangedbyparams(10, 20, [10,15,20])'))).toBe('[10,15,20]\n');
            expect(() => localInterpreter.Execute('rangedbyparams(10, 20, 9)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('rangedbyparams(10, 20, 21)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should evaluate mustBeInRange validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reverserange(x)', '  arguments', '    x {mustBeInRange(0, x, 1)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reverserange(-1)'))).toBe('-1\n');
            expect(() => localInterpreter.Execute('reverserange(0.5)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should validate mustBeInRange boundary options.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = excludeupper(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-upper')}", '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = excludelower(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-lower')}", '  end', '  y = x;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = excludeboth(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'exclude-both')}", '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludeupper(0)'))).toBe('0\n');
            expect(() => localInterpreter.Execute('excludeupper(1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludelower(1)'))).toBe('1\n');
            expect(() => localInterpreter.Execute('excludelower(0)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('excludeboth(0.5)'))).toBe('0.5\n');
            expect(() => localInterpreter.Execute('excludeboth(0)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
            expect(() => localInterpreter.Execute('excludeboth(1)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should reject unknown mustBeInRange options.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = unknownrangeoption(x)', '  arguments', "    x {mustBeInRange(x, 0, 1, 'outside')}", '  end', '  y = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('unknownrangeoption(0.5)')).toThrow("arguments block validation failed for 'x': mustBeInRange.");
        });

        it('Should validate numeric mustBeMember argument functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = choose(x)', '  arguments', '    x double {mustBeMember(x, [1,2,3])}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('choose(2)'))).toBe('2\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('choose([1,3])'))).toBe('[1,3]\n');
            expect(() => localInterpreter.Execute('choose(4)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
            expect(() => localInterpreter.Execute('choose([1,4])')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should evaluate mustBeMember allowed values in function scope.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = choosefrom(allowed, x)', '  arguments', '    allowed double', '    x double {mustBeMember(x, allowed)}', '  end', '  y = x;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('choosefrom([10,20], 20)'))).toBe('20\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('choosefrom([10,20], [10,20])'))).toBe('[10,20]\n');
            expect(() => localInterpreter.Execute('choosefrom([10,20], 30)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should evaluate mustBeMember validators as function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = reversemember(x)', '  arguments', '    x {mustBeMember([1,2], x)}', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('reversemember([1,2])'))).toBe('[1,2]\n');
            expect(() => localInterpreter.Execute('reversemember(1)')).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should reject unsupported text mustBeMember values.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = textmember(x)', '  arguments', "    x char {mustBeMember(x, {'a','b'})}", '  end', '  y = x;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute("textmember('a')")).toThrow("arguments block validation failed for 'x': mustBeMember.");
        });

        it('Should validate output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = checkedout(x)', '  arguments', '    x double', '  end', '  arguments (Output)', '    y (1,1) double {mustBeNonnegative}', '  end', '  y = x + 1;', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('checkedout(2)'))).toBe('3\n');
            expect(() => localInterpreter.Execute('checkedout([1,2])')).toThrow("arguments block validation failed for 'y': expected size 1x1, got 1x2.");
            expect(() => localInterpreter.Execute('checkedout(-2)')).toThrow("arguments block validation failed for 'y': mustBeNonnegative.");
        });

        it('Should validate output argument classes.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = textout(x)', '  arguments (Output)', '    y char', '  end', '  y = x;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute("textout('ok')"))).toBe('ok\n');
            expect(() => localInterpreter.Execute('textout(3)')).toThrow("arguments block validation failed for 'y': expected class char, got double.");
        });

        it('Should preserve undefined output errors with output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = missingout()', '  arguments (Output)', '    y double', '  end', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('missingout()')).toThrow("'y' undefined.");
        });

        it('Should validate multiple named output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function [a, b] = checkedpair(x)', '  arguments (Output)', '    a (1,1) double {mustBePositive}', '    b (1,2) double', '  end', '  a = x;', '  b = [x, 3];', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('[a, b] = checkedpair(2)'))).toBe('a=2\nb=[2,3]\n');
            expect(() => localInterpreter.Execute('checkedpair(-1)')).toThrow("arguments block validation failed for 'a': mustBePositive.");
        });

        it('Should validate only requested named output arguments.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function [a, b] = skippedoutput(x)', '  arguments (Output)', '    a double', '    b double {mustBePositive}', '  end', '  a = x;', '  b = -1;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = skippedoutput(2)'))).toBe('a=2\n');
            expect(() => localInterpreter.Execute('[a, b] = skippedoutput(2)')).toThrow("arguments block validation failed for 'b': mustBePositive.");
        });

        it('Should ignore tilde declarations in output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function [~, b] = checkedignoredoutput(x)', '  arguments (Output)', '    b double {mustBePositive}', '  end', '  b = x;', 'end'].join('\n'));

            expect(localInterpreter.Unparse(localInterpreter.Execute('[~, b] = checkedignoredoutput(2)'))).toBe('b=2\n');
            expect(() => localInterpreter.Execute('[~, b] = checkedignoredoutput(-1)')).toThrow("arguments block validation failed for 'b': mustBePositive.");
        });

        it('Should report unassigned requested named outputs with output arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute('b = 99');
            localInterpreter.Execute(['function [a, b] = missingsecond()', '  arguments (Output)', '    a double', '    b double', '  end', '  a = 1;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('a = missingsecond()'))).toBe('a=1\n');
            expect(() => localInterpreter.Execute('[a, b] = missingsecond()')).toThrow("'b' undefined.");
            expect(localInterpreter.Unparse(localInterpreter.Execute('b'))).toBe('99\n');
        });

        it('Should use default values from arguments blocks for omitted trailing parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = adddefault(x, z)', '  arguments', '    x', '    z = 10', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('adddefault(5)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('adddefault(5, 3)'))).toBe('8\n');
        });

        it('Should evaluate argument defaults in function scope after previous parameters are bound.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = defaultfromprevious(x, z)', '  arguments', '    x', '    z = x + 1', '  end', '  y = z;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultfromprevious(10)'))).toBe('11\n');
        });

        it('Should keep required parameters before defaulted trailing parameters mandatory.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = needsfirst(x, z)', '  arguments', '    x', '    z = 10', '  end', '  y = x + z;', 'end'].join('\n'));
            expect(() => localInterpreter.Execute('needsfirst()')).toThrow('invalid number of arguments in function needsfirst');
        });

        it('Should allow varargin after defaulted fixed parameters.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = defaultwithvarargin(x, z, varargin)', '  arguments', '    x', '    z = 10', '    varargin', '  end', '  y = x + z + nargin;', 'end'].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultwithvarargin(5)'))).toBe('16\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('defaultwithvarargin(5, 3, 9)'))).toBe('11\n');
        });

        it('Should support recursive user-defined function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = recsum(n)', '  if n <= 0', '    y = 0;', '    return', '  end', '  y = n + recsum(n - 1);', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('recsum(5)'))).toBe('15\n');
        });

        it('Should support mutually recursive user-defined function calls.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                [
                    'function y = isevenrec(n)',
                    '  if n == 0',
                    '    y = 1;',
                    '    return',
                    '  end',
                    '  y = isoddrec(n - 1);',
                    'end',
                    '',
                    'function y = isoddrec(n)',
                    '  if n == 0',
                    '    y = 0;',
                    '    return',
                    '  end',
                    '  y = isevenrec(n - 1);',
                    'end',
                ].join('\n'),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('isevenrec(4); isoddrec(5)'))).toBe('1\n1\n');
        });

        it('Should keep variable shadowing of function names local to the function workspace.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = shadowtarget(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = shadowcaller()', '  shadowtarget = 10;', '  y = shadowtarget;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('shadowcaller()'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('shadowtarget(5)'))).toBe('6\n');
        });

        it('Should keep captured named handles bound to the defining function after redefinition.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = handletarget(x)', '  y = x + 1;', 'end'].join('\n'));
            localInterpreter.Execute('h = @handletarget');
            localInterpreter.Execute(['function y = handletarget(x)', '  y = x + 100;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('h(1); handletarget(1)'))).toBe('2\n101\n');
        });

        it('Should validate name-value defaults and explicit values in arguments blocks.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(
                ['function y = scaledwithoption(x, opts)', '  arguments', '    x double', '    opts.Scale (1,1) double {mustBePositive} = 2', '  end', '  y = x * opts.Scale;', 'end'].join(
                    '\n',
                ),
            );
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5)'))).toBe('10\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5, Scale=3)'))).toBe('15\n');
            expect(localInterpreter.Unparse(localInterpreter.Execute('scaledwithoption(5, "sca", 4)'))).toBe('20\n');
            expect(() => localInterpreter.Execute('scaledwithoption(5, Scale=-1)')).toThrow("arguments block validation failed for 'opts.Scale': mustBePositive.");
        });

        it('Should reset persistent state for all user functions after clear functions.', () => {
            const localInterpreter = Interpreter.Create();
            localInterpreter.Execute(['function y = persistenta()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = persistentb()', '  persistent c = 10;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('persistenta(); persistenta(); persistentb()'))).toBe('1\n2\n11\n');
            localInterpreter.Execute('clear functions');
            localInterpreter.Execute(['function y = persistenta()', '  persistent c = 0;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            localInterpreter.Execute(['function y = persistentb()', '  persistent c = 10;', '  c = c + 1;', '  y = c;', 'end'].join('\n'));
            expect(localInterpreter.Unparse(localInterpreter.Execute('persistenta(); persistentb()'))).toBe('1\n11\n');
        });
    });
});
