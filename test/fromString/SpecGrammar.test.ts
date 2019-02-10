import assert = require("power-assert");
import { DefaultFromStringOptions } from "../../lib/internal/CompleteFromStringOptions";
import { exactMatch, exactMatchReport } from "../../lib/internal/ExactMatch";
import {
    MicrogrammarSpec,
    specGrammar,
} from "../../lib/internal/SpecGrammar";
import { isSuccessfulMatchReport } from "../../lib/MatchReport";
import { isPatternMatch } from "../../lib/PatternMatch";

describe("SpecGrammar", () => {

    it("can parse a series of literals and references", () => {
        const microgrammarSpecString = "->${fruit}<-";
        const specMatch = exactMatchReport(specGrammar(DefaultFromStringOptions), microgrammarSpecString);
        if (isSuccessfulMatchReport(specMatch)) {
            const vs = specMatch.toValueStructure<MicrogrammarSpec>();
            assert.strictEqual(vs.these.length , 1);
            assert.deepEqual(vs,
                {
                    these: [{
                        literal: "->", element: { elementName: "fruit" },
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
            assert.strictEqual(specMatch.these.length , 3);
            assert.strictEqual(specMatch.these[0].element.elementName , "fruit");
            assert.strictEqual(specMatch.these[1].element.elementName , "arrow");
            assert.strictEqual(specMatch.these[2].element.elementName , "drink");
            assert.strictEqual(specMatch.trailing , "!");
        } else {
            assert.fail();
        }
    });
});
