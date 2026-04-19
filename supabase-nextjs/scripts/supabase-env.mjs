import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const requiredSupabaseEnvKeys = [
  'SUPABASE_SERVER_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]

function parseSupabaseEnv(source) {
  const env = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line === '' || line.startsWith('#')) {
      continue
    }

    const exportedLine = line.startsWith('export ') ? line.slice(7).trimStart() : line
    const equalsIndex = exportedLine.indexOf('=')

    if (equalsIndex === -1) {
      continue
    }

    const key = exportedLine.slice(0, equalsIndex).trim()
    let value = exportedLine.slice(equalsIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

export function resolveSupabaseEnvFile(profile, projectRoot = process.cwd()) {
  if (profile === 'local') {
    return resolve(projectRoot, '.env.supabase.local')
  }

  if (profile === 'cloud') {
    return resolve(projectRoot, '.env.supabase.cloud')
  }

  throw new Error(`Unsupported Supabase profile: ${profile}`)
}

export function loadSupabaseEnv(profile, projectRoot = process.cwd()) {
  const envFile = resolveSupabaseEnvFile(profile, projectRoot)

  if (!existsSync(envFile)) {
    throw new Error(`Missing Supabase env file: ${envFile}`)
  }

  const parsedEnv = parseSupabaseEnv(readFileSync(envFile, 'utf8'))

  const missingKeys = requiredSupabaseEnvKeys.filter((key) => !parsedEnv[key])

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required Supabase env var(s) in ${envFile}: ${missingKeys.join(', ')}`
    )
  }

  for (const [key, value] of Object.entries(parsedEnv)) {
    process.env[key] = value
  }

  return envFile
}
