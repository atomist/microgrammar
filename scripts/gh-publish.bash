#!/bin/bash
# Push the HTML docs to the appropriate public repository
# serving our github pages

set -o pipefail
declare Pkg=gh-publish-npm
declare Version=0.1.0

# print message to stdout
# usage: msg MESSAGE
function msg() {
    echo "$Pkg: $*"
}

# print message to stderr
# usage: err MESSAGE
function err() {
    msg "$*" 1>&2
}

# push site to github pages branch, default branch=gh-pages
# usage: main [REPO_SLUG [BRANCH [CNAME]]]
function main() {
    local repo_slug=$1
    local branch=$2
    local cname=$3

    if [[ $TRAVIS_PULL_REQUEST && $TRAVIS_PULL_REQUEST != false ]]; then
        return 0
    fi

    local out_dir=.
    local tsconfig=tsconfig.json td_tsconfig=tsconfig-typedoc.json
    if [[ -f $tsconfig ]]; then
        out_dir=$(jq -er '.compilerOptions.outDir' "$tsconfig")
        if [[ $? -ne 0 || ! $out_dir ]]; then
            out_dir=.
            msg "outDir not set in $tsconfig, using '$out_dir'"
        fi

        if ! jq '.compilerOptions.rootDir = "src" | .exclude[.exclude | length] |= . + "test"' "$tsconfig" > "$td_tsconfig"
        then
            err "failed to modify tsconfig for typedoc"
            return 1
        fi
    else
        if ! echo '{"compilerOptions":{"outDir":"build","rootDir":"src"},"exclude":["build","node_modules","test"]}' | jq . > "$td_tsconfig"
        then
            err "failed to create tsconfig for typedoc"
            return 1
        fi
    fi

    local td_dir=$out_dir/typedoc
    rm -rf "$td_dir"
    if ! npm run typedoc -- --tsconfig "$td_tsconfig" --out "$td_dir"; then
        err "failed to create typedoc"
        return 1
    fi
    rm -f "$td_tsconfig"

    local repository
    if [[ $repo_slug ]]; then
        if [[ ! $GITHUB_TOKEN ]]; then
            err "repo slug given but GITHUB_TOKEN environment variable is not set"
            return 1
        fi
        repository=https://$GITHUB_TOKEN:x-oauth-basic@github.com/$repo_slug.git
    else
        # need origin URL since we later delete .git
        repository=$(git remote get-url origin)
        if [[ $? -ne 0 || ! $repository ]]; then
            err "failed to get URL for origin"
            return 1
        fi
        repo_slug=origin
    fi

    if [[ ! $branch ]]; then
        branch=gh-pages
    fi
    local refspec=master:$branch

    if ! cd "$td_dir"; then
        err "failed to change to typedoc directory: $td_dir"
        return 1
    fi
    rm -rf .git

    if ! git init; then
        err "failed to initialize git"
        return 1
    fi

    local commit_msg="Local site push"
    if [[ $TRAVIS == true ]]; then
        if ! git config user.email "travis-ci@atomist.com"; then
            err "failed to set git user email"
            return 1
        fi
        if ! git config user.name "Travis CI"; then
            err "failed to set git user name"
            return 1
        fi

        commit_msg="Generated from $TRAVIS_REPO_SLUG tag '$TRAVIS_TAG' commit '$TRAVIS_COMMIT'"
    fi

    if [[ $cname ]]; then
        if ! echo "$cname" > CNAME; then
            err "failed to create CNAME file: $cname"
            return 1
        fi
    fi

    if ! touch .nojekyll; then
        err "failed to create nojekyll file, continuing"
    fi

    if ! git add .; then
        err "failed to add files for commit"
        return 1
    fi

    if ! git commit -m "$commit_msg"; then
        err "failed to commit site files"
        return 1
    fi

    if ! git push --force --quiet "$repository" "$refspec" > /dev/null 2>&1; then
        err "failed to push site"
        return 1
    fi
    msg "published site to $repo_slug"
}

main "$@" || exit 1
exit 0
