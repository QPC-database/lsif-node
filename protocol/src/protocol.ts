/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as lsp from 'vscode-languageserver-protocol';

namespace Is {
	export function boolean(value: any): value is boolean {
		return value === true || value === false;
	}

	export function string(value: any): value is string {
		return typeof value === 'string' || value instanceof String;
	}

	export function isStringArray(value: any): value is string[] {
		if (!Array.isArray(value)) {
			return false;
		}
		const candidate: string[] = value;
		for (const str of candidate) {
			if (!string(str)) {
				return false;
			}
		}
		return true;
	}

	export function number(value: any): value is number {
		return typeof value === 'number' || value instanceof Number;
	}

	export function symbolKind(value: any): value is lsp.SymbolKind {
		return typeof value === 'number' || value instanceof Number;
	}
}

interface Validator<T> {
	(value: T | undefined | null): boolean;
}

enum PropertyFlags {
	none = 0,
	optional = 1,
	undefined = 2,
	null = 4
}

namespace PropertyFlags {
	export function isOptional(value: PropertyFlags): boolean {
		return (value & PropertyFlags.optional) !== 0;
	}
	export function isUndefined(value: PropertyFlags): boolean {
		return (value & PropertyFlags.undefined) !== 0;
	}
	export function isNull(value: PropertyFlags): boolean {
		return (value & PropertyFlags.null) !== 0;
	}
}

class Property<T> {
	protected readonly validator: Validator<T>;
	public readonly flags: PropertyFlags;

	constructor(validator: Validator<T>, flags: PropertyFlags = PropertyFlags.none) {
		this.validator = validator;
		this.flags = flags;
	}
	public validate(value: T | undefined | null): boolean {
		if (PropertyFlags.isUndefined(this.flags) && value === undefined) {
			return true;
		}
		if (PropertyFlags.isNull(this.flags) && value === null) {
			return true;
		}
		return this.validator(value);
	}
}

class BooleanProperty extends Property<boolean> {
	constructor(flags: PropertyFlags = PropertyFlags.none) {
		super(Is.boolean, flags);
	}
}

class StringProperty extends Property<string> {
	constructor(flags: PropertyFlags = PropertyFlags.none) {
		super(Is.string, flags);
	}
}

class UriProperty extends StringProperty {
	constructor(flags: PropertyFlags = PropertyFlags.none) {
		super(flags);
	}
}

class ArrayProperty<T> extends Property<T[]> {
	constructor(validator: Validator<T>, flags: PropertyFlags = PropertyFlags.none) {
		super(value => {
			if (!Array.isArray(value)) {
				return false;
			}
			for (const item of value) {
				if (!validator(item)) {
					return false;
				}
			}
			return true;
		}, flags);
	}
}

class StringArrayProperty extends Property<string[]> {
	constructor(flags: PropertyFlags = PropertyFlags.none) {
		super(Is.isStringArray, flags);
	}
}

interface StringEnum {
	[key: string]: string;
}

namespace StringEnum {
	export function values(enumeration: StringEnum): Set<string | undefined | null> {
		const result: Set<string> = new Set();
		for (const item in enumeration) {
			result.add(enumeration[item]);
		}
		return result;
	}
}

class StringEnumProperty extends Property<string> {
	constructor(values: Set<string | undefined | null>, flags: PropertyFlags = PropertyFlags.none) {
		super(value => values.has(value), flags);
	}
}

type NotUndefined<T> = T extends undefined ? never : T;

type ObjectDescription<T extends Object> = {
	[P in keyof T]-?: Property<NotUndefined<T[P]>>;
}

interface Indexable {
	[key: string]: Property<any>;
}

class ObjectDescriptor<T extends Object> {
	public readonly description: ObjectDescription<T>
	constructor(description: ObjectDescription<T>) {
		this.description = description;
	}

	public validate(value: T | undefined | null): boolean {
		if (value === undefined || value === null) {
			return false;
		}
		const properties = Object.keys(this.description);
		for (const propertyName of properties) {
			const property = (this.description as Indexable)[propertyName];
			if (PropertyFlags.isOptional(property.flags) && !value.hasOwnProperty(propertyName)) {
				continue;
			}
			if (!property.validate((value as any)[propertyName])) {
				return false;
			}
		}
		return true;
	}
}

/**
 * Defines an unsigned integer in the range of 0 to 2^31 - 1.
 */
export type uinteger = number;

export namespace uinteger {
	export const MIN_VALUE = 0;
	export const MAX_VALUE = 2147483647;
	export function is(value: any): value is uinteger {
		return value !== undefined && value !== null && Number.isInteger(value) && value >= 0 && value <= 2147483647;
	}
}

/**
 * An `Id` to identify a vertex or an edge.
 */
export type Id = uinteger | string;

export namespace Id {
	class _Property extends Property<uinteger | string> {
		constructor(flags: PropertyFlags = PropertyFlags.none) {
			super(Id.is, flags);
		}
	}
	export function property(flags: PropertyFlags = PropertyFlags.none): Property<uinteger | string> {
		return new _Property(flags);
	}
	export function is(value: any): value is Id {
		return Is.string(value) || uinteger.is(value);
	}
}

export enum ElementTypes {
	vertex = 'vertex',
	edge = 'edge'
}

export namespace ElementTypes {
	const values = StringEnum.values(ElementTypes as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is ElementTypes {
		return values.has(value);
	}
}

/**
 * An element in the graph.
 */
export interface Element {
	id: Id;
	type: ElementTypes;
}

export namespace Element {
	export const descriptor = new ObjectDescriptor<Element>({
		id: Id.property(),
		type: ElementTypes.property()
	});
	export function is(value: any): value is Element {
		return descriptor.validate(value);
	}
}

/**
 * All know vertices label values.
 */
export enum VertexLabels {
	metaData = 'metaData',
	event = '$event',
	project = 'project',
	group = 'group',
	range = 'range',
	location = 'location',
	document = 'document',
	moniker = 'moniker',
	packageInformation = 'packageInformation',
	resultSet = 'resultSet',
	documentSymbolResult = 'documentSymbolResult',
	foldingRangeResult = 'foldingRangeResult',
	documentLinkResult = 'documentLinkResult',
	diagnosticResult = 'diagnosticResult',
	declarationResult = 'declarationResult',
	definitionResult = 'definitionResult',
	typeDefinitionResult = 'typeDefinitionResult',
	hoverResult = 'hoverResult',
	referenceResult = 'referenceResult',
	implementationResult = 'implementationResult'
}

export namespace VertexLabels {
	const values = StringEnum.values(VertexLabels as unknown as StringEnum);
	export function property(flags?: PropertyFlags): StringEnumProperty;
	export function property(value: VertexLabels, flags?: PropertyFlags): Property<VertexLabels>;
	export function property(valueOrFlags?: VertexLabels | PropertyFlags, flags?: PropertyFlags): StringEnumProperty | Property<VertexLabels> {
		if (typeof valueOrFlags === 'string') {
			return new Property<VertexLabels>(value => value === valueOrFlags, flags);
		}
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is VertexLabels {
		return values.has(value);
	}
}

/**
 * Uris are currently stored as strings.
 */
export type Uri = string;

namespace Uri {
	export function property(flags: PropertyFlags = PropertyFlags.none): StringProperty {
		return new StringProperty(flags);
	}
	export function is (value: any): value is Uri {
		return Is.string(value);
	}
}

export interface V extends Element {
	type: ElementTypes.vertex;
	label: VertexLabels;
}

class VertexDescriptor<T extends V> extends ObjectDescriptor<T> {
	constructor(description: ObjectDescription<T>) {
		super(description);
	}
}

export namespace V {
	export const descriptor = new VertexDescriptor<Required<V>>(Object.assign({}, Element.descriptor.description, {
		type: new Property<ElementTypes.vertex>(value => value === ElementTypes.vertex),
		label: VertexLabels.property()
	}));
	export function is(value: any): value is V {
		return descriptor.validate(value);
	}
}

/**
 * The event kinds
 */
export enum EventKind {
	begin = 'begin',
	end = 'end'
}

export namespace EventKind {
	const values = StringEnum.values(EventKind as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is EventKind {
		return values.has(value);
	}
}

/**
 * The event scopes
 */
export enum EventScope {
	group = 'group',
	project = 'project',
	document = 'document',
	monikerAttach = 'monikerAttach'
}

export namespace EventScope {
	const values = StringEnum.values(EventScope as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is EventScope {
		return values.has(value);
	}
}

export interface Event extends V {
	label: VertexLabels.event;

	/**
	 * The event scope.
	 */
	scope: EventScope;

	/**
	 * The event kind.
	 */
	kind: EventKind;

	/**
	 * The id of the vertex the event is issued for.
	 */
	data: Id;
}

export namespace Event {
	export const descriptor = new VertexDescriptor<Required<Event>>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.event),
		scope: EventScope.property(),
		kind: EventKind.property(),
		data: Id.property()
	}));
	export function is(value: any): value is Event {
		return descriptor.validate(value);
	}
}

export interface GroupEvent extends Event {
	scope: EventScope.group;
}


export namespace GroupEvent {
	export const descriptor = new VertexDescriptor<Required<GroupEvent>>(Object.assign({}, Event.descriptor.description, {
		scope: new Property(value => value === EventScope.group),
	}));
	export function is(value: any): value is GroupEvent {
		return descriptor.validate(value);
	}
}

export interface ProjectEvent extends Event {
	scope: EventScope.project;
}

export namespace ProjectEvent {
	export const descriptor = new VertexDescriptor<Required<ProjectEvent>>(Object.assign({}, Event.descriptor.description, {
		scope: new Property(value => value === EventScope.project),
	}));
	export function is(value: any): value is ProjectEvent {
		return descriptor.validate(value);
	}
}

export interface DocumentEvent extends Event {
	scope: EventScope.document;
}

export namespace DocumentEvent {
	export const descriptor = new VertexDescriptor<Required<DocumentEvent>>(Object.assign({}, Event.descriptor.description, {
		scope: new Property(value => value === EventScope.document),
	}));
	export function is(value: any): value is DocumentEvent {
		return descriptor.validate(value);
	}
}

export interface MonikerAttachEvent extends Event {
	scope: EventScope.monikerAttach;
}

export namespace MonikerAttachEvent {
	export const descriptor = new VertexDescriptor<Required<MonikerAttachEvent>>(Object.assign({}, Event.descriptor.description, {
		scope: new Property(value => value === EventScope.monikerAttach),
	}));
	export function is(value: any): value is MonikerAttachEvent {
		return descriptor.validate(value);
	}
}

/**
 * A result set acts as a hub to share n LSP request results
 * between different ranges.
 */
export interface ResultSet extends V {
	label: VertexLabels.resultSet;
}

export namespace ResultSet {
	export const descriptor = new VertexDescriptor<Required<ResultSet>>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.resultSet)
	}));
	export function is(value: any): value is ResultSet {
		return descriptor.validate(value);
	}
}

/**
 * All know range tag literal types.
 */
export enum RangeTagTypes {
	declaration = 'declaration',
	definition = 'definition',
	reference = 'reference',
	unknown = 'unknown'
}

export namespace RangeTagTypes {
	const values = StringEnum.values(RangeTagTypes as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is RangeTagTypes {
		return values.has(value);
	}
}

/**
 * The range represents a declaration.
 */
export interface DeclarationTag {

	/**
	 * A type identifier for the declaration tag.
	 */
	type: RangeTagTypes.declaration;

	/**
	 * The text covered by the range.
	 */
	text: string;

	/**
	 * The symbol kind.
	 */
	kind: lsp.SymbolKind;

	/**
	 * Indicates if this symbol is deprecated.
	 */
	deprecated?: boolean;

	/**
	 * The full range of the declaration not including leading/trailing whitespace but everything else, e.g comments and code.
	 * The range must be included in fullRange.
	 */
	fullRange: lsp.Range;

	/**
	 * Optional detail information for the declaration.
	 */
	detail?: string;
}

export namespace DeclarationTag {
	export const descriptor = new ObjectDescriptor<Required<DeclarationTag>>({
		type: new Property(value => value === RangeTagTypes.declaration),
		text: new StringProperty(),
		kind: new Property(Is.symbolKind),
		deprecated: new BooleanProperty(PropertyFlags.optional),
		fullRange: new Property(lsp.Range.is),
		detail: new StringProperty(PropertyFlags.optional)
	});
	export function is(value: any): value is DeclarationTag {
		return descriptor.validate(value);
	}
}

/**
 * The range represents a definition
 */
export interface DefinitionTag {
	/**
	 * A type identifier for the declaration tag.
	 */
	type: RangeTagTypes.definition;

	/**
	 * The text covered by the range
	 */
	text: string;

	/**
	 * The symbol kind.
	 */
	kind: lsp.SymbolKind;

	/**
	 * Indicates if this symbol is deprecated.
	 */
	deprecated?: boolean;

	/**
	 * The full range of the definition not including leading/trailing whitespace but everything else, e.g comments and code.
	 * The range must be included in fullRange.
	 */
	fullRange: lsp.Range;

	/**
	 * Optional detail information for the definition.
	 */
	detail?: string;
}

export namespace DefinitionTag {
	export const descriptor = new ObjectDescriptor<Required<DefinitionTag>>({
		type: new Property(value => value === RangeTagTypes.definition),
		text: new StringProperty(),
		kind: new Property(Is.symbolKind),
		deprecated: new BooleanProperty(PropertyFlags.optional),
		fullRange: new Property(lsp.Range.is),
		detail: new StringProperty(PropertyFlags.optional)
	});
	export function is(value: any): value is DefinitionTag {
		return descriptor.validate(value);
	}
}

/**
 * The range represents a reference.
 */
export interface ReferenceTag {

	/**
	 * A type identifier for the reference tag.
	 */
	type: RangeTagTypes.reference;

	/**
	 * The text covered by the range.
	 */
	text: string;
}

export namespace ReferenceTag {
	export const descriptor = new ObjectDescriptor<Required<ReferenceTag>>({
		type: new Property(value => value === RangeTagTypes.reference),
		text: new StringProperty()
	});
	export function is(value: any): value is ReferenceTag {
		return descriptor.validate(value);
	}
}

/**
 * The type of the range is unknown.
 */
export interface UnknownTag {

	/**
	 * A type identifier for the unknown tag.
	 */
	type: RangeTagTypes.unknown;

	/**
	 * The text covered by the range.
	 */
	text: string;
}

export namespace UnknownTag {
	export const descriptor = new ObjectDescriptor<Required<UnknownTag>>({
		type: new Property(value => value === RangeTagTypes.unknown),
		text: new StringProperty()
	});
	export function is(value: any): value is UnknownTag {
		return descriptor.validate(value);
	}
}

/**
 * All available range tag types.
 */
export type RangeTag = DefinitionTag | DeclarationTag | ReferenceTag | UnknownTag;

export namespace RangeTag {
	export function property(flags: PropertyFlags = PropertyFlags.none): Property<RangeTag> {
		return new Property<RangeTag>(RangeTag.is, flags);
	}
	export function is(value: any): value is RangeTag {
		const candidate = value as RangeTag;
		if (!RangeTagTypes.is(candidate.type)) {
			return false;
		}
		switch (candidate.type) {
			case RangeTagTypes.definition:
				return DefinitionTag.is(value);
			case RangeTagTypes.declaration:
				return DeclarationTag.is(value);
			case RangeTagTypes.reference:
				return ReferenceTag.is(value);
			case RangeTagTypes.unknown:
				return UnknownTag.is(value);
		}
	}
}

/**
 * A vertex representing a range inside a document.
 */
export interface Range extends V, lsp.Range {

	label: VertexLabels.range;

	/**
	 * Some optional meta data for the range.
	 */
	tag?: RangeTag;
}

export namespace Range {
	export const descriptor = new VertexDescriptor<Required<Range>>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.range),
		tag: RangeTag.property(PropertyFlags.optional),
		start: new Property(lsp.Position.is),
		end: new Property(lsp.Position.is)
	}));
	export function is(value: any): value is Range {
		return descriptor.validate(value);
	}
}

/**
 * The id type of the range is a normal id.
 */
export type RangeId = Id;

/**
 * A range representing a definition.
 */
export interface DefinitionRange extends Range {
	/**
	 * The definition meta data.
	 */
	tag: DefinitionTag;
}

export namespace DefinitionRange {
	export const descriptor = new VertexDescriptor<Required<DefinitionRange>>(Object.assign({}, Range.descriptor.description, {
		tag: new Property(DefinitionTag.is)
	}));
	export function is(value: any): value is DefinitionRange {
		return descriptor.validate(value);
	}
}

/**
 * A range representing a declaration.
 */
export interface DeclarationRange extends Range {
	/**
	 * The declaration meta data.
	 */
	tag: DeclarationTag;
}

export namespace DeclarationRange {
	export const descriptor = new VertexDescriptor<Required<DeclarationRange>>(Object.assign({}, Range.descriptor.description, {
		tag: new Property(DeclarationRange.is)
	}));
	export function is(value: any): value is DeclarationRange {
		return descriptor.validate(value);
	}
}

/**
 * A range representing a reference.
 */
export interface ReferenceRange extends Range {
	/**
	 * The reference meta data.
	 */
	tag: ReferenceTag;
}

export namespace ReferenceRange {
	export const descriptor = new VertexDescriptor<Required<ReferenceRange>>(Object.assign({}, Range.descriptor.description, {
		tag: new Property(ReferenceRange.is)
	}));
	export function is(value: any): value is ReferenceRange {
		return descriptor.validate(value);
	}
}

/**
 * A location emittable in LSIF. It has no uri since
 * like ranges locations should be connected to a document
 * using a `contains`edge.
 */
export interface Location extends V {
	/**
	 * The label property.
	 */
	label: VertexLabels.location;

	/**
	 * The location's range
	 */
	range: lsp.Range;
}

export namespace Location {
	export const descriptor = new VertexDescriptor<Required<Location>>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.location),
		range: new Property<lsp.Range>(value => lsp.Range.is(value))
	}));
	export function is(value: any): value is Location {
		return descriptor.validate(value);
	}
}

export interface ToolInfo {
	name: string;
	version?: string;
	args?: string[];
}

export namespace ToolInfo {
	export const descriptor = new ObjectDescriptor<Required<ToolInfo>>({
		name: new StringProperty(),
		version: new StringProperty(PropertyFlags.optional),
		args: new StringArrayProperty(PropertyFlags.optional)
	});
	export function property(flags: PropertyFlags = PropertyFlags.none): Property<ToolInfo> {
		return new Property<ToolInfo>(ToolInfo.is, flags);
	}
	export function is(value: any): value is ToolInfo {
		return descriptor.validate(value);
	}
}

export interface ToolState {
	/**
	 * A data field that can be used to store a key identifying the dump.
	 * The length of the string is limited to 512 characters. So usually
	 * tools should use some sort of hashing algorithm to compute that
	 * value.
	 */
	data?: string;
}

export namespace ToolState {
	export const descriptor = new ObjectDescriptor<Required<ToolState>>({
		data: new StringProperty(PropertyFlags.optional)
	});
	export function property(flags: PropertyFlags = PropertyFlags.none): Property<ToolState> {
		return new Property<ToolState>(ToolState.is, flags);
	}
	export function is(value: any): value is ToolState {
		return descriptor.validate(value);
	}
}

/**
 * The meta data vertex.
 */
export interface MetaData extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.metaData;

	/**
	 * The version of the LSIF format using semver notation. See https://semver.org/
	 */
	version: string;

	/**
	 * The string encoding used to compute line and character values in
	 * positions and ranges. Currently only 'utf-16' is support due to the
	 * limitations in LSP.
	 */
	positionEncoding: 'utf-16'

	/**
	 * Information about the tool that created the dump
	 */
	toolInfo?: ToolInfo;

	/**
	 * Additional information a tool can store to identify some
	 * state with the created dump
	 */
	 toolState?: ToolState;
}

export namespace MetaData {
	export const descriptor = new VertexDescriptor<MetaData>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.metaData),
		version: new StringProperty(),
		positionEncoding: new Property<string>(value => value === 'utf-16'),
		toolInfo: ToolInfo.property(PropertyFlags.optional),
		toolState: ToolState.property(PropertyFlags.optional)
	}));
}

export interface RepositoryInfo {
	/**
	 * The repository type. For example GIT
	 */
	type: string;

	/**
	 * The URL to the repository
	 */
	url: string;

	/**
	 * A commitId if available.
	 */
	commitId?: string;
}

export namespace RepositoryInfo {
	export const descriptor = new ObjectDescriptor<RepositoryInfo>({
		type: new StringProperty(),
		url: new StringProperty(),
		commitId: new StringProperty(PropertyFlags.optional)
	});
	export function is(value: any): value is RepositoryInfo {
		return descriptor.validate(value);
	}
	export function property(flags: PropertyFlags = PropertyFlags.none): Property<RepositoryInfo> {
		return new Property<RepositoryInfo>(RepositoryInfo.is, flags);
	}
}

export interface Group extends V {
	/**
	 * The label property.
	 */
	label: VertexLabels.group;

	/**
	 * The group uri
	 */
	uri: Uri;

	/**
	 * Groups are usually shared between project dumps. This property indicates how a DB should
	 * handle group information coming from different project dumps. In case of a conflict (the group
	 * already exists in a DB) the values' meaning are:
	 *
	 * - `takeDump`: information of the group should overwrite information in a DB.
	 * - `takeDB`: information of the group is ignored. The DB values stay as is.
	 */
	conflictResolution: 'takeDump' | 'takeDB';

	/**
	 * The group name
	 */
	name: string;

	/**
	 * The group root folder uri
	 */
	rootUri: Uri;

	/**
	 * The group description
	 */
	description?: string;

	/**
	 * Optional information about the repository containing the source of the package.
	 */
	repository?: RepositoryInfo;
}

export namespace Group {
	export const descriptor = new VertexDescriptor<Group>(Object.assign({}, V.descriptor.description, {
		label:VertexLabels.property(VertexLabels.group),
		uri: new StringProperty(),
		conflictResolution: new Property<'takeDump' | 'takeDB'>(value => value === 'takeDump' || value === 'takeDB'),
		name: new StringProperty(),
		rootUri: new UriProperty(),
		description: new StringProperty(),
		repository: RepositoryInfo.property(PropertyFlags.optional)
	}));
	export function is(value: any): value is Group {
		return descriptor.validate(value);
	}
}

/**
 * A project vertex.
 */
export interface Project extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.project;

	/**
	 * The project kind like 'typescript' or 'csharp'. See also the language ids
	 * in the [specification](https://microsoft.github.io/language-server-protocol/specification)
	 */
	kind: string;

	/**
	 * The project name
	 */
	name: string;

	/**
	 * The resource URI of the project file.
	 */
	resource?: Uri;

	/**
	 * Optional the content of the project file, `base64` encoded.
	 */
	contents?: string;
}

export namespace Project {
	export const descriptor = new VertexDescriptor<Project>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.project),
		kind: new StringProperty(),
		name: new StringProperty(),
		resource: new UriProperty(PropertyFlags.optional),
		contents: new StringProperty(PropertyFlags.optional)
	}));
	export function is(value: any): value is Project {
		return descriptor.validate(value);
	}
}

export type DocumentId = Id;

/**
 * A vertex representing a document in the project
 */
export interface Document extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.document;

	/**
	 * The Uri of the document.
	 */
	uri: Uri;

	/**
	 * The document's language Id as defined in the LSP
	 * (https://microsoft.github.io/language-server-protocol/specification)
	 */
	languageId: string;

	/**
	 * Optional the content of the document, `based64` encoded
	 */
	contents?: string;
}

export namespace Document {
	export const descriptor = new VertexDescriptor<Document>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.document),
		uri: new StringProperty(),
		languageId: new StringProperty(),
		contents: new StringProperty(PropertyFlags.optional)
	}));
	export function is(value: any): value is Document {
		return descriptor.validate(value);
	}
}

/**
 * The moniker kind.
 */
export enum MonikerKind {
	/**
	 * The moniker represent a symbol that is imported into a project
	 */
	import = 'import',

	/**
	 * The moniker represents a symbol that is exported from a project
	 */
	export = 'export',

	/**
	 * The moniker represents a symbol that is local to a project (e.g. a local
	 * variable of a function, a class not visible outside the project, ...)
	 */
	local = 'local'
}

export namespace MonikerKind {
	const values = StringEnum.values(MonikerKind as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is MonikerKind {
		return values.has(value);
	}
}

export enum UniquenessLevel {
	/**
	 * The moniker is only unique inside a document
	 */
	document = 'document',

	/**
	 * The moniker is unique inside a project for which a dump got created
	 */
	project = 'project',

	/**
	 * The moniker is unique inside the group to which a project belongs
	 */
	group = 'group',

	/**
	 * The moniker is unique inside the moniker scheme.
	 */
	scheme = 'scheme',

	/**
	 * The moniker is globally unique
	 */
	global = 'global'
}

export namespace UniquenessLevel {
	const values = StringEnum.values(UniquenessLevel as unknown as StringEnum);
	export function property(flags: PropertyFlags = PropertyFlags.none): StringEnumProperty {
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is UniquenessLevel {
		return values.has(value);
	}
}

export interface Moniker extends V {

	label: VertexLabels.moniker;

	/**
	 * The scheme of the moniker. For example tsc or .Net
	 */
	scheme: string;

	/**
	 * The identifier of the moniker. The value is opaque in LSIF however
	 * schema owners are allowed to define the structure if they want.
	 */
	identifier: string;

	/**
	 * The scope in which the moniker is unique
	 */
	unique: UniquenessLevel;

	/**
	 * The moniker kind if known.
	 */
	kind?: MonikerKind;
}

export namespace Moniker {
	export const descriptor = new VertexDescriptor<Moniker>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.moniker),
		scheme: new StringProperty(),
		identifier: new StringProperty(),
		unique: UniquenessLevel.property(),
		kind: MonikerKind.property(PropertyFlags.optional)
	}));
	export function is(value: any): value is Moniker {
		return descriptor.validate(value);
	}
}

export interface PackageInformation extends V {

	label: VertexLabels.packageInformation;

	/**
	 * The package name
	 */
	name: string;

	/**
	 * The package manager
	 */
	manager: string;

	/**
	 * A uri pointing to the location of the file describing the package.
	 */
	uri?: Uri;

	/**
	 * Optional the content of the document, `based64` encoded
	 */
	contents?: string;

	/**
	 * The package version if available
	 */
	version?: string;

	/**
	 * Optional information about the repository containing the source of the package.
	 */
	repository?: RepositoryInfo
}

export namespace PackageInformation {
	export const descriptor = new VertexDescriptor<PackageInformation>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.packageInformation),
		name: new StringProperty(),
		manager: new StringProperty(),
		uri: new UriProperty(PropertyFlags.optional),
		contents: new StringProperty(PropertyFlags.optional),
		version: new StringProperty(PropertyFlags.optional),
		repository: RepositoryInfo.property(PropertyFlags.optional)
	}));
	export function is(value: any): value is PackageInformation {
		return descriptor.validate(value);
	}
}

/**
 * A range based document symbol. This allows to reuse already
 * emitted ranges with a `declaration` tag in a document symbol
 * result.
 */
export interface RangeBasedDocumentSymbol {
	/**
	 * The range to reference.
	 */
	id: RangeId

	/**
	 * The child symbols.
	 */
	children?: RangeBasedDocumentSymbol[];
}

export namespace RangeBasedDocumentSymbol {
	export const descriptor = new ObjectDescriptor<RangeBasedDocumentSymbol>({
		id: Id.property(),
		children: new Property<RangeBasedDocumentSymbol[]>(value => {
			if (!Array.isArray(value)) {
				return false;
			}
			for (const element of value) {
				if (!RangeBasedDocumentSymbol.is(element)) {
					return false;
				}
			}
			return true;
		}, PropertyFlags.optional)
	});
	export function is(value: any): value is RangeBasedDocumentSymbol {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing the document symbol result.
 */
export interface DocumentSymbolResult extends V {

	label: VertexLabels.documentSymbolResult;

	result: lsp.DocumentSymbol[] | RangeBasedDocumentSymbol[];
}

export namespace DocumentSymbolResult {
	export const descriptor = new VertexDescriptor<DocumentSymbolResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.documentSymbolResult),
		result: new Property<lsp.DocumentSymbol[] | RangeBasedDocumentSymbol[]>(value => {
			if (!Array.isArray(value)) {
				return false;
			}
			if (value.length === 0) {
				return true;
			}
			const first = value[0];
			const validator = (first as RangeBasedDocumentSymbol).id !== undefined
				? RangeBasedDocumentSymbol.is
				: lsp.DocumentSymbol.is;
			for (const item of value) {
				if (!validator(item)) {
					return false;
				}
			}
			return true;
		})
	}));
	export function is(value: any): value is DocumentSymbolResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a diagnostic result.
 */
export interface DiagnosticResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.diagnosticResult;

	/**
	 * The diagnostics.
	 */
	result: lsp.Diagnostic[];
}

export namespace DiagnosticResult {
	export const descriptor = new VertexDescriptor<DiagnosticResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.diagnosticResult),
		result: new ArrayProperty(lsp.Diagnostic.is)
	}));
	export function is(value: any): value is DiagnosticResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a folding range result.
 */
export interface FoldingRangeResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.foldingRangeResult;

	/**
	 * The actual folding ranges.
	 */
	result: lsp.FoldingRange[];
}

export namespace FoldingRangeResult {
	export const descriptor = new VertexDescriptor<FoldingRangeResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.foldingRangeResult),
		result: new ArrayProperty(lsp.FoldingRange.is)
	}));
	export function is(value: any): value is FoldingRangeResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a document link result.
 */
export interface DocumentLinkResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.documentLinkResult;

	/**
	 * The actual document links.
	 */
	result: lsp.DocumentLink[];
}

export namespace DocumentLinkResult {
	export const descriptor = new VertexDescriptor<DocumentLinkResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.documentLinkResult),
		result: new ArrayProperty(lsp.DocumentLink.is)
	}));
	export function is(value: any): value is DocumentLinkResult {
		return descriptor.validate(value);
	}
}

export interface DeclarationResult extends V {
	/**
	 * The label property.
	 */
	label: VertexLabels.declarationResult;
}

export namespace DeclarationResult {
	export const descriptor = new VertexDescriptor<DeclarationResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.declarationResult)
	}));
	export function is(value: any): value is DeclarationResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a definition result.
 */
export interface DefinitionResult extends V {
	/**
	 * The label property.
	 */
	label: VertexLabels.definitionResult;
}

export namespace DefinitionResult {
	export const descriptor = new VertexDescriptor<DefinitionResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.definitionResult)
	}));
	export function is(value: any): value is DefinitionResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a type definition result.
 */
export interface TypeDefinitionResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.typeDefinitionResult;
}

export namespace TypeDefinitionResult {
	export const descriptor = new VertexDescriptor<TypeDefinitionResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.typeDefinitionResult)
	}));
	export function is(value: any): value is TypeDefinitionResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a reference result.
 */
export interface ReferenceResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.referenceResult;
}

export namespace ReferenceResult {
	export const descriptor = new VertexDescriptor<ReferenceResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.referenceResult)
	}));
	export function is(value: any): value is ReferenceResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing an implementation result.
 */
export interface ImplementationResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.implementationResult;
}

export namespace ImplementationResult {
	export const descriptor = new VertexDescriptor<ImplementationResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.implementationResult)
	}));
	export function is(value: any): value is ImplementationResult {
		return descriptor.validate(value);
	}
}

/**
 * A vertex representing a Hover.
 *
 * Extends the `Hover` type defined in LSP.
 */
export interface HoverResult extends V {

	/**
	 * The label property.
	 */
	label: VertexLabels.hoverResult;

	/**
	 * The hover result. This is the normal LSP hover result.
	 */
	result: lsp.Hover;
}

export namespace HoverResult {
	export const descriptor = new VertexDescriptor<HoverResult>(Object.assign({}, V.descriptor.description, {
		label: VertexLabels.property(VertexLabels.hoverResult),
		result: new Property<lsp.Hover>(lsp.Hover.is)
	}));
	export function is(value: any): value is HoverResult {
		return descriptor.validate(value);
	}
}

/**
 * All available vertex types
 */
export type Vertex =
	MetaData |
	Event |
	Project |
	Group |
	Document |
	Moniker |
	PackageInformation |
	ResultSet |
	Range |
	DocumentSymbolResult |
	FoldingRangeResult |
	DocumentLinkResult |
	DiagnosticResult |
	DefinitionResult |
	DeclarationResult |
	TypeDefinitionResult |
	HoverResult |
	ReferenceResult |
	ImplementationResult;

export enum EdgeLabels {
	contains = 'contains',
	item = 'item',
	next = 'next',
	moniker = 'moniker',
	attach = 'attach',
	packageInformation = 'packageInformation',
	belongsTo = 'belongsTo',
	textDocument_documentSymbol = 'textDocument/documentSymbol',
	textDocument_foldingRange = 'textDocument/foldingRange',
	textDocument_documentLink = 'textDocument/documentLink',
	textDocument_diagnostic = 'textDocument/diagnostic',
	textDocument_definition = 'textDocument/definition',
	textDocument_declaration = 'textDocument/declaration',
	textDocument_typeDefinition = 'textDocument/typeDefinition',
	textDocument_hover = 'textDocument/hover',
	textDocument_references = 'textDocument/references',
	textDocument_implementation = 'textDocument/implementation',
}

export namespace EdgeLabels {
	const values = StringEnum.values(EdgeLabels as unknown as StringEnum);
	export function property(flags?: PropertyFlags): StringEnumProperty;
	export function property(value: EdgeLabels, flags?: PropertyFlags): Property<EdgeLabels>;
	export function property(valueOrFlags?: EdgeLabels | PropertyFlags, flags?: PropertyFlags): StringEnumProperty | Property<EdgeLabels> {
		if (typeof valueOrFlags === 'string') {
			return new Property<EdgeLabels>(value => value === valueOrFlags, flags);
		}
		return new StringEnumProperty(values, flags);
	}
	export function is(value: any): value is EdgeLabels {
		return values.has(value);
	}
}

class Edge11Descriptor<T, O extends V = V, I extends V = V> extends ObjectDescriptor<T> {
	public readonly outDescriptor: ObjectDescriptor<O>;
	public readonly inDescriptor: ObjectDescriptor<I>;
	constructor(description: ObjectDescription<T>, outDescriptor: ObjectDescriptor<O>, inDescriptor: ObjectDescriptor<I>) {
		super(description);
		this.outDescriptor = outDescriptor;
		this.inDescriptor = inDescriptor;
	}
}

/**
 * A common base type of all edge types. The type parameters `S` and `T` are for typing and
 * documentation purpose only. An edge never holds a direct reference to a vertex. They are
 * referenced by `Id`.
 */
export interface E11<S extends V, T extends V, K extends EdgeLabels> extends Element {
	/* The brand.  This is only necessary to make make type instantiation differ from each other. */
	_?: [S, T];
	id: Id;
	type: ElementTypes.edge;
	label: K;

	/**
	 * The id of the from Vertex.
	 */
	outV: Id;

	/**
	 * The id of the to Vertex.
	 */
	inV: Id;
}

class BrandProperty extends Property<any> {
	public constructor() {
		super(() => true, PropertyFlags.optional);
	}
}

export namespace E11 {
	export const descriptor = new Edge11Descriptor<E11<V, V, EdgeLabels>>({
		_: new BrandProperty(),
		id: Id.property(),
		type: new Property<ElementTypes.edge>(value => value === ElementTypes.edge),
		label: EdgeLabels.property(),
		outV: Id.property(),
		inV: Id.property()
	}, V.descriptor, V.descriptor);
}

export interface E1N<S extends V, T extends V, K extends EdgeLabels> extends Element {
	/* The brand.  This is only necessary to make make type instantiation differ from each other. */
	_?: [S, T];
	id: Id;
	type: ElementTypes.edge;
	label: K;

	/**
	 * The id of the from vertex.
	 */
	outV: Id;

	/**
	 * The ids of the to vertices.
	 */
	inVs: Id[];
}

export type E<S extends V, T extends V, K extends EdgeLabels> = E11<S, T, K> | E1N<S, T, K>;

export enum ItemEdgeProperties {
	declarations = 'declarations',
	definitions = 'definitions',
	references =  'references',
	referenceResults = 'referenceResults',
	referenceLinks = 'referenceLinks',
	implementationResults = 'implementationResults',
	implementationLinks = 'implementationLinks'
}

export interface ItemEdge<S extends V, T extends V> extends E1N<S, T, EdgeLabels.item> {
	shard: Id;
	property?: ItemEdgeProperties;
}

/**
 * An edge expressing containment relationship. The relationship exist between:
 *
 * - `Project` -> `Document`
 * - `Document` -> `Range`
 */
export type contains = E1N<Project, Document, EdgeLabels.contains> | E1N<Document, Range, EdgeLabels.contains>;

/**
 * An edge associating a range with a result set or a result set with another result set. The relationship exists between:
 *
 * - `Range` -> `ResultSet`
 * - `ResultSet` -> `ResultSet`
 */
export type next = E11<Range, ResultSet, EdgeLabels.next> | E11<ResultSet, ResultSet, EdgeLabels.next>;

/**
 * An edge representing a item in a result set. The relationship exists between:
 *
 * - `ReferenceResult` -> `Range[]`
 * - `ReferenceResult` -> `ReferenceResult[]`
 */
export type item =
	ItemEdge<DeclarationResult, Range> | ItemEdge<DefinitionResult, Range> |
	ItemEdge<TypeDefinitionResult, Range> |
	ItemEdge<ReferenceResult, Range> | ItemEdge<ReferenceResult, ReferenceResult> | ItemEdge<ReferenceResult, Moniker> |
	ItemEdge<ImplementationResult, Range> | ItemEdge<ImplementationResult, ImplementationResult> | ItemEdge<ImplementationResult, Moniker>;

/**
 * An edge associating a range with a moniker. The relationship exists between:
 *
 * - `Range` -> `Moniker`
 * - `ResultSet` -> `Moniker`
 * - `DeclarationResult` -> `Moniker`
 * - `DefinitionResult` -> `Moniker`
 * - `TypeDefinitionResult` -> `Moniker`
 * - `ReferenceResult` -> `Moniker`
 * - `ImplementationResult` -> `Moniker`
 */
export type moniker =
	E11<Range, Moniker, EdgeLabels.moniker> |
	E11<ResultSet, Moniker, EdgeLabels.moniker> |
	E11<DeclarationResult, Moniker, EdgeLabels.moniker> |
	E11<DefinitionResult, Moniker, EdgeLabels.moniker> |
	E11<TypeDefinitionResult, Moniker, EdgeLabels.moniker> |
	E11<ReferenceResult, Moniker, EdgeLabels.moniker> |
	E11<ImplementationResult, Moniker, EdgeLabels.moniker>;

/**
 * An edge associating a moniker with another moniker. The relationship exists between:
 *
 * - `Moniker` -> `Moniker`
 */
export type attach = E11<Moniker, Moniker, EdgeLabels.attach>;

export namespace attach {
	export const descriptor = new Edge11Descriptor<attach, Moniker, Moniker>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.attach)
	}), Moniker.descriptor, Moniker.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge associating a moniker with a package information. The relationship exists between:
 *
 * - `Moniker` -> `PackageInformation`
 */
export type packageInformation = E11<Moniker, PackageInformation, EdgeLabels.packageInformation>;

export namespace packageInformation {
	export const descriptor = new Edge11Descriptor<packageInformation, Moniker, PackageInformation>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.packageInformation)
	}), Moniker.descriptor, PackageInformation.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge associating a project with a group. The relationship exists between:
 *
 * -  `Project` -> `Group`
 */
export type belongsTo = E11<Project, Group, EdgeLabels.belongsTo>;

export namespace belongsTo {
	export const descriptor = new Edge11Descriptor<belongsTo, Project, Group>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.belongsTo)
	}), Project.descriptor, Group.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge representing a `textDocument/documentSymbol` relationship. The relationship exists between:
 *
 * - `Document` -> `DocumentSymbolResult`
 */
export type textDocument_documentSymbol = E11<Document, DocumentSymbolResult, EdgeLabels.textDocument_documentSymbol>;

export namespace textDocument_documentSymbol {
	export const descriptor = new Edge11Descriptor<textDocument_documentSymbol, Document, DocumentSymbolResult>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.textDocument_documentSymbol)
	}), Document.descriptor, DocumentSymbolResult.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge representing a `textDocument/foldingRange` relationship. The relationship exists between:
 *
 * - `Document` -> `FoldingRangeResult`
 */
export type textDocument_foldingRange = E11<Document, FoldingRangeResult, EdgeLabels.textDocument_foldingRange>;

export namespace textDocument_foldingRange {
	export const descriptor = new Edge11Descriptor<textDocument_foldingRange, Document, FoldingRangeResult>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.textDocument_foldingRange)
	}), Document.descriptor, FoldingRangeResult.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge representing a `textDocument/documentLink` relationship. The relationship exists between:
 *
 * - `Document` -> `DocumentLinkResult`
 */
export type textDocument_documentLink = E11<Document, DocumentLinkResult, EdgeLabels.textDocument_documentLink>;

export namespace textDocument_documentLink {
	export const descriptor = new Edge11Descriptor<textDocument_documentLink, Document, DocumentLinkResult>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.textDocument_documentLink)
	}), Document.descriptor, DocumentLinkResult.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge representing a `textDocument/diagnostic` relationship. The relationship exists between:
 *
 * - `Project` -> `DiagnosticResult`
 * - `Document` -> `DiagnosticResult`
 */
export type textDocument_diagnostic = E11<Project, DiagnosticResult, EdgeLabels.textDocument_diagnostic> | E11<Document, DiagnosticResult, EdgeLabels.textDocument_diagnostic>;

export namespace textDocument_diagnostic {
	export const descriptor = new Edge11Descriptor<textDocument_diagnostic, Document, DiagnosticResult>(Object.assign({}, E11.descriptor.description, {
		label: EdgeLabels.property(EdgeLabels.textDocument_diagnostic)
	}), Document.descriptor, DiagnosticResult.descriptor);
	export function is(value: any): value is attach {
		return descriptor.validate(value);
	}
}

/**
 * An edge representing a declaration relationship. The relationship exists between:
 *
 * - `Range` -> `DefinitionResult`
 * - `ResultSet` -> `DefinitionResult`
 */
export type textDocument_declaration = E11<Range, DeclarationResult, EdgeLabels.textDocument_declaration> | E11<ResultSet, DeclarationResult, EdgeLabels.textDocument_declaration>;

/**
 * An edge representing a definition relationship. The relationship exists between:
 *
 * - `Range` -> `DefinitionResult`
 * - `ResultSet` -> `DefinitionResult`
 */
export type textDocument_definition = E11<Range, DefinitionResult, EdgeLabels.textDocument_definition> | E11<ResultSet, DefinitionResult, EdgeLabels.textDocument_definition>;

/**
 * An edge representing a type definition relations ship. The relationship exists between:
 *
 * - `Range` -> `TypeDefinitionResult`
 * - `ResultSet` -> `TypeDefinitionResult`
 */
export type textDocument_typeDefinition = E11<Range, TypeDefinitionResult, EdgeLabels.textDocument_typeDefinition> | E11<ResultSet, TypeDefinitionResult, EdgeLabels.textDocument_typeDefinition>;

/**
 * An edge representing a hover relationship. The relationship exists between:
 *
 * - `Range` -> `HoverResult`
 * - `ResultSet` -> `HoverResult`
 */
export type textDocument_hover = E11<Range, HoverResult, EdgeLabels.textDocument_hover> | E11<ResultSet, HoverResult, EdgeLabels.textDocument_hover>;

/**
 * An edge representing a references relationship. The relationship exists between:
 *
 * - `Range` -> `ReferenceResult`
 * - `ResultSet` -> `ReferenceResult`
 */
export type textDocument_references = E11<Range, ReferenceResult, EdgeLabels.textDocument_references> | E11<ResultSet, ReferenceResult, EdgeLabels.textDocument_references>;

/**
 * An edge representing a implementation relationship. The relationship exists between:
 *
 * - `Range` -> `ImplementationResult`
 * - `ResultSet` -> `ImplementationResult`
 */
export type textDocument_implementation = E11<Range, ImplementationResult, EdgeLabels.textDocument_implementation> | E11<ResultSet, ImplementationResult, EdgeLabels.textDocument_implementation>;

/**
 *
 * All available Edge types.
 */
export type Edge =
	contains |
	item |
	next |
	moniker |
	attach |
	packageInformation |
	belongsTo |
	textDocument_documentSymbol |
	textDocument_foldingRange |
	textDocument_documentLink |
	textDocument_diagnostic |
	textDocument_declaration |
	textDocument_definition |
	textDocument_typeDefinition |
	textDocument_hover |
	textDocument_references |
	textDocument_implementation;

export namespace Edge {
	export function is11(edge: Edge): edge is (Edge & { inV: Id }) {
		let candidate = edge as E11<any, any, any>;
		return candidate && candidate.inV !== undefined;
	}

	export function is1N(edge: Edge): edge is (Edge & {inVs: Id[]}) {
		let candidate = edge as E1N<any, any, any>;
		return candidate && Array.isArray(candidate.inVs);

	}
}