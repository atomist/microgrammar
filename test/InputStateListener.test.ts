
import * as assert from "power-assert";
import {
    InputState,
    InputStateListener,
} from "../lib/InputState";
import { MatchingLogic } from "../lib/Matchers";
import { CFamilyLangHelper } from "../lib/matchers/lang/cfamily/CFamilyLangHelper";
import { CFamilyStateMachine } from "../lib/matchers/lang/cfamily/CFamilyStateMachine";
import { JavaBlock } from "../lib/matchers/lang/cfamily/java/JavaBody";
import { NestingDepthStateMachine } from "../lib/matchers/lang/cfamily/NestingDepthStateMachine";
import { DoubleString } from "../lib/matchers/lang/cfamily/States";
import {
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "../lib/MatchPrefixResult";
import { MatchReport, matchReportFromFailureReport, matchReportFromSuccessfulMatch, toMatchPrefixResult } from "../lib/MatchReport";
import { Microgrammar } from "../lib/Microgrammar";
import { when } from "../lib/Ops";
import { TerminalPatternMatch } from "../lib/PatternMatch";

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
                    return matchReportFromSuccessfulMatch(this, matchPrefixSuccess(new TerminalPatternMatch("mc", "{", is.offset, "{")));
                }
                return matchReportFromFailureReport(this, new MatchFailureReport("id", is.offset, "", "wrong"));
            }
        }
        const m = Microgrammar.fromDefinitions({
            curly: new MatchCurlyButNotAfter$(),
        });
        const input = "this is a { without $ and this is one after ${ and this is ${ and { too";

        const matches = m.findMatches(input, {}, { l: new Listener() });
        assert(matches.length === 2);
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
                    return matchReportFromSuccessfulMatch(this,
                        matchPrefixSuccess(new TerminalPatternMatch("mc", "@", is.offset, "@")));
                }
                return matchReportFromFailureReport(this, new MatchFailureReport("id", is.offset, "", "wrong"));
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
        assert(matches.length === 2);
    });

    it("tracks nesting depth 4 statement", () => {
        const m = Microgrammar.fromDefinitions<any>({
            toFlag: when(JavaBlock, _ => true, is => (is.listeners.depthCount as NestingDepthStateMachine).depth >= 4),
        });
        const matches = m.findMatches(DeeplyNested, {}, { depthCount: new NestingDepthStateMachine() });
        assert(matches.length === 1);
        assert(matches[0].toFlag.block, JSON.stringify(matches[0]));
        assert(new CFamilyLangHelper().canonicalize(matches[0].toFlag.block) === "println(\"too deeply nested\");");
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
