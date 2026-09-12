const KEY = "octava-instance";
const RE = /^ins_[a-z0-9]{8,32}$/;

const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function mint(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-6);
  return `ins_${rand}${time}`.toLowerCase().slice(0, 22);
}

export function isInstanceId(raw: string): boolean {
  return RE.test(raw.trim().toLowerCase());
}

export function getInstanceId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    const stored = (localStorage.getItem(KEY) || "").trim().toLowerCase();
    if (RE.test(stored)) return stored;
    const next = mint();
    localStorage.setItem(KEY, next);
    return next;
  } catch {
    return "anon";
  }
}

export function instanceLabel(id = getInstanceId()): string {
  const tail = id.replace(/^ins_/, "");
  return tail.slice(-4);
}

export function setInstanceId(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!RE.test(id)) throw new Error("Некорректный код инстанса");
  localStorage.setItem(KEY, id);
  emit();
  return id;
}

export function rotateInstanceId(): string {
  const id = mint();
  localStorage.setItem(KEY, id);
  emit();
  return id;
}

export function subscribeInstance(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function instanceHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set("x-octava-instance", getInstanceId());
  return headers;
}
