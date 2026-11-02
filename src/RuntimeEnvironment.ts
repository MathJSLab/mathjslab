import { BLAS, type BLASConfig } from './BLAS';
import { Complex, type RealTypeDescriptor } from './Complex';
import type { ComplexConfig, Modulo, Rounding } from './ComplexInterface';
import { ComplexConfigKeyTable } from './ComplexConfigKeyTable';
import { Decimal } from './ComplexDecimal';

/** Owned numeric and BLAS settings restored around each synchronous interpreter turn. */
export type RuntimeEnvironmentSnapshot = {
    engine: RealTypeDescriptor;
    complex: ComplexConfig<Rounding, Modulo>;
    blas: BLASConfig;
};

/** Serializable creation settings, applied before native constants and ASTs exist. */
export type NumericEnvironmentOptions = {
    readonly engine?: RealTypeDescriptor;
    readonly complex?: Partial<ComplexConfig<Rounding, Modulo>>;
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

    public constructor(snapshot: RuntimeEnvironmentSnapshot = cloneSnapshot(), options?: NumericEnvironmentOptions) {
        this.snapshot = {
            engine: snapshot.engine,
            complex: { ...snapshot.complex },
            blas: { ...snapshot.blas },
        };
        if (options !== undefined) {
            if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('numeric session options must be an object.');
            this.run(() => {
                if (options.engine !== undefined) {
                    Complex.engine = options.engine;
                    Complex.set(Complex.defaultSettings);
                }
                if (options.complex !== undefined) {
                    if (!options.complex || typeof options.complex !== 'object' || Array.isArray(options.complex)) throw new TypeError('numeric.complex must be a configuration object.');
                    for (const key of Object.keys(options.complex))
                        if (!(ComplexConfigKeyTable as readonly string[]).includes(key)) throw new TypeError(`Unknown numeric configuration '${key}'.`);
                    const { precisionCompare, ...decimal } = options.complex;
                    if (precisionCompare !== undefined && (!Number.isSafeInteger(precisionCompare) || precisionCompare < 0))
                        throw new RangeError('precisionCompare must be a nonnegative integer.');
                    Decimal.clone(decimal); // Validate even the settings ignored by the fixed number backend.
                    Complex.set(options.complex);
                }
            });
        }
    }

    public get settings(): RuntimeEnvironmentSnapshot {
        return {
            engine: this.snapshot.engine,
            complex: { ...this.snapshot.complex },
            blas: { ...this.snapshot.blas },
        };
    }

    /** Applies session settings for a synchronous turn, captures changes and restores host settings even on failure. */
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

    /** Restores backend selection before applying its arithmetic and BLAS configuration. */
    private apply(snapshot: RuntimeEnvironmentSnapshot): void {
        Complex.engine = snapshot.engine;
        Complex.set(snapshot.complex);
        BLAS.set(snapshot.blas);
    }
}
