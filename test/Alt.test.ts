import assert = require("power-assert");
import { fail } from "power-assert";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";

import { Alt, firstOf } from "../lib/Ops";

import { inputStateFromString } from "../lib/internal/InputStateFactory";

describe("Alt", () => {

    it("should not match when neither A or B matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("should not match when none of many matches", () => {
        const alt = new Alt("A", "B", "C", "D", "Cat");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("should match when A matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("AB");
        const m = alt.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(!!mmmm);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should match when B matches", () => {
        const alt = new Alt("A", "B");
        const is = inputStateFromString("BA");
        const m = alt.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(!!mmmm);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should match when C matches", () => {
        const alt = new Alt("A", "B", "C");
        const is = inputStateFromString("CXY");
        const m = alt.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            assert(m.$matched === "C");
        } else {
            fail("No match");
        }
    });

    it("should match with 3 when early matcher matches", () => {
        const alt = new Alt("A", "B", "C");
        const is = inputStateFromString("AD");
        const m = alt.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(!!mmmm);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should work with firstOf and 3", () => {
        const alt = firstOf("A", "B", "C");
        const is = inputStateFromString("AD");
        const m = alt.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(!!mmmm);
        } else {
            assert.fail("Didn't match");
        }
    });

});

describe("firstOf", () => {

    it("should produce correct result with 2", () => {
        const fof = firstOf("a", "b");
        const alt = new Alt("a", "b");
        assert.deepEqual(fof, alt);
    });

    it("should produce correct result with 4", () => {
        const fof = firstOf("a", "b", "c", /cardigans/);
        const alt = new Alt("a", "b", "c", /cardigans/);
        assert.deepEqual(fof, alt);
    });

});
