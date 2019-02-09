import { MatchingLogic } from "../../Matchers";
import { FailedMatchReport, FullMatchReport, MatchExplanationTreeNode, MatchReport, SuccessfulMatchReport } from "../../MatchReport";
import { isSpecialMember, isTreePatternMatch, PatternMatch } from "../../PatternMatch";
import { TreeNodeCompatible } from "./../../TreeNodeCompatible";
import { failedMatchReport } from "./failedMatchReport";
import { wrappingMatchReport } from "./wrappingMatchReport";

export function successfulTreeMatchReport(matcher: MatchingLogic, params:
    {
        matched: string,
        offset: number,
        children?: TreeChild[],
        parseNodeName?: string,
        reason?: string,
        extraProperties?: Record<string, any>,
        computeEffects?: ComputeEffectsReport[],
    }): SuccessfulMatchReport {
    const { offset, matched, parseNodeName, reason, computeEffects, extraProperties, children } = params;
    return new TreeMatchReport(
        matcher,
        matched,
        offset,
        children || [],
        reason,
        parseNodeName || matcher.$id,
        extraProperties || {},
        computeEffects || [],
    );
}

export interface ComputeEffectsReport {
    stepName: string;
    computeResult: any;
    alteredProperties: string[];
    newProperties: string[];
}

export type TreeChild = {
    explicit: false;
    matchReport: SuccessfulMatchReport;
} | {
    explicit: true;
    name: string;
    matchReport: SuccessfulMatchReport;
};

export function namedChild(name: string, matchReport: SuccessfulMatchReport): TreeChild {
    return {
        name, matchReport, explicit: true,
    };
}

export function unnamedChild(matchReport: SuccessfulMatchReport): TreeChild {
    return { explicit: false, matchReport };
}

class TreeMatchReport implements SuccessfulMatchReport {
    public readonly successful = true;
    public readonly kind = "real";
    public readonly endingOffset: number;
    constructor(public readonly matcher: MatchingLogic,
        public readonly matched: string,
        public readonly offset: number,
        private readonly children: TreeChild[],
        private readonly reason: string,
        private readonly parseNodeName: string,
        private readonly extraProperties: Record<string, any>,
        private readonly computeEffects: ComputeEffectsReport[],
    ) {
        this.endingOffset = offset + matched.length;
    }

    public toPatternMatch<T>(): PatternMatch & T {
        // plus, all the extra properties go on.

        const vs = this.toValueStructure<T>();
        const output = {
            $matcherId: this.matcher.$id,
            $matched: this.matched,
            $offset: this.offset,
            matchedStructure: <TT>(): TT => {
                return vs as any as TT;
            },
            $value: vs,
            $valueMatches: {},
        };
        const submatches = {};
        for (const child of this.children) {
            if (!child.explicit) {
                continue;
            }
            if (isSpecialMember(child.name)) {
                continue;
            }
            const childPatternMatch = child.matchReport.toPatternMatch();
            submatches[child.name] = childPatternMatch;
            if (isTreePatternMatch(childPatternMatch)) {
                output[child.name] = childPatternMatch;
            } else {
                output[child.name] = child.matchReport.toValueStructure();
                output.$valueMatches[child.name] = childPatternMatch;
            }
        }
        (output as any).submatches = () => submatches;

        this.computeEffects.forEach(ce => {
            [...ce.alteredProperties, ...ce.newProperties]
                .filter(p => !isSpecialMember(p))
                .forEach(p => {
                    output[p] = this.extraProperties[p];
                });
        });

        return output as unknown as PatternMatch & T;
    }
    public toParseTree(): TreeNodeCompatible {
        const happiness = this.children.map(c => wrapChild(this.matcher, c).toParseTree());
        return {
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: this.matched || "",
            $children: happiness,
        };
    }
    public toValueStructure<T>(): T {
        const output = {};
        for (const child of this.children) {
            if (!child.explicit) {
                continue;
            }
            if (isSpecialMember(child.name)) {
                continue;
            }
            if (!child.matchReport.toValueStructure) {
                throw new Error("Jess, implement toValueStructure on " + child.matchReport.kind);
            }
            output[child.name] = child.matchReport.toValueStructure();
        }
        Object.entries(this.extraProperties).forEach(([k, v]) => {
            if (isSpecialMember(k)) {
                return;
            }
            output[k] = v;
        });
        return output as T;
    }
    public toExplanationTree(): MatchExplanationTreeNode {
        const happiness = this.children.map(c => wrapChild(this.matcher, c).toExplanationTree());
        return {
            ...this.toParseTree(),
            successful: true,
            reason: this.reason,
            $children: happiness,
        };
    }
}

export function failedTreeMatchReport(matcher: MatchingLogic, params:
    {
        matched: string,
        originalOffset: number,
        reason: string,
        failureName: string,
        failureReport?: FailedMatchReport,
        failingOffset?: number,
        successes?: TreeChild[],
        parseNodeName?: string,
    }): FailedMatchReport {
    const { matched, parseNodeName, reason, successes,
        failureName, failureReport } = params;

    const failureMatchReport = failureReport || failedMatchReport(matcher, {
        offset: params.failingOffset, parseNodeName: failureName, reason,
    });
    return new FailedTreeMatchReport(
        matcher,
        matched,
        params.originalOffset,
        successes || [],
        { name: failureName, matchReport: failureMatchReport },
        reason,
        parseNodeName || matcher.$id,
    );
}

class FailedTreeMatchReport implements FailedMatchReport {
    public readonly kind = "real";
    public readonly successful = false;

    constructor(public readonly matcher: MatchingLogic,
        public readonly matched: string,
        public readonly offset: number,
        private readonly successfulChildren: TreeChild[],
        private readonly failedChild: { name: string, matchReport: FailedMatchReport },
        private readonly reason: string,
        private readonly parseNodeName: string,
    ) {
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        // todo: wrap with name somehow
        const happiness = this.successfulChildren.map(c => wrapChild(this.matcher, c).toExplanationTree());
        const failure = this.failedChild.matchReport.toExplanationTree();
        return {
            successful: false,
            reason: this.reason,
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: this.matched || "",
            $children: [...happiness, failure],
        };
    }
}

function wrapChild(matcher: MatchingLogic, child: TreeChild): SuccessfulMatchReport {
    if (!child.explicit) {
        return child.matchReport;
    }
    return wrappingMatchReport(matcher, { parseNodeName: child.name, inner: child.matchReport });
}
