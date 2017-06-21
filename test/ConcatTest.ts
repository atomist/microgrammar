import { expect } from "chai";
import { Concat } from "../src/Concat";
import { InputState } from "../src/InputState";
import { AnonymousDefinition, Term } from "../src/Matchers";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Integer } from "../src/Primitives";
import { RepSep } from "../src/Rep";

describe("ConcatTest", () => {

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
            ...AnonymousDefinition,
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
            ...AnonymousDefinition,
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
            ...AnonymousDefinition,
        });
        const is = InputState.fromString(content);
        const result = mg.matchPrefix(is, {}) as any;
        expect(isPatternMatch(result)).to.equal(true);
        expect(result.$matched).to.equal(content);
        expect(result.hours).to.equal(24);
        expect(result.days).to.equal(7);
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
