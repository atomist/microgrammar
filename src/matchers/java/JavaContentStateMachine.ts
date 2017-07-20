import { AbstractStateMachine } from "../../support/AbstractStateMachine";

/**
 * State of input in a Java source file
 */
export type JavaState =
    "normal" |
    "String" |
    "inLineComment" |
    "CComment";

/**
 * State machine for recognizing Java strings and comments.
 */
export class JavaContentStateMachine extends AbstractStateMachine<JavaState> {

    private previousChar: string;

    constructor(state: JavaState = "normal") {
        super(state);
    }

    public clone(): JavaContentStateMachine {
        return new JavaContentStateMachine(this.state);
    }

    public consume(ch: string): void {
        switch (this.state) {
            case "inLineComment":
                if (ch === "\n") {
                    this.state = "normal";
                }
                break;
            case "CComment":
                if (ch === "/" && this.previousChar === "*") {
                    this.state = "normal";
                }
                break;
            case "normal":
                switch (ch) {
                    case '"' :
                        this.state = "String";
                        break;
                    case "/":
                        if (this.previousChar === "/") {
                            this.state = "inLineComment";
                        }
                        break;
                    case "*":
                        if (this.previousChar === "/") {
                            this.state = "CComment";
                        }
                        break;
                    default:
                }
                break;
            case "String":
                if (ch === '"' && this.previousChar !== "\\") {
                    this.state = "normal";
                }
                break;
        }
        this.previousChar = ch;
    }
}
