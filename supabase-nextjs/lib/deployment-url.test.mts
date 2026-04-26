import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveDeploymentUrl } from './deployment-url.ts'

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
