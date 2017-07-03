
import { JavaBlock, javaBlockContaining } from "../../../src/matchers/java/JavaBody";
import { Microgrammar } from "../../../src/Microgrammar";
import { isPatternMatch, PatternMatch } from "../../../src/PatternMatch";
import { Regex } from "../../../src/Primitives";

import { Break } from "../../../src/matchers/snobol/Break";

import { inputStateFromString } from "../../../src/internal/InputStateFactory";

import * as assert from "power-assert";

describe("JavaBlock", () => {

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
        const is = inputStateFromString(balanced + "// this is a comment }");
        const m = JavaBlock.matchPrefix(is, {}) as PatternMatch;
        assert(isPatternMatch(m));
        assert(m.$matched === balanced);
    });

    it("should match inner structure", () => {
        const balanced = "{ x = y; }";
        const is = inputStateFromString(balanced);
        const inner = Microgrammar.fromDefinitions({
            left: new Regex(/^[a-z]+/),
            equals: "=",
            right: "y",
            _whatever: new Break("//////"),
        });
        const m: any = javaBlockContaining(inner.matcher).matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert(m.$matched === balanced);
        assert(m.block.left === "x");
        assert(m.block.left$match.$offset === 2);
        assert(m.block.right === "y");
        assert(m.block.right$match.$offset === 6);
    });

    function match(what: string) {
        const is = inputStateFromString(what);
        const m = JavaBlock.matchPrefix(is, {}) as PatternMatch;
        assert(isPatternMatch(m));
        assert(m.$matched === what);
    }

    function shouldNotMatch(what: string) {
        const is = inputStateFromString(what);
        const m = JavaBlock.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    }

});
