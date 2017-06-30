import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";

import { Config, DefaultConfig } from "./Config";

/**
 * Prepare to match. Skip whitespace if appropriate. Skip irrelevant content if
 * we have a matcher we're preparing for.
 * @param is current input state
 * @param config config, which tells us whether we should skipWhile whitespace
 * @param matchers matchers we want to match. If there are multiple matchers,
 * we calculate the longest common prefix (if known). Undefined array
 * elements are ignored, after the first matcher.
 * If there is a definite prefix, we can skipWhile content.
 * @return {any}
 */
export function readyToMatch(is: InputState, config: Config = DefaultConfig,
                             ...matchers: MatchingLogic[]): [string, InputState] {
    const lookFor = commonPrefix(matchers);
    if (lookFor) {
        const r = is.skipTo(lookFor);
        const skipped = r.seenSince(is);
        return [skipped, r];
    } else if (config.consumeWhiteSpaceBetweenTokens) {
        const r = is.skipWhile(c => c.trim() === ""); // || m && m.canStartWith && !m.canStartWith(c));
        return [r.seenSince(is), r];
    } else {
        return ["", is];
    }
}

/**
 * Find a common prefix that all these matchers share
 */
function commonPrefix(matchers: MatchingLogic[]): string {
    if (matchers.length === 0) {
        return undefined;
    }
    if (matchers.length === 1) {
        return matchers[0].requiredPrefix;
    }
    const prefixes = matchers.filter(m => m !== undefined).map(m => m.requiredPrefix);
    if (prefixes.indexOf(undefined) !== -1) {
        return undefined;
    }
    return sharedStart(prefixes);
}

// See https://stackoverflow.com/questions/1916218/
// find-the-longest-common-starting-substring-in-a-set-of-strings/1917041#1917041
function sharedStart(array: string[]) {
    const A = array.concat().sort();
    const a1 = A[0];
    const a2 = A[A.length - 1];
    const L = a1.length;
    let i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) {
        i++;
    }
    return a1.substring(0, i);
}
