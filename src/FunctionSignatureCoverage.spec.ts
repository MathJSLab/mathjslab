/// <reference types="jest" />
import path from 'node:path';
import type { BuiltInFunctionInputSignature, BuiltInFunctionParameter, BuiltInFunctionSignature, FunctionSignatureEntry, NodeBuiltInFunction } from './AST';
import { Configuration } from './Configuration';
import { CoreFunctions } from './CoreFunctions';
import { FunctionSignature } from './FunctionSignature';
import { Interpreter } from './Interpreter';
import { LinearAlgebra } from './LinearAlgebra';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const modules: Array<{
    name: string;
    functions: Record<string, FunctionSignatureEntry>;
}> = [
    { name: 'Configuration', functions: Configuration.functions },
    { name: 'CoreFunctions', functions: CoreFunctions.functions },
    { name: 'LinearAlgebra', functions: LinearAlgebra.functions },
];

const asArray = <T>(value: T | T[] | undefined): T[] => {
    if (typeof value === 'undefined') {
        return [];
    }
    return Array.isArray(value) ? value : [value];
};

const validateParameter = (moduleName: string, functionName: string, pathName: string, parameter: BuiltInFunctionParameter): string[] => {
    const failures: string[] = [];
    if (!parameter.name) {
        failures.push(`${moduleName}.${functionName}: ${pathName} has no name`);
    }
    if (parameter.validators) {
        const knownValidatorNames = new Set([
            'numeric',
            'numericOrLogical',
            'text',
            'textScalar',
            'scalar',
            'scalarOrEmpty',
            'scalarOrVector',
            'empty',
            'matrix2d',
            'squareMatrix',
            'vector',
            'twoElement',
            'oneOrTwoElement',
            'dimension',
            'dimensionGreaterThanOne',
            'dimensionVector',
            'reshapeDimension',
            'reshapeDimensionVector',
            'nonempty',
            'positive',
            'nonnegative',
            'nonzero',
            'zeroOrOne',
            'integer',
            'finite',
            'real',
        ]);
        for (const validator of parameter.validators) {
            if (!knownValidatorNames.has(validator)) {
                failures.push(`${moduleName}.${functionName}: ${pathName} has unsupported validator '${validator}'`);
            }
        }
    }
    for (const [index, alternative] of (parameter.alternatives ?? []).entries()) {
        failures.push(...validateParameter(moduleName, functionName, `${pathName}.alternatives[${index}]`, alternative));
    }
    for (const [index, variadic] of (parameter.variadicGroup ?? []).entries()) {
        failures.push(...validateParameter(moduleName, functionName, `${pathName}.variadicGroup[${index}]`, variadic));
    }
    return failures;
};

const validateSignature = (moduleName: string, functionName: string, signature: BuiltInFunctionSignature): string[] => {
    const failures: string[] = [];
    const inputs = asArray(signature.inputs);
    const outputs = asArray(signature.outputs);
    if (inputs.length === 0) {
        failures.push(`${moduleName}.${functionName}: missing input signature`);
    }
    if (outputs.length === 0) {
        failures.push(`${moduleName}.${functionName}: missing output signature`);
    }
    const checkArity = (kind: 'inputs' | 'outputs', item: BuiltInFunctionInputSignature, index: number) => {
        if (!Number.isInteger(item.arity)) {
            failures.push(`${moduleName}.${functionName}: ${kind}[${index}] arity must be an integer`);
        }
        if (item.min !== undefined && (!Number.isInteger(item.min) || item.min < 0)) {
            failures.push(`${moduleName}.${functionName}: ${kind}[${index}] min must be a nonnegative integer`);
        }
        if (item.max !== undefined && (!Number.isInteger(item.max) || item.max < 0)) {
            failures.push(`${moduleName}.${functionName}: ${kind}[${index}] max must be a nonnegative integer`);
        }
        if (item.min !== undefined && item.max !== undefined && item.max < item.min) {
            failures.push(`${moduleName}.${functionName}: ${kind}[${index}] max must be >= min`);
        }
        if (FunctionSignature.arityMinimum(item) > FunctionSignature.arityMaximum(item)) {
            failures.push(`${moduleName}.${functionName}: ${kind}[${index}] derived arity range is empty`);
        }
        for (const [parameterIndex, parameter] of (item.parameters ?? []).entries()) {
            failures.push(...validateParameter(moduleName, functionName, `${kind}[${index}].parameters[${parameterIndex}]`, parameter));
        }
    };
    inputs.forEach((input, index) => checkArity('inputs', input, index));
    outputs.forEach((output, index) => checkArity('outputs', output as BuiltInFunctionInputSignature, index));
    return failures;
};

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Built-in signature coverage', () => {
        it('Should keep module function table entries complete.', () => {
            const failures = modules.flatMap((moduleItem) =>
                Object.entries(moduleItem.functions).flatMap(([functionName, entry]) => {
                    const entryFailures: string[] = [];
                    if (typeof entry.func !== 'function') {
                        entryFailures.push(`${moduleItem.name}: missing function implementation for ${functionName}`);
                    }
                    if (!entry.signature) {
                        entryFailures.push(`${moduleItem.name}: missing signature for ${functionName}`);
                    }
                    return entryFailures;
                }),
            );

            expect(failures).toEqual([]);
        });

        it('Should provide structurally valid signatures for all module built-ins.', () => {
            const failures = modules.flatMap((moduleItem) =>
                Object.entries(moduleItem.functions).flatMap(([functionName, entry]) => validateSignature(moduleItem.name, functionName, entry.signature)),
            );

            expect(failures).toEqual([]);
        });

        it('Should install signatures for every registered interpreter built-in.', () => {
            const interpreter = Interpreter.Create();
            const missingSignatures = interpreter.context.builtInFunctionList.filter((name) => !interpreter.context.builtInFunctionTable[name].signature);

            expect(missingSignatures).toEqual([]);
        });

        it('Should derive callable nargin and nargout for every registered built-in.', () => {
            const interpreter = Interpreter.Create();
            const failures: string[] = [];

            for (const name of interpreter.context.builtInFunctionList) {
                const node = interpreter.context.builtInFunctionTable[name] as NodeBuiltInFunction;
                try {
                    expect(FunctionSignature.declaredArity(FunctionSignature.inputSignatures(node))).toBeDefined();
                    expect(FunctionSignature.declaredArity(FunctionSignature.outputSignatures(node))).toBeDefined();
                    interpreter.Execute(`nargin("${name}"); nargout("${name}")`);
                } catch (error: unknown) {
                    failures.push(`${name}: ${(error as Error).message}`);
                }
            }

            expect(failures).toEqual([]);
        });
    });
});
