import { updateProfile } from './actions'

type Claims = { sub: string; email?: string; [key: string]: unknown }
type Profile = {
  full_name: string | null
  username: string | null
  website: string | null
  avatar_url: string | null
}

export default function AccountForm({
  claims,
  profile,
}: {
  claims: Claims | null
  profile: Profile | null
}) {
  return (
    <div className="form-widget">
      <form action={updateProfile}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={claims?.email ?? ''} disabled />
        </div>
        <div>
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" name="fullName" type="text" defaultValue={profile?.full_name ?? ''} />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" defaultValue={profile?.username ?? ''} />
        </div>
        <div>
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="url" defaultValue={profile?.website ?? ''} />
        </div>

        <div>
          <button className="button primary block" type="submit" disabled={!claims?.sub}>
            Update
          </button>
        </div>
      </form>

      <div>
        <form action="/signout" method="post">
          <button className="button block" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
