## Writing Efficient Microgrammars

Parsing can be expensive in general. Microgrammars add certain further considerations.

### General Notes

A microgrammar notionally attempts to match its matcher on every character of the input, sliding forward one character if the match fails. 
When a match is attempted, it may fail at any point, resulting in back tracking to try alternatives at any point.

Thus the worst case--a matcher that can match unpredictably, and lots of back tracking--can be expensive.

On the positive side, microgrammars do not need to build a full AST, so they can cope with extremely large files 
better than traditional grammars. There is also a lot of leeway in their authoring, compared with traditional grammars, because they are not 
building a definitive AST: Often 
you can express the same thing in a number of ways, with different performance characteristics.

### Performance Tips

#### Prefer grammars that begin with a literal string
This enables _prefix scanning_: an important optimization where the parser can discard input until
the literal is found, not even attempting a match. If you can begin a grammar with a literal string
rather than a regex, do so.

#### Fail matches early
Often you want to fail a match based on semantics, rather than syntax, when a structural match has illegal values in the present content.
For example, the following grammar matches a method that has an `@ChangeControlled` annotation. Because this annotation could occur at any point
among other annotations, it's impossible to express that in the grammar itself. But we check promptly that such an 
annotation was present and veto the match if it wasn't.

```
Microgrammar.fromDefinitions<ChangeControlledMethod>({
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
backtracking.

#### Use `Rep1` or `Rep1Sep` instead of `Rep` and `RepSep` if possible. 
If you require at least one match, specify the cardinality. This may enable prefix scanning, and reduces the possible match space.

#### Consider the cost of alternatives
Using `Alt` is an invitation for back tracking. It's often necessary, but consider where the alternatives are in your grammars.

#### Don't use complex regular expressions
It's easier for the parser to optimize when it understands the alternatives of the matches. Furthermore, it's against the spirit of
microgrammars to stuff too much into regular expressions. Use them to match tokens such as identifiers.

#### Be careful with observers (Stateful matchers only)
`MatchingMachine` allows the specification of an _observer_ that can work along side with the grammar. This can be very useful, but
if the matcher and the observer do not share a start literal, prefix scanning is impossible, which can dramatically increase the cost of
parsing large files. 

#### Consider pre-processing input if a grammar cannot be made more efficient (Last resort)
If you have a grammar that is not amenable to prefix scanning, and is prone to a lot of back tracking, you may want to reduce the size of the input
through a preprocessing step. For example, call `canonicalize` on Java source code before parsing it.

_Note that this approach won't work if you want to update matches, as it loses positional information._

