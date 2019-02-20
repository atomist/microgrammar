import * as assert from "assert";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { toParseTree } from "../../lib/MatchReport";
import { microgrammar } from "../../lib/microgrammarConstruction";
import { firstOf } from "../../lib/Ops";
import { Literal } from "../../lib/Primitives";

describe("toParseTree", () => {
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

    it("labels the children of a concat with their names", () => {
        const mg = microgrammar({
            first: "foo",
            second: "bar",
        });

        const inputString = "foo bar";
        const report = mg.perfectMatch(inputString);
        const treeNode = toParseTree(report);

        assert.strictEqual(treeNode.$name, "Concat");
        assert.strictEqual(treeNode.$value, "foo bar");
        assert.strictEqual(treeNode.$offset, 0);
        assert.strictEqual(treeNode.$children.length, 3);

        const firstChild = treeNode.$children[0];
        assert.strictEqual(firstChild.$value, "foo");
        assert.strictEqual(firstChild.$offset, 0);
        assert.strictEqual(firstChild.$name, "first");
        assert.strictEqual(firstChild.$children.length, 1);

        const firstGrandchild = firstChild.$children[0];
        assert.strictEqual(firstGrandchild.$value, "foo");
        assert.strictEqual(firstGrandchild.$name, "Literal");

        const whitespaceChild = treeNode.$children[1];
        assert.strictEqual(whitespaceChild.$value, " ");
        assert.strictEqual(whitespaceChild.$offset, 3);
        assert.strictEqual(whitespaceChild.$name, "Whitespace");

        const secondChild = treeNode.$children[2];
        assert.strictEqual(secondChild.$value, "bar");
        assert.strictEqual(secondChild.$offset, 4);
        assert.strictEqual(secondChild.$name, "second");
        assert.strictEqual(secondChild.$children.length, 1);
    });

});
