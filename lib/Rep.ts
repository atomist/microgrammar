import { InputState } from "./InputState";
import { MatchingLogic } from "./Matchers";
import { toMatchingLogic } from "./matchers/Concat";
import {
    MatchPrefixResult,
} from "./MatchPrefixResult";
import {
    PatternMatch,
} from "./PatternMatch";

import { WhiteSpaceHandler } from "./Config";
import { failedMatchReport } from "./internal/matchReport/failedMatchReport";
import { successfulMatchReport } from "./internal/matchReport/terminalMatchReport";
import { wrappingFailedMatchReport, wrappingMatchReport } from "./internal/matchReport/wrappingMatchReport";
import { readyToMatch } from "./internal/Whitespace";
import {
    FailedMatchReport,
    FullMatchReport, isFailedMatchReport,
    isSuccessfulMatchReport, MatchExplanationTreeNode, MatchReport,
    SuccessfulMatchReport, toMatchPrefixResult,
} from "./MatchReport";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

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

interface RepInnerMatchReport { kind: "rep" | "sep" | "whitespace"; inner: SuccessfulMatchReport; }
interface RepFailedMatchReport { kind: "rep" | "sep"; inner: FailedMatchReport; }
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
        const successfulMatches: RepInnerMatchReport[] = [];
        let failedMatchReport: RepFailedMatchReport;
        let matched = "";

        const consumeWhitespace = () => {
            const eat = readyToMatch(currentInputState, this.$consumeWhiteSpaceBetweenTokens);
            if (!!eat.skipped) {
                successfulMatches.push({
                    kind: "whitespace",
                    inner: whitespaceChildMatch(eat.skipped, this, currentInputState.offset),
                });
            }
            currentInputState = eat.state;
            matched += eat.skipped;
        };
        while (!currentInputState.exhausted()) {
            consumeWhitespace();

            const report = this.matcher.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
            if (!isSuccessfulMatchReport(report)) {
                if (!isFailedMatchReport(report)) {

                    console.log("JESS: not-real failure report from " + this.matcher.$id);
                }
                failedMatchReport = { kind: "rep", inner: report };
                break;
            } else {
                if (report.matched === "") {
                    throw new Error(`Matcher with id ${this.matcher.$id} within rep matched the empty string.\n` +
                        `I do not think this grammar means what you think it means`);
                }
                currentInputState = currentInputState.consume(report.matched, `Rep matched [${report.matched}]`);
                successfulMatches.push({ kind: "rep", inner: report });
                matched += report.matched;
            }

            if (this.sepMatcher) {
                consumeWhitespace();

                const sepMatchReport = this.sepMatcher.matchPrefixReport(currentInputState, thisMatchContext, parseContext);
                if (!isSuccessfulMatchReport(sepMatchReport)) {
                    if (!isFailedMatchReport(sepMatchReport)) {
                        console.log("JESS: not-real failure report from " + this.matcher.$id);
                    }
                    failedMatchReport = { kind: "sep", inner: sepMatchReport };
                    break;
                } else {
                    // successful
                    successfulMatches.push({ kind: "sep", inner: report });
                    currentInputState = currentInputState.consume(sepMatchReport.matched, `Rep separator`);
                    matched += sepMatchReport.matched;
                }
            }
        }

        const successfulRepetitionCount = successfulMatches.filter(k => k.kind === "rep").length;
        return (successfulRepetitionCount >= this.min) ?
            new SuccessfulRepMatchReport(this, "Rep", successfulMatches, is.offset, matched, failedMatchReport) :
            new FailedRepMatchReport(this, "Rep", successfulMatches, is.offset, matched,
                `Required ${this.min} matches but only found ${successfulRepetitionCount}`, failedMatchReport);
    }
}

function whitespaceChildMatch(skipped: string, matcher: Rep, offset: number): SuccessfulMatchReport {
    const matchReport = successfulMatchReport(matcher, {
        parseNodeName: "Whitespace",
        matched: skipped,
        offset,
    });
    return matchReport;
}

class SuccessfulRepMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";
    public offset: number;
    public endingOffset: number;
    constructor(
        public readonly matcher: MatchingLogic,
        private readonly parseNodeName: string,
        private readonly successfulMatchReports: RepInnerMatchReport[],
        originalOffset: number,
        public readonly matched: string,
        private readonly innerFailedMatchReport?: RepFailedMatchReport,
    ) {
        this.offset = originalOffset;
        this.endingOffset = originalOffset + matched.length;
    }
    public toPatternMatch<T>(): PatternMatch & T {
        const value = this.successfulMatchReports.filter(k => k.kind === "rep").map(k => k.inner.toPatternMatch().$value);
        return {
            $value: value,
            $matcherId: this.matcher.$id,
            $matched: this.matched,
            $offset: this.offset,
            matchedStructure: () => {
                return this.toValueStructure();
            },
        } as PatternMatch & T;
    }
    public toParseTree(): TreeNodeCompatible {
        return {
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: this.innerMatchReports().filter(isSuccessfulMatchReport).map(r => r.toParseTree()),
        };
    }
    public toValueStructure<T>(): T {
        return this.successfulMatchReports.filter(k => k.kind === "rep").map(k => k.inner.toValueStructure()) as any as T;
    }
    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            successful: true,
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: this.innerMatchReports().map(r => r.toExplanationTree()),
        };
    }

    private readonly innerMatchReports = (): FullMatchReport[] => {
        return wrapMatchReports(this.matcher, this.successfulMatchReports, this.innerFailedMatchReport);
    }
}

function wrapMatchReports(matcher: MatchingLogic, successfulMatchReports: RepInnerMatchReport[], innerFailedMatchReport?: RepFailedMatchReport) {
    const wrapOne = (sm: RepInnerMatchReport) => {
        if (sm.kind === "whitespace") {
            // these don't need wrapped
            return sm.inner;
        }
        return wrappingMatchReport(matcher, {
            inner: sm.inner,
            parseNodeName: sm.kind === "rep" ? "Repetition" : "Separator",
        });
    };
    const wrappedMatchReports: FullMatchReport[] = successfulMatchReports.map(wrapOne);
    if (failedMatchReport) {
        wrappedMatchReports.push(wrappingFailedMatchReport(matcher, {
            inner: innerFailedMatchReport.inner,
            parseNodeName: innerFailedMatchReport.kind === "rep" ? "Repetition" : "Separator",
            reason: "Looks like this is the end of the repetition",
        }));
    }

    return wrappedMatchReports;
}

class FailedRepMatchReport implements FailedMatchReport {
    public readonly successful = false;
    public readonly kind = "real";
    public offset: number;
    public endingOffset: number;
    constructor(
        public readonly matcher: MatchingLogic,
        private readonly parseNodeName: string,
        private readonly successfulMatchReports: RepInnerMatchReport[],
        originalOffset: number,
        public readonly matched: string,
        public readonly reason: string,
        private readonly innerFailedMatchReport?: RepFailedMatchReport,
    ) {
        this.offset = originalOffset;
        this.endingOffset = originalOffset + matched.length;
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            successful: false,
            reason: this.reason,
            $name: this.parseNodeName,
            $value: this.matched,
            $offset: this.offset,
            $children: this.innerMatchReports().map(r => r.toExplanationTree()),
        };
    }

    private readonly innerMatchReports = (): FullMatchReport[] => {
        return wrapMatchReports(this.matcher, this.successfulMatchReports, this.innerFailedMatchReport);
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
