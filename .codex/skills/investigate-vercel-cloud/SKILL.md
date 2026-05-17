---
name: investigate-vercel-cloud
description: Use when inspecting Vercel Cloud projects, deployments, build logs, runtime logs, environment variables, Git integration, project settings, or drift between Terraform and live Vercel state.
---

# Investigate Vercel Cloud

## Purpose

Use this skill to gather live Vercel Cloud state with the Vercel CLI and compare it to repository intent. Treat environment variable values and deployment secrets as sensitive.

## Authentication Gate

1. Check CLI availability: `vercel --version`.
2. Check authentication: `vercel whoami --format=json`.
3. If authentication fails, stop and ask the user to run `vercel login` or provide the required authenticated environment. Do not invent cloud state.

In restricted environments, Vercel CLI may fail while creating cache directories under the home directory. Use temporary XDG directories for read-only investigation commands when needed:

```bash
env XDG_DATA_HOME=/tmp/vercel-data XDG_CACHE_HOME=/tmp/vercel-cache vercel whoami --format=json
```

## Investigation Workflow

1. Read repository intent first:
   - `README.md`
   - `supabase-nextjs/README.md`
   - `terraform/vercel/*.tf`
   - `terraform/supabase/outputs.tf` when Vercel env vars depend on Supabase outputs
2. Determine scope and project:
   - `vercel whoami --format=json`
   - `vercel project list`
   - `vercel project inspect <project-name>`
3. Inspect deployment and environment state as needed:
   - `vercel env list production`
   - `vercel env list preview`
   - `vercel inspect <deployment-url-or-id> --format=json`
4. Inspect logs when diagnostics require them:
   - Build logs: `vercel inspect <deployment-url-or-id> --logs`
   - Recent runtime/request logs: `vercel logs --project <project-name> --environment production --since 1h --no-follow`
   - Preview runtime logs: `vercel logs --project <project-name> --environment preview --since 1h --no-follow`
   - Deployment-specific logs: `vercel logs <deployment-url-or-id> --no-follow`
   - Error-focused logs: `vercel logs --project <project-name> --level error --since 1h --json`
   - Request-specific logs: `vercel logs --request-id <request-id> --json`
5. Compare live state against Terraform and README expectations, especially root directory, Git repository, production branch, system environment variables, and Supabase-related env names.

## Safety Rules

- Never run deployment, promote, rollback, remove, env add/update/remove, or project mutation commands unless the user explicitly asked for a change.
- Never print private environment variable values. Summarize names, environments, and whether values appear present.
- Prefer JSON output when available; redact sensitive fields before reporting. Logs can contain secrets, cookies, auth headers, tokens, and PII.
- Avoid long-running streams by default. Use `--no-follow`, `--since`, `--until`, `--limit`, `--level`, `--status-code`, or `--request-id` to bound log collection unless the user explicitly asks for live streaming.
- Do not treat dashboard-only observations as primary evidence when the CLI can report the state.

## Reporting

Report:

- CLI authentication status and active scope
- Vercel project and deployments inspected
- log windows, filters, and deployment IDs inspected when logs were checked
- repository source files used for expected state
- live cloud findings
- drift, missing data, and commands that would be needed for deeper inspection
