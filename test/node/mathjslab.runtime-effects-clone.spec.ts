/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test('distributed Worker server omits realm-owned signals from effect messages', () => {
    const script = String.raw`
        import assert from 'node:assert/strict';
        const { RuntimeWorkerServer } = await import('mathjslab/runtime');
        let request, receive, message;
        const server = new RuntimeWorkerServer({
            addEventListener: (_type, listener) => { receive=listener; },
            removeEventListener: () => {},
            postMessage: value => { message=structuredClone(value); },
        }, host => {
            request=host.request;
            return { createSession: async () => { throw new Error('unused'); }, dispose: async () => {} };
        });
        const pending=request({type:'delay', milliseconds:0}, {sessionId:'clone', signal:new AbortController().signal, deadline:123});
        assert.ok(!('signal' in message.context), 'AbortSignal must never enter a Worker message');
        assert.deepEqual(message.context, {sessionId:'clone', deadline:123});
        receive({data:{protocol:2,type:'effect-result',effectId:message.effectId,ok:true,result:{}}});
        await pending;
        await server.dispose();
    `;
    expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
});
