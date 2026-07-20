import { AST, type ClassAttributeTable, type NodeClassDef, type NodeClassSection, type NodeIdentifier } from './AST';
import type { ClassEnumerationDefinition, ClassEventDefinition, ClassMethodDefinition, ClassPropertyDefinition } from './ClassMember';
import { ClassMember } from './ClassMember';
import type { RuntimeDisplay } from './RuntimeDisplay';

/** Method lookup table keyed by method name. */
type ClassMethodTable = Record<string, ClassMethodDefinition[]>;
/** Property lookup table keyed by property name. */
type ClassPropertyTable = Record<string, ClassPropertyDefinition>;
/** Enumeration lookup table keyed by enumeration member name. */
type ClassEnumerationTable = Record<string, ClassEnumerationDefinition>;
/** Predicate used to filter overloaded method metadata during lookup. */
type ClassMethodPredicate = (method: ClassMethodDefinition) => boolean;
/** Internal representation of an abstract method that still needs an implementation. */
type AbstractMethodEntry = { key: string; method: ClassMethodDefinition };
/** Internal representation of an abstract property that still needs an implementation. */
type AbstractPropertyEntry = { key: string; property: ClassPropertyDefinition };

/**
 * Normalized runtime representation of a parsed MATLAB/Octave `classdef`.
 *
 * The parser keeps the original AST shape. `ClassDefinition` indexes that AST
 * into member tables, inheritance metadata, and attribute-derived flags used by
 * the interpreter when instantiating objects or dispatching methods.
 */
class ClassDefinition {
    /** Runtime type tag used by the interpreter's value predicates. */
    public static readonly CLASS_DEFINITION = 6;
    /** Class-level attributes accepted by MATLAB/Octave classdef metadata. */
    private static readonly classAttributes = new Set([
        'Abstract',
        'AllowedSubclasses',
        'ConstructOnLoad',
        'HandleCompatible',
        'Hidden',
        'InferiorClasses',
        'RestrictsSubclassing',
        'Sealed',
    ]);
    /** Property-section attributes accepted by MATLAB/Octave classdef metadata. */
    private static readonly propertyAttributes = new Set([
        'AbortSet',
        'Abstract',
        'Access',
        'Constant',
        'Dependent',
        'GetAccess',
        'GetMethod',
        'GetObservable',
        'Hidden',
        'NonCopyable',
        'PartialMatchPriority',
        'SetAccess',
        'SetMethod',
        'SetObservable',
        'Transient',
    ]);
    /** Method-section attributes accepted by MATLAB/Octave classdef metadata. */
    private static readonly methodAttributes = new Set(['Abstract', 'Access', 'Hidden', 'Sealed', 'Static']);
    /** Event-section attributes accepted by MATLAB/Octave classdef metadata. */
    private static readonly eventAttributes = new Set(['Hidden', 'ListenAccess', 'NotifyAccess']);
    /** Enumeration-section attributes accepted by MATLAB/Octave classdef metadata. */
    private static readonly enumerationAttributes = new Set(['Hidden']);
    /** Class-level attributes that must be boolean markers when present. */
    private static readonly classBooleanAttributes = new Set(['Abstract', 'ConstructOnLoad', 'HandleCompatible', 'Hidden', 'RestrictsSubclassing', 'Sealed']);
    /** Property-section attributes that must be boolean markers when present. */
    private static readonly propertyBooleanAttributes = new Set(['AbortSet', 'Abstract', 'Constant', 'Dependent', 'GetObservable', 'Hidden', 'NonCopyable', 'SetObservable', 'Transient']);
    /** Method-section attributes that must be boolean markers when present. */
    private static readonly methodBooleanAttributes = new Set(['Abstract', 'Hidden', 'Sealed', 'Static']);
    /** Event-section attributes that must be boolean markers when present. */
    private static readonly eventBooleanAttributes = new Set(['Hidden']);
    /** Enumeration-section attributes that must be boolean markers when present. */
    private static readonly enumerationBooleanAttributes = new Set(['Hidden']);
    /** Built-in MATLAB mixin superclasses recognized without external source. */
    private static readonly builtinSuperclassNames = new Set(['handle', 'matlab.mixin.SetGet', 'matlab.mixin.SetGetExactNames']);
    /**
     * Keep the first item for each key while preserving input order.
     *
     * Effective inherited member lists follow superclass lookup order; later
     * duplicate names should not appear as separate public metadata entries.
     */
    private static readonly firstByKey = <T>(items: T[], keyOf: (item: T) => string): T[] => {
        const seen = new Set<string>();
        return items.filter((item) => {
            const key = keyOf(item);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };
    /** Runtime type tag stored on each class definition instance. */
    public readonly type = ClassDefinition.CLASS_DEFINITION;
    /** Optional AST-style parent pointer used by generic copy/unparse paths. */
    public parent?: unknown;
    /** Class name from the `classdef` header. */
    public readonly name: string;
    /** Package prefix from a qualified class name, or empty for top-level classes. */
    public readonly packageName: string;
    /** Unqualified class name without package prefix. */
    public readonly simpleName: string;
    /** Source AST node that defines the class. */
    public readonly ast: NodeClassDef;
    /** Class-level attribute table. */
    public readonly attributes: ClassAttributeTable;
    /** Whether the class is explicitly or effectively abstract. */
    public readonly isAbstract: boolean;
    /** Whether subclasses are forbidden. */
    public readonly isSealed: boolean;
    /** Whether the class should be hidden from ordinary metadata listings. */
    public readonly isHidden: boolean;
    /** Whether saved instances should reconstruct through load-time hooks. */
    public readonly isConstructOnLoad: boolean;
    /** Whether the class was declared with `HandleCompatible`. */
    public readonly isHandleCompatible: boolean;
    /** Class names declared in the `InferiorClasses` class attribute. */
    public readonly inferiorClasses: string[];
    /** Class names declared in the `AllowedSubclasses` class attribute. */
    public readonly allowedSubclasses: string[];
    /** Whether metadata should report subclassing as restricted. */
    public readonly isRestrictsSubclassing: boolean;
    /** Whether this object represents the built-in `handle` base class. */
    public readonly isBuiltinHandleClass: boolean;
    /** Superclass names from the class header. */
    public readonly superclasses: string[];
    /** Resolved superclass definitions, excluding built-in `handle`. */
    public readonly superclassDefinitions: ClassDefinition[];
    /** Parsed class sections in source order. */
    public readonly sections: NodeClassSection[];
    /** Properties declared directly by this class. */
    public readonly properties: ClassPropertyDefinition[];
    /** Direct-property lookup table. */
    public readonly propertyTable: ClassPropertyTable;
    /** Methods declared directly by this class. */
    public readonly methods: ClassMethodDefinition[];
    /** Static methods declared directly by this class. */
    public readonly staticMethods: ClassMethodDefinition[];
    /** Instance methods declared directly by this class. */
    public readonly instanceMethods: ClassMethodDefinition[];
    /** Direct methods grouped by effective access. */
    public readonly methodsByAccess: Record<string, ClassMethodDefinition[]>;
    /** Direct-method lookup table keyed by method name. */
    public readonly methodTable: ClassMethodTable;
    /** Events declared directly by this class. */
    public readonly events: ClassEventDefinition[];
    /** Enumeration members declared directly by this class. */
    public readonly enumerations: ClassEnumerationDefinition[];
    /** Direct-enumeration lookup table. */
    public readonly enumerationTable: ClassEnumerationTable;

    /**
     * Test whether a value is a runtime class definition.
     *
     * @param obj Value to test.
     * @returns `true` when `obj` is a `ClassDefinition`.
     */
    public static readonly isInstanceOf = (obj: unknown): obj is ClassDefinition => obj instanceof ClassDefinition;

    /**
     * Build runtime class metadata from a parsed classdef AST.
     *
     * Use `ClassDefinition.create` so construction remains centralized.
     *
     * @param ast Parsed classdef node.
     */
    private constructor(ast: NodeClassDef) {
        this.ast = ast;
        this.name = ast.id;
        const packageSeparator = this.name.lastIndexOf('.');
        this.packageName = packageSeparator < 0 ? '' : this.name.slice(0, packageSeparator);
        this.simpleName = packageSeparator < 0 ? this.name : this.name.slice(packageSeparator + 1);
        this.attributes = ast.attributeTable;
        this.isSealed = ClassMember.hasAttribute(this.attributes, 'Sealed');
        this.isHidden = ClassMember.hasAttribute(this.attributes, 'Hidden');
        this.isConstructOnLoad = ClassMember.hasAttribute(this.attributes, 'ConstructOnLoad');
        this.isHandleCompatible = ClassMember.hasAttribute(this.attributes, 'HandleCompatible');
        this.inferiorClasses = ClassMember.classNameListFromAttribute(this.attributes.InferiorClasses?.[0]) ?? [];
        this.allowedSubclasses = ClassMember.classNameListFromAttribute(this.attributes.AllowedSubclasses?.[0]) ?? [];
        this.isRestrictsSubclassing = this.isSealed || this.allowedSubclasses.length > 0 || ClassMember.hasAttribute(this.attributes, 'RestrictsSubclassing');
        this.isBuiltinHandleClass = this.name === 'handle';
        this.superclasses = ast.superclasses.map((node: NodeIdentifier) => node.id);
        this.superclassDefinitions = [];
        this.sections = ast.sections;
        this.properties = [];
        this.propertyTable = {};
        this.methods = [];
        this.staticMethods = [];
        this.instanceMethods = [];
        this.methodsByAccess = {};
        this.methodTable = {};
        this.events = [];
        this.enumerations = [];
        this.enumerationTable = {};
        this.collectMembers();
        this.isAbstract =
            ClassMember.hasAttribute(this.attributes, 'Abstract') || this.properties.some((property) => property.isAbstract) || this.methods.some((method) => method.isAbstract);
    }

    /**
     * Create normalized runtime metadata for a parsed classdef node.
     *
     * @param ast Parsed classdef node.
     * @returns Runtime class definition.
     */
    public static readonly create = (ast: NodeClassDef): ClassDefinition => new ClassDefinition(ast);

    /**
     * Copy a class definition value.
     *
     * Class definitions are immutable metadata objects, so copying preserves the
     * same instance.
     *
     * @param definition Definition to copy.
     * @returns The same definition.
     */
    public static readonly copy = (definition: ClassDefinition): ClassDefinition => definition;

    /**
     * Render the original classdef AST.
     *
     * @param definition Definition to render.
     * @param interpreter Interpreter that owns the unparser.
     * @returns Unparsed classdef text.
     */
    public static readonly unparse = (definition: ClassDefinition, interpreter: RuntimeDisplay): string => interpreter.Unparse(definition.ast);

    /**
     * Copy this class definition.
     *
     * @returns The same immutable metadata object.
     */
    public copy(): ClassDefinition {
        return ClassDefinition.copy(this);
    }

    /**
     * Resolve named superclasses after all known classes have been registered.
     *
     * @param resolve Class lookup callback.
     * @param throwEvalError Interpreter error callback.
     */
    public resolveSuperclasses(resolve: (name: string) => ClassDefinition | undefined, throwEvalError: (message: string) => never): void {
        this.validateSupportedAttributes(throwEvalError);
        this.validateAccessAttributes(throwEvalError);
        this.validateAttributeCombinations(throwEvalError);
        this.validateDuplicateMembers(throwEvalError);
        this.superclassDefinitions.length = 0;
        for (const name of this.superclasses) {
            if (ClassDefinition.builtinSuperclassNames.has(name)) {
                continue;
            }
            if (name === this.name) {
                throwEvalError(`class ${this.name} cannot inherit from itself.`);
            }
            const definition = resolve(name);
            if (!definition) {
                throwEvalError(`superclass '${name}' for class ${this.name} is not defined.`);
            }
            if (definition.isSealed) {
                throwEvalError(`class ${this.name} cannot inherit from sealed class ${definition.name}.`);
            }
            if (definition.allowedSubclasses.length > 0 && !definition.allowedSubclasses.includes(this.name)) {
                throwEvalError(`class ${this.name} cannot inherit from class ${definition.name}: subclass is not listed in AllowedSubclasses.`);
            }
            this.superclassDefinitions.push(definition);
        }
        this.validateInheritanceCycles(throwEvalError);
        this.validatePropertyAccessors(throwEvalError);
        this.validateSealedMethodOverrides(throwEvalError);
    }

    /**
     * Test whether this class inherits from a resolved class definition.
     *
     * @param baseClass Candidate superclass.
     * @returns `true` when `baseClass` is in the inheritance chain.
     */
    public isSubclassOf(baseClass: ClassDefinition): boolean {
        return this.superclassDefinitions.some((superclass) => superclass === baseClass || superclass.isSubclassOf(baseClass));
    }

    /**
     * Test whether this class inherits from a superclass name.
     *
     * @param baseClassName Candidate superclass name.
     * @returns `true` when the name is declared or inherited.
     */
    public isSubclassOfName(baseClassName: string): boolean {
        if (this.superclasses.includes(baseClassName)) {
            return true;
        }
        return this.superclassDefinitions.some((superclass) => superclass.name === baseClassName || superclass.isSubclassOfName(baseClassName));
    }

    /**
     * Test whether instances should have handle-object identity semantics.
     *
     * @returns `true` for `handle` or subclasses of `handle`.
     */
    public isHandleClass(): boolean {
        return (
            this.isBuiltinHandleClass ||
            this.superclasses.includes('handle') ||
            this.superclasses.includes('matlab.mixin.SetGet') ||
            this.superclasses.includes('matlab.mixin.SetGetExactNames') ||
            this.superclassDefinitions.some((superclass) => superclass.isHandleClass())
        );
    }

    /**
     * Test whether the class inherits MATLAB's Set/Get mixin interface.
     *
     * @returns `true` for `matlab.mixin.SetGet`,
     * `matlab.mixin.SetGetExactNames`, or subclasses of either.
     */
    public isSetGetClass(): boolean {
        return (
            this.superclasses.includes('matlab.mixin.SetGet') ||
            this.superclasses.includes('matlab.mixin.SetGetExactNames') ||
            this.superclassDefinitions.some((superclass) => superclass.isSetGetClass())
        );
    }

    /**
     * Test whether Set/Get property names must match exactly.
     *
     * @returns `true` for classes that inherit
     * `matlab.mixin.SetGetExactNames`.
     */
    public isSetGetExactNamesClass(): boolean {
        return this.superclasses.includes('matlab.mixin.SetGetExactNames') || this.superclassDefinitions.some((superclass) => superclass.isSetGetExactNamesClass());
    }

    /**
     * Find a resolved superclass by name.
     *
     * @param name Superclass name to search.
     * @returns Matching superclass definition, if any.
     */
    public findSuperclass(name: string): ClassDefinition | undefined {
        for (const superclass of this.superclassDefinitions) {
            if (superclass.name === name) {
                return superclass;
            }
            const inherited = superclass.findSuperclass(name);
            if (inherited) {
                return inherited;
            }
        }
        return undefined;
    }

    /**
     * Return inherited and direct properties with direct definitions overriding
     * inherited properties of the same name.
     *
     * @returns Effective property list.
     */
    public allProperties(): ClassPropertyDefinition[] {
        const inherited = ClassDefinition.firstByKey(
            this.superclassDefinitions.flatMap((superclass) => superclass.allProperties()),
            (property) => property.name,
        );
        const ownNames = new Set(this.properties.map((property) => property.name));
        return [...inherited.filter((property) => !ownNames.has(property.name)), ...this.properties];
    }

    /**
     * Return inherited and direct methods with direct definitions overriding
     * inherited methods of the same static/instance kind and name.
     *
     * @returns Effective method list.
     */
    public allMethods(): ClassMethodDefinition[] {
        const inherited = ClassDefinition.firstByKey(this.inheritedMethods(), (method) => this.methodOverrideKey(method));
        const ownKeys = new Set(this.methods.map((method) => this.methodOverrideKey(method)));
        return [...inherited.filter((method) => !ownKeys.has(this.methodOverrideKey(method))), ...this.methods];
    }

    /**
     * Return inherited methods in superclass lookup order without removing
     * duplicate override keys.
     *
     * Public metadata lists deduplicate these entries, but validation rules
     * such as sealed-method checks must still inspect every inherited method.
     */
    private inheritedMethods(): ClassMethodDefinition[] {
        return this.superclassDefinitions.flatMap((superclass) => superclass.allMethods());
    }

    /**
     * Return inherited and direct events with direct names overriding inherited
     * events.
     *
     * @returns Effective event list.
     */
    public allEvents(): ClassEventDefinition[] {
        const inherited = ClassDefinition.firstByKey(
            this.superclassDefinitions.flatMap((superclass) => superclass.allEvents()),
            (event) => event.name,
        );
        const ownNames = new Set(this.events.map((event) => event.name));
        return [...inherited.filter((event) => !ownNames.has(event.name)), ...this.events];
    }

    /**
     * Return inherited and direct enumeration members.
     *
     * @returns Effective enumeration list.
     */
    public allEnumerations(): ClassEnumerationDefinition[] {
        const inherited = ClassDefinition.firstByKey(
            this.superclassDefinitions.flatMap((superclass) => superclass.allEnumerations()),
            (enumeration) => enumeration.name,
        );
        const ownNames = new Set(this.enumerations.map((enumeration) => enumeration.name));
        return [...inherited.filter((enumeration) => !ownNames.has(enumeration.name)), ...this.enumerations];
    }

    /**
     * Find a property by name in this class or its superclasses.
     *
     * @param name Property name.
     * @returns Matching property metadata, if any.
     */
    public findProperty(name: string): ClassPropertyDefinition | undefined {
        return (
            this.propertyTable[name] ??
            this.superclassDefinitions.map((superclass) => superclass.findProperty(name)).find((property): property is ClassPropertyDefinition => Boolean(property))
        );
    }

    /**
     * Find a method by name and optional predicate in this class or its
     * superclasses.
     *
     * @param name Method name.
     * @param predicate Additional filter for overload kind/access.
     * @returns Matching method metadata, if any.
     */
    public findMethod(name: string, predicate: ClassMethodPredicate = () => true): ClassMethodDefinition | undefined {
        const ownMethod = this.methodTable[name]?.find(predicate);
        return ownMethod ?? this.superclassDefinitions.map((superclass) => superclass.findMethod(name, predicate)).find((method): method is ClassMethodDefinition => Boolean(method));
    }

    /**
     * Find this class constructor by canonical or unqualified class name.
     *
     * MATLAB package classes declare constructors with the simple class name
     * inside `+pkg/@Class/Class.m`, while the runtime stores the class under
     * the canonical `pkg.Class` name.
     *
     * @returns Instance constructor metadata, if declared.
     */
    public findConstructor(): ClassMethodDefinition | undefined {
        return this.methodTable[this.name]?.find((method) => !method.isStatic) ?? this.methodTable[this.simpleName]?.find((method) => !method.isStatic);
    }

    /**
     * Find an enumeration member by name.
     *
     * @param name Enumeration member name.
     * @returns Matching enumeration metadata, if any.
     */
    public findEnumeration(name: string): ClassEnumerationDefinition | undefined {
        return (
            this.enumerationTable[name] ??
            this.superclassDefinitions.map((superclass) => superclass.findEnumeration(name)).find((enumeration): enumeration is ClassEnumerationDefinition => Boolean(enumeration))
        );
    }

    /**
     * Find an event by name.
     *
     * @param name Event name.
     * @returns Matching event metadata, if any.
     */
    public findEvent(name: string): ClassEventDefinition | undefined {
        return (
            this.events.find((event) => event.name === name) ??
            this.superclassDefinitions.map((superclass) => superclass.findEvent(name)).find((event): event is ClassEventDefinition => Boolean(event))
        );
    }

    /**
     * Collect names of abstract methods that still require implementation.
     *
     * @returns Set of pending abstract method names.
     */
    public abstractMethodNames(): Set<string> {
        return new Set(this.unresolvedAbstractMethods().map((method) => method.name));
    }

    /**
     * Collect names of abstract properties that still require implementation.
     *
     * @returns Set of pending abstract property names.
     */
    public abstractPropertyNames(): Set<string> {
        return new Set(this.unresolvedAbstractProperties().map((property) => property.name));
    }

    /**
     * Resolve abstract methods inherited or declared by this class that have no
     * concrete override.
     *
     * @returns Pending abstract method metadata.
     */
    public unresolvedAbstractMethods(): ClassMethodDefinition[] {
        const pending = new Map<string, ClassMethodDefinition>();
        for (const superclass of this.superclassDefinitions) {
            for (const entry of superclass.unresolvedAbstractMethodEntries()) {
                pending.set(entry.key, entry.method);
            }
        }
        for (const method of this.methods) {
            const key = this.methodOverrideKey(method);
            if (method.isAbstract) {
                pending.set(key, method);
            } else {
                pending.delete(key);
            }
        }
        return [...pending.values()];
    }

    /**
     * Resolve abstract properties inherited or declared by this class that have
     * no concrete property override.
     *
     * @returns Pending abstract property metadata.
     */
    public unresolvedAbstractProperties(): ClassPropertyDefinition[] {
        const pending = new Map<string, ClassPropertyDefinition>();
        for (const superclass of this.superclassDefinitions) {
            for (const entry of superclass.unresolvedAbstractPropertyEntries()) {
                pending.set(entry.key, entry.property);
            }
        }
        for (const property of this.properties) {
            const key = this.propertyOverrideKey(property);
            if (property.isAbstract) {
                pending.set(key, property);
            } else {
                pending.delete(key);
            }
        }
        return [...pending.values()];
    }

    /**
     * Test whether the class cannot be instantiated because of explicit or
     * inherited abstract requirements.
     *
     * @returns `true` when the class is effectively abstract.
     */
    public isEffectivelyAbstract(): boolean {
        return this.isAbstract || this.unresolvedAbstractMethods().length > 0 || this.unresolvedAbstractProperties().length > 0;
    }

    /**
     * Build keyed abstract-method entries for inheritance merging.
     *
     * @returns Abstract method entries keyed by override identity.
     */
    private unresolvedAbstractMethodEntries(): AbstractMethodEntry[] {
        return this.unresolvedAbstractMethods().map((method) => ({ key: this.methodOverrideKey(method), method }));
    }

    /**
     * Build keyed abstract-property entries for inheritance merging.
     *
     * @returns Abstract property entries keyed by property name.
     */
    private unresolvedAbstractPropertyEntries(): AbstractPropertyEntry[] {
        return this.unresolvedAbstractProperties().map((property) => ({ key: this.propertyOverrideKey(property), property }));
    }

    /**
     * Create the override identity used by MATLAB-like method resolution.
     *
     * @param method Method metadata.
     * @returns Override key including static/instance kind.
     */
    private methodOverrideKey(method: ClassMethodDefinition): string {
        return `${method.isStatic ? 'static' : 'instance'}:${method.name}`;
    }

    /**
     * Create the override identity used by MATLAB-like property resolution.
     *
     * @param property Property metadata.
     * @returns Override key for inherited abstract properties.
     */
    private propertyOverrideKey(property: ClassPropertyDefinition): string {
        return property.name;
    }

    /**
     * Reject direct methods that would override inherited sealed methods.
     *
     * MATLAB sealed methods remain callable from subclasses, but subclasses
     * cannot provide a replacement with the same static/instance identity.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateSealedMethodOverrides(throwEvalError: (message: string) => never): void {
        const inheritedSealed = new Map<string, ClassMethodDefinition>();
        for (const method of this.inheritedMethods()) {
            if (method.isSealed) {
                inheritedSealed.set(this.methodOverrideKey(method), method);
            }
        }
        for (const method of this.methods) {
            const sealedMethod = inheritedSealed.get(this.methodOverrideKey(method));
            if (sealedMethod) {
                throwEvalError(`method '${method.name}' in class ${this.name} cannot override sealed method from class ${sealedMethod.classDefinition.name}.`);
            }
        }
    }

    /**
     * Validate class and section attribute names before their values are used.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateSupportedAttributes(throwEvalError: (message: string) => never): void {
        this.validateAttributeNames(this.attributes, ClassDefinition.classAttributes, `class ${this.name}`, throwEvalError);
        this.validateDuplicateAttributes(this.attributes, `class ${this.name}`, throwEvalError);
        this.validateBooleanAttributes(this.attributes, ClassDefinition.classBooleanAttributes, `class ${this.name}`, throwEvalError);
        this.validateClassNameListAttributes(this.attributes, new Set(['AllowedSubclasses', 'InferiorClasses']), `class ${this.name}`, throwEvalError);
        for (const section of this.sections) {
            const owner = `${section.kind.toLowerCase()} section of class ${this.name}`;
            switch (section.kind) {
                case 'PROPERTIES':
                    this.validateAttributeNames(section.attributeTable, ClassDefinition.propertyAttributes, owner, throwEvalError);
                    this.validateBooleanAttributes(section.attributeTable, ClassDefinition.propertyBooleanAttributes, owner, throwEvalError);
                    this.validatePositiveIntegerAttributes(section.attributeTable, new Set(['PartialMatchPriority']), owner, throwEvalError);
                    break;
                case 'METHODS':
                    this.validateAttributeNames(section.attributeTable, ClassDefinition.methodAttributes, owner, throwEvalError);
                    this.validateBooleanAttributes(section.attributeTable, ClassDefinition.methodBooleanAttributes, owner, throwEvalError);
                    break;
                case 'EVENTS':
                    this.validateAttributeNames(section.attributeTable, ClassDefinition.eventAttributes, owner, throwEvalError);
                    this.validateBooleanAttributes(section.attributeTable, ClassDefinition.eventBooleanAttributes, owner, throwEvalError);
                    break;
                case 'ENUMERATION':
                    this.validateAttributeNames(section.attributeTable, ClassDefinition.enumerationAttributes, owner, throwEvalError);
                    this.validateBooleanAttributes(section.attributeTable, ClassDefinition.enumerationBooleanAttributes, owner, throwEvalError);
                    break;
            }
            this.validateDuplicateAttributes(section.attributeTable, owner, throwEvalError);
        }
    }

    /**
     * Validate all names in an attribute table against an allow-list.
     *
     * @param table Attribute table to inspect.
     * @param supportedNames Attribute names accepted for this owner.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    private validateAttributeNames(table: ClassAttributeTable, supportedNames: Set<string>, owner: string, throwEvalError: (message: string) => never): void {
        for (const name of Object.keys(table)) {
            if (!supportedNames.has(name)) {
                throwEvalError(`unsupported ${name} attribute for ${owner}.`);
            }
        }
    }

    /**
     * Validate that an attribute appears at most once in the same declaration.
     *
     * @param table Attribute table to inspect.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    private validateDuplicateAttributes(table: ClassAttributeTable, owner: string, throwEvalError: (message: string) => never): void {
        for (const [name, entries] of Object.entries(table)) {
            if (entries.length > 1) {
                throwEvalError(`duplicate ${name} attribute for ${owner}.`);
            }
        }
    }

    /**
     * Validate boolean marker attributes and boolean-valued attributes.
     *
     * @param table Attribute table to inspect.
     * @param booleanNames Attributes whose value must be boolean when present.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    private validateBooleanAttributes(table: ClassAttributeTable, booleanNames: Set<string>, owner: string, throwEvalError: (message: string) => never): void {
        for (const name of booleanNames) {
            const attribute = table[name]?.[0];
            if (attribute && ClassMember.attributeBooleanValue(attribute) === null) {
                throwEvalError(`invalid boolean ${name} attribute for ${owner}.`);
            }
        }
    }

    /**
     * Validate class-name-list attributes such as `InferiorClasses`.
     *
     * @param table Attribute table to inspect.
     * @param listNames Attributes whose value must be a class-name list.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    private validateClassNameListAttributes(table: ClassAttributeTable, listNames: Set<string>, owner: string, throwEvalError: (message: string) => never): void {
        for (const name of listNames) {
            const attribute = table[name]?.[0];
            if (attribute && ClassMember.classNameListFromAttribute(attribute) === null) {
                throwEvalError(`invalid class-name list ${name} attribute for ${owner}.`);
            }
        }
    }

    /**
     * Validate positive-integer numeric attributes.
     *
     * @param table Attribute table to inspect.
     * @param integerNames Attributes whose value must be a positive integer.
     * @param owner Description used in error messages.
     * @param throwEvalError Interpreter error callback.
     */
    private validatePositiveIntegerAttributes(table: ClassAttributeTable, integerNames: Set<string>, owner: string, throwEvalError: (message: string) => never): void {
        for (const name of integerNames) {
            const attribute = table[name]?.[0];
            if (attribute && ClassMember.positiveIntegerFromAttribute(attribute) === null) {
                throwEvalError(`invalid positive integer ${name} attribute for ${owner}.`);
            }
        }
    }

    /**
     * Validate access attributes that affect class member visibility.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateAccessAttributes(throwEvalError: (message: string) => never): void {
        for (const section of this.sections) {
            const owner = `${section.kind.toLowerCase()} section of class ${this.name}`;
            switch (section.kind) {
                case 'PROPERTIES':
                    ClassMember.validateAccessAttribute(section.attributeTable, 'Access', owner, throwEvalError);
                    ClassMember.validateAccessAttribute(section.attributeTable, 'GetAccess', owner, throwEvalError);
                    ClassMember.validateAccessAttribute(section.attributeTable, 'SetAccess', owner, throwEvalError);
                    break;
                case 'METHODS':
                    ClassMember.validateAccessAttribute(section.attributeTable, 'Access', owner, throwEvalError);
                    break;
                case 'EVENTS':
                    ClassMember.validateAccessAttribute(section.attributeTable, 'Access', owner, throwEvalError);
                    ClassMember.validateAccessAttribute(section.attributeTable, 'ListenAccess', owner, throwEvalError);
                    ClassMember.validateAccessAttribute(section.attributeTable, 'NotifyAccess', owner, throwEvalError);
                    break;
            }
        }
    }

    /**
     * Reject direct or indirect inheritance cycles.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateInheritanceCycles(throwEvalError: (message: string) => never): void {
        for (const superclass of this.superclassDefinitions) {
            if (superclass === this) {
                throwEvalError(`class ${this.name} cannot inherit from itself.`);
            }
            const cycle =
                superclass.inheritanceCyclePath(this, [this.name, superclass.name], new Set([this])) ??
                superclass.inheritanceNameCyclePath(this.name, [this.name, superclass.name], new Set([this.name]));
            if (cycle) {
                throwEvalError(`circular class inheritance detected: ${cycle.join(' -> ')}.`);
            }
        }
    }

    /**
     * Find a path from this class back to a target class.
     *
     * @param target Class that would close the cycle.
     * @param path Names visited so far.
     * @param visited Definitions already inspected.
     * @returns Cycle path, when found.
     */
    private inheritanceCyclePath(target: ClassDefinition, path: string[], visited: Set<ClassDefinition>): string[] | undefined {
        if (this === target) {
            return path;
        }
        if (visited.has(this)) {
            return undefined;
        }
        visited.add(this);
        for (const superclass of this.superclassDefinitions) {
            const cycle = superclass.inheritanceCyclePath(target, [...path, superclass.name], visited);
            if (cycle) {
                return cycle;
            }
        }
        return undefined;
    }

    /**
     * Find a superclass-name path from this class back to a target class name.
     *
     * @param targetName Class name that would close the cycle.
     * @param path Names visited so far.
     * @param visited Names already inspected.
     * @returns Cycle path, when found.
     */
    private inheritanceNameCyclePath(targetName: string, path: string[], visited: Set<string>): string[] | undefined {
        if (this.superclasses.includes(targetName)) {
            return [...path, targetName];
        }
        if (visited.has(this.name)) {
            return undefined;
        }
        visited.add(this.name);
        for (const superclass of this.superclassDefinitions) {
            const cycle = superclass.inheritanceNameCyclePath(targetName, [...path, superclass.name], visited);
            if (cycle) {
                return cycle;
            }
        }
        return undefined;
    }

    /**
     * Validate MATLAB-style `get.Property` and `set.Property` accessor methods.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validatePropertyAccessors(throwEvalError: (message: string) => never): void {
        const validateAccessorMethod = (property: ClassPropertyDefinition, attributeName: 'GetMethod' | 'SetMethod', methodName: string | null): void => {
            if (!methodName) {
                if (property.attributes[attributeName]?.[0]) {
                    throwEvalError(`invalid ${attributeName} attribute for property '${property.name}' in class ${this.name}.`);
                }
                return;
            }
            const method = this.findMethod(methodName, (item) => !item.isStatic);
            if (!method) {
                throwEvalError(`${attributeName} method '${methodName}' for property '${property.name}' in class ${this.name} is not defined.`);
            }
            const inputCount = method.node.parameter.list.length;
            const outputCount = method.node.return.list.length;
            if (attributeName === 'GetMethod' && (inputCount !== 1 || outputCount !== 1 || method.node.return.list[0].type === '<~>')) {
                throwEvalError(`${attributeName} method '${methodName}' for property '${property.name}' in class ${this.name} must declare one input and one output.`);
            }
            if (attributeName === 'SetMethod' && (inputCount !== 2 || outputCount !== 1 || method.node.return.list[0].type === '<~>')) {
                throwEvalError(`${attributeName} method '${methodName}' for property '${property.name}' in class ${this.name} must declare two inputs and one output.`);
            }
        };
        for (const property of this.properties) {
            validateAccessorMethod(property, 'GetMethod', property.getMethodName);
            validateAccessorMethod(property, 'SetMethod', property.setMethodName);
        }
        for (const method of this.methods) {
            const accessor = /^(get|set)\.(.+)$/.exec(method.name);
            if (!accessor) {
                continue;
            }
            const [, kind, propertyName] = accessor;
            if (!this.findProperty(propertyName)) {
                throwEvalError(`${kind} accessor '${method.name}' in class ${this.name} does not match a class property.`);
            }
            if (method.isStatic) {
                throwEvalError(`${kind} accessor '${method.name}' in class ${this.name} cannot be static.`);
            }
            const inputCount = method.node.parameter.list.length;
            const outputCount = method.node.return.list.length;
            if (kind === 'get' && (inputCount !== 1 || outputCount !== 1 || method.node.return.list[0].type === '<~>')) {
                throwEvalError(`get accessor '${method.name}' in class ${this.name} must declare one input and one output.`);
            }
            if (kind === 'set' && (inputCount !== 2 || outputCount !== 1 || method.node.return.list[0].type === '<~>')) {
                throwEvalError(`set accessor '${method.name}' in class ${this.name} must declare two inputs and one output.`);
            }
        }
    }

    /**
     * Validate incompatible class and section attribute combinations.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateAttributeCombinations(throwEvalError: (message: string) => never): void {
        if (ClassMember.hasAttribute(this.attributes, 'Abstract') && ClassMember.hasAttribute(this.attributes, 'Sealed')) {
            throwEvalError(`class ${this.name} cannot be both abstract and sealed.`);
        }
        for (const section of this.sections) {
            if (section.kind === 'METHODS' && ClassMember.hasAttribute(section.attributeTable, 'Abstract') && ClassMember.hasAttribute(section.attributeTable, 'Sealed')) {
                throwEvalError(`methods section of class ${this.name} cannot be both abstract and sealed.`);
            }
        }
        for (const property of this.properties) {
            if (property.isDependent && property.isConstant) {
                throwEvalError(`property '${property.name}' in class ${this.name} cannot be both dependent and constant.`);
            }
            if (property.isAbstract && property.isConstant) {
                throwEvalError(`property '${property.name}' in class ${this.name} cannot be both abstract and constant.`);
            }
            if (property.isDependent && property.defaultValue) {
                throwEvalError(`dependent property '${property.name}' in class ${this.name} cannot define a default value.`);
            }
            if (property.isAbstract && property.defaultValue) {
                throwEvalError(`abstract property '${property.name}' in class ${this.name} cannot define a default value.`);
            }
            if (property.isConstant && !property.defaultValue) {
                throwEvalError(`constant property '${property.name}' in class ${this.name} must define a default value.`);
            }
        }
        for (const method of this.methods) {
            if (method.isAbstract && method.node.statements.list.length > 0) {
                throwEvalError(`abstract method '${method.name}' in class ${this.name} cannot define a method body.`);
            }
            if (this.isConstructorMethodName(method.name) && method.isStatic) {
                throwEvalError(`constructor for class ${this.name} cannot be static.`);
            }
            if (this.isConstructorMethodName(method.name) && method.isAbstract) {
                throwEvalError(`constructor for class ${this.name} cannot be abstract.`);
            }
            if (this.isConstructorMethodName(method.name) && (method.node.return.list.length !== 1 || method.node.return.list[0].type === '<~>')) {
                throwEvalError(`constructor for class ${this.name} must declare exactly one output.`);
            }
        }
    }

    /**
     * Validate direct duplicate member names before lookup tables are relied on.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateDuplicateMembers(throwEvalError: (message: string) => never): void {
        this.validateDuplicateNames(
            this.properties.map((property) => property.name),
            'property',
            throwEvalError,
        );
        this.validateDuplicateNames(
            this.events.map((event) => event.name),
            'event',
            throwEvalError,
        );
        this.validateDuplicateNames(
            this.enumerations.map((enumeration) => enumeration.name),
            'enumeration member',
            throwEvalError,
        );
        this.validateDuplicateNames(
            this.methods.map((method) => this.methodOverrideKey(method)),
            'method',
            throwEvalError,
            (key) => key.slice(key.indexOf(':') + 1),
        );
        this.validateCrossMemberNameConflicts(throwEvalError);
    }

    /**
     * Validate direct member names that share the same class namespace.
     *
     * Property accessor methods (`get.Name` and `set.Name`) are intentionally
     * excluded because they are tied to their target property by
     * `validatePropertyAccessors`.
     *
     * @param throwEvalError Interpreter error callback.
     */
    private validateCrossMemberNameConflicts(throwEvalError: (message: string) => never): void {
        const memberNames = new Map<string, string>();
        const register = (name: string, kind: string): void => {
            const previousKind = memberNames.get(name);
            if (previousKind) {
                throwEvalError(`class ${this.name} has conflicting ${previousKind} and ${kind} named '${name}'.`);
            }
            memberNames.set(name, kind);
        };

        for (const property of this.properties) {
            register(property.name, 'property');
        }
        for (const method of this.methods) {
            if (!this.isConstructorMethodName(method.name) && !method.name.startsWith('get.') && !method.name.startsWith('set.')) {
                register(method.name, 'method');
            }
        }
        for (const event of this.events) {
            register(event.name, 'event');
        }
        for (const enumeration of this.enumerations) {
            register(enumeration.name, 'enumeration member');
        }
    }

    /**
     * Test whether a method name denotes this class constructor.
     *
     * @param name Method name to test.
     * @returns `true` for canonical and package-local constructor spellings.
     */
    private isConstructorMethodName(name: string): boolean {
        return name === this.name || name === this.simpleName;
    }

    /**
     * Reject duplicate names in a direct member collection.
     *
     * @param names Names or keys to inspect.
     * @param kind Member kind for diagnostics.
     * @param throwEvalError Interpreter error callback.
     * @param displayName Optional key-to-name mapper for diagnostics.
     */
    private validateDuplicateNames(names: string[], kind: string, throwEvalError: (message: string) => never, displayName: (name: string) => string = (name) => name): void {
        const seen = new Set<string>();
        for (const name of names) {
            if (seen.has(name)) {
                throwEvalError(`duplicate ${kind} '${displayName(name)}' in class ${this.name}.`);
            }
            seen.add(name);
        }
    }

    /**
     * Populate member tables from parsed class sections.
     */
    private collectMembers(): void {
        for (const section of this.sections) {
            switch (section.kind) {
                case 'PROPERTIES':
                    this.collectProperties(section);
                    break;
                case 'METHODS':
                    this.collectMethods(section);
                    break;
                case 'EVENTS':
                    this.collectEvents(section);
                    break;
                case 'ENUMERATION':
                    this.collectEnumerations(section);
                    break;
            }
        }
    }

    /**
     * Collect property metadata from one `properties` section.
     *
     * @param section Section to index.
     */
    private collectProperties(section: NodeClassSection): void {
        const access = ClassMember.accessFromAttributes(section.attributeTable);
        const isConstant = ClassMember.hasAttribute(section.attributeTable, 'Constant');
        const isDependent = ClassMember.hasAttribute(section.attributeTable, 'Dependent');
        const isAbstract = ClassMember.hasAttribute(section.attributeTable, 'Abstract');
        for (const member of section.members.list) {
            if (!AST.isNodeClassProperty(member)) {
                continue;
            }
            const property = {
                name: member.id,
                node: member,
                defaultValue: member.defaultValue,
                size: member.size,
                class: member.class,
                functions: member.functions,
                section,
                attributes: section.attributeTable,
                access,
                getAccess: ClassMember.accessFromAttributes(section.attributeTable, 'GetAccess', access),
                setAccess: ClassMember.accessFromAttributes(section.attributeTable, 'SetAccess', access),
                getMethodName: ClassMember.methodNameFromAttribute(section.attributeTable, 'GetMethod'),
                setMethodName: ClassMember.methodNameFromAttribute(section.attributeTable, 'SetMethod'),
                isConstant,
                isDependent,
                isAbstract,
                isHidden: ClassMember.hasAttribute(section.attributeTable, 'Hidden'),
                isTransient: ClassMember.hasAttribute(section.attributeTable, 'Transient'),
                isNonCopyable: ClassMember.hasAttribute(section.attributeTable, 'NonCopyable'),
                isGetObservable: ClassMember.hasAttribute(section.attributeTable, 'GetObservable'),
                isSetObservable: ClassMember.hasAttribute(section.attributeTable, 'SetObservable'),
                isAbortSet: ClassMember.hasAttribute(section.attributeTable, 'AbortSet'),
                partialMatchPriority: ClassMember.positiveIntegerFromAttribute(section.attributeTable.PartialMatchPriority?.[0]) ?? 1,
                classDefinition: this,
            };
            this.properties.push(property);
            this.propertyTable[property.name] = property;
        }
    }

    /**
     * Collect method metadata from one `methods` section.
     *
     * @param section Section to index.
     */
    private collectMethods(section: NodeClassSection): void {
        const access = ClassMember.accessFromAttributes(section.attributeTable);
        const isStatic = ClassMember.hasAttribute(section.attributeTable, 'Static');
        const isAbstract = ClassMember.hasAttribute(section.attributeTable, 'Abstract');
        const isSealed = ClassMember.hasAttribute(section.attributeTable, 'Sealed');
        const isHidden = ClassMember.hasAttribute(section.attributeTable, 'Hidden');
        for (const member of section.members.list) {
            if (!AST.isNodeFunctionDefinition(member)) {
                continue;
            }
            const method = {
                name: member.id,
                node: member,
                section,
                attributes: section.attributeTable,
                access,
                isStatic,
                isAbstract,
                isSealed,
                isHidden,
                classDefinition: this,
            };
            this.methods.push(method);
            (isStatic ? this.staticMethods : this.instanceMethods).push(method);
            this.methodsByAccess[access] ??= [];
            this.methodsByAccess[access].push(method);
            this.methodTable[method.name] ??= [];
            this.methodTable[method.name].push(method);
        }
    }

    /**
     * Collect event metadata from one `events` section.
     *
     * @param section Section to index.
     */
    private collectEvents(section: NodeClassSection): void {
        const access = ClassMember.accessFromAttributes(section.attributeTable);
        const listenAccess = ClassMember.accessFromAttributes(section.attributeTable, 'ListenAccess', access);
        const notifyAccess = ClassMember.accessFromAttributes(section.attributeTable, 'NotifyAccess', access);
        const isHidden = ClassMember.hasAttribute(section.attributeTable, 'Hidden');
        for (const member of section.members.list) {
            if (!AST.isNodeClassEvent(member)) {
                continue;
            }
            this.events.push({
                name: member.id,
                node: member,
                section,
                attributes: section.attributeTable,
                access,
                listenAccess,
                notifyAccess,
                isHidden,
                classDefinition: this,
            });
        }
    }

    /**
     * Collect enumeration metadata from one `enumeration` section.
     *
     * @param section Section to index.
     */
    private collectEnumerations(section: NodeClassSection): void {
        const isHidden = ClassMember.hasAttribute(section.attributeTable, 'Hidden');
        for (const member of section.members.list) {
            if (!AST.isNodeClassEnumeration(member)) {
                continue;
            }
            const enumeration = {
                name: member.id,
                node: member,
                args: member.args,
                section,
                attributes: section.attributeTable,
                isHidden,
                classDefinition: this,
            };
            this.enumerations.push(enumeration);
            this.enumerationTable[enumeration.name] = enumeration;
        }
    }
}

export type { ClassMethodTable, ClassPropertyTable, ClassEnumerationTable };
export { ClassDefinition };
export default { ClassDefinition };
