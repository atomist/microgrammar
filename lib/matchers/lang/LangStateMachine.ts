import { AbstractStateMachine } from "../../support/AbstractStateMachine";

/**
 * Convenient superclass for parsing programming language source
 */
export abstract class LangStateMachine extends AbstractStateMachine<LangState> {

    public previousChar: string;

    public previousState: LangState;

    constructor(state: LangState) {
        super(state);
        this.previousState = state;
    }

}

/**
 * Represents a state in a LangStateMachine
 */
export class LangState {

    /**
     * Create a new state
     * @param name name of the state. Merely informative.
     * @param comment is this a comment state? A language
     * can have multiple kinds of comments, such as /* and // comments
     * @param stringLiteral are we in a string literal?
     * A language can have multiple kinds of string literals, like
     * Scala " and """ strings
     */
    constructor(public name: string,
                public comment: boolean,
                public stringLiteral: boolean) {
    }

    public normal() {
        return !(this.comment || this.stringLiteral);
    }

}
