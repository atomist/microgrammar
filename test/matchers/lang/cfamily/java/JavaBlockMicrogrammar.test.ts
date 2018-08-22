import assert = require("power-assert");

import { JavaBlock, JavaParenthesizedExpression } from "../../../../../lib/matchers/lang/cfamily/java/JavaBody";
import { Microgrammar } from "../../../../../lib/Microgrammar";

describe("JavaBlock microgrammars", () => {

    it("should match simple block", () => {
        const src =
            `
            public void thing1() {1;}
            `;
        const method = METHOD_GRAMMAR.firstMatch(src);
        assert(method.body.block === "1;");
    });

});

/**
 * Note that these grammars aren't meant to be realistic
 */

const JAVA_IDENTIFIER = /[A-Za-z][a-zA-Z0-9]+/;

const METHOD_GRAMMAR = Microgrammar.fromDefinitions<ChangeControledMethod>({
    _visibilityModifier: "public",
    type: JAVA_IDENTIFIER,
    name: JAVA_IDENTIFIER,
    parameterContent: JavaParenthesizedExpression,
    body: JavaBlock,
    $id: "ccm",
});

interface ChangeControledMethod {

    name: string;

    parameterContent: { block: string };

    body: { block: string };

}
