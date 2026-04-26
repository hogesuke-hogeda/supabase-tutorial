output "project_id" {
  description = "Vercel project ID."
  value       = vercel_project.nextjs.id
}

output "project_name" {
  description = "Vercel project name."
  value       = vercel_project.nextjs.name
}

output "production_branch" {
  description = "Git branch deployed to Vercel Production."
  value       = var.production_branch
}

output "root_directory" {
  description = "Repository subdirectory deployed to Vercel."
  value       = var.root_directory
}
