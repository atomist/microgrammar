import "mocha";

import * as assert from "power-assert";
import { Microgrammar } from "../src/Microgrammar";

describe("stringification", () => {

    it("can JSON stringify microgrammar result", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            $id: "elt",
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        });
        const result = mg.findMatches(content);

        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        const stringified = JSON.stringify(r0);
        assert(stringified.indexOf("$resultingInputState") === -1);
        assert(stringified.length < 1500);
    });

    it("can JSON stringify gloriously nested microgrammar result", () => {
        const content = "<foo>";
        const mg = Microgrammar.fromDefinitions({
            _lx: "<",
            name: {
                name: /[a-zA-Z0-9]+/,
            },
            _rx: ">",
        });
        const result = mg.findMatches(content);

        console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);

        const stringified = JSON.stringify(result[0]);
        assert(stringified.indexOf("$resultingInputState") === -1);
        assert(stringified.length < 1500);
    });

    it("can extract clean data", () => {
        const content = "<foo>";

        const mg = Microgrammar.fromDefinitions<Nested>({
            _lx: "<",
            person: {
                name: /[a-zA-Z0-9]+/,
            },
            _rx: ">",
        });
        const result = mg.findMatches(content);
        const cleanNested: Nested = result[0].matchedStructure<Nested>();
        assert(cleanNested.person.name === "foo");
        assert.deepEqual(cleanNested, { person: { name: "foo" }});
    });

});

interface Nested {

    person: {name: string};
}
