
import { InputStream } from "./InputStream";

/**
 * Simple implementation of InputStream, backed by a string held in memory.
 */
export class StringInputStream implements InputStream {

    public offset = 0;

    /**
     * Create a new string-backed stream
     * @param content string
     * @param initialOffset initial offset. If supplied this pretends to the left
     * offset of the string. This enables us to match within matches
     */
    constructor(public readonly content: string, private readonly initialOffset: number = 0) {
        if (content === undefined) {
            throw new Error("Undefined content");
        }
    }

    public exhausted() {
        return this.offset - this.initialOffset >= this.content.length;
    }

    public read(n: number): string {
        const s = this.content.substr(this.offset - this.initialOffset, n);
        this.offset += s.length;
        // console.log(`read(${n}) returned [${s}], offset now=${this.offset}`);
        return s;
    }

}
