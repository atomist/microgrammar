import * as assert from "power-assert";
import { ChangeControlledMethodGrammar } from "../integration/annotationGrammar";
import {
    comment,
    invalidMethod,
    Java1,
    randomMethod,
    validMethod,
} from "./common";

describe("Java Benchmark", () => {

    const parseCount = 170;

    const validTargetMethods = 100;

    const randomMethods = 100;

    const invalidMethods = 100;

    const comments = 100;

    it("parses annotated methods", () => {
        let additional = "";
        for (let m = 0; m < validTargetMethods; m++) {
            additional += validMethod(m);
        }
        for (let m = 0; m < invalidMethods; m++) {
            additional += invalidMethod(m);
        }
        for (let m = 0; m < randomMethods; m++) {
            additional += randomMethod(m);
        }
        for (let m = 0; m < comments; m++) {
            additional += comment();
        }
        const src = Java1.replace("//placeholder", additional);

        // console.log(`Src length=${src.split("\n").length} lines`);
        // src = new CFamilyLangHelper().canonicalize(src);

        for (let i = 0; i < parseCount; i++) {
            const matches = ChangeControlledMethodGrammar.findMatches(src);
            assert.strictEqual(matches.length , 8 + validTargetMethods);
        }
    }).timeout(55000);

});
