/// <reference types="jest" />
import type { NodeBuiltInFunction } from './AST';
import { AST } from './AST';
import { Callables } from './Callable';
import { CallFrame } from './CallFrame';
import { EvalError, InterpreterError, ReferenceError, UndefinedReferenceError, CircularReferenceError, SyntaxError } from './InterpreterError';
import { Scope } from './Scope';

describe('InterpreterError', () => {
    describe('Behavior', () => {
        it('Should initialize the base error with a message and optional stack frames.', () => {
            const frame = new CallFrame(Scope.create(), undefined, undefined, 'f');
            const error = new InterpreterError('failure', [frame]);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('InterpreterError');
            expect(error.message).toBe('failure');
            expect(error.stackFrames).toEqual([frame]);
        });

        it('Should classify interpreter error subclasses.', () => {
            expect(new EvalError('eval')).toBeInstanceOf(InterpreterError);
            expect(new ReferenceError('reference')).toBeInstanceOf(InterpreterError);
            expect(new UndefinedReferenceError('x')).toBeInstanceOf(ReferenceError);
            expect(new CircularReferenceError(['A', 'B', 'A'])).toBeInstanceOf(InterpreterError);
            expect(new SyntaxError('syntax')).toBeInstanceOf(InterpreterError);
        });

        it('Should format stack frames with call-site line and column.', () => {
            const callSite = AST.nodeIdentifier('sin');
            callSite.start = { line: 7, column: 3 } as typeof callSite.start;
            const builtin = { type: 'BUILTIN', id: 'sin', mapper: false, ev: [], func: () => undefined } as NodeBuiltInFunction;
            const frame = new CallFrame(Scope.create(), Callables.builtin(builtin), callSite);
            const error = new EvalError('invalid call', [frame]);

            expect(error.format()).toBe('Error: invalid call\nError in sin (line 7, column 3)');
            expect(error.toString()).toBe(error.format());
        });

        it('Should omit anonymous and global frames from formatted output.', () => {
            const anonymous = new CallFrame(Scope.create(), undefined, undefined, '<anonymous>');
            const global = new CallFrame(Scope.create());
            const error = new SyntaxError('bad syntax', [anonymous, global]);

            expect(error.format()).toBe('Error: bad syntax');
        });
    });
});
