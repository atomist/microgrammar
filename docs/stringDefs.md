# String Definitions
This is a higher level usage model in which a string resembling the desired input but with variable placeholders is used to define the grammar.

Variable placeholders follow TypeScript style for variable placheholders in interpolated strings, e.g. `static ${embeddedVariable} more static`.

This style is ideally suited for simpler grammars. For example:

```typescript
const ValuePredicateGrammar = Microgrammar.fromString<Predicate>(
    "@${name}='${value}'");
```
By default, this will skip over characters that don't match the string literals. For example, `name` will match anything up to but not including a `'`.

As with the object definitional style, whitespace will be ignored by default.
    
This style can be combined with the definitional style through providing optional definitions for the named fields. For example, to constrain the match on a name in the above exampl, we can use a regular expression:

```typescript
const ValuePredicateGrammar = Microgrammar.fromString<Predicate>(
    "@${name}='${value}'", {
        name: /[a-z]+/
    });
```

When troubleshooting a problem with string-defined microgrammars, adding explicit definitions is often helpful.

