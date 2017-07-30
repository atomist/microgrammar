import { LangState, LangStateMachine } from "../LangStateMachine";
import {DoubleString, Normal, SlashSlashComment, SlashStarComment } from "./States";

/**
 * State machine for recognizing C family strings and comments.
 * Directly usable for Java, C and C++
 */
export class CFamilyStateMachine extends LangStateMachine {

    constructor(state: LangState = Normal) {
        super(state);
    }

    public clone(): CFamilyStateMachine {
        return new CFamilyStateMachine(this.state);
    }

    public consume(ch: string): void {
        this.previousState = this.state;
        switch (this.state) {
            case SlashSlashComment:
                if (ch === "\n") {
                    this.state = Normal;
                }
                break;
            case SlashStarComment:
                if (ch === "/" && this.previousChar === "*") {
                    this.state = Normal;
                }
                break;
            case Normal:
                switch (ch) {
                    case '"' :
                        this.state = DoubleString;
                        break;
                    case "/":
                        if (this.previousChar === "/") {
                            this.state = SlashSlashComment;
                        }
                        break;
                    case "*":
                        if (this.previousChar === "/") {
                            this.state = SlashStarComment;
                        }
                        break;
                    default:
                }
                break;
            case DoubleString:
                if (ch === '"' && this.previousChar !== "\\") {
                    this.state = Normal;
                }
                break;
        }
        this.previousChar = ch;
    }
}
