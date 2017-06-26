import { Config, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { Matcher, MatchingLogic, Term } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";
import { Microgrammar } from "./Microgrammar";
import { DismatchReport, isPatternMatch, PatternMatch, TreePatternMatch } from "./PatternMatch";
import { Literal, Regex } from "./Primitives";
import { consumeWhitespace } from "./Whitespace";

/**
 * Represents something that can be passed into a microgrammar
 */
export type TermDef = Term | string | RegExp;

/**
 * Represents a step during matching. Can be a matcher or a function,
 * that can work on the context and return a fresh value.
 */
export type MatchStep = Matcher | { $id: string, f: ((ctx: {}) => void | boolean) };

/**
 * Represents a concatenation of multiple matchers. This is the normal
 * way we compose matches, although this class needn't be used explicitly.
 */
export class Concat implements MatchingLogic {

    public readonly matchSteps: MatchStep[] = [];

    constructor(public definitions: any, public config: Config = DefaultConfig) {
        for (const stepName in definitions) {
            if (stepName !== "$id" && stepName !== "matchPrefix") {
                const def = definitions[stepName];
                if (Array.isArray(def) && def.length === 2) {
                    // It's a transformation of a matched return
                    const ml = def[0];
                    const named = withName(toMatchingLogic(ml), stepName);
                    this.matchSteps.push(new TransformingMatcher(named, def[1]));
                } else if (typeof def === "function") {
                    // It's a calculation function
                    if (def.length === 0) {
                        // A no arg function is invalid
                        throw new Error(`No arg function [${stepName}] is invalid as a matching step`);
                    }
                    this.matchSteps.push({ $id: stepName, f: def });
                } else {
                    // It's a normal matcher
                    const named = withName(toMatchingLogic(def), stepName);
                    this.matchSteps.push(named);
                }
            }
        }
    }

    get $id() {
        return (this.definitions.$id) ?
            this.definitions.$id :
            "Concat{" + this.matchSteps.map(m => m.$id).join(",") + "}";
    }

    public matchPrefix(initialInputState: InputState, context: {}): MatchPrefixResult {
        const matches: PatternMatch[] = [];
        let currentInputState = initialInputState;
        let matched = "";
        for (const step of this.matchSteps) {
            if (this.config.consumeWhiteSpaceBetweenTokens) {
                const eaten = consumeWhitespace(currentInputState);
                matched += eaten[0];
                currentInputState = eaten[1];
            }

            if (isMatcher(step)) {
                // If it's a concat, give it a fresh matcher
                const contextToUse = isConcat(step) ? {} : context;
                const report = step.matchPrefix(currentInputState, contextToUse);
                if (isPatternMatch(report)) {
                    matches.push(report);
                    currentInputState = currentInputState.consume(report.$matched);
                    matched += report.$matched;
                    if (contextToUse !== context) {
                        // Bind the nested context if necessary
                        context[step.$id] = contextToUse;
                    } else {
                        context[step.$id] = report.$value;
                    }
                } else {
                    return new DismatchReport(this.$id, initialInputState.offset, context);
                }
            } else {
                // It's a function taking the context.
                // Bind its result to the context and see if
                // we should stop matching.
                const r = step.f(context);
                if (step.$id.indexOf("_") === 0) {
                    if (r === false) {
                        return new DismatchReport(this.$id, initialInputState.offset, context);
                    }
                } else {
                    context[step.$id] = r;
                }
            }
        }
        return new TreePatternMatch(
            this.$id,
            matched,
            initialInputState.offset,
            this.matchSteps.filter(m => (m as any).matchPrefix) as Matcher[],
            matches,
            context);
    }

}

export function isConcat(m: MatchingLogic): boolean {
    return m && !!((m as Concat).matchSteps || isConcat((m as MatcherWrapper).ml));
}

function isMatcher(s: MatchStep): s is Matcher {
    return (s as Matcher).matchPrefix !== undefined;
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
        return new Concat(o);
    }
}

function withName(ml: MatchingLogic, name: string): Matcher {
    return new MatcherWrapper(name, ml);
}

class MatcherWrapper implements Matcher {

    public $id = this.name;

    constructor(public name: string, public ml: MatchingLogic) {
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        return this.ml.matchPrefix(is, context) as PatternMatch;
    }
}

/**
 * Transforms the result of a matcher using a function
 */
class TransformingMatcher implements Matcher {

    public name = this.m.name;

    constructor(public m: Matcher, private f: (val, ctx) => any) {
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        const mpr = this.m.matchPrefix(is, context) as PatternMatch;
        if (isPatternMatch(mpr)) {
            const computed = this.f(mpr.$value, context);
            context[this.name] = mpr[this.name] = computed;
        }
        return mpr;
    }
}
