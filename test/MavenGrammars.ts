import { Concat } from "../src/Concat";
import { Term } from "../src/Matchers";
import { Microgrammar } from "../src/Microgrammar";
import { Opt, when } from "../src/Ops";
import { Rep, Rep1 } from "../src/Rep";

export interface VersionedArtifact {
    group: string;
    artifact: string;
    version: string;
}

export const LEGAL_VALUE = /^[a-zA-Z_\.0-9\-]+/;

const VERSION = {
    lx2: "<version>",
    version: LEGAL_VALUE,
    rx2: "</version>",
};

export const DEPENDENCY_GRAMMAR = Microgrammar.fromDefinitions<VersionedArtifact>({
    _lx1: "<dependency>",
    lx1: "<groupId>",
    group: LEGAL_VALUE,
    rx1: "</groupId>",
    lx: "<artifactId>",
    artifact: LEGAL_VALUE,
    rx: "</artifactId>",
    ...VERSION,
});

/**
 * Take all dependencies, including unversioned ones
 * @type {Microgrammar}
 */
export const ALL_DEPENDENCY_GRAMMAR =
    Microgrammar.fromDefinitions<VersionedArtifact>({
        _lx1: "<dependency>",
        lx1: "<groupId>",
        group: LEGAL_VALUE,
        rx1: "</groupId>",
        lx: "<artifactId>",
        artifact: LEGAL_VALUE,
        rx: "</artifactId>",
        version: new Opt(VERSION, "version"),
    });

export const PLUGIN_GRAMMAR = Microgrammar.fromDefinitions<VersionedArtifact>({
    _lx1: "<plugin>",
    lx1: "<groupId>",
    group: LEGAL_VALUE,
    rx1: "</groupId>",
    lx: "<artifactId>",
    artifact: LEGAL_VALUE,
    rx: "</artifactId>",
    ...VERSION,
});

/**
 * Take all plugins, including unversioned ones
 * @type {Microgrammar}
 */
export const ALL_PLUGIN_GRAMMAR =
    Microgrammar.fromDefinitions<VersionedArtifact>({
        _lx1: "<plugin>",
        lx1: "<groupId>",
        group: LEGAL_VALUE,
        rx1: "</groupId>",
        lx: "<artifactId>",
        artifact: LEGAL_VALUE,
        rx: "</artifactId>",
        version: new Opt(VERSION, "version"),
    });

const property = {
    _gt: "<",
    name: LEGAL_VALUE,
    _close: ">",
    value: /^[^<]+/,
    _gt2: "</",
    _closing: LEGAL_VALUE,
    _done: ">",
};

export const PROPERTIES_GRAMMAR = Microgrammar.fromDefinitions<PropertiesBlock>({
    _po: "<properties>",
    properties: new Rep(property),
    // _pe: "</properties>"
});

/**
 * Interface for returned property
 */
export interface PropertiesBlock {
    properties: Array<{ name: string, value: string }>;
}

export const XML_TAG_WITH_SIMPLE_VALUE =
    when(new Concat({
        _l: "<",
        name: LEGAL_VALUE,
        _r: ">",
        value: LEGAL_VALUE,
        _l2: "</",
        _close: LEGAL_VALUE,
        _r2: ">",
    }), pm => pm._close === pm.name);

export interface XmlTag {
    name: string;
    value: string;
}

export const GAV_CONCAT = when(new Concat({
    tags: new Rep1(XML_TAG_WITH_SIMPLE_VALUE),
}), pm => pm.tags.filter(t => t.name === "groupId").length > 0 &&
    pm.tags.filter(t => t.name === "artifactId").length > 0);

// This correctly handles ordering, which is free
// We should be using this elsewhere
export const GAV_GRAMMAR =
    new Microgrammar(GAV_CONCAT);

export class GAV {

    constructor(public group: string, public artifact: string, public version: string) {
    }

}

export function asVersionedArtifact(tags: XmlTag[]): VersionedArtifact {
    const groups = tags.filter(tag => tag.name === "groupId");
    const artifacts = tags.filter(tag => tag.name === "artifactId");
    const versions = tags.filter(tag => tag.name === "version");
    const group = groups.length === 1 ? groups[0].value : undefined;
    const artifact = groups.length === 1 ? artifacts[0].value : undefined;
    const version = versions.length === 1 ? versions[0].value : undefined;
    return (group && artifact) ?
        new GAV(group, artifact, version) :
        undefined;
}

export const PARENT_STANZA = Microgrammar.fromDefinitions({
    _start: "<parent>",
    gav: GAV_GRAMMAR,
    $id: "parent",
} as Term);

export const FIRST_DEPENDENCY = Microgrammar.fromDefinitions({
    _deps: "<dependencies>",
    dependency: ALL_DEPENDENCY_GRAMMAR,
});

export const FIRST_PLUGIN = Microgrammar.fromDefinitions({
    _plugins: "<plugins>",
    plugin: ALL_PLUGIN_GRAMMAR,
});

export const ARTIFACT_VERSION_GRAMMAR = Microgrammar.fromDefinitions({
    // _lx1: "<dependency>",
    lx2: "<version>",
    version: LEGAL_VALUE,
    rx2: "</version>",
});
