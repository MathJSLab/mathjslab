import type { ClassAttributeTable, NodeClassDef, NodeClassSection, NodeFunctionDefinition, NodeIdentifier } from './AST';
import type { ClassEnumerationDefinition, ClassEventDefinition, ClassMethodDefinition, ClassPropertyDefinition } from './ClassMember';
import { ClassMember } from './ClassMember';
import type { Interpreter } from './Interpreter';

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
    /** Runtime type tag stored on each class definition instance. */
    public readonly type = ClassDefinition.CLASS_DEFINITION;
    /** Optional AST-style parent pointer used by generic copy/unparse paths. */
    public parent: any;
    /** Class name from the `classdef` header. */
    public readonly name: string;
    /** Source AST node that defines the class. */
    public readonly ast: NodeClassDef;
    /** Class-level attribute table. */
    public readonly attributes: ClassAttributeTable;
    /** Whether the class is explicitly or effectively abstract. */
    public readonly isAbstract: boolean;
    /** Whether subclasses are forbidden. */
    public readonly isSealed: boolean;
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
        this.attributes = ast.attributeTable;
        this.isSealed = ClassMember.hasAttribute(this.attributes, 'Sealed');
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
        this.isAbstract = ClassMember.hasAttribute(this.attributes, 'Abstract') || this.methods.some((method) => method.isAbstract);
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
    public static readonly unparse = (definition: ClassDefinition, interpreter: Interpreter): string => interpreter.Unparse(definition.ast);

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
        this.superclassDefinitions.length = 0;
        for (const name of this.superclasses) {
            if (name === 'handle') {
                continue;
            }
            const definition = resolve(name);
            if (!definition) {
                throwEvalError(`superclass '${name}' for class ${this.name} is not defined.`);
            }
            if (definition.isSealed) {
                throwEvalError(`class ${this.name} cannot inherit from sealed class ${definition.name}.`);
            }
            this.superclassDefinitions.push(definition);
        }
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
        return this.isBuiltinHandleClass || this.superclasses.includes('handle') || this.superclassDefinitions.some((superclass) => superclass.isHandleClass());
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
        const inherited = this.superclassDefinitions.flatMap((superclass) => superclass.allProperties());
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
        const inherited = this.superclassDefinitions.flatMap((superclass) => superclass.allMethods());
        const ownKeys = new Set(this.methods.map((method) => this.methodOverrideKey(method)));
        return [...inherited.filter((method) => !ownKeys.has(this.methodOverrideKey(method))), ...this.methods];
    }

    /**
     * Return inherited and direct events with direct names overriding inherited
     * events.
     *
     * @returns Effective event list.
     */
    public allEvents(): ClassEventDefinition[] {
        const inherited = this.superclassDefinitions.flatMap((superclass) => superclass.allEvents());
        const ownNames = new Set(this.events.map((event) => event.name));
        return [...inherited.filter((event) => !ownNames.has(event.name)), ...this.events];
    }

    /**
     * Return inherited and direct enumeration members.
     *
     * @returns Effective enumeration list.
     */
    public allEnumerations(): ClassEnumerationDefinition[] {
        const inherited = this.superclassDefinitions.flatMap((superclass) => superclass.allEnumerations());
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
     * Test whether the class cannot be instantiated because of explicit or
     * inherited abstract requirements.
     *
     * @returns `true` when the class is effectively abstract.
     */
    public isEffectivelyAbstract(): boolean {
        return this.isAbstract || this.unresolvedAbstractMethods().length > 0;
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
     * Create the override identity used by MATLAB-like method resolution.
     *
     * @param method Method metadata.
     * @returns Override key including static/instance kind.
     */
    private methodOverrideKey(method: ClassMethodDefinition): string {
        return `${method.isStatic ? 'static' : 'instance'}:${method.name}`;
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
        for (const member of section.members.list) {
            if (member.type !== 'CLASS_PROPERTY') {
                continue;
            }
            const property = {
                name: member.id,
                node: member,
                defaultValue: member.defaultValue,
                section,
                attributes: section.attributeTable,
                access,
                getAccess: ClassMember.accessFromAttributes(section.attributeTable, 'GetAccess', access),
                setAccess: ClassMember.accessFromAttributes(section.attributeTable, 'SetAccess', access),
                isConstant,
                isDependent,
                isHidden: ClassMember.hasAttribute(section.attributeTable, 'Hidden'),
                isTransient: ClassMember.hasAttribute(section.attributeTable, 'Transient'),
                isGetObservable: ClassMember.hasAttribute(section.attributeTable, 'GetObservable'),
                isSetObservable: ClassMember.hasAttribute(section.attributeTable, 'SetObservable'),
                isAbortSet: ClassMember.hasAttribute(section.attributeTable, 'AbortSet'),
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
            if (member.type !== 'FCNDEF') {
                continue;
            }
            const method = {
                name: member.id,
                node: member as NodeFunctionDefinition,
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
            if (member.type !== 'CLASS_EVENT') {
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
        for (const member of section.members.list) {
            if (member.type !== 'CLASS_ENUMERATION') {
                continue;
            }
            const enumeration = {
                name: member.id,
                node: member,
                args: member.args,
                section,
                attributes: section.attributeTable,
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
