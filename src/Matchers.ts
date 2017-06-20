import { InputState } from "./InputState";
import { MatchPrefixResult } from "./MatchPrefixResult";

/**
 * Tag interface for named matches.
 * If you want to name your matches, implement this.
 */
export interface Term {

    readonly $id?: string;
}

export const AnonymousDefinition: Term = {

    $id: "AnonymousDefinition",
};

/**
 * Anonymous matcher
 */
export interface MatchingLogic extends Term {

    matchPrefix(is: InputState): MatchPrefixResult;
}

/**
 * Matching logic associated with a name
 */
export interface Matcher extends MatchingLogic {

    readonly name: string;

}
