import * as assert from "assert";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { toValueStructure } from "../../lib/MatchReport";
import { Literal } from "../../lib/Primitives";

describe("Converting a match report to a value structure", () => {
    it("Converts a literal to a string", async () => {
        const mg = new Literal("foo");
        const inputString = "foobar";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const valueStructure = toValueStructure(report);

        assert.strictEqual(valueStructure, "foo");

    });
});
