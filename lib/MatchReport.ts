import { Matcher, MatchingLogic } from "./Matchers";
import { MatchFailureReport, MatchPrefixResult, SuccessfulMatch } from "./MatchPrefixResult";
import { DismatchReport, PatternMatch } from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

export interface FullMatchReport {
    successful: boolean;
    kind: "real";
    matcher: MatchingLogic; // is all of this really necessary?
}

export interface SuccessfulMatchReport extends FullMatchReport {
    successful: true;
    matched: string;
    offset: number;
    kind: "real"; // after wrappers are gone, this can go
    toPatternMatch<T>(): PatternMatch & T;
}

class SuccessfulTerminalMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";

    public readonly matched: string;
    public readonly offset: number;
    public readonly valueRepresented: any;

    constructor(public readonly matcher: MatchingLogic,
                params: {
            matched: string,
            offset: number,
            valueRepresented: any,
        }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.valueRepresented = params.valueRepresented;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        const pm: PatternMatch = {
            $matcherId: this.matcher.$id,
            $matched: this.matched,
            $offset: this.offset,
            $value: this.valueRepresented,
            matchedStructure: <TT>() => this.valueRepresented as TT, // really should be T
        };

        // hack for compatibility with isSuccessfulMatch
        (pm as any).$successfulMatch = true;

        // add custom fields

        return pm as (PatternMatch & T);
    }
}

export function successfulMatchReport(matcher: MatchingLogic, params: {
    matched: string,
    offset: number,
    valueRepresented: any,
}) {
    return new SuccessfulTerminalMatchReport(matcher, params);
}

export function wrappingMatchReport(matcher: MatchingLogic, inner: MatchReport): FullMatchReport {
    return new WrappingMatchReport(matcher, inner);
}

class WrappingMatchReport implements FullMatchReport {
    public readonly kind = "real";
    constructor(public readonly matcher: MatchingLogic,
                public readonly inner: MatchReport) {
    }

    get successful() {
        return this.inner.successful;
    }

    public toPatternMatch() {
        if (isSuccessfulMatchReport(this.inner)) {
            return this.inner.toPatternMatch();
        }
        throw new Error("Unsuccessful match, no pattern match for you");
    }
}

export function isSuccessfulMatchReport(fmr: FullMatchReport | MatchReport): fmr is SuccessfulMatchReport {
    return fmr.successful;
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
    kind: "wrappedSuccessfulMatch", x
    successfulMatch: SuccessfulMatch,
    matched: string,
    toPatternMatch(): PatternMatch,
} | { kind: "real" });

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
        case "real":
            if (isSuccessfulMatchReport(mr)) {
                return mr.toPatternMatch<T>();
            } else {
                throw new Error("not implemented");
            }
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
        case "real":
            if (isSuccessfulMatchReport(mr)) {
                return mr.toPatternMatch();
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
                                            opts: { offset?: number },
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

// replace:  matchReportFromSuccessfulMatch(matchPrefixSuccess
export function matchReportFromSuccessfulMatch(matcher: MatchingLogic, sm: SuccessfulMatch): FullMatchReport {
    // const mr: MatchReport = {
    //     matcher,
    //     kind: "wrappedSuccessfulMatch",
    //     successfulMatch: sm,
    // };
    return successfulMatchReport(matcher, {
        matched: sm.$matched,
        offset: sm.$offset,
        valueRepresented: sm.$value,
    });
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
