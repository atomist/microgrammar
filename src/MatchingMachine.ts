import { Concat } from "./Concat";
import { Config, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { InputStream } from "./InputStream";
import { MatchingLogic } from "./Matchers";
import { Microgrammar } from "./Microgrammar";
import { PatternMatch } from "./PatternMatch";
import { StringInputStream } from "./StringInputStream";
import { consumeWhitespace } from "./Whitespace";

/**
 * Single use, potentially stateful, class for matching input
 */
export abstract class MatchingMachine {

    protected config: Config = DefaultConfig;

    protected matcher: MatchingLogic;

    protected observer: MatchingLogic;

    constructor(m: any, o?: any) {
        this.matcher = extractMatcher(m);
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
    public consume(input: string | InputStream | InputState): void {

        const omg = this.observer ? Microgrammar.fromDefinitions(this.observer) : undefined;

        let currentMatcher: MatchingLogic = this.matcher;
        let currentInputState: InputState = toInputState(input);
        while (currentMatcher && !currentInputState.exhausted()) {
            if (this.config.consumeWhiteSpaceBetweenTokens) {
                currentInputState = consumeWhitespace(currentInputState)[1];
            }
            const previousIs = currentInputState;
            const tryMatch = currentMatcher.matchPrefix(currentInputState) as PatternMatch;
            if (tryMatch.$isMatch) {
                // Enrich with the name
                (tryMatch as any).$name = tryMatch.$matcherId;
                currentMatcher = extractMatcher(this.onMatch(tryMatch));
                currentInputState = currentInputState.consume(tryMatch.$matched);
            } else {
                // We didn't match. Discard the current input character and try again
                currentInputState = currentInputState.advance();
            }
            if (this.observer) {
                // There are two cases: If we matched, we need to look multiple times in the input
                if (tryMatch.$isMatch) {
                    // TODO will this spoil offsets? Might want to create an input state
                    const matches = omg.findMatches(tryMatch.$matched);
                    for (const m of matches) {
                        currentMatcher = extractMatcher(this.observeMatch(m));
                    }
                } else {
                    const observerMatch = this.observer.matchPrefix(previousIs);
                    if (observerMatch.$isMatch) {
                        currentMatcher = extractMatcher(this.observeMatch(observerMatch as PatternMatch));
                    }
                }
            }
        }
    }

    protected observeMatch(pm): any {
        return this.matcher;
    }

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

function toInputState(input: string | InputStream | InputState): InputState {
    if ((input as any).stream) {
        return input as InputState;
    }
    const is = (typeof input === "string") ?
        new StringInputStream(input) :
        input;
    return InputState.fromInputStream(is as InputStream);
}
