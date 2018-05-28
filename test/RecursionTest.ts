
import { Microgrammar } from "../src/Microgrammar";
import { Alt, firstOf } from "../src/Ops";

import { fail } from "power-assert";
import { Concat } from "../src/matchers/Concat";
import { isPatternMatch } from "../src/PatternMatch";
import { Integer } from "../src/Primitives";

// TODO recursion is currently hard. This isn't right but
// is a start to try to describe a model we should support
describe("Left recursion", () => {

    const term = Integer;
    let tobeExpression: any = "";
    const expression = {
        expr: firstOf(Concat.of({
            a: tobeExpression,
            _log1: _ => console.log("Matched first inner a: " + _.a),
            _plus: "+",
            _log2: _ => console.log("Matched plus"),
            b: tobeExpression,
            $lazy: true,
        }), term),
    };
    tobeExpression = expression;
    ((expression.expr as Alt).matchers[0] as any)._init();
    const mg = Microgrammar.fromDefinitions(expression);

    it.skip("should match simple term", () => {
        const input = "2";
        const r = mg.exactMatch(input);
        if (isPatternMatch(r)) {
            // assert(r.type.name === "Thing");
            // assert(r.type.param.name === "List");
            // assert(r.type.param.param.name === "That");
        } else {
            fail("No match");
        }
    });

    it.skip("should match complex term", () => {
        const input = "2 + 2";
        const r = mg.exactMatch(input);
        if (isPatternMatch(r)) {
            // assert(r.type.name === "Thing");
            // assert(r.type.param.name === "List");
            // assert(r.type.param.param.name === "That");
        } else {
            fail("No match");
        }
    });

});
