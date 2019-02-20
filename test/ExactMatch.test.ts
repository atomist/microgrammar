import { JavaParenthesizedExpression } from "../lib/matchers/lang/cfamily/java/JavaBody";
import { Microgrammar } from "../lib/Microgrammar";
import { isPatternMatch } from "../lib/PatternMatch";
import { JAVA_IDENTIFIER } from "./integration/annotationGrammar";

import * as assert from "power-assert";
import { isSuccessfulMatch } from "../lib/MatchPrefixResult";

describe("Microgrammar.exactMatch", () => {

    it("parse all content: File matches", () => {
        const content = "public void thing(int i);";
        const mg = Microgrammar.fromDefinitions<{ name: string }>({
            _p: "public",
            type: JAVA_IDENTIFIER,
            name: JAVA_IDENTIFIER,
            params: JavaParenthesizedExpression,
            _semi: ";",
        });
        const result = mg.exactMatch(content);
        if (isPatternMatch(result)) {
            assert(result);
            assert.strictEqual(result.$matched , content);
            assert.strictEqual(result.name , "thing");
        } else {
            assert.fail();
        }
    });

    it("parse all content: pattern match recognized in output", () => {
        const content = "public void";
        const mg = Microgrammar.fromDefinitions<any>({
            _p: "public",
            type: JAVA_IDENTIFIER,
        });
        const result = mg.exactMatch(content);
        assert(isPatternMatch(result));
    });

    it("parse all content: dismatch report recognized in output", () => {
        const content = "not-matchy void";
        const mg = Microgrammar.fromDefinitions<{ type: string }>({
            _p: "public",
            type: JAVA_IDENTIFIER,
        });
        const result = mg.exactMatch(content);
        assert(!isPatternMatch(result));
        if (!isPatternMatch(result)) {
            assert(result.description !== undefined);
        }
    });

    it("parse all content: Fail due to irrelevant content after match", () => {
        const content = "public void thing(int i); // and this is irrelevant crap";
        const mg = Microgrammar.fromDefinitions<any>({
            _p: "public",
            type: JAVA_IDENTIFIER,
            name: JAVA_IDENTIFIER,
            params: JavaParenthesizedExpression,
            _semi: ";",
        });
        const result = mg.exactMatch(content);
        assert(!isSuccessfulMatch(result));
    });

    it("parse all content: Fail due to irrelevant content before match", () => {
        const content = "// and this is irrelevant crap\npublic void thing(int i);";
        const mg = Microgrammar.fromDefinitions<any>({
            _p: "public",
            type: JAVA_IDENTIFIER,
            name: JAVA_IDENTIFIER,
            params: JavaParenthesizedExpression,
            _semi: ";",
        });
        const result = mg.exactMatch(content);
        assert(!isSuccessfulMatch(result));
    });
});
