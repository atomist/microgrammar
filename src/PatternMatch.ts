import { Matcher } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";

/**
 * Returned when we failed to match prefix
 */
export class DismatchReport implements MatchPrefixResult {

    public constructor(
        public readonly $matcherId: string,
        public $offset: number,
        public $context: {},
        private cause?: DismatchReport) {
    }

}

export abstract class PatternMatch implements MatchPrefixResult {

    /**
     * @return the $value that is extracted from this matcher. May be a
     * scalar or an array, or a nested structure
     */
    public $value: any;

    /**
     * Represents a match
     * @param $matched the actual string content
     * @param $offset
     * @param $resultingInputState
     */
    constructor(
        public readonly $matcherId: string,
        public readonly $matched: string,
        public readonly $offset: number,
        public readonly $context: {}) {
    }

    public abstract addOffset(additionalOffset: number): PatternMatch;

    // how do I specify, an object whose properties are of type PatternMatch?
    public submatches() {
        return {};
    }

}

export function isPatternMatch(mpr: MatchPrefixResult): mpr is PatternMatch {
    return (mpr as PatternMatch).$matched !== undefined;
}

export class TerminalPatternMatch extends PatternMatch {

    constructor(
        matcherId: string,
        matched: string,
        offset: number,
        public readonly $value: any,
        context: {}) {

        super(matcherId, matched, offset, context);
    }

    public addOffset(additionalOffset: number) {
        // at this point the $resultingInputState isn't really valid
        // anymore. Which leads to the question: does it make sense to
        // save that? I understand returning it from the initial match,
        // but saving it beyond that seems like a bad idea. We might want
        // to separate that out. -- to rod from jess
        return new TerminalPatternMatch(
            this.$matcherId,
            this.$matched,
            this.$offset + additionalOffset,
            this.$value,
            this.$context);
    }

}

/**
 * Return when an optional matcher matches
 */
export class UndefinedPatternMatch extends PatternMatch {

    public $value = undefined;

    constructor(
        matcherId: string,
        offset: number) {

        super(matcherId, "", offset, {});
    }

    public addOffset(additionalOffset: number) {
        return new UndefinedPatternMatch(
            this.$matcherId, this.$offset + additionalOffset);
    }

}

/**
 * Properties we add to a matched node
 */
export interface MatchInfo {

    $match: PatternMatch;

}

/**
 * Suffix for properties parallel to string properties that we can't enrich,
 * as they aren't objects
 * @type {string}
 */
export const MATCH_INFO_SUFFIX = "$match";

/**
 * Represents a complex pattern match. Sets properties to expose structure.
 * In the case of string properties, where we can't add a $match, we expose a parallel
 * <propertyName>$match property with that information.
 */
export class TreePatternMatch extends PatternMatch {

    public readonly $value;

    constructor(
        $matcherId: string,
        $matched: string,
        $offset: number,
        public $matchers: Matcher[],
        public $subMatches: PatternMatch[],
        context: {}) {

        super($matcherId, $matched, $offset, context);
        this.$value = {};
        // Copy top level context properties
        // tslint:disable-next-line:forin
        for (const p in context) {
            this[p] = context[p];
        }

        // TODO address code duplication with prepare method
        for (let i = 0; i < $subMatches.length; i++) {
            this.prepareMatch($matchers[i].name, $subMatches[i]);
            const value = $subMatches[i].$value;
            (this as any)[$matchers[i].name] = value;
            this.$value[$matchers[i].name] = value;
            if (typeof value === "object") {
                const mn = this.$value[$matchers[i].name] as MatchInfo;
                mn.$match = $subMatches[i];
            } else {
                this.$value[$matchers[i].name + MATCH_INFO_SUFFIX] = $subMatches[i];
            }
        }
    }

    public addOffset(additionalOffset: number) {
        // at this point the $resultingInputState isn't really valid
        // anymore. Which leads to the question: does it make sense to
        // save that? I understand returning it from the initial match,
        // but saving it beyond that seems like a bad idea. We might want
        // to separate that out. -- to rod from jess
        return new TreePatternMatch(
            this.$matcherId,
            this.$matched,
            this.$offset + additionalOffset,
            this.$matchers,
            this.$subMatches.map(m => m.addOffset(additionalOffset)),
            context);
    }

    public submatches() {
        const output = {};
        for (let i = 0; i < this.$subMatches.length; i++) {
            output[this.$matchers[i].name] = this.$subMatches[i];
        }
        return output;
    }

    private prepareMatch(name: string, pm: PatternMatch) {
        const pma = pm as any;
        (pm as any)[name] = pm.$matched;
        if (pma.subMatchers) {
            for (let i = 0; i < pma.subMatches.length; i++) {
                this.prepareMatch(pma.matchers[i].name, pma.subMatches[i]);
                (this as any)[pma.matchers[i].name] = pma.subMatches[i].$value;
                if (typeof pma.subMatches[i].$value !== "string") {
                    (this as any)[pma.matchers[i].name].$match = pma.subMatches[i];
                }
                const value = pma.subMatches[i].$value;
                this.$value[pma.matchers[i].name] = value;
                if (typeof value === "object") {
                    const mn = value as MatchInfo;
                    mn.$match = pma.subMatches[i].$matched;
                } else {
                    this.$value[pma.matchers[i].name + MATCH_INFO_SUFFIX] = pma.subMatches[i];
                }
            }
        }
        return pm;
    }

}
