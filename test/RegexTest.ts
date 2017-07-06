import { inputStateFromString } from "../src/internal/InputStateFactory";

import { Microgrammar } from "../src/Microgrammar";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Regex } from "../src/Primitives";

import * as assert from "power-assert";
import { Break } from "../build/src/matchers/snobol/Break";

describe("Regex", () => {

    it("match word letters", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefix(is, {});
        assert(isPatternMatch(m));
        const match = m as PatternMatch;
        assert(match.$matched === "friday");
        assert(m.$offset === 0);
    });
    it("match word letters using anchor that will be recognized", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefix(is, {});
        assert(isPatternMatch(m));
        const match = m as PatternMatch;
        assert(match.$matched === "friday");
        assert(m.$offset === 0);
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
        const m = regexp.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    // Demonstrate how to achieve old style skipping behavior
    it("achieve non-anchored behavior with break", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("**friday 14");
        const withSkip = new Break(regexp, true);
        const m = withSkip.matchPrefix(is, {});
        assert(isPatternMatch(m));
        const match = m as PatternMatch;
        assert(match.$matched === "**friday");
        assert(match.$offset === 2);
        assert(match.$value === "friday");
    });

    it("matches regex length 20", () => matchRegexOfLength(20));

    it("matches regex length 1000", () => matchRegexOfLength(1000));

    it("matches regex length 5000", () => matchRegexOfLength(5000));

    function matchRegexOfLength(n: number) {
        const mg = Microgrammar.fromDefinitions<{r: string, other: string}>({
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
