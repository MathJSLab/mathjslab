/// <reference types="jest" />
import { Interpreter } from '../../src/Interpreter';

describe('MATLAB/Octave dispatch compatibility fixtures.', () => {
    const dispatchPointClass = [
        'classdef DispatchPoint',
        '  properties',
        '    x = 0;',
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
    ].join('\n');

    const pointArraySetup = ['a = DispatchPoint();', 'b = DispatchPoint();', 'a.x = 2;', 'b.x = 5;', 'pts = [a, b];'].join('\n');

    it('Should dispatch functional class methods over object arrays.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(dispatchPointClass);
        interpreter.Execute(pointArraySetup);

        expect(interpreter.Unparse(interpreter.Execute('read(pts)'))).toBe('[2,5]\n');
        expect(interpreter.Unparse(interpreter.Execute('plusx(pts, 10)'))).toBe('[12,15]\n');
        expect(interpreter.Unparse(interpreter.Execute('pts.read()'))).toBe('[2,5]\n');
    });

    it('Should keep resolved functions ahead of functional class method dispatch.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(dispatchPointClass);
        interpreter.Execute(['function y = read(obj)', '  y = 100 + numel(obj);', 'end'].join('\n'));
        interpreter.Execute(pointArraySetup);

        expect(interpreter.Unparse(interpreter.Execute('read(pts)'))).toBe('102\n');
        expect(interpreter.Unparse(interpreter.Execute('pts.read()'))).toBe('[2,5]\n');
    });

    it('Should report missing functional methods for object arrays.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(dispatchPointClass);
        interpreter.Execute(pointArraySetup);

        expect(() => interpreter.Execute('missingmethod(pts)')).toThrow("unknown method 'missingmethod' for class DispatchPoint.");
    });

    it('Should report unresolved calls instead of functional dispatch for non-object receivers.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('missingmethod(1)')).toThrow("'missingmethod' undefined.");
        expect(() => interpreter.Execute('missingmethod()')).toThrow("'missingmethod' undefined.");
    });
});
