import { inputStateFromString } from "../lib/internal/InputStateFactory";

import { Microgrammar } from "../lib/Microgrammar";
import { Regex } from "../lib/Primitives";

import * as assert from "power-assert";
import { Break } from "../lib/internal/Break";
import { isSuccessfulMatchReport } from "../lib/MatchReport";

describe("Regex", () => {

    it("match word letters", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "friday");
            assert.strictEqual(m.offset, 0);
        } else {
            assert.fail("Didn't match");
        }
    });
    it("match word letters using anchor that will be recognized", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === "friday");
            assert(m.offset === 0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should add anchor if not present", () => {
        const regexp = new Regex(/[a-z]+/);
        assert(regexp.regex.source === "^[a-z]+");
    });

    it("should not add anchor if present", () => {
        const regexp = new Regex(/^[a-z]+/);
        assert(regexp.regex.source === "^[a-z]+");
    });

    it("failed match", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("14 friday");
        const m = regexp.matchPrefixReport(is);
        assert(!isSuccessfulMatchReport(m));
    });

    // Demonstrate how to achieve old style skipping behavior
    it("achieve non-anchored behavior with break", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("**friday 14");
        const withSkip = new Break(regexp, true);
        const m = withSkip.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === "**friday");
            assert(m.offset === 2);
            assert(m.toValueStructure() === "friday");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("matches regex length 20", () => matchRegexOfLength(20));

    it("matches regex length 1000", () => matchRegexOfLength(1000));

    it("matches regex length 5000", () => matchRegexOfLength(5000));

    function matchRegexOfLength(n: number) {
        const mg = Microgrammar.fromDefinitions<{ r: string, other: string }>({
            r: /[a-z]+/,
            other: ".",
        });
        let long = "";
        for (let i = 0; i < n; i++) {
            long += "a";
        }
        const m = mg.firstMatch(long + ".");
        assert(m);
        assert(m.r === long);
    }

});
