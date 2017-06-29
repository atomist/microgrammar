import assert = require("power-assert");

import { canonicalize } from "../../src/java/JavaUtils";

describe("canonicalize", () => {

    it("shouldn't change when no comments or whitespace", () => {
        const src =
            `public class Foo{}`;
        const stripped = canonicalize(src);
        assert(stripped === src);
    });

    it("should strip out syntactically unnecessary whitespace: space in {}", () => {
        const src =
            `public class Foo { }`;
        const stripped = canonicalize(src);
        assert(stripped === `public class Foo{}`);
    });

    it("should strip out comments and whitespace", () => {
        const src =
            `// this is a test
            public       class



            Foo { }
            `;
        const expected =
            `public class Foo{}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("should strip out multiple comments and whitespace", () => {
        const src =
            `// this is a test
            public       class

            /*
            and there's lots of // crazy stuff
            // in here
            */

            Foo { }
            `;
        const expected =
            `public class Foo{}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("should strip out multiple multiple comments and whitespace", () => {
        const src =
            `// this is a test
            public       class

            /*
            and there's lots of // crazy stuff
            // in here
            */

            Foo {
                int    i; // something goes here
            }
            `;
        const expected =
            `public class Foo{int i;}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("should strip out multiple multiple comments and whitespace without space before //", () => {
        const src =
            `// this is a test
            public       class

            /*
            and there's lots of // crazy stuff
            // in here
            */

            Foo {
                int    i;// something goes here
            }
            `;
        const expected =
            `public class Foo{int i;}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("should strip out multiple multiple comments and whitespace without space before /*", () => {
        const src =
            `// this is a test
            public/*foo bar */       class

            /*
            and there's lots of // crazy stuff
            // in here
            */

            Foo {
                int    i;// something goes here
            }
            `;
        const expected =
            `public class Foo{int i;}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("ignore /* within //", () => {
        const src =
            `// this is a test
            public       class


           // and there's lots of // crazy stuff /* woeirowieur *//**/


            Foo {
                int    i;// something goes here
                // ignorable junk
            }
            `;
        const expected =
            `public class Foo{int i;}`;
        const stripped = canonicalize(src);
        assert(stripped === expected);
    });

    it("don't strip whitespace inside strings", () => {
        const src =
            `public class Foo{private String="xxx    \t x";}`;
        const stripped = canonicalize(src);
        assert(stripped === src);
    });

    it("isn't fooled by apparent comments within strings", () => {
        const src =
            `public class Foo{private String="xxx       \n\n  // \teiwuiurwieuriwuer /* */   \t x";}`;
        const stripped = canonicalize(src);
        assert(stripped === src);
    });

});
