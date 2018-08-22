import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { PatternMatch } from "../lib/PatternMatch";
import { Float } from "../lib/Primitives";

import * as assert from "power-assert";

describe("Float", () => {

    it("test one digit", () => {
        const is = inputStateFromString("1");
        const m = Float.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            assert(match.$matched === "1");
            assert(match.$value === 1.0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test multiple digits", () => {
        const is = inputStateFromString("105x");
        const m = Float.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            assert(match.$matched === "105");
            assert(match.$value === 105.0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test with decimal", () => {
        const is = inputStateFromString("105.25555xxx");
        const m = Float.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            assert(match.$matched === "105.25555");
            assert(match.$value === 105.25555);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test signed", () => {
        const is = inputStateFromString("-105.25555xxx");
        const m = Float.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            assert(match.$matched === "-105.25555");
            assert(match.$value === -105.25555);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test no leading digit", () => {
        const is = inputStateFromString("-.25555xxx");
        const m = Float.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            assert(match.$matched === "-.25555");
            assert(match.$value === -0.25555);
        } else {
            assert.fail("Didn't match");
        }
    });
});
