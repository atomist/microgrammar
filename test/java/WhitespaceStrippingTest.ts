import assert = require("power-assert");

import { stripWhitespace } from "../../src/java/JavaUtils";

describe("Whitespace stripping", () => {

    it("shouldn't change when no whitespace", () => {
        const src =
            `public class Foo{}`;
        const stripped = stripWhitespace(src);
        assert(stripped === src);
    });

    it("should strip leading newline", () => {
        const src =
            `public class Foo{}`;
        const stripped = stripWhitespace("\n" + src);
        assert(stripped === src);
    });

    it("should strip leading tabs and drop trailing newline", () => {
        const src =
            `public class Foo{}`;
        const stripped = stripWhitespace("\t\t" + src + "\n");
        assert(stripped === src);
    });

    it("should replace 3 unecessary spaces with none", () => {
        const src =
            `public class Foo {    }`;
        const stripped = stripWhitespace(src);
        assert(stripped === "public class Foo{}");
    });

});
