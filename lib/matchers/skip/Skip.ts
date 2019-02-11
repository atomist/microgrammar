/**
 * Convenient operations to skip over input
 */

import { Break } from "../../internal/Break";
import { MatchingLogic } from "../../Matchers";

import { InputState } from "../../InputState";
import { MatchPrefixResult } from "../../MatchPrefixResult";
import { toMatchPrefixResult } from "../../MatchReport";
import { Literal } from "../../Primitives";
import { toMatchingLogic } from "../Concat";
import { successfulMatchReport } from "../../internal/matchReport/terminalMatchReport";

/**
 * Match the rest of the input.
 */
export const RestOfInput: MatchingLogic = {

    $id: "RestOfInput",

    matchPrefix(is: InputState):
        MatchPrefixResult {
        return toMatchPrefixResult(restOfInputMatchPrefixReport(is));
    },

    matchPrefixReport: restOfInputMatchPrefixReport,
};

function restOfInputMatchPrefixReport(is: InputState) {
    const consumed = is.skipWhile(() => true, 1);
    return successfulMatchReport(RestOfInput, {
        parseNodeName: "RestOfInput",
        matched: consumed.skipped,
        offset: is.offset,
    });
}

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
