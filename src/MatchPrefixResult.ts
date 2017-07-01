/**
 * Pattern match. Holds user properties, with user-defined names,
 * and Atomist pattern match properties with a $ prefix.
 */
export interface MatchPrefixResult {

    /**
     * Offset of the match within the input, from 0
     */
    readonly $offset: number;

    /**
     * Id of the matcher that made the match
     */
    readonly $matcherId: string;

    /**
     * Context bound to the match. Context values are normally
     * bound directly to the match itself, so callers don't
     * usually need to use this.
     */
    readonly $context: {};

}
