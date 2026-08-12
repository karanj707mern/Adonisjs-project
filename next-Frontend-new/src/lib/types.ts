export type User = {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  avatar?: string
}

export type Product = {
  id: number
  name: string
  price: number
  description: string
  image: string
  stock: number
  slug: string
  sku: string
  compareAtPrice?: number
  brand?: string
  tags?: string[]
  isActive: boolean
  isNewArrival: boolean
}

export type CartItem = {
  id: number
  productId: number
  quantity: number
  product?: Product
}

export type WishlistItem = {
  id: number
  productId: number
  product?: Product
}

export type Order = {
  id: number
  total: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'OUT_FOR_DELIVERY'
  createdAt: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: number
  productId: number
  quantity: number
  price: number
  product?: Product
}

export type Review = {
  id: number
  userId: number
  productId: number
  rating: number
  title: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  user?: {
    name: string
  }
}

export type BlogPost = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  published: boolean
  publishedAt?: string
  createdAt: string
}

export type StoreSettings = {
  shippingCharge: number
  taxRate: number
  freeShippingThreshold: number
  codCharge?: number
  expressShippingCharge?: number
  handlingCharge?: number
  sameDayShippingCharge?: number
  codEnabled: boolean
}
