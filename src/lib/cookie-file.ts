const NETSCAPE_HEADER = "# Netscape HTTP Cookie File\n";

type JsonCookie = {
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  hostOnly?: boolean;
  session?: boolean;
  expirationDate?: number;
  expires?: number | string;
};

export function cookieCountLabel(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} запись`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} записи`;
  return `${n} записей`;
}

export function isLikelyCookieFile(raw: string): boolean {
  const text = stripBom(raw).trim();
  if (!text) return false;
  if (looksLikeJson(text)) {
    try {
      return jsonCookies(text).length > 0;
    } catch {
      return false;
    }
  }
  if (/#\s*(Netscape )?HTTP Cookie File/i.test(text)) return true;
  return netscapeRowCount(text) > 0;
}

export function countCookieRows(raw: string): number {
  const text = stripBom(raw).trim();
  if (!text) return 0;
  if (looksLikeJson(text)) {
    try {
      return jsonCookies(text).length;
    } catch {
      return 0;
    }
  }
  return netscapeRowCount(text);
}

export function normalizeCookieFile(raw: string): string {
  const text = stripBom(raw).trim();
  if (!text) {
    throw new Error("Пустой файл cookies");
  }
  if (looksLikeJson(text)) {
    const cookies = jsonCookies(text);
    if (cookies.length === 0) {
      throw new Error("В файле нет cookie-записей");
    }
    const body = cookies.map(toNetscapeLine).join("\n");
    return slimNetscape(`${NETSCAPE_HEADER}${body}\n`);
  }
  if (netscapeRowCount(text) === 0) {
    throw new Error(
      "Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.",
    );
  }
  if (/#\s*(Netscape )?HTTP Cookie File/i.test(text)) {
    return slimNetscape(text.endsWith("\n") ? text : `${text}\n`);
  }
  return slimNetscape(
    `${NETSCAPE_HEADER}${text}${text.endsWith("\n") ? "" : "\n"}`,
  );
}

function stripBom(raw: string): string {
  return raw.replace(/^\uFEFF/, "");
}

function looksLikeJson(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("[") || t.startsWith("{");
}

function netscapeRowCount(text: string): number {
  let n = 0;
  for (const line of text.split(/\r?\n/)) {
    if (isNetscapeRow(line)) n += 1;
  }
  return n;
}

function isNetscapeRow(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const payload = t.startsWith("#HttpOnly_") ? t.slice("#HttpOnly_".length) : t;
  if (payload.startsWith("#")) return false;
  return payload.split("\t").length >= 7;
}

const AUTH_COOKIE_NAMES = new Set([
  "SID",
  "HSID",
  "SSID",
  "APISID",
  "SAPISID",
  "SIDCC",
  "LOGIN_INFO",
  "PREF",
  "YSC",
  "CONSENT",
  "SOCS",
  "VISITOR_INFO1_LIVE",
  "VISITOR_PRIVACY_METADATA",
  "__Secure-1PSID",
  "__Secure-3PSID",
  "__Secure-1PAPISID",
  "__Secure-3PAPISID",
  "__Secure-1PSIDTS",
  "__Secure-3PSIDTS",
  "__Secure-1PSIDCC",
  "__Secure-3PSIDCC",
  "__Secure-YENID",
  "__Secure-YNID",
  "__Secure-BUCKET",
  "__Secure-ROLLOUT_TOKEN",
]);

function keepYoutubeCookie(name: string, value: string): boolean {
  if (!name || name.startsWith("ST-")) return false;
  if (value.length > 12_000) return false;
  if (AUTH_COOKIE_NAMES.has(name)) return true;
  return name.startsWith("__Secure-") && /PSID|PAPISID|YNID|YENID/.test(name);
}

function slimNetscape(raw: string): string {
  const kept: string[] = ["# Netscape HTTP Cookie File"];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const httpOnly = t.startsWith("#HttpOnly_");
    const payload = httpOnly ? t.slice("#HttpOnly_".length) : t;
    if (payload.startsWith("#")) continue;
    const parts = payload.split("\t");
    if (parts.length < 7) continue;
    const name = parts[5] ?? "";
    const value = parts.slice(6).join("\t");
    if (!keepYoutubeCookie(name, value)) continue;
    const row = `${parts[0]}\t${parts[1]}\t${parts[2]}\t${parts[3]}\t${parts[4]}\t${name}\t${value}`;
    kept.push(httpOnly ? `#HttpOnly_${row}` : row);
  }
  if (kept.length === 1) {
    throw new Error(
      "В файле нет cookies входа на YouTube (SID / LOGIN_INFO). Экспортируйте cookies.txt, будучи авторизованы.",
    );
  }
  return `${kept.join("\n")}\n`;
}

function jsonCookies(text: string): JsonCookie[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.",
    );
  }
  const list = cookieArray(parsed);
  if (!list) {
    throw new Error(
      "Не похоже на cookies.txt. Вставьте Netscape-файл или JSON экспорта.",
    );
  }
  return list.filter(isCookieRecord);
}

function cookieArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const rec = parsed as Record<string, unknown>;
    if (Array.isArray(rec.cookies)) return rec.cookies;
  }
  return null;
}

function isCookieRecord(item: unknown): item is JsonCookie {
  if (!item || typeof item !== "object") return false;
  const c = item as JsonCookie;
  return Boolean(
    typeof c.name === "string" &&
      c.name.length > 0 &&
      typeof c.value === "string" &&
      typeof c.domain === "string" &&
      c.domain.length > 0,
  );
}

function toNetscapeLine(c: JsonCookie): string {
  let domain = String(c.domain ?? "");
  const hostOnly = c.hostOnly === true;
  if (hostOnly) domain = domain.replace(/^\./, "");
  else if (!domain.startsWith(".") && domain.includes(".")) {
    domain = `.${domain}`;
  }
  const flag = hostOnly || !domain.startsWith(".") ? "FALSE" : "TRUE";
  const path = c.path || "/";
  const secure = c.secure ? "TRUE" : "FALSE";
  const exp = expiryUnix(c);
  const name = String(c.name ?? "");
  const value = String(c.value ?? "").replace(/[\r\n\t]/g, "");
  const prefix = c.httpOnly ? "#HttpOnly_" : "";
  return `${prefix}${domain}\t${flag}\t${path}\t${secure}\t${exp}\t${name}\t${value}`;
}

function expiryUnix(c: JsonCookie): number {
  if (c.session) return 0;
  const raw =
    typeof c.expirationDate === "number"
      ? c.expirationDate
      : typeof c.expires === "number"
        ? c.expires
        : typeof c.expires === "string" && /^\d+(\.\d+)?$/.test(c.expires)
          ? Number(c.expires)
          : 0;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 1e12 ? Math.round(raw / 1000) : Math.round(raw);
}
