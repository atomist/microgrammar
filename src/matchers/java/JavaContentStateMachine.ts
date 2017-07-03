
/**
 * State machine for recognizing Java strings.
 */
export class JavaContentStateMachine {

    public state: "outsideString" | "seen/" | "inString" | "seenEscapeInString" |
        "inLineComment" | "inCComment" | "seen*InCComment" = "outsideString";

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
                if (s === '"') {
                    this.state = "inString";
                } else if (s === "/") {
                    this.state = "seen/";
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
