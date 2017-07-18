import { InputState, Listeners } from "../InputState";
import { StringInputStream } from "../spi/StringInputStream";

import { InputStream } from "../spi/InputStream";
import { DefaultInputState } from "./DefaultInputState";
import { InputStateManager } from "./InputStateManager";

/**
 * Return an input state from a string
 * @param s string
 * @param l listeners observing input characters as they are read
 * @param offset default 0. If this is specified it enables us to pretend that we are
 * beginning at a given offset. This allows us to preserve offsets when matching within a match.
 * @returns {InputState}
 */
export function inputStateFromString(s: string, l?: Listeners, offset: number = 0): InputState {
    return inputStateFromStream(new StringInputStream(s, offset), l, offset);
}

/**
 * Return an input state from a stream
 * @param str input stream
 * @param l listeners observing input characters as they are read
 * @param offset default 0. If this is specified it enables us to pretend that we are
 * beginning at a given offset. This allows us to preserve offsets when matching within a match.
 * @returns {InputState}
 */
export function inputStateFromStream(str: InputStream, l?: Listeners, offset: number = 0): InputState {
    return new DefaultInputState(new InputStateManager(str), offset, l);
}
