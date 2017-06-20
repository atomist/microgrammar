import { expect } from "chai";
import { InputState } from "../src/InputState";
import { PatternMatch } from "../src/PatternMatch";
import { Regex } from "../src/Primitives";

describe("RegexTest", () => {

    it("match word letters", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = InputState.fromString("friday 14");
        const m = regexp.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("friday");
        expect(m.$offset).to.equal(0);
    });

    it("failed match", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = InputState.fromString("14 friday");
        const m = regexp.matchPrefix(is);
        expect(m.$isMatch).to.equal(false);
    });

    it("without anchors to skip content", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = InputState.fromString("**friday 14");
        const m = regexp.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        const match = m as PatternMatch;
        expect(match.$matched).to.equal("**friday");
        expect(match.$offset).to.equal(0);
        expect(match.$value).to.equal("friday");
        expect(m.$offset).to.equal(0);
    });

});
