import { headers } from 'next/headers'

import { resolveDeploymentUrl } from '@/lib/deployment-url'
import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams?.message
  const requestHeaders = await headers()
  const currentOrigin = resolveDeploymentUrl(process.env, requestHeaders)

  return (
    <form>
      {message ? <p>{message}</p> : null}
      <input name="origin" type="hidden" value={currentOrigin ?? ''} />
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
