import { isSuccessfulMatch } from "../../lib/MatchPrefixResult";
import { Microgrammar } from "../../lib/Microgrammar";
import { Opt } from "../../lib/Ops";

import * as assert from "power-assert";

import { applyChanges, toUpdatableStructure } from "../../lib/internal/matchReport/updatableStructure";
import { Integer } from "../../lib/Primitives";
import { RepSep } from "../../lib/Rep";

describe("MicrogrammarUpdateTest", () => {

    function xmlGrammar() {
        const element = {
            lx: "<",
            name: /[a-zA-Z0-9]+/,
            rx: ">",
        };
        return Microgrammar.fromDefinitions({
            first: element,
            second: new Opt(element),
        });
    }

    interface XmlNode {
        first: string;
        second?: string;
    }

    it("update name in late element at start", () => {
        const content = "<first><second>";
        const result: XmlNode[] = iterateIntoArray(xmlGrammar().matchReportIterator(content))
            .map(s => toUpdatableStructure<XmlNode>(s)); // the type specification will move to matchReportIterator
        const updatableStructure = result[0];
        updatableStructure.second = "<newSecond>";
        assert.strictEqual(applyChanges([updatableStructure], content), "<first><newSecond>");
        // we also want to be able to get the deltas. Check those
    });
    // also test updating an opt that wasn't there :-)

    it("update nested element", () => {
        const person = Microgrammar.fromDefinitions({
            name: /[a-zA-Z0-9]+/,
            address: {
                number: Integer,
                street: /[a-zA-Z0-9]+/,
                _comma: ",",
                suburb: /[a-zA-Z0-9]+/,
            },
        });
        const line = "Jenny 46 Coonamble, Mosman";

        const result = person.findMatches(line) as any;
        const updater = Microgrammar.updatableMatch(result[0], line);
        updater.address.number = 45;
        const firstUpdate = updater.newContent();
        assert.strictEqual(firstUpdate, line.replace("46", "45"));
        updater.name = "Jackson";
        const secondUpdate = updater.newContent();
        assert.strictEqual(secondUpdate, firstUpdate.replace("Jenny", "Jackson"));
    });

    it("update deeply nested element", () => {
        const person = Microgrammar.fromDefinitions({
            name: /[a-zA-Z0-9]+/,
            address: {
                number: Integer,
                street: /[a-zA-Z0-9]+/,
                _comma: ",",
                suburb: {
                    name: /[a-zA-Z0-9]+/,
                    postcode: Integer,
                    country: {
                        code: /[A-Z]{2}/,
                    },
                },
            },
        });
        const line = "Jenny 46 Coonamble, Chatswood 2067 AU";
        const result = person.findMatches(line) as any;
        assert.strictEqual(result[0].address.suburb.country.code, "AU");
        const updater = Microgrammar.updatableMatch(result[0], line);
        updater.address.number = 45;
        const firstUpdate = updater.newContent();
        assert.strictEqual(firstUpdate, line.replace("46", "45"));
        updater.name = "Jackson";
        const secondUpdate = updater.newContent();
        assert.strictEqual(secondUpdate, firstUpdate.replace("Jenny", "Jackson"));
        updater.address.suburb.country.code = "CA";
        assert.strictEqual(updater.newContent(), secondUpdate.replace("AU", "CA"));
    });

    it("update multiple deeply nested elements in succession", () => {
        const person = Microgrammar.fromDefinitions({
            name: /[a-zA-Z0-9]+/,
            address: {
                number: Integer,
                street: /[a-zA-Z0-9]+/,
                _comma: ",",
                suburb: {
                    name: /[a-zA-Z0-9]+/,
                    postcode: Integer,
                    country: {
                        code: /[A-Z]{2}/,
                    },
                },
            },
        });
        const line = "Jenny 46 Coonamble, Chatswood 2067 AU/David 12 Somewhere, Someplace 40387 US";
        const results = person.findMatches(line) as any;
        assert.strictEqual(results.length, 2);
        const updatable = Microgrammar.updatable<any>(results, line);
        updatable.matches[0].address.suburb.postcode = "2000";
        assert.strictEqual(updatable.matches[0].address.suburb.postcode, "2000");

        updatable.matches[1].address.suburb.postcode = "1234";
        updatable.matches[0].address.suburb.country.code = "CA";
        assert.strictEqual(updatable.updated(),
            "Jenny 46 Coonamble, Chatswood 2000 CA/David 12 Somewhere, Someplace 1234 US");
    });

    it("can update a whole section", () => {
        const person = Microgrammar.fromDefinitions({
            name: /[a-zA-Z0-9]+/,
            address: {
                number: Integer,
                street: /[a-zA-Z0-9]+/,
                _comma: ",",
                suburb: {
                    name: /[a-zA-Z0-9]+/,
                    postcode: Integer,
                    country: {
                        code: /[A-Z]{2}/,
                    },
                },
            },
        });
        const line = "Jenny 46 Coonamble, Chatswood 2067 AU/David 12 Somewhere, Someplace 40387 US";
        const results = person.findMatches(line) as any;
        assert.strictEqual(results.length, 2);
        const updatable = Microgrammar.updatable<any>(results, line);
        updatable.matches[0].address.suburb = "tarantula";
        assert.strictEqual(updatable.updated(),
            "Jenny 46 Coonamble, tarantula/David 12 Somewhere, Someplace 40387 US");
    });

    it("updating a whole section blocks modifying structure within it", () => {
        const person = Microgrammar.fromDefinitions({
            name: /[a-zA-Z0-9]+/,
            address: {
                number: Integer,
                street: /[a-zA-Z0-9]+/,
                _comma: ",",
                suburb: {
                    name: /[a-zA-Z0-9]+/,
                    postcode: Integer,
                    country: {
                        code: /[A-Z]{2}/,
                    },
                },
            },
        });
        const line = "Jenny 46 Coonamble, Chatswood 2067 AU/David 12 Somewhere, Someplace 40387 US";
        const results = person.findMatches(line);

        assert.strictEqual(results.length, 2);
        const updatable = Microgrammar.updatable<any>(results, line);
        updatable.matches[0].address.suburb = "tarantula";
        // TODO this should work intuitively, but doesn't. Probably address through documentation
        // assert.strictEqual(updatable.matches[0].address.suburb , "tarantula");
        assert.strictEqual(updatable.matches[0].address.suburb.postcode, undefined);
        assert.throws(
            () => updatable.matches[0].address.suburb.postcode = "2067/24");
    });

    // TODO This does not work yet
    it.skip("can update a rep element", () => {
        const input = "I love carrots, apples, lizards, bananas";
        const mg = Microgrammar.fromString("love ${listItems}", {
            listItems: {
                commaSeparated: new RepSep(/[a-z]+/, ","),
            },
        });

        const match: any = mg.firstMatch(input);
        if (isSuccessfulMatch(match)) {
            assert.strictEqual((match as any).listItems.commaSeparated[0], "carrots");

            // how about we also accept a microgrammar as the first arg? ... and all firstMatch on it?
            const updater: any = Microgrammar.updatableMatch(match, input);
            updater.listItems.commaSeparated[0] = "garbage";
            assert.strictEqual(updater.newContent(), "I love garbage, apples, lizards, bananas");

        } else {
            assert.fail("Didn't match");
        }
    });

});

function iterateIntoArray<T>(iterable: Iterable<T>): T[] {
    const output: T[] = [];
    for (const i of iterable) {
        output.push(i);
    }
    return output;
}
