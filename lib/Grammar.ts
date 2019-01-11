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
    matchIterator(input: string | InputStream, parseContext?, l?: Listeners): Iterable<PatternMatch>;

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
    exactMatch(input: string | InputStream, parseContext?, l ?: Listeners): PatternMatch & T | DismatchReport;

}

/**
 * Object used to define a microgrammar
 */
export interface MicrogrammarDefinition<T> {

    /**
     * Expression is of form "method ${name}(): ${returnType}".
     */
    expression?: string;

    /**
     * Definitions of the productions in this grammar
     */
    terms?: TermsDefinition<T>;
}

/**
 * Create a microgrammar with typed properties according
 * to the given interface.
 * If the definitions aren't nested, infer string type
 * @param definition
 * @return {Grammar<T>}
 */
export function microgrammar<T>(definition: MicrogrammarDefinition<T>): Grammar<T> {
    if (!definition.expression && !definition.terms) {
        throw new Error("At leat one of string and terms must be supplied to construct a microgrammar");
    }
    if (!!definition.expression) {
        return Microgrammar.fromString(definition.expression, definition.terms);
    }
    return Microgrammar.fromDefinitions(definition.terms);
}

/**
 * Create a microgrammar with inferred interface taking properties of type "any" from definitions.
 * Use fromDefinitions for stronger typing.
 * If the definitions aren't nested, infer string type
 * @return {Grammar<T>}
 */

export function simpleMicrogrammar<T>(definition: MicrogrammarDefinition<T>): Grammar<AnyKeysOf<T>> {
    return microgrammar(definition);
}
