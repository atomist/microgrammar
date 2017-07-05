import { inputStateFromString } from "../src/internal/InputStateFactory";
import { isPatternMatch, PatternMatch } from "../src/PatternMatch";
import { Rep, Rep1, Rep1Sep, RepSep } from "../src/Rep";
import { LEGAL_VALUE } from "./MavenGrammars";

import { Alt, Opt } from "../build/src/Ops";
import { Microgrammar } from "../src/Microgrammar";
import { RealWorldPom } from "./Fixtures";

import * as assert from "power-assert";

describe("Rep", () => {

    it("rep(0) should match 0 when matcher doesn't match", () => {
        const rep = new Rep("A");
        const is = inputStateFromString("friday 14");
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
        // expect(is.peek(2)).to.equal(m.$resultingInputState.peek(2));
    });

    it("rep(1) should NOT match 0 when matcher doesn't match", () => {
        const rep = new Rep1("A");
        const is = inputStateFromString("friday 14");
        const m = rep.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    it("should match when matcher matches once", () => {
        const rep = new Rep("A");
        const is = inputStateFromString("And there was light!");
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("repsep should match when matcher matches once", () => {
        const rep = new RepSep("A", "abcd");
        const is = inputStateFromString("And there was light!");
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("rep matches several times", () => {
        const rep = new Rep(/^[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === toMatch);
    });

    it("rep does not match several times when not ignoring whitespace", () => {
        const rep = new Rep(/^[a-zA-Z]+/).withConfig({ consumeWhiteSpaceBetweenTokens: false });
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === "And");
    });

    it("can extract data after rep matches several times", () => {
        const rep = new Rep(/^[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {}) as PatternMatch;
        assert(m.$value.length === 4);
    });

    it("repsep matches several times", () => {
        const rep = new RepSep(/^[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === toMatch);
    });

    it("rep1sep matches several times", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
        assert((m as PatternMatch).$matched === toMatch);
    });

    it("rep1sep matches once", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "And";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(isPatternMatch(m));
    });

    it("rep1sep does not match zero times", () => {
        const rep = new Rep1Sep(/^[a-zA-Z]+/, ",");
        const toMatch = "16And";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {});
        assert(!isPatternMatch(m));
    });

    it("Maven property", () => {
        const rep = new Rep(property);
        const toMatch = `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
		<my.version>1.1.2-SNAPSHOT</my.version>
	</properties>
        `;
        const is = inputStateFromString(toMatch);
        const m = rep.matchPrefix(is, {}) as PatternMatch;
        assert(isPatternMatch(m));
        assert(m.$value.length === 3);
    });

    it.skip("should not infinite loop", () => {
        const mgDependency = Microgrammar.fromDefinitions({
            _dependencyTag: "<dependency>",
            gav: new Rep(new Alt(
                {
                    _groupIdOpeningTag: "<groupId>",
                    groupId: "com.krakow",
                    _groupIdClosingTag: "</groupId>",
                },
                {
                    _artifactIdOpeningTag: "<artifactId>",
                    artifactId: "lib1",
                    _artifactIdClosingtag: "</artifactId>",
                },
                new Opt({
                    _versionOpeningTag: "<version>",
                    version: "0.1.1",
                    _versionClosingtag: "</version>",
                }),
            )),
            _close: "</dependency>",
        });
        const m = mgDependency.firstMatch(RealWorldPom);
        assert(m);
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
