import { PatternMatch } from "./PatternMatch";

/**
 * Result of attempting to match a pattern: MatchFailureReport or SuccessfulMatch.
 */
export interface MatchPrefixResult {

    /**
     * Offset of the match within the input, from 0
     */
    readonly $offset: number;

    /**
     * Id of the matcher that attempted the match
     */
    readonly $matcherId: string;

    /**
     * The matched string, if any
     */
    readonly $matched: string;

}

export class MatchFailureReport implements MatchPrefixResult {
    // todo: simplify. include explanationTree

    public static from(params: {
        $matcherId: string,
        $offset: number,
        $matched?: string,
        cause?: string,
        children?: MatchPrefixResult[],
    }): MatchFailureReport {
        const { $matcherId, $offset, $matched, cause, children } = params;
        return new MatchFailureReport($matcherId, $offset, $matched || "", cause,
            (children as MatchFailureReport[]));
    }

    public constructor(public readonly $matcherId: string,
                       public readonly $offset: number,
                       public readonly $matched: string,
                       public readonly cause?: string,
                       public readonly children?: MatchFailureReport[]) {
    }

    get description(): string {
        return `Match failed on ${this.$matcherId}: ${this.cause}`;
    }
}

export function isSuccessfulMatch(mpr: MatchPrefixResult): mpr is PatternMatch {
    return mpr && (mpr as PatternMatch).$value !== undefined && !!(mpr as PatternMatch).matchedStructure;
}
