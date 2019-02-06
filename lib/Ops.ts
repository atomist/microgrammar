import { InputState } from "./InputState";
import { Matcher, MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {
    isSuccessfulMatch,
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "./MatchPrefixResult";
import {
    isSuccessfulMatchReport,
    MatchReport, matchReportFromFailureReport, matchReportFromSuccessfulMatch, toMatchPrefixResult, wrappingMatchReport,
} from "./MatchReport";
import {
    PatternMatch,
    UndefinedPatternMatch,
} from "./PatternMatch";
import { successfulMatchReport } from "./internal/matchReport/terminalMatchReport";

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
            return matchReportFromSuccessfulMatch(this, matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset)));
        }

        const maybe = this.matcher.matchPrefixReport(is, thisMatchContext, parseContext);
        if (isSuccessfulMatchReport(maybe)) {
            return wrappingMatchReport(this, maybe);
        }
        return matchReportFromSuccessfulMatch(this, matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset)));
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
            return matchReportFromFailureReport(this, new MatchFailureReport(this.$id, is.offset, ""));
        }

        const failedMatches: MatchPrefixResult[] = [];
        for (const matcher of this.matchers) {
            const m = matcher.matchPrefixReport(is, thisMatchContext, parseContext);
            if (isSuccessfulMatchReport(m)) {
                return m; // TODO: wrap this! matchReportFromSuccessfulMatch(this, m);
            }
            failedMatches.push(toMatchPrefixResult(m)); // shim, need Failure wrapper
        }
        return matchReportFromFailureReport(this, MatchFailureReport.from({ $matcherId: this.$id, $offset: is.offset, children: failedMatches }));
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
): MatchingLogic {
    const output = new WhenMatcher(toMatchingLogic(o), matchTest, inputStateTest);

    for (const prop in o) {
        if (o.hasOwnProperty(prop)) {
            output[prop] = o[prop];
        }
    }
    return output;
}
class WhenMatcher implements MatchingLogic {

    public readonly $id: string;

    constructor(public readonly inner: MatchingLogic,
        public readonly matchTest: (pm: PatternMatch) => boolean,
        public readonly inputStateTest: (is: InputState) => boolean) {

        this.$id = `When[${inner.$id}]`;
        this.canStartWith = inner.canStartWith;
    }
    public canStartWith?(char: string): boolean;

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (!this.inputStateTest(is)) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                cause: "Input state test returned false",
            }));
        }
        const result = this.inner.matchPrefixReport(is, thisMatchContext, parseContext);
        const resultMpr = toMatchPrefixResult(result); // shim
        if (!isSuccessfulMatchReport(result)) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                children: [resultMpr],
                cause: (resultMpr as MatchFailureReport).description,
            }));
        }
        if (!this.matchTest(result.toPatternMatch())) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                $matched: result.matched,
                children: [resultMpr],
                cause: "Match test returned false",
            }));
        }
        return successfulMatchReport(this, {
            matched: result.matched, offset: result.offset,
            valueRepresented: result.toPatternMatch().$value,
            parseNodeName: "When",
        });
    }

    public matchPrefix(a, b, c) { return toMatchPrefixResult(this.matchPrefixReport(a, b, c)); }

}
