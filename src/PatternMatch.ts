import { Matcher } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";

/**
 * Returned when we failed to match prefix
 */
export class DismatchReport implements MatchPrefixResult {

    public constructor(public readonly $matcherId: string,
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
     * @param $matcherId id of the matcher that matched
     * @param $matched the actual string content
     * @param $offset
     * @param $context context bound during the match
     */
    constructor(public readonly $matcherId: string,
                public readonly $matched: string,
                public readonly $offset: number,
                public readonly $context: {}) {
        // Copy top level context properties
        // tslint:disable-next-line:forin
        for (const p in $context) {
            const val = $context[p];
            if (typeof val !== "function") {
                this[p] = val;
                if (this.$value && typeof this.$value === "object") {
                    this.$value[p] = val;
                }
            }
        }
    }

    public abstract addOffset(additionalOffset: number): PatternMatch;

    public submatches() {
        return {};
    }

}

export function isPatternMatch(mpr: MatchPrefixResult): mpr is PatternMatch {
    return mpr != null && (mpr as PatternMatch).$matched !== undefined;
}

export class TerminalPatternMatch extends PatternMatch {

    constructor(matcherId: string,
                matched: string,
                offset: number,
                public readonly $value: any,
                context: {}) {
        super(matcherId, matched, offset, context);
    }

    public addOffset(additionalOffset: number) {
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

    constructor(matcherId: string,
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

    constructor($matcherId: string,
                $matched: string,
                $offset: number,
                public $matchers: Matcher[],
                public $subMatches: PatternMatch[],
                context: {}) {

        super($matcherId, $matched, $offset, context);
        this.$value = {};

        for (let i = 0; i < $subMatches.length; i++) {
            const value = $subMatches[i].$value;
            this.$value[$matchers[i].name] = value;
            if (typeof value === "object") {
                if (!(this as any)[$matchers[i].name]) {
                    (this as any)[$matchers[i].name] = value;
                }
                const mn = this.$value[$matchers[i].name] as MatchInfo;
                mn.$match = $subMatches[i];
                (this as any)[$matchers[i].name].$match = $subMatches[i];
            } else {
                // We've got nowhere to put the matching information on a simple value,
                // so create a parallel property on the parent with an out of band name
                this.$value[$matchers[i].name + MATCH_INFO_SUFFIX] = $subMatches[i];
            }
        }
    }

    public addOffset(additionalOffset: number) {
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

}

export function isTreePatternMatch(mpr: MatchPrefixResult): mpr is TreePatternMatch {
    return mpr != null && (mpr as TreePatternMatch).$matchers !== undefined;
}
