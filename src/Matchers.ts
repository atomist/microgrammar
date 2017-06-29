import { InputState } from "./InputState";
import { MatchPrefixResult } from "./MatchPrefixResult";

/**
 * Tag interface for named matches.
 * If you want to name your matches, implement this.
 */
export interface Term {

    readonly $id?: string;
}

/**
 * Anonymous matcher. Only the matchPrefix method must be implemented
 * to implement a matcher. Optional properties and functions
 * can help make matching more efficient.
 */
export interface MatchingLogic extends Term {

    /**
     * Prefix that's required for this to match.
     * Return undefined if we don't know
     */
    requiredPrefix?: string;

    matchPrefix(is: InputState, context: {}): MatchPrefixResult;

    /**
     * Can a match start with this character?
     * @param char character to test for
     */
    canStartWith?(char: string): boolean;

}

/**
 * Matching logic associated with a name
 */
export interface Matcher extends MatchingLogic {

    readonly name: string;

}
