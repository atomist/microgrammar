import assert = require("power-assert");
import { inputStateFromString } from "../src/internal/InputStateFactory";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { LowercaseBoolean } from "../src/Primitives";

describe("LowercaseBoolean", () => {

    it("matches true", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("true"), {}) as PatternMatch;
        assert(isPatternMatch(pm));
        assert(pm.$value);
    });

    it("matches false", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("false"), {}) as PatternMatch;
        assert(isPatternMatch(pm));
        assert(!pm.$value);
    });

    it("doesn't match junk", () => {
        const pm = LowercaseBoolean.matchPrefix(inputStateFromString("xyz"), {}) as PatternMatch;
        assert(!isPatternMatch(pm));
    });

});
