
/**
 * InputState abstraction, exposed to matchers.
 * Backed by a buffer or stream that is managed transparently.
 */
export interface InputState {

    readonly offset: number;

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

export interface Skipped {

    skipped: string;

    state: InputState;

}
