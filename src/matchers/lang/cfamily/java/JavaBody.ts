import { Concat } from "../../../Concat";
import { block, blockContaining, parenthesizedExpression } from "../CBlock";
import { CFamilyStateMachine } from "../CFamilyStateMachine";

/**
 * Match a Java block with balanced curlies
 * @type {Term}
 */
export const JavaBlock = block(() => new CFamilyStateMachine());

export function javaBlockContaining(m: Concat) {
    return blockContaining(m);
}

/**
 * Match a parenthesized Java expression with ()
 * @type {Concat}
 */
export const JavaParenthesizedExpression =
    parenthesizedExpression();
