# Handling Circular References

Sometimes grammars have circular references. Microgrammars can handle this,
although most appropriate uses of microgrammars don't run into circularity.

For example, we might define a logical expression language as follows (shown in BNF style syntax):

```
<simple> ::= // simple term definition
<and> ::= <simpleTerm> '&' <expression>
<expression> :: <simpleTerm> | <and>
 ```

There's a circular relationship between `and` and `expression`, which allows
expressions to scale to any number of terms.

A straightforward attempt to implement this with microgrammars won't work. The following
code won't compile because `and` depends on `expression` before it's defined:

```typescript
const simpleTerm = microgrammar<{ term: QueryTerm}>({
    // simple term structure,
});

const and = microgrammar<{ term: QueryTerm}>({
    a: simpleTerm,
    _amp: "&",
    // This won't compile because expression isn't yet defined
    b: expression,
});

const expression = microgrammar<{ expr: { term: QueryExpression} }>({
    expr: firstOf(and, simpleTerm),
});
```

There is a solution to this, where we defer setting the problematic term. 
We explicitly use the `Concat` class to define the term we wish to defer, setting the special `$lazy` property
to true to defer initialization:

```typescript
// Definitions use the $lazy field
const and = Concat.of({
    a: simpleTerm,
    _and: "&",
    b: undefined,
    $lazy: true,
});

// Now define "expression" so we can refer to it.
// It can already refer to "and"
const expression = microgrammar<{ expr: { term: QueryExpression} }>({
    expr: firstOf(and, simpleTerm),
});

// Now set the undefined term on "and"
and.definitions.b = expression;

// Finally, call a special predefined method to initialize the concat
// when the data is ready to be evaluated
and._init();
```

> Circularity is often an indication that a microgrammar is not the ideal solution
for a parsing problem. If you need to build a rich, complete, AST, consider using a tool like
ANTLR.
