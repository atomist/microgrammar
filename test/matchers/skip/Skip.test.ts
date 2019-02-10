import { Microgrammar } from "../../../lib/Microgrammar";
import { Alt } from "../../../lib/Ops";

import * as assert from "power-assert";
import { WhiteSpaceSensitive } from "../../../lib/Config";
import { inputStateFromString } from "../../../lib/internal/InputStateFactory";
import {
    RestOfLine,
    skipTo,
    yadaYadaThen,
    yadaYadaThenThisButNotThat,
} from "../../../lib/matchers/skip/Skip";
import { isSuccessfulMatch } from "../../../lib/MatchPrefixResult";
import { isSuccessfulMatchReport } from "../../../lib/MatchReport";

describe("Skip", () => {

    const desirable = Microgrammar.fromDefinitions({
        beast: new Alt("dog", "cat", "pig"),
        activity: yadaYadaThenThisButNotThat("spa", "shoplifting"),
        last: yadaYadaThen("happiness"),
    });

    it("yada yada is acceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell spa and then happiness , perhaps") as any;
        assert(m);
        assert.strictEqual(m.beast , "pig");
        assert.strictEqual(m.activity , "spa");
        assert.strictEqual(m.last , "happiness");
    });

    it("yada yada is unacceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell shoplifting spa and then happiness , perhaps") as any;
        assert(!m);
    });

    it("rest of line to end of line", () => {
        const input = "The quick brown\nfox jumps over\nthe lazy dog";
        const pm = RestOfLine.matchPrefix(inputStateFromString(input), {}, {});
        assert.strictEqual(isSuccessfulMatch(pm) && pm.$matched , "The quick brown");
    });

    it("rest of line consumes remaining input", () => {
        const input = "The quick brown fox jumps over the lazy dog";
        const pm = RestOfLine.matchPrefix(inputStateFromString(input), {}, {});
        assert.strictEqual(isSuccessfulMatch(pm) && pm.$matched , input);
    });

    it("skipTo jumps to complicated matcher and preserves structure", () => {
        const b = skipTo({
            ...WhiteSpaceSensitive,
            _start: "${",
            name: /[a-z]+/,
            _end: "}",
        });
        const is = inputStateFromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "HEY YOU ${thing}");
            const pm = m.toPatternMatch() as any;
            assert.strictEqual(pm.name, "thing",
                "Couldn't find name property: Structure was " + JSON.stringify(pm, null, 2));
        } else {
            assert.fail("Didn't match:" + JSON.stringify(m));
        }
    });

});
