/// <reference types="jest" />
import { CharString } from '../../src/CharString';
import { Interpreter } from '../../src/Interpreter';
import { MultiArray } from '../../src/MultiArray';
import { Complex, type ComplexType } from '../../src/Complex';
import { executeList } from '../../src/ParserTestUtils';

/**
 * Extract a JavaScript number from a complex scalar in conformance fixtures.
 *
 * @param value Runtime value expected to be a numeric scalar.
 * @returns Real part as a native number.
 */
const realScalar = (value: unknown): number => {
    if (!Complex.isInstanceOf(value)) {
        throw new TypeError('Expected complex scalar.');
    }
    return Complex.realToNumber(value);
};

describe('Parser conformance fixtures.', () => {
    it('Should follow Octave matrix spacing rules for binary signs and signed elements.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'binaryMinus = [1 - 1];',
            'signedMinus = [1 -1];',
            'binaryPlusComplex = [1 + 2i, 3];',
            'signedPlusComplex = [1 +2i, 3];',
            'cellBinary = {1 - 1, 1 + 2i};',
            'cellSigned = {1 -1, 1 +2i};',
            'continuedSeparator = [1 ...',
            ' 2, 3];',
            'continuedBinary = [1 ...',
            ' + 2, 3];',
            'continuedSigned = [1 ...',
            ' +2, 3];',
            'commentedSeparator = [1, ... % trailing comment',
            ' 2, 3];',
            'commentedBinary = [1 ... # trailing comment',
            ' + 2, 3];',
            'commentedCell = {1, ... % trailing comment',
            ' 2, 3};',
            'blockCommentedSeparator = [1,',
            '%{',
            'ignored',
            '%}',
            '2, 3];',
            'blockCommentedRow = [1',
            '%{',
            'ignored',
            '%}',
            '2];',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'binaryMinus=[0]\nsignedMinus=[1,-1]\nbinaryPlusComplex=[1+2i,3]\nsignedPlusComplex=[1,2i,3]\ncellBinary={0,1+2i}\ncellSigned={1,-1,1,2i}\ncontinuedSeparator=[1,2,3]\ncontinuedBinary=[3,3]\ncontinuedSigned=[1,2,3]\ncommentedSeparator=[1,2,3]\ncommentedBinary=[3,3]\ncommentedCell={1,2,3}\nblockCommentedSeparator=[1,2,3]\nblockCommentedRow=[1;\n2]\n',
        );
    });

    it('Should keep spaced binary operators inside matrix and cell literals as expressions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'binaryProduct = [1 * 2, 3 / 2, 4 \\ 8];',
            'binaryPower = [2 ^ 3, 2 .^ 3];',
            'binaryColon = [1 : 3];',
            'binaryEq = [1 == 1, 1 ~= 2];',
            'binaryRel = [1 < 2, 2 <= 2, 3 > 2, 3 >= 4];',
            'binaryLogic = [true & false, true | false];',
            'C = {1, 2};',
            'cellIndexed = [C{1} + C{2}, C{1} < C{2}, C{1} == 1];',
            'cellLiteral = {C{1} + C{2}, C{1} <= C{2}, C{1} ~= C{2}};',
            'binaryProduct; binaryPower; binaryColon; binaryEq; binaryRel; binaryLogic; cellIndexed; cellLiteral',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'binaryProduct=[2,1.5,2]\nbinaryPower=[8,8]\nbinaryColon=[1,2,3]\nbinaryEq=[true,true]\nbinaryRel=[true,true,true,false]\nbinaryLogic=[false,true]\nC={1,2}\ncellIndexed=[3,true,true]\ncellLiteral={3,true,true}\n[2,1.5,2]\n[8,8]\n[1,2,3]\n[true,true]\n[true,true,true,false]\n[false,true]\n[3,true,true]\n{3,true,true}\n',
        );
    });

    it('Should preserve continued binary and short-circuit expressions inside matrix and cell literals.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'operatorContinued = [1 * ...',
            ' 2, 3 == ...',
            ' 3, 1 < ...',
            ' 2];',
            'prefixContinued = [1 ...',
            ' * 2, 3 ...',
            ' == 3, 1 ...',
            ' < 2];',
            'commentContinued = [1 ... % trailing comment',
            ' * 2, 3 ... # trailing comment',
            ' == 3];',
            'shortCircuit = [false && missingAnd, true || missingOr];',
            'continuedShortCircuit = [false ...',
            ' && missingAnd, true ...',
            ' || missingOr];',
            'C = {1, 2};',
            'cellContinued = {C{1} ...',
            ' + C{2}, C{1} ...',
            ' < C{2}, false ...',
            ' && missingCell};',
            'operatorContinued; prefixContinued; commentContinued; shortCircuit; continuedShortCircuit; cellContinued',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'operatorContinued=[2,true,true]\nprefixContinued=[2,true,true]\ncommentContinued=[2,true]\nshortCircuit=[false,true]\ncontinuedShortCircuit=[false,true]\nC={1,2}\ncellContinued={3,true,false}\n[2,true,true]\n[2,true,true]\n[2,true]\n[false,true]\n[false,true]\n{3,true,false}\n',
        );
    });

    it('Should preserve relational operators and function forms across broadcasting, text, and complex values.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'scalarLess = 1 < 2;',
            'scalarLessEqual = le(2, 2);',
            'scalarGreater = gt(3, 2);',
            'scalarGreaterEqual = 3 >= 4;',
            'broadcastLess = [1, 2] < [2; 2; 0];',
            'broadcastEqual = eq([1, 2], [1; 3]);',
            'textEqual = "abc" == "abd";',
            'textNotEqual = ne("abc", "abd");',
            'textNumeric = "ABC" == [65, 66, 0];',
            'complexMagnitudeLess = (1 + 2i) < 2;',
            'complexMagnitudeGreater = gt(2, 1 + 2i);',
            'complexEqualMagnitudeAngle = (1 + 1i) < (-1 - 1i);',
            'complexFunctionLessEqual = le(1 + 2i, 1 + 2i);',
            'scalarLess; scalarLessEqual; scalarGreater; scalarGreaterEqual; broadcastLess; broadcastEqual; textEqual; textNotEqual; textNumeric; complexMagnitudeLess; complexMagnitudeGreater; complexEqualMagnitudeAngle; complexFunctionLessEqual',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'scalarLess=1<2\nscalarLessEqual=le(2,2)\nscalarGreater=gt(3,2)\nscalarGreaterEqual=3>=4\nbroadcastLess=[1,2]<[2;\n2;\n0]\nbroadcastEqual=eq([1,2],[1;\n3])\ntextEqual=(abc==abd)\ntextNotEqual=ne(abc,abd)\ntextNumeric=(ABC==[65,66,0])\ncomplexMagnitudeLess=1+2i<2\ncomplexMagnitudeGreater=gt(2,1+2i)\ncomplexEqualMagnitudeAngle=1+i<-1-i\ncomplexFunctionLessEqual=le(1+2i,1+2i)\nscalarLess\nscalarLessEqual\nscalarGreater\nscalarGreaterEqual\nbroadcastLess\nbroadcastEqual\ntextEqual\ntextNotEqual\ntextNumeric\ncomplexMagnitudeLess\ncomplexMagnitudeGreater\ncomplexEqualMagnitudeAngle\ncomplexFunctionLessEqual\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'scalarLess=true\nscalarLessEqual=true\nscalarGreater=true\nscalarGreaterEqual=false\nbroadcastLess=[true,false;\ntrue,false;\nfalse,false]\nbroadcastEqual=[true,false;\nfalse,false]\ntextEqual=[true,true,false]\ntextNotEqual=[false,false,true]\ntextNumeric=[true,true,false]\ncomplexMagnitudeLess=false\ncomplexMagnitudeGreater=false\ncomplexEqualMagnitudeAngle=false\ncomplexFunctionLessEqual=true\ntrue\ntrue\ntrue\nfalse\n[true,false;\ntrue,false;\nfalse,false]\n[true,false;\nfalse,false]\n[true,true,false]\n[false,false,true]\n[true,true,false]\nfalse\nfalse\nfalse\ntrue\n',
        );
    });

    it('Should preserve MATLAB handle-class relational operators and scalar expansion.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef RelationalHandle < handle',
            'end',
            'classdef OtherRelationalHandle < handle',
            'end',
            'p = RelationalHandle();',
            'q = RelationalHandle();',
            'alias = p;',
            'other = OtherRelationalHandle();',
            'handles = [p, q];',
            'same = (p == alias);',
            'different = (p ~= q);',
            'lessFirst = (p < q);',
            'lessRepeated = (p < q);',
            'greaterReverse = (q > p);',
            'lessOrEqualAlias = (p <= alias);',
            'greaterOrEqualAlias = ge(p, alias);',
            'arrayEqual = handles == p;',
            'arrayLess = handles < q;',
            'arrayGreaterEqual = handles >= p;',
            'differentClass = p == other;',
            'mixedClass = handles == 1;',
            'same; different; lessFirst; lessRepeated; greaterReverse; lessOrEqualAlias; greaterOrEqualAlias; arrayEqual; arrayLess; arrayGreaterEqual; differentClass; mixedClass',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'p=RelationalHandle object\nq=RelationalHandle object\nalias=RelationalHandle object\nother=OtherRelationalHandle object\nhandles=[RelationalHandle object,RelationalHandle object]\nsame=true\ndifferent=true\nlessFirst=true\nlessRepeated=true\ngreaterReverse=true\nlessOrEqualAlias=true\ngreaterOrEqualAlias=true\narrayEqual=[true,false]\narrayLess=[true,false]\narrayGreaterEqual=[true,true]\ndifferentClass=false\nmixedClass=[false,false]\ntrue\ntrue\ntrue\ntrue\ntrue\ntrue\ntrue\n[true,false]\n[true,false]\n[true,true]\nfalse\n[false,false]\n',
        );
    });

    it('Should dispatch functional operator calls to class overload methods.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef FunctionalOperatorProbe',
            '  methods',
            '    function y = lt(a,b)',
            '      y = false;',
            '    end',
            '    function y = eq(a,b)',
            '      y = true;',
            '    end',
            '    function y = plus(a,b)',
            '      y = 42;',
            '    end',
            '    function y = not(a)',
            '      y = true;',
            '    end',
            '  end',
            'end',
            'a = FunctionalOperatorProbe();',
            'b = FunctionalOperatorProbe();',
            'fLt = @lt;',
            'fPlus = @plus;',
            'symbolicLt = a < b;',
            'functionalLt = lt(a,b);',
            'handleLt = fLt(a,b);',
            'symbolicEq = a == b;',
            'functionalEq = eq(a,b);',
            'symbolicPlus = a + b;',
            'functionalPlus = plus(a,b);',
            'handlePlus = fPlus(a,b);',
            'functionalNot = not(a);',
            'numericLt = lt(1, 2);',
            'numericPlus = plus(1, 2, 3);',
            'symbolicLt; functionalLt; handleLt; symbolicEq; functionalEq; symbolicPlus; functionalPlus; handlePlus; functionalNot; numericLt; numericPlus',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=FunctionalOperatorProbe object\nb=FunctionalOperatorProbe object\nfLt=@lt\nfPlus=@plus\nsymbolicLt=false\nfunctionalLt=false\nhandleLt=false\nsymbolicEq=true\nfunctionalEq=true\nsymbolicPlus=42\nfunctionalPlus=42\nhandlePlus=42\nfunctionalNot=true\nnumericLt=true\nnumericPlus=6\nfalse\nfalse\nfalse\ntrue\ntrue\n42\n42\n42\ntrue\ntrue\n6\n',
        );
    });

    it('Should dispatch colon and right-operand functional operators to class overload methods.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ColonOperatorProbe',
            '  methods',
            '    function y = colon(varargin)',
            '      y = nargin * 100;',
            '    end',
            '  end',
            'end',
            'classdef RightOperandOperatorProbe',
            '  methods',
            '    function y = plus(a,b)',
            '      y = 77;',
            '    end',
            '  end',
            'end',
            'a = ColonOperatorProbe();',
            'b = ColonOperatorProbe();',
            'c = ColonOperatorProbe();',
            'p = RightOperandOperatorProbe();',
            'fColon = @colon;',
            'fPlus = @plus;',
            'symbolicColon2 = a:b;',
            'symbolicColon3 = a:b:c;',
            'functionalColon2 = colon(a,b);',
            'functionalColon3 = colon(a,b,c);',
            'handleColon3 = fColon(a,b,c);',
            'rightFunctionalPlus = plus(1,p);',
            'rightHandlePlus = fPlus(1,p);',
            'nativeColon = colon(1,3);',
            'global opEvalCount;',
            'opEvalCount = 0;',
            'function y = bumpOperatorArgument(v)',
            '  global opEvalCount;',
            '  opEvalCount = opEvalCount + 1;',
            '  y = v;',
            'end',
            'nativePlusOnce = plus(bumpOperatorArgument(1), bumpOperatorArgument(2));',
            'nativeColonOnce = colon(bumpOperatorArgument(1), bumpOperatorArgument(3));',
            'symbolicColon2; symbolicColon3; functionalColon2; functionalColon3; handleColon3; rightFunctionalPlus; rightHandlePlus; nativeColon; opEvalCount; nativePlusOnce; nativeColonOnce',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=ColonOperatorProbe object\nb=ColonOperatorProbe object\nc=ColonOperatorProbe object\np=RightOperandOperatorProbe object\nfColon=@colon\nfPlus=@plus\nsymbolicColon2=200\nsymbolicColon3=300\nfunctionalColon2=200\nfunctionalColon3=300\nhandleColon3=300\nrightFunctionalPlus=77\nrightHandlePlus=77\nnativeColon=[1,2,3]\nopEvalCount=0\nnativePlusOnce=3\nnativeColonOnce=[1,2,3]\n200\n300\n200\n300\n300\n77\n77\n[1,2,3]\n4\n3\n[1,2,3]\n',
        );
    });

    it('Should dispatch object concatenation literals and functions to class overload methods.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ConcatenationOperatorProbe',
            '  methods',
            '    function y = cat(varargin)',
            '      y = 21;',
            '    end',
            '    function y = horzcat(varargin)',
            '      y = 42;',
            '    end',
            '    function y = vertcat(varargin)',
            '      y = 84;',
            '    end',
            '  end',
            'end',
            'classdef PlainConcatenationProbe',
            'end',
            'a = ConcatenationOperatorProbe();',
            'b = ConcatenationOperatorProbe();',
            'p = PlainConcatenationProbe();',
            'q = PlainConcatenationProbe();',
            'fCat = @cat;',
            'fHorz = @horzcat;',
            'fVert = @vertcat;',
            'functionalCat = cat(1,a,b);',
            'pagedCat = cat(3,a,b);',
            'handleCat = fCat(1,a,b);',
            'literalHorz = [a,b];',
            'literalVert = [a;b];',
            'functionalHorz = horzcat(a,b);',
            'functionalVert = vertcat(a,b);',
            'handleHorz = fHorz(a,b);',
            'handleVert = fVert(a,b);',
            'nativeCat = cat(1,p,q);',
            'nativeHorz = [p,q];',
            'nativeVert = [p;q];',
            'numericCat = cat(2,[1;2],[3;4]);',
            'functionalCat; pagedCat; handleCat; literalHorz; literalVert; functionalHorz; functionalVert; handleHorz; handleVert; nativeCat; nativeHorz; nativeVert; numericCat',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=ConcatenationOperatorProbe object\nb=ConcatenationOperatorProbe object\np=PlainConcatenationProbe object\nq=PlainConcatenationProbe object\nfCat=@cat\nfHorz=@horzcat\nfVert=@vertcat\nfunctionalCat=21\npagedCat=21\nhandleCat=21\nliteralHorz=42\nliteralVert=84\nfunctionalHorz=42\nfunctionalVert=84\nhandleHorz=42\nhandleVert=84\nnativeCat=[PlainConcatenationProbe object;\nPlainConcatenationProbe object]\nnativeHorz=[PlainConcatenationProbe object,PlainConcatenationProbe object]\nnativeVert=[PlainConcatenationProbe object;\nPlainConcatenationProbe object]\nnumericCat=[1,3;\n2,4]\n21\n21\n21\n42\n84\n42\n84\n42\n84\n[PlainConcatenationProbe object;\nPlainConcatenationProbe object]\n[PlainConcatenationProbe object,PlainConcatenationProbe object]\n[PlainConcatenationProbe object;\nPlainConcatenationProbe object]\n[1,3;\n2,4]\n',
        );
        expect(() => interpreter.Execute('cat(a,b)')).toThrow(/Invalid call to cat|undefined/);
    });

    it('Should keep builtin operator calls as native bypasses for class overloads.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef BuiltinOperatorBypassAllProbe',
            '  methods',
            '    function y = colon(varargin), y = 300; end',
            '    function y = horzcat(varargin), y = 400; end',
            '    function y = vertcat(varargin), y = 500; end',
            '    function y = cat(varargin), y = 600; end',
            '  end',
            'end',
            'a = BuiltinOperatorBypassAllProbe();',
            'b = BuiltinOperatorBypassAllProbe();',
            'normalColon = colon(a,b);',
            'normalHorz = horzcat(a,b);',
            'normalVert = vertcat(a,b);',
            'normalCat = cat(1,a,b);',
            'nativeColon = 0;',
            "try, nativeColon = builtin('colon', a, b); catch, nativeColon = -1; end",
            "nativeHorz = builtin('horzcat', a, b);",
            "nativeVert = builtin('vertcat', a, b);",
            "nativeCat = builtin('cat', 1, a, b);",
            'nativeHorzClass = class(nativeHorz); nativeHorzSize = size(nativeHorz);',
            'nativeVertClass = class(nativeVert); nativeVertSize = size(nativeVert);',
            'nativeCatClass = class(nativeCat); nativeCatSize = size(nativeCat);',
            'normalColon; normalHorz; normalVert; normalCat; nativeColon; nativeHorzClass; nativeHorzSize; nativeVertClass; nativeVertSize; nativeCatClass; nativeCatSize',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=BuiltinOperatorBypassAllProbe object\nb=BuiltinOperatorBypassAllProbe object\nnormalColon=300\nnormalHorz=400\nnormalVert=500\nnormalCat=600\nnativeColon=0\n-1\nnativeHorz=[BuiltinOperatorBypassAllProbe object,BuiltinOperatorBypassAllProbe object]\nnativeVert=[BuiltinOperatorBypassAllProbe object;\nBuiltinOperatorBypassAllProbe object]\nnativeCat=[BuiltinOperatorBypassAllProbe object;\nBuiltinOperatorBypassAllProbe object]\nnativeHorzClass=BuiltinOperatorBypassAllProbe\nnativeHorzSize=[1,2]\nnativeVertClass=BuiltinOperatorBypassAllProbe\nnativeVertSize=[2,1]\nnativeCatClass=BuiltinOperatorBypassAllProbe\nnativeCatSize=[2,1]\n300\n400\n500\n600\n-1\nBuiltinOperatorBypassAllProbe\n[1,2]\nBuiltinOperatorBypassAllProbe\n[2,1]\nBuiltinOperatorBypassAllProbe\n[2,1]\n',
        );
    });

    it('Should preserve class method dispatch through str2func, feval, and nthargout.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef IndirectResolutionProbe',
            '  methods',
            '    function y = size(obj), y = [7, 8]; end',
            '    function y = isempty(obj), y = true; end',
            '    function y = plus(a, b), y = 77; end',
            '    function [a, b] = sort(obj), a = 91; b = 92; end',
            '  end',
            'end',
            'obj = IndirectResolutionProbe();',
            "fSize = str2func('size');",
            "fEmpty = str2func('isempty');",
            "fPlus = str2func('plus');",
            "fSort = str2func('sort');",
            "a = feval('size', obj);",
            'b = fSize(obj);',
            'c = feval(fEmpty, obj);',
            'd = fPlus(obj, obj);',
            '[e, f] = fSort(obj);',
            'gh = nthargout([1, 2], fSort, obj);',
            'g = gh{1}; h = gh{2};',
            'a; b; c; d; e; f; gh; g; h',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=IndirectResolutionProbe object\nfSize=@size\nfEmpty=@isempty\nfPlus=@plus\nfSort=@sort\na=[7,8]\nb=[7,8]\nc=true\nd=77\ne=91\nf=92\ngh={91,92}\ng=91\nh=92\n[7,8]\n[7,8]\ntrue\n77\n91\n92\n{91,92}\n91\n92\n',
        );
        expect(() => interpreter.Execute('[g, h] = nthargout([1, 2], fSort, obj)')).toThrow('element number 2 undefined in return list');
    });

    it('Should require block comment delimiters to be alone on their physical line.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute(['x = 1;', '%{', 'ignored = 2;', '%}', 'y = 3;'].join('\n')))).toBe('x=1\ny=3\n');
        expect(() => interpreter.Execute(['x = 1; %{', 'ignored', '%}', 'y = 2;'].join('\n'))).toThrow("'ignored' undefined.");
        expect(() => interpreter.Execute(['A = [1, %{', 'ignored', '%}', '2, 3];'].join('\n'))).toThrow("'ignored' undefined.");
    });

    it('Should keep continuations inside parentheses, indexing, and calls as expressions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'paren = (1',
            ' + 2);',
            'continuedParen = (1 ...',
            ' + 2);',
            'A = [10, 20, 30];',
            'parenIndex = A(1 ...',
            ' + 1);',
            'commentedIndex = A(1 + ... % trailing comment',
            ' 1);',
            'C = {10, 20, 30};',
            'cellIndex = C{1 ...',
            ' + 1};',
            'f = @(x, y) x + y;',
            'callValue = f(1 ...',
            ' + 2, 3);',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'paren=3\ncontinuedParen=3\nA=[10,20,30]\nparenIndex=20\ncommentedIndex=20\nC={10,20,30}\ncellIndex=20\nf=@(x,y) x+y\ncallValue=6\n',
        );
    });

    it('Should keep eval, evalc, and evalin compatible across catch code, capture, and caller/base workspaces.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'x = 1;',
            "y = eval('x + 1');",
            "z = eval('missingEvalValue', '41');",
            "captured = evalc('shown = 5; shown + 1;');",
            'function y = evalCallerProbe(x)',
            "  y = evalin('caller', 'x + 2');",
            'end',
            'callerValue = evalCallerProbe(10);',
            'function y = evalBaseCatchProbe()',
            "  evalin('base', 'missingBaseEval + 1', 'baseFallback = 44');",
            '  y = 1;',
            'end',
            'baseResult = evalBaseCatchProbe();',
            'y; z; captured; callerValue; baseResult; baseFallback',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=1\ny=2\nz=41\ncaptured=shown=5\n6\n\ncallerValue=3\nbaseResult=1\n2\n41\nshown=5\n6\n\n3\n1\n44\n');
        expect(() => interpreter.Execute("eval('missingPrimary', 'missingCatch')")).toThrow("'missingCatch' undefined.");
        expect(() =>
            interpreter.Execute(
                [
                    'function y = evalCallerLocalFunctionProbe()',
                    '  y = helper();',
                    '  inner();',
                    '  function z = helper()',
                    '    z = 9;',
                    '  end',
                    '  function z = inner()',
                    "    z = evalin('caller', 'helper()');",
                    '  end',
                    'end',
                    'evalCallerLocalFunctionProbe();',
                ].join('\n'),
            ),
        ).toThrow("'helper' undefined.");
        interpreter.Execute('function clearCallerConformance(), evalin("caller", "clear evalinClearTarget"); end');
        expect(interpreter.Unparse(interpreter.Execute('evalinClearTarget = 99; clearCallerConformance(); exist("evalinClearTarget", "var")'))).toBe('evalinClearTarget=99\n0\n');
        interpreter.Execute(
            [
                'function [xCount, helperCount] = evalinWhoConformance()',
                '  x = 1;',
                '  [xCount, helperCount] = inner();',
                '  function [a, b] = inner()',
                "    a = evalin('caller', 'numel(who(''x''))');",
                "    b = evalin('caller', 'numel(who(''helper''))');",
                '  end',
                '  function z = helper()',
                '    z = 2;',
                '  end',
                'end',
            ].join('\n'),
        );
        expect(interpreter.Unparse(interpreter.Execute('[xCount, helperCount] = evalinWhoConformance(); [xCount, helperCount]'))).toBe('xCount=1\nhelperCount=0\n[1,0]\n');
        interpreter.Execute(
            [
                'function setEvalinGlobalConformance()',
                "  evalin('caller', 'global evalinGlobalConformance; evalinGlobalConformance = 123');",
                'end',
                'function [value, flag] = evalinGlobalConformanceProbe()',
                '  setEvalinGlobalConformance();',
                '  value = evalinGlobalConformance;',
                "  info = whos('evalinGlobalConformance');",
                '  flag = info.global;',
                'end',
            ].join('\n'),
        );
        expect(interpreter.Unparse(interpreter.Execute('[value, flag] = evalinGlobalConformanceProbe(); [value, flag]'))).toBe('value=123\nflag=true\n[123,true]\n');
        interpreter.Execute(['function y = evalcStaticConformance()', '  declared = [];', '  evalc("declared = 9");', '  y = declared;', '  function inner()', '  end', 'end'].join('\n'));
        expect(interpreter.Unparse(interpreter.Execute('evalcStaticConformance()'))).toBe('9\n');
        expect(() => interpreter.Execute('anonEvalcDynamic = @() evalc("createdByAnonEvalc = 1"); anonEvalcDynamic()')).toThrow(
            "Attempt to add variable 'createdByAnonEvalc' to a static workspace.",
        );
    });

    it('Should keep source caller compatible with real caller workspaces.', () => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                sourceCallerScript: 'sourceCallerValue = sourceCallerSeed + 3;',
                sourceCallerCommandScript: 'sourceCallerCommandValue = sourceCallerCommandSeed + 4;',
            },
        });
        interpreter.Execute(
            [
                'function [a, b] = sourceCallerConformance()',
                '  sourceCallerSeed = 20;',
                '  sourceCallerCommandSeed = 30;',
                '  sourceCallerConformanceHelper();',
                '  a = sourceCallerValue;',
                '  b = sourceCallerCommandValue;',
                'end',
                'function sourceCallerConformanceHelper()',
                '  source("sourceCallerScript", "caller");',
                '  source sourceCallerCommandScript caller',
                'end',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('[a, b] = sourceCallerConformance(); [a, b]'))).toBe('a=23\nb=34\n[23,34]\n');
        expect(interpreter.Unparse(interpreter.Execute('exist("sourceCallerValue", "var") + exist("sourceCallerCommandValue", "var")'))).toBe('0\n');
    });

    it('Should preserve diagnostic state across warnings, promoted warnings, catch, lasterr, lasterror, and rethrow.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                "warning('mathjslab:confWarn', 'visible warning');",
                '[wm, wi] = lastwarn();',
                "previous = warning('error', 'mathjslab:confError');",
                "try, warning('mathjslab:confError', 'promoted warning'); catch ME, caughtMessage = ME.message; caughtId = ME.identifier; end",
                'warning(previous);',
                "try, error('mathjslab:confError', 'primary failure');",
                'catch ME',
                '  caught = lasterror();',
                '  [lm, li] = lasterr();',
                '  try, rethrow(ME); catch AGAIN, rethrownMessage = AGAIN.message; rethrownId = AGAIN.identifier; end',
                'end',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('wm; wi; caughtMessage; caughtId; caught.message; caught.identifier; lm; li; rethrownMessage; rethrownId'))).toBe(
            'visible warning\nmathjslab:confWarn\npromoted warning\nmathjslab:confError\nprimary failure\nmathjslab:confError\nprimary failure\nmathjslab:confError\nprimary failure\nmathjslab:confError\n',
        );
    });

    it('Should validate assertions, unique strings, and common validateattributes constraints.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'assert(true);',
                'assert([1, 2]);',
                'assert([1, 2; 3, 4], [1, 2; 3, 4]);',
                "assert('abc', 'abc');",
                'assert("abc", "abc");',
                'assert([1, 2.001], [1, 2], 0.01);',
                'assert([10.1, 20.2], [10, 20], -0.02);',
                "choice1 = validatestring('on', {'on', 'off'});",
                "choice2 = validatestring('Ye', {'yes', 'no'});",
                'choice3 = validatestring("fo", ["foo", "bar"]);',
                "choice4 = validatestring('on', {'on', 'one'});",
                "validateattributes(5, {'double'}, {'scalar', 'positive', 'integer', 'finite', 'real'}, 'fixture', 'value');",
                "validateattributes(7, {'integer'}, {'scalar'}, 'fixture', 'integerValue');",
                "validateattributes(true, {'logical'}, {'scalar'}, 'fixture', 'logicalValue');",
                "validateattributes('abc', {'char'}, {'row'}, 'fixture', 'charValue');",
                'validateattributes("abc", {"string"}, {"scalar"}, "fixture", "stringValue");',
                "validateattributes({'a', 'b'}, {'cell'}, {'row'}, 'fixture', 'cellValue');",
                "validateattributes(struct('a', 1), {'struct'}, {'scalar'}, 'fixture', 'structValue');",
                "validateattributes(@sin, {'function_handle'}, {'scalar'}, 'fixture', 'handleValue');",
                "validateattributes([1, 2], {'numeric'}, {'row', 'nonempty', 'finite', 'real'}, 'fixture', 'rowValue');",
                "validateattributes([1, 2; 3, 4], {'numeric'}, {'size', [2, 2], 'numel', 4, 'nrows', 2, 'ncols', 2, 'ndims', 2, '>=', 1, '<=', 4}, 'fixture', 'matrixValue');",
                "validateattributes([1, 2; 3, 4], {'numeric'}, {'size', [2, NaN], 'numel', [3, 4], 'numrows', 2, 'numcols', 2}, 'fixture', 'matrixAliasValue');",
                "validateattributes([1, 2; 3, 4], {'numeric'}, {'3d'}, 'fixture', 'matrixThreeDValue');",
                "validateattributes('abc', {'char'}, {'scalartext'}, 'fixture', 'scalarTextValue');",
                'validateattributes("abc", {"string"}, {"scalartext"}, "fixture", "stringScalarTextValue");',
                'cubeValue = cat(3, [1, 2; 3, 4], [5, 6; 7, 8]);',
                "validateattributes(cubeValue, {'numeric'}, {'3d', 'size', [2, 2, 2], 'ndims', 3}, 'fixture', 'cubeValue');",
                "validateattributes([1, 0; 0, 2], {'numeric'}, {'square', 'diagonal', 'diag'}, 'fixture', 'diagonalValue');",
                "validateattributes([2, 4, 6], {'numeric'}, {'even', 'increasing', 'nondecreasing'}, 'fixture', 'evenValue');",
                "validateattributes([5, 3, 1], {'numeric'}, {'odd', 'decreasing', 'nonincreasing'}, 'fixture', 'oddValue');",
                "validateattributes([1, 5, 8, 2; 9, 6, 9, 4], {'numeric'}, {'increasing', 'nondecreasing'}, 'fixture', 'columnIncreasingValue');",
                "validateattributes([9, 6, 9, 4; 1, 5, 8, 2], {'numeric'}, {'decreasing', 'nonincreasing'}, 'fixture', 'columnDecreasingValue');",
                "validateattributes([1, 0, 1, 0], {'numeric'}, {'binary'}, 'fixture', 'binaryValue');",
                "try, assert(false, 'mathjslab:assert', 'bad %d', 7); catch ME, assertMessage = ME.message; assertId = ME.identifier; end",
                "try, assert([1, 2], [1, 3], 'mathjslab:assertCompare', 'expected %d', 3); catch ME, compareMessage = ME.message; compareId = ME.identifier; end",
                "try, assert([1, 2.2], [1, 2], 0.01, 'mathjslab:assertTolerance', 'outside tolerance'); catch ME, toleranceMessage = ME.message; toleranceId = ME.identifier; end",
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('choice1; choice2; choice3; choice4; assertMessage; assertId; compareMessage; compareId; toleranceMessage; toleranceId'))).toBe(
            'on\nyes\nfoo\non\nbad 7\nmathjslab:assert\nexpected 3\nmathjslab:assertCompare\noutside tolerance\nmathjslab:assertTolerance\n',
        );
        expect(() => interpreter.Execute("assert(false, 'plain assertion')")).toThrow('plain assertion');
        expect(() => interpreter.Execute('assert([1, 2], [1, 3])')).toThrow('assertion failed: observed value does not match expected value.');
        expect(() => interpreter.Execute("assert('left', 'right', 'text mismatch')")).toThrow('text mismatch');
        expect(() => interpreter.Execute('assert([1, 2.2], [1, 2], 0.01)')).toThrow('assertion failed: observed value does not match expected value.');
        expect(() => interpreter.Execute("assert([1, 2], [1, 2], {'bad tolerance'})")).toThrow("attribute 'assert tolerance' parameter must be a real numeric scalar.");
        expect(() => interpreter.Execute("validatestring('o', {'on', 'off'})")).toThrow("validatestring: ambiguous string 'o'.");
        expect(() => interpreter.Execute("validatestring('bad', {'on', 'off'})")).toThrow('validatestring: expected one of: on, off.');
        expect(() => interpreter.Execute("validatestring('bad', {'on', 'off'}, 'plotmode', 'mode', 2)")).toThrow(
            "validatestring: argument 2 'mode' for function 'plotmode' expected one of: on, off.",
        );
        expect(() => interpreter.Execute("validatestring('o', {'on', 'off'}, 'plotmode', 'mode')")).toThrow("validatestring: variable 'mode' for function 'plotmode' ambiguous string 'o'.");
        expect(() => interpreter.Execute("validateattributes(-1, {'double'}, {'positive'}, 'fixture', 'value')")).toThrow('validateattributes: value must be positive.');
        expect(() => interpreter.Execute("validateattributes('x', {'double'}, {'scalar'}, 'fixture', 'value')")).toThrow('validateattributes: value must be one of: double.');
        expect(() => interpreter.Execute("validateattributes('x', {'double'}, {'scalar'}, 'fixture')")).toThrow("validateattributes: input for function 'fixture' must be one of: double.");
        expect(() => interpreter.Execute("validateattributes(-1, {'double'}, {'positive'}, 'fixture', 'value', 2)")).toThrow(
            "validateattributes: argument 2 'value' for function 'fixture' must be positive.",
        );
        expect(() => interpreter.Execute("validateattributes(-1, {'numeric'}, {'positive'}, 2)")).toThrow('validateattributes: argument 2 must be positive.');
        expect(() => interpreter.Execute("validateattributes([1, 2; 3, 4], {'numeric'}, {'size', [1, 4]}, 'fixture', 'matrixValue')")).toThrow(
            'validateattributes: matrixValue must have size 1x4.',
        );
        expect(() => interpreter.Execute("validateattributes([1, 2; 3, 4], {'numeric'}, {'numel', [2, 3]}, 'fixture', 'matrixValue')")).toThrow(
            'validateattributes: matrixValue must have 2 or 3 elements.',
        );
        expect(() => interpreter.Execute("validateattributes([1, 2; 3, 4], {'numeric'}, {'>', 1}, 'fixture', 'matrixValue')")).toThrow('validateattributes: matrixValue must be > 1.');
        expect(() => interpreter.Execute("validateattributes([1, 1; 0, 2], {'numeric'}, {'diag'}, 'fixture', 'matrixValue')")).toThrow('validateattributes: matrixValue must be diag.');
        expect(() => interpreter.Execute("validateattributes([1, 1; 0, 2], {'numeric'}, {'diagonal'}, 'fixture', 'matrixValue')")).toThrow(
            'validateattributes: matrixValue must be diagonal.',
        );
        expect(() => interpreter.Execute("validateattributes([1; 2; 2], {'numeric'}, {'increasing'}, 'fixture', 'orderedValue')")).toThrow(
            'validateattributes: orderedValue must be increasing.',
        );
        expect(() => interpreter.Execute("validateattributes([1, 2; 1, 3], {'numeric'}, {'increasing'}, 'fixture', 'columnValue')")).toThrow(
            'validateattributes: columnValue must be increasing.',
        );
        expect(() => interpreter.Execute("validateattributes({'abc'}, {'cell'}, {'scalartext'}, 'fixture', 'textValue')")).toThrow('validateattributes: textValue must be scalartext.');
        expect(() => interpreter.Execute("validateattributes([2, 3], {'numeric'}, {'even'}, 'fixture', 'evenValue')")).toThrow('validateattributes: evenValue must be even.');
        expect(() => interpreter.Execute("validateattributes([0, 2], {'numeric'}, {'binary'}, 'fixture', 'binaryValue')")).toThrow('validateattributes: binaryValue must be binary.');
    });

    it('Should expose public mustBe validator functions with arguments-compatible semantics.', () => {
        const interpreter = Interpreter.Create({
            fileExists: (path) => path === 'data/sample.m',
            folderExists: (path) => path === 'src' || path === 'doc',
        });
        interpreter.Execute(
            [
                'mustBeNumeric([1, 2]);',
                'mustBeFloat([1, 2]);',
                'mustBeNumericOrLogical([true, false]);',
                "mustBeText({'a', 'b'});",
                'mustBeTextScalar("abc");',
                "mustBeNonzeroLengthText({'a', 'b'});",
                "mustBeValidVariableName({'alpha', 'beta_2'});",
                'mustBeScalar(3);',
                'mustBeScalarOrEmpty([]);',
                'mustBeMatrix([1, 2; 3, 4]);',
                'mustBeSquare([1, 2; 3, 4]);',
                'mustBeVector([1, 2, 3]);',
                'mustBeRow([1, 2, 3]);',
                'mustBeColumn([1; 2; 3]);',
                'mustBeNonempty(1);',
                'mustBePositive([1, 2]);',
                'mustBeNonnegative([0, 1]);',
                'mustBeNegative([-1, -2]);',
                'mustBeNonpositive([-1, 0]);',
                'mustBeNonzero([1, 2]);',
                'mustBeNonNan([1, 2]);',
                "mustBeNonmissing({'a', 'b'});",
                'mustBeNonsparse([1, 2]);',
                'mustBeInteger([1, 2]);',
                'mustBeOdd([1, 3]);',
                'mustBeFinite([1, 2]);',
                'mustBeReal([1, 2]);',
                'mustBeGreaterThan([2, 3], 1);',
                'mustBeGreaterThanOrEqual([1, 2], 1);',
                'mustBeLessThan([1, 2], 3);',
                'mustBeLessThanOrEqual([1, 2], 2);',
                'mustBeInRange([0, 1], 0, 1);',
                "mustBeInRange(0.5, 0, 1, 'exclude-both');",
                'mustBeBetween(0.5, 0, 1, "open");',
                "mustBeMember({'red', 'blue'}, {'red', 'blue', 'green'});",
                'mustBeMember([true, false], [false, true]);',
                "mustBeMember({{'nested'}}, {{'nested'}, {'other'}});",
                "mustBeMember(struct('a', 1), [struct('a', 1), struct('a', 2)]);",
                'mustBeA(1, ["double", "logical"]);',
                'mustBeUnderlyingType(true, {"logical"});',
                'mustBeFile("data/sample.m");',
                'mustBeFolder(["src", "doc"]);',
                'ok = 1;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('ok'))).toBe('1\n');
        expect(() => interpreter.Execute("mustBeNumeric('abc')")).toThrow("mustBeNumeric validation failed for 'input': mustBeNumeric.");
        expect(() => interpreter.Execute('mustBeGreaterThan(1, 1)')).toThrow("mustBeGreaterThan validation failed for 'input': mustBeGreaterThan.");
        expect(() => interpreter.Execute("mustBeInRange(0, 0, 1, 'exclude-lower')")).toThrow("mustBeInRange validation failed for 'input': mustBeInRange.");
        expect(() => interpreter.Execute("mustBeMember('yellow', {'red', 'blue'})")).toThrow("mustBeMember validation failed for 'input': mustBeMember.");
        expect(() => interpreter.Execute('mustBeMember(struct("a", 3), [struct("a", 1), struct("a", 2)])')).toThrow("mustBeMember validation failed for 'input': mustBeMember.");
        expect(() => interpreter.Execute("mustBeA('abc', {'double'})")).toThrow("mustBeA validation failed for 'input': mustBeA.");
        expect(() => interpreter.Execute('mustBeSparse([1, 2])')).toThrow("mustBeSparse validation failed for 'input': mustBeSparse.");
        expect(() => interpreter.Execute('mustBeFile("missing.m")')).toThrow("mustBeFile validation failed for 'input': mustBeFile.");
    });

    it('Should preserve call introspection through dbstack, mfilename, and functions metadata.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function [name, full, depth, file] = callerInfoProbe(x)',
                '  name = mfilename();',
                "  full = mfilename('fullpath');",
                '  stack = dbstack();',
                '  info = functions(@callerInfoProbe);',
                '  depth = rows(stack);',
                '  file = info.file;',
                'end',
                '[name, full, depth, file] = callerInfoProbe(1);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('name; full; depth; file'))).toBe('callerInfoProbe\ncallerInfoProbe\n1\n\n');
    });

    it('Should preserve assignin and inputname across caller workspaces and expression arguments.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function [first, second, expr, value] = assignInputProbe(x, y)',
                '  first = inputname(1);',
                '  second = inputname(2);',
                '  expr = inputname(2, false);',
                "  assignin('caller', 'assignedByProbe', x + y);",
                '  value = assignedByProbe;',
                'end',
                'source = 10;',
                '[first, second, expr, value] = assignInputProbe(source, source + 5);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('first; second; expr; value; assignedByProbe'))).toBe('source\n\nsource+5\n25\n25\n');
        expect(() => interpreter.Execute("assignin('base', 'bad-name', 1)")).toThrow('Invalid call to assignin.');
    });

    it('Should keep virtual source resolution visible through imports, exist, which, str2func, and functions.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.conf.Box': ['classdef Box', '  properties', '    Value = 12;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.conf.shift': ['function y = shift(x)', '  y = x + 4;', 'end'].join('\n'),
            },
        });
        interpreter.Execute(
            [
                'import pkg.conf.shift pkg.conf.Box',
                'direct = shift(6);',
                'box = Box();',
                "functionCode = exist('shift', 'function');",
                "classCode = exist('Box', 'class');",
                "fileCode = exist('pkg.conf.shift', 'file');",
                "whichFunction = which('shift');",
                "whichClass = which('Box');",
                "f = str2func('shift');",
                'info = functions(f);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('direct; box.Value; functionCode; classCode; fileCode; whichFunction; whichClass; info.file'))).toBe(
            '10\n12\n2\n8\n2\nshift is a user-defined function\nBox is a class\npkg.conf.shift\n',
        );
    });

    it('Should keep str2func text handles detached from local workspaces and nested functions.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function y = str2funcGlobalTarget(x)',
                '  y = x + 1;',
                'end',
                'function [directLocal, textNamed, textGlobal] = str2funcScopeProbe(x)',
                '  captured = 50;',
                '  function y = str2funcGlobalTarget(x)',
                '    y = x + 100;',
                '  end',
                '  direct = @str2funcGlobalTarget;',
                "  text = str2func('str2funcGlobalTarget');",
                "  globalText = str2func('str2funcGlobalTarget', 'global');",
                '  directLocal = direct(x);',
                '  textNamed = text(x);',
                '  textGlobal = globalText(x);',
                'end',
                'function capturedValue = str2funcAnonScopeProbe()',
                '  captured = 50;',
                "  anon = str2func('@(z) z + captured');",
                '  capturedValue = anon(3);',
                'end',
                '[directLocal, textNamed, textGlobal] = str2funcScopeProbe(5);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('directLocal; textNamed; textGlobal'))).toBe('105\n6\n6\n');
        expect(() => interpreter.Execute('str2funcAnonScopeProbe()')).toThrow("'captured' undefined.");
        expect(() => interpreter.Execute("str2func('sin', 'local')")).toThrow('Invalid call to str2func.');
    });

    it('Should treat empty input and redundant statement separators as no-op statements.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            ';;;',
            'x = 1;;; y = 2,,, z = 3;',
            'if true, ; ifValue = x + y; ; else, ; ifValue = 0; ; end',
            'for k = 1:2, ; loopValue = k; ; end',
            'while false, ; skipped = 1; ; end',
            'switch z, ; case 3, ; switchValue = 30; ; otherwise, ; switchValue = 0; ; end',
            'try, ; tryValue = switchValue; ; catch, ; tryValue = -1; ; end',
            'function y = emptyseps(t), ; y = t + loopValue; ; end',
            'emptyseps(5); ifValue; loopValue; switchValue; tryValue',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(';;;'))).toBe('');
        expect(interpreter.Unparse(interpreter.Execute(';;;'))).toBe('');
        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'x=1\ny=2\nz=3\nIF true\nifValue=x+y\n\nELSE\nifValue=0\n\nENDIF\nFOR k=1:2\nloopValue=k\n\nENDFOR\nWHILE false\nskipped=1\n\nENDWHILE\nSWITCH z\nCASE 3\nswitchValue=30\n\nOTHERWISE\nswitchValue=0\n\nENDSWITCH\nTRY\ntryValue=switchValue\n\nCATCH\ntryValue=-1\n\nEND_TRY_CATCH\nFUNCTION y=emptyseps(t)\ny=t+loopValue\nENDFUNCTION\nemptyseps(5)\nifValue\nloopValue\nswitchValue\ntryValue\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=1\ny=2\nz=3\n3\n2\n30\n30\n7\n3\n2\n30\n30\n');
    });

    it('Should keep end, colon, cells, and struct fields compatible in indexed expressions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = reshape(1:12, [3, 4]);',
            'lastLinear = A(end);',
            'lastColumn = A(:, end);',
            'tailRow = A(end, :);',
            'middle = A(2:end, 2:3);',
            'linearColumn = A(:);',
            'A(end-1:end) = [99, 100];',
            'C = {10, 20, 30};',
            'cellLast = C{end};',
            '[C{2:end}] = deal(200, 300);',
            'S(1).value = 5;',
            'S(2).value = 7;',
            'lastStruct = S(end).value;',
            'S(end).value = 9;',
            'dynamicField = "value";',
            'dynamicValue = S(end).(dynamicField);',
            '[fieldA, fieldB] = S.value;',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'A=reshape(1:12,[3,4])\nlastLinear=A(end)\nlastColumn=A(:,end)\ntailRow=A(end,:)\nmiddle=A(2:end,2:3)\nlinearColumn=A(:)\nA(end-1:end)=[99,100]\nC={10,20,30}\ncellLast=C{end}\n[C{2:end}]=deal(200,300)\nS(1).value=5\nS(2).value=7\nlastStruct=S(end).value\nS(end).value=9\ndynamicField=value\ndynamicValue=S(end).(dynamicField)\n[fieldA,fieldB]=S.value\n',
        );

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('lastLinear; lastColumn; tailRow; middle; linearColumn; A; cellLast; C; lastStruct; dynamicValue; fieldA; fieldB'))).toBe(
            '12\n[10;\n11;\n12]\n[3,6,9,12]\n[5,8;\n6,9]\n[1;\n2;\n3;\n4;\n5;\n6;\n7;\n8;\n9;\n10;\n11;\n12]\n[1,4,7,10;\n2,5,8,99;\n3,6,9,100]\n30\n{10,200,300}\n7\n9\n5\n9\n',
        );
    });

    it('Should preserve MATLAB/Octave null-assignment deletion semantics for arrays, cells, and struct arrays.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'linear = [1, 2, 3, 4, 5];',
            'linear(2:4) = [];',
            'logicalDelete = [1, 2, 3, 4, 5];',
            'logicalDelete([true, false, true, false, true]) = [];',
            'tail = [1, 2, 3, 4, 5];',
            'tail(end-1:end) = [];',
            'rows = [1, 2; 3, 4; 5, 6];',
            'rows(2:end, :) = [];',
            'cols = [1, 2; 3, 4; 5, 6];',
            'cols(:, end) = [];',
            'C = {1, 2, 3, 4};',
            'C(2:end-1) = [];',
            'D = {1, 2, 3, 4};',
            'D{2} = [];',
            'S(1).x = 1;',
            'S(2).x = 2;',
            'S(2) = [];',
            'linear; logicalDelete; tail; rows; cols; C; D; S.x',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'linear=[1,2,3,4,5]\nlinear=[1,5]\nlogicalDelete=[1,2,3,4,5]\nlogicalDelete=[2,4]\ntail=[1,2,3,4,5]\ntail=[1,2,3]\nrows=[1,2;\n3,4;\n5,6]\nrows=[1,2]\ncols=[1,2;\n3,4;\n5,6]\ncols=[1;\n3;\n5]\nC={1,2,3,4}\nC={1,4}\nD={1,2,3,4}\nD={1,[ ](0x0),3,4}\nS=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\nS=[struct {\nx: 1\n}]\n[1,5]\n[2,4]\n[1,2,3]\n[1,2]\n[1;\n3;\n5]\n{1,4}\n{1,[ ](0x0),3,4}\n1\n',
        );
        expect(() => interpreter.Execute('A = [1, 2; 3, 4]; A(1, 1) = [];')).toThrow('a null assignment can only have one non-colon index');
    });

    it('Should preserve dimensional logical subscripts in numeric and cell indexing.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = [1, 2; 3, 4];',
            'firstColumn = A(:, [true, false]);',
            'firstRow = A([true, false], :);',
            'corner = A([true, false], [false, true]);',
            'A(:, [false, true]) = [20; 40];',
            'A([false, true], :) = [30, 40];',
            'C = {1, 2; 3, 4};',
            'cellRow = C([true, false], :);',
            'C(:, [false, true]) = {20; 40};',
            'firstColumn; firstRow; corner; A; cellRow; C',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'A=[1,2;\n3,4]\nfirstColumn=[1;\n3]\nfirstRow=[1,2]\ncorner=2\nA=[1,20;\n3,40]\nA=[1,20;\n30,40]\nC={1,2;\n3,4}\ncellRow={1,2}\nC={1,20;\n3,40}\n[1;\n3]\n[1,2]\n2\n[1,20;\n30,40]\n{1,2}\n{1,20;\n3,40}\n',
        );
        expect(() => interpreter.Execute('A = [1, 2; 3, 4]; A(:, [true, false, true]);')).toThrow('logical index out of bound 2.');
    });

    it('Should convert objects used as native indices through subsindex.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef SubsindexProbe',
            '  properties',
            '    Values = 0;',
            '  end',
            '  methods',
            '    function obj = SubsindexProbe(values)',
            '      if nargin > 0',
            '        obj.Values = values;',
            '      end',
            '    end',
            '    function y = subsindex(obj)',
            '      y = obj.Values;',
            '    end',
            '  end',
            'end',
            'A = [10, 20, 30, 40];',
            'M = [1, 2, 3; 4, 5, 6; 7, 8, 9];',
            'idx1 = SubsindexProbe(0);',
            'idx2 = SubsindexProbe(1);',
            'idx3 = SubsindexProbe(2);',
            'idxVec = SubsindexProbe([0, 2]);',
            'idxArray = [idx1, idx3];',
            'scalarRead = A(idx2);',
            'vectorRead = A(idxVec);',
            'arrayRead = A(idxArray);',
            'matrixRead = M(idxVec, idx2);',
            'A(idx2) = 99;',
            'charRead = "abcd"(idxVec);',
            'scalarRead; vectorRead; arrayRead; matrixRead; A; charRead',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'A=[10,20,30,40]\nM=[1,2,3;\n4,5,6;\n7,8,9]\nidx1=SubsindexProbe object with properties: Values\nidx2=SubsindexProbe object with properties: Values\nidx3=SubsindexProbe object with properties: Values\nidxVec=SubsindexProbe object with properties: Values\nidxArray=[SubsindexProbe object with properties: Values,SubsindexProbe object with properties: Values]\nscalarRead=20\nvectorRead=[10,30]\narrayRead=[10,30]\nmatrixRead=[2;\n8]\nA=[10,99,30,40]\ncharRead=ac\n20\n[10,30]\n[10,30]\n[2;\n8]\n[10,99,30,40]\nac\n',
        );
        expect(() => interpreter.Execute(['classdef MissingSubsindexProbe', 'end', 'A = 1:3;', 'idx = MissingSubsindexProbe();', 'A(idx)'].join('\n'))).toThrow(
            'object of class MissingSubsindexProbe cannot be used as an index without a subsindex method.',
        );
        expect(() =>
            interpreter.Execute(
                [
                    'classdef InvalidSubsindexProbe',
                    '  methods',
                    '    function y = subsindex(obj)',
                    '      y = -1;',
                    '    end',
                    '  end',
                    'end',
                    'A = 1:3;',
                    'idx = InvalidSubsindexProbe();',
                    'A(idx)',
                ].join('\n'),
            ),
        ).toThrow('subsindex must return zero-based real integer indices.');
    });

    it('Should convert public subsref and subsasgn descriptor indices through subsindex.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PublicSubsindexProbe',
            '  properties',
            '    Values = 0;',
            '  end',
            '  methods',
            '    function obj = PublicSubsindexProbe(values)',
            '      if nargin > 0',
            '        obj.Values = values;',
            '      end',
            '    end',
            '    function y = subsindex(obj)',
            '      y = obj.Values;',
            '    end',
            '  end',
            'end',
            'A = [10, 20, 30, 40];',
            'idx2 = PublicSubsindexProbe(1);',
            'idxVec = PublicSubsindexProbe([0, 2]);',
            'idxPair = PublicSubsindexProbe([0, 1]);',
            'readScalar = subsref(A, substruct("()", {idx2}));',
            'readVector = subsref(A, substruct("()", {idxVec}));',
            'updated = subsasgn(A, substruct("()", {idxVec}), [99, 77]);',
            'textRead = subsref("abcd", substruct("()", {idxVec}));',
            'textUpdated = subsasgn("abcd", substruct("()", {idxVec}), "XY");',
            'C = {10, 20, 30};',
            'cellRead = subsref(C, substruct("{}", {idxVec}));',
            'classdef PublicSubsindexBox',
            '  properties',
            '    Payload = [];',
            '  end',
            '  methods',
            '    function obj = PublicSubsindexBox(value)',
            '      obj.Payload = value;',
            '    end',
            '  end',
            'end',
            'boxes = [PublicSubsindexBox([1, 2, 3]), PublicSubsindexBox([4, 5, 6])];',
            'boxCells = {PublicSubsindexBox([7, 8, 9]), PublicSubsindexBox([10, 11, 12])};',
            '[boxLeft, boxRight] = subsref(boxes, substruct(".", "Payload", "()", {idx2}));',
            'boxUpdated = subsasgn(boxes, substruct(".", "Payload", "()", {idxVec}), [90, 70]);',
            '[cellBoxLeft, cellBoxRight] = subsref(boxCells, substruct("{}", {idxPair}, ".", "Payload", "()", {idx2}));',
            'cellBoxUpdated = subsasgn(boxCells, substruct("{}", {idxPair}, ".", "Payload", "()", {idx2}), [80, 110]);',
            'boxRead = [boxLeft, boxRight];',
            'cellBoxRead = [cellBoxLeft, cellBoxRight];',
            'boxUpdatedFirst = boxUpdated(1).Payload;',
            'boxUpdatedSecond = boxUpdated(2).Payload;',
            'cellBoxUpdatedFirst = cellBoxUpdated{1}.Payload;',
            'cellBoxUpdatedSecond = cellBoxUpdated{2}.Payload;',
            'readScalar; readVector; updated; textRead; textUpdated; cellRead; boxRead; boxUpdatedFirst; boxUpdatedSecond; cellBoxRead; cellBoxUpdatedFirst; cellBoxUpdatedSecond',
        ].join('\n');

        const [readScalar, readVector, updated, textRead, textUpdated, cellRead, boxRead, boxUpdatedFirst, boxUpdatedSecond, cellBoxRead, cellBoxUpdatedFirst, cellBoxUpdatedSecond] =
            executeList(interpreter, source).list.slice(-12) as unknown[];

        expect(realScalar(readScalar)).toBe(20);
        expect(MultiArray.linearize(readVector as MultiArray).map(realScalar)).toEqual([10, 30]);
        expect(MultiArray.linearize(updated as MultiArray).map(realScalar)).toEqual([99, 20, 77, 40]);
        expect((textRead as CharString).str).toBe('ac');
        expect((textUpdated as CharString).str).toBe('XbYd');
        expect(realScalar(cellRead)).toBe(10);
        expect(MultiArray.linearize(boxRead as MultiArray).map(realScalar)).toEqual([2, 5]);
        expect(MultiArray.linearize(boxUpdatedFirst as MultiArray).map(realScalar)).toEqual([90, 2, 90]);
        expect(MultiArray.linearize(boxUpdatedSecond as MultiArray).map(realScalar)).toEqual([70, 5, 70]);
        expect(MultiArray.linearize(cellBoxRead as MultiArray).map(realScalar)).toEqual([8, 11]);
        expect(MultiArray.linearize(cellBoxUpdatedFirst as MultiArray).map(realScalar)).toEqual([7, 80, 9]);
        expect(MultiArray.linearize(cellBoxUpdatedSecond as MultiArray).map(realScalar)).toEqual([10, 110, 12]);
        expect(() =>
            interpreter.Execute(['classdef MissingPublicSubsindexProbe', 'end', 'A = 1:3;', 'idx = MissingPublicSubsindexProbe();', 'subsref(A, substruct("()", {idx}))'].join('\n')),
        ).toThrow('object of class MissingPublicSubsindexProbe cannot be used as an index without a subsindex method.');
    });

    it('Should apply public substruct descriptors across nested struct, cell, matrix, and text references.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S.a = {10, 20};',
            "idx = substruct('.', 'a', '{}', {2});",
            'readCell = subsref(S, idx);',
            'T = subsasgn(S, idx, 99);',
            'A = [1, 2; 3, 4];',
            "readColumn = subsref(A, substruct('()', {':', 2}));",
            "updatedRow = subsasgn(A, substruct('()', {1, ':'}), [7, 8]);",
            "txt = 'abcd';",
            "readText = subsref(txt, substruct('()', {[4, 2]}));",
            "updatedText = subsasgn(txt, substruct('()', {[1, 4]}), 'XY');",
            'readCell; T.a{2}; readColumn; updatedRow; readText; updatedText',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'S=struct {\na: {10,20}\n}\nidx=[struct {\ntype: .\nsubs: a\n},struct {\ntype: {}\nsubs: {2}\n}]\nreadCell=20\nT=struct {\na: {10,99}\n}\nA=[1,2;\n3,4]\nreadColumn=[2;\n4]\nupdatedRow=[7,8;\n3,4]\ntxt=abcd\nreadText=db\nupdatedText=XbcY\n20\n99\n[2;\n4]\n[7,8;\n3,4]\ndb\nXbcY\n',
        );
        expect(() => interpreter.Execute("subsref([1, 2], struct('type', 'bad', 'subs', {1}))")).toThrow('invalid subsref descriptor.');
    });

    it('Should preserve mixed nested native indexing chains with dynamic fields, cells, and end.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'field = "payload";',
            'leaf = "values";',
            'S(1).payload = {struct("values", [10, 20, 30]), struct("values", [40, 50, 60])};',
            'S(2).payload = {struct("values", [70, 80, 90]), struct("values", [100, 110, 120])};',
            'picked = S(end).(field){end}.(leaf)([1, end]);',
            'S(1).(field){1}.(leaf)(end) = 33;',
            'S(2).(field){2}.(leaf)([1, end]) = [101, 121];',
            '[left, right] = deal(S(1).payload{1}.values(2), S(2).payload{2}.values(end));',
            '[S(1).payload{2}.values(1), S(2).payload{1}.values(3)] = deal(44, 99);',
            'picked; S(1).payload{1}.values; S(2).payload{2}.values; left; right; S(1).payload{2}.values; S(2).payload{1}.values;',
        ].join('\n');

        const [picked, firstValues, secondValues, left, right, assignedFirstCell, assignedSecondCell] = executeList(interpreter, source).list.slice(-7) as MultiArray[];

        expect(MultiArray.linearize(picked).map(realScalar)).toEqual([100, 120]);
        expect(MultiArray.linearize(firstValues).map(realScalar)).toEqual([10, 20, 33]);
        expect(MultiArray.linearize(secondValues).map(realScalar)).toEqual([101, 110, 121]);
        expect([left, right].map(realScalar)).toEqual([20, 121]);
        expect(MultiArray.linearize(assignedFirstCell).map(realScalar)).toEqual([44, 50, 60]);
        expect(MultiArray.linearize(assignedSecondCell).map(realScalar)).toEqual([70, 80, 99]);
    });

    it('Should preserve mixed nested descriptor chains through subsref and subsasgn.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S(1).payload = {struct("values", [10, 20, 30]), struct("values", [40, 50, 60])};',
            'S(2).payload = {struct("values", [70, 80, 90]), struct("values", [100, 110, 120])};',
            "readDescriptor = substruct('()', {2}, '.', 'payload', '{}', {2}, '.', 'values', '()', {[1, 3]});",
            'readValues = subsref(S, readDescriptor);',
            "writeDescriptor = substruct('()', {1}, '.', 'payload', '{}', {2}, '.', 'values', '()', {[2, 3]});",
            'T = subsasgn(S, writeDescriptor, [55, 66]);',
            "dynamicDescriptor = substruct('.', 'payload', '{}', {1}, '.', 'values', '()', {2});",
            'dynamicRead = subsref(T(1), dynamicDescriptor);',
            'readValues; T(1).payload{2}.values; dynamicRead; S(1).payload{2}.values;',
        ].join('\n');

        const [readValues, updatedValues, dynamicRead, originalValues] = executeList(interpreter, source).list.slice(-4) as MultiArray[];

        expect(MultiArray.linearize(readValues).map(realScalar)).toEqual([100, 120]);
        expect(MultiArray.linearize(updatedValues).map(realScalar)).toEqual([40, 55, 66]);
        expect(realScalar(dynamicRead)).toBe(20);
        expect(MultiArray.linearize(originalValues).map(realScalar)).toEqual([40, 50, 60]);
    });

    it('Should preserve mixed nested read chains through public object properties.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef NestedIndexObject',
            '  properties',
            '    Payload = {};',
            '  end',
            '  methods',
            '    function obj = NestedIndexObject(payload)',
            '      if nargin > 0',
            '        obj.Payload = payload;',
            '      end',
            '    end',
            '  end',
            'end',
            'firstObj = NestedIndexObject({struct("values", [1, 2, 3]), struct("values", [4, 5, 6])});',
            'secondObj = NestedIndexObject({struct("values", [7, 8, 9]), struct("values", [10, 11, 12])});',
            'objs = [firstObj, secondObj];',
            'selected = objs(end).Payload{end}.values([1, end]);',
            'firstValues = objs(1).Payload{1}.values;',
            'secondValues = objs(2).Payload{2}.values;',
            'firstTail = objs(1).Payload{end}.values(end);',
            'secondHead = objs(end).Payload{1}.values(1);',
            'selected; firstValues; secondValues; firstTail; secondHead;',
        ].join('\n');

        const [selected, firstValues, secondValues, firstTail, secondHead] = executeList(interpreter, source).list.slice(-5) as MultiArray[];

        expect(MultiArray.linearize(selected).map(realScalar)).toEqual([10, 12]);
        expect(MultiArray.linearize(firstValues).map(realScalar)).toEqual([1, 2, 3]);
        expect(MultiArray.linearize(secondValues).map(realScalar)).toEqual([10, 11, 12]);
        expect(realScalar(firstTail)).toBe(6);
        expect(realScalar(secondHead)).toBe(7);
    });

    it('Should assign through mixed nested public object property chains and descriptors.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef NestedAssignObject',
            '  properties',
            '    Payload = {};',
            '  end',
            '  methods',
            '    function obj = NestedAssignObject(payload)',
            '      if nargin > 0',
            '        obj.Payload = payload;',
            '      end',
            '    end',
            '  end',
            'end',
            'firstObj = NestedAssignObject({struct("values", [1, 2, 3]), struct("values", [4, 5, 6])});',
            'secondObj = NestedAssignObject({struct("values", [7, 8, 9]), struct("values", [10, 11, 12])});',
            'objs = [firstObj, secondObj];',
            'objs(1).Payload{1}.values(3) = 30;',
            'objs(2).Payload{2}.values([1, 3]) = [100, 120];',
            "descriptorRead = subsref(objs, substruct('()', {2}, '.', 'Payload', '{}', {2}, '.', 'values', '()', {[1, 3]}));",
            "descriptorUpdated = subsasgn(objs, substruct('()', {1}, '.', 'Payload', '{}', {1}, '.', 'values', '()', {[1, 2]}), [10, 20]);",
            'objs(1).Payload{1}.values; objs(2).Payload{2}.values; descriptorRead; descriptorUpdated(1).Payload{1}.values; descriptorUpdated(2).Payload{2}.values;',
        ].join('\n');

        const [firstValues, secondValues, descriptorRead, descriptorUpdatedFirst, descriptorUpdatedSecond] = executeList(interpreter, source).list.slice(-5) as MultiArray[];

        expect(MultiArray.linearize(firstValues).map(realScalar)).toEqual([1, 2, 30]);
        expect(MultiArray.linearize(secondValues).map(realScalar)).toEqual([100, 11, 120]);
        expect(MultiArray.linearize(descriptorRead).map(realScalar)).toEqual([100, 120]);
        expect(MultiArray.linearize(descriptorUpdatedFirst).map(realScalar)).toEqual([10, 20, 30]);
        expect(MultiArray.linearize(descriptorUpdatedSecond).map(realScalar)).toEqual([100, 11, 120]);
    });

    it('Should expand object arrays and resolve end in nested public property assignments.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ObjectExpansionAssign',
            '  properties',
            '    Payload = {struct("values", [0, 0, 0])};',
            '    Tag = 0;',
            '  end',
            '  methods',
            '    function obj = ObjectExpansionAssign(tag, payload)',
            '      if nargin > 0',
            '        obj.Tag = tag;',
            '      end',
            '      if nargin > 1',
            '        obj.Payload = payload;',
            '      end',
            '    end',
            '  end',
            'end',
            'objs = ObjectExpansionAssign(1, {struct("values", [1, 2, 3]), struct("values", [4, 5, 6])});',
            'objs(3) = ObjectExpansionAssign(3, {struct("values", [7, 8, 9]), struct("values", [10, 11, 12])});',
            'objs(2).Tag = 2;',
            'objs(1).Payload{end}.values(end) = 60;',
            'objs(end).Payload{end}.values(end) = 120;',
            "updated = subsasgn(objs, substruct('()', {3}, '.', 'Payload', '{}', {2}, '.', 'values', '()', {3}), 121);",
            'tags = [objs.Tag];',
            'firstValues = objs(1).Payload{2}.values;',
            'lastValues = objs(end).Payload{end}.values;',
            'updatedLastValues = updated(end).Payload{end}.values;',
            'tags; firstValues; lastValues; updatedLastValues;',
        ].join('\n');

        const [tags, firstValues, lastValues, updatedLastValues] = executeList(interpreter, source).list.slice(-4) as MultiArray[];

        expect(MultiArray.linearize(tags).map(realScalar)).toEqual([1, 2, 3]);
        expect(MultiArray.linearize(firstValues).map(realScalar)).toEqual([4, 5, 60]);
        expect(MultiArray.linearize(lastValues).map(realScalar)).toEqual([10, 11, 120]);
        expect(MultiArray.linearize(updatedLastValues).map(realScalar)).toEqual([10, 11, 121]);
    });

    it('Should distribute multiple assignment across chained indexed struct and object properties.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ChainedCommaLeaf',
            '  properties',
            '    values = [1, 2, 3];',
            '  end',
            'end',
            'classdef ChainedCommaBox',
            '  properties',
            '    child = ChainedCommaLeaf();',
            '  end',
            'end',
            'classdef ChainedCommaCellObject',
            '  properties',
            '    x = 0;',
            '    child = ChainedCommaLeaf();',
            '  end',
            'end',
            'a = ChainedCommaBox();',
            'b = ChainedCommaBox();',
            'c = ChainedCommaBox();',
            'objs = [a, b, c];',
            '[objs.child.values(2)] = deal(20, 50, 80);',
            'idx = [3, 1];',
            '[objs(idx).child.values(3)] = deal(300, 100);',
            'S(1).child.values = [1, 2, 3];',
            'S(2).child.values = [4, 5, 6];',
            '[S.child.values(2)] = deal(200, 500);',
            'C = {struct("x", 1, "values", [1, 2, 3]), struct("x", 2, "values", [4, 5, 6])};',
            '[C{:}.x] = deal(7, 8);',
            '[C{:}.values(2)] = deal(20, 50);',
            'fieldName = "values";',
            '[objs.child.values(end)] = deal(101, 53, 303);',
            '[S.child.(fieldName)(end)] = deal(30, 60);',
            '[C{:}.(fieldName)(end)] = deal(300, 600);',
            'OC = {ChainedCommaCellObject(), ChainedCommaCellObject()};',
            '[OC{:}.x] = deal(17, 18);',
            '[OC{:}.child.(fieldName)(end)] = deal(130, 160);',
            "OD = subsasgn(OC, substruct('{}', {':'}, '.', 'x'), [27, 28]);",
            "[descriptorCellLeft, descriptorCellRight] = subsref(OC, substruct('{}', {':'}, '.', 'x'));",
            "[descriptorTailLeft, descriptorTailRight] = subsref(OC, substruct('{}', {':'}, '.', 'child', '.', 'values', '()', {3}));",
            "[parenDescriptorLeft, parenDescriptorRight] = subsref(OC, substruct('()', {':'}, '{}', {':'}, '.', 'x'));",
            "OE = subsasgn(OC, substruct('()', {':'}, '{}', {':'}, '.', 'child', '.', 'values', '()', {2}), [230, 260]);",
            '[OC(:){:}.x] = deal(37, 38);',
            '[OC(:){:}.child.values(end)] = deal(330, 360);',
            '[objFirst, objSecond, objThird] = objs.child.values;',
            '[structFirst, structSecond] = S.child.values;',
            'cellX = [C{1}.x, C{2}.x];',
            'cellFirst = C{1}.values;',
            'cellSecond = C{2}.values;',
            'objectCellX = [OC{1}.x, OC{2}.x];',
            'objectCellFirst = OC{1}.child.values;',
            'objectCellSecond = OC{2}.child.values;',
            'descriptorCellX = [OD{1}.x, OD{2}.x];',
            'descriptorCellRead = [descriptorCellLeft, descriptorCellRight];',
            'descriptorTailRead = [descriptorTailLeft, descriptorTailRight];',
            'parenDescriptorRead = [parenDescriptorLeft, parenDescriptorRight];',
            'parenDescriptorFirst = OE{1}.child.values;',
            'parenDescriptorSecond = OE{2}.child.values;',
            'objFirst; objSecond; objThird; structFirst; structSecond; cellX; cellFirst; cellSecond; objectCellX; objectCellFirst; objectCellSecond; descriptorCellX; descriptorCellRead; descriptorTailRead; parenDescriptorRead; parenDescriptorFirst; parenDescriptorSecond;',
        ].join('\n');

        const [
            objFirst,
            objSecond,
            objThird,
            structFirst,
            structSecond,
            cellX,
            cellFirst,
            cellSecond,
            objectCellX,
            objectCellFirst,
            objectCellSecond,
            descriptorCellX,
            descriptorCellRead,
            descriptorTailRead,
            parenDescriptorRead,
            parenDescriptorFirst,
            parenDescriptorSecond,
        ] = executeList(interpreter, source).list.slice(-17) as MultiArray[];

        expect(MultiArray.linearize(objFirst).map(realScalar)).toEqual([1, 20, 101]);
        expect(MultiArray.linearize(objSecond).map(realScalar)).toEqual([1, 50, 53]);
        expect(MultiArray.linearize(objThird).map(realScalar)).toEqual([1, 80, 303]);
        expect(MultiArray.linearize(structFirst).map(realScalar)).toEqual([1, 200, 30]);
        expect(MultiArray.linearize(structSecond).map(realScalar)).toEqual([4, 500, 60]);
        expect(MultiArray.linearize(cellX).map(realScalar)).toEqual([7, 8]);
        expect(MultiArray.linearize(cellFirst).map(realScalar)).toEqual([1, 20, 300]);
        expect(MultiArray.linearize(cellSecond).map(realScalar)).toEqual([4, 50, 600]);
        expect(MultiArray.linearize(objectCellX).map(realScalar)).toEqual([37, 38]);
        expect(MultiArray.linearize(objectCellFirst).map(realScalar)).toEqual([1, 2, 330]);
        expect(MultiArray.linearize(objectCellSecond).map(realScalar)).toEqual([1, 2, 360]);
        expect(MultiArray.linearize(descriptorCellX).map(realScalar)).toEqual([27, 28]);
        expect(MultiArray.linearize(descriptorCellRead).map(realScalar)).toEqual([17, 18]);
        expect(MultiArray.linearize(descriptorTailRead).map(realScalar)).toEqual([130, 160]);
        expect(MultiArray.linearize(parenDescriptorRead).map(realScalar)).toEqual([17, 18]);
        expect(MultiArray.linearize(parenDescriptorFirst).map(realScalar)).toEqual([1, 230, 130]);
        expect(MultiArray.linearize(parenDescriptorSecond).map(realScalar)).toEqual([1, 260, 160]);
        expect(() => interpreter.Execute('[objs.child.values(1)] = deal(1, 2)')).toThrow('deal: nargin and nargout must match unless there is exactly one input.');
    });

    it('Should distribute chained calls and indexed fields over comma-separated receivers.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ChainedCallChild',
            '  properties',
            '    values = [];',
            '  end',
            '  methods',
            '    function obj = ChainedCallChild(varargin)',
            '      if nargin > 0, obj.values = varargin{1}; end',
            '    end',
            '  end',
            'end',
            'classdef ChainedCallObject',
            '  properties',
            '    x = 0;',
            '    child = ChainedCallChild();',
            '  end',
            '  methods',
            '    function obj = ChainedCallObject(varargin)',
            '      if nargin > 0, obj.x = varargin{1}; end',
            '      if nargin > 1, obj.child = ChainedCallChild(varargin{2}); end',
            '    end',
            '    function y = plusone(obj)',
            '      y = obj.x + 1;',
            '    end',
            '  end',
            'end',
            'C = {ChainedCallObject(1, [10, 20, 30]), ChainedCallObject(2, [40, 50, 60]), ChainedCallObject(3, [70, 80, 90])};',
            '[cellMethodLeft, cellMethodRight] = C{1:2}.plusone();',
            'S(1).obj = ChainedCallObject(3);',
            'S(2).obj = ChainedCallObject(4);',
            '[structMethodLeft, structMethodRight] = S.obj.plusone();',
            'V = {struct("values", [10, 20, 30]), struct("values", [40, 50, 60])};',
            '[fieldLeft, fieldRight] = V{:}.values(2);',
            '[orderedLeft, orderedRight] = C{[3, 1]}.x;',
            '[C{[3, 1]}.child.values(end)] = deal(900, 100);',
            '[logicalLeft, logicalRight] = C{[true, false, true]}.x;',
            '[C{[true, false, true]}.child.values(2)] = deal(200, 600);',
            "D = subsasgn(C, substruct('{}', {[3, 1]}, '.', 'child', '.', 'values', '()', {1}), [700, 100]);",
            "E = subsasgn(C, substruct('()', {[3, 1]}, '{}', {':'}, '.', 'child', '.', 'values', '()', {3}), [901, 301]);",
            'cellMethod = [cellMethodLeft, cellMethodRight];',
            'structMethod = [structMethodLeft, structMethodRight];',
            'fieldIndex = [fieldLeft, fieldRight];',
            'ordered = [orderedLeft, orderedRight];',
            'logicalRead = [logicalLeft, logicalRight];',
            'firstValues = C{1}.child.values;',
            'thirdValues = C{3}.child.values;',
            'descriptorFirst = D{1}.child.values;',
            'descriptorThird = D{3}.child.values;',
            'parenDescriptorFirst = E{1}.child.values;',
            'parenDescriptorThird = E{3}.child.values;',
            'cellMethod; structMethod; fieldIndex; ordered; logicalRead; firstValues; thirdValues; descriptorFirst; descriptorThird; parenDescriptorFirst; parenDescriptorThird;',
        ].join('\n');

        const [cellMethod, structMethod, fieldIndex, ordered, logicalRead, firstValues, thirdValues, descriptorFirst, descriptorThird, parenDescriptorFirst, parenDescriptorThird] =
            executeList(interpreter, source).list.slice(-11) as MultiArray[];

        expect(MultiArray.linearize(cellMethod).map(realScalar)).toEqual([2, 3]);
        expect(MultiArray.linearize(structMethod).map(realScalar)).toEqual([4, 5]);
        expect(MultiArray.linearize(fieldIndex).map(realScalar)).toEqual([20, 50]);
        expect(MultiArray.linearize(ordered).map(realScalar)).toEqual([3, 1]);
        expect(MultiArray.linearize(logicalRead).map(realScalar)).toEqual([1, 3]);
        expect(MultiArray.linearize(firstValues).map(realScalar)).toEqual([10, 200, 100]);
        expect(MultiArray.linearize(thirdValues).map(realScalar)).toEqual([70, 600, 900]);
        expect(MultiArray.linearize(descriptorFirst).map(realScalar)).toEqual([100, 200, 100]);
        expect(MultiArray.linearize(descriptorThird).map(realScalar)).toEqual([700, 600, 900]);
        expect(MultiArray.linearize(parenDescriptorFirst).map(realScalar)).toEqual([10, 200, 301]);
        expect(MultiArray.linearize(parenDescriptorThird).map(realScalar)).toEqual([70, 600, 901]);
    });

    it('Should preserve empty assignments through object property indexing paths.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef EmptyPathBox',
            '  properties',
            '    Payload = {};',
            '  end',
            '  methods',
            '    function obj = EmptyPathBox(varargin)',
            '      if nargin > 0, obj.Payload = varargin{1}; end',
            '    end',
            '  end',
            'end',
            'obj = EmptyPathBox({10, 20, 30});',
            'obj.Payload(2) = [];',
            'scalarParen = obj.Payload;',
            'objBrace = EmptyPathBox({10, 20, 30});',
            'objBrace.Payload{2} = [];',
            'scalarBrace = objBrace.Payload;',
            'objs = [EmptyPathBox({10, 20, 30}), EmptyPathBox({40, 50, 60})];',
            'arrayUpdated = subsasgn(objs, substruct(".", "Payload", "()", {2}), []);',
            'arrayFirst = arrayUpdated(1).Payload;',
            'arraySecond = arrayUpdated(2).Payload;',
            'C = {EmptyPathBox({10, 20, 30}), EmptyPathBox({40, 50, 60})};',
            'cellUpdated = subsasgn(C, substruct("{}", {":"}, ".", "Payload", "()", {2}), []);',
            'cellFirst = cellUpdated{1}.Payload;',
            'cellSecond = cellUpdated{2}.Payload;',
            'braceUpdated = subsasgn(C, substruct("{}", {":"}, ".", "Payload", "{}", {2}), []);',
            'braceFirst = braceUpdated{1}.Payload;',
            'braceSecond = braceUpdated{2}.Payload;',
            'field = "Payload";',
            'dynamicObj = EmptyPathBox({70, 80, 90});',
            'dynamicObj.(field)(end) = [];',
            'dynamicValues = dynamicObj.Payload;',
            'scalarParen; scalarBrace; arrayFirst; arraySecond; cellFirst; cellSecond; braceFirst; braceSecond; dynamicValues;',
        ].join('\n');

        const [scalarParen, scalarBrace, arrayFirst, arraySecond, cellFirst, cellSecond, braceFirst, braceSecond, dynamicValues] = executeList(interpreter, source).list.slice(
            -9,
        ) as MultiArray[];

        expect(MultiArray.linearize(scalarParen).map(realScalar)).toEqual([10, 30]);
        expect(scalarBrace.isCell).toBe(true);
        expect(MultiArray.linearize(scalarBrace).map((value) => (MultiArray.isInstanceOf(value) && MultiArray.isEmpty(value) ? 'empty' : realScalar(value)))).toEqual([10, 'empty', 30]);
        expect(MultiArray.linearize(arrayFirst).map(realScalar)).toEqual([10, 30]);
        expect(MultiArray.linearize(arraySecond).map(realScalar)).toEqual([40, 60]);
        expect(MultiArray.linearize(cellFirst).map(realScalar)).toEqual([10, 30]);
        expect(MultiArray.linearize(cellSecond).map(realScalar)).toEqual([40, 60]);
        expect(MultiArray.linearize(braceFirst).map((value) => (MultiArray.isInstanceOf(value) && MultiArray.isEmpty(value) ? 'empty' : realScalar(value)))).toEqual([10, 'empty', 30]);
        expect(MultiArray.linearize(braceSecond).map((value) => (MultiArray.isInstanceOf(value) && MultiArray.isEmpty(value) ? 'empty' : realScalar(value)))).toEqual([40, 'empty', 60]);
        expect(MultiArray.linearize(dynamicValues).map(realScalar)).toEqual([70, 80]);
    });

    it('Should distribute public descriptor assignment through native structure and cell chains.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S(1).payload = {struct("v", [1, 2, 3]), struct("v", [4, 5, 6])};',
            'S(2).payload = {struct("v", [7, 8, 9]), struct("v", [10, 11, 12])};',
            'field = "payload";',
            'leaf = "v";',
            '[structReadLeft, structReadRight] = subsref(S, substruct("()", {[2, 1]}, ".", field, "{}", {2}, ".", leaf, "()", {3}));',
            'T = subsasgn(S, substruct("()", {[2, 1]}, ".", field, "{}", {1}, ".", leaf, "()", {2}), [80, 20]);',
            'U = subsasgn(S, substruct(".", "payload", "{}", {1}, ".", "v", "()", {2}), []);',
            'C = {S(1), S(2)};',
            '[cellReadLeft, cellReadRight] = subsref(C, substruct("{}", {[2, 1]}, ".", "payload", "{}", {1}, ".", "v", "()", {3}));',
            'D = subsasgn(C, substruct("{}", {[2, 1]}, ".", "payload", "{}", {1}, ".", "v", "()", {2}), [50, 20]);',
            'structRead = [structReadLeft, structReadRight];',
            'structAssignedSecond = T(2).payload{1}.v;',
            'structAssignedFirst = T(1).payload{1}.v;',
            'structDeletedFirst = U(1).payload{1}.v;',
            'structDeletedSecond = U(2).payload{1}.v;',
            'cellRead = [cellReadLeft, cellReadRight];',
            'cellAssignedSecond = D{2}.payload{1}.v;',
            'cellAssignedFirst = D{1}.payload{1}.v;',
            'structRead; structAssignedSecond; structAssignedFirst; structDeletedFirst; structDeletedSecond; cellRead; cellAssignedSecond; cellAssignedFirst;',
        ].join('\n');

        const [structRead, structAssignedSecond, structAssignedFirst, structDeletedFirst, structDeletedSecond, cellRead, cellAssignedSecond, cellAssignedFirst] = executeList(
            interpreter,
            source,
        ).list.slice(-8) as MultiArray[];

        expect(MultiArray.linearize(structRead).map(realScalar)).toEqual([12, 6]);
        expect(MultiArray.linearize(structAssignedSecond).map(realScalar)).toEqual([7, 80, 9]);
        expect(MultiArray.linearize(structAssignedFirst).map(realScalar)).toEqual([1, 20, 3]);
        expect(MultiArray.linearize(structDeletedFirst).map(realScalar)).toEqual([1, 3]);
        expect(MultiArray.linearize(structDeletedSecond).map(realScalar)).toEqual([7, 9]);
        expect(MultiArray.linearize(cellRead).map(realScalar)).toEqual([9, 3]);
        expect(MultiArray.linearize(cellAssignedSecond).map(realScalar)).toEqual([7, 50, 9]);
        expect(MultiArray.linearize(cellAssignedFirst).map(realScalar)).toEqual([1, 20, 3]);
    });

    it('Should apply public descriptor chains across object arrays and object cells.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PublicDescriptorBox',
            '  properties',
            '    Payload = [];',
            '  end',
            '  methods',
            '    function obj = PublicDescriptorBox(value)',
            '      obj.Payload = value;',
            '    end',
            '    function y = read(obj, index)',
            '      y = obj.Payload(index);',
            '    end',
            '    function [first, second] = pair(obj, index)',
            '      first = obj.Payload(index);',
            '      second = obj.Payload(index) + 100;',
            '    end',
            '  end',
            'end',
            'objs = [PublicDescriptorBox([1, 2, 3]), PublicDescriptorBox([4, 5, 6])];',
            'scalar = PublicDescriptorBox([13, 14, 15]);',
            'cells = {PublicDescriptorBox([7, 8, 9]), PublicDescriptorBox([10, 11, 12])};',
            '[propLeft, propRight] = subsref(objs, substruct(".", "Payload", "()", {2}));',
            '[selectedLeft, selectedRight] = subsref(objs, substruct("()", {[2, 1]}, ".", "Payload", "()", {3}));',
            '[cellLeft, cellRight] = subsref(cells, substruct("{}", {[2, 1]}, ".", "Payload", "()", {1}));',
            '[methodLeft, methodRight] = subsref(objs, substruct(".", "read", "()", {3}));',
            '[scalarFirst, scalarSecond] = subsref(scalar, substruct(".", "pair", "()", {2}));',
            '[arrayPairLeft, arrayPairRight] = subsref(objs, substruct(".", "pair", "()", {2}));',
            'updated = subsasgn(objs, substruct("()", {[2, 1]}, ".", "Payload", "()", {2}), [50, 20]);',
            'updatedCell = subsasgn(cells, substruct("{}", {[2, 1]}, ".", "Payload", "()", {3}), [120, 90]);',
            'propValues = [propLeft, propRight];',
            'selectedValues = [selectedLeft, selectedRight];',
            'cellValues = [cellLeft, cellRight];',
            'methodValues = [methodLeft, methodRight];',
            'scalarPairValues = [scalarFirst, scalarSecond];',
            'arrayPairValues = [arrayPairLeft, arrayPairRight];',
            'updatedFirst = updated(1).Payload;',
            'updatedSecond = updated(2).Payload;',
            'updatedCellFirst = updatedCell{1}.Payload;',
            'updatedCellSecond = updatedCell{2}.Payload;',
            'propValues; selectedValues; cellValues; methodValues; scalarPairValues; arrayPairValues; updatedFirst; updatedSecond; updatedCellFirst; updatedCellSecond;',
        ].join('\n');

        const [propValues, selectedValues, cellValues, methodValues, scalarPairValues, arrayPairValues, updatedFirst, updatedSecond, updatedCellFirst, updatedCellSecond] = executeList(
            interpreter,
            source,
        ).list.slice(-10) as MultiArray[];

        expect(MultiArray.linearize(propValues).map(realScalar)).toEqual([2, 5]);
        expect(MultiArray.linearize(selectedValues).map(realScalar)).toEqual([6, 3]);
        expect(MultiArray.linearize(cellValues).map(realScalar)).toEqual([10, 7]);
        expect(MultiArray.linearize(methodValues).map(realScalar)).toEqual([3, 6]);
        expect(MultiArray.linearize(scalarPairValues).map(realScalar)).toEqual([14, 114]);
        expect(MultiArray.linearize(arrayPairValues).map(realScalar)).toEqual([2, 5]);
        expect(MultiArray.linearize(updatedFirst).map(realScalar)).toEqual([1, 20, 3]);
        expect(MultiArray.linearize(updatedSecond).map(realScalar)).toEqual([4, 50, 6]);
        expect(MultiArray.linearize(updatedCellFirst).map(realScalar)).toEqual([7, 8, 90]);
        expect(MultiArray.linearize(updatedCellSecond).map(realScalar)).toEqual([10, 11, 120]);
    });

    it('Should apply public descriptor assignment through class property accessors.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PublicDescriptorAccessorBox',
            '  properties',
            '    Storage = [0, 0, 0];',
            '  end',
            '  properties (Dependent)',
            '    Dep',
            '  end',
            '  properties (GetMethod = readValue, SetMethod = writeValue)',
            '    Value',
            '  end',
            '  methods',
            '    function obj = PublicDescriptorAccessorBox(value)',
            '      obj.Storage = value;',
            '    end',
            '    function y = get.Dep(obj)',
            '      y = obj.Storage + 10;',
            '    end',
            '    function obj = set.Dep(obj, value)',
            '      obj.Storage = value - 10;',
            '    end',
            '    function y = readValue(obj)',
            '      y = obj.Storage + 100;',
            '    end',
            '    function obj = writeValue(obj, value)',
            '      obj.Storage = value - 100;',
            '    end',
            '  end',
            'end',
            'objs = [PublicDescriptorAccessorBox([1, 2, 3]), PublicDescriptorAccessorBox([4, 5, 6])];',
            'cells = {PublicDescriptorAccessorBox([7, 8, 9]), PublicDescriptorAccessorBox([10, 11, 12])};',
            '[depLeft, depRight] = subsref(objs, substruct(".", "Dep", "()", {2}));',
            '[valueLeft, valueRight] = subsref(objs, substruct(".", "Value", "()", {3}));',
            'depUpdated = subsasgn(objs, substruct("()", {[2, 1]}, ".", "Dep", "()", {2}), [70, 40]);',
            'valueUpdated = subsasgn(objs, substruct(".", "Value", "()", {3}), [160, 130]);',
            'cellDepUpdated = subsasgn(cells, substruct("{}", {[2, 1]}, ".", "Dep", "()", {1}), [90, 60]);',
            'cellValueUpdated = subsasgn(cells, substruct("{}", {[2, 1]}, ".", "Value", "()", {2}), [210, 180]);',
            'depRead = [depLeft, depRight];',
            'valueRead = [valueLeft, valueRight];',
            'depUpdatedFirst = depUpdated(1).Storage;',
            'depUpdatedSecond = depUpdated(2).Storage;',
            'valueUpdatedFirst = valueUpdated(1).Storage;',
            'valueUpdatedSecond = valueUpdated(2).Storage;',
            'cellDepFirst = cellDepUpdated{1}.Storage;',
            'cellDepSecond = cellDepUpdated{2}.Storage;',
            'cellValueFirst = cellValueUpdated{1}.Storage;',
            'cellValueSecond = cellValueUpdated{2}.Storage;',
            'originalFirst = objs(1).Storage;',
            'depRead; valueRead; depUpdatedFirst; depUpdatedSecond; valueUpdatedFirst; valueUpdatedSecond; cellDepFirst; cellDepSecond; cellValueFirst; cellValueSecond; originalFirst;',
        ].join('\n');

        const [depRead, valueRead, depUpdatedFirst, depUpdatedSecond, valueUpdatedFirst, valueUpdatedSecond, cellDepFirst, cellDepSecond, cellValueFirst, cellValueSecond, originalFirst] =
            executeList(interpreter, source).list.slice(-11) as MultiArray[];

        expect(MultiArray.linearize(depRead).map(realScalar)).toEqual([12, 15]);
        expect(MultiArray.linearize(valueRead).map(realScalar)).toEqual([103, 106]);
        expect(MultiArray.linearize(depUpdatedFirst).map(realScalar)).toEqual([1, 30, 3]);
        expect(MultiArray.linearize(depUpdatedSecond).map(realScalar)).toEqual([4, 60, 6]);
        expect(MultiArray.linearize(valueUpdatedFirst).map(realScalar)).toEqual([1, 2, 60]);
        expect(MultiArray.linearize(valueUpdatedSecond).map(realScalar)).toEqual([4, 5, 30]);
        expect(MultiArray.linearize(cellDepFirst).map(realScalar)).toEqual([50, 8, 9]);
        expect(MultiArray.linearize(cellDepSecond).map(realScalar)).toEqual([80, 11, 12]);
        expect(MultiArray.linearize(cellValueFirst).map(realScalar)).toEqual([7, 80, 9]);
        expect(MultiArray.linearize(cellValueSecond).map(realScalar)).toEqual([10, 110, 12]);
        expect(MultiArray.linearize(originalFirst).map(realScalar)).toEqual([1, 2, 3]);
    });

    it('Should create missing public descriptor paths through native and object containers.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef CreatedPathBox',
            '  properties',
            '    Payload = {};',
            '  end',
            '  methods',
            '    function obj = CreatedPathBox(varargin)',
            '      if nargin > 0, obj.Payload = varargin{1}; end',
            '    end',
            '  end',
            'end',
            'S(1).base = 1;',
            'S(2).base = 2;',
            'nativeBroadcast = subsasgn(S, substruct(".", "missing", ".", "values", "()", {2}), 9);',
            'nativeDistributed = subsasgn(S, substruct(".", "missing", ".", "values", "()", {2}), [90, 80]);',
            'S(3).base = 3;',
            'selectedDistributed = subsasgn(S, substruct("()", {[3, 1]}, ".", "created", ".", "values", "()", {2}), [30, 10]);',
            'C = {struct("base", 1), struct("base", 2)};',
            'cellDistributed = subsasgn(C, substruct("{}", {[2, 1]}, ".", "created", ".", "values", "()", {2}), [20, 10]);',
            'obj = CreatedPathBox({});',
            'objectScalar = subsasgn(obj, substruct(".", "Payload", "{}", {2}, ".", "v", "()", {2}), 8);',
            'objs = [CreatedPathBox({}), CreatedPathBox({})];',
            'objectArray = subsasgn(objs, substruct(".", "Payload", "{}", {2}, ".", "v", "()", {2}), [8, 9]);',
            'OC = {CreatedPathBox({}), CreatedPathBox({})};',
            'objectCell = subsasgn(OC, substruct("{}", {":"}, ".", "Payload", "{}", {2}, ".", "v", "()", {2}), [18, 19]);',
            'nativeBroadcastFirst = nativeBroadcast(1).missing.values;',
            'nativeBroadcastSecond = nativeBroadcast(2).missing.values;',
            'nativeDistributedFirst = nativeDistributed(1).missing.values;',
            'nativeDistributedSecond = nativeDistributed(2).missing.values;',
            'selectedThird = selectedDistributed(3).created.values;',
            'selectedFirst = selectedDistributed(1).created.values;',
            'cellSecond = cellDistributed{2}.created.values;',
            'cellFirst = cellDistributed{1}.created.values;',
            'objectScalarValues = objectScalar.Payload{2}.v;',
            'objectArrayFirst = objectArray(1).Payload{2}.v;',
            'objectArraySecond = objectArray(2).Payload{2}.v;',
            'objectCellFirst = objectCell{1}.Payload{2}.v;',
            'objectCellSecond = objectCell{2}.Payload{2}.v;',
            'nativeBroadcastFirst; nativeBroadcastSecond; nativeDistributedFirst; nativeDistributedSecond; selectedThird; selectedFirst; cellSecond; cellFirst; objectScalarValues; objectArrayFirst; objectArraySecond; objectCellFirst; objectCellSecond;',
        ].join('\n');

        const [
            nativeBroadcastFirst,
            nativeBroadcastSecond,
            nativeDistributedFirst,
            nativeDistributedSecond,
            selectedThird,
            selectedFirst,
            cellSecond,
            cellFirst,
            objectScalarValues,
            objectArrayFirst,
            objectArraySecond,
            objectCellFirst,
            objectCellSecond,
        ] = executeList(interpreter, source).list.slice(-13) as MultiArray[];

        expect(MultiArray.linearize(nativeBroadcastFirst).map(realScalar)).toEqual([0, 9]);
        expect(MultiArray.linearize(nativeBroadcastSecond).map(realScalar)).toEqual([0, 9]);
        expect(MultiArray.linearize(nativeDistributedFirst).map(realScalar)).toEqual([0, 90]);
        expect(MultiArray.linearize(nativeDistributedSecond).map(realScalar)).toEqual([0, 80]);
        expect(MultiArray.linearize(selectedThird).map(realScalar)).toEqual([0, 30]);
        expect(MultiArray.linearize(selectedFirst).map(realScalar)).toEqual([0, 10]);
        expect(MultiArray.linearize(cellSecond).map(realScalar)).toEqual([0, 20]);
        expect(MultiArray.linearize(cellFirst).map(realScalar)).toEqual([0, 10]);
        expect(MultiArray.linearize(objectScalarValues).map(realScalar)).toEqual([0, 8]);
        expect(MultiArray.linearize(objectArrayFirst).map(realScalar)).toEqual([0, 8]);
        expect(MultiArray.linearize(objectArraySecond).map(realScalar)).toEqual([0, 9]);
        expect(MultiArray.linearize(objectCellFirst).map(realScalar)).toEqual([0, 18]);
        expect(MultiArray.linearize(objectCellSecond).map(realScalar)).toEqual([0, 19]);
        expect(() => interpreter.Execute('obj = CreatedPathBox({1}); subsasgn(obj, substruct(".", "Payload", "()", {2}), 7);')).toThrow('cell array assignment requires a cell array value.');
    });

    it('Should evaluate switch object cases through case-side eq overloads.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef SwitchEqProbe',
            '  properties',
            '    Value = 0;',
            '  end',
            '  methods',
            '    function obj = SwitchEqProbe(v)',
            '      if nargin > 0',
            '        obj.Value = v;',
            '      end',
            '    end',
            '    function y = eq(a,b)',
            '      y = a.Value == 7;',
            '    end',
            '  end',
            'end',
            'switchValue = SwitchEqProbe(2);',
            'caseValue = SwitchEqProbe(7);',
            'otherCase = SwitchEqProbe(3);',
            'switch switchValue',
            '  case otherCase',
            '    first = 30;',
            '  case caseValue',
            '    first = 10;',
            '  otherwise',
            '    first = 0;',
            'end',
            'switch switchValue',
            '  case {otherCase, caseValue}',
            '    second = 20;',
            '  otherwise',
            '    second = 0;',
            'end',
            'first; second',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'switchValue=SwitchEqProbe object with properties: Value\ncaseValue=SwitchEqProbe object with properties: Value\notherCase=SwitchEqProbe object with properties: Value\n10\n20\n10\n20\n',
        );
    });

    it('Should preserve empty and scalar logical indexing across arrays, cells, and character vectors.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = [10, 20, 30];',
            'emptyNumeric = A([]);',
            'falseNumeric = A(false);',
            'trueNumeric = A(true);',
            'A([]) = 9;',
            'A(false) = 8;',
            'A(true) = 7;',
            'C = {10, 20, 30};',
            'emptyCell = C([]);',
            'falseCell = C(false);',
            'trueCell = C(true);',
            'C(false) = {99};',
            'C(true) = {77};',
            "text = 'abc';",
            'emptyText = text([]);',
            'falseText = text(false);',
            'trueText = text(true);',
            'emptyNumeric; falseNumeric; trueNumeric; A; emptyCell; falseCell; trueCell; C; emptyText; falseText; trueText',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'A=[10,20,30]\nemptyNumeric=[ ](0x0)\nfalseNumeric=[ ](1x0)\ntrueNumeric=10\nA=[10,20,30]\nA=[10,20,30]\nA=[7,20,30]\nC={10,20,30}\nemptyCell={ }(0x0)\nfalseCell={ }(1x0)\ntrueCell={10}\nC={10,20,30}\nC={77,20,30}\ntext=abc\nemptyText=\nfalseText=\ntrueText=a\n[ ](0x0)\n[ ](1x0)\n10\n[7,20,30]\n{ }(0x0)\n{ }(1x0)\n{10}\n{77,20,30}\n\n\na\n',
        );
    });

    it('Should reject indeterminate end and colon tokens outside valid indexing contexts.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Parse('end;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = :;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = (:);')).toThrow(/syntax error/);
        expect(() => interpreter.Execute('A = [1, 2]; A(end + 1);')).toThrow('A(3): out of bound 2 (dimensions are 1x2).');
        expect(() => interpreter.Execute('A = [1, 2]; A{1};')).toThrow('matrix cannot be indexed with {');
    });

    it('Should keep matrix, cell, and comma-separated-list concatenation compatible with MATLAB/Octave.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'emptyRows = [; 1;; 2;];',
            'emptyCellRows = {; "top";; "bottom";};',
            'mixedSeparators = [1, 2 3; 4 5, 6];',
            'neutralHorz = [[], 7, [], 8];',
            'neutralVert = [[]; 9; []; 10];',
            'C = {1, 2, 3};',
            'expandedNumeric = [C{:}, 4];',
            'expandedCell = {C{:}, 4};',
            'S(1).x = 5; S(2).x = 6; S(3).x = 7;',
            'expandedStruct = [S.x, 8];',
            'stacked = vertcat([1, 2], [3, 4]);',
            'sideBySide = horzcat([1; 2], [3; 4]);',
            'charRow = ["a", "b"];',
            "charVec = ['a', 'b'];",
            'emptyRows; emptyCellRows; mixedSeparators; neutralHorz; neutralVert; expandedNumeric; expandedCell; expandedStruct; stacked; sideBySide; charRow; charVec',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'emptyRows=[1;\n2]\nemptyCellRows={top;\nbottom}\nmixedSeparators=[1,2,3;\n4,5,6]\nneutralHorz=[[ ](0x0),7,[ ](0x0),8]\nneutralVert=[[ ](0x0);\n9;\n[ ](0x0);\n10]\nC={1,2,3}\nexpandedNumeric=[C{:},4]\nexpandedCell={C{:},4}\nS(1).x=5\nS(2).x=6\nS(3).x=7\nexpandedStruct=[S.x,8]\nstacked=vertcat([1,2],[3,4])\nsideBySide=horzcat([1;\n2],[3;\n4])\ncharRow=[a,b]\ncharVec=[a,b]\nemptyRows\nemptyCellRows\nmixedSeparators\nneutralHorz\nneutralVert\nexpandedNumeric\nexpandedCell\nexpandedStruct\nstacked\nsideBySide\ncharRow\ncharVec\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'emptyRows=[1;\n2]\nemptyCellRows={top;\nbottom}\nmixedSeparators=[1,2,3;\n4,5,6]\nneutralHorz=[7,8]\nneutralVert=[9;\n10]\nC={1,2,3}\nexpandedNumeric=[1,2,3,4]\nexpandedCell={1,2,3,4}\nS=[struct {\nx: 5\n}]\nS=[struct {\nx: 5\n},struct {\nx: 6\n}]\nS=[struct {\nx: 5\n},struct {\nx: 6\n},struct {\nx: 7\n}]\nexpandedStruct=[5,6,7,8]\nstacked=[1,2;\n3,4]\nsideBySide=[1,3;\n2,4]\ncharRow=[a,b]\ncharVec=ab\n[1;\n2]\n{top;\nbottom}\n[1,2,3;\n4,5,6]\n[7,8]\n[9;\n10]\n[1,2,3,4]\n{1,2,3,4}\n[5,6,7,8]\n[1,2;\n3,4]\n[1,3;\n2,4]\n[a,b]\nab\n',
        );
    });

    it('Should reject incompatible matrix and cell literal dimensions.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('badRows = [1, 2; 3];')).toThrow('evaluate: dimension mismatch');
        expect(() => interpreter.Execute('badCells = {1, 2; 3};')).toThrow('evaluate: dimension mismatch');
        expect(() => interpreter.Execute('badHorz = [[1;2], [3,4]];')).toThrow('evaluate: dimension mismatch');
        expect(() => interpreter.Execute('badVert = [[1,2]; [3;4]];')).toThrow('evaluate: dimension mismatch');
    });

    it('Should preserve comma-separated-list expansion across calls, assignments, and single-output contexts.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = sumargs(varargin)',
            '  y = 0;',
            '  for k = 1:nargin',
            '    y += varargin{k};',
            '  end',
            'end',
            'function [a, b, c] = triple(x)',
            '  a = x;',
            '  b = x + 1;',
            '  c = x + 2;',
            'end',
            'C = {1, 2, 3};',
            'cellCall = sumargs(C{:});',
            'S(1).x = 4;',
            'S(2).x = 5;',
            'S(3).x = 6;',
            'structCall = sumargs(S.x);',
            '[a, b, c] = triple(10);',
            'singleCapture = triple(20);',
            '[first, second] = C{1:2};',
            '[sx1, sx2, sx3] = S.x;',
            'nestedCall = sumargs(triple(1));',
            'cellCall; structCall; a; b; c; singleCapture; first; second; sx1; sx2; sx3; nestedCall',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'FUNCTION y=sumargs(varargin)\ny=0\nFOR k=1:nargin\ny+=varargin{k}\n\nENDFOR\nENDFUNCTION\nFUNCTION [a,b,c]=triple(x)\na=x\nb=x+1\nc=x+2\nENDFUNCTION\nC={1,2,3}\ncellCall=sumargs(C{:})\nS(1).x=4\nS(2).x=5\nS(3).x=6\nstructCall=sumargs(S.x)\n[a,b,c]=triple(10)\nsingleCapture=triple(20)\n[first,second]=C{1:2}\n[sx1,sx2,sx3]=S.x\nnestedCall=sumargs(triple(1))\ncellCall\nstructCall\na\nb\nc\nsingleCapture\nfirst\nsecond\nsx1\nsx2\nsx3\nnestedCall\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'C={1,2,3}\ncellCall=6\nS=[struct {\nx: 4\n}]\nS=[struct {\nx: 4\n},struct {\nx: 5\n}]\nS=[struct {\nx: 4\n},struct {\nx: 5\n},struct {\nx: 6\n}]\nstructCall=15\na=10\nb=11\nc=12\nsingleCapture=20\nfirst=1\nsecond=2\nsx1=4\nsx2=5\nsx3=6\nnestedCall=1\n6\n15\n10\n11\n12\n20\n1\n2\n4\n5\n6\n1\n',
        );
        expect(() => interpreter.Execute('[u, v, w, extra] = C{:};')).toThrow('element number 4 undefined in return list');
        expect(() => interpreter.Execute('[u, v, w, extra] = S.x;')).toThrow('element number 4 undefined in return list');
    });

    it('Should preserve MATLAB/Octave conditional truth rules and control-context short-circuiting.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'allTrue = 0;',
            'if [1, 2; 3, 4]',
            '  allTrue = 10;',
            'else',
            '  allTrue = 20;',
            'end',
            'elseifValue = 0;',
            'if [1, 0; 3, 4]',
            '  elseifValue = 10;',
            'elseif [5, 6]',
            '  elseifValue = 30;',
            'else',
            '  elseifValue = 40;',
            'end',
            'emptyValue = 0;',
            'if []',
            '  emptyValue = 10;',
            'else',
            '  emptyValue = 20;',
            'end',
            'shortAnd = 0;',
            'if false & missingAnd',
            '  shortAnd = 10;',
            'else',
            '  shortAnd = 20;',
            'end',
            'shortOr = 0;',
            'if true | missingOr',
            '  shortOr = 30;',
            'end',
            'scalarShort = 0;',
            'if true && true',
            '  scalarShort = 40;',
            'end',
            'w = 0;',
            'while true & (w < 2)',
            '  w += 1;',
            'end',
            'd = 0;',
            'do',
            '  d += 1;',
            'until true | missingUntil',
            'allTrue; elseifValue; emptyValue; shortAnd; shortOr; scalarShort; w; d',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'allTrue=0\nIF [1,2;\n3,4]\nallTrue=10\n\nELSE\nallTrue=20\n\nENDIF\nelseifValue=0\nIF [1,0;\n3,4]\nelseifValue=10\n\nELSEIF [5,6]\nelseifValue=30\n\nELSE\nelseifValue=40\n\nENDIF\nemptyValue=0\nIF [ ](0x0)\nemptyValue=10\n\nELSE\nemptyValue=20\n\nENDIF\nshortAnd=0\nIF false&missingAnd\nshortAnd=10\n\nELSE\nshortAnd=20\n\nENDIF\nshortOr=0\nIF true|missingOr\nshortOr=30\n\nENDIF\nscalarShort=0\nIF true&&true\nscalarShort=40\n\nENDIF\nw=0\nWHILE true&w<2\nw+=1\n\nENDWHILE\nd=0\nDO\nd+=1\n\nUNTIL true|missingUntil\nallTrue\nelseifValue\nemptyValue\nshortAnd\nshortOr\nscalarShort\nw\nd\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'allTrue=0\n10\nelseifValue=0\n30\nemptyValue=0\n20\nshortAnd=0\n20\nshortOr=0\n30\nscalarShort=0\n40\nw=0\n2\nd=0\n1\n10\n30\n20\n20\n30\n40\n2\n1\n',
        );
        expect(() => interpreter.Execute('C = {1}; if C, y = 1; end')).toThrow('invalid conversion from cell to logical.');
        expect(() => interpreter.Execute('S.field = 1; if S, y = 1; end')).toThrow('invalid conversion from struct to logical.');
        expect(() => interpreter.Execute('f = @sin; if f, y = 1; end')).toThrow('invalid conversion from function_handle to logical.');
    });

    it('Should convert class objects in logical control contexts through logical methods.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef LogicalControlProbe < handle',
            '  properties',
            '    Value = false;',
            '  end',
            '  methods',
            '    function obj = LogicalControlProbe(v)',
            '      if nargin > 0',
            '        obj.Value = v;',
            '      end',
            '    end',
            '    function y = logical(obj)',
            '      y = obj.Value;',
            '    end',
            '  end',
            'end',
            'classdef WhileLogicalControlProbe < handle',
            '  properties',
            '    Count = 0;',
            '  end',
            '  methods',
            '    function y = logical(obj)',
            '      obj.Count = obj.Count + 1;',
            '      y = obj.Count < 3;',
            '    end',
            '  end',
            'end',
            'truthy = LogicalControlProbe(true);',
            'falsy = LogicalControlProbe(false);',
            'if truthy',
            '  ifValue = 1;',
            'else',
            '  ifValue = 0;',
            'end',
            'if falsy',
            '  falseIf = 1;',
            'else',
            '  falseIf = 0;',
            'end',
            'shortAnd = falsy && missingAnd;',
            'shortOr = truthy || missingOr;',
            'arrTrue = [LogicalControlProbe(true), LogicalControlProbe(true)];',
            'arrMixed = [LogicalControlProbe(true), LogicalControlProbe(false)];',
            'if arrTrue',
            '  arrayIf = 1;',
            'else',
            '  arrayIf = 0;',
            'end',
            'if arrMixed',
            '  mixedIf = 1;',
            'else',
            '  mixedIf = 0;',
            'end',
            'counter = WhileLogicalControlProbe();',
            'n = 0;',
            'while counter',
            '  n = n + 1;',
            'end',
            'ifValue; falseIf; shortAnd; shortOr; arrayIf; mixedIf; n',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'truthy=LogicalControlProbe object with properties: Value\nfalsy=LogicalControlProbe object with properties: Value\n1\n0\nshortAnd=false\nshortOr=true\narrTrue=[LogicalControlProbe object with properties: Value,LogicalControlProbe object with properties: Value]\narrMixed=[LogicalControlProbe object with properties: Value,LogicalControlProbe object with properties: Value]\n1\n0\ncounter=WhileLogicalControlProbe object with properties: Count\nn=0\n2\n1\n0\nfalse\ntrue\n1\n0\n2\n',
        );
        expect(() => interpreter.Execute(['classdef MissingLogicalControlProbe', 'end', 'obj = MissingLogicalControlProbe();', 'if obj, y = 1; end'].join('\n'))).toThrow(
            'invalid conversion from MissingLogicalControlProbe to logical.',
        );
    });

    it('Should preserve element-wise logical operators, logical functions, broadcasting, and scalar short-circuit reduction.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'maskAnd = [true, false; true, false] & [true, true; false, false];',
            'maskOr = [0, 1; 2, 0] | [0, 0; 0, 3];',
            'scalarAnd = [1, 0] & true;',
            'scalarOr = false | [0, 2];',
            'broadcastAnd = [1, 0] & [1; 0; 1];',
            'broadcastOr = or([0, 1], [0; 0; 1]);',
            'funcAnd = and([1, 0], [1, 1]);',
            'funcOr = or([0, 1], [0, 0]);',
            'funcXor = xor([1, 0, 1], [0, 0, 1]);',
            'shortAnd = [1, 0] && missingAnd;',
            'shortOr = [1, 1] || missingOr;',
            'emptyShort = [] && missingEmpty;',
            'maskAnd; maskOr; scalarAnd; scalarOr; broadcastAnd; broadcastOr; funcAnd; funcOr; funcXor; shortAnd; shortOr; emptyShort',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'maskAnd=[true,false;\ntrue,false]&[true,true;\nfalse,false]\nmaskOr=[0,1;\n2,0]|[0,0;\n0,3]\nscalarAnd=[1,0]&true\nscalarOr=false|[0,2]\nbroadcastAnd=[1,0]&[1;\n0;\n1]\nbroadcastOr=or([0,1],[0;\n0;\n1])\nfuncAnd=and([1,0],[1,1])\nfuncOr=or([0,1],[0,0])\nfuncXor=xor([1,0,1],[0,0,1])\nshortAnd=[1,0]&&missingAnd\nshortOr=[1,1]||missingOr\nemptyShort=[ ](0x0)&&missingEmpty\nmaskAnd\nmaskOr\nscalarAnd\nscalarOr\nbroadcastAnd\nbroadcastOr\nfuncAnd\nfuncOr\nfuncXor\nshortAnd\nshortOr\nemptyShort\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'maskAnd=[true,false;\nfalse,false]\nmaskOr=[false,true;\ntrue,true]\nscalarAnd=[true,false]\nscalarOr=[false,true]\nbroadcastAnd=[true,false;\nfalse,false;\ntrue,false]\nbroadcastOr=[false,true;\nfalse,true;\ntrue,true]\nfuncAnd=[true,false]\nfuncOr=[false,true]\nfuncXor=[true,false,false]\nshortAnd=false\nshortOr=true\nemptyShort=false\n[true,false;\nfalse,false]\n[false,true;\ntrue,true]\n[true,false]\n[false,true]\n[true,false;\nfalse,false;\ntrue,false]\n[false,true;\nfalse,true;\ntrue,true]\n[true,false]\n[false,true]\n[true,false,false]\nfalse\ntrue\nfalse\n',
        );
        expect(() => interpreter.Execute('[1, 0] || missingOr')).toThrow("'missingOr' undefined.");
    });

    it('Should reject logical negation for structures and function handles.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('s = struct("x", 1); ~s')).toThrow('operator ~ is not defined for struct operands.');
        expect(() => interpreter.Execute('s = struct("x", 1); !s')).toThrow('operator ~ is not defined for struct operands.');
        expect(() => interpreter.Execute('s = struct("x", 1); not(s)')).toThrow('operator ~ is not defined for struct operands.');
        expect(() => interpreter.Execute('S(1).x = 1; S(2).x = 2; ~S')).toThrow('operator ~ is not defined for struct operands.');
        expect(() => interpreter.Execute('f = @(x) x; ~f')).toThrow('operator ~ is not defined for this operand.');
        expect(() => interpreter.Execute('f = @(x) x; !f')).toThrow('operator ~ is not defined for this operand.');
        expect(() => interpreter.Execute('f = @(x) x; not(f)')).toThrow('operator ~ is not defined for this operand.');
        expect(() => interpreter.Execute('f = @(x) x; true && f')).toThrow('invalid conversion from function_handle to logical.');
        expect(() => interpreter.Execute('f = @(x) x; false || f')).toThrow('invalid conversion from function_handle to logical.');
    });

    it('Should reject direct cell-array operands in arithmetic, relational, equality, and logical operators.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('{1} + {2}')).toThrow('operator + is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} .* 2')).toThrow('operator .* is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} == {1}')).toThrow('operator == is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} ~= {2}')).toThrow('operator ~= is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} < 2')).toThrow('operator < is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} & true')).toThrow('operator & is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} * 2')).toThrow('operator * is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} / 2')).toThrow('operator / is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} \\ 2')).toThrow('operator \\ is not defined for cell operands.');
        expect(() => interpreter.Execute('{1} ^ 2')).toThrow('operator ^ is not defined for cell operands.');
        expect(() => interpreter.Execute('~{1}')).toThrow('operator ~ is not defined for cell operands.');
        expect(() => interpreter.Execute('not({1})')).toThrow('operator ~ is not defined for cell operands.');
        expect(() => interpreter.Execute('true && {1}')).toThrow('invalid conversion from cell to logical.');
        expect(() => interpreter.Execute('false || {1}')).toThrow('invalid conversion from cell to logical.');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2}; [C{1} + C{2}, (C{1} < C{2}), (C{1} == 1)]'))).toBe('C={1,2}\n[3,true,true]\n');
    });

    it('Should preserve transpose and conjugate-transpose semantics across numeric, character, cell, and struct arrays.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'Z = [1+2i, 3-4i];',
            "plainNumeric = Z.';",
            "conjNumeric = Z';",
            "text = 'ab';",
            "plainText = text.';",
            "conjText = text';",
            'C = {1+2i, 2; 3, 4-5i};',
            "plainCell = C.';",
            "conjCell = C';",
            'S(1).x = 1;',
            'S(2).x = 2;',
            "structColumn = S.';",
            'plainNumeric; conjNumeric; plainText; conjText; plainCell; conjCell; plainCell{1,1}; conjCell{1,1}; [structColumn.x]',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            "Z=[1+2i,3-4i]\nplainNumeric=Z.'\nconjNumeric=Z'\ntext=ab\nplainText=text.'\nconjText=text'\nC={1+2i,2;\n3,4-5i}\nplainCell=C.'\nconjCell=C'\nS(1).x=1\nS(2).x=2\nstructColumn=S.'\nplainNumeric\nconjNumeric\nplainText\nconjText\nplainCell\nconjCell\nplainCell{1,1}\nconjCell{1,1}\n[structColumn.x]\n",
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'Z=[1+2i,3-4i]\nplainNumeric=[1+2i;\n3-4i]\nconjNumeric=[1-2i;\n3+4i]\ntext=ab\nplainText=[a;\nb]\nconjText=[a;\nb]\nC={1+2i,2;\n3,4-5i}\nplainCell={1+2i,3;\n2,4-5i}\nconjCell={1+2i,3;\n2,4-5i}\nS=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\nstructColumn=[struct {\nx: 1\n};\nstruct {\nx: 2\n}]\n[1+2i;\n3-4i]\n[1-2i;\n3+4i]\n[a;\nb]\n[a;\nb]\n{1+2i,3;\n2,4-5i}\n{1+2i,3;\n2,4-5i}\n1+2i\n1+2i\n[1,2]\n',
        );
        expect(() => interpreter.Execute("A = reshape(1:8, [2, 2, 2]); A.';")).toThrow('transpose not defined for N-D objects');
    });

    it('Should expose page-wise transpose helpers for N-D arrays.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'A = cat(3, [111, 112, 113; 121, 122, 123], [211, 212, 213; 221, 222, 223]);',
                'Z = cat(3, [11+1i, 12+2i; 21+1i, 22+2i], [31+1i, 32+2i; 41+1i, 42+2i]);',
                'PT = pagetranspose(A);',
                'PCT = pagectranspose(Z);',
            ].join('\n'),
        );
        const [plain, conjugated] = executeList(interpreter, 'PT; PCT').list as MultiArray[];

        expect(plain.dimension).toEqual([3, 2, 2]);
        expect(MultiArray.linearize(plain).map(realScalar)).toEqual([111, 112, 113, 121, 122, 123, 211, 212, 213, 221, 222, 223]);
        expect(conjugated.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(conjugated).map((value) => [Complex.realToNumber(value as ComplexType), Complex.imagToNumber(value as ComplexType)])).toEqual([
            [11, -1],
            [12, -2],
            [21, -1],
            [22, -2],
            [31, -1],
            [32, -2],
            [41, -1],
            [42, -2],
        ]);
    });

    it('Should expose page-wise matrix multiplication with page expansion and transpose options.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'A = cat(3, [1, 2; 3, 4], [5, 6; 7, 8]);',
                'B = cat(3, [2, 0; 1, 2], [1, 1; 0, 1]);',
                'P = pagemtimes(A, B);',
                'S = reshape(1:4, [2, 2, 1]);',
                'I = cat(4, eye(2), 2*eye(2), 3*eye(2));',
                'Q = pagemtimes(S, I);',
                'T = pagemtimes(A, "transpose", B, "none");',
            ].join('\n'),
        );
        const [pageProduct, broadcastProduct, transposedProduct] = executeList(interpreter, 'P; Q; T').list as MultiArray[];

        expect(pageProduct.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(pageProduct).map(realScalar)).toEqual([4, 10, 4, 8, 5, 7, 11, 15]);
        expect(broadcastProduct.dimension).toEqual([2, 2, 1, 3]);
        expect(MultiArray.linearize(broadcastProduct).map(realScalar)).toEqual([1, 2, 3, 4, 2, 4, 6, 8, 3, 6, 9, 12]);
        expect(transposedProduct.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(transposedProduct).map(realScalar)).toEqual([5, 8, 6, 8, 5, 6, 12, 14]);
        expect(() => interpreter.Execute('pagemtimes(A, "bad", B, "none")')).toThrow('Invalid call to pagemtimes.');
        expect(() => interpreter.Execute('pagemtimes(A, B, B)')).toThrow('Invalid call to pagemtimes.');
    });

    it('Should expose page-wise inverse for N-D arrays.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(['A = cat(3, [2, 0; 0, 4], [1, 2; 0, 1]);', '[Y,RC] = pageinv(A);', 'directRC = rcond(A(:,:,2));', 'bad = ones(2, 3, 2);'].join('\n'));
        const [inverse, reciprocalCondition, directReciprocalCondition] = executeList(interpreter, 'Y; RC; directRC').list as [MultiArray, MultiArray, ComplexType];

        expect(inverse.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(inverse).map(realScalar)).toEqual([0.5, 0, 0, 0.25, 1, 0, -2, 1]);
        expect(MultiArray.linearize(reciprocalCondition).map(realScalar)).toEqual([0.5, 1 / 9]);
        expect(Complex.realToNumber(directReciprocalCondition)).toBeCloseTo(1 / 9, 12);
        expect(() => interpreter.Execute('pageinv(bad)')).toThrow('pageinv: each page must be a square matrix');
        expect(() => interpreter.Execute('rcond([1, 2])')).toThrow('Invalid call to rcond.');
    });

    it('Should expose page-wise left and right matrix division.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'A = cat(3, [2, 0; 0, 4], [1, 2; 0, 1]);',
                'B = cat(3, [2, 8; 6, 16], [3, 5; 7, 11]);',
                '[L,LRC] = pagemldivide(A, B);',
                '[R,RRC] = pagemrdivide(B, A);',
                'BT = [3, 5; 7, 11];',
                'AT = [1, 2; 0, 1];',
                'LT = pagemldivide(AT, "transpose", BT);',
                'RT = pagemrdivide(BT, AT, "transpose");',
            ].join('\n'),
        );
        const [leftSolution, rightSolution, leftReciprocalCondition, rightReciprocalCondition, leftTransposeSolution, rightTransposeSolution] = executeList(
            interpreter,
            'L; R; LRC; RRC; LT; RT',
        ).list as MultiArray[];

        expect(MultiArray.linearize(leftSolution).map(realScalar)).toEqual([1, 1.5, 4, 4, -11, 7, -17, 11]);
        expect(MultiArray.linearize(rightSolution).map(realScalar)).toEqual([1, 3, 2, 4, 3, 7, -1, -3]);
        expect(MultiArray.linearize(leftReciprocalCondition).map(realScalar)).toEqual([0.5, 1 / 9]);
        expect(MultiArray.linearize(rightReciprocalCondition).map(realScalar)).toEqual([0.5, 1 / 9]);
        expect(MultiArray.linearize(leftTransposeSolution).map(realScalar)).toEqual([3, 1, 5, 1]);
        expect(MultiArray.linearize(rightTransposeSolution).map(realScalar)).toEqual([-7, -15, 5, 11]);
        expect(() => interpreter.Execute('pagemldivide(A, "bad", B)')).toThrow('Invalid call to pagemldivide.');
        expect(() => interpreter.Execute('pagemrdivide(B, A, "bad")')).toThrow('Invalid call to pagemrdivide.');
    });

    it('Should solve rectangular dense matrix division through least-squares semantics.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'A = [1, 0; 0, 1; 1, 1];',
                'B = [1; 2; 3];',
                'leftOperator = A \\ B;',
                'leftFunction = mldivide(A, B);',
                "rightOperator = B' / A';",
                "rightFunction = mrdivide(B', A');",
                'AP = cat(3, A, A);',
                'BP = cat(3, B, 2*B);',
                '[pageLeft,pageRC] = pagemldivide(AP, BP);',
            ].join('\n'),
        );
        const [leftOperator, leftFunction, rightOperator, rightFunction, pageLeft, pageReciprocalCondition] = executeList(
            interpreter,
            'leftOperator; leftFunction; rightOperator; rightFunction; pageLeft; pageRC',
        ).list as MultiArray[];

        expect(MultiArray.linearize(leftOperator).map(realScalar)).toEqual([1, 2]);
        expect(MultiArray.linearize(leftFunction).map(realScalar)).toEqual([1, 2]);
        expect(MultiArray.linearize(rightOperator).map(realScalar)).toEqual([1, 2]);
        expect(MultiArray.linearize(rightFunction).map(realScalar)).toEqual([1, 2]);
        expect(MultiArray.linearize(pageLeft).map(realScalar)).toEqual([1, 2, 2, 4]);
        for (const value of MultiArray.linearize(pageReciprocalCondition)) {
            expect(realScalar(value)).toBeCloseTo(1 / Math.sqrt(3), 12);
        }
    });

    it('Should preserve MATLAB operator precedence, associativity, and short-circuit evaluation.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'powerBeforeUnary = -2^2;',
            'parenthesizedUnaryPower = (-2)^2;',
            'powerUnaryExponent = 2^-2;',
            'powerLeftToRight = 2^3^2;',
            "scalarTransposePower = 2^2';",
            'matrixProductBeforePlus = 1 + 2 * 3;',
            'colonAfterPlus = 1 + 1:4 - 1;',
            'colonBeforeRelational = 1:3 < 3;',
            'andBeforeOr = false | true & false;',
            'shortAndBeforeShortOr = false || true && false;',
            'mixedShortCircuit = false && missingName || true;',
            'assignmentRightAssociative = 0;',
            'a = b = 5;',
            'compound = 2;',
            'compound += 3 * 4;',
            'powerBeforeUnary; parenthesizedUnaryPower; powerUnaryExponent; powerLeftToRight; scalarTransposePower;',
            'matrixProductBeforePlus; colonAfterPlus; colonBeforeRelational; andBeforeOr; shortAndBeforeShortOr;',
            'mixedShortCircuit; a; b; compound',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            "powerBeforeUnary=-(2^2)\nparenthesizedUnaryPower=(-2)^2\npowerUnaryExponent=2^-2\npowerLeftToRight=2^3^2\nscalarTransposePower=2^2'\nmatrixProductBeforePlus=1+2*3\ncolonAfterPlus=1+1:4-1\ncolonBeforeRelational=(1:3)<3\nandBeforeOr=false|true&false\nshortAndBeforeShortOr=false||true&&false\nmixedShortCircuit=false&&missingName||true\nassignmentRightAssociative=0\na=b=5\ncompound=2\ncompound+=3*4\npowerBeforeUnary\nparenthesizedUnaryPower\npowerUnaryExponent\npowerLeftToRight\nscalarTransposePower\nmatrixProductBeforePlus\ncolonAfterPlus\ncolonBeforeRelational\nandBeforeOr\nshortAndBeforeShortOr\nmixedShortCircuit\na\nb\ncompound\n",
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'powerBeforeUnary=-4\nparenthesizedUnaryPower=4\npowerUnaryExponent=0.25\npowerLeftToRight=64\nscalarTransposePower=4\nmatrixProductBeforePlus=7\ncolonAfterPlus=[2,3]\ncolonBeforeRelational=[true,true,false]\nandBeforeOr=false\nshortAndBeforeShortOr=false\nmixedShortCircuit=true\nassignmentRightAssociative=0\na=5\ncompound=2\ncompound=14\n-4\n4\n0.25\n64\n4\n7\n[2,3]\n[true,true,false]\nfalse\nfalse\ntrue\n5\n5\n14\n',
        );
    });

    it('Should preserve Octave operator aliases, increment/decrement, and compound assignments.', () => {
        const interpreter = Interpreter.Create();
        const aliasSource = [
            'powAlias = 2 ** 3;',
            'elementPowAlias = [2, 3] .** 2;',
            'notAlias = !false;',
            'notEqualAlias = 1 != 2;',
            'x = 1;',
            'post = x++;',
            'afterPost = x;',
            'pre = ++x;',
            'y = 4;',
            'postDec = y--;',
            'afterPostDec = y;',
            'preDec = --y;',
            'A = [1, 2, 3];',
            'aPost = A(2)++;',
            'aPre = ++A(3);',
            'S.value = 5;',
            'sPost = S.value++;',
            'sPre = ++S.value;',
            'C = {10, 20};',
            'cPost = C{1}++;',
            'cPre = ++C{2};',
            'powAlias; elementPowAlias; notAlias; notEqualAlias; post; afterPost; pre; postDec; afterPostDec; preDec; A; aPost; aPre; S.value; sPost; sPre; C{1}; cPost; cPre',
        ].join('\n');
        const compoundSource = [
            'powAssign = 2;',
            'powAssign **= 3;',
            'elemPowAssign = [2, 3];',
            'elemPowAssign .**= 2;',
            'leftAssign = 2;',
            'leftAssign \\= 8;',
            'elemLeftAssign = [2, 4];',
            'elemLeftAssign .\\= 8;',
            'andAssign = true;',
            'andAssign &= false;',
            'orAssign = false;',
            'orAssign |= true;',
            'powAssign; elemPowAssign; leftAssign; elemLeftAssign; andAssign; orAssign',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(aliasSource))).toBe(
            'powAlias=2**3\nelementPowAlias=([2,3].**2)\nnotAlias=!false\nnotEqualAlias=1!=2\nx=1\npost=(x++)\nafterPost=x\npre=(++x)\ny=4\npostDec=(y--)\nafterPostDec=y\npreDec=(--y)\nA=[1,2,3]\naPost=(A(2)++)\naPre=(++A(3))\nS.value=5\nsPost=(S.value++)\nsPre=(++S.value)\nC={10,20}\ncPost=(C{1}++)\ncPre=(++C{2})\npowAlias\nelementPowAlias\nnotAlias\nnotEqualAlias\npost\nafterPost\npre\npostDec\nafterPostDec\npreDec\nA\naPost\naPre\nS.value\nsPost\nsPre\nC{1}\ncPost\ncPre\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(aliasSource))).toBe(
            'powAlias=8\nelementPowAlias=[4,9]\nnotAlias=true\nnotEqualAlias=true\nx=1\npost=1\nafterPost=2\npre=3\ny=4\npostDec=4\nafterPostDec=3\npreDec=2\nA=[1,2,3]\naPost=2\naPre=4\nS=struct {\nvalue: 5\n}\nsPost=5\nsPre=7\nC={10,20}\ncPost=10\ncPre=21\n8\n[4,9]\ntrue\ntrue\n1\n2\n3\n4\n3\n2\n[1,3,4]\n2\n4\n7\n5\n7\n11\n10\n21\n',
        );
        expect(interpreter.Unparse(interpreter.Parse(compoundSource))).toBe(
            'powAssign=2\npowAssign**=3\nelemPowAssign=[2,3]\nelemPowAssign.**=2\nleftAssign=2\nleftAssign\\=8\nelemLeftAssign=[2,4]\nelemLeftAssign.\\=8\nandAssign=true\nandAssign&=false\norAssign=false\norAssign|=true\npowAssign\nelemPowAssign\nleftAssign\nelemLeftAssign\nandAssign\norAssign\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(compoundSource))).toBe(
            'powAssign=2\npowAssign=8\nelemPowAssign=[2,3]\nelemPowAssign=[4,9]\nleftAssign=2\nleftAssign=4\nelemLeftAssign=[2,4]\nelemLeftAssign=[4,2]\nandAssign=true\nandAssign=false\norAssign=false\norAssign=true\n8\n[4,9]\n4\n[4,2]\nfalse\ntrue\n',
        );
        expect(() => interpreter.Execute('1++;')).toThrow('invalid left hand side of assignment.');
        expect(() => interpreter.Execute('++1;')).toThrow('invalid left hand side of assignment.');
    });

    it('Should keep Octave numeric literal forms and underscore separators compatible.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'decimalGrouped = 1_234_567;',
            'fractionGrouped = 12_345.67_89;',
            'exponentGrouped = 1.05D2;',
            'leadingDot = .001_05e+2;',
            'binaryInteger = 0b10_1010;',
            'hexInteger = 0x2_A;',
            'octalInteger = 0o5_2;',
            'imaginaryDecimal = 42J;',
            'imaginaryBinary = 0b10_1010i;',
            'imaginaryHex = 0x2Aj;',
            'dotOperator = 13./2;',
            'decimalGrouped; fractionGrouped; exponentGrouped; leadingDot; binaryInteger; hexInteger; octalInteger; imaginaryDecimal; imaginaryBinary; imaginaryHex; dotOperator',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'decimalGrouped=1234567\nfractionGrouped=12345.6789\nexponentGrouped=105\nleadingDot=0.105\nbinaryInteger=42\nhexInteger=42\noctalInteger=42\nimaginaryDecimal=42i\nimaginaryBinary=42i\nimaginaryHex=42i\ndotOperator=13./2\ndecimalGrouped\nfractionGrouped\nexponentGrouped\nleadingDot\nbinaryInteger\nhexInteger\noctalInteger\nimaginaryDecimal\nimaginaryBinary\nimaginaryHex\ndotOperator\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'decimalGrouped=1234567\nfractionGrouped=12345.6789\nexponentGrouped=105\nleadingDot=0.105\nbinaryInteger=42\nhexInteger=42\noctalInteger=42\nimaginaryDecimal=42i\nimaginaryBinary=42i\nimaginaryHex=42i\ndotOperator=6.5\n1234567\n12345.6789\n105\n0.105\n42\n42\n42\n42i\n42i\n42i\n6.5\n',
        );
    });

    it('Should reject malformed numeric underscore separators before evaluation.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Parse('x = 1_;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 1__2;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 0b10_;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 0b1__0;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 0x2A_;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 0x2__A;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 1e2_;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('x = 1e2__3;')).toThrow(/syntax error/);
    });

    it('Should preserve MATLAB/Octave string quoting, escaping, concatenation, indexing, and transpose semantics.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            "singleText = 'it''s';",
            'doubleText = "say ""hi""";',
            'escapedNewline = "a\\nb";',
            'escapedHex = "A\\x42";',
            'escapedUnicode = "\\u0041";',
            "charConcat = ['a', 'b'];",
            'stringConcat = ["a", "b"];',
            "charColumn = ['a'; 'b'];",
            'charSecond = singleText(2);',
            'stringFirst = doubleText(1);',
            "transposeChar = 'ab'.';",
            'ctransposeString = "ab"\';',
            'builtinTranspose = transpose("ab");',
            'class(singleText); class(doubleText); class(charConcat); class(stringConcat);',
            'singleText; doubleText; escapedNewline; escapedHex; escapedUnicode; charConcat; stringConcat; charColumn; charSecond; stringFirst; transposeChar; ctransposeString; builtinTranspose',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            "singleText=it's\ndoubleText=say \"hi\"\nescapedNewline=a\nb\nescapedHex=AB\nescapedUnicode=A\ncharConcat=[a,b]\nstringConcat=[a,b]\ncharColumn=[a;\nb]\ncharSecond=singleText(2)\nstringFirst=doubleText(1)\ntransposeChar=ab.'\nctransposeString=ab'\nbuiltinTranspose=transpose(ab)\nclass(singleText)\nclass(doubleText)\nclass(charConcat)\nclass(stringConcat)\nsingleText\ndoubleText\nescapedNewline\nescapedHex\nescapedUnicode\ncharConcat\nstringConcat\ncharColumn\ncharSecond\nstringFirst\ntransposeChar\nctransposeString\nbuiltinTranspose\n",
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'singleText=it\'s\ndoubleText=say "hi"\nescapedNewline=a\nb\nescapedHex=AB\nescapedUnicode=A\ncharConcat=ab\nstringConcat=[a,b]\ncharColumn=[a;\nb]\ncharSecond=t\nstringFirst=s\ntransposeChar=[a;\nb]\nctransposeString=[a;\nb]\nbuiltinTranspose=[a;\nb]\nchar\nstring\nchar\nstring\nit\'s\nsay "hi"\na\nb\nAB\nA\nab\n[a,b]\n[a;\nb]\nt\ns\n[a;\nb]\n[a;\nb]\n[a;\nb]\n',
        );
    });

    it('Should keep Octave-specific block endings context-sensitive.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'x = 1;',
            'if x',
            '  ifValue = 2;',
            'endif',
            'w = 0;',
            'while w < 2',
            '  w += 1;',
            'endwhile',
            'total = 0;',
            'for k = 1:3',
            '  total += k;',
            'endfor',
            'p = 0;',
            'parfor n = 1:3',
            '  p += n;',
            'endparfor',
            'spmd',
            '  workerValue = spmdIndex + spmdSize;',
            'endspmd',
            'choice = 2;',
            'switch choice',
            'case 1',
            '  chosen = 10;',
            'case 2',
            '  chosen = 20;',
            'otherwise',
            '  chosen = 30;',
            'endswitch',
            'try',
            '  missingName;',
            'catch ME',
            '  caught = ME.message;',
            'end_try_catch',
            'cleanupValue = 0;',
            'unwind_protect',
            '  cleanupValue = 1;',
            'unwind_protect_cleanup',
            '  cleanupValue = 2;',
            'end_unwind_protect',
            'd = 0;',
            'do',
            '  d += 1;',
            'until d >= 2',
            'ifValue; w; total; p; workerValue; chosen; caught; cleanupValue; d',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toContain('END_TRY_CATCH');
        expect(interpreter.Unparse(interpreter.Parse(source))).toContain('END_UNWIND_PROTECT');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            "x=1\n2\nw=0\n2\ntotal=0\n6\np=0\n6\n2\nchoice=2\n20\n'missingName' undefined.\ncleanupValue=0\n1\nd=0\n2\n2\n2\n6\n6\n2\n20\n'missingName' undefined.\n2\n2\n",
        );
    });

    it('Should reject mismatched Octave-specific block endings.', () => {
        const interpreter = Interpreter.Create();
        const invalidSources = [
            ['if x', '  y = 1;', 'endwhile'].join('\n'),
            ['while x', '  y = 1;', 'endfor'].join('\n'),
            ['for k = 1:3', '  y = k;', 'endswitch'].join('\n'),
            ['switch x', 'case 1', '  y = 1;', 'endif'].join('\n'),
            ['try', '  y = 1;', 'catch', '  y = 2;', 'end_unwind_protect'].join('\n'),
            ['unwind_protect', '  y = 1;', 'unwind_protect_cleanup', '  y = 2;', 'end_try_catch'].join('\n'),
            ['spmd', '  y = 1;', 'endfor'].join('\n'),
            ['parfor k = 1:3', '  y = k;', 'endwhile'].join('\n'),
        ];

        for (const source of invalidSources) {
            expect(() => interpreter.Parse(source)).toThrow(/syntax error/);
        }
    });

    it('Should preserve spmd sequential fallback, worker metadata, worker specifications, and structural restrictions.', () => {
        const interpreter = Interpreter.Create();
        const source = ['count = 0;', 'spmd (count += 1, 2)', '  workerValue = spmdIndex + spmdSize + count;', 'endspmd', 'count; workerValue'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('count=0\nSPMD (count+=1,2)\nworkerValue=spmdIndex+spmdSize+count\n\nENDSPMD\ncount\nworkerValue\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('count=0\n3\n1\n3\n');
        expect(() => interpreter.Execute(['spmd', '  break', 'endspmd'].join('\n'))).toThrow('break is not allowed inside an spmd block.');
        expect(() => interpreter.Execute(['spmd', '  parfor k = 1:2', '    y = k;', '  end', 'end'].join('\n'))).toThrow('parfor is not allowed inside an spmd block.');
        expect(() => interpreter.Execute(['spmd', '  f = @(x) x + 1;', 'end'].join('\n'))).toThrow('anonymous function definitions are not allowed inside an spmd block.');
    });

    it('Should keep switch cases compatible with cell alternatives, text values, inline separators, and command-form bodies.', () => {
        const commandArgs: string[] = [];
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => {
                        commandArgs.push(args.join('|'));
                        return new CharString(args.join('|'));
                    },
                },
            },
        });
        const source = [
            'x = 2;',
            'switch x',
            'case {1, 2, 3}',
            '  numericCase = 10;',
            'case 2',
            '  numericCase = 99;',
            'otherwise',
            '  numericCase = 20;',
            'end',
            'name = "beta";',
            'switch name, case {"alpha", "beta"}, textCase = 30; otherwise, textCase = 40; end',
            "letter = 'z';",
            'fallback = 0;',
            'switch letter',
            "case 'a'",
            '  fallback = 1;',
            'otherwise',
            'end',
            'switch 3',
            'case 1 ...',
            ' + 2',
            '  continuedCase = 50;',
            'end',
            'switch 1',
            'case 1',
            '  cmdprobe case body',
            'end',
            'numericCase; textCase; fallback; continuedCase',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'x=2\nSWITCH x\nCASE {1,2,3}\nnumericCase=10\n\nCASE 2\nnumericCase=99\n\nOTHERWISE\nnumericCase=20\n\nENDSWITCH\nname=beta\nSWITCH name\nCASE {alpha,beta}\ntextCase=30\n\nOTHERWISE\ntextCase=40\n\nENDSWITCH\nletter=z\nfallback=0\nSWITCH letter\nCASE a\nfallback=1\n\nOTHERWISE\n\n\nENDSWITCH\nSWITCH 3\nCASE 1+2\ncontinuedCase=50\n\nENDSWITCH\nSWITCH 1\nCASE 1\ncmdprobe case body\n\nENDSWITCH\nnumericCase\ntextCase\nfallback\ncontinuedCase\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=2\n10\nname=beta\n30\nletter=z\nfallback=0\n50\ncase|body\n10\n30\n0\n50\n');
        expect(commandArgs).toEqual(['case|body']);
    });

    it('Should keep try/catch and unwind_protect compatible across inline forms, error state, and cleanup flow.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'try, error("mathjslab:inline", "inline failed"), catch ME, inlineMessage = ME.message; inlineId = ME.identifier; end_try_catch',
            'try',
            '  error("mathjslab:plain", "plain failed");',
            'catch',
            '  plainError = lasterror();',
            'end',
            'cleanup = 0;',
            'unwind_protect',
            '  cleanup += 1;',
            'unwind_protect_cleanup',
            '  cleanup += 10;',
            'end_unwind_protect',
            'try',
            '  unwind_protect',
            '    cleanup += 100;',
            '    error("mathjslab:protected", "protected failed");',
            '  unwind_protect_cleanup',
            '    cleanup += 1000;',
            '  end',
            'catch protectedError',
            '  protectedMessage = protectedError.message;',
            '  protectedId = protectedError.identifier;',
            'end',
            'function y = cleanupReturnProbe()',
            '  y = 0;',
            '  unwind_protect',
            '    y = 1;',
            '    error("mathjslab:body", "body failed");',
            '  unwind_protect_cleanup',
            '    y = 2;',
            '    return',
            '  end',
            '  y = 3;',
            'end',
            'cleanupReturn = cleanupReturnProbe();',
            'cleanupBreak = 0;',
            'for k = 1:2',
            '  unwind_protect',
            '    error("mathjslab:breakBody", "break body failed");',
            '  unwind_protect_cleanup',
            '    cleanupBreak = k;',
            '    break',
            '  end',
            'end',
            'inlineMessage; inlineId; plainError.message; plainError.identifier; cleanup; protectedMessage; protectedId; cleanupReturn; cleanupBreak',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'TRY\nerror(mathjslab:inline,inline failed)\n\nCATCH ME\ninlineMessage=ME.message\ninlineId=ME.identifier\n\nEND_TRY_CATCH\nTRY\nerror(mathjslab:plain,plain failed)\n\nCATCH\nplainError=lasterror()\n\nEND_TRY_CATCH\ncleanup=0\nUNWIND_PROTECT\ncleanup+=1\n\nUNWIND_PROTECT_CLEANUP\ncleanup+=10\n\nEND_UNWIND_PROTECT\nTRY\nUNWIND_PROTECT\ncleanup+=100\nerror(mathjslab:protected,protected failed)\n\nUNWIND_PROTECT_CLEANUP\ncleanup+=1000\n\nEND_UNWIND_PROTECT\n\nCATCH protectedError\nprotectedMessage=protectedError.message\nprotectedId=protectedError.identifier\n\nEND_TRY_CATCH\nFUNCTION y=cleanupReturnProbe()\ny=0\nUNWIND_PROTECT\ny=1\nerror(mathjslab:body,body failed)\n\nUNWIND_PROTECT_CLEANUP\ny=2\nreturn\n\nEND_UNWIND_PROTECT\ny=3\nENDFUNCTION\ncleanupReturn=cleanupReturnProbe()\ncleanupBreak=0\nFOR k=1:2\nUNWIND_PROTECT\nerror(mathjslab:breakBody,break body failed)\n\nUNWIND_PROTECT_CLEANUP\ncleanupBreak=k\nbreak\n\nEND_UNWIND_PROTECT\n\nENDFOR\ninlineMessage\ninlineId\nplainError.message\nplainError.identifier\ncleanup\nprotectedMessage\nprotectedId\ncleanupReturn\ncleanupBreak\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'inline failed\nmathjslab:inline\nstruct {\nmessage: plain failed\nidentifier: mathjslab:plain\nstack: [ ](0x1)\n}\ncleanup=0\n1\nprotected failed\nmathjslab:protected\ncleanupReturn=2\ncleanupBreak=0\ninline failed\nmathjslab:inline\nplain failed\nmathjslab:plain\n1111\nprotected failed\nmathjslab:protected\n2\n1\n',
        );
    });

    it('Should keep loop forms compatible across column iteration, break/continue, do-until, and parfor fallback.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'rowTotal = 0;',
            'for k = 1:4, if k == 2, continue, endif; rowTotal += k; if k == 3, break, endif; endfor',
            'matrixColumns = [];',
            'for col = [1, 2; 3, 4]',
            '  matrixColumns = [matrixColumns, sum(col)];',
            'end',
            'textCells = {};',
            "for ch = 'ab'",
            '  textCells{end + 1} = ch;',
            'endfor',
            'cellColumns = {};',
            'for item = {1, 2; 3, 4}',
            '  cellColumns{end + 1} = item;',
            'end',
            'pageArray = reshape(1:8, [2, 2, 2]);',
            'pageSums = []; pageColumns = {};',
            'for pageColumn = pageArray',
            '  pageSums(end + 1) = sum(pageColumn);',
            '  pageColumns{end + 1} = pageColumn;',
            'endfor',
            'pageRowArray = reshape(1:4, [1, 2, 2]);',
            'pageRowValues = [];',
            'for pageRowValue = pageRowArray',
            '  pageRowValues(end + 1) = pageRowValue;',
            'endfor',
            'S.alpha = 10; S.beta = 20;',
            'fieldNames = {}; fieldValues = [];',
            'for [value, name] = S',
            '  fieldNames{end + 1} = name;',
            '  fieldValues(end + 1) = value;',
            'endfor',
            'SA = struct("a", {1, 2}, "b", {3, 4});',
            'structArrayNames = {}; structArrayValues = {};',
            'for [value, name] = SA',
            '  structArrayNames{end + 1} = name;',
            '  structArrayValues{end + 1} = value;',
            'endfor',
            'd = 0;',
            'do',
            '  d += 1;',
            'until d >= 2',
            'w = 0;',
            'while true',
            '  w += 1;',
            '  if w < 3, continue, endif',
            '  break',
            'endwhile',
            'parallelTotal = 0;',
            'parfor (p = 1:3, 2)',
            '  parallelTotal += p;',
            'endparfor',
            'rowTotal; matrixColumns; textCells; cellColumns{1}; cellColumns{2}; pageSums; pageColumns{1}; pageColumns{4}; pageRowValues; fieldNames; fieldValues; structArrayNames; structArrayValues; d; w; parallelTotal',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'rowTotal=0\nFOR k=1:4\nIF k==2\ncontinue\n\nENDIF\nrowTotal+=k\nIF k==3\nbreak\n\nENDIF\n\nENDFOR\nmatrixColumns=[ ](0x0)\nFOR col=[1,2;\n3,4]\nmatrixColumns=[matrixColumns,sum(col)]\n\nENDFOR\ntextCells={ }(0x0)\nFOR ch=ab\ntextCells{end+1}=ch\n\nENDFOR\ncellColumns={ }(0x0)\nFOR item={1,2;\n3,4}\ncellColumns{end+1}=item\n\nENDFOR\npageArray=reshape(1:8,[2,2,2])\npageSums=[ ](0x0)\npageColumns={ }(0x0)\nFOR pageColumn=pageArray\npageSums(end+1)=sum(pageColumn)\npageColumns{end+1}=pageColumn\n\nENDFOR\npageRowArray=reshape(1:4,[1,2,2])\npageRowValues=[ ](0x0)\nFOR pageRowValue=pageRowArray\npageRowValues(end+1)=pageRowValue\n\nENDFOR\nS.alpha=10\nS.beta=20\nfieldNames={ }(0x0)\nfieldValues=[ ](0x0)\nFOR [value,name]=S\nfieldNames{end+1}=name\nfieldValues(end+1)=value\n\nENDFOR\nSA=struct(a,{1,2},b,{3,4})\nstructArrayNames={ }(0x0)\nstructArrayValues={ }(0x0)\nFOR [value,name]=SA\nstructArrayNames{end+1}=name\nstructArrayValues{end+1}=value\n\nENDFOR\nd=0\nDO\nd+=1\n\nUNTIL d>=2\nw=0\nWHILE true\nw+=1\nIF w<3\ncontinue\n\nENDIF\nbreak\n\nENDWHILE\nparallelTotal=0\nPARFOR (p=1:3,2)\nparallelTotal+=p\n\nENDPARFOR\nrowTotal\nmatrixColumns\ntextCells\ncellColumns{1}\ncellColumns{2}\npageSums\npageColumns{1}\npageColumns{4}\npageRowValues\nfieldNames\nfieldValues\nstructArrayNames\nstructArrayValues\nd\nw\nparallelTotal\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'rowTotal=0\n1\nmatrixColumns=[ ](0x0)\n[4,6]\ntextCells={ }(0x0)\n{a,b}\ncellColumns={ }(0x0)\n{{1;\n3},{2;\n4}}\npageArray=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n\npageSums=[ ](0x0)\npageColumns={ }(0x0)\n[3,7,11,15]\n{[1;\n2],[3;\n4],[5;\n6],[7;\n8]}\npageRowArray=[1,2] (:,:,1)\n[3,4] (:,:,2)\n\npageRowValues=[ ](0x0)\n[1,2,3,4]\nS=struct {\nalpha: 10\n}\nS=struct {\nalpha: 10\nbeta: 20\n}\nfieldNames={ }(0x0)\nfieldValues=[ ](0x0)\n{alpha,beta}\n[10,20]\nSA=[struct {\na: 1\nb: 3\n},struct {\na: 2\nb: 4\n}]\nstructArrayNames={ }(0x0)\nstructArrayValues={ }(0x0)\n{a,b}\n{[1,2],[3,4]}\nd=0\n2\nw=0\nparallelTotal=0\n6\n4\n[4,6]\n{a,b}\n{1;\n3}\n{2;\n4}\n[3,7,11,15]\n[1;\n2]\n[7;\n8]\n[1,2,3,4]\n{alpha,beta}\n[10,20]\n{a,b}\n{[1,2],[3,4]}\n2\n3\n6\n',
        );
    });

    it('Should reject parfor forms that are incompatible with MATLAB structural restrictions.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute(['parfor [a, b] = [1, 2]', '  x = a;', 'end'].join('\n'))).toThrow('parfor loop variable must be a simple identifier.');
        expect(() => interpreter.Execute(['parfor k = [1, 3]', '  x = k;', 'end'].join('\n'))).toThrow('parfor range must be a row vector of consecutive integer values.');
        expect(() => interpreter.Execute(['parfor k = 1:3', '  break', 'end'].join('\n'))).toThrow('break is not allowed inside a parfor loop.');
        expect(() => interpreter.Execute(['parfor k = 1:3', '  k = 1;', 'end'].join('\n'))).toThrow("assignment to parfor loop variable 'k' is not allowed.");
    });

    it('Should keep global, persistent, and import declarations compatible with MATLAB/Octave forms.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'global shared = 7, other',
            'other = 3;',
            'function y = readshared()',
            '  global shared',
            '  y = shared;',
            'end',
            'function y = bump()',
            '  persistent p = 10, q',
            '  if isempty(q)',
            '    q = 1;',
            '  endif',
            '  y = p + q;',
            '  p += 1;',
            '  q += 1;',
            'end',
            'import pkg.ClassName, pkg.tools.*',
            'importsAsExpression = import;',
            'readshared(); bump(); bump(); other; importsAsExpression',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'global shared=7 other\nother=3\nFUNCTION y=readshared()\nglobal shared\ny=shared\nENDFUNCTION\nFUNCTION y=bump()\npersistent p=10 q\nIF isempty(q)\nq=1\n\nENDIF\ny=p+q\np+=1\nq+=1\nENDFUNCTION\nimport pkg.ClassName pkg.tools.*\nimportsAsExpression=(import)\nreadshared()\nbump()\nbump()\nother\nimportsAsExpression\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('other=3\nimportsAsExpression={pkg.ClassName;\npkg.tools.*}\n7\n11\n13\n3\n{pkg.ClassName;\npkg.tools.*}\n');
    });

    it('Should keep clear forms compatible across variables, functions, and base imports.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'x = 1; y = 2;',
                'function z = clearLocalFunc(), z = 3; end',
                'import pkg.ClearProbe',
                "before = [exist('x','var'), exist('clearLocalFunc','function')];",
                'clear x',
                "afterVar = exist('x','var');",
                'clear functions',
                "afterFunc = exist('clearLocalFunc','function');",
                'clear import',
                'importsAfter = import;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('y; before; afterVar; afterFunc; importsAfter'))).toBe('2\n[1,2]\n0\n0\n{ }(0x1)\n');
        expect(() => interpreter.Execute(['function y = invalidClearImport()', '  import pkg.ClearProbe', '  clear import', '  y = 1;', 'end', 'invalidClearImport()'].join('\n'))).toThrow(
            'clear import is not allowed inside a function or script.',
        );
    });

    it('Should keep clear global and clear all compatible across workspace categories.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'global g h',
            'g = 10; h = 20; x = 1;',
            "before = [exist('g','var'), exist('h','var'), exist('x','var')];",
            'clear global g',
            "afterOne = [exist('g','var'), exist('h','var'), exist('x','var')];",
            'before; afterOne; h',
            'clear all',
            "afterAllG = exist('g','var'); afterAllX = exist('x','var');",
            'afterAllG; afterAllX',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('g=10\nh=20\nx=1\nbefore=[1,1,1]\nafterOne=[0,1,1]\n[1,1,1]\n[0,1,1]\n20\nafterAllG=0\nafterAllX=0\n0\n0\n');
    });

    it('Should report workspace variables with who and whos patterns in function and command forms.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            "alpha = 1; betaValue = [1,2]; betaText = 'hi'; clearMeA = 10; clearMeB = 20; keepMe = 30; z = 1+2i;",
            'global globalWhoProbe; globalWhoProbe = 7;',
            "betaNames = who('beta*');",
            "betaInfo = whos('betaText', 'betaValue');",
            "missingInfo = whos('missingWhoValue');",
            "complexInfo = whos('z');",
            "globalInfo = whos('globalWhoProbe');",
            'clear clearMe*',
            "afterClear = [exist('clearMeA','var'), exist('clearMeB','var'), exist('keepMe','var')];",
            'betaNames; betaInfo(1).name; betaInfo(2).name; betaInfo(1).size; betaInfo(2).class; size(missingInfo); complexInfo.complex; globalInfo.global; afterClear',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'alpha=1\nbetaValue=[1,2]\nbetaText=hi\nclearMeA=10\nclearMeB=20\nkeepMe=30\nz=1+2i\nglobalWhoProbe=7\nbetaNames={betaText;\nbetaValue}\nbetaInfo=[struct {\nname: betaText\nsize: [1,2]\nbytes: 4\nclass: char\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n};\nstruct {\nname: betaValue\nsize: [1,2]\nbytes: 32\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\nmissingInfo=[ ](0x1)\ncomplexInfo=[struct {\nname: z\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: true\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\nglobalInfo=[struct {\nname: globalWhoProbe\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: true\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\nafterClear=[0,0,1]\n{betaText;\nbetaValue}\nbetaText\nbetaValue\n[1,2]\ndouble\n[0,1]\ntrue\ntrue\n[0,0,1]\n',
        );

        const commandInterpreter = Interpreter.Create();
        expect(commandInterpreter.Unparse(commandInterpreter.Parse('betaA = 1; betaB = 2; who beta*; whos betaA'))).toBe('betaA=1\nbetaB=2\nwho beta*\nwhos betaA\n');
        expect(commandInterpreter.Unparse(commandInterpreter.Execute('betaA = 1; betaB = 2; who beta*; whos betaA'))).toBe(
            'betaA=1\nbetaB=2\n{betaA;\nbetaB}\n[struct {\nname: betaA\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\n',
        );
    });

    it('Should honor who and whos global and regexp listing options.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'global gAlpha gBeta',
            'gAlpha = 1; gBeta = 2; localA = 3; alpha = 4; ax = 5; beta = 6;',
            "globalNames = who('global');",
            "globalPattern = who('global', 'gA*');",
            "regexpNames = who('-regexp', '^a');",
            "regexpInfo = whos('-regexp', '^a');",
            'regexpInfoNames = {regexpInfo.name};',
            'regexpInfoBytes = [regexpInfo.bytes];',
            'globalNames; globalPattern; regexpNames; regexpInfoNames; regexpInfoBytes',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'gAlpha=1\ngBeta=2\nlocalA=3\nalpha=4\nax=5\nbeta=6\nglobalNames={gAlpha;\ngBeta}\nglobalPattern={gAlpha}\nregexpNames={alpha;\nax}\nregexpInfo=[struct {\nname: alpha\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n};\nstruct {\nname: ax\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\nregexpInfoNames={alpha,ax}\nregexpInfoBytes=[16,16]\n{gAlpha;\ngBeta}\n{gAlpha}\n{alpha;\nax}\n{alpha,ax}\n[16,16]\n',
        );

        const commandInterpreter = Interpreter.Create();
        expect(commandInterpreter.Unparse(commandInterpreter.Execute('global gAlpha gBeta; gAlpha = 1; gBeta = 2; localA = 3; who global; whos global'))).toBe(
            'gAlpha=1\ngBeta=2\nlocalA=3\n{gAlpha;\ngBeta}\n[struct {\nname: gAlpha\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: true\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n};\nstruct {\nname: gBeta\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: true\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\n',
        );
        expect(() => commandInterpreter.Execute('who -file sample.mat')).toThrow('who: MAT-file workspace listing is not supported in the browser runtime.');
        expect(() => commandInterpreter.Execute("whos('-file', 'sample.mat')")).toThrow('whos: MAT-file workspace listing is not supported in the browser runtime.');
    });

    it('Should expose lexer keywords and MATLAB-compatible name predicates.', () => {
        const interpreter = Interpreter.Create();
        const tooLongName = 'a' + 'x'.repeat(63);
        const source = [
            'global g h; g = 1; x = 2;',
            'kw = iskeyword();',
            "tfKeyword = [iskeyword('for'), iskeyword('endfor'), iskeyword('arguments'), iskeyword('notakey')];",
            "tfNames = [isvarname('alpha_1'), isvarname('1alpha'), isvarname('_alpha'), isvarname('end'), isvarname('classdef')];",
            `longTooLong = isvarname('${tooLongName}');`,
            "cellNames = isvarname({'alpha', '1alpha'; 'for', 'beta_2'});",
            "globalFlags = [isglobal('g'), isglobal('x'), isglobal('missing')];",
            "globalCellFlags = isglobal({'g', 'x'; 'missing', 'h'});",
            'nmax = namelengthmax();',
            'kw(1:5); tfKeyword; tfNames; longTooLong; cellNames; globalFlags; globalCellFlags; isglobal g; isglobal x; nmax',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'g=1\nx=2\nkw={arguments;\nbreak;\ncase;\ncatch;\nclassdef;\ncontinue;\ndo;\nelse;\nelseif;\nend;\nend_try_catch;\nend_unwind_protect;\nendarguments;\nendclassdef;\nendenumeration;\nendevents;\nendfor;\nendfunction;\nendif;\nendmethods;\nendparfor;\nendproperties;\nendspmd;\nendswitch;\nendwhile;\nenumeration;\nevents;\nfor;\nfunction;\nglobal;\nif;\nimport;\nmethods;\notherwise;\nparfor;\npersistent;\nproperties;\nreturn;\nspmd;\nswitch;\ntry;\nuntil;\nunwind_protect;\nunwind_protect_cleanup;\nwhile}\ntfKeyword=[true,true,true,false]\ntfNames=[true,false,false,false,false]\nlongTooLong=false\ncellNames=[true,false;\nfalse,true]\nglobalFlags=[true,false,false]\nglobalCellFlags=[true,false;\nfalse,true]\nnmax=63\n{arguments;\nbreak;\ncase;\ncatch;\nclassdef}\n[true,true,true,false]\n[true,false,false,false,false]\nfalse\n[true,false;\nfalse,true]\n[true,false,false]\n[true,false;\nfalse,true]\ntrue\nfalse\n63\n',
        );
        expect(() => interpreter.Execute('iskeyword(1,2)')).toThrow('Invalid call to iskeyword.');
        expect(() => interpreter.Execute('isvarname()')).toThrow('Invalid call to isvarname.');
        expect(() => interpreter.Execute('isglobal()')).toThrow('Invalid call to isglobal.');
    });

    it('Should keep name-resolution commands compatible with variables, handles, built-ins, and quoted words.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'x = 1; f = @sin;',
            "codes = [exist('x','var'), exist('f','var'), exist('sin','builtin'), exist('sin','file'), exist('classdef','builtin')];",
            'whichF = which(f);',
            'whichBuiltin = which(@sin);',
            'which isglobal',
            'exist x var; exist \'x\' \'var\'; exist "sin" "builtin"',
            'codes; whichF; whichBuiltin',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'x=1\nf=@sin\ncodes=[1,1,5,5,0]\nwhichF=sin is a built-in function\nwhichBuiltin=sin is a built-in function\nisglobal is a built-in function\n1\n1\n5\n[1,1,5,5,0]\nsin is a built-in function\nsin is a built-in function\n',
        );
    });

    it('Should keep command-form built-ins compatible with raw word-list arguments.', () => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                'scripts/commandformscript.m': 'commandRunValue = commandRunSeed + 1;',
                commandSourceScript: 'commandSourceValue = commandSourceSeed + 2;',
            },
        });
        const source = [
            'commandRunSeed = 10;',
            'run scripts/commandformscript.m',
            'function y = commandSourceOuter()',
            '  commandSourceSeed = 20;',
            '  commandSourceHelper();',
            '  y = commandSourceValue;',
            'end',
            'function commandSourceHelper()',
            '  source commandSourceScript caller',
            'end',
            'sourceValue = commandSourceOuter();',
            'alphaCmd = 1; betaCmd = 2; global commandGlobalCmd; commandGlobalCmd = 3;',
            'who *Cmd;',
            "names = who('*Cmd');",
            "infos = whos('-regexp', '^(alpha|beta)Cmd$');",
            'isglobal commandGlobalCmd;',
            'exist commandRunValue var;',
            'which sin;',
            "keywordFlag = iskeyword('for');",
            "varFlag = isvarname('alphaCmd');",
            "globalFlag = isglobal('commandGlobalCmd');",
            "existFlag = exist('commandRunValue', 'var');",
            "whichText = which('sin');",
            'commandRunValue; sourceValue; names; {infos.name}; keywordFlag; varFlag; globalFlag; existFlag; whichText',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'commandRunSeed=10\ncommandRunValue=11\nsourceValue=22\nalphaCmd=1\nbetaCmd=2\ncommandGlobalCmd=3\n{alphaCmd;\nbetaCmd;\ncommandGlobalCmd}\nnames={alphaCmd;\nbetaCmd;\ncommandGlobalCmd}\ninfos=[struct {\nname: alphaCmd\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n};\nstruct {\nname: betaCmd\nsize: [1,1]\nbytes: 16\nclass: double\nglobal: false\nsparse: false\ncomplex: false\nnesting: struct {\nfunction: \nlevel: 0\n}\npersistent: false\n}]\ntrue\n1\nsin is a built-in function\nkeywordFlag=true\nvarFlag=true\nglobalFlag=true\nexistFlag=1\nwhichText=sin is a built-in function\n11\n22\n{alphaCmd;\nbetaCmd;\ncommandGlobalCmd}\n{alphaCmd,betaCmd}\ntrue\ntrue\ntrue\n1\nsin is a built-in function\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('run = 1; run += 2; source = 3; source += 4; exist = 5; which = 6; [run, source, exist, which]'))).toBe(
            'run=1\nrun=3\nsource=3\nsource=7\nexist=5\nwhich=6\n[3,7,5,6]\n',
        );
    });

    it('Should report browser-hosted virtual source directories through exist and which.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                '+pkg/+conf/dirfun.m': ['function y = dirfun(x)', '  y = x + 1;', 'end'].join('\n'),
            },
            scriptSourceTable: {
                'scripts/startup.m': 'scriptDirValue = 42;',
            },
            classSourceTable: {
                '+pkg/@DirBox/DirBox.m': ['classdef DirBox', '  properties', '    Value = 9;', '  end', 'end'].join('\n'),
            },
        });
        const source = [
            "dirCodes = [exist('pkg','dir'), exist('+pkg','dir'), exist('pkg.conf','dir'), exist('scripts','dir'), exist('missing','dir')];",
            "fileCodes = [exist('pkg','file'), exist('scripts','file'), exist('pkg.conf.dirfun','file'), exist('startup','file'), exist('pkg.DirBox','class')];",
            "whichPkg = which('pkg');",
            "whichScripts = which('scripts');",
            'pkg.conf.dirfun(4);',
            "run('startup');",
            'box = pkg.DirBox();',
            'dirCodes; fileCodes; whichPkg; whichScripts; scriptDirValue; box.Value',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'dirCodes=[7,7,7,7,0]\nfileCodes=[7,7,2,2,8]\nwhichPkg=pkg is a folder\nwhichScripts=scripts is a folder\n5\nscriptDirValue=42\nbox=pkg.DirBox object with properties: Value\n[7,7,7,7,0]\n[7,7,2,2,8]\npkg is a folder\nscripts is a folder\n42\n9\n',
        );
    });

    it('Should report virtual script identities through mfilename and script-created handles.', () => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                'scripts/identityscript.m': [
                    'scriptSimple = mfilename();',
                    "scriptFull = mfilename('fullpath');",
                    'scriptClass = mfilename("class");',
                    'scriptFallback = mfilename("notAnOption");',
                    'scriptHandleSimple = @() mfilename();',
                    'scriptHandleFull = @() mfilename("fullpath");',
                    'scriptHandleInfo = functions(scriptHandleSimple);',
                ].join('\n'),
                sourceIdentity: {
                    sourceName: 'virtual/sourceidentity.m',
                    source: [
                        'sourceSimple = mfilename();',
                        'sourceFull = mfilename("fullpath");',
                        'sourceFallback = mfilename("anythingElse");',
                        'sourceHandle = @() mfilename("fullpath");',
                    ].join('\n'),
                },
            },
        });
        interpreter.Execute(['run("identityscript");', 'source("sourceIdentity", "caller");'].join('\n'));

        expect(
            interpreter.Unparse(
                interpreter.Execute(
                    'scriptSimple; scriptFull; scriptClass; scriptFallback; scriptHandleSimple(); scriptHandleFull(); scriptHandleInfo.file; sourceSimple; sourceFull; sourceFallback; sourceHandle()',
                ),
            ),
        ).toBe(
            'identityscript\nscripts/identityscript.m\n\nidentityscript\nidentityscript\nscripts/identityscript.m\nscripts/identityscript.m\nsourceidentity\nvirtual/sourceidentity.m\nsourceidentity\nvirtual/sourceidentity.m\n',
        );
    });

    it('Should preserve dbstack multi-output, skip options, and virtual script-local files.', () => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                'scripts/stackscript.m': [
                    '[scriptStack, scriptIndex] = stackscriptcaller();',
                    '[scriptSkip, scriptSkipIndex] = stackscriptcaller(true);',
                    'function [stack, index] = stackscriptcaller(varargin)',
                    '  if nargin == 0',
                    '    skipLeaf = false;',
                    '  else',
                    '    skipLeaf = varargin{1};',
                    '  end',
                    '  [stack, index] = stackscriptleaf(skipLeaf);',
                    'end',
                    'function [stack, index] = stackscriptleaf(skipLeaf)',
                    '  if skipLeaf',
                    "    [stack, index] = dbstack('-completenames', 1);",
                    '  else',
                    "    [stack, index] = dbstack('-completenames');",
                    '  end',
                    'end',
                ].join('\n'),
            },
        });
        interpreter.Execute(
            [
                'function [stack, index] = dbstackTopCaller()',
                '  [stack, index] = dbstackTopLeaf();',
                'end',
                'function [stack, index] = dbstackTopLeaf()',
                "  [stack, index] = dbstack('-completenames');",
                'end',
                '[topStack, topIndex] = dbstackTopCaller();',
                'run("stackscript");',
            ].join('\n'),
        );

        expect(
            interpreter.Unparse(
                interpreter.Execute(
                    'topStack(1).name; topStack(2).name; topIndex; topStack(1).line > 0; scriptStack(1).name; scriptStack(1).file; scriptStack(2).name; scriptIndex; scriptSkip(1).name; scriptSkip(1).file; scriptSkipIndex',
                ),
            ),
        ).toBe('dbstackTopLeaf\ndbstackTopCaller\n1\ntrue\nstackscriptleaf\nscripts/stackscript.m\nstackscriptcaller\n1\nstackscriptcaller\nscripts/stackscript.m\n1\n');
    });

    it('Should reject declaration placements that MATLAB/Octave reserve for specific scopes.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('persistent topLevel')).toThrow('persistent declaration is only valid inside a function.');
        expect(() => interpreter.Execute(['if true', '  import pkg.Hidden', 'end'].join('\n'))).toThrow('import declaration is not allowed inside a control block.');
        expect(() => interpreter.Execute(['parfor k = 1:3', '  global g', 'end'].join('\n'))).toThrow('global declarations are not allowed inside a parfor loop.');
        expect(() => interpreter.Execute(['function y = badpersistent()', '  parfor k = 1:3', '    persistent p', '  end', '  y = 1;', 'end', 'badpersistent()'].join('\n'))).toThrow(
            'persistent declarations are not allowed inside a parfor loop.',
        );
        expect(() => interpreter.Execute(['spmd', '  import pkg.Hidden', 'end'].join('\n'))).toThrow('import declaration is not allowed inside a control block.');
    });

    it('Should resolve qualified names, package imports, function handles, metaclasses, and static methods.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.meta.MetaBox': [
                    'classdef MetaBox',
                    '  properties',
                    '    Value = 5;',
                    '  end',
                    '  methods (Static)',
                    '    function y = scale(x)',
                    '      y = x * 10;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            },
            functionSourceTable: {
                'pkg.math.shift': ['function y = shift(x)', '  y = x + 1;', 'end'].join('\n'),
                'pkg.math.twice': ['function y = twice(x)', '  y = x * 2;', 'end'].join('\n'),
            },
        });
        const source = [
            'directHandle = @pkg.math.shift;',
            'qualifiedFunction = pkg.math.twice(3);',
            'viaDirectHandle = directHandle(4);',
            'import pkg.math.*',
            'viaWildcard = shift(5);',
            'wildcardHandle = @shift;',
            'viaWildcardHandle = wildcardHandle(6);',
            'import pkg.meta.MetaBox',
            'box = MetaBox();',
            'qualifiedMeta = ?pkg.meta.MetaBox;',
            'importedMeta = ?MetaBox;',
            'staticDirect = pkg.meta.MetaBox.scale(2);',
            'import pkg.meta.MetaBox.scale',
            'staticImported = scale(3);',
            'qualifiedMeta.Name; importedMeta.Name;',
            'result = [qualifiedFunction, viaDirectHandle, viaWildcard, viaWildcardHandle, box.Value, staticDirect, staticImported];',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'directHandle=@pkg.math.shift\nqualifiedFunction=pkg.math.twice(3)\nviaDirectHandle=directHandle(4)\nimport pkg.math.*\nviaWildcard=shift(5)\nwildcardHandle=@shift\nviaWildcardHandle=wildcardHandle(6)\nimport pkg.meta.MetaBox\nbox=MetaBox()\nqualifiedMeta=(?pkg.meta.MetaBox)\nimportedMeta=(?MetaBox)\nstaticDirect=pkg.meta.MetaBox.scale(2)\nimport pkg.meta.MetaBox.scale\nstaticImported=scale(3)\nqualifiedMeta.Name\nimportedMeta.Name\nresult=[qualifiedFunction,viaDirectHandle,viaWildcard,viaWildcardHandle,box.Value,staticDirect,staticImported]\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'directHandle=@pkg.math.shift\nqualifiedFunction=6\nviaDirectHandle=5\nviaWildcard=6\nwildcardHandle=@shift\nviaWildcardHandle=7\nbox=pkg.meta.MetaBox object with properties: Value\nqualifiedMeta=meta.class pkg.meta.MetaBox\nimportedMeta=meta.class pkg.meta.MetaBox\nstaticDirect=20\nstaticImported=30\npkg.meta.MetaBox\npkg.meta.MetaBox\nresult=[6,5,6,7,5,20,30]\n',
        );
        expect(() => interpreter.Execute('missingMeta = ?missing.Nope;')).toThrow("metaclass: class 'missing.Nope' is not defined.");
    });

    it('Should preserve local function lookup metadata, handles, and signed varargin/nargout counts.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = sourceLocal(x), y = x + 1; end',
            'function [a, b, varargout] = ioProbe(x, varargin)',
            '  a = nargin; b = nargout;',
            '  for k = 1:nargout-2, varargout{k} = x + k; end',
            'end',
            "f = str2func('sourceLocal');",
            'meta = functions(f);',
            "w = which('sourceLocal');",
            "e = exist('sourceLocal','file');",
            'r = f(4);',
            "ni = nargin('ioProbe'); no = nargout('ioProbe');",
            '[a,b,c] = ioProbe(10,20,30);',
            'meta.function; meta.type; w; e; r; ni; no; a; b; c',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'f=@sourceLocal\nmeta=struct {\nfunction: sourceLocal\ntype: simple\nfile: \nworkspace: { }(0x0)\n}\nw=sourceLocal is a user-defined function\ne=2\nr=5\nni=-2\nno=-3\na=3\nb=3\nc=11\nsourceLocal\nsimple\nsourceLocal is a user-defined function\n2\n5\n-2\n-3\n3\n3\n11\n',
        );
    });

    it('Should keep classdef runtime behavior compatible across inheritance, accessors, imports, static methods, and introspection.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'conf.BaseBox': [
                    'classdef BaseBox',
                    '  properties',
                    '    BaseValue = 3;',
                    '  end',
                    '  methods',
                    '    function y = baseRead(obj)',
                    '      y = obj.BaseValue;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
                'conf.ChildBox': [
                    'classdef ChildBox < conf.BaseBox',
                    '  properties (Access = private)',
                    '    Stored = 5;',
                    '  end',
                    '  properties (Dependent)',
                    '    Value',
                    '  end',
                    '  methods',
                    '    function y = get.Value(obj)',
                    '      y = obj.Stored + obj.BaseValue;',
                    '    end',
                    '    function obj = set.Value(obj, value)',
                    '      obj.Stored = value - obj.BaseValue;',
                    '    end',
                    '    function y = scale(obj, factor)',
                    '      y = obj.Value * factor;',
                    '    end',
                    '  end',
                    '  methods (Static)',
                    '    function y = make(value)',
                    '      obj = conf.ChildBox();',
                    '      obj.Value = value;',
                    '      y = obj;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            },
        });
        const source = [
            'import conf.ChildBox',
            'obj = ChildBox();',
            'initial = obj.Value;',
            'base = obj.baseRead();',
            'obj.Value = 20;',
            'updated = obj.Value;',
            'scaled = obj.scale(2);',
            'made = conf.ChildBox.make(30);',
            'madeValue = made.Value;',
            'className = class(obj);',
            'isChild = isa(obj, "conf.ChildBox");',
            'isBase = isa(obj, "conf.BaseBox");',
            'propNames = properties(obj);',
            'methodNames = methods(obj);',
            'superNames = superclasses(obj);',
            'metaName = metaclass(obj).Name;',
            'initial; base; updated; scaled; madeValue; className; isChild; isBase; propNames; methodNames; superNames; metaName',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'import conf.ChildBox\nobj=ChildBox()\ninitial=obj.Value\nbase=obj.baseRead()\nobj.Value=20\nupdated=obj.Value\nscaled=obj.scale(2)\nmade=conf.ChildBox.make(30)\nmadeValue=made.Value\nclassName=class(obj)\nisChild=isa(obj,conf.ChildBox)\nisBase=isa(obj,conf.BaseBox)\npropNames=properties(obj)\nmethodNames=methods(obj)\nsuperNames=superclasses(obj)\nmetaName=metaclass(obj).Name\ninitial\nbase\nupdated\nscaled\nmadeValue\nclassName\nisChild\nisBase\npropNames\nmethodNames\nsuperNames\nmetaName\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=conf.ChildBox object with properties: BaseValue,Stored\ninitial=8\nbase=3\nobj=conf.ChildBox object with properties: BaseValue,Stored\nupdated=20\nscaled=40\nmade=conf.ChildBox object with properties: BaseValue,Stored\nmadeValue=30\nclassName=conf.ChildBox\nisChild=true\nisBase=true\npropNames={BaseValue;\nValue}\nmethodNames={baseRead;\nget.Value;\nmake;\nscale;\nset.Value}\nsuperNames={conf.BaseBox}\nmetaName=conf.ChildBox\n8\n3\n20\n40\n30\nconf.ChildBox\ntrue\ntrue\n{BaseValue;\nValue}\n{baseRead;\nget.Value;\nmake;\nscale;\nset.Value}\n{conf.BaseBox}\nconf.ChildBox\n',
        );
    });

    it('Should keep class events, property listeners, listener deletion, and event data compatible.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'global eventCount lastEvent lastClass lastProperty lastAffected',
                'eventCount = 0;',
                'function recordEvent(src, eventData)',
                '  global eventCount lastEvent lastClass',
                '  eventCount = eventCount + 1;',
                '  lastEvent = eventData.EventName;',
                '  lastClass = class(eventData);',
                'end',
                'function recordPropertyEvent(src, eventData)',
                '  global eventCount lastEvent lastClass lastProperty lastAffected',
                '  eventCount = eventCount + 1;',
                '  lastEvent = eventData.EventName;',
                '  lastClass = class(eventData);',
                '  lastProperty = eventData.PropertyName;',
                '  lastAffected = class(eventData.AffectedObject);',
                'end',
                'classdef ConfEventSource < handle',
                '  events',
                '    Changed',
                '  end',
                '  properties (SetObservable)',
                '    Value = 1;',
                '  end',
                '  methods',
                "    function fire(obj), notify(obj, 'Changed'); end",
                '  end',
                'end',
                's = ConfEventSource();',
                "listener = addlistener(s, 'Changed', @recordEvent);",
                's.fire();',
                'enabledAfterFire = listener.Enabled;',
                'listener.Enabled = false;',
                's.fire();',
                'disabledCount = eventCount;',
                'listener.Enabled = true;',
                "addlistener(s, 'Value', @recordPropertyEvent);",
                's.Value = 5;',
                'delete(listener);',
                'validAfterDelete = isvalid(listener);',
                's.fire();',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('eventCount; lastEvent; lastClass; lastProperty; lastAffected; enabledAfterFire; disabledCount; validAfterDelete'))).toBe(
            '2\nValue\nevent.PropertyEvent\nValue\nConfEventSource\ntrue\n1\nfalse\n',
        );
        expect(() => interpreter.Execute('listener.Enabled')).toThrow('invalid or deleted event listener.');
    });

    it('Should validate class property defaults and assignments with MATLAB arguments-style validators.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'classdef ConfValidatedProperty < handle',
                '  properties',
                '    Value (1,2) double {mustBePositive} = [1, 2];',
                '  end',
                'end',
                'obj = ConfValidatedProperty();',
                'initial = obj.Value;',
                'obj.Value = [3, 4];',
                'updated = obj.Value;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('initial; updated'))).toBe('[1,2]\n[3,4]\n');
        expect(() => interpreter.Execute('obj.Value = [-1, 2]')).toThrow("property validation failed for 'Value': mustBePositive.");
        expect(() => interpreter.Execute('obj.Value = [1; 2]')).toThrow("property validation failed for 'Value': expected size 1x2, got 2x1.");
    });

    it('Should bind constructor arguments blocks with defaults, validators, and Octave colon markers.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef BatchCtorArgs',
            '  properties',
            '    Value = 0;',
            '  end',
            '  methods',
            '    function obj = BatchCtorArgs(x, opts)',
            '      arguments',
            '        x (1,1) double {mustBePositive} = 2',
            '        opts.Scale (1,1) double {mustBePositive} = 3',
            '      end',
            '      obj.Value = x * opts.Scale;',
            '    end',
            '  end',
            'end',
            'a = BatchCtorArgs(); b = BatchCtorArgs(5); c = BatchCtorArgs(:, Scale=4); d = BatchCtorArgs(5, Scale=4);',
            '[a.Value,b.Value,c.Value,d.Value]',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=BatchCtorArgs object with properties: Value\nb=BatchCtorArgs object with properties: Value\nc=BatchCtorArgs object with properties: Value\nd=BatchCtorArgs object with properties: Value\n[6,15,8,20]\n',
        );
        expect(() => interpreter.Execute('BatchCtorArgs(-1)')).toThrow("arguments block validation failed for 'x': mustBePositive.");
        expect(() => interpreter.Execute('BatchCtorArgs(1, Scale=-1)')).toThrow("arguments block validation failed for 'opts.Scale': mustBePositive.");
    });

    it('Should read and write dependent and explicit accessor properties together.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef BatchAccessor < handle',
            '  properties',
            '    Storage = 3;',
            '  end',
            '  properties (Dependent)',
            '    Area',
            '  end',
            '  properties (GetMethod = readValue, SetMethod = writeValue)',
            '    Value',
            '  end',
            '  methods',
            '    function y = get.Area(obj), y = obj.Storage * obj.Storage; end',
            '    function obj = set.Area(obj, value), obj.Storage = value / 2; end',
            '    function y = readValue(obj), y = obj.Storage * 2; end',
            '    function obj = writeValue(obj, value), obj.Storage = value + 1; end',
            '  end',
            'end',
            'obj = BatchAccessor(); a = obj.Area; obj.Area = 10; b = obj.Storage; c = obj.Value; obj.Value = 20; d = obj.Storage; e = obj.Value;',
            '[a,b,c,d,e]',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=BatchAccessor object with properties: Storage,Value\na=9\nobj=BatchAccessor object with properties: Storage,Value\nb=5\nc=10\nobj=BatchAccessor object with properties: Storage,Value\nd=21\ne=42\n[9,5,10,21,42]\n',
        );
    });

    it('Should enforce private and class-qualified friend access for class members.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'classdef ConfAccessBox < handle',
                '  properties (Access = private)',
                '    Secret = 7;',
                '  end',
                '  methods (Access = private)',
                '    function y = hidden(obj), y = obj.Secret + 1; end',
                '  end',
                '  methods',
                '    function y = reveal(obj), y = obj.hidden(); end',
                '  end',
                'end',
                'classdef ConfFriendTarget < handle',
                '  properties (GetAccess = ?ConfFriendAccessor, SetAccess = ?ConfFriendAccessor)',
                '    Value = 8;',
                '  end',
                'end',
                'classdef ConfFriendAccessor',
                '  methods',
                '    function y = read(obj, target), y = target.Value; end',
                '    function set(obj, target, value), target.Value = value; end',
                '  end',
                'end',
                'box = ConfAccessBox();',
                'value = box.reveal();',
                'target = ConfFriendTarget();',
                'friend = ConfFriendAccessor();',
                'before = friend.read(target);',
                'friend.set(target, 19);',
                'after = friend.read(target);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('value; before; after'))).toBe('8\n8\n19\n');
        expect(() => interpreter.Execute('box.Secret')).toThrow("property 'Secret' has private get access for class ConfAccessBox.");
        expect(() => interpreter.Execute('box.hidden()')).toThrow("method 'hidden' has private access for class ConfAccessBox.");
        expect(() => interpreter.Execute('target.Value')).toThrow("property 'Value' has ?ConfFriendAccessor get access for class ConfFriendTarget.");
        expect(() => interpreter.Execute('target.Value = 20')).toThrow("property 'Value' has ?ConfFriendAccessor set access for class ConfFriendTarget.");
    });

    it('Should resolve enumeration values and expose enumeration metadata.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'classdef ConfEnumSimple',
                '  enumeration',
                '    Small',
                '    Large',
                '  end',
                'end',
                'x = ConfEnumSimple.Small;',
                "names = enumeration('ConfEnumSimple');",
                'className = class(x);',
                "isEnum = isa(x, 'ConfEnumSimple');",
                'metaName = metaclass(x).Name;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('x; names; className; isEnum; metaName'))).toBe('ConfEnumSimple.Small\n{Large;\nSmall}\nConfEnumSimple\ntrue\nConfEnumSimple\n');
    });

    it('Should expose metaclass property, method, event, and constant metadata.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'classdef ConfMetaShape < handle',
                '  properties (Constant)',
                '    Fixed = 4;',
                '  end',
                '  properties',
                '    Value = 5;',
                '  end',
                '  methods',
                '    function y = area(obj), y = obj.Value * obj.Value; end',
                '  end',
                '  events',
                '    Changed',
                '  end',
                'end',
                'mc = ?ConfMetaShape;',
                'name = mc.Name;',
                'propCount = rows(mc.PropertyList);',
                "methodNames = methods('ConfMetaShape');",
                "eventNames = events('ConfMetaShape');",
                'fixed = ConfMetaShape.Fixed;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('name; propCount; methodNames; eventNames; fixed'))).toBe('ConfMetaShape\n2\n{area}\n{Changed}\n4\n');
    });

    it('Should parse nested local functions in function bodies.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = outer(x)', '  function z = inner(t)', '    z = t + 1;', '  end', '  y = inner(x);', 'end', 'outer(4)'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION y=outer(x)\nFUNCTION z=inner(t)\nz=t+1\nENDFUNCTION\ny=inner(x)\nENDFUNCTION\nouter(4)\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('5\n');
    });

    it('Should parse Octave-compatible local function forms and endings.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = inlinecomma(x), y = x + 1; end',
            'function y = inlinesemi(x); y = x + 1; end',
            'function y = inlineplain(x) y = x + 1; end',
            'function y = explicitend(x)',
            '  y = x + 1;',
            'endfunction',
            'function y = localbase(x)',
            '  y = x + 1;',
            'end',
            'function z = localcaller(x)',
            '  z = localbase(x) + 1;',
            'end',
            'inlinecomma(2)',
            'inlinesemi(2)',
            'inlineplain(2)',
            'explicitend(2)',
            'localcaller(2)',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'FUNCTION y=inlinecomma(x)\ny=x+1\nENDFUNCTION\nFUNCTION y=inlinesemi(x)\ny=x+1\nENDFUNCTION\nFUNCTION y=inlineplain(x)\ny=x+1\nENDFUNCTION\nFUNCTION y=explicitend(x)\ny=x+1\nENDFUNCTION\nFUNCTION y=localbase(x)\ny=x+1\nENDFUNCTION\nFUNCTION z=localcaller(x)\nz=localbase(x)+1\nENDFUNCTION\ninlinecomma(2)\ninlinesemi(2)\ninlineplain(2)\nexplicitend(2)\nlocalcaller(2)\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('3\n3\n3\n3\n4\n');
    });

    it('Should allow EOF to close a trailing local function definition.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = eofclosed(x)', '  y = x + 1;'].join('\n');
        const expected = 'FUNCTION y=eofclosed(x)\ny=x+1\nENDFUNCTION\n';

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(expected);
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(expected);
    });

    it('Should reject a function ending token used to close an inner block.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = badending(x)', '  if x', '    y = 1;', '  endfunction'].join('\n');

        expect(() => interpreter.Parse(source)).toThrow(/syntax error/);
    });

    it('Should preserve ignored outputs and parameters across function signatures and assignments.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function [a, ~, c] = ignoredReturn()',
            '  a = 1;',
            '  c = 3;',
            'end',
            'function y = second(~, x)',
            '  y = x;',
            'end',
            'function [first, varargout] = repeatingReturns()',
            '  first = 10;',
            '  varargout{1} = 20;',
            '  varargout{2} = 30;',
            'end',
            '[x, middle, z] = ignoredReturn();',
            '[left, ~, right] = deal(4, 5, 6);',
            '[head, tail1, tail2] = repeatingReturns();',
            'second(99, 42); x; middle; z; left; right; head; tail1; tail2',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'FUNCTION [a,~,c]=ignoredReturn()\na=1\nc=3\nENDFUNCTION\nFUNCTION y=second(~,x)\ny=x\nENDFUNCTION\nFUNCTION [first,varargout]=repeatingReturns()\nfirst=10\nvarargout{1}=20\nvarargout{2}=30\nENDFUNCTION\n[x,middle,z]=ignoredReturn()\n[left,~,right]=deal(4,5,6)\n[head,tail1,tail2]=repeatingReturns()\nsecond(99,42)\nx\nmiddle\nz\nleft\nright\nhead\ntail1\ntail2\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=1\nmiddle=[ ](0x0)\nz=3\nleft=4\nright=6\nhead=10\ntail1=20\ntail2=30\n42\n1\n[ ](0x0)\n3\n4\n6\n10\n20\n30\n');
    });

    it('Should preserve requested output masks across ignored outputs, varargout, nargout, and isargout.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function [a,b,c] = outputMaskProbe()',
            '  a = isargout(1);',
            '  b = isargout(2);',
            '  c = isargout(3);',
            'end',
            'function varargout = varOutputProbe()',
            '  varargout{1} = nargout;',
            '  varargout{2} = isargout(2);',
            '  varargout{3} = isargout(3);',
            'end',
            'function [dummy, mask] = outputMask3DProbe()',
            '  dummy = isargout(1);',
            '  mask = isargout(reshape(1:8, [2, 2, 2]));',
            'end',
            '[first, ~, third] = outputMaskProbe();',
            'single = varOutputProbe();',
            '[count, secondRequested, thirdRequested] = varOutputProbe();',
            '[dummy3D, mask3D] = outputMask3DProbe();',
            'first; third; single; count; secondRequested; thirdRequested; dummy3D; size(mask3D); mask3D(1); mask3D(2); mask3D(5)',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'first=true\nthird=true\nsingle=1\ncount=3\nsecondRequested=true\nthirdRequested=true\ndummy3D=true\nmask3D=[true,false;\ntrue,false] (:,:,1)\n[false,false;\nfalse,false] (:,:,2)\n\ntrue\ntrue\n1\n3\ntrue\ntrue\ntrue\n[2,2,2]\ntrue\ntrue\nfalse\n',
        );
        expect(() => interpreter.Execute('[named1, named2, named3, named4] = varOutputProbe()')).toThrow('element number 4 undefined in return list');
        expect(interpreter.Unparse(interpreter.Execute('[~, ~, ~, ~] = varOutputProbe(); ignoredOnly = 1; ignoredOnly'))).toBe('ignoredOnly=1\n1\n');
    });

    it('Should preserve multidimensional page slices and assignments.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = reshape(1:8, [2, 2, 2]);',
            'firstPage = A(:, :, 1);',
            'secondPage = A(:, :, 2);',
            'firstRows = A(1, :, :);',
            'secondColumns = A(:, 2, :);',
            'A(:, :, 2) = [50, 70; 60, 80];',
            'updatedSecond = A(:, :, 2);',
            'B = reshape(1:12, [2, 2, 3]);',
            'B(:, :, 2) = [];',
            'C = reshape(1:8, [2, 2, 2]);',
            'C(:, 1, :) = [];',
            'D = reshape(1:8, [2, 2, 2]);',
            'D(2, :, :) = [];',
            'firstPage; secondPage; firstRows; secondColumns; updatedSecond; B; C; D',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'A=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n\nfirstPage=[1,3;\n2,4]\nsecondPage=[5,7;\n6,8]\nfirstRows=[1,3] (:,:,1)\n[5,7] (:,:,2)\n\nsecondColumns=[3;\n4] (:,:,1)\n[7;\n8] (:,:,2)\n\nA=[1,3;\n2,4] (:,:,1)\n[50,70;\n60,80] (:,:,2)\n\nupdatedSecond=[50,70;\n60,80]\nB=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n[9,11;\n10,12] (:,:,3)\n\nB=[1,3;\n2,4] (:,:,1)\n[9,11;\n10,12] (:,:,2)\n\nC=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n\nC=[3;\n4] (:,:,1)\n[7;\n8] (:,:,2)\n\nD=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n\nD=[1,3] (:,:,1)\n[5,7] (:,:,2)\n\n[1,3;\n2,4]\n[5,7;\n6,8]\n[1,3] (:,:,1)\n[5,7] (:,:,2)\n\n[3;\n4] (:,:,1)\n[7;\n8] (:,:,2)\n\n[50,70;\n60,80]\n[1,3;\n2,4] (:,:,1)\n[9,11;\n10,12] (:,:,2)\n\n[3;\n4] (:,:,1)\n[7;\n8] (:,:,2)\n\n[1,3] (:,:,1)\n[5,7] (:,:,2)\n\n',
        );
        expect(() => interpreter.Execute('E = reshape(1:8, [2, 2, 2]); E(1, 1, :) = [];')).toThrow('a null assignment can only have one non-colon index');
    });

    it('Should expand multidimensional arrays through subscript assignment and end expressions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = reshape(1:8, [2, 2, 2]);',
            'A(:, :, end + 1) = [9, 11; 10, 12];',
            'G = [];',
            'G(2, 2, 2) = 7;',
            'H = reshape(1:8, [2, 2, 2]);',
            'H(1, 1, end + 1) = 99;',
            'A; G; H;',
        ].join('\n');

        const [expandedPage, scalarGrown, endGrown] = executeList(interpreter, source).list.slice(-3) as MultiArray[];

        expect(expandedPage).toBeInstanceOf(MultiArray);
        expect(expandedPage.dimension).toEqual([2, 2, 3]);
        expect(MultiArray.linearize(expandedPage).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

        expect(scalarGrown).toBeInstanceOf(MultiArray);
        expect(scalarGrown.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(scalarGrown).map(realScalar)).toEqual([0, 0, 0, 0, 0, 0, 0, 7]);

        expect(endGrown).toBeInstanceOf(MultiArray);
        expect(endGrown.dimension).toEqual([2, 2, 3]);
        expect(MultiArray.linearize(endGrown).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 99, 0, 0, 0]);
    });

    it('Should preserve N-D logical subscripts for selection, assignment, and deletion.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = reshape(1:12, [2, 3, 2]);',
            'firstPlane = A(:, :, [true, false]);',
            'secondRowAllPages = A([false, true], :, :);',
            'middleColumnPages = A(:, [false, true, false], :);',
            'linearLogical = A(A > 8);',
            'B = A;',
            'B(:, [true, false, true], 2) = [101, 103; 102, 104];',
            'C = A;',
            'C(A > 10) = -1;',
            'D = A;',
            'D(:, [false, true, false], :) = [];',
            'E = A;',
            'E(:, :, [true, false]) = [];',
            'firstPlane; secondRowAllPages; middleColumnPages; linearLogical; B; C; D; E;',
        ].join('\n');

        const [firstPlane, secondRowAllPages, middleColumnPages, linearLogical, assigned, linearAssigned, deletedColumn, deletedPlane] = executeList(interpreter, source).list.slice(
            -8,
        ) as MultiArray[];

        expect(firstPlane.dimension).toEqual([2, 3]);
        expect(MultiArray.linearize(firstPlane).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6]);

        expect(secondRowAllPages.dimension).toEqual([1, 3, 2]);
        expect(MultiArray.linearize(secondRowAllPages).map(realScalar)).toEqual([2, 4, 6, 8, 10, 12]);

        expect(middleColumnPages.dimension).toEqual([2, 1, 2]);
        expect(MultiArray.linearize(middleColumnPages).map(realScalar)).toEqual([3, 4, 9, 10]);

        expect(linearLogical.dimension).toEqual([4, 1]);
        expect(MultiArray.linearize(linearLogical).map(realScalar)).toEqual([9, 10, 11, 12]);

        expect(assigned.dimension).toEqual([2, 3, 2]);
        expect(MultiArray.linearize(assigned).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6, 101, 102, 9, 10, 103, 104]);

        expect(linearAssigned.dimension).toEqual([2, 3, 2]);
        expect(MultiArray.linearize(linearAssigned).map(realScalar)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1, -1]);

        expect(deletedColumn.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(deletedColumn).map(realScalar)).toEqual([1, 2, 5, 6, 7, 8, 11, 12]);

        expect(deletedPlane.dimension).toEqual([2, 3]);
        expect(MultiArray.linearize(deletedPlane).map(realScalar)).toEqual([7, 8, 9, 10, 11, 12]);

        expect(() => interpreter.Execute('A = reshape(1:8, [2, 2, 2]); A(:, :, [true, false, true]);')).toThrow('logical index out of bound 2.');
    });

    it('Should preserve N-D cell subscript, content assignment, expansion, and deletion semantics.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'C = reshape({1, 2, 3, 4, 5, 6, 7, 8}, [2, 2, 2]);',
            'firstCellPage = C(:, :, 1);',
            'secondCellValues = [C{:, :, 2}];',
            'C(:, :, 2) = {50, 70; 60, 80};',
            'updatedCellPage = C(:, :, 2);',
            'C{1, 1, end + 1} = 99;',
            'grownCell = C;',
            'D = reshape({1, 2, 3, 4, 5, 6, 7, 8}, [2, 2, 2]);',
            'D(:, [true, false], :) = [];',
            'firstCellPage; secondCellValues; updatedCellPage; grownCell; D;',
        ].join('\n');

        const [firstCellPage, secondCellValues, updatedCellPage, grownCell, deletedCellColumn] = executeList(interpreter, source).list.slice(-5) as MultiArray[];

        expect(firstCellPage.isCell).toBe(true);
        expect(firstCellPage.dimension).toEqual([2, 2]);
        expect(MultiArray.linearize(firstCellPage).map(realScalar)).toEqual([1, 2, 3, 4]);

        expect(secondCellValues.isCell).toBe(false);
        expect(secondCellValues.dimension).toEqual([1, 4]);
        expect(MultiArray.linearize(secondCellValues).map(realScalar)).toEqual([5, 6, 7, 8]);

        expect(updatedCellPage.isCell).toBe(true);
        expect(updatedCellPage.dimension).toEqual([2, 2]);
        expect(MultiArray.linearize(updatedCellPage).map(realScalar)).toEqual([50, 60, 70, 80]);

        expect(grownCell.isCell).toBe(true);
        expect(grownCell.dimension).toEqual([2, 2, 3]);
        expect(MultiArray.linearize(grownCell).map((value) => (value instanceof MultiArray && value.dimension[0] === 0 ? 0 : realScalar(value)))).toEqual([
            1, 2, 3, 4, 50, 60, 70, 80, 99, 0, 0, 0,
        ]);

        expect(deletedCellColumn.isCell).toBe(true);
        expect(deletedCellColumn.dimension).toEqual([2, 1, 2]);
        expect(MultiArray.linearize(deletedCellColumn).map(realScalar)).toEqual([3, 4, 7, 8]);
    });

    it('Should preserve N-D dimension metadata and indexed numel semantics.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'A = reshape(1:24, [2, 3, 4]);',
            'plainSize = size(A);',
            'dim13 = size(A, [1, 3]);',
            '[m, n] = size(A);',
            '[p, q, r, s] = size(A);',
            'shapeFacts = [ndims(A), rows(A), columns(A), length(A), numel(A), numel(A, ":", 2, ":")];',
            'vectorFacts = [isrow(A(1, :, 1)), iscolumn(A(:, 1, 1)), isvector(A(:, 1, 1)), ismatrix(A), isscalar(A(1, 1, 1))];',
            'plainSize; dim13; m; n; p; q; r; s; shapeFacts; vectorFacts;',
        ].join('\n');

        const [plainSize, dim13, m, n, p, q, r, s, shapeFacts, vectorFacts] = executeList(interpreter, source).list.slice(-10);

        expect(MultiArray.linearize(plainSize as MultiArray).map(realScalar)).toEqual([2, 3, 4]);
        expect(MultiArray.linearize(dim13 as MultiArray).map(realScalar)).toEqual([2, 4]);
        expect([m, n, p, q, r, s].map(realScalar)).toEqual([2, 12, 2, 3, 4, 1]);
        expect(MultiArray.linearize(shapeFacts as MultiArray).map(realScalar)).toEqual([3, 2, 3, 4, 24, 8]);
        expect(MultiArray.linearize(vectorFacts as MultiArray).map(realScalar)).toEqual([1, 1, 1, 0, 1]);
    });

    it('Should expand comma-separated lists from N-D cells and structure arrays in logical order.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = sumargs(varargin)',
            '  y = 0;',
            '  for k = 1:nargin',
            '    y += varargin{k};',
            '  end',
            'end',
            'C = reshape({1, 2, 3, 4, 5, 6, 7, 8}, [2, 2, 2]);',
            'cellTotal = sumargs(C{:});',
            '[p5, p6, p7, p8] = C{:, :, 2};',
            'for k = 1:8',
            '  S(k).x = k;',
            'end',
            'S = reshape(S, [2, 2, 2]);',
            'structTotal = sumargs(S.x);',
            '[s5, s6, s7, s8] = S(:, :, 2).x;',
            'cellTotal; p5; p6; p7; p8; structTotal; s5; s6; s7; s8;',
        ].join('\n');

        expect(executeList(interpreter, source).list.slice(-10).map(realScalar)).toEqual([36, 5, 6, 7, 8, 36, 5, 6, 7, 8]);
    });

    it('Should preserve N-D structure-cell conversion order and shape.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'C = reshape({1, 10, 2, 20, 3, 30, 4, 40}, [2, 2, 2]);',
            'S = cell2struct(C, {"a", "b"}, 1);',
            'valuesA = [S.a];',
            'valuesB = [S.b];',
            'back = struct2cell(S);',
            'roundTrip = cell2struct(back, {"a", "b"}, 1);',
            'roundTripA = [roundTrip.a];',
            'roundTripB = [roundTrip.b];',
            'size(S); valuesA; valuesB; size(back); back; roundTripA; roundTripB;',
        ].join('\n');

        const [structSize, valuesA, valuesB, backSize, back, roundTripA, roundTripB] = executeList(interpreter, source).list.slice(-7) as MultiArray[];

        expect(MultiArray.linearize(structSize).map(realScalar)).toEqual([2, 2]);
        expect(MultiArray.linearize(valuesA).map(realScalar)).toEqual([1, 2, 3, 4]);
        expect(MultiArray.linearize(valuesB).map(realScalar)).toEqual([10, 20, 30, 40]);
        expect(MultiArray.linearize(backSize).map(realScalar)).toEqual([2, 2, 2]);
        expect(back.isCell).toBe(true);
        expect(back.dimension).toEqual([2, 2, 2]);
        expect(MultiArray.linearize(back).map(realScalar)).toEqual([1, 10, 2, 20, 3, 30, 4, 40]);
        expect(MultiArray.linearize(roundTripA).map(realScalar)).toEqual([1, 2, 3, 4]);
        expect(MultiArray.linearize(roundTripB).map(realScalar)).toEqual([10, 20, 30, 40]);
    });

    it('Should keep function definition forms compatible across script locals, varargs, nested closures, and return flow.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'scriptSeed = 5;',
            'localHandle = @scriptLocalScale;',
            'localValue = scriptLocalScale(scriptSeed);',
            'function [] = touchGlobal(x)',
            '  global touchedByEmptyReturn',
            '  touchedByEmptyReturn = x;',
            'end',
            'function [a b] = spacedReturns(x)',
            '  a = x;',
            '  b = x + nargin + nargout;',
            'endfunction',
            'function [head, varargout] = packValues(x, varargin)',
            '  head = nargin;',
            '  for k = 1:nargout-1',
            '    varargout{k} = x + k;',
            '  endfor',
            'end',
            'function f = makeCounter(seed)',
            '  count = seed;',
            '  function y = next(step)',
            '    count += step;',
            '    y = count;',
            '  end',
            '  f = @next;',
            'end',
            'function h = makePersistentClosure(seed)',
            '  persistent shared = 0;',
            '  shared += 1;',
            '  local = seed;',
            '  function y = nextPersistent(step)',
            '    local += step;',
            '    y = local + shared * 100;',
            '  end',
            '  h = @nextPersistent;',
            'end',
            'function y = earlyReturn(x)',
            '  y = 0;',
            '  if x > 0',
            '    y = x;',
            '    return',
            '  endif',
            '  y = -1;',
            'end',
            'function y = scriptLocalScale(x)',
            '  y = x * 10;',
            'end',
            'touchGlobal(7);',
            '[left right] = spacedReturns(3);',
            '[count, firstPacked, secondPacked] = packValues(10, 20, 30);',
            'counter = makeCounter(100);',
            'counterFirst = counter(5);',
            'counterSecond = counter(2);',
            'persistentFirst = makePersistentClosure(10);',
            'persistentSecond = makePersistentClosure(20);',
            'persistentA = persistentFirst(1);',
            'persistentB = persistentFirst(1);',
            'persistentC = persistentSecond(1);',
            'persistentD = persistentFirst(1);',
            'early = earlyReturn(9);',
            'global touchedByEmptyReturn',
            'localValue; localHandle(2); touchedByEmptyReturn; left; right; count; firstPacked; secondPacked; counterFirst; counterSecond; persistentA; persistentB; persistentC; persistentD; early',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'scriptSeed=5\nlocalHandle=@scriptLocalScale\nlocalValue=scriptLocalScale(scriptSeed)\nFUNCTION touchGlobal(x)\nglobal touchedByEmptyReturn\ntouchedByEmptyReturn=x\nENDFUNCTION\nFUNCTION [a,b]=spacedReturns(x)\na=x\nb=x+nargin+nargout\nENDFUNCTION\nFUNCTION [head,varargout]=packValues(x,varargin)\nhead=nargin\nFOR k=1:nargout-1\nvarargout{k}=x+k\n\nENDFOR\nENDFUNCTION\nFUNCTION f=makeCounter(seed)\ncount=seed\nFUNCTION y=next(step)\ncount+=step\ny=count\nENDFUNCTION\nf=@next\nENDFUNCTION\nFUNCTION h=makePersistentClosure(seed)\npersistent shared=0\nshared+=1\nlocal=seed\nFUNCTION y=nextPersistent(step)\nlocal+=step\ny=local+shared*100\nENDFUNCTION\nh=@nextPersistent\nENDFUNCTION\nFUNCTION y=earlyReturn(x)\ny=0\nIF x>0\ny=x\nreturn\n\nENDIF\ny=-1\nENDFUNCTION\nFUNCTION y=scriptLocalScale(x)\ny=x*10\nENDFUNCTION\ntouchGlobal(7)\n[left,right]=spacedReturns(3)\n[count,firstPacked,secondPacked]=packValues(10,20,30)\ncounter=makeCounter(100)\ncounterFirst=counter(5)\ncounterSecond=counter(2)\npersistentFirst=makePersistentClosure(10)\npersistentSecond=makePersistentClosure(20)\npersistentA=persistentFirst(1)\npersistentB=persistentFirst(1)\npersistentC=persistentSecond(1)\npersistentD=persistentFirst(1)\nearly=earlyReturn(9)\nglobal touchedByEmptyReturn\nlocalValue\nlocalHandle(2)\ntouchedByEmptyReturn\nleft\nright\ncount\nfirstPacked\nsecondPacked\ncounterFirst\ncounterSecond\npersistentA\npersistentB\npersistentC\npersistentD\nearly\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'scriptSeed=5\nlocalHandle=@scriptLocalScale\nlocalValue=50\nleft=3\nright=6\ncount=3\nfirstPacked=11\nsecondPacked=12\ncounter=@next\ncounterFirst=105\ncounterSecond=107\npersistentFirst=@nextPersistent\npersistentSecond=@nextPersistent\npersistentA=111\npersistentB=112\npersistentC=221\npersistentD=113\nearly=9\n50\n20\n7\n3\n6\n3\n11\n12\n105\n107\n111\n112\n221\n113\n9\n',
        );
    });

    it('Should keep nested closures and eval in the same function workspace.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function h = makeEvalCounter(seed)',
                '  count = seed;',
                '  function y = next(step)',
                "    eval('count = count + step');",
                '    y = count;',
                '  end',
                '  h = @next;',
                'end',
                'h = makeEvalCounter(10);',
                'a = h(2);',
                'b = h(3);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('a; b'))).toBe('12\n15\n');
    });

    it('Should keep MATLAB-compatible nested function visibility across lexical levels.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function [fromParent, fromSibling, fromDescendant] = nestedVisibilityProbe(x)',
                '  fromParent = first(x) + second(x);',
                '  fromSibling = firstCallsSecond(x);',
                '  fromDescendant = firstCallsDescendant(x);',
                '  function y = first(v)',
                '    y = v + 1;',
                '  end',
                '  function y = second(v)',
                '    y = v + 2;',
                '  end',
                '  function y = firstCallsSecond(v)',
                '    y = second(v) + 10;',
                '  end',
                '  function y = firstCallsDescendant(v)',
                '    y = nestedChild(v) + second(v);',
                '    function z = nestedChild(w)',
                '      z = first(w) + second(w) + 100;',
                '    end',
                '  end',
                'end',
                'function y = nestedVisibilityRejectChild()',
                '  y = hiddenChild(1);',
                '  function firstCallsHidden()',
                '    function z = hiddenChild(w)',
                '      z = w;',
                '    end',
                '  end',
                'end',
                '[fromParent, fromSibling, fromDescendant] = nestedVisibilityProbe(5);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('fromParent; fromSibling; fromDescendant'))).toBe('13\n17\n120\n');
        expect(() => interpreter.Execute('nestedVisibilityRejectChild()')).toThrow("'hiddenChild' undefined.");
    });

    it('Should expose local and nested function handles through localfunctions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = localFirst(x), y = x + 1; end',
            'function y = localSecond(x), y = x + 2; end',
            'function [name, value] = localNestedProbe(seed)',
            '  function y = inner(x), y = x + seed; end',
            '  c = localfunctions();',
            '  name = func2str(c{1});',
            '  value = c{1}(5);',
            'end',
            'c = localfunctions();',
            'firstName = func2str(c{1});',
            'secondName = func2str(c{2});',
            'thirdName = func2str(c{3});',
            'firstValue = feval(c{1}, 5);',
            'thirdValue = feval(c{3}, 5);',
            '[nestedName, nestedValue] = localNestedProbe(10);',
            'firstName; secondName; thirdName; firstValue; thirdValue; nestedName; nestedValue',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'c={@localFirst;\n@localNestedProbe;\n@localSecond}\nfirstName=localFirst\nsecondName=localNestedProbe\nthirdName=localSecond\nfirstValue=6\nthirdValue=7\nnestedName=inner\nnestedValue=15\nlocalFirst\nlocalNestedProbe\nlocalSecond\n6\n7\ninner\n15\n',
        );
    });

    it('Should keep anonymous varargin and anonymous multiple-output forwarding compatible.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'f = @(x, varargin) x + nargin + varargin{1};',
            'a = f(1, 2, 3);',
            'g = @(varargin) nargin;',
            'b = g();',
            'c = g(1, 2, 3);',
            'h = @() deal(4, 5);',
            '[u, v] = h();',
            'a; b; c; u; v',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'f=@(x,varargin) x+nargin+varargin{1}\na=6\ng=@(varargin) nargin\nb=0\nc=3\nh=@() deal(4,5)\nu=4\nv=5\n6\n0\n3\n4\n5\n',
        );
        expect(() => interpreter.Execute('@(varargin, x) x')).toThrow('varargin must be the last parameter in anonymous function.');
    });

    it('Should keep anonymous eval compatible with static workspace rules.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'captured = 20;',
            "readParam = @(x) eval('x + 1');",
            "readCaptured = @() eval('captured + 1');",
            'paramValue = readParam(5);',
            'capturedValue = readCaptured();',
            'paramValue; capturedValue',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'captured=20\nreadParam=@(x) eval(x + 1)\nreadCaptured=@() eval(captured + 1)\nparamValue=6\ncapturedValue=21\n6\n21\n',
        );
        expect(() => interpreter.Execute("dynamicAnon = @() eval('createdFromAnon = 1'); dynamicAnon()")).toThrow("Attempt to add variable 'createdFromAnon' to a static workspace.");
    });

    it('Should keep anonymous evalin caller compatible with static workspace rules.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'x = 10;',
            "readCaller = @(n) evalin('caller', 'x + n');",
            'callerValue = readCaller(5);',
            'function y = makeEvalinReader(base)',
            "  y = @(n) evalin('caller', 'base + n');",
            'end',
            'function f = makeEvalinWriter()',
            '  base = 3;',
            "  f = @() evalin('caller', 'base = base + 1');",
            'end',
            'reader = makeEvalinReader(20);',
            'returnedValue = reader(2);',
            'writer = makeEvalinWriter();',
            'firstWrite = writer();',
            'secondWrite = writer();',
            'callerValue; returnedValue; firstWrite; secondWrite',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'x=10\nreadCaller=@(n) evalin(caller,x + n)\ncallerValue=15\nreader=@(n) evalin(caller,base + n)\nreturnedValue=22\nwriter=@() evalin(caller,base = base + 1)\nfirstWrite=base=4\nsecondWrite=base=5\n15\n22\nbase=4\nbase=5\n',
        );
        expect(() => interpreter.Execute("dynamicEvalin = @() evalin('caller', 'createdFromEvalinAnon = 1'); dynamicEvalin()")).toThrow(
            "Attempt to add variable 'createdFromEvalinAnon' to a static workspace.",
        );
    });

    it('Should reject ignored targets outside signature, call, or assignment-list positions.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Parse('x = ~;')).toThrow(/syntax error/);
        expect(() => interpreter.Parse('function y = invalidDefault(~ = 1), y = 1; end')).toThrow(/syntax error/);
    });

    it('Should parse MATLAB arguments blocks with size, class, validators, name-value defaults, and outputs.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function y = shaped(x, opts)',
            '  arguments',
            '    x (1,:) double {mustBeFinite}',
            '    opts.Scale (1,1) double {mustBePositive} = 2',
            '  end',
            '  arguments (Output)',
            '    y (1,:) double',
            '  end',
            '  y = x * opts.Scale;',
            'end',
            'shaped([1, 2], Scale=3)',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'FUNCTION y=shaped(x,opts)\nARGUMENTS\nx(1,:) double {mustBeFinite}\nopts.Scale(1,1) double {mustBePositive}=2\nENDARGUMENTS\nARGUMENTS (Output)\ny(1,:) double\nENDARGUMENTS\ny=x*opts.Scale\nENDFUNCTION\nshaped([1,2],Scale=3)\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('[3,6]\n');
    });

    it('Should apply arguments defaults, Octave colon default markers, validators, and name-value options together.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function y = confArgs(x, z, opts)',
                '  arguments',
                '    x double {mustBePositive} = 2',
                '    z double {mustBePositive} = x + 3',
                '    opts.Scale (1,1) double {mustBePositive} = 10',
                '  end',
                '  y = (x + z) * opts.Scale;',
                'end',
                'a = confArgs();',
                'b = confArgs(4, :, Scale=2);',
                'c = confArgs(:, 8);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('a; b; c'))).toBe('70\n22\n100\n');
        expect(() => interpreter.Execute('confArgs(-1)')).toThrow("arguments block validation failed for 'x': mustBePositive.");
        expect(() => interpreter.Execute('confArgs(1, 2, Scale=-1)')).toThrow("arguments block validation failed for 'opts.Scale': mustBePositive.");
    });

    it('Should keep narginchk, nargoutchk, and requested output counts compatible.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function y = checkedInputs(a, varargin)',
                '  narginchk(1, 3);',
                '  y = nargin;',
                'end',
                'function [a, b] = checkedOutputs(x)',
                '  nargoutchk(1, 2);',
                '  a = nargout;',
                '  b = x + 1;',
                'end',
                'lowOutText = nargoutchk(1, 2, 0);',
                'highOutText = nargoutchk(1, 2, 3);',
                'okOutText = nargoutchk(1, 2, 1);',
                "highOutString = nargoutchk(1, 2, 3, 'string');",
                'lowInText = nargchk(2, 3, 1);',
                "highInString = nargchk(2, 3, 4, 'string');",
                'okInText = nargchk(2, 3, 2);',
                "lowInStruct = nargchk(2, 3, 1, 'struct');",
                "highInStruct = nargchk(2, 3, 4, 'struct');",
                "okInStruct = nargchk(2, 3, 2, 'struct');",
                "lowOutStruct = nargoutchk(1, 2, 0, 'struct');",
                "highOutStruct = nargoutchk(1, 2, 3, 'struct');",
                "okOutStruct = nargoutchk(1, 2, 1, 'struct');",
                'error(nargchk(2, 3, 2));',
                "error(nargchk(2, 3, 2, 'struct'));",
                'in1 = checkedInputs(1);',
                'in3 = checkedInputs(1, 2, 3);',
                'out1 = checkedOutputs(10);',
                '[outCount, outValue] = checkedOutputs(10);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('in1; in3; out1; outCount; outValue'))).toBe('1\n3\n1\n2\n11\n');
        expect(
            interpreter.Unparse(
                interpreter.Execute(
                    [
                        'lowOutText; highOutText; okOutText; highOutString',
                        'lowInText; highInString; okInText',
                        'lowInStruct.message; lowInStruct.identifier; highInStruct.message; highInStruct.identifier; fieldnames(okInStruct)',
                        'lowOutStruct.message; lowOutStruct.identifier; highOutStruct.message; highOutStruct.identifier; fieldnames(okOutStruct)',
                    ].join('; '),
                ),
            ),
        ).toBe(
            [
                'Not enough output arguments.',
                'Too many output arguments.',
                '',
                'Too many output arguments.',
                'Not enough input arguments.',
                'Too many input arguments.',
                '',
                'Not enough input arguments.',
                'MATLAB:nargchk:notEnoughInputs',
                'Too many input arguments.',
                'MATLAB:nargchk:tooManyInputs',
                '{ }(0x1)',
                'Not enough output arguments.',
                'MATLAB:nargoutchk:notEnoughOutputs',
                'Too many output arguments.',
                'MATLAB:nargoutchk:tooManyOutputs',
                '{ }(0x1)',
                '',
            ].join('\n'),
        );
        expect(() => interpreter.Execute('checkedInputs(1, 2, 3, 4)')).toThrow('narginchk: invalid number of input arguments.');
        expect(() => interpreter.Execute('[a, b, c] = checkedOutputs(10)')).toThrow('element number 3 undefined in return list');
        expect(() => interpreter.Execute("nargoutchk(1, 2, 1, 'message')")).toThrow('Invalid call to nargoutchk.');
        expect(() => interpreter.Execute("nargchk(1, 2, 1, 'message')")).toThrow('Invalid call to nargchk.');
        expect(() => interpreter.Execute("error(nargchk(2, 3, 1, 'struct'))")).toThrow('Not enough input arguments.');
    });

    it('Should expand comma-separated lists into declared name-value arguments.', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            [
                'function y = scaleOffset(x, opts)',
                '  arguments',
                '    x double',
                '    opts.Scale double = 1',
                '    opts.Offset double = 0',
                '  end',
                '  y = x * opts.Scale + opts.Offset;',
                'end',
                "pairs = {'Scale', 3, 'Offset', 4};",
                'a = scaleOffset(5, pairs{:});',
                'b = scaleOffset(5, Offset=2, Scale=4);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('a; b'))).toBe('19\n22\n');
        expect(() => interpreter.Execute('scaleOffset(5, unknown=2)')).toThrow("unknown name-value argument 'unknown' in function scaleOffset");
        expect(() => interpreter.Execute('scaleOffset(5, Scale=2, 3)')).toThrow('positional arguments cannot follow name-value arguments in function scaleOffset');
    });

    it('Should dispatch object size-query built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef SizeNumelProbe',
            '  methods',
            '    function y = numel(obj, varargin)',
            '      y = 7 + numel(varargin);',
            '    end',
            '    function varargout = size(obj, varargin)',
            '      if nargin > 1',
            '        varargout{1} = 30 + varargin{1};',
            '      elseif nargout <= 1',
            '        varargout{1} = [2, 3];',
            '      else',
            '        varargout{1} = 2;',
            '        varargout{2} = 3;',
            '      end',
            '    end',
            '    function y = length(obj)',
            '      y = 9;',
            '    end',
            '  end',
            'end',
            'classdef PlainSizeNumelProbe',
            'end',
            'obj = SizeNumelProbe();',
            'plain = PlainSizeNumelProbe();',
            'n = numel(obj);',
            'ni = numel(obj, 1, 2);',
            's = size(obj);',
            'dim = size(obj, 2);',
            '[r,c] = size(obj);',
            'l = length(obj);',
            'plainSize = size(plain);',
            'plainNumel = numel(plain);',
            'plainLength = length(plain);',
            'n; ni; s; dim; r; c; l; plainSize; plainNumel; plainLength',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=SizeNumelProbe object\nplain=PlainSizeNumelProbe object\nn=7\nni=9\ns=[2,3]\ndim=32\nr=2\nc=3\nl=9\nplainSize=[1,1]\nplainNumel=1\nplainLength=1\n7\n9\n[2,3]\n32\n2\n3\n9\n[1,1]\n1\n1\n',
        );
    });

    it('Should dispatch object dimension-query built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef DimensionQueryProbe',
            '  methods',
            '    function y = ndims(obj), y = 7; end',
            '    function y = rows(obj), y = 8; end',
            '    function y = columns(obj), y = 9; end',
            '  end',
            'end',
            'obj = DimensionQueryProbe();',
            'a = ndims(obj);',
            'b = rows(obj);',
            'c = columns(obj);',
            'nativeArray = reshape(1:8, [2, 2, 2]);',
            'native = [ndims(nativeArray), rows(nativeArray), columns(nativeArray)];',
            'a; b; c; native',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=DimensionQueryProbe object\na=7\nb=8\nc=9\nnativeArray=[1,3;\n2,4] (:,:,1)\n[5,7;\n6,8] (:,:,2)\n\nnative=[3,2,2]\n7\n8\n9\n[3,2,2]\n',
        );
    });

    it('Should let builtin calls bypass class methods and use native implementations.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef BuiltinBypassProbe',
            '  methods',
            '    function y = size(obj), y = [7, 8]; end',
            '    function y = isempty(obj), y = true; end',
            '  end',
            'end',
            'obj = BuiltinBypassProbe();',
            'methodSize = size(obj);',
            "nativeSize = builtin('size', obj);",
            'methodEmpty = isempty(obj);',
            "nativeEmpty = builtin('isempty', obj);",
            'methodSize; nativeSize; methodEmpty; nativeEmpty',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=BuiltinBypassProbe object\nmethodSize=[7,8]\nnativeSize=[1,1]\nmethodEmpty=true\nnativeEmpty=false\n[7,8]\n[1,1]\ntrue\nfalse\n',
        );
    });

    it('Should dispatch feval operator built-ins to class overload methods while builtin bypasses them.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef FevalOperatorProbe',
            '  methods',
            '    function y = plus(a, b)',
            '      y = 77;',
            '    end',
            '  end',
            'end',
            'obj = FevalOperatorProbe();',
            'symbolic = obj + obj;',
            'functional = plus(obj, obj);',
            "viaFeval = feval('plus', obj, obj);",
            "nativeFeval = feval('plus', 1, 2, 3);",
            'symbolic; functional; viaFeval; nativeFeval',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('obj=FevalOperatorProbe object\nsymbolic=77\nfunctional=77\nviaFeval=77\nnativeFeval=6\n77\n77\n77\n6\n');
        expect(() => interpreter.Execute("builtin('plus', obj, obj)")).toThrow('operator + is not defined for these operands.');
    });

    it('Should dispatch object predicate and equality built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PredicateEqualityProbe',
            '  properties',
            '    Value = 0',
            '  end',
            '  methods',
            '    function tf = isempty(obj)',
            '      tf = true;',
            '    end',
            '    function tf = isequal(obj, other, varargin)',
            '      tf = isa(other, "PredicateEqualityProbe") && obj.Value ~= other.Value;',
            '    end',
            '  end',
            'end',
            'classdef PlainPredicateEqualityProbe',
            '  properties',
            '    Value = 0',
            '  end',
            'end',
            'a = PredicateEqualityProbe();',
            'b = PredicateEqualityProbe();',
            'b.Value = 1;',
            'plain = PlainPredicateEqualityProbe();',
            'emptyResult = isempty(a);',
            'sameResult = isequal(a, a);',
            'diffResult = isequal(a, b);',
            'variadicResult = isequal(a, b, 1, 2);',
            'plainEmpty = isempty(plain);',
            'plainSame = isequal(plain, plain);',
            'emptyResult; sameResult; diffResult; variadicResult; plainEmpty; plainSame',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'a=PredicateEqualityProbe object with properties: Value\nb=PredicateEqualityProbe object with properties: Value\nb=PredicateEqualityProbe object with properties: Value\nplain=PlainPredicateEqualityProbe object with properties: Value\nemptyResult=true\nsameResult=false\ndiffResult=true\nvariadicResult=true\nplainEmpty=false\nplainSame=true\ntrue\nfalse\ntrue\ntrue\nfalse\ntrue\n',
        );
    });

    it('Should dispatch object conversion built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ConversionProbe',
            '  methods',
            '    function y = double(obj)',
            '      y = 42;',
            '    end',
            '    function y = char(obj)',
            "      y = 'converted';",
            '    end',
            '    function y = logical(obj)',
            '      y = true;',
            '    end',
            '  end',
            'end',
            'classdef PlainConversionProbe',
            'end',
            'obj = ConversionProbe();',
            'd = double(obj);',
            'c = char(obj);',
            't = logical(obj);',
            "nativeDouble = double('A');",
            'nativeChar = char(66);',
            'nativeLogical = logical(2);',
            'd; c; t; nativeDouble; nativeChar; nativeLogical',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=ConversionProbe object\nd=42\nc=converted\nt=true\nnativeDouble=65\nnativeChar=B\nnativeLogical=true\n42\nconverted\ntrue\n65\nB\ntrue\n',
        );
        expect(() => interpreter.Execute('plain = PlainConversionProbe(); double(plain)')).toThrow('double: invalid conversion input.');
    });

    it('Should dispatch object cell conversion built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef CellConversionProbe',
            '  methods',
            '    function y = cell(obj), y = {10}; end',
            "    function y = cellstr(obj), y = {'cellstr'}; end",
            '    function y = num2cell(obj, varargin), y = {20 + numel(varargin)}; end',
            '    function y = cell2mat(obj), y = 30; end',
            '    function y = mat2cell(obj, varargin), y = {40 + numel(varargin)}; end',
            '  end',
            'end',
            'obj = CellConversionProbe();',
            'a = cell(obj);',
            'b = cellstr(obj);',
            'c = num2cell(obj, 1);',
            'd = cell2mat(obj);',
            'e = mat2cell(obj, [1], [1]);',
            "nativeCellstr = cellstr(['ab'; 'cd']);",
            'nativeCell = cell(1, 2);',
            'nativeNum2cell = num2cell([1, 2]);',
            'nativeCell2mat = cell2mat({1, 2});',
            'nativeMat2cell = mat2cell([1, 2], 1, [1, 1]);',
            'a; b; c; d; e; nativeCellstr; nativeCell; nativeNum2cell; nativeCell2mat; nativeMat2cell',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=CellConversionProbe object\na={10}\nb={cellstr}\nc={21}\nd=30\ne={42}\nnativeCellstr={ab;\ncd}\nnativeCell=({[ ](0x0),[ ](0x0)})\nnativeNum2cell={1,2}\nnativeCell2mat=[1,2]\nnativeMat2cell={1,2}\n{10}\n{cellstr}\n{21}\n30\n{42}\n{ab;\ncd}\n{[ ](0x0),[ ](0x0)}\n{1,2}\n[1,2]\n{1,2}\n',
        );
    });

    it('Should dispatch object index and cell-to-struct conversion built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef IndexConversionProbe',
            '  methods',
            '    function y = cell2struct(obj, varargin), y = 10 + numel(varargin); end',
            '    function [r, c] = ind2sub(obj, varargin), r = 20 + numel(varargin); c = 21; end',
            '    function y = sub2ind(obj, varargin), y = 30 + numel(varargin); end',
            '  end',
            'end',
            'obj = IndexConversionProbe();',
            "a = cell2struct(obj, {'x'}, 1);",
            '[r, c] = ind2sub(obj, 4);',
            'b = sub2ind(obj, 1, 2);',
            "nativeCell2struct = cell2struct({1, 2}, {'a', 'b'}, 2);",
            '[nr, nc] = ind2sub([3, 3], 8);',
            'nativeSub = sub2ind([3, 3], 2, 3);',
            'a; r; c; b; nativeCell2struct; nr; nc; nativeSub',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=IndexConversionProbe object\na=12\nr=21\nc=21\nb=32\nnativeCell2struct=struct {\na: 1\nb: 2\n}\nnr=2\nnc=3\nnativeSub=8\n12\n21\n21\n32\nstruct {\na: 1\nb: 2\n}\n2\n3\n8\n',
        );
    });

    it('Should dispatch object unary type and shape predicates to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PredicateShapeProbe',
            '  methods',
            '    function tf = isscalar(obj), tf = false; end',
            '    function tf = ismatrix(obj), tf = false; end',
            '    function tf = isvector(obj), tf = true; end',
            '    function tf = isrow(obj), tf = false; end',
            '    function tf = iscolumn(obj), tf = true; end',
            '    function tf = iscell(obj), tf = true; end',
            '    function tf = iscellstr(obj), tf = true; end',
            '    function tf = isstruct(obj), tf = true; end',
            '    function tf = ischar(obj), tf = true; end',
            '    function tf = isstring(obj), tf = true; end',
            '    function tf = issparse(obj), tf = true; end',
            '    function tf = isfloat(obj), tf = false; end',
            '    function tf = isinteger(obj), tf = true; end',
            '    function tf = isnumeric(obj), tf = true; end',
            '    function tf = islogical(obj), tf = true; end',
            '    function tf = isreal(obj), tf = false; end',
            '  end',
            'end',
            'classdef PlainPredicateShapeProbe',
            'end',
            'obj = PredicateShapeProbe();',
            'plain = PlainPredicateShapeProbe();',
            'results = [isscalar(obj), ismatrix(obj), isvector(obj), isrow(obj), iscolumn(obj), iscell(obj), iscellstr(obj), isstruct(obj), ischar(obj), isstring(obj), issparse(obj), isfloat(obj), isinteger(obj), isnumeric(obj), islogical(obj), isreal(obj)];',
            'plainResults = [isscalar(plain), ismatrix(plain), isvector(plain), isrow(plain), iscolumn(plain), iscell(plain), isstruct(plain), ischar(plain), isstring(plain), issparse(plain), isfloat(plain), isinteger(plain), isnumeric(plain), islogical(plain), isreal(plain)];',
            'results; plainResults',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=PredicateShapeProbe object\nplain=PlainPredicateShapeProbe object\nresults=[false,false,true,false,true,true,true,true,true,true,true,false,true,true,true,false]\nplainResults=[true,true,true,true,true,false,false,false,false,false,false,false,false,false,false]\n[false,false,true,false,true,true,true,true,true,true,true,false,true,true,true,false]\n[true,true,true,true,true,false,false,false,false,false,false,false,false,false,false]\n',
        );
    });

    it('Should dispatch object validity predicates to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ObjectPredicateProbe',
            '  methods',
            '    function y = isobject(obj), y = false; end',
            '    function y = isvalid(obj), y = true; end',
            '  end',
            'end',
            'classdef PlainHandlePredicateProbe < handle',
            'end',
            'classdef PlainValuePredicateProbe',
            'end',
            'obj = ObjectPredicateProbe();',
            'handleObj = PlainHandlePredicateProbe();',
            'valueObj = PlainValuePredicateProbe();',
            'a = isobject(obj);',
            'b = isvalid(obj);',
            'nativeObject = isobject(handleObj);',
            'nativeValidBefore = isvalid(handleObj);',
            'delete(handleObj);',
            'nativeValidAfter = isvalid(handleObj);',
            'a; b; nativeObject; nativeValidBefore; nativeValidAfter',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=ObjectPredicateProbe object\nhandleObj=PlainHandlePredicateProbe object\nvalueObj=PlainValuePredicateProbe object\na=false\nb=true\nnativeObject=true\nnativeValidBefore=true\nnativeValidAfter=false\nfalse\ntrue\ntrue\ntrue\nfalse\n',
        );
        expect(() => interpreter.Execute('isvalid(valueObj)')).toThrow('isvalid: H must be a handle object.');
    });

    it('Should dispatch object structure protocol built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef StructProtocolProbe',
            '  methods',
            '    function y = struct(obj), y = 10; end',
            "    function y = fieldnames(obj), y = {'fieldMethod'}; end",
            '    function y = isfield(obj, varargin), y = false; end',
            '    function y = numfields(obj), y = 20; end',
            '    function y = getfield(obj, varargin), y = 30 + numel(varargin); end',
            '    function y = setfield(obj, varargin), y = 40 + numel(varargin); end',
            '    function y = rmfield(obj, varargin), y = 50 + numel(varargin); end',
            '    function y = orderfields(obj), y = 60; end',
            '    function y = struct2cell(obj), y = {70}; end',
            '  end',
            'end',
            'obj = StructProtocolProbe();',
            'a = struct(obj);',
            'b = fieldnames(obj);',
            "c = isfield(obj, 'x');",
            'd = numfields(obj);',
            "e = getfield(obj, 'x', 'y');",
            "f = setfield(obj, 'x', 1);",
            "g = rmfield(obj, 'x');",
            'h = orderfields(obj);',
            'k = struct2cell(obj);',
            "S = struct('b', 2, 'a', 1);",
            'nativeNames = fieldnames(S);',
            "nativeIsfield = isfield(S, {'a', 'missing'});",
            "nativeGet = getfield(S, 'a');",
            "nativeSet = setfield(S, 'c', 3);",
            "nativeRm = rmfield(S, 'b');",
            'nativeOrder = orderfields(S);',
            'nativeCells = struct2cell(S);',
            'a; b; c; d; e; f; g; h; k; nativeNames; nativeIsfield; nativeGet; nativeSet.c; nativeRm; nativeOrder; nativeCells',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=StructProtocolProbe object\na=10\nb={fieldMethod}\nc=false\nd=20\ne=32\nf=42\ng=51\nh=60\nk={70}\nS=struct {\nb: 2\na: 1\n}\nnativeNames={a;\nb}\nnativeIsfield=[true,false]\nnativeGet=1\nnativeSet=struct {\nb: 2\na: 1\nc: 3\n}\nnativeRm=struct {\na: 1\n}\nnativeOrder=struct {\na: 1\nb: 2\n}\nnativeCells={1;\n2}\n10\n{fieldMethod}\nfalse\n20\n32\n42\n51\n60\n{70}\n{a;\nb}\n[true,false]\n1\n3\nstruct {\na: 1\n}\nstruct {\na: 1\nb: 2\n}\n{1;\n2}\n',
        );
    });

    it('Should compose native structure utilities across ordering, cell conversion, and mutation.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S.b = 2; S.a = 1;',
            'names = fieldnames(orderfields(S));',
            'values = struct2cell(orderfields(S));',
            "T = rmfield(setfield(S, 'c', 3), 'b');",
            'n = numfields(T);',
            'names; values; T; n',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'S=struct {\nb: 2\n}\nS=struct {\nb: 2\na: 1\n}\nnames={a;\nb}\nvalues={1;\n2}\nT=struct {\na: 1\nc: 3\n}\nn=2\n{a;\nb}\n{1;\n2}\nstruct {\na: 1\nc: 3\n}\n2\n',
        );
    });

    it('Should dispatch object introspection built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef IntrospectionProtocolProbe',
            '  properties',
            '    Value = 1',
            '  end',
            '  methods',
            "    function y = properties(obj), y = {'propMethod'}; end",
            "    function y = methods(obj), y = {'methodMethod'}; end",
            "    function y = events(obj), y = {'eventMethod'}; end",
            "    function y = enumeration(obj), y = {'enumMethod'}; end",
            "    function y = superclasses(obj), y = {'superMethod'}; end",
            '    function y = isprop(obj, varargin), y = false; end',
            '    function y = ismethod(obj, varargin), y = false; end',
            '  end',
            'end',
            'classdef PlainIntrospectionProtocolProbe',
            '  properties',
            '    Value = 1',
            '  end',
            '  methods',
            '    function y = visible(obj), y = obj.Value; end',
            '  end',
            'end',
            'obj = IntrospectionProtocolProbe();',
            'plain = PlainIntrospectionProtocolProbe();',
            'a = properties(obj);',
            'b = methods(obj);',
            'c = events(obj);',
            'd = enumeration(obj);',
            'e = superclasses(obj);',
            "f = isprop(obj, 'Value');",
            "g = ismethod(obj, 'properties');",
            'nativeProps = properties(plain);',
            'nativeMethods = methods(plain);',
            "nativeIsprop = isprop(plain, 'Value');",
            "nativeIsmethod = ismethod(plain, 'visible');",
            'a; b; c; d; e; f; g; nativeProps; nativeMethods; nativeIsprop; nativeIsmethod',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=IntrospectionProtocolProbe object with properties: Value\nplain=PlainIntrospectionProtocolProbe object with properties: Value\na={propMethod}\nb={methodMethod}\nc={eventMethod}\nd={enumMethod}\ne={superMethod}\nf=false\ng=false\nnativeProps={Value}\nnativeMethods={visible}\nnativeIsprop=true\nnativeIsmethod=true\n{propMethod}\n{methodMethod}\n{eventMethod}\n{enumMethod}\n{superMethod}\nfalse\nfalse\n{Value}\n{visible}\ntrue\ntrue\n',
        );
    });

    it('Should dispatch object numeric classification predicates to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef NumericClassificationProbe',
            '  methods',
            '    function tf = isnan(obj), tf = true; end',
            '    function tf = isinf(obj), tf = true; end',
            '    function tf = isfinite(obj), tf = false; end',
            '  end',
            'end',
            'classdef PlainNumericClassificationProbe',
            'end',
            'obj = NumericClassificationProbe();',
            'results = [isnan(obj), isinf(obj), isfinite(obj)];',
            'nativeResults = [isnan(NaN), isinf(Inf), isfinite(3)];',
            'results; nativeResults',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=NumericClassificationProbe object\nresults=[true,true,false]\nnativeResults=[true,true,true]\n[true,true,false]\n[true,true,true]\n',
        );
        expect(() => interpreter.Execute('plain = PlainNumericClassificationProbe(); isnan(plain)')).toThrow('isnan: invalid conversion input.');
    });

    it('Should dispatch object sparse compatibility built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef SparseCompatibilityProbe',
            '  methods',
            '    function y = full(obj), y = 10; end',
            '    function y = sparse(obj, varargin), y = 20 + numel(varargin); end',
            '    function y = nnz(obj), y = 30; end',
            '    function y = nzmax(obj), y = 40; end',
            '    function y = nonzeros(obj), y = [50; 51]; end',
            '  end',
            'end',
            'obj = SparseCompatibilityProbe();',
            'a = full(obj);',
            'b = sparse(obj, 1, 2);',
            'c = nnz(obj);',
            'd = nzmax(obj);',
            'e = nonzeros(obj);',
            'nativeFull = full([1, 0; 0, 2]);',
            'nativeSparse = sparse(2, 2);',
            'nativeNnz = nnz([1, 0; 2, 0]);',
            'nativeNzmax = nzmax([1, 0; 2, 0]);',
            'nativeNonzeros = nonzeros([1, 0; 2, 0]);',
            'a; b; c; d; e; nativeFull; nativeSparse; nativeNnz; nativeNzmax; nativeNonzeros',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=SparseCompatibilityProbe object\na=10\nb=22\nc=30\nd=40\ne=[50;\n51]\nnativeFull=[1,0;\n0,2]\nnativeSparse=[0,0;\n0,0]\nnativeNnz=2\nnativeNzmax=2\nnativeNonzeros=[1;\n2]\n10\n22\n30\n40\n[50;\n51]\n[1,0;\n0,2]\n[0,0;\n0,0]\n2\n2\n[1;\n2]\n',
        );
    });

    it('Should dispatch object reductions, searches, and sorting built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ReductionProbe',
            '  methods',
            '    function y = sum(obj, varargin), y = 10 + numel(varargin); end',
            '    function y = prod(obj, varargin), y = 20 + numel(varargin); end',
            '    function y = sumsq(obj, varargin), y = 30 + numel(varargin); end',
            '    function y = cumsum(obj, varargin), y = 40 + numel(varargin); end',
            '    function y = cumprod(obj, varargin), y = 50 + numel(varargin); end',
            '    function y = all(obj, varargin), y = false; end',
            '    function y = any(obj, varargin), y = true; end',
            '    function y = min(obj, varargin), y = 60 + numel(varargin); end',
            '    function y = max(obj, varargin), y = 70 + numel(varargin); end',
            '    function y = cummin(obj, varargin), y = 80 + numel(varargin); end',
            '    function y = cummax(obj, varargin), y = 90 + numel(varargin); end',
            '    function y = mean(obj, varargin), y = 100 + numel(varargin); end',
            '    function y = var(obj, varargin), y = 110 + numel(varargin); end',
            '    function y = std(obj, varargin), y = 120 + numel(varargin); end',
            '    function [v, idx] = sort(obj, varargin), v = 130 + numel(varargin); idx = 131; end',
            '    function [i, j, v] = find(obj, varargin), i = 140 + numel(varargin); j = 141; v = 142; end',
            '  end',
            'end',
            'obj = ReductionProbe();',
            'a = sum(obj, 2);',
            'b = prod(obj);',
            'c = sumsq(obj, 1);',
            'd = cumsum(obj, 1);',
            'e = cumprod(obj);',
            'f = all(obj);',
            'g = any(obj);',
            'h = min(obj, [], 1);',
            'k = max(obj, [], 1);',
            'm = cummin(obj, 1);',
            'n = cummax(obj);',
            'p = mean(obj, 1);',
            'q = var(obj, 0, 1);',
            'r = std(obj, 0, 1);',
            "[sv, si] = sort(obj, 1, 'descend');",
            "[fi, fj, fv] = find(obj, 2, 'last');",
            'native = [sum([1,2]), prod([2,3]), all([1,0]), any([0,1])];',
            'a; b; c; d; e; f; g; h; k; m; n; p; q; r; sv; si; fi; fj; fv; native',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=ReductionProbe object\na=11\nb=20\nc=31\nd=41\ne=50\nf=false\ng=true\nh=62\nk=72\nm=81\nn=90\np=101\nq=112\nr=122\nsv=132\nsi=131\nfi=142\nfj=141\nfv=142\nnative=[3,6,false,true]\n11\n20\n31\n41\n50\nfalse\ntrue\n62\n72\n81\n90\n101\n112\n122\n132\n131\n142\n141\n142\n[3,6,false,true]\n',
        );
    });

    it('Should dispatch object sampling, grid, and norm built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef GridNormProbe',
            '  methods',
            '    function y = linspace(obj, varargin), y = 10 + numel(varargin); end',
            '    function y = logspace(obj, varargin), y = 20 + numel(varargin); end',
            '    function [x, y, z] = meshgrid(obj, varargin), x = 30 + numel(varargin); y = 31; z = 32; end',
            '    function [x, y, z] = ndgrid(obj, varargin), x = 40 + numel(varargin); y = 41; z = 42; end',
            '    function y = norm(obj, varargin), y = 50 + numel(varargin); end',
            '  end',
            'end',
            'obj = GridNormProbe();',
            'a = linspace(obj, 2, 3);',
            'b = logspace(obj, 2);',
            '[mx, my, mz] = meshgrid(obj, 1, 2);',
            '[nx, ny] = ndgrid(obj, 1);',
            "k = norm(obj, 'fro');",
            'native = [linspace(1, 3, 3), norm([3, 4])];',
            'a; b; mx; my; mz; nx; ny; k; native',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=GridNormProbe object\na=12\nb=21\nmx=32\nmy=31\nmz=32\nnx=41\nny=41\nk=51\nnative=[1,2,3,5]\n12\n21\n32\n31\n32\n41\n41\n51\n[1,2,3,5]\n',
        );
    });

    it('Should dispatch object factory built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef FactoryProbe',
            '  methods',
            '    function y = zeros(obj, varargin), y = 10 + numel(varargin); end',
            '    function y = ones(obj, varargin), y = 20 + numel(varargin); end',
            '    function y = rand(obj, varargin), y = 30 + numel(varargin); end',
            '    function y = randi(obj, varargin), y = 40 + numel(varargin); end',
            '    function y = spalloc(obj, varargin), y = 50 + numel(varargin); end',
            '  end',
            'end',
            'obj = FactoryProbe();',
            'a = zeros(obj, 2);',
            'b = ones(obj);',
            'c = rand(obj, 1, 2);',
            'd = randi(obj, 1, 2);',
            'e = spalloc(obj, 2, 3);',
            'nativeZeros = zeros(1, 2);',
            'nativeOnes = ones(1, 2);',
            'nativeRandSize = size(rand(1, 2));',
            'nativeRandiSize = size(randi(5, 1, 2));',
            'nativeSpalloc = spalloc(2, 2, 3);',
            'a; b; c; d; e; nativeZeros; nativeOnes; nativeRandSize; nativeRandiSize; nativeSpalloc',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=FactoryProbe object\na=11\nb=20\nc=32\nd=42\ne=52\nnativeZeros=[0,0]\nnativeOnes=[1,1]\nnativeRandSize=[1,2]\nnativeRandiSize=[1,2]\nnativeSpalloc=[0,0;\n0,0]\n11\n20\n32\n42\n52\n[0,0]\n[1,1]\n[1,2]\n[1,2]\n[0,0;\n0,0]\n',
        );
    });

    it('Should dispatch object shape-transform built-ins to class methods when available.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ShapeTransformProbe',
            '  methods',
            '    function y = repmat(obj, varargin), y = 10 + numel(varargin); end',
            '    function y = reshape(obj, varargin), y = 20 + numel(varargin); end',
            '    function y = squeeze(obj), y = 30; end',
            '    function y = flip(obj, varargin), y = 40 + numel(varargin); end',
            '    function y = fliplr(obj), y = 50; end',
            '    function y = flipud(obj), y = 60; end',
            '    function y = rot90(obj, varargin), y = 70 + numel(varargin); end',
            '    function y = permute(obj, order), y = 80 + numel(order); end',
            '    function y = ipermute(obj, order), y = 90 + numel(order); end',
            '    function y = circshift(obj, varargin), y = 100 + numel(varargin); end',
            '    function [b, n] = shiftdim(obj, varargin), b = 110 + numel(varargin); n = 111; end',
            '  end',
            'end',
            'obj = ShapeTransformProbe();',
            'a = repmat(obj, 2, 3);',
            'b = reshape(obj, 2, 3);',
            'c = squeeze(obj);',
            'd = flip(obj, 2);',
            'e = fliplr(obj);',
            'f = flipud(obj);',
            'g = rot90(obj, 2);',
            'h = permute(obj, [2,1]);',
            'k = ipermute(obj, [2,1]);',
            'm = circshift(obj, [1,2]);',
            '[s, n] = shiftdim(obj);',
            'nativeReshape = reshape([1,2,3,4], 2, 2);',
            'nativeFlip = fliplr([1,2]);',
            'a; b; c; d; e; f; g; h; k; m; s; n; nativeReshape; nativeFlip',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'obj=ShapeTransformProbe object\na=12\nb=22\nc=30\nd=41\ne=50\nf=60\ng=71\nh=82\nk=92\nm=101\ns=110\nn=111\nnativeReshape=[1,3;\n2,4]\nnativeFlip=[2,1]\n12\n22\n30\n41\n50\n60\n71\n82\n92\n101\n110\n111\n[1,3;\n2,4]\n[2,1]\n',
        );
    });

    it('Should parse classdef sections with attributes, accessors, methods, events, and enumerations.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef ParserConformanceClass < handle',
            '  properties (Access = private, Dependent)',
            '    Value',
            '  end',
            '  methods (Access = public)',
            '    function y = get.Value(obj)',
            '      y = 1;',
            '    end',
            '    function obj = set.Value(obj, value)',
            '    end',
            '  end',
            '  methods (Static)',
            '    function y = make()',
            '      y = 1;',
            '    end',
            '  end',
            '  events',
            '    Changed',
            '  end',
            '  enumeration',
            '    One(1)',
            '  end',
            'end',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'CLASSDEF ParserConformanceClass < handle\nPROPERTIES (Access=private,Dependent)\nValue\nENDPROPERTIES\nMETHODS (Access=public)\nFUNCTION y=get.Value(obj)\ny=1\nENDFUNCTION\nFUNCTION obj=set.Value(obj,value)\nENDFUNCTION\nENDMETHODS\nMETHODS (Static)\nFUNCTION y=make()\ny=1\nENDFUNCTION\nENDMETHODS\nEVENTS\nChanged\nENDEVENTS\nENUMERATION\nOne(1)\nENDENUMERATION\nENDCLASSDEF\n',
        );
    });

    it('Should keep registered word-list commands compatible with separators, quotes, and continuations.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });
        const source = ['cmdprobe alpha ...', ' beta; cmdprobe "two words" \'single words\', x = 1'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('cmdprobe alpha beta\ncmdprobe two words single words\nx=1\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('alpha|beta\ntwo words|single words\nx=1\n');
    });

    it('Should keep escaped quoted strings compatible in expressions and word-list commands.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });
        const source = [
            "singleQuote = 'can''t';",
            'doubleQuote = "a""b";',
            "singleBackslash = 'a\\nb';",
            'doubleEscape = "a\\nb";',
            'hexEscape = "\\x41";',
            'unicodeEscape = "\\u0042";',
            'cmdprobe \'can\'\'t\' "a""b"',
            'singleQuote; doubleQuote; singleBackslash; doubleEscape; hexEscape; unicodeEscape',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'singleQuote=can\'t\ndoubleQuote=a"b\nsingleBackslash=a\\nb\ndoubleEscape=a\nb\nhexEscape=A\nunicodeEscape=B\ncmdprobe can\'t a"b\nsingleQuote\ndoubleQuote\nsingleBackslash\ndoubleEscape\nhexEscape\nunicodeEscape\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'singleQuote=can\'t\ndoubleQuote=a"b\nsingleBackslash=a\\nb\ndoubleEscape=a\nb\nhexEscape=A\nunicodeEscape=B\ncan\'t|a"b\ncan\'t\na"b\na\\nb\na\nb\nA\nB\n',
        );
    });

    it('Should keep command-form word lists context-sensitive inside blocks and around assignment-like text.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
                assignprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                    preserveAssignment: true,
                },
            },
        });
        const source = [
            'if true',
            '  cmdprobe inside if end function classdef arguments',
            'end',
            'for k = 1:2',
            '  cmdprobe +pkg/@Class/file.m ./relative/path foo.bar',
            'end',
            'try',
            '  cmdprobe try body',
            'catch',
            '  cmdprobe catch body',
            'end',
            'x = (1); cmdprobe after paren',
            'cmdprobe alpha # trailing command comment',
            'cmdprobe beta ...',
            '% continued whole-line comment',
            '  gamma ... # continued trailing comment',
            '  delta',
            'cmdprobe = literalAssignment',
            'assignprobe = 41;',
            'assignprobe += 1;',
            'cmdprobe assignValue assignprobe',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'IF true\ncmdprobe inside if end function classdef arguments\n\nENDIF\nFOR k=1:2\ncmdprobe +pkg/@Class/file.m ./relative/path foo.bar\n\nENDFOR\nTRY\ncmdprobe try body\n\nCATCH\ncmdprobe catch body\n\nEND_TRY_CATCH\nx=1\ncmdprobe after paren\ncmdprobe alpha\ncmdprobe beta gamma delta\ncmdprobe = literalAssignment\nassignprobe=41\nassignprobe+=1\ncmdprobe assignValue assignprobe\n',
        );
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'inside|if|end|function|classdef|arguments\n+pkg/@Class/file.m|./relative/path|foo.bar\ntry|body\nx=1\nafter|paren\nalpha\nbeta|gamma|delta\n=|literalAssignment\nassignprobe=41\nassignprobe=42\nassignValue|assignprobe\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('assignprobe'))).toBe('42\n');
    });
});
