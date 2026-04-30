import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
  const supabase = createRouteHandlerClient(req, response)

  // Check if a user's logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  return response
}
