import assert = require("power-assert");

import { CFamilyLangHelper } from "../../../../lib/matchers/lang/cfamily/CFamilyLangHelper";

describe("Whitespace stripping", () => {

    it("shouldn't change when no whitespace", () => {
        const src =
            `public class Foo{}`;
        const stripped = new CFamilyLangHelper().stripWhitespace(src);
        assert.strictEqual(stripped , src);
    });

    it("should strip leading newline", () => {
        const src =
            `public class Foo{}`;
        const stripped = new CFamilyLangHelper().stripWhitespace("\n" + src);
        assert.strictEqual(stripped , src);
    });

    it("should strip leading tabs and drop trailing newline", () => {
        const src =
            `public class Foo{}`;
        const stripped = new CFamilyLangHelper().stripWhitespace("\t\t" + src + "\n");
        assert.strictEqual(stripped , src);
    });

    it("should replace 3 unnecessary spaces with none", () => {
        const src =
            `public class Foo {    }`;
        const stripped = new CFamilyLangHelper().stripWhitespace(src);
        assert.strictEqual(stripped , "public class Foo{}");
    });

});
