import assert = require("power-assert");

import { Term } from "../src/Matchers";
import { Microgrammar } from "../src/Microgrammar";
import { Integer, LowercaseBoolean, Regex } from "../src/Primitives";
import { Break } from "../src/snobol/Snobol";

import { Alt } from "../src/Ops";

const sample = `# An AMI
variable "ami" {
  description = "the AMI to use"
}

/* A multi
   line comment. */
resource "aws_instance" "web" {
  ami               = "\${var.ami}"
  count             = 2
  source_dest_check = false

  connection {
    user = "root"
  }
}
`;

describe("Parsing HCL", () => {

    // Function so as not to trigger eager loading, which can fail tests
    function hclString() {
        return Microgrammar.fromString(`"\${stuffUntilNextQuote}"`, {
            stuffUntilNextQuote: new Break('"'),
        });
    }

    const hclNumber = Integer;

    it("should find key/value pairs from string", () => {
        const mg = Microgrammar.fromString("${key} = ${value}", {
            key: /[a-z_]+/,
            value: new Alt(new Alt(LowercaseBoolean, hclString), hclNumber),
        });

        const matches = mg.findMatches(sample);
        // console.log("found these from a string: ");
        // matches.forEach((m: any) => console.log(`${m.key} = ${m.value}`));
        assert(matches.length === 5);
    });

    it("should find number key/value pairs from definitions", () => {
        const mg = Microgrammar.fromString("${key} = ${value}", {
            key: /[a-z_]+/,
            value: new Alt(new Alt(LowercaseBoolean, hclString), hclNumber),
        });

        const mg2 = Microgrammar.fromDefinitions({
            key: /[a-z_]+/,
            _equals: "=",
            value: hclNumber,
        } as Term);

        const matches = mg2.findMatches(sample);
        // matches.forEach((m: any) => console.log(`${m.key} = ${m.value}`))
        assert(matches.length === 1);
        const m: any = matches[0];
        assert(m.key === "count");
        assert(m.value === 2);
    });
});
