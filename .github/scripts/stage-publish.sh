#!/usr/bin/env bash
# Stage next-s3-uploader on npm instead of publishing it directly.
#
# Called by the changesets action (via `pnpm release`) on pushes to main when
# there are no pending changesets. CI can only STAGE the version through npm
# trusted publishing; it goes public once a maintainer approves it on
# npmjs.com with 2FA (`npm stage approve`).
set -euo pipefail

PKG_DIR="packages/next-s3-uploader"
NAME=$(node -p "require('./$PKG_DIR/package.json').name")
VERSION=$(node -p "require('./$PKG_DIR/package.json').version")

# Every push to main reaches this script; only stage versions npm doesn't have.
if npm view "$NAME@$VERSION" version >/dev/null 2>&1; then
  echo "$NAME@$VERSION is already published; nothing to stage."
  exit 0
fi

(cd "$PKG_DIR" && npm stage publish --provenance --access public)

# Create the git tag; changesets/action pushes tags it sees as "New tag:".
pnpm changeset tag

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "## 🔏 Staged on npm: approve to publish"
    echo ""
    echo "\`$NAME@$VERSION\` is staged, not public yet."
    echo "Approve it with 2FA at https://www.npmjs.com/package/$NAME"
    echo "or run \`npm stage list $NAME\` and \`npm stage approve <id>\`."
  } >> "$GITHUB_STEP_SUMMARY"
fi
