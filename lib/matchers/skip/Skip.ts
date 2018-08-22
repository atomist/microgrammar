/**
 * Convenient operations to skip over input
 */

import { Break } from "../../internal/Break";
import { MatchingLogic } from "../../Matchers";

import { InputState } from "../../InputState";
import { matchPrefixSuccess } from "../../MatchPrefixResult";
import { TerminalPatternMatch } from "../../PatternMatch";
import { Literal } from "../../Primitives";
import { toMatchingLogic } from "../Concat";

/**
 * Match the rest of the input.
 */
export const RestOfInput: MatchingLogic = {

    $id: "RestOfInput",

    matchPrefix(is: InputState) {
        const consumed = is.skipWhile(s => true, 1);
        return matchPrefixSuccess(
            // tslint:disable:no-invalid-this
            new TerminalPatternMatch(this.$id, consumed.skipped, is.offset, consumed.skipped));
    },
};

/**
 * Match the rest of the current line
 */
export const RestOfLine: MatchingLogic = new Break(new Literal("\n"));

/**
 * Match a string until the given matcher. Wraps Break.
 * Binds the content until the break.
 */
export function takeUntil(what): MatchingLogic {
    return new Break(toMatchingLogic(what));
}

/**
 * Skip all content until the given matcher. Bind its match
 */
export function skipTo(what): MatchingLogic {
    return new Break(toMatchingLogic(what), true);
}

/**
 * Return a match for the first thing if it doesn't
 * @param a desired match
 * @param b match we don't want.
 */
export function yadaYadaThenThisButNotThat(a, b): MatchingLogic {
    return new Break(toMatchingLogic(a), true, toMatchingLogic(b));
}

/**
 * Anything, then the given matcher. Binds the terminal match
 * @param a desired match
 * @returns {Break}
 */
export function yadaYadaThen(a): MatchingLogic {
    return new Break(toMatchingLogic(a), true);
}
