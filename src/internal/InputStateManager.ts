
import { InputStream } from "../spi/InputStream";

const DEFAULT_BUFFER_SIZE = 1000;

/**
 * Window over input. Enables us to use a simple InputStream
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
        return this.window.length === 0 && this.stream.exhausted();
    }

    private right() {
        return this.left + this.window.length;
    }

}
