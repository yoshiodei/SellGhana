import { adminAuth, adminDB } from '@/lib/firebase/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, firstName, lastName, phone: phoneNumber } = body;

  if (!email || !password || !firstName || !lastName || !phoneNumber) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  try {
    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.error('🔥 getUserByEmail error:', error.message);
        return NextResponse.json({ message: 'Error checking user existence' }, { status: 500 });
      }
    }

    // Format phone number to E.164
    const getE164NumberFormat = (num: string) => {
      let raw = num.trim();
      if (raw.startsWith('0')) raw = raw.slice(1);
      return '+233' + raw;
    };

    const formattedPhone = getE164NumberFormat(phoneNumber);

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: formattedPhone,
      emailVerified: false,
    });

    // Save user data in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      phoneNumber,
      displayName: userRecord.displayName,
      emailVerified: false,
      photoURL: userRecord.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wishlist: [],
    };

    await adminDB.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

  } catch (err: any) {
    console.error('🔥 Signup error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}