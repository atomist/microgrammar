import assert = require("power-assert");
import { InputState } from "../src/InputState";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { LowercaseBoolean } from "../src/Primitives";

describe("LowercaseBoolean", () => {

    it("matches true", () => {
        const pm = LowercaseBoolean.matchPrefix(InputState.fromString("true")) as PatternMatch;
        assert(isPatternMatch(pm));
        assert(pm.$value);
    });

    it("matches false", () => {
        const pm = LowercaseBoolean.matchPrefix(InputState.fromString("false")) as PatternMatch;
        assert(isPatternMatch(pm));
        assert(!pm.$value);
    });

    it("doesn't match junk", () => {
        const pm = LowercaseBoolean.matchPrefix(InputState.fromString("xyz")) as PatternMatch;
        assert(!isPatternMatch(pm));
    });

});
