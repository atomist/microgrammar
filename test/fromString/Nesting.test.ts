import { Microgrammar } from "../../lib/Microgrammar";

import * as assert from "power-assert";
import { fromString } from "../../lib/internal/MicrogrammarSpecParser";
import { Alt } from "../../lib/Ops";
import { Rep1Sep, RepSep } from "../../lib/Rep";

describe("Nesting in Microgrammar.fromString", () => {

    it("nest simple", () => {
        const content = "cats can suffer from fleas and can suffer from worms";
        const mg = Microgrammar.fromString<{ catStatement: any }>("cats ${catStatement}", {
            catStatement: new RepSep(fromString("can suffer from ${bug}", {
                bug: /[a-z]+/,
            }), "and"),
        });
        const result = mg.findMatches(content) as any[];
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].catStatement.length , 2);
        assert(result[0].catStatement[0].bug = "fleas");
        assert(result[0].catStatement[1].bug = "worms");
    });

    it("uses dictionary in nested sentences", () => {
        const dictionary = {
            bug: /[a-z]+/,
            activity: new Alt("playing", "grooming"),
        };
        const content = "cats can suffer from fleas and can suffer from worms but enjoy grooming & playing";
        const mg = Microgrammar.fromString<{ catProblems: Array<{ bug: string }>, catActivities: string }>(
            "cats ${catProblems} but enjoy ${catActivities}", {
                catProblems: new Rep1Sep(fromString("can suffer from ${bug}", dictionary), "and"),
                catActivities: new Rep1Sep(dictionary.activity, "&"),
            });
        const result = mg.findMatches(content);
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].catProblems.length , 2);
        assert(result[0].catProblems[0].bug = "fleas");
        assert(result[0].catProblems[1].bug = "worms");
        assert.deepEqual(result[0].catActivities, ["grooming", "playing"]);
    });

});
