import {expect} from "chai";
import {inputStateFromString} from "../src/internal/InputStateFactory";
import {Term} from "../src/Matchers";
import {isSuccessfulMatch} from "../src/MatchPrefixResult";
import {Microgrammar} from "../src/Microgrammar";
import {Opt} from "../src/Ops";
import {PatternMatch} from "../src/PatternMatch";
import {Literal} from "../src/Primitives";

import * as assert from "power-assert";

describe("Opt", () => {

    it("should match when matcher doesn't match", () => {
        const alt = new Opt("A");
        const is = inputStateFromString("friday 14");
        const m = alt.matchPrefix(is) as PatternMatch;
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            expect(mmmm.$value).to.equal(undefined);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("should match when matcher matches", () => {
        const alt = new Opt("A");
        const is = inputStateFromString("AB");
        const m = alt.matchPrefix(is) as PatternMatch;
        if (isSuccessfulMatch(m)) {
            const mmmm = m.match as any;
            expect(mmmm.$value).to.equal("A");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("test raw opt missing", () => {
        const content = "";
        const mg = new Opt(new Literal("x"));
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as PatternMatch;
        // console.log(JSON.stringify(result));
        expect(result.$matched).to.equal("");
    });

    it("test raw opt present", () => {
        const content = "x";
        const mg = new Opt(new Literal("x"));
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as PatternMatch;
        // console.log(JSON.stringify(result));
        expect(result.$matched).to.equal("x");
    });

    it("not pull up single property", () => {
        const content = "x";
        const nested = Microgrammar.fromDefinitions({
                x: new Literal("x"),
                $id: "xx",
            } as Term,
        );
        const mg = Microgrammar.fromDefinitions({
                x: new Opt(nested),
                $id: "x",
            } as Term,
        );

        const result = mg.firstMatch(content) as any;
        expect(result.x.x).to.equal("x");
    });

    it("pull up single property", () => {
        const content = "x";
        const nested = Microgrammar.fromDefinitions({
                x: new Literal("x"),
                $id: "xx",
            } as Term,
        );
        const mg = Microgrammar.fromDefinitions({
                x: new Ogpt(nested, "x"),
                $id: "x",
            } as Term,
        );

        const result = mg.firstMatch(content) as any;
        expect(result.x).to.equal("x");
    });

});
