-- Drop all tables in reverse order
DROP TABLE IF EXISTS gift_cards;
DROP TABLE IF EXISTS abandoned_cart;
DROP TABLE IF EXISTS recently_viewed;
DROP TABLE IF EXISTS admin_audit_logs;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS store_settings;
DROP TABLE IF EXISTS coupon_usages;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS new_arrival;
DROP TABLE IF EXISTS hero_images;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS review_comments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS order_activities;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;

-- Drop enums
DROP TYPE IF EXISTS "ReviewStatus";
DROP TYPE IF EXISTS "NotificationType";
DROP TYPE IF EXISTS "NotificationStatus";
DROP TYPE IF EXISTS "NotificationChannel";
DROP TYPE IF EXISTS "CouponDiscountType";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "AuthProvider";
DROP TYPE IF EXISTS "Role";
