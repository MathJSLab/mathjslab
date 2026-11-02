import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { benchmarkWorker } from './worker-endpoint.mjs';

export const profiles = {
    smoke: { statements: 24, matrix: 8, reduction: [4, 5, 3], codec: [8, 8] },
    standard: { statements: 160, matrix: 32, reduction: [16, 12, 8], codec: [32, 32] },
};

export const cases = [
    { id: 'parse.program', category: 'parsing' },
    { id: 'evaluate.preparsed', category: 'execution' },
    { id: 'matrix.multiply', category: 'numeric' },
    { id: 'matrix.multiply-blocked', category: 'numeric' },
    { id: 'reduce.pages', category: 'numeric' },
    { id: 'codec.encode-packed', category: 'serialization' },
    { id: 'codec.decode-packed', category: 'serialization' },
    { id: 'codec.clone-packed', category: 'serialization' },
    { id: 'codec.transfer-packed', category: 'serialization' },
    { id: 'codec.encode-lossless', category: 'serialization', engines: ['decimal'] },
    { id: 'codec.decode-lossless', category: 'serialization', engines: ['decimal'] },
    { id: 'worker.startup', category: 'worker' },
    { id: 'local.steady', category: 'runtime' },
    { id: 'worker.steady', category: 'worker' },
    { id: 'local.payload', category: 'runtime' },
    { id: 'worker.payload', category: 'worker' },
];

/** Setup and reference calculations are never included in timed samples. */
export async function prepareWorkload({ id, engine, profile, packageRoot }) {
    const spec = profiles[profile];
    assert.ok(spec, 'Unknown profile');
    const core = await import(pathToFileURL(path.join(packageRoot, 'lib/mathjslab.node.esm2022.js')).href);
    const { Complex, MultiArray, MathOperation, CoreFunctions, RuntimeValueCodec, Interpreter } = core;
    Complex.engine = engine;
    if (engine === 'decimal') Complex.set({ precision: 40, precisionCompare: 7 });
    const blas = { blockThreshold: id === 'matrix.multiply-blocked' ? 1 : 100000, blockSize: id === 'matrix.multiply-blocked' ? 8 : 64 };
    Interpreter.Create().Execute(`configure('blockThreshold',${blas.blockThreshold});configure('blockSize',${blas.blockSize});`);
    const settings = { complex: { ...Complex.settings }, engine, blas };
    const pattern = (row, column) => (((row * 17 + column * 13) % 31) - 15) / 16;
    const matrix = (rows, columns, offset = 0) => {
        const value = new MultiArray([rows, columns]);
        value.array = Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => Complex.create(pattern(row + offset, column))));
        MultiArray.setType(value);
        return value;
    };
    const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
    const finish = (run, verify, metadata, cleanup = async () => {}) => ({ run, verify, metadata, cleanup, settings });
    if (id === 'parse.program' || id === 'evaluate.preparsed') {
        const interpreter = Interpreter.Create();
        const source = `benchTotal=0;${Array.from({ length: spec.statements }, (_, index) => `benchTotal+=${index + 1};`).join('')}benchTotal`;
        const expected = (spec.statements * (spec.statements + 1)) / 2;
        if (id === 'parse.program') {
            const reference = interpreter.Unparse(interpreter.Parse(source));
            return finish(
                () => interpreter.Parse(source),
                (result) => {
                    assert.equal(interpreter.Unparse(result), reference);
                    const evaluated = interpreter.Evaluate(result);
                    assert.equal(Complex.realToNumber(evaluated.list.at(-1)), expected);
                },
                { sourceBytes: Buffer.byteLength(source), statements: spec.statements + 2 },
            );
        }
        const parsed = interpreter.Parse(source);
        return finish(
            () => interpreter.Evaluate(parsed),
            (result) => assert.equal(interpreter.Unparse(result.list.at(-1)).trim(), String(expected)),
            { statements: spec.statements + 2, includesParsing: false },
        );
    }
    if (id === 'matrix.multiply' || id === 'matrix.multiply-blocked') {
        const n = spec.matrix;
        const a = matrix(n, n);
        const b = matrix(n, n, 3);
        const expected = Array.from({ length: n }, (_, row) =>
            Array.from({ length: n }, (_, column) => Array.from({ length: n }, (_, k) => pattern(row, k) * pattern(k + 3, column)).reduce((x, y) => x + y, 0)),
        );
        return finish(
            () => MathOperation.mtimes(a, b),
            (result) => {
                assert.deepEqual(result.dimension, [n, n]);
                for (let row = 0; row < n; row++) for (let column = 0; column < n; column++) near(Complex.realToNumber(result.array[row][column]), expected[row][column]);
            },
            { dimensions: [n, n], scalarMultiplyAdds: n ** 3 },
        );
    }
    if (id === 'reduce.pages') {
        const [rows, columns, pages] = spec.reduction;
        const value = matrix(rows * pages, columns);
        value.dimension = [rows, columns, pages];
        return finish(
            () => CoreFunctions.sum(value, Complex.create(2)),
            (result) => {
                assert.deepEqual(result.dimension, [rows, 1, pages]);
                for (let row = 0; row < rows * pages; row++)
                    near(
                        Complex.realToNumber(result.array[row][0]),
                        Array.from({ length: columns }, (_, c) => pattern(row, c)).reduce((x, y) => x + y, 0),
                    );
            },
            { dimensions: value.dimension, axis: 2 },
        );
    }
    if (id.startsWith('codec.')) {
        const value = matrix(...spec.codec);
        const lossless = id.endsWith('lossless');
        if (lossless) value.array[0][0] = Complex.create('1.0000000000000000000000000000001');
        const encoded = RuntimeValueCodec.encode(value);
        const [rows, columns] = spec.codec;
        const expectedReal = (row, column) => (lossless && row === 0 && column === 0 ? '1.0000000000000000000000000000001' : String(pattern(row, column)));
        assert.equal(encoded.type, 'array');
        assert.deepEqual(encoded.dimensions, spec.codec);
        assert.equal(Boolean(encoded.packed), !lossless);
        for (let row = 0; row < rows; row++)
            for (let column = 0; column < columns; column++) {
                const index = row * columns + column;
                if (encoded.packed) {
                    assert.equal(encoded.packed.real[index], pattern(row, column));
                    assert.equal(encoded.packed.imaginary[index], 0);
                    assert.equal(encoded.packed.numericType[index], value.array[row][column].type);
                } else assert.deepEqual(encoded.values[index], { type: 'complex', real: expectedReal(row, column), imaginary: '0', numericType: value.array[row][column].type });
            }
        if (encoded.packed)
            assert.deepEqual(new Set(RuntimeValueCodec.transferables(encoded)), new Set([encoded.packed.real.buffer, encoded.packed.imaginary.buffer, encoded.packed.numericType.buffer]));
        const metadata = {
            dimensions: value.dimension,
            representation: lossless ? 'lossless decimal strings' : 'packed Float64/Uint8',
            packedBytes: encoded.packed ? RuntimeValueCodec.transferables(encoded).reduce((sum, buffer) => sum + buffer.byteLength, 0) : 0,
        };
        if (id.includes('encode'))
            return finish(
                () => RuntimeValueCodec.encode(value),
                (result) => assert.deepEqual(result, encoded),
                metadata,
            );
        if (id.includes('decode'))
            return finish(
                () => RuntimeValueCodec.decode(encoded),
                (result) => {
                    assert.deepEqual(result.dimension, spec.codec);
                    for (let row = 0; row < rows; row++)
                        for (let column = 0; column < columns; column++) {
                            assert.equal(String(result.array[row][column].re), expectedReal(row, column));
                            assert.equal(String(result.array[row][column].im), '0');
                            assert.equal(result.array[row][column].type, value.array[row][column].type);
                        }
                    assert.deepEqual(RuntimeValueCodec.encode(result), encoded);
                },
                metadata,
            );
        if (id.includes('transfer')) {
            // Reusable ping-pong ownership: each operation transfers all buffers once.
            let current = structuredClone(encoded);
            return finish(
                () => {
                    const prior = current;
                    current = structuredClone(prior, { transfer: RuntimeValueCodec.transferables(prior) });
                    return { current, detachedBytes: [prior.packed.real.byteLength, prior.packed.imaginary.byteLength, prior.packed.numericType.byteLength] };
                },
                (result) => {
                    assert.deepEqual(result.detachedBytes, [0, 0, 0]);
                    assert.deepEqual(result.current, encoded);
                },
                metadata,
            );
        }
        return finish(
            () => structuredClone(encoded),
            (result) => assert.deepEqual(result, encoded),
            metadata,
        );
    }
    const remote = id.startsWith('worker.');
    const runtimeModule = remote ? await import(pathToFileURL(path.join(packageRoot, 'lib/mathjslab.runtime-node.esm2022.js')).href) : core;
    assert.equal(runtimeModule.RuntimeValueCodec, core.RuntimeValueCodec, 'Runtime must use the selected unique core.');
    const endpoints = new Set();
    const factory = () =>
        remote
            ? runtimeModule.createNodeMathJSLabRuntime({
                  workerFactory: () => {
                      const endpoint = benchmarkWorker(packageRoot, engine);
                      endpoints.add(endpoint);
                      return endpoint;
                  },
              })
            : runtimeModule.createInProcessMathJSLabRuntime();
    const dispose = async (runtime) => {
        try {
            await runtime.dispose();
        } finally {
            await Promise.all([...endpoints].map((endpoint) => endpoint.terminate()));
            endpoints.clear();
        }
    };
    const configuration = 'configure("blockThreshold",100000);configure("blockSize",64);getconfig("real")';
    const checkSuccess = (result) => assert.equal(result.status, 'success', JSON.stringify(result.diagnostics));
    const checkConfiguration = (result) => {
        checkSuccess(result);
        assert.ok(result.outputs[0]?.text.includes(engine));
    };
    if (id === 'worker.startup') {
        return finish(
            async () => {
                const runtime = factory();
                try {
                    const session = await runtime.createSession();
                    const configured = await session.execute(configuration);
                    return { configured, result: await session.execute('1+1') };
                } finally {
                    await dispose(runtime);
                }
            },
            ({ configured, result }) => {
                checkConfiguration(configured);
                checkSuccess(result);
                assert.equal(result.outputs[0]?.text, '2\n');
            },
            { includes: 'backend bootstrap, Worker creation, session init, configure/query, first numeric execute and disposal' },
        );
    }
    const runtime = factory();
    try {
        const session = await runtime.createSession();
        checkConfiguration(await session.execute(configuration));
        const payload = id.endsWith('payload');
        const count = spec.codec[0] * spec.codec[1];
        const source = payload ? `reshape(1:${count},[${spec.codec.join(',')}])` : 'sum((1:32).^2)';
        return finish(
            () => session.execute(source),
            (result) => {
                checkSuccess(result);
                if (!payload) assert.equal(result.outputs[0]?.text, '11440\n');
                else {
                    const encoded = result.outputs.find((output) => output.type === 'data')?.value;
                    assert.equal(encoded?.type, 'array');
                    assert.deepEqual(encoded.dimensions, spec.codec);
                    assert.equal(encoded.packed.real[0], 1);
                    assert.equal(encoded.packed.real.at(-1), count);
                    assert.equal(encoded.packed.real.length, count);
                    encoded.packed.real.forEach((value, index) => assert.equal(value, (index % spec.codec[1]) * spec.codec[0] + Math.floor(index / spec.codec[1]) + 1));
                    encoded.packed.imaginary.forEach((value) => assert.equal(value, 0));
                    encoded.packed.numericType.forEach((value) => assert.equal(value, Complex.create(1).type));
                }
            },
            { source, includes: 'parse, execute, text/MathML rendering and value encoding' + (remote ? ', Worker IPC' : ''), ...(payload ? { dimensions: spec.codec } : {}) },
            () => dispose(runtime),
        );
    } catch (error) {
        await dispose(runtime);
        throw error;
    }
}
