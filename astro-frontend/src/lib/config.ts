const CLOUDINARY_CLOUD_NAME =
  typeof window === "undefined"
    ? ""
    : import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "";

function getServerApiBaseUrl(): string {
  const explicit = import.meta.env.PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit;

  const siteUrl = import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) {
    return `${siteUrl}/api/v1`;
  }

  return "http://localhost:5000/api/v1";
}

function getClientApiBaseUrl(): string {
  const explicit = import.meta.env.PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit;

  if (
    import.meta.env.DEV ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")
  ) {
    return "http://localhost:5000/api/v1";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/v1`;
  }

  return getServerApiBaseUrl();
}

export function getSiteUrl(): string {
  return (
    import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export const API_BASE_URL =
  typeof window !== "undefined" ? getClientApiBaseUrl() : getServerApiBaseUrl();

export const ASSET_BASE_URL =
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME !== "your-cloud-name"
    ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`
    : API_BASE_URL.replace(/\/api\/v\d+\/?$/, "") ||
      import.meta.env.PUBLIC_API_BASE_URL?.replace(/\/api\/v\d+\/?$/, "") ||
      "http://localhost:5000";

export const SOCKET_BASE_URL = ASSET_BASE_URL;

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='1' height='1' fill='none'/></svg>";

export function resolveImageUrl(value: unknown): string {
  if (typeof value !== "string") {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return PLACEHOLDER_IMAGE;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return new URL(trimmed, ASSET_BASE_URL).toString();
}

function validateEnv() {
  const isDev = import.meta.env.DEV;
  const apiBase = (import.meta.env.PUBLIC_API_BASE_URL || "").trim();
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || "").trim();
  const cloudinary = (
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  ).trim();

  if (!isDev && !apiBase && !siteUrl) {
    console.warn(
      "[config] PUBLIC_API_BASE_URL or PUBLIC_SITE_URL is not set. " +
        "The app will fall back to localhost URLs in production, which will break API calls. " +
        "Set one of these environment variables.",
    );
  }

  if (cloudinary && cloudinary === "your-cloud-name") {
    console.warn(
      "[config] PUBLIC_CLOUDINARY_CLOUD_NAME is set to the placeholder value 'your-cloud-name'. " +
        "Image URLs will not resolve correctly.",
    );
  }
}

validateEnv();
