import { InputStream } from "./InputStream";
import { StringInputStream } from "./StringInputStream";

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
     * @return {InputState}
     */
    consume(s: string): InputState;

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
    skipTo(what: string): [string, InputState];

    /**
     * Skip input while it matches the given function
     * @param skip function to test characters
     * @param n number of characters to test for skip function
     * Return tuple of what was skipped and the resulting InputState
     * @return {InputState}
     */
    skipWhile(skip: (s: string) => boolean, n: number): [string, InputState];

    /**
     * Look ahead in the input without consuming characters
     * @param n number of characters to look ahead
     * @return {string}
     */
    peek(n: number): string;

}

export function inputStateFromString(s: string): InputState {
    return new InputStateImpl(new InputStateManager(new StringInputStream(s)), 0);
}

/**
 * InputState abstraction, backed by a buffer or stream
 * which is managed transparently.
 */
export class InputStateImpl implements InputState {

    public constructor(private readonly ism: InputStateManager,
                       public readonly offset: number = 0) {
    }

    /**
     * Skip to before this pattern. Exhaust input if necessary.
     * @param what what to skip to
     * @return {InputState}
     */
    public skipTo(what: string): [string, InputState] {
        return this.skipWhile(s => s !== what, what.length);
    }

    /**
     * Skip input while it matches the given function
     * @param skip skip till
     * @param n number of characters to look at
     * @return {InputState}
     */
    public skipWhile(skip: (char: string) => boolean, n: number): [string, InputState] {
        let offset = this.offset;
        while (this.ism.canSatisfy(offset) && skip(this.ism.get(offset, n))) {
            ++offset;
        }
        const is = new InputStateImpl(this.ism, offset);
        return [is.seenSince(this), is];
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
     * @return {InputState}
     */
    public consume(s: string): InputState {
        if (this.ism.get(this.offset, s.length) !== s) {
            throw new Error(`Illegal call to InputState.consume: Cannot consume [${s}] from XXXX`);
        }
        return new InputStateImpl(this.ism, this.offset + s.length);
    }

    /**
     * Advance one character in the input
     * @return {InputState}
     */
    public advance(): InputState {
        if (this.exhausted()) {
            throw new Error(`Illegal call to InputState.advance: Stream is exhausted`);
        }
        return new InputStateImpl(this.ism, this.offset + 1);
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
    private seenSince(l: InputStateImpl): string {
        if (l.ism !== this.ism) {
            throw new Error("Can't seenSince: Different input streams");
        }
        return this.ism.get(l.offset, this.offset - l.offset);
    }

}

const DEFAULT_BUFFER_SIZE = 1000;

/**
 * Window over input. Enables us to use a very simple InputStream
 * abstraction that does not need to support backtracking.
 */
export class InputStateManager {

    private left = 0;

    private window: string = "";

    constructor(private stream: InputStream, private bufsize: number = DEFAULT_BUFFER_SIZE) {
    }

    public get(offset: number, n: number): string {
        this.canSatisfy(offset + n);
        return this.window.substr(offset - this.left, n);
    }

    public canSatisfy(offset: number): boolean {
        if (offset < this.left) {
            throw new Error(`Cannot rewind to offset ${offset}: already at ${this.left}`);
        }
        if (offset > this.right()) {
            this.window += this.stream.read(Math.max(this.bufsize, offset - this.right()));
        }
        return this.right() >= offset;
    }

    /**
     * Drop characters left of the offset from window
     * @param offset leftmost offset we'll need
     */
    public dropLeft(offset: number): void {
        if (offset > this.left && offset <= this.right()) {
            this.window = this.window.substr(offset - this.left);
            this.left = offset;
        }
    }

    public exhausted() {
        return this.stream.exhausted() && this.window === "";
    }

    private right() {
        return this.left + this.window.length;
    }

}
