## Troubleshooting Microgrammars

Often your first attempts at a microgrammar will not match.

Suggested steps:

- **Write unit tests**. Microgrammars are easily unit testable. Test productions in isolation, rather than as part of an application. TDD works very well when developing with microgrammars. Start with simpler cases of input, and gradually build in complexity and completeness.
- **Start small**. Complex productions are built from simple building blocks. Don't try to assemble a complex production in one go--break out the individual pieces and unit test each of them. This also fosters reuse.
- **Refer to any existing formal grammars**. While microgrammars are intentionally incomplete when compared to BNF-style grammars, such grammars are often a valuable reference. You can find them in the definitions of languages such as Java. ANTLR grammars can also be a useful resource. Don't try to copy the full grammar, but do use it to understand the constructs.
- **Test regular expression terms in isolation.** While using microgrammars can help avoid having to write excessively complex regular expressions, you *will* certainly still use regular expressions, and when in doubt write unit tests for them.
- **Avoid excessively complex grammars**. If a particular microgrammar is starting to look like a full BNF grammar for what you're parsing, it may indicate that you shouldn't be using a microgrammar in the first place, or that you're not thinking in microgrammars. If the latter is the problem, consider (a) thinking harder about what information you can throw away when matching; or (b) breaking your microgrammar into two, where you first check for one and then the other (e.g. that the former is not contained within the latter).

If none of these techniques helps, a microgrammar may not be the right approach.

