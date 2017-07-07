import {Matcher} from "./Matchers";

/**
 * Returned when we failed to match prefix
 */

export interface DismatchReport {

    description: string;
}

/**
 * Represents a successful match.
 */
export abstract class PatternMatch {

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
                public readonly $offset: number) {
    }

    /**
     * Return just the structure that was matched, throwing away offset and matcher information.
     * This is useful if you want to store PatternMatches after you're done with their internal information.
     */
    public matchedStructure<T>(): T {
        return justTheData(this);
    }

}

export function isPatternMatch(mpr: PatternMatch | DismatchReport): mpr is PatternMatch {
    return mpr != null && mpr !== undefined && (mpr as PatternMatch).$matched !== undefined;
}

/**
 * Simple pattern pattern. No submatches.
 */
export class TerminalPatternMatch extends PatternMatch {

    public terminalness = true;

    constructor(matcherId: string,
                matched: string,
                offset: number,
                public readonly $value: any) {
        super(matcherId, matched, offset);
    }

}

/**
 * Return when an optional matcher matches
 */
export class UndefinedPatternMatch extends PatternMatch {

    public $value = undefined;

    constructor(matcherId: string,
                offset: number) {

        super(matcherId, "", offset);
    }
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

    // JESS: can we put the matcher bits in a $valueMatchers
    // and then not have a $value

    public readonly $value;

    constructor($matcherId: string,
                $matched: string,
                $offset: number,
                $matchers: Matcher[],
                $subMatches: PatternMatch[],
                context: {}) {
        // JESS: I think the context processing should be at this level
        // only TreePatternMatches generate context

        super($matcherId, $matched, $offset);
        this.$value = {};

        // Copy top level context properties
        for (const p in context) {
            if (!isSpecialMember(p) && typeof context[p] !== "function") {
                this[p] = context[p];
            }
        }

        for (let i = 0; i < $subMatches.length; i++) {
            const match = $subMatches[i];
            const name = $matchers[i].name;
            if (!isSpecialMember(name)) {
                const value = $subMatches[i].$value;
                this.$value[$matchers[i].name] = value;
                if (isTreePatternMatch(match)) {
                    this[name] = match;
                } else {
                    // if the context defined it already, let that stand
                    if (this[name] === undefined) {
                        this[name] = value;
                    }
                    // We've got nowhere to put the matching information on a simple value,
                    // so create a parallel property on the parent with an out of band name
                    this.$value[$matchers[i].name + MATCH_INFO_SUFFIX] = $subMatches[i];
                }
            }
        }
    }

    public submatches() {
        const output = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            if (key.charAt(0) !== "$") {
                const value = this[key];
                if (isPatternMatch(value)) {
                    output[key] = value;
                } else {
                    output[key] = this.$value[key + MATCH_INFO_SUFFIX];
                }
            }
        }
        return output;
    }

}

export function isTreePatternMatch(om: PatternMatch): om is TreePatternMatch {
    return om != null && (om as TreePatternMatch).submatches !== undefined;
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

function justTheData(match: object): any {
    if (Array.isArray(match)) {
        return match.map(m => justTheData(m));
    }

    if (typeof match !== "object") {
        return match;
    }
    const output = {}; // it is not a const, I mutate it, but tslint won't let me declare otherwise :-(
    for (const p in match) {
        if (!(p.indexOf("_") === 0 || p.indexOf("$") === 0 || typeof match[p] === "function")) {
            output[p] = justTheData(match[p]);
        }
    }
    return output;
}
