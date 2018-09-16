/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    JavaBlock,
    JavaParenthesizedExpression,
} from "../../lib/matchers/lang/cfamily/java/JavaBody";
import { Microgrammar } from "../../lib/Microgrammar";
import { Opt } from "../../lib/Ops";
import { Rep, Rep1 } from "../../lib/Rep";

export const JAVA_IDENTIFIER = /[a-zA-Z_$][a-zA-Z0-9_$]*/;

export const AnyAnnotation = Microgrammar.fromDefinitions<RawAnnotation>({
    _at: "@",
    name: JAVA_IDENTIFIER,
    _content: new Opt(JavaParenthesizedExpression),
    content: ctx => {
        const cont = ctx._content ? ctx._content.block : "";
        return cont;
    },
});

export interface RawAnnotation {

    name: string;

    /**
     * Annotation content (within parentheses, not parsed). May be undefined
     */
    content: string;

}

export const ChangeControlledMethodGrammar = Microgrammar.fromDefinitions<ChangeControlledMethod>({
    annotations: new Rep1(AnyAnnotation),
    _check(ctx: any) {
        const found = ctx.annotations.filter(a => a.name === "ChangeControlled");
        if (found.length === 0) {
            return false;
        }
        ctx.changeControlledAnnotation = found;
        return true;
    },
    _visibilityModifier: "public",
    type: JAVA_IDENTIFIER,
    name: JAVA_IDENTIFIER,
    parameterContent: JavaParenthesizedExpression,
    body: JavaBlock,
});

export const GrammarWithOnlyARep = Microgrammar.fromDefinitions<any>({
    annotations: new Rep(AnyAnnotation),
});

export interface ChangeControlledMethod {

    annotations: RawAnnotation[];

    changeControlledAnnotation: RawAnnotation;

    name: string;

    parameterContent: { block: string };

    body: { block: string };

}
