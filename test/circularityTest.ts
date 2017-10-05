import "mocha";
import { Microgrammar } from "../src/Microgrammar";
import { firstOf } from "../src/Ops";
import { JAVA_IDENTIFIER } from "./integration/RealWorldTest2";

import * as assert from "power-assert";
import { fail } from "power-assert";
import { Concat } from "../src/matchers/Concat";
import { isPatternMatch } from "../src/PatternMatch";

describe("Circularity", () => {

    const simpleType = {
        name: JAVA_IDENTIFIER,
    };

    const genericType = {
        name: JAVA_IDENTIFIER,
        _l: "<",
        param: null,    // This will be set later
        _r: ">",
        $lazy: true,
    };

    const genericType2 = Concat.of(genericType);

    const type = firstOf(genericType2, simpleType);
    // Set references
    genericType.param = type;
    assert(!genericType2._initialized);
    genericType2._init();
    assert(genericType2._initialized);

    // Keep the type simple as we don't need full definition
    const typeGrammar = Microgrammar.fromDefinitions<{ type: { name: string, param: any } }>({
        type,
    });

    it("should parse simple type", () => {
        const input = "Thing";
        const r = typeGrammar.exactMatch(input);
        if (isPatternMatch(r)) {
            assert(r.type.name === "Thing");
            assert(!r.type.param);
        } else {
            fail("No match");
        }
    });

    it("should parse generic type", () => {
        const input = "Thing<That>";
        const r = typeGrammar.exactMatch(input);
        if (isPatternMatch(r)) {
            assert(r.type.name === "Thing");
            assert(r.type.param.name === "That");
            assert(!r.type.param.param);
        } else {
            fail("No match");
        }
    });

    it("should parse nested generic type", () => {
        const input = "Thing<List<That>>";
        const r = typeGrammar.exactMatch(input);
        if (isPatternMatch(r)) {
            assert(r.type.name === "Thing");
            assert(r.type.param.name === "List");
            assert(r.type.param.param.name === "That");
        } else {
            fail("No match");
        }
    });

});
