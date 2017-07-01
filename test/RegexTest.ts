import { expect } from "chai";
import { InputState, inputStateFromString } from "../src/InputState";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Regex } from "../src/Primitives";

describe("Regex", () => {

    it("match word letters", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("friday");
        expect(m.$offset).to.equal(0);
    });

    it("failed match", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = inputStateFromString("14 friday");
        const m = regexp.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(false);
    });

    it("without anchors to skip content", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("**friday 14");
        const m = regexp.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("**friday");
        expect(match.$offset).to.equal(0);
        expect(match.$value).to.equal("friday");
        expect(m.$offset).to.equal(0);
    });

});
