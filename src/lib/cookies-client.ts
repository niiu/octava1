import { normalizeCookieFile } from "./cookie-file";

const CONSENT_KEY = "octava-yt-cookies-consent";
const COOKIES_KEY = "octava-yt-cookies";

export function loadCookieConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveCookieConsent(ok: boolean): void {
  try {
    if (ok) localStorage.setItem(CONSENT_KEY, "1");
    else localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
}

export function loadStoredCookies(): string {
  try {
    return localStorage.getItem(COOKIES_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveStoredCookies(raw: string): void {
  try {
    const text = raw.trim();
    if (!text) {
      localStorage.removeItem(COOKIES_KEY);
      return;
    }
    let stored = text;
    try {
      stored = normalizeCookieFile(text);
    } catch {
      /* keep raw if it isn't a full netscape dump */
    }
    localStorage.setItem(COOKIES_KEY, stored);
  } catch {
    /* ignore */
  }
}

export function clearStoredCookies(): void {
  try {
    localStorage.removeItem(COOKIES_KEY);
  } catch {
    /* ignore */
  }
}

export function cookiePayload(field: string): string | undefined {
  const raw = (field.trim() || loadStoredCookies()).trim();
  if (!raw) return undefined;
  try {
    return normalizeCookieFile(raw);
  } catch {
    return raw;
  }
}
