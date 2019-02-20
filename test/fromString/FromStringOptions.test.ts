import { Microgrammar } from "../../lib/Microgrammar";

import * as assert from "power-assert";
import { Integer } from "../../lib/Primitives";

describe("FromStringOptions", () => {

    it("skip over one string of discardable content", () => {
        const content = "foo (and some junk) 63";
        const mg = Microgrammar.fromString<{ num: number}>("foo...${num}", {
            num: Integer,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].$matched , content);
        assert.strictEqual(result[0].num , 63);
    });

    it("skip over two strings of discardable content", () => {
        const content = "foo (and some junk) 63 and then XXX";
        const mg = Microgrammar.fromString<{ num: number}>("foo...${num}...XXX", {
            num: Integer,
        });
        const result = mg.findMatches(content);
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].$matched , content);
        assert.strictEqual(result[0].num , 63);
    });

    it("allows custom ellipsis", () => {
        const content = "foo (and some junk) 63";
        const mg = Microgrammar.fromString<{ num: number}>("foo⤞${num}", {
            num: Integer,
        }, { ellipsis: "⤞"});
        const result = mg.findMatches(content);
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].$matched , content);
        assert.strictEqual(result[0].num , 63);
    });

    it("allows custom component prefix", () => {
        const content = "foo (and some junk) 63 and then XXX";
        const mg = Microgrammar.fromString<{ num: number}>("foo...#{num}...XXX", {
            num: Integer,
        }, { componentPrefix: "#" });
        const result = mg.findMatches(content);
        assert.strictEqual(result.length , 1);
        assert.strictEqual(result[0].$matched , content);
        assert.strictEqual(result[0].num , 63);
    });

});
