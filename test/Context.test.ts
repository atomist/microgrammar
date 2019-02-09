import * as assert from "assert";
import { inputStateFromString } from "../lib/internal/InputStateFactory";
import { Concat } from "../lib/matchers/Concat";
import { Microgrammar } from "../lib/Microgrammar";

import { isSuccessfulMatchReport } from "../lib/MatchReport";
import {
    Integer,
    LowercaseBoolean,
} from "../lib/Primitives";

describe("Context", () => {

    it("binds calculation", () => {
        const cc = Concat.of({
            a: Integer,
            b: Integer,
            sum: ctx => ctx.a + ctx.b,
        });
        const mr = cc.matchPrefixReport(inputStateFromString("24 7"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.a === 24);
            assert(matched.b === 7);
            assert(matched.sum === 24 + 7);
        } else {
            assert.fail("Did not match");
        }
    });

    it("doesn't veto match based on false calculation", () => {
        const cc = Concat.of({
            a: Integer,
            b: Integer,
            willBeFalse: ctx => typeof ctx.a === "string",
            sum: ctx => ctx.a + ctx.b,
        });
        const mr = cc.matchPrefixReport(inputStateFromString("24 7"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.a === 24);
            assert(matched.b === 7);
            assert(matched.sum === 24 + 7);
        } else {
            assert.fail("Did not match");
        }
    });

    it("binds calculation to returned value", () => {
        const cc = Concat.of({
            a: Integer,
            b: Integer,
            sum: ctx => ctx.a + ctx.b,
        });
        const mr = cc.matchPrefixReport(inputStateFromString("24 7"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.a === 24);
            assert(matched.b === 7);
            assert(matched.sum === 24 + 7);
        } else {
            assert.fail("Did not match");
        }
    });

    it("rewrites property using separate function", () => {
        const cc = Concat.of({
            a: Integer,
            b: /[0-9]+/,
            _rework(ctx) {
                ctx.b = parseInt(ctx.b, 10);
            },
        });
        const mr = cc.matchPrefixReport(inputStateFromString("24 7"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.a === 24);
            assert(matched.b === 7);
        } else {
            assert.fail("Did not match");
        }
    });

    it("rewrites property using transformation", () => {
        const cc = Concat.of({
            a: Integer,
            stringB: /[0-9]+/,
            b: ctx => parseInt(ctx.stringB, 10),
        });
        const mr = cc.matchPrefixReport(inputStateFromString("24 7"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.a === 24);
            assert(matched.b === 7);
        } else {
            assert.fail("Did not match");
        }
    });

    it("use function to dictate match", () => {
        const cc = Concat.of({
            flag: LowercaseBoolean,
            _done(ctx) {
                return ctx.flag;
            },
            b: Integer,
            c: Integer,
        });
        const matched = cc.matchPrefixReport(inputStateFromString("true 7 35"), {}, {});
        assert(isSuccessfulMatchReport(matched));
        const matched2 = cc.matchPrefixReport(inputStateFromString("false 7 35"), {}, {});
        assert(!isSuccessfulMatchReport(matched2));
    });

    it("handles nested matches", () => {
        const cc = Concat.of({
            nested: {
                name: /[a-z]+/,
            },
            promote(ctx) {
                ctx.promoted = ctx.nested.name;
            },
            b: Integer,
            c: Integer,
        });
        const mr = cc.matchPrefixReport(inputStateFromString("gary 7 35"), {}, {});
        if (isSuccessfulMatchReport(mr)) {
            const matched = mr.toValueStructure() as any;
            assert(matched.promoted === "gary");
        } else {
            assert.fail("Did not match");
        }
    });

    it("handles multiple bound matches in microgrammar", () => {
        const cc = Microgrammar.fromDefinitions({
            nested: {
                name: /[a-z]+/,
            },
            promoted: ctx => ctx.nested.name,
            b: Integer,
            c: Integer,
        });
        const matches = cc.findMatches("gary 7 35 &&&&WERw7erw7 elizabeth 7 48") as any[];
        assert(matches.length === 2);
        assert(matches[0].promoted === "gary");
        assert(matches[1].promoted === "elizabeth");
    });

    it("doesn't pollute parent context in microgrammar", () => {
        const cc = Microgrammar.fromDefinitions({
            nested: {
                name: /[a-z]+/,
                shouty: ctx => ctx.name.toLocaleUpperCase(),
            },
            b: Integer,
            c: Integer,
        });
        const matches = cc.findMatches("gary 7 35 &&&&WERw7erw7 elizabeth 7 48") as any[];
        assert(matches.length === 2);
        assert(matches[0].shouty === undefined);
        assert(matches[1].shouty === undefined);
    });

    it("handles nested bound matches in microgrammar", () => {
        const cc = Microgrammar.fromDefinitions({
            nested: {
                name: /[a-z]+/,
                shouty: ctx => ctx.name.toLocaleUpperCase(),
            },
            b: Integer,
            c: Integer,
        });
        const matches = cc.findMatches("gary 7 35 &&&&WERw7erw7 elizabeth 7 48") as any[];
        assert(matches.length === 2);
        assert(matches[0].nested.shouty === "GARY");
        assert(matches[1].nested.shouty === "ELIZABETH");
    });

    it("can change previously bound match", () => {
        const cc = Microgrammar.fromDefinitions({
            name: /[a-z]+/,
            b: Integer,
            c: Integer,
            _undo: ctx => ctx.name = "marmaduke",
        });
        const matches = cc.findMatches("gary 7 35 &&&&WERw7erw7 elizabeth 7 48") as any[];
        assert.strictEqual(matches.length, 2);
        assert.strictEqual(matches[0].name, "marmaduke");
    });

    // TODO this seems to be really strange behavior, but we can work around it for now in users
    it.skip("can undefine previously bound match", () => {
        const cc = Microgrammar.fromDefinitions({
            name: /[a-z]+/,
            b: Integer,
            c: Integer,
            _undo: ctx => {
                assert(ctx.name);
                ctx.name = undefined;
                assert(!ctx.name);
            },
        });
        const matches = cc.findMatches("gary 7 35 &&&&WERw7erw7 elizabeth 7 48") as any[];
        assert(matches.length === 2);
        assert(matches[0].name === undefined);
    });

});
