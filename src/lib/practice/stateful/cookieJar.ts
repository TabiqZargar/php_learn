/**
 * Minimal typed cookie-jar model for stateful practice sessions (Phase 9A).
 *
 * This jar is server-side state holding the cookies PHP told us to store. It
 * is NOT the browser cookie jar and it is never shipped to the client — only
 * the count of changed cookies is surfaced so learners see the educational
 * side-effect without seeing encoded ids.
 *
 * All functions are pure so the jar logic is unit-testable without PHP.
 */

export interface CookieEntry {
  name: string;
  value: string;
  /** Cookie scope; requests are matched against it before sending. */
  path: string;
}

/** Jar keys on name + path so the same name can coexist on different scopes. */
export type CookieJar = Map<string, CookieEntry>;

export interface ParsedSetCookie {
  name: string;
  value: string;
  path: string;
  /** Absolute expiry in epoch ms; undefined for session-scoped cookies. */
  expiresAt?: number;
}

function key(name: string, path: string): string {
  return `${name}\u0000${path}`;
}

const ATTRIBUTE_VALUE_RE = /^"((?:\\.|[^"])*)"$/;

/**
 * Parse one raw Set-Cookie header value (the part after the header name).
 * Returns null when the header is malformed or carries no name.
 */
export function parseSetCookieHeader(
  header: string,
  nowMs: number,
): ParsedSetCookie | null {
  if (!header) return null;
  const parts = header.split(";");
  const first = parts[0] ?? "";
  const equals = first.indexOf("=");
  if (equals <= 0) return null;

  const name = first.slice(0, equals).trim();
  const rawValue = first.slice(equals + 1).trim();
  const quotedValue = ATTRIBUTE_VALUE_RE.exec(rawValue);
  const value = quotedValue ? quotedValue[1] : rawValue;
  let path = "/";
  let expiresAt: number | undefined;
  let maxAgeMs: number | undefined;

  for (const raw of parts.slice(1)) {
    const attr = raw.trim();
    const sep = attr.indexOf("=");
    const attributeName = (sep >= 0 ? attr.slice(0, sep) : attr).trim().toLowerCase();
    let attributeValue = sep >= 0 ? attr.slice(sep + 1).trim() : "";
    const quoted = ATTRIBUTE_VALUE_RE.exec(attributeValue);
    if (quoted) attributeValue = quoted[1];

    if (attributeName === "path" && attributeValue) {
      path = attributeValue;
    } else if (attributeName === "expires" && attributeValue) {
      const ts = Date.parse(attributeValue);
      if (!Number.isNaN(ts)) expiresAt = ts;
    } else if (attributeName === "max-age" && attributeValue) {
      const seconds = Number(attributeValue);
      if (Number.isFinite(seconds)) maxAgeMs = nowMs + seconds * 1000;
    }
  }

  // RFC 6265: when both are present Max-Age wins over the wall-clock Expires.
  if (maxAgeMs !== undefined) expiresAt = maxAgeMs;

  return { name, value, path, expiresAt };
}

/**
 * Apply a list of Set-Cookie headers, returning a NEW jar. Cookies whose
 * value is empty or whose expiry is already in the past are removed. When
 * multiple headers target the same key the last one wins.
 */
export function applySetCookies(
  jar: CookieJar,
  setCookieHeaders: readonly string[],
  nowMs: number,
): CookieJar {
  const next = new Map(jar);
  for (const header of setCookieHeaders) {
    const parsed = parseSetCookieHeader(header, nowMs);
    if (!parsed) continue;
    const k = key(parsed.name, parsed.path);
    const expired =
      parsed.value === "" ||
      (parsed.expiresAt !== undefined && parsed.expiresAt <= nowMs);
    if (expired) {
      next.delete(k);
    } else {
      next.set(k, { name: parsed.name, value: parsed.value, path: parsed.path });
    }
  }
  return next;
}

/**
 * Build the Cookie request header value for a target path. Only cookies that
 * scope to the path (or apply site-wide) are included.
 */
export function cookieHeaderForPath(jar: CookieJar, path: string): string {
  const parts: string[] = [];
  for (const entry of jar.values()) {
    if (entry.path === "/" || entry.path === "" || path.startsWith(entry.path)) {
      parts.push(`${entry.name}=${entry.value}`);
    }
  }
  return parts.join("; ");
}

/** Flatten the jar to name -> value (last entry wins per name). */
export function jarToRecord(jar: CookieJar): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of jar.values()) {
    record[entry.name] = entry.value;
  }
  return record;
}

/**
 * Names that differ between two jars (added, removed or value-changed).
 * Used to count "cookies updated" side-effects for the learner UI.
 */
export function changedCookieNames(prev: CookieJar, next: CookieJar): string[] {
  const byName = (jar: CookieJar): Map<string, string> => {
    const map = new Map<string, string>();
    for (const entry of jar.values()) map.set(entry.name, entry.value);
    return map;
  };
  const before = byName(prev);
  const after = byName(next);
  const names = new Set([...before.keys(), ...after.keys()]);
  const changed: string[] = [];
  for (const name of names) {
    if (before.get(name) !== after.get(name)) changed.push(name);
  }
  return changed;
}

/** True when the client-visible jar (session cookie excluded) changed. */
export function changedClientCookieCount(
  prev: CookieJar,
  next: CookieJar,
  sessionCookieName: string,
): number {
  return changedCookieNames(prev, next).filter(
    (name) => name !== sessionCookieName,
  ).length;
}