import type { Response } from 'express';

export const SESSION_COOKIE = 'sid';

interface CookieOptions {
  secure: boolean;
}

/** Sets the signed, httpOnly session cookie. */
export function setSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
  { secure }: CookieOptions,
): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    signed: true,
    expires: expiresAt,
    path: '/',
  });
}

export function clearSessionCookie(response: Response, { secure }: CookieOptions): void {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    signed: true,
    path: '/',
  });
}
