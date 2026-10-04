const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      }`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function getHealth() {
  return apiFetch("/api/health");
}

export { API_URL };