import * as assert from "assert";
import { firstOf, Literal, optional } from "../../lib";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { MatchExplanationTreeNode, toExplanationTree } from "../../lib/MatchReport";
import { microgrammar } from "../../lib/microgrammarConstruction";

describe("Failing matches report useful stuff", () => {
    it("Describes a literal dismatch", async () => {
        const mg = new Literal("foo");
        const inputString = "barf";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const treeNode = toExplanationTree(report);

        assert.strictEqual(treeNode.$name, "Literal");
        assert.strictEqual(treeNode.$value, "");
        assert.strictEqual(treeNode.$offset, 0);
        assert.deepEqual(treeNode.$children, []);
        assert.strictEqual(treeNode.successful, false);
        assert.strictEqual(treeNode.reason, "Did not match literal [foo]: saw [bar]");
    });

    it("Describes a literal dismatch with a prefix that works", async () => {
        const mg = new Literal("foo");
        const inputString = "four";
        const report = mg.matchPrefixReport(inputStateFromString(inputString));
        const treeNode = toExplanationTree(report);

        assert.strictEqual(treeNode.$name, "Literal");
        assert.strictEqual(treeNode.$value, "fo");
        assert.strictEqual(treeNode.$offset, 0);
        assert.deepEqual(treeNode.$children, []);
        assert.strictEqual(treeNode.successful, false);
        assert.strictEqual(treeNode.reason, "Did not match literal [foo]: saw [fou]");
    });

    it("Describes an Optional as a successful match with an unsuccessful one inside",
        () => {
            const mg = optional("foo");
            const inputString = "anything that does not start with foo";
            const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
            const treeNode = toExplanationTree(report);

            assert.strictEqual(treeNode.$name, "Optional");
            assert.strictEqual(treeNode.$value, "");
            assert.strictEqual(treeNode.$offset, 0);
            assert.strictEqual(treeNode.successful, true);
            assert.strictEqual(treeNode.reason, "Did not match, but that's OK; it's optional.");
            assert.strictEqual(treeNode.$children.length, 1);

            const innerTreeNode = treeNode.$children[0] as MatchExplanationTreeNode;
            assert.strictEqual(innerTreeNode.successful, false);
            assert.strictEqual(innerTreeNode.$name, "Literal");
        });

    it("Describes an Alt as various unsuccessful matches and one successful one", () => {
        const mg = firstOf("foo", "bar", "lizards", "four");
        const inputString = "lizards are fast";
        const report = mg.matchPrefixReport(inputStateFromString(inputString), {}, {});
        const treeNode = toExplanationTree(report);

        assert.strictEqual(treeNode.$name, "Alternative");
        assert.strictEqual(treeNode.$value, "lizards");
        assert.strictEqual(treeNode.$offset, 0);
        assert.strictEqual(treeNode.successful, true);
        assert.strictEqual(treeNode.$children.length, 3);

        const unsuccessfulChild = treeNode.$children[0];
        assert.strictEqual(unsuccessfulChild.successful, false);
        assert.strictEqual(unsuccessfulChild.$value, "");

        const successfulChild = treeNode.$children[2];
        assert.strictEqual(successfulChild.successful, true);
        assert.strictEqual(successfulChild.$value, "lizards");
    });

    it("Notices a value updated by a compute function", () => {
        const mg = microgrammar({
            banana: "banana",
            apple: "apple",
            _unbanana: ctx => ctx.banana = "lizard",
        });
        const inputString = "banana apple";
        const report = mg.exactMatchReport(inputString);
        const treeNode = toExplanationTree(report);

        const overwrittenNode = childNamed("banana", treeNode);
        assert.strictEqual(overwrittenNode.$value, "lizard");
        assert.strictEqual(overwrittenNode.$children.length, 2);

        const computeChild = overwrittenNode.$children[1];
        assert.strictEqual(computeChild.$name, "Compute");
        assert.strictEqual(computeChild.$value, "lizard");
        assert.strictEqual(computeChild.reason, "Overwritten by function in _unbanana");
    });
});

function childNamed(name: string, treeNode: MatchExplanationTreeNode): MatchExplanationTreeNode {
    return treeNode.$children.find(c => c.$name === name);
}
