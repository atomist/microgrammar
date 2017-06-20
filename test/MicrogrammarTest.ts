import { expect } from "chai";
import * as assert from "power-assert";
import { AnonymousDefinition, MatchingLogic, Term } from "../src/Matchers";
import { MatchingMachine } from "../src/MatchingMachine";
import { Microgrammar } from "../src/Microgrammar";
import { Opt } from "../src/Ops";
import { PatternMatch } from "../src/PatternMatch";
import { Rep1Sep, RepSep } from "../src/Rep";
import { RealWorldPom } from "./Fixtures";
import {
    ALL_PLUGIN_GRAMMAR, ARTIFACT_VERSION_GRAMMAR, DEPENDENCY_GRAMMAR, PLUGIN_GRAMMAR,
    VersionedArtifact,
} from "./MavenGrammars";

describe("MicrogrammarTest", () => {

    it("literal", () => {
        const content = "foo ";
        const mg = Microgrammar.fromDefinitions({
            name: "foo",
            ...AnonymousDefinition,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        expect(result[0].$matched).to.equal("foo");
    });

    it("can JSON stringify", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        } as Term);
        const result = mg.findMatches(content);

        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        const stringified = JSON.stringify(r0);
        assert(stringified.indexOf("$resultingInputState") === -1);
        assert(stringified.length < 1500);
    });

    it("XML element", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.name).to.equal("foo");
        // expect(r0.matched).to.equal("<foo>")
    });

    function testTwoXmlElements(content: string, first: string, second: string) {
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        } as Term);
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
        testTwoXmlElements("and this is a load of nonsense we don't care about <foo>   <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements with intervening whitespace and junk and leading junk via microgrammar", () => {
        // tslint:disable-next-line:max-line-length
        testTwoXmlElements("and this is a load of nonsense we don't care about <foo> and SO **** 7&&@#$@#$ is this  <bar> who cares about this hunk of junk",
            "foo", "bar");
    });

    it("2 XML elements via nested microgrammar", () => {
        const content = "<first><second>";
        const element = {
            lx: "<",
            namex: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            first: element,
            second: element,
        } as Term);
        const result = mg.findMatches(content);
        // console.log("xxx Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$matched).to.equal(content);
        expect(r0.first.namex).to.equal("first");

        // TODO fix this
        // expect(r0.first.$matched.namex).to.equal("first");
    });

    it("2 elements: whitespace insensitive", () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            $id: "element",
            lx: "<",
            namex: /[a-zA-Z0-9]+/,
            rx: ">",
            notxml: "notxml",
        } as Term, {
                consumeWhiteSpaceBetweenTokens: true,
            });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(1);
    });

    it("2 elements: whitespace sensitive", () => {
        const content = "<first> notxml";
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            lx: "<",
            namex: /[a-zA-Z0-9]+/,
            rx: ">",
            notxml: "notxml",
        } as Term, {
                consumeWhiteSpaceBetweenTokens: false,
            });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(0);
    });

    it("stop after match with arrow function", () => {
        interface Named {
            name: string;
        }
        const mg = Microgrammar.fromDefinitions<Named>({
            name: /^[A-Z][a-z]+/,
        });
        const result = mg.findMatches("Emmanuel Marine");
        expect(result.length).to.equal(2);
        expect(result[0].name).to.equal("Emmanuel");
        expect(result[1].name).to.equal("Marine");
        const result2 = mg.findMatches("Greg Tony", pm => true);
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
            name: /^[A-Z][a-z]+/,
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
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(result[0].$matched).to.equal(content);
        expect(r0.first.name).to.equal("first");
        expect(r0.first.$match.$matched).to.equal("<first>");
        expect(r0.second.name).to.equal("second");
        // Now access match for the name
        const nameMatch = r0.second.name$match as PatternMatch;
        expect(nameMatch.$value).to.equal("second");
        expect(nameMatch.$matched).to.equal(nameMatch.$value);
        expect(nameMatch.$offset).to.equal("<first><".length);
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
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        // expect(r0.$name).to.equal("element");
        expect(r0.$matched).to.equal(content);
        expect(r0.first.$match.$matched).to.equal("<first>");
        expect(r0.second).to.equal(undefined);
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
        expect(r0.first.$match.$matched).to.equal("<first>");
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
        const matches = DEPENDENCY_GRAMMAR.findMatches("<this is a load of bollocks") as any as VersionedArtifact[];
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
        expect(matches[0]._separator).to.equal("****");
        expect(matches[0].dogs.length).to.equal(0);
        expect(matches[0].cats.length).to.equal(0);
    });

    it("extract non-empty rep structure", () => {
        const matches = namesGrammar().findMatches("Fido **** Felix, Oscar") as any[];
        if (matches.length !== 1) {
            throw new Error(`Expected 1 matches, not ${matches.length}`);
        }
        expect(matches[0]._separator).to.equal("****");
        expect(matches[0].dogs).to.have.members(["Fido"]);
        expect(matches[0].cats).to.have.members(["Felix", "Oscar"]);
    });

    it("microgrammars can compose: no match", () => {
        const names = new Rep1Sep(/^[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
        });

        const mg = Microgrammar.fromDefinitions({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            pigs: nested,
            ...AnonymousDefinition,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****_Porker");
        expect(matches.length).to.equal(0);
    });

    it("microgrammars can compose: match", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
            ...AnonymousDefinition,
        });

        const mg = Microgrammar.fromDefinitions({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            pigs: nested,
            ...AnonymousDefinition,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****Porker") as any[];
        expect(matches.length).to.equal(1);
        const m = matches[0] as any;
        expect(m.cats).to.have.members(["Felix", "Oscar"]);
        expect(m.pigs.pigs).to.have.members(["Porker"]);
    });

    it("flatten definitions into parent", () => {
        const names = new Rep1Sep(/[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
            ...AnonymousDefinition,
        });

        const mg = Microgrammar.fromDefinitions<CatsDogsAndPigs>({
            dogs: names,
            _separator: "****",
            cats: names,
            _separator2: "****",
            // Bring in the definitions from the given grammar
            ...nested.definitions,
            ...AnonymousDefinition,
        });
        const matches = mg.findMatches("Fido **** Felix, Oscar****Porker");
        expect(matches.length).to.equal(1);
        const m = matches[0];
        expect(m.cats).to.have.members(["Felix", "Oscar"]);
        expect(m.pigs).to.have.members(["Porker"]);
    });

    it("opt is flattened and returns undefined", () => {
        const names = new Rep1Sep(/^[a-zA-Z0-9]+/, ",");
        const nested = Microgrammar.fromDefinitions({
            pigs: names,
            ...AnonymousDefinition,
        });

        const mg = Microgrammar.fromDefinitions<CatsDogsAndPigs>({
            dogs: new Opt(names),
            _separator: "****",
            cats: names,
            _separator2: "****",
            // Bring in the definitions from the given grammar
            ...nested.definitions,
            ...AnonymousDefinition,
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

interface CatsDogsAndPigs {
    dogs: string[];
    cats: string[];
    pigs: string[];
}
