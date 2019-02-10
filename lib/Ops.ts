import { InputState } from "./InputState";
import { failedMatchReport } from "./internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "./internal/matchReport/terminalMatchReport";
import { wrappingFailedMatchReport, wrappingMatchReport } from "./internal/matchReport/wrappingMatchReport";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {
    MatchFailureReport,
    MatchPrefixResult,
} from "./MatchPrefixResult";
import {
    FailedMatchReport,
    isFailedMatchReport, isSuccessfulMatchReport, MatchExplanationTreeNode,
    MatchReport, matchReportFromFailureReport, SuccessfulMatchReport, toMatchPrefixResult,
} from "./MatchReport";
import {
    PatternMatch,
} from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

/**
 * Optional match on the given matcher
 * @param o matcher
 * @return {Opt}
 */
export function optional(o: any): MatchingLogic {
    return new Opt(o);
}

export class Opt implements MatchingLogic {

    get $id() {
        return `Opt[${this.matcher.$id}]`;
    }
    public readonly parseNodeName = "Optional";

    private readonly matcher: MatchingLogic;

    /**
     * Optional match
     * @param o matching logic
     */
    constructor(o: any) {
        this.matcher = toMatchingLogic(o);
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (is.exhausted()) {
            // console.log(`Match from Opt on exhausted stream`);
            return successfulMatchReport(this, {
                matched: "",
                offset: is.offset,
                parseNodeName: this.parseNodeName,
                valueRepresented: { value: undefined },
                reason: "Input stream is exhausted. Good thing this was optional.",
            });
        }

        const maybe = this.matcher.matchPrefixReport(is, thisMatchContext, parseContext);
        if (isSuccessfulMatchReport(maybe)) {
            return wrappingMatchReport(this, { parseNodeName: this.parseNodeName, inner: maybe });
        }
        return new WrappingEmptyMatchReport(this,
            this.parseNodeName,
            (maybe as FailedMatchReport), // shim: someday there will be only the two
        );
    }
}

class WrappingEmptyMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";
    public readonly matched = "";
    public readonly offset: number;
    public readonly endingOffset: number;

    constructor(public readonly matcher: MatchingLogic,
        private readonly parseNodeName: string,
        private readonly inner: FailedMatchReport) {
        this.offset = inner.offset;
        this.endingOffset = inner.offset;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        const pm: PatternMatch = {
            $matcherId: this.matcher.$id,
            $matched: this.matched,
            $offset: this.offset,
            $value: undefined,
            matchedStructure: <TT>() => undefined as TT, // really should be T
        };
        // hack for compatibility with isSuccessfulMatch
        (pm as any).$successfulMatch = true;
        return pm as (PatternMatch & T);
    }
    public toParseTree(): TreeNodeCompatible {
        return {
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: [],
        };
    }
    public toValueStructure<T>(): T {
        return undefined;
    }
    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            reason: "Did not match, but that's OK; it's optional.",
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: [this.inner.toExplanationTree()],
            successful: true,
        };
    }

}

/**
 * Match the first of these matchers that matches. Equivalent to an Alt (alternate)
 * @param a first matcher
 * @param b second matcher
 * @param matchers any further matchers: varargs
 * @returns {Alt}
 */
export function firstOf(a: any, b: any, ...matchers: any[]): MatchingLogic {
    return new Alt(a, b, ...matchers);
}

/**
 * Matches first match of 2 or more matchers.
 */
export class Alt implements MatchingLogic {

    public readonly matchers: MatchingLogic[];
    public readonly parseNodeName = "Alternative";

    constructor(a: any, b: any, ...matchers: any[]) {
        const matchObjects = [a, b].concat(matchers);
        this.matchers = matchObjects.map(m => toMatchingLogic(m));
    }

    // tslint:disable-next-line:member-ordering
    get $id() {
        return `Alt(${this.matchers.map(m => m.$id).join(",")})`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (is.exhausted()) {
            return failedMatchReport(this, {
                offset: is.offset,
                parseNodeName: this.parseNodeName,
                reason: "Input exhausted",
            });
        }

        const failedMatches: FailedMatchReport[] = [];
        for (const matcher of this.matchers) {
            const m = matcher.matchPrefixReport(is, thisMatchContext, parseContext);
            if (isSuccessfulMatchReport(m)) {
                return wrappingMatchReport(this, {
                    inner: m,
                    additional: failedMatches,
                    parseNodeName: this.parseNodeName,
                });
            } else if (isFailedMatchReport(m)) {
                failedMatches.push(m);
            } else {
                console.log("Warning: not retaining failed match report from " + m.matcher.$id);
            }
        }
        return failedMatchReport(this, {
            parseNodeName: this.parseNodeName,
            offset: is.offset,
            children: failedMatches,
            reason: "All alternatives failed",
        });
    }
}

/**
 * Add a condition with a function that verifies that even if we found a match
 * we are happy with it: For example, we like the value it contains.
 * Also capable of vetoing match if the input state is problematic before the potential match
 */
export function when(
    o: any,
    matchTest: (pm: PatternMatch) => boolean,
    inputStateTest: (is: InputState) => boolean = () => true,
): MatchingLogic {
    const output = new WhenMatcher(toMatchingLogic(o), matchTest, inputStateTest);

    for (const prop in o) {
        if (o.hasOwnProperty(prop)) {
            output[prop] = o[prop];
        }
    }
    return output;
}
class WhenMatcher implements MatchingLogic {

    public readonly $id: string;

    constructor(public readonly inner: MatchingLogic,
        public readonly matchTest: (pm: PatternMatch) => boolean,
        public readonly inputStateTest: (is: InputState) => boolean) {

        this.$id = `When[${inner.$id}]`;
        this.canStartWith = inner.canStartWith;
    }
    public canStartWith?(char: string): boolean;

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        if (!this.inputStateTest(is)) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                cause: "Input state test returned false",
            }));
        }
        const result = this.inner.matchPrefixReport(is, thisMatchContext, parseContext);
        const resultMpr = toMatchPrefixResult(result); // shim
        if (!isSuccessfulMatchReport(result)) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                children: [resultMpr],
                cause: (resultMpr as MatchFailureReport).description,
            }));
        }
        if (!this.matchTest(result.toPatternMatch())) {
            return matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                $matched: result.matched,
                children: [resultMpr],
                cause: "Match test returned false",
            }));
        }
        return successfulMatchReport(this, {
            matched: result.matched, offset: result.offset,
            valueRepresented: { value: result.toPatternMatch().$value },
            parseNodeName: "When",
        });
    }

    public matchPrefix(a, b, c) { return toMatchPrefixResult(this.matchPrefixReport(a, b, c)); }

}
