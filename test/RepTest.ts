import { expect } from "chai";
import { InputState } from "../src/InputState";
import { PatternMatch } from "../src/PatternMatch";
import { Rep, Rep1, Rep1Sep, RepSep } from "../src/Rep";
import { LEGAL_VALUE } from "./MavenGrammars";

describe("RepTest", () => {

    it("rep(0) should match 0 when matcher doesn't match", () => {
        const rep = new Rep("A");
        const is = InputState.fromString("friday 14");
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        // expect(is.peek(2)).to.equal(m.$resultingInputState.peek(2));
    });

    it("rep(1) should NOT match 0 when matcher doesn't match", () => {
        const rep = new Rep1("A");
        const is = InputState.fromString("friday 14");
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(false);
    });

    it("should match when matcher matches once", () => {
        const rep = new Rep("A");
        const is = InputState.fromString("And there was light!");
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
    });

    it("repsep should match when matcher matches once", () => {
        const rep = new RepSep("A", "abcd");
        const is = InputState.fromString("And there was light!");
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
    });

    it("rep matches several times", () => {
        const rep = new Rep(/^[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal(toMatch);
    });

    it("rep does not match several times when not ignoring whitespace", () => {
        const rep = new Rep(/^[a-zA-Z]+/).withConfig({ consumeWhiteSpaceBetweenTokens: false });
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal("And");
    });

    it("can extract data after rep matches several times", () => {
        const rep = new Rep(/^[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is) as PatternMatch;
        expect(m.$value.length).to.equal(4);
    });

    it("repsep matches several times", () => {
        const rep = new RepSep(/^[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal(toMatch);
    });

    it("rep1sep matches several times", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
        expect((m as PatternMatch).$matched).to.equal(toMatch);
    });

    it("rep1sep matches once", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "And";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(true);
    });

    it("rep1sep does not match zero times", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "16And";
        const content = toMatch + "!"; // The last char won't match
        const is = InputState.fromString(content);
        const m = rep.matchPrefix(is);
        expect(m.$isMatch).to.equal(false);
    });

    it("Maven property", () => {
        const rep = new Rep(property);
        const toMatch = `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
		<my.version>1.1.2-SNAPSHOT</my.version>
	</properties>
        `;
        const is = InputState.fromString(toMatch);
        const m = rep.matchPrefix(is) as PatternMatch;
        expect(m.$isMatch).to.equal(true);
        expect(m.$value.length).to.equal(3);
    });

});

const property = {
    _gt: "<",
    name: LEGAL_VALUE,
    _close: ">",
    value: /^[^<]+/,
    _gt2: "</",
    _closing: LEGAL_VALUE,
    _done: ">",
};
