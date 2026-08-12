const CART_KEY = 'cart-items'
const WISHLIST_KEY = 'wishlist-items'
const USER_KEY = 'user'

export function getCart() {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function setCart(items: any[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function getWishlist() {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(WISHLIST_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function setWishlist(items: any[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
}

export function getUser() {
  if (typeof window === 'undefined') return null
  
  try {
    const data = localStorage.getItem(USER_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setUser(user: any) {
  if (typeof window === 'undefined') return
  
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}
