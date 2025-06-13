import { adminDB, adminAuth } from '@/lib/firebase/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
// import { adminDb, adminAuth } from '@/firebase/admin'; // or wherever your Firebase Admin SDK is initialized

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { email, password, firstName, lastName, phoneNumber, idToken } = body;
  
      // console.log("📦 Received signup body:", body);
  
      if (idToken) {
        // 🔐 Google Sign-In flow
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
  
        const userDoc = await adminDB.collection('users').doc(uid).get();

        console.log("user doc is", userDoc);
  
        if (userDoc.exists) {
          return NextResponse.json({ message: 'User already exists in Firestore' }, { status: 200 });
        }
  
        await adminDB.collection('users').doc(uid).set({
          firstName,
          lastName,
          email: decodedToken.email,
          phoneNumber: phoneNumber || '',
          photoURL: '',
          uid,
          createdAt: new Date().toISOString(),
          provider: 'password',
        });
  
        return NextResponse.json({ message: 'Google user added to Firestore' }, { status: 200 });
  
      } else {
        // 🔑 Email/password sign-up
        try {
          await adminAuth.getUserByEmail(email);
          return NextResponse.json({ error: 'User already exists in Auth' }, { status: 400 });
        } catch (authError: any) {
          if (authError.code !== 'auth/user-not-found') {
            throw authError;
          }
        }

        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
          phoneNumber,
          photoURL: '',
        });
  
        await adminDB.collection('users').doc(userRecord.uid).set({
          firstName,
          lastName,
          email,
          phoneNumber,
          uid: userRecord.uid,
          photoURL: '',
          createdAt: new Date().toISOString(),
          provider: 'password',
        });
  
        return NextResponse.json({ message: 'Password user created successfully' }, { status: 200 });
      }
    } catch (error: any) {
      console.error('🔥 Signup error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  