# Using Functions
Microgrammars created from object definitions support two types of functions, in addition to properties: **computed property** functions and **validation functions**.

## Computed properties
Often

A common pattern is to match a property with a `_` prefix--which causes the property not to be bound to the resulting match--and then compute a property that *will* be exposed. For example, the `_it` property in the following grammar will not be exposed, and is used to compute the `test` property.

```typescript
const NodeTestGrammar = microgrammar({
    _it: firstOf("*", NodeName),
    test: ctx => ctx._it === "*" ? AllNodeTest : new NamedNodeTest(ctx._it),
});
```

## Validation functions
A validation function serves to perform a check on the current match, potentially vetoing it. This can be important as it may veto and abort matching before expensive matching steps are performed.

A validation function is any function that returns `boolean` whose name begins with an `_`.

For example:

```typescript
microgrammar<ChangeControlledMethod>({
    annotations: new Rep1(AnyAnnotation),
    _check(ctx: any) {
        const found = ctx.annotations.filter(a => a.name === "ChangeControlled");
        if (found.length === 0) {
            return false;
        }
        ctx.changeControlledAnnotation = found;
        return true;
    },
    _visibilityModifier: "public",
    type: JAVA_IDENTIFIER,
    name: JAVA_IDENTIFIER,
    parameterContent: JavaParenthesizedExpression,
    body: JavaBlock,
});
```
The `_check` function will veto methods that don't have the required annotation before the remainder of the method is parsed, minimizing 
backtracking. A validation method may have any name.
