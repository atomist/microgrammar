import { AbstractStateMachine } from "../../../support/AbstractStateMachine";
import {
    LangState,
    LangStateMachine,
} from "../LangStateMachine";
import { CFamilyStateMachine } from "./CFamilyStateMachine";
import { Normal } from "./States";

/**
 * Track depth of curlies and parentheses in C family languages
 */
export class NestingDepthStateMachine extends AbstractStateMachine<LangState> {

    private readonly push: string;

    private readonly pop: string;

    private readonly stateMachine: LangStateMachine;

    constructor(private readonly kind: "block" | "parens" = "block",
                private readonly factory: () => LangStateMachine = () => new CFamilyStateMachine(),
                state: LangState = Normal,
                public depth = 0) {
        super(state);
        this.stateMachine = this.factory();
        switch (kind) {
            case "block":
                [this.push, this.pop] = ["{", "}"];
                break;
            case "parens":
                [this.push, this.pop] = ["(", ")"];
                break;
        }
    }

    public clone(): NestingDepthStateMachine {
        return new NestingDepthStateMachine(this.kind, this.factory, this.state, this.depth);
    }

    public consume(char: string): void {
        this.stateMachine.consume(char);
        this.state = this.stateMachine.state;
        if (this.state.normal()) {
            switch (char) {
                case this.push:
                    this.depth++;
                    break;
                case this.pop:
                    this.depth--;
                    break;
                default:
            }
        }
    }
}
