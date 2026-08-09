/// <reference types="jest" />
import { Interpreter, ManifestSourceResolver } from './Interpreter';

describe('MATLAB/Octave compatibility stability fixtures.', () => {
    it('Should execute a mixed parser and semantics fixture without regressions.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function [total scaled] = fixtureentry(values, opts)',
            '  arguments',
            '    values cell',
            '    opts.Scale (1,1) double = 2',
            '  end',
            '  [a b c] = values{:};',
            '  total = a + b + c;',
            '  scaled = total * opts.Scale;',
            'end',
            'C = {1, 2, 3};',
            'pairs = {"Scale", 4};',
            '[total scaled] = fixtureentry(C, pairs{:});',
            'S(1).x = total;',
            'S(2).x = scaled;',
            '[sx sy] = S.x;',
            'T.a = total;',
            'T.b = scaled;',
            'fieldTotal = 0;',
            'for [value, name] = T',
            '  fieldTotal = fieldTotal + value;',
            'end',
            'lastP = 0;',
            'parfor (k = 1:3, 2)',
            '  lastP = k;',
            'end',
            'result = [total, scaled, sx, sy, fieldTotal, lastP];',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('[6,24,6,24,30,3]\n');
    });

    it('Should resolve imported host-provided functions and classes in one fixture.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.ValueBox': ['classdef ValueBox', '  properties', '    Value = 7;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.math.shift': ['function y = shift(x)', '  y = x + 1;', 'end'].join('\n'),
            },
        });
        const source = ['import pkg.ValueBox', 'import pkg.math.shift', 'box = ValueBox();', 'result = box.Value + shift(4);'].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('12\n');
    });

    it('Should keep local definitions ahead of wildcard imports in integrated fixtures.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.shadow.pick': ['function y = pick(x)', '  y = x + 100;', 'end'].join('\n'),
            },
        });
        const source = ['import pkg.shadow.*', 'function y = pick(x)', '  y = x + 1;', 'end', 'result = pick(4);'].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('5\n');
    });

    it('Should prefer local functions over external classes with the same simple name.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                LocalWins: ['classdef LocalWins', '  properties', '    Value = 99;', '  end', 'end'].join('\n'),
            },
        });
        const source = ['function y = LocalWins()', '  y = 14;', 'end', 'result = LocalWins();'].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('14\n');
    });

    it('Should prefer host function sources over host class sources with the same name.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                SourceWins: ['classdef SourceWins', '  properties', '    Value = 99;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                SourceWins: ['function y = SourceWins()', '  y = 23;', 'end'].join('\n'),
            },
        });

        interpreter.Execute('result = SourceWins();');

        expect(interpreter.Unparse(interpreter.Execute('result; exist("SourceWins", "class"); exist("SourceWins", "function")'))).toBe('23\n8\n2\n');
    });

    it('Should keep lookup queries from changing host function versus class precedence.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                LookupSideEffect: ['classdef LookupSideEffect', '  properties', '    Value = 99;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                LookupSideEffect: ['function y = LookupSideEffect()', '  y = 29;', 'end'].join('\n'),
            },
        });

        expect(interpreter.Unparse(interpreter.Execute('exist("LookupSideEffect", "class"); which("LookupSideEffect"); result = LookupSideEffect(); result'))).toBe(
            '8\nLookupSideEffect is a user-defined function\nresult=29\n29\n',
        );
    });

    it('Should prefer imported function sources over imported external classes with the same name.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.same.ImportedWins': ['classdef ImportedWins', '  properties', '    Value = 99;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.same.ImportedWins': ['function y = ImportedWins()', '  y = 31;', 'end'].join('\n'),
            },
        });

        interpreter.Execute(['import pkg.same.ImportedWins', 'result = ImportedWins();'].join('\n'));

        expect(interpreter.Unparse(interpreter.Execute('result; exist("ImportedWins", "class"); exist("ImportedWins", "function")'))).toBe('31\n8\n2\n');
    });

    it('Should keep imported lookup queries from changing imported function versus class precedence.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.same.ImportedLookupSideEffect': ['classdef ImportedLookupSideEffect', '  properties', '    Value = 99;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.same.ImportedLookupSideEffect': ['function y = ImportedLookupSideEffect()', '  y = 33;', 'end'].join('\n'),
            },
        });

        expect(
            interpreter.Unparse(
                interpreter.Execute(
                    [
                        'import pkg.same.ImportedLookupSideEffect',
                        'exist("ImportedLookupSideEffect", "class")',
                        'which("ImportedLookupSideEffect")',
                        'result = ImportedLookupSideEffect();',
                        'result',
                    ].join('\n'),
                ),
            ),
        ).toBe('8\nImportedLookupSideEffect is a user-defined function\nresult=33\n33\n');
    });

    it('Should clear loaded host functions while keeping host sources reloadable.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                ReloadableFunction: ['function y = ReloadableFunction(x)', '  y = x + 5;', 'end'].join('\n'),
            },
        });

        interpreter.Execute(
            ['first = ReloadableFunction(2);', 'clear ReloadableFunction', 'afterClear = exist("ReloadableFunction", "function");', 'second = ReloadableFunction(3);'].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('first; afterClear; second'))).toBe('7\n2\n8\n');
    });

    it('Should clear loaded host classes while keeping host class sources reloadable.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                ReloadableClass: ['classdef ReloadableClass', '  properties', '    Value = 12;', '  end', 'end'].join('\n'),
            },
        });

        interpreter.Execute(['first = ReloadableClass().Value;', 'clear ReloadableClass', 'afterClear = exist("ReloadableClass", "class");', 'second = ReloadableClass().Value;'].join('\n'));

        expect(interpreter.Unparse(interpreter.Execute('first; afterClear; second'))).toBe('12\n8\n12\n');
    });

    it('Should clear loaded classes collectively without removing variables or functions.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                ReloadableClassOne: ['classdef ReloadableClassOne', '  properties', '    Value = 12;', '  end', 'end'].join('\n'),
                ReloadableClassTwo: ['classdef ReloadableClassTwo', '  properties', '    Value = 14;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                stillCallable: ['function y = stillCallable(x)', '  y = x + 1;', 'end'].join('\n'),
            },
        });

        interpreter.Execute(
            [
                'first = ReloadableClassOne().Value + ReloadableClassTwo().Value;',
                'classes = 99;',
                'beforeFunction = stillCallable(4);',
                'clear classes',
                'classOneCode = exist("ReloadableClassOne", "class");',
                'classTwoCode = exist("ReloadableClassTwo", "class");',
                'afterFunction = stillCallable(5);',
                'second = ReloadableClassOne().Value + ReloadableClassTwo().Value;',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('first; classes; beforeFunction; classOneCode; classTwoCode; afterFunction; second'))).toBe('26\n99\n5\n8\n8\n6\n26\n');
    });

    it('Should clear imported loaded symbols by their simple alias.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.clear.ImportedClearClass': ['classdef ImportedClearClass', '  properties', '    Value = 18;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.clear.ImportedClearFunction': ['function y = ImportedClearFunction(x)', '  y = x + 9;', 'end'].join('\n'),
            },
        });

        interpreter.Execute(
            [
                'import pkg.clear.ImportedClearClass',
                'import pkg.clear.ImportedClearFunction',
                'beforeClass = ImportedClearClass().Value;',
                'beforeFunction = ImportedClearFunction(1);',
                'clear ImportedClearClass ImportedClearFunction',
                'afterClass = exist("ImportedClearClass", "class");',
                'afterFunction = exist("ImportedClearFunction", "function");',
                'againClass = ImportedClearClass().Value;',
                'againFunction = ImportedClearFunction(2);',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('beforeClass; beforeFunction; afterClass; afterFunction; againClass; againFunction'))).toBe('18\n10\n8\n2\n18\n11\n');
    });

    it('Should clear the active import list without removing qualified host sources.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.clearimport.shift': ['function y = shift(x)', '  y = x + 4;', 'end'].join('\n'),
            },
        });

        interpreter.Execute(
            ['import pkg.clearimport.shift', 'before = shift(2);', 'clear import', 'afterImport = exist("shift", "function");', 'qualified = pkg.clearimport.shift(3);'].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('before; afterImport; qualified'))).toBe('6\n0\n7\n');
        expect(() => interpreter.Execute('shift(2)')).toThrow("'shift' undefined.");
    });

    it('Should prefer registered imported classes over imported functions with the same name.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.same.RegisteredWins': ['function y = RegisteredWins()', '  y = 41;', 'end'].join('\n'),
            },
        });
        interpreter.Execute(['classdef pkg.same.RegisteredWins', '  properties', '    Value = 37;', '  end', 'end'].join('\n'));

        interpreter.Execute(['import pkg.same.RegisteredWins', 'obj = RegisteredWins();', 'result = obj.Value;'].join('\n'));

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('37\n');
    });

    it('Should expose imported host-provided functions and classes through lookup built-ins.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.lookup.LookupBox': ['classdef LookupBox', '  properties', '    Value = 9;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.lookup.bump': ['function y = bump(x)', '  y = x + 2;', 'end'].join('\n'),
            },
        });
        const source = [
            'import pkg.lookup.LookupBox',
            'import pkg.lookup.bump',
            'box = LookupBox();',
            'value = bump(box.Value);',
            'classCode = exist("LookupBox", "class");',
            'functionCode = exist("bump", "function");',
            'classWhich = which("LookupBox");',
            'functionWhich = which("bump");',
            'result = [value, classCode, functionCode];',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result; classWhich; functionWhich'))).toBe('[11,8,2]\nLookupBox is a class\nbump is a user-defined function\n');
    });

    it('Should call qualified host-provided functions and classes without imports.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.direct.DirectBox': ['classdef DirectBox', '  properties', '    Value = 5;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.direct.scale': ['function y = scale(x)', '  y = x * 3;', 'end'].join('\n'),
            },
        });

        interpreter.Execute('box = pkg.direct.DirectBox(); result = pkg.direct.scale(box.Value);');

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('15\n');
    });

    it('Should keep variable dot access ahead of qualified package lookup.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.direct.scale': ['function y = scale(x)', '  y = x * 3;', 'end'].join('\n'),
            },
        });

        interpreter.Execute('pkg.direct.scale = 11; value = pkg.direct.scale;');

        expect(interpreter.Unparse(interpreter.Execute('value'))).toBe('11\n');
    });

    it('Should dispatch qualified class static members through the structured resolver.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.direct.StaticBox': [
                    'classdef StaticBox',
                    '  properties (Constant)',
                    '    Base = 10;',
                    '  end',
                    '  methods (Static)',
                    '    function y = scale(x)',
                    '      y = x * 4;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            },
        });

        interpreter.Execute('value = pkg.direct.StaticBox.scale(3) + pkg.direct.StaticBox.Base; emptySize = size(pkg.direct.StaticBox.empty(0, 2));');

        expect(interpreter.Unparse(interpreter.Execute('value; emptySize'))).toBe('22\n[0,2]\n');
    });

    it('Should resolve imported function handles and explicit imports before wildcard imports.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.first.choose': ['function y = choose(x)', '  y = x + 10;', 'end'].join('\n'),
                'pkg.second.choose': ['function y = choose(x)', '  y = x + 100;', 'end'].join('\n'),
                'pkg.first.handleTarget': ['function y = handleTarget(x)', '  y = x + 1;', 'end'].join('\n'),
            },
        });
        const source = [
            'import pkg.second.*',
            'import pkg.first.choose',
            'import pkg.first.handleTarget',
            'f = @handleTarget;',
            'fromExplicit = choose(3);',
            'fromHandle = f(4);',
            'result = [fromExplicit, fromHandle];',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('[13,5]\n');
    });

    it('Should keep function-local imports visible to local calls and handles.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.local.LocalBox': ['classdef LocalBox', '  properties', '    Value = 6;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.local.plusTwo': ['function y = plusTwo(x)', '  y = x + 2;', 'end'].join('\n'),
            },
        });
        const source = [
            'function y = useLocalImports(x)',
            '  import pkg.local.LocalBox',
            '  import pkg.local.plusTwo',
            '  f = @plusTwo;',
            '  box = LocalBox();',
            '  y = f(x) + box.Value;',
            'end',
            'result = useLocalImports(4);',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('12\n');
    });

    it('Should keep returned imported function handles bound to their import scope.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.factory.plusTwo': ['function y = plusTwo(x)', '  y = x + 2;', 'end'].join('\n'),
            },
        });
        const source = [
            'function [direct dynamic] = importedHandleFactory()',
            '  import pkg.factory.plusTwo',
            '  direct = @plusTwo;',
            '  dynamic = str2func("plusTwo");',
            'end',
            '[direct dynamic] = importedHandleFactory();',
            'qualified = str2func("pkg.factory.plusTwo");',
            'result = [direct(3), dynamic(4), qualified(5)];',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result'))).toBe('[5,6,7]\n');
    });

    it('Should resolve fully qualified function handles and lookup queries.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.qualified.QualifiedBox': ['classdef QualifiedBox', '  properties', '    Value = 8;', '  end', 'end'].join('\n'),
            },
            functionSourceTable: {
                'pkg.qualified.twice': ['function y = twice(x)', '  y = x * 2;', 'end'].join('\n'),
            },
        });
        const source = [
            'f = @pkg.qualified.twice;',
            'box = pkg.qualified.QualifiedBox();',
            'value = f(box.Value);',
            'functionCode = exist("pkg.qualified.twice", "function");',
            'classCode = exist("pkg.qualified.QualifiedBox", "class");',
            'functionWhich = which("pkg.qualified.twice");',
            'classWhich = which("pkg.qualified.QualifiedBox");',
            'result = [value, functionCode, classCode];',
        ].join('\n');

        interpreter.Execute(source);

        expect(interpreter.Unparse(interpreter.Execute('result; functionWhich; classWhich'))).toBe(
            '[16,2,8]\npkg.qualified.twice is a user-defined function\npkg.qualified.QualifiedBox is a class\n',
        );
    });

    it('Should keep dynamic function handles reloadable after clear functions.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                DynamicReloadTarget: ['function y = DynamicReloadTarget(x)', '  y = x + 10;', 'end'].join('\n'),
                'pkg.dynamic.ImportedReloadTarget': ['function y = ImportedReloadTarget(x)', '  y = x + 20;', 'end'].join('\n'),
            },
        });
        const source = [
            'f = @DynamicReloadTarget;',
            'g = str2func("DynamicReloadTarget");',
            'first = [f(1), g(2), feval("DynamicReloadTarget", 3)];',
            'clear functions',
            'afterClearCode = exist("DynamicReloadTarget", "function");',
            'second = [f(4), g(5), feval("DynamicReloadTarget", 6)];',
            'function [h, t] = makeImportedReloadHandles()',
            '  import pkg.dynamic.ImportedReloadTarget',
            '  h = @ImportedReloadTarget;',
            '  t = str2func("ImportedReloadTarget");',
            'end',
            '[h, t] = makeImportedReloadHandles();',
            'importFirst = [h(1), t(2)];',
            'clear functions',
            'importSecond = [h(3), t(4)];',
            'qualified = feval("pkg.dynamic.ImportedReloadTarget", 5);',
            'first; afterClearCode; second; importFirst; importSecond; qualified',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'f=@DynamicReloadTarget\ng=@DynamicReloadTarget\nfirst=[11,12,13]\nafterClearCode=2\nsecond=[14,15,16]\nh=@ImportedReloadTarget\nt=@ImportedReloadTarget\nimportFirst=[21,22]\nimportSecond=[23,24]\nqualified=25\n[11,12,13]\n2\n[14,15,16]\n[21,22]\n[23,24]\n25\n',
        );
    });

    it('Should keep dynamic imports and source-created functions visible to later dispatch.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                'pkg.evaldispatch.shift': ['function y = shift(x)', '  y = x + 30;', 'end'].join('\n'),
            },
            scriptSourceTable: {
                dynamicDispatchScript: ['import pkg.evaldispatch.shift', 'scriptHandle = @shift;', 'scriptValue = shift(1);'].join('\n'),
            },
        });
        const source = [
            "eval('import pkg.evaldispatch.shift; evalHandle = @shift; evalValue = shift(2);');",
            'source dynamicDispatchScript',
            'afterEvalHandle = evalHandle(3);',
            'afterScriptHandle = scriptHandle(4);',
            'afterString = feval("shift", 5);',
            'evalValue; scriptValue; afterEvalHandle; afterScriptHandle; afterString',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'evalHandle=@shift\nevalValue=32\nscriptHandle=@shift\nscriptValue=31\nafterEvalHandle=33\nafterScriptHandle=34\nafterString=35\n32\n31\n33\n34\n35\n',
        );
    });

    it('Should re-dispatch names after variables shadow and unshadow functions.', () => {
        const interpreter = Interpreter.Create({
            functionSourceTable: {
                dynamicShadowTarget: ['function y = dynamicShadowTarget(x)', '  y = x + 40;', 'end'].join('\n'),
            },
        });
        const source = [
            'dynamicShadowTarget = [100, 200, 300];',
            'indexed = dynamicShadowTarget(2);',
            'clear dynamicShadowTarget',
            'called = dynamicShadowTarget(2);',
            'dynamicShadowTarget = 7;',
            'whichVariable = which("dynamicShadowTarget");',
            'clear dynamicShadowTarget',
            'whichFunction = which("dynamicShadowTarget");',
            'again = feval("dynamicShadowTarget", 3);',
            'indexed; called; whichVariable; whichFunction; again',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'dynamicShadowTarget=[100,200,300]\nindexed=200\ncalled=42\ndynamicShadowTarget=7\nwhichVariable=dynamicShadowTarget is a variable\nwhichFunction=dynamicShadowTarget is a user-defined function\nagain=43\n200\n42\ndynamicShadowTarget is a variable\ndynamicShadowTarget is a user-defined function\n43\n',
        );
    });

    it('Should keep dynamic static-method dispatch reloadable after clear classes.', () => {
        const interpreter = Interpreter.Create({
            classSourceTable: {
                'pkg.dynamic.StaticDispatch': [
                    'classdef StaticDispatch',
                    '  properties (Constant)',
                    '    Base = 9;',
                    '  end',
                    '  methods (Static)',
                    '    function y = scale(x)',
                    '      y = x * 10;',
                    '    end',
                    '  end',
                    'end',
                ].join('\n'),
            },
        });
        const source = [
            'direct = pkg.dynamic.StaticDispatch.scale(1);',
            'f = str2func("pkg.dynamic.StaticDispatch.scale");',
            'first = f(2);',
            'clear classes',
            'afterClearCode = exist("pkg.dynamic.StaticDispatch", "class");',
            'second = f(3);',
            'third = feval("pkg.dynamic.StaticDispatch.scale", 4);',
            'constant = pkg.dynamic.StaticDispatch.Base;',
            'direct; first; afterClearCode; second; third; constant',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'direct=10\nf=@pkg.dynamic.StaticDispatch.scale\nfirst=20\nafterClearCode=8\nsecond=30\nthird=40\nconstant=9\n10\n20\n8\n30\n40\n9\n',
        );
    });

    it('Should execute browser-manifest sources through the unified source resolver.', async () => {
        const responses: Record<string, string> = {
            '/m-files/+pkg/+math/increment.m': ['function y = increment(x)', '  y = x + 1;', 'end'].join('\n'),
            '/m-files/+pkg/+math/twice.m': ['function y = twice(x)', '  y = x * 2;', 'end'].join('\n'),
            '/m-files/+pkg/+web/@ManifestBox/ManifestBox.m': ['classdef ManifestBox', '  properties', '    Value = 4;', '  end', '  methods', '    y = read(obj, x)', '  end', 'end'].join(
                '\n',
            ),
            '/m-files/+pkg/+web/@ManifestBox/read.m': [
                'function y = read(obj, x)',
                '  y = obj.Value + localManifestOffset(x);',
                'end',
                'function z = localManifestOffset(x)',
                '  z = x + 1;',
                'end',
            ].join('\n'),
            '/m-files/startup.m': ['import pkg.math.increment', 'manifestValue = increment(2);'].join('\n'),
        };
        const sourceResolver = await ManifestSourceResolver.fromManifest(
            {
                baseUrl: '/m-files',
                files: [
                    { path: '+pkg/+math/increment.m', kind: 'function' },
                    { path: '+pkg/+math/twice.m', kind: 'function' },
                    { path: '+pkg/+web/@ManifestBox/ManifestBox.m', kind: 'class' },
                    { path: '+pkg/+web/@ManifestBox/read.m', kind: 'class' },
                    { path: 'startup.m', kind: 'script' },
                ],
            },
            async (url: string) => ({
                ok: true,
                text: async () => responses[url],
            }),
        );
        const interpreter = Interpreter.Create({ sourceResolver });

        interpreter.RunScriptFile('startup.m');
        interpreter.Execute(
            [
                'import pkg.math.*',
                'import pkg.web.ManifestBox',
                'box = ManifestBox();',
                'f = @twice;',
                'g = str2func("increment");',
                'value = f(box.Value) + g(4) + box.read(2);',
                'qualified = pkg.math.twice(3);',
                'codes = [exist("twice", "function"), exist("ManifestBox", "class")];',
                'whichTwice = which("twice");',
                'whichBox = which("ManifestBox");',
                'result = [manifestValue, value, qualified, codes];',
            ].join('\n'),
        );

        expect(interpreter.Unparse(interpreter.Execute('result; whichTwice; whichBox; exist("localManifestOffset", "function")'))).toBe(
            '[3,20,6,2,8]\ntwice is a user-defined function\nManifestBox is a class\n0\n',
        );
    });
});
