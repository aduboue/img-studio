# Default GCS Bucket to store generated files
resource "google_storage_bucket" "output_bucket" {
 name          = "${var.project_id}-imgstudio-output"
 project       = var.project_id
 location      = var.region
 uniform_bucket_level_access = true
 force_destroy = true
}

# Default GCS Bucket for team to share images
resource "google_storage_bucket" "team_bucket" {
 name          = "${var.project_id}-imgstudio-library"
 project       = var.project_id
 location      = var.region
 uniform_bucket_level_access = true
 force_destroy = true
}

# Default GCS Bucket to store JSON configuration files
resource "google_storage_bucket" "config_bucket" {
 name          = "${var.project_id}-imgstudio-export-config"
 project       = var.project_id
 location      = var.region
 uniform_bucket_level_access = true
 force_destroy = true
}

## -------------------------------------------

# Upload Default JSON configuration files to Cloud
resource "google_storage_bucket_object" "uploaded_config" {
  name   = "export-fields-options.json"
  bucket = google_storage_bucket.config_bucket.name
  source = "../config/export-fields-options.json"
  content_type = "application/json"
}
