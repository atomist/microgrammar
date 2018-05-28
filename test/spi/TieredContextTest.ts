
import { Microgrammar } from "../../src/Microgrammar";

import { skipTo } from "../../src/matchers/skip/Skip";

import * as assert from "power-assert";

describe("Per file context", () => {

    it("should be available within concat object", () => {
        const mg = Microgrammar.fromDefinitions<{ name: string, zip: string }>({
            name: /[A-Z][a-z]+/,
            zip: skipTo(/[0-9]{5}/),
            // Suppress duplicate if we're already seen this zip
            _dedup: (ctx, _, parseContext) => {
                if (parseContext.zips.indexOf(ctx.zip) === -1) {
                    parseContext.zips.push(ctx.zip);
                    return true;
                }
                return false;
            },
        });

        const input = "Sandy:12345, Candice,94131   Terri:12345 Ahmed:64321";
        const glob = {
            zips: [],
        };
        const matches = mg.findMatches(input, glob);
        assert(matches.length === 3);
    });

    it("should take only even matches", () => {
        const mg = Microgrammar.fromDefinitions<{ name: string, zip: string }>({
            name: /[A-Z][a-z]+/,
            zip: skipTo(/[0-9]{5}/),
            _keep: (ctx, _, parseContext) => ++parseContext.count % 2 === 0,
        });

        const input = "Sandy:12345, Candice,94131   Terri:12345 Ahmed:64321";
        const glob = {
            count: 0,
        };
        const matches = mg.findMatches(input, glob);
        assert(matches.length === 2);
    });

});

describe("Per match context", () => {

    it("should be available within nested object and communicate back", () => {
        const mg = Microgrammar.fromDefinitions<{ name: string, zip: string }>({
            name: /[A-Z][a-z]+/,
            _addToMatchContext: (_, matchContext) => matchContext.something = "magic",
            address: {
                zip: skipTo(/[0-9]{5}/),
                _verify: (_, matchContext) => {
                    assert(matchContext.something === "magic");
                    assert(matchContext.andNowForSomethingCompleteDifferent === undefined, "This context must be fresh");
                    matchContext.andNowForSomethingCompleteDifferent = true;
                },
            },
            _verify: (_, matchContext) => {
                assert(matchContext.andNowForSomethingCompleteDifferent === true);
            },
        });

        const input = "Sandy:12345, Candice,94131   Terri:12345 Ahmed:64321";
        const matches = mg.findMatches(input);
        assert(matches.length === 4);
    });

});
