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
     * given InputState? Context arguments may be used by matchers that
     * require knowledge of current match or global context.
     * @param is input state
     * @param thisMatchContext context for this match, beginning from the top level and
     * passed into nested matchers
     * @param parseContext context for the whole parsing operation we're in: e.g. parsing a file
     */
    matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult;

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

/**
 * Interface implemented by matchers that can be lazily initialized
 */
export interface LazyMatchingLogic extends MatchingLogic {

    $lazy: boolean;

    /**
     * Prepare the matcher for use
     * @private
     */
    _init(): void;

}
