import * as assert from "assert";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { toParseTree } from "../../lib/MatchReport";
import { Literal } from "../../lib/Primitives";

describe("Viewing the match as a tree over the parsed file", () => {
    it("sees a single node", async () => {
        const mg = new Literal("foo");
        const inputString = "foobar";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const treeNode = toParseTree(report);

        assert.strictEqual(treeNode.$value, "foo");
        assert.strictEqual(treeNode.$offset, 0);
        assert.strictEqual(treeNode.$name, "Literal");
    });

});
