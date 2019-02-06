import * as assert from "assert";
import { Literal } from "../../lib";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { toDismatchTree } from "../../lib/MatchReport";

describe("Failing matches report useful stuff", () => {
    it("Describes a literal dismatch", async () => {
        const mg = new Literal("foo");
        const inputString = "barf";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const treeNode = toDismatchTree(report);

        assert.strictEqual(treeNode.$name, "Literal");
        assert.strictEqual(treeNode.$value, "");
        assert.strictEqual(treeNode.$offset, 0);
        assert.deepEqual(treeNode.$children, []);
        assert.strictEqual(treeNode.successful, false);
        assert.strictEqual(treeNode.description, "Did not match literal [foo]: saw [bar]");
    });
    it("Describes a literal dismatch with a prefix that works", async () => {
        const mg = new Literal("foo");
        const inputString = "four";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const treeNode = toDismatchTree(report);

        assert.strictEqual(treeNode.$name, "Literal");
        assert.strictEqual(treeNode.$value, "fo");
        assert.strictEqual(treeNode.$offset, 0);
        assert.deepEqual(treeNode.$children, []);
        assert.strictEqual(treeNode.successful, false);
        assert.strictEqual(treeNode.description, "Did not match literal [foo]: saw [fou]");
    });
});
