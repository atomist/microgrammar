import { expect } from "chai";
import { InputState } from "../src/InputState";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Integer } from "../src/Primitives";

describe("IntegerTest", () => {

    it("test one digit", () => {
        const is = InputState.fromString("1");
        const m = Integer.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("1");
        expect(match.$value).to.equal(1);
    });

    it("test multiple digits", () => {
        const is = InputState.fromString("105x");
        const m = Integer.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("105");
        expect(match.$value).to.equal(105);
    });

});
