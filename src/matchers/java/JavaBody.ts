import { InputState } from "../../InputState";
import { MatchingLogic } from "../../Matchers";
import {MatchPrefixResult, matchPrefixSuccess, SuccessfulMatch} from "../../MatchPrefixResult";
import { TerminalPatternMatch } from "../../PatternMatch";
import { Concat } from "../Concat";

import { inputStateFromString } from "../../internal/InputStateFactory";

import { JavaContentStateMachine } from "./JavaContentStateMachine";

/**
 * The rest of a Java block, going to a matching depth of +1 curlies or braces.
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
            return matchPrefixSuccess(new TerminalPatternMatch(this.$id, "", is.offset, is, context));
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
            return matchPrefixSuccess(new TerminalPatternMatch(
                this.$id,
                matched,
                is.offset,
                matched,
                context));
        }

        // We supply the offset to preserve it in this match
        return this.inner.matchPrefix(inputStateFromString(matched, is.offset), context);
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
