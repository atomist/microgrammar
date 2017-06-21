import assert = require("power-assert");

import { InputState } from "../src/InputState";
import { Alt } from "../src/Ops";
import { isPatternMatch } from "../src/PatternMatch";

describe("Alt", () => {

    it("should not match when neither A or B matches", () => {
        const alt = new Alt("A", "B");
        const is = InputState.fromString("friday 14");
        const m = alt.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    it("should match when A matches", () => {
        const alt = new Alt("A", "B");
        const is = InputState.fromString("AB");
        const m = alt.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("should match when B matches", () => {
        const alt = new Alt("A", "B");
        const is = InputState.fromString("BA");
        const m = alt.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

});
