import {
    InputState,
    Listeners,
} from "./InputState";
import {
    MatchingLogic,
    Term,
} from "./Matchers";
import {
    Concat,
    Concatenation,
    TermDef,
    toMatchingLogic,
} from "./matchers/Concat";
import { isSuccessfulMatch } from "./MatchPrefixResult";
import {
    DismatchReport,
    PatternMatch,
} from "./PatternMatch";

import { InputStream } from "./spi/InputStream";
import { StringInputStream } from "./spi/StringInputStream";

import {
    SkipCapable,
    WhiteSpaceHandler,
} from "./Config";
import { FromStringOptions } from "./FromStringOptions";
import { ChangeSet } from "./internal/ChangeSet";
import { DefaultInputState } from "./internal/DefaultInputState";
import { exactMatch } from "./internal/ExactMatch";
import { InputStateManager } from "./internal/InputStateManager";
import { MicrogrammarSpecParser } from "./internal/MicrogrammarSpecParser";
import {
    MatchUpdater,
    MicrogrammarUpdates,
} from "./internal/MicrogrammarUpdates";
import { readyToMatch } from "./internal/Whitespace";

/**
 * Holds a set of updatable matches
 */
export class Updatable<T> {

    public readonly matches: T[];

    private readonly cs: ChangeSet;

    constructor(hits: Array<T & PatternMatch>, content: string) {
        const mut = new MicrogrammarUpdates();
        this.cs = new ChangeSet(content);
        this.matches = hits.map(m => mut.updatableMatch(m, this.cs));
    }

    public updated(): string {
        return this.cs.updated();
    }
}

export type AllowableTermDef<PARAMS> = (TermDef | ((ctx: PARAMS & any) => any) | { [index: string]: any });

export type TermsDefinition<PARAMS, K extends keyof PARAMS = keyof PARAMS> =
    Record<K, AllowableTermDef<PARAMS>> & Partial<WhiteSpaceHandler> & Partial<SkipCapable>
    & { [index: string]: any };

export type AnyKeysOf<T, K extends keyof T = keyof T> = Record<K, any>;

/**
 * Central class for microgrammar usage.
 * Represents a microgrammar that we can use to match input
 * in a string or stream.
 * Modifications are tracked and we can get an updated string
 * afterwards.
 */
export class Microgrammar<T> implements Term {

    /**
     * Make this match transparently updatable using property mutation
     * @param match match to make updatable
     * @param content the match is within
     * @return {T&MatchUpdater}
     */
    public static updatableMatch<T>(match: T & PatternMatch, content: string): T & MatchUpdater {
        return new MicrogrammarUpdates().updatableMatch(match, content);
    }

    /**
     * Make these matches transparently updatable using property mutation
     * @param matches matches
     * @param content content the matches are within
     * @return {Updatable<T>}
     */
    public static updatable<T>(matches: Array<T & PatternMatch>,
                               content: string): Updatable<T> {
        return new Updatable<T>(matches, content);
    }

    /**
     * Create a microgrammar with typed properties according
     * to the given interface.
     * If the definitions aren't nested, infer string type
     * @param {TermsDefinition<T>} definitions
     * @return {Microgrammar<T>}
     */
    public static fromDefinitions<T = any>(definitions: TermsDefinition<T>): Microgrammar<T> {
        return new Microgrammar<T>(Concat.of(definitions));
    }

    /**
     * Create a microgrammar with inferred interface taking properties of type "any" from definitions.
     * Use fromDefinitions for stronger typing.
     * If the definitions aren't nested, infer string type
     * @param {TermsDefinition<T>} definitions
     * @return {Microgrammar<T>}
     */
    public static fromDefinitionsAs<T = any>(definitions: TermsDefinition<T>): Microgrammar<AnyKeysOf<T>> {
        return this.fromDefinitions(definitions);
    }

    /**
     * Create a microgrammar with string variables.
     * String is of form "method ${name}(): ${returnType}".
     * Definitions should be provided for each string variable.
     * Use fromDefinitions to achieve nesting or non-string typing.
     * If the definitions aren't nested, infer string type
     * @return {Microgrammar<T>}
     */
    public static fromString<T = any>(spec: string,
                                      components: TermsDefinition<T> = {} as any,
                                      options: FromStringOptions = {}): Microgrammar<T> {
        return new Microgrammar<T>(
            new MicrogrammarSpecParser().fromString(spec, components, options));
    }

    /**
     * Create a microgrammar with string variables with automatic typing as in
     * fromDefinitionsAs.
     * String is of form "method ${name}(): ${returnType}".
     * Definitions should be provided for each string variable.
     * Use fromDefinitions to achieve nesting or non-string typing.
     * If the definitions aren't nested, infer string type
     * @return {Microgrammar<T>}
     */
    public static fromStringAs<T = any>(spec: string,
        components: TermsDefinition<T> = {} as any,
        options: FromStringOptions = {}): Microgrammar<AnyKeysOf<T>> {
        return this.fromString(spec, components, options);
    }

    public readonly $id: string;

    public readonly definitions = this.matcher.definitions;

    /**
     * Generator for matching the given input.
     * @param {string | InputStream} input
     * @param {{}} parseContext
     * @param {Listeners} l
     * @return {Iterable<PatternMatch>}
     */
    public matchIterator(input: string | InputStream, parseContext = {}, l?: Listeners): Iterable<PatternMatch> {
        return matchesIn(this, input, parseContext, l);
    }

    constructor(public matcher: Concatenation) {
    }

    /**
     * Convenience method to find matches without the ability to update them
     * @param input
     * @param stopAfterMatch() function that can cause matching to stop after a given match.
     * Often used to stop after one.
     * @param parseContext context for the whole parsing operation
     * @param l listeners observing input characters as they are read
     * @return {PatternMatch[]}
     */
    public findMatches(input: string | InputStream,
                       parseContext?: {},
                       l?: Listeners,
                       stopAfterMatch: (pm: PatternMatch) => boolean = () => false): Array<T & PatternMatch> {
        const lm = new LazyMatcher(this.matcher, stopAfterMatch);
        lm.consume(input, parseContext, l);
        return lm.matches as Array<T & PatternMatch>;
    }

    /**
     * Parallel to findMatches, but returns a Promise
     * @param {string | InputStream} input
     * @param {{}} parseContext
     * @return {Promise<Array<T & PatternMatch>>}
     */
    public async findMatchesAsync(input: string | InputStream,
                                  parseContext?: {}): Promise<Array<T & PatternMatch>> {
        const matches = [];
        for (const m of matchesIn(this.matcher, input, parseContext)) {
            matches.push(m);
        }
        return matches as Array<T & PatternMatch>;
    }

    /**
     * Convenient method to find the first match, or null if not found.
     * Stops searching after the first match.
     * @param input
     * @param l listeners observing input characters as they are read
     * @returns {PatternMatch[]}
     */
    public firstMatch(input: string | InputStream, l?: Listeners): PatternMatch & T | null {
        const found = this.findMatches(input, {}, l, pm => true);
        return found.length > 0 ? found[0] : null;
    }

    /**
     * Return a match if it explains the whole of the input.
     * This style of usage is more like a traditional parser,
     * building an AST for a whole file.
     * @param input
     * @param parseContext context for the whole parsing operation
     * @param l listeners observing input characters as they are read
     * @return {PatternMatch&T}
     */
    public exactMatch(input: string | InputStream, parseContext = {}, l?: Listeners): PatternMatch & T | DismatchReport {
        return exactMatch<T>(this.matcher, input, parseContext, l);
    }

}

/**
 * Single use, usually stateful, class for matching input.
 * Offers the ability to observe a match, as well as match one,
 * and to change the matcher in use depending on observation and matching.
 * E.g. it's possible to choose to start matching pattern B after finding pattern A,
 * or after *seeing* pattern A, even if starting off matching something else.
 * This enables us, for example, to parse XML, with the observer watching element
 * open and close to maintain the current path, while the matcher matches anything we want.
 */
export class MatchingMachine {

    protected matcher: MatchingLogic;

    protected observer: MatchingLogic;

    private readonly omg: Microgrammar<any>;

    /**
     * Create a new stateful matching machine
     * @param initialMatcher matcher to start using. This can be changed by the callback methods in this class
     * @param o optional observer
     */
    constructor(initialMatcher: any, o?: any) {
        this.matcher = toMatchingLogic(initialMatcher);
        if (!!o) {
            this.observer = toMatchingLogic(o);
        }
        this.omg = this.observer ? Microgrammar.fromDefinitions(this.observer as any) : undefined;
    }

    /**
     * Stream-oriented matching. The observer can match in parallel with the main matcher.
     * @param input
     * @param parseContext context for the whole parsing operation
     * @param l listeners observing input characters as they are read
     */
    public consume(input: string | InputStream, parseContext = {}, l?: Listeners): void {
        let currentMatcher: MatchingLogic = this.matcher;
        const stream = toInputStream(input);
        const stateManager = new InputStateManager(stream);

        let currentInputState: InputState = new DefaultInputState(stateManager, 0, l);
        while (currentMatcher && !currentInputState.exhausted()) {
            currentInputState = readyToMatch(currentInputState,
                (this.matcher as any).$consumeWhiteSpaceBetweenTokens === true,
                currentMatcher,
                this.observer).state;

            const previousIs = currentInputState;
            const tryMatch = currentMatcher.matchPrefix(currentInputState, {}, parseContext);

            // We can't accept empty matches as genuine at this level:
            // For example, if the matcher is just a Rep or Alt
            if (isSuccessfulMatch(tryMatch) && tryMatch.$matched !== "") {
                const match = tryMatch.match;
                // Enrich with the name
                (match as any).$name = match.$matcherId;
                currentMatcher = toMatchingLogic(this.onMatch(match));
                currentInputState = currentInputState.consume(match.$matched,
                    `Microgrammar after match on [${match.$matched} from [${match.$matcherId}]`);
            } else {
                // We didn't match. Discard the current input character and try again
                if (!currentInputState.exhausted()) {
                    currentInputState = currentInputState.advance();
                }
            }
            if (this.observer) {
                // There are two cases: If we matched, we need to look multiple times in the input
                if (isSuccessfulMatch(tryMatch) && this.omg) {
                    const matches = this.omg.findMatches(tryMatch.$matched);
                    for (const m of matches) {
                        currentMatcher = toMatchingLogic(this.observeMatch(m));
                    }
                } else {
                    const observerMatch = this.observer.matchPrefix(previousIs, {}, parseContext);
                    if (isSuccessfulMatch(observerMatch)) {
                        currentMatcher = toMatchingLogic(this.observeMatch(observerMatch.match));
                    }
                }
            }

            // We can advance the window
            stateManager.dropLeft(currentInputState.offset);
        }   // while
    }

    /**
     * Observe a match. The return can change the matcher in use, or return the current matcher.
     * @param pm pattern to observe
     * @returns {MatchingLogic}
     */
    protected observeMatch(pm: PatternMatch): any {
        return this.matcher;
    }

    /**
     * React to a match. The return can change the matcher, or return the current matcher.
     * @param pm matcher
     */
    protected onMatch(pm: PatternMatch): any {
        return this.matcher;
    }

}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}

class LazyMatcher extends MatchingMachine {

    public matches: PatternMatch[] = [];

    constructor(ml: MatchingLogic, private readonly stopAfterMatch: (pm: PatternMatch) => boolean) {
        super(ml);
    }

    protected onMatch(pm: PatternMatch): MatchingLogic | undefined {
        this.matches.push(pm);
        return this.stopAfterMatch(pm) ? undefined : this.matcher;
    }
}

/**
 * Generator for matching the given input.
 * @param matcher
 * @param {string | InputStream} input
 * @param {{}} parseContext
 * @param {Listeners} l
 * @return {Iterable<PatternMatch>}
 */
export function* matchesIn(matcher: any, input: string | InputStream, parseContext = {}, l?: Listeners): Iterable<PatternMatch> {
    const matchingLogic = toMatchingLogic(matcher);
    const stream = toInputStream(input);
    const stateManager = new InputStateManager(stream);

    let currentInputState: InputState = new DefaultInputState(stateManager, 0, l);
    while (matchingLogic && !currentInputState.exhausted()) {
        currentInputState = readyToMatch(currentInputState,
            (matchingLogic as any).$consumeWhiteSpaceBetweenTokens === true,
            matchingLogic).state;

        const tryMatch = matchingLogic.matchPrefix(currentInputState, {}, parseContext);

        // We can't accept empty matches as genuine at this level:
        // For example, if the matcher is just a Rep or Alt
        if (isSuccessfulMatch(tryMatch) && tryMatch.$matched !== "") {
            const m = tryMatch.match;
            // Enrich with the name
            (m as any).$name = m.$matcherId;
            yield m;
            //  = toMatchingLogic(this.onMatch(match));
            currentInputState = currentInputState.consume(m.$matched,
                `Microgrammar after match on [${m.$matched} from [${m.$matcherId}]`);
        } else {
            // We didn't match. Discard the current input character and try again
            if (!currentInputState.exhausted()) {
                currentInputState = currentInputState.advance();
            }
        }

        // We can advance the window
        stateManager.dropLeft(currentInputState.offset);
    }
}
