import { expect } from "chai";
import { InputState, InputStateManager } from "../src/InputState";
import { InputStream } from "../src/InputStream";
import { DEPENDENCY_GRAMMAR } from "./MavenGrammars";

import * as assert from "power-assert";

describe("InputStateTest", () => {

    it("cannot consume", () => {
        const is = InputState.fromString("foo bar");
        assert.throws(
            () => is.consume("xxxx"),
        );
    });

    it("remainder is all", () => {
        const is = InputState.fromString("foo bar");
        expect(is.peek(10)).equals("foo bar");
    });

    it("remainder is correct after advance", () => {
        const is = InputState.fromString("foo bar").advance();
        // expect(is.content).equals("foo bar");
        expect(is.peek(1000)).equals("oo bar");
    });

    it("remainder is correct after attempt advance past end", () => {
        const is = InputState.fromString("f").advance();
        expect(is.peek(10)).equals("");
    });

    it("peek is correct after read", () => {
        const is = InputState.fromString("0123456789");
        assert(is.peek(1) === "0");
        const at3 = is.consume("012");
        assert(is.peek(1) === "0");
        assert (at3.peek(2) === "34");
        const at4 = at3.advance();
        assert (at4.peek(4) === "4567");
    });

    it("peek and consume cross buffer size: buf=1", () =>
        withBuffer(1, "abcdefgh"));

    it("peek and consume cross buffer size: buf=2", () =>
        withBuffer(2, "abcdefgh"));

    it("peek and consume cross buffer size: buf=3", () =>
        withBuffer(3, "abcdefgh"));

    it("peek and consume cross buffer size: buf=4", () =>
        withBuffer(4, "abcdefgh"));

    it("peek and consume cross buffer size: buf=300", () =>
        withBuffer(300, "abcdefgh"));

    it("peek and consume cross buffer size: buf=1, exhausted", () =>
        withBuffer(1));

    it("peek and consume cross buffer size: buf=2, exhausted", () =>
        withBuffer(2));

    it("peek and consume cross buffer size: buf=3, exhausted", () =>
        withBuffer(3));

    it("peek and consume cross buffer size: buf=4, exhausted", () =>
        withBuffer(4));

    it("peek and consume cross buffer size: buf=300", () =>
        withBuffer(300));

    function withBuffer(bufSize: number, extraContent: string = "") {
        let is = InputState.fromString("0123456789" + extraContent);
        assert(is.peek(7) === "0123456");
        is = is.consume("01");
        assert(is.peek(3) === "234");
        is = is.consume("234567");
        assert(is.peek(1) === "8");
    }

    it("read ahead does not dirty parent", () => {
        const stream = new ReleasingStringInputStream("the quick brown fox jumps over the lazy dog");
        expect(stream.offset).to.equal(0);

        const state0 = new InputState(new InputStateManager(stream));

        const state1 = state0.advance();
        expect(state1.offset).to.equal(1);
        const state2 = state1.advance();
        const state3 = state2.advance().advance();
        expect(state3.consume("quick").peek(" brown".length)).to.equal(" brown");
        expect(state0.offset).to.equal(0);
        // This isn't valid as this state is stale
        // expect(state0.peek("the quick brown".length)).to.equal("the quick brown");
    });

    it("backtracking does not overwrite buffer", () => {
        const complexGrammar = DEPENDENCY_GRAMMAR;
        const easyMatch =
            `
            <dependency>
			<groupId>com.krakow</groupId>
			<artifactId>lib1</artifactId>
			<version>0.1.1</version>
		</dependency>
            `;
        const requiresBacktracking =
            `
            <dependency>
			<groupId>com.krakow</groupId>
			<artifactId>lib1</artifactId>
			<vxsion>0.1.1</vxsion>
		</dependency>
		<dependency>
			<groupId>com.krakow</groupId>
			<artifactId>lib1</artifactId>
			<version>0.1.1</version>
		</dependency>
            `;
        const requiresMoreBacktracking =
            `
            <dependency>
			<groupId>com.krakow</groupId>
			<artifactId>lib1</artifactId>
			<vxsion>0.1.1</vxsion>
		</dependency>
		<de></de>
		<dependency><groupId>xxxxx</groupId>
		<dependency>
			<groupId>com.krakow</groupId>
			<artifactId>lib1</artifactId>
			<version>0.1.1</version>
		</dependency>
            `;
        for (const s of [easyMatch, requiresBacktracking, requiresMoreBacktracking]) {
            const input = new ReleasingStringInputStream(s);
            const pm = complexGrammar.firstMatch(input);
            expect(pm.version).to.equal("0.1.1");
        }
    });

});

/**
 * Gradually releases the string in memory, to simulate consumed resources.
 * String interning probably means we don't want this to be the default implementation.
 */
class ReleasingStringInputStream implements InputStream {

    private offs = 0;

    private content = this.initialContent;

    constructor(public initialContent: string) {
        if (initialContent === undefined) {
            throw new Error("Undefined content");
        }
    }

    public get offset() {
        return this.offs;
    }

    public exhausted() {
        return this.content === "";
    }

    public read(n: number): string {
        const s = this.content.substr(0, n);
        this.offs += s.length;
        this.content = this.content.substr(n);
        return s;
    }

}
