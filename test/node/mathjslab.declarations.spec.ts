/// <reference types="jest" />
import { execFileSync } from 'node:child_process';
import path from 'node:path';

test('distributed public declarations expose runtime and plot APIs to NodeNext consumers', () => {
    const script = String.raw`
        import assert from 'node:assert/strict';
        import path from 'node:path';
        import ts from 'typescript';
        const filename=path.resolve('test/node/__declaration-consumer__.mts');
        const source='import { InProcessMathJSLabRuntime, type PlotOutputRequest } from "mathjslab"; import { createNodeMathJSLabRuntime } from "mathjslab/runtime/node"; const factories=[InProcessMathJSLabRuntime,createNodeMathJSLabRuntime]; function use(plot:PlotOutputRequest){return {plot,factories}}; void use;';
        const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext};
        const host=ts.createCompilerHost(options);
        const original=host.getSourceFile;
        host.getSourceFile=(name,...args)=>path.resolve(name)===filename?ts.createSourceFile(filename,source,ts.ScriptTarget.ES2022,true):original(name,...args);
        const fileExists=host.fileExists;
        host.fileExists=name=>path.resolve(name)===filename||fileExists(name);
        const program=ts.createProgram([filename],options,host);
        const diagnostics=ts.getPreEmitDiagnostics(program);
        assert.equal(diagnostics.length,0,ts.formatDiagnostics(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve('.'), timeout: 30000, encoding: 'utf8' });
});
