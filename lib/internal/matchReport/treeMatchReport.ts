import _ = require("lodash");
import { MatchingLogic } from "../../Matchers";
import {
    FailedMatchReport,
    FullMatchReport,
    MatchExplanationTreeNode,
    MatchReport,
    SuccessfulMatchReport,
} from "../../MatchReport";
import {
    isSpecialMember,
    isTreePatternMatch,
    PatternMatch,
} from "../../PatternMatch";
import { TreeNodeCompatible } from "./../../TreeNodeCompatible";
import { failedMatchReport } from "./failedMatchReport";
import {
    SuccessfulMatchReportWrapper,
    wrappingMatchReport,
} from "./wrappingMatchReport";

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

        this.applyComputeEffects(output);

        return output as unknown as PatternMatch & T;
    }
    public toParseTree(): TreeNodeCompatible {
        // Parse tree ignores computations. It shows only what was pulled from the file
        const happiness = this.children.map(c => wrapChild(this.matcher, c, { altered: false }).toParseTree());
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
            output[child.name] = child.matchReport.toValueStructure();
        }
        this.applyComputeEffects(output);
        return output as T;
    }
    public toExplanationTree(): MatchExplanationTreeNode {

        const happiness = this.children.map(c =>
            wrapChild(this.matcher, c, computationsThatAlter(c, this.computeEffects, this.extraProperties)).toExplanationTree());

        return {
            ...this.toParseTree(),
            successful: true,
            reason: this.reason,
            $children: happiness,
        };
    }

    private applyComputeEffects(target: Record<string, any>) {
        this.computeEffects.forEach(ce => {
            [...ce.alteredProperties, ...ce.newProperties]
                .filter(p => !isSpecialMember(p))
                .forEach(p => {
                    target[p] = this.extraProperties[p];
                });
        });
    }
}

function computationsThatAlter(c: TreeChild, computeEffects: ComputeEffectsReport[], finalValues: Record<string, any>): AlteringComputations {
    if (!c.explicit) {
        return { altered: false };
    }
    const computationSteps = computeEffects
        .filter(ce => ce.alteredProperties.includes(c.name))
        .map(ce => ce.stepName);

    if (computationSteps.length === 0) {
        return { altered: false };
    }

    return {
        altered: true,
        computationSteps,
        finalValue: finalValues[c.name],
    };
}

type AlteringComputations = { altered: false } | { altered: true, computationSteps: string[], finalValue: any };

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
        extraProperties: Record<string, any>,
        computeEffects: ComputeEffectsReport[],
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
        params.extraProperties,
        params.computeEffects,
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
        private readonly extraProperties: Record<string, any>,
        private readonly computeEffects: ComputeEffectsReport[],

    ) {
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        const happiness = this.successfulChildren
            .map(c => wrapChild(this.matcher,
                c,
                computationsThatAlter(c, this.computeEffects, this.extraProperties))
                .toExplanationTree());
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

function wrapChild(matcher: MatchingLogic, child: TreeChild, alteringComputations: AlteringComputations): SuccessfulMatchReport {
    if (!child.explicit) {
        return child.matchReport;
    }
    if (!alteringComputations.altered) {
        return wrappingMatchReport(matcher, { parseNodeName: child.name, inner: child.matchReport });
    }

    return new OverridingMatchReport(matcher, child.name, child.matchReport, alteringComputations);
}

class OverridingMatchReport extends SuccessfulMatchReportWrapper {
    constructor(matcher: MatchingLogic,
        parseNodeName: string,
        original: SuccessfulMatchReport,
        private readonly alteringComputations: AlteringComputations,
    ) {
        super(matcher, parseNodeName, original);
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        const children = [this.inner.toExplanationTree()];
        let value;
        if (this.alteringComputations.altered) {
            value = this.alteringComputations.finalValue;
            const alterationExplanation: MatchExplanationTreeNode = {
                successful: true,
                $name: "Compute",
                $value: this.alteringComputations.finalValue,
                $children: [],
                $offset: 0, // could set it to offset at the time of the computation, hypothetically
                reason: "Overwritten by function in " + this.alteringComputations.computationSteps.join(", "),
            };
            children.push(alterationExplanation);
        } else {
            this.inner.toValueStructure();
        }
        return {
            successful: true,
            $name: this.parseNodeName,
            $offset: this.offset,
            $value: value,
            $children: children,
            reason: "Value altered by computation",
        };
    }
}
