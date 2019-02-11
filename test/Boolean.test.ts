import assert = require("power-assert");
import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { isSuccessfulMatchReport } from "../lib/MatchReport";
import { PatternMatch } from "../lib/PatternMatch";
import { LowercaseBoolean } from "../lib/Primitives";

describe("LowercaseBoolean", () => {

    it("matches true", () => {
        const r = LowercaseBoolean.matchPrefixReport(inputStateFromString("true"));
        if (isSuccessfulMatchReport(r)) {
            const pm = r.toPatternMatch();
            assert(pm.$value);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("matches false", () => {
        const r = LowercaseBoolean.matchPrefixReport(inputStateFromString("false"));
        if (isSuccessfulMatchReport(r)) {
            const pm = r.toPatternMatch();
            assert(!pm.$value);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("doesn't match junk", () => {
        const pm = LowercaseBoolean.matchPrefixReport(inputStateFromString("xyz"));
        assert(!isSuccessfulMatchReport(pm));
    });

});
