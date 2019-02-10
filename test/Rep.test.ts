import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";
import { PatternMatch } from "../lib/PatternMatch";
import { atLeastOne, Rep, Rep1, Rep1Sep, RepSep, zeroOrMore } from "../lib/Rep";
import { LEGAL_VALUE } from "./MavenGrammars";

import { Microgrammar } from "../lib/Microgrammar";
import {
    Alt,
    Opt,
} from "../lib/Ops";
import { RealWorldPom } from "./Fixtures";

import * as assert from "power-assert";
import { isSuccessfulMatchReport } from "../lib/MatchReport";
import { Literal } from "../lib/Primitives";

describe("Rep", () => {

    it("zeroOrMore is same as Rep", () => {
        const m = new Literal("Thing");
        assert.deepEqual(zeroOrMore(m), new Rep(m));
    });

    it("atLeastOne is same as Rep1", () => {
        const m = new Literal("Thing");
        assert.deepEqual(atLeastOne(m), new Rep1(m));
    });

    it("rep(0) should match 0 when matcher doesn't match", () => {
        const rep = new Rep("A");
        const is = inputStateFromString("friday 14");
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            // expect(is.peek(2)).to.equal(mmmm.$resultingInputState.peek(2));
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep(1) should NOT match 0 when matcher doesn't match", () => {
        const rep = new Rep1("A");
        const is = inputStateFromString("friday 14");
        const m = rep.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("should match when matcher matches once", () => {
        const rep = new Rep("A");
        const is = inputStateFromString("And there was light!");
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            // good
        } else {
            assert.fail("Didn't match");
        }
    });

    it("repsep should match when matcher matches once", () => {
        const rep = new RepSep("A", "abcd");
        const is = inputStateFromString("And there was light!");
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            // good
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep matches several times", () => {
        const rep = new Rep(/[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, toMatch);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep does not match several times when not ignoring whitespace", () => {
        const rep = new Rep(/[a-zA-Z]+/).consumeWhiteSpace(false);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, "And");
        } else {
            assert.fail("Didn't match");
        }
    });

    it("can extract data after rep matches several times", () => {
        const rep = new Rep(/[a-zA-Z]+/);
        const toMatch = "And there was light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {}, {}) as PatternMatch;
        assert.strictEqual(m.$value.length, 4);
    });

    it("repsep matches several times", () => {
        const rep = new RepSep(/[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, toMatch);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep1sep matches several times", () => {
        const rep = new Rep1Sep(/[a-zA-Z]+/, ",");
        const toMatch = "And,there,was,light";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            assert.strictEqual(m.matched, toMatch);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep1sep matches once", () => {
        const rep = new Rep1Sep(/[a-zA-Z]+/, ",");
        const toMatch = "And";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            const mmmm = m.toPatternMatch();
            assert(!!mmmm);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("rep1sep does not match zero times", () => {
        const rep = new Rep1Sep(/[a-zA-Z]+/, ",");
        const toMatch = "16And";
        const content = toMatch + "!"; // The last char won't match
        const is = inputStateFromString(content);
        const m = rep.matchPrefix(is, {}, {});
        assert(!isSuccessfulMatch(m));
    });

    it("Maven property", () => {
        const rep = new Rep(property);
        const toMatch = `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
		<my.version>1.1.2-SNAPSHOT</my.version>
	</properties>
        `;
        const is = inputStateFromString(toMatch);
        const m = rep.matchPrefixReport(is, {}, {});
        if (isSuccessfulMatchReport(m)) {
            const mmmm = m.toPatternMatch();
            assert.strictEqual(mmmm.$value.length, 3);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("should not infinite loop on rep of opt", () => {
        const mgDependency = Microgrammar.fromDefinitions({
            _dependencyTag: "<dependency>",
            gav: new Rep(
                new Opt({
                    _versionOpeningTag: "<version>",
                    version: "0.1.1",
                    _versionClosingtag: "</version>",
                }),
            ),
            _close: "</dependency>",
        });
        assert.throws(
            () => mgDependency.firstMatch(RealWorldPom),
            m => {
                assert(m.message.indexOf("empty string") !== -1);
                return true;
            });
    });

    it("should not infinite loop on rep of alt with opt", () => {
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
        assert.throws(
            () => mgDependency.firstMatch(RealWorldPom),
            m => {
                assert(m.message.indexOf("empty string") !== -1);
                return true;
            });
    });

});

const property = {
    _gt: "<",
    name: LEGAL_VALUE,
    _close: ">",
    value: /[^<]+/,
    _gt2: "</",
    _closing: LEGAL_VALUE,
    _done: ">",
};
