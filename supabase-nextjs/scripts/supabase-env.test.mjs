import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadSupabaseEnv, resolveSupabaseEnvFile } from './supabase-env.mjs'

test('resolveSupabaseEnvFile maps local and cloud profiles', () => {
  assert.equal(
    resolveSupabaseEnvFile('local', '/tmp/example-project'),
    '/tmp/example-project/.env.supabase.local'
  )
  assert.equal(
    resolveSupabaseEnvFile('cloud', '/tmp/example-project'),
    '/tmp/example-project/.env.supabase.cloud'
  )
})

test('resolveSupabaseEnvFile rejects unknown profiles', () => {
  assert.throws(
    () => resolveSupabaseEnvFile('staging', '/tmp/example-project'),
    /Unsupported Supabase profile: staging/
  )
})

test('loadSupabaseEnv reads variables from the requested env file', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'supabase-env-'))
  const envFile = join(projectRoot, '.env.supabase.local')

  writeFileSync(
    envFile,
    [
      'SUPABASE_SERVER_URL=https://example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key',
      '',
    ].join('\n')
  )

  const originalServerUrl = process.env.SUPABASE_SERVER_URL
  const originalPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  try {
    process.env.SUPABASE_SERVER_URL = 'https://stale.local.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stale.local.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'stale-local-key'

    const loadedFile = loadSupabaseEnv('local', projectRoot)

    assert.equal(loadedFile, envFile)
    assert.equal(process.env.SUPABASE_SERVER_URL, 'https://example.supabase.co')
    assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://example.supabase.co')
    assert.equal(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'test-publishable-key')
  } finally {
    if (originalServerUrl === undefined) {
      delete process.env.SUPABASE_SERVER_URL
    } else {
      process.env.SUPABASE_SERVER_URL = originalServerUrl
    }

    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalPublicUrl
    }

    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey
    }

    rmSync(projectRoot, { recursive: true, force: true })
  }
})

test('loadSupabaseEnv reads cloud variables from the cloud env file', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'supabase-env-'))
  const envFile = join(projectRoot, '.env.supabase.cloud')

  writeFileSync(
    envFile,
    [
      'SUPABASE_SERVER_URL=https://cloud.example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_URL=https://cloud.example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=cloud-publishable-key',
      '',
    ].join('\n')
  )

  const originalServerUrl = process.env.SUPABASE_SERVER_URL
  const originalPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  try {
    process.env.SUPABASE_SERVER_URL = 'https://stale.cloud.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stale.cloud.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'stale-cloud-key'

    const loadedFile = loadSupabaseEnv('cloud', projectRoot)

    assert.equal(loadedFile, envFile)
    assert.equal(
      process.env.SUPABASE_SERVER_URL,
      'https://cloud.example.supabase.co'
    )
    assert.equal(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      'https://cloud.example.supabase.co'
    )
    assert.equal(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      'cloud-publishable-key'
    )
  } finally {
    if (originalServerUrl === undefined) {
      delete process.env.SUPABASE_SERVER_URL
    } else {
      process.env.SUPABASE_SERVER_URL = originalServerUrl
    }

    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalPublicUrl
    }

    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey
    }

    rmSync(projectRoot, { recursive: true, force: true })
  }
})

test('loadSupabaseEnv rejects env files missing a required variable', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'supabase-env-'))
  const envFile = join(projectRoot, '.env.supabase.local')

  writeFileSync(
    envFile,
    [
      'SUPABASE_SERVER_URL=https://example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co',
      '',
    ].join('\n')
  )

  const originalServerUrl = process.env.SUPABASE_SERVER_URL
  const originalPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  try {
    process.env.SUPABASE_SERVER_URL = 'https://stale.local.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://stale.local.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'stale-local-key'

    assert.throws(
      () => loadSupabaseEnv('local', projectRoot),
      /Missing required Supabase env var\(s\) in .*\.env\.supabase\.local: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
    )

    assert.equal(process.env.SUPABASE_SERVER_URL, 'https://stale.local.supabase.co')
    assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://stale.local.supabase.co')
    assert.equal(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'stale-local-key')
  } finally {
    if (originalServerUrl === undefined) {
      delete process.env.SUPABASE_SERVER_URL
    } else {
      process.env.SUPABASE_SERVER_URL = originalServerUrl
    }

    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalPublicUrl
    }

    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey
    }

    rmSync(projectRoot, { recursive: true, force: true })
  }
})

test('loadSupabaseEnv rejects env files with empty required variables', () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'supabase-env-'))
  const envFile = join(projectRoot, '.env.supabase.cloud')

  writeFileSync(
    envFile,
    [
      'SUPABASE_SERVER_URL=https://cloud.example.supabase.co',
      'NEXT_PUBLIC_SUPABASE_URL=',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=cloud-publishable-key',
      '',
    ].join('\n')
  )

  assert.throws(
    () => loadSupabaseEnv('cloud', projectRoot),
    /Missing required Supabase env var\(s\) in .*\.env\.supabase\.cloud: NEXT_PUBLIC_SUPABASE_URL/
  )

  rmSync(projectRoot, { recursive: true, force: true })
})
