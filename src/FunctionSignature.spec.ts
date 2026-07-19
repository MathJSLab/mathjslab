/// <reference types="jest" />
import path from 'node:path';
import type { BuiltInFunctionInputSignature, NodeBuiltInFunction } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { FunctionSignature } from './FunctionSignature';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionSignature).toBeDefined();
            expect(FunctionSignature.inputSignatures).toBeDefined();
            expect(FunctionSignature.declaredArity).toBeDefined();
        });

        it('Should normalize missing, single and overloaded built-in signatures.', () => {
            const noSignature = { type: 'BUILTIN', id: 'nosig' } as NodeBuiltInFunction;
            const single = { type: 'BUILTIN', id: 'single', signature: { inputs: { arity: 2 }, outputs: { arity: 1 } } } as NodeBuiltInFunction;
            const overloaded = {
                type: 'BUILTIN',
                id: 'overloaded',
                signature: { inputs: [{ arity: 1 }, { arity: -2 }], outputs: [{ arity: 1 }, { arity: -2 }] },
            } as NodeBuiltInFunction;

            expect(FunctionSignature.inputSignatures(noSignature)).toEqual([]);
            expect(FunctionSignature.outputSignatures(noSignature)).toEqual([]);
            expect(FunctionSignature.inputSignatures(single)).toEqual([{ arity: 2 }]);
            expect(FunctionSignature.outputSignatures(single)).toEqual([{ arity: 1 }]);
            expect(FunctionSignature.inputSignatures(overloaded)).toEqual([{ arity: 1 }, { arity: -2 }]);
            expect(FunctionSignature.outputSignatures(overloaded)).toEqual([{ arity: 1 }, { arity: -2 }]);
        });

        it('Should compute arity ranges from fixed, bounded and variadic signatures.', () => {
            expect(FunctionSignature.arityMinimum({ arity: 3 })).toBe(3);
            expect(FunctionSignature.arityMaximum({ arity: 3 })).toBe(3);
            expect(FunctionSignature.arityMinimum({ arity: -3 })).toBe(2);
            expect(FunctionSignature.arityMaximum({ arity: -3 })).toBe(Infinity);
            expect(FunctionSignature.arityMinimum({ arity: -3, min: 1, max: 4 })).toBe(1);
            expect(FunctionSignature.arityMaximum({ arity: -3, min: 1, max: 4 })).toBe(4);
        });

        it('Should derive MATLAB-like declared arity from overload sets.', () => {
            const fixed: BuiltInFunctionInputSignature[] = [{ arity: 2 }, { arity: 2 }];
            const bounded: BuiltInFunctionInputSignature[] = [{ arity: 2 }, { arity: 4 }];
            const variadic: BuiltInFunctionInputSignature[] = [{ arity: -3 }];
            const variadicParameter: BuiltInFunctionInputSignature[] = [{ arity: -2, parameters: [{ name: 'value' }, { name: 'extra', variadic: true }] }];

            expect(FunctionSignature.declaredArity([])).toBeUndefined();
            expect(FunctionSignature.declaredArity(fixed)).toBe(2);
            expect(FunctionSignature.declaredArity(bounded)).toBe(-4);
            expect(FunctionSignature.declaredArity(variadic)).toBe(-3);
            expect(FunctionSignature.declaredArity(variadicParameter)).toBe(-2);
        });

        it('Should match argument counts against signature ranges.', () => {
            expect(FunctionSignature.arityMatches({ arity: 2 }, 1)).toBe(false);
            expect(FunctionSignature.arityMatches({ arity: 2 }, 2)).toBe(true);
            expect(FunctionSignature.arityMatches({ arity: -3 }, 2)).toBe(true);
            expect(FunctionSignature.arityMatches({ arity: -3 }, 20)).toBe(true);
            expect(FunctionSignature.arityMatches({ arity: -3, min: 1, max: 4 }, 0)).toBe(false);
            expect(FunctionSignature.arityMatches({ arity: -3, min: 1, max: 4 }, 4)).toBe(true);
            expect(FunctionSignature.arityMatches({ arity: -3, min: 1, max: 4 }, 5)).toBe(false);
        });

        it('Should select matching built-in input overloads.', () => {
            const builtin = {
                type: 'BUILTIN',
                id: 'overloaded',
                signature: { inputs: [{ arity: 1 }, { arity: 2 }, { arity: -3 }] },
            } as NodeBuiltInFunction;

            expect(FunctionSignature.inputArityIsValid(builtin, 0)).toBe(false);
            expect(FunctionSignature.inputArityIsValid(builtin, 4)).toBe(true);
            expect(FunctionSignature.matchingInputSignatures(builtin, 2)).toEqual([{ arity: 2 }, { arity: -3 }]);
        });

        it('Should validate built-in parameters only for matching overloads.', () => {
            const builtin = {
                type: 'BUILTIN',
                id: 'typed',
                signature: {
                    inputs: [
                        { arity: 1, parameters: [{ name: 'x', classes: ['double'] }] },
                        {
                            arity: 2,
                            parameters: [
                                { name: 'x', classes: ['char'] },
                                { name: 'y', classes: ['double'] },
                            ],
                        },
                    ],
                },
            } as NodeBuiltInFunction;

            expect(FunctionSignature.inputParametersAreValid(builtin, [Complex.create(1)])).toBe(true);
            expect(FunctionSignature.inputParametersAreValid(builtin, [new CharString('x'), Complex.create(2)])).toBe(true);
            expect(FunctionSignature.inputParametersAreValid(builtin, [new CharString('x')])).toBe(false);
            expect(FunctionSignature.inputParametersAreValid(builtin, [Complex.create(1), Complex.create(2)])).toBe(false);
        });
    });
});
