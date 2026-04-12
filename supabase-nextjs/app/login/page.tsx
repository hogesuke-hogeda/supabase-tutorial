import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams?.message

  return (
    <form>
      {message ? <p>{message}</p> : null}
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
