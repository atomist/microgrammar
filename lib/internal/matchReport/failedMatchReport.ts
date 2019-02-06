import { MatchingLogic } from "../../Matchers";
import { DismatchTreeNode, FailedMatchReport } from "../../MatchReport";

export function failedMatchReport(matcher: MatchingLogic, params: {
    matched?: string;
    offset: number;
    parseNodeName?: string;
    description: string;
}) {
    return new FailedTerminalMatchReport(matcher, {
        parseNodeName: matcher.$id,
        ...params,
    });
}

class FailedTerminalMatchReport implements FailedMatchReport {
    public readonly kind = "real";
    public readonly successful = false;
    public readonly matched?: string;
    public readonly offset: number;
    public readonly parseNodeName: string;
    public readonly description: string;

    constructor(public readonly matcher: MatchingLogic, params: {
        matched?: string;
        offset: number;
        parseNodeName: string;
        description: string;
    }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.description = params.description;
        this.parseNodeName = params.parseNodeName;

    }

    public toDismatchTree(): DismatchTreeNode {
        return {
            successful: false,
            description: this.description,
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: this.matched || "",
            $children: [],
        };
    }
}
