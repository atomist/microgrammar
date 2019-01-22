import { MatchingLogic } from "../../../../Matchers";
import { DelimitedLiteral } from "../DelimitedLiteral";

export function regexLiteral(): MatchingLogic {
    return new DelimitedLiteral("/");
}
