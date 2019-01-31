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
export type MatchReport = {
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
};

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
 * Cases
 */
export function matchReportFromError(description: string): MatchReport {
    const mr: MatchReport = {
        kind: "wrappedDismatchReport",
        dismatchReport: {
            description,
        },
    };
    return mr;
}

export function matchReportFromPatternMatch(pm: PatternMatch): MatchReport {
    const mr: MatchReport = {
        kind: "wrappedPatternMatch",
        patternMatch: pm,
    };
    return mr;
}

// replace: matchReportFromFailureReport(MatchFailureReport.from
export function matchReportFromFailureReport(mfr: MatchFailureReport): MatchReport {
    const mr: MatchReport = {
        kind: "wrappedMatchFailureReport",
        matchFailureReport: mfr,
    };
    return mr;
}

// replace:  matchReportFromSuccessfulMatch(matchPrefixSuccess
export function matchReportFromSuccessfulMatch(sm: SuccessfulMatch) {
    const mr: MatchReport = {
        kind: "wrappedSuccessfulMatch",
        successfulMatch: sm,
    };
    return mr;
}
