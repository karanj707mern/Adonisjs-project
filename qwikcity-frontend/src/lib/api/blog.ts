import { apiRequest } from "./http";

// Note: Backend routes use /Blog prefix (capital B) per Adonis conventions
const BLOG_PREFIX = "/Blog/blog";

export function getBlogPosts() {
  return apiRequest("/Blog");
}

export function getBlogPost(slug: string) {
  return apiRequest(`/Blog/${encodeURIComponent(slug)}`);
}

export function getAllBlogPosts() {
  return apiRequest(`${BLOG_PREFIX}/admin/all`);
}

export function createBlogPost(post: Record<string, unknown>) {
  return apiRequest(BLOG_PREFIX, {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export function updateBlogPost(
  id: string | number,
  post: Record<string, unknown>,
) {
  return apiRequest(`${BLOG_PREFIX}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(post),
  });
}

export function deleteBlogPost(id: string | number) {
  return apiRequest(`${BLOG_PREFIX}/${id}`, {
    method: "DELETE",
  });
}

export function uploadBlogImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest(`${BLOG_PREFIX}/upload-image`, {
    method: "POST",
    body: formData,
  });
}
