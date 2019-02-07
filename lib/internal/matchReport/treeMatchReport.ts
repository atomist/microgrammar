import { MatchingLogic } from "../../Matchers";
import { MatchExplanationTreeNode, MatchReport, SuccessfulMatchReport } from "../../MatchReport";
import { PatternMatch } from "../../PatternMatch";
import { TreeNodeCompatible } from "./../../TreeNodeCompatible";

export function successfulTreeMatchReport(matcher: MatchingLogic, params:
    {
        matched: string,
        offset: number,
        children?: MatchReport[],
        parseNodeName?: string,
        reason?: string,
        extraProperties?: Record<string, any>,
    }): SuccessfulMatchReport {
    const { offset, matched, parseNodeName, reason, extraProperties, children } = params;
    return new TreeMatchReport(
        matcher,
        matched,
        offset,
        children || [],
        reason,
        parseNodeName || matcher.$id,
        extraProperties || {},
    );
}

class TreeMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";
    constructor(public readonly matcher: MatchingLogic,
                public readonly matched: string,
                public readonly offset: number,
                private readonly children: MatchReport[],
                private readonly reason: string,
                private readonly parseNodeName: string,
                private readonly extraProperties: Record<string, any>,
    ) {

    }
    public toPatternMatch<T>(): PatternMatch & T {
        throw new Error("Method not implemented.");
    }
    public toParseTree(): TreeNodeCompatible {
        throw new Error("Method not implemented.");
    }
    public toValueStructure<T>(): T {
        throw new Error("Method not implemented.");
    }
    public toExplanationTree(): MatchExplanationTreeNode {
        throw new Error("Method not implemented.");
    }
}
