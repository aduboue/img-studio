#!/usr/bin/env bash
#===============================================================================
# Script: bootstrap.sh
# Description: Sets up resources in Google Cloud for IMG Studio application
# Date: March 21, 2025
# Usage: ./bootstrap.sh
#===============================================================================

# Exit on any command error
set -e

#-------------------------------------------------------------------------------
# Color definitions
#-------------------------------------------------------------------------------
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

#-------------------------------------------------------------------------------
# Global variables
#-------------------------------------------------------------------------------
DEBUG=false
SERVICES=(
  "secretmanager.googleapis.com"
  "cloudbuild.googleapis.com"
  "iap.googleapis.com"
  "artifactregistry.googleapis.com"
  "aiplatform.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "firestore.googleapis.com"
  "compute.googleapis.com"
  "iam.googleapis.com"
  "cloudidentity.googleapis.com"
  "run.googleapis.com"
  "serviceusage.googleapis.com"
  "storage-api.googleapis.com"
  "storage.googleapis.com"
)

#-------------------------------------------------------------------------------
# Utility functions
#-------------------------------------------------------------------------------
log_info() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${BLUE}INFO${NC}: $1"
}

log_success() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}SUCCESS${NC}: $1"
}

log_warning() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}WARNING${NC}: $1"
}

log_error() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}ERROR${NC}: $1" >&2
}

log_debug() {
  if [[ "$DEBUG" == true ]]; then
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] DEBUG: $1"
  fi
}

die() {
  log_error "$1"
  exit 1
}

# Function to handle cleanup on script exit
cleanup() {
  log_debug "Performing cleanup..."
  # Add any cleanup tasks here if needed
}

# Set trap for cleanup on script exit
trap cleanup EXIT

#-------------------------------------------------------------------------------
# Core functions
#-------------------------------------------------------------------------------

# Function to check if required tools are installed
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check if gcloud is installed
  if ! command -v gcloud &> /dev/null; then
    die "gcloud is not installed. Please install the Google Cloud SDK first."
  fi
  
  # Check if user is authenticated with gcloud
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    die "Not authenticated with gcloud. Please run 'gcloud auth login' first."
  fi

  log_success "All prerequisites are satisfied"
}

# Function to get default project ID
get_default_project() {
  gcloud config get project 2>/dev/null || echo ""
}

# Function to add IAM policy binding with better error handling
add_iam_member() {
  local member=$1
  local role=$2
  
  log_debug "Adding IAM binding: $member -> $role"
  
  if ! gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$member" --role="$role" &> /dev/null; then
    log_warning "Failed to add IAM binding for $member with role $role"
    return 1
  fi
  
  return 0
}

# Function to enable required GCP services
enable_services() {
  log_info "Enabling required APIs... (this will take a few minutes)"
  
  for service in "${SERVICES[@]}"; do
    log_debug "Enabling $service"
    if ! gcloud services enable "$service" &> /dev/null; then
      log_warning "Failed to enable $service, continuing anyway"
    fi
  done
  
  log_success "Required APIs have been enabled"
}

# Function to create Artifact Registry repository
create_artifact_registry() {
  log_info "Creating Artifact Registry repository"
  
  if gcloud artifacts repositories describe docker-repo --location="$REGION" &> /dev/null; then
    log_info "Artifact Registry repository already exists"
  else
    gcloud artifacts repositories create docker-repo \
      --repository-format=docker \
      --location="$REGION" \
      --description="Private docker images" \
      --project "$PROJECT_ID"
    
    log_success "Created Artifact Registry repository"
  fi
}

# Function to create Terraform state bucket
create_tf_state_bucket() {
  local bucket_name="gs://$PROJECT_ID-tf-state"
  
  if gsutil ls "$bucket_name" &> /dev/null; then
    log_info "Terraform bucket already exists"
  else
    log_info "Creating Terraform state bucket..."
    gsutil mb "$bucket_name"
    log_success "Created Terraform state bucket: $bucket_name"
  fi
}

# Function to set up build service account
setup_build_service_account() {
  log_info "Setting up Cloud Build Service Account with required permissions"
  
  # Check if service account already exists
  if gcloud iam service-accounts describe "build-sa@$PROJECT_ID.iam.gserviceaccount.com" &> /dev/null; then
    log_info "Build service account already exists"
  else
    gcloud iam service-accounts create build-sa \
      --display-name="Cloud Build worker SA" \
      --description="Cloud Build worker SA"
  fi
  
  local member="serviceAccount:build-sa@$PROJECT_ID.iam.gserviceaccount.com"
  
  local roles=(
    "roles/datastore.user"
    "roles/logging.logWriter"
    "roles/secretmanager.secretAccessor"
    "roles/secretmanager.viewer"
    "roles/iam.securityAdmin"
    "roles/storage.admin"
    "roles/artifactregistry.writer"
    "roles/aiplatform.user"
    "roles/run.builder"
    "roles/run.developer"
    "roles/compute.admin"
    "roles/datastore.owner"
    "roles/iam.serviceAccountTokenCreator"
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountCreator"
    "roles/iap.settingsAdmin"
    "roles/firebase.developAdmin"
  )
  
  log_info "Granting IAM roles to build service account..."
  
  for role in "${roles[@]}"; do
    log_debug "Adding role: $role"
    add_iam_member "$member" "$role"
  done
  
  log_success "Service account permissions configured"
}

# Function to configure IAP OAuth
configure_iap_oauth() {
  log_info "Configuring IAP OAuth..."
  
  # Create brand if not exists
  local brand_exists
  brand_exists=$(gcloud alpha iap oauth-brands list --format="value(name)" 2>/dev/null | grep -c "$PROJECT_NUMBER" || true)
  
  if [[ "$brand_exists" -eq 0 ]]; then
    gcloud alpha iap oauth-brands create \
      --application_title="$APP_TITLE" \
      --support_email="$USER_EMAIL"
    
    # Give time for the brand to propagate
    log_info "Waiting for OAuth brand to propagate..."
    sleep 30
  else
    log_info "OAuth brand already exists"
  fi
  
  # Create OAuth client if not exists
  local client_exists
  client_exists=$(gcloud alpha iap oauth-clients list "projects/$PROJECT_NUMBER/brands/$PROJECT_NUMBER" --format="value(displayName)" 2>/dev/null | grep -c "$SERVICE_NAME" || true)
  
  if [[ "$client_exists" -eq 0 ]]; then
    gcloud alpha iap oauth-clients create \
      "projects/$PROJECT_ID/brands/$PROJECT_NUMBER" \
      --display_name="$SERVICE_NAME"
    
    log_success "Created OAuth client"
  else
    log_info "OAuth client already exists"
  fi
  
  # Store the client name, ID, and secret
  export CLIENT_NAME=$(gcloud alpha iap oauth-clients list \
    "projects/$PROJECT_NUMBER/brands/$PROJECT_NUMBER" --format='value(name)' \
    --filter="displayName:$SERVICE_NAME")
  
  export CLIENT_ID=${CLIENT_NAME##*/}
  
  export CLIENT_SECRET=$(gcloud alpha iap oauth-clients describe "$CLIENT_NAME" --format='value(secret)')
  
  log_info "Creating IAP service account..."
  # Create IAP Service Account
  gcloud beta services identity create \
    --service=iap.googleapis.com \
    --project="$PROJECT_ID"
  
  # Store secret in Secret Manager
  if gcloud secrets describe iap_client_secret &> /dev/null; then
    log_info "IAP client secret already exists in Secret Manager"
  else
    log_info "Storing OAuth client secret in Secrets Manager..."
    echo "$CLIENT_SECRET" | gcloud secrets create iap_client_secret \
      --data-file=- \
      --replication-policy=user-managed \
      --locations="$REGION"
    
    log_success "Stored client secret in Secret Manager"
  fi

  # Store client ID in Secret Manager (not really a secret, but convenient to store it together with client secret)
  if gcloud secrets describe iap_client_id &> /dev/null; then
    log_info "IAP client ID already exists in Secret Manager"
  else
    log_info "Storing OAuth client secret in Secrets Manager..."
    echo "$CLIENT_ID" | gcloud secrets create iap_client_id \
      --data-file=- \
      --replication-policy=user-managed \
      --locations="$REGION"
    
    log_success "Stored client ID in Secret Manager"
  fi
  
  log_success "IAP OAuth configuration complete"
}

# Function to update cloudbuild template
update_cloudbuild_template() {
  log_info "Updating cloudbuild.yaml from template..."
  
  if [[ ! -f "cloudbuild.yaml.template" ]]; then
    log_error "Template file cloudbuild.yaml.template not found"
    return 1
  fi
  
  # Check if cloudbuild.yaml already exists
  if [[ -f "cloudbuild.yaml" ]]; then
    log_warning "A cloudbuild.yaml file already exists"
    read -rp "Do you want to overwrite it? [y/N]: " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[yY]$ ]]; then
      log_warning "Skipping cloudbuild.yaml update at user request. Please ensure the variable substitutions in cloudbuild.yaml are correct."
      return 0
    fi
  fi
  
  cp cloudbuild.yaml.template cloudbuild.yaml
  
  # Replace placeholders in the template
  local domain_value="${DOMAIN_NAME:-}"
  
  # Extract company domain from IAP_USER_GROUP
  local company_domain=""
  if [[ "$IAP_USER_GROUP" =~ @([^@]+)$ ]]; then
    company_domain="${BASH_REMATCH[1]}"
    log_debug "Extracted company domain: $company_domain"
  else
    log_warning "Could not extract company domain from $IAP_USER_GROUP"
    # Default to empty string if extraction fails
    company_domain=""
  fi
  
  log_debug "Replacing <DOMAIN_NAME_PLACEHOLDER> with '$domain_value'"
  log_debug "Replacing <IAM_GROUP_PLACEHOLDER> with '$IAP_USER_GROUP'"
  log_debug "Replacing <COMPANY_DOMAIN_PLACEHOLDER> with '$company_domain'"
  
  sed -i "s|<DOMAIN_NAME_PLACEHOLDER>|${domain_value}|g" cloudbuild.yaml
  sed -i "s|<IAM_GROUP_PLACEHOLDER>|${IAP_USER_GROUP}|g" cloudbuild.yaml
  sed -i "s|<COMPANY_DOMAIN_PLACEHOLDER>|${company_domain}|g" cloudbuild.yaml
  
  log_success "Updated cloudbuild.yaml with your configuration"
}

# Function to collect user inputs with validation
collect_inputs() {
  # Service name
  read -rp "Enter service name [imgstudio]: " SERVICE_NAME
  export SERVICE_NAME=${SERVICE_NAME:-"imgstudio"}
  
  # Project ID
  DEFAULT_PROJECT=$(get_default_project)
  if [[ -n "$DEFAULT_PROJECT" ]]; then
    read -rp "Enter project ID [$DEFAULT_PROJECT]: " PROJECT_ID
    export PROJECT_ID=${PROJECT_ID:-"$DEFAULT_PROJECT"}
  else
    while [[ -z "$PROJECT_ID" ]]; do
      read -rp "Enter project ID: " PROJECT_ID
      if [[ -z "$PROJECT_ID" ]]; then
        log_warning "Project ID cannot be empty"
      fi
    done
    export PROJECT_ID="$PROJECT_ID"
  fi
  
  # Region
  read -rp "Enter region [us-central1]: " REGION
  export REGION=${REGION:-"us-central1"}
  
  # App title
  read -rp "Enter app title [IMG Studio]: " APP_TITLE
  export APP_TITLE=${APP_TITLE:-"IMG Studio"}
  
  
  # IAP user group (required)
  while [[ -z "$IAP_USER_GROUP" ]]; do
    read -rp "Enter Google Identity group for IAP access (e.g. imgstudio-users@example.com): " IAP_USER_GROUP
    if [[ -z "$IAP_USER_GROUP" ]]; then
      log_warning "IAP user group cannot be empty"
    fi
  done
  export IAP_USER_GROUP="$IAP_USER_GROUP"

   # Domain name (optional)
  read -rp "(OPTIONAL) Enter domain name [''] (e.g. imgstudio.example.com): " DOMAIN_NAME
  export DOMAIN_NAME="$DOMAIN_NAME"
  
  export USER_EMAIL=$(gcloud config list account --format "value(core.account)")
  
  # Set project in gcloud config
  log_debug "Setting gcloud project to $PROJECT_ID"
  gcloud config set project "$PROJECT_ID"
  
  # Get project number
  export PROJECT_NUMBER=$(gcloud projects list --filter="$PROJECT_ID" --format='value(PROJECT_NUMBER)')
  
  # Validate we got a project number
  if [[ -z "$PROJECT_NUMBER" ]]; then
    die "Failed to retrieve project number for project ID: $PROJECT_ID"
  fi
  
  # Echo the configured values
  echo -e "\nConfiguration:"
  echo "USER_EMAIL: $USER_EMAIL (obtained from gcloud)"
  echo "SERVICE_NAME: $SERVICE_NAME"
  echo "PROJECT_ID: $PROJECT_ID"
  echo "PROJECT_NUMBER: $PROJECT_NUMBER (obtained from gcloud)"
  echo "REGION: $REGION"
  echo "APP_TITLE: $APP_TITLE"
  echo "DOMAIN_NAME: ${DOMAIN_NAME:-"<none>"}"
  echo "IAP_USER_GROUP: $IAP_USER_GROUP"
  
  read -rp "Proceed? [Y/n]: " PROCEED
  if [[ "$PROCEED" =~ ^[nN]$ ]]; then
    log_info "Exiting at user request"
    exit 0
  fi
}

# Main function to orchestrate the script execution
main() {
  log_info "Starting GCP IMG Studio setup"
  
  check_prerequisites
  collect_inputs
  enable_services
  create_artifact_registry
  create_tf_state_bucket
  setup_build_service_account
  configure_iap_oauth
  update_cloudbuild_template
  
  log_success "Setup completed successfully"
  
}

# Execute main function
main "$@"