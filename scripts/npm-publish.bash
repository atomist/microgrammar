#!/bin/bash

set -o pipefail

declare Pkg=npm-publish
declare Version=0.4.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

function main() {
    msg "packaging module"
    if ! cp -r build/src/* .; then
        err "packaging module failed"
        return 1
    fi

    # npm honors this
    rm -f .gitignore

    if [[ $NPM_TOKEN ]]; then
        msg "creating local .npmrc using NPM token from environment"
        if ! ( umask 077 && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc" ); then
            err "failed to create $HOME/.npmrc"
            return 1
        fi
    else
        msg "assuming your .npmrc is setup correctly for this project"
    fi
    if ! npm publish "$@"; then
        err "failed to publish node module"
        cat npm-debug.log
        return 1
    fi
}

main "$@" || exit 1
exit 0
