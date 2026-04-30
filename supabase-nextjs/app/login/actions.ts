'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { resolveDeploymentUrl } from '@/lib/deployment-url'
import { createClient } from '@/lib/supabase/server'
import { getSignupRedirectPath } from './signup-result'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = readCredentials(formData)

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const requestHeaders = await headers()
  const currentOrigin = getNullableFormValue(formData, 'origin')
  const deploymentUrl = resolveDeploymentUrl(process.env, requestHeaders, currentOrigin ?? undefined)
  const data = {
    ...readCredentials(formData),
    ...buildSignupOptions(deploymentUrl),
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  const redirectPath = getSignupRedirectPath({
    hasError: Boolean(error),
    hasSession: Boolean(signUpData.session),
  })

  if (error) {
    redirect(redirectPath)
  }

  revalidatePath('/', 'layout')
  redirect(redirectPath)
}

function readCredentials(formData: FormData) {
  return {
    email: getFormValue(formData, 'email'),
    password: getFormValue(formData, 'password'),
  }
}

function buildSignupOptions(deploymentUrl: string | undefined) {
  if (!deploymentUrl) {
    return {}
  }

  return {
    options: {
      emailRedirectTo: `${deploymentUrl}/auth/confirm`,
    },
  }
}

function getFormValue(formData: FormData, fieldName: string) {
  return formData.get(fieldName) as string
}

function getNullableFormValue(formData: FormData, fieldName: string) {
  return (formData.get(fieldName) as string | null) ?? null
}
