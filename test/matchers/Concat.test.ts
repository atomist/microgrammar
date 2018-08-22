import { expect } from "chai";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { Concat } from "../../lib/matchers/Concat";
import { isSuccessfulMatch } from "../../lib/MatchPrefixResult";
import { PatternMatch } from "../../lib/PatternMatch";
import { Integer } from "../../lib/Primitives";
import { Rep1Sep, RepSep } from "../../lib/Rep";

import * as assert from "power-assert";
import { fail } from "power-assert";
import { Skipper } from "../../lib/Config";

describe("Concat", () => {

    it("reports initialized with normal use of Concat.of", () => {
        const mg = Concat.of({
            name: "foo",
        });
        assert(mg._initialized);
    });

    it("allows multiple init of lazy Concat", () => {
        const content = "foo ";
        const mg = Concat.of({
            name: "foo",
            $lazy: true,
        });
        assert(!mg._initialized);
        mg._init();
        assert(mg._initialized);
        mg._init();
        assert(mg._initialized);
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(result)) {
            expect((result.match as any).name).to.equal("foo");
            assert(result.$matched === "foo");
        } else {
            assert.fail("Did not match");
        }
    });

    it("single literal", () => {
        const content = "foo ";
        const mg = Concat.of({
            name: "foo",
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(result)) {
            expect((result.match as any).name).to.equal("foo");
            assert(result.$matched === "foo");
        } else {
            assert.fail("Did not match");
        }
    });

    it("single digit with regex", () => {
        const content = "2";
        const mg = Concat.of({
            $id: "Foo",
            num: /[1-9][0-9]*/,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmm = result.match as any;
            assert(mmm.$matched === content);
            assert(mmm.num === "2");
        }
    });

    it("integer with single digit", () => {
        const content = "2";
        const mg = Concat.of({
            num: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            // expect(mmmm.$matched).to.equal(content);
            // expect(mmmm.$matchers.length).to.equal(1);
            // console.log(JSON.stringify(mmmm.$matchers[0]))
            // expect(mmmm.$matchers[0].$value).to.equal(2);
            // expect(mmmm.$value).to.equal(2);
            expect(mmmm.num).to.equal(2);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("integer with multiple digits", () => {
        const content = "24";
        const mg = Concat.of({
            num: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            expect(mmmm.$matched).to.equal(content);
            expect(mmmm.num).to.equal(24);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("integers", () => {
        const content = "24x7";
        const mg = Concat.of({
            hours: Integer,
            _x: "x",
            days: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            expect(mmmm.$matched).to.equal(content);
            expect(mmmm.hours).to.equal(24);
            expect(mmmm.days).to.equal(7);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("respects nesting without name collisions", () => {
        const mg = Concat.of({
            name: /[A-Za-z]+/,
            _plus: "+",
            spouse: {
                name: /[A-Za-z]+/,
            },
        });
        const content = "Lizzy+Katrina";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.name === "Lizzy");
            assert(mmmm.spouse.name === "Katrina");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("respects nesting without name collisions using nested rep", () => {
        const mg = Concat.of({
            names: new Rep1Sep(/[A-Za-z]+/, ","),
            _plus: "+",
            spouse: {
                names: new Rep1Sep(/[A-Za-z]+/, ","),
            },
        });
        const content = "Lizzy+Katrina,Terri";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.names[0], "Lizzy");
            assert(mmmm.spouse.names[0] === "Katrina");
            assert(mmmm.spouse.names[1] === "Terri");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("respects nesting without name collisions using parallel reps within concats", () => {
        const nameList = {
            names: new Rep1Sep(/[A-Za-z]+/, ","),
        };
        const mg = Concat.of({
            gentlemen: nameList,
            _bp: "vs",
            players: nameList,
        });
        const content = "Jardine vs Bradman,Woodfull";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.gentlemen.names[0], "Jardine");
            assert(mmmm.players.names[0] === "Bradman");
            assert(mmmm.players.names[1] === "Woodfull");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("respects nesting without name collisions using parallel reps without concats", () => {
        const mg = Concat.of({
            gentlemen: new Rep1Sep(/[A-Za-z]+/, ","),
            _bp: "vs",
            players: new Rep1Sep(/[A-Za-z]+/, ","),
        });
        const content = "Jardine vs Bradman,Woodfull";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.gentlemen[0], "Jardine");
            assert(mmmm.players[0] === "Bradman");
            assert(mmmm.players[1] === "Woodfull");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("repsep of concat", () => {
        const nameList = {
            names: new Rep1Sep({
                name: /[A-Za-z]+/,
                lp: "(",
                plays: new Rep1Sep(/[a-z]+/, ","),
                rp: ")",
            }, ","),
        };
        const mg = Concat.of({
            gentlemen: nameList,
            _bp: "vs",
            players: nameList,
        });
        const content = "Jardine(bat),Wyatt(bat) vs Bradman(bat,bowl),Woodfull(bat,keep)";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.gentlemen.names[0].name, "Jardine");
            assert(mmmm.players.names[0].name === "Bradman");
            assert(mmmm.players.names[1].name === "Woodfull");
            assert(mmmm.players.names[1].plays[0] = "bat");
            // Don't pollute higher level namespace
            assert(mmmm.name === undefined);
            assert(mmmm.gentlemen.name === undefined, "Don't pollute parent namespace");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep array structure", () => {
        const content = "Donald: golf, tweeting";
        const mg = Concat.of({
            name: /[A-Z][a-z]+/,
            delim: ":",
            hobbies: new RepSep(/[a-z]+/, ","),
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {}) as PatternMatch;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            const r = mmmm;
            expect(r.name).to.equal("Donald");
            expect(r.delim).to.equal(":");
            expect(r.hobbies).to.have.members(["golf", "tweeting"]);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("does not allow undefined matcher field steps", () => {
        const literal: string = undefined;
        assert.throws(() => Concat.of({
            opening: literal,
            thing: "thing",
        }), e => {
            assert(e.message.indexOf("Step [opening] is undefined") !== -1);
            return true;
        });
    });

    it("does not allow null matcher field steps", () => {
        const literal: string = null;
        assert.throws(() => Concat.of({
            opening: literal,
            thing: "thing",
        }), e => {
            assert(e.message.indexOf("Step [opening] is null") !== -1);
            return true;
        });
    });

    it("does not skip", () => {
        const content = "tom:49";
        const mg = Concat.of({
            name: /[a-z]+/,
            age: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(result));
    });

    it("skips: simple", () => {
        const content = "tom:49";
        const mg = Concat.of({
            ...Skipper,
            name: /[a-z]+/,
            age: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {});
        assert(isSuccessfulMatch(result));
    });

    it("skips: more complex", () => {
        const content = "Katrina and this is a whole bunch of junk the Waves were a band in the 80s in England and this is junk";
        const mg = Concat.of({
            ...Skipper,
            lead: /[A-Z][a-z]+/,
            band: /[A-Z][a-z]+/,
            decade: Integer,
            country: /[A-Z][a-z]+/,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is, {}, {});
        if (isSuccessfulMatch(result)) {
            const r = result.match as any;
            assert(r.lead === "Katrina");
            assert(r.band === "Waves");
            assert(r.decade === 80);
            assert(r.country === "England");
        } else {
            fail("Match expected");
        }
    });

});
