import { MatchingLogic } from "../../Matchers";
import {
    FailedMatchReport,
    FullMatchReport,
    MatchExplanationTreeNode,
    MatchReport,
} from "../../MatchReport";

export function failedMatchReport(matcher: MatchingLogic, params: {
    matched?: string;
    offset: number;
    parseNodeName?: string;
    reason: string;
    children?: FullMatchReport[];
}) {
    return new FailedTerminalMatchReport(matcher, {
        parseNodeName: matcher.$id,
        children: [],
        ...params,
    });
}

class FailedTerminalMatchReport implements FailedMatchReport {
    public readonly kind = "real";
    public readonly successful = false;
    public readonly matched?: string;
    public readonly offset: number;
    public readonly parseNodeName: string;
    public readonly reason: string;
    public readonly children: FullMatchReport[];

    constructor(public readonly matcher: MatchingLogic, params: {
        matched?: string;
        offset: number;
        parseNodeName: string;
        reason: string;
        children: FullMatchReport[];
    }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.reason = params.reason;
        this.parseNodeName = params.parseNodeName;
        this.children = params.children;
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            successful: false,
            reason: this.reason,
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: this.matched || "",
            $children: this.children.map(c => c.toExplanationTree()),
        };
    }
}
