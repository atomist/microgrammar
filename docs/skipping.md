# Skipping Input
By default, microgrammars do not skip intervening junk. However, this behavior is configurable.

Consider the following grammar:

```typescript
const personGrammar = Microgrammar.fromString<Person>("${name}:${age}", {
    age: Integer,
});
```
This will match the first of these two inputs, but not the second:

```
Tom:16
```
```
Tom:what is this just?16
```

Such non-skipping behavior is usually what we want, as the whole microgrammar concept supports skipping to invidual. However, we can change it by adding a special flag to our definition format as follows:

```typescript
const personGrammar = Microgrammar.fromString<Person>("${name}:${age}", {
    age: Integer,
    $skipGaps: true,
});
```
See the `SkipCapable` interface. Now the grammar will match the second input as well the first, discarding the intervening content.

As skip control occurs at *definition* level, we can skip in some productions but not in others.