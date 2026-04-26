terraform {
  required_version = ">= 1.6.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
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
  description = "Deprecated alias for preview_project_name."
  default     = null
  nullable    = true
}

variable "production_project_name" {
  type        = string
  description = "Name of the hosted production project."
}

variable "preview_project_name" {
  type        = string
  description = "Name of the hosted shared preview project."
  default     = null
  nullable    = true
}

variable "database_password" {
  type        = string
  description = "Deprecated alias for preview_database_password."
  default     = null
  nullable    = true
  sensitive   = true
}

variable "production_database_password" {
  type        = string
  description = "Password for the hosted production Postgres database."
  sensitive   = true
}

variable "preview_database_password" {
  type        = string
  description = "Password for the hosted preview Postgres database."
  default     = null
  nullable    = true
  sensitive   = true
}

variable "region" {
  type        = string
  description = "Supabase region code."
  default     = "ap-northeast-1"
}

variable "site_url" {
  type        = string
  description = "Deprecated alias for preview_site_url."
  default     = "http://localhost:3000"

  validation {
    condition     = can(regex("^https?://", var.site_url))
    error_message = "site_url must start with http:// or https://."
  }
}

variable "production_site_url" {
  type        = string
  description = "Fallback base URL for hosted production auth redirects."

  validation {
    condition     = can(regex("^https?://", var.production_site_url))
    error_message = "production_site_url must start with http:// or https://."
  }
}

variable "preview_site_url" {
  type        = string
  description = "Fallback base URL for hosted preview auth redirects."
  default     = null
  nullable    = true

  validation {
    condition     = var.preview_site_url == null || can(regex("^https?://", var.preview_site_url))
    error_message = "preview_site_url must start with http:// or https://."
  }
}

variable "additional_redirect_urls" {
  type        = list(string)
  description = "Deprecated alias for preview_additional_redirect_urls."
  default = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]

  validation {
    condition = alltrue([
      for url in var.additional_redirect_urls : can(regex("^https?://", url))
    ])
    error_message = "additional_redirect_urls entries must start with http:// or https://."
  }
}

variable "production_additional_redirect_urls" {
  type        = list(string)
  description = "Allowed additional auth redirect URLs for the production project."

  validation {
    condition = alltrue([
      for url in var.production_additional_redirect_urls : can(regex("^https?://", url))
    ])
    error_message = "production_additional_redirect_urls entries must start with http:// or https://."
  }
}

variable "preview_additional_redirect_urls" {
  type        = list(string)
  description = "Allowed additional auth redirect URLs for the preview project."
  default     = null
  nullable    = true

  validation {
    condition = var.preview_additional_redirect_urls == null || alltrue([
      for url in var.preview_additional_redirect_urls : can(regex("^https?://", url))
    ])
    error_message = "preview_additional_redirect_urls entries must start with http:// or https://."
  }
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

locals {
  common_auth_settings = {
    disable_signup                                    = var.disable_signup
    external_email_enabled                            = var.external_email_enabled
    jwt_exp                                           = var.jwt_expiry
    password_min_length                               = var.password_min_length
    mailer_autoconfirm                                = var.mailer_autoconfirm
    mailer_secure_email_change_enabled                = var.mailer_secure_email_change_enabled
    security_update_password_require_reauthentication = var.security_update_password_require_reauthentication
    smtp_max_frequency                                = var.smtp_max_frequency
  }

  resolved_preview_project_name = coalesce(var.preview_project_name, var.project_name)
  resolved_preview_site_url     = coalesce(var.preview_site_url, var.site_url)
  resolved_preview_redirect_urls = coalesce(
    var.preview_additional_redirect_urls,
    var.additional_redirect_urls,
  )
}

check "preview_project_name_configured" {
  assert {
    condition     = local.resolved_preview_project_name != null
    error_message = "Set preview_project_name or deprecated project_name for the preview Supabase project."
  }
}

check "preview_database_password_configured" {
  assert {
    condition     = coalesce(var.preview_database_password, var.database_password) != null
    error_message = "Set preview_database_password or deprecated database_password for the preview Supabase project."
  }
}

moved {
  from = supabase_project.development
  to   = supabase_project.preview
}

moved {
  from = supabase_settings.development
  to   = supabase_settings.preview
}

resource "supabase_project" "production" {
  organization_id   = var.organization_id
  name              = var.production_project_name
  database_password = var.production_database_password
  region            = var.region
}

resource "supabase_project" "preview" {
  organization_id   = var.organization_id
  name              = local.resolved_preview_project_name
  database_password = coalesce(var.preview_database_password, var.database_password)
  region            = var.region
}

resource "supabase_settings" "production" {
  project_ref = supabase_project.production.id

  api = jsonencode({
    db_schema            = "public,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })

  auth = jsonencode(merge(
    local.common_auth_settings,
    {
      site_url       = var.production_site_url
      uri_allow_list = join(",", var.production_additional_redirect_urls)
    }
  ))
}

resource "supabase_settings" "preview" {
  project_ref = supabase_project.preview.id

  api = jsonencode({
    db_schema            = "public,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })

  auth = jsonencode(merge(
    local.common_auth_settings,
    {
      site_url       = local.resolved_preview_site_url
      uri_allow_list = join(",", local.resolved_preview_redirect_urls)
    }
  ))
}
