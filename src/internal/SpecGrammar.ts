import { Concat } from "../matchers/Concat";
import { RestOfInput } from "../matchers/skip/Skip";
import { Literal, Regex } from "../Primitives";
import { Rep } from "../Rep";
import { Break } from "./Break";

const elementReference = new Concat({
    $id: "component",
    _start: new Literal("${"),
    elementName: new Regex(/[a-zA-Z0-9_]+/),
    _end: new Literal("}"),
});

export const specGrammar = new Concat({
    $id: "spec",
    these: new Rep(
        new Concat({
            $id: "literal, then component",
            literal: new Break(elementReference),
            element: elementReference,
        })),
    trailing: RestOfInput, //  matchEverything

});

export interface MicrogrammarSpec {
    these: Array<{literal: string, element: { elementName: string }}>;
    trailing: string;
}
