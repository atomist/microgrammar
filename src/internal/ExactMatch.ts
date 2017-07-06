import {MatchingLogic} from "../Matchers";
import {Concat} from "../matchers/Concat";
import {RestOfInput} from "../matchers/skip/Skip";
import {isSuccessfulMatch, MatchFailureReport} from "../MatchPrefixResult";
import {DismatchReport, PatternMatch} from "../PatternMatch";
import {InputStream} from "../spi/InputStream";
import {StringInputStream} from "../spi/StringInputStream";
import {inputStateFromStream} from "./InputStateFactory";

export function exactMatch<T>(matcher: MatchingLogic, input: string | InputStream): PatternMatch & T | DismatchReport {

    const wrapped = new Concat({
        desired: matcher,
        trailingJunk: RestOfInput,
    });
    const match = wrapped.matchPrefix(inputStateFromStream(toInputStream(input)), {});

    if (isSuccessfulMatch(match)) {
        const detyped = match.match as any;
        if (detyped.trailingJunk !== "") {
            return {description:
                `Not all input was consumed: Left over [${detyped.trailingJunk.$matched}]`};
        } else {
            return detyped.desired.$match as (PatternMatch & T);
        }
    }
    return match as MatchFailureReport;
}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}
