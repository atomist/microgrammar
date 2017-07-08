import { Microgrammar } from "../../../src/Microgrammar";
import { Alt } from "../../../src/Ops";

import * as assert from "power-assert";
import { inputStateFromString } from "../../../src/internal/InputStateFactory";
import { RestOfLine, yadaYadaThen, yadaYadaThenThisButNotThat } from "../../../src/matchers/skip/Skip";
import { isSuccessfulMatch } from "../../../src/MatchPrefixResult";

describe("Skip", () => {

    const desirable = Microgrammar.fromDefinitions({
        beast: new Alt("dog", "cat", "pig"),
        activity: yadaYadaThenThisButNotThat("spa", "shoplifting"),
        last: yadaYadaThen("happiness"),
    });

    it("yada yada is acceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell spa and then happiness , perhaps") as any;
        assert(m);
        assert(m.beast === "pig");
        assert(m.activity === "spa");
        assert(m.last === "happiness");
    });

    it("yada yada is unacceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell shoplifting spa and then happiness , perhaps") as any;
        assert(!m);
    });

    it("rest of line to end of line", () => {
        const input = "The quick brown\nfox jumps over\nthe lazy dog";
        const pm = RestOfLine.matchPrefix(inputStateFromString(input));
        assert(isSuccessfulMatch(pm) && pm.$matched === "The quick brown");
    });

    it("rest of line consumes remaining input", () => {
        const input = "The quick brown fox jumps over the lazy dog";
        const pm = RestOfLine.matchPrefix(inputStateFromString(input));
        assert(isSuccessfulMatch(pm) && pm.$matched === input);
    });

});
