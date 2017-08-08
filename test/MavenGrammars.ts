import { Concat } from "../src/matchers/Concat";
import { Microgrammar } from "../src/Microgrammar";
import { Opt, when } from "../src/Ops";
import { Rep, Rep1 } from "../src/Rep";

export interface VersionedArtifact {
    group: string;
    artifact: string;
    version: string;
}

export const LEGAL_VALUE = /[a-zA-Z_\.0-9\-]+/;

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
        _version: new Opt(VERSION),
        version: ctx => ctx._version ? ctx._version.version : undefined,
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
        _version: new Opt(VERSION),
        version: ctx => ctx._version ? ctx._version.version : undefined,
    });

const property = {
    _gt: "<",
    name: LEGAL_VALUE,
    _close: ">",
    value: /[^<]+/,
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

export const XML_TAG_WITH_SIMPLE_VALUE = Concat.of({
    _l: "<",
    name: LEGAL_VALUE,
    _r: ">",
    value: LEGAL_VALUE,
    _l2: "</",
    _close: LEGAL_VALUE,
    _ok: ctx => ctx._close === ctx.name,
    _r2: ">",
});

export interface XmlTag {
    name: string;
    value: string;
}

export const GAV_CONCAT = when(Concat.of({
    tags: new Rep1(XML_TAG_WITH_SIMPLE_VALUE),
}), pm => pm.tags.filter(t => t.name === "groupId").length > 0 &&
pm.tags.filter(t => t.name === "artifactId").length > 0);

export class GAV {

    constructor(public group: string, public artifact: string, public version: string) {
    }

}

export const ARTIFACT_VERSION_GRAMMAR = Microgrammar.fromDefinitions({
    // _lx1: "<dependency>",
    lx2: "<version>",
    version: LEGAL_VALUE,
    rx2: "</version>",
});
