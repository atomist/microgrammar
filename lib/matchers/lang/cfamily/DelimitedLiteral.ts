import {
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "../../../MatchPrefixResult";
import { TerminalPatternMatch } from "../../../PatternMatch";
import {
    LangState,
    LangStateMachine,
} from "../LangStateMachine";
import {
    EscapeNextCharacter,
    Normal,
} from "./States";
import { MatchingLogic } from "../../../Matchers";
import { InputState } from "../../../InputState";

// TODO: pass in an inner matcher, support nesting
export class DelimitedLiteral implements MatchingLogic {
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
                $matcherId: this.$id,
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
                    $matcherId: this.$id,
                    $offset: initialOffset,
                    cause: `End of input before the closing ${delimiter}`,
                });
            }
            sm.consume(next);
            matched += next;
            currentIs = currentIs.consume(next, `Looking for a closing ${delimiter}`);
        }

        return matchPrefixSuccess(new TerminalPatternMatch(
            this.$id, matched, is.offset, matched))
    }
}

const Done = new LangState("DONE", false, false);
class DelimiterWithEscapeChar extends LangStateMachine {

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