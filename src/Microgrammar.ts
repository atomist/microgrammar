import { Concat, toMatchingLogic } from "./Concat";
import { Config, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { MatchingLogic, Term } from "./Matchers";
import {DismatchReport, isPatternMatch, PatternMatch} from "./PatternMatch";

import { InputStream } from "./spi/InputStream";
import { StringInputStream } from "./spi/StringInputStream";

import { ChangeSet } from "./internal/ChangeSet";
import { DefaultInputState } from "./internal/DefaultInputState";
import { exactMatch } from "./internal/ExactMatch";
import { InputStateManager } from "./internal/InputStateManager";
import { MicrogrammarSpecParser } from "./internal/MicrogrammarSpecParser";
import { MatchUpdater, MicrogrammarUpdates } from "./internal/MicrogrammarUpdates";
import { readyToMatch } from "./internal/Whitespace";

/**
 * Holds a set of updatable matches
 */
export class Updatable<T> {

    public readonly matches: T[];

    private cs: ChangeSet;

    constructor(hits: Array<T & PatternMatch>, content: string) {
        const mut = new MicrogrammarUpdates();
        this.cs = new ChangeSet(content);
        this.matches = hits.map(m => mut.updatableMatch(m, this.cs));
    }

    public updated(): string {
        return this.cs.updated();
    }
}

/**
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

    public static fromDefinitions<T>(definitions: {}, config: Config = DefaultConfig): Microgrammar<T> {
        return new Microgrammar<T>(new Concat(definitions, config), config);
    }

    public static fromString<T>(spec: string,
                                components: object = {},
                                config: Config = DefaultConfig): Microgrammar<T> {
        return new Microgrammar<T>(
             new MicrogrammarSpecParser().fromString(spec, components, config), config);
    }

    public $id;

    public definitions = this.matcher.definitions;

    constructor(public matcher: Concat, private config: Config = DefaultConfig) {
    }

    /**
     * Convenience method to find matches without the ability to update them
     * @param input
     * @param stopAfterMatch() function that can cause matching to stop after a given match.
     * Often used to stop after one.
     * @return {PatternMatch[]}
     */
    public findMatches(input: string | InputStream,
                       stopAfterMatch: (PatternMatch) => boolean = pm => false): Array<T & PatternMatch> {
        const lm = new LazyMatcher(this.matcher, stopAfterMatch).withConfig(this.config);
        lm.consume(input);
        return lm.matches as Array<T & PatternMatch>;
    }

    /**
     * Convenient method to find the first match, or null if not found.
     * Stops searching after the first match.
     * @param input
     * @returns {PatternMatch[]}
     */
    public firstMatch(input: string | InputStream): PatternMatch & T {
        const found = this.findMatches(input, pm => true);
        return found.length > 0 ? found[0] : null;
    }

    /**
     * Return a match if it explains the whole of the input.
     * This style of usage is more like a traditional parser,
     * building an AST for a whole file.
     * @param input
     * @return {PatternMatch&T}
     */
    public exactMatch(input: string | InputStream): PatternMatch & T | DismatchReport {
      return exactMatch<T>(this.matcher, input);
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
export abstract class MatchingMachine {

    protected config: Config = DefaultConfig;

    protected matcher: MatchingLogic;

    protected observer: MatchingLogic;

    /**
     * Create a new stateful matching machine
     * @param initialMatcher matcher to start using. This can be changed by the callback methods in this class
     * @param o optional observer
     */
    constructor(initialMatcher: any, o?: any) {
        this.matcher = toMatchingLogic(initialMatcher);
        if (o) {
            this.observer = toMatchingLogic(o);
        }
    }

    public withConfig(config: Config): this {
        this.config = config;
        return this;
    }

    /**
     * Stream-oriented matching. The observer can match in parallel with the main matcher.
     * @param input
     */
    public consume(input: string | InputStream): void {
        const omg = this.observer ? Microgrammar.fromDefinitions(this.observer) : undefined;

        let currentMatcher: MatchingLogic = this.matcher;
        const stream = toInputStream(input);
        const stateManager = new InputStateManager(stream);

        let currentInputState: InputState = new DefaultInputState(stateManager);
        while (currentMatcher && !currentInputState.exhausted()) {
            currentInputState = readyToMatch(currentInputState,
                this.config,
                currentMatcher,
                this.observer).state;

            const previousIs = currentInputState;
            const tryMatch =
                currentMatcher.matchPrefix(currentInputState, {});

            // We can't accept empty matches as genuine at this level:
            // For example, if the matcher is just a Rep or Alt
            if (isPatternMatch(tryMatch) && tryMatch.$matched !== "") {
                // Enrich with the name
                (tryMatch as any).$name = tryMatch.$matcherId;
                currentMatcher = toMatchingLogic(this.onMatch(tryMatch));
                currentInputState = currentInputState.consume(tryMatch.$matched);
            } else {
                // We didn't match. Discard the current input character and try again
                if (!currentInputState.exhausted()) {
                    currentInputState = currentInputState.advance();
                }
            }
            if (this.observer) {
                // There are two cases: If we matched, we need to look multiple times in the input
                if (isPatternMatch(tryMatch)) {
                    // TODO will this spoil offsets? Might want to create an input state
                    const matches = omg.findMatches(tryMatch.$matched);
                    for (const m of matches) {
                        currentMatcher = toMatchingLogic(this.observeMatch(m));
                    }
                } else {
                    const observerMatch = this.observer.matchPrefix(previousIs, {});
                    if (isPatternMatch(observerMatch)) {
                        currentMatcher = toMatchingLogic(this.observeMatch(observerMatch));
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
    protected observeMatch(pm): any {
        return this.matcher;
    }

    /**
     * React to a match. The return can change the matcher, or return the current matcher.
     * @param pm matcher
     */
    protected abstract onMatch(pm: PatternMatch): any;

}

function toInputStream(input: string | InputStream): InputStream {
    return (typeof input === "string") ?
        new StringInputStream(input) :
        input;
}

class LazyMatcher extends MatchingMachine {

    public matches: PatternMatch[] = [];

    constructor(ml: MatchingLogic, private stopAfterMatch: (PatternMatch) => boolean) {
        super(ml);
    }

    protected onMatch(pm: PatternMatch): MatchingLogic {
        this.matches.push(pm);
        return this.stopAfterMatch(pm) ? undefined : this.matcher;
    }
}
