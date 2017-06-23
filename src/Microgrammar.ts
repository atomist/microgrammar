import { Concat } from "./Concat";
import { Config, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { InputStream } from "./InputStream";
import { MatchingLogic, Term } from "./Matchers";
import { MatchingMachine } from "./MatchingMachine";
import { MicrogrammarSpecParser } from "./MicrogrammarSpecParser";
import { MatchUpdater, MicrogrammarUpdates } from "./MicrogrammarUpdates";
import { PatternMatch } from "./PatternMatch";

/**
 * Represents a microgrammar that we can use to match input
 * in a string or stream.
 * Modifications are tracked and we can get an updated string
 * afterwards.
 */
export class Microgrammar<T> implements Term {

    public static updateableMatch<T>(match: T & PatternMatch, content: string): T & MatchUpdater {
        return new MicrogrammarUpdates().updateableMatch(match, content);
    }

    public static fromDefinitions<T>(definitions: {}, config: Config = DefaultConfig): Microgrammar<T> {
        return new Microgrammar<T>(new Concat(definitions, config), config);
    }

    public static fromString<T>(
        spec: string,
        components: object = {},
        config: Config = DefaultConfig): Microgrammar<T> {

        return new MicrogrammarSpecParser().fromString<T>(spec, components, config);
    }

    public $id;

    public definitions = this.matcher.definitions;

    constructor(public matcher: Concat, private config: Config = DefaultConfig) { }

    /**
     * Convenience method to find matches without the ability to update them
     * @param input
     * @param stopAfterMatch() function that can cause matching to stop after a given match.
     * Often used to stop after one.
     * @return {PatternMatch[]}
     */
    public findMatches(
        input: string | InputStream | InputState,
        stopAfterMatch: (PatternMatch) => boolean = pm => false): Array<T & PatternMatch> {

        class LazyMatcher extends MatchingMachine {

            public matches: PatternMatch[] = [];

            constructor(private ml: MatchingLogic) {
                super(ml);
            }

            protected onMatch(pm: PatternMatch): MatchingLogic {
                this.matches.push(pm);
                return stopAfterMatch(pm) ? undefined : this.ml;
            }
        }
        const lm = new LazyMatcher(this.matcher).withConfig(this.config);
        lm.consume(input);
        return lm.matches as Array<T & PatternMatch>;
    }

    /**
     * Convenient method to find the first match, or null if not found.
     * Stops searching after the first match.
     * @param input
     * @returns {PatternMatch[]}
     */
    public firstMatch(input: string | InputStream | InputState): PatternMatch & T {
        const found = this.findMatches(input, pm => true);
        return found.length > 0 ? found[0] : null;
    }

}
