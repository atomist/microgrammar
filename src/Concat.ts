import { Config, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { Matcher, MatchingLogic, Term } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";
import { Microgrammar } from "./Microgrammar";
import {
    DismatchReport,
    PatternMatch,
    TreePatternMatch,
} from "./PatternMatch";
import { Literal, Regex } from "./Primitives";
import { consumeWhitespace } from "./Whitespace";

/**
 * Represents something that can be passed into a microgrammar
 */
export type TermDef = Term | string | RegExp;

/**
 * Represents a concatenation of multiple matchers. This is the normal
 * way we compose matches.
 */
export class Concat implements MatchingLogic {

    public readonly matchers: Matcher[] = [];

    constructor(public definitions: any, public config: Config = DefaultConfig) {
        for (const matcherName in definitions) {
            if (matcherName !== "$id") {
                const named = withName(toMatchingLogic(
                    definitions[matcherName]),
                    matcherName);
                this.matchers.push(named);
            }
        }
    }

    get $id() {
        return (this.definitions.$id) ?
            this.definitions.$id :
            "Concat{" + this.matchers.map(m => m.$id).join(",") + "}";
    }

    public matchPrefix(initialInputState: InputState): MatchPrefixResult {
        const matches: PatternMatch[] = [];
        let currentInputState = initialInputState;
        let matched = "";
        for (const m of this.matchers) {
            if (this.config.consumeWhiteSpaceBetweenTokens) {
                const eaten = consumeWhitespace(currentInputState);
                matched += eaten[0];
                currentInputState = eaten[1];
            }

            const report = m.matchPrefix(currentInputState);
            if (report.$isMatch) {
                const pm = report as PatternMatch;
                matches.push(pm);
                currentInputState = currentInputState.consume(pm.$matched);
                matched += pm.$matched;
            } else {
                return new DismatchReport(this.$id, initialInputState.offset);
            }
        }
        return new TreePatternMatch(
            this.$id,
            matched,
            initialInputState.offset,
            this.matchers,
            matches);
    }

}

/**
 * Turns a JSON element such as name: "literal" into a matcher
 * @param name of the created matcher
 * @param o
 * @returns {any}
 */
export function toMatchingLogic(o: TermDef): MatchingLogic {
    if (typeof o === "string") {
        return new Literal(o as string);
    } else if ((o as RegExp).exec) {
        return new Regex(o as RegExp);
    } else if ((o as MatchingLogic).matchPrefix) {
        return o as MatchingLogic;
    } else if ((o as Microgrammar<any>).findMatches) {
        return (o as Microgrammar<any>).matcher;
    } else {
        return new Concat(o as Term);
    }
}

function withName(ml: MatchingLogic, name: string): Matcher {
    return new MatcherWrapper(name, ml);
}

class MatcherWrapper implements Matcher {

    public $id = this.name;

    constructor(public name: string, private ml: MatchingLogic) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        // Remember to copy extra properties
        const mpr = this.ml.matchPrefix(is);
        // (mpr as any).name = this.name;
        return mpr;
    }
}
