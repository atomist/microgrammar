import { expect } from "chai";
import { Microgrammar } from "../../src/Microgrammar";
import { Opt } from "../../src/Ops";
import { PatternMatch } from "../../src/PatternMatch";
import { RepSep } from "../../src/Rep";
import { RealWorldPom } from "../Fixtures";
import {
    ALL_PLUGIN_GRAMMAR, ARTIFACT_VERSION_GRAMMAR, LEGAL_VALUE, PLUGIN_GRAMMAR,
    VersionedArtifact,
} from "../MavenGrammars";

describe("MicrogrammarFromString", () => {

    it("literal", () => {
        const content = "foo ";
        const mg = Microgrammar.fromString("foo");
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        expect(result[0].$matched).to.equal("foo");
    });

    it("XML element", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromString("<${name}>", {
            name: /[a-zA-Z0-9]+/,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.name).to.equal("foo");
        // expect(r0.matched).to.equal("<foo>")
    });

    function testTwoXmlElements(content: string, first: string, second: string) {
        const mg = Microgrammar.fromString("<${name}>", {
            name: /[a-zA-Z0-9]+/,
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
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$matched).to.equal(content);
        expect(r0.first.namex).to.equal("first");

    });

    it("2 elements: whitespace insensitive", () => {
        const content = "<first>notxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}> notxml", {
            namex: /[a-zA-Z0-9]+/,
        }, {
            consumeWhiteSpaceBetweenTokens: true,
        });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(1);
        expect(result[0].namex).to.equal("first");
    });

    it("2 elements: whitespace sensitive: match", () => {
        const content = "<first>  notxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}> notxml", {
            namex: /[a-zA-Z0-9]+/,
        }, {
            consumeWhiteSpaceBetweenTokens: false,
        });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(0);
    });

    it("2 elements: whitespace sensitive: no match", () => {
        const content = "<first>  notxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}> notxml", {
            namex: /[a-zA-Z0-9]+/,
        }, {
            consumeWhiteSpaceBetweenTokens: false,
        });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(0);
    });

    it("2 elements: whitespace sensitive: match with return", () => {
        const content = "<first>\n\tnotxml";
        const mg = Microgrammar.fromString<{ namex: string[] }>("<${namex}>\n\tnotxml", {
            namex: /[a-zA-Z0-9]+/,
        }, {
            consumeWhiteSpaceBetweenTokens: false,
        });
        const result = mg.findMatches(content);
        expect(result.length).to.equal(1);
    });

    it("stop after match", () => {
        interface Named {
            name: string;
        }
        const mg = Microgrammar.fromString<Named>("${name}", {
            name: /[A-Z][a-z]+/,
        });
        const result = mg.findMatches("Greg Tony");
        expect(result.length).to.equal(2);
        expect(result[0].name).to.equal("Greg");
        expect(result[1].name).to.equal("Tony");
        const result2 = mg.findMatches("David Theresa", pm => true);
        expect(result2.length).to.equal(1);
        expect(result2[0].name).to.equal("David");
        const result3 = mg.firstMatch("Gough Malcolm");
        expect(result3.name).to.equal("Gough");
        expect(result3.$offset).to.equal(0);
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
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: new Opt(element),
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
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
        const mg = Microgrammar.fromString("${first}${second}", {
            first: element,
            second: element,
        });
        const result = mg.findMatches(content);
        // console.log("Result is " + JSON.stringify(result));
        expect(result.length).to.equal(1);
        const r0 = result[0] as any;
        expect(r0.$matched).to.equal(content);
        expect(r0.first.$match.$matched).to.equal("<first>");
        expect(r0.first.name).to.equal("first");
        expect(r0.second.name).to.equal("second");
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
        if (matches.length === 0) {
            throw new Error("Expected matches");
        }
        expect(matches[0].group).to.equal("com.krakow");
        expect(matches[0].artifact).to.equal("lib1");
        expect(matches[0].version).to.equal("0.1.1");
    });

    it("parse dependencies in ill formed POM", () => {
        const matches =
            dependencyGrammar().findMatches("<this is a load of bollocks") as any as VersionedArtifact[];
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
        return Microgrammar.fromString("${dogs} **** ${cats}", {
            dogs: names,
            cats: names,
        });
    }

    it("extract empty rep structure", () => {
        const matches = namesGrammar().findMatches("****") as any[];
        if (matches.length !== 1) {
            throw new Error(`Expected 1 matches, not ${matches.length}`);
        }
        expect(matches[0].dogs.length).to.equal(0);
        expect(matches[0].cats.length).to.equal(0);
    });

    it("extract non-empty rep structure", () => {
        const matches = namesGrammar().findMatches("Fido **** Felix, Oscar") as any[];
        if (matches.length !== 1) {
            throw new Error(`Expected 1 matches, not ${matches.length}`);
        }
        expect(matches[0].dogs).to.have.members(["Fido"]);
        expect(matches[0].cats).to.have.members(["Felix", "Oscar"]);
    });

});
