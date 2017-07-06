import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import {MatchFailureReport, MatchPrefixResult, matchPrefixSuccess} from "./MatchPrefixResult";
import {  TerminalPatternMatch } from "./PatternMatch";

/**
 * Match a literal string
 */
export class Literal implements MatchingLogic {

    public $id = `Literal[${this.literal}]`;

    constructor(public literal: string) {
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        const peek = is.peek(this.literal.length);
        return (peek === this.literal) ?
            matchPrefixSuccess(new TerminalPatternMatch(this.$id, this.literal, is.offset, this.literal, context) ) :
            new MatchFailureReport(this.$id, is.offset, context,
                `Did not match literal [${this.literal}]: saw [${peek}]`);
    }

    public canStartWith(char: string): boolean {
        return this.literal[0] === char;
    }

    get requiredPrefix(): string {
        return this.literal;
    }
}

export function isLiteral(ml: MatchingLogic): ml is Literal {
    return ml && (ml as Literal).literal !== undefined;
}

const LOOK_AHEAD_SIZE = 100;

/**
 * Support for regex matching. Subclasses can convert the value to
 * whatever type they require.
 */
export abstract class AbstractRegex implements MatchingLogic {

    public readonly regex: RegExp;

    get $id() {
        return `Regex: ${this.regex.source}`;
    }

    /**
     * Match a regular expression
     * @param regex JavaScript regex to match. Don't use an end anchor.
     * Start anchor will be added if not already there
     * @param lookahead number of characters to pull from the input to try to match.
     * We'll keep grabbing more if a match is found for the whole string
     */
    constructor(regex: RegExp, private lookahead: number = LOOK_AHEAD_SIZE) {
        this.regex = regex.source.charAt(0) !== "^" ? new RegExp("^" + regex.source) : regex;
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        let results: RegExpExecArray;
        let remainder: string;
        let seen = 0;

        // Keep asking for more input if we have matched all of the input in
        // our lookahead buffer
        do {
            seen += this.lookahead;
            remainder = is.peek(seen);
            results = this.regex.exec(remainder);
        } while (results && results[0] === remainder && remainder.length === seen);

        if (results && results[0]) {
            // Matched may not be the same as results[0]
            // If there's not an anchor, we may match before
            const actualMatch = results[0];
            const matched = remainder.substring(0, remainder.indexOf(actualMatch)) + actualMatch;
            return matchPrefixSuccess(new TerminalPatternMatch(
                this.$id,
                matched,
                is.offset,
                this.toValue(actualMatch),
                context));
        } else {
            return new MatchFailureReport(this.$id, is.offset, context,
                `Did not match regex /${this.regex.source}/ in [${remainder}]`);
        }
    }

    /**
     * Subclasses will override this to convert the string value from a successful
     * match to any type they require. This enables safe creation of custom types.
     * @param s raw string resulting from a successful match
     */
    protected abstract toValue(s: string): any;
}

/**
 * Match a regular expression.
 */
export class Regex extends AbstractRegex {

    /**
     * Create wrapping a native JavaScript regular expression
     * @param regex Regular expression to wrap.
     * Do not use an end anchor. If a start anchor isn't provided it will be added
     */
    constructor(regex: RegExp) {
        super(regex);
    }

    protected toValue(s: string) {
        return s;
    }
}

export class MatchInteger extends AbstractRegex {

    constructor() {
        super(/[1-9][0-9]*/);
    }

    public canStartWith(c: string): boolean {
        return !isNaN(+c);
    }

    protected toValue(s: string) {
        return parseInt(s, 10);
    }

}

/**
 * Match an integer. Leading 0 not permitted
 */
export const Integer = new MatchInteger();

export class MatchFloat extends AbstractRegex {

    constructor() {
        super(/[+-]?\d*[\.]?\d+/);
    }

    protected toValue(s: string) {
        return parseFloat(s);
    }

}

/**
 * Match a float.
 */
export const Float = new MatchFloat();

export class MatchLowercaseBoolean extends AbstractRegex {

    constructor() {
        super(/^false|true/);
    }

    protected toValue(s: string): boolean {
        return s === "true";
    }

}

/**
 * Match a LowercaseBoolean.
 */
export const LowercaseBoolean = new MatchLowercaseBoolean();
