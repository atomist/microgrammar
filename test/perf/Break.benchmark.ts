import * as assert from "power-assert";
import {
    skipTo,
    takeUntil,
} from "../../lib/matchers/skip/Skip";
import { Microgrammar } from "../../lib/Microgrammar";
import {
    comment,
    invalidMethod,
    Java1,
    randomMethod,
    validMethod,
} from "./common";

describe("Break Benchmark", () => {

    const parseCount = 100;

    const validTargetMethods = 100;

    const randomMethods = 100;

    const invalidMethods = 100;

    const comments = 100;

    it("parses break to }", () => parseGrammar({
        _public: "public",
        toFirstRightCurlie: takeUntil("}"),
    })).timeout(55000);

    it("parses break to //", () => parseGrammar({
        _public: "public",
        toFirstRightCurlie: takeUntil("//"),
    })).timeout(55000);

    it("parses break for most of big file", () => parseGrammar({
        _public: "class",
        toFirstRightCurlie: takeUntil("/*eof*/"),
    })).timeout(55000);

    it("parses skipTo for most of big file", () => parseGrammar({
        _public: "class",
        toFirstRightCurlie: skipTo("/*eof*/"),
    })).timeout(55000);

    function parseGrammar(a: {}, commentCount = comments) {
        const g = Microgrammar.fromDefinitions<any>(a);
        let additional = "";
        for (let m = 0; m < validTargetMethods; m++) {
            additional += validMethod(m);
        }
        for (let m = 0; m < invalidMethods; m++) {
            additional += invalidMethod(m);
        }
        for (let m = 0; m < randomMethods; m++) {
            additional += randomMethod(m);
        }
        for (let m = 0; m < commentCount; m++) {
            additional += comment();
        }
        const src = Java1.replace("//placeholder", additional);

        // console.log(`Src length=${src.split("\n").length} lines`);
        // src = canonicalize(src);
        for (let i = 0; i < parseCount; i++) {
            const matches = g.findMatches(src);
            assert(matches.length > 0);
        }
    }

});
