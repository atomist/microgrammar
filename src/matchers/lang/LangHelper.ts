/**
 * Common interface for canonicalizing source code
 */
export interface LangHelper {

    /**
     * Remove all comments
     * @param source
     */
    stripComments(source: string): string;

    /**
     * Strip whitespace down to a single space, except in strings
     * Remove whitespaces that aren't syntactically necessary altogether.
     * @param source
     * @returns {string}
     */
    stripWhitespace(source: string): string;

    /**
     * Strip whitespace and comments
     * @param src
     * @returns {string}
     */
    canonicalize(source: string): string;
}
