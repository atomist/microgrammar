import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {isSuccessfulMatch, MatchFailureReport, MatchPrefixResult, matchPrefixSuccess} from "./MatchPrefixResult";
import {  MATCH_INFO_SUFFIX, UndefinedPatternMatch } from "./PatternMatch";

/**
 * Optional match on the given matcher
 * @param o matcher
 * @param pullUp property from the matcher to pull up to the
 * parent if specified
 * @return {Opt}
 */
export function optional(o: any, pullUp?: string): MatchingLogic {
    return new Opt(o, pullUp);
}

export class Opt implements MatchingLogic {

    private matcher: MatchingLogic;

    /**
     * Optional match
     * @param o matching logic
     * @param pullUp property to pull up if we want one
     */
    constructor(o: any, private pullUp?: string) {
        this.matcher = toMatchingLogic(o);
    }

    get $id() {
        return `Opt[${this.matcher.$id}]`;
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        if (is.exhausted()) {
            // console.log(`Match from Opt on exhausted stream`);
            return matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset));
        }

        const maybe = this.matcher.matchPrefix(is, context);
        if (isSuccessfulMatch(maybe)) {
            if (this.pullUp) {
                const f = this.pullUp + MATCH_INFO_SUFFIX;
                const field = maybe.$value[f];
                if (!field) {
                    throw new Error(`Cannot pull up field ${f} in ${maybe}`);
                }
                maybe.match.$value = field.$value;
                return matchPrefixSuccess(maybe.match)
            } else {
                return maybe;
            }
        }
        return matchPrefixSuccess(new UndefinedPatternMatch(this.$id, is.offset));
    }
}

/**
 * Matches first match of 2 or more matchers.
 */
export class Alt implements MatchingLogic {

    private matchers: MatchingLogic[];

    constructor(a: any, b: any, ...matchers: any[]) {
        const matchObjects = [a, b].concat(matchers);
        this.matchers = matchObjects.map(m => toMatchingLogic(m));
    }

    // tslint:disable-next-line:member-ordering
    get $id() {
        return `Alt(${this.matchers.map(m => m.$id).join(",")})`;
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        if (is.exhausted()) {
            return new MatchFailureReport(this.$id, is.offset, {});
        }

        for (const matcher of this.matchers) {
            const m = matcher.matchPrefix(is, {});
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
 */
export function when(o: any, matchTest: (PatternMatch) => boolean) {

    const matcher = toMatchingLogic(o);
    const conditionalMatcher = {} as any;

    conditionalMatcher.$id = `When[${this.matcher}]`;

    // Copy other properties
    for (const prop in o) {
        if (o.hasOwnProperty(prop)) {
            conditionalMatcher[prop] = o[prop];
        }
    }

    function conditionalMatch(is: InputState, context: {}): MatchPrefixResult {
        const result = matcher.matchPrefix(is, context);
        return (isSuccessfulMatch(result) && matchTest(result.match)) ?
            result :
            new MatchFailureReport(this.$id, is.offset, context);
    }

    conditionalMatcher.matchPrefix = conditionalMatch;
    conditionalMatcher.requiredPrefix = matcher.requiredPrefix;
    conditionalMatcher.canStartWith = matcher.canStartWith;
    return conditionalMatcher;
}
