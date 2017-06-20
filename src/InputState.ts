import { InputStream } from "./InputStream";
import { StringInputStream } from "./StringInputStream";

const DEFAULT_BUFFER_SIZE = 1000;

/**
 * InputState abstraction, backed by a buffer or stream
 * which is managed transparently.
 */
export class InputState {

    public static fromString(s: string, bufferSize: number = DEFAULT_BUFFER_SIZE) {
        return new InputState(s, 0, "", bufferSize, undefined);
    }

    public static fromInputStream(is: InputStream, bufferSize: number = DEFAULT_BUFFER_SIZE) {
        return new InputState(is, 0, "", bufferSize, undefined);
    }

    private stream: InputStream;

    private constructor(
        input: string | InputStream,
        public readonly offset: number,
        private lookaheadBuf: string,
        private bufferSize,
        private parent: InputState) {

        this.stream =
            (typeof input === "string") ?
                new StringInputStream(input) :
                input;
    }

    public exhausted() {
        return this.lookaheadBuf.length === 0 && this.stream.exhausted();
    }

    public consume(s: string): InputState {
        this.ensureAvailable(s.length);
        if (this.lookaheadBuf.indexOf(s) !== 0) {
            throw new Error(`Illegal call to InputState.consume: Cannot consume [${s}] from [${this.lookaheadBuf}]`);
        }
        return new InputState(this.stream, this.offset + s.length,
            this.lookaheadBuf.substr(s.length), this.bufferSize, this);
    }

    public advance(): InputState {
        this.ensureAvailable(1);
        return new InputState(this.stream, this.offset + 1,
            this.lookaheadBuf.substr(1), this.bufferSize,
            this);
    }

    public peek(n: number): string {
        this.ensureAvailable(n);
        return this.exhausted() ?
            "" :
            this.lookaheadBuf.substr(0, n);
    }

    /**
     * Read ahead if necessary, populating our lookahead buffer
     * @param needed number of characters we may need
     * @return the string content actually additionally read
     */
    private ensureAvailable(needed: number): void {
        if (this.lookaheadBuf.length < needed && !this.stream.exhausted()) {
            if (this.parent) {
                const offsetOffset = this.offset - this.parent.offset;
                this.parent.ensureAvailable(needed + offsetOffset);
                // console.log(`ReadByParent=[${readByParent}]`);
                const read = this.parent.peek(needed + offsetOffset)
                    .substr(offsetOffset + this.lookaheadBuf.length);
                this.lookaheadBuf += read;
            } else {
                const read = this.stream.read(Math.max(this.bufferSize, needed));
                this.lookaheadBuf += read;
            }
            // console.log(`Added to buffer [${read}] bufsize=${this.bufferSize}: now=[${this.lookaheadBuf}]`);
        }
    }

}
