locals {
  resource_labels = {
    deployed_by = "cloudbuild"
    repo        = "img-studio"
    terraform   = "true"
  }

  app_name           = var.app_name
  app_container      = var.app_container_name
}

variable "project_id" {
  description = "GCP Project ID"
  default     = null
}


variable "region" {
  type        = string
  description = "GCP region"
  default     = "us-central1"
}

variable "app_name" {
  description = "Img Studio Application Name"
  default     = "imgstudio"
}

variable "app_container_name" {
  type        = string
  description = "Img Studio Container Full Name"
  default = "imgstudio"
}

variable "app_tag" {
  description = "Img Studio container tag"
  default     = "latest"
}

variable "domain_name" {
  description = "DNS Domain Name. Leave it empty if you do not wish to configure a custom DNS name"
  default     = ""
}

variable "iap_allowed_members" {
  type      = list(string)
}