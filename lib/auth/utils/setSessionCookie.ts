// lib/auth/utils/setSessionCookie.ts
import { adminAuth } from '@/lib/firebase/firebaseAdmin';
import { serialize } from 'cookie';

export async function setSessionCookie(idToken: string, res: any) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  const cookie = serialize('session', sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });

  res.headers.append('Set-Cookie', cookie);
}
