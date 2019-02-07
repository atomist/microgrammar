import {
    JavaBlock,
    javaBlockContaining,
} from "../../../../../lib/matchers/lang/cfamily/java/JavaBody";
import { Microgrammar } from "../../../../../lib/Microgrammar";
import { Regex } from "../../../../../lib/Primitives";

import { inputStateFromString } from "../../../../../lib/internal/InputStateFactory";

import * as assert from "power-assert";
import { RestOfInput } from "../../../../../lib/matchers/skip/Skip";
import { isSuccessfulMatchReport } from "../../../../../lib/MatchReport";

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
        const m = JavaBlock.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === balanced);

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
        const m: any = javaBlockContaining(inner.matcher).matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === balanced);
            const mmmm = m.toPatternMatch() as any;
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
        const m = JavaBlock.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === what);
        } else {
            assert.fail("Didn't match");
        }
    }

    function shouldNotMatch(what: string) {
        const is = inputStateFromString(what);
        const m = JavaBlock.matchPrefixReport(is, {}, {});
        assert(!isSuccessfulMatchReport(m));
    }

});
