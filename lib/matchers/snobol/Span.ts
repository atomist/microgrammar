import { InputState } from "../../InputState";
import { failedMatchReport } from "../../internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "../../internal/matchReport/terminalMatchReport";
import { MatchingLogic } from "../../Matchers";
import {
    MatchPrefixResult,
} from "../../MatchPrefixResult";
import {
    MatchReport, toMatchPrefixResult,
} from "../../MatchReport";

/**
 * Inspired by Snobol SPAN: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * SPAN(S) matches one or more subject characters from the set in S.
 * SPAN must match at least one subject character, and will match the LONGEST subject string possible.
 */
export class Span implements MatchingLogic {

    constructor(public characters: string) {
    }

    get $id() {
        return `Span[${this.characters}]`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        let currentIs = is;
        let matched = "";
        while (!currentIs.exhausted() && this.characters.indexOf(currentIs.peek(1)) > -1) {
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
        }
        return (currentIs !== is) ?
            successfulMatchReport(this,
                // why is the value an inputstate?
                { matched, offset: is.offset, valueRepresented: { value: currentIs } }) :
            failedMatchReport(this, {
                offset: is.offset, matched,
                reason:
                    `No characters found. Looking for [${this.characters}], found [${currentIs.peek(1)}]`,
            });
    }
}
