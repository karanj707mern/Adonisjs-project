import { api } from './api-client'

export async function getSession() {
  try {
    const response = await api.auth.getSession()
    return response.data?.user || null
  } catch {
    return null
  }
}

export async function login(email: string, password: string) {
  const response = await api.auth.login({ email, password })
  
  if (typeof window !== 'undefined') {
    document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
  }
  
  return response.data
}

export async function logout() {
  await api.auth.logout()
  
  if (typeof window !== 'undefined') {
    document.cookie = 'accessToken=; path=/; max-age=0'
  }
}

export async function register(name: string, email: string, password: string) {
  const response = await api.auth.register({ name, email, password })
  
  if (typeof window !== 'undefined') {
    document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`
  }
  
  return response.data
}
