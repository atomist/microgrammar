import { expect } from "chai";
import { Concat } from "../src/Concat";
import { InputState } from "../src/InputState";
import { AnonymousDefinition, Term } from "../src/Matchers";
import { PatternMatch } from "../src/PatternMatch";
import { Regex } from "../src/Primitives";
import { Break, Span } from "../src/snobol/Snobol";

describe("BreakTest", () => {

    it("break matches exhausted", () => {
        const b = new Break("14");
        const is = InputState.fromString("");
        const m = b.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("");
    });

    it("break matches another matcher", () => {
        const b = new Break(new Regex(/^[a-z]/));
        const is = InputState.fromString("HEY YOU banana");
        const m = b.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("HEY YOU ");
    });

    it("break matches a complicated matcher", () => {
        const b = new Break(
            new Concat({ $id: "yeah", _start: "${", name: new Regex(/^[a-z]+/), _end: "}" } as Term,
                { consumeWhiteSpaceBetweenTokens: false }));
        const is = InputState.fromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("HEY YOU ");
    });

    it("break matches", () => {
        const b = new Break("14");
        const is = InputState.fromString("friday 14");
        const m = b.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("friday ");
    });

    it("break matches nothing as it comes immediately", () => {
        const b = new Break("friday");
        const is = InputState.fromString("friday 14");
        const m = b.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("");
    });

    it("break matches all in concat", () => {
        const b = new Break("14");
        const c = new Concat({
            prefix: b,
            number: new Span("41"),
            ...AnonymousDefinition,
        });
        const is = InputState.fromString("friday 14");
        const m = c.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("friday 14");
    });

});
