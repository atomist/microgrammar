import { MatchingLogic } from "../../Matchers";
import { FailedMatchReport, FullMatchReport, MatchExplanationTreeNode, MatchReport, SuccessfulMatchReport } from "../../MatchReport";
import { PatternMatch } from "../../PatternMatch";
import { TreeNodeCompatible } from "./../../TreeNodeCompatible";
import { failedMatchReport } from "./failedMatchReport";
import { wrappingMatchReport } from "./wrappingMatchReport";

export function successfulTreeMatchReport(matcher: MatchingLogic, params:
    {
        matched: string,
        offset: number,
        children?: TreeChild[],
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

export type TreeChild = {
    explicit: false;
    matchReport: SuccessfulMatchReport;
} | {
    explicit: true;
    name: string;
    matchReport: SuccessfulMatchReport;
};

export function namedChild(name: string, matchReport: SuccessfulMatchReport): TreeChild {
    return {
        name, matchReport, explicit: true,
    };
}

export function unnamedChild(matchReport: SuccessfulMatchReport): TreeChild {
    return { explicit: false, matchReport };
}

class TreeMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";
    constructor(public readonly matcher: MatchingLogic,
                public readonly matched: string,
                public readonly offset: number,
                private readonly children: TreeChild[],
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

export function failedTreeMatchReport(matcher: MatchingLogic, params:
    {
        matched: string,
        originalOffset: number,
        reason: string,
        failureName: string,
        failureReport?: FailedMatchReport,
        failingOffset?: number,
        successes?: TreeChild[],
        parseNodeName?: string,
    }): FailedMatchReport {
    const { matched, parseNodeName, reason, successes,
        failureName, failureReport } = params;

    const failureMatchReport = failureReport || failedMatchReport(matcher, {
        offset: params.failingOffset, parseNodeName: failureName, reason,
    });
    return new FailedTreeMatchReport(
        matcher,
        matched,
        params.originalOffset,
        successes || [],
        { name: failureName, matchReport: failureMatchReport },
        reason,
        parseNodeName || matcher.$id,
    );
}

class FailedTreeMatchReport implements FailedMatchReport {
    public readonly kind = "real";
    public readonly successful = false;

    constructor(public readonly matcher: MatchingLogic,
                public readonly matched: string,
                public readonly offset: number,
                private readonly successfulChildren: TreeChild[],
                private readonly failedChild: { name: string, matchReport: FailedMatchReport },
                private readonly reason: string,
                private readonly parseNodeName: string,
    ) {
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        // todo: wrap with name somehow
        const happiness = this.successfulChildren.map(c => c.matchReport.toExplanationTree());
        const failure = this.failedChild.matchReport.toExplanationTree();
        return {
            successful: false,
            reason: this.reason,
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: this.matched || "",
            $children: happiness.concat(failure),
        };
    }
}

function wrapChild(matcher: MatchingLogic, child: TreeChild): SuccessfulMatchReport {
    if (!child.explicit) {
        return child.matchReport;
    }
    return wrappingMatchReport(matcher, { parseNodeName: child.name, inner: child.matchReport });
}
