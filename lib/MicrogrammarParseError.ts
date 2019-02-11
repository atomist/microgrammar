import { MatchExplanationTreeNode } from "./MatchReport";
import { stringifyTree } from "stringify-tree";

export class MicrogrammarParseError extends Error {

    constructor(
        message: string,
        public readonly explanationTree: MatchExplanationTreeNode) {
        super(message);
    }

    public explanationTreeString() {
        return stringifyExplanationTree(this.explanationTree);
    }
}

export function stringifyExplanationTree(tn: MatchExplanationTreeNode): string {
    return stringifyTree(tn, n => `${n.successful ? "☻" : "☹"}${n.$name} ${n.reason || "[" + n.$value + "]"}`, n => n.$children);
}