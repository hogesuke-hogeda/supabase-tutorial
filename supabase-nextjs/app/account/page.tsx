import { redirect } from 'next/navigation'

import AccountForm from './account-form'
import { createClient } from '@/lib/supabase/server'

export default async function Account() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let profile = null

  if (user.id) {
    const { data, error, status } = await supabase
      .from('profiles')
      .select(`full_name, username, website, avatar_url`)
      .eq('id', user.id)
      .single()

    if (error && status !== 406) {
      throw error
    }

    profile = data
  }

  return <AccountForm claims={{ sub: user.id, email: user.email }} profile={profile} />
}
