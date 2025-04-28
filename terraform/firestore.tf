resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region # Tokyo is single region DB
  type        = "FIRESTORE_NATIVE"

  delete_protection_state = "DELETE_PROTECTION_DISABLED"
  deletion_policy         = "DELETE"
}

resource "google_firestore_index" "db-index" {
  project     = var.project_id
  database   = google_firestore_database.database.name
  collection = "metadata"
  query_scope = "COLLECTION"

  fields {
    field_path = "combinedFilters"
    array_config = "CONTAINS"
  }

  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "DESCENDING"
  }
}

resource "google_firebaserules_ruleset" "security_rules" {
  project = var.project_id

  source {
    files {
      name = "firestore.rules"
      content = <<EOT
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents { 
		match /{document=**} { 
			allow read, write: if get(/databases/$(database)/documents/request.auth.uid).data.serviceAccount == "${google_service_account.app_sa.email}" ;
			allow delete: if false; 
		} 
	} 
}

EOT
    }
  }
  depends_on = [
    google_firestore_database.database
  ]
}