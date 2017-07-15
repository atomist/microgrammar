import { Concat } from "../matchers/Concat";
import { RestOfInput } from "../matchers/skip/Skip";
import { Rep } from "../Rep";
import { Break } from "./Break";

const elementReference = new Concat({
    $id: "component",
    _start: "${",
    elementName: /[a-zA-Z0-9_]+/,
    _end: "}",
});

export const specGrammar = new Concat({
    $id: "spec",
    these: new Rep({
        $id: "literal, then component",
        literal: new Break(elementReference),
        element: elementReference,
    }),
    trailing: RestOfInput,
});

export interface MicrogrammarSpec {
    these: Array<{ literal: string, element: { elementName: string } }>;
    trailing: string;
}
