import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import {
    MatchFailureReport,
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    isSuccessfulMatchReport,
    MatchReport,
    matchReportFromFailureReport,
    matchReportFromPatternMatch,
    matchReportFromSuccessfulMatch,
    toMatchPrefixResult,
} from "../MatchReport";
import {
    isTreePatternMatch,
    TerminalPatternMatch,
} from "../PatternMatch";
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
            const pm = r.toPatternMatch();
            if (isTreePatternMatch(pm)) {
                const propNames =
                    Object.getOwnPropertyNames(pm.submatches());
                if (propNames.length !== 1) {
                    throw new Error(`Cannot flatten a structure with more than one property: Found [${propNames.join(",")}]`);
                }
                const onlyPropertyName = propNames[0];
                const relevantSubMatch = pm.$valueMatches[onlyPropertyName];
                // TODO how do we update this?
                const match = new TerminalPatternMatch(r.matcher.$id, r.matched, r.offset, relevantSubMatch.$value);
                return matchReportFromPatternMatch(this, match);
            } else {
                return matchReportFromSuccessfulMatch(this, r.toPatternMatch());
            }
        }
        return matchReportFromFailureReport(this, toMatchPrefixResult(r) as MatchFailureReport); // todo: wrap failure
    }

}
