/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('mathjslab/runtime/node published bundle', () => {
    test('retains normally dispatched returned receivers in the distributed Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const effects = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async (effect) => { effects.push(effect); return {}; } } });
                try {
                    const session = await runtime.createSession();
                    const result = await session.execute('function y=f(a), pause(a); if a==1, y={10,20}; else, y=a; end; end; x=0; [a,b]=f(++x){f(++x)-1:end}; a+b+x');
                    if (result.status !== 'success' || result.outputs[0]?.text !== '32\n') throw new Error('Returned receiver did not resume');
                    if (JSON.stringify(effects) !== JSON.stringify([1,2].map(value => ({ type: 'delay', milliseconds: value*1000 })))) throw new Error('Returned receiver effects were replayed');
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('retains matrix and cell literal elements in the distributed Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const effects = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async (effect) => { effects.push(effect); return {}; } } });
                try {
                    const session = await runtime.createSession();
                    const result = await session.execute('function y=f(a), pause(a); y=a; end; x=0; c={f(++x),[f(++x),f(++x)]}; sum(c{2})+c{1}+x');
                    if (result.status !== 'success' || result.outputs[0]?.text !== '9\n') throw new Error('Literal did not resume');
                    if (JSON.stringify(effects) !== JSON.stringify([1,2,3].map(value => ({ type: 'delay', milliseconds: value*1000 })))) throw new Error('Literal effects were replayed');
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes a sequence in a real Worker without replaying arguments or effects', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const effects = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async (effect) => { effects.push(effect); return {}; } } });
                const session = await runtime.createSession();
                const result = await session.execute('x=0; pause(x++); x+=10; pause(x++); x');
                if (result.status !== 'success' || result.outputs[0]?.text !== '12\n') throw new Error('Sequence did not resume');
                if (JSON.stringify(effects) !== JSON.stringify([{ type: 'delay', milliseconds: 0 }, { type: 'delay', milliseconds: 11000 }])) throw new Error('Effects or arguments were replayed');
                const shadowed = await session.execute('pause=[7,8]; pause(1)');
                if (shadowed.status !== 'success' || shadowed.outputs[0]?.text !== '7\n' || effects.length !== 2) throw new Error('Worker bypassed name resolution');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes nested loop frames and catches host failures in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                let calls = 0;
                const runtime = createNodeMathJSLabRuntime({ host: { request: async () => { calls++; if(calls===2) throw new Error('host failed'); return {}; } } });
                const session = await runtime.createSession();
                const result = await session.execute('s=0; for i=1:3, try, if i>0, pause(0); s+=i; end; catch, s+=10; end; end; s');
                if(result.status !== 'success' || result.outputs[0]?.text !== '14\n' || calls !== 3) throw new Error('Nested Worker execution diverged');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes a function into its caller expression in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const effects = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async (effect) => { effects.push(effect); return {}; } } });
                const session = await runtime.createSession();
                const result = await session.execute('function y=f(a), pause(a); y=a+4; return; y=99; end; x=0; z=x+++f(x++); z');
                if(result.status !== 'success' || result.outputs[0]?.text !== '5\n' || effects.length !== 1 || effects[0].milliseconds !== 1000) throw new Error('Retained Worker call diverged');
                const workspace = await session.execute('x');
                if(workspace.outputs[0]?.text !== '2\n') throw new Error('Worker replayed arguments');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes binding and ignored output masks in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                let calls = 0;
                const runtime = createNodeMathJSLabRuntime({ host: { request: async () => { calls++; return {}; } } });
                const session = await runtime.createSession();
                let result = await session.execute('function y=g(a), pause(a); y=a+1; end; function [a,b]=f(x=2,y=g(x)), b=x+y; end; [~,z]=f(); z');
                if(result.status !== 'success' || result.outputs[0]?.text !== '5\n' || calls !== 1) throw new Error('Worker default binding or mask diverged');
                result = await session.execute('x=0; [~,z]=f(x++,g(x++)); z+x');
                if(result.status !== 'success' || result.outputs[0]?.text !== '4\n' || calls !== 2) throw new Error('Worker replayed arguments');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes an anonymous predicate and range header in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const delays = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async (effect) => { delays.push(effect.milliseconds); return {}; } } });
                const session = await runtime.createSession();
                const result = await session.execute('function y=g(a), pause(a); y=a; end; h=@(a)g(a); x=0; if h(1), for i=(g(1):g(3)), x+=i; end; end; -x');
                if(result.status !== 'success' || result.outputs[0]?.text !== '-6\n' || JSON.stringify(delays)!==JSON.stringify([1000,1000,3000])) throw new Error('Worker predicate/header replayed or diverged');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('retains builtin arguments and native indices in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const delays = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async effect => { delays.push(effect.milliseconds); return {}; } } });
                const session = await runtime.createSession();
                const result = await session.execute('function y=g(a), pause(a); y=a; end; x=0; a=[10,20,30]; c={2,3}; z=plus(sum(a(g(++x):end)),c{g(++x)}); z+x');
                if(result.status !== 'success' || result.outputs[0]?.text !== '65\n' || JSON.stringify(delays)!==JSON.stringify([1000,2000])) throw new Error('Worker input/index execution diverged');
                const nd = await session.execute('C=reshape({1,2,3,4,5,6,7,8},[2,2,2]); [a,b,c,d]=C{:,:,g(2)}; a+b+c+d');
                if(nd.status !== 'success' || nd.outputs[0]?.text !== '26\n' || delays.length !== 3) throw new Error('Worker N-D index metadata diverged');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('retains write stages and chained reads in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({createNodeMathJSLabRuntime})=>{
                const delays=[];
                const runtime=createNodeMathJSLabRuntime({host:{request:async effect=>{delays.push(effect.milliseconds);return {};}}});
                const session=await runtime.createSession();
                const result=await session.execute('function y=g(a), pause(a); y=a; end; a=[10,20,30]; x=0; a(g(++x))+=g(++x); z=a(g(1):g(3))(g(2)); z+x');
                if(result.status!=='success'||result.outputs[0]?.text!=='23\n'||JSON.stringify(delays)!==JSON.stringify([1000,2000,1000,3000,2000]))throw new Error('Worker write stages diverged');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('retains native field/cell chains in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({createNodeMathJSLabRuntime})=>{
                const delays=[];
                const runtime=createNodeMathJSLabRuntime({host:{request:async effect=>{delays.push(effect.milliseconds);return {};}}});
                const session=await runtime.createSession();
                const result=await session.execute('function y=g(a), pause(a); y=a; end; c={[10,20],[30,40]}; c{g(1)}(g(2))+=g(3); [a,b]=c{:}(g(2)); a+b');
                if(result.status!=='success'||result.outputs[0]?.text!=='63\n'||JSON.stringify(delays)!==JSON.stringify([1000,2000,3000,2000,2000]))throw new Error('Worker native chain diverged');
                const fields=await session.execute("function y=name(), pause(0); y='a'; end; s.a=[10,20]; s.(name())(g(2))=g(3); s.a(g(2))");
                if(fields.status!=='success'||fields.outputs[0]?.text!=='3\n'||JSON.stringify(delays.slice(5))!==JSON.stringify([0,2000,3000,2000]))throw new Error('Worker dynamic field diverged');
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('executes in worker_threads and recreates a clean worker after interruption', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const runtime = createNodeMathJSLabRuntime();
                const session = await runtime.createSession();
                let result = await session.execute('x=21; x*2');
                if (result.status !== 'success' || result.outputs[0]?.type !== 'text' || result.outputs[0].text !== '42\n') {
                    throw new Error('Unexpected Node runtime result');
                }
                await session.interrupt('test reset');
                result = await session.execute('exist("x","var")');
                if (result.status !== 'success' || result.outputs[0]?.type !== 'text' || result.outputs[0].text !== '0\n') {
                    throw new Error('Worker recovery did not reset the workspace');
                }
                await runtime.dispose();
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
});
