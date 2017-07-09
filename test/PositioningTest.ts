import { Microgrammar } from "../src/Microgrammar";
import { Rep } from "../src/Rep";
import { ALL_DEPENDENCY_GRAMMAR, VersionedArtifact } from "./MavenGrammars";

import assert = require("power-assert");

describe("Positioning", () => {

    describe("should get position of pattern", () => {
        it("should do it", () => {
            const m = DEPENDENCY_MANAGEMENT_GRAMMAR.firstMatch(PomWithDependencyManagement) as any;
            assert(m);
            assert(m.startElement);
            // console.log(JSON.stringify(m.startElement));
            assert(m.$valueMatches.startElement);
        });
    });
});

const DEPENDENCY_MANAGEMENT_GRAMMAR =
    Microgrammar.fromDefinitions<{ startElement: string, dependencies: VersionedArtifact[] }>({
        startElement: "<dependencyManagement>",
        _deps: "<dependencies>",
        dependencies: new Rep(ALL_DEPENDENCY_GRAMMAR),
    });

const PomWithDependencyManagement =
    `<?xml version="1.0" encoding="UTF-8"?>
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
		<version>1.3.6.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<java.version>1.8</java.version>
	</properties>


<dependencyManagement>
     <dependencies>
         <dependency>
             <groupId>Benign</groupId>
             <artifactId>supergenerous</artifactId>
             <version>2.0</version>
             <type>pom</type>
             <scope>test</scope>
         </dependency>
     </dependencies>
 </dependencyManagement>
    <dependencies>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>

</project>
`;
