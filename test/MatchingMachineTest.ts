import assert = require("power-assert");
import { expect } from "chai";

import { MatchingLogic } from "../src/Matchers";
import { MatchingMachine } from "../src/Microgrammar";
import { optional } from "../src/Ops";
import { PatternMatch } from "../src/PatternMatch";

import { takeUntil } from "../src/matchers/skip/Skip";
import { GAV, LEGAL_VALUE, VersionedArtifact, XML_TAG_WITH_SIMPLE_VALUE, XmlTag } from "./MavenGrammars";

describe("MatchingMachine", () => {

    it("save only when we're happy", () => {
        class SaveEverySecondMatch extends MatchingMachine {

            public matches: PatternMatch[] = [];

            private count = 0;

            constructor() {
                super({
                    name: /^[A-Z][a-z]+/,
                });
                // console.log("The matcher is " + JSON.stringify(this.matcher))
            }

            protected onMatch(pm: PatternMatch): MatchingLogic {
                if (this.count % 2 === 0) {
                    this.matches.push(pm);
                }
                this.count += 1;
                return this.matcher;
            }
        }

        const input = "Nicolas Francois Emmanuel Vladimir";
        const mm = new SaveEverySecondMatch();
        mm.consume(input);
        const result = mm.matches.map(m => m.$matched);
        expect(result).to.deep.equals(["Nicolas", "Emmanuel"]);
    });

    it("save first word then numbers only", () => {
        class SaveWordAndNumbers extends MatchingMachine {

            public matches: PatternMatch[] = [];

            constructor() {
                super({
                    name: /^[A-Za-z]+/,
                });

            }

            protected onMatch(pm: PatternMatch): any {
                this.matches.push(pm);
                return {
                    number: /^[0-9]+/,
                };
            }
        }

        const input = "Nicolas Francois 1234 Vladimir";
        const mm = new SaveWordAndNumbers();
        mm.consume(input);
        const result = mm.matches.map(m => m.$matched);
        expect(result).to.deep.equal(["Nicolas", "1234"]);
    });

    const pyClass = {
        _class: "class",
        name: /^[A-Za-z]+/,
        _sep: ":",
    };

    const pyMethod = {
        _def: "def",
        name: /^[a-z]+/,
        _lp: "(",
        args: /^[^)]*/,
        _rp: ")",
        _sep: ":",
    };

    it("save methods in class", () => {
        class SaveMethodsFromClass extends MatchingMachine {

            public matches: PatternMatch[] = [];

            constructor() {
                super(pyClass, pyClass);
            }

            protected onMatch(pm: PatternMatch): any {
                this.matches.push(pm);
                return pyMethod;
            }

            protected observeMatch(pm: PatternMatch) {
                this.matches.push(pm);
                return pyMethod;
            }
        }

        const input = `
class Moon:
    def call(self):
        print("hello")

    def land(self):
        print("bing")

class Sun:
    def blowup(self):
        print("boom")
`;
        const mm = new SaveMethodsFromClass();
        mm.consume(input);

        const moonClass = mm.matches[0] as any;
        assert(moonClass.name === "Moon", "Moon class should have a name");

        const moonMethod1 = mm.matches[1] as any;
        assert(moonMethod1.name === "call", "Name should be call");

        const moonMethod2 = mm.matches[2] as any;
        assert(moonMethod2.name === "land", "Name should be land");

        const sunClass = mm.matches[3] as any;
        assert(sunClass.name === "Sun", "Name should be Sun");

        assert(mm.matches.length === 5);
        const sunMethod1 = mm.matches[4] as any;
        assert(sunMethod1.name === "blowup", "Name should be blowup");
    });

    it("track XML structure without dependencyManagement", () => {
        parsePomWithTracker(POM_WITHOUT_DEPENDENCY_MANAGEMENT);
    });

    it("track XML structure without dependencyManagement", () => {
        parsePomWithTracker(POM_WITH_DEPENDENCY_MANAGEMENT);
    });

    it("track XML structure with dependencyManagement with excludes", () => parsePomWithTracker(
        POM_WITH_DEPENDENCY_MANAGEMENT.replace(REPLACE_ME, `<exclusions>
				<exclusion>
					<groupId>org.springframework.boot</groupId>
					<artifactId>spring-boot-starter-tomcat</artifactId>
				</exclusion>
			</exclusions>`)));

    const DEPENDENCY = {
        _l: "<",
        _e: "dependency",
        _r: ">",
        _content: takeUntil({
            _l: "</",
            _e: "dependency",
            _r: ">",
        }),
    };

    function parsePomWithTracker(pom: string) {
        const xt = new XmlTracker();
        xt.consume(pom);
        assert(xt.dependencies.length === 1);
        assert(xt.dependencies[0].group === "com.foo.bar");
    }
});

export class XmlTracker extends MatchingMachine {

    public dependencies: VersionedArtifact[] = [];

    public elementStack: string[] = [];

    private group: string;
    private artifact: string;
    private version: string;

    constructor() {
        super(XML_TAG_WITH_SIMPLE_VALUE, {
            _l: "<",
            slash: optional("/"),
            name: LEGAL_VALUE,
            _r: ">",
        });
    }

    protected underOneOf(...elts: string[]) {
        return elts.filter(elt => this.elementStack.indexOf(elt) > -1).length > 0;
    }

    protected path() {
        return this.elementStack.join("/");
    }

    protected onMatch(pm: PatternMatch & XmlTag) {
        // console.log(pm.name + " [" + this.elementStack.join("/") + "]");
        if (this.elementStack.indexOf("dependencies") > -1 &&
            !this.underOneOf("dependencyManagement", "plugin", "pluginManagement", "exclusions")) {
            // We're building a dependency

            // console.log(`**** found ${pm.name} under [${this.path()}]`)

            switch (pm.name) {
                case "groupId":
                    this.group = pm.value;
                    break;
                case "artifactId":
                    this.artifact = pm.value;
                    break;
                case "version":
                    this.version = pm.value;
                    break;
                default:
            }
        }
        return this.matcher;
    }

    protected observeMatch(pm: { name: string, slash }) {
        if (pm.slash) {
            this.elementStack.pop();
            if (pm.name === "dependency") {
                if (this.group && this.artifact) {
                    const va = new GAV(this.group, this.artifact, this.version);
                    this.dependencies.push(va);
                    this.group = this.artifact = this.version = undefined;
                }
            }
        } else {
            this.elementStack.push(pm.name);
        }
        return this.matcher;
    }
}

export const POM_WITHOUT_DEPENDENCY_MANAGEMENT = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example</groupId>
	<artifactId>multi</artifactId>
	<version>0.1.0</version>
	<packaging>jar</packaging>

	<name>multi</name>
	<description>Multi project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.3.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>

		<dependency>
			<groupId>com.foo.bar</groupId>
			<artifactId>foobar</artifactId>
			<version>1.0.0</version>
		</dependency>

	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
	    	<plugin>
		    	<groupId>group</groupId>
		    	<artifactId>art</artifactId>
		    	<version>1.0.1</version>
		    </plugin>

		</plugins>
	</build>

</project>
`;

export const REPLACE_ME = "<!-- -->";

export const ADD_DEPENDENCY = "<!-- dep -->";

export const POM_WITH_DEPENDENCY_MANAGEMENT = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example</groupId>
	<artifactId>multi</artifactId>
	<version>0.1.0</version>
	<packaging>jar</packaging>

	<name>multi</name>
	<description>Multi project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.3.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-framework-bom</artifactId>
                <version>4.3.8.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

	<dependencies>

		<dependency>
			<groupId>com.foo.bar</groupId>
			<artifactId>foobar</artifactId>
			<version>1.0.0</version>
			${REPLACE_ME}
		</dependency>

        ${ADD_DEPENDENCY}

	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
	    	<plugin>
		    	<groupId>group</groupId>
		    	<artifactId>art</artifactId>
		    	<version>1.0.1</version>
		    </plugin>

		</plugins>
	</build>

</project>
`;
