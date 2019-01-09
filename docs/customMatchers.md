# Defining Custom Matchers
Microgrammar capabilities can be extended by implementing the `MatchingLogic` interface. Implementations of `MatchingLogic` can be used in microgrammar definition fields.

While this is a low level interface, it's not hard to implement. As an example, consider the core `Literal` class that matches a literal string:

```typescript
export class Literal implements MatchingLogic {

    public $id = `Literal[${this.literal}]`;

    constructor(public literal: string) {
    }

    public matchPrefix(is: InputState): MatchPrefixResult {
        const peek = is.peek(this.literal.length);
        return (peek === this.literal) ?
            matchPrefixSuccess(new TerminalPatternMatch(this.$id, this.literal, is.offset, this.literal) ) :
            new MatchFailureReport(this.$id, is.offset, {},
                `Did not match literal [${this.literal}]: saw [${peek}]`);
    }

    public canStartWith(char: string): boolean {
        return this.literal[0] === char;
    }

    get requiredPrefix(): string {
        return this.literal;
    }
}
```

The most important method is `matchPrefix`. This implementation looks ahead in the input using the `InputState` interface to see if a match is possible. If it is not, it returns a `MatchFailureReport`. The remaining two methods are optional, for optimization.

The full `MatchingLogic` interface is as follows:

```typescript
export interface MatchingLogic extends Term {

    /**
     * Optimization property. Prefix that's required for this to match.
     * Return undefined if we don't know. If we can provide this information,
     * it can make matching much more efficient if this is the first
     * matcher in a Microgrammar.
     */
    readonly requiredPrefix?: string;

    /**
     * Core matching method. Can we match at the present point in the
     * given InputState? Context arguments may be used by matchers that
     * require knowledge of current match or global context.
     * @param is input state
     * @param thisMatchContext context for this match, beginning from the top level and
     * passed into nested matchers
     * @param parseContext context for the whole parsing operation we're in: e.g. parsing a file
     */
    matchPrefix(is: InputState, thisMatchContext: {}, parseContext: {}): MatchPrefixResult;

    /**
     * Optimization method. Can a match start with this character?
     * @param char character to test for
     */
    canStartWith?(char: string): boolean;

}
```