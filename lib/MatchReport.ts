import { DismatchReport, PatternMatch } from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";
import { MatchFailureReport } from "./MatchPrefixResult";

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
};

export function toPatternMatch(mr: MatchReport): PatternMatch {
    return null;
}

export function toPatternMatchOrDismatchReport<T>(mr: MatchReport):
    PatternMatch & T | DismatchReport {
    switch (mr.kind) {
        case "wrappedDismatchReport":
            return mr.dismatchReport;
        case "wrappedPatternMatch":
            return mr.patternMatch as PatternMatch & T;
    }
}

export function toTreeNodeCompatible(mr: MatchReport): TreeNodeCompatible {
    return null;
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

export function matchReportFromFailureReport(mfr: MatchFailureReport): MatchReport {
    const mr: MatchReport = {
        kind: "wrappedDismatchReport",
        dismatchReport: mfr,
    };
    return mr;
}
