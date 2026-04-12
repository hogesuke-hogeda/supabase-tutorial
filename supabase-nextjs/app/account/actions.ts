'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  const userId = claimsData?.claims?.sub
  if (!userId) {
    redirect('/login')
  }

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: (formData.get('fullName') as string | null) ?? null,
    username: (formData.get('username') as string | null) ?? null,
    website: (formData.get('website') as string | null) ?? null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    redirect('/error')
  }

  revalidatePath('/account')
  redirect('/account')
}
