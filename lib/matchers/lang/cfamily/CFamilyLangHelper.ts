
import { LangHelper } from "../LangHelper";
import { CFamilyStateMachine } from "./CFamilyStateMachine";
import {
    DoubleString,
    Normal,
    SlashSlashComment,
    SlashStarComment,
} from "./States";

export class CFamilyLangHelper implements LangHelper {

    /**
     * Strip C/C++ comments
     * @param source
     */
    public stripComments(source: string) {
        let stripped = "";
        const sm = new CFamilyStateMachine();
        for (const ch of source) {
            sm.consume(ch);
            switch (sm.state) {
                case SlashStarComment:
                case SlashSlashComment:
                    if (sm.state !== sm.previousState) {
                        // Get rid of the first /, which was written to the string
                        stripped = stripped.substring(0, stripped.length - 1);
                    }
                    break;
                case Normal:
                    if (!(ch === "/" && sm.previousState.comment)) {
                        stripped += ch;
                    }
                    break;
                default:
                    stripped += ch;
            }
        }
        return stripped;
    }

   public stripWhitespace(source: string): string {
        let stripped = "";
        let chunk = "";

        const sm = new CFamilyStateMachine();
        for (const s of source) {
            sm.consume(s);
            switch (sm.state) {
                case DoubleString:
                    // If we've just entered a string, add the stripped chunk that preceded it
                    if (sm.previousState !== DoubleString) {
                        stripped += this.strip(chunk);
                        chunk = "";
                    }
                    // Take all characters from string without stripping whitespace
                    stripped += s;
                    break;
                default:
                    // Add to a chunk that we'll later strip
                    chunk += s;
            }
        }
        stripped += this.strip(chunk);
        return stripped;
    }

    public canonicalize(src: string): string {
        return this.stripWhitespace(this.stripComments(src));
    }

    private strip(src: string): string {
        let stripped = src.replace(/[\s]+/g, " ");
        // Get rid of syntactically unnecessary whitespace
        stripped = stripped.replace(/([{}.@;])\s/g, "$1");
        stripped = stripped.replace(/\s([{}.@;])/g, "$1");
        stripped = stripped.trim();
        return stripped;
    }

}
