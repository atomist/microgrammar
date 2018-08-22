import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { Integer } from "../lib/Primitives";

import * as assert from "power-assert";

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
        const m = Integer.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm;
            assert(match.$matched === "1");
            assert(match.$value === 1);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("accept 0", () => {
        const is = inputStateFromString("0");
        const m = Integer.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm;
            assert(match.$matched === "0");
            assert(match.$value === 0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("not accept leading 0", () => {
        const is = inputStateFromString("01");
        const m = Integer.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm;
            assert(match.$matched === "0");
            assert(match.$value === 0);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("test multiple digits", () => {
        const is = inputStateFromString("105x");
        const m = Integer.matchPrefix(is);
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm;
            assert(match.$matched === "105");
            assert(match.$value === 105);

        } else {
            assert.fail("Didn't match");
        }
    });

});
