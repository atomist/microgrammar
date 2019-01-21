/**
 * This stuff is used in tree-parser-gui
 * It's easier to test it here.
 */

import * as assert from "assert";
import { microgrammar, zeroOrMore, optional, isPatternMatch, atLeastOne, Concat } from "../..";
import { stringifyTree } from "stringify-tree";
import { MatchFailureReport, MatchPrefixResult, matchPrefixSuccess } from "../../lib/MatchPrefixResult";
import { firstOf, MatchingLogic, InputState, Regex } from "../../lib";
import { isTreePatternMatch, PatternMatch, TerminalPatternMatch } from "../../lib/PatternMatch";
import { LangStateMachine, LangState } from "../../lib/matchers/lang/LangStateMachine";
import { Normal, SlashSlashComment, SlashStarComment, DoubleString, EscapeNextCharacter } from "../../lib/matchers/lang/cfamily/States";
import { CFamilyStateMachine } from "../../lib/matchers/lang/cfamily/CFamilyStateMachine";
import { toMatchingLogic } from "../../lib/matchers/Concat";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";

describe("Task of parsing mg terms", () => {
    it("Can parse two terms with regex", async () => {

        const input = `{
    first:  /[a-zA-Z0-9]+/,
    second: /[a-zA-Z0-9]+/
}`;

        const termGrammar = microgrammar({
            phrase: `{ \${termses} }`, terms: {
                termses: atLeastOne({
                    termName: /[a-zA-Z0-9]+/,
                    _colon: ":",
                    termGrammar: firstOf(regexLiteral(),
                        {
                            // $id: "stringLiteral"
                            open: '"'
                        }
                    ),
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

        const treeNode = new MicrogrammarBackedTreeNode("hi", match);
        console.log(stringifyTree(treeNode, tn => tn.$name, tn => tn.$children as any))
    });
});

function regexLiteral(): MatchingLogic {
    return new JavascriptRegexLiteral();
}

// TODO: pass in an inner matcher
class JavascriptRegexLiteral implements MatchingLogic {
    public readonly $id = "JS Regex";

    constructor() {
    }
    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        const delimiter = "/";
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
        const sm = new JavaRegexStateMachine();
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
            console.log("Consuming: " + next);
            sm.consume(next);
            matched += next;
            currentIs = currentIs.consume(next, "Looking for the end of a regexp");
        }

        console.log("Returning happy pattern match")
        return matchPrefixSuccess(new TerminalPatternMatch(
            "JS Regexp", matched, is.offset, matched))
    }
}

const Done = new LangState("DONE", false, false);
export class JavaRegexStateMachine extends LangStateMachine {

    constructor(state: LangState = Normal) {
        super(state);
    }

    public clone(): JavaRegexStateMachine {
        return new JavaRegexStateMachine(this.state);
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
                    case "\\":
                        this.state = EscapeNextCharacter;
                        break;
                    case "/":
                        this.state = Done;
                        break;
                    default:
                    // no change
                }
        }
    }
}
/**
 * TreeNode implementation backed by a microgrammar match
 */
class MicrogrammarBackedTreeNode implements TreeNode {

    public readonly $children: TreeNode[];

    public $value: string;

    public readonly $offset: number;

    constructor(public $name: string, m: PatternMatch) {
        this.$offset = m.$offset;
        this.$value = m.$matched;
        // Copy properties from the match
        Object.getOwnPropertyNames(m)
            .filter(prop => !prop.startsWith("$"))
            .forEach(prop => {
                this[prop] = m[prop];
            });
        if (isTreePatternMatch(m)) {
            const subs = m.submatches();
            this.$children = Object.getOwnPropertyNames(subs)
                .map(prop => {
                    const sub = subs[prop];
                    // console.log("Exposing child %s.%s as [%s]", $name, prop, stringify(sub));
                    return new MicrogrammarBackedTreeNode(prop, sub);
                });
        } else {
            // console.log("Exposing terminal %s as [%s]: value=[%s]", $name, stringify(m), m.$matched);
            this.$value = String(m.$value);
        }
    }

}

export interface TreeNode {
    readonly $name: string;
    $children: TreeNode[];
    $value?: string;
    readonly $offset: number;
}