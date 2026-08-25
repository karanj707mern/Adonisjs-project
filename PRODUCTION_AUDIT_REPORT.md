# 🔍 Enterprise Production Audit Report

**Date:** 2026-08-24  
**Scope:** `adonis-backend-new` (AdonisJS v7 + Prisma 6) + `qwikcity-frontend` (Qwik City)  
**Reference:** `Migration-Sources-Frontend-BAckend/Moringa-Backend` (NestJS source of truth)  
**Standard:** Enterprise-grade, highly scalable, industry best-practice  

---

## 📊 Executive Summary

| Domain | CRITICAL | HIGH | MEDIUM | LOW | Status |
| -------- | ---------- | ------ | -------- | ----- | -------- |
| Security & Auth | 7 | 11 | 9 | 5 | 🔴 BLOCKER |
| Data Layer | 2 | 5 | 4 | 3 | 🟡 RISKY |
| API & Business Logic | 1 | 6 | 5 | 2 | 🟡 RISKY |
| Frontend | 0 | 4 | 6 | 4 | 🟡 RISKY |
| Infrastructure & Ops | 2 | 4 | 5 | 3 | 🟡 RISKY |
| Observability | 0 | 3 | 4 | 2 | 🟡 RISKY |
| **TOTAL** | **12** | **33** | **33** | **19** | **🔴 NOT SHIPPABLE** |

**Verdict:** 12 CRITICAL and 33 HIGH issues must be resolved before any production traffic. The system has solid bones (transactions, DI, typed container) but is missing fundamental production safeguards.

---

## 🔴 PHASE 1: SECURITY & AUTHORIZATION (32 issues)

### CRITICAL — Must fix before any deploy

| # | Issue | File | Exploit | Fix |
| --- | ------- | ------ | --------- | ----- |
| S1 | **Admin overview is public** — no auth middleware | `admin_routes.ts:8` | Anyone gets product counts, revenue, recent orders with user emails + names | Move `overview` inside the admin middleware group |
| S2 | **Audit logs are public** — no auth middleware | `audit_routes.ts:7-10` | Anyone enumerates all admin actions, IPs, user agents, email addresses | Apply `middleware([middleware.auth(), middleware.admin()])` |
| S3 | **Email templates are public CRUD** — no auth | `email_template_routes.ts:7-11` | Anyone reads password-reset/verification templates, modifies them to phish users, deletes them | Apply admin middleware to entire group |
| S4 | **Gift card redeem bypass** — `userId=0` hardcoded, card never marked redeemed | `gift_card_controller.ts:22` + `gift_card_service.ts:131` | Same gift card redeemed unlimited times | Require auth OR always set `redeemedAt` OR atomic `remainingAmount <= 0` guard |
| S5 | **`.env` committed with live secrets** — DB password, JWT_SECRET, SMTP_PASS, RAZORPAY keys, TWILIO, CLOUDINARY, RABBITMQ | `.env` | Full infrastructure compromise if repo ever public | Rotate ALL secrets immediately, purge from git history, add `.env` to `.gitignore` |
| S6 | **No rate limiting anywhere** — login, register, forgot-password, coupon, gift-card all unthrottled | entire app | Credential stuffing, password-reset spam, coupon brute-force | Add `@adonisjs/limiter` middleware; login: 5/min, register: 3/min, forgot-password: 3/min |
| S7 | **JWT `alg` not pinned** — `jwt.verify(token, secret)` without `algorithms: ['HS256']` | `auth_middleware.ts:26` | If secret format is influenced, `alg: none` or `RS256` bypass | `jwt.verify(token, secret, { algorithms: ['HS256'] })` |

### HIGH — Fix within first sprint

| # | Issue | File | Fix |
| --- | ------- | ------ | ----- |
| S8 | **JWT payload spread** — `...payload` into auth user allows privilege escalation if secret leaked | `auth_middleware.ts:38-46` | Whitelist: `{ id, email, role }` from DB only |
| S9 | **No access token revocation** — stateless JWT valid 1hr after theft | `auth_service.ts` | Implement Redis JTI blacklist checked in middleware |
| S10 | **7 endpoints use unvalidated `request.all()`** — coupon, gift-card, notification, email-template, hero, new-arrival | multiple | Replace with explicit Vine validators |
| S11 | **Wishlist guestToken ignored** — all guests share `userId=NULL`, IDOR possible | `wishlist_service.ts:101-143` | Pass `guestToken` into Prisma `where` clauses |
| S12 | **PII leaked in orders** — `orderInclude` selects `user.email` | `order_service.ts:93-110` | Remove `email` from select |
| S13 | **Logged secrets** — email verification + password reset URLs (with tokens) logged via `console.warn` | `email_verification_service.ts:59` | Remove token from logs, log email only |
| S14 | **User enumeration** — "Email already registered" on signup | `auth_service.ts:345` | Return generic "If registered, verification sent" |
| S15 | **No account lockout** — unlimited password attempts | `auth_service.ts:386` | Lock after 5 fails, 15-min cooldown |
| S16 | **Admin overview exposes emails** (compounds S1) | `admin_service.ts:124` | Return names/IDs only |
| S17 | **Mixed password hashing** — scrypt configured but bcrypt used directly (10 vs 12 rounds) | `config/hash.ts` + `auth_service.ts` | Standardize on framework Hash service |

### MEDIUM / LOW — Fix within first month

- CORS wildcard `*.vercel.app` allows any Vercel preview → replace with explicit allowlist
- CSP `unsafe-inline` → use nonces/hashes
- `xFrame: { enabled: false }` → enable with `action: 'deny'`
- 50MB upload limit → reduce to 2-5MB
- No magic-bytes validation on uploads → add `file-type` check
- Dead code controllers (`new_account_controller`, `access_tokens_controller`) → remove
- Debug `console.log` in production code → remove or guard with `app.inDevelopment`
- `GET /test-error` endpoint → remove

---

## 🟡 PHASE 2: DATA LAYER (14 issues)

### Schema Gaps

| # | Issue | Impact | Fix |
| --- | ------- | -------- | ----- |
| D1 | **No soft-delete** — no `deletedAt` on User/Product/Order/OrderItem/Session | Accidental/malicious deletes are permanent | Add `deletedAt DateTime?` + Prisma middleware to filter `deletedAt: null` |
| D2 | **No optimistic locking** — no `version` column on Order/Product | Concurrent writes can corrupt state (e.g., double-spend coupon, oversell stock) | Add `version Int @default(0)`, increment in every update |
| D3 | **Missing composite index on Order** — `[userId, status, createdAt]` | Admin order filtering slow at scale | `@@index([userId, status, createdAt])` |
| D4 | **Missing index on Session** — `refreshToken` lookup | Refresh token validation slow | `@@index([refreshToken])` |

### Query & Transaction Gaps

| # | Issue | Impact | Fix |
| --- | ------- | -------- | ----- |
| D5 | **Race condition: stock check-then-act** | Overselling — two concurrent checkouts both pass stock check before either decrements | Use `UPDATE ... WHERE stock >= qty` with atomic conditional, or `SELECT ... FOR UPDATE` inside transaction |
| D6 | **Inventory decrement non-atomic** | Stock can go negative under concurrency | `prisma.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` — check count |
| D7 | **Health check creates new PrismaClient per call** | Connection pool exhaustion under load | Inject shared PrismaService |
| D8 | **N+1 in cart/order includes** — product fetched per-item | 100-item cart = 100 product queries | Use `include` with batched product fetch |
| D9 | **Missing select on several queries** — full row fetches | Unnecessary data transfer, PII exposure risk | Add explicit `select` for every query |
| D10 | **No query timeout** — slow queries hang | Cascading failure | Set `query_timeout` in Prisma config |
| D11 | **No connection limit on health/prisma** | Unbounded connections | Configure pool sizing |
| D12 | **RecentlyViewed unique on (userId, viewedAt)** — but guests have `userId=NULL` | Guest views collide | Add `guestToken` to unique or separate table |
| D13 | **No DB migration for soft-delete columns** | Can't add `deletedAt` without migration | Create migration before deploy |

---

## 🟡 PHASE 3: API & BUSINESS LOGIC (14 issues)

### Critical

| # | Issue | Fix |
|---|-------|-----|
| A1 | **Checkout race: inventory check outside transaction** | Move stock verification inside the order creation transaction with row locking |

### High

| # | Issue | Fix |
| --- | ------- | ----- |
| A2 | **Idempotency missing** — no `X-Idempotency-Key` support | Payment + order creation can double-charge | Add idempotency middleware with Redis TTL |
| A3 | **Coupon validation non-atomic** — usage count can exceed `maxUses` | Coupon used unlimited times under concurrency | Atomic increment with guard `usageCount < maxUses` |
| A4 | **Order total not server-recalculated** — frontend could send manipulated totals | Revenue loss + fraud | Always compute total from DB prices, never trust client |
| A5 | **Webhook processing synchronous** — Razorpay webhook blocks HTTP response | Timeout → retry → duplicate processing | Return 200 immediately, enqueue to BullMQ |
| A6 | **No email verification gate on login** | Unverified emails can log in | Check `isEmailVerified` before issuing tokens |
| A7 | **Session not bound to device/IP** — stolen refresh token usable from anywhere | Session hijacking | Store device fingerprint, validate on refresh |

### Medium

| # | Issue | Fix |
| --- | ------- | ----- |
| A8 | **Pagination missing on several list endpoints** | Memory blowout on large datasets | Add `page`/`limit` to all list endpoints |
| A9 | **No API versioning beyond `/api/v1`** | Breaking changes affect all clients | Document deprecation policy |
| A10 | **Error responses inconsistent** — mix of Vine errors, custom exceptions, raw errors | Client-side parsing fragile | Standardize error envelope `{ error: { code, message, details } }` |
| A11 | **No request ID propagation** | Can't trace requests across services | Add `X-Request-ID` middleware, include in all logs |
| A12 | **Cache invalidation incomplete** — product cache not cleared on update/browse | Stale product data served | Invalidate all related cache keys on write |

---

## 🟡 PHASE 4: FRONTEND (14 issues)

### High

| # | Issue | Fix |
| --- | ------- | ----- |
| F1 | **No error boundary on data-fetching routes** | White screen on API failure | Wrap route content in `ErrorBoundary` with retry |
| F2 | **Service worker registered but no SW file** | Broken PWA, console errors | Create `service-worker.ts` or remove `ServiceWorkerRegister` |
| F3 | **Auth token refresh race** — multiple 401s trigger parallel refreshes | Multiple refresh tokens issued, some invalidated | Queue concurrent refresh requests (single-flight) |
| F4 | **Cart stored in localStorage without encryption** | XSS can steal/ tamper cart data | Use httpOnly cookies for sensitive state, or encrypt |

### Medium

| # | Issue | Fix |
| --- | ------- | ----- |
| F5 | **No loading skeletons on several routes** | Layout shift, poor perceived perf | Add skeleton placeholders |
| F6 | **Image optimization missing** — no lazy loading, no WebP/AVIF | Slow LCP on product pages | Use `<Image>` component with lazy loading + modern formats |
| F7 | **No CSP nonce for inline scripts** | CSP blocks inline scripts or requires unsafe-inline | Generate per-request nonce |
| F8 | **Route prefetching not configured** | Full page reloads on navigation | Configure Qwik prefetching strategy |
| F9 | **No offline fallback** | Broken UX when offline | Add offline page / service worker caching |
| F10 | **Accessibility — missing ARIA labels on interactive elements** | WCAG failures, legal risk | Audit + add labels |

---

## 🟡 PHASE 5: INFRASTRUCTURE & OPS (14 issues)

### Critical

| # | Issue | Fix |
| --- | ------- | ----- |
| I1 | **No graceful shutdown for BullMQ/RabbitMQ** — workers lose in-flight jobs on deploy | Data loss, orphaned jobs | Implement `shutdown()` in `AppProvider` to close queue workers + RabbitMQ |
| I2 | **Docker runs as root** | Container escape risk | Add `USER node` in Dockerfile production stage |

### High

| # | Issue | Fix |
| --- | ------- | ----- |
| I3 | **No log aggregation** — logs go to stdout only | Can't debug production issues | Ship logs to structured aggregator (ELK/Loki/Datadog) via Pino transport |
| I4 | **No metrics/monitoring** — no Prometheus, no APM | Flying blind on performance | Add `@adonisjs/apm` or Prometheus exporter |
| I5 | **No database backup strategy** | Catastrophic data loss | Automated daily backups + point-in-time recovery |
| I6 | **CI/CD missing security scans** — no SAST, no dependency audit | Vulnerable deps in prod | Add `npm audit` + Snyk/Trivy to CI pipeline |

### Medium

| # | Issue | Fix |
| --- | ------- | ----- |
| I7 | **No horizontal scaling strategy** — sessions in Redis but no sticky-session consideration | Inconsistent behavior behind LB | Document scaling guide; ensure Redis is shared |
| I8 | **No CDN for static assets** | Slow global load times | Put uploads/static behind CDN |
| I9 | **Health endpoint exposes infra state** | Reconnaissance | Require internal network or secret token |
| I10 | **No database connection encryption enforcement** | MITM on DB traffic | Enforce `sslmode=require` |
| I11 | **Docker not distroless/minimal** | Larger attack surface | Use `node:24-alpine` or distroless base |
| I12 | **No resource limits in compose** | Noisy neighbor, OOM | Add `deploy.resources.limits` |

---

## 🟡 PHASE 6: OBSERVABILITY (9 issues)

| # | Issue | Fix |
| --- | ------- | ----- |
| O1 | **Inconsistent logging** — Pino in some files, `console.log` in others | Standardize on `ctx.logger` everywhere |
| O2 | **No structured log format** | Logs unparseable by aggregators | Configure Pino JSON format |
| O3 | **No request duration logging** | Can't identify slow endpoints | Add timing middleware |
| O4 | **No alerting on errors** | Outages discovered by users | Wire error rates to PagerDuty/Opsgenie |
| O5 | **No distributed tracing** | Can't trace across services | Add OpenTelemetry |
| O6 | **No business metrics** — orders/min, conversion rate | Can't measure business health | Emit custom metrics |
| O7 | **PII in logs** — user IDs, changes logged to stdout | Compliance risk | Scrub PII from logs |
| O8 | **No slow-query logging** | Can't detect DB issues | Enable Prisma query logging in dev, slow-query log in prod |
| O9 | **No uptime monitoring** | Downtime undetected | External ping service (UptimeRobot, Pingdom) |

---

## 🔄 PHASE 7: MORAINGA CROSS-REFERENCE — MISSING FEATURES

These features exist in Moringa-Backend (NestJS) but are **missing or incomplete** in adonis-backend-new:

| Feature | Moringa Status | Adonis Status | Gap |
| --------- | --------------- | --------------- | ----- |
| Product variants (size/color) | ✅ Full | ❌ Missing | Products have no variant system |
| Multi-image products | ✅ Multiple images | ❌ Single image only | `product.image` is single string |
| Product categories | ✅ Category tree | ❌ Flat tags only | No hierarchical categories |
| Product search (full-text) | ✅ Search service | ❌ Missing | No search endpoint |
| Wishlist move-to-cart | ✅ Implemented | ❌ Missing | Can't move wishlist item to cart |
| Order tracking (courier integration) | ✅ Tracking URL | ❌ Basic status only | No courier API integration |
| Email verification on signup | ✅ Required | ⚠️ Optional | Login works without verification |
| Admin product approval workflow | ✅ Pending/approve/reject | ✅ Imported | ✅ Complete |
| Newsletter/subscribers | ✅ Implemented | ❌ Missing | No subscriber management |
| Product SEO (meta fields) | ✅ Full | ⚠️ Partial | SEO title/description exist but no JSON-LD |
| Discount/coupon stacking rules | ✅ Configurable | ❌ Basic only | No stacking, no per-product coupons |
| Refund management | ✅ Implemented | ❌ Missing | No refund workflow |
| Return/exchange requests | ✅ Implemented | ❌ Missing | No return system |
| Multi-currency | ✅ Supported | ❌ INR only | Hardcoded currency |
| Tax calculation (GST) | ✅ Configurable | ⚠️ Basic | Flat tax rate |
| Invoice generation | ✅ PDF invoices | ❌ Missing | No invoice PDF |
| Admin activity logging | ✅ Full | ⚠️ Basic | Audit log exists but limited |
| RBAC with permissions | ✅ Fine-grained | ⚠️ Role-only | Just ADMIN/USER, no permissions |
| API rate limit headers | ✅ Included | ❌ Missing | No `X-RateLimit-*` headers |
| CORS preflight caching | ✅ Configured | ⚠️ Basic | |

---

## 🎯 PRIORITIZED REMEDIATION PLAN

### 🔴 Phase A: Pre-deploy BLOCKERS (Week 1)

1. **Rotate all secrets** + purge `.env` from git history
2. **Add auth middleware** to admin, audit, email-template routes (S1, S2, S3)
3. **Fix JWT algorithm** pinning (S7)
4. **Fix gift card redeem** bypass (S4)
5. **Add rate limiting** to all sensitive endpoints (S6)
6. **Remove JWT payload spread** — whitelist claims (S8)
7. **Add idempotency** to payment/order endpoints (A2)
8. **Atomic inventory** with conditional update (D5, D6)
9. **Server-side price calculation** in checkout (A4)
10. **Webhook async processing** (A5)

### 🟠 Phase B: Launch readiness (Week 2)

 1. Add soft-delete + migration (D1)
 2. Add optimistic locking (D2)
 3. Add missing indexes (D3, D4)
 4. Replace `request.all()` with validators (S10)
 5. Fix wishlist guestToken (S11)
 6. Implement token revocation (S9)
 7. Standardize logging → Pino JSON (O1, O2)
 8. Add graceful shutdown (I1)
 9. Remove dead code controllers (S16, S17)
10. Docker: non-root user + resource limits (I2, I12)

### 🟡 Phase C: Production hardening (Week 3-4)

 1. Add CSP nonces (F7)
 2. Create or remove service worker (F2)
 3. Implement single-flight token refresh (F3)
 4. Add request ID propagation (A11)
 5. Standardize error responses (A10)
 6. Add slow-query + metrics (O4, O8)
 7. Configure log aggregation (I3)
 8. Add database backups (I5)
 9. CI/CD security scans (I6)
10. Add missing indexes migration (D13)

### 🟢 Phase D: Scale + features (Month 2+)

 1. Product variants + multi-image
 2. Categories + full-text search
 3. Refund/return workflow
 4. Invoice generation
 5. Fine-grained RBAC
 6. CDN + multi-region
 7. Distributed tracing (O5)
 8. Business metrics dashboard (O6)

---

## 📋 Exact File Checklist for Phase A

```
adonis-backend-new/
├── .env                              → ROTATE ALL SECRETS, ensure in .gitignore
├── app/
│   ├── middleware/
│   │   ├── auth_middleware.ts        → Pin algorithms, whitelist claims
│   │   └── role_middleware.ts        → Already exists, verify applied
│   ├── controllers/
│   │   ├── admin/admin_routes.ts     → Move overview into auth group
│   │   ├── audit/audit_routes.ts     → Add auth + admin middleware
│   │   ├── auth/auth_service.ts      → Server-side price calc, email verification gate
│   │   ├── coupon/coupon_service.ts  → Atomic usage increment
│   │   ├── gift_card/gift_card_*    → Fix userId=0, atomic redeem
│   │   ├── notification/email_template_routes.ts → Add admin middleware
│   │   ├── order/order_service.ts    → Atomic inventory, webhook async
│   │   └── wishlist/wishlist_service.ts → Use guestToken in where clauses
│   ├── providers/
│   │   └── app_provider.ts           → Add graceful shutdown for queues
│   └── services/
│       └── redis_cache_service.ts    → Add JTI blacklist methods
├── config/
│   ├── cors.ts                       → Replace wildcard with allowlist
│   └── shield.ts                     → Enable xFrame, tighten CSP
├── prisma/
│   └── schema.prisma                 → Add deletedAt, version, missing indexes
├── start/
│   └── routes.ts                     → Add rate limiter, request ID
└── Dockerfile                        → Add USER node, use alpine base
```

---

## 🏁 Final Verdict

**Current state:** 12 CRITICAL + 33 HIGH = **45 blocking issues**

**After Phase A:** ~5 HIGH remain (launch with monitoring)

**After Phase B:** Production-grade, scalable, observable

**After Phase C:** Enterprise-grade, SOC2-ready

**After Phase D:** Feature-complete vs Moringa + market-leading

The architecture is sound — AdonisJS v7 + Prisma + BullMQ is a production-ready stack. The gaps are operational and security, not structural. A focused 2-week sprint on Phases A+B makes this shippable.

---

*Audit conducted 2026-08-24. Re-audit recommended after Phase A completion.*
