import { expect } from "chai";
import { fail } from "power-assert";
import * as assert from "power-assert";
import { WhiteSpaceSensitive } from "../src/Config";
import { MatchingLogic, Term } from "../src/Matchers";
import { MatchingMachine, Microgrammar } from "../src/Microgrammar";
import { Alt, Opt } from "../src/Ops";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Rep, Rep1Sep, RepSep } from "../src/Rep";
import { RealWorldPom } from "./Fixtures";
import {
    ALL_PLUGIN_GRAMMAR,
    ARTIFACT_VERSION_GRAMMAR,
    DEPENDENCY_GRAMMAR,
    PLUGIN_GRAMMAR,
    VersionedArtifact,
} from "./MavenGrammars";

/* tslint:disable:max-file-line-count */

describe("Microgrammar", () => {

    it("literal", () => {
        const content = "foo ";
        const mg = Microgrammar.fromDefinitions({
            name: "foo",
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        expect(result[0].$matched).to.equal("foo");
    });

    function makeMg() {
        return Microgrammar.fromDefinitions({
            name: "foo",
        });
    }

    it("allows valid call to function", () => {
        const content = "foo ";
        const validMg = Microgrammar.fromDefinitions({
            content: makeMg(),
        });
        const result = validMg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        assert(result[0].$matched === "foo");
    });

    it("prevents invalid call to function", () => {
        // This is invalid as we are not invoking the function
        try {
            Microgrammar.fromDefinitions({
                content: makeMg,
            });
            fail("Should not permit invalid function step");
        } catch (e) {
            assert(e.toString().lastIndexOf("content") !== -1);
        }
    });

    it("XML element", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.name === "foo");
        // expect(r0.matched).to.equal("<foo>")
    });

    function testTwoXmlElements(content: string, first: string, second: string) {
        const mg = Microgrammar.fromDefinitions({
            _lx: "<",
            name: /[a-zA-Z0-9]+/,
            _rx: ">",
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(2);
        const r0 = result[0] as any;
        expect(r0.name).to.equal(first);
        // expect(r0.matched).to.equal("<foo>")
        const r1 = result[1] as any;
        expect(r1.name).to.equal(second);
        expect(r1.$matched).to.equal("<bar>");
        // expect(r1.name.matched).to.equal("bar");
    }

    it("2 XML elements without intervening whitespace via microgrammar", () => {
        testTwoXmlElements("<foo><bar>", "foo", "bar");
    });

    it("2 XML elements with intervening whitespace via microgrammar", () => {
        testTwoXmlElements("<foo>   <bar>", "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and trailing junk via microgrammar", () => {
        testTwoXmlElements("<foo>   <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and leading junk via microgrammar", () => {
        // tslint:disable-next-line:max-line-length
        testTwoXmlElements(
            "and this is a load of nonsense we don't care about <foo>   <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and junk and leading junk via microgrammar", () => {
        // tslint:disable-next-line:max-line-length
        testTwoXmlElements(
            "and this is a load of nonsense we don't care about <foo> and SO **** 7&&@#$@#$ is this  <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements via nested microgrammar", () => {
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
        const result = mg.findMatches(content);
        // console.log("xxx Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$matched).to.equal(content);
        expect(r0.first.namex).to.equal("first");
    });

    it("2 elements: whitespace insensitive", () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            _lx: "<",
            namex: /[a-zA-Z0-9]+/,
            _rx: ">",
            notxml: "notxml",
        });
        const result = mg.findMatches(content);
        assert(result.length === 1);
    });

    it("2 elements: whitespace sensitive", () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            ...WhiteSpaceSensitive,
            _lx: "<",
            namex: /[a-zA-Z0-9]+/,
            _rx: ">",
            notxml: "notxml",
        });
        const result = mg.findMatches(content);
        assert(result.length === 0);
    });

    it("stop after match with arrow function", () => {
        interface Named {
            name: string;
        }

        const mg = Microgrammar.fromDefinitions<Named>({
            name: /[A-Z][a-z]+/,
        });
        const result = mg.findMatches("Emmanuel Marine");
        expect(result.length).to.equal(2);
        expect(result[0].name).to.equal("Emmanuel");
        expect(result[1].name).to.equal("Marine");
        const result2 = mg.findMatches("Greg Tony", {}, undefined, pm => true);
        expect(result2.length).to.equal(1);
        expect(result2[0].name).to.equal("Greg");
        const result3 = mg.firstMatch("Bill George");
        expect(result3.name).to.equal("Bill");
        expect(result3.$offset).to.equal(0);
    });

    it("stop after match with class", () => {
        interface Named {
            name: string;
        }

        const mg = Microgrammar.fromDefinitions<Named>({
            name: /[A-Z][a-z]+/,
        });
        const result = mg.findMatches("Emmanuel Marine");
        expect(result.length).to.equal(2);
        expect(result[0].name).to.equal("Emmanuel");
        expect(result[1].name).to.equal("Marine");

        class LazyMatcher extends MatchingMachine {

            public matches: PatternMatch[] = [];

            constructor(ml: MatchingLogic) {
                super(ml);
            }

            protected onMatch(pm: PatternMatch): MatchingLogic {
                this.matches.push(pm);
                return null;
            }
        }

        const lm = new LazyMatcher(mg.matcher);
        lm.consume("Greg Tony");
        const result2 = lm.matches as any;

        expect(result2.length).to.equal(1);
        expect(result2[0].name).to.equal("Greg");
    });

    it("1 XML elements via nested microgrammar with optional present", () => {
        const content = "<first><second>";
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromDefinitions({
            first: element,
            second: new Opt(element),
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(result[0].$matched === content);
        assert(r0.first.name === "first");
        assert(r0.first.$matched === "<first>");
        assert(r0.second.name === "second");
        // Now access match for the name
        const nameMatch = r0.second.$valueMatches.name as PatternMatch;

        // for (const p in r0.second) {
        //     if ("tslint wants an if") {
        //         console.log(`property ${p}:`);
        //         console.log(`[${JSON.stringify(r0.second[p])}]`);
        //     }
        // }

        // console.log(`yo [${JSON.stringify(r0.second)}]`);
        assert(nameMatch.$value === "second");
        // console.log("not yo");
        assert(nameMatch.$matched === nameMatch.$value);
        assert(nameMatch.$offset === "<first><".length);
    });

    it("1 XML elements via nested microgrammar with optional not present", () => {
        const content = "<first>";
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromDefinitions({
            first: element,
            second: new Opt(element),
        });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        assert(isPatternMatch(r0));
        assert(r0.$matched === content);
        assert(r0.first);
        assert(r0.first.$matched === "<first>");
        assert(r0.second === undefined);
    });

    it("2 XML elements via nested microgrammar with whitespace", () => {
        const content = `<first>
                  <second>`;
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromDefinitions({
            first: element,
            second: element,
            $id: "element",
        } as Term);
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$name).to.equal("element");
        expect(r0.$matched).to.equal(content);
        expect(r0.first.$matched).to.equal("<first>");
        expect(r0.first.name).to.equal("first");
        expect(r0.second.name).to.equal("second");
    });

    it("parse dependencies in real world POM", () => {
        const matches = DEPENDENCY_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        if (matches.length === 0) {
            throw new Error("Expected matches");
        }
        expect(matches[0].group).to.equal("com.krakow");
        expect(matches[0].artifact).to.equal("lib1");
        expect(matches[0].version).to.equal("0.1.1");
    });

    it("parse dependencies in ill formed POM", () => {
        const matches = DEPENDENCY_GRAMMAR.findMatches("<this is a load of nonsense") as any as VersionedArtifact[];
        expect(matches.length).to.equal(0);
    });

    it("parse plugins in real world POM", () => {
        const matches = PLUGIN_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        if (matches.length === 0) {
            throw new Error("Expected matches");
        }
        expect(matches[0].group).to.equal("org.apache.maven.plugins");
        expect(matches[0].artifact).to.equal("maven-surefire-plugin");
        expect(matches[0].version).to.equal("2.19.1");
    });

    it("parse plugins without version in real world POM", () => {
        const matches = ALL_PLUGIN_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        if (matches.length === 0) {
            throw new Error("Expected matches");
        }
        expect(matches[0].group).to.equal("org.springframework.boot");
        expect(matches[0].artifact).to.equal("spring-boot-maven-plugin");
    });

    it("find version of real world POM", () => {
        const matches = ARTIFACT_VERSION_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        if (matches.length === 0) {
            throw new Error(`Expected matches, not ${matches.length}`);
        }
        expect(matches[0].version).to.equal("0.1.0-SNAPSHOT");
    });

    function namesGrammar() {
        const names = new RepSep(/[a-zA-Z0-9]+/, ",");
        return Microgrammar.fromDefinitions({
            dogs: names,
            _separator: "****",
            cats: names,
        });
    }

    it("extract empty rep structure", () => {
        const matches = namesGrammar().findMatches("****") as any[];
        if (matches.length !== 1) {
            throw new Error(`Expected 1 matches, not ${matches.length}`);
        }
        assert(matches[0]._separator === undefined, "_ properties don't get bound");
        assert(matches[0].dogs.length === 0);
        assert(matches[0].cats.length === 0);
    });

    it("extract non-empty rep structure", () => {
        const matches = namesGrammar().findMatches("Fido **** Felix, Oscar") as any[];
        if (matches.length !== 1) {
            throw new Error(`Expected 1 matches, not ${matches.length}`);
        }
        assert(matches[0]._separator === undefined);
        expect(matches[0].dogs).to.have.members(["Fido"]);
        expect(matches[0].cats).to.have.members(["Felix", "Oscar"]);
    });

    it("microgrammars can compose: no match", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
        });

        const mg = Microgrammar.fromDefinitions({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            pigs: nested,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****_Porker");
        expect(matches.length).to.equal(0);
    });

    it("microgrammars can compose: match", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
        });

        const mg = Microgrammar.fromDefinitions({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            pigs: nested,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****Porker") as any[];
        assert(matches.length === 1);
        const m = matches[0];
        expect(m.cats).to.have.members(["Felix", "Oscar"]);
        expect(m.pigs.pigs).to.have.members(["Porker"]);
    });

    it("flatten definitions into parent", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
        });

        const mg = Microgrammar.fromDefinitions<CatsDogsAndPigs>({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            // Bring in the definitions from the given grammar
            ...nested.definitions,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****Porker");
        expect(matches.length).to.equal(1);
        const m = matches[0];
        expect(m.cats).to.have.members(["Felix", "Oscar"]);
        expect(m.pigs).to.have.members(["Porker"]);
    });

    it("opt is flattened and returns undefined", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
        });

        const mg = Microgrammar.fromDefinitions<CatsDogsAndPigs>({
            dogs: new Opt(names),
            _separator: "****",
            cats: names,
            _separator2: "****",
            // Bring in the definitions from the given grammar
            ...nested.definitions,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****Porker");
        expect(matches.length).to.equal(1);
        const m = matches[0];
        expect(m.dogs).to.have.members(["Fido"]);
        expect(m.cats).to.have.members(["Felix", "Oscar"]);
        expect(m.pigs).to.have.members(["Porker"]);

        const matches2 = mg.findMatches("**** Felix, Oscar****Porker");
        const m2 = matches2[0];
        expect(m2.dogs).to.equal(undefined);
        expect(m2.cats).to.have.members(["Felix", "Oscar"]);
        expect(m2.pigs).to.have.members(["Porker"]);
    });

});

export const stringTextPattern =
    new Rep(new Alt("\\\"", /[^"]/)); // (?:\\"|[^"])*/;

export const stringGrammar: Microgrammar<any> = Microgrammar.fromDefinitions<any>({
    foo: ctx => {
        console.log("commence match");
    },
    _p1: "\"",
    foo2: ctx => {
        console.log("1");
    },
    charArray: stringTextPattern,
    foo3: ctx => {
        console.log(`3 + [${JSON.stringify(ctx.charArray)})]`);
    },
    _p2: "\"",
    foo4: ctx => {
        console.log("4");
    },
    text: ctx => ctx.charArray.join(""),
    $id: "stringText",
});

interface CatsDogsAndPigs {
    dogs: string[];
    cats: string[];
    pigs: string[];
}
