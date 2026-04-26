type DeploymentEnv = Readonly<Record<string, string | undefined>>

export function resolveDeploymentUrl(env: DeploymentEnv = process.env) {
  const vercelEnvironment = env.VERCEL_TARGET_ENV?.trim() || env.VERCEL_ENV?.trim()
  const productionUrl = normalizeVercelUrl(env.VERCEL_PROJECT_PRODUCTION_URL)

  if (vercelEnvironment === 'production' && productionUrl) {
    return productionUrl
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
