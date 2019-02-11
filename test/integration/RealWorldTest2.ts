import * as assert from "power-assert";
import { inputStateFromString } from "../../lib/internal/InputStateFactory";
import { isSuccessfulMatch } from "../../lib/MatchPrefixResult";
import { Rep } from "../../lib/Rep";
import {
    AnyAnnotation,
    ChangeControlledMethodGrammar,
    GrammarWithOnlyARep,
} from "./annotationGrammar";

describe("AnyAnnotationGrammar", () => {

    it("match valid annotations", () => {
        const src = `@Foo @Bar @Baz("L") @Donkey("24", name = "Eeyore")`;
        const anns = AnyAnnotation.findMatches(src);
        assert.strictEqual(anns.length, 4);
        assert.strictEqual(anns[3].content, `"24", name = "Eeyore"`);
    });

});

describe("ChangeControlledMethodGrammar", () => {

    it("match valid annotations", () => {
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore") public void magic() {}`;
        const methods = ChangeControlledMethodGrammar.findMatches(src);
        assert.strictEqual(methods.length, 1);
        assert.strictEqual(methods[0].annotations.length, 2);
        assert.strictEqual(methods[0].annotations[1].name, "Donkey");
        assert.strictEqual(methods[0].annotations[1].content, `"24", name = "Eeyore"`);
    });

});

describe("GrammarWithOnlyARep", () => {

    it("can handle rep", () => {
        const rep = new Rep(AnyAnnotation);
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore") public void magic() {}`;
        const match = rep.matchPrefix(inputStateFromString(src), {}, {});
        if (isSuccessfulMatch(match)) {
            assert.strictEqual(match.$matched.trim(), `@ChangeControlled @Donkey("24", name = "Eeyore")`);
        } else {
            assert.fail("Didn't match");
        }
    });

    it("match valid annotations with trailing junk", () => {
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore")
        public void magic() {} // and who cares about this`;
        const methods = GrammarWithOnlyARep.findMatches(src);
        assert.strictEqual(methods.length, 1);
        assert.strictEqual(methods[0].annotations.length, 2);
        assert.strictEqual(methods[0].annotations[1].name, "Donkey");
        assert.strictEqual(methods[0].annotations[1].content, `"24", name = "Eeyore"`);
    });

    it("match valid annotations", () => {
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore") public void magic() {}`;
        const methods = GrammarWithOnlyARep.findMatches(src);
        assert.strictEqual(methods.length, 1);
        assert.strictEqual(methods[0].annotations.length, 2);
        assert.strictEqual(methods[0].annotations[1].name, "Donkey");
        assert.strictEqual(methods[0].annotations[1].content, `"24", name = "Eeyore"`);
    });

});
