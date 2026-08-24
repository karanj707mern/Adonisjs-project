import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Admin routes: require authenticated admin user
  if (pathname.startsWith("/admin") || pathname === "/admin") {
    const cookieHeader = context.request.headers.get("cookie") || "";
    const hasAccessToken = cookieHeader.includes("accessToken=") || cookieHeader.includes("refreshToken=");

    if (!hasAccessToken) {
      return context.redirect("/auth?from=" + encodeURIComponent("/admin"));
    }

    try {
      const siteUrl = context.site?.toString() || "http://localhost:3000";
      const apiBase = `${siteUrl.replace(/\/$/, "")}/api/v1`;
      const profileRes = await fetch(`${apiBase}/auth/profile`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });

      if (!profileRes.ok) {
        return context.redirect("/auth?from=" + encodeURIComponent("/admin"));
      }

      const profile = await profileRes.json().catch(() => ({}));
      const user = profile?.user ?? {};

      if (user.role !== "ADMIN") {
        return context.redirect("/auth?from=" + encodeURIComponent("/admin"));
      }

      context.locals = context.locals || {};
      context.locals.session = { user };
    } catch {
      return context.redirect("/auth?from=" + encodeURIComponent("/admin"));
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);

  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: ws: wss:",
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
