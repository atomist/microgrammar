import assert = require("power-assert");
import { exactMatch } from "../../src/internal/ExactMatch";
import { MicrogrammarSpec, specGrammar } from "../../src/internal/SpecGrammar";
import {isPatternMatch} from "../../src/PatternMatch";

describe("SpecGrammar", () => {

    it("can parse a series of literals and references", () => {
        const microgrammarSpecString = "->${fruit}<-";
        const specMatch = exactMatch<MicrogrammarSpec>(specGrammar, microgrammarSpecString);
        if (isPatternMatch(specMatch)) {
            assert(specMatch.these.length === 1);
            const json = JSON.stringify(specMatch.matchedStructure());
            assert(json ===
                JSON.stringify({
                    these: [{
                        elementName: "fruit", // TODO: this doesn't belong here. Is it a bug in concat?
                        literal: "->", element: {elementName: "fruit"},
                    }]
                    , trailing: "<-",
                }),
                json);
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
