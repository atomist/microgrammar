import { Term } from "../../../src/Matchers";
import { Concat } from "../../../src/matchers/Concat";
import { isPatternMatch, PatternMatch } from "../../../src/PatternMatch";
import { Integer, Regex } from "../../../src/Primitives";

import { Break } from "../../../src/matchers/snobol/Break";

import { inputStateFromString } from "../../../src/internal/InputStateFactory";
import { Span } from "../../../src/matchers/snobol/Span";
import { Alt } from "../../../src/Ops";

import * as assert from "power-assert";

describe("Break", () => {

    it("break matches exhausted", () => {
        const b = new Break("14");
        const is = inputStateFromString("");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "");
    });

    it("break matches another matcher", () => {
        const b = new Break(new Regex(/[a-z]/));
        const is = inputStateFromString("HEY YOU banana");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "HEY YOU ");
    });

    it("break matches a complicated matcher", () => {
        const b = new Break(
            new Concat({ $id: "yeah", _start: "${", name: new Regex(/[a-z]+/), _end: "}" } as Term,
                { consumeWhiteSpaceBetweenTokens: false }));
        const is = inputStateFromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "HEY YOU ");
    });

    it("break matches", () => {
        const b = new Break("14");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "friday ");
    });

    it("break to Alt", () => {
        const b = new Break(new Alt("14", "44"));
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "friday ");

        const is2 = inputStateFromString("friday 44");
        const m2 = b.matchPrefix(is2, {});
        assert(isPatternMatch(m2));
        assert((m2 as PatternMatch).$matched === "friday ");
    });

    it("break matches and consumes", () => {
        const b = new Break("14", true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {}) as any;
        assert(isPatternMatch(m));
        assert(m.$matched === "friday 14");
        assert(m.$value === "14");
    });

    it("break and consume uses value", () => {
        const b = new Break(Integer, true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {}) as any;
        assert(isPatternMatch(m));
        assert(m.$matched === "friday 14");
        assert(m.$value === 14);
    });

    it("break matches nothing as it comes immediately", () => {
        const b = new Break("friday");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "");
    });

    it("break matches all in concat", () => {
        const b = new Break("14");
        const c = new Concat({
            prefix: b,
            number: new Span("41"),
        });
        const is = inputStateFromString("friday 14");
        const m = c.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "friday 14");
    });

});
