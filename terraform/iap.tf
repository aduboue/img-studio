/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  provider              = google
  name                  = "serverless-neg"
  network_endpoint_type = "SERVERLESS"
  project               = var.project_id
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.img_studio_service.name
  }
}

module "lb-http" {
  source  = "terraform-google-modules/lb-http/google//modules/serverless_negs"
  version = "~> 9.0"

  project = var.project_id
  name    = "iap-lb"


  # The following doesnt seem to work
  #address = google_compute_address.static_ip.address
  

  ssl                             = true
  managed_ssl_certificate_domains = var.domain_name == "" ? ["${module.lb-http.external_ip}.nip.io"] : [var.domain_name]
  https_redirect                  = true

  backends = {
    default = {
      description = null
      groups = [
        {
          group = google_compute_region_network_endpoint_group.serverless_neg.id
        }
      ]
      enable_cdn             = false
      security_policy        = null
      custom_request_headers = null

      iap_config = {
        enable               = true
        oauth2_client_id     = data.google_secret_manager_secret_version.iap_client_id.secret_data
        oauth2_client_secret = data.google_secret_manager_secret_version.iap_client_secret.secret_data
      }
      log_config = {
        enable      = false
        sample_rate = null
      }
    }
  }
}

data "google_iam_policy" "iap" {
  binding {
    role = "roles/iap.httpsResourceAccessor"
    members = var.iap_allowed_members
  }
}

resource "google_iap_web_backend_service_iam_policy" "policy" {
  project             = var.project_id
  web_backend_service = "iap-lb-backend-default"
  policy_data         = data.google_iam_policy.iap.policy_data
  depends_on = [
    module.lb-http
  ]
}

resource "google_iap_web_iam_binding" "binding" {
  project = var.project_id
  role = "roles/iap.httpsResourceAccessor"
  members = var.iap_allowed_members
  depends_on = [
    module.lb-http
  ]
}

resource "google_project_service_identity" "iap_sa" {
  provider = google-beta

  project = var.project_id
  service = "iap.googleapis.com"
}

resource "google_project_iam_member" "iap_sa_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = google_project_service_identity.iap_sa.member
}

# Reserve a static external IP address
#resource "google_compute_address" "static_ip" {
#  name         = "lb-static-ip"
#  description  = "Static external IP address"
#  region       = var.region  
#  project      = var.project_id
#  
#  address_type = "EXTERNAL"
#  
#  network_tier = "PREMIUM"
#}

data "google_secret_manager_secret_version" "iap_client_secret" {
  provider = google
  project  = var.project_id
  secret   = "iap_client_secret"  
  version  = "latest"           
}

data "google_secret_manager_secret_version" "iap_client_id" {
  provider = google
  project  = var.project_id
  secret   = "iap_client_id"  
  version  = "latest"           
}

output "load-balancer-ip" {
  value = module.lb-http.external_ip
}

output "oauth2-redirect-uri" {
  value = "https://iap.googleapis.com/v1/oauth/clientIds/${data.google_secret_manager_secret_version.iap_client_id.secret_data}:handleRedirect"
  sensitive = true
}