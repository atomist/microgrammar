import { MatchingLogic } from "../Matchers";
import {
    Concat,
    toMatchingLogic,
} from "../matchers/Concat";
import { Literal } from "../Primitives";

import { stringifyTree } from "stringify-tree";
import { WhiteSpaceHandler } from "../Config";
import { FromStringOptions } from "../FromStringOptions";
import { MatchExplanationTreeNode, toExplanationTree } from "../MatchReport";
import { isPatternMatch } from "../PatternMatch";
import { Break } from "./Break";
import {
    CompleteFromStringOptions,
    completeWithDefaults,
} from "./CompleteFromStringOptions";
import { exactMatch, exactMatchReport } from "./ExactMatch";
import {
    MicrogrammarSpec,
    specGrammar,
} from "./SpecGrammar";

/**
 * Convenient function to create a microgrammar from a spec within another grammar
 * @param spec string spec
 * @param components
 * @param options
 * @returns {Concat}
 */
export function fromString(spec: string, components: object = {}, options: FromStringOptions = {}): Concat {
    return new MicrogrammarSpecParser().fromString(spec, components, options);
}

/**
 * Parses microgrammars expressed as strings.
 */
export class MicrogrammarSpecParser {

    private anonFieldCount = 0;

    public fromString(spec: string, components: object, options: FromStringOptions): Concat {
        const optionsToUse = completeWithDefaults(options);
        const specToUse = this.preprocess(spec, optionsToUse);
        const match = exactMatch<MicrogrammarSpec>(specGrammar(optionsToUse), specToUse);
        if (!isPatternMatch(match)) {
            function stringifyExplanationTree(tn: MatchExplanationTreeNode): string {
                return stringifyTree(tn, n => `${n.successful ? "☻" : "☹"}${n.$name} ${n.reason || "[" + n.$value + "]"}`, n => n.$children);
            }
            console.log("Failed to parse microgrammar: " + specToUse);
            console.log(stringifyExplanationTree(toExplanationTree(exactMatchReport(specGrammar(optionsToUse), specToUse))));
            throw new Error(`Unable to parse microgrammar: ${specToUse}`);
        }
        const matcherSequence1 = this.definitionSpecsFromMicrogrammarSpec(match,
            // tslint:disable-next-line:no-boolean-literal-compare
            (components as WhiteSpaceHandler).$consumeWhiteSpaceBetweenTokens !== false);
        const matcherSequence2 = this.populateSpecifiedElements(components, matcherSequence1);
        const matcherSequence3 = this.inferUnspecifiedElements(matcherSequence2);
        const definitions = this.definitionsFromSpecs(specToUse, matcherSequence3);
        const concat = Concat.of(definitions);
        // Copy config to Concat
        for (const key in components) {
            if (key.charAt(0) === "$") {
                concat[key] = components[key];
            }
        }
        return concat;
    }

    /**
     * Given a spec, replace all the DiscardToken instances with a named,
     * but unbound, matcher spec
     * @param spec spec to preprocess before parsing
     * @param optionsToUse options
     * @returns {string}
     */
    private preprocess(spec: string, optionsToUse: CompleteFromStringOptions): string {
        const split = spec.split(optionsToUse.ellipsis);
        let joined = "";
        for (let i = 0; i < split.length; i++) {
            if (i > 0) {
                joined += `${optionsToUse.componentPrefix}{_discard${i}}`;
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
                    matcherSequence1.push({ anonymous: this.matcherForLiteral(t.literal, consumeWhiteSpaceBetweenTokens) });
                }
                matcherSequence1.push({ reference: t.element.elementName });
            });
        matcherSequence1.push({ anonymous: this.matcherForLiteral(match.trailing, consumeWhiteSpaceBetweenTokens) });
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
            return Concat.of(definitions);
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
