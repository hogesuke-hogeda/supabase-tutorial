import { redirect } from 'next/navigation'

import AccountForm from './account-form'
import { createProfileQueryOutcome } from '@/lib/account-profile'
import { createClient } from '@/lib/supabase/server'

export default async function Account() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { profile, profileStoreAvailable } = await loadProfileState(supabase, user.id)

  return (
    <AccountForm
      claims={{ sub: user.id, email: user.email }}
      profile={profile}
      profileStoreAvailable={profileStoreAvailable}
    />
  )
}

async function loadProfileState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error, status } = await supabase
    .from('profiles')
    .select(`full_name, username, website, avatar_url`)
    .eq('id', userId)
    .single()

  return createProfileQueryOutcome({ data, error, status })
}
