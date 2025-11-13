export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    let message = response.statusText || "Request failed";

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson?.message) {
        message = errorJson.message;
      }
    } catch {
      // ignore parse error
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function apiMutation<T>(
  url: string,
  method: HttpMethod,
  body?: unknown,
) {
  return apiFetch<T>(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

