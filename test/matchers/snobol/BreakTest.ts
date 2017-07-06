import {Term} from "../../../src/Matchers";
import {Concat} from "../../../src/matchers/Concat";
import {PatternMatch} from "../../../src/PatternMatch";
import {Regex} from "../../../src/Primitives";

import {Break} from "../../../src/matchers/snobol/Break";

import {inputStateFromString} from "../../../src/internal/InputStateFactory";
import {Span} from "../../../src/matchers/snobol/Span";
import {Alt} from "../../../src/Ops";

import * as assert from "power-assert";
import {isSuccessfulMatch} from "../../../src/MatchPrefixResult";

describe("Break", () => {

    it("break matches exhausted", () => {
        const b = new Break("14");
        const is = inputStateFromString("");
        const m = b.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches another matcher", () => {
        const b = new Break(new Regex(/[a-z]/));
        const is = inputStateFromString("HEY YOU banana");
        const m = b.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "HEY YOU ");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches a complicated matcher", () => {
        const b = new Break(
            new Concat({$id: "yeah", _start: "${", name: new Regex(/[a-z]+/), _end: "}"} as Term,
                {consumeWhiteSpaceBetweenTokens: false}));
        const is = inputStateFromString("HEY YOU ${thing} and more stuff");
        const m = b.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "HEY YOU ");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches", () => {
        const b = new Break("14");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "friday ");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break to Alt", () => {
        const b = new Break(new Alt("14", "44"));
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        assert(isSuccessfulMatch(m));
        assert((m as PatternMatch).$matched === "friday ");

        const is2 = inputStateFromString("friday 44");
        const m2 = b.matchPrefix(is2, {});
        assert(isSuccessfulMatch(m2));
        assert((m2 as PatternMatch).$matched === "friday ");
    });

    it("break matches and consumes", () => {
        const b = new Break("14", true);
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {}) as any;
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert(mmmm.$matched === "friday 14");
            assert(mmmm.$value === "14");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches nothing as it comes immediately", () => {
        const b = new Break("friday");
        const is = inputStateFromString("friday 14");
        const m = b.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("break matches all in concat", () => {
        const b = new Break("14");
        const c = new Concat({
            prefix: b,
            number: new Span("41"),
        });
        const is = inputStateFromString("friday 14");
        const m = c.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            assert((mmmm).$matched === "friday 14");

        } else {
            assert.fail("Didn't match");
        }
    });

})
;
