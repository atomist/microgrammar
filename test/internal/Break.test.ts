import { Concat } from "../../lib/matchers/Concat";
import {
    Integer,
    Literal,
    Regex,
} from "../../lib/Primitives";

import { Break } from "../../lib/internal/Break";

import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { Span } from "../../lib/matchers/snobol/Span";
import { Alt } from "../../lib/Ops";

import * as assert from "power-assert";
import { WhiteSpaceSensitive } from "../../lib/Config";
import { isSuccessfulMatchReport } from "../../lib/MatchReport";

describe("Break", () => {

    it("break matches exhausted", () => {
        const b = new Break(new Literal("14"));
        const is = inputStateFromString("");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches another matcher", () => {
        const b = new Break(new Regex(/[a-z]/));
        const is = inputStateFromString("HEY YOU banana");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "HEY YOU ");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches a complicated matcher", () => {
        const b = new Break(
            Concat.of({
                ...WhiteSpaceSensitive,
                _start: "${",
                name: new Regex(/[a-z]+/),
                _end: "}",
            }));
        const is = inputStateFromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "HEY YOU ");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches", () => {
        const b = new Break(new Literal("14"));
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "friday ");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("break to Alt", () => {
        const b = new Break(new Alt("14", "44"));
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === "friday ");
        } else {
            assert.fail("did not match");
        }

        const is2 = inputStateFromString("friday 44");
        const m2 = b.matchPrefixReport(is2, {}, {});
        if (isSuccessfulMatchReport(m2)) {
            assert(m2.matched === "friday ");
        } else {
            assert.fail("did not match");
        }
    });

    it("break matches and consumes", () => {
        const b = new Break(new Literal("14"), true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "friday 14");
            assert(m.toPatternMatch().$value === "14");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("break and consume uses value", () => {
        const b = new Break(Integer, true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === "friday 14");
            assert(m.toValueStructure() === 14);
        } else {
            assert.fail("did not match");
        }
    });

    it("break matches nothing as it comes immediately", () => {
        const b = new Break(new Literal("friday"));
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches all in concat", () => {
        const b = new Break(new Literal("14"));
        const c = Concat.of({
            prefix: b,
            number: new Span("41"),
        });
        const is = inputStateFromString("friday 14");
        const m = c.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert(m.matched === "friday 14");

        } else {
            assert.fail("Didn't match");
        }
    });

});
