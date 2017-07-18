import { AbstractStateMachine } from "../../support/AbstractStateMachine";

/**
 * State of input in a Java source file
 */
export type JavaState = "outsideString" | "seen/" | "inString" | "seenEscapeInString" |
    "inLineComment" | "inCComment" | "seen*InCComment";

/**
 * State machine for recognizing Java strings and comments.
 */
export class JavaContentStateMachine extends AbstractStateMachine<JavaState> {

    constructor(state: JavaState = "outsideString") {
        super(state);
    }

    public clone(): JavaContentStateMachine {
        return new JavaContentStateMachine(this.state);
    }

    public consume(s: string): void {
        switch (this.state) {
            case "inLineComment":
                if (s === "\n") {
                    this.state = "outsideString";
                }
                break;
            case "inCComment":
                if (s === "*") {
                    this.state = "seen*InCComment";
                }
                break;
            case "seen*InCComment":
                if (s === "/") {
                    this.state = "outsideString";
                }
                break;
            case "outsideString":
                switch (s) {
                    case '"':
                        this.state = "inString";
                        break;
                    case "/":
                        this.state = "seen/";
                        break;
                }
                break;
            case "seen/":
                switch (s) {
                    case "/":
                        this.state = "inLineComment";
                        break;
                    case "*":
                        this.state = "inCComment";
                        break;
                    default:
                        this.state = "outsideString";
                        break;
                }
                break;
            case "inString":
                switch (s) {
                    case '"':
                        this.state = "outsideString";
                        break;
                    case "\\":
                        this.state = "seenEscapeInString";
                        break;
                    default:
                }
                break;
            case "seenEscapeInString":
                this.state = "inString";
                break;
        }
    }
}
