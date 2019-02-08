import { Listeners } from "../InputState";
import { MatchingLogic } from "../Matchers";
import { Concat } from "../matchers/Concat";
import { RestOfInput } from "../matchers/skip/Skip";
import {
    isSuccessfulMatch,
    MatchFailureReport,
} from "../MatchPrefixResult";
import {
    isSuccessfulMatchReport, MatchReport,
    matchReportFromError, matchReportFromFailureReport, matchReportFromPatternMatch, toPatternMatchOrDismatchReport,
} from "../MatchReport";
import {
    DismatchReport,
    PatternMatch,
} from "../PatternMatch";
import { InputStream } from "../spi/InputStream";
import { StringInputStream } from "../spi/StringInputStream";
import { SuccessfulMatchReport } from "./../MatchReport";
import { inputStateFromStream } from "./InputStateFactory";
import { failedMatchReport } from "./matchReport/failedMatchReport";

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
    const result = wrapped.matchPrefixReport(inputStateFromStream(toInputStream(input), l), {}, parseContext);

    if (isSuccessfulMatchReport(result)) {
        // require empty trailingJunk match
        const trailingJunkReport = result.getChildMatchReport("trailingJunk") as SuccessfulMatchReport;
        if (trailingJunkReport.matched !== "") {
            return failedMatchReport(wrapped, {
                offset: trailingJunkReport.offset,
                children: [result],
                reason:
                    `Not all input was consumed: Left over [${trailingJunkReport.matched}]`,
            });
        }
    }
    return result.getChildMatchReport("desired");
}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}
