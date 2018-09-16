import { ChangeSet } from "./ChangeSet";

import {
    isTreePatternMatch,
    PatternMatch,
} from "../PatternMatch";

export interface MatchUpdater {
    newContent(): string;
    replaceAll(newValue: string): void;
}

/**
 * Handle low level updating using get/set properties
 */
export class MicrogrammarUpdates {

    public updatableMatch<T>(match: T & PatternMatch, cs: ChangeSet | string): T & MatchUpdater {
        const changeSet = (typeof cs === "string") ? new ChangeSet(cs) : cs;
        const updating: any = {
            $changeSet: changeSet,
            newContent() {
                return this.$changeSet.updated();
            },
            replaceAll(newValue: string) {
                this.$changeSet.change(match, newValue);
            },
        };
        this.addMatchesAsProperties(updating, updating.$changeSet, match);
        return updating as (T & MatchUpdater);
    }

    /**
     * adds each match as a property to the target, with setters that update the changeset
     * @param target
     * @param cs
     * @param match
     */
    private addMatchesAsProperties(target: object, cs: ChangeSet, match: PatternMatch): void {
        if (isTreePatternMatch(match)) {
            const submatches = match.submatches();
            // tslint:disable-next-line:forin
            for (const key in submatches) {
                const submatch = submatches[key] as PatternMatch;
                let initialValue;
                if (isTreePatternMatch(submatch) && submatch.submatches() === {}) {
                    initialValue = submatch.$matched; // or $value ? they should both be the string value.
                    // this could also be derived from content + offset, which reduces memory consumption
                } else if (isTreePatternMatch(submatch)) {
                    initialValue = {};
                    this.addMatchesAsProperties(initialValue, cs, submatch);
                } else if (submatch) {
                    initialValue = submatch.$value;
                }

                const privateProperty = "_" + key;

                // https://stackoverflow.com/questions/12827266/get-and-set-in-typescript
                target[privateProperty] = initialValue;
                Object.defineProperty(target, key, {
                    get() {
                        return ((target as any).$invalidated) ?
                            undefined :
                            this[privateProperty];
                    },
                    set(newValue) {
                        if ((target as any).$invalidated) {
                            throw new Error(`Cannot set [${key}] on [${target}]: invalidated by parent change`);
                        }
                        target[privateProperty] = newValue;
                        cs.change(submatch, newValue);
                        if (isTreePatternMatch(submatch) && submatch.submatches() !== {}) {
                            // The caller has set the value of an entire property block.
                            // Invalidate the properties under it
                            for (const prop of Object.getOwnPropertyNames(target)) {
                                if (typeof target[prop] === "object") {
                                    target[prop].$invalidated = true;
                                }
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
            }
        } else {
            // console.log(`Not a tree pattern match: ${JSON.stringify(match)}`);
        }
    }
}
