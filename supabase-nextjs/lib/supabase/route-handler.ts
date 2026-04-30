import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server.js'

import { applyCookiesToRequestAndResponse } from './cookies'

export { applyCookiesToRequestAndResponse } from './cookies'

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
