import { Concat } from "../matchers/Concat";
import { RestOfInput } from "../matchers/skip/Skip";
import { Rep } from "../Rep";
import { Break } from "./Break";
import { CompleteFromStringOptions } from "./CompleteFromStringOptions";

function componentReference(fso: CompleteFromStringOptions) {
    return Concat.of({
        $id: "component",
        _start: fso.componentPrefix + "{",
        elementName: /[a-zA-Z0-9_]+/,
        _end: "}",
    });
}

export function specGrammar(fso: CompleteFromStringOptions) {
    const componentRef = componentReference(fso);
    return Concat.of({
        $id: "spec",
        these: new Rep({
            $id: "literal, then component",
            literal: new Break(componentRef),
            element: componentRef,
        }),
        trailing: RestOfInput,
    });
}

export interface MicrogrammarSpec {
    these: Array<{ literal: string, element: { elementName: string } }>;
    trailing: string;
}
