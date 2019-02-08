import { InputState } from "../InputState";
import { wrappingFailedMatchReport, wrappingMatchReport } from "../internal/matchReport/wrappingMatchReport";
import { MatchingLogic } from "../Matchers";
import {
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    FailedMatchReport, isSuccessfulMatchReport, MatchReport,
    toMatchPrefixResult,
} from "../MatchReport";
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
            const vs = r.toValueStructure();
            if (typeof vs === "object") {
                const properties = Object.keys(vs);
                if (properties.length !== 1) {
                    throw new Error(`Cannot flatten a structure with more than one property: Found [${properties.join(",")}]`);
                }
                const valueRepresented = vs[properties[0]];
                return wrappingMatchReport(this, { inner: r, parseNodeName: "Flatten", valueRepresented });
            } else {
                return wrappingMatchReport(this, { inner: r, parseNodeName: "Flatten" });
            }
        }
        return wrappingFailedMatchReport(this, { inner: (r as FailedMatchReport), parseNodeName: "Flatten" });
    }
}
