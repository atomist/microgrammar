import assert = require("power-assert");
import {Microgrammar} from "../../src/Microgrammar";
import {isPatternMatch} from "../../src/PatternMatch";

describe("Elements default to non-greedy any", () => {

    it("does not require every named element to be defined", () => {
        const content = "->banana<- ";
        const mg = Microgrammar.fromString("->${fruit}<-");
        const result: any = mg.exactMatch(content);
        assert(isPatternMatch(result));
        assert(result.fruit === "banana");
    });

    it("multiple undefined elements are fine if they're separated by a literal", () => {
        const content = "preamble content ->banana<-juice! and more...";
        const mg = Microgrammar.fromString<{ fruit: string, drink: string }>("->${fruit}<-${drink}!");
        const result: any = mg.firstMatch(content);
        assert(isPatternMatch(result));
        assert(result.fruit === "banana");
        assert(result.drink === "juice");
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
        assert(isPatternMatch(result));
        assert(result.fruit.trim() === "banana");
    });

    it.skip("trims whitespace from the captured text",
        () => {
        const content = "->   banana   <- ";
        const mg = Microgrammar.fromString("-> ${fruit} <-");
        const result: any = mg.exactMatch(content);
        assert(isPatternMatch(result));
        assert(result.fruit === "banana");
    });

});

function justTheData(match: object): any {
    if (Array.isArray(match)) {
        return match.map(m => justTheData(m));
    }

    if (typeof match !== "object") {
        return match;
    }
    const output = {}; // it is not a const, I mutate it, but tslint won't let me declare otherwise :-(
    for (const p in match) {
        if (!(p.indexOf("_") === 0 || p.indexOf("$") === 0)) {
            output[p] = justTheData(match[p]);
        }
    }
    return output;
}