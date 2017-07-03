import {Concat} from "../Concat";
import {Term} from "../Matchers";
import {RestOfInput} from "../matchers/skip/Skip";
import {Break} from "../matchers/snobol/Break";
import {Literal, Regex} from "../Primitives";
import {Rep} from "../Rep";

const elementReference = new Concat({
    $id: "component",
    _start: new Literal("${"),
    elementName: new Regex(/^[a-zA-Z0-9_]+/),
    _end: new Literal("}"),
} as Term);

export const specGrammar = new Concat({
    $id: "spec",
    these: new Rep(
        new Concat({
            $id: "literal, then component",
            literal: new Break(elementReference),
            element: elementReference,
        } as Term)),
    trailing: RestOfInput, //  matchEverything

});

export interface MicrogrammarSpec {
    these: Array<{literal: string, element: { elementName: string }}>;
    trailing: string;
}
