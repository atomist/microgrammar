
import * as assert from "power-assert";
import { ADD_DEPENDENCY, POM_WITH_DEPENDENCY_MANAGEMENT, XmlTracker } from "../MatchingMachineTest";

describe("XML Benchmark", () => {

    const parseCount = 1000;

    const addedDependencies = 10;

    const comments = 10;

    it("parses POM", () => {

        let pom = POM_WITH_DEPENDENCY_MANAGEMENT;

        for (let i = 0; i < addedDependencies; i++) {
            const g = "com.someone";
            const a = "art" + i;
            const v = "1.0." + i;
            let toAdd = addedDependency(g, a, v);
            if (i < comments) {
                toAdd += addedComment(i);
            }
            pom = pom.replace(ADD_DEPENDENCY, ADD_DEPENDENCY + "\n" + toAdd + "\n");
        }

        for (let i = 0; i < parseCount; i++) {
            const xt = new XmlTracker();
            xt.consume(pom);
            assert(xt.dependencies.length === 1 + addedDependencies);
        }
    }).timeout(50000);

});

function addedDependency(group: string, artifact: string, version: string) {
    return `
<dependency>
			<groupId>${group}</groupId>
			<artifactId>${artifact}</artifactId>
			<version>${version}</version>
		</dependency>`;
}

function addedComment(n: number) {
    return `<!--
${n} Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Nunc condimentum quis dui et convallis. Fusce a commodo dui, a euismod tellus.
In tellus mi, rhoncus in rhoncus id, interdum ac nisl.
Proin sit amet sem vitae nibh dictum venenatis eget nec purus.
Proin eleifend ullamcorper tincidunt. Nam aliquam sed metus quis maximus.
Curabitur eu lectus facilisis, tincidunt dui non, pulvinar nisl.
Fusce facilisis justo vehicula, sodales nisl nec, dignissim nulla.
Nulla consectetur, augue id ultricies ullamcorper, risus mi molestie felis,
eu varius risus leo sit amet massa.
Nullam pharetra massa nec tellus convallis, et condimentum enim scelerisque.
Sed id turpis sit amet risus finibus hendrerit.
`;
}
