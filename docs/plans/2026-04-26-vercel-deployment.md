# Vercel Deployment Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Manage a Vercel deployment target for the `supabase-nextjs` app with Terraform, using GitHub integration for production (`main`) and preview deployments, while separating Supabase projects for production and preview traffic.

**Architecture:** Keep a dedicated `terraform/vercel` stack that creates a Vercel project, connects it to a GitHub repository, and manages the app's Vercel environment variables. Extend `terraform/supabase` so it manages two hosted projects: one for production traffic and one shared preview project for Vercel Preview deployments. Make the Next.js signup flow deployment-aware by preferring Vercel system environment variables such as `VERCEL_URL` at runtime, with a local-development fallback, so confirmation emails return to the actual deployment URL instead of always falling back to a fixed site URL.

**Tech Stack:** Terraform, Vercel Terraform Provider, Supabase Terraform Provider, Next.js 16, Node.js built-in test runner

### Task 1: Add a regression test for deployment-aware auth redirect selection

**Files:**
- Create: `supabase-nextjs/lib/deployment-url.test.mts`
- Create: `supabase-nextjs/lib/deployment-url.ts`

**Step 1: Write the failing test**

Write a Node test that covers:
- `VERCEL_URL` becomes `https://<vercel-url>`
- `SITE_URL` is used as a local fallback when `VERCEL_URL` is absent
- an already absolute fallback URL stays unchanged
- an empty input returns `undefined`

**Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types supabase-nextjs/lib/deployment-url.test.mts`
Expected: FAIL because `supabase-nextjs/lib/deployment-url.ts` does not exist yet.

**Step 3: Write minimal implementation**

Implement a small helper that resolves the redirect base URL with this precedence:
- `VERCEL_URL`
- `SITE_URL`
- `undefined`

The helper should only normalize protocol handling and should not depend on request headers.

**Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types supabase-nextjs/lib/deployment-url.test.mts`
Expected: PASS

### Task 2: Update the app to use deployment-aware signup confirmation URLs

**Files:**
- Modify: `supabase-nextjs/app/login/actions.ts`
- Modify: `supabase/templates/confirmation.html`

**Step 1: Resolve deployment URL in the server action**

Use `VERCEL_URL` at runtime when present, and fall back to `SITE_URL` for local development or non-Vercel execution.

**Step 2: Use the helper in the signup flow**

Set `emailRedirectTo` to `<resolved-base-url>/auth/confirm` when a base URL is available.

**Step 3: Update the email template**

Switch the confirmation template to `{{ .RedirectTo }}` so Supabase uses the per-request redirect target when present.

**Step 4: Verify**

Run:
- `node --test --experimental-strip-types supabase-nextjs/lib/deployment-url.test.mts`
- `npm run build`

Expected:
- tests pass
- Next.js build succeeds

### Task 3: Add Terraform-managed Vercel infrastructure

**Files:**
- Create: `terraform/vercel/main.tf`
- Create: `terraform/vercel/outputs.tf`
- Create: `terraform/vercel/terraform.tfvars.example`

**Step 1: Define provider and variables**

Add a dedicated Terraform stack for the Vercel provider with variables for:
- team ID
- project name
- GitHub repository
- production branch
- root directory
- Node version
- production Supabase URL / publishable key values
- preview Supabase URL / publishable key values

**Step 2: Create the Vercel project**

Create `vercel_project` with:
- `framework = "nextjs"`
- GitHub repository integration
- `root_directory = "supabase-nextjs"`
- production branch set to `main`

**Step 3: Manage environment variables**

Create Terraform-managed Vercel environment variables for:
- `SUPABASE_SERVER_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Set `production` to the production Supabase project and `preview` to the preview Supabase project. `SITE_URL` is not required on Vercel because preview URLs are deployment-specific and should come from `VERCEL_URL`.
Enable Vercel system environment variables for the project so `VERCEL_URL` is available at runtime for preview deployments.

**Step 4: Validate**

Run: `terraform -chdir=terraform/vercel init -backend=false`
Run: `terraform -chdir=terraform/vercel validate`
Expected: Terraform validates successfully

### Task 4: Extend Supabase Terraform to manage production and preview projects

**Files:**
- Modify: `terraform/supabase/main.tf`
- Modify: `terraform/supabase/outputs.tf`
- Modify: `terraform/supabase/terraform.tfvars.example`

**Step 1: Add separate hosted projects**

Refactor the Supabase Terraform stack so it can create and manage:
- one production project
- one shared preview project

Use either duplicated resources or a small map-driven `for_each`, but keep the resulting variable model readable.

**Step 2: Split redirect settings by environment**

Configure auth redirect settings so:
- production project allows localhost plus the production Vercel domain
- preview project allows localhost plus Vercel preview wildcard URLs

Keep defaults explicit in `terraform.tfvars.example`.

**Step 3: Expose both project outputs**

Add outputs for:
- production `project_ref`
- production `project_url`
- preview `project_ref`
- preview `project_url`

These outputs will feed Vercel environment variable setup and operational docs.

### Task 5: Update local Supabase config and documentation

**Files:**
- Modify: `supabase/config.toml`
- Modify: `README.md`
- Modify: `supabase-nextjs/README.md`

**Step 1: Keep local config aligned**

Document local redirect URLs separately from hosted production/preview settings so readers do not confuse CLI config with Terraform-managed hosted config.

**Step 2: Document Terraform apply order**

Document the full sequence for:
- creating the production and preview Supabase projects
- capturing both projects' outputs
- creating the Vercel project
- wiring `Production` env vars to prod Supabase
- wiring `Preview` env vars to preview Supabase
- enabling Vercel system environment variables
- updating Supabase redirect settings
- pushing to `main` and checking preview deployments

**Step 3: Describe verification paths**

Document separate checks for:
- production deployment hitting the production Supabase project
- PR preview deployment hitting the preview Supabase project

**Step 4: Verification**

Run:
- `terraform -chdir=terraform/supabase fmt`
- `terraform -chdir=terraform/vercel fmt`
- `terraform -chdir=terraform/supabase validate`
- `terraform -chdir=terraform/vercel validate`

Expected: Terraform formatting is clean and both stacks validate
