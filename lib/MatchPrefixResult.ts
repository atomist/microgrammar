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

/**
 * Holds a PatternMatch in the event of success.
 * If this contains a context, then the parent matcher can use that to populate its own;
 * otherwise, it can use the value of the match
 */
export class SuccessfulMatch implements MatchPrefixResult {

    public constructor(public readonly match: PatternMatch,
                       public readonly capturedStructure?: {}) {
        if (match === undefined) {
            throw new Error("You can't be successful with an undefined match");
        }
    }

    get $offset() { return this.match.$offset; }

    get $matcherId() { return this.match.$matcherId; }

    get $matched() {
        return this.match.$matched;
    } // convenience

    get $value() { return this.match.$value; } // convenience
}

export function matchPrefixSuccess(match: PatternMatch, context?: {}): SuccessfulMatch {
    return new SuccessfulMatch(match, context);
}

export function isSuccessfulMatch(mpr: MatchPrefixResult): mpr is SuccessfulMatch {
    if ((mpr as any).$successfulMatch) {
        // prefer isSuccessfulMatchReport
        return true;
    }
    return mpr && (mpr as SuccessfulMatch).match !== undefined;
}
