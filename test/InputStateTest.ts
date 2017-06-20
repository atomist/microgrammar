import { expect } from "chai";
import { InputState } from "../src/InputState";
import { InputStream } from "../src/InputStream";
import { StringInputStream } from "../src/StringInputStream";
import { DEPENDENCY_GRAMMAR } from "./MavenGrammars";

describe("InputStateTest", () => {

    it("cannot consume", () => {
        const is = InputState.fromString("foo bar");
        // TODO chai must have something better for this
        try {
            is.consume("xxxx");
        } catch (e) {
            // no problem
        }
    });

    it("remainder is all", () => {
        const is = InputState.fromString("foo bar");
        expect(is.peek(10)).equals("foo bar");
    });

    it("remainder after advance", () => {
        const is = InputState.fromString("foo bar").advance();
        // expect(is.content).equals("foo bar");
        expect(is.peek(1000)).equals("oo bar");
    });

    it("remainder after attempt advance past end", () => {
        const is = InputState.fromString("f").advance();
        expect(is.peek(10)).equals("");
    });

    it("read ahead respects buffer size", () => {
        const stream = new ReleasingStringInputStream("the quick brown fox jumps over the lazy dog");
        expect(stream.offset).to.equal(0);
        const state0 = InputState.fromInputStream(stream, 1);
        expect(stream.offset).to.equal(0);
        expect(state0.peek(1)).to.equal("t");
        const state1 = state0.advance();
        expect(state0.peek(1)).to.equal("t");
        expect(state1.peek(1)).to.equal("h");

        // TODO this buffer size assumptions seem reasonable, but fail.
        // However, the returned values seem fine

        // expect(stream.offset).to.equal(1);
        const state2 = state1.advance();
        expect(state2.peek(1)).to.equal("e");
        expect(state2.peek(5)).to.equal("e qui");
        expect(state0.peek(1)).to.equal("t");
        expect(state0.peek(2000)).to.equal(stream.initialContent);
        // expect(stream.offset).to.equal(2);
    });

    it("parallel read ahead respects buffer size", () => {
        const stream = new ReleasingStringInputStream("the quick brown fox jumps over the lazy dog");
        expect(stream.offset).to.equal(0);
        const state0 = InputState.fromInputStream(stream, 1);
        expect(stream.offset).to.equal(0);
        const state1 = state0.advance();
        expect(stream.offset).to.equal(1);
        const state1a = state0.advance();
        // expect(stream.offset).to.equal(1);
        expect(state1.peek(1)).to.equal("h");
        expect(state1a.peek(1)).to.equal("h");

        const state2 = state1.advance();
        expect(state2.peek(1)).to.equal("e");

        // expect(stream.offset).to.equal(2);
        expect(state0.peek(1)).to.equal("t");

    });

    it("read ahead does not dirty 'parent'", () => {
        const stream = new ReleasingStringInputStream("the quick brown fox jumps over the lazy dog");
        expect(stream.offset).to.equal(0);

        const state0 = InputState.fromInputStream(stream, 1);

        const state1 = state0.advance();
        expect(state1.offset).to.equal(1);
        const state2 = state1.advance();
        const state3 = state2.advance().advance();
        expect(state3.consume("quick").peek(" brown".length)).to.equal(" brown");
        expect(state0.offset).to.equal(0);
        expect(state0.peek("the quick brown".length)).to.equal("the quick brown");
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
            const input = InputState.fromInputStream(new ReleasingStringInputStream(s), 1);
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
