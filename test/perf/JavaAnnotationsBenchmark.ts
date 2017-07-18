import "mocha";
import * as assert from "power-assert";
import { ChangeControlledMethodGrammar } from "../integration/RealWorldTest2";

import { canonicalize } from "../../src/matchers/java/JavaUtils";
import { Microgrammar } from "../../src/Microgrammar";

import { skipTo, takeUntil } from "../../src/matchers/skip/Skip";

describe("Java Benchmark", () => {

    const parseCount = 50;

    const validTargetMethods = 0;

    const randomMethods = 0;

    const invalidMethods = 0;

    const comments = 0;

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
        // src = canonicalize(src);

        for (let i = 0; i < parseCount; i++) {
            const matches = ChangeControlledMethodGrammar.findMatches(src);
            assert(matches.length === 8 + validTargetMethods);
        }
    }).timeout(55000);

});

describe("Break Benchmark", () => {

    const parseCount = 500;

    const validTargetMethods = 0;

    const randomMethods = 0;

    const invalidMethods = 0;

    const comments = 0;

    it("parses break to }", () => parseGrammar({
        _public: "public",
        toFirstRightCurlie: takeUntil("}"),
    })).timeout(55000);

    it("parses break to //", () => parseGrammar({
        _public: "public",
        toFirstRightCurlie: takeUntil("//"),
    })).timeout(55000);

    it("parses break for most of big file", () => parseGrammar({
        _public: "class",
        toFirstRightCurlie: takeUntil("/*eof*/"),
    })).timeout(55000);

    it("parses skipTo for most of big file", () => parseGrammar({
        _public: "class",
        toFirstRightCurlie: skipTo("/*eof*/"),
    })).timeout(55000);

    function parseGrammar(a: {}, commentCount = comments) {
        const g = Microgrammar.fromDefinitions<any>(a);
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
        for (let m = 0; m < commentCount; m++) {
            additional += comment();
        }
        const src = Java1.replace("//placeholder", additional);

        // console.log(`Src length=${src.split("\n").length} lines`);
        // src = canonicalize(src);
        for (let i = 0; i < parseCount; i++) {
            const matches = g.findMatches(src);
            assert(matches.length > 0);
        }
    }

});

const Java1 = `
package com.foo.bar;

import foo.bar;

public class Foo {

    private int i;
    private String dog;

    public Foo() {
    }

    private ignoreMe() {
        this.i = 66;
        this.dog = "Fido";
    }

    @ChangeControlled
    public void foo() {
    }

    @ChangeControlled
    public void bar(@NotMyAnnotation int b) {
        // And here's a comment
        return "here's content";
    }

    private void notAnnotated() {}

    @Thing1
    @Thing2(name = "Tony", pm = false)
    @ChangeControlled
    @RestController(path = "foo")
    @Thing3(magic = false)
    public int compute() {
        return 66;
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void someName(a: int, b: int, c: String) {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void someName2(a: int, b: int, c: String) {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void someName3(a: int, b: int, c: String) {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void someName4(a: int, b: int, c: String) {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void someName5(a: int, b: int, c: String) {
    }

    /*
        The remaining methods are deliberately invalid to force bactracking
        No closing in parameters
    */

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void invalid1(a: int, b: int, c: String {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void invalid2(a: int, b: int, c: String {
    }

    @ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore(i = 12) public void invalid3(a: int, b: int, c: String {
    }

    public void otherContent() {
    }

    // And this is some content

    @Annotation @Annotation2

    /*
        And why don't we finish off with a nice
        long comment that shouldn't need processing,
        but drones on and on and on and on.
    */

    //placeholder

}/*eof*/
`;

function validMethod(n: number) {
    return `
@ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore$(i = 12) public void valid${n}(a: int, b: int, c: String) {
    }`;
}

/**
 * Force backtracking. We only discover it's invalid late on
 * @param n
 * @return {string}
 */
function invalidMethod(n: number) {
    return `
@ChangeControlled("andthis is some crazy value")
    @Other
    @AndMore$(i = 12) public void invalid_${n}(a: int, b: int, c: String) // Invalid
    }`;
}

/**
 * Force backtracking. We only discover it's invalid late on
 * @param n
 * @return {string}
 */
function randomMethod(n: number) {
    return `
@Foo public void random${n}(a: int, b: int, c: String) {
        // We won't need to parse the content of this as it doesn't match the annotation
    }`;
}

function comment() {
    /* tslint:disable:max-line-length */
    return `
/*
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Nunc condimentum quis dui et convallis. Fusce a commodo dui, a euismod tellus.
In tellus mi, rhoncus in rhoncus id, interdum ac nisl. Proin sit amet sem vitae nibh dictum venenatis eget nec purus.
Proin eleifend ullamcorper tincidunt. Nam aliquam sed metus quis maximus.
Curabitur eu lectus facilisis, tincidunt dui non, pulvinar nisl.
Fusce facilisis justo vehicula, sodales nisl nec, dignissim nulla.
Nulla consectetur, augue id ultricies ullamcorper, risus mi molestie felis, eu varius risus leo sit amet massa.
Nullam pharetra massa nec tellus convallis, et condimentum enim scelerisque. Sed id turpis sit amet risus finibus hendrerit.

*/
    `;
}
