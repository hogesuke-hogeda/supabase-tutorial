type SignupRedirectParams = {
  hasError: boolean
  hasSession: boolean
}

export function getSignupRedirectPath({
  hasError,
  hasSession,
}: SignupRedirectParams): string {
  if (hasError) {
    return '/error'
  }

  if (!hasSession) {
    return '/login?message=Check%20your%20email%20to%20confirm%20your%20signup.'
  }

  return '/account'
}
