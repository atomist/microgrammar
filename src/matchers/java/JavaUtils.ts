
import { JavaContentStateMachine } from "./JavaContentStateMachine";

/**
 * Strip Java comments
 * @param source
 */
export function stripComments(source: string) {
    let stripped = "";
    const sm = new JavaContentStateMachine();
    let previousState = sm.state;
    for (const s of source) {
        sm.consume(s);
        switch (sm.state) {
            case "CComment":
            case "inLineComment":
            case "*inCComment":
            case "seen/":
                break;
            case "outsideString":
                if (previousState !== "*inCComment") {
                    stripped += s;
                }
                break;
            default:
                stripped += s;
        }
        previousState = sm.state;
    }
    return stripped;
}

/**
 * Strip whitespace down to a single space, except in strings
 * Remove whitespaces that aren't syntactically necessary altogether.
 * @param source
 * @returns {string}
 */
export function stripWhitespace(source: string): string {
    let stripped = "";
    let chunk = "";

    const sm = new JavaContentStateMachine();
    let previousState = sm.state;
    for (const s of source) {
        sm.consume(s);
        switch (sm.state) {
            case "String":
                // If we've just entered a string, add the stripped chunk that preceded it
                if (previousState !== "String") {
                    stripped += strip(chunk);
                    chunk = "";
                }
                // Take all characters from string without stripping whitespace
                stripped += s;
                break;
            default:
                // Add to a chunk that we'll later strip
                chunk += s;
        }
        previousState = sm.state;
    }
    stripped += strip(chunk);
    return stripped;
}

function strip(src: string): string {
    let stripped = src.replace(/[\s]+/g, " ");
    // Get rid of syntactically unnecessary whitespace
    stripped = stripped.replace(/([{}.@;])\s/g, "$1");
    stripped = stripped.replace(/\s([{}.@;])/g, "$1");
    stripped = stripped.trim();
    return stripped;
}

/**
 * Strip whitespace and comments
 * @param src
 * @returns {string}
 */
export function canonicalize(src: string): string {
    return stripWhitespace(stripComments(src));
}
