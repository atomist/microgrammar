import {expect} from "chai";
import {inputStateFromString} from "../src/internal/InputStateFactory";
import {isSuccessfulMatch} from "../src/MatchPrefixResult";
import {PatternMatch} from "../src/PatternMatch";
import {Float} from "../src/Primitives";

import * as assert from "power-assert";

describe("Float", () => {

    it("test one digit", () => {
        const is = inputStateFromString("1");
        const m = Float.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            expect(match.$matched).to.equal("1");
            expect(match.$value).to.equal(1.0);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("test multiple digits", () => {
        const is = inputStateFromString("105x");
        const m = Float.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            expect(match.$matched).to.equal("105");
            expect(match.$value).to.equal(105.0);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("test with decimal", () => {
        const is = inputStateFromString("105.25555xxx");
        const m = Float.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            expect(match.$matched).to.equal("105.25555");
            expect(match.$value).to.equal(105.25555);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("test signed", () => {
        const is = inputStateFromString("-105.25555xxx");
        const m = Float.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            expect(match.$matched).to.equal("-105.25555");
            expect(match.$value).to.equal(-105.25555);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("test no leading digit", () => {
        const is = inputStateFromString("-.25555xxx");
        const m = Float.matchPrefix(is, {});
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            const match = mmmm as PatternMatch;
            expect(match.$matched).to.equal("-.25555");
            expect(match.$value).to.equal(-0.25555);

        } else {
            assert.fail("Didn't match");
        }
    });
});
