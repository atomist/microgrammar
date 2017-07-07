import {expect} from "chai";
import {inputStateFromString} from "../../src/internal/InputStateFactory";
import {Concat} from "../../src/matchers/Concat";
import {isSuccessfulMatch} from "../../src/MatchPrefixResult";
import {PatternMatch} from "../../src/PatternMatch";
import {Integer} from "../../src/Primitives";
import {Rep1Sep, RepSep} from "../../src/Rep";

import * as assert from "power-assert";

describe("Concat", () => {

    it("single literal", () => {
        const content = "foo ";
        const mg = new Concat({
            name: "foo",
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is);
        if (isSuccessfulMatch(result)) {
            expect((result.match as any).name).to.equal("foo");
            assert(result.$matched === "foo");
        } else {
            assert.fail("Did not match");
        }
    });

    it("single digit with regex", () => {
        const content = "2";
        const mg = new Concat({
            $id: "Foo",
            num: /[1-9][0-9]*/,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
        if (isSuccessfulMatch(result)) {
            const mmm = result.match as any;
            assert(mmm.$matched === content);
            assert(mmm.num === "2");
        }
    });

    it("integer with single digit", () => {
        const content = "2";
        const mg = new Concat({
            num: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            num: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            hours: Integer,
            _x: "x",
            days: Integer,
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            name: /[A-Za-z]+/,
            _plus: "+",
            spouse: {
                name: /[A-Za-z]+/,
            },
        });
        const content = "Lizzy+Katrina";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            assert(mmmm.name === "Lizzy");
            assert(mmmm.spouse.name === "Katrina");

        } else {
            assert.fail("Didn't match");
        }
    });

    it("respects nesting without name collisions using nested rep", () => {
        const mg = new Concat({
            names: new Rep1Sep(/[A-Za-z]+/, ","),
            _plus: "+",
            spouse: {
                names: new Rep1Sep(/[A-Za-z]+/, ","),
            },
        });
        const content = "Lizzy+Katrina,Terri";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            gentlemen: nameList,
            _bp: "vs",
            players: nameList,
        });
        const content = "Jardine vs Bradman,Woodfull";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            gentlemen: new Rep1Sep(/[A-Za-z]+/, ","),
            _bp: "vs",
            players: new Rep1Sep(/[A-Za-z]+/, ","),
        });
        const content = "Jardine vs Bradman,Woodfull";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            gentlemen: nameList,
            _bp: "vs",
            players: nameList,
        });
        const content = "Jardine(bat),Wyatt(bat) vs Bradman(bat,bowl),Woodfull(bat,keep)";
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as any;
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
        const mg = new Concat({
            name: /[A-Z][a-z]+/,
            delim: ":",
            hobbies: new RepSep(/[a-z]+/, ","),
        });
        const is = inputStateFromString(content);
        const result = mg.matchPrefix(is) as PatternMatch;
        if (isSuccessfulMatch(result)) {
            const mmmm = result.match as any;
            const r = mmmm as any;
            expect(r.name).to.equal("Donald");
            expect(r.delim).to.equal(":");
            expect(r.hobbies).to.have.members(["golf", "tweeting"]);

        } else {
            assert.fail("Didn't match");
        }
    });

    it("does not allow undefined matcher field steps", () => {
        const literal: string = undefined;
        assert.throws(() => new Concat({
            opening: literal,
            thing: "thing",
        }), e => {
            assert(e.message.indexOf("Step [opening] is undefined") !== -1);
            return true;
        });
    });

    it("does not allow null matcher field steps", () => {
        const literal: string = null;
        assert.throws(() => new Concat({
            opening: literal,
            thing: "thing",
        }), e => {
            assert(e.message.indexOf("Step [opening] is null") !== -1);
            return true;
        });
    });

});
