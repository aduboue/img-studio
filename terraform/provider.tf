terraform {
  backend "gcs" {
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.50.0, < 6.0.0"  
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 4.50.0, < 6.0.0"  
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  provider_meta "google" {
    module_name = "img-studio-v1.0"
  }
}
