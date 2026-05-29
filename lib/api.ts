import { z } from "zod";

export interface FetchApiOptions<T> {
  wrappedByKey?: string;
  schema?: z.ZodType<T>;
}

/**
 * Fetches a JSON response from the Rust API.
 *
 * Pass an options object with `schema` (a Zod schema) to validate the parsed
 * response at runtime. When the schema rejects the payload, this function
 * throws an Error with a stable prefix; callers' existing try/catch branches
 * fall through to their offline UI just as they do for network errors.
 *
 * The legacy signature `fetchApi(endpoint, wrappedByKey)` is still accepted
 * for backwards compatibility, but new callers should pass a schema — without
 * it, the response is returned via an unchecked cast.
 */
export async function fetchApi<T>(
  endpoint: string,
  optionsOrKey?: FetchApiOptions<T> | string,
): Promise<T> {
  const options: FetchApiOptions<T> =
    typeof optionsOrKey === "string"
      ? { wrappedByKey: optionsOrKey }
      : (optionsOrKey ?? {});

  let path = endpoint;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  let apiUrl = process.env.RUST_API_URL ?? "http://localhost:8080";
  if (apiUrl.endsWith("/")) {
    apiUrl = apiUrl.slice(0, -1);
  }

  const url = new URL(`${apiUrl}/${path}`);

  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    // Path only — never request bodies, tokens, cookies or auth headers.
    console.log(`[rust-api] GET /${path} failed after ${ms}ms`);
    throw error;
  }
  const ms = Math.round(performance.now() - start);
  console.log(`[rust-api] GET /${path} ${ms}ms`);
  if (!res.ok) {
    throw new Error(
      `fetchApi: ${res.status} ${res.statusText} for ${url.toString()}`,
    );
  }

  const raw: unknown = await res.json();

  let candidate: unknown = raw;
  if (options.wrappedByKey) {
    if (
      raw === null ||
      typeof raw !== "object" ||
      !(options.wrappedByKey in (raw as Record<string, unknown>))
    ) {
      throw new Error(
        `fetchApi: response missing key '${options.wrappedByKey}' for ${url.toString()}`,
      );
    }
    candidate = (raw as Record<string, unknown>)[options.wrappedByKey];
  }

  if (options.schema) {
    const result = options.schema.safeParse(candidate);
    if (!result.success) {
      throw new Error(
        `fetchApi: schema validation failed for ${url.toString()}: ${result.error.message}`,
      );
    }
    return result.data;
  }

  return candidate as T;
}

export default fetchApi;
