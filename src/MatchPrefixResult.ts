/**
 * Pattern match. Holds user properties, with user-defined names,
 * and Atomist pattern match properties with a $ prefix.
 * Note that properties use $ prefix to get them out of user space,
 * as user properties will be added.
 */
export interface MatchPrefixResult {

    readonly $offset: number;

    readonly $matcherId: string;

    readonly $context: {};

}
