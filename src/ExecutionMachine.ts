import type { HostEffect, HostEffectResult, RuntimeDiagnostic, RuntimeOutput } from './execution-contracts';

export type ExecutionMachineStep<T = unknown> =
    | { readonly state: 'completed'; readonly value: T; readonly outputs: readonly RuntimeOutput[] }
    | {
          readonly state: 'effect';
          readonly effect: HostEffect;
          readonly frame?: ExecutionSequenceFrame;
          readonly frames?: readonly ExecutionFrame[];
          resume(result: HostEffectResult): ExecutionMachineStep<T>;
          fail(error: unknown): ExecutionMachineStep<T>;
          cancel(reason?: unknown): ExecutionMachineStep<T>;
      }
    | {
          readonly state: 'progress';
          readonly completed: number;
          readonly total?: number;
          readonly frames?: readonly ExecutionFrame[];
          continue(): ExecutionMachineStep<T>;
          cancel(reason?: unknown): ExecutionMachineStep<T>;
      }
    | { readonly state: 'cancelled'; readonly reason?: unknown }
    | { readonly state: 'control'; readonly transfer: ExecutionControlTransfer }
    | { readonly state: 'error'; readonly diagnostics: readonly RuntimeDiagnostic[] };

export interface ExecutionControlTransfer {
    readonly kind: 'return' | 'break' | 'continue';
    readonly signal: unknown;
}

/** Values are opaque to the driver. The cursor points at the next instruction. */
export interface ExecutionSequenceFrame {
    readonly kind: 'sequence';
    readonly nextInstruction: number;
    readonly previousValue: unknown;
}

/** The machine keeps scope and values opaque; evaluator-owned frames expose progress. */
export interface ExecutionFrame {
    readonly kind: 'sequence' | 'block' | 'loop' | 'call' | 'expression';
    readonly nodeType: string;
    readonly scope: unknown;
    readonly cursor: number;
    readonly phase: string;
}

/** Cancellation is a driver transfer, not a catchable language exception. */
export class ExecutionCancellation extends Error {
    public constructor(public readonly reason: unknown) {
        super('Execution cancelled');
    }
}

export type ExecutionYieldRequest = ExecutionEffectRequest | { readonly checkpoint: true; readonly completed: number; readonly frames: readonly ExecutionFrame[] };

export interface ExecutionEffectRequest {
    readonly effect: HostEffect;
    readonly frame: ExecutionSequenceFrame;
    readonly frames?: readonly ExecutionFrame[];
}

/**
 * Host-independent execution boundary. The initial implementation adapts a
 * synchronous operation; evaluator subsystems can replace individual frames
 * with effect/progress steps without changing RuntimeSession.
 */
export class ExecutionMachine<T> {
    private finished = false;
    private readonly initialStep?: () => ExecutionMachineStep<T>;

    public constructor(
        private readonly operation: () => T,
        private readonly outputs: (value: T) => readonly RuntimeOutput[] = () => [],
        initialStep?: () => ExecutionMachineStep<T>,
    ) {
        this.initialStep = initialStep;
    }

    public static sequence<T>(
        execution: Generator<ExecutionYieldRequest, T, HostEffectResult>,
        outputs: (value: T) => readonly RuntimeOutput[] = () => [],
        control: (error: unknown) => ExecutionControlTransfer | undefined = () => undefined,
    ): ExecutionMachine<T> {
        const advance = (result?: HostEffectResult, failure?: { error: unknown }): ExecutionMachineStep<T> => {
            try {
                const next = failure ? execution.throw(failure.error) : result === undefined ? execution.next() : execution.next(result);
                if (next.done) return { state: 'completed', value: next.value, outputs: outputs(next.value) };
                let consumed = false;
                const consume = (operation: () => ExecutionMachineStep<T>): ExecutionMachineStep<T> => {
                    if (consumed) return { state: 'error', diagnostics: [{ code: 'MATHJSLAB_CONTINUATION_CONSUMED', severity: 'error', message: 'Continuation already consumed.' }] };
                    consumed = true;
                    return operation();
                };
                const cancel = (reason?: unknown): ExecutionMachineStep<T> =>
                    consume(() => {
                        const cancelled = new ExecutionCancellation(reason);
                        try {
                            let closing = execution.throw(cancelled);
                            let cleanupCheckpoints = 0;
                            // Bound cancellation unwind work; a cleanup cannot wait or loop forever.
                            while (!closing.done) {
                                closing = 'checkpoint' in closing.value && ++cleanupCheckpoints <= 64 ? execution.next() : execution.throw(cancelled);
                            }
                            return { state: 'cancelled', reason };
                        } catch (error) {
                            if (error instanceof ExecutionCancellation) return { state: 'cancelled', reason };
                            return {
                                state: 'error',
                                diagnostics: [{ code: 'MATHJSLAB_EXECUTION_ERROR', severity: 'error', message: error instanceof Error ? error.message : String(error), cause: error }],
                            };
                        }
                    });
                if ('checkpoint' in next.value)
                    return {
                        state: 'progress',
                        completed: next.value.completed,
                        frames: next.value.frames,
                        continue: () => consume(() => advance()),
                        cancel,
                    };
                return {
                    state: 'effect',
                    ...next.value,
                    resume: (value) => consume(() => advance(value)),
                    fail: (error) => consume(() => advance(undefined, { error })),
                    cancel,
                };
            } catch (error) {
                if (error instanceof ExecutionCancellation) return { state: 'cancelled', reason: error.reason };
                const transfer = control(error);
                if (transfer) return { state: 'control', transfer };
                return {
                    state: 'error',
                    diagnostics: [{ code: 'MATHJSLAB_EXECUTION_ERROR', severity: 'error', message: error instanceof Error ? error.message : String(error), cause: error }],
                };
            }
        };
        return new ExecutionMachine<T>(
            () => {
                throw new Error('Sequence requires a driver.');
            },
            () => [],
            () => advance(),
        );
    }

    public static effect<T>(effect: HostEffect, resume: (result: HostEffectResult) => T, outputs: (value: T) => readonly RuntimeOutput[] = () => []): ExecutionMachine<T> {
        return ExecutionMachine.sequence(
            (function* () {
                const result = yield { effect, frame: { kind: 'sequence' as const, nextInstruction: 0, previousValue: undefined } };
                return resume(result);
            })(),
            outputs,
        );
    }

    /** Preserve the synchronous API; waiting is never silently skipped. */
    public runSynchronously(): T {
        let step = this.runUntilYield();
        while (step.state === 'progress') step = step.continue();
        if (step.state === 'completed') return step.value;
        if (step.state === 'error') throw step.diagnostics[0]?.cause ?? new Error(step.diagnostics[0]?.message);
        if (step.state === 'control') throw step.transfer.signal;
        if (step.state === 'effect') {
            step.cancel('Synchronous driver cannot wait.');
            throw Object.assign(new Error('Host effect requires an asynchronous driver.'), { code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' });
        }
        throw new Error(`Synchronous driver cannot handle ${step.state}.`);
    }

    public runUntilYield(): ExecutionMachineStep<T> {
        if (this.finished) return { state: 'error', diagnostics: [{ code: 'MATHJSLAB_MACHINE_COMPLETED', severity: 'error', message: 'Execution machine already completed.' }] };
        this.finished = true;
        if (this.initialStep) return this.initialStep();
        try {
            const value = this.operation();
            return { state: 'completed', value, outputs: this.outputs(value) };
        } catch (error) {
            return {
                state: 'error',
                diagnostics: [{ code: 'MATHJSLAB_EXECUTION_ERROR', severity: 'error', message: error instanceof Error ? error.message : String(error), cause: error }],
            };
        }
    }
}
