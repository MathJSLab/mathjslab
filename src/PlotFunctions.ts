import { Decimal } from 'decimal.js';

import { AST, type BuiltInFunctionTable, type NodeExpr, type NodeIdentifier } from './AST';
import { MultiArray, type ElementType } from './MultiArray';
import { CharString } from './CharString';
import { ComplexDecimal } from './ComplexDecimal';
import { LinearAlgebra } from './LinearAlgebra';
import { Scope } from './Scope';
import { CallFrame } from './CallFrame';

/** Serializable host-neutral plot preparation. Renderer adapters own materialization. */
export type PlotTrace = Record<string, unknown>;
/** Serializable visualization payload; hosts interpret trace, layout and config records. */
export type PlotOutputRequest = {
    readonly type: 'plot' | 'plot3' | 'surf' | 'plot2d' | 'histogram';
    readonly data: PlotTrace[];
    readonly layout: Record<string, unknown>;
    readonly config: Record<string, unknown>;
};
export type PlotInterpreter = {
    readonly context: { readonly currentScope: Scope; readonly callStack: CallFrame[] };
    Evaluator(expr: NodeExpr, scope?: Scope): NodeExpr;
};
/**
 * Create native plotting functions bound to one interpreter workspace.
 * @param interpreter Owning evaluator and scope stack used for synchronous sampling.
 * @param output Optional synchronous sink for prepared visualization requests.
 * @returns Built-in function table; rendering remains the host's responsibility.
 */
export const createPlotFunctionTable = (interpreter: PlotInterpreter, output?: (request: PlotOutputRequest) => void): BuiltInFunctionTable => {
    const insertOutput = { type: '' };
    type PlotData = {
        data: Array<number>;
        X: Array<number | string>;
        MinX: number;
        MaxX: number;
        MinY: number;
        MaxY: number;
    };

    const plotData: PlotData = {
        data: [],
        X: [],
        MinX: 0,
        MaxX: 0,
        MinY: 0,
        MaxY: 0,
    };

    const plotWidth = 100;

    type NumericMatrix = number[][];

    type ComplexPoint = {
        re: number;
        im: number;
    };

    type LineStyle = { color?: string; dash?: string; width?: number };

    type MarkerStyle = { color?: string; size?: number; symbol?: string };

    type TraceStyle = {
        line: LineStyle;
        marker: MarkerStyle;
        mode?: string;
        name?: string;
    };

    type PlotRenderState = {
        data: PlotTrace[];
        layout: Record<string, unknown>;
        config: Record<string, unknown>;
    };

    const defaultPlotConfig: Record<string, unknown> = {
        displayModeBar: false,
        responsive: true,
        staticPlot: false,
    };

    const plotRenderState: PlotRenderState = {
        data: [],
        layout: {},
        config: defaultPlotConfig,
    };

    const colorMap: Record<string, string> = {
        k: 'black',
        black: 'black',
        r: 'red',
        red: 'red',
        g: 'green',
        green: 'green',
        b: 'blue',
        blue: 'blue',
        y: 'yellow',
        yellow: 'yellow',
        m: 'magenta',
        magenta: 'magenta',
        c: 'cyan',
        cyan: 'cyan',
        w: 'white',
        white: 'white',
    };

    const markerMap: Record<string, NonNullable<MarkerStyle['symbol']>> = {
        '+': 'cross',
        o: 'circle',
        '*': 'star',
        '.': 'circle',
        x: 'x',
        '|': 'line-ns',
        _: 'line-ew',
        s: 'square',
        d: 'diamond',
        '^': 'triangle-up',
        v: 'triangle-down',
        '>': 'triangle-right',
        '<': 'triangle-left',
        p: 'pentagon',
        h: 'hexagon',
    };

    const lineStyleMap: Record<string, NonNullable<LineStyle['dash']>> = {
        '-': 'solid',
        '--': 'dash',
        ':': 'dot',
        '-.': 'dashdot',
    };

    const plotPropertyNames = new Set(['color', 'linestyle', 'linewidth', 'marker', 'markersize', 'markeredgecolor', 'markerfacecolor', 'displayname']);

    const isComplexValue = (value: ElementType): value is ComplexDecimal =>
        value instanceof ComplexDecimal || (typeof value === 'object' && value !== null && 're' in value && 'im' in value && typeof value.re === 'object' && typeof value.im === 'object');

    const isMultiArrayValue = (value: ElementType): value is MultiArray =>
        value instanceof MultiArray ||
        (typeof value === 'object' && value !== null && 'array' in value && 'dimension' in value && Array.isArray(value.array) && Array.isArray(value.dimension));

    const isNumericPlotValue = (value: ElementType): value is ComplexDecimal | MultiArray => isComplexValue(value) || isMultiArrayValue(value);

    const isStringPlotValue = (value: ElementType): value is CharString =>
        value instanceof CharString || (typeof value === 'object' && value !== null && 'str' in value && typeof value.str === 'string');

    const realNumber = (value: ElementType, argumentName: string): number => {
        if (!isComplexValue(value)) {
            throw new Error(`${argumentName}: expected numeric scalar`);
        }
        if (!value.im.eq(0)) {
            throw new Error(`${argumentName}: complex values are not supported in this context`);
        }
        const result = value.re.toNumber();
        if (!Number.isFinite(result)) {
            throw new Error(`${argumentName}: value must be finite`);
        }
        return result;
    };

    const complexPoint = (value: ElementType, argumentName: string): ComplexPoint => {
        if (!isComplexValue(value)) {
            throw new Error(`${argumentName}: expected numeric scalar`);
        }
        const re = value.re.toNumber();
        const im = value.im.toNumber();
        if (!Number.isFinite(re) || !Number.isFinite(im)) {
            throw new Error(`${argumentName}: value must be finite`);
        }
        return { re, im };
    };

    const numericMatrix = (value: ElementType, argumentName: string): NumericMatrix => {
        if (isComplexValue(value)) {
            return [[realNumber(value, argumentName)]];
        }
        if (!isMultiArrayValue(value)) {
            throw new Error(`${argumentName}: expected numeric array`);
        }
        return value.array.map((row) => row.map((entry) => realNumber(entry, argumentName)));
    };

    const complexVector = (value: ElementType, argumentName: string): ComplexPoint[] => {
        if (isComplexValue(value)) {
            return [complexPoint(value, argumentName)];
        }
        if (!isMultiArrayValue(value)) {
            throw new Error(`${argumentName}: expected numeric array`);
        }
        if (!isVectorMatrix(value)) {
            throw new Error(`${argumentName}: expected vector`);
        }
        return vectorElements(value).map((entry) => complexPoint(entry, argumentName));
    };

    const matrixSize = (matrix: NumericMatrix): [number, number] => [matrix.length, matrix[0]?.length ?? 0];

    const isVector = (matrix: NumericMatrix): boolean => {
        const [rows, columns] = matrixSize(matrix);
        return rows === 1 || columns === 1;
    };

    const vectorFromMatrix = (matrix: NumericMatrix): number[] => {
        const [rows, columns] = matrixSize(matrix);
        if (rows === 1) {
            return [...matrix[0]!];
        }
        if (columns === 1) {
            return matrix.map((row) => row[0]!);
        }
        throw new Error('expected vector');
    };

    const isVectorMatrix = (value: MultiArray): boolean => value.dimension[0] === 1 || value.dimension[1] === 1;

    const vectorElements = (value: MultiArray): ElementType[] => {
        if (value.dimension[0] === 1) {
            return [...value.array[0]!];
        }
        if (value.dimension[1] === 1) {
            return value.array.map((row) => row[0]!);
        }
        throw new Error('expected vector');
    };

    const defaultX = (length: number): number[] => Array.from({ length }, (_, index) => index + 1);

    const columnsOf = (matrix: NumericMatrix): number[][] => {
        const [rows, columns] = matrixSize(matrix);
        return Array.from({ length: columns }, (_, column) => Array.from({ length: rows }, (_unused, row) => matrix[row]![column]!));
    };

    const rowsOf = (matrix: NumericMatrix): number[][] => matrix.map((row) => [...row]);

    const applyFormat = (style: TraceStyle, fmt: string): void => {
        const legend = fmt.match(/;(.*);$/u);
        if (legend) {
            style.name = legend[1]!;
            fmt = fmt.slice(0, legend.index);
        }
        const lineStyle = ['--', '-.', '-', ':'].find((candidate) => fmt.includes(candidate));
        if (lineStyle) {
            style.line.dash = lineStyleMap[lineStyle]!;
            fmt = fmt.replace(lineStyle, '');
        }
        for (const [key, color] of Object.entries(colorMap)) {
            if (fmt.includes(key)) {
                style.line.color = color;
                style.marker.color = color;
                fmt = fmt.replace(key, '');
                break;
            }
        }
        for (const [key, marker] of Object.entries(markerMap)) {
            if (fmt.includes(key)) {
                style.marker.symbol = marker;
                style.mode = style.line.dash ? 'lines+markers' : 'markers';
                fmt = fmt.replace(key, '');
                break;
            }
        }
        if (!style.mode) {
            style.mode = 'lines';
        }
    };

    const applyProperty = (style: TraceStyle, property: string, value: ElementType): void => {
        const name = property.toLowerCase();
        if (name === 'color' || name === 'markeredgecolor') {
            const color = isStringPlotValue(value) ? (colorMap[value.str.toLowerCase()] ?? value.str) : undefined;
            if (!color) throw new Error(`${property}: expected color string`);
            style.line.color = color;
            style.marker.color = color;
        } else if (name === 'markerfacecolor') {
            const color = isStringPlotValue(value) ? (colorMap[value.str.toLowerCase()] ?? value.str) : undefined;
            if (!color) throw new Error(`${property}: expected color string`);
            style.marker.color = color;
        } else if (name === 'linestyle') {
            if (!isStringPlotValue(value)) throw new Error(`${property}: expected line style string`);
            style.line.dash = lineStyleMap[value.str] ?? lineStyleMap[value.str.toLowerCase()] ?? 'solid';
            style.mode = style.marker.symbol ? 'lines+markers' : 'lines';
        } else if (name === 'linewidth') {
            style.line.width = realNumber(value, property);
        } else if (name === 'marker') {
            if (!isStringPlotValue(value)) throw new Error(`${property}: expected marker string`);
            style.marker.symbol = markerMap[value.str] ?? markerMap[value.str.toLowerCase()] ?? 'circle';
            style.mode = style.line.dash ? 'lines+markers' : 'markers';
        } else if (name === 'markersize') {
            style.marker.size = realNumber(value, property);
        } else if (name === 'displayname') {
            if (!isStringPlotValue(value)) throw new Error(`${property}: expected display name string`);
            style.name = value.str;
        }
    };

    const styleFromArgs = (args: ElementType[], index: number): { style: TraceStyle; next: number } => {
        const style: TraceStyle = { line: {}, marker: {} };
        const formatArg = args[index];
        if (formatArg && isStringPlotValue(formatArg) && !plotPropertyNames.has(formatArg.str.toLowerCase())) {
            applyFormat(style, formatArg.str);
            index++;
        }
        while (true) {
            const propertyArg = args[index];
            if (!propertyArg || !isStringPlotValue(propertyArg) || !plotPropertyNames.has(propertyArg.str.toLowerCase())) {
                break;
            }
            if (index + 1 >= args.length) {
                throw new Error(`${propertyArg.str}: missing property value`);
            }
            applyProperty(style, propertyArg.str, args[index + 1]);
            index += 2;
        }
        if (!style.mode) {
            style.mode = 'lines';
        }
        return { style, next: index };
    };

    const scatterTrace = (x: number[], y: number[], style: TraceStyle): PlotTrace => ({
        x,
        y,
        type: 'scatter',
        mode: style.mode ?? 'lines',
        line: style.line,
        marker: style.marker,
        ...(style.name !== undefined ? { name: style.name } : {}),
    });

    const scatter3Trace = (x: number[], y: number[], z: number[], style: TraceStyle): PlotTrace => ({
        x,
        y,
        z,
        type: 'scatter3d',
        mode: style.mode ?? 'lines',
        line: style.line,
        marker: style.marker,
        ...(style.name !== undefined ? { name: style.name } : {}),
    });

    const build2DTraces = (xValue: ElementType | undefined, yValue: ElementType, style: TraceStyle): PlotTrace[] => {
        const yMatrix = numericMatrix(yValue, 'Y');
        const xMatrix = xValue ? numericMatrix(xValue, 'X') : undefined;
        if (!xMatrix) {
            if (isVector(yMatrix)) {
                const y = vectorFromMatrix(yMatrix);
                return [scatterTrace(defaultX(y.length), y, style)];
            }
            return columnsOf(yMatrix).map((y) => scatterTrace(defaultX(y.length), y, style));
        }
        if (isVector(xMatrix) && isVector(yMatrix)) {
            const x = vectorFromMatrix(xMatrix);
            const y = vectorFromMatrix(yMatrix);
            if (x.length !== y.length) {
                throw new Error('plot: X and Y vectors must have the same length');
            }
            return [scatterTrace(x, y, style)];
        }
        if (isVector(xMatrix)) {
            const x = vectorFromMatrix(xMatrix);
            const [rows, columns] = matrixSize(yMatrix);
            if (x.length === rows) {
                return columnsOf(yMatrix).map((y) => scatterTrace(x, y, style));
            }
            if (x.length === columns) {
                return rowsOf(yMatrix).map((y) => scatterTrace(x, y, style));
            }
        }
        if (isVector(yMatrix)) {
            const y = vectorFromMatrix(yMatrix);
            const [rows, columns] = matrixSize(xMatrix);
            if (y.length === rows) {
                return columnsOf(xMatrix).map((x) => scatterTrace(x, y, style));
            }
            if (y.length === columns) {
                return rowsOf(xMatrix).map((x) => scatterTrace(x, y, style));
            }
        }
        const [xRows, xColumns] = matrixSize(xMatrix);
        const [yRows, yColumns] = matrixSize(yMatrix);
        if (xRows !== yRows || xColumns !== yColumns) {
            throw new Error('plot: X and Y matrices must have the same dimensions');
        }
        const xColumnData = columnsOf(xMatrix);
        return columnsOf(yMatrix).map((y, index) => scatterTrace(xColumnData[index]!, y, style));
    };

    const buildPlot = (args: ElementType[]): PlotRenderState => {
        const data: PlotTrace[] = [];
        let index = 0;
        while (index < args.length) {
            if (!isNumericPlotValue(args[index])) {
                throw new Error('plot: expected numeric data argument');
            }
            const first = args[index++];
            const second = isNumericPlotValue(args[index]) ? args[index++] : undefined;
            const { style, next } = styleFromArgs(args, index);
            index = next;
            data.push(...build2DTraces(second ? first : undefined, second ?? first, style));
        }
        return {
            data,
            layout: { autosize: true },
            config: defaultPlotConfig,
        };
    };

    const build3DFromVectors = (x: number[], y: number[], z: number[], style: TraceStyle): PlotTrace => {
        if (x.length !== y.length || x.length !== z.length) {
            throw new Error('plot3: X, Y, and Z vectors must have the same length');
        }
        return scatter3Trace(x, y, z, style);
    };

    const buildPlot3 = (args: ElementType[]): PlotRenderState => {
        const data: PlotTrace[] = [];
        let index = 0;
        while (index < args.length) {
            if (!isNumericPlotValue(args[index])) {
                throw new Error('plot3: expected numeric data argument');
            }
            if (isNumericPlotValue(args[index]) && isNumericPlotValue(args[index + 1]) && isNumericPlotValue(args[index + 2])) {
                const xMatrix = numericMatrix(args[index++], 'X');
                const yMatrix = numericMatrix(args[index++], 'Y');
                const zMatrix = numericMatrix(args[index++], 'Z');
                const { style, next } = styleFromArgs(args, index);
                index = next;
                if (isVector(xMatrix) && isVector(yMatrix) && isVector(zMatrix)) {
                    data.push(build3DFromVectors(vectorFromMatrix(xMatrix), vectorFromMatrix(yMatrix), vectorFromMatrix(zMatrix), style));
                } else {
                    const [xRows, xColumns] = matrixSize(xMatrix);
                    const [yRows, yColumns] = matrixSize(yMatrix);
                    const [zRows, zColumns] = matrixSize(zMatrix);
                    if (xRows !== yRows || xRows !== zRows || xColumns !== yColumns || xColumns !== zColumns) {
                        throw new Error('plot3: X, Y, and Z matrices must have the same dimensions');
                    }
                    const xColumnsData = columnsOf(xMatrix);
                    const yColumnsData = columnsOf(yMatrix);
                    columnsOf(zMatrix).forEach((z, column) => data.push(scatter3Trace(xColumnsData[column]!, yColumnsData[column]!, z, style)));
                }
            } else if (isNumericPlotValue(args[index]) && isNumericPlotValue(args[index + 1])) {
                const x = vectorFromMatrix(numericMatrix(args[index++], 'X'));
                const complex = complexVector(args[index++], 'CPLX');
                const { style, next } = styleFromArgs(args, index);
                index = next;
                data.push(
                    build3DFromVectors(
                        x,
                        complex.map((value) => value.re),
                        complex.map((value) => value.im),
                        style,
                    ),
                );
            } else {
                const complex = complexVector(args[index++], 'CPLX');
                const { style, next } = styleFromArgs(args, index);
                index = next;
                data.push(
                    scatter3Trace(
                        defaultX(complex.length),
                        complex.map((value) => value.re),
                        complex.map((value) => value.im),
                        style,
                    ),
                );
            }
        }
        return {
            data,
            layout: { autosize: true, scene: { xaxis: { title: { text: 'X' } }, yaxis: { title: { text: 'Y' } }, zaxis: { title: { text: 'Z' } } } },
            config: defaultPlotConfig,
        };
    };

    const gridAxisFromMatrix = (matrix: NumericMatrix, axis: 'x' | 'y'): number[] => {
        if (isVector(matrix)) {
            return vectorFromMatrix(matrix);
        }
        return axis === 'x' ? [...matrix[0]!] : matrix.map((row) => row[0]!);
    };

    const consumeSurfaceProperties = (args: ElementType[], index: number): { surface: Record<string, unknown>; next: number } => {
        const surface: Record<string, unknown> = {};
        const colorArg = args[index];
        if (colorArg && isNumericPlotValue(colorArg)) {
            surface.surfacecolor = numericMatrix(colorArg, 'C');
            index++;
        }
        while (true) {
            const propertyArg = args[index];
            if (!propertyArg || !isStringPlotValue(propertyArg)) {
                break;
            }
            if (index + 1 >= args.length) {
                throw new Error(`${propertyArg.str}: missing property value`);
            }
            const property = propertyArg.str.toLowerCase();
            const value = args[index + 1];
            if (property === 'opacity') {
                surface.opacity = realNumber(value, property);
            } else if (property === 'colorscale') {
                if (!isStringPlotValue(value)) throw new Error(`${property}: expected string`);
                surface.colorscale = value.str;
            }
            index += 2;
        }
        return { surface, next: index };
    };

    const buildSurf = (args: ElementType[]): PlotRenderState => {
        if (args.length === 0 || !isNumericPlotValue(args[0])) {
            throw new Error('surf: expected Z or X, Y, Z data');
        }
        let x: number[] | undefined;
        let y: number[] | undefined;
        let z: NumericMatrix;
        let index = 0;
        if (isNumericPlotValue(args[0]) && isNumericPlotValue(args[1]) && isNumericPlotValue(args[2])) {
            const xMatrix = numericMatrix(args[index++], 'X');
            const yMatrix = numericMatrix(args[index++], 'Y');
            z = numericMatrix(args[index++], 'Z');
            x = gridAxisFromMatrix(xMatrix, 'x');
            y = gridAxisFromMatrix(yMatrix, 'y');
        } else {
            z = numericMatrix(args[index++], 'Z');
            const [rows, columns] = matrixSize(z);
            x = defaultX(columns);
            y = defaultX(rows);
        }
        const surfaceProperties = consumeSurfaceProperties(args, index);
        if (surfaceProperties.next < args.length) {
            throw new Error('surf: unsupported argument');
        }
        const surface = {
            x,
            y,
            z,
            type: 'surface',
            ...surfaceProperties.surface,
        } as PlotTrace;
        return {
            data: [surface],
            layout: { autosize: true, scene: { xaxis: { title: { text: 'X' } }, yaxis: { title: { text: 'Y' } }, zaxis: { title: { text: 'Z' } } } },
            config: defaultPlotConfig,
        };
    };

    const setPlotRenderState = (state: PlotRenderState): void => {
        plotRenderState.data = state.data;
        plotRenderState.layout = state.layout;
        plotRenderState.config = state.config;
    };

    const publish = (type: PlotOutputRequest['type'], state: PlotRenderState): void => {
        setPlotRenderState(state);
        output?.({ type, ...state });
    };
    return {
        plot: {
            type: 'BUILTIN',
            id: 'plot',
            mapper: false,
            signature: { inputs: { arity: -1, min: 0 }, outputs: { arity: -1, min: 0 } },
            ev: [],
            func: (...args: ElementType[]): NodeExpr => {
                publish('plot', buildPlot(args));
                insertOutput.type = 'plot';
                return AST.nodeIndexExpr(AST.nodeIdentifier('plot'), AST.nodeList(args));
            },
        },

        plot3: {
            type: 'BUILTIN',
            id: 'plot3',
            mapper: false,
            signature: { inputs: { arity: -1, min: 0 }, outputs: { arity: -1, min: 0 } },
            ev: [],
            func: (...args: ElementType[]): NodeExpr => {
                publish('plot3', buildPlot3(args));
                insertOutput.type = 'plot3';
                return AST.nodeIndexExpr(AST.nodeIdentifier('plot3'), AST.nodeList(args));
            },
        },

        surf: {
            type: 'BUILTIN',
            id: 'surf',
            mapper: false,
            signature: { inputs: { arity: -1, min: 0 }, outputs: { arity: -1, min: 0 } },
            ev: [],
            func: (...args: ElementType[]): NodeExpr => {
                publish('surf', buildSurf(args));
                insertOutput.type = 'surf';
                return AST.nodeIndexExpr(AST.nodeIdentifier('surf'), AST.nodeList(args));
            },
        },

        plot2d: {
            type: 'BUILTIN',
            id: 'plot2d',
            mapper: false,
            signature: { inputs: { arity: -1, min: 0 }, outputs: { arity: -1, min: 0 } },
            ev: [false, false, true, true],
            func: (expr: NodeExpr, variable: NodeIdentifier, minx: ComplexDecimal, maxx: ComplexDecimal): NodeExpr => {
                insertOutput.type = 'plot2d';
                if (!minx.im.eq(0)) {
                    throw new Error('complex number in plot2d minimum x axis');
                } else {
                    plotData.MinX = minx.re.toNumber();
                }
                if (!maxx.im.eq(0)) {
                    throw new Error('complex number in plot2d maximum x axis');
                } else {
                    plotData.MaxX = maxx.re.toNumber();
                }
                const deltaX = (plotData.MaxX - plotData.MinX) / plotWidth;
                const save_precision = Decimal.precision;
                Decimal.set({ precision: 20 });
                plotData.MaxY = 0;
                plotData.MinY = 0;
                plotData.X = [];
                plotData.data = [];
                /* Create a single scope for evaluating the sampled expression. */

                const plotScope = Scope.create(interpreter.context.currentScope);
                /* Push the plotting scope onto the call stack while sampling. */
                interpreter.context.callStack!.push(new CallFrame(plotScope));
                try {
                    for (let i = 0; i < plotWidth; i++) {
                        const xValue = ComplexDecimal.create(plotData.MinX + deltaX * i, 0);
                        plotScope.defineName(variable.id, xValue);
                        plotData.X[i] = xValue.re.toNumber();
                        const data_y = interpreter.Evaluator(expr, plotScope);
                        if (isFinite(data_y.re.toNumber()) && isFinite(data_y.im.toNumber()) && data_y.im.eq(0)) {
                            plotData.data[i] = data_y.re.toNumber();
                        } else {
                            throw new Error('non real number in plot2d y axis');
                        }
                        plotData.MaxY = Math.max(plotData.MaxY, plotData.data[i]!);
                        plotData.MinY = Math.min(plotData.MinY, plotData.data[i]!);
                    }
                    /* Restore the call stack after sampling the expression. */
                } finally {
                    interpreter.context.callStack!.pop();
                    Decimal.set({ precision: save_precision });
                }
                output?.({
                    type: 'plot2d',
                    data: [{ x: [...plotData.X], y: [...plotData.data], type: 'scatter', mode: 'lines' }],
                    layout: { autosize: true, margin: { b: 48, l: 56, r: 24, t: 24 } },
                    config: defaultPlotConfig,
                });
                return AST.nodeIndexExpr(AST.nodeIdentifier('plot2d'), AST.nodeList([expr, variable, minx, maxx]));
            },
        },

        histogram: {
            type: 'BUILTIN',
            id: 'histogram',
            mapper: false,
            signature: { inputs: { arity: -1, min: 0 }, outputs: { arity: -1, min: 0 } },
            ev: [true, true],
            func: (IMAG: MultiArray, DOM?: MultiArray): NodeExpr => {
                insertOutput.type = 'histogram';
                if (IMAG.dimension[0] !== 1) {
                    IMAG = LinearAlgebra.transpose(IMAG);
                }
                if (DOM && DOM.dimension[0] !== 1) {
                    DOM = LinearAlgebra.transpose(DOM);
                }
                plotData.MaxY = 0;
                plotData.MinY = 0;
                plotData.X = [];
                plotData.data = [];
                const imagRow = IMAG.array[0]!;
                const domainRow = DOM?.array[0];
                for (let i = 0; i < (IMAG.dimension[1] ?? 0); i++) {
                    if (DOM) {
                        const domainValue = domainRow?.[i];
                        if (isComplexValue(domainValue)) {
                            plotData.X[i] = domainValue.re.toNumber();
                        } else if (isStringPlotValue(domainValue)) {
                            plotData.X[i] = domainValue.str;
                        }
                    } else {
                        plotData.X[i] = i;
                    }
                    const value = imagRow[i];
                    if (isComplexValue(value) && isFinite(value.re.toNumber()) && isFinite(value.im.toNumber()) && value.im.eq(0)) {
                        plotData.data[i] = value.re.toNumber();
                    } else {
                        throw new Error('non real number in histogram y axis');
                    }
                    plotData.MaxY = Math.max(plotData.MaxY, plotData.data[i]!);
                    plotData.MinY = Math.min(plotData.MinY, plotData.data[i]!);
                }
                output?.({
                    type: 'histogram',
                    data: [{ x: [...plotData.X], y: [...plotData.data], type: 'bar' }],
                    layout: { autosize: true },
                    config: defaultPlotConfig,
                });
                return AST.nodeIndexExpr(AST.nodeIdentifier('histogram'), AST.nodeList(DOM ? [IMAG, DOM] : [IMAG]));
            },
        },
    };
};
