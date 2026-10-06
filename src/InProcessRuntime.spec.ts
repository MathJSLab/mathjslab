import { createInProcessMathJSLabRuntime } from './InProcessRuntime';

const abortableDelayHost = {
    request: async (_effect: unknown, context: { signal?: AbortSignal }): Promise<{ value?: unknown }> =>
        new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve({}), 100);
            context.signal?.addEventListener(
                'abort',
                () => {
                    clearTimeout(timeout);
                    reject(context.signal?.reason);
                },
                { once: true },
            );
        }),
};

describe('InProcessMathJSLabRuntime', () => {
    test('keeps workspaces independent and exposes structured output', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const first = await runtime.createSession();
        const second = await runtime.createSession();

        await expect(first.execute('x = 41;')).resolves.toMatchObject({ status: 'success' });
        const result = await first.execute('x + 1');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '42\n' });
        await expect(second.execute('x')).resolves.toMatchObject({ status: 'error' });

        await runtime.dispose();
    });

    test('isolates numeric configuration between sessions', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const first = await runtime.createSession();
        const second = await runtime.createSession();

        await first.execute("configure('precision', 20)");
        await second.execute("configure('precision', 40)");
        const firstResult = await first.execute("getconfig('precision')");
        const secondResult = await second.execute("getconfig('precision')");

        expect(firstResult.outputs[0]).toMatchObject({ type: 'text', text: '{precision,20}\n' });
        expect(secondResult.outputs[0]).toMatchObject({ type: 'text', text: '{precision,40}\n' });
        await runtime.dispose();
    });

    test('reports pre-aborted executions without evaluating source', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const session = await runtime.createSession();
        const controller = new AbortController();
        controller.abort('replaced');
        await expect(session.execute('x = 1', { signal: controller.signal })).resolves.toMatchObject({ status: 'cancelled' });
        await runtime.dispose();
    });

    test('interrupts an active host effect and keeps the session reusable', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        const execution = session.execute('pause(1)');
        await new Promise((resolve) => setTimeout(resolve, 5));
        await session.interrupt('stop active effect');
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_ABORTED', message: 'stop active effect' }] });
        await expect(session.execute('1+1')).resolves.toMatchObject({
            status: 'success',
            outputs: expect.arrayContaining([expect.objectContaining({ type: 'text', text: '2\n' })]),
        });
        await runtime.dispose();
    });

    test('times out an active host effect and permits a retry', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        await expect(session.execute('pause(1)', { timeoutMs: 5 })).resolves.toMatchObject({ status: 'timeout', diagnostics: [{ code: 'MATHJSLAB_TIMEOUT' }] });
        await expect(session.execute('1+1')).resolves.toMatchObject({ status: 'success' });
        await runtime.dispose();
    });

    test('cancels active host effects when the session is disposed', async () => {
        const runtime = createInProcessMathJSLabRuntime({ host: abortableDelayHost });
        const session = await runtime.createSession();
        const execution = session.execute('pause(1)');
        await new Promise((resolve) => setTimeout(resolve, 5));
        await session.dispose();
        await expect(execution).resolves.toMatchObject({ status: 'cancelled', diagnostics: [{ code: 'MATHJSLAB_DISPOSED' }] });
        await expect(session.execute('1')).rejects.toThrow('MathJSLab runtime session is disposed.');
        await runtime.dispose();
    });

    test('suspends at a resource capability and resumes the same workspace', async () => {
        const effects: string[] = [];
        const runtime = createInProcessMathJSLabRuntime({
            host: {
                request: async (effect) => {
                    effects.push(effect.type);
                    return { value: 'loaded = base + 2;' };
                },
            },
        });
        const session = await runtime.createSession({ id: 'effects' });
        const result = await session.execute('base = 40; load("memory:test.m"); loaded');
        expect(result.status).toBe('success');
        expect(result.outputs[0]).toMatchObject({ type: 'text', text: '42\n' });
        expect(effects).toEqual(['read-text']);
        await runtime.dispose();
    });

    test('lets a host adapter publish serializable visualization descriptors', async () => {
        const runtime = createInProcessMathJSLabRuntime({
            evaluate: (_interpreter, operation) => ({ value: operation(), outputs: [{ type: 'visualization', renderer: 'test', request: { series: [1, 2] } }] }),
        });
        const session = await runtime.createSession();
        const result = await session.execute('1+1');
        expect(result.outputs).toContainEqual({ type: 'visualization', renderer: 'test', request: { series: [1, 2] } });
        await runtime.dispose();
    });

    test('never parallelizes parfor silently', async () => {
        const runtime = createInProcessMathJSLabRuntime();
        const fallback = await runtime.createSession({ parfor: 'fallback' });
        const strict = await runtime.createSession({ parfor: 'strict' });
        const source = 's=0; parfor i=1:3, s+=i; end; s';
        await expect(fallback.execute(source)).resolves.toMatchObject({ status: 'success', diagnostics: [{ code: 'MATHJSLAB_PARFOR_SEQUENTIAL_FALLBACK' }] });
        await expect(strict.execute(source)).resolves.toMatchObject({ status: 'error', diagnostics: [{ code: 'MATHJSLAB_PARFOR_NOT_ELIGIBLE' }] });
        await runtime.dispose();
    });
});
