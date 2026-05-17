---
name: investigate-supabase-cloud
description: Use when inspecting Supabase Cloud projects, hosted auth configuration, project refs, API keys metadata, linked projects, logs availability, or drift between Terraform and live Supabase state.
---

# Investigate Supabase Cloud

## Purpose

Use this skill to gather live Supabase Cloud state with the Supabase CLI and compare it to repository intent. Treat secrets as sensitive even when the CLI prints them.

## Authentication Gate

1. Check CLI availability: `supabase --version`.
2. Check authentication with a read-only command: `supabase orgs list --output json`.
3. If authentication fails, stop and ask the user to run `supabase login` or provide the required authenticated environment. Do not invent cloud state.

## Investigation Workflow

1. Read repository intent first:
   - `README.md`
   - `supabase-nextjs/README.md`
   - `terraform/supabase/*.tf`
   - `supabase/config.toml` for local-only settings
2. Gather live project inventory:
   - `supabase orgs list --output json`
   - `supabase projects list --output json`
3. Identify the target hosted project refs from Terraform output, tfvars examples, README instructions, or user input.
4. For each target project, use CLI output where available. Use `supabase projects api-keys --project-ref <ref> --output json` only when key metadata is required, and redact all key values in summaries.
5. For diagnostics that mention logs, distinguish these cases:
   - CLI/debug logs for the Supabase CLI itself: rerun the relevant read-only command with `--debug` only when troubleshooting CLI/API failures, and redact access tokens or request headers.
   - Hosted service logs: first check whether the installed CLI exposes log commands with `supabase --help` and `supabase functions --help`. In Supabase CLI 2.84.2, there is no `supabase logs` command and no `supabase functions logs` command.
   - If the installed CLI cannot fetch hosted service logs, state that limitation explicitly and ask the user for an approved source for the relevant logs, such as copied Supabase dashboard logs or an authorized API/export path. Do not invent log contents.
6. Compare live state against repository intent. Call out unknowns explicitly when the Supabase CLI cannot expose a hosted setting or hosted logs.

## Safety Rules

- Never run destructive commands such as `supabase projects delete`.
- Never print access tokens, service role keys, JWT secrets, database passwords, or private env values.
- Treat logs as sensitive. Redact auth headers, cookies, JWTs, email addresses, IP addresses when not needed, and any application secrets.
- Do not change linked projects or push migrations unless the user asked for a change, not just an investigation.
- Keep local Supabase (`supabase/config.toml`, CLI local services) separate from hosted Supabase (`terraform/supabase/`).

## Reporting

Report:

- CLI authentication status
- project refs and names inspected
- log commands checked, log sources used, and any CLI limitations
- repository source files used for expected state
- live cloud findings
- drift, missing data, and commands that would be needed for deeper inspection
