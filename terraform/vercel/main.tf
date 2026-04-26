terraform {
  required_version = ">= 1.6.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 4.7"
    }
  }
}

provider "vercel" {
  team = var.team_id
}

variable "team_id" {
  type        = string
  description = "Vercel team slug or ID."
}

variable "project_name" {
  type        = string
  description = "Name of the Vercel project."
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in owner/name form."
}

variable "production_branch" {
  type        = string
  description = "Git branch deployed to Vercel Production."
  default     = "main"
}

variable "root_directory" {
  type        = string
  description = "Repository subdirectory containing the Next.js app."
  default     = "supabase-nextjs"
}

variable "node_version" {
  type        = string
  description = "Node.js version used for Vercel builds and functions."
  default     = "22.x"
}

variable "production_supabase_url" {
  type        = string
  description = "Production Supabase project URL."

  validation {
    condition     = can(regex("^https://", var.production_supabase_url))
    error_message = "production_supabase_url must start with https://."
  }
}

variable "production_supabase_publishable_key" {
  type        = string
  description = "Production Supabase publishable key."
  sensitive   = true
}

variable "preview_supabase_url" {
  type        = string
  description = "Preview Supabase project URL."

  validation {
    condition     = can(regex("^https://", var.preview_supabase_url))
    error_message = "preview_supabase_url must start with https://."
  }
}

variable "preview_supabase_publishable_key" {
  type        = string
  description = "Preview Supabase publishable key."
  sensitive   = true
}

locals {
  environment_variables = {
    production_server_url = {
      key    = "SUPABASE_SERVER_URL"
      value  = var.production_supabase_url
      target = ["production"]
    }
    production_public_url = {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.production_supabase_url
      target = ["production"]
    }
    production_public_key = {
      key    = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      value  = var.production_supabase_publishable_key
      target = ["production"]
    }
    preview_server_url = {
      key    = "SUPABASE_SERVER_URL"
      value  = var.preview_supabase_url
      target = ["preview"]
    }
    preview_public_url = {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.preview_supabase_url
      target = ["preview"]
    }
    preview_public_key = {
      key    = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      value  = var.preview_supabase_publishable_key
      target = ["preview"]
    }
  }
}

resource "vercel_project" "nextjs" {
  name      = var.project_name
  framework = "nextjs"

  root_directory = var.root_directory
  node_version   = var.node_version

  automatically_expose_system_environment_variables = true

  git_repository = {
    type              = "github"
    repo              = var.github_repository
    production_branch = var.production_branch
  }
}

resource "vercel_project_environment_variable" "managed" {
  for_each = local.environment_variables

  project_id = vercel_project.nextjs.id
  key        = each.value.key
  value      = each.value.value
  target     = each.value.target
  sensitive  = true
}
