import path from 'node:path';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { Configuration } from './Configuration';
import { MultiArray } from './MultiArray';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    afterEach(() => {
        Configuration.configure();
    });

    describe('Definition', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(Configuration).toBeDefined();
            expect(Configuration.functions.configure).toBeDefined();
            expect(Configuration.functions.getconfig).toBeDefined();
            expect(Configuration.signatures.configure).toBeDefined();
            expect(Configuration.signatures.getconfig).toBeDefined();
        });
    });

    describe('Configuration updates', () => {
        it('Should set a single configuration value and report it through getconfig.', () => {
            const message = Configuration.configure(new CharString('real'), new CharString('number'));
            const result = Configuration.getconfig(new CharString('real'));

            expect(message.str).toBe("Configuration parameter 'real' set to 'number'");
            expect(result.dimension).toEqual([1, 2]);
            expect((result.array[0][0] as CharString).str).toBe('real');
            expect((result.array[0][1] as CharString).str).toBe('number');
        });

        it('Should apply multiple configuration values from a cell array.', () => {
            const config = new MultiArray([2, 2], null, true);
            config.array = [
                [new CharString('blockSize'), Complex.create(32)],
                [new CharString('crypto'), Complex.true()],
            ];

            const message = Configuration.configure(config);
            const result = Configuration.getconfig(new CharString('blockSize'));

            expect(message.str).toBe('2 configuration values set.');
            expect(Complex.realToNumber(result.array[0][1] as ReturnType<typeof Complex.create>)).toBe(32);
        });

        it('Should reset all configuration values to defaults with no arguments.', () => {
            Configuration.configure(new CharString('real'), new CharString('number'));

            const message = Configuration.configure();
            const result = Configuration.getconfig(new CharString('real'));

            expect(message.str).toBe('All configuration set to default values.');
            expect((result.array[0][1] as CharString).str).toBe('decimal');
        });
    });

    describe('Validation', () => {
        it('Should reject unknown configuration names.', () => {
            expect(() => Configuration.configure(new CharString('missing'), Complex.one())).toThrow("configure: invalid configuration: 'missing'.");
            expect(() => Configuration.getconfig(new CharString('missing'))).toThrow('getconfig: invalid configuration parameter.');
        });
    });
});
