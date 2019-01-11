import { Listeners } from "./InputState";
import { Term } from "./Matchers";
import { TermDef } from "./matchers/Concat";
import { DismatchReport, PatternMatch } from "./PatternMatch";

import { InputStream } from "./spi/InputStream";

import { SkipCapable, WhiteSpaceHandler } from "./Config";

export type AllowableTermDef<PARAMS> = (TermDef | ((ctx: PARAMS & any) => any) | { [index: string]: any });

export type TermsDefinition<PARAMS, K extends keyof PARAMS = keyof PARAMS> =
    Record<K, AllowableTermDef<PARAMS>> & Partial<WhiteSpaceHandler> & Partial<SkipCapable>
    & { [index: string]: any };

/**
 * Record with values of any type for every key K found in T.
 * Convenient inferred return type for microgrammar.
 */
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
