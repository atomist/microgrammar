import { Microgrammar } from "../../src/Microgrammar";
import { Opt } from "../../src/Ops";
import { isPatternMatch } from "../../src/PatternMatch";
import { RepSep } from "../../src/Rep";
import { RealWorldPom } from "../Fixtures";
import {
    ALL_PLUGIN_GRAMMAR,
    ARTIFACT_VERSION_GRAMMAR,
    LEGAL_VALUE,
    PLUGIN_GRAMMAR,
    VersionedArtifact,
} from "../MavenGrammars";

import * as assert from "power-assert";
import { WhiteSpaceSensitive } from "../../src/Config";
import { Float } from "../../src/Primitives";

describe("MicrogrammarFromString", () => {

    it("literal", () => {
        const content = "foo ";
        const mg = Microgrammar.fromString("foo");
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        assert(result[0].$matched === "foo");
    });

    it("XML element", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromString("<${name}>", {
            name: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.name === "foo");
        // expect(r0.matched).to.equal("<foo>")
    });

    function testTwoXmlElements(content: string, first: string, second: string) {
        const mg = Microgrammar.fromString("<${name}>", {
            name: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 2);
        const r0 = result[0] as any;
        assert(r0.name === first);
        // expect(r0.matched).to.equal("<foo>")
        const r1 = result[1] as any;
        assert(r1.name === second);
        assert(r1.$matched === "<bar>");
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
        const element = Microgrammar.fromString("<${namex}>", {
            namex: /[a-zA-Z0-9]+/,
        });
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: element,
        });
        const result = mg.findMatches(content);
        // console.log("xxx Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.$matched === content);
        assert(r0.first.namex === "first");

    });

    it("2 elements: whitespace insensitive", () => {
        const content = "<first>notxml";
        const mg = Microgrammar.fromString<{ namex: string }>("<${namex}> notxml", {
            namex: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        assert(result.length === 1);
        assert(result[0].namex === "first");
    });

    it("2 elements: whitespace sensitive: match", () => {
        const content = "<first>  notxml";
        const mg = Microgrammar.fromString<{ namex: string }>("<${namex}> notxml", {
            ...WhiteSpaceSensitive,
            namex: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        assert(result.length === 0);
    });

    it("2 elements: whitespace sensitive: no match", () => {
        const content = "<first>  notxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}> notxml", {
            ...WhiteSpaceSensitive,
            namex: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        assert(result.length === 0);
    });

    it("2 elements: whitespace sensitive: match with return", () => {
        const content = "<first>\n\tnotxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}>\n\tnotxml", {
            namex: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        assert(result.length === 1);
    });

    it("stop after match", () => {
        interface Named {
            name: string;
        }
        const mg = Microgrammar.fromString<Named>("${name}", {
            name: /[A-Z][a-z]+/,
        });
        const result = mg.findMatches("Greg Tony");
        assert(result.length === 2);
        assert(result[0].name === "Greg");
        assert(result[1].name === "Tony");
        const result2 = mg.findMatches("David Theresa", {}, {}, pm => true);
        assert(result2.length === 1);
        assert(result2[0].name === "David");
        const result3 = mg.firstMatch("Gough Malcolm");
        assert(result3.name === "Gough");
        assert(result3.$offset === 0);
    });

    it("1 XML elements via nested microgrammar with optional present", () => {
        const content = "<first><second>";
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: new Opt(element),
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.first.name === "first");
        assert(r0.second.name === "second");
    });

    it("1 XML elements via nested microgrammar with optional not present", () => {
        const content = "<first>";
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: new Opt(element),
        });
        const result = mg.findMatches(content);
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(isPatternMatch(r0));
        assert(r0.$matched === content);
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
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: element,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.first.name === "first");
        assert(r0.second.name === "second");
    });

    const versionString = "<version>${version}</version>";
    const VERSION = {
        version: LEGAL_VALUE,
    };

    function dependencyGrammar() {
        return Microgrammar.fromString<VersionedArtifact>(
            `<dependency>
       <groupId> \${group} </groupId>
       <artifactId> \${artifact} </artifactId>
      ${versionString} `, {
                group: LEGAL_VALUE,
                artifact: LEGAL_VALUE,
                ...VERSION,
            });
    }

    it("parse dependencies in real world POM", () => {
        const matches = dependencyGrammar().findMatches(RealWorldPom) as any as VersionedArtifact[];
        assert(matches.length > 0);
        assert(matches[0].group === "com.krakow");
        assert(matches[0].artifact === "lib1");
        assert(matches[0].version === "0.1.1");
    });

    it("parse dependencies in ill formed POM", () => {
        const matches =
            dependencyGrammar().findMatches("<this is a load of bollocks") as any as VersionedArtifact[];
        assert(matches.length === 0);
    });

    it("parse plugins in real world POM", () => {
        const matches = PLUGIN_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        assert(matches.length > 0);
        assert(matches[0].group === "org.apache.maven.plugins");
        assert(matches[0].artifact === "maven-surefire-plugin");
        assert(matches[0].version === "2.19.1");
    });

    it("parse plugins without version in real world POM", () => {
        const matches = ALL_PLUGIN_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        assert(matches.length > 0);
        assert(matches[0].group === "org.springframework.boot");
        assert(matches[0].artifact === "spring-boot-maven-plugin");
    });

    it("find version of real world POM", () => {
        const matches = ARTIFACT_VERSION_GRAMMAR.findMatches(RealWorldPom) as any as VersionedArtifact[];
        assert (matches.length > 0);
        assert(matches[0].version === "0.1.0-SNAPSHOT");
    });

    function namesGrammar() {
        const names = new RepSep(/[a-zA-Z0-9]+/, ",");
        return Microgrammar.fromString("${dogs} **** ${cats}", {
            dogs: names,
            cats: names,
        });
    }

    it("extract empty rep structure", () => {
        const matches = namesGrammar().findMatches("****") as any[];
        assert (matches.length === 1);
        assert(matches[0].dogs.length === 0);
        assert(matches[0].cats.length === 0);
    });

    it("extract non-empty rep structure", () => {
        const matches = namesGrammar().findMatches("Fido **** Felix, Oscar") as any[];
        assert (matches.length === 1);
        assert.deepEqual(matches[0].dogs, ["Fido"]);
        assert.deepEqual(matches[0].cats, ["Felix", "Oscar"]);
    });

    it("handles escaped literal $", () => {
        const content = "The $AUD has risen lately";
        const mg = Microgrammar.fromString("The \$${currency} has risen lately", {
            currency: /[A-Z]{3}/,
        });
        const result = mg.findMatches(content);
        assert(result.length === 1);
        const r0 = result[0] as any;
        assert(r0.currency === "AUD");
    });

    it("uses dictionary in long sentence", () => {
        const dictionary = {
            currency: /[A-Z]{3}/,
            amount: Float,
        };
        const content = "The recent movement in the AUD has gained you $762.49";
        const mg = Microgrammar.fromString<any>("The recent movement in the ${currency} has gained you $${amount}", dictionary);
        const result = mg.findMatches(content);
        assert(result.length === 1);
        assert(result[0].currency === "AUD");
        assert(result[0].amount === 762.49);
    });

});
