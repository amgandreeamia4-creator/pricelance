export interface ApiError extends Error {
  status?: number;
}

async function parseJsonSafely<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw Object.assign(new Error("Invalid JSON response"), {
      status: res.status,
    }) as ApiError;
  }
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = Object.assign(new Error(`Request failed: ${res.status}`), {
      status: res.status,
    }) as ApiError;
    throw err;
  }

  return parseJsonSafely<T>(res);
}

export async function postJson<TResponse, TBody = unknown>(
  url: string,
  body: TBody,
  init?: RequestInit
): Promise<TResponse> {
  const res = await fetch(url, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = Object.assign(new Error(`Request failed: ${res.status}`), {
      status: res.status,
    }) as ApiError;
    throw err;
  }

  return parseJsonSafely<TResponse>(res);
}
