
import { toMatchingLogic } from "../../Concat";
import { InputState } from "../../InputState";
import { MatchingLogic } from "../../Matchers";
import { MatchPrefixResult } from "../../MatchPrefixResult";
import { isPatternMatch, MatchFailureReport, TerminalPatternMatch } from "../../PatternMatch";

/**
 * Inspired by SNOBOL BREAK: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * In SNOBOL
 * BREAK(S) matches "up to but not including" any character in S.
 * The string matched must always be followed in the subject by a character in S.
 * Unlike SPAN and NOTANY, BREAK will match the null string.
 * This implementation goes beyond SNOBOL, in that it allows the break to consume the end token,
 * and also allows the ability to specify a pattern that must not be found.
 */
export class Break implements MatchingLogic {

    public terminateOn: MatchingLogic;
    private badMatcher: MatchingLogic;

    /**
     * Consume input until (or until and including) the terminal match
     * @param breakOn desired terminal match
     * @param consume default false. Whether to consume the terminal match. If this is set to true,
     * the value of the match will be the match of the terminal pattern. Otherwise it will the preceding,
     * skipped content.
     * @param butNot pattern we don't want to see before the desired determinal match.
     * If we see this pattern before, the match breaks.
     */
    constructor(private breakOn: any, private consume: boolean = false, butNot?: any) {
        this.terminateOn = toMatchingLogic(breakOn);
        if (butNot) {
            this.badMatcher = toMatchingLogic(butNot);
        }
    }

    // tslint:disable-next-line:member-ordering
    public $id = `Break[${this.breakOn}]`;

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        if (is.exhausted()) {
            return new TerminalPatternMatch(this.$id, "", is.offset, is, context);
        }

        let currentIs = is;
        let matched = "";
        let terminalMatch: MatchPrefixResult = this.terminateOn.matchPrefix(currentIs, context);
        while (!currentIs.exhausted() && !isPatternMatch(terminalMatch)) { // if it fits, it sits
            // But we can't match the bad match if it's defined
            if (this.badMatcher) {
                if (isPatternMatch(this.badMatcher.matchPrefix(currentIs, context))) {
                    return new MatchFailureReport(this.$id, is.offset, context);
                }
            }
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
            if (!currentIs.exhausted()) {
                terminalMatch = this.terminateOn.matchPrefix(currentIs, context);
            }
        }
        // We have found the terminal if we get here
        if (this.consume && isPatternMatch(terminalMatch)) {
            return new TerminalPatternMatch(this.$id, matched + terminalMatch.$matched,
                terminalMatch.$offset, terminalMatch.$matched, context);
        }
        return new TerminalPatternMatch(this.$id, matched, is.offset, matched, context);
    }
}

export function isBreak(thing: MatchingLogic): thing is Break {
    return !!(thing as Break).terminateOn;
}
