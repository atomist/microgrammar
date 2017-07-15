import { MatchingLogic } from "../Matchers";
import { Concat, toMatchingLogic } from "../matchers/Concat";
import { Literal } from "../Primitives";

import { WhiteSpaceHandler } from "../Config";
import { isPatternMatch } from "../PatternMatch";
import { Break } from "./Break";
import { exactMatch } from "./ExactMatch";
import { MicrogrammarSpec, specGrammar } from "./SpecGrammar";

/**
 * Use this token when you want an anonymous, unbound stream of content to skip
 * @type {string}
 */
const DiscardToken = "⤞";

/**
 * Convenient function to create a microgrammar from a spec within another grammar
 * @param spec string spec
 * @param elements
 * @returns {Concat}
 */
export function sentence(spec: string, elements: object = {}): Concat {
    return new MicrogrammarSpecParser().fromString(spec, elements);
}

/**
 * Parses microgrammars expressed as strings.
 */
export class MicrogrammarSpecParser {

    private anonFieldCount = 0;

    public fromString(spec: string, elements: object = {}): Concat {
        spec = this.preprocess(spec);
        const match = exactMatch<MicrogrammarSpec>(specGrammar, spec);
        if (!isPatternMatch(match)) {
            throw new Error(`Unable to parse microgrammar: ${spec}`);
        }
        const matcherSequence1 = this.definitionSpecsFromMicrogrammarSpec(match,
            (elements as WhiteSpaceHandler).$consumeWhiteSpaceBetweenTokens !== false);
        const matcherSequence2 = this.populateSpecifiedElements(elements, matcherSequence1);
        const matcherSequence3 = this.inferUnspecifiedElements(matcherSequence2);
        const definitions = this.definitionsFromSpecs(spec, matcherSequence3);
        const concat = new Concat(definitions);
        // Copy config to Concat
        for (const key in elements) {
            if (key.charAt(0) === "$") {
                concat[key] = elements[key];
            }
        }
        return concat;
    }

    /**
     * Given a spec, replace all the DiscardToken instances with a named,
     * but unbound, matcher spec
     * @param spec spec to preprocess before parsing
     * @returns {string}
     */
    private preprocess(spec: string): string {
        const split = spec.split(DiscardToken);
        let joined = "";
        for (let i = 0; i < split.length; i++) {
            if (i > 0) {
                joined += "${_discard" + i + "}";
            }
            joined += split[i];
        }
        return joined;
    }

    private definitionSpecsFromMicrogrammarSpec(match: MicrogrammarSpec, consumeWhiteSpaceBetweenTokens: boolean): DefinitionSpec[] {
        // flatMap would work better here
        const matcherSequence1: DefinitionSpec[] = [];
        match.these.forEach(
            t => {
                if (t.literal.length > 0) {
                    matcherSequence1.push({anonymous: this.matcherForLiteral(t.literal, consumeWhiteSpaceBetweenTokens)});
                }
                matcherSequence1.push({reference: t.element.elementName});
            });
        matcherSequence1.push({anonymous: this.matcherForLiteral(match.trailing, consumeWhiteSpaceBetweenTokens)});
        return matcherSequence1;
    }

    private populateSpecifiedElements(elements: any, definitionSpecs: DefinitionSpec[]): DefinitionSpec[] {
        return definitionSpecs.map(t => {
                if (isReference(t) && elements[t.reference]) {
                    return {
                        named: {
                            name: t.reference,
                            matcher: toMatchingLogic(elements[t.reference]),
                        },
                    };
                } else {
                    return t;
                }
            });
    }

    private inferUnspecifiedElements(definitionSpecs: DefinitionSpec[]): SatisfiedDefinitionSpec[] {
        return definitionSpecs.map((s, i) => {
            if (isReference(s)) {
                const next = definitionSpecs[i + 1];
                if (!next) {
                    throw new Error("I expect to have some sort of trailing matcher");
                }
                if (isReference(next)) {
                    throw new Error(
                        "There are two elements in a row without something more specific in between them");
                }
                const untilTheNextThing = new Break(matcherFrom(next));
                return {
                    named: {
                        name: s.reference,
                        matcher: untilTheNextThing,
                    },
                };
            } else {
                return s;
            }
        });
    }

    private definitionsFromSpecs(id: string, definitionSpecs: SatisfiedDefinitionSpec[]): object {
        const definitions = { $id: id };
        definitionSpecs.forEach(t => {
            if (isAnonymous(t)) {
                this.addAnonymousToDefinitions(definitions, t.anonymous);
            }
            if (isNamed(t)) {
                definitions[t.named.name] = t.named.matcher;
            }
        });
        return definitions;
    }

    private matcherForLiteral(literal: string, consumeWhiteSpaceBetweenTokens: boolean) {
        if (!consumeWhiteSpaceBetweenTokens) {
            return new Literal(literal);
        }
        // TODO why, if we don't put this in, does it fail?
        // Is this just in Nashorn?
        // it gets TypeError: literal.split is not a function
        if (typeof literal === "string") {
            const whiteSpaceSeparated = literal.split(/\s/);
            if (whiteSpaceSeparated.length === 1) {
                return new Literal(literal);
            } else {
                const definitions = {};
                whiteSpaceSeparated.forEach(token => {
                    if (token.length > 0) {
                        this.addAnonymousToDefinitions(definitions, new Literal(token));
                    }
                });
                return new Concat(definitions);
            }
        }
    }

    private addAnonymousToDefinitions(definitions: any, matcher: MatchingLogic) {
        const arbName = `_${this.anonFieldCount++}`;
        definitions[arbName] = matcher;
    }

}

interface Anonymous {
    anonymous: MatchingLogic;
}

interface Reference {
    reference: string;
}

interface Named {
    named: {
        name: string,
        matcher: MatchingLogic,
    };
}

type DefinitionSpec = Anonymous | Reference | Named;
type SatisfiedDefinitionSpec = Anonymous | Named;

// Dogfooding idea:
// I wonder if I could make a Rug to generate these.
// It could choose any property unique to each alternative.
// Then I could put my learnings in the Rug. For instance, this !! strategy will
// return false if the scrutinized property contains empty string >:-(
// Then, the trick is, can I also make it configure a reviewer
// that will flag an error if, say, I ever added the "named:" property
// to one of the other alternatives? (If the property used to distinguish
// ever became not unique)
// ... that reviewer could check for this structure
// and could run on TS files generally. Can it make a comment on a PR?
function isAnonymous(thing: DefinitionSpec): thing is Anonymous {
    return !!(thing as Anonymous).anonymous;
}

function isReference(thing: DefinitionSpec): thing is Reference {
    return !!(thing as Reference).reference;
}

function isNamed(thing: DefinitionSpec): thing is Named {
    return !!(thing as Named).named;
}

function matcherFrom(definitionSpec: SatisfiedDefinitionSpec) {
    if (isAnonymous(definitionSpec)) {
        return definitionSpec.anonymous;
    } else {
        return definitionSpec.named.matcher;
    }
}
