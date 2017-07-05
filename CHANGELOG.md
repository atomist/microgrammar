# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

[Unreleased]: https://github.com/atomist/microgrammar/compare/0.3.11...HEAD

### Changed

-   **Breaking** `Concat` moved to `matchers` directory as it should not be
used directly by end users in most cases.


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
