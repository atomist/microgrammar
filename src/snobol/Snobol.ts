/**
 * SNOBOL-inspired primitives
 */

import { toMatchingLogic } from "../Concat";
import { InputState } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { MatchPrefixResult } from "../MatchPrefixResult";
import { DismatchReport, isPatternMatch, TerminalPatternMatch } from "../PatternMatch";
import { Literal } from "../Primitives";

/**
 * Inspired by Snobol SPAN: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * SPAN(S) matches one or more subject characters from the set in S.
 * SPAN must match at least one subject character, and will match the LONGEST subject string possible.
 */
export class Span implements MatchingLogic {

    public $id = `Span[${this.characters}]`;

    constructor(public characters: string) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        let currentIs = is;
        let matched = "";
        while (!currentIs.exhausted() && this.characters.indexOf(currentIs.peek(1)) > -1) {
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
        }
        return (currentIs !== is) ?
            new TerminalPatternMatch(this.$id, matched, is.offset, currentIs, context) :
            new DismatchReport(this.$id, is.offset, context);
    }
}

/**
 * Match a string until the given logic. Wraps Break
 */
export function takeUntil(what): MatchingLogic {
    return new Break(what);
}

/**
 * Inspired by Snobol BREAK: http://www.snobol4.org/docs/burks/tutorial/ch4.htm
 * BREAK(S) matches "up to but not including" any character in S.
 * The string matched must always be followed in the subject by a character in S.
 * Unlike SPAN and NOTANY, BREAK will match the null string.
 */
export class Break implements MatchingLogic {

    private inner: MatchingLogic;

    constructor(private breakOn: any) {
        this.inner = toMatchingLogic(breakOn);
    }

    // tslint:disable-next-line:member-ordering
    public $id = `Break[${this.breakOn}]`;

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        if (is.exhausted()) {
            return new TerminalPatternMatch(this.$id, "", is.offset, is, context);
        }

        let currentIs = is;
        let matched = "";
        while (!currentIs.exhausted() && !this.fits(currentIs, context)) { // if it fits, it sits
            matched += currentIs.peek(1);
            currentIs = currentIs.advance();
        }
        return new TerminalPatternMatch(this.$id, matched, is.offset, matched, context);
    }

    private fits(is: InputState, context: {}): boolean {
        return isPatternMatch(this.inner.matchPrefix(is, context));
    }
}