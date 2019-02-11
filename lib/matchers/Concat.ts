import * as stringify from "json-stringify-safe";
import {
    SkipCapable,
    WhiteSpaceHandler,
} from "../Config";
import { InputState } from "../InputState";
import { Break } from "../internal/Break";
import { successfulMatchReport } from "../internal/matchReport/terminalMatchReport";
import {
    ComputeEffectsReport,
    successfulTreeMatchReport,
} from "../internal/matchReport/treeMatchReport";
import { readyToMatch } from "../internal/Whitespace";
import {
    LazyMatchingLogic,
    Matcher,
    MatchingLogic,
    Term,
} from "../Matchers";
import {
    MatchPrefixResult,
} from "../MatchPrefixResult";
import {
    isSuccessfulMatchReport,
    MatchReport,
    toMatchPrefixResult,
} from "../MatchReport";
import { Microgrammar } from "../Microgrammar";
import {
    isSpecialMember,
} from "../PatternMatch";
import {
    Literal,
    Regex,
} from "../Primitives";
import {
    failedTreeMatchReport,
    namedChild,
    TreeChild,
} from "./../internal/matchReport/treeMatchReport";

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

    public readonly parseNodeName = "Concat";

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
                             parseContext): MatchReport {
        const bindingTarget: Record<string, any> = {};
        const matches: TreeChild[] = [];
        let currentInputState = initialInputState;
        let matched = "";
        const computeEffects: ComputeEffectsReport[] = [];
        for (const step of this.matchSteps) {
            if (isMatcher(step)) {
                const eat = readyToMatch(currentInputState, this.$consumeWhiteSpaceBetweenTokens);
                if (!!eat.skipped) {
                    matches.push(whitespaceChildMatch(eat.skipped, this, currentInputState.offset));
                }
                currentInputState = eat.state;
                matched += eat.skipped;

                const report = step.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
                if (isSuccessfulMatchReport(report)) {
                    matches.push(namedChild(step.$id, report));
                    currentInputState = currentInputState.consume(report.matched,
                        `Concat step [${report.matcher.$id}] matched ${report.matched}`);
                    matched += report.matched;
                    bindingTarget[step.$id] = report.toValueStructure();
                } else {
                    return failedTreeMatchReport(this, {
                        originalOffset: initialInputState.offset,
                        parseNodeName: this.parseNodeName,
                        matched,
                        reason: `Failed at step '${step.name}'`,
                        successes: matches,
                        failureName: step.name,
                        failureReport: report,
                        extraProperties: bindingTarget,
                        computeEffects,
                    });
                }
            } else {
                // It's a function taking the contexts.
                // See if we should stop matching.
                if (isMatchVeto(step)) {
                    const effects = applyComputation(step.$id, step.veto, bindingTarget, [thisMatchContext, parseContext]);
                    computeEffects.push(effects);
                    // tslint:disable-next-line:no-boolean-literal-compare
                    if (effects.computeResult === false) {
                        return failedTreeMatchReport(this, {
                            originalOffset: initialInputState.offset,
                            parseNodeName: this.parseNodeName,
                            failingOffset: currentInputState.offset,
                            matched,
                            failureName: step.$id,
                            reason: `Match vetoed by ${step.$id}`,
                            successes: matches,
                            extraProperties: bindingTarget,
                            computeEffects,
                        });
                    }
                } else {
                    const effects = applyComputation(step.$id, step.compute, bindingTarget);
                    computeEffects.push(effects);
                }
            }
        }
        return successfulTreeMatchReport(this, {
            matched,
            parseNodeName: this.parseNodeName,
            offset: initialInputState.offset,
            children: matches,
            extraProperties: bindingTarget,
            computeEffects,
        });
    }

    public matchPrefix(initialInputState: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(initialInputState, thisMatchContext, parseContext));
    }

}

function applyComputation(stepName: string,
                          compute: (arg: Record<string, any>, ...others: any) => any,
                          argument: Record<string, any>,
                          additionalArgs: any[] = [],
): ComputeEffectsReport {
    const beforeProperties = Object.entries(argument).map(([k, v]) => {
        return {
            name: k,
            before: stringify(v),
        };
    });
    const computeResult = compute(argument, ...additionalArgs);
    if (computeResult !== undefined) {
        argument[stepName] = computeResult;
    }
    const newProperties = Object.keys(argument).filter(n => !beforeProperties.find(bp => bp.name === n));
    const alteredProperties = beforeProperties.filter(bp => {
        return bp.before !== stringify(argument[bp.name]);
    }).map(bp => bp.name);
    return {
        stepName,
        computeResult,
        newProperties,
        alteredProperties,
    };
}

function isMatcher(s: MatchStep): s is Matcher {
    return (s as Matcher).matchPrefixReport !== undefined;
}

function whitespaceChildMatch(skipped: string, matcher: Concat, offset: number): TreeChild {
    const matchReport = successfulMatchReport(matcher, {
        parseNodeName: "Whitespace",
        matched: skipped,
        offset,
    });
    return { explicit: false, matchReport };
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
