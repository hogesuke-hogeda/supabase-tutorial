export type ProfileRecord = {
  full_name: string | null
  username: string | null
  website: string | null
  avatar_url: string | null
}

type ProfileQueryError = {
  code?: string
  message: string
}

type ProfileQueryResult = {
  data: ProfileRecord | null
  error: ProfileQueryError | null
  status: number
}

export function createProfileQueryOutcome({
  data,
  error,
  status,
}: ProfileQueryResult) {
  if (!error) {
    return {
      profile: data,
      profileStoreAvailable: true,
    }
  }

  if (status === 406) {
    return {
      profile: null,
      profileStoreAvailable: true,
    }
  }

  if (error.code === '42P01') {
    return {
      profile: null,
      profileStoreAvailable: false,
    }
  }

  throw new Error(error.message)
}
