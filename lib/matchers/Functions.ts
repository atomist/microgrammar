import { InputState } from "../InputState";
import {
    SuccessfulMatchReportWrapper,
    wrappingFailedMatchReport,
} from "../internal/matchReport/wrappingMatchReport";
import { MatchingLogic } from "../Matchers";
import {
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    FailedMatchReport,
    isSuccessfulMatchReport,
    MatchExplanationTreeNode,
    MatchReport,
    SuccessfulMatchReport,
    toMatchPrefixResult,
} from "../MatchReport";
import {
    isTreePatternMatch,
    PatternMatch,
} from "../PatternMatch";
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
        return wrappingFailedMatchReport(this, { inner: (r), parseNodeName: "Flatten" });
    }
}

class FlatteningMatchReport extends SuccessfulMatchReportWrapper {

    constructor(matcher: MatchingLogic,
        inner: SuccessfulMatchReport) {
        super(matcher, "Flatten", inner);
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

    return pm;
}
