import * as assert from "power-assert";

import { isPatternMatch } from "../../../src/PatternMatch";

import { Span } from "../../../src/matchers/snobol/Span";

import { inputStateFromString } from "../../../src/internal/InputStateFactory";

describe("Span", () => {

    it("span no match when no single char", () => {
        const span = new Span("abcd");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is);
        assert(!isPatternMatch(m));
    });

    it("span match when first char matches", () => {
        const span = new Span("abcdef");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is);
        assert(isPatternMatch(m));
        assert(m.$offset === 0);
        assert((m as any).$matched === "f");
    });

    it("span match when some characters match", () => {
        const span = new Span("rabcdefi1");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is);
        assert(isPatternMatch(m));
        assert(m.$offset === 0);
        assert((m as any).$matched === "frida");
    });

});
