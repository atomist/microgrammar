import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import {
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    isSuccessfulMatchReport,
    MatchReport,
    SuccessfulMatchReport,
    toMatchPrefixResult,
} from "../MatchReport";
import { PatternMatch } from "../PatternMatch";
import { successfulMatchReport } from "./matchReport/terminalMatchReport";
import { SuccessfulMatchReportWrapper, wrappingFailedMatchReport } from "./matchReport/wrappingMatchReport";
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

    public readonly parseNodeName: string = "Break";

    /**
     * Consume input until (or until and including) the terminal match
     * @param terminateOn desired terminal match
     * @param consumeTerminal default false. Whether to consume the terminal match. If this is set to true,
     * the value of the match will be the match of the terminal pattern. Otherwise it will the preceding,
     * skipped content.
     * @param badMatcher pattern we don't want to see before the desired determinal match.
     * If we see this pattern before, the match breaks.
     */
    constructor(public terminateOn: MatchingLogic,
                private readonly consumeTerminal: boolean = false,
                private readonly badMatcher?: MatchingLogic) {
    }

    get $id() {
        return `Break[${this.terminateOn.$id}]`;
    }

    public canStartWith(char: string): boolean {
        return (this.consumeTerminal && !this.badMatcher && this.terminateOn.canStartWith) ?
            this.terminateOn.canStartWith(char) :
            true;
    }

    get requiredPrefix() {
        return (this.consumeTerminal && !this.badMatcher) ?
            this.terminateOn.requiredPrefix :
            undefined;
    }

    public matchPrefix(is: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        let currentIs = is;
        let matched = "";
        const originalOffset = is.offset;

        // Apply optimization if possible where we skip to the terminal if we're consuming it and not avoiding a bad match
        if (this.consumeTerminal && !this.badMatcher) {
            const skipped = readyToMatch(currentIs, false, this.terminateOn);
            matched += skipped.skipped;
            currentIs = skipped.state;
        }
        let terminalMatch: MatchReport = this.terminateOn.matchPrefixReport(currentIs, thisMatchContext, parseContext);
        while (!currentIs.exhausted() && !isSuccessfulMatchReport(terminalMatch)) { // if it fits, it sits
            // But we can't match the bad match if it's defined
            if (this.badMatcher) {
                // technically every time the bad matcher didn't match could be a child of this one's ExplanationTree.
                // but that would be ridiculous.
                const badMatchReport = this.badMatcher.matchPrefixReport(currentIs, thisMatchContext, parseContext);
                if (isSuccessfulMatchReport(badMatchReport)) {
                    return wrappingFailedMatchReport(this, {
                        offset: is.offset,
                        matched,
                        parseNodeName: this.parseNodeName,
                        inner: badMatchReport,
                    });
                }
            }
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
            if (!currentIs.exhausted()) {
                terminalMatch = this.terminateOn.matchPrefixReport(currentIs, thisMatchContext, parseContext);
            }
        }
        // We have found the terminal if we get here... or the end of the input.
        if (this.consumeTerminal && isSuccessfulMatchReport(terminalMatch)) {
            return new BreakWithTerminalMatchReport(this, this.parseNodeName, terminalMatch, is.offset,
                matched + terminalMatch.matched,
            );
        }
        // todo: if terminalMatch ended this, it needs to be a child
        return successfulMatchReport(this, {
            matched,
            offset: is.offset,
            parseNodeName: this.parseNodeName,
        });
    }
}

class BreakWithTerminalMatchReport extends SuccessfulMatchReportWrapper {
    constructor(matcher: MatchingLogic,
                parseNodeName: string,
                inner: SuccessfulMatchReport,
                private readonly offsetOverride: number,
                private readonly matchedOverride: string) {
        super(matcher, parseNodeName, inner);
    }

    get offset() {
        return this.offsetOverride;
    }

    get matched() {
        return this.matchedOverride;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        const terminal = this.inner.toPatternMatch<T>();
        // historically, the pattern match returned by Break violates the invariant of $offset is the start of $matched
        return {
            ...terminal,
            $matched: this.matched,
        };
    }
}

export function isBreak(thing: MatchingLogic): thing is Break {
    return !!(thing as Break).terminateOn;
}
