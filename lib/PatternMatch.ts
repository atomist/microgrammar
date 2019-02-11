import { Matcher } from "./Matchers";

/**
 * Returned when we failed to match prefix
 */

export interface DismatchReport {

    description: string;
}

/**
 * Represents a successful match. Contains microgrammar information
 * in fields with names beginning with $ and any user-defined fields.
 * To ensure this separation works cleanly, not bind user data to fields beginning with $.
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
     */
    constructor(public readonly $matcherId: string,
        public $matched: string,
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
    return mpr != null && mpr !== undefined && (mpr as PatternMatch).$value !== undefined;
}

/**
 * Represents a complex pattern match. Sets properties to expose structure.
 * In the case of string properties, where we can't add provide the whole PatternMatch,
 * we store that in a parallel object $valueMatches
 * @Deprecated
 * Prefer SuccessfulMatchReport; use matchReport.toValueStructure() to get the object structure
 * or matchReport.toParseTree() to learn about how it matches
 */
export abstract class TreePatternMatch extends PatternMatch {

    public readonly $valueMatches = {};

    public readonly $value: {};

    public abstract submatches(): object;

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
