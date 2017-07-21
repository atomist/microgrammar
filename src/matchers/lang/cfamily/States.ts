
import { LangState } from "../LangStateMachine";
export const Normal = new LangState("normal", false, false);
export const DoubleString = new LangState("string", false, true);
export const SlashStarComment = new LangState("CComment", true, false);
export const SlashSlashComment = new LangState("//comment", true, false);
