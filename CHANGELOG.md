# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

[Unreleased]: https://github.com/atomist/microgrammar/compare/0.5.1...HEAD

### Added

-   Added nesting support via `fromString` function for `Microgrammar.fromString`
-   Introduced `FromStringOptions` to customize `Microgrammar.fromString` behavior
-   Added `FromStringOptions.ellipsis` option for `Microgrammar.fromString` specs to skip over intervening content
    without binding. Defaults to `...`.
-   Added `FromStringOptions.componentPrefix` option for `Microgrammar.fromString` specs to 
    specify component prefix. Defaults to former `$`.

### Changed

-   Fixed `skipTo` where target matcher is a non-terminal
-   Fixed `Integer` to accept 0 but not accept a pattern with a leading 0

## [0.5.1] - 2017-07-09

Bug fix - remove cycle

### Changed

-   **Breaking** `Break` is now for internal use, to avoid cycle with `Concat`. 
    Use functions in `Skip` to achieve `Break` behavior.

## [0.5.0] - 2017-07-09

Config and context overhaul release

### Added

-   Added `flatten` method for working with `Opt`
-   Tiered contexts for current parse and current match
-   Convenience functions `atLeastOne` and `zeroOrMore` for working with repetition
-   `RestOfLine` convenience matcher function

### Changed

-   **Breaking** Configuration properties are now added to definition literals 
    directly
-   **Breaking** `Regex` now adds a start anchor if none is specified
-   **Breaking** `Concat` moved to `matchers` directory as it should not be
used directly by end users in most cases
-   Matches should now support JSON stringification with circularity

## [0.4.1] - 2017-07-04

[0.4.1]: https://github.com/atomist/microgrammar/compare/0.4.0...0.4.1

Bugfix

### Changed

- `Literal` and `Span` were not fully implementing the `matchPrefix` of the 
  `MatchingLogic` interface

## [0.4.0] - 2017-07-02

[0.4.0]: https://github.com/atomist/microgrammar/compare/0.4.0...0.3.11

API clarification release

### Added

- `exactMatch` method on `Microgrammar` to insist on
matching entire input.

### Changed

- **Breaking** Introduced `matchers` package. Broke `skip` and `snobol`
functionality into own packages under it. Moved `java` under it.
- **Breaking** Introduced `spi` and `internal` packages to clearly
specify user API
- **Breaking** Matcher properties with names starting with `_` are no longer bound to the
pattern match

## [0.3.11] - 2017-06-29

[0.3.11]: https://github.com/atomist/microgrammar/compare/0.3.10...0.3.11

Performance release

### Changed

-   Various performance improvements

## [0.2.0] - 2017-06-21

[0.2.0]: https://github.com/atomist/microgrammar/compare/0.1.0...0.2.0

Alt release

### Changed

-   Make Alt accept any number of alternatives

## [0.1.0] - 2017-06-20

[0.1.0]: https://github.com/atomist/microgrammar/tree/0.1.0

Initial release
