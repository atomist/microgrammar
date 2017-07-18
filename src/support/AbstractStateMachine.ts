
import { InputStateListener } from "../InputState";

/**
 * Superclass for InputStateListener implementations that consume a single character at a time.
 * Stateful.
 */
export abstract class CharwiseInputStateListener implements InputStateListener {

    public read(s: string): this {
        for (const ch of s) {
            this.consume(ch);
        }
        return this;
    }

    public abstract clone(): InputStateListener;

    /**
     * Consume this input character, updating state as necessar
     * @param char character to consume.
     */
    public abstract consume(char: string): void;

}

/**
 * Convenient superclass for InputStateListeners that are state machines
 */
export abstract class AbstractStateMachine<S> extends CharwiseInputStateListener {

    protected constructor(public state: S) {
        super();
    }

    public abstract clone(): InputStateListener;

    public abstract consume(char: string): void;

}
