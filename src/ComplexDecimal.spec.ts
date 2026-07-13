/// <reference types="jest" />
import path from 'node:path';
import { ComplexDecimal } from './ComplexDecimal';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(ComplexDecimal).toBeDefined();
        });
    });

    describe('Trigonometric identities', () => {
        const expectCloseToOne = (value: ReturnType<typeof ComplexDecimal.create>, tolerance = 1e-25): void => {
            expect(Math.abs(value.re.toNumber() - 1)).toBeLessThanOrEqual(tolerance);
            expect(Math.abs(value.im.toNumber())).toBeLessThanOrEqual(tolerance);
        };

        it('Should satisfy sin(x)^2 + cos(x)^2 approximately for representative angles.', () => {
            for (const angle of [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI]) {
                const value = ComplexDecimal.add(
                    ComplexDecimal.power(ComplexDecimal.sin(ComplexDecimal.create(angle)), ComplexDecimal.create(2)),
                    ComplexDecimal.power(ComplexDecimal.cos(ComplexDecimal.create(angle)), ComplexDecimal.create(2)),
                );
                expectCloseToOne(value);
            }
        });

        it('Should satisfy sin(x)^2 + cos(x)^2 approximately for tiny values.', () => {
            for (const angle of [0, 1e-302, 5e-302, 1e-300]) {
                const value = ComplexDecimal.add(
                    ComplexDecimal.power(ComplexDecimal.sin(ComplexDecimal.create(angle)), ComplexDecimal.create(2)),
                    ComplexDecimal.power(ComplexDecimal.cos(ComplexDecimal.create(angle)), ComplexDecimal.create(2)),
                );
                expectCloseToOne(value);
            }
        });

        it('Should satisfy Euler identity approximately.', () => {
            const value = ComplexDecimal.exp(ComplexDecimal.mul(ComplexDecimal.onei(), ComplexDecimal.pi()));
            const error = ComplexDecimal.abs(ComplexDecimal.sub(value, ComplexDecimal.minusone()));

            expect(error.re.toNumber()).toBeLessThanOrEqual(1e-25);
        });

        it('Should keep abs(sin(n*pi + pi/2)) approximately equal to 1.', () => {
            for (const n of [0, 1, 2, 10, 100]) {
                const value = ComplexDecimal.abs(ComplexDecimal.sin(ComplexDecimal.add(ComplexDecimal.mul(ComplexDecimal.create(n), ComplexDecimal.pi()), ComplexDecimal.pidiv2())));
                expectCloseToOne(value);
            }
        });
    });
});
