import { JavaBlock, javaBlockContaining } from "../../../../../src/matchers/lang/cfamily/java/JavaBody";
import { Microgrammar } from "../../../../../src/Microgrammar";
import { PatternMatch } from "../../../../../src/PatternMatch";
import { Regex } from "../../../../../src/Primitives";

import { inputStateFromString } from "../../../../../src/internal/InputStateFactory";

import * as assert from "power-assert";
import { RestOfInput } from "../../../../../src/matchers/skip/Skip";
import { isSuccessfulMatch } from "../../../../../src/MatchPrefixResult";

describe("JavaBlock", () => {

    it("match empty block", () => {
        match("{}");
    });

    it("match block with statement", () => {
        match("{ x = y; }");
    });

    it("match block ignoring terminating } in string", () => {
        match("{ x = \"}\"; }");
    });

    it("match block ignoring { in string", () => {
        match("{ x = \"}{{{{{\"; }");
    });

    it("match nested ignoring terminating } in string", () => {
        match("{ { x = \"}\"; } }");
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

    it("should ignore { in multiline comments");

    it("should match till balance", () => {
        const balanced = "{  x = y; { }  2; }";
        const is = inputStateFromString(balanced + "// this is a comment }");
        const m = JavaBlock.matchPrefix(is, {}, {}) as PatternMatch;
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(mmmm.$matched === balanced);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("should match inner structure", () => {
        const balanced = "{ x = y; }";
        const is = inputStateFromString(balanced);
        const inner = Microgrammar.fromDefinitions({
            left: new Regex(/[a-z]+/),
            equals: "=",
            right: "y",
            _whatever: RestOfInput,
        });
        const m: any = javaBlockContaining(inner.matcher).matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(mmmm.$matched === balanced);
            assert(mmmm.block.left === "x");
            assert(mmmm.block.$valueMatches.left.$offset === 2);
            assert(mmmm.block.right === "y");
            assert(mmmm.block.$valueMatches.right.$offset === 6);

        } else {
            assert.fail("Didn't match");
        }
    });

    function match(what: string) {
        const is = inputStateFromString(what);
        const m = JavaBlock.matchPrefix(is, {}, {}) as PatternMatch;
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(mmmm.$matched === what);
        } else {
            assert.fail("Didn't match");
        }
    }

    function shouldNotMatch(what: string) {
        const is = inputStateFromString(what);
        const m = JavaBlock.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    }

});
