import { CharString } from './CharString';
import { type Rounding, type Modulo, type RoundingName, type ModuloName, roundingName, moduloName } from './ComplexInterface';
import { RealTypeDescriptor, Complex, ComplexType } from './Complex';
import { ElementType, MultiArray } from './MultiArray';
import { AST, type FunctionSignatureEntry, type BuiltInFunctionSignature } from './AST';
import { BLAS } from './BLAS';

type ConfigurationEntry = {
    set: (config: ElementType) => void;
    setDefault: () => void;
    get: () => ElementType;
};

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
    private static readonly configuration: Record<string, ConfigurationEntry> = {
        blockThreshold: {
            set: (threshold: ElementType) =>
                BLAS.set({ blockThreshold: MultiArray.testInteger(Configuration.requireComplex(threshold), 'configure', 'blockThreshold configuration parameter') }),
            setDefault: () => BLAS.set({ blockThreshold: BLAS.defaultSettings.blockThreshold }),
            get: () => Complex.create(BLAS.settings.blockThreshold),
        },
        blockSize: {
            set: (size: ElementType) => BLAS.set({ blockSize: MultiArray.testInteger(Configuration.requireComplex(size), 'configure', 'blockSize configuration parameter') }),
            setDefault: () => BLAS.set({ blockSize: BLAS.defaultSettings.blockSize }),
            get: () => Complex.create(BLAS.settings.blockSize),
        },
        real: {
            set: (engine: ElementType) => (Complex.engine = Configuration.requireCharString(engine).str as RealTypeDescriptor),
            setDefault: () => (Complex.engine = 'decimal'),
            get: () => new CharString(Complex.engine),
        },
        precision: {
            set: (precision: ElementType) => Complex.set({ precision: Complex.realToNumber(Configuration.requireComplex(precision)) }),
            setDefault: () => Complex.set({ precision: Complex.defaultSettings.precision }),
            get: () => Complex.create(Complex.settings.precision),
        },
        precisionCompare: {
            set: (precisionCompare: ElementType) => Complex.set({ precisionCompare: Complex.realToNumber(Configuration.requireComplex(precisionCompare)) }),
            setDefault: () => Complex.set({ precisionCompare: Complex.defaultSettings.precisionCompare }),
            get: () => Complex.create(Complex.settings.precisionCompare),
        },
        rounding: {
            set: (value: ElementType) => {
                const rounding = Configuration.requireCharString(value);
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
            set: (toExpPos: ElementType) => Complex.set({ toExpPos: Complex.realToNumber(Configuration.requireComplex(toExpPos)) }),
            setDefault: () => Complex.set({ toExpPos: Complex.defaultSettings.toExpPos }),
            get: () => Complex.create(Complex.settings.toExpPos),
        },
        toExpNeg: {
            set: (toExpNeg: ElementType) => Complex.set({ toExpNeg: Complex.realToNumber(Configuration.requireComplex(toExpNeg)) }),
            setDefault: () => Complex.set({ toExpNeg: Complex.defaultSettings.toExpNeg }),
            get: () => Complex.create(Complex.settings.toExpNeg),
        },
        minE: {
            set: (minE: ElementType) => Complex.set({ minE: Complex.realToNumber(Configuration.requireComplex(minE)) }),
            setDefault: () => Complex.set({ minE: Complex.defaultSettings.minE }),
            get: () => Complex.create(Complex.settings.minE),
        },
        maxE: {
            set: (maxE: ElementType) => Complex.set({ maxE: Complex.realToNumber(Configuration.requireComplex(maxE)) }),
            setDefault: () => Complex.set({ maxE: Complex.defaultSettings.maxE }),
            get: () => Complex.create(Complex.settings.maxE),
        },
        modulo: {
            set: (value: ElementType) => {
                const modulo = Configuration.requireCharString(value);
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
            set: (crypto: ElementType) => Complex.set({ crypto: Boolean(Complex.realToNumber(Configuration.requireComplex(crypto))) }),
            setDefault: () => Complex.set({ crypto: Complex.defaultSettings.crypto }),
            get: () => Complex.create(Number(Complex.settings.crypto), 0, Complex.LOGICAL),
        },
    };

    private static readonly requireComplex = (value: ElementType): ComplexType => {
        if (Complex.isInstanceOf(value)) {
            return value;
        }
        AST.throwInvalidCallError('configure');
        throw new Error('unreachable');
    };

    private static readonly requireCharString = (value: ElementType): CharString => {
        if (CharString.isInstanceOf(value)) {
            return value;
        }
        AST.throwInvalidCallError('configure');
        throw new Error('unreachable');
    };

    private static readonly configurationEntry = (name: string): ConfigurationEntry | undefined => Configuration.configuration[name];

    public static readonly configureSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -2,
            min: 0,
            max: 2,
            parameters: [
                {
                    name: 'configuration',
                    optional: true,
                    alternatives: [
                        { name: 'name', classes: ['char', 'string'] },
                        { name: 'configurationList', classes: ['cell'] },
                    ],
                },
                { name: 'value', optional: true },
            ],
        },
        outputs: { arity: 1 },
    };
    /**
     * `configure`
     */
    public static configure(): CharString;
    public static configure(config: CharString, value: ElementType): CharString;
    public static configure(CONFIG: MultiArray): CharString;
    public static configure(...args: ElementType[]): CharString | undefined {
        const setConfig = (name: ElementType, value: ElementType): void => {
            if (CharString.isInstanceOf(name)) {
                const entry = Configuration.configurationEntry(name.str);
                if (!entry) {
                    throw new ReferenceError(`configure: invalid configuration: '${name.str}'.`);
                }
                entry.set(value);
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
                args[0].array.forEach((config) => {
                    setConfig(config[0], config[1]);
                });
                return new CharString(`${args[0].array.length} configuration values set.`);
            } else {
                AST.throwInvalidCallError('configure');
            }
        } else if (args.length === 2 && CharString.isInstanceOf(args[0])) {
            /* Configuration key and value. */
            setConfig(args[0], args[1]);
            return new CharString(`Configuration parameter '${args[0].str}' set to '${Configuration.configuration[args[0].str].get()!.toString()}'`);
        } else {
            AST.throwInvalidCallError('configure');
        }
    }

    public static readonly getconfigSignature: BuiltInFunctionSignature = {
        inputs: {
            arity: -1,
            min: 0,
            max: 1,
            parameters: [
                {
                    name: 'configuration',
                    optional: true,
                    alternatives: [
                        { name: 'name', classes: ['char', 'string'] },
                        { name: 'configurationList', classes: ['cell'] },
                    ],
                },
            ],
        },
        outputs: { arity: 1 },
    };

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
    public static readonly functions: Record<keyof Configuration | string, FunctionSignatureEntry> = {
        configure: { func: Configuration.configure, signature: Configuration.configureSignature },
        getconfig: { func: Configuration.getconfig, signature: Configuration.getconfigSignature },
    };
}
export { Configuration };
export default { Configuration };
