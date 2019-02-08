import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {
    isSuccessfulMatch,
    MatchFailureReport,
    MatchPrefixResult,
    matchPrefixSuccess,
} from "./MatchPrefixResult";
import {
    PatternMatch,
    TerminalPatternMatch,
} from "./PatternMatch";

import { WhiteSpaceHandler } from "./Config";
import { readyToMatch } from "./internal/Whitespace";
import { isSuccessfulMatchReport, MatchReport, matchReportFromFailureReport, matchReportFromSuccessfulMatch, toMatchPrefixResult, toPatternMatchOrDismatchReport } from "./MatchReport";

/**
 * Match zero or more of these
 * @param o matcher
 * @return {Rep1}
 */
export function zeroOrMore(o: any): Repetition {
    return new Rep(o);
}

/**
 * Match at least one of these
 * @param o matcher
 * @return {Rep1}
 */
export function atLeastOne(o: any): Repetition {
    return new Rep1(o);
}

/**
 * Handle repetition, with or without a separator.
 * Prefer subclasses for simplicity and clarity.
 * By default, match zero or more times without a separator
 */
export class Repetition implements MatchingLogic, WhiteSpaceHandler {

    public $consumeWhiteSpaceBetweenTokens = true;

    private readonly matcher: MatchingLogic;

    private readonly sepMatcher: MatchingLogic;

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

    get $id() {
        return `Rep[${this.matcher.$id}:min=${this.min},sep=[${this.sep}]`;
    }

    public consumeWhiteSpace(consumeWhiteSpaceBetweenTokens: boolean): this {
        this.$consumeWhiteSpaceBetweenTokens = consumeWhiteSpaceBetweenTokens;
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

    public matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}):
        MatchPrefixResult {
        return toMatchPrefixResult(this.matchPrefixReport(is, thisMatchContext, parseContext));
    }

    public matchPrefixReport(is: InputState, thisMatchContext, parseContext): MatchReport {
        let currentInputState = is;
        const matches: PatternMatch[] = [];
        let matched = "";
        const allResults: MatchPrefixResult[] = [];
        while (!currentInputState.exhausted()) {
            const eat = readyToMatch(currentInputState, this.$consumeWhiteSpaceBetweenTokens);
            currentInputState = eat.state;
            matched += eat.skipped;

            const result = this.matcher.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
            const resultMpr = toMatchPrefixResult(result);
            allResults.push(resultMpr);
            if (!isSuccessfulMatchReport(result)) {
                break;
            } else {
                const match = result.toPatternMatch();
                if (match.$matched === "") {
                    throw new Error(`Matcher with id ${this.matcher.$id} within rep matched the empty string.\n` +
                        `I do not think this grammar means what you think it means`);
                }
                currentInputState = currentInputState.consume(match.$matched, `Rep matched [${match.$matched}]`);
                matches.push(match);
                matched += match.$matched;
            }

            if (this.sepMatcher) {
                const eaten = readyToMatch(currentInputState, this.$consumeWhiteSpaceBetweenTokens);
                currentInputState = eaten.state;
                matched += eaten.skipped;
                const sepMatchResult = this.sepMatcher.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
                allResults.push(toMatchPrefixResult(sepMatchResult));
                if (isSuccessfulMatchReport(sepMatchResult)) {
                    const sepMatch = sepMatchResult.toPatternMatch();
                    currentInputState = currentInputState.consume(sepMatch.$matched, `Rep separator [${sepMatch.$matched}]`);
                    matched += (sepMatch).$matched;
                } else {
                    break;
                }
            }
        }

        const values = matches.map(m => m.$value);

        return (matches.length >= this.min) ?
            matchReportFromSuccessfulMatch(this, matchPrefixSuccess(new TerminalPatternMatch(this.$id,
                matched,
                is.offset,
                values))) :
            matchReportFromFailureReport(this, MatchFailureReport.from({
                $matcherId: this.$id,
                $offset: is.offset,
                $matched: matched,
                children: allResults,
            }));
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
