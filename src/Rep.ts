import { Config, Configurable, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { MatchingLogic} from "./Matchers";
import { isConcat, toMatchingLogic } from "./matchers/Concat";
import { isSuccessfulMatch } from "./MatchPrefixResult";
import {MatchFailureReport, MatchPrefixResult, matchPrefixSuccess} from "./MatchPrefixResult";
import {  PatternMatch, TerminalPatternMatch } from "./PatternMatch";

import { readyToMatch } from "./internal/Whitespace";

/**
 * Handle repetition, with or without a separator.
 * Prefer subclasses for simplicity and clarity.
 * By default, match zero or more times without a separator
 */
export class Repetition implements MatchingLogic, Configurable {

    private matcher: MatchingLogic;

    private sepMatcher: MatchingLogic;

    private config: Config = DefaultConfig;

    // tslint:disable-next-line:member-ordering
    public $id = `Rep[${this.matcher}:min=${this.min},sep=[${this.sep}]`;

    /**
     * Generic rep support. Normally use subclasses.
     * @param o matcher
     * @param min mininum number of times the matcher must match for this to be considered a match. Default 0
     * @param sep if this is provided it indicates that this is a rep sep and it is the delimiter
     */
    constructor(o: any, public min: number = 0, public sep?: any) {
        this.matcher = toMatchingLogic(o);
        if (sep) {
            this.sepMatcher = toMatchingLogic(sep);
        }
    }

    public withConfig(config: Config): this {
        this.config = config;
        return this;
    }

    public canStartWith(char: string): boolean {
        return (this.min === 0) ?
            true :
            !this.matcher.canStartWith || this.matcher.canStartWith(char);
    }

    get requiredPrefix(): string {
        return (this.min === 0) ?
            undefined :
            this.matcher.requiredPrefix;
    }

    public matchPrefix(is: InputState, thisMatchContext, parseContext): MatchPrefixResult {
        let currentInputState = is;
        const matches: PatternMatch[] = [];
        let matched = "";
        while (!currentInputState.exhausted()) {
            const eat = readyToMatch(currentInputState, this.config);
            currentInputState = eat.state;
            matched += eat.skipped;

            const result = this.matcher.matchPrefix(currentInputState, thisMatchContext, parseContext);
            if (!isSuccessfulMatch(result)) {
                break;
            } else {
                const match = result.match;
                if (match.$matched === "") {
                    throw new Error(`Matcher with id ${this.matcher.$id} within rep matched the empty string.\n` +
                     `I do not think this grammar means what you think it means`);
                }
                currentInputState = currentInputState.consume(match.$matched);
                matches.push(match);
                matched += match.$matched;
            }

            if (this.sepMatcher) {
                const eaten = readyToMatch(currentInputState, this.config);
                currentInputState = eaten.state;
                matched += eaten.skipped;
                const sepMatchResult = this.sepMatcher.matchPrefix(currentInputState, thisMatchContext, parseContext);
                if (isSuccessfulMatch(sepMatchResult)) {
                    const sepMatch = sepMatchResult.match;
                    currentInputState = currentInputState.consume(sepMatch.$matched);
                    matched += (sepMatch as PatternMatch).$matched;
                } else {
                    break;
                }
            }
        }

        const values = matches.map(m =>
            (typeof m.$value === "object") ?
                m :
                m.$value,
        );

        return (matches.length >= this.min) ?
            matchPrefixSuccess(new TerminalPatternMatch(this.$id,
                matched,
                is.offset,
                values)) :
            new MatchFailureReport(this.$id, is.offset, {});
    }
}

/**
 * Match 0 or more times, without a separator
 */
export class Rep extends Repetition {

    constructor(o: any) {
        super(o, 0);
    }
}

/**
 * Match 1 or more times
 */
export class Rep1 extends Repetition {

    constructor(o: any) {
        super(o, 1);
    }
}

export class RepSep extends Repetition {

    constructor(o: any, sep: any) {
        super(o, 0, sep);
    }
}

export class Rep1Sep extends Repetition {

    constructor(o: any, sep: any) {
        super(o, 1, sep);
    }
}
