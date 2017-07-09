import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { isSuccessfulMatch, MatchPrefixResult, matchPrefixSuccess, SuccessfulMatch } from "../MatchPrefixResult";
import { isTreePatternMatch, TerminalPatternMatch } from "../PatternMatch";
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
                const relevantSubMatch = r.match.$valueMatches[onlyPropertyName];
                // TODO how do we update this?
                const match = new TerminalPatternMatch(r.$matcherId, r.$matched, r.$offset, relevantSubMatch.$value);
                return matchPrefixSuccess(match);
            } else {
                return r;
            }
        }
        return r;
    }

}
