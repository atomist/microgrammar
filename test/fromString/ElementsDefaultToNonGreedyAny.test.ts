import assert = require("power-assert");
import { Microgrammar } from "../../lib/Microgrammar";
import { isPatternMatch } from "../../lib/PatternMatch";

describe("Elements default to non-greedy any", () => {

    it("does not require every named element to be defined", () => {
        const content = "->banana<- ";
        const mg = Microgrammar.fromString("->${fruit}<-");
        const result: any = mg.exactMatch(content);
        if (isPatternMatch(result)) {
            const mmmm = result as any;
            assert(mmmm.fruit === "banana");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("multiple undefined elements are fine if they're separated by a literal", () => {
        const content = "preamble content ->banana<-juice! and more...";
        const mg = Microgrammar.fromString<{ fruit: string, drink: string }>("->${fruit}<-${drink}!");
        const result: any = mg.firstMatch(content);
        if (isPatternMatch(result)) {
            const mmmm = result as any;
            assert(mmmm.fruit === "banana");
            assert(mmmm.drink === "juice");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("multiple undefined elements are fine if they're separated by a defined element", () => {
        const content = "preamble content->banana<-juice! and more...";
        const mg = Microgrammar.fromString("->${fruit}${arrow}${drink}!",
            {arrow: "<-"});
        const result: any = mg.firstMatch(content);
        assert(result.drink === "juice");
        assert(result.fruit === "banana");
    });

    it("doesn't mind whitespace", () => {
        const content = "->   banana   <- ";
        const mg = Microgrammar.fromString("-> ${fruit} <-");
        const result: any = mg.exactMatch(content);
        if (isPatternMatch(result)) {
            const mmmm = result as any;
            assert(mmmm.fruit.trim() === "banana");
        } else {
            assert.fail("Didn't match");
        }
    });

    it.skip("trims whitespace from the captured text", () => {
        const content = "->   banana   <- ";
        const mg = Microgrammar.fromString("-> ${fruit} <-");
        const result: any = mg.exactMatch(content);
        if (isPatternMatch(result)) {
            const mmmm = result as any;
            assert(mmmm.fruit === "banana");
        } else {
            assert.fail("Didn't match");
        }
    });

});
