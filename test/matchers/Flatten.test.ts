import * as assert from "power-assert";
import { Microgrammar } from "../../lib/Microgrammar";
import { optional } from "../../lib/Ops";

import { flatten } from "../../lib/matchers/Functions";

describe("flatten", () => {

    it("pull up matching scalar optional", () => {
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional("A")),
        });
        const m = g.firstMatch("AB") as any;
        assert(m);
        assert(m.a === "A");
    });

    it("pull up missing scala optional", () => {
        const content = "not the droids you are looking for";
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional("A")),
            _not: "not",
        });
        const m = g.firstMatch(content) as any;
        assert(m);
        assert(m.a === undefined);
    });

    it("pull up matching object optional", () => {
        const struct = {
            name: /[a-z]+/,
            _c: "*",
        };
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional(struct)),
        });
        const m = g.firstMatch("possum*") as any;
        assert(m);
        assert(m.a === "possum");
    });

    it("pull up missing object optional", () => {
        const struct = {
            name: /[a-z]+/,
            _c: "*",
        };
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional(struct)),
            letter: "T",
        });
        const m = g.firstMatch("This 666") as any;
        assert(m);
        assert(m.a === undefined);
    });

    it("rejects attempt to flatten complex structure", () => {
        const invalidStruct = {
            name: /[a-z]+/,
            c: "T",
        };
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional(invalidStruct)),
            letter: "T",
        });
        assert.throws(() => g.firstMatch("dog T and other stuff"),
            e => {
                assert(e.message.indexOf("Cannot flatten a structure") !== -1);
                assert(e.message.indexOf("name,c") !== -1);
                return true;
            });
    });

    it("consume correctly from object optional", () => {
        const struct = {
            _bang: "!",
            name: /[a-z]+/,
            _c: "*",
        };
        const g = Microgrammar.fromDefinitions({
            a: flatten(optional(struct)),
        });
        const m = g.findMatches("!possum* !dinosaur*") as any;
        assert.strictEqual(m[0].a, "possum");
        assert.strictEqual(m.length, 2);
        assert.strictEqual(m[0].a, "possum");
        assert.strictEqual(m[1].a, "dinosaur");
    });

});
