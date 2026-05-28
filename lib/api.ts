export async function fetchApi<T>(
  endpoint: string,
  wrappedByKey?: string,
): Promise<T> {
  let path = endpoint;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  let apiUrl = process.env.RUST_API_URL ?? "http://localhost:8080";
  if (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }

  const url = new URL(`${apiUrl}/${path}`);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `fetchApi: ${res.status} ${res.statusText} for ${url.toString()}`,
    );
  }

  const raw: unknown = await res.json();

  if (wrappedByKey) {
    if (
      raw === null ||
      typeof raw !== "object" ||
      !(wrappedByKey in (raw as Record<string, unknown>))
    ) {
      throw new Error(
        `fetchApi: response missing key '${wrappedByKey}' for ${url.toString()}`,
      );
    }
    return (raw as Record<string, unknown>)[wrappedByKey] as T;
  }

  return raw as T;
}

export default fetchApi;
