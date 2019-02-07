import { InputState } from "../InputState";
import {
    LazyMatchingLogic,
    Matcher,
    MatchingLogic,
    Term,
} from "../Matchers";
import {
    isSuccessfulMatch,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "../MatchPrefixResult";
import { Microgrammar } from "../Microgrammar";
import {
    isSpecialMember,
    PatternMatch,
    TreePatternMatch,
} from "../PatternMatch";
import {
    Literal,
    Regex,
} from "../Primitives";
import { MatchFailureReport } from "./../MatchPrefixResult";

import {
    SkipCapable,
    WhiteSpaceHandler,
} from "../Config";
import { Break } from "../internal/Break";
import { failedMatchReport } from "../internal/matchReport/failedMatchReport";
import { successfulTreeMatchReport } from "../internal/matchReport/treeMatchReport";
import { readyToMatch } from "../internal/Whitespace";
import {
    FullMatchReport, isFailedMatchReport,
    isSuccessfulMatchReport, MatchReport,
    matchReportFromFailureReport,
    matchReportFromSuccessfulTreeMatch,
    toMatchPrefixResult,
} from "../MatchReport";

/**
 * Represents something that can be passed into a microgrammar
 */
export type TermDef = Term | string | RegExp;

export interface MatchVeto {
    $id: string;
    veto: ((ctx: {}, thisMatchContext: {}, parseContext: {}) => boolean);
}

export interface ContextComputation {
    $id: string;
    compute: ((ctx: {}) => any);
}

function isMatchVeto(thing: MatchStep): thing is MatchVeto {
    return isSpecialMember(thing.$id);
}

/**
 * Represents a step during matching. Can be a matcher or a function,
 * that can work on the context and return a fresh value.
 */
export type MatchStep = Matcher | MatchVeto | ContextComputation;

const methodsOnEveryMatchingLogic = ["$id", "matchPrefix", "canStartWith", "requiredPrefix"];

export type ConcatDefinitions = any; // maybe we can tighten this. For now, giving it a name

/**
 * The externally useful interface of Concat.
 */
export interface Concatenation extends MatchingLogic {

    definitions: ConcatDefinitions;

}

/**
 * Represents a concatenation of multiple matchers. This is the normal
 * way we compose matches, although this class needn't be used explicitly,
 * as Microgrammars use it, via fromDefinitions or by composition involving
 * an object literal which will be converted to a Concat.
 * Users should only create Concats directly in the unusual case where they need
 * to control whitespace handling in a unique way for that particular Concat.
 */
export class Concat implements Concatenation, LazyMatchingLogic, WhiteSpaceHandler, SkipCapable {

    /**
     * Normal way to create a Concat. If a $lazy field
     * is set to true, the Concat will be lazily initialized, and
     * _init() must be called before use.
     * @param definitions
     * @return {Concat}
     */
    public static of(definitions: any): Concat {
        const concat = new Concat(definitions);
        if (definitions.$lazy !== true) {
            concat._init();
        }
        return concat;
    }

    public $consumeWhiteSpaceBetweenTokens: boolean = true;

    public $skipGaps = false;

    public $lazy = false;

    public readonly matchSteps: MatchStep[] = [];

    // Used to check first matcher. We want to do that to check
    // for required prefix etc.
    private firstMatcher: Matcher;

    private constructor(public definitions: any) {
    }

    get _initialized(): boolean {
        return !!this.firstMatcher;
    }

    /**
     * Evaluate all members to ready this Concat for use.
     * Only call this function after using the lazy static factory method:
     * _init is called automatically in the case of the regular Concat.of
     * function
     */
    public _init() {
        if (!this._initialized) {
            for (const stepName in this.definitions) {
                if (methodsOnEveryMatchingLogic.indexOf(stepName) === -1) {
                    const def = this.definitions[stepName];
                    if (def === undefined || def === null) {
                        throw new Error(`Invalid concatenation: Step [${stepName}] is ${def}`);
                    }
                    if (stepName.charAt(0) === "$") {
                        // It's a config property. Copy it over.
                        this[stepName] = def;
                    } else if (typeof def === "function") {
                        // It's a calculation function
                        if (def.length === 0 && stepName !== "_init") {
                            // A no arg function is invalid
                            throw new Error(`No arg function [${stepName}] is invalid as a matching step`);
                        }
                        if (isSpecialMember(stepName)) {
                            this.matchSteps.push({ $id: stepName, veto: def });
                        } else {
                            this.matchSteps.push({ $id: stepName, compute: def });
                        }
                    } else {
                        // It's a normal matcher
                        const m = toMatchingLogic(def);
                        // If we are skipping gaps, skip between productions
                        const named = new NamedMatcher(stepName,
                            this.$skipGaps ? new Break(m, true) : m);
                        this.matchSteps.push(named);
                    }
                }
            }
            this.firstMatcher = this.matchSteps.filter(s => isMatcher(s))[0] as Matcher;
        }
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

    public matchPrefixReport(initialInputState: InputState,
                             thisMatchContext,
                             parseContext): FullMatchReport {
        const bindingTarget = {};
        const matches: FullMatchReport[] = [];
        let currentInputState = initialInputState;
        let matched = "";
        for (const step of this.matchSteps) {
            if (isMatcher(step)) {
                const eat = readyToMatch(currentInputState, this.$consumeWhiteSpaceBetweenTokens);
                // add a whitespace match
                currentInputState = eat.state;
                matched += eat.skipped;

                const report = step.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
                if (isSuccessfulMatchReport(report)) {
                    matches.push(report);
                    currentInputState = currentInputState.consume(report.matched,
                        `Concat step [${report.matcher.$id}] matched ${report.matched}`);
                    matched += report.matched;
                    bindingTarget[step.$id] = report.toValueStructure ?  // shim
                        report.toValueStructure() :
                        function() {
                            console.log("WARNING: guessing at structure");
                            return (toMatchPrefixResult(report) as PatternMatch).$value;
                        }();
                } else if (isFailedMatchReport(report)) {
                    matches.push(report);
                    return failedMatchReport(this, {
                        offset: initialInputState.offset,
                        matched,
                        reason: `Failed at step '${step.name}'`,
                        children: matches,
                    });
                } else {
                    console.log("ERROR: not recording match for " + step.name);
                }
            } else {
                // It's a function taking the contexts.
                // See if we should stop matching.
                if (isMatchVeto(step)) {
                    // tslint:disable-next-line:no-boolean-literal-compare
                    if (step.veto(bindingTarget, thisMatchContext, parseContext) === false) {
                        return failedMatchReport(this, {
                            offset: initialInputState.offset,
                            matched,
                            reason: `Match vetoed by ${step.$id}`,
                            children: matches,
                        });
                    }
                } else {
                    bindingTarget[step.$id] = step.compute(bindingTarget);
                }
            }
        }
        return successfulTreeMatchReport(this, {
            matched,
            offset: initialInputState.offset,
            children: matches,
            extraProperties: bindingTarget,
        });
    }

    public matchPrefix(initialInputState: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(initialInputState, thisMatchContext, parseContext));
    }

}

function isMatcher(s: MatchStep): s is Matcher {
    return (s as Matcher).matchPrefixReport !== undefined;
}

/**
 * Turns a JSON element such as name: "literal" into a matcher.
 * Return undefined if the object is undefined or null
 * @param o object to attempt to make into a matcher
 * @returns {any}
 */
export function toMatchingLogic(o: TermDef): MatchingLogic {
    if (!o) {
        return undefined;
    }
    if (typeof o === "string") {
        return new Literal(o);
    } else if ((o as RegExp).exec) {
        return new Regex(o as RegExp);
    } else if ((o as MatchingLogic).matchPrefixReport) {
        return o as MatchingLogic;
    } else if ((o as Microgrammar<any>).findMatches) {
        return (o as Microgrammar<any>).matcher;
    } else {
        return Concat.of(o);
    }
}

/**
 * Give an existing matcher a name
 */
export class NamedMatcher implements Matcher {

    public $id = this.name;

    constructor(public name: string, public ml: MatchingLogic) {
    }

    public matchPrefix(is: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.ml.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        return this.ml.matchPrefixReport(is, thisMatchContext, parseContext);
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
