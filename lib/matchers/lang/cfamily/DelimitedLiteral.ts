import { InputState } from "../../../InputState";
import { failedMatchReport } from "../../../internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "../../../internal/matchReport/terminalMatchReport";
import { MatchingLogic } from "../../../Matchers";
import {
    MatchPrefixResult,
} from "../../../MatchPrefixResult";
import {
    MatchReport,
    toMatchPrefixResult,
} from "../../../MatchReport";
import {
    LangState,
    LangStateMachine,
} from "../LangStateMachine";
import {
    EscapeNextCharacter,
    Normal,
} from "./States";

// TODO: pass in an inner matcher, support nesting
export class DelimitedLiteral implements MatchingLogic {
    public readonly $id = `${this.delimiter} ... ${this.delimiter}`;

    public readonly parseNodeName = "DelimitedLiteral";

    constructor(public readonly delimiter: string,
                public readonly escapeChar: string = "\\",
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
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }
    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchReport {
        const delimiter = this.delimiter;
        const initialOffset = is.offset;
        let currentIs = is; // is this needed? seems likely.
        if (is.peek(1) !== delimiter) {
            return failedMatchReport(this, {
                offset: initialOffset,
                parseNodeName: this.parseNodeName,
                reason: `No opening ${delimiter}; saw ${is.peek(1)} instead`,
            });
        }
        currentIs = currentIs.consume(delimiter, "Opening delimiter");
        let matched = delimiter;
        const sm = new DelimiterWithEscapeChar(delimiter, this.escapeChar);
        while (sm.state !== Done) {
            const next = currentIs.peek(1);
            if (next.length === 0) {
                return failedMatchReport(this, {
                    offset: initialOffset,
                    parseNodeName: this.parseNodeName,
                    reason: `End of input before the closing ${delimiter}`,
                });
            }
            sm.consume(next);
            matched += next;
            currentIs = currentIs.consume(next, `Looking for a closing ${delimiter}`);
        }

        return successfulMatchReport(this, {
            matched,
            parseNodeName: this.parseNodeName,
            offset: is.offset,
        });
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
