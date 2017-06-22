import { expect } from "chai";
import { InputState } from "../../src/InputState";
import { isPatternMatch } from "../../src/PatternMatch";
import { Span } from "../../src/snobol/Snobol";

describe("SpanTest", () => {

    it("span no match when no single char", () => {
        const span = new Span("abcd");
        const is = InputState.fromString("friday 14");
        const m = span.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(false);
    });

    it("span match when first char matches", () => {
        const span = new Span("abcdef");
        const is = InputState.fromString("friday 14");
        const m = span.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        expect(m.$offset).to.equal(0);
        expect((m as any).$matched).to.equal("f");
    });

    it("span match when some characters match", () => {
        const span = new Span("rabcdefi1");
        const is = InputState.fromString("friday 14");
        const m = span.matchPrefix(is);
        expect(isPatternMatch(m)).to.equal(true);
        expect(m.$offset).to.equal(0);
        expect((m as any).$matched).to.equal("frida");
    });

});
