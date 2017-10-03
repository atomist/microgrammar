import assert = require("power-assert");
import { inputStateFromString } from "../src/internal/InputStateFactory";
import { isSuccessfulMatch } from "../src/MatchPrefixResult";
import { PatternMatch } from "../src/PatternMatch";
import { LowercaseBoolean } from "../src/Primitives";

describe("LowercaseBoolean", () => {

    it("matches true", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("true")) as PatternMatch;
        if (isSuccessfulMatch(pm)) {
            const mmmm = pm.match as any;
            assert(mmmm.$value);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("matches false", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("false")) as PatternMatch;
        if (isSuccessfulMatch(pm)) {
            const mmmm = pm.match as any;
            assert(!mmmm.$value);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("doesn't match junk", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("xyz")) as PatternMatch;
        assert(!isSuccessfulMatch(pm));
    });

});
