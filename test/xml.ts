/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MatchingMachine } from "../lib/Microgrammar";
import { optional } from "../lib/Ops";
import { PatternMatch } from "../lib/PatternMatch";
import { GAV, LEGAL_VALUE, VersionedArtifact, XML_TAG_WITH_SIMPLE_VALUE, XmlTag } from "./MavenGrammars";

export class XmlTracker extends MatchingMachine {

    public dependencies: VersionedArtifact[] = [];

    public elementStack: string[] = [];

    private group: string;
    private artifact: string;
    private version: string;

    constructor() {
        super(XML_TAG_WITH_SIMPLE_VALUE, {
            _l: "<",
            slash: optional("/"),
            name: LEGAL_VALUE,
            _r: ">",
        });
    }

    protected underOneOf(...elts: string[]) {
        return elts.filter(elt => this.elementStack.indexOf(elt) > -1).length > 0;
    }

    protected path() {
        return this.elementStack.join("/");
    }

    protected onMatch(pm: PatternMatch & XmlTag) {
        if (this.elementStack.indexOf("dependencies") > -1 &&
            !this.underOneOf("dependencyManagement", "plugin", "pluginManagement", "exclusions")) {
            // We're building a dependency
            switch (pm.name) {
                case "groupId":
                    this.group = pm.value;
                    break;
                case "artifactId":
                    this.artifact = pm.value;
                    break;
                case "version":
                    this.version = pm.value;
                    break;
                default:
            }
        }
        return this.matcher;
    }

    protected observeMatch(patternMatch) {
        const pm: { name: string, slash } = patternMatch;
        if (pm.slash) {
            this.elementStack.pop();
            if (pm.name === "dependency") {
                if (this.group && this.artifact) {
                    const va = new GAV(this.group, this.artifact, this.version);
                    this.dependencies.push(va);
                    this.group = this.artifact = this.version = undefined;
                }
            }
        } else {
            this.elementStack.push(pm.name);
        }
        return this.matcher;
    }
}

export const POM_WITHOUT_DEPENDENCY_MANAGEMENT = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example</groupId>
	<artifactId>multi</artifactId>
	<version>0.1.0</version>
	<packaging>jar</packaging>

	<name>multi</name>
	<description>Multi project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.3.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>

		<dependency>
			<groupId>com.foo.bar</groupId>
			<artifactId>foobar</artifactId>
			<version>1.0.0</version>
		</dependency>

	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
	    	<plugin>
		    	<groupId>group</groupId>
		    	<artifactId>art</artifactId>
		    	<version>1.0.1</version>
		    </plugin>

		</plugins>
	</build>

</project>
`;

export const ADD_DEPENDENCY = "<!-- dep -->";

export const REPLACE_ME = "<!-- -->";

export const POM_WITH_DEPENDENCY_MANAGEMENT = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example</groupId>
	<artifactId>multi</artifactId>
	<version>0.1.0</version>
	<packaging>jar</packaging>

	<name>multi</name>
	<description>Multi project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>1.5.3.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-framework-bom</artifactId>
                <version>4.3.8.RELEASE</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

	<dependencies>

		<dependency>
			<groupId>com.foo.bar</groupId>
			<artifactId>foobar</artifactId>
			<version>1.0.0</version>
			${REPLACE_ME}
		</dependency>

        ${ADD_DEPENDENCY}

	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
	    	<plugin>
		    	<groupId>group</groupId>
		    	<artifactId>art</artifactId>
		    	<version>1.0.1</version>
		    </plugin>

		</plugins>
	</build>

</project>
`;
