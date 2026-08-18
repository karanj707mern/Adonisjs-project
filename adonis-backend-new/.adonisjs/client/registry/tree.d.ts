import type { routes } from './index.ts';

export interface ApiDefinition {
  auth: {
    generateCaptcha: (typeof routes)['auth.generate_captcha'];
    login: (typeof routes)['auth.login'];
    googleAuth: (typeof routes)['auth.google_auth'];
    register: (typeof routes)['auth.register'];
    verifyEmail: (typeof routes)['auth.verify_email'];
    resendVerification: (typeof routes)['auth.resend_verification'];
    forgotPassword: (typeof routes)['auth.forgot_password'];
    resetPassword: (typeof routes)['auth.reset_password'];
    session: (typeof routes)['auth.session'];
    refresh: (typeof routes)['auth.refresh'];
    getProfile: (typeof routes)['auth.get_profile'];
    updateProfile: (typeof routes)['auth.update_profile'];
    changePassword: (typeof routes)['auth.change_password'];
    deleteAccount: (typeof routes)['auth.delete_account'];
    logout: (typeof routes)['auth.logout'];
    uploadAvatar: (typeof routes)['auth.upload_avatar'];
    listSessions: (typeof routes)['auth.list_sessions'];
    revokeSession: (typeof routes)['auth.revoke_session'];
    listAddresses: (typeof routes)['auth.list_addresses'];
    createAddress: (typeof routes)['auth.create_address'];
    updateAddress: (typeof routes)['auth.update_address'];
    removeAddress: (typeof routes)['auth.remove_address'];
  };
  user: {
    create: (typeof routes)['user.create'];
    findAll: (typeof routes)['user.find_all'];
    findOne: (typeof routes)['user.find_one'];
    update: (typeof routes)['user.update'];
    remove: (typeof routes)['user.remove'];
  };
  product: {
    uploadImage: (typeof routes)['product.upload_image'];
    createProduct: (typeof routes)['product.create_product'];
    getProducts: (typeof routes)['product.get_products'];
    getAdminProducts: (typeof routes)['product.get_admin_products'];
    getNewArrivals: (typeof routes)['product.get_new_arrivals'];
    getProduct: (typeof routes)['product.get_product'];
    updateProduct: (typeof routes)['product.update_product'];
    deleteProduct: (typeof routes)['product.delete_product'];
    recordView: (typeof routes)['product.record_view'];
    getRecentlyViewed: (typeof routes)['product.get_recently_viewed'];
    clearHistory: (typeof routes)['product.clear_history'];
  };
  cart: {
    create: (typeof routes)['cart.create'];
    findAll: (typeof routes)['cart.find_all'];
    findOne: (typeof routes)['cart.find_one'];
    update: (typeof routes)['cart.update'];
    remove: (typeof routes)['cart.remove'];
    clear: (typeof routes)['cart.clear'];
    createGuestCart: (typeof routes)['cart.create_guest_cart'];
    getGuestCart: (typeof routes)['cart.get_guest_cart'];
    getGuestCartByToken: (typeof routes)['cart.get_guest_cart_by_token'];
    mergeGuestCart: (typeof routes)['cart.merge_guest_cart'];
    deleteGuestCart: (typeof routes)['cart.delete_guest_cart'];
    deleteGuestCartByToken: (typeof routes)['cart.delete_guest_cart_by_token'];
  };
  order: {
    handleRazorpayWebhook: (typeof routes)['order.handle_razorpay_webhook'];
    verifyPayment: (typeof routes)['order.verify_payment'];
    createCheckoutSession: (typeof routes)['order.create_checkout_session'];
    preview: (typeof routes)['order.preview'];
    create: (typeof routes)['order.create'];
    findMyOrders: (typeof routes)['order.find_my_orders'];
    findAdminOrders: (typeof routes)['order.find_admin_orders'];
    findOpenOrders: (typeof routes)['order.find_open_orders'];
    findCancelledOrders: (typeof routes)['order.find_cancelled_orders'];
    findAdminIssues: (typeof routes)['order.find_admin_issues'];
    findOne: (typeof routes)['order.find_one'];
    getInvoice: (typeof routes)['order.get_invoice'];
    createIssue: (typeof routes)['order.create_issue'];
    update: (typeof routes)['order.update'];
    updateIssue: (typeof routes)['order.update_issue'];
    refundOrder: (typeof routes)['order.refund_order'];
    remove: (typeof routes)['order.remove'];
    track: (typeof routes)['order.track'];
  };
  settings: {
    getStoreSettings: (typeof routes)['settings.get_store_settings'];
    updateStoreSettings: (typeof routes)['settings.update_store_settings'];
  };
  review: {
    getFeaturedReviews: (typeof routes)['review.get_featured_reviews'];
    getProductReviews: (typeof routes)['review.get_product_reviews'];
    getReviewEligibility: (typeof routes)['review.get_review_eligibility'];
    createReview: (typeof routes)['review.create_review'];
    createComment: (typeof routes)['review.create_comment'];
    moderateReview: (typeof routes)['review.moderate_review'];
    getPendingReviews: (typeof routes)['review.get_pending_reviews'];
  };
  blog: {
    uploadImage: (typeof routes)['blog.upload_image'];
    createPost: (typeof routes)['blog.create_post'];
    getPublishedPosts: (typeof routes)['blog.get_published_posts'];
    getAllPosts: (typeof routes)['blog.get_all_posts'];
    getPostBySlug: (typeof routes)['blog.get_post_by_slug'];
    updatePost: (typeof routes)['blog.update_post'];
    deletePost: (typeof routes)['blog.delete_post'];
  };
  wishlist: {
    findAll: (typeof routes)['wishlist.find_all'];
    createGuestWishlist: (typeof routes)['wishlist.create_guest_wishlist'];
    add: (typeof routes)['wishlist.add'];
    remove: (typeof routes)['wishlist.remove'];
    getGuestWishlist: (typeof routes)['wishlist.get_guest_wishlist'];
    deleteGuestWishlist: (typeof routes)['wishlist.delete_guest_wishlist'];
    mergeGuestWishlist: (typeof routes)['wishlist.merge_guest_wishlist'];
  };
  coupon: {
    validate: (typeof routes)['coupon.validate'];
    findAll: (typeof routes)['coupon.find_all'];
    getAnalytics: (typeof routes)['coupon.get_analytics'];
    create: (typeof routes)['coupon.create'];
    update: (typeof routes)['coupon.update'];
    remove: (typeof routes)['coupon.remove'];
  };
  admin: {
    getOverview: (typeof routes)['admin.get_overview'];
    listUsers: (typeof routes)['admin.list_users'];
    getUser: (typeof routes)['admin.get_user'];
    updateUser: (typeof routes)['admin.update_user'];
    deleteUser: (typeof routes)['admin.delete_user'];
    listOrders: (typeof routes)['admin.list_orders'];
    listPendingProducts: (typeof routes)['admin.list_pending_products'];
    approveProduct: (typeof routes)['admin.approve_product'];
    rejectProduct: (typeof routes)['admin.reject_product'];
    listPendingReviews: (typeof routes)['admin.list_pending_reviews'];
    approveReview: (typeof routes)['admin.approve_review'];
    rejectReview: (typeof routes)['admin.reject_review'];
    listPendingBlogPosts: (typeof routes)['admin.list_pending_blog_posts'];
    publishBlogPost: (typeof routes)['admin.publish_blog_post'];
    unpublishBlogPost: (typeof routes)['admin.unpublish_blog_post'];
  };
  health: {
    check: (typeof routes)['health.check'];
    ready: (typeof routes)['health.ready'];
    live: (typeof routes)['health.live'];
  };
  audit: {
    getAuditLogs: (typeof routes)['audit.get_audit_logs'];
    getAuditLog: (typeof routes)['audit.get_audit_log'];
  };
  analytics: {
    getSalesStats: (typeof routes)['analytics.get_sales_stats'];
    getOrdersOverview: (typeof routes)['analytics.get_orders_overview'];
    getRecoverableCarts: (typeof routes)['analytics.get_recoverable_carts'];
    runAbandonedCartSweep: (typeof routes)['analytics.run_abandoned_cart_sweep'];
    recordView: (typeof routes)['analytics.record_view'];
    getRecentlyViewed: (typeof routes)['analytics.get_recently_viewed'];
    clearHistory: (typeof routes)['analytics.clear_history'];
  };
  hero: {
    findAll: (typeof routes)['hero.find_all'];
    findOne: (typeof routes)['hero.find_one'];
    create: (typeof routes)['hero.create'];
    update: (typeof routes)['hero.update'];
    remove: (typeof routes)['hero.remove'];
  };
  newArrival: {
    findAll: (typeof routes)['new_arrival.find_all'];
    findOne: (typeof routes)['new_arrival.find_one'];
    create: (typeof routes)['new_arrival.create'];
    update: (typeof routes)['new_arrival.update'];
    remove: (typeof routes)['new_arrival.remove'];
  };
  giftCard: {
    redeem: (typeof routes)['gift_card.redeem'];
    balance: (typeof routes)['gift_card.balance'];
    findAll: (typeof routes)['gift_card.find_all'];
    findOne: (typeof routes)['gift_card.find_one'];
    create: (typeof routes)['gift_card.create'];
    update: (typeof routes)['gift_card.update'];
    remove: (typeof routes)['gift_card.remove'];
  };
  notification: {
    getUserNotifications: (typeof routes)['notification.get_user_notifications'];
    getUnreadCount: (typeof routes)['notification.get_unread_count'];
    markNotificationAsRead: (typeof routes)['notification.mark_notification_as_read'];
    markAllNotificationsAsRead: (typeof routes)['notification.mark_all_notifications_as_read'];
    getUserPreferences: (typeof routes)['notification.get_user_preferences'];
    updateNotificationPreference: (typeof routes)['notification.update_notification_preference'];
    findAdminNotifications: (typeof routes)['notification.find_admin_notifications'];
    getHealth: (typeof routes)['notification.get_health'];
  };
  emailTemplate: {
    getAll: (typeof routes)['email_template.get_all'];
    getOne: (typeof routes)['email_template.get_one'];
    create: (typeof routes)['email_template.create'];
    update: (typeof routes)['email_template.update'];
    remove: (typeof routes)['email_template.remove'];
  };
}
