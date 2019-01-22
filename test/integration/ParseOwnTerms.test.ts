/**
 * This stuff is used in tree-parser-gui
 * It's easier to test it here.
 */

import * as assert from "assert";
import { microgrammar, optional, isPatternMatch, atLeastOne } from "../..";
import { stringifyTree } from "stringify-tree";
import { MatchFailureReport, MatchPrefixResult, matchPrefixSuccess } from "../../lib/MatchPrefixResult";
import { firstOf, MatchingLogic, InputState } from "../../lib";
import { TerminalPatternMatch } from "../../lib/PatternMatch";
import { LangStateMachine, LangState } from "../../lib/matchers/lang/LangStateMachine";
import { Normal, EscapeNextCharacter } from "../../lib/matchers/lang/cfamily/States";

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

function regexLiteral(): MatchingLogic {
    return new DelimitedLiteral("/");
}

// TODO: pass in an inner matcher, support nesting
class DelimitedLiteral implements MatchingLogic {
    public readonly $id = `${this.delimiter} ... ${this.delimiter}`;

    constructor(public readonly delimiter: string,
        public readonly escapeChar: string = "\\"
    ) {
        if (delimiter.length !== 1) {
            throw new Error("That is not gonna work. Delimiters are 1 char");
        }
        if (escapeChar.length !== 1) {
            throw new Error("That is not gonna work. escapeChar must be 1 char");
        }
    }
    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        const delimiter = this.delimiter;
        const initialOffset = is.offset;
        let currentIs = is; // is this needed? seems likely.
        if (is.peek(1) !== delimiter) {
            return MatchFailureReport.from({
                $matcherId: "JS Regexp",
                $offset: initialOffset,
                cause: `No opening ${delimiter}; saw ${is.peek(1)} instead`
            });
        }
        currentIs = currentIs.consume(delimiter, "Opening delimiter");
        let matched = delimiter;
        const sm = new DelimiterWithEscapeChar(delimiter, this.escapeChar);
        while (sm.state !== Done) {
            const next = currentIs.peek(1);
            if (next.length === 0) {
                // out of input
                return MatchFailureReport.from({
                    $matcherId: "JS Regexp",
                    $offset: initialOffset,
                    cause: `End of input before the closing ${delimiter}`,
                });
            }
            sm.consume(next);
            matched += next;
            currentIs = currentIs.consume(next, "Looking for the end of a regexp");
        }

        return matchPrefixSuccess(new TerminalPatternMatch(
            "JS Regexp", matched, is.offset, matched))
    }
}

const Done = new LangState("DONE", false, false);
export class DelimiterWithEscapeChar extends LangStateMachine {

    constructor(public readonly endChar: string,
        public readonly escapeChar: string,
        state: LangState = Normal) {
        super(state);
    }

    public clone(): DelimiterWithEscapeChar {
        return new DelimiterWithEscapeChar(this.endChar, this.escapeChar, this.state);
    }

    public consume(ch: string): void {
        switch (this.state) {
            case Done:
                break;
            case EscapeNextCharacter:
                this.state = Normal;
                break;
            case Normal:
                switch (ch) {
                    case this.escapeChar:
                        this.state = EscapeNextCharacter;
                        break;
                    case this.endChar:
                        this.state = Done;
                        break;
                    default:
                    // no change
                }
        }
    }
}