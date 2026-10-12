/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

describe('mathjslab/runtime/node published bundle', () => {
    test('enforces session ownership, resets suspended execution and transports exact decimals in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({createNodeMathJSLabRuntime}) => {
                let entered; const waiting=new Promise(resolve=>{entered=resolve;});
                let effectSignal;
                const runtime=createNodeMathJSLabRuntime({host:{request: (_effect,context)=> {
                    effectSignal=context.signal; entered(); return new Promise(()=>{});
                }}});
                try {
                    const session=await runtime.createSession();
                    const active=session.execute('x=1; pause(1); x=99;');
                    await waiting;
                    const concurrent=await session.execute('x=42;');
                    if(concurrent.diagnostics[0]?.code!=='MATHJSLAB_SESSION_BUSY') throw new Error(JSON.stringify(concurrent));
                    try { await session.parse('x'); throw new Error('Concurrent parse accepted'); }
                    catch(error) { if(error.code!=='MATHJSLAB_SESSION_BUSY') throw error; }
                    await session.reset();
                    if((await active).status!=='cancelled' || !effectSignal.aborted) throw new Error('Reset did not cancel execution and host');
                    if((await session.execute('exist("x","var")')).outputs[0]?.text!=='0\n') throw new Error('Workspace was not reset');
                    const mapped=await session.execute('function y=twice(x), global calls; calls+=1; y=2*x; end; global calls; calls=0; A=spfun(@twice,[0,2;3,0]); [sum(A(:)),calls]');
                    if(mapped.status!=='success' || mapped.outputs[0]?.text!=='[10,2]\n') throw new Error(JSON.stringify(mapped));
                    const exact=await session.execute('[1.00000000000000000001,1e-999]');
                    const value=exact.outputs.find(output=>output.type==='data')?.value;
                    if(value?.type!=='array' || value.packed || value.values?.[0]?.real!=='1.00000000000000000001' || value.values?.[1]?.real!=='1e-999') throw new Error(JSON.stringify(exact));
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe', timeout: 30000 })).not.toThrow();
    });

    test('resumes and unwinds explicit superclass calls in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const {readFileSync} = await import('node:fs');
                const source=readFileSync('./test/node/fixtures/resumable-superclass.m','utf8');
                const delays=[];
                let block=false, entered;
                const waiting=new Promise(resolve => {entered=resolve;});
                const runtime=createNodeMathJSLabRuntime({host:{request: async (effect,context) => {
                    if(effect.type==='delay') delays.push(effect.milliseconds);
                    if(block && effect.type==='delay' && effect.milliseconds===2) return new Promise((resolve,reject)=> {
                        context.signal.addEventListener('abort',()=>reject(context.signal.reason),{once:true}); entered();
                    });
                    return {};
                }}});
                try {
                    const session=await runtime.createSession();
                    const result=await session.execute(source+'\nglobal trace receivers; trace=0; receivers=0; inputs=0; obj=ResumeLeaf(2+ ++inputs); [a,~]=obj.collect(++inputs); [a,inputs,receivers,trace,obj.marker]');
                    if(result.status!=='success' || result.outputs[0]?.text!=='[115,2,1,1234,3]\n') throw new Error(JSON.stringify(result));
                    if(JSON.stringify(delays)!==JSON.stringify([1,3,2])) throw new Error('Superclass effects were replayed');
                    await session.execute('destination=99;');
                    const failed=await session.execute('destination=obj.collect(-1);');
                    if(failed.status!=='error' || !failed.diagnostics[0]?.message.includes('superclass resumed failure')) throw new Error(JSON.stringify(failed));
                    if((await session.execute('destination')).outputs[0]?.text!=='99\n') throw new Error('Pending assignment committed after error');
                    block=true;
                    const controller=new AbortController();
                    const execution=session.execute('destination=obj.collect(2);',{signal:controller.signal});
                    await waiting;
                    controller.abort('stop superclass');
                    if((await execution).status!=='cancelled') throw new Error('Superclass cancellation failed');
                    if((await session.execute('exist("destination","var")')).outputs[0]?.text!=='0\n') throw new Error('Worker interruption did not reset its workspace');
                    block=false;
                    if((await session.execute(source+'\nglobal trace receivers; trace=0; receivers=0; obj=ResumeLeaf();')).status!=='success') throw new Error('Worker recovery failed');
                    if((await session.execute('obj.value')).status!=='error') throw new Error('Class access leaked');
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe', timeout: 30000 })).not.toThrow();
    });

    test('resumes indirect calls, constructors, methods and scalar overloads in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const delays = [];
                const runtime = createNodeMathJSLabRuntime({ host: { request: async effect => { if (effect.type === 'delay') delays.push(effect.milliseconds); return {}; } } });
                try {
                    const session = await runtime.createSession();
                    const definition = 'classdef WorkerResume < handle; properties; value=0; end; methods; function obj=WorkerResume(v), pause(0.001); obj.value=v; end; function [a,b]=pair(obj,v), pause(0.002); a=obj.value+v; b=obj.value; end; function y=plus(obj,v), pause(0.003); y=obj.value+v; end; end; methods (Static); function y=twice(v), pause(0.004); y=2*v; end; end; end;';
                    const result = await session.execute(definition+' inputs=0; obj=WorkerResume(3); [a,b]=obj.pair(++inputs); y=feval("WorkerResume.twice",obj+4); [a,b,y,inputs]');
                    if (result.status !== 'success' || result.outputs[0]?.text !== '[4,3,14,1]\n') throw new Error(JSON.stringify(result));
                    if (JSON.stringify(delays) !== JSON.stringify([1,2,3,4])) throw new Error('Class or indirect effects were replayed');
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('resumes nested virtual scripts and restores locals in a real Worker', () => {
        const script = String.raw`
            import('./lib/mathjslab.runtime-node.esm2022.js').then(async ({ createNodeMathJSLabRuntime }) => {
                const effects = [];
                const { Worker } = await import('node:worker_threads');
                const runtime = createNodeMathJSLabRuntime({
                    host: { request: async effect => { effects.push(effect); return {}; } },
                    workerFactory: () => {
                        const worker = new Worker(new URL('./test/node/fixtures/script-runtime.worker.mjs', import.meta.url), { execArgv: [] });
                        const listeners = new Map();
                        return {
                            postMessage: (message, transfer = []) => worker.postMessage(message, transfer),
                            addEventListener: (type, listener) => {
                                const wrapped = type === 'message' ? data => listener({data}) : error => listener({error, message:error.message});
                                const byType = listeners.get(type) ?? new Map(); byType.set(listener, wrapped); listeners.set(type, byType);
                                worker.on(type, wrapped);
                            },
                            removeEventListener: (type, listener) => {
                                const byType = listeners.get(type); const wrapped = byType?.get(listener); if (wrapped) worker.off(type, wrapped);
                                byType?.delete(listener);
                            },
                            terminate: () => worker.terminate(),
                        };
                    },
                });
                try {
                    const session = await runtime.createSession();
                    const result = await session.execute('count=0; run("outer"); [count,answer]');
                    if (result.status !== 'success' || result.outputs[0]?.text !== '[1111,42]\n') throw new Error(JSON.stringify(result));
                    if (effects.length !== 1) throw new Error('Script effects were replayed');
                    if ((await session.execute('helper()')).status !== 'error') throw new Error('Script local leaked');
                } finally { await runtime.dispose(); }
            });
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

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

    test('executes numeric sequence contract fixtures in a real Worker', () => {
        const script = String.raw`
            import { readFileSync } from 'node:fs';
            import { createNodeMathJSLabRuntime } from './lib/mathjslab.runtime-node.esm2022.js';
            const runtime = createNodeMathJSLabRuntime();
            try {
                const session = await runtime.createSession();
                for (const name of ['discrete-differences', 'difference-axes', 'reverse-accumulation', 'nan-accumulation', 'nan-accumulation-axes', 'nan-accumulation-identities', 'nan-reduction', 'nan-reduction-empty', 'nan-reduction-axes', 'global-measurements', 'global-factors', 'global-identities', 'vector-page-totals', 'vector-cross-pages', 'vector-empty-missing', 'nan-mean-measurements', 'nan-mean-pages', 'nan-mean-empty-complex', 'nan-dispersion-measurements', 'nan-dispersion-pages', 'nan-dispersion-stability', 'statistics-pages', 'statistics-cross-pages', 'statistics-global-missing','numeric-missing-aliases','dispersion-paired-outputs','weighted-dispersion']) {
                    const source = readFileSync('test/compatibility/fixtures/' + name + '.m', 'utf8');
                    const result = await session.execute(source);
                    if (result.status !== 'success' || result.outputs.filter(output => output.type === 'text').length !== 1 || result.outputs[0]?.text !== 'true\n') {
                        throw new Error('Numeric sequence fixture failed: ' + name + ' ' + JSON.stringify(result));
                    }
                }
            } finally {
                await runtime.dispose();
            }
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });
    test('preserves dispersion argument effects, suppression and recovery in a real Worker', () => {
        const script = String.raw`
            import { createNodeMathJSLabRuntime } from './lib/mathjslab.runtime-node.esm2022.js';
            const delays = [];
            const runtime = createNodeMathJSLabRuntime({ host: { request: async effect => { if (effect.type === 'delay') delays.push(effect.milliseconds); return {}; } } });
            try {
                const session = await runtime.createSession();
                const isolated = await runtime.createSession();
                const result = await session.execute('function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; v=builtin("var",arg([1,NaN,5;2,4,NaN],1),arg(0,2),arg(2,3),arg("omitnan",4)); s=feval("std",[1,NaN,5;2,4,NaN],0,2,"omitnan"); compatible=isequal(v,[8;2]) && isequal(s,sqrt(v)) && isequal(calls,[1,2,3,4]); compatible');
                if (result.status !== 'success' || result.outputs.filter(output => output.type === 'text').length !== 1 || result.outputs[0]?.text !== 'true\n' || JSON.stringify(delays) !== '[0,0,0,0]') throw new Error('Worker dispersion arguments or suppression diverged: ' + JSON.stringify(result));
                if ((await session.execute('std([],0,1,"unknown")')).status !== 'error') throw new Error('Worker did not reject invalid dispersion controls');
                if ((await session.execute('std([1,NaN,5],1,"omitnan")')).outputs[0]?.text !== '2\n') throw new Error('Worker dispersion recovery failed');
                if ((await isolated.execute('exist("v","var")')).outputs[0]?.text !== '0\n') throw new Error('Worker dispersion sessions leaked');
            } finally {
                await runtime.dispose();
            }
        `;
        expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve(__dirname, '..', '..'), stdio: 'pipe' })).not.toThrow();
    });

    test('preserves grouped statistics effects, suppression and recovery in a real Worker', () => {
        const script = String.raw`
            import { createNodeMathJSLabRuntime } from './lib/mathjslab.runtime-node.esm2022.js';
            const delays = [];
            const runtime = createNodeMathJSLabRuntime({host:{request:async effect=>{if(effect.type === 'delay') delays.push(effect.milliseconds); return {};}}});
            try {
                const session = await runtime.createSession();
                const isolated = await runtime.createSession();
                const result = await session.execute('function y=arg(v,n), global calls; calls=[calls,n]; pause(0); y=v; end; global calls; calls=[]; A=reshape([1,NaN,NaN,NaN,3,5,7,9],[2,2,2]); m=builtin("mean",arg(A,1),arg([3,1],2),arg("omitnan",3)); v=feval("var",arg(A,4),arg(0,5),arg([1,3],6),arg("omitnan",7)); s=std(arg(A,8),arg(1,9),arg("all",10),arg("omitnan",11)); compatible=isequal(m,[3,8]) && isequal(v,[4,2]) && isequal(s,sqrt(8)) && isequal(calls,1:11); compatible');
                if(result.status !== 'success' || result.outputs.filter(output=>output.type === 'text').length !== 1 || result.outputs[0]?.text !== 'true\n' || JSON.stringify(delays) !== JSON.stringify(Array(11).fill(0))) throw new Error('Worker grouped statistics diverged: '+JSON.stringify(result));
                if((await session.execute('var([],0,[1,1],"omitnan")')).status !== 'error') throw new Error('Worker accepted repeated statistical dimensions');
                if((await session.execute('std([1,3],1,"all")')).outputs[0]?.text !== '1\n') throw new Error('Worker grouped statistics recovery failed');
                if((await isolated.execute('exist("m","var")')).outputs[0]?.text !== '0\n') throw new Error('Worker grouped statistics sessions leaked');
            } finally {await runtime.dispose();}
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
