import { Matcher } from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";

/**
 * Returned when we failed to match prefix
 */

export interface DismatchReport {

    description: string;
}

export class MatchFailureReport implements MatchPrefixResult, MatchFailureReport {

    public constructor(public readonly $matcherId: string,
                       public readonly $offset: number,
                       $context: {},
                       private readonly cause?: string | MatchFailureReport) {
    }

    get description(): string {
        return `Match failed on ${this.$matcherId}: ${this.cause}`;
    }
}

/**
 * Represents a successful match.
 */
export abstract class PatternMatch implements MatchPrefixResult {

    /**
     * Value extracted from matcher.
     * @return the $value that is extracted from this matcher. May be a
     * scalar or an array, or a nested structure. May or not be the
     * same as $matched property.
     */
    public abstract $value: any;

    /**
     * Represents a match
     * @param $matcherId id of the matcher that matched
     * @param $matched the actual string content
     * @param $offset offset from 0 in input
     * @param $context context bound during the match
     */
    constructor(public readonly $matcherId: string,
                public readonly $matched: string,
                public readonly $offset: number,
                $context: {}) {
        // Copy top level context properties
        // tslint:disable-next-line:forin
        for (const p in $context) {
            if (!isSpecialMember(p)) {
                const val = $context[p];
                if (typeof val !== "function") {
                    this[p] = val;
                    if (this.$value && typeof this.$value === "object") {
                        this.$value[p] = val;
                    }
                }
            }
        }
    }

}

export function isPatternMatch(mpr: MatchPrefixResult | DismatchReport): mpr is PatternMatch {
    return mpr != null && (mpr as PatternMatch).$matched !== undefined;
}

/**
 * Simple pattern pattern. No submatches.
 */
export class TerminalPatternMatch extends PatternMatch {

    constructor(matcherId: string,
                matched: string,
                offset: number,
                public readonly $value: any,
                context: {}) {
        super(matcherId, matched, offset, context);
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
                (this as any)[$matchers[i].name].$match = $subMatches[i];
            } else {
                // We've got nowhere to put the matching information on a simple value,
                // so create a parallel property on the parent with an out of band name
                this.$value[$matchers[i].name + MATCH_INFO_SUFFIX] = $subMatches[i];
            }
        }
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

/**
 * Return true if the member has a special meaning,
 * rather than being bound to the context. For example,
 * is a veto function or a private property.
 * @param name member name to test
 * @return {boolean}
 */
export function isSpecialMember(name: string) {
    return name.indexOf("_") === 0;
}
