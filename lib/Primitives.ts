import { InputState } from "./InputState";
import { failedMatchReport } from "./internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "./internal/matchReport/terminalMatchReport";
import { MatchingLogic } from "./Matchers";
import {
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "./MatchPrefixResult";
import {
    MatchReport,
    toMatchPrefixResult,
} from "./MatchReport";
import { TerminalPatternMatch } from "./PatternMatch";

/**
 * Match a literal string
 */
export class Literal implements MatchingLogic {

    public $id = `Literal[${this.literal}]`;
    public readonly parseNodeName = "Literal";

    constructor(public literal: string) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is));
    }

    public matchPrefixReport(is: InputState): MatchReport {
        const peek = is.peek(this.literal.length);
        return (peek === this.literal) ?
            successfulMatchReport(this, {
                matched: this.literal,
                parseNodeName: this.parseNodeName,
                offset: is.offset,
            }) :
            failedMatchReport(this, {
                offset: is.offset,
                matched: commonPortion(this.literal, peek),
                reason: `Did not match literal [${this.literal}]: saw [${peek}]`,
                parseNodeName: this.parseNodeName,
            });
    }

    public canStartWith(char: string): boolean {
        return this.literal[0] === char;
    }

    get requiredPrefix(): string {
        return this.literal;
    }
}

function commonPortion(str1: string, str2: string) {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
        i++;
    }
    return str1.slice(0, i);
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

    protected readonly parseNodeName: string;

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
    constructor(regex: RegExp, private readonly lookahead: number = LOOK_AHEAD_SIZE, parseNodeName?: string) {
        this.regex = regex.source.charAt(0) !== "^" ? new RegExp("^" + regex.source) : regex;
        this.parseNodeName = parseNodeName || "Regex";
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        const output = toMatchPrefixResult(this.matchPrefixReport(is));
        if (!output) { // debugging shim
            throw new Error("That should never return undefined");
        }
        return output;
    }

    public matchPrefixReport(is: InputState): MatchReport {
        let results: RegExpExecArray;
        let lookAt: string;
        let charactersToSee = 0;

        function theRegexMatchedSomething(): boolean {
            return !!results && !!results[0];
        }

        function matchedEverythingWeLookedAt(): boolean {
            return results[0] === lookAt;
        }

        function thereIsMoreToRead(): boolean {
            return lookAt.length === charactersToSee;
        }

        // Keep asking for more input if we have matched all of the input in
        // our lookahead buffer
        do {
            charactersToSee += this.lookahead;
            lookAt = is.peek(charactersToSee);
            results = this.regex.exec(lookAt);
        } while (theRegexMatchedSomething() && matchedEverythingWeLookedAt() && thereIsMoreToRead());

        if (theRegexMatchedSomething()) {
            const matched = results[0];
            return successfulMatchReport(this, {
                matched,
                offset: is.offset,
                parseNodeName: this.parseNodeName,
                valueRepresented: { value: this.toValue(matched) },
                reason: "Matched RegExp: " + this.regex.toString(),
            });
        } else {
            return failedMatchReport(this, {
                offset: is.offset,
                parseNodeName: this.parseNodeName,
                reason: `Did not match regex /${this.regex.source}/ in [${lookAt}]`,
            });
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
        super(/(?:0|[1-9]\d*)/);
    }

    public canStartWith(c: string): boolean {
        return !isNaN(+c);
    }

    protected toValue(s: string) {
        return parseInt(s, 10);
    }

}

/**
 * Match an integer. Allows 0  but not leading 0 if more digits
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
