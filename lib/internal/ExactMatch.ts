import {
    InputState,
    Listeners,
} from "../InputState";
import { MatchingLogic } from "../Matchers";
import {
    FailedMatchReport,
    isSuccessfulMatchReport,
    MatchReport,
    toPatternMatchOrDismatchReport,
} from "../MatchReport";
import {
    DismatchReport,
    PatternMatch,
} from "../PatternMatch";
import { InputStream } from "../spi/InputStream";
import { StringInputStream } from "../spi/StringInputStream";
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
    const inputState = inputStateFromStream(toInputStream(input), l);

    const result = matcher.matchPrefixReport(inputState, {}, parseContext);

    if (!isSuccessfulMatchReport(result)) {
        return result;
    }
    const trailingInputState = advanceTo(result.endingOffset, inputState);
    if (hasNothingLeft(trailingInputState)) {
        return result;
    }
    const extraInputDescription = describeExtraInput(trailingInputState);
    return failedMatchReport(matcher, {
        offset: 0,
        children: [result, trailingJunkMatchReport(result.endingOffset, extraInputDescription)],
        parseNodeName: "ExactMatch",
        reason: `Not all input was consumed: Left over [${extraInputDescription}]`,
    });
}

function advanceTo(endingOffset: number, inputState: InputState): InputState {
    // is there a better way to move the input stream forward?
    let currentInputState = inputState;
    while (!currentInputState.exhausted() && currentInputState.offset <= endingOffset) {
        currentInputState = currentInputState.advance();

    }
    return currentInputState;
}

function hasNothingLeft(inputState: InputState) {
    // sometimes exhausted() returns false even when there is nothing left.
    return inputState.exhausted() || inputState.peek(1).length === 0;
}

function describeExtraInput(inputState: InputState): string {
    const extraInput = inputState.peek(20);
    const nextInputState = inputState.consume(extraInput, "observing extra input in ExactMatch");
    return nextInputState.exhausted() ? extraInput : extraInput + "...";
}

function trailingJunkMatchReport(endingOffset: number, extraInputDescription: string): FailedMatchReport {
    return failedMatchReport({ $id: "EndOfInput" } as MatchingLogic, {
        offset: endingOffset,
        parseNodeName: "EndOfInput",
        reason: `Expected end of input. Saw: ${extraInputDescription}`,
    });
}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}
