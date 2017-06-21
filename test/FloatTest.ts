import { expect } from "chai";
import { InputState } from "../src/InputState";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Float } from "../src/Primitives";

describe("FloatTest", () => {

    it("test one digit", () => {
        const is = InputState.fromString("1");
        const m = Float.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("1");
        expect(match.$value).to.equal(1.0);
    });

    it("test multiple digits", () => {
        const is = InputState.fromString("105x");
        const m = Float.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("105");
        expect(match.$value).to.equal(105.0);
    });

    it("test with decimal", () => {
        const is = InputState.fromString("105.25555xxx");
        const m = Float.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("105.25555");
        expect(match.$value).to.equal(105.25555);
    });

    it("test signed", () => {
        const is = InputState.fromString("-105.25555xxx");
        const m = Float.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("-105.25555");
        expect(match.$value).to.equal(-105.25555);
    });

    it("test no leading digit", () => {
        const is = InputState.fromString("-.25555xxx");
        const m = Float.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("-.25555");
        expect(match.$value).to.equal(-0.25555);
    });
});
