/// <reference types="jest" />
import { CharString } from './CharString';
import { Interpreter, SyntaxError } from './Interpreter';

describe('Parser compatibility fixtures.', () => {
    it('Should report parser syntax errors with source context.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Parse('if 1\n  x = 2')).toThrow(SyntaxError);
        expect(() => interpreter.Parse('if 1\n  x = 2')).toThrow("syntax error at 2:8: mismatched input '<EOF>' expecting {ENDIF, END, ELSEIF, ELSE}\n  x = 2\n       ^");
    });

    it('Should report lexer syntax errors with source context.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Parse('@')).toThrow(SyntaxError);
        expect(() => interpreter.Parse('@')).toThrow("syntax error at 1:2: no viable alternative at input '@'\n@\n ^");
    });

    it('Should reject assignments and increments inside anonymous function bodies.', () => {
        const interpreter = Interpreter.Create();
        const expectedError = 'anonymous function bodies cannot contain assignment, increment, or decrement operators.';

        expect(interpreter.Unparse(interpreter.Parse('@(x) x + 1'))).toBe('@(x) x+1\n');
        expect(() => interpreter.Parse('@(x) x = 1')).toThrow(expectedError);
        expect(() => interpreter.Parse('@(x) x += 1')).toThrow(expectedError);
        expect(() => interpreter.Parse('@(x) x++')).toThrow(expectedError);
        expect(() => interpreter.Parse('@(x) ++x')).toThrow(expectedError);
        expect(() => interpreter.Parse('@(x) (x = 1)')).toThrow(expectedError);
        expect(() => interpreter.Parse('@(x) f(1, x += 1)')).toThrow(expectedError);
    });

    it('Should reject invalid anonymous function parameter lists while parsing.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse('@(~, x, varargin) x'))).toBe('@(~,x,varargin) x\n');
        expect(() => interpreter.Parse('@(x = 1) x')).toThrow('invalid parameter list in anonymous function.');
        expect(() => interpreter.Parse('@(x, x) x')).toThrow("duplicate parameter name 'x' in anonymous function.");
        expect(() => interpreter.Parse('@(varargin, x) x')).toThrow('varargin must be the last parameter in anonymous function.');
    });

    it('Should parse direct transpose operators after double-quoted strings.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse('"abc"\''))).toBe("abc'\n");
        expect(interpreter.Unparse(interpreter.Parse('("abc")\''))).toBe("abc'\n");
        expect(interpreter.Unparse(interpreter.Parse('"abc".\''))).toBe("abc.'\n");
        expect(interpreter.Unparse(interpreter.Parse('("abc").\''))).toBe("abc.'\n");
    });

    it('Should parse direct transpose operators after end range markers.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse("A = [1 2 3]; A(1:end')"))).toBe("A=[1,2,3]\nA(1:end')\n");
        expect(interpreter.Unparse(interpreter.Parse("A = [1 2 3]; A(end')"))).toBe("A=[1,2,3]\nA(end')\n");
        expect(interpreter.Unparse(interpreter.Parse("A = [1 2 3]; A(1:end.')"))).toBe("A=[1,2,3]\nA(1:end.')\n");
        expect(interpreter.Unparse(interpreter.Parse("A = [1 2 3]; A(end.')"))).toBe("A=[1,2,3]\nA(end.')\n");
    });

    it('Should recognize catch identifiers only for simple identifier statements without separators.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse(['try', '  x = 1;', 'catch ME', '  x = 2;', 'end'].join('\n')))).toBe('TRY\nx=1\n\nCATCH ME\nx=2\n\nEND_TRY_CATCH\n');
        expect(interpreter.Unparse(interpreter.Parse(['try', '  x = 1;', 'catch', '  ME', '  x = 2;', 'end'].join('\n')))).toBe('TRY\nx=1\n\nCATCH\nME\nx=2\n\nEND_TRY_CATCH\n');
        expect(interpreter.Unparse(interpreter.Parse(['try', '  x = 1;', 'catch ME(1)', '  x = 2;', 'end'].join('\n')))).toBe('TRY\nx=1\n\nCATCH\nME(1)\nx=2\n\nEND_TRY_CATCH\n');
        expect(interpreter.Unparse(interpreter.Parse(['try', '  x = 1;', 'catch ME.message', '  x = 2;', 'end'].join('\n')))).toBe('TRY\nx=1\n\nCATCH\nME.message\nx=2\n\nEND_TRY_CATCH\n');
    });

    it('Should execute script-like separators, continuations, and comments together.', () => {
        const interpreter = Interpreter.Create();
        const source = ['x = 1+...', '% comment', '2;', 'y = (x', '%{', 'block', '%}', '+ 3);', 'z = y'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=3\ny=6\nz=6\n');
    });

    it('Should parse word-list command continuations without stealing assignments.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse(['clear ...', ' x'].join('\n')))).toBe('clear x\n');
        expect(interpreter.Unparse(interpreter.Parse(['clear ... % comment', ' x'].join('\n')))).toBe('clear x\n');
        expect(interpreter.Unparse(interpreter.Parse(['clear ...', '%{', 'comment', '%}', ' x'].join('\n')))).toBe('clear x\n');
        expect(interpreter.Unparse(interpreter.Parse(['clear "a ...', ' b"'].join('\n')))).toBe('clear "a b"\n');
        expect(interpreter.Unparse(interpreter.Parse('clear x; y=1'))).toBe('clear x\ny=1\n');
        expect(interpreter.Unparse(interpreter.Parse('clear x, y=1'))).toBe('clear x\ny=1\n');
        expect(interpreter.Unparse(interpreter.Parse(['source = 1 ...', ' + 2'].join('\n')))).toBe('source=1+2\n');
        expect(interpreter.Unparse(interpreter.Parse(['source ...', ' file.m'].join('\n')))).toBe('source file.m\n');
    });

    it('Should parse MATLAB package imports as no-op declarations.', () => {
        const interpreter = Interpreter.Create();
        const source = ['import matlab.unittest.TestCase', 'import matlab.graphics.*, pkg.sub.ClassName', 'x = 3'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('import matlab.unittest.TestCase\nimport matlab.graphics.* pkg.sub.ClassName\nx=3\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('x=3\n');
    });

    it('Should parse bare import as an import-list query.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Parse('import'))).toBe('import\n');
        expect(interpreter.Unparse(interpreter.Parse('L = import'))).toBe('L=(import)\n');
    });

    it('Should parse and execute Octave-like indexing and field names in one script.', () => {
        const interpreter = Interpreter.Create();
        const source = ['A = [10, 20, 30, 40];', 'last = A(end);', 'tail = A(2:end);', 'field.end = last;', 'dyn = "end";', 'again = field.(dyn);'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('A=[10,20,30,40]\nlast=40\ntail=[20,30,40]\nfield=struct {\nend: 40\n}\ndyn=end\nagain=40\n');
    });

    it('Should parse dot fields whose names overlap with class-section keywords.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            's.properties = 1;',
            's.methods = 2;',
            's.events = 3;',
            's.enumeration = 4;',
            's.end = 5;',
            'picked = s.properties + s.methods + s.events + s.enumeration + s.end;',
        ].join('\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            [
                's=struct {\nproperties: 1\n}',
                's=struct {\nproperties: 1\nmethods: 2\n}',
                's=struct {\nproperties: 1\nmethods: 2\nevents: 3\n}',
                's=struct {\nproperties: 1\nmethods: 2\nevents: 3\nenumeration: 4\n}',
                's=struct {\nproperties: 1\nmethods: 2\nevents: 3\nenumeration: 4\nend: 5\n}',
                'picked=15',
                '',
            ].join('\n'),
        );
    });

    it('Should parse MATLAB/Octave assignment target lists.', () => {
        const interpreter = Interpreter.Create();
        const source = '[A(1) A(3)] = pair(10); [S.a S.(dyn)] = pair(20); [~, keep] = pair(30);';

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('[A(1),A(3)]=pair(10)\n[S.a,S.(dyn)]=pair(20)\n[~,keep]=pair(30)\n');
    });

    it('Should execute MATLAB/Octave assignment target lists.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'function [a, b] = pair(x)',
            '  a = x;',
            '  b = x + 1;',
            'end',
            'dyn = "b";',
            '[A(1) A(3)] = pair(10);',
            '[S.a S.(dyn)] = pair(20);',
            '[~, keep] = pair(30);',
            'A; S.a; S.b; keep',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('dyn=b\nA=[10]\nA=[10,0,11]\nS=struct {\na: 20\n}\nS=struct {\na: 20\nb: 21\n}\nkeep=31\n[10,0,11]\n20\n21\n31\n');
    });

    it('Should parse Octave-style structure field for-loop targets.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S.a = 10;',
            'S.b = 20;',
            'names = {};',
            'values = [];',
            'for [value, name] = S',
            '  names{end + 1} = name;',
            '  values(end + 1) = value;',
            'end',
            'names; values',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(['for [value, name] = S', '  keep = name;', 'end'].join('\n')))).toBe('FOR [value,name]=S\nkeep=name\n\nENDFOR\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('S=struct {\na: 10\n}\nS=struct {\na: 10\nb: 20\n}\nnames={ }(0x0)\nvalues=[ ](0x0)\n{a,b}\n[10,20]\n{a,b}\n[10,20]\n');
    });

    it('Should preserve and execute parenthesized parfor worker expressions.', () => {
        const interpreter = Interpreter.Create();
        const source = ['total = 0;', 'parfor (i = 1:4, 2)', '  total = total + i;', 'end', 'total'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(['parfor (i = 1:4, 2)', '  total = i;', 'end'].join('\n')))).toBe('PARFOR (i=1:4,2)\ntotal=i\n\nENDPARFOR\n');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('total=0\n10\n10\n');
    });

    it('Should execute chained indexing and field access with end.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'S.values = {[10, 20, 30, 40], [5; 6; 7]};',
            'lastCellVector = S.values{1}(end);',
            'tailFromField = S.values{1}(2:end);',
            'lastColumnValue = S.values{2}(end);',
            'nested.inner.data = [1, 2, 3, 4];',
            'nestedPick = nested.inner.data(end-1);',
            'dyn = "data";',
            'dynamicPick = nested.inner.(dyn)([2,end]);',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe(
            'S=struct {\nvalues: {[10,20,30,40],[5;\n6;\n7]}\n}\nlastCellVector=40\ntailFromField=[20,30,40]\nlastColumnValue=7\nnested=struct {\ninner: struct {\ndata: [1,2,3,4]\n}\n}\nnestedPick=3\ndyn=data\ndynamicPick=[2,4]\n',
        );
    });

    it('Should preserve cell elements as values before chained indexing.', () => {
        const interpreter = Interpreter.Create();
        const source = ['C = {[1, 2, 3], [4; 5; 6]};', 'first = C{1};', 'second = C{2};', 'picked = C{1}(2);'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('C={[1,2,3],[4;\n5;\n6]}\nfirst=[1,2,3]\nsecond=[4;\n5;\n6]\npicked=2\n');
    });

    it('Should parse spaced expressions inside cell indexing braces.', () => {
        const interpreter = Interpreter.Create();
        const source = ['C = {10, 20, 30};', 'k = 2;', 'picked = C{2*k - 1};', 'again = C{', '  k + 1', '};', 'previous = C{end - 1};'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toContain('picked=C{2*k-1}');
        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('C={10,20,30}\nk=2\npicked=30\nagain=30\nprevious=20\n');
    });

    it('Should accept trailing row separators in matrix and cell literals.', () => {
        const interpreter = Interpreter.Create();
        const source = ['A = [1, 2;];', 'B = [3, 4;', '];', 'C = {A, B;};', 'D = {A, B;', '};'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('A=[1,2]\nB=[3,4]\nC={[1,2],[3,4]}\nD={[1,2],[3,4]}\n');
    });

    it('Should accept Octave-style empty rows in matrix and cell literals.', () => {
        const interpreter = Interpreter.Create();
        const source = ['A = [; 1];', 'B = [1;; 2];', 'C = {; 3};', 'D = {4;;; 5};', 'E = [;];'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('A=[1]\nB=[1;\n2]\nC={3}\nD={4;\n5}\nE=[ ](0x0)\n');
    });

    it('Should distinguish binary signs from signed elements in matrix literals like Octave.', () => {
        const interpreter = Interpreter.Create();
        const source = ['binaryMinus = [1 - 1];', 'signedMinus = [1 -1];', 'binaryPlusComplex = [1 + 2i, 3];', 'signedPlusComplex = [1 +2i, 3];'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('binaryMinus=[0]\nsignedMinus=[1,-1]\nbinaryPlusComplex=[1+2i,3]\nsignedPlusComplex=[1,2i,3]\n');
    });

    it('Should keep MATLAB command syntax intact across continuation comments.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });
        const source = ['cmdprobe alpha ...', '% comment', 'beta', 'cmdprobe gamma ... % trailing comment', 'delta', 'cmdprobe epsilon ...', '%{', 'block', '%}', 'zeta'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('alpha|beta\ngamma|delta\nepsilon|zeta\n');
    });

    it('Should parse command syntax after top-level separators and spaced parentheses.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });

        expect(interpreter.Unparse(interpreter.Parse('cmdprobe (1 + 2)'))).toBe('cmdprobe (1 + 2)\n');
        expect(interpreter.Unparse(interpreter.Parse('x = 1, cmdprobe after comma'))).toBe('x=1\ncmdprobe after comma\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe (1 + 2)'))).toBe('(1|+|2)\n');
        expect(interpreter.Unparse(interpreter.Execute('x = 1, cmdprobe after comma'))).toBe('x=1\nafter|comma\n');
    });

    it('Should keep command syntax restricted to registered word-list commands.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });

        expect(interpreter.Unparse(interpreter.Parse('cmdprobe'))).toBe('cmdprobe\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe'))).toBe('\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe "alpha beta" gamma'))).toBe('alpha beta|gamma\n');
        expect(interpreter.Unparse(interpreter.Execute("cmdprobe 'single word' tail"))).toBe('single word|tail\n');
        expect(() => interpreter.Parse('unknowncmd arg')).toThrow(SyntaxError);
        expect(() => interpreter.Parse('foo bar')).toThrow(SyntaxError);
    });

    it('Should parse command-form operator and lone quote arguments as raw words.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                help: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });

        expect(interpreter.Unparse(interpreter.Parse("help .'"))).toBe("help .'\n");
        expect(interpreter.Unparse(interpreter.Parse("help '"))).toBe("help '\n");
        expect(interpreter.Unparse(interpreter.Parse('help "'))).toBe('help "\n');
        expect(interpreter.Unparse(interpreter.Execute("help .'"))).toBe(".'\n");
        expect(interpreter.Unparse(interpreter.Execute("help '"))).toBe("'\n");
        expect(interpreter.Unparse(interpreter.Execute('help "'))).toBe('"\n');
        expect(interpreter.Unparse(interpreter.Execute("help 'unterminated"))).toBe("'unterminated\n");
        expect(interpreter.Unparse(interpreter.Execute('help "unterminated'))).toBe('"unterminated\n');
        expect(interpreter.Unparse(interpreter.Execute("help 'single word' tail"))).toBe('single word|tail\n');
    });

    it('Should parse command-form operator punctuation as raw words.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });
        const operatorArgs = ['+', '-', '*', '/', '\\', '.\\', '.*', './', '.^', '^', '~', '!', '@', '?', ':', '=', '==', '<=', '>=', '&&', '||', '&', '|', '(', ')', '[', ']', '{', '}'];

        expect(interpreter.Unparse(interpreter.Execute(`cmdprobe ${operatorArgs.join(' ')}`))).toBe(`${operatorArgs.join('|')}\n`);
    });

    it('Should terminate command-form word lists at top-level separators.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });

        expect(interpreter.Unparse(interpreter.Parse('cmdprobe alpha; x = 1'))).toBe('cmdprobe alpha\nx=1\n');
        expect(interpreter.Unparse(interpreter.Parse('cmdprobe alpha, cmdprobe beta'))).toBe('cmdprobe alpha\ncmdprobe beta\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe alpha; x = 1'))).toBe('alpha\nx=1\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe alpha, cmdprobe beta'))).toBe('alpha\nbeta\n');
    });

    it('Should preserve command-form option words across continuations and comments.', () => {
        const interpreter = Interpreter.Create({
            externalCmdWListTable: {
                cmdprobe: {
                    func: (...args: string[]): CharString => new CharString(args.join('|')),
                },
            },
        });

        expect(interpreter.Unparse(interpreter.Execute('cmdprobe -flag name=value ./path/file.m'))).toBe('-flag|name=value|./path/file.m\n');
        expect(interpreter.Unparse(interpreter.Execute(['cmdprobe alpha ...', '  beta ... # continued comment', '  gamma'].join('\n')))).toBe('alpha|beta|gamma\n');
        expect(interpreter.Unparse(interpreter.Execute('cmdprobe "two words" \'single words\' bare'))).toBe('two words|single words|bare\n');
    });

    it('Should parse classdef method prototypes and negated attributes.', () => {
        const interpreter = Interpreter.Create();
        const source = [
            'classdef PrototypeClass',
            '  properties (~Dependent, !Hidden)',
            '    x',
            '  end',
            '  methods (Abstract)',
            '    y = foo(obj, x)',
            '    bar(obj)',
            '  end',
            'end',
        ].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'CLASSDEF PrototypeClass\nPROPERTIES (~Dependent,!Hidden)\nx\nENDPROPERTIES\nMETHODS (Abstract)\ny=foo(obj,x)\nbar(obj)\nENDMETHODS\nENDCLASSDEF\n',
        );
    });

    it('Should parse classdef attribute lists followed by statement separators.', () => {
        const interpreter = Interpreter.Create();
        const newlineSource = ['classdef (Sealed)', 'SeparatedClassAttributes', 'end'].join('\n');
        const commaSource = ['classdef (Hidden), CommaSeparatedClassAttributes', 'end'].join('\n');
        const semicolonSource = ['classdef (ConstructOnLoad); SemicolonSeparatedClassAttributes', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(newlineSource))).toBe('CLASSDEF (Sealed) SeparatedClassAttributes\nENDCLASSDEF\n');
        expect(interpreter.Unparse(interpreter.Parse(commaSource))).toBe('CLASSDEF (Hidden) CommaSeparatedClassAttributes\nENDCLASSDEF\n');
        expect(interpreter.Unparse(interpreter.Parse(semicolonSource))).toBe('CLASSDEF (ConstructOnLoad) SemicolonSeparatedClassAttributes\nENDCLASSDEF\n');
    });

    it('Should parse MATLAB/Octave ampersand superclass lists.', () => {
        const interpreter = Interpreter.Create();
        const source = ['classdef pkg.Child < pkg.Base & handle', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('CLASSDEF pkg.Child < pkg.Base&handle\nENDCLASSDEF\n');
    });

    it('Should parse classdef property validation declarations.', () => {
        const interpreter = Interpreter.Create();
        const source = ['classdef ValidatedProperties', '  properties', '    x (1,1) double {mustBePositive} = 1', '    label string', '  end', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('CLASSDEF ValidatedProperties\nPROPERTIES\nx(1,1) double {mustBePositive}=1\nlabel string\nENDPROPERTIES\nENDCLASSDEF\n');
        expect(interpreter.Unparse(interpreter.Execute([source, 'obj = ValidatedProperties(); obj.x; obj.label'].join('\n')))).toBe(
            'obj=ValidatedProperties object with properties: x,label\n1\n\n',
        );
    });

    it('Should parse Octave-style adjacent class events and enumerations.', () => {
        const interpreter = Interpreter.Create();
        const source = ['classdef AdjacentClassMembers', '  events Started Finished', '  end', '  enumeration Red(1) Blue(2)', '  end', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe(
            'CLASSDEF AdjacentClassMembers\nEVENTS\nStarted\nFinished\nENDEVENTS\nENUMERATION\nRed(1)\nBlue(2)\nENDENUMERATION\nENDCLASSDEF\n',
        );
        expect(interpreter.Unparse(interpreter.Execute([source, 'events("AdjacentClassMembers"); enumeration("AdjacentClassMembers"); AdjacentClassMembers.Red'].join('\n')))).toBe(
            '{Finished;\nStarted}\n{Blue;\nRed}\nAdjacentClassMembers.Red\n',
        );
    });

    it('Should parse empty input and output arguments blocks.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = emptyarguments(x)', '  arguments', '  end', '  arguments (Output)', '  end', '  y = x;', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION y=emptyarguments(x)\nARGUMENTS\nENDARGUMENTS\nARGUMENTS (Output)\nENDARGUMENTS\ny=x\nENDFUNCTION\n');
        expect(interpreter.Unparse(interpreter.Execute([source, 'emptyarguments(7)'].join('\n')))).toBe('7\n');
    });

    it('Should parse Octave-style endarguments terminators.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = explicitendarguments(x)', '  arguments', '    x double', '  endarguments', '  y = x;', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION y=explicitendarguments(x)\nARGUMENTS\nx double\nENDARGUMENTS\ny=x\nENDFUNCTION\n');
        expect(interpreter.Unparse(interpreter.Execute([source, 'explicitendarguments(9)'].join('\n')))).toBe('9\n');
    });

    it('Should parse Octave-style default values in function parameter lists.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function y = defaultparams(x = 4, z = x + 1)', '  y = z;', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION y=defaultparams(x=4,z=x+1)\ny=z\nENDFUNCTION\n');
    });

    it('Should parse MATLAB-style space-separated function return lists.', () => {
        const interpreter = Interpreter.Create();
        const source = ['function [a b] = spacereturns(x)', '  a = x;', '  b = x + 1;', 'end'].join('\n');

        expect(interpreter.Unparse(interpreter.Parse(source))).toBe('FUNCTION [a,b]=spacereturns(x)\na=x\nb=x+1\nENDFUNCTION\n');
        expect(interpreter.Unparse(interpreter.Execute([source, '[first second] = spacereturns(4)'].join('\n')))).toBe('first=4\nsecond=5\n');
    });

    it('Should execute empty function return lists as no-output functions.', () => {
        const interpreter = Interpreter.Create();
        const source = ['global touched', 'function [] = markemptyreturn(x)', '  global touched', '  touched = x;', 'end', 'markemptyreturn(8);', 'touched'].join('\n');

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('8\n');
    });
});
