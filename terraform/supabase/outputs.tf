output "production_project_ref" {
  description = "Production Supabase project reference ID."
  value       = supabase_project.production.id
}

output "production_project_url" {
  description = "Hosted production Supabase project URL."
  value       = "https://${supabase_project.production.id}.supabase.co"
}

output "production_site_url" {
  description = "Fallback site URL configured for hosted production auth redirects."
  value       = var.production_site_url
}

output "production_additional_redirect_urls" {
  description = "Additional redirect URLs configured for the hosted production project."
  value       = var.production_additional_redirect_urls
}

output "preview_project_ref" {
  description = "Preview Supabase project reference ID."
  value       = supabase_project.preview.id
}

output "preview_project_url" {
  description = "Hosted preview Supabase project URL."
  value       = "https://${supabase_project.preview.id}.supabase.co"
}

output "preview_site_url" {
  description = "Fallback site URL configured for hosted preview auth redirects."
  value       = var.preview_site_url
}

output "preview_additional_redirect_urls" {
  description = "Additional redirect URLs configured for the hosted preview project."
  value       = local.resolved_preview_redirect_urls
}
