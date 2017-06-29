#!/bin/bash
# build and test a node module

set -o pipefail

declare Pkg=travis-build-node
declare Version=0.3.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

# usage: main "$@"
function main () {
    msg "running lint"
    if ! npm run lint; then
        err "tslint failed"
        return 1
    fi

    msg "compiling typescript"
    if ! npm run compile; then
        err "typescript compilation failed"
        return 1
    fi

    msg "running tests"
    if ! npm test; then
        err "npm test failed"
        return 1
    fi

    [[ $TRAVIS_PULL_REQUEST == false ]] || return 0

    if [[ $TRAVIS_BRANCH == master || $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+(-(m|rc)\.[0-9]+)?$ ]]; then
        local project_version
        if [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+(-(m|rc)\.[0-9]+)?$ ]]; then
            project_version=$TRAVIS_TAG
        else
            local pkg_version
            pkg_version=$(jq --raw-output .version package.json)
            if [[ $? -ne 0 || ! $pkg_version ]]; then
                err "failed to parse version from package.json"
                return 1
            fi
            local timestamp
            timestamp=$(date -u +%Y%m%d%H%M%S)
            if [[ $? -ne 0 || ! $timestamp ]]; then
                err "failed to generate timestamp"
                return 1
            fi
            project_version=$pkg_version-$timestamp
        fi

        if ! git config --global user.email "travis-ci@atomist.com"; then
            err "failed to set git user email"
            return 1
        fi
        if ! git config --global user.name "Travis CI"; then
            err "failed to set git user name"
            return 1
        fi
        local git_tag=$project_version+travis$TRAVIS_BUILD_NUMBER
        if ! git tag "$git_tag" -m "Generated tag from TravisCI build $TRAVIS_BUILD_NUMBER"; then
            err "failed to create git tag: $git_tag"
            return 1
        fi
        local remote=origin
        if [[ $GITHUB_TOKEN ]]; then
            remote=https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG
        fi
        if ! git push --quiet --tags "$remote" > /dev/null 2>&1; then
            err "failed to push git tags"
            return 1
        fi
    fi
}

main "$@" || exit 1
exit 0
