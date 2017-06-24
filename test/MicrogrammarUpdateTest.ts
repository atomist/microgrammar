import { expect } from "chai";
import { ChangeSet } from "../src/ChangeSet";
import { Microgrammar } from "../src/Microgrammar";
import { Opt } from "../src/Ops";

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

    it("update name in early element", () => {
        const content = "<first><second>";
        const result = xmlGrammar().findMatches(content) as any;
        // result.matches[0].first.name = "newFirst";
        const cs = new ChangeSet(content);
        cs.change(result[0].first.name$match, "newFirst");
        expect(cs.updated()).to.equal("<newFirst><second>");
    });

    it("update name in late element at start", () => {
        const content = "<first><second>";
        const result = xmlGrammar().findMatches(content) as any;
        const updater = Microgrammar.updateableMatch(result[0], content);
        updater.second = "<newSecond>";
        expect(updater.newContent()).to.equal("<first><newSecond>");
        // result.matches[0].first.name = "newFirst";
        const cs = new ChangeSet(content);
        cs.change(result[0].second.name$match, "newSecond");
        // console.log("CS is " + cs)
        expect(cs.updated()).to.equal("<first><newSecond>");
    });

    it("update multiple elements", () => {
        const content = "<first><second>";
        const result = xmlGrammar().findMatches(content) as any;
        // result.matches[0].first.name = "newFirst";
        const cs = new ChangeSet(content);
        cs.change(result[0].first.name$match, "newFirst");
        cs.change(result[0].second.name$match, "newSecond");
        const updated = cs.updated();
        expect(updated).to.equal("<newFirst><newSecond>");
    });

    it("update multiple elements updated more than once", () => {
        const content = "<first><second>";
        const result = xmlGrammar().findMatches(content) as any;
        const cs = new ChangeSet(content);
        // result.matches[0].first.name = "newFirst";
        cs.change(result[0].first.name$match, "newFirst");
        cs.change(result[0].second.name$match, "newSecond");
        cs.change(result[0].second.name$match, "newerSecond");
        const updated = cs.updated();
        expect(updated).to.equal("<newFirst><newerSecond>");
    });

});
