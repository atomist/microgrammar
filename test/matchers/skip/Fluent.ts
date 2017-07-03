import { Microgrammar } from "../../../src/Microgrammar";
import { Alt } from "../../../src/Ops";

import * as assert from "power-assert";
import { yadaYadaThen, yadaYadaThenThisButNotThat } from "../../../src/matchers/skip/Skip";

describe("fluent builder", () => {

    const desirable = Microgrammar.fromDefinitions({
        beast: new Alt("dog", "cat", "pig"),
        activity: yadaYadaThenThisButNotThat("spa", "shoplifting"),
        last: yadaYadaThen("happiness"),
    });

    it("yada yada is acceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell spa and then happiness , perhaps") as any;
        assert(m);
        assert(m.beast === "pig");
        assert(m.activity === "spa");
        assert(m.last === "happiness");
    });

    it("yada yada is unacceptable", () => {
        const m = desirable.firstMatch("bad pig whatever the hell shoplifting spa and then happiness , perhaps") as any;
        assert(!m);
    });

    // const depsGrammar = Microgrammar.fromDefinitions<VersionedArtifact>({
    //     _startElt: yadaYadaThenThisButNotThat("<dependency>", "<dependencyManagement>"),
    //         ...GAV_CONCAT,
    //     _bind: ctx => {
    //         console.log("GAV = " + JSON.stringify(ctx))
    //         return ctx.dependency = asVersionedArtifact(ctx.tags);
    //     }
    // });
    //
    // it("handles XML path", () => {
    //     const pom = POM_WITH_DEPENDENCY_MANAGEMENT;
    //
    //     const deps = depsGrammar.findMatches(pom);
    //     assert(deps.length === 1);
    //     assert(deps[0].group === "com.foo.bar");
    // });

});
