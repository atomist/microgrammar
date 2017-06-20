import assert = require("power-assert");

import { JavaBlock, JavaParenthesizedExpression } from "../../src/java/JavaBody";
import { Microgrammar } from "../../src/Microgrammar";

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

const JAVA_IDENTIFIER = /^[A-Za-z][a-zA-Z0-9]+/;

const METHOD_GRAMMAR = Microgrammar.fromDefinitions<ChangeControledMethod>({
    _visibilityModifier: "public", // TODO make optional
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
