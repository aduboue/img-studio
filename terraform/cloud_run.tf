# Img Studio Cloud Run service
resource "google_cloud_run_v2_service" "img_studio_service" {
  name     = local.app_name
  project  = var.project_id
  location = var.region
  

  template {
    service_account = google_service_account.app_sa.email
    containers {
      image = local.app_container
    }
    annotations = {
      "autoscaling.knative.dev/minScale" = "1"
      "autoscaling.knative.dev/maxScale" = "2"
    }
    labels = local.resource_labels
  }

  traffic {
    percent         = 100
    type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_iam_member.app_sa_roles
  ]
}