const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(endpoint, {
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
