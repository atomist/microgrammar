import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {
    isSuccessfulMatch,
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "./MatchPrefixResult";
import {
    PatternMatch,
    UndefinedPatternMatch,
} from "./PatternMatch";
import { toMatchPrefixResult, MatchReport, matchReportFromSuccessfulMatch, matchReportFromFailureReport } from "./MatchReport";

/**
 * Optional match on the given matcher
 * @param o matcher
 * @return {Opt}
 */
export function optional(o: any): MatchingLogic {
    return new Opt(o);
}

export class Opt implements MatchingLogic {

    private readonly matcher: MatchingLogic;

    /**
     * Optional match
     * @param o matching logic
     */
    constructor(o: any) {
        this.matcher = toMatchingLogic(o);
    }

    get $id() {
        return `Opt[${this.matcher.$id}]`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (is.exhausted()) {
            // console.log(`Match from Opt on exhausted stream`);
            return matchReportFromSuccessfulMatch(matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset)));
        }

        const maybe = this.matcher.matchPrefix(is, thisMatchContext, parseContext);
        if (isSuccessfulMatch(maybe)) {
            return matchReportFromSuccessfulMatch(maybe);
        }
        return matchReportFromSuccessfulMatch(matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset)));
    }
}

/**
 * Match the first of these matchers that matches. Equivalent to an Alt (alternate)
 * @param a first matcher
 * @param b second matcher
 * @param matchers any further matchers: varargs
 * @returns {Alt}
 */
export function firstOf(a: any, b: any, ...matchers: any[]): MatchingLogic {
    return new Alt(a, b, ...matchers);
}

/**
 * Matches first match of 2 or more matchers.
 */
export class Alt implements MatchingLogic {

    public readonly matchers: MatchingLogic[];

    constructor(a: any, b: any, ...matchers: any[]) {
        const matchObjects = [a, b].concat(matchers);
        this.matchers = matchObjects.map(m => toMatchingLogic(m));
    }

    // tslint:disable-next-line:member-ordering
    get $id() {
        return `Alt(${this.matchers.map(m => m.$id).join(",")})`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (is.exhausted()) {
            return matchReportFromFailureReport(new MatchFailureReport(this.$id, is.offset, ""));
        }

        const failedMatches: MatchPrefixResult[] = [];
        for (const matcher of this.matchers) {
            const m = matcher.matchPrefix(is, thisMatchContext, parseContext);
            if (isSuccessfulMatch(m)) {
                return matchReportFromSuccessfulMatch(m);
            }
            failedMatches.push(m);
        }
        return matchReportFromFailureReport(MatchFailureReport.from({ $matcherId: this.$id, $offset: is.offset, children: failedMatches }));
    }
}

/**
 * Add a condition with a function that verifies that even if we found a match
 * we are happy with it: For example, we like the value it contains.
 * Also capable of vetoing match if the input state is problematic before the potential match
 */
export function when(
    o: any,
    matchTest: (pm: PatternMatch) => boolean,
    inputStateTest: (is: InputState) => boolean = is => true,
) {

    const matcher = toMatchingLogic(o);
    const conditionalMatcher = {} as any;

    conditionalMatcher.$id = `When[${matcher}]`;

    // Copy other properties
    for (const prop in o) {
        if (o.hasOwnProperty(prop)) {
            conditionalMatcher[prop] = o[prop];
        }
    }

    function conditionalMatch(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        if (!inputStateTest(is)) {
            return MatchFailureReport.from({
                $matcherId: conditionalMatcher.$id,
                $offset: is.offset,
                cause: "Input state test returned false",
            });
        }
        const result = matcher.matchPrefix(is, thisMatchContext, parseContext);
        if (!isSuccessfulMatch(result)) {
            return MatchFailureReport.from({
                $matcherId: conditionalMatcher.$id,
                $offset: is.offset,
                children: [result],
                cause: (result as MatchFailureReport).description,
            });
        }
        if (!matchTest(result.match)) {
            return MatchFailureReport.from({
                $matcherId: conditionalMatcher.$id,
                $offset: is.offset,
                $matched: result.$matched,
                children: [result],
                cause: "Match test returned false",
            });
        }
        return result;
    }

    conditionalMatcher.matchPrefix = conditionalMatch;
    conditionalMatcher.requiredPrefix = matcher.requiredPrefix;
    conditionalMatcher.canStartWith = matcher.canStartWith;
    return conditionalMatcher;
}
