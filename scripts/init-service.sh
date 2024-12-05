#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: REPOSITORY_NAME parameter required." >&2
  exit 1
fi

PROJECT_ID="ai4screen"
REGION="europe-west9"

# Checks if a Google Cloud Artifact Repository exists and creates it if it doesn't.
if ! gcloud artifacts repositories describe $1 --location=$REGION --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "Creating repository [$1]..."
  gcloud artifacts repositories create $1 \
    --location=$REGION \
    --repository-format=docker \
    --project=$PROJECT_ID
else
  echo "Repository [$1] already exists."
fi

# Set cleanup policy for the repository
echo "Setting cleanup policy for repository [$1]..."
touch scripts/artifacts-repository-policy.json
echo '
  [
    {
      "name": "1 year deadline",
      "action": {
        "type": "Delete"
      },
      "condition": {
        "olderThan": "365d"
      }
    },
    {
      "name": "keep 5 latests",
      "action": {
        "type": "Keep"
      },
      "mostRecentVersions": {
        "keepCount": 5
      }
    }
  ]
' >scripts/artifacts-repository-policy.json
gcloud artifacts repositories set-cleanup-policies $1 \
  --policy=scripts/artifacts-repository-policy.json \
  --location=$REGION \
  --project=$PROJECT_ID \
  --quiet >/dev/null 2>&1
rm scripts/artifacts-repository-policy.json

# Checks if a Google Cloud Build repository exists and creates it if it doesn't.
if ! gcloud builds repositories describe $1 --connection=ai4screen --region=$REGION --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "Creating build repository [$1]..."
  gcloud builds repositories create $1 \
    --connection=ai4screen \
    --region=$REGION \
    --remote-uri=https://github.com/Ad4screen/$1.git \
    --project=$PROJECT_ID
else
  echo "Build repository [$1] already exists."
fi

# Checks if a Google Cloud Build trigger exists and creates it if it doesn't.
if ! gcloud builds triggers describe $1 --region=$REGION --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "Creating trigger [$1]..."
  gcloud builds triggers create github \
    --description="Trigger for $1" \
    --name="$1" \
    --region=$REGION \
    --service-account="projects/$PROJECT_ID/serviceAccounts/cloudbuild@$PROJECT_ID.iam.gserviceaccount.com" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --repository="projects/$PROJECT_ID/locations/$REGION/connections/ai4screen/repositories/$1/" \
    --project=$PROJECT_ID
else
  echo "Trigger [$1] already exists."
fi

SERVICE_ACCOUNT_EMAIL=$1@$PROJECT_ID.iam.gserviceaccount.com

# Checks if a Google Cloud IAM service account exists and creates it if it doesn't.
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "Creating service account [$1]..."
  gcloud iam service-accounts create $1 \
    --display-name="$1 Service Account" \
    --project=$PROJECT_ID
else
  echo "Service account [$1] already exists."
fi

# Removes all roles from the service account
ROLES=$(gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL" \
  --format="value(bindings.role)" \
  --project=$PROJECT_ID)
for ROLE in $ROLES; do
  echo "Removing role $ROLE from $SERVICE_ACCOUNT_EMAIL"
  gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --condition=None \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$ROLE" \
    --project=$PROJECT_ID >/dev/null
done

# Checks if a Google Cloud IAM role exists and creates it if it doesn't.
ROLE_ID=$(echo $1 | tr '-' '_')
if ! gcloud iam roles describe $ROLE_ID --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "Creating IAM role [$ROLE_ID]..."
  gcloud iam roles create $ROLE_ID \
    --project=$PROJECT_ID \
    --title="$1 Role"
else
  echo "IAM role [$ROLE_ID] already exists."
fi

# Updates the role with the required permissions
PERMISSIONS=()
PERMISSIONS=$(
  IFS=,
  echo "${PERMISSIONS[*]}"
)

echo "Updating role $ROLE_ID with new permissions"
gcloud iam roles update $ROLE_ID \
  --permissions="$PERMISSIONS" \
  --project=$PROJECT_ID \
  --quiet >/dev/null

ROLES=(
  "roles/datastore.user"
  "roles/logging.logWriter"
  "roles/secretmanager.secretAccessor"
  "roles/iam.serviceAccountTokenCreator"
  "roles/storage.objectCreator"
  "roles/storage.objectViewer"
  "roles/aiplatform.user"
  "projects/$PROJECT_ID/roles/$ROLE_ID"
)

# Assigns the roles to the service account
for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$ROLE" \
    --condition=None \
    --project=$PROJECT_ID >/dev/null
done
