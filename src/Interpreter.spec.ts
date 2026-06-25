import path from 'node:path';
import { CircularReferenceError, EvalError, Interpreter, InterpreterError, ReferenceError, SyntaxError, UndefinedReferenceError } from './Interpreter';

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
        const input = ['function y = f(x)', '  y = g(x);', 'end', '', 'function z = g(x)', '  z = h(x);', 'end', '', 'function w = h(x)', '  w = x + unknownVar;', 'end', '', 'f(2)'].join(
            '\n',
        );

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
});
