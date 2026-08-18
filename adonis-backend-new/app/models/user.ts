import {
  BaseModel,
  column,
  beforeSave,
  belongsTo,
  hasMany,
} from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';
import hash from '@adonisjs/core/services/hash';
import { compose } from '@adonisjs/core/helpers';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import {
  type AccessToken,
  DbAccessTokensProvider,
} from '@adonisjs/auth/access_tokens';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

export enum NotificationType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN_ALERT = 'LOGIN_ALERT',
  ORDER_PLACED = 'ORDER_PLACED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  WELCOME = 'WELCOME',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ADDRESS_ADDED = 'ADDRESS_ADDED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_DELETED = 'ADDRESS_DELETED',
  REVIEW_POSTED = 'REVIEW_POSTED',
  COMMENT_POSTED = 'COMMENT_POSTED',
  BLOG_POSTED = 'BLOG_POSTED',
  BLOG_UPDATED = 'BLOG_UPDATED',
  BLOG_DELETED = 'BLOG_DELETED',
  SUPPORT_ISSUE_CREATED = 'SUPPORT_ISSUE_CREATED',
  SUPPORT_ISSUE_UPDATED = 'SUPPORT_ISSUE_UPDATED',
  NEW_USER_REGISTERED = 'NEW_USER_REGISTERED',
  LOW_STOCK = 'LOW_STOCK',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum ShippingType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'sameDay',
  PRIME = 'prime',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
}

export default class User extends compose(BaseModel, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User);
  declare currentAccessToken?: AccessToken;

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column({ unique: true })
  declare email: string;

  @column({ serializeAs: null })
  declare password: string;

  @column()
  declare isEmailVerified: boolean;

  @column()
  declare emailVerifyToken: string | null;

  @column.dateTime()
  declare createdAt: DateTime;

  @column()
  declare role: Role;

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare passwordResetToken: string | null;

  @column.dateTime()
  declare passwordResetTokenExpiresAt: DateTime | null;

  @column()
  declare addressLine1: string | null;

  @column()
  declare addressLine2: string | null;

  @column()
  declare city: string | null;

  @column()
  declare country: string | null;

  @column()
  declare phoneNumber: string | null;

  @column()
  declare postalCode: string | null;

  @column()
  declare state: string | null;

  @column.dateTime()
  declare passwordResetLastRequestedAt: DateTime | null;

  @column()
  declare authProvider: AuthProvider;

  @column({ unique: true })
  declare googleId: string | null;

  @column.dateTime()
  declare emailVerifyTokenExpiresAt: DateTime | null;

  @column.dateTime()
  declare emailVerifyLastSentAt: DateTime | null;

  @column()
  declare refreshToken: string | null;

  @column.dateTime()
  declare refreshTokenExpiresAt: DateTime | null;

  @column()
  declare avatar: string | null;

  @hasMany(() => AdminAuditLog)
  declare auditLogs: any[];

  @hasMany(() => Notification)
  declare notifications: any[];

  @hasMany(() => NotificationPreference)
  declare notificationPreferences: any[];

  @hasMany(() => Order)
  declare orders: any[];

  @hasMany(() => Review)
  declare reviews: any[];

  @hasMany(() => ReviewComment)
  declare reviewComments: any[];

  @hasMany(() => Session)
  declare sessions: any[];

  @hasMany(() => UserAddress)
  declare addresses: any[];

  @hasMany(() => Wishlist)
  declare wishlistItems: any[];

  @hasMany(() => CartItem)
  declare cartItems: any[];

  @hasMany(() => RecentlyViewed)
  declare recentlyViewed: any[];

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password);
    }
  }

  get initials() {
    const [first, last] = this.fullName
      ? this.fullName.split(' ')
      : this.email.split('@');
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    return `${first.slice(0, 2)}`.toUpperCase();
  }
}
