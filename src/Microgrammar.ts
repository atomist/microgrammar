import { Concat } from "./Concat";
import { Config, DefaultConfig } from "./Config";
import { InputState, InputStateManager } from "./InputState";
import { InputStream } from "./InputStream";
import { isPatternMatch, PatternMatch } from "./PatternMatch";

import { ChangeSet } from "./ChangeSet";
import { MatchingLogic, Term } from "./Matchers";
import { MicrogrammarSpecParser } from "./MicrogrammarSpecParser";
import { MatchUpdater, MicrogrammarUpdates } from "./MicrogrammarUpdates";
import { StringInputStream } from "./StringInputStream";
import {readyToMatch } from "./Whitespace";

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

    public static updatableMatch<T>(match: T & PatternMatch, content: string): T & MatchUpdater {
        return new MicrogrammarUpdates().updatableMatch(match, content);
    }

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
        return new MicrogrammarSpecParser().fromString<T>(spec, components, config);
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

}

/**
 * Single use, usually stateful, class for matching input.
 * Offers the ability to observe a match, as well as match one,
 * and to change the matcher in use depending on obervation and matching.
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
        this.matcher = extractMatcher(initialMatcher);
        if (o) {
            this.observer = extractMatcher(o);
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

        let currentInputState: InputState = new InputState(stateManager);
        while (currentMatcher && !currentInputState.exhausted()) {
            currentInputState = readyToMatch(currentInputState,
                this.config,
                this.observer ? undefined : currentMatcher)[1];

            const previousIs = currentInputState;
            const tryMatch =
                currentMatcher.matchPrefix(currentInputState, {});

            // We can't accept empty matches as genuine at this level:
            // For example, if the matcher is just a Rep or Alt
            if (isPatternMatch(tryMatch) && tryMatch.$matched !== "") {
                // Enrich with the name
                (tryMatch as any).$name = tryMatch.$matcherId;
                currentMatcher = extractMatcher(this.onMatch(tryMatch));
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
                        currentMatcher = extractMatcher(this.observeMatch(m));
                    }
                } else {
                    const observerMatch = this.observer.matchPrefix(previousIs, {});
                    if (isPatternMatch(observerMatch)) {
                        currentMatcher = extractMatcher(this.observeMatch(observerMatch));
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

function extractMatcher(matcher: any): MatchingLogic {
    if (!matcher) {
        return matcher;
    }
    if ((matcher as MatchingLogic).matchPrefix) {
        return matcher as MatchingLogic;
    }
    if (matcher.matcher) {
        return matcher.matcher as MatchingLogic;
    }
    return new Concat(matcher);
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
