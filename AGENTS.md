# Project Agent Instructions

## Project Overview

This repository is a Supabase Auth tutorial workspace for checking local Supabase and hosted Supabase behavior from a Next.js 16 app.

- `supabase/`: local Supabase CLI configuration, migrations, and email templates
- `supabase-nextjs/`: Next.js 16 app used to exercise Supabase Auth and SSR flows
- `terraform/supabase/`: Terraform stack for hosted Supabase preview and production projects
- `terraform/vercel/`: Terraform stack for the Vercel project and environment variables
- `bin/`: local Supabase startup and database initialization scripts
- `docs/`: implementation plans and design notes

Prefer the repository README files for user-facing setup flow:

- Root workflow: `README.md`
- App workflow and env details: `supabase-nextjs/README.md`

## Important Framework Note

The app uses Next.js 16. This version may differ from older Next.js conventions in routing, APIs, and generated files. Before changing Next.js behavior, read the relevant local documentation under `supabase-nextjs/node_modules/next/dist/docs/` when dependencies are installed, and heed deprecation notices.

The nested `supabase-nextjs/AGENTS.md` also applies when working inside the app directory.

## Language

- Write project documentation in English.
- Use Japanese for prompt-facing collaboration with the user unless the user explicitly asks for another language.
- Keep CLI summaries and investigation notes in English, even when raw command output is localized or tool-specific.

## Required Skills and CLIs

- Use relevant skills before changing code, infrastructure, or agent rules.
- For Supabase Cloud investigation, use the `investigate-supabase-cloud` skill and the Supabase CLI. The skill source is `.codex/skills/investigate-supabase-cloud/SKILL.md`. If the CLI is not authenticated, ask the user to log in with `supabase login` or provide the required non-secret environment setup before continuing.
- For Vercel Cloud investigation, use the `investigate-vercel-cloud` skill and the Vercel CLI. The skill source is `.codex/skills/investigate-vercel-cloud/SKILL.md`. If the CLI is not authenticated, ask the user to log in with `vercel login` or provide the required non-secret environment setup before continuing.
- For GitHub operations, use the `gh` CLI. Check authentication with `gh auth status` first; if it is not logged in, ask the user to run `gh auth login`.
- Do not use cloud dashboards as the primary source of truth when a CLI can report the same state.
- Do not expose or paste secret values from CLI output. Redact tokens, service role keys, access tokens, and private environment values.

## Common Commands

Run app commands from `supabase-nextjs/`:

```bash
npm install
npm run dev:local
npm run dev:cloud
npm run lint
npm run build
```

Focused Node tests currently use the built-in test runner from the repository root:

```bash
node --test --experimental-strip-types supabase-nextjs/lib/deployment-url.test.mts
node --test --experimental-strip-types supabase-nextjs/lib/account-profile.test.mts
node --test --experimental-strip-types supabase-nextjs/lib/supabase/route-handler.test.mts
```

Terraform commands run from the repository root:

```bash
terraform -chdir=terraform/supabase fmt
terraform -chdir=terraform/supabase validate
terraform -chdir=terraform/vercel fmt
terraform -chdir=terraform/vercel validate
```

Local Supabase helper scripts:

```bash
/bin/bash bin/start-supabase.sh
/bin/bash bin/init-db.sh
/bin/bash bin/init-db.sh up
```

## Development Conventions

- Keep changes scoped to the area being modified; avoid unrelated refactors.
- Preserve the split between local Supabase configuration in `supabase/` and hosted configuration in `terraform/supabase/`.
- Do not commit real `.env` files, access tokens, service role keys, Terraform state, or populated `terraform.tfvars`.
- Keep placeholder values explicit in `*.example` files.
- For Supabase SSR changes, check Server Component, Server Action, Route Handler, and Proxy behavior as relevant.
- For redirect or deployment URL changes, update tests in `supabase-nextjs/lib/*.test.mts` when behavior changes.
- For Terraform changes, run `terraform fmt` and `terraform validate` on the affected stack.
- For cloud configuration changes, compare repository intent (`terraform/`, README files, and app env examples) with live cloud state gathered through the relevant CLI and skill.

## Environment Notes

- Work in the devcontainer for the local workflow.
- The devcontainer includes Supabase CLI, Terraform CLI, and Vercel CLI.
- Local Supabase is expected to run through Docker.
- Local app env files are split by target:
  - `.env.supabase.local` for local Supabase
  - `.env.supabase.cloud` for hosted Supabase

## Documentation Expectations

- Update `README.md` when repository-level workflow changes.
- Update `supabase-nextjs/README.md` when app setup, environment variables, or runtime behavior changes.
- Add or update design notes under `docs/` for multi-step infrastructure or deployment decisions.
