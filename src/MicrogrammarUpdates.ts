import { ChangeSet } from "./ChangeSet";
import { PatternMatch } from "./PatternMatch";

export interface MatchUpdater {
    newContent(): string;
    replaceAll(newValue: string): void;
}

export class MicrogrammarUpdates {

    public updateableMatch<T>(match: T & PatternMatch, content: string): T & MatchUpdater {
        const thinger: any = {
            $changeSet: new ChangeSet(content),
            newContent() {
                return this.$changeSet.updated();
            },
            replaceAll(newValue: string) {
                this.$changeSet.change(match, newValue);
            },
        };
        this.addMatchesAsProperties(thinger, thinger.$changeSet, match);
        return thinger as (T & MatchUpdater);
    }

    /**
     * adds each match as a property to the target, with setters that update the changeset
     * @param target
     * @param cs
     * @param match
     */
    private addMatchesAsProperties(target: object, cs: ChangeSet, match: PatternMatch): void {
        const submatches = match.submatches();
        // tslint:disable-next-line:forin
        for (const key in submatches) {
            const submatch = submatches[key] as PatternMatch;
            let initialValue;
            if (submatch.submatches() === {}) {
                initialValue = submatch.$matched; // or $value ? they should both be the string value.
                // this could also be derived from content + offset, which reduces memory consumption
            } else {
                initialValue = {};
                this.addMatchesAsProperties(initialValue, cs, submatch);
            }

            const privateProperty = "_" + key;

            // https://stackoverflow.com/questions/12827266/get-and-set-in-typescript
            target[privateProperty] = initialValue;
            Object.defineProperty(target, key, {
                get() {
                    return this[privateProperty];
                },
                set(newValue) {
                    // console.log("The setter got called");
                    cs.change(submatch, newValue);
                },
                enumerable: true,
                configurable: true,
            });
        }

    }
}
