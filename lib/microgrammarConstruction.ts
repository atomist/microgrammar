import { AnyKeysOf, Grammar, TermsDefinition } from "./Grammar";
import { Microgrammar } from "./Microgrammar";

/**
 * Object used to define a microgrammar
 */
export interface MicrogrammarDefinition<T> {

    /**
     * Phrase defining how the terms should appear, including
     * literals, if specified.
     * A phrase is of form "method ${name}(): ${returnType}".
     */
    phrase?: string;

    /**
     * Definitions of the productions in this grammar
     */
    terms?: TermsDefinition<T>;
}

/**
 * Create a microgrammar return matches with properties according
 * to the given interface.
 * @param definition full definition, including a phrase string, or terms definition
 * @return {Grammar<T>}
 */
export function microgrammar<T>(definition: MicrogrammarDefinition<T> | TermsDefinition<T>): Grammar<T> {
    if (!definition.phrase && !definition.terms) {
        return Microgrammar.fromDefinitions(definition as any);
    }
    if (!!definition.phrase) {
        return Microgrammar.fromString(definition.phrase, definition.terms);
    }
    return Microgrammar.fromDefinitions(definition.terms);
}

/**
 * Create a microgrammar with return matches implementing an inferred interface
 * taking properties of type "any" from definitions.
 * Use microgrammar for stronger typing.
 * @return {Grammar<T>}
 */
export function simpleMicrogrammar<T>(definition: MicrogrammarDefinition<T> | TermsDefinition<T>): Grammar<AnyKeysOf<T>> {
    return microgrammar(definition);
}
