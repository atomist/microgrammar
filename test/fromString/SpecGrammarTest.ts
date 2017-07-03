import assert = require("power-assert");
import {exactMatch} from "../../src/internal/ExactMatch";
import {MicrogrammarSpec, specGrammar} from "../../src/internal/SpecGrammar";
import {isPatternMatch} from "../../src/PatternMatch";

describe("MicrogrammarFromStringTest", () => {

    it("can parse a series of literals and references", () => {
        const microgrammarSpecString = "->${fruit}<-";
        const specMatch = exactMatch<MicrogrammarSpec>(specGrammar, microgrammarSpecString);
        if (isPatternMatch(specMatch)) {
            assert(specMatch.these.length === 1);
            assert.deepEqual(justTheData(specMatch),
            { these: [ {
                elementName: "fruit", // TODO: this doesn't belong here. Is it a bug in concat?
                literal: "->", element: {elementName: "fruit"}}]
            , trailing: "<-"});
        } else {
            assert.fail();
        }
    });

    it("can parse three references in succession", () => {
        const specString = "->${fruit}${arrow}${drink}!";
        const specMatch = exactMatch<MicrogrammarSpec>(specGrammar, specString);
        if (isPatternMatch(specMatch)) {
            assert(specMatch.these.length === 3);
            assert(specMatch.these[0].element.elementName === "fruit");
            assert(specMatch.these[1].element.elementName === "arrow");
            assert(specMatch.these[2].element.elementName === "drink");
            assert(specMatch.trailing === "!");
        } else {
            assert.fail();
        }
    });
});

// This will let you print a nested match.
// (Some of the internal fields are recursive, which can't print;
//  this strips all internal fields)
// I want this kind of functionality more globally; I'd rather return
// to callers of the Microgrammar API matches that have only their data.
// Or at least give them a way to convert it to only their data.
function justTheData(match: any): any {
    if (Array.isArray(match)) {
        return match.map(m => justTheData(m));
    }

    if (typeof match !== "object") {
        return match;
    }
    const output = {}; // it is not a const, I mutate it, but tslint won't let me declare otherwise :-(
    for (const p in match.$context || match) {
        if (!(p.indexOf("_") === 0 || p.indexOf("$") === 0)) {
            output[p] = justTheData(match[p]);
        }
    }
    return output;
}
