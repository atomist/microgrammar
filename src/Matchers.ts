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
 * Core matching logic interface. Only the matchPrefix method must be implemented
 * to implement a matcher. Optional properties and functions
 * can help make matching more efficient.
 */
export interface MatchingLogic extends Term {

    /**
     * Optimization property. Prefix that's required for this to match.
     * Return undefined if we don't know. If we can provide this information,
     * it can make matching much more efficient if this is the first
     * matcher in a Microgrammar.
     */
    readonly requiredPrefix?: string;

    /**
     * Core matching method. Can we match at the present point in the
     * given InputState
     * @param is input state
     * @param context context: What's already bound by other matchers,
     * and what this matcher should bind to if it wishes
     */
    matchPrefix(is: InputState): MatchPrefixResult;

    /**
     * Optimization method. Can a match start with this character?
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
