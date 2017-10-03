import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import { isSuccessfulMatch, MatchFailureReport, MatchPrefixResult, matchPrefixSuccess } from "./MatchPrefixResult";
import { PatternMatch, UndefinedPatternMatch } from "./PatternMatch";

/**
 * Optional match on the given matcher
 * @param o matcher
 * @return {Opt}
 */
export function optional(o: any): MatchingLogic {
    return new Opt(o);
}

export class Opt implements MatchingLogic {

    private matcher: MatchingLogic;

    /**
     * Optional match
     * @param o matching logic
     */
    constructor(o: any) {
        this.matcher = toMatchingLogic(o);
    }

    get $id() {
        return `Opt[${this.matcher.$id}]`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        if (is.exhausted()) {
            // console.log(`Match from Opt on exhausted stream`);
            return matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset));
        }

        const maybe = this.matcher.matchPrefix(is, thisMatchContext, parseContext);
        if (isSuccessfulMatch(maybe)) {
            return maybe;
        }
        return matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset));
    }
}

/**
 * Match the first of these matchers that matches. Equivalent to an Alt (alternate)
 * @param a first matcher
 * @param b second matcher
 * @param matchers any further matchers: varargs
 * @returns {Alt}
 */
export function firstOf(a: any, b: any, ...matchers: any[]): MatchingLogic {
    return new Alt(a, b, ...matchers);
}

/**
 * Matches first match of 2 or more matchers.
 */
export class Alt implements MatchingLogic {

    public readonly matchers: MatchingLogic[];

    constructor(a: any, b: any, ...matchers: any[]) {
        const matchObjects = [a, b].concat(matchers);
        this.matchers = matchObjects.map(m => toMatchingLogic(m));
    }

    // tslint:disable-next-line:member-ordering
    get $id() {
        return `Alt(${this.matchers.map(m => m.$id).join(",")})`;
    }

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        if (is.exhausted()) {
            return new MatchFailureReport(this.$id, is.offset, {});
        }

        for (const matcher of this.matchers) {
            const m = matcher.matchPrefix(is, thisMatchContext, parseContext);
            if (isSuccessfulMatch(m)) {
                return m;
            }
        }
        return new MatchFailureReport(this.$id, is.offset, {});
    }
}

/**
 * Add a condition with a function that verifies that even if we found a match
 * we are happy with it: For example, we like the value it contains.
 * Also capable of vetoing match if the input state is problematic before the potential match
 */
export function when(
    o: any,
    matchTest: (pm: PatternMatch) => boolean,
    inputStateTest: (is: InputState) => boolean = is => true,
) {

    const matcher = toMatchingLogic(o);
    const conditionalMatcher = {} as any;

    conditionalMatcher.$id = `When[${matcher}]`;

    // Copy other properties
    for (const prop in o) {
        if (o.hasOwnProperty(prop)) {
            conditionalMatcher[prop] = o[prop];
        }
    }

    function conditionalMatch(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult {
        const result = inputStateTest(is) ?
            matcher.matchPrefix(is, thisMatchContext, parseContext) :
            undefined;
        return (result && isSuccessfulMatch(result) && matchTest(result.match)) ?
            result :
            new MatchFailureReport(conditionalMatcher.$id, is.offset, context);
    }

    conditionalMatcher.matchPrefix = conditionalMatch;
    conditionalMatcher.requiredPrefix = matcher.requiredPrefix;
    conditionalMatcher.canStartWith = matcher.canStartWith;
    return conditionalMatcher;
}
