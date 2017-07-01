import assert = require("power-assert");
import { fail } from "power-assert";

import { InputState, inputStateFromString } from "../src/InputState";
import { Alt } from "../src/Ops";
import { isPatternMatch } from "../src/PatternMatch";

describe("Alt", () => {

    it("should not match when neither A or B matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    it("should not match when none of many matches", () => {
        const alt = new Alt("A", "B", "C", "D", "Cat");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    it("should match when A matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("AB");
        const m = alt.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("should match when B matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("BA");
        const m = alt.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("should match when C matches", () => {
        const alt = new Alt("A", "B", "C");
        const is = inputStateFromString("CXY");
        const m = alt.matchPrefix(is, {});
        if (isPatternMatch(m)) {
            assert(m.$matched === "C");
        } else {
            fail("No match");
        }
    });

    it("should match with 3 when early matcher matches", () => {
        const alt = new Alt("A", "B", "C");
        const is = inputStateFromString("AD");
        const m = alt.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

});
