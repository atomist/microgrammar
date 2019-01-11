import { Listeners } from "./InputState";
import { Term } from "./Matchers";
import { TermDef } from "./matchers/Concat";
import {
    DismatchReport,
    PatternMatch,
} from "./PatternMatch";

import { InputStream } from "./spi/InputStream";

import {
    SkipCapable,
    WhiteSpaceHandler,
} from "./Config";
import { Microgrammar } from "./Microgrammar";

export type AllowableTermDef<PARAMS> = (TermDef | ((ctx: PARAMS & any) => any) | { [index: string]: any });

export type TermsDefinition<PARAMS, K extends keyof PARAMS = keyof PARAMS> =
    Record<K, AllowableTermDef<PARAMS>> & Partial<WhiteSpaceHandler> & Partial<SkipCapable>
    & { [index: string]: any };

export type AnyKeysOf<T, K extends keyof T = keyof T> = Record<K, any>;

/**
 * Central interface for microgrammar usage.
 * Represents a microgrammar that we can use to match input
 * in a string or stream.
 */
export interface Grammar<T> extends Term {

    /**
     * Generator for matching the given input.
     * @param {string | InputStream} input
     * @param {{}} parseContext
     * @param {Listeners} l
     * @return {Iterable<PatternMatch>}
     */
    matchIterator(input: string | InputStream, parseContext?: object, l?: Listeners): Iterable<PatternMatch>;

    /**
     * Convenience method to find matches. Note that this will parse the entire input in one pass.
     * Use matchIterator if you are likely to try to stop part-way through, or want to be
     * kinder to the event loop.
     * @param input
     * @param parseContext context for the whole parsing operation
     * @param l listeners observing input characters as they are read
     * @return {PatternMatch[]}
     */
    findMatches(input: string | InputStream, parseContext?: object, l?: Listeners): Array<T & PatternMatch>;

    /**
     * Convenient method to find the first match, or null if not found.
     * Stops searching after the first match.
     * @param input
     * @param l listeners observing input characters as they are read
     * @returns {PatternMatch[]}
     */
    firstMatch(input: string | InputStream, l?: Listeners): PatternMatch & T | null;

    /**
     * Return a match if it explains the whole of the input.
     * This style of usage is more like a traditional parser,
     * building an AST for a whole file.
     * @param input
     * @param parseContext context for the whole parsing operation
     * @param l listeners observing input characters as they are read
     * @return {PatternMatch&T}
     */
    exactMatch(input: string | InputStream, parseContext?: object, l ?: Listeners): PatternMatch & T | DismatchReport;

}

/**
 * Object used to define a microgrammar
 */
export interface MicrogrammarDefinition<T> {

    /**
     * Phrase defining how the terms should appear, including
     * literals, if specified.
     * A phrase is of form "method ${name}(): ${returnType}".
     */
    phrase?: string;

    /**
     * Definitions of the productions in this grammar
     */
    terms?: TermsDefinition<T>;
}

/**
 * Create a microgrammar return matches with properties according
 * to the given interface.
 * @param definition full definition or terms definition
 * @return {Grammar<T>}
 */
export function microgrammar<T>(definition: MicrogrammarDefinition<T> | TermsDefinition<T>): Grammar<T> {
    if (!definition.phrase && !definition.terms) {
        return Microgrammar.fromDefinitions(definition as any);
    }
    if (!!definition.phrase) {
        return Microgrammar.fromString(definition.phrase, definition.terms);
    }
    return Microgrammar.fromDefinitions(definition.terms);
}

/**
 * Create a microgrammar with return matches implementing an inferred interface
 * taking properties of type "any" from definitions.
 * Use microgrammar for stronger typing.
 * @return {Grammar<T>}
 */
export function simpleMicrogrammar<T>(definition: MicrogrammarDefinition<T> | TermsDefinition<T>): Grammar<AnyKeysOf<T>> {
    return microgrammar(definition);
}
