import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { when } from "../lib/Ops";

import { Literal } from "../lib/Primitives";

import * as assert from "power-assert";
import { isSuccessfulMatchReport } from "../lib/MatchReport";

describe("When", () => {

    it("when true should match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const matcher = when(primitive, pm => true);
        if (!matcher) {
            throw new Error("Error: matcher returned by when is undefined");
        }
        if (!matcher.matchPrefix) {
            throw new Error("Error: matcher.matchPrefix returned by when is undefined");
        }
        const m = matcher.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            // good
        } else {
            assert.fail("Didn't match");
        }
    });

    it("when false should not match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const matcher = when(primitive, pm => false);
        const m = matcher.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("ability to veto content", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const hatesFoo = when(primitive, pm => pm.$matched.indexOf("foo") === -1);
        const m = hatesFoo.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("ability to veto content: not vetoed", () => {
        const primitive = new RegExp(/[a-z]+/);
        const is = inputStateFromString("bar and this is a load of other stuff");
        const hatesFoo = when(primitive, pm => pm.$matched.indexOf("foo") === -1);
        const m = hatesFoo.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            // good
        } else {
            assert.fail("Didn't match");
        }
    });

    it("ability to require content: match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        const m = requiresFoo.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "foo");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("ability to require content: no match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("bar");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        const m = requiresFoo.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("preserves properties", () => {
        const primitive = new Literal("foo");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        assert((requiresFoo as any).literal === primitive.literal);
    });

});
