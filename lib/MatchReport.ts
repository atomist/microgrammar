import { MatchingLogic } from "./Matchers";
import {
    MatchFailureReport,
    MatchPrefixResult,
} from "./MatchPrefixResult";
import {
    DismatchReport,
    PatternMatch,
} from "./PatternMatch";
import { TreeNodeCompatible } from "./TreeNodeCompatible";

export interface FailedMatchReport {
    offset: number;
    matched?: string;
    matcher: MatchingLogic; // is all of this really necessary?
    successful: false;
    description?: string; // should be "reason"
    toExplanationTree(): MatchExplanationTreeNode;
}

export interface SuccessfulMatchReport {
    offset: number;
    matcher: MatchingLogic; // is all of this really necessary?
    successful: true;
    matched: string;
    endingOffset: number;
    toExplanationTree(): MatchExplanationTreeNode;
    toPatternMatch<T>(): PatternMatch & T;
    toParseTree(): TreeNodeCompatible;
    toValueStructure<T = any>(): T;
}

export function isSuccessfulMatchReport(fmr: MatchReport): fmr is SuccessfulMatchReport {
    return fmr.successful;
}

export function isFailedMatchReport(fmr: MatchReport): fmr is FailedMatchReport {
    return !fmr.successful;
}

/**
 * All the data about the match, enough to generate either a PatternMatch
 * or a value structure (with fields as declared in microgrammar terms)
 * or a TreeNodeCompatible parse tree
 * or a TreeNodeCompatible report of why it matched or didn't.
 *
 * I can't get from one of these structures to another, because the child
 * structures are different. So, let's output one structure that can
 * be turned into any of them.
 */
export type MatchReport = SuccessfulMatchReport | FailedMatchReport;

export function toPatternMatchOrDismatchReport<T>(mr: MatchReport):
    PatternMatch & T | DismatchReport {
    if (isSuccessfulMatchReport(mr)) {
        return mr.toPatternMatch<T>();
    } else {
        if (isFailedMatchReport(mr)) {
            return {
                description: "Looks like it didn't match",
                explanationTree: mr.toExplanationTree(),
            } as DismatchReport;
        }
        throw new Error("not implemented");
    }
}

/**
 * Extract a tree describing how the match was parsed.
 * Each matcher adds a node, plus Concat adds nodes for all its properties
 * and Rep adds nodes for all its elements.
 * Synthetic elements are empty elements are not included; each node
 * maps to content in the file.
 * @param mr match report from Grammar.exactMatchReport
 */
export function toParseTree(mr: MatchReport): TreeNodeCompatible {
    if (!isSuccessfulMatchReport(mr)) {
        throw new Error("Unimplemented");
    }
    return mr.toParseTree();
}

export interface MatchExplanationTreeNode extends TreeNodeCompatible {
    $children: MatchExplanationTreeNode[]; // narrowed
    /**
     * Whether this part of the tree matched successfully
     */
    successful: boolean;
    /**
     * If failed, please always populate the description of why.
     * If successful, you may describe why this input string was so compelling
     */
    reason?: string;
}

/**
 * Return a tree which explains the activity of the matching, both
 * what matched and what didn't. Empty matches are included, and failed
 * matches are included. Use this to figure out why something matched (or didn't).
 * @param mr a MatchReport from Grammar.exactMatchReport
 */
export function toExplanationTree(mr: MatchReport): MatchExplanationTreeNode {
    return mr.toExplanationTree();
}

/**
 * Return the values extracted from a match. For any match constructed with
 * `microgrammar(...)` this will return an object with a property for each term.
 * Synthetic properties are included.
 * @param mr a MatchReport from Grammar.exactMatchReport
 */
export function toValueStructure<T = any>(mr: MatchReport): T {
    if (isSuccessfulMatchReport(mr)) {
        return mr.toValueStructure();
    } else {
        throw new Error("You can only get the value structure of successful matches");
    }
}

export function toMatchPrefixResult(mr: MatchReport): MatchPrefixResult {
    if (isSuccessfulMatchReport(mr)) {
        return mr.toPatternMatch();
    }
    return new MatchFailureReport(mr.matcher.$id,
        mr.offset,
        mr.matched,
        mr.description);
}
