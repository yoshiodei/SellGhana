import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/lib/firebase/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, phoneNumber, uid } = body;

    const userDoc = await adminDB.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      await adminDB.collection('users').doc(uid).set({
        email,
        firstName,
        lastName,
        phoneNumber,
        uid,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ message: 'User session created or already exists' });
  } catch (err: any) {
    console.error('🔥 Google sign-in session error:', err.message || err);
    return NextResponse.json({ error: 'Failed to sign in user' }, { status: 500 });
  }
}
