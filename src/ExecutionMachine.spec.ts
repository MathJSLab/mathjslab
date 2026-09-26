import { ExecutionMachine } from './ExecutionMachine';

describe('ExecutionMachine', () => {
    test('yields a host effect and resumes with its result', () => {
        const machine = ExecutionMachine.effect({ type: 'read-text', reference: 'value.m' }, (result) => String(result.value));
        const yielded = machine.runUntilYield();
        expect(yielded.state).toBe('effect');
        if (yielded.state !== 'effect') return;
        expect(yielded.effect).toEqual({ type: 'read-text', reference: 'value.m' });
        expect(yielded.resume({ value: '42' })).toMatchObject({ state: 'completed', value: '42' });
    });
});
