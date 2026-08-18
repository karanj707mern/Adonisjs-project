export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  stock: number;
  isActive?: boolean;
  isNewArrival?: boolean;
  slug?: string;
  sku?: string;
  brand?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  weightGrams?: number;
  createdAt?: string | number;
}

export interface ReviewProduct {
  id: string | number;
  name: string;
  image: string;
}

export interface ReviewUser {
  name: string;
}

export interface ReviewComment {
  id: string | number;
  content: string;
  user: ReviewUser;
  createdAt?: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: { rating: number; count: number }[];
}

export interface Review {
  id: string | number;
  rating: number;
  title?: string;
  content: string;
  product: ReviewProduct;
  user: ReviewUser;
  comments?: ReviewComment[];
  createdAt?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface User {
  id: number;
  role: string;
}

export interface CartItem {
  id: string | number;
  quantity: number;
}
