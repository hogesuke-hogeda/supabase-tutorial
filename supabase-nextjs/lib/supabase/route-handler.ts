import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server.js'

type ResponseCookieOptions = Parameters<NextResponse['cookies']['set']>[2]
type CookieToSet = {
  name: string
  value: string
  options?: ResponseCookieOptions
}

export function applyCookiesToRequestAndResponse(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: CookieToSet[],
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    request.cookies.set(name, value)

    if (options) {
      response.cookies.set(name, value, options)
      return
    }

    response.cookies.set(name, value)
  })
}

export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.SUPABASE_SERVER_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          applyCookiesToRequestAndResponse(request, response, cookiesToSet)
        },
      },
    }
  )
}
