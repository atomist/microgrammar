import "mocha";

import * as assert from "power-assert";
import { InputState, InputStateListener } from "../src/InputState";
import { MatchingLogic } from "../src/Matchers";
import { JavaBlock } from "../src/matchers/java/JavaBody";
import { JavaContentStateMachine } from "../src/matchers/java/JavaContentStateMachine";
import { canonicalize } from "../src/matchers/java/JavaUtils";
import { NestingDepthStateMachine } from "../src/matchers/java/NestingDepthStateMachine";
import { MatchFailureReport, MatchPrefixResult, matchPrefixSuccess } from "../src/MatchPrefixResult";
import { Microgrammar } from "../src/Microgrammar";
import { when } from "../src/Ops";
import { TerminalPatternMatch } from "../src/PatternMatch";

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

            public matchPrefix(is: InputState, mc, parseContext): MatchPrefixResult {
                const l = is.listeners.l as Listener;
                if (is.peek(1) === "{" && l.seen.match(/\$$/)) {
                    return matchPrefixSuccess(new TerminalPatternMatch("mc", "{", is.offset, "{"));
                }
                return new MatchFailureReport("id", is.offset, {}, "wrong");
            }
        }
        const m = Microgrammar.fromDefinitions({
            curly: new MatchCurlyButNotAfter$(),
        });
        const input = "this is a { without $ and this is one after ${ and this is ${ and { too";

        const matches = m.findMatches(input, {}, { l: new Listener()});
        assert(matches.length === 2);
    });

    it("uses state machine", () => {
        class AtNotInString implements MatchingLogic {

            public matchPrefix(is: InputState, mc, parseContext): MatchPrefixResult {
                const l = is.listeners.l as JavaContentStateMachine;
                if (is.peek(1) === "@" && l.state !== "String") {
                    return matchPrefixSuccess(new TerminalPatternMatch("mc", "@", is.offset, "@"));
                }
                return new MatchFailureReport("id", is.offset, {}, "wrong");
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
        const l = new JavaContentStateMachine();
        const matches = m.findMatches(input, {}, { l });
        assert(matches.length === 2);
    });

    it("tracks nesting depth 4 statement", () => {
        const m = Microgrammar.fromDefinitions<any>({
            toFlag: when(JavaBlock, _ => true, is => (is.listeners.depthCount as NestingDepthStateMachine).depth >= 4),
        });
        const matches = m.findMatches(DeeplyNested, {}, {depthCount: new NestingDepthStateMachine() });
        assert(matches.length === 1);
        assert(matches[0].toFlag.block, JSON.stringify(matches[0]));
        assert(canonicalize(matches[0].toFlag.block) === 'println("too deeply nested");');
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
