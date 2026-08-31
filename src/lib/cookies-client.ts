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
    if (text) localStorage.setItem(COOKIES_KEY, text);
    else localStorage.removeItem(COOKIES_KEY);
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
  const fromField = field.trim();
  if (fromField) return fromField;
  const stored = loadStoredCookies().trim();
  return stored || undefined;
}
