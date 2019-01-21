/**
 * This stuff is used in tree-parser-gui
 * It's easier to test it here.
 */

import * as assert from "assert";
import { microgrammar, zeroOrMore, optional, isPatternMatch, atLeastOne } from "../..";
import { stringifyTree } from "stringify-tree";
import { MatchFailureReport } from "../../lib/MatchPrefixResult";

describe("Task of parsing mg terms", () => {
    it("Can parse two terms with regex", async () => {

        const input = `{
    first: termGrammar,
    second: /[a-zA-Z0-9]+/
}`;

        const termGrammar = microgrammar({
            phrase: `{ \${termses} }`, terms: {
                termses: atLeastOne({
                    termName: "first",
                    _colon: ":",
                    termGrammar: "termGrammar",
                    _possibleComma: ","
                }),
            }
        });

        const match = termGrammar.exactMatch(input);

        if (!isPatternMatch(match)) {
            const mfr = match as MatchFailureReport;
            console.log(stringifyTree(mfr, m => {
                if (m.$matched) {
                    return m.$matcherId + " --> " + JSON.stringify(m.$matched)
                }
                return m.$matcherId
            }
                , m => m.children))
            assert.fail(match.description);
        }
    });
});