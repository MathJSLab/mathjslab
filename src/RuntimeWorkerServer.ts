import { createInProcessMathJSLabRuntime } from './InProcessRuntime';
import {
    runtimeProtocolVersion,
    serializeRuntimeError,
    type RuntimeEffectResult,
    type RuntimeInboundMessage,
    type RuntimeOutboundMessage,
    type RuntimeRequest,
    type RuntimeResponseValue,
} from './runtime-protocol';
import type { HostEffectResult, MathJSLabRuntime, RuntimeHost, RuntimeSession } from './runtime-contracts';
import { RuntimeValueCodec } from './RuntimeValueCodec';

export interface RuntimeWorkerServerScope {
    postMessage(message: RuntimeOutboundMessage, transfer?: ArrayBuffer[]): void;
    addEventListener(type: 'message', listener: (event: MessageEvent<RuntimeInboundMessage>) => void): void;
    removeEventListener(type: 'message', listener: (event: MessageEvent<RuntimeInboundMessage>) => void): void;
}

export class RuntimeWorkerServer {
    private readonly runtime: MathJSLabRuntime;
    private readonly sessions = new Map<string, RuntimeSession>();
    private readonly pendingEffects = new Map<string, { resolve(value: HostEffectResult): void; reject(reason: unknown): void }>();
    private nextEffect = 0;

    public constructor(
        private readonly scope: RuntimeWorkerServerScope,
        runtime?: MathJSLabRuntime | ((host: RuntimeHost) => MathJSLabRuntime),
    ) {
        const host: RuntimeHost = {
            request: (effect, context) =>
                new Promise((resolve, reject) => {
                    const effectId = `effect-${++this.nextEffect}`;
                    this.pendingEffects.set(effectId, { resolve, reject });
                    this.scope.postMessage({ protocol: runtimeProtocolVersion, type: 'effect-request', effectId, effect, context });
                }),
        };
        this.runtime = typeof runtime === 'function' ? runtime(host) : (runtime ?? createInProcessMathJSLabRuntime({ host }));
        scope.addEventListener('message', this.receive);
    }

    public async dispose(): Promise<void> {
        this.scope.removeEventListener('message', this.receive);
        await this.runtime.dispose();
        for (const pending of this.pendingEffects.values()) pending.reject(new Error('Runtime Worker server was disposed.'));
        this.pendingEffects.clear();
        this.sessions.clear();
    }

    private readonly receive = (event: MessageEvent<RuntimeInboundMessage>): void => {
        const message = event.data;
        if (!message || message.protocol !== runtimeProtocolVersion) return;
        if ('effectId' in message) {
            this.settleEffect(message);
            return;
        }
        if (typeof message.requestId !== 'string') return;
        void this.handle(message);
    };

    private settleEffect(message: RuntimeEffectResult): void {
        const pending = this.pendingEffects.get(message.effectId);
        if (!pending) return;
        this.pendingEffects.delete(message.effectId);
        if (message.ok) pending.resolve(message.result);
        else pending.reject(Object.assign(new Error(message.error.message), { name: message.error.name, code: message.error.code }));
    }

    private async handle(request: RuntimeRequest): Promise<void> {
        try {
            const result = await this.dispatch(request);
            const transfer = result.type === 'executed' ? result.result.outputs.flatMap((output) => (output.type === 'data' ? RuntimeValueCodec.transferables(output.value) : [])) : [];
            this.scope.postMessage({ protocol: runtimeProtocolVersion, requestId: request.requestId, ok: true, result }, transfer);
        } catch (error) {
            this.scope.postMessage({ protocol: runtimeProtocolVersion, requestId: request.requestId, ok: false, error: serializeRuntimeError(error) });
        }
    }

    private async dispatch(request: RuntimeRequest): Promise<RuntimeResponseValue> {
        const command = request.command;
        if (command.type === 'create') {
            if (this.sessions.has(command.sessionId)) throw new Error(`Runtime session already exists: ${command.sessionId}`);
            this.sessions.set(command.sessionId, await this.runtime.createSession({ id: command.sessionId, ...(command.parfor ? { parfor: command.parfor } : {}) }));
            return { type: 'created' };
        }
        const session = this.sessions.get(command.sessionId);
        if (!session) throw new Error(`Unknown runtime session: ${command.sessionId}`);
        switch (command.type) {
            case 'parse':
                return { type: 'parsed', result: await session.parse(command.source) };
            case 'execute':
                return { type: 'executed', result: await session.execute(command.source) };
            case 'reset':
                await session.reset();
                return { type: 'reset' };
            case 'dispose':
                await session.dispose();
                this.sessions.delete(command.sessionId);
                return { type: 'disposed' };
        }
    }
}
