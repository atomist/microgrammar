import { Config, DefaultConfig } from "../Config";
import { InputState } from "../InputState";
import { Matcher, MatchingLogic, Term } from "../Matchers";
import { MatchPrefixResult } from "../MatchPrefixResult";
import { Microgrammar } from "../Microgrammar";
import { isPatternMatch, isSpecialMember, MatchFailureReport, PatternMatch, TreePatternMatch } from "../PatternMatch";
import { Literal, Regex } from "../Primitives";

import { readyToMatch } from "../internal/Whitespace";

/**
 * Represents something that can be passed into a microgrammar
 */
export type TermDef = Term | string | RegExp;

export interface MatchVeto { $id: string; veto: ((ctx: {}) => boolean); }
export interface ContextChange { $id: string; alter: ((ctx: {}) => void ); }

function isMatchVeto(thing: MatchStep): thing is MatchVeto {
    return isSpecialMember(thing.$id);
}

/**
 * Represents a step during matching. Can be a matcher or a function,
 * that can work on the context and return a fresh value.
 */
export type MatchStep = Matcher | MatchVeto | ContextChange;

/**
 * Represents a concatenation of multiple matchers. This is the normal
 * way we compose matches, although this class needn't be used explicitly,
 * as Microgrammars use it, via fromDefinitions or by composition involving
 * an object literal which will be converted to a Concat.
 * Users should only create Concats directly in the unusual case where they need
 * to control whitespace handling in a unique way for that particular Concat.
 */
export class Concat implements MatchingLogic {

    public readonly matchSteps: MatchStep[] = [];

    // Used to check first matcher. We want to do that to check
    // for required prefix etc.
    private readonly firstMatcher: Matcher;

    constructor(public definitions: any, public config: Config = DefaultConfig) {
        for (const stepName in definitions) {
            if (["$id", "matchPrefix", "canStartWith", "requiredPrefix"].indexOf(stepName) === -1) {
                const def = definitions[stepName];
                if (def === undefined || def === null) {
                    throw new Error(`Invalid concatenation: Step [${stepName}] is ${def}`);
                }
                if (Array.isArray(def) && def.length === 2) {
                    // It's a transformation of a matched return
                    const ml = def[0];
                    const m = toMatchingLogic(ml);
                    const named = new NamedMatcher(stepName, m);
                    this.matchSteps.push(new TransformingMatcher(named, def[1]));
                } else if (typeof def === "function") {
                    // It's a calculation function
                    if (def.length === 0) {
                        // A no arg function is invalid
                        throw new Error(`No arg function [${stepName}] is invalid as a matching step`);
                    }
                    if (isSpecialMember(stepName)) {
                        this.matchSteps.push({$id: stepName, veto: def});
                    } else {
                        this.matchSteps.push({$id: stepName, alter: def});
                    }
                } else {
                    // It's a normal matcher
                    const named = new NamedMatcher(stepName, toMatchingLogic(def));
                    this.matchSteps.push(named);
                }
            }
        }
        this.firstMatcher = this.matchSteps.filter(s => isMatcher(s))[0]     as Matcher;
    }

    get $id() {
        return (this.definitions.$id) ?
            this.definitions.$id :
            "Concat{" + this.matchSteps.map(m => m.$id).join(",") + "}";
    }

    public canStartWith(char: string): boolean {
        return !this.firstMatcher.canStartWith || this.firstMatcher.canStartWith(char);
    }

    get requiredPrefix(): string {
        return this.firstMatcher.requiredPrefix;
    }

    public matchPrefix(initialInputState: InputState, context: {}): MatchPrefixResult {
        const matches: PatternMatch[] = [];
        let currentInputState = initialInputState;
        let matched = "";
        for (const step of this.matchSteps) {
            if (isMatcher(step)) {
                const eat = readyToMatch(currentInputState, this.config);
                currentInputState = eat.state;
                matched += eat.skipped;

                // If it's a concat, give it a fresh context
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
                    return new MatchFailureReport(this.$id, initialInputState.offset, context);
                }
            } else {
                // It's a function taking the context.
                // Bind its result to the context and see if
                // we should stop matching.
                if (isMatchVeto(step)) {
                    if (step.veto(context) === false) {
                        return new MatchFailureReport(this.$id, initialInputState.offset, context);
                    }
                } else {
                    context[step.$id] = step.alter(context);
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

export function isConcat(m: MatchingLogic): m is Concat {
    return m && !!((m as Concat).matchSteps || isConcat((m as NamedMatcher).ml));
}

function isMatcher(s: MatchStep): s is Matcher {
    return (s as Matcher).matchPrefix !== undefined;
}

/**
 * Turns a JSON element such as name: "literal" into a matcher.
 * Return undefined if the object is undefined or null
 * @param name of the created matcher
 * @param o object to attempt to make into a matcher
 * @returns {any}
 */
export function toMatchingLogic(o: TermDef): MatchingLogic {
    if (!o) {
        return undefined;
    }
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

/**
 * Give an existing matcher a name
 */
export class NamedMatcher implements Matcher {

    public $id = this.name;

    constructor(public name: string, public ml: MatchingLogic) {
    }

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        return this.ml.matchPrefix(is, context) as PatternMatch;
    }

    public canStartWith(char: string): boolean {
        return !this.ml.canStartWith || this.ml.canStartWith(char);
    }

    get requiredPrefix(): string {
        return this.ml.requiredPrefix;
    }
}

export function isNamedMatcher(thing: MatchingLogic): thing is NamedMatcher {
    return ((thing as NamedMatcher).name !== undefined) && (thing as NamedMatcher).ml !== undefined;
}

/**
 * Transforms the result of a matcher using a function
 */
class TransformingMatcher implements Matcher {

    public readonly name = this.m.name;

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

    public canStartWith(char: string): boolean {
        return !this.m.canStartWith || this.m.canStartWith(char);
    }

    get requiredPrefix(): string {
        return this.m.requiredPrefix;
    }
}
