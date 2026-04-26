'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { resolveDeploymentUrl } from '@/lib/deployment-url'
import { createClient } from '@/lib/supabase/server'
import { getSignupRedirectPath } from './signup-result'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/account')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const deploymentUrl = resolveDeploymentUrl()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    ...(deploymentUrl
      ? {
          options: {
            emailRedirectTo: `${deploymentUrl}/auth/confirm`,
          },
        }
      : {}),
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
