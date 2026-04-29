import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const mainTf = readFileSync(new URL('./main.tf', import.meta.url), 'utf8')

test('hosted Supabase auth settings manage the confirmation email template', () => {
  assert.match(mainTf, /mailer_subjects_confirmation/)
  assert.match(mainTf, /mailer_templates_confirmation_content/)
  assert.match(mainTf, /file\(\"\$\{path\.root\}\/\.\.\/\.\.\/supabase\/templates\/confirmation\.html\"\)/)
})

test('preview redirect URLs can include a derived Vercel wildcard pattern', () => {
  assert.match(mainTf, /variable "preview_vercel_team_slug"/)
  assert.match(mainTf, /https:\/\/\*-\$\{var\.preview_vercel_team_slug\}\.vercel\.app\/\*\*/)
})
