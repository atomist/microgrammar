import { InputState } from "../../InputState";
import { MatchingLogic } from "../../Matchers";
import {MatchFailureReport, MatchPrefixResult, matchPrefixSuccess} from "../../MatchPrefixResult";
import { TerminalPatternMatch } from "../../PatternMatch";

/**
 * Inspired by Snobol SPAN: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * SPAN(S) matches one or more subject characters from the set in S.
 * SPAN must match at least one subject character, and will match the LONGEST subject string possible.
 */
export class Span implements MatchingLogic {

    public $id = `Span[${this.characters}]`;

    constructor(public characters: string) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        let currentIs = is;
        let matched = "";
        while (!currentIs.exhausted() && this.characters.indexOf(currentIs.peek(1)) > -1) {
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
        }
        return (currentIs !== is) ?
           matchPrefixSuccess(new TerminalPatternMatch(this.$id, matched, is.offset, currentIs) ) :
            new MatchFailureReport(this.$id, is.offset, context);
    }
}
