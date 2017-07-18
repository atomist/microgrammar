/**
 * InputState abstraction, exposed to matchers.
 * Backed by a buffer or stream that is managed transparently.
 */
export interface InputState {

    readonly offset: number;

    /**
     * InputStateListeners, if set.
     * InputStateListener instances will have seen only the characters up to this point.
     */
    readonly listeners?: Listeners;

    /**
     * Is the input exhausted?
     * @return {boolean}
     */
    exhausted(): boolean;

    /**
     * Consume the given string if our input begins with it. Otherwise fail
     * @param s string that we must find
     * @param message description of what we're doing to help in diagnosing problems
     * @return {InputState}
     */
    consume(s: string, message: string): InputState;

    /**
     * Advance one character in the input
     * @return {InputState}
     */
    advance(): InputState;

    /**
     * Skip to before this pattern. Exhaust input if necessary.
     * Return tuple of what was skipped and the resulting InputState
     * @param what what to skip to
     */
    skipTo(what: string): Skipped;

    /**
     * Skip input while it matches the given function
     * @param skip function to test characters
     * @param n number of characters to test for skip function
     * Return tuple of what was skipped and the resulting InputState
     * @return {InputState}
     */
    skipWhile(skip: (s: string) => boolean, n: number): Skipped;

    /**
     * Look ahead in the input without consuming characters
     * @param n number of characters to look ahead
     * @return {string}
     */
    peek(n: number): string;

}

export interface Listeners {

    [key: string]: InputStateListener;
}

/**
 * Listener invoked when characters are consumed from an InputState.
 * Useful for implementing a state machine or tracking previously seen characters.
 */
export interface InputStateListener {

    /**
     * Invoked when the given characters were read from the input
     * @param s input read
     */
    read(s: string): this;

    /**
     * Return an independent clone of this listener
     */
    clone(): InputStateListener;
}

export interface Skipped {

    skipped: string;

    state: InputState;

}
