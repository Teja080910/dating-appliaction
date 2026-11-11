#!/usr/bin/env bash
set -e

# ========================================================
# 🚀 FAST AMARA APK BUILD & UPLOAD SCRIPT
# ========================================================

SKIP_BUILD=false
DO_CLEAN=false

for arg in "$@"; do
  case $arg in
    --skip-build|-s|--no-build)
      SKIP_BUILD=true
      ;;
    --clean|-c)
      DO_CLEAN=true
      ;;
    --help|-h)
      echo "Usage: ./upload_apk.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  (no flags)     Fast incremental build (~30-45s) and upload to Tracker"
      echo "  --skip-build   Skip building, upload existing APK immediately (~5s)"
      echo "  --clean        Clean build (gradlew clean assembleRelease) and upload"
      echo "  --help         Show this help message"
      exit 0
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$ENV_FILE"
    set +a
fi

ACCESS_TOKEN="${ACCESS_TOKEN:-${ARKASODHARA_ACCESS_TOKEN:-}}"

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Missing ACCESS_TOKEN in .env. Add ACCESS_TOKEN='your-token-here' and retry."
    exit 1
fi

PROJECT_ID="096775b3-0069-44a8-819e-c71bb2ae3762"
UPLOAD_URL="https://tracker.arkasodhara.tech/api/apk/upload"
PROJECT_PAGE="https://tracker.arkasodhara.tech/app/projects/dating-application"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

# 1. Build APK if not skipped
if [ "$SKIP_BUILD" = false ]; then
    echo "======================================================="
    if [ "$DO_CLEAN" = true ]; then
        echo "🧹 Performing Full Clean Release Build..."
        GRADLE_CMD="./gradlew clean assembleRelease --no-daemon"
    else
        echo "⚡ Performing Fast Incremental Build (~30-45s)..."
        GRADLE_CMD="./gradlew assembleRelease --no-daemon"
    fi
    echo "======================================================="

    # Clear stale Gradle journal locks if present
    rm -f ~/.gradle/caches/journal-1/journal-1.lock 2>/dev/null || true

    cd android
    $GRADLE_CMD
    cd "$ROOT_DIR"

    # Copy to root Amara-Release.apk
    if [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" "Amara-Release.apk"
        echo "✅ Copied fresh APK to Amara-Release.apk"
    fi
else
    echo "⚡ Skipping build, uploading current APK..."
fi

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Error: APK not found at $APK_PATH"
    echo "Run without --skip-build to build the APK first."
    exit 1
fi

FILE_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo "======================================================="
echo "📦 APK: $APK_PATH ($FILE_SIZE)"
echo "📤 Uploading APK to Arkasodhara Tracker..."
echo "======================================================="

RESPONSE=$(curl --url "$UPLOAD_URL" \
  -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Referer: ${PROJECT_PAGE}" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36" \
  -F "file=@${APK_PATH};filename=app-release.apk;type=application/vnd.android.package-archive" \
  -F "projectId=${PROJECT_ID}" \
  --progress-bar \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*//g')

echo "======================================================="
if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo "🎉 SUCCESS: APK uploaded successfully to Tracker!"
    echo "Response: $BODY"
    echo "👉 View / download build at: $PROJECT_PAGE"
else
    echo "❌ Upload failed with HTTP Status: $HTTP_STATUS"
    echo "Server Response: $BODY"
    exit 1
fi
echo "======================================================="
