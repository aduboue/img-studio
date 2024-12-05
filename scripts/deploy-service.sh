#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: REPOSITORY_NAME parameter required." >&2
  exit 1
fi

PROJECT_ID="ai4screen"
REGION="europe-west9"
MIN_INSTANCE="1"
MAX_INSTANCE="3"
MEMORY="532Mi"
CPU="0.5"
SERVICE_ACCOUNT_EMAIL="$1@$PROJECT_ID.iam.gserviceaccount.com"

gcloud run deploy $1 \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/$1/build:latest \
  --region=$REGION \
  --project=$PROJECT_ID \
  --min-instances=$MIN_INSTANCE \
  --max-instances=$MAX_INSTANCE \
  --memory=$MEMORY \
  --cpu=$CPU \
  --service-account=$SERVICE_ACCOUNT_EMAIL

gcloud run services update-traffic $1 --to-latest --region=$REGION --project=$PROJECT_ID

echo "Service deployed successfully."
