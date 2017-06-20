import { toMatchingLogic } from "./Concat";
import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";
import { DismatchReport, MATCH_INFO_SUFFIX, UndefinedPatternMatch } from "./PatternMatch";

export function optional(o: any, pullUp?: string): MatchingLogic {
    return new Opt(o, pullUp);
}

export class Opt implements MatchingLogic {

    private matcher: MatchingLogic;

    // tslint:disable-next-line:member-ordering
    public $id = `Opt[${this.matcher}]`;

    /**
     * Optional match
     * @param o matching logic
     * @param pullUp property to pull up if we want one
     */
    constructor(o: any, private pullUp?: string) {
        this.matcher = toMatchingLogic(o);
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        if (is.exhausted()) {
            // console.log(`Match from Opt on exhausted stream`);
            return new UndefinedPatternMatch(this.$id, is.offset);
        }

        const maybe = this.matcher.matchPrefix(is);
        // console.log(`Result of trying Opt on [${is.remainder()}]=${JSON.stringify(maybe)}`);

        if (maybe.$isMatch) {
            if (this.pullUp) {
                const maybem = maybe as any;
                const f = this.pullUp + MATCH_INFO_SUFFIX;
                const field = maybem.$value[f];
                if (!field) {
                    throw new Error(`Cannot pull up field ${f} in ${maybe}`);
                }
                maybem.$value = field.$value;
            }
            return maybe;
        }
        return new UndefinedPatternMatch(this.$id, is.offset);
    }
}

/**
 * Matches either A or B but not neither
 */
export class Alt implements MatchingLogic {

    private matcherA: MatchingLogic;
    private matcherB: MatchingLogic;

    // tslint:disable-next-line:member-ordering
    public $id = `Alt(${this.matcherA},${this.matcherB})`;

    constructor(a: any, b: any) {
        this.matcherA = toMatchingLogic(a);
        this.matcherB = toMatchingLogic(b);
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        if (is.exhausted()) {
            return new DismatchReport(this.$id, is.offset);
        }

        const aMatch = this.matcherA.matchPrefix(is);
        // console.log(`Result of trying Opt on [${is.remainder()}]=${JSON.stringify(maybe)}`);
        if (aMatch.$isMatch) {
            return aMatch;
        }
        // Otherwise, try b
        const bMatch = this.matcherB.matchPrefix(is);
        return (bMatch.$isMatch) ?
            bMatch :
            new DismatchReport(this.$id, is.offset);
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

    function conditionalMatch(is: InputState): MatchPrefixResult {
        const match = matcher.matchPrefix(is);
        return (match.$isMatch && matchTest(match)) ?
            match :
            new DismatchReport(this.$id, is.offset);
    }

    conditionalMatcher.matchPrefix = conditionalMatch;
    return conditionalMatcher;
}
