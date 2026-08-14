import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.generate_captcha': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.google_auth': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.resend_verification': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.session': { paramsTuple?: []; params?: {} }
    'auth.refresh': { paramsTuple?: []; params?: {} }
    'auth.get_profile': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.upload_avatar': { paramsTuple?: []; params?: {} }
    'auth.list_sessions': { paramsTuple?: []; params?: {} }
    'auth.revoke_session': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.list_addresses': { paramsTuple?: []; params?: {} }
    'auth.create_address': { paramsTuple?: []; params?: {} }
    'auth.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.remove_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user.create': { paramsTuple?: []; params?: {} }
    'user.find_all': { paramsTuple?: []; params?: {} }
    'user.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.upload_image': { paramsTuple?: []; params?: {} }
    'product.create_product': { paramsTuple?: []; params?: {} }
    'product.get_products': { paramsTuple?: []; params?: {} }
    'product.get_admin_products': { paramsTuple?: []; params?: {} }
    'product.get_new_arrivals': { paramsTuple?: []; params?: {} }
    'product.get_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.update_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.delete_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.record_view': { paramsTuple?: []; params?: {} }
    'product.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'product.clear_history': { paramsTuple?: []; params?: {} }
    'cart.create': { paramsTuple?: []; params?: {} }
    'cart.find_all': { paramsTuple?: []; params?: {} }
    'cart.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.clear': { paramsTuple?: []; params?: {} }
    'cart.create_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.get_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.get_guest_cart_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'cart.merge_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.delete_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.delete_guest_cart_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'order.handle_razorpay_webhook': { paramsTuple?: []; params?: {} }
    'order.verify_payment': { paramsTuple?: []; params?: {} }
    'order.create_checkout_session': { paramsTuple?: []; params?: {} }
    'order.preview': { paramsTuple?: []; params?: {} }
    'order.create': { paramsTuple?: []; params?: {} }
    'order.find_my_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_orders': { paramsTuple?: []; params?: {} }
    'order.find_open_orders': { paramsTuple?: []; params?: {} }
    'order.find_cancelled_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_issues': { paramsTuple?: []; params?: {} }
    'order.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.get_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.create_issue': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.update_issue': { paramsTuple: [ParamValue]; params: {'issueId': ParamValue} }
    'order.refund_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.track': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.get_store_settings': { paramsTuple?: []; params?: {} }
    'settings.update_store_settings': { paramsTuple?: []; params?: {} }
    'review.get_featured_reviews': { paramsTuple?: []; params?: {} }
    'review.get_product_reviews': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.get_review_eligibility': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.create_review': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.create_comment': { paramsTuple: [ParamValue]; params: {'reviewId': ParamValue} }
    'review.moderate_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'review.get_pending_reviews': { paramsTuple?: []; params?: {} }
    'blog.upload_image': { paramsTuple?: []; params?: {} }
    'blog.create_post': { paramsTuple?: []; params?: {} }
    'blog.get_published_posts': { paramsTuple?: []; params?: {} }
    'blog.get_all_posts': { paramsTuple?: []; params?: {} }
    'blog.get_post_by_slug': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'blog.update_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog.delete_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'wishlist.find_all': { paramsTuple?: []; params?: {} }
    'wishlist.create_guest_wishlist': { paramsTuple?: []; params?: {} }
    'wishlist.add': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'wishlist.remove': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'wishlist.get_guest_wishlist': { paramsTuple?: [ParamValue?]; params?: {'token'?: ParamValue} }
    'wishlist.delete_guest_wishlist': { paramsTuple?: [ParamValue?]; params?: {'token'?: ParamValue} }
    'wishlist.merge_guest_wishlist': { paramsTuple?: []; params?: {} }
    'coupon.validate': { paramsTuple?: []; params?: {} }
    'coupon.find_all': { paramsTuple?: []; params?: {} }
    'coupon.get_analytics': { paramsTuple?: []; params?: {} }
    'coupon.create': { paramsTuple?: []; params?: {} }
    'coupon.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coupon.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.get_overview': { paramsTuple?: []; params?: {} }
    'admin.list_users': { paramsTuple?: []; params?: {} }
    'admin.get_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.list_orders': { paramsTuple?: []; params?: {} }
    'admin.list_pending_products': { paramsTuple?: []; params?: {} }
    'admin.approve_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.reject_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.list_pending_reviews': { paramsTuple?: []; params?: {} }
    'admin.approve_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.reject_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.list_pending_blog_posts': { paramsTuple?: []; params?: {} }
    'admin.publish_blog_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.unpublish_blog_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'health.check': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'health.live': { paramsTuple?: []; params?: {} }
    'audit.get_audit_logs': { paramsTuple?: []; params?: {} }
    'audit.get_audit_log': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.get_sales_stats': { paramsTuple?: []; params?: {} }
    'analytics.get_orders_overview': { paramsTuple?: []; params?: {} }
    'analytics.get_recoverable_carts': { paramsTuple?: []; params?: {} }
    'analytics.run_abandoned_cart_sweep': { paramsTuple?: []; params?: {} }
    'analytics.record_view': { paramsTuple?: []; params?: {} }
    'analytics.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'analytics.clear_history': { paramsTuple?: []; params?: {} }
    'hero.find_all': { paramsTuple?: []; params?: {} }
    'hero.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'hero.create': { paramsTuple?: []; params?: {} }
    'hero.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'hero.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.find_all': { paramsTuple?: []; params?: {} }
    'new_arrival.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.create': { paramsTuple?: []; params?: {} }
    'new_arrival.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.redeem': { paramsTuple?: []; params?: {} }
    'gift_card.balance': { paramsTuple?: []; params?: {} }
    'gift_card.find_all': { paramsTuple?: []; params?: {} }
    'gift_card.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.create': { paramsTuple?: []; params?: {} }
    'gift_card.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.get_user_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_unread_count': { paramsTuple?: []; params?: {} }
    'notification.mark_notification_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.mark_all_notifications_as_read': { paramsTuple?: []; params?: {} }
    'notification.get_user_preferences': { paramsTuple?: []; params?: {} }
    'notification.update_notification_preference': { paramsTuple?: []; params?: {} }
    'notification.find_admin_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_health': { paramsTuple?: []; params?: {} }
    'email_template.get_all': { paramsTuple?: []; params?: {} }
    'email_template.get_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_template.create': { paramsTuple?: []; params?: {} }
    'email_template.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_template.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.generate_captcha': { paramsTuple?: []; params?: {} }
    'auth.session': { paramsTuple?: []; params?: {} }
    'auth.get_profile': { paramsTuple?: []; params?: {} }
    'auth.list_sessions': { paramsTuple?: []; params?: {} }
    'auth.list_addresses': { paramsTuple?: []; params?: {} }
    'user.find_all': { paramsTuple?: []; params?: {} }
    'user.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.get_products': { paramsTuple?: []; params?: {} }
    'product.get_admin_products': { paramsTuple?: []; params?: {} }
    'product.get_new_arrivals': { paramsTuple?: []; params?: {} }
    'product.get_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'cart.find_all': { paramsTuple?: []; params?: {} }
    'cart.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.get_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.get_guest_cart_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'order.find_my_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_orders': { paramsTuple?: []; params?: {} }
    'order.find_open_orders': { paramsTuple?: []; params?: {} }
    'order.find_cancelled_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_issues': { paramsTuple?: []; params?: {} }
    'order.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.get_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.track': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.get_store_settings': { paramsTuple?: []; params?: {} }
    'review.get_featured_reviews': { paramsTuple?: []; params?: {} }
    'review.get_product_reviews': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.get_review_eligibility': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.get_pending_reviews': { paramsTuple?: []; params?: {} }
    'blog.get_published_posts': { paramsTuple?: []; params?: {} }
    'blog.get_all_posts': { paramsTuple?: []; params?: {} }
    'blog.get_post_by_slug': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'wishlist.find_all': { paramsTuple?: []; params?: {} }
    'wishlist.get_guest_wishlist': { paramsTuple?: [ParamValue?]; params?: {'token'?: ParamValue} }
    'coupon.find_all': { paramsTuple?: []; params?: {} }
    'coupon.get_analytics': { paramsTuple?: []; params?: {} }
    'admin.get_overview': { paramsTuple?: []; params?: {} }
    'admin.list_users': { paramsTuple?: []; params?: {} }
    'admin.get_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.list_orders': { paramsTuple?: []; params?: {} }
    'admin.list_pending_products': { paramsTuple?: []; params?: {} }
    'admin.list_pending_reviews': { paramsTuple?: []; params?: {} }
    'admin.list_pending_blog_posts': { paramsTuple?: []; params?: {} }
    'health.check': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'health.live': { paramsTuple?: []; params?: {} }
    'audit.get_audit_logs': { paramsTuple?: []; params?: {} }
    'audit.get_audit_log': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.get_sales_stats': { paramsTuple?: []; params?: {} }
    'analytics.get_orders_overview': { paramsTuple?: []; params?: {} }
    'analytics.get_recoverable_carts': { paramsTuple?: []; params?: {} }
    'analytics.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'hero.find_all': { paramsTuple?: []; params?: {} }
    'hero.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.find_all': { paramsTuple?: []; params?: {} }
    'new_arrival.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.balance': { paramsTuple?: []; params?: {} }
    'gift_card.find_all': { paramsTuple?: []; params?: {} }
    'gift_card.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.get_user_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_unread_count': { paramsTuple?: []; params?: {} }
    'notification.get_user_preferences': { paramsTuple?: []; params?: {} }
    'notification.find_admin_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_health': { paramsTuple?: []; params?: {} }
    'email_template.get_all': { paramsTuple?: []; params?: {} }
    'email_template.get_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'auth.generate_captcha': { paramsTuple?: []; params?: {} }
    'auth.session': { paramsTuple?: []; params?: {} }
    'auth.get_profile': { paramsTuple?: []; params?: {} }
    'auth.list_sessions': { paramsTuple?: []; params?: {} }
    'auth.list_addresses': { paramsTuple?: []; params?: {} }
    'user.find_all': { paramsTuple?: []; params?: {} }
    'user.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.get_products': { paramsTuple?: []; params?: {} }
    'product.get_admin_products': { paramsTuple?: []; params?: {} }
    'product.get_new_arrivals': { paramsTuple?: []; params?: {} }
    'product.get_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'cart.find_all': { paramsTuple?: []; params?: {} }
    'cart.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.get_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.get_guest_cart_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'order.find_my_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_orders': { paramsTuple?: []; params?: {} }
    'order.find_open_orders': { paramsTuple?: []; params?: {} }
    'order.find_cancelled_orders': { paramsTuple?: []; params?: {} }
    'order.find_admin_issues': { paramsTuple?: []; params?: {} }
    'order.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.get_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.track': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'settings.get_store_settings': { paramsTuple?: []; params?: {} }
    'review.get_featured_reviews': { paramsTuple?: []; params?: {} }
    'review.get_product_reviews': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.get_review_eligibility': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.get_pending_reviews': { paramsTuple?: []; params?: {} }
    'blog.get_published_posts': { paramsTuple?: []; params?: {} }
    'blog.get_all_posts': { paramsTuple?: []; params?: {} }
    'blog.get_post_by_slug': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'wishlist.find_all': { paramsTuple?: []; params?: {} }
    'wishlist.get_guest_wishlist': { paramsTuple?: [ParamValue?]; params?: {'token'?: ParamValue} }
    'coupon.find_all': { paramsTuple?: []; params?: {} }
    'coupon.get_analytics': { paramsTuple?: []; params?: {} }
    'admin.get_overview': { paramsTuple?: []; params?: {} }
    'admin.list_users': { paramsTuple?: []; params?: {} }
    'admin.get_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.list_orders': { paramsTuple?: []; params?: {} }
    'admin.list_pending_products': { paramsTuple?: []; params?: {} }
    'admin.list_pending_reviews': { paramsTuple?: []; params?: {} }
    'admin.list_pending_blog_posts': { paramsTuple?: []; params?: {} }
    'health.check': { paramsTuple?: []; params?: {} }
    'health.ready': { paramsTuple?: []; params?: {} }
    'health.live': { paramsTuple?: []; params?: {} }
    'audit.get_audit_logs': { paramsTuple?: []; params?: {} }
    'audit.get_audit_log': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.get_sales_stats': { paramsTuple?: []; params?: {} }
    'analytics.get_orders_overview': { paramsTuple?: []; params?: {} }
    'analytics.get_recoverable_carts': { paramsTuple?: []; params?: {} }
    'analytics.get_recently_viewed': { paramsTuple?: []; params?: {} }
    'hero.find_all': { paramsTuple?: []; params?: {} }
    'hero.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.find_all': { paramsTuple?: []; params?: {} }
    'new_arrival.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.balance': { paramsTuple?: []; params?: {} }
    'gift_card.find_all': { paramsTuple?: []; params?: {} }
    'gift_card.find_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.get_user_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_unread_count': { paramsTuple?: []; params?: {} }
    'notification.get_user_preferences': { paramsTuple?: []; params?: {} }
    'notification.find_admin_notifications': { paramsTuple?: []; params?: {} }
    'notification.get_health': { paramsTuple?: []; params?: {} }
    'email_template.get_all': { paramsTuple?: []; params?: {} }
    'email_template.get_one': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.google_auth': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.resend_verification': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.refresh': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.upload_avatar': { paramsTuple?: []; params?: {} }
    'auth.create_address': { paramsTuple?: []; params?: {} }
    'user.create': { paramsTuple?: []; params?: {} }
    'product.upload_image': { paramsTuple?: []; params?: {} }
    'product.create_product': { paramsTuple?: []; params?: {} }
    'product.record_view': { paramsTuple?: []; params?: {} }
    'cart.create': { paramsTuple?: []; params?: {} }
    'cart.create_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.merge_guest_cart': { paramsTuple?: []; params?: {} }
    'order.handle_razorpay_webhook': { paramsTuple?: []; params?: {} }
    'order.verify_payment': { paramsTuple?: []; params?: {} }
    'order.create_checkout_session': { paramsTuple?: []; params?: {} }
    'order.preview': { paramsTuple?: []; params?: {} }
    'order.create': { paramsTuple?: []; params?: {} }
    'order.create_issue': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.refund_order': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'review.create_review': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'review.create_comment': { paramsTuple: [ParamValue]; params: {'reviewId': ParamValue} }
    'blog.upload_image': { paramsTuple?: []; params?: {} }
    'blog.create_post': { paramsTuple?: []; params?: {} }
    'wishlist.create_guest_wishlist': { paramsTuple?: []; params?: {} }
    'wishlist.add': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'wishlist.merge_guest_wishlist': { paramsTuple?: []; params?: {} }
    'coupon.validate': { paramsTuple?: []; params?: {} }
    'coupon.create': { paramsTuple?: []; params?: {} }
    'analytics.run_abandoned_cart_sweep': { paramsTuple?: []; params?: {} }
    'analytics.record_view': { paramsTuple?: []; params?: {} }
    'hero.create': { paramsTuple?: []; params?: {} }
    'new_arrival.create': { paramsTuple?: []; params?: {} }
    'gift_card.redeem': { paramsTuple?: []; params?: {} }
    'gift_card.create': { paramsTuple?: []; params?: {} }
    'email_template.create': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'auth.update_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.update_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'order.update_issue': { paramsTuple: [ParamValue]; params: {'issueId': ParamValue} }
    'settings.update_store_settings': { paramsTuple?: []; params?: {} }
    'review.moderate_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog.update_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'coupon.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.update_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.approve_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.reject_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.approve_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.reject_review': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.publish_blog_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.unpublish_blog_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'hero.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.mark_notification_as_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notification.mark_all_notifications_as_read': { paramsTuple?: []; params?: {} }
    'notification.update_notification_preference': { paramsTuple?: []; params?: {} }
    'email_template.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'auth.delete_account': { paramsTuple?: []; params?: {} }
    'auth.revoke_session': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.remove_address': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.delete_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'product.clear_history': { paramsTuple?: []; params?: {} }
    'cart.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cart.clear': { paramsTuple?: []; params?: {} }
    'cart.delete_guest_cart': { paramsTuple?: []; params?: {} }
    'cart.delete_guest_cart_by_token': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'order.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog.delete_post': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'wishlist.remove': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'wishlist.delete_guest_wishlist': { paramsTuple?: [ParamValue?]; params?: {'token'?: ParamValue} }
    'coupon.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.delete_user': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.clear_history': { paramsTuple?: []; params?: {} }
    'hero.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'new_arrival.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'gift_card.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'email_template.remove': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}