#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: REPOSITORY_NAME parameter required." >&2
  exit 1
fi

PROJECT_ID="ad4screen-us"

secret_prefix=$(echo $1 | tr '[:lower:]' '[:upper:]' | tr '-' '_')
secrets=$(gcloud secrets list --format="value(name)" --project=$PROJECT_ID | grep "^$secret_prefix")
# Check if there is .env file and create a secret for each line
if [ -f ".env" ]; then
  if  [ -n "$secrets" ]; then
    for secret in $secrets; do
      gcloud secrets delete $secret --project=$PROJECT_ID --quiet
    done
  fi
  echo "Creating secrets from .env file..."
  while IFS= read -r line || [ -n "$line" ]; do
    secret_name=$(echo $line | cut -d'=' -f1)
    secret_value=$(echo $line | cut -d'=' -f2)
    printf $secret_value | gcloud secrets create $secret_name \
      --data-file=- \
      --project=$PROJECT_ID
  done <.env
else # create .env from secrets
  if  [ -n "$secrets" ]; then
    echo "Creating .env file from secrets..."
    touch .env
    for secret in $secrets; do
      secret_value=$(gcloud secrets versions access latest --secret=$secret --project=$PROJECT_ID)
      echo "$secret=$secret_value" >>.env
    done
  fi
fi