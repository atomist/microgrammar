import "mocha";
import { Microgrammar } from "../build/src/Microgrammar";

import * as assert from "power-assert";

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
            $id: "elt",
            lx: "<",
            name: {
                name: /[a-zA-Z0-9]+/,
            },
            rx: ">",
        });
        const result = mg.findMatches(content);

        // console.log("Result is " + JSON.stringify(result));
        assert(result.length === 1);
        const r0 = result[0] as any;
        for (const prop in r0) {
            console.log(r0[prop]);
            console.log(`Name is ${prop}`);
            console.log(JSON.stringify(r0[prop]));

        }

        const stringified = JSON.stringify(r0);
        assert(stringified.indexOf("$resultingInputState") === -1);
        assert(stringified.length < 1500);
    });

});
