import {Concat, isNamedMatcher, MatchStep} from "../Concat";
import {Matcher, MatchingLogic} from "../Matchers";
import Match = Chai.Match;
import {isBreak} from "../matchers/snobol/Break";
import {isLiteral} from "../Primitives";

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
            ml.matchSteps.filter(s => isMatcher(s)).map(m => m as Matcher);
        return matcherSteps.map(s => print(s)).join(" ");
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
