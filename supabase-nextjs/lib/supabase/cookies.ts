import { type NextRequest, NextResponse } from 'next/server.js'

type ResponseCookieOptions = Parameters<NextResponse['cookies']['set']>[2]

export type CookieToSet = {
  name: string
  value: string
  options?: ResponseCookieOptions
}

export function applyCookiesToResponse(
  response: NextResponse,
  cookiesToSet: readonly CookieToSet[],
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
}

export function applyCookiesToRequestAndResponse(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: readonly CookieToSet[],
) {
  cookiesToSet.forEach(({ name, value }) => {
    request.cookies.set(name, value)
  })

  applyCookiesToResponse(response, cookiesToSet)
}
