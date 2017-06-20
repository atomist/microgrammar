import assert = require("power-assert");

import {Microgrammar} from "../src/Microgrammar";

const XmlElement = Microgrammar.fromString("<${name}>", {
    name: /[a-zA-Z0-9_]+/,
});
const XmlGrammar = Microgrammar.fromString("${first}${second}", {
    first: XmlElement,
    second: XmlElement,
});

describe("updating matches", () => {
    it("should update a value, one deep", () => {
        const content = "<first><second>";
        const result = XmlGrammar.findMatches(content) as any;
        const updater = Microgrammar.updateableMatch(result[0], content);
        updater.second = "<newSecond>";
        assert(updater.newContent() === "<first><newSecond>");
    });

    it("should update a nested value", () => {
        const content = "<first><second>";
        const result = XmlGrammar.findMatches(content) as any;
        const updater = Microgrammar.updateableMatch(result[0], content);
        updater.second.name = "newSecond";
        assert(updater.newContent() === "<first><newSecond>");
    });

    it("can update the entire match", () => {
        const content = "<first><second>";
        const result = XmlGrammar.findMatches(content) as any;
        const updater = Microgrammar.updateableMatch(result[0], content);
        updater.replaceAll("newSecond");
        assert(updater.newContent() === "newSecond");
    });
});
