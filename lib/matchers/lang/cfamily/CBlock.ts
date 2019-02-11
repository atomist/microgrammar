import { InputState } from "../../../InputState";
import { inputStateFromString } from "../../../internal/InputStateFactory";
import { successfulMatchReport } from "../../../internal/matchReport/terminalMatchReport";
import { MatchingLogic } from "../../../Matchers";
import {
    MatchPrefixResult,
} from "../../../MatchPrefixResult";
import { MatchReport, toMatchPrefixResult } from "../../../MatchReport";
import { Concat } from "../../Concat";
import { LangStateMachine } from "../LangStateMachine";
import { CFamilyStateMachine } from "./CFamilyStateMachine";

/**
 * The rest of a C family block, going to a matching depth of +1 curlies or braces.
 * Does not read final curly
 */
export class CBlock implements MatchingLogic {

    public $id: "C.BlockBody";

    private readonly push: string;

    private readonly pop: string;

    constructor(private readonly stateMachineFactory: () => LangStateMachine,
                kind: "block" | "parens",
                private readonly inner?: MatchingLogic) {
        switch (kind) {
            case "block":
                [this.push, this.pop] = ["{", "}"];
                break;
            case "parens":
                [this.push, this.pop] = ["(", ")"];
                break;
        }
    }

    public matchPrefix(is: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        const sm = this.stateMachineFactory();
        let depth = 1;
        let currentIs = is;
        let matched = "";
        while (depth > 0) {
            const next = currentIs.peek(1);
            if (next.length === 0) {
                break;
            }
            sm.consume(next);
            if (sm.state.normal()) {
                switch (next) {
                    case this.push:
                        depth++;
                        break;
                    case this.pop:
                        depth--;
                        break;
                    default:
                }
            }
            if (depth > 0) {
                matched += next;
                currentIs = currentIs.advance();
            }
        }
        if (!this.inner) {
            return successfulMatchReport(this, {
                parseNodeName: "CBlock",
                matched,
                offset: is.offset,
            });
        }

        // We supply the offset to preserve it in this match
        return this.inner.matchPrefixReport(inputStateFromString(matched, undefined, is.offset), thisMatchContext, parseContext);
    }
}

/**
 * Match a block with balanced curlies
 * @type {Term}
 */
export function block(stateMachineFactory: () => LangStateMachine) {
    return Concat.of({
        $id: "{...}",
        _lp: "{",
        block: new CBlock(stateMachineFactory, "block"),
        _rp: "}",
    });
}

export function blockContaining(m: MatchingLogic,
                                stateMachineFactory: () => LangStateMachine = () => new CFamilyStateMachine()) {
    return Concat.of({
        $id: "{...}",
        _lp: "{",
        block: new CBlock(stateMachineFactory, "block", m),
        _rp: "}",
    });
}

/**
 * Match a parenthesized expression including ()
 * @type {Concat}
 */
export function parenthesizedExpression(stateMachineFactory: () => LangStateMachine = () => new CFamilyStateMachine()) {
    return Concat.of({
        $id: "(...)",
        _lp: "(",
        block: new CBlock(stateMachineFactory, "parens"),
        _rp: ")",
    });
}
