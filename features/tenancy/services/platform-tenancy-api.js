async function csrfToken() {
  const response = await fetch("/api/platform/auth/csrf-token", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to initialize the secure platform session.");
  const payload = await response.json();
  if (!payload.token) throw new Error("The secure platform session did not return a CSRF token.");
  return payload.token;
}

async function mutate(path, method, body, retried = false) {
  const token = await csrfToken();
  const response = await fetch(path, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": token,
    },
    body: JSON.stringify(body),
  });
  if (response.status === 419 && !retried) return mutate(path, method, body, true);

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "Request failed.");
    error.status = response.status;
    error.errors = payload.errors || {};
    throw error;
  }
  return payload;
}

export const platformTenancyApi = {
  createMerchant: (data) => mutate("/api/platform/management/merchants", "POST", data),
  resendMerchantInvitation: (merchantId) => mutate(
    `/api/platform/management/merchants/${merchantId}/invitation`,
    "POST",
  ),
  updateMerchantOrganizationAccess: (merchantId, organizationId, role) => mutate(
    `/api/platform/management/merchants/${merchantId}/organizations/${organizationId}`,
    "PUT",
    { role },
  ),
  removeMerchantOrganizationAccess: (merchantId, organizationId) => mutate(
    `/api/platform/management/merchants/${merchantId}/organizations/${organizationId}`,
    "DELETE",
  ),
  updateMerchantStoreAccess: (merchantId, storeId, role) => mutate(
    `/api/platform/management/merchants/${merchantId}/stores/${storeId}`,
    "PUT",
    { role },
  ),
  removeMerchantStoreAccess: (merchantId, storeId) => mutate(
    `/api/platform/management/merchants/${merchantId}/stores/${storeId}`,
    "DELETE",
  ),
  createOrganization: (data) => mutate("/api/platform/management/organizations", "POST", data),
  createStore: (data) => mutate("/api/platform/management/stores", "POST", data),
  updateStoreStatus: (storeId, status) => mutate(
    `/api/platform/management/stores/${storeId}/status`,
    "PATCH",
    { status },
  ),
  updateMerchantStatus: (merchantId, status) => mutate(
    `/api/platform/management/merchants/${merchantId}/status`,
    "PATCH",
    { status },
  ),
};
