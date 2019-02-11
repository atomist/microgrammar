
import * as assert from "power-assert";
import {
    InputState,
    InputStateListener,
} from "../lib/InputState";
import { failedMatchReport } from "../lib/internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "../lib/internal/matchReport/terminalMatchReport";
import { MatchingLogic } from "../lib/Matchers";
import { CFamilyLangHelper } from "../lib/matchers/lang/cfamily/CFamilyLangHelper";
import { CFamilyStateMachine } from "../lib/matchers/lang/cfamily/CFamilyStateMachine";
import { JavaBlock } from "../lib/matchers/lang/cfamily/java/JavaBody";
import { NestingDepthStateMachine } from "../lib/matchers/lang/cfamily/NestingDepthStateMachine";
import { DoubleString } from "../lib/matchers/lang/cfamily/States";
import {
    MatchPrefixResult,
} from "../lib/MatchPrefixResult";
import { MatchReport, toMatchPrefixResult } from "../lib/MatchReport";
import { Microgrammar } from "../lib/Microgrammar";
import { when } from "../lib/Ops";

describe("InputStateListener", () => {

    it("should allow lookback at previous character", () => {
        class Listener implements InputStateListener {

            constructor(public seen: string = "") {
            }

            public read(s: string): this {
                this.seen += s;
                return this;
            }

            public clone(): InputStateListener {
                return new Listener(this.seen);
            }

        }

        class MatchCurlyButNotAfter$ implements MatchingLogic {

            public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
                MatchPrefixResult {
                return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
            }

            public matchPrefixReport(is: InputState, mc, parseContext): MatchReport {
                const l = is.listeners.l as Listener;
                if (is.peek(1) === "{" && l.seen.match(/\$$/)) {
                    return successfulMatchReport(this, { parseNodeName: "MatchCurly", matched: "{", offset: is.offset });
                }
                return failedMatchReport(this, {
                    parseNodeName: "MatchCurly",
                    offset: is.offset,
                    matched: "",
                    reason: "No curly",
                });
            }
        }
        const m = Microgrammar.fromDefinitions({
            curly: new MatchCurlyButNotAfter$(),
        });
        const input = "this is a { without $ and this is one after ${ and this is ${ and { too";

        const matches = m.findMatches(input, {}, { l: new Listener() });
        assert.strictEqual(matches.length, 2);
    });

    it("uses state machine", () => {
        class AtNotInString implements MatchingLogic {

            public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
                MatchPrefixResult {
                return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
            }

            public matchPrefixReport(is: InputState, mc, parseContext): MatchReport {
                const mpl = is.listeners.l as CFamilyStateMachine;
                if (is.peek(1) === "@" && mpl.state !== DoubleString) {
                    return successfulMatchReport(this, { matched: "@", offset: is.offset });
                }
                return failedMatchReport(this, { offset: is.offset, reason: "wrong" });
            }
        }

        const m = Microgrammar.fromDefinitions({
            at: new AtNotInString(),
        });
        const input = `
@Something
public class Foo {

    @Annotation
    private String foo() {
        return "This has 2 @ symbols but we don't care @about them";
    }
}
        `;
        const l = new CFamilyStateMachine();
        const matches = m.findMatches(input, {}, { l });
        assert.strictEqual(matches.length, 2);
    });

    it("tracks nesting depth 4 statement", () => {
        const m = Microgrammar.fromDefinitions<any>({
            toFlag: when(JavaBlock, _ => true,
                is => {
                    return (is.listeners.depthCount as NestingDepthStateMachine).depth >= 4;
                }),
            // toFlag: JavaBlock,
        });
        const matches = m.findMatches(DeeplyNested, {}, { depthCount: new NestingDepthStateMachine() });
        assert.strictEqual(matches.length, 1);
        assert(matches[0].toFlag.block, "Expected a block but got: " + JSON.stringify(matches[0]));
        const canonicalized = new CFamilyLangHelper().canonicalize(matches[0].toFlag.block);
        assert.strictEqual(canonicalized,
            "println(\"too deeply nested\");");
    });

});

const DeeplyNested = `
public class Foo {

    private String foo() {
        return "This has 2 @ symbols but we don't care @about them";
        if (1==1) {
            if (2==2) {
                if (3==3) {
                  println("too deeply nested");
                }
            }
        }
    }
}
`;
