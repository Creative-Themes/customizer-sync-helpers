#!/bin/bash
set -e

BUMP="${1:-patch}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: ./release.sh [patch|minor|major]"
  exit 1
fi

VERSION=$(npm version "$BUMP" --no-git-tag-version)
VERSION="${VERSION#v}"
git add package.json package-lock.json
git commit -m "$VERSION"
git tag "$VERSION"
git push && git push --tags
gh release create "$VERSION" --generate-notes
echo "Released $VERSION"
