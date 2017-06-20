import { expect } from "chai";
import { InputState } from "../../src/InputState";
import { JavaBlock, javaBlockContaining } from "../../src/java/JavaBody";
import { AnonymousDefinition } from "../../src/Matchers";
import { Microgrammar } from "../../src/Microgrammar";
import { PatternMatch } from "../../src/PatternMatch";
import { matchEverything, Regex } from "../../src/Primitives";

describe("JavaBlockTest", () => {

    it("match empty block", () => {
        match("{}");
    });

    it("match block with statement", () => {
        match("{ x = y; }");
    });

    it("match block ignoring terminating } in string", () => {
        match('{ x = "}"; }');
    });

    it("match block ignoring { in string", () => {
        match('{ x = "}{{{{{"; }');
    });

    it("match nested ignoring terminating } in string", () => {
        match('{ { x = "}"; } }');
    });

    it("match nested ignoring terminating } in line comment", () => {
        match(
            `
            {
                // And if I put a } in here it shouldn't matter
            }`,
        );
    });

    it("shouldn't match unbalanced", () => {
        shouldNotMatch("{  ");
    });

    // TODO need to implement this
    it("should ignore { in multiline comments", () => {
        // console.log("TODO: ignore { in multiline comments")
    });

    it("should match till balance", () => {
        const balanced = "{  x = y; { }  2; }";
        const is = InputState.fromString(balanced + "// this is a comment }");
        const m = JavaBlock.matchPrefix(is) as PatternMatch;
        expect(m.$isMatch).to.equal(true);
        expect(m.$matched).to.equal(balanced);
    });

    it("should match inner structure", () => {
        const balanced = "{ x = y; }";
        const is = InputState.fromString(balanced);
        const inner = Microgrammar.fromDefinitions({
            left: new Regex(/^[a-z]+/),
            equals: "=",
            right: "y",
            _whatever: matchEverything,
            ...AnonymousDefinition,
        });
        const m: any = javaBlockContaining(inner.matcher).matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect(m.$matched).to.equal(balanced);
        expect(m.block.left).to.equal("x");
        expect(m.block.left$match.$offset).to.equal(2);
        expect(m.block.right).to.equal("y");
        expect(m.block.right$match.$offset).to.equal(6);
    });

    function match(what: string) {
        const is = InputState.fromString(what);
        const m = JavaBlock.matchPrefix(is) as PatternMatch;
        expect(m.$isMatch).to.equal(true);
        expect(m.$matched).to.equal(what);
    }

    function shouldNotMatch(what: string) {
        const is = InputState.fromString(what);
        const m = JavaBlock.matchPrefix(is);
        expect(m.$isMatch).to.equal(false);
    }

});
