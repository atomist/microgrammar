import { Concat } from "../Concat";
import { Config, DefaultConfig } from "../Config";
import { Term } from "../Matchers";
import { MatchPrefixResult } from "../MatchPrefixResult";
import { Microgrammar } from "../Microgrammar";
import { isPatternMatch } from "../PatternMatch";
import { Literal, Regex } from "../Primitives";
import { Rep } from "../Rep";

import { Break } from "../matchers/snobol/Break";

import { inputStateFromString } from "./InputStateFactory";

import { RestOfInput } from "../matchers/skip/Skip";

/**
 * Parses microgrammars expressed as strings.
 */
export class MicrogrammarSpecParser {

    private anonFieldCount = 0;

    public fromString<T>(spec: string, components: object = {}, config: Config = DefaultConfig) {
        const componentReference = new Concat({
            $id: "component",
            _start: new Literal("${"),
            componentName: new Regex(/^[a-zA-Z0-9_]+/),
            _end: new Literal("}"),
        } as Term);
        const specGrammar = new Concat({
            $id: "spec",
            these: new Rep(
                new Concat({
                    $id: "literal, then component",
                    literal: new Break(componentReference),
                    component: componentReference,
                } as Term)),
            trailing: RestOfInput,
        });

        const mpr: MatchPrefixResult = specGrammar.matchPrefix(inputStateFromString(spec), {});
        if (!isPatternMatch(mpr)) {
            throw new Error(`Unable to parse microgrammar: ${spec}`);
        }

        // We need to get at its other properties
        const match = mpr as any;
        const definitions = { $id: spec };
        match.these.forEach(t => {
            //    console.log(`Processing literal [${t}]`);
            this.addLiteralDefinitions(definitions, t.literal);
            const reference = t.component.componentName;
            if (components[reference] === undefined) {
                throw new Error(`No definition found for ${reference}`); // consider defaulting to non-greedy-any?
            }
            definitions[reference] = components[reference];
        });
        this.addLiteralDefinitions(definitions, match.trailing);

        const concat = new Concat(definitions, config);

        // console.log("Parsed matcher: " + concat.$id);
        return new Microgrammar<T>(concat, config);
    }

    private addLiteralDefinitions(definitions: any, literal: string) {
        // TODO why, if we don't put this in, does it fail at runtime in Nashorn?
        // it gets TypeError: literal.split is not a function
        if (typeof literal === "string") {
            literal.split(/\s/).forEach(token => {
                if (token.length > 0) {
                    const arbName = `_${this.anonFieldCount++}`;
                    definitions[arbName] = new Literal(token);
                }
            });
        }
    }

}
