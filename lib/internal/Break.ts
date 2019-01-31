import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import {
    isSuccessfulMatch,
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "../MatchPrefixResult";
import { MatchReport, matchReportFromFailureReport, matchReportFromSuccessfulMatch, toMatchPrefixResult } from "../MatchReport";
import { TerminalPatternMatch } from "../PatternMatch";
import { readyToMatch } from "./Whitespace";

/**
 * Inspired by SNOBOL BREAK: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * In SNOBOL.
 * Used internally in Concat. Also exposed to end users in Skip functions.
 * BREAK(S) matches "up to but not including" any character in S.
 * The string matched must always be followed in the subject by a character in S.
 * Unlike SPAN and NOTANY, BREAK will match the null string.
 * This implementation goes beyond SNOBOL, in that it allows the break to consume the end token,
 * and also allows the ability to specify a pattern that must not be found.
 */
export class Break implements MatchingLogic {

    /**
     * Consume input until (or until and including) the terminal match
     * @param terminateOn desired terminal match
     * @param consume default false. Whether to consume the terminal match. If this is set to true,
     * the value of the match will be the match of the terminal pattern. Otherwise it will the preceding,
     * skipped content.
     * @param badMatcher pattern we don't want to see before the desired determinal match.
     * If we see this pattern before, the match breaks.
     */
    constructor(public terminateOn: MatchingLogic,
        private readonly consume: boolean = false,
        private readonly badMatcher?: MatchingLogic) {
    }

    get $id() {
        return `Break[${this.terminateOn.$id}]`;
    }

    public canStartWith(char: string): boolean {
        return (this.consume && !this.badMatcher && this.terminateOn.canStartWith) ?
            this.terminateOn.canStartWith(char) :
            true;
    }

    get requiredPrefix() {
        return (this.consume && !this.badMatcher) ?
            this.terminateOn.requiredPrefix :
            undefined;
    }

    public matchPrefix(is: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        let currentIs = is;
        let matched = "";

        // Apply optimization if possible where we skip to the terminal if we're consuming it and not avoiding a bad match
        if (this.consume && !this.badMatcher) {
            const skipped = readyToMatch(currentIs, false, this.terminateOn);
            matched += skipped.skipped;
            currentIs = skipped.state;
        }
        let terminalMatch: MatchPrefixResult = this.terminateOn.matchPrefix(currentIs, thisMatchContext, parseContext);
        while (!currentIs.exhausted() && !isSuccessfulMatch(terminalMatch)) { // if it fits, it sits
            // But we can't match the bad match if it's defined
            if (this.badMatcher) {
                if (isSuccessfulMatch(this.badMatcher.matchPrefix(currentIs, thisMatchContext, parseContext))) {
                    return matchReportFromFailureReport(new MatchFailureReport(this.$id, is.offset, matched));
                }
            }
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
            if (!currentIs.exhausted()) {
                terminalMatch = this.terminateOn.matchPrefix(currentIs, thisMatchContext, parseContext);
            }
        }
        // We have found the terminal if we get here
        if (this.consume && isSuccessfulMatch(terminalMatch)) {
            terminalMatch.match.$matched = matched + terminalMatch.match.$matched;
            return matchReportFromSuccessfulMatch(matchPrefixSuccess(terminalMatch.match));
        }
        return matchReportFromSuccessfulMatch(matchPrefixSuccess(new TerminalPatternMatch(this.$id, matched, is.offset, matched)));
    }
}

export function isBreak(thing: MatchingLogic): thing is Break {
    return !!(thing as Break).terminateOn;
}
