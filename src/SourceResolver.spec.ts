/// <reference types="jest" />
import { ManifestSourceResolver, TableSourceResolver } from './SourceResolver';

describe('SourceResolver', () => {
    describe('TableSourceResolver', () => {
        it('Should resolve legacy source tables and providers by kind.', () => {
            const resolver = TableSourceResolver.create({
                functionSourceTable: {
                    'pkg.f': 'function y = f(x), y = x + 1; end',
                    '+pkg/pathfun.m': 'function y = pathfun(x), y = x + 2; end',
                    'ordinary/pathfun.m': 'function y = pathfun(x), y = x + 3; end',
                },
                scriptSourceProvider: (name) => (name === 'runme' ? { source: 'x = 1;' } : undefined),
                classSourceProvider: (name) => (name === 'pkg.Box' ? 'classdef Box, end' : undefined),
            });

            expect(resolver.resolve('function', 'pkg.f')?.name).toBe('pkg.f');
            expect(resolver.resolve('function', 'pkg.pathfun')?.source).toContain('pathfun');
            expect(resolver.resolve('function', 'pkg.pathfun')?.name).toBe('pkg.pathfun');
            expect(resolver.resolve('function', 'pathfun')?.name).toBe('pathfun');
            expect(resolver.resolve('script', 'runme.m')?.name).toBe('runme');
            expect(resolver.resolve('class', 'pkg.Box')?.name).toBe('pkg.Box');
            expect(resolver.resolve('function', 'missing')).toBeUndefined();
        });

        it('Should normalize table and provider names from browser path forms.', () => {
            const providerCalls: string[] = [];
            const resolver = TableSourceResolver.create({
                functionSourceProvider: (name) => {
                    providerCalls.push(name);
                    return name === 'pkg.lazy' ? { source: 'function y = lazy(x), y = x; end' } : undefined;
                },
                classSourceTable: {
                    '+pkg/@Widget/Widget.m': 'classdef Widget, end',
                    '+pkg/@Widget/resize.m': 'function resize(obj), end',
                    'ordinary/@PlainWidget/PlainWidget.m': 'classdef PlainWidget, end',
                    'ordinary/@PlainWidget/resize.m': 'function resize(obj), end',
                },
                scriptSourceTable: {
                    'folder/startup.m': 'x = 1;',
                },
            });

            expect(resolver.resolve('function', '+pkg/lazy.m')?.name).toBe('pkg.lazy');
            expect(providerCalls).toEqual(['+pkg/lazy.m', 'pkg.lazy']);
            expect(resolver.resolve('class', 'pkg.Widget')?.source).toContain('classdef');
            expect(resolver.resolve('class', 'pkg.Widget')?.name).toBe('pkg.Widget');
            expect(resolver.resolve('class', 'pkg.Widget.resize')?.source).toContain('resize');
            expect(resolver.resolve('class', 'pkg.Widget.resize')?.name).toBe('pkg.Widget.resize');
            expect(resolver.resolve('class', 'PlainWidget')?.source).toContain('classdef');
            expect(resolver.resolve('class', 'PlainWidget')?.name).toBe('PlainWidget');
            expect(resolver.resolve('class', 'PlainWidget.resize')?.source).toContain('resize');
            expect(resolver.resolve('class', 'PlainWidget.resize')?.name).toBe('PlainWidget.resize');
            expect(resolver.resolve('script', 'folder/startup.m')?.name).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'startup')?.name).toBe('folder/startup.m');
        });
    });

    describe('ManifestSourceResolver', () => {
        it('Should index preloaded tables using canonical and script names.', () => {
            const resolver = ManifestSourceResolver.fromTable({
                '+pkg/fromtable.m': 'function y = fromtable(x), y = x; end',
                '+pkg/@FromClass/FromClass.m': 'classdef FromClass, end',
                'ordinary/plainfromtable.m': 'function y = plainfromtable(x), y = x; end',
                'ordinary/@PlainFromClass/PlainFromClass.m': 'classdef PlainFromClass, end',
                'folder/startup.m': 'x = 1;',
            });

            expect(resolver.resolve('function', 'pkg.fromtable')?.source).toContain('fromtable');
            expect(resolver.resolve('class', 'pkg.fromtable')?.source).toContain('fromtable');
            expect(resolver.resolve('class', 'pkg.FromClass')?.source).toContain('classdef');
            expect(resolver.resolve('function', 'plainfromtable')?.source).toContain('plainfromtable');
            expect(resolver.resolve('class', 'PlainFromClass')?.source).toContain('PlainFromClass');
            expect(resolver.resolve('script', 'startup')?.source).toBe('x = 1;');
            expect(resolver.resolve('script', 'folder/startup.m')?.source).toBe('x = 1;');
        });

        it('Should prefetch manifest files and resolve package names.', async () => {
            const responses: Record<string, string> = {
                '/m-files/+pkg/addone.m': 'function y = addone(x), y = x + 1; end',
                '/m-files/+pkg/@Box/Box.m': 'classdef Box, end',
                '/m-files/+pkg/@Box/read.m': 'function y = read(obj), y = 1; end',
                '/m-files/lib/plainadd.m': 'function y = plainadd(x), y = x + 2; end',
                '/m-files/lib/@PlainBox/PlainBox.m': 'classdef PlainBox, end',
                '/m-files/startup.m': 'x = 1;',
            };
            const fetcher = jest.fn(async (url: string) => ({
                ok: true,
                text: async () => responses[url],
            }));

            const resolver = await ManifestSourceResolver.fromManifest(
                {
                    baseUrl: '/m-files',
                    files: [
                        { path: '+pkg/addone.m', kind: 'function' },
                        { path: '+pkg/@Box/Box.m', kind: 'class' },
                        { path: '+pkg/@Box/read.m', kind: 'class' },
                        { path: 'lib/plainadd.m', kind: 'function' },
                        { path: 'lib/@PlainBox/PlainBox.m', kind: 'class' },
                        { path: 'startup.m', kind: 'script' },
                    ],
                },
                fetcher,
            );

            expect(fetcher).toHaveBeenCalledWith('/m-files/+pkg/addone.m');
            expect(resolver.resolve('function', 'pkg.addone')?.source).toContain('addone');
            expect(resolver.resolve('function', '+pkg/addone.m')?.name).toBe('pkg.addone');
            expect(resolver.resolve('class', 'pkg.Box')?.source).toContain('classdef');
            expect(resolver.resolve('class', '+pkg/@Box/Box.m')?.name).toBe('pkg.Box');
            expect(resolver.resolve('class', 'pkg.Box.read')?.source).toContain('read');
            expect(resolver.resolve('class', '+pkg/@Box/read.m')?.name).toBe('pkg.Box.read');
            expect(resolver.resolve('function', 'plainadd')?.source).toContain('plainadd');
            expect(resolver.resolve('class', 'PlainBox')?.source).toContain('PlainBox');
            expect(resolver.resolve('script', 'startup.m')?.name).toBe('startup');
            expect(resolver.resolve('script', 'startup')?.name).toBe('startup');
        });

        it('Should report failed manifest fetches.', async () => {
            await expect(
                ManifestSourceResolver.fromManifest({ files: ['missing.m'] }, async () => ({
                    ok: false,
                    status: 404,
                    statusText: 'Not Found',
                    text: async () => '',
                })),
            ).rejects.toThrow('failed to fetch missing.m: 404 Not Found');
        });
    });
});
