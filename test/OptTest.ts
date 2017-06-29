import { expect } from "chai";
import { InputState } from "../src/InputState";
import { Term } from "../src/Matchers";
import { Microgrammar } from "../src/Microgrammar";
import { Opt } from "../src/Ops";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Literal } from "../src/Primitives";

describe("OptTest", () => {

    it("should match when matcher doesn't match", () => {
        const alt = new Opt("A");
        const is = InputState.fromString("friday 14");
        const m = alt.matchPrefix(is, {}) as PatternMatch;
        expect(isPatternMatch(m)).to.equal(true);
        expect(m.$value).to.equal(undefined);
    });

    it("should match when matcher matches", () => {
        const alt = new Opt("A");
        const is = InputState.fromString("AB");
        const m = alt.matchPrefix(is, {}) as PatternMatch;
        expect(isPatternMatch(m)).to.equal(true);
        expect(m.$value).to.equal("A");
    });

    it("test raw opt missing", () => {
        const content = "";
        const mg = new Opt(new Literal("x"));
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as PatternMatch;
        // console.log(JSON.stringify(result));
        expect(result.$matched).to.equal("");
    });

    it("test raw opt present", () => {
        const content = "x";
        const mg = new Opt(new Literal("x"));
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as PatternMatch;
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
            x: new Opt(nested, "x"),
            $id: "x",
        } as Term,
        );

        const result = mg.firstMatch(content) as any;
        expect(result.x).to.equal("x");
    });

});
