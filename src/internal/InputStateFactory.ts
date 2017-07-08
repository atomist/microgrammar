import { InputState } from "../InputState";
import { StringInputStream } from "../spi/StringInputStream";

import { InputStream } from "../spi/InputStream";
import { DefaultInputState } from "./DefaultInputState";
import { InputStateManager } from "./InputStateManager";

/**
 * Return an input state from a string
 * @param s string
 * @param offset default 0. If this is specified it enables us to pretend that we are
 * beginning at a given offset. This allows us to preserve offsets when matching within a match.
 * @returns {InputState}
 */
export function inputStateFromString(s: string, offset: number = 0): InputState {
    return inputStateFromStream(new StringInputStream(s, offset), offset);
}

/**
 * Return an input state from a stream
 * @param str input stream
 * @param offset default 0. If this is specified it enables us to pretend that we are
 * beginning at a given offset. This allows us to preserve offsets when matching within a match.
 * @returns {InputState}
 */
export function inputStateFromStream(str: InputStream, offset: number = 0): InputState {
    return new DefaultInputState(new InputStateManager(str), offset);
}
