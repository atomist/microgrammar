
import { InputState, Skipped } from "../InputState";
import { InputStateManager } from "./InputStateManager";

/**
 * Default InputState implementation
 */
export class DefaultInputState implements InputState {

    public constructor(private readonly ism: InputStateManager,
                       public readonly offset: number = 0) {
    }

    /**
     * Skip to before this pattern. Exhaust input if necessary.
     * @param what what to skip to
     * @return {InputState}
     */
    public skipTo(what: string): Skipped {
        return this.skipWhile(s => s !== what, what.length);
    }

    /**
     * Skip input while it matches the given function
     * @param skip skip till
     * @param n number of characters to look at
     * @return {InputState}
     */
    public skipWhile(skip: (char: string) => boolean, n: number): Skipped {
        let offset = this.offset;
        while (this.ism.canSatisfy(offset) && skip(this.ism.get(offset, n))) {
            ++offset;
        }
        const is = new DefaultInputState(this.ism, offset);
        return { skipped: is.seenSince(this), state: is };
    }

    /**
     * Is the input exhausted?
     * @return {boolean}
     */
    public exhausted() {
        return !this.ism.canSatisfy(this.offset);
    }

    /**
     * Consume the given string if our input begins with it. Otherwise fail
     * @param s string that we must find
     * @param message activity we're performing
     * @return {InputState}
     */
    public consume(s: string, message: string): InputState {
        const actual = this.ism.get(this.offset, s.length);
        if (actual !== s) {
            throw new Error(`Invalid call to InputState.consume: Cannot consume [${s}] from [${actual}]. Log: ${message}`);
        }
        return new DefaultInputState(this.ism, this.offset + s.length);
    }

    /**
     * Advance one character in the input
     * @return {InputState}
     */
    public advance(): InputState {
        if (this.exhausted()) {
            throw new Error(`Illegal call to InputState.advance: Stream is exhausted`);
        }
        return new DefaultInputState(this.ism, this.offset + 1);
    }

    /**
     * Look ahead in the input without consuming characters
     * @param n number of characters to look ahead
     * @return {string}
     */
    public peek(n: number): string {
        return this.exhausted() ?
            "" :
            this.ism.get(this.offset, n);
    }

    /**
     * What substring has been read since the given state
     * @param l previous input state
     * @return {string}
     */
    private seenSince(l: DefaultInputState): string {
        if (l.ism !== this.ism) {
            throw new Error("Can't seenSince: Different input streams");
        }
        return this.ism.get(l.offset, this.offset - l.offset);
    }

}
