import { expect } from "chai";
import { Concat } from "../../src/Concat";
import { Term } from "../../src/Matchers";
import { isPatternMatch, PatternMatch } from "../../src/PatternMatch";
import { Regex } from "../../src/Primitives";
import { Break, Span } from "../../src/snobol/Snobol";

import { inputStateFromString } from "../../src/internal/InputStateFactory";

describe("Break", () => {

    it("break matches exhausted", () => {
        const b = new Break("14");
        const is = inputStateFromString("");
        const m = b.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("");
    });

    it("break matches another matcher", () => {
        const b = new Break(new Regex(/^[a-z]/));
        const is = inputStateFromString("HEY YOU banana");
        const m = b.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("HEY YOU ");
    });

    it("break matches a complicated matcher", () => {
        const b = new Break(
            new Concat({ $id: "yeah", _start: "${", name: new Regex(/^[a-z]+/), _end: "}" } as Term,
                { consumeWhiteSpaceBetweenTokens: false }));
        const is = inputStateFromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("HEY YOU ");
    });

    it("break matches", () => {
        const b = new Break("14");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("friday ");
    });

    it("break matches and consumes", () => {
        const b = new Break("14", true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {}) as any;
        expect(isPatternMatch(m)).to.equal(true);
        expect(m.$matched).to.equal("friday 14");
        expect(m.$value).to.equal("14");
    });

    it("break matches nothing as it comes immediately", () => {
        const b = new Break("friday");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("");
    });

    it("break matches all in concat", () => {
        const b = new Break("14");
        const c = new Concat({
            prefix: b,
            number: new Span("41"),
        });
        const is = inputStateFromString("friday 14");
        const m = c.matchPrefix(is, {});
        expect(isPatternMatch(m)).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("friday 14");
    });

});
