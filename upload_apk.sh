#!/usr/bin/env bash
set -e

# ========================================================
# 🚀 ARKASODHARA TRACKER APK UPLOAD SCRIPT
# ========================================================

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

if [[ "$ACCESS_TOKEN" == eyJ* ]]; then
    echo "❌ ACCESS_TOKEN is a JWT, not an Arkasodhara personal access token."
    echo "   Create a personal access token in Arkasodhara Tracker and replace ACCESS_TOKEN in .env."
    exit 1
fi

PROJECT_ID="096775b3-0069-44a8-819e-c71bb2ae3762"
UPLOAD_URL="https://tracker.arkasodhara.tech/api/apk/upload"
PROJECT_PAGE="https://tracker.arkasodhara.tech/app/projects/dating-application"

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

# If APK not present, build it
if [ ! -f "$APK_PATH" ]; then
    echo "🔨 Building Release APK..."
    cd android
    ./gradlew clean assembleRelease
    cd ..
fi

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Error: APK not found at $APK_PATH"
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
    echo "👉 View build at: $PROJECT_PAGE"
else
    echo "❌ Upload failed with HTTP Status: $HTTP_STATUS"
    echo "Server Response: $BODY"
    exit 1
fi
echo "======================================================="
