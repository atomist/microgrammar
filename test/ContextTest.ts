import * as assert from "power-assert";
import { Concat } from "../src/Concat";
import { InputState } from "../src/InputState";
import { Microgrammar } from "../src/Microgrammar";
import { isPatternMatch } from "../src/PatternMatch";
import { Integer, LowercaseBoolean } from "../src/Primitives";

describe("ContextTest", () => {

    it("binds calculation to context", () => {
        const cc = new Concat({
            a: Integer,
            b: Integer,
            sum: ctx => ctx.a + ctx.b,
        });
        const matched: any = cc.matchPrefix(InputState.fromString("24 7"), {});
        assert(matched.a === 24);
        assert(matched.b === 7);
        assert(matched.$context.sum === 24 + 7);
    });

    it("doesn't veto match based on false calculation", () => {
        const cc = new Concat({
            a: Integer,
            b: Integer,
            willBeFalse: ctx => typeof ctx.a === "string",
            sum: ctx => ctx.a + ctx.b,
        });
        const matched: any = cc.matchPrefix(InputState.fromString("24 7"), {});
        assert(matched.a === 24);
        assert(matched.b === 7);
        assert(matched.$context.sum === 24 + 7);
    });

    it("binds calculation to returned value", () => {
        const cc = new Concat({
            a: Integer,
            b: Integer,
            sum: ctx => ctx.a + ctx.b,
        });
        const matched: any = cc.matchPrefix(InputState.fromString("24 7"), {});
        assert(matched.a === 24);
        assert(matched.b === 7);
        assert(matched.sum === 24 + 7);
    });

    it("rewrites property using separate function", () => {
        const cc = new Concat({
            a: Integer,
            b: /[0-9]+/,
            _rework(ctx) { ctx.b = parseInt(ctx.b, 10); },
        });
        const matched: any = cc.matchPrefix(InputState.fromString("24 7"), {});
        assert(matched.a === 24);
        assert(matched.$context.b === 7);
    });

    it("rewrites property using transformation", () => {
        const cc = new Concat({
            a: Integer,
            b: [/[0-9]+/, b => parseInt(b, 10)],
        });
        const matched: any = cc.matchPrefix(InputState.fromString("24 7"), {});
        assert(matched.a === 24);
        assert(matched.$context.b === 7);
    });

    it("use function to dictate match", () => {
        const cc = new Concat({
            flag: LowercaseBoolean,
            _done(ctx) { return ctx.flag; },
            b: Integer,
            c: Integer,
        });
        const matched = cc.matchPrefix(InputState.fromString("true 7 35"), {});
        assert(isPatternMatch(matched));
        const matched2 = cc.matchPrefix(InputState.fromString("false 7 35"), {});
        assert(!isPatternMatch(matched2));
    });

    it("handles nested matches", () => {
        const cc = new Concat({
            nested: {
                name: /^[a-z]+/,
            },
            promote(ctx) { ctx.promoted = ctx.nested.name; },
            b: Integer,
            c: Integer,
        });
        const matched = cc.matchPrefix(InputState.fromString("gary 7 35"), {});
        assert(isPatternMatch(matched));
        assert((matched.$context as any).promoted === "gary");
    });

    it("handles multiple bound matches in microgrammar", () => {
        const cc = Microgrammar.fromDefinitions({
            nested: {
                name: /^[a-z]+/,
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
                name: /^[a-z]+/,
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
                name: /^[a-z]+/,
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

});
