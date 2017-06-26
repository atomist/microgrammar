import {JavaParenthesizedExpression} from "../src/java/JavaBody";
import {Microgrammar} from "../src/Microgrammar";
import {Opt} from "../src/Ops";

import * as assert from "power-assert";
import {JavaBlock} from "../src/java/JavaBody";
import {Rep, Rep1} from "../src/Rep";

describe("AnyAnnotationGrammar", () => {

    it("match valid annotations", () => {
        const src = `@Foo @Bar @Baz("L") @Donkey("24", name = "Eeyore")`;
        const anns = AnyAnnotation.findMatches(src);
        assert(anns.length === 4);
        assert(anns[3].content === `"24", name = "Eeyore"`);
    });

});

describe("ChangeControlledMethodGrammar", () => {

    it("match valid annotations", () => {
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore") public void magic() {}`;
        const methods = ChangeControlledMethodGrammar.findMatches(src);
        assert(methods.length === 1);
        assert(methods[0].annotations.length === 2);
        assert(methods[0].annotations[1].name === "Donkey");
        assert(methods[0].annotations[1].content === `"24", name = "Eeyore"`);
    });

});

describe.skip("GrammarWithOnlyARep", () => {
    // This runs out of memory!
    it("match valid annotations", () => {
        const src = `@ChangeControlled @Donkey("24", name = "Eeyore") public void magic() {}`;
        const methods = GrammarWithOnlyARep.findMatches(src);
        assert(methods.length === 1);
        assert(methods[0].annotations.length === 2);
        assert(methods[0].annotations[1].name === "Donkey");
        assert(methods[0].annotations[1].content === `"24", name = "Eeyore"`);
    });

});

export const JAVA_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;

export const AnyAnnotation = Microgrammar.fromDefinitions<RawAnnotation>({
    _at: "@",
    name: JAVA_IDENTIFIER,
    _content: new Opt(JavaParenthesizedExpression),
    content: ctx => {
        const cont = ctx._content ? ctx._content.block : "";
        console.log("********* Found content " + ctx._content + " for " + ctx.name + ", setting to " + cont);
        return cont;
    },
});

export interface RawAnnotation {

    name: string;

    /**
     * Annotation content (within parentheses, not parsed). May be undefined
     */
    content: string;

}

export const ChangeControlledMethodGrammar = Microgrammar.fromDefinitions<ChangeControlledMethod>({
    annotations: new Rep(AnyAnnotation),
    _check(ctx: any) {
        const found = ctx.annotations.filter(a => a.name === "ChangeControlled");
        if (found.length === 0) {
            return false;
        }
        ctx.changeControlledAnnotation = found;
        return true;
    },
    _visibilityModifier: "public",
    type: JAVA_IDENTIFIER,
    name: JAVA_IDENTIFIER,
    parameterContent: JavaParenthesizedExpression,
    body: JavaBlock,
});

export const GrammarWithOnlyARep = Microgrammar.fromDefinitions<any>({
    annotations: new Rep(AnyAnnotation),
});

export interface ChangeControlledMethod {

    annotations: RawAnnotation[];

    changeControlledAnnotation: RawAnnotation;

    name: string;

    parameterContent: { block: string };

    body: { block: string };

}
