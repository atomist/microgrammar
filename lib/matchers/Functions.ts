import { InputState } from "../InputState";
import { wrappingFailedMatchReport } from "../internal/matchReport/wrappingMatchReport";
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
import { isTreePatternMatch, PatternMatch } from "../PatternMatch";
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
            return new FlatteningMatchReport(this, r);
        }
        return wrappingFailedMatchReport(this, { inner: (r as FailedMatchReport), parseNodeName: "Flatten" });
    }
}

// consider abstracting a superclass from this and wrappingMatchReport
class FlatteningMatchReport implements SuccessfulMatchReport {

    public readonly matched: string;
    public readonly offset: number;
    public readonly endingOffset: number;
    public readonly kind = "real";
    public readonly successful = true;
    public readonly parseNodeName = "Flatten";

    constructor(public readonly matcher: MatchingLogic,
                private readonly inner: SuccessfulMatchReport) {
        this.matched = inner.matched;
        this.offset = inner.offset;
        this.endingOffset = inner.endingOffset;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        const match = this.inner.toPatternMatch<T>();
        if (isTreePatternMatch(match)) {
            const propNames =
                Object.getOwnPropertyNames(match.submatches());
            if (propNames.length !== 1) {
                throw new Error(`Cannot flatten a structure with more than one property: Found [${propNames.join(",")}]`);
            }
            const onlyPropertyName = propNames[0];
            const relevantSubMatch = match.$valueMatches[onlyPropertyName];
            // TODO how do we update this?
            return successfulPatternMatch({
                matcherId: this.matcher.$id, matched: match.$matched, offset: match.$offset,
                valueRepresented: { value: relevantSubMatch.$value },
            }) as PatternMatch & T;
        } else {
            return match;
        }
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
        const innerVs = this.inner.toValueStructure();
        if (typeof innerVs === "object") {
            const propNames = Object.keys(innerVs);
            if (propNames.length !== 1) {
                throw new Error(`Cannot flatten a structure with more than one property: Found [${propNames.join(",")}]`);
            }
            return innerVs[propNames[0]] as T;
        } else {
            return innerVs as T;
        }
    }

}

// consider moving this to terminalMatchReport and also calling it there
function successfulPatternMatch(params: {
    matcherId: string,
    matched: string,
    offset: number,
    valueRepresented?: { value: any }, // you can explicitly provide "undefined"
}): PatternMatch {
    const { matched, offset } = params;
    const $value = params.valueRepresented ? params.valueRepresented.value : matched;

    const pm: PatternMatch = {
        $matcherId: params.matcherId,
        $matched: matched,
        $offset: offset,
        $value,
        matchedStructure: <TT>() => $value as TT,
    };

    // shim. hack for compatibility with isSuccessfulMatch
    (pm as any).$successfulMatch = true;

    return pm;
}
