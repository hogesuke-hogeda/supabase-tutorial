import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveDeploymentUrl } from './deployment-url.ts'

function createHeaders(headers: Record<string, string>) {
  return {
    get(name: string) {
      return headers[name.toLowerCase()] ?? null
    },
  }
}

test('uses VERCEL_URL and normalizes it to https', () => {
  assert.equal(
    resolveDeploymentUrl({
      VERCEL_URL: 'preview-app.vercel.app',
      SITE_URL: 'http://localhost:3000',
    }),
    'https://preview-app.vercel.app',
  )
})

test('uses the canonical production URL on Vercel production', () => {
  assert.equal(
    resolveDeploymentUrl({
      VERCEL_ENV: 'production',
      VERCEL_URL: 'my-site-abc123.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'my-site.com',
      SITE_URL: 'https://fallback.example.com',
    }),
    'https://my-site.com',
  )
})

test('prefers an explicit current URL over the canonical production URL', () => {
  assert.equal(
    resolveDeploymentUrl(
      {
        VERCEL_ENV: 'production',
        VERCEL_URL: 'my-site-abc123.vercel.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'supabase-tutorial-zeta.vercel.app',
        SITE_URL: 'https://supabase-tutorial-zeta.vercel.app',
      },
      undefined,
      'https://preview-app-git-feature-branch.vercel.app',
    ),
    'https://preview-app-git-feature-branch.vercel.app',
  )
})

test('uses the request origin before SITE_URL for preview signups', () => {
  assert.equal(
    resolveDeploymentUrl(
      {
        SITE_URL: 'https://your-production-domain.example',
      },
      createHeaders({
        origin: 'https://preview-app-git-feature-branch.vercel.app',
      }),
    ),
    'https://preview-app-git-feature-branch.vercel.app',
  )
})

test('builds the deployment URL from forwarded host headers when origin is absent', () => {
  assert.equal(
    resolveDeploymentUrl(
      {
        SITE_URL: 'https://your-production-domain.example',
      },
      createHeaders({
        'x-forwarded-host': 'preview-app-git-feature-branch.vercel.app',
        'x-forwarded-proto': 'https',
      }),
    ),
    'https://preview-app-git-feature-branch.vercel.app',
  )
})

test('falls back to SITE_URL when VERCEL_URL is absent', () => {
  assert.equal(
    resolveDeploymentUrl({
      SITE_URL: 'http://localhost:3000',
    }),
    'http://localhost:3000',
  )
})

test('keeps an absolute SITE_URL unchanged', () => {
  assert.equal(
    resolveDeploymentUrl({
      SITE_URL: 'https://example.com',
    }),
    'https://example.com',
  )
})

test('removes trailing slashes from resolved URLs', () => {
  assert.equal(
    resolveDeploymentUrl({
      SITE_URL: 'https://example.com/',
    }),
    'https://example.com',
  )
})

test('returns undefined when no deployment URL inputs are set', () => {
  assert.equal(resolveDeploymentUrl({}), undefined)
})
