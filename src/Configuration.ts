import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import type { Rounding, Modulo } from './ComplexDecimal';
import { CoreFunctions } from './CoreFunctions';
import { ElementType, MultiArray } from './MultiArray';

/**
 * MathJSLab configuration.
 */
abstract class Configuration {
    /**
     * User functions
     */
    public static functions: Record<string, Function> = {
        configure: Configuration.configure,
        getconfig: Configuration.getconfig,
    };

    private static roundingStrings = ['up', 'down', 'ceil', 'floor', 'half_up', 'half_down', 'half_even', 'half_ceil', 'half_floor'];

    private static moduloStrings = ['up', 'down', undefined, 'floor', undefined, undefined, 'half_even', undefined, undefined, 'euclid'];

    /**
     * Configuration parameters table.
     */
    private static configuration: Record<
        string,
        {
            set: (config: any) => void;
            setDefault: () => void;
            get: () => any;
        }
    > = {
        precision: {
            set: (precision: ComplexDecimal) => ComplexDecimal.set({ precision: precision.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ precision: ComplexDecimal.defaultConfiguration.precision }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.precision),
        },
        precisionCompare: {
            set: (precisionCompare: ComplexDecimal) => ComplexDecimal.set({ precisionCompare: precisionCompare.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ precisionCompare: ComplexDecimal.defaultConfiguration.precisionCompare }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.precisionCompare),
        },
        rounding: {
            set: (rounding: CharString) => {
                const roundingMode = Configuration.roundingStrings.indexOf(rounding.str);
                if (roundingMode > 0) {
                    ComplexDecimal.set({ rounding: roundingMode as Rounding });
                } else {
                    throw new Error(`configure: invalid rounding mode: ${rounding.str}`);
                }
            },
            setDefault: () => ComplexDecimal.set({ rounding: ComplexDecimal.defaultConfiguration.rounding }),
            get: () => new CharString(Configuration.roundingStrings[ComplexDecimal.settings.rounding as number]),
        },
        toExpPos: {
            set: (toExpPos: ComplexDecimal) => ComplexDecimal.set({ toExpPos: toExpPos.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ toExpPos: ComplexDecimal.defaultConfiguration.toExpPos }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.toExpPos),
        },
        toExpNeg: {
            set: (toExpNeg: ComplexDecimal) => ComplexDecimal.set({ toExpPos: toExpNeg.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ toExpNeg: ComplexDecimal.defaultConfiguration.toExpNeg }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.toExpNeg),
        },
        minE: {
            set: (minE: ComplexDecimal) => ComplexDecimal.set({ minE: minE.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ minE: ComplexDecimal.defaultConfiguration.minE }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.minE),
        },
        maxE: {
            set: (maxE: ComplexDecimal) => ComplexDecimal.set({ maxE: maxE.re.toNumber() }),
            setDefault: () => ComplexDecimal.set({ maxE: ComplexDecimal.defaultConfiguration.maxE }),
            get: () => new ComplexDecimal(ComplexDecimal.settings.maxE),
        },
        modulo: {
            set: (modulo: CharString) => {
                const moduloMode = Configuration.moduloStrings.indexOf(modulo.str);
                if (moduloMode > 0) {
                    ComplexDecimal.set({ modulo: moduloMode as Modulo });
                } else {
                    throw new Error(`configure: invalid modulo mode: ${modulo.str}`);
                }
            },
            setDefault: () => ComplexDecimal.set({ modulo: ComplexDecimal.defaultConfiguration.modulo }),
            get: () => new CharString(Configuration.moduloStrings[ComplexDecimal.settings.modulo as number] as string),
        },
        crypto: {
            set: (crypto: ComplexDecimal) => ComplexDecimal.set({ crypto: Boolean(crypto.re.toNumber()) }),
            setDefault: () => ComplexDecimal.set({ crypto: ComplexDecimal.defaultConfiguration.crypto }),
            get: () => new ComplexDecimal(Number(ComplexDecimal.settings.crypto), 0, ComplexDecimal.LOGICAL),
        },
    };

    public static configure(): CharString;
    public static configure(config: CharString, value: ElementType): CharString;
    public static configure(CONFIG: MultiArray): CharString;
    public static configure(...args: any[]): CharString | undefined {
        const setConfig = (config: [CharString, any]): void => {
            if (config[0] instanceof CharString) {
                if (config[0].str in Configuration.configuration) {
                    Configuration.configuration[config[0].str].set(config[1]);
                } else {
                    throw new ReferenceError(`configure: invalid configuration: '${config[0].str}'.`);
                }
            } else {
                CoreFunctions.throwInvalidCallError('configure');
            }
        };
        if (args.length === 0) {
            // Set default configuration.
            for (const config in Configuration.configuration) {
                Configuration.configuration[config].setDefault();
            }
            return new CharString('All configuration set to default values.');
        } else if (args.length === 1 && args[0] instanceof MultiArray) {
            // Array of configuration key and value.
            if (args[0].dimension[1] === 2) {
                (args[0].array as [CharString, any][]).forEach((config: [CharString, any]) => {
                    setConfig(config);
                });
                return new CharString(`${args[0].array.length} configuration values set.`);
            } else {
                CoreFunctions.throwInvalidCallError('configure');
            }
        } else if (args.length === 2 && args[0] instanceof CharString) {
            // Configuration key and value.
            setConfig(args as [CharString, any]);
            return new CharString(`Configuration parameter '${args[0].str}' set to ${Configuration.configuration[args[0].str].get().unparse()}`);
        } else {
            CoreFunctions.throwInvalidCallError('configure');
        }
    }

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
            // Get all configurations.
            result = new MultiArray([keys.length, 2], null, true);
            loadResult(keys);
            return result;
        } else if (args.length === 1) {
            // Get selected configurations.
            const C = MultiArray.linearize(MultiArray.scalarToMultiArray(args[0])).map((c) => {
                if (c instanceof CharString && c.str in Configuration.configuration) {
                    return c.str;
                } else {
                    throw new Error('getconfig: invalid configuration parameter.');
                }
            });
            result = new MultiArray([C.length, 2], null, true);
            loadResult(C);
            return result;
        } else {
            CoreFunctions.throwInvalidCallError('getconfig');
        }
    }
}
export { Configuration };
export default Configuration;
