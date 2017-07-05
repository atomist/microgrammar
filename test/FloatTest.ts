import { expect } from "chai";
import { inputStateFromString } from "../src/internal/InputStateFactory";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Float } from "../src/Primitives";

describe("Float", () => {

    it("test one digit", () => {
        const is = inputStateFromString("1");
        const m = Float.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("1");
        expect(match.$value).to.equal(1.0);
    });

    it("test multiple digits", () => {
        const is = inputStateFromString("105x");
        const m = Float.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("105");
        expect(match.$value).to.equal(105.0);
    });

    it("test with decimal", () => {
        const is = inputStateFromString("105.25555xxx");
        const m = Float.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("105.25555");
        expect(match.$value).to.equal(105.25555);
    });

    it("test signed", () => {
        const is = inputStateFromString("-105.25555xxx");
        const m = Float.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("-105.25555");
        expect(match.$value).to.equal(-105.25555);
    });

    it("test no leading digit", () => {
        const is = inputStateFromString("-.25555xxx");
        const m = Float.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("-.25555");
        expect(match.$value).to.equal(-0.25555);
    });
});
