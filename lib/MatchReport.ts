import { MatchingLogic } from "./Matchers";
import { MatchFailureReport, MatchPrefixResult, SuccessfulMatch } from "./MatchPrefixResult";
import { DismatchReport, PatternMatch } from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

export { matchReportFromSuccessfulMatch } from "./internal/matchReport/terminalMatchReport";
export interface FullMatchReport {
    successful: boolean;
    kind: "real";
    matcher: MatchingLogic; // is all of this really necessary?
    toExplanationTree(): MatchExplanationTreeNode;
}

export interface FailedMatchReport extends FullMatchReport {
    successful: false;
    offset: number;
    matched?: string;
    description?: string;
}

export interface SuccessfulMatchReport extends FullMatchReport {
    successful: true;
    matched: string;
    offset: number;
    kind: "real"; // after wrappers are gone, this can go
    toPatternMatch<T>(): PatternMatch & T;
    toParseTree(): TreeNodeCompatible;
    toValueStructure<T>(): T;
}

export function isSuccessfulMatchReport(fmr: FullMatchReport | MatchReport): fmr is SuccessfulMatchReport {
    return fmr.successful;
}

export function isFailedMatchReport(fmr: FullMatchReport | MatchReport): fmr is FailedMatchReport {
    return fmr.kind === "real" && !fmr.successful;
}

/**
 * All the data about the match, enough to generate either a PatternMatch
 * or a TreeNodeCompatible or a DismatchReport.
 *
 * I can't get from one of these structures to another, because the child
 * structures are different. So, let's output one structure that can
 * be turned into any of them.
 */
export type MatchReport = { matcher: MatchingLogic, successful: boolean } & ({
    kind: "wrappedPatternMatch",
    patternMatch: PatternMatch,
    matched: string,
    toPatternMatch(): PatternMatch,
} | {
    kind: "wrappedDismatchReport",
    dismatchReport: DismatchReport,
} | {
    kind: "wrappedMatchFailureReport",
    matchFailureReport: MatchFailureReport,
} | {
    kind: "wrappedSuccessfulMatch",
    successfulMatch: SuccessfulMatch,
    matched: string,
    toPatternMatch(): PatternMatch,
} | { kind: "real" });

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
        case "real":
            if (isSuccessfulMatchReport(mr)) {
                return mr.toPatternMatch<T>();
            } else {
                throw new Error("not implemented");
            }
    }
}

/**
 * Extract a tree describing how the match was parsed.
 * Each matcher adds a node, plus Concat adds nodes for all its properties
 * and Rep adds nodes for all its elements.
 * Synthetic elements are empty elements are not included; each node
 * maps to content in the file.
 * @param mr match report from Grammar.exactMatchReport
 */
export function toParseTree(mr: MatchReport): TreeNodeCompatible {
    if (!isSuccessfulMatchReport(mr)) {
        throw new Error("Unimplemented");
    }
    return mr.toParseTree();
}

export interface MatchExplanationTreeNode extends TreeNodeCompatible {
    $children: MatchExplanationTreeNode[]; // narrowed
    /**
     * Whether this part of the tree matched successfully
     */
    successful: boolean;
    /**
     * If failed, please always populate the description of why.
     * If successful, you may describe why this input string was so compelling
     */
    reason?: string;
}

/**
 * Return a tree which explains the activity of the matching, both
 * what matched and what didn't. Empty matches are included, and failed
 * matches are included. Use this to figure out why something matched (or didn't).
 * @param mr a MatchReport from Grammar.exactMatchReport
 */
export function toExplanationTree(mr: MatchReport): MatchExplanationTreeNode {
    if (isFailedMatchReport(mr)) {
        return mr.toExplanationTree();
    } else if (isSuccessfulMatchReport(mr)) {
        return mr.toExplanationTree();
    } else {
        throw new Error("I can't build a dismatch tree from " + mr.kind);
    }
}

/**
 * Return the values extracted from a match. For any match constructed with
 * `microgrammar(...)` this will return an object with a property for each term.
 * Synthetic properties are included.
 * @param mr a MatchReport from Grammar.exactMatchReport
 */
export function toValueStructure<T = any>(mr: MatchReport): T {
    if (isSuccessfulMatchReport(mr)) {
        return mr.toValueStructure();
    } else {
        throw new Error("You can only get the value structure of successful matches");
    }
}

// shim
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
        case "real":
            if (isSuccessfulMatchReport(mr)) {
                return mr.toPatternMatch();
            } else if (isFailedMatchReport(mr)) {
                return new MatchFailureReport(mr.matcher.$id,
                    mr.offset,
                    mr.matched,
                    mr.description);
            } else {
                throw new Error("Unhandled");
            }
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
        successful: false,
    };
    return mr;
}

export function matchReportFromPatternMatch(matcher: MatchingLogic, pm: PatternMatch,
                                            opts: { offset?: number } = {},
    // because in a break, the outer match stores this differently than the PatternMatch
): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedPatternMatch",
        patternMatch: pm,
        matched: pm.$matched,
        successful: true,
        toPatternMatch() { return pm; },
    };
    return mr;
}

// replace: matchReportFromFailureReport(MatchFailureReport.from
export function matchReportFromFailureReport(matcher: MatchingLogic, mfr: MatchFailureReport): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedMatchFailureReport",
        matchFailureReport: mfr,
        successful: false,
    };
    return mr;
}

// I'm implementing terminal first
export function matchReportFromSuccessfulTreeMatch(matcher: MatchingLogic, sm: SuccessfulMatch): MatchReport {
    const mr: MatchReport = {
        matcher,
        kind: "wrappedSuccessfulMatch",
        successfulMatch: sm,
        toPatternMatch() {
            (sm.match as any).$successfulMatch = true;  // shim
            return sm.match;
        },
        matched: sm.$matched,
        successful: true,
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
