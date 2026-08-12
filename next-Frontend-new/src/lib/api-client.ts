import { API_BASE_URL } from './config'
import type { User, Product, CartItem, WishlistItem, Order, BlogPost, Review, StoreSettings } from './types'

const API_BASE = API_BASE_URL

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),

    getSession: () =>
      request<{ user: User }>('/auth/session'),

    getProfile: () =>
      request<User>('/auth/profile'),
  },

  products: {
    getAll: () =>
      request<{ data: Product[]; meta: any }>('/products'),

    getFeatured: () =>
      request<Product[]>('/products/featured'),

    getById: (id: string) =>
      request<Product>(`/products/${id}`),

    adminGetAll: () =>
      request<{ data: Product[] }>('/products/admin/all'),
  },

  cart: {
    get: () =>
      request<CartItem[]>('/cart'),

    add: (data: { productId: number; quantity: number }) =>
      request<CartItem>('/cart', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  wishlist: {
    getAll: () =>
      request<WishlistItem[]>('/wishlist'),

    add: (productId: number) =>
      request<WishlistItem>('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
  },

  order: {
    getAll: (params?: { status?: string }) => {
      const query = params?.status ? `?status=${params.status}` : ''
      return request<{ data: Order[]; meta: any }>(`/orders${query}`)
    },

    getById: (id: string) =>
      request<Order>(`/orders/${id}`),

    adminGetAll: () =>
      request<{ data: Order[] }>('/orders/admin'),
  },

  blog: {
    getAll: () =>
      request<{ data: BlogPost[] }>('/blog'),

    getBySlug: (slug: string) =>
      request<BlogPost>(`/blog/${slug}`),
  },

  hero: {
    getActive: () =>
      request<any[]>('/hero/active'),
  },

  settings: {
    get: () =>
      request<StoreSettings>('/settings'),
  },

  review: {
    getFeatured: () =>
      request<Review[]>('/review/featured'),

    getProductReviews: (productId: string) =>
      request<{ data: Review[] }>(`/review/product/${productId}`),
  },

  admin: {
    getOverview: () =>
      request<any>('/admin/overview'),
  },
}
