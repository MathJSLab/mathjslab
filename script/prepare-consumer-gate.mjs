import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import webpack from 'webpack';

const examples = [
    'linear-algebra/matrix-identities/symmetric-eigenvector-orthogonality.m',
    'numerical-methods/roots/newton-square-root.m',
    'programming/functions/horner-polynomial-function.m',
    'numerical-methods/calculus/trapezoidal-integration.m',
    'numerical-methods/calculus/romberg-first-extrapolation.m',
    'statistics/descriptive/weighted-population-covariance.m',
    'programming/algorithms/binary-lower-bound.m',
    'graphics/functions/closed-triangle-polyline.m',
];

/** Bundle host adapters only; all core/runtime dependencies stay external. */
export async function prepareConsumerGate(consumer) {
    consumer = path.resolve(consumer);
    const root = path.resolve(process.env.MATHJSLAB_CONSUMER_ROOT ?? '..');
    const app = path.join(root, 'mathjslab-app');
    const markdown = path.join(root, 'mathjslab-markdown');
    const artifacts = path.join(consumer, 'consumer-artifacts');
    const exampleRoot = path.join(app, 'dist/example');
    await access(path.join(app, 'src/InterpreterRuntime.ts'));
    await access(path.join(markdown, 'src/markdown/extensions/mathjslab/browserWorkerExecutor.ts'));
    await mkdir(artifacts, { recursive: true });
    const require = createRequire(path.join(consumer, 'package.json'));
    const { Interpreter } = await import(pathToFileURL(require.resolve('mathjslab/core')).href);
    let executions = 0;
    for (const locale of ['en', 'pt', 'es']) {
        for (const example of examples) {
            const source = await readFile(path.join(exampleRoot, locale, example), 'utf8');
            assert.match(source, /example_check\s*=/u);
            const interpreter = Interpreter.Create();
            const plots = [];
            interpreter.withPlotOutput(
                (request) => plots.push(request),
                () => interpreter.Evaluate(interpreter.Parse(source)),
            );
            assert.equal(interpreter.Unparse(interpreter.Execute('example_check')).trim(), 'true', `${locale}/${example}`);
            if (example.startsWith('graphics/')) assert.ok(plots.length, 'Missing native plot');
            executions++;
        }
    }
    const compiler = webpack({
        mode: 'development',
        devtool: false,
        context: process.cwd(),
        entry: {
            'app-context': path.join(app, 'src/InterpreterRuntime.ts'),
            'markdown-executor': path.join(markdown, 'src/markdown/extensions/mathjslab/browserWorkerExecutor.ts'),
        },
        experiments: { outputModule: true },
        externalsType: 'module',
        externals: [/^mathjslab(?:\/|$)/u],
        module: {
            rules: [
                {
                    test: /\.ts$/u,
                    use: [
                        {
                            loader: path.resolve('node_modules/ts-loader/index.js'),
                            options: { configFile: path.resolve('tsconfig.build.json'), transpileOnly: true, onlyCompileBundledFiles: true },
                        },
                    ],
                },
            ],
        },
        resolve: { extensions: ['.ts', '.js'], extensionAlias: { '.js': ['.js', '.ts'] } },
        output: { path: artifacts, filename: '[name].js', library: { type: 'module' } },
        optimization: { minimize: false },
    });
    try {
        await new Promise((resolve, reject) =>
            compiler.run((error, stats) => (error ? reject(error) : stats.hasErrors() ? reject(Error(stats.toString({ all: false, errors: true }))) : resolve())),
        );
    } finally {
        await new Promise((resolve, reject) => compiler.close((error) => (error ? reject(error) : resolve())));
    }
    console.log(`Installed-package app examples passed: ${executions} executions across three locales.`);
    return { artifacts, exampleRoot, browserChecks: consumerBrowserChecks(examples) };
}

function consumerBrowserChecks(selected) {
    return `
  const {withActiveInterpreter,getActiveInterpreter}=await import('/consumer/app-context.js');
  const {createInProcessMathJSLabRuntime}=await import('/lib/mathjslab.runtime.esm2022.js');
  const appRuntime=createInProcessMathJSLabRuntime({evaluate:(interpreter,operation)=>({value:withActiveInterpreter(interpreter,()=>{check(getActiveInterpreter()===interpreter,'app owner mismatch');return operation();})}),host:{request:async effect=>{if(effect.type==='delay'&&effect.milliseconds===999000)return new Promise(()=>{});return effect.type==='read-text'?{value:await (await fetch('/fixture/'+effect.reference)).text()}: {};}}});
  try {
   const appSession=await appRuntime.createSession();
   const appOther=await appRuntime.createSession({numeric:{engine:"number"}});
   check((await appOther.execute("1+1")).outputs[0]?.text==='2\\n',"app numeric creation");
   check((await appSession.execute("1+1")).outputs[0]?.text==='2\\n',"app mixed backend parser");
   check((await appOther.execute('retained=7; configure("real","decimal"); retained+1')).outputs[0]?.text==='8\\n',"app backend switch retains workspace");
   const run=await appSession.execute(await (await fetch('/fixture/core-cycle.m')).text());
   check(run.status==='success'&&run.outputs[0]?.text==='true\\n','app retained cycle failed: '+JSON.stringify(run.diagnostics));
   check((await appOther.execute('exist("dest","var")')).outputs[0]?.text==='0\\n','app workspace leak');
   const appProtocols=await appSession.execute(await (await fetch('/fixture/resumable-protocols.m')).text()+await (await fetch('/fixture/protocols-cycle.m')).text());
   const appEducational=await appSession.execute(await (await fetch('/fixture/educational-math-cycle.m')).text());
   check(appEducational.status==='success'&&appEducational.outputs[0]?.text==='true\\n','app educational math cycle failed');
   const appRandom=await appSession.execute(await (await fetch('/fixture/random-cycle.m')).text());
   check(appRandom.status==='success'&&appRandom.outputs[0]?.text==='true\\n','app random cycle failed');
   check(appProtocols.status==='success'&&appProtocols.outputs[0]?.text==='true\\n','app protocol cycle failed');
   const appClasses=await appSession.execute(await (await fetch('/fixture/resumable-classes.m')).text()+await (await fetch('/fixture/classes-cycle.m')).text());
   check(appClasses.status==='success'&&appClasses.outputs[0]?.text==='true\\n','app classes cycle failed');
   const appDynamic=await appSession.execute(await (await fetch('/fixture/resumable-dynamic.m')).text()+await (await fetch('/fixture/dynamic-cycle.m')).text());
   check(appDynamic.status==='success'&&appDynamic.outputs[0]?.text==='true\\n','app dynamic cycle failed');
   const appValidation=await appSession.execute(await (await fetch('/fixture/resumable-validation.m')).text()+await (await fetch('/fixture/validation-cycle.m')).text());
   check(appValidation.status==='success'&&appValidation.outputs[0]?.text==='true\\n','app validation cycle failed');
   let outside=false;try{getActiveInterpreter();}catch{outside=true;}check(outside,'app active interpreter leaked');
   const cancelled=new AbortController();
   const active=appSession.execute('function y=appwait(), pause(999); y=1; end; z=appwait();',{signal:cancelled.signal});
   setTimeout(()=>cancelled.abort('app abort'),20);check((await active).status==='cancelled','app abort failed');
  } finally {await appRuntime.dispose();}
  const {createBrowserMathJSLabWorkerExecutor}=await import('/consumer/markdown-executor.js');
  const ownedWorkers=new Set();let terminated=0,mounted=0,resized=0,purged=0;
  const executor=createBrowserMathJSLabWorkerExecutor({toMathML:source=>source,workerFactory:()=>{const worker=new Worker('/lib/mathjslab.runtime-worker.esm2022.js',{type:'module'});ownedWorkers.add(worker);const terminate=worker.terminate.bind(worker);worker.terminate=()=>{if(ownedWorkers.delete(worker))terminated++;terminate();};return worker;},plotRenderer:{render:()=>{mounted++;},resize:()=>{resized++;},dispose:()=>{purged++;}}});
  const context={sourceUrl:new URL('/lesson.md',location.href),resources:{readText:async(reference,ctx)=>{const response=await fetch('/fixture/'+reference,{signal:ctx.signal});check(response.ok,'missing Markdown resource');return response.text();}}};
  try {
   const md=await executor.createSession(context),other=await executor.createSession(context);
   const parsed=await md.parse('x=1; x+1',context);check(!parsed.error&&parsed.statements.length===2,'Markdown parse mapping');
   const statement={...context,blockIndex:0,statementIndex:0};
   const mdResult=await md.execute(await (await fetch('/fixture/core-cycle.m')).text(),statement);
   check(mdResult.status==='success'&&mdResult.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown retained cycle failed: '+JSON.stringify(mdResult.error?.message));
   check((await other.execute('exist("dest","var")',statement)).outputs.some(output=>output.type==='mathml'&&output.markup.includes('0')),'Markdown workspace leak');
   const mdProtocols=await md.execute(await (await fetch('/fixture/resumable-protocols.m')).text()+await (await fetch('/fixture/protocols-cycle.m')).text(),statement);
   const mdEducational=await md.execute(await (await fetch('/fixture/educational-math-cycle.m')).text(),statement);
   check(mdEducational.status==='success'&&mdEducational.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown educational math cycle failed');
   const mdRandom=await md.execute(await (await fetch('/fixture/random-cycle.m')).text(),statement);
   check(mdRandom.status==='success'&&mdRandom.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown random cycle failed');
   check(mdProtocols.status==='success'&&mdProtocols.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown protocol cycle failed');
   const mdClasses=await md.execute(await (await fetch('/fixture/resumable-classes.m')).text()+await (await fetch('/fixture/classes-cycle.m')).text(),statement);
   check(mdClasses.status==='success'&&mdClasses.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown classes cycle failed');
   const mdDynamic=await md.execute(await (await fetch('/fixture/resumable-dynamic.m')).text()+await (await fetch('/fixture/dynamic-cycle.m')).text(),statement);
   check(mdDynamic.status==='success'&&mdDynamic.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown dynamic cycle failed');
   const mdValidation=await md.execute(await (await fetch('/fixture/resumable-validation.m')).text()+await (await fetch('/fixture/validation-cycle.m')).text(),statement);
   check(mdValidation.status==='success'&&mdValidation.outputs.some(output=>output.type==='mathml'&&output.markup.includes('true')),'Markdown validation cycle failed');
   const numericSwitch=await md.execute('retained=7; configure("real","number"); retained+1',statement);check(numericSwitch.status==='success','Markdown backend switch');
   check((await md.execute('1+1',statement)).status==='success','Markdown numeric error recovery');
   const error=await md.execute('eig([0,-1;1,0])',statement);check(error.status==='error'&&error.error?.code,'Markdown error mapping');
   const plot=await md.execute('plot([1,2]);',statement);const nodes=plot.outputs.filter(output=>output.type==='node');check(nodes.length===1,'Markdown plot missing');
   for(const node of nodes){document.body.append(node.node);await node.mount?.(node.node);await node.resize?.(node.node);await node.dispose?.();node.node.remove();}
   check(mounted===1&&resized===1&&purged===1,'Markdown plot lifecycle');
   const abort=new AbortController();const aborted=md.execute('pause(999)',{...statement,signal:abort.signal});setTimeout(()=>abort.abort('Markdown abort'),30);check((await aborted).status==='cancelled','Markdown cancellation mapping');
   let timeout=false;try{await md.execute('pause(999)',{...statement,executionPolicy:{mathjslab:{timeoutMs:100}}});}catch(error){timeout=error.name==='TimeoutError'&&error.code==='MATHJSLAB_TIMEOUT';}check(timeout,'Markdown timeout mapping');
   await md.dispose();await md.dispose();check((await other.execute('2+2',statement)).status==='success','Markdown independent disposal');
   const exampleSession=await runtime.createSession();
   for(const example of ${JSON.stringify(selected)}) {const source=await (await fetch('/example/en/'+example)).text();const result=await exampleSession.execute(source);check(result.status==='success','browser app example failed: '+example);check((await exampleSession.execute('example_check')).outputs[0]?.text==='true\\n','browser app example result: '+example);}
   await exampleSession.dispose();
  } finally {await executor.dispose();}
  check(ownedWorkers.size===0&&terminated>=2,'Markdown Workers leaked');
  console.log('App and Markdown consumers passed against installed package');
`;
}
