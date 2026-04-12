import AccountForm from './account-form'
import { createClient } from '@/lib/supabase/server'

export default async function Account() {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims ?? null

  let profile = null

  if (claims?.sub) {
    const { data, error, status } = await supabase
      .from('profiles')
      .select(`full_name, username, website, avatar_url`)
      .eq('id', claims.sub)
      .single()

    if (error && status !== 406) {
      throw error
    }

    profile = data
  }

  return <AccountForm claims={claims} profile={profile} />
}
