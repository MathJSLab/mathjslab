/// <reference types="jest" />
import path from 'node:path';
import type { NodeArgumentValidation, NodeExpr, NodeFunctionDefinition, NodeInput } from './AST';
import { AST } from './AST';
import { CharString } from './CharString';
import { Complex } from './Complex';
import { MultiArray } from './MultiArray';
import { FunctionArguments } from './FunctionArguments';

const __filenameMatch = __filename.match(new RegExp(`.*\\${path.sep}([^\\${path.sep}]+)\\.spec\\.([cm]?[jt]s)\$`))!;
const unitName = __filenameMatch[1];
const testExtension = __filenameMatch[2];

const throwSyntaxError = (message: string): never => {
    throw new Error(message);
};
const throwEvalError = (message: string): never => {
    throw new Error(message);
};

const argValidation = (overrides: Partial<NodeArgumentValidation>): NodeArgumentValidation =>
    ({
        type: 'ARGVALID',
        name: AST.nodeIdentifier('x'),
        size: [],
        class: null,
        functions: [],
        default: undefined,
        omitAnswer: false,
        omitOutput: false,
        ...overrides,
    }) as NodeArgumentValidation;

const functionDefinition = (parameterNames: string[], returnNames: string[], validations: NodeArgumentValidation[], attribute?: string): NodeFunctionDefinition =>
    ({
        type: 'FCNDEF',
        id: 'f',
        mapper: false,
        ev: [],
        func: () => undefined,
        return: AST.nodeList(returnNames.map((name) => AST.nodeIdentifier(name))),
        parameter: AST.nodeList(parameterNames.map((name) => AST.nodeIdentifier(name))),
        arguments: AST.nodeList([
            {
                type: 'ARGS',
                attribute: attribute ? AST.nodeIdentifier(attribute) : null,
                attributes: attribute ? [AST.nodeIdentifier(attribute)] : [],
                validation: validations,
                omitAnswer: false,
                omitOutput: false,
            },
        ]),
        statements: AST.nodeList([]),
        omitAnswer: false,
        omitOutput: false,
    }) as NodeFunctionDefinition;

describe(`${unitName} unit test (.${testExtension} test file).`, () => {
    describe('Behavior', () => {
        it(`${unitName} and its methods should be defined.`, () => {
            expect(FunctionArguments).toBeDefined();
            expect(FunctionArguments.validateBlocks).toBeDefined();
            expect(FunctionArguments.validateArgumentValidation).toBeDefined();
        });

        it('Should read identifiers and name-value declaration targets.', () => {
            const simple = argValidation({ name: AST.nodeIdentifier('x') });
            const named = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Color') });

            expect(FunctionArguments.validationName(simple, throwSyntaxError)).toBe('x');
            expect(FunctionArguments.nameValueTarget(simple, throwSyntaxError)).toBeUndefined();
            expect(FunctionArguments.nameValueTarget(named, throwSyntaxError)).toEqual({ parameter: 'opts', field: 'Color' });
            expect(FunctionArguments.validationDisplayName(named, throwSyntaxError)).toBe('opts.Color');
        });

        it('Should parse literal and symbolic argument sizes.', () => {
            const validation = argValidation({ size: [Complex.create(1), AST.nodeIdentifier('n'), AST.nodeColon()] });

            const size = FunctionArguments.literalArgumentSize(validation, throwSyntaxError)!;

            expect(size).toEqual([1, { type: 'symbol', name: 'n' }, { type: 'any' }]);
            expect(FunctionArguments.argumentSizeDisplay(size)).toBe('(1,n,:)');
        });

        it('Should parse single and alternative argument classes.', () => {
            const single = argValidation({ class: AST.nodeIdentifier('double') });
            const alternatives = argValidation({ class: AST.nodeList([AST.nodeIdentifier('double'), AST.nodeIdentifier('char')]) });

            expect(FunctionArguments.argumentClassName(single, throwSyntaxError)).toBe('double');
            expect(FunctionArguments.argumentClassNames(single, throwSyntaxError)).toEqual(['double']);
            expect(FunctionArguments.argumentClassName(alternatives, throwSyntaxError)).toBeUndefined();
            expect(FunctionArguments.argumentClassNames(alternatives, throwSyntaxError)).toEqual(['double', 'char']);
            expect(FunctionArguments.argumentClassDisplay(['double', 'char'])).toBe('double or char');
        });

        it('Should parse class and function validators.', () => {
            const greaterThan = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeGreaterThan'), AST.nodeList([AST.nodeIdentifier('x'), Complex.create(0)]));
            const inRange = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeInRange'), AST.nodeList([AST.nodeIdentifier('x'), Complex.create(0), Complex.create(10)]));
            const between = AST.nodeIndexExpr(
                AST.nodeIdentifier('mustBeBetween'),
                AST.nodeList([AST.nodeIdentifier('x'), Complex.create(0), Complex.create(10), new CharString('open', '"')]),
            );
            const member = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeMember'), AST.nodeList([AST.nodeIdentifier('x'), AST.nodeIdentifier('allowed')]));
            const mustBeA = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeA'), AST.nodeList([AST.nodeIdentifier('x'), new CharString('double', "'")]));
            const mustBeUnderlyingType = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeUnderlyingType'), AST.nodeList([AST.nodeIdentifier('x'), new CharString('double', "'")]));
            const validation = argValidation({
                class: AST.nodeIdentifier('double'),
                functions: [
                    AST.nodeIdentifier('mustBeNumericOrLogical'),
                    AST.nodeIdentifier('mustBeTextScalar'),
                    AST.nodeIdentifier('mustBeNonzeroLengthText'),
                    AST.nodeIdentifier('mustBeValidVariableName'),
                    AST.nodeIdentifier('mustBeFile'),
                    AST.nodeIdentifier('mustBeFolder'),
                    AST.nodeIdentifier('mustBeFloat'),
                    AST.nodeIdentifier('mustBeMatrix'),
                    AST.nodeIdentifier('mustBeSquare'),
                    AST.nodeIdentifier('mustBeRow'),
                    AST.nodeIdentifier('mustBeColumn'),
                    AST.nodeIdentifier('mustBeNonzero'),
                    AST.nodeIdentifier('mustBeNonmissing'),
                    AST.nodeIdentifier('mustBeNonsparse'),
                    AST.nodeIdentifier('mustBeSparse'),
                    AST.nodeIdentifier('mustBePositive'),
                    greaterThan,
                    inRange,
                    between,
                    member,
                    mustBeA,
                    mustBeUnderlyingType,
                ],
            });

            expect(FunctionArguments.argumentClassName(validation, throwSyntaxError)).toBe('double');
            expect(FunctionArguments.argumentValidators(validation, throwSyntaxError).map((validator) => validator.name)).toEqual([
                'mustBeNumericOrLogical',
                'mustBeTextScalar',
                'mustBeNonzeroLengthText',
                'mustBeValidVariableName',
                'mustBeFile',
                'mustBeFolder',
                'mustBeFloat',
                'mustBeMatrix',
                'mustBeSquare',
                'mustBeRow',
                'mustBeColumn',
                'mustBeNonzero',
                'mustBeNonmissing',
                'mustBeNonsparse',
                'mustBeSparse',
                'mustBePositive',
                'mustBeGreaterThan',
                'mustBeInRange',
                'mustBeBetween',
                'mustBeMember',
                'mustBeA',
                'mustBeUnderlyingType',
            ]);
        });

        it('Should parse custom argument validators.', () => {
            const customCall = AST.nodeIndexExpr(AST.nodeIdentifier('mustBeAbove'), AST.nodeList([AST.nodeIdentifier('x'), AST.nodeIdentifier('limit')]));
            const validation = argValidation({ functions: [AST.nodeIdentifier('mustBeCustom'), customCall] });

            expect(FunctionArguments.argumentValidators(validation, throwSyntaxError)).toEqual([
                { name: 'mustBeCustom', custom: 'implicit' },
                { name: 'mustBeAbove', custom: 'explicit', expression: customCall },
            ]);
        });

        it('Should report unsupported argument declaration shapes with stable diagnostics.', () => {
            const nestedNameValue = argValidation({ name: AST.nodeIndirectRef(AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Inner'), 'Value') });
            const invalidSizeKind = argValidation({ size: [new CharString('n')] });
            const invalidSizeValue = argValidation({ size: [Complex.create(0)] });
            const invalidClass = argValidation({ class: AST.nodeList([AST.nodeIdentifier('double'), Complex.create(1)]) });
            const invalidBuiltInValidator = argValidation({
                functions: [AST.nodeIndexExpr(AST.nodeIdentifier('mustBeGreaterThan'), AST.nodeList([AST.nodeIdentifier('x')]))],
            });
            const invalidValidatorShape = argValidation({ functions: [AST.nodeOperation('+', AST.nodeIdentifier('x'), Complex.create(1))] });

            expect(() => FunctionArguments.nameValueTarget(nestedNameValue, throwSyntaxError)).toThrow('arguments block name-value declaration must be a single dotted identifier.');
            expect(() => FunctionArguments.literalArgumentSize(invalidSizeKind, throwSyntaxError)).toThrow(
                "arguments block size validation for 'x' must use positive integer, symbolic, or ':' dimensions.",
            );
            expect(() => FunctionArguments.literalArgumentSize(invalidSizeValue, throwSyntaxError)).toThrow("arguments block size validation for 'x' must use positive integer dimensions.");
            expect(() => FunctionArguments.argumentClassNames(invalidClass, throwSyntaxError)).toThrow("arguments block class validation for 'x' must use class identifiers.");
            expect(() => FunctionArguments.argumentValidators(invalidBuiltInValidator, throwSyntaxError)).toThrow(
                "arguments block function validation for 'x' has invalid mustBeGreaterThan arguments.",
            );
            expect(() => FunctionArguments.argumentValidators(invalidValidatorShape, throwSyntaxError)).toThrow(
                "arguments block function validation for 'x' must be a validator identifier or function call.",
            );
        });

        it('Should validate argument blocks against function parameters and outputs.', () => {
            const input = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            const output = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('y') })], 'Output');
            const bad = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('z') })]);

            expect(() => FunctionArguments.validateBlocks(input, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(output, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(bad, throwSyntaxError)).toThrow("arguments block declaration 'z' does not match a function parameter in function f.");
        });

        it('Should reject arguments blocks in nested functions.', () => {
            const nested = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            nested.attributes = { nested: true };

            expect(() => FunctionArguments.validateBlocks(nested, throwSyntaxError)).toThrow('arguments blocks are not allowed in nested function f.');
        });

        it('Should normalize MATLAB-style multi-attribute argument blocks.', () => {
            const inputRepeating = functionDefinition(['varargin'], ['y'], [argValidation({ name: AST.nodeIdentifier('value') })]);
            inputRepeating.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Input'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('value') })]),
            );
            const outputRepeating = functionDefinition(['x'], ['varargout'], [argValidation({ name: AST.nodeIdentifier('varargout') })]);
            outputRepeating.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Output'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('varargout') })]),
            );
            const duplicate = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            duplicate.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Input'), AST.nodeIdentifier('Input')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })]),
            );
            const conflicting = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            conflicting.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Input'), AST.nodeIdentifier('Output')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })]),
            );

            expect(() => FunctionArguments.validateBlocks(inputRepeating, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(outputRepeating, throwSyntaxError)).not.toThrow();
            expect(FunctionArguments.outputRepeatingName(outputRepeating, throwSyntaxError)).toBe('varargout');
            expect(() => FunctionArguments.validateBlocks(duplicate, throwSyntaxError)).toThrow("duplicate arguments block attribute 'Input'.");
            expect(() => FunctionArguments.validateBlocks(conflicting, throwSyntaxError)).toThrow("arguments block attributes 'Input' and 'Output' cannot be combined.");
        });

        it('Should enforce MATLAB-style arguments block ordering.', () => {
            const repeated = functionDefinition(['varargin'], ['y'], []);
            repeated.arguments = AST.nodeList([
                AST.nodeArguments(AST.nodeIdentifier('Repeating'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })])),
                AST.nodeArguments(AST.nodeIdentifier('Repeating'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('y') })])),
            ]);
            const repeatingAfterNameValue = functionDefinition(['opts', 'varargin'], ['y'], []);
            repeatingAfterNameValue.arguments = AST.nodeList([
                AST.nodeArguments(null, AST.nodeList([argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.one() })])),
                AST.nodeArguments(AST.nodeIdentifier('Repeating'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })])),
            ]);
            const inputAfterOutput = functionDefinition(['x'], ['y'], []);
            inputAfterOutput.arguments = AST.nodeList([
                AST.nodeArguments(AST.nodeIdentifier('Output'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('y') })])),
                AST.nodeArguments(AST.nodeIdentifier('Input'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })])),
            ]);
            const ordinaryAfterRepeating = functionDefinition(['x', 'varargin'], ['y'], []);
            ordinaryAfterRepeating.arguments = AST.nodeList([
                AST.nodeArguments(AST.nodeIdentifier('Repeating'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('r') })])),
                AST.nodeArguments(AST.nodeIdentifier('Input'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })])),
            ]);
            const requiredAfterOptional = functionDefinition(['x', 'y'], ['z'], []);
            requiredAfterOptional.arguments = AST.nodeList([
                AST.nodeArguments(null, AST.nodeList([argValidation({ name: AST.nodeIdentifier('x'), default: Complex.one() }), argValidation({ name: AST.nodeIdentifier('y') })])),
            ]);
            const ordinaryAfterNameValue = functionDefinition(['x', 'opts'], ['y'], []);
            ordinaryAfterNameValue.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.one() }),
                        argValidation({ name: AST.nodeIdentifier('x') }),
                    ]),
                ),
            ]);

            expect(() => FunctionArguments.validateBlocks(repeated, throwSyntaxError)).toThrow('function f can contain only one arguments (Repeating) block.');
            expect(() => FunctionArguments.validateBlocks(repeatingAfterNameValue, throwSyntaxError)).toThrow(
                'arguments (Repeating) block must appear before name-value arguments in function f.',
            );
            expect(() => FunctionArguments.validateBlocks(inputAfterOutput, throwSyntaxError)).toThrow('input arguments blocks must appear before output arguments blocks in function f.');
            expect(() => FunctionArguments.validateBlocks(ordinaryAfterRepeating, throwSyntaxError)).toThrow(
                'ordinary input arguments blocks cannot follow repeating arguments block in function f.',
            );
            expect(() => FunctionArguments.validateBlocks(requiredAfterOptional, throwSyntaxError)).toThrow('required input arguments cannot follow optional input arguments in function f.');
            expect(() => FunctionArguments.validateBlocks(ordinaryAfterNameValue, throwSyntaxError)).toThrow(
                'ordinary input arguments must appear before name-value arguments in function f.',
            );
        });

        it('Should reject duplicate and conflicting arguments block declarations.', () => {
            const duplicateInput = functionDefinition(['x'], ['y'], []);
            duplicateInput.arguments = AST.nodeList([
                AST.nodeArguments(null, AST.nodeList([argValidation({ name: AST.nodeIdentifier('x') })])),
                AST.nodeArguments(null, AST.nodeList([argValidation({ name: AST.nodeIdentifier('x'), functions: [AST.nodeIdentifier('mustBePositive')] })])),
            ]);
            const duplicateOutput = functionDefinition(['x'], ['y'], []);
            duplicateOutput.arguments = AST.nodeList([
                AST.nodeArguments(AST.nodeIdentifier('Output'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('y') })])),
                AST.nodeArguments(AST.nodeIdentifier('Output'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('y'), functions: [AST.nodeIdentifier('mustBePositive')] })])),
            ]);
            const duplicateRepeating = functionDefinition(['varargin'], ['y'], []);
            duplicateRepeating.arguments = AST.nodeList([
                AST.nodeArguments(AST.nodeIdentifier('Repeating'), AST.nodeList([argValidation({ name: AST.nodeIdentifier('item') }), argValidation({ name: AST.nodeIdentifier('item') })])),
            ]);
            const ordinaryThenNameValue = functionDefinition(['x', 'opts'], ['y'], []);
            ordinaryThenNameValue.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIdentifier('opts') }),
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.one() }),
                    ]),
                ),
            ]);
            const nameValueThenOrdinary = functionDefinition(['x', 'opts'], ['y'], []);
            nameValueThenOrdinary.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.one() }),
                        argValidation({ name: AST.nodeIdentifier('opts') }),
                    ]),
                ),
            ]);
            const duplicatePublicNameValue = functionDefinition(['lineOptions', 'fillOptions'], ['y'], []);
            duplicatePublicNameValue.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('lineOptions'), 'Color'), default: new CharString('red') }),
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('fillOptions'), 'color'), default: new CharString('blue') }),
                    ]),
                ),
            ]);

            expect(() => FunctionArguments.validateBlocks(duplicateInput, throwSyntaxError)).toThrow("duplicate arguments block declaration 'x' in function f.");
            expect(() => FunctionArguments.validateBlocks(duplicateOutput, throwSyntaxError)).toThrow("duplicate arguments block output declaration 'y' in function f.");
            expect(() => FunctionArguments.validateBlocks(duplicateRepeating, throwSyntaxError)).toThrow("duplicate arguments (Repeating) declaration 'item' in function f.");
            expect(() => FunctionArguments.validateBlocks(ordinaryThenNameValue, throwSyntaxError)).toThrow(
                "arguments block parameter 'opts' cannot have both ordinary and name-value declarations in function f.",
            );
            expect(() => FunctionArguments.validateBlocks(nameValueThenOrdinary, throwSyntaxError)).toThrow(
                "arguments block parameter 'opts' cannot have both ordinary and name-value declarations in function f.",
            );
            expect(() => FunctionArguments.validateBlocks(duplicatePublicNameValue, throwSyntaxError)).toThrow("duplicate arguments block name-value field 'Color' in function f.");
        });

        it('Should allow optional name-value declarations without defaults.', () => {
            const noDefaultNameValue = functionDefinition(['x', 'opts'], ['y'], []);
            const validation = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Factor'), default: undefined, class: AST.nodeIdentifier('double') });
            noDefaultNameValue.arguments = AST.nodeList([AST.nodeArguments(null, AST.nodeList([validation]))]);

            expect(() => FunctionArguments.validateBlocks(noDefaultNameValue, throwSyntaxError)).not.toThrow();
            expect(() =>
                FunctionArguments.validateFunctionArguments(noDefaultNameValue, 'Input', {
                    resolveEntry: () => undefined,
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).not.toThrow();
        });

        it('Should reject name-value defaults and validators that depend on name-value arguments.', () => {
            const dependentDefault = functionDefinition(['opts'], ['y'], []);
            dependentDefault.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Min'), default: Complex.one() }),
                        argValidation({
                            name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Max'),
                            default: AST.nodeOperation('+', AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Min'), Complex.one()),
                        }),
                    ]),
                ),
            ]);
            const dependentValidator = functionDefinition(['opts'], ['y'], []);
            dependentValidator.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Min'), default: Complex.one() }),
                        argValidation({
                            name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Max'),
                            default: Complex.create(2),
                            functions: [
                                AST.nodeIndexExpr(
                                    AST.nodeIdentifier('mustBeGreaterThan'),
                                    AST.nodeList([AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Max'), AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Min')]),
                                ),
                            ],
                        }),
                    ]),
                ),
            ]);
            const validOwnTargetValidator = functionDefinition(['opts'], ['y'], []);
            validOwnTargetValidator.arguments = AST.nodeList([
                AST.nodeArguments(
                    null,
                    AST.nodeList([
                        argValidation({
                            name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Max'),
                            default: Complex.create(2),
                            functions: [AST.nodeIndexExpr(AST.nodeIdentifier('mustBeGreaterThan'), AST.nodeList([AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Max'), Complex.one()]))],
                        }),
                    ]),
                ),
            ]);

            expect(() => FunctionArguments.validateBlocks(dependentDefault, throwSyntaxError)).toThrow(
                "arguments block name-value default for 'opts.Max' cannot reference name-value argument 'opts.Min' in function f.",
            );
            expect(() => FunctionArguments.validateBlocks(dependentValidator, throwSyntaxError)).toThrow(
                "arguments block name-value validation for 'opts.Max' cannot reference name-value argument 'opts.Min' in function f.",
            );
            expect(() => FunctionArguments.validateBlocks(validOwnTargetValidator, throwSyntaxError)).not.toThrow();
        });

        it('Should reject invalid repeating output block declarations.', () => {
            const multiple = functionDefinition(['x'], ['out'], []);
            multiple.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Output'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('out') }), argValidation({ name: AST.nodeIdentifier('extra') })]),
            );
            const missing = functionDefinition(['x'], ['out'], []);
            missing.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Output'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('missing') })]),
            );
            const notLast = functionDefinition(['x'], ['items', 'tail'], []);
            notLast.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Output'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('items') })]),
            );
            const mixedVarargout = functionDefinition(['x'], ['head', 'varargout'], []);
            mixedVarargout.arguments.list[0] = AST.nodeArguments(
                AST.nodeList([AST.nodeIdentifier('Output'), AST.nodeIdentifier('Repeating')]),
                AST.nodeList([argValidation({ name: AST.nodeIdentifier('varargout') })]),
            );

            expect(() => FunctionArguments.validateBlocks(multiple, throwSyntaxError)).toThrow('arguments (Output,Repeating) requires exactly one declaration in function f.');
            expect(() => FunctionArguments.validateBlocks(missing, throwSyntaxError)).toThrow("arguments block declaration 'missing' does not match a return value in function f.");
            expect(() => FunctionArguments.validateBlocks(notLast, throwSyntaxError)).toThrow("arguments (Output,Repeating) declaration 'items' must be the last return in function f.");
            expect(() => FunctionArguments.validateBlocks(mixedVarargout, throwSyntaxError)).toThrow(
                "arguments (Output,Repeating) declaration 'varargout' must be the only return in function f.",
            );
        });

        it('Should reject structurally invalid function argument metadata instead of ignoring it.', () => {
            const invalidParameter = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            invalidParameter.parameter.list.push(AST.nodeReturn());
            const invalidReturn = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            invalidReturn.return.list.push(AST.nodeReturn());
            const invalidBlock = functionDefinition(['x'], ['y'], []);
            invalidBlock.arguments.list.push(AST.nodeReturn());
            const invalidValidation = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x') })]);
            invalidValidation.arguments.list[0].validation.push(AST.nodeReturn() as unknown as NodeArgumentValidation);

            expect(() => FunctionArguments.validateBlocks(invalidParameter, throwSyntaxError)).toThrow('internal AST error: function parameter 2 has invalid node type.');
            expect(() => FunctionArguments.validateBlocks(invalidReturn, throwSyntaxError)).toThrow('internal AST error: function return 2 has invalid node type.');
            expect(() => FunctionArguments.validateBlocks(invalidBlock, throwSyntaxError)).toThrow('internal AST error: function arguments block 2 has invalid node type.');
            expect(() => FunctionArguments.validateBlocks(invalidValidation, throwSyntaxError)).toThrow('internal AST error: arguments validation 2 has invalid node type.');
        });

        it('Should validate alternative argument classes during block registration.', () => {
            const valid = functionDefinition(
                ['x'],
                ['y'],
                [argValidation({ name: AST.nodeIdentifier('x'), class: AST.nodeList([AST.nodeIdentifier('double'), AST.nodeIdentifier('char')]) })],
            );
            const invalid = functionDefinition(['x'], ['y'], [argValidation({ name: AST.nodeIdentifier('x'), class: AST.nodeList([AST.nodeIdentifier('double'), Complex.create(1)]) })]);

            expect(() => FunctionArguments.validateBlocks(valid, throwSyntaxError)).not.toThrow();
            expect(() => FunctionArguments.validateBlocks(invalid, throwSyntaxError)).toThrow("arguments block class validation for 'x' must use class identifiers.");
        });

        it('Should validate values through resolver and evaluator callbacks.', () => {
            const value = new MultiArray([1, 2], [[Complex.create(2), Complex.create(3)]]);
            const validation = argValidation({ size: [Complex.create(1), Complex.create(2)], class: AST.nodeIdentifier('double'), functions: [AST.nodeIdentifier('mustBePositive')] });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: value }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).not.toThrow();
        });

        it('Should validate values against alternative argument classes.', () => {
            const validation = argValidation({ class: AST.nodeList([AST.nodeIdentifier('double'), AST.nodeIdentifier('char')]) });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: new CharString('ok', "'") }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).not.toThrow();
            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: new MultiArray([1, 1], [[Complex.create(1)]], true) }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).toThrow("arguments block validation failed for 'x': expected class double or char, got cell.");
        });

        it('Should validate values with mustBeA through the class matcher callback.', () => {
            const classNames = new MultiArray([1, 2], [[new CharString('Pkg.Base', '"'), new CharString('double', '"')]]);
            const validation = argValidation({ functions: [AST.nodeIndexExpr(AST.nodeIdentifier('mustBeA'), AST.nodeList([AST.nodeIdentifier('x'), classNames]))] });
            const callbacks = (value: NodeInput) => ({
                resolveEntry: () => ({ node: value }),
                evaluate: (expr: NodeExpr): NodeInput => (expr.type === 'IDENT' ? value : expr),
                matchesClass: (item: NodeInput, className: string): boolean => Complex.isInstanceOf(item) && (className === 'Pkg.Base' || className === 'double'),
                throwEvalError,
                throwSyntaxError,
            });

            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(Complex.create(1)))).not.toThrow();
            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(new CharString('bad', "'")))).toThrow(
                "arguments block validation failed for 'x': mustBeA.",
            );
        });

        it('Should validate values with mustBeUnderlyingType.', () => {
            const typeNames = new MultiArray([1, 2], [[new CharString('double', '"'), new CharString('logical', '"')]]);
            const validation = argValidation({ functions: [AST.nodeIndexExpr(AST.nodeIdentifier('mustBeUnderlyingType'), AST.nodeList([AST.nodeIdentifier('x'), typeNames]))] });
            const callbacks = (value: NodeInput) => ({
                resolveEntry: () => ({ node: value }),
                evaluate: (expr: NodeExpr): NodeInput => (expr.type === 'IDENT' ? value : expr),
                throwEvalError,
                throwSyntaxError,
            });

            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(Complex.create(1)))).not.toThrow();
            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(Complex.true()))).not.toThrow();
            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(new CharString('bad', "'")))).toThrow(
                "arguments block validation failed for 'x': mustBeUnderlyingType.",
            );
        });

        it('Should report value validation failures through callbacks.', () => {
            const value = new MultiArray([1, 2], [[Complex.create(2), Complex.create(-3)]]);
            const validation = argValidation({ size: [Complex.create(1), Complex.create(2)], class: AST.nodeIdentifier('double'), functions: [AST.nodeIdentifier('mustBePositive')] });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: value }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).toThrow("arguments block validation failed for 'x': mustBePositive.");
        });

        it('Should validate text values with mustBeMember.', () => {
            const allowed = new MultiArray([1, 2], [[new CharString('red', "'"), new CharString('blue', "'")]], true);
            const validation = argValidation({
                class: AST.nodeIdentifier('char'),
                functions: [AST.nodeIndexExpr(AST.nodeIdentifier('mustBeMember'), AST.nodeList([AST.nodeIdentifier('x'), allowed]))],
            });
            const callbacks = (value: NodeInput) => ({
                resolveEntry: () => ({ node: value }),
                evaluate: (expr: NodeExpr): NodeInput => (expr.type === 'IDENT' ? value : expr),
                throwEvalError,
                throwSyntaxError,
            });

            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(new CharString('red', "'")))).not.toThrow();
            expect(() => FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), callbacks(new CharString('green', "'")))).toThrow(
                "arguments block validation failed for 'x': mustBeMember.",
            );
        });

        it('Should validate file and folder paths through host callbacks.', () => {
            const callbacks = (value: NodeInput) => ({
                resolveEntry: () => ({ node: value }),
                evaluate: (expr: NodeExpr): NodeInput => expr,
                fileExists: (pathName: string): boolean => pathName === 'data/sample.m',
                folderExists: (pathName: string): boolean => pathName === 'src' || pathName === 'doc',
                throwEvalError,
                throwSyntaxError,
            });
            const fileValidation = argValidation({ functions: [AST.nodeIdentifier('mustBeFile')] });
            const folderValidation = argValidation({ functions: [AST.nodeIdentifier('mustBeFolder')] });

            expect(() => FunctionArguments.validateArgumentValidation(fileValidation, new Map<string, number>(), callbacks(new CharString('data/sample.m', '"')))).not.toThrow();
            expect(() =>
                FunctionArguments.validateArgumentValidation(
                    folderValidation,
                    new Map<string, number>(),
                    callbacks(new MultiArray([1, 2], [[new CharString('src', '"'), new CharString('doc', '"')]])),
                ),
            ).not.toThrow();
            expect(() =>
                FunctionArguments.validateArgumentValidation(
                    fileValidation,
                    new Map<string, number>(),
                    callbacks(new MultiArray([1, 2], [[new CharString('a.m', '"'), new CharString('b.m', '"')]])),
                ),
            ).toThrow("arguments block validation failed for 'x': mustBeFile.");
            expect(() => FunctionArguments.validateArgumentValidation(fileValidation, new Map<string, number>(), callbacks(new CharString('missing.m', '"')))).toThrow(
                "arguments block validation failed for 'x': mustBeFile.",
            );
            expect(() => FunctionArguments.validateArgumentValidation(folderValidation, new Map<string, number>(), callbacks(new CharString('missing', '"')))).toThrow(
                "arguments block validation failed for 'x': mustBeFolder.",
            );
            expect(() =>
                FunctionArguments.validateArgumentValidation(folderValidation, new Map<string, number>(), {
                    ...callbacks(new CharString('src', '"')),
                    folderExists: undefined,
                }),
            ).toThrow("arguments block validation failed for 'x': mustBeFolder.");
        });

        it('Should reject implicit custom validator calls for non-expression values.', () => {
            const validation = argValidation({ functions: [AST.nodeIdentifier('mustBeCustom')] });

            expect(() =>
                FunctionArguments.validateArgumentValidation(validation, new Map<string, number>(), {
                    resolveEntry: () => ({ node: AST.nodeReturn() }),
                    evaluate: (expr: NodeExpr): NodeInput => expr,
                    throwEvalError,
                    throwSyntaxError,
                }),
            ).toThrow("arguments block validation failed for 'x': validator input is not an expression.");
        });

        it('Should split positional and name-value call arguments.', () => {
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Color'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'opts'], ['y'], [options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('col'), Complex.create(2)], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(1);
            expect([...result.named.keys()]).toEqual(['Color']);
        });

        it('Should keep assignment expressions positional when no name-value declarations exist.', () => {
            const func = functionDefinition(['x'], ['y'], []);
            const assignment = AST.nodeOperation('=', AST.nodeIdentifier('x'), Complex.create(2));
            const result = FunctionArguments.splitCallNameValueArguments(func, [assignment], throwEvalError, throwSyntaxError);

            expect(result.positional).toEqual([assignment]);
            expect(result.named.size).toBe(0);
        });

        it('Should keep undeclared strings positional while optional positional parameters remain.', () => {
            const optional = argValidation({ name: AST.nodeIdentifier('label'), default: new CharString('default') });
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'label', 'opts'], ['y'], [optional, options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('hello')], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(2);
            expect(result.positional[1]).toBeInstanceOf(CharString);
            expect(result.named.size).toBe(0);
        });

        it('Should classify declared strings as name-value arguments after optional positional parameters.', () => {
            const optional = argValidation({ name: AST.nodeIdentifier('label'), default: new CharString('default') });
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'label', 'opts'], ['y'], [optional, options]);
            const result = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('Scale'), Complex.create(2)], throwEvalError, throwSyntaxError);

            expect(result.positional).toHaveLength(1);
            expect([...result.named.keys()]).toEqual(['Scale']);
        });

        it('Should keep declared strings positional until required parameters are satisfied.', () => {
            const required = argValidation({ name: AST.nodeIdentifier('label') });
            const options = argValidation({ name: AST.nodeIndirectRef(AST.nodeIdentifier('opts'), 'Scale'), default: Complex.create(1) });
            const func = functionDefinition(['x', 'label', 'opts'], ['y'], [required, options]);
            const labelOnly = FunctionArguments.splitCallNameValueArguments(func, [Complex.create(1), new CharString('Scale')], throwEvalError, throwSyntaxError);
            const labelThenNamed = FunctionArguments.splitCallNameValueArguments(
                func,
                [Complex.create(1), new CharString('Scale'), new CharString('Scale'), Complex.create(3)],
                throwEvalError,
                throwSyntaxError,
            );

            expect(labelOnly.positional).toHaveLength(2);
            expect(labelOnly.named.size).toBe(0);
            expect(labelThenNamed.positional).toHaveLength(2);
            expect([...labelThenNamed.named.keys()]).toEqual(['Scale']);
        });

        it('Should compute output names requested for output arguments validation.', () => {
            const fixed = functionDefinition(['x'], ['a', 'b'], []);
            const variadicOnly = functionDefinition(['x'], ['varargout'], []);
            const mixed = functionDefinition(['x'], ['a', 'varargout'], []);

            expect(FunctionArguments.outputNamesToValidate(fixed, 1)).toEqual(new Set(['a']));
            expect(FunctionArguments.outputNamesToValidate(fixed, 2)).toEqual(new Set(['a', 'b']));
            expect(FunctionArguments.outputNamesToValidate(variadicOnly, 3)).toBeUndefined();
            expect(FunctionArguments.outputNamesToValidate(mixed, 3)).toEqual(new Set(['a']));
        });
    });
});
