/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as assert from 'assert';
import * as os from 'os';

import { lsif } from './lsifs';
import * as ts from 'typescript';
import { Element } from 'lsif-protocol';

suite('Module System Tests', () => {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES5,
		rootDir: '/@test'
	};
	test('Single export', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export const x: number | string = 10;',
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":11,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:","unique":"group","kind":"export"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:x","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Namespace export', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export namespace N { export const a: number = 10; }',
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:N","unique":"group","kind":"export"}'),
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:N.a","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Default export', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'function foo() { }',
					'export default foo;'
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":15,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"z9tFVl5qLcmtAWiHkDMgtg==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":17,"type":"edge","label":"moniker","outV":15,"inV":16}'),
			JSON.parse('{"id":22,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":23,"type":"edge","label":"next","outV":22,"inV":15}'),
			JSON.parse('{"id":24,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":25,"type":"edge","label":"moniker","outV":22,"inV":24}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export = foo', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'function foo() { }',
					'export = foo;'
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":15,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"z9tFVl5qLcmtAWiHkDMgtg==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":17,"type":"edge","label":"moniker","outV":15,"inV":16}'),
			JSON.parse('{"id":22,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":23,"type":"edge","label":"next","outV":22,"inV":15}'),
			JSON.parse('{"id":24,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":25,"type":"edge","label":"moniker","outV":22,"inV":24}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { foo }', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'function foo() { }',
					'export { foo };'
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":15,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"z9tFVl5qLcmtAWiHkDMgtg==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":17,"type":"edge","label":"moniker","outV":15,"inV":16}'),
			JSON.parse('{"id":22,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":23,"type":"edge","label":"next","outV":22,"inV":15}'),
			JSON.parse('{"id":24,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":25,"type":"edge","label":"moniker","outV":22,"inV":24}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { _foo as foo }', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'function _foo() { }',
					'export { _foo as foo };'
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":15,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"170NjUeOL6mfW3aDVml2Ig==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":17,"type":"edge","label":"moniker","outV":15,"inV":16}'),
			JSON.parse('{"id":22,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":23,"type":"edge","label":"next","outV":22,"inV":15}'),
			JSON.parse('{"id":24,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":25,"type":"edge","label":"moniker","outV":22,"inV":24}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { foo } with children', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'namespace foo { export const x = 10; }',
					'export { foo };'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 65);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"VLZrX43VmC8pcNLmu3MJDA==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"W+GcqeTBebr7ph8ZDmst6w==","unique":"document","kind":"local"}'),
			// This needs its own result set since we have a different hover.
			JSON.parse('{"id":29,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":30,"type":"edge","label":"next","outV":29,"inV":15}'),
			JSON.parse('{"id":31,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":32,"type":"edge","label":"moniker","outV":29,"inV":31}'),
			// JSON.parse('{"id":35,"type":"vertex","label":"hoverResult","result":{"contents":[{"language":"typescript","value":"(alias) namespace foo\\nexport foo"}]}}'),
			JSON.parse('{"id":36,"type":"edge","label":"textDocument/hover","outV":29,"inV":35}'),
			JSON.parse('{"id":37,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo.x","unique":"group","kind":"export"}'),
			JSON.parse('{"id":38,"type":"edge","label":"attach","outV":37,"inV":23}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { RAL } with multiple declarations', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'interface RAL { readonly y: number; }',
					'namespace RAL { export const x = 10; }',
					'function RAL() { }',
					'export default RAL;'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 86);
		const validate: Element[] = [
			JSON.parse('{"id":48,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.x","unique":"group","kind":"export"}'),
			JSON.parse('{"id":49,"type":"edge","label":"attach","outV":48,"inV":34}'),
			JSON.parse('{"id":50,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.y","unique":"group","kind":"export"}'),
			JSON.parse('{"id":51,"type":"edge","label":"attach","outV":50,"inV":27}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { RAL } with nested declarations', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'interface RAL { readonly console: { warn(message?: any, ...optionalParams: any[]): void; } }',
					'export default RAL;'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 114);
		const validate: Element[] = [
			JSON.parse('{"id":57,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL","unique":"group","kind":"export"}'),
			JSON.parse('{"id":63,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.console","unique":"group","kind":"export"}'),
			JSON.parse('{"id":64,"type":"edge","label":"attach","outV":63,"inV":23}'),
			JSON.parse('{"id":65,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.console.warn","unique":"group","kind":"export"}'),
			JSON.parse('{"id":66,"type":"edge","label":"attach","outV":65,"inV":30}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { RAL } with nested public declarations', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export interface MyConsole { warn(message?: any, ...optionalParams: any[]): void; }',
					'interface RAL { readonly console: MyConsole }',
					'export default RAL;'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 120);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:MyConsole","unique":"group","kind":"export"}'),
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:MyConsole.warn","unique":"group","kind":"export"}'),
			JSON.parse('{"id":61,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL","unique":"group","kind":"export"}'),
			JSON.parse('{"id":67,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.console","unique":"group","kind":"export"}'),
			JSON.parse('{"id":68,"type":"edge","label":"attach","outV":67,"inV":51}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { RAL } aliased interface type', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'interface _Buffer { end(); }',
					'namespace RAL { export type Buffer = _Buffer; }',
					'export default RAL;'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 96);
		const validate: Element[] = [
			JSON.parse('{"id":47,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL","unique":"group","kind":"export"}'),
			JSON.parse('{"id":53,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.Buffer","unique":"group","kind":"export"}'),
			JSON.parse('{"id":54,"type":"edge","label":"attach","outV":53,"inV":37}'),
			JSON.parse('{"id":55,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:RAL.Buffer.end","unique":"group","kind":"export"}'),
			JSON.parse('{"id":56,"type":"edge","label":"attach","outV":55,"inV":23}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export { foo } with import', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'function foo() { }',
					'export { foo };'
				].join(os.EOL)
			],
			[
				'/@test/b.ts',
				[
					'import { foo } from "./a";',
					'foo();'
				].join(os.EOL)
			]
		]), compilerOptions);
		const validate: Element[] = [
			JSON.parse('{"id":15,"type":"vertex","label":"resultSet"}'),
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"z9tFVl5qLcmtAWiHkDMgtg==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":39,"type":"vertex","label":"referenceResult"}'),
			JSON.parse('{"id":40,"type":"edge","label":"textDocument/references","outV":15,"inV":39}'),
			JSON.parse('{"id":60,"type":"vertex","label":"range","start":{"line":0,"character":9},"end":{"line":0,"character":12},"tag":{"type":"definition","text":"foo","kind":7,"fullRange":{"start":{"line":0,"character":9},"end":{"line":0,"character":12}}}}'),
			JSON.parse('{"id":66,"type":"vertex","label":"range","start":{"line":1,"character":0},"end":{"line":1,"character":3},"tag":{"type":"reference","text":"foo"}}'),
			JSON.parse('{"id":74,"type":"edge","label":"item","outV":39,"inVs":[60,66],"shard":49,"property":"references"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export variable declaration', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export let foo: { touch: boolean };'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 60);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":34,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo.touch","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export variable declaration with inferred type', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export const foo = { touch: true };'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 62);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":34,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo.touch","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export inferred function return type', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export function foo() { return { touch: true }; }'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 64);
		const validate: Element[] = [
			JSON.parse('{"id":16,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo","unique":"group","kind":"export"}'),
			JSON.parse('{"id":30,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"6R7I4yKdXikhIJtj2BY+gg==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":34,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:foo.touch","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export inferred method return type', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export class Foo { public bar() { return { touch: true }; } }'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 77);
		const validate: Element[] = [
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar","unique":"group","kind":"export"}'),
			JSON.parse('{"id":41,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar.touch","unique":"group","kind":"export"}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export composite return type', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'export interface Foo { bar(): { toString(): string } | { toString(): number }; }'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 104);
		const validate: Element[] = [
			JSON.parse('{"id":53,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar.0L","unique":"group","kind":"export"}'),
			JSON.parse('{"id":54,"type":"edge","label":"attach","outV":53,"inV":37}'),
			JSON.parse('{"id":55,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar.0L.toString","unique":"group","kind":"export"}'),
			JSON.parse('{"id":56,"type":"edge","label":"attach","outV":55,"inV":30}'),
			JSON.parse('{"id":57,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar.1L","unique":"group","kind":"export"}'),
			JSON.parse('{"id":58,"type":"edge","label":"attach","outV":57,"inV":49}'),
			JSON.parse('{"id":59,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Foo.bar.1L.toString","unique":"group","kind":"export"}'),
			JSON.parse('{"id":60,"type":"edge","label":"attach","outV":59,"inV":42}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export type via property', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'interface Foo { touch: boolean; }',
					'export class Bar { foo: Foo; }'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 85);
		const validate: Element[] = [
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"zUtsZKiLRbrRa59l3vSYWw==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":45,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Bar.foo.touch","unique":"group","kind":"export"}'),
			JSON.parse('{"id":46,"type":"edge","label":"attach","outV":45,"inV":23}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
	test('Export type via property signature', () => {
		const emitter = lsif('/@test', new Map([
			[
				'/@test/a.ts',
				[
					'interface Foo { touch: boolean; }',
					'export interface Bar { foo: Foo; }'
				].join(os.EOL)
			]
		]), compilerOptions);
		assert.deepEqual(emitter.lastId, 85);
		const validate: Element[] = [
			JSON.parse('{"id":23,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"zUtsZKiLRbrRa59l3vSYWw==","unique":"document","kind":"local"}'),
			JSON.parse('{"id":45,"type":"vertex","label":"moniker","scheme":"tsc","identifier":"a:Bar.foo.touch","unique":"group","kind":"export"}'),
			JSON.parse('{"id":46,"type":"edge","label":"attach","outV":45,"inV":23}')
		];
		for (const elem of validate) {
			assert.deepEqual(emitter.elements.get(elem.id), elem);
		}
	});
});