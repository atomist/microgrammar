/**
 * Implementation of InputState, backed by a string held in memory.
 */
import { InputStream } from "./InputStream";

export class StringInputStream implements InputStream {

    private offset = 0;

    constructor(public readonly content: string) {
        if (content === undefined) {
            throw new Error("Undefined content");
        }
    }

    public exhausted() {
        return this.offset >= this.content.length;
    }

    public read(n: number): string {
        const s = this.content.substr(this.offset);
        this.offset += s.length;
        return s;
    }

}
