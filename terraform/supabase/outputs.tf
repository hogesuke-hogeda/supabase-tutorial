output "project_ref" {
  description = "Supabase project reference ID."
  value       = supabase_project.development.id
}

output "project_url" {
  description = "Hosted Supabase project URL."
  value       = "https://${supabase_project.development.id}.supabase.co"
}
