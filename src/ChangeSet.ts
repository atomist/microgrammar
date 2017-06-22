import { PatternMatch } from "./PatternMatch";

function replaceFirstAfter(content: string, offset: number, old: string, replacement: string) {
    return content.substring(0, offset) + content.substring(offset).replace(old, replacement);
}

// TODO this should also support streaming
export class ChangeSet {

    private changes: Change[] = [];

    constructor(private initialContent: string) { }

    public change(match: PatternMatch, to: string) {
        const change = new Change(match, to);
        // Don't add twice: update
        const found = this.changes.filter(c => c.match === match);
        if (found.length === 0) {
            this.changes.push(change);
            // Keep sorted with latest first
            this.changes.sort((pm1, pm2) => pm2.match.$offset - pm1.match.$offset);
        } else {
            const idx = this.changes.indexOf(found[0]);
            this.changes[idx] = change;
        }
    }

    public updated(): string {
        if (this.changes.length === 0) {
            return this.initialContent;
        }
        let result = this.initialContent;
        for (const change of this.changes) {
            // console.log(`Applying change at ${change.match.$offset} to ${change.to}`)
            result = replaceFirstAfter(
                result,
                change.match.$offset,
                change.match.$matched,
                change.to);
        }
        if (!result) {
            throw new Error("Anomaly: !result");
        }
        return result;
    }
}

class Change {

    constructor(public match: PatternMatch, public to: string) { }
}
