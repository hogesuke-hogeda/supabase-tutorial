import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createProfileQueryOutcome,
  type ProfileRecord,
} from './account-profile.ts'

const exampleProfile: ProfileRecord = {
  full_name: 'Jane Doe',
  username: 'jane',
  website: 'https://example.com',
  avatar_url: null,
}

test('returns the fetched profile when the query succeeds', () => {
  assert.deepEqual(
    createProfileQueryOutcome({
      data: exampleProfile,
      error: null,
      status: 200,
    }),
    {
      profile: exampleProfile,
      profileStoreAvailable: true,
    },
  )
})

test('treats no profile row as a recoverable empty profile state', () => {
  assert.deepEqual(
    createProfileQueryOutcome({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
      status: 406,
    }),
    {
      profile: null,
      profileStoreAvailable: true,
    },
  )
})

test('treats a missing profiles table as unavailable profile storage instead of crashing', () => {
  assert.deepEqual(
    createProfileQueryOutcome({
      data: null,
      error: { code: '42P01', message: 'relation "profiles" does not exist' },
      status: 500,
    }),
    {
      profile: null,
      profileStoreAvailable: false,
    },
  )
})

test('rethrows unexpected profile query failures', () => {
  assert.throws(
    () =>
      createProfileQueryOutcome({
        data: null,
        error: { code: '42501', message: 'permission denied' },
        status: 401,
      }),
    /permission denied/,
  )
})
