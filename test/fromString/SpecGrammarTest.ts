import assert = require("power-assert");
import { DefaultFromStringOptions } from "../../src/internal/CompleteFromStringOptions";
import { exactMatch } from "../../src/internal/ExactMatch";
import { MicrogrammarSpec, specGrammar } from "../../src/internal/SpecGrammar";
import {isPatternMatch} from "../../src/PatternMatch";

describe("SpecGrammar", () => {

    it("can parse a series of literals and references", () => {
        const microgrammarSpecString = "->${fruit}<-";
        const specMatch = exactMatch<MicrogrammarSpec>(specGrammar(DefaultFromStringOptions), microgrammarSpecString);
        if (isPatternMatch(specMatch)) {
            assert(specMatch.these.length === 1);
            assert.deepEqual(specMatch.matchedStructure(),
               {
                    these: [{
                        literal: "->", element: {elementName: "fruit"},
                    }]
                    , trailing: "<-",
                });
        } else {
            assert.fail();
        }
    });

    it("can parse three references in succession", () => {
        const specString = "->${fruit}${arrow}${drink}!";
        const specMatch = exactMatch<MicrogrammarSpec>(specGrammar(DefaultFromStringOptions), specString);
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
