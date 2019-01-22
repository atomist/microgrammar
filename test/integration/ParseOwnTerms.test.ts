/**
 * This stuff is used in tree-parser-gui
 * It's easier to test it here.
 */

import * as assert from "assert";
import {
    atLeastOne,
    isPatternMatch,
    microgrammar,
    optional,
} from "../..";
import { stringifyTree } from "stringify-tree";
import { MatchFailureReport } from "../../lib/MatchPrefixResult";
import { firstOf } from "../../lib";
import { regexLiteral } from "../../lib/matchers/lang/cfamily/javascript/regexpLiteral";
import { DelimitedLiteral } from "../../lib/matchers/lang/cfamily/DelimitedLiteral";

describe("Task of parsing mg terms", () => {
    it("Can parse two terms with regex", async () => {

        const input = `{
    first:  /[a-zA-Z0-9]+/,
    second: "exactly this"
}`;

        const termGrammar = microgrammar({
            phrase: `{ \${termses} }`, terms: {
                termses: atLeastOne({
                    termName: /[a-zA-Z0-9]+/,
                    _colon: ":",
                    termGrammar: firstOf(regexLiteral(),
                        new DelimitedLiteral('"')),
                    _possibleComma: optional(",")
                }),
            }
        });

        const match = termGrammar.exactMatch(input);

        if (!isPatternMatch(match)) {
            const mfr = match as MatchFailureReport;
            console.log(stringifyTree(mfr, m => {
                let output = m.$matcherId;
                if (m.$matched) {
                    output += " --> " + m.$matched
                }
                if (m.cause) {
                    output += " cuz: " + m.cause;
                }
                return output
            }
                , m => m.children))
            assert.fail(match.description);
            return;
        }
    });
});
