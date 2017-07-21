import { Concat } from "../../../Concat";
import { block, blockContaining, parenthesizedExpression } from "../CBlock";
import { JavaContentStateMachine } from "./JavaContentStateMachine";

/**
 * Match a Java block with balanced curlies
 * @type {Term}
 */
export const JavaBlock = block(() => new JavaContentStateMachine());

export function javaBlockContaining(m: Concat) {
    return blockContaining(() => new JavaContentStateMachine(), m);
}

/**
 * Match a parenthesized Java expression with ()
 * @type {Concat}
 */
export const JavaParenthesizedExpression =
    parenthesizedExpression(() => new JavaContentStateMachine());
