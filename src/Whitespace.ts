import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { isPatternMatch, PatternMatch } from "./PatternMatch";
import { Regex } from "./Primitives";

/**
 * Consume any white space, returning the content consumed and resulting input state
 * @param is
 */
export function consumeWhitespace(is: InputState): [string, InputState] {
    return discard(is, WHITESPACE_EATER);
}

/**
 * Discard the given matching
 * @param is
 * @param m
 * @returns {any}
 */
export function discard(is: InputState, m: MatchingLogic): [string, InputState] {
    const eaten = m.matchPrefix(is, context);
    if (isPatternMatch(eaten)) {
        return [eaten.$matched, is.consume(eaten.$matched)];
    } else {
        return ["", is];
    }
}

class WhitespaceEater extends Regex {

    constructor() {
        super(WHITESPACE_REGEX);
    }
}

const WHITESPACE_REGEX = /^\s*/;

const WHITESPACE_EATER = new WhitespaceEater();
