import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Interpreter } from './Interpreter';
import { ExecutionMachine } from './ExecutionMachine';

describe('ExecutionMachine', () => {
    test('synchronous superclass calls reject waits and restore caller metadata', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute(
            readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-superclass.m'), 'utf8') + '\nglobal trace receivers; trace=0; receivers=0; obj=ResumeLeaf(); destination=99;',
        );
        const scope = interpreter.context.currentScope;
        expect(() => interpreter.Execute('destination=obj.collect(1);')).toThrow('requires an asynchronous driver');
        expect(interpreter.context.currentScope).toBe(scope);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.Unparse(interpreter.Execute('destination'))).toBe('99\n');
    });

    test.each([
        ['constructor', 'destination=ResumeLeaf(3)', 1],
        ['method', 'destination=obj.collect(3)', 4],
    ] as const)('unwinds explicit superclass %s on host failure and cancellation', (_kind, source, trace) => {
        for (const action of ['fail', 'cancel'] as const) {
            const interpreter = Interpreter.Create();
            interpreter.Execute(
                readFileSync(join(process.cwd(), 'test/node/fixtures/resumable-superclass.m'), 'utf8') +
                    '\nglobal trace receivers; trace=0; receivers=0; obj=ResumeLeaf(); trace=0; destination=99;',
            );
            const scope = interpreter.context.currentScope;
            let step = interpreter.CreateExecutionMachine(interpreter.Parse(`${source}; trace=999;`)).runUntilYield();
            while (step.state === 'progress') step = step.continue();
            if (_kind === 'method' && step.state === 'effect') {
                step = step.resume({});
                while (step.state === 'progress') step = step.continue();
            }
            if (step.state !== 'effect') throw new Error('Expected superclass suspension');
            expect(step.effect).toMatchObject({ type: 'delay', milliseconds: _kind === 'method' ? 2 : 1 });
            expect((step.frames ?? []).filter((frame) => frame.kind === 'call').length).toBeGreaterThanOrEqual(3);
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            for (const name of ['ResumeRoot', 'ResumeMiddle', 'ResumeLeaf']) {
                const definition = interpreter.context.resolveClassDefinition(name)!;
                expect(interpreter.context.canAccessClassMember(definition, 'private')).toBe(false);
                expect(interpreter.context.canAccessClassMember(definition, 'protected')).toBe(false);
            }
            step = action === 'fail' ? step.fail(new Error('host stopped')) : step.cancel('stop');
            expect(step.state).toBe(action === 'fail' ? 'error' : 'cancelled');
            expect(interpreter.context.currentScope).toBe(scope);
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            expect(interpreter.context.requestedOutputCount).toBe(1);
            expect(interpreter.context.requestedOutputMask()).toEqual([true]);
            expect(interpreter.Unparse(interpreter.Execute('[destination,trace]'))).toBe(`[99,${trace}]\n`);
        }
    });

    test.each([
        ['constructor', 'destination=RetainedClass(3)', 'fail'],
        ['constructor', 'destination=RetainedClass(3)', 'cancel'],
        ['method', 'obj=RetainedClass(); destination=obj.read(3)', 'fail'],
        ['method', 'obj=RetainedClass(); destination=read(obj,3)', 'cancel'],
        ['overload', 'obj=RetainedClass(); destination=feval("plus",obj,3)', 'fail'],
        ['static', 'destination=feval("RetainedClass.twice",3)', 'cancel'],
    ] as const)('unwinds retained %s on %s', (_kind, source, action) => {
        const interpreter = Interpreter.Create();
        const definition =
            'classdef RetainedClass < handle; properties (Access=private); secret=7; end; methods; function obj=RetainedClass(v=0), if nargin>0, global trace; trace+=1; pause(0.001); obj.secret=v; end; end; function y=read(obj,v), global trace; trace+=1; pause(0.001); y=obj.secret+v; end; function y=plus(obj,v), global trace; trace+=1; pause(0.001); y=obj.secret+v; end; end; methods (Static); function y=twice(v), global trace; trace+=1; pause(0.001); y=2*v; end; end; end;';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(`${definition} global trace; trace=0; destination=99; ${source}; trace+=100`)).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('effect');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        const definitionValue = interpreter.context.resolveSymbol('RetainedClass')?.classDefinition;
        if (!definitionValue) throw new Error('Missing class');
        expect(interpreter.context.canAccessClassMember(definitionValue, 'private')).toBe(false);
        if (step.state !== 'effect') throw new Error('Expected method suspension');
        step = action === 'fail' ? step.fail(new Error('host stopped')) : step.cancel('stop');
        expect(step.state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('destination'))).toBe('99\n');
        expect(interpreter.Unparse(interpreter.Execute('global trace; trace'))).toBe('1\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.canAccessClassMember(definitionValue, 'private')).toBe(false);
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual([true]);
    });

    test.each(['fail', 'cancel'] as const)('restores shadowed script functions and imports on %s', (action) => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                outer: 'import pkg.*; run("inner"); late=1; function y=helper(), y=42; end',
                inner: 'pause(1); late=2; function y=helper(), y=99; end',
            },
        });
        interpreter.Execute('function y=helper(), y=7; end');
        const scope = interpreter.context.currentScope;
        const previous = scope.functionTable.helper;
        const imports = scope.importSnapshot();
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('run("outer")')).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected nested script wait');
        expect(scope.functionTable.helper).not.toBe(previous);
        step = action === 'fail' ? step.fail(new Error('host failed')) : step.cancel('stop');
        expect(step.state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(scope.functionTable.helper).toBe(previous);
        expect(scope.importSnapshot()).toEqual(imports);
        expect(scope.resolveName('late')).toBeUndefined();
        expect(interpreter.Unparse(interpreter.Execute('helper()'))).toBe('7\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test('retains script-local bindings, source identity and imports until completion', () => {
        const interpreter = Interpreter.Create({
            scriptSourceTable: {
                outer: 'import pkg.*; before=mfilename(); run("inner"); after=mfilename(); value=helper(); function y=helper(), y=42; end',
                inner: 'inside=mfilename(); pause(1);',
            },
        });
        const scope = interpreter.context.currentScope;
        const imports = scope.importSnapshot();
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('run("outer")')).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('effect');
        expect(scope.functionTable.helper).toBeDefined();
        if (step.state !== 'effect') throw new Error('Expected script suspension');
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('completed');
        expect(scope.functionTable.helper).toBeUndefined();
        expect(scope.importSnapshot()).toEqual(imports);
        expect(interpreter.Unparse(interpreter.Execute('before'))).toBe('outer\n');
        expect(interpreter.Unparse(interpreter.Execute('after'))).toBe('outer\n');
        expect(interpreter.Unparse(interpreter.Execute('inside'))).toBe('inner\n');
        expect(interpreter.Unparse(interpreter.Execute('value'))).toBe('42\n');
    });

    test.each(['fail', 'cancel'] as const)('retains a returned receiver and unwinds a waiting index on %s', (action) => {
        const interpreter = Interpreter.Create();
        const source =
            'function y=g(a), unwind_protect, global trace; trace=trace*10+a; pause(a); if a==1, y=[10,20,30]; else, y=a; end; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; global trace cleaned; trace=0; cleaned=0; x=0; a=99; a=g(++x)(g(++x):end); x+=100';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected receiver wait');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 1000 });
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected index wait');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 2000 });
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
        expect(step[action](new Error('stop returned receiver')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('a'))).toBe('99\n');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('2\n');
        expect(interpreter.Unparse(interpreter.Execute('global trace cleaned; trace+cleaned'))).toBe('14\n');
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual([true]);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
    });

    test('retains returned receiver and end after resuming the index', () => {
        const interpreter = Interpreter.Create();
        let step = interpreter
            .CreateExecutionMachine(interpreter.Parse('function y=g(a), pause(a); if a==1, y=[10,20,30]; else, y=a; end; end; x=0; a=g(++x)(g(++x):end); sum(a)+x'))
            .runUntilYield();
        const effects: number[] = [];
        while (step.state === 'progress' || step.state === 'effect') {
            if (step.state === 'progress') step = step.continue();
            else {
                if (step.effect.type === 'delay') effects.push(step.effect.milliseconds);
                step = step.resume({});
            }
        }
        expect(step.state).toBe('completed');
        expect(effects).toEqual([1000, 2000]);
        expect(interpreter.Unparse(interpreter.Execute('sum(a)+x'))).toBe('52\n');
    });

    test('the synchronous returned-receiver driver reports the first wait once', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=g(a), pause(a); y=[10,20]; end; x=0; a=99; a=g(++x)(2)')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('1\n');
        expect(interpreter.Unparse(interpreter.Execute('a'))).toBe('99\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test('labels literal frames before an entry checkpoint without exposing storage tags', () => {
        const interpreter = Interpreter.Create();
        interpreter.Execute('function y=f(), pause(0); y=1; end');
        const step = interpreter.CreateExecutionMachine(interpreter.Parse('0;'.repeat(62) + '[f(),f()]')).runUntilYield();
        expect(step.state).toBe('progress');
        if (step.state !== 'progress') throw new Error('Expected literal entry checkpoint');
        expect(step.frames?.some((frame) => frame.nodeType === 'MATRIX' && frame.phase === 'enter')).toBe(true);
        expect(step.frames?.every((frame) => typeof frame.nodeType === 'string')).toBe(true);
        expect(step.cancel('stop before elements').state).toBe('cancelled');
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test.each(['fail', 'cancel'] as const)('unwinds a partially constructed literal on %s without committing or replaying', (action) => {
        const interpreter = Interpreter.Create();
        const source =
            'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; global cleaned; cleaned=0; a=99; x=0; a=[g(++x),g(++x),g(++x)]; x+=100';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected first literal element');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 1000 });
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected second literal element');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 2000 });
        expect(step.frames?.some((frame) => frame.kind === 'expression' && frame.nodeType === 'MATRIX' && frame.phase === 'literal-element' && frame.cursor === 1)).toBe(true);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
        expect(step[action](new Error('stop literal')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('a'))).toBe('99\n');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('2\n');
        expect(interpreter.Unparse(interpreter.Execute('global cleaned; cleaned'))).toBe('2\n');
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual([true]);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test('the synchronous literal driver reports a wait and retains prior effects', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=g(a), pause(a); y=a; end; x=0; a=99; a=[g(++x),g(++x)]')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('1\n');
        expect(interpreter.Unparse(interpreter.Execute('a'))).toBe('99\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
    });

    test.each([
        'function y=f(), y=[10,20,30]; end; f()(2:end)',
        'function y=f(), y={10,20}; end; f(){end}',
        'function y=f(), y=struct("a",[10,20]); end; f().a(2)',
        'function y=f(), y={struct("a",10),struct("a",20)}; end; f(){end}.a',
        'function y=f(), y="abc"; end; f()(2:end)',
        'function y=f(), y=@(x) x+1; end; f()(2)',
        'function y=f(), y=[10,20]; end; h=@f; h()(end)',
        'make={@sum}; make{1}([1,2])',
        'function y=g(a), y=a; end; c={[10,20]}; x=0; c{g(++x)}(g(++x))+=g(++x); sum(c{1})+x',
        'function y=g(a), y=a; end; s.a=[10,20]; x=0; s.a(g(++x))=g(++x); sum(s.a)+x',
        "function y=f(), y='a'; end; s.a=2; s.(f())+=3; s.a",
        'function y=g(a), y=a; end; c={[10,20],[30,40]}; [a,b]=c{:}(g(2)); a+b',
        'function y=g(a), y=a; end; c={struct("a",10),struct("a",20)}; [a,b]=c{g(1):g(2)}.a; a+b',
        'function y=g(a), y=a; end; s.a=[10,20]; s.a(g(2))',
        'function y=g(a), y=a; end; c={struct("a",[10,20])}; c{g(1)}.a(g(2))',
        "function y=f(), y='a'; end; s.a=[10,20]; s.(f())(2)",
        'function y=g(a), y=a; end; x=0; a=[g(++x),g(++x);g(++x),g(++x)]; sum(a(:))+x',
        'function y=g(a), y=a; end; x=0; c={g(++x),[g(++x),g(++x)]}; sum(c{2})+c{1}+x',
        'function y=g(a), y=a; end; c={1,2}; a=[c{:},g(3)]; sum(a)',
        "function y=g(a), y=a; end; a=['ab',g('cd')]; a",
        'function y=g(a), y=a; end; a=[[],g([1,2])]; sum(a)',
        'function y=g(), y=evalin("caller","x=x+1"); end; x=1; a=[g(),2]; a',
        'x=1; a={evalin("base","x=x+1")}; x',
        'function y=g(a), y=a; end; a=[10,20,30]; a([g(1),end])',
        'a=2; a+=3; a',
        'a=[1,2]; sum(a)',
        "eval('a=2; a+3')",
        "feval('eval', 'a=2; a+3')",
        'function y=f(x), y=x+2; end; f(3)',
        'function y=f(x), y=x+2; end; z=3+f(4); z',
        'function [a,b]=f(x), a=x; b=x+1; end; [a,b]=f(3); a+b',
        'function y=f(x=2), y=x+1; end; h=@f; z=h(); z',
        'function y=g(a), y=a+1; end; function y=f(a=2,b=g(a)), y=a+b; end; f()',
        'function y=f(a,varargin), y=a+sum([varargin{:}]); end; c={2,3}; f(1,c{:})',
        'c=3; h=@(x) -x+c; c=9; z=h(2); z',
        'function [a,b]=f(x), a=x; b=x+1; end; h=@(x) f(x); [a,b]=h(2); a+b',
        'x=0; if 0 & x++, x=99; end; x',
        'x=0; while x<3, x+=1; end; for i=1:2:5, x+=i; end; x',
        'x=0; a=[10,20,30]; z=a(++x:end); sum(z)+x',
        'x=0; z=plus(x++,x++); z+x',
        'c={2,3}; z=plus(c{:}); z',
        'x=0; c={10,20}; z=c{++x}; z+x',
        'a=[1,2;3,4]; [r,c]=size(a); r+c',
        'C=reshape({1,2,3,4,5,6,7,8},[2,2,2]); [a,b,c,d]=C{:,:,2}; a+b+c+d',
        'plus=[10,20]; plus(2)',
        'function y=plus(a,b), y=a-b; end; plus(4,2)',
        'c={@sum,@sin}; feval(c{:},3)',
        "c={'sum','sin'}; builtin(c{:},3)",
        'function y=g(a), y=a; end; a=[10,20]; x=0; a(g(++x))+=g(++x); sum(a)+x',
        'function y=g(a), y=a; end; a=[10,20]; x=0; a(g(++x))=g(++x); sum(a)+x',
        'function y=g(a), y=a; end; c={10,20}; c{g(1)}=g(3); c{1}+c{2}',
        'function y=g(a), y=a; end; a=reshape(1:8,[2,2,2]); a(:,:,g(2))=g(9); sum(a(:))',
        'function y=g(a), y=a; end; a=[10,20,30]; a(g(2))=[]; sum(a)',
        'function y=g(a), y=a; end; a=[10,20,30]; a(g(1):g(3))(g(2))',
        'function y=g(), y=1; end; x=0; try, a(x++)+=g(); catch, end; x',
        "function y=indexvalue(), assignin('base','t','xyz'); y=2; end; t='abc'; t(indexvalue())='Q'; t",
    ])('preserves recursive evaluator results: %s', (source) => {
        const legacy = Interpreter.Create();
        const migrated = Interpreter.Create();
        const expected = legacy.Evaluator(legacy.Parse(source));
        const actual = migrated.Evaluate(migrated.Parse(source));
        expect(migrated.Unparse(actual)).toBe(legacy.Unparse(expected));
    });

    test.each(['fail', 'cancel'] as const)('unwinds native destination preparation through %s', (action) => {
        const interpreter = Interpreter.Create();
        const initialMask = interpreter.context.requestedOutputMask();
        const source =
            'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; global cleaned; cleaned=0; c={[10,20]}; x=0; c{g(++x)}(g(++x))=g(++x); x+=100';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected first descriptor wait');
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected second descriptor wait');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 2000 });
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(step[action](new Error('stop descriptor')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('sum(c{1})'))).toBe('30\n');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('2\n');
        expect(interpreter.Unparse(interpreter.Execute('global cleaned; cleaned'))).toBe('2\n');
        expect(interpreter.context.requestedOutputMask()).toEqual(initialMask);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
    });

    test('synchronous native destination waits fail before writing or evaluating the RHS', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=g(a), pause(a); y=a; end; c={[10,20]}; x=0; c{g(++x)}(2)=++x')).toThrow(
            expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }),
        );
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('1\n');
        expect(interpreter.Unparse(interpreter.Execute('sum(c{1})'))).toBe('30\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test.each(['fail', 'cancel'] as const)('restores comma-list metadata after a chained read %s', (action) => {
        const interpreter = Interpreter.Create();
        const initialMask = interpreter.context.requestedOutputMask();
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('function y=g(a), pause(a); y=a; end; c={[10,20],[30,40]}; x=0; [a,b]=c{:}(g(++x)); x+=100')).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected first comma item');
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected second comma item');
        expect(step[action](new Error('stop chain')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('2\n');
        expect(interpreter.Unparse(interpreter.Execute('exist("a","var")+exist("b","var")'))).toBe('0\n');
        expect(interpreter.context.requestedOutputMask()).toEqual(initialMask);
        expect(interpreter.context.commaListExpansionEnabled).toBe(false);
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test.each(['builtin', 'index'] as const)('honors fail/cancel while retaining %s inputs', (kind) => {
        for (const action of ['fail', 'cancel'] as const) {
            const interpreter = Interpreter.Create();
            const initialMask = interpreter.context.requestedOutputMask();
            const expression = kind === 'builtin' ? 'plus(x++,g(++x))' : 'a(g(++x),x++)';
            const source =
                'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; global cleaned; cleaned=0; x=0; a=[10,20;30,40]; z=' +
                expression +
                '; x+=100';
            const step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
            if (step.state !== 'effect') throw new Error('Expected input wait');
            expect(interpreter.context.isInsideUserFunction()).toBe(false);
            expect(step[action](new Error('stop input')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
            expect(interpreter.Unparse(interpreter.Execute('x'))).toBe(kind === 'builtin' ? '2\n' : '1\n');
            expect(interpreter.Unparse(interpreter.Execute('global cleaned; cleaned'))).toBe('1\n');
            expect(interpreter.Unparse(interpreter.Execute('exist("z","var")'))).toBe('0\n');
            expect(interpreter.context.requestedOutputMask()).toEqual(initialMask);
        }
    });

    test('preserves selective builtin arguments and invokes the builtin once', () => {
        const interpreter = Interpreter.Create();
        const invoke = jest.fn((_raw, value) => value);
        interpreter.context.defineBuiltInFunction('choose', invoke, false, [false, true]);
        const step = interpreter.CreateExecutionMachine(interpreter.Parse('function y=g(a), pause(a); y=a; end; x=0; z=choose(pause(99),g(++x)); z+x')).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected evaluated argument wait');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 1000 });
        expect(invoke).not.toHaveBeenCalled();
        let result = step.resume({});
        while (result.state === 'progress') result = result.continue();
        expect(result.state).toBe('completed');
        expect(invoke).toHaveBeenCalledTimes(1);
        expect(interpreter.Unparse(interpreter.Execute('z+x'))).toBe('2\n');
    });

    test('retains set name-value arguments without assigning their names', () => {
        const interpreter = Interpreter.Create();
        const invoke = jest.fn((_receiver, _name, value) => value);
        interpreter.context.defineBuiltInFunction('set', invoke);
        let step = interpreter.CreateExecutionMachine(interpreter.Parse('function y=g(a), pause(a); y=a; end; x=0; z=set(1,Scale=g(++x)); z')).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected set value wait');
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        expect(step.state).toBe('completed');
        expect(invoke).toHaveBeenCalledTimes(1);
        expect(interpreter.Unparse(interpreter.Execute('exist("Scale","var")'))).toBe('0\n');
    });

    test('synchronous builtin input waits fail explicitly and clean up', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=g(), pause(0); y=1; end; z=sum(g())')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Execute('exist("z","var")'))).toBe('0\n');
    });

    test('preserves native index error diagnostics', () => {
        const legacy = Interpreter.Create();
        const migrated = Interpreter.Create();
        let expected: unknown;
        try {
            legacy.Evaluator(legacy.Parse('a=[1,2]; a(99)'));
        } catch (error) {
            expected = error;
        }
        expect(() => migrated.Execute('a=[1,2]; a(99)')).toThrow((expected as Error).message);
    });

    test.each(['fail', 'cancel'] as const)('retains RHS and destination indices while unwinding %s', (action) => {
        const interpreter = Interpreter.Create();
        const mask = interpreter.context.requestedOutputMask();
        const source =
            'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; global cleaned; cleaned=0; a=[10,20]; x=0; a(g(++x))=g(++x); x+=100';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected RHS wait');
        expect(step.frames).toEqual(expect.arrayContaining([expect.objectContaining({ nodeType: '=', phase: 'rhs' })]));
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'effect') throw new Error('Expected index wait');
        expect(step.frames).toEqual(expect.arrayContaining([expect.objectContaining({ nodeType: '=', phase: 'index' })]));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(step[action](new Error('stop write')).state).toBe(action === 'cancel' ? 'cancelled' : 'error');
        expect(interpreter.Unparse(interpreter.Execute('sum(a)+x'))).toBe('32\n');
        expect(interpreter.Unparse(interpreter.Execute('global cleaned; cleaned'))).toBe('2\n');
        expect(interpreter.context.requestedOutputMask()).toEqual(mask);
    });

    test('rejects a synchronous index wait explicitly before writing', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=g(), pause(0); y=1; end; a=[10,20]; a(g())=9')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.Unparse(interpreter.Execute('sum(a)'))).toBe('30\n');
    });

    test('retains a call and its left operand while detaching the active context', () => {
        const interpreter = Interpreter.Create();
        const source = 'function y=f(a), pause(a); y=a+4; return; y=99; end; x=0; z=x+++f(x++); z';
        let step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected suspension');
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 1000 });
        expect(step.frames).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'call', phase: 'body' }), expect.objectContaining({ kind: 'expression', phase: 'right' })]));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Evaluate(interpreter.Parse('x')))).toBe('2\n');
        step = step.resume({});
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'completed') throw new Error('Expected completion');
        expect(interpreter.Unparse(step.value)).toContain('5');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
    });

    test.each([
        ['fail', 'argument'],
        ['cancel', 'argument'],
        ['fail', 'default'],
        ['cancel', 'default'],
    ] as const)('unwinds %s during %s binding without entering the body', (action, phase) => {
        const interpreter = Interpreter.Create();
        const initialMask = interpreter.context.requestedOutputMask();
        const source =
            'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; ' +
            (phase === 'argument'
                ? 'function y=f(a,b), global entered; entered=1; y=a+b; end; global cleaned entered; cleaned=0; entered=0; x=0; z=f(x++,g(x++)); x+=100'
                : 'function y=f(a=2,b=g(a)), global entered; entered=1; y=a+b; end; global cleaned entered; cleaned=0; entered=0; x=0; z=f(); x+=100');
        const step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected argument wait');
        expect(step.frames).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'call', phase })]));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.requestedOutputCount).toBe(1);
        expect(interpreter.context.requestedOutputMask()).toEqual(initialMask);
        expect(step[action](new Error('stop binding')).state).toBe(action === 'cancel' ? 'cancelled' : 'error');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe(phase === 'argument' ? '2\n' : '0\n');
        expect(interpreter.Unparse(interpreter.Execute('global cleaned entered; cleaned+entered'))).toBe('1\n');
        expect(interpreter.Unparse(interpreter.Execute('exist("z","var")'))).toBe('0\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.requestedOutputMask()).toEqual(initialMask);
    });

    test.each(['fail', 'cancel'] as const)('unwinds a retained anonymous expression through %s', (action) => {
        const interpreter = Interpreter.Create();
        const mask = interpreter.context.requestedOutputMask();
        const source =
            'function y=g(a), unwind_protect, pause(a); y=a; unwind_protect_cleanup, global cleaned; cleaned+=1; end; end; ' +
            'global cleaned; cleaned=0; h=@(a)-g(a); x=0; z=h(x++); x+=100';
        const step = interpreter.CreateExecutionMachine(interpreter.Parse(source)).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected anonymous expression wait');
        expect(step.frames).toEqual(
            expect.arrayContaining([expect.objectContaining({ kind: 'call', phase: 'expression' }), expect.objectContaining({ kind: 'expression', phase: 'operand' })]),
        );
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(step[action](new Error('stop expression')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('1\n');
        expect(interpreter.Unparse(interpreter.Execute('global cleaned; cleaned'))).toBe('1\n');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.context.requestedOutputMask()).toEqual(mask);
    });

    test('exposes predicate phase and retains the decision across resume', () => {
        const interpreter = Interpreter.Create();
        const machine = interpreter.CreateExecutionMachine(interpreter.Parse('function y=g(), pause(0); y=1; end; x=0; if g(), x=7; else, x=99; end; x'));
        const step = machine.runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected predicate wait');
        expect(step.frames).toEqual(expect.arrayContaining([expect.objectContaining({ nodeType: 'IF', phase: 'condition' })]));
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('0\n');
        let next = step.resume({});
        while (next.state === 'progress') next = next.continue();
        expect(next.state).toBe('completed');
        expect(interpreter.Unparse(interpreter.Execute('x'))).toBe('7\n');
    });

    test('the synchronous API explicitly rejects a wait inside a retained call', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Execute('function y=f(), pause(0); y=99; end; z=f()')).toThrow(expect.objectContaining({ code: 'MATHJSLAB_EFFECT_REQUIRES_ASYNC' }));
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Execute('exist("z","var")'))).toBe('0\n');
    });

    test.each(['fail', 'cancel'] as const)('unwinds a retained function through %s', (action) => {
        const interpreter = Interpreter.Create();
        const machine = interpreter.CreateExecutionMachine(interpreter.Parse('function f(), unwind_protect, pause(0); unwind_protect_cleanup, global cleaned; cleaned=7; end; end; f()'));
        const step = machine.runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected suspension');
        expect(step[action](new Error('failed')).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(interpreter.context.isInsideUserFunction()).toBe(false);
        expect(interpreter.Unparse(interpreter.Evaluate(interpreter.Parse('global cleaned; cleaned')))).toContain('7');
    });

    test.each(['fail', 'cancel'] as const)('terminates a suspended continuation through %s', (action) => {
        const interpreter = Interpreter.Create();
        const machine = interpreter.CreateExecutionMachine(interpreter.Parse('x=1; pause(0); x=99'));
        const step = machine.runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected suspension');
        const failure = new Error('host failed');
        expect(step[action](failure).state).toBe(action === 'fail' ? 'error' : 'cancelled');
        expect(step.resume({}).state).toBe('error');
        expect(interpreter.Unparse(interpreter.Evaluate(interpreter.Parse('x')))).toBe('1\n');
    });

    test('distinguishes escaped control transfer from evaluation failure', () => {
        const interpreter = Interpreter.Create();
        expect(interpreter.CreateExecutionMachine(interpreter.Parse('break')).runUntilYield()).toMatchObject({ state: 'control', transfer: { kind: 'break' } });
    });

    test('exposes retained branch and loop frames at suspension', () => {
        const interpreter = Interpreter.Create();
        const step = interpreter.CreateExecutionMachine(interpreter.Parse('for i=1:2, if i>0, pause(i); end; end')).runUntilYield();
        if (step.state !== 'effect') throw new Error('Expected suspension');
        expect(step.frames).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ kind: 'loop', nodeType: 'FOR', cursor: 1, phase: 'body' }),
                expect.objectContaining({ kind: 'block', nodeType: 'IF', cursor: 0, phase: 'then' }),
            ]),
        );
        const snapshot = step.frames;
        const next = step.resume({});
        if (next.state !== 'effect') throw new Error('Expected next iteration');
        expect(next.frames).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'loop', cursor: 2 })]));
        expect(snapshot).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'loop', cursor: 1 })]));
        expect(next.resume({}).state).toBe('completed');
    });

    test('checkpoint continuations are single-use and preserve synchronous results', () => {
        const interpreter = Interpreter.Create();
        const machine = interpreter.CreateExecutionMachine(interpreter.Parse('s=0; for i=1:100, s+=i; end; s'));
        let step = machine.runUntilYield();
        if (step.state !== 'progress') throw new Error('Expected checkpoint');
        const checkpoint = step;
        expect(checkpoint.completed).toBe(64);
        step = checkpoint.continue();
        expect(checkpoint.continue().state).toBe('error');
        while (step.state === 'progress') step = step.continue();
        if (step.state !== 'completed') throw new Error('Expected completion');
        expect(interpreter.Unparse(step.value)).toContain('5050');
        expect(Interpreter.Create().Execute('s=0; for i=1:100, s+=i; end; s').type).toBe('LIST');
    });

    test('resumes a real sequence once with retained results', () => {
        const interpreter = Interpreter.Create();
        const machine = interpreter.CreateExecutionMachine(interpreter.Parse('x=1; pause(x++); x+=10; x'));
        const step = machine.runUntilYield();
        expect(step.state).toBe('effect');
        if (step.state !== 'effect') return;
        expect(step.frame?.nextInstruction).toBe(2);
        expect(step.effect).toEqual({ type: 'delay', milliseconds: 1000 });
        const resumed = step.resume({});
        expect(resumed.state).toBe('completed');
        if (resumed.state !== 'completed') throw new Error('Expected completion');
        expect(interpreter.Unparse(resumed.value)).toContain('12');
        expect(step.resume({})).toMatchObject({ state: 'error', diagnostics: [{ code: 'MATHJSLAB_CONTINUATION_CONSUMED' }] });
        expect(interpreter.Unparse(interpreter.Evaluate(interpreter.Parse('x')))).toBe('12\n');
    });

    test('synchronous driver explicitly rejects waiting', () => {
        const interpreter = Interpreter.Create();
        expect(() => interpreter.Evaluate(interpreter.Parse('x=1; pause(0); x=2'))).toThrow('asynchronous driver');
        expect(interpreter.Unparse(interpreter.Evaluate(interpreter.Parse('x')))).toBe('1\n');
    });

    test('yields a host effect and resumes with its result', () => {
        const machine = ExecutionMachine.effect({ type: 'read-text', reference: 'value.m' }, (result) => String(result.value));
        const yielded = machine.runUntilYield();
        expect(yielded.state).toBe('effect');
        if (yielded.state !== 'effect') return;
        expect(yielded.effect).toEqual({ type: 'read-text', reference: 'value.m' });
        expect(yielded.resume({ value: '42' })).toMatchObject({ state: 'completed', value: '42' });
    });
});
