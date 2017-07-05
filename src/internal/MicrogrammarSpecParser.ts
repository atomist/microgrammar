import {Config, DefaultConfig} from "../Config";
import {MatchingLogic} from "../Matchers";
import {Concat, toMatchingLogic} from "../matchers/Concat";
import {isPatternMatch} from "../PatternMatch";
import {Literal} from "../Primitives";
import * as MatcherPrinter from "./MatcherPrinter";

import {Break} from "../matchers/snobol/Break";
import {exactMatch} from "./ExactMatch";
import {MicrogrammarSpec, specGrammar} from "./SpecGrammar";

/**
 * Parses microgrammars expressed as strings.
 */
export class MicrogrammarSpecParser {

    private anonFieldCount = 0;

    public fromString(spec: string, elements: object = {}, config: Config = DefaultConfig): Concat {

        const mpr = exactMatch<MicrogrammarSpec>(specGrammar, spec);
        if (!isPatternMatch(mpr)) {
            throw new Error(`Unable to parse microgrammar: ${spec}`);
        }
        const match = mpr as MicrogrammarSpec;

        const matcherSequence1 = this.definitionSpecsFromMicrogrammarSpec(match, config);

        const matcherSequence2 = this.populateSpecifiedElements(elements, matcherSequence1);

        const matcherSequence3 = this.inferUnspecifiedElements(matcherSequence2);

        const definitions = this.definitionsFromSpecs(spec, matcherSequence3);

        return new Concat(definitions, config);
    }

    private definitionSpecsFromMicrogrammarSpec(match: MicrogrammarSpec, config: Config): DefinitionSpec[] {
        // flatMap would work better here
        const matcherSequence1: DefinitionSpec[] = [];
        match.these.forEach(
            t => {
                if (t.literal.length > 0) {
                    matcherSequence1.push({anonymous: this.matcherForLiteral(t.literal, config)});
                }
                matcherSequence1.push({reference: t.element.elementName});
            });
        matcherSequence1.push({anonymous: this.matcherForLiteral(match.trailing, config)});
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
        const definitions = {$id: id};
        definitionSpecs.forEach( t  => {
            if (isAnonymous(t)) {
                this.addAnonymousToDefinitions(definitions, t.anonymous);
            }
            if (isNamed(t)) {
                definitions[t.named.name] = t.named.matcher;
            }
        });
        return definitions;
    }

    private matcherForLiteral(literal: string, config: Config) {
        if (!config.consumeWhiteSpaceBetweenTokens) {
            return new Literal(literal);
        }
        // TODO why, if we don't put this in, does it fail?
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
