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

    constructor(public name: string,
                public comment: boolean,
                public stringLiteral: boolean) {
    }

    public normal() {
        return !(this.comment || this.stringLiteral);
    }

}
