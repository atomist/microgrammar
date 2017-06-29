import { isConcat, toMatchingLogic } from "./Concat";
import { Config, Configurable, DefaultConfig } from "./Config";
import { InputState } from "./InputState";
import { MatchingLogic} from "./Matchers";
import { MatchPrefixResult } from "./MatchPrefixResult";
import { DismatchReport, isPatternMatch, PatternMatch, TerminalPatternMatch } from "./PatternMatch";
import { readyToMatch } from "./Whitespace";

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

    public matchPrefix(is: InputState, context: {}): MatchPrefixResult {
        let currentInputState = is;
        const matches: PatternMatch[] = [];
        let matched = "";
        while (!currentInputState.exhausted()) {
            const eat = readyToMatch(currentInputState, this.config);
            currentInputState = eat[1];
            matched += eat[0];

            const contextToUse = isConcat(this.matcher) ? {} : context;

            const match = this.matcher.matchPrefix(currentInputState, contextToUse);
            if (!isPatternMatch(match)) {
                break;
            } else {
                currentInputState = currentInputState.consume(match.$matched);
                matches.push(match);
                matched += match.$matched;
            }

            if (this.sepMatcher) {
                const eaten = readyToMatch(currentInputState, this.config);
                currentInputState = eaten[1];
                matched += eaten[0];
                const sepMatch = this.sepMatcher.matchPrefix(currentInputState, context);
                if (isPatternMatch(sepMatch)) {
                    currentInputState = currentInputState.consume(sepMatch.$matched);
                    matched += (sepMatch as PatternMatch).$matched;
                } else {
                    break;
                }
            }
        }

        const values = matches.map(m =>
            (typeof m.$value === "object") ?
                m.$context :
                m.$value,
        );

        return (matches.length >= this.min) ?
            new TerminalPatternMatch(this.$id,
                matched,
                is.offset,
                values,
                context) :
            new DismatchReport(this.$id, is.offset, context);
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
