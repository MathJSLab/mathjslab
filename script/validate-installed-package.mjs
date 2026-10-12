import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';

// Consume an installed tarball, never the repository's source or bundles.
const consumer = path.resolve(process.argv[2] ?? 'test-results/release-gate/consumer');
const installed = path.join(consumer, 'node_modules/mathjslab');
const manifest = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
async function verifyTargets(value) {
    if (typeof value === 'string') await access(path.join(installed, value));
    else for (const target of Object.values(value)) await verifyTargets(target);
}
await verifyTargets(manifest.exports);
execFileSync(
    process.execPath,
    [
        '-e',
        "for (const name of ['mathjslab','mathjslab/node-cjs','mathjslab/node-cjs-es2015']) { const entry=require(name); if(typeof entry.Interpreter !== 'function') throw Error(name+' did not load'); }",
    ],
    { cwd: consumer, stdio: 'inherit' },
);
const entries = Object.entries(manifest.exports).filter(([, target]) => target.types);
const decimalWeightProbe = String.raw`
import assert from 'node:assert/strict';
import { Complex, CoreFunctions, MultiArray } from 'mathjslab/core';
Complex.engine='decimal';
const values=MultiArray.toRowVector([Complex.one(),Complex.create(3)]);
const negative=MultiArray.toRowVector([Complex.one(),Complex.create('-1e-999')]);
assert.throws(()=>CoreFunctions.variance(values,negative),/nonnegative/);
assert.throws(()=>CoreFunctions.std(values,negative),/nonnegative/);
const tiny=MultiArray.toRowVector([Complex.zero(),Complex.create('1e-999')]);
assert.equal(Complex.realToNumber(CoreFunctions.variance(values,tiny)),0);
`;
execFileSync(process.execPath, ['--input-type=module', '-e', decimalWeightProbe], { cwd: consumer, stdio: 'inherit' });
const imports = entries.map(([name], index) => `import * as entry${index} from '${name === '.' ? 'mathjslab' : 'mathjslab' + name.slice(1)}'; void entry${index};`).join('\n');
const typeProbe = path.join(consumer, 'consumer.mts');
await writeFile(typeProbe, imports);
execFileSync(
    process.execPath,
    [
        'node_modules/typescript/bin/tsc6',
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        'false',
        '--target',
        'ES2022',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        typeProbe,
    ],
    { stdio: 'inherit' },
);
execFileSync(
    process.execPath,
    [
        '--input-type=module',
        '-e',
        "import { createNodeMathJSLabRuntime } from 'mathjslab/runtime/node'; const runtime=createNodeMathJSLabRuntime(); try { const session=await runtime.createSession(); const result=await session.execute('mean([1,NaN,3],\"all\",\"omitnan\")'); if(result.status!=='success'||result.outputs[0]?.text!=='2\\n') throw Error(JSON.stringify(result)); } finally { await runtime.dispose(); }",
    ],
    { cwd: consumer, stdio: 'inherit' },
);
const browserCandidates = [
    process.env.MATHJSLAB_BROWSER_EXECUTABLE,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
].filter(Boolean);
let executable;
for (const candidate of browserCandidates) {
    try {
        await access(candidate);
        executable = candidate;
        break;
    } catch {
        /* Try the next installed browser. */
    }
}
assert.ok(executable, 'Set MATHJSLAB_BROWSER_EXECUTABLE to a Chromium browser');
const page = `<!doctype html><script type="importmap">{"imports":{"mathjslab/core":"/lib/mathjslab.web.esm2022.js"}}</script><script type="module">
import {createBrowserMathJSLabRuntime} from '/lib/mathjslab.runtime-browser.esm2022.js';
globalThis.gatePromise=(async()=>{
 const delays=[]; let workers=0;
 const runtime=createBrowserMathJSLabRuntime({workerFactory:()=>{workers++; return new Worker('/lib/mathjslab.runtime-worker.esm2022.js',{type:'module'});},host:{request:async effect=>{if(effect.type==='delay') delays.push(effect.milliseconds); return {};}}});
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 try {
  const session=await runtime.createSession();
  for(const fixture of ['statistics-pages','statistics-cross-pages','statistics-global-missing','numeric-missing-aliases','dispersion-paired-outputs','weighted-dispersion']) {
   const response=await fetch('/fixture/'+fixture+'.m'); check(response.ok,fixture+' missing');
   const result=await session.execute(await response.text()); check(result.status==='success'&&result.outputs.filter(x=>x.type==='text').at(-1)?.text==='true\\n',JSON.stringify(result));
  }
  const mapped=await session.execute('function y=twice(x), global mappedCalls; mappedCalls+=1; y=2*x; end; global mappedCalls; mappedCalls=0; A=spfun(@twice,[0,2;3,0]); [sum(A(:)),mappedCalls]');
  check(mapped.status==='success'&&mapped.outputs[0]?.text==='[10,2]\\n','named callback results not materialized once');
  const exact=await session.execute('[1.00000000000000000001,1e-999]');
  const encoded=exact.outputs.find(output=>output.type==='data')?.value;
  check(encoded?.type==='array'&&!encoded.packed&&encoded.values?.[0]?.real==='1.00000000000000000001'&&encoded.values?.[1]?.real==='1e-999','decimal array precision lost in native Worker');
  const result=await session.execute('function y=gatearg(x), pause(0.001); y=x; end; calls=0; a=mean([1,NaN,3],gatearg("all"),gatearg("omitmissing")); [b,bm]=var([1,3],gatearg(0),gatearg("all")); c=std([1,3],gatearg(1),gatearg("all")); [a,b,c,bm]');
  check(result.status==='success'&&result.outputs[0]?.text==='[2,2,1,2]\\n',JSON.stringify(result));
  check(delays.length===6,'effects repeated');
  const weighted=await session.execute('count=0; [wv,wm]=feval("var",gatearg([1,3]+ ++count),gatearg([1,3]+0* ++count),gatearg(2),gatearg("omitmissing")); compatible=abs(wv-0.75)<1e-12 && abs(wm-3.5)<1e-12 && count==2; compatible');
  check(weighted.status==='success'&&weighted.outputs[0]?.text==='true\\n','weighted suspended outputs failed');
  check(delays.length===10,'weighted effects replayed');
  check((await session.execute('[wv,wm]=std([1,3],gatearg([-1,1]));')).status==='error','negative weights accepted');
  check((await session.execute('abs(wv-0.75)<1e-12 && abs(wm-3.5)<1e-12')).outputs[0]?.text==='true\\n','weighted error committed outputs');
  const failed=await session.execute('function y=badpaired(), pause(0.007); error("paired worker failure"); y=0; end; [b,bm]=var([1,3],badpaired());');
  check(failed.status==='error'&&failed.diagnostics[0]?.message.includes('paired worker failure'),'resumed error lost');
  check((await session.execute('[b,bm]')).outputs[0]?.text==='[2,2]\\n','paired assignment committed after failure');
  check((await session.execute('[b,bm,third]=var([1,3]);')).status==='error','excess paired outputs accepted');
  check((await session.execute('mean([1,2],[1,1]);')).status==='error','invalid dimensions accepted');
  check((await session.execute('a')).outputs[0]?.text==='2\\n','workspace recovery');
  const isolated=await runtime.createSession(); check((await isolated.execute('exist("a","var")')).outputs[0]?.text==='0\\n','session leak');
  await session.reset(); check((await session.execute('exist("a","var")')).outputs[0]?.text==='0\\n','reset failed');
  check(workers>=1,'no native Worker'); return {workers,delays:delays.length,userAgent:navigator.userAgent};
 } finally {await runtime.dispose();}
})();</script>`;
const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
        if (url.pathname === '/') {
            response.setHeader('Content-Type', 'text/html');
            response.end(page);
            return;
        }
        const base = url.pathname.startsWith('/lib/') ? installed : path.resolve('test/compatibility/fixtures');
        const relative = url.pathname.startsWith('/lib/') ? url.pathname.slice(1) : url.pathname.replace('/fixture/', '');
        const file = path.resolve(base, relative);
        assert.ok(file.startsWith(base + path.sep));
        response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/plain');
        response.end(await readFile(file));
    } catch {
        response.writeHead(404);
        response.end();
    }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const profile = path.join(consumer, 'browser-profile');
const browser = spawn(
    executable,
    ['--headless=new', '--no-sandbox', '--remote-debugging-port=0', '--no-first-run', '--disable-background-networking', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
);
let socket;
try {
    const endpoint = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('Browser startup timeout')), 20000);
        let stderr = '';
        browser.stderr.on('data', (chunk) => {
            stderr += chunk;
            const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (match) {
                clearTimeout(timer);
                resolve(match[1]);
            }
        });
        browser.once('error', reject);
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
    });
    let sequence = 0;
    const pending = new Map();
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const callback = pending.get(message.id);
        if (callback) {
            pending.delete(message.id);
            message.error ? callback.reject(Error(JSON.stringify(message.error))) : callback.resolve(message.result);
        }
    };
    const send = (method, params = {}, sessionId) =>
        new Promise((resolve, reject) => {
            const id = ++sequence;
            pending.set(id, { resolve, reject });
            socket.send(JSON.stringify({ id, method, params, sessionId }));
        });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` }, sessionId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await Promise.race([
        send(
            'Runtime.evaluate',
            {
                expression: '(async()=>{while(!globalThis.gatePromise) await new Promise(r=>setTimeout(r,10)); return await globalThis.gatePromise;})()',
                awaitPromise: true,
                returnByValue: true,
            },
            sessionId,
        ),
        new Promise((_, reject) => setTimeout(() => reject(Error('Browser gate timeout')), 45000).unref()),
    ]);
    assert.ok(!result.exceptionDetails, JSON.stringify(result));
    console.log('Installed package and native browser Worker passed:', result.result.value);
    await send('Browser.close');
} finally {
    socket?.close();
    browser.kill();
    await new Promise((resolve) => server.close(resolve));
}
