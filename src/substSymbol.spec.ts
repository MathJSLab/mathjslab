/// <reference types="jest" />
import path from 'node:path';
import { substSymbol } from './substSymbol';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Definition', () => {
        it(`${unitName} should be defined.`, () => {
            expect(substSymbol).toBeDefined();
        });
    });

    describe('Greek symbol substitution', () => {
        it('Should replace lower and upper case canonical Greek letter names.', () => {
            expect(substSymbol('alpha + Beta + omega')).toBe('&alpha; + &Beta; + &omega;');
        });

        it('Should replace Portuguese and alternate aliases before entity substitution.', () => {
            expect(substSymbol('alfa + Gama + teta + Ômega')).toBe('&alpha; + &Gamma; + &theta; + &Omega;');
            expect(substSymbol('csi + Ksi + fi + Qui')).toBe('&xi; + &Xi; + &phi; + &Chi;');
        });

        it('Should preserve names embedded in alphanumeric identifiers.', () => {
            expect(substSymbol('myalpha alpha2 alpha;')).toBe('myalpha alpha2 alpha;');
        });

        it('Should treat underscores as delimiters between symbol names.', () => {
            expect(substSymbol('alpha_beta')).toBe('&alpha;_&beta;');
        });

        it('Should substitute names after non-alphanumeric delimiters.', () => {
            expect(substSymbol('(alpha),[beta];-Gamma')).toBe('(&alpha;),[&beta;];-&Gamma;');
        });
    });

    describe('Special scalar names', () => {
        it('Should replace standalone Inf variants with the infinity entity.', () => {
            expect(substSymbol('Inf')).toBe('&infin;');
            expect(substSymbol('inf')).toBe('&infin;');
        });

        it('Should replace standalone NaN variants with bold NaN markup.', () => {
            expect(substSymbol('NaN')).toBe('<b>NaN</b>');
            expect(substSymbol('nan')).toBe('<b>NaN</b>');
        });

        it('Should not replace Inf or NaN inside larger text.', () => {
            expect(substSymbol('xInf')).toBe('xInf');
            expect(substSymbol('NaN_value')).toBe('NaN_value');
            expect(substSymbol('value nan')).toBe('value nan');
        });
    });
});
