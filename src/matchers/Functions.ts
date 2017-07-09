import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { isSuccessfulMatch, MatchPrefixResult, matchPrefixSuccess, SuccessfulMatch } from "../MatchPrefixResult";
import { isTreePatternMatch } from "../PatternMatch";
import { toMatchingLogic } from "./Concat";

/**
 * Flatten this
 * @param o
 * @return {FlatteningMatcher}
 */
export function flatten(o: any): MatchingLogic {
    return new FlatteningMatcher(toMatchingLogic(o));
}

class FlatteningMatcher implements MatchingLogic {

    constructor(private delegate: MatchingLogic) {
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        const r = this.delegate.matchPrefix(is, thisMatchContext, parseContext);
        if (isSuccessfulMatch(r)) {
            if (isTreePatternMatch(r.match)) {
                const propNames =
                     Object.getOwnPropertyNames(r.match.submatches());
                if (propNames.length !== 1) {
                    throw new Error(`Cannot flatten a structure with more than one property: Found [${propNames.join(",")}]`);
                }
                const onlyPropertyName = propNames[0];
                return matchPrefixSuccess(r.match.$valueMatches[onlyPropertyName]);
            } else {
                return r;
            }
        }
        return r;
    }

}
