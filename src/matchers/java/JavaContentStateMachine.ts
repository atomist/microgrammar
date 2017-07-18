import { AbstractStateMachine } from "../../support/AbstractStateMachine";

/**
 * State of input in a Java source file
 */
export type JavaState = "outsideString" | "seen/" |
    "String" | "afterEscapeInString" |
    "inLineComment" | "CComment" |
    "*inCComment";

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
            case "CComment":
                if (s === "*") {
                    this.state = "*inCComment";
                }
                break;
            case "*inCComment":
                if (s === "/") {
                    this.state = "outsideString";
                }
                break;
            case "outsideString":
                switch (s) {
                    case '"':
                        this.state = "String";
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
                        this.state = "CComment";
                        break;
                    default:
                        this.state = "outsideString";
                        break;
                }
                break;
            case "String":
                switch (s) {
                    case '"':
                        this.state = "outsideString";
                        break;
                    case "\\":
                        this.state = "afterEscapeInString";
                        break;
                    default:
                }
                break;
            case "afterEscapeInString":
                this.state = "String";
                break;
        }
    }
}
