/// <reference path="../manifest.d.ts" />

import type {
  ExtractBody,
  ExtractErrorResponse,
  ExtractQuery,
  ExtractQueryForGet,
  ExtractResponse,
} from '@tuyau/core/types';
import type { InferInput, SimpleError } from '@vinejs/vine/types';

export type ParamValue = string | number | bigint | boolean;

export interface Registry {
  'auth.generate_captcha': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/auth/captcha';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.login': {
    methods: ['POST'];
    pattern: '/api/v1/auth/login';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.google_auth': {
    methods: ['POST'];
    pattern: '/api/v1/auth/google';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.register': {
    methods: ['POST'];
    pattern: '/api/v1/auth/register';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.verify_email': {
    methods: ['POST'];
    pattern: '/api/v1/auth/verify-email';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.resend_verification': {
    methods: ['POST'];
    pattern: '/api/v1/auth/resend-verification';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.forgot_password': {
    methods: ['POST'];
    pattern: '/api/v1/auth/forgot-password';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.reset_password': {
    methods: ['POST'];
    pattern: '/api/v1/auth/reset-password';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.session': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/auth/session';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.refresh': {
    methods: ['POST'];
    pattern: '/api/v1/auth/refresh';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.get_profile': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/auth/profile';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.update_profile': {
    methods: ['PATCH'];
    pattern: '/api/v1/auth/profile';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.change_password': {
    methods: ['POST'];
    pattern: '/api/v1/auth/change-password';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.delete_account': {
    methods: ['DELETE'];
    pattern: '/api/v1/auth/account';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.logout': {
    methods: ['POST'];
    pattern: '/api/v1/auth/logout';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.upload_avatar': {
    methods: ['POST'];
    pattern: '/api/v1/auth/upload-avatar';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.list_sessions': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/auth/sessions';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.revoke_session': {
    methods: ['DELETE'];
    pattern: '/api/v1/auth/sessions/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.list_addresses': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/auth/addresses';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.create_address': {
    methods: ['POST'];
    pattern: '/api/v1/auth/addresses';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.update_address': {
    methods: ['PATCH'];
    pattern: '/api/v1/auth/addresses/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'auth.remove_address': {
    methods: ['DELETE'];
    pattern: '/api/v1/auth/addresses/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'user.create': {
    methods: ['POST'];
    pattern: '/api/v1/users';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'user.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/users';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'user.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'user.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'user.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.upload_image': {
    methods: ['POST'];
    pattern: '/api/v1/products/upload-image';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.create_product': {
    methods: ['POST'];
    pattern: '/api/v1/products';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.get_products': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/products';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.get_admin_products': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/products/admin/all';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.get_new_arrivals': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/products/new-arrivals';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.get_product': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/products/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.update_product': {
    methods: ['PATCH'];
    pattern: '/api/v1/products/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.delete_product': {
    methods: ['DELETE'];
    pattern: '/api/v1/products/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.record_view': {
    methods: ['POST'];
    pattern: '/api/v1/products/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.get_recently_viewed': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/products/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'product.clear_history': {
    methods: ['DELETE'];
    pattern: '/api/v1/products/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.create': {
    methods: ['POST'];
    pattern: '/api/v1/cart';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/cart';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/cart/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/cart/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/cart/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.clear': {
    methods: ['DELETE'];
    pattern: '/api/v1/cart';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.create_guest_cart': {
    methods: ['POST'];
    pattern: '/api/v1/cart/guest';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.get_guest_cart': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/cart/guest';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.get_guest_cart_by_token': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/cart/guest/:token';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { token: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.merge_guest_cart': {
    methods: ['POST'];
    pattern: '/api/v1/cart/guest/merge';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.delete_guest_cart': {
    methods: ['DELETE'];
    pattern: '/api/v1/cart/guest';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'cart.delete_guest_cart_by_token': {
    methods: ['DELETE'];
    pattern: '/api/v1/cart/guest/:token';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { token: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.handle_razorpay_webhook': {
    methods: ['POST'];
    pattern: '/api/v1/order/webhook/razorpay';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.verify_payment': {
    methods: ['POST'];
    pattern: '/api/v1/order/verify-payment';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.create_checkout_session': {
    methods: ['POST'];
    pattern: '/api/v1/order/checkout-session';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.preview': {
    methods: ['POST'];
    pattern: '/api/v1/order/preview';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.create': {
    methods: ['POST'];
    pattern: '/api/v1/order';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_my_orders': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_admin_orders': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/admin';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_open_orders': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/admin/open';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_cancelled_orders': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/admin/cancelled';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_admin_issues': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/admin/issues';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.get_invoice': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/:id/invoice';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.create_issue': {
    methods: ['POST'];
    pattern: '/api/v1/order/:id/issues';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/order/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.update_issue': {
    methods: ['PATCH'];
    pattern: '/api/v1/order/issues/:issueId';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { issueId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.refund_order': {
    methods: ['POST'];
    pattern: '/api/v1/order/admin/:id/refund';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/order/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'order.track': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/order/:id/track';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'settings.get_store_settings': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/settings';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'settings.update_store_settings': {
    methods: ['PATCH'];
    pattern: '/api/v1/settings';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.get_featured_reviews': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/featured';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.get_product_reviews': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/product/:productId';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { productId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.get_review_eligibility': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/product/:productId/eligibility';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { productId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.create_review': {
    methods: ['POST'];
    pattern: '/api/v1/product/:productId';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { productId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.create_comment': {
    methods: ['POST'];
    pattern: '/api/v1/:reviewId/comments';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { reviewId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.moderate_review': {
    methods: ['PATCH'];
    pattern: '/api/v1/:id/moderate';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'review.get_pending_reviews': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/pending';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.upload_image': {
    methods: ['POST'];
    pattern: '/api/v1/blog/upload-image';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.create_post': {
    methods: ['POST'];
    pattern: '/api/v1/blog';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.get_published_posts': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/blog';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.get_all_posts': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/blog/admin/all';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.get_post_by_slug': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/blog/:slug';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { slug: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.update_post': {
    methods: ['PATCH'];
    pattern: '/api/v1/blog/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'blog.delete_post': {
    methods: ['DELETE'];
    pattern: '/api/v1/blog/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/wishlist';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.create_guest_wishlist': {
    methods: ['POST'];
    pattern: '/api/v1/wishlist/guest-token';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.add': {
    methods: ['POST'];
    pattern: '/api/v1/wishlist/:productId';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { productId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/wishlist/:productId';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { productId: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.get_guest_wishlist': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/wishlist/guest-token/:token?';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.delete_guest_wishlist': {
    methods: ['DELETE'];
    pattern: '/api/v1/wishlist/guest-token/:token?';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'wishlist.merge_guest_wishlist': {
    methods: ['POST'];
    pattern: '/api/v1/wishlist/guest/merge';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.validate': {
    methods: ['POST'];
    pattern: '/api/v1/coupons/validate';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/coupons';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.get_analytics': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/coupons/analytics';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.create': {
    methods: ['POST'];
    pattern: '/api/v1/coupons';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/coupons/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'coupon.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/coupons/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.get_overview': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/overview';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.list_users': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/users';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.get_user': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.update_user': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.delete_user': {
    methods: ['DELETE'];
    pattern: '/api/v1/admin/users/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.list_orders': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/orders';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.list_pending_products': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/products/pending';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.approve_product': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/products/:id/approve';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.reject_product': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/products/:id/reject';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.list_pending_reviews': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/reviews/pending';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.approve_review': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/reviews/:id/approve';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.reject_review': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/reviews/:id/reject';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.list_pending_blog_posts': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/admin/blog/pending';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.publish_blog_post': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/blog/:id/publish';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'admin.unpublish_blog_post': {
    methods: ['PATCH'];
    pattern: '/api/v1/admin/blog/:id/unpublish';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'health.check': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/health';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'health.ready': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/health/ready';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'health.live': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/health/live';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'audit.get_audit_logs': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/log';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'audit.get_audit_log': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/log/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.get_sales_stats': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/sales/stats';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.get_orders_overview': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/orders/overview';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.get_recoverable_carts': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/abandoned-carts/recoverable';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.run_abandoned_cart_sweep': {
    methods: ['POST'];
    pattern: '/api/v1/abandoned-carts/sweep';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.record_view': {
    methods: ['POST'];
    pattern: '/api/v1/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.get_recently_viewed': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'analytics.clear_history': {
    methods: ['DELETE'];
    pattern: '/api/v1/viewed';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'hero.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/hero';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'hero.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/hero/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'hero.create': {
    methods: ['POST'];
    pattern: '/api/v1/hero';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'hero.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/hero/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'hero.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/hero/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'new_arrival.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/new-arrivals';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'new_arrival.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/new-arrivals/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'new_arrival.create': {
    methods: ['POST'];
    pattern: '/api/v1/new-arrivals';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'new_arrival.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/new-arrivals/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'new_arrival.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/new-arrivals/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.redeem': {
    methods: ['POST'];
    pattern: '/api/v1/gift-cards/redeem';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.balance': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/gift-cards/balance';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.find_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/gift-cards';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.find_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/gift-cards/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.create': {
    methods: ['POST'];
    pattern: '/api/v1/gift-cards';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/gift-cards/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'gift_card.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/gift-cards/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.get_user_notifications': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/notifications';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.get_unread_count': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/notifications/unread-count';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.mark_notification_as_read': {
    methods: ['PATCH'];
    pattern: '/api/v1/notifications/:id/read';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.mark_all_notifications_as_read': {
    methods: ['PATCH'];
    pattern: '/api/v1/notifications/read-all';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.get_user_preferences': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/notifications/preferences';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.update_notification_preference': {
    methods: ['PATCH'];
    pattern: '/api/v1/notifications/preferences';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.find_admin_notifications': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/notifications/admin';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'notification.get_health': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/notifications/admin/health';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'email_template.get_all': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/email-templates';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'email_template.get_one': {
    methods: ['GET', 'HEAD'];
    pattern: '/api/v1/email-templates/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'email_template.create': {
    methods: ['POST'];
    pattern: '/api/v1/email-templates';
    types: {
      body: {};
      paramsTuple: [];
      params: {};
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'email_template.update': {
    methods: ['PATCH'];
    pattern: '/api/v1/email-templates/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
  'email_template.remove': {
    methods: ['DELETE'];
    pattern: '/api/v1/email-templates/:id';
    types: {
      body: {};
      paramsTuple: [ParamValue];
      params: { id: ParamValue };
      query: {};
      response: unknown;
      errorResponse: unknown;
    };
  };
}
