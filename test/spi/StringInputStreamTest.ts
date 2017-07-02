import { StringInputStream } from "../../src/spi/StringInputStream";

import * as assert from "power-assert";

describe("StringInputStream", () => {

    it("works when empty", () => {
        const si = new StringInputStream("");
        assert(si.exhausted());
    });

    it("works with 1 character", () => {
        const si = new StringInputStream("a");
        assert(!si.exhausted());
        assert(si.offset === 0);
        const read = si.read(10);
        assert(read === "a");
        assert(si.offset === 1);
        assert(si.exhausted());
    });

});
