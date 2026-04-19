import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadSupabaseEnv } from './supabase-env.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')

const [profile, nextCommand = 'dev', ...nextArgs] = process.argv.slice(2)

if (!profile) {
  console.error('Usage: node scripts/run-next-with-env.mjs <local|cloud> [next-command] [args...]')
  process.exit(1)
}

const envFile = loadSupabaseEnv(profile, projectRoot)
console.log(`Loaded Supabase env profile: ${envFile}`)

const nextBin = resolve(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, nextCommand, ...nextArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
