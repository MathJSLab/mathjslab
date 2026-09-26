import type { HostEffect, HostEffectResult, RuntimeDiagnostic, RuntimeOutput } from './runtime-contracts';

export type ExecutionMachineStep<T = unknown> =
    | { readonly state: 'completed'; readonly value: T; readonly outputs: readonly RuntimeOutput[] }
    | { readonly state: 'effect'; readonly effect: HostEffect; resume(result: HostEffectResult): ExecutionMachineStep<T> }
    | { readonly state: 'progress'; readonly completed: number; readonly total?: number; continue(): ExecutionMachineStep<T> }
    | { readonly state: 'cancelled'; readonly reason?: unknown }
    | { readonly state: 'error'; readonly diagnostics: readonly RuntimeDiagnostic[] };

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

    public static effect<T>(effect: HostEffect, resume: (result: HostEffectResult) => T, outputs: (value: T) => readonly RuntimeOutput[] = () => []): ExecutionMachine<T> {
        return new ExecutionMachine<T>(
            () => {
                throw new Error('Effect execution must be resumed by a runtime driver.');
            },
            outputs,
            () => ({
                state: 'effect',
                effect,
                resume: (result) => {
                    try {
                        const value = resume(result);
                        return { state: 'completed', value, outputs: outputs(value) };
                    } catch (error) {
                        return {
                            state: 'error',
                            diagnostics: [{ code: 'MATHJSLAB_EFFECT_RESUME_ERROR', severity: 'error', message: error instanceof Error ? error.message : String(error), cause: error }],
                        };
                    }
                },
            }),
        );
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
