import * as assert from "power-assert";

import { Span } from "../../../lib/matchers/snobol/Span";

import { inputStateFromString } from "../../../lib/internal/InputStateFactory";
import {isSuccessfulMatch} from "../../../lib/MatchPrefixResult";

describe("Span", () => {

    it("span no match when no single char", () => {
        const span = new Span("abcd");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("span match when first char matches", () => {
        const span = new Span("abcdef");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
                       const mmmm = m.match as any;
                       assert(mmmm.$offset === 0);
                       assert((m as any).$matched === "f");

                    } else {
                       assert.fail("Didn't match");
                    }
                   });

    it("span match when some characters match", () => {
        const span = new Span("rabcdefi1");
        const is = inputStateFromString("friday 14");
        const m = span.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(m)) {
                       const mmmm = m.match as any;
                       assert(mmmm.$offset === 0);
                       assert((m as any).$matched === "frida");

                    } else {
                       assert.fail("Didn't match");
                    }
                   });

});
