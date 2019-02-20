import { MatchingLogic } from "../../Matchers";
import {
    MatchExplanationTreeNode,
    SuccessfulMatchReport,
} from "../../MatchReport";
import { PatternMatch } from "../../PatternMatch";

export function successfulMatchReport(matcher: MatchingLogic, params: {
    matched: string,
    offset: number,
    valueRepresented?: { value: any },
    parseNodeName?: string,
    reason?: string,
}) {
    return new SuccessfulTerminalMatchReport(matcher, {
        valueRepresented: params.valueRepresented || { value: params.matched },
        parseNodeName: matcher.$id,
        ...params,
    });
}

class SuccessfulTerminalMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";

    public readonly matched: string;
    public readonly offset: number;
    public readonly endingOffset: number;
    public readonly valueRepresented: { value: any };
    public readonly parseNodeName: string;
    public readonly reason?: string;

    constructor(
        public readonly matcher: MatchingLogic,
        params: {
            matched: string,
            offset: number,
            valueRepresented: { value: any },
            parseNodeName: string,
            reason?: string,
        }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.valueRepresented = params.valueRepresented;
        this.parseNodeName = params.parseNodeName;
        this.reason = params.reason;
        this.endingOffset = this.offset + this.matched.length;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        const pm: PatternMatch = {
            $matcherId: this.matcher.$id,
            $matched: this.matched,
            $offset: this.offset,
            $value: this.valueRepresented.value,
            matchedStructure: <TT>() => this.valueRepresented.value as TT, // really should be T
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

    public toValueStructure<T>(): T {
        return this.valueRepresented.value;
    }
}
