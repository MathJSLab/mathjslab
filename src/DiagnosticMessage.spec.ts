/// <reference types="jest" />
import type { ExpressionBoundaryValue, NodeInput } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { DiagnosticMessage } from './DiagnosticMessage';

const callbacks = {
    expressionValue(value: unknown, name: string): ExpressionBoundaryValue {
        if (typeof value === 'undefined') {
            throw new EvalError(`${name} missing.`);
        }
        return value as ExpressionBoundaryValue;
    },
    unparse(value: NodeInput): string {
        return CharString.isInstanceOf(value) ? value.str : String(value);
    },
    throwEvalError(message: string): never {
        throw new EvalError(message);
    },
};

describe('DiagnosticMessage', () => {
    describe('Behavior', () => {
        it('Should format common diagnostic conversions.', () => {
            expect(
                DiagnosticMessage.format(
                    'value %d %i %.2f %g %s %%',
                    [Complex.create(12.8), Complex.create(-2.2), Complex.create(3.14159), Complex.create(5), new CharString('ok')],
                    callbacks,
                ),
            ).toBe('value 12 -2 3.14 5 ok %');
        });

        it('Should split identifier and message forms.', () => {
            const identified = DiagnosticMessage.parts(
                [new CharString('mathjslab:test'), new CharString('bad %s'), new CharString('input')],
                'error',
                (value) => value as CharString,
                callbacks,
            );
            const messageOnly = DiagnosticMessage.parts([new CharString('bad %s'), new CharString('input')], 'warning', (value) => value as CharString, callbacks);

            expect(identified).toEqual({ identifier: 'mathjslab:test', message: 'bad input' });
            expect(messageOnly).toEqual({ identifier: '', message: 'bad input' });
        });

        it('Should reject missing and invalid numeric formatting values.', () => {
            expect(() => DiagnosticMessage.format('value %d %s', [Complex.create(1)], callbacks)).toThrow('not enough arguments for diagnostic format string.');
            expect(() => DiagnosticMessage.format('value %d', [new CharString('x')], callbacks)).toThrow('diagnostic format argument must be a real numeric scalar.');
        });
    });
});
