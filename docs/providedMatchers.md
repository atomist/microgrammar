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

The concepts in these will be familiar from BNF grammars or parser combinator frameworks.

| Matcher  |  Source file |  Matches | Notes  |
|---|---|---|---|
| zeroOrMore  | `Rep`  | One or none of a repeated production   |   | 
|  atLeastOne |  `Rep` | At least one of a repeated production  |   | 
|  RepSep | `Rep`  |  One or none of a repeated production, separated by another production |   | 
|   Rep1Sep|  `Rep` | At least one of a repeated production, separated by another production  |   | 
|  optional | `Ops`  | Optional production  |   | 
| firstOf | `Ops` | The first of a list of matchers

It is also easy to [define your own matchers](customMatchers.md).