import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { Microgrammar } from "../lib/Microgrammar";
import {
    Opt,
    optional,
} from "../lib/Ops";
import { PatternMatch } from "../lib/PatternMatch";
import { Literal } from "../lib/Primitives";

import * as assert from "power-assert";
import { isSuccessfulMatchReport } from "../lib/MatchReport";

describe("Opt", () => {

    it("should match when matcher doesn't match", () => {
        const alt = new Opt("A");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            const mmmm = m.toPatternMatch();
            assert.strictEqual(mmmm.$value, undefined);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should match when matcher matches", () => {
        const alt = new Opt("A");
        const is = inputStateFromString("AB");
        const m = alt.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            const mmmm = m.toPatternMatch();
            assert.strictEqual(mmmm.$value, "A");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test raw opt missing", () => {
        const content = "";
        const mg = new Opt(new Literal("x"));
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as PatternMatch;
        // console.log(JSON.stringify(result));
        assert.strictEqual(result.$matched, "");
    });

    it("test raw opt present", () => {
        const content = "x";
        const mg = new Opt(new Literal("x"));
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as PatternMatch;
        // console.log(JSON.stringify(result));
        assert.strictEqual(result.$matched, "x");
    });

    it("not pull up single property", () => {
        const content = "x";
        const nested = Microgrammar.fromDefinitions({
            x: new Literal("x"),
        },
        );
        const mg = Microgrammar.fromDefinitions({
            x: optional(nested),
        },
        );

        const result = mg.firstMatch(content) as any;
        assert.strictEqual(result.x.x, "x");
    });

    it("pull up single property", () => {
        const content = "x";
        const nested = Microgrammar.fromDefinitions({
            x: new Literal("x"),
        },
        );
        const mg = Microgrammar.fromDefinitions({
            _x: optional(nested),
            x: ctx => !!ctx._x ? ctx._x.x : undefined,
        });

        const result = mg.firstMatch(content) as any;
        assert(result);
        assert.strictEqual(result.x, "x");
    });

});
