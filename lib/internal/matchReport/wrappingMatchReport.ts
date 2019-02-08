
import { MatchingLogic } from "../../Matchers";
import { FailedMatchReport, MatchExplanationTreeNode, SuccessfulMatchReport } from "../../MatchReport";
import { TreeNodeCompatible } from "../../TreeNodeCompatible";

export function wrappingMatchReport(matcher: MatchingLogic, params: {
    inner: SuccessfulMatchReport,
    additional?: FailedMatchReport[],
    parseNodeName?: string,
    valueRepresented?: any,
}): SuccessfulMatchReport {
    const { valueRepresented } = params;
    return new WrappingMatchReport(matcher,
        params.parseNodeName || matcher.$id,
        params.inner,
        params.additional,
        valueRepresented ? ({ valueRepresented }) : undefined);
}

class WrappingMatchReport implements SuccessfulMatchReport {
    public readonly kind = "real";
    public readonly successful = true;
    constructor(public readonly matcher: MatchingLogic,
                public readonly parseNodeName: string,
                public readonly inner: SuccessfulMatchReport,
                public readonly additional: FailedMatchReport[] = [],
                private readonly valueOverride?: { valueRepresented?: any }) {
    }

    get offset() {
        return this.inner.offset;
    }

    public toValueStructure<T>() {
        return this.valueOverride ? this.valueOverride.valueRepresented : this.inner.toValueStructure<T>();
    }

    public toPatternMatch<T>() {
        // the wrapping disappears
        return this.inner.toPatternMatch<T>();
    }

    get matched() {
        return this.inner.matched;
    }

    public toParseTree(): TreeNodeCompatible {
        // only successful matches go into the parse tree
        return {
            $name: this.parseNodeName,
            $offset: this.inner.offset,
            $value: this.inner.matched,
            $children: [this.inner.toParseTree()],
        };
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        // all non-matches and matches go into the explanation tree
        return {
            ...this.toParseTree(),
            successful: true,
            $children: [...this.additional, this.inner].map(m => m.toExplanationTree()),
        };
    }
}

export function wrappingFailedMatchReport(matcher: MatchingLogic, params: {
    inner: FailedMatchReport,
    parseNodeName?: string,
}): FailedMatchReport {
    return new WrappingFailedMatchReport(matcher,
        params.parseNodeName || matcher.$id,
        params.inner,
    );
}

class WrappingFailedMatchReport implements FailedMatchReport {
    public readonly kind = "real";
    public readonly successful = false;
    constructor(public readonly matcher: MatchingLogic,
                public readonly parseNodeName: string,
                public readonly inner: FailedMatchReport) {
    }

    get offset() {
        return this.inner.offset;
    }

    get matched() {
        return this.inner.matched;
    }

    public toExplanationTree(): MatchExplanationTreeNode {
        return {
            $name: this.parseNodeName,
            $offset: this.inner.offset,
            $value: this.inner.matched,
            successful: false,
            $children: [this.inner.toExplanationTree()],
        };
    }
}
