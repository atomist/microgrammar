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
    local module_version=$1
    if [[ ! $module_version ]]; then
        err "first parameter must be the version number of the module to publish"
        return 10
    fi
    shift

    if ! npm version --allow-same-version --no-git-tag-version "$module_version"; then
        err "failed to set version to $module_version"
        return 1
    fi

    msg "copying compiled types and JavaScript"
    if ! cp -r build/src/* .; then
        err "copying compiled JavaScript failed"
        return 1
    fi

    if [[ $NPM_TOKEN ]]; then
        msg "creating local .npmrc using NPM token from environment"
        if ! ( umask 077 && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc" ); then
            err "failed to create $HOME/.npmrc"
            return 1
        fi
    else
        msg "assuming your .npmrc is setup correctly for this project"
    fi
    if ! npm publish --access=public; then
        err "failed to publish node module"
        cat npm-debug.log
        return 1
    fi
}

main "$@" || exit 1
exit 0
