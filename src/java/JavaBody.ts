import { Concat } from "../Concat";
import { InputState } from "../InputState";
import { MatchingLogic, Term } from "../Matchers";
import { MatchPrefixResult } from "../MatchPrefixResult";
import { DismatchReport, isPatternMatch, TerminalPatternMatch, TreePatternMatch } from "../PatternMatch";

/**
 * The rest of a Java block, going to a matching depth of +1 curlies.
 * Does not read final curly
 */
class JavaBody implements MatchingLogic {

    public $id: "Java.BlockBody";

    private push: string;

    private pop: string;

    constructor(private kind: "block" | "parens", private inner?: MatchingLogic) {
        switch (kind) {
            case "block":
                [this.push, this.pop] = ["{", "}"];
                break;
            case "parens":
                [this.push, this.pop] = ["(", ")"];
                break;
        }
    }

    public canStartWith(char: string): boolean {
        return this.kind === "block" ?
            char === "{" :
            char === "(";
    }

    get requiredPrefix(): string {
        return this.kind === "block" ?
            "{" :
            "(";
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        const sm = new JavaContentStateMachine();
        let depth = 1;
        if (is.exhausted()) {
            return new TerminalPatternMatch(this.$id, "", is.offset, is, context);
        }

        let currentIs = is;
        let matched = "";
        while (!currentIs.exhausted() && depth > 0) {
            const next = currentIs.peek(1);
            sm.consume(next);
            switch (sm.state) {
                case "outsideString":
                    switch (next) {
                        case this.push:
                            depth++;
                            break;
                        case this.pop:
                            depth--;
                            break;
                        default:
                    }
                    break;
                case "inString":
                case "seenEscapeInString":
                case "inLineComment":
                    break;
            }
            if (depth > 0) {
                matched += next;
                currentIs = currentIs.advance();
            }
        }
        if (!this.inner) {
            return new TerminalPatternMatch(
                this.$id,
                matched,
                is.offset,
                matched,
                context);
        }

        const innerMatch = this.inner.matchPrefix(InputState.fromString(matched), context);
        if (isPatternMatch(innerMatch)) {
            if (this.isTreePatternMatch(innerMatch)) {
                // console.log("body has parts");
                // Tree; take its bits
                // TODO: test offsets and then adjust them
                return new TreePatternMatch(
                    this.$id,
                    matched,
                    is.offset,
                    innerMatch.$matchers,
                    (innerMatch as TreePatternMatch).$subMatches.map(m => m.addOffset(is.offset)),
                    context);

            }
            return new TerminalPatternMatch(
                this.$id,
                matched,
                is.offset,
                matched,
                context);
        } else {
            return new DismatchReport(this.$id, is.offset, innerMatch as DismatchReport);
        }
    }

    private isTreePatternMatch(pm: MatchPrefixResult): pm is TreePatternMatch {
        return (pm as TreePatternMatch).$matchers !== undefined;
    }
}

/**
 * Match a Java block with balanced curlies
 * @type {Term}
 */
export const JavaBlock = new Concat({
    $id: "{...}",
    _lp: "{",
    block: new JavaBody("block"),
    _rp: "}",
});

export function javaBlockContaining(m: Concat) {
    return new Concat({
        $id: "{...}",
        _lp: "{",
        block: new JavaBody("block", m),
        _rp: "}",

    });
}

/**
 * Match a parenthesized Java expression with ()
 * @type {Concat}
 */
export const JavaParenthesizedExpression = new Concat({
    $id: "(...)",
    _lp: "(",
    block: new JavaBody("parens"),
    _rp: ")",
} as Term);

/**
 * Strip Java comments
 * @param source
 */
export function stripComments(source: string) {
    let stripped = "";
    const sm = new JavaContentStateMachine();
    let previousState = sm.state;
    for (const s of source) {
        sm.consume(s);
        switch (sm.state) {
            case "inCComment":
            case "inLineComment":
            case "seen*InCComment":
            case "seen/":
                break;
            case "outsideString":
                if (previousState !== "seen*InCComment") {
                    stripped += s;
                }
                break;
            default:
                stripped += s;
        }
        previousState = sm.state;
    }
    return stripped;
}

/**
 * State machine for recognizing Java strings.
 */
class JavaContentStateMachine {

    public state: "outsideString" | "seen/" | "inString" | "seenEscapeInString" |
        "inLineComment" | "inCComment" | "seen*InCComment" = "outsideString";

    public consume(s: string): void {
        switch (this.state) {
            case "inLineComment":
                if (s === "\n") {
                    this.state = "outsideString";
                }
                break;
            case "inCComment":
                if (s === "*") {
                    this.state = "seen*InCComment";
                }
                break;
            case "seen*InCComment":
                if (s === "/") {
                    this.state = "outsideString";
                }
                break;
            case "outsideString":
                if (s === '"') {
                    this.state = "inString";
                } else if (s === "/") {
                    this.state = "seen/";
                }
                break;
            case "seen/":
                switch (s) {
                    case "/":
                        this.state = "inLineComment";
                        break;
                    case "*":
                        this.state = "inCComment";
                        break;
                    default:
                        this.state = "outsideString";
                        break;
                }
                break;
            case "inString":
                switch (s) {
                    case '"':
                        this.state = "outsideString";
                        break;
                    case "\\":
                        this.state = "seenEscapeInString";
                        break;
                    default:
                }
                break;
            case "seenEscapeInString":
                this.state = "inString";
                break;
        }
    }
}

/**
 * Strip whitespace down to a single space, except in strings
 * Remove whitespaces that aren't syntactically necessary altogether.
 * @param source
 * @returns {string}
 */
export function stripWhitespace(source: string): string {
    let stripped = "";
    let chunk = "";

    const sm = new JavaContentStateMachine();
    let previousState = sm.state;
    for (const s of source) {
        sm.consume(s);
        switch (sm.state) {
            case "inString":
                // If we've just entered a string, add the stripped chunk that preceded it
                if (previousState !== "inString") {
                    stripped += strip(chunk);
                    chunk = "";
                }
                // Take all characters from string without stripping whitespace
                stripped += s;
                break;
            default:
                // Add to a chunk that we'll later strip
                chunk += s;
        }
        previousState = sm.state;
    }
    stripped += strip(chunk);
    return stripped;
}

function strip(src: string): string {
    let stripped = src.replace(/[\s]+/g, " ");
    // Get rid of syntactically unnecessary whitespace
    stripped = stripped.replace(/([{}.@;])\s/g, "$1");
    stripped = stripped.replace(/\s([{}.@;])/g, "$1");
    stripped = stripped.trim();
    return stripped;
}

/**
 * Strip whitespace and comments
 * @param src
 * @returns {string}
 */
export function canonicalize(src: string): string {
    return stripWhitespace(stripComments(src));
}
