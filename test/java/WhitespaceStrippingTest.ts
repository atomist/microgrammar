import assert = require("power-assert");

import { stripWhitespace } from "../../src/java/JavaBody";

describe("Whitespace stripping", () => {

    it("shouldn't change when no whitespace", () => {
        const src =
            `public class Foo { }`;
        const stripped = stripWhitespace(src);
        assert(stripped === src);
    });

    it("should replace leading newline with single space", () => {
        const src =
            `public class Foo { }`;
        const stripped = stripWhitespace("\n" + src);
        assert(stripped === " " + src);
    });

    it("should replace leading newlines with single space", () => {
        const src =
            `public class Foo { }`;
        const stripped = stripWhitespace("\n\n" + src);
        assert(stripped === " " + src);
    });

    it("should replace leading tabs with single space", () => {
        const src =
            `public class Foo { }`;
        const stripped = stripWhitespace("\t\t" + src + "\n");
        assert(stripped === " " + src + " ");
    });

    it("should replace 3 spaces with single space", () => {
        const src =
            `public class Foo {    }`;
        const stripped = stripWhitespace(src);
        assert(stripped === "public class Foo { }");
    });

});
