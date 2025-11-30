import { CharString } from './CharString';
import { type Rounding, type Modulo, type RoundingName, type ModuloName, roundingName, moduloName } from './ComplexInterface';
import { RealTypeDescriptor, Complex, ComplexType } from './Complex';
import { ElementType, MultiArray } from './MultiArray';
import { AST } from './AST';
import { BLAS } from './BLAS';
import { LinearAlgebra } from './LinearAlgebra';

/**
 * MathJSLab configuration.
 */
abstract class Configuration {
    /**
     * Table of rounding names.
     */
    private static readonly roundingName = roundingName;

    /**
     * Table of modulo names.
     */
    private static readonly moduloName = moduloName;

    /**
     * Configuration parameters table.
     */
    private static readonly configuration: Record<
        string,
        {
            set: (config: any) => void;
            setDefault: () => void;
            get: () => any;
        }
    > = {
        blockThreshold: {
            set: (threshold: ComplexType) => BLAS.set({ blockThreshold: MultiArray.testInteger(threshold, 'configure', 'blockThreshold configuration parameter') }),
            setDefault: () => BLAS.set({ blockThreshold: BLAS.defaultSettings.blockThreshold }),
            get: () => Complex.create(BLAS.settings.blockThreshold),
        },
        blockSize: {
            set: (size: ComplexType) => BLAS.set({ blockSize: MultiArray.testInteger(size, 'configure', 'blockSize configuration parameter') }),
            setDefault: () => BLAS.set({ blockSize: BLAS.defaultSettings.blockSize }),
            get: () => Complex.create(BLAS.settings.blockSize),
        },
        real: {
            set: (engine: CharString) => (Complex.engine = engine.str as RealTypeDescriptor),
            setDefault: () => (Complex.engine = 'decimal'),
            get: () => new CharString(Complex.engine),
        },
        precision: {
            set: (precision: ComplexType) => Complex.set({ precision: Complex.realToNumber(precision) }),
            setDefault: () => Complex.set({ precision: Complex.defaultSettings.precision }),
            get: () => Complex.create(Complex.settings.precision),
        },
        precisionCompare: {
            set: (precisionCompare: ComplexType) => Complex.set({ precisionCompare: Complex.realToNumber(precisionCompare) }),
            setDefault: () => Complex.set({ precisionCompare: Complex.defaultSettings.precisionCompare }),
            get: () => Complex.create(Complex.settings.precisionCompare),
        },
        rounding: {
            set: (rounding: CharString) => {
                const roundingMode = Configuration.roundingName.indexOf(rounding.str as RoundingName);
                if (roundingMode > 0) {
                    Complex.set({ rounding: roundingMode as Rounding });
                } else {
                    throw new Error(`configure: invalid rounding mode: ${rounding.str}`);
                }
            },
            setDefault: () => Complex.set({ rounding: Complex.defaultSettings.rounding }),
            get: () => new CharString(Configuration.roundingName[Complex.settings.rounding as number]),
        },
        toExpPos: {
            set: (toExpPos: ComplexType) => Complex.set({ toExpPos: Complex.realToNumber(toExpPos) }),
            setDefault: () => Complex.set({ toExpPos: Complex.defaultSettings.toExpPos }),
            get: () => Complex.create(Complex.settings.toExpPos),
        },
        toExpNeg: {
            set: (toExpNeg: ComplexType) => Complex.set({ toExpNeg: Complex.realToNumber(toExpNeg) }),
            setDefault: () => Complex.set({ toExpNeg: Complex.defaultSettings.toExpNeg }),
            get: () => Complex.create(Complex.settings.toExpNeg),
        },
        minE: {
            set: (minE: ComplexType) => Complex.set({ minE: Complex.realToNumber(minE) }),
            setDefault: () => Complex.set({ minE: Complex.defaultSettings.minE }),
            get: () => Complex.create(Complex.settings.minE),
        },
        maxE: {
            set: (maxE: ComplexType) => Complex.set({ maxE: Complex.realToNumber(maxE) }),
            setDefault: () => Complex.set({ maxE: Complex.defaultSettings.maxE }),
            get: () => Complex.create(Complex.settings.maxE),
        },
        modulo: {
            set: (modulo: CharString) => {
                const moduloMode = Configuration.moduloName.indexOf(modulo.str as ModuloName);
                if (moduloMode > 0) {
                    Complex.set({ modulo: moduloMode as Modulo });
                } else {
                    throw new Error(`configure: invalid modulo mode: ${modulo.str}`);
                }
            },
            setDefault: () => Complex.set({ modulo: Complex.defaultSettings.modulo }),
            get: () => new CharString(Configuration.moduloName[Complex.settings.modulo as number] as string),
        },
        crypto: {
            set: (crypto: ComplexType) => Complex.set({ crypto: Boolean(Complex.realToNumber(crypto)) }),
            setDefault: () => Complex.set({ crypto: Complex.defaultSettings.crypto }),
            get: () => Complex.create(Number(Complex.settings.crypto), 0, Complex.LOGICAL),
        },
    };

    /**
     * `configure`
     */
    public static configure(): CharString;
    public static configure(config: CharString, value: ElementType): CharString;
    public static configure(CONFIG: MultiArray): CharString;
    public static configure(...args: any[]): CharString | undefined {
        const setConfig = (config: [CharString, any]): void => {
            if (CharString.isInstanceOf(config[0])) {
                if (config[0].str in Configuration.configuration) {
                    Configuration.configuration[config[0].str].set(config[1]);
                } else {
                    throw new ReferenceError(`configure: invalid configuration: '${config[0].str}'.`);
                }
            } else {
                AST.throwInvalidCallError('configure');
            }
        };
        if (args.length === 0) {
            /* Set default configuration. */
            for (const config in Configuration.configuration) {
                Configuration.configuration[config].setDefault();
            }
            return new CharString('All configuration set to default values.');
        } else if (args.length === 1 && MultiArray.isInstanceOf(args[0])) {
            /* Array of configuration key and value. */
            if (args[0].dimension[1] === 2) {
                (args[0].array as [CharString, any][]).forEach((config: [CharString, any]) => {
                    setConfig(config);
                });
                return new CharString(`${args[0].array.length} configuration values set.`);
            } else {
                AST.throwInvalidCallError('configure');
            }
        } else if (args.length === 2 && CharString.isInstanceOf(args[0])) {
            /* Configuration key and value. */
            setConfig(args as [CharString, any]);
            return new CharString(`Configuration parameter '${args[0].str}' set to '${Configuration.configuration[args[0].str].get().unparse()}'`);
        } else {
            AST.throwInvalidCallError('configure');
        }
    }

    /**
     * `getconfig`
     */
    public static getconfig(): MultiArray;
    public static getconfig(config: CharString): MultiArray;
    public static getconfig(CONFIG: MultiArray): MultiArray;
    public static getconfig(...args: ElementType[]): MultiArray | undefined {
        let result: MultiArray;
        const keys = Object.keys(Configuration.configuration);
        const loadResult = (list: string[]): void => {
            list.forEach((config, i) => {
                const conf = Configuration.configuration[config].get();
                result.array[i] = [new CharString(config), conf];
            });
        };
        if (args.length === 0) {
            /* Get all configurations. */
            result = new MultiArray([keys.length, 2], null, true);
            loadResult(keys);
            return result;
        } else if (args.length === 1) {
            /* Get selected configurations. */
            const C = MultiArray.linearize(MultiArray.scalarToMultiArray(args[0])).map((c) => {
                if (CharString.isInstanceOf(c) && (c as CharString).str in Configuration.configuration) {
                    return (c as CharString).str;
                } else {
                    throw new Error('getconfig: invalid configuration parameter.');
                }
            });
            result = new MultiArray([C.length, 2], null, true);
            loadResult(C);
            return result;
        } else {
            AST.throwInvalidCallError('getconfig');
        }
    }
    /**
     * User functions
     */
    public static readonly functions: Record<string, Function> = {
        configure: Configuration.configure,
        getconfig: Configuration.getconfig,
    };
}
export { Configuration };
export default { Configuration };
