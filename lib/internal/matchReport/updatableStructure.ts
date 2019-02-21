import * as flatten from "lodash.flatten";
import { SuccessfulMatchReport } from "../../MatchReport";
import { ChangeSet } from "../ChangeSet";

interface Delta {
    $offset: number;
    $matched: string;
    $matcherId: string;
    to: string;
}

export interface UpdatableStructureInternal {
    $deltas: Delta[];
}
function isUpdatableStructure(thing: any): thing is UpdatableStructureInternal {
    return !!thing.$deltas;
}

export function applyChanges<T>(updatableStructures: T[], originalContent: string): string {
    if (!updatableStructures.every(isUpdatableStructure)) {
        throw new Error("You gave something that is not an updatable structure. Call toUpdatableStructure on the MatchReport to get the right thing");
    }

    const allDeltas: Delta[] = flatten(updatableStructures.map(s => (s as any as UpdatableStructureInternal).$deltas));
    const changeSet = new ChangeSet(originalContent);
    for (const d of allDeltas) {
        changeSet.change(d, d.to);
    }

    return changeSet.updated();
}

export function toUpdatableStructure<T>(mr: SuccessfulMatchReport): T {
    if ((mr as any).toUpdatableStructure) {
        return (mr as any).toUpdatableStructure() as T;
    }
    throw new Error("I don't know how to do that yet on " + mr.matcher.$id);
}
