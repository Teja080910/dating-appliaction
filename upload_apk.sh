#!/usr/bin/env bash
set -e

# ========================================================
# 🚀 ARKASODHARA TRACKER APK UPLOAD SCRIPT
# ========================================================

ACCESS_TOKEN="eyJhbGciOiJFUzI1NiIsImtpZCI6ImMxNzk1YWMzLTQzNDgtNDRiMS04N2ZjLTQ0MWExYmE5OGJlYSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RiLmFya2Fzb2RoYXJhLnRlY2gvYXV0aC92MSIsInN1YiI6IjExYWI5YWVlLTI3MmUtNGYyYy1iZGMwLTc1NzJjOWI5ZWIwMyIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjE3OTA1MzcwMjksImlhdCI6MTc5MDUzMzQyOSwiZW1haWwiOiJzYWlsYWtzaG1pYm9ycmE0NUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xqanREZEJSUThmaTdVbHVCRXg4aGZZVDFBdE9nUTlyVk9ZanF6enM5WjM5aGp1UT1zOTYtYyIsImVtYWlsIjoic2FpbGFrc2htaWJvcnJhNDVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlNhaSBMYWtzaG1pIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNhaSBMYWtzaG1pIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGpqdERkQlJROGZpN1VsdUJFeDhoZllUMUF0T2dROXJWT1lqcXp6czlaMzloanVRPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMTMwODAxMTM5NDc5Mzk0MzMzNjQiLCJzdWIiOiIxMTMwODAxMTM5NDc5Mzk0MzMzNjQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc4OTkzMjc5MH1dLCJzZXNzaW9uX2lkIjoiNmY0MTcwZTYtM2E1My00ZDcyLTk0NTktMGJkNGQ5OTVhN2YxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.yYMzHcuhHerlRxetyvYyapRMPIiqotnkbhGhuDKLUI9cMmF5N5oc6ozraizCXIRACo2_We9Si4XyEifgVbXqcg"

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

