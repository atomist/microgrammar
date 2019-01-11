# Provided Matchers
This project provides many matchers out of the box. Here's a list of the key ones, divided into primitives and compositional constructs.

## Terminal (primitive) matchers


| Matcher  |  Source file |  Matches | Notes  |
|---|---|---|---|
|  Integer | `Primitives`  |  Integer |   | 
| Float  |  `Primitives` |  Floating point number |   | 
| LowercaseBoolean  | `Primitives`  |  Lower case boolean |   | 
|  Regex |  `Primitives` |  Regular expressions | Seldom needs to be used directly, as just including the string as a JavaScript `RegExp` (in `/.../` syntax) will cause a `Regex` instance to be created   | 
| Literal  | `Primitives`  | Literal string  | Seldom needs to be used directly, as just including the string as a field value will cause a `Literal` instance to be created  | 


## Compositional matchers

These matchers enable the composition of more complex microgrammars. The concepts will be familiar from BNF grammars or parser combinator frameworks.

| Matcher  |  Source file |  Matches | Notes  |
|---|---|---|---|
| zeroOrMore  | `Rep`  | One or none of a repeated production   |   | 
|  atLeastOne |  `Rep` | At least one of a repeated production  |   | 
|  RepSep | `Rep`  |  One or none of a repeated production, separated by another production |   | 
|   Rep1Sep|  `Rep` | At least one of a repeated production, separated by another production  |   | 
|  optional | `Ops`  | Optional production  |   | 
| firstOf | `Ops` | The first of a list of matchers

## SNOBOL-inspired matchers

The concepts in these are borrowed from the SNOBOL programming language.

| Matcher  |  Source file |  Matches | Notes  |
|---|---|---|---|
| takeUntil | `Skip` | Take until the specified matcher, not including its value
| skipTo | `Skip` | Skip until the specified matching, consuming and binding its value
| RestOfLine  | `Skip`  | Rest of line   |   | 
|  RestOfInput |  `Skip` | Remainder of input |   | 

## C Family language matchers
These matches have been tested with Java, but should be useful for any C family language.

| Matcher  |  Source file |  Matches | Notes  |
|---|---|---|---|
| JavaBlock  | `index`  | Java block, including `{` and `}`  | Handles nesting  | 
|  parenthesizedExpression |  `index` | Java parenthesized expression in `()` | Handles nesting  |   | 
| blockContaining | `index` | Java block containing a match of the given matcher


You can also [define your own matchers](customMatchers.md).