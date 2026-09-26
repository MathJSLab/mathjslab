import { BLAS, type BLASConfig } from './BLAS';
import { Complex, type RealTypeDescriptor } from './Complex';
import type { ComplexConfig, Modulo, Rounding } from './ComplexInterface';

export type RuntimeEnvironmentSnapshot = {
    engine: RealTypeDescriptor;
    complex: ComplexConfig<Rounding, Modulo>;
    blas: BLASConfig;
};

const cloneSnapshot = (): RuntimeEnvironmentSnapshot => ({
    engine: Complex.engine,
    complex: { ...Complex.settings },
    blas: { ...BLAS.settings },
});

/**
 * Interpreter-owned numeric configuration.
 *
 * The numeric implementation still exposes static facades for backward
 * compatibility. RuntimeEnvironment scopes those facades to one synchronous
 * interpreter operation and restores the previous host state afterwards.
 */
export class RuntimeEnvironment {
    private snapshot: RuntimeEnvironmentSnapshot;

    public constructor(snapshot: RuntimeEnvironmentSnapshot = cloneSnapshot()) {
        this.snapshot = {
            engine: snapshot.engine,
            complex: { ...snapshot.complex },
            blas: { ...snapshot.blas },
        };
    }

    public get settings(): RuntimeEnvironmentSnapshot {
        return {
            engine: this.snapshot.engine,
            complex: { ...this.snapshot.complex },
            blas: { ...this.snapshot.blas },
        };
    }

    public run<T>(operation: () => T): T {
        const previous = cloneSnapshot();
        try {
            this.apply(this.snapshot);
            return operation();
        } finally {
            this.snapshot = cloneSnapshot();
            this.apply(previous);
        }
    }

    private apply(snapshot: RuntimeEnvironmentSnapshot): void {
        Complex.engine = snapshot.engine;
        Complex.set(snapshot.complex);
        BLAS.set(snapshot.blas);
    }
}
