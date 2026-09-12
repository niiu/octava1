import { AsyncLocalStorage } from "node:async_hooks";

const RE = /^ins_[a-z0-9]{8,32}$/;
export const ANON_INSTANCE = "anon";

const als = new AsyncLocalStorage<string>();

export function normalizeInstanceId(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (RE.test(value)) return value;
  return ANON_INSTANCE;
}

export function instanceFromRequest(request: Request, extra?: unknown): string {
  const header = request.headers.get("x-octava-instance");
  if (header && RE.test(header.trim().toLowerCase())) {
    return header.trim().toLowerCase();
  }
  try {
    const query = new URL(request.url).searchParams.get("instance");
    if (query && RE.test(query.trim().toLowerCase())) {
      return query.trim().toLowerCase();
    }
  } catch {
    /* ignore */
  }
  return normalizeInstanceId(extra);
}

export function runWithInstance<T>(id: string, fn: () => T): T {
  return als.run(normalizeInstanceId(id), fn);
}

export function currentInstance(): string {
  return als.getStore() || ANON_INSTANCE;
}
