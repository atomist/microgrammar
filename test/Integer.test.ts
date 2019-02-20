import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { Integer } from "../lib/Primitives";

import * as assert from "power-assert";
import { isSuccessfulMatchReport } from "../lib/MatchReport";

describe("Integer performance optimizations", () => {

    it("should recognize valid prefixes", () => {
        for (let i = 0; i <= 10; i++) {
            assert(Integer.canStartWith("" + i));
        }
    });

    it("should recognize invalid prefixes", () => {
        for (const c of ["-", "$", "a", "n", "*"]) {
            assert(!Integer.canStartWith(c));
        }
    });
});

describe("Integer matching", () => {

    it("test one digit", () => {
        const is = inputStateFromString("1");
        const m = Integer.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "1");
            assert.strictEqual(m.toPatternMatch().$value, 1);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("accept 0", () => {
        const is = inputStateFromString("0");
        const m = Integer.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "0");
            assert.strictEqual(m.toPatternMatch().$value, 0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("not accept leading 0", () => {
        const is = inputStateFromString("01");
        const m = Integer.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "0");
            assert.strictEqual(m.toPatternMatch().$value, 0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test multiple digits", () => {
        const is = inputStateFromString("105x");
        const m = Integer.matchPrefixReport(is);
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "105");
            assert.strictEqual(m.toPatternMatch().$value, 105);
        } else {
            assert.fail("Didn't match");
        }
    });

});
