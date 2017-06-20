import assert = require("power-assert");

import { stripComments, stripWhitespace } from "../../src/java/JavaBody";

describe("Comment stripping", () => {

    it("shouldn't change when no comments", () => {
        const src =
            `
            public class Foo { }
            `;
        const stripped = stripComments(src);
        assert(stripped === src);
    });

    it("should strip out trailing comment", () => {
        const comment = "// this is a test";
        const block =
            `public class Foo { }
            `;
        const src = comment + "\n" + block;
        const stripped = stripComments(src);
        assert(stripped === src.replace(comment, ""));
    });

    it("should strip multiple lines of // comments", () => {
        const comment1 = "// this is a test";
        const comment2 = "// this is another test";
        const block =
            `public class Foo { }
            `;
        const src = comment1 + "\n" + comment2 + "\n" + block;
        const stripped = stripComments(src);
        assert(stripped === src.replace(comment1, "").replace(comment2, ""));
    });

    it("should strip out C style comment on one line", () => {
        const comment = "/* this is a test */";
        const block =
            `public class Foo { }
            `;
        const src = comment + "\n" + block;
        const stripped = stripComments(src);
        assert(stripped === src.replace(comment, ""));
    });

    it("should strip C style comment on multiple lines", () => {
        const comment =
            `/* this is a test
            and i like this
            even more */`;
        const block =
            `public class Foo { }
            `;
        const src = comment + "\n" + block;
        const stripped = stripComments(src);
        assert(stripped === src.replace(comment, ""));
    });

    it("should handle Javadoc comment", () => {
        const comment =
            `/** this is a test
             * and i like this
            * even more */`;
        const block =
            `public class Foo { }
            `;
        const src = comment + "\n" + block;
        const stripped = stripComments(src);
        assert(stripped === src.replace(comment, ""));
    });

    it("should handle comments in parameters", () => {
        const comment = `// this is one`;
        const src =
            `public class Foo(
            int a ${comment}
            ) { }
            `;
        const stripped = stripComments(src);
        assert(stripped.charAt(0) === "p");
        assert(stripped.charAt(stripped.length - 1) === src.charAt(src.length - 1));
        const expected = src.replace(comment, "");
        assert(stripWhitespace(stripped) === stripWhitespace(expected), "\n" + stripped + "\n" + expected);
    });

});
