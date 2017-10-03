#!/bin/bash
# build and test a node module

set -o pipefail

declare Pkg=travis-build-node
declare Version=0.4.1

# write message to standard out (stdout)
# usage: msg MESSAGE
function msg() {
    echo "$Pkg: $*"
}

# write message to standard error (stderr)
# usage: err MESSAGE
function err() {
    msg "$*" 1>&2
}

# git tag and push
# usage: git-tag TAG
function git-tag () {
    local tag=$1
    if [[ ! $tag ]]; then
        err "git-tag: missing required argument: TAG"
        return 10
    fi

    if ! git config --global user.email "travis-ci@atomist.com"; then
        err "failed to set git user email"
        return 1
    fi
    if ! git config --global user.name "Travis CI"; then
        err "failed to set git user name"
        return 1
    fi
    if ! git tag "$tag" -m "Generated tag from TravisCI build $TRAVIS_BUILD_NUMBER"; then
        err "failed to create git tag: $tag"
        return 1
    fi
    local remote=origin
    if [[ $GITHUB_TOKEN ]]; then
        remote=https://$GITHUB_TOKEN:x-oauth-basic@github.com/$TRAVIS_REPO_SLUG.git
    fi
    if ! git push --quiet "$remote" "$tag" > /dev/null 2>&1; then
        err "failed to push git tag: $tag"
        return 1
    fi
}

# npm publish
# usage: npm-publish [NPM_PUBLISH_ARGS]...
function npm-publish () {
    msg "packaging module"
    if ! cp -r build/src/* .; then
        err "packaging module failed"
        return 1
    fi

    # npm honors this
    rm -f .gitignore

    if ! npm publish "$@"; then
        err "failed to publish node module"
        cat $HOME/.npm/_logs/*-debug.log
        return 1
    fi

    if ! git checkout -- .gitignore; then
        err "removed .gitignore and was unable to check out original"
        return 1
    fi

    local pub_file pub_base
    for pub_file in build/src/*; do
        pub_base=${pub_file#build/src/}
        rm -rf "$pub_base"
    done
}

# publish a public timestamp version to non-standard registry
# usage: npm-publish-timestamp [BRANCH]
function npm-publish-timestamp () {
    if [[ ! $NPM_REGISTRY ]]; then
        msg "no team registry set"
        return 0
    fi

    local branch=$1 prerelease
    if [[ $branch ]]; then
        shift
        local safe_branch
        safe_branch=$(echo -n "$branch" | tr -C -s '[:alnum:]-' .)
        if [[ $? -ne 0 || ! $safe_branch ]]; then
            err "failed to create safe branch name from '$branch': $safe_branch"
            return 1
        fi
        prerelease=$safe_branch.
    fi

    local pkg_version
    pkg_version=$(jq -e --raw-output .version package.json)
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
    local project_version=$pkg_version-$prerelease$timestamp
    if ! npm version "$project_version"; then
        err "failed to set package version: $project_version"
        return 1
    fi

    msg "publishing NPM module version $project_version"
    if ! npm-publish --registry "$NPM_REGISTRY" --access public; then
        err "failed to publish to Artifactory NPM registry"
        return 1
    fi

    if ! git-tag "$project_version+travis.$TRAVIS_BUILD_NUMBER"; then
        return 1
    fi
}

# usage: main "$@"
function main () {
    local arg ignore_lint
    for arg in "$@"; do
        case "$arg" in
            --ignore-lint | --ignore-lin | --ignore-li | --ignore-l)
                ignore_lint=1
                ;;
            -*)
                err "unknown option: $arg"
                return 2
                ;;
        esac
    done

    msg "running lint"
    local lint_status
    npm run lint
    lint_status=$?
    if [[ $lint_status -eq 0 ]]; then
        :
    elif [[ $lint_status -eq 2 ]]; then
        err "TypeScript failed to pass linting"
        if [[ $ignore_lint ]]; then
            err "ignoring linting failure"
        else
            return 1
        fi
    else
        err "tslint errored"
        return 1
    fi

    msg "compiling TypeScript"
    if ! npm run compile; then
        err "compilation failed"
        return 1
    fi

    msg "running tests"
    if ! npm test; then
        err "test failed"
        return 1
    fi

    if [[ $TRAVIS_PULL_REQUEST != false ]] ; then
        if [[ $TRAVIS_PULL_REQUEST_BRANCH != master ]]; then
            if ! npm-publish-timestamp "$TRAVIS_PULL_REQUEST_BRANCH"; then
                err "failed to publish PR build"
                return 1
            fi
        else
            msg "will not publish PR from $TRAVIS_PULL_REQUEST_BRANCH"
        fi
    elif [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+(-(m|rc)\.[0-9]+)?$ ]]; then
        if ! npm-publish --access public; then
            err "failed to publish tag build: $TRAVIS_TAG"
            return 1
        fi
        if ! git-tag "$TRAVIS_TAG+travis.$TRAVIS_BUILD_NUMBER"; then
            return 1
        fi
    elif [[ $TRAVIS_BRANCH == master ]]; then
        if ! npm-publish-timestamp; then
            err "failed to publish master build"
            return 1
        fi
    fi
}

main "$@" || exit 1
exit 0
