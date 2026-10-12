import { requestHostEffect } from './RuntimeHostEffect';

describe('requestHostEffect', () => {
    test('cancels without host cooperation and detaches the abort listener', async () => {
        const controller = new AbortController();
        const remove = jest.spyOn(controller.signal, 'removeEventListener');
        let finish!: (_value: import('./execution-contracts').HostEffectResult) => void;
        const request = jest.fn(() => new Promise<import('./execution-contracts').HostEffectResult>((resolve) => (finish = resolve)));
        const pending = requestHostEffect({ request }, { type: 'delay', milliseconds: 1 }, { sessionId: 'test', signal: controller.signal });
        controller.abort('stop');
        await expect(pending).rejects.toBe('stop');
        expect(request).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
        finish({});
    });

    test('never starts host work for an already aborted execution', async () => {
        const controller = new AbortController();
        controller.abort('stop');
        const request = jest.fn(async () => ({}));
        await expect(requestHostEffect({ request }, { type: 'clock-now' }, { sessionId: 'test', signal: controller.signal })).rejects.toBe('stop');
        expect(request).not.toHaveBeenCalled();
    });

    test.each(['success', 'reject', 'throw'] as const)('detaches its listener after host %s', async (mode) => {
        const controller = new AbortController();
        const remove = jest.spyOn(controller.signal, 'removeEventListener');
        const request = () => {
            if (mode === 'throw') throw new Error('host failed');
            return mode === 'reject' ? Promise.reject(new Error('host failed')) : Promise.resolve({ value: 3 });
        };
        const pending = requestHostEffect({ request }, { type: 'clock-now' }, { sessionId: 'test', signal: controller.signal });
        const result = await pending.catch((error: Error) => error.message);
        expect(result).toEqual(mode === 'success' ? { value: 3 } : 'host failed');
        expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    });
});
