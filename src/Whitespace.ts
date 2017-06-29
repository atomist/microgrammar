import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";

import { Config, DefaultConfig } from "./Config";

/**
 * Prepare to match. Skip whitespace if appropriate. Skip irrelevant content if
 * we have a matcher we're preparing for.
 * @param is current input state
 * @param config config, which tells us whether we should skipWhile whitespace
 * @param m matcher we want to match. If it has a definite prefix, we can skipWhile content.
 * @return {any}
 */
export function readyToMatch(is: InputState, config: Config = DefaultConfig, m?: MatchingLogic): [string, InputState] {
    const lookFor = m ? m.requiredPrefix : undefined;
    if (lookFor) {
        const r = is.skipTo(lookFor);
        const skipped = r.seenSince(is);
        return [skipped, r];
    } else if (config.consumeWhiteSpaceBetweenTokens) {
         const r = is.skipWhile(c => c.trim() === "" || m && m.canStartWith && !m.canStartWith(c));
         return [r.seenSince(is), r];
    } else {
        return ["", is];
    }
}
