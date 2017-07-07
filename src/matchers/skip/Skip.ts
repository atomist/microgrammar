/**
 * Convenient operations to skip over input
 */

import { MatchingLogic } from "../../Matchers";
import { Break } from "../snobol/Break";

import { InputState } from "../../InputState";
import {matchPrefixSuccess} from "../../MatchPrefixResult";
import { TerminalPatternMatch } from "../../PatternMatch";

/**
 * Match the rest of the input.
 * @type {{$id: string; matchPrefix: ((is:InputState)}}
 */
export const RestOfInput: MatchingLogic = {

    $id: "RestOfInput",

    matchPrefix(is: InputState) {
        const consumed = is.skipWhile(s => true, 1);
        return matchPrefixSuccess(
            new TerminalPatternMatch(this.$id, consumed.skipped, is.offset, consumed.skipped));
    },
};

/**
 * Match a string until the given logic. Wraps Break.
 * Binds the content until the break.
 */
export function takeUntil(what): MatchingLogic {
    return new Break(what);
}

/**
 * Return a match for the first thing if it doesn't
 * @param a desired match
 * @param b match we don't want.
 */
export function yadaYadaThenThisButNotThat(a, b): MatchingLogic {
    return new Break(a, true, b);
}

/**
 * Anything, then the given matcher. Binds the terminal match
 * @param a desired match
 * @returns {Break}
 */
export function yadaYadaThen(a): MatchingLogic {
    return new Break(a, true);
}
