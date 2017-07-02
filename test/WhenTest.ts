import { expect } from "chai";
import { inputStateFromString } from "../src/internal/InputStateFactory";
import { when } from "../src/Ops";
import { isPatternMatch } from "../src/PatternMatch";
import { Literal } from "../src/Primitives";

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
        const m = matcher.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
    });

    it("when false should not match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const matcher = when(primitive, pm => false);
        const m = matcher.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(false);
    });

    it("ability to veto content", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const hatesFoo = when(primitive, pm => pm.$matched.indexOf("foo") === -1);
        const m = hatesFoo.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(false);
    });

    it("ability to veto content: not vetoed", () => {
        const primitive = new RegExp(/^[a-z]+/);
        const is = inputStateFromString("bar and this is a load of other stuff");
        const hatesFoo = when(primitive, pm => pm.$matched.indexOf("foo") === -1);
        const m = hatesFoo.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
    });

    it("ability to require content: match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("foo bar");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        const m = requiresFoo.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
    });

    it("ability to require content: no match", () => {
        const primitive = new Literal("foo");
        const is = inputStateFromString("bar");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        const m = requiresFoo.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(false);
    });

    it("preserves properties", () => {
        const primitive = new Literal("foo");
        const requiresFoo = when(primitive, pm => pm.$matched.indexOf("foo") !== -1);
        expect(requiresFoo.literal).to.equal(primitive.literal);
    });

});
