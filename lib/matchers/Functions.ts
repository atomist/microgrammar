import { InputState } from "../InputState";
import { WithNamedChildren, isTreeMatchReport } from "../internal/matchReport/treeMatchReport";
import { wrappingFailedMatchReport, wrappingMatchReport } from "../internal/matchReport/wrappingMatchReport";
import { MatchingLogic } from "../Matchers";
import {
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    FailedMatchReport, isSuccessfulMatchReport, MatchExplanationTreeNode,
    MatchReport,
    SuccessfulMatchReport,
    toMatchPrefixResult,
} from "../MatchReport";
import { PatternMatch } from "../PatternMatch";
import { TreeNodeCompatible } from "../TreeNodeCompatible";
import { toMatchingLogic } from "./Concat";

/**
 * Flatten this match, pulling up its only property with the name given to
 * this matcher.
 * @param o matcher
 * @return {FlatteningMatcher}
 */
export function flatten(o: any): MatchingLogic {
    return new FlatteningMatcher(toMatchingLogic(o));
}

class FlatteningMatcher implements MatchingLogic {

    constructor(private readonly delegate: MatchingLogic) {
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext: {}, parseContext: {}): MatchReport {
        const r = this.delegate.matchPrefixReport(is, thisMatchContext, parseContext);
        if (isSuccessfulMatchReport(r)) {
            if (isTreeMatchReport(r)) {
                const vs = r.toValueStructure();
                const properties = Object.keys(vs);
                if (properties.length !== 1) {
                    throw new Error(`Cannot flatten a structure with more than one property: Found [${properties.join(",")}]`);
                }
                return new FlatteningMatchReport(this, r, properties[0]);
            } else {
                return wrappingMatchReport(this, { inner: r, parseNodeName: "Flatten" });
            }
        }
        return wrappingFailedMatchReport(this, { inner: (r as FailedMatchReport), parseNodeName: "Flatten" });
    }
}

class FlatteningMatchReport implements SuccessfulMatchReport {

    public readonly matched: string;
    public readonly offset: number;
    public readonly kind = "real";
    public readonly successful = true;
    public readonly parseNodeName = "Flatten";

    private readonly flattenTo: SuccessfulMatchReport;

    constructor(public readonly matcher: MatchingLogic,
        private readonly inner: SuccessfulMatchReport & WithNamedChildren,
        namedChild: string) {
        this.matched = inner.matched;
        this.flattenTo = (inner.getChildMatchReport(namedChild) as SuccessfulMatchReport);
        this.offset = this.flattenTo.offset;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        return this.flattenTo.toPatternMatch<T>();
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
            $name: this.parseNodeName,
            $offset: this.inner.offset,
            $value: this.inner.matched,
            successful: true,
            $children: [this.inner.toExplanationTree()],
        };
    }

    public toValueStructure<T>(): T {
        throw new Error("Method not implemented.");
    }

}
