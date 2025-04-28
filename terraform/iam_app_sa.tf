resource "google_service_account" "app_sa" {
  account_id   = "${local.app_name}-app-sa"
  project = var.project_id
  display_name = "Img Studio Application Service Account"
  create_ignore_already_exists = true
}

resource "google_project_iam_member" "app_sa_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/logging.logWriter",
    "roles/secretmanager.secretAccessor",
    "roles/iam.serviceAccountTokenCreator",
    "roles/iam.serviceAccountAdmin",
    "roles/storage.objectAdmin",
    "roles/aiplatform.user",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

