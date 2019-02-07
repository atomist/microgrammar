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
}

export function wrappingMatchReport(matcher: MatchingLogic, params: {
    inner: SuccessfulMatchReport,
    additional?: FailedMatchReport[],
    parseNodeName?: string,
}): FullMatchReport {
    return new WrappingMatchReport(matcher,
        params.parseNodeName || matcher.$id,
        params.inner,
        params.additional);
}

class WrappingMatchReport implements FullMatchReport {
    public readonly kind = "real";
    constructor(public readonly matcher: MatchingLogic,
                public readonly parseNodeName: string,
                public readonly inner: SuccessfulMatchReport,
                public readonly additional: FailedMatchReport[] = []) {
    }

    get successful() {
        return true;
    }

    public toPatternMatch() {
        // the wrapping disappears
        return this.inner.toPatternMatch();
    }

    get matched() {
        return this.inner.matched;
    }

    public toParseTree(): TreeNodeCompatible {
        // only successful matches go into the parse tree
        return {
            $name: this.parseNodeName,
            $offset: this.inner.offset,
            $value: this.inner.matched,
            $children: [this.inner.toParseTree()],
        };
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        // all non-matches and matches go into the explanation tree
        return {
            ...this.toParseTree(),
            successful: true,
            $children: [...this.additional, this.inner].map(m => m.toExplanationTree()),
        };
    }
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

export function toExplanationTree(mr: MatchReport): MatchExplanationTreeNode {
    if (isFailedMatchReport(mr)) {
        return mr.toExplanationTree();
    } else if (isSuccessfulMatchReport(mr)) {
        return mr.toExplanationTree();
    } else {
        throw new Error("I can't build a dismatch tree from " + mr.kind);
    }
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
