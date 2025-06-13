// app/api/session/google/route.ts
import { cookies } from 'next/headers';
import { adminAuth, adminDB } from '@/lib/firebase/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDB.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      const { email, name, picture } = decoded;
      const [firstName, ...rest] = (name || '').split(' ');
      const lastName = rest.join(' ');

      await adminDB.collection('users').doc(uid).set({
        uid,
        email: email || '',
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber: '',
        photoURL: picture || '',
        createdAt: Date.now(),
      });
    }

    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn: 60 * 60 * 24 * 5 * 1000 });

    const cookieStore = await cookies(); // await here
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 5,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
