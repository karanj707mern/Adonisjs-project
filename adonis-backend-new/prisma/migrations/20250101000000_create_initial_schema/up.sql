-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY');

CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TYPE "NotificationType" AS ENUM (
  'EMAIL_VERIFICATION',
  'PASSWORD_RESET',
  'LOGIN_ALERT',
  'ORDER_PLACED',
  'PAYMENT_CONFIRMED',
  'ORDER_STATUS_UPDATED',
  'ORDER_CANCELLED',
  'WELCOME',
  'EMAIL_VERIFIED',
  'PROFILE_UPDATED',
  'ADDRESS_ADDED',
  'ADDRESS_UPDATED',
  'ADDRESS_DELETED',
  'REVIEW_POSTED',
  'COMMENT_POSTED',
  'BLOG_POSTED',
  'BLOG_UPDATED',
  'BLOG_DELETED',
  'SUPPORT_ISSUE_CREATED',
  'SUPPORT_ISSUE_UPDATED',
  'NEW_USER_REGISTERED',
  'LOW_STOCK'
);

CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "is_email_verified" BOOLEAN DEFAULT false,
  "role" "Role" DEFAULT 'USER',
  "auth_provider" "AuthProvider" DEFAULT 'LOCAL',
  "google_id" TEXT UNIQUE,
  "phone_number" TEXT,
  "avatar" TEXT,
  "refresh_token" TEXT UNIQUE,
  "refresh_token_expires_at" TIMESTAMP,
  "address_line1" TEXT,
  "address_line2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postal_code" TEXT,
  "country" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "address_line1" TEXT NOT NULL,
  "address_line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "is_default" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "stock" INTEGER NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "sku" TEXT NOT NULL UNIQUE,
  "compare_at_price" DOUBLE PRECISION,
  "brand" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "seo_title" TEXT,
  "seo_description" TEXT,
  "weight_grams" INTEGER,
  "is_active" BOOLEAN DEFAULT true,
  "is_new_arrival" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL,
  "guest_cart_token" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now(),
  UNIQUE("user_id", "product_id"),
  UNIQUE("guest_cart_token", "product_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cart_items_user_id_idx" ON "cart_items"("user_id");
CREATE INDEX IF NOT EXISTS "cart_items_guest_cart_token_idx" ON "cart_items"("guest_cart_token");

-- CreateTable
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "total" DOUBLE PRECISION NOT NULL,
  "status" "OrderStatus" DEFAULT 'PENDING',
  "subtotal" DOUBLE PRECISION NOT NULL,
  "shipping_amount" DOUBLE PRECISION NOT NULL,
  "tax_amount" DOUBLE PRECISION NOT NULL,
  "handling_amount" DOUBLE PRECISION,
  "cod_amount" DOUBLE PRECISION,
  "shipping_type" TEXT NOT NULL,
  "payment_method" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "address_line1" TEXT NOT NULL,
  "address_line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "courier_name" TEXT,
  "tracking_number" TEXT,
  "delivered_at" TIMESTAMP,
  "estimated_delivery_at" TIMESTAMP,
  "out_for_delivery_at" TIMESTAMP,
  "paid_at" TIMESTAMP,
  "shipped_at" TIMESTAMP,
  "razorpay_order_id" TEXT UNIQUE,
  "razorpay_payment_id" TEXT UNIQUE,
  "coupon_code" TEXT,
  "refund" JSONB,
  "admin_notes" TEXT,
  "expires_at" TIMESTAMP,
  "inventory_reserved" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_activities" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "guest_wishlist_token" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  UNIQUE("user_id", "product_id"),
  UNIQUE("guest_wishlist_token", "product_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wishlists_user_id_idx" ON "wishlists"("user_id");
CREATE INDEX IF NOT EXISTS "wishlists_guest_wishlist_token_idx" ON "wishlists"("guest_wishlist_token");

-- CreateTable
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "order_id" INTEGER REFERENCES "orders"("id"),
  "rating" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" "ReviewStatus" DEFAULT 'PENDING',
  "admin_note" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now(),
  UNIQUE("user_id", "product_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_product_id_idx" ON "reviews"("product_id");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_comments" (
  "id" SERIAL PRIMARY KEY,
  "review_id" INTEGER NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "cover_image" TEXT,
  "published" BOOLEAN DEFAULT false,
  "published_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token" TEXT NOT NULL UNIQUE,
  "user_agent" TEXT,
  "ip" TEXT,
  "country" TEXT,
  "city" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now(),
  "last_used_at" TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "hero_images" (
  "id" SERIAL PRIMARY KEY,
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "new_arrival" (
  "id" SERIAL PRIMARY KEY,
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "active" BOOLEAN DEFAULT true,
  "coming_soon" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupons" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "discount_type" "CouponDiscountType" NOT NULL,
  "discount_value" DOUBLE PRECISION NOT NULL,
  "min_order_value" DOUBLE PRECISION,
  "max_discount" DOUBLE PRECISION,
  "usage_limit" INTEGER,
  "used_count" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "valid_from" TIMESTAMP NOT NULL,
  "valid_until" TIMESTAMP NOT NULL,
  "per_user_limit" INTEGER,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" SERIAL PRIMARY KEY,
  "coupon_id" INTEGER NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL,
  "order_id" INTEGER NOT NULL,
  "used_at" TIMESTAMP NOT NULL,
  UNIQUE("coupon_id", "user_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "shipping_charge" DOUBLE PRECISION NOT NULL,
  "tax_rate" DOUBLE PRECISION NOT NULL,
  "free_shipping_threshold" DOUBLE PRECISION NOT NULL,
  "cod_charge" DOUBLE PRECISION,
  "express_shipping_charge" DOUBLE PRECISION,
  "handling_charge" DOUBLE PRECISION,
  "same_day_shipping_charge" DOUBLE PRECISION,
  "shipping_options" JSONB,
  "shipping_zones" JSONB,
  "cod_enabled" BOOLEAN DEFAULT true,
  "max_cod_order_value" DOUBLE PRECISION,
  "allow_international_cod" BOOLEAN DEFAULT false,
  "auto_cancel_pending_minutes" INTEGER DEFAULT 30,
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "order_id" INTEGER REFERENCES "orders"("id"),
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "payload" JSONB,
  "status" "NotificationStatus" DEFAULT 'PENDING',
  "attempts" INTEGER DEFAULT 0,
  "max_attempts" INTEGER DEFAULT 3,
  "last_error" TEXT,
  "provider_message_id" TEXT,
  "scheduled_at" TIMESTAMP,
  "sent_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now()
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_order_id_idx" ON "notifications"("order_id");
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications"("status");

-- CreateTable
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "enabled" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now(),
  UNIQUE("user_id", "type", "channel")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "subject" TEXT NOT NULL,
  "html_body" TEXT NOT NULL,
  "text_body" TEXT,
  "variables" JSONB,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" INTEGER,
  "old_value" JSONB,
  "new_value" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP DEFAULT now()
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admin_audit_logs_user_id_idx" ON "admin_audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_entity_type_idx" ON "admin_audit_logs"("entity_type");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

-- CreateTable
CREATE TABLE IF NOT EXISTS "recently_viewed" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "viewed_at" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recently_viewed_user_id_idx" ON "recently_viewed"("user_id");
CREATE INDEX IF NOT EXISTS "recently_viewed_product_id_idx" ON "recently_viewed"("product_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "abandoned_cart" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "guest_token" TEXT,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL,
  "recovered" BOOLEAN DEFAULT false,
  "recovered_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now(),
  "expires_at" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "abandoned_cart_user_id_idx" ON "abandoned_cart"("user_id");
CREATE INDEX IF NOT EXISTS "abandoned_cart_guest_token_idx" ON "abandoned_cart"("guest_token");
CREATE INDEX IF NOT EXISTS "abandoned_cart_expires_at_idx" ON "abandoned_cart"("expires_at");

-- CreateTable
CREATE TABLE IF NOT EXISTS "gift_cards" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(32) NOT NULL UNIQUE,
  "initial_amount" DOUBLE PRECISION NOT NULL,
  "remaining_amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'INR',
  "is_active" BOOLEAN DEFAULT true,
  "redeemed_by" INTEGER,
  "redeemed_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now(),
  "last_used_at" TIMESTAMP
);
