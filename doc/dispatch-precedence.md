# Symbol and call dispatch precedence

MathJSLab exposes the active resolution policy through
`symbolResolutionPrecedence` and `callDispatchPrecedence` in `Context.ts`.
Tests should assert these exported matrices together with behavior so an order
change cannot remain hidden inside resolver control flow.

## Symbol resolution

| Order | Tier                | Meaning                                                                                                      |
| ----: | ------------------- | ------------------------------------------------------------------------------------------------------------ |
|     1 | `variable`          | Visible variable in the lexical scope chain.                                                                 |
|     2 | `registered-class`  | Already materialized class definition, including a previously loaded provider class.                         |
|     3 | `scoped-function`   | Local, nested, script-local, captured, or otherwise registered function in the lexical function-table chain. |
|     4 | `provider-function` | Function loaded from the configured source resolver.                                                         |
|     5 | `provider-class`    | Class loaded from the configured source resolver.                                                            |
|     6 | `import`            | Explicit or wildcard imported class/function candidate.                                                      |
|     7 | `builtin`           | Built-in function table entry.                                                                               |

Aliases are canonicalized before this sequence. Qualified package names enter
the class/function tiers directly. Simple imported names report `importKind` as
`explicit` or `wildcard`; an explicit import in the nearest applicable scope
suppresses wildcard candidates, while multiple resolving candidates at the same
visible import level are ambiguous.

Provider lookups may register the loaded definition. A first resolution can
therefore report `provider-function` or `provider-class`, while later
resolution of the same object reports `scoped-function` or `registered-class`.
The selected definition and call behavior remain unchanged.

`exist` and `which` also use `provider-source` and `directory` provenance tiers
for source metadata that is not itself an executable symbol.

## Call and indexing dispatch

After an expression has been resolved/evaluated, parentheses are classified in
this order:

1. callable function or handle;
2. bound instance method;
3. array of bound methods;
4. static method;
5. empty-object method placeholder;
6. class constructor;
7. functional class method;
8. undefined function diagnostic;
9. native array/cell/string indexing.

Operator built-ins may dispatch to class overloads after callable selection and
before ordinary callable execution. An explicit `builtin(...)` call bypasses
that overload step. Braces remain native cell-content indexing and do not
become ordinary function-call syntax.

## Handles and invalidation

Named handles resolve through their captured lexical scope when present, then
through the same symbol policy with variables and classes disabled. Text
handles created by `str2func` deliberately do not inherit nested-function
visibility. `clear` removes materialized variable/function/class bindings as
appropriate; provider-backed sources remain reloadable and are resolved again
through the same ordered policy.
