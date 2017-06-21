import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";
import { DismatchReport, TerminalPatternMatch } from "./PatternMatch";

/**
 * Match a literal string
 */
export class Literal implements MatchingLogic {

    public $id = `Literal[${this.literal}]`;

    constructor(public literal: string) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        return (is.peek(this.literal.length) === this.literal) ?
            new TerminalPatternMatch(this.$id, this.literal, is.offset, this.literal, context) :
            new DismatchReport(this.$id, is.offset, context);
    }
}

/**
 * Support for regex matching. Subclasses can convert the value to
 * whatever type they require.
 */
export abstract class AbstractRegex implements MatchingLogic {

    public $id = `Regex: ${this.regex.source}`;

    protected log = false;

    constructor(public regex: RegExp) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        // TODO this is fragile as it only takes the top content
        const remainder = is.peek(2000);
        const results: RegExpExecArray = this.regex.exec(remainder);
        if (this.log) {
            console.log(`AbstractRegex match for ${this.regex} in [${remainder}...] was [${results}]`);
        }

        if (results && results.length > 0 && results[0]) {
            // Matched may not be the same as results[0]
            // If there's not an anchor, we may match before
            const actualMatch = results[0];
            const matched = remainder.substring(0, remainder.indexOf(actualMatch)) + actualMatch;
            return new TerminalPatternMatch(
                this.$id,
                matched,
                is.offset,
                this.toValue(actualMatch),
                context);
        } else {
            return new DismatchReport(this.$id, is.offset, context);
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
     * Do not use an end anchor.
     * If you use a start anchor, the match must begin at the beginning.
     * If you do not use a start anchor, content can be skipped.
     */
    constructor(public regex: RegExp) {
        super(regex);
    }

    protected toValue(s: string) {
        return s;
    }
}

export const matchEverything: MatchingLogic = {
    $id: "matchEverything",

    matchPrefix(is: InputState): MatchPrefixResult {
        const everything = is.peek(100000); // cheating!
        return new TerminalPatternMatch(
            this.$id,
            everything,
            is.offset,
            is.consume(everything),
            context);
    },
};

export class MatchInteger extends AbstractRegex {

    constructor() {
        super(/^[1-9][0-9]*/);
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
        super(/^[+-]?\d*[\.]?\d+/);
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
