import { Listeners } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { Concat } from "../matchers/Concat";
import { RestOfInput } from "../matchers/skip/Skip";
import {
    isSuccessfulMatch,
    MatchFailureReport,
} from "../MatchPrefixResult";
import {
    MatchReport,
    matchReportFromError,
    matchReportFromFailureReport,
    matchReportFromPatternMatch,
    toPatternMatchOrDismatchReport,
} from "../MatchReport";
import {
    DismatchReport,
    PatternMatch,
} from "../PatternMatch";
import { InputStream } from "../spi/InputStream";
import { StringInputStream } from "../spi/StringInputStream";
import { inputStateFromStream } from "./InputStateFactory";

export function exactMatch<T>(matcher: MatchingLogic, input: string | InputStream,
    parseContext = {},
    l?: Listeners): PatternMatch & T | DismatchReport {
    return toPatternMatchOrDismatchReport<T>(exactMatchReport(matcher, input, parseContext, l));
}

export function exactMatchReport(matcher: MatchingLogic, input: string | InputStream,
    parseContext = {},
    l?: Listeners): MatchReport {

    const wrapped = Concat.of({
        desired: matcher,
        trailingJunk: RestOfInput,
    });
    const result = wrapped.matchPrefix(inputStateFromStream(toInputStream(input), l), {}, parseContext);

    if (isSuccessfulMatch(result)) {
        const detyped = result.match as any;
        if (detyped.trailingJunk !== "") {
            return matchReportFromError(matcher,
                `Not all input was consumed: Left over [${detyped.trailingJunk}]`);
        } else {
            return matchReportFromPatternMatch(matcher, detyped.desired);
        }
    }
    return matchReportFromFailureReport(matcher, result as MatchFailureReport);
}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}
