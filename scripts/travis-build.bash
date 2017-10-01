#!/bin/bash
# build and test a node module

set -o pipefail

declare Pkg=travis-build-node
declare Version=0.4.0

function msg() {
    echo "$Pkg: $*"
}

function err() {
    msg "$*" 1>&2
}

# upsert a value in package.json
function edit-package-json () {
    local jpath=$1
    if [[ ! $jpath ]]; then
        err "edit-package-json: missing required argument: JSON_PATH"
        return 10
    fi
    shift
    local value=$1
    if [[ ! $value ]]; then
        err "set-version: missing required argument: VALUE"
        return 10
    fi
    shift

    local pkg_tmp pkg_json=package.json
    pkg_tmp=$(mktemp "$pkg_json.XXXXXX")
    if [[ $? -ne 0 || ! $pkg_tmp ]]; then
        err "failed to create temporary file"
        return 1
    fi
    trap "rm -f $pkg_tmp" RETURN

    if ! cat "$pkg_json" > "$pkg_tmp"; then
        err "failed to copy package.json to $pkg_tmp"
        return 1
    fi

    if ! jq -e "$jpath=\"$value\"" "$pkg_tmp" > "$pkg_json"; then
        err "failed to update $jpath in $pkg_json: $value"
        return 1
    fi
}

# git tag and push
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
        remote=https://$GITHUB_TOKEN@github.com/$TRAVIS_REPO_SLUG
    fi
    if ! git push --quiet "$remote" "$tag" > /dev/null 2>&1; then
        err "failed to push git tag: $tag"
        return 1
    fi
}

# npm publish
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
        cat npm-debug.log
        return 1
    fi

    if ! git checkout -- .gitignore; then
        err "removed .gitignore and was unable to check out original"
        return 1
    fi

    local pub_file pub_base
    for pub_file in build/src/*; do
        pub_base=${$pub_file##*/}
        rm -rf "$pub_base"
    done
}

# publish a public version of master to non-standard registry
function npm-publish-master () {
    if [[ ! $NPM_REGISTRY ]]; then
        msg "no team registry set"
        return 0
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
    local project_version=$pkg_version-$timestamp
    if ! npm version "$project_version"; then
        err "failed to set master build version: $project_version"
        return 1
    fi

    if ! npm-publish --registry "$NPM_REGISTRY" --access public; then
        err "failed to publish to Artifactory NPM registry"
        return 1
    fi

    if ! git-tag "$project_version+travis$TRAVIS_BUILD_NUMBER"; then
        return 1
    fi
}

# publish a restricted version of a PR build
function npm-publish-pr () {
    if [[ ! $NPM_REGISTRY ]]; then
        msg "no team registry set"
        return 0
    fi

    if [[ $TRAVIS_PULL_REQUEST_BRANCH == master ]]; then
        msg "will not publish PR from $TRAVIS_PULL_REQUEST_BRANCH"
        return 0
    fi
    msg "attempting to publish PR build on branch $TRAVIS_PULL_REQUEST_BRANCH"

    local name pkg_json=package.json
    name=$(jq -e --raw-output .name "$pkg_json")
    if [[ $? -ne 0 || ! $name ]]; then
        err "failed to parse name in $pkg_json: $name"
        return 1
    fi
    local branch_module_name="${name}_$TRAVIS_PULL_REQUEST_BRANCH"
    if ! edit-package-json .name "$branch_module_name"; then
        return 1
    fi

    # is there already one of these published?
    local published_version
    published_version=$(npm show "$branch_module_name" version)
    if [[ $? -ne 0 || ! $published_version ]] ; then
        msg "looks like this is the first time we've published this branch, cool"
    else
        if ! npm version "$published_version"; then
            return 1
        fi
        if ! npm version --no-git-tag-version -f patch; then
            err "failed to increment version in $pkg_json"
            return 1
        fi
    fi
    local pkg_version
    pkg_version=$(jq -e --raw-output .version "$pkg_json")
    if [[ $? -ne 0 || ! $pkg_version ]]; then
        err "failed to parse version from $pkg_json"
        return 1
    fi

    if ! npm-publish --registry "$NPM_REGISTRY" --access public; then
        err "npm publish of PR build failed"
        return 1
    fi
    msg "published PR build to npm as $branch_module_name version $pkg_version"

    if ! git checkout -- "$pkg_json"; then
        err "updated $pkg_json and could not check out the original"
    fi
    if ! git-tag "${branch_module_name}-${pkg_version}"; then
        return 1
    fi
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

    if [[ $TRAVIS_PULL_REQUEST != false ]] ; then
        if ! npm-publish-pr; then
            err "failed to publish PR build"
            return 1
        fi
    elif [[ $TRAVIS_TAG =~ ^[0-9]+\.[0-9]+\.[0-9]+(-(m|rc)\.[0-9]+)?$ ]]; then
        if ! npm-publish --access public; then
            err "failed to publish tag build: $TRAVIS_TAG"
            return 1
        fi
        if ! git-tag "$TRAVIS_TAG+travis$TRAVIS_BUILD_NUMBER"; then
            return 1
        fi
    elif [[ $TRAVIS_BRANCH == master ]]; then
        if ! npm-publish-master; then
            err "failed to publish master build"
            return 1
        fi
    fi
}

main "$@" || exit 1
exit 0
