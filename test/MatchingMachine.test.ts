import assert = require("power-assert");

import { MatchingLogic } from "../lib/Matchers";
import { MatchingMachine } from "../lib/Microgrammar";
import { PatternMatch } from "../lib/PatternMatch";
import {
    POM_WITH_DEPENDENCY_MANAGEMENT,
    POM_WITHOUT_DEPENDENCY_MANAGEMENT,
    REPLACE_ME,
    XmlTracker,
} from "./xml";

describe("MatchingMachine", () => {

    it("save only when we're happy", () => {
        class SaveEverySecondMatch extends MatchingMachine {

            public matches: PatternMatch[] = [];

            private count = 0;

            constructor() {
                super({
                    name: /[A-Z][a-z]+/,
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
        assert.deepEqual(result, ["Nicolas", "Emmanuel"]);
    });

    it("save first word then numbers only", () => {
        class SaveWordAndNumbers extends MatchingMachine {

            public matches: PatternMatch[] = [];

            constructor() {
                super({
                    name: /[A-Za-z]+/,
                });

            }

            protected onMatch(pm: PatternMatch): any {
                this.matches.push(pm);
                return {
                    number: /[0-9]+/,
                };
            }
        }

        const input = "Nicolas Francois 1234 Vladimir";
        const mm = new SaveWordAndNumbers();
        mm.consume(input);
        const result = mm.matches.map(m => m.$matched);
        assert.deepEqual(result, ["Nicolas", "1234"]);
    });

    const pyClass = {
        _class: "class",
        name: /[A-Za-z]+/,
        _sep: ":",
    };

    const pyMethod = {
        _def: "def",
        name: /[a-z]+/,
        _lp: "(",
        args: /[^)]*/,
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
        assert.strictEqual(moonClass.name, "Moon", "Moon class should have a name");

        const moonMethod1 = mm.matches[1] as any;
        assert.strictEqual(moonMethod1.name, "call", "Name should be call");

        const moonMethod2 = mm.matches[2] as any;
        assert.strictEqual(moonMethod2.name, "land", "Name should be land");

        const sunClass = mm.matches[3] as any;
        assert.strictEqual(sunClass.name, "Sun", "Name should be Sun");

        assert.strictEqual(mm.matches.length, 5);
        const sunMethod1 = mm.matches[4] as any;
        assert.strictEqual(sunMethod1.name, "blowup", "Name should be blowup");
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

    function parsePomWithTracker(pom: string) {
        const xt = new XmlTracker();
        xt.consume(pom);
        assert.strictEqual(xt.dependencies.length, 1);
        assert.strictEqual(xt.dependencies[0].group, "com.foo.bar");
    }

    it("captures correct offsets for observed matches", () => {
        class SaveMethodsFromClass extends MatchingMachine {

            public bars: PatternMatch[] = [];

            constructor() {
                super("foo", "bar");
            }

            protected observeMatch(pm: PatternMatch) {
                this.bars.push(pm);
                return this.matcher;
            }
        }

        const input = "foo -bar foo foo foo bar foo bar baz";
        const mm = new SaveMethodsFromClass();
        mm.consume(input);
        assert.strictEqual(mm.bars.length, 3);
        let lastOffset = -1;
        mm.bars.forEach(pm => {
            assert.strictEqual(pm.$value, "bar");
            assert.strictEqual(input.substring(pm.$offset, pm.$offset + 3), "bar");
            assert(pm.$offset !== lastOffset);
            lastOffset = pm.$offset;
        });
    });
});
