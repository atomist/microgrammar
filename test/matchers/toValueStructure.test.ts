import * as assert from "assert";
import { firstOf, optional } from "../../lib";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { toValueStructure } from "../../lib/MatchReport";
import { microgrammar } from "../../lib/microgrammarConstruction";
import { Literal } from "../../lib/Primitives";

describe("Converting a match report to a value structure", () => {
    it("Converts a literal to a string", async () => {
        const mg = new Literal("foo");
        const inputString = "foobar";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const valueStructure = toValueStructure(report);

        assert.strictEqual(valueStructure, "foo");
    });

    it("gets the matched value from an alt", () => {
        const mg = firstOf("foo", "bar", "lizards", "four");
        const inputString = "lizards are fast";
        const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
        const valueStructure = toValueStructure(report);

        assert.strictEqual(valueStructure, "lizards");
    });

    it("gets undefined from an optional with unsuccessful inner",
        () => {
            const mg = optional("foo");
            const inputString = "anything that does not start with foo";
            const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
            const vs = toValueStructure(report);

            assert.strictEqual(vs, undefined);
        });

    it("gets the inner value from an optional with successful inner",
        () => {
            const mg = optional("foo");
            const inputString = "foo stuff";
            const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
            const vs = toValueStructure(report);

            assert.strictEqual(vs, "foo");
        });

    it("gets the inner structure of a Concat", () => {
        const mg = microgrammar({
            first: "foo",
            second: "bar",
        });

        const inputString = "foo bar";
        const report = mg.exactMatchReport(inputString);
        const vs = toValueStructure(report);

        assert.deepEqual(vs, {
            first: "foo", second: "bar",
        });
    });

    it("includes various properties that are added to the ctx", () => {
        const mg = microgrammar({
            first: "foo",
            second: "bar",
            synth: ctx => ctx.second + ctx.first,
            sneaky: ctx => { ctx.mutationsAreEvil = "but I am sneaky"; },
        });

        const inputString = "foo bar";
        const report = mg.exactMatchReport(inputString);
        const vs = toValueStructure(report);

        assert.deepEqual(vs, {
            first: "foo",
            second: "bar",
            synth: "barfoo",
            mutationsAreEvil: "but I am sneaky",
        });
    });
});
