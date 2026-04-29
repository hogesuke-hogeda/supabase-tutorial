type DeploymentEnv = Readonly<Record<string, string | undefined>>
type RequestHeaders = Pick<Headers, 'get'>

export function resolveDeploymentUrl(
  env: DeploymentEnv = process.env,
  requestHeaders?: RequestHeaders,
  preferredUrl?: string,
) {
  const explicitUrl = normalizeAbsoluteUrl(preferredUrl)

  if (explicitUrl) {
    return explicitUrl
  }

  const vercelEnvironment = env.VERCEL_ENV?.trim()
  const productionUrl = normalizeVercelUrl(env.VERCEL_PROJECT_PRODUCTION_URL)

  if (vercelEnvironment === 'production' && productionUrl) {
    return productionUrl
  }

  const requestUrl = resolveRequestUrl(requestHeaders)

  if (requestUrl) {
    return requestUrl
  }

  const branchUrl = normalizeVercelUrl(env.VERCEL_BRANCH_URL)

  if (vercelEnvironment === 'preview' && branchUrl) {
    return branchUrl
  }

  const vercelUrl = normalizeVercelUrl(env.VERCEL_URL)

  if (vercelUrl) {
    return vercelUrl
  }

  const siteUrl = normalizeSiteUrl(env.SITE_URL)

  if (siteUrl) {
    return siteUrl
  }

  return undefined
}

function normalizeVercelUrl(value: string | undefined) {
  const normalizedValue = value?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')

  if (!normalizedValue) {
    return undefined
  }

  return `https://${normalizedValue}`
}

function normalizeSiteUrl(value: string | undefined) {
  const normalizedValue = value?.trim().replace(/\/+$/, '')

  if (!normalizedValue) {
    return undefined
  }

  return normalizedValue
}

function resolveRequestUrl(requestHeaders: RequestHeaders | undefined) {
  const origin = normalizeAbsoluteUrl(normalizeHeaderValue(requestHeaders?.get('origin')))

  if (origin) {
    return origin
  }

  const forwardedHost = normalizeHeaderValue(requestHeaders?.get('x-forwarded-host'))
  const host = forwardedHost || normalizeHeaderValue(requestHeaders?.get('host'))
  const proto = normalizeProto(requestHeaders?.get('x-forwarded-proto'))

  if (!host || !proto) {
    return undefined
  }

  return `${proto}://${host}`
}

function normalizeHeaderValue(value: string | null | undefined) {
  const normalizedValue = value?.split(',')[0]?.trim().replace(/\/+$/, '')

  if (!normalizedValue) {
    return undefined
  }

  return normalizedValue
}

function normalizeProto(value: string | null | undefined) {
  const normalizedValue = normalizeHeaderValue(value)?.replace(/:$/, '')

  if (normalizedValue === 'http' || normalizedValue === 'https') {
    return normalizedValue
  }

  return undefined
}

function normalizeAbsoluteUrl(value: string | undefined) {
  const normalizedValue = normalizeSiteUrl(value)

  if (!normalizedValue || !/^https?:\/\//.test(normalizedValue)) {
    return undefined
  }

  return normalizedValue
}
