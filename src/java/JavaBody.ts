import { Concat } from "../Concat";
import { InputState, inputStateFromString } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { MatchPrefixResult } from "../MatchPrefixResult";
import { DismatchReport, isPatternMatch, TerminalPatternMatch, TreePatternMatch } from "../PatternMatch";
import { JavaContentStateMachine } from "./JavaContentStateMachine";

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

        const innerMatch = this.inner.matchPrefix(inputStateFromString(matched), context);
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
});
