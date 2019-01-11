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

export * from "./lib/InputState";

export * from "./lib/Matchers";

export { Concat } from "./lib/matchers/Concat"; // Using this can cause extraneous type errors. Prefer MatchingLogic (an interface)

export { flatten } from "./lib/matchers/Functions";

export * from "./lib/matchers/skip/Skip";

export * from "./lib/matchers/snobol/Span";

export { isSuccessfulMatch } from "./lib/MatchPrefixResult";

export * from "./lib/Microgrammar";

export * from "./lib/Grammar";

export * from "./lib/microgrammarConstruction";

export * from "./lib/Ops";

export { isPatternMatch } from "./lib/PatternMatch";

export * from "./lib/Primitives";

export * from "./lib/Rep";

export { JavaBlock } from "./lib/matchers/lang/cfamily/java/JavaBody";

export { parenthesizedExpression, blockContaining } from "./lib/matchers/lang/cfamily/CBlock";
