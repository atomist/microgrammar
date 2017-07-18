import { JavaContentStateMachine, JavaState } from "./JavaContentStateMachine";

/**
 * Extension of JavaContentStateMachine tracking depth of curlies and parentheses
 */
export class NestingDepthStateMachine extends JavaContentStateMachine {

    private readonly push: string;

    private readonly pop: string;

    constructor(private kind: "block" | "parens" = "block", state: JavaState = "outsideString", public depth = 0) {
        super(state);
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
        return new NestingDepthStateMachine(this.kind, this.state, this.depth);
    }

    public consume(char: string): void {
        super.consume(char);
        switch (this.state) {
            case "outsideString":
                switch (char) {
                    case this.push:
                        this.depth++;
                        break;
                    case this.pop:
                        this.depth--;
                        break;
                    default:
                }
                break;
            case "inString":
            case "seenEscapeInString":
            case "inLineComment":
                break;
            default:
                break;
        }
    }
}
