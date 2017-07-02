
/**
 * Stateful stream primitives. Implement over a string or input stream.
 * Consumption via the read method is irreversible.
 */
export interface InputStream {

    exhausted(): boolean;

    /**
     * Consume at most n characters. Return the empty string if the
     * stream is exhausted.
     * @param n number of characters to read.
     */
    read(n: number): string;

}
