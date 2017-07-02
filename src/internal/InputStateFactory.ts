import { InputState } from "../InputState";
import { StringInputStream } from "../spi/StringInputStream";

import { DefaultInputState } from "./DefaultInputState";
import { InputStateManager } from "./InputStateManager";

import { InputStream } from "../spi/InputStream";

export function inputStateFromString(s: string): InputState {
    return inputStateFromStream(new StringInputStream(s));
}

export function inputStateFromStream(str: InputStream): InputState {
    return new DefaultInputState(new InputStateManager(str), 0);
}
