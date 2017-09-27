# @atomist/microgrammar

[![Build Status](https://travis-ci.org/atomist/microgrammar.svg?branch=master)](https://travis-ci.org/atomist/microgrammar)

Parsing library written in TypeScript, filling the large gap between the sweet spots of 
regular expressions and full-blown [BNF][bnf] or equivalent grammars. 
Can parse and cleanly update 
structured content. `npm` module page [here][npm-mod].

## Concepts

**Microgrammars** are a powerful way of parsing structured
content such as source code, described in this [Stanford paper][mg-paper]. 
Microgrammars are designed to recognize
structures in a string or stream and extract their content: For
example, to recognize a Java method that has a particular annotation
and to extract particular parameters. They are more powerful and [typically more
readable][regex-hell] than [regular expressions][regex] for complex cases, although they can be
built using regex.

[mg-paper]: http://web.stanford.edu/~mlfbrown/paper.pdf (How to build static checking systems using orders of magnitude less code Brown et al., ASPLOS 2016)
[npm-mod]: https://www.npmjs.com/package/@atomist/microgrammar (node module)

Atomist microgrammars go beyond the Stanford paper example in that
they permit _updating_ as well as matching, preserving positions. They
also draw inspiration from other experience and sources such as the
old [SNOBOL programming language][snobol].

[snobol]: https://en.wikipedia.org/wiki/SNOBOL (SNOBOL Programming Language)
[regex-hell]: https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags#answer-1732454
[regex]: https://en.wikipedia.org/wiki/Regular_expression

## Examples

Here's a simple example:

```
const mg = Microgrammar.fromDefinitions<{name: string, age: number}>({
    name: /[a-zA-Z0-9]+/,
    _col: ":",
    age: Integer
});

const results = mg.findMatches("-celine:61 greg*^ tom::: mandy:11");
assert(result.length === 2);
const first = results[0];
assert(first.$matched === "celine:61");
// The offset of this match was the 1st character, as the 0th was discarded
assert(first.$offset === 1);
assert(first.name === "celine");
assert(first.age === 61);
```

Some notes:

-   A microgrammar definition is typically an object literal, with its
    properties being matched in turn. This is like **concatenation**
    in a BNF grammar.
-   Matcher property values can be regular expressions (like
    `/[a-zA-Z0-9]+/` here), string literals (like `:`), or custom
    matchers (like `Integer`). It's easy to define custom matchers for
    use in composition.
-   All properties need to match for the whole microgrammar to match.
-   Properties that match are bound to the result, unless their names begin with `_`, in which
    case the values are discarded.
-   Certain out of band values, beginning with `$`, are added to the
    results, showing the exact text that matched, the offset etc.
-   When using TypeScript, microgrammar returns can be strongly typed. In this case we've
    used an anonymous type, but we could also use an interface. We
    could also use untyped, JavaScript style.
-   Matching skips junk such as `greg*^ tom:::`. In this case, `greg`
    and `tom:` will look like the start of valid matches, but the
    first will fail when it can't match a `:` and the second when
    there isn't a digit after the colon.
-   We can match against a string or a stream. In this case we've used
    a string. In stream matching, we'd be more likely to use one an
    API offering callbacks rather than building an array, so we don't
    need to hold all our matches in memory at once.

Of course, such a simple example could easily be handled by a regular
expression and capture groups. But the power becomes apparent with
nested productions and more elaborate matchers.

A more complex example, showing composition:

```
export const CLASS_NAME = /[a-zA-Z_$][a-zA-Z0-9_$]+/;

// Any annotation we're not interested in
const DiscardedAnnotation = {
    _at: "@",
    _annotationName: CLASS_NAME,
    _content: optional(JavaParenthesizedExpression),
};

const SpringBootApp = Microgrammar.fromDefinitions<{ name: string }>({
    _app: "@SpringBootApplication",
    _content: optional(JavaParenthesizedExpression),
    _otherAnnotations: zeroOrMore(DiscardedAnnotation),
    _visibility: optional("public"),
    _class: "class",
    name: CLASS_NAME,
});
```

This will match content like this:

```
@SpringBootApplication
@Foo
@Bar(name = "Baz", magicParam = 31754)
public class MySpringBootApplication
```

Notes:

- `JavaParenthesizedExpression` is a built-in matcher constant that matches any valid Java content within `(...)`. It uses a state
machine. It's easy to write such custom matchers.
- By default, microgrammars are tolerant of whitespace, treating it as a token separator. This is the behavior we want when
parsing most languages or configuration formats.
- Because the other properties have names beginning with `_`, only the class name (`MySpringBootApplication` in our example) is bound to the result. We care about the structure of the rest of the class declaration, but we don't need to extract other values in this particular case.

## Alternatives and When To Use Microgrammars

Microgrammars have obvious similarities to [BNF grammars][bnf], but
differ in some important respects:

-   They are intended to match and explain _parts_ of the input, rather
    than the whole input
-   They excel at skipping content they are uninterested in
-   They are not necessarily context free
-   They do not need to construct a full AST, although they construct
    ASTs for structures they do match. Thus they can easily cope with 
    partially structured data, happily skipping over incomprehensible content

[bnf]: https://en.wikipedia.org/wiki/Backus–Naur_form (Backus–Naur Form)

Similarities are:

-   The idea of **productions**
-   Composability, including the ability to reuse productions in
    different grammars
-   Operations such as _alternative_, _optional_ and _rep_, that
    enable building complex structures.

Compared to regular expressions, microgrammars are:

-   Capable of handing greater complexity
-   More composable
-   Higher level, able to use regular expressions as building blocks
-   Capable of expressing nested structures
-   Arbitrarily extensible through TypeScript function predicates and
    custom **matchers**

While it would be overkill to use a microgrammar for something that
can be expressed in a simple regex, microgrammars tend to be clearer
for complex cases.

## Usage

The `@atomist/microgrammar` module contains both the TypeScript
typings and compiled JavaScript.  You can use this project by
adding the dependency in your `package.json`.

```
$ npm install @atomist/microgrammar --save
```

Full documentation can be found in
the [Atomist microgrammar documentation][mg-doc].  You can also take a
look at the tests in this repository.

[mg-doc]: http://docs.atomist.com/user-guide/rug/microgrammars/ (Atomist Documentation - Microgrammars)

## Performance considerations
See [Writing efficient microgrammars][efficiency].

[efficiency]: performance.md (Writing efficient microgrammars)

## Development

See the [contribution guidelines](CONTRIBUTING.md).

### Running tests

Run all the tests in mocha:

`npm test`

Run one test file:

`TEST=MyTestFile.ts npm testone`

Run benchmarks with profiling, leaving a `profile.txt` file to view:

`npm run benchmark`

Clean (including deleting any profiling data):

`npm run clean`
 
 
 
