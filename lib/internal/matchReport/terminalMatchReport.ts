import { MatchingLogic } from "../../Matchers";
import { SuccessfulMatchReport } from "../../MatchReport";
import { PatternMatch } from "../../PatternMatch";

export function successfulMatchReport(matcher: MatchingLogic, params: {
    matched: string,
    offset: number,
    valueRepresented?: any,
    parseNodeName?: string,
}) {
    return new SuccessfulTerminalMatchReport(matcher, {
        valueRepresented: params.matched,
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

    constructor(
        public readonly matcher: MatchingLogic,
        params: {
            matched: string,
            offset: number,
            valueRepresented: any,
            parseNodeName: string,
        }) {
        this.matched = params.matched;
        this.offset = params.offset;
        this.valueRepresented = params.valueRepresented;
        this.parseNodeName = params.parseNodeName;
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
}
