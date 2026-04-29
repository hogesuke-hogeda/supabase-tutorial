import { updateProfile } from './actions'
import { type ProfileRecord } from '@/lib/account-profile'

type Claims = { sub: string; email?: string; [key: string]: unknown }

export default function AccountForm({
  claims,
  profile,
  profileStoreAvailable,
}: {
  claims: Claims | null
  profile: ProfileRecord | null
  profileStoreAvailable: boolean
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
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={profile?.full_name ?? ''}
            disabled={!profileStoreAvailable}
          />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={profile?.username ?? ''}
            disabled={!profileStoreAvailable}
          />
        </div>
        <div>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={profile?.website ?? ''}
            disabled={!profileStoreAvailable}
          />
        </div>

        {!profileStoreAvailable ? (
          <p>Profile storage is not available in this Supabase project yet. Run the linked database migrations.</p>
        ) : null}

        <div>
          <button
            className="button primary block"
            type="submit"
            disabled={!claims?.sub || !profileStoreAvailable}
          >
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
