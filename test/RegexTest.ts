import { inputStateFromString } from "../src/internal/InputStateFactory";

import { Microgrammar } from "../src/Microgrammar";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Regex } from "../src/Primitives";

import * as assert from "power-assert";

describe("Regex", () => {

    it("match word letters", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = inputStateFromString("friday 14");
        const m = regexp.matchPrefix(is);
        assert(isPatternMatch(m));
        const match = m as PatternMatch;
        assert(match.$matched === "friday");
        assert(m.$offset === 0);
    });

    it("failed match", () => {
        const regexp = new Regex(/^[a-z]+/);
        const is = inputStateFromString("14 friday");
        const m = regexp.matchPrefix(is);
        assert(!isPatternMatch(m));
    });

    it("without anchors to skip content", () => {
        const regexp = new Regex(/[a-z]+/);
        const is = inputStateFromString("**friday 14");
        const m = regexp.matchPrefix(is);
        assert(isPatternMatch(m));
        const match = m as PatternMatch;
        assert(match.$matched === "**friday");
        assert(match.$offset === 0);
        assert(match.$value === "friday");
        assert(m.$offset === 0);
    });

    it("matches regex length 20", () => matchRegexOfLength(20));

    it("matches regex length 1000", () => matchRegexOfLength(1000));

    it("matches regex length 5000", () => matchRegexOfLength(5000));

    function matchRegexOfLength(n: number) {
        const mg = Microgrammar.fromDefinitions<{r: string, other: string}>({
            r: /^[a-z]+/,
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
