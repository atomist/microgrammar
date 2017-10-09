# Whitespace Handling
By default, microgrammars ignore whitespace. However, as there is no distinct lexer phase, this behavior is configurable.

Consider the following grammar:

```typescript
const personGrammar = Microgrammar.fromString<Person>("${name}:${age}", {
    age: Integer,
});
```
This will match either of the following inputs:

```
Tom:16
```
```
   Tom:                    16
```

The whitespace will be ignored, although the positions of the field matches will be preserved.

Such whitespace-ignoring behavior is what we want when parsing most languages and configuration formats. However, if it isn't what we want, we can change it by adding a special flag to our definition format:

```typescript
const personGrammar = Microgrammar.fromString<Person>("${name}:${age}", {
    age: Integer,
    $consumeWhiteSpaceBetweenTokens: false,
});
```

See the `WhiteSpaceHandler` interface.

As whitespace control occurs at *definition* level, we can ignore whitespace in some productions but not in others.