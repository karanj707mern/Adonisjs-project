export function generateGuestToken(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID()
  }
  
  let token = localStorage.getItem('guest_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('guest_token', token)
  }
  
  return token
}

export function getGuestToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  return localStorage.getItem('guest_token')
}
