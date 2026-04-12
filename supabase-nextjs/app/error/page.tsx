import Link from 'next/link'

export default function ErrorPage() {
  return (
    <main>
      <h1>Something went wrong</h1>
      <p>We could not complete the authentication request.</p>
      <p>
        <Link href="/login">Back to login</Link>
      </p>
    </main>
  )
}
