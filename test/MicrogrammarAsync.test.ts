import { expect } from "chai";
import * as assert from "power-assert";
import { WhiteSpaceSensitive } from "../lib/Config";
import { matchesIn, Microgrammar } from "../lib/Microgrammar";

/* tslint:disable:max-file-line-count */

describe("Microgrammar async", () => {

    it("literal", async () => {
        const content = "foo ";
        const mg = Microgrammar.fromDefinitions({
            name: "foo",
        });
        const result = await mg.findMatchesAsync(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        expect(result[0].$matched).to.equal("foo");
    });

    function makeMg() {
        return Microgrammar.fromDefinitions({
            name: "foo",
        });
    }

    it("allows valid call to function", async () => {
        const content = "foo ";
        const validMg = Microgrammar.fromDefinitions({
            content: makeMg(),
        });
        const result = await validMg.findMatchesAsync(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        assert(result[0].$matched === "foo");
    });

    it("XML element", async () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        });
        const result = await mg.findMatchesAsync(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.name === "foo");
        // expect(r0.matched).to.equal("<foo>")
    });

    async function testTwoXmlElements(content: string, first: string, second: string) {
        const mg = Microgrammar.fromDefinitions({
            _lx: "<",
            name: /[a-zA-Z0-9]+/,
            _rx: ">",
        });
        const result = [];
        const matches = matchesIn(mg, content);
        for (const m of matches) {
            result.push(m);
        }
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(2);
        const r0 = result[0];
        expect(r0.name).to.equal(first);
        // expect(r0.matched).to.equal("<foo>")
        const r1 = result[1];
        expect(r1.name).to.equal(second);
        expect(r1.$matched).to.equal("<bar>");
        // expect(r1.name.matched).to.equal("bar");
    }

    it("2 XML elements without intervening whitespace via microgrammar", async () => {
        await testTwoXmlElements("<foo><bar>", "foo", "bar");
    });

    it("2 XML elements with intervening whitespace via microgrammar", async () => {
        await testTwoXmlElements("<foo>   <bar>", "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and trailing junk via microgrammar", async () => {
        await testTwoXmlElements("<foo>   <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and leading junk via microgrammar", async () => {
        // tslint:disable-next-line:max-line-length
        await testTwoXmlElements(
            "and this is a load of nonsense we don't care about <foo>   <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and junk and leading junk via microgrammar", async () => {
        // tslint:disable-next-line:max-line-length
        await testTwoXmlElements(
            "and this is a load of nonsense we don't care about <foo> and SO **** 7&&@#$@#$ is this  <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements via nested microgrammar", async () => {
        const content = "<first><second>";
        const element = {
            _lx: "<",
            namex: /[a-zA-Z0-9]+/,
            _rx: ">",
        };
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            first: element,
            second: element,
        });
        const result = await mg.findMatchesAsync(content);
        // console.log("xxx Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$matched).to.equal(content);
        expect(r0.first.namex).to.equal("first");
    });

    it("2 elements: whitespace insensitive", async () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            _lx: "<",
            namex: /[a-zA-Z0-9]+/,
            _rx: ">",
            notxml: "notxml",
        });
        const result = await mg.findMatchesAsync(content);
        assert(result.length === 1);
    });

    it("2 elements: whitespace sensitive", async () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            ...WhiteSpaceSensitive,
            _lx: "<",
            namex: /[a-zA-Z0-9]+/,
            _rx: ">",
            notxml: "notxml",
        });
        const result = await mg.findMatchesAsync(content);
        assert(result.length === 0);
    });

});
