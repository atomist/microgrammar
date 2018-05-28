import { inputStateFromString } from "../src/internal/InputStateFactory";
import { Microgrammar } from "../src/Microgrammar";
import { Alt } from "../src/Ops";
import { isPatternMatch } from "../src/PatternMatch";
import { Rep } from "../src/Rep";

import * as assert from "power-assert";
import { isSuccessfulMatch } from "../src/MatchPrefixResult";

describe("StringGrammarTest", () => {

    it("broken in concat", () => {
        const strings =
            Microgrammar.fromDefinitions<any>(
                {theString: new Alt(stringGrammar, "la")}).findMatches("\"    winter is coming \" la la la");
        const match = strings[0];
        assert(isPatternMatch(match));
        assert(match.$matched === "\"    winter is coming \"");
        assert(match.theString.text, "    winter is coming");
    });

    it("not broken without concat", () => {
        const result = new Alt(stringGrammar, "la").matchPrefix(inputStateFromString("\"    winter is coming \" la la la"), {}, {});
        if (isSuccessfulMatch(result)) {
            const match = result.match;
            if (isPatternMatch(match)) {
                assert(isPatternMatch(match));
                assert(match.$matched === "\"    winter is coming \"");
            }
            assert((match as any).text, "    winter is coming");
        } else {
            assert.fail("did not match");
        }
    });

});

const stringTextPattern = new Rep(new Alt("\\\"", /^[^"]/))
    .consumeWhiteSpace(false);

const stringGrammar: Microgrammar<any> =
    Microgrammar.fromDefinitions<any>({
        _p1: "\"",
        charArray: stringTextPattern,
        _p2: "\"",
        text: ctx => ctx.charArray.join(""),
        $id: "stringText",
    });
