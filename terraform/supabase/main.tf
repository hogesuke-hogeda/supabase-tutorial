terraform {
  required_version = ">= 1.6.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
  }
}

provider "supabase" {}

variable "organization_id" {
  type        = string
  description = "Supabase organization slug from Organization Settings."
}

variable "project_name" {
  type        = string
  description = "Name of the hosted development project."
}

variable "database_password" {
  type        = string
  description = "Password for the hosted Postgres database."
  sensitive   = true
}

variable "region" {
  type        = string
  description = "Supabase region code."
  default     = "ap-northeast-1"
}

variable "site_url" {
  type        = string
  description = "Base URL for hosted auth redirects."
  default     = "http://localhost:3000"
}

variable "additional_redirect_urls" {
  type        = list(string)
  description = "Allowed additional auth redirect URLs."
  default = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]
}

variable "jwt_expiry" {
  type        = number
  description = "JWT expiry in seconds."
  default     = 3600
}

variable "disable_signup" {
  type        = bool
  description = "Disable new user signup when true."
  default     = false
}

variable "external_email_enabled" {
  type        = bool
  description = "Allow email/password signups."
  default     = true
}

variable "password_min_length" {
  type        = number
  description = "Minimum password length."
  default     = 6
}

variable "mailer_autoconfirm" {
  type        = bool
  description = "Skip email confirmation when true."
  default     = false
}

variable "mailer_secure_email_change_enabled" {
  type        = bool
  description = "Require confirmation on both old and new email addresses."
  default     = true
}

variable "security_update_password_require_reauthentication" {
  type        = bool
  description = "Require recent reauthentication before password change."
  default     = false
}

variable "smtp_max_frequency" {
  type        = number
  description = "Minimum seconds between auth emails."
  default     = 1
}

resource "supabase_project" "development" {
  organization_id   = var.organization_id
  name              = var.project_name
  database_password = var.database_password
  region            = var.region
}

resource "time_sleep" "wait_for_project_services" {
  depends_on = [supabase_project.development]

  create_duration = "180s"
}

resource "supabase_settings" "development" {
  depends_on = [time_sleep.wait_for_project_services]

  project_ref = supabase_project.development.id

  api = jsonencode({
    db_schema            = "public,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })

  auth = jsonencode({
    site_url                                          = var.site_url
    uri_allow_list                                    = join(",", var.additional_redirect_urls)
    disable_signup                                    = var.disable_signup
    external_email_enabled                            = var.external_email_enabled
    jwt_exp                                           = var.jwt_expiry
    password_min_length                               = var.password_min_length
    mailer_autoconfirm                                = var.mailer_autoconfirm
    mailer_secure_email_change_enabled                = var.mailer_secure_email_change_enabled
    security_update_password_require_reauthentication = var.security_update_password_require_reauthentication
    smtp_max_frequency                                = var.smtp_max_frequency
  })
}
