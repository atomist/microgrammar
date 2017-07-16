
import { FromStringOptions } from "../FromStringOptions";

export interface CompleteFromStringOptions extends FromStringOptions {
    ellipsis: string;
    componentPrefix: string;
}

export const DefaultFromStringOptions: CompleteFromStringOptions = {

    /**
     * Use this token when you want an anonymous, unbound stream of content to skip
     */
    ellipsis: "...",

    componentPrefix: "$",
};

export function completeWithDefaults(fso: FromStringOptions): CompleteFromStringOptions {
    return {
        ...DefaultFromStringOptions,
        ...fso,
    };
}
