#!/usr/bin/env bash
# Build the offline dashboard + Android APK on this Mac, then commit and push to GitHub.
# Usage (from learning-dashboard):  bash scripts/publish.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ "$(uname)" = "Darwin" ] || { echo "Run this on your Mac (the APK builder needs macOS)."; exit 1; }
version=$(sed -n "s/.*versionName '\([^']*\)'.*/\1/p" android-companion/build.gradle)
echo "▶ Checks"
npx tsc --noEmit -p .
node --experimental-strip-types --test tests/*.test.mjs >/dev/null && echo "  tests passed"
echo "▶ Building offline dashboard"
npm run build:offline
echo "▶ Building Android APK $version"
python3 android-companion/build-local.py
echo "▶ Committing and pushing"
git add -A public/downloads android-companion/assets app lib offline scripts android-companion/AndroidManifest.xml android-companion/build.gradle tests
git diff --cached --quiet || git commit -m "Build Android $version"
git push origin HEAD
echo "✔ Published. Install on your phone from:"
echo "  https://github.com/itssrokay/StudyBit-Air/raw/main/public/downloads/learning-space-android.apk"
