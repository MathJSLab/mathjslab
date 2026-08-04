/// <reference types="jest" />
import { ManifestSourceResolver, TableSourceResolver } from './SourceResolver';

describe('SourceResolver', () => {
    describe('TableSourceResolver', () => {
        it('Should resolve legacy source tables and providers by kind.', () => {
            const resolver = TableSourceResolver.create({
                functionSourceTable: {
                    'pkg.f': 'function y = f(x), y = x + 1; end',
                    '+pkg/pathfun.m': 'function y = pathfun(x), y = x + 2; end',
                    explicit: { sourceName: 'virtual/explicit.m', source: 'function y = explicit(x), y = x; end' },
                    namedAlias: { name: 'pkg.namedalias', sourceName: 'cache/function-001.m', source: 'function y = namedalias(x), y = x; end' },
                    nestedsourcefile: { sourceName: '+pkg/nestedsourcefile.m', source: 'function y = nestedsourcefile(x), y = x; end' },
                    urlFunction: { sourceName: 'https://host.test/m-files/+pkg/urlfunction.m?raw=1#section', source: 'function y = urlfunction(x), y = x; end' },
                    'ordinary/pathfun.m': 'function y = pathfun(x), y = x + 3; end',
                },
                scriptSourceProvider: (name) => (name === 'runme' ? { source: 'x = 1;' } : undefined),
                classSourceProvider: (name) => (name === 'pkg.Box' ? 'classdef Box, end' : undefined),
            });

            expect(resolver.resolve('function', 'pkg.f')?.name).toBe('pkg.f');
            expect(resolver.resolve('function', 'pkg.pathfun')?.source).toContain('pathfun');
            expect(resolver.resolve('function', 'pkg.pathfun')?.name).toBe('pkg.pathfun');
            expect(resolver.resolve('function', 'pkg.pathfun')?.sourceName).toBe('+pkg/pathfun.m');
            expect(resolver.resolve('function', 'pathfun')?.name).toBe('pathfun');
            expect(resolver.resolve('function', 'pathfun')?.sourceName).toBe('ordinary/pathfun.m');
            expect(resolver.resolve('function', 'explicit')?.sourceName).toBe('virtual/explicit.m');
            expect(resolver.resolve('function', 'pkg.namedalias')?.name).toBe('pkg.namedalias');
            expect(resolver.resolve('function', 'pkg.namedalias')?.sourceName).toBe('cache/function-001.m');
            expect(resolver.resolve('function', 'pkg.nestedsourcefile')?.name).toBe('pkg.nestedsourcefile');
            expect(resolver.resolve('function', 'pkg.nestedsourcefile')?.sourceName).toBe('+pkg/nestedsourcefile.m');
            expect(resolver.resolve('function', 'pkg.urlfunction')?.name).toBe('pkg.urlfunction');
            expect(resolver.resolve('function', 'pkg.urlfunction')?.sourceName).toBe('https://host.test/m-files/+pkg/urlfunction.m?raw=1#section');
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
                    bundledWidget: { sourceName: '+pkg/@BundledWidget/BundledWidget.m', source: 'classdef BundledWidget, end' },
                    namedWidget: { name: 'pkg.NamedWidget', sourceName: 'cache/NamedWidget.001.m', source: 'classdef NamedWidget, end' },
                    urlWidget: { sourceName: 'https://host.test/classes/+pkg/@UrlWidget/UrlWidget.m?download=1', source: 'classdef UrlWidget, end' },
                    'ordinary/@PlainWidget/PlainWidget.m': 'classdef PlainWidget, end',
                    'ordinary/@PlainWidget/resize.m': 'function resize(obj), end',
                },
                scriptSourceTable: {
                    'folder/startup.m': 'x = 1;',
                    bundledStartup: { sourceName: 'folder/bundledstartup.m', source: 'x = 2;' },
                    namedStartup: { name: 'namedstartup', sourceName: 'cache/namedstartup.001.m', source: 'x = 4;' },
                    urlStartup: { sourceName: 'https://host.test/scripts/urlstartup.m?raw=1#section', source: 'x = 3;' },
                },
            });

            expect(resolver.resolve('function', '+pkg/lazy.m')?.name).toBe('pkg.lazy');
            expect(providerCalls).toEqual(['+pkg/lazy.m', 'pkg.lazy']);
            expect(resolver.resolve('class', 'pkg.Widget')?.source).toContain('classdef');
            expect(resolver.resolve('class', 'pkg.Widget')?.name).toBe('pkg.Widget');
            expect(resolver.resolve('class', 'pkg.Widget.resize')?.source).toContain('resize');
            expect(resolver.resolve('class', 'pkg.Widget.resize')?.name).toBe('pkg.Widget.resize');
            expect(resolver.resolve('class', 'pkg.Widget.resize')?.sourceName).toBe('+pkg/@Widget/resize.m');
            expect(resolver.resolve('class', 'pkg.BundledWidget')?.name).toBe('pkg.BundledWidget');
            expect(resolver.resolve('class', 'pkg.BundledWidget')?.sourceName).toBe('+pkg/@BundledWidget/BundledWidget.m');
            expect(resolver.resolve('class', 'pkg.NamedWidget')?.name).toBe('pkg.NamedWidget');
            expect(resolver.resolve('class', 'pkg.NamedWidget')?.sourceName).toBe('cache/NamedWidget.001.m');
            expect(resolver.resolve('class', 'pkg.UrlWidget')?.name).toBe('pkg.UrlWidget');
            expect(resolver.resolve('class', 'pkg.UrlWidget')?.sourceName).toBe('https://host.test/classes/+pkg/@UrlWidget/UrlWidget.m?download=1');
            expect(resolver.resolve('class', 'PlainWidget')?.source).toContain('classdef');
            expect(resolver.resolve('class', 'PlainWidget')?.name).toBe('PlainWidget');
            expect(resolver.resolve('class', 'PlainWidget.resize')?.source).toContain('resize');
            expect(resolver.resolve('class', 'PlainWidget.resize')?.name).toBe('PlainWidget.resize');
            expect(resolver.resolve('script', 'folder/startup.m')?.name).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'folder/startup.m')?.sourceName).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'startup')?.name).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'startup')?.sourceName).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'bundledstartup')?.name).toBe('folder/bundledstartup.m');
            expect(resolver.resolve('script', 'bundledstartup')?.sourceName).toBe('folder/bundledstartup.m');
            expect(resolver.resolve('script', 'namedstartup')?.name).toBe('namedstartup');
            expect(resolver.resolve('script', 'namedstartup')?.sourceName).toBe('cache/namedstartup.001.m');
            expect(resolver.resolve('script', 'urlstartup')?.name).toBe('https://host.test/scripts/urlstartup.m?raw=1#section');
            expect(resolver.resolve('script', 'urlstartup')?.sourceName).toBe('https://host.test/scripts/urlstartup.m?raw=1#section');
            expect(resolver.hasDirectory('pkg')).toBe(true);
            expect(resolver.hasDirectory('+pkg')).toBe(true);
            expect(resolver.hasDirectory('ordinary')).toBe(true);
            expect(resolver.hasDirectory('folder')).toBe(true);
            expect(resolver.hasDirectory('missing')).toBe(false);
        });
    });

    describe('ManifestSourceResolver', () => {
        it('Should index preloaded tables using canonical and script names.', () => {
            const resolver = ManifestSourceResolver.fromTable({
                '+pkg/fromtable.m': 'function y = fromtable(x), y = x; end',
                bundledFunction: { sourceName: '+pkg/bundledfunction.m', source: 'function y = bundledfunction(x), y = x; end' },
                bundledUrlFunction: { sourceName: 'https://host.test/m-files/+pkg/bundledurlfunction.m?raw=1', source: 'function y = bundledurlfunction(x), y = x; end' },
                functionCacheKey: { name: 'pkg.namedfromtable', sourceName: 'cache/function-001.m', source: 'function y = namedfromtable(x), y = x; end' },
                '+pkg/@FromClass/FromClass.m': 'classdef FromClass, end',
                bundledClass: { sourceName: '+pkg/@BundledClass/BundledClass.m', source: 'classdef BundledClass, end' },
                bundledUrlClass: { sourceName: 'https://host.test/classes/+pkg/@BundledUrlClass/BundledUrlClass.m?raw=1', source: 'classdef BundledUrlClass, end' },
                classCacheKey: { name: 'pkg.NamedFromTable', sourceName: 'cache/NamedFromTable.001.m', source: 'classdef NamedFromTable, end' },
                'ordinary/plainfromtable.m': 'function y = plainfromtable(x), y = x; end',
                'ordinary/@PlainFromClass/PlainFromClass.m': 'classdef PlainFromClass, end',
                'folder/startup.m': 'x = 1;',
                bundledScript: { sourceName: 'scripts/bundledscript.m', source: 'x = 2;' },
                bundledUrlScript: { sourceName: 'https://host.test/scripts/bundledurlscript.m?raw=1', source: 'x = 3;' },
                scriptCacheKey: { name: 'namedfromtablescript', sourceName: 'cache/script-001.m', source: 'x = 4;' },
            });

            expect(resolver.resolve('function', 'pkg.fromtable')?.source).toContain('fromtable');
            expect(resolver.resolve('function', 'pkg.fromtable')?.name).toBe('pkg.fromtable');
            expect(resolver.resolve('function', 'pkg.fromtable')?.sourceName).toBe('+pkg/fromtable.m');
            expect(resolver.resolve('function', '.\\+pkg\\fromtable.m')?.name).toBe('pkg.fromtable');
            expect(resolver.resolve('function', 'pkg.bundledfunction')?.name).toBe('pkg.bundledfunction');
            expect(resolver.resolve('function', 'pkg.bundledfunction')?.sourceName).toBe('+pkg/bundledfunction.m');
            expect(resolver.resolve('function', 'pkg.bundledurlfunction')?.name).toBe('pkg.bundledurlfunction');
            expect(resolver.resolve('function', 'pkg.bundledurlfunction')?.sourceName).toBe('https://host.test/m-files/+pkg/bundledurlfunction.m?raw=1');
            expect(resolver.resolve('function', 'https://mirror.test/alt/+pkg/bundledurlfunction.m#other')?.name).toBe('pkg.bundledurlfunction');
            expect(resolver.resolve('function', 'pkg.namedfromtable')?.name).toBe('pkg.namedfromtable');
            expect(resolver.resolve('function', 'pkg.namedfromtable')?.sourceName).toBe('cache/function-001.m');
            expect(resolver.resolve('class', 'pkg.fromtable')?.source).toContain('fromtable');
            expect(resolver.resolve('class', 'pkg.FromClass')?.source).toContain('classdef');
            expect(resolver.resolve('class', 'pkg.FromClass')?.name).toBe('pkg.FromClass');
            expect(resolver.resolve('class', 'pkg.FromClass')?.sourceName).toBe('+pkg/@FromClass/FromClass.m');
            expect(resolver.resolve('class', './+pkg/@FromClass/FromClass.m?ignored=1')?.name).toBe('pkg.FromClass');
            expect(resolver.resolve('class', 'pkg.BundledClass')?.name).toBe('pkg.BundledClass');
            expect(resolver.resolve('class', 'pkg.BundledClass')?.sourceName).toBe('+pkg/@BundledClass/BundledClass.m');
            expect(resolver.resolve('class', 'pkg.BundledUrlClass')?.name).toBe('pkg.BundledUrlClass');
            expect(resolver.resolve('class', 'pkg.BundledUrlClass')?.sourceName).toBe('https://host.test/classes/+pkg/@BundledUrlClass/BundledUrlClass.m?raw=1');
            expect(resolver.resolve('class', 'https://mirror.test/+pkg/@BundledUrlClass/BundledUrlClass.m#alt')?.name).toBe('pkg.BundledUrlClass');
            expect(resolver.resolve('class', 'pkg.NamedFromTable')?.name).toBe('pkg.NamedFromTable');
            expect(resolver.resolve('class', 'pkg.NamedFromTable')?.sourceName).toBe('cache/NamedFromTable.001.m');
            expect(resolver.resolve('function', 'plainfromtable')?.source).toContain('plainfromtable');
            expect(resolver.resolve('function', 'plainfromtable')?.sourceName).toBe('ordinary/plainfromtable.m');
            expect(resolver.resolve('class', 'PlainFromClass')?.source).toContain('PlainFromClass');
            expect(resolver.resolve('class', 'PlainFromClass')?.sourceName).toBe('ordinary/@PlainFromClass/PlainFromClass.m');
            expect(resolver.resolve('script', 'startup')?.source).toBe('x = 1;');
            expect(resolver.resolve('script', 'startup')?.name).toBe('startup');
            expect(resolver.resolve('script', 'startup')?.sourceName).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'folder/startup.m')?.source).toBe('x = 1;');
            expect(resolver.resolve('script', 'folder/startup.m')?.sourceName).toBe('folder/startup.m');
            expect(resolver.resolve('script', 'bundledscript')?.name).toBe('bundledscript');
            expect(resolver.resolve('script', 'bundledscript')?.sourceName).toBe('scripts/bundledscript.m');
            expect(resolver.resolve('script', 'scripts\\bundledscript.m?ignored=1')?.name).toBe('bundledscript');
            expect(resolver.resolve('script', 'bundledurlscript')?.name).toBe('bundledurlscript');
            expect(resolver.resolve('script', 'bundledurlscript')?.sourceName).toBe('https://host.test/scripts/bundledurlscript.m?raw=1');
            expect(resolver.resolve('script', 'https://mirror.test/scripts/bundledurlscript.m#alt')?.name).toBe('bundledurlscript');
            expect(resolver.resolve('script', 'namedfromtablescript')?.name).toBe('namedfromtablescript');
            expect(resolver.resolve('script', 'namedfromtablescript')?.sourceName).toBe('cache/script-001.m');
            expect(resolver.hasDirectory('pkg')).toBe(true);
            expect(resolver.hasDirectory('ordinary')).toBe(true);
            expect(resolver.hasDirectory('folder')).toBe(true);
            expect(resolver.hasDirectory('scripts')).toBe(true);
            expect(resolver.hasDirectory('https://host.test/m-files/+pkg')).toBe(true);
            expect(resolver.hasDirectory('missing')).toBe(false);
        });

        it('Should prefetch manifest files and resolve package names.', async () => {
            const responses: Record<string, string> = {
                '/m-files/+pkg/addone.m': 'function y = addone(x), y = x + 1; end',
                '/m-files/+pkg/@Box/Box.m': 'classdef Box, end',
                '/m-files/+pkg/@Box/read.m': 'function y = read(obj), y = 1; end',
                '/m-files/lib/plainadd.m': 'function y = plainadd(x), y = x + 2; end',
                '/m-files/lib/@PlainBox/PlainBox.m': 'classdef PlainBox, end',
                '/m-files/startup.m': 'x = 1;',
                'https://cdn.test/m-files/+pkg/urlmanifest.m?raw=1#section': 'function y = urlmanifest(x), y = x + 3; end',
                'https://cdn.test/m-files/scripts/remotestartup.m?raw=1': 'x = 2;',
                '/m-files/bundled/explicit-name.m': 'function y = explicitname(x), y = x + 4; end',
                '/m-files/cache/fetched-function.12345.m': 'function y = fetchedstable(x), y = x + 5; end',
                '/m-files/cache/fetched-script.12345.m': 'x = 5;',
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
                        { path: 'https://cdn.test/m-files/+pkg/urlmanifest.m?raw=1#section', kind: 'function' },
                        { path: 'https://cdn.test/m-files/scripts/remotestartup.m?raw=1', kind: 'script' },
                        { path: 'bundled/explicit-name.m', name: 'pkg.explicitname', kind: 'function' },
                        { path: 'cache/fetched-function.12345.m', sourceName: '+pkg/fetchedstable.m', kind: 'function' },
                        { path: 'cache/fetched-script.12345.m', sourceName: 'scripts/fetchedstable.m', kind: 'script' },
                    ],
                },
                fetcher,
            );

            expect(fetcher).toHaveBeenCalledWith('/m-files/+pkg/addone.m');
            expect(fetcher).toHaveBeenCalledWith('https://cdn.test/m-files/+pkg/urlmanifest.m?raw=1#section');
            expect(resolver.resolve('function', 'pkg.addone')?.source).toContain('addone');
            expect(resolver.resolve('function', '+pkg/addone.m')?.name).toBe('pkg.addone');
            expect(resolver.resolve('function', 'pkg.addone')?.sourceName).toBe('+pkg/addone.m');
            expect(resolver.resolve('function', '.\\+pkg\\addone.m?ignored=1')?.name).toBe('pkg.addone');
            expect(resolver.resolve('function', 'pkg.urlmanifest')?.name).toBe('pkg.urlmanifest');
            expect(resolver.resolve('function', 'pkg.urlmanifest')?.sourceName).toBe('https://cdn.test/m-files/+pkg/urlmanifest.m?raw=1#section');
            expect(resolver.resolve('function', 'https://mirror.test/m-files/+pkg/urlmanifest.m?raw=2')?.name).toBe('pkg.urlmanifest');
            expect(resolver.resolve('function', 'pkg.explicitname')?.sourceName).toBe('bundled/explicit-name.m');
            expect(resolver.resolve('function', 'pkg.fetchedstable')?.name).toBe('pkg.fetchedstable');
            expect(resolver.resolve('function', 'pkg.fetchedstable')?.sourceName).toBe('+pkg/fetchedstable.m');
            expect(resolver.resolve('class', 'pkg.Box')?.source).toContain('classdef');
            expect(resolver.resolve('class', '+pkg/@Box/Box.m')?.name).toBe('pkg.Box');
            expect(resolver.resolve('class', 'https://cdn.test/m-files/+pkg/@Box/Box.m?raw=1')?.name).toBe('pkg.Box');
            expect(resolver.resolve('class', 'pkg.Box.read')?.source).toContain('read');
            expect(resolver.resolve('class', '+pkg/@Box/read.m')?.name).toBe('pkg.Box.read');
            expect(resolver.resolve('function', 'plainadd')?.source).toContain('plainadd');
            expect(resolver.resolve('class', 'PlainBox')?.source).toContain('PlainBox');
            expect(resolver.resolve('script', 'startup.m')?.name).toBe('startup');
            expect(resolver.resolve('script', 'startup')?.name).toBe('startup');
            expect(resolver.resolve('script', 'https://cdn.test/m-files/startup.m?raw=1')?.name).toBe('startup');
            expect(resolver.resolve('script', 'remotestartup')?.name).toBe('remotestartup');
            expect(resolver.resolve('script', 'remotestartup')?.sourceName).toBe('https://cdn.test/m-files/scripts/remotestartup.m?raw=1');
            expect(resolver.resolve('script', 'https://mirror.test/scripts/remotestartup.m#alt')?.name).toBe('remotestartup');
            expect(resolver.resolve('script', 'fetchedstable')?.name).toBe('fetchedstable');
            expect(resolver.resolve('script', 'fetchedstable')?.sourceName).toBe('scripts/fetchedstable.m');
            expect(resolver.hasDirectory('pkg')).toBe(true);
            expect(resolver.hasDirectory('+pkg')).toBe(true);
            expect(resolver.hasDirectory('scripts')).toBe(true);
            expect(resolver.hasDirectory('https://cdn.test/m-files/+pkg')).toBe(true);
            expect(resolver.hasDirectory('missing')).toBe(false);
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
