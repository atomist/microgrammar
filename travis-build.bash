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


    local git_tag
    # Publishing the branch privately to npm lets us test downstream projects
    echo "[[ $TRAVIS_PULL_REQUEST != false && $TRAVIS_PULL_REQUEST_BRANCH != master ]]"
    if [[ $TRAVIS_PULL_REQUEST != false && $TRAVIS_PULL_REQUEST_BRANCH != master ]] ; then
      echo "I am a PR build! I have a branch! I will attempt to publish to NPM!"
      if [[ $NPM_TOKEN ]] ; then
          echo "I have an NPM token! It could happen!"
          local current_module_name
          current_module_name=$(jq --raw-output .name package.json)
          if [[ $? -ne 0 || ! -e package.json ]]; then
            err "failed to parse name in package.json"
            return 1
          fi
          local branch_module_name
          branch_module_name="${current_module_name}_$TRAVIS_PULL_REQUEST_BRANCH"

          # update the package.json
          local temp_package_json
          temp_package_json=$(mktemp)
          if [[ $? -ne 0 ]]; then
            err "failed to get a temp file"
            return 1
          fi

          mv package.json ${temp_package_json}
          jq ".name=\"${branch_module_name}\"" ${temp_package_json} > package.json
          if [[ $? -ne 0 || ! -e package.json ]]; then
            err "failed to update name in package.json"
            return 1
          fi
          rm ${temp_package_json}

          # create this file so we can use npm show on private modules
           msg "creating local .npmrc using NPM token from environment"
            if ! ( umask 077 && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc" ); then
                err "failed to create $HOME/.npmrc"
                return 1
            fi
            # tell the npm-publish script that we've done this already
            unset NPM_TOKEN

          # is there already one of these published ?
          local last_existing_version
          last_existing_version=$(npm show ${branch_module_name} version)
          if [[ $? -ne 0 ]] ; then
             # probably not
             echo "Looks like this is the first time we've published this branch, cool"
          else
             # increment the version. First set us to the current, then bump.
             mv package.json ${temp_package_json}
             jq ".version=\"${last_existing_version}\"" ${temp_package_json} > package.json
             if [[ $? -ne 0 || ! -e package.json ]]; then
                err "failed to update version in package.json"
                return 1
             fi
             rm ${temp_package_json}

             if ! npm version -f ; then
                err "failed to increment version in package.json"
                return 1
             fi
          fi

# what version did we pick?
          local pkg_version
          pkg_version=$(jq --raw-output .version package.json)
          if [[ $? -ne 0 || ! $pkg_version ]]; then
            err "failed to parse version from package.json"
            return 1
          fi

          if ! ./npm-publish.bash ${pkg_version} private ; then
            err "fail at publishing"
            return 1
          fi

          echo "Published to npm as ${branch_module_name} version ${pkg_version}"
          git_tag="${branch_module_name}-${pkg_version}"

          if ! git checkout package.json ; then
             echo "WARNING: I changed package.json and couldn't check out the original"
          fi
      else
         echo "No NPM_TOKEN, couldn't publish"
      fi
    fi

    if [[ $TRAVIS_PULL_REQUEST == false ]] ; then
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
            git_tag=$project_version+travis$TRAVIS_BUILD_NUMBER
        fi
    fi


    if [[ $git_tag ]] ; then
        if ! git config --global user.email "travis-ci@atomist.com"; then
            err "failed to set git user email"
            return 1
        fi
        if ! git config --global user.name "Travis CI"; then
            err "failed to set git user name"
            return 1
        fi
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
