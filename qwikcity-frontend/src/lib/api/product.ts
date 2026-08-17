import { apiRequest } from "./http";

export function getProducts() {
  return apiRequest("/products");
}

export function getAdminProducts() {
  return apiRequest("/products/admin/all");
}

export function getNewArrivals() {
  return apiRequest("/products/new-arrivals");
}

export function getProduct(productId: string | number) {
  return apiRequest(`/products/${productId}`);
}

export function createProduct(product: Record<string, unknown>) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(
  productId: string | number,
  product: Record<string, unknown>,
) {
  return apiRequest(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export function deleteProduct(productId: string | number) {
  return apiRequest(`/products/${productId}`, {
    method: "DELETE",
  });
}

export function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest("/products/upload-image", {
    method: "POST",
    body: formData,
  });
}
