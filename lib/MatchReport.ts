import { Matcher, MatchingLogic } from "./Matchers";
import { MatchFailureReport, MatchPrefixResult, SuccessfulMatch } from "./MatchPrefixResult";
import { DismatchReport, PatternMatch } from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

/**
 * All the data about the match, enough to generate either a PatternMatch
 * or a TreeNodeCompatible or a DismatchReport.
 *
 * I can't get from one of these structures to another, because the child
 * structures are different. So, let's output one structure that can
 * be turned into any of them.
 */
export type MatchReport = { matcher: MatchingLogic } & ({
    kind: "wrappedPatternMatch",
    patternMatch: PatternMatch,
} | {
    kind: "wrappedDismatchReport",
    dismatchReport: DismatchReport,
} | {
    kind: "wrappedMatchFailureReport",
    matchFailureReport: MatchFailureReport,
} | {
    kind: "wrappedSuccessfulMatch",
    successfulMatch: SuccessfulMatch,
});

export function toPatternMatch(mr: MatchReport): PatternMatch {
    return null;
}

export function toPatternMatchOrDismatchReport<T>(mr: MatchReport):
    PatternMatch & T | DismatchReport {
    switch (mr.kind) {
        case "wrappedDismatchReport":
            return mr.dismatchReport;
        case "wrappedMatchFailureReport":
            return mr.matchFailureReport;
        case "wrappedPatternMatch":
            return mr.patternMatch as PatternMatch & T;
        case "wrappedSuccessfulMatch":
            // it is not normal to call this
            // return mr.successfulMatch.match as PatternMatch & T;
            throw new Error("I didn't think this kind of match would get this called on it.");
    }
}

export function toTreeNodeCompatible(mr: MatchReport): TreeNodeCompatible {
    return null;
}

export function toMatchPrefixResult(mr: MatchReport): MatchPrefixResult {
    switch (mr.kind) {
        case "wrappedDismatchReport":
            throw new Error("But the match failed: " + mr.dismatchReport.description);
        case "wrappedMatchFailureReport":
            return mr.matchFailureReport;
        case "wrappedPatternMatch":
            return mr.patternMatch as PatternMatch;
        case "wrappedSuccessfulMatch":
            return mr.successfulMatch;
    }
}

/**
 * Current Cases
 */
export function matchReportFromError(matcher: MatchingLogic, description: string): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedDismatchReport",
        dismatchReport: {
            description,
        },
    };
    return mr;
}

export function matchReportFromPatternMatch(matcher: MatchingLogic, pm: PatternMatch): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedPatternMatch",
        patternMatch: pm,
    };
    return mr;
}

// replace: matchReportFromFailureReport(MatchFailureReport.from
export function matchReportFromFailureReport(matcher: MatchingLogic, mfr: MatchFailureReport): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedMatchFailureReport",
        matchFailureReport: mfr,
    };
    return mr;
}

// replace:  matchReportFromSuccessfulMatch(matchPrefixSuccess
export function matchReportFromSuccessfulMatch(matcher: MatchingLogic, sm: SuccessfulMatch) {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedSuccessfulMatch",
        successfulMatch: sm,
    };
    return mr;
}

/**
 * Desired cases
 */
export function successfulTreeMatchReport(params:
    {
        matcher: MatchingLogic,
        name: string,
        matched: string,
        offset: number,
        children: { [k: string]: MatchReport },
        childrenToExposeAsProperties: string[],
        additionalProperties: { [k: string]: any },
    },
) {

    // theory: this is enough data to replace TreePatternMatch.

    //

}
