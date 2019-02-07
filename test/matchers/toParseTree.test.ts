import * as assert from "assert";
import { firstOf } from "../..";
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

    // what is the toParseTree of a successful non-match from Optional?

    it("Sees only the matched alternative in an alt", () => {
        const mg = firstOf("foo", "bar", "lizards", "four");
        const inputString = "lizards are fast";
        const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
        const treeNode = toParseTree(report);

        assert.strictEqual(treeNode.$name, "Alternative");
        assert.strictEqual(treeNode.$value, "lizards");
        assert.strictEqual(treeNode.$offset, 0);
        assert.strictEqual(treeNode.$children.length, 1);

        const successfulChild = treeNode.$children[0];
        assert.strictEqual(successfulChild.$value, "lizards");
        assert.strictEqual(successfulChild.$offset, 0);
        assert.strictEqual(successfulChild.$name, "Literal");
    });

});
