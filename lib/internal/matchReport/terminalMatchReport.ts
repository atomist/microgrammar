import { MatchingLogic } from "../../Matchers";
import { SuccessfulMatch } from "../../MatchPrefixResult";
import { FullMatchReport, MatchExplanationTreeNode, SuccessfulMatchReport, toParseTree } from "../../MatchReport";
import { PatternMatch } from "../../PatternMatch";

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
        parseNodeName: matcher.$id,
    });
}

export function successfulMatchReport(matcher: MatchingLogic, params: {
    matched: string,
    offset: number,
    valueRepresented?: any,
    parseNodeName?: string,
    reason?: string,
}) {
    return new SuccessfulTerminalMatchReport(matcher, {
        valueRepresented: params.matched ? params.matched : undefined,
        parseNodeName: matcher.$id,
        ...params,
    });
}

class SuccessfulTerminalMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";

    public readonly matched: string;
    public readonly offset: number;
    public readonly valueRepresented: any;
    public readonly parseNodeName: string;
    public readonly reason?: string;

    constructor(
        public readonly matcher: MatchingLogic,
        params: {
            matched: string,
            offset: number,
            valueRepresented: any,
            parseNodeName: string,
            reason?: string,
        }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.valueRepresented = params.valueRepresented;
        this.parseNodeName = params.parseNodeName;
        this.reason = params.reason;
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

    public toParseTree() {
        return {
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: [],
        };
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            successful: true,
            reason: this.reason,
            ...this.toParseTree(),
        };
    }
}
