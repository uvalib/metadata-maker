#!/usr/bin/env bash
set -euo pipefail

APP_NAME="metadata-maker"
BRANCH_NAME="staging"
S3_BUCKET="metadata-maker"
INCLUDE_PATTERNS=("*.html" "*.js" "*.css" "*.svg")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

command -v aws >/dev/null 2>&1 || { echo "aws CLI is required but not installed." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip utility is required but not installed." >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required but not installed." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required but not installed." >&2; exit 1; }
command -v rsync >/dev/null 2>&1 || { echo "rsync is required but not installed." >&2; exit 1; }

cd "$ROOT_DIR"

echo "Resolving Amplify app ID for '${APP_NAME}'..."
APP_ID="$(aws amplify list-apps --query "apps[?name=='${APP_NAME}'].appId" --output text || true)"
if [[ -z "$APP_ID" || "$APP_ID" == "None" ]]; then
  echo "Amplify app '${APP_NAME}' not found. Aborting deploy." >&2
  exit 1
fi

echo "Syncing static assets to s3://${S3_BUCKET}/ ..."
AWS_SYNC_ARGS=("--exclude" "*")
for pattern in "${INCLUDE_PATTERNS[@]}"; do
  AWS_SYNC_ARGS+=("--include" "$pattern")
done
aws s3 sync "$ROOT_DIR/" "s3://${S3_BUCKET}/" "${AWS_SYNC_ARGS[@]}"

WORK_DIR="$(mktemp -d -t metadata-maker-deploy-XXXXXX)"
ZIP_FILE="${WORK_DIR}/site.zip"
BUNDLE_DIR="${WORK_DIR}/bundle"
mkdir -p "$BUNDLE_DIR"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "Collecting deployment artifacts..."
RSYNC_INCLUDE_ARGS=()
for pattern in "${INCLUDE_PATTERNS[@]}"; do
  RSYNC_INCLUDE_ARGS+=("--include" "$pattern")
done

rsync -av --prune-empty-dirs \
  --exclude '.git/' \
  --exclude '.git/**' \
  --exclude 'node_modules/' \
  --exclude 'node_modules/**' \
  --include '*/' \
  "${RSYNC_INCLUDE_ARGS[@]}" \
  --exclude '*' \
  "$ROOT_DIR"/ "$BUNDLE_DIR"/ >/dev/null

if [[ -z "$(find "$BUNDLE_DIR" -type f)" ]]; then
  echo "No files matched the deployment include patterns." >&2
  exit 1
fi

( cd "$BUNDLE_DIR" && zip -q -r "$ZIP_FILE" . )

echo "Requesting Amplify deployment slot..."
DEPLOYMENT_JSON="$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME")"
JOB_ID="$(python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("jobId",""))' <<< "$DEPLOYMENT_JSON")"
UPLOAD_URL="$(python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("zipUploadUrl",""))' <<< "$DEPLOYMENT_JSON")"

if [[ -z "$JOB_ID" || -z "$UPLOAD_URL" ]]; then
  echo "Failed to obtain deployment upload information." >&2
  exit 1
fi

echo "Uploading artifact to Amplify..."
curl --silent --show-error --fail --request PUT --upload-file "$ZIP_FILE" --header "Content-Type: application/zip" "$UPLOAD_URL" >/dev/null

echo "Starting Amplify deployment for job ${JOB_ID}..."
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID"

echo "Deployment triggered successfully."
