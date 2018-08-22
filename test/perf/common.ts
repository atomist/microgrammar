/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const Java1 = `
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

export function validMethod(n: number) {
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
export function invalidMethod(n: number) {
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
export function randomMethod(n: number) {
    return `
@Foo public void random${n}(a: int, b: int, c: String) {
        // We won't need to parse the content of this as it doesn't match the annotation
    }`;
}

export function comment() {
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
