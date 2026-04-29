import assert from 'node:assert/strict'
import test from 'node:test'

import { NextRequest, NextResponse } from 'next/server.js'

import { applyCookiesToRequestAndResponse } from './route-handler.ts'

test('applies Supabase auth cookies to redirect responses', () => {
  const request = new NextRequest('https://example.com/auth/confirm')
  const response = NextResponse.redirect(new URL('/account', request.url))

  applyCookiesToRequestAndResponse(request, response, [
    {
      name: 'sb-test-auth-token',
      value: 'token-value',
      options: {
        path: '/',
        httpOnly: true,
      },
    },
  ])

  assert.equal(request.cookies.get('sb-test-auth-token')?.value, 'token-value')
  assert.equal(response.cookies.get('sb-test-auth-token')?.value, 'token-value')
})
