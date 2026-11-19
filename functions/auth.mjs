// Password, session and login-throttle helpers for the Atlas prototype.
// Passwords are never stored or logged in clear text.

export const PBKDF2_ITERATIONS = 600000;
const KEY_BITS = 256;
const SALT_BYTES = 16;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const encoder = new TextEncoder();

export class AppError extends Error {
  constructor(code, status = 400, extra = {}) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

export const fail = (code, status) => { throw new AppError(code, status); };

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password, salt, iterations) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, KEY_BITS);
  return new Uint8Array(bits);
}

export async function hashPassword(password, saltB64 = null) {
  const salt = saltB64 ? fromBase64(saltB64) : crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, PBKDF2_ITERATIONS);
  return { salt: toBase64(salt), hash: toBase64(derived), iterations: PBKDF2_ITERATIONS };
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Unknown logins still pay the derivation cost so timing does not reveal accounts.
const DUMMY_SALT = new Uint8Array(SALT_BYTES);
const DUMMY_HASH = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export async function verifyPassword(password, record) {
  let salt;
  try { salt = fromBase64(record?.salt ?? ''); } catch { salt = DUMMY_SALT; }
  const iterations = Number.isSafeInteger(record?.iterations) ? record.iterations : PBKDF2_ITERATIONS;
  const derived = toBase64(await derive(password, salt, iterations));
  return safeEqual(derived, record?.hash ?? DUMMY_HASH);
}

export async function burnPasswordCycle(password) {
  const derived = toBase64(await derive(password, DUMMY_SALT, PBKDF2_ITERATIONS));
  safeEqual(derived, DUMMY_HASH);
  return false;
}

export function sessionCookieName(request) {
  let secure = true;
  try { secure = new URL(request.url).protocol === 'https:'; } catch { secure = true; }
  return secure ? '__Host-atlas.session' : 'atlas.session';
}

export function sessionCookie(request, token, maxAgeSeconds) {
  const secure = sessionCookieName(request).startsWith('__Host-');
  return `${sessionCookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(request) {
  const secure = sessionCookieName(request).startsWith('__Host-');
  return `${sessionCookieName(request)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

function tokenFrom(request) {
  const header = request.headers.get('cookie') ?? '';
  if (!header) return null;
  if (header.length > 8192) fail('invalid_credentials', 400);
  const name = sessionCookieName(request);
  const values = [];
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const at = trimmed.indexOf('=');
    if (at < 1) continue;
    if (trimmed.slice(0, at).trim() === name) values.push(trimmed.slice(at + 1));
  }
  if (values.length === 0) return null;
  if (values.length > 1) fail('invalid_credentials', 400);
  if (!/^[A-Za-z0-9_-]{43}$/.test(values[0])) fail('invalid_credentials', 400);
  return values[0];
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createSession(store, subject, now) {
  const token = newSessionToken();
  const digest = await sha256Hex(token);
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
  await store.createSession({
    token_digest: digest,
    subject_type: subject.type,
    subject_id: subject.id,
    created_at: new Date(now).toISOString(),
    expires_at: expiresAt,
    revoked_at: null,
  });
  return { token, digest, expiresAt, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function currentSession(store, request, now) {
  const token = tokenFrom(request);
  if (!token) return null;
  const digest = await sha256Hex(token);
  const row = await store.findSession(digest);
  if (!row || row.token_digest !== digest || row.revoked_at) return null;
  const expires = Date.parse(row.expires_at);
  if (!Number.isFinite(expires) || expires <= now) return null;
  return { digest, subjectType: row.subject_type, subjectId: row.subject_id, expiresAt: expires };
}

// Fixed-window login throttle persisted in the database.
export const LOGIN_LIMIT = { maxAttempts: 10, windowMs: 15 * 60 * 1000 };

export async function consumeLoginAttempt(store, login, now) {
  const key = `login:${login}`;
  const max = LOGIN_LIMIT.maxAttempts;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await store.getLimiter(key);
    if (!row) {
      const inserted = await store.insertLimiter({ key, window_started_at: new Date(now).toISOString(), attempt_count: 1 });
      if (inserted) return;
      continue;
    }
    const startedAt = Date.parse(row.window_started_at);
    const count = Number(row.attempt_count);
    if (!Number.isFinite(startedAt) || !Number.isSafeInteger(count)) fail('login_unavailable', 503);
    if (now - startedAt >= LOGIN_LIMIT.windowMs) {
      const reset = await store.updateLimiter(key, row.window_started_at, {
        window_started_at: new Date(now).toISOString(),
        attempt_count: 1,
      });
      if (reset) return;
      continue;
    }
    if (count >= max) {
      const retryAfter = Math.max(1, Math.ceil((startedAt + LOGIN_LIMIT.windowMs - now) / 1000));
      throw new AppError('rate_limited', 429, { retryAfter });
    }
    const incremented = await store.updateLimiter(key, row.window_started_at, { attempt_count: count + 1 });
    if (incremented) return;
  }
  fail('login_unavailable', 503);
}

export const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
