import {
    Matcher,
    MatchingLogic,
} from "../Matchers";
import {
    Concat,
    isNamedMatcher,
    MatchStep,
} from "../matchers/Concat";
import { isLiteral } from "../Primitives";
import { isBreak } from "./Break";

/**
 * Print a matcher structure
 *
 * This is implemented only as far as I needed it; let's see whether
 * we want to use it more before fleshing out the implementation.
 */

function isMatcher(ml: MatchingLogic | MatchStep): ml is Matcher {
    return !!((ml as Matcher).name);
}
function isConcat(ml: MatchingLogic): ml is Concat {
    return !!((ml as Concat).matchSteps);
}

export function print(ml: MatchingLogic): string {
    if (isConcat(ml)) {
        const matcherSteps: Matcher[] =
            ml.matchSteps.filter(isMatcher).map(m => m as Matcher);
        return matcherSteps.map(print).join(" ");
    } else if (isLiteral(ml)) {
        return ml.literal;
    } else if (isNamedMatcher(ml)) {
        return print(ml.ml);
    } else if (isBreak(ml)) {
        return("...(" + print(ml.terminateOn) + ")");
    } else if (isMatcher(ml)) {
        return `Matcher:${ml.name}`;
    } else {
        return "???";
    }
}
