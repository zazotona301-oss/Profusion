const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/clinic";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "تعذر الاتصال بخدمة العيادة");
  return payload;
}

export const clinicApi = {
  health: () => request("/"),
  list: (resource, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/${resource}${query ? `?${query}` : ""}`);
  },
  get: (resource, id) => request(`/${resource}?id=${encodeURIComponent(id)}`),
  create: (resource, payload) => request(`/${resource}`, { method: "POST", body: JSON.stringify(payload) }),
  update: (resource, id, payload) => request(`/${resource}?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (resource, id) => request(`/${resource}?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export default clinicApi;
