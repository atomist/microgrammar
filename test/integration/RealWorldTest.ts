
import { Microgrammar } from "../../src/Microgrammar";
import { Alt, Opt } from "../../src/Ops";
import { RepSep } from "../../src/Rep";

import { Break } from "../../src/matchers/snobol/Break";

import * as assert from "power-assert";

describe("Real world usage", () => {

    it("no methods found", () => {
        const methods = new MethodSignatureGrammar().methodSignature.findMatches("");
        assert(methods.length === 0);
    });

    it("method found", () => {
        const methods = new MethodSignatureGrammar().methodSignature.findMatches(
            `public String home() {"
        return "Hello REST Microservice World";
    }"`);
        const match = methods[0] as any;
        assert(match.$matched === "public String home() {");
        assert(match.annotations.length === 0);
        assert(match.modifier === "public");
        assert(match.returnType === "String");
        assert(match.name === "home");
        assert(match.params.length === 0);
    });

    it("method found with annotations", () => {
        const methods = new MethodSignatureGrammar().methodSignature.findMatches(
            `@RequestMapping
    public String home() {
        return "Hello REST Microservice World";
    }`);
        const match = methods[0] as any;
        assert(match.$matched === "@RequestMapping\n    public String home() {");
        assert(match.annotations.length === 1);
        assert(match.annotations[0].annotation.name === "RequestMapping");
        assert(match.modifier === "public");
        assert(match.returnType === "String");
        assert(match.name === "home");
        assert(match.params.length === 0);
    });

    it("method found with parameters", () => {
        const methods = new MethodSignatureGrammar().methodSignature.findMatches(
            `public String home(String target) {
        return "Hello " + target;
    }`);
        const match = methods[0] as any;
        assert(match.$matched === "public String home(String target) {");
        assert(match.annotations.length === 0);
        assert(match.modifier === "public");
        assert(match.returnType === "String");
        assert(match.name === "home");
        assert(match.params.length === 1);
        assert(match.params[0].name === "target");
        assert(match.params[0].type === "String");
        assert(match.params[0].annotations.length === 0);
    });

    it("handle complex grammar with nesting", () => {
        const methods = new MethodSignatureGrammar().methodSignature.findMatches(
            `public String home(@PathVariable String target) {
        return "Hello " + target;
    }`);
        const match = methods[0] as any;
        assert(match.$matched === "public String home(@PathVariable String target) {");
        assert(match.name === "home");
        assert(match.annotations.length === 0);
        assert(match.modifier === "public");
        assert(match.returnType === "String");
        assert(match.params.length === 1);
        assert(match.params[0].name === "target");
        assert(match.params[0].type === "String");
        assert(match.params[0].annotations.length === 1);
        assert(match.params[0].annotations[0].annotation.name === "PathVariable");
    });

});

class MethodSignatureGrammar {

    public readonly javaIdentifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;
    public readonly javaTypePattern = /^[a-zA-Z_$\.][a-zA-Z0-9_$\.]*/;

    public javaAnnotationGrammar = new AnnotationGrammar();

    public readonly methodSignature = Microgrammar.fromDefinitions({
        annotations: new RepSep({
            annotation: this.javaAnnotationGrammar.annotation,
        }, ","),
        modifier: new Alt("public", "private"), // should handle more than two cases including protected and blank
        returnType: this.javaTypePattern,
        name: this.javaIdentifierPattern,
        _lpar: "(",
        params: new RepSep({
            annotations: new RepSep({
                annotation: this.javaAnnotationGrammar.annotation,
            }, ","),
            type: this.javaTypePattern,
            name: this.javaIdentifierPattern,
        }, ","),
        _rpar: ")",
        _lbrac: "{",
        $id: "methodSignature",
    });

}

export class AnnotationGrammar {

    public readonly javaIdentifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;
    public readonly javaTypePattern = /^[a-zA-Z_$\.][a-zA-Z0-9_$\.]*/;

    public readonly javaType = Microgrammar.fromDefinitions({
        text: this.javaTypePattern,
        $id: "javaType",
    });

    public readonly stringText = Microgrammar.
    fromDefinitions({
        _p1: '"',
        text: new Break('"'),
        _p2: '"',
        $id: "stringText",
    });

    public readonly keyValuePairTerm = Microgrammar.fromDefinitions({
        key: this.javaIdentifierPattern,
        _eq: "=",
        value: new Alt(this.javaType, this.stringText),
        $id: "keyValuePair",
    });

    public readonly keyValuePairs = Microgrammar.fromDefinitions({
        pairs: new RepSep({
            pair: this.keyValuePairTerm,
        }, ","),
        $id: "keyValuePairs",
    });

    public readonly annotation =
        this.specificAnnotation(this.javaIdentifierPattern);

    public specificAnnotation(annotationName: string | RegExp) {
        return Microgrammar.fromDefinitions({
            _amp: "@",
            name: annotationName,
            params: new Opt({
                _lpar: "(",
                content: new Alt(this.stringText, this.keyValuePairs),
                _rpar: ")",
            }),
            $id: "annotation",
        });
    }

}
