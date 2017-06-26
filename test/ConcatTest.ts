import { expect } from "chai";
import { Concat } from "../src/Concat";
import { InputState } from "../src/InputState";
import { Term } from "../src/Matchers";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Integer } from "../src/Primitives";
import { Rep1Sep, RepSep } from "../src/Rep";

import * as assert from "power-assert";

describe("Concat", () => {

    it("single literal", () => {
        const content = "foo ";
        const mg = new Concat({
            name: "foo",
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        expect(result.$matched).to.equal("foo");
        expect(result.name).to.equal("foo");
    });

    it("single digit with regex", () => {
        const content = "2";
        const mg = new Concat({
            $id: "Foo",
            num: /^[1-9][0-9]*/,
        } as Term);
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        // expect(result.$matched).to.equal(content);
        expect(result.$matchers.length).to.equal(1);
        // expect(result.$matchers[0].$value).to.equal(2);
        // expect(result.$value).to.equal(2);
        expect(result.num).to.equal("2");
    });

    it("integer with single digit", () => {
        const content = "2";
        const mg = new Concat({
            num: Integer,
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        // expect(result.$matched).to.equal(content);
        // expect(result.$matchers.length).to.equal(1);
        // console.log(JSON.stringify(result.$matchers[0]))
        // expect(result.$matchers[0].$value).to.equal(2);
        // expect(result.$value).to.equal(2);
        expect(result.num).to.equal(2);
    });

    it("integer with multiple digits", () => {
        const content = "24";
        const mg = new Concat({
            num: Integer,
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        expect(result.$matched).to.equal(content);
        expect(result.num).to.equal(24);
    });

    it("integers", () => {
        const content = "24x7";
        const mg = new Concat({
            hours: Integer,
            _x: "x",
            days: Integer,
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        expect(result.$matched).to.equal(content);
        expect(result.hours).to.equal(24);
        expect(result.days).to.equal(7);
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
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        assert(isPatternMatch(result));
        assert(result.name === "Lizzy");
        assert(result.spouse.name === "Katrina");
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
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        assert(isPatternMatch(result));
        assert(result.names[0], "Lizzy");
        assert(result.spouse.names[0] === "Katrina");
        assert(result.spouse.names[1] === "Terri");
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
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        assert(isPatternMatch(result));
        assert(result.gentlemen.names[0], "Jardine");
        assert(result.players.names[0] === "Bradman");
        assert(result.players.names[1] === "Woodfull");
    });

    it("respects nesting without name collisions using parallel reps without concats", () => {
        const mg = new Concat({
            gentlemen: new Rep1Sep(/[A-Za-z]+/, ","),
            _bp: "vs",
            players: new Rep1Sep(/[A-Za-z]+/, ","),
        });
        const content = "Jardine vs Bradman,Woodfull";
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        assert(isPatternMatch(result));
        assert(result.gentlemen[0], "Jardine");
        assert(result.players[0] === "Bradman");
        assert(result.players[1] === "Woodfull");
    });

    it("repsep of concat", () => {
        const nameList = {
            names: new Rep1Sep({
                name: /[A-Za-z]+/,
                lp : "(",
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
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        assert(isPatternMatch(result));
        assert(result.gentlemen.names[0].name, "Jardine");
        assert(result.players.names[0].name === "Bradman");
        assert(result.players.names[1].name === "Woodfull");
        assert(result.players.names[1].plays[0] = "bat");
        // Don't pollute higher level namespace
        assert(result.name === undefined);
        assert(result.gentlemen.name === undefined, "Don't pollute parent namespace");
    });

    it("rep array structure", () => {
        const content = "Donald: golf, tweeting";
        const mg = new Concat({
            name: /[A-Z][a-z]+/,
            delim: ":",
            hobbies: new RepSep(/[a-z]+/, ","),
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as PatternMatch;
        expect(isPatternMatch(result)).to.equal(true);
        const r = result as any;
        expect(r.name).to.equal("Donald");
        expect(r.delim).to.equal(":");
        expect(r.hobbies).to.have.members(["golf", "tweeting"]);
    });

});
